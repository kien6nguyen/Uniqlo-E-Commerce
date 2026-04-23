import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaPaperPlane, FaSearch, FaUserCircle, FaComments } from 'react-icons/fa';
import './AdminChat.css';

const ChatManagement = () => {
    const [activeChats, setActiveChats] = useState({}); // { userId: [messages] }
    const [selectedUser, setSelectedUser] = useState(null);
    const [reply, setReply] = useState("");
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const newSocket = io('http://localhost:3000', {
            transports: ['websocket'],
            withCredentials: true
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.emit("join_admin");

        socket.on("support_request", ({ userId }) => {
            setActiveChats(prev => {
                if (prev[userId]) return prev;
                return { ...prev, [userId]: [] };
            });
        });

        socket.on("user_message", ({ userId, message }) => {
            setActiveChats(prev => {
                const userMessages = prev[userId] || [];
                return { ...prev, [userId]: [...userMessages, { sender: 'user', text: message, timestamp: new Date() }] };
            });
        });

        return () => {
            socket.off("support_request");
            socket.off("user_message");
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChats, selectedUser]);

    const sendReply = (e) => {
        e.preventDefault();
        if (!reply.trim() || !selectedUser || !socket) return;

        socket.emit("admin_reply", { userId: selectedUser, message: reply });

        setActiveChats(prev => {
            const userMessages = prev[selectedUser] || [];
            return {
                ...prev,
                [selectedUser]: [...userMessages, { sender: 'admin', text: reply, timestamp: new Date() }]
            };
        });
        setReply("");
    };

    const formatTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="admin-chat-container">
            {/* Sidebar */}
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <h3>Inbox</h3>
                </div>
                <div className="user-list">
                    {Object.keys(activeChats).length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                            No active support requests
                        </div>
                    ) : (
                        Object.keys(activeChats).map(userId => {
                            const messages = activeChats[userId];
                            const lastMessage = messages[messages.length - 1];

                            return (
                                <div
                                    key={userId}
                                    className={`user-item ${selectedUser === userId ? 'active' : ''}`}
                                    onClick={() => setSelectedUser(userId)}
                                >
                                    <div className="user-avatar">
                                        <FaUserCircle size={24} />
                                    </div>
                                    <div className="user-info">
                                        <div className="user-name">User: {userId.substr(0, 8)}...</div>
                                        <div className="user-preview">
                                            {lastMessage ? lastMessage.text : 'New support request'}
                                        </div>
                                    </div>
                                    {messages.length > 0 && (
                                        <div className="unread-badge">{messages.length}</div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-main">
                {selectedUser ? (
                    <>
                        <div className="chat-main-header">
                            <div className="chat-user-details">
                                <h4>User: {selectedUser}</h4>
                                <div className="chat-status">
                                    <div className="status-dot"></div>
                                    Online
                                </div>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {activeChats[selectedUser]?.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`admin-message-wrapper ${msg.sender === 'admin' ? 'sent' : 'received'}`}
                                >
                                    <div className="admin-bubble">
                                        {msg.text}
                                    </div>
                                    <div className="message-time">
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-area">
                            <form onSubmit={sendReply} className="input-wrapper">
                                <input
                                    type="text"
                                    className="chat-input-field"
                                    placeholder="Type a reply..."
                                    value={reply}
                                    onChange={e => setReply(e.target.value)}
                                />
                                <button type="submit" className="send-button" disabled={!reply.trim()}>
                                    <FaPaperPlane size={16} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <FaComments className="empty-icon" />
                        <h3>Select a conversation</h3>
                        <p>Choose a user from the sidebar to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatManagement;
