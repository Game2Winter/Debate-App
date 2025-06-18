// Global variables
let currentUser = null;
let currentDebate = null;
let initRetryCount = 0;
const MAX_RETRIES = 3;

// Generate a random name
function generateRandomName() {
    const adjectives = [
        'Famous', 'Cognitive', 'Unpleasant', 'Statistical', 'Registered',
        'Raw', 'Prickly', 'Objective', 'Yeasty', 'Heavy', 'Shiny',
        'Embarrassed', 'Forward', 'Responsible', 'Overwhelming', 'Uptight'
    ];
    const nouns = [
        'Mole', 'Bird', 'Fox', 'Lobster', 'Angelfish', 'Haddock',
        'Ferret', 'Mouse', 'Beetle', 'Manatee', 'Frog', 'Chimpanzee',
        'Louse', 'Rabbit', 'Rattlesnake', 'Gull'
    ];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdjective} ${randomNoun}`;
}

// Initialize the app
async function init() {
    try {
        // Check if server is ready
        const serverCheck = await fetch('/api/health');
        if (!serverCheck.ok) {
            throw new Error('Server not ready');
        }

        // Check if we have a stored user
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            document.getElementById('userName').textContent = currentUser.name;
        } else {
            // Create a new user
            const response = await fetch('/api/users/anonymous', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to create user');
            }
            
            const userData = await response.json();
            currentUser = {
                id: userData.userId,
                name: userData.userName,
                createdAt: new Date().toISOString()
            };
            // Store user in localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('userName').textContent = currentUser.name;
        }
        
        // Show the create topic section by default
        showCreateTopic();
        
        // Fetch initial debates
        await fetchDebates();

        // Reset retry count on success
        initRetryCount = 0;
    } catch (error) {
        console.error('Error initializing app:', error);
        
        // Retry initialization if we haven't exceeded max retries
        if (initRetryCount < MAX_RETRIES) {
            initRetryCount++;
            console.log(`Retrying initialization (${initRetryCount}/${MAX_RETRIES})...`);
            setTimeout(init, 2000); // Wait 2 seconds before retrying
        } else {
            // Show a more helpful error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.innerHTML = `
                <h3>Connection Error</h3>
                <p>Unable to connect to the server. Please check that:</p>
                <ul>
                    <li>The server is running</li>
                    <li>You have a stable internet connection</li>
                    <li>You're not being blocked by a firewall</li>
                </ul>
                <button onclick="retryInit()">Retry Connection</button>
            `;
            document.body.appendChild(errorMessage);
        }
    }
}

// Function to retry initialization
function retryInit() {
    // Remove error message if it exists
    const errorMessage = document.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
    
    // Reset retry count and try again
    initRetryCount = 0;
    init();
}

// Show create topic section
function showCreateTopic() {
    document.getElementById('createTopicSection').classList.remove('hidden');
    document.getElementById('activeDebatesSection').classList.add('hidden');
    document.getElementById('chatroomSection').classList.add('hidden');
}

// Show active debates section
async function showActiveDebates() {
    document.getElementById('createTopicSection').classList.add('hidden');
    document.getElementById('activeDebatesSection').classList.remove('hidden');
    document.getElementById('chatroomSection').classList.add('hidden');
    
    await fetchDebates();
}

// Fetch and display debates
async function fetchDebates() {
    try {
        const response = await fetch('/api/debates');
        if (!response.ok) throw new Error('Failed to fetch debates');
        
        const debates = await response.json();
        const debatesList = document.getElementById('debatesList');
        const activeOnlyToggle = document.getElementById('activeOnlyToggle');
        
        // Filter debates based on toggle state
        const filteredDebates = activeOnlyToggle.checked 
            ? debates.filter(debate => debate.status === 'active')
            : debates;
        
        if (filteredDebates.length === 0) {
            debatesList.innerHTML = '<p class="no-debates">No debates found</p>';
            return;
        }
        
        debatesList.innerHTML = filteredDebates.map(debate => `
            <div class="debate-card">
                <h3>${debate.title}</h3>
                <div class="debate-info">
                    <span class="category">${debate.category}</span>
                    <span class="status ${debate.status}">${debate.status}</span>
                </div>
                <div class="debate-dates">
                    <p>From: ${new Date(debate.startDate).toLocaleDateString()}</p>
                    <p>To: ${new Date(debate.endDate).toLocaleDateString()}</p>
                </div>
                <p class="participants">Participants: ${debate.participants.length}</p>
                ${debate.status === 'active' ? 
                    `<button class="join-btn" onclick="joinDebate('${debate.id}')">Join Debate</button>` :
                    `<button class="join-btn disabled" disabled>${debate.status === 'expired' ? 'Debate Ended' : 'Not Started'}</button>`
                }
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching debates:', error);
        const debatesList = document.getElementById('debatesList');
        debatesList.innerHTML = '<p class="error">Failed to load debates. Please try again.</p>';
    }
}

