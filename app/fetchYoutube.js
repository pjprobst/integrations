import { google } from "googleapis";
import dotenv from "dotenv";
import { formatEasternDateTime } from "./formatEasternDateTime.js";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

dotenv.config({path: '.env'});
const apiKey = process.env.YOUTUBE_API_KEY;

const youtube = google.youtube({
    version: 'v3', 
    auth: apiKey
});

const databasePath = fileURLToPath(
    new URL('./data/my_database.db',
    import.meta.url)
);

const database = new DatabaseSync(databasePath);

const inDatabase = database.prepare(`
    SELECT 1
    FROM youtube
    WHERE id = ?
    LIMIT 1
`);

const insertVideo = database.prepare(`
    INSERT INTO youtube (
    id,
    postedAt,
    title
    )
    VALUES
    (?, ?, ?)
`);

export function fetchYoutube(onUpdate) {
    let youtubeActivity = [];

    let checkExpBackoff = 0;

    pollingLoop(10000);

    async function pollYoutube() {
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

        if (!res.ok) {
            throw new Error(`YouTube returned ${res.status}`);
        }

        for (const upload of res.data.items) {
            if (upload.snippet.type === 'upload') {
                const id = upload.contentDetails.upload.videoId;
                const datetime = new Date(upload.snippet.publishedAt);
                const title = upload.snippet.title;
                if (inDatabase.get(id) === undefined) {
                    insertVideo.run(
                        id,
                        datetime.getTime(),
                        title
                    );
                }

                if (!(youtubeActivity.some(x => x.id === id))) {
                    const { date, time } = formatEasternDateTime(datetime);
                    const url = `https://www.youtube.com/watch?v=${id}`;
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

        onUpdate(youtubeActivity);
    }

    async function pollingLoop(refresh) {
        try {
            await pollYoutube();
            checkExpBackoff = 0;
            setTimeout(() => pollingLoop(refresh), refresh);
        }
        catch(err) {
            checkExpBackoff += 1;
            console.log(`YOUTUBE ERROR: ${err}`);

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
