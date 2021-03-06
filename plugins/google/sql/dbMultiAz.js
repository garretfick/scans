var async = require('async');
var helpers = require('../../../helpers/google');

module.exports = {
    title: 'DB Multiple Az',
    category: 'SQL',
    description: 'Ensures that SQL instances have a failover replica to be cross-AZ for high availability.',
    more_info: 'Creating SQL instances in with a single AZ creates a single point of failure for all systems relying on that database. All SQL instances should be created in multiple AZs to ensure proper failover.',
    link: 'https://cloud.google.com/sql/docs/mysql/instance-settings',
    recommended_action: '1. Enter the SQL category of the Google Console. 2. Select the instance. 3. Select the Replicas tab. 4. Select Create Failover Replica and follow the prompts.',
    apis: ['instances:sql:list'],
  

    run: function(cache, settings, callback) {
        var results = [];
        var source = {};
        var regions = helpers.regions();

        async.each(regions.instances.sql, function(region, rcb){
            let sqlInstances = helpers.addSource(
                cache, source, ['instances', 'sql', 'list', region]);

            if (!sqlInstances) return rcb();

            if (sqlInstances.err || !sqlInstances.data) {
                helpers.addResult(results, 3, 'Unable to query SQL Instances: ' + helpers.addError(sqlInstances), region);
                return rcb();
            }

            if (!sqlInstances.data.length) {
                helpers.addResult(results, 0, 'No SQL Instances present', region);
                return rcb();
            }

            sqlInstances.data.forEach(sqlInstance => {
                if (sqlInstance.instanceType != "READ_REPLICA_INSTANCE" &&
                    sqlInstance.failoverReplica &&
                    sqlInstance.failoverReplica.available) {
                    helpers.addResult(results, 0, 
                        'SQL instance has multi-AZ enabled', region, sqlInstance.name);
                } else if (sqlInstance.instanceType == "READ_REPLICA_INSTANCE"){
                } else {
                    helpers.addResult(results, 2, 
                        'SQL instance does not have multi-AZ enabled', region, sqlInstance.name);
                }
            })

            rcb();
        }, function(){
            // Global checking goes here
            callback(null, results, source);
        });
    }
}