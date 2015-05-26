var messages = [];

var app = {
  friends: [],
  roomname: undefined,
  init: function() {
    this.addFriend();
    this.handleSubmit();
  },
  server: 'https://api.parse.com/1/classes/chatterbox',
  send: function(message) {
    $.ajax({
      url: this.server,
      type: 'POST',
      data: JSON.stringify(message),
      contentType: 'application/json',
      success: function (data) {
        console.log('chatterbox: Message sent');
      },
      error: function (data) {
        console.error('chatterbox: Failed to send message');
      }
    });
  },
  fetch: function() {
    $.ajax({
      url: this.server,
      type: 'GET',
      contentType: 'application/json',
      success: function (data) {
        console.log('chatterbox: Messages retrieved');
        messages = data.results;
      },
      error: function (data) {
        console.error('chatterbox: Failed to retrieve message');
      },
      complete: function() {

        if (app.roomname !== undefined) {
          messages = _.filter(messages, function(message) {
            return message.roomname === app.roomname;
          });
        }

        _.each(messages, function(message) {
          if (app.friends.indexOf(message.username) !== -1) {
            $('#main').append('<a href="#">' + _.escape(message.username) + '</a>')
                      .append('<div class="message friend">' + _.escape(message.text) +
                              _.escape(message.roomname) + '</div>');
          }
          else
          {
            $('#main').append('<a href="#">' + _.escape(message.username) + '</a>')
                      .append('<div class="message">' + _.escape(message.text) +
                              _.escape(message.roomname) + '</div>');
          }
        });


        $('a').on('click', function() {
          var add = prompt('Do you want to add ' + $(this).text() + ' as a friend? (yes or no)');
          if ( add === "yes" && app.friends.indexOf($(this).text()) === -1)  {
            app.friends.push($(this).text());
          }

        });
      }
    });
  },
  clearMessages: function() {
    $('#chats').empty();
  },
  addMessage: function(message) {
    $('#chats').append('<div>' + message + '</div>');
  },
  addRoom: function(room) {
    $('#roomSelect').append('<div>' + room + '</div>');
  },
  addFriend: function(friend) {
    $('#main').append('<a class="username">' + friend + '</a>');
  },
  handleSubmit: function() {
    $('#main').append('<button id="send" class="submit"></button>');
  }
};


$(document).ready(function() {
  app.fetch();

  $('button').on('click', function() {
    $('.message').remove();
    app.fetch();
  });

  $('.sendmessage').submit(function(event) {
    event.preventDefault();
    var values = {};
    $text = $('.sendmessage :input');
    $text.each(function() {
      values[this.name] = $(this).val();
    });

    if (values["name"] && values["message"]) {
      $('.sendmessage')[0].reset();
      var newObject = {username: values["name"],
                       text: values["message"],
                       roomname: app.roomname};
      app.send(newObject);
    }
  });


  $('.changeRoomForm').submit(function(event) {
    event.preventDefault();
    var values = {};
    $text = $('.changeRoomForm :input');
    $text.each(function() {
      values[this.name] = $(this).val();
    });

    if (values["room"]) {
      $('.changeRoomForm')[0].reset();
      app.roomname = values["room"];
    }
  });


});
