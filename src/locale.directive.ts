import * as Vue from "vue";
import { kebabCase, isPlainObject, isString, isNumber, isDate, each, clamp } from "lodash";

const MessageFormat = require("intl-messageformat");
const RelativeFormat = require("intl-relativeformat");
const memoizeFormatConstructor = require("intl-format-cache");

// NodeJS by default to not offer full ICU support and therefor break the unit tests
declare var IntlPolyfill: any;
const isNode = Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]";
if (isNode) {
  Intl.NumberFormat = IntlPolyfill.NumberFormat;
  Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
}

const formats = MessageFormat.formats;

const getCachedNumberFormat = memoizeFormatConstructor(Intl.NumberFormat);
const getCachedDateTimeFormat = memoizeFormatConstructor(Intl.DateTimeFormat);
const getCachedMessageFormat = memoizeFormatConstructor(MessageFormat);
const getCachedRelativeFormat = memoizeFormatConstructor(RelativeFormat);

// A constant defined by the standard Intl.NumberFormat
// const maximumFractionDigits = 20;
// Unfortunately through formatting issues of percent values in IE
// we have to use a small value here, because IE (as of v11) seems to
// account the percent symbol + optional space to the fraction digits.
// See also: https://github.com/sebastian-software/vue-locale/issues/1#issuecomment-215396481
const maximumFractionDigits = 18;

export let formatDate: any;
export let formatTime: any;
export let formatNumber: any;
export let formatRelative: any;
export let formatMessage: any;

function install(Vue: any, options: any) {
  let { language, currency, messages } = options;
  let locale = language;

  // =============================================
  //   FORMATTER FUNCTIONS
  // =============================================

  formatDate = function(date: any, format: any) {
    let parsedDate = new Date(date);
    if (!isDate(parsedDate))
      throw new TypeError("A date or timestamp must be provided to {{formatDate}}");

    if (isString(format) && format in formats.date)
      format = formats.date[format];

    return getCachedDateTimeFormat(locale, format).format(parsedDate);
  };

  formatTime = function(date: any, format: any) {
    let parsedDate = new Date(date);
    if (!isDate(date))
      throw new TypeError("A date or timestamp must be provided to {{formatTime}}");

    if (isString(format) && format in formats.time)
      format = formats.time[format];

    return getCachedDateTimeFormat(locale, format).format(parsedDate);
  };

  formatNumber = function(num: any, format?: any) {
    if (!isNumber(num))
      throw new TypeError("A number must be provided to {{formatNumber}}");

    if (isString(format)) {
      if (format === "currency")
        format = { style: "currency", currency: currency };
      else if (format in formats.number)
        format = formats.number[format];
    }

    return getCachedNumberFormat(locale, format).format(num);
  };

  formatRelative = function(date: any, format: any, now: any) {
    let parsedDate = new Date(date);
    if (!isDate(parsedDate))
      throw new TypeError("A date or timestamp must be provided to {{formatRelative}}");

    return getCachedRelativeFormat(locale, format).format(parsedDate, {
      now: now || new Date()
    });
  };

  formatMessage = function(message: any, ...formatOptions: any[]) {
    // Read real message from DB
    if (message in messages)
      message = messages[message];

    if (typeof message === "string")
      message = getCachedMessageFormat(message, locale, {});

    // If there is a single map parameter, use that instead of the formatOptions array
    if (formatOptions.length === 1 && isPlainObject(formatOptions[0]))
      formatOptions = formatOptions[0];

    return message.format(formatOptions);
  };



  // =============================================
  //   PARSERS
  // =============================================

  // Figuring out whether the separator is either "," or "." (Are there any other possibilities at all?)
  let decimalTestNumber = 3.1;
  let decimalSeparator = formatNumber(decimalTestNumber).charAt(1);

  function extractNumberParts(value: any) {
    let parsed = parseInt(value.replace(/[^0-9]/g, ""), 0);
    return isNaN(parsed) ? 0 : parsed;
  }

  function parseToNumber(value: any) {
    if (value == undefined || value === "")
      return 0;

    let splits = value.split(decimalSeparator).map(extractNumberParts);

    // Build up float number to let parseFloat convert it back into a number
    if (splits[1] > 0)
      return parseFloat(splits[0] + "." + splits[1]);

    // Return plain integer
    return splits[0];
  }


  // =============================================
  //   REGISTER FILTERS
  // =============================================

  let helpers = {
    formatDate,
    formatTime,
    formatRelative,
    formatNumber,
    formatMessage
  };

  each(helpers, function(helper, name) {
    // Adding features as a VueJS filter for easily pass a string over (only numberic parameters though)
    Vue.filter(kebabCase(name), helper);

    // Support alternative full blown calling of methods with real options object
    Vue.prototype["$" + name] = helper;
  });

  // =============================================
  //   ADDITIONAL FILTERS
  // =============================================

  Vue.filter("format-currency", {
    // model -> view: formats the value when updating the input element.
    read: function(val: any) {
      let numberOptions = {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      };

      return formatNumber(val == undefined || val === "" || isNaN(val) ? 0 : val, numberOptions);
    },

    // view -> model: formats the value when writing to the data.
    write: function(val: any) {
      return parseToNumber(val);
    }
  });

  Vue.filter("format-currency-precise", {
    // model -> view: formats the value when updating the input element.
    read: function(val: any) {
      return formatNumber(val == undefined || val === "" || isNaN(val) ? 0 : val, "currency");
    },

    // view -> model: formats the value when writing to the data.
    write: function(val: any) {
      return parseToNumber(val);
    }
  });

  Vue.filter("format-percent", {
    // model -> view: formats the value when updating the input element.
    read: function(val: any, fractionDigits: any)
    {
      return formatNumber(val == undefined || val === "" ? 0 : clamp(val / 100, 0, 1),
      {
        style: "percent",
        minimumFractionDigits: fractionDigits == undefined ? 0 : fractionDigits,
        maximumFractionDigits: fractionDigits == undefined ? maximumFractionDigits : fractionDigits
      });
    },

    // view -> model: formats the value when writing to the data.
    write: function(val: any) {
      return parseToNumber(val);
    }
  });

  Vue.filter("format-number", {
    // model -> view: formats the value when updating the input element.
    read: function(val: any, fractionDigits: any)
    {
      return val == undefined || val === "" ? 0 : formatNumber(val,
      {
        minimumFractionDigits: fractionDigits == undefined ? 0 : fractionDigits,
        maximumFractionDigits: fractionDigits == undefined ? maximumFractionDigits : fractionDigits
      });
    },

    // view -> model: formats the value when writing to the data.
    write: function(val: any) {
      return parseToNumber(val);
    }
  });
}

// Vue plugin
export default {
  install: install
};