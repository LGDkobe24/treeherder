import { getProjectUrl } from "../../helpers/urlHelper";

treeherder.factory('ThRunnableJobModel', [
    'thUrl', 'ThJobModel',
    function (thUrl, ThJobModel) {
        var ThRunnableJobModel = function (data) {
            angular.extend(this, data);
        };

        ThRunnableJobModel.get_runnable_uri = function () {
            return getProjectUrl("/runnable_jobs/");
        };

        ThRunnableJobModel.get_list = function (repoName, params) {
            return ThJobModel.get_list(
                repoName, params, { uri: ThRunnableJobModel.get_runnable_uri() });
        };

        return ThRunnableJobModel;
    }]);
