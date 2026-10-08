import { google } from "googleapis";
import database from "./database.js";
import env from "./env.js";
import { formatEasternDateTime } from "./formatEasternDateTime.js";

const apiKey = env.YOUTUBE_API_KEY;

const youtube = google.youtube({
    version: 'v3', 
    auth: apiKey
});

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

    pollingLoop(15 * 60 * 1000);

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
                        event: 'Uploaded a video',
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
            setTimeout(() => pollingLoop(refresh), refresh);
        }
        catch(err) {
            console.log(`YOUTUBE ERROR: ${err}`);
            setTimeout(() => pollingLoop(refresh), refresh);
        }
    }
}
