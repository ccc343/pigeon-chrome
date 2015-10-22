var gmail = new Gmail();

var currentUrl = document.location.href;
setInterval(function(){
	if (document.location.href != currentUrl) {
		var queryValue = getParameterByName('compose');
		// console.log(queryValue);
		if (queryValue == 'new') {
			// User opened a compose module. Can activate listeners/tagging
			activatePigeonSending();
		}
		currentUrl = document.location.href;
	}
}, 1000);

// Returns the query value of name (i.e. ?name=value)
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Activate listeners for intercepting right before sending a message
function activatePigeonSending() {
	console.log("Hello, ", gmail.get.user_email(), " I am Pigeon here to help you.");

	// Before a send_message request gets submitted, change the body to redirect
	// the email being sent
	gmail.observe.before('send_message', function(url, body, data, xhr) {
		redirectMessage(url, body, data, xhr);
	});
}

// Redirect email to appropriate specified recipient email
function redirectMessage(url, body, data, xhr) {
	var body_params = xhr.xhrParams.body_params;
	console.log(data);
	// bcc to other people
	if (data.to[0] == 'pigeon@princeton.edu') {
		if (body_params.bcc) {
			if (typeof body_params.bcc != 'object') body_params.bcc = [ body_params.bcc ];
		} else {
			body_params.bcc = [];
		}
		body_params.bcc.push('cissyc@princeton.edu');
	}
	console.log("sending message, url:", url, 'body', body, 'email_data', data, 'xhr', xhr);
}