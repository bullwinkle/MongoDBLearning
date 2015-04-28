(function() {

  this.JavascriptLoader = (function() {

    function JavascriptLoader() {}

    JavascriptLoader.executeModuleScripts = function(el, callback) {
      var callbackCalled, completed, completionHandlerGenerator, completionHandlerGeneratorIE, i, loaded, placeholders,
        _this = this;
      if (callback == null) callback = null;
      placeholders = el.find(".script_placeholder");
      if (placeholders.length === 0) {
        if (callback != null) callback();
        return;
      }
      completed = (function() {
        var _ref, _results;
        _results = [];
        for (i = 1, _ref = placeholders.length; 1 <= _ref ? i <= _ref : i >= _ref; 1 <= _ref ? i++ : i--) {
          _results.push(false);
        }
        return _results;
      })();
      callbackCalled = false;
      completionHandlerGeneratorIE = function(index) {
        return function() {
          if (this.readyState === 'complete' || this.readyState === 'loaded') {
            return completionHandlerGenerator(index)();
          }
        };
      };
      completionHandlerGenerator = function(index) {
        return function() {
          var allComplete, flag, _i, _len;
          allComplete = true;
          completed[index] = true;
          for (_i = 0, _len = completed.length; _i < _len; _i++) {
            flag = completed[_i];
            if (!flag) {
              allComplete = false;
              break;
            }
          }
          if (allComplete && !callbackCalled) {
            callbackCalled = true;
            if (callback != null) return callback();
          }
        };
      };
      loaded = {};
      return placeholders.each(function(index, placeholder) {
        var s, src;
        src = $(placeholder).attr("data-src");
        if (!(src in loaded)) {
          loaded[src] = true;
          s = document.createElement('script');
          s.setAttribute('src', src);
          s.setAttribute('type', "text/javascript");
          s.onload = completionHandlerGenerator(index);
          s.onreadystatechange = completionHandlerGeneratorIE(index);
          $('head')[0].appendChild(s);
        } else {
          completionHandlerGenerator(index)();
        }
        return $(placeholder).remove();
      });
    };

    return JavascriptLoader;

  })();

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.SelfAssessment = (function() {

    function SelfAssessment(element) {
      this.reset = __bind(this.reset, this);
      this.save_hint = __bind(this.save_hint, this);
      this.save_assessment = __bind(this.save_assessment, this);
      this.save_answer = __bind(this.save_answer, this);
      this.rebind = __bind(this.rebind, this);      this.el = $(element).find('section.self-assessment');
      this.id = this.el.data('id');
      this.ajax_url = this.el.data('ajax-url');
      this.state = this.el.data('state');
      this.allow_reset = this.el.data('allow_reset');
      this.errors_area = this.$('.error');
      this.answer_area = this.$('textarea.answer');
      this.rubric_wrapper = this.$('.rubric-wrapper');
      this.hint_wrapper = this.$('.hint-wrapper');
      this.message_wrapper = this.$('.message-wrapper');
      this.submit_button = this.$('.submit-button');
      this.reset_button = this.$('.reset-button');
      this.reset_button.click(this.reset);
      this.find_assessment_elements();
      this.find_hint_elements();
      this.rebind();
    }

    SelfAssessment.prototype.$ = function(selector) {
      return $(selector, this.el);
    };

    SelfAssessment.prototype.rebind = function() {
      this.submit_button.unbind('click');
      this.submit_button.show();
      this.reset_button.hide();
      this.hint_area.attr('disabled', false);
      if (this.state === 'initial') {
        this.answer_area.attr("disabled", false);
        this.submit_button.prop('value', 'Submit');
        return this.submit_button.click(this.save_answer);
      } else if (this.state === 'assessing') {
        this.answer_area.attr("disabled", true);
        this.submit_button.prop('value', 'Submit assessment');
        return this.submit_button.click(this.save_assessment);
      } else if (this.state === 'request_hint') {
        this.answer_area.attr("disabled", true);
        this.submit_button.prop('value', 'Submit hint');
        return this.submit_button.click(this.save_hint);
      } else if (this.state === 'done') {
        this.answer_area.attr("disabled", true);
        this.hint_area.attr('disabled', true);
        this.submit_button.hide();
        if (this.allow_reset) {
          return this.reset_button.show();
        } else {
          return this.reset_button.hide();
        }
      }
    };

    SelfAssessment.prototype.find_assessment_elements = function() {
      return this.assessment = this.$('select.assessment');
    };

    SelfAssessment.prototype.find_hint_elements = function() {
      return this.hint_area = this.$('textarea.hint');
    };

    SelfAssessment.prototype.save_answer = function(event) {
      var data,
        _this = this;
      event.preventDefault();
      if (this.state === 'initial') {
        data = {
          'student_answer': this.answer_area.val()
        };
        return $.postWithPrefix("" + this.ajax_url + "/save_answer", data, function(response) {
          if (response.success) {
            _this.rubric_wrapper.html(response.rubric_html);
            _this.state = 'assessing';
            _this.find_assessment_elements();
            return _this.rebind();
          } else {
            return _this.errors_area.html(response.error);
          }
        });
      } else {
        return this.errors_area.html('Problem state got out of sync.  Try reloading the page.');
      }
    };

    SelfAssessment.prototype.save_assessment = function(event) {
      var data,
        _this = this;
      event.preventDefault();
      if (this.state === 'assessing') {
        data = {
          'assessment': this.assessment.find(':selected').text()
        };
        return $.postWithPrefix("" + this.ajax_url + "/save_assessment", data, function(response) {
          if (response.success) {
            _this.state = response.state;
            if (_this.state === 'request_hint') {
              _this.hint_wrapper.html(response.hint_html);
              _this.find_hint_elements();
            } else if (_this.state === 'done') {
              _this.message_wrapper.html(response.message_html);
              _this.allow_reset = response.allow_reset;
            }
            return _this.rebind();
          } else {
            return _this.errors_area.html(response.error);
          }
        });
      } else {
        return this.errors_area.html('Problem state got out of sync.  Try reloading the page.');
      }
    };

    SelfAssessment.prototype.save_hint = function(event) {
      var data,
        _this = this;
      event.preventDefault();
      if (this.state === 'request_hint') {
        data = {
          'hint': this.hint_area.val()
        };
        return $.postWithPrefix("" + this.ajax_url + "/save_hint", data, function(response) {
          if (response.success) {
            _this.message_wrapper.html(response.message_html);
            _this.state = 'done';
            _this.allow_reset = response.allow_reset;
            return _this.rebind();
          } else {
            return _this.errors_area.html(response.error);
          }
        });
      } else {
        return this.errors_area.html('Problem state got out of sync.  Try reloading the page.');
      }
    };

    SelfAssessment.prototype.reset = function(event) {
      var _this = this;
      event.preventDefault();
      if (this.state === 'done') {
        return $.postWithPrefix("" + this.ajax_url + "/reset", {}, function(response) {
          if (response.success) {
            _this.answer_area.val('');
            _this.rubric_wrapper.html('');
            _this.hint_wrapper.html('');
            _this.message_wrapper.html('');
            _this.state = 'initial';
            _this.rebind();
            return _this.reset_button.hide();
          } else {
            return _this.errors_area.html(response.error);
          }
        });
      } else {
        return this.errors_area.html('Problem state got out of sync.  Try reloading the page.');
      }
    };

    return SelfAssessment;

  })();

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.Sequence = (function() {

    function Sequence(element) {
      this.previous = __bind(this.previous, this);
      this.next = __bind(this.next, this);
      this.goto = __bind(this.goto, this);
      this.toggleArrows = __bind(this.toggleArrows, this);
      this.updateProgress = __bind(this.updateProgress, this);      this.el = $(element).find('.sequence');
      this.contents = this.$('.seq_contents');
      this.num_contents = this.contents.length;
      this.id = this.el.data('id');
      this.modx_url = this.el.data('course_modx_root');
      this.prev_section_url = this.el.data('prev_section_url');
      this.next_section_url = this.el.data('next_section_url');
      this.initProgress();
      this.bind();
      this.render(parseInt(this.el.data('position')));
    }

    Sequence.prototype.$ = function(selector) {
      return $(selector, this.el);
    };

    Sequence.prototype.bind = function() {
      return this.$('#sequence-list a').click(this.goto);
    };

    Sequence.prototype.initProgress = function() {
      return this.progressTable = {};
    };

    Sequence.prototype.hookUpProgressEvent = function() {
      return $('.problems-wrapper').bind('progressChanged', this.updateProgress);
    };

    Sequence.prototype.mergeProgress = function(p1, p2) {
      var w1, w2;
      if (p1 === "NA") return p2;
      if (p2 === "NA") return p1;
      if (p1 === "done" && p2 === "done") return "done";
      w1 = p1 === "done" || p1 === "in_progress";
      w2 = p2 === "done" || p2 === "in_progress";
      if (w1 || w2) return "in_progress";
      return "none";
    };

    Sequence.prototype.updateProgress = function() {
      var new_progress, _this;
      new_progress = "NA";
      _this = this;
      $('.problems-wrapper').each(function(index) {
        var progress;
        progress = $(this).attr('progress');
        return new_progress = _this.mergeProgress(progress, new_progress);
      });
      this.progressTable[this.position] = new_progress;
      return this.setProgress(new_progress, this.link_for(this.position));
    };

    Sequence.prototype.setProgress = function(progress, element) {
      element.removeClass('progress-none').removeClass('progress-some').removeClass('progress-done');
      switch (progress) {
        case 'none':
          return element.addClass('progress-none');
        case 'in_progress':
          return element.addClass('progress-some');
        case 'done':
          return element.addClass('progress-done');
      }
    };

    Sequence.prototype.toggleArrows = function() {
      this.$('.sequence-nav-buttons a').unbind('click');
      if (this.position === 1 && this.prev_section_url === "None") {
        this.$('.sequence-nav-buttons .prev a').addClass('disabled');
      } else {
        this.$('.sequence-nav-buttons .prev a').removeClass('disabled').click(this.previous);
      }
      if (this.position === this.contents.length && this.next_section_url === "None") {
        return this.$('.sequence-nav-buttons .next a').addClass('disabled');
      } else {
        return this.$('.sequence-nav-buttons .next a').removeClass('disabled').click(this.next);
      }
    };

    Sequence.prototype.render = function(new_position) {
      var modx_full_url, sequence_links;
      if (this.position !== new_position) {
        if (this.position !== void 0 && new_position > 0 && new_position <= this.num_contents) {
          this.mark_visited(this.position);
          modx_full_url = this.modx_url + '/' + this.id + '/goto_position';
          $.postWithPrefix(modx_full_url, {
            position: new_position
          });
        }
        this.mark_active(new_position);
        this.$('#seq_content').html(this.contents.eq(new_position - 1).text());
        XModule.loadModules('display', this.$('#seq_content'));
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "seq_content"]);
        window.update_schematics();
        if (new_position <= 0) {
          this.position = new_position = 1;
          window.location.href = this.prev_section_url;
        } else if (new_position > this.num_contents) {
          this.position = new_position = this.num_contents;
          window.location.href = this.next_section_url;
        } else {
          this.position = new_position;
          this.toggleArrows();
          sequence_links = this.$('#seq_content a.seqnav');
          sequence_links.click(this.goto);
          Logger.track_vertical_event("view", {});
        }
        return this.hookUpProgressEvent();
      }
    };

    Sequence.prototype.goto = function(event) {
      var new_position;
      event.preventDefault();
      if ($(event.target).hasClass('seqnav')) {
        new_position = $(event.target).attr('href');
      } else {
        new_position = $(event.target).data('element');
      }
      if ((1 <= new_position) && (new_position <= this.num_contents)) {
        if (window.player != null) {
          Logger.track_vertical_event("video unload", {
            "time_elapsed_in_seconds": parseInt(window.player.getCurrentTime())
          });
          window.player = null;
        }
        if (window.queuePollerID) {
          window.clearTimeout(window.queuePollerID);
          delete window.queuePollerID;
        }
        return this.render(new_position);
      } else {
        return alert('Sequence error! Cannot navigate to tab ' + new_position + 'in the current SequenceModule. Please contact the course staff.');
      }
    };

    Sequence.prototype.next = function(event) {
      var new_position;
      event.preventDefault();
      new_position = this.position + 1;
      if (window.player != null) {
        Logger.track_vertical_event("video unload", {
          "time_elapsed_in_seconds": parseInt(window.player.getCurrentTime())
        });
        window.player = null;
      }
      return this.render(new_position);
    };

    Sequence.prototype.previous = function(event) {
      var new_position;
      event.preventDefault();
      new_position = this.position - 1;
      if (window.player != null) {
        Logger.track_vertical_event("video unload", {
          "time_elapsed_in_seconds": parseInt(window.player.getCurrentTime())
        });
        window.player = null;
      }
      return this.render(new_position);
    };

    Sequence.prototype.link_for = function(position) {
      return this.$("#sequence-list a[data-element=" + position + "]");
    };

    Sequence.prototype.mark_visited = function(position) {
      var element;
      element = this.link_for(position);
      return element.removeClass("inactive").removeClass("active").addClass("visited");
    };

    Sequence.prototype.mark_active = function(position) {
      var element;
      element = this.link_for(position);
      return element.removeClass("inactive").removeClass("visited").addClass("active");
    };

    return Sequence;

  })();

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.SimpleMongoWebShell = (function() {

    function SimpleMongoWebShell(element) {
      this.status = __bind(this.status, this);
      this.doInit = __bind(this.doInit, this);
      this.disableButtons = __bind(this.disableButtons, this);
      this.displayInitMsg = __bind(this.displayInitMsg, this);
      this.initialize = __bind(this.initialize, this);
      this.setupShell = __bind(this.setupShell, this);
      this.bind = __bind(this.bind, this);
      this.$ = __bind(this.$, this);      this.el = $(element);
      this.bind();
      this.setupShell();
    }

    SimpleMongoWebShell.prototype.$ = function(selector) {
      return $(selector, this.el);
    };

    SimpleMongoWebShell.prototype.bind = function() {
      this.initURL = this.el.data('init-url');
      this.ivsStatus = this.$('.status-ivs');
      this.resetButton = this.$('.button-reset');
      this.resetButton.off('click', this.initialize);
      return this.resetButton.on('click', this.initialize);
    };

    SimpleMongoWebShell.prototype.setupShell = function() {
      var shellElem,
        _this = this;
      shellElem = this.$('.web-shell');
      mongo.util.enableConsoleProtection();
      this.shell = new mongo.Shell(shellElem, shellElem.attr('id'), true);
      return mongo.request.createMWSResource([this.shell], function(data) {
        setInterval(function() {
          return mongo.request.keepAlive(data.res_id);
        }, 30000);
        return _this.doInit('Initializing...', function() {
          _this.shell.attachInputHandler(data.res_id);
          _this.shell.clear();
          return _this.displayInitMsg();
        });
      });
    };

    SimpleMongoWebShell.prototype.initialize = function(event) {
      var _this = this;
      event.preventDefault();
      return this.doInit('Resetting...', function() {
        _this.shell.clear();
        return _this.displayInitMsg();
      });
    };

    SimpleMongoWebShell.prototype.displayInitMsg = function() {
      return this.shell.insertResponseLine('MongoDB Web Shell: Please treat this like any other shell. \nHit enter after every command.');
    };

    SimpleMongoWebShell.prototype.disableButtons = function(disabled) {
      return this.resetButton.prop('disabled', disabled);
    };

    SimpleMongoWebShell.prototype.doInit = function(msg, callback) {
      var data, initialization,
        _this = this;
      this.disableButtons(true);
      this.status('<span class="indicator processing"></span> ' + msg);
      this.shell.enableInput(false);
      data = {
        'course_id': this.courseID,
        'problem_id': this.location
      };
      initialization = $.post("" + this.initURL, data, null, 'html');
      initialization.done(function(response) {
        _this.shell.enableInput(true);
        _this.status('');
        callback();
        return _this.disableButtons(false);
      });
      return initialization.fail(function(xhr, status, error) {
        _this.shell.enableInput(true);
        console.log('xhr.status = ' + xhr.status);
        if (xhr.status === 429) {
          _this.status('Reset failed because of too many requests. Please wait, and try again later.');
        } else {
          _this.status('Reset failed. Please press the reset button to try again.');
        }
        return _this.disableButtons(false);
      });
    };

    SimpleMongoWebShell.prototype.status = function(msg) {
      return this.ivsStatus.html(msg);
    };

    return SimpleMongoWebShell;

  })();

}).call(this);

(function() {

  this.Time = (function() {

    function Time() {}

    Time.format = function(time) {
      var hours, minutes, pad, seconds;
      pad = function(number) {
        if (number < 10) {
          return "0" + number;
        } else {
          return number;
        }
      };
      seconds = Math.floor(time);
      minutes = Math.floor(seconds / 60);
      hours = Math.floor(minutes / 60);
      seconds = seconds % 60;
      minutes = minutes % 60;
      if (hours) {
        return "" + hours + ":" + (pad(minutes)) + ":" + (pad(seconds % 60));
      } else {
        return "" + minutes + ":" + (pad(seconds % 60));
      }
    };

    Time.convert = function(time, oldSpeed, newSpeed) {
      return (time * oldSpeed / newSpeed).toFixed(3);
    };

    return Time;

  })();

}).call(this);

/////////////////////////////////////////////////////////////////////////////
//
//  Simple image input 
//
////////////////////////////////////////////////////////////////////////////////

// click on image, return coordinates
// put a dot at location of click, on imag

// window.image_input_click = function(id,event){

function image_input_click(id,event){
    iidiv = document.getElementById("imageinput_"+id);
    pos_x = event.offsetX?(event.offsetX):event.pageX-iidiv.offsetLeft;
    pos_y = event.offsetY?(event.offsetY):event.pageY-iidiv.offsetTop;
    result = "[" + pos_x + "," + pos_y + "]";
    cx = (pos_x-15) +"px";
    cy = (pos_y-15)  +"px" ;
    // alert(result);
    document.getElementById("cross_"+id).style.left = cx;
    document.getElementById("cross_"+id).style.top = cy;
    document.getElementById("cross_"+id).style.visibility = "visible" ;
    document.getElementById("input_"+id).value =result;
}

var SequenceNav = function($element) {
    var _this = this;
    var $element = $element;
    var $wrapper = $element.find('.sequence-list-wrapper');
    var $list = $element.find('#sequence-list');
    var $arrows = $element.find('.sequence-nav-buttons');
    var maxScroll = $list.width() - $wrapper.width() + 20;
    var $leftShadow = $('<div class="left-shadow"></div>');
    var $rightShadow = $('<div class="right-shadow"></div>');
    var $body = $('body');
    var listOrigin;
    var mouseOrigin;

    var startDrag = function(e) {
	updateWidths();
	mouseOrigin = e.pageX;
	listOrigin = $list.position().left;
	$body.css('-webkit-user-select', 'none');
	$body.bind('mousemove', moveDrag);
	$body.bind('mouseup', stopDrag);
    };

    var moveDrag = function(e) {
	var offset = e.pageX - mouseOrigin;
	var targetLeft = clamp(listOrigin + offset, -maxScroll, 0);

	updateHorizontalPosition(targetLeft);

	setShadows(targetLeft);
    };

    var stopDrag = function(e) {
	$body.css('-webkit-user-select', 'auto');
	$body.unbind('mousemove', moveDrag);
	$body.unbind('mouseup', stopDrag);
    };

    var setShadows = function(left) {
	var left = left || $list.position().left;
	var padding = 30;

	var leftPercent = clamp(-left / padding, 0, 1);
	$leftShadow.css('opacity', leftPercent);

	var rightPercent = clamp((maxScroll + left) / padding, 0, 1);
	$rightShadow.css('opacity', rightPercent);
    };

    var clamp = function(val, min, max) {
	if(val > max) return max;
	if(val < min) return min;
	return val;
    };

    var updateWidths = function(e) {
	maxScroll = $list.width() - $wrapper.width() + 20;
	var targetLeft = clamp($list.position().left, -maxScroll, 0);
	updateHorizontalPosition(targetLeft);
	setShadows(targetLeft);
    };

    var updateHorizontalPosition = function(left) {
	$list.css({
	    'left': left + 'px'
	});
    };

    var checkPosition = function(e) {
	var $active = $element.find('.active');
	if(!$active[0]) {
	    return;
	}
	if($active.position().left + $active.width() > $wrapper.width() - $list.position().left) {
	    $list.animate({
		'left': (-$active.position().left + $wrapper.width() - $active.width() - 10) + 'px'
	    }, {
		step: setShadows
	    });
	} else if($active.position().left < -$list.position().left) {
	    $list.animate({
		'left': (-$active.position().left + 10) + 'px'
	    }, {
		step: setShadows
	    });
	}
    };

    $wrapper.append($leftShadow).append($rightShadow);
    setShadows(0);
    $wrapper.bind('mousedown', startDrag);
    $arrows.bind('click', checkPosition);
    $(window).bind('resize', updateWidths);
    setTimeout(function() {
	checkPosition();
    }, 200);
};

(function() {

  this.Collapsible = (function() {

    function Collapsible() {}

    Collapsible.setCollapsibles = function(el) {
      /*
          el: container
      */      el.find('.longform').hide();
      el.find('.shortform').append('<a href="#" class="full">See full output</a>');
      el.find('.collapsible header + section').hide();
      el.find('.full').click(Collapsible.toggleFull);
      return el.find('.collapsible header a').click(Collapsible.toggleHint);
    };

    Collapsible.toggleFull = function(event) {
      var new_text;
      event.preventDefault();
      $(event.target).parent().siblings().slideToggle();
      $(event.target).parent().parent().toggleClass('open');
      if ($(event.target).text() === 'See full output') {
        new_text = 'Hide output';
      } else {
        new_text = 'See full ouput';
      }
      return $(event.target).text(new_text);
    };

    Collapsible.toggleHint = function(event) {
      event.preventDefault();
      $(event.target).parent().siblings().slideToggle();
      return $(event.target).parent().parent().toggleClass('open');
    };

    return Collapsible;

  }).call(this);

}).call(this);