// Create new topic
async function createTopic(event) {
    event.preventDefault();
    
    const topicData = {
        title: document.getElementById('topicTitle').value,
        description: document.getElementById('topicDescription').value,
        category: document.getElementById('topicCategory').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value
    };
    
    try {
        const response = await fetch('/api/topics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(topicData)
        });
        
        if (!response.ok) throw new Error('Failed to create topic');
        
        document.getElementById('topicForm').reset();
        showActiveDebates();
    } catch (error) {
        console.error('Error creating topic:', error);
        alert('Failed to create topic. Please try again.');
    }
}

// Join a debate
async function joinDebate(debateId) {
    if (!currentUser || !currentUser.id) {
        console.error('No user found. Reinitializing...');
        await init();
        if (!currentUser || !currentUser.id) {
            alert('Unable to join debate. Please refresh the page and try again.');
            return;
        }
    }

    try {
        const response = await fetch(`/api/debates/${debateId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id })
        });
        
        if (!response.ok) throw new Error('Failed to join debate');
        
        showChatroom(debateId);
    } catch (error) {
        console.error('Error joining debate:', error);
        alert('Failed to join debate. Please try again.');
    }
}

// Show chatroom
async function showChatroom(debateId) {
    document.getElementById('createTopicSection').classList.add('hidden');
    document.getElementById('activeDebatesSection').classList.add('hidden');
    document.getElementById('chatroomSection').classList.remove('hidden');
    
    currentDebate = debateId;
    await loadComments();
    
    // Start polling for new comments
    if (window.commentPollingInterval) {
        clearInterval(window.commentPollingInterval);
    }
    window.commentPollingInterval = setInterval(loadComments, 5000);
}

// Load comments
async function loadComments() {
    if (!currentDebate) return;
    
    try {
        const response = await fetch(`/api/debates/${currentDebate}/comments`);
        if (!response.ok) throw new Error('Failed to fetch comments');
        
        const comments = await response.json();
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = ''; // Clear existing comments
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }
        
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <div class="comment-header">
                    <strong>${comment.author}</strong>
                    <small>${new Date(comment.date).toLocaleString()}</small>
                </div>
                <p class="comment-content">${comment.content}</p>
            `;
            commentsList.appendChild(commentElement);
        });
        
        // Scroll to bottom
        commentsList.scrollTop = commentsList.scrollHeight;
    } catch (error) {
        console.error('Error loading comments:', error);
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = '<p class="error">Failed to load comments. Please try again.</p>';
    }
}

// Submit comment
async function submitComment(event) {
    event.preventDefault();
    
    if (!currentUser || !currentUser.id) {
        alert('You must be logged in to comment');
        return;
    }
    
    const commentInput = document.getElementById('commentText');
    const text = commentInput.value.trim();
    
    if (!text) {
        alert('Please enter a comment');
        return;
    }
    
    try {
        const response = await fetch(`/api/debates/${currentDebate}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                text: text
            })
        });
        
        if (!response.ok) throw new Error('Failed to post comment');
        
        // Clear the input
        commentInput.value = '';
        
        // Reload comments
        await loadComments();
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', init);
document.getElementById('topicForm').addEventListener('submit', createTopic);
document.getElementById('commentForm').addEventListener('submit', submitComment);
document.getElementById('activeOnlyToggle').addEventListener('change', fetchDebates); 