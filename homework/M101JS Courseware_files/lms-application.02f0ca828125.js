(function() {

  this.AjaxPrefix = {
    addAjaxPrefix: function(jQuery, prefix) {
      jQuery.postWithPrefix = function(url, data, callback, type) {
        return $.post("" + (prefix()) + url, data, callback, type);
      };
      jQuery.getWithPrefix = function(url, data, callback, type) {
        return $.get("" + (prefix()) + url, data, callback, type);
      };
      return jQuery.ajaxWithPrefix = function(url, settings) {
        if (settings != null) {
          return $.ajax("" + (prefix()) + url, settings);
        } else {
          settings = url;
          settings.url = "" + (prefix()) + settings.url;
          return $.ajax(settings);
        }
      };
    }
  };

}).call(this);

(function() {

  this.Logger = (function() {

    function Logger() {}

    Logger.log = function(event_type, data) {
      return $.getWithPrefix('/event', {
        event_type: event_type,
        event: JSON.stringify(data),
        page: window.location.href
      });
    };

    Logger.bind = function() {
      return window.onunload = function() {
        return $.ajaxWithPrefix({
          url: "/event",
          data: {
            event_type: 'page_close',
            event: '',
            page: window.location.href
          },
          async: false
        });
      };
    };

    Logger.track_event = function(data) {
      data.url = window.location.href;
      data.timestamp = new Date;
      return $.post('/track_event', JSON.stringify(data), {
        error: function(jzXHR, textStatus, errorThrown) {},
        success: function(data, textStatus, jqXHR) {
          /*
                        This success is for 200 response. 
                        There is a success field in the response itself 
                        that can be true or false, set by the backend. 
                        Ignore for now
          */
        }
      });
    };

    Logger.track_vertical_event = function(event_type, event_data) {
      var data;
      if (event_data == null) event_data = {};
      data = new Object;
      data.lesson = $('.sequence').data('display_name');
      data.lesson_format = $('.sequence').data('lesson_format');
      data.vertical_type = $('#sequence-list .active').data('title');
      event_data.event_type = event_type;
      data.event = event_data;
      return this.track_event(data);
    };

    return Logger;

  })();

  this.log_event = Logger.log;

}).call(this);

(function() {

  this.XModule = {
    /*
        Load a single module (either an edit module or a display module)
        from the supplied element, which should have a data-type attribute
        specifying the class to load
    */
    loadModule: function(element) {
      var moduleType;
      moduleType = $(element).data('type');
      if (moduleType === 'None') return;
      try {
        return new window[moduleType](element);
      } catch (error) {
        if (typeof console !== "undefined" && console !== null) {
          return console.error("Unable to load " + moduleType + ": " + error.message);
        }
      }
    },
    /*
        Load all modules on the page of the specified type.
        If container is provided, only load modules inside that element
        Type is one of 'display' or 'edit'
    */
    loadModules: function(type, container) {
      var modules, selector;
      selector = ".xmodule_" + type;
      if (container != null) {
        modules = $(container).find(selector);
      } else {
        modules = $(selector);
      }
      return modules.each(function(idx, element) {
        return XModule.loadModule(element);
      });
    }
  };

}).call(this);

