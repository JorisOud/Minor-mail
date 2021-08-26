document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Send mail
  document.querySelector('#compose-form').onsubmit = send_mail;
});

function compose_email(email = undefined) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields if not a reply
  if (!email){
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
  // Pre-fill composition fields if reply
  else {
    document.querySelector('#compose-recipients').value = `${email.sender}`;

    // add Re to subject if not already present
    let subject = "";

    if (email.subject.includes('Re:')) {
      subject = email.subject;
    } else {
      subject = `Re: ${email.subject}`;
    }

    document.querySelector('#compose-subject').value = `${subject}`;
    document.querySelector('#compose-body').value =
    `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
  }

}

function load_email(email_id, mailbox){

    // Show email view and hide other views
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);

    // clear email view
    document.querySelector('#email-view').innerHTML = ""

    // create container div
    const mail_container = document.createElement('div');
    mail_container.setAttribute('id', 'mail_container');
    document.querySelector('#email-view').append(mail_container);

    // add archive button
    if (mailbox != 'sent'){

      const arch_button = document.createElement('button');
      let archived = false;

      if (email.archived === false){
        arch_button.innerHTML = "Archive";
        archived = true;
      } else {
        arch_button.innerHTML = "Unarchive";
      };

      // add eventlistener and make PUT request to change archived/unarchived
      arch_button.onclick = function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: archived
          })
        }).then(() => {
          // view inbox window
          load_mailbox('inbox');
        })
      }

      mail_container.append(arch_button);

      // add reply button
      const reply_button = document.createElement('button');
      reply_button.innerHTML = "Reply";

      reply_button.onclick = function() {
        compose_email(email);
      }


      mail_container.append(reply_button);
    };


    // add sender
    const sender = document.createElement('div');
    sender.innerHTML = `From: ${email.sender}`;
    mail_container.append(sender);

    // add recipients
    const recipients = document.createElement('div');
    let recipients_string = 'To:';

    email.recipients.forEach(recipient => {
      recipients_string = recipients_string.concat(` ${recipient}`);
    });

    recipients.innerHTML = recipients_string;
    mail_container.append(recipients);

    // add subject
    const subject = document.createElement('div');
    subject.innerHTML = `Subject: ${email.subject}`;
    mail_container.append(subject);

    // add timestamp
    const timestamp = document.createElement('div');
    timestamp.innerHTML = email.timestamp;
    mail_container.append(timestamp);

    // add body
    const body = document.createElement('div');
    body.innerHTML = email.body;
    mail_container.append(body);
  })
  .catch(error => {
    console.log('error', error)
  });

  // set to read
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // create list
  const email_list = document.createElement('ul');
  email_list.className = 'list-group'
  email_list.setAttribute('id', 'email-list')
  document.querySelector('#emails-view').append(email_list)

  // get mails from API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(result => {
    console.log(result);
    result.forEach(email => {
      // create container div
      const mail_container = document.createElement('div');
      document.querySelector('#email-list').append(mail_container)

      // set background based on read/unread
      if (email.read === true) {
        mail_container.className = 'list-group-item list-group-item-light list-group-item-action'
      } else {
        mail_container.className = 'list-group-item list-group-item-dark list-group-item-action'
      }

      // add sender
      const sender = document.createElement('div');
      sender.innerHTML = `From: ${email.sender}`;
      mail_container.append(sender);

      // add subject
      const subject = document.createElement('div');
      subject.innerHTML = `Subject: ${email.subject}`;
      mail_container.append(subject);

      // add timestamp
      const timestamp = document.createElement('div');
      timestamp.innerHTML = email.timestamp;
      mail_container.append(timestamp);

      // add onclick listener
      mail_container.onclick = function() {
        load_email(email.id, mailbox);
      }

    });
  })
  .catch(error => {
    console.log('error', error)
  });
}

function send_mail() {
  // get mail contents from form
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // make API request to post mail
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result)

      // view sent email window
      load_mailbox('sent');
  })
  .catch(error => {
    console.log('error:', error);
  });

  return false;
}