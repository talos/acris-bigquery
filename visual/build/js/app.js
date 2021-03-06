/**
* @jsx React.DOM
*/

/*jshint browser: true, unused: false*/
/*global React:false, L:false, gapi:false, proj4, $*/

// HELPERS
var reproject = proj4($('meta[name=pluto-proj4]').attr('content')).inverse;

// REACT CLASSES
var DocumentQuery = React.createClass({
  toSQL: function () {
    /* jshint ignore:start */
    return $(React.renderComponentToStaticMarkup(
      <span>
        SELECT
          pl_XCoord AS x,
          pl_YCoord AS y,
          FIRST(doc_amount) AS doc_amount,
          GROUP_CONCAT(party_type_string + ':' + name, "|") AS name_concat,
          FORMAT_UTC_USEC(FIRST(doc_date)) AS time,
          FIRST(pl_UnitsRes) AS res_units
        FROM [acris-bigquery:acris.real_flat]
        WHERE
          doc_type = "{this.props.input.docType}" AND
          recorded_filed BETWEEN {new Date(this.props.input.startDate).getTime()}000 AND <br />
            {new Date(this.props.input.endDate).getTime()}000
        GROUP BY
          x, y, document_id
        HAVING
          name_concat CONTAINS "{this.props.input.searchName}"
      </span>
    )).text();
    /* jshint ignore:end */
  },

  onInputChange: function (evt) {
    this.props.onInputChange({
      "startDate": this.refs.startDate.getDOMNode().value,
      "endDate": this.refs.endDate.getDOMNode().value,
      "searchName": this.refs.searchName.getDOMNode().value,
      "docType": this.refs.docType.getDOMNode().value
    });
  },

  render: function () {
    /* jshint ignore:start */
    return (
      <div>
        <label htmlFor="startDate">Start:</label>
        <input name="startDate"
               ref="startDate"
               type="date"
               value={this.props.input.startDate}
               onChange={this.onInputChange} />
        <label htmlFor="endDate">End:</label>
        <input name="endDate"
               ref="endDate"
               type="date"
               value={this.props.input.endDate}
               onChange={this.onInputChange} />
        <label htmlFor="searchName">Name:</label>
        <input name="searchName"
               ref="searchName"
               value={this.props.input.searchName}
               onChange={this.onInputChange} />
       <label htmlFor="docType">Doc:</label>
       <input name="docType"
              ref="docType"
              value={this.props.input.docType}
              onChange={this.onInputChange} />
     </div>
    );
    /* jshint ignore:end */
  }
});

var DeepOwnershipQuery = React.createClass({
  toSQL: function () {
    /* jshint ignore:start */
    return $(React.renderComponentToStaticMarkup(
      <span>
        SELECT pl_XCoord AS x, pl_YCoord AS y,
               borough AS borough,
               block AS block,
               lot AS lot,
               street_name AS street_name,
               street_number AS street_number,
               FORMAT_UTC_USEC(rf.recorded_filed) AS recorded_filed,
               rf.address_1 AS address_1,
               rf.address_2 AS address_2,
               rf.name name,
               doc_amount as amount
        FROM acris.real_flat rf CROSS JOIN
        (SELECT address_1, address_2, name, recorded_filed
        FROM acris.real_flat rf JOIN
        (SELECT borough, block, lot from acris.real_legals
        WHERE (street_name LIKE '{this.props.input.streetName}')
          AND street_number = '{this.props.input.streetNumber}'
          AND borough = {this.props.input.boroughNumber}
        GROUP BY borough, block, lot) bbl
        ON rf.borough=bbl.borough AND rf.block=bbl.block AND rf.lot= bbl.lot
        WHERE doc_type IN ('DEED', 'DEEDO')
          AND party_type = 2
        ORDER BY recorded_filed DESC
        LIMIT 1) addr
        WHERE (addr.address_1 = rf.address_1
           OR addr.address_2 = rf.address_2
           OR addr.name = rf.name)
          AND doc_type IN ('DEED', 'DEEDO')
          AND party_type = 2
      </span>
    )).text();
    /* jshint ignore:end */
  },

  onInputChange: function (evt) {
    this.props.onInputChange({
      //"startDate": this.refs.startDate.getDOMNode().value,
      //"endDate": this.refs.endDate.getDOMNode().value,
      //"searchName": this.refs.searchName.getDOMNode().value
      "streetNumber": this.refs.streetNumber.getDOMNode().value,
      "streetName": this.refs.streetName.getDOMNode().value,
      "boroughNumber": this.refs.boroughNumber.getDOMNode().value
    });
  },

  render: function () {
    /* jshint ignore:start */
    return (
      <div>
        <label htmlFor="streetNumber">Number:</label>
        <input name="streetNumber"
               ref="streetNumber"
               value={this.props.input.streetNumber}
               onChange={this.onInputChange} />
        <label htmlFor="streetName">Street Name:</label>
        <input name="streetName"
               ref="streetName"
               value={this.props.input.streetName}
               onChange={this.onInputChange} />
        <label htmlFor="boroughNumber">Borough Num</label>
        <input name="boroughNumber"
               ref="boroughNumber"
               value={this.props.input.boroughNumber}
               onChange={this.onInputChange} />
     </div>
    );
    /* jshint ignore:end */
  }

});

