import React, { useState, useEffect } from 'react';

function TopicPage({ onStartDiscussion }) {
    const [ollamaServerUrl, setOllamaServerUrl] = useState(() => {
        return localStorage.getItem('ai-discuss-ollama-url') || 'http://localhost:11434';
    });
    const [ollamaApiKey, setOllamaApiKey] = useState(() => {
        return localStorage.getItem('ai-discuss-ollama-api-key') || '';
    });
    const [availableModels, setAvailableModels] = useState([]);
    const [model1Config, setModel1Config] = useState(() => {
        const stored = localStorage.getItem('ai-discuss-model1');
        return stored ? JSON.parse(stored) : {
            model: '',
            profile: '',
            name: ''
        };
    });
    const [model2Config, setModel2Config] = useState(() => {
        const stored = localStorage.getItem('ai-discuss-model2');
        return stored ? JSON.parse(stored) : {
            model: '',
            profile: '',
            name: ''
        };
    });
    const [topic, setTopic] = useState(() => {
        return localStorage.getItem('ai-discuss-topic') || '';
    });
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [modelFetchError, setModelFetchError] = useState(null);    useEffect(() => {
        localStorage.setItem('ai-discuss-ollama-url', ollamaServerUrl);
    }, [ollamaServerUrl]);

    useEffect(() => {
        localStorage.setItem('ai-discuss-ollama-api-key', ollamaApiKey);
    }, [ollamaApiKey]);    // Fetch models on component mount
    useEffect(() => {
        fetchAvailableModels();
    }, []);

    useEffect(() => {
        localStorage.setItem('ai-discuss-model1', JSON.stringify(model1Config));
    }, [model1Config]);

    useEffect(() => {
        localStorage.setItem('ai-discuss-model2', JSON.stringify(model2Config));
    }, [model2Config]);

    useEffect(() => {
        localStorage.setItem('ai-discuss-topic', topic);
    }, [topic]);    const fetchAvailableModels = async () => {
        setIsLoadingModels(true);
        setModelFetchError(null);
        try {
            const headers = {};
            
            if (ollamaApiKey && ollamaApiKey.trim()) {
                headers['X-API-Key'] = ollamaApiKey.trim();
            }
            console.log("Headers:", headers);
            const response = await fetch(`${ollamaServerUrl}/api/tags`, {
                headers
            });
            
            if (response.ok) {
                const data = await response.json();
                setAvailableModels(data.models || []);
            } else {
                setAvailableModels([]);
                setModelFetchError(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
            setAvailableModels([]);
            setModelFetchError(error.message);
        } finally {
            setIsLoadingModels(false);
        }
    };    const handleServerUrlKeyPress = (e) => {
        if (e.key === 'Enter') {
            fetchAvailableModels();
        }
    };

    const handleApiKeyKeyPress = (e) => {
        if (e.key === 'Enter') {
            fetchAvailableModels();
        }
    };    const handleModel1Change = (field, value) => {
        setModel1Config(prev => ({ ...prev, [field]: value }));
    };

    const handleModel2Change = (field, value) => {
        setModel2Config(prev => ({ ...prev, [field]: value }));
    };

    const canStartDiscussion = () => {
        return topic.trim() && 
               model1Config.model && 
               model1Config.name.trim() && 
               model2Config.model && 
               model2Config.name.trim();
    };    const handleStartDiscussion = () => {
        if (canStartDiscussion()) {
            onStartDiscussion({
                ollamaServerUrl,
                ollamaApiKey,
                topic: topic.trim(),
                model1: model1Config,
                model2: model2Config
            });
        }
    };

    return (
        <div className="topic-page">
            <div className="config-container">
                <h2>Discussion Configuration</h2>                {/* Ollama Server URL */}
                <div className="config-section">
                    <label htmlFor="ollama-url">Ollama Server URL:</label>
                    <div className="url-input-container">
                        <input
                            id="ollama-url"
                            type="text"
                            value={ollamaServerUrl}
                            onChange={(e) => setOllamaServerUrl(e.target.value)}
                            onKeyPress={handleServerUrlKeyPress}
                            placeholder="http://localhost:11434"
                        />
                        {isLoadingModels && <span className="loading-text">Loading models...</span>}
                        {!isLoadingModels && !modelFetchError && availableModels.length > 0 && (
                            <span className="success-text">✅ {availableModels.length} models available</span>
                        )}
                    </div>
                </div>{/* Ollama API Key */}
                <div className="config-section">
                    <label htmlFor="ollama-api-key">API Key (optional):</label>
                    <input
                        id="ollama-api-key"
                        type="password"
                        value={ollamaApiKey}
                        onChange={(e) => setOllamaApiKey(e.target.value)}
                        onKeyPress={handleApiKeyKeyPress}
                        placeholder="Enter API key if required by your Ollama server..."
                    />
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button 
                            type="button"
                            onClick={fetchAvailableModels}
                            disabled={isLoadingModels}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isLoadingModels ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                opacity: isLoadingModels ? 0.6 : 1
                            }}
                        >
                            {isLoadingModels ? 'Testing...' : 'Test Connection'}
                        </button>
                        <small style={{ color: '#718096', fontSize: '0.875rem' }}>
                            or press Enter in either field above
                        </small>
                    </div>
                </div>

                {/* Show CORS help only when model fetch fails */}
                {modelFetchError && (
                    <div className="config-section error-section">
                        <div className="error-message">
                            <strong>⚠️ Failed to connect to Ollama server:</strong> {modelFetchError}
                        </div>
                        <div className="url-help">
                            <small>
                                💡 For GitHub Pages deployment, ensure your Ollama server allows CORS. 
                                Set <code>OLLAMA_ORIGINS=https://*.tremech.us</code> environment variable before starting Ollama.
                                <br />
                                📦 For Docker: <code>docker run -e OLLAMA_ORIGINS="https://*.tremech.us" ollama/ollama</code>
                            </small>
                        </div>
                    </div>
                )}

                {/* Topic */}
                <div className="config-section">
                    <label htmlFor="topic">Discussion Topic:</label>
                    <textarea
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter the topic you'd like the AI models to discuss..."
                        rows={3}
                    />
                </div>

                {/* Model 1 Configuration */}
                <div className="config-section model-config">
                    <h3>Model 1 Configuration</h3>
                    
                    <div className="form-group">
                        <label htmlFor="model1-select">Model:</label>
                        <select
                            id="model1-select"
                            value={model1Config.model}
                            onChange={(e) => handleModel1Change('model', e.target.value)}
                        >
                            <option value="">Select a model...</option>
                            {availableModels.map(model => (
                                <option key={model.name} value={model.name}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="model1-name">Participant Name:</label>
                        <input
                            id="model1-name"
                            type="text"
                            value={model1Config.name}
                            onChange={(e) => handleModel1Change('name', e.target.value)}
                            placeholder="Enter a name for this participant..."
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="model1-profile">Profile (Initial Prompt):</label>
                        <textarea
                            id="model1-profile"
                            value={model1Config.profile}
                            onChange={(e) => handleModel1Change('profile', e.target.value)}
                            placeholder="Describe the personality or perspective for this participant..."
                            rows={4}
                        />
                    </div>
                </div>

                {/* Model 2 Configuration */}
                <div className="config-section model-config">
                    <h3>Model 2 Configuration</h3>
                    
                    <div className="form-group">
                        <label htmlFor="model2-select">Model:</label>
                        <select
                            id="model2-select"
                            value={model2Config.model}
                            onChange={(e) => handleModel2Change('model', e.target.value)}
                        >
                            <option value="">Select a model...</option>
                            {availableModels.map(model => (
                                <option key={model.name} value={model.name}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="model2-name">Participant Name:</label>
                        <input
                            id="model2-name"
                            type="text"
                            value={model2Config.name}
                            onChange={(e) => handleModel2Change('name', e.target.value)}
                            placeholder="Enter a name for this participant..."
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="model2-profile">Profile (Initial Prompt):</label>
                        <textarea
                            id="model2-profile"
                            value={model2Config.profile}
                            onChange={(e) => handleModel2Change('profile', e.target.value)}
                            placeholder="Describe the personality or perspective for this participant..."
                            rows={4}
                        />
                    </div>
                </div>

                {/* Start Discussion Button */}
                <div className="config-section">
                    <button 
                        className={`start-discussion-btn ${canStartDiscussion() ? 'enabled' : 'disabled'}`}
                        onClick={handleStartDiscussion}
                        disabled={!canStartDiscussion()}
                    >
                        Begin Discussion
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TopicPage;
