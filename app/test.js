import { Octokit } from "octokit";
import dotenv from 'dotenv';
import express from "express";

const app = express();
const port = 8080;

dotenv.config({path: '.env'});

const pat = process.env.GITHUB_PAT;

const octokit = new Octokit({ auth: pat });

const { data: { login } } = await octokit.rest.users.getAuthenticated();
console.log("Hello, %s", login);

async function pollGithub(){
    console.log('\n' + 'polling...');
    
    // debug
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

    const toTitleCase = (str) => {
        return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
    }

    const aWeekAgo = new Date(Date.now()-604800000);

    const checkRecent = (entry) => {
        return entry.datetime >= aWeekAgo;
    }

    const iterator = octokit.paginate.iterator('GET /users/{username}/events', {
        username: login,
        per_page: 100,
        headers: {
        'X-GitHub-Api-Version': '2026-03-10'
        }
    });

    let activity = [];

    for await (const { data: events } of iterator) {
        for (const event of events) {
            const datetime = new Date(event.created_at);
            const date = (datetime.getMonth()+1).toString().padStart(2, '0') + "." + datetime.getDate().toString().padStart(2, '0') + "." + datetime.getFullYear();
            const time =  datetime.getHours().toString().padStart(2, '0') + ":" + datetime.getMinutes().toString().padStart(2, '0') + ":" + datetime.getSeconds().toString().padStart(2, '0');
            const id = event.id;

            let typeData;
            const type = event.type;

            // handling event types
            /*
            Potentially add:
            - Deployments
            - CI/check results
            - Workflow runs
            */
            switch (type) {
                case 'CommitCommentEvent':
                    typeData = {
                        type: `Commented on a commit`,
                    };
                    break;
                case 'CreateEvent':
                    if (event.payload.ref_type === 'branch') {
                        typeData = {
                            type: `Created a new branch`,
                        };
                    }
                    else if (event.payload.ref_type === 'repository') {
                        typeData = {
                            type: `Created a new repo`,
                        };
                    }
                    else {
                        typeData = {
                            type: `Created a new tag`,
                        };
                    }
                    break;
                case 'DeleteEvent':
                    if (event.payload.ref_type === 'branch') {
                        typeData = {
                            type: `Deleted a branch`,
                        };
                    }
                    else {
                        typeData = {
                            type: `Deleted a tag`,
                        };
                    }
                    break;
                case 'DiscussionEvent':
                    typeData = {
                        type: `Created a discussion`,
                    };
                    break;
                case 'ForkEvent':
                    typeData = {
                        type: `Forked a repository`,
                    };
                    break;
                case 'GollumEvent':
                    typeData = {
                        type: `${toTitleCase(event.payload.pages[0].action)} a wiki page`,
                    };
                    break;
                case 'IssueCommentEvent':
                    typeData = {
                        type: `Commented on an issue / pull request`,
                    };
                    break;
                case 'IssuesEvent':
                    typeData = {
                        type: `${toTitleCase(event.payload.action)} an issue`,
                    };
                    break;
                case 'MemberEvent':
                    typeData = {
                        type: `Added user to a repository`,
                    };
                    break;
                case 'PublicEvent':
                    typeData = {
                        type: 'Made a repository public',
                    };
                    break;
                case 'PullRequestEvent':
                    typeData = {
                        type: `${toTitleCase(event.payload.action)} a pull request`,
                    };
                    break;
                case 'PullRequestReviewEvent':
                    typeData = {
                        type: `${toTitleCase(event.payload.action)} a pull request review`,
                    };
                    break;
                case 'PullRequestReviewCommentEvent':
                    typeData = {
                        type: `Commented on a pull request`,
                    };
                    break;
                case 'PushEvent':
                    typeData = {
                        type: `Pushed commits`,
                    };
                    break;
                case 'ReleaseEvent':
                    typeData = {
                        type: `Published a release`,
                    };
                    break;
                case 'WatchEvent':
                    typeData = {
                        type: `Starred a repository`,
                    };
                    break;
                default:
                    typeData = {
                        type: type,
                    };
            }

            const initOutput = {...typeData, date, time, datetime, id};

            let output;

            if ( event.public === true ) {
                const name = event.repo.name;
                const tempUrl = event.repo.url;
                const url = tempUrl.replace("api", "www").replace("repos/", "");

                output = { ...initOutput, name, url };
            }
            else {
                const org = event.org?.login ?? "";
                if ( org === 'character-tech' ) {
                    output = { ...initOutput, name:"work - private repo" };
                }
                else if ( org === 'PittCS1501' ) {
                    output = { ...initOutput, name:"school - private repo" };
                }
                else {
                    output = { ...initOutput, name:"private repo" };
                }
            }
            activity.push(output);
        }
    }

    activity = activity.filter(checkRecent);

    activity.sort(compare);

    for (const entry of activity) {
        delete entry.id;
        delete entry.datetime;
    }

    // debug
    const end = new Date();
    console.log(`fetched in ${end-start}ms`);

    return activity;
}

async function pollingLoop() {
    githubActivity = await pollGithub();
    setTimeout(pollingLoop, 10000);
    return githubActivity;
}

let githubActivity = [];

githubActivity = await pollingLoop();

app.get('/', (req, res) => {
    res.send(JSON.stringify(githubActivity));
});

app.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});