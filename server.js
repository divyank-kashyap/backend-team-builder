const express = require("express");
const app = express();
const port = 3000;
const mongoose = require("mongoose");

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://admin:0000@cluster0.u8gug.mongodb.net/valorant-team-builder", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.error("MongoDB connection error:", error);
});

const Schema = mongoose.Schema;

const userSchema = new Schema({
    currentRank: Number,
    peakRank: Number,
    mainAgent: String,
    level: Number,
    playerName: String,
    hashtag: String,
    country: String,
    server: String,
    language: String,
    role: { type: String, enum: ['duelist', 'controller', 'initiator', 'sentinel'], required: true } // Added role field
});

const userModel = mongoose.model("users", userSchema);

// POST endpoint to add user
app.post("/user", async (req, res) => {
    const { currentRank, peakRank, mainAgent, level, playerName, hashtag, country, server, language, role } = req.body;

    // Check if all required fields are provided
    if (!currentRank || !peakRank || !mainAgent || !level || !playerName || !hashtag || !country || !server || language === undefined || !role) {
        return res.status(400).json({
            message: "All fields (currentRank, peakRank, mainAgent, level, playerName, hashtag, country, server, language, role) are required."
        });
    }

    try {
        // Check if user with these details already exists
        const userExists = await userModel.findOne({ currentRank, peakRank, mainAgent, level, playerName, hashtag, country, server, language, role });
        
        if (!userExists) {
            // Insert into MongoDB
            await userModel.create({
                currentRank, peakRank, mainAgent, level, playerName, hashtag, country, server, language, role
            });
            res.json({ message: "Data inserted successfully" });
        } else {
            res.status(400).json({ message: "User with these details already exists" });
        }
        
    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
});

// Helper function to calculate match score
const calculateMatchScore = (user, player) => {
    let score = 0;

    // Rank Difference
    const rankDifference = Math.abs(user.currentRank - player.currentRank);
    score += (10 - rankDifference) * 5; // higher score for closer ranks

    // Level Difference
    const levelDifference = Math.abs(user.level - player.level);
    score += (10 - levelDifference) * 3; // higher score for closer levels

    // Preferred Agent
    if (user.mainAgent === player.mainAgent) score += 10; // direct match

    // Country & Server Match
    if (user.country === player.country) score += 15;
    if (user.server === player.server) score += 15;

    // Language Match
    if (user.language === player.language) score += 10;

    return score;
};

// Function to find most suitable players
const findSuitablePlayers = (user, players) => {
    const scoredPlayers = players.map(player => ({
        player,
        score: calculateMatchScore(user, player)
    }));

    // Sort players based on the score
    scoredPlayers.sort((a, b) => b.score - a.score);

    // Separate players by role
    const duelistPlayers = scoredPlayers.filter(player => player.player.role === 'duelist');
    const controllerPlayers = scoredPlayers.filter(player => player.player.role === 'controller');
    const initiatorPlayers = scoredPlayers.filter(player => player.player.role === 'initiator');
    const sentinelPlayers = scoredPlayers.filter(player => player.player.role === 'sentinel');

    // Ensure there is at least one of each role
    if (duelistPlayers.length === 0 || controllerPlayers.length === 0 || initiatorPlayers.length === 0 || sentinelPlayers.length === 0) {
        return []; // Not enough players to form a valid team
    }

    // Build the team with one of each role
    const team = [
        duelistPlayers[0].player, // Top duelist
        controllerPlayers[0].player, // Top controller
        initiatorPlayers[0].player, // Top initiator
        sentinelPlayers[0].player, // Top sentinel
    ];

    // Add one random role (either duelist or sentinel)
    const randomRolePlayers = [...duelistPlayers, ...sentinelPlayers];
    const randomPlayer = randomRolePlayers[Math.floor(Math.random() * randomRolePlayers.length)];

    // Add the random player to the team
    team.push(randomPlayer.player); // Ensure we push the full player object, not just the name

    // Include the user in the team
    team.push(user); // Add the user to the team

    // Remove duplicates from the team (if any)
    const uniqueTeam = Array.from(new Set(team.map(player => player._id)))
        .map(id => team.find(player => player._id === id));

    return uniqueTeam.slice(0, 5); // Ensure only 5 players (including the user) are returned
};

// POST endpoint to get suitable team for user
app.post("/teamMake", async (req, res) => {
    const { currentRank, peakRank, mainAgent, level, playerName, hashtag, country, server, language, role } = req.body;

    // Check if all required fields are provided
    if (!currentRank || !peakRank || !mainAgent || !level || !playerName || !hashtag || !country || !server || language === undefined || !role) {
        return res.status(400).json({
            message: "All fields (currentRank, peakRank, mainAgent, level, playerName, hashtag, country, server, language, role) are required."
        });
    }

    try {
        // Retrieve all players from the database
        const players = await userModel.find({});

        // Find the user making the request
        const user = await userModel.findOne({ playerName, hashtag });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Use the findSuitablePlayers function to calculate the best matches
        const suitablePlayers = findSuitablePlayers(user, players);

        if (suitablePlayers.length === 0) {
            return res.status(400).json({
                message: "Not enough players to form a valid team"
            });
        }

        // Return the full player details in the response
        res.json({
            message: "Most suitable players found",
            suitablePlayers: suitablePlayers
        });

    } catch (error) {
        res.status(500).json({
            message: "An error occurred",
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

module.exports = {
    userModel
};
