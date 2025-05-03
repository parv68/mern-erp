import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create subdirectories based on file type
        let uploadPath = uploadsDir;
        
        if (file.fieldname === 'study_materials') {
            uploadPath = path.join(uploadsDir, 'study_materials');
        } else if (file.fieldname === 'assignments') {
            uploadPath = path.join(uploadsDir, 'assignments');
        } else if (file.fieldname === 'student_submissions') {
            uploadPath = path.join(uploadsDir, 'submissions');
        } else if (file.fieldname === 'profile_pictures') {
            uploadPath = path.join(uploadsDir, 'profiles');
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = {
        'study_materials': ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'],
        'assignments': ['.pdf', '.doc', '.docx'],
        'student_submissions': ['.pdf', '.doc', '.docx', '.zip'],
        'profile_pictures': ['.jpg', '.jpeg', '.png']
    };

    // Get allowed extensions for this field
    const allowed = allowedTypes[file.fieldname] || ['.pdf', '.doc', '.docx'];
    
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed types: ' + allowed.join(', ')));
    }
};

// Create multer instance with configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB file size limit
        files: 5 // Maximum 5 files per request
    }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum size is 10MB'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'Too many files. Maximum is 5 files per upload'
            });
        }
        return res.status(400).json({
            message: 'File upload error: ' + err.message
        });
    }
    
    if (err) {
        return res.status(400).json({
            message: err.message
        });
    }
    
    next();
};

// Helper function to delete uploaded files
const deleteFile = async (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

// Middleware to handle study material uploads
const uploadStudyMaterial = upload.array('study_materials', 5);

// Middleware to handle assignment uploads
const uploadAssignment = upload.single('assignments');

// Middleware to handle student submission uploads
const uploadSubmission = upload.single('student_submissions');

// Middleware to handle profile picture uploads
const uploadProfilePicture = upload.single('profile_pictures');

export {
    upload,
    handleUploadError,
    deleteFile,
    uploadStudyMaterial,
    uploadAssignment,
    uploadSubmission,
    uploadProfilePicture
}; 