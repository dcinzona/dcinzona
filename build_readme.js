// Pulled a lot from here https://github.com/meruff/go-trailhead-leaderboard-api/blob/master/main.go
const https = require('https');
const fs = require('fs');
const { resolve } = require('path');

const trailblazerMe = "https://trailblazer.me/id/";
/* REFERENCE * /
const trailblazerMeUserID = "https://trailblazer.me/id?cmty=trailhead&uid=";
const trailblazerMeApexExec = "https://trailblazer.me/aura?r=0&aura.ApexAction.execute=2";
const profileAppURI = 'https://trailblazer.me/c/ProfileApp.app?aura.format=JSON&aura.formatAdapter=LIGHTNING_OUT';
/* */

const alias = 'gustavo';
let profileContext, auraContext, readmeFile;

let main = async function () {
    readmeFile = fs.readFileSync('README.md').toString();
    profileContext = await getProfileAppData();

    buildReadme();
};

main();

function buildReadme() {

    let title = '## Salesforce Certifications';
    let startIdx = readmeFile.indexOf(title);
    let rmsub = readmeFile.substring(0, startIdx + title.length) + '\n\n';

    dataHandler().then((data) => {
        data.certificationsResult.certificationsList.forEach(cert => {
            if (cert.certificationStatus == 'ACTIVE') {
                rmsub += createImgString(cert.certificationImageUrl, cert.title, cert.description);
            }
        });
        rmsub += '\n\n';

        try {
            rmsub += '## Salesforce Superbadges \n\n';
            let superbadges = JSON.parse(data.superbadgesResult).superbadges;
            superbadges.forEach(badge => {
                rmsub += createImgString(badge.imageUrl, badge.title, badge.description, 100);
            });
            rmsub += '\n\n';
        } catch (err) {

        }

        readmeFile = rmsub;
        fs.writeFileSync('README.md', readmeFile);
        //badgesHandler().then((badges) => { });
    }).catch((err) => {
        console.log(err);
    });
}

// Gets Salesforce certifications the Trailblazer has earned.
async function dataHandler() {

    let userID = await getTrailheadID(alias);

    var trailheadData = await getApexExecResponse(`message={"actions":[` + getAction("AchievementService", "fetchAchievements", userID, "", "") + `]}` +
        `&aura.context=` + getAuraContext() + `&aura.pageURI=&aura.token="`);

    var jsonOutput = (trailheadData.actions[0].returnValue.returnValue);

    return jsonOutput;

}

// Gets Salesforce badges the Trailblazer has earned.
async function badgesHandler() {

    let userID = await getTrailheadID(alias);

    var trailheadData = await getApexExecResponse(
        `message={"actions":[` + getAction("TrailheadProfileService", "fetchTrailheadBadges", userID, "0", "All") + `]}` +
        `&aura.context=` + getAuraContext() + `&aura.pageURI=&aura.token="`);

    try {
        var jsonOutput = JSON.parse(trailheadData.actions[0].returnValue.returnValue.body).value[0].EarnedAwards;
        //console.log(jsonOutput);
        return jsonOutput;
    } catch (e) {
        console.error(e.message);
        return e.message;
    }

}

// Gets Trailhead General Profile Data (unused)
async function gettrailblazerHandler() {

    userID = await getTrailheadID(alias);
    var trailheadData = await getApexExecResponse(
        `message={"actions":[` + getAction("TrailheadProfileService", "fetchTrailheadData", userID, "", "") + `]}` +
        `&aura.context=` + getAuraContext() + `&aura.pageURI=/id&aura.token="`);
    console.log(JSON.stringify(trailheadData));
}

// Core method to send requests to API service endpoints
function getApexExecResponse(messagePayload) {

    return new Promise((resolve, reject) => {

        const options = {
            hostname: 'trailblazer.me',
            path: '/aura?r=0&aura.ApexAction.execute=1',// + apexExecuteVersion,
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': "https://trailblazer.me/id",
                'Content-Type': "application/x-www-form-urlencoded;charset=UTF-8",
                'Origin': 'https://trailblazer.me',
                'DNT': '1',
                'Connection': 'keep-alive'
            }
        };

        const req = https.request(options, (res) => {

            res.setEncoding('utf8');
            let chunks_of_data = [];
            res.setEncoding('utf8');

            res.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });

            res.on('end', () => {
                let response_body = chunks_of_data.join("");
                const parsedData = JSON.parse(response_body);
                resolve(parsedData);
            });

        }).on("error", (err) => {
            console.error("Error: ", err.message);
        });

        req.write(messagePayload);
        req.end();
    });
}