(function() {
  var XProblemDisplay, XProblemGenerator, XProblemGrader, root;

  XProblemGenerator = (function() {

    function XProblemGenerator(seed, parameters) {
      this.parameters = parameters != null ? parameters : {};
      this.random = new MersenneTwister(seed);
      this.problemState = {};
    }

    XProblemGenerator.prototype.generate = function() {
      return console.error("Abstract method called: XProblemGenerator.generate");
    };

    return XProblemGenerator;

  })();

  XProblemDisplay = (function() {

    function XProblemDisplay(state, submission, evaluation, container, submissionField, parameters) {
      this.state = state;
      this.submission = submission;
      this.evaluation = evaluation;
      this.container = container;
      this.submissionField = submissionField;
      this.parameters = parameters != null ? parameters : {};
    }

    XProblemDisplay.prototype.render = function() {
      return console.error("Abstract method called: XProblemDisplay.render");
    };

    XProblemDisplay.prototype.updateSubmission = function() {
      return this.submissionField.val(JSON.stringify(this.getCurrentSubmission()));
    };

    XProblemDisplay.prototype.getCurrentSubmission = function() {
      return console.error("Abstract method called: XProblemDisplay.getCurrentSubmission");
    };

    return XProblemDisplay;

  })();

  XProblemGrader = (function() {

    function XProblemGrader(submission, problemState, parameters) {
      this.submission = submission;
      this.problemState = problemState;
      this.parameters = parameters != null ? parameters : {};
      this.solution = null;
      this.evaluation = {};
    }

    XProblemGrader.prototype.solve = function() {
      return console.error("Abstract method called: XProblemGrader.solve");
    };

    XProblemGrader.prototype.grade = function() {
      return console.error("Abstract method called: XProblemGrader.grade");
    };

    return XProblemGrader;

  })();

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  root.XProblemGenerator = XProblemGenerator;

  root.XProblemDisplay = XProblemDisplay;

  root.XProblemGrader = XProblemGrader;

}).call(this);

(function() {

  this.Calculator = (function() {

    function Calculator() {
      $('.calc').click(this.toggle);
      $('form#calculator').submit(this.calculate).submit(function(e) {
        return e.preventDefault();
      });
      $('div.help-wrapper a').hover(this.helpToggle).click(function(e) {
        return e.preventDefault();
      });
    }

    Calculator.prototype.toggle = function(event) {
      event.preventDefault();
      $('div.calc-main').toggleClass('open');
      if ($('.calc.closed').length) {
        $('.calc').attr('aria-label', 'Open Calculator');
      } else {
        $('.calc').attr('aria-label', 'Close Calculator');
        setTimeout((function() {
          return $('#calculator_wrapper #calculator_input').focus();
        }), 100);
      }
      return $('.calc').toggleClass('closed');
    };

    Calculator.prototype.helpToggle = function() {
      return $('.help').toggleClass('shown');
    };

    Calculator.prototype.calculate = function() {
      return $.getWithPrefix('/calculate', {
        equation: $('#calculator_input').val()
      }, function(data) {
        return $('#calculator_output').val(data.result);
      });
    };

    return Calculator;

  })();

}).call(this);

