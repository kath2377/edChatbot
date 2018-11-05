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

    function welcome(agent) {
        let userId = getUserId();
        return getUserNameByUserId(userId).then(username => {
            if (username != null) {
                return agent.add('Hola ' + username);
            }
            else {
                saveNewUser('', userId, userId.length > 20 ? 'google' : 'facebook');
                return agent.add('¡Eres nuevo! ¿Cómo te llamas?');
            }
        }).catch(error => console.log('ERROR - welcome: ' + error));
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

    function getUserId() {
        if (request.body.originalDetectIntentRequest.payload.source == 'facebook') {
            console.log('facebookUserId = ' + request.body.originalDetectIntentRequest.payload.data.sender.id);
            return request.body.originalDetectIntentRequest.payload.data.sender.id;
        }
        else if (request.body.originalDetectIntentRequest.source == 'google') {
            console.log('googleUserId = ' + request.body.originalDetectIntentRequest.payload.user.userId);
            return request.body.originalDetectIntentRequest.payload.user.userId;
        }
    }

    function getUserNameByUserId(userId) {
        return firebaseAdmin.firestore().collection('users').where('facebookUserId', '==', userId).limit(1).get()
            .then(snapshot => {
                let user = snapshot.docs[0];
                if (!user) {
                    return firebaseAdmin.firestore().collection('users').where('googleUserId', '==', userId).limit(1).get()
                        .then(snapshot => {
                            user = snapshot.docs[0];
                            if (!user) {
                                return null;
                            }
                            else {
                                return user.data().name;
                            }
                        }).catch(error => console.log('ERROR - saveName: ' + error));
                }
                else {
                    return user.data().name;
                }
            }).catch(error => console.log('ERROR - saveName: ' + error));
    }

    function saveNewUser(name, userId, platformType) {
        return firebaseAdmin.firestore().collection('users').add({
            name: name,
            facebookUserId: platformType == 'facebook' ? userId : '',
            googleUserId: platformType == 'google' ? userId : '',
        });
    }

    let intentMap = new Map();
    intentMap.set('SaveMyName', saveName);
    intentMap.set('WatchVideo', sendVideo);
    intentMap.set('AskForConcept', solveConceptQuestion);
    intentMap.set('Default Welcome Intent', welcome);
    return agent.handleRequest(intentMap);
});