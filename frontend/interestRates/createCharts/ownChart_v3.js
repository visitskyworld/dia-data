// ------------------------------------------------------------------------------------------------
// General variables and functions
// ------------------------------------------------------------------------------------------------

// // Load meta information on rates before page loads
var dateUrl = 'https://api.diadata.org/v1/interestrates';
$.holdReady(true);
var firstPublications = null;
$.getJSON(dateUrl, function(data) {
    firstPublications = data;
    $.holdReady(false);
});

let today = new Date().toISOString().slice(0, 10);
var yourOwnChart;
var firstPublications = {};

function addDays(date, days) {
    var result = new Date(date).getTime();
    result += days * 864e5
    result = new Date(result);
    return result.toISOString()
}

// getHistoric fetches historic data from our API with address @url
function getData(url, callback) {
    
	// Instantiate request object
	var request = new XMLHttpRequest()
	request.open('GET', url, true)

	// Load data in GET request
	request.onload = function() {
		var data = JSON.parse(this.response)
		if(this.status == 200) {
			if (typeof callback === "function") {
				callback(data)
			}
		} else if(this.status == 404) {
			console.log('Not found error')
		}
	}
	request.onerror = function() {
		console.log('Request error.')
    }
    request.send()
}

function makechart(rate, loading) {
    
	yourOwnChart = Highcharts.stockChart(rate.container, {
		rangeSelector: {
			buttonTheme: {
				   width: 20,
			},
			inputBoxWidth: 75,
	   	}, 
		chart: {
            type: 'spline',
		},
		credits: {
			text: 'DIADATA',
			href: 'https://diadata.org'
		},
        title: {
			text: rate.name,
			style: {
				fontSize: '20px',
			},
        },
        xAxis: {
            tickPixelInterval: 150,
			maxZoom: 20 * 1000,
			title: {
				margin: 10,
			}
		},
        yAxis: {
            minPadding: 0.2,
            maxPadding: 0.2,
            title: {
                text: 'Index value',
                margin: 80
			}	
        },
        series: [
			{
				name: rate.name,
				data: []
            },
		]
    });
    if(loading) {
        yourOwnChart.showLoading();
    }
}

function makechart2(rate1, rate2, loading) {
    
	yourOwnChart = Highcharts.stockChart(rate1.container, {
		rangeSelector: {
			buttonTheme: {
				   width: 20,
			},
			inputBoxWidth: 75,
	   	}, 
		chart: {
            type: 'spline',
		},
		credits: {
			text: 'DIADATA',
			href: 'https://diadata.org'
		},
        title: {
			text: rate1.name,
			style: {
				fontSize: '20px',
			},
        },
        xAxis: {
            tickPixelInterval: 150,
			maxZoom: 20 * 1000,
			title: {
				margin: 10,
			}
		},
        yAxis: {
            minPadding: 0.2,
            maxPadding: 0.2,
            title: {
                text: 'Index value',
                margin: 80
			}	
        },
        legend: {
            enabled: true
        },
        series: [
			{
				name: rate2.name,
                data: [],
                color: '#707070',
                lineWidth: 1
                // dashStyle: 'DashDot',
            },
            {
				name: rate1.name,
                data: [],    
            },
		]
    });
    if(loading) {
        yourOwnChart.showLoading();
    }
}

// ------------------------------------------------------------------------------------------------
// First fill of chart when loading the page
// ------------------------------------------------------------------------------------------------

// Rate info for the first fill
var RateInfo = {
	name: 'SOFR30',
	container: 'yourOwnContainer',
    firstPublication: "2018-04-03",
    url: 'https://api.diadata.org/v1/compoundedAvg/SOFR/30/360?dateInit=2018-05-14&dateFinal=' + today,    
};

