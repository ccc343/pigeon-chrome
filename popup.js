/* Script to handle the Pigeon extension popup */

document.addEventListener("DOMContentLoaded", function() { 
	document.getElementById("gmailButton").addEventListener("click", function(){
    	chrome.tabs.create({'url': 'https://mail.google.com/'});
	});
});
