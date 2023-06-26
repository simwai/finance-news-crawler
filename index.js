const axios = require('axios');
const config = require('./config.json');

class FinanceNewsCrawler {
  constructor(newsApiKey, openaiApiKey) {
    this.newsApiUrl = 'https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=' + newsApiKey;
    this.openaiGptUrl = 'https://api.openai.com/v1/completions';
    this.openaiApiKey = openaiApiKey;
  }

  async crawlFinanceNews() {
    let cryptoSentimentsCountPositive = 0,
      cryptoSentimentsCountNegative = 0,
      cryptoSentimentsCountNeutral = 0,
      stocksSentimentsCountPositive = 0,
      stocksSentimentsCountNegative = 0,
      stocksSentimentsCountNeutral = 0,
      forexSentimentsCountPositive = 0,
      forexSentimentsCountNegative = 0,
      forexSentimentsCountNeutral = 0;

    const response = await axios.get(this.newsApiUrl);
    const articlesJsonData = response.data;

    for (let i in articlesJsonData.articles) {
      const articleTitle = articlesJsonData.articles[i].title;

      try {
        // Performing Sentiment Analysis with OpenAI GPT API
        const gptPrompt = `Please analyze the following article title: "${articleTitle}". Check if the article has a relationship to one of those markets: forex, crypto or stock. If yes, analyze the sentiment of the article. The sentinment can be neutral, bullish or bearish. After that, add if the article is related to crypto, forex or stock. If the article is not related to financial markets, the answer must be the character -. You write lower-case`;
        const gptResponse = await axios.post(this.openaiGptUrl, {
          prompt: gptPrompt.trim(),
          model: "text-davinci-003",
          max_tokens: 250,
          temperature: 0.7
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`
          }
        });

        const gptData = gptResponse.data;

        if (gptData?.choices?.length > 0) {
          const gptOutput = gptData.choices[0].text.toLowerCase();
          
          if (gptOutput.includes("-")) continue;
          
          if (gptOutput.includes("bullish")) {
            if (gptOutput.includes("crypto")) {
              cryptoSentimentsCountPositive++;
            } else if (gptOutput.includes("stock")) {
              stocksSentimentsCountPositive++;
            } else if (gptOutput.includes("forex")) {
              forexSentimentsCountPositive++;
            }
          } else if (gptOutput.includes("bearish")) {
            if (gptOutput.includes("crypto")) {
              cryptoSentimentsCountNegative++;
            } else if (gptOutput.includes("stock")) {
              stocksSentimentsCountNegative++;
            } else if (gptOutput.includes("forex")) {
              forexSentimentsCountNegative++;
            }
          } else if (gptOutput.includes("neutral")) {
            if (gptOutput.includes("crypto")) {
              cryptoSentimentsCountNeutral++;
            } else if (gptOutput.includes("stock")) {
              stocksSentimentsCountNeutral++;
            } else if (gptOutput.includes("forex")) {
              forexSentimentsCountNeutral++;
            }
          }
        } else {
          console.log(`No valid response received from OpenAI GPT API for article: ${articleTitle}`);
        }
      } catch (err) {
        console.log(`Error in sentiment analysis of article: ${articleTitle}. Error: ${err}`);
      }
    }

    // Create Sentiment Report
    const report = [
      {
        "market": "Crypto Market",
        "positive": cryptoSentimentsCountPositive,
        "negative": cryptoSentimentsCountNegative,
        "neutral": cryptoSentimentsCountNeutral
      },
      {
        "market": "Stock Market",
        "positive": stocksSentimentsCountPositive,
        "negative": stocksSentimentsCountNegative,
        "neutral": stocksSentimentsCountNeutral
      },
      {
        "market": "Forex Market",
        "positive": forexSentimentsCountPositive,
        "negative": forexSentimentsCountNegative,
        "neutral": forexSentimentsCountNeutral
      }
    ];

    // Format the sentiment report as text
    let formattedReport = "Financial Market Sentiment Report:\n\n";

    for (let i = 0; i < report.length; i++) {
      const { market, positive, negative, neutral } = report[i];

      formattedReport += `${market}:\n`;
      formattedReport += `Bullish: ${positive}\n`;
      formattedReport += `Bearish: ${negative}\n`;
      formattedReport += `Neutral: ${neutral}\n\n`;
    }

    console.log('Generated Sentiment Report:', report);
    console.log('Formatted Sentiment Report:', formattedReport);

    // Return the formatted sentiment report.
    return [{ text: formattedReport }];
  }
}

// Example usage:
const newsApiKey = config.NEWS_API_KEY
const openaiApiKey = config.OPENAI_API_KEY

const financeNewsCrawler = new FinanceNewsCrawler(newsApiKey, openaiApiKey);

(async () => {    
  await financeNewsCrawler.crawlFinanceNews();
})();
