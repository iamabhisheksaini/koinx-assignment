
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const { calculateStandardDeviation } = require('./utils/math');

mongoose.connect('mongodb://localhost:27017/koinx-assignment', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const CryptoData = require('./models/CryptoData');

const app = express();
const PORT = process.env.PORT || 3000;

cron.schedule('0 */2 * * *', async () => {
  console.log('Fetching crypto data...');
  const coins = ['bitcoin', 'matic-network', 'ethereum'];

  try {
    for (const coin of coins) {
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}`);
      const { current_price, market_cap, price_change_percentage_24h } = response.data.market_data;

      await CryptoData.create({
        coin,
        price: current_price.usd,
        marketCap: market_cap.usd,
        '24hChange': price_change_percentage_24h,
        timestamp: new Date(),
      });

      console.log(`Data for ${coin} saved.`);
    }
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);
  }
});

app.get('/stats', async (req, res) => {
  const { coin } = req.query;

  try {
    const latestData = await CryptoData.findOne({ coin }).sort({ timestamp: -1 });

    if (!latestData) {
      return res.status(404).json({ error: 'No data found for this cryptocurrency.' });
    }

    res.json({
      price: latestData.price,
      marketCap: latestData.marketCap,
      '24hChange': latestData['24hChange'],
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data from database.' });
  }
});

app.get('/deviation', async (req, res) => {
  const { coin } = req.query;

  try {
    const prices = await CryptoData.find({ coin })
      .sort({ timestamp: -1 })
      .limit(100)
      .select('price');

    if (prices.length < 2) {
      return res.status(400).json({ error: 'Not enough data points to calculate deviation.' });
    }

    const priceValues = prices.map((record) => record.price);
    const deviation = calculateStandardDeviation(priceValues);

    res.json({ deviation });
  } catch (error) {
    res.status(500).json({ error: 'Error calculating deviation.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