(function() {

  $(function() {
    var HUB, MathJaxProcessor;
    if (!(typeof MathJax !== "undefined" && MathJax !== null)) return;
    HUB = MathJax.Hub;
    MathJaxProcessor = (function() {
      var CODESPAN, MATHSPLIT;

      MATHSPLIT = /(\$\$?|\\(?:begin|end)\{[a-z]*\*?\}|\\[\\{}$]|[{}]|(?:\n\s*)+|@@\d+@@)/i;

      CODESPAN = /(^|[^\\])(`+)([^\n]*?[^`\n])\2(?!`)/gm;

      function MathJaxProcessor(inlineMark, displayMark) {
        this.inlineMark = inlineMark || "$";
        this.displayMark = displayMark || "$$";
        this.math = null;
        this.blocks = null;
      }

      MathJaxProcessor.prototype.processMath = function(start, last, preProcess) {
        var block, i, _ref;
        block = this.blocks.slice(start, last + 1).join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (HUB.Browser.isMSIE) block = block.replace(/(%[^\n]*)\n/g, "$1<br/>\n");
        for (i = _ref = start + 1; _ref <= last ? i <= last : i >= last; _ref <= last ? i++ : i--) {
          this.blocks[i] = "";
        }
        this.blocks[start] = "@@" + this.math.length + "@@";
        if (preProcess) block = preProcess(block);
        return this.math.push(block);
      };

      MathJaxProcessor.prototype.removeMath = function(text) {
        var block, braces, current, deTilde, end, hasCodeSpans, last, start, _ref;
        text = text || "";
        this.math = [];
        start = end = last = null;
        braces = 0;
        hasCodeSpans = /`/.test(text);
        if (hasCodeSpans) {
          text = text.replace(/~/g, "~T").replace(CODESPAN, function($0) {
            return $0.replace(/\$/g, "~D");
          });
          deTilde = function(text) {
            return text.replace(/~([TD])/g, function($0, $1) {
              return {
                T: "~",
                D: "$"
              }[$1];
            });
          };
        } else {
          deTilde = function(text) {
            return text;
          };
        }
        this.blocks = _split(text.replace(/\r\n?/g, "\n"), MATHSPLIT);
        for (current = 1, _ref = this.blocks.length; current < _ref; current += 2) {
          block = this.blocks[current];
          if (block.charAt(0) === "@") {
            this.blocks[current] = "@@" + this.math.length + "@@";
            this.math.push(block);
          } else if (start) {
            if (block === end) {
              if (braces) {
                last = current;
              } else {
                this.processMath(start, current, deTilde);
                start = end = last = null;
              }
            } else if (block.match(/\n.*\n/)) {
              if (last) {
                current = last;
                this.processMath(start, current, deTilde);
              }
              start = end = last = null;
              braces = 0;
            } else if (block === "{") {
              ++braces;
            } else if (block === "}" && braces) {
              --braces;
            }
          } else {
            if (block === this.inlineMark || block === this.displayMark) {
              start = current;
              end = block;
              braces = 0;
            } else if (block.substr(1, 5) === "begin") {
              start = current;
              end = "\\end" + block.substr(6);
              braces = 0;
            }
          }
        }
        if (last) {
          this.processMath(start, last, deTilde);
          start = end = last = null;
        }
        return deTilde(this.blocks.join(""));
      };

      MathJaxProcessor.removeMathWrapper = function(_this) {
        return function(text) {
          return _this.removeMath(text);
        };
      };

      MathJaxProcessor.prototype.replaceMath = function(text) {
        var _this = this;
        text = text.replace(/@@(\d+)@@/g, function($0, $1) {
          return _this.math[$1];
        });
        this.math = null;
        return text;
      };

      MathJaxProcessor.replaceMathWrapper = function(_this) {
        return function(text) {
          return _this.replaceMath(text);
        };
      };

      return MathJaxProcessor;

    })();
    if (typeof Markdown !== "undefined" && Markdown !== null) {
      Markdown.getMathCompatibleConverter = function(postProcessor) {
        var converter, processor;
        postProcessor || (postProcessor = (function(text) {
          return text;
        }));
        converter = Markdown.getSanitizingConverter();
        processor = new MathJaxProcessor();
        converter.hooks.chain("preConversion", MathJaxProcessor.removeMathWrapper(processor));
        converter.hooks.chain("postConversion", function(text) {
          return postProcessor(MathJaxProcessor.replaceMathWrapper(processor)(text));
        });
        return converter;
      };
      return Markdown.makeWmdEditor = function(elem, appended_id, imageUploadUrl, postProcessor) {
        var $elem, $wmdPanel, ajaxFileUpload, converter, delayRenderer, editor, imageUploadHandler, initialText, _append;
        $elem = $(elem);
        if (!$elem.length) {
          if (typeof console !== "undefined" && console !== null) {
            console.log("warning: elem for makeWmdEditor doesn't exist");
          }
          return;
        }
        if (!$elem.find(".wmd-panel").length) {
          initialText = $elem.html();
          $elem.empty();
          _append = appended_id || "";
          $wmdPanel = $("<div>").addClass("wmd-panel").append($("<div>").attr("id", "wmd-button-bar" + _append)).append($("<textarea>").addClass("wmd-input").attr("id", "wmd-input" + _append).html(initialText)).append($("<div>").attr("id", "wmd-preview" + _append).addClass("wmd-panel wmd-preview"));
          $elem.append($wmdPanel);
        }
        converter = Markdown.getMathCompatibleConverter(postProcessor);
        ajaxFileUpload = function(imageUploadUrl, input, startUploadHandler) {
          $("#loading").ajaxStart(function() {
            return $(this).show();
          }).ajaxComplete(function() {
            return $(this).hide();
          });
          $("#upload").ajaxStart(function() {
            return $(this).hide();
          }).ajaxComplete(function() {
            return $(this).show();
          });
          return $.ajaxFileUpload({
            url: imageUploadUrl,
            secureuri: false,
            fileElementId: 'file-upload',
            dataType: 'json',
            success: function(data, status) {
              var error, fileURL;
              fileURL = data['result']['file_url'];
              error = data['result']['error'];
              if (error !== '') {
                alert(error);
                if (startUploadHandler) {
                  $('#file-upload').unbind('change').change(startUploadHandler);
                }
                if (typeof console !== "undefined" && console !== null) {
                  return console.log(error);
                }
              } else {
                return $(input).attr('value', fileURL);
              }
            },
            error: function(data, status, e) {
              alert(e);
              if (startUploadHandler) {
                return $('#file-upload').unbind('change').change(startUploadHandler);
              }
            }
          });
        };
        imageUploadHandler = function(elem, input) {
          return ajaxFileUpload(imageUploadUrl, input, imageUploadHandler);
        };
        editor = new Markdown.Editor(converter, appended_id, null, imageUploadHandler);
        delayRenderer = new MathJaxDelayRenderer();
        editor.hooks.chain("onPreviewPush", function(text, previewSet) {
          return delayRenderer.render({
            text: text,
            previewSetter: previewSet
          });
        });
        editor.run();
        return editor;
      };
    }
  });

}).call(this);

