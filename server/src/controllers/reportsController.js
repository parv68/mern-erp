const pool = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Get system-wide metrics for admin dashboard
exports.getAdminMetrics = async (req, res) => {
  try {
    const metrics = await pool.query(
      `SELECT * FROM report_metrics 
       WHERE category = 'admin' 
       AND period_end >= NOW() - INTERVAL '30 days'`
    );

    res.json({
      totalStudents: metrics.rows.find(m => m.metric_name === 'total_students')?.metric_value || 0,
      totalTeachers: metrics.rows.find(m => m.metric_name === 'total_teachers')?.metric_value || 0,
      totalRevenue: metrics.rows.find(m => m.metric_name === 'total_revenue')?.metric_value || 0,
      attendanceRate: metrics.rows.find(m => m.metric_name === 'attendance_rate')?.metric_value || 0,
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get class-specific metrics for teacher dashboard
exports.getTeacherMetrics = async (req, res) => {
  try {
    const { classId } = req.params;
    const metrics = await pool.query(
      `SELECT * FROM report_metrics 
       WHERE category = 'class' 
       AND metric_value->>'class_id' = $1
       AND period_end >= NOW() - INTERVAL '30 days'`,
      [classId]
    );

    res.json({
      averageScore: metrics.rows.find(m => m.metric_name === 'average_score')?.metric_value || 0,
      attendanceRate: metrics.rows.find(m => m.metric_name === 'attendance_rate')?.metric_value || 0,
      submissionRate: metrics.rows.find(m => m.metric_name === 'submission_rate')?.metric_value || 0,
      participationRate: metrics.rows.find(m => m.metric_name === 'participation_rate')?.metric_value || 0,
    });
  } catch (error) {
    console.error('Error fetching teacher metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get student-specific metrics
exports.getStudentMetrics = async (req, res) => {
  try {
    const { studentId } = req.user;
    const metrics = await pool.query(
      `SELECT * FROM report_metrics 
       WHERE category = 'student' 
       AND metric_value->>'student_id' = $1
       AND period_end >= NOW() - INTERVAL '30 days'`,
      [studentId]
    );

    res.json({
      overallGrade: metrics.rows.find(m => m.metric_name === 'overall_grade')?.metric_value || 'N/A',
      attendanceRate: metrics.rows.find(m => m.metric_name === 'attendance_rate')?.metric_value || 0,
      feeDue: metrics.rows.find(m => m.metric_name === 'fee_due')?.metric_value || 0,
      rank: metrics.rows.find(m => m.metric_name === 'class_rank')?.metric_value || 0,
    });
  } catch (error) {
    console.error('Error fetching student metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate report based on type and parameters
exports.generateReport = async (req, res) => {
  try {
    const { type, startDate, endDate, classId, subjectId } = req.query;
    const { role } = req.user;

    // Check permissions
    const hasPermission = await pool.query(
      `SELECT can_generate FROM report_permissions 
       WHERE role = $1 AND template_id IN 
       (SELECT id FROM report_templates WHERE type = $2)`,
      [role, type]
    );

    if (!hasPermission.rows[0]?.can_generate) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Get report template
    const template = await pool.query(
      'SELECT * FROM report_templates WHERE type = $1 AND role = $2',
      [type, role]
    );

    if (!template.rows.length) {
      return res.status(404).json({ error: 'Report template not found' });
    }

    // Generate report data based on type
    let reportData;
    switch (type) {
      case 'academic':
        reportData = await generateAcademicReport(req.user, startDate, endDate, classId, subjectId);
        break;
      case 'attendance':
        reportData = await generateAttendanceReport(req.user, startDate, endDate, classId);
        break;
      case 'financial':
        reportData = await generateFinancialReport(req.user, startDate, endDate);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    // Save generated report
    const savedReport = await pool.query(
      `INSERT INTO generated_reports 
       (template_id, user_id, report_data, parameters, status) 
       VALUES ($1, $2, $3, $4, 'completed') 
       RETURNING id`,
      [template.rows[0].id, req.user.id, reportData, req.query]
    );

    // Log report access
    await pool.query(
      `INSERT INTO report_access_log 
       (report_id, user_id, action, ip_address) 
       VALUES ($1, $2, 'generate', $3)`,
      [savedReport.rows[0].id, req.user.id, req.ip]
    );

    res.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export report in specified format
exports.exportReport = async (req, res) => {
  try {
    const { type, format, startDate, endDate } = req.query;
    const { role } = req.user;

    // Check export permissions
    const hasPermission = await pool.query(
      `SELECT can_export FROM report_permissions 
       WHERE role = $1 AND template_id IN 
       (SELECT id FROM report_templates WHERE type = $2)`,
      [role, type]
    );

    if (!hasPermission.rows[0]?.can_export) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Get report data
    const reportData = await pool.query(
      `SELECT report_data FROM generated_reports 
       WHERE user_id = $1 AND parameters->>'type' = $2 
       ORDER BY generated_at DESC LIMIT 1`,
      [req.user.id, type]
    );

    if (!reportData.rows.length) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const data = reportData.rows[0].report_data;
    const fileName = `report_${type}_${format(new Date(), 'yyyyMMdd_HHmmss')}.${format}`;
    const filePath = path.join(__dirname, '../temp', fileName);

    if (format === 'pdf') {
      await generatePDF(data, filePath);
    } else if (format === 'xlsx') {
      await generateExcel(data, filePath);
    } else {
      return res.status(400).json({ error: 'Invalid export format' });
    }

    // Send file and delete it after sending
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        return res.status(500).json({ error: 'Error sending file' });
      }
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
      });
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to generate academic report
async function generateAcademicReport(user, startDate, endDate, classId, subjectId) {
  // Implementation depends on your specific requirements
  // This is a placeholder structure
  return {
    headers: ['Student', 'Subject', 'Grade', 'Progress'],
    rows: [],
    charts: [
      {
        type: 'line',
        title: 'Performance Trend',
        data: {},
      },
      {
        type: 'bar',
        title: 'Subject-wise Performance',
        data: {},
      },
    ],
  };
}

// Helper function to generate attendance report
async function generateAttendanceReport(user, startDate, endDate, classId) {
  // Implementation depends on your specific requirements
  return {
    headers: ['Date', 'Status', 'Check In', 'Check Out', 'Duration'],
    rows: [],
    charts: [
      {
        type: 'pie',
        title: 'Attendance Distribution',
        data: {},
      },
    ],
  };
}

// Helper function to generate financial report
async function generateFinancialReport(user, startDate, endDate) {
  // Implementation depends on your specific requirements
  return {
    headers: ['Date', 'Description', 'Amount', 'Status'],
    rows: [],
    charts: [
      {
        type: 'bar',
        title: 'Fee Collection Trend',
        data: {},
      },
    ],
  };
}

// Helper function to generate PDF
async function generatePDF(data, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    // Add content to PDF
    // This is a basic example - enhance based on your needs
    doc.fontSize(16).text('Report', { align: 'center' });
    doc.moveDown();
    
    // Add table headers
    doc.fontSize(12);
    data.headers.forEach((header, i) => {
      doc.text(header, 50 + (i * 100), 100);
    });

    // Add table rows
    let y = 120;
    data.rows.forEach(row => {
      row.forEach((cell, i) => {
        doc.text(cell.toString(), 50 + (i * 100), y);
      });
      y += 20;
    });

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// Helper function to generate Excel
async function generateExcel(data, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  // Add headers
  worksheet.addRow(data.headers);

  // Add rows
  data.rows.forEach(row => {
    worksheet.addRow(row);
  });

  // Style headers
  worksheet.getRow(1).font = { bold: true };

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = Math.max(
      ...column.values.map(v => v ? v.toString().length : 0)
    ) + 2;
  });

  return workbook.xlsx.writeFile(filePath);
}

module.exports = exports; 