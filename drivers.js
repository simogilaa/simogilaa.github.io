let showChart = false;

// interazione sulla pagina
$(function() {
	console.log('drivers.js loaded successfully');

	// al caricamento della pagina leggi il file csv dei piloti e crea la griglia
	$.get('drivers_list.csv', function(fileContent) {

		var driversArray = buildDriversArrayFromCsvFile(fileContent);
		renderDriverCards(driversArray);

		// listener al click di una driver card
		$(".driver").on("click", getStatsAndChart);

	}, 'text');
	
	// listener al click del bottone di aggiornamento statistiche piloti
	$("#updateDriverStats").on("click", function(){
		$(".driver").each(getStats);
	});

	var $loading = $('#loadingSpinner').hide();
	$(document)
		.ajaxStart(function () {
			$loading.show();
		})
		.ajaxStop(function () {
			$loading.hide();
		});
	
});


function buildDriversArrayFromCsvFile(fileContent) {

	var driversArray = [];
	var fileRows = fileContent.split("\r\n");
	$(fileRows).each( function() {
		var driverData = this.split(",");
		driversArray.push({"id":driverData[0], "name":driverData[1]});
	});
	return driversArray;
}


function renderDriverCards(drivers) {

	$(drivers).each(function() {

		const id = this.id;
		const name = this.name;

		const cardHtml = 
			`<div class="col">
                <div id="${id}" class="card border-warning h-100 driver">
                    <img src="images/avatars/${id}.png" class="card-img-top" onerror="this.onerror=null; this.src='images/avatars/missing_driver_icon.png'" alt="Driver Avatar">
                    <div class="card-body">
                        <h5 class="card-title">${name}</h5>
                        <div>
                            <div>ID: ${id}</div>
                            <div><span>Max iRating: </span><span id="${id}_MaxRating"></span></div>
                            <div><span>Current iRating: </span><span id="${id}_CurrentRating"></span></div>
							<div><span>Start iRating: </span><span id="${id}_StartRating"></span></div>
                            <div><span>Gain/Loss: </span><span id="${id}_DeltaRating"></span></div>
                        </div>
                    </div>
                </div>
            </div>`;

		$('#driverCardsContainerGrid').append(cardHtml);

	});
}


function getStats() {

	showChart = false;
	var driverCustomerId = this.id;
	if(driverCustomerId > 0) {
		ajaxGetIratingData(driverCustomerId);
	}
}


function getStatsAndChart() {

	var selection = window.getSelection();
    if(selection.type != "Range") {
		showChart = true;
		var driverCustomerId = this.id;
		if(driverCustomerId > 0) {
			ajaxGetIratingData(driverCustomerId);
		}
		else {
			alert("Missing driver ID");
		}
	}
}


function ajaxGetIratingData(custId) {
	console.log("retrieving iRating data for... " + custId);

	$.ajax({
		type: "POST",
		url: "backend.php",
		dataType: "json",
		data: {
			"method" : "getIratingData",
			"cust_id" : custId,
			"category_id" : "2",
			"chart_type" : "1",
		},

		success: function (result) {
			let success = result.success;

			if (success === false) {
				alert("Wrong method called");
			}

			else {
				let response = JSON.parse(result.response);
				let dataLink = response.link ?? null;
				getDataFromLink(dataLink, custId);
			}
		},

		error: function (error) {
			console.log(error);
		}
	});
}


function getDataFromLink(url, custId) {
	console.log("reading data from remote file...");

	$.ajax({
		type: "POST",
		url: "backend.php",
		dataType: "json",
		data: {
			"method" : "getDataFromLink",
			"url" : url,
		},

		success: function (result) {
			let success = result.success;

			if (success === false) {
				window.location = "./index.html";
			}

			else {
				let response = JSON.parse(result.response);
				let data = response.data ?? null;
				showData(data, custId);
			}
		},

		error: function (error) {
			console.log(error);
		}
	});
}


function showData(jsonData, custId) {

	// se i campi del range non sono compilati assegno date per includere sempre tutto il range
	let iratingDataFrom = new Date( $('#iratingDataFrom').val() );
	if (iratingDataFrom == "Invalid Date")
		iratingDataFrom = new Date('1970-01-01');
		
	let iratingDataTo = new Date( $('#iratingDataTo').val() );
	if (iratingDataTo == "Invalid Date")
		iratingDataTo = new Date('2100-01-01');

	let chartDates = [];
	let chartRatings = [];
	let dateFormattingOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };

	// preparo due array per il grafico, uno per le ascisse (dates) e uno per le ordinate (ratings)
	$(jsonData).each(function() {
		const date = new Date(this.when);
		let rating = this.value;

		if (date >= iratingDataFrom && date <= iratingDataTo) {
			let dateFormatted = date.toLocaleDateString("it-IT", dateFormattingOptions);
			chartDates.push(dateFormatted);
			chartRatings.push(rating);
		}
	});

	// calcolo max dall'array dei rating nel periodo filtrato
	let maxRating = Math.max(...chartRatings);
	let currentRating = chartRatings[chartRatings.length - 1];
	let startRating = chartRatings[0];

	let deltaRating = currentRating - startRating;

	if (!Number.isFinite(maxRating)) maxRating = "No data";
	if (!Number.isFinite(currentRating)) currentRating = "No data";
	if (!Number.isFinite(startRating)) startRating = "No data";
	if (!Number.isFinite(deltaRating)) deltaRating = "No data";

	$("#" + custId + "_MaxRating").text(maxRating);
	$("#" + custId + "_CurrentRating").text(currentRating);
	$("#" + custId + "_StartRating").text(startRating);
	$("#" + custId + "_DeltaRating").text(deltaRating);


	if (showChart === true) {

		const driver = $('#' + custId).find(".card-title").text();

		const ctx = document.getElementById('myChart');
		const config = {
			type: 'line',
			data: {
				labels: chartDates,
				datasets: [{
					label: 'iRating: ' + driver,
					data: chartRatings,
					fill: false,
					borderColor: 'rgb(75, 192, 192)',
					tension: 0.1
				}]
			},
			options: {
				maintainAspectRatio: false,
			}
		}

		let chartStatus = Chart.getChart('myChart');
		if (chartStatus !== undefined) {
			chartStatus.destroy();
		}

		const myChart = new Chart(ctx, config);
	}
}