var
    request = require('request'),
    cheerio = require('cheerio');

function parse(url) {
    request(url, function (error, response, body) {
        var
            $ = cheerio.load(body);

        $('.question-summary .question-hyperlink').each(function () {
            console.info($(this).text());
        });
    })
}

parse('http://stackoverflow.com/');