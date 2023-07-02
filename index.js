import axios from 'axios';
import config from './config.json' assert {type: 'json'};

const getTopHeadlines = async () => {
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        apiKey: config.NEWS_API_KEY,
        category: 'business',
        language: 'en',
        pageSize: 100,
      },
    });

    return response.data.articles;
  } catch (error) {
    console.error('Error fetching top headlines:', error.message);
    return [];
  }
};

const analyzeSentiment = async (articleTitle) => {
  const prompt = `Act as best trader in the world and analyze the following article title: "${articleTitle}". Is the sentiment of the article neutral, bullish, or bearish? After that, specify if the article is related to cryptocurrency, forex, or stocks. You need to determine which market the article is primarily related to. Do not state that the article has no relationship to any of these markets. Write in lowercase.`;

  try {
    const response = await axios.post('https://api.openai.com/v1/completions', {
      prompt: prompt.trim(),
      model: 'text-davinci-003',
      max_tokens: 250,
      temperature: 0.7,
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
      },
    });

    return response.data.choices[0].text;
  } catch (error) {
    console.error('Error analyzing sentiment:', error.message);
    return '';
  }
};

const incrementSentiment = (report, market, sentiment) => {
  report[market][sentiment]++;
};

const generateHashtags = async () => {
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

    return hashtags.map((tag) => tag.trim());
  } catch (error) {
    console.error('Error generating hashtags:', error.message);
    return [];
  }
};

const printReport = (report, hashtags) => {
  console.log('Sentiment Report:');
  console.log('Stocks:');
  console.log(`Bullish: ${report.stocks.bullish}`);
  console.log(`Bearish: ${report.stocks.bearish}`);
  console.log(`Neutral: ${report.stocks.neutral}`);
  console.log('Forex:');
  console.log(`Bullish: ${report.forex.bullish}`);
  console.log(`Bearish: ${report.forex.bearish}`);
  console.log(`Neutral: ${report.forex.neutral}`);
  console.log('Cryptocurrency:');
  console.log(`Bullish: ${report.cryptocurrency.bullish}`);
  console.log(`Bearish: ${report.cryptocurrency.bearish}`);
  console.log(`Neutral: ${report.cryptocurrency.neutral}`);
  console.log('Hashtags:');
  console.log(hashtags.join(' '));
};

const crawlFinanceNews = async () => {
  try {
    const articles = await getTopHeadlines();
    const report = {
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
    let hashtags = [];

    for (const article of articles) {
      const articleTitle = article.title;
      const sentiment = await analyzeSentiment(articleTitle);

      if (sentiment.includes('bullish')) {
        if (sentiment.includes('crypto')) {
          console.log('Bullish article related to crypto:', articleTitle);
          incrementSentiment(report, 'cryptocurrency', 'bullish');
        } else if (sentiment.includes('stock')) {
          console.log('Bullish article related to stocks:', articleTitle);
          incrementSentiment(report, 'stocks', 'bullish');
        } else if (sentiment.includes('forex')) {
          console.log('Bullish article related to forex:', articleTitle);
          incrementSentiment(report, 'forex', 'bullish');
        }
      } else if (sentiment.includes('bearish')) {
        if (sentiment.includes('crypto')) {
          console.log('Bearish article related to crypto:', articleTitle);
          incrementSentiment(report, 'cryptocurrency', 'bearish');
        } else if (sentiment.includes('stock')) {
          console.log('Bearish article related to stocks:', articleTitle);
          incrementSentiment(report, 'stocks', 'bearish');
        } else if (sentiment.includes('forex')) {
          console.log('Bearish article related to forex:', articleTitle);
          incrementSentiment(report, 'forex', 'bearish');
        }
      } else if (sentiment.includes('neutral')) {
        if (sentiment.includes('crypto')) {
          console.log('Neutral article related to crypto:', articleTitle);
          incrementSentiment(report, 'cryptocurrency', 'neutral');
        } else if (sentiment.includes('stock')) {
          console.log('Neutral article related to stocks:', articleTitle);
          incrementSentiment(report, 'stocks', 'neutral');
        } else if (sentiment.includes('forex')) {
          console.log('Neutral article related to forex:', articleTitle);
          incrementSentiment(report, 'forex', 'neutral');
        }
      }
    }

    hashtags = await generateHashtags();
    printReport(report, hashtags);
  } catch (error) {
    console.error('Error crawling finance news:', error.message);
  }
};

crawlFinanceNews();
