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

// Current profile values used when the legacy Trailhead endpoint returns no data.
const earnedCertifications = [
    {
        title: 'Salesforce Certified Platform Administrator',
        certificationStatus: 'EXPIRED',
        certificationUrl: 'https://trailhead.salesforce.com/credentials/administrator',
        certificationImageUrl: 'https://drm.my.salesforce.com/servlet/servlet.ImageServer?id=015Rf00000MAGlB&oid=00DF0000000gZsu',
        description: 'Certified Platform Administrators are Salesforce professionals who build and manage trusted solutions on the Salesforce Platform. They administer and secure the lifecycle of users, data, apps and agents to ensure org health and maximize value.'
    },
    {
        title: 'Salesforce Certified Agentforce Sales Consultant',
        certificationStatus: 'EXPIRED',
        certificationUrl: 'https://trailhead.salesforce.com/credentials/salescloudconsultant',
        certificationImageUrl: 'https://drm.my.salesforce.com/servlet/servlet.ImageServer?id=015Rf00000gfCTG&oid=00DF0000000gZsu',
        description: 'Certified Agentforce Sales Consultants are trained to design and implement Agentforce Sales solutions that are sustainable, scalable, and contribute to long-term customer success.'
    },
    {
        title: 'Salesforce Certified Agentforce Service Consultant',
        certificationStatus: 'EXPIRED',
        certificationUrl: 'https://trailhead.salesforce.com/credentials/servicecloudconsultant',
        certificationImageUrl: 'https://drm.my.salesforce.com/servlet/servlet.ImageServer?id=015Rf00000gfDCP&oid=00DF0000000gZsu',
        description: 'Certified Agentforce Service Consultants are experts at designing and implementing Agentforce Service solutions that are sustainable and scalable, meet customer business requirements, and contribute to long-term customer success.'
    },
    {
        title: 'Salesforce Certified Platform App Builder',
        certificationStatus: 'ACTIVE',
        certificationUrl: 'https://trailhead.salesforce.com/credentials/platformappbuilder',
        certificationImageUrl: 'https://drm.my.salesforce.com/servlet/servlet.ImageServer?id=015Rf00000MAEmf&oid=00DF0000000gZsu',
        description: 'Certified Platform App Builders have the skills and knowledge to design, build, and deploy custom applications using the declarative customization capabilities of the Salesforce Platform.'
    },
    {
        title: 'Salesforce Certified Platform Developer',
        certificationStatus: 'ACTIVE',
        certificationUrl: 'https://trailhead.salesforce.com/credentials/platformdeveloperi',
        certificationImageUrl: 'https://drm.my.salesforce.com/servlet/servlet.ImageServer?id=015Rf00000MA9LY&oid=00DF0000000gZsu',
        description: 'Certified Platform Developers understand how to develop and deploy custom business logic and custom interfaces using the programmatic capabilities of the Lightning Platform. They can also extend the Lightning Platform using Apex and Visualforce.'
    },
    {
        title: 'Salesforce Certified Technical Architect',
        certificationStatus: 'ACTIVE',
        certificationUrl: 'https://trailhead.salesforce.com/credentials/technicalarchitect',
        certificationImageUrl: 'https://drm.my.salesforce.com/servlet/servlet.ImageServer?id=015Rf00000MA6U6&oid=00DF0000000gZsu',
        description: 'Certified Technical Architects possess broad knowledge across multiple development platforms. They use their skills and experience to assess customer requirements and architecture, then use that knowledge to design secure, high-performance technical solutions that maximize the potential of the Salesforce Platform.'
    },
    {
        title: 'Salesforce Certified AI Associate',
        certificationStatus: 'RETIRED',
        certificationUrl: 'https://trailhead.salesforce.com/credentials/aiassociate',
        certificationImageUrl: 'https://drm.my.salesforce.com/servlet/servlet.ImageServer?id=015Rf00000YMdGt&oid=00DF0000000gZsu',
        description: "Certified AI Associates should be able to provide informed strategies and guide stakeholder decisions based on Salesforce's Trusted AI Principles."
    }
];
const superbadgeFallbacks = [
    {
        title: 'Superbadge: Agentforce Service',
        imageUrl: 'https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/superbadges/superbadge-agentforce-service-sbu/8b15afebd3bc004b830549d6becc8e46_badge.png'
    },
    {
        title: 'Superbadge: Prompt Builder Templates',
        imageUrl: 'https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/superbadges/superbadge_prompt_builder_templates_sbu/4963aa9e9a6d59bd057aba9c7a8e7a88_badge.png'
    },
    {
        title: 'Data Integration Specialist',
        imageUrl: 'https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/superbadges/superbadge_integration/109b07c27bdad837c3c0776db69650c1_badge.png'
    },
    {
        title: 'Apex Specialist',
        imageUrl: 'https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/superbadges/superbadge_apex/2d3426c48dc056fd5c083ecb5cb66a56_badge.png'
    },
    {
        title: 'Security Specialist',
        imageUrl: 'https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/superbadges/superbadge_security/2cb1e61a5ef594182a9a6a0b26862b5f_badge.png'
    },
    {
        title: 'Lightning Experience Specialist',
        imageUrl: 'https://res.cloudinary.com/hy4kyit2a/f_auto/fl_lossy/q_70/learn/superbadges/superbadge_lex/fec7e5aa3aa903ae95c273fa29098f26_badge.png'
    }
];
let profileContext, auraContext, readmeFile;

