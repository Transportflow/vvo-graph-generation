/**
 * @typedef {import('./line').line} line
 * @typedef {import('./line').lineCollection} lineCollection
 * @typedef {import('./stop').stop} stop
 */

const { JgfNode, JgfEdge, JgfGraph, JgfJsonDecorator } = require('./jgf')
const line = require('./line')
const fs = require('fs')
const delay = time => new Promise(resolve => setTimeout(resolve, time))

/**
 *
 * @param {[stop]} stops all stops in the network
 * @param {lineCollection} lines set of lines to create graph from
 * @param {[string]} [tripFilter] list of trip ids to include in the graph
 * @param {int} cooldown time in seconds to wait between querying lines
 * @returns {Promise<JgfGraph>} graph
 */
const createGraph = async (stops, lines, tripFilter, cooldown) => {
  let graph = new JgfGraph('transit-network', 'vvo-network', false, {
    generatedAt: new Date(),
    tripFilter: tripFilter
  })

  // remove all lines whose id is not in the tripFilter
  if (tripFilter) {
    lines = line.filterLines(lines, tripFilter)
  }
  if (Object.keys(lines).length < 20) {
    console.log(`filtering for the following lines:\n ${Object.keys(lines).join(", ")}`)
  } else {
    console.log(`filtering for ${Object.keys(lines).length} lines`)
  }

  return new Promise(async (resolve, reject) => {
    // create nodes
    for (let lineId of Object.keys(lines)) {
      lines[lineId].stops.forEach((s) => {
        try {
          const stop = stops.find(st => st.id === s)
          graph.addNode(
            new JgfNode(stop.id, stop.name, {
              x: parseFloat(stop.x),
              y: parseFloat(stop.y),
              place: stop.place
            })
          )
        } catch (e) {}
      })
    }

    // create edges
    for (let [index, lineId] of Object.keys(lines).entries()) {
      try {
        let edges = await line.generateEdges(lines[lineId], stops)
        edges.forEach(e => {
          let existingEdges = graph.getEdgesByNodes(e.source, e.target);

          if (existingEdges.length > 1) {
            // warn about duplicate edges
            console.log(`${existingEdges.length} edges between ${e.source} and ${e.target}`)
          }

          existingEdges.forEach(edge => {
            // if the edge already exists, update the tripIds
            // prevent duplicate entries

            if (!edge.metadata.lines.includes(e.metadata.lines[0])) {
              edge.metadata.lines.push(e.metadata.lines[0]);
            }
            if (!edge.metadata.tripIds.includes(e.metadata.tripIds[0])) {
              edge.metadata.tripIds.push(e.metadata.tripIds[0]);
            }
          })

          if (existingEdges.length === 0) {
            // if the edge doesn't exist, create it
            graph.addEdge(e)
          }
        })
        console.log(`computed ${index + 1}/${Object.keys(lines).length} trips`)
        
        if (index + 1 < Object.keys(lines).length) {
          console.log(`added ${edges.length} edges for line ${lineId}; cooling down ${cooldown} seconds`)
          await delay(cooldown * 1000)
        } else {
          console.log(`added ${edges.length} edges for line ${lineId}; done`)
        }
      } catch (e) {}
      fs.writeFileSync('./data/vvo-graph-tmp.json', JSON.stringify(JgfJsonDecorator.toJson(graph)))
    }
    resolve(graph)
  })
}

/**
 * @param {JgfGraph} graph 
 * @param {[stop]} stops all stops in the network
 * @returns {object}
 */
const toGeoJSON = (graph, stops) => {
  let nodes = graph.nodes.map(n => nodeToGeoJSON(n))
  let edges = graph.edges.map(e => edgeToGeoJSON(e, stops))
  return {
    type: 'FeatureCollection',
    features: [
      ...nodes,
      ...edges
    ]
  }
}

/**
 * @param {JgfNode} node 
 * @returns {object}
 */
const nodeToGeoJSON = (node) => {
  return {
    type: 'Feature',
    properties: {
      id: node.id,
      name: node.label,
    },
    geometry: {
      type: 'Point',
      coordinates: [node.metadata.x, node.metadata.y]
    }
  }
}

/**
 * @param {JgfEdge} edge
 * @param {[stop]} stops all stops in the network
 * @returns {object}
 */
const edgeToGeoJSON = (edge, stops) => {
  let from = stops.find(s => s.id === edge.source)
  let to = stops.find(s => s.id === edge.target)
  return {
    type: 'Feature',
    properties: {
      id: edge.id,
      name: edge.metadata.tripIds,
      line: edge.metadata.lines,
      time: edge.metadata.time,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [parseFloat(from.x), parseFloat(from.y)],
        [parseFloat(to.x), parseFloat(to.y)]
      ]
    }
  }
}


module.exports = {
  createGraph,
  toGeoJSON
}
