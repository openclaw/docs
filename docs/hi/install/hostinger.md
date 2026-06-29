---
read_when:
    - Hostinger पर OpenClaw सेट अप करना
    - OpenClaw के लिए प्रबंधित VPS की तलाश
    - Hostinger 1-Click OpenClaw का उपयोग करना
summary: Hostinger पर OpenClaw होस्ट करें
title: Hostinger
x-i18n:
    generated_at: "2026-06-28T23:20:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9d221f54d6cd1697a48615c09616ad86968937941899ea7018622302e6ceb53
    source_path: install/hostinger.md
    workflow: 16
---

[Hostinger](https://www.hostinger.com/openclaw) पर **1-Click** managed deployment या **VPS** install के माध्यम से एक persistent OpenClaw Gateway चलाएं।

## आवश्यकताएं

- Hostinger account ([signup](https://www.hostinger.com/openclaw))
- लगभग 5-10 मिनट

## विकल्प A: 1-Click OpenClaw

शुरू करने का सबसे तेज तरीका। Hostinger infrastructure, Docker, और automatic updates संभालता है।

<Steps>
  <Step title="खरीदें और लॉन्च करें">
    1. [Hostinger OpenClaw page](https://www.hostinger.com/openclaw) से, Managed OpenClaw plan चुनें और checkout पूरा करें।

    <Note>
    Checkout के दौरान आप **Ready-to-Use AI** credits चुन सकते हैं, जो पहले से खरीदे गए होते हैं और OpenClaw के अंदर तुरंत integrated होते हैं -- दूसरे providers से external accounts या API keys की जरूरत नहीं। आप तुरंत chatting शुरू कर सकते हैं। वैकल्पिक रूप से, setup के दौरान Anthropic, OpenAI, Google Gemini, या xAI से अपनी key दें।
    </Note>

  </Step>

  <Step title="Messaging channel चुनें">
    connect करने के लिए एक या अधिक channels चुनें:

    - **WhatsApp** -- setup wizard में दिखाया गया QR code scan करें।
    - **Telegram** -- [BotFather](https://t.me/BotFather) से bot token paste करें।

  </Step>

  <Step title="Installation पूरा करें">
    instance deploy करने के लिए **Finish** पर click करें। Ready होने पर, hPanel में **OpenClaw Overview** से OpenClaw dashboard access करें।
  </Step>

</Steps>

## विकल्प B: VPS पर OpenClaw

अपने server पर अधिक control। Hostinger आपके VPS पर Docker के माध्यम से OpenClaw deploy करता है और आप hPanel में **Docker Manager** के जरिए इसे manage करते हैं।

<Steps>
  <Step title="VPS खरीदें">
    1. [Hostinger OpenClaw page](https://www.hostinger.com/openclaw) से, OpenClaw on VPS plan चुनें और checkout पूरा करें।

    <Note>
    आप checkout के दौरान **Ready-to-Use AI** credits चुन सकते हैं -- ये पहले से खरीदे गए होते हैं और OpenClaw के अंदर तुरंत integrated होते हैं, इसलिए आप दूसरे providers से किसी external account या API key के बिना chatting शुरू कर सकते हैं।
    </Note>

  </Step>

  <Step title="OpenClaw configure करें">
    VPS provision होने के बाद, configuration fields भरें:

    - **Gateway token** -- auto-generated; इसे बाद में उपयोग के लिए save करें।
    - **WhatsApp number** -- country code के साथ आपका number (optional)।
    - **Telegram bot token** -- [BotFather](https://t.me/BotFather) से (optional)।
    - **API keys** -- केवल तब जरूरी जब आपने checkout के दौरान Ready-to-Use AI credits नहीं चुने हों।

  </Step>

  <Step title="OpenClaw start करें">
    **Deploy** पर click करें। Running होने पर, **Open** पर click करके hPanel से OpenClaw dashboard खोलें।
  </Step>

</Steps>

Logs, restarts, और updates hPanel में Docker Manager interface से सीधे managed होते हैं। Update करने के लिए, Docker Manager में **Update** दबाएं और वह latest image pull करेगा।

## अपना setup verify करें

जिस channel को आपने connect किया है, उस पर अपने assistant को "Hi" भेजें। OpenClaw reply करेगा और आपको initial preferences के बारे में guide करेगा।

## Troubleshooting

**Dashboard load नहीं हो रहा** -- Container provisioning पूरा होने के लिए कुछ मिनट प्रतीक्षा करें। hPanel में Docker Manager logs check करें।

**Docker container बार-बार restart हो रहा है** -- Docker Manager logs खोलें और configuration errors देखें (missing tokens, invalid API keys)।

**Telegram bot respond नहीं कर रहा** -- Connection पूरा करने के लिए Telegram से अपना pairing code message सीधे अपने OpenClaw chat के अंदर message के रूप में भेजें।

## अगले steps

- [Channels](/hi/channels) -- Telegram, WhatsApp, Discord, और अधिक connect करें
- [Gateway configuration](/hi/gateway/configuration) -- सभी config options

## संबंधित

- [Install overview](/hi/install)
- [VPS hosting](/hi/vps)
- [DigitalOcean](/hi/install/digitalocean)
