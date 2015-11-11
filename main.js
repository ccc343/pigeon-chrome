/* Main.js */
/* This implements the event listeners and handlers active when a user is on 
/* his or her gmail page. */

var gmail;

function refresh(f) {
  if(/in/.test(document.readyState)) {
  	//console.log('doc not ready');
  	setTimeout(function() { refresh(f) }, 10);
  } else if (typeof jQuery === 'undefined') {
  	//console.log('jQuery not ready');
  	setTimeout(function() { refresh(f) }, 10);
  } else if (undefined === Gmail) {
  	//console.log('gmail not ready');
  	setTimeout(function() { refresh(f) }, 10);
  } else {
    f();
  }
  console.log("refreshing");
}

// Main function that waits for new compose message button
function main() {
	gmail = new Gmail();
	console.log('Hello,', gmail.get.user_email());
	gmail.observe.on('compose', function(compose, type) {
	  	if (type === 'compose') {
	  		console.log('compose modal opened.');
	  		activatePigeonSending();
	  	} else {
	  		gmail.observe.off('send_message','before');
	  	}
 	});
}

refresh(main);

// Returns the query value of name (i.e. ?name=value)
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Activate listeners for intercepting right before sending a message
function activatePigeonSending() {
	gmail.observe.off('send_message','before');
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
	var subject = body_params.subject;
	// Check if this is a valid message command
	var currentDomain = gmail.get.user_email().split('@')[1];
	var validEmailDomain = 'pigeon@' + currentDomain;
	console.log("The valid email domain is...", validEmailDomain);

	if (data.to[0] == validEmailDomain) {
		console.log("Redirecting message...");
		if (body_params.bcc) {
			if (typeof body_params.bcc != 'object') body_params.bcc = [ body_params.bcc ];
		} else {
			body_params.bcc = [];
		}
		// Parse the content of the subject to find the tag, denoted by ##tag
		var tagNames = subject.replace(/\s+/g, '').split(/##/);
		// assume first is the actual subject. keep this.
		subject = tagNames.shift();
		console.log("tags are...", tagNames);
		// Get the list of emails subscribed to tag
		var data = { 'tag': tagNames[0], 'domain': currentDomain};
		$.ajax({
			type: 'POST',
			url: 'https://pigeonmail.herokuapp.com/get-all-users-tag-org',
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
				// adjusts subject field
				body_params.subject = subject;
				console.log("sending message, url:", url, 'body', body, 'email_data', data, 'xhr', xhr);
			}
		});
	}
}