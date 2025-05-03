-- Announcements Table
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('global', 'staff', 'class')),
    target_class INTEGER REFERENCES classes(id),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'medium', 'high')),
    creator_id INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations Table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    participant1_id INTEGER REFERENCES users(id) NOT NULL,
    participant2_id INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_participants UNIQUE (participant1_id, participant2_id),
    CONSTRAINT different_participants CHECK (participant1_id != participant2_id)
);

-- Messages Table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) NOT NULL,
    sender_id INTEGER REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Newsletters Table
CREATE TABLE newsletters (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_audience VARCHAR(50) NOT NULL CHECK (target_audience IN ('all', 'parents', 'teachers', 'students')),
    template VARCHAR(50) NOT NULL DEFAULT 'default',
    schedule_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
    creator_id INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Newsletter Recipients Table
CREATE TABLE newsletter_recipients (
    id SERIAL PRIMARY KEY,
    newsletter_id INTEGER REFERENCES newsletters(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_newsletter_recipient UNIQUE (newsletter_id, user_id)
);

-- Announcement Read Status Table
CREATE TABLE announcement_reads (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES announcements(id) NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_announcement_read UNIQUE (announcement_id, user_id)
);

-- Indexes
CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_target_class ON announcements(target_class);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_newsletters_status ON newsletters(status);
CREATE INDEX idx_newsletters_schedule ON newsletters(schedule_date);
CREATE INDEX idx_newsletter_recipients_newsletter ON newsletter_recipients(newsletter_id);
CREATE INDEX idx_announcement_reads_announcement ON announcement_reads(announcement_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 