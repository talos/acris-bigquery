/**
* @jsx React.DOM
*/
// UPDATE TO USE YOUR PROJECT ID AND CLIENT ID
var project_id = '682518744611';
//var project_id = 'potent-retina-605';
var client_id = '682518744611-ohch249uho63h8csg6qh32s393jsgdvk.apps.googleusercontent.com';
var config = {
  'client_id': client_id,
  'scope': 'https://www.googleapis.com/auth/bigquery.readonly'
};
var plutoProj = 'PROJCS["NAD_1983_StatePlane_New_York_Long_Island_FIPS_3104_Feet",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["False_Easting",984250.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",-74.0],PARAMETER["Standard_Parallel_1",40.66666666666666],PARAMETER["Standard_Parallel_2",41.03333333333333],PARAMETER["Latitude_Of_Origin",40.16666666666666],UNIT["Foot_US",0.3048006096012192]]';
var reproject = proj4(plutoProj).inverse;

var Map = React.createClass({

  getDefaultProps: function() {
    return {
      markers: []
    };
  },

  componentDidMount: function () {
    this.map = L.map(this.getDOMNode()).setView([40.78, -73.97], 12);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return nextProps.markers !== this.props.markers;
  },

  // Remove existing markers from the map before we receive new ones.
  componentWillUpdate: function (nextProps) {
    for (var i in this.props.markers) {
      this.map.removeLayer(this.props.markers[i]);
    }
  },

  render: function () {
    for (var i in this.props.markers) {
      this.props.markers[i].addTo(this.map);
    }
    return (
      <div id="map"></div>
    );
  }

});

var HistoryItem = React.createClass({
  render: function () {
    return (
      <option>{this.props.query}</option>
    )
  }
});

var HistoryBar = React.createClass({

  setQueryText: function (evt) {
    this.props.setQueryText(evt.target.value);
  },

  render: function () {
    var historyItems = [];
    this.props.history.forEach(function (query) {
      historyItems.push(
        <HistoryItem query={query} />
      );
    });
    return (
      <select onChange={this.setQueryText}>
        {historyItems}
      </select>
    );
  }
});

var StatusBar = React.createClass({
  render: function () {
    return (
      <div className="pull-right">
        Status: {this.props.status === 'Done' ?
            'Processed $' + this.props.expense : this.props.status}
      </div>
    );
  }
});

var QueryBar = React.createClass({
  render: function () {
    return (
      <div id="query" className="pull-right">
        <form onSubmit={this.props.onSubmitQuery}>
          <textarea value={this.props.query}
                    onChange={this.props.onQueryTextChange} />
          <button type="submit"
                  className="btn pull-right"
                  disabled={this.props.alreadySubmitted}>
            {this.props.authorized ? "" : "Authorize and " }Query
          </button>
        </form>
      </div>
    );
  }
});

var App = React.createClass({

  getInitialState: function () {
    return {
      query: $('#defaultQuery').text().replace(/\s+/g, ' '),
      history: [],
      markers: []
    };
  },

  authorize: function (callback) {
    var self = this;
    this.setState({'status': 'Authorizing'});
    gapi.auth.authorize(config, function() {
      gapi.client.load('bigquery', 'v2', function () {
        self.setState({authorized: true});
        callback();
      });
    });
  },

  onSubmitQuery: function (evt) {
    if (evt) {
      evt.preventDefault();
    }
    if (this.state.authorized) {
      var request = gapi.client.bigquery.jobs.query({
        'projectId': project_id,
        'timeoutMs': '30000',
        'query': this.state.query
      });
      this.setState({'status': 'Querying'});

      request.execute(this.handleQueryResponse);
    } else {
      this.authorize(this.onSubmitQuery);
    }
  },

  handleQueryResponse: function (response) {
    try {
      var markers = [],
          fields = response.schema.fields;
      for (var i in response.result.rows) {
        var item = response.result.rows[i];
        var xcoord = parseFloat(item.f[0].v);
        var ycoord = parseFloat(item.f[1].v);
        var info = {};
        for (var j in item.f) {
          var value = item.f[j].v;
          var type = fields[j].type;
          var key = fields[j].name;
          if (type === 'TIMESTAMP') {
            value = Date(value);
          }
          info[key] = value;
        }
        if (!isNaN(xcoord) && !isNaN(ycoord)) {
          var lonlat = reproject([xcoord, ycoord]);
          markers.push(L.marker([lonlat[1], lonlat[0]])
            .bindPopup(JSON.stringify(info, undefined, 2)));
        }
      }
      this.state.history.push(this.state.query);
      this.setState({
        status: 'Done',
        response: response,
        markers: markers,
        history: this.state.history
      });
    } catch(err) {
      this.setState({ status: 'Error' });
    }
  },

  onQueryTextChange: function (evt) {
    this.setState({query: evt.target.value});
  },

  setQueryText: function (queryText) {
    this.setState({query: queryText});
  },

  render: function () {
    var lastQuery = this.state.history[this.state.history.length - 1];
    var response = this.state.response;
    if (response && response.result) {
      var expense = ((parseFloat(response.result.totalBytesProcessed) * 5)
                     / (1024 * 1024 * 1024 * 1024)).toFixed(3);
    }
    return (
      <div id="fullpage">
        <header id="header">
          <h1 id="title" className="pull-left">Visual ACRIS</h1>
          <HistoryBar history={this.state.history}
                      setQueryText={this.setQueryText}
          />
          <StatusBar expense={expense}
                     status={this.state.status}
          />
          <QueryBar query={this.state.query}
                    onQueryTextChange={this.onQueryTextChange}
                    onSubmitQuery={this.onSubmitQuery}
                    authorized={this.state.authorized}
                    alreadySubmitted={this.state.query === lastQuery}
          />
        </header>
        <Map markers={this.state.markers} />
      </div>
    )
  }

});

React.renderComponent(
  <App />,
  document.getElementById('body')
);

