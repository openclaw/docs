---
read_when:
    - Telegram सुविधाओं या वेबहुक पर काम करना
summary: Telegram बॉट समर्थन की स्थिति, क्षमताएँ और कॉन्फ़िगरेशन
title: Telegram
x-i18n:
    generated_at: "2026-07-20T07:00:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2d8fafa5a525aab0b6a79b76a10548423d147f6ec333b03b18fdacacacee34e3
    source_path: channels/telegram.md
    workflow: 16
---

grammY के माध्यम से बॉट DM और समूहों के लिए प्रोडक्शन हेतु तैयार। लॉन्ग पोलिंग डिफ़ॉल्ट ट्रांसपोर्ट है; Webhook मोड वैकल्पिक है।

<CardGroup cols={3}>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    Telegram के लिए डिफ़ॉल्ट DM नीति पेयरिंग है।
  </Card>
  <Card title="चैनल समस्या निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल निदान और सुधार कार्यविधियाँ।
  </Card>
  <Card title="Gateway कॉन्फ़िगरेशन" icon="settings" href="/hi/gateway/configuration">
    संपूर्ण चैनल कॉन्फ़िगरेशन पैटर्न और उदाहरण।
  </Card>
</CardGroup>

## त्वरित सेटअप

<Steps>
  <Step title="BotFather में बॉट टोकन बनाएँ">
    दोनों प्रवाहों के अंत में एक टोकन मिलता है जिसे आप OpenClaw में पेस्ट करते हैं — इनमें से एक चुनें:

    - **चैट प्रवाह**: Telegram खोलें, **@BotFather** से चैट करें (पुष्टि करें कि हैंडल ठीक `@BotFather` है), `/newbot` चलाएँ, संकेतों का पालन करें और टोकन सहेजें।
    - **वेब प्रवाह**: [BotFather का वेब ऐप](https://t.me/BotFather?startapp) खोलें — यह [web.telegram.org](https://web.telegram.org) सहित प्रत्येक Telegram क्लाइंट में चलता है — UI में बॉट बनाएँ और उसका टोकन कॉपी करें।

  </Step>

  <Step title="टोकन और DM नीति कॉन्फ़िगर करें">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    एनवायरनमेंट फ़ॉलबैक: `TELEGRAM_BOT_TOKEN` (केवल डिफ़ॉल्ट अकाउंट; नामित अकाउंट को `botToken` या `tokenFile` का उपयोग करना होगा)।
    Telegram `openclaw channels login telegram` का उपयोग **नहीं** करता; टोकन को कॉन्फ़िगरेशन/एनवायरनमेंट में सेट करें, फिर Gateway शुरू करें।

  </Step>

  <Step title="Gateway शुरू करें और पहला DM स्वीकृत करें">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    पेयरिंग कोड 1 घंटे बाद समाप्त हो जाते हैं।

  </Step>

  <Step title="बॉट को समूह में जोड़ें">
    बॉट को अपने समूह में जोड़ें, फिर समूह एक्सेस के लिए आवश्यक दोनों ID प्राप्त करें:

    - आपकी Telegram उपयोगकर्ता ID, `allowFrom` / `groupAllowFrom` के लिए
    - Telegram समूह चैट ID, `channels.telegram.groups` के अंतर्गत कुंजी के रूप में

    समूह चैट ID को `openclaw logs --follow`, फ़ॉरवर्ड की गई ID बताने वाले बॉट या Bot API `getUpdates` से प्राप्त करें। समूह को अनुमति मिलने के बाद, `/whoami@<bot_username>` उपयोगकर्ता और समूह ID की पुष्टि करता है।

    `-100` से शुरू होने वाली ऋणात्मक सुपरग्रुप ID समूह चैट ID होती हैं। वे `channels.telegram.groups` के अंतर्गत जाती हैं, `groupAllowFrom` के अंतर्गत नहीं।

  </Step>
</Steps>

<Note>
टोकन रिज़ॉल्यूशन अकाउंट-सचेत है: `tokenFile` की प्राथमिकता `botToken` से अधिक है, जिसकी प्राथमिकता एनवायरनमेंट से अधिक है; और कॉन्फ़िगरेशन हमेशा `TELEGRAM_BOT_TOKEN` पर प्राथमिकता पाता है (जो केवल डिफ़ॉल्ट अकाउंट के लिए रिज़ॉल्व होता है)। सफल स्टार्टअप के बाद, OpenClaw बॉट की पहचान को अधिकतम 24 घंटे तक कैश करता है, ताकि रीस्टार्ट के समय अतिरिक्त `getMe` कॉल न करनी पड़े; टोकन बदलने या हटाने से वह कैश साफ़ हो जाता है।
</Note>

## Telegram की सेटिंग्स

<AccordionGroup>
  <Accordion title="गोपनीयता मोड और समूह दृश्यता">
    Telegram बॉट में डिफ़ॉल्ट रूप से **Privacy Mode** होता है, जो उन्हें मिलने वाले समूह संदेशों को सीमित करता है।

    सभी समूह संदेश देखने के लिए, इनमें से कोई एक कार्य करें:

    - `/setprivacy` के माध्यम से गोपनीयता मोड अक्षम करें, या
    - बॉट को समूह एडमिन बनाएँ।

    गोपनीयता मोड बदलने के बाद, प्रत्येक समूह से बॉट हटाकर फिर से जोड़ें, ताकि Telegram परिवर्तन लागू करे।

  </Accordion>

  <Accordion title="समूह अनुमतियाँ">
    एडमिन स्थिति Telegram समूह सेटिंग्स में नियंत्रित होती है। एडमिन बॉट सभी समूह संदेश प्राप्त करते हैं, जो हमेशा सक्रिय रहने वाले समूह व्यवहार के लिए उपयोगी है।
  </Accordion>

  <Accordion title="उपयोगी BotFather टॉगल">

    - `/setjoingroups` — समूह में जोड़े जाने की अनुमति दें/अस्वीकार करें
    - `/setprivacy` — समूह दृश्यता व्यवहार

    यदि आप चैट कमांड के बजाय UI पसंद करते हैं, तो यही सेटिंग्स [BotFather के वेब ऐप](https://t.me/BotFather?startapp) में उपलब्ध हैं।

  </Accordion>
</AccordionGroup>

## डैशबोर्ड Mini App

Telegram के भीतर OpenClaw डैशबोर्ड खोलने के लिए बॉट के साथ DM में `/dashboard` चलाएँ।

आवश्यकताएँ:

- प्रकाशित HTTPS Mini App URL के लिए `gateway.tailscale.mode: "serve"` या `"funnel"`।
- आपकी संख्यात्मक Telegram उपयोगकर्ता ID चयनित अकाउंट के प्रभावी `allowFrom` या `commands.ownerAllowFrom` में होनी चाहिए।
- DM का उपयोग करें। समूहों में, `/dashboard`, `open this in a DM with the bot` के साथ उत्तर देता है और कोई बटन नहीं भेजता।
- Docker इंस्टॉलेशन: Serve/Funnel मोड के लिए Gateway को `tailscaled` के पास लूपबैक से बाइंड होना आवश्यक है, जिसे प्रकाशित पोर्ट वाला ब्रिज नेटवर्किंग पूरा नहीं कर सकता। Gateway कंटेनर को `network_mode: host` के साथ चलाएँ और होस्ट `tailscaled` सॉकेट (`/var/run/tailscale`) तथा `tailscale` CLI को कंटेनर में माउंट करें।

Mini App केवल Tailscale वाला v1 पथ है और Telegram Web iframe का समर्थन नहीं करता।

## एक्सेस नियंत्रण और सक्रियण

### ग्रुप बॉट पहचान

ग्रुप और फ़ोरम विषयों में, कॉन्फ़िगर किए गए बॉट हैंडल का स्पष्ट उल्लेख (उदाहरण के लिए `@my_bot`) चयनित OpenClaw एजेंट को संबोधित करता है, भले ही एजेंट पर्सोना का नाम Telegram उपयोगकर्ता नाम से अलग हो। असंबंधित ट्रैफ़िक पर ग्रुप मौन नीति अब भी लागू होती है, लेकिन बॉट हैंडल स्वयं कभी भी "कोई और" नहीं होता।

<Tabs>
  <Tab title="DM नीति">
    `channels.telegram.dmPolicy` डायरेक्ट मैसेज की पहुँच नियंत्रित करता है:

    - `pairing` (डिफ़ॉल्ट)
    - `allowlist` (`allowFrom` में कम-से-कम एक प्रेषक ID आवश्यक है)
    - `open` (`allowFrom` में `"*"` शामिल होना आवश्यक है)
    - `disabled`

    `dmPolicy: "open"` को `allowFrom: ["*"]` के साथ उपयोग करने पर बॉट का उपयोगकर्ता नाम खोजने या अनुमान लगाने वाला कोई भी Telegram खाता बॉट को कमांड दे सकता है। इसका उपयोग केवल जानबूझकर सार्वजनिक रखे गए उन बॉट के लिए करें जिनके टूल सख्ती से प्रतिबंधित हों; एक स्वामी वाले बॉट को संख्यात्मक उपयोगकर्ता ID के साथ `allowlist` का उपयोग करना चाहिए।

    `channels.telegram.allowFrom` संख्यात्मक Telegram उपयोगकर्ता ID स्वीकार करता है। `telegram:` / `tg:` प्रीफ़िक्स स्वीकार किए जाते हैं और सामान्यीकृत किए जाते हैं।
    एकाधिक खातों वाले कॉन्फ़िगरेशन में, प्रतिबंधात्मक शीर्ष-स्तरीय `channels.telegram.allowFrom` एक सुरक्षा सीमा है: खाता-स्तरीय `allowFrom: ["*"]` उस खाते को सार्वजनिक नहीं बनाता, जब तक मर्ज की गई प्रभावी अनुमतिसूची में स्पष्ट वाइल्डकार्ड अब भी शामिल न हो।
    रिक्त `allowFrom` के साथ `dmPolicy: "allowlist"` सभी DM को ब्लॉक करता है और कॉन्फ़िगरेशन सत्यापन द्वारा अस्वीकार कर दिया जाता है।
    सेटअप केवल संख्यात्मक उपयोगकर्ता ID माँगता है। यदि आपके कॉन्फ़िगरेशन में किसी पुराने सेटअप की `@username` अनुमतिसूची प्रविष्टियाँ हैं, तो उन्हें संख्यात्मक ID में बदलने के लिए `openclaw doctor --fix` चलाएँ (सर्वोत्तम प्रयास; Telegram बॉट टोकन आवश्यक है)।
    यदि आप पहले पेयरिंग-स्टोर अनुमतिसूची फ़ाइलों पर निर्भर थे, तो `openclaw doctor --fix` अनुमतिसूची प्रवाहों के लिए प्रविष्टियों को `channels.telegram.allowFrom` में पुनर्प्राप्त कर सकता है (उदाहरण के लिए, जब `dmPolicy: "allowlist"` में अभी कोई स्पष्ट ID न हो)।

    एक स्वामी वाले बॉट के लिए, पिछले पेयरिंग अनुमोदनों पर निर्भर रहने के बजाय स्पष्ट संख्यात्मक `allowFrom` ID के साथ `dmPolicy: "allowlist"` को प्राथमिकता दें।

    सामान्य भ्रम: DM पेयरिंग अनुमोदन का अर्थ यह नहीं है कि "यह प्रेषक हर जगह अधिकृत है।" पेयरिंग केवल DM पहुँच प्रदान करती है। यदि अभी तक कोई कमांड स्वामी मौजूद नहीं है, तो पहली अनुमोदित पेयरिंग `commands.ownerAllowFrom` भी सेट करती है, जिससे केवल-स्वामी कमांड और निष्पादन अनुमोदनों को एक स्पष्ट ऑपरेटर खाता मिलता है। ग्रुप प्रेषक प्राधिकरण अब भी स्पष्ट कॉन्फ़िगरेशन अनुमतिसूचियों से आता है।
    एक पहचान से DM और ग्रुप कमांड, दोनों के लिए अधिकृत होने हेतु: अपनी संख्यात्मक Telegram उपयोगकर्ता ID को `channels.telegram.allowFrom` में रखें, और केवल-स्वामी कमांड के लिए सुनिश्चित करें कि `commands.ownerAllowFrom` में `telegram:<your user id>` शामिल हो।

    ### अपनी Telegram उपयोगकर्ता ID खोजना

    अधिक सुरक्षित (कोई तृतीय-पक्ष बॉट नहीं): अपने बॉट को DM करें, `openclaw logs --follow` चलाएँ और `from.id` पढ़ें।

    आधिकारिक Bot API विधि:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    तृतीय-पक्ष (कम निजी): `@userinfobot` या `@getidsbot`।

  </Tab>

  <Tab title="ग्रुप नीति और अनुमतिसूचियाँ">
    दो नियंत्रण एक साथ लागू होते हैं:

    1. **किन ग्रुप को अनुमति है** (`channels.telegram.groups`)
       - कोई `groups` कॉन्फ़िगरेशन नहीं, `groupPolicy: "open"`: कोई भी ग्रुप, ग्रुप-ID जाँच पास करता है
       - कोई `groups` कॉन्फ़िगरेशन नहीं, `groupPolicy: "allowlist"` (डिफ़ॉल्ट): जब तक आप `groups` प्रविष्टियाँ (या `"*"`) नहीं जोड़ते, सभी ग्रुप ब्लॉक रहते हैं
       - `groups` कॉन्फ़िगर किया गया: अनुमतिसूची के रूप में कार्य करता है (स्पष्ट ID या `"*"`)

    2. **ग्रुप में किन प्रेषकों को अनुमति है** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (डिफ़ॉल्ट) / `disabled`

    `groupAllowFrom` ग्रुप प्रेषकों को फ़िल्टर करता है; यदि इसे सेट नहीं किया गया है, तो Telegram `allowFrom` पर वापस जाता है (पेयरिंग स्टोर पर नहीं — ग्रुप प्रेषक प्रमाणीकरण कभी भी DM पेयरिंग-स्टोर अनुमोदनों को इनहेरिट नहीं करता, जो `2026.2.25` से एक सुरक्षा सीमा है)।
    `groupAllowFrom` प्रविष्टियाँ संख्यात्मक Telegram उपयोगकर्ता ID होनी चाहिए (`telegram:` / `tg:` प्रीफ़िक्स सामान्यीकृत किए जाते हैं); गैर-संख्यात्मक प्रविष्टियों को अनदेखा किया जाता है। यहाँ ग्रुप या सुपरग्रुप चैट ID न रखें — ऋणात्मक चैट ID को `channels.telegram.groups` के अंतर्गत रखा जाता है।
    एक स्वामी वाले बॉट के लिए व्यावहारिक पैटर्न: अपनी उपयोगकर्ता ID को `channels.telegram.allowFrom` में सेट करें, `groupAllowFrom` को सेट न करें और लक्षित ग्रुप को `channels.telegram.groups` के अंतर्गत अनुमति दें।
    यदि कॉन्फ़िगरेशन में `channels.telegram` पूरी तरह अनुपस्थित है, तो रनटाइम डिफ़ॉल्ट रूप से फ़ेल-क्लोज़्ड `groupPolicy="allowlist"` का उपयोग करता है, जब तक `channels.defaults.groupPolicy` को स्पष्ट रूप से सेट न किया गया हो।

    केवल-स्वामी ग्रुप सेटअप:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    ग्रुप से `@<bot_username> ping` के साथ परीक्षण करें। `requireMention: true` होने के दौरान सामान्य ग्रुप संदेश बॉट को ट्रिगर नहीं करते।

    एक विशिष्ट ग्रुप के किसी भी सदस्य को अनुमति दें:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    एक विशिष्ट ग्रुप में केवल विशिष्ट उपयोगकर्ताओं को अनुमति दें:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      सामान्य गलती: `groupAllowFrom` कोई ग्रुप अनुमतिसूची नहीं है।

      - ऋणात्मक Telegram ग्रुप/सुपरग्रुप चैट ID (`-1001234567890`) को `channels.telegram.groups` के अंतर्गत रखा जाता है।
      - Telegram उपयोगकर्ता ID (`8734062810`) को `groupAllowFrom` के अंतर्गत रखा जाता है, ताकि यह सीमित किया जा सके कि अनुमत ग्रुप के भीतर कौन-से लोग बॉट को ट्रिगर कर सकते हैं।
      - किसी अनुमत ग्रुप के किसी भी सदस्य को बॉट से बात करने देने के लिए ही `groupAllowFrom: ["*"]` का उपयोग करें।

    </Warning>

  </Tab>

  <Tab title="उल्लेख का व्यवहार">
    डिफ़ॉल्ट रूप से ग्रुप उत्तरों के लिए उल्लेख आवश्यक है। उल्लेख इनमें से आ सकता है:

    - मूल `@botusername` उल्लेख से, या
    - `agents.list[].groupChat.mentionPatterns` या `messages.groupChat.mentionPatterns` में किसी उल्लेख पैटर्न से

    सत्र-स्तरीय टॉगल (केवल स्थिति, स्थायी नहीं): `/activation always`, `/activation mention`। स्थायित्व के लिए कॉन्फ़िगरेशन का उपयोग करें:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    ग्रुप इतिहास संदर्भ हमेशा चालू रहता है और `historyLimit` द्वारा सीमित होता है। ग्रुप इतिहास विंडो अक्षम करने के लिए `channels.telegram.historyLimit: 0` सेट करें। `openclaw doctor --fix` सेवानिवृत्त `includeGroupHistoryContext` कुंजी को हटाता है।

    ग्रुप चैट ID प्राप्त करना: किसी ग्रुप संदेश को `@userinfobot` / `@getidsbot` पर अग्रेषित करें, `openclaw logs --follow` से `chat.id` पढ़ें, Bot API के `getUpdates` का निरीक्षण करें, या (ग्रुप को अनुमति मिलने के बाद) `/whoami@<bot_username>` चलाएँ।

  </Tab>
</Tabs>

## रनटाइम व्यवहार

- Telegram Gateway प्रक्रिया के भीतर चलता है।
- रूटिंग नियतात्मक है: Telegram से आने वाले संदेशों के उत्तर Telegram पर ही जाते हैं (मॉडल चैनल नहीं चुनता)।
- आने वाले संदेश उत्तर मेटाडेटा, मीडिया प्लेसहोल्डर और Gateway द्वारा देखे गए उत्तरों के लिए सहेजे गए उत्तर-श्रृंखला संदर्भ सहित साझा चैनल एनवेलप में सामान्यीकृत होते हैं।
- समूह सत्र समूह ID के आधार पर अलग रखे जाते हैं। फ़ोरम विषयों में `:topic:<threadId>` जोड़ा जाता है।
- DM संदेशों में `message_thread_id` हो सकता है; OpenClaw इसे उत्तरों के लिए सुरक्षित रखता है। DM विषय सत्र केवल तभी विभाजित होते हैं जब Telegram `getMe` बॉट के लिए `has_topics_enabled: true` रिपोर्ट करता है; अन्यथा DM समतल सत्र पर बने रहते हैं।
- लॉन्ग पोलिंग प्रति-चैट/प्रति-थ्रेड अनुक्रमण के साथ grammY रनर का उपयोग करती है। रनर सिंक समवर्तीता `agents.defaults.maxConcurrent` का उपयोग करती है।
- बहु-अकाउंट स्टार्टअप समवर्ती `getMe` जाँचों को सीमित करता है, ताकि बड़े बॉट समूह प्रत्येक अकाउंट की जाँच एक साथ आरंभ न करें।
- प्रत्येक Gateway प्रक्रिया लॉन्ग पोलिंग को सुरक्षित करती है, ताकि एक समय में केवल एक सक्रिय पोलर ही किसी बॉट टोकन का उपयोग कर सके। लगातार बने रहने वाले `getUpdates` 409 विरोध उसी टोकन का उपयोग कर रहे किसी अन्य OpenClaw Gateway, स्क्रिप्ट या बाहरी पोलर की ओर संकेत करते हैं।
- पूर्ण हुई `getUpdates` सक्रियता के बिना 120 सेकंड बीतने पर पोलिंग वॉचडॉग पुनः आरंभ होता है।
- Telegram Bot API में पठन-पुष्टि का समर्थन नहीं है (`sendReadReceipts` लागू नहीं होता)।

<Note>
  `channels.telegram.dm.threadReplies` और `channels.telegram.direct.<chatId>.threadReplies` हटा दिए गए हैं। अपग्रेड करने के बाद, यदि आपके कॉन्फ़िगरेशन में वे कुंजियाँ अभी भी हैं, तो `openclaw doctor --fix` चलाएँ। DM विषय रूटिंग अब Telegram `getMe.has_topics_enabled` का अनुसरण करती है (BotFather थ्रेडेड मोड द्वारा नियंत्रित): विषय-सक्षम बॉट तब थ्रेड-स्कोप वाले DM सत्रों का उपयोग करते हैं जब Telegram `message_thread_id` भेजता है; अन्य DM समतल सत्र पर बने रहते हैं।
</Note>

## सुविधा संदर्भ

<AccordionGroup>
  <Accordion title="लाइव स्ट्रीम पूर्वावलोकन (संदेश संपादन)">
    OpenClaw सीधे चैट, समूहों और विषयों में आंशिक उत्तरों को रीयल टाइम में स्ट्रीम करता है: एक पूर्वावलोकन संदेश भेजता है, फिर बार-बार `editMessageText` करता है और अंत में उसी स्थान पर उसे अंतिम रूप देता है।

    - `channels.telegram.streaming` का मान `off | partial | block | progress` है (डिफ़ॉल्ट: `partial`)
    - छोटे आरंभिक उत्तर पूर्वावलोकनों पर डिबाउंस लागू होता है, फिर यदि रन अब भी सक्रिय हो तो सीमित विलंब के बाद उन्हें वास्तविक रूप दिया जाता है
    - `progress` टूल की प्रगति के लिए एक संपादन-योग्य स्थिति ड्राफ़्ट बनाए रखता है, टूल प्रगति से पहले उत्तर गतिविधि आने पर स्थिर स्थिति लेबल दिखाता है, पूर्ण होने पर इसे साफ़ करता है और अंतिम उत्तर को सामान्य संदेश के रूप में भेजता है
    - `streaming.preview.toolProgress` नियंत्रित करता है कि टूल/प्रगति अपडेट उसी संपादित पूर्वावलोकन संदेश का दोबारा उपयोग करें या नहीं (डिफ़ॉल्ट: पूर्वावलोकन स्ट्रीमिंग सक्रिय होने पर `true`)
    - `streaming.preview.commandText` उन पंक्तियों के भीतर कमांड/निष्पादन विवरण नियंत्रित करता है: `raw` (डिफ़ॉल्ट) या `status` (केवल टूल लेबल)
    - `streaming.progress.commentary` (डिफ़ॉल्ट: `false`) अस्थायी प्रगति ड्राफ़्ट में सहायक की टिप्पणी/प्रस्तावना टेक्स्ट को शामिल करने का विकल्प देता है
    - पुराने `channels.telegram.streamMode`, बूलियन `streaming` मान और हटाई गई मूल ड्राफ़्ट पूर्वावलोकन कुंजियों का पता लगाया जाता है; उन्हें माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ

    टूल-प्रगति पंक्तियाँ वे छोटे स्थिति अपडेट हैं जो टूल चलते समय दिखाए जाते हैं (कमांड निष्पादन, फ़ाइल पढ़ना, योजना अपडेट, पैच सारांश, ऐप-सर्वर मोड में Codex प्रस्तावना/टिप्पणी)। Telegram इन्हें डिफ़ॉल्ट रूप से चालू रखता है (`v2026.4.22`+ से जारी व्यवहार के अनुरूप)।

    उत्तर-पूर्वावलोकन संपादन बनाए रखें, लेकिन टूल-प्रगति पंक्तियाँ छिपाएँ:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    टूल-प्रगति दृश्यमान रखें, लेकिन कमांड/निष्पादन टेक्स्ट छिपाएँ:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    `progress` मोड अंतिम उत्तर को उस संदेश में संपादित किए बिना टूल की प्रगति दिखाता है। कमांड-टेक्स्ट नीति को `streaming.progress` के अंतर्गत रखें:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    `streaming.mode: "off"` पूर्वावलोकन संपादन अक्षम करता है और सामान्य टूल/प्रगति संदेशों को स्वतंत्र स्थिति संदेशों के रूप में भेजने के बजाय दबा देता है; अनुमोदन संकेत, मीडिया और त्रुटियाँ अब भी सामान्य अंतिम डिलीवरी से भेजे जाते हैं। `streaming.preview.toolProgress: false` केवल उत्तर-पूर्वावलोकन संपादन बनाए रखता है।

    <Note>
      चुने गए उद्धरण वाले उत्तर अपवाद हैं। जब `replyToMode` का मान `first`, `all` या `batched` हो और आने वाले संदेश में चुना गया उद्धरण टेक्स्ट हो, तो OpenClaw उत्तर पूर्वावलोकन संपादित करने के बजाय Telegram के मूल उद्धरण-उत्तर पथ से अंतिम उत्तर भेजता है, इसलिए उस टर्न में `streaming.preview.toolProgress` स्थिति पंक्तियाँ नहीं दिखा सकता। चुने गए उद्धरण टेक्स्ट के बिना वर्तमान-संदेश वाले उत्तर अब भी स्ट्रीम होते हैं। जब मूल उद्धरण उत्तरों से अधिक महत्वपूर्ण टूल-प्रगति की दृश्यता हो, तो `replyToMode: "off"` सेट करें, या उस समझौते को स्वीकार करने के लिए `streaming.preview.toolProgress: false` सेट करें।
    </Note>

    केवल-टेक्स्ट उत्तरों के लिए: छोटे पूर्वावलोकनों में अंतिम संपादन उसी स्थान पर होता है; कई संदेशों में विभाजित होने वाले लंबे अंतिम उत्तर पूर्वावलोकन को पहले खंड के रूप में दोबारा उपयोग करते हैं और फिर केवल शेष भाग भेजते हैं; प्रगति-मोड के अंतिम उत्तर स्थिति ड्राफ़्ट साफ़ करके सामान्य अंतिम डिलीवरी का उपयोग करते हैं; यदि पूर्णता की पुष्टि होने से पहले अंतिम संपादन विफल हो जाए, तो OpenClaw सामान्य अंतिम डिलीवरी का सहारा लेता है और पुराने पूर्वावलोकन को साफ़ करता है। जटिल उत्तरों (मीडिया पेलोड) के लिए OpenClaw हमेशा सामान्य अंतिम डिलीवरी का सहारा लेता है और पूर्वावलोकन को साफ़ करता है।

    पूर्वावलोकन स्ट्रीमिंग और ब्लॉक स्ट्रीमिंग परस्पर अनन्य हैं — ब्लॉक स्ट्रीमिंग स्पष्ट रूप से सक्षम होने पर OpenClaw दोहरी स्ट्रीमिंग से बचने के लिए पूर्वावलोकन स्ट्रीम छोड़ देता है।

    तर्क-विचार: `/reasoning stream` जनरेट करते समय तर्क-विचार को लाइव पूर्वावलोकन में स्ट्रीम करता है, फिर अंतिम डिलीवरी के बाद तर्क-विचार पूर्वावलोकन हटा देता है (इसे दृश्यमान रखने के लिए `/reasoning on` का उपयोग करें)। अंतिम उत्तर तर्क-विचार टेक्स्ट के बिना भेजा जाता है।

  </Accordion>

  <Accordion title="समृद्ध संदेश स्वरूपण">
    आउटबाउंड टेक्स्ट डिफ़ॉल्ट रूप से मानक Telegram HTML संदेशों का उपयोग करता है, जो मौजूदा क्लाइंटों में पठनीय हैं: बोल्ड, इटैलिक, लिंक, कोड, स्पॉइलर, उद्धरण — Bot API 10.2 के केवल-समृद्ध ब्लॉक (मूल तालिकाएँ, विवरण, समृद्ध मीडिया, सूत्र) नहीं।

    Bot API 10.2 समृद्ध संदेशों को सक्रिय करें:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    सक्षम होने पर: एजेंट को बताया जाता है कि इस बॉट/अकाउंट के लिए समृद्ध संदेश उपलब्ध हैं (समर्थित Markdown + HTML-आइलैंड लेखन अनुबंध के साथ); Markdown टेक्स्ट OpenClaw के Markdown IR के माध्यम से टाइप किए गए Bot API 10.2 समृद्ध ब्लॉक के रूप में रेंडर होता है (शीर्षक, तालिकाएँ, विवरण, चेकलिस्ट, समृद्ध मीडिया, सूत्र, मानचित्र, कोलाज); मीडिया कैप्शन अब भी Telegram HTML कैप्शन का उपयोग करते हैं (समृद्ध संदेश कैप्शन को प्रतिस्थापित नहीं करते और कैप्शन की सीमा 1024 वर्ण है)।

    इससे मॉडल टेक्स्ट Telegram के समृद्ध-Markdown संकेत-चिह्नों से दूर रहता है, इसलिए `$400-600K` जैसी मुद्रा को गणित के रूप में पार्स नहीं किया जाता। लंबा समृद्ध टेक्स्ट Telegram की सीमाओं के अनुसार स्वतः विभाजित हो जाता है। 20-स्तंभ सीमा से अधिक चौड़ी तालिकाएँ कोड ब्लॉक का सहारा लेती हैं।

    डिफ़ॉल्ट: क्लाइंट संगतता के लिए बंद — कुछ मौजूदा Desktop, Web, Android और तृतीय-पक्ष क्लाइंट स्वीकृत समृद्ध संदेशों को असमर्थित रूप में रेंडर करते हैं। इसे तब तक बंद रखें, जब तक बॉट के साथ उपयोग किया जाने वाला प्रत्येक क्लाइंट उन्हें रेंडर न कर सके। `/status` दिखाता है कि मौजूदा सत्र में समृद्ध संदेश चालू हैं या बंद।

    लिंक पूर्वावलोकन डिफ़ॉल्ट रूप से चालू रहते हैं। `channels.telegram.linkPreview: false` समृद्ध टेक्स्ट के लिए स्वचालित एंटिटी पहचान अक्षम करता है।

  </Accordion>

  <Accordion title="मूल कमांड और कस्टम कमांड">
    Telegram का कमांड मेनू स्टार्टअप पर `setMyCommands` के साथ पंजीकृत होता है। `commands.native: "auto"` Telegram के लिए मूल कमांड सक्षम करता है।

    कस्टम कमांड मेनू प्रविष्टियाँ जोड़ें:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git बैकअप" },
        { command: "generate", description: "एक छवि बनाएँ" },
      ],
    },
  },
}
```

    नियम: नाम सामान्यीकृत किए जाते हैं (आरंभिक `/` हटाया जाता है, लोअरकेस किया जाता है); मान्य पैटर्न `a-z`, `0-9`, `_`, लंबाई 1-32; कस्टम कमांड मूल कमांड को ओवरराइड नहीं कर सकते; विरोध/डुप्लिकेट छोड़ दिए जाते हैं और लॉग किए जाते हैं।

    कस्टम कमांड केवल मेनू प्रविष्टियाँ हैं — वे व्यवहार को स्वतः लागू नहीं करते। Plugin/स्किल कमांड Telegram मेनू में न दिखने पर भी टाइप किए जाने पर काम कर सकते हैं। यदि मूल कमांड अक्षम हैं, तो बिल्ट-इन कमांड हटा दिए जाते हैं; कॉन्फ़िगर होने पर कस्टम/Plugin कमांड अब भी पंजीकृत हो सकते हैं।

    सामान्य सेटअप विफलताएँ:

    - ट्रिम पुनःप्रयास के बाद `BOT_COMMANDS_TOO_MUCH` सहित `setMyCommands failed` का अर्थ है कि मेनू अब भी सीमा से अधिक है; Plugin/स्किल/कस्टम कमांड की संख्या घटाएँ या `channels.telegram.commands.native` अक्षम करें।
    - सीधे Bot API curl कमांड काम करने के बावजूद `deleteWebhook`, `deleteMyCommands` या `setMyCommands` का `404: Not Found` के साथ विफल होना आमतौर पर दर्शाता है कि `channels.telegram.apiRoot` को पूर्ण `/bot<TOKEN>` एंडपॉइंट पर सेट किया गया था। `apiRoot` में केवल Bot API रूट होना चाहिए; `openclaw doctor --fix` गलती से अंत में जुड़े `/bot<TOKEN>` को हटाता है।
    - `getMe returned 401` का अर्थ है कि Telegram ने कॉन्फ़िगर किया गया बॉट टोकन अस्वीकार कर दिया। `botToken`, `tokenFile` या `TELEGRAM_BOT_TOKEN` (डिफ़ॉल्ट अकाउंट) को मौजूदा BotFather टोकन से अपडेट करें; OpenClaw पोलिंग से पहले रुक जाता है, इसलिए इसे Webhook क्लीनअप विफलता के रूप में रिपोर्ट नहीं किया जाता।
    - नेटवर्क/फ़ेच त्रुटियों के साथ `setMyCommands failed` का आमतौर पर अर्थ है कि `api.telegram.org` के लिए आउटबाउंड DNS/HTTPS अवरुद्ध है।

    ### डिवाइस पेयरिंग कमांड (`device-pair` Plugin)

    इंस्टॉल होने पर:

    1. `/pair` एक सेटअप कोड जनरेट करता है
    2. कोड को iOS ऐप में पेस्ट करें
    3. `/pair pending` लंबित अनुरोध सूचीबद्ध करता है (भूमिका/स्कोप सहित)
    4. स्वीकृत करें: `/pair approve <requestId>`, `/pair approve` (केवल लंबित अनुरोध), या `/pair approve latest`

    यदि कोई डिवाइस बदले हुए प्रमाणीकरण विवरण (भूमिका, स्कोप, सार्वजनिक कुंजी) के साथ पुनः प्रयास करता है, तो पिछले लंबित अनुरोध को नए `requestId` से प्रतिस्थापित कर दिया जाता है; स्वीकृति देने से पहले `/pair pending` फिर से चलाएँ।

    अधिक विवरण: [पेयरिंग](/hi/channels/pairing#pair-via-telegram)।

  </Accordion>

  <Accordion title="इनलाइन बटन">
    इनलाइन कीबोर्ड स्कोप कॉन्फ़िगर करें:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    प्रति-अकाउंट ओवरराइड:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    स्कोप: `off`, `dm`, `group`, `all`, `allowlist` (डिफ़ॉल्ट)। पुराना `capabilities: ["inlineButtons"]`, `"all"` से मैप होता है।

    संदेश कार्रवाई का उदाहरण:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "एक विकल्प चुनें:",
  buttons: [
    [
      { text: "हाँ", callback_data: "yes" },
      { text: "नहीं", callback_data: "no" },
    ],
    [{ text: "रद्द करें", callback_data: "cancel" }],
  ],
}
```

    Mini App बटन का उदाहरण:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "ऐप खोलें:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "लॉन्च करें", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    `web_app` बटन केवल उपयोगकर्ता और बॉट के बीच निजी चैट में काम करते हैं।

    किसी पंजीकृत Plugin इंटरैक्टिव हैंडलर द्वारा स्वीकार न किए गए कॉलबैक क्लिक एजेंट को टेक्स्ट के रूप में दिए जाते हैं: `callback_data: <value>`।

  </Accordion>

  <Accordion title="एजेंट और स्वचालन के लिए Telegram संदेश कार्रवाइयाँ">
    कार्रवाइयाँ:

    - `sendMessage` (`to`, `content`, वैकल्पिक `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` या `caption`, वैकल्पिक `presentation` इनलाइन बटन; केवल-बटन संपादन उत्तर मार्कअप को अपडेट करते हैं)
    - `createForumTopic` (`chatId`, `name`, वैकल्पिक `iconColor`, `iconCustomEmojiId`)

    सुविधाजनक उपनाम: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    गेटिंग: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (डिफ़ॉल्ट: अक्षम)। `edit`, `createForumTopic`, और `editForumTopic` बिना किसी समर्पित टॉगल के डिफ़ॉल्ट रूप से सक्षम होते हैं।
    रनटाइम प्रेषण स्टार्टअप/रीलोड से सक्रिय कॉन्फ़िगरेशन/सीक्रेट स्नैपशॉट का उपयोग करते हैं, इसलिए कार्रवाई पथ प्रत्येक प्रेषण के लिए `SecretRef` मानों को दोबारा रिज़ॉल्व नहीं करते।

    प्रतिक्रिया हटाने का अर्थ-विज्ञान: [/tools/reactions](/hi/tools/reactions).

  </Accordion>

  <Accordion title="उत्तर थ्रेडिंग टैग">
    जनरेट किए गए आउटपुट में स्पष्ट उत्तर थ्रेडिंग टैग:

    - `[[reply_to_current]]` — ट्रिगर करने वाले संदेश का उत्तर देता है
    - `[[reply_to:<id>]]` — किसी विशिष्ट संदेश ID का उत्तर देता है

    `channels.telegram.replyToMode`: `off` (डिफ़ॉल्ट), `first`, `all`.

    जब उत्तर थ्रेडिंग सक्षम हो और मूल टेक्स्ट/कैप्शन उपलब्ध हो, तो OpenClaw स्वचालित रूप से एक नेटिव उद्धरण अंश जोड़ता है। Telegram नेटिव उद्धरण टेक्स्ट को 1024 UTF-16 कोड इकाइयों तक सीमित करता है; लंबे संदेशों को शुरुआत से उद्धृत किया जाता है और यदि Telegram उद्धरण अस्वीकार कर देता है, तो साधारण उत्तर का उपयोग किया जाता है।

    `off` केवल अंतर्निहित उत्तर थ्रेडिंग को अक्षम करता है; स्पष्ट `[[reply_to_*]]` टैग का फिर भी पालन किया जाता है।

  </Accordion>

  <Accordion title="फ़ोरम विषय और थ्रेड व्यवहार">
    फ़ोरम सुपरग्रुप: विषय सत्र कुंजियों के अंत में `:topic:<threadId>` जुड़ता है; उत्तर और टाइपिंग विषय थ्रेड को लक्षित करते हैं; विषय कॉन्फ़िगरेशन पथ `channels.telegram.groups.<chatId>.topics.<threadId>` है।

    सामान्य विषय (`threadId=1`) एक विशेष मामला है: संदेश प्रेषण `message_thread_id` को छोड़ देते हैं (Telegram `sendMessage(...thread_id=1)` को "thread not found" के साथ अस्वीकार करता है), लेकिन टाइपिंग कार्रवाइयों में फिर भी `message_thread_id` शामिल होता है (टाइपिंग संकेतक दिखाने के लिए अनुभवजन्य रूप से आवश्यक)।

    विषय प्रविष्टियाँ ओवरराइड न होने पर समूह सेटिंग प्राप्त करती हैं (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)। `agentId` केवल विषय के लिए है और समूह डिफ़ॉल्ट से प्राप्त नहीं होता। `topics."*"` उस समूह के प्रत्येक विषय के लिए डिफ़ॉल्ट सेट करता है; सटीक विषय ID फिर भी `"*"` पर प्राथमिकता पाते हैं।

    **प्रति-विषय एजेंट रूटिंग**: प्रत्येक विषय अपने विषय कॉन्फ़िगरेशन में `agentId` के माध्यम से किसी अलग एजेंट को रूट कर सकता है, जिससे उसे अपना कार्यक्षेत्र, मेमोरी और सत्र मिलता है:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // सामान्य विषय -> मुख्य एजेंट
                "3": { agentId: "zu" },        // विकास विषय -> zu एजेंट
                "5": { agentId: "coder" }      // कोड समीक्षा -> coder एजेंट
              }
            }
          }
        }
      }
    }
    ```

    इसके बाद प्रत्येक विषय की अपनी सत्र कुंजी होती है, उदाहरण के लिए `agent:zu:telegram:group:-1001234567890:topic:3`।

    **स्थायी ACP विषय बाइंडिंग**: फ़ोरम विषय शीर्ष-स्तरीय टाइप की गई बाइंडिंग (`bindings[]` के साथ `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"`, और `-1001234567890:topic:42` जैसी विषय-योग्य ID) के माध्यम से ACP हार्नेस सत्रों को पिन कर सकते हैं। वर्तमान में समूहों/सुपरग्रुपों के फ़ोरम विषयों तक सीमित है। [ACP एजेंट](/hi/tools/acp-agents) देखें।

    **चैट से थ्रेड-बाउंड ACP स्पॉन**: `/acp spawn <agent> --thread here|auto` वर्तमान विषय को एक नए ACP सत्र से बाँधता है; अनुवर्ती संदेश सीधे वहाँ रूट होते हैं, और OpenClaw स्पॉन पुष्टिकरण को विषय में पिन करता है। इसके लिए `channels.telegram.threadBindings.spawnSessions` आवश्यक है (डिफ़ॉल्ट: `true`)।

    टेम्पलेट संदर्भ `MessageThreadId` और `IsForum` को उपलब्ध कराता है। `message_thread_id` वाली DM चैट उत्तर मेटाडेटा बनाए रखती हैं, लेकिन थ्रेड-जागरूक सत्र कुंजियों का उपयोग केवल तभी करती हैं जब Telegram `getMe`, `has_topics_enabled: true` रिपोर्ट करता है।
    सेवानिवृत्त `dm.threadReplies` और `direct.*.threadReplies` ओवरराइड हटा दिए गए हैं; BotFather थ्रेडेड मोड सत्य का एकमात्र स्रोत है। पुराने कॉन्फ़िगरेशन कुंजियाँ हटाने के लिए `openclaw doctor --fix` चलाएँ।

  </Accordion>

  <Accordion title="ऑडियो, वीडियो और स्टिकर">
    ### ऑडियो संदेश

    Telegram वॉइस नोट और ऑडियो फ़ाइलों में अंतर करता है। डिफ़ॉल्ट: ऑडियो-फ़ाइल व्यवहार; वॉइस-नोट प्रेषण बाध्य करने के लिए एजेंट के उत्तर में `[[audio_as_voice]]` टैग लगाएँ। इनबाउंड वॉइस-नोट ट्रांसक्रिप्ट को एजेंट संदर्भ में मशीन-जनित, अविश्वसनीय टेक्स्ट के रूप में फ़्रेम किया जाता है, लेकिन उल्लेख पहचान फिर भी कच्चे ट्रांसक्रिप्ट का उपयोग करती है ताकि उल्लेख-गेटेड वॉइस संदेश काम करते रहें।

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### वीडियो संदेश

    Telegram वीडियो फ़ाइलों और वीडियो नोट में अंतर करता है। वीडियो नोट कैप्शन का समर्थन नहीं करते; दिया गया संदेश टेक्स्ट अलग से भेजा जाता है।

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### स्थान और स्थल

    एक स्वतंत्र `location` ऑब्जेक्ट के साथ मौजूदा `send` कार्रवाई का उपयोग करें। निर्देशांक एक नेटिव पिन भेजते हैं; `name` और `address` दोनों जोड़ने पर एक नेटिव स्थल कार्ड भेजा जाता है। स्थान प्रेषण को संदेश टेक्स्ट या मीडिया के साथ संयोजित नहीं किया जा सकता।

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffel Tower",
    address: "Champ de Mars, Paris",
  },
}
```

    ### स्टिकर

    इनबाउंड: स्थिर WEBP डाउनलोड और संसाधित किया जाता है (प्लेसहोल्डर `<media:sticker>`); एनिमेटेड TGS और वीडियो WEBM छोड़ दिए जाते हैं।

    स्टिकर संदर्भ फ़ील्ड: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`। बार-बार होने वाली विज़न कॉल कम करने के लिए विवरण OpenClaw SQLite Plugin स्थिति में कैश किए जाते हैं।

    स्टिकर कार्रवाइयाँ सक्षम करें:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    भेजें:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    कैश किए गए स्टिकर खोजें:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="प्रतिक्रिया सूचनाएँ">
    Telegram प्रतिक्रियाएँ संदेश पेलोड से अलग `message_reaction` अपडेट के रूप में आती हैं। सक्षम होने पर, OpenClaw `Telegram reaction added: 👍 by Alice (@alice) on msg 42` जैसे सिस्टम इवेंट कतार में लगाता है।

    - `channels.telegram.reactionNotifications`: `off | own | all` (डिफ़ॉल्ट: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (डिफ़ॉल्ट: `minimal`)

    `own` का अर्थ केवल बॉट द्वारा भेजे गए संदेशों पर उपयोगकर्ता प्रतिक्रियाएँ है (भेजे गए संदेशों के कैश के माध्यम से सर्वोत्तम प्रयास)। प्रतिक्रिया इवेंट फिर भी Telegram अभिगम नियंत्रणों (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) का पालन करते हैं; अनधिकृत प्रेषकों को छोड़ दिया जाता है।

    Telegram प्रतिक्रिया अपडेट में थ्रेड ID प्रदान नहीं करता: गैर-फ़ोरम समूह समूह चैट सत्र को रूट होते हैं; फ़ोरम समूह सटीक मूल विषय के बजाय सामान्य-विषय सत्र (`:topic:1`) को रूट होते हैं।

    पोलिंग/Webhook के लिए `allowed_updates` में `message_reaction` स्वचालित रूप से शामिल होता है।

  </Accordion>

  <Accordion title="पावती प्रतिक्रियाएँ">
    जब OpenClaw किसी इनबाउंड संदेश को संसाधित करता है, तब `ackReaction` एक पावती इमोजी भेजता है। `messages.ackReactionScope` तय करता है कि इसे *कब* भेजा जाए।

    **इमोजी रिज़ॉल्यूशन क्रम:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - एजेंट पहचान इमोजी फ़ॉलबैक (`agents.list[].identity.emoji`, अन्यथा "👀")

    Telegram एक यूनिकोड इमोजी की अपेक्षा करता है (उदाहरण के लिए "👀"); किसी चैनल या खाते के लिए प्रतिक्रिया अक्षम करने हेतु `""` का उपयोग करें।

    **दायरा (`messages.ackReactionScope`, डिफ़ॉल्ट `"group-mentions"`; वर्तमान में कोई Telegram-खाता या Telegram-चैनल ओवरराइड नहीं):**

    `all` (DM + समूह, परिवेशी कक्ष इवेंट सहित), `direct` (केवल DM), `group-all` (परिवेशी कक्ष इवेंट को छोड़कर प्रत्येक समूह संदेश, कोई DM नहीं), `group-mentions` (वे समूह जहाँ बॉट का उल्लेख किया गया हो; **कोई DM नहीं** — डिफ़ॉल्ट), `off` / `none` (अक्षम)।

    <Note>
    डिफ़ॉल्ट दायरा (`group-mentions`) DM या परिवेशी कक्ष इवेंट में पावती प्रतिक्रियाएँ ट्रिगर नहीं करता। DM के लिए `direct` या `all` का उपयोग करें; केवल `all` परिवेशी कक्ष इवेंट की पावती देता है। यह मान Telegram प्रदाता स्टार्टअप पर पढ़ा जाता है, इसलिए परिवर्तन प्रभावी करने के लिए Gateway पुनरारंभ आवश्यक है।
    </Note>

  </Accordion>

  <Accordion title="Telegram इवेंट और कमांड से कॉन्फ़िगरेशन लेखन">
    चैनल कॉन्फ़िगरेशन लेखन डिफ़ॉल्ट रूप से सक्षम है (`configWrites !== false`)। Telegram द्वारा ट्रिगर किए गए लेखन में समूह माइग्रेशन इवेंट (`migrate_to_chat_id`, `channels.telegram.groups` को अपडेट करता है) और `/config set` / `/config unset` शामिल हैं (कमांड सक्षम होना आवश्यक है)।

    अक्षम करें:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="लॉन्ग पोलिंग बनाम Webhook">
    डिफ़ॉल्ट लॉन्ग पोलिंग है। Webhook मोड के लिए `channels.telegram.webhookUrl` और `channels.telegram.webhookSecret` सेट करें; वैकल्पिक `webhookPath` (डिफ़ॉल्ट `/telegram-webhook`), `webhookHost` (डिफ़ॉल्ट `127.0.0.1`), `webhookPort` (डिफ़ॉल्ट `8787`), `webhookCertPath` (प्रत्यक्ष-IP या बिना-डोमेन सेटअप के लिए स्व-हस्ताक्षरित प्रमाणपत्र PEM)।

    लॉन्ग-पोलिंग मोड में, OpenClaw अपना पुनरारंभ वॉटरमार्क केवल किसी अपडेट के सफलतापूर्वक डिस्पैच होने के बाद स्थायी करता है; विफल हैंडलर उस अपडेट को पूर्ण चिह्नित करने के बजाय उसी प्रक्रिया में पुनः प्रयास योग्य बनाए रखता है।

    स्थानीय लिसनर डिफ़ॉल्ट रूप से `127.0.0.1:8787` से बाइंड होता है। सार्वजनिक इनग्रेस के लिए स्थानीय पोर्ट के सामने एक रिवर्स प्रॉक्सी रखें, या जानबूझकर `webhookHost: "0.0.0.0"` सेट करें।

    Webhook मोड अनुरोध गार्ड, Telegram सीक्रेट टोकन और JSON बॉडी को सत्यापित करता है, फिर खाली `200` लौटाने से पहले अपडेट को अपनी टिकाऊ इनग्रेस कतार में कमिट करता है। सफल टिकाऊ अंगीकरण में `x-openclaw-delivery-accepted: durable` शामिल होता है; स्वास्थ्य, रूटिंग, प्रमाणीकरण, सत्यापन और संग्रहण-त्रुटि प्रतिक्रियाएँ इस हेडर को छोड़ देती हैं। रिवर्स प्रॉक्सी और होस्ट नियंत्रक प्रतिक्रिया समय से स्वीकृति का अनुमान लगाए बिना OpenClaw अंगीकरण को सामान्य खाली `200` से अलग करने के लिए हेडर आवश्यक कर सकते हैं।

    टिकाऊ लेखन के बाद, OpenClaw कोर चैनल-इनग्रेस ड्रेन के माध्यम से अपडेट क्लेम और संसाधित करता है (प्रति-चैट/प्रति-विषय लेन, टर्न अंगीकरण पर पूर्ण, पूर्व-अंगीकरण स्टॉल टाइमआउट)। धीमे एजेंट टर्न Telegram की डिलीवरी ACK को रोके नहीं रखते।

  </Accordion>

  <Accordion title="सीमाएँ और CLI लक्ष्य">
    - `channels.telegram.textChunkLimit` डिफ़ॉल्ट रूप से 4000; `streaming.chunkMode="newline"` लंबाई के आधार पर विभाजन से पहले अनुच्छेद सीमाओं (रिक्त पंक्तियों) को प्राथमिकता देता है।
    - `channels.telegram.mediaMaxMb` (डिफ़ॉल्ट 100) इनबाउंड और आउटबाउंड मीडिया आकार को सीमित करता है।
    - समूह संदर्भ इतिहास `channels.telegram.historyLimit` या `messages.groupChat.historyLimit` (डिफ़ॉल्ट 50) का उपयोग करता है; `0` इसे अक्षम करता है।
    - जब Gateway ने मूल संदेशों को देखा हो, तब उत्तर/उद्धरण/अग्रेषण का पूरक संदर्भ एक चयनित वार्तालाप संदर्भ विंडो में सामान्यीकृत होता है; देखे गए संदेशों का कैश OpenClaw SQLite Plugin स्थिति में रहता है, और `openclaw doctor --fix` पुराने साइडकार आयात करता है। Telegram प्रत्येक अपडेट में केवल एक उथला `reply_to_message` शामिल करता है, इसलिए कैश से पुरानी शृंखलाएँ उस पेलोड तक सीमित होती हैं।
    - Telegram की अनुमति-सूचियाँ मुख्य रूप से यह नियंत्रित करती हैं कि एजेंट को कौन ट्रिगर कर सकता है, वे पूरक संदर्भ को पूर्णतः संपादित करने की सीमा नहीं हैं।
    - DM इतिहास: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`।

    CLI और संदेश-टूल के प्रेषण लक्ष्य संख्यात्मक चैट ID, उपयोगकर्ता नाम या फ़ोरम विषय लक्ष्य स्वीकार करते हैं:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    पोल `openclaw message poll` का उपयोग करते हैं और फ़ोरम विषयों का समर्थन करते हैं:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    केवल Telegram के पोल फ़्लैग: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (या एक `:topic:` लक्ष्य)। `--poll-option` 2-12 बार दोहराता है (Telegram की विकल्प सीमा)।

    Telegram प्रेषण इनलाइन कीबोर्ड के लिए `buttons` ब्लॉक के साथ `--presentation` का भी समर्थन करता है (जब `channels.telegram.capabilities.inlineButtons` इसकी अनुमति देता है), उस चैट में बॉट के पास पिन करने की अनुमति होने पर पिन की गई डिलीवरी का अनुरोध करने के लिए `--pin` या `--delivery '{"pin":true}'`, और आउटबाउंड छवियों, GIF तथा वीडियो को संपीड़ित/एनिमेटेड/वीडियो अपलोड के बजाय दस्तावेज़ों के रूप में भेजने के लिए `--force-document`।

    कार्रवाई नियंत्रण: `channels.telegram.actions.sendMessage=false` पोल सहित सभी आउटबाउंड संदेशों को अक्षम करता है; `channels.telegram.actions.poll=false` नियमित प्रेषण सक्षम रखते हुए पोल निर्माण को अक्षम करता है।

  </Accordion>

  <Accordion title="Telegram में निष्पादन अनुमोदन">
    Telegram अनुमोदक के DM में निष्पादन अनुमोदन का समर्थन करता है और वैकल्पिक रूप से मूल चैट या विषय में प्रॉम्प्ट पोस्ट कर सकता है। अनुमोदक संख्यात्मक Telegram उपयोगकर्ता ID होने चाहिए।

    - `channels.telegram.execApprovals.enabled` (`"auto"` कम-से-कम एक अनुमोदक के समाधान योग्य होने पर सक्षम करता है)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` से संख्यात्मक स्वामी ID पर वापस जाता है)
    - `channels.telegram.execApprovals.target`: `dm` (डिफ़ॉल्ट) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, और `defaultTo` यह नियंत्रित करते हैं कि बॉट से कौन बात कर सकता है और वह सामान्य उत्तर कहाँ भेजता है — वे किसी व्यक्ति को निष्पादन अनुमोदक नहीं बनाते। जब अभी तक कोई कमांड स्वामी मौजूद न हो, तो पहला अनुमोदित DM युग्मन `commands.ownerAllowFrom` को प्रारंभ करता है, जिससे एक-स्वामी वाले सेटअप में `execApprovals.approvers` के अंतर्गत ID दोहराने की आवश्यकता नहीं होती।

    चैनल डिलीवरी चैट में कमांड टेक्स्ट दिखाती है; `channel` या `both` को केवल विश्वसनीय समूहों/विषयों में सक्षम करें। जब प्रॉम्प्ट किसी फ़ोरम विषय में पहुँचता है, तो OpenClaw अनुमोदन प्रॉम्प्ट और अनुवर्ती कार्रवाई के लिए विषय बनाए रखता है। निष्पादन अनुमोदन डिफ़ॉल्ट रूप से 30 मिनट बाद समाप्त हो जाते हैं।

    इनलाइन अनुमोदन बटनों के लिए यह भी आवश्यक है कि `channels.telegram.capabilities.inlineButtons` लक्षित सतह (`dm`, `group`, या `all`) की अनुमति दे। `plugin:` से आरंभ होने वाली अनुमोदन ID Plugin अनुमोदनों के माध्यम से हल होती हैं; अन्य पहले निष्पादन अनुमोदनों के माध्यम से हल होती हैं।

    [निष्पादन अनुमोदन](/hi/tools/exec-approvals) देखें।

  </Accordion>
