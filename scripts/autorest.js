// Helper functions for dealing with autorest generation of the HTTP client object.

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const exec = require('child_process').exec;

const request = require('request');

const defaultAutoRestVersion = '0.17.0-Nightly20161011';
const nugetExe = path.join('tools', 'nuget.exe');
const nugetSource = 'https://www.myget.org/F/autorest/api/v2';

const isWindows = (process.platform.lastIndexOf('win') === 0);
function clrCmd(cmd) {
  return isWindows ? cmd : `mono ${cmd}`;
}

function constructAutorestExePath(version) {
  return path.join('packages', `Autorest.${version}`, 'tools', 'AutoRest.exe');
}

function checkStats(path, predicate) {
  try {
    const stats = fs.statSync(path);
    return predicate(stats);
  }
  catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

function downloadNuget() {
  if (checkStats(nugetExe, s => s.isFile())) {
    return Promise.resolve();
  }

  if (!checkStats(path.dirname(nugetExe), s => s.isDirectory())) {
    fs.mkdirSync(path.dirname(nugetExe));
  }

  return new Promise((resolve, reject) => {
    let finished = false;
    const s = request('https://nuget.org/nuget.exe')
      .pipe(fs.createWriteStream(nugetExe));

    s.on('error', (e) => {
      if (!finished) {
        finished = true;
        reject(e);
      }
    });

    s.on('finish', () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    });
  });
}

function downloadTools() {
  return downloadNuget()
    .then(downloadAutorest);
}

function downloadAutorest() {
  if (checkStats(constructAutorestExePath(defaultAutoRestVersion), s => s.isFile())) {
    return Promise.resolve();
  }

  var nugetCmd = `${clrCmd(nugetExe)} install Autorest -Source ${nugetSource} -Version ${defaultAutoRestVersion} -o packages`;
  console.log(`Downloading default AutoRest version: ${nugetCmd}`);
  return new Promise((resolve, reject) => {
    exec(nugetCmd, function (err, stdout, stderr) {
      console.log(stdout);
      console.error(stderr);
      if (err) { reject(err); }
      else { resolve(); }
    });
  });
}

function generateCode(swaggerFile, dest, clientName) {
  const autoRestExe = constructAutorestExePath(defaultAutoRestVersion);
  const cmd = `${autoRestExe} -Modeler Swagger -i ${swaggerFile} -AddCredentials true -ClientName ${clientName} -CodeGenerator NodeJS -OutputDirectory ${dest} -ft 3`;
  console.log(`Running AutoRest to generate code: ${cmd}`);
  return new Promise((resolve, reject) => {
    exec(clrCmd(cmd), function (err, stdout, stderr) {
      console.log(stdout);
      console.error(stderr);
      if (err) { reject(err); }
      else { resolve(); }
    })
  });
}

//
// Fix up the swagger file so that we have consistent operationIds and remove the
// bad empty paths.
//

function fixupRawSwagger(rawSwaggerPath, fixedSwaggerPath) {
  let swagger = JSON.parse(fs.readFileSync(rawSwaggerPath, 'utf8'));
  let urlPaths = Object.keys(swagger.paths);
  urlPaths.forEach(urlPath => {
    if (_.isEmpty(swagger.paths[urlPath])) {
      delete swagger.paths[urlPath];
    } else {
      let operations = _.toPairs(swagger.paths[urlPath]);
      operations.forEach(([method, operationObj]) => {
        if (!operationIdIsValid(operationObj)) {
          if (operationObj.operationId) {
            operationObj.operationId = `${getArea(operationObj)}_${operationObj.operationId}`;
          } else {
            operationObj.operationId = `${getArea(operationObj)}_${method}${urlPathToOperation(urlPath)}`;
          }
        }
      });
    }
  });

  fs.writeFileSync(fixedSwaggerPath, JSON.stringify(swagger, null, 2), 'utf8');
}

// Is the operationId present and of the form "area_id"
function operationIdIsValid(operationObj) {
  return operationObj.operationId && operationIdHasArea(operationObj);
}

function operationIdHasArea(operationObj) {
  return operationObj.operationId.includes('_');
}

function getArea(operationObj) {
  if (operationObj.tags && operationObj.tags.length > 0) {
    return operationObj.tags[0];
  }
  return 'misc';
}

// Case conversion for path parts used in generating operation Ids
function snakeToPascalCase(s) {
  return s.split('_')
    .filter(_.negate(_.isEmpty))
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join('');
}

function removeIllegalCharacters(s) {
  return s.replace(/\./g, '');
}

function convertParameter(part) {
  if (part[0] === '{') {
    return `by_${part.slice(1, -1)}`;
  }
  return part;
}

function urlPathToOperation(urlPath) {
  return urlPath.split('/')
    .filter(_.negate(_.isEmpty))
    .map(convertParameter)
    .map(removeIllegalCharacters)
    .map(snakeToPascalCase)
    .join('');
}

module.exports = {
  downloadTools,
  generateCode,
  fixupRawSwagger
};
