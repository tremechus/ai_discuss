import React, { useState } from 'react';
import TopicPage from './components/TopicPage';
import DiscussionPage from './components/DiscussionPage';
import './styles/App.css';

function App() {
    const [currentPage, setCurrentPage] = useState('topic');
    const [discussionConfig, setDiscussionConfig] = useState(null);

    const handleStartDiscussion = (config) => {
        setDiscussionConfig(config);
        setCurrentPage('discussion');
    };

    const handleNewTopic = () => {
        setCurrentPage('topic');
        setDiscussionConfig(null);
    };

    return (
        <div className="App">
            <header className="app-header">
                <h1>AI Discuss</h1>
                <p>Watch AI models engage in thoughtful discussions</p>
            </header>
            <main>
                {currentPage === 'topic' ? (
                    <TopicPage onStartDiscussion={handleStartDiscussion} />
                ) : (
                    <DiscussionPage 
                        config={discussionConfig} 
                        onNewTopic={handleNewTopic}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
