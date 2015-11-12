/* Main.js */
/* This implements the event listeners and handlers active when a user is on 
/* his or her gmail page. */

var gmail;
// whether the compose window was opened via Pigeon
var pigeonCompose = false;

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
  //console.log("refreshing");
}

// Main function that waits for new compose message button
function main() {
	gmail = new Gmail();
	console.log('Hello,', gmail.get.user_email(), ' Pigeon is ready to use.');
	var html = '<div class="T-I T-I-KE" role="button" id="send-pigeon">'
				+ 'Send Via Pigeon</div>'

	setInterval(function() {
		if (document.getElementById('send-pigeon') == null) {
			gmail.tools.add_toolbar_button(html, onSendPigeonClick, 'Custom Style Class');
		}
	}, 300);
}

refresh(main);

function onSendPigeonClick() {
	pigeonCompose = true;
	gmail.compose.start_compose();
	gmail.observe.on('compose', function(compose, type) {
		setTimeout(function() {
			var currentDomain = gmail.get.user_email().split('@')[1];
			var validEmailDomain = 'pigeon@' + currentDomain;
			if (pigeonCompose) {
				compose.$el.find('textarea[name=to]').val(validEmailDomain);
			} 
			if (type === 'compose') {
				activatePigeonSending();
			} else {
				gmail.observe.off('send_message', 'before');
			}
			pigeonCompose = false;
		}, 10);
	});
}

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
	console.log("I am Pigeon here to help you.");
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

	if (data.to[0] == validEmailDomain) {
		console.log("Redirecting message...");
		if (body_params.bcc) {
			if (typeof body_params.bcc != 'object') body_params.bcc = [ body_params.bcc ];
		} else {
			body_params.bcc = [];
		}
		// Parse the content of the subject to find the tag, denoted by ##tag

		// check whether there's a subject
		var noSubject = true;
		if (subject.length >= 3) {
			if (subject.trim()[0] === '#' && subject.trim()[1] === '#') {
				noSubject = true;
			} else {
				noSubject = false;
			}
		}
		
		var tagNames = subject.replace(/\s+/g, '').split(/##/);
		// assume first is the actual subject, so just look at the other ones
		tagNames.shift();
		console.log("tags are...", tagNames);
		// Get the list of emails subscribed to tag
		if (tagNames.length > 0) {
			var data = { 'tag': tagNames[0], 'domain': currentDomain};
			$.ajax({
				type: 'POST',
				url: 'https://pigeonmail.herokuapp.com/get-all-users-tag-org',
				contentType: 'application/json',
				data: JSON.stringify(data),
				async: false,
				success: function(data) {
					// add these emails to the BCC list
					if (data.length == 0) {
						alert("No users subscribed to that tag! Resend with correct tags.");
					}
					for (i = 0; i < data.length; i++) {
						body_params.bcc.push(data[i].email);
					}
					// deletes 'to' field
					body_params.to.shift();
					// remove tags from the subject line
					body_params.subject = (noSubject ? '' : subject.split(/##/)[0]);
					console.log("sending message, url:", url, 'body', body, 'email_data', data, 'xhr', xhr);
				},
				error: function(status, error) {

				}
			});
		} else {
			// No tags --> UI should indicate that you need to specify at least one tag
			alert("You must specify AT LEAST ONE tag to use Pigeon Mail. Resend with tags.");
		}
	} 
}