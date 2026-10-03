import { fetchGithub } from "./fetchGithub.js";
import { fetchHardcover } from "./fetchHardcover.js";
import { fetchSubstack } from "./fetchSubstack.js";
import { fetchLeetcode } from "./fetchLeetcode.js";
import { fetchYoutube } from "./fetchYoutube.js";
import express from "express";
import cors from "cors";

const app = express();
const port = 8080;

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

app.use(cors({
    origin: 'http://localhost:3000'
}));

let substackActivity = [];
let blogposts = new Map();
fetchSubstack((newActivity, newPosts) => {
    substackActivity = newActivity;
    blogposts = newPosts;
    fetchActivity((newActivities) => {
        activities = newActivities;
    });
});

let youtubeActivity = [];
let videos = new Map();
fetchYoutube((newActivity, newVideos) => {
    youtubeActivity = newActivity;
    videos = newVideos;
    fetchActivity((newActivities) => {
        activities = newActivities;
    });
});

let githubActivity = [];
let actions = new Map();
fetchGithub((newActivity, newActions) => {
    githubActivity = newActivity;
    actions = newActions;
    fetchActivity((newActivities) => {
        activities = newActivities;
    });
});

let hardcoverActivity = [];
let books = new Map();
fetchHardcover((newActivity, newBooks) => {
    hardcoverActivity = newActivity;
    books = newBooks;
    fetchActivity((newActivities) => {
        activities = newActivities;
    });
});

let leetcodeActivity = [];
let solves = new Map();
fetchLeetcode((newActivity, newSolves) => {
    leetcodeActivity = newActivity;
    solves = newSolves;
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

app.get('/data', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.add(res);
    res.write(`event: activities\n`);
    res.write(`data: ${JSON.stringify(activities)}\n\n`);

    /*
    res.write(`event: youtubeVideos\n`);
    res.write(`data: ${JSON.stringify([...blogposts.entries()])}\n\n`);
    */

    req.on('close', () => {
        clients.delete(res);
    });
});

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});