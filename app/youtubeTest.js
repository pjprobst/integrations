import { google } from "googleapis";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

const app = express();
const port = 8080;

app.use(cors({
    origin: 'http://localhost:3000'
}));

dotenv.config({path: '.env'});
const apiKey = process.env.YOUTUBE_API_KEY;

const youtube = google.youtube({
    version: 'v3', auth: apiKey
});

async function pollYoutube() {
    console.log('\n' + 'polling...');
    
    // debug
    const start = new Date();

    const compare = (a, b) => {
        if (a.datetime > b.datetime) {
            return -1;
        }
        else if (a.datetime < b.datetime) {
            return 1;
        }
        else {
            if (a.id > b.id) {
                return -1;
            }
            else if (a.id < b.id) {
                return 1;
            }
            else {
                return 0;
            }
        }
    }

    const aWeekAgo = new Date(Date.now()-604800000);

    const checkRecent = (entry) => {
        return entry.datetime >= aWeekAgo;
    }

    const res = await youtube.activities.list({
        part: ['snippet', 'contentDetails'],
        channelId: 'UCTyRZedeg9bRGozlGVi45mg',
        maxResults: 50,
    });
    for (const upload of res.data.items) {
        if (upload.snippet.type === 'upload') {
            const id = upload.contentDetails.upload.videoId;
            if (!(videos.has(id))) {
                const datetime = new Date(upload.snippet.publishedAt);
                const date = (datetime.getMonth()+1).toString().padStart(2, '0') + "." + datetime.getDate().toString().padStart(2, '0') + "." + datetime.getFullYear();
                const time =  datetime.getHours().toString().padStart(2, '0') + ":" + datetime.getMinutes().toString().padStart(2, '0') + ":" + datetime.getSeconds().toString().padStart(2, '0');
                const title = upload.snippet.title;
                const url = `https://www.youtube.com/watch?v=${id}`;
                console.log(id, upload.snippet.publishedAt);
                videos.set(id, datetime);
                youtubeActivity.push({
                    type: 'youtube',
                    event: 'Uploaded a YouTube video',
                    date: date,
                    time: time,
                    datetime: datetime,
                    id: id,
                    title: title,
                    url: url,
                })
            }
        }
    }

    youtubeActivity = youtubeActivity.filter(checkRecent);

    youtubeActivity.sort(compare);

    for (const client of clients) {
        client.write(`data: ${JSON.stringify(youtubeActivity)}\n\n`);
    };

    // debug
    const end = new Date();
    console.log(`fetched in ${end-start}ms`);

    console.log(youtubeActivity);
    console.log(videos);

    return youtubeActivity;
}

async function pollingLoop(refresh) {
    try {
        youtubeActivity = await pollYoutube();
        setTimeout(() => pollingLoop(refresh), refresh);
        checkExpBackoff = 0;
    }
    catch(err) {
        checkExpBackoff += 1;
        console.log(`ERROR: ${err}`);

        if (checkExpBackoff >= 5 && checkExpBackoff <= 10) {
            setTimeout(() => pollingLoop(refresh), (refresh/10 * Math.pow(2, checkExpBackoff-4)));
        }
        else if (checkExpBackoff > 10) {
            console.log(`Exponential backoff has exceeded 10, capping exponential backoff at ${(6.4 * refresh) / 1000}s`);
            setTimeout(() => pollingLoop(refresh), 6.4*refresh);
        }
        else {
            setTimeout(() => pollingLoop(refresh), refresh/10);
        }
    }
    return youtubeActivity;
}

const pollingCadence = 10000;

let checkExpBackoff = 0;

const videos = new Map();
let youtubeActivity = [];

const clients = new Set();

youtubeActivity = await pollingLoop(pollingCadence);

app.get('/data', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.add(res);
    res.write(`data: ${JSON.stringify(youtubeActivity)}\n\n`);

    req.on('close', () => {
        clients.delete(res);
    });
});

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});