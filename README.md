# Pigeon Chrome Extension

A mailing list solution for organizations - compatible with Gmail only.

## Download Extension:

1. Navigate to chrome://extensions/
2. Click "Load unpacked extension"
3. Select the directory that contains all of the pigeon-chrome code.
4. Enable the extension.


## Using Extension:

1. Navigation to Gmail and sign in using your organization account (i.e. "name@princeton.edu")
2. You should see a "Send Via Pigeon" button - Click on it
3. The compose window should already contain pigeon@domain in the "to" field.
4. Write your email, but also append "##tag1 ##tag2" to the subject line after your normal subject
5. Send your email.
6. If there are errors, you will be alerted. The email will still send to "pigeon@domain", but that's OK (for now).

## Example:

- Type in the subject line: "Interested in computer science? ##compsci"
- Message will send with subject: "Interested in computer science?" to all users in your organization subscribed to ##compsci.
