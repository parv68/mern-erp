import express from 'express';
const router = express.Router();
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';

import { createAnnouncement, getAnnouncements, markAsRead as markAnnouncementAsRead, deleteAnnouncement } from '../controllers/communication/announcementController.js';
import { getConversations, startConversation, getMessages, sendMessage } from '../controllers/communication/messagingController.js';
import { createNewsletter, getNewsletters, sendNewsletter, deleteNewsletter, getNewsletterStats } from '../controllers/communication/newsletterController.js';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount } from '../controllers/communication/notificationController.js';

// Announcement Routes
router.post('/announcements',
    authenticate,
    checkRole(['admin', 'teacher']),
    createAnnouncement
);
router.get('/announcements',
    authenticate,
    getAnnouncements
);
router.post('/announcements/:announcementId/read',
    authenticate,
    markAnnouncementAsRead
);
router.delete('/announcements/:announcementId',
    authenticate,
    checkRole(['admin']),
    deleteAnnouncement
);

// Messaging Routes
router.get('/conversations',
    authenticate,
    getConversations
);
router.post('/conversations',
    authenticate,
    startConversation
);
router.get('/conversations/:conversationId/messages',
    authenticate,
    getMessages
);
router.post('/conversations/:conversationId/messages',
    authenticate,
    sendMessage
);

// Newsletter Routes
router.post('/newsletters',
    authenticate,
    checkRole(['admin']),
    createNewsletter
);
router.get('/newsletters',
    authenticate,
    checkRole(['admin']),
    getNewsletters
);
router.post('/newsletters/:newsletterId/send',
    authenticate,
    checkRole(['admin']),
    sendNewsletter
);
router.delete('/newsletters/:newsletterId',
    authenticate,
    checkRole(['admin']),
    deleteNewsletter
);
router.get('/newsletters/:newsletterId/stats',
    authenticate,
    checkRole(['admin']),
    getNewsletterStats
);

// Notification Routes
router.get('/notifications',
    authenticate,
    getNotifications
);
router.post('/notifications/:notificationId/read',
    authenticate,
    markAsRead
);
router.post('/notifications/mark-all-read',
    authenticate,
    markAllAsRead
);
router.delete('/notifications/:notificationId',
    authenticate,
    deleteNotification
);
router.get('/notifications/unread-count',
    authenticate,
    getUnreadCount
);

export default router; 