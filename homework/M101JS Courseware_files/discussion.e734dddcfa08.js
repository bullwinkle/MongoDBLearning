(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.Content = (function(_super) {

      __extends(Content, _super);

      function Content() {
        Content.__super__.constructor.apply(this, arguments);
      }

      Content.contents = {};

      Content.contentInfos = {};

      Content.prototype.template = function() {
        return DiscussionUtil.getTemplate('_content');
      };

      Content.prototype.actions = {
        editable: '.admin-edit',
        can_reply: '.discussion-reply',
        can_endorse: '.admin-endorse',
        can_delete: '.admin-delete',
        can_openclose: '.admin-openclose'
      };

      Content.prototype.urlMappers = {};

      Content.prototype.urlFor = function(name) {
        return this.urlMappers[name].apply(this);
      };

      Content.prototype.can = function(action) {
        return (this.get('ability') || {})[action];
      };

      Content.prototype.updateInfo = function(info) {
        if (info) {
          this.set('ability', info.ability);
          this.set('voted', info.voted);
          return this.set('subscribed', info.subscribed);
        }
      };

      Content.prototype.addComment = function(comment, options) {
        var comments_count, model, thread;
        options || (options = {});
        if (!options.silent) {
          thread = this.get('thread');
          comments_count = parseInt(thread.get('comments_count'));
          thread.set('comments_count', comments_count + 1);
        }
        this.get('children').push(comment);
        model = new Comment($.extend({}, comment, {
          thread: this.get('thread')
        }));
        this.get('comments').add(model);
        this.trigger("comment:add");
        return model;
      };

      Content.prototype.removeComment = function(comment) {
        var comments_count, thread;
        thread = this.get('thread');
        comments_count = parseInt(thread.get('comments_count'));
        thread.set('comments_count', comments_count - 1 - comment.getCommentsCount());
        return this.trigger("comment:remove");
      };

      Content.prototype.resetComments = function(children) {
        var comment, _i, _len, _ref, _results;
        this.set('children', []);
        this.set('comments', new Comments());
        _ref = children || [];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          comment = _ref[_i];
          _results.push(this.addComment(comment, {
            silent: true
          }));
        }
        return _results;
      };

      Content.prototype.initialize = function() {
        Content.addContent(this.id, this);
        if (Content.getInfo(this.id)) this.updateInfo(Content.getInfo(this.id));
        this.set('user_url', DiscussionUtil.urlFor('user_profile', this.get('user_id')));
        return this.resetComments(this.get('children'));
      };

      Content.prototype.remove = function() {
        if (this.get('type') === 'comment') {
          this.get('thread').removeComment(this);
          return this.get('thread').trigger("comment:remove", this);
        } else {
          return this.trigger("thread:remove", this);
        }
      };

      Content.addContent = function(id, content) {
        return this.contents[id] = content;
      };

      Content.getContent = function(id) {
        return this.contents[id];
      };

      Content.getInfo = function(id) {
        return this.contentInfos[id];
      };

      Content.loadContentInfos = function(infos) {
        var id, info;
        for (id in infos) {
          info = infos[id];
          if (this.getContent(id)) this.getContent(id).updateInfo(info);
        }
        return $.extend(this.contentInfos, infos);
      };

      return Content;

    })(Backbone.Model);
    this.Thread = (function(_super) {

      __extends(Thread, _super);

      function Thread() {
        Thread.__super__.constructor.apply(this, arguments);
      }

      Thread.prototype.urlMappers = {
        'retrieve': function() {
          return DiscussionUtil.urlFor('retrieve_single_thread', this.id);
        },
        'reply': function() {
          return DiscussionUtil.urlFor('create_comment', this.id);
        },
        'unvote': function() {
          return DiscussionUtil.urlFor("undo_vote_for_" + (this.get('type')), this.id);
        },
        'upvote': function() {
          return DiscussionUtil.urlFor("upvote_" + (this.get('type')), this.id);
        },
        'downvote': function() {
          return DiscussionUtil.urlFor("downvote_" + (this.get('type')), this.id);
        },
        'close': function() {
          return DiscussionUtil.urlFor('openclose_thread', this.id);
        },
        'update': function() {
          return DiscussionUtil.urlFor('update_thread', this.id);
        },
        'delete': function() {
          return DiscussionUtil.urlFor('delete_thread', this.id);
        },
        'follow': function() {
          return DiscussionUtil.urlFor('follow_thread', this.id);
        },
        'unfollow': function() {
          return DiscussionUtil.urlFor('unfollow_thread', this.id);
        },
        'sticky': function() {
          return DiscussionUtil.urlFor('sticky', this.id);
        },
        'unsticky': function() {
          return DiscussionUtil.urlFor('unsticky', this.id);
        }
      };

      Thread.prototype.actions = {
        can_set_is_sticky: '.discussion-is-sticky'
      };

      Thread.prototype.initialize = function() {
        this.set('thread', this);
        return Thread.__super__.initialize.call(this);
      };

      Thread.prototype.updateInfo = function(info) {
        Thread.__super__.updateInfo.call(this, info);
        if (info) return this.set('is_sticky', info.is_sticky);
      };

      Thread.prototype.comment = function() {
        return this.set("comments_count", parseInt(this.get("comments_count")) + 1);
      };

      Thread.prototype.follow = function() {
        return this.set('subscribed', true);
      };

      Thread.prototype.unfollow = function() {
        return this.set('subscribed', false);
      };

      Thread.prototype.vote = function() {
        this.get("votes")["up_count"] = parseInt(this.get("votes")["up_count"]) + 1;
        return this.trigger("change", this);
      };

      Thread.prototype.unvote = function() {
        this.get("votes")["up_count"] = parseInt(this.get("votes")["up_count"]) - 1;
        return this.trigger("change", this);
      };

      Thread.prototype.is_sticky = function() {
        return this.trigger("change", this);
      };

      Thread.prototype.display_body = function() {
        if (this.has("highlighted_body")) {
          return String(this.get("highlighted_body")).replace(/<highlight>/g, '<mark>').replace(/<\/highlight>/g, '</mark>');
        } else {
          return this.get("body");
        }
      };

      Thread.prototype.display_title = function() {
        if (this.has("highlighted_title")) {
          return String(this.get("highlighted_title")).replace(/<highlight>/g, '<mark>').replace(/<\/highlight>/g, '</mark>');
        } else {
          return this.get("title");
        }
      };

      Thread.prototype.toJSON = function() {
        var json_attributes;
        json_attributes = _.clone(this.attributes);
        return _.extend(json_attributes, {
          title: this.display_title(),
          body: this.display_body()
        });
      };

      Thread.prototype.created_at_date = function() {
        return new Date(this.get("created_at"));
      };

      Thread.prototype.created_at_time = function() {
        return new Date(this.get("created_at")).getTime();
      };

      return Thread;

    })(this.Content);
    this.Comment = (function(_super) {

      __extends(Comment, _super);

      function Comment() {
        Comment.__super__.constructor.apply(this, arguments);
      }

      Comment.prototype.urlMappers = {
        'unvote': function() {
          return DiscussionUtil.urlFor("undo_vote_for_" + (this.get('type')), this.id);
        },
        'upvote': function() {
          return DiscussionUtil.urlFor("upvote_" + (this.get('type')), this.id);
        },
        'downvote': function() {
          return DiscussionUtil.urlFor("downvote_" + (this.get('type')), this.id);
        },
        'endorse': function() {
          return DiscussionUtil.urlFor('endorse_comment', this.id);
        },
        'update': function() {
          return DiscussionUtil.urlFor('update_comment', this.id);
        },
        'delete': function() {
          return DiscussionUtil.urlFor('delete_comment', this.id);
        }
      };

      Comment.prototype.getCommentsCount = function() {
        var count;
        count = 0;
        this.get('comments').each(function(comment) {
          return count += comment.getCommentsCount() + 1;
        });
        return count;
      };

      return Comment;

    })(this.Content);
    this.Comments = (function(_super) {

      __extends(Comments, _super);

      function Comments() {
        Comments.__super__.constructor.apply(this, arguments);
      }

      Comments.prototype.model = Comment;

      Comments.prototype.initialize = function() {
        var _this = this;
        return this.bind("add", function(item) {
          return item.collection = _this;
        });
      };

      Comments.prototype.find = function(id) {
        return _.first(this.where({
          id: id
        }));
      };

      return Comments;

    })(Backbone.Collection);
  }

}).call(this);

(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.Discussion = (function(_super) {

      __extends(Discussion, _super);

      function Discussion() {
        Discussion.__super__.constructor.apply(this, arguments);
      }

      Discussion.prototype.model = Thread;

      Discussion.prototype.initialize = function(models, options) {
        var _this = this;
        if (options == null) options = {};
        this.pages = options['pages'] || 1;
        this.current_page = 1;
        this.bind("add", function(item) {
          return item.discussion = _this;
        });
        return this.on("thread:remove", function(thread) {
          return _this.remove(thread);
        });
      };

      Discussion.prototype.find = function(id) {
        return _.first(this.where({
          id: id
        }));
      };

      Discussion.prototype.hasMorePages = function() {
        return this.current_page < this.pages;
      };

      Discussion.prototype.addThread = function(thread, options) {
        var model;
        if (!this.find(thread.id)) {
          options || (options = {});
          model = new Thread(thread);
          this.add(model);
          return model;
        }
      };

      Discussion.prototype.retrieveAnotherPage = function(mode, options, sort_options) {
        var data, url,
          _this = this;
        if (options == null) options = {};
        if (sort_options == null) sort_options = {};
        this.current_page += 1;
        data = {
          page: this.current_page
        };
        switch (mode) {
          case 'search':
            url = DiscussionUtil.urlFor('search');
            data['text'] = options.search_text;
            break;
          case 'commentables':
            url = DiscussionUtil.urlFor('search');
            data['commentable_ids'] = options.commentable_ids;
            break;
          case 'all':
            url = DiscussionUtil.urlFor('threads');
            break;
          case 'followed':
            url = DiscussionUtil.urlFor('followed_threads', options.user_id);
        }
        data['sort_key'] = sort_options.sort_key || 'date';
        data['sort_order'] = sort_options.sort_order || 'desc';
        return DiscussionUtil.safeAjax({
          $elem: this.$el,
          url: url,
          data: data,
          dataType: 'json',
          success: function(response, textStatus) {
            var data, models, new_collection, new_threads;
            models = _this.models;
            new_threads = [
              (function() {
                var _i, _len, _ref, _results;
                _ref = response.discussion_data;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  data = _ref[_i];
                  _results.push(new Thread(data));
                }
                return _results;
              })()
            ][0];
            new_collection = _.union(models, new_threads);
            Content.loadContentInfos(response.annotated_content_info);
            _this.reset(new_collection);
            _this.pages = response.num_pages;
            return _this.current_page = response.page;
          }
        });
      };

      return Discussion;

    })(Backbone.Collection);
  }

}).call(this);

