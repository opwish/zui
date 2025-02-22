/*!
 * ZUI: 颜色选择器 - v1.10.0 - 2022-05-20
 * http://openzui.com
 * GitHub: https://github.com/easysoft/zui.git 
 * Copyright (c) 2022 cnezsoft.com; Licensed MIT
 */

/* ========================================================================
 * ZUI: ColorPicker.js [1.5.0+]
 * http://openzui.com
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */


(function($) {
    'use strict';

    var NAME = 'zui.colorPicker'; // modal name
    var TEAMPLATE = '<div class="colorpicker"><button type="button" class="btn dropdown-toggle" data-toggle="dropdown"><span class="cp-title"></span><i class="ic"></i></button><ul class="dropdown-menu clearfix"></ul></div>';
    var LANG = {
        zh_cn: {
            errorTip: "不是有效的颜色值"
        },
        zh_tw: {
            errorTip: "不是有效的顏色值"
        },
        en: {
            errorTip: "Not a valid color value"
        }
    };

    // The ColorPicker modal class
    var ColorPicker = function(element, options) {
        this.name = NAME;
        this.$ = $(element);

        this.getOptions(options);
        this.init();
    };

    ColorPicker.prototype.init = function() {
        var that = this;
        var options = that.options;
        var $input = that.$;
        var $parent = $input.parent();
        var createdPicker = false;
        if ($parent.hasClass('colorpicker')) {
            that.$picker = $parent;
        } else {
            that.$picker = $(options.template || TEAMPLATE);
            createdPicker = true;
        }
        that.$picker.addClass(options.wrapper).find('.cp-title').toggle(options.title !== undefined).text(options.title);
        that.$menu = that.$picker.find('.dropdown-menu').toggleClass('pull-right', options.pullMenuRight);
        that.$btn = that.$picker.find('.btn.dropdown-toggle');
        that.$btn.find('.ic').addClass('icon-' + options.icon);
        if(options.btnTip) {
            that.$picker.attr('data-toggle', 'tooltip').tooltip({title: options.btnTip, placement: options.tooltip, container: 'body'});
        }
        $input.attr('data-provide', null);
        if (createdPicker) {
            $input.after(that.$picker);
        }

        // init colors
        that.colors = {};
        $.each(options.colors, function(idx, rawColor) {
            if($.zui.Color.isColor(rawColor)) {
                var color = new $.zui.Color(rawColor);
                that.colors[color.toCssStr()] = color;
            }
        });

        that.updateColors();
        that.$picker.on('click', '.cp-tile', function() {
            that.setValue($(this).data('color'));
        });

        var setInputColor = function() {
            var val = $input.val();
            var isColor = $.zui.Color.isColor(val);
            $input.parent().toggleClass('has-error', !isColor && !(options.optional && val === ''));
            if(isColor) {
                that.setValue(val, true);
            } else {
                if(options.optional && val === '') {
                    $input.tooltip('hide');
                } else if(!$input.is(':focus')) {
                    $input.tooltip('show', options.errorTip);
                }
            }
        }
        if($input.is('input:not([type=hidden])')) {
            if(options.tooltip) {
                $input.attr('data-toggle', 'tooltip').tooltip({trigger: 'manual', placement: options.tooltip, tipClass: 'tooltip-danger', container: 'body'});
            }
            $input.on('keyup paste input change', setInputColor);
        } else {
            $input.appendTo(that.$picker);
        }
        setInputColor();
    };

    ColorPicker.prototype.addColor = function(color) {
        if(!(color instanceof $.zui.Color)) {
            color = new $.zui.Color(color);
        }
        var hex = color.toCssStr(),
            options = this.options;

        if(!this.colors[hex]) {
            this.colors[hex] = color;
        }

        var $a = $('<a href="###" class="cp-tile"></a>', {
            titile: color
        }).data('color', color).css({
            'color': color.contrast().toCssStr(),
            'background': hex,
            'border-color': color.luma() > 0.43 ? '#ccc' : 'transparent'
        }).attr('data-color', hex);
        this.$menu.append($('<li/>').css({width: options.tileSize, height: options.tileSize}).append($a));
        if(options.optional) {
            this.$menu.find('.cp-tile.empty').parent().detach().appendTo(this.$menu);
        }
    };

    ColorPicker.prototype.updateColors = function(colors) {
        var $menu   = this.$menu,
            options = this.options,
            colors  = colors || this.colors,
            that    = this;
        var bestLineCount = 0;
        $menu.children('li:not(.heading)').remove();
        $.each(colors, function(idx, color) {
            that.addColor(color);
            bestLineCount++;
        });
        if(options.optional) {
            var $li = $('<li><a class="cp-tile empty" href="###"></a></li>').css({width: options.tileSize, height: options.tileSize});
            this.$menu.append($li);
            bestLineCount++;
        }
        $menu.css('width', Math.min(bestLineCount, options.lineCount) * options.tileSize + 6);
    };

    ColorPicker.prototype.setValue = function(color, notSetInput) {
        var that    = this;
        var options = that.options;
        var $btn    = that.$btn;
        var hex     = '';
        that.$menu.find('.cp-tile.active').removeClass('active');
        var updateBtn = options.updateBtn;
        if (updateBtn === 'auto') {
            var $btnBar = $btn.find('.color-bar');
            updateBtn = $btnBar.length ? function(hexColor) {
                $btnBar.css('background', hexColor || '');
            } : true;
        }
        if(color) {
            var c = new $.zui.Color(color);
            hex = c.toCssStr().toLowerCase();
            if (updateBtn) {
                if (typeof updateBtn === 'function') {
                    updateBtn(hex, $btn, that);
                } else {
                    $btn.css({
                        background: hex,
                        color: c.contrast().toCssStr(),
                        borderColor: c.luma() > 0.43 ? '#ccc' : hex
                    });
                }
            }
            if(!that.colors[hex]) {
                that.addColor(c);
            }
            if(!notSetInput && that.$.val().toLowerCase() !== hex) {
                that.$.val(hex).trigger('change');
            }
            that.$menu.find('.cp-tile[data-color="' + hex + '"]').addClass('active');
            that.$.tooltip('hide');
            that.$.trigger('colorchange', c);
        } else {
            if (updateBtn) {
                if (typeof updateBtn === 'function') {
                    updateBtn(null, $btn, that);
                } else {
                    $btn.attr('style', null);
                }
            }
            if(!notSetInput && that.$.val() !== '') {
                that.$.val(hex).trigger('change');
            }
            if(options.optional) {
                that.$.tooltip('hide');
            }
            that.$menu.find('.cp-tile.empty').addClass('active');
            that.$.trigger('colorchange', null);
        }

        if(options.updateBorder) {
            $(options.updateBorder).css('border-color', hex);
        }
        if(options.updateBackground) {
            $(options.updateBackground).css('background-color', hex);
        }
        if(options.updateColor) {
            $(options.updateColor).css('color', hex);
        }
        if(options.updateText) {
            $(options.updateText).text(hex);
        }
    };

    // Get and init options
    ColorPicker.prototype.getOptions = function(options) {
        var thisOptions = $.extend({}, ColorPicker.DEFAULTS, this.$.data(), options);
        if(typeof thisOptions.colors === 'string') thisOptions.colors = thisOptions.colors.split(',');
        var langName = thisOptions.lang || $.zui.clientLang();
        var lang = this.lang = $.zui.getLangData ? $.zui.getLangData(NAME, langName, LANG) : (LANG[langName] || LANG.en);
        if(!thisOptions.errorTip) {
            thisOptions.errorTip = lang.errorTip;
        }
        if(!$.fn.tooltip) thisOptions.btnTip = false;
        this.options = thisOptions;
    };

    // default options
    ColorPicker.DEFAULTS = {
        colors: ['#00BCD4', '#388E3C', '#3280fc', '#3F51B5', '#9C27B0', '#795548', '#F57C00', '#F44336', '#E91E63'],
        pullMenuRight: true,
        wrapper: 'btn-wrapper',
        tileSize: 30,
        lineCount: 5,
        optional: true,
        tooltip: 'top',
        icon: 'caret-down',
        updateBtn: 'auto'
        // btnTip: 'Tool tip in button'
    };

    ColorPicker.LANG = LANG;

    // Extense jquery element
    $.fn.colorPicker = function(option) {
        return this.each(function() {
            var $this = $(this);
            var data = $this.data(name);
            var options = typeof option == 'object' && option;

            if(!data) $this.data(name, (data = new ColorPicker(this, options)));

            if(typeof option == 'string') data[option]();
        });
    };

    $.fn.colorPicker.Constructor = ColorPicker;

    // Auto call colorPicker after document load complete
    $(function() {
        $('[data-provide="colorpicker"]').colorPicker();
    });
}(jQuery));
