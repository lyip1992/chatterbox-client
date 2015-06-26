var app;
$(function() {
  app = {
    server: 'https://api.parse.com/1/classes/chatterbox/',
    username: 'anonymous',
    roomname: 'lobby',
    lastMessageId: 0,
    friends: {},

    init: function() {
      app.username = window.location.search.substr(10);  // Get username

      app.$main = $('#main');  // Cache jQuery selectors
      app.$message = $('#message');
      app.$chats = $('#chats');
      app.$roomSelect = $('#roomSelect');
      app.$send = $('#send');

      app.$main.on('click', '.username', app.addFriend);  // Add listeners
      app.$send.on('submit', app.handleSubmit);
      app.$roomSelect.on('change', app.saveRoom);

      app.startSpinner();  // Fetch previous messages
      app.fetch(false);

      setInterval(app.fetch, 3000);  // Poll for new messages
    },
    send: function(data) {
      app.startSpinner();
      app.$message.val('');  // Clear messages input

      $.ajax({  // POST the message to the server
        url: app.server,
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (data) {
          console.log('chatterbox: Message sent');
          app.fetch();  // Trigger a fetch to update the messages
        },
        error: function (data) {
          console.error('chatterbox: Failed to send message');
        }
      });
    },
    fetch: function(animate) {
      $.ajax({
        url: app.server,
        type: 'GET',
        contentType: 'application/json',
        data: { order: '-createdAt'},
        success: function(data) {
          console.log('chatterbox: Messages fetched');
          if (!data.results || !data.results.length) { return; }  // Don't bother if we have nothing to work with

          var mostRecentMessage = data.results[data.results.length-1];  // Get the last message
          var displayedRoom = $('.chat span').first().data('roomname');
          app.stopSpinner();

          if (mostRecentMessage.objectId !== app.lastMessageId || app.roomname !== displayedRoom) {  // Only bother updating the DOM if we have a new message
            app.populateRooms(data.results);  // Update the UI with the fetched rooms
            app.populateMessages(data.results, animate);  // Update the UI with the fetched messages
            app.lastMessageId = mostRecentMessage.objectId;  // Store the ID of the most recent message
          }
        },
        error: function(data) {
          console.error('chatterbox: Failed to fetch messages');
        }
      });
    },
    clearMessages: function() {
      app.$chats.html('');
    },
    populateMessages: function(results, animate) {
      app.clearMessages();  // Clear existing messages
      app.stopSpinner();
      if (Array.isArray(results)) {
        results.forEach(app.addMessage);  // Add all fetched messages
      }

      var scrollTop = app.$chats.prop('scrollHeight');  // Make it scroll to the bottom
      if (animate) {
        app.$chats.animate({
          scrollTop: scrollTop
        });
      }
      else {
        app.$chats.scrollTop(scrollTop);
      }
    },
    populateRooms: function(results) {
      app.$roomSelect.html('<option value="__newRoom">New room...</option><option value="" selected>Lobby</option></select>');

      if (results) {
        var rooms = {};
        results.forEach(function(data) {
          var roomname = data.roomname;
          if (roomname && !rooms[roomname]) {
            app.addRoom(roomname);  // Add the room to the select menu
            rooms[roomname] = true;  // Store that we've added this room already
          }
        });
      }

      app.$roomSelect.val(app.roomname);  // Select the menu option
    },
    addRoom: function(roomname) {
      var $option = $('<option/>').val(roomname).text(roomname);  // Prevent XSS by escaping with DOM methods
      app.$roomSelect.append($option);  // Add to select
    },
    addMessage: function(data) {
      if (!data.roomname) {
        data.roomname = 'lobby';
      }

      if (data.roomname === app.roomname) {  // Only add messages that are in our current room
        var $chat = $('<div class="chat"/>');  // Create a div to hold the chats
        var $username = $('<span class="username"/>');  // Add in the message data using DOM methods to avoid XSS
        $username.text(data.username+': ').attr('data-username', data.username).attr('data-roomname',data.roomname).appendTo($chat);  // Store the username in the element's data


        if (app.friends[data.username] === true) { // Add the friend class
          $username.addClass('friend');
        }

        var $message = $('<br><span/>');
        $message.text(data.text).appendTo($chat);

        app.$chats.append($chat);  // Add the message to the UI
      }
    },
    addFriend: function(evt) {
      var username = $(evt.currentTarget).attr('data-username');

      if (username !== undefined) {
        console.log('chatterbox: Adding %s as a friend', username);
        app.friends[username] = true;  // Store as a friend

        var selector = '[data-username="'+username.replace(/"/g, '\\\"')+'"]';  // Bold all previous messages
        var $usernames = $(selector).addClass('friend');  // Escape the username in case it contains a quote
      }
    },
    saveRoom: function(evt) {

      var selectIndex = app.$roomSelect.prop('selectedIndex');

      if (selectIndex === 0) {  // New room is always the first option
        var roomname = prompt('Enter room name');
        if (roomname) {
          app.roomname = roomname;  // Set as the current room
          app.addRoom(roomname);  // Add the room to the menu
          app.$roomSelect.val(roomname);  // Select the menu option
          app.fetch();  // Fetch messages again
        }
      }
      else {
        app.startSpinner();  // Store as undefined for empty names
        app.roomname = app.$roomSelect.val();
        app.fetch();  // Fetch messages again
      }
    },
    handleSubmit: function(evt) {
      var message = {
        username: app.username,
        text: app.$message.val(),
        roomname: app.roomname || 'lobby'
      };

      app.send(message);
      evt.preventDefault();  // Stop the form from submitting
    },
    startSpinner: function(){
      $('.spinner img').show();
      $('form input[type=submit]').attr('disabled', "true");
    },

    stopSpinner: function(){
      $('.spinner img').fadeOut('fast');
      $('form input[type=submit]').attr('disabled', null);
    }
  };
}());
