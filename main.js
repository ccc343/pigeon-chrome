/* Main.js */
/* This implements the event listeners and handlers active when a user is on 
/* his or her gmail page. */

var gmail;

function refresh(f) {
  if( (/in/.test(document.readyState)) || (undefined === Gmail) ) {
    setTimeout('refresh(' + f + ')', 10);
  } else {
    f();
  }
}

// Returns the query value of name (i.e. ?name=value)
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Check when a compose modal is opened
var currentUrl = document.location.href;
setInterval(function(){
	if (document.location.href != currentUrl) {
		var queryValue = getParameterByName('compose');
		// console.log(queryValue);
		if (queryValue == 'new') {
			// User opened a compose module. Can activate listeners/tagging
			refresh(activatePigeonSending);
		}
		currentUrl = document.location.href;
	}
}, 1000);

// Activate listeners for intercepting right before sending a message
function activatePigeonSending() {
	gmail = new Gmail();
	console.log("Hello, ", gmail.get.user_email(), " I am Pigeon here to help you.");
	// Before a send_message request gets submitted, change the body to redirect
	// the email being sent
	gmail.observe.before('send_message', function(url, body, data, xhr) {
		console.log("Before sending message...");
		redirectMessage(url, body, data, xhr);
	});
}

// Redirect email to appropriate specified recipient email
function redirectMessage(url, body, data, xhr) {
	var body_params = xhr.xhrParams.body_params;
	console.log(body_params);
	// bcc to other people
	if (data.to[0] == 'pigeon@princeton.edu') {
		if (body_params.bcc) {
			if (typeof body_params.bcc != 'object') body_params.bcc = [ body_params.bcc ];
		} else {
			body_params.bcc = [];
		}
		// Get the list of emails subscribed to tag tagID = 1
		var data = { 'tagId' : '1' };
		$.ajax({
			type: 'POST',
			url: 'https://pigeonmail.herokuapp.com/get-all-users-tag',
			contentType: 'application/json',
			data: JSON.stringify(data),
			async: false,
			success: function(data) {
				// add these emails to the BCC list
				for (i = 0; i < data.length; i++) {
					body_params.bcc.push(data[i].email);
				}
				// deletes 'to' field
				body_params.to.shift();
				console.log("sending message, url:", url, 'body', body, 'email_data', data, 'xhr', xhr);
			}
		});
	}
}