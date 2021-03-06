import treeherder from '../../treeherder';

treeherder.factory('PhSeries', ['$http', 'thServiceDomain', 'ThOptionCollectionModel', '$q', function ($http, thServiceDomain, ThOptionCollectionModel, $q) {

    var _getTestName = function (signatureProps) {
        // only return suite name if testname is identical, and handle
        // undefined test name
        return _.uniq(_.filter([signatureProps.suite, signatureProps.test])).join(" ");
    };

    var _getSeriesOptions = function (signatureProps, optionCollectionMap) {
        var options = [optionCollectionMap[signatureProps.option_collection_hash]];
        if (signatureProps.extra_options) {
            options = options.concat(signatureProps.extra_options);
        }
        return _.uniq(options);
    };

    var _getSeriesName = function (signatureProps, optionCollectionMap,
                                  displayOptions) {
        var platform = signatureProps.machine_platform;
        var name = _getTestName(signatureProps);

        if (displayOptions && displayOptions.includePlatformInName) {
            name = name + " " + platform;
        }
        var options = _getSeriesOptions(signatureProps, optionCollectionMap);
        return name + " " + options.join(" ");
    };

    var _getSeriesSummary = function (projectName, signature, signatureProps,
                                     optionCollectionMap) {
        var platform = signatureProps.machine_platform;
        var options = _getSeriesOptions(signatureProps, optionCollectionMap);

        return {
            id: signatureProps.id,
            name: _getSeriesName(signatureProps, optionCollectionMap),
            testName: _getTestName(signatureProps), // unadorned with platform/option info
            suite: signatureProps.suite,
            test: signatureProps.test || null,
            signature: signature,
            hasSubtests: signatureProps.has_subtests || false,
            parentSignature: signatureProps.parent_signature || null,
            projectName: projectName,
            platform: platform,
            options: options,
            frameworkId: signatureProps.framework_id,
            lowerIsBetter: (signatureProps.lower_is_better === undefined ||
                            signatureProps.lower_is_better)
        };
    };

    return {
        getTestName: _getTestName,
        getSeriesName: _getSeriesName,
        getSeriesList: function (projectName, params) {
            return ThOptionCollectionModel.getMap().then(function (optionCollectionMap) {
                return $http.get(thServiceDomain + '/api/project/' + projectName +
                                 '/performance/signatures/', { params: params }).then(function (response) {
                                     return _.map(response.data, function (signatureProps, signature) {
                                         return _getSeriesSummary(projectName, signature,
                                                                  signatureProps,
                                                                  optionCollectionMap);
                                     });
                                 });
            });
        },
        getPlatformList: function (projectName, params) {
            return $http.get(thServiceDomain + '/api/project/' + projectName +
                             '/performance/platforms/', { params: params }).then(
                                 function (response) {
                                     return response.data;
                                 });
        },
        getSeriesData: function (projectName, params) {
            return $http.get(thServiceDomain + '/api/project/' + projectName + '/performance/data/',
                             { params: params }).then(function (response) {
                                 if (response.data) {
                                     return response.data;
                                 }
                                 return $q.reject("No series data found");
                             });
        },
        getReplicateData: function (params) {
            params.value = 'perfherder-data.json';
            return $http.get(thServiceDomain + '/api/jobdetail/'
                , { params: params }).then(
                    function (response) {
                        if (response.data.results[0]) {
                            let url = response.data.results[0].url;
                            return $http.get(url).then(function (response) {
                                return response.data;
                            });
                        }
                        return $q.reject("No replicate data found");
                    });
        }
    };
}]);
