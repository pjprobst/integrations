import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config({path: '.env'});
const apiKey = process.env.YOUTUBE_API_KEY;

const youtube = google.youtube({
    version: 'v3', 
    auth: apiKey
});

export function fetchYoutube(onUpdate) {
    let youtubeActivity = [];
    let videos = new Map();

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
        for (const upload of res.data.items) {
            if (upload.snippet.type === 'upload') {
                const id = upload.contentDetails.upload.videoId;
                if (!(videos.has(id))) {
                    const datetime = new Date(upload.snippet.publishedAt);
                    const date = (datetime.getMonth()+1).toString().padStart(2, '0') + "." + datetime.getDate().toString().padStart(2, '0') + "." + datetime.getFullYear();

                    const suffix = datetime.getHours() < 12 ? "am" : "pm";
                    const hours = datetime.getHours() > 12 ? datetime.getHours()-12 : datetime.getHours();

                    const time = (hours === 0 ? 12 : hours).toString().padStart(2, '0') + ":" + datetime.getMinutes().toString().padStart(2, '0') + ":" + datetime.getSeconds().toString().padStart(2, '0') + suffix + " ET";

                    const title = upload.snippet.title;
                    const url = `https://www.youtube.com/watch?v=${id}`;
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

        videos = new Map ([...videos.entries()].sort((a, b) => b[1] - a[1]));

        onUpdate(youtubeActivity, videos);
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