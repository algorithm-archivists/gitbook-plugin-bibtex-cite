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
      if (citation !== undefined) {
        if (!citation.used) {
          citation.used = true
          this.config.set('bibCount', this.config.get('bibCount') + 1)
          citation.number = this.config.get('bibCount')
        }
        return (
          '<a href="#cite-' +
          citation.number +
          '">[' +
          citation.number +
          ']</a>'
        )
      } else {
        return '[Citation not found]'
      }
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
      process: function () {
        const usedBib = _.filter(this.config.get('bib'), 'used')
        const sortedBib = _.sortBy(usedBib, 'number')

        // start references
        let result = '<div class="references">'

        for (const { number, entryTags } of sortedBib) {
          const { AUTHOR, TITLE, URL, BOOKTITLE, BOOKURL, PUBLISHER, YEAR } = entryTags

          const options = [
            { value: AUTHOR ? formatAuthors(AUTHOR) : null },
            { value: TITLE, url: URL },
            { value: BOOKTITLE, url: BOOKURL, wrapper: 'i' },
            { value: PUBLISHER, wrapper: 'i' },
            { value: YEAR }
          ]

          const optionResult = options.filter(e => !_.isNil(e.value)).map((option) => {
            if (!_.isNil(option.url)) return `<a href="${option.url}">${option.value}</a>`.trim()
            if (!_.isNil(option.wrapper)) return `<${option.wrapper}>${option.value}</${option.wrapper}>`.trim()
            return `${option.value}`.trim()
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

function formatAuthors (authorsString) {
  const authors = authorsString.split('and')

  if (authors.length > 3) {
    return authors[0] + ' <i>et al.</i>'
  } else {
    return authorsString
  }
}
