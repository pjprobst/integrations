import express from "express";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
const port = 8080;

app.use(cors({
    origin: 'http://localhost:3000'
}));

dotenv.config({path: '.env'});

const apiKey = process.env.SUBSTACK_API_KEY;

async function pollSubstack() {
    // debug
    console.log('\n' + 'polling...');
    const start = new Date();

    const aWeekAgo = new Date(Date.now()-604800000);

    const checkRecent = (entry) => {
        return entry.datetime >= aWeekAgo;
    }

    const compare = (a, b) => {
        if (a.datetime > b.datetime) {
            return -1;
        }
        else if (a.datetime < b.datetime) {
            return 1;
        }
        else {
            if (a.url > b.url) {
                return -1;
            }
            else if (a.url < b.url) {
                return 1;
            }
            else {
                return 0;
            }
        }
    }

    const options = {
        method: 'GET',
        headers: {'X-API-Key': apiKey}
      };
      
    const res = await fetch('https://api.substackapi.dev/posts/latest?limit=10&publication_url=https%3A%2F%2Fprestonpro.substack.com%2F', options);

    const body = await res.json();

    for (const entry of body.data) {
        const url = entry.url;
        const title = entry.title;
        if (!(blogposts.has(url))) {
            const datetime = new Date(entry.date);
            const date = (datetime.getMonth()+1).toString().padStart(2, '0') + "." + datetime.getDate().toString().padStart(2, '0') + "." + datetime.getFullYear();
            const time =  datetime.getHours().toString().padStart(2, '0') + ":" + datetime.getMinutes().toString().padStart(2, '0') + ":" + datetime.getSeconds().toString().padStart(2, '0');
            blogposts.set(url, [title, datetime]);
            substackActivity.push({
                type: 'substack',
                event: 'Wrote a blog post',
                date: date,
                time: time,
                datetime: datetime,
                title: title,
                url: url,
            });
        }
    }

    substackActivity = substackActivity.filter(checkRecent);

    substackActivity.sort(compare);

    blogposts = new Map ([...blogposts.entries()].sort((a, b) => b[1][1] - a[1][1]));

    for (const client of clients) {
        client.write(`event: substackActivity\n`);
        client.write(`data: ${JSON.stringify(substackActivity)}\n\n`);

        client.write(`event: substackPosts\n`);
        client.write(`data: ${JSON.stringify([...blogposts.entries()])}\n\n`);
    };

    // debug
    const end = new Date();
    console.log(`fetched in ${end-start}ms`);

    return [substackActivity, blogposts];
}

async function pollingLoop(refresh) {
    try {
        [substackActivity, blogposts] = await pollSubstack();
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
    return [substackActivity, blogposts];
}

const pollingCadence = 10000;

let checkExpBackoff = 0;

let substackActivity = [];
let blogposts = new Map();

const clients = new Set();

[substackActivity, blogposts] = await pollingLoop(pollingCadence);

app.get('/data', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.add(res);
    res.write(`event: substackActivity\n`);
    res.write(`data: ${JSON.stringify(substackActivity)}\n\n`);

    res.write(`event: substackPosts\n`);
    res.write(`data: ${JSON.stringify([...blogposts.entries()])}\n\n`);

    req.on('close', () => {
        clients.delete(res);
    });
});

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});
