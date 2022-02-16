/**
 * @typedef {import('./line').line} line
 * @typedef {import('./line').lineCollection} lineCollection
*/

/**
 * @typedef {object} stop
 * @property {[StopLine]} Lines lines that serve this stop
 * @property {string} gid globale id; vgl hstid (german Haltestellenverzeichnis)
 * @property {string} place place name
 * @property {string} name name of stop
 * @property {string} x longitude
 * @property {string} y latitude
 * @property {string} id
 */

/**
 * @typedef {object} StopLine
 * @property {string} Operator
 * @property {string} Route
 * @property {string} Vehicle
 * @property {string} TripID
 * @property {string} LineNr
 */

/**
 * @param {line} line 
 * @param {[stop]} stops 
 * @returns {[stop]} stops that are served by line
 */
const retrieveStops = (line, stops) => {
  const output = []
  line.stops.forEach(stopId => {
    const stop = stops.find(stop => stop.id === stopId && stop.x && stop.y)
    if (stop) {
      output.push(stop)
    }
  })
  return output
}

/**
 * @param {[stop]} stops to parse
 * @returns {object} stops as GeoJSON FeatureCollection
 */
const toGeoJSON = (stops) => {
  const features = []
  stops.forEach(stop => {
    features.push({
      type: 'Feature',
      properties: {
        name: stop.name,
        id: stop.id
      },
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(stop.x), parseFloat(stop.y)]
      }
    })
  })
  return {
    type: 'FeatureCollection',
    features: features
  }
}

module.exports = {
  toGeoJSON,
  retrieveStops
}
