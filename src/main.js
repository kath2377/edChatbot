const http = require('http');
//import * as tf from '@tensorflow/tfjs';
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const userData = require('./userData.json');
const userDataTesting = require('./userDataTesting.json');


const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

/* // Define a model for linear regression.
const model = tf.sequential();
model.add(tf.layers.dense({units: 1, inputShape: [1]}));

// Prepare the model for training: Specify the loss and the optimizer.
model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});

// Generate some synthetic data for training.
const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

// Train the model using the data.
model.fit(xs, ys, {epochs: 10}).then(() => {
  // Use the model to do inference on a data point the model hasn't seen before:
  model.predict(tf.tensor2d([5], [1, 1])).print();
}); */

const trainingData = tf.tensor2d(userData.map(item => [item.dimension1, item.dimension2, item.dimension3, item.dimension4]));
const outputData = tf.tensor2d(userData.map(item => [
  item.profile === 'prof1' ? 1 : 0,
  item.profile === 'prof2' ? 1 : 0,
  item.profile === 'prof3' ? 1 : 0
]));
const testingData = tf.tensor2d(userDataTesting.map(item => [item.dimension1, item.dimension2, item.dimension3, item.dimension4]));

const model = tf.sequential();

model.add(tf.layers.dense({
  inputShape:[4],
  activation:"sigmoid",
  units:5
}));
model.add(tf.layers.dense({
  inputShape:[5],
  activation:"sigmoid",
  units:3
}));
model.add(tf.layers.dense({
  activation: "sigmoid",
  units: 3,
}))

model.compile({
  loss:"meanSquaredError",
  optimizer:tf.train.adam(.06)
});

model.fit(trainingData, outputData, {epochs: 100}).then(
  (history) => {
    console.log(history);
    model.predict(testingData).print();
  }
);