(function() {

  this.Conditional = (function() {

    function Conditional(element, callerElId) {
      var dependencies;
      this.el = $(element).find('.conditional-wrapper');
      this.callerElId = callerElId;
      if (callerElId !== void 0) {
        dependencies = this.el.data('depends');
        if ((typeof dependencies === 'string') && (dependencies.length > 0) && (dependencies.indexOf(callerElId) === -1)) {
          return;
        }
      }
      this.url = this.el.data('url');
      this.render(element);
    }

    Conditional.prototype.render = function(element) {
      var _this = this;
      return $.postWithPrefix("" + this.url + "/conditional_get", function(response) {
        var i, parentEl, parentId, _i, _len, _ref;
        _this.el.html('');
        _ref = response.html;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _this.el.append(i);
        }
        parentEl = $(element).parent();
        parentId = parentEl.attr('id');
        if (response.message === false) {
          if (parentId.indexOf('vert') === 0) {
            parentEl.hide();
          } else {
            $(element).hide();
          }
        } else {
          if (parentId.indexOf('vert') === 0) {
            parentEl.show();
          } else {
            $(element).show();
          }
        }
        return XModule.loadModules('display', $('.conditional-wrapper'));
      });
    };

    return Conditional;

  })();

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.MongoProc = (function() {

    function MongoProc(element) {
      this.gentle_alert = __bind(this.gentle_alert, this);
      this.credit = __bind(this.credit, this);
      this.attempt = __bind(this.attempt, this);
      this.poll = __bind(this.poll, this);
      this.$ = __bind(this.$, this);      this.el = $(element).find('section.mongoproc');
      this.ajax_url = this.el.data('ajax-url');
      this.status = $('.mongoproc-status');
      this.poll();
      this.$('input.credit').click(this.credit);
      this.$('input.attempt').click(this.attempt);
    }

    MongoProc.prototype.$ = function(selector) {
      return $(selector, this.el);
    };

    MongoProc.prototype.poll = function() {
      var _this = this;
      if (this.status.find('.status-completed').length > 0) {
        if (this.pollerId != null) window.clearTimeout(this.pollerId);
        return;
      }
      return $.postWithPrefix("" + this.ajax_url + "/reload", function(reloadResponse) {
        _this.status.html(reloadResponse.html);
        return _this.pollerId = window.setTimeout(_this.poll, 5000);
      });
    };

    MongoProc.prototype.attempt = function() {
      var _this = this;
      return $.postWithPrefix("" + this.ajax_url + "/problem_attempt", function(response) {
        return _this.gentle_alert(response.message);
      });
    };

    MongoProc.prototype.credit = function() {
      var _this = this;
      return $.postWithPrefix("" + this.ajax_url + "/problem_credit", function(response) {
        return _this.gentle_alert(response.message);
      });
    };

    MongoProc.prototype.gentle_alert = function(msg) {
      var alert_elem;
      if (this.el.find('.gentle-alert').length) {
        this.el.find('.gentle-alert').remove();
      }
      alert_elem = "<div class='gentle-alert'>" + msg + "</div>";
      this.el.find('.credit').after(alert_elem);
      return this.el.find('.gentle-alert').css({
        opacity: 0
      }).animate({
        opacity: 1
      }, 700);
    };

    return MongoProc;

  })();

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  this.MongoWebShell = (function(_super) {

    __extends(MongoWebShell, _super);

    function MongoWebShell(element) {
      this.displayVerifyError = __bind(this.displayVerifyError, this);
      this.verify = __bind(this.verify, this);
      this.disableButtons = __bind(this.disableButtons, this);
      this.bind = __bind(this.bind, this);      MongoWebShell.__super__.constructor.call(this, $(element).find('section.mongowebshell'));
    }

    MongoWebShell.prototype.bind = function() {
      MongoWebShell.__super__.bind.apply(this, arguments);
      this.ajaxURL = this.el.data('ajax-url');
      this.verifyURL = this.el.data('verify-url');
      this.courseID = this.el.data('course-id');
      this.location = this.el.data('location');
      this.partial = this.$('.partial');
      this.submitButton = this.$('.button-submit');
      this.submitButton.off('click');
      return this.submitButton.on('click', this.verify);
    };

    MongoWebShell.prototype.disableButtons = function(disabled) {
      MongoWebShell.__super__.disableButtons.call(this, disabled);
      return this.submitButton.prop('disabled', disabled);
    };

    MongoWebShell.prototype.verify = function(event) {
      var data, verification,
        _this = this;
      event.preventDefault();
      this.disableButtons(true);
      this.shell.enableInput(false);
      this.status('<span class="indicator processing"></span> Submitting...');
      data = {
        'course_id': this.courseID,
        'problem_id': this.location
      };
      verification = $.post("" + this.verifyURL, data);
      verification.done(function(response) {
        _this.shell.enableInput(true);
        _this.status('');
        if (!response.success) {
          console.log(response);
          _this.displayVerifyError();
          return _this.disableButtons(false);
        } else {
          return $.postWithPrefix("" + _this.ajaxURL + "/problem_check", function(reloadResponse) {
            _this.partial.html(reloadResponse.html);
            _this.bind();
            return _this.disableButtons(false);
          });
        }
      });
      return verification.fail(function(xhr, status, error) {
        _this.shell.enableInput(true);
        console.log('xhr.status = ' + xhr.status);
        if (xhr.status === 429) {
          _this.status('Submit failed because of too many requests. Please wait, and try again later.');
        } else {
          _this.displayVerifyError();
        }
        return _this.disableButtons(false);
      });
    };

    MongoWebShell.prototype.displayVerifyError = function() {
      return this.status('Submit failed. Please submit again.');
    };

    return MongoWebShell;

  })(SimpleMongoWebShell);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  this.Problem = (function() {
    var _this = this;

    function Problem(element) {
      this.refreshAnswers = __bind(this.refreshAnswers, this);
      this.updateMathML = __bind(this.updateMathML, this);
      this.refreshMath = __bind(this.refreshMath, this);
      this.save = __bind(this.save, this);
      this.credit = __bind(this.credit, this);
      this.gentle_alert = __bind(this.gentle_alert, this);
      this.show = __bind(this.show, this);
      this.reset = __bind(this.reset, this);
      this.onCheckTimeout = __bind(this.onCheckTimeout, this);
      this.enableCheck = __bind(this.enableCheck, this);
      this.check = __bind(this.check, this);
      this.check_fd = __bind(this.check_fd, this);
      this.setupInputTypes = __bind(this.setupInputTypes, this);
      this.poll = __bind(this.poll, this);
      this.get_queuelen = __bind(this.get_queuelen, this);
      this.queueing = __bind(this.queueing, this);
      this.updateProgress = __bind(this.updateProgress, this);
      this.bind = __bind(this.bind, this);      this.el = $(element).find('.problems-wrapper');
      this.id = this.el.data('problem-id');
      this.element_id = this.el.attr('id');
      this.url = this.el.data('url');
      this.render();
      this.is_check_timedout = false;
      this.is_check_responded = false;
    }

    Problem.prototype.$ = function(selector) {
      return $(selector, this.el);
    };

    Problem.prototype.bind = function() {
      var problem_prefix,
        _this = this;
      this.el.find('.problem > div').each(function(index, element) {
        return MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
      });
      window.update_schematics();
      problem_prefix = this.element_id.replace(/problem_/, '');
      this.inputs = this.$("[id^=input_" + problem_prefix + "_]");
      this.$('section.action input:button').click(this.refreshAnswers);
      this.$('section.action input.check').click(this.check_fd);
      this.$('section.action input.reset').click(this.reset);
      this.$('section.action input.show').click(this.show);
      this.$('section.action input.save').click(this.save);
      this.$('section.action input.credit').click(this.credit);
      Collapsible.setCollapsibles(this.el);
      this.$('input.math').keyup(this.refreshMath);
      this.$('input.math').each(function(index, element) {
        return MathJax.Hub.Queue([_this.refreshMath, null, element]);
      });
      if (this.is_check_responded) {
        if (this.is_check_timedout) {
          this.enableCheck();
        } else {
          this.$('section.action input.check').prop("disabled", true);
        }
      }
      $('.mongo-cmd, .bash-cmd').addClass("linenums prettyprint prompted");
      if (prettyPrint) return prettyPrint();
    };

    Problem.prototype.updateProgress = function(response) {
      if (response.progress_changed) {
        this.el.attr({
          progress: response.progress_status
        });
        return this.el.trigger('progressChanged');
      }
    };

    Problem.prototype.queueing = function() {
      var queuelen;
      this.queued_items = this.$(".xqueue");
      this.num_queued_items = this.queued_items.length;
      if (this.num_queued_items > 0) {
        if (window.queuePollerID) window.clearTimeout(window.queuePollerID);
        queuelen = this.get_queuelen();
        return window.queuePollerID = window.setTimeout(this.poll, queuelen * 10);
      }
    };

    Problem.prototype.get_queuelen = function() {
      var minlen;
      minlen = Infinity;
      this.queued_items.each(function(index, qitem) {
        var len;
        len = parseInt($.text(qitem));
        if (len < minlen) return minlen = len;
      });
      return minlen;
    };

    Problem.prototype.poll = function() {
      var _this = this;
      return $.postWithPrefix("" + this.url + "/problem_get", function(response) {
        _this.new_queued_items = $(response.html).find(".xqueue");
        if (_this.new_queued_items.length !== _this.num_queued_items) {
          _this.el.html(response.html);
          JavascriptLoader.executeModuleScripts(_this.el, function() {
            _this.setupInputTypes();
            return _this.bind();
          });
        }
        _this.num_queued_items = _this.new_queued_items.length;
        if (_this.num_queued_items === 0) {
          return delete window.queuePollerID;
        } else {
          return window.queuePollerID = window.setTimeout(_this.poll, 1000);
        }
      });
    };

    Problem.prototype.setupSimpleMongoWebShell = function() {
      var mongowebshell;
      mongowebshell = this.$('.mongowebshell');
      if (mongowebshell.length > 0) {
        return this.simpleMWS = new SimpleMongoWebShell(mongowebshell.get(0));
      }
    };

    Problem.prototype.render = function(content) {
      var _this = this;
      if (content) {
        this.el.html(content);
        return JavascriptLoader.executeModuleScripts(this.el, function() {
          _this.setupInputTypes();
          _this.bind();
          _this.queueing();
          return _this.setupSimpleMongoWebShell();
        });
      } else {
        return $.postWithPrefix("" + this.url + "/problem_get", function(response) {
          _this.el.html(response.html);
          return JavascriptLoader.executeModuleScripts(_this.el, function() {
            _this.setupInputTypes();
            _this.bind();
            _this.queueing();
            return _this.setupSimpleMongoWebShell();
          });
        });
      }
    };

    Problem.prototype.setupInputTypes = function() {
      var _this = this;
      this.inputtypeDisplays = {};
      return this.el.find(".capa_inputtype").each(function(index, inputtype) {
        var classes, cls, id, setupMethod, _i, _len, _results;
        classes = $(inputtype).attr('class').split(' ');
        id = $(inputtype).attr('id');
        _results = [];
        for (_i = 0, _len = classes.length; _i < _len; _i++) {
          cls = classes[_i];
          setupMethod = _this.inputtypeSetupMethods[cls];
          if (setupMethod != null) {
            _results.push(_this.inputtypeDisplays[id] = setupMethod(inputtype));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
    };

    /*
      # 'check_fd' uses FormData to allow file submissions in the 'problem_check' dispatch,
      #      in addition to simple querystring-based answers
      #
      # NOTE: The dispatch 'problem_check' is being singled out for the use of FormData;
      #       maybe preferable to consolidate all dispatches to use FormData
    */

    Problem.prototype.check_fd = function() {
      var abort_submission, error, error_html, errors, fd, file_not_selected, file_too_large, max_filesize, required_files_not_submitted, settings, unallowed_file_submitted, _i, _len,
        _this = this;
      Logger.log('problem_check', this.answers);
      if ($('input:file').length === 0) {
        this.check();
        return;
      }
      if (!window.FormData) {
        alert("Submission aborted! Sorry, your browser does not support file uploads. If you can, please use Chrome or Safari which have been verified to support file uploads.");
        return;
      }
      fd = new FormData();
      max_filesize = 4 * 1000 * 1000;
      file_too_large = false;
      file_not_selected = false;
      required_files_not_submitted = false;
      unallowed_file_submitted = false;
      errors = [];
      this.inputs.each(function(index, element) {
        var allowed_files, file, required_files, _i, _len, _ref, _ref2, _ref3;
        if (element.type === 'file') {
          required_files = $(element).data("required_files");
          allowed_files = $(element).data("allowed_files");
          _ref = element.files;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            file = _ref[_i];
            if (allowed_files.length !== 0 && (_ref2 = file.name, __indexOf.call(allowed_files, _ref2) < 0)) {
              unallowed_file_submitted = true;
              errors.push("You submitted " + file.name + "; only " + allowed_files + " are allowed.");
            }
            if (_ref3 = file.name, __indexOf.call(required_files, _ref3) >= 0) {
              required_files.splice(required_files.indexOf(file.name), 1);
            }
            if (file.size > max_filesize) {
              file_too_large = true;
              errors.push('Your file "' + file.name('" is too large (max size: ' + max_filesize / (1000 * 1000) + ' MB)'));
            }
            fd.append(element.id, file);
          }
          if (element.files.length === 0) {
            file_not_selected = true;
            fd.append(element.id, '');
          }
          if (required_files.length !== 0) {
            required_files_not_submitted = true;
            return errors.push("You did not submit the required files: " + required_files + ".");
          }
        } else {
          return fd.append(element.id, element.value);
        }
      });
      if (file_not_selected) errors.push('You did not select any files to submit');
      error_html = '<ul>\n';
      for (_i = 0, _len = errors.length; _i < _len; _i++) {
        error = errors[_i];
        error_html += '<li>' + error + '</li>\n';
      }
      error_html += '</ul>';
      this.gentle_alert(error_html);
      abort_submission = file_too_large || file_not_selected || unallowed_file_submitted || required_files_not_submitted;
      settings = {
        type: "POST",
        data: fd,
        processData: false,
        contentType: false,
        success: function(response) {
          switch (response.success) {
            case 'incorrect':
            case 'correct':
              _this.render(response.contents);
              return _this.updateProgress(response);
            default:
              return _this.gentle_alert(response.success);
          }
        }
      };
      if (!abort_submission) {
        return $.ajaxWithPrefix("" + this.url + "/problem_check", settings);
      }
    };

    Problem.prototype.check = function() {
      var tokens,
        _this = this;
      Logger.log('problem_check', this.answers);
      if ((this.inputs.attr('type')) === 'radio' || (this.inputs.attr('type')) === 'checkbox') {
        if (this.answers.length === 0) {
          alert('Please select an answer');
          return;
        }
      } else {
        tokens = this.answers.split("=");
        if (tokens.length === 2 && tokens[1].length === 0) {
          alert("Please enter an answer");
          return;
        }
      }
      this.$('section.action input.check').prop("disabled", true);
      window.setTimeout(this.onCheckTimeout, 1000);
      return $.postWithPrefix("" + this.url + "/problem_check", this.answers, function(response) {
        var each;
        _this.is_check_responded = true;
        Logger.track_vertical_event('submit', {
          answer: _this.answers,
          choice: ((function() {
            var _i, _len, _ref, _results;
            _ref = $('.problem .choicegroup input:checked').parent();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              each = _ref[_i];
              _results.push($.trim($(each).text()));
            }
            return _results;
          })()).join('|'),
          text: $('.problem .textbox').length,
          mws: $('.problem .mongo-web-shell').length,
          correct: response.success,
          attempt: $(response.contents).find('.submission_feedback').text().trim().split(" ")[3],
          problem_id: $('.problems-wrapper').data('problem-id')
        });
        switch (response.success) {
          case 'incorrect':
          case 'correct':
            if (response.is_new_content) {
              _this.render();
            } else {
              _this.render(response.contents);
            }
            _this.updateProgress(response);
            if (_this.el.hasClass('showed')) return _this.el.removeClass('showed');
            break;
          default:
            if (_this.is_check_timedout) _this.enableCheck();
            return _this.gentle_alert(response.success);
        }
      });
    };

    Problem.prototype.enableCheck = function() {
      this.$('section.action input.check').prop("disabled", false);
      this.is_check_timedout = false;
      return this.is_check_responded = false;
    };

    Problem.prototype.onCheckTimeout = function() {
      this.is_check_timedout = true;
      if (this.is_check_responded) return this.enableCheck();
    };

    Problem.prototype.reset = function() {
      var _this = this;
      Logger.log('problem_reset', this.answers);
      return $.postWithPrefix("" + this.url + "/problem_reset", {
        id: this.id
      }, function(response) {
        _this.render(response.html);
        return _this.updateProgress(response);
      });
    };

    Problem.prototype.show = function() {
      var _this = this;
      if (!this.el.hasClass('showed')) {
        Logger.log('problem_show', {
          problem: this.id
        });
        Logger.track_vertical_event('click', {
          button: 'Show Answer',
          problem_id: $('.problems-wrapper').data('problem-id')
        });
        return $.postWithPrefix("" + this.url + "/problem_show", function(response) {
          var answers;
          answers = response.answers;
          $.each(answers, function(key, value) {
            var answer, choice, _i, _len, _results;
            if ($.isArray(value)) {
              _results = [];
              for (_i = 0, _len = value.length; _i < _len; _i++) {
                choice = value[_i];
                _results.push(_this.$("label[for='input_" + key + "_" + choice + "']").attr({
                  correct_answer: 'true'
                }));
              }
              return _results;
            } else {
              answer = _this.$("#answer_" + key + ", #solution_" + key);
              answer.html(value);
              return Collapsible.setCollapsibles(answer);
            }
          });
          _this.el.find(".capa_inputtype").each(function(index, inputtype) {
            var classes, cls, display, showMethod, _i, _len, _results;
            classes = $(inputtype).attr('class').split(' ');
            _results = [];
            for (_i = 0, _len = classes.length; _i < _len; _i++) {
              cls = classes[_i];
              display = _this.inputtypeDisplays[$(inputtype).attr('id')];
              showMethod = _this.inputtypeShowAnswerMethods[cls];
              if (showMethod != null) {
                _results.push(showMethod(inputtype, display, answers));
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          });
          _this.el.find('.problem > div').each(function(index, element) {
            return MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
          });
          _this.$('.show').val('Hide Answer');
          _this.el.addClass('showed');
          return _this.updateProgress(response);
        });
      } else {
        Logger.track_vertical_event('click', {
          button: 'Hide Answer',
          problem_id: $('.problems-wrapper').data('problem-id')
        });
        this.$('[id^=answer_], [id^=solution_]').text('');
        this.$('[correct_answer]').attr({
          correct_answer: null
        });
        this.el.removeClass('showed');
        this.$('.show').val('Show Answer');
        return this.el.find(".capa_inputtype").each(function(index, inputtype) {
          var classes, cls, display, hideMethod, _i, _len, _results;
          display = _this.inputtypeDisplays[$(inputtype).attr('id')];
          classes = $(inputtype).attr('class').split(' ');
          _results = [];
          for (_i = 0, _len = classes.length; _i < _len; _i++) {
            cls = classes[_i];
            hideMethod = _this.inputtypeHideAnswerMethods[cls];
            if (hideMethod != null) {
              _results.push(hideMethod(inputtype, display));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        });
      }
    };

    Problem.prototype.gentle_alert = function(msg) {
      var alert_elem;
      if (this.el.find('.capa_alert').length) this.el.find('.capa_alert').remove();
      alert_elem = "<div class='capa_alert'>" + msg + "</div>";
      this.el.find('.action').after(alert_elem);
      return this.el.find('.capa_alert').css({
        opacity: 0
      }).animate({
        opacity: 1
      }, 700);
    };

    Problem.prototype.credit = function() {
      var _this = this;
      return $.postWithPrefix("" + this.url + "/problem_credit", {
        id: this.id
      }, function(response) {
        return _this.gentle_alert(response.message);
      });
    };

    Problem.prototype.save = function() {
      var each,
        _this = this;
      Logger.log('problem_save', this.answers);
      Logger.track_vertical_event('save', {
        answer: this.answers,
        choice: ((function() {
          var _i, _len, _ref, _results;
          _ref = $('.problem .choicegroup input:checked').parent();
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            each = _ref[_i];
            _results.push($.trim($(each).text()));
          }
          return _results;
        })()).join('|'),
        text: $('.problem .textbox').length,
        mws: $('.problem .mongo-web-shell').length,
        attempt: $('.submission_feedback').text().trim().split(" ")[3],
        problem_id: $('.problems-wrapper').data('problem-id')
      });
      return $.postWithPrefix("" + this.url + "/problem_save", this.answers, function(response) {
        var saveMessage;
        if (response.success) {
          saveMessage = "Your answers have been saved but not graded. Hit 'Submit' to grade them.";
          _this.gentle_alert(saveMessage);
        }
        return _this.updateProgress(response);
      });
    };

    Problem.prototype.refreshMath = function(event, element) {
      var elid, eqn, jax, mathjax_preprocessor, preprocessor_tag, target;
      if (!element) element = event.target;
      elid = element.id.replace(/^input_/, '');
      target = "display_" + elid;
      preprocessor_tag = "inputtype_" + elid;
      mathjax_preprocessor = this.inputtypeDisplays[preprocessor_tag];
      if (jax = MathJax.Hub.getAllJax(target)[0]) {
        eqn = $(element).val();
        if (mathjax_preprocessor) eqn = mathjax_preprocessor(eqn);
        MathJax.Hub.Queue(['Text', jax, eqn], [this.updateMathML, jax, element]);
      }
    };

    Problem.prototype.updateMathML = function(jax, element) {
      try {
        return $("#" + element.id + "_dynamath").val(jax.root.toMathML(''));
      } catch (exception) {
        if (!exception.restart) throw exception;
        return MathJax.Callback.After([this.refreshMath, jax], exception.restart);
      }
    };

    Problem.prototype.refreshAnswers = function() {
      this.$('input.schematic').each(function(index, element) {
        return element.schematic.update_value();
      });
      this.$(".CodeMirror").each(function(index, element) {
        if (element.CodeMirror.save) return element.CodeMirror.save();
      });
      return this.answers = this.inputs.serialize();
    };

    Problem.prototype.inputtypeSetupMethods = {
      'text-input-dynamath': function(element) {
        /*
              Return: function (eqn) -> eqn that preprocesses the user formula input before
                        it is fed into MathJax. Return 'false' if no preprocessor specified
        */
        var data, preprocessor, preprocessorClass, preprocessorClassName;
        data = $(element).find('.text-input-dynamath_data');
        preprocessorClassName = data.data('preprocessor');
        preprocessorClass = window[preprocessorClassName];
        if (!(preprocessorClass != null)) {
          return false;
        } else {
          preprocessor = new preprocessorClass();
          return preprocessor.fn;
        }
      },
      javascriptinput: function(element) {
        var container, data, display, displayClass, evaluation, params, problemState, submission, submissionField;
        data = $(element).find(".javascriptinput_data");
        params = data.data("params");
        submission = data.data("submission");
        evaluation = data.data("evaluation");
        problemState = data.data("problem_state");
        displayClass = window[data.data('display_class')];
        if (evaluation === '') evaluation = null;
        container = $(element).find(".javascriptinput_container");
        submissionField = $(element).find(".javascriptinput_input");
        display = new displayClass(problemState, submission, evaluation, container, submissionField, params);
        display.render();
        return display;
      }
    };

    Problem.prototype.inputtypeShowAnswerMethods = {
      choicegroup: function(element, display, answers) {
        var answer, choice, input_id, _i, _len, _results;
        element = $(element);
        element.find('input').attr('disabled', 'disabled');
        input_id = element.attr('id').replace(/inputtype_/, '');
        answer = answers[input_id];
        _results = [];
        for (_i = 0, _len = answer.length; _i < _len; _i++) {
          choice = answer[_i];
          _results.push(element.find("label[for='input_" + input_id + "_" + choice + "']").addClass('choicegroup_correct'));
        }
        return _results;
      },
      javascriptinput: function(element, display, answers) {
        var answer, answer_id;
        answer_id = $(element).attr('id').split("_").slice(1).join("_");
        answer = JSON.parse(answers[answer_id]);
        return display.showAnswer(answer);
      }
    };

    Problem.prototype.inputtypeHideAnswerMethods = {
      choicegroup: function(element, display) {
        element = $(element);
        element.find('input').attr('disabled', null);
        return element.find('label').removeClass('choicegroup_correct');
      },
      javascriptinput: function(element, display) {
        return display.hideAnswer();
      }
    };

    return Problem;

  }).call(this);

}).call(this);

(function() {

  this.Video = (function() {

    function Video(element) {
      var _this = this;
      this.el = $(element).find('.video');
      this.id = this.el.attr('id').replace(/video_/, '');
      this.caption_data_dir = this.el.data('caption-data-dir');
      this.show_captions = this.el.data('show-captions') === "true";
      window.player = null;
      this.el = $("#video_" + this.id);
      this.parseVideos(this.el.data('streams'));
      this.fetchMetadata();
      this.parseSpeed();
      $("#video_" + this.id).data('video', this).addClass('video-load-complete');
      this.hide_captions = $.cookie('hide_captions') === 'true';
      if (!(typeof YT !== "undefined" && YT !== null)) {
        $(element).find('.youtube-fail').show();
        $(element).delegate('.form-video-pref', 'ajax:success', function(data, json, xhr) {
          return location.reload();
        });
      }
      if (YT.Player) {
        this.embed();
      } else {
        window.onYouTubePlayerAPIReady = function() {
          return $('.course-content .video').each(function() {
            return $(this).data('video').embed();
          });
        };
      }
    }

    Video.prototype.youtubeId = function(speed) {
      return this.videos[speed || this.speed];
    };

    Video.prototype.parseVideos = function(videos) {
      var _this = this;
      this.videos = {};
      return $.each(videos.split(/,/), function(index, video) {
        var speed;
        video = video.split(/:/);
        speed = parseFloat(video[0]).toFixed(2).replace(/\.00$/, '.0');
        return _this.videos[speed] = video[1];
      });
    };

    Video.prototype.parseSpeed = function() {
      this.setSpeed($.cookie('video_speed'));
      return this.speeds = ($.map(this.videos, function(url, speed) {
        return speed;
      })).sort();
    };

    Video.prototype.setSpeed = function(newSpeed) {
      if (this.videos[newSpeed] !== void 0) {
        this.speed = newSpeed;
        return $.cookie('video_speed', "" + newSpeed, {
          expires: 3650,
          path: '/'
        });
      } else {
        return this.speed = '1.0';
      }
    };

    Video.prototype.embed = function() {
      return this.player = new VideoPlayer({
        video: this
      });
    };

    Video.prototype.fetchMetadata = function(url) {
      var _this = this;
      this.metadata = {};
      return $.each(this.videos, function(speed, url) {
        return $.get("https://gdata.youtube.com/feeds/api/videos/" + url + "?v=2&alt=jsonc", (function(data) {
          return _this.metadata[data.data.id] = data.data;
        }), 'jsonp');
      });
    };

    Video.prototype.getDuration = function() {
      return this.metadata[this.youtubeId()].duration;
    };

    Video.prototype.log = function(eventName) {
      return Logger.log(eventName, {
        id: this.id,
        code: this.youtubeId(),
        currentTime: this.player.currentTime,
        speed: this.speed
      });
    };

    return Video;

  })();

}).call(this);

//////////////////////////////////////////////////////////////////////////////
//
//  Circuit simulator
//
//////////////////////////////////////////////////////////////////////////////

// Copyright (C) 2011 Massachusetts Institute of Technology


// create a circuit for simulation using "new cktsim.Circuit()"

// for modified nodal analysis (MNA) stamps see
// http://www.analog-electronics.eu/analog-electronics/modified-nodal-analysis/modified-nodal-analysis.xhtml

var cktsim = (function() {

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Circuit
    //
    //////////////////////////////////////////////////////////////////////////////

    // types of "nodes" in the linear system
    var T_VOLTAGE = 0;
    var T_CURRENT = 1;

    var v_newt_lim = 0.3;   // Voltage limited Newton great for Mos/diodes
    var v_abstol = 1e-6;	// Absolute voltage error tolerance
    var i_abstol = 1e-12;	// Absolute current error tolerance
    var eps = 1.0e-12;           // A very small number compared to one.
    var dc_max_iters = 1000;	// max iterations before giving pu
    var max_tran_iters = 20;	// max iterations before giving up
    var time_step_increase_factor = 2.0;  // How much can lte let timestep grow.
    var lte_step_decrease_factor = 8;    // Limit lte one-iter timestep shrink.
    var nr_step_decrease_factor = 4;     // Newton failure timestep shink.
    var reltol = 0.0001;		// Relative tol to max observed value
    var lterel = 10;             // LTE/Newton tolerance ratio (> 10!)
    var res_check_abs = Math.sqrt(i_abstol); // Loose Newton residue check
    var res_check_rel = Math.sqrt(reltol); // Loose Newton residue check

    function Circuit() {
	this.node_map = [];
	this.ntypes = [];
	this.initial_conditions = [];  // ic's for each element

	this.devices = [];  // list of devices
	this.device_map = [];  // map name -> device
	this.voltage_sources = [];  // list of voltage sources
	this.current_sources = [];  // list of current sources

	this.finalized = false;
	this.diddc = false;
	this.node_index = -1;

	this.periods = 1;
    }

    // index of ground node
    Circuit.prototype.gnd_node = function() {
        return -1;
    };

    // allocate a new node index
    Circuit.prototype.node = function(name,ntype,ic) {
	this.node_index += 1;
	if (name) this.node_map[name] = this.node_index;
	this.ntypes.push(ntype);
	this.initial_conditions.push(ic);
	return this.node_index;
    };

    // call to finalize the circuit in preparation for simulation
    Circuit.prototype.finalize = function() {
	if (!this.finalized) {
	    this.finalized = true;
	    this.N = this.node_index + 1;  // number of nodes

	    // give each device a chance to finalize itself
	    for (var i = this.devices.length - 1; i >= 0; --i)
		this.devices[i].finalize(this);

	    // set up augmented matrix and various temp vectors
	    this.matrix = mat_make(this.N, this.N+1);
	    this.Gl = mat_make(this.N, this.N);  // Matrix for linear conductances
	    this.G = mat_make(this.N, this.N);  // Complete conductance matrix
	    this.C = mat_make(this.N, this.N);  // Matrix for linear L's and C's

	    this.soln_max = new Array(this.N);   // max abs value seen for each unknown
	    this.abstol = new Array(this.N);
	    this.solution = new Array(this.N);
	    this.rhs = new Array(this.N);
	    for (var i = this.N - 1; i >= 0; --i) {
		this.soln_max[i] = 0.0;
		this.abstol[i] = this.ntypes[i] == T_VOLTAGE ? v_abstol : i_abstol;
		this.solution[i] = 0.0;
		this.rhs[i] = 0.0;
	    }

	    // Load up the linear elements once and for all
	    for (var i = this.devices.length - 1; i >= 0; --i) {
		this.devices[i].load_linear(this);
	    }

	    // Check for voltage source loops.
	    n_vsrc = this.voltage_sources.length;
	    if (n_vsrc > 0) { // At least one voltage source
		var GV = mat_make(n_vsrc, this.N);  // Loop check
		for (var i = n_vsrc - 1; i >= 0; --i) {
		    var branch = this.voltage_sources[i].branch;
		    for (var j = this.N - 1; j >= 0; j--)
			GV[i][j] = this.Gl[branch][j];
		}
		var rGV = mat_rank(GV);
		if (rGV < n_vsrc) {
		    alert('Warning!!! Circuit has a voltage source loop or a source or current probe shorted by a wire, please remove the source or the wire causing the short.');
		    alert('Warning!!! Simulator might produce meaningless results or no result with illegal circuits.');
		    return false;
		}
	    }
	}
	return true;
    };

    // load circuit from JSON netlist (see schematic.js)
    Circuit.prototype.load_netlist = function(netlist) {
	// set up mapping for all ground connections
	for (var i = netlist.length - 1; i >= 0; --i) {
	    var component = netlist[i];
	    var type = component[0];
	    if (type == 'g') {
		var connections = component[3];
		this.node_map[connections[0]] = this.gnd_node();
	    }
	}

	// process each component in the JSON netlist (see schematic.js for format)
	var found_ground = false;
	for (var i = netlist.length - 1; i >= 0; --i) {
	    var component = netlist[i];
	    var type = component[0];

	    // ignore wires, ground connections, scope probes and view info
	    if (type == 'view' || type == 'w' || type == 'g' || type == 's' || type == 'L') {
		continue;
	    }

	    var properties = component[2];
	    var name = properties['name'];
	    if (name==undefined || name=='')
		name = '_' + properties['_json_'].toString();

	    // convert node names to circuit indicies
	    var connections = component[3];
	    for (var j = connections.length - 1; j >= 0; --j) {
		var node = connections[j];
		var index = this.node_map[node];
		if (index == undefined) index = this.node(node,T_VOLTAGE);
		else if (index == this.gnd_node()) found_ground = true;
		connections[j] = index;
	    }

	    // process the component
	    if (type == 'r')	// resistor
		this.r(connections[0],connections[1],properties['r'],name);
	    else if (type == 'd')	// diode
		this.d(connections[0],connections[1],properties['area'],properties['type'],name);
	    else if (type == 'c')   // capacitor
		this.c(connections[0],connections[1],properties['c'],name);
	    else if (type == 'l')	// inductor
		this.l(connections[0],connections[1],properties['l'],name);
	    else if (type == 'v') 	// voltage source
		this.v(connections[0],connections[1],properties['value'],name);
	    else if (type == 'i') 	// current source
		this.i(connections[0],connections[1],properties['value'],name);
	    else if (type == 'o') 	// op amp
		this.opamp(connections[0],connections[1],connections[2],connections[3],properties['A'],name);
	    else if (type == 'n') 	// n fet
		this.n(connections[0],connections[1],connections[2],properties['W/L'],name);
	    else if (type == 'p') 	// p fet
		this.p(connections[0],connections[1],connections[2],properties['W/L'],name);
	    else if (type == 'a') 	// current probe == 0-volt voltage source
		this.v(connections[0],connections[1],'0',name);
	}

	if (!found_ground) { // No ground on schematic
	    alert('Please make at least one connection to ground  (inverted T symbol)');
	    return false;
	}
	return true;

    };

    // if converges: updates this.solution, this.soln_max, returns iter count
    // otherwise: return undefined and set this.problem_node
    // Load should compute -f and df/dx (note the sign pattern!)
    Circuit.prototype.find_solution = function(load,maxiters) {
	var soln = this.solution;
	var rhs = this.rhs;
	var d_sol = new Array();
	var abssum_compare;
	var converged,abssum_old=0, abssum_rhs;
	var use_limiting = false;
	var down_count = 0;

	// iteratively solve until values convere or iteration limit exceeded
	for (var iter = 0; iter < maxiters; iter++) {
	    // set up equations
	    load(this,soln,rhs);

	    // Compute norm of rhs, assume variables of v type go with eqns of i type
	    abssum_rhs = 0;
	    for (var i = this.N - 1; i >= 0; --i)
		if (this.ntypes[i] == T_VOLTAGE)
		    abssum_rhs += Math.abs(rhs[i]);

	    if ((iter > 0) && (use_limiting == false) && (abssum_old < abssum_rhs)) {
		// Old rhsnorm was better, undo last iter and turn on limiting
		for (var i = this.N - 1; i >= 0; --i)
		    soln[i] -= d_sol[i];
		iter -= 1;
		use_limiting = true;
	    }
	    else {  // Compute the Newton delta
		//d_sol = mat_solve(this.matrix,rhs);
		d_sol = mat_solve_rq(this.matrix,rhs);

		// If norm going down for ten iters, stop limiting
		if (abssum_rhs < abssum_old)
		    down_count += 1;
		else
		    down_count = 0;
		if (down_count > 10) {
		    use_limiting = false;
		    down_count = 0;
		}

		// Update norm of rhs
		abssum_old = abssum_rhs;
	    }

	    // Update the worst case abssum for comparison.
	    if ((iter == 0) || (abssum_rhs > abssum_compare))
		abssum_compare = abssum_rhs;

	    // Check residue convergence, but loosely, and give up
	    // on last iteration
	    if ( (iter < (maxiters - 1)) &&
		 (abssum_rhs > (res_check_abs+res_check_rel*abssum_compare)))
		converged = false;
	    else converged = true;


	    // Update solution and check delta convergence
	    for (var i = this.N - 1; i >= 0; --i) {
		// Simple voltage step limiting to encourage Newton convergence
		if (use_limiting) {
		    if (this.ntypes[i] == T_VOLTAGE) {
			d_sol[i] = (d_sol[i] > v_newt_lim) ? v_newt_lim : d_sol[i];
			d_sol[i] = (d_sol[i] < -v_newt_lim) ? -v_newt_lim : d_sol[i];
		    }
		}
		soln[i] += d_sol[i];
		thresh = this.abstol[i] + reltol*this.soln_max[i];
		if (Math.abs(d_sol[i]) > thresh) {
		    converged = false;
		    this.problem_node = i;
		}
	    }

	    //alert(numeric.prettyPrint(this.solution);)
            if (converged == true) {
		for (var i = this.N - 1; i >= 0; --i)
		    if (Math.abs(soln[i]) > this.soln_max[i])
			this.soln_max[i] = Math.abs(soln[i]);

		return iter+1;
	    }
	}
	return undefined;
    };

    // DC analysis
    Circuit.prototype.dc = function() {

	// Allocation matrices for linear part, etc.
	if (this.finalize() == false)
	    return undefined;

	// Define -f and df/dx for Newton solver
	function load_dc(ckt,soln,rhs) {
	    // rhs is initialized to -Gl * soln
	    mat_v_mult(ckt.Gl, soln, rhs, -1.0);
	    // G matrix is initialized with linear Gl
	    mat_copy(ckt.Gl,ckt.G);
	    // Now load up the nonlinear parts of rhs and G
	    for (var i = ckt.devices.length - 1; i >= 0; --i)
		ckt.devices[i].load_dc(ckt,soln,rhs);
	    // G matrix is copied in to the system matrix
	    mat_copy(ckt.G,ckt.matrix);
	}

	// find the operating point
	var iterations = this.find_solution(load_dc,dc_max_iters);

	if (typeof iterations == 'undefined') {
	    // too many iterations
	    if (this.current_sources.length > 0) {
		alert('Newton Method Failed, do your current sources have a conductive path to ground?');
	    } else {
		alert('Newton Method Failed, it may be your circuit or it may be our simulator.');
	    }

	    return undefined;
	} else {
	    // Note that a dc solution was computed
	    this.diddc = true;
	    // create solution dictionary
	    var result = new Array();
	    // capture node voltages
	    for (var name in this.node_map) {
		var index = this.node_map[name];
		result[name] = (index == -1) ? 0 : this.solution[index];
	    }
	    // capture branch currents from voltage sources
	    for (var i = this.voltage_sources.length - 1; i >= 0; --i) {
		var v = this.voltage_sources[i];
		result['I('+v.name+')'] = this.solution[v.branch];
	    }
	    return result;
	}
    };

    // Transient analysis (needs work!)
    Circuit.prototype.tran = function(ntpts, tstart, tstop, probenames, no_dc) {

	// Define -f and df/dx for Newton solver
	function load_tran(ckt,soln,rhs) {
	    // Crnt is initialized to -Gl * soln
	    mat_v_mult(ckt.Gl, soln, ckt.c,-1.0);
	    // G matrix is initialized with linear Gl
	    mat_copy(ckt.Gl,ckt.G);
	    // Now load up the nonlinear parts of crnt and G
	    for (var i = ckt.devices.length - 1; i >= 0; --i)
		ckt.devices[i].load_tran(ckt,soln,ckt.c,ckt.time);
	    // Exploit the fact that storage elements are linear
	    mat_v_mult(ckt.C, soln, ckt.q, 1.0);
	    // -rhs = c - dqdt
	    for (var i = ckt.N-1; i >= 0; --i) {
		var dqdt = ckt.alpha0*ckt.q[i] + ckt.alpha1*ckt.oldq[i] +
			ckt.alpha2*ckt.old2q[i];
		//alert(numeric.prettyPrint(dqdt));
		rhs[i] = ckt.beta0[i]*ckt.c[i] + ckt.beta1[i]*ckt.oldc[i] - dqdt;
	    }
	    // matrix = beta0*G + alpha0*C.
	    mat_scale_add(ckt.G,ckt.C,ckt.beta0,ckt.alpha0,ckt.matrix);
	}

	var p = new Array(3);
	function interp_coeffs(t, t0, t1, t2) {
	    // Poly coefficients
	    var dtt0 = (t - t0);
	    var dtt1 = (t - t1);
	    var dtt2 = (t - t2);
	    var dt0dt1 = (t0 - t1);
	    var dt0dt2 = (t0 - t2);
	    var dt1dt2 = (t1 - t2);
	    p[0] = (dtt1*dtt2)/(dt0dt1 * dt0dt2);
	    p[1] = (dtt0*dtt2)/(-dt0dt1 * dt1dt2);
	    p[2] = (dtt0*dtt1)/(dt0dt2 * dt1dt2);
	    return p;
	}

	function pick_step(ckt, step_index) {
	    var min_shrink_factor = 1.0/lte_step_decrease_factor;
	    var max_growth_factor = time_step_increase_factor;
	    var N = ckt.N;
	    var p = interp_coeffs(ckt.time, ckt.oldt, ckt.old2t, ckt.old3t);
	    var trapcoeff = 0.5*(ckt.time - ckt.oldt)/(ckt.time - ckt.old3t);
	    var maxlteratio = 0.0;
	    for (var i = ckt.N-1; i >= 0; --i) {
		if (ckt.ltecheck[i]) { // Check lte on variable
		    var pred = p[0]*ckt.oldsol[i] + p[1]*ckt.old2sol[i] + p[2]*ckt.old3sol[i];
		    var lte = Math.abs((ckt.solution[i] - pred))*trapcoeff;
		    var lteratio = lte/(lterel*(ckt.abstol[i] + reltol*ckt.soln_max[i]));
		    maxlteratio = Math.max(maxlteratio, lteratio);
		}
	    }
	    var new_step;
	    var lte_step_ratio = 1.0/Math.pow(maxlteratio,1/3); // Cube root because trap
	    if (lte_step_ratio < 1.0) { // Shrink the timestep to make lte
		lte_step_ratio = Math.max(lte_step_ratio,min_shrink_factor);
		new_step = (ckt.time - ckt.oldt)*0.75*lte_step_ratio;
		new_step = Math.max(new_step, ckt.min_step);
	    } else {
		lte_step_ratio = Math.min(lte_step_ratio, max_growth_factor);
		if (lte_step_ratio > 1.2)  /* Increase timestep due to lte. */
		    new_step = (ckt.time - ckt.oldt) * lte_step_ratio / 1.2;
		else
		    new_step = (ckt.time - ckt.oldt);
		new_step = Math.min(new_step, ckt.max_step);
	    }
	    return new_step;
	}

	// Standard to do a dc analysis before transient
	// Otherwise, do the setup also done in dc.
	no_dc = false;
	if ((this.diddc == false) && (no_dc == false)) {
	    if (this.dc() == undefined) { // DC failed, realloc mats and vects.
		alert('DC failed, trying transient analysis from zero.');
		this.finalized = false;  // Reset the finalization.
		if (this.finalize() == false)
		    return undefined;
	    }
	}
	else {
	    if (this.finalize() == false) // Allocate matrices and vectors.
		return undefined;
	}

	// Tired of typing this, and using "with" generates hate mail.
	var N = this.N;

	// build array to hold list of results for each variable
	// last entry is for timepoints.
	var response = new Array(N + 1);
	for (var i = N; i >= 0; --i) response[i] = new Array();

	// Allocate back vectors for up to a second order method
	this.old3sol = new Array(this.N);
	this.old3q = new Array(this.N);
	this.old2sol = new Array(this.N);
	this.old2q = new Array(this.N);
	this.oldsol = new Array(this.N);
	this.oldq = new Array(this.N);
	this.q = new Array(this.N);
	this.oldc = new Array(this.N);
	this.c = new Array(this.N);
	this.alpha0 = 1.0;
	this.alpha1 = 0.0;
	this.alpha2 = 0.0;
	this.beta0 = new Array(this.N);
	this.beta1 = new Array(this.N);

	// Mark a set of algebraic variable (don't miss hidden ones!).
	this.ar = this.algebraic(this.C);

	// Non-algebraic variables and probe variables get lte
	this.ltecheck = new Array(this.N);
	for (var i = N; i >= 0; --i)
	    this.ltecheck[i] = (this.ar[i] == 0);

	for (var name in this.node_map) {
	    var index = this.node_map[name];
	    for (var i = probenames.length; i >= 0; --i) {
		if (name == probenames[i]) {
		    this.ltecheck[index] = true;
		    break;
		}
	    }
	}

	// Check for periodic sources
	var period = tstop - tstart;
	for (var i = this.voltage_sources.length - 1; i >= 0; --i) {
	    var per = this.voltage_sources[i].src.period;
	    if (per > 0)
		period = Math.min(period, per);
	}
	for (var i = this.current_sources.length - 1; i >= 0; --i) {
	    var per = this.current_sources[i].src.period;
	    if (per > 0)
		period = Math.min(period, per);
	}
	this.periods = Math.ceil((tstop - tstart)/period);
	//alert('number of periods ' + this.periods);


	this.time = tstart;
	// ntpts adjusted by numbers of periods in input
	this.max_step = (tstop - tstart)/(this.periods*ntpts);
	this.min_step = this.max_step/1e8;
	var new_step = this.max_step/1e6;
	this.oldt = this.time - new_step;

	// Initialize old crnts, charges, and solutions.
	load_tran(this,this.solution,this.rhs);
	for (var i = N-1; i >= 0; --i) {
	    this.old3sol[i] = this.solution[i];
	    this.old2sol[i] = this.solution[i];
	    this.oldsol[i] = this.solution[i];
	    this.old3q[i] = this.q[i];
	    this.old2q[i] = this.q[i];
	    this.oldq[i] = this.q[i];
	    this.oldc[i] = this.c[i];
	}


	var beta0,beta1;
	// Start with two pseudo-Euler steps, maximum 50000 steps/period
	var max_nsteps = this.periods*50000;
	for(var step_index = -3; step_index < max_nsteps; step_index++) {
	    // Save the just computed solution, and move back q and c.
	    for (var i = this.N - 1; i >= 0; --i) {
		if (step_index >= 0)
		    response[i].push(this.solution[i]);
		this.oldc[i] = this.c[i];
		this.old3sol[i] = this.old2sol[i];
		this.old2sol[i] = this.oldsol[i];
		this.oldsol[i] = this.solution[i];
		this.old3q[i] = this.oldq[i];
		this.old2q[i] = this.oldq[i];
		this.oldq[i] = this.q[i];

	    }

	    if (step_index < 0) {  // Take a prestep using BE
		this.old3t = this.old2t - (this.oldt-this.old2t)
		this.old2t = this.oldt - (tstart-this.oldt)
		this.oldt = tstart - (this.time - this.oldt);
		this.time = tstart;
		beta0 = 1.0;
		beta1 = 0.0;
	    } else {  // Take a regular step
		// Save the time, and rotate time wheel
		response[this.N].push(this.time);
		this.old3t = this.old2t;
		this.old2t = this.oldt;
		this.oldt = this.time;
		// Make sure we come smoothly in to the interval end.
		if (this.time >= tstop) break;  // We're done.
		else if(this.time + new_step > tstop)
		    this.time = tstop;
		else if(this.time + 1.5*new_step > tstop)
		    this.time += (2/3)*(tstop - this.time);
		else
		    this.time += new_step;

		// Use trap (average old and new crnts.
		beta0 = 0.5;
		beta1 = 0.5;
	    }

	    // For trap rule, turn off current avging for algebraic eqns
	    for (var i = this.N - 1; i >= 0; --i) {
		this.beta0[i] = beta0 + this.ar[i]*beta1;
		this.beta1[i] = (1.0 - this.ar[i])*beta1;
	    }

	    // Loop to find NR converging timestep with okay LTE
	    while (true) {
		// Set the timestep coefficients (alpha2 is for bdf2).
		this.alpha0 = 1.0/(this.time - this.oldt);
		this.alpha1 = -this.alpha0;
		this.alpha2 = 0;

		// If timestep is 1/10,000th of tstop, just use BE.
		if ((this.time-this.oldt) < 1.0e-4*tstop) {
		    for (var i = this.N - 1; i >= 0; --i) {
			this.beta0[i] = 1.0;
			this.beta1[i] = 0.0;
		    }
		}
		// Use Newton to compute the solution.
		var iterations = this.find_solution(load_tran,max_tran_iters);

		// If NR succeeds and stepsize is at min, accept and newstep=maxgrowth*minstep.
		// Else if Newton Fails, shrink step by a factor and try again
		// Else LTE picks new step, if bigger accept current step and go on.
		if ((iterations != undefined) &&
		    (step_index <= 0 || (this.time-this.oldt) < (1+reltol)*this.min_step)) {
		    if (step_index > 0) new_step = time_step_increase_factor*this.min_step;
		    break;
		} else if (iterations == undefined) {  // NR nonconvergence, shrink by factor
		    //alert('timestep nonconvergence ' + this.time + ' ' + step_index);
		    this.time = this.oldt +
			(this.time - this.oldt)/nr_step_decrease_factor;
		} else {  // Check the LTE and shrink step if needed.
		    new_step = pick_step(this, step_index);
		    if (new_step < (1.0 - reltol)*(this.time - this.oldt)) {
			this.time = this.oldt + new_step;  // Try again
		    }
		    else
			break;  // LTE okay, new_step for next step
		}
	    }
	}

	// create solution dictionary
	var result = new Array();
	for (var name in this.node_map) {
	    var index = this.node_map[name];
	    result[name] = (index == -1) ? 0 : response[index];
	}
	// capture branch currents from voltage sources
	for (var i = this.voltage_sources.length - 1; i >= 0; --i) {
	    var v = this.voltage_sources[i];
	    result['I('+v.name+')'] = response[v.branch];
	}

	result['_time_'] = response[this.N];
	return result;
    };

    // AC analysis: npts/decade for freqs in range [fstart,fstop]
    // result['_frequencies_'] = vector of log10(sample freqs)
    // result['xxx'] = vector of dB(response for node xxx)
    // NOTE: Normalization removed in schematic.js, jkw.
    Circuit.prototype.ac = function(npts,fstart,fstop,source_name) {

	if (this.dc() == undefined) { // DC failed, realloc mats and vects.
	    return undefined;
	}

	var N = this.N;
	var G = this.G;
	var C = this.C;

	// Complex numbers, we're going to need a bigger boat
	var matrixac = mat_make(2*N, (2*N)+1);

        // Get the source used for ac
	if (this.device_map[source_name] === undefined) {
	    alert('AC analysis refers to unknown source ' + source_name);
	    return 'AC analysis failed, unknown source';
	}
	this.device_map[source_name].load_ac(this,this.rhs);

	// build array to hold list of magnitude and phases for each node
	// last entry is for frequency values
	var response = new Array(2*N + 1);
	for (var i = 2*N; i >= 0; --i) response[i] = new Array();

	// multiplicative frequency increase between freq points
	var delta_f = Math.exp(Math.LN10/npts);

	var phase_offset = new Array(N);
	for (var i = N-1; i >= 0; --i) phase_offset[i] = 0;

	var f = fstart;
	fstop *= 1.0001;  // capture that last freq point!
	while (f <= fstop) {
	    var omega = 2 * Math.PI * f;
	    response[2*N].push(f);   // 2*N for magnitude and phase

	    // Find complex x+jy that sats Gx-omega*Cy=rhs; omega*Cx+Gy=0
	    // Note: solac[0:N-1]=x, solac[N:2N-1]=y
	    for (var i = N-1; i >= 0; --i) {
		// First the rhs, replicated for real and imaginary
		matrixac[i][2*N] = this.rhs[i];
		matrixac[i+N][2*N] = 0;

		for (var j = N-1; j >= 0; --j) {
		    matrixac[i][j] = G[i][j];
		    matrixac[i+N][j+N] = G[i][j];
		    matrixac[i][j+N] = -omega*C[i][j];
		    matrixac[i+N][j] = omega*C[i][j];
		}
	    }

	    // Compute the small signal response
	    var solac = mat_solve(matrixac);

	    // Save magnitude and phase
	    for (var i = N - 1; i >= 0; --i) {
		var mag = Math.sqrt(solac[i]*solac[i] + solac[i+N]*solac[i+N]);
		response[i].push(mag);

		// Avoid wrapping phase, add or sub 180 for each jump
		var phase = 180*(Math.atan2(solac[i+N],solac[i])/Math.PI);
		var phasei = response[i+N];
		var L = phasei.length;
		// Look for a one-step jump greater than 90 degrees
		if (L > 1) {
		    var phase_jump = phase + phase_offset[i] - phasei[L-1];
		    if (phase_jump > 90) {
			phase_offset[i] -= 360;
		    } else if (phase_jump < -90) {
			phase_offset[i] += 360;
		    }
		}
		response[i+N].push(phase + phase_offset[i]);
	    }
	    f *= delta_f;    // increment frequency
	}

	// create solution dictionary
	var result = new Array();
	for (var name in this.node_map) {
	    var index = this.node_map[name];
	    result[name] = (index == -1) ? 0 : response[index];
	    result[name+'_phase'] = (index == -1) ? 0 : response[index+N];
	}
	result['_frequencies_'] = response[2*N];
	return result;
    };


    // Helper for adding devices to a circuit, warns on duplicate device names.
    Circuit.prototype.add_device = function(d,name) {
	// Add device to list of devices and to device map
	this.devices.push(d);
	d.name = name;
	if (name) {
	    if (this.device_map[name] === undefined)
		this.device_map[name] = d;
	    else {
		alert('Warning: two circuit elements share the same name ' + name);
		this.device_map[name] = d;
	    }
	}
	return d;
    };

    Circuit.prototype.r = function(n1,n2,v,name) {
	// try to convert string value into numeric value, barf if we can't
	if ((typeof v) == 'string') {
	    v = parse_number(v,undefined);
	    if (v === undefined) return undefined;
	}

	if (v != 0) {
	    var d = new Resistor(n1,n2,v);
	    return this.add_device(d, name);
	} else return this.v(n1,n2,'0',name);   // zero resistance == 0V voltage source
    };

    Circuit.prototype.d = function(n1,n2,area,type,name) {
	// try to convert string value into numeric value, barf if we can't
	if ((typeof area) == 'string') {
	    area = parse_number(area,undefined);
	    if (area === undefined) return undefined;
	}

	if (area != 0) {
	    var d = new Diode(n1,n2,area,type);
	    return this.add_device(d, name);
	} // zero area diodes discarded.
    };


    Circuit.prototype.c = function(n1,n2,v,name) {
	// try to convert string value into numeric value, barf if we can't
	if ((typeof v) == 'string') {
	    v = parse_number(v,undefined);
	    if (v === undefined) return undefined;
	}
	var d = new Capacitor(n1,n2,v);
	return this.add_device(d, name);
    };

    Circuit.prototype.l = function(n1,n2,v,name) {
	// try to convert string value into numeric value, barf if we can't
	if ((typeof v) == 'string') {
	    v = parse_number(v,undefined);
	    if (v === undefined) return undefined;
	}
	var branch = this.node(undefined,T_CURRENT);
	var d = new Inductor(n1,n2,branch,v);
	return this.add_device(d, name);
    };

    Circuit.prototype.v = function(n1,n2,v,name) {
	var branch = this.node(undefined,T_CURRENT);
	var d = new VSource(n1,n2,branch,v);
	this.voltage_sources.push(d);
	return this.add_device(d, name);
    };

    Circuit.prototype.i = function(n1,n2,v,name) {
	var d = new ISource(n1,n2,v);
	this.current_sources.push(d);
	return this.add_device(d, name);
    };

    Circuit.prototype.opamp = function(np,nn,no,ng,A,name) {
	// try to convert string value into numeric value, barf if we can't
	if ((typeof A) == 'string') {
	    ratio = parse_number(A,undefined);
	    if (A === undefined) return undefined;
	}
	var branch = this.node(undefined,T_CURRENT);
	var d = new Opamp(np,nn,no,ng,branch,A,name);
	return this.add_device(d, name);
    };

    Circuit.prototype.n = function(d,g,s, ratio, name) {
	// try to convert string value into numeric value, barf if we can't
	if ((typeof ratio) == 'string') {
	    ratio = parse_number(ratio,undefined);
	    if (ratio === undefined) return undefined;
	}
	var d = new Fet(d,g,s,ratio,name,'n');
	return this.add_device(d, name);
    };

    Circuit.prototype.p = function(d,g,s, ratio, name) {
	// try to convert string value into numeric value, barf if we can't
	if ((typeof ratio) == 'string') {
	    ratio = parse_number(ratio,undefined);
	    if (ratio === undefined) return undefined;
	}
	var d = new Fet(d,g,s,ratio,name,'p');
	return this.add_device(d, name);
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Support for creating conductance and capacitance matrices associated with
    //  modified nodal analysis (unknowns are node voltages and inductor and voltage
    //  source currents).
    //  The linearized circuit is written as
    //          C d/dt x = G x + rhs
    //  x - vector of node voltages and element currents
    //  rhs - vector of source values
    //  C - Matrix whose values are capacitances and inductances, has many zero rows.
    //  G - Matrix whose values are conductances and +-1's.
    //
    ////////////////////////////////////////////////////////////////////////////////

    // add val component between two nodes to matrix M
    // Index of -1 refers to ground node
    Circuit.prototype.add_two_terminal = function(i,j,g,M) {
	if (i >= 0) {
	    M[i][i] += g;
	    if (j >= 0) {
		M[i][j] -= g;
		M[j][i] -= g;
		M[j][j] += g;
	    }
	} else if (j >= 0)
	M[j][j] += g;
    };

    // add val component between two nodes to matrix M
    // Index of -1 refers to ground node
    Circuit.prototype.get_two_terminal = function(i,j,x) {
	var xi_minus_xj = 0;
	if (i >= 0) xi_minus_xj = x[i];
	if (j >= 0) xi_minus_xj -= x[j];
	return xi_minus_xj
    };

    Circuit.prototype.add_conductance_l = function(i,j,g) {
        this.add_two_terminal(i,j,g, this.Gl);
    };

    Circuit.prototype.add_conductance = function(i,j,g) {
        this.add_two_terminal(i,j,g, this.G);
    };

    Circuit.prototype.add_capacitance = function(i,j,c) {
        this.add_two_terminal(i,j,c,this.C);
    };

    // add individual conductance to Gl matrix
    Circuit.prototype.add_to_Gl = function(i,j,g) {
	if (i >=0 && j >= 0)
	    this.Gl[i][j] += g;
    };

    // add individual conductance to Gl matrix
    Circuit.prototype.add_to_G = function(i,j,g) {
	if (i >=0 && j >= 0)
	    this.G[i][j] += g;
    };

    // add individual capacitance to C matrix
    Circuit.prototype.add_to_C = function(i,j,c) {
	if (i >=0 && j >= 0)
	    this.C[i][j] += c;
    };

    // add source info to rhs
    Circuit.prototype.add_to_rhs = function(i,v,rhs) {
	if (i >= 0)	rhs[i] += v;
    };


    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Generic matrix support - making, copying, factoring, rank, etc
    //  Note, Matrices are stored using nested javascript arrays.
    ////////////////////////////////////////////////////////////////////////////////

    // Allocate an NxM matrix
    function mat_make(N,M) {
	var mat = new Array(N);
	for (var i = N - 1; i >= 0; --i) {
	    mat[i] = new Array(M);
	    for (var j = M - 1; j >= 0; --j) {
		mat[i][j] = 0.0;
	    }
	}
	return mat;
    }

    // Form b = scale*Mx
    function mat_v_mult(M,x,b,scale) {
	var n = M.length;
	var m = M[0].length;

	if (n != b.length || m != x.length)
	    throw 'Rows of M mismatched to b or cols mismatch to x.';

	for (var i = 0; i < n; i++) {
	    var temp = 0;
	    for (var j = 0; j < m; j++) temp += M[i][j]*x[j];
	    b[i] = scale*temp;  // Recall the neg in the name
	}
    }

    // C = scalea*A + scaleb*B, scalea, scaleb eithers numbers or arrays (row scaling)
    function mat_scale_add(A, B, scalea, scaleb, C) {
	var n = A.length;
	var m = A[0].length;

	if (n > B.length || m > B[0].length)
	    throw 'Row or columns of A to large for B';
	if (n > C.length || m > C[0].length)
	    throw 'Row or columns of A to large for C';
	if ((typeof scalea == 'number') && (typeof scaleb == 'number'))
	    for (var i = 0; i < n; i++)
		for (var j = 0; j < m; j++)
		    C[i][j] = scalea*A[i][j] + scaleb*B[i][j];
	else if ((typeof scaleb == 'number') && (scalea instanceof Array))
	    for (var i = 0; i < n; i++)
		for (var j = 0; j < m; j++)
		    C[i][j] = scalea[i]*A[i][j] + scaleb*B[i][j];
	else if ((typeof scaleb instanceof Array) && (scalea instanceof Array))
	    for (var i = 0; i < n; i++)
		for (var j = 0; j < m; j++)
		    C[i][j] = scalea[i]*A[i][j] + scaleb[i]*B[i][j];
	else
	    throw 'scalea and scaleb must be scalars or Arrays';
    }

    // Returns a vector of ones and zeros, ones denote algebraic
    // variables (rows that can be removed without changing rank(M).
    Circuit.prototype.algebraic = function(M) {
	var Nr = M.length
	Mc = mat_make(Nr, Nr);
	mat_copy(M,Mc);
	var R = mat_rank(Mc);

	var one_if_alg = new Array(Nr);
	for (var row = 0; row < Nr; row++) {  // psuedo gnd row small
	    for (var col = Nr - 1; col >= 0; --col)
		Mc[row][col] = 0;
	    if (mat_rank(Mc) == R)  // Zeroing row left rank unchanged
		one_if_alg[row] = 1;
	    else { // Zeroing row changed rank, put back
		for (var col = Nr - 1; col >= 0; --col)
		    Mc[row][col] = M[row][col];
		one_if_alg[row] = 0;
	    }
	}
	return one_if_alg;
    }

    // Copy A -> using the bounds of A
    function mat_copy(src,dest) {
	var n = src.length;
	var m = src[0].length;
	if (n > dest.length || m >  dest[0].length)
	    throw 'Rows or cols > rows or cols of dest';

	for (var i = 0; i < n; i++)
	    for (var j = 0; j < m; j++)
		dest[i][j] = src[i][j];
    }

    // Copy and transpose A -> using the bounds of A
    function mat_copy_transposed(src,dest) {
	var n = src.length;
	var m = src[0].length;
	if (n > dest[0].length || m >  dest.length)
	    throw 'Rows or cols > cols or rows of dest';

	for (var i = 0; i < n; i++)
	    for (var j = 0; j < m; j++)
		dest[j][i] = src[i][j];
    }


    // Uses GE to determine rank.
    function mat_rank(Mo) {
	var Nr = Mo.length;  // Number of rows
	var Nc = Mo[0].length;  // Number of columns
	var temp,i,j;
	// Make a copy to avoid overwriting
	M = mat_make(Nr, Nc);
	mat_copy(Mo,M);

	// Find matrix maximum entry
	var max_abs_entry = 0;
	for(var row = Nr-1; row >= 0; --row) {
	    for(var col = Nr-1; col >= 0; --col) {
		if (Math.abs(M[row][col]) > max_abs_entry)
		    max_abs_entry = Math.abs(M[row][col]);
	    }
	}

	// Gaussian elimination to find rank
	var the_rank = 0;
	var start_col = 0;
	for (var row = 0; row < Nr; row++) {
	    // Search for first nonzero column in the remaining rows.
	    for (var col = start_col; col < Nc; col++) {
		var max_v = Math.abs(M[row][col]);
		var max_row = row;
		for (var i = row + 1; i < Nr; i++) {
		    temp = Math.abs(M[i][col]);
		    if (temp > max_v) { max_v = temp; max_row = i; }
		}
		// if max_v non_zero, column is nonzero, eliminate in subsequent rows
		if (Math.abs(max_v) > eps*max_abs_entry) {
		    start_col = col+1;
		    the_rank += 1;
		    // Swap rows to get max in M[row][col]
		    temp = M[row];
		    M[row] = M[max_row];
		    M[max_row] = temp;

		    // now eliminate this column for all subsequent rows
		    for (var i = row + 1; i < Nr; i++) {
			temp = M[i][col]/M[row][col];   // multiplier for current row
			if (temp != 0)  // subtract
			    for (var j = col; j < Nc; j++) M[i][j] -= M[row][j]*temp;
		    }
		    // Now move on to the next row
		    break;
		}
	    }
	}

	// return the rank
	return the_rank;
    }

    // Solve Mx=b and return vector x using R^TQ^T factorization.
    // Multiplication by R^T implicit, should be null-space free soln.
    // M should have the extra column!
    // Almost everything is in-lined for speed, sigh.
    function mat_solve_rq(M, rhs) {

	var Nr = M.length;  // Number of rows
	var Nc = M[0].length;  // Number of columns

	// Copy the rhs in to the last column of M if one is given.
	if (rhs != null) {
	    for (var row = Nr - 1; row >= 0; --row)
		M[row][Nc-1] = rhs[row];
	}

	var mat_scale = 0; // Sets the scale for comparison to zero.
	var max_nonzero_row = Nr-1;  // Assumes M nonsingular.
	for (var row = 0; row < Nr; row++) {
	    // Find largest row with largest 2-norm
	    var max_row = row;
	    var maxsumsq = 0;
	    for (var rowp = row; rowp < Nr; rowp++) {
		var Mr = M[rowp];
		var sumsq = 0;
		for (var col = Nc-2; col >= 0; --col)  // Last col=rhs
		    sumsq += Mr[col]*Mr[col];
		if ((row == rowp) || (sumsq > maxsumsq)) {
		    max_row = rowp;
		    maxsumsq = sumsq;
		}
	    }
	    if (max_row > row) { // Swap rows if not max row
		var temp = M[row];
		M[row] = M[max_row];
		M[max_row] = temp;
	    }

	    // Calculate row norm, save if this is first (largest)
	    row_norm = Math.sqrt(maxsumsq);
	    if (row == 0) mat_scale = row_norm;

	    // Check for all zero rows
	    if (row_norm > mat_scale*eps)
		scale = 1.0/row_norm;
	    else {
		max_nonzero_row = row - 1;  // Rest will be nullspace of M
		break;
	    }


	    // Nonzero row, eliminate from rows below
	    var Mr = M[row];
	    for (var col =  Nc-1; col >= 0; --col) // Scale rhs also
		Mr[col] *= scale;
	    for (var rowp = row + 1; rowp < Nr; rowp++) { // Update.
		var Mrp = M[rowp];
		var inner = 0;
		for (var col =  Nc-2; col >= 0; --col)  // Project
		    inner += Mr[col]*Mrp[col];
		for (var col =  Nc-1; col >= 0; --col) // Ortho (rhs also)
		    Mrp[col] -= inner *Mr[col];
	    }
	}

	// Last Column of M has inv(R^T)*rhs.  Scale rows of Q to get x.
	var x = new Array(Nc-1);
	for (var col = Nc-2; col >= 0; --col)
	    x[col] = 0;
	for (var row = max_nonzero_row; row >= 0; --row) {
	    Mr = M[row];
	    for (var col = Nc-2; col >= 0; --col) {
		x[col] += Mr[col]*Mr[Nc-1];
	    }
	}

	// Return solution.
	return x;
    }

    // solve Mx=b and return vector x given augmented matrix M = [A | b]
    // Uses Gaussian elimination with partial pivoting
    function mat_solve(M,rhs) {
	var N = M.length;      // augmented matrix M has N rows, N+1 columns
	var temp,i,j;

	// Copy the rhs in to the last column of M if one is given.
	if (rhs != null) {
	    for (var row = 0; row < N ; row++)
		M[row][N] = rhs[row];
	}

	// gaussian elimination
	for (var col = 0; col < N ; col++) {
	    // find pivot: largest abs(v) in this column of remaining rows
	    var max_v = Math.abs(M[col][col]);
	    var max_col = col;
	    for (i = col + 1; i < N; i++) {
		temp = Math.abs(M[i][col]);
		if (temp > max_v) { max_v = temp; max_col = i; }
	    }

	    // if no value found, generate a small conductance to gnd
	    // otherwise swap current row with pivot row
	    if (max_v == 0) M[col][col] = eps;
	    else {
		temp = M[col];
		M[col] = M[max_col];
		M[max_col] = temp;
	    }

	    // now eliminate this column for all subsequent rows
	    for (i = col + 1; i < N; i++) {
		temp = M[i][col]/M[col][col];   // multiplier we'll use for current row
		if (temp != 0)
		    // subtract current row from row we're working on
		    // remember to process b too!
		    for (j = col; j <= N; j++) M[i][j] -= M[col][j]*temp;
	    }
	}

	// matrix is now upper triangular, so solve for elements of x starting
	// with the last row
	var x = new Array(N);
	for (i = N-1; i >= 0; --i) {
	    temp = M[i][N];   // grab b[i] from augmented matrix as RHS
	    // subtract LHS term from RHS using known x values
	    for (j = N-1; j > i; --j) temp -= M[i][j]*x[j];
	    // now compute new x value
	    x[i] = temp/M[i][i];
	}

	// return solution
	return x;
    }

    // test solution code, expect x = [2,3,-1]
    //M = [[2,1,-1,8],[-3,-1,2,-11],[-2,1,2,-3]];
    //x = mat_solve(M);
    //y = 1;  // so we have place to set a breakpoint :)

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Device base class
    //
    ////////////////////////////////////////////////////////////////////////////////

    function Device() {
    }

    // complete initial set up of device
    Device.prototype.finalize = function() {
    };

    // Load the linear elements in to Gl and C
    Device.prototype.load_linear = function(ckt) {
    };

    // load linear system equations for dc analysis
    // (inductors shorted and capacitors opened)
    Device.prototype.load_dc = function(ckt,soln,rhs) {
    };

    // load linear system equations for tran analysis
    Device.prototype.load_tran = function(ckt,soln) {
    };

    // load linear system equations for ac analysis:
    // current sources open, voltage sources shorted
    // linear models at operating point for everyone else
    Device.prototype.load_ac = function(ckt,rhs) {
    };

    // return time of next breakpoint for the device
    Device.prototype.breakpoint = function(time) {
	return undefined;
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Parse numbers in engineering notation
    //
    ///////////////////////////////////////////////////////////////////////////////

    // convert first character of argument into an integer
    function ord(ch) {
	return ch.charCodeAt(0);
    }

    // convert string argument to a number, accepting usual notations
    // (hex, octal, binary, decimal, floating point) plus engineering
    // scale factors (eg, 1k = 1000.0 = 1e3).
    // return default if argument couldn't be interpreted as a number
    function parse_number(s,default_v) {
	var slen = s.length;
	var multiplier = 1;
	var result = 0;
	var index = 0;

	// skip leading whitespace
	while (index < slen && s.charAt(index) <= ' ') index += 1;
	if (index == slen) return default_v;

	// check for leading sign
	if (s.charAt(index) == '-') {
	    multiplier = -1;
	    index += 1;
	} else if (s.charAt(index) == '+')
	index += 1;
	var start = index;   // remember where digits start

	// if leading digit is 0, check for hex, octal or binary notation
	if (index >= slen) return default_v;
	else if (s.charAt(index) == '0') {
	    index += 1;
	    if (index >= slen) return 0;
	    if (s.charAt(index) == 'x' || s.charAt(index) == 'X') { // hex
		while (true) {
		    index += 1;
		    if (index >= slen) break;
		    if (s.charAt(index) >= '0' && s.charAt(index) <= '9')
			result = result*16 + ord(s.charAt(index)) - ord('0');
		    else if (s.charAt(index) >= 'A' && s.charAt(index) <= 'F')
			result = result*16 + ord(s.charAt(index)) - ord('A') + 10;
		    else if (s.charAt(index) >= 'a' && s.charAt(index) <= 'f')
			result = result*16 + ord(s.charAt(index)) - ord('a') + 10;
		    else break;
		}
		return result*multiplier;
	    } else if (s.charAt(index) == 'b' || s.charAt(index) == 'B') {  // binary
		while (true) {
		    index += 1;
		    if (index >= slen) break;
		    if (s.charAt(index) >= '0' && s.charAt(index) <= '1')
			result = result*2 + ord(s.charAt(index)) - ord('0');
		    else break;
		}
		return result*multiplier;
	    } else if (s.charAt(index) != '.') { // octal
		while (true) {
		    if (s.charAt(index) >= '0' && s.charAt(index) <= '7')
			result = result*8 + ord(s.charAt(index)) - ord('0');
		    else break;
		    index += 1;
		    if (index >= slen) break;
		}
		return result*multiplier;
	    }
	}

	// read decimal integer or floating-point number
	while (true) {
	    if (s.charAt(index) >= '0' && s.charAt(index) <= '9')
		result = result*10 + ord(s.charAt(index)) - ord('0');
	    else break;
	    index += 1;
	    if (index >= slen) break;
	}

	// fractional part?
	if (index < slen && s.charAt(index) == '.') {
	    while (true) {
		index += 1;
		if (index >= slen) break;
		if (s.charAt(index) >= '0' && s.charAt(index) <= '9') {
		    result = result*10 + ord(s.charAt(index)) - ord('0');
		    multiplier *= 0.1;
		} else break;
	    }
	}

	// if we haven't seen any digits yet, don't check
	// for exponents or scale factors
	if (index == start) return default_v;

	// type of multiplier determines type of result:
	// multiplier is a float if we've seen digits past
	// a decimal point, otherwise it's an int or long.
	// Up to this point result is an int or long.
	result *= multiplier;

	// now check for exponent or engineering scale factor.  If there
	// is one, result will be a float.
	if (index < slen) {
	    var scale = s.charAt(index);
	    index += 1;
	    if (scale == 'e' || scale == 'E') {
		var exponent = 0;
		multiplier = 10.0;
		if (index < slen) {
		    if (s.charAt(index) == '+') index += 1;
		    else if (s.charAt(index) == '-') {
			index += 1;
			multiplier = 0.1;
		    }
		}
		while (index < slen) {
		    if (s.charAt(index) >= '0' && s.charAt(index) <= '9') {
			exponent = exponent*10 + ord(s.charAt(index)) - ord('0');
			index += 1;
		    } else break;
		}
		while (exponent > 0) {
		    exponent -= 1;
		    result *= multiplier;
		}
	    } else if (scale == 't' || scale == 'T') result *= 1e12;
	    else if (scale == 'g' || scale == 'G') result *= 1e9;
	    else if (scale == 'M') result *= 1e6;
	    else if (scale == 'k' || scale == 'K') result *= 1e3;
	    else if (scale == 'm') result *= 1e-3;
	    else if (scale == 'u' || scale == 'U') result *= 1e-6;
	    else if (scale == 'n' || scale == 'N') result *= 1e-9;
	    else if (scale == 'p' || scale == 'P') result *= 1e-12;
	    else if (scale == 'f' || scale == 'F') result *= 1e-15;
	}
	// ignore any remaining chars, eg, 1kohms returns 1000
	return result;
    }

    Circuit.prototype.parse_number = parse_number;  // make it easy to call from outside

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Sources
    //
    ///////////////////////////////////////////////////////////////////////////////

    // argument is a string describing the source's value (see comments for details)
    // source types: dc,step,square,triangle,sin,pulse,pwl,pwl_repeating

    // returns an object with the following attributes:
    //   fun -- name of source function
    //   args -- list of argument values
    //   value(t) -- compute source value at time t
    //   inflection_point(t) -- compute time after t when a time point is needed
    //   dc -- value at time 0
    //   period -- repeat period for periodic sources (0 if not periodic)

    function parse_source(v) {
	// generic parser: parse v as either <value> or <fun>(<value>,...)
	var src = new Object();
	src.period = 0; // Default not periodic
	src.value = function(t) { return 0; };  // overridden below
	src.inflection_point = function(t) { return undefined; };  // may be overridden below

	// see if there's a "(" in the description
	var index = v.indexOf('(');
	var ch;
	if (index >= 0) {
	    src.fun = v.slice(0,index);   // function name is before the "("
	    src.args = [];	// we'll push argument values onto this list
	    var end = v.indexOf(')',index);
	    if (end == -1) end = v.length;

	    index += 1;     // start parsing right after "("
	    while (index < end) {
		// figure out where next argument value starts
		ch = v.charAt(index);
		if (ch <= ' ') { index++; continue; }
		// and where it ends
		var arg_end = v.indexOf(',',index);
		if (arg_end == -1) arg_end = end;
		// parse and save result in our list of arg values
		src.args.push(parse_number(v.slice(index,arg_end),undefined));
		index = arg_end + 1;
	    }
	} else {
	    src.fun = 'dc';
	    src.args = [parse_number(v,0)];
	}

	// post-processing for constant sources
	// dc(v)
	if (src.fun == 'dc') {
	    var v = arg_value(src.args,0,0);
	    src.args = [v];
	    src.value = function(t) { return v; }; // closure
	}

	// post-processing for impulse sources
	// impulse(height,width)
	else if (src.fun == 'impulse') {
	    var h = arg_value(src.args,0,1);  // default height: 1
	    var w = Math.abs(arg_value(src.args,2,1e-9));  // default width: 1ns
	    src.args = [h,w];  // remember any defaulted values
	    pwl_source(src,[0,0,w/2,h,w,0],false);
	}

	// post-processing for step sources
	// step(v_init,v_plateau,t_delay,t_rise)
	else if (src.fun == 'step') {
	    var v1 = arg_value(src.args,0,0);  // default init value: 0V
	    var v2 = arg_value(src.args,1,1);  // default plateau value: 1V
	    var td = Math.max(0,arg_value(src.args,2,0));  // time step starts
	    var tr = Math.abs(arg_value(src.args,3,1e-9));  // default rise time: 1ns
	    src.args = [v1,v2,td,tr];  // remember any defaulted values
	    pwl_source(src,[td,v1,td+tr,v2],false);
	}

	// post-processing for square wave
	// square(v_init,v_plateau,freq,duty_cycle)
	else if (src.fun == 'square') {
	    var v1 = arg_value(src.args,0,0);  // default init value: 0V
	    var v2 = arg_value(src.args,1,1);  // default plateau value: 1V
	    var freq = Math.abs(arg_value(src.args,2,1));  // default frequency: 1Hz
	    var duty_cycle  = Math.min(100,Math.abs(arg_value(src.args,3,50)));  // default duty cycle: 0.5
	    src.args = [v1,v2,freq,duty_cycle];  // remember any defaulted values

	    var per = freq == 0 ? Infinity : 1/freq;
	    var t_change = 0.01 * per;   // rise and fall time
	    var t_pw = .01 * duty_cycle * 0.98 * per;  // fraction of cycle minus rise and fall time
	    pwl_source(src,[0,v1,t_change,v2,t_change+t_pw,
			    v2,t_change+t_pw+t_change,v1,per,v1],true);
	}

	// post-processing for triangle
	// triangle(v_init,v_plateua,t_period)
	else if (src.fun == 'triangle') {
	    var v1 = arg_value(src.args,0,0);  // default init value: 0V
	    var v2 = arg_value(src.args,1,1);  // default plateau value: 1V
	    var freq = Math.abs(arg_value(src.args,2,1));  // default frequency: 1s
	    src.args = [v1,v2,freq];  // remember any defaulted values

	    var per = freq == 0 ? Infinity : 1/freq;
	    pwl_source(src,[0,v1,per/2,v2,per,v1],true);
	}

	// post-processing for pwl and pwlr sources
	// pwl[r](t1,v1,t2,v2,...)
	else if (src.fun == 'pwl' || src.fun == 'pwl_repeating') {
	    pwl_source(src,src.args,src.fun == 'pwl_repeating');
	}

	// post-processing for pulsed sources
	// pulse(v_init,v_plateau,t_delay,t_rise,t_fall,t_width,t_period)
	else if (src.fun == 'pulse') {
	    var v1 = arg_value(src.args,0,0);  // default init value: 0V
	    var v2 = arg_value(src.args,1,1);  // default plateau value: 1V
	    var td = Math.max(0,arg_value(src.args,2,0));  // time pulse starts
	    var tr = Math.abs(arg_value(src.args,3,1e-9));  // default rise time: 1ns
	    var tf = Math.abs(arg_value(src.args,4,1e-9));  // default rise time: 1ns
	    var pw = Math.abs(arg_value(src.args,5,1e9));  // default pulse width: "infinite"
	    var per = Math.abs(arg_value(src.args,6,1e9));  // default period: "infinite"
	    src.args = [v1,v2,td,tr,tf,pw,per];

	    var t1 = td;       // time when v1 -> v2 transition starts
	    var t2 = t1 + tr;  // time when v1 -> v2 transition ends
	    var t3 = t2 + pw;  // time when v2 -> v1 transition starts
	    var t4 = t3 + tf;  // time when v2 -> v1 transition ends

	    pwl_source(src,[t1,v1, t2,v2, t3,v2, t4,v1, per,v1],true);
	}

	// post-processing for sinusoidal sources
	// sin(v_offset,v_amplitude,freq_hz,t_delay,phase_offset_degrees)
	else if (src.fun == 'sin') {
	    var voffset = arg_value(src.args,0,0);  // default offset voltage: 0V
	    var va = arg_value(src.args,1,1);  // default amplitude: -1V to 1V
	    var freq = Math.abs(arg_value(src.args,2,1));  // default frequency: 1Hz
	    src.period = 1.0/freq;

	    var td = Math.max(0,arg_value(src.args,3,0));  // default time delay: 0sec
	    var phase = arg_value(src.args,4,0);  // default phase offset: 0 degrees
	    src.args = [voffset,va,freq,td,phase];

	    phase /= 360.0;

	    // return value of source at time t
	    src.value = function(t) {  // closure
		if (t < td) return voffset + va*Math.sin(2*Math.PI*phase);
		else return voffset + va*Math.sin(2*Math.PI*(freq*(t - td) + phase));
	    };

	    // return time of next inflection point after time t
	    src.inflection_point = function(t) {	// closure
		if (t < td) return td;
		else return undefined;
	    };
	}

	// object has all the necessary info to compute the source value and inflection points
	src.dc = src.value(0);   // DC value is value at time 0
	return src;
    }

    function pwl_source(src,tv_pairs,repeat) {
	var nvals = tv_pairs.length;
	if (repeat)
	    src.period = tv_pairs[nvals-2];  // Repeat period of source
	if (nvals % 2 == 1) npts -= 1;  // make sure it's even!

	if (nvals <= 2) {
	    // handle degenerate case
	    src.value = function(t) { return nvals == 2 ? tv_pairs[1] : 0; };
	    src.inflection_point = function(t) { return undefined; };
	} else {
	    src.value = function(t) { // closure
		if (repeat)
		    // make time periodic if values are to be repeated
		    t = Math.fmod(t,tv_pairs[nvals-2]);
		var last_t = tv_pairs[0];
		var last_v = tv_pairs[1];
		if (t > last_t) {
		    var next_t,next_v;
		    for (var i = 2; i < nvals; i += 2) {
			next_t = tv_pairs[i];
			next_v = tv_pairs[i+1];
			if (next_t > last_t)  // defend against bogus tv pairs
			    if (t < next_t)
				return last_v + (next_v - last_v)*(t - last_t)/(next_t - last_t);
			last_t = next_t;
			last_v = next_v;
		    }
		}
		return last_v;
	    };
	    src.inflection_point = function(t) {  // closure
		if (repeat)
		    // make time periodic if values are to be repeated
		    t = Math.fmod(t,tv_pairs[nvals-2]);
		for (var i = 0; i < nvals; i += 2) {
		    var next_t = tv_pairs[i];
		    if (t < next_t) return next_t;
		}
		return undefined;
	    };
	}
    }

    // helper function: return args[index] if present, else default_v
    function arg_value(args,index,default_v) {
	if (index < args.length) {
	    var result = args[index];
	    if (result === undefined) result = default_v;
	    return result;
	} else return default_v;
    }

    // we need fmod in the Math library!
    Math.fmod = function(numerator,denominator) {
	var quotient = Math.floor(numerator/denominator);
	return numerator - quotient*denominator;
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Sources
    //
    ///////////////////////////////////////////////////////////////////////////////

    function VSource(npos,nneg,branch,v) {
	Device.call(this);

	this.src = parse_source(v);
	this.npos = npos;
	this.nneg = nneg;
	this.branch = branch;
    }
    VSource.prototype = new Device();
    VSource.prototype.constructor = VSource;

    // load linear part for source evaluation
    VSource.prototype.load_linear = function(ckt) {
	// MNA stamp for independent voltage source
	ckt.add_to_Gl(this.branch,this.npos,1.0);
	ckt.add_to_Gl(this.branch,this.nneg,-1.0);
	ckt.add_to_Gl(this.npos,this.branch,1.0);
	ckt.add_to_Gl(this.nneg,this.branch,-1.0);
    };

    // Source voltage added to b.
    VSource.prototype.load_dc = function(ckt,soln,rhs) {
	ckt.add_to_rhs(this.branch,this.src.dc,rhs);
    };

    // Load time-dependent value for voltage source for tran
    VSource.prototype.load_tran = function(ckt,soln,rhs,time) {
	ckt.add_to_rhs(this.branch,this.src.value(time),rhs);
    };

    // return time of next breakpoint for the device
    VSource.prototype.breakpoint = function(time) {
	return this.src.inflection_point(time);
    };

    // small signal model ac value
    VSource.prototype.load_ac = function(ckt,rhs) {
	ckt.add_to_rhs(this.branch,1.0,rhs);
    };

    function ISource(npos,nneg,v) {
	Device.call(this);

	this.src = parse_source(v);
	this.npos = npos;
	this.nneg = nneg;
    }
    ISource.prototype = new Device();
    ISource.prototype.constructor = ISource;

    ISource.prototype.load_linear = function(ckt) {
	// Current source is open when off, no linear contribution
    };

    // load linear system equations for dc analysis
    ISource.prototype.load_dc = function(ckt,soln,rhs) {
	var is = this.src.dc;

	// MNA stamp for independent current source
	ckt.add_to_rhs(this.npos,-is,rhs);  // current flow into npos
	ckt.add_to_rhs(this.nneg,is,rhs);   // and out of nneg
    };

    // load linear system equations for tran analysis (just like DC)
    ISource.prototype.load_tran = function(ckt,soln,rhs,time) {
	var is = this.src.value(time);

	// MNA stamp for independent current source
	ckt.add_to_rhs(this.npos,-is,rhs);  // current flow into npos
	ckt.add_to_rhs(this.nneg,is,rhs);   // and out of nneg
    };

    // return time of next breakpoint for the device
    ISource.prototype.breakpoint = function(time) {
	return this.src.inflection_point(time);
    };

    // small signal model: open circuit
    ISource.prototype.load_ac = function(ckt,rhs) {
	// MNA stamp for independent current source
	ckt.add_to_rhs(this.npos,-1.0,rhs);  // current flow into npos
	ckt.add_to_rhs(this.nneg,1.0,rhs);   // and out of nneg
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Resistor
    //
    ///////////////////////////////////////////////////////////////////////////////

    function Resistor(n1,n2,v) {
	Device.call(this);
	this.n1 = n1;
	this.n2 = n2;
	this.g = 1.0/v;
    }
    Resistor.prototype = new Device();
    Resistor.prototype.constructor = Resistor;

    Resistor.prototype.load_linear = function(ckt) {
	// MNA stamp for admittance g
	ckt.add_conductance_l(this.n1,this.n2,this.g);
    };

    Resistor.prototype.load_dc = function(ckt) {
	// Nothing to see here, move along.
    };

    Resistor.prototype.load_tran = function(ckt,soln) {
    };

    Resistor.prototype.load_ac = function(ckt) {
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Diode
    //
    ///////////////////////////////////////////////////////////////////////////////

    function Diode(n1,n2,v,type) {
	Device.call(this);
	this.anode = n1;
	this.cathode = n2;
	this.area = v;
	this.type = type;  // 'normal' or 'ideal'
	this.is = 1.0e-14;
	this.ais = this.area * this.is;
	this.vt = (type == 'normal') ? 25.8e-3 : 0.1e-3;  // 26mv or .1mv
	this.exp_arg_max = 50;  // less than single precision max.
	this.exp_max = Math.exp(this.exp_arg_max);
    }
    Diode.prototype = new Device();
    Diode.prototype.constructor = Diode;

    Diode.prototype.load_linear = function(ckt) {
	// Diode is not linear, has no linear piece.
    };

    Diode.prototype.load_dc = function(ckt,soln,rhs) {
	var vd = ckt.get_two_terminal(this.anode, this.cathode, soln);
	var exp_arg = vd / this.vt;
	var temp1, temp2;
	// Estimate exponential with a quadratic if arg too big.
	var abs_exp_arg = Math.abs(exp_arg);
	var d_arg = abs_exp_arg - this.exp_arg_max;
	if (d_arg > 0) {
	    var quad = 1 + d_arg + 0.5*d_arg*d_arg;
	    temp1 = this.exp_max * quad;
	    temp2 = this.exp_max * (1 + d_arg);
	} else {
	    temp1 = Math.exp(abs_exp_arg);
	    temp2 = temp1;
	}
	if (exp_arg < 0) {  // Use exp(-x) = 1.0/exp(x)
	    temp1 = 1.0/temp1;
	    temp2 = (temp1*temp2)*temp1;
	}
	var id = this.ais * (temp1 - 1);
	var gd = this.ais * (temp2 / this.vt);

	// MNA stamp for independent current source
	ckt.add_to_rhs(this.anode,-id,rhs);  // current flows into anode
	ckt.add_to_rhs(this.cathode,id,rhs);   // and out of cathode
	ckt.add_conductance(this.anode,this.cathode,gd);
    };

    Diode.prototype.load_tran = function(ckt,soln,rhs,time) {
	this.load_dc(ckt,soln,rhs);
    };

    Diode.prototype.load_ac = function(ckt) {
    };


    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Capacitor
    //
    ///////////////////////////////////////////////////////////////////////////////

    function Capacitor(n1,n2,v) {
	Device.call(this);
	this.n1 = n1;
	this.n2 = n2;
	this.value = v;
    }
    Capacitor.prototype = new Device();
    Capacitor.prototype.constructor = Capacitor;

    Capacitor.prototype.load_linear = function(ckt) {
	// MNA stamp for capacitance matrix
	ckt.add_capacitance(this.n1,this.n2,this.value);
    };

    Capacitor.prototype.load_dc = function(ckt,soln,rhs) {
    };

    Capacitor.prototype.load_ac = function(ckt) {
    };

    Capacitor.prototype.load_tran = function(ckt) {
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Inductor
    //
    ///////////////////////////////////////////////////////////////////////////////

    function Inductor(n1,n2,branch,v) {
	Device.call(this);
	this.n1 = n1;
	this.n2 = n2;
	this.branch = branch;
	this.value = v;
    }
    Inductor.prototype = new Device();
    Inductor.prototype.constructor = Inductor;

    Inductor.prototype.load_linear = function(ckt) {
	// MNA stamp for inductor linear part
	// L on diag of C because L di/dt = v(n1) - v(n2)
	ckt.add_to_Gl(this.n1,this.branch,1);
	ckt.add_to_Gl(this.n2,this.branch,-1);
	ckt.add_to_Gl(this.branch,this.n1,-1);
	ckt.add_to_Gl(this.branch,this.n2,1);
	ckt.add_to_C(this.branch,this.branch,this.value)
    }

    Inductor.prototype.load_dc = function(ckt,soln,rhs) {
	// Inductor is a short at dc, so is linear.
    }

    Inductor.prototype.load_ac = function(ckt) {
    }

    Inductor.prototype.load_tran = function(ckt) {
    }



    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Simple Voltage-Controlled Voltage Source Op Amp model
    //
    ///////////////////////////////////////////////////////////////////////////////

    function Opamp(np,nn,no,ng,branch,A,name) {
	Device.call(this);
	this.np = np;
	this.nn = nn;
	this.no = no;
	this.ng = ng;
	this.branch = branch;
	this.gain = A;
	this.name = name;
    }

    Opamp.prototype = new Device();
    Opamp.prototype.constructor = Opamp;

    Opamp.prototype.load_linear = function(ckt) {
        // MNA stamp for VCVS: 1/A(v(no) - v(ng)) - (v(np)-v(nn))) = 0.
	var invA = 1.0/this.gain;
	ckt.add_to_Gl(this.no,this.branch,1);
	ckt.add_to_Gl(this.ng,this.branch,-1);
	ckt.add_to_Gl(this.branch,this.no,invA);
	ckt.add_to_Gl(this.branch,this.ng,-invA);
	ckt.add_to_Gl(this.branch,this.np,-1);
	ckt.add_to_Gl(this.branch,this.nn,1);
    };

    Opamp.prototype.load_dc = function(ckt,soln,rhs) {
	// Op-amp is linear.
    };

    Opamp.prototype.load_ac = function(ckt) {
    };

    Opamp.prototype.load_tran = function(ckt) {
    };



    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Simplified MOS FET with no bulk connection and no body effect.
    //
    ///////////////////////////////////////////////////////////////////////////////


    function Fet(d,g,s,ratio,name,type) {
	Device.call(this);
	this.d = d;
	this.g = g;
	this.s = s;
	this.name = name;
	this.ratio = ratio;
	if (type != 'n' && type != 'p')
	{ throw 'fet type is not n or p';
	}
	this.type_sign = (type == 'n') ? 1 : -1;
	this.vt = 0.5;
	this.kp = 20e-6;
        this.beta = this.kp * this.ratio;
	this.lambda = 0.05;
    }
    Fet.prototype = new Device();
    Fet.prototype.constructor = Fet;

    Fet.prototype.load_linear = function(ckt) {
	// FET's are nonlinear, just like javascript progammers
    };

    Fet.prototype.load_dc = function(ckt,soln,rhs) {
	var vds = this.type_sign * ckt.get_two_terminal(this.d, this.s, soln);
	if (vds < 0) { // Drain and source have swapped roles
	    var temp = this.d;
	    this.d = this.s;
	    this.s = temp;
	    vds = this.type_sign * ckt.get_two_terminal(this.d, this.s, soln);
	}
	var vgs = this.type_sign * ckt.get_two_terminal(this.g, this.s, soln);
	var vgst = vgs - this.vt;
	with (this) {
	    var gmgs,ids,gds;
	    if (vgst > 0.0 ) { // vgst < 0, transistor off, no subthreshold here.
		if (vgst < vds) { /* Saturation. */
		    gmgs =  beta * (1 + (lambda * vds)) * vgst;
		    ids = type_sign * 0.5 * gmgs * vgst;
		    gds = 0.5 * beta * vgst * vgst * lambda;
		} else {  /* Linear region */
		    gmgs =  beta * (1 + lambda * vds);
		    ids = type_sign * gmgs * vds * (vgst - 0.50 * vds);
		    gds = gmgs * (vgst - vds) + beta * lambda * vds * (vgst - 0.5 * vds);
		    gmgs *= vds;
		}
		ckt.add_to_rhs(d,-ids,rhs);  // current flows into the drain
		ckt.add_to_rhs(s, ids,rhs);   // and out the source
		ckt.add_conductance(d,s,gds);
		ckt.add_to_G(s,s, gmgs);
		ckt.add_to_G(d,s,-gmgs);
		ckt.add_to_G(d,g, gmgs);
		ckt.add_to_G(s,g,-gmgs);
	    }
	}
    };

    Fet.prototype.load_tran = function(ckt,soln,rhs) {
	this.load_dc(ckt,soln,rhs);
    };

    Fet.prototype.load_ac = function(ckt) {
    };


    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Module definition
    //
    ///////////////////////////////////////////////////////////////////////////////
    var module = {
	'Circuit': Circuit,
	'parse_number': parse_number,
	'parse_source': parse_source
    };
    return module;
}());

/////////////////////////////////////////////////////////////////////////////
//
//  Simple schematic capture
//
////////////////////////////////////////////////////////////////////////////////

// Copyright (C) 2011 Massachusetts Institute of Technology

// add schematics to a document with
//
//   <input type="hidden" class="schematic" name="unique_form_id" value="JSON netlist..." .../>
//
// other attributes you can add to the input tag:
//   width -- width in pixels of diagram
//   height -- height in pixels of diagram
//   parts -- comma-separated list of parts for parts bin (see parts_map),
//            parts="" disables editing of diagram

// JSON schematic representation:
//  sch :=  [part, part, ...]
//  part := [type, coords, properties, connections]
//  type := string (see parts_map)
//  coords := [number, ...]  // (x,y,rot) or (x1,y1,x2,y2)
//  properties := {name: value, ...}
//  connections := [node, ...]   // one per connection point in canoncial order
//  node := string
// need a netlist? just use the part's type, properites and connections

// TO DO:
// - wire labels?
// - zoom/scroll canvas
// - rotate multiple objects around their center of mass
// - rubber band wires when moving components

// set up each schematic entry widget
function update_schematics() {
    // set up each schematic on the page
    var schematics = $('.schematic');
    for (var i = 0; i < schematics.length; ++i)
	if (schematics[i].getAttribute("loaded") != "true") {
	    try {
		new schematic.Schematic(schematics[i]);
	    } catch (err) {
		var msgdiv = document.createElement('div');
		msgdiv.style.border = 'thick solid #FF0000';
		msgdiv.style.margins = '20px';
		msgdiv.style.padding = '20px';
		var msg = document.createTextNode('Sorry, there a browser error in starting the schematic tool.  The tool is known to be compatible with the latest versions of Firefox and Chrome, which we recommend you use.');
		msgdiv.appendChild(msg);
		schematics[i].parentNode.insertBefore(msgdiv,schematics[i]);
	    }
	    schematics[i].setAttribute("loaded","true");
	}
}
window.update_schematics = update_schematics;

// add ourselves to the tasks that get performed when window is loaded
function add_schematic_handler(other_onload) {
    return function() {
	// execute othe onload functions first
	if (other_onload) other_onload();

	update_schematics();
    };
}
/*
 * THK: Attaching update_schematic to window.onload is rather presumptuous...
 *      The function is called for EVERY page load, whether in courseware or in
 *      course info, in 6.002x or the public health course. It is also redundant
 *      because courseware includes an explicit call to update_schematic after
 *      each ajax exchange. In this case, calling update_schematic twice appears
 *      to contribute to a bug in Firefox that does not render the schematic
 *      properly depending on timing.
 */
//window.onload = add_schematic_handler(window.onload);

// ask each schematic input widget to update its value field for submission
function prepare_schematics() {
    var schematics = $('.schematic');
    for (var i = schematics.length - 1; i >= 0; i--)
	schematics[i].schematic.update_value();
}

var schematic = (function() {
    var background_style = 'rgb(220,220,220)';
    var element_style = 'rgb(255,255,255)';
    var thumb_style = 'rgb(128,128,128)';
    var normal_style = 'rgb(0,0,0)';  // default drawing color
    var component_style = 'rgb(64,64,255)';  // color for unselected components
    var selected_style = 'rgb(64,255,64)';  // highlight color for selected components
    var grid_style = "rgb(128,128,128)";
    var annotation_style = 'rgb(255,64,64)';  // color for diagram annotations

    var property_size = 5;  // point size for Component property text
    var annotation_size = 6;  // point size for diagram annotations

    // list of all the defined parts
    var parts_map = {
	'g': [Ground, 'Ground connection'],
	'L': [Label, 'Node label'],
	'v': [VSource, 'Voltage source'],
	'i': [ISource, 'Current source'],
	'r': [Resistor, 'Resistor'],
	'c': [Capacitor, 'Capacitor'],
	'l': [Inductor, 'Inductor'],
	'o': [OpAmp, 'Op Amp'],
	'd': [Diode, 'Diode'],
	'n': [NFet, 'NFet'],
	'p': [PFet, 'PFet'],
	's': [Probe, 'Voltage Probe'],
	'a': [Ammeter, 'Current Probe']
    };

    // global clipboard
    if (typeof sch_clipboard == 'undefined')
	window.sch_clipboard = [];

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Schematic = diagram + parts bin + status area
    //
    ////////////////////////////////////////////////////////////////////////////////

    // setup a schematic by populating the <div> with the appropriate children
    function Schematic(input) {
	// set up diagram viewing parameters
	this.show_grid = true;
	this.grid = 8;
	this.scale = 2;
	this.origin_x = input.getAttribute("origin_x");
	if (this.origin_x == undefined) this.origin_x = 0;
	this.origin_y = input.getAttribute("origin_y");
	if (this.origin_y == undefined) this.origin_y = 0;
	this.cursor_x = 0;
	this.cursor_y = 0;

	this.window_list = [];  // list of pop-up windows in increasing z order

	// use user-supplied list of parts if supplied
	// else just populate parts bin with all the parts
	this.edits_allowed = true;
	var parts = input.getAttribute('parts');
	if (parts == undefined || parts == 'None') {
	    parts = new Array();
	    for (var p in parts_map) parts.push(p);
	} else if (parts == '') {
	    this.edits_allowed = false;
	    parts = [];
	} else parts = parts.split(',');

	// now add the parts to the parts bin
	this.parts_bin = [];
	for (var i = 0; i < parts.length; i++) {
	    var part = new Part(this);
	    var pm = parts_map[parts[i]];
	    part.set_component(new pm[0](0,0,0),pm[1]);
	    this.parts_bin.push(part);
	}

	// use user-supplied list of analyses, otherwise provide them all
	// analyses="" means no analyses
	var analyses = input.getAttribute('analyses');
	if (analyses == undefined || analyses == 'None')
	    analyses = ['dc','ac','tran'];
	else if (analyses == '') analyses = [];
	else analyses = analyses.split(',');

	if (parts.length == 0 && analyses.length == 0) this.diagram_only = true;
	else this.diagram_only = false;

	// see what we need to submit.  Expecting attribute of the form
	// submit_analyses="{'tran':[[node_name,t1,t2,t3],...],
	//                   'ac':[[node_name,f1,f2,...],...]}"
	var submit = input.getAttribute('submit_analyses');
	if (submit && submit.indexOf('{') != -1)
	    this.submit_analyses = JSON.parse(submit);
	else
	    this.submit_analyses = undefined;

	// toolbar
	this.tools = new Array();
	this.toolbar = [];

        /* DISABLE HELP BUTTON (target URL not consistent with multicourse hierarchy) -- SJSU
	 if (!this.diagram_only) {
	 this.tools['help'] = this.add_tool(help_icon,'Help: display help page',this.help);
	 this.enable_tool('help',true);
	 this.toolbar.push(null);  // spacer
	 }
         END DISABLE HELP BUTTON -- SJSU */

	if (this.edits_allowed) {
	    this.tools['grid'] = this.add_tool(grid_icon,'Grid: toggle grid display',this.toggle_grid);
	    this.enable_tool('grid',true);
	    this.tools['cut'] = this.add_tool(cut_icon,'Cut: move selected components from diagram to the clipboard',this.cut);
	    this.tools['copy'] = this.add_tool(copy_icon,'Copy: copy selected components into the clipboard',this.copy);
	    this.tools['paste'] = this.add_tool(paste_icon,'Paste: copy clipboard into the diagram',this.paste);
	    this.toolbar.push(null);  // spacer
	}

	// simulation interface if cktsim.js is loaded
	if (typeof cktsim != 'undefined') {
	    if (analyses.indexOf('dc') != -1) {
		this.tools['dc'] = this.add_tool('DC','DC Analysis',this.dc_analysis);
		this.enable_tool('dc',true);
		this.dc_max_iters = '1000';  // default values dc solution
	    }

	    if (analyses.indexOf('ac') != -1) {
		this.tools['ac'] = this.add_tool('AC','AC Small-Signal Analysis',this.setup_ac_analysis);
		this.enable_tool('ac',true);
		this.ac_npts = '50'; // default values for AC Analysis
		this.ac_fstart = '10';
		this.ac_fstop = '1G';
		this.ac_source_name = undefined;
	    }

	    if (analyses.indexOf('tran') != -1) {
		this.tools['tran'] = this.add_tool('TRAN','Transient Analysis',this.transient_analysis);
		this.enable_tool('tran',true);
		this.tran_npts = '100';  // default values for transient analysis
		this.tran_tstop = '1';
	    }
	}

	// set up diagram canvas
	this.canvas = document.createElement('canvas');
	this.width = input.getAttribute('width');
	this.width = parseInt(this.width == undefined ? '400' : this.width);
	this.canvas.width = this.width;
	this.height = input.getAttribute('height');
	this.height = parseInt(this.height == undefined ? '300' : this.height);
	this.canvas.height = this.height;

	this.sctl_r = 16;   // scrolling control parameters
	this.sctl_x = this.sctl_r + 8;   // upper left
	this.sctl_y = this.sctl_r + 8;
	this.zctl_left = this.sctl_x - 8;
	this.zctl_top = this.sctl_y + this.sctl_r + 8;

	// repaint simply draws this buffer and then adds selected elements on top
	this.bg_image = document.createElement('canvas');
	this.bg_image.width = this.width;
	this.bg_image.height = this.height;

	if (!this.diagram_only) {
	    this.canvas.tabIndex = 1; // so we get keystrokes
	    this.canvas.style.borderStyle = 'solid';
	    this.canvas.style.borderWidth = '1px';
	    this.canvas.style.borderColor = grid_style;
	    this.canvas.style.outline = 'none';
	}

	this.canvas.schematic = this;
	if (this.edits_allowed) {
	    this.canvas.addEventListener('mousemove',schematic_mouse_move,false);
	    this.canvas.addEventListener('mouseover',schematic_mouse_enter,false);
	    this.canvas.addEventListener('mouseout',schematic_mouse_leave,false);
	    this.canvas.addEventListener('mousedown',schematic_mouse_down,false);
	    this.canvas.addEventListener('mouseup',schematic_mouse_up,false);
	    this.canvas.addEventListener('mousewheel',schematic_mouse_wheel,false);
	    this.canvas.addEventListener('DOMMouseScroll',schematic_mouse_wheel,false);  // for FF
	    this.canvas.addEventListener('dblclick',schematic_double_click,false);
	    this.canvas.addEventListener('keydown',schematic_key_down,false);
	    this.canvas.addEventListener('keyup',schematic_key_up,false);
	}

	// set up message area
	if (!this.diagram_only) {
	    this.status_div = document.createElement('div');
	    this.status = document.createTextNode('');
	    this.status_div.appendChild(this.status);
	    this.status_div.style.height = status_height + 'px';
	} else this.status_div = undefined;

	this.connection_points = new Array();  // location string => list of cp's
	this.components = [];

	this.dragging = false;
	this.select_rect = undefined;
	this.wire = undefined;

	this.operating_point = undefined;  // result from DC analysis
	this.dc_results = undefined;   // saved analysis results for submission
	this.ac_results = undefined;   // saved analysis results for submission
	this.transient_results = undefined;   // saved analysis results for submission

	// state of modifier keys
	this.ctrlKey = false;
	this.shiftKey = false;
	this.altKey = false;
	this.cmdKey = false;

	// make sure other code can find us!
	input.schematic = this;
	this.input = input;

	// set up DOM -- use nested tables to do the layout
	var table,tr,td;
	table = document.createElement('table');
	table.rules = 'none';
	if (!this.diagram_only) {
	    table.frame = 'box';
	    table.style.borderStyle = 'solid';
	    table.style.borderWidth = '2px';
	    table.style.borderColor = normal_style;
	    table.style.backgroundColor = background_style;
	}

	// add tools to DOM
	if (this.toolbar.length > 0) {
	    tr = document.createElement('tr');
	    table.appendChild(tr);
	    td = document.createElement('td');
	    td.style.verticalAlign = 'top';
	    td.colSpan = 2;
	    tr.appendChild(td);
	    for (var i = 0; i < this.toolbar.length; ++i) {
		var tool = this.toolbar[i];
		if (tool != null) td.appendChild(tool);
	    }
	}

	// add canvas and parts bin to DOM
	tr = document.createElement('tr');
	table.appendChild(tr);

	td = document.createElement('td');
	tr.appendChild(td);
	var wrapper = document.createElement('div'); // for inserting pop-up windows
	td.appendChild(wrapper);
	wrapper.style.position = 'relative';  // so we can position subwindows
	wrapper.appendChild(this.canvas);

	td = document.createElement('td');
	td.style.verticalAlign = 'top';
	tr.appendChild(td);
	var parts_table = document.createElement('table');
	td.appendChild(parts_table);
	parts_table.rules = 'none';
	parts_table.frame = 'void';
	parts_table.cellPadding = '0';
	parts_table.cellSpacing = '0';

	// fill in parts_table
	var parts_per_column = Math.floor(this.height / (part_h + 5));  // mysterious extra padding
	for (var i = 0; i < parts_per_column; ++i) {
	    tr = document.createElement('tr');
	    parts_table.appendChild(tr);
	    for (var j = i; j < this.parts_bin.length; j += parts_per_column) {
		td = document.createElement('td');
		tr.appendChild(td);
		td.appendChild(this.parts_bin[j].canvas);
	    }
	}

	if (this.status_div != undefined) {
	    tr = document.createElement('tr');
	    table.appendChild(tr);
	    td = document.createElement('td');
	    tr.appendChild(td);
	    td.colSpan = 2;
	    td.appendChild(this.status_div);
	}

	// add to dom
	// avoid Chrome bug that changes to text cursor whenever
	// drag starts.  Just do this in schematic tool...
	var toplevel = document.createElement('div');
	toplevel.onselectstart = function(){ return false; };
	toplevel.appendChild(table);
	this.input.parentNode.insertBefore(toplevel,this.input.nextSibling);

	// process initial contents of diagram
	this.load_schematic(this.input.getAttribute('value'),
			    this.input.getAttribute('initial_value'));

	// start by centering diagram on the screen
	this.zoomall();
    }

    var part_w = 42;   // size of a parts bin compartment
    var part_h = 42;
    var status_height = 18;

    Schematic.prototype.add_component = function(new_c) {
	this.components.push(new_c);

	// create undoable edit record here
    };

    Schematic.prototype.remove_component = function(c) {
	var index = this.components.indexOf(c);
	if (index != -1) this.components.splice(index,1);
    };

    Schematic.prototype.find_connections = function(cp) {
	return this.connection_points[cp.location];
    };

    // add connection point to list of connection points at that location
    Schematic.prototype.add_connection_point = function(cp) {
	var cplist = this.connection_points[cp.location];
	if (cplist) cplist.push(cp);
	else {
	    cplist = [cp];
	    this.connection_points[cp.location] = cplist;
	}

	// return list of conincident connection points
	return cplist;
    };

    // remove connection point from the list points at the old location
    Schematic.prototype.remove_connection_point = function(cp,old_location) {
	// remove cp from list at old location
	var cplist = this.connection_points[old_location];
	if (cplist) {
	    var index = cplist.indexOf(cp);
	    if (index != -1) {
		cplist.splice(index,1);
		// if no more connections at this location, remove
		// entry from array to keep our search time short
		if (cplist.length == 0)
		    delete this.connection_points[old_location];
	    }
	}
    };

    // connection point has changed location: remove, then add
    Schematic.prototype.update_connection_point = function(cp,old_location) {
	this.remove_connection_point(cp,old_location);
	return this.add_connection_point(cp);
    };

    // add a wire to the schematic
    Schematic.prototype.add_wire = function(x1,y1,x2,y2) {
	var new_wire = new Wire(x1,y1,x2,y2);
	new_wire.add(this);
	new_wire.move_end();
	return new_wire;
    };

    Schematic.prototype.split_wire = function(w,cp) {
	// remove bisected wire
	w.remove();

	// add two new wires with connection point cp in the middle
	this.add_wire(w.x,w.y,cp.x,cp.y);
	this.add_wire(w.x+w.dx,w.y+w.dy,cp.x,cp.y);
    };

    // see if connection points of component c split any wires
    Schematic.prototype.check_wires = function(c) {
	for (var i = 0; i < this.components.length; i++) {
	    var cc = this.components[i];
	    if (cc != c) {  // don't check a component against itself
		// only wires will return non-null from a bisect call
		var cp = cc.bisect(c);
		if (cp) {
		    // cc is a wire bisected by connection point cp
		    this.split_wire(cc,cp);
		    this.redraw_background();
		}
	    }
	}
    };

    // see if there are any existing connection points that bisect wire w
    Schematic.prototype.check_connection_points = function(w) {
	for (var locn in this.connection_points) {
	    var cplist = this.connection_points[locn];
	    if (cplist && w.bisect_cp(cplist[0])) {
		this.split_wire(w,cplist[0]);
		this.redraw_background();

		// stop here, new wires introduced by split will do their own checks
		return;
	    }
	}
    };

    // merge collinear wires sharing an end point
    Schematic.prototype.clean_up_wires = function() {
	for (var locn in this.connection_points) {
	    var cplist = this.connection_points[locn];
	    if (cplist && cplist.length == 2) {
		// found a connection with just two connections, see if they're wires
		var c1 = cplist[0].parent;
		var c2 = cplist[1].parent;
		if (c1.type == 'w' && c2.type == 'w') {
		    var e1 = c1.other_end(cplist[0]);
		    var e2 = c2.other_end(cplist[1]);
		    var e3 = cplist[0];  // point shared by the two wires
		    if (collinear(e1,e2,e3)) {
			c1.remove();
			c2.remove();
			this.add_wire(e1.x,e1.y,e2.x,e2.y);
		    }
		}
	    }
	}
    };

    Schematic.prototype.unselect_all = function(which) {
	this.operating_point = undefined;  // remove annotations

	for (var i = this.components.length - 1; i >= 0; --i)
	    if (i != which) this.components[i].set_select(false);
    };

    Schematic.prototype.drag_begin = function() {
	// let components know they're about to move
	for (var i = this.components.length - 1; i >= 0; --i) {
	    var component = this.components[i];
	    if (component.selected) component.move_begin();
	}

	// remember where drag started
	this.drag_x = this.cursor_x;
	this.drag_y = this.cursor_y;
	this.dragging = true;
    };

    Schematic.prototype.drag_end = function() {
	// let components know they're done moving
	for (var i = this.components.length - 1; i >= 0; --i) {
	    var component = this.components[i];
	    if (component.selected) component.move_end();
	}
	this.dragging = false;

	this.clean_up_wires();
	this.redraw_background();
    };

    Schematic.prototype.help = function() {
	window.open('/static/handouts/schematic_tutorial.pdf');
    };

    // zoom diagram around given coords
    Schematic.prototype.rescale = function(nscale,cx,cy) {
	if (cx == undefined) {
	    // use current center point if no point has been specified
	    cx = this.origin_x + this.width/(2*this.scale);
	    cy = this.origin_y + this.height/(2*this.scale);
	}

	this.origin_x += cx*(this.scale - nscale);
	this.origin_y += cy*(this.scale - nscale);
	this.scale = nscale;


	//this.origin_x = cx - this.width/(2*this.scale);
	//this.origin_y = cy - this.height/(2*this.scale);

	this.redraw_background();
    };

    Schematic.prototype.toggle_grid = function() {
	this.show_grid = !this.show_grid;
	this.redraw_background();
    };

    var zoom_factor = 1.25;    // scaling is some power of zoom_factor
    var zoom_min = 0.5;
    var zoom_max = 4.0;
    var origin_min = -200;    // in grids
    var origin_max = 200;

    Schematic.prototype.zoomin = function() {
	var nscale = this.scale * zoom_factor;

	if (nscale < zoom_max) {
	    // keep center of view unchanged
	    this.origin_x += (this.width/2)*(1.0/this.scale - 1.0/nscale);
	    this.origin_y += (this.height/2)*(1.0/this.scale - 1.0/nscale);
	    this.scale = nscale;
	    this.redraw_background();
	}
    };

    Schematic.prototype.zoomout = function() {
	var nscale = this.scale / zoom_factor;

	if (nscale > zoom_min) {
	    // keep center of view unchanged
	    this.origin_x += (this.width/2)*(1.0/this.scale - 1.0/nscale);
	    this.origin_y += (this.height/2)*(1.0/this.scale - 1.0/nscale);
	    this.scale = nscale;
	    this.redraw_background();
	}
    };

    Schematic.prototype.zoomall = function() {
	// w,h for schematic including a 25% margin on all sides
	var sch_w = 1.5*(this.bbox[2] - this.bbox[0]);
	var sch_h = 1.5*(this.bbox[3] - this.bbox[1]);

	if (sch_w == 0 && sch_h == 0) {
	    this.origin_x = 0;
	    this.origin_y = 0;
	    this.scale = 2;
	} else {
	    // compute scales that would make schematic fit, choose smallest
	    var scale_x = this.width/sch_w;
	    var scale_y = this.height/sch_h;
	    this.scale = Math.pow(zoom_factor,Math.ceil(Math.log(Math.min(scale_x,scale_y))/Math.log(zoom_factor)));
	    if (this.scale < zoom_min) this.scale = zoom_min;
	    else if (this.scale > zoom_max) this.scale = zoom_max;

	    // center the schematic
	    this.origin_x = (this.bbox[2] + this.bbox[0])/2 - this.width/(2*this.scale);
	    this.origin_y = (this.bbox[3] + this.bbox[1])/2 - this.height/(2*this.scale);
	}

	this.redraw_background();
    };

    Schematic.prototype.cut = function() {
	// clear previous contents
	sch_clipboard = [];

	// look for selected components, move them to clipboard.
	for (var i = this.components.length - 1; i >=0; --i) {
	    var c = this.components[i];
	    if (c.selected) {
		c.remove();
		sch_clipboard.push(c);
	    }
	}

	// update diagram view
	this.redraw();
    };

    Schematic.prototype.copy = function() {
	// clear previous contents
	sch_clipboard = [];

	// look for selected components, copy them to clipboard.
	for (var i = this.components.length - 1; i >=0; --i) {
	    var c = this.components[i];
	    if (c.selected)
		sch_clipboard.push(c.clone(c.x,c.y));
	}
    };

    Schematic.prototype.paste = function() {
	// compute left,top of bounding box for origins of
	// components in the clipboard
	var left = undefined;
	var top = undefined;
	for (var i = sch_clipboard.length - 1; i >= 0; --i) {
	    var c = sch_clipboard[i];
	    left = left ? Math.min(left,c.x) : c.x;
	    top = top ? Math.min(top,c.y) : c.y;
	}

	this.message('cursor '+this.cursor_x+','+this.cursor_y);

	// clear current selections
	this.unselect_all(-1);
	this.redraw_background();  // so we see any components that got unselected

	// make clones of components on the clipboard, positioning
	// them relative to the cursor
	for (var i = sch_clipboard.length - 1; i >= 0; --i) {
	    var c = sch_clipboard[i];
	    var new_c = c.clone(this.cursor_x + (c.x - left),this.cursor_y + (c.y - top));
	    new_c.set_select(true);
	    new_c.add(this);
	}

	// see what we've wrought
	this.redraw();
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Netlist and Simulation interface
    //
    ////////////////////////////////////////////////////////////////////////////////

    // load diagram from JSON representation
    Schematic.prototype.load_schematic = function(value,initial_value) {
	// use default value if no schematic info in value
	if (value == undefined || value.indexOf('[') == -1)
	    value = initial_value;

	if (value && value.indexOf('[') != -1) {
	    // convert string value into data structure
	    var json = JSON.parse(value);

	    // top level is a list of components
	    for (var i = json.length - 1; i >= 0; --i) {
		var c = json[i];
		if (c[0] == 'view') {
		    // special hack: view component lets us recreate view
		    // ignore saved view parameters as they sometimes screw students
		    //this.origin_x = c[1];
		    //this.origin_y = c[2];
		    //this.scale = c[3];
		    //this.ac_npts = c[4];
		    this.ac_fstart = c[5];
		    this.ac_fstop = c[6];
		    this.ac_source_name = c[7];
		    this.tran_npts = c[8];
		    this.tran_tstop = c[9];
		    this.dc_max_iters = c[10];
		} else if (c[0] == 'w') {
		    // wire
		    this.add_wire(c[1][0],c[1][1],c[1][2],c[1][3]);
		} else if (c[0] == 'dc') {
		    this.dc_results = c[1];
		} else if (c[0] == 'transient') {
		    this.transient_results = c[1];
		} else if (c[0] == 'ac') {
		    this.ac_results = c[1];
		} else {
		    // ordinary component
		    //  c := [type, coords, properties, connections]
		    var type = c[0];
		    var coords = c[1];
		    var properties = c[2];

		    // make the part
		    var part = new parts_map[type][0](coords[0],coords[1],coords[2]);

		    // give it its properties
		    for (var name in properties)
			part.properties[name] = properties[name];

		    // add component to the diagram
		    part.add(this);
		}
	    }
	}

	// see what we've got!
	this.redraw_background();
    };

    // label all the nodes in the circuit
    Schematic.prototype.label_connection_points = function() {
	// start by clearing all the connection point labels
	for (var i = this.components.length - 1; i >=0; --i)
	    this.components[i].clear_labels();

	// components are in charge of labeling their unlabeled connections.
	// labels given to connection points will propagate to coincident connection
	// points and across Wires.

	// let special components like GND label their connection(s)
	for (var i = this.components.length - 1; i >=0; --i)
	    this.components[i].add_default_labels();

	// now have components generate labels for unlabeled connections
	this.next_label = 0;
	for (var i = this.components.length - 1; i >=0; --i)
	    this.components[i].label_connections();
    };

    // generate a new label
    Schematic.prototype.get_next_label = function() {
	// generate next label in sequence
	this.next_label += 1;
	return this.next_label.toString();
    };

    // propagate label to coincident connection points
    Schematic.prototype.propagate_label = function(label,location) {
	var cplist = this.connection_points[location];
	for (var i = cplist.length - 1; i >= 0; --i)
	    cplist[i].propagate_label(label);
    };

    // update the value field of our corresponding input field with JSON
    // representation of schematic
    Schematic.prototype.update_value = function() {
	// label connection points
	this.label_connection_points();

	// build JSON data structure, convert to string value for
	// input field
	this.input.value = JSON.stringify(this.json_with_analyses());
    };

    // produce a JSON representation of the diagram
    Schematic.prototype.json = function() {
	var json = [];

	// output all the components/wires in the diagram
	var n = this.components.length;
	for (var i = 0; i < n; i++)
	    json.push(this.components[i].json(i));

	// capture the current view parameters
	json.push(['view',this.origin_x,this.origin_y,this.scale,
		   this.ac_npts,this.ac_fstart,this.ac_fstop,
		   this.ac_source_name,this.tran_npts,this.tran_tstop,
		   this.dc_max_iters]);

	return json;
    };

    // produce a JSON representation of the diagram
    Schematic.prototype.json_with_analyses = function() {
	var json = this.json();

	if (this.dc_results != undefined) json.push(['dc',this.dc_results]);
	if (this.ac_results != undefined) json.push(['ac',this.ac_results]);
	if (this.transient_results != undefined) json.push(['transient',this.transient_results]);

	return json;
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Simulation interface
    //
    ////////////////////////////////////////////////////////////////////////////////

    Schematic.prototype.extract_circuit = function() {
	// give all the circuit nodes a name, extract netlist
	this.label_connection_points();
	var netlist = this.json();

	// since we've done the heavy lifting, update input field value
	// so user can grab diagram if they want
	this.input.value = JSON.stringify(netlist);

	// create a circuit from the netlist
	var ckt = new cktsim.Circuit();
	if (ckt.load_netlist(netlist))
	    return ckt;
	else
	    return null;
    };

    Schematic.prototype.dc_analysis = function() {
	// remove any previous annotations
	this.unselect_all(-1);
	this.redraw_background();

	var ckt = this.extract_circuit();
	if (ckt === null) return;

	// run the analysis
	this.operating_point = ckt.dc();

	if (this.operating_point != undefined) {
	    // save a copy of the results for submission
	    this.dc_results = {};
	    for (var i in this.operating_point) this.dc_results[i] = this.operating_point[i];

	    // display results on diagram
	    this.redraw();
	}
    };

    // return a list of [color,node_label,offset,type] for each probe in the diagram
    // type == 'voltage' or 'current'
    Schematic.prototype.find_probes = function() {
	var result = [];
	var result = [];
	for (var i = this.components.length - 1; i >= 0; --i) {
	    var c = this.components[i];
	    var info = c.probe_info();
	    if (info != undefined) result.push(c.probe_info());
	}
	return result;
    };

    // use a dialog to get AC analysis parameters
    Schematic.prototype.setup_ac_analysis = function() {
	this.unselect_all(-1);
	this.redraw_background();

	var npts_lbl = 'Number of points/decade';
	var fstart_lbl = 'Starting frequency (Hz)';
	var fstop_lbl = 'Ending frequency (Hz)';
	var source_name_lbl = 'Name of V or I source for ac'

	if (this.find_probes().length == 0) {
	    alert("AC Analysis: there are no voltage probes in the diagram!");
	    return;
	}

	var fields = new Array();
	//fields[npts_lbl] = build_input('text',10,this.ac_npts);
	fields[fstart_lbl] = build_input('text',10,this.ac_fstart);
	fields[fstop_lbl] = build_input('text',10,this.ac_fstop);
	fields[source_name_lbl] = build_input('text',10,this.ac_source_name);

	var content = build_table(fields);
	content.fields = fields;
	content.sch = this;

	this.dialog('AC Analysis',content,function(content) {
	    var sch = content.sch;

	    // retrieve parameters, remember for next time
	    //sch.ac_npts = content.fields[npts_lbl].value;
	    sch.ac_fstart = content.fields[fstart_lbl].value;
	    sch.ac_fstop = content.fields[fstop_lbl].value;
	    sch.ac_source_name = content.fields[source_name_lbl].value;

	    sch.ac_analysis(cktsim.parse_number(sch.ac_npts),
			    cktsim.parse_number(sch.ac_fstart),
			    cktsim.parse_number(sch.ac_fstop),
			    sch.ac_source_name);
	});
    };

    // perform ac analysis
    Schematic.prototype.ac_analysis = function(npts,fstart,fstop,ac_source_name) {
	// run the analysis
	var ckt = this.extract_circuit();
	if (ckt === null) return;
	var results = ckt.ac(npts,fstart,fstop,ac_source_name);

	if (typeof results == 'string')
	    this.message(results);
	else {
	    var x_values = results['_frequencies_'];

	    // x axis will be a log scale
	    for (var i = x_values.length - 1; i >= 0; --i)
		x_values[i] = Math.log(x_values[i])/Math.LN10;


	    if (this.submit_analyses != undefined) {
		var submit = this.submit_analyses['ac'];
		if (submit != undefined) {
		    // save a copy of the results for submission
		    this.ac_results = {};

		    // save requested values for each requested node
		    for (var j = 0; j < submit.length; j++) {
			var flist = submit[j];    // [node_name,f1,f2,...]
			var node = flist[0];
			var values = results[node];
			var fvlist = [];
			// for each requested freq, interpolate response value
			for (var k = 1; k < flist.length; k++) {
			    var f = flist[k];
			    var v = interpolate(f,x_values,values);
			    // convert to dB
			    fvlist.push([f,v == undefined ? 'undefined' : 20.0 * Math.log(v)/Math.LN10]);
			}
			// save results as list of [f,response] paris
			this.ac_results[node] = fvlist;
		    }
		}
	    }

	    // set up plot values for each node with a probe
	    var y_values = [];  // list of [color, result_array]
	    var z_values = [];  // list of [color, result_array]
	    var probes = this.find_probes();

	    var probe_maxv = [];
	    var probe_color = [];

	    // Check for probe with near zero transfer function and warn
	    for (var i = probes.length - 1; i >= 0; --i) {
		if (probes[i][3] != 'voltage') continue;
		probe_color[i] = probes[i][0];
		var label = probes[i][1];
		var v = results[label];
		probe_maxv[i] = array_max(v); // magnitudes always > 0
	    }
	    var all_max = array_max(probe_maxv);

	    if (all_max < 1.0e-16) {
		alert('Zero ac response, -infinity on DB scale.');
	    } else {
		for (var i = probes.length - 1; i >= 0; --i) {
		    if (probes[i][3] != 'voltage') continue;
		    if ((probe_maxv[i] / all_max) < 1.0e-10) {
			alert('Near zero ac response, remove ' + probe_color[i] + ' probe');
			return;
		    }
		}
	    }

	    for (var i = probes.length - 1; i >= 0; --i) {
		if (probes[i][3] != 'voltage') continue;
		var color = probes[i][0];
		var label = probes[i][1];
		var offset = cktsim.parse_number(probes[i][2]);

		var v = results[label];
		// convert values into dB relative to source amplitude
		var v_max = 1;
		for (var j = v.length - 1; j >= 0; --j)
		    // convert each value to dB relative to max
		    v[j] = 20.0 * Math.log(v[j]/v_max)/Math.LN10;
		y_values.push([color,offset,v]);

		var v = results[label+'_phase'];
		z_values.push([color,0,v]);
	    }

	    // graph the result and display in a window
	    var graph2 = this.graph(x_values,'log(Frequency in Hz)',z_values,'degrees');
	    this.window('AC Analysis - Phase',graph2);
	    var graph1 = this.graph(x_values,'log(Frequency in Hz)',y_values,'dB');
	    this.window('AC Analysis - Magnitude',graph1,50);
	}
    };

    Schematic.prototype.transient_analysis = function() {
	this.unselect_all(-1);
	this.redraw_background();

	var npts_lbl = 'Minimum number of timepoints';
	var tstop_lbl = 'Stop Time (seconds)';

	var probes = this.find_probes();
	if (probes.length == 0) {
	    alert("Transient Analysis: there are no probes in the diagram!");
	    return;
	}

	var fields = new Array();
	//fields[npts_lbl] = build_input('text',10,this.tran_npts);
	fields[tstop_lbl] = build_input('text',10,this.tran_tstop);

	var content = build_table(fields);
	content.fields = fields;
	content.sch = this;

	this.dialog('Transient Analysis',content,function(content) {
	    var sch = content.sch;
	    var ckt = sch.extract_circuit();
	    if (ckt === null) return;

	    // retrieve parameters, remember for next time
	    //sch.tran_npts = content.fields[npts_lbl].value;
	    sch.tran_tstop = content.fields[tstop_lbl].value;

	    // gather a list of nodes that are being probed.  These
	    // will be added to the list of nodes checked during the
	    // LTE calculations in transient analysis
	    var probe_list = sch.find_probes();
	    var probe_names = new Array(probe_list.length);
	    for (var i = probe_list.length - 1; i >= 0; --i)
		probe_names[i] = probe_list[i][1];

	    // run the analysis
	    var results = ckt.tran(ckt.parse_number(sch.tran_npts), 0,
				   ckt.parse_number(sch.tran_tstop), probe_names, false);

	    if (typeof results == 'string')
		sch.message(results);
	    else {
		if (sch.submit_analyses != undefined) {
		    var submit = sch.submit_analyses['tran'];
		    if (submit != undefined) {
			// save a copy of the results for submission
			sch.transient_results = {};
			var times = results['_time_'];

			// save requested values for each requested node
			for (var j = 0; j < submit.length; j++) {
			    var tlist = submit[j];    // [node_name,t1,t2,...]
			    var node = tlist[0];
			    var values = results[node];
			    var tvlist = [];
			    // for each requested time, interpolate waveform value
			    for (var k = 1; k < tlist.length; k++) {
				var t = tlist[k];
				var v = interpolate(t,times,values);
				tvlist.push([t,v == undefined ? 'undefined' : v]);
			    }
			    // save results as list of [t,value] pairs
			    sch.transient_results[node] = tvlist;
			}
		    }
		}

		var x_values = results['_time_'];
		var x_legend = 'Time';

		// set up plot values for each node with a probe
		var v_values = [];  // voltage values: list of [color, result_array]
		var i_values = [];  // current values: list of [color, result_array]
		var probes = sch.find_probes();

		for (var i = probes.length - 1; i >= 0; --i) {
		    var color = probes[i][0];
		    var label = probes[i][1];
		    var offset = cktsim.parse_number(probes[i][2]);
		    var v = results[label];
		    if (v == undefined) {
			alert('The ' + color + ' probe is connected to node ' + '"' + label + '"' + ' which is not an actual circuit node');
		    } else if (probes[i][3] == 'voltage') {
			if (color == 'x-axis') {
			    x_values = v;
			    x_legend = 'Voltage';
			} else v_values.push([color,offset,v]);
		    } else {
			if (color == 'x-axis') {
			    x_values = v;
			    x_legend = 'Current';
			} else i_values.push([color,offset,v]);
		    }
		}

		// graph the result and display in a window
		var graph = sch.graph(x_values,x_legend,v_values,'Voltage',i_values,'Current');
		sch.window('Results of Transient Analysis',graph);
	    }
	});
    };

    // t is the time at which we want a value
    // times is a list of timepoints from the simulation
    function interpolate(t,times,values) {
	if (values == undefined) return undefined;

	for (var i = 0; i < times.length; i++)
	    if (t < times[i]) {
		// t falls between times[i-1] and times[i]
		var t1 = (i == 0) ? times[0] : times[i-1];
		var t2 = times[i];

		if (t2 == undefined) return undefined;

		var v1 = (i == 0) ? values[0] : values[i-1];
		var v2 = values[i];
		var v = v1;
		if (t != t1) v += (t - t1)*(v2 - v1)/(t2 - t1);
		return v;
	    }
    }

    // external interface for setting the property value of a named component
    Schematic.prototype.set_property = function(component_name,property,value) {
	this.unselect_all(-1);

	for (var i = this.components.length - 1; i >= 0; --i) {
	    var component = this.components[i];
	    if (component.properties['name'] == component_name) {
		component.properties[property] = value.toString();
		break;
	    }
	}

	// update diagram
	this.redraw_background();
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Drawing support -- deals with scaling and scrolling of diagrama
    //
    ////////////////////////////////////////////////////////////////////////////////

    // here to redraw background image containing static portions of the schematic.
    // Also redraws dynamic portion.
    Schematic.prototype.redraw_background = function() {
	var c = this.bg_image.getContext('2d');

	c.lineCap = 'round';

	// paint background color
	c.fillStyle = element_style;
	c.fillRect(0,0,this.width,this.height);

	if (!this.diagram_only && this.show_grid) {
	    // grid
	    c.strokeStyle = grid_style;
	    var first_x = this.origin_x;
	    var last_x = first_x + this.width/this.scale;
	    var first_y = this.origin_y;
	    var last_y = first_y + this.height/this.scale;

	    for (var i = this.grid*Math.ceil(first_x/this.grid); i < last_x; i += this.grid)
		this.draw_line(c,i,first_y,i,last_y,0.1);

	    for (var i = this.grid*Math.ceil(first_y/this.grid); i < last_y; i += this.grid)
		this.draw_line(c,first_x,i,last_x,i,0.1);
	}

	// unselected components
	var min_x = Infinity;  // compute bounding box for diagram
	var max_x = -Infinity;
	var min_y = Infinity;
	var max_y = -Infinity;
	for (var i = this.components.length - 1; i >= 0; --i) {
	    var component = this.components[i];
	    if (!component.selected) {
		component.draw(c);
		min_x = Math.min(component.bbox[0],min_x);
		max_x = Math.max(component.bbox[2],max_x);
		min_y = Math.min(component.bbox[1],min_y);
		max_y = Math.max(component.bbox[3],max_y);
	    }
	}
	this.unsel_bbox = [min_x,min_y,max_x,max_y];

	this.redraw();   // background changed, redraw on screen
    };

    // redraw what user sees = static image + dynamic parts
    Schematic.prototype.redraw = function() {
	var c = this.canvas.getContext('2d');

	// put static image in the background
	c.drawImage(this.bg_image, 0, 0);

	// selected components
	var min_x = this.unsel_bbox[0];   // compute bounding box for diagram
	var max_x = this.unsel_bbox[2];
	var min_y = this.unsel_bbox[1];
	var max_y = this.unsel_bbox[3];
	var selections = false;
	for (var i = this.components.length - 1; i >= 0; --i) {
	    var component = this.components[i];
	    if (component.selected) {
		component.draw(c);
		selections = true;
		min_x = Math.min(component.bbox[0],min_x);
		max_x = Math.max(component.bbox[2],max_x);
		min_y = Math.min(component.bbox[1],min_y);
		max_y = Math.max(component.bbox[3],max_y);
	    }
	}
	if (min_x == Infinity) this.bbox = [0,0,0,0];
	else this.bbox = [min_x,min_y,max_x,max_y];
	this.enable_tool('cut',selections);
	this.enable_tool('copy',selections);
	this.enable_tool('paste',sch_clipboard.length > 0);

	// connection points: draw one at each location
	for (var location in this.connection_points) {
	    var cplist = this.connection_points[location];
	    cplist[0].draw(c,cplist.length);
	}

	// draw new wire
	if (this.wire) {
	    var r = this.wire;
	    c.strokeStyle = selected_style;
	    this.draw_line(c,r[0],r[1],r[2],r[3],1);
	}

	// draw selection rectangle
	if (this.select_rect) {
	    var r = this.select_rect;
	    c.lineWidth = 1;
	    c.strokeStyle = selected_style;
	    c.beginPath();
	    c.moveTo(r[0],r[1]);
	    c.lineTo(r[0],r[3]);
	    c.lineTo(r[2],r[3]);
	    c.lineTo(r[2],r[1]);
	    c.lineTo(r[0],r[1]);
	    c.stroke();
	}

	// display operating point results
	if (this.operating_point) {
	    if (typeof this.operating_point == 'string')
		this.message(this.operating_point);
	    else {
		// make a copy of the operating_point info so we can mess with it
		var temp = new Array();
		for (var i in this.operating_point) temp[i] = this.operating_point[i];

		// run through connection points displaying (once) the voltage
		// for each electrical node
		for (var location in this.connection_points)
		    (this.connection_points[location])[0].display_voltage(c,temp);

		// let components display branch current info if available
		for (var i = this.components.length - 1; i >= 0; --i)
		    this.components[i].display_current(c,temp)
	    }
	}

	// add scrolling/zooming control
	if (!this.diagram_only) {
	    var r = this.sctl_r;
	    var x = this.sctl_x;
	    var y = this.sctl_y;

	    // circle with border
	    c.fillStyle = element_style;
	    c.beginPath();
	    c.arc(x,y,r,0,2*Math.PI);
	    c.fill();

	    c.strokeStyle = grid_style;
	    c.lineWidth = 0.5;
	    c.beginPath();
	    c.arc(x,y,r,0,2*Math.PI);
	    c.stroke();

	    // direction markers for scroll
	    c.lineWidth = 3;
	    c.beginPath();

	    c.moveTo(x + 4,y - r + 8);   // north
	    c.lineTo(x,y - r + 4);
	    c.lineTo(x - 4,y - r + 8);

	    c.moveTo(x + r - 8,y + 4);   // east
	    c.lineTo(x + r - 4,y);
	    c.lineTo(x + r - 8,y - 4);

	    c.moveTo(x + 4,y + r - 8);   // south
	    c.lineTo(x,y + r - 4);
	    c.lineTo(x - 4,y + r - 8);

	    c.moveTo(x - r + 8,y + 4);   // west
	    c.lineTo(x - r + 4,y);
	    c.lineTo(x - r + 8,y - 4);

	    c.stroke();

	    // zoom control
	    x = this.zctl_left;
	    y = this.zctl_top;
	    c.lineWidth = 0.5;
	    c.fillStyle = element_style;    // background
	    c.fillRect(x,y,16,48);
	    c.strokeStyle = grid_style;     // border
	    c.strokeRect(x,y,16,48);
	    c.lineWidth = 1.0;
	    c.beginPath();
	    // zoom in label
	    c.moveTo(x+4,y+8); c.lineTo(x+12,y+8); c.moveTo(x+8,y+4); c.lineTo(x+8,y+12);
	    // zoom out label
	    c.moveTo(x+4,y+24); c.lineTo(x+12,y+24);
	    // surround label
	    c.strokeRect(x+4,y+36,8,8);
	    c.stroke();
	}
    };

    // draws a cross cursor
    Schematic.prototype.cross_cursor = function(c,x,y) {
	this.draw_line(c,x-this.grid,y,x+this.grid,y,1);
	this.draw_line(c,x,y-this.grid,x,y+this.grid,1);
    };

    Schematic.prototype.moveTo = function(c,x,y) {
	c.moveTo((x - this.origin_x) * this.scale,(y - this.origin_y) * this.scale);
    };

    Schematic.prototype.lineTo = function(c,x,y) {
	c.lineTo((x - this.origin_x) * this.scale,(y - this.origin_y) * this.scale);
    };

    Schematic.prototype.draw_line = function(c,x1,y1,x2,y2,width) {
	c.lineWidth = width*this.scale;
	c.beginPath();
	c.moveTo((x1 - this.origin_x) * this.scale,(y1 - this.origin_y) * this.scale);
	c.lineTo((x2 - this.origin_x) * this.scale,(y2 - this.origin_y) * this.scale);
	c.stroke();
    };

    Schematic.prototype.draw_arc = function(c,x,y,radius,start_radians,end_radians,anticlockwise,width,filled) {
	c.lineWidth = width*this.scale;
	c.beginPath();
	c.arc((x - this.origin_x)*this.scale,(y - this.origin_y)*this.scale,radius*this.scale,
	      start_radians,end_radians,anticlockwise);
	if (filled) c.fill();
	else c.stroke();
    };

    Schematic.prototype.draw_text = function(c,text,x,y,size) {
	c.font = size*this.scale+'pt sans-serif';
	c.fillText(text,(x - this.origin_x) * this.scale,(y - this.origin_y) * this.scale);
    };

    // add method to canvas to compute relative coords for event
    try {
	if (HTMLCanvasElement)
	    HTMLCanvasElement.prototype.relMouseCoords = function(event){
		// run up the DOM tree to figure out coords for top,left of canvas
		var totalOffsetX = 0;
		var totalOffsetY = 0;
		var currentElement = this;
		do {
		    totalOffsetX += currentElement.offsetLeft;
		    totalOffsetY += currentElement.offsetTop;
		}
		while (currentElement = currentElement.offsetParent);

		// now compute relative position of click within the canvas
		this.mouse_x = event.pageX - totalOffsetX;
		this.mouse_y = event.pageY - totalOffsetY;

		this.page_x = event.pageX;
		this.page_y = event.pageY;
	    };
    }
    catch (err) { // ignore
    }

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Event handling
    //
    ////////////////////////////////////////////////////////////////////////////////

    // process keystrokes, consuming those that are meaningful to us
    function schematic_key_down(event) {
	if (!event) event = window.event;
	var sch = (window.event) ? event.srcElement.schematic : event.target.schematic;
	var code = event.keyCode;

	// keep track of modifier key state
	if (code == 16) sch.shiftKey = true;
	else if (code == 17) sch.ctrlKey = true;
	else if (code == 18) sch.altKey = true;
	else if (code == 91) sch.cmdKey = true;

	// backspace or delete: delete selected components
	else if (code == 8 || code == 46) {
	    // delete selected components
	    for (var i = sch.components.length - 1; i >= 0; --i) {
		var component = sch.components[i];
		if (component.selected) component.remove();
	    }
	    sch.clean_up_wires();
	    sch.redraw_background();
	    event.preventDefault();
	    return false;
	}

	// cmd/ctrl x: cut
	else if ((sch.ctrlKey || sch.cmdKey) && code == 88) {
	    sch.cut();
	    event.preventDefault();
	    return false;
	}

	// cmd/ctrl c: copy
	else if ((sch.ctrlKey || sch.cmdKey) && code == 67) {
	    sch.copy();
	    event.preventDefault();
	    return false;
	}

	// cmd/ctrl v: paste
	else if ((sch.ctrlKey || sch.cmdKey) && code == 86) {
	    sch.paste();
	    event.preventDefault();
	    return false;
	}

	// 'r': rotate component
	else if (!sch.ctrlKey && !sch.altKey && !sch.cmdKey && code == 82) {
	    // rotate
	    for (var i = sch.components.length - 1; i >= 0; --i) {
		var component = sch.components[i];
		if (component.selected) {
		    component.rotate(1);
		    sch.check_wires(component);
		}
	    }
	    sch.clean_up_wires();
	    sch.redraw_background();
	    event.preventDefault();
	    return false;
	}

	else return true;

	// consume keystroke
	sch.redraw();
	event.preventDefault();
	return false;
    }

    function schematic_key_up(event) {
	if (!event) event = window.event;
	var sch = (window.event) ? event.srcElement.schematic : event.target.schematic;
	var code = event.keyCode;

	if (code == 16) sch.shiftKey = false;
	else if (code == 17) sch.ctrlKey = false;
	else if (code == 18) sch.altKey = false;
	else if (code == 91) sch.cmdKey = false;
    }

    function schematic_mouse_enter(event) {
	if (!event) event = window.event;
	var sch = (window.event) ? event.srcElement.schematic : event.target.schematic;

	// see if user has selected a new part
	if (sch.new_part) {
	    // grab incoming part, turn off selection of parts bin
	    var part = sch.new_part;
	    sch.new_part = undefined;
	    part.select(false);

	    // unselect everything else in the schematic, add part and select it
	    sch.unselect_all(-1);
	    sch.redraw_background();  // so we see any components that got unselected

	    // make a clone of the component in the parts bin
	    part = part.component.clone(sch.cursor_x,sch.cursor_y);
	    part.add(sch);  // add it to schematic
	    part.set_select(true);

	    // and start dragging it
	    sch.drag_begin();
	}

	sch.drawCursor = true;
	sch.redraw();
	sch.canvas.focus();  // capture key strokes
	return false;
    }

    function schematic_mouse_leave(event) {
	if (!event) event = window.event;
	var sch = (window.event) ? event.srcElement.schematic : event.target.schematic;
	sch.drawCursor = false;
	sch.redraw();
	return false;
    }

    function schematic_mouse_down(event) {
	if (!event) event = window.event;
	else event.preventDefault();
	var sch = (window.event) ? event.srcElement.schematic : event.target.schematic;

	// determine where event happened in schematic coordinates
	sch.canvas.relMouseCoords(event);

	var mx = sch.canvas.mouse_x;
	var my = sch.canvas.mouse_y;
	var sx = mx - sch.sctl_x;
	var sy = my - sch.sctl_y;
	var zx = mx - sch.zctl_left;
	var zy = my - sch.zctl_top;
	if (sx*sx + sy*sy <= sch.sctl_r*sch.sctl_r) {   // click in scrolling control
	    // click on scrolling control, check which quadrant
	    if (Math.abs(sy) > Math.abs(sx)) {   // N or S
		var delta = this.height / 8;
		if (sy > 0) delta = -delta;
		var temp = sch.origin_y - delta;
		if (temp > origin_min*sch.grid && temp < origin_max*sch.grid) sch.origin_y = temp;
	    } else {			    // E or W
		var delta = this.width / 8;
		if (sx < 0) delta = -delta;
		var temp = sch.origin_x + delta;
		if (temp > origin_min*sch.grid && temp < origin_max*sch.grid) sch.origin_x = temp;
	    }
	} else if (zx >= 0 && zx < 16 && zy >= 0 && zy < 48) {   // click in zoom control
	    if (zy < 16) sch.zoomin();
	    else if (zy < 32) sch.zoomout();
	    else sch.zoomall();
	} else {
	    var x = mx/sch.scale + sch.origin_x;
	    var y = my/sch.scale + sch.origin_y;
	    sch.cursor_x = Math.round(x/sch.grid) * sch.grid;
	    sch.cursor_y = Math.round(y/sch.grid) * sch.grid;

	    // is mouse over a connection point?  If so, start dragging a wire
	    var cplist = sch.connection_points[sch.cursor_x + ',' + sch.cursor_y];
	    if (cplist && !event.shiftKey) {
		sch.unselect_all(-1);
		sch.wire = [sch.cursor_x,sch.cursor_y,sch.cursor_x,sch.cursor_y];
	    } else {
		// give all components a shot at processing the selection event
		var which = -1;
		for (var i = sch.components.length - 1; i >= 0; --i)
		    if (sch.components[i].select(x,y,event.shiftKey)) {
			if (sch.components[i].selected) {
			    sch.drag_begin();
			    which = i;  // keep track of component we found
			}
			break;
		    }
		// did we just click on a previously selected component?
		var reselect = which!=-1 && sch.components[which].was_previously_selected;

		if (!event.shiftKey) {
		    // if shift key isn't pressed and we didn't click on component
		    // that was already selected, unselect everyone except component
		    // we just clicked on
		    if (!reselect) sch.unselect_all(which);

		    // if there's nothing to drag, set up a selection rectangle
		    if (!sch.dragging) sch.select_rect = [sch.canvas.mouse_x,sch.canvas.mouse_y,
							  sch.canvas.mouse_x,sch.canvas.mouse_y];
		}
	    }
	}

	sch.redraw_background();
	return false;
    }

    function schematic_mouse_move(event) {
	if (!event) event = window.event;
	var sch = (window.event) ? event.srcElement.schematic : event.target.schematic;

	sch.canvas.relMouseCoords(event);
	var x = sch.canvas.mouse_x/sch.scale + sch.origin_x;
	var y = sch.canvas.mouse_y/sch.scale + sch.origin_y;
	sch.cursor_x = Math.round(x/sch.grid) * sch.grid;
	sch.cursor_y = Math.round(y/sch.grid) * sch.grid;

	if (sch.wire) {
	    // update new wire end point
	    sch.wire[2] = sch.cursor_x;
	    sch.wire[3] = sch.cursor_y;
	} else if (sch.dragging) {
	    // see how far we moved
	    var dx = sch.cursor_x - sch.drag_x;
	    var dy = sch.cursor_y - sch.drag_y;
	    if (dx != 0 || dy != 0) {
		// update position for next time
		sch.drag_x = sch.cursor_x;
		sch.drag_y = sch.cursor_y;

		// give all components a shot at processing the event
		for (var i = sch.components.length - 1; i >= 0; --i) {
		    var component = sch.components[i];
		    if (component.selected) component.move(dx,dy);
		}
	    }
	} else if (sch.select_rect) {
	    // update moving corner of selection rectangle
	    sch.select_rect[2] = sch.canvas.mouse_x;
	    sch.select_rect[3] = sch.canvas.mouse_y;
	    //sch.message(sch.select_rect.toString());
	}

	// just redraw dynamic components
	sch.redraw();
	//sch.message(sch.canvas.page_x + ',' + sch.canvas.page_y + ';' + sch.canvas.mouse_x + ',' + sch.canvas.mouse_y + ';' + sch.cursor_x + ',' + sch.cursor_y);

	return false;
    }

    function schematic_mouse_up(event) {
	if (!event) event = window.event;
	else event.preventDefault();
	var sch = (window.event) ? event.srcElement.schematic : event.target.schematic;

	// drawing a new wire
	if (sch.wire) {
	    var r = sch.wire;
	    sch.wire = undefined;

	    if (r[0]!=r[2] || r[1]!=r[3]) {
		// insert wire component
		sch.add_wire(r[0],r[1],r[2],r[3]);
		sch.clean_up_wires();
		sch.redraw_background();
	    } else sch.redraw();
	}

	// dragging
	if (sch.dragging) sch.drag_end();

	// selection rectangle
	if (sch.select_rect) {
	    var r = sch.select_rect;

	    // if select_rect is a point, we've already dealt with selection
	    // in mouse_down handler
	    if (r[0]!=r[2] || r[1]!=r[3]) {
		// convert to schematic coordinates
		var s = [r[0]/sch.scale + sch.origin_x, r[1]/sch.scale + sch.origin_y,
			 r[2]/sch.scale + sch.origin_x, r[3]/sch.scale + sch.origin_y];
		canonicalize(s);

		if (!event.shiftKey) sch.unselect_all();

		// select components that intersect selection rectangle
		for (var i = sch.components.length - 1; i >= 0; --i)
		    sch.components[i].select_rect(s,event.shiftKey);
	    }

	    sch.select_rect = undefined;
	    sch.redraw_background();
	}
	return false;
    }

    function schematic_mouse_wheel(event) {
	if (!event) event = window.event;
	else event.preventDefault();
	var sch = (window.event) ? event.srcElement.schematic : event.target.schematic;

	var delta = 0;
	if (event.wheelDelta) delta = event.wheelDelta;
	else if (event.detail) delta = -event.detail;

	if (delta) {
	    var nscale = (delta > 0) ? sch.scale*zoom_factor : sch.scale/zoom_factor;

	    if (nscale > zoom_min && nscale < zoom_max) {
		// zoom around current mouse position
		sch.canvas.relMouseCoords(event);
		var s = 1.0/sch.scale - 1.0/nscale;
		sch.origin_x += sch.canvas.mouse_x*s;
		sch.origin_y += sch.canvas.mouse_y*s;
		sch.scale = nscale;
		sch.redraw_background();
	    }
	}
    }

    function schematic_double_click(event) {
	if (!event) event = window.event;
	else event.preventDefault();
	var sch = (window.event) ? event.srcElement.schematic : event.target.schematic;

	// determine where event happened in schematic coordinates
	sch.canvas.relMouseCoords(event);
	var x = sch.canvas.mouse_x/sch.scale + sch.origin_x;
	var y = sch.canvas.mouse_y/sch.scale + sch.origin_y;
	sch.cursor_x = Math.round(x/sch.grid) * sch.grid;
	sch.cursor_y = Math.round(y/sch.grid) * sch.grid;

	// see if we double-clicked a component.  If so, edit it's properties
	for (var i = sch.components.length - 1; i >= 0; --i)
	    if (sch.components[i].edit_properties(x,y))
		break;

	return false;
    }

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Status message and dialogs
    //
    ////////////////////////////////////////////////////////////////////////////////

    Schematic.prototype.message = function(message) {
	this.status.nodeValue = message;
    };

    Schematic.prototype.append_message = function(message) {
	this.status.nodeValue += ' / '+message;
    };

    // set up a dialog with specified title, content and two buttons at
    // the bottom: OK and Cancel.  If Cancel is clicked, dialog goes away
    // and we're done.  If OK is clicked, dialog goes away and the
    // callback function is called with the content as an argument (so
    // that the values of any fields can be captured).
    Schematic.prototype.dialog = function(title,content,callback) {
	// create the div for the top level of the dialog, add to DOM
	var dialog = document.createElement('div');
	dialog.sch = this;
	dialog.content = content;
	dialog.callback = callback;

	// look for property input fields in the content and give
	// them a keypress listener that interprets ENTER as
	// clicking OK.
	var plist = content.getElementsByClassName('property');
	for (var i = plist.length - 1; i >= 0; --i) {
	    var field = plist[i];
	    field.dialog = dialog;  // help event handler find us...
	    field.addEventListener('keypress',dialog_check_for_ENTER,false);
	}

	// div to hold the content
	var body = document.createElement('div');
	content.style.marginBotton = '5px';
	body.appendChild(content);
	body.style.padding = '5px';
	dialog.appendChild(body);

	// OK button
	var ok_button = document.createElement('span');
	ok_button.appendChild(document.createTextNode('OK'));
	ok_button.dialog = dialog;   // for the handler to use
	ok_button.addEventListener('click',dialog_okay,false);
	ok_button.style.display = 'inline';
	ok_button.style.border = '1px solid';
	ok_button.style.padding = '5px';
	ok_button.style.margin = '10px';

	// cancel button
	var cancel_button = document.createElement('span');
	cancel_button.appendChild(document.createTextNode('Cancel'));
	cancel_button.dialog = dialog;   // for the handler to use
	cancel_button.addEventListener('click',dialog_cancel,false);
	cancel_button.style.display = 'inline';
	cancel_button.style.border = '1px solid';
	cancel_button.style.padding = '5px';
	cancel_button.style.margin = '10px';

	// div to hold the two buttons
	var buttons = document.createElement('div');
	buttons.style.textAlign = 'center';
	buttons.appendChild(ok_button);
	buttons.appendChild(cancel_button);
	buttons.style.padding = '5px';
	buttons.style.margin = '10px';
	dialog.appendChild(buttons);

	// put into an overlay window
	this.window(title,dialog);
    };

    // callback when user click "Cancel" in a dialog
    function dialog_cancel(event) {
	if (!event) event = window.event;
	var dialog = (window.event) ? event.srcElement.dialog : event.target.dialog;

	window_close(dialog.win);
    }

    // callback when user click "OK" in a dialog
    function dialog_okay(event) {
	if (!event) event = window.event;
	var dialog = (window.event) ? event.srcElement.dialog : event.target.dialog;

	window_close(dialog.win);

	// invoke the callback with the dialog contents as the argument
	if (dialog.callback) dialog.callback(dialog.content);
    }

    // callback for keypress in input fields: if user typed ENTER, act
    // like they clicked OK button.
    function dialog_check_for_ENTER(event) {
	var key = (window.event) ? window.event.keyCode : event.keyCode;
	if (key == 13) dialog_okay(event);
    }

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Draggable, resizeable, closeable window
    //
    ////////////////////////////////////////////////////////////////////////////////

    // build a 2-column HTML table from an associative array (keys as text in
    // column 1, values in column 2).
    function build_table(a) {
	var tbl = document.createElement('table');

	// build a row for each element in associative array
	for (var i in a) {
	    var label = document.createTextNode(i + ': ');
	    var col1 = document.createElement('td');
	    col1.appendChild(label);
	    var col2 = document.createElement('td');
	    col2.appendChild(a[i]);
	    var row = document.createElement('tr');
	    row.appendChild(col1);
	    row.appendChild(col2);
	    row.style.verticalAlign = 'center';
	    tbl.appendChild(row);
	}

	return tbl;
    }

    // build an input field
    function build_input(type,size,value) {
	var input = document.createElement('input');
	input.type = type;
	input.size = size;
	input.className = 'property';  // make this easier to find later
	if (value == undefined) input.value = '';
	else input.value = value.toString();
	return input;
    }

    // build a select widget using the strings found in the options array
    function build_select(options,selected) {
	var select = document.createElement('select');
	for (var i = 0; i < options.length; i++) {
	    var option = document.createElement('option');
	    option.text = options[i];
	    select.add(option);
	    if (options[i] == selected) select.selectedIndex = i;
	}
	return select;
    }

    Schematic.prototype.window = function(title,content,offset) {
	// create the div for the top level of the window
	var win = document.createElement('div');
	win.sch = this;
	win.content = content;
	win.drag_x = undefined;
	win.draw_y = undefined;

	// div to hold the title
	var head = document.createElement('div');
	head.style.backgroundColor = 'black';
	head.style.color = 'white';
	head.style.textAlign = 'center';
	head.style.padding = '5px';
	head.appendChild(document.createTextNode(title));
	head.win = win;
	win.head = head;

	var close_button = new Image();
	close_button.src = close_icon;
	close_button.style.cssFloat = 'right';
	close_button.addEventListener('click',window_close_button,false);
	close_button.win = win;
	head.appendChild(close_button);

	win.appendChild(head);

	// capture mouse events in title bar
	head.addEventListener('mousedown',window_mouse_down,false);

	// div to hold the content
	//var body = document.createElement('div');
	//body.appendChild(content);
	win.appendChild(content);
	content.win = win;   // so content can contact us

	// compute location relative to canvas
	if (offset == undefined) offset = 0;
	win.left = this.canvas.mouse_x + offset;
	win.top = this.canvas.mouse_y + offset;

	// add to DOM
	win.style.background = 'white';
	//win.style.zIndex = '1000';
	win.style.position = 'absolute';
	win.style.left = win.left + 'px';
	win.style.top = win.top + 'px';
	win.style.border = '2px solid';

	this.canvas.parentNode.insertBefore(win,this.canvas);
	bring_to_front(win,true);
    };

    // adjust zIndex of pop-up window so that it is in front
    function bring_to_front(win,insert) {
	var wlist = win.sch.window_list;
	var i = wlist.indexOf(win);

	// remove from current position (if any) in window list
	if (i != -1) wlist.splice(i,1);

	// if requested, add to end of window list
	if (insert) wlist.push(win);

	// adjust all zIndex values
	for (i = 0; i < wlist.length; i += 1)
	    wlist[i].style.zIndex = 1000 + i;
    }

    // close the window
    function window_close(win) {
	// remove the window from the top-level div of the schematic
	win.parentNode.removeChild(win);

	// remove from list of pop-up windows
	bring_to_front(win,false);
    }

    function window_close_button(event) {
	if (!event) event = window.event;
	var src = (window.event) ? event.srcElement : event.target;
	window_close(src.win);
    }

    // capture mouse events in title bar of window
    function window_mouse_down(event) {
	if (!event) event = window.event;
	var src = (window.event) ? event.srcElement : event.target;
	var win = src.win;

	bring_to_front(win,true);

	// add handlers to document so we capture them no matter what
	document.addEventListener('mousemove',window_mouse_move,false);
	document.addEventListener('mouseup',window_mouse_up,false);
	document.tracking_window = win;

	// remember where mouse is so we can compute dx,dy during drag
	win.drag_x = event.pageX;
	win.drag_y = event.pageY;

	return false;
    }

    function window_mouse_up(event) {
	var win = document.tracking_window;

	// show's over folks...
	document.removeEventListener('mousemove',window_mouse_move,false);
	document.removeEventListener('mouseup',window_mouse_up,false);
	document.tracking_window = undefined;
	win.drag_x = undefined;
	win.drag_y = undefined;
	return true;  // consume event
    }

    function window_mouse_move(event) {
	var win = document.tracking_window;

	if (win.drag_x) {
	    var dx = event.pageX - win.drag_x;
	    var dy = event.pageY - win.drag_y;

	    // move the window
	    win.left += dx;
	    win.top += dy;
	    win.style.left = win.left + 'px';
	    win.style.top = win.top + 'px';

	    // update reference point
	    win.drag_x += dx;
	    win.drag_y += dy;

	    return true;  // consume event
	}
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Toolbar
    //
    ////////////////////////////////////////////////////////////////////////////////

    Schematic.prototype.add_tool = function(icon,tip,callback) {
	var tool;
	if (icon.search('data:image') != -1) {
	    tool = document.createElement('img');
	    tool.src = icon;
	} else {
	    tool = document.createElement('span');
	    tool.style.font = 'small-caps small sans-serif';
	    var label = document.createTextNode(icon);
	    tool.appendChild(label);
	}

	// decorate tool
	tool.style.borderWidth = '1px';
	tool.style.borderStyle = 'solid';
	tool.style.borderColor = background_style;
	tool.style.padding = '2px';
	tool.style.verticalAlign = 'middle';
	tool.style.cursor = 'default';

	// set up event processing
	tool.addEventListener('mouseover',tool_enter,false);
	tool.addEventListener('mouseout',tool_leave,false);
	tool.addEventListener('click',tool_click,false);

	// add to toolbar
	tool.sch = this;
	tool.tip = tip;
	tool.callback = callback;
	this.toolbar.push(tool);

	tool.enabled = false;
	tool.style.opacity = 0.2;

	return tool;
    };

    Schematic.prototype.enable_tool = function(tname,which) {
	var tool = this.tools[tname];

	if (tool != undefined) {
	    tool.style.opacity = which ? 1.0 : 0.2;
	    tool.enabled = which;

	    // if disabling tool, remove border and tip
	    if (!which) {
		tool.style.borderColor = background_style;
		tool.sch.message('');
	    }
	}
    };

    // highlight tool button by turning on border, changing background
    function tool_enter(event) {
	if (!event) event = window.event;
	var tool = (window.event) ? event.srcElement : event.target;

	if (tool.enabled) {
	    tool.style.borderColor = normal_style;
	    tool.sch.message(tool.tip);
	    tool.opacity = 1.0;
	}
    }

    // unhighlight tool button by turning off border, reverting to normal background
    function tool_leave(event) {
	if (!event) event = window.event;
	var tool = (window.event) ? event.srcElement : event.target;

	if (tool.enabled) {
	    tool.style.borderColor = background_style;
	    tool.sch.message('');
	}
    }

    // handle click on a tool
    function tool_click(event) {
	if (!event) event = window.event;
	var tool = (window.event) ? event.srcElement : event.target;

	if (tool.enabled) {
	    tool.sch.canvas.relMouseCoords(event);  // so we can position pop-up window correctly
	    tool.callback.call(tool.sch);
	}
    }

    help_icon = 'data:image/gif;base64,R0lGODlhEAAQAJEAAAAAAP///wAAAAAAACH5BAkAAAIAIf8LSUNDUkdCRzEwMTL/AAAHqGFwcGwCIAAAbW50clJHQiBYWVogB9kAAgAZAAsAGgALYWNzcEFQUEwAAAAAYXBwbAAAAAAAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1hcHBsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALZGVzYwAAAQgAAABvZHNjbQAAAXgAAAVsY3BydAAABuQAAAA4d3RwdAAABxwAAAAUclhZWgAABzAAAAAUZ1hZWgAAB0QAAAAUYlhZWgAAB1gAAAAUclRSQwAAB2wAAAAOY2hhZAAAB3wAAAAsYlRSQwAAB2wAAAAOZ1RS/0MAAAdsAAAADmRlc2MAAAAAAAAAFEdlbmVyaWMgUkdCIFByb2ZpbGUAAAAAAAAAAAAAABRHZW5lcmljIFJHQiBQcm9maWxlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABtbHVjAAAAAAAAAB4AAAAMc2tTSwAAACgAAAF4aHJIUgAAACgAAAGgY2FFUwAAACQAAAHIcHRCUgAAACYAAAHsdWtVQQAAACoAAAISZnJGVQAAACgAAAI8emhUVwAAABYAAAJkaXRJVAAAACgAAAJ6bmJOTwAAACYAAAKia29LUgAAABYAAP8CyGNzQ1oAAAAiAAAC3mhlSUwAAAAeAAADAGRlREUAAAAsAAADHmh1SFUAAAAoAAADSnN2U0UAAAAmAAAConpoQ04AAAAWAAADcmphSlAAAAAaAAADiHJvUk8AAAAkAAADomVsR1IAAAAiAAADxnB0UE8AAAAmAAAD6G5sTkwAAAAoAAAEDmVzRVMAAAAmAAAD6HRoVEgAAAAkAAAENnRyVFIAAAAiAAAEWmZpRkkAAAAoAAAEfHBsUEwAAAAsAAAEpHJ1UlUAAAAiAAAE0GFyRUcAAAAmAAAE8mVuVVMAAAAmAAAFGGRhREsAAAAuAAAFPgBWAWEAZQBvAGIAZQD/YwBuAP0AIABSAEcAQgAgAHAAcgBvAGYAaQBsAEcAZQBuAGUAcgBpAQ0AawBpACAAUgBHAEIAIABwAHIAbwBmAGkAbABQAGUAcgBmAGkAbAAgAFIARwBCACAAZwBlAG4A6AByAGkAYwBQAGUAcgBmAGkAbAAgAFIARwBCACAARwBlAG4A6QByAGkAYwBvBBcEMAQzBDAEOwRMBD0EOAQ5ACAEPwRABD4ERAQwBDkEOwAgAFIARwBCAFAAcgBvAGYAaQBsACAAZwDpAG4A6QByAGkAcQB1AGUAIABSAFYAQpAadSgAIABSAEcAQgAggnJfaWPPj/AAUAByAG8AZgBp/wBsAG8AIABSAEcAQgAgAGcAZQBuAGUAcgBpAGMAbwBHAGUAbgBlAHIAaQBzAGsAIABSAEcAQgAtAHAAcgBvAGYAaQBsx3y8GAAgAFIARwBCACDVBLhc0wzHfABPAGIAZQBjAG4A/QAgAFIARwBCACAAcAByAG8AZgBpAGwF5AXoBdUF5AXZBdwAIABSAEcAQgAgBdsF3AXcBdkAQQBsAGwAZwBlAG0AZQBpAG4AZQBzACAAUgBHAEIALQBQAHIAbwBmAGkAbADBAGwAdABhAGwA4QBuAG8AcwAgAFIARwBCACAAcAByAG8AZgBpAGxmbpAaACAAUgBHAEIAIGPPj//wZYdO9k4AgiwAIABSAEcAQgAgMNcw7TDVMKEwpDDrAFAAcgBvAGYAaQBsACAAUgBHAEIAIABnAGUAbgBlAHIAaQBjA5MDtQO9A7kDugPMACADwAPBA78DxgOvA7sAIABSAEcAQgBQAGUAcgBmAGkAbAAgAFIARwBCACAAZwBlAG4A6QByAGkAYwBvAEEAbABnAGUAbQBlAGUAbgAgAFIARwBCAC0AcAByAG8AZgBpAGUAbA5CDhsOIw5EDh8OJQ5MACAAUgBHAEIAIA4XDjEOSA4nDkQOGwBHAGUAbgBlAGwAIABSAEcAQgAgAFAAcgBvAGYAaQBsAGkAWQBsAGX/AGkAbgBlAG4AIABSAEcAQgAtAHAAcgBvAGYAaQBpAGwAaQBVAG4AaQB3AGUAcgBzAGEAbABuAHkAIABwAHIAbwBmAGkAbAAgAFIARwBCBB4EMQRJBDgEOQAgBD8EQAQ+BEQEOAQ7BEwAIABSAEcAQgZFBkQGQQAgBioGOQYxBkoGQQAgAFIARwBCACAGJwZEBjkGJwZFAEcAZQBuAGUAcgBpAGMAIABSAEcAQgAgAFAAcgBvAGYAaQBsAGUARwBlAG4AZQByAGUAbAAgAFIARwBCAC0AYgBlAHMAawByAGkAdgBlAGwAcwBldGV4dAAAAABDb3B5cmlnaHQgMjAwrzcgQXBwbGUgSW5jLiwgYWxsIHJpZ2h0cyByZXNlcnZlZC4AWFlaIAAAAAAAAPNSAAEAAAABFs9YWVogAAAAAAAAdE0AAD3uAAAD0FhZWiAAAAAAAABadQAArHMAABc0WFlaIAAAAAAAACgaAAAVnwAAuDZjdXJ2AAAAAAAAAAEBzQAAc2YzMgAAAAAAAQxCAAAF3v//8yYAAAeSAAD9kf//+6L///2jAAAD3AAAwGwALAAAAAAQABAAAAIglI+pwK3XInhSLoZc0oa/7lHRB4bXRJZoaqau+o6ujBQAOw==';

    cut_icon = 'data:image/gif;base64,R0lGODlhEAAQALMAAAAAAIAAAACAAICAAAAAgIAAgACAgMDAwICAgP8AAAD/AP//AAAA//8A/wD//////yH5BAEAAAcALAAAAAAQABAAAAQu8MhJqz1g5qs7lxv2gRkQfuWomarXEgDRHjJhf3YtyRav0xcfcFgR0nhB5OwTAQA7';

    copy_icon = 'data:image/gif;base64,R0lGODlhEAAQALMAAAAAAIAAAACAAICAAAAAgIAAgACAgMDAwICAgP8AAAD/AP//AAAA//8A/wD//////yH5BAEAAAcALAAAAAAQABAAAAQ+8MhJ6wE4Wwqef9gmdV8HiKZJrCz3ecS7TikWfzExvk+M9a0a4MbTkXCgTMeoHPJgG5+yF31SLazsTMTtViIAOw==';

    paste_icon = 'data:image/gif;base64,R0lGODlhEAAQALMAAAAAAIAAAACAAICAAAAAgIAAgACAgMDAwICAgP8AAAD/AP//AAAA//8A/wD//////yH5BAEAAAcALAAAAAAQABAAAARL8MhJqwUYWJnxWp3GDcgAgCdQIqLKXmVLhhnyHiqpr7rME8AgocVDEB5IJHD0SyofBFzxGIQGAbvB0ZkcTq1CKK6z5YorwnR0w44AADs=';

    close_icon = 'data:image/gif;base64,R0lGODlhEAAQAMQAAGtra/f3/62tre/v9+bm787O1pycnHNzc6WlpcXFxd7e3tbW1nt7e7W1te/v74SEhMXFzmNjY+bm5v///87OzgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAAAAAAALAAAAAAQABAAAAVt4DRMZGmSwRQQBUS9MAwRIyQ5Uq7neEFSDtxOF4T8cobIQaE4RAQ5yjHHiCCSD510QtFGvoCFdppDfBu7bYzy+D7WP5ggAgA8Y3FKwi5IAhIweW1vbBGEWy5rilsFi2tGAwSJixAFBCkpJ5ojIQA7';

    grid_icon = 'data:image/gif;base64,R0lGODlhEAAQAMQAAAAAAP///zAwYT09bpGRqZ6et5iYsKWlvbi40MzM5cXF3czM5OHh5tTU2fDw84uMom49DbWKcfLy8g0NDcDAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABQALAAAAAAQABAAAAUtICWOZGmeKDCqIlu68AvMdO2ueHvGuslTN6Bt6MsBd8Zg77hsDW3FpRJFrYpCADs=';

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Graphing
    //
    ///////////////////////////////////////////////////////////////////////////////

    // add dashed lines!
    // from http://davidowens.wordpress.com/2010/09/07/html-5-canvas-and-dashed-lines/
    try {
	if (CanvasRenderingContext2D)
	    CanvasRenderingContext2D.prototype.dashedLineTo = function(fromX, fromY, toX, toY, pattern) {
		// Our growth rate for our line can be one of the following:
		//   (+,+), (+,-), (-,+), (-,-)
		// Because of this, our algorithm needs to understand if the x-coord and
		// y-coord should be getting smaller or larger and properly cap the values
		// based on (x,y).
		var lt = function (a, b) { return a <= b; };
		var gt = function (a, b) { return a >= b; };
		var capmin = function (a, b) { return Math.min(a, b); };
		var capmax = function (a, b) { return Math.max(a, b); };

		var checkX = { thereYet: gt, cap: capmin };
		var checkY = { thereYet: gt, cap: capmin };

		if (fromY - toY > 0) {
		    checkY.thereYet = lt;
		    checkY.cap = capmax;
		}
		if (fromX - toX > 0) {
		    checkX.thereYet = lt;
		    checkX.cap = capmax;
		}

		this.moveTo(fromX, fromY);
		var offsetX = fromX;
		var offsetY = fromY;
		var idx = 0, dash = true;
		while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
		    var ang = Math.atan2(toY - fromY, toX - fromX);
		    var len = pattern[idx];

		    offsetX = checkX.cap(toX, offsetX + (Math.cos(ang) * len));
		    offsetY = checkY.cap(toY, offsetY + (Math.sin(ang) * len));

		    if (dash) this.lineTo(offsetX, offsetY);
		    else this.moveTo(offsetX, offsetY);

		    idx = (idx + 1) % pattern.length;
		    dash = !dash;
		}
	    };
    }
    catch (err) { //noop
    }
    // given a range of values, return a new range [vmin',vmax'] where the limits
    // have been chosen "nicely".  Taken from matplotlib.ticker.LinearLocator
    function view_limits(vmin,vmax) {
	// deal with degenerate case...
	if (vmin == vmax) {
	    if (vmin == 0) { vmin = -0.5; vmax = 0.5; }
	    else {
		vmin = vmin > 0 ? 0.9*vmin : 1.1*vmin;
		vmax = vmax > 0 ? 1.1*vmax : 0.9*vmax;
	    }
	}

	var log_range = Math.log(vmax - vmin)/Math.LN10;
	var exponent = Math.floor(log_range);
	//if (log_range - exponent < 0.5) exponent -= 1;
	var scale = Math.pow(10,-exponent);
	vmin = Math.floor(scale*vmin)/scale;
	vmax = Math.ceil(scale*vmax)/scale;

	return [vmin,vmax,1.0/scale];
    }

    function engineering_notation(n,nplaces,trim) {
	if (n == 0) return '0';
	if (n == undefined) return 'undefined';
	if (trim == undefined) trim = true;

	var sign = n < 0 ? -1 : 1;
	var log10 = Math.log(sign*n)/Math.LN10;
	var exp = Math.floor(log10/3);   // powers of 1000
	var mantissa = sign*Math.pow(10,log10 - 3*exp);

	// keep specified number of places following decimal point
	var mstring = (mantissa + sign*0.5*Math.pow(10,-nplaces)).toString();
	var mlen = mstring.length;
	var endindex = mstring.indexOf('.');
	if (endindex != -1) {
	    if (nplaces > 0) {
		endindex += nplaces + 1;
		if (endindex > mlen) endindex = mlen;
		if (trim) {
		    while (mstring.charAt(endindex-1) == '0') endindex -= 1;
		    if (mstring.charAt(endindex-1) == '.') endindex -= 1;
		}
	    }
	    if (endindex < mlen)
		mstring = mstring.substring(0,endindex);
	}

	switch(exp) {
	case -5:	return mstring+"f";
	case -4:	return mstring+"p";
	case -3:	return mstring+"n";
	case -2:	return mstring+"u";
	case -1:	return mstring+"m";
	case 0:	return mstring;
	case 1:	return mstring+"K";
	case 2:	return mstring+"M";
	case 3:	return mstring+"G";
	}

	// don't have a good suffix, so just print the number
	return n.toString();
    }

    var grid_pattern = [1,2];
    var cursor_pattern = [5,5];

    // x_values is an array of x coordinates for each of the plots
    // y_values is an array of [color, value_array], one entry for each plot on left vertical axis
    // z_values is an array of [color, value_array], one entry for each plot on right vertical axis
    Schematic.prototype.graph = function(x_values,x_legend,y_values,y_legend,z_values,z_legend) {
	var pwidth = 400;	// dimensions of actual plot
	var pheight = 300;	// dimensions of actual plot
	var left_margin = (y_values != undefined && y_values.length > 0) ? 55 : 25;
	var top_margin = 25;
	var right_margin = (z_values != undefined && z_values.length > 0) ? 55 : 25;
	var bottom_margin = 45;
	var tick_length = 5;

	var w = pwidth + left_margin + right_margin;
	var h = pheight + top_margin + bottom_margin;

	var canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;

	// the graph itself will be drawn here and this image will be copied
	// onto canvas, where it can be overlayed with mouse cursors, etc.
	var bg_image = document.createElement('canvas');
	bg_image.width = w;
	bg_image.height = h;
	canvas.bg_image = bg_image;	// so we can find it during event handling

	// start by painting an opaque background
	var c = bg_image.getContext('2d');
	c.fillStyle = background_style;
	c.fillRect(0,0,w,h);
	c.fillStyle = element_style;
	c.fillRect(left_margin,top_margin,pwidth,pheight);

	// figure out scaling for plots
	var x_min = array_min(x_values);
	var x_max = array_max(x_values);
	var x_limits = view_limits(x_min,x_max);
	x_min = x_limits[0];
	x_max = x_limits[1];
	var x_scale = pwidth/(x_max - x_min);

	function plot_x(x) {
	    return (x - x_min)*x_scale + left_margin;
	}

	// draw x grid
	c.strokeStyle = grid_style;
	c.lineWidth = 1;
	c.fillStyle = normal_style;
	c.font = '10pt sans-serif';
	c.textAlign = 'center';
	c.textBaseline = 'top';
	var end = top_margin + pheight;
	for (var x = x_min; x <= x_max; x += x_limits[2]) {
	    var temp = plot_x(x) + 0.5;  // keep lines crisp!

	    // grid line
	    c.beginPath();
	    if (x == x_min) {
		c.moveTo(temp,top_margin);
		c.lineTo(temp,end);
	    } else
	    c.dashedLineTo(temp,top_margin,temp,end,grid_pattern);
	    c.stroke();

	    // tick mark
	    c.beginPath();
	    c.moveTo(temp,end);
	    c.lineTo(temp,end + tick_length);
	    c.stroke();
	    c.fillText(engineering_notation(x,2),temp,end + tick_length);
	}

	if (y_values != undefined && y_values.length > 0) {
	    var y_min = Infinity;
	    var y_max = -Infinity;
	    var plot;
	    for (plot = y_values.length - 1; plot >= 0; --plot) {
		var values = y_values[plot][2];
		if (values == undefined) continue;  // no data points
		var offset = y_values[plot][1];
		var temp = array_min(values) + offset;
		if (temp < y_min) y_min = temp;
		temp = array_max(values) + offset;
		if (temp > y_max) y_max = temp;
	    }
	    var y_limits = view_limits(y_min,y_max);
	    y_min = y_limits[0];
	    y_max = y_limits[1];
	    var y_scale = pheight/(y_max - y_min);

	    function plot_y(y) {
		return (y_max - y)*y_scale + top_margin;
	    }

	    // draw y grid
	    c.textAlign = 'right';
	    c.textBaseline = 'middle';
	    for (var y = y_min; y <= y_max; y += y_limits[2]) {
		if (Math.abs(y/y_max) < 0.001) y = 0.0; // Just 3 digits
		var temp = plot_y(y) + 0.5;  // keep lines crisp!

		// grid line
		c.beginPath();
		if (y == y_min) {
		    c.moveTo(left_margin,temp);
		    c.lineTo(left_margin + pwidth,temp);
		} else
		c.dashedLineTo(left_margin,temp,left_margin + pwidth,temp,grid_pattern);
		c.stroke();

		// tick mark
		c.beginPath();
		c.moveTo(left_margin - tick_length,temp);
		c.lineTo(left_margin,temp);
		c.stroke();
		c.fillText(engineering_notation(y,2),left_margin - tick_length -2,temp);
	    }

	    // now draw each plot
	    var x,y;
	    var nx,ny;
	    c.lineWidth = 3;
	    c.lineCap = 'round';
	    for (plot = y_values.length - 1; plot >= 0; --plot) {
		var color = probe_colors_rgb[y_values[plot][0]];
		if (color == undefined) continue;  // no plot color (== x-axis)
		c.strokeStyle = color;
		var values = y_values[plot][2];
		if (values == undefined) continue;  // no data points
		var offset = y_values[plot][1];

		x = plot_x(x_values[0]);
		y = plot_y(values[0] + offset);
		c.beginPath();
		c.moveTo(x,y);
		for (var i = 1; i < x_values.length; i++) {
		    nx = plot_x(x_values[i]);
		    ny = plot_y(values[i] + offset);
		    c.lineTo(nx,ny);
		    x = nx;
		    y = ny;
		    if (i % 100 == 99) {
			// too many lineTo's cause canvas to break
			c.stroke();
			c.beginPath();
			c.moveTo(x,y);
		    }
		}
		c.stroke();
	    }
	}

	if (z_values != undefined && z_values.length > 0) {
	    var z_min = Infinity;
	    var z_max = -Infinity;
	    for (plot = z_values.length - 1; plot >= 0; --plot) {
		var values = z_values[plot][2];
		if (values == undefined) continue;  // no data points
		var offset = z_values[plot][1];
		var temp = array_min(values) + offset;
		if (temp < z_min) z_min = temp;
		temp = array_max(values) + offset;
		if (temp > z_max) z_max = temp;
	    }
	    var z_limits = view_limits(z_min,z_max);
	    z_min = z_limits[0];
	    z_max = z_limits[1];
	    var z_scale = pheight/(z_max - z_min);

	    function plot_z(z) {
		return (z_max - z)*z_scale + top_margin;
	    }

	    // draw z ticks
	    c.textAlign = 'left';
	    c.textBaseline = 'middle';
	    c.lineWidth = 1;
	    c.strokeStyle = normal_style;
	    var tick_length_half = Math.floor(tick_length/2);
	    var tick_delta = tick_length - tick_length_half;
	    for (var z = z_min; z <= z_max; z += z_limits[2]) {
		if (Math.abs(z/z_max) < 0.001) z = 0.0; // Just 3 digits
		var temp = plot_z(z) + 0.5;  // keep lines crisp!

		// tick mark
		c.beginPath();
		c.moveTo(left_margin + pwidth - tick_length_half,temp);
		c.lineTo(left_margin + pwidth + tick_delta,temp);
		c.stroke();
		c.fillText(engineering_notation(z,2),left_margin + pwidth + tick_length + 2,temp);
	    }

	    var z;
	    var nz;
	    c.lineWidth = 3;
	    for (plot = z_values.length - 1; plot >= 0; --plot) {
		var color = probe_colors_rgb[z_values[plot][0]];
		if (color == undefined) continue;  // no plot color (== x-axis)
		c.strokeStyle = color;
		var values = z_values[plot][2];
		if (values == undefined) continue;  // no data points
		var offset = z_values[plot][1];

		x = plot_x(x_values[0]);
		z = plot_z(values[0] + offset);
		c.beginPath();
		c.moveTo(x,z);
		for (var i = 1; i < x_values.length; i++) {
		    nx = plot_x(x_values[i]);
		    nz = plot_z(values[i] + offset);
		    c.lineTo(nx,nz);
		    x = nx;
		    z = nz;
		    if (i % 100 == 99) {
			// too many lineTo's cause canvas to break
			c.stroke();
			c.beginPath();
			c.moveTo(x,z);
		    }
		}
		c.stroke();
	    }
	}

	// draw legends
	c.font = '12pt sans-serif';
	c.textAlign = 'center';
	c.textBaseline = 'bottom';
	c.fillText(x_legend,left_margin + pwidth/2,h - 5);

	if (y_values != undefined && y_values.length > 0) {
	    c.textBaseline = 'top';
	    c.save();
	    c.translate(5 ,top_margin + pheight/2);
	    c.rotate(-Math.PI/2);
	    c.fillText(y_legend,0,0);
	    c.restore();
	}

	if (z_values != undefined && z_values.length > 0) {
	    c.textBaseline = 'bottom';
	    c.save();
	    c.translate(w-5 ,top_margin + pheight/2);
	    c.rotate(-Math.PI/2);
	    c.fillText(z_legend,0,0);
	    c.restore();
	}

	// save info need for interactions with the graph
	canvas.x_values = x_values;
	canvas.y_values = y_values;
	canvas.z_values = z_values;
	canvas.x_legend = x_legend;
	canvas.y_legend = y_legend;
	canvas.z_legend = y_legend;
	canvas.x_min = x_min;
	canvas.x_scale = x_scale;
	canvas.y_min = y_min;
	canvas.y_scale = y_scale;
	canvas.z_min = z_min;
	canvas.z_scale = z_scale;
	canvas.left_margin = left_margin;
	canvas.top_margin = top_margin;
	canvas.pwidth = pwidth;
	canvas.pheight = pheight;
	canvas.tick_length = tick_length;

	canvas.cursor1_x = undefined;
	canvas.cursor2_x = undefined;
	canvas.sch = this;

	// do something useful when user mouses over graph
	canvas.addEventListener('mousemove',graph_mouse_move,false);

	// return our masterpiece
	redraw_plot(canvas);
	return canvas;
    };

    function array_max(a) {
	max = -Infinity;
	for (var i = a.length - 1; i >= 0; --i)
	    if (a[i] > max) max = a[i];
	return max;
    }

    function array_min(a) {
	min = Infinity;
	for (var i = a.length - 1; i >= 0; --i)
	    if (a[i] < min) min = a[i];
	return min;
    }

    function plot_cursor(c,graph,cursor_x,left_margin) {
	// draw dashed vertical marker that follows mouse
	var x = graph.left_margin + cursor_x;
	var end_y = graph.top_margin + graph.pheight + graph.tick_length;
	c.strokeStyle = grid_style;
	c.lineWidth = 1;
	c.beginPath();
	c.dashedLineTo(x,graph.top_margin,x,end_y,cursor_pattern);
	c.stroke();

	// add x label at bottom of marker
	var graph_x = cursor_x/graph.x_scale + graph.x_min;
	c.font = '10pt sans-serif';
	c.textAlign = 'center';
	c.textBaseline = 'top';
	c.fillStyle = background_style;
	c.fillText('\u2588\u2588\u2588\u2588\u2588',x,end_y);
	c.fillStyle = normal_style;
	c.fillText(engineering_notation(graph_x,3,false),x,end_y);

	// compute which points marker is between
	var x_values = graph.x_values;
	var len = x_values.length;
	var index = 0;
	while (index < len && graph_x >= x_values[index]) index += 1;
	var x1 = (index == 0) ? x_values[0] : x_values[index-1];
	var x2 = x_values[index];

	if (x2 != undefined) {
	    // for each plot, interpolate and output value at intersection with marker
	    c.textAlign = 'left';
	    var tx = graph.left_margin + left_margin;
	    var ty = graph.top_margin;
	    if (graph.y_values != undefined) {
		for (var plot = 0; plot < graph.y_values.length; plot++) {
		    var values = graph.y_values[plot][2];
		    var color = probe_colors_rgb[graph.y_values[plot][0]];
		    if (values == undefined || color == undefined) continue;  // no data points or x-axis

		    // interpolate signal value at graph_x using values[index-1] and values[index]
		    var y1 = (index == 0) ? values[0] : values[index-1];
		    var y2 = values[index];
		    var y = y1;
		    if (graph_x != x1) y += (graph_x - x1)*(y2 - y1)/(x2 - x1);

		    // annotate plot with value of signal at marker
		    c.fillStyle = element_style;
		    c.fillText('\u2588\u2588\u2588\u2588\u2588',tx-3,ty);
		    c.fillStyle = color;
		    c.fillText(engineering_notation(y,3,false),tx,ty);
		    ty += 14;
		}
	    }

	    c.textAlign = 'right';
	    if (graph.z_values != undefined) {
		var tx = graph.left_margin + graph.pwidth - left_margin;
		var ty = graph.top_margin;
		for (var plot = 0; plot < graph.z_values.length; plot++) {
		    var values = graph.z_values[plot][2];
		    var color = probe_colors_rgb[graph.z_values[plot][0]];
		    if (values == undefined || color == undefined) continue;  // no data points or x-axis

		    // interpolate signal value at graph_x using values[index-1] and values[index]
		    var z1 = (index == 0) ? values[0]: values[index-1];
		    var z2 = values[index];
		    var z = z1;
		    if (graph_x != x1) z += (graph_x - x1)*(z2 - z1)/(x2 - x1);

		    // annotate plot with value of signal at marker
		    c.fillStyle = element_style;
		    c.fillText('\u2588\u2588\u2588\u2588\u2588',tx+3,ty);
		    c.fillStyle = color;
		    c.fillText(engineering_notation(z,3,false),tx,ty);
		    ty += 14;
		}
	    }
	}
    }

    function redraw_plot(graph) {
	var c = graph.getContext('2d');
	c.drawImage(graph.bg_image,0,0);

	if (graph.cursor1_x != undefined) plot_cursor(c,graph,graph.cursor1_x,4);
	if (graph.cursor2_x != undefined) plot_cursor(c,graph,graph.cursor2_x,30);

	/*
	 if (graph.cursor1_x != undefined) {
	 // draw dashed vertical marker that follows mouse
	 var x = graph.left_margin + graph.cursor1_x;
	 var end_y = graph.top_margin + graph.pheight + graph.tick_length;
	 c.strokeStyle = grid_style;
	 c.lineWidth = 1;
	 c.beginPath();
	 c.dashedLineTo(x,graph.top_margin,x,end_y,cursor_pattern);
	 c.stroke();

	 // add x label at bottom of marker
	 var graph_x = graph.cursor1_x/graph.x_scale + graph.x_min;
	 c.font = '10pt sans-serif';
	 c.textAlign = 'center';
	 c.textBaseline = 'top';
	 c.fillStyle = background_style;
	 c.fillText('\u2588\u2588\u2588\u2588\u2588',x,end_y);
	 c.fillStyle = normal_style;
	 c.fillText(engineering_notation(graph_x,3,false),x,end_y);

	 // compute which points marker is between
	 var x_values = graph.x_values;
	 var len = x_values.length;
	 var index = 0;
	 while (index < len && graph_x >= x_values[index]) index += 1;
	 var x1 = (index == 0) ? x_values[0] : x_values[index-1];
	 var x2 = x_values[index];

	 if (x2 != undefined) {
	 // for each plot, interpolate and output value at intersection with marker
	 c.textAlign = 'left';
	 var tx = graph.left_margin + 4;
	 var ty = graph.top_margin;
	 for (var plot = 0; plot < graph.y_values.length; plot++) {
	 var values = graph.y_values[plot][1];

	 // interpolate signal value at graph_x using values[index-1] and values[index]
	 var y1 = (index == 0) ? values[0] : values[index-1];
	 var y2 = values[index];
	 var y = y1;
	 if (graph_x != x1) y += (graph_x - x1)*(y2 - y1)/(x2 - x1);

	 // annotate plot with value of signal at marker
	 c.fillStyle = element_style;
	 c.fillText('\u2588\u2588\u2588\u2588\u2588',tx-3,ty);
	 c.fillStyle = probe_colors_rgb[graph.y_values[plot][0]];
	 c.fillText(engineering_notation(y,3,false),tx,ty);
	 ty += 14;
	 }
	 }
	 }
	 */
    }

    function graph_mouse_move(event) {
	if (!event) event = window.event;
	var g = (window.event) ? event.srcElement : event.target;

	g.relMouseCoords(event);
	// not sure yet where the 3,-3 offset correction comes from (borders? padding?)
	var gx = g.mouse_x - g.left_margin - 3;
	var gy = g.pheight - (g.mouse_y - g.top_margin) + 3;
	if (gx >= 0 && gx <= g.pwidth && gy >=0 && gy <= g.pheight) {
	    //g.sch.message('button: '+event.button+', which: '+event.which);
	    g.cursor1_x = gx;
	} else {
	    g.cursor1_x = undefined;
	    g.cursor2_x = undefined;
	}

	redraw_plot(g);
    }

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Parts bin
    //
    ////////////////////////////////////////////////////////////////////////////////

    // one instance will be created for each part in the parts bin
    function Part(sch) {
	this.sch = sch;
	this.component = undefined;
	this.selected = false;

	// set up canvas
	this.canvas = document.createElement('canvas');
	this.canvas.style.borderStyle = 'solid';
	this.canvas.style.borderWidth = '1px';
	this.canvas.style.borderColor = background_style;
	//this.canvas.style.position = 'absolute';
	this.canvas.style.cursor = 'default';
	this.canvas.height = part_w;
	this.canvas.width = part_h;
	this.canvas.part = this;

	this.canvas.addEventListener('mouseover',part_enter,false);
	this.canvas.addEventListener('mouseout',part_leave,false);
	this.canvas.addEventListener('mousedown',part_mouse_down,false);
	this.canvas.addEventListener('mouseup',part_mouse_up,false);

	// make the part "clickable" by registering a dummy click handler
	// this should make things work on the iPad
	this.canvas.addEventListener('click',function(){},false);
    }

    Part.prototype.set_location = function(left,top) {
	this.canvas.style.left = left + 'px';
	this.canvas.style.top = top + 'px';
    };

    Part.prototype.right = function() {
	return this.canvas.offsetLeft + this.canvas.offsetWidth;
    };

    Part.prototype.bottom = function() {
	return this.canvas.offsetTop + this.canvas.offsetHeight;
    };

    Part.prototype.set_component = function(component,tip) {
	component.sch = this;
	this.component = component;
	this.tip = tip;

	// figure out scaling and centering of parts icon
	var b = component.bounding_box;
	var dx = b[2] - b[0];
	var dy = b[3] - b[1];
	this.scale = 0.8; //Math.min(part_w/(1.2*dx),part_h/(1.2*dy));
	this.origin_x = b[0] + dx/2.0 - part_w/(2.0*this.scale);
	this.origin_y = b[1] + dy/2.0 - part_h/(2.0*this.scale);

	this.redraw();
    };

    Part.prototype.redraw = function(part) {
	var c = this.canvas.getContext('2d');

	// paint background color
	c.fillStyle = this.selected ? selected_style : background_style;
	c.fillRect(0,0,part_w,part_h);

	if (this.component) this.component.draw(c);
    };

    Part.prototype.select = function(which) {
	this.selected = which;
	this.redraw();
    };

    Part.prototype.update_connection_point = function(cp,old_location) {
	// no connection points in the parts bin
    };

    Part.prototype.moveTo = function(c,x,y) {
	c.moveTo((x - this.origin_x) * this.scale,(y - this.origin_y) * this.scale);
    };

    Part.prototype.lineTo = function(c,x,y) {
	c.lineTo((x - this.origin_x) * this.scale,(y - this.origin_y) * this.scale);
    };

    Part.prototype.draw_line = function(c,x1,y1,x2,y2,width) {
	c.lineWidth = width*this.scale;
	c.beginPath();
	c.moveTo((x1 - this.origin_x) * this.scale,(y1 - this.origin_y) * this.scale);
	c.lineTo((x2 - this.origin_x) * this.scale,(y2 - this.origin_y) * this.scale);
	c.stroke();
    };

    Part.prototype.draw_arc = function(c,x,y,radius,start_radians,end_radians,anticlockwise,width,filled) {
	c.lineWidth = width*this.scale;
	c.beginPath();
	c.arc((x - this.origin_x)*this.scale,(y - this.origin_y)*this.scale,radius*this.scale,
	      start_radians,end_radians,anticlockwise);
	if (filled) c.fill();
	else c.stroke();
    };

    Part.prototype.draw_text = function(c,text,x,y,size) {
	// no text displayed for the parts icon
    };

    function part_enter(event) {
	if (!event) event = window.event;
	var canvas = (window.event) ? event.srcElement : event.target;
	var part = canvas.part;

	// avoid Chrome bug that changes to text cursor whenever
	// drag starts.  We'll restore the default handler at
	// the appropriate point so behavior in other parts of
	// the document are unaffected.
	//part.sch.saved_onselectstart = document.onselectstart;
	//document.onselectstart = function () { return false; };

	canvas.style.borderColor = normal_style;
	part.sch.message(part.tip+': drag onto diagram to insert');
	return false;
    }

    function part_leave(event) {
	if (!event) event = window.event;
	var canvas = (window.event) ? event.srcElement : event.target;
	var part = canvas.part;

	if (typeof part.sch.new_part == 'undefined') {
	    // leaving with no part selected?  revert handler
	    //document.onselectstart = part.sch.saved_onselectstart;
	}

	canvas.style.borderColor = background_style;
	part.sch.message('');
	return false;
    }

    function part_mouse_down(event) {
	if (!event) event = window.event;
	var part = (window.event) ? event.srcElement.part : event.target.part;

	part.select(true);
	part.sch.new_part = part;
	return false;
    }

    function part_mouse_up(event) {
	if (!event) event = window.event;
	var part = (window.event) ? event.srcElement.part : event.target.part;

	part.select(false);
	part.sch.new_part = undefined;
	return false;
    }

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Rectangle helper functions
    //
    ////////////////////////////////////////////////////////////////////////////////

    // rect is an array of the form [left,top,right,bottom]

    // ensure left < right, top < bottom
    function canonicalize(r) {
	var temp;

	// canonicalize bounding box
	if (r[0] > r[2]) {
	    temp = r[0];
	    r[0] = r[2];
	    r[2] = temp;
	}
	if (r[1] > r[3]) {
	    temp = r[1];
	    r[1] = r[3];
	    r[3] = temp;
	}
    }

    function between(x,x1,x2) {
	return x1 <= x && x <= x2;
    }

    function inside(rect,x,y) {
	return between(x,rect[0],rect[2]) && between(y,rect[1],rect[3]);
    }

    // only works for manhattan rectangles
    function intersect(r1,r2) {
	// look for non-intersection, negate result
	var result = !(r2[0] > r1[2] ||
		       r2[2] < r1[0] ||
		       r2[1] > r1[3] ||
		       r2[3] < r1[1]);

	// if I try to return the above expression, javascript returns undefined!!!
	return result;
    }

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Component base class
    //
    ////////////////////////////////////////////////////////////////////////////////

    function Component(type,x,y,rotation) {
	this.sch = undefined;
	this.type = type;
	this.x = x;
	this.y = y;
	this.rotation = rotation;
	this.selected = false;
	this.properties = new Array();
	this.bounding_box = [0,0,0,0];   // in device coords [left,top,right,bottom]
	this.bbox = this.bounding_box;   // in absolute coords
	this.connections = [];
    }

    Component.prototype.json = function(index) {
	this.properties['_json_'] = index; // remember where we are in the JSON list

	var props = {};
	for (var p in this.properties) props[p] = this.properties[p];

	var conns = [];
	for (var i = 0; i < this.connections.length; i++)
	    conns.push(this.connections[i].json());

	var json = [this.type,[this.x, this.y, this.rotation],props,conns];
	return json;
    };

    Component.prototype.add_connection = function(offset_x,offset_y) {
	this.connections.push(new ConnectionPoint(this,offset_x,offset_y));
    };

    Component.prototype.update_coords = function() {
	var x = this.x;
	var y = this.y;

	// update bbox
	var b = this.bounding_box;
	this.bbox[0] = this.transform_x(b[0],b[1]) + x;
	this.bbox[1] = this.transform_y(b[0],b[1]) + y;
	this.bbox[2] = this.transform_x(b[2],b[3]) + x;
	this.bbox[3] = this.transform_y(b[2],b[3]) + y;
	canonicalize(this.bbox);

	// update connections
	for (var i = this.connections.length - 1; i >= 0; --i)
	    this.connections[i].update_location();
    };

    Component.prototype.rotate = function(amount) {
	var old_rotation = this.rotation;
	this.rotation = (this.rotation + amount) % 8;
	this.update_coords();

	// create an undoable edit record here
	// using old_rotation
    };

    Component.prototype.move_begin = function() {
	// remember where we started this move
	this.move_x = this.x;
	this.move_y = this.y;
    };

    Component.prototype.move = function(dx,dy) {
	// update coordinates
	this.x += dx;
	this.y += dy;
	this.update_coords();
    };

    Component.prototype.move_end = function() {
	var dx = this.x - this.move_x;
	var dy = this.y - this.move_y;

	if (dx != 0 || dy != 0) {
	    // create an undoable edit record here

	    this.sch.check_wires(this);
	}
    };

    Component.prototype.add = function(sch) {
	this.sch = sch;   // we now belong to a schematic!
	sch.add_component(this);
	this.update_coords();
    };

    Component.prototype.remove = function() {
	// remove connection points from schematic
	for (var i = this.connections.length - 1; i >= 0; --i) {
	    var cp = this.connections[i];
	    this.sch.remove_connection_point(cp,cp.location);
	}

	// remove component from schematic
	this.sch.remove_component(this);
	this.sch = undefined;

	// create an undoable edit record here
    };

    Component.prototype.transform_x = function(x,y) {
	var rot = this.rotation;
	if (rot == 0 || rot == 6) return x;
	else if (rot == 1 || rot == 5) return -y;
	else if (rot == 2 || rot == 4) return -x;
	else return y;
    };

    Component.prototype.transform_y = function(x,y) {
	var rot = this.rotation;
	if (rot == 1 || rot == 7) return x;
	else if (rot == 2 || rot == 6) return -y;
	else if (rot == 3 || rot == 5) return -x;
	else return y;
    };

    Component.prototype.moveTo = function(c,x,y) {
	var nx = this.transform_x(x,y) + this.x;
	var ny = this.transform_y(x,y) + this.y;
	this.sch.moveTo(c,nx,ny);
    };

    Component.prototype.lineTo = function(c,x,y) {
	var nx = this.transform_x(x,y) + this.x;
	var ny = this.transform_y(x,y) + this.y;
	this.sch.lineTo(c,nx,ny);
    };

    Component.prototype.draw_line = function(c,x1,y1,x2,y2) {
	c.strokeStyle = this.selected ? selected_style :
            this.type == 'w' ? normal_style : component_style;
	var nx1 = this.transform_x(x1,y1) + this.x;
	var ny1 = this.transform_y(x1,y1) + this.y;
	var nx2 = this.transform_x(x2,y2) + this.x;
	var ny2 = this.transform_y(x2,y2) + this.y;
	this.sch.draw_line(c,nx1,ny1,nx2,ny2,1);
    };

    Component.prototype.draw_circle = function(c,x,y,radius,filled) {
	if (filled) c.fillStyle = this.selected ? selected_style : normal_style;
	else c.strokeStyle = this.selected ? selected_style :
	    this.type == 'w' ? normal_style : component_style;
	var nx = this.transform_x(x,y) + this.x;
	var ny = this.transform_y(x,y) + this.y;

	this.sch.draw_arc(c,nx,ny,radius,0,2*Math.PI,false,1,filled);
    };

    rot_angle = [
	0.0,		// NORTH (identity)
	Math.PI/2,	// EAST (rot270)
	Math.PI,	// SOUTH (rot180)
	3*Math.PI/2,  // WEST (rot90)
	0.0,		// RNORTH (negy)
	Math.PI/2,	// REAST (int-neg)
	Math.PI,	// RSOUTH (negx)
	3*Math.PI/2	// RWEST (int-pos)
    ];

    Component.prototype.draw_arc = function(c,x,y,radius,start_radians,end_radians) {
	c.strokeStyle = this.selected ? selected_style :
            this.type == 'w' ? normal_style : component_style;
	var nx = this.transform_x(x,y) + this.x;
	var ny = this.transform_y(x,y) + this.y;
	this.sch.draw_arc(c,nx,ny,radius,
			  start_radians+rot_angle[this.rotation],end_radians+rot_angle[this.rotation],
			  false,1,false);
    };

    Component.prototype.draw = function(c) {
	/*
	 for (var i = this.connections.length - 1; i >= 0; --i) {
	 var cp = this.connections[i];
	 cp.draw_x(c);
	 }
	 */
    };

    // result of rotating an alignment [rot*9 + align]
    aOrient = [
	0, 1, 2, 3, 4, 5, 6, 7, 8,		// NORTH (identity)
	2, 5, 8, 1, 4, 7, 0, 3, 6, 		// EAST (rot270)
	8, 7, 6, 5, 4, 3, 2, 1, 0,		// SOUTH (rot180)
	6, 3, 0, 7, 4, 1, 8, 5, 3,		// WEST (rot90)
	2, 1, 0, 5, 4, 3, 8, 7, 6,		// RNORTH (negy)
	8, 5, 2, 7, 4, 1, 6, 3, 0, 		// REAST (int-neg)
	6, 7, 8, 3, 4, 5, 0, 1, 2,		// RSOUTH (negx)
	0, 3, 6, 1, 4, 7, 2, 5, 8		// RWEST (int-pos)
    ];

    textAlign = [
	'left', 'center', 'right',
	'left', 'center', 'right',
	'left', 'center', 'right'
    ];

    textBaseline = [
	'top', 'top', 'top',
	'middle', 'middle', 'middle',
	'bottom', 'bottom', 'bottom'
    ];

    Component.prototype.draw_text = function(c,text,x,y,alignment,size,fill) {
	var a = aOrient[this.rotation*9 + alignment];
	c.textAlign = textAlign[a];
	c.textBaseline = textBaseline[a];
	if (fill == undefined)
	    c.fillStyle = this.selected ? selected_style : normal_style;
	else
	    c.fillStyle = fill;
	this.sch.draw_text(c,text,
			   this.transform_x(x,y) + this.x,
			   this.transform_y(x,y) + this.y,
			   size);
    };

    Component.prototype.set_select = function(which) {
	if (which != this.selected) {
	    this.selected = which;
	    // create an undoable edit record here
	}
    };

    Component.prototype.select = function(x,y,shiftKey) {
	this.was_previously_selected = this.selected;
	if (this.near(x,y)) {
	    this.set_select(shiftKey ? !this.selected : true);
	    return true;
	} else return false;
    };

    Component.prototype.select_rect = function(s) {
	this.was_previously_selected = this.selected;
	if (intersect(this.bbox,s))
	    this.set_select(true);
    };

    // if connection point of component c bisects the
    // wire represented by this compononent, return that
    // connection point.  Otherwise return null.
    Component.prototype.bisect = function(c) {
	return null;
    };

    // does mouse click fall on this component?
    Component.prototype.near = function(x,y) {
	return inside(this.bbox,x,y);
    };

    Component.prototype.edit_properties = function(x,y) {
	if (this.near(x,y)) {
	    // make an <input> widget for each property
	    var fields = new Array();
	    for (var i in this.properties)
		// underscore at beginning of property name => system property
		if (i.charAt(0) != '_')
		    fields[i] = build_input('text',10,this.properties[i]);

	    var content = build_table(fields);
	    content.fields = fields;
	    content.component = this;

	    this.sch.dialog('Edit Properties',content,function(content) {
		for (var i in content.fields)
		    content.component.properties[i] = content.fields[i].value;
		content.component.sch.redraw_background();
	    });
	    return true;
	} else return false;
    };

    // clear the labels on all connections
    Component.prototype.clear_labels = function() {
	for (var i = this.connections.length - 1; i >=0; --i) {
	    this.connections[i].clear_label();
	}
    };

    // default action: don't propagate label
    Component.prototype.propagate_label = function(label) {
    };

    // give components a chance to generate default labels for their connection(s)
    // default action: do nothing
    Component.prototype.add_default_labels = function() {
    };

    // component should generate labels for all unlabeled connections
    Component.prototype.label_connections = function() {
	for (var i = this.connections.length - 1; i >=0; --i) {
	    var cp = this.connections[i];
	    if (!cp.label)
		cp.propagate_label(this.sch.get_next_label());
	}
    };

    // default behavior: no probe info
    Component.prototype.probe_info = function() { return undefined; };

    // default behavior: nothing to display for DC analysis
    Component.prototype.display_current = function(c,vmap) {
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Connection point
    //
    ////////////////////////////////////////////////////////////////////////////////

    var connection_point_radius = 2;

    function ConnectionPoint(parent,x,y) {
	this.parent = parent;
	this.offset_x = x;
	this.offset_y = y;
	this.location = '';
	this.update_location();
	this.label = undefined;
    }

    ConnectionPoint.prototype.toString = function() {
	return '<ConnectionPoint ('+this.offset_x+','+this.offset_y+') '+this.parent.toString()+'>';
    };

    ConnectionPoint.prototype.json = function() {
	return this.label;
    };

    ConnectionPoint.prototype.clear_label = function() {
	this.label = undefined;
    };

    ConnectionPoint.prototype.propagate_label = function(label) {
	// should we check if existing label is the same?  it should be...

	if (this.label === undefined) {
	    // label this connection point
	    this.label = label;

	    // propagate label to coincident connection points
	    this.parent.sch.propagate_label(label,this.location);

	    // possibly label other cp's for this device?
	    this.parent.propagate_label(label);
	} else if (this.label != '0' && label != '0' && this.label != label)
	alert("Node has two conflicting labels: "+this.label+", "+label);
    };

    ConnectionPoint.prototype.update_location = function() {
	// update location string which we use as a key to find coincident connection points
	var old_location = this.location;
	var parent = this.parent;
	var nx = parent.transform_x(this.offset_x,this.offset_y) + parent.x;
	var ny = parent.transform_y(this.offset_x,this.offset_y) + parent.y;
	this.x = nx;
	this.y = ny;
	this.location = nx + ',' + ny;

	// add ourselves to the connection list for the new location
	if (parent.sch)
	    parent.sch.update_connection_point(this,old_location);
    };

    ConnectionPoint.prototype.coincident = function(x,y) {
	return this.x==x && this.y==y;
    };

    ConnectionPoint.prototype.draw = function(c,n) {
	if (n != 2)
	    this.parent.draw_circle(c,this.offset_x,this.offset_y,connection_point_radius,n > 2);
    };

    ConnectionPoint.prototype.draw_x = function(c) {
	this.parent.draw_line(c,this.offset_x-2,this.offset_y-2,this.offset_x+2,this.offset_y+2,grid_style);
	this.parent.draw_line(c,this.offset_x+2,this.offset_y-2,this.offset_x-2,this.offset_y+2,grid_style);
    };

    ConnectionPoint.prototype.display_voltage = function(c,vmap) {
	var v = vmap[this.label];
	if (v != undefined) {
	    var label = v.toFixed(2) + 'V';

	    // first draw some solid blocks in the background
	    c.globalAlpha = 0.85;
	    this.parent.draw_text(c,'\u2588\u2588\u2588',this.offset_x,this.offset_y,
				  4,annotation_size,element_style);
	    c.globalAlpha = 1.0;

	    // display the node voltage at this connection point
	    this.parent.draw_text(c,label,this.offset_x,this.offset_y,
				  4,annotation_size,annotation_style);

	    // only display each node voltage once
	    delete vmap[this.label];
	}
    };

    // see if three connection points are collinear
    function collinear(p1,p2,p3) {
	// from http://mathworld.wolfram.com/Collinear.html
	var area = p1.x*(p2.y - p3.y) + p2.x*(p3.y - p1.y) + p3.x*(p1.y - p2.y);
	return area == 0;
    }

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Wire
    //
    ////////////////////////////////////////////////////////////////////////////////

    var near_distance = 2;   // how close to wire counts as "near by"

    function Wire(x1,y1,x2,y2) {
	// arbitrarily call x1,y1 the origin
	Component.call(this,'w',x1,y1,0);
	this.dx = x2 - x1;
	this.dy = y2 - y1;
	this.add_connection(0,0);
	this.add_connection(this.dx,this.dy);

	// compute bounding box (expanded slightly)
	var r = [0,0,this.dx,this.dy];
	canonicalize(r);
	r[0] -= near_distance;
	r[1] -= near_distance;
	r[2] += near_distance;
	r[3] += near_distance;
	this.bounding_box = r;
	this.update_coords();    // update bbox

	// used in selection calculations
	this.len = Math.sqrt(this.dx*this.dx + this.dy*this.dy);
    }
    Wire.prototype = new Component();
    Wire.prototype.constructor = Wire;

    Wire.prototype.toString = function() {
	return '<Wire ('+this.x+','+this.y+') ('+(this.x+this.dx)+','+(this.y+this.dy)+')>';
    };

    // return connection point at other end of wire from specified cp
    Wire.prototype.other_end = function(cp) {
	if (cp == this.connections[0]) return this.connections[1];
	else if (cp == this.connections[1]) return this.connections[0];
	else return undefined;
    };

    Wire.prototype.json = function(index) {
	var json = ['w',[this.x, this.y, this.x+this.dx, this.y+this.dy]];
	return json;
    };

    Wire.prototype.draw = function(c) {
	this.draw_line(c,0,0,this.dx,this.dy);
    };

    Wire.prototype.clone = function(x,y) {
	return new Wire(x,y,x+this.dx,y+this.dy);
    };

    Wire.prototype.near = function(x,y) {
	// crude check: (x,y) within expanded bounding box of wire
	if (inside(this.bbox,x,y)) {
	    // compute distance between x,y and nearst point on line
	    // http://www.allegro.cc/forums/thread/589720
	    var D = Math.abs((x - this.x)*this.dy - (y - this.y)*this.dx)/this.len;
	    if (D <= near_distance) return true;
	}
	return false;
    };

    // selection rectangle selects wire only if it includes
    // one of the end points
    Wire.prototype.select_rect = function(s) {
	this.was_previously_selected = this.selected;
	if (inside(s,this.x,this.y) || inside(s,this.x+this.dx,this.y+this.dy))
	    this.set_select(true);
    };

    // if connection point cp bisects the
    // wire represented by this compononent, return true
    Wire.prototype.bisect_cp = function(cp) {
	var x = cp.x;
	var y = cp.y;

	// crude check: (x,y) within expanded bounding box of wire
	if (inside(this.bbox,x,y)) {
	    // compute distance between x,y and nearst point on line
	    // http://www.allegro.cc/forums/thread/589720
	    var D = Math.abs((x - this.x)*this.dy - (y - this.y)*this.dx)/this.len;
	    // final check: ensure point isn't an end point of the wire
	    if (D < 1 && !this.connections[0].coincident(x,y) && !this.connections[1].coincident(x,y))
		return true;
	}
	return false;
    };

    // if some connection point of component c bisects the
    // wire represented by this compononent, return that
    // connection point.  Otherwise return null.
    Wire.prototype.bisect = function(c) {
	if (c == undefined) return;
	for (var i = c.connections.length - 1; i >= 0; --i) {
	    var cp = c.connections[i];
	    if (this.bisect_cp(cp)) return cp;
	}
	return null;
    };

    Wire.prototype.move_end = function() {
	// look for wires bisected by this wire
	this.sch.check_wires(this);

	// look for connection points that might bisect us
	this.sch.check_connection_points(this);
    };

    // wires "conduct" their label to the other end
    Wire.prototype.propagate_label = function(label) {
	// don't worry about relabeling a cp, it won't recurse!
	this.connections[0].propagate_label(label);
	this.connections[1].propagate_label(label);
    };

    // Wires have no properties to edit
    Wire.prototype.edit_properties = function(x,y) {
	return false;
    };

    // some actual component will start the labeling of electrical nodes,
    // so do nothing here
    Wire.prototype.label_connections = function() {
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Ground
    //
    ////////////////////////////////////////////////////////////////////////////////

    function Ground(x,y,rotation) {
	Component.call(this,'g',x,y,rotation);
	this.add_connection(0,0);
	this.bounding_box = [-6,0,6,8];
	this.update_coords();
    }
    Ground.prototype = new Component();
    Ground.prototype.constructor = Ground;

    Ground.prototype.toString = function() {
	return '<Ground ('+this.x+','+this.y+')>';
    };

    Ground.prototype.draw = function(c) {
	Component.prototype.draw.call(this,c);   // give superclass a shot
	this.draw_line(c,0,0,0,8);
	this.draw_line(c,-6,8,6,8);
    };

    Ground.prototype.clone = function(x,y) {
	return new Ground(x,y,this.rotation);
    };

    // Grounds no properties to edit
    Ground.prototype.edit_properties = function(x,y) {
	return false;
    };

    // give components a chance to generate a label for their connection(s)
    // default action: do nothing
    Ground.prototype.add_default_labels = function() {
	this.connections[0].propagate_label('0');   // canonical label for GND node
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Label
    //
    ////////////////////////////////////////////////////////////////////////////////

    function Label(x,y,rotation,label) {
	Component.call(this,'L',x,y,rotation);
	this.properties['label'] = label ? label : '???';
	this.add_connection(0,0);
	this.bounding_box = [-2,0,2,8];
	this.update_coords();
    }
    Label.prototype = new Component();
    Label.prototype.constructor = Label;

    Label.prototype.toString = function() {
	return '<Label'+' ('+this.x+','+this.y+')>';
    };

    Label.prototype.draw = function(c) {
	Component.prototype.draw.call(this,c);   // give superclass a shot
	this.draw_line(c,0,0,0,8);
	this.draw_text(c,this.properties['label'],0,9,1,property_size);
    };

    Label.prototype.clone = function(x,y) {
	return new Label(x,y,this.rotation,this.properties['label']);
    };

    // give components a chance to generate a label for their connection(s)
    // default action: do nothing
    Label.prototype.add_default_labels = function() {
	this.connections[0].propagate_label(this.properties['label']);
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Voltage Probe
    //
    ////////////////////////////////////////////////////////////////////////////////

    var probe_colors = ['red','green','blue','cyan','magenta','yellow','black','x-axis'];
    var probe_colors_rgb = {
	'red': 'rgb(255,64,64)',
	'green': 'rgb(64,255,64)',
	'blue': 'rgb(64,64,255)',
	'cyan': 'rgb(64,255,255)',
	'magenta' : 'rgb(255,64,255)',
	'yellow': 'rgb(255,255,64)',
	'black': 'rgb(0,0,0)',
	'x-axis': undefined
    };

    function Probe(x,y,rotation,color,offset) {
	Component.call(this,'s',x,y,rotation);
	this.add_connection(0,0);
	this.properties['color'] = color ? color : 'cyan';
	this.properties['offset'] = (offset==undefined || offset=='') ? '0' : offset;
	this.bounding_box = [0,0,27,-21];
	this.update_coords();
    }
    Probe.prototype = new Component();
    Probe.prototype.constructor = Probe;

    Probe.prototype.toString = function() {
	return '<Probe ('+this.x+','+this.y+')>';
    };

    Probe.prototype.draw = function(c) {
	// draw outline
	this.draw_line(c,0,0,4,-4);
	this.draw_line(c,2,-6,6,-2);
	this.draw_line(c,2,-6,17,-21);
	this.draw_line(c,6,-2,21,-17);
	this.draw_line(c,17,-21,21,-17);
	this.draw_arc(c,19,-11,8,3*Math.PI/2,0);

	// fill body with plot color
	var color = probe_colors_rgb[this.properties['color']];
	if (color != undefined) {
	    c.fillStyle = color;
	    c.beginPath();
	    this.moveTo(c,2,-6);
	    this.lineTo(c,6,-2);
	    this.lineTo(c,21,-17);
	    this.lineTo(c,17,-21);
	    this.lineTo(c,2,-6);
	    c.fill();
	} else {
	    this.draw_text(c,this.properties['color'],27,-11,1,property_size);
	}
    };

    Probe.prototype.clone = function(x,y) {
	return new Probe(x,y,this.rotation,this.properties['color'],this.properties['offset']);
    };

    Probe.prototype.edit_properties = function(x,y) {
	if (inside(this.bbox,x,y)) {
	    var fields = new Array();
	    fields['Plot color'] = build_select(probe_colors,this.properties['color']);
	    fields['Plot offset'] = build_input('text',10,this.properties['offset']);

	    var content = build_table(fields);
	    content.fields = fields;
	    content.component = this;

	    this.sch.dialog('Edit Properties',content,function(content) {
		var color_choice = content.fields['Plot color'];
		content.component.properties['color'] = probe_colors[color_choice.selectedIndex];
		content.component.properties['offset'] = content.fields['Plot offset'].value;
		content.component.sch.redraw_background();
	    });
	    return true;
	} else return false;
    };

    // return [color, node_label, offset, type] for this probe
    Probe.prototype.probe_info = function() {
	var color = this.properties['color'];
	var offset = this.properties['offset'];
	if (offset==undefined || offset=="") offset = '0';
	return [color,this.connections[0].label,offset,'voltage'];
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Ammeter Probe
    //
    ////////////////////////////////////////////////////////////////////////////////

    function Ammeter(x,y,rotation,color,offset) {
	Component.call(this,'a',x,y,rotation);
	this.add_connection(0,0);   // pos
	this.add_connection(16,0);   // neg
	this.properties['color'] = color ? color : 'magenta';
	this.properties['offset'] = (offset==undefined || offset=='') ? '0' : offset;
	this.bounding_box = [-3,0,16,3];
	this.update_coords();
    }
    Ammeter.prototype = new Component();
    Ammeter.prototype.constructor = Ammeter;

    Ammeter.prototype.toString = function() {
	return '<Ammeter ('+this.x+','+this.y+')>';
    };

    Ammeter.prototype.move_end = function() {
	Component.prototype.move_end.call(this);   // do the normal processing

	// special for current probes: see if probe has been placed
	// in the middle of wire, creating three wire segments one
	// of which is shorting the two terminals of the probe.  If
	// so, auto remove the shorting segment.
	var e1 = this.connections[0].location;
	var e2 = this.connections[1].location;
	var cplist = this.sch.find_connections(this.connections[0]);
	for (var i = cplist.length - 1; i >= 0; --i) {
	    var c = cplist[i].parent;  // a component connected to ammeter terminal
	    // look for a wire whose end points match those of the ammeter
	    if (c.type == 'w') {
		var c_e1 = c.connections[0].location;
		var c_e2 = c.connections[1].location;
		if ((e1 == c_e1 && c2 == c_e2) || (e1 == c_e2 && e2 == c_e1)) {
		    c.remove();
		    break;
		}
	    }
	}
    };

    Ammeter.prototype.draw = function(c) {
	this.draw_line(c,0,0,16,0);

	// draw chevron in probe color
	c.strokeStyle = probe_colors_rgb[this.properties['color']];
	if (c.strokeStyle != undefined) {
	    c.beginPath();
	    this.moveTo(c,6,-3);
	    this.lineTo(c,10,0);
	    this.lineTo(c,6,3);
	    c.stroke();
	}
    };

    Ammeter.prototype.clone = function(x,y) {
	return new Ammeter(x,y,this.rotation,this.properties['color'],this.properties['offset']);
    };

    // share code with voltage probe
    Ammeter.prototype.edit_properties = Probe.prototype.edit_properties;

    Ammeter.prototype.label = function() {
	var name = this.properties['name'];
	var label = 'I(' + (name ? name : '_' + this.properties['_json_']) + ')';
	return label;
    };

    // display current for DC analysis
    Ammeter.prototype.display_current = function(c,vmap) {
	var label = this.label();
	var v = vmap[label];
	if (v != undefined) {
	    var i = engineering_notation(v,2) + 'A';
	    this.draw_text(c,i,8,-5,7,annotation_size,annotation_style);

	    // only display each current once
	    delete vmap[label];
	}
    };

    // return [color, current_label, offset, type] for this probe
    Ammeter.prototype.probe_info = function() {
	var color = this.properties['color'];
	var offset = this.properties['offset'];
	if (offset==undefined || offset=="") offset = '0';
	return [color,this.label(),offset,'current'];
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Resistor
    //
    ////////////////////////////////////////////////////////////////////////////////

    function Resistor(x,y,rotation,name,r) {
	Component.call(this,'r',x,y,rotation);
	this.properties['name'] = name;
	this.properties['r'] = r ? r : '1';
	this.add_connection(0,0);
	this.add_connection(0,48);
	this.bounding_box = [-5,0,5,48];
	this.update_coords();
    }
    Resistor.prototype = new Component();
    Resistor.prototype.constructor = Resistor;

    Resistor.prototype.toString = function() {
	return '<Resistor '+this.properties['r']+' ('+this.x+','+this.y+')>';
    };

    Resistor.prototype.draw = function(c) {
	Component.prototype.draw.call(this,c);   // give superclass a shot
	this.draw_line(c,0,0,0,12);
	this.draw_line(c,0,12,4,14);
	this.draw_line(c,4,14,-4,18);
	this.draw_line(c,-4,18,4,22);
	this.draw_line(c,4,22,-4,26);
	this.draw_line(c,-4,26,4,30);
	this.draw_line(c,4,30,-4,34);
	this.draw_line(c,-4,34,0,36);
	this.draw_line(c,0,36,0,48);
	if (this.properties['r'])
	    this.draw_text(c,this.properties['r']+'\u03A9',5,24,3,property_size);
	if (this.properties['name'])
	    this.draw_text(c,this.properties['name'],-5,24,5,property_size);
    };

    Resistor.prototype.clone = function(x,y) {
	return new Resistor(x,y,this.rotation,this.properties['name'],this.properties['r']);
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Capacitor
    //
    ////////////////////////////////////////////////////////////////////////////////

    function Capacitor(x,y,rotation,name,c) {
	Component.call(this,'c',x,y,rotation);
	this.properties['name'] = name;
	this.properties['c'] = c ? c : '1p';
	this.add_connection(0,0);
	this.add_connection(0,48);
	this.bounding_box = [-8,0,8,48];
	this.update_coords();
    }
    Capacitor.prototype = new Component();
    Capacitor.prototype.constructor = Capacitor;

    Capacitor.prototype.toString = function() {
	return '<Capacitor '+this.properties['r']+' ('+this.x+','+this.y+')>';
    };

    Capacitor.prototype.draw = function(c) {
	Component.prototype.draw.call(this,c);   // give superclass a shot
	this.draw_line(c,0,0,0,22);
	this.draw_line(c,-8,22,8,22);
	this.draw_line(c,-8,26,8,26);
	this.draw_line(c,0,26,0,48);
	if (this.properties['c'])
	    this.draw_text(c,this.properties['c']+'F',9,24,3,property_size);
	if (this.properties['name'])
	    this.draw_text(c,this.properties['name'],-9,24,5,property_size);
    };

    Capacitor.prototype.clone = function(x,y) {
	return new Capacitor(x,y,this.rotation,this.properties['name'],this.properties['c']);
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Inductor
    //
    ////////////////////////////////////////////////////////////////////////////////

    function Inductor(x,y,rotation,name,l) {
	Component.call(this,'l',x,y,rotation);
	this.properties['name'] = name;
	this.properties['l'] = l ? l : '1n';
	this.add_connection(0,0);
	this.add_connection(0,48);
	this.bounding_box = [-4,0,5,48];
	this.update_coords();
    }
    Inductor.prototype = new Component();
    Inductor.prototype.constructor = Inductor;

    Inductor.prototype.toString = function() {
	return '<Inductor '+this.properties['l']+' ('+this.x+','+this.y+')>';
    };

    Inductor.prototype.draw = function(c) {
	Component.prototype.draw.call(this,c);   // give superclass a shot
	this.draw_line(c,0,0,0,14);
	this.draw_arc(c,0,18,4,6*Math.PI/4,3*Math.PI/4);
	this.draw_arc(c,0,24,4,5*Math.PI/4,3*Math.PI/4);
	this.draw_arc(c,0,30,4,5*Math.PI/4,2*Math.PI/4);
	this.draw_line(c,0,34,0,48);

	if (this.properties['l'])
	    this.draw_text(c,this.properties['l']+'H',6,24,3,property_size);
	if (this.properties['name'])
	    this.draw_text(c,this.properties['name'],-3,24,5,property_size);
    };

    Inductor.prototype.clone = function(x,y) {
	return new Inductor(x,y,this.rotation,this.properties['name'],this.properties['l']);
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Diode
    //
    ////////////////////////////////////////////////////////////////////////////////

    var diode_types = ['normal','ideal'];

    function Diode(x,y,rotation,name,area,type) {
	Component.call(this,'d',x,y,rotation);
	this.properties['name'] = name;
	this.properties['area'] = area ? area : '1';
	this.properties['type'] = type ? type : 'normal';
	this.add_connection(0,0);   // anode
	this.add_connection(0,48);  // cathode
	this.bounding_box = (type == 'ideal') ? [-12,0,12,48] : [-8,0,8,48];
	this.update_coords();
    }
    Diode.prototype = new Component();
    Diode.prototype.constructor = Diode;

    Diode.prototype.toString = function() {
	return '<Diode '+this.properties['area']+' ('+this.x+','+this.y+')>';
    };

    Diode.prototype.draw = function(c) {
	Component.prototype.draw.call(this,c);   // give superclass a shot
	this.draw_line(c,0,0,0,16);
	this.draw_line(c,-8,16,8,16);
	this.draw_line(c,-8,16,0,32);
	this.draw_line(c,8,16,0,32);
	this.draw_line(c,-8,32,8,32);
	this.draw_line(c,0,32,0,48);

	if (this.properties['type'] == 'ideal') {
	    // put a box around an ideal diode
	    this.draw_line(c,-10,12,10,12);
	    this.draw_line(c,-10,12,-10,36);
	    this.draw_line(c,10,12,10,36);
	    this.draw_line(c,-10,36,10,36);
	}

	if (this.properties['area'])
	    this.draw_text(c,this.properties['area'],10,24,3,property_size);
	if (this.properties['name'])
	    this.draw_text(c,this.properties['name'],-10,24,5,property_size);
    };

    Diode.prototype.clone = function(x,y) {
	return new Diode(x,y,this.rotation,this.properties['name'],this.properties['area'],this.properties['type']);
    }

    Diode.prototype.edit_properties = function(x,y) {
	if (inside(this.bbox,x,y)) {
	    var fields = new Array();
	    fields['name'] = build_input('text',10,this.properties['name']);
	    fields['area'] = build_input('text',10,this.properties['area']);
	    fields['type'] = build_select(diode_types,this.properties['type']);

	    var content = build_table(fields);
	    content.fields = fields;
	    content.component = this;

	    this.sch.dialog('Edit Properties',content,function(content) {
		content.component.properties['name'] = content.fields['name'].value;
		content.component.properties['area'] = content.fields['area'].value;
		content.component.properties['type'] = diode_types[content.fields['type'].selectedIndex];
		content.component.sch.redraw_background();
	    });
	    return true;
	} else return false;
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  N-channel Mosfet
    //
    ////////////////////////////////////////////////////////////////////////////////

    function NFet(x,y,rotation,name,w_over_l) {
	Component.call(this,'n',x,y,rotation);
	this.properties['name'] = name;
	this.properties['W/L'] = w_over_l ? w_over_l : '2';
	this.add_connection(0,0);   // drain
	this.add_connection(-24,24);  // gate
	this.add_connection(0,48);  // source
	this.bounding_box = [-24,0,8,48];
	this.update_coords();
    }
    NFet.prototype = new Component();
    NFet.prototype.constructor = NFet;

    NFet.prototype.toString = function() {
	return '<NFet '+this.properties['W/L']+' ('+this.x+','+this.y+')>';
    };

    NFet.prototype.draw = function(c) {
	Component.prototype.draw.call(this,c);   // give superclass a shot
	this.draw_line(c,0,0,0,16);
	this.draw_line(c,-8,16,0,16);
	this.draw_line(c,-8,16,-8,32);
	this.draw_line(c,-8,32,0,32);
	this.draw_line(c,0,32,0,48);

	this.draw_line(c,-24,24,-12,24);
	this.draw_line(c,-12,16,-12,32);

	var dim = this.properties['W/L'];
	if (this.properties['name']) {
	    this.draw_text(c,this.properties['name'],2,22,6,property_size);
	    this.draw_text(c,dim,2,26,0,property_size);
	} else
	this.draw_text(c,dim,2,24,3,property_size);
    };

    NFet.prototype.clone = function(x,y) {
	return new NFet(x,y,this.rotation,this.properties['name'],this.properties['W/L']);
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  P-channel Mosfet
    //
    ////////////////////////////////////////////////////////////////////////////////

    function PFet(x,y,rotation,name,w_over_l) {
	Component.call(this,'p',x,y,rotation);
	this.properties['name'] = name;
	this.properties['W/L'] = w_over_l ? w_over_l : '2';
	this.add_connection(0,0);   // drain
	this.add_connection(-24,24);  // gate
	this.add_connection(0,48);  // source
	this.bounding_box = [-24,0,8,48];
	this.update_coords();
    }
    PFet.prototype = new Component();
    PFet.prototype.constructor = PFet;

    PFet.prototype.toString = function() {
	return '<PFet '+this.properties['W/L']+' ('+this.x+','+this.y+')>';
    };

    PFet.prototype.draw = function(c) {
	Component.prototype.draw.call(this,c);   // give superclass a shot
	this.draw_line(c,0,0,0,16);
	this.draw_line(c,-8,16,0,16);
	this.draw_line(c,-8,16,-8,32);
	this.draw_line(c,-8,32,0,32);
	this.draw_line(c,0,32,0,48);

	this.draw_line(c,-24,24,-16,24);

	this.draw_circle(c,-14,24,2,false);
	this.draw_line(c,-12,16,-12,32);

	var dim = this.properties['W/L'];
	if (this.properties['name']) {
	    this.draw_text(c,this.properties['name'],2,22,6,property_size);
	    this.draw_text(c,dim,2,26,0,property_size);
	} else
	this.draw_text(c,dim,2,24,3,property_size);
    };

    PFet.prototype.clone = function(x,y) {
	return new PFet(x,y,this.rotation,this.properties['name'],this.properties['W/L']);
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Op Amp
    //
    ////////////////////////////////////////////////////////////////////////////////

    function OpAmp(x,y,rotation,name,A) {
	Component.call(this,'o',x,y,rotation);
	this.properties['name'] = name;
	this.properties['A'] = A ? A : '30000';
	this.add_connection(0,0);   // +
	this.add_connection(0,16);  // -
	this.add_connection(48,8);  // output
	this.add_connection(24,32);  // ground
	this.bounding_box = [0,-8,48,32];
	this.update_coords();
    }
    OpAmp.prototype = new Component();
    OpAmp.prototype.constructor = OpAmp;

    OpAmp.prototype.toString = function() {
	return '<OpAmp'+this.properties['A']+' ('+this.x+','+this.y+')>';
    };

    OpAmp.prototype.draw = function(c) {
	Component.prototype.draw.call(this,c);   // give superclass a shot
	// triangle
	this.draw_line(c,8,-8,8,24);
	this.draw_line(c,8,-8,40,8);
	this.draw_line(c,8,24,40,8);
	// inputs and output
	this.draw_line(c,0,0,8,0);
	this.draw_line(c,0,16,8,16);
	this.draw_text(c,'gnd',37,18,property_size);
	this.draw_line(c,40,8,48,8);
	this.draw_line(c,24,16,24,32);
	// + and -
	this.draw_line(c,10,0,16,0);
	this.draw_line(c,13,-3,13,3);
	this.draw_line(c,10,16,16,16);

	if (this.properties['name'])
	    this.draw_text(c,this.properties['name'],32,16,0,property_size);
    };

    OpAmp.prototype.clone = function(x,y) {
	return new OpAmp(x,y,this.rotation,this.properties['name'],this.properties['A']);
    };

    ////////////////////////////////////////////////////////////////////////////////
    //
    //  Source
    //
    ////////////////////////////////////////////////////////////////////////////////


    function Source(x,y,rotation,name,type,value) {
	Component.call(this,type,x,y,rotation);
	this.properties['name'] = name;
	if (value == undefined) value = 'dc(1)';
	this.properties['value'] = value;
	this.add_connection(0,0);
	this.add_connection(0,48);
	this.bounding_box = [-12,0,12,48];
	this.update_coords();

	this.content = document.createElement('div');  // used by edit_properties
    }
    Source.prototype = new Component();
    Source.prototype.constructor = Source;

    Source.prototype.toString = function() {
	return '<'+this.type+'source '+this.properties['params']+' ('+this.x+','+this.y+')>';
    };

    Source.prototype.draw = function(c) {
	Component.prototype.draw.call(this,c);   // give superclass a shot
	this.draw_line(c,0,0,0,12);
	this.draw_circle(c,0,24,12,false);
	this.draw_line(c,0,36,0,48);

	if (this.type == 'v') {  // voltage source
	    //this.draw_text(c,'+',0,12,1,property_size);
	    //this.draw_text(c,'\u2013',0,36,7,property_size);  // minus sign
	    // draw + and -
	    this.draw_line(c,0,15,0,21);
	    this.draw_line(c,-3,18,3,18);
	    this.draw_line(c,-3,30,3,30);
	    // draw V
	    //this.draw_line(c,-3,20,0,28);
	    //this.draw_line(c,3,20,0,28);
	} else if (this.type == 'i') {  // current source
	    // draw arrow: pos to neg
	    this.draw_line(c,0,15,0,32);
	    this.draw_line(c,-3,26,0,32);
	    this.draw_line(c,3,26,0,32);
	}

	if (this.properties['name'])
	    this.draw_text(c,this.properties['name'],-13,24,5,property_size);
	if (this.properties['value'])
	    this.draw_text(c,this.properties['value'],13,24,3,property_size);
    };

    // map source function name to labels for each source parameter
    var source_functions = {
	'dc': ['DC value'],

	'impulse': ['Height',
		    'Width (secs)'],

	'step': ['Initial value',
		 'Plateau value',
		 'Delay until step (secs)',
		 'Rise time (secs)'],

	'square': ['Initial value',
		   'Plateau value',
		   'Frequency (Hz)',
		   'Duty cycle (%)'],

	'triangle': ['Initial value',
		     'Plateau value',
		     'Frequency (Hz)'],

	'pwl': ['Comma-separated list of alternating times and values'],

	'pwl_repeating': ['Comma-separated list of alternating times and values'],

	'pulse': ['Initial value',
		  'Plateau value',
		  'Delay until pulse (secs)',
		  'Time for first transition (secs)',
		  'Time for second transition (secs)',
		  'Pulse width (secs)',
		  'Period (secs)'],

	'sin': ['Offset value',
		'Amplitude',
		'Frequency (Hz)',
		'Delay until sin starts (secs)',
		'Phase offset (degrees)']
    };

    // build property editor div
    Source.prototype.build_content = function(src) {
	// make an <input> widget for each property
	var fields = []
	fields['name'] = build_input('text',10,this.properties['name']);

	if (src == undefined) {
	    fields['value'] = this.properties['value'];
	} else {
	    // fancy version: add select tag for source type
	    var src_types = [];
	    for (var t in source_functions) src_types.push(t);
	    var type_select = build_select(src_types,src.fun);
	    type_select.component = this;
	    type_select.addEventListener('change',source_type_changed,false)
	    fields['type'] = type_select;

	    if (src.fun == 'pwl' || src.run == 'pwl_repeating') {
		var v = '';
		var first = true;
		for (var i = 0; i < src.args.length; i++) {
		    if (first) first = false;
		    else v += ',';
		    v += engineering_notation(src.args[i],3);
		    if (i % 2 == 0) v += 's';
		}
		fields[source_functions[src.fun][0]] = build_input('text',30,v);
	    } else {
		// followed separate input tag for each parameter
		var labels = source_functions[src.fun];
		for (var i = 0; i < labels.length; i++) {
		    var v = engineering_notation(src.args[i],3);
		    fields[labels[i]] = build_input('text',10,v);
		}
	    }
	}

	var div = this.content;
	if (div.hasChildNodes())
	    div.removeChild(div.firstChild);  // remove table of input fields
	div.appendChild(build_table(fields));
	div.fields = fields;
	div.component = this;
	return div;
    };

    function source_type_changed(event) {
	if (!event) event = window.event;
	var select = (window.event) ? event.srcElement : event.target;

	// see where to get source parameters from
	var type = select.options[select.selectedIndex].value;
	var src = undefined;
	if (this.src != undefined && type == this.src.fun)
	    src = this.src;
	else if (typeof cktsim != 'undefined')
	    src = cktsim.parse_source(type+'()');

	select.component.build_content(src);
    }

    Source.prototype.edit_properties = function(x,y) {
	if (this.near(x,y)) {
	    this.src = undefined;
	    if (typeof cktsim != 'undefined')
		this.src = cktsim.parse_source(this.properties['value']);
	    var content = this.build_content(this.src);

	    this.sch.dialog('Edit Properties',content,function(content) {
		var c = content.component;
		var fields = content.fields;

		var first = true;
		var value = '';
		for (var label in fields) {
		    if (label == 'name')
			c.properties['name'] = fields['name'].value;
		    else if (label == 'value')  {
			// if unknown source type
			value = fields['value'].value;
			c.sch.redraw_background();
			return;
		    } else if (label == 'type') {
			var select = fields['type'];
			value = select.options[select.selectedIndex].value + '(';
		    } else {
			if (first) first = false;
			else value += ',';
			value += fields[label].value;
		    }
		}
		c.properties['value'] = value + ')';
		c.sch.redraw_background();
	    });
	    return true;
	} else return false;
    };


    function VSource(x,y,rotation,name,value) {
	Source.call(this,x,y,rotation,name,'v',value);
	this.type = 'v';
    }
    VSource.prototype = new Component();
    VSource.prototype.constructor = VSource;
    VSource.prototype.toString = Source.prototype.toString;
    VSource.prototype.draw = Source.prototype.draw;
    VSource.prototype.clone = Source.prototype.clone;
    VSource.prototype.build_content = Source.prototype.build_content;
    VSource.prototype.edit_properties = Source.prototype.edit_properties;

    // display current for DC analysis
    VSource.prototype.display_current = function(c,vmap) {
	var name = this.properties['name'];
	var label = 'I(' + (name ? name : '_' + this.properties['_json_']) + ')';
	var v = vmap[label];
	if (v != undefined) {
	    // first draw some solid blocks in the background
	    c.globalAlpha = 0.5;
	    this.draw_text(c,'\u2588\u2588\u2588',-8,8,4,annotation_size,element_style);
	    c.globalAlpha = 1.0;

	    // display the element current
	    var i = engineering_notation(v,2) + 'A';
	    this.draw_text(c,i,-3,5,5,annotation_size,annotation_style);
	    // draw arrow for current
	    this.draw_line(c,-3,4,0,8);
	    this.draw_line(c,3,4,0,8);
	    // only display each current once
	    delete vmap[label];
	}
    };

    VSource.prototype.clone = function(x,y) {
	return new VSource(x,y,this.rotation,this.properties['name'],this.properties['value']);
    };

    function ISource(x,y,rotation,name,value) {
	Source.call(this,x,y,rotation,name,'i',value);
	this.type = 'i';
    }
    ISource.prototype = new Component();
    ISource.prototype.constructor = ISource;
    ISource.prototype.toString = Source.prototype.toString;
    ISource.prototype.draw = Source.prototype.draw;
    ISource.prototype.clone = Source.prototype.clone;
    ISource.prototype.build_content = Source.prototype.build_content;
    ISource.prototype.edit_properties = Source.prototype.edit_properties;

    ISource.prototype.clone = function(x,y) {
	return new ISource(x,y,this.rotation,this.properties['name'],this.properties['value']);
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  JQuery slider support for setting a component value
    //
    ///////////////////////////////////////////////////////////////////////////////

    function component_slider(event,ui) {
	var sname = $(this).slider("option","schematic");

	// set value of specified component
	var cname = $(this).slider("option","component");
	var pname = $(this).slider("option","property");
	var suffix = $(this).slider("option","suffix");
	if (typeof suffix != "string") suffix = "";

	var v = ui.value;
	$(this).slider("value",v);  // move slider's indicator

	var choices = $(this).slider("option","choices");
	if (choices instanceof Array) v = choices[v];

	// selector may match several schematics
	$("." + sname).each(function(index,element) {
	    element.schematic.set_property(cname,pname,v.toString() + suffix);
	});

	// perform requested analysis
	var analysis = $(this).slider("option","analysis");
	if (analysis == "dc")
	    $("." + sname).each(function(index,element) {
		element.schematic.dc_analysis();
	    });

	return false;
    };

    ///////////////////////////////////////////////////////////////////////////////
    //
    //  Module definition
    //
    ///////////////////////////////////////////////////////////////////////////////

    return  {
	'Schematic': Schematic,
	'component_slider': component_slider
    };

}());

(function() {

  this.Collapsible = (function() {

    function Collapsible() {}

    Collapsible.setCollapsibles = function(el) {
      /*
          el: container
      */      el.find('.longform').hide();
      el.find('.shortform').append('<a href="#" class="full">See full output</a>');
      el.find('.collapsible header + section').hide();
      el.find('.full').click(Collapsible.toggleFull);
      return el.find('.collapsible header a').click(Collapsible.toggleHint);
    };

    Collapsible.toggleFull = function(event) {
      var new_text;
      event.preventDefault();
      $(event.target).parent().siblings().slideToggle();
      $(event.target).parent().parent().toggleClass('open');
      if ($(event.target).text() === 'See full output') {
        new_text = 'Hide output';
      } else {
        new_text = 'See full ouput';
      }
      return $(event.target).text(new_text);
    };

    Collapsible.toggleHint = function(event) {
      event.preventDefault();
      $(event.target).parent().siblings().slideToggle();
      return $(event.target).parent().parent().toggleClass('open');
    };

    return Collapsible;

  }).call(this);

}).call(this);

(function() {

  this.HTMLModule = (function() {

    function HTMLModule(element) {
      this.element = element;
      this.el = $(this.element);
      JavascriptLoader.executeModuleScripts(this.el);
      Collapsible.setCollapsibles(this.el);
    }

    HTMLModule.prototype.$ = function(selector) {
      return $(selector, this.el);
    };

    return HTMLModule;

  })();

}).call(this);

(function() {

  this.JavascriptLoader = (function() {

    function JavascriptLoader() {}

    JavascriptLoader.executeModuleScripts = function(el, callback) {
      var callbackCalled, completed, completionHandlerGenerator, completionHandlerGeneratorIE, i, loaded, placeholders,
        _this = this;
      if (callback == null) callback = null;
      placeholders = el.find(".script_placeholder");
      if (placeholders.length === 0) {
        if (callback != null) callback();
        return;
      }
      completed = (function() {
        var _ref, _results;
        _results = [];
        for (i = 1, _ref = placeholders.length; 1 <= _ref ? i <= _ref : i >= _ref; 1 <= _ref ? i++ : i--) {
          _results.push(false);
        }
        return _results;
      })();
      callbackCalled = false;
      completionHandlerGeneratorIE = function(index) {
        return function() {
          if (this.readyState === 'complete' || this.readyState === 'loaded') {
            return completionHandlerGenerator(index)();
          }
        };
      };
      completionHandlerGenerator = function(index) {
        return function() {
          var allComplete, flag, _i, _len;
          allComplete = true;
          completed[index] = true;
          for (_i = 0, _len = completed.length; _i < _len; _i++) {
            flag = completed[_i];
            if (!flag) {
              allComplete = false;
              break;
            }
          }
          if (allComplete && !callbackCalled) {
            callbackCalled = true;
            if (callback != null) return callback();
          }
        };
      };
      loaded = {};
      return placeholders.each(function(index, placeholder) {
        var s, src;
        src = $(placeholder).attr("data-src");
        if (!(src in loaded)) {
          loaded[src] = true;
          s = document.createElement('script');
          s.setAttribute('src', src);
          s.setAttribute('type', "text/javascript");
          s.onload = completionHandlerGenerator(index);
          s.onreadystatechange = completionHandlerGeneratorIE(index);
          $('head')[0].appendChild(s);
        } else {
          completionHandlerGenerator(index)();
        }
        return $(placeholder).remove();
      });
    };

    return JavascriptLoader;

  })();

}).call(this);

(function() {

  this.Subview = (function() {

    function Subview(options) {
      var _this = this;
      $.each(options, function(key, value) {
        return _this[key] = value;
      });
      this.initialize();
      this.render();
      this.bind();
    }

    Subview.prototype.$ = function(selector) {
      return $(selector, this.el);
    };

    Subview.prototype.initialize = function() {};

    Subview.prototype.render = function() {};

    Subview.prototype.bind = function() {};

    return Subview;

  })();

}).call(this);

(function() {

  this.JavascriptLoader = (function() {

    function JavascriptLoader() {}

    JavascriptLoader.executeModuleScripts = function(el, callback) {
      var callbackCalled, completed, completionHandlerGenerator, completionHandlerGeneratorIE, i, loaded, placeholders,
        _this = this;
      if (callback == null) callback = null;
      placeholders = el.find(".script_placeholder");
      if (placeholders.length === 0) {
        if (callback != null) callback();
        return;
      }
      completed = (function() {
        var _ref, _results;
        _results = [];
        for (i = 1, _ref = placeholders.length; 1 <= _ref ? i <= _ref : i >= _ref; 1 <= _ref ? i++ : i--) {
          _results.push(false);
        }
        return _results;
      })();
      callbackCalled = false;
      completionHandlerGeneratorIE = function(index) {
        return function() {
          if (this.readyState === 'complete' || this.readyState === 'loaded') {
            return completionHandlerGenerator(index)();
          }
        };
      };
      completionHandlerGenerator = function(index) {
        return function() {
          var allComplete, flag, _i, _len;
          allComplete = true;
          completed[index] = true;
          for (_i = 0, _len = completed.length; _i < _len; _i++) {
            flag = completed[_i];
            if (!flag) {
              allComplete = false;
              break;
            }
          }
          if (allComplete && !callbackCalled) {
            callbackCalled = true;
            if (callback != null) return callback();
          }
        };
      };
      loaded = {};
      return placeholders.each(function(index, placeholder) {
        var s, src;
        src = $(placeholder).attr("data-src");
        if (!(src in loaded)) {
          loaded[src] = true;
          s = document.createElement('script');
          s.setAttribute('src', src);
          s.setAttribute('type', "text/javascript");
          s.onload = completionHandlerGenerator(index);
          s.onreadystatechange = completionHandlerGeneratorIE(index);
          $('head')[0].appendChild(s);
        } else {
          completionHandlerGenerator(index)();
        }
        return $(placeholder).remove();
      });
    };

    return JavascriptLoader;

  })();

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  this.VideoControl = (function(_super) {

    __extends(VideoControl, _super);

    function VideoControl() {
      this.togglePlayback = __bind(this.togglePlayback, this);
      VideoControl.__super__.constructor.apply(this, arguments);
    }

    VideoControl.prototype.bind = function() {
      return this.$('.video_control').click(this.togglePlayback);
    };

    VideoControl.prototype.render = function() {
      this.el.append("<div class=\"slider\"></div>\n<div>\n  <ul class=\"vcr\">\n    <li><a class=\"video_control\" href=\"#\"></a></li>\n    <li>\n      <div class=\"vidtime\">0:00 / 0:00</div>\n    </li>\n  </ul>\n  <div class=\"secondary-controls\">\n    <a href=\"#\" class=\"add-fullscreen\" title=\"Fill browser\">Fill Browser</a>\n  </div>\n</div>");
      if (!onTouchBasedDevice()) {
        return this.$('.video_control').addClass('play').html('Play');
      }
    };

    VideoControl.prototype.play = function() {
      return this.$('.video_control').removeClass('play').addClass('pause').html('Pause');
    };

    VideoControl.prototype.pause = function() {
      return this.$('.video_control').removeClass('pause').addClass('play').html('Play');
    };

    VideoControl.prototype.togglePlayback = function(event) {
      event.preventDefault();
      if (this.$('.video_control').hasClass('play')) {
        return $(this).trigger('play');
      } else if (this.$('.video_control').hasClass('pause')) {
        return $(this).trigger('pause');
      }
    };

    return VideoControl;

  })(Subview);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  this.VideoPlayer = (function(_super) {

    __extends(VideoPlayer, _super);

    function VideoPlayer() {
      this.pause = __bind(this.pause, this);
      this.play = __bind(this.play, this);
      this.toggleFullScreen = __bind(this.toggleFullScreen, this);
      this.update = __bind(this.update, this);
      this.onVolumeChange = __bind(this.onVolumeChange, this);
      this.onSpeedChange = __bind(this.onSpeedChange, this);
      this.onSeek = __bind(this.onSeek, this);
      this.onEnded = __bind(this.onEnded, this);
      this.onPause = __bind(this.onPause, this);
      this.onPlay = __bind(this.onPlay, this);
      this.onUnstarted = __bind(this.onUnstarted, this);
      this.handlePlaybackQualityChange = __bind(this.handlePlaybackQualityChange, this);
      this.onPlaybackRateChange = __bind(this.onPlaybackRateChange, this);
      this.onPlaybackQualityChange = __bind(this.onPlaybackQualityChange, this);
      this.onStateChange = __bind(this.onStateChange, this);
      this.onReady = __bind(this.onReady, this);
      this.bindExitFullScreen = __bind(this.bindExitFullScreen, this);
      VideoPlayer.__super__.constructor.apply(this, arguments);
    }

    VideoPlayer.prototype.initialize = function() {
      YT.PlayerState.UNSTARTED = -1;
      this.currentTime = 0;
      return this.el = $("#video_" + this.video.id);
    };

    VideoPlayer.prototype.bind = function() {
      $(this.control).bind('play', this.play).bind('pause', this.pause);
      $(this.qualityControl).bind('changeQuality', this.handlePlaybackQualityChange);
      $(this.speedControl).bind('speedChange', this.onSpeedChange);
      $(this.progressSlider).bind('seek', this.onSeek);
      if (this.volumeControl) {
        $(this.volumeControl).bind('volumeChange', this.onVolumeChange);
      }
      $(document).keyup(this.bindExitFullScreen);
      this.$('.add-fullscreen').click(this.toggleFullScreen);
      if (!onTouchBasedDevice()) return this.addToolTip();
    };

    VideoPlayer.prototype.bindExitFullScreen = function(event) {
      if (this.el.hasClass('fullscreen') && event.keyCode === 27) {
        return this.toggleFullScreen(event);
      }
    };

    VideoPlayer.prototype.render = function() {
      this.control = new VideoControl({
        el: this.$('.video-controls')
      });
      this.qualityControl = new VideoQualityControl({
        el: this.$('.secondary-controls')
      });
      if (!onTouchBasedDevice()) {
        this.volumeControl = new VideoVolumeControl({
          el: this.$('.secondary-controls')
        });
      }
      this.speedControl = new VideoSpeedControl({
        el: this.$('.secondary-controls'),
        speeds: this.video.speeds,
        currentSpeed: this.currentSpeed()
      });
      this.progressSlider = new VideoProgressSlider({
        el: this.$('.slider')
      });
      return this.player = new YT.Player(this.video.id, {
        playerVars: {
          controls: 1,
          wmode: 'transparent',
          rel: 0,
          showinfo: 0,
          enablejsapi: 1,
          modestbranding: 1
        },
        videoId: this.video.youtubeId(),
        events: {
          onReady: this.onReady,
          onStateChange: this.onStateChange,
          onPlaybackQualityChange: this.onPlaybackQualityChange,
          onPlaybackRateChange: this.onPlaybackRateChange
        }
      });
    };

    VideoPlayer.prototype.addToolTip = function() {
      return this.$('.add-fullscreen, .hide-subtitles').qtip({
        position: {
          my: 'top right',
          at: 'top center'
        }
      });
    };

    VideoPlayer.prototype.onReady = function(event) {
      if (!onTouchBasedDevice()) {
        return $('.video-load-complete:first').data('video').player.play();
      }
    };

    VideoPlayer.prototype.onStateChange = function(event) {
      switch (event.data) {
        case YT.PlayerState.UNSTARTED:
          return this.onUnstarted();
        case YT.PlayerState.PLAYING:
          return this.onPlay();
        case YT.PlayerState.PAUSED:
          return this.onPause();
        case YT.PlayerState.ENDED:
          return this.onEnded();
      }
    };

    VideoPlayer.prototype.onPlaybackQualityChange = function(event, value) {
      var quality;
      quality = this.player.getPlaybackQuality();
      return this.qualityControl.onQualityChange(quality);
    };

    VideoPlayer.prototype.onPlaybackRateChange = function(event) {
      return Logger.track_vertical_event('video speed', {
        'rate': event.data,
        'time_elapsed_in_seconds': parseInt(this.player.getCurrentTime())
      });
    };

    VideoPlayer.prototype.handlePlaybackQualityChange = function(event, value) {
      return this.player.setPlaybackQuality(value);
    };

    VideoPlayer.prototype.onUnstarted = function() {
      return this.control.pause();
    };

    VideoPlayer.prototype.onPlay = function() {
      this.video.log('play_video');
      if (window.player && window.player !== this.player) {
        window.player.pauseVideo();
      }
      window.player = this.player;
      if (!this.player.interval) {
        this.player.interval = setInterval(this.update, 200);
      }
      this.control.play();
      return this.progressSlider.play();
    };

    VideoPlayer.prototype.onPause = function() {
      this.video.log('pause_video');
      Logger.track_vertical_event('video pause', {
        'time_elapsed_in_seconds': parseInt(this.player.getCurrentTime())
      });
      if (window.player === this.player) window.player = null;
      clearInterval(this.player.interval);
      this.player.interval = null;
      return this.control.pause();
    };

    VideoPlayer.prototype.onEnded = function() {
      this.control.pause();
      return Logger.track_vertical_event('video end', {});
    };

    VideoPlayer.prototype.onSeek = function(event, time) {
      this.player.seekTo(time, true);
      if (this.isPlaying()) {
        clearInterval(this.player.interval);
        this.player.interval = setInterval(this.update, 200);
      } else {
        this.currentTime = time;
      }
      return this.updatePlayTime(time);
    };

    VideoPlayer.prototype.onSpeedChange = function(event, newSpeed) {
      this.currentTime = Time.convert(this.currentTime, parseFloat(this.currentSpeed()), newSpeed);
      newSpeed = parseFloat(newSpeed).toFixed(2).replace(/\.00$/, '.0');
      this.video.setSpeed(newSpeed);
      if (this.isPlaying()) {
        this.player.loadVideoById(this.video.youtubeId(), this.currentTime);
      } else {
        this.player.cueVideoById(this.video.youtubeId(), this.currentTime);
      }
      return this.updatePlayTime(this.currentTime);
    };

    VideoPlayer.prototype.onVolumeChange = function(event, volume) {
      return this.player.setVolume(volume);
    };

    VideoPlayer.prototype.update = function() {
      if (this.currentTime = this.player.getCurrentTime()) {
        return this.updatePlayTime(this.currentTime);
      }
    };

    VideoPlayer.prototype.updatePlayTime = function(time) {
      var progress;
      progress = Time.format(time) + ' / ' + Time.format(this.duration());
      this.$(".vidtime").html(progress);
      return this.progressSlider.updatePlayTime(time, this.duration());
    };

    VideoPlayer.prototype.toggleFullScreen = function(event) {
      event.preventDefault();
      if (this.el.hasClass('fullscreen')) {
        this.$('.add-fullscreen').attr('title', 'Fill browser');
        return this.el.removeClass('fullscreen');
      } else {
        this.el.addClass('fullscreen');
        return this.$('.add-fullscreen').attr('title', 'Exit fill browser');
      }
    };

    VideoPlayer.prototype.play = function() {
      if (this.player.playVideo) return this.player.playVideo();
    };

    VideoPlayer.prototype.isPlaying = function() {
      return this.player.getPlayerState() === YT.PlayerState.PLAYING;
    };

    VideoPlayer.prototype.pause = function() {
      if (this.player.pauseVideo) return this.player.pauseVideo();
    };

    VideoPlayer.prototype.duration = function() {
      return this.video.getDuration();
    };

    VideoPlayer.prototype.currentSpeed = function() {
      return this.video.speed;
    };

    VideoPlayer.prototype.volume = function(value) {
      if (value != null) {
        return this.player.setVolume(value);
      } else {
        return this.player.getVolume();
      }
    };

    return VideoPlayer;

  })(Subview);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  this.VideoProgressSlider = (function(_super) {

    __extends(VideoProgressSlider, _super);

    function VideoProgressSlider() {
      this.onStop = __bind(this.onStop, this);
      this.onChange = __bind(this.onChange, this);
      this.onSlide = __bind(this.onSlide, this);
      this.play = __bind(this.play, this);
      VideoProgressSlider.__super__.constructor.apply(this, arguments);
    }

    VideoProgressSlider.prototype.initialize = function() {
      if (!onTouchBasedDevice()) return this.buildSlider();
    };

    VideoProgressSlider.prototype.buildSlider = function() {
      this.slider = this.el.slider({
        range: 'min',
        change: this.onChange,
        slide: this.onSlide,
        stop: this.onStop
      });
      return this.buildHandle();
    };

    VideoProgressSlider.prototype.buildHandle = function() {
      this.handle = this.$('.slider .ui-slider-handle');
      return this.handle.qtip({
        content: "" + (Time.format(this.slider.slider('value'))),
        position: {
          my: 'bottom center',
          at: 'top center',
          container: this.handle
        },
        hide: {
          delay: 700
        },
        style: {
          classes: 'ui-tooltip-slider',
          widget: true
        }
      });
    };

    VideoProgressSlider.prototype.play = function() {
      if (!this.slider) return this.buildSlider();
    };

    VideoProgressSlider.prototype.updatePlayTime = function(currentTime, duration) {
      if (this.slider && !this.frozen) {
        this.slider.slider('option', 'max', duration);
        return this.slider.slider('value', currentTime);
      }
    };

    VideoProgressSlider.prototype.onSlide = function(event, ui) {
      this.frozen = true;
      this.updateTooltip(ui.value);
      return $(this).trigger('seek', ui.value);
    };

    VideoProgressSlider.prototype.onChange = function(event, ui) {
      return this.updateTooltip(ui.value);
    };

    VideoProgressSlider.prototype.onStop = function(event, ui) {
      var _this = this;
      this.frozen = true;
      $(this).trigger('seek', ui.value);
      return setTimeout((function() {
        return _this.frozen = false;
      }), 200);
    };

    VideoProgressSlider.prototype.updateTooltip = function(value) {
      return this.handle.qtip('option', 'content.text', "" + (Time.format(value)));
    };

    return VideoProgressSlider;

  })(Subview);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  this.VideoQualityControl = (function(_super) {

    __extends(VideoQualityControl, _super);

    function VideoQualityControl() {
      this.toggleQuality = __bind(this.toggleQuality, this);
      VideoQualityControl.__super__.constructor.apply(this, arguments);
    }

    VideoQualityControl.prototype.initialize = function() {
      return this.quality = null;
    };

    VideoQualityControl.prototype.bind = function() {
      return this.$('.quality_control').click(this.toggleQuality);
    };

    VideoQualityControl.prototype.render = function() {
      return this.el.append("<a href=\"#\" class=\"quality_control\" title=\"HD\">HD</a>");
    };

    VideoQualityControl.prototype.onQualityChange = function(value) {
      var _ref;
      this.quality = value;
      if ((_ref = this.quality) === 'hd720' || _ref === 'hd1080' || _ref === 'highres') {
        return this.el.addClass('active');
      } else {
        return this.el.removeClass('active');
      }
    };

    VideoQualityControl.prototype.toggleQuality = function(event) {
      var newQuality, _ref;
      event.preventDefault();
      if ((_ref = this.quality) === 'hd720' || _ref === 'hd1080' || _ref === 'highres') {
        newQuality = 'large';
      } else {
        newQuality = 'hd720';
      }
      return $(this).trigger('changeQuality', newQuality);
    };

    return VideoQualityControl;

  })(Subview);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  this.VideoSpeedControl = (function(_super) {

    __extends(VideoSpeedControl, _super);

    function VideoSpeedControl() {
      this.changeVideoSpeed = __bind(this.changeVideoSpeed, this);
      VideoSpeedControl.__super__.constructor.apply(this, arguments);
    }

    VideoSpeedControl.prototype.bind = function() {
      this.$('.video_speeds a').click(this.changeVideoSpeed);
      if (onTouchBasedDevice()) {
        return this.$('.speeds').click(function(event) {
          event.preventDefault();
          return $(this).toggleClass('open');
        });
      } else {
        this.$('.speeds').mouseenter(function() {
          return $(this).addClass('open');
        });
        this.$('.speeds').mouseleave(function() {
          return $(this).removeClass('open');
        });
        return this.$('.speeds').click(function(event) {
          event.preventDefault();
          return $(this).removeClass('open');
        });
      }
    };

    VideoSpeedControl.prototype.render = function() {
      var _this = this;
      this.el.prepend("<div class=\"speeds\">\n  <a href=\"#\">\n    <h3>Speed</h3>\n    <p class=\"active\"></p>\n  </a>\n  <ol class=\"video_speeds\"></ol>\n</div>");
      $.each(this.speeds, function(index, speed) {
        var link;
        link = $('<a>').attr({
          href: "#"
        }).html("" + speed + "x");
        return _this.$('.video_speeds').prepend($('<li>').attr('data-speed', speed).html(link));
      });
      return this.setSpeed(this.currentSpeed);
    };

    VideoSpeedControl.prototype.changeVideoSpeed = function(event) {
      event.preventDefault();
      if (!$(event.target).parent().hasClass('active')) {
        this.currentSpeed = $(event.target).parent().data('speed');
        $(this).trigger('speedChange', $(event.target).parent().data('speed'));
        return this.setSpeed(parseFloat(this.currentSpeed).toFixed(2).replace(/\.00$/, '.0'));
      }
    };

    VideoSpeedControl.prototype.setSpeed = function(speed) {
      this.$('.video_speeds li').removeClass('active');
      this.$(".video_speeds li[data-speed='" + speed + "']").addClass('active');
      return this.$('.speeds p.active').html("" + speed + "x");
    };

    return VideoSpeedControl;

  })(Subview);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  this.VideoVolumeControl = (function(_super) {

    __extends(VideoVolumeControl, _super);

    function VideoVolumeControl() {
      this.toggleMute = __bind(this.toggleMute, this);
      this.onChange = __bind(this.onChange, this);
      VideoVolumeControl.__super__.constructor.apply(this, arguments);
    }

    VideoVolumeControl.prototype.initialize = function() {
      return this.currentVolume = 100;
    };

    VideoVolumeControl.prototype.bind = function() {
      this.$('.volume').mouseenter(function() {
        return $(this).addClass('open');
      });
      this.$('.volume').mouseleave(function() {
        return $(this).removeClass('open');
      });
      return this.$('.volume>a').click(this.toggleMute);
    };

    VideoVolumeControl.prototype.render = function() {
      this.el.prepend("<div class=\"volume\">\n  <a href=\"#\"></a>\n  <div class=\"volume-slider-container\">\n    <div class=\"volume-slider\"></div>\n  </div>\n</div>");
      return this.slider = this.$('.volume-slider').slider({
        orientation: "vertical",
        range: "min",
        min: 0,
        max: 100,
        value: 100,
        change: this.onChange,
        slide: this.onChange
      });
    };

    VideoVolumeControl.prototype.onChange = function(event, ui) {
      this.currentVolume = ui.value;
      $(this).trigger('volumeChange', this.currentVolume);
      return this.$('.volume').toggleClass('muted', this.currentVolume === 0);
    };

    VideoVolumeControl.prototype.toggleMute = function() {
      if (this.currentVolume > 0) {
        this.previousVolume = this.currentVolume;
        return this.slider.slider('option', 'value', 0);
      } else {
        return this.slider.slider('option', 'value', this.previousVolume);
      }
    };

    return VideoVolumeControl;

  })(Subview);

}).call(this);