let main = async function () {
    readmeFile = fs.readFileSync('README.md').toString();
    profileContext = await getProfileAppData();
    //console.log(profileContext)
    //dataHandler().then(console.log);
    buildReadme();
};

main();

function buildReadme() {

    let title = '## Salesforce Certifications';
    let startIdx = readmeFile.indexOf(title);
    let rmsub = readmeFile.substring(0, startIdx + title.length) + '\n\n';

    dataHandler().then((data) => {
        console.log(data);
        const certifications = Array.isArray(data.certificationsResult.certificationsList) && data.certificationsResult.certificationsList.length
            ? data.certificationsResult.certificationsList
            : earnedCertifications;
        certifications.sort(sortByTitleDesc).forEach(cert => {
            console.log(cert);
            rmsub += createCertificationString(cert);
        });
        rmsub += '\n\n';

        try {
            rmsub += '## Salesforce Superbadges\n\n<p align="center">\n';
            let superbadges = JSON.parse(data.superbadgesResult).superbadges;
            if (!Array.isArray(superbadges) || !superbadges.length) {
                superbadges = superbadgeFallbacks;
            }
            superbadges.forEach(badge => {
                rmsub += createImgString(badge.imageUrl, badge.title, badge.description, badge.link, 100);
            });
            rmsub += '\n</p>\n\n';
        } catch (err) {
            rmsub += '<p align="center">\n';
            superbadgeFallbacks.forEach(badge => {
                rmsub += createImgString(badge.imageUrl, badge.title, badge.description, badge.link, 100);
            });
            rmsub += '\n</p>\n\n';
        }

        rmsub += `## Agentblazer Champion '26\n\n<p align="center">\n<img src="assets/agentblazer-champion-2026.png" width="672" title="Agentblazer Champion '26" alt="Agentblazer Champion '26">\n</p>\n\n`;

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

    //console.log(messagePayload);
    return new Promise((resolve, reject) => {

        const options = {
            hostname: 'trailblazer.me',
            path: '/aura?r=0&aura.ApexAction.execute=2',// + apexExecuteVersion,
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
                        console.log(rawData);
                        let strSearch = "/sobjects/User/";//"TBIDUserId__c\":";
                        userID = rawData.substring(
                            rawData.indexOf(strSearch) + strSearch.length,// + 1,
                            rawData.indexOf(strSearch) + strSearch.length + 18//19
                        );

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

// Utility function
function titleCase(str) {
    if ((str === null) || (str === ''))
        return false;
    else
        str = str.toString();

    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}

function createCertificationString(certification) {
    const image = createImgString(
        getCertificationImageUrl(certification),
        certification.title,
        certification.description,
        certification.certificationUrl,
        160
    );

    if (/\/technicalarchitect\/?$/i.test(certification.certificationUrl || '')) {
        return `<p align="center">\n${image}\n</p>\n\n`;
    }

    return image;
}

// Trailhead's old content.force.com host no longer serves certification badges.
// The same ImageServer records remain available from the current Salesforce host.
function getCertificationImageUrl(certification) {
    const imageUrl = certification.certificationImageUrl || '';

    return imageUrl.replace(
        /^https?:\/\/[^/]+(?=\/servlet\/servlet\.ImageServer)/i,
        'https://drm.my.salesforce.com'
    );
}

// Utility  function
function createImgString(imgUrl, title, description, link, width = 135) {
    let a = link != null ? `<a href="${link}" target="_blank">`:``;
    let ae = link != null ? `</a>`:``;
    let dataDescription = description ? ` data-description="${description}"` : '';
    return `${a}<img src="${imgUrl}" width="${width}" title="${title}" alt="${title}"${dataDescription}>${ae}`;
}

// Utility function
function sortByTitle(a, b) {
    var nameA = a.title.toUpperCase(); // ignore upper and lowercase
    var nameB = b.title.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    // names must be equal
    return 0;
}

function sortByTitleDesc(a, b) {
    return sortByTitle(b, a);
}