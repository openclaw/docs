---
read_when:
    - Nextcloud Talk चैनल की सुविधाओं पर काम करना
summary: Nextcloud Talk समर्थन की स्थिति, क्षमताएँ और कॉन्फ़िगरेशन
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-19T08:00:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk एक डाउनलोड करने योग्य चैनल Plugin (`@openclaw/nextcloud-talk`) है, जो Talk webhook बॉट के माध्यम से OpenClaw को स्वयं होस्ट किए गए Nextcloud इंस्टेंस से जोड़ता है। प्रत्यक्ष संदेश, रूम, प्रतिक्रियाएँ और Markdown संदेश समर्थित हैं; मीडिया URL के रूप में भेजा जाता है।

## इंस्टॉल करें

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

वर्तमान आधिकारिक रिलीज़ टैग का अनुसरण करने के लिए केवल पैकेज विनिर्देश का उपयोग करें। सटीक संस्करण केवल तभी पिन करें, जब आपको पुनरुत्पाद्य इंस्टॉलेशन चाहिए।

स्थानीय चेकआउट से (डेवलपमेंट कार्यप्रवाह):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

इंस्टॉल करने के बाद Gateway को पुनः आरंभ करें। विवरण: [Plugins](/hi/tools/plugin)

## त्वरित सेटअप (शुरुआती)

1. Plugin इंस्टॉल करें (ऊपर)।
2. अपने Nextcloud सर्वर पर एक बॉट बनाएँ:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   `--feature response` बनाए रखें: इसके बिना, आउटबाउंड उत्तर 401 के साथ विफल हो जाते हैं। मौजूदा बॉट को `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1` से ठीक करें।

3. लक्षित रूम की सेटिंग में बॉट सक्षम करें।
4. OpenClaw कॉन्फ़िगर करें:
   - कॉन्फ़िगरेशन: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - या परिवेश चर: `NEXTCLOUD_TALK_BOT_SECRET` (केवल डिफ़ॉल्ट खाता)

   CLI सेटअप (`--url`/`--token` स्पष्ट फ़ील्ड के उपनाम हैं; `nc-talk` और `nc` चैनल उपनामों के रूप में काम करते हैं):

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   समतुल्य स्पष्ट फ़ील्ड:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   फ़ाइल-आधारित सीक्रेट:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Gateway को पुनः आरंभ करें (या सेटअप पूरा करें)।

न्यूनतम कॉन्फ़िगरेशन:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## टिप्पणियाँ

- बॉट प्रत्यक्ष संदेश शुरू नहीं कर सकते। उपयोगकर्ता को पहले बॉट को संदेश भेजना होगा।
- Webhook URL को Nextcloud सर्वर से पहुँच योग्य होना चाहिए; जब Gateway किसी प्रॉक्सी के पीछे हो, तो `webhookPublicUrl` सेट करें। Webhook अनुरोधों पर बॉट सीक्रेट से HMAC-SHA256 हस्ताक्षर किए जाते हैं; अमान्य हस्ताक्षर अस्वीकार किए जाते हैं और उन पर दर सीमा लागू होती है।
- बॉट API मीडिया अपलोड का समर्थन नहीं करता; आउटबाउंड मीडिया को `Attachment: <url>` पंक्ति के रूप में जोड़ा जाता है।
- Webhook पेलोड प्रत्यक्ष संदेशों और रूम में अंतर नहीं करता; रूम-प्रकार लुकअप सक्षम करने के लिए `apiUser` + `apiPassword` सेट करें (लगभग 5 मिनट के लिए कैश किए जाते हैं)। इनके बिना, प्रत्येक वार्तालाप को रूम माना जाता है।
- आउटबाउंड अनुरोध SSRF सुरक्षा से होकर जाते हैं। विश्वसनीय निजी/आंतरिक नेटवर्क पर स्थित Nextcloud होस्ट के लिए `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true` से इसकी अनुमति दें।
- `apiUser`/`apiPassword` और `webhookPublicUrl` सेट होने पर, `openclaw channels status` बॉट की जाँच करता है और `response` सुविधा अनुपस्थित होने पर चेतावनी देता है।

## पहुँच नियंत्रण (प्रत्यक्ष संदेश)

- डिफ़ॉल्ट: `channels.nextcloud-talk.dmPolicy = "pairing"`। अज्ञात प्रेषकों को पेयरिंग कोड मिलता है।
- इसके माध्यम से अनुमोदित करें:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- सार्वजनिक प्रत्यक्ष संदेश: `channels.nextcloud-talk.dmPolicy="open"` के साथ `channels.nextcloud-talk.allowFrom=["*"]`।
- `allowFrom` केवल Nextcloud उपयोगकर्ता ID से मेल खाता है (लोअरकेस में); प्रदर्शन नामों को अनदेखा किया जाता है।

## रूम (समूह)

- डिफ़ॉल्ट: `channels.nextcloud-talk.groupPolicy = "allowlist"` (उल्लेख आवश्यक)।
- रूम टोकन द्वारा कुंजीबद्ध `channels.nextcloud-talk.rooms` से रूम की अनुमति-सूची बनाएँ; `"*"` वाइल्डकार्ड डिफ़ॉल्ट सेट करता है:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- प्रति-रूम कुंजियाँ: `requireMention` (डिफ़ॉल्ट true), `enabled` (false रूम को अक्षम करता है), `allowFrom` (प्रति-रूम प्रेषक अनुमति-सूची), `tools` (टूल के अनुमति/निषेध ओवरराइड), `skills` (लोड किए गए Skills सीमित करें), `systemPrompt`।
- किसी भी रूम को अनुमति न देने के लिए अनुमति-सूची खाली रखें या `channels.nextcloud-talk.groupPolicy="disabled"` सेट करें।

