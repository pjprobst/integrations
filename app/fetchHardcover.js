import { request, gql } from "graphql-request";
import dotenv from "dotenv";
import { formatEasternDateTime } from "./formatEasternDateTime.js";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

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
                user_book_reads(order_by: { id: desc }, limit: 1)
                {
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

const databasePath = fileURLToPath(
    new URL('./data/my_database.db',
    import.meta.url)
);

const database = new DatabaseSync(databasePath);

const inDatabase = database.prepare(`
    SELECT 1
    FROM hardcover
    WHERE id = ?
    LIMIT 1
`);

const insertBook = database.prepare(`
    INSERT INTO hardcover (
    id,
    status,
    title,
    author,
    pages,
    updatedAt,
    image,
    url,
    finishedAt,
    startedAt,
    progressPages
    )
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    , ?)
`);

const updateBook = database.prepare(`
    UPDATE hardcover
    SET
    status = ?,
    title = ?,
    author = ?,
    pages = ?,
    updatedAt = ?,
    image = ?,
    url = ?,
    finishedAt = ?,
    startedAt = ?,
    progressPages = ?
    WHERE id = ?
`);

export function fetchHardcover(onUpdate) {
    let hardcoverActivity = [];

    let checkExpBackoff = 0;

    pollingLoop(10000);

    async function pollHardcover() {
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
            const key = book.user_book_reads.length !== 0 ? (book.user_book_reads[book.user_book_reads.length-1].id + book.updated_at) : (book.id + book.updated_at);
            const sqlId = book.id;
            const id = book.user_book_reads.length !== 0 ? book.user_book_reads[book.user_book_reads.length-1].id : book.id;
            const datetime = new Date(book.updated_at);
            const status = book.user_book_status.status;
            const image = book.edition.image?.url ?? null;
            const title = book.edition.title;
            const author = book.edition.contributions[0]?.author?.name ?? 'Unknown Author';
            const url = `https://hardcover.app/books/${book.edition.book.slug}`;

            const first = book.user_book_reads[0];
            const startedAt = first?.started_at ?? null;
            const finishedAt = first?.finished_at ?? null;
            const progress_pages = first?.progress_pages ?? null;
            let pages = book.edition.pages;
            if (inDatabase.get(sqlId) !== undefined) {
                updateBook.run(
                    status,
                    title,
                    author,
                    pages,
                    datetime.getTime(),
                    image,
                    url,
                    finishedAt,
                    startedAt,
                    progress_pages,
                    sqlId
                );
            }
            else {
                insertBook.run(
                    sqlId,
                    status,
                    title,
                    author,
                    pages,
                    datetime.getTime(),
                    image,
                    url,
                    finishedAt,
                    startedAt,
                    progress_pages
                );
            }
            if (!(hardcoverActivity.some(x => x.key === key))) {
                const { date, time } = formatEasternDateTime(datetime);

                if (pages === null) {
                    pages = '?';
                }

                if (status === "Currently Reading" || status === "Paused" || status === "Did Not Finish") {
                    const curr = book.user_book_reads[0];

                    let currPage = curr?.progress_pages ?? null;
                    if (currPage === null || pages === '?') {
                        currPage = '?';
                    }

                    let progress;
                    if (pages === '?' || currPage ==='?') {
                        progress = '?';
                    }
                    else {
                        progress = Math.floor((currPage/pages)*100);
                    }

                    if (status === "Currently Reading" && !(currPage === 0) && hardcoverActivity.some(x => x.id === id)) {
                        const mostRecent = hardcoverActivity
                            .filter(activity => activity.id === id)
                            .reduce((latest, activity) => !latest || activity.datetime > latest.datetime ? activity : latest, null);
                        if (mostRecent !== null && mostRecent.currPage !== null && mostRecent.currPage !== undefined) {
                            hardcoverActivity.push({
                                type: 'hardcover',
                                event: 'Read with diff',
                                datetime: datetime,
                                title: title,
                                author: author,
                                url: url,
                                date: date,
                                time: time,
                                currPage: currPage,
                                pageDiff: currPage === '?' || mostRecent.currPage === '?' ? '?' : currPage - mostRecent.currPage,
                                progress: progress,
                                id: id,
                                key: key
                            });
                        }
                        else {
                            hardcoverActivity.push({
                                type: 'hardcover',
                                event: 'Read no diff',
                                datetime: datetime,
                                title: title,
                                author: author,
                                url: url,
                                date: date,
                                time: time,
                                currPage: currPage,
                                progress: progress,
                                id: id,
                                key: key
                            });
                        }
                    }
                    else if (status === "Currently Reading" && !(currPage === 0) && !(hardcoverActivity.some(x => x.id === id))) {
                        hardcoverActivity.push({
                            type: 'hardcover',
                            event: 'Read no diff',
                            datetime: datetime,
                            title: title,
                            author: author,
                            url: url,
                            date: date,
                            time: time,
                            currPage: currPage,
                            progress: progress,
                            id: id,
                            key: key
                        });
                    }
                    else if (status === "Currently Reading") {
                        hardcoverActivity.push({
                            type: 'hardcover',
                            event: 'Started Reading',
                            datetime: datetime,
                            title: title,
                            author: author,
                            url: url,
                            date: date,
                            time: time,
                            currPage: currPage,
                            progress: progress,
                            id: id,
                            key: key
                        });
                    }
                }
                else if (status === "Read") {
                    hardcoverActivity.push({
                        type: 'hardcover',
                        event: 'Finished Reading',
                        datetime: datetime,
                        title: title,
                        author: author,
                        url: url,
                        date: date,
                        time: time,
                        id: id,
                        key: key
                    })
                }
            }
        }

        hardcoverActivity = hardcoverActivity.filter(checkRecent);

        hardcoverActivity.sort(compare);

        onUpdate(hardcoverActivity);
    }

    async function pollingLoop(refresh) {
        try {
            await pollHardcover();
            setTimeout(() => pollingLoop(refresh), refresh);
            checkExpBackoff = 0;
        }
        catch(err) {
            checkExpBackoff += 1;
            console.log(`HARDCOVER ERROR: ${err}`);

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
    }
}
