/* Main.js */
/* This implements the event listeners and handlers active when a user is on 
/* his or her gmail page. */

// gmail object
var gmail;
// whether the compose window was opened via Pigeon
var pigeonCompose = false;

// Waits to execute f after the documents and necessary dependencies are loaded
function refresh(f) {
  if(/in/.test(document.readyState) || typeof jQuery === 'undefined' || undefined === Gmail) {
  	setTimeout(function() { refresh(f) }, 10);
  } else {
    f();
  }
}

// Main function that creates a toolbar button 'Send Via Pigeon' to access Pigeon
// functionality.
function main() {
	gmail = new Gmail();
	var html = 'Send Via Pigeon';
	// Makes sure the toolbar button stays persistently on the page
	setInterval(function() {
		if ($("[gh='mtb']").find('.send-pigeon').length == 0) {
			gmail.tools.add_toolbar_button(html, onComposePigeonClick, 'send-pigeon');
		}
		$("[gh='mtb']").find('.send-pigeon').parent().show();
	}, 300);
}

refresh(main);

/* EVENT LISTENERS */
// Initiate listeners for intercepting right before sending a message
function activatePigeonSending() {
	gmail.observe.off('send_message','before');
	console.log("I am Pigeon here to help you.");
	// Before a send_message request gets submitted, change the body to redirect
	// the email being sent
	gmail.observe.before('send_message', function(url, body, data, xhr) {
		onSendRedirect(url, body, data, xhr);
	});

}

/* EVENT HANDLERS */

// Activated when the 'Send Via Pigeon' toolbar button is clicked. Creates a compose window
// that is meant to send an email to pigeon@domain, which is redirected to the appropriate set
// of recipients. Also contains a 'Parse My Email' button that suggests tags to users.
function onComposePigeonClick() {
	pigeonCompose = true;
	gmail.compose.start_compose();
	gmail.observe.on('compose', function(compose, type) {
		// Fill in the compose window with Pigeon data
		setTimeout(function() {
			var currentDomain = gmail.get.user_email().split('@')[1];
			var validEmailDomain = 'pigeon@' + currentDomain;
			if (pigeonCompose) {
				compose.$el.find('textarea[name=to]').val(validEmailDomain);
				compose.subject('PUT SUBJECT HERE FOLLOWED BY ##tag1 ##tag2');

			} 
			if (type === 'compose') {
				activatePigeonSending();
			} else {
				gmail.observe.off('send_message', 'before');
			}
			pigeonCompose = false;
		}, 10);

		// Add a button to this compose window
		var compose_ref = gmail.dom.composes()[0];
		if (!compose_ref.find('.gU.Up  > .J-J5-Ji').find('.parse-pigeon').length && pigeonCompose) {
			// This button allows for automatic content tag suggestion.
			gmail.tools.add_compose_button(compose_ref, 'Suggest Tags', function() {
  				// Get the suggested tags 
  				$.ajax({
					type: 'POST',
					url: 'https://pigeonmail.herokuapp.com/suggest-tags',
					contentType: 'application/json',
					beforeSend: function(xhr, settings) {
						$('.parse-pigeon').click(false);
						$('.parse-pigeon').text('Loading...');
  						var body = compose.body();
  						var textContent = $($.parseHTML(body)).text();
  						settings.data = JSON.stringify({'email': textContent});
					},
					success: function(data) {
						var suggestString = 'TAG SUGGESTIONS: \n';
						// add these emails to the BCC list
						if (data.length == 0 || data == null) {
							suggestString += "None. :(";
						} else {
							for (var i = 0; i < data.length - 1; i++) {
								suggestString += data[i]['tag'] + ', '
							}
							suggestString += data[i]['tag'];
						}
						alert(suggestString);
  						$('.parse-pigeon').text('Suggest Tags');
					},
					error: function(status, error) {
						var suggestString = 'TAG SUGGESTIONS: None :(';
						alert(suggestString);
  						$('.parse-pigeon').text('Suggest Tags');
					}
				});
			}, 'parse-pigeon');
		}
	});
}


// Activated when 'Send' is pressed from the compose window.
// Redirects email to appropriate set of recipients based on tag subscriptions
function onSendRedirect(url, body, data, xhr) {
	var body_params = xhr.xhrParams.body_params;
	console.log(body_params);
	var subject = body_params.subject;
	// Check if this is a valid message command
	var currentDomain = gmail.get.user_email().split('@')[1];
	var validEmailDomain = 'pigeon@' + currentDomain;

	// Check the validity of the 'TO' field
	if (data.to[0] == validEmailDomain) {
		console.log("Redirecting message...");
		if (body_params.bcc) {
			if (typeof body_params.bcc != 'object') body_params.bcc = [ body_params.bcc ];
		} else {
			body_params.bcc = [];
		}

		// check whether there's a subject
		var noSubject = true;
		if (subject.length >= 3) {
			if (subject.trim()[0] === '#' && subject.trim()[1] === '#') {
				noSubject = true;
			} else {
				noSubject = false;
			}
		}

		// Parse the content of the subject to find the tag, denoted by ##tag
		var tagNames = subject.replace(/\s+/g, '').split(/##/);
		// assume first is the actual subject, so just look at the other ones
		tagNames.shift();

		// Get the list of emails subscribed to tag
		if (tagNames.length > 0) {
			var data = { 'tags': tagNames, 'domain': currentDomain };
			$.ajax({
				type: 'POST',
				url: 'https://pigeonmail.herokuapp.com/get-union-users-tag-org',
				contentType: 'application/json',
				data: JSON.stringify(data),
				async: false,
				success: function(data) {
					// add these emails to the BCC list
					if (data.length == 0) {
						alert("No users subscribed to that tag! Resend with tags found at pigeonmail.herokuapp.com");
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