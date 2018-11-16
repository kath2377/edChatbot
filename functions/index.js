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

const DEFAULT_UNIT_ID = 'gIhqWazA4yaOGY6zDKsr';
const GLOBAL_CONTENT_PRESENTATION = 'global';

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
        console.log('user-data: '+JSON.stringify(agent.getContext('user-data').parameters));
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
                    return getMaterialTypeByUser(agent.getContext('user-data').parameters.userId).then(materialType => {
                        console.log('materialType = ' + materialType);
                        return sendLearningObject(agent, topic.id, materialType);
                    }
                    ).catch(error => console.log('ERROR - getMaterialTypeByUser: ' + error));
                }
            }).catch(error => console.log('ERROR - solveConceptQuestion: ' + error));

    }

    function welcome(agent) {
        let accountUserId = getAccountUserId();
        return getUserNameByAccountUserId(accountUserId).then(username => {
            if (username != null) {
                return getUserIdByAccountUserId(accountUserId).then(userId => {
                    console.log('userId found for accountUserId = ' + userId);
                    agent.setContext({
                        name: 'user-data',
                        lifespan: 45,
                        parameters: { userId: userId }
                    });
                    return getContentPresentationByUser(userId).then(contentPresentation => {
                        if (contentPresentation == GLOBAL_CONTENT_PRESENTATION) {
                            return getContentTopicsByUnitId(DEFAULT_UNIT_ID).then(topics => {
                                agent.add('Hola ' + username + ' ¿Qué tema deseas ver hoy?');
                                console.log('Topics array:' + JSON.stringify(topics));
                                topics.forEach(topicName => agent.add(new Suggestion(topicName)));
                                return Promise.resolve("done");
                            });

                        }
                        else {
                            agent.add('Hola ' + username);
                            return Promise.resolve('done');
                        }

                    });

                });
            }
            else {
                saveNewUser('', accountUserId, accountUserId.length > 20 ? 'google' : 'facebook');
                return agent.add('¡Eres nuevo! ¿Cómo te llamas?');
            }
        }).catch(error => console.log('ERROR - welcome: ' + error));
    }

    function finishTopic(agent) {
        agent.setContext({
            name: 'topic-finished',
            lifespan: 2,
            parameters: { topicKeyword: agent.parameters.topicKeyword }
        });
        agent.add('¡Felicidades! ¿Puedo hacerte unas preguntas?');
    }
    function askQuestion(agent) {
        console.log('context:::::::: '+agent.getContext('topic-finished')+' o '+JSON.stringify(agent.getContext('topic-finished')));
        const topicKeyword = agent.getContext('topic-finished').parameters.topicKeyword;
        return firebaseAdmin.firestore().collection('learningTopics').where('keywords', 'array-contains', topicKeyword).limit(1).get()
            .then(snapshot => {
                const topic = snapshot.docs[0];
                if (!topic) {
                    console.log('No topic found');
                    return Promise.resolve('done');
                }
                else {
                    console.log('topic name = ' + topic.data().name);
                    console.log('topic id = ' + topic.id);
                    return getQuestionByTopicId(topic.id).then(question => {
                        console.log('question : ' + question.wording);
                        agent.add(question.wording);
                        agent.setContext({
                            name: 'quiz',
                            lifespan: 1,
                            parameters: { question: question }
                        });
                        return Promise.resolve('done');
                    }
                    ).catch(error => console.log('ERROR - getQuestionByTopicId: ' + error));
                }
            }).catch(error => console.log('ERROR - askQuestion: ' + error));
    }

    function checkQuestionAnswer(agent) {
        const answer = agent.parameters.answer;
        const quizContext = agent.getContext('quiz');
        if (quizContext.parameters.question.options.indexOf(answer) == quizContext.parameters.question.correctOptionIndex) {
            agent.add('¡Respuesta correcta!');
        }
        else {
            agent.add('La respuesta correcta era ' + quizContext.parameters.question.options[quizContext.parameters.question.correctOptionIndex]);
        }

    }

    function handleAvoidedQuestion(agent) {
        //Manage repeated code from function solveConceptQuestion
        agent.add('Ok no te preocupes, podemos reforzarlo con otro material. ');
        const topicKeyword = agent.getContext('topic-finished').parameters.topicKeyword;
        return firebaseAdmin.firestore().collection('learningTopics').where('keywords', 'array-contains', topicKeyword).limit(1).get()
            .then(snapshot => {
                const topic = snapshot.docs[0];
                if (!topic) {
                    console.log('No topic found');
                    return Promise.resolve('done');
                }
                else {
                    console.log('topic name = ' + topic.data().name);
                    console.log('topic id = ' + topic.id);
                    return getMaterialTypeByUser(agent.getContext('user-data').parameters.userId).then(materialType => {
                        console.log('materialType = ' + materialType);
                        return sendLearningObject(agent, topic.id, materialType);
                    }
                    ).catch(error => console.log('ERROR - getMaterialTypeByUser: ' + error));
                }
            }).catch(error => console.log('ERROR - handleAvoidedQuestion: ' + error));
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

    function getContentPresentationByUser(userId) {
        return firebaseAdmin.firestore().collection('userProfiles').where('userId', '==', userId).get()
            .then(snapshot => {
                const userProfile = snapshot.docs[0];
                const contentPresentation = userProfile.data().contentPresentation;
                console.log('contentPresentation : ' + contentPresentation);
                return contentPresentation;
            }).catch(error => console.log('ERROR - getContentPresentationByUser: ' + error));
    }

    function getAccountUserId() {
        if (request.body.originalDetectIntentRequest.payload.source == 'facebook') {
            console.log('facebookUserId = ' + request.body.originalDetectIntentRequest.payload.data.sender.id);
            return request.body.originalDetectIntentRequest.payload.data.sender.id;
        }
        else if (request.body.originalDetectIntentRequest.source == 'google') {
            console.log('googleUserId = ' + request.body.originalDetectIntentRequest.payload.user.userId);
            return request.body.originalDetectIntentRequest.payload.user.userId;
        }
    }

    function getUserIdByAccountUserId(accountUserId) {
        return firebaseAdmin.firestore().collection('users').where('facebookUserId', '==', accountUserId).limit(1).get()
            .then(snapshot => {
                let user = snapshot.docs[0];
                if (!user) {
                    return firebaseAdmin.firestore().collection('users').where('googleUserId', '==', accountUserId).limit(1).get()
                        .then(snapshot => {
                            user = snapshot.docs[0];
                            if (!user) {
                                return null;
                            }
                            else {
                                return user.id;
                            }
                        }).catch(error => console.log('ERROR - getUserIdByAccountUserId: ' + error));
                }
                else {
                    return user.id;
                }
            }).catch(error => console.log('ERROR - getUserIdByAccountUserId: ' + error));
    }

    function getUserNameByAccountUserId(accountUserId) {
        return firebaseAdmin.firestore().collection('users').where('facebookUserId', '==', accountUserId).limit(1).get()
            .then(snapshot => {
                let user = snapshot.docs[0];
                if (!user) {
                    return firebaseAdmin.firestore().collection('users').where('googleUserId', '==', accountUserId).limit(1).get()
                        .then(snapshot => {
                            user = snapshot.docs[0];
                            if (!user) {
                                return null;
                            }
                            else {
                                return user.data().name;
                            }
                        }).catch(error => console.log('ERROR - getUserNameByAccountUserId: ' + error));
                }
                else {
                    return user.data().name;
                }
            }).catch(error => console.log('ERROR - getUserNameByAccountUserId: ' + error));
    }

    function saveNewUser(name, userId, platformType) {
        return firebaseAdmin.firestore().collection('users').add({
            name: name,
            facebookUserId: platformType == 'facebook' ? userId : '',
            googleUserId: platformType == 'google' ? userId : '',
        });
    }

    function getContentTopicsByUnitId(unitId) {
        return firebaseAdmin.firestore().collection('learningTopics').where('unitId', '==', unitId).get()
            .then(snapshot => {
                let topics = [];
                snapshot.forEach((topic) => {
                    console.log('topic id: ' + topic.id);
                    topics.push(topic.data().name);
                });
                return topics;
            }).catch(error => console.log('ERROR - getContentTopicsByUnitId: ' + error));
    }

    function getQuestionByTopicId(topicId) {
        return firebaseAdmin.firestore().collection('questions').where('topicId', '==', topicId).limit(1).get()
            .then(snapshot => {
                const question = snapshot.docs[0].data();
                return question;
            }).catch(error => console.log('ERROR - getQuestionByTopicId: ' + error));
    }

    let intentMap = new Map();
    intentMap.set('SaveMyName', saveName);
    intentMap.set('WatchVideo', sendVideo);
    intentMap.set('AskForConcept', solveConceptQuestion);
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('GetQuestion', askQuestion);
    intentMap.set('AnswerQuestion', checkQuestionAnswer);
    intentMap.set('FinishTopic', finishTopic);
    intentMap.set('AvoidQuestion', handleAvoidedQuestion);
    return agent.handleRequest(intentMap);
});