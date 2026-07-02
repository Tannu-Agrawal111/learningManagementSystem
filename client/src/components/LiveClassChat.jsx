import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { socket, connectSocket } from '../utils/socket';
import { ArrowLeft, Send, MessageSquare, Loader2 } from 'lucide-react';
import './LiveClassChat.css';

const LiveClassChat = () => {
  const { classId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    if (user.id) connectSocket(user.id);
    // Join the class room
    socket.emit('join_class', classId);

    // Listen for incoming messages
    socket.on('receive_class_msg', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    setLoading(false);

    return () => {
      socket.off('receive_class_msg');
    };
  }, [classId]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const user = JSON.parse(localStorage.getItem('user')) || {};
    socket.emit('class_message', { classId, userId: user.id, message: input.trim() });
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="live-class-chat-container">
      <div className="header">
        <Link to="/dashboard" className="back-link">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <h2>Live Class Chat</h2>
      </div>

      <div className="messages" >
        {loading ? (
          <div className="loading"><Loader2 className="animate-spin" size={24} /></div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="message-item">
              <span className="user">{msg.userId}</span>: <span className="text">{msg.message}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="input-bar">
        <input
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button onClick={sendMessage} className="send-btn"><Send size={20} /></button>
      </div>
    </div>
  );
};

export default LiveClassChat;