(function() {

  this.DiscussionFilter = (function() {

    function DiscussionFilter() {}

    DiscussionFilter.filterDrop = function(e) {
      var $drop, $items, query;
      $drop = $(e.target).parents('.topic_menu_wrapper, .browse-topic-drop-menu-wrapper');
      query = $(e.target).val();
      $items = $drop.find('a');
      if (query.length === 0) {
        $items.removeClass('hidden');
        return;
      }
      $items.addClass('hidden');
      return $items.each(function(i) {
        var terms, test, thisText;
        thisText = $(this).not('.unread').text();
        $(this).parents('ul').siblings('a').not('.unread').each(function(i) {
          return thisText = thisText + ' ' + $(this).text();
        });
        test = true;
        terms = thisText.split(' ');
        if (thisText.toLowerCase().search(query.toLowerCase()) === -1) {
          test = false;
        }
        if (test) {
          $(this).removeClass('hidden');
          $(this).parent().find('a').removeClass('hidden');
          return $(this).parents('ul').siblings('a').removeClass('hidden');
        }
      });
    };

    return DiscussionFilter;

  })();

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.DiscussionRouter = (function(_super) {

      __extends(DiscussionRouter, _super);

      function DiscussionRouter() {
        this.hideNewPost = __bind(this.hideNewPost, this);
        this.showNewPost = __bind(this.showNewPost, this);
        this.navigateToAllThreads = __bind(this.navigateToAllThreads, this);
        this.navigateToThread = __bind(this.navigateToThread, this);
        this.setActiveThread = __bind(this.setActiveThread, this);
        DiscussionRouter.__super__.constructor.apply(this, arguments);
      }

      DiscussionRouter.prototype.routes = {
        "": "allThreads",
        ":threads/:thread_id": "showThread"
      };

      DiscussionRouter.prototype.initialize = function(options) {
        this.discussion = options['discussion'];
        this.nav = new DiscussionThreadListView({
          collection: this.discussion,
          el: $(".sidebar")
        });
        this.nav.on("thread:selected", this.navigateToThread);
        this.nav.on("thread:removed", this.navigateToAllThreads);
        this.nav.on("threads:rendered", this.setActiveThread);
        this.nav.render();
        this.newPostView = new NewPostView({
          el: $(".new-post-article"),
          collection: this.discussion
        });
        this.nav.on("thread:created", this.navigateToThread);
        this.newPost = $('.new-post-article');
        $('.new-post-btn').bind("click", this.showNewPost);
        return $('.new-post-cancel').bind("click", this.hideNewPost);
      };

      DiscussionRouter.prototype.allThreads = function() {
        if (this.nav.collection.length) {
          this.navigateToThread(this.nav.collection.at(0).get("id"));
        }
        return this.nav.updateSidebar();
      };

      DiscussionRouter.prototype.setActiveThread = function() {
        if (this.thread) return this.nav.setActiveThread(this.thread.get("id"));
      };

      DiscussionRouter.prototype.showThread = function(forum_name, thread_id) {
        var _this = this;
        this.thread = this.discussion.get(thread_id);
        this.thread.set("unread_comments_count", 0);
        this.thread.set("read", true);
        this.setActiveThread();
        if (this.main) {
          this.main.cleanup();
          this.main.undelegateEvents();
        }
        this.main = new DiscussionThreadView({
          el: $(".discussion-column"),
          model: this.thread
        });
        this.main.render();
        this.main.on("thread:responses:rendered", function() {
          return _this.nav.updateSidebar();
        });
        return this.main.on("tag:selected", function(tag) {
          var search;
          search = "[" + tag + "]";
          return _this.nav.setAndSearchFor(search);
        });
      };

      DiscussionRouter.prototype.navigateToThread = function(thread_id) {
        var thread;
        thread = this.discussion.get(thread_id);
        return this.navigate("threads/" + thread_id, {
          trigger: true
        });
      };

      DiscussionRouter.prototype.navigateToAllThreads = function() {
        return this.navigate("", {
          trigger: true
        });
      };

      DiscussionRouter.prototype.showNewPost = function(event) {
        if (this.newPost.is(':hidden')) {
          this.newPost.slideDown(300);
          $('.new-post-title').focus();
          return $('#new-post-anonymous').attr('checked', false);
        }
      };

      DiscussionRouter.prototype.hideNewPost = function(event) {
        return this.newPost.slideUp(300);
      };

      return DiscussionRouter;

    })(Backbone.Router);
  }

}).call(this);

(function() {
  var DiscussionApp, DiscussionProfileApp;

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    DiscussionApp = {
      start: function(elem) {
        var content_info, discussion, element, thread_pages, threads, user_info;
        DiscussionUtil.loadRolesFromContainer();
        element = $(elem);
        window.$$course_id = element.data("course-id");
        user_info = element.data("user-info");
        threads = element.data("threads");
        thread_pages = element.data("thread-pages");
        content_info = element.data("content-info");
        window.user = new DiscussionUser(user_info);
        Content.loadContentInfos(content_info);
        discussion = new Discussion(threads, {
          pages: thread_pages
        });
        new DiscussionRouter({
          discussion: discussion
        });
        return Backbone.history.start({
          pushState: true,
          root: "/courses/" + $$course_id + "/discussion/forum/"
        });
      }
    };
    DiscussionProfileApp = {
      start: function(elem) {
        var element, threads, user_info;
        element = $(elem);
        window.$$course_id = element.data("course-id");
        threads = element.data("threads");
        user_info = element.data("user-info");
        window.user = new DiscussionUser(user_info);
        return new DiscussionUserProfileView({
          el: element,
          collection: threads
        });
      }
    };
    $(function() {
      $("section.discussion").each(function(index, elem) {
        return DiscussionApp.start(elem);
      });
      return $("section.discussion-user-threads").each(function(index, elem) {
        return DiscussionProfileApp.start(elem);
      });
    });
  }

}).call(this);

(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.DiscussionUser = (function(_super) {

      __extends(DiscussionUser, _super);

      function DiscussionUser() {
        DiscussionUser.__super__.constructor.apply(this, arguments);
      }

      DiscussionUser.prototype.following = function(thread) {
        return _.include(this.get('subscribed_thread_ids'), thread.id);
      };

      DiscussionUser.prototype.voted = function(thread) {
        return _.include(this.get('upvoted_ids'), thread.id);
      };

      DiscussionUser.prototype.vote = function(thread) {
        this.get('upvoted_ids').push(thread.id);
        return thread.vote();
      };

      DiscussionUser.prototype.unvote = function(thread) {
        this.set('upvoted_ids', _.without(this.get('upvoted_ids'), thread.id));
        return thread.unvote();
      };

      return DiscussionUser;

    })(Backbone.Model);
  }

}).call(this);

(function() {



}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $(function() {
    return new TooltipManager;
  });

  this.TooltipManager = (function() {

    function TooltipManager() {
      this.hideTooltip = __bind(this.hideTooltip, this);
      this.moveTooltip = __bind(this.moveTooltip, this);
      this.showTooltip = __bind(this.showTooltip, this);      this.$body = $('body');
      this.$tooltip = $('<div class="tooltip"></div>');
      this.$body.delegate('[data-tooltip]', {
        'mouseover': this.showTooltip,
        'mousemove': this.moveTooltip,
        'mouseout': this.hideTooltip,
        'click': this.hideTooltip
      });
    }

    TooltipManager.prototype.showTooltip = function(e) {
      var tooltipCoords, tooltipText,
        _this = this;
      tooltipText = $(e.target).attr('data-tooltip');
      this.$tooltip.html(tooltipText);
      this.$body.append(this.$tooltip);
      $(e.target).children().css('pointer-events', 'none');
      tooltipCoords = {
        x: e.pageX - (this.$tooltip.outerWidth() / 2),
        y: e.pageY - (this.$tooltip.outerHeight() + 15)
      };
      this.$tooltip.css;
      ({
        'left': tooltipCoords.x,
        'top': tooltipCoords.y
      });
      return this.tooltipTimer = setTimeout(function() {
        _this.$tooltip.show().css('opacity', 1);
        return _this.tooltipTimer = setTimeout(function() {
          return _this.hideTooltip();
        }, 3000);
      }, 500);
    };

    TooltipManager.prototype.moveTooltip = function(e) {
      var tooltipCoords;
      tooltipCoords = {
        x: e.pageX - (this.$tooltip.outerWidth() / 2),
        y: e.pageY - (this.$tooltip.outerHeight() + 15)
      };
      return this.$tooltip.css({
        'left': tooltipCoords.x,
        'top': tooltipCoords.y
      });
    };

    TooltipManager.prototype.hideTooltip = function(e) {
      this.$tooltip.hide().css('opacity', 0);
      return clearTimeout(this.tooltipTimer);
    };

    return TooltipManager;

  })();

}).call(this);

