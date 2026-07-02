import React, { useState, useEffect, useRef } from 'react';
import { socket, connectSocket } from '../utils/socket';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import './LiveClassLobbyChat.css';

const LiveClassLobbyChat = ({ lectureId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    if (user.id) connectSocket(user.id);
    socket.emit('join_lecture_lobby', lectureId);
    socket.on('receive_lobby_msg', (msg) => setMessages((prev) => [...prev, msg]));
    return () => {
      socket.off('receive_lobby_msg');
    };
  }, [lectureId]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const user = JSON.parse(localStorage.getItem('user')) || {};
    socket.emit('send_lobby_msg', {
      lectureId,
      message: input.trim(),
      userName: user.name || 'Learner',
      userId: user.id,
    });
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="lobby-chat-container">
      <div className="header">
        <Link to="/dashboard" className="back-link">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
        <h2>Lecture Lobby Chat</h2>
      </div>
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className="message-item">
            <span className="user">{msg.userName}</span>: <span className="text">{msg.message}</span>
          </div>
        ))}
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

export default LiveClassLobbyChat;
