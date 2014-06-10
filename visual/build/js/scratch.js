
/*
var QueryButton = React.createClass({
  getInitialState: function() {
    return { };
  },
  componentWillMount: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });

    function runQuery() {
     var request = gapi.client.bigquery.jobs.query({
        'projectId': project_id,
        'timeoutMs': '30000',
        'query': $('#query').text()
      });

      console.log('requested');
      request.execute(function(response) {
        console.log('responded');
        console.log(response);
        this.setData(response);
        if (response.result && response.result.totalBytesProcessed) {
          $('#query_usage').html();
        }
      });
    },

  },
});
*/

