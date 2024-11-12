// const axios = require('axios');

// const fetchValorantRank = async (playerTag, playerName, region) => {
//     try {
//         const apiKey = 'bdd6cad2-d07a-4d8c-a9b2-50bb1767b669';  // Replace with your API key
//         const url = `https://public-api.tracker.gg/v2/valorant/standard/profile/riot/${playerName}%23${playerTag}?region=${region}`;

//         const response = await axios.get(url, {
//             headers: {
//                 'TRN-Api-Key': apiKey
//             }
//         });

//         const rank = response.data.data.segments[0].stats.rank.metadata.tierName;
//         console.log(`Player Rank: ${rank}`);
//         return rank;
//     } catch (error) {
//         console.error('Error fetching Valorant rank:', error);
//     }
// };

// fetchValorantRank('CS2', 'S4M', 'ap');  // Replace with actual Riot ID and region (e.g., 'ap' for Asia Pacific)


const axios = require('axios');

const fetchValorantAccountInfo = async (playerName, playerTag) => {
    const apiKey = 'bdd6cad2-d07a-4d8c-a9b2-50bb1767b669'; // Replace with your actual Tracker.gg API key
    const url = `https://public-api.tracker.gg/v2/valorant/standard/profile/riot/${playerName}%23${playerTag}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'TRN-Api-Key': apiKey
            }
        });

        // Extract necessary data
        const data = response.data.data;
        console.log("Player Info:", data);

        // For example, access rank or other specific stats:
        const rank = data.segments[0].stats.rank.metadata.tierName;
        console.log(`Player Rank: ${rank}`);
        return data;  // Return the full data if needed

    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.error('Invalid authentication credentials. Check your API key.');
        } else if (error.response && error.response.status === 404) {
            console.error('Player not found. Check the player name and tag.');
        } else {
            console.error('An error occurred:', error.message);
        }
    }
};

// Usage example
fetchValorantAccountInfo('S4M', 'CS2');  // Replace with actual player name and tag
