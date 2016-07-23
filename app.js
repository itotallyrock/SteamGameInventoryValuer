var KEY = "6C5EA48E95A3075DE48B76FBAD81B263";

var getUserGames = function(steamid, callback) {
    $.ajax({
        url: "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=" + KEY + "&steamid=" + steamid + "&include_appinfo=1&format=json"
    }).done(callback).error(function () {
		angular.element("[ng-controller=\"BodyController\"]").scope().$apply("failed = true");
		angular.element("[ng-controller=\"BodyController\"]").scope().$apply("finished = false");
		angular.element("[ng-controller=\"BodyController\"]").scope().$apply("started = false");
	});
}

var getCSV = function(array) {
    var r = ""
    array.forEach(function(item, i) {
        r += item.appid;
        if (array[i] !== array[array.length - 1]) {
            r += ",";
        }
    });
    return r;
};

var getTotalValue = function(games) {
    let total = 0;
    for (let game in games) {
        console.log(games[game]);
        if (games[game].success) {
            if (games[game].data.price_overview !== undefined) {
                total += games[game].data.price_overview.initial;
            }
        }
    }
    return total;
};

var getGamesPrice = function(games, callback) {
    var id = getCSV(games);
    $.ajax({
        url: "http://store.steampowered.com/api/appdetails/?appids=" + id + "&filters=price_overview",
    }).done(callback);
};

var getFormatedMoney = function(unit, price) {
    let dec = (price / 100 - Math.floor(price / 100)).toPrecision(2) * 100;
    return unit + Math.floor(price / 100) + "." + dec;
}

var app = angular.module("app", ['ngAnimate']);

app.controller("BodyController", ['$scope', function($scope) {
    $scope.finished = false;
    $scope.formatNumber = function(number) {
        let d = (number - Math.floor(number)).toPrecision(1);
        return Math.floor(number) + d*10;
    };
}]);


$(".loading").on('click', function (event) {
	angular.element("[ng-controller=\"BodyController\"]").scope().$apply("started = false");
	angular.element("[ng-controller=\"BodyController\"]").scope().$apply("failed = true");
});
$("#steamid").on('keypress', function(event) {
    if (event.which == 13) {
        $("#submit").trigger('click');
    }
});
$("#submit").on("click", function(event) {
	console.log("Event");
	angular.element("[ng-controller=\"BodyController\"]").scope().$apply("started = true");
	angular.element("[ng-controller=\"BodyController\"]").scope().$apply("failed = false");
    let steamid = $("[name=\"steam64id\"]").text().trim();
    if (steamid.search(/(http(s|):\/\/|)steamcommunity\.com\/id\//g) == 0 || (isNaN(parseInt(steamid)))) {
        let vanity = "";
        if (steamid.startsWith("http")) {
            vanity = encodeURI(steamid.replace(/(http(s|):\/\/|)steamcommunity\.com\/id\//g, "").trim());
        } else {
            vanity = encodeURI(steamid.trim());
        }
        $.ajax("http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?vanityurl=" + vanity + "&key=6C5EA48E95A3075DE48B76FBAD81B263").done(function(data) {
            if (data.response.success === 1) {
                $("[name=\"steam64id\"]").text(data.response.steamid);
                $("#submit").trigger("click");
            } else {
				angular.element("[ng-controller=\"BodyController\"]").scope().$apply("failed = true");
				angular.element("[ng-controller=\"BodyController\"]").scope().$apply("finished = false");
	        	angular.element("[ng-controller=\"BodyController\"]").scope().$apply("started = false");
			}
        }).error(function () {
			angular.element("[ng-controller=\"BodyController\"]").scope().$apply("failed = true");
			angular.element("[ng-controller=\"BodyController\"]").scope().$apply("finished = false");
        	angular.element("[ng-controller=\"BodyController\"]").scope().$apply("started = false");
        });
    } else if (steamid !== undefined || steamid !== "") {
        getUserGames(steamid, function(data) {
            let games = data.response.games;

            getGamesPrice(data.response.games, function(priceData) {
                //console.log(priceData);
                let total = getTotalValue(priceData);
                for (var game in games) {
                    if (games.hasOwnProperty(game)) {
                        if (priceData[games[game].appid].success == true && (priceData[games[game].appid].data !== undefined && priceData[games[game].appid].data.price_overview !== undefined)) {
                            games[game].price_overview = priceData[games[game].appid].data.price_overview;
                        } else {
                            games[game].price_overview = {
                                initial: 0
                            }
                        }
                    }
                }
                console.log("Total", (total / 100));
				console.log("Average", ((total / priceData.length) / 100));
                angular.element("[ng-controller=\"BodyController\"]").scope().$apply("total = " + (total / 100));
                angular.element("[ng-controller=\"BodyController\"]").scope().$apply("average = " + ((total / data.response.games.length) / 100));
                angular.element("[ng-controller=\"BodyController\"]").scope().$apply("games = " + JSON.stringify(games));
                angular.element("[ng-controller=\"BodyController\"]").scope().$apply("finished = true");
                //$("#tableplaytimeheader").attr("data-valueprovider", "((\d|,|\.){1,}\s(Hours|Minutes))|\w")
                $("#tablepriceheader").click();
                $("#tablepriceheader").click();
            });
        });
    }
});
