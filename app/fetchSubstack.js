import database from "./database.js";
import { formatEasternDateTime } from "./formatEasternDateTime.js";

const inDatabase = database.prepare(`
    SELECT 1
    FROM substack
    WHERE url = ?
    LIMIT 1
`);

const insertPost = database.prepare(`
    INSERT INTO substack (
    url,
    title,
    postedAt
    )
    VALUES
    (?, ?, ?)
`);

export function fetchSubstack(onUpdate) {
    let substackActivity = [];

    pollingLoop(30 * 60 * 1000);

    async function pollSubstack() {
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
        
        const res = await fetch('https://prestonpro.substack.com/api/v1/posts?limit=20');

        if (!res.ok) {
            throw new Error(`Substack returned ${res.status}`);
        }

        const body = await res.json();

        for (const entry of body) {
            const url = entry.canonical_url;
            const title = entry.title;
            const datetime = new Date(entry.post_date);
            if (inDatabase.get(url) === undefined) {
                insertPost.run(
                    url,
                    title,
                    datetime.getTime()
                );
            }
            if (!(substackActivity.some(x => x.url === url))) {
                const { date, time } = formatEasternDateTime(datetime);

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

        onUpdate(substackActivity);
    }

    async function pollingLoop(refresh) {
        try {
            await pollSubstack();
            setTimeout(() => pollingLoop(refresh), refresh);
        }
        catch(err) {
            console.log(`SUBSTACK ERROR: ${err}`);
            setTimeout(() => pollingLoop(refresh), refresh);
        }
    }
}
