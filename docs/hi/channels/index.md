---
read_when:
    - आप OpenClaw के लिए एक चैट चैनल चुनना चाहते हैं
    - आपको समर्थित मैसेजिंग प्लेटफ़ॉर्म का संक्षिप्त अवलोकन चाहिए
summary: वे मैसेजिंग प्लेटफ़ॉर्म जिनसे OpenClaw कनेक्ट हो सकता है
title: चैट चैनल
x-i18n:
    generated_at: "2026-07-16T13:17:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 102ad190f5bdb61fb3610985948e022f03fd54598ed4889da7a443ec0a2bdef3
    source_path: channels/index.md
    workflow: 16
---

OpenClaw आपके द्वारा पहले से उपयोग किए जाने वाले किसी भी चैट ऐप पर आपसे बात कर सकता है। प्रत्येक चैनल Gateway के माध्यम से कनेक्ट होता है।
टेक्स्ट हर जगह समर्थित है; मीडिया और प्रतिक्रियाएँ चैनल के अनुसार अलग-अलग होती हैं।

iMessage, Telegram और WebChat UI कोर इंस्टॉल के साथ आते हैं। "आधिकारिक Plugin" चिह्नित चैनल
एक कमांड (`openclaw plugins install @openclaw/<id>`) से
या `openclaw onboard` / `openclaw channels add` के दौरान आवश्यकता के अनुसार इंस्टॉल होते हैं, फिर Gateway को
पुनः आरंभ करना आवश्यक होता है। "बाहरी Plugin" चैनलों का रखरखाव OpenClaw रेपो के बाहर किया जाता है।

## समर्थित चैनल

- [Discord](/hi/channels/discord) - Discord Bot API + Gateway; सर्वर, चैनल और DM का समर्थन करता है (आधिकारिक Plugin)।
- [Feishu](/hi/channels/feishu) - WebSocket के माध्यम से Feishu/Lark बॉट (आधिकारिक Plugin)।
- [Google Chat](/hi/channels/googlechat) - HTTP Webhook के माध्यम से Google Chat API ऐप (आधिकारिक Plugin)।
- [iMessage](/hi/channels/imessage) - कोर में शामिल। साइन-इन किए हुए Mac पर `imsg` ब्रिज के माध्यम से मूल macOS एकीकरण (या जब Gateway कहीं और चलता हो, तब SSH रैपर), जिसमें उत्तरों, टैपबैक, प्रभावों, अटैचमेंट और समूह प्रबंधन के लिए निजी API क्रियाएँ शामिल हैं।
- [IRC](/hi/channels/irc) - पारंपरिक IRC सर्वर; पेयरिंग/अनुमति-सूची नियंत्रणों के साथ चैनल + DM (आधिकारिक Plugin)।
- [LINE](/hi/channels/line) - LINE Messaging API बॉट (आधिकारिक Plugin)।
- [Matrix](/hi/channels/matrix) - Matrix प्रोटोकॉल (आधिकारिक Plugin)।
- [Mattermost](/hi/channels/mattermost) - Bot API + WebSocket; चैनल, समूह, DM (आधिकारिक Plugin)।
- [Microsoft Teams](/hi/channels/msteams) - Bot Framework; एंटरप्राइज़ समर्थन (आधिकारिक Plugin)।
- [Nextcloud Talk](/hi/channels/nextcloud-talk) - Nextcloud Talk के माध्यम से स्वयं-होस्टेड चैट (आधिकारिक Plugin)।
- [Nostr](/hi/channels/nostr) - NIP-04 के माध्यम से विकेंद्रीकृत DM (आधिकारिक Plugin)।
- [QQ Bot](/hi/channels/qqbot) - QQ Bot API; निजी चैट, समूह चैट और समृद्ध मीडिया (आधिकारिक Plugin)।
- [Reef](/channels/reef) - अलग-अलग लोगों के OpenClaw एजेंटों के बीच संरक्षित, एंड-टू-एंड एन्क्रिप्टेड क्लॉ-टू-क्लॉ संदेश-प्रेषण (बंडल किया गया Plugin)।
- [Raft](/hi/channels/raft) - मानव और एजेंट सहयोग के लिए Raft CLI वेक ब्रिज (आधिकारिक Plugin)।
- [Signal](/hi/channels/signal) - signal-cli; गोपनीयता-केंद्रित (आधिकारिक Plugin)।
- [Slack](/hi/channels/slack) - Bolt SDK; वर्कस्पेस ऐप (आधिकारिक Plugin)।
- [SMS](/hi/channels/sms) - Gateway Webhook के माध्यम से Twilio-समर्थित SMS (आधिकारिक Plugin)।
- [Synology Chat](/hi/channels/synology-chat) - आउटगोइंग+इनकमिंग Webhook के माध्यम से Synology NAS Chat (आधिकारिक Plugin)।
- [Telegram](/hi/channels/telegram) - कोर में शामिल। grammY के माध्यम से Bot API; समूहों का समर्थन करता है।
- [Tlon](/hi/channels/tlon) - Urbit-आधारित मैसेंजर (आधिकारिक Plugin)।
- [Twitch](/hi/channels/twitch) - IRC कनेक्शन के माध्यम से Twitch चैट (आधिकारिक Plugin)।
- [वॉइस कॉल](/hi/plugins/voice-call) - Plivo, Telnyx या Twilio के माध्यम से टेलीफ़ोनी (आधिकारिक Plugin)।
- [WebChat](/hi/web/webchat) - कोर में शामिल। WebSocket पर Gateway WebChat UI।
- [WeChat](/hi/channels/wechat) - QR लॉगिन के माध्यम से Tencent iLink बॉट; केवल निजी चैट (बाहरी Plugin)।
- [WhatsApp](/hi/channels/whatsapp) - सर्वाधिक लोकप्रिय; Baileys का उपयोग करता है और QR पेयरिंग आवश्यक है (आधिकारिक Plugin)।
- [Yuanbao](/hi/channels/yuanbao) - Tencent Yuanbao बॉट (बाहरी Plugin)।
- [Zalo](/hi/channels/zalo) - Zalo Bot API; वियतनाम का लोकप्रिय मैसेंजर (आधिकारिक Plugin)।
- [Zalo ClawBot](/hi/channels/zaloclawbot) - QR लॉगिन के माध्यम से व्यक्तिगत Zalo सहायक; स्वामी से संबद्ध (बाहरी Plugin)।
- [Zalo Personal](/hi/channels/zalouser) - QR लॉगिन के माध्यम से Zalo व्यक्तिगत खाता (आधिकारिक Plugin)।

## डिलीवरी संबंधी टिप्पणियाँ

- Telegram के जिन उत्तरों में `![alt](url)` जैसा Markdown इमेज सिंटैक्स होता है,
  उन्हें संभव होने पर अंतिम आउटबाउंड पथ पर मीडिया उत्तरों में बदल दिया जाता है।
- Slack के बहु-व्यक्ति DM समूह चैट के रूप में रूट होते हैं, इसलिए समूह नीति, उल्लेख
  व्यवहार और समूह-सत्र नियम MPIM वार्तालापों पर लागू होते हैं।
- WhatsApp का सेटअप आवश्यकता के अनुसार इंस्टॉल होता है: ऑनबोर्डिंग Plugin पैकेज
  इंस्टॉल होने से पहले सेटअप प्रवाह दिखा सकती है, और Gateway बाहरी
  ClawHub/npm Plugin को केवल तभी लोड करता है जब चैनल वास्तव में सक्रिय हो।
- बॉट द्वारा लिखे गए इनबाउंड संदेश स्वीकार करने वाले चैनल साझा
  [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection) का उपयोग कर सकते हैं, ताकि बॉट के जोड़े
  अनिश्चित काल तक एक-दूसरे को उत्तर न देते रहें।
- समर्थित हमेशा-सक्रिय रूम [परिवेशी रूम इवेंट](/hi/channels/ambient-room-events)
  का उपयोग कर सकते हैं, ताकि बिना उल्लेख वाली रूम बातचीत तब तक शांत संदर्भ बन जाए, जब तक एजेंट
  `message` टूल से संदेश न भेजे।

## टिप्पणियाँ

- चैनल एक साथ चल सकते हैं; एकाधिक चैनल कॉन्फ़िगर करें और OpenClaw प्रत्येक चैट के अनुसार रूट करेगा।
- सबसे तेज़ सेटअप आमतौर पर **Telegram** है (सरल बॉट टोकन, Plugin इंस्टॉल करने की आवश्यकता नहीं)। WhatsApp
  में QR पेयरिंग आवश्यक है और यह डिस्क पर अधिक स्थिति संग्रहीत करता है।
- समूह व्यवहार चैनल के अनुसार अलग होता है; [समूह](/hi/channels/groups) देखें।
- सुरक्षा के लिए DM पेयरिंग और अनुमति-सूचियाँ लागू की जाती हैं; [सुरक्षा](/hi/gateway/security) देखें।
- समस्या निवारण: [चैनल समस्या निवारण](/hi/channels/troubleshooting)।
- मॉडल प्रदाताओं का दस्तावेज़ीकरण अलग से किया गया है; [मॉडल प्रदाता](/hi/providers/models) देखें।
