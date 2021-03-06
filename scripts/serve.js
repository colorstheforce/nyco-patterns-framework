#!/usr/bin/env node

'use strict'

/**
 * Dependencies
 */

const Express = require('express');
const reload = require('reload');
const path = require('path');
const alerts = require(`${process.env.PWD}/config/alerts`);
const chokidar = require('chokidar');
const http = require('http');

/**
 * Constants
 */

const PORT = process.env.PORT || '7000';
const DIST = path.join(process.env.PWD, 'dist');
const GLOBS = [
  './dist/**/*.html',
  './dist/styles/*.css',
  './dist/scripts/*.js'
];

/**
 * Process CLI args
 */

const argvs = process.argv.slice(2);
const args = {
  watch: (argvs.includes('-w') || argvs.includes('--watch'))
};

 /**
 * Our Chokidar Watcher
 *
 * @param  {Source}  url  https://github.com/paulmillr/chokidar
 */
const watcher = chokidar.watch(GLOBS.map(glob => path.join(process.env.PWD, glob)), {
  usePolling: false,
  awaitWriteFinish: {
    stabilityThreshold: 750
  }
});

/**
 * The Express App
 *
 * @param  {Source}  url  https://expressjs.com/
 */
let APP = new Express();

APP.set('port', PORT); // set the port

/**
 * Application request handler
 */
APP.get('/*', (request, resolve, next) => {
  let req = request.params[0];

  // Allow the reload script to pass
  if (req === 'reload/reload.js') {
    next();
  } else {
    let page = (req === '') ? 'index.html' :
      (req.includes('.')) ? req : `${req}.html`;
    resolve.sendFile(`${DIST}/${page}`);
  }
});

/**
 * Create the http server
 */
let server = http.createServer(APP);

/**
 * Main script, turns the server on to listen to the app
 *
 * @param  {Object}  app  The express app
 */
const main = async (app = APP) => {
  // Set the port to listen on
  server.listen(app.get('port'), () => {
    let port = app.get('port');

    console.log(`${alerts.info} Serving ${alerts.path('./dist/')} to ${alerts.url('http://localhost:' + port)}`);
  });
};

/**
 * Runner for the serve script
 *
 * @param  {Object}  app  The express app
 */
const run = async (app = APP) => {
  if (args.watch) {
    try {
      let reloadReturned = await reload(app);

      main();

      watcher.on('change', () => {
        reloadReturned.reload();

        console.log(`${alerts.watching} Serve reloading`);
      });

      console.log(`${alerts.watching} Serve watching ${alerts.ext(GLOBS.join(', '))}`);
    } catch (err) {
      console.error(`${alerts.error} Serve (run): ${err}`);
    }
  } else {
    main()
  }
};

/** @type  {Object}  Export our methods */
module.exports = {
  'main': main,
  'run': run
};
