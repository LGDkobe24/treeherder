import angular from 'angular';
import numeral from 'numeral';

import treeherder from './treeherder';

treeherder.filter('stripHtml', function () {
    return function (input) {
        var str = input || '';
        return str.replace(/<\/?[^>]+>/gi, '');
    };
});

treeherder.filter('linkifyURLs', function () {
    return function (input) {
        var str = input || '';
        var urlpattern = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        str = str.replace(urlpattern, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        return str;
    };
});

treeherder.filter('linkifyClassifications', ['ThRepositoryModel', function (ThRepositoryModel) {
    return function (input, projectName) {
        var str = input || '';
        str = str.trim();

        var repo = ThRepositoryModel.getRepo(projectName);

        if (repo.dvcs_type === "hg" && isSHA(str)) {
            var hg_url = "<a href=\'" + repo.url + "/rev/" + str + "\'>" + str + "</a>";
            str = hg_url;
        }

        return str;
    };
}]);

function isSHA(str) {
    var code, i, len;

    // SHAs come in 12 and 40 character varieties
    if (str.length !== 12 && str.length !== 40) {
        return false;
    }

    // SHAs are a-f,0-9
    for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 71) && // upper alpha (A-F)
            !(code > 96 && code < 103)) { // lower alpha (a-f)
            return false;
        }
    }
    return true;
}

treeherder.filter('linkifyBugs', function () {
    return function (input) {
        var str = input || '';

        var bug_matches = str.match(/-- ([0-9]+)|bug.([0-9]+)/ig);
        var pr_matches = str.match(/PR#([0-9]+)/ig);

        // Settings
        var bug_title = 'bugzilla.mozilla.org';
        var bug_url = '<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=$1" ' +
            'data-bugid="$1" title="' + bug_title + '">$1</a>';
        var pr_title = 'github.com';
        var pr_url = '<a href="https://github.com/mozilla-b2g/gaia/pull/$1" ' +
            'data-prid="$1" title="' + pr_title + '">$1</a>';

        if (bug_matches) {
            // Separate passes to preserve prefix
            str = str.replace(/Bug ([0-9]+)/g, "Bug " + bug_url);
            str = str.replace(/bug ([0-9]+)/g, "bug " + bug_url);
            str = str.replace(/-- ([0-9]+)/g, "-- " + bug_url);
        }

        if (pr_matches) {
            // Separate passes to preserve prefix
            str = str.replace(/PR#([0-9]+)/g, "PR#" + pr_url);
            str = str.replace(/pr#([0-9]+)/g, "pr#" + pr_url);
        }

        return str;
    };
});

treeherder.filter('highlightLogLine', function () {
    return function (logLine) {
        var parts = logLine.split(" | ", 3);
        if (parts[0].startsWith("TEST-UNEXPECTED")) {
            parts[0] = "<strong class='failure-line-status'>" + parts[0] + "</strong>";
            parts[1] = "<strong>" + parts[1] + "</strong>";
        }
        return parts.join(" | ");
    };
});

treeherder.filter('highlightCommonTerms', function () {
    return function (input) {
        var compareStr = Array.prototype.slice.call(arguments, 1).filter(
            function (x) { return x; }).join(" ");
        var tokens = compareStr.split(/[^a-zA-Z0-9_-]+/);
        tokens.sort(function (a, b) {
            return b.length - a.length;
        });

        angular.forEach(tokens, function (elem) {
            if (elem.length > 0) {
                input = input.replace(new RegExp("(^|\\W)(" + elem + ")($|\\W)", "gi"), function (match, prefix, token, suffix) {
                    return prefix + "<strong>" + token + "</strong>" + suffix;
                });
            }
        });
        return input;
    };
});

treeherder.filter('escapeHTML', function () {
    return function (text) {
        if (text) {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/'/g, '&#39;')
                .replace(/"/g, '&quot;');
        }
        return '';
    };
});

treeherder.filter('getRevisionUrl', ['thServiceDomain', function (thServiceDomain) {
    return function (revision, projectName) {
        if (revision) {
            return thServiceDomain + '/#/jobs?repo=' + projectName + '&revision=' + revision;
        }
        return '';
    };
}]);

//http://stackoverflow.com/questions/16630471/how-can-i-invoke-encodeuricomponent-from-angularjs-template
treeherder.filter('encodeURIComponent', function () {
    return window.encodeURIComponent;
});

treeherder.filter('displayNumber', ['$filter', function ($filter) {
    return function (input) {
        if (isNaN(input)) {
            return "N/A";
        }

        return $filter('number')(input, 2);
    };
}]);

treeherder.filter('absoluteValue', function () {
    return function (input) {
        return Math.abs(input);
    };
});

treeherder.filter('abbreviatedNumber', function () {
    return input =>
        ((input.toString().length <= 5) ? input : numeral(input).format('0.0a'));
});