(function() {

  this.FeedbackForm = (function() {

    function FeedbackForm() {
      $('#feedback_button').click(function() {
        var data;
        data = {
          subject: $('#feedback_subject').val(),
          message: $('#feedback_message').val(),
          url: window.location.href
        };
        return $.postWithPrefix('/send_feedback', data, function() {
          return $('#feedback_div').html('Feedback submitted. Thank you');
        }, 'json');
      });
    }

    return FeedbackForm;

  })();

}).call(this);

(function() {

  AjaxPrefix.addAjaxPrefix(jQuery, function() {
    return Courseware.prefix;
  });

  $(function() {
    $.ajaxSetup({
      headers: {
        'X-CSRFToken': $.cookie('csrftoken')
      },
      dataType: 'json'
    });
    window.onTouchBasedDevice = function() {
      return navigator.userAgent.match(/iPhone|iPod|iPad/i);
    };
    if (onTouchBasedDevice()) $('body').addClass('touch-based-device');
    $('#csrfmiddlewaretoken').attr('value', $.cookie('csrftoken'));
    new Calculator;
    new FeedbackForm;
    if ($('body').hasClass('courseware')) Courseware.start();
    window.submit_circuit = function(circuit_id) {
      $("input.schematic").each(function(index, el) {
        return el.schematic.update_value();
      });
      schematic_value($("#schematic_" + circuit_id).attr("value"));
      return $.postWithPrefix("/save_circuit/" + circuit_id, {
        schematic: schematic_value
      }, function(data) {
        if (data.results === 'success') return alert('Saved');
      });
    };
    window.postJSON = function(url, data, callback) {
      return $.postWithPrefix(url, data, callback);
    };
    $('#login').click(function() {
      $('#login_form input[name="email"]').focus();
      return false;
    });
    return $('#signup').click(function() {
      $('#signup-modal input[name="username"]').focus();
      return false;
    });
  });

}).call(this);

