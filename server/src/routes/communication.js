const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

const announcementController = require('../controllers/communication/announcementController');
const messagingController = require('../controllers/communication/messagingController');
const newsletterController = require('../controllers/communication/newsletterController');
const notificationController = require('../controllers/communication/notificationController');

// Announcement Routes
router.post('/announcements',
    authenticate,
    checkRole(['admin', 'teacher']),
    announcementController.createAnnouncement
);
router.get('/announcements',
    authenticate,
    announcementController.getAnnouncements
);
router.post('/announcements/:announcementId/read',
    authenticate,
    announcementController.markAsRead
);
router.delete('/announcements/:announcementId',
    authenticate,
    checkRole(['admin']),
    announcementController.deleteAnnouncement
);

// Messaging Routes
router.get('/conversations',
    authenticate,
    messagingController.getConversations
);
router.post('/conversations',
    authenticate,
    messagingController.startConversation
);
router.get('/conversations/:conversationId/messages',
    authenticate,
    messagingController.getMessages
);
router.post('/conversations/:conversationId/messages',
    authenticate,
    messagingController.sendMessage
);

// Newsletter Routes
router.post('/newsletters',
    authenticate,
    checkRole(['admin']),
    newsletterController.createNewsletter
);
router.get('/newsletters',
    authenticate,
    checkRole(['admin']),
    newsletterController.getNewsletters
);
router.post('/newsletters/:newsletterId/send',
    authenticate,
    checkRole(['admin']),
    newsletterController.sendNewsletter
);
router.delete('/newsletters/:newsletterId',
    authenticate,
    checkRole(['admin']),
    newsletterController.deleteNewsletter
);
router.get('/newsletters/:newsletterId/stats',
    authenticate,
    checkRole(['admin']),
    newsletterController.getNewsletterStats
);

// Notification Routes
router.get('/notifications',
    authenticate,
    notificationController.getNotifications
);
router.post('/notifications/:notificationId/read',
    authenticate,
    notificationController.markAsRead
);
router.post('/notifications/mark-all-read',
    authenticate,
    notificationController.markAllAsRead
);
router.delete('/notifications/:notificationId',
    authenticate,
    notificationController.deleteNotification
);
router.get('/notifications/unread-count',
    authenticate,
    notificationController.getUnreadCount
);

module.exports = router; 