var QueryBar = React.createClass({

  propTypes: {
    query: React.PropTypes.component.isRequired
  },

  render: function () {
    /* jshint ignore: start */
    { this.props.query }
    /* jshint ignore: end */
  }
});

var Marker = React.createClass({

  render: function () {
    var data = this.props.data,
        markerRows = [];

    /* jshint ignore:start */
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
    /* jshint ignore:end */
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
    /* jshint ignore:start */
    for (i in this.props.markers) {
      var marker = this.props.markers[i];
      marker.addTo(self.map);
    };
    return (
      <div id="map"></div>
    );
    /* jshint ignore:end */
  }

});

var HistoryItem = React.createClass({
  render: function () {
    /* jshint ignore:start */
    return (
      <li>
        <a href="#">{this.props.query}</a>
      </li>
    )
    /* jshint ignore:end */
  }
});

var HistoryBar = React.createClass({

  setQueryText: function (evt) {
    this.props.setQueryText(evt.target.value);
  },

  render: function () {
    var historyItems = [];
    /* jshint ignore:start */
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
    /* jshint ignore:end */
  }
});

var StatusBar = React.createClass({
  render: function () {
    /* jshint ignore:start */
    return (
      <div className="pull-right">
        Status: {this.props.status === 'Done' ?
            'Processed $' + this.props.expense : this.props.status}
      </div>
    );
    /* jshint ignore:end */
  }
});

var APISettingsBar = React.createClass({
  render: function () {
    /* jshint ignore:start */
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
    /* jshint ignore:end */
  }
});

var App = React.createClass({

  getInitialState: function () {
    return {
      projectId: this.props.projectId,
      history: [],
      markers: [],
      input: {
/*
        startDate: '2013-01-01',
        endDate: '2013-02-01',
        docType: 'MTGE',
        searchName: 'CITIBANK'
*/
      }
    };
  },

  authorize: function (callback) {
    var self = this;
    this.setState({'status': 'Authorizing'});
    gapi.auth.authorize({
      'client_id': '682518744611-ohch249uho63h8csg6qh32s393jsgdvk.' +
                   'apps.googleusercontent.com',
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
        'query': this.refs.query.toSQL()
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
        var item = response.result.rows[i],
            xcoord = parseFloat(item.f[0].v),
            ycoord = parseFloat(item.f[1].v),
            data = {};
        for (var j in item.f) {
          var value = item.f[j].v,
              type = fields[j].type,
              key = fields[j].name;
          if (type === 'TIMESTAMP') {
            value = Date(value);
          }
          data[key] = value;
        }
        if (!isNaN(xcoord) && !isNaN(ycoord)) {
          var lonlat = reproject([xcoord, ycoord]),
              marker = L.marker([lonlat[1], lonlat[0]]);
          marker.data = data;
          /*jshint ignore:start */
          marker.bindPopup(
            React.renderComponentToStaticMarkup(
              <Marker data={marker.data} />
            ));
          /*jshint ignore:end */
          markers.push(marker);
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
      console.log(response);
      throw (err);
    }
  },

  onInputChange: function (newInput) {
    this.setState({input: newInput});
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

  //getQuery: function () {
  //  return DocumentQuery;
  //},

  render: function () {
    var lastQuery = this.state.history[this.state.history.length - 1];
    var response = this.state.response;
    if (response && response.result) {
      var bytesProcessed = response.result.totalBytesProcessed;
      var expense = (parseFloat(bytesProcessed) * 5 / Math.pow(1024, 4))
        .toFixed(3);
    }
    /*jshint ignore:start */
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

            <form onSubmit={this.onSubmitQuery}>
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
                    History {this.state.history.length ? '(' + this.state.history.length + ')' : ''}
                    <b className="caret"></b>
                  </a>
                  <HistoryBar className="dropdown-menu"
                              history={this.state.history}
                              setQueryText={this.setQueryText}
                  />
                </li>
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
                  </ul>
                </li>
                <li className="navbar-form">
                  <DeepOwnershipQuery ref='query'
                                      input={this.state.input}
                                      onInputChange={this.onInputChange}
                  />
                  <button type="submit"
                          className="btn btn-default"
                          //disabled={this.state.query === lastQuery}
                          >
                    {this.isAuthorized() ? "" : "Authorize and " }Query
                  </button>
                </li>
              </ul>
            </div>
            </form>
          </div>
        </nav>
        <Map markers={this.state.markers} />
      </div>
    )
    /*jshint ignore:end */
  }

});

// INSTANTIATION
//var defaultStart = ,
//    defaultEnd = ;
React.renderComponent(
  /*jshint ignore:start */
  //<App query={$('#defaultQuery').text().replace(/\s+/g, ' ')}
  <App projectId = '682518744611' />,
  /*jshint ignore:end */
  document.getElementById('body')
);