(function() {
  var getTime;

  getTime = function() {
    return new Date().getTime();
  };

  this.MathJaxDelayRenderer = (function() {
    var bufferId, numBuffers;

    MathJaxDelayRenderer.prototype.maxDelay = 3000;

    MathJaxDelayRenderer.prototype.mathjaxRunning = false;

    MathJaxDelayRenderer.prototype.elapsedTime = 0;

    MathJaxDelayRenderer.prototype.mathjaxDelay = 0;

    MathJaxDelayRenderer.prototype.mathjaxTimeout = void 0;

    bufferId = "mathjax_delay_buffer";

    numBuffers = 0;

    function MathJaxDelayRenderer(params) {
      params = params || {};
      this.maxDelay = params["maxDelay"] || this.maxDelay;
      this.bufferId = params["bufferId"] || (bufferId + numBuffers);
      numBuffers += 1;
      this.$buffer = $("<div>").attr("id", this.bufferId).css("display", "none").appendTo($("body"));
    }

    MathJaxDelayRenderer.prototype.render = function(params) {
      var delay, elem, preprocessor, previewSetter, renderer, text,
        _this = this;
      elem = params["element"];
      previewSetter = params["previewSetter"];
      text = params["text"];
      if (!(text != null)) text = $(elem).html();
      preprocessor = params["preprocessor"];
      if (params["delay"] === false) {
        if (preprocessor != null) text = preprocessor(text);
        $(elem).html(text);
        return MathJax.Hub.Queue(["Typeset", MathJax.Hub, $(elem).attr("id")]);
      } else {
        if (this.mathjaxTimeout) {
          window.clearTimeout(this.mathjaxTimeout);
          this.mathjaxTimeout = void 0;
        }
        delay = Math.min(this.elapsedTime + this.mathjaxDelay, this.maxDelay);
        renderer = function() {
          var curTime, prevTime;
          if (_this.mathjaxRunning) return;
          prevTime = getTime();
          if (preprocessor != null) text = preprocessor(text);
          _this.$buffer.html(text);
          curTime = getTime();
          _this.elapsedTime = curTime - prevTime;
          if (MathJax) {
            prevTime = getTime();
            _this.mathjaxRunning = true;
            return MathJax.Hub.Queue(["Typeset", MathJax.Hub, _this.$buffer.attr("id")], function() {
              _this.mathjaxRunning = false;
              curTime = getTime();
              _this.mathjaxDelay = curTime - prevTime;
              if (previewSetter) {
                return previewSetter($(_this.$buffer).html());
              } else {
                return $(elem).html($(_this.$buffer).html());
              }
            });
          } else {
            return _this.mathjaxDelay = 0;
          }
        };
        return this.mathjaxTimeout = window.setTimeout(renderer, delay);
      }
    };

    return MathJaxDelayRenderer;

  })();

}).call(this);

(function() {

  this.Modal = (function() {

    function Modal() {}

    Modal.prototype.initialize = function(options) {
      return this.el = options['el'];
    };

    Modal.prototype.render = function() {
      return this.el.hide();
    };

    return Modal;

  })();

}).call(this);

(function() {



}).call(this);

(function($, undefined) {
  var form_ext;
  $.form_ext  = form_ext = {
    ajax: function(options) {
      return $.ajax(options);
    },
    handleRemote: function(element) {
      var method = element.attr('method');
      var url = element.attr('action');
      var data = element.serializeArray();
      var options = {
        type: method || 'GET',
        data: data,
        dataType: 'text json',
        success: function(data, status, xhr) {
          element.trigger("ajax:success", [data, status, xhr]);
        },
        complete: function(xhr, status) {
          element.trigger("ajax:complete", [xhr, status]);
        },
        error: function(xhr, status, error) {
          element.trigger("ajax:error", [xhr, status, error]);
        }
      };
      if(url) { options.url = url; }
      return form_ext.ajax(options);
    },
    CSRFProtection: function(xhr) {
      var token = $.cookie('csrftoken');
      if (token) xhr.setRequestHeader('X-CSRFToken', token);
    }
  };
  $.ajaxPrefilter(function(options, originalOptions, xhr){ if ( !options.crossDomain ) { form_ext.CSRFProtection(xhr); }});
  $(document).delegate('form', 'submit', function(e) {
    var form = $(this),
    remote = form.data("remote") !== undefined;

    if (remote) {
      form_ext.handleRemote(form);
      return false;
    }
    return true;
  });
})(jQuery);