(function() {

  $(function() {
    if (!window.$$contents) window.$$contents = {};
    return $.fn.extend({
      loading: function() {
        this.$_loading = $("<div class='loading-animation'></div>");
        return $(this).after(this.$_loading);
      },
      loaded: function() {
        return this.$_loading.remove();
      }
    });
  });

  this.DiscussionUtil = (function() {

    function DiscussionUtil() {}

    DiscussionUtil.wmdEditors = {};

    DiscussionUtil.getTemplate = function(id) {
      return $("script#" + id).html();
    };

    DiscussionUtil.loadRoles = function(roles) {
      return this.roleIds = roles;
    };

    DiscussionUtil.loadRolesFromContainer = function() {
      return this.loadRoles($("#discussion-container").data("roles"));
    };

    DiscussionUtil.isStaff = function(user_id) {
      var staff;
      staff = _.union(this.roleIds['Staff'], this.roleIds['Moderator'], this.roleIds['Administrator']);
      return _.include(staff, parseInt(user_id));
    };

    DiscussionUtil.isTA = function(user_id) {
      var ta;
      ta = _.union(this.roleIds['Community TA']);
      return _.include(ta, parseInt(user_id));
    };

    DiscussionUtil.bulkUpdateContentInfo = function(infos) {
      var id, info, _results;
      _results = [];
      for (id in infos) {
        info = infos[id];
        _results.push(Content.getContent(id).updateInfo(info));
      }
      return _results;
    };

    DiscussionUtil.generateDiscussionLink = function(cls, txt, handler) {
      return $("<a>").addClass("discussion-link").attr("href", "javascript:void(0)").addClass(cls).html(txt).click(function() {
        return handler(this);
      });
    };

    DiscussionUtil.urlFor = function(name, param) {
      return {
        create_thread: "/courses/" + $$course_id + "/discussion/threads/create",
        search_similar_threads: "/courses/" + $$course_id + "/discussion/threads/search_similar",
        update_thread: "/courses/" + $$course_id + "/discussion/threads/" + param + "/update",
        create_comment: "/courses/" + $$course_id + "/discussion/threads/" + param + "/reply",
        delete_thread: "/courses/" + $$course_id + "/discussion/threads/" + param + "/delete",
        upvote_thread: "/courses/" + $$course_id + "/discussion/threads/" + param + "/upvote",
        downvote_thread: "/courses/" + $$course_id + "/discussion/threads/" + param + "/downvote",
        undo_vote_for_thread: "/courses/" + $$course_id + "/discussion/threads/" + param + "/unvote",
        follow_thread: "/courses/" + $$course_id + "/discussion/threads/" + param + "/follow",
        unfollow_thread: "/courses/" + $$course_id + "/discussion/threads/" + param + "/unfollow",
        sticky: "/courses/" + $$course_id + "/discussion/threads/" + param + "/sticky",
        unsticky: "/courses/" + $$course_id + "/discussion/threads/" + param + "/unsticky",
        update_comment: "/courses/" + $$course_id + "/discussion/comments/" + param + "/update",
        endorse_comment: "/courses/" + $$course_id + "/discussion/comments/" + param + "/endorse",
        delete_comment: "/courses/" + $$course_id + "/discussion/comments/" + param + "/delete",
        upvote_comment: "/courses/" + $$course_id + "/discussion/comments/" + param + "/upvote",
        downvote_comment: "/courses/" + $$course_id + "/discussion/comments/" + param + "/downvote",
        undo_vote_for_comment: "/courses/" + $$course_id + "/discussion/comments/" + param + "/unvote",
        upload: "/courses/" + $$course_id + "/discussion/upload",
        search: "/courses/" + $$course_id + "/discussion/forum/search",
        tags_autocomplete: "/courses/" + $$course_id + "/discussion/threads/tags/autocomplete",
        retrieve_discussion: "/courses/" + $$course_id + "/discussion/forum",
        retrieve_single_thread: "/courses/" + $$course_id + "/discussion/forum/threads/" + param,
        update_moderator_status: "/courses/" + $$course_id + "/discussion/users/" + param + "/update_moderator_status",
        openclose_thread: "/courses/" + $$course_id + "/discussion/threads/" + param + "/close",
        user_profile: "/courses/" + $$course_id + "/discussion/forum/users/" + param,
        followed_threads: "/courses/" + $$course_id + "/discussion/forum/users/" + param + "/followed",
        threads: "/courses/" + $$course_id + "/discussion/forum"
      }[name];
    };

    DiscussionUtil.safeAjax = function(params) {
      var $elem, request;
      $elem = params.$elem;
      if ($elem && $elem.attr("disabled")) return;
      params["url"] = URI(params["url"]).addSearch({
        ajax: 1
      });
      params["beforeSend"] = function() {
        if ($elem) $elem.attr("disabled", "disabled");
        if (params["$loading"]) {
          if (params["loadingCallback"] != null) {
            return params["loadingCallback"].apply(params["$loading"]);
          } else {
            return params["$loading"].loading();
          }
        }
      };
      request = $.ajax(params).always(function() {
        if ($elem) $elem.removeAttr("disabled");
        if (params["$loading"]) {
          if (params["loadedCallback"] != null) {
            return params["loadedCallback"].apply(params["$loading"]);
          } else {
            return params["$loading"].loaded();
          }
        }
      });
      return request;
    };

    DiscussionUtil.get = function($elem, url, data, success) {
      return this.safeAjax({
        $elem: $elem,
        url: url,
        type: "GET",
        dataType: "json",
        data: data,
        success: success
      });
    };

    DiscussionUtil.post = function($elem, url, data, success) {
      return this.safeAjax({
        $elem: $elem,
        url: url,
        type: "POST",
        dataType: "json",
        data: data,
        success: success
      });
    };

    DiscussionUtil.bindLocalEvents = function($local, eventsHandler) {
      var event, eventSelector, handler, selector, _ref, _results;
      _results = [];
      for (eventSelector in eventsHandler) {
        handler = eventsHandler[eventSelector];
        _ref = eventSelector.split(' '), event = _ref[0], selector = _ref[1];
        _results.push($local(selector).unbind(event)[event](handler));
      }
      return _results;
    };

    DiscussionUtil.processTag = function(text) {
      return text.toLowerCase();
    };

    DiscussionUtil.tagsInputOptions = function() {
      return {
        autocomplete_url: this.urlFor('tags_autocomplete'),
        autocomplete: {
          remoteDataType: 'json'
        },
        interactive: true,
        height: '30px',
        width: '100%',
        defaultText: "Tag your post: press enter after each tag",
        removeWithBackspace: true,
        preprocessTag: this.processTag
      };
    };

    DiscussionUtil.formErrorHandler = function(errorsField) {
      return function(xhr, textStatus, error) {
        var response, _i, _len, _ref, _results;
        response = JSON.parse(xhr.responseText);
        if ((response.errors != null) && response.errors.length > 0) {
          errorsField.empty();
          _ref = response.errors;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            error = _ref[_i];
            _results.push(errorsField.append($("<li>").addClass("new-post-form-error").html(error)).show());
          }
          return _results;
        }
      };
    };

    DiscussionUtil.clearFormErrors = function(errorsField) {
      return errorsField.empty();
    };

    DiscussionUtil.makeWmdEditor = function($content, $local, cls_identifier) {
      var appended_id, editor, elem, id, imageUploadUrl, placeholder;
      elem = $local("." + cls_identifier);
      placeholder = elem.data('placeholder');
      id = elem.attr("data-id");
      appended_id = "-" + cls_identifier + "-" + id;
      imageUploadUrl = this.urlFor('upload');
      editor = Markdown.makeWmdEditor(elem, appended_id, imageUploadUrl);
      this.wmdEditors["" + cls_identifier + "-" + id] = editor;
      if (placeholder != null) {
        elem.find("#wmd-input" + appended_id).attr('placeholder', placeholder);
      }
      return editor;
    };

    DiscussionUtil.getWmdEditor = function($content, $local, cls_identifier) {
      var elem, id;
      elem = $local("." + cls_identifier);
      id = elem.attr("data-id");
      return this.wmdEditors["" + cls_identifier + "-" + id];
    };

    DiscussionUtil.getWmdInput = function($content, $local, cls_identifier) {
      var elem, id;
      elem = $local("." + cls_identifier);
      id = elem.attr("data-id");
      return $local("#wmd-input-" + cls_identifier + "-" + id);
    };

    DiscussionUtil.getWmdContent = function($content, $local, cls_identifier) {
      return this.getWmdInput($content, $local, cls_identifier).val();
    };

    DiscussionUtil.setWmdContent = function($content, $local, cls_identifier, text) {
      this.getWmdInput($content, $local, cls_identifier).val(text);
      return this.getWmdEditor($content, $local, cls_identifier).refreshPreview();
    };

    DiscussionUtil.subscriptionLink = function(type, id) {
      var followLink, handleFollow, handleUnfollow, unfollowLink;
      followLink = function() {
        return this.generateDiscussionLink("discussion-follow-" + type, "Follow", handleFollow);
      };
      unfollowLink = function() {
        return this.generateDiscussionLink("discussion-unfollow-" + type, "Unfollow", handleUnfollow);
      };
      handleFollow = function(elem) {
        return this.safeAjax({
          $elem: $(elem),
          url: this.urlFor("follow_" + type, id),
          type: "POST",
          success: function(response, textStatus) {
            if (textStatus === "success") {
              return $(elem).replaceWith(unfollowLink());
            }
          },
          dataType: 'json'
        });
      };
      handleUnfollow = function(elem) {
        return this.safeAjax({
          $elem: $(elem),
          url: this.urlFor("unfollow_" + type, id),
          type: "POST",
          success: function(response, textStatus) {
            if (textStatus === "success") return $(elem).replaceWith(followLink());
          },
          dataType: 'json'
        });
      };
      if (this.isSubscribed(id, type)) {
        return unfollowLink();
      } else {
        return followLink();
      }
    };

    DiscussionUtil.processEachMathAndCode = function(text, processor) {
      var $div, ESCAPED_BACKSLASH, ESCAPED_DOLLAR, RE_DISPLAYMATH, RE_INLINEMATH, cnt, codeArchive, processedText;
      codeArchive = [];
      RE_DISPLAYMATH = /^([^\$]*?)\$\$([^\$]*?)\$\$(.*)$/m;
      RE_INLINEMATH = /^([^\$]*?)\$([^\$]+?)\$(.*)$/m;
      ESCAPED_DOLLAR = '@@ESCAPED_D@@';
      ESCAPED_BACKSLASH = '@@ESCAPED_B@@';
      processedText = "";
      $div = $("<div>").html(text);
      $div.find("code").each(function(index, code) {
        codeArchive.push($(code).html());
        return $(code).html(codeArchive.length - 1);
      });
      text = $div.html();
      text = text.replace(/\\\$/g, ESCAPED_DOLLAR);
      while (true) {
        if (RE_INLINEMATH.test(text)) {
          text = text.replace(RE_INLINEMATH, function($0, $1, $2, $3) {
            processedText += $1 + processor("$" + $2 + "$", 'inline');
            return $3;
          });
        } else if (RE_DISPLAYMATH.test(text)) {
          text = text.replace(RE_DISPLAYMATH, function($0, $1, $2, $3) {
            processedText += $1 + processor("$$" + $2 + "$$", 'display');
            return $3;
          });
        } else {
          processedText += text;
          break;
        }
      }
      text = processedText;
      text = text.replace(new RegExp(ESCAPED_DOLLAR, 'g'), '\\$');
      text = text.replace(/\\\\\\\\/g, ESCAPED_BACKSLASH);
      text = text.replace(/\\begin\{([a-z]*\*?)\}([\s\S]*?)\\end\{\1\}/img, function($0, $1, $2) {
        return processor(("\\begin{" + $1 + "}") + $2 + ("\\end{" + $1 + "}"));
      });
      text = text.replace(new RegExp(ESCAPED_BACKSLASH, 'g'), '\\\\\\\\');
      $div = $("<div>").html(text);
      cnt = 0;
      $div.find("code").each(function(index, code) {
        $(code).html(processor(codeArchive[cnt], 'code'));
        return cnt += 1;
      });
      text = $div.html();
      return text;
    };

    DiscussionUtil.unescapeHighlightTag = function(text) {
      return text.replace(/\&lt\;highlight\&gt\;/g, "<span class='search-highlight'>").replace(/\&lt\;\/highlight\&gt\;/g, "</span>");
    };

    DiscussionUtil.stripHighlight = function(text) {
      return text.replace(/\&(amp\;)?lt\;highlight\&(amp\;)?gt\;/g, "").replace(/\&(amp\;)?lt\;\/highlight\&(amp\;)?gt\;/g, "");
    };

    DiscussionUtil.stripLatexHighlight = function(text) {
      return this.processEachMathAndCode(text, this.stripHighlight);
    };

    DiscussionUtil.markdownWithHighlight = function(text) {
      var converter;
      text = text.replace(/^\&gt\;/gm, ">");
      converter = Markdown.getMathCompatibleConverter();
      text = this.unescapeHighlightTag(this.stripLatexHighlight(converter.makeHtml(text)));
      return text.replace(/^>/gm, "&gt;");
    };

    DiscussionUtil.abbreviateString = function(text, minLength) {
      if (text.length < minLength) {
        return text;
      } else {
        while (minLength < text.length && text[minLength] !== ' ') {
          minLength++;
        }
        return text.substr(0, minLength) + '...';
      }
    };

    return DiscussionUtil;

  })();

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.DiscussionContentView = (function(_super) {

      __extends(DiscussionContentView, _super);

      function DiscussionContentView() {
        this.setWmdContent = __bind(this.setWmdContent, this);
        this.getWmdContent = __bind(this.getWmdContent, this);
        this.getWmdEditor = __bind(this.getWmdEditor, this);
        this.makeWmdEditor = __bind(this.makeWmdEditor, this);
        DiscussionContentView.__super__.constructor.apply(this, arguments);
      }

      DiscussionContentView.prototype.attrRenderer = {
        endorsed: function(endorsed) {
          var _ref;
          if (endorsed) {
            return this.$(".action-endorse").show().addClass("is-endorsed");
          } else {
            if ((_ref = this.model.get('ability')) != null ? _ref.can_endorse : void 0) {
              this.$(".action-endorse").show();
            } else {
              this.$(".action-endorse").hide();
            }
            return this.$(".action-endorse").removeClass("is-endorsed");
          }
        },
        closed: function(closed) {
          if (!this.$(".action-openclose").length) return;
          if (!this.$(".post-status-closed").length) return;
          if (closed) {
            this.$(".post-status-closed").show();
            this.$(".action-openclose").html(this.$(".action-openclose").html().replace("Close", "Open"));
            return this.$(".discussion-reply-new").hide();
          } else {
            this.$(".post-status-closed").hide();
            this.$(".action-openclose").html(this.$(".action-openclose").html().replace("Open", "Close"));
            return this.$(".discussion-reply-new").show();
          }
        },
        voted: function(voted) {},
        votes_point: function(votes_point) {},
        comments_count: function(comments_count) {},
        subscribed: function(subscribed) {
          if (subscribed) {
            return this.$(".dogear").addClass("is-followed");
          } else {
            return this.$(".dogear").removeClass("is-followed");
          }
        },
        ability: function(ability) {
          var action, selector, _ref, _results;
          _ref = this.abilityRenderer;
          _results = [];
          for (action in _ref) {
            selector = _ref[action];
            if (!ability[action]) {
              _results.push(selector.disable.apply(this));
            } else {
              _results.push(selector.enable.apply(this));
            }
          }
          return _results;
        }
      };

      DiscussionContentView.prototype.abilityRenderer = {
        editable: {
          enable: function() {
            return this.$(".action-edit").closest("li").show();
          },
          disable: function() {
            return this.$(".action-edit").closest("li").hide();
          }
        },
        can_delete: {
          enable: function() {
            return this.$(".action-delete").closest("li").show();
          },
          disable: function() {
            return this.$(".action-delete").closest("li").hide();
          }
        },
        can_endorse: {
          enable: function() {
            return this.$(".action-endorse").show().css("cursor", "auto");
          },
          disable: function() {
            this.$(".action-endorse").css("cursor", "default");
            if (!this.model.get('endorsed')) {
              return this.$(".action-endorse").hide();
            } else {
              return this.$(".action-endorse").show();
            }
          }
        },
        can_openclose: {
          enable: function() {
            return this.$(".action-openclose").closest("li").show();
          },
          disable: function() {
            return this.$(".action-openclose").closest("li").hide();
          }
        },
        can_set_is_sticky: {
          enable: function() {
            return this.$('.discussion-is-sticky').show();
          },
          disable: function() {
            return this.$('.discussion-is-sticky').hide();
          }
        }
      };

      DiscussionContentView.prototype.renderPartialAttrs = function() {
        var attr, value, _ref, _results;
        _ref = this.model.changedAttributes();
        _results = [];
        for (attr in _ref) {
          value = _ref[attr];
          if (this.attrRenderer[attr]) {
            _results.push(this.attrRenderer[attr].apply(this, [value]));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      DiscussionContentView.prototype.renderAttrs = function() {
        var attr, value, _ref, _results;
        _ref = this.model.attributes;
        _results = [];
        for (attr in _ref) {
          value = _ref[attr];
          if (this.attrRenderer[attr]) {
            _results.push(this.attrRenderer[attr].apply(this, [value]));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      DiscussionContentView.prototype.$ = function(selector) {
        return this.$local.find(selector);
      };

      DiscussionContentView.prototype.initLocal = function() {
        this.$local = this.$el.children(".local");
        if (!this.$local.length) this.$local = this.$el;
        return this.$delegateElement = this.$local;
      };

      DiscussionContentView.prototype.makeWmdEditor = function(cls_identifier) {
        if (!this.$el.find(".wmd-panel").length) {
          return DiscussionUtil.makeWmdEditor(this.$el, $.proxy(this.$, this), cls_identifier);
        }
      };

      DiscussionContentView.prototype.getWmdEditor = function(cls_identifier) {
        return DiscussionUtil.getWmdEditor(this.$el, $.proxy(this.$, this), cls_identifier);
      };

      DiscussionContentView.prototype.getWmdContent = function(cls_identifier) {
        return DiscussionUtil.getWmdContent(this.$el, $.proxy(this.$, this), cls_identifier);
      };

      DiscussionContentView.prototype.setWmdContent = function(cls_identifier, text) {
        return DiscussionUtil.setWmdContent(this.$el, $.proxy(this.$, this), cls_identifier, text);
      };

      DiscussionContentView.prototype.initialize = function() {
        this.initLocal();
        return this.model.bind('change', this.renderPartialAttrs, this);
      };

      return DiscussionContentView;

    })(Backbone.View);
  }

}).call(this);

(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.DiscussionThreadEditView = (function(_super) {

      __extends(DiscussionThreadEditView, _super);

      function DiscussionThreadEditView() {
        DiscussionThreadEditView.__super__.constructor.apply(this, arguments);
      }

      DiscussionThreadEditView.prototype.events = {
        "click .post-update": "update",
        "click .post-cancel": "cancel_edit"
      };

      DiscussionThreadEditView.prototype.$ = function(selector) {
        return this.$el.find(selector);
      };

      DiscussionThreadEditView.prototype.initialize = function() {
        return DiscussionThreadEditView.__super__.initialize.call(this);
      };

      DiscussionThreadEditView.prototype.render = function() {
        this.template = _.template($("#thread-edit-template").html());
        this.$el.html(this.template(this.model.toJSON()));
        this.delegateEvents();
        DiscussionUtil.makeWmdEditor(this.$el, $.proxy(this.$, this), "edit-post-body");
        this.$(".edit-post-tags").tagsInput(DiscussionUtil.tagsInputOptions());
        return this;
      };

      DiscussionThreadEditView.prototype.update = function(event) {
        return this.trigger("thread:update", event);
      };

      DiscussionThreadEditView.prototype.cancel_edit = function(event) {
        return this.trigger("thread:cancel_edit", event);
      };

      return DiscussionThreadEditView;

    })(Backbone.View);
  }

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.DiscussionThreadListView = (function(_super) {

      __extends(DiscussionThreadListView, _super);

      function DiscussionThreadListView() {
        this.retrieveFollowed = __bind(this.retrieveFollowed, this);
        this.toggleTopicDrop = __bind(this.toggleTopicDrop, this);
        this.threadRemoved = __bind(this.threadRemoved, this);
        this.threadSelected = __bind(this.threadSelected, this);
        this.renderThreadListItem = __bind(this.renderThreadListItem, this);
        this.renderThread = __bind(this.renderThread, this);
        this.renderThreads = __bind(this.renderThreads, this);
        this.updateSidebar = __bind(this.updateSidebar, this);
        this.addAndSelectThread = __bind(this.addAndSelectThread, this);
        this.reloadDisplayedCollection = __bind(this.reloadDisplayedCollection, this);
        DiscussionThreadListView.__super__.constructor.apply(this, arguments);
      }

      DiscussionThreadListView.prototype.events = {
        "click .search": "showSearch",
        "click .browse": "toggleTopicDrop",
        "keydown .post-search-field": "performSearch",
        "click .sort-bar a": "sortThreads",
        "click .browse-topic-drop-menu": "filterTopic",
        "click .browse-topic-drop-search-input": "ignoreClick",
        "click .post-list .list-item a": "threadSelected",
        "click .post-list .more-pages a": "loadMorePages",
        'keyup .browse-topic-drop-search-input': DiscussionFilter.filterDrop
      };

      DiscussionThreadListView.prototype.initialize = function() {
        var _this = this;
        this.displayedCollection = new Discussion(this.collection.models, {
          pages: this.collection.pages
        });
        this.collection.on("change", this.reloadDisplayedCollection);
        this.sortBy = "date";
        this.discussionIds = "";
        this.collection.on("reset", function(discussion) {
          var board;
          board = $(".current-board").html();
          _this.displayedCollection.current_page = discussion.current_page;
          _this.displayedCollection.pages = discussion.pages;
          return _this.displayedCollection.reset(discussion.models);
        });
        this.collection.on("add", this.addAndSelectThread);
        this.sidebar_padding = 10;
        this.sidebar_header_height = 87;
        this.boardName;
        this.template = _.template($("#thread-list-template").html());
        this.current_search = "";
        return this.mode = 'all';
      };

      DiscussionThreadListView.prototype.reloadDisplayedCollection = function(thread) {
        var active, content, current_el, thread_id;
        thread_id = thread.get('id');
        content = this.renderThread(thread);
        current_el = this.$("a[data-id=" + thread_id + "]");
        active = current_el.hasClass("active");
        current_el.replaceWith(content);
        if (active) return this.setActiveThread(thread_id);
      };

      DiscussionThreadListView.prototype.addAndSelectThread = function(thread) {
        var commentable, commentable_id,
          _this = this;
        commentable_id = thread.get("commentable_id");
        commentable = this.$(".board-name[data-discussion_id]").filter(function() {
          return $(this).data("discussion_id").id === commentable_id;
        });
        this.setTopicHack(commentable);
        return this.retrieveDiscussion(function() {
          return _this.trigger("thread:created", thread.get('id'));
        });
      };

      DiscussionThreadListView.prototype.updateSidebar = function() {
        var amount, discussionBody, discussionBottomOffset, discussionsBodyBottom, discussionsBodyTop, postListWrapper, scrollTop, sidebar, sidebarHeight, sidebarWidth, topOffset, windowHeight;
        scrollTop = $(window).scrollTop();
        windowHeight = $(window).height();
        discussionBody = $(".discussion-article");
        discussionsBodyTop = discussionBody[0] ? discussionBody.offset().top : void 0;
        discussionsBodyBottom = discussionsBodyTop + discussionBody.outerHeight();
        sidebar = $(".sidebar");
        if (scrollTop > discussionsBodyTop - this.sidebar_padding) {
          sidebar.addClass('fixed');
          sidebar.css('top', this.sidebar_padding);
        } else {
          sidebar.removeClass('fixed');
          sidebar.css('top', '0');
        }
        sidebarWidth = .31 * $(".discussion-body").width();
        sidebar.css('width', sidebarWidth + 'px');
        sidebarHeight = windowHeight - Math.max(discussionsBodyTop - scrollTop, this.sidebar_padding);
        topOffset = scrollTop + windowHeight;
        discussionBottomOffset = discussionsBodyBottom + this.sidebar_padding;
        amount = Math.max(topOffset - discussionBottomOffset, 0);
        sidebarHeight = sidebarHeight - this.sidebar_padding - amount;
        sidebarHeight = Math.min(sidebarHeight + 1, discussionBody.outerHeight());
        sidebar.css('height', sidebarHeight);
        postListWrapper = this.$('.post-list-wrapper');
        return postListWrapper.css('height', (sidebarHeight - this.sidebar_header_height - 4) + 'px');
      };

      DiscussionThreadListView.prototype.ignoreClick = function(event) {
        return event.stopPropagation();
      };

      DiscussionThreadListView.prototype.render = function() {
        this.timer = 0;
        this.$el.html(this.template());
        $(window).bind("scroll", this.updateSidebar);
        $(window).bind("resize", this.updateSidebar);
        this.displayedCollection.on("reset", this.renderThreads);
        this.displayedCollection.on("thread:remove", this.renderThreads);
        this.renderThreads();
        return this;
      };

      DiscussionThreadListView.prototype.renderThreads = function() {
        var content, rendered, thread, _i, _len, _ref;
        this.$(".post-list").html("");
        rendered = $("<div></div>");
        _ref = this.displayedCollection.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          thread = _ref[_i];
          content = this.renderThread(thread);
          rendered.append(content);
          content.wrap("<li class='list-item' data-id='\"" + (thread.get('id')) + "\"' />");
        }
        this.$(".post-list").html(rendered.html());
        this.renderMorePages();
        this.updateSidebar();
        return this.trigger("threads:rendered");
      };

      DiscussionThreadListView.prototype.renderMorePages = function() {
        if (this.displayedCollection.hasMorePages()) {
          return this.$(".post-list").append("<li class='more-pages'><a href='#'>Load more</a></li>");
        }
      };

      DiscussionThreadListView.prototype.loadMorePages = function(event) {
        var options;
        if (event) event.preventDefault();
        this.$(".more-pages").html('<div class="loading-animation"></div>');
        this.$(".more-pages").addClass("loading");
        options = {};
        switch (this.mode) {
          case 'search':
            options.search_text = this.current_search;
            break;
          case 'followed':
            options.user_id = window.user.id;
            break;
          case 'commentables':
            options.commentable_ids = this.discussionIds;
        }
        return this.collection.retrieveAnotherPage(this.mode, options, {
          sort_key: this.sortBy
        });
      };

      DiscussionThreadListView.prototype.renderThread = function(thread) {
        var content;
        content = $(_.template($("#thread-list-item-template").html())(thread.toJSON()));
        if (thread.get('subscribed')) content.addClass("followed");
        if (thread.get('endorsed')) content.addClass("resolved");
        if (thread.get('read')) content.addClass("read");
        return this.highlight(content);
      };

      DiscussionThreadListView.prototype.highlight = function(el) {
        return el.html(el.html().replace(/&lt;mark&gt;/g, "<mark>").replace(/&lt;\/mark&gt;/g, "</mark>"));
      };

      DiscussionThreadListView.prototype.renderThreadListItem = function(thread) {
        var view;
        view = new ThreadListItemView({
          model: thread
        });
        view.on("thread:selected", this.threadSelected);
        view.on("thread:removed", this.threadRemoved);
        view.render();
        return this.$(".post-list").append(view.el);
      };

      DiscussionThreadListView.prototype.threadSelected = function(e) {
        var thread_id;
        thread_id = $(e.target).closest("a").attr("data-id");
        this.setActiveThread(thread_id);
        this.trigger("thread:selected", thread_id);
        return false;
      };

      DiscussionThreadListView.prototype.threadRemoved = function(thread_id) {
        return this.trigger("thread:removed", thread_id);
      };

      DiscussionThreadListView.prototype.setActiveThread = function(thread_id) {
        this.$(".post-list a[data-id!='" + thread_id + "']").removeClass("active");
        return this.$(".post-list a[data-id='" + thread_id + "']").addClass("active");
      };

      DiscussionThreadListView.prototype.showSearch = function() {
        this.$(".browse").removeClass('is-dropped');
        this.hideTopicDrop();
        this.$(".search").addClass('is-open');
        this.$(".browse").removeClass('is-open');
        return setTimeout((function() {
          return this.$(".post-search-field").focus();
        }), 200);
      };

      DiscussionThreadListView.prototype.toggleTopicDrop = function(event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.current_search !== "") this.clearSearch();
        this.$(".search").removeClass('is-open');
        this.$(".browse").addClass('is-open');
        this.$(".browse").toggleClass('is-dropped');
        if (this.$(".browse").hasClass('is-dropped')) {
          this.$(".browse-topic-drop-menu-wrapper").show();
          $(".browse-topic-drop-search-input").focus();
          $("body").bind("click", this.toggleTopicDrop);
          return $("body").bind("keydown", this.setActiveItem);
        } else {
          return this.hideTopicDrop();
        }
      };

      DiscussionThreadListView.prototype.hideTopicDrop = function() {
        this.$(".browse-topic-drop-menu-wrapper").hide();
        $("body").unbind("click", this.toggleTopicDrop);
        return $("body").unbind("keydown", this.setActiveItem);
      };

      DiscussionThreadListView.prototype.setTopicHack = function(boardNameContainer) {
        var boardName, item;
        item = $(boardNameContainer).closest('a');
        boardName = item.find(".board-name").html();
        _.each(item.parents('ul').not('.browse-topic-drop-menu'), function(parent) {
          return boardName = $(parent).siblings('a').find('.board-name').html() + ' / ' + boardName;
        });
        return this.$(".current-board").html(this.fitName(boardName));
      };

      DiscussionThreadListView.prototype.setTopic = function(event) {
        var boardName, item;
        item = $(event.target).closest('a');
        boardName = item.find(".board-name").html();
        _.each(item.parents('ul').not('.browse-topic-drop-menu'), function(parent) {
          return boardName = $(parent).siblings('a').find('.board-name').html() + ' / ' + boardName;
        });
        return this.$(".current-board").html(this.fitName(boardName));
      };

      DiscussionThreadListView.prototype.setSelectedTopic = function(name) {
        return this.$(".current-board").html(this.fitName(name));
      };

      DiscussionThreadListView.prototype.getNameWidth = function(name) {
        var test, width;
        test = $("<div>");
        test.css({
          "font-size": this.$(".current-board").css('font-size'),
          opacity: 0,
          position: 'absolute',
          left: -1000,
          top: -1000
        });
        $("body").append(test);
        test.html(name);
        width = test.width();
        test.remove();
        return width;
      };

      DiscussionThreadListView.prototype.fitName = function(name) {
        var partialName, path, rawName, width, x;
        this.maxNameWidth = (this.$el.width() * .8) - 50;
        width = this.getNameWidth(name);
        if (width < this.maxNameWidth) return name;
        path = (function() {
          var _i, _len, _ref, _results;
          _ref = name.split("/");
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            x = _ref[_i];
            _results.push(x.replace(/^\s+|\s+$/g, ""));
          }
          return _results;
        })();
        while (path.length > 1) {
          path.shift();
          partialName = "…/" + path.join("/");
          if (this.getNameWidth(partialName) < this.maxNameWidth) {
            return partialName;
          }
        }
        rawName = path[0];
        name = "…/" + rawName;
        while (this.getNameWidth(name) > this.maxNameWidth) {
          rawName = rawName.slice(0, (rawName.length - 1));
          name = "…/" + rawName + "…";
        }
        return name;
      };

      DiscussionThreadListView.prototype.filterTopic = function(event) {
        var discussionId, discussionIds, item;
        if (this.current_search !== "") {
          this.setTopic(event);
          return this.clearSearch(this.filterTopic, event);
        } else {
          this.setTopic(event);
          item = $(event.target).closest('li');
          discussionId = item.find("span.board-name").data("discussion_id");
          if (discussionId === "#all") {
            this.discussionIds = "";
            this.$(".post-search-field").val("");
            return this.retrieveAllThreads();
          } else if (discussionId === "#following") {
            return this.retrieveFollowed(event);
          } else {
            discussionIds = _.map(item.find(".board-name[data-discussion_id]"), function(board) {
              return $(board).data("discussion_id").id;
            });
            return this.retrieveDiscussions(discussionIds);
          }
        }
      };

      DiscussionThreadListView.prototype.retrieveDiscussion = function(callback) {
        var url,
          _this = this;
        if (callback == null) callback = null;
        url = DiscussionUtil.urlFor("retrieve_discussion");
        return DiscussionUtil.safeAjax({
          url: url,
          type: "GET",
          success: function(response, textStatus) {
            _this.collection.current_page = response.page;
            _this.collection.pages = response.num_pages;
            _this.collection.reset(response.discussion_data);
            Content.loadContentInfos(response.annotated_content_info);
            _this.displayedCollection.reset(_this.collection.models);
            if (callback != null) return callback();
          }
        });
      };

      DiscussionThreadListView.prototype.retrieveDiscussions = function(discussion_ids) {
        this.discussionIds = discussion_ids.join(',');
        this.mode = 'commentables';
        return this.retrieveFirstPage();
      };

      DiscussionThreadListView.prototype.retrieveAllThreads = function() {
        this.mode = 'all';
        return this.retrieveFirstPage();
      };

      DiscussionThreadListView.prototype.retrieveFirstPage = function(event) {
        this.collection.current_page = 0;
        this.collection.reset();
        return this.loadMorePages(event);
      };

      DiscussionThreadListView.prototype.sortThreads = function(event) {
        this.$(".sort-bar a").removeClass("active");
        $(event.target).addClass("active");
        this.sortBy = $(event.target).data("sort");
        return this.retrieveFirstPage(event);
      };

      DiscussionThreadListView.prototype.performSearch = function(event) {
        var text;
        if (event.which === 13) {
          event.preventDefault();
          text = this.$(".post-search-field").val();
          return this.searchFor(text);
        }
      };

      DiscussionThreadListView.prototype.setAndSearchFor = function(text) {
        this.showSearch();
        this.$(".post-search-field").val(text);
        return this.searchFor(text);
      };

      DiscussionThreadListView.prototype.searchFor = function(text, callback, value) {
        var url,
          _this = this;
        this.mode = 'search';
        this.current_search = text;
        url = DiscussionUtil.urlFor("search");
        return DiscussionUtil.safeAjax({
          $elem: this.$(".post-search-field"),
          data: {
            text: text
          },
          url: url,
          type: "GET",
          $loading: $,
          loadingCallback: function() {
            return _this.$(".post-list").html('<li class="loading"><div class="loading-animation"></div></li>');
          },
          loadedCallback: function() {
            if (callback) return callback.apply(_this, [value]);
          },
          success: function(response, textStatus) {
            if (textStatus === 'success') {
              _this.collection.reset(response.discussion_data);
              Content.loadContentInfos(response.annotated_content_info);
              _this.collection.current_page = response.page;
              _this.collection.pages = response.num_pages;
              return _this.displayedCollection.reset(_this.collection.models);
            }
          }
        });
      };

      DiscussionThreadListView.prototype.clearSearch = function(callback, value) {
        this.$(".post-search-field").val("");
        return this.searchFor("", callback, value);
      };

      DiscussionThreadListView.prototype.setActiveItem = function(event) {
        var index, itemFromTop, itemTop, items, scrollTarget, scrollTop;
        if (event.which === 13) {
          $(".browse-topic-drop-menu-wrapper .focused").click();
          return;
        }
        if (event.which !== 40 && event.which !== 38) return;
        event.preventDefault();
        items = $.makeArray($(".browse-topic-drop-menu-wrapper a").not(".hidden"));
        index = items.indexOf($('.browse-topic-drop-menu-wrapper .focused')[0]);
        if (event.which === 40) index = Math.min(index + 1, items.length - 1);
        if (event.which === 38) index = Math.max(index - 1, 0);
        $(".browse-topic-drop-menu-wrapper .focused").removeClass("focused");
        $(items[index]).addClass("focused");
        itemTop = $(items[index]).parent().offset().top;
        scrollTop = $(".browse-topic-drop-menu").scrollTop();
        itemFromTop = $(".browse-topic-drop-menu").offset().top - itemTop;
        scrollTarget = Math.min(scrollTop - itemFromTop, scrollTop);
        scrollTarget = Math.max(scrollTop - itemFromTop - $(".browse-topic-drop-menu").height() + $(items[index]).height(), scrollTarget);
        return $(".browse-topic-drop-menu").scrollTop(scrollTarget);
      };

      DiscussionThreadListView.prototype.retrieveFollowed = function(event) {
        this.mode = 'followed';
        return this.retrieveFirstPage(event);
      };

      return DiscussionThreadListView;

    })(Backbone.View);
  }

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.DiscussionThreadProfileView = (function(_super) {
      var expanded;

      __extends(DiscussionThreadProfileView, _super);

      function DiscussionThreadProfileView() {
        this.addComment = __bind(this.addComment, this);
        this.renderResponse = __bind(this.renderResponse, this);
        this.updateModelDetails = __bind(this.updateModelDetails, this);
        this.renderVoted = __bind(this.renderVoted, this);
        DiscussionThreadProfileView.__super__.constructor.apply(this, arguments);
      }

      expanded = false;

      DiscussionThreadProfileView.prototype.events = {
        "click .discussion-vote": "toggleVote"
      };

      DiscussionThreadProfileView.prototype.initialize = function() {
        DiscussionThreadProfileView.__super__.initialize.call(this);
        return this.model.on("change", this.updateModelDetails);
      };

      DiscussionThreadProfileView.prototype.render = function() {
        var params;
        if (!this.model.has('abbreviatedBody')) this.abbreviateBody();
        params = $.extend(this.model.toJSON(), {
          expanded: this.expanded,
          permalink: this.model.urlFor('retrieve')
        });
        if (!this.model.get('anonymous')) {
          params = $.extend(params, {
            user: {
              username: this.model.username,
              user_url: this.model.user_url
            }
          });
        }
        this.template = _.template($("#thread-show-template").html());
        this.$el.html(this.template(params));
        this.initLocal();
        this.delegateEvents();
        this.renderDogear();
        this.renderVoted();
        this.renderAttrs();
        this.$("span.timeago").timeago();
        if (this.expanded) this.renderResponses();
        return this;
      };

      DiscussionThreadProfileView.prototype.renderDogear = function() {
        if (window.user.following(this.model)) {
          return this.$(".dogear").addClass("is-followed");
        }
      };

      DiscussionThreadProfileView.prototype.renderVoted = function() {
        if (window.user.voted(this.model)) {
          return this.$("[data-role=discussion-vote]").addClass("is-cast");
        } else {
          return this.$("[data-role=discussion-vote]").removeClass("is-cast");
        }
      };

      DiscussionThreadProfileView.prototype.updateModelDetails = function() {
        this.renderVoted();
        return this.$("[data-role=discussion-vote] .votes-count-number").html(this.model.get("votes")["up_count"]);
      };

      DiscussionThreadProfileView.prototype.processMarkdown = function() {
        var element;
        element = this.$(".post-body");
        return element.html(DiscussionUtil.markdownWithHighlight(element.html()));
      };

      DiscussionThreadProfileView.prototype.renderResponses = function() {
        var _this = this;
        return DiscussionUtil.safeAjax({
          url: "/courses/" + $$course_id + "/discussion/forum/" + (this.model.get('commentable_id')) + "/threads/" + this.model.id,
          $loading: this.$el,
          success: function(data, textStatus, xhr) {
            var comments;
            _this.$el.find(".loading").remove();
            Content.loadContentInfos(data['annotated_content_info']);
            comments = new Comments(data['content']['children']);
            comments.each(_this.renderResponse);
            return _this.trigger("thread:responses:rendered");
          }
        });
      };

      DiscussionThreadProfileView.prototype.renderResponse = function(response) {
        var view;
        response.set('thread', this.model);
        view = new ThreadResponseView({
          model: response
        });
        view.on("comment:add", this.addComment);
        view.render();
        return this.$el.find(".responses").append(view.el);
      };

      DiscussionThreadProfileView.prototype.addComment = function() {
        return this.model.comment();
      };

      DiscussionThreadProfileView.prototype.toggleVote = function(event) {
        event.preventDefault();
        if (window.user.voted(this.model)) {
          return this.unvote();
        } else {
          return this.vote();
        }
      };

      DiscussionThreadProfileView.prototype.vote = function() {
        var url,
          _this = this;
        window.user.vote(this.model);
        url = this.model.urlFor("upvote");
        return DiscussionUtil.safeAjax({
          $elem: this.$(".discussion-vote"),
          url: url,
          type: "POST",
          success: function(response, textStatus) {
            if (textStatus === 'success') return _this.model.set(response);
          }
        });
      };

      DiscussionThreadProfileView.prototype.unvote = function() {
        var url,
          _this = this;
        window.user.unvote(this.model);
        url = this.model.urlFor("unvote");
        return DiscussionUtil.safeAjax({
          $elem: this.$(".discussion-vote"),
          url: url,
          type: "POST",
          success: function(response, textStatus) {
            if (textStatus === 'success') return _this.model.set(response);
          }
        });
      };

      DiscussionThreadProfileView.prototype.abbreviateBody = function() {
        var abbreviated;
        abbreviated = DiscussionUtil.abbreviateString(this.model.get('body'), 140);
        return this.model.set('abbreviatedBody', abbreviated);
      };

      return DiscussionThreadProfileView;

    })(DiscussionContentView);
  }

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.DiscussionThreadShowView = (function(_super) {

      __extends(DiscussionThreadShowView, _super);

      function DiscussionThreadShowView() {
        this.updateModelDetails = __bind(this.updateModelDetails, this);
        this.renderHeaderButtons = __bind(this.renderHeaderButtons, this);
        DiscussionThreadShowView.__super__.constructor.apply(this, arguments);
      }

      DiscussionThreadShowView.prototype.events = {
        "click .discussion-vote": "toggleVote",
        "click .action-follow": "toggleFollowing",
        "click .action-edit": "edit",
        "click .action-delete": "delete",
        "click .action-openclose": "toggleClosed",
        "click .discussion-is-sticky": "toggleIsSticky"
      };

      DiscussionThreadShowView.prototype.$ = function(selector) {
        return this.$el.find(selector);
      };

      DiscussionThreadShowView.prototype.initialize = function() {
        DiscussionThreadShowView.__super__.initialize.call(this);
        return this.model.on("change", this.updateModelDetails);
      };

      DiscussionThreadShowView.prototype.renderTemplate = function() {
        var converter, text;
        this.template = _.template($("#thread-show-template").html());
        converter = Markdown.getMathCompatibleConverter();
        text = converter.makeHtml(this.model.get("body"));
        this.model.set("body", text);
        return this.template(this.model.toJSON());
      };

      DiscussionThreadShowView.prototype.processMarkdown = function() {
        var element;
        element = this.$(".post-body");
        return element.html(DiscussionUtil.markdownWithHighlight(element.html()));
      };

      DiscussionThreadShowView.prototype.render = function() {
        this.$el.html(this.renderTemplate());
        this.delegateEvents();
        this.renderDogear();
        this.renderHeaderButtons();
        this.renderAttrs();
        this.$("span.timeago").timeago();
        this.highlight(this.$(".post-body"));
        this.highlight(this.$("h1,h3"));
        return this;
      };

      DiscussionThreadShowView.prototype.renderDogear = function() {
        if (window.user.following(this.model)) {
          return this.$(".dogear").addClass("is-followed");
        }
      };

      DiscussionThreadShowView.prototype.renderHeaderButtons = function() {
        if (window.user.voted(this.model)) {
          this.$("[data-role=discussion-vote]").addClass("is-cast");
        } else {
          this.$("[data-role=discussion-vote]").removeClass("is-cast");
        }
        if (this.model.get("is_sticky")) {
          return this.$("[data-role=discussion-is-sticky]").addClass("is-cast");
        } else {
          return this.$("[data-role=discussion-is-sticky]").removeClass("is-cast");
        }
      };

      DiscussionThreadShowView.prototype.updateModelDetails = function() {
        this.renderHeaderButtons();
        return this.$("[data-role=discussion-vote] .votes-count-number").html(this.model.get("votes")["up_count"]);
      };

      DiscussionThreadShowView.prototype.toggleVote = function(event) {
        event.preventDefault();
        if (window.user.voted(this.model)) {
          return this.unvote();
        } else {
          return this.vote();
        }
      };

      DiscussionThreadShowView.prototype.toggleIsSticky = function(event) {
        var url, url_key,
          _this = this;
        event.preventDefault();
        if (this.model.get("is_sticky")) {
          url_key = "unsticky";
        } else {
          url_key = "sticky";
        }
        url = this.model.urlFor(url_key);
        return DiscussionUtil.safeAjax({
          $elem: this.$('.discussion-is-sticky'),
          url: url,
          type: "POST",
          success: function(response, textStatus) {
            if (textStatus === 'success') {
              _this.model.set(response, {
                silent: true
              });
              return _this.model.is_sticky();
            }
          }
        });
      };

      DiscussionThreadShowView.prototype.toggleFollowing = function(event) {
        var $elem, url;
        $elem = $(event.target);
        url = null;
        if (!this.model.get('subscribed')) {
          this.model.follow();
          url = this.model.urlFor("follow");
        } else {
          this.model.unfollow();
          url = this.model.urlFor("unfollow");
        }
        return DiscussionUtil.safeAjax({
          $elem: $elem,
          url: url,
          type: "POST"
        });
      };

      DiscussionThreadShowView.prototype.vote = function() {
        var url,
          _this = this;
        window.user.vote(this.model);
        url = this.model.urlFor("upvote");
        return DiscussionUtil.safeAjax({
          $elem: this.$(".discussion-vote"),
          url: url,
          type: "POST",
          success: function(response, textStatus) {
            if (textStatus === 'success') {
              return _this.model.set(response, {
                silent: true
              });
            }
          }
        });
      };

      DiscussionThreadShowView.prototype.unvote = function() {
        var url,
          _this = this;
        window.user.unvote(this.model);
        url = this.model.urlFor("unvote");
        return DiscussionUtil.safeAjax({
          $elem: this.$(".discussion-vote"),
          url: url,
          type: "POST",
          success: function(response, textStatus) {
            if (textStatus === 'success') {
              return _this.model.set(response, {
                silent: true
              });
            }
          }
        });
      };

      DiscussionThreadShowView.prototype.edit = function(event) {
        return this.trigger("thread:edit", event);
      };

      DiscussionThreadShowView.prototype["delete"] = function(event) {
        return this.trigger("thread:delete", event);
      };

      DiscussionThreadShowView.prototype.toggleClosed = function(event) {
        var $elem, closed, data, url,
          _this = this;
        $elem = $(event.target);
        url = this.model.urlFor('close');
        closed = this.model.get('closed');
        data = {
          closed: !closed
        };
        return DiscussionUtil.safeAjax({
          $elem: $elem,
          url: url,
          data: data,
          type: "POST",
          success: function(response, textStatus) {
            _this.model.set('closed', !closed);
            return _this.model.set('ability', response.ability);
          }
        });
      };

      DiscussionThreadShowView.prototype.toggleEndorse = function(event) {
        var $elem, data, endorsed, url,
          _this = this;
        $elem = $(event.target);
        url = this.model.urlFor('endorse');
        endorsed = this.model.get('endorsed');
        data = {
          endorsed: !endorsed
        };
        return DiscussionUtil.safeAjax({
          $elem: $elem,
          url: url,
          data: data,
          type: "POST",
          success: function(response, textStatus) {
            return _this.model.set('endorsed', !endorsed);
          }
        });
      };

      DiscussionThreadShowView.prototype.highlight = function(el) {
        if (el.html()) {
          return el.html(el.html().replace(/&lt;mark&gt;/g, "<mark>").replace(/&lt;\/mark&gt;/g, "</mark>"));
        }
      };

      return DiscussionThreadShowView;

    })(DiscussionContentView);
  }

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.DiscussionThreadView = (function(_super) {

      __extends(DiscussionThreadView, _super);

      function DiscussionThreadView() {
        this["delete"] = __bind(this["delete"], this);
        this.cancelEdit = __bind(this.cancelEdit, this);
        this.update = __bind(this.update, this);
        this.edit = __bind(this.edit, this);
        this.endorseThread = __bind(this.endorseThread, this);
        this.addComment = __bind(this.addComment, this);
        this.renderResponse = __bind(this.renderResponse, this);
        DiscussionThreadView.__super__.constructor.apply(this, arguments);
      }

      DiscussionThreadView.prototype.events = {
        "click .discussion-submit-post": "submitComment"
      };

      DiscussionThreadView.prototype.$ = function(selector) {
        return this.$el.find(selector);
      };

      DiscussionThreadView.prototype.initialize = function() {
        DiscussionThreadView.__super__.initialize.call(this);
        return this.createShowView();
      };

      DiscussionThreadView.prototype.renderTemplate = function() {
        this.template = _.template($("#thread-template").html());
        return this.template(this.model.toJSON());
      };

      DiscussionThreadView.prototype.render = function() {
        this.$el.html(this.renderTemplate());
        this.$el.find(".loading").hide();
        this.delegateEvents();
        this.renderShowView();
        this.renderAttrs();
        this.$("span.timeago").timeago();
        this.makeWmdEditor("reply-body");
        this.renderResponses();
        return this;
      };

      DiscussionThreadView.prototype.cleanup = function() {
        if (this.responsesRequest != null) return this.responsesRequest.abort();
      };

      DiscussionThreadView.prototype.renderResponses = function() {
        var _this = this;
        setTimeout(function() {
          return _this.$el.find(".loading").show();
        }, 200);
        return this.responsesRequest = DiscussionUtil.safeAjax({
          url: DiscussionUtil.urlFor('retrieve_single_thread', this.model.id),
          success: function(data, textStatus, xhr) {
            var comments;
            _this.responsesRequest = null;
            _this.$el.find(".loading").remove();
            Content.loadContentInfos(data['annotated_content_info']);
            comments = new Comments(data['content']['children']);
            comments.each(_this.renderResponse);
            return _this.trigger("thread:responses:rendered");
          }
        });
      };

      DiscussionThreadView.prototype.renderResponse = function(response) {
        var view;
        response.set('thread', this.model);
        view = new ThreadResponseView({
          model: response
        });
        view.on("comment:add", this.addComment);
        view.on("comment:endorse", this.endorseThread);
        view.render();
        this.$el.find(".responses").append(view.el);
        return view.afterInsert();
      };

      DiscussionThreadView.prototype.addComment = function() {
        return this.model.comment();
      };

      DiscussionThreadView.prototype.endorseThread = function(endorsed) {
        var is_endorsed;
        is_endorsed = this.$el.find(".is-endorsed").length;
        return this.model.set('endorsed', is_endorsed);
      };

      DiscussionThreadView.prototype.submitComment = function(event) {
        var body, comment, url,
          _this = this;
        event.preventDefault();
        url = this.model.urlFor('reply');
        body = this.getWmdContent("reply-body");
        if (!body.trim().length) return;
        this.setWmdContent("reply-body", "");
        comment = new Comment({
          body: body,
          created_at: (new Date()).toISOString(),
          username: window.user.get("username"),
          votes: {
            up_count: 0
          },
          endorsed: false,
          user_id: window.user.get("id")
        });
        comment.set('thread', this.model.get('thread'));
        this.renderResponse(comment);
        this.model.addComment();
        return DiscussionUtil.safeAjax({
          $elem: $(event.target),
          url: url,
          type: "POST",
          dataType: 'json',
          data: {
            body: body
          },
          success: function(data, textStatus) {
            comment.updateInfo(data.annotated_content_info);
            return comment.set(data.content);
          }
        });
      };

      DiscussionThreadView.prototype.edit = function(event) {
        this.createEditView();
        return this.renderEditView();
      };

      DiscussionThreadView.prototype.update = function(event) {
        var newBody, newTitle, url,
          _this = this;
        newTitle = this.editView.$(".edit-post-title").val();
        newBody = this.editView.$(".edit-post-body textarea").val();
        url = DiscussionUtil.urlFor('update_thread', this.model.id);
        return DiscussionUtil.safeAjax({
          $elem: $(event.target),
          $loading: event ? $(event.target) : void 0,
          url: url,
          type: "POST",
          dataType: 'json',
          async: false,
          data: {
            title: newTitle,
            body: newBody
          },
          error: DiscussionUtil.formErrorHandler(this.$(".edit-post-form-errors")),
          success: function(response, textStatus) {
            _this.editView.$(".edit-post-title").val("").attr("prev-text", "");
            _this.editView.$(".edit-post-body textarea").val("").attr("prev-text", "");
            _this.editView.$(".edit-post-tags").val("");
            _this.editView.$(".edit-post-tags").importTags("");
            _this.editView.$(".wmd-preview p").html("");
            _this.model.set({
              title: newTitle,
              body: newBody,
              tags: response.content.tags
            });
            _this.createShowView();
            return _this.renderShowView();
          }
        });
      };

      DiscussionThreadView.prototype.createEditView = function() {
        if (this.showView != null) {
          this.showView.undelegateEvents();
          this.showView.$el.empty();
          this.showView = null;
        }
        this.editView = new DiscussionThreadEditView({
          model: this.model
        });
        this.editView.bind("thread:update", this.update);
        return this.editView.bind("thread:cancel_edit", this.cancelEdit);
      };

      DiscussionThreadView.prototype.renderSubView = function(view) {
        view.setElement(this.$('.thread-content-wrapper'));
        view.render();
        return view.delegateEvents();
      };

      DiscussionThreadView.prototype.renderEditView = function() {
        return this.renderSubView(this.editView);
      };

      DiscussionThreadView.prototype.createShowView = function() {
        if (this.editView != null) {
          this.editView.undelegateEvents();
          this.editView.$el.empty();
          this.editView = null;
        }
        this.showView = new DiscussionThreadShowView({
          model: this.model
        });
        this.showView.bind("thread:delete", this["delete"]);
        return this.showView.bind("thread:edit", this.edit);
      };

      DiscussionThreadView.prototype.renderShowView = function() {
        return this.renderSubView(this.showView);
      };

      DiscussionThreadView.prototype.cancelEdit = function(event) {
        event.preventDefault();
        this.createShowView();
        return this.renderShowView();
      };

      DiscussionThreadView.prototype["delete"] = function(event) {
        var $elem, url,
          _this = this;
        url = this.model.urlFor('delete');
        if (!this.model.can('can_delete')) return;
        if (!confirm("Are you sure to delete thread \"" + (this.model.get('title')) + "\"?")) {
          return;
        }
        this.model.remove();
        this.showView.undelegateEvents();
        this.undelegateEvents();
        this.$el.empty();
        $elem = $(event.target);
        return DiscussionUtil.safeAjax({
          $elem: $elem,
          url: url,
          type: "POST",
          success: function(response, textStatus) {}
        });
      };

      return DiscussionThreadView;

    })(DiscussionContentView);
  }

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.DiscussionUserProfileView = (function(_super) {

      __extends(DiscussionUserProfileView, _super);

      function DiscussionUserProfileView() {
        this.renderThreads = __bind(this.renderThreads, this);
        DiscussionUserProfileView.__super__.constructor.apply(this, arguments);
      }

      DiscussionUserProfileView.prototype.initialize = function(options) {
        return this.renderThreads(this.$el, this.collection);
      };

      DiscussionUserProfileView.prototype.renderThreads = function($elem, threads) {
        var rendered, thread, threadView, _i, _j, _len, _len2, _ref, _ref2, _results;
        this.discussion = new Discussion();
        this.discussion.reset(threads, {
          silent: false
        });
        this.threadviews = [];
        _ref = this.discussion.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          thread = _ref[_i];
          rendered = $("<article class='discussion-thread' id='" + thread.id + "''></article>");
          $elem.append(rendered);
          threadView = new DiscussionThreadProfileView({
            model: thread
          });
          this.threadviews.push(threadView);
        }
        _ref2 = this.threadviews;
        _results = [];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          threadView = _ref2[_j];
          threadView.setElement(this.$("#" + threadView.model.id));
          _results.push(threadView.render());
        }
        return _results;
      };

      return DiscussionUserProfileView;

    })(Backbone.View);
  }

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.NewPostView = (function(_super) {

      __extends(NewPostView, _super);

      function NewPostView() {
        this.hideTopicDropdown = __bind(this.hideTopicDropdown, this);
        NewPostView.__super__.constructor.apply(this, arguments);
      }

      NewPostView.prototype.initialize = function() {
        this.dropdownButton = this.$(".topic_dropdown_button");
        this.topicMenu = this.$(".topic_menu_wrapper");
        this.menuOpen = this.dropdownButton.hasClass('dropped');
        this.topicId = this.$(".topic").first().data("discussion_id");
        this.topicText = this.getFullTopicName(this.$(".topic").first());
        this.maxNameWidth = 100;
        this.setSelectedTopic();
        DiscussionUtil.makeWmdEditor(this.$el, $.proxy(this.$, this), "new-post-body");
        return this.$(".new-post-tags").tagsInput(DiscussionUtil.tagsInputOptions());
      };

      NewPostView.prototype.events = {
        "submit .new-post-form": "createPost",
        "click  .topic_dropdown_button": "toggleTopicDropdown",
        "click  .topic_menu_wrapper": "setTopic",
        "click  .topic_menu_search": "ignoreClick",
        "keyup .form-topic-drop-search-input": DiscussionFilter.filterDrop
      };

      NewPostView.prototype.ignoreClick = function(event) {
        return event.stopPropagation();
      };

      NewPostView.prototype.toggleTopicDropdown = function(event) {
        event.stopPropagation();
        if (this.menuOpen) {
          return this.hideTopicDropdown();
        } else {
          return this.showTopicDropdown();
        }
      };

      NewPostView.prototype.showTopicDropdown = function() {
        this.menuOpen = true;
        this.dropdownButton.addClass('dropped');
        this.topicMenu.show();
        $(".form-topic-drop-search-input").focus();
        $("body").bind("keydown", this.setActiveItem);
        $("body").bind("click", this.hideTopicDropdown);
        return this.maxNameWidth = this.dropdownButton.width() * 0.9;
      };

      NewPostView.prototype.hideTopicDropdown = function() {
        this.menuOpen = false;
        this.dropdownButton.removeClass('dropped');
        this.topicMenu.hide();
        $("body").unbind("keydown", this.setActiveItem);
        return $("body").unbind("click", this.hideTopicDropdown);
      };

      NewPostView.prototype.setTopic = function(event) {
        var $target;
        $target = $(event.target);
        if ($target.data('discussion_id')) {
          this.topicText = $target.html();
          this.topicText = this.getFullTopicName($target);
          this.topicId = $target.data('discussion_id');
          return this.setSelectedTopic();
        }
      };

      NewPostView.prototype.setSelectedTopic = function() {
        return this.dropdownButton.html(this.fitName(this.topicText) + ' <span class="drop-arrow">▾</span>');
      };

      NewPostView.prototype.getFullTopicName = function(topicElement) {
        var name;
        name = topicElement.html();
        topicElement.parents('ul').not('.topic_menu').each(function() {
          return name = $(this).siblings('a').html() + ' / ' + name;
        });
        return name;
      };

      NewPostView.prototype.getNameWidth = function(name) {
        var test, width;
        test = $("<div>");
        test.css({
          "font-size": this.dropdownButton.css('font-size'),
          opacity: 0,
          position: 'absolute',
          left: -1000,
          top: -1000
        });
        $("body").append(test);
        test.html(name);
        width = test.width();
        test.remove();
        return width;
      };

      NewPostView.prototype.fitName = function(name) {
        var partialName, path, rawName, width, x;
        width = this.getNameWidth(name);
        if (width < this.maxNameWidth) return name;
        path = (function() {
          var _i, _len, _ref, _results;
          _ref = name.split("/");
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            x = _ref[_i];
            _results.push(x.replace(/^\s+|\s+$/g, ""));
          }
          return _results;
        })();
        while (path.length > 1) {
          path.shift();
          partialName = "... / " + path.join(" / ");
          if (this.getNameWidth(partialName) < this.maxNameWidth) {
            return partialName;
          }
        }
        rawName = path[0];
        name = "... / " + rawName;
        while (this.getNameWidth(name) > this.maxNameWidth) {
          rawName = rawName.slice(0, (rawName.length - 1));
          name = "... / " + rawName + " ...";
        }
        return name;
      };

      NewPostView.prototype.createPost = function(event) {
        var anonymous, anonymous_to_peers, body, follow, tags, title, url,
          _this = this;
        event.preventDefault();
        this.$(".new-post-title").css("border-color", "").css("border-width", "").next(".alert").remove();
        title = this.$(".new-post-title").val();
        if (title.length === 0) {
          this.$(".new-post-title").css("border-color", "#a94442").css("border-width", "2px").after("<div class='alert alert-danger' role='alert'>Please add a title.</div>");
          return;
        }
        body = this.$(".new-post-body").find(".wmd-input").val();
        tags = this.$(".new-post-tags").val();
        anonymous = false || this.$("input.discussion-anonymous").is(":checked");
        anonymous_to_peers = false || this.$("input.discussion-anonymous-to-peers").is(":checked");
        follow = false || this.$("input.discussion-follow").is(":checked");
        url = DiscussionUtil.urlFor('create_thread', this.topicId);
        return DiscussionUtil.safeAjax({
          $elem: $(event.target),
          $loading: event ? $(event.target) : void 0,
          url: url,
          type: "POST",
          dataType: 'json',
          async: false,
          data: {
            title: title,
            body: body,
            tags: tags,
            anonymous: anonymous,
            anonymous_to_peers: anonymous_to_peers,
            auto_subscribe: follow
          },
          error: DiscussionUtil.formErrorHandler(this.$(".new-post-form-errors")),
          success: function(response, textStatus) {
            var thread;
            thread = new Thread(response['content']);
            DiscussionUtil.clearFormErrors(_this.$(".new-post-form-errors"));
            _this.$el.hide();
            _this.$(".new-post-title").val("").attr("prev-text", "");
            _this.$(".new-post-body textarea").val("").attr("prev-text", "");
            _this.$(".new-post-tags").val("");
            _this.$(".new-post-tags").importTags("");
            _this.$(".wmd-preview p").html("");
            return _this.collection.add(thread);
          }
        });
      };

      NewPostView.prototype.setActiveItem = function(event) {
        var index, itemFromTop, itemTop, items, scrollTarget, scrollTop;
        if (event.which === 13) {
          $(".topic_menu_wrapper .focused").click();
          return;
        }
        if (event.which !== 40 && event.which !== 38) return;
        event.preventDefault();
        items = $.makeArray($(".topic_menu_wrapper a").not(".hidden"));
        index = items.indexOf($('.topic_menu_wrapper .focused')[0]);
        if (event.which === 40) index = Math.min(index + 1, items.length - 1);
        if (event.which === 38) index = Math.max(index - 1, 0);
        $(".topic_menu_wrapper .focused").removeClass("focused");
        $(items[index]).addClass("focused");
        itemTop = $(items[index]).parent().offset().top;
        scrollTop = $(".topic_menu").scrollTop();
        itemFromTop = $(".topic_menu").offset().top - itemTop;
        scrollTarget = Math.min(scrollTop - itemFromTop, scrollTop);
        scrollTarget = Math.max(scrollTop - itemFromTop - $(".topic_menu").height() + $(items[index]).height() + 20, scrollTarget);
        return $(".topic_menu").scrollTop(scrollTarget);
      };

      return NewPostView;

    })(Backbone.View);
  }

}).call(this);