// Dynamically gets certain variables required for successfully calling the Apex handler
function getProfileAppData() {
    return new Promise((resolve, reject) => {

        const options = {
            hostname: 'trailblazer.me',
            path: '/c/ProfileApp.app?aura.format=JSON&aura.formatAdapter=LIGHTNING_OUT',
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': "https://trailblazer.me/id",
                'Content-Type': "application/x-www-form-urlencoded;charset=UTF-8",
                'Origin': 'https://trailblazer.me',
                'DNT': '1',
                'Connection': 'keep-alive'
            }
        };
        https.get(options, (res) => {
            res.setEncoding('utf8');
            let rawData = '';

            res.on('data', (chunk) => rawData += chunk);

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    //console.log(parsedData);
                    const ctx = parsedData.auraConfig.context;
                    //auraContext = ctx;
                    resolve(ctx);
                } catch (e) {
                    reject(e.message);
                }
            });

        }).on('error', (e) => {
            reject(`Got error: ${e.message}`);
        });
    });
}

// Returns a JSON string representing an Apex action to be used in the callout to Trailhead.
function getAction(className, methodName, userID, skip, filter) {
    actionString =
        `{
            "id":"212;a",
            "descriptor":"aura://ApexActionController/ACTION$execute",
            "callingDescriptor":"UNKNOWN",
            "params":{
                "namespace":"",
                "classname":"` + className + `",
                "method":"` + methodName + `",
                "params":{
                    "userId":"` + userID + `",
                    "language":"en-US"`;

    if (skip != "") {
        actionString += `,
                    "skip":` + skip + `,
                    "perPage":30`;
    }

    if (filter != "") {
        actionString += `,
                    "filter":"` + titleCase(filter) + `"`;
    }

    actionString += `
                },
                    "cacheable":false,
                    "isContinuation":false
                }
            }`;

    return actionString;
}

// Returns a JSON string containing the Aura "context" to use in the callout to Trailhead.
// Now dynamically generated at runtime from getProfileAppData method
function getAuraContext() {
    if (auraContext) {
        return auraContext;
    }
    auraContext = `{
        "mode":"${profileContext.mode}",
        "fwuid":"${profileContext.fwuid}",
        "app":"${profileContext.app}",
        "loaded":{
            "APPLICATION@markup://c:ProfileApp" : "${profileContext.loaded["APPLICATION@markup://c:ProfileApp"]}"
        },
        "dn":[],
        "globals":{
            "srcdoc":true
        },
        "uad":true
    }`;
    return auraContext;
}

// Gets the Trailblazer's user Id from Trailhead, if provided with a custom user handle i.e. "gustavo" => "0051I000004XSMrQAO"
function getTrailheadID(userAlias) {
    if (!userAlias.startsWith("005")) {
        return new Promise((resolve, reject) => {
            https.get(trailblazerMe + userAlias, (res) => {

                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => rawData += chunk);

                res.on('end', () => {
                    try {
                        //const parsedData = JSON.parse(rawData);
                        //console.log(parsedData);
                        userID = rawData.substring(rawData.indexOf("uid: ") + 6, rawData.indexOf("uid: ") + 24);
                        resolve(userID);
                    } catch (e) {
                        reject(e.message);
                    }
                });

            }).on('error', (e) => {
                reject(`Got error: ${e.message}`);
            });
        });
    }

    return new Promise((resolve, reject) => {
        resolve(userAlias);
    });
}

// Utility function
function titleCase(str) {
    if ((str === null) || (str === ''))
        return false;
    else
        str = str.toString();

    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

// Utility  function
function createImgString(imgUrl, title, description, width = 135) {
    return ` <img src="${imgUrl}" width="${width}" title="${title}" alt="${title}" data-description="${description}"> `;
}