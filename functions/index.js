'use strict';
const functions = require('firebase-functions');
const videoPlayerThumbnail = 'https://www.nocreasnada.com/wp-content/uploads/2018/08/2018-08-27_5b8418533078a_Using-Videos-Affiliate-Marketing.jpg';

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
const firebaseAdmin = require('firebase-admin');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
firebaseAdmin.initializeApp(functions.config().firebase);

exports.sendMessage = functions.firestore.document('messages/{messageId}')
    .onCreate(event => {
        const messageData = event.data();
        let request = {
            "header" : {"host":"us-central1-edchatbotv1.cloudfunctions.net","user-agent":"Apache-HttpClient/4.5.6 (Java/1.8.0_181)","transfer-encoding":"chunked","accept":"text/plain, */*","accept-charset":"big5, big5-hkscs, cesu-8, euc-jp, euc-kr, gb18030, gb2312, gbk, ibm-thai, ibm00858, ibm01140, ibm01141, ibm01142, ibm01143, ibm01144, ibm01145, ibm01146, ibm01147, ibm01148, ibm01149, ibm037, ibm1026, ibm1047, ibm273, ibm277, ibm278, ibm280, ibm284, ibm285, ibm290, ibm297, ibm420, ibm424, ibm437, ibm500, ibm775, ibm850, ibm852, ibm855, ibm857, ibm860, ibm861, ibm862, ibm863, ibm864, ibm865, ibm866, ibm868, ibm869, ibm870, ibm871, ibm918, iso-2022-cn, iso-2022-jp, iso-2022-jp-2, iso-2022-kr, iso-8859-1, iso-8859-13, iso-8859-15, iso-8859-2, iso-8859-3, iso-8859-4, iso-8859-5, iso-8859-6, iso-8859-7, iso-8859-8, iso-8859-9, jis_x0201, jis_x0212-1990, koi8-r, koi8-u, shift_jis, tis-620, us-ascii, utf-16, utf-16be, utf-16le, utf-32, utf-32be, utf-32le, utf-8, windows-1250, windows-1251, windows-1252, windows-1253, windows-1254, windows-1255, windows-1256, windows-1257, windows-1258, windows-31j, x-big5-hkscs-2001, x-big5-solaris, x-compound_text, x-euc-jp-linux, x-euc-tw, x-eucjp-open, x-ibm1006, x-ibm1025, x-ibm1046, x-ibm1097, x-ibm1098, x-ibm1112, x-ibm1122, x-ibm1123, x-ibm1124, x-ibm1166, x-ibm1364, x-ibm1381, x-ibm1383, x-ibm300, x-ibm33722, x-ibm737, x-ibm833, x-ibm834, x-ibm856, x-ibm874, x-ibm875, x-ibm921, x-ibm922, x-ibm930, x-ibm933, x-ibm935, x-ibm937, x-ibm939, x-ibm942, x-ibm942c, x-ibm943, x-ibm943c, x-ibm948, x-ibm949, x-ibm949c, x-ibm950, x-ibm964, x-ibm970, x-iscii91, x-iso-2022-cn-cns, x-iso-2022-cn-gb, x-iso-8859-11, x-jis0208, x-jisautodetect, x-johab, x-macarabic, x-maccentraleurope, x-maccroatian, x-maccyrillic, x-macdingbat, x-macgreek, x-machebrew, x-maciceland, x-macroman, x-macromania, x-macsymbol, x-macthai, x-macturkish, x-macukraine, x-ms932_0213, x-ms950-hkscs, x-ms950-hkscs-xp, x-mswin-936, x-pck, x-sjis_0213, x-utf-16le-bom, x-utf-32be-bom, x-utf-32le-bom, x-windows-50220, x-windows-50221, x-windows-874, x-windows-949, x-windows-950, x-windows-iso2022jp","content-type":"application/json; charset=UTF-8","function-execution-id":"lhbkfnn24mp2","x-appengine-api-ticket":"7d2bbd083c7fb238","x-appengine-city":"?","x-appengine-citylatlong":"0.000000,0.000000","x-appengine-country":"US","x-appengine-default-version-hostname":"gc95c54bb69c3e073-tp.appspot.com","x-appengine-https":"on","x-appengine-region":"?","x-appengine-request-log-id":"5bdf24b000ff03682e58e2b4920001737e67633935633534626236396333653037332d7470000139303866373866633530636138623435363966303164656633393333393136383a3735000100","x-appengine-user-ip":"35.239.248.33","x-cloud-trace-context":"a7946bbcf417059783b74f77f3a0865a/7179732618228048100;o=1","x-forwarded-for":"35.239.248.33, 35.239.248.33","x-forwarded-proto":"https","accept-encoding":"gzip"},
            "body": {"responseId":"45611e00-1ef4-416d-a4aa-d8596a428e7e","queryResult":{"queryText":"Hola ^_^","action":"input.welcome","parameters":{},"allRequiredParamsPresent":true,"fulfillmentText":"¡Hola!","fulfillmentMessages":[{"text":{"text":["¡Hola!"]}}],"outputContexts":[{"name":"projects/edchatbotv1/agent/sessions/cf70e743-a924-4fe4-b2f2-75a90144a806/contexts/generic","lifespanCount":4,"parameters":{"facebook_sender_id":"1929806290445613"}}],"intent":{"name":"projects/edchatbotv1/agent/intents/611ee44a-df15-43fb-a674-cdd424632250","displayName":"Default Welcome Intent"},"intentDetectionConfidence":1,"languageCode":"es"},"originalDetectIntentRequest":{"payload":{"data":{"sender":{"id":"1929806290445613"},"recipient":{"id":"2179075412163145"},"message":{"nlp":{"entities":{}},"mid":"YGLMBlbCZ8Yk0cZxWRBFTlt-PtK6gBx6l6fe19X0MDZjojbNShL_Jf1_n3v__ugyzK58XRuCpe2w2ZlXb25PJw","text":"Hola ^_^","seq":108},"timestamp":1541350575442},"source":"facebook"}},"session":"projects/edchatbotv1/agent/sessions/cf70e743-a924-4fe4-b2f2-75a90144a806"}
        }
        let response;
        const agent = new WebhookClient({request, response});
        console.log('message body: '+messageData.body);
        agent.add(messageData.body);
    });

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function saveName(agent) {
        const nameParam = agent.parameters.name;
        console.log('name 1: ' + nameParam);
        console.log('name 2: ' + request.body.queryResult.parameters.name);
        return firebaseAdmin.firestore().collection('users').where('name', '==', nameParam).limit(1).get()
            .then(snapshot => {
                let user = snapshot.docs[0];
                if (!user) {
                    console.log('Adding new user');
                    agent.add('Bienvenida ' + nameParam);
                    firebaseAdmin.firestore().collection('users').add({
                        name: nameParam
                    });
                }
                else {
                    console.log('User already exists');
                    agent.add('Bienvenida de nuevo ' + nameParam);
                }
                return Promise.resolve('done');
            }).catch(error => console.log('ERROR - saveName: ' + error));
    }


    function sendVideo(agent) {
        return firebaseAdmin.firestore().collection('learningObjects').where('type', '==', 'video').limit(1).get()
            .then(snapshot => {
                snapshot.forEach((video) => {
                    console.log('video id: ' + video.id);
                    console.log('video name: ' + video.data().name);
                    agent.add(new Card({
                        title: video.data().name,
                        imageUrl: videoPlayerThumbnail,
                        text: '¡Mira este video!',
                        buttonText: 'Ver video',
                        buttonUrl: video.data().url
                    }));
                    agent.add('¡Mira! Encontré este video para ti');
                    agent.add(new Suggestion('Gracias'));
                })
                return Promise.resolve('done');
            }).catch(error => console.log('ERROR - sendVideo: ' + error));
    }

    function solveConceptQuestion(agent) {
        const conceptName = agent.parameters.conceptName;
        console.log('conceptNameee = ' + conceptName);
        return firebaseAdmin.firestore().collection('learningTopics').where('keywords', 'array-contains', conceptName).limit(1).get()
            .then(snapshot => {
                const topic = snapshot.docs[0];
                if (!topic) {
                    console.log('No topic found');
                    return Promise.resolve('done');
                }
                else {
                    console.log('topic name = ' + topic.data().name);
                    console.log('topic id = ' + topic.id);
                    return getMaterialTypeByUser('1bcBLDdYfq4W8ms2NcV8').then(materialType => {
                        console.log('materialType = ' + materialType);
                        return sendLearningObject(agent, topic.id, materialType);
                    }
                    ).catch(error => console.log('ERROR - getMaterialTypeByUser: ' + error));
                }
            }).catch(error => console.log('ERROR - solveConceptQuestion: ' + error));

    }

    //functions not related to Intents
    function sendLearningObject(agent, topicId, materialType) {
        return firebaseAdmin.firestore().collection('learningObjects').where('topicId', '==', topicId).where('type', '==', materialType).get()
            .then(snapshot => {
                const learningObject = snapshot.docs[0];
                if (!learningObject) {
                    console.log('No learningObject found');
                    return Promise.resolve('done');
                }
                else {
                    console.log('object name = ' + learningObject.data().name);
                    return showLearningObject(agent, learningObject).catch(error => console.log('ERROR - showLearningObject: ' + error));
                }
            }).catch(error => console.log('ERROR - sendLearningObject: ' + error));
    }

    function showLearningObject(agent, learningObject) {
        console.log('object type: ' + learningObject.data().type);
        if (learningObject.data().type === 'image' || learningObject.data().type === 'video') {
            console.log('it is an image or a video');
            agent.add(new Card({
                title: learningObject.data().name,
                imageUrl: learningObject.data().type === 'image' ? learningObject.data().url : videoPlayerThumbnail,
                text: learningObject.data().description,
                buttonText: 'Ver',
                buttonUrl: learningObject.data().url
            }));
            agent.add('¡Mira! Puedes revisar este material sobre el tema');
        }
        console.log('the end');
        return Promise.resolve('done');
    }

    function getMaterialTypeByUser(userId) {
        return firebaseAdmin.firestore().collection('userProfiles').where('userId', '==', userId).get()
            .then(snapshot => {
                const userProfile = snapshot.docs[0];
                const chosenMaterialType = userProfile.data().materialTypes[0];
                console.log('chosen material type : ' + chosenMaterialType);
                return chosenMaterialType;
            }).catch(error => console.log('ERROR - getMaterialTypesByUser: ' + error));
    }

    let intentMap = new Map();
    intentMap.set('SaveMyName', saveName);
    intentMap.set('WatchVideo', sendVideo);
    intentMap.set('AskForConcept', solveConceptQuestion);
    return agent.handleRequest(intentMap);
});