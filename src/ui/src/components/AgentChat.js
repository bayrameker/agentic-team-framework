import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Badge } from 'react-bootstrap';
import { SendFill, PersonFill } from 'react-bootstrap-icons';

const AgentChat = ({ agents, currentAgent, onSendMessage }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newMessage = {
            id: Date.now(),
            content: message,
            sender: currentAgent,
            timestamp: new Date(),
            type: 'message'
        };

        setMessages(prev => [...prev, newMessage]);
        onSendMessage(newMessage);
        setMessage('');
    };

    const getAgentColor = (role) => {
        switch (role) {
            case 'developer':
                return 'primary';
            case 'tester':
                return 'info';
            case 'product_manager':
                return 'success';
            case 'project_manager':
                return 'warning';
            default:
                return 'secondary';
        }
    };

    return (
        <Card className="h-100">
            <Card.Header>
                <h5 className="mb-0">Takım İletişimi</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column p-0">
                <div className="flex-grow-1 p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {messages.map((msg) => (
                        <div key={msg.id} className="mb-3">
                            <div className="d-flex align-items-center mb-1">
                                <PersonFill className="me-2" />
                                <Badge bg={getAgentColor(msg.sender.role)}>
                                    {msg.sender.name}
                                </Badge>
                                <small className="text-muted ms-2">
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </small>
                            </div>
                            <div className="message-content p-2 rounded">
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <Form onSubmit={handleSubmit} className="p-3 border-top">
                    <div className="d-flex gap-2">
                        <Form.Control
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Mesajınızı yazın..."
                        />
                        <Button type="submit" variant="primary">
                            <SendFill />
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default AgentChat; 