import { query } from '../db/connection.js';

export const createClass = async (req, res) => {
  try {
    const { name, description } = req.body;

    const { rows } = await query(
      `INSERT INTO classes (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, created_at`,
      [name, description]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getClasses = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT c.*, 
              COUNT(DISTINCT s.id) as section_count,
              COUNT(DISTINCT st.id) as student_count
       FROM classes c
       LEFT JOIN sections s ON c.id = s.class_id
       LEFT JOIN students st ON c.id = st.class_id
       GROUP BY c.id
       ORDER BY c.name`
    );

    res.json(rows);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await query(
      `SELECT c.*, 
              json_agg(DISTINCT jsonb_build_object(
                'id', s.id,
                'name', s.name,
                'student_count', (
                  SELECT COUNT(*) FROM students 
                  WHERE section_id = s.id
                )
              )) as sections
       FROM classes c
       LEFT JOIN sections s ON c.id = s.class_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const { rows } = await query(
      `UPDATE classes 
       SET name = $1, description = $2
       WHERE id = $3
       RETURNING id, name, description, created_at, updated_at`,
      [name, description, id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await query(
      'DELETE FROM classes WHERE id = $1',
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Section Management
export const createSection = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { name } = req.body;

    const { rows } = await query(
      `INSERT INTO sections (class_id, name)
       VALUES ($1, $2)
       RETURNING id, class_id, name, created_at`,
      [class_id, name]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const { rows } = await query(
      `UPDATE sections 
       SET name = $1
       WHERE id = $2
       RETURNING id, class_id, name, created_at, updated_at`,
      [name, id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await query(
      'DELETE FROM sections WHERE id = $1',
      [id]
    );

    if (!rowCount) {
      return res.status(404).json({ message: 'Section not found' });
    }

    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 