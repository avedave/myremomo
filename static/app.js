document.addEventListener('DOMContentLoaded', () => {
    const modelListContainer = document.getElementById('model-list');
    
    let activeModel = '';
    let modelsData = [];
    let favorites = JSON.parse(localStorage.getItem('ollama_favorites') || '[]');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatForm = document.getElementById('chat-form');
    const chatMessages = document.getElementById('chat-messages');
    const newChatBtn = document.getElementById('new-chat-btn');
    const mobileModelName = document.getElementById('mobile-model-name');
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.querySelector('.sidebar');

    let chatHistory = [];
    let isGenerating = false;

    // Mobile Menu Toggle
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !menuBtn.contains(e.target) && 
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value.trim().length > 0 && activeModel && !isGenerating) {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    });

    // Handle Enter to send (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.hasAttribute('disabled')) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Update Input State based on active model
    function updateInputState() {
        if (activeModel) {
            messageInput.removeAttribute('disabled');
            mobileModelName.textContent = activeModel;
            if (messageInput.value.trim().length > 0 && !isGenerating) {
                sendBtn.removeAttribute('disabled');
            }
        } else {
            messageInput.setAttribute('disabled', 'true');
            mobileModelName.textContent = 'myremomo';
        }
    }

    // Render Models List
    function renderModels() {
        modelListContainer.innerHTML = '';
        
        // Sort alphabetically first
        const sortedModels = [...modelsData].sort((a, b) => a.name.localeCompare(b.name));

        const activeModels = sortedModels.filter(m => m.name === activeModel);
        const favoriteModels = sortedModels.filter(m => favorites.includes(m.name));
        const otherModels = sortedModels.filter(m => !favorites.includes(m.name) && m.name !== activeModel);

        function createSectionHeader(title) {
            const header = document.createElement('div');
            header.className = 'model-section-title';
            header.textContent = title;
            return header;
        }

        function createModelItem(model) {
            const isFav = favorites.includes(model.name);
            const isActive = activeModel === model.name;
            
            const item = document.createElement('div');
            item.className = `model-item ${isActive ? 'active' : ''}`;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'model-name';
            nameSpan.textContent = model.name;
            nameSpan.title = model.name;
            
            const favBtn = document.createElement('button');
            favBtn.className = `favorite-btn ${isFav ? 'active' : ''}`;
            favBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="${isFav ? 'currentColor' : 'none'}" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
            `;
            
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(model.name);
            });
            
            item.addEventListener('click', () => {
                selectModel(model.name);
            });
            
            item.appendChild(nameSpan);
            item.appendChild(favBtn);
            return item;
        }

        if (activeModels.length > 0) {
            modelListContainer.appendChild(createSectionHeader('Active Model'));
            modelListContainer.appendChild(createModelItem(activeModels[0]));
        }

        if (favoriteModels.length > 0) {
            modelListContainer.appendChild(createSectionHeader('Favorites'));
            favoriteModels.forEach(m => modelListContainer.appendChild(createModelItem(m)));
        }

        if (otherModels.length > 0) {
            modelListContainer.appendChild(createSectionHeader('Other Models'));
            otherModels.forEach(m => modelListContainer.appendChild(createModelItem(m)));
        }
    }

    function toggleFavorite(modelName) {
        if (favorites.includes(modelName)) {
            favorites = favorites.filter(m => m !== modelName);
        } else {
            favorites.push(modelName);
        }
        localStorage.setItem('ollama_favorites', JSON.stringify(favorites));
        renderModels();
    }

    function selectModel(modelName) {
        activeModel = modelName;
        renderModels();
        updateInputState();
        messageInput.focus();
    }

    // Fetch models
    async function loadModels() {
        try {
            const response = await fetch('/api/models');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            if (data.models && data.models.length > 0) {
                modelsData = data.models;
                if (!activeModel || !modelsData.find(m => m.name === activeModel)) {
                    const favsInList = modelsData.filter(m => favorites.includes(m.name));
                    if (favsInList.length > 0) {
                        activeModel = favsInList[0].name;
                    } else {
                        activeModel = modelsData[0].name;
                    }
                    updateInputState();
                }
                renderModels();
            } else {
                modelListContainer.innerHTML = '<div class="loading-text">No models found</div>';
            }
        } catch (error) {
            console.error('Error fetching models:', error);
            modelListContainer.innerHTML = '<div class="loading-text">Error loading models</div>';
        }
    }

    newChatBtn.addEventListener('click', () => {
        chatHistory = [];
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon"></div>
                <h1>How can I help you today?</h1>
                <p>${activeModel ? 'Start chatting below.' : 'Select a model from the sidebar to begin.'}</p>
            </div>
        `;
        messageInput.value = '';
        messageInput.style.height = 'auto';
        messageInput.focus();
    });

    // Scroll to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add message to UI
    function appendMessage(role, content) {
        // Remove welcome message if it exists
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) welcomeMsg.remove();

        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = `avatar ${role === 'user' ? 'user-avatar' : 'ai-avatar'}`;
        avatar.textContent = role === 'user' ? 'U' : 'AI';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (role === 'user') {
            contentDiv.textContent = content;
        } else {
            // Setup markdown parsing container
            contentDiv.innerHTML = marked.parse(content);
        }

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        scrollToBottom();

        return contentDiv;
    }

    function addTypingIndicator() {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai typing-message';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar ai-avatar';
        avatar.textContent = 'AI';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        scrollToBottom();

        return msgDiv;
    }

    // Chat form submit
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const model = activeModel;
        const text = messageInput.value.trim();
        
        if (!model || !text || isGenerating) return;

        // UI Updates
        isGenerating = true;
        messageInput.value = '';
        messageInput.style.height = 'auto';
        messageInput.setAttribute('disabled', 'true');
        sendBtn.setAttribute('disabled', 'true');

        // Add to history
        chatHistory.push({ role: 'user', content: text });
        appendMessage('user', text);

        const typingIndicator = addTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: chatHistory
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            typingIndicator.remove();
            
            // Setup streaming
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let aiFullResponse = "";
            let aiContentDiv = appendMessage('ai', '');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.trim() === '') continue;
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.message && parsed.message.content) {
                            aiFullResponse += parsed.message.content;
                            aiContentDiv.innerHTML = marked.parse(aiFullResponse);
                            scrollToBottom();
                        }
                    } catch (e) {
                        console.error('Error parsing JSON line', e, line);
                    }
                }
            }
            
            chatHistory.push({ role: 'assistant', content: aiFullResponse });

        } catch (error) {
            console.error('Chat error:', error);
            typingIndicator.remove();
            appendMessage('ai', 'Sorry, there was an error processing your request.');
        } finally {
            isGenerating = false;
            messageInput.removeAttribute('disabled');
            messageInput.focus();
            if (messageInput.value.trim().length > 0) {
                sendBtn.removeAttribute('disabled');
            }
        }
    });

    // Init
    loadModels();
});
