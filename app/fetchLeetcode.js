import { request, gql } from "graphql-request";

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
export function fetchLeetcode(onUpdate) {
    let leetcodeActivity = [];

    let checkExpBackoff = 0;

    pollingLoop(10000);

    async function pollLeetcode() {
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
            if (!(leetcodeActivity.some(x => x.id === id))) {
                const datetime = new Date(parseInt(AcSubmission.timestamp) * 1000);
                const date = (datetime.getMonth()+1).toString().padStart(2, '0') + "." + datetime.getDate().toString().padStart(2, '0') + "." + datetime.getFullYear();

                const suffix = datetime.getHours() < 12 ? "am" : "pm";
                const hours = datetime.getHours() > 12 ? datetime.getHours()-12 : datetime.getHours();

                const time = (hours === 0 ? 12 : hours).toString().padStart(2, '0') + ":" + datetime.getMinutes().toString().padStart(2, '0') + ":" + datetime.getSeconds().toString().padStart(2, '0') + suffix + " ET";

                const title = AcSubmission.title;
                const problemLink = `https://leetcode.com/problems/${AcSubmission.titleSlug}`;
                const solutionLink = `https://leetcode.com/submissions/detail/${id}/`;
        
                leetcodeActivity.push({
                    type: 'leetcode',
                    title: title,
                    problemlink: problemLink,
                    solutionlink: solutionLink,
                    date: date,
                    time: time,
                    datetime: datetime,
                    id: id
                })
            }
        }

        leetcodeActivity = leetcodeActivity.filter(checkRecent);

        leetcodeActivity.sort(compare);

        onUpdate(leetcodeActivity);
    }

    async function pollingLoop(refresh) {
        try {
            await pollLeetcode();
            setTimeout(() => pollingLoop(refresh), refresh);
            checkExpBackoff = 0;
        }
        catch(err) {
            checkExpBackoff += 1;
            console.log(`LEETCODE ERROR: ${err}`);

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