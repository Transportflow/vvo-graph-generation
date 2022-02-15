# vvo-graph-generation

It can be quite useful to have a graph (in the [JsonGraphFormat](http://jsongraphformat.info)) of a public transport network, possible usecases include:
- the generation of a visually appealing map of the network
- finding a route
- giving meaningful information about the approximate location of a vehicle based on departure monitors
- assigning a user to an edge or node of the graph based on their geolocation

Because VVO doesn't provide information about all line trips, the graph is build up utilizing the following techniques:
1. [VVO_STOPS.JSON](https://www.vvo-online.de/open_data/VVO_STOPS.JSON) (a list of all stops from VVO) is used to extract all lines in the network (stored under `data/vvo-lines.json`; note that there is a [VVO_LINES.JSON](https://www.vvo-online.de/open_data/VVO_LINES.JSON) provided by VVO, but due to its lack of information, it is not used)
2. For every line, a random stop that serves the line is chosen. Using the trip detail api (`https://webapi.vvo-online.de/dm/trip` which needs a specific stop) a stoporder is queried and converted into edges. This is repeated until all line stops have been visited and converted to edges.
3. Finally it is possible to convert the graph into a geoJSON file for visual representation.

**A prebuilt and automatically regenerated graph is not yet available.**

**Usage:** `node cli.js --help`

**Please be aware:** Using the described method does not guarantee that all lines are perfectly represented in the graph. This is due to the fact that the `/dm/trip` api only works for approximately the next 24 hours. Running the script for e.g. in the holidays will result in many regional lines not being represented. Therefore, it would be good to obtain some official data from VVO like seen in the [VVO_LINES.JSON](https://www.vvo-online.de/open_data/VVO_LINES.JSON) file (however currently the line data is not very useful).

### Credits
- [kiliankoe/vvo](https://github.com/kiliankoe/vvo)
- [derhuerst/generate-vbb-graph](https://github.com/derhuerst/generate-vbb-graph)
