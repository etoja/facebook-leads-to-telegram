import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'oleg-secret-token'; // придумай свой
const TELEGRAM_BOT_TOKEN = '8156693652:AAEr_1LJI4eK1_MsdjMJlMjg6cpNRCeP2jk';
const TELEGRAM_CHAT_ID = '-1002577936906';
const TELEGRAM_TOPIC_ID = 17;

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const leadgen_id = changes?.value?.leadgen_id;

    if (!leadgen_id) return res.sendStatus(200);

    // Получаем данные из лида
    const pageAccessToken = 'EAARCpWHOTWIBO85g0Jzx60QX10Qjc3YM5SAmymJH6TzZAx39t5Knvsa6Umkl0gfrbObEaihQVPPffpTAHpzQqBCapUJnuSk8uNlZCeQwtAFGubeaGnj5T4IEuLguX8sf03XZBTodXeQeSwMHrMwO5ikOeVawDiTN4B1E9HI6fY9Lgu8PPYUCnSWTSz2obISZCjnRojU4ucb4CxL6ar8zBFIm57TFOUuX3bOBxyQECvWqmskZD'; // подставь позже
    const leadRes = await axios.get(`https://graph.facebook.com/v18.0/${leadgen_id}?access_token=${pageAccessToken}`);

    const fields = leadRes.data?.field_data || [];
    const formName = leadRes.data?.form_name || 'Неизвестная форма';

    const data = {};
    for (const field of fields) {
      data[field.name] = field.values[0];
    }

    const name = data.full_name || data.name || '—';
    const phone = data.phone_number || '—';
    const email = data.email || '—';

    const message = `📋 *Новий лід з Facebook:*\n\n👤 *Ім’я:* ${name}\n📱 *Телефон:* ${phone}\n✉️ *Email:* ${email}\n📝 *Форма:* ${formName}`;

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      message_thread_id: TELEGRAM_TOPIC_ID,
      text: message,
      parse_mode: 'Markdown'
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('Ошибка Webhook:', error.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
});