</AccordionGroup>

## त्रुटि उत्तर नियंत्रण

जब एजेंट को डिलीवरी या प्रदाता त्रुटि मिलती है, तो त्रुटि नीति नियंत्रित करती है कि त्रुटि संदेश Telegram चैट तक पहुँचते हैं या नहीं:

| कुंजी                             | मान                     | डिफ़ॉल्ट  | विवरण                                                                                                                                                                |
| ------------------------------- | -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy` | `always`, `once`, `silent` | `always` | `always` प्रत्येक त्रुटि संदेश चैट में भेजता है। `once` प्रत्येक अद्वितीय त्रुटि संदेश को अंतर्निहित कूलडाउन विंडो में एक बार भेजता है। `silent` चैट में कभी त्रुटि संदेश नहीं भेजता। |

प्रति-खाता, प्रति-समूह और प्रति-विषय ओवरराइड समर्थित हैं (अन्य Telegram कॉन्फ़िगरेशन कुंजियों जैसी ही इनहेरिटेंस)।

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // इस समूह में त्रुटियाँ दबाएँ
        },
      },
    },
  },
}
```

## समस्या निवारण

<AccordionGroup>
  <Accordion title="बॉट उल्लेख के बिना भेजे गए समूह संदेशों का उत्तर नहीं देता">

    - यदि `requireMention=false`, तो Telegram गोपनीयता मोड को पूर्ण दृश्यता की अनुमति देनी चाहिए: BotFather `/setprivacy` -> Disable, फिर बॉट को समूह से हटाकर दोबारा जोड़ें।
    - जब कॉन्फ़िगरेशन उल्लेख के बिना समूह संदेशों की अपेक्षा करता है, तो `openclaw channels status` चेतावनी देता है।
    - `openclaw channels status --probe` स्पष्ट संख्यात्मक समूह ID की जाँच करता है; वाइल्डकार्ड `"*"` की सदस्यता जाँची नहीं जा सकती।
    - त्वरित सत्र परीक्षण: `/activation always`।

  </Accordion>

  <Accordion title="बॉट को समूह संदेश बिल्कुल दिखाई नहीं देते">

    - जब `channels.telegram.groups` मौजूद हो, तो समूह सूचीबद्ध होना चाहिए (या `"*"` शामिल करें)।
    - समूह में बॉट की सदस्यता सत्यापित करें।
    - छोड़े जाने के कारणों के लिए `openclaw logs --follow` की समीक्षा करें।

  </Accordion>

  <Accordion title="कमांड आंशिक रूप से काम करते हैं या बिल्कुल नहीं करते">

    - अपनी प्रेषक पहचान को अधिकृत करें (युग्मन और/या संख्यात्मक `allowFrom`); समूह नीति `open` होने पर भी कमांड प्राधिकरण लागू होता है।
    - `BOT_COMMANDS_TOO_MUCH` के साथ `setMyCommands failed` का अर्थ है कि मूल मेन्यू में बहुत अधिक प्रविष्टियाँ हैं; Plugin/Skill/कस्टम कमांड कम करें या मूल मेन्यू अक्षम करें।
    - `deleteMyCommands` / `setMyCommands` स्टार्टअप कॉल और `sendChatAction` टाइपिंग कॉल सीमित हैं तथा अनुरोध टाइमआउट पर Telegram के ट्रांसपोर्ट फ़ॉलबैक के माध्यम से एक बार पुनः प्रयास करते हैं। लगातार नेटवर्क/फ़ेच त्रुटियों का सामान्यतः अर्थ है कि `api.telegram.org` तक DNS/HTTPS पहुँच योग्य नहीं है।

  </Accordion>

  <Accordion title="स्टार्टअप अनधिकृत टोकन की रिपोर्ट करता है">

    - `getMe returned 401` कॉन्फ़िगर किए गए बॉट टोकन के लिए Telegram प्रमाणीकरण विफलता है। BotFather में टोकन को दोबारा कॉपी या पुनः उत्पन्न करें, फिर `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken`, या `TELEGRAM_BOT_TOKEN` (डिफ़ॉल्ट खाता) अपडेट करें।
    - स्टार्टअप के दौरान `deleteWebhook 401 Unauthorized` भी प्रमाणीकरण विफलता है; इसे "कोई Webhook मौजूद नहीं है" मानने से उसी अमान्य टोकन की विफलता केवल बाद की API कॉल तक टलेगी।

  </Accordion>

  <Accordion title="पोलिंग या नेटवर्क अस्थिरता">

    - यदि `AbortSignal` प्रकार मेल नहीं खाते, तो कस्टम फ़ेच/प्रॉक्सी के साथ Node 22+ तत्काल निरस्तीकरण व्यवहार ट्रिगर कर सकता है।
    - कुछ होस्ट `api.telegram.org` को पहले IPv6 में रिज़ॉल्व करते हैं; खराब IPv6 इग्रेस रुक-रुककर API विफलताएँ उत्पन्न करता है।
    - `TypeError: fetch failed` या `Network request for 'getUpdates' failed!` वाले लॉग पर पुनर्प्राप्ति योग्य नेटवर्क त्रुटियों के रूप में पुनः प्रयास किया जाता है।
    - पोलिंग स्टार्टअप के दौरान OpenClaw grammY के लिए सफल स्टार्टअप `getMe` प्रोब का पुनः उपयोग करता है, ताकि रनर को पहले `getUpdates` से पहले दूसरे `getMe` की आवश्यकता न हो।
    - यदि पोलिंग स्टार्टअप के दौरान `deleteWebhook` क्षणिक नेटवर्क त्रुटि के कारण विफल होता है, तो OpenClaw एक और प्री-पोल कंट्रोल-प्लेन कॉल करने के बजाय लॉन्ग पोलिंग में आगे बढ़ता है। तब भी सक्रिय Webhook `getUpdates` टकराव के रूप में सामने आता है; OpenClaw ट्रांसपोर्ट को पुनर्निर्मित करता है और Webhook सफ़ाई का पुनः प्रयास करता है।
    - लॉग में `Polling stall detected` का अर्थ है कि डिफ़ॉल्ट रूप से 120 सेकंड तक लॉन्ग-पोल सक्रियता पूरी न होने के बाद OpenClaw पोलिंग पुनः आरंभ करता है और ट्रांसपोर्ट को पुनर्निर्मित करता है।
    - `openclaw channels status --probe` और `openclaw doctor` तब चेतावनी देते हैं जब कोई चालू पोलिंग खाता स्टार्टअप ग्रेस के बाद `getUpdates` पूरा नहीं कर पाया हो, कोई चालू Webhook खाता स्टार्टअप ग्रेस के बाद `setWebhook` पूरा नहीं कर पाया हो, या अंतिम सफल पोलिंग ट्रांसपोर्ट गतिविधि पुरानी हो।
    - Telegram Bot API ट्रांसपोर्ट के लिए प्रक्रिया के प्रॉक्सी परिवेश का सम्मान करता है: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, और छोटे अक्षरों वाले संस्करण। `NO_PROXY` / `no_proxy` फिर भी `api.telegram.org` को बायपास कर सकते हैं।
    - यदि किसी सेवा परिवेश के लिए `OPENCLAW_PROXY_URL` सेट है और कोई मानक प्रॉक्सी परिवेश मौजूद नहीं है, तो Telegram Bot API ट्रांसपोर्ट के लिए भी उस URL का उपयोग करता है।
    - अस्थिर सीधे इग्रेस/TLS वाले VPS होस्ट पर Telegram API कॉल को प्रॉक्सी के माध्यम से रूट करें:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ डिफ़ॉल्ट रूप से `autoSelectFamily=true` का उपयोग करता है (WSL2 को छोड़कर)। Telegram DNS परिणाम क्रम पहले `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, फिर `channels.telegram.network.dnsResultOrder`, फिर प्रक्रिया के डिफ़ॉल्ट (उदाहरण के लिए `NODE_OPTIONS=--dns-result-order=ipv4first`) का सम्मान करता है; यदि इनमें से कोई लागू न हो, तो Node 22+ पर `ipv4first` पर वापस जाता है।
    - WSL2 पर, या जब केवल-IPv4 व्यवहार बेहतर काम करता हो, तो फ़ैमिली चयन बाध्य करें:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 बेंचमार्क-रेंज उत्तर (`198.18.0.0/15`) Telegram मीडिया डाउनलोड के लिए डिफ़ॉल्ट रूप से पहले से अनुमत हैं। यदि कोई विश्वसनीय नकली-IP या पारदर्शी प्रॉक्सी मीडिया डाउनलोड के दौरान `api.telegram.org` को किसी अन्य निजी/आंतरिक/विशेष-उपयोग पते में पुनर्लेखित करता है, तो केवल Telegram वाले बायपास को स्वीकार करें:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - यही वैकल्पिक स्वीकृति प्रति खाते `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` पर उपलब्ध है।
    - यदि आपका प्रॉक्सी Telegram मीडिया होस्ट को `198.18.x.x` में रिज़ॉल्व करता है, तो पहले खतरनाक फ़्लैग बंद रखें — वह रेंज डिफ़ॉल्ट रूप से पहले से अनुमत है।

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` Telegram मीडिया SSRF सुरक्षा को कमजोर करता है। इसका उपयोग केवल विश्वसनीय ऑपरेटर-नियंत्रित प्रॉक्सी परिवेशों (Clash, Mihomo, Surge नकली-IP रूटिंग) के लिए करें, जो RFC 2544 बेंचमार्क रेंज के बाहर निजी या विशेष-उपयोग उत्तर उत्पन्न करते हैं। सामान्य सार्वजनिक इंटरनेट Telegram पहुँच के लिए इसे बंद रखें।
    </Warning>

    - अस्थायी परिवेश ओवरराइड: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`।
    - DNS उत्तर सत्यापित करें:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

अधिक सहायता: [चैनल समस्या निवारण](/hi/channels/troubleshooting)।

## कॉन्फ़िगरेशन संदर्भ

प्राथमिक संदर्भ: [कॉन्फ़िगरेशन संदर्भ - Telegram](/hi/gateway/config-channels#telegram)।

<Accordion title="उच्च-संकेत Telegram फ़ील्ड">

- स्टार्टअप/प्रमाणीकरण: `enabled`, `botToken`, `tokenFile` (एक सामान्य फ़ाइल होनी चाहिए; सिमलिंक अस्वीकार किए जाते हैं), `accounts.*`
- पहुँच नियंत्रण: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, शीर्ष-स्तरीय `bindings[]` (`type: "acp"`)
- विषय डिफ़ॉल्ट: `groups.<chatId>.topics."*"` बेमेल फ़ोरम विषयों पर लागू होता है; सटीक विषय ID इसे ओवरराइड करते हैं
- निष्पादन अनुमोदन: `execApprovals`, `accounts.*.execApprovals`
- कमांड/मेन्यू: `commands.native`, `commands.nativeSkills`, `customCommands`
- थ्रेडिंग/उत्तर: `replyToMode`, `threadBindings`
- स्ट्रीमिंग: `streaming` (मोड `off | partial | block | progress`), `streaming.preview.toolProgress`
- फ़ॉर्मैटिंग/डिलीवरी: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- मीडिया/नेटवर्क: `mediaMaxMb`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- कस्टम API रूट: `apiRoot` (केवल Bot API रूट; `/bot<TOKEN>` शामिल न करें), `trustedLocalFileRoots` (स्वयं होस्ट किए गए Bot API के निरपेक्ष `file_path` रूट)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- क्रियाएँ/क्षमताएँ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- प्रतिक्रियाएँ: `reactionNotifications`, `reactionLevel`
- त्रुटियाँ: `errorPolicy`, `silentErrorReplies`
- लेखन/इतिहास: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
एकाधिक खातों की प्राथमिकता: दो या अधिक खाता ID कॉन्फ़िगर होने पर, डिफ़ॉल्ट रूटिंग को स्पष्ट बनाने के लिए `channels.telegram.defaultAccount` सेट करें (या `channels.telegram.accounts.default` शामिल करें)। अन्यथा OpenClaw पहले सामान्यीकृत खाता ID पर वापस जाता है और `openclaw doctor` चेतावनी देता है। नामित खातों को `channels.telegram.allowFrom` / `groupAllowFrom` विरासत में मिलते हैं, लेकिन `accounts.default.*` मान नहीं।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    Telegram उपयोगकर्ता को Gateway से पेयर करें।
  </Card>
  <Card title="समूह" icon="users" href="/hi/channels/groups">
    समूह और विषय की अनुमति-सूची का व्यवहार।
  </Card>
  <Card title="चैनल रूटिंग" icon="route" href="/hi/channels/channel-routing">
    आने वाले संदेशों को एजेंटों तक रूट करें।
  </Card>
  <Card title="सुरक्षा" icon="shield" href="/hi/gateway/security">
    खतरा मॉडल और सुदृढ़ीकरण।
  </Card>
  <Card title="बहु-एजेंट रूटिंग" icon="sitemap" href="/hi/concepts/multi-agent">
    समूहों और विषयों को एजेंटों से मैप करें।
  </Card>
  <Card title="समस्या निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल निदान।
  </Card>
</CardGroup>