(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.ResponseCommentShowView = (function(_super) {

      __extends(ResponseCommentShowView, _super);

      function ResponseCommentShowView() {
        ResponseCommentShowView.__super__.constructor.apply(this, arguments);
      }

      ResponseCommentShowView.prototype.tagName = "li";

      ResponseCommentShowView.prototype.render = function() {
        var converter, params, text;
        this.template = _.template($("#response-comment-show-template").html());
        converter = Markdown.getMathCompatibleConverter();
        text = converter.makeHtml(this.model.get("body"));
        this.model.set("body", text);
        params = this.model.toJSON();
        this.$el.html(this.template(params));
        this.initLocal();
        this.delegateEvents();
        this.renderAttrs();
        this.markAsStaff();
        this.$el.find(".timeago").timeago();
        this.addReplyLink();
        return this;
      };

      ResponseCommentShowView.prototype.processMarkdown = function() {
        var element;
        element = this.$(".response-body");
        return element.html(DiscussionUtil.markdownWithHighlight(element.html()));
      };

      ResponseCommentShowView.prototype.addReplyLink = function() {
        var html, name, p, _ref;
        if (this.model.hasOwnProperty('parent')) {
          name = (_ref = this.model.parent.get('username')) != null ? _ref : "anonymous";
          html = "<a href='#comment_" + this.model.parent.id + "'>@" + name + "</a>:  ";
          p = this.$('.response-body p:first');
          return p.prepend(html);
        }
      };

      ResponseCommentShowView.prototype.markAsStaff = function() {
        if (DiscussionUtil.isStaff(this.model.get("user_id"))) {
          return this.$el.find("a.profile-link").after('<span class="staff-label">staff</span>');
        } else if (DiscussionUtil.isTA(this.model.get("user_id"))) {
          return this.$el.find("a.profile-link").after('<span class="community-ta-label">Community&nbsp;&nbsp;TA</span>');
        }
      };

      return ResponseCommentShowView;

    })(DiscussionContentView);
  }

}).call(this);

