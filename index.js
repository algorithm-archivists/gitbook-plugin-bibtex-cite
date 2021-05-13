const bibtexParse = require('bibtex-parser-js')
const _ = require('lodash')
const fs = require('fs')

module.exports = {
  book: {
    assets: './assets',
    css: ['style.css']
  },

  filters: {
    cite: function (key) {
      const citation = _.find(this.config.get('bib'), {
        citationKey: key.toUpperCase()
      })

      if (_.isNil(citation)) {
        return '[Citation not found]'
      }

      if (!citation.used) {
        citation.used = true
        this.config.set('bibCount', this.config.get('bibCount') + 1)
        citation.number = this.config.get('bibCount')
      }

      return `<a href="#cite-${citation.number}">[${citation.number}]</a>`
    }
  },

  hooks: {
    init: function () {
      const bib = fs.readFileSync('literature.bib', 'utf8')
      this.config.set('bib', bibtexParse.toJSON(bib))
      this.config.set('bibCount', 0)
    }
  },

  blocks: {
    references: {
      /**
       * Process the generation of the references list.
       *
       * @return {string}
       */
      process: function () {
        const usedBib = _.filter(this.config.get('bib'), 'used')
        const sortedBib = _.sortBy(usedBib, 'number')

        // start references
        let result = '<div class="references">'

        for (const {number, entryTags} of sortedBib) {
          const {AUTHOR, TITLE, URL, BOOKTITLE, BOOKURL, PUBLISHER, YEAR} = entryTags

          // The list of reference items to be processed in order of execution. if a value
          // of the item is null or undefined, then it is filtered out otherwise it follows
          // these rules.
          //
          // 1. If it has a URL return the value wrapped in a anchor tag with the URL as the href.
          // 2. If it has a wrapper, return the value wrapped in the wrapper, e.g i or div, etc.
          // 3. or return the value.
          const referenceItems = [
            {value: AUTHOR ? formatAuthors(AUTHOR) : null},
            {value: TITLE, url: URL},
            {value: BOOKTITLE, url: BOOKURL, wrapper: 'i'},
            {value: PUBLISHER, wrapper: 'i'},
            {value: YEAR}
          ]

          const optionResult = referenceItems.filter(e => !_.isNil(e.value)).map((option) => {
            const visibleValue = option.value.toString().trim()

            if (!_.isNil(option.url)) return `<a href="${option.url}">${visibleValue}</a>`
            if (!_.isNil(option.wrapper)) return `<${option.wrapper}>${visibleValue}</${option.wrapper}>`
            return `${visibleValue}`
          })

          result += '<div class="citation">'
          result += `<div class="citation-number" id="cite-${number}">${number}.</div>`
          result += `<div class='citation-text'>${optionResult.join(', ')}.</div>`
          result += '</div>'
        }

        // end references
        result += '</div>'

        return result
      }
    }
  }
}

/**
 * Format the authors list based on the number of authors.
 * If the total authors is greater than 3, use the first author with a postfix of et al.
 *
 * @param {string} authorsString
 * @return {string}
 */
function formatAuthors(authorsString) {
  const authors = authorsString.split('and')

  return authors.length > 3
    ? `${authors[0]} <i>et al.</i>`
    : authorsString
}
