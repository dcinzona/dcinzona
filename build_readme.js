//Pulled a lot from here https://github.com/meruff/go-trailhead-leaderboard-api/blob/master/main.go
const https = require('https');
const fs = require('fs');

const trailblazerMe = "https://trailblazer.me/id/";
const trailblazerMeUserID = "https://trailblazer.me/id?cmty=trailhead&uid=";
const trailblazerMeApexExec = "https://trailblazer.me/aura?r=0&aura.ApexAction.execute=1";
const fwuid = "Q8onN6EmJyGRC51_NSPc2A";
const alias = 'gustavo';

let readmeFile = fs.readFileSync('README.md').toString();

function run() {

    let certTitle = '## Salesforce Certifications';
    let startIdx = readmeFile.indexOf(certTitle);
    let rmsub = readmeFile.substring(0, startIdx + certTitle.length) + '\n\n<br/>';
    

    certificationsHandler().then((CertData) => {
        //console.log(CertData.certificationsList);
        console.log(CertData);
        CertData.certificationsResult.certificationsList.forEach(cert => {
            console.log(cert);
            if (cert.certificationStatus == 'ACTIVE' || cert.certificationStatus == 'MAINTENANCE_DUE') {
                let img = ` <a href="${cert.certificationUrl}" target="_blank"><img src="${cert.certificationImageUrl}" width="160" title="${cert.title}" alt="${cert.title}" data-description="${cert.description}"></a> `;
                rmsub += img;
            }
        });
        rmsub += '\n<br><br>\n\n';
        
        let sbString = '## Salesforce Superbadges \n\n<br>';
        let superbadges = JSON.parse(CertData.superbadgesResult).superbadges;
        superbadges.forEach(cert => {
            
            let img = ` <a href="${cert.link}" target="_blank"><img src="${cert.imageUrl}" width="100" title="${cert.title}" alt="${cert.title}" data-description="${cert.description}"></a> `;
            sbString += img;
        });

        rmsub += sbString + '\n\n<br>';
        readmeFile = rmsub;
        fs.writeFileSync('README.md', readmeFile);
        //badgesHandler().then((badges) => { });
    });
}

run();

function gettrailblazerHandler() {

    userID = getTrailheadID(alias);
    console.log(userID);
    var trailheadData = getApexExecResponse(
        `message={"actions":[` + getAction("TrailheadProfileService", "fetchTrailheadData", userID, "", "") + `]}` +
        `&aura.context=` + getAuraContext() + `&aura.pageURI=/id&aura.token="`);
}

// Gets Salesforce certifications the Trailblazer has earned.
async function certificationsHandler() {

    let userID = await getTrailheadID(alias);

    var trailheadData = await getApexExecResponse(`message={"actions":[` + getAction("AchievementService", "fetchAchievements", userID, "", "") + `]}` +
        `&aura.context=` + getAuraContext() + `&aura.pageURI=&aura.token="`);

    console.log(trailheadData.actions[0].returnValue);

    var jsonOutput = (trailheadData.actions[0].returnValue.returnValue);

    return jsonOutput;

}
// Gets Salesforce certifications the Trailblazer has earned.
async function badgesHandler() {

    let userID = await getTrailheadID(alias);

    var trailheadData = await getApexExecResponse(
        `message={"actions":[` + getAction("TrailheadProfileService", "fetchTrailheadBadges", userID, "0", "All") + `]}` +
        `&aura.context=` + getAuraContext() + `&aura.pageURI=&aura.token="`
        );

    try {
        var jsonOutput = JSON.parse(trailheadData.actions[0].returnValue.returnValue.body).value[0].EarnedAwards;
        //console.log(jsonOutput);
        return jsonOutput;
    } catch (e) {
        console.error(e.message);
        return e.message;
    }

}

function getApexExecResponse(messagePayload) {
    console.log(messagePayload);
    return new Promise((resolve, reject) => {

        const options = {
            hostname: 'trailblazer.me',
            path: '/aura?r=0&aura.ApexAction.execute=2',
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
function getAuraContext() {
    return `{
        "mode":"PROD",
        "fwuid":"` + fwuid + `",
        "app":"c:ProfileApp",
        "loaded":{
            "APPLICATION@markup://c:ProfileApp":"9n54ZrqxcjlOD1q4vsaQRw"
        },
        "dn":[],
        "globals":{
            "srcdoc":true
        },
        "uad":true
    }`;
}
// Gets the Trailblazer's user Id from Trailhead, if provided with a custom user handle i.e. "matruff" => "0051I000004XSMrQAO"
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
                        //console.log(rawData);
                        let prefix = "/sobjects/User/";
                        userID = rawData.substring(rawData.indexOf(prefix) + prefix.length, rawData.indexOf(prefix) + (prefix.length + 18));
                        console.log(userID);
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

function titleCase(str) {
    if ((str === null) || (str === ''))
        return false;
    else
        str = str.toString();

    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

