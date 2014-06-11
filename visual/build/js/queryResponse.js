/**
* @jsx React.DOM
*/

// HELPERS
var reproject = proj4('PROJCS["NAD_1983_StatePlane_New_York_Long_Island_FIPS_3104_Feet",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["False_Easting",984250.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",-74.0],PARAMETER["Standard_Parallel_1",40.66666666666666],PARAMETER["Standard_Parallel_2",41.03333333333333],PARAMETER["Latitude_Of_Origin",40.16666666666666],UNIT["Foot_US",0.3048006096012192]]').inverse;

// REACT CLASSES

var Marker = React.createClass({

  render: function () {
    var data = this.props.data,
        markerRows = [];

    for (var k in data) {
      markerRows.push(
        <tr>
          <th>{k}:</th>
          <td>{data[k]}</td>
        </tr>
      );
    }
    return (
      <div className="marker">
        <table>
          {markerRows}
        </table>
      </div>
    );
  }
});

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
    //for (var i in this.props.markers) {
    //  var marker = this.props.markers[i];
    var self = this;
    for (i in this.props.markers) {
      var marker = this.props.markers[i];
      marker
          //.bindPopup('foo')
          //.bindPopup(rendered)
            .addTo(self.map);
      //debugger;
    };
    return (
      <div id="map"></div>
    );
  }

});

var HistoryItem = React.createClass({
  render: function () {
    return (
      <li>
        <a href="#">{this.props.query}</a>
      </li>
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
      <ul className={this.props.className}>
        {historyItems}
      </ul>
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
      <input value={this.props.query}
             onChange={this.props.onQueryTextChange} />
    );
  }
});

var APISettingsBar = React.createClass({
  render: function () {
    return (
      <div>
        <label htmlFor="googleProjectId">Google Project ID</label>
        <input name="googleProjectId"
               type="text"
               onChange={this.props.onProjectIdChange}
               value={this.props.projectId}
        />
      </div>
    );
  }
});

var App = React.createClass({

  getInitialState: function () {
    return {
      query: this.props.query,
      projectId: this.props.projectId,
      history: [],
      markers: []
    };
  },

  authorize: function (callback) {
    var self = this;
    this.setState({'status': 'Authorizing'});
    gapi.auth.authorize({
      'client_id': '682518744611-ohch249uho63h8csg6qh32s393jsgdvk.apps.googleusercontent.com',
      'scope': 'https://www.googleapis.com/auth/bigquery.readonly'
    }, function() {
      gapi.client.load('bigquery', 'v2', function () {
        self.setState({authorizedProjectId: self.state.projectId});
        callback();
      });
    });
  },

  onSubmitQuery: function (evt) {
    if (evt) {
      evt.preventDefault();
    }
    if (this.isAuthorized()) {
      var request = gapi.client.bigquery.jobs.query({
        'projectId': this.state.projectId,
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
        var data = {};
        for (var j in item.f) {
          var value = item.f[j].v;
          var type = fields[j].type;
          var key = fields[j].name;
          if (type === 'TIMESTAMP') {
            value = Date(value);
          }
          data[key] = value;
        }
        if (!isNaN(xcoord) && !isNaN(ycoord)) {
          var lonlat = reproject([xcoord, ycoord]),
          marker = L.marker([lonlat[1], lonlat[0]]);
          marker.data = data;
          markerDOM = <Marker data={marker.data} />;
          rendered = React.renderComponentToStaticMarkup(markerDOM);
          marker.bindPopup(rendered);
          markers.push(marker);
                       //{data: data});
                       //JSON.stringify(info, undefined, 2))
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
      throw (err);
    }
  },

  onQueryTextChange: function (evt) {
    this.setState({query: evt.target.value});
  },

  onProjectIdChange: function (evt) {
    this.setState({
      projectId: evt.target.value
    });
  },

  setQueryText: function (queryText) {
    this.setState({query: queryText});
  },

  isAuthorized: function () {
    return this.state.authorizedProjectId === this.state.projectId;
  },

  render: function () {
    var lastQuery = this.state.history[this.state.history.length - 1];
    var response = this.state.response;
    if (response && response.result) {
      var expense = ((parseFloat(response.result.totalBytesProcessed) * 5)
                     / (1024 * 1024 * 1024 * 1024)).toFixed(3);
    }
    return (
      <div id="app">
        <nav className="navbar navbar-default" role="navigation">
          <div className="container-fluid">
            <div className="navbar-header">
              <button type="button"
                      className="navbar-toggle"
                      data-toggle="collapse"
                      data-target="#navbar-content" />
              <span className="sr-only">Toggle navigation</span>
              <a className="navbar-brand" href="#">Visual ACRIS</a>
            </div>

            <div className="collapse navbar-collapse" id="navbar-content">
              <ul className="nav navbar-nav">
                <li>
                  <a href="#">
                    <StatusBar expense={expense}
                             status={this.state.status}
                    />
                  </a>
                </li>
                <li className="dropdown">
                  <a href="#" className="dropdown-toggle"
                              data-toggle="dropdown">
                    History<b className="caret"></b>
                  </a>
                  <HistoryBar className="dropdown-menu"
                              history={this.state.history}
                              setQueryText={this.setQueryText}
                  />
                </li>
                <form className="navbar-form navbar-right"
                      onSubmit={this.onSubmitQuery}>
                  <li className="dropdown">
                    <a href="#" className="dropdown-toggle"
                                data-toggle="dropdown">
                      Edit<b className="caret"></b>
                    </a>
                    <ul className="dropdown-menu">
                      <li>
                        <APISettingsBar projectId={this.state.projectId}
                                        onProjectIdChange={this.onProjectIdChange}
                        />
                      </li>
                      <li>
                        <QueryBar query={this.state.query}
                                  onQueryTextChange={this.onQueryTextChange}
                        />
                      </li>
                    </ul>
                  </li>
                  <div className="form-group">
                    <button type="submit"
                            className="btn btn-default"
                            disabled={this.state.query === lastQuery}>
                      {this.isAuthorized() ? "" : "Authorize and " }Query
                    </button>
                  </div>
                </form>
              </ul>
            </div>
          </div>
        </nav>
        <Map markers={this.state.markers} />
      </div>
    )
  }

});

// INSTANTIATION
React.renderComponent(
  <App query={$('#defaultQuery').text().replace(/\s+/g, ' ')}
       projectId = '682518744611'
  />,
  document.getElementById('body')
);

