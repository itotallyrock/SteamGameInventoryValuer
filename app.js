var KEY = "6C5EA48E95A3075DE48B76FBAD81B263";

var getUserGames = function(steamid, callback) {
    $.ajax({
        url: "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=" + KEY + "&steamid=" + steamid + "&format=json"
    }).done(callback);
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

var printGames = function(games) {
    games.forEach(function(game, i) {
        $("#gameslist tbody").append("<tr><td>" + game.id + "</td><td>" + game.name + "</td><td>" + getFormatedMoney('$', game.price) + "/td></tr>")
    });
};

var app = angular.module("app",[]);

app.controller("BodyController", ['$scope', function($scope) {
	$scope.world = "Waldo.";
  	$scope.finished = false;
}]);

$("#submit").on("click", function(event) {
    var steamid = $("#steam64id").val().trim();
    console.log("Event");
    if (steamid === undefined || steamid === "") {

    } else {
        getUserGames(steamid, function(data) {
            let games = data.response.games;

            getGamesPrice(data.response.games, function(priceData) {
                //console.log(priceData);
                let total = getTotalValue(priceData);
				for (var game in games) {
					if (games.hasOwnProperty(game)) {
						if (priceData[games[game].appid].success) {
							games[game].price_overview = priceData[games[game].appid].data.price_overview !== undefined ? priceData[games[game].appid].data.price_overview : {initial: 0};
						}
					}
				}
                console.log("Total", total);
				angular.element("[ng-controller=\"BodyController\"]").scope().$apply("total = " + (total/100));
				angular.element("[ng-controller=\"BodyController\"]").scope().$apply("games = " + JSON.stringify(games));
				angular.element("[ng-controller=\"BodyController\"]").scope().$apply("finished = true")
            });
        })
    }
});
