import { request, gql } from "graphql-request";
import express from "express";
import cors from "cors";

const app = express();
const port = 8080;

app.use(cors({
    origin: 'http://localhost:3000'
}));

const query = gql`
    query 
    recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
            id    
            title    
            titleSlug    
            timestamp  
        }
    }
`

async function pollLeetcode() {
    // debug
    console.log('\n' + 'polling...');
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

    const res = await request({
        url: 'https://leetcode.com/graphql',
        document: query,
        variables: {
            "username": "presston",
            "limit": 25
        }
    });
    for (const AcSubmission of res.recentAcSubmissionList) {
        const id = AcSubmission.id;
        if (!(solvedLeetcodes.has(id))) {
            const datetime = new Date(parseInt(AcSubmission.timestamp) * 1000);
            const date = (datetime.getMonth()+1).toString().padStart(2, '0') + "." + datetime.getDate().toString().padStart(2, '0') + "." + datetime.getFullYear();
            const time =  datetime.getHours().toString().padStart(2, '0') + ":" + datetime.getMinutes().toString().padStart(2, '0') + ":" + datetime.getSeconds().toString().padStart(2, '0');
            const title = AcSubmission.title;
            const link = `https://leetcode.com/problems/${AcSubmission.titleSlug}`;
    
            leetcodeActivity.push({
                type: 'leetcode',
                title: title,
                link: link,
                date: date,
                time: time,
                datetime: datetime,
                id: id
            })
            solvedLeetcodes.set(id, [datetime, date, time, title, link]);
        }
    }

    leetcodeActivity = leetcodeActivity.filter(checkRecent);

    leetcodeActivity.sort(compare);

    solvedLeetcodes = new Map ([...solvedLeetcodes.entries()].sort((a, b) => b[1][0] - a[1][0]));

    for (const client of clients) {
        client.write(`event: leetcodeActivity\n`);
        client.write(`data: ${JSON.stringify(leetcodeActivity)}\n\n`);

        client.write(`event: solvedLeetcodes\n`);
        client.write(`data: ${JSON.stringify([...solvedLeetcodes.entries()])}\n\n`);
    };

    // debug
    const end = new Date();
    console.log(`fetched in ${end-start}ms`);

    return [leetcodeActivity, solvedLeetcodes];
}

async function pollingLoop(refresh) {
    try {
        [leetcodeActivity, solvedLeetcodes] = await pollLeetcode();
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
    return [leetcodeActivity, solvedLeetcodes];
}

const pollingCadence = 10000;

let checkExpBackoff = 0;

let leetcodeActivity = [];
let solvedLeetcodes = new Map();

const clients = new Set();

[leetcodeActivity, solvedLeetcodes] = await pollingLoop(pollingCadence);

app.get('/data', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.add(res);
    res.write(`event: leetcodeActivity\n`);
    res.write(`data: ${JSON.stringify(leetcodeActivity)}\n\n`);

    res.write(`event: solvedLeetcodes\n`);
    res.write(`data: ${JSON.stringify([...solvedLeetcodes.entries()])}\n\n`);

    req.on('close', () => {
        clients.delete(res);
    });
});

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});
