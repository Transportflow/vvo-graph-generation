/**
 * @typedef {object} line
 * @property {string} id
 * @property {string} name line name (e.g. "11", "61", "63")
 * @property {string} vehicle vehicle type (e.g. "Regionalbus", "Straßenbahn") // TODO: parse
 * @property {string} operator name of operator (e.g. "VVO", "DVB", ...)
 * @property {string} route human readable route (e.g. "Pillnitz - Wasaplatz - Löbtau")
 * @property {[string]} stops all stops where this line is running (including trips to depot)
 * @property {[[string]]} routes defined trips, order of stops that real vehicles drive // TODO: actually populate
 *
 * @typedef {Object.<string, line>} lineCollection
 *
 * @typedef {import('./stop').stop} stop
 */

/**
 * @typedef {object} webapiTrip
 * @property {[webapiTripStop]} Stops
 * 
 * @typedef {object} webapiTripStop
 * @property {string} Id stop id
 * @property {string} DhId german stop id
 * @property {string} Name stop name
 * @property {string} Place place name
 * @property {string} Time time of departure, formatted like /Date(1644840600000-0000)/
 */

const { JgfEdge } = require('./jgf')

const fs = require('fs')
const axios = require('axios').default

/**
 *
 * @param {line} line
 * @param {stop} stop
 * @returns {Promise<[JgfEdge]>} edges
 */
const getTrip = (line, stop) => {
  return new Promise(async (resolve, reject) => {
    /**
     * @type {webapiTrip}
     */
    const response = await axios.post(`https://webapi.vvo-online.de/dm/trip`, {
      tripid: line.id,
      time: new Date().toISOString(),
      stopid: stop
    }, {
      headers: {
        'Content-Type': 'application/json',
        charset: 'utf-8'
      }
    }).catch(err => {
      fs.writeFileSync(`./data/log/${new Date().toISOString()}.json`, JSON.stringify(err))
      resolve([])
    })

    if (!response || !response.data) {
      resolve([])
      return
    }
    let edges = []
    response.data.Stops.forEach((stop, index) => {
      if (index === 0) return

      // calculate time difference between this and previous stop's time formatted like /Date(1644840600000-0000)/
      const timeDiff = parseInt(stop.Time.substring(6, stop.Time.length - 10)) - parseInt(response.data.Stops[index - 1].Time.substring(6, response.data.Stops[index - 1].Time.length - 10))

      edges.push(new JgfEdge(response.data.Stops[index - 1].Id, stop.Id, "regional", undefined, {lines: [line.name], tripIds: [line.id], time: timeDiff}, false))
    })
    resolve(edges)
  })
}

/**
 * acquires a random stop from the line, gets a trip based on stopid and current time
 * based on returned trip it generates edges that are not already present in the graph
 * repeats this process for all stops that are not visited or not part of an edge
 * @param {line} line to generate edges for
 * @param {[stop]} stops all stops in the network
 * @returns {Promise<[JgfEdge]>} edges
 */
const generateEdges = async (line, stops) => {
  const visitedStops = []
  const edges = []

  // count in order to avoid infinite loops
  let remainingAttempts = 20

  return new Promise(async (resolve, reject) => {
    while (visitedStops.length < line.stops.length && remainingAttempts > 0) {
      const stop = line.stops.find((stop) => !visitedStops.includes(stop))
      console.log(stop)
      visitedStops.push(stop)
      const trip = await getTrip(line, stop)
      
      trip.forEach((edge) => {
        if (!visitedStops.find((visitedStop) => visitedStop === edge.target)) {
          visitedStops.push(edge.target)
        }
        if (!visitedStops.find((visitedStop) => visitedStop === edge.source)) {
          visitedStops.push(edge.source)
        }

        edges.push(edge)
      })

      remainingAttempts--
    }
    resolve(edges)
  })
}

/**
 * @param {lineCollection} lines all lines
 * @param {[string]} filter trip ids to include in output, it is possible to apply a wildcard
 * @returns {lineCollection} lines that are part of the filter
 */
const filterLines = (lines, filter) => {
  const filteredLines = {}
  Object.keys(lines).forEach((lineId) => {
    const line = lines[lineId]
    if (filter.find((f) => line.id.startsWith(f))) {
      filteredLines[lineId] = line
    }
  })
  return filteredLines
}

module.exports = {
  generateEdges,
  filterLines
}
