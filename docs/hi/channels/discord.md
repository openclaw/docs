---
read_when:
    - Discord चैनल की सुविधाओं पर काम करना
summary: Discord बॉट सेटअप, कॉन्फ़िगरेशन कुंजियाँ, कॉम्पोनेंट, वॉइस और समस्या निवारण
title: Discord
x-i18n:
    generated_at: "2026-07-19T07:56:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 28bf01ed58a342c6ac549280ced7a212d8dff2ef6fc00c40f5c9b0b62cc1519f
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw आधिकारिक Discord gateway के माध्यम से एक बॉट के रूप में Discord से कनेक्ट होता है। DMs और गिल्ड चैनल समर्थित हैं।

<CardGroup cols={3}>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    Discord DMs डिफ़ॉल्ट रूप से पेयरिंग मोड का उपयोग करते हैं।
  </Card>
  <Card title="स्लैश कमांड" icon="terminal" href="/hi/tools/slash-commands">
    नेटिव कमांड व्यवहार और कमांड कैटलॉग।
  </Card>
  <Card title="चैनल समस्या निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल निदान और सुधार प्रवाह।
  </Card>
</CardGroup>

## त्वरित सेटअप

बॉट के साथ एक Discord एप्लिकेशन बनाएँ, बॉट को अपने सर्वर में जोड़ें और उसे OpenClaw के साथ पेयर करें। यदि संभव हो, तो निजी सर्वर का उपयोग करें; आवश्यकता होने पर पहले [एक सर्वर बनाएँ](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**)।

