import { Octokit } from "octokit";
import env from "./env.js";
import { formatEasternDateTime } from "./formatEasternDateTime.js";

const pat = env.GITHUB_PAT;

const octokit = new Octokit({ auth: pat });

export function fetchGithub(onUpdate) {
    const login = "pjprobst";

    let githubActivity = [];

    pollingLoop(5 * 60 * 1000);

    async function pollGithub(){
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


        for await (const { data: events } of iterator) {
            for (const event of events) {
                const id = event.id;
                if (!(githubActivity.some(x => x.id === id))) {
                    const datetime = new Date(event.created_at);
                    const { date, time } = formatEasternDateTime(datetime);

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
                                type: 'github',
                                event: `Commented on a commit`,
                            };
                            break;
                        case 'CreateEvent':
                            if (event.payload.ref_type === 'branch') {
                                typeData = {
                                    type: 'github',
                                    event: `Created a new branch`,
                                };
                            }
                            else if (event.payload.ref_type === 'repository') {
                                typeData = {
                                    type: 'github',
                                    event: `Created a new repo`,
                                };
                            }
                            else {
                                typeData = {
                                    type: 'github',
                                    event: `Created a new tag`,
                                };
                            }
                            break;
                        case 'DeleteEvent':
                            if (event.payload.ref_type === 'branch') {
                                typeData = {
                                    type: 'github',
                                    event: `Deleted a branch`,
                                };
                            }
                            else {
                                typeData = {
                                    type: 'github',
                                    event: `Deleted a tag`,
                                };
                            }
                            break;
                        case 'DiscussionEvent':
                            typeData = {
                                type: 'github',
                                event: `Created a discussion`,
                            };
                            break;
                        case 'ForkEvent':
                            typeData = {
                                type: 'github',
                                event: `Forked a repository`,
                            };
                            break;
                        case 'GollumEvent':
                            typeData = {
                                type: 'github',
                                event: `${toTitleCase(event.payload.pages[0].action)} a wiki page`,
                            };
                            break;
                        case 'IssueCommentEvent':
                            typeData = {
                                type: 'github',
                                event: `Commented on an issue / pull request`,
                            };
                            break;
                        case 'IssuesEvent':
                            typeData = {
                                type: 'github',
                                event: `${toTitleCase(event.payload.action)} an issue`,
                            };
                            break;
                        case 'MemberEvent':
                            typeData = {
                                type: 'github',
                                event: `Accepted an invite`,
                            };
                            break;
                        case 'PublicEvent':
                            typeData = {
                                type: 'github',
                                event: 'Made a repository public',
                            };
                            break;
                        case 'PullRequestEvent':
                            typeData = {
                                type: 'github',
                                event: `${toTitleCase(event.payload.action)} a pull request`,
                            };
                            break;
                        case 'PullRequestReviewEvent':
                            typeData = {
                                type: 'github',
                                event: `${toTitleCase(event.payload.action)} a pull request review`,
                            };
                            break;
                        case 'PullRequestReviewCommentEvent':
                            typeData = {
                                type: 'github',
                                event: `Commented on a pull request`,
                            };
                            break;
                        case 'PushEvent':
                            typeData = {
                                type: 'github',
                                event: `Pushed commits`,
                            };
                            break;
                        case 'ReleaseEvent':
                            typeData = {
                                type: 'github',
                                event: `Published a release`,
                            };
                            break;
                        case 'WatchEvent':
                            typeData = {
                                type: 'github',
                                event: `Starred a repository`,
                            };
                            break;
                        default:
                            typeData = {
                                type: 'github',
                                event: type,
                            };
                    }

                    const initOutput = {...typeData, date, time, datetime, id};

                    let output;

                    if ( event.public === true ) {
                        const name = event.repo.name;
                        const tempUrl = event.repo.url;
                        const repoUrl = tempUrl.replace("api", "www").replace("repos/", "");
                        const url = type === 'PushEvent' ? `${repoUrl}/commit/${event.payload.head}` : repoUrl;

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
                    githubActivity.push(output);
                }
            }
        }

        githubActivity = githubActivity.filter(checkRecent);

        githubActivity.sort(compare);

        onUpdate(githubActivity)
    }

    async function pollingLoop(refresh) {
        try {
            await pollGithub();
            setTimeout(() => pollingLoop(refresh), refresh);
        }
        catch(err) {
            console.log(`GITHUB ERROR: ${err}`);
            setTimeout(() => pollingLoop(refresh), refresh);
        }
    }
}
