// interazione sulla pagina
$(function() {
	console.log('login.js loaded successfully');

	$("#loginBtn").on("click", doLogin);
});


function doLogin() {

	// SHA256-HEX delle mail abilitate
	const enabledUsers = [
		"1cfee7b9027af489b5035bc58f9f1422b928bc9081502aa504b6c4717ea94f23"
	];

	var email = document.getElementById("email").value;
	var emailHash = CryptoJS.SHA256(email.toLowerCase()).toString(CryptoJS.enc.Hex);
		
	if (enabledUsers.includes(emailHash)) {
		var password = document.getElementById("password").value;
		var hash = CryptoJS.SHA256(password + email.toLowerCase());
		var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);

		console.log("debug code: " + hashInBase64);

		ajaxApiAuthentication(email, hashInBase64);
	}
	
	else {
		alert("User not enabled");
	}
}


function ajaxApiAuthentication(email, password) {
	console.log("logging to iRacing API services...");

	$.ajax({
		type: "POST",
		url: "backend.php",
		dataType: "json",
		data: {
			"method" : "doAuth",
			"email" : email,
			"password" : password,
		},

		success: function (result) {

			let success = result.success;

			if (success === false) {
				alert("Service unavailable");
			}

			else {
				let response = JSON.parse(result.response);
				
				if (response.authcode == 0) {
					loginFeedbackText = response.message ?? "Login error";
					alert(loginFeedbackText);
				} else {
					window.location = "./drivers.html";
				}
			}
		},

		error: function (error) {
			alert(error);
		}
	});
}