const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { uniqueNamesGenerator, adjectives, animals } = require('unique-names-generator');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TOPICS_FILE = path.join(DATA_DIR, 'topics.json');
const DEBATES_FILE = path.join(DATA_DIR, 'debates.json');

// Helper function to read JSON file
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        console.log(`[READ] ${filePath}`);
        return JSON.parse(data);
    } catch (error) {
        console.error(`[ERROR][READ] ${filePath}:`, error);
        return null;
    }
}

// Helper function to write JSON file
async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`[WRITE] ${filePath}`);
        return true;
    } catch (error) {
        console.error(`[ERROR][WRITE] ${filePath}:`, error);
        return false;
    }
}

// Helper function to generate random user name
function generateUserName() {
    return uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: ' ',
        style: 'capital'
    });
}

// Helper function to check debate status
function getDebateStatus(startDate, endDate) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now > end) return 'expired';
    if (now < start) return 'scheduled';
    return 'active';
}

// API Endpoints

// Get or create anonymous user
app.post('/api/users/anonymous', async (req, res) => {
    try {
        const data = await readJsonFile(USERS_FILE);
        console.log('Current users:', data);
        const userId = uuidv4();
        const userName = generateUserName();
        
        const newUser = {
            id: userId,
            name: userName,
            createdAt: new Date().toISOString()
        };
        
        data.users.push(newUser);
        console.log('Adding new user:', newUser);
        await writeJsonFile(USERS_FILE, data);
        
        res.json({ userId, userName });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Get user by ID
app.get('/api/users/:userId', async (req, res) => {
    try {
        const data = await readJsonFile(USERS_FILE);
        const user = data.users.find(u => u.id === req.params.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Get all topics
app.get('/api/topics', async (req, res) => {
    try {
        const data = await readJsonFile(TOPICS_FILE);
        res.json(data.topics);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ error: 'Failed to fetch topics' });
    }
});

// Create new topic
app.post('/api/topics', async (req, res) => {
    try {
        const topicsData = await readJsonFile(TOPICS_FILE);
        const debatesData = await readJsonFile(DEBATES_FILE);
        const { title, description, category, startDate, endDate } = req.body;
        
        const newTopic = {
            id: topicsData.topics.length + 1,
            title,
            description,
            category,
            votes: 0
        };
        
        const newDebate = {
            id: debatesData.debates.length + 1,
            topicId: newTopic.id,
            title,
            category,
            status: getDebateStatus(startDate, endDate),
            startDate,
            endDate,
            participants: [],
            comments: []
        };
        
        topicsData.topics.push(newTopic);
        debatesData.debates.push(newDebate);
        
        await writeJsonFile(TOPICS_FILE, topicsData);
        await writeJsonFile(DEBATES_FILE, debatesData);
        
        res.status(201).json({ topic: newTopic, debate: newDebate });
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({ error: 'Failed to create topic' });
    }
});

// Get all debates with status check
app.get('/api/debates', async (req, res) => {
    try {
        const data = await readJsonFile(DEBATES_FILE);
        
        // Update status of all debates
        let hasChanges = false;
        data.debates.forEach(debate => {
            const newStatus = getDebateStatus(debate.startDate, debate.endDate);
            if (debate.status !== newStatus) {
                debate.status = newStatus;
                hasChanges = true;
            }
        });
        
        // Save changes if any debates were updated
        if (hasChanges) {
            await writeJsonFile(DEBATES_FILE, data);
        }
        
        res.json(data.debates);
    } catch (error) {
        console.error('Error fetching debates:', error);
        res.status(500).json({ error: 'Failed to fetch debates' });
    }
});

// Create new debate
app.post('/api/debates', async (req, res) => {
    try {
        const data = await readJsonFile(DEBATES_FILE);
        const { title, category, startDate, endDate } = req.body;
        
        const newDebate = {
            id: data.debates.length + 1,
            category,
            title,
            status: getDebateStatus(startDate, endDate),
            startDate,
            endDate,
            participants: [],
            comments: []
        };
        
        data.debates.push(newDebate);
        await writeJsonFile(DEBATES_FILE, data);
        
        res.status(201).json(newDebate);
    } catch (error) {
        console.error('Error creating debate:', error);
        res.status(500).json({ error: 'Failed to create debate' });
    }
});

// Join debate
app.post('/api/debates/:debateId/join', async (req, res) => {
    try {
        const { debateId } = req.params;
        const { userId } = req.body;
        
        const debatesData = await readJsonFile(DEBATES_FILE);
        const usersData = await readJsonFile(USERS_FILE);
        
        const debate = debatesData.debates.find(d => d.id.toString() === debateId);
        if (!debate) {
            return res.status(404).json({ error: 'Debate not found' });
        }
        
        const user = usersData.users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (!debate.participants.includes(userId)) {
            debate.participants.push(userId);
            await writeJsonFile(DEBATES_FILE, debatesData);
        }
        
        res.json(debate);
    } catch (error) {
        console.error('Error joining debate:', error);
        res.status(500).json({ error: 'Failed to join debate' });
    }
});

// Add comment to debate
app.post('/api/debates/:debateId/comments', async (req, res) => {
    try {
        const { debateId } = req.params;
        const { userId, text } = req.body;
        
        const debatesData = await readJsonFile(DEBATES_FILE);
        const usersData = await readJsonFile(USERS_FILE);
        
        const debate = debatesData.debates.find(d => d.id.toString() === debateId);
        if (!debate) {
            return res.status(404).json({ error: 'Debate not found' });
        }
        
        const user = usersData.users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const newComment = {
            id: debate.comments.length + 1,
            userId,
            author: user.name,
            content: text,
            date: new Date().toISOString()
        };
        
        debate.comments.push(newComment);
        await writeJsonFile(DEBATES_FILE, debatesData);
        
        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Vote on topic
app.post('/api/topics/:topicId/vote', async (req, res) => {
    try {
        const { topicId } = req.params;
        const { userId } = req.body;
        
        const topicsData = await readJsonFile(TOPICS_FILE);
        const usersData = await readJsonFile(USERS_FILE);
        
        const topic = topicsData.topics.find(t => t.id === parseInt(topicId));
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        const user = usersData.users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        topic.votes += 1;
        await writeJsonFile(TOPICS_FILE, topicsData);
        
        res.json(topic);
    } catch (error) {
        console.error('Error voting on topic:', error);
        res.status(500).json({ error: 'Failed to vote on topic' });
    }
});

// Search topics and debates
app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        const topicsData = await readJsonFile(TOPICS_FILE);
        const debatesData = await readJsonFile(DEBATES_FILE);
        
        const matchingTopics = topicsData.topics.filter(topic =>
            topic.title.toLowerCase().includes(query.toLowerCase()) ||
            topic.description.toLowerCase().includes(query.toLowerCase())
        );
        
        const matchingDebates = debatesData.debates.filter(debate =>
            debate.title.toLowerCase().includes(query.toLowerCase())
        );
        
        res.json({
            topics: matchingTopics,
            debates: matchingDebates
        });
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Failed to search' });
    }
});

// Get all users
app.get('/api/users', (req, res) => {
    try {
        const users = readJsonFile(USERS_FILE);
        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Get comments for a debate
app.get('/api/debates/:debateId/comments', async (req, res) => {
    try {
        const { debateId } = req.params;
        const debatesData = await readJsonFile(DEBATES_FILE);
        
        const debate = debatesData.debates.find(d => d.id.toString() === debateId);
        if (!debate) {
            return res.status(404).json({ error: 'Debate not found' });
        }
        
        res.json(debate.comments || []);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 