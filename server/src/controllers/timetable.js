import { query } from '../db/connection.js';

export const createTimetableSlot = async (req, res) => {
  try {
    const {
      day_of_week,
      start_time,
      end_time,
      subject_id,
      teacher_id,
      class_id,
      section_id,
      room_number,
      academic_year,
    } = req.body;

    const { rows } = await query(
      `INSERT INTO timetable_slots 
       (day_of_week, start_time, end_time, subject_id, teacher_id, class_id, section_id, room_number, academic_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [day_of_week, start_time, end_time, subject_id, teacher_id, class_id, section_id, room_number, academic_year]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create timetable slot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTimetable = async (req, res) => {
  try {
    const { class_id, section_id, academic_year } = req.query;

    const { rows } = await query(
      `SELECT ts.*,
              s.name as subject_name,
              s.code as subject_code,
              CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
              c.name as class_name,
              sec.name as section_name
       FROM timetable_slots ts
       JOIN subjects s ON ts.subject_id = s.id
       JOIN teachers t ON ts.teacher_id = t.id
       JOIN users u ON t.user_id = u.id
       JOIN classes c ON ts.class_id = c.id
       JOIN sections sec ON ts.section_id = sec.id
       WHERE ts.class_id = $1
       AND ts.section_id = $2
       AND ts.academic_year = $3
       ORDER BY ts.day_of_week, ts.start_time`,
      [class_id, section_id, academic_year]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTeacherTimetable = async (req, res) => {
  try {
    const { teacher_id, academic_year } = req.query;

    const { rows } = await query(
      `SELECT ts.*,
              s.name as subject_name,
              s.code as subject_code,
              c.name as class_name,
              sec.name as section_name
       FROM timetable_slots ts
       JOIN subjects s ON ts.subject_id = s.id
       JOIN classes c ON ts.class_id = c.id
       JOIN sections sec ON ts.section_id = sec.id
       WHERE ts.teacher_id = $1
       AND ts.academic_year = $2
       ORDER BY ts.day_of_week, ts.start_time`,
      [teacher_id, academic_year]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTimetableSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      day_of_week,
      start_time,
      end_time,
      subject_id,
      teacher_id,
      room_number,
    } = req.body;

    const { rows } = await query(
      `UPDATE timetable_slots 
       SET day_of_week = $1,
           start_time = $2,
           end_time = $3,
           subject_id = $4,
           teacher_id = $5,
           room_number = $6
       WHERE id = $7
       RETURNING id`,
      [day_of_week, start_time, end_time, subject_id, teacher_id, room_number, id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Timetable slot not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Update timetable slot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTimetableSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await query(
      'DELETE FROM timetable_slots WHERE id = $1',
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({ message: 'Timetable slot not found' });
    }

    res.json({ message: 'Timetable slot deleted successfully' });
  } catch (error) {
    console.error('Delete timetable slot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Substitutions
export const requestSubstitution = async (req, res) => {
  try {
    const {
      timetable_slot_id,
      original_teacher_id,
      substitute_teacher_id,
      substitution_date,
      reason,
    } = req.body;

    const { rows } = await query(
      `INSERT INTO substitutions 
       (timetable_slot_id, original_teacher_id, substitute_teacher_id, substitution_date, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [timetable_slot_id, original_teacher_id, substitute_teacher_id, substitution_date, reason]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Request substitution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSubstitutionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { rows } = await query(
      `UPDATE substitutions 
       SET status = $1
       WHERE id = $2
       RETURNING id, status`,
      [status, id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Substitution request not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Update substitution status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSubstitutions = async (req, res) => {
  try {
    const { teacher_id, date } = req.query;

    const { rows } = await query(
      `SELECT s.*,
              ts.day_of_week,
              ts.start_time,
              ts.end_time,
              sub.name as subject_name,
              c.name as class_name,
              sec.name as section_name,
              CONCAT(u1.first_name, ' ', u1.last_name) as original_teacher_name,
              CONCAT(u2.first_name, ' ', u2.last_name) as substitute_teacher_name
       FROM substitutions s
       JOIN timetable_slots ts ON s.timetable_slot_id = ts.id
       JOIN subjects sub ON ts.subject_id = sub.id
       JOIN classes c ON ts.class_id = c.id
       JOIN sections sec ON ts.section_id = sec.id
       JOIN teachers t1 ON s.original_teacher_id = t1.id
       JOIN users u1 ON t1.user_id = u1.id
       JOIN teachers t2 ON s.substitute_teacher_id = t2.id
       JOIN users u2 ON t2.user_id = u2.id
       WHERE (s.original_teacher_id = $1 OR s.substitute_teacher_id = $1)
       AND s.substitution_date = $2`,
      [teacher_id, date]
    );

    res.json(rows);
  } catch (error) {
    console.error('Get substitutions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 