'use strict';
const functions = require('firebase-functions');

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
                        imageUrl: 'https://www.nocreasnada.com/wp-content/uploads/2018/08/2018-08-27_5b8418533078a_Using-Videos-Affiliate-Marketing.jpg',
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
        console.log('conceptName = ' + conceptName);
        return firebaseAdmin.firestore().collection('learningUnits/{unitId}/topics').where('keywords', 'array-contains', conceptName).limit(1).get()
            .then(snapshot => {
                const topic = snapshot.docs[0];
                if(!topic){
                    console.log('No topic found');
                }
                else{
                    console.log('topic name = ' + topic.data().name);
                }
                return Promise.resolve('done');
            }).catch(error => console.log('ERROR - solveConceptQuestion: ' + error));

    }

    let intentMap = new Map();
    intentMap.set('SaveMyName', saveName);
    intentMap.set('WatchVideo', sendVideo);
    intentMap.set('AskForConcept', solveConceptQuestion);
    return agent.handleRequest(intentMap);
});