// Initial fill
getData(RateInfo.url, function(obj) {
    prefillArray = []
    for(i = 0; i < obj.length; i++) {
        var value = obj[i].Value;
        // prefillArray.push([Date.parse(obj[i].EffectiveDate), +value.toFixed(document.getElementById('rounding').value)]);
        prefillArray.push([Date.parse(obj[i].EffectiveDate), +value.toFixed(4)]);
    }
    prefillArray.sort()
    yourOwnChart.series[0].setData(prefillArray)
    // yourOwnChartSOFR.redraw();               
});
makechart(RateInfo, false);

// ------------------------------------------------------------------------------------------------
// Update upon clicking button
// ------------------------------------------------------------------------------------------------
function updateChart() {

    // Retrieve user data --------------------------------------------------------------------
    var lenPeriod = document.getElementById('lenPeriod').value;
    var dpy = document.getElementById('dpy').value;
    var symbol = document.getElementById('symbol').value;
    var rounding = document.getElementById('rounding').value;
    var dia = document.getElementById('DIA').checked;
    var compare = document.getElementById('compare').checked;

    // update rate information ---------------------------------------------------------------     
    // retrieve first publication date
    const found = Object.values(firstPublications).find(element => element.Symbol == symbol);
    RateInfo.firstPublication = found.FirstDate.slice(0,10);
    // Increase initial date according to observation period
    dateInit = addDays(RateInfo.firstPublication, lenPeriod).slice(0,10);       
    // Check which Index should be displayed 
    if(dia) {
        RateInfo.name = symbol + lenPeriod + '_by_DIA';
        RateInfo.url = 'https://api.diadata.org/v1/compoundedAvgDIA/' + symbol + '/' + lenPeriod + '/' + dpy + '?dateInit=' + dateInit + '&dateFinal=' + today;
    } else {
        RateInfo.name = symbol + lenPeriod;
        RateInfo.url = 'https://api.diadata.org/v1/compoundedAvg/' + symbol + '/' + lenPeriod + '/' + dpy + '?dateInit=' + dateInit + '&dateFinal=' + today;
    }

    if(compare){
    // Plot the original rate along with the custom compounded rate

        var RateInfoOriginal = {
            name: symbol,
            container: 'yourOwnContainer',
            firstPublication: RateInfo.firstPublication,
            url: 'https://api.diadata.org/v1/compoundedAvg/' + symbol + '/1/' + dpy + '?dateInit=' + dateInit + '&dateFinal=' + today,
        };
        
        getData(RateInfoOriginal.url, function(obj) {
            var prefillArray = [];
            for(i = 0; i < obj.length; i++) {
                var value = obj[i].Value;
                prefillArray.push([Date.parse(obj[i].EffectiveDate), +value.toFixed(rounding)]);
                // prefillArray.push([Date.parse(obj[i].EffectiveDate), parseFloat(value.toFixed(rounding))]);
            }
            yourOwnChart.series[0].setData(prefillArray);
            yourOwnChart.hideLoading();
        });

        getData(RateInfo.url, function(obj) {
            var prefillArray = [];
            for(i = 0; i < obj.length; i++) {
                var value = obj[i].Value;
                prefillArray.push([Date.parse(obj[i].EffectiveDate), +value.toFixed(rounding)]);
                // prefillArray.push([Date.parse(obj[i].EffectiveDate), parseFloat(value.toFixed(rounding))]);
            }
            yourOwnChart.series[1].setData(prefillArray);
            yourOwnChart.hideLoading();
        });
        
        makechart2(RateInfo, RateInfoOriginal, true);  

        
    } else {
        
        getData(RateInfo.url, function(obj) {

            var prefillArray = [];
            for(i = 0; i < obj.length; i++) {
                var value = obj[i].Value;
                prefillArray.push([Date.parse(obj[i].EffectiveDate), +value.toFixed(rounding)]);
                // prefillArray.push([Date.parse(obj[i].EffectiveDate), parseFloat(value.toFixed(rounding))]);
            }
            yourOwnChart.series[0].setData(prefillArray);
            yourOwnChart.hideLoading();
        });
        makechart(RateInfo, true);
    }

};