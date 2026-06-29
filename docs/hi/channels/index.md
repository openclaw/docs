---
read_when:
    - आप OpenClaw के लिए चैट चैनल चुनना चाहते हैं
    - आपको समर्थित मैसेजिंग प्लेटफ़ॉर्म का त्वरित अवलोकन चाहिए
summary: वे मैसेजिंग प्लेटफ़ॉर्म जिनसे OpenClaw कनेक्ट हो सकता है
title: चैट चैनल
x-i18n:
    generated_at: "2026-06-28T22:35:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff3e59df21d71f0d80eff2a6299169bfeb15964834a552f3c4c1d5b7c144b8d
    source_path: channels/index.md
    workflow: 16
---

OpenClaw आपसे किसी भी चैट ऐप पर बात कर सकता है जिसे आप पहले से उपयोग करते हैं। हर चैनल Gateway के माध्यम से जुड़ता है।
टेक्स्ट हर जगह समर्थित है; मीडिया और प्रतिक्रियाएँ चैनल के अनुसार अलग-अलग होती हैं।

## डिलीवरी नोट्स

- Telegram उत्तर जिनमें markdown इमेज सिंटैक्स होता है, जैसे `![alt](url)`,
  संभव होने पर अंतिम आउटबाउंड पथ में मीडिया उत्तरों में बदल दिए जाते हैं।
- Slack मल्टी-पर्सन DM समूह चैट के रूप में रूट होते हैं, इसलिए समूह नीति, mention
  व्यवहार, और समूह-सत्र नियम MPIM बातचीत पर लागू होते हैं।
- WhatsApp सेटअप इंस्टॉल-ऑन-डिमांड है: ऑनबोर्डिंग plugin पैकेज इंस्टॉल होने से पहले
  सेटअप फ्लो दिखा सकती है, और Gateway बाहरी
  ClawHub/npm plugin को केवल तब लोड करता है जब चैनल वास्तव में सक्रिय हो।
- जो चैनल bot-authored इनबाउंड संदेश स्वीकार करते हैं वे साझा
  [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection) का उपयोग कर सकते हैं ताकि बॉट जोड़े
  अनिश्चित काल तक एक-दूसरे को उत्तर देने से रोके जा सकें।
- समर्थित हमेशा-ऑन रूम [ambient room events](/hi/channels/ambient-room-events) का उपयोग कर सकते हैं
  ताकि बिना mention वाला रूम चैटर शांत संदर्भ बन जाए, जब तक एजेंट
  `message` टूल से न भेजे।

## समर्थित चैनल

- [Discord](/hi/channels/discord) - Discord Bot API + Gateway; सर्वर, चैनल, और DM का समर्थन करता है।
- [Feishu](/hi/channels/feishu) - WebSocket के माध्यम से Feishu/Lark बॉट (बंडल किया गया plugin)।
- [Google Chat](/hi/channels/googlechat) - HTTP webhook के माध्यम से Google Chat API ऐप (डाउनलोड योग्य plugin)।
- [iMessage](/hi/channels/imessage) - साइन-इन किए गए Mac पर `imsg` ब्रिज के माध्यम से नेटिव macOS इंटीग्रेशन (या जब Gateway कहीं और चलता है तो SSH wrapper), जिसमें उत्तरों, tapbacks, effects, attachments, और समूह प्रबंधन के लिए निजी API actions शामिल हैं। नए OpenClaw iMessage सेटअप के लिए पसंदीदा, जब host permissions और Messages access उपयुक्त हों।
- [IRC](/hi/channels/irc) - क्लासिक IRC सर्वर; pairing/allowlist controls के साथ चैनल + DM।
- [LINE](/hi/channels/line) - LINE Messaging API बॉट (डाउनलोड योग्य plugin)।
- [Matrix](/hi/channels/matrix) - Matrix प्रोटोकॉल (डाउनलोड योग्य plugin)।
- [Mattermost](/hi/channels/mattermost) - Bot API + WebSocket; चैनल, समूह, DM (डाउनलोड योग्य plugin)।
- [Microsoft Teams](/hi/channels/msteams) - Bot Framework; enterprise support (बंडल किया गया plugin)।
- [Nextcloud Talk](/hi/channels/nextcloud-talk) - Nextcloud Talk के माध्यम से self-hosted चैट (बंडल किया गया plugin)।
- [Nostr](/hi/channels/nostr) - NIP-04 के माध्यम से विकेंद्रीकृत DM (बंडल किया गया plugin)।
- [QQ Bot](/hi/channels/qqbot) - QQ Bot API; निजी चैट, समूह चैट, और rich media (बंडल किया गया plugin)।
- [Raft](/hi/channels/raft) - मानव और एजेंट सहयोग के लिए Raft CLI wake bridge (बाहरी plugin)।
- [Signal](/hi/channels/signal) - signal-cli; privacy-focused।
- [Slack](/hi/channels/slack) - Bolt SDK; workspace apps।
- [SMS](/hi/channels/sms) - Gateway webhook के माध्यम से Twilio-backed SMS (official plugin)।
- [Synology Chat](/hi/channels/synology-chat) - outgoing+incoming webhooks के माध्यम से Synology NAS Chat (बंडल किया गया plugin)।
- [Telegram](/hi/channels/telegram) - grammY के माध्यम से Bot API; समूहों का समर्थन करता है।
- [Tlon](/hi/channels/tlon) - Urbit-आधारित messenger (बंडल किया गया plugin)।
- [Twitch](/hi/channels/twitch) - IRC connection के माध्यम से Twitch chat (बंडल किया गया plugin)।
- [Voice Call](/hi/plugins/voice-call) - Plivo या Twilio के माध्यम से Telephony (plugin, अलग से इंस्टॉल किया गया)।
- [WebChat](/hi/web/webchat) - WebSocket पर Gateway WebChat UI।
- [WeChat](/hi/channels/wechat) - QR login के माध्यम से Tencent iLink Bot plugin; केवल निजी chats (बाहरी plugin)।
- [WhatsApp](/hi/channels/whatsapp) - सबसे लोकप्रिय; Baileys का उपयोग करता है और QR pairing की आवश्यकता होती है।
- [Yuanbao](/hi/channels/yuanbao) - Tencent Yuanbao बॉट (बाहरी plugin)।
- [Zalo](/hi/channels/zalo) - Zalo Bot API; वियतनाम का लोकप्रिय messenger (बंडल किया गया plugin)।
- [Zalo ClawBot](/hi/channels/zaloclawbot) - QR login के माध्यम से व्यक्तिगत Zalo assistant; owner-bound (बाहरी plugin)।
- [Zalo Personal](/hi/channels/zalouser) - QR login के माध्यम से Zalo व्यक्तिगत खाता (बंडल किया गया plugin)।

## नोट्स

- चैनल साथ-साथ चल सकते हैं; कई कॉन्फ़िगर करें और OpenClaw प्रति चैट रूट करेगा।
- सबसे तेज़ सेटअप आमतौर पर **Telegram** है (सरल बॉट टोकन)। WhatsApp को QR pairing की आवश्यकता होती है और
  डिस्क पर अधिक state संग्रहीत करता है।
- समूह व्यवहार चैनल के अनुसार अलग-अलग होता है; [समूह](/hi/channels/groups) देखें।
- सुरक्षा के लिए DM pairing और allowlists लागू किए जाते हैं; [सुरक्षा](/hi/gateway/security) देखें।
- समस्या निवारण: [चैनल समस्या निवारण](/hi/channels/troubleshooting)।
- मॉडल प्रदाताओं को अलग से दस्तावेजीकृत किया गया है; [मॉडल प्रदाता](/hi/providers/models) देखें।
