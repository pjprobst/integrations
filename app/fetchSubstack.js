export function fetchSubstack(onUpdate) {
    let substackActivity = [];

    let checkExpBackoff = 0;

    pollingLoop(10000);

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

        const body = await res.json();

        for (const entry of body) {
            const url = entry.canonical_url;
            const title = entry.title;
            if (!(substackActivity.some(x => x.url === url))) {
                const datetime = new Date(entry.post_date);
                const date = (datetime.getMonth()+1).toString().padStart(2, '0') + "." + datetime.getDate().toString().padStart(2, '0') + "." + datetime.getFullYear();

                const suffix = datetime.getHours() < 12 ? "am" : "pm";
                const hours = datetime.getHours() > 12 ? datetime.getHours()-12 : datetime.getHours();

                const time = (hours === 0 ? 12 : hours).toString().padStart(2, '0') + ":" + datetime.getMinutes().toString().padStart(2, '0') + ":" + datetime.getSeconds().toString().padStart(2, '0') + suffix + " ET";

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
            checkExpBackoff = 0;
            setTimeout(() => pollingLoop(refresh), refresh);
        }
        catch(err) {
            checkExpBackoff += 1;
            console.log(`SUBSTACK ERROR: ${err}`);

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