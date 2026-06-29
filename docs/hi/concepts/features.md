---
read_when:
    - आप OpenClaw द्वारा समर्थित चीज़ों की पूरी सूची चाहते हैं
summary: चैनलों, रूटिंग, मीडिया और UX में OpenClaw क्षमताएँ।
title: विशेषताएँ
x-i18n:
    generated_at: "2026-06-28T22:57:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b69cead6fc3c6af91e95f8080d9ca409f24c314cf97f707b67d8fdeb84cf92fa
    source_path: concepts/features.md
    workflow: 16
---

## मुख्य बातें

<Columns>
  <Card title="Channels" icon="message-square" href="/hi/channels">
    एक ही Gateway के साथ Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat, और अधिक।
  </Card>
  <Card title="Plugins" icon="plug" href="/hi/tools/plugin">
    सामान्य मौजूदा रिलीज़ में अलग इंस्टॉल के बिना बंडल किए गए Plugin Matrix, Nextcloud Talk, Nostr, Twitch, Zalo, और अधिक जोड़ते हैं।
  </Card>
  <Card title="Routing" icon="route" href="/hi/concepts/multi-agent">
    अलग-थलग सेशनों के साथ मल्टी-एजेंट रूटिंग।
  </Card>
  <Card title="Media" icon="image" href="/hi/nodes/images">
    इमेज, ऑडियो, वीडियो, दस्तावेज़, और इमेज/वीडियो जनरेशन।
  </Card>
  <Card title="Apps and UI" icon="monitor" href="/hi/platforms">
    Windows Hub, Web Control UI, macOS ऐप, और मोबाइल नोड।
  </Card>
  <Card title="Mobile nodes" icon="smartphone" href="/hi/nodes">
    पेयरिंग, वॉइस/चैट, और समृद्ध डिवाइस कमांड के साथ iOS और Android नोड।
  </Card>
</Columns>

## पूरी सूची

**चैनल:**

- बिल्ट-इन चैनलों में Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat, और WhatsApp शामिल हैं
- बंडल किए गए Plugin चैनलों में Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, और Zalo Personal शामिल हैं
- वैकल्पिक रूप से अलग से इंस्टॉल किए गए चैनल Plugin में Voice Call और WeChat जैसे तृतीय-पक्ष पैकेज शामिल हैं
- तृतीय-पक्ष चैनल Plugin Gateway को और आगे बढ़ा सकते हैं, जैसे WeChat
- मेंशन-आधारित सक्रियण के साथ ग्रुप चैट समर्थन
- अलाउलिस्ट और पेयरिंग के साथ DM सुरक्षा

**एजेंट:**

- टूल स्ट्रीमिंग के साथ एम्बेडेड एजेंट रनटाइम
- प्रति वर्कस्पेस या भेजने वाले के लिए अलग-थलग सेशनों के साथ मल्टी-एजेंट रूटिंग
- सेशन: सीधे चैट साझा `main` में समाहित होते हैं; समूह अलग-थलग रहते हैं
- लंबे जवाबों के लिए स्ट्रीमिंग और चंकिंग

**ऑथ और प्रोवाइडर:**

- 35+ मॉडल प्रोवाइडर (Anthropic, OpenAI, Google, और अधिक)
- OAuth के माध्यम से सब्सक्रिप्शन ऑथ (जैसे OpenAI Codex)
- कस्टम और सेल्फ-होस्टेड प्रोवाइडर समर्थन (vLLM, SGLang, Ollama, और कोई भी OpenAI-संगत या Anthropic-संगत एंडपॉइंट)

**मीडिया:**

- इमेज, ऑडियो, वीडियो, और दस्तावेज़ इन और आउट
- साझा इमेज जनरेशन और वीडियो जनरेशन क्षमता सतहें
- वॉइस नोट ट्रांसक्रिप्शन
- कई प्रोवाइडरों के साथ टेक्स्ट-टू-स्पीच

**ऐप और इंटरफ़ेस:**

- WebChat और ब्राउज़र Control UI
- macOS मेनू बार साथी ऐप
- पेयरिंग, Canvas, कैमरा, स्क्रीन रिकॉर्डिंग, लोकेशन, और वॉइस के साथ iOS नोड
- पेयरिंग, चैट, वॉइस, Canvas, कैमरा, और डिवाइस कमांड के साथ Android नोड

**टूल और ऑटोमेशन:**

- ब्राउज़र ऑटोमेशन, exec, सैंडबॉक्सिंग
- वेब खोज (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron जॉब और Heartbeat शेड्यूलिंग
- Skills, Plugin, और वर्कफ़्लो पाइपलाइन (Lobster)

## संबंधित

<CardGroup cols={2}>
  <Card title="Experimental features" href="/hi/concepts/experimental-features" icon="flask">
    ऑप्ट-इन सुविधाएँ जो अभी तक डिफ़ॉल्ट सतह पर शिप नहीं हुई हैं।
  </Card>
  <Card title="Agent runtime" href="/hi/concepts/agent" icon="robot">
    एजेंट रनटाइम मॉडल और रन कैसे डिस्पैच किए जाते हैं।
  </Card>
  <Card title="Channels" href="/hi/channels" icon="message-square">
    एक Gateway से Telegram, WhatsApp, Discord, Slack, और अधिक कनेक्ट करें।
  </Card>
  <Card title="Plugins" href="/hi/tools/plugin" icon="plug">
    OpenClaw को विस्तारित करने वाले बंडल किए गए और तृतीय-पक्ष Plugin।
  </Card>
</CardGroup>
