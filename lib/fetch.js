const axios = require('axios').default
const fs = require('fs')

/**
 * @typedef {import('./line').line} line
 * @typedef {import('./line').lineCollection} lineCollection
 * @typedef {import('./stop').stop} stop
 */

/**
 * responsible for fetching and computing data
 * @returns {{stops: [stop], lines: lineCollection}}]}}
 */
const initData = async () => {
  const stops = await fetchStops();
  const lines = extractLines(stops);
  return {stops, lines}
}

/**
 * @returns {[stop]} stops
 */
const loadStops = () => {
  return JSON.parse(fs.readFileSync('data/vvo-stops.json'));
}

/**
 * @returns {lineCollection} lines
 */
const loadLines = () => {
  return JSON.parse(fs.readFileSync('data/vvo-lines.json'));
}

/**
 * download json list of vvo stops, save it to disk and return data
 * @returns {Promise<object>}
 */
const fetchStops = async () => {
  return new Promise((resolve, reject) => {
    axios.get('https://www.vvo-online.de/open_data/VVO_STOPS.JSON', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(response => {
      fs.writeFileSync('data/vvo-stops.json', JSON.stringify(response.data))
      resolve(response.data)
    })
  })
}

/**
  * TODO: VVO_LINES.JSON currently only contains data of very low quality.
  *       The problem: #1 duplicate line namings are ignored and only the first
  *       line is used.
  *       The problem: #2 hstid (stopid) does not represent anything meaningful.
  *       (not always start or end of line)

const fetchLines = async () => {
  return new Promise((resolve, reject) => {
    axios.get('https://www.vvo-online.de/open_data/VVO_LINES.JSON', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(response => {
      fs.writeFileSync('data/vvo-lines.json', JSON.stringify(response.data))
      resolve(response.data)
    })
  })
}
*/

/**
 * extract lines from stops described in vvo-stops.json
 * @param {[object]} stops 
 */
const extractLines = (stops) => {
  /** @type {lineCollection} */
  const lines = {} 

  stops.forEach(stop => {
    stop["Lines"].forEach(line => {
      let existingLine = lines[line["TripID"]]

      if (!existingLine) {
        lines[line["TripID"]] = {
          id: line.TripID,
          name: line.LineNr,
          vehicle: line.Vehicle,
          operator: line.Operator,
          route: line.Route,
          stops: [stop.id],
          routes: []
        }
        return
      }

      if (!lines[line["TripID"]].stops.includes(stop.id))
        lines[line["TripID"]].stops.push(stop.id)
    })
  })

  fs.writeFileSync('data/vvo-lines.json', JSON.stringify(lines));
  return lines
}

module.exports = {
  initData,
  loadStops,
  loadLines
}
