import React, { useState, useEffect, useRef } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

const Messaging = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchConversations();
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        try {
            const response = await axios.get('/api/communication/conversations');
            setConversations(response.data);
        } catch (error) {
            toast.error('Failed to fetch conversations');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users/contacts');
            setUsers(response.data);
        } catch (error) {
            toast.error('Failed to fetch users');
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const response = await axios.get(`/api/communication/conversations/${conversationId}/messages`);
            setMessages(response.data);
        } catch (error) {
            toast.error('Failed to fetch messages');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        setLoading(true);
        try {
            await axios.post(`/api/communication/conversations/${selectedConversation.id}/messages`, {
                content: newMessage
            });
            setNewMessage('');
            fetchMessages(selectedConversation.id);
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    const startNewConversation = async (userId) => {
        try {
            const response = await axios.post('/api/communication/conversations', {
                participant_id: userId
            });
            setConversations([...conversations, response.data]);
            setSelectedConversation(response.data);
        } catch (error) {
            toast.error('Failed to start conversation');
        }
    };

    const filteredUsers = users.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) && user.id !== user?.id;
    });

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Conversations List */}
                <div className="md:col-span-1 bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                        {searchTerm ? (
                            filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => startNewConversation(user.id)}
                                >
                                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                                    <p className="text-sm text-gray-500">{user.role}</p>
                                </div>
                            ))
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                                        selectedConversation?.id === conv.id ? 'bg-gray-50' : ''
                                    }`}
                                    onClick={() => setSelectedConversation(conv)}
                                >
                                    <p className="font-medium">{conv.participant_name}</p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {conv.last_message || 'No messages yet'}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="md:col-span-3 bg-white rounded-lg shadow">
                    {selectedConversation ? (
                        <>
                            <div className="p-4 border-b">
                                <h3 className="text-lg font-semibold">
                                    {selectedConversation.participant_name}
                                </h3>
                            </div>
                            <div className="p-4 h-[500px] overflow-y-auto">
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-lg p-3 ${
                                                    message.sender_id === user?.id
                                                        ? 'bg-primary-100 text-primary-900'
                                                        : 'bg-gray-100'
                                                }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(message.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                            <div className="p-4 border-t">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-3 py-2 border rounded-md"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !newMessage.trim()}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                                    >
                                        Send
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            Select a conversation or start a new one
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messaging; 