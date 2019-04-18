/**
 * Feel free to explore, or check out the full documentation
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/writing-scripted-browsers
 * for details.
 * 
 * I recommend using Secure Credentials for this script as denoted by `$secure`
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/using-monitors/secure-credentials-store-credentials-information-scripted-browsers
 */

// urllib is required to make API calls
var urllib = require('urllib'),
    latestVersion = '0.5.2',
    myAdminKey = '{MyAdminAPIKey}',
    myAccountID = '{MyAccountID}',
    myInsertKey = '{MyInsertKey}',
    apiUri = 'https://synthetics.newrelic.com/synthetics/api/v3/monitors/',
    monitors = [],
    startTime = Date.now(),
    stepStartTime = Date.now(),
    step = 0;

// Function for logging steps to console
var log = function(thisMsg, thisResult) {
  stepStartTime = Date.now() - startTime;
  console.log('Step ' + step + ': ' + thisMsg + ' : '+ JSON.stringify(thisResult) + ' STARTED at ' + stepStartTime + 'ms.');
  step ++
};

// This searches the links header for one that contains 'next'. 
let splitLinks = (linksArray) => {
  let nextLink;
  for (let l in linksArray){
    if (linksArray[l].indexOf('next') !== -1){
      nextLink = linksArray[l].substring(1, linksArray[l].indexOf('>')) 
      log("NextLink found", nextLink)
      return nextLink;
    }
  }
}

// Recursive function to keep grabbing pages of monitors while a next link exists
let getMonitors = (url, monitors, resolve, reject) => {
  urllib.request(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Api-Key': myAdminKey,
    }
  }, function(err, data, res) {
    if(err){
      log("Error", err)
      reject(err)
    }
    let mons = JSON.parse(data).monitors,
        retrievedMonitors = monitors;
    log("Monitors Found", mons)

    // Create a new Event for each monitor that is less than v0.5.2
    mons.forEach((mon) => {
      if(mon.apiVersion !== latestVersion){ 
        let newEvent = {
          eventType: 'OutdatedMonitors',
          link: 'https://synthetics.newrelic.com/accounts/' + myAccountID + '/monitors/'+ mon.id +'/edit',
          version: mon.apiVersion,
          name: mon.name
        }
        retrievedMonitors.push(newEvent)
      }
    })

    const link = res.headers.link,
          linksArray = link.split(', ');

    log("Links Array Found", linksArray);

    const nextLink = splitLinks(linksArray)

    if(nextLink){
      log("More monitors to do", nextLink);
      getMonitors(nextLink, retrievedMonitors, resolve, reject);
    } else {
      log("Got all monitors", retrievedMonitors);
      resolve(retrievedMonitors);
    }

      
  })
}

// Use a Promise to start the script
new Promise((resolve, reject) => {
    getMonitors(apiUri, monitors, resolve, reject);
  })
  .then(response => {
    log("Final Monitors", response);

    // Send the Events to Insights
    return urllib.request('https://insights-collector.newrelic.com/v1/accounts/' + myAccountID + '/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Insert-Key': myInsertKey,
          },
          data: response
        }, function(err, data, res){
          if(err){
            log("Events not sent", err);
            throw err;
          }
          log("Custom Events sent to Insights", res);
        });
  });
