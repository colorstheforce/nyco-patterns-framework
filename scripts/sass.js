#!/usr/bin/env node

/**
 * Dependencies
 */

const sass = require('sass');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const alerts = require(`${process.env.PWD}/config/alerts`);

/** Config Getter */
const config = () => {
  return require(`${process.env.PWD}/config/sass`);
};

/** Set options for PostCSS */
const options = config();

/** Get Modules */
const modules = config();

/**
 * The single command for Sass to process a Sass Module
 *
 * @param   {Array}  files  The contents of config/sass.js
 */
const main = async (style) => {
  let outDir = path.join(process.env.PWD, style.outDir);
  let name = style.outFile;

  try {
    if (!fs.existsSync(outDir)) {
      await mkdirp(outDir);
    }

    let result = await sass.renderSync(style);

    await fs.writeFileSync(`${outDir}${name}`, result.css);

    console.log(`${alerts.styles} Sass compiled to ${alerts.path(style.outDir + name)}`);
  } catch (err) {
    let error = (err.formatted) ? err.formatted : err;
    console.log(`${alerts.error} Sass failed: ${error}`);
  }
}

/**
 * A batch process function for each Sass Module for Sass to run on
 *
 * @param   {Array}  files  The contents of config/sass.js
 */
const run = async (styles = modules) => {
  let i = 0;

  try {
    for (i; i < styles.length; i++) {
      await main(styles[i]);
    }
  } catch (err) {
    console.log(`${alerts.error} Sass failed: ${err}`);
  }
};

/** @type  {Object}  Export our methods */
module.exports = {
  'main': main,
  'run': run,
  'config': config,
  'options': options,
  'modules': modules
};
