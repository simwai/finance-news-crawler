import axios from 'axios';
import config from './config.json' assert {type:'json'};

const keywords = [
  'Bloomberg',
  'The Wall Street Journal',
  'Financial Times',
  'Forbes',
  'The Economist',
  'CNBC',
  'Business Insider',
  'Investopedia',
  'Reuters',
  'Fortune',
  'BTC-Echo',
  'CoinTelegraph',
  'Bitcoin',
  'Ethereum',
  'Cryptocurrency',
];

class NewsAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://newsapi.org/v2';
    this.client = axios.create({
      baseURL: this.baseURL,
      params: {
        apiKey: this.apiKey,
        pageSize: 100,
      },
    });
  }

  async getTopHeadlines() {
    try {
      const response = await this.client.get('/top-headlines', {
        params: {
          category: 'business',
          language: 'en',
        },
      });

      return response.data.articles;
    } catch (error) {
      console.error('Error fetching top headlines:', error.message);
      return [];
    }
  }

  async fetchArticlesByKeyword(keyword) {
    try {
      const response = await this.client.get('/everything', {
        params: {
          q: keyword,
          language: 'en',
          sortBy: 'popularity',
        },
      });

      return response.data.articles;
    } catch (error) {
      console.error(`Error fetching articles for keyword "${keyword}":`, error.message);
      return [];
    }
  }
}

class OpenAIAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.openai.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  async analyzeSentiment(articleTitle) {
    const prompt = `Please analyze the following article title: "${articleTitle}". Is the sentiment of the article neutral, bullish, or bearish? After that, specify if the article is related to cryptocurrency, forex, or stocks. You need to determine which market the article is primarily related to. Do not state that the article has no relationship to any of these markets. Write in lowercase.`;

    try {
      const response = await this.client.post('/completions', {
        prompt: prompt.trim(),
        model: 'text-davinci-003',
        max_tokens: 250,
        temperature: 0.7,
      });

      return response.data.choices[0].text;
    } catch (error) {
      console.error('Error analyzing sentiment:', error.message);
      return '';
    }
  }
}

class SentimentReport {
  constructor() {
    this.report = {
      stocks: {
        bullish: 0,
        bearish: 0,
        neutral: 0,
      },
      forex: {
        bullish: 0,
        bearish: 0,
        neutral: 0,
      },
      cryptocurrency: {
        bullish: 0,
        bearish: 0,
        neutral: 0,
      },
    };
    this.hashtags = [];
  }

  incrementSentiment(market, sentiment) {
    this.report[market][sentiment]++;
  }

  async generateHashtags() {
    try {
      const gptPrompt = 'Please suggest the most relevant SEO hashtags for finance.';
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        messages: [{ role: 'system', content: gptPrompt }],
        max_tokens: 32,
        temperature: 0.7,
        model: 'gpt-3.5-turbo',
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        },
      });

      const chatCompletion = response.data.choices[0].message.content;
      const hashtags = chatCompletion.match(/#[^\s#]+/g) || [];

      this.hashtags = hashtags.map((tag) => tag.trim());
    } catch (error) {
      console.error('Error generating hashtags:', error.message);
    }
  }

  printReport() {
    console.log('Sentiment Report:');
    console.log('Stocks:');
    console.log(`Bullish: ${this.report.stocks.bullish}`);
    console.log(`Bearish: ${this.report.stocks.bearish}`);
    console.log(`Neutral: ${this.report.stocks.neutral}`);
    console.log('Forex:');
    console.log(`Bullish: ${this.report.forex.bullish}`);
    console.log(`Bearish: ${this.report.forex.bearish}`);
    console.log(`Neutral: ${this.report.forex.neutral}`);
    console.log('Cryptocurrency:');
    console.log(`Bullish: ${this.report.cryptocurrency.bullish}`);
    console.log(`Bearish: ${this.report.cryptocurrency.bearish}`);
    console.log(`Neutral: ${this.report.cryptocurrency.neutral}`);
    console.log('Hashtags:');
    console.log(this.hashtags.join(' '));
  }
}

class FinanceNewsCrawler {
  constructor(newsApiKey, openaiApiKey) {
    this.newsAPI = new NewsAPI(newsApiKey);
    this.openAIAPI = new OpenAIAPI(openaiApiKey);
    this.sentimentReport = new SentimentReport();
  }

  async crawlFinanceNews() {
    try {
      const articles = await this.newsAPI.getTopHeadlines();

      for (const article of articles) {
        const articleTitle = article.title;
        const sentiment = await this.openAIAPI.analyzeSentiment(articleTitle);

        if (sentiment.includes('bullish')) {
          if (sentiment.includes('crypto')) {
            console.log('Bullish article related to crypto:', articleTitle);
            this.sentimentReport.incrementSentiment('cryptocurrency', 'bullish');
          } else if (sentiment.includes('stock')) {
            console.log('Bullish article related to stocks:', articleTitle);
            this.sentimentReport.incrementSentiment('stocks', 'bullish');
          } else if (sentiment.includes('forex')) {
            console.log('Bullish article related to forex:', articleTitle);
            this.sentimentReport.incrementSentiment('forex', 'bullish');
          }
        } else if (sentiment.includes('bearish')) {
          if (sentiment.includes('crypto')) {
            console.log('Bearish article related to crypto:', articleTitle);
            this.sentimentReport.incrementSentiment('cryptocurrency', 'bearish');
          } else if (sentiment.includes('stock')) {
            console.log('Bearish article related to stocks:', articleTitle);
            this.sentimentReport.incrementSentiment('stocks', 'bearish');
          } else if (sentiment.includes('forex')) {
            console.log('Bearish article related to forex:', articleTitle);
            this.sentimentReport.incrementSentiment('forex', 'bearish');
          }
        } else if (sentiment.includes('neutral')) {
          if (sentiment.includes('crypto')) {
            console.log('Neutral article related to crypto:', articleTitle);
            this.sentimentReport.incrementSentiment('cryptocurrency', 'neutral');
          } else if (sentiment.includes('stock')) {
            console.log('Neutral article related to stocks:', articleTitle);
            this.sentimentReport.incrementSentiment('stocks', 'neutral');
          } else if (sentiment.includes('forex')) {
            console.log('Neutral article related to forex:', articleTitle);
            this.sentimentReport.incrementSentiment('forex', 'neutral');
          }
        }
      }

      await this.sentimentReport.generateHashtags();
      this.sentimentReport.printReport();
    } catch (error) {
      console.error('Error crawling finance news:', error.message);
    }
  }
}

// Usage example:
const financeNewsCrawler = new FinanceNewsCrawler(config.NEWS_API_KEY, config.OPENAI_API_KEY);
financeNewsCrawler.crawlFinanceNews();
