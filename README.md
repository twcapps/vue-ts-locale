<img src="https://camo.githubusercontent.com/728ce9f78c3139e76fa69925ad7cc502e32795d2/68747470733a2f2f7675656a732e6f72672f696d616765732f6c6f676f2e706e67" alt="VueJS Logo" width="200" height="200"/>

# VueJS TS Locale<br/>[![Sponsored by][sponsor-img]][sponsor] [![Version][npm-version-img]][npm] [![Downloads][npm-downloads-img]][npm] [![Build Status][ci-img]][ci] [![Dependencies][deps-img]][deps]

[VueJS] Plugin for advanced localization of web applications using typescript

[sponsor-img]: https://img.shields.io/badge/Sponsored%20by-TWCAPPS-692446.svg
[sponsor]: https://www.twcapps.com
[VueJS]: https://github.com/vuejs/vue
[ci-img]:  https://travis-ci.org/bartsidee/vue-ts-locale.svg
[ci]:      https://travis-ci.org/bartsidee/vue-ts-locale
[deps]: https://david-dm.org/bartsidee/vue-ts-locale
[deps-img]: https://david-dm.org/bartsidee/vue-ts-locale.svg
[npm]: https://www.npmjs.com/package/vue-ts-locale
[npm-downloads-img]: https://img.shields.io/npm/dm/vue-ts-locale.svg
[npm-version-img]: https://img.shields.io/npm/v/vue-ts-locale.svg


## Links

- [GitHub](https://github.com/bartsidee/vue-ts-locale)
- [NPM](https://www.npmjs.com/package/vue-ts-locale)


## Installation

Should be installed locally in your project source code:

```bash
npm install vue-ts-locale --save
```

## Integration

Inside your VueJS application you have to register the `VueLocale` plugin:

```js
import VueLocale from "vue-ts-locale";

Vue.use(VueLocale,
{
  language: SELECTED_LANGUAGE,
  currency: SELECTED_CURRENCY,
  messages: MESSAGE_TEXTS
})
```

While these are typical examples of values:

- `SELECTED_LANGUAGE`: `"de"`, `"en"`, `"fr"`, ... (any valid language identifier)
- `SELECTED_CURRENCY`: `"EUR"`, `"USD"`, ... (any valid currency from [CLDR data](http://www.currency-iso.org/dam/downloads/lists/list_one.xml))
- `MESSAGE_TEXTS`: `{ key : value, ...}`


## Loading required locale data

Depending on whether your clients support the `Intl` API + all relevant locales (prominent exceptions right now are NodeJS, Safari on Mac and Safari on iOS) the amount of data and polyfills to load differs.

### Loading Intl-Polyfill + Data for 4 Locales

```ts

import "intl";
import "intl/locale-data/jsonp/en-GB.js";
import "intl/locale-data/jsonp/de-DE.js";
import "intl/locale-data/jsonp/fr-FR.js";
import "intl/locale-data/jsonp/nl-NL.js";

```

The data loaded here contains information on how to format dates (+ calendar data) and numbers (+ currencies).

## Usage

### Adding Messages

You should pass the matching locale data structure with relevant messages e.g. Dutch.

```js
let messages =
{
  "my-message-identifier": "Hallo wereld!",
  "my-html-identifier": "Hallo <b>wereld</b>!",
  "my-personal-identifier": "Hallo {name}!",
  ...
}
```

### Translating messages using VueJS filter

- Plain Text: ```{{ "my-message-identifier" | format-message }}```
- HTML Output: ```{{{ "my-html-identifier" | format-message }}}```
- Personal: Not possible because we can't pass the required additional data structure to the filter


### Translating using function calls

- Plain Text: ```{{ $formatMessage("my-message-identifier") }}```
- HTML Output: ```{{{ $formatMessage("my-html-identifier") }}}```
- Personal: `{{{ $formatMessage("my-personal-identifier", { name : screenName }) }}}`


### Formatting Numbers

- Number Formatting #1: ```{{ 3.14159 | format-number }}``` => `"3,14159"`
- Number Formatting #2: ```{{ 3.14159 | format-number 2 }}``` => `"3,14"`
- Number Formatting #3: ```{{ 3.14159 | format-number 0 }}``` => `"3"`
- Percent Formatting #1: ```{{ 0.641322 | format-percent }}``` => `"64%"`
- Percent Formatting #2: ```{{ 0.641322 | format-percent 2 }}``` => `"64,13%"`
- Currency Formatting #1: ```{{ 21.37 | format-currency }}``` => `"21 €"`
- Currency Formatting #2: ```{{ 21.37 | format-currency-precise }}``` => `"21,37 €"`


### Formatting Dates/Times

- Date Formatting: ```{{ new Date | format-date }}``` => `12.2.2016`
- Time Formatting: ```{{ new Date | format-time }}``` => `14:23 Uhr`


### Formatting Relative Dates

- Relative Formatting: ```{{ new Date - (1000 * 60 * 10) | format-relative }}``` => `vor 10 Minuten`

## Copyright
This plugin is based on the work by https://github.com/sebastian-software/vue-locale a big thanks to the work of Sebastian.