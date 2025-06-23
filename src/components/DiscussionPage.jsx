import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';

function DiscussionPage({ config, onNewTopic }) {
    const [messages, setMessages] = useState([]);
    const [isAiResponding, setIsAiResponding] = useState(false);
    const [discussionEnded, setDiscussionEnded] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [currentModel, setCurrentModel] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const timeoutRef = useRef(null);
    const conversationPanelRef = useRef(null);useEffect(() => {
        if (config) {
            startDiscussion();
        }
        
        return () => {
            // Cleanup on unmount
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [config]);    useEffect(() => {
        if (isAtBottom) {
            scrollToBottom();
        }
    }, [messages, isAtBottom]);    const checkIfAtBottom = () => {
        if (conversationPanelRef.current && messagesEndRef.current) {
            const panel = conversationPanelRef.current;
            const lastMessage = messagesEndRef.current.previousElementSibling;
            
            if (lastMessage) {
                const panelRect = panel.getBoundingClientRect();
                const messageRect = lastMessage.getBoundingClientRect();
                
                // Check if any part of the last message is visible
                const isVisible = messageRect.top < panelRect.bottom && 
                                messageRect.bottom > panelRect.top;
                                
                setIsAtBottom(isVisible);
            } else {
                // Fallback to old method if no messages
                const { scrollTop, scrollHeight, clientHeight } = panel;
                const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
                setIsAtBottom(atBottom);
            }
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };const startDiscussion = () => {
        const initialMessage = {
            id: 1,
            speaker: 'System',
            content: `Discussion Topic: "${config.topic}"`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'system'
        };        setMessages([initialMessage]);
        setConversationHistory([]);
        setDiscussionEnded(false);
        setIsProcessing(false);
        setIsAiResponding(false);
        setCurrentModel(config.model1);
        
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        // Start with model 1 only
        timeoutRef.current = setTimeout(() => {
            sendMessageToModel(config.model1, [], true);
        }, 1000);
    };    const sendMessageToModel = async (modelConfig, history, isFirstMessage = false) => {
        console.log(`Sending message to ${modelConfig.name}, isFirst: ${isFirstMessage}, processing: ${isProcessing}, ended: ${discussionEnded}`);
        
        if (discussionEnded || isProcessing) {
            console.log('Skipping - discussion ended or processing');
            return;
        }
          setIsProcessing(true);
        setIsAiResponding(true);
        setCurrentModel(modelConfig);
        
        // Create a new message for this response immediately
        const messageId = Date.now();
        const newMessage = {
            id: messageId,
            speaker: modelConfig.name,
            content: '',
            thinkingContent: '',
            timestamp: new Date().toLocaleTimeString(),
            type: 'ai',
            isComplete: false,
            hasThinking: false,
            showThinking: false
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        try {
            abortControllerRef.current = new AbortController();
            
            let systemPrompt = "You are a participant in a discussion about a topic with another AI. Be concise in your responses and feel free to ask the other participant questions to keep the discussion interesting but keep on topic. When you feel the topic has met a reasonable conclusion respond with \"that was a good chat\".";
            
            if (modelConfig.profile && modelConfig.profile.trim()) {
                systemPrompt += ` ${modelConfig.profile.trim()}`;
            }            const messages = [
                { role: 'system', content: systemPrompt }
            ];
            
            if (isFirstMessage) {
                // First message to model 1 - just the topic
                messages.push({ role: 'user', content: `The discussion topic is: "${config.topic}". Please start the discussion.` });
            } else {
                // Add conversation history as alternating user/assistant messages
                history.forEach((msg, index) => {
                    const role = index % 2 === 0 ? 'user' : 'assistant';
                    messages.push({ role: role, content: msg.content });
                });
                
                // Add current prompt
                messages.push({ 
                    role: 'user', 
                    content: 'Please continue the discussion.' 
                });
            }            const headers = {
                'Content-Type': 'application/json',
            };
            
            if (config.ollamaApiKey && config.ollamaApiKey.trim()) {
                headers['X-API-Key'] = config.ollamaApiKey.trim();
            }

            const response = await fetch(`${config.ollamaServerUrl}/api/chat`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: modelConfig.model,
                    messages: messages,
                    stream: true
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();            let fullResponse = '';
            let thinkingContent = '';
            let isInThinking = false;
            let displayContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim() && line.startsWith('{')) {
                        try {
                            const data = JSON.parse(line);
                            if (data.message && data.message.content) {
                                fullResponse += data.message.content;
                                  // Process thinking tags
                                let tempContent = fullResponse;
                                let tempThinking = '';
                                let tempDisplay = '';
                                
                                // Find thinking tags
                                const thinkingRegex = /<think>(.*?)<\/think>/gs;
                                let match;
                                let lastIndex = 0;
                                
                                while ((match = thinkingRegex.exec(tempContent)) !== null) {
                                    // Add content before thinking tag to display
                                    tempDisplay += tempContent.slice(lastIndex, match.index);
                                    // Add thinking content
                                    tempThinking += match[1];
                                    lastIndex = thinkingRegex.lastIndex;
                                }
                                
                                // Add remaining content after last thinking tag
                                tempDisplay += tempContent.slice(lastIndex);
                                
                                // Check for unclosed thinking tag
                                const openThinkingMatch = tempContent.match(/<think>(?!.*<\/think>)/s);
                                if (openThinkingMatch) {
                                    const openIndex = tempContent.lastIndexOf('<think>');
                                    tempDisplay = tempContent.slice(0, openIndex);
                                    tempThinking += tempContent.slice(openIndex + 7); // +7 for '<think>'
                                    isInThinking = true;
                                } else {
                                    isInThinking = false;
                                }
                                
                                thinkingContent = tempThinking;
                                displayContent = tempDisplay;
                                
                                // Update the message in real-time
                                setMessages(prev => prev.map(msg => 
                                    msg.id === messageId 
                                        ? { 
                                            ...msg, 
                                            content: displayContent,
                                            thinkingContent: thinkingContent,
                                            hasThinking: thinkingContent.length > 0,
                                            isThinking: isInThinking
                                        }
                                        : msg
                                ));
                            }
                            
                            if (data.done) {
                                // Mark message as complete
                                setMessages(prev => prev.map(msg => 
                                    msg.id === messageId 
                                        ? { ...msg, isComplete: true, isThinking: false }
                                        : msg
                                ));
                                break;
                            }
                        } catch (e) {
                            // Ignore JSON parse errors for incomplete chunks
                        }
                    }
                }
            }            // Check if the discussion should end
            if (displayContent.toLowerCase().includes('that was a good chat')) {
                setDiscussionEnded(true);
                setIsAiResponding(false);
                setIsProcessing(false);
                setCurrentModel(null);
                return;
            }

            // Update conversation history
            const updatedHistory = [...history, {
                speaker: modelConfig.name,
                content: displayContent
            }];
            setConversationHistory(updatedHistory);

            // Mark processing as complete before starting next model
            setIsProcessing(false);
            setIsAiResponding(false);            // Continue with the other model after a short delay
            timeoutRef.current = setTimeout(() => {
                if (!discussionEnded && !isPaused) {
                    const otherModel = modelConfig === config.model1 ? config.model2 : config.model1;
                    sendMessageToModel(otherModel, updatedHistory, false);
                }
            }, 2000);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
            } else {
                console.error('Error communicating with AI:', error);
                
                const errorMessage = {
                    id: Date.now(),
                    speaker: 'System',
                    content: `Error: Failed to get response from ${modelConfig.name}. ${error.message}`,
                    timestamp: new Date().toLocaleTimeString(),
                    type: 'error'
                };
                
                setMessages(prev => [...prev, errorMessage]);
            }        } finally {
            setIsAiResponding(false);
            setIsProcessing(false);
            if (discussionEnded) {
                setCurrentModel(null);
            }
        }
    };    const handlePauseToggle = () => {
        setIsPaused(!isPaused);
        if (isPaused) {
            // Resuming - continue conversation if not already processing
            if (!isProcessing && !discussionEnded && conversationHistory.length > 0) {
                const lastMessage = conversationHistory[conversationHistory.length - 1];
                const nextModel = lastMessage.speaker === config.model1.name ? config.model2 : config.model1;
                setTimeout(() => {
                    sendMessageToModel(nextModel, conversationHistory, false);
                }, 1000);
            }
        }
    };

    const handleNewTopic = () => {
        // Stop all ongoing processes
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
          setDiscussionEnded(true);
        setIsAiResponding(false);
        setIsProcessing(false);        setHasStarted(false);
        setIsPaused(false);
        setCurrentModel(null);
        setMessages([]);
        setConversationHistory([]);
        
        onNewTopic();
    };

    return (
        <div className="discussion-page">            <div className="discussion-header">
                <div className="header-controls">
                    <button 
                        className="new-topic-btn" 
                        onClick={handleNewTopic}
                    >
                        New Topic
                    </button>
                    <button 
                        className={`pause-btn ${isPaused ? 'paused' : ''}`}
                        onClick={handlePauseToggle}
                        disabled={discussionEnded}
                    >
                        {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                    </button>
                </div>
                <div className="discussion-status">
                    {isPaused && !discussionEnded && (
                        <span className="status-indicator paused">
                            ⏸️ Discussion paused
                        </span>
                    )}
                    {isAiResponding && !discussionEnded && !isPaused && (
                        <span className="status-indicator">
                            🤖 AI is responding...
                        </span>
                    )}
                    {discussionEnded && (
                        <span className="status-indicator ended">
                            ✅ Discussion completed
                        </span>
                    )}
                </div>
            </div>            <div 
                className="conversation-panel" 
                ref={conversationPanelRef}
                onScroll={checkIfAtBottom}
            >
                {messages.map((message) => (
                    <div 
                        key={message.id} 
                        className={`message ${message.type} ${message.speaker === config.model1.name ? 'model1' : message.speaker === config.model2.name ? 'model2' : 'system'}`}
                    >                        <div className="message-header">
                            <span className="speaker">{message.speaker}</span>
                            <span className="timestamp">{message.timestamp}</span>
                            {message.isThinking && (
                                <span className="thinking-label fading">Thinking...</span>
                            )}
                            {message.hasThinking && !message.isThinking && (
                                <button 
                                    className="thinking-btn"
                                    onClick={() => setMessages(prev => prev.map(msg => 
                                        msg.id === message.id 
                                            ? { ...msg, showThinking: !msg.showThinking }
                                            : msg
                                    ))}
                                >
                                    Show Thinking
                                </button>
                            )}
                        </div><div className="message-content">
                            <div 
                                dangerouslySetInnerHTML={{ 
                                    __html: marked(message.content || '') 
                                }} 
                            />
                            {message.type === 'ai' && !message.isComplete && (
                                <span className="typing-indicator">▌</span>
                            )}
                        </div>
                        {message.showThinking && message.thinkingContent && (
                            <div className="thinking-content">
                                <strong>Thinking process:</strong>
                                <div 
                                    dangerouslySetInnerHTML={{ 
                                        __html: marked(message.thinkingContent || '') 
                                    }} 
                                />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}

export default DiscussionPage;
