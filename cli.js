const fetch = require('./lib/fetch');
const stop = require('./lib/stop');
const line = require('./lib/line');
const graph = require('./lib/graph');

const fs = require('fs');
const mri = require('mri');
const argv = process.argv.slice(2);

const { JgfJsonDecorator } = require('./lib/jgf');

/**
 * @typedef {import('./line').line} line
 * @typedef {import('./line').lineCollection} lineCollection
 * @typedef {import('./stop').stop} stop
 */

(async () => {
  const arg = mri(argv, {
    alias: {
      'help': 'h',
    }
  });

  if (arg["help"] || argv.length === 0) {
    console.log(`
    Usage: node cli.js [options]
    Options:
      --help, -h: show this help
      --graph: generate a network graph
        --cooldown: seconds to wait between line queries while building graph; default 10s
        --trip-filter: filter the graph to only include the given trip ids; optional
                       note: the trip ids can be wildcards if you only 
                       provide the first part (e.g. "voe" instead of "voe:910F1")
      --geojson: generate a geojson file from the previously generated graph
    Example:
      node cli.js --graph --trip-filter=voe,ddb,voe:910F1: --cooldown=15
    `);
    return
  }

  console.log('fetching data...');
  const {stops, lines} = await fetch.initData();
  console.log(`fetched ${stops.length} stops and ${Object.keys(lines).length} lines`);

  if (arg["graph"]) {
    let g = await graph.createGraph(
      stops, 
      lines, 
      arg["trip-filter"] ? arg["trip-filter"].split(',') : undefined,
      arg["cooldown"] ? parseInt(arg["cooldown"]) : 10
    );
    fs.writeFileSync('data/vvo-graph.json', JSON.stringify(JgfJsonDecorator.toJson(g), null, 2));
    console.log("generated vvo-graph.json");
    return
  }

  if (arg["geojson"]) {
    if (!fs.existsSync('data/vvo-graph.json')) {
      console.log('please generate vvo-graph.json first using --graph');
      process.exit(1);
    }
    
    let g = JgfJsonDecorator.fromJson(JSON.parse(fs.readFileSync('data/vvo-graph.json', 'utf8')));
    let geoJSON = graph.toGeoJSON(g, stops);
    fs.writeFileSync('data/vvo-graph.geojson', JSON.stringify(geoJSON, null, 2));
    console.log('generated vvo-graph.geojson');
    return
  }
})()