<Steps>
  <Step title="Discord एप्लिकेशन और बॉट बनाएँ">
    [Discord Developer Portal](https://discord.com/developers/applications) में **New Application** पर क्लिक करें और इसे कोई नाम दें (उदाहरण के लिए, "OpenClaw")।

    साइडबार में **Bot** खोलें और **Username** को अपने एजेंट के नाम पर सेट करें।

  </Step>

  <Step title="विशेषाधिकार प्राप्त इंटेंट सक्षम करें">
    **Bot** पृष्ठ पर ही, **Privileged Gateway Intents** के अंतर्गत इन्हें सक्षम करें:

    - **Message Content Intent** (आवश्यक)
    - **Server Members Intent** (अनुशंसित; भूमिका अनुमतिसूचियों, नाम-से-ID मिलान और चैनल-दर्शक पहुँच समूहों के लिए आवश्यक)
    - **Presence Intent** (वैकल्पिक; केवल उपस्थिति अपडेट के लिए)

  </Step>

  <Step title="अपना बॉट टोकन कॉपी करें">
    **Bot** पृष्ठ पर **Reset Token** पर क्लिक करें और टोकन कॉपी करें।

    <Note>
    नाम के विपरीत, यह आपका पहला टोकन जनरेट करता है—कुछ भी "रीसेट" नहीं किया जा रहा है।
    </Note>

  </Step>

  <Step title="आमंत्रण URL जनरेट करें और बॉट को अपने सर्वर में जोड़ें">
    साइडबार में **OAuth2** खोलें। **OAuth2 URL Generator** में ये स्कोप सक्षम करें:

    - `bot`
    - `applications.commands`

    दिखाई देने वाले **Bot Permissions** अनुभाग में कम-से-कम इन्हें सक्षम करें:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (वैकल्पिक)

    यह सामान्य टेक्स्ट चैनलों के लिए आधारभूत सेटिंग है। यदि बॉट थ्रेड में पोस्ट करेगा—इसमें वे फ़ोरम या मीडिया चैनल वर्कफ़्लो भी शामिल हैं जो थ्रेड बनाते या जारी रखते हैं—तो **Send Messages in Threads** भी सक्षम करें।

    जनरेट किया गया URL कॉपी करें, उसे ब्राउज़र में खोलें, अपना सर्वर चुनें और **Continue** पर क्लिक करें। अब बॉट आपके सर्वर में दिखाई देना चाहिए।

  </Step>

  <Step title="Developer Mode सक्षम करें और अपनी IDs एकत्र करें">
    Discord ऐप में Developer Mode सक्षम करें, ताकि आप IDs कॉपी कर सकें:

    1. **User Settings** (गियर आइकन) → **Developer** → **Developer Mode** को चालू करें
       *(मोबाइल पर: **App Settings** → **Advanced**)*
    2. अपने **सर्वर आइकन** पर राइट-क्लिक करें → **Copy Server ID**
    3. अपने **अवतार** पर राइट-क्लिक करें → **Copy User ID**

    Server ID और User ID को अपने बॉट टोकन के साथ रखें; अगले चरण में इन तीनों की आवश्यकता होगी।

  </Step>

  <Step title="सर्वर सदस्यों से DMs की अनुमति दें">
    पेयरिंग के काम करने के लिए Discord को बॉट द्वारा आपको DM भेजने की अनुमति देनी होगी। अपने **सर्वर आइकन** पर राइट-क्लिक करें → **Privacy Settings** → **Direct Messages** को चालू करें।

    यदि आप OpenClaw के साथ Discord DMs का उपयोग करते हैं, तो इसे चालू रखें। यदि आप केवल गिल्ड चैनलों का उपयोग करते हैं, तो पेयरिंग के बाद इसे अक्षम कर सकते हैं।

  </Step>

  <Step title="अपना बॉट टोकन सुरक्षित रूप से सेट करें (इसे चैट में न भेजें)">
    बॉट टोकन एक गोपनीय सीक्रेट है। अपने एजेंट को संदेश भेजने से पहले इसे OpenClaw चलाने वाली मशीन पर सेट करें:

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    यदि OpenClaw पहले से बैकग्राउंड सेवा के रूप में चल रहा है, तो उसे OpenClaw Mac ऐप के माध्यम से या `openclaw gateway run` प्रक्रिया को रोककर और पुनः आरंभ करके रीस्टार्ट करें।
    प्रबंधित सेवा इंस्टॉलेशन के लिए, ऐसी शेल से `openclaw gateway install` चलाएँ जहाँ `DISCORD_BOT_TOKEN` सेट हो, या वेरिएबल को `~/.openclaw/.env` में संग्रहीत करें, ताकि सेवा रीस्टार्ट के बाद env SecretRef को रिज़ॉल्व कर सके।
    यदि आपका होस्ट Discord के स्टार्टअप एप्लिकेशन लुकअप द्वारा अवरुद्ध या दर-सीमित है, तो Developer Portal से एप्लिकेशन/क्लाइंट ID सेट करें, ताकि स्टार्टअप उस REST कॉल को छोड़ सके: डिफ़ॉल्ट अकाउंट के लिए `channels.discord.applicationId`, या प्रत्येक बॉट के लिए `channels.discord.accounts.<accountId>.applicationId`।

  </Step>

  <Step title="OpenClaw कॉन्फ़िगर करें और पेयर करें">

    <Tabs>
      <Tab title="अपने एजेंट से कहें">
        किसी मौजूदा चैनल (उदाहरण के लिए Telegram) पर अपने OpenClaw एजेंट से चैट करें और उसे निर्देश दें। यदि Discord आपका पहला चैनल है, तो इसके बजाय CLI / कॉन्फ़िगरेशन टैब का उपयोग करें।

        > "मैंने कॉन्फ़िगरेशन में अपना Discord बॉट टोकन पहले ही सेट कर दिया है। कृपया User ID `<user_id>` और Server ID `<server_id>` के साथ Discord सेटअप पूरा करें।"
      </Tab>
      <Tab title="CLI / कॉन्फ़िगरेशन">
        फ़ाइल-आधारित कॉन्फ़िगरेशन:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        डिफ़ॉल्ट अकाउंट के लिए env फ़ॉलबैक:

```bash
DISCORD_BOT_TOKEN=...
```

        स्क्रिप्टेड या रिमोट सेटअप के लिए, `openclaw config patch --file ./discord.patch.json5 --dry-run` के साथ वही JSON5 ब्लॉक लिखें, फिर `--dry-run` के बिना दोबारा चलाएँ। प्लेनटेक्स्ट `token` स्ट्रिंग भी काम करती हैं और env/file/exec प्रोवाइडर में `channels.discord.token` के लिए SecretRef मान समर्थित हैं। [सीक्रेट प्रबंधन](/hi/gateway/secrets) देखें।

        एकाधिक Discord बॉट के लिए, प्रत्येक बॉट का टोकन और एप्लिकेशन ID उसके अकाउंट के अंतर्गत रखें। शीर्ष-स्तरीय `channels.discord.applicationId` अकाउंट द्वारा इनहेरिट किया जाता है, इसलिए उसे वहाँ केवल तभी सेट करें जब प्रत्येक अकाउंट समान एप्लिकेशन ID का उपयोग करता हो।

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="पहली DM पेयरिंग स्वीकृत करें">
    Gateway चलने के बाद Discord में अपने बॉट को DM भेजें। वह पेयरिंग कोड के साथ उत्तर देगा।

    <Tabs>
      <Tab title="अपने एजेंट से कहें">
        अपने मौजूदा चैनल पर अपने एजेंट को पेयरिंग कोड भेजें:

        > "इस Discord पेयरिंग कोड को स्वीकृत करें: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    पेयरिंग कोड 1 घंटे बाद समाप्त हो जाते हैं। स्वीकृति के बाद Discord DM में अपने एजेंट से चैट करें।

  </Step>
</Steps>

<Note>
टोकन रिज़ॉल्यूशन अकाउंट-सजग है। कॉन्फ़िगरेशन टोकन मानों को env फ़ॉलबैक पर प्राथमिकता मिलती है और `DISCORD_BOT_TOKEN` का उपयोग केवल डिफ़ॉल्ट अकाउंट के लिए होता है।
यदि दो सक्षम Discord अकाउंट एक ही बॉट टोकन पर रिज़ॉल्व होते हैं, तो OpenClaw उस टोकन के लिए केवल एक Gateway मॉनिटर शुरू करता है: कॉन्फ़िगरेशन से प्राप्त टोकन को env फ़ॉलबैक पर प्राथमिकता मिलती है; अन्यथा पहला सक्षम अकाउंट चुना जाता है और डुप्लिकेट अकाउंट को `duplicate bot token` कारण के साथ अक्षम रिपोर्ट किया जाता है।
उन्नत आउटबाउंड कॉल (मैसेज टूल/चैनल कार्रवाइयों) के लिए, प्रत्येक कॉल का स्पष्ट `token` उसी कॉल के लिए उपयोग किया जाता है। यह भेजने और पढ़ने/जाँच-शैली की कार्रवाइयों (read/search/fetch/thread/pins/permissions) पर लागू होता है। अकाउंट नीति/पुनः प्रयास सेटिंग अभी भी सक्रिय रनटाइम स्नैपशॉट में चयनित अकाउंट से आती हैं।
</Note>

## अनुशंसित: गिल्ड वर्कस्पेस सेट करें

DMs के काम करने के बाद आप अपने सर्वर को पूर्ण वर्कस्पेस में बदल सकते हैं, जहाँ प्रत्येक चैनल को अपने संदर्भ वाला अलग एजेंट सत्र मिलता है। ऐसे निजी सर्वर के लिए अनुशंसित है जहाँ केवल आप और आपका बॉट हों।

<Steps>
  <Step title="अपने सर्वर को गिल्ड अनुमतिसूची में जोड़ें">
    इससे आपका एजेंट केवल DMs में ही नहीं, बल्कि आपके सर्वर के किसी भी चैनल में उत्तर दे सकता है।

    <Tabs>
      <Tab title="अपने एजेंट से कहें">
        > "मेरी Discord Server ID `<server_id>` को गिल्ड अनुमतिसूची में जोड़ें"
      </Tab>
      <Tab title="कॉन्फ़िगरेशन">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="@mention के बिना उत्तरों की अनुमति दें">
    डिफ़ॉल्ट रूप से एजेंट गिल्ड चैनलों में केवल तभी उत्तर देता है जब उसे @mention किया जाता है। निजी सर्वर पर संभवतः आप चाहेंगे कि वह प्रत्येक संदेश का उत्तर दे।

    गिल्ड चैनलों में सामान्य उत्तर डिफ़ॉल्ट रूप से अपने-आप पोस्ट होते हैं। साझा और हमेशा सक्रिय रहने वाले रूम के लिए `messages.groupChat.visibleReplies: "message_tool"` को चुनें, ताकि एजेंट चुपचाप मौजूद रह सके और केवल तभी पोस्ट करे जब वह तय करे कि चैनल में उत्तर उपयोगी होगा। यह GPT-5.6 Sol जैसे नवीनतम पीढ़ी के, टूल-विश्वसनीय मॉडल के साथ सबसे अच्छी तरह काम करता है। जब तक टूल संदेश न भेजे, परिवेशी रूम इवेंट शांत रहते हैं। पूर्ण लर्क-मोड कॉन्फ़िगरेशन के लिए [परिवेशी रूम इवेंट](/hi/channels/ambient-room-events) देखें।

    यदि Discord टाइपिंग दिखाता है और लॉग टोकन उपयोग दिखाते हैं, लेकिन कोई संदेश पोस्ट नहीं होता, तो जाँचें कि क्या टर्न को परिवेशी रूम इवेंट के रूप में कॉन्फ़िगर किया गया था या मैसेज-टूल से दृश्यमान उत्तरों का विकल्प चुना गया था।

    <Tabs>
      <Tab title="अपने एजेंट से कहें">
        > "मेरे एजेंट को इस सर्वर पर @mention किए बिना उत्तर देने की अनुमति दें"
      </Tab>
      <Tab title="कॉन्फ़िगरेशन">
        अपने गिल्ड कॉन्फ़िगरेशन में `requireMention: false` सेट करें:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        दृश्यमान समूह/चैनल उत्तरों के लिए मैसेज-टूल से भेजना आवश्यक बनाने हेतु `messages.groupChat.visibleReplies: "message_tool"` सेट करें।

      </Tab>
    </Tabs>

  </Step>

  <Step title="गिल्ड चैनलों में मेमोरी की योजना बनाएँ">
    दीर्घकालिक मेमोरी (MEMORY.md) केवल DM सत्रों में अपने-आप लोड होती है; गिल्ड चैनल इसे लोड नहीं करते।

    <Tabs>
      <Tab title="अपने एजेंट से कहें">
        > "जब मैं Discord चैनलों में प्रश्न पूछूँ, तो MEMORY.md से दीर्घकालिक संदर्भ की आवश्यकता होने पर memory_search या memory_get का उपयोग करें।"
      </Tab>
      <Tab title="मैन्युअल">
        प्रत्येक चैनल में साझा संदर्भ के लिए स्थायी निर्देश `AGENTS.md` या `USER.md` में रखें (प्रत्येक सत्र में इंजेक्ट किए जाते हैं)। दीर्घकालिक नोट्स `MEMORY.md` में रखें और आवश्यकता होने पर मेमोरी टूल से उन्हें एक्सेस करें।
      </Tab>
    </Tabs>

  </Step>
</Steps>

अब चैनल बनाएँ और चैट करना शुरू करें। एजेंट चैनल का नाम देखता है और प्रत्येक चैनल एक पृथक सत्र होता है—अपने वर्कफ़्लो के अनुरूप `#coding`, `#home`, `#research` या कोई अन्य चैनल बनाएँ।

## रनटाइम मॉडल

- Gateway Discord कनेक्शन का स्वामी है।
- उत्तर रूटिंग नियतात्मक है: Discord से प्राप्त संदेशों के उत्तर Discord पर ही वापस जाते हैं।
- Discord गिल्ड/चैनल मेटाडेटा को मॉडल प्रॉम्प्ट में अविश्वसनीय संदर्भ के रूप में जोड़ा जाता है, न कि उपयोगकर्ता को दिखाई देने वाले उत्तर प्रीफ़िक्स के रूप में। यदि कोई मॉडल उस एनवेलप को वापस कॉपी करता है, तो OpenClaw आउटबाउंड उत्तरों और भविष्य के रीप्ले संदर्भ से कॉपी किया गया मेटाडेटा हटा देता है।
- डिफ़ॉल्ट रूप से (`session.dmScope=main`), प्रत्यक्ष चैट एजेंट का मुख्य सत्र (`agent:main:main`) साझा करती हैं।
- गिल्ड चैनल पृथक सत्र कुंजियाँ हैं (`agent:<agentId>:discord:channel:<channelId>`)।
- समूह DMs डिफ़ॉल्ट रूप से अनदेखे किए जाते हैं (`channels.discord.dm.groupEnabled=false`)।
- नेटिव स्लैश कमांड पृथक कमांड सत्रों (`agent:<agentId>:discord:slash:<userId>`) में चलते हैं, जबकि रूट किए गए वार्तालाप सत्र में `CommandTargetSessionKey` भी बनाए रखते हैं।
- Discord पर केवल-टेक्स्ट वाले cron/heartbeat घोषणा वितरण को अंतिम सहायक-दृश्यमान उत्तर में समेकित करके एक बार भेजा जाता है। जब एजेंट एकाधिक डिलीवर करने योग्य पेलोड उत्सर्जित करता है, तब मीडिया और संरचित कॉम्पोनेंट पेलोड बहु-संदेश बने रहते हैं।

## फ़ोरम चैनल

Discord फ़ोरम और मीडिया चैनल केवल थ्रेड पोस्ट स्वीकार करते हैं। OpenClaw उन्हें बनाने के दो तरीके समर्थित करता है:

- थ्रेड अपने-आप बनाने के लिए फ़ोरम पैरेंट (`channel:<forumId>`) को संदेश भेजें। थ्रेड का शीर्षक संदेश की पहली गैर-रिक्त पंक्ति होता है (Discord की 100-वर्ण वाली थ्रेड-नाम सीमा तक छोटा किया जाता है)।
- सीधे थ्रेड बनाने के लिए `openclaw message thread create` का उपयोग करें। फ़ोरम चैनलों के लिए `--message-id` पास न करें।

थ्रेड बनाने के लिए फ़ोरम पैरेंट को भेजें:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "विषय का शीर्षक\nपोस्ट का मुख्य भाग"
```

फ़ोरम थ्रेड स्पष्ट रूप से बनाएँ:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "विषय का शीर्षक" --message "पोस्ट का मुख्य भाग"
```

फ़ोरम पैरेंट Discord कॉम्पोनेंट स्वीकार नहीं करते। यदि आपको कॉम्पोनेंट चाहिए, तो सीधे थ्रेड (`channel:<threadId>`) को भेजें।

## इंटरैक्टिव कॉम्पोनेंट

OpenClaw एजेंट संदेशों के लिए Discord कॉम्पोनेंट v2 कंटेनर समर्थित करता है। `components` पेलोड के साथ संदेश टूल का उपयोग करें। इंटरैक्शन परिणाम सामान्य इनबाउंड संदेशों के रूप में एजेंट को वापस रूट होते हैं और मौजूदा Discord `replyToMode` सेटिंग्स का पालन करते हैं।

समर्थित ब्लॉक:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- ऐक्शन पंक्तियाँ अधिकतम 5 बटन या एक सिंगल सिलेक्ट मेन्यू की अनुमति देती हैं
- सिलेक्ट प्रकार: `string`, `user`, `role`, `mentionable`, `channel`

डिफ़ॉल्ट रूप से, कॉम्पोनेंट एक बार उपयोग किए जा सकते हैं। बटन, सिलेक्ट और फ़ॉर्म की समय-सीमा समाप्त होने तक उन्हें कई बार उपयोग करने की अनुमति देने के लिए `components.reusable=true` सेट करें।

किसी बटन को कौन क्लिक कर सकता है, इसे सीमित करने के लिए उस बटन पर `allowedUsers` सेट करें (Discord उपयोगकर्ता ID, टैग या `*`)। मेल न खाने वाले उपयोगकर्ताओं को एक अल्पकालिक अस्वीकृति मिलती है।

कॉम्पोनेंट कॉलबैक डिफ़ॉल्ट रूप से 30 मिनट बाद समाप्त हो जाते हैं। डिफ़ॉल्ट खाते के लिए कॉलबैक रजिस्ट्री का जीवनकाल बदलने हेतु `channels.discord.agentComponents.ttlMs` या प्रत्येक खाते के लिए `channels.discord.accounts.<accountId>.agentComponents.ttlMs` सेट करें। मान मिलीसेकंड में है, धनात्मक पूर्णांक होना चाहिए और `86400000` (24 घंटे) तक सीमित है। लंबे TTL उन समीक्षा/अनुमोदन वर्कफ़्लो के लिए उपयुक्त हैं जिनमें बटनों को उपयोग योग्य बनाए रखना आवश्यक है, लेकिन वे उस अवधि को बढ़ाते हैं जिसमें कोई पुराना Discord संदेश अब भी ऐक्शन ट्रिगर कर सकता है। आवश्यकतानुसार सबसे छोटा TTL चुनें और जब पुराने कॉलबैक अप्रत्याशित हों, तब डिफ़ॉल्ट बनाए रखें।

`/model` और `/models` स्लैश कमांड, प्रोवाइडर, मॉडल और संगत रनटाइम ड्रॉपडाउन के साथ-साथ Submit चरण वाला इंटरैक्टिव मॉडल पिकर खोलते हैं। `/models add` अप्रचलित है और चैट से मॉडल पंजीकृत करने के बजाय अप्रचलन संदेश लौटाता है। पिकर का उत्तर अल्पकालिक होता है और केवल उसे शुरू करने वाला उपयोगकर्ता ही इसका उपयोग कर सकता है। Discord सिलेक्ट मेन्यू 25 विकल्पों तक सीमित हैं, इसलिए जब आप चाहते हैं कि पिकर केवल `openai` या `vllm` जैसे चुने गए प्रोवाइडरों के लिए गतिशील रूप से खोजे गए मॉडल दिखाए, तो `agents.defaults.modelPolicy.allow` में `provider/*` प्रविष्टियाँ जोड़ें।

फ़ाइल अटैचमेंट:

- `file` ब्लॉक को किसी अटैचमेंट संदर्भ (`attachment://<filename>`) की ओर इंगित करना चाहिए
- अटैचमेंट को `media`/`path`/`filePath` (एक फ़ाइल) के माध्यम से दें; अनेक फ़ाइलों के लिए `media-gallery` का उपयोग करें
- जब अपलोड नाम का अटैचमेंट संदर्भ से मेल खाना आवश्यक हो, तो उसे ओवरराइड करने के लिए `filename` का उपयोग करें

मोडल फ़ॉर्म:

- अधिकतम 5 फ़ील्ड के साथ `components.modal` जोड़ें
- फ़ील्ड प्रकार: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw अपने-आप एक ट्रिगर बटन जोड़ता है

उदाहरण:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "वैकल्पिक फ़ॉलबैक टेक्स्ट",
  components: {
    reusable: true,
    text: "कोई पथ चुनें",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "अनुमोदित करें",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "अस्वीकार करें", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "कोई विकल्प चुनें",
          options: [
            { label: "विकल्प A", value: "a" },
            { label: "विकल्प B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "विवरण",
      triggerLabel: "फ़ॉर्म खोलें",
      fields: [
        { type: "text", label: "अनुरोधकर्ता" },
        {
          type: "select",
          label: "प्राथमिकता",
          options: [
            { label: "कम", value: "low" },
            { label: "अधिक", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## अभिगम नियंत्रण और रूटिंग

<Tabs>
  <Tab title="DM नीति">
    `channels.discord.dmPolicy` DM अभिगम नियंत्रित करता है। `channels.discord.allowFrom` प्रामाणिक DM अनुमति-सूची है।

    - `pairing` (डिफ़ॉल्ट)
    - `allowlist` (कम-से-कम एक `allowFrom` प्रेषक आवश्यक है)
    - `open` (`channels.discord.allowFrom` में `"*"` शामिल होना आवश्यक है)
    - `disabled`

    यदि DM नीति खुली नहीं है, तो अज्ञात उपयोगकर्ताओं को ब्लॉक कर दिया जाता है (या `pairing` मोड में पेयरिंग के लिए कहा जाता है)।

    बहु-खाता प्राथमिकता:

    - `channels.discord.accounts.default.allowFrom` केवल `default` खाते पर लागू होता है।
    - एक खाते के लिए, `allowFrom` को पुराने `dm.allowFrom` पर प्राथमिकता मिलती है।
    - नामित खाते अपने `allowFrom` और पुराने `dm.allowFrom` के सेट न होने पर `channels.discord.allowFrom` इनहेरिट करते हैं।
    - नामित खाते `channels.discord.accounts.default.allowFrom` इनहेरिट नहीं करते।

    संगतता के लिए पुराने `channels.discord.dm.policy` और `channels.discord.dm.allowFrom` अब भी पढ़े जाते हैं। जब अभिगम बदले बिना ऐसा करना संभव हो, तब `openclaw doctor --fix` उन्हें `dmPolicy` और `allowFrom` में माइग्रेट करता है।

    डिलीवरी के लिए DM लक्ष्य प्रारूप:

    - `user:<id>`
    - `<@id>` उल्लेख

    चैनल डिफ़ॉल्ट सक्रिय होने पर केवल संख्यात्मक ID सामान्यतः चैनल ID के रूप में रिज़ॉल्व होते हैं, लेकिन खाते की प्रभावी DM `allowFrom` में सूचीबद्ध ID को संगतता के लिए उपयोगकर्ता DM लक्ष्य माना जाता है।

  </Tab>

  <Tab title="अभिगम समूह">
    Discord DM और टेक्स्ट कमांड प्राधिकरण, `channels.discord.allowFrom` में गतिशील `accessGroup:<name>` प्रविष्टियों का उपयोग कर सकते हैं।

    अभिगम समूह नाम संदेश चैनलों में साझा होते हैं। ऐसे स्थिर समूह के लिए `type: "message.senders"` का उपयोग करें जिसके सदस्य प्रत्येक चैनल के सामान्य `allowFrom` सिंटैक्स में व्यक्त किए गए हों, या जब Discord चैनल के वर्तमान `ViewChannel` दर्शक सदस्यता को गतिशील रूप से परिभाषित करें, तब `type: "discord.channelAudience"` का उपयोग करें। साझा अभिगम-समूह व्यवहार: [अभिगम समूह](/hi/channels/access-groups)।

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Discord टेक्स्ट चैनल की कोई अलग सदस्य सूची नहीं होती। `type: "discord.channelAudience"` सदस्यता को इस प्रकार मॉडल करता है: DM प्रेषक कॉन्फ़िगर किए गए गिल्ड का सदस्य है और भूमिका तथा चैनल ओवरराइट लागू होने के बाद उसके पास वर्तमान में कॉन्फ़िगर किए गए चैनल पर प्रभावी `ViewChannel` अनुमति है।

    उदाहरण: बॉट को DM भेजने की अनुमति ऐसे हर व्यक्ति को दें जो `#maintainers` देख सकता है, जबकि बाकी सभी के लिए DM बंद रखें।

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    आप गतिशील और स्थिर प्रविष्टियाँ मिला सकते हैं:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    लुकअप बंद स्थिति में विफल होते हैं। यदि Discord `Missing Access` लौटाता है, सदस्य लुकअप विफल होता है या चैनल किसी अलग गिल्ड से संबंधित है, तो DM प्रेषक को अनधिकृत माना जाता है।

    चैनल-दर्शक अभिगम समूहों का उपयोग करते समय Discord Developer Portal में **Server Members Intent** सक्षम करें। DM में गिल्ड सदस्य स्थिति शामिल नहीं होती, इसलिए OpenClaw प्राधिकरण के समय Discord REST के माध्यम से सदस्य को रिज़ॉल्व करता है।

  </Tab>

  <Tab title="गिल्ड नीति">
    गिल्ड प्रबंधन `channels.discord.groupPolicy` द्वारा नियंत्रित होता है:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` मौजूद होने पर सुरक्षित आधाररेखा `allowlist` होती है।

    `allowlist` व्यवहार:

    - गिल्ड को `channels.discord.guilds` से मेल खाना चाहिए (`id` को प्राथमिकता दी जाती है, स्लग स्वीकार्य है)
    - वैकल्पिक प्रेषक अनुमति-सूचियाँ: `users` (स्थिर ID अनुशंसित) और `roles` (केवल भूमिका ID); यदि दोनों में से कोई भी कॉन्फ़िगर है, तो प्रेषकों को तब अनुमति मिलती है जब वे `users` या `roles` से मेल खाते हैं
    - प्रत्यक्ष नाम/टैग मिलान डिफ़ॉल्ट रूप से अक्षम है; केवल आपातकालीन संगतता मोड के रूप में `channels.discord.dangerouslyAllowNameMatching: true` सक्षम करें
    - `users` के लिए नाम/टैग समर्थित हैं, लेकिन ID अधिक सुरक्षित हैं; नाम/टैग प्रविष्टियाँ उपयोग होने पर `openclaw security audit` चेतावनी देता है
    - यदि किसी गिल्ड के लिए `channels` कॉन्फ़िगर है, तो सूची में शामिल न किए गए चैनल अस्वीकृत होते हैं
    - यदि किसी गिल्ड में `channels` ब्लॉक नहीं है, तो उस अनुमति-सूचीबद्ध गिल्ड के सभी चैनलों को अनुमति मिलती है

    उदाहरण:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    पुराने प्रति-चैनल `allow` कुंजी को `openclaw doctor --fix` द्वारा `enabled` में माइग्रेट किया जाता है।

    यदि आप केवल `DISCORD_BOT_TOKEN` सेट करते हैं और `channels.discord` ब्लॉक नहीं बनाते, तो रनटाइम फ़ॉलबैक `groupPolicy="allowlist"` होता है (लॉग में चेतावनी के साथ), भले ही `channels.defaults.groupPolicy`, `open` हो।

  </Tab>

  <Tab title="उल्लेख और समूह DM">
    गिल्ड संदेश डिफ़ॉल्ट रूप से उल्लेख द्वारा सीमित होते हैं।

    उल्लेख पहचान में शामिल हैं:

    - स्पष्ट बॉट उल्लेख
    - कॉन्फ़िगर किए गए उल्लेख पैटर्न (`agents.list[].groupChat.mentionPatterns`, फ़ॉलबैक `messages.groupChat.mentionPatterns`)
    - समर्थित मामलों में अंतर्निहित बॉट-को-उत्तर व्यवहार

    आउटबाउंड Discord संदेश लिखते समय, प्रामाणिक उल्लेख सिंटैक्स का उपयोग करें: उपयोगकर्ताओं के लिए `<@USER_ID>`, चैनलों के लिए `<#CHANNEL_ID>` और भूमिकाओं के लिए `<@&ROLE_ID>`। पुराने `<@!USER_ID>` उपनाम उल्लेख प्रारूप का उपयोग न करें।

    `requireMention` प्रति गिल्ड/चैनल (`channels.discord.guilds...`) कॉन्फ़िगर किया जाता है।
    `ignoreOtherMentions` वैकल्पिक रूप से उन संदेशों को छोड़ देता है जो किसी अन्य उपयोगकर्ता/भूमिका का उल्लेख करते हैं लेकिन बॉट का नहीं (@everyone/@here को छोड़कर)।

    समूह DM:

    - डिफ़ॉल्ट: अनदेखा किया जाता है (`dm.groupEnabled=false`)
    - `dm.groupChannels` के माध्यम से वैकल्पिक अनुमति-सूची (चैनल ID या स्लग)

  </Tab>
</Tabs>

### भूमिका-आधारित एजेंट रूटिंग

Discord गिल्ड सदस्यों को भूमिका ID के आधार पर अलग-अलग एजेंटों तक रूट करने के लिए `bindings[].match.roles` का उपयोग करें। भूमिका-आधारित बाइंडिंग केवल भूमिका ID स्वीकार करती हैं और उनका मूल्यांकन पीयर या पैरेंट-पीयर बाइंडिंग के बाद तथा केवल-गिल्ड बाइंडिंग से पहले किया जाता है। यदि कोई बाइंडिंग अन्य मिलान फ़ील्ड भी सेट करती है (उदाहरण के लिए `peer` + `guildId` + `roles`), तो सभी कॉन्फ़िगर किए गए फ़ील्ड का मेल खाना आवश्यक है।

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## नेटिव कमांड और कमांड प्रमाणीकरण

- `commands.native` का डिफ़ॉल्ट मान `"auto"` है और यह Discord के लिए सक्षम है।
- प्रति-चैनल ओवरराइड: `channels.discord.commands.native`।
- `commands.native=false` स्टार्टअप के दौरान Discord स्लैश-कमांड पंजीकरण और क्लीनअप को छोड़ देता है। पहले पंजीकृत कमांड Discord में तब तक दिखाई दे सकते हैं, जब तक आप उन्हें Discord ऐप से हटा नहीं देते।
- नेटिव कमांड प्रमाणीकरण सामान्य संदेश प्रबंधन वाली ही Discord अनुमतिसूचियों/नीतियों का उपयोग करता है।
- अनधिकृत उपयोगकर्ताओं को कमांड फिर भी Discord UI में दिखाई दे सकते हैं; निष्पादन OpenClaw प्रमाणीकरण लागू करता है और "अधिकृत नहीं" उत्तर देता है।
- डिफ़ॉल्ट स्लैश कमांड सेटिंग्स: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`)।

कमांड सूची और व्यवहार के लिए [स्लैश कमांड](/hi/tools/slash-commands) देखें।

## सुविधा विवरण

<AccordionGroup>
  <Accordion title="उत्तर टैग और नेटिव उत्तर">
    Discord एजेंट आउटपुट में उत्तर टैग का समर्थन करता है:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    इसे `channels.discord.replyToMode` नियंत्रित करता है:

    - `off` (डिफ़ॉल्ट): कोई अंतर्निहित उत्तर थ्रेडिंग नहीं; स्पष्ट `[[reply_to_*]]` टैग का फिर भी पालन किया जाता है
    - `first`: टर्न के पहले आउटबाउंड Discord संदेश में अंतर्निहित नेटिव उत्तर संदर्भ जोड़ता है
    - `all`: इसे प्रत्येक आउटबाउंड संदेश में जोड़ता है
    - `batched`: इसे केवल तब जोड़ता है, जब इनबाउंड इवेंट कई संदेशों का डीबाउंस किया गया बैच हो — यह तब उपयोगी है, जब आप हर एकल-संदेश टर्न के बजाय मुख्यतः अस्पष्ट, अचानक तेज़ होने वाली चैट के लिए नेटिव उत्तर चाहते हैं

    संदेश ID को संदर्भ/इतिहास में उपलब्ध कराया जाता है, ताकि एजेंट विशिष्ट संदेशों को लक्षित कर सकें।

  </Accordion>

  <Accordion title="लिंक पूर्वावलोकन">
    Discord डिफ़ॉल्ट रूप से URL के लिए समृद्ध लिंक एम्बेड बनाता है। OpenClaw डिफ़ॉल्ट रूप से आउटबाउंड Discord संदेशों पर उन बनाए गए एम्बेड को दबा देता है, इसलिए एजेंट द्वारा भेजे गए URL तब तक सामान्य लिंक बने रहते हैं, जब तक आप उन्हें स्पष्ट रूप से सक्षम नहीं करते:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    किसी एक खाते को ओवरराइड करने के लिए `channels.discord.accounts.<id>.suppressEmbeds` सेट करें। एजेंट के संदेश-टूल से भेजते समय किसी एक संदेश के लिए `suppressEmbeds: false` भी दिया जा सकता है। स्पष्ट Discord `embeds` पेलोड डिफ़ॉल्ट लिंक-पूर्वावलोकन सेटिंग द्वारा दबाए नहीं जाते।

  </Accordion>

  <Accordion title="लाइव स्ट्रीम पूर्वावलोकन">
    OpenClaw एक अस्थायी संदेश भेजकर और टेक्स्ट आने के साथ उसे संपादित करके ड्राफ़्ट उत्तर स्ट्रीम कर सकता है। `channels.discord.streaming.mode`, `off` | `partial` | `block` | `progress` स्वीकार करता है (जब कोई `streaming`/पुरानी `streamMode` कुंजी सेट न हो, तब डिफ़ॉल्ट)। `streamMode` एक पुराना उपनाम है; सहेजे गए कॉन्फ़िगरेशन को मानक नेस्टेड `streaming` आकार में दोबारा लिखने के लिए `openclaw doctor --fix` चलाएँ।

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: false,
          commentary: false,
        },
      },
    },
  },
}
```

    - `off` Discord पूर्वावलोकन संपादन अक्षम करता है।
    - `partial` टोकन आने के साथ एक ही पूर्वावलोकन संदेश को संपादित करता है।
    - `block` ड्राफ़्ट-आकार के खंड उत्सर्जित करता है; आकार और ब्रेकपॉइंट को `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`) से समायोजित करें, जिन्हें `textChunkLimit` तक सीमित रखा जाता है। जब ब्लॉक स्ट्रीमिंग स्पष्ट रूप से सक्षम हो, तो दोहरी स्ट्रीमिंग से बचने के लिए OpenClaw पूर्वावलोकन स्ट्रीम छोड़ देता है।
    - `progress` अंतिम डिलीवरी तक एक संपादन योग्य स्थिति ड्राफ़्ट बनाए रखता है। डिफ़ॉल्ट रूप से यह एजेंट की नवीनतम प्रस्तावना या वर्णन की एक पंक्ति दिखाता है, जिसमें कोई बनाया गया लेबल, स्पेसर या टूल पंक्ति नहीं होती।
    - मीडिया, त्रुटि और स्पष्ट-उत्तर वाले अंतिम संदेश लंबित पूर्वावलोकन संपादन रद्द कर देते हैं।
    - `streaming.preview.toolProgress` का डिफ़ॉल्ट मान `partial`/`block` मोड में `true` होता है। Discord प्रगति मोड में डिफ़ॉल्ट रूप से कोई टूल पंक्ति नहीं होती; उन्हें सक्षम करने के लिए `streaming.progress.toolProgress: true` सेट करें।
    - `🛠️ Bash: run tests` या `🔎 Web Search: for "query"` जैसी संक्षिप्त टूल/प्रगति पंक्तियाँ जोड़ने के लिए `streaming.progress.toolProgress: true` सेट करें। संगतता के लिए, मौजूदा `progress.label` या `progress.labels` कॉन्फ़िगरेशन पहले वाला टूल-पंक्ति डिफ़ॉल्ट बनाए रखता है; पंक्तियों के बिना कस्टम लेबल के लिए `toolProgress: false` सेट करें।
    - `streaming.progress.commentary` (डिफ़ॉल्ट `false`) अस्थायी प्रगति ड्राफ़्ट में असंसाधित सहायक टिप्पणी को सक्षम करता है। डिफ़ॉल्ट प्रस्तावना/वर्णन स्थिति पंक्ति इस विकल्प से स्वतंत्र है। टिप्पणी प्रदर्शित होने से पहले साफ़ की जाती है, अस्थायी रहती है और अंतिम उत्तर की डिलीवरी नहीं बदलती।
    - `streaming.progress.maxLineChars` प्रति-पंक्ति प्रगति पूर्वावलोकन सीमा नियंत्रित करता है। गद्य को शब्द सीमाओं पर छोटा किया जाता है; कमांड और पथ विवरण उपयोगी प्रत्यय बनाए रखते हैं।
    - `streaming.preview.commandText` / `streaming.progress.commandText` संक्षिप्त प्रगति पंक्तियों में कमांड/निष्पादन विवरण नियंत्रित करता है: `raw` (डिफ़ॉल्ट) या `status` (केवल टूल लेबल)।

    संक्षिप्त प्रगति पंक्तियाँ बनाए रखते हुए असंसाधित कमांड/निष्पादन टेक्स्ट छिपाएँ:

    ```json
    {
      "channels": {
        "discord": {
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

    पूर्वावलोकन स्ट्रीमिंग केवल टेक्स्ट के लिए है; मीडिया उत्तर सामान्य डिलीवरी पर वापस चले जाते हैं।

  </Accordion>

  <Accordion title="इतिहास, संदर्भ और थ्रेड व्यवहार">
    गिल्ड इतिहास संदर्भ:

    - `channels.discord.historyLimit` डिफ़ॉल्ट `20`
    - फ़ॉलबैक: `messages.groupChat.historyLimit`
    - `0` अक्षम करता है

    DM इतिहास नियंत्रण:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    थ्रेड व्यवहार:

    - Discord थ्रेड चैनल सत्रों के रूप में रूट होते हैं और ओवरराइड न किए जाने पर पैरेंट चैनल कॉन्फ़िगरेशन प्राप्त करते हैं।
    - थ्रेड सत्र मॉडल-मात्र फ़ॉलबैक के रूप में पैरेंट चैनल के सत्र-स्तरीय `/model` चयन को प्राप्त करते हैं; थ्रेड-स्थानीय `/model` चयन को प्राथमिकता मिलती है और ट्रांसक्रिप्ट इनहेरिटेंस सक्षम न होने पर पैरेंट ट्रांसक्रिप्ट इतिहास कॉपी नहीं किया जाता।
    - `channels.discord.thread.inheritParent` (डिफ़ॉल्ट `false`) नए स्वतः-थ्रेड को पैरेंट ट्रांसक्रिप्ट से आरंभ करने में शामिल करता है। प्रति-खाता ओवरराइड: `channels.discord.accounts.<id>.thread.inheritParent`।
    - संदेश-टूल प्रतिक्रियाएँ `user:<id>` DM लक्ष्यों को हल कर सकती हैं।
    - उत्तर-चरण सक्रियण फ़ॉलबैक के दौरान `guilds.<guild>.channels.<channel>.requireMention: false` को सुरक्षित रखा जाता है।

    चैनल विषयों को **अविश्वसनीय** संदर्भ के रूप में जोड़ा जाता है। अनुमतिसूचियाँ यह नियंत्रित करती हैं कि एजेंट को कौन ट्रिगर कर सकता है; वे पूर्ण पूरक-संदर्भ संशोधन सीमा नहीं हैं।

  </Accordion>

  <Accordion title="सबएजेंट के लिए थ्रेड-बद्ध सत्र">
    Discord किसी थ्रेड को सत्र लक्ष्य से बाँध सकता है, ताकि उस थ्रेड के अनुवर्ती संदेश उसी सत्र पर रूट होते रहें (सबएजेंट सत्रों सहित)।

    कमांड:

    - `/focus <target>` वर्तमान/नए थ्रेड को सबएजेंट/सत्र लक्ष्य से बाँधता है
    - `/unfocus` वर्तमान थ्रेड बाइंडिंग हटाता है
    - `/agents` सक्रिय रन और बाइंडिंग स्थिति दिखाता है
    - `/session idle <duration|off>` फ़ोकस की गई बाइंडिंग के लिए निष्क्रियता-आधारित स्वचालित अनफ़ोकस की जाँच/अपडेट करता है
    - `/session max-age <duration|off>` फ़ोकस की गई बाइंडिंग के लिए अधिकतम आयु की जाँच/अपडेट करता है

    कॉन्फ़िगरेशन:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    टिप्पणियाँ:

    - `session.threadBindings.*` वैश्विक डिफ़ॉल्ट सेट करता है; `channels.discord.threadBindings.*` Discord व्यवहार को ओवरराइड करता है।
    - `spawnSessions`, `sessions_spawn({ thread: true })` और ACP थ्रेड स्पॉन के लिए थ्रेड के स्वतः निर्माण/बाइंडिंग को नियंत्रित करता है। डिफ़ॉल्ट: `true`।
    - `defaultSpawnContext` थ्रेड-बद्ध स्पॉन के लिए नेटिव सबएजेंट संदर्भ नियंत्रित करता है। डिफ़ॉल्ट: `"fork"`।
    - बहिष्कृत `spawnSubagentSessions`/`spawnAcpSessions` कुंजियों को `openclaw doctor --fix` द्वारा माइग्रेट किया जाता है।
    - यदि किसी खाते के लिए थ्रेड बाइंडिंग अक्षम हैं, तो `/focus` और संबंधित थ्रेड बाइंडिंग संचालन उपलब्ध नहीं होते।

    [सब-एजेंट](/hi/tools/subagents), [ACP एजेंट](/hi/tools/acp-agents) और [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

  </Accordion>

  <Accordion title="स्रोत संदेश पर सबएजेंट प्रगति">
    पैरेंट रन शुरू करने वाले Discord संदेश पर बैकग्राउंड चाइल्ड गतिविधि दिखाने के लिए `channels.discord.subagentProgress: true` सेट करें।

```json5
{
  channels: {
    discord: {
      subagentProgress: true,
    },
  },
}
```

    चाइल्ड रन सक्रिय रहने के दौरान OpenClaw अधिकतम एक घंटे तक Discord टाइपिंग सक्रिय रखता है और समवर्ती संख्या बदलने पर एक गणना प्रतिक्रिया (`1️⃣` से `🔟` तक) को बदलता है; `🔟` 10 या अधिक का भी प्रतिनिधित्व करता है। अंतिम चाइल्ड समाप्त होने के बाद गणना प्रतिक्रिया हटा दी जाती है। विफल, समय-सीमा पार कर चुके या रोके गए चाइल्ड के कारण `🔴` प्रतिक्रिया बनी रहती है।

    यह वैकल्पिक है और निश्चित आंतरिक समय तथा इमोजी डिफ़ॉल्ट का उपयोग करता है। प्रतिक्रिया फ़ीडबैक के लिए बॉट को **Add Reactions** अनुमति चाहिए। खाता-स्तरीय `channels.discord.accounts.<id>.subagentProgress` शीर्ष-स्तरीय मान को ओवरराइड करता है।

  </Accordion>

  <Accordion title="स्थायी ACP चैनल बाइंडिंग">
    स्थिर "हमेशा चालू" ACP कार्यस्थानों के लिए Discord वार्तालापों को लक्षित करने वाली शीर्ष-स्तरीय टाइप्ड ACP बाइंडिंग कॉन्फ़िगर करें।

    कॉन्फ़िगरेशन पथ: `bindings[]`, जिसमें `type: "acp"` और `match.channel: "discord"` हों।

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    टिप्पणियाँ:

    - `/acp spawn codex --bind here` वर्तमान चैनल या थ्रेड को यथास्थान बाँधता है और भविष्य के संदेशों को उसी ACP सत्र पर बनाए रखता है। थ्रेड संदेश पैरेंट चैनल बाइंडिंग प्राप्त करते हैं।
    - बद्ध चैनल या थ्रेड में `/new` और `/reset` उसी ACP सत्र को यथास्थान रीसेट करते हैं। सक्रिय रहने के दौरान अस्थायी थ्रेड बाइंडिंग लक्ष्य समाधान को ओवरराइड कर सकती हैं।
    - `spawnSessions`, `--thread auto|here` के माध्यम से चाइल्ड थ्रेड निर्माण/बाइंडिंग को नियंत्रित करता है।

    बाइंडिंग व्यवहार के विवरण के लिए [ACP एजेंट](/hi/tools/acp-agents) देखें।

  </Accordion>

  <Accordion title="प्रतिक्रिया सूचनाएँ">
    प्रति-गिल्ड प्रतिक्रिया सूचना मोड (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (डिफ़ॉल्ट)
    - `all`
    - `allowlist` (`guilds.<id>.users` का उपयोग करता है)

    प्रतिक्रिया इवेंट को सिस्टम इवेंट में बदलकर रूट किए गए Discord सत्र से जोड़ दिया जाता है।

  </Accordion>

  <Accordion title="ऑनलाइन उपस्थिति इवेंट">
    किसी मानव सदस्य के ऑफ़लाइन से ऑनलाइन होने पर रूट किए गए एजेंट वेक के लिए गिल्ड को शामिल करें:

    ```json5
    {
      channels: {
        discord: {
          intents: { presence: true },
          guilds: {
            "111111111111111111": {
              presenceEvents: {
                channelId: "222222222222222222",
                users: ["333333333333333333"], // वैकल्पिक; चैनल दर्शकों को और सीमित करें
                reconnectSuppressSeconds: 300, // वैकल्पिक; नए सत्र की शांत अवधि (0 अक्षम करता है)
                burstLimit: 8, // वैकल्पिक; प्रति बर्स्ट विंडो अधिकतम इवेंट
                burstWindowSeconds: 60, // वैकल्पिक; स्लाइडिंग बर्स्ट-पहचान विंडो
              },
            },
          },
        },
      },
    }
    ```

    `presenceEvents` के लिए रूट किए गए एजेंट पर सक्षम Heartbeat और Discord Developer Portal में एप्लिकेशन के Bot पृष्ठ पर विशेषाधिकार-प्राप्त **Presence Intent** आवश्यक है। OpenClaw प्रत्येक पूर्ण `GUILD_CREATE` स्नैपशॉट से वर्तमान ऑनलाइन सदस्यों को आरंभिक रूप से दर्ज करता है, देखे गए ऑफ़लाइन-से-ऑनलाइन संक्रमणों को रूट करता है, और बाद में किसी अब तक न देखे गए सदस्य से मिलने वाले पहले ऑनलाइन संकेत को भी नई उपलब्धता मानता है। हो सकता है कि वह सदस्य स्नैपशॉट के बाद ऑनलाइन आया हो या शामिल हुआ हो, इसलिए इवेंट उसकी सटीक पिछली स्थिति का दावा नहीं करता। केवल वे मानव पात्र हैं जो `channelId` देख सकते हैं: चैनलों और सार्वजनिक थ्रेड के लिए चैनल या पैरेंट पर **View Channel** आवश्यक है, जबकि निजी थ्रेड के लिए इसके अतिरिक्त सदस्यता या **Manage Threads** आवश्यक है। `users` उस दर्शक समूह को और सीमित कर सकता है। OpenClaw बॉट और अपरिवर्तित ऑनलाइन स्थितियों को अनदेखा करता है तथा Gateway के पुनः आरंभ होने के बाद भी प्रति उपयोगकर्ता आठ घंटे का कूलडाउन बनाए रखता है। जब Discord एक नया Gateway सत्र स्थापित करके `READY` भेजता है, तो guild की उपस्थिति स्थिति दोबारा निर्मित होने के दौरान OpenClaw `reconnectSuppressSeconds` तक उपस्थिति से प्राप्त इवेंट दबाता है (डिफ़ॉल्ट 300, `0` इसे अक्षम करता है), ताकि दोबारा देखे गए सदस्य एजेंट को एक-एक करके सक्रिय न कर सकें। इसके अतिरिक्त, यह प्रत्येक guild में सफलतापूर्वक कतारबद्ध इवेंट को प्रति `burstWindowSeconds` स्लाइडिंग विंडो (डिफ़ॉल्ट 60) में `burstLimit` इवेंट (डिफ़ॉल्ट 8) तक सीमित करता है और प्रत्येक guild के दमन प्रकरण को एक बार लॉग करता है। पुनः शुरू किए गए सत्र को नया सत्र नहीं माना जाता। Discord 75,000 से अधिक सदस्यों वाले guild के स्नैपशॉट सीमित करता है; वहाँ OpenClaw अभिवादन से पहले स्पष्ट ऑफ़लाइन अपडेट की अपेक्षा करता है। सिस्टम इवेंट में परिवर्तनशील प्रदर्शन नाम शामिल किए बिना अपरिवर्तनीय उपयोगकर्ता, guild और चैनल ID होते हैं। एजेंट तय करता है कि अभिवादन करना है या नहीं और कैसे करना है।

  </Accordion>

  <Accordion title="पावती प्रतिक्रियाएँ">
    जब OpenClaw किसी इनबाउंड संदेश को संसाधित करता है, तब `ackReaction` एक पावती इमोजी भेजता है।

    समाधान क्रम:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - एजेंट पहचान इमोजी फ़ॉलबैक (`agents.list[].identity.emoji`, अन्यथा "👀")

    टिप्पणियाँ:

    - Discord यूनिकोड इमोजी या कस्टम इमोजी नाम स्वीकार करता है।
    - किसी चैनल या खाते के लिए प्रतिक्रिया अक्षम करने हेतु `""` का उपयोग करें।

    **दायरा (`messages.ackReactionScope`):**

    मान: `"all"` (DM + समूह, परिवेशी रूम इवेंट सहित), `"direct"` (केवल DM), `"group-all"` (परिवेशी रूम इवेंट को छोड़कर प्रत्येक समूह संदेश, कोई DM नहीं), `"group-mentions"` (वे समूह जहाँ बॉट का उल्लेख किया गया हो; **कोई DM नहीं**, डिफ़ॉल्ट), `"off"` / `"none"` (अक्षम)।

    <Note>
    डिफ़ॉल्ट दायरा (`"group-mentions"`) डायरेक्ट संदेशों या परिवेशी रूम इवेंट में पावती प्रतिक्रियाएँ सक्रिय नहीं करता। इनबाउंड Discord DM और शांत रूम इवेंट पर पावती प्रतिक्रिया पाने के लिए `messages.ackReactionScope` को `"all"` पर सेट करें।
    </Note>

  </Accordion>

  <Accordion title="कॉन्फ़िगरेशन लेखन">
    चैनल द्वारा आरंभ किए गए कॉन्फ़िगरेशन लेखन डिफ़ॉल्ट रूप से सक्षम होते हैं। यह `/config set|unset` प्रवाहों को प्रभावित करता है (जब कमांड सुविधाएँ सक्षम हों)।

    अक्षम करें:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway प्रॉक्सी">
    Discord Gateway WebSocket ट्रैफ़िक और स्टार्टअप REST लुकअप (एप्लिकेशन ID + अनुमतिसूची समाधान) को `channels.discord.proxy` के साथ HTTP(S) प्रॉक्सी से रूट करें।
    Discord Gateway WebSocket प्रॉक्सी स्पष्ट रूप से कॉन्फ़िगर की जाती है; WebSocket कनेक्शन Gateway प्रक्रिया के परिवेशी प्रॉक्सी एनवायरनमेंट वेरिएबल प्राप्त नहीं करते। `channels.discord.proxy` कॉन्फ़िगर होने पर स्टार्टअप REST लुकअप इस प्रॉक्सी का उपयोग करते हैं।

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    प्रति-खाता ओवरराइड:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit समर्थन">
    प्रॉक्सी किए गए संदेशों को सिस्टम सदस्य की पहचान से मैप करने के लिए PluralKit समाधान सक्षम करें:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // वैकल्पिक; निजी सिस्टम के लिए आवश्यक
      },
    },
  },
}
```

    टिप्पणियाँ:

    - अनुमतिसूचियाँ `pk:<memberId>` का उपयोग कर सकती हैं
    - सदस्य प्रदर्शन नामों का मिलान नाम/स्लग के आधार पर केवल तब किया जाता है जब `channels.discord.dangerouslyAllowNameMatching: true`
    - लुकअप मूल संदेश ID के साथ PluralKit API को क्वेरी करते हैं
    - यदि लुकअप विफल होता है, तो प्रॉक्सी किए गए संदेशों को बॉट संदेश मानकर हटा दिया जाता है, जब तक कि `allowBots` उन्हें पास होने की अनुमति न दे

  </Accordion>

  <Accordion title="आउटबाउंड उल्लेख उपनाम">
    जब एजेंट को ज्ञात Discord उपयोगकर्ताओं के लिए नियतात्मक आउटबाउंड उल्लेखों की आवश्यकता हो, तब `mentionAliases` का उपयोग करें। कुंजियाँ आरंभिक `@` के बिना हैंडल होती हैं; मान Discord उपयोगकर्ता ID होते हैं। अज्ञात हैंडल, `@everyone`, `@here`, और Markdown कोड स्पैन के भीतर उल्लेख अपरिवर्तित रहते हैं।

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="उपस्थिति कॉन्फ़िगरेशन">
    जब आप स्थिति या गतिविधि फ़ील्ड सेट करते हैं, या स्वचालित उपस्थिति सक्षम करते हैं, तब उपस्थिति अपडेट लागू होते हैं।

    केवल स्थिति:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    गतिविधि (`activity` सेट होने पर कस्टम स्थिति डिफ़ॉल्ट गतिविधि प्रकार होती है):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    स्ट्रीमिंग:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    गतिविधि प्रकार मैप:

    - 0: खेलना
    - 1: स्ट्रीमिंग (`activityUrl` आवश्यक है; और `activityUrl` के लिए `activityType: 1` आवश्यक है)
    - 2: सुनना
    - 3: देखना
    - 4: कस्टम (गतिविधि टेक्स्ट को स्थिति अवस्था के रूप में उपयोग करता है; इमोजी वैकल्पिक है)
    - 5: प्रतिस्पर्धा करना

    स्वचालित उपस्थिति (रनटाइम स्वास्थ्य संकेत):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    स्वचालित उपस्थिति रनटाइम उपलब्धता को Discord स्थिति से मैप करती है: स्वस्थ => ऑनलाइन, अवनत या अज्ञात => निष्क्रिय, समाप्त या अनुपलब्ध => परेशान न करें। डिफ़ॉल्ट: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (`intervalMs` से कम या उसके बराबर होना चाहिए)। वैकल्पिक टेक्स्ट ओवरराइड:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` प्लेसहोल्डर समर्थित है)

  </Accordion>

  <Accordion title="Discord में अनुमोदन">
    Discord DM में बटन-आधारित अनुमोदन प्रबंधन का समर्थन करता है और वैकल्पिक रूप से मूल चैनल में अनुमोदन प्रॉम्प्ट पोस्ट कर सकता है।

    कॉन्फ़िगरेशन पथ:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (वैकल्पिक; संभव होने पर `commands.ownerAllowFrom` पर फ़ॉलबैक करता है)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, डिफ़ॉल्ट: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    जब `enabled` सेट न हो या `"auto"` हो और कम-से-कम एक अनुमोदक का समाधान किया जा सके, तब Discord मूल exec अनुमोदन स्वचालित रूप से सक्षम करता है; अनुमोदक का समाधान या तो `execApprovals.approvers` से या `commands.ownerAllowFrom` से किया जाता है। Discord चैनल `allowFrom`, पुराने `dm.allowFrom`, या डायरेक्ट-संदेश `defaultTo` से exec अनुमोदकों का अनुमान नहीं लगाता। Discord को मूल अनुमोदन क्लाइंट के रूप में स्पष्ट रूप से अक्षम करने के लिए `enabled: false` सेट करें।

    `/diagnostics` और `/export-trajectory` जैसे संवेदनशील, केवल-स्वामी समूह कमांड के लिए OpenClaw अनुमोदन प्रॉम्प्ट और अंतिम परिणाम निजी रूप से भेजता है। यदि आह्वान करने वाले स्वामी के पास Discord स्वामी रूट है, तो यह पहले Discord DM का प्रयास करता है; अन्यथा यह `commands.ownerAllowFrom` से पहले उपलब्ध स्वामी रूट, जैसे Telegram, पर फ़ॉलबैक करता है।

    जब `target`, `channel` या `both` हो, तब अनुमोदन प्रॉम्प्ट चैनल में दिखाई देता है। केवल समाधान किए गए अनुमोदक बटनों का उपयोग कर सकते हैं; अन्य उपयोगकर्ताओं को अस्थायी अस्वीकृति मिलती है। अनुमोदन प्रॉम्प्ट में कमांड टेक्स्ट शामिल होता है, इसलिए चैनल डिलीवरी केवल विश्वसनीय चैनलों में सक्षम करें। यदि सत्र कुंजी से चैनल ID प्राप्त नहीं की जा सकती, तो OpenClaw DM डिलीवरी पर फ़ॉलबैक करता है।

    Discord अन्य चैट चैनलों द्वारा उपयोग किए जाने वाले साझा अनुमोदन बटन रेंडर करता है; मूल Discord अडैप्टर मुख्य रूप से अनुमोदक DM रूटिंग और चैनल फ़ैनआउट जोड़ता है। जब वे बटन मौजूद हों, तो वे प्राथमिक अनुमोदन UX होते हैं; OpenClaw को मैन्युअल `/approve` कमांड केवल तभी शामिल करना चाहिए जब टूल परिणाम बताए कि चैट अनुमोदन अनुपलब्ध हैं या मैन्युअल अनुमोदन ही एकमात्र मार्ग है। यदि Discord का मूल अनुमोदन रनटाइम सक्रिय नहीं है, तो OpenClaw स्थानीय नियतात्मक `/approve <id> <decision>` प्रॉम्प्ट को दृश्यमान रखता है। यदि रनटाइम सक्रिय है, लेकिन मूल कार्ड किसी भी लक्ष्य तक नहीं पहुँचाया जा सकता, तो OpenClaw लंबित अनुमोदन से सटीक `/approve` कमांड के साथ उसी चैट में फ़ॉलबैक सूचना भेजता है।

    Gateway प्रमाणीकरण और अनुमोदन समाधान साझा Gateway क्लाइंट अनुबंध का पालन करते हैं (`plugin:` ID का समाधान `plugin.approval.resolve` के माध्यम से होता है; अन्य ID का `exec.approval.resolve` के माध्यम से)। अनुमोदन डिफ़ॉल्ट रूप से 30 मिनट बाद समाप्त हो जाते हैं।

    [Exec अनुमोदन](/hi/tools/exec-approvals) देखें।

  </Accordion>
</AccordionGroup>

## टूल और कार्रवाई गेट

Discord संदेश कार्रवाइयाँ संदेश-प्रेषण, चैनल प्रशासन, मॉडरेशन, उपस्थिति और मेटाडेटा को कवर करती हैं।

मुख्य उदाहरण:

- संदेश-प्रेषण: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- प्रतिक्रियाएँ: `react`, `reactions`, `emojiList`
- मॉडरेशन: `timeout`, `kick`, `ban`
- उपस्थिति: `setPresence`

`event-create` कार्रवाई निर्धारित इवेंट की कवर छवि सेट करने के लिए एक वैकल्पिक `image` पैरामीटर (URL या स्थानीय फ़ाइल पथ) स्वीकार करती है।

कार्रवाई गेट `channels.discord.actions.*` के अंतर्गत होते हैं।

डिफ़ॉल्ट गेट व्यवहार:

| क्रिया समूह                                                                                                                                                             | डिफ़ॉल्ट  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| प्रतिक्रियाएँ, संदेश, थ्रेड, पिन, पोल, खोज, सदस्य जानकारी, भूमिका जानकारी, चैनल जानकारी, चैनल, वॉइस स्थिति, इवेंट, स्टिकर, इमोजी अपलोड, स्टिकर अपलोड, अनुमतियाँ | सक्षम  |
| भूमिकाएँ                                                                                                                                                                    | अक्षम |
| मॉडरेशन                                                                                                                                                               | अक्षम |
| उपस्थिति                                                                                                                                                                 | अक्षम |

## Components v2 UI

OpenClaw, exec अनुमोदनों और क्रॉस-कॉन्टेक्स्ट मार्करों के लिए Discord components v2 का उपयोग करता है। Discord संदेश क्रियाएँ कस्टम UI के लिए `components` भी स्वीकार कर सकती हैं (उन्नत; discord टूल के माध्यम से एक कंपोनेंट पेलोड बनाना आवश्यक है), जबकि पुराने `embeds` उपलब्ध रहते हैं, लेकिन उनकी अनुशंसा नहीं की जाती।

- `channels.discord.ui.components.accentColor` Discord कंपोनेंट कंटेनरों द्वारा उपयोग किया जाने वाला एक्सेंट रंग (हेक्स) सेट करता है। प्रति अकाउंट: `channels.discord.accounts.<id>.ui.components.accentColor`।
- `channels.discord.agentComponents.ttlMs` नियंत्रित करता है कि भेजे गए Discord कंपोनेंट कॉलबैक कितने समय तक पंजीकृत रहें (डिफ़ॉल्ट `1800000`, अधिकतम `86400000`)। प्रति अकाउंट: `channels.discord.accounts.<id>.agentComponents.ttlMs`।
- components v2 मौजूद होने पर `embeds` को अनदेखा किया जाता है।
- सादे URL पूर्वावलोकन डिफ़ॉल्ट रूप से दबा दिए जाते हैं। जब किसी एक आउटबाउंड लिंक को विस्तृत करना हो, तब संदेश क्रिया पर `suppressEmbeds: false` सेट करें।

उदाहरण:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## वॉइस

Discord में वॉइस के दो अलग-अलग माध्यम हैं: रीयलटाइम **वॉइस चैनल** (निरंतर वार्तालाप) और **वॉइस संदेश अटैचमेंट** (वेवफ़ॉर्म पूर्वावलोकन प्रारूप)। Gateway दोनों का समर्थन करता है।

### वॉइस चैनल

सेटअप चेकलिस्ट:

1. Discord Developer Portal में Message Content Intent सक्षम करें।
2. भूमिका/उपयोगकर्ता अनुमति-सूचियों का उपयोग होने पर Server Members Intent सक्षम करें।
3. बॉट को `bot` और `applications.commands` स्कोप के साथ आमंत्रित करें।
4. लक्षित वॉइस चैनल में Connect, Speak, Send Messages, और Read Message History प्रदान करें।
5. नेटिव कमांड (`commands.native` या `channels.discord.commands.native`) सक्षम करें।
6. `channels.discord.voice` कॉन्फ़िगर करें।

सेशन नियंत्रित करने के लिए `/vc join|leave|status` का उपयोग करें। कमांड अकाउंट के डिफ़ॉल्ट एजेंट का उपयोग करता है और अन्य Discord कमांड के समान अनुमति-सूची तथा समूह नीति नियमों का पालन करता है।

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

जुड़ने से पहले बॉट की प्रभावी अनुमतियों का निरीक्षण करने के लिए:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

ऑटो-जॉइन उदाहरण:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

टिप्पणियाँ:

- केवल-पाठ कॉन्फ़िगरेशन में Discord वॉइस वैकल्पिक है; `/vc` कमांड, वॉइस रनटाइम और `GuildVoiceStates` Gateway इंटेंट सक्षम करने के लिए `channels.discord.voice.enabled=true` सेट करें (या मौजूदा `channels.discord.voice` ब्लॉक बनाए रखें)। `channels.discord.intents.voiceStates` इंटेंट सदस्यता को स्पष्ट रूप से ओवरराइड कर सकता है; प्रभावी वॉइस सक्षमता का अनुसरण करने के लिए इसे सेट न करें।
- `voice.mode` वार्तालाप पथ नियंत्रित करता है। डिफ़ॉल्ट `agent-proxy` है: एक रीयलटाइम वॉइस फ़्रंट एंड संवाद के समय-निर्धारण, व्यवधान और प्लेबैक को संभालता है, `openclaw_agent_consult` के माध्यम से मूल कार्य रूट किए गए OpenClaw एजेंट को सौंपता है और परिणाम को उस वक्ता के टाइप किए गए Discord प्रॉम्प्ट की तरह मानता है। `stt-tts` पुराने बैच STT और TTS प्रवाह को बनाए रखता है। `bidi` रीयलटाइम मॉडल को सीधे बातचीत करने देता है, साथ ही OpenClaw मस्तिष्क के लिए `openclaw_agent_consult` उपलब्ध कराता है।
- `voice.agentSession` नियंत्रित करता है कि कौन-सा OpenClaw वार्तालाप वॉइस संवाद प्राप्त करता है। वॉइस चैनल के अपने सत्र के लिए इसे सेट न करें, या वॉइस चैनल को `#maintainers` जैसे किसी मौजूदा Discord टेक्स्ट चैनल सत्र के माइक्रोफ़ोन/स्पीकर विस्तार के रूप में कार्य कराने के लिए `{ mode: "target", target: "channel:<text-channel-id>" }` सेट करें।
- `voice.model` Discord वॉइस प्रतिक्रियाओं और रीयलटाइम परामर्शों के लिए OpenClaw एजेंट मस्तिष्क को ओवरराइड करता है। रूट किए गए एजेंट मॉडल को विरासत में लेने के लिए इसे सेट न करें। यह `voice.realtime.model` से अलग है।
- `voice.followUsers` बॉट को चुने गए उपयोगकर्ताओं के साथ Discord वॉइस में शामिल होने, स्थानांतरित होने और छोड़ने देता है। [वॉइस में उपयोगकर्ताओं का अनुसरण करें](#follow-users-in-voice) देखें।
- `agent-proxy` वाक् को `discord-voice` के माध्यम से रूट करता है, जो वक्ता और लक्षित सत्र के लिए सामान्य स्वामी/टूल प्राधिकरण बनाए रखता है, लेकिन एजेंट का `tts` टूल छिपाता है क्योंकि प्लेबैक का स्वामित्व Discord वॉइस के पास है। डिफ़ॉल्ट रूप से, `agent-proxy` स्वामी वक्ताओं (`voice.realtime.toolPolicy: "owner"`) के परामर्श को स्वामी के समतुल्य पूर्ण टूल एक्सेस देता है और मूल उत्तरों से पहले OpenClaw एजेंट से परामर्श लेने को प्रबल प्राथमिकता देता है (`voice.realtime.consultPolicy: "always"`)। उस डिफ़ॉल्ट `always` मोड में, रीयलटाइम परत परामर्श उत्तर से पहले पूरक वाक्यांश स्वतः नहीं बोलती; यह वाक् को कैप्चर और लिप्यंतरित करती है, फिर रूट किया गया OpenClaw उत्तर बोलती है। यदि Discord द्वारा पहला उत्तर चलाए जाने के दौरान कई बाध्य परामर्श उत्तर पूरे हो जाते हैं, तो बाद के सटीक-वाक् उत्तरों को वाक्य के बीच में वाक् बदलने के बजाय प्लेबैक निष्क्रिय होने तक कतारबद्ध किया जाता है।
- `stt-tts` मोड में, STT `tools.media.audio` का उपयोग करता है; `voice.model` लिप्यंतरण को प्रभावित नहीं करता।
- रीयलटाइम मोड में, `voice.realtime.provider`, `voice.realtime.model` और `voice.realtime.speakerVoice` रीयलटाइम ऑडियो सत्र कॉन्फ़िगर करते हैं। OpenAI Realtime 2.1 और Codex मस्तिष्क के लिए `voice.realtime.model: "gpt-realtime-2.1"` तथा `voice.model: "openai/gpt-5.6-sol"` का उपयोग करें।
- रीयलटाइम वॉइस मोड डिफ़ॉल्ट रूप से रीयलटाइम प्रदाता निर्देशों में छोटी `IDENTITY.md`, `USER.md` और `SOUL.md` प्रोफ़ाइल फ़ाइलें शामिल करते हैं, ताकि त्वरित प्रत्यक्ष संवाद रूट किए गए OpenClaw एजेंट जैसी ही पहचान, उपयोगकर्ता-संदर्भ और व्यक्तित्व बनाए रखें। इसे अनुकूलित करने के लिए `voice.realtime.bootstrapContextFiles` को किसी उपसमुच्चय पर सेट करें, या इसे अक्षम करने के लिए `[]` सेट करें। केवल वे प्रोफ़ाइल फ़ाइलें समर्थित हैं; `AGENTS.md` सामान्य एजेंट संदर्भ में बना रहता है। अंतःक्षेपित प्रोफ़ाइल संदर्भ कार्यस्थान के कार्य, वर्तमान तथ्यों, स्मृति खोज या टूल-समर्थित कार्रवाइयों के लिए `openclaw_agent_consult` को प्रतिस्थापित नहीं करता।
- OpenAI `agent-proxy` रीयलटाइम मोड में, वेक-नाम गेटिंग डिफ़ॉल्ट रूप से कक्ष के अनुसार अनुकूलित होती है: एक व्यक्ति वेक नाम के बिना स्वाभाविक रूप से बात कर सकता है, जबकि दो या अधिक व्यक्तियों को संवाद की शुरुआत या अंत वेक नाम से करना आवश्यक है। अन्य बॉट लोगों के रूप में नहीं गिने जाते। हमेशा वेक नाम आवश्यक करने के लिए `voice.realtime.requireWakeName: true` या कभी भी आवश्यक न करने के लिए `false` सेट करें। कॉन्फ़िगर किए गए वेक नाम एक या दो शब्दों के होने चाहिए। यदि `voice.realtime.wakeNames` सेट नहीं है, तो OpenClaw रूट किए गए एजेंट के `name` और `OpenClaw` का उपयोग करता है, और उपलब्ध न होने पर एजेंट आईडी तथा `OpenClaw` का उपयोग करता है। सक्रिय वेक-नाम गेट रीयलटाइम प्रदाता की स्वतः-प्रतिक्रिया अक्षम करता है, स्वीकार किए गए संवादों को OpenClaw एजेंट परामर्श पथ से रूट करता है और अंतिम लिप्यंतरण आने से पहले आंशिक लिप्यंतरण से आरंभिक वेक नाम पहचाने जाने पर संक्षिप्त मौखिक अभिस्वीकृति देता है। यह नीति वॉइस को दोबारा कनेक्ट किए बिना लाइव जुड़ने और छोड़ने की घटनाओं का अनुसरण करती है।
- OpenAI रीयलटाइम प्रदाता आउटपुट ऑडियो और लिप्यंतरण घटनाओं के लिए वर्तमान Realtime 2 इवेंट नाम और पुराने Codex-संगत उपनाम स्वीकार करता है, ताकि संगत प्रदाता स्नैपशॉट में बदलाव होने पर सहायक का ऑडियो न छूटे।
- `voice.realtime.bargeIn` नियंत्रित करता है कि Discord की वक्ता-आरंभ घटनाएँ सक्रिय रीयलटाइम प्लेबैक को बाधित करती हैं या नहीं। यदि सेट नहीं है, तो यह रीयलटाइम प्रदाता की इनपुट-ऑडियो व्यवधान सेटिंग का अनुसरण करता है।
- `voice.realtime.minBargeInAudioEndMs` OpenAI रीयलटाइम बार्ज-इन द्वारा ऑडियो काटे जाने से पहले सहायक के न्यूनतम प्लेबैक की अवधि नियंत्रित करता है। डिफ़ॉल्ट: `250`। कम प्रतिध्वनि वाले कक्षों में तत्काल व्यवधान के लिए `0` सेट करें, या अधिक प्रतिध्वनि वाले स्पीकर सेटअप के लिए इसे बढ़ाएँ।
- `voice.tts` केवल `stt-tts` वॉइस प्लेबैक के लिए `messages.tts` को ओवरराइड करता है; इसके बजाय रीयलटाइम मोड `voice.realtime.speakerVoice` का उपयोग करते हैं। Discord प्लेबैक पर OpenAI वॉइस के लिए `voice.tts.provider: "openai"` सेट करें और `voice.tts.providers.openai.speakerVoice` के अंतर्गत टेक्स्ट-टू-स्पीच वॉइस चुनें। वर्तमान OpenAI TTS मॉडल पर `cedar` पुरुष स्वर जैसा सुनाई देने वाला एक अच्छा विकल्प है।
- प्रति-चैनल Discord `systemPrompt` ओवरराइड उस वॉइस चैनल के वॉइस लिप्यंतरण संवादों पर लागू होते हैं।
- जब OpenClaw किसी वॉइस चैनल में शामिल होता है, तो रूट किए गए एजेंट सत्र को वर्तमान प्रतिभागी सूची के साथ एक मूक सिस्टम इवेंट प्राप्त होता है। बाद में प्रतिभागियों के जुड़ने और छोड़ने पर बिना किसी अनचाही मौखिक प्रतिक्रिया को ट्रिगर किए वह सत्र अपडेट होता है; Discord प्रदर्शन नामों को अविश्वसनीय लेबल माना जाता है। अधिकृत वॉइस संवादों को भी प्रतिभागियों की नई सूची का स्नैपशॉट मिलता है।
- वॉइस लिप्यंतरण संवाद और `/vc` कमांड स्वामी स्थिति के लिए `commands.ownerAllowFrom` में Discord प्रविष्टियों का उपयोग करते हैं। जब कोई Discord कमांड स्वामी कॉन्फ़िगर नहीं होता, तब चुने गए Discord खाते का `allowFrom` (या पुराना `dm.allowFrom`) स्वामी स्थिति प्रदान किए बिना भी वॉइस एक्सेस अधिकृत कर सकता है। एजेंट टूल की दृश्यता रूट किए गए सत्र के लिए कॉन्फ़िगर की गई टूल नीति का अनुसरण करती है।
- यदि `voice.autoJoin` में एक ही गिल्ड के लिए कई प्रविष्टियाँ हैं, तो OpenClaw उस गिल्ड के लिए अंतिम कॉन्फ़िगर किए गए चैनल में शामिल होता है।
- `voice.allowedChannels` एक वैकल्पिक निवास अनुमति-सूची है। `/vc join` को किसी भी अधिकृत Discord वॉइस चैनल में प्रवेश की अनुमति देने के लिए इसे सेट न करें। सेट किए जाने पर, `/vc join`, स्टार्टअप स्वतः-जुड़ाव और बॉट की वॉइस-स्थिति स्थानांतरण सूचीबद्ध `{ guildId, channelId }` प्रविष्टियों तक सीमित रहते हैं। Discord वॉइस में सभी जुड़ावों को अस्वीकार करने के लिए इसे एक खाली सरणी पर सेट करें। यदि Discord बॉट को अनुमति-सूची से बाहर ले जाता है, तो OpenClaw उस चैनल को छोड़ देता है और उपलब्ध होने पर कॉन्फ़िगर किए गए स्वतः-जुड़ाव लक्ष्य में फिर से शामिल होता है।
- `voice.daveEncryption` और `voice.decryptionFailureTolerance`, `@discordjs/voice` के जुड़ाव विकल्पों में सीधे भेजे जाते हैं; अपस्ट्रीम डिफ़ॉल्ट `daveEncryption=true` और `decryptionFailureTolerance=24` हैं।
- OpenClaw, Discord वॉइस प्राप्ति और रीयलटाइम रॉ PCM प्लेबैक के लिए बंडल किए गए `libopus-wasm` कोडेक का उपयोग करता है। इसमें पिन किया हुआ libopus WebAssembly बिल्ड शामिल है और इसे नेटिव opus ऐड-ऑन की आवश्यकता नहीं होती।
- `voice.connectTimeoutMs`, `/vc join` और स्वतः-जुड़ाव प्रयासों के लिए आरंभिक `@discordjs/voice` Ready प्रतीक्षा नियंत्रित करता है। डिफ़ॉल्ट: `30000`।
- `voice.reconnectGraceMs` नियंत्रित करता है कि OpenClaw किसी डिस्कनेक्ट हुए वॉइस सत्र को नष्ट करने से पहले उसके पुनः कनेक्ट होना शुरू करने की कितनी देर प्रतीक्षा करता है। डिफ़ॉल्ट: `15000`।
- `stt-tts` मोड में, केवल किसी अन्य उपयोगकर्ता के बोलना शुरू करने के कारण वॉइस प्लेबैक बंद नहीं होता। फ़ीडबैक लूप से बचने के लिए, TTS चलने के दौरान OpenClaw नए वॉइस कैप्चर की उपेक्षा करता है; अगले संवाद के लिए प्लेबैक समाप्त होने के बाद बोलें। रीयलटाइम मोड वक्ता के बोलना शुरू करने की घटनाओं को रीयलटाइम प्रदाता को बार्ज-इन संकेतों के रूप में भेजते हैं।
- रीयलटाइम मोड में, स्पीकर से खुले माइक्रोफ़ोन में आने वाली प्रतिध्वनि बार्ज-इन जैसी लग सकती है और प्लेबैक बाधित कर सकती है। अधिक प्रतिध्वनि वाले Discord कक्षों के लिए, OpenAI को इनपुट ऑडियो पर स्वतः व्यवधान करने से रोकने हेतु `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` सेट करें। यदि आप फिर भी चाहते हैं कि Discord की वक्ता-आरंभ घटनाएँ सक्रिय प्लेबैक बाधित करें, तो `voice.realtime.bargeIn: true` जोड़ें। OpenAI रीयलटाइम ब्रिज `voice.realtime.minBargeInAudioEndMs` से छोटी प्लेबैक कटौतियों को संभावित प्रतिध्वनि/शोर मानकर अनदेखा करता है और Discord प्लेबैक साफ़ करने के बजाय उन्हें छोड़े गए के रूप में लॉग करता है।
- `voice.captureSilenceGraceMs` नियंत्रित करता है कि Discord द्वारा किसी वक्ता के रुकने की सूचना दिए जाने के बाद OpenClaw उस ऑडियो खंड को STT के लिए अंतिम रूप देने से पहले कितनी देर प्रतीक्षा करता है। डिफ़ॉल्ट: `2000`; यदि Discord सामान्य विरामों को टूटे-फूटे आंशिक लिप्यंतरणों में बाँटता है, तो इसे बढ़ाएँ।
- जब ElevenLabs चुना गया TTS प्रदाता होता है, तब Discord वॉइस प्लेबैक स्ट्रीमिंग TTS का उपयोग करता है और प्रदाता की प्रतिक्रिया स्ट्रीम से शुरू होता है। स्ट्रीमिंग समर्थन न देने वाले प्रदाता संश्लेषित अस्थायी-फ़ाइल पथ पर वापस जाते हैं।
- OpenClaw प्राप्ति डिक्रिप्शन विफलताओं पर नज़र रखता है और छोटी अवधि में बार-बार विफलता होने पर वॉइस चैनल छोड़कर/फिर से जुड़कर स्वतः पुनर्प्राप्ति करता है।
- यदि अपडेट करने के बाद प्राप्ति लॉग बार-बार `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` दिखाते हैं, तो निर्भरता रिपोर्ट और लॉग एकत्र करें। बंडल की गई `@discordjs/voice` लाइन में discord.js PR #11449 का अपस्ट्रीम पैडिंग सुधार शामिल है, जिसने discord.js समस्या #11419 बंद की थी।
- जब OpenClaw कैप्चर किए गए वक्ता खंड को अंतिम रूप देता है, तब `The operation was aborted` प्राप्ति घटनाएँ अपेक्षित होती हैं; वे विस्तृत निदान हैं, चेतावनियाँ नहीं।
- विस्तृत Discord वॉइस लॉग में प्रत्येक स्वीकार किए गए वक्ता खंड के लिए सीमित एक-पंक्ति STT लिप्यंतरण पूर्वावलोकन शामिल होता है, ताकि डीबगिंग में असीमित लिप्यंतरण टेक्स्ट डंप किए बिना उपयोगकर्ता और एजेंट की प्रतिक्रिया, दोनों पक्ष दिखाई दें।
- `agent-proxy` मोड में, बाध्य परामर्श फ़ॉलबैक संभावित रूप से अधूरे लिप्यंतरण अंशों को छोड़ देता है, जैसे `...` पर समाप्त होने वाला टेक्स्ट या "and" जैसा अंतिम संयोजक, साथ ही "be right back" या "bye" जैसे स्पष्ट रूप से गैर-कार्रवाई योग्य समापन। जब इससे कोई पुराना कतारबद्ध उत्तर रोका जाता है, तो लॉग `forced agent consult skipped reason=...` दिखाते हैं।

### वॉइस में उपयोगकर्ताओं का अनुसरण करें

जब आप चाहते हैं कि Discord वॉइस बॉट स्टार्टअप पर किसी निश्चित चैनल में शामिल होने या `/vc join` की प्रतीक्षा करने के बजाय एक या अधिक ज्ञात Discord उपयोगकर्ताओं के साथ रहे, तब `voice.followUsers` का उपयोग करें।

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

व्यवहार:

- `followUsers` अपरिष्कृत Discord उपयोगकर्ता ID और `discord:<id>` मान स्वीकार करता है। OpenClaw वॉइस-स्टेट इवेंट का मिलान करने से पहले दोनों प्रारूपों को सामान्यीकृत करता है।
- `followUsersEnabled` का डिफ़ॉल्ट मान `true` होता है, जब `followUsers` कॉन्फ़िगर किया गया हो। सहेजी गई सूची बनाए रखने लेकिन स्वचालित वॉइस अनुसरण रोकने के लिए इसे `false` पर सेट करें।
- `followUsers` केवल वॉइस उपस्थिति नियंत्रित करता है। यह वक्ता की पहुँच या स्वामी प्राधिकार प्रदान नहीं करता; `commands.ownerAllowFrom` और गिल्ड या चैनल के उपयोगकर्ताओं तथा भूमिकाओं को अलग से कॉन्फ़िगर करें।
- जब अनुसरण किया जा रहा कोई उपयोगकर्ता किसी अनुमत वॉइस चैनल से जुड़ता है, तो OpenClaw उस चैनल से जुड़ जाता है। उपयोगकर्ता के स्थानांतरित होने पर OpenClaw भी उसके साथ स्थानांतरित होता है। सक्रिय अनुसरण किया जा रहा उपयोगकर्ता डिस्कनेक्ट होने पर OpenClaw चैनल छोड़ देता है।
- यदि एक ही गिल्ड में अनुसरण किए जा रहे कई उपयोगकर्ता हों और सक्रिय अनुसरण किया जा रहा उपयोगकर्ता चला जाए, तो OpenClaw गिल्ड छोड़ने से पहले किसी अन्य ट्रैक किए जा रहे अनुसरण किए गए उपयोगकर्ता के चैनल में चला जाता है। यदि अनुसरण किए जा रहे कई उपयोगकर्ता एक साथ स्थानांतरित हों, तो सबसे हाल में देखा गया वॉइस-स्टेट इवेंट प्रभावी होता है।
- `allowedChannels` अब भी लागू होता है। किसी अस्वीकृत चैनल में मौजूद अनुसरण किए जा रहे उपयोगकर्ता को अनदेखा किया जाता है, और अनुसरण-स्वामित्व वाला सत्र किसी अन्य अनुसरण किए जा रहे उपयोगकर्ता के पास चला जाता है या चैनल छोड़ देता है।
- OpenClaw स्टार्टअप पर और एक सीमित अंतराल पर छूटे हुए वॉइस-स्टेट इवेंट का मिलान करता है। मिलान कॉन्फ़िगर किए गए गिल्ड का नमूना लेता है और प्रत्येक रन में REST लुकअप सीमित करता है, इसलिए बहुत बड़ी `followUsers` सूचियों को अभिसरित होने में एक से अधिक अंतराल लग सकते हैं।
- यदि किसी उपयोगकर्ता का अनुसरण करते समय Discord या कोई एडमिन बॉट को स्थानांतरित करता है, तो गंतव्य अनुमत होने पर OpenClaw वॉइस सत्र को फिर से बनाता है और अनुसरण स्वामित्व बनाए रखता है। यदि बॉट को `allowedChannels` के बाहर स्थानांतरित किया जाता है, तो OpenClaw चैनल छोड़ देता है और कॉन्फ़िगर किया गया लक्ष्य उपलब्ध होने पर उससे फिर जुड़ जाता है।
- बार-बार डिक्रिप्ट विफल होने के बाद DAVE प्राप्ति पुनर्प्राप्ति उसी चैनल को छोड़कर उससे फिर जुड़ सकती है। अनुसरण-स्वामित्व वाले सत्र उस पुनर्प्राप्ति पथ के दौरान अपना अनुसरण स्वामित्व बनाए रखते हैं, इसलिए बाद में अनुसरण किए जा रहे उपयोगकर्ता के डिस्कनेक्ट होने पर भी चैनल छोड़ दिया जाता है।

जुड़ने के मोड में से चुनें:

- व्यक्तिगत या ऑपरेटर सेटअप के लिए `followUsers` का उपयोग करें, जहाँ आपके वॉइस में होने पर बॉट को स्वचालित रूप से वॉइस में होना चाहिए।
- स्थिर-कक्ष बॉट के लिए `autoJoin` का उपयोग करें, जिन्हें तब भी उपस्थित रहना चाहिए जब कोई ट्रैक किया गया उपयोगकर्ता वॉइस में न हो।
- एकबारगी जुड़ने या ऐसे कक्षों के लिए `/vc join` का उपयोग करें, जहाँ स्वचालित वॉइस उपस्थिति अप्रत्याशित होगी।

Discord वॉइस कोडेक:

- वॉइस प्राप्ति लॉग `discord voice: opus decoder: libopus-wasm` दिखाते हैं।
- पैकेट को `@discordjs/voice` को सौंपने से पहले रियलटाइम प्लेबैक उसी बंडल किए गए `libopus-wasm` पैकेज से अपरिष्कृत 48 kHz स्टीरियो PCM को Opus में एन्कोड करता है।
- फ़ाइल और प्रोवाइडर-स्ट्रीम प्लेबैक ffmpeg से अपरिष्कृत 48 kHz स्टीरियो PCM में ट्रांसकोड करता है, फिर Discord को भेजी जाने वाली Opus पैकेट स्ट्रीम के लिए `libopus-wasm` का उपयोग करता है।

STT और TTS पाइपलाइन:

- Discord PCM कैप्चर को एक अस्थायी WAV फ़ाइल में बदला जाता है।
- `tools.media.audio` STT संभालता है, उदाहरण के लिए `openai/gpt-4o-mini-transcribe`।
- प्रतिलेख को Discord प्रवेश और रूटिंग के माध्यम से भेजा जाता है, जबकि प्रतिक्रिया LLM ऐसी वॉइस-आउटपुट नीति के साथ चलता है जो एजेंट के `tts` टूल को छिपाती है और लौटाया गया टेक्स्ट माँगती है, क्योंकि अंतिम TTS प्लेबैक का स्वामित्व Discord वॉइस के पास होता है।
- `voice.model`, सेट होने पर, इस वॉइस-चैनल टर्न के लिए केवल प्रतिक्रिया LLM को ओवरराइड करता है।
- `voice.tts` को `messages.tts` के ऊपर मर्ज किया जाता है; स्ट्रीमिंग-सक्षम प्रोवाइडर सीधे प्लेयर को फ़ीड करते हैं, अन्यथा परिणामी ऑडियो फ़ाइल जुड़े हुए चैनल में चलाई जाती है।

डिफ़ॉल्ट एजेंट-प्रॉक्सी वॉइस-चैनल सत्र का उदाहरण:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` ब्लॉक न होने पर, प्रत्येक वॉइस चैनल को अपना रूट किया हुआ OpenClaw सत्र मिलता है। उदाहरण के लिए, `/vc join channel:234567890123456789` उस Discord वॉइस चैनल के सत्र से बात करता है। रियलटाइम मॉडल केवल वॉइस फ़्रंट एंड है; महत्वपूर्ण अनुरोध कॉन्फ़िगर किए गए OpenClaw एजेंट को सौंपे जाते हैं। यदि रियलटाइम मॉडल परामर्श टूल को कॉल किए बिना अंतिम प्रतिलेख तैयार करता है, तो OpenClaw फ़ॉलबैक के रूप में परामर्श को बाध्य करता है, ताकि डिफ़ॉल्ट व्यवहार अब भी एजेंट से बात करने जैसा रहे।

पुराना STT और TTS उदाहरण:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

रियलटाइम द्विदिश उदाहरण:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

किसी मौजूदा Discord चैनल सत्र के विस्तार के रूप में वॉइस:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` मोड में बॉट कॉन्फ़िगर किए गए वॉइस चैनल से जुड़ता है, लेकिन OpenClaw एजेंट टर्न लक्ष्य चैनल के सामान्य रूट किए गए सत्र और एजेंट का उपयोग करते हैं। रियलटाइम वॉइस सत्र लौटाए गए परिणाम को वापस वॉइस चैनल में बोलता है। सुपरवाइज़र एजेंट अपनी टूल नीति के अनुसार सामान्य संदेश टूल का उपयोग अब भी कर सकता है, जिसमें सही कार्रवाई होने पर अलग Discord संदेश भेजना शामिल है।

किसी प्रत्यायोजित OpenClaw रन के सक्रिय रहने के दौरान, नया एजेंट टर्न शुरू करने से पहले नए Discord वॉइस प्रतिलेखों को लाइव रन नियंत्रण माना जाता है। "स्थिति", "उसे रद्द करें", "छोटा सुधार इस्तेमाल करें", या "काम पूरा होने पर परीक्षण भी जाँचें" जैसे वाक्यांशों को सक्रिय सत्र के लिए स्थिति, रद्दीकरण, निर्देशन या अनुवर्ती इनपुट के रूप में वर्गीकृत किया जाता है। स्थिति, रद्दीकरण, स्वीकृत निर्देशन और अनुवर्ती परिणाम वॉइस चैनल में वापस बोले जाते हैं, ताकि कॉलर को पता रहे कि OpenClaw ने अनुरोध संभाला या नहीं।

उपयोगी लक्ष्य प्रारूप:

- `target: "channel:123456789012345678"` किसी Discord टेक्स्ट चैनल सत्र के माध्यम से रूट करता है।
- `target: "123456789012345678"` को चैनल लक्ष्य माना जाता है।
- `target: "dm:123456789012345678"` या `target: "user:123456789012345678"` उस डायरेक्ट-मैसेज सत्र के माध्यम से रूट करता है।

अधिक प्रतिध्वनि वाला OpenAI रियलटाइम उदाहरण:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

जब मॉडल खुले माइक के माध्यम से अपना ही Discord प्लेबैक सुनता हो, लेकिन आप फिर भी बोलकर उसे बाधित करना चाहते हों, तब इसका उपयोग करें। OpenClaw अपरिष्कृत इनपुट ऑडियो पर OpenAI को स्वतः बाधित होने से रोकता है, जबकि `bargeIn: true` Discord के स्पीकर-प्रारंभ इवेंट और पहले से सक्रिय स्पीकर ऑडियो को अगला कैप्चर किया गया टर्न OpenAI तक पहुँचने से पहले सक्रिय रियलटाइम प्रतिक्रियाएँ रद्द करने देता है। `audioEndMs` के `minBargeInAudioEndMs` से कम होने पर बहुत शुरुआती बार्ज-इन संकेतों को संभावित प्रतिध्वनि/शोर मानकर अनदेखा किया जाता है, ताकि मॉडल पहले प्लेबैक फ़्रेम पर ही रुक न जाए।

अपेक्षित वॉइस लॉग:

- जुड़ने पर: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- रियलटाइम प्रारंभ पर: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- स्पीकर ऑडियो पर: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, और `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- पुराना भाषण छोड़ने पर: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` या `reason=non-actionable-closing ...`
- रियलटाइम प्रतिक्रिया पूर्ण होने पर: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- प्लेबैक रुकने/रीसेट होने पर: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- रियलटाइम परामर्श पर: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- एजेंट के उत्तर पर: `discord voice: agent turn answer ...`
- सटीक भाषण को कतारबद्ध करने पर: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, जिसके बाद `discord voice: realtime exact speech dequeued reason=player-idle ...`
- बार्ज-इन पहचान पर: `discord voice: realtime barge-in detected source=speaker-start ...` या `discord voice: realtime barge-in detected source=active-speaker-audio ...`, जिसके बाद `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- रियलटाइम बाधा पर: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, जिसके बाद `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` या `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- प्रतिध्वनि/शोर अनदेखा करने पर: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- बार्ज-इन अक्षम होने पर: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- निष्क्रिय प्लेबैक पर: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

बीच में कटने वाले ऑडियो को डीबग करने के लिए, रियलटाइम वॉइस लॉग को समयरेखा के रूप में पढ़ें:

1. `realtime audio playback started` का अर्थ है कि Discord ने सहायक ऑडियो चलाना शुरू कर दिया है। इस बिंदु से ब्रिज सहायक आउटपुट खंडों, Discord PCM बाइट, प्रोवाइडर रियलटाइम बाइट और संश्लेषित ऑडियो अवधि की गणना शुरू करता है।
2. `realtime speaker turn opened` किसी Discord स्पीकर के सक्रिय होने को चिह्नित करता है। यदि प्लेबैक पहले से सक्रिय है और `bargeIn` सक्षम है, तो इसके बाद `barge-in detected source=speaker-start` आ सकता है।
3. `realtime input audio started` उस स्पीकर टर्न के लिए प्राप्त पहले वास्तविक ऑडियो फ़्रेम को चिह्नित करता है। यहाँ `outputActive=true` या शून्य से अधिक `outputAudioMs` का अर्थ है कि सहायक प्लेबैक के सक्रिय रहते हुए माइक इनपुट भेज रहा है।
4. `barge-in detected source=active-speaker-audio` का अर्थ है कि सहायक प्लेबैक सक्रिय रहते हुए OpenClaw ने लाइव स्पीकर ऑडियो देखा। यह वास्तविक बाधा को ऐसे Discord स्पीकर-प्रारंभ इवेंट से अलग करने के लिए उपयोगी है जिसमें कोई उपयोगी ऑडियो नहीं है।
5. `barge-in requested reason=...` का अर्थ है कि OpenClaw ने रियलटाइम प्रोवाइडर से सक्रिय प्रतिक्रिया रद्द करने या छोटा करने को कहा। इसमें `outputAudioMs`, `outputActive`, और `playbackChunks` शामिल हैं, ताकि आप देख सकें कि बाधा से पहले वास्तव में कितना सहायक ऑडियो चल चुका था।
6. `realtime audio playback stopped reason=...` स्थानीय Discord प्लेबैक रीसेट बिंदु है। कारण बताता है कि प्लेबैक किसने रोका: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, या `session-close`।
7. `realtime speaker turn closed` कैप्चर किए गए इनपुट टर्न का सारांश देता है। `chunks=0` या `hasAudio=false` का अर्थ है कि स्पीकर टर्न खुला, लेकिन कोई उपयोगी ऑडियो रियलटाइम ब्रिज तक नहीं पहुँचा। `interruptedPlayback=true` का अर्थ है कि वह इनपुट टर्न सहायक आउटपुट के साथ ओवरलैप हुआ और उसने बार्ज-इन तर्क ट्रिगर किया।

उपयोगी फ़ील्ड:

- `outputAudioMs`: लॉग पंक्ति से पहले रियलटाइम प्रोवाइडर द्वारा उत्पन्न सहायक ऑडियो की अवधि।
- `audioMs`: प्लेबैक रुकने से पहले OpenClaw द्वारा गिनी गई सहायक ऑडियो की अवधि।
- `elapsedMs`: प्लेबैक स्ट्रीम या स्पीकर टर्न खोलने और बंद करने के बीच का वास्तविक समय।
- `discordBytes`: Discord वॉइस को भेजे गए या उससे प्राप्त 48 kHz स्टीरियो PCM बाइट।
- `realtimeBytes`: रियलटाइम प्रोवाइडर को भेजे गए या उससे प्राप्त प्रोवाइडर-प्रारूप PCM बाइट।
- `playbackChunks`: सक्रिय प्रतिक्रिया के लिए Discord को अग्रेषित किए गए सहायक ऑडियो खंड।
- `sinceLastAudioMs`: अंतिम कैप्चर किए गए स्पीकर ऑडियो फ़्रेम और स्पीकर टर्न बंद होने के बीच का अंतराल।

सामान्य पैटर्न:

- `source=active-speaker-audio` के साथ तुरंत कट-ऑफ, छोटा `outputAudioMs`, और पास में वही उपयोगकर्ता आमतौर पर यह संकेत देते हैं कि स्पीकर की प्रतिध्वनि माइक में जा रही है। `voice.realtime.minBargeInAudioEndMs` बढ़ाएँ, स्पीकर की आवाज़ कम करें, हेडफ़ोन का उपयोग करें, या `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` सेट करें।
- `source=speaker-start` के बाद `speaker turn closed ... hasAudio=false` आने का अर्थ है कि Discord ने स्पीकर के बोलना शुरू करने की सूचना दी, लेकिन कोई ऑडियो OpenClaw तक नहीं पहुँचा। यह कोई अस्थायी Discord वॉइस इवेंट, नॉइज़ गेट व्यवहार, या क्लाइंट द्वारा माइक को थोड़ी देर के लिए सक्रिय करना हो सकता है।
- आस-पास कोई बीच में बोलना या `provider-clear-audio` न होने पर `audio playback stopped reason=stream-close` का अर्थ है कि स्थानीय Discord प्लेबैक स्ट्रीम अनपेक्षित रूप से समाप्त हो गई। इससे पहले के प्रोवाइडर और Discord प्लेयर लॉग जाँचें।
- `capture ignored during playback (barge-in disabled)` का अर्थ है कि सहायक का ऑडियो सक्रिय होने के दौरान OpenClaw ने जानबूझकर इनपुट छोड़ दिया। यदि आप चाहते हैं कि बोलने पर प्लेबैक बाधित हो, तो `voice.realtime.bargeIn` सक्षम करें।
- `barge-in ignored ... outputActive=false` का अर्थ है कि Discord या प्रोवाइडर VAD ने आवाज़ की सूचना दी, लेकिन OpenClaw के पास बाधित करने के लिए कोई सक्रिय प्लेबैक नहीं था। इससे ऑडियो कटना नहीं चाहिए।

क्रेडेंशियल प्रत्येक कॉम्पोनेंट के लिए अलग-अलग रिज़ॉल्व किए जाते हैं: `voice.model` के लिए LLM रूट प्रमाणीकरण, `tools.media.audio` के लिए STT प्रमाणीकरण, `messages.tts`/`voice.tts` के लिए TTS प्रमाणीकरण, और `voice.realtime.providers` या प्रोवाइडर के सामान्य प्रमाणीकरण कॉन्फ़िगरेशन के लिए रियलटाइम प्रोवाइडर प्रमाणीकरण।

### वॉइस संदेश

Discord वॉइस संदेश वेवफ़ॉर्म पूर्वावलोकन दिखाते हैं और उनके लिए OGG/Opus ऑडियो आवश्यक है। OpenClaw वेवफ़ॉर्म अपने आप जनरेट करता है, लेकिन निरीक्षण और रूपांतरण के लिए Gateway होस्ट पर `ffmpeg` और `ffprobe` आवश्यक हैं।

- एक **स्थानीय फ़ाइल पथ** दें (URL अस्वीकार किए जाते हैं)।
- टेक्स्ट सामग्री न दें (Discord एक ही पेलोड में टेक्स्ट + वॉइस संदेश अस्वीकार करता है)।
- कोई भी ऑडियो प्रारूप स्वीकार किया जाता है; OpenClaw आवश्यकता के अनुसार उसे OGG/Opus में बदल देता है।

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## समस्या निवारण

<AccordionGroup>
  <Accordion title="अस्वीकृत इंटेंट का उपयोग हुआ या बॉट को कोई गिल्ड संदेश नहीं दिखता">

    - Message Content Intent सक्षम करें
    - जब आप उपयोगकर्ता/सदस्य रिज़ॉल्यूशन पर निर्भर हों, तो Server Members Intent सक्षम करें
    - इंटेंट बदलने के बाद Gateway पुनः आरंभ करें

  </Accordion>

  <Accordion title="गिल्ड संदेश अनपेक्षित रूप से अवरुद्ध हैं">

    - `groupPolicy` सत्यापित करें
    - `channels.discord.guilds` के अंतर्गत गिल्ड अनुमति-सूची सत्यापित करें
    - यदि कोई गिल्ड `channels` मैप मौजूद है, तो केवल सूचीबद्ध चैनल अनुमत हैं
    - `requireMention` का व्यवहार और उल्लेख पैटर्न सत्यापित करें

    उपयोगी जाँचें:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false है, फिर भी अवरुद्ध है">
    सामान्य कारण:

    - मेल खाती गिल्ड/चैनल अनुमति-सूची के बिना `groupPolicy="allowlist"`
    - `requireMention` गलत स्थान पर कॉन्फ़िगर किया गया है (यह `channels.discord.guilds` या किसी चैनल प्रविष्टि के अंतर्गत होना चाहिए)
    - प्रेषक को गिल्ड/चैनल `users` अनुमति-सूची ने अवरुद्ध किया है

  </Accordion>

  <Accordion title="लंबे समय तक चलने वाले Discord टर्न या डुप्लिकेट उत्तर">

    सामान्य लॉग:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway कतार के नियंत्रण:

    - एकल-अकाउंट: `channels.discord.eventQueue.listenerTimeout`
    - बहु-अकाउंट: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - यह केवल Discord Gateway लिसनर के कार्य को नियंत्रित करता है, एजेंट टर्न की अवधि को नहीं

    Discord कतारबद्ध एजेंट टर्न पर चैनल-स्वामित्व वाला टाइमआउट लागू नहीं करता। संदेश लिसनर तुरंत कार्य सौंप देते हैं, और कतारबद्ध Discord रन तब तक प्रति-सत्र क्रम बनाए रखते हैं, जब तक सत्र/टूल/रनटाइम जीवनचक्र पूरा नहीं हो जाता या कार्य को निरस्त नहीं कर देता।

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway मेटाडेटा लुकअप टाइमआउट चेतावनियाँ">
    OpenClaw कनेक्ट करने से पहले Discord `/gateway/bot` मेटाडेटा प्राप्त करता है। अस्थायी विफलताओं पर Discord के डिफ़ॉल्ट Gateway URL का उपयोग किया जाता है और लॉग में दर-सीमा लागू होती है।

    मेटाडेटा टाइमआउट नियंत्रण:

    - एकल-अकाउंट: `channels.discord.gatewayInfoTimeoutMs`
    - बहु-अकाउंट: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - कॉन्फ़िगरेशन सेट न होने पर एनवायरनमेंट फ़ॉलबैक: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - डिफ़ॉल्ट: `30000` (30 सेकंड), अधिकतम: `120000`

  </Accordion>

  <Accordion title="Gateway READY टाइमआउट पुनः आरंभ">
    OpenClaw स्टार्टअप के दौरान और रनटाइम के पुनः कनेक्ट होने के बाद Discord के Gateway `READY` इवेंट की प्रतीक्षा करता है। क्रमिक स्टार्टअप वाले बहु-अकाउंट सेटअप के लिए डिफ़ॉल्ट से अधिक लंबी स्टार्टअप READY अवधि आवश्यक हो सकती है।

    READY टाइमआउट नियंत्रण:

    - स्टार्टअप एकल-अकाउंट: `channels.discord.gatewayReadyTimeoutMs`
    - स्टार्टअप बहु-अकाउंट: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - कॉन्फ़िगरेशन सेट न होने पर स्टार्टअप एनवायरनमेंट फ़ॉलबैक: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - स्टार्टअप डिफ़ॉल्ट: `15000` (15 सेकंड), अधिकतम: `120000`
    - रनटाइम एकल-अकाउंट: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - रनटाइम बहु-अकाउंट: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - कॉन्फ़िगरेशन सेट न होने पर रनटाइम एनवायरनमेंट फ़ॉलबैक: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - रनटाइम डिफ़ॉल्ट: `30000` (30 सेकंड), अधिकतम: `120000`

  </Accordion>

  <Accordion title="अनुमति ऑडिट में विसंगतियाँ">
    `channels status --probe` अनुमति जाँच केवल संख्यात्मक चैनल ID के लिए काम करती है।

    यदि आप स्लग कुंजियों का उपयोग करते हैं, तो रनटाइम मिलान फिर भी काम कर सकता है, लेकिन प्रोब अनुमतियों को पूरी तरह सत्यापित नहीं कर सकता।

  </Accordion>

  <Accordion title="DM और पेयरिंग संबंधी समस्याएँ">

    - DM अक्षम: `channels.discord.dm.enabled=false`
    - DM नीति अक्षम: `channels.discord.dmPolicy="disabled"` (लेगेसी: `channels.discord.dm.policy`)
    - `pairing` मोड में पेयरिंग स्वीकृति की प्रतीक्षा है

  </Accordion>

  <Accordion title="बॉट-से-बॉट लूप">
    डिफ़ॉल्ट रूप से बॉट द्वारा लिखे गए संदेशों को अनदेखा किया जाता है।

    यदि आप `channels.discord.allowBots=true` सेट करते हैं, तो लूप व्यवहार से बचने के लिए सख्त उल्लेख और अनुमति-सूची नियमों का उपयोग करें।
    केवल उन बॉट संदेशों को स्वीकार करने के लिए `channels.discord.allowBots="mentions"` को प्राथमिकता दें, जो बॉट का उल्लेख करते हैं।

    OpenClaw साझा [बॉट लूप सुरक्षा](/hi/channels/bot-loop-protection) भी प्रदान करता है। जब भी `allowBots` बॉट द्वारा लिखे गए संदेशों को डिस्पैच तक पहुँचने देता है, Discord इनबाउंड इवेंट को `(account, channel, bot pair)` तथ्यों में मैप करता है और कॉन्फ़िगर की गई इवेंट सीमा पार करने के बाद सामान्य युग्म गार्ड उस युग्म को दबा देता है। यह गार्ड अनियंत्रित दो-बॉट लूप को रोकता है, जिन्हें पहले Discord की दर-सीमाओं द्वारा रोकना पड़ता था; यह एकल-बॉट डिप्लॉयमेंट या सीमा के भीतर रहने वाले एकबारगी बॉट उत्तरों को प्रभावित नहीं करता।

    डिफ़ॉल्ट सेटिंग्स (`allowBots` सेट होने पर सक्रिय):

    - `maxEventsPerWindow: 20` -- बॉट युग्म स्लाइडिंग विंडो के भीतर 20 संदेशों का आदान-प्रदान कर सकता है
    - `windowSeconds: 60` -- स्लाइडिंग विंडो की अवधि
    - `cooldownSeconds: 60` -- सीमा सक्रिय होने के बाद, किसी भी दिशा में प्रत्येक अतिरिक्त बॉट-से-बॉट संदेश एक मिनट के लिए छोड़ दिया जाता है

    साझा डिफ़ॉल्ट को `channels.defaults.botLoopProtection` के अंतर्गत एक बार कॉन्फ़िगर करें, फिर किसी वैध कार्यप्रवाह को अधिक गुंजाइश की आवश्यकता होने पर Discord के लिए उसे ओवरराइड करें। प्राथमिकता क्रम है:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - अंतर्निहित डिफ़ॉल्ट

    Discord सामान्य `maxEventsPerWindow`, `windowSeconds`, और `cooldownSeconds` कुंजियों का उपयोग करता है।

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // वैकल्पिक Discord-व्यापी ओवरराइड। अकाउंट ब्लॉक अलग-अलग
      // फ़ील्ड को ओवरराइड करते हैं और यहाँ से छोड़े गए फ़ील्ड इनहेरिट करते हैं।
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha केवल तभी अन्य बॉट को सुनता है, जब वे उसका उल्लेख करते हैं।
          allowBots: "mentions",
        },
        bravo: {
          // Bravo बॉट द्वारा लिखे गए सभी Discord संदेशों को सुनता है।
          allowBots: true,
          mentionAliases: {
            // Bravo को कॉन्फ़िगर किए गए उपयोगकर्ता ID के साथ Alpha का Discord उल्लेख लिखने देता है।
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // युग्म को दबाने से पहले प्रति मिनट अधिकतम पाँच संदेशों की अनुमति दें।
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="DecryptionFailed(...) के साथ वॉइस STT छूटना">

    - OpenClaw को वर्तमान रखें (`openclaw update`), ताकि Discord वॉइस रिसीव रिकवरी लॉजिक उपलब्ध रहे
    - `channels.discord.voice.daveEncryption=true` की पुष्टि करें (डिफ़ॉल्ट)
    - `channels.discord.voice.decryptionFailureTolerance=24` (अपस्ट्रीम डिफ़ॉल्ट) से शुरू करें और केवल आवश्यकता होने पर समायोजित करें
    - इनके लिए लॉग देखें:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - यदि स्वचालित रूप से पुनः जुड़ने के बाद भी विफलताएँ जारी रहती हैं, तो लॉग एकत्र करें और उनकी तुलना [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) तथा [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) में दिए गए अपस्ट्रीम DAVE रिसीव इतिहास से करें

  </Accordion>
</AccordionGroup>

## कॉन्फ़िगरेशन संदर्भ

प्राथमिक संदर्भ: [कॉन्फ़िगरेशन संदर्भ - Discord](/hi/gateway/config-channels#discord)।

<Accordion title="उच्च-संकेत Discord फ़ील्ड">

- स्टार्टअप/प्रमाणीकरण: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- नीति: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- कमांड: `commands.native`, `commands.useAccessGroups` (वैश्विक), `configWrites`, `slashCommand.ephemeral`
- इवेंट कतार: `eventQueue.listenerTimeout` (लिसनर सीमा, डिफ़ॉल्ट `120000`), `eventQueue.maxQueueSize` (डिफ़ॉल्ट `10000`), `eventQueue.maxConcurrency` (डिफ़ॉल्ट `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- उत्तर/इतिहास: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- डिलीवरी: `textChunkLimit` (डिफ़ॉल्ट `2000`), `maxLinesPerMessage` (डिफ़ॉल्ट `17`)
- स्ट्रीमिंग: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (लेगेसी फ़्लैट `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` कुंजियों को `openclaw doctor --fix` द्वारा `streaming.*` में माइग्रेट किया जाता है)
- मीडिया/पुनः प्रयास: `mediaMaxMb` (आउटबाउंड Discord अपलोड सीमित करता है, डिफ़ॉल्ट `100`), `retry`
- क्रियाएँ: `actions.*`
- उपस्थिति: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- UI: `ui.components.accentColor`
- सुविधाएँ: `threadBindings`, शीर्ष-स्तरीय `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `activities`, `heartbeat`, `responsePrefix`

</Accordion>

### Discord Activities

एजेंट को Discord के भीतर खुलने वाले स्व-निहित HTML विजेट पोस्ट करने देने के लिए `channels.discord.activities` सेट करें। यह ब्लॉक ऑप्ट-इन है; इसके अनुपस्थित होने पर OpenClaw कोई Activity रूट, टूल या इंटरैक्शन हैंडलर पंजीकृत नहीं करता। Developer Portal, टनल, सुरक्षा और समस्या-निवारण सेटअप के लिए [Discord Activities](/channels/discord-activities) देखें।

- `activities.clientSecret`: Discord एप्लिकेशन के लिए OAuth2 क्लाइंट सीक्रेट; उपलब्ध न होने पर `DISCORD_CLIENT_SECRET` का उपयोग करता है
- `activities.applicationId`: वैकल्पिक Activity एप्लिकेशन ID; डिफ़ॉल्ट रूप से Gateway स्टार्टअप पर ज्ञात हुए बॉट एप्लिकेशन ID का उपयोग करता है

## सुरक्षा और संचालन

- बॉट टोकन को सीक्रेट मानें (`DISCORD_BOT_TOKEN` पर्यवेक्षित परिवेशों में वरीय)।
- Discord को न्यूनतम-विशेषाधिकार अनुमतियाँ प्रदान करें।
- यदि कमांड परिनियोजन/स्थिति पुरानी है, तो Gateway को पुनः आरंभ करें और `openclaw channels status --probe` से दोबारा जाँचें।

## संबंधित

<CardGroup cols={2}>
  <Card title="Discord गतिविधियाँ" icon="window" href="/channels/discord-activities">
    Discord के भीतर इंटरैक्टिव HTML विजेट लॉन्च करें।
  </Card>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    किसी Discord उपयोगकर्ता को Gateway से पेयर करें।
  </Card>
  <Card title="समूह" icon="users" href="/hi/channels/groups">
    समूह चैट और अनुमत-सूची का व्यवहार।
  </Card>
  <Card title="चैनल रूटिंग" icon="route" href="/hi/channels/channel-routing">
    आने वाले संदेशों को एजेंटों तक रूट करें।
  </Card>
  <Card title="सुरक्षा" icon="shield" href="/hi/gateway/security">
    खतरा मॉडल और सुदृढ़ीकरण।
  </Card>
  <Card title="मल्टी-एजेंट रूटिंग" icon="sitemap" href="/hi/concepts/multi-agent">
    गिल्ड और चैनलों को एजेंटों से मैप करें।
  </Card>
  <Card title="स्लैश कमांड" icon="terminal" href="/hi/tools/slash-commands">
    नेटिव कमांड का व्यवहार।
  </Card>
</CardGroup>