## क्षमताएँ

| सुविधा          | स्थिति         |
| --------------- | -------------- |
| प्रत्यक्ष संदेश | समर्थित        |
| रूम             | समर्थित        |
| थ्रेड           | समर्थित नहीं   |
| मीडिया          | केवल URL       |
| प्रतिक्रियाएँ   | समर्थित        |
| मूल कमांड       | समर्थित नहीं   |

## कॉन्फ़िगरेशन संदर्भ (Nextcloud Talk)

संपूर्ण कॉन्फ़िगरेशन: [कॉन्फ़िगरेशन](/hi/gateway/configuration)

प्रदाता विकल्प:

- `channels.nextcloud-talk.enabled`: चैनल का आरंभ सक्षम/अक्षम करें।
- `channels.nextcloud-talk.baseUrl`: Nextcloud इंस्टेंस URL।
- `channels.nextcloud-talk.botSecret`: बॉट साझा सीक्रेट (स्ट्रिंग या सीक्रेट संदर्भ)।
- `channels.nextcloud-talk.botSecretFile`: सामान्य फ़ाइल का सीक्रेट पथ। प्रतीकात्मक लिंक अस्वीकार किए जाते हैं।
- `channels.nextcloud-talk.apiUser`: रूम लुकअप (प्रत्यक्ष संदेश पहचान) और स्थिति जाँच के लिए API उपयोगकर्ता।
- `channels.nextcloud-talk.apiPassword`: रूम लुकअप के लिए API/ऐप पासवर्ड।
- `channels.nextcloud-talk.apiPasswordFile`: API पासवर्ड फ़ाइल पथ।
- `channels.nextcloud-talk.webhookPort`: Webhook लिसनर पोर्ट (डिफ़ॉल्ट: 8788)।
- `channels.nextcloud-talk.webhookHost`: Webhook होस्ट (डिफ़ॉल्ट: 0.0.0.0)।
- `channels.nextcloud-talk.webhookPath`: Webhook पथ (डिफ़ॉल्ट: /nextcloud-talk-webhook)।
- `channels.nextcloud-talk.webhookPublicUrl`: बाहर से पहुँच योग्य Webhook URL।
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (डिफ़ॉल्ट: pairing)। `open` के लिए `allowFrom=["*"]` आवश्यक है।
- `channels.nextcloud-talk.allowFrom`: प्रत्यक्ष संदेश अनुमति-सूची (उपयोगकर्ता ID)।
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (डिफ़ॉल्ट: allowlist)।
- `channels.nextcloud-talk.groupAllowFrom`: रूम प्रेषक अनुमति-सूची (उपयोगकर्ता ID); सेट न होने पर `allowFrom` का उपयोग करती है।
- `channels.nextcloud-talk.rooms`: प्रति-रूम सेटिंग और अनुमति-सूची (ऊपर देखें)।
- स्थिर प्रेषक पहुँच समूहों को `allowFrom` और `groupAllowFrom` से `accessGroup:<name>` के माध्यम से संदर्भित किया जा सकता है।
- `channels.nextcloud-talk.historyLimit`: समूह इतिहास सीमा (0 अक्षम करता है)।
- `channels.nextcloud-talk.dmHistoryLimit`: प्रत्यक्ष संदेश इतिहास सीमा (0 अक्षम करता है)।
- `channels.nextcloud-talk.dms`: उपयोगकर्ता ID द्वारा कुंजीबद्ध प्रति-प्रत्यक्ष-संदेश ओवरराइड (`historyLimit`)।
- `channels.nextcloud-talk.textChunkLimit`: आउटबाउंड टेक्स्ट खंड का आकार, वर्णों में (डिफ़ॉल्ट: 4000)।
- `channels.nextcloud-talk.streaming.chunkMode`: लंबाई के आधार पर खंड बनाने से पहले रिक्त पंक्तियों (अनुच्छेद सीमाओं) पर विभाजित करने के लिए `length` (डिफ़ॉल्ट) या `newline`।
- `channels.nextcloud-talk.streaming.block.enabled`: इस चैनल के लिए ब्लॉक स्ट्रीमिंग सक्षम या अक्षम करें।
- `channels.nextcloud-talk.streaming.block.coalesce`: ब्लॉक स्ट्रीमिंग समेकन समायोजन।
- `channels.nextcloud-talk.responsePrefix`: आउटबाउंड उत्तर उपसर्ग।
- `channels.nextcloud-talk.markdown.tables`: Markdown तालिका रेंडरिंग मोड (`off | bullets | code | block`)।
- `channels.nextcloud-talk.mediaMaxMb`: इनबाउंड मीडिया सीमा (MB)।
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: निजी/आंतरिक Nextcloud होस्ट को SSRF सुरक्षा से आगे जाने दें।
- `channels.nextcloud-talk.accounts.<id>`: प्रति-खाता ओवरराइड (समान कुंजियाँ); `defaultAccount` डिफ़ॉल्ट चुनता है। परिवेश चर `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` केवल डिफ़ॉल्ट खाते पर लागू होते हैं।

## संबंधित

- [चैनल अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) — प्रत्यक्ष संदेश प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) — समूह चैट का व्यवहार और उल्लेख की आवश्यकता
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) — पहुँच मॉडल और सुदृढ़ीकरण
