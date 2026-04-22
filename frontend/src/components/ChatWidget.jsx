import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaCommentDots, FaPaperPlane, FaTimes, FaHeadset } from 'react-icons/fa';
import '../styles/ChatWidget.css';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Xin chào! Nhân viên UNIQLO sẵn sàng hỗ trợ bạn.", sender: "system" }
    ]);
    const [input, setInput] = useState("");
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && !socket) {
            const newSocket = io('http://localhost:3000', {
                transports: ['websocket'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });
            newSocket.emit("request_support");
            setSocket(newSocket);
        }
    }, [isOpen, socket]);

    useEffect(() => {
        return () => {
            if (socket) socket.disconnect();
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on("receive_message", (data) => {
            const newMessage = { text: data.message, sender: data.sender || 'admin' };
            setMessages(prev => [...prev, newMessage]);
        });

        return () => {
            socket.off("receive_message");
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (input.trim() === "" || !socket) return;

        const newMessage = { text: input, sender: "user" };
        setMessages(prev => [...prev, newMessage]);
        socket.emit("chat_message", input);
        setInput("");
    };

    const handleClose = () => {
        setIsOpen(false);
        if (socket) {
            socket.emit("end_support");
            socket.disconnect();
            setSocket(null);
        }
    };

    return (
        <div className="chat-widget-container">
            {!isOpen && (
                <button
                    className="chat-toggle-btn"
                    onClick={() => setIsOpen(true)}
                    aria-label="Chat với nhân viên"
                    title="Chat với nhân viên UNIQLO"
                >
                    <FaHeadset size={22} />
                    <span className="chat-toggle-label">Hỗ trợ</span>
                </button>
            )}

            {isOpen && (
                <div className="chat-window-wrapper">
                <div className="chat-window">
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <FaHeadset size={18} />
                            <span className="chat-title">Nhân viên hỗ trợ</span>
                        </div>
                        <FaTimes className="close-btn" size={18} onClick={handleClose} />
                    </div>

                    <div className="chat-body">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-wrapper ${msg.sender}`}>
                                <div className="message-bubble">{msg.text}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-footer">
                        <form onSubmit={sendMessage} className="chat-input-group">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Nhắn tin cho nhân viên..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button type="submit" className="send-btn" disabled={!input.trim()}>
                                <FaPaperPlane size={16} />
                            </button>
                        </form>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
