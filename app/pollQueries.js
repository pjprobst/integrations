import { fetchGithub } from "./fetchGithub.js";
import { fetchHardcover } from "./fetchHardcover.js";
import { fetchSubstack } from "./fetchSubstack.js";
import { fetchLeetcode } from "./fetchLeetcode.js";
import { fetchYoutube } from "./fetchYoutube.js";
import database from "./database.js";
import env from "./env.js";
import express from "express";
import cors from "cors";

const requiredVariables = [
    'GITHUB_PAT',
    'HARDCOVER_API_KEY',
    'YOUTUBE_API_KEY'
];

for (const variable of requiredVariables) {
    if (!env[variable]) {
        throw new Error(`Missing environment variable: ${variable}`);
    }
}

const app = express();
const port = env.PORT || 8080;

let activities = [];

let clients = new Set();

const compare = (a, b) => {
    if (a.datetime > b.datetime) {
        return -1;
    }
    else if (a.datetime < b.datetime) {
        return 1;
    }
    else {
        return 0;
    }
}

const allowedOrigins = (env.FRONTEND_ORIGINS || 'http://localhost:3000').split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
    origin: allowedOrigins
}));

const getVideos = database.prepare(`
    SELECT * FROM youtube
    ORDER BY postedAt DESC
`);

const getWritings = database.prepare(`
    SELECT * FROM substack
    ORDER BY postedAt DESC
`);

const getReadings = database.prepare(`
    SELECT * FROM hardcover
    ORDER BY updatedAt DESC
`);

let substackActivity = [];
fetchSubstack((newActivity) => {
    substackActivity = newActivity;
    fetchActivity((newActivities) => {
        activities = newActivities;
    });
});

let youtubeActivity = [];
fetchYoutube((newActivity) => {
    youtubeActivity = newActivity;
    fetchActivity((newActivities) => {
        activities = newActivities;
    });
});

let githubActivity = [];
fetchGithub((newActivity) => {
    githubActivity = newActivity;
    fetchActivity((newActivities) => {
        activities = newActivities;
    });
});

let hardcoverActivity = [];
fetchHardcover((newActivity) => {
    hardcoverActivity = newActivity;
    fetchActivity((newActivities) => {
        activities = newActivities;
    });
});

let leetcodeActivity = [];
fetchLeetcode((newActivity) => {
    leetcodeActivity = newActivity;
    fetchActivity((newActivities) => {
        activities = newActivities;
    });
});

function fetchActivity(onUpdate) {
    activities = [...substackActivity, ...youtubeActivity, ...githubActivity, ...hardcoverActivity, ...leetcodeActivity];

    activities.sort(compare);

    for (const client of clients) {
        client.write(`event: activities\n`);
        client.write(`data: ${JSON.stringify(activities)}\n\n`);
    }

    onUpdate(activities);
}

app.get('/readings', (req, res) => {
    res.json(getReadings.all());
});

app.get('/videos', (req, res) => {
    res.json(getVideos.all());
});

app.get('/writings', (req, res) => {
    res.json(getWritings.all());
});

app.get('/activities', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.add(res);
    res.write(`event: activities\n`);
    res.write(`data: ${JSON.stringify(activities)}\n\n`);

    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(res);
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`listening on port ${port}`);
});
