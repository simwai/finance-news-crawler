import axios from "axios";
import config from "./config.json" assert { type: "json" };
import { SentimentIntensityAnalyzer } from "vader-sentiment";

const getTopHeadlines = async () => {
  try {
    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        apiKey: config.NEWS_API_KEY,
        category: "business",
        language: "en",
        pageSize: 100,
      },
    });

    return response.data.articles;
  } catch (error) {
    console.error("Error fetching top headlines:", error.message);
    return [];
  }
};

const analyzeSentiment = async (articleTitle) => {
  let result = "";
  const prompt = `Act as best trader in the world and analyze the following article title: "${articleTitle}". Is the sentiment of the article neutral, bullish, or bearish? After that, specify if the article is related to cryptocurrency, forex, or stocks. You need to determine which market the article is primarily related to. Do not state that the article has no relationship to any of these markets. Write in lowercase.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        prompt: prompt.trim(),
        model: "text-davinci-003",
        max_tokens: 250,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        },
      }
    );

    result = response.data.choices[0].text;
  } catch (error) {
    console.error("Error analyzing sentiment:", error.message);
    return "";
  }

  if (config.SENTIMENT_ANALYSIS_ALGORITHM == "vader") {
    let vaderResult = SentimentIntensityAnalyzer.polarity_scores(articleTitle);

    // Sort object by value descending
    vaderResult = Object.fromEntries(
      Object.entries(vaderResult).sort(([, a], [, b]) => b - a)
    );
    
    const highestSentiment = Object.keys(vaderResult)[0];
    switch (highestSentiment) {
      case "pos":
        vaderResult = "bullish";
        break;
      case "neg":
        vaderResult = "bearish";
        break;
      default:
        vaderResult = "neutral";
        break;
    }

    // Replace neutral, bullish or bearish in chatgpt response with vader sentiment
    if (result.match(/neutral|bullish|bearish/g)?.length > 0) {
      result = result.replace("bullish", vaderResult);
    }

    return result;
  }
};

const incrementSentiment = (report, market, sentiment) => {
  report[market][sentiment]++;
};

const printReport = (report) => {
  console.log("Sentiment Report:");
  console.log("Stocks:");
  console.log(`Bullish: ${report.stocks.bullish}`);
  console.log(`Bearish: ${report.stocks.bearish}`);
  console.log(`Neutral: ${report.stocks.neutral}`);
  console.log("Forex:");
  console.log(`Bullish: ${report.forex.bullish}`);
  console.log(`Bearish: ${report.forex.bearish}`);
  console.log(`Neutral: ${report.forex.neutral}`);
  console.log("Cryptocurrency:");
  console.log(`Bullish: ${report.cryptocurrency.bullish}`);
  console.log(`Bearish: ${report.cryptocurrency.bearish}`);
  console.log(`Neutral: ${report.cryptocurrency.neutral}`);
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

    for (const article of articles) {
      const articleTitle = article.title;
      const sentiment = await analyzeSentiment(articleTitle);

      if (sentiment.includes("bullish")) {
        if (sentiment.includes("crypto")) {
          console.log("Bullish article related to crypto:", articleTitle);
          incrementSentiment(report, "cryptocurrency", "bullish");
        } else if (sentiment.includes("stock")) {
          console.log("Bullish article related to stocks:", articleTitle);
          incrementSentiment(report, "stocks", "bullish");
        } else if (sentiment.includes("forex")) {
          console.log("Bullish article related to forex:", articleTitle);
          incrementSentiment(report, "forex", "bullish");
        }
      } else if (sentiment.includes("bearish")) {
        if (sentiment.includes("crypto")) {
          console.log("Bearish article related to crypto:", articleTitle);
          incrementSentiment(report, "cryptocurrency", "bearish");
        } else if (sentiment.includes("stock")) {
          console.log("Bearish article related to stocks:", articleTitle);
          incrementSentiment(report, "stocks", "bearish");
        } else if (sentiment.includes("forex")) {
          console.log("Bearish article related to forex:", articleTitle);
          incrementSentiment(report, "forex", "bearish");
        }
      } else if (sentiment.includes("neutral")) {
        if (sentiment.includes("crypto")) {
          console.log("Neutral article related to crypto:", articleTitle);
          incrementSentiment(report, "cryptocurrency", "neutral");
        } else if (sentiment.includes("stock")) {
          console.log("Neutral article related to stocks:", articleTitle);
          incrementSentiment(report, "stocks", "neutral");
        } else if (sentiment.includes("forex")) {
          console.log("Neutral article related to forex:", articleTitle);
          incrementSentiment(report, "forex", "neutral");
        }
      }
    }

    return report
  } catch (error) {
    console.error("Error crawling finance news:", error.message);
  }
};

(async () => {
  const report = await crawlFinanceNews();
  if (report) printReport(report);
})()