(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.ResponseCommentView = (function(_super) {

      __extends(ResponseCommentView, _super);

      function ResponseCommentView() {
        ResponseCommentView.__super__.constructor.apply(this, arguments);
      }

      ResponseCommentView.prototype.tagName = "li";

      ResponseCommentView.prototype.$ = function(selector) {
        return this.$el.find(selector);
      };

      ResponseCommentView.prototype.initialize = function() {
        ResponseCommentView.__super__.initialize.call(this);
        return this.createShowView();
      };

      ResponseCommentView.prototype.render = function() {
        this.renderShowView();
        return this;
      };

      ResponseCommentView.prototype.createShowView = function() {
        if (this.editView != null) {
          this.editView.undelegateEvents();
          this.editView.$el.empty();
          this.editView = null;
        }
        return this.showView = new ResponseCommentShowView({
          model: this.model
        });
      };

      ResponseCommentView.prototype.renderSubView = function(view) {
        view.setElement(this.$el);
        view.render();
        return view.delegateEvents();
      };

      ResponseCommentView.prototype.renderShowView = function() {
        return this.renderSubView(this.showView);
      };

      return ResponseCommentView;

    })(DiscussionContentView);
  }

}).call(this);

(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.ThreadResponseEditView = (function(_super) {

      __extends(ThreadResponseEditView, _super);

      function ThreadResponseEditView() {
        ThreadResponseEditView.__super__.constructor.apply(this, arguments);
      }

      ThreadResponseEditView.prototype.events = {
        "click .post-update": "update",
        "click .post-cancel": "cancel_edit"
      };

      ThreadResponseEditView.prototype.$ = function(selector) {
        return this.$el.find(selector);
      };

      ThreadResponseEditView.prototype.initialize = function() {
        return ThreadResponseEditView.__super__.initialize.call(this);
      };

      ThreadResponseEditView.prototype.render = function() {
        this.template = _.template($("#thread-response-edit-template").html());
        this.$el.html(this.template(this.model.toJSON()));
        this.delegateEvents();
        DiscussionUtil.makeWmdEditor(this.$el, $.proxy(this.$, this), "edit-post-body");
        return this;
      };

      ThreadResponseEditView.prototype.update = function(event) {
        return this.trigger("response:update", event);
      };

      ThreadResponseEditView.prototype.cancel_edit = function(event) {
        return this.trigger("response:cancel_edit", event);
      };

      return ThreadResponseEditView;

    })(Backbone.View);
  }

}).call(this);

