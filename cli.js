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
  console.log('fetching data...');
  const {stops, lines} = await fetch.initData();
  console.log(`fetched ${stops.length} stops and ${Object.keys(lines).length} lines`);

  // TODO: add --help

  if (mri(argv)["networks"]) {
    fs.writeFileSync('data/networks.json', JSON.stringify(line.listNetworks(lines), null, 2));
    console.log('generated networks.json');
  }

  if (mri(argv)["graph"]) {
    let g = await graph.createGraph(stops, lines, ["voe"]);
    fs.writeFileSync('data/vvo-graph.json', JSON.stringify(JgfJsonDecorator.toJson(g), null, 2));
    console.log("generated vvo-graph.json");
  }

  if (mri(argv)["geojson"]) {
    if (!fs.existsSync('data/vvo-graph.json')) {
      console.log('please generate vvo-graph.json first using --graph');
      process.exit(1);
    }
    
    let g = JgfJsonDecorator.fromJson(JSON.parse(fs.readFileSync('data/vvo-graph.json', 'utf8')));
    let geoJSON = graph.toGeoJSON(g, stops);
    fs.writeFileSync('data/vvo-graph.geojson', JSON.stringify(geoJSON, null, 2));
    console.log('generated vvo-graph.geojson');
  }
})()
