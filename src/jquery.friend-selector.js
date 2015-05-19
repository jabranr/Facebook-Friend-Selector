/**
  * Facebook Friend Selector
  * Copyright (c) 2013 Coders' Grave - http://codersgrave.com
  * Revised by: Jabran Rafique - hello@jabran.me
  * Version: 2.0.0
  * Requires:
  *  jQuery v1.6.2 or above
  *  Facebook Integration - http://developers.facebook.com/docs/reference/javascript/
  */


!(function(window, document, $, undefined) {

  'use strict';

  var fsOptions = {},
      running = false,
      isShowSelectedActive = false,
      windowWidth = 0,
      windowHeight = 0,
      selected_friend_count = 1,
      search_text_base = '',
      content, wrap, overlay,
      fbDocUri = 'https://developers.facebook.com/docs/reference/javascript/',
      fbApiVersion = 'v2.3',
      fsLoading = $('<div>', { 'id': 'fs-loading' }),

  _start = function() {
    if ( FB === undefined )
      return console.error('Facebook integration is not defined. View ' + fbDocUri);

    fsOptions = $.extend(true, {}, defaults, fsOptions);
    fsOptions.onPreStart();

    /* Hide select all button when max number is set */
    if ( fsOptions.max > 0 && fsOptions.max !== null ) {
      fsOptions.showSelectedCount = true;
      fsOptions.showButtonSelectAll = false;
    }

    _dialogBox();
    fsOptions.onStart();
  },

  _close = function() {
    wrap.fadeOut(400, function() {
      content.empty();
      wrap.remove();
      _stopEvent();
      overlay.fadeOut(400, function() {
        overlay.remove();
      });
    });

    running = false;
    isShowSelectedActive = false;
    fsOptions.onClose();
  },

  _submit = function() {
    var selected_friends = [];

    $('input.fs-friends:checked').each(function() {
      selected_friends.push( $(this).val() );
    });

    if ( fsOptions.facebookInvite ) {
      if ( fsOptions.taggableFriends ) {
        fsOptions.onSubmit(selected_friends);
          if ( fsOptions.closeOnSubmit ) {
            _close();
          }
      }
      else {
        FB.ui({
          method: 'apprequests',
          message: fsOptions.lang.facebookInviteMessage,
          to: selected_friends
        }, function(response) {
          if ( response !== null ) {
            fsOptions.onSubmit(selected_friends);
            if ( fsOptions.closeOnSubmit ) {
              _close();
            }
          }
        });
      }
    }
    else {
      fsOptions.onSubmit(selected_friends);
      if ( fsOptions.closeOnSubmit ) {
        _close();
      }
    }
  },

_dialogBox = function() {
  if ( running === true ) return;
  running = true;
  var docBody = $('body');

  overlay = $('<div>', {'id': 'fs-overlay'})
    .appendTo(docBody);

  wrap = $('<div>', {'id': 'fs-dialog-box-wrap'})
    .appendTo(docBody);

  content = $('<div>', { 'id': 'fs-dialog-box-content' })
    .appendTo(wrap);

  $(['nw', 'w', 'sw', 's', 'se', 'e', 'ne', 'n']).each(function(idx,elm) {
    $('<div>', {
      'class':'fs-dialog-box-bg',
      'id': 'fs-dialog-box-bg-' + elm
    }).prependTo(wrap);
  });

  var container = $('<div>', {
    'id': 'fs-dialog',
    'class': 'fs-color-' + fsOptions.color
  }).appendTo(content);

    $('<h2>', { 'id': 'fs-dialog-title' })
      .html('<span>' + fsOptions.lang.title + '</span>')
        .appendTo(container);

    var fsFilter = $('<div>', { 'id': 'fs-filter-box' }).appendTo(container);
      var fsInputWrap = $('<div>', { 'id': 'fs-input-wrap' }).appendTo(fsFilter);

        $('<input>', {
          'type': 'text',
          'id': 'fs-input-text',
          'title': fsOptions.lang.searchText
        }).appendTo(fsInputWrap);

        $('<a>', {
          'href': 'javascript:{}',
          'id': 'fs-reset',
        }).html('Reset')
          .appendTo(fsInputWrap);

    $('<div>', {
      'id': 'fs-user-list'
    }).append( $('<ul>') )
        .appendTo(container);

    var fsFilterButtons = $('<div>', { 'id': 'fs-filters-buttons' }).appendTo(container);
      var fsFilters = $('<div>', { 'id': 'fs-filters' }).appendTo(fsFilterButtons);
      var fsDialogButton = $('<div>', { 'id': 'fs-dialog-buttons' }).appendTo(fsFilterButtons);

        $('<a>', {
          'href': 'javascript:{}',
          'id': 'fs-show-selected'
        }).html('<span>' + fsOptions.lang.buttonShowSelected + '</span>')
            .appendTo(fsFilters);

        $('<a>', {
          'href': 'javascript:{}',
          'id': 'fs-submit-button',
          'class': 'fs-button'
        }).html('<span>' + fsOptions.lang.buttonSubmit + '</span>')
            .appendTo(fsDialogButton);

        $('<a>', {
          'href': 'javascript:{}',
          'id': 'fs-cancel-button',
          'class': 'fs-button'
        }).html('<span>' + fsOptions.lang.buttonCancel + '</span>')
            .appendTo(fsDialogButton);

    _getFacebookFriend();
    _resize(true);
    _initEvent();
    _selectAll();

    $(window).resize(function() {
      _resize(false);
    });
  },

  _getFacebookFriend = function() {
    $('#fs-user-list').append(fsLoading);

    if ( fsOptions.addUserGroups && ! fsOptions.facebookInvite ) {
      FB.api('/', 'POST', {
        batch: [{
          method: 'GET',
          relative_url: 'me/' + (fsOptions.taggableFriends ? 'taggable_friends' : 'friends')
        },
        {
          method: 'GET',
          relative_url: 'me/groups'
        }]
      },
      _parseFacebookFriends);
    }
    else {
      FB.api('/me/' + (fsOptions.taggableFriends ? 'taggable_friends' : 'friends'),
        _parseFacebookFriends);
    }
  },

  _parseFacebookFriends = function (response) {
    if ( response.error ) {
      if ( fsOptions.debug )
        console.error(response.error.message);
      return _close();
    }

    var facebook_friends = [];

    if ( fsOptions.addUserGroups && ! fsOptions.facebookInvite ) {
      var facebook_friends = $.parseJSON(response[0].body).data;
      $.merge(facebook_friends, $.parseJSON(response[1].body).data);
    }
    else {
      facebook_friends = response.data;
    }

    var max_friend_control = fsOptions.maxFriendsCount !== null && fsOptions.maxFriendsCount > 0;

    if ( fsOptions.showRandom === true || max_friend_control === true ) {
      facebook_friends = _shuffleData(response.data);
    }

    for (var i = 0, k = 0; i < facebook_friends.length; i++) {
      if ( max_friend_control && fsOptions.maxFriendsCount <= k ) {
        break;
      }

      var friendId = (fsOptions.taggableFriends ? facebook_friends[i].id : parseInt(facebook_friends[i].id, 10));
      if ($.inArray(friendId, fsOptions.getStoredFriends) >= 0) {
        _setFacebookFriends(facebook_friends[i], true);
        k++;
      }
    }

    for (var j = 0; j < facebook_friends.length; j++) {
      if ( max_friend_control && fsOptions.maxFriendsCount <=  j + fsOptions.getStoredFriends.length) {
        break;
      }

      var friendId = (fsOptions.taggableFriends ? facebook_friends[j].id : parseInt(facebook_friends[j].id, 10));
      if ($.inArray(friendId, fsOptions.excludeIds) >= 0) {
        continue;
      }

      if ($.inArray(friendId, fsOptions.getStoredFriends) <= -1) {
        _setFacebookFriends(facebook_friends[j], false);
      }
    }

    fsLoading.remove();
  },

  _setFacebookFriends = function (friend, predefined) {
    var li = $('<li>').appendTo( $('#fs-user-list ul') );
      var href = $('<a>', {
        'class': 'fs-anchor',
        'href': 'javascript://'
      }).appendTo( li );

        $('<input>', {
          'class': 'fs-fullname',
          'type': 'hidden',
          'name': 'fullname[]',
          'value': friend.name.toLowerCase().replace(/\s/gi, '0')
        }).appendTo(href);

        $('<input>', {
          'class': 'fs-friends',
          'type': 'checkbox',
          'name': 'friend[]',
          'value': friend.id
        }).appendTo(href);

        $('<img>', {
          'class': 'fs-thumb',
          'src': (fsOptions.taggableFriends ? friend.picture.data.url : 'https://graph.facebook.com/' + friend.id + '/picture?width=30&height=30'),
          'alt': friend.name
        }).appendTo(href);

        $('<span>', {
          'class': 'fs-name'
        }).html( _charLimit(friend.name, 15) )
            .appendTo(href);

    if (predefined) {
      _select(li);
    }
  },

  _initEvent = function() {
    wrap.delegate('#fs-cancel-button', 'click.fs', function() {
      _close();
    });

    wrap.delegate('#fs-submit-button', 'click.fs', function() {
      _submit();
    });

    $('#fs-dialog input').focus(function() {
      if ($(this).val() === $(this)[0].title) {
        $(this).val('');
      }
    }).blur(function() {
      if ($(this).val() === '') {
        $(this).val($(this)[0].title);
      }
    }).blur();

    $('#fs-dialog input').keyup(function() {
      _find($(this));
    });

    wrap.delegate('#fs-reset', 'click.fs', function() {
      $('#fs-input-text').val('');
      _find($('#fs-dialog input'));
      $('#fs-input-text').blur();
    });

    wrap.delegate('#fs-user-list li', 'click.fs', function() {
      _select($(this));
    });

    $('#fs-show-selected').click(function() {
      _showSelected($(this));
    });

    $(document).keyup(function(e) {
      if (e.which === 27 && fsOptions.enableEscapeButton === true) {
        _close();
      }
    });

    if ( fsOptions.closeOverlayClick === true ) {
      overlay.css({'cursor' : 'pointer'});
      overlay.bind('click.fs', _close);
    }
  },

  _select = function(th) {
    var btn = th;
    if ( btn.hasClass('checked') ) {
      btn.removeClass('checked');
      btn.find('input.fs-friends').prop('checked', false);
      selected_friend_count--;

      if (selected_friend_count - 1 !== $('#fs-user-list li').length) {
        $('#fs-select-all').text(fsOptions.lang.buttonSelectAll);
      }
    }
    else {
      var limit_state = _limitText();

      if (limit_state === false) {
        btn.find('input.fs-friends').prop('checked', false);
        return false;
      }

      selected_friend_count++;
      btn.addClass('checked');
      btn.find('input.fs-friends').prop('checked', true);
    }

    _showFriendCount();
  },

  _stopEvent = function() {
    $('#fs-reset').undelegate("click.fs");
    $('#fs-user-list li').undelegate("click.fs");
    $('#fs-select-all').undelegate("click.fs");
    selected_friend_count = 1;
  },

  _charLimit = function(word, limit) {
    if ( word.length <= limit )
      return word;
    return word.substr(0, limit) + '...';
  },

  _find = function(name) {
    var fs_dialog = $('#fs-dialog');
    var container = $('#fs-user-list ul');
    search_text_base = $.trim(name.val());

    if(search_text_base === '') {
      $.each(container.children(), function() {
        $(this).show();
      });

      if ( fs_dialog.has('#fs-summary-box').length ) {
        if ( selected_friend_count === 1 ) {
          $('#fs-summary-box').remove();
        }
        else {
          $('#fs-result-text').remove();
        }
      }

      return;
    }

    var search_text = search_text_base.toLowerCase().replace(/\s/gi, '0');
    var elements = $('#fs-user-list .fs-fullname[value*='+search_text+']');
    container.children().hide();

    $.each(elements, function() {
      $(this).parents('li').show();
    });

    var result_text = '';
    if ( elements.length > 0 && search_text_base > '' ) {
      result_text = fsOptions.lang.summaryBoxResult.replace("{0}", '"'+name.val()+'"');
      result_text = result_text.replace("{1}", elements.length);
    }
    else {
      result_text = fsOptions.lang.summaryBoxNoResult.replace("{0}", '"'+name.val()+'"');
    }

    if ( !fs_dialog.has('#fs-summary-box').length ) {
      $('#fs-filter-box').after('<div id="fs-summary-box"><span id="fs-result-text">'+result_text+'</span></div>');
    }
    else if ( !fs_dialog.has('#fs-result-text').length ) {
      $('#fs-summary-box').prepend('<span id="fs-result-text">'+result_text+'</span>');
    }
    else {
      $('#fs-result-text').text(result_text);
    }
  },

  _resize = function( is_started ) {
    windowWidth = $(window).width();
    windowHeight = $(window).height();
    var docHeight = $(document).height(),
        wrapWidth = wrap.width(),
        wrapHeight = wrap.height(),
        wrapLeft = (windowWidth / 2) - (wrapWidth / 2),
        wrapTop = (windowHeight / 2) - (wrapHeight / 2);

    if ( is_started === true ) {
      overlay.css({
        'background-color': fsOptions.overlayColor,
        'opacity': fsOptions.overlayOpacity,
        'height': docHeight
      }).fadeIn('fast', function() {
          wrap.css({
            left: wrapLeft,
            top: wrapTop
          }).fadeIn();
        });
    }
    else {
      wrap.stop()
        .animate({
          left: wrapLeft,
          top: wrapTop
        }, 200);

      overlay.css({ 'height': docHeight });
    }
  },

  _shuffleData = function( array_data ) {
    for (var j, x, i = array_data.length; i; j = parseInt(Math.random() * i, 10), x = array_data[--i], array_data[i] = array_data[j], array_data[j] = x);
      return array_data;
  },

  _limitText = function() {
    if ( selected_friend_count > fsOptions.max && fsOptions.max !== null ) {
      var selected_limit_text = fsOptions.lang.selectedLimitResult.replace('{0}', fsOptions.max);
      $('.fs-limit').html('<span class="fs-limit fs-full">'+selected_limit_text+'</span>');
      return false;
    }
  },

  _showFriendCount = function() {
    if ( selected_friend_count > 1 && fsOptions.showSelectedCount === true ) {
      var selected_count_text = fsOptions.lang.selectedCountResult.replace('{0}', (selected_friend_count-1));
      if ( !$('#fs-dialog').has('#fs-summary-box').length ) {
        $('#fs-filter-box').after('<div id="fs-summary-box"><span class="fs-limit fs-count">'+selected_count_text+'</span></div>');
      }
      else if ( !$('#fs-dialog').has('.fs-limit.fs-count').length ) {
        $('#fs-summary-box').append('<span class="fs-limit fs-count">'+selected_count_text+'</span>');
      }
      else {
        $('.fs-limit').text(selected_count_text);
      }
    }
    else {
      if ( search_text_base === '' ) {
        $('#fs-summary-box').remove();
      }
      else {
        $('.fs-limit').remove();
      }
    }
  },

  _resetSelection = function() {
    $('#fs-user-list li').removeClass('checked');
    $('#fs-user-list input.fs-friends').prop('checked', false);
    selected_friend_count = 1;
  },

  _selectAll = function() {
    if (fsOptions.showButtonSelectAll === true && fsOptions.max === null) {
      $('#fs-show-selected').before('<a href="javascript:{}" id="fs-select-all"><span>'+fsOptions.lang.buttonSelectAll+'</span></a> - ');
      wrap.delegate('#fs-select-all', 'click.fs', function() {
        if (selected_friend_count - 1 !== $('#fs-user-list li').length) {
          $('#fs-user-list li:hidden').show();
          _resetSelection();
          $('#fs-user-list li').each(function() {
            _select($(this));
          });

          $('#fs-select-all').text(fsOptions.lang.buttonDeselectAll);

          if (isShowSelectedActive === true) {
            isShowSelectedActive = false;
            $('#fs-show-selected').text(fsOptions.lang.buttonShowSelected);
          }
        }
        else {
          _resetSelection();
          _showFriendCount();
          $('#fs-select-all').text(fsOptions.lang.buttonSelectAll);
        }
      });
    }
  },

  _showSelected = function(t) {
    var container = $('#fs-user-list ul'),
    allElements = container.find('li'),
    selectedElements = container.find('li.checked');

    if (selectedElements.length !== 0 && selectedElements.length !== allElements.length || isShowSelectedActive === true) {
      if (isShowSelectedActive === true) {
        t.removeClass('active').text(fsOptions.lang.buttonShowSelected);
        container.children().show();
        isShowSelectedActive = false;
      }
      else {
        t.addClass('active').text(fsOptions.lang.buttonShowAll);
        container.children().hide();

        $.each(selectedElements, function() {
          $(this).show();
        });

        isShowSelectedActive = true;
      }
    }
  },

  defaults = {
    max: null,
    excludeIds: [],
    getStoredFriends: [],
    closeOverlayClick: true,
    enableEscapeButton: true,
    overlayOpacity: "0.3",
    overlayColor: '#000',
    closeOnSubmit: true,
    showSelectedCount: true,
    showButtonSelectAll: true,
    addUserGroups: false,
    color: "default",
    lang: {
      title: "Friend Selector",
      buttonSubmit: "Send",
      buttonCancel: "Cancel",
      buttonSelectAll: "Select All",
      buttonDeselectAll: "Deselect All",
      buttonShowSelected: "Show Selected",
      buttonShowAll: "Show All",
      summaryBoxResult: "{1} best results for {0}",
      summaryBoxNoResult: "No results for {0}",
      searchText: "Enter a friend's name",
      fbConnectError: "You must connect to Facebook to see this.",
      selectedCountResult: "You have choosen {0} people.",
      selectedLimitResult: "Limit is {0} people.",
      facebookInviteMessage: "Invite message"
    },
    maxFriendsCount: null,
    showRandom: false,
    facebookInvite: false,
    taggableFriends: false,
    onPreStart: function(response){ return null; },
    onStart: function(response){ return null; },
    onClose: function(response){ return null; },
    onSubmit: function(response){ return null; }
  };


  $.fn.fSelector = function (options) {
    this.unbind("click.fs");
    this.bind("click.fs", function() {
      fsOptions = options;
      _start();
    });

    return this;
  };

})(window, document, jQuery);
