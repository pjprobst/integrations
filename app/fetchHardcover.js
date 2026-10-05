import { request, gql } from "graphql-request";
import dotenv from "dotenv";

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

export function fetchHardcover(onUpdate) {
    let hardcoverActivity = [];
    let books = new Map();

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
            const id = book.id;
            const datetime = new Date(book.updated_at);
            if ((!(books.has(id))) || ((books.has(id) && (!(books.get(id)[0][0].getTime() === datetime.getTime()))))) {
                const status = book.user_book_status.status;
                const image = book.edition.image.url;
                const title = book.edition.title;
                const author = book.edition.contributions[0].author.name;
                const url = `https://hardcover.app/books/${book.edition.book.slug}`;
                const date = (datetime.getMonth()+1).toString().padStart(2, '0') + "." + datetime.getDate().toString().padStart(2, '0') + "." + datetime.getFullYear();
                
                const suffix = datetime.getHours() < 12 ? "am" : "pm";
                const hours = datetime.getHours() > 12 ? datetime.getHours()-12 : datetime.getHours();

                const time = (hours === 0 ? 12 : hours).toString().padStart(2, '0') + ":" + datetime.getMinutes().toString().padStart(2, '0') + ":" + datetime.getSeconds().toString().padStart(2, '0') + suffix + " ET";

                let pages = book.edition.pages;
                if (pages === null) {
                    pages = '?';
                }

                const common = [datetime, status, title, author, pages, date, time, image, url];
                if (status === "Currently Reading" || status === "Paused" || status === "Did Not Finish") {
                    const curr = book.user_book_reads[book.user_book_reads.length-1];
                    let prevPage;
                    if (book.user_book_reads.length > 1) {
                        const prev = book.user_book_reads[book.user_book_reads.length-2];
                        prevPage = prev.progress_pages;
                        if (prevPage === null) {
                            prevPage = 0;
                        }
                    }
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

                    if (book.user_book_reads.length > 1 && status === "Currently Reading" && !(currPage === 0)) {
                        hardcoverActivity.push({
                            type: 'hardcover',
                            event: 'Read',
                            datetime: datetime,
                            title: title,
                            author: author,
                            url: url,
                            date: date,
                            time: time,
                            pageDiff: (currPage - prevPage),
                            progress: progress
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
                    hardcoverActivity.push({
                        type: 'hardcover',
                        event: 'Finished Reading',
                        datetime: datetime,
                        title: title,
                        author: author,
                        url: url,
                        date: date,
                        time: time,
                    })
                }
                else if (status === "Want to Read") {
                    books.set(id, [common]);
                }
            }
        }

        hardcoverActivity = hardcoverActivity.filter(checkRecent);

        hardcoverActivity.sort(compare);

        books = new Map ([...books.entries()].sort((a, b) => b[1][0][0] - a[1][0][0]));

        onUpdate(hardcoverActivity, books);
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