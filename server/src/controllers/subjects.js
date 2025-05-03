import { query } from '../db/connection.js';

export const createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const { rows } = await query(
      `INSERT INTO subjects (name, code, description)
       VALUES ($1, $2, $3)
       RETURNING id, name, code, description`,
      [name, code, description]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, 
              COUNT(DISTINCT st.teacher_id) as teacher_count,
              COUNT(DISTINCT st.class_id) as class_count
       FROM subjects s
       LEFT JOIN subject_teachers st ON s.id = st.subject_id
       GROUP BY s.id
       ORDER BY s.name`
    );

    res.json(rows);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await query(
      `SELECT s.*, 
              json_agg(DISTINCT jsonb_build_object(
                'teacher_id', t.id,
                'teacher_name', concat(u.first_name, ' ', u.last_name),
                'class_id', st.class_id,
                'class_name', c.name,
                'section_id', st.section_id,
                'section_name', sec.name
              )) as allocations
       FROM subjects s
       LEFT JOIN subject_teachers st ON s.id = st.subject_id
       LEFT JOIN teachers t ON st.teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN classes c ON st.class_id = c.id
       LEFT JOIN sections sec ON st.section_id = sec.id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const { rows } = await query(
      `UPDATE subjects 
       SET name = $1, code = $2, description = $3
       WHERE id = $4
       RETURNING id, name, code, description`,
      [name, code, description, id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await query(
      'DELETE FROM subjects WHERE id = $1',
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Subject Teacher Allocation
export const allocateTeacher = async (req, res) => {
  try {
    const { subject_id, teacher_id, class_id, section_id, academic_year } = req.body;

    const { rows } = await query(
      `INSERT INTO subject_teachers 
       (subject_id, teacher_id, class_id, section_id, academic_year)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [subject_id, teacher_id, class_id, section_id, academic_year]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Allocate teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deallocateTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await query(
      'DELETE FROM subject_teachers WHERE id = $1',
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    res.json({ message: 'Teacher deallocated successfully' });
  } catch (error) {
    console.error('Deallocate teacher error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 