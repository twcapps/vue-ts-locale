"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var underscore_1 = require("underscore");
var MessageFormat = require("intl-messageformat");
var RelativeFormat = require("intl-relativeformat");
var memoizeFormatConstructor = require("intl-format-cache");
var isNode = Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
if (isNode) {
    Intl.NumberFormat = IntlPolyfill.NumberFormat;
    Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
}
var clamp = function (number, min, max) {
    return Math.min(Math.max(number, min), max);
};
var kebabCase = function (string) {
    var result = string;
    result = result.replace(/([a-z][A-Z])/g, function (match) {
        return match.substr(0, 1) + '-' + match.substr(1, 1).toLowerCase();
    });
    result = result.toLowerCase();
    result = result.replace(/[^-a-z0-9]+/g, '-');
    result = result.replace(/^-+/, '').replace(/-$/, '');
    return result;
};
var formats = MessageFormat.formats;
var getCachedNumberFormat = memoizeFormatConstructor(Intl.NumberFormat);
var getCachedDateTimeFormat = memoizeFormatConstructor(Intl.DateTimeFormat);
var getCachedMessageFormat = memoizeFormatConstructor(MessageFormat);
var getCachedRelativeFormat = memoizeFormatConstructor(RelativeFormat);
var maximumFractionDigits = 18;
function install(Vue, options) {
    var language = options.language, currency = options.currency, messages = options.messages;
    var locale = language;
    exports.formatDate = function (date, format) {
        var parsedDate = new Date(date);
        if (!underscore_1.isDate(parsedDate))
            throw new TypeError("A date or timestamp must be provided to {{formatDate}}");
        if (underscore_1.isString(format) && format in formats.date)
            format = formats.date[format];
        return getCachedDateTimeFormat(locale, format).format(parsedDate);
    };
    exports.formatTime = function (date, format) {
        var parsedDate = new Date(date);
        if (!underscore_1.isDate(date))
            throw new TypeError("A date or timestamp must be provided to {{formatTime}}");
        if (underscore_1.isString(format) && format in formats.time)
            format = formats.time[format];
        return getCachedDateTimeFormat(locale, format).format(parsedDate);
    };
    exports.formatNumber = function (num, format) {
        if (!underscore_1.isNumber(num))
            throw new TypeError("A number must be provided to {{formatNumber}}");
        if (underscore_1.isString(format)) {
            if (format === "currency")
                format = { style: "currency", currency: currency };
            else if (format in formats.number)
                format = formats.number[format];
        }
        return getCachedNumberFormat(locale, format).format(num);
    };
    exports.formatRelative = function (date, format, now) {
        var parsedDate = new Date(date);
        if (!underscore_1.isDate(parsedDate))
            throw new TypeError("A date or timestamp must be provided to {{formatRelative}}");
        return getCachedRelativeFormat(locale, format).format(parsedDate, {
            now: now || new Date()
        });
    };
    exports.formatMessage = function (message) {
        var formatOptions = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            formatOptions[_i - 1] = arguments[_i];
        }
        if (message in messages)
            message = messages[message];
        if (typeof message === "string")
            message = getCachedMessageFormat(message, locale, {});
        if (formatOptions.length === 1 && underscore_1.isObject(formatOptions[0]))
            formatOptions = formatOptions[0];
        return message.format(formatOptions);
    };
    var decimalTestNumber = 3.1;
    var decimalSeparator = exports.formatNumber(decimalTestNumber).charAt(1);
    function extractNumberParts(value) {
        var parsed = parseInt(value.replace(/[^0-9]/g, ""), 0);
        return isNaN(parsed) ? 0 : parsed;
    }
    function parseToNumber(value) {
        if (value == undefined || value === "")
            return 0;
        var splits = value.split(decimalSeparator).map(extractNumberParts);
        if (splits[1] > 0)
            return parseFloat(splits[0] + "." + splits[1]);
        return splits[0];
    }
    var helpers = {
        formatDate: exports.formatDate,
        formatTime: exports.formatTime,
        formatRelative: exports.formatRelative,
        formatNumber: exports.formatNumber,
        formatMessage: exports.formatMessage
    };
    underscore_1.each(helpers, function (helper, name) {
        Vue.filter(kebabCase(name), helper);
        Vue.prototype["$" + name] = helper;
    });
    Vue.filter("format-currency", {
        read: function (val) {
            var numberOptions = {
                style: "currency",
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            };
            return exports.formatNumber(val == undefined || val === "" || isNaN(val) ? 0 : val, numberOptions);
        },
        write: function (val) {
            return parseToNumber(val);
        }
    });
    Vue.filter("format-currency-precise", {
        read: function (val) {
            return exports.formatNumber(val == undefined || val === "" || isNaN(val) ? 0 : val, "currency");
        },
        write: function (val) {
            return parseToNumber(val);
        }
    });
    Vue.filter("format-percent", {
        read: function (val, fractionDigits) {
            return exports.formatNumber(val == undefined || val === "" ? 0 : clamp(val / 100, 0, 1), {
                style: "percent",
                minimumFractionDigits: fractionDigits == undefined ? 0 : fractionDigits,
                maximumFractionDigits: fractionDigits == undefined ? maximumFractionDigits : fractionDigits
            });
        },
        write: function (val) {
            return parseToNumber(val);
        }
    });
    Vue.filter("format-number", {
        read: function (val, fractionDigits) {
            return val == undefined || val === "" ? 0 : exports.formatNumber(val, {
                minimumFractionDigits: fractionDigits == undefined ? 0 : fractionDigits,
                maximumFractionDigits: fractionDigits == undefined ? maximumFractionDigits : fractionDigits
            });
        },
        write: function (val) {
            return parseToNumber(val);
        }
    });
}
exports.default = {
    install: install
};