(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.ThreadResponseShowView = (function(_super) {

      __extends(ThreadResponseShowView, _super);

      function ThreadResponseShowView() {
        ThreadResponseShowView.__super__.constructor.apply(this, arguments);
      }

      ThreadResponseShowView.prototype.events = {
        "click .vote-btn": "toggleVote",
        "click .action-endorse": "toggleEndorse",
        "click .action-delete": "delete",
        "click .action-edit": "edit"
      };

      ThreadResponseShowView.prototype.$ = function(selector) {
        return this.$el.find(selector);
      };

      ThreadResponseShowView.prototype.initialize = function() {
        ThreadResponseShowView.__super__.initialize.call(this);
        return this.model.on("change", this.updateModelDetails);
      };

      ThreadResponseShowView.prototype.renderTemplate = function() {
        var converter, text;
        this.template = _.template($("#thread-response-show-template").html());
        converter = Markdown.getMathCompatibleConverter();
        text = converter.makeHtml(this.model.get("body"));
        this.model.set("body", text);
        return this.template(this.model.toJSON());
      };

      ThreadResponseShowView.prototype.render = function() {
        this.$el.html(this.renderTemplate());
        this.delegateEvents();
        if (window.user.voted(this.model)) this.$(".vote-btn").addClass("is-cast");
        this.renderAttrs();
        this.$el.find(".posted-details").timeago();
        this.markAsStaff();
        return this;
      };

      ThreadResponseShowView.prototype.processMarkdown = function() {
        var element;
        element = this.$(".response-body");
        return element.html(DiscussionUtil.markdownWithHighlight(element.html()));
      };

      ThreadResponseShowView.prototype.markAsStaff = function() {
        if (DiscussionUtil.isStaff(this.model.get("user_id"))) {
          this.$el.addClass("staff");
          return this.$el.prepend('<div class="staff-banner">staff</div>');
        } else if (DiscussionUtil.isTA(this.model.get("user_id"))) {
          this.$el.addClass("community-ta");
          return this.$el.prepend('<div class="community-ta-banner">Community TA</div>');
        }
      };

      ThreadResponseShowView.prototype.toggleVote = function(event) {
        event.preventDefault();
        this.$(".vote-btn").toggleClass("is-cast");
        if (this.$(".vote-btn").hasClass("is-cast")) {
          return this.vote();
        } else {
          return this.unvote();
        }
      };

      ThreadResponseShowView.prototype.vote = function() {
        var url,
          _this = this;
        url = this.model.urlFor("upvote");
        this.$(".votes-count-number").html(parseInt(this.$(".votes-count-number").html()) + 1);
        return DiscussionUtil.safeAjax({
          $elem: this.$(".discussion-vote"),
          url: url,
          type: "POST",
          success: function(response, textStatus) {
            if (textStatus === 'success') return _this.model.set(response);
          }
        });
      };

      ThreadResponseShowView.prototype.unvote = function() {
        var url,
          _this = this;
        url = this.model.urlFor("unvote");
        this.$(".votes-count-number").html(parseInt(this.$(".votes-count-number").html()) - 1);
        return DiscussionUtil.safeAjax({
          $elem: this.$(".discussion-vote"),
          url: url,
          type: "POST",
          success: function(response, textStatus) {
            if (textStatus === 'success') return _this.model.set(response);
          }
        });
      };

      ThreadResponseShowView.prototype.edit = function(event) {
        return this.trigger("response:edit", event);
      };

      ThreadResponseShowView.prototype["delete"] = function(event) {
        return this.trigger("response:delete", event);
      };

      ThreadResponseShowView.prototype.toggleEndorse = function(event) {
        var $elem, data, endorsed, url;
        event.preventDefault();
        if (!this.model.can('can_endorse')) return;
        $elem = $(event.target);
        url = this.model.urlFor('endorse');
        endorsed = this.model.get('endorsed');
        data = {
          endorsed: !endorsed
        };
        this.model.set('endorsed', !endorsed);
        this.trigger("comment:endorse", !endorsed);
        return DiscussionUtil.safeAjax({
          $elem: $elem,
          url: url,
          data: data,
          type: "POST"
        });
      };

      return ThreadResponseShowView;

    })(DiscussionContentView);
  }

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (typeof Backbone !== "undefined" && Backbone !== null) {
    this.ThreadResponseView = (function(_super) {

      __extends(ThreadResponseView, _super);

      function ThreadResponseView() {
        this.update = __bind(this.update, this);
        this.edit = __bind(this.edit, this);
        this.cancelEdit = __bind(this.cancelEdit, this);
        this["delete"] = __bind(this["delete"], this);
        this.renderComment = __bind(this.renderComment, this);
        ThreadResponseView.__super__.constructor.apply(this, arguments);
      }

      ThreadResponseView.prototype.tagName = "li";

      ThreadResponseView.prototype.events = {
        "click .discussion-submit-comment": "submitComment",
        "focus .wmd-input": "showEditorChrome"
      };

      ThreadResponseView.prototype.$ = function(selector) {
        return this.$el.find(selector);
      };

      ThreadResponseView.prototype.initialize = function() {
        return this.createShowView();
      };

      ThreadResponseView.prototype.renderTemplate = function() {
        var templateData, _ref;
        this.template = _.template($("#thread-response-template").html());
        templateData = this.model.toJSON();
        templateData.wmdId = (_ref = this.model.id) != null ? _ref : (new Date()).getTime();
        return this.template(templateData);
      };

      ThreadResponseView.prototype.render = function() {
        this.$el.html(this.renderTemplate());
        this.delegateEvents();
        this.renderShowView();
        this.renderAttrs();
        this.renderComments();
        return this;
      };

      ThreadResponseView.prototype.afterInsert = function() {
        this.makeWmdEditor("comment-body");
        return this.hideEditorChrome();
      };

      ThreadResponseView.prototype.hideEditorChrome = function() {
        this.$('.wmd-button-row').hide();
        this.$('.wmd-preview').hide();
        this.$('.wmd-input').css({
          height: '35px',
          padding: '5px'
        });
        return this.$('.comment-post-control').hide();
      };

      ThreadResponseView.prototype.showEditorChrome = function() {
        this.$('.wmd-button-row').show();
        this.$('.wmd-preview').show();
        this.$('.comment-post-control').show();
        return this.$('.wmd-input').css({
          height: '125px',
          padding: '10px'
        });
      };

      ThreadResponseView.prototype.renderComments = function() {
        var collectComments, comments,
          _this = this;
        comments = new Comments();
        comments.comparator = function(comment) {
          return comment.get('created_at');
        };
        collectComments = function(comment) {
          var children;
          comments.add(comment);
          children = new Comments(comment.get('children'));
          return children.each(function(child) {
            child.parent = comment;
            return collectComments(child);
          });
        };
        this.model.get('comments').each(collectComments);
        return comments.each(function(comment) {
          return _this.renderComment(comment, false, null);
        });
      };

      ThreadResponseView.prototype.renderComment = function(comment) {
        var view;
        comment.set('thread', this.model.get('thread'));
        view = new ResponseCommentView({
          model: comment
        });
        view.render();
        this.$el.find(".comments .new-comment").before(view.el);
        return view;
      };

      ThreadResponseView.prototype.submitComment = function(event) {
        var body, comment, url, view;
        event.preventDefault();
        url = this.model.urlFor('reply');
        body = this.getWmdContent("comment-body");
        if (!body.trim().length) return;
        this.setWmdContent("comment-body", "");
        comment = new Comment({
          body: body,
          created_at: (new Date()).toISOString(),
          username: window.user.get("username"),
          user_id: window.user.get("id"),
          id: "unsaved"
        });
        view = this.renderComment(comment);
        this.hideEditorChrome();
        this.trigger("comment:add", comment);
        return DiscussionUtil.safeAjax({
          $elem: $(event.target),
          url: url,
          type: "POST",
          dataType: 'json',
          data: {
            body: body
          },
          success: function(response, textStatus) {
            comment.set(response.content);
            return view.render();
          }
        });
      };

      ThreadResponseView.prototype["delete"] = function(event) {
        var $elem, url,
          _this = this;
        event.preventDefault();
        if (!this.model.can('can_delete')) return;
        if (!confirm("Are you sure to delete this response? ")) return;
        url = this.model.urlFor('delete');
        this.model.remove();
        this.$el.remove();
        $elem = $(event.target);
        return DiscussionUtil.safeAjax({
          $elem: $elem,
          url: url,
          type: "POST",
          success: function(response, textStatus) {}
        });
      };

      ThreadResponseView.prototype.createEditView = function() {
        if (this.showView != null) {
          this.showView.undelegateEvents();
          this.showView.$el.empty();
          this.showView = null;
        }
        this.editView = new ThreadResponseEditView({
          model: this.model
        });
        this.editView.bind("response:update", this.update);
        return this.editView.bind("response:cancel_edit", this.cancelEdit);
      };

      ThreadResponseView.prototype.renderSubView = function(view) {
        view.setElement(this.$('.discussion-response'));
        view.render();
        return view.delegateEvents();
      };

      ThreadResponseView.prototype.renderEditView = function() {
        return this.renderSubView(this.editView);
      };

      ThreadResponseView.prototype.hideCommentForm = function() {
        return this.$('.comment-form').closest('li').hide();
      };

      ThreadResponseView.prototype.showCommentForm = function() {
        return this.$('.comment-form').closest('li').show();
      };

      ThreadResponseView.prototype.createShowView = function() {
        if (this.editView != null) {
          this.editView.undelegateEvents();
          this.editView.$el.empty();
          this.editView = null;
        }
        this.showView = new ThreadResponseShowView({
          model: this.model
        });
        this.showView.bind("response:delete", this["delete"]);
        return this.showView.bind("response:edit", this.edit);
      };

      ThreadResponseView.prototype.renderShowView = function() {
        return this.renderSubView(this.showView);
      };

      ThreadResponseView.prototype.cancelEdit = function(event) {
        event.preventDefault();
        this.createShowView();
        this.renderShowView();
        return this.showCommentForm();
      };

      ThreadResponseView.prototype.edit = function(event) {
        this.createEditView();
        this.renderEditView();
        return this.hideCommentForm();
      };

      ThreadResponseView.prototype.update = function(event) {
        var newBody, url,
          _this = this;
        newBody = this.editView.$(".edit-post-body textarea").val();
        url = DiscussionUtil.urlFor('update_comment', this.model.id);
        return DiscussionUtil.safeAjax({
          $elem: $(event.target),
          $loading: event ? $(event.target) : void 0,
          url: url,
          type: "POST",
          dataType: 'json',
          async: false,
          data: {
            body: newBody
          },
          error: DiscussionUtil.formErrorHandler(this.$(".edit-post-form-errors")),
          success: function(response, textStatus) {
            _this.editView.$(".edit-post-body textarea").val("").attr("prev-text", "");
            _this.editView.$(".wmd-preview p").html("");
            _this.model.set({
              body: newBody
            });
            _this.createShowView();
            _this.renderShowView();
            return _this.showCommentForm();
          }
        });
      };

      return ThreadResponseView;

    })(DiscussionContentView);
  }

}).call(this);