$(document).ready(function () {
  $('a.dropdown').toggle(function() {
    $('ul.dropdown-menu').addClass("expanded");
    $('a.dropdown').addClass("active");
  }, function() {
    $('ul.dropdown-menu').removeClass("expanded");
    $('a.dropdown').removeClass("active");
  });
});

(function($){
  $.fn.extend({
    leanModal: function(options) {
      var defaults = {
        top: 100,
        overlay: 0.5,
        closeButton: null,
        position: 'fixed'
      }
      
      if ($("#lean_overlay").length == 0) {
        var overlay = $("<div id='lean_overlay'></div>");
        $("body").append(overlay);
      }

      options =  $.extend(defaults, options);

      return this.each(function() {
        var o = options;

        $(this).click(function(e) {

          $(".modal").hide();

          var modal_id = $(this).attr("href");
          
          if ($(modal_id).hasClass("video-modal")) {
            //Video modals need to be cloned before being presented as a modal
            //This is because actions on the video get recorded in the history.
            //Deleting the video (clone) prevents the odd back button behavior.
            var modal_clone = $(modal_id).clone(true, true);
            modal_clone.attr('id', 'modal_clone');
            $(modal_id).after(modal_clone);
            modal_id = '#modal_clone';
          }


          $("#lean_overlay").click(function() {
             close_modal(modal_id);
          });

          $(o.closeButton).click(function() {
             close_modal(modal_id);
          });

          var modal_height = $(modal_id).outerHeight();
          var modal_width = $(modal_id).outerWidth();

          $('#lean_overlay').css({ 'display' : 'block', opacity : 0 });
          $('#lean_overlay').fadeTo(200,o.overlay);

          $('iframe', modal_id).attr('src', $('iframe', modal_id).data('src'));
          $(modal_id).css({
            'display' : 'block',
            'position' : o.position,
            'opacity' : 0,
            'z-index': 11000,
            'left' : 50 + '%',
            'margin-left' : -(modal_width/2) + "px",
            'top' : o.top + "px"
          })

          $(modal_id).fadeTo(200,1);
          $(modal_id).find(".notice").hide().html("");
          var notice = $(this).data('notice')
          if(notice !== undefined) {
            $notice = $(modal_id).find(".notice");
            $notice.show().html(notice);
            // This is for activating leanModal links that were in the notice. We should have a cleaner way of
            // allowing all dynamically added leanmodal links to work.
            $notice.find("a[rel*=leanModal]").leanModal({ top : 20, overlay: 1, closeButton: ".close-modal", position: 'absolute' });
          }
          window.scrollTo(0, 0);
          e.preventDefault();

        });
      });

      function close_modal(modal_id){
        $("#lean_overlay").fadeOut(200);
        $('iframe', modal_id).attr('src', '');
        $(modal_id).css({ 'display' : 'none' });
        if (modal_id == '#modal_clone') {
          $(modal_id).remove();
        }
      }
    }
  });

  $("a[rel*=leanModal]").each(function(){
    $(this).leanModal({ top : 20, overlay: 1, closeButton: ".close-modal", position: 'absolute' });
    embed = $($(this).attr('href')).find('iframe')
    if(embed.length > 0) {
      if(embed.attr('src').indexOf("?") > 0) {
          embed.data('src', embed.attr('src') + '&autoplay=1&rel=0');
          embed.attr('src', '');
      } else {
          embed.data('src', embed.attr('src') + '?autoplay=1&rel=0');
          embed.attr('src', '');
      }
    }
  });
})(jQuery);

$(function() {
  if ($('.filter nav').length > 0) {
    var offset = $('.filter nav').offset().top;

    $(window).scroll(function() {
      if (offset <= window.pageYOffset) {
        return $('.filter nav').addClass('fixed-top');
      }
      else if (offset >= window.pageYOffset) {
        return $('.filter nav').removeClass('fixed-top');
      }
    });
  }
});

// http://james.padolsey.com/javascript/bujs-1-getparameterbyname/
function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)')
                    .exec(window.location.search);

    return match ?
        decodeURIComponent(match[1].replace(/\+/g, ' '))
        : null;
}
