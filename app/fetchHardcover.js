import { request, gql } from "graphql-request";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

const app = express();
const port = 8080;

app.use(cors({
    origin: 'http://localhost:3000'
}));

dotenv.config({path: '.env'});
const apiKey = process.env.HARDCOVER_API_KEY;

const query = gql`
    query Me {
        me {
            user_books(where: {status_id: { _neq: 6 } }) {
                id
                user_book_status {
                    status
                }
                updated_at
                user_book_reads {
                    id
                    progress_pages
                    started_at
                    finished_at
                }
                edition {
                    pages
                    image {
                        url
                    }
                    title
                    contributions(where: {contributor_role: {important: { _eq: 1 } }}) {
                        author {
                            name
                        }
                    }
                    book {
                        slug
                    }
                }  
            }
        }
    }
`

async function pollHardcover() {
    //debug
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
        url: 'https://api.hardcover.app/v1/graphql',
        document: query,
        requestHeaders: {
            'Authorization': `Bearer ${apiKey}`,
            'content-type': 'application/json'
        }
    });

    for (const book of res.me[0].user_books) {
        const id = book.id;
        const datetime = new Date(book.updated_at);
        if ((!(books.has(id))) || ((books.has(id) && (!(books.get(id)[0][0].getTime() === datetime.getTime()))))) {
            const status = book.user_book_status.status;
            const image = book.edition.image.url;
            const title = book.edition.title;
            const author = book.edition.contributions[0].author.name;
            const link = `https://hardcover.app/books/${book.edition.book.slug}`;
            const date = (datetime.getMonth()+1).toString().padStart(2, '0') + "." + datetime.getDate().toString().padStart(2, '0') + "." + datetime.getFullYear();
            const time =  datetime.getHours().toString().padStart(2, '0') + ":" + datetime.getMinutes().toString().padStart(2, '0') + ":" + datetime.getSeconds().toString().padStart(2, '0');

            let pages = book.edition.pages;
            if (pages === null) {
                pages = '?';
            }

            const common = [datetime, status, title, author, pages, date, time, image, link];
            if (status === "Currently Reading" || status === "Paused" || status === "Did Not Finish") {
                const curr = book.user_book_reads[book.user_book_reads.length-1];
                const first = book.user_book_reads[0];
                const startedAt = first.started_at;

                let currPage = curr.progress_pages;
                if (currPage === null) {
                    currPage = 0;
                }

                let progress;
                if (pages === '?') {
                    progress = '?';
                }
                else {
                    progress = Math.floor((currPage/pages)*100);
                }

                if (books.has(id) && status === "Currently Reading" && !(currPage === 0)) {
                    harcoverActivity.push({
                        type: 'hardcover',
                        event: status,
                        datetime: datetime,
                        title: title,
                        author: author,
                        link: link,
                        date: date,
                        time: time,
                        pageDiff: (currPage - books.get(id)[1][0]),
                        progress: progress
                    });
                }
                else {
                    harcoverActivity.push({
                        type: 'hardcover',
                        event: status,
                        datetime: datetime,
                        title: title,
                        author: author,
                        link: link,
                        date: date,
                        time: time,
                        page: currPage,
                        progress: progress
                    });
                }
                books.set(id, [common, [currPage, progress, startedAt]]);
            }
            else if (status === "Read") {
                const first = book.user_book_reads[0];
                const curr = book.user_book_reads[book.user_book_reads.length-1];
                const startedAt = first.started_at;
                const finishedAt = curr.finished_at;

                books.set(id, [common, [startedAt, finishedAt]]);
                harcoverActivity.push({
                    type: 'hardcover',
                    event: status,
                    datetime: datetime,
                    title: title,
                    author: author,
                    link: link,
                    date: date,
                    time: time,
                })
            }
            else if (status === "Want to Read") {
                books.set(id, [common]);
                harcoverActivity.push({
                    type: 'hardcover',
                    event: status,
                    datetime: datetime,
                    title: title,
                    author: author,
                    link: link,
                    date: date,
                    time: time,
                })
            }
        }
    }

    harcoverActivity = harcoverActivity.filter(checkRecent);

    harcoverActivity.sort(compare);

    books = new Map ([...books.entries()].sort((a, b) => b[1][0][0] - a[1][0][0]));

    for (const client of clients) {
        client.write(`event: hardcoverActivity\n`);
        client.write(`data: ${JSON.stringify(harcoverActivity)}\n\n`);

        client.write(`event: books\n`);
        client.write(`data: ${JSON.stringify([...books.entries()])}\n\n`);
    };

    // debug
    const end = new Date();
    console.log(`fetched in ${end-start}ms`);

    return [harcoverActivity, books];
}

async function pollingLoop(refresh) {
    try {
        [harcoverActivity, books] = await pollHardcover();
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
    return [harcoverActivity, books];
}

const pollingCadence = 10000;

let checkExpBackoff = 0;

let books = new Map();
let harcoverActivity = [];

const clients = new Set();

[harcoverActivity, books] = await pollingLoop(pollingCadence);

app.get('/data', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.add(res);
    res.write(`event: hardcoverActivity\n`);
    res.write(`data: ${JSON.stringify(harcoverActivity)}\n\n`);

    res.write(`event: books\n`);
    res.write(`data: ${JSON.stringify([...books.entries()])}\n\n`);

    req.on('close', () => {
        clients.delete(res);
    });
});

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});