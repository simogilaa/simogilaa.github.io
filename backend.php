<?php
session_start();

$method = $_POST['method'] ?? null;

switch ($method) {
    case "doAuth":
        $response = doAuth();
        break;

    case "getIratingData":
        $response = getIratingData();
        break;

    case "getDataFromLink":
        $response = getDataFromLink();
        break;

    default:
        $response = json_encode(array("success" => false));
        break;
}

echo $response;
exit;


function doAuth() {

    $authUrl = "https://members-ng.iracing.com/auth";
    $email = $_POST['email'] ?? null;
    $password = $_POST['password']  ?? null;

    // email o password non compilate
    if (!($email && $password)) {
	    $response = array("success" => false);
	    return json_encode($response);
    }

    $cookieJarFile = preg_replace( '/[^a-z0-9]+/', '', strtolower($password));
    $_SESSION['cookie_jar'] = $cookieJarFile;

    $authParams = json_encode(["email" => $email, "password" => $password]);

    // create curl resource
    $iracing = curl_init();

    // set url
    curl_setopt($iracing, CURLOPT_URL, $authUrl);

    // save response cookies
    curl_setopt($iracing, CURLOPT_COOKIEJAR, __DIR__."/cookies/$cookieJarFile.txt");

    // prepare post parameters
    curl_setopt($iracing, CURLOPT_POST, true);
    curl_setopt($iracing, CURLOPT_POSTFIELDS, $authParams);

    // http headers
    curl_setopt($iracing, CURLOPT_HTTPHEADER, array("Content-Type:application/json"));

    // return the transfer as a string
    curl_setopt($iracing, CURLOPT_RETURNTRANSFER, true);

    // $output contains the output string
    $output = curl_exec($iracing);

    // close curl resource to free up system resources
    curl_close($iracing);      

    $response = array("success" => true, "response" => $output);
    return json_encode($response);
}


function getIratingData() {

    $endpoint = "https://members-ng.iracing.com/data/member/chart_data?";
    $custId = $_POST['cust_id'] ?? null;
    $categoryId = $_POST['category_id']  ?? "2";
    $chartType = $_POST['chart_type']  ?? "1";

    // customerId non compilato
    if (!$custId) {
	    $response = array("success" => false);
	    return json_encode($response);
    }

    $params = http_build_query(["cust_id" => $custId, "category_id" => $categoryId, "chart_type" => $chartType]);
    $url = $endpoint.$params;

    // create curl resource
    $iracing = curl_init();

    // set url
    curl_setopt($iracing, CURLOPT_URL, $url);
    
    // send stored cookies file
    $cookieJarFile = $_SESSION['cookie_jar'];
    curl_setopt($iracing, CURLOPT_COOKIEFILE, __DIR__."/cookies/$cookieJarFile.txt");

    // return the transfer as a string
    curl_setopt($iracing, CURLOPT_RETURNTRANSFER, true);

    // $output contains the output string
    $output = curl_exec($iracing);

    // close curl resource to free up system resources
    curl_close($iracing);

    $response = array("success" => true, "response" => $output);
    return json_encode($response);
}


function getDataFromLink() {

    $url = $_POST['url'] ?? null;

    // url non compilato
    if (!$url) {
	    $response = array("success" => false);
	    return json_encode($response);
    }

    // create curl resource
    $iracing = curl_init();

    // set url
    curl_setopt($iracing, CURLOPT_URL, $url);
    
    // send stored cookies file
    $cookieJarFile = $_SESSION['cookie_jar'];
    curl_setopt($iracing, CURLOPT_COOKIEFILE, __DIR__."/cookies/$cookieJarFile.txt");

    // return the transfer as a string
    curl_setopt($iracing, CURLOPT_RETURNTRANSFER, true);

    // $output contains the output string
    $output = curl_exec($iracing);

    // close curl resource to free up system resources
    curl_close($iracing);

    $response = array("success" => true, "response" => $output);
    return json_encode($response);
}


?>