---
read_when:
    - Discord चैनल सुविधाओं पर काम करना
summary: Discord bot समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Discord
x-i18n:
    generated_at: "2026-06-28T22:34:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

आधिकारिक Discord Gateway के ज़रिए DMs और गिल्ड चैनलों के लिए तैयार।

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Discord DMs डिफ़ॉल्ट रूप से पेयरिंग मोड में रहते हैं।
  </Card>
  <Card title="Slash commands" icon="terminal" href="/hi/tools/slash-commands">
    मूल कमांड व्यवहार और कमांड कैटलॉग।
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल डायग्नोस्टिक्स और मरम्मत फ़्लो।
  </Card>
</CardGroup>

## त्वरित सेटअप

आपको बॉट के साथ एक नया एप्लिकेशन बनाना होगा, बॉट को अपने सर्वर में जोड़ना होगा, और उसे OpenClaw से पेयर करना होगा। हम आपका बॉट अपने निजी सर्वर में जोड़ने की सलाह देते हैं। अगर आपके पास अभी सर्वर नहीं है, तो [पहले एक बनाएं](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** चुनें)।

<Steps>
  <Step title="Create a Discord application and bot">
    [Discord Developer Portal](https://discord.com/developers/applications) पर जाएं और **New Application** पर क्लिक करें। इसका नाम "OpenClaw" जैसा कुछ रखें।

    साइडबार में **Bot** पर क्लिक करें। **Username** को वही सेट करें जो आप अपने OpenClaw एजेंट को कहते हैं।

  </Step>

  <Step title="Enable privileged intents">
    अभी भी **Bot** पेज पर, नीचे **Privileged Gateway Intents** तक स्क्रॉल करें और सक्षम करें:

    - **Message Content Intent** (आवश्यक)
    - **Server Members Intent** (अनुशंसित; भूमिका अनुमति-सूचियों और नाम-से-ID मिलान के लिए आवश्यक)
    - **Presence Intent** (वैकल्पिक; केवल उपस्थिति अपडेट के लिए आवश्यक)

  </Step>

  <Step title="Copy your bot token">
    **Bot** पेज पर वापस ऊपर स्क्रॉल करें और **Reset Token** पर क्लिक करें।

    <Note>
    नाम के बावजूद, यह आपका पहला टोकन बनाता है — कुछ भी "रीसेट" नहीं किया जा रहा है।
    </Note>

    टोकन कॉपी करें और उसे कहीं सुरक्षित रखें। यह आपका **Bot Token** है और थोड़ी देर में आपको इसकी ज़रूरत होगी।

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    साइडबार में **OAuth2** पर क्लिक करें। आप बॉट को अपने सर्वर में जोड़ने के लिए सही अनुमतियों वाला आमंत्रण URL बनाएंगे।

    नीचे **OAuth2 URL Generator** तक स्क्रॉल करें और सक्षम करें:

    - `bot`
    - `applications.commands`

    नीचे एक **Bot Permissions** सेक्शन दिखाई देगा। कम से कम इन्हें सक्षम करें:

    **सामान्य अनुमतियां**
      - चैनल देखें
    **टेक्स्ट अनुमतियां**
      - संदेश भेजें
      - संदेश इतिहास पढ़ें
      - लिंक एम्बेड करें
      - फ़ाइलें अटैच करें
      - प्रतिक्रियाएं जोड़ें (वैकल्पिक)

    यह सामान्य टेक्स्ट चैनलों के लिए आधारभूत सेट है। अगर आप Discord थ्रेड में पोस्ट करने की योजना बनाते हैं, जिसमें फ़ोरम या मीडिया चैनल वर्कफ़्लो शामिल हैं जो थ्रेड बनाते हैं या जारी रखते हैं, तो **Send Messages in Threads** भी सक्षम करें।
    नीचे जनरेट किया गया URL कॉपी करें, उसे अपने ब्राउज़र में पेस्ट करें, अपना सर्वर चुनें, और कनेक्ट करने के लिए **Continue** पर क्लिक करें। अब आपको Discord सर्वर में अपना बॉट दिखना चाहिए।

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Discord ऐप में वापस, आपको Developer Mode सक्षम करना होगा ताकि आप आंतरिक IDs कॉपी कर सकें।

    1. **User Settings** (अपने अवतार के पास गियर आइकन) पर क्लिक करें → साइडबार में **Developer** तक स्क्रॉल करें → **Developer Mode** चालू करें

        *(नोट: Discord मोबाइल ऐप में, Developer Mode **App Settings** → **Advanced** के अंतर्गत है)*

    2. साइडबार में अपने **सर्वर आइकन** पर राइट-क्लिक करें → **Copy Server ID**
    3. अपने **स्वयं के अवतार** पर राइट-क्लिक करें → **Copy User ID**

    अपने **Server ID** और **User ID** को अपने Bot Token के साथ सहेजें — अगले चरण में आप ये तीनों OpenClaw को भेजेंगे।

  </Step>

  <Step title="Allow DMs from server members">
    पेयरिंग के लिए, Discord को आपके बॉट को आपको DM भेजने की अनुमति देनी होगी। अपने **सर्वर आइकन** पर राइट-क्लिक करें → **Privacy Settings** → **Direct Messages** चालू करें।

    इससे सर्वर सदस्य (बॉट सहित) आपको DMs भेज सकते हैं। अगर आप OpenClaw के साथ Discord DMs का उपयोग करना चाहते हैं, तो इसे सक्षम रखें। अगर आप केवल गिल्ड चैनलों का उपयोग करने की योजना बनाते हैं, तो पेयरिंग के बाद DMs अक्षम कर सकते हैं।

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    आपका Discord बॉट टोकन एक सीक्रेट है (पासवर्ड जैसा)। अपने एजेंट को संदेश भेजने से पहले इसे OpenClaw चलाने वाली मशीन पर सेट करें।

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

    अगर OpenClaw पहले से बैकग्राउंड सेवा के रूप में चल रहा है, तो उसे OpenClaw Mac ऐप से या `openclaw gateway run` प्रक्रिया को रोककर और फिर से शुरू करके रीस्टार्ट करें।
    प्रबंधित सेवा इंस्टॉल के लिए, ऐसे shell से `openclaw gateway install` चलाएं जहां `DISCORD_BOT_TOKEN` मौजूद हो, या वैरिएबल को `~/.openclaw/.env` में स्टोर करें, ताकि सेवा रीस्टार्ट के बाद env SecretRef को रिज़ॉल्व कर सके।
    अगर आपका होस्ट Discord के स्टार्टअप एप्लिकेशन लुकअप से ब्लॉक या rate-limit हो रहा है, तो Developer Portal से Discord एप्लिकेशन/client ID सेट करें ताकि स्टार्टअप उस REST कॉल को छोड़ सके। डिफ़ॉल्ट अकाउंट के लिए `channels.discord.applicationId` का उपयोग करें, या जब आप कई Discord बॉट चलाते हैं तो `channels.discord.accounts.<accountId>.applicationId` का उपयोग करें।

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        किसी भी मौजूदा चैनल (जैसे Telegram) पर अपने OpenClaw एजेंट से चैट करें और उसे बताएं। अगर Discord आपका पहला चैनल है, तो इसके बजाय CLI / config टैब का उपयोग करें।

        > "मैंने अपना Discord बॉट टोकन पहले ही config में सेट कर दिया है। कृपया User ID `<user_id>` और Server ID `<server_id>` के साथ Discord सेटअप पूरा करें।"
      </Tab>
      <Tab title="CLI / config">
        अगर आप फ़ाइल-आधारित config पसंद करते हैं, तो सेट करें:

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

        डिफ़ॉल्ट अकाउंट के लिए env fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        स्क्रिप्टेड या रिमोट सेटअप के लिए, वही JSON5 ब्लॉक `openclaw config patch --file ./discord.patch.json5 --dry-run` के साथ लिखें और फिर `--dry-run` के बिना दोबारा चलाएं। Plaintext `token` मान समर्थित हैं। env/file/exec providers में `channels.discord.token` के लिए SecretRef मान भी समर्थित हैं। [Secrets Management](/hi/gateway/secrets) देखें।

        कई Discord बॉट के लिए, प्रत्येक बॉट टोकन और एप्लिकेशन ID को उसके अकाउंट के अंतर्गत रखें। शीर्ष-स्तरीय `channels.discord.applicationId` अकाउंट्स द्वारा inherited होता है, इसलिए इसे वहां केवल तभी सेट करें जब हर अकाउंट को वही एप्लिकेशन ID उपयोग करनी हो।

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

  <Step title="Approve first DM pairing">
    Gateway चलने तक प्रतीक्षा करें, फिर Discord में अपने बॉट को DM करें। वह पेयरिंग कोड के साथ जवाब देगा।

    <Tabs>
      <Tab title="Ask your agent">
        अपने मौजूदा चैनल पर पेयरिंग कोड अपने एजेंट को भेजें:

        > "इस Discord पेयरिंग कोड को मंज़ूर करें: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    पेयरिंग कोड 1 घंटे के बाद समाप्त हो जाते हैं।

    अब आपको DM के ज़रिए Discord में अपने एजेंट से चैट कर पाना चाहिए।

  </Step>
</Steps>

<Note>
टोकन रिज़ॉल्यूशन अकाउंट-जागरूक है। Config टोकन मान env fallback पर प्राथमिकता पाते हैं। `DISCORD_BOT_TOKEN` केवल डिफ़ॉल्ट अकाउंट के लिए उपयोग होता है।
अगर दो सक्षम Discord अकाउंट एक ही बॉट टोकन पर रिज़ॉल्व होते हैं, तो OpenClaw उस टोकन के लिए केवल एक Gateway मॉनिटर शुरू करता है। config-sourced टोकन डिफ़ॉल्ट env fallback पर प्राथमिकता पाता है; अन्यथा पहला सक्षम अकाउंट प्राथमिकता पाता है और डुप्लिकेट अकाउंट disabled के रूप में रिपोर्ट होता है।
उन्नत outbound calls (message tool/channel actions) के लिए, स्पष्ट per-call `token` उस कॉल के लिए उपयोग होता है। यह send और read/probe-style actions पर लागू होता है (उदाहरण के लिए read/search/fetch/thread/pins/permissions)। अकाउंट नीति/retry सेटिंग्स अब भी सक्रिय runtime snapshot में चुने गए अकाउंट से आती हैं।
</Note>

## अनुशंसित: गिल्ड workspace सेट करें

DMs काम करने लगें, तो आप अपने Discord सर्वर को पूर्ण workspace के रूप में सेट कर सकते हैं, जहां प्रत्येक चैनल को अपने context के साथ अपना एजेंट session मिलता है। यह उन निजी सर्वरों के लिए अनुशंसित है जहां केवल आप और आपका बॉट हैं।

<Steps>
  <Step title="Add your server to the guild allowlist">
    इससे आपका एजेंट केवल DMs ही नहीं, बल्कि आपके सर्वर के किसी भी चैनल में जवाब दे सकता है।

    <Tabs>
      <Tab title="Ask your agent">
        > "मेरे Discord Server ID `<server_id>` को guild allowlist में जोड़ें"
      </Tab>
      <Tab title="Config">

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

  <Step title="Allow responses without @mention">
    डिफ़ॉल्ट रूप से, आपका एजेंट गिल्ड चैनलों में केवल @mentioned होने पर जवाब देता है। निजी सर्वर के लिए, आप शायद चाहते हैं कि वह हर संदेश का जवाब दे।

    गिल्ड चैनलों में, सामान्य replies डिफ़ॉल्ट रूप से अपने-आप पोस्ट होते हैं। साझा always-on rooms के लिए, `messages.groupChat.visibleReplies: "message_tool"` में opt in करें ताकि एजेंट lurk कर सके और केवल तभी पोस्ट करे जब वह तय करे कि चैनल reply उपयोगी है। यह GPT 5.5 जैसे latest-generation, tool-reliable models के साथ सबसे अच्छा काम करता है। Ambient room events शांत रहते हैं जब तक tool न भेजे। पूर्ण lurk-mode config के लिए [Ambient room events](/hi/channels/ambient-room-events) देखें।

    अगर Discord typing दिखाता है और logs में token usage दिखता है लेकिन कोई posted message नहीं है, तो जांचें कि turn ambient room event के रूप में configured था या message-tool visible replies में opt in किया गया था।

    <Tabs>
      <Tab title="Ask your agent">
        > "मेरे एजेंट को इस सर्वर पर @mentioned होने की ज़रूरत के बिना जवाब देने दें"
      </Tab>
      <Tab title="Config">
        अपने guild config में `requireMention: false` सेट करें:

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

        दिखने वाले group/channel replies के लिए message-tool sends आवश्यक करने हेतु, `messages.groupChat.visibleReplies: "message_tool"` सेट करें।

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    डिफ़ॉल्ट रूप से, long-term memory (MEMORY.md) केवल DM sessions में load होती है। Guild channels MEMORY.md को auto-load नहीं करते।

    <Tabs>
      <Tab title="Ask your agent">
        > "जब मैं Discord channels में प्रश्न पूछूं, तो अगर आपको MEMORY.md से long-term context चाहिए तो memory_search या memory_get का उपयोग करें।"
      </Tab>
      <Tab title="Manual">
        अगर आपको हर चैनल में shared context चाहिए, तो स्थिर निर्देश `AGENTS.md` या `USER.md` में रखें (वे हर session के लिए injected होते हैं)। long-term notes को `MEMORY.md` में रखें और memory tools से मांग पर access करें।
      </Tab>
    </Tabs>

  </Step>
</Steps>

अब अपने Discord सर्वर पर कुछ चैनल बनाएं और चैट करना शुरू करें। आपका एजेंट चैनल का नाम देख सकता है, और प्रत्येक चैनल को अपना isolated session मिलता है — इसलिए आप `#coding`, `#home`, `#research`, या अपने workflow के अनुकूल कुछ भी सेट कर सकते हैं।

## Runtime model

- Gateway Discord कनेक्शन का स्वामी है।
- उत्तर रूटिंग निर्धारक है: Discord से आने वाले उत्तर वापस Discord पर जाते हैं।
- Discord guild/channel मेटाडेटा को मॉडल प्रॉम्प्ट में अविश्वसनीय
  संदर्भ के रूप में जोड़ा जाता है, न कि उपयोगकर्ता को दिखने वाले उत्तर प्रीफिक्स के रूप में। यदि कोई मॉडल उस एनवलप को
  वापस कॉपी करता है, तो OpenClaw आउटबाउंड उत्तरों और
  भविष्य के रीप्ले संदर्भ से कॉपी किया गया मेटाडेटा हटा देता है।
- डिफ़ॉल्ट रूप से (`session.dmScope=main`), सीधे चैट एजेंट मुख्य सत्र (`agent:main:main`) साझा करते हैं।
- Guild चैनल अलग-थलग सत्र कुंजियां हैं (`agent:<agentId>:discord:channel:<channelId>`)।
- Group DMs डिफ़ॉल्ट रूप से अनदेखे किए जाते हैं (`channels.discord.dm.groupEnabled=false`)।
- नेटिव slash commands अलग-थलग कमांड सत्रों (`agent:<agentId>:discord:slash:<userId>`) में चलते हैं, जबकि रूट की गई बातचीत के सत्र तक `CommandTargetSessionKey` अब भी ले जाते हैं।
- Discord को टेक्स्ट-केवल cron/heartbeat घोषणा डिलीवरी अंतिम
  assistant-visible उत्तर का एक बार उपयोग करती है। Media और संरचित component payloads तब
  बहु-संदेश बने रहते हैं जब एजेंट कई deliverable payloads उत्सर्जित करता है।

## Forum चैनल

Discord forum और media चैनल केवल thread posts स्वीकार करते हैं। OpenClaw उन्हें बनाने के दो तरीकों का समर्थन करता है:

- thread को अपने-आप बनाने के लिए forum parent (`channel:<forumId>`) को संदेश भेजें। thread title आपके संदेश की पहली गैर-खाली पंक्ति का उपयोग करता है।
- thread सीधे बनाने के लिए `openclaw message thread create` का उपयोग करें। forum चैनलों के लिए `--message-id` पास न करें।

उदाहरण: thread बनाने के लिए forum parent को भेजें

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

उदाहरण: forum thread स्पष्ट रूप से बनाएं

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum parents Discord components स्वीकार नहीं करते। यदि आपको components चाहिए, तो thread पर ही भेजें (`channel:<threadId>`)।

## Interactive components

OpenClaw एजेंट संदेशों के लिए Discord components v2 containers का समर्थन करता है। `components` payload के साथ message tool का उपयोग करें। Interaction परिणाम सामान्य inbound messages के रूप में एजेंट को वापस रूट किए जाते हैं और मौजूदा Discord `replyToMode` सेटिंग्स का पालन करते हैं।

समर्थित blocks:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action rows 5 buttons तक या एक single select menu की अनुमति देते हैं
- Select types: `string`, `user`, `role`, `mentionable`, `channel`

डिफ़ॉल्ट रूप से, components single use होते हैं। buttons, selects, और forms को समाप्त होने तक कई बार उपयोग करने की अनुमति देने के लिए `components.reusable=true` सेट करें।

कौन button क्लिक कर सकता है इसे सीमित करने के लिए, उस button पर `allowedUsers` सेट करें (Discord user IDs, tags, या `*`)। कॉन्फ़िगर होने पर, मेल न खाने वाले उपयोगकर्ताओं को ephemeral denial मिलता है।

Component callbacks डिफ़ॉल्ट रूप से 30 मिनट बाद समाप्त हो जाते हैं। डिफ़ॉल्ट Discord account के लिए उस callback registry lifetime को बदलने के लिए `channels.discord.agentComponents.ttlMs` सेट करें, या multi-account setup में एक account को override करने के लिए `channels.discord.accounts.<accountId>.agentComponents.ttlMs` सेट करें। मान milliseconds में है, positive integer होना चाहिए, और `86400000` (24 घंटे) पर capped है। Longer TTLs review या approval workflows के लिए उपयोगी हैं जिन्हें buttons को usable बनाए रखना होता है, लेकिन वे उस window को भी बढ़ाते हैं जहां पुराना Discord message अभी भी action trigger कर सकता है। workflow के अनुकूल सबसे छोटा TTL प्राथमिकता दें, और जब stale callbacks चौंकाने वाले हों तब default बनाए रखें।

`/model` और `/models` slash commands provider, model, और compatible runtime dropdowns plus Submit step के साथ interactive model picker खोलते हैं। `/models add` deprecated है और अब chat से models register करने के बजाय deprecation message लौटाता है। picker reply ephemeral है और केवल invoke करने वाला user इसका उपयोग कर सकता है। Discord select menus 25 options तक सीमित हैं, इसलिए जब आप picker में dynamically discovered models केवल चुने गए providers जैसे `openai` या `vllm` के लिए दिखाना चाहते हैं, तो `agents.defaults.models` में `provider/*` entries जोड़ें।

File attachments:

- `file` blocks को attachment reference (`attachment://<filename>`) की ओर संकेत करना चाहिए
- attachment `media`/`path`/`filePath` (single file) के माध्यम से दें; multiple files के लिए `media-gallery` का उपयोग करें
- जब upload name attachment reference से match करना चाहिए, तो उसे override करने के लिए `filename` का उपयोग करें

Modal forms:

- 5 fields तक के साथ `components.modal` जोड़ें
- Field types: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw trigger button अपने-आप जोड़ता है

उदाहरण:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Access control और routing

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` DM access को नियंत्रित करता है। `channels.discord.allowFrom` canonical DM allowlist है।

    - `pairing` (default)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` में `"*"` शामिल होना आवश्यक है)
    - `disabled`

    यदि DM policy open नहीं है, तो unknown users block किए जाते हैं (या `pairing` mode में pairing के लिए prompt किए जाते हैं)।

    Multi-account precedence:

    - `channels.discord.accounts.default.allowFrom` केवल `default` account पर लागू होता है।
    - एक account के लिए, `allowFrom` legacy `dm.allowFrom` पर precedence लेता है।
    - Named accounts `channels.discord.allowFrom` inherit करते हैं जब उनका अपना `allowFrom` और legacy `dm.allowFrom` unset हो।
    - Named accounts `channels.discord.accounts.default.allowFrom` inherit नहीं करते।

    Legacy `channels.discord.dm.policy` और `channels.discord.dm.allowFrom` अभी भी compatibility के लिए read होते हैं। `openclaw doctor --fix` उन्हें `dmPolicy` और `allowFrom` में migrate करता है जब वह access बदले बिना ऐसा कर सकता है।

    delivery के लिए DM target format:

    - `user:<id>`
    - `<@id>` mention

    Bare numeric IDs सामान्यतः channel default active होने पर channel IDs के रूप में resolve होते हैं, लेकिन account के effective DM `allowFrom` में listed IDs compatibility के लिए user DM targets के रूप में treat किए जाते हैं।

  </Tab>

  <Tab title="Access groups">
    Discord DMs और text command authorization `channels.discord.allowFrom` में dynamic `accessGroup:<name>` entries का उपयोग कर सकते हैं।

    Access group names message channels में shared होते हैं। static group के लिए `type: "message.senders"` का उपयोग करें, जिसके members प्रत्येक channel की normal `allowFrom` syntax में expressed होते हैं, या जब Discord channel का current `ViewChannel` audience dynamically membership define करना चाहिए तब `type: "discord.channelAudience"` का उपयोग करें। Shared access-group behavior यहां documented है: [Access groups](/hi/channels/access-groups).

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

    Discord text channel की कोई अलग member list नहीं होती। `type: "discord.channelAudience"` membership को इस तरह model करता है: DM sender configured guild का member है और role तथा channel overwrites apply होने के बाद configured channel पर currently effective `ViewChannel` permission रखता है।

    उदाहरण: जो कोई भी `#maintainers` देख सकता है उसे bot को DM करने दें, जबकि DMs बाकी सभी के लिए बंद रखें।

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

    आप dynamic और static entries मिला सकते हैं:

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

    Lookups fail closed होते हैं। यदि Discord `Missing Access` लौटाता है, member lookup fail होता है, या channel किसी अलग guild से संबंधित है, तो DM sender को unauthorized treat किया जाता है।

    channel-audience access groups का उपयोग करते समय bot के लिए Discord Developer Portal **Server Members Intent** enable करें। DMs में guild member state शामिल नहीं होती, इसलिए OpenClaw authorization time पर Discord REST के माध्यम से member resolve करता है।

  </Tab>

  <Tab title="Guild policy">
    Guild handling `channels.discord.groupPolicy` द्वारा नियंत्रित होता है:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` मौजूद होने पर secure baseline `allowlist` है।

    `allowlist` behavior:

    - guild को `channels.discord.guilds` से match करना चाहिए (`id` preferred, slug accepted)
    - optional sender allowlists: `users` (stable IDs recommended) और `roles` (role IDs only); यदि दोनों में से कोई configured है, तो senders तब allowed हैं जब वे `users` OR `roles` से match करें
    - direct name/tag matching default रूप से disabled है; `channels.discord.dangerouslyAllowNameMatching: true` केवल break-glass compatibility mode के रूप में enable करें
    - `users` के लिए names/tags supported हैं, लेकिन IDs safer हैं; name/tag entries used होने पर `openclaw security audit` warning देता है
    - यदि guild में `channels` configured हैं, तो non-listed channels denied हैं
    - यदि guild में कोई `channels` block नहीं है, तो उस allowlisted guild के सभी channels allowed हैं

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
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    यदि आप केवल `DISCORD_BOT_TOKEN` सेट करते हैं और `channels.discord` block नहीं बनाते, तो runtime fallback `groupPolicy="allowlist"` होता है (logs में warning के साथ), भले ही `channels.defaults.groupPolicy` `open` हो।

  </Tab>

  <Tab title="Mentions and group DMs">
    Guild messages default रूप से mention-gated होते हैं।

    Mention detection में शामिल हैं:

    - explicit bot mention
    - configured mention patterns (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - supported cases में implicit reply-to-bot behavior

    outbound Discord messages लिखते समय, canonical mention syntax का उपयोग करें: users के लिए `<@USER_ID>`, channels के लिए `<#CHANNEL_ID>`, और roles के लिए `<@&ROLE_ID>`। legacy `<@!USER_ID>` nickname mention form का उपयोग न करें।

    `requireMention` per guild/channel configured है (`channels.discord.guilds...`)।
    `ignoreOtherMentions` optionally उन messages को drop करता है जो दूसरे user/role को mention करते हैं लेकिन bot को नहीं (excluding @everyone/@here)।

    Group DMs:

    - default: ignored (`dm.groupEnabled=false`)
    - optional allowlist via `dm.groupChannels` (channel IDs or slugs)

  </Tab>
</Tabs>

### Role-based agent routing

Discord guild सदस्यों को role ID के आधार पर अलग-अलग एजेंटों तक रूट करने के लिए `bindings[].match.roles` का उपयोग करें। भूमिका-आधारित bindings केवल role IDs स्वीकार करते हैं और peer या parent-peer bindings के बाद तथा guild-only bindings से पहले मूल्यांकित होते हैं। यदि कोई binding अन्य match फ़ील्ड भी सेट करती है (उदाहरण के लिए `peer` + `guildId` + `roles`), तो सभी कॉन्फ़िगर किए गए फ़ील्ड का मिलना ज़रूरी है।

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

## मूल commands और command auth

- `commands.native` का डिफ़ॉल्ट `"auto"` है और यह Discord के लिए सक्षम है।
- प्रति-channel override: `channels.discord.commands.native`।
- `commands.native=false` startup के दौरान Discord slash-command registration और cleanup को छोड़ देता है। पहले से registered commands Discord में तब तक दिखाई दे सकते हैं जब तक आप उन्हें Discord app से हटा नहीं देते।
- मूल command auth सामान्य message handling जैसी ही Discord allowlists/policies का उपयोग करता है।
- Commands उन उपयोगकर्ताओं के लिए भी Discord UI में दिखाई दे सकते हैं जो authorized नहीं हैं; execution फिर भी OpenClaw auth लागू करता है और "अधिकृत नहीं" लौटाता है।

command catalog और behavior के लिए [Slash commands](/hi/tools/slash-commands) देखें।

डिफ़ॉल्ट slash command settings:

- `ephemeral: true`

## सुविधा विवरण

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord agent output में reply tags का समर्थन करता है:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` द्वारा नियंत्रित:

    - `off` (डिफ़ॉल्ट)
    - `first`
    - `all`
    - `batched`

    नोट: `off` implicit reply threading को अक्षम करता है। Explicit `[[reply_to_*]]` tags फिर भी मान्य रहते हैं।
    `first` हमेशा turn के पहले outbound Discord message में implicit native reply reference जोड़ता है।
    `batched` Discord के implicit native reply reference को केवल तब जोड़ता है जब
    inbound event कई messages का debounced batch था। यह तब उपयोगी है
    जब आप native replies मुख्य रूप से ambiguous bursty chats के लिए चाहते हैं, हर
    single-message turn के लिए नहीं।

    Message IDs context/history में surfaced होते हैं ताकि agents specific messages को target कर सकें।

  </Accordion>

  <Accordion title="Link previews">
    Discord डिफ़ॉल्ट रूप से URLs के लिए rich link embeds बनाता है। OpenClaw डिफ़ॉल्ट रूप से outbound Discord messages पर उन generated embeds को suppress करता है, ताकि agent-sent URLs plain links बने रहें जब तक आप opt in न करें:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    एक account को override करने के लिए `channels.discord.accounts.<id>.suppressEmbeds` सेट करें। Agent message-tool sends किसी single message के लिए `suppressEmbeds: false` भी pass कर सकते हैं। Explicit Discord `embeds` payloads डिफ़ॉल्ट link-preview setting से suppressed नहीं होते।

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw temporary message भेजकर और text आने पर उसे edit करके draft replies stream कर सकता है। `channels.discord.streaming` `off` | `partial` | `block` | `progress` (डिफ़ॉल्ट) लेता है। `progress` एक editable status draft रखता है और final delivery तक उसे tool progress से update करता है; shared starter label एक rolling line है, इसलिए पर्याप्त काम दिखाई देने पर यह बाकी के साथ scroll away हो जाता है। `streamMode` legacy runtime alias है। persisted config को canonical key में rewrite करने के लिए `openclaw doctor --fix` चलाएँ।

    Discord preview edits अक्षम करने के लिए `channels.discord.streaming.mode` को `off` पर सेट करें। यदि Discord block streaming explicitly enabled है, तो OpenClaw double-streaming से बचने के लिए preview stream छोड़ देता है।

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` tokens आने पर एक single preview message को edit करता है।
    - `block` draft-sized chunks emit करता है (size और breakpoints tune करने के लिए `draftChunk` उपयोग करें, `textChunkLimit` तक clamped)।
    - Media, error, और explicit-reply finals pending preview edits cancel करते हैं।
    - `streaming.preview.toolProgress` (डिफ़ॉल्ट `true`) नियंत्रित करता है कि tool/progress updates preview message reuse करते हैं या नहीं।
    - Tool/progress rows उपलब्ध होने पर compact emoji + title + detail के रूप में render होते हैं, उदाहरण के लिए `🛠️ Bash: run tests` या `🔎 Web Search: for "query"`।
    - `streaming.progress.commentary` (डिफ़ॉल्ट `false`) temporary progress draft में assistant commentary/preamble text के लिए opt in करता है। Commentary display से पहले clean की जाती है, transient रहती है, और final answer delivery नहीं बदलती।
    - `streaming.progress.maxLineChars` per-line progress preview budget नियंत्रित करता है। Prose word boundaries पर shortened होता है; command और path details उपयोगी suffixes रखते हैं।
    - `streaming.preview.commandText` / `streaming.progress.commandText` compact progress lines में command/exec detail नियंत्रित करता है: `raw` (डिफ़ॉल्ट) या `status` (केवल tool label)।

    compact progress lines रखते हुए raw command/exec text छिपाएँ:

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

    Preview streaming केवल text-only है; media replies normal delivery पर fall back करते हैं। जब `block` streaming explicitly enabled हो, तो OpenClaw double-streaming से बचने के लिए preview stream छोड़ देता है।

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Guild history context:

    - `channels.discord.historyLimit` डिफ़ॉल्ट `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` अक्षम करता है

    DM history controls:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread behavior:

    - Discord threads channel sessions के रूप में route होते हैं और override न होने पर parent channel config inherit करते हैं।
    - Thread sessions parent channel के session-level `/model` selection को model-only fallback के रूप में inherit करते हैं; thread-local `/model` selections फिर भी precedence लेते हैं और transcript inheritance enabled न हो तो parent transcript history copy नहीं होती।
    - `channels.discord.thread.inheritParent` (डिफ़ॉल्ट `false`) नए auto-threads को parent transcript से seeding के लिए opt in करता है। Per-account overrides `channels.discord.accounts.<id>.thread.inheritParent` के अंतर्गत होते हैं।
    - Message-tool reactions `user:<id>` DM targets resolve कर सकते हैं।
    - `guilds.<guild>.channels.<channel>.requireMention: false` reply-stage activation fallback के दौरान preserved रहता है।

    Channel topics **अविश्वसनीय** context के रूप में inject किए जाते हैं। Allowlists यह gate करती हैं कि agent को कौन trigger कर सकता है, वे full supplemental-context redaction boundary नहीं हैं।

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord किसी thread को session target से bind कर सकता है ताकि उस thread में follow-up messages उसी session (subagent sessions सहित) तक route होते रहें।

    Commands:

    - `/focus <target>` current/new thread को subagent/session target से bind करें
    - `/unfocus` current thread binding हटाएँ
    - `/agents` active runs और binding state दिखाएँ
    - `/session idle <duration|off>` focused bindings के लिए inactivity auto-unfocus inspect/update करें
    - `/session max-age <duration|off>` focused bindings के लिए hard max age inspect/update करें

    Config:

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

    नोट्स:

    - `session.threadBindings.*` global defaults सेट करता है।
    - `channels.discord.threadBindings.*` Discord behavior override करता है।
    - `spawnSessions` `sessions_spawn({ thread: true })` और ACP thread spawns के लिए auto-create/bind threads नियंत्रित करता है। डिफ़ॉल्ट: `true`।
    - `defaultSpawnContext` thread-bound spawns के लिए native subagent context नियंत्रित करता है। डिफ़ॉल्ट: `"fork"`।
    - Deprecated `spawnSubagentSessions`/`spawnAcpSessions` keys `openclaw doctor --fix` द्वारा migrate की जाती हैं।
    - यदि किसी account के लिए thread bindings disabled हैं, तो `/focus` और related thread binding operations unavailable होते हैं।

    [Sub-agents](/hi/tools/subagents), [ACP Agents](/hi/tools/acp-agents), और [Configuration Reference](/hi/gateway/configuration-reference) देखें।

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Stable "always-on" ACP workspaces के लिए, Discord conversations को target करने वाली top-level typed ACP bindings configure करें।

    Config path:

    - `bindings[]` with `type: "acp"` and `match.channel: "discord"`

    उदाहरण:

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

    नोट्स:

    - `/acp spawn codex --bind here` current channel या thread को वहीं bind करता है और future messages को उसी ACP session पर रखता है। Thread messages parent channel binding inherit करते हैं।
    - Bound channel या thread में, `/new` और `/reset` उसी ACP session को वहीं reset करते हैं। Temporary thread bindings active रहते समय target resolution override कर सकते हैं।
    - `spawnSessions` `--thread auto|here` के जरिए child thread creation/binding gate करता है।

    Binding behavior details के लिए [ACP Agents](/hi/tools/acp-agents) देखें।

  </Accordion>

  <Accordion title="Reaction notifications">
    Per-guild reaction notification mode:

    - `off`
    - `own` (डिफ़ॉल्ट)
    - `all`
    - `allowlist` (`guilds.<id>.users` का उपयोग करता है)

    Reaction events system events में बदले जाते हैं और routed Discord session से attach किए जाते हैं।

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` OpenClaw द्वारा inbound message process करते समय acknowledgement emoji भेजता है।

    Resolution order:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji fallback (`agents.list[].identity.emoji`, अन्यथा "👀")

    नोट्स:

    - Discord unicode emoji या custom emoji names स्वीकार करता है।
    - किसी channel या account के लिए reaction disable करने के लिए `""` उपयोग करें।

  </Accordion>

  <Accordion title="Config writes">
    Channel-initiated config writes डिफ़ॉल्ट रूप से enabled हैं।

    यह `/config set|unset` flows को प्रभावित करता है (जब command features enabled हों)।

    Disable:

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

  <Accordion title="Gateway proxy">
    Discord gateway WebSocket traffic और startup REST lookups (application ID + allowlist resolution) को `channels.discord.proxy` के साथ HTTP(S) proxy के माध्यम से route करें।

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Per-account override:

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

  <Accordion title="PluralKit support">
    Proxied messages को system member identity से map करने के लिए PluralKit resolution enable करें:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    नोट्स:

    - अनुमति-सूचियाँ `pk:<memberId>` का उपयोग कर सकती हैं
    - सदस्य प्रदर्शन नामों का मिलान नाम/स्लग से केवल तब किया जाता है जब `channels.discord.dangerouslyAllowNameMatching: true` हो
    - लुकअप मूल संदेश ID का उपयोग करते हैं और समय-सीमा से बाधित होते हैं
    - यदि लुकअप विफल होता है, तो प्रॉक्सीड संदेशों को बॉट संदेश माना जाता है और `allowBots=true` न होने पर छोड़ दिया जाता है

  </Accordion>

  <Accordion title="Outbound mention aliases">
    जब एजेंटों को ज्ञात Discord उपयोगकर्ताओं के लिए निर्धारक आउटबाउंड मेंशन की आवश्यकता हो, तो `mentionAliases` का उपयोग करें। कुंजियाँ अग्रणी `@` के बिना हैंडल होती हैं; मान Discord उपयोगकर्ता ID होते हैं। अज्ञात हैंडल, `@everyone`, `@here`, और Markdown कोड स्पैन के अंदर मेंशन अपरिवर्तित छोड़े जाते हैं।

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
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

  <Accordion title="Presence configuration">
    जब आप कोई स्थिति या गतिविधि फ़ील्ड सेट करते हैं, या जब आप स्वतः उपस्थिति सक्षम करते हैं, तो उपस्थिति अपडेट लागू किए जाते हैं।

    केवल स्थिति का उदाहरण:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    गतिविधि उदाहरण (कस्टम स्थिति डिफ़ॉल्ट गतिविधि प्रकार है):

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

    स्ट्रीमिंग उदाहरण:

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

    - 0: चल रहा है
    - 1: स्ट्रीमिंग (`activityUrl` आवश्यक)
    - 2: सुन रहा है
    - 3: देख रहा है
    - 4: कस्टम (गतिविधि टेक्स्ट को स्थिति अवस्था के रूप में उपयोग करता है; इमोजी वैकल्पिक है)
    - 5: प्रतिस्पर्धा कर रहा है

    स्वतः उपस्थिति उदाहरण (रनटाइम स्वास्थ्य संकेत):

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

    स्वतः उपस्थिति रनटाइम उपलब्धता को Discord स्थिति से मैप करती है: स्वस्थ => ऑनलाइन, अवनत या अज्ञात => निष्क्रिय, समाप्त या अनुपलब्ध => dnd। वैकल्पिक टेक्स्ट ओवरराइड:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` प्लेसहोल्डर का समर्थन करता है)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord DMs में बटन-आधारित अनुमोदन हैंडलिंग का समर्थन करता है और वैकल्पिक रूप से मूल चैनल में अनुमोदन प्रॉम्प्ट पोस्ट कर सकता है।

    कॉन्फ़िग पथ:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (वैकल्पिक; संभव होने पर `commands.ownerAllowFrom` पर वापस जाता है)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, डिफ़ॉल्ट: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    जब `enabled` सेट नहीं है या `"auto"` है और कम से कम एक अनुमोदक को हल किया जा सकता है, चाहे `execApprovals.approvers` से या `commands.ownerAllowFrom` से, Discord स्थानीय exec अनुमोदनों को स्वतः सक्षम करता है। Discord चैनल `allowFrom`, पुराने `dm.allowFrom`, या direct-message `defaultTo` से exec अनुमोदकों का अनुमान नहीं लगाता। Discord को स्थानीय अनुमोदन क्लाइंट के रूप में स्पष्ट रूप से अक्षम करने के लिए `enabled: false` सेट करें।

    `/diagnostics` और `/export-trajectory` जैसे संवेदनशील स्वामी-केवल समूह कमांडों के लिए, OpenClaw अनुमोदन प्रॉम्प्ट और अंतिम परिणाम निजी रूप से भेजता है। जब आह्वान करने वाले स्वामी के पास Discord स्वामी रूट होता है, तो यह पहले Discord DM का प्रयास करता है; यदि वह उपलब्ध नहीं है, तो यह `commands.ownerAllowFrom` से पहले उपलब्ध स्वामी रूट, जैसे Telegram, पर वापस जाता है।

    जब `target` `channel` या `both` होता है, तो अनुमोदन प्रॉम्प्ट चैनल में दिखाई देता है। केवल हल किए गए अनुमोदक ही बटनों का उपयोग कर सकते हैं; अन्य उपयोगकर्ताओं को क्षणिक अस्वीकृति मिलती है। अनुमोदन प्रॉम्प्ट में कमांड टेक्स्ट शामिल होता है, इसलिए चैनल डिलीवरी केवल विश्वसनीय चैनलों में सक्षम करें। यदि चैनल ID को सत्र कुंजी से निकाला नहीं जा सकता, तो OpenClaw DM डिलीवरी पर वापस जाता है।

    Discord अन्य चैट चैनलों द्वारा उपयोग किए गए साझा अनुमोदन बटनों को भी रेंडर करता है। स्थानीय Discord अडैप्टर मुख्य रूप से अनुमोदक DM रूटिंग और चैनल फैनआउट जोड़ता है।
    जब वे बटन मौजूद हों, तो वे प्राथमिक अनुमोदन UX होते हैं; OpenClaw
    को मैन्युअल `/approve` कमांड केवल तब शामिल करना चाहिए जब टूल परिणाम कहे
    कि चैट अनुमोदन उपलब्ध नहीं हैं या मैन्युअल अनुमोदन ही एकमात्र पथ है।
    यदि Discord स्थानीय अनुमोदन रनटाइम सक्रिय नहीं है, तो OpenClaw
    स्थानीय निर्धारक `/approve <id> <decision>` प्रॉम्प्ट को दृश्यमान रखता है। यदि
    रनटाइम सक्रिय है लेकिन किसी भी लक्ष्य को स्थानीय कार्ड डिलीवर नहीं किया जा सकता,
    तो OpenClaw लंबित अनुमोदन से सटीक `/approve`
    कमांड के साथ उसी-चैट फ़ॉलबैक सूचना भेजता है।

    Gateway प्रमाणीकरण और अनुमोदन समाधान साझा Gateway क्लाइंट अनुबंध का पालन करते हैं (`plugin:` ID `plugin.approval.resolve` के माध्यम से हल होते हैं; अन्य ID `exec.approval.resolve` के माध्यम से)। अनुमोदन डिफ़ॉल्ट रूप से 30 मिनट बाद समाप्त हो जाते हैं।

    [Exec अनुमोदन](/hi/tools/exec-approvals) देखें।

  </Accordion>
</AccordionGroup>

## टूल और क्रिया गेट

Discord संदेश क्रियाओं में मैसेजिंग, चैनल प्रशासन, मॉडरेशन, उपस्थिति, और मेटाडेटा क्रियाएँ शामिल हैं।

मुख्य उदाहरण:

- मैसेजिंग: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- प्रतिक्रियाएँ: `react`, `reactions`, `emojiList`
- मॉडरेशन: `timeout`, `kick`, `ban`
- उपस्थिति: `setPresence`

`event-create` क्रिया निर्धारित इवेंट की कवर छवि सेट करने के लिए एक वैकल्पिक `image` पैरामीटर (URL या स्थानीय फ़ाइल पथ) स्वीकार करती है।

क्रिया गेट `channels.discord.actions.*` के अंतर्गत रहते हैं।

डिफ़ॉल्ट गेट व्यवहार:

| क्रिया समूह                                                                                                                                                              | डिफ़ॉल्ट |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | सक्षम    |
| roles                                                                                                                                                                    | अक्षम    |
| moderation                                                                                                                                                               | अक्षम    |
| presence                                                                                                                                                                 | अक्षम    |

## Components v2 UI

OpenClaw exec अनुमोदनों और cross-context मार्करों के लिए Discord components v2 का उपयोग करता है। Discord संदेश क्रियाएँ कस्टम UI के लिए `components` भी स्वीकार कर सकती हैं (उन्नत; discord टूल के माध्यम से component payload बनाना आवश्यक), जबकि पुराने `embeds` उपलब्ध रहते हैं लेकिन अनुशंसित नहीं हैं।

- `channels.discord.ui.components.accentColor` Discord component कंटेनरों द्वारा उपयोग किया जाने वाला accent color सेट करता है (hex)।
- प्रति अकाउंट `channels.discord.accounts.<id>.ui.components.accentColor` से सेट करें।
- `channels.discord.agentComponents.ttlMs` नियंत्रित करता है कि भेजे गए Discord component callbacks कितनी देर तक पंजीकृत रहें (डिफ़ॉल्ट `1800000`, अधिकतम `86400000`)। प्रति अकाउंट `channels.discord.accounts.<id>.agentComponents.ttlMs` से सेट करें।
- जब components v2 मौजूद हों, तो `embeds` अनदेखे किए जाते हैं।
- सादे URL previews डिफ़ॉल्ट रूप से दबा दिए जाते हैं। जब एक अकेला outbound link expand होना चाहिए, तो message action पर `suppressEmbeds: false` सेट करें।

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

Discord में दो अलग-अलग वॉइस सतहें हैं: realtime **voice channels** (लगातार बातचीत) और **voice message attachments** (waveform preview format)। Gateway दोनों का समर्थन करता है।

### वॉइस चैनल

सेटअप चेकलिस्ट:

1. Discord Developer Portal में Message Content Intent सक्षम करें।
2. जब role/user allowlists उपयोग की जाती हैं, तो Server Members Intent सक्षम करें।
3. बॉट को `bot` और `applications.commands` scopes के साथ आमंत्रित करें।
4. लक्ष्य voice channel में Connect, Speak, Send Messages, और Read Message History प्रदान करें।
5. स्थानीय कमांड सक्षम करें (`commands.native` या `channels.discord.commands.native`)।
6. `channels.discord.voice` कॉन्फ़िगर करें।

सत्रों को नियंत्रित करने के लिए `/vc join|leave|status` का उपयोग करें। कमांड अकाउंट डिफ़ॉल्ट एजेंट का उपयोग करता है और अन्य Discord कमांडों जैसे ही allowlist और group policy नियमों का पालन करता है।

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

जुड़ने से पहले बॉट की प्रभावी अनुमतियों का निरीक्षण करने के लिए, चलाएँ:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

स्वतः-जुड़ने का उदाहरण:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
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
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

नोट्स:

- `voice.tts`, केवल `stt-tts` वॉइस प्लेबैक के लिए `messages.tts` को ओवरराइड करता है। रीयलटाइम मोड `voice.realtime.speakerVoice` का उपयोग करते हैं।
- `voice.mode` बातचीत पथ को नियंत्रित करता है। डिफ़ॉल्ट `agent-proxy` है: एक रीयलटाइम वॉइस फ्रंट एंड टर्न टाइमिंग, इंटरप्शन और प्लेबैक संभालता है, `openclaw_agent_consult` के माध्यम से रूट किए गए OpenClaw एजेंट को सार्थक काम सौंपता है, और परिणाम को उस स्पीकर से आए टाइप किए गए Discord प्रॉम्प्ट जैसा मानता है। `stt-tts` पुराना बैच STT प्लस TTS फ़्लो बनाए रखता है। `bidi` रीयलटाइम मॉडल को सीधे बातचीत करने देता है, जबकि OpenClaw ब्रेन के लिए `openclaw_agent_consult` उपलब्ध कराता है।
- `voice.agentSession` नियंत्रित करता है कि कौन-सी OpenClaw बातचीत वॉइस टर्न प्राप्त करती है। वॉइस चैनल के अपने सेशन के लिए इसे अनसेट छोड़ें, या वॉइस चैनल को `#maintainers` जैसे मौजूदा Discord टेक्स्ट चैनल सेशन के माइक्रोफ़ोन/स्पीकर एक्सटेंशन के रूप में काम कराने के लिए `{ mode: "target", target: "channel:<text-channel-id>" }` सेट करें।
- `voice.model`, Discord वॉइस प्रतिक्रियाओं और रीयलटाइम कंसल्ट के लिए OpenClaw एजेंट ब्रेन को ओवरराइड करता है। रूट किए गए एजेंट मॉडल को इनहेरिट करने के लिए इसे अनसेट छोड़ें। यह `voice.realtime.model` से अलग है।
- `voice.followUsers` बॉट को चुने हुए उपयोगकर्ताओं के साथ Discord वॉइस में जुड़ने, स्थानांतरित होने और छोड़ने देता है। व्यवहार नियमों और उदाहरणों के लिए [वॉइस में उपयोगकर्ताओं का अनुसरण करें](#follow-users-in-voice) देखें।
- `agent-proxy` स्पीच को `discord-voice` के माध्यम से रूट करता है, जो स्पीकर और लक्ष्य सेशन के लिए सामान्य owner/tool प्राधिकरण को सुरक्षित रखता है, लेकिन एजेंट `tts` टूल को छिपाता है क्योंकि Discord वॉइस प्लेबैक का स्वामी है। डिफ़ॉल्ट रूप से, `agent-proxy` owner स्पीकर्स के लिए कंसल्ट को पूर्ण owner-समतुल्य टूल एक्सेस देता है (`voice.realtime.toolPolicy: "owner"`) और सार्थक उत्तरों से पहले OpenClaw एजेंट से कंसल्ट करने को मज़बूती से प्राथमिकता देता है (`voice.realtime.consultPolicy: "always"`)। उस डिफ़ॉल्ट `always` मोड में, रीयलटाइम लेयर कंसल्ट उत्तर से पहले अपने-आप फिलर नहीं बोलती; यह स्पीच कैप्चर और ट्रांसक्राइब करती है, फिर रूट किया गया OpenClaw उत्तर बोलती है। यदि कई बाध्य कंसल्ट उत्तर तब पूरे होते हैं जब Discord अभी भी पहला उत्तर चला रहा हो, तो बाद के exact-speech उत्तरों को बीच वाक्य में स्पीच बदलने के बजाय प्लेबैक निष्क्रिय होने तक कतार में रखा जाता है।
- `stt-tts` मोड में, STT `tools.media.audio` का उपयोग करता है; `voice.model` ट्रांसक्रिप्शन को प्रभावित नहीं करता।
- रीयलटाइम मोड में, `voice.realtime.provider`, `voice.realtime.model`, और `voice.realtime.speakerVoice` रीयलटाइम ऑडियो सेशन को कॉन्फ़िगर करते हैं। OpenAI Realtime 2 प्लस Codex ब्रेन के लिए, `voice.realtime.model: "gpt-realtime-2"` और `voice.model: "openai/gpt-5.5"` का उपयोग करें।
- रीयलटाइम वॉइस मोड डिफ़ॉल्ट रूप से रीयलटाइम प्रदाता निर्देशों में छोटे `IDENTITY.md`, `USER.md`, और `SOUL.md` प्रोफ़ाइल फ़ाइलें शामिल करते हैं, ताकि तेज़ सीधे टर्न वही पहचान, उपयोगकर्ता आधार और व्यक्तित्व बनाए रखें जो रूट किए गए OpenClaw एजेंट में है। इसे अनुकूलित करने के लिए `voice.realtime.bootstrapContextFiles` को किसी उपसमुच्चय पर सेट करें, या इसे अक्षम करने के लिए `[]` सेट करें। समर्थित रीयलटाइम बूटस्ट्रैप फ़ाइलें केवल उन्हीं प्रोफ़ाइल फ़ाइलों तक सीमित हैं; `AGENTS.md` सामान्य एजेंट संदर्भ में रहता है। इंजेक्ट किया गया प्रोफ़ाइल संदर्भ workspace कार्य, वर्तमान तथ्यों, मेमोरी लुकअप, या टूल-समर्थित क्रियाओं के लिए `openclaw_agent_consult` को प्रतिस्थापित नहीं करता।
- OpenAI `agent-proxy` रीयलटाइम मोड में, Discord रीयलटाइम वॉइस को तब तक मौन रखने के लिए `voice.realtime.requireWakeName: true` सेट करें जब तक कोई ट्रांसक्रिप्ट wake name से शुरू या समाप्त न हो। कॉन्फ़िगर किए गए wake names एक या दो शब्दों के होने चाहिए। यदि `voice.realtime.wakeNames` अनसेट है, तो OpenClaw रूट किए गए एजेंट `name` प्लस `OpenClaw` का उपयोग करता है, और fallback में एजेंट id प्लस `OpenClaw` का उपयोग करता है। Wake-name gating रीयलटाइम प्रदाता auto-response को अक्षम करता है, स्वीकृत टर्न को OpenClaw एजेंट कंसल्ट पथ से रूट करता है, और अंतिम ट्रांसक्रिप्ट आने से पहले आंशिक ट्रांसक्रिप्शन से अग्रणी wake name पहचाने जाने पर छोटा बोला गया acknowledgement देता है।
- OpenAI रीयलटाइम प्रदाता वर्तमान Realtime 2 event names और आउटपुट ऑडियो तथा ट्रांसक्रिप्ट इवेंट्स के लिए legacy Codex-compatible aliases स्वीकार करता है, ताकि संगत प्रदाता snapshots assistant audio गिराए बिना बदल सकें।
- `voice.realtime.bargeIn` नियंत्रित करता है कि Discord speaker-start events सक्रिय रीयलटाइम प्लेबैक को interrupt करते हैं या नहीं। यदि अनसेट है, तो यह रीयलटाइम प्रदाता की input-audio interruption setting का पालन करता है।
- `voice.realtime.minBargeInAudioEndMs` OpenAI रीयलटाइम barge-in द्वारा ऑडियो truncate करने से पहले न्यूनतम assistant playback duration नियंत्रित करता है। डिफ़ॉल्ट: `250`। low-echo rooms में तुरंत interruption के लिए `0` सेट करें, या echo-heavy speaker setups के लिए इसे बढ़ाएं।
- Discord प्लेबैक पर OpenAI वॉइस के लिए, `voice.tts.provider: "openai"` सेट करें और `voice.tts.providers.openai.speakerVoice` के तहत Text-to-speech वॉइस चुनें। `cedar` वर्तमान OpenAI TTS मॉडल पर अच्छा masculine-sounding विकल्प है।
- प्रति-चैनल Discord `systemPrompt` ओवरराइड उस वॉइस चैनल के वॉइस ट्रांसक्रिप्ट टर्न पर लागू होते हैं।
- वॉइस ट्रांसक्रिप्ट टर्न owner-gated commands और channel actions के लिए Discord `allowFrom` (या `dm.allowFrom`) से owner status निकालते हैं। एजेंट टूल दृश्यता रूट किए गए सेशन के लिए कॉन्फ़िगर की गई tool policy का पालन करती है।
- Discord वॉइस text-only configs के लिए opt-in है; `/vc` कमांड, वॉइस रनटाइम, और `GuildVoiceStates` Gateway intent सक्षम करने के लिए `channels.discord.voice.enabled=true` सेट करें (या मौजूदा `channels.discord.voice` ब्लॉक बनाए रखें)।
- `channels.discord.intents.voiceStates` voice-state intent subscription को स्पष्ट रूप से ओवरराइड कर सकता है। intent को effective voice enablement का पालन करने देने के लिए इसे अनसेट छोड़ें।
- यदि `voice.autoJoin` में एक ही guild के लिए कई entries हैं, तो OpenClaw उस guild के लिए आख़िरी कॉन्फ़िगर किए गए channel में जुड़ता है।
- `voice.allowedChannels` एक वैकल्पिक residency allowlist है। `/vc join` को किसी भी अधिकृत Discord वॉइस चैनल में अनुमति देने के लिए इसे अनसेट छोड़ें। सेट होने पर, `/vc join`, startup auto-join, और bot voice-state moves सूचीबद्ध `{ guildId, channelId }` entries तक सीमित रहते हैं। सभी Discord वॉइस joins अस्वीकार करने के लिए इसे खाली array पर सेट करें। यदि Discord बॉट को allowlist से बाहर ले जाता है, तो OpenClaw वह channel छोड़ देता है और उपलब्ध होने पर कॉन्फ़िगर किए गए auto-join target में फिर जुड़ता है।
- `voice.daveEncryption` और `voice.decryptionFailureTolerance`, `@discordjs/voice` join options तक पास होते हैं।
- `@discordjs/voice` defaults अनसेट होने पर `daveEncryption=true` और `decryptionFailureTolerance=24` हैं।
- OpenClaw Discord voice receive और realtime raw PCM playback के लिए bundled `libopus-wasm` codec का उपयोग करता है। यह pinned libopus WebAssembly build के साथ आता है और native opus addons की आवश्यकता नहीं होती।
- `voice.connectTimeoutMs`, `/vc join` और auto-join attempts के लिए प्रारंभिक `@discordjs/voice` Ready wait नियंत्रित करता है। डिफ़ॉल्ट: `30000`।
- `voice.reconnectGraceMs` नियंत्रित करता है कि disconnected voice session को नष्ट करने से पहले OpenClaw उसके reconnecting शुरू करने के लिए कितनी देर प्रतीक्षा करता है। डिफ़ॉल्ट: `15000`।
- `stt-tts` मोड में, वॉइस प्लेबैक केवल इसलिए नहीं रुकता कि कोई दूसरा उपयोगकर्ता बोलना शुरू करता है। feedback loops से बचने के लिए, TTS चलने के दौरान OpenClaw नया voice capture अनदेखा करता है; अगले टर्न के लिए playback समाप्त होने के बाद बोलें। रीयलटाइम मोड speaker starts को barge-in signals के रूप में रीयलटाइम प्रदाता को forward करते हैं।
- रीयलटाइम मोड में, speakers से open mic में आने वाली echo barge-in जैसी दिख सकती है और playback interrupt कर सकती है। echo-heavy Discord rooms के लिए, OpenAI को input audio पर auto-interrupting से रोकने के लिए `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` सेट करें। यदि आप फिर भी Discord speaker-start events से active playback interrupt कराना चाहते हैं, तो `voice.realtime.bargeIn: true` जोड़ें। OpenAI realtime bridge `voice.realtime.minBargeInAudioEndMs` से छोटी playback truncations को संभावित echo/noise मानकर अनदेखा करता है और Discord playback साफ़ करने के बजाय उन्हें skipped के रूप में लॉग करता है।
- `voice.captureSilenceGraceMs` नियंत्रित करता है कि Discord द्वारा speaker के रुकने की सूचना देने के बाद OpenClaw STT के लिए उस audio segment को finalizing करने से पहले कितनी देर प्रतीक्षा करता है। डिफ़ॉल्ट: `2000`; यदि Discord सामान्य pauses को choppy partial transcripts में बांटता है, तो इसे बढ़ाएं।
- जब ElevenLabs चुना गया TTS provider होता है, Discord voice playback streaming TTS का उपयोग करता है और provider response stream से शुरू होता है। streaming support के बिना providers synthesized temp-file path पर fallback करते हैं।
- OpenClaw receive decrypt failures पर भी नज़र रखता है और छोटी window में repeated failures के बाद voice channel छोड़कर/फिर जुड़कर auto-recovers करता है।
- यदि अपडेट करने के बाद receive logs बार-बार `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` दिखाते हैं, तो dependency report और logs इकट्ठा करें। bundled `@discordjs/voice` line में discord.js PR #11449 से upstream padding fix शामिल है, जिसने discord.js issue #11419 को बंद किया।
- `The operation was aborted` receive events अपेक्षित हैं जब OpenClaw captured speaker segment को finalizes करता है; ये verbose diagnostics हैं, warnings नहीं।
- Verbose Discord voice logs प्रत्येक accepted speaker segment के लिए bounded one-line STT transcript preview शामिल करते हैं, ताकि debugging unbounded transcript text dump किए बिना user side और agent reply side दोनों दिखाए।
- `agent-proxy` मोड में, forced consult fallback संभावित incomplete transcript fragments जैसे `...` पर समाप्त होने वाला text या `and` जैसा trailing connector, साथ ही “be right back” या “bye” जैसे स्पष्ट non-actionable closings को छोड़ देता है। जब यह stale queued answer को रोकता है, तो logs `forced agent consult skipped reason=...` दिखाते हैं।

### वॉइस में उपयोगकर्ताओं का अनुसरण करें

जब आप चाहते हैं कि Discord वॉइस बॉट startup पर fixed channel में जुड़ने या `/vc join` की प्रतीक्षा करने के बजाय एक या अधिक ज्ञात Discord users के साथ बना रहे, तो `voice.followUsers` का उपयोग करें।

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

- `followUsers` raw Discord user IDs और `discord:<id>` values स्वीकार करता है। OpenClaw voice-state events से मिलान करने से पहले दोनों forms को normalize करता है।
- `followUsersEnabled`, `followUsers` configured होने पर डिफ़ॉल्ट रूप से `true` होता है। saved list बनाए रखते हुए automatic voice following रोकने के लिए इसे `false` पर सेट करें।
- जब followed user किसी allowed voice channel में जुड़ता है, OpenClaw उस channel में जुड़ता है। जब user move करता है, OpenClaw उनके साथ move करता है। जब active followed user disconnects करता है, OpenClaw छोड़ देता है।
- यदि एक ही guild में multiple followed users हैं और active followed user छोड़ देता है, तो OpenClaw guild छोड़ने से पहले किसी दूसरे tracked followed user's channel में move करता है। यदि कई followed users एक साथ move करते हैं, तो latest observed voice-state event जीतता है।
- `allowedChannels` फिर भी लागू होता है। disallowed channel में followed user को अनदेखा किया जाता है, और follow-owned session किसी दूसरे followed user पर move करता है या छोड़ देता है।
- OpenClaw startup पर और bounded interval पर missed voice-state events को reconcile करता है। Reconciliation configured guilds को sample करता है और per run REST lookups cap करता है, इसलिए बहुत बड़ी `followUsers` lists को converge होने में एक से अधिक interval लग सकते हैं।
- यदि Discord या कोई admin user को follow करते समय bot को move करता है, तो OpenClaw voice session rebuild करता है और destination allowed होने पर follow ownership सुरक्षित रखता है। यदि bot को `allowedChannels` से बाहर move किया जाता है, तो OpenClaw छोड़ देता है और कोई configured target मौजूद होने पर फिर जुड़ता है।
- DAVE receive recovery repeated decrypt failures के बाद वही channel छोड़कर फिर जुड़ सकती है। Follow-owned sessions उस recovery path में अपनी follow ownership बनाए रखते हैं, इसलिए बाद में followed-user disconnect होने पर channel फिर भी छूटता है।

join modes में से चुनें:

- personal या operator setups के लिए `followUsers` का उपयोग करें, जहाँ bot को आपके voice में होने पर अपने-आप voice में होना चाहिए।
- fixed-room bots के लिए `autoJoin` का उपयोग करें, जिन्हें voice में कोई tracked user न होने पर भी मौजूद रहना चाहिए।
- one-off joins या ऐसे rooms के लिए `/vc join` का उपयोग करें जहाँ automatic voice presence चौंकाने वाली होगी।

Discord voice codec:

- Voice प्राप्ति लॉग `discord voice: opus decoder: libopus-wasm` दिखाते हैं।
- Realtime प्लेबैक पैकेटों को `@discordjs/voice` को सौंपने से पहले उसी बंडल किए गए `libopus-wasm` पैकेज के साथ raw 48 kHz stereo PCM को Opus में एन्कोड करता है।
- फ़ाइल और प्रदाता-स्ट्रीम प्लेबैक ffmpeg के साथ raw 48 kHz stereo PCM में ट्रांसकोड करता है, फिर Discord को भेजी जाने वाली Opus पैकेट स्ट्रीम के लिए `libopus-wasm` का उपयोग करता है।

STT और TTS पाइपलाइन:

- Discord PCM कैप्चर को WAV अस्थायी फ़ाइल में बदला जाता है।
- `tools.media.audio` STT संभालता है, उदाहरण के लिए `openai/gpt-4o-mini-transcribe`।
- ट्रांसक्रिप्ट Discord इनग्रेस और रूटिंग से होकर भेजी जाती है, जबकि प्रतिक्रिया LLM एक voice-output नीति के साथ चलता है जो एजेंट `tts` टूल को छिपाती है और लौटाया गया पाठ मांगती है, क्योंकि Discord voice अंतिम TTS प्लेबैक का स्वामी है।
- `voice.model`, सेट होने पर, इस voice-channel turn के लिए केवल प्रतिक्रिया LLM को ओवरराइड करता है।
- `voice.tts` को `messages.tts` के ऊपर मर्ज किया जाता है; स्ट्रीमिंग-सक्षम प्रदाता सीधे प्लेयर को फ़ीड करते हैं, अन्यथा परिणामी ऑडियो फ़ाइल जुड़े हुए चैनल में चलाई जाती है।

डिफ़ॉल्ट agent-proxy voice-channel सत्र उदाहरण:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`voice.agentSession` ब्लॉक न होने पर, हर voice channel को अपना रूट किया गया OpenClaw सत्र मिलता है। उदाहरण के लिए, `/vc join channel:234567890123456789` उस Discord voice channel के सत्र से बात करता है। realtime मॉडल केवल voice front end है; महत्वपूर्ण अनुरोध कॉन्फ़िगर किए गए OpenClaw एजेंट को सौंपे जाते हैं। यदि realtime मॉडल consult टूल को कॉल किए बिना अंतिम ट्रांसक्रिप्ट बनाता है, तो OpenClaw fallback के रूप में consult को बाध्य करता है ताकि डिफ़ॉल्ट अभी भी एजेंट से बात करने जैसा व्यवहार करे।

Legacy STT और TTS उदाहरण:

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

Realtime bidi उदाहरण:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

किसी मौजूदा Discord channel सत्र के विस्तार के रूप में Voice:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

`agent-proxy` मोड में bot कॉन्फ़िगर किए गए voice channel से जुड़ता है, लेकिन OpenClaw एजेंट turns लक्ष्य चैनल के सामान्य रूट किए गए सत्र और एजेंट का उपयोग करते हैं। realtime voice सत्र लौटाए गए परिणाम को voice channel में बोलकर सुनाता है। supervisor agent अपनी tool policy के अनुसार अभी भी सामान्य message tools का उपयोग कर सकता है, जिसमें सही कार्रवाई होने पर अलग Discord संदेश भेजना भी शामिल है।

जब कोई प्रत्यायोजित OpenClaw रन सक्रिय होता है, नए Discord voice transcripts को दूसरा agent turn शुरू करने से पहले live run control माना जाता है। "status", "cancel that", "use the smaller fix", या "when you're done also check tests" जैसे वाक्यांशों को सक्रिय सत्र के लिए status, cancel, steering, या follow-up input के रूप में वर्गीकृत किया जाता है। Status, cancel, स्वीकार की गई steering, और follow-up परिणामों को voice channel में बोलकर सुनाया जाता है ताकि कॉल करने वाले को पता रहे कि OpenClaw ने अनुरोध संभाला या नहीं।

उपयोगी target रूप:

- `target: "channel:123456789012345678"` Discord text channel सत्र के माध्यम से रूट करता है।
- `target: "123456789012345678"` को channel target माना जाता है।
- `target: "dm:123456789012345678"` या `target: "user:123456789012345678"` उस direct-message सत्र के माध्यम से रूट करता है।

Echo-heavy OpenAI Realtime उदाहरण:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
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

इसका उपयोग तब करें जब मॉडल open mic के माध्यम से अपना ही Discord playback सुनता है, लेकिन आप फिर भी बोलकर उसे बाधित करना चाहते हैं। OpenClaw raw input audio पर OpenAI को auto-interrupt करने से रोकता है, जबकि `bargeIn: true` Discord speaker-start events और पहले से सक्रिय speaker audio को अगले captured turn के OpenAI तक पहुंचने से पहले सक्रिय realtime responses रद्द करने देता है। `minBargeInAudioEndMs` से कम `audioEndMs` वाले बहुत शुरुआती barge-in signals को संभावित echo/noise माना जाता है और अनदेखा किया जाता है ताकि मॉडल पहले playback frame पर कट न जाए।

अपेक्षित voice logs:

- Join पर: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Realtime start पर: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Speaker audio पर: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, और `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- छोड़े गए stale speech पर: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` या `reason=non-actionable-closing ...`
- Realtime response completion पर: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Playback stop/reset पर: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Realtime consult पर: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Agent answer पर: `discord voice: agent turn answer ...`
- Queued exact speech पर: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, इसके बाद `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Barge-in detection पर: `discord voice: realtime barge-in detected source=speaker-start ...` या `discord voice: realtime barge-in detected source=active-speaker-audio ...`, इसके बाद `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Realtime interruption पर: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, इसके बाद या तो `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` या `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- अनदेखा किए गए echo/noise पर: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Disabled barge-in पर: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Idle playback पर: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Cut-off audio debug करने के लिए, realtime voice logs को timeline की तरह पढ़ें:

1. `realtime audio playback started` का मतलब है कि Discord ने assistant audio चलाना शुरू कर दिया है। bridge इस बिंदु से assistant output chunks, Discord PCM bytes, provider realtime bytes, और synthesized audio duration गिनना शुरू करता है।
2. `realtime speaker turn opened` Discord speaker के सक्रिय होने को चिह्नित करता है। यदि playback पहले से सक्रिय है और `bargeIn` सक्षम है, तो इसके बाद `barge-in detected source=speaker-start` आ सकता है।
3. `realtime input audio started` उस speaker turn के लिए प्राप्त पहले वास्तविक audio frame को चिह्नित करता है। यहां `outputActive=true` या nonzero `outputAudioMs` का मतलब है कि mic input भेज रहा है जबकि assistant playback अभी भी सक्रिय है।
4. `barge-in detected source=active-speaker-audio` का मतलब है कि OpenClaw ने assistant playback सक्रिय रहते हुए live speaker audio देखा। यह बिना उपयोगी audio वाले Discord speaker-start event से वास्तविक interruption को अलग करने में उपयोगी है।
5. `barge-in requested reason=...` का मतलब है कि OpenClaw ने realtime provider से सक्रिय response को cancel या truncate करने को कहा। इसमें `outputAudioMs`, `outputActive`, और `playbackChunks` शामिल हैं ताकि आप देख सकें कि interruption से पहले कितना assistant audio वास्तव में चल चुका था।
6. `realtime audio playback stopped reason=...` local Discord playback reset point है। reason बताता है कि playback किसने रोका: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, या `session-close`।
7. `realtime speaker turn closed` captured input turn का सारांश देता है। `chunks=0` या `hasAudio=false` का मतलब है कि speaker turn खुला लेकिन कोई उपयोगी audio realtime bridge तक नहीं पहुंचा। `interruptedPlayback=true` का मतलब है कि वह input turn assistant output से overlap हुआ और barge-in logic trigger हुआ।

उपयोगी fields:

- `outputAudioMs`: log line से पहले realtime provider द्वारा generated assistant audio duration।
- `audioMs`: playback रुकने से पहले OpenClaw द्वारा counted assistant audio duration।
- `elapsedMs`: playback stream या speaker turn खोलने और बंद करने के बीच wall-clock time।
- `discordBytes`: Discord voice को भेजे गए या उससे प्राप्त 48 kHz stereo PCM bytes।
- `realtimeBytes`: realtime provider को भेजे गए या उससे प्राप्त provider-format PCM bytes।
- `playbackChunks`: active response के लिए Discord को forwarded assistant audio chunks।
- `sinceLastAudioMs`: आखिरी captured speaker audio frame और speaker turn closing के बीच gap।

सामान्य patterns:

- `source=active-speaker-audio`, छोटे `outputAudioMs`, और पास में वही user के साथ immediate cut-off आमतौर पर speaker echo के mic में प्रवेश की ओर इशारा करता है। `voice.realtime.minBargeInAudioEndMs` बढ़ाएं, speaker volume घटाएं, headphones उपयोग करें, या `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` सेट करें।
- `source=speaker-start` के बाद `speaker turn closed ... hasAudio=false` का मतलब है कि Discord ने speaker start report किया लेकिन कोई audio OpenClaw तक नहीं पहुंचा। यह transient Discord voice event, noise gate behavior, या client का briefly mic key करना हो सकता है।
- पास में barge-in या `provider-clear-audio` के बिना `audio playback stopped reason=stream-close` का मतलब है कि local Discord playback stream अनपेक्षित रूप से समाप्त हो गई। पिछले provider और Discord player logs जांचें।
- `capture ignored during playback (barge-in disabled)` का मतलब है कि OpenClaw ने assistant audio सक्रिय रहते हुए input को जानबूझकर drop किया। यदि आप चाहते हैं कि speech playback को interrupt करे, तो `voice.realtime.bargeIn` सक्षम करें।
- `barge-in ignored ... outputActive=false` का मतलब है कि Discord या provider VAD ने speech report किया, लेकिन OpenClaw के पास interrupt करने के लिए कोई active playback नहीं था। इससे audio cut off नहीं होना चाहिए।

Credentials component के अनुसार resolve किए जाते हैं: `voice.model` के लिए LLM route auth, `tools.media.audio` के लिए STT auth, `messages.tts`/`voice.tts` के लिए TTS auth, और `voice.realtime.providers` या provider के सामान्य auth config के लिए realtime provider auth।

### Voice messages

Discord voice messages waveform preview दिखाते हैं और OGG/Opus audio की आवश्यकता होती है। OpenClaw waveform अपने आप generate करता है, लेकिन inspect और convert करने के लिए gateway host पर `ffmpeg` और `ffprobe` चाहिए।

- **स्थानीय फ़ाइल पथ** दें (URL अस्वीकार किए जाते हैं).
- टेक्स्ट सामग्री छोड़ दें (Discord एक ही payload में टेक्स्ट + वॉइस संदेश अस्वीकार करता है).
- कोई भी ऑडियो प्रारूप स्वीकार्य है; OpenClaw आवश्यकता अनुसार OGG/Opus में बदल देता है.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## समस्या निवारण

<AccordionGroup>
  <Accordion title="अस्वीकृत intents उपयोग किए गए या bot को guild संदेश नहीं दिखते">

    - Message Content Intent सक्षम करें
    - जब आप user/member resolution पर निर्भर हों, Server Members Intent सक्षम करें
    - intents बदलने के बाद gateway पुनः शुरू करें

  </Accordion>

  <Accordion title="Guild संदेश अप्रत्याशित रूप से अवरुद्ध">

    - `groupPolicy` सत्यापित करें
    - `channels.discord.guilds` के अंतर्गत guild allowlist सत्यापित करें
    - यदि guild `channels` map मौजूद है, तो केवल सूचीबद्ध channels की अनुमति है
    - `requireMention` व्यवहार और mention patterns सत्यापित करें

    उपयोगी जांचें:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false है लेकिन फिर भी अवरुद्ध">
    सामान्य कारण:

    - मेल खाती guild/channel allowlist के बिना `groupPolicy="allowlist"`
    - `requireMention` गलत जगह कॉन्फ़िगर किया गया है (`channels.discord.guilds` या channel entry के अंतर्गत होना चाहिए)
    - sender guild/channel `users` allowlist द्वारा अवरुद्ध है

  </Accordion>

  <Accordion title="लंबे समय तक चलने वाले Discord turns या duplicate replies">

    सामान्य logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway queue knobs:

    - single-account: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - यह केवल Discord gateway listener work को नियंत्रित करता है, agent turn lifetime को नहीं

    Discord queued agent turns पर channel-owned timeout लागू नहीं करता. Message listeners तुरंत hand off करते हैं, और queued Discord runs per-session ordering को तब तक बनाए रखते हैं जब तक session/tool/runtime lifecycle काम पूरा या abort नहीं कर देता.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw कनेक्ट करने से पहले Discord `/gateway/bot` metadata fetch करता है. अस्थायी failures Discord के default gateway URL पर fall back करते हैं और logs में rate-limited होते हैं.

    Metadata timeout knobs:

    - single-account: `channels.discord.gatewayInfoTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - config unset होने पर env fallback: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000` (30 seconds), max: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw startup के दौरान और runtime reconnects के बाद Discord के gateway `READY` event की प्रतीक्षा करता है. Startup staggering वाले multi-account setups को default से लंबी startup READY window की आवश्यकता हो सकती है.

    READY timeout knobs:

    - startup single-account: `channels.discord.gatewayReadyTimeoutMs`
    - startup multi-account: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - config unset होने पर startup env fallback: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - startup default: `15000` (15 seconds), max: `120000`
    - runtime single-account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-account: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - config unset होने पर runtime env fallback: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime default: `30000` (30 seconds), max: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` permission checks केवल numeric channel IDs के लिए काम करते हैं.

    यदि आप slug keys उपयोग करते हैं, तो runtime matching अब भी काम कर सकती है, लेकिन probe permissions को पूरी तरह verify नहीं कर सकता.

  </Accordion>

  <Accordion title="DM और pairing issues">

    - DM disabled: `channels.discord.dm.enabled=false`
    - DM policy disabled: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - `pairing` mode में pairing approval की प्रतीक्षा

  </Accordion>

  <Accordion title="Bot to bot loops">
    default रूप से bot-authored messages अनदेखे किए जाते हैं.

    यदि आप `channels.discord.allowBots=true` सेट करते हैं, तो loop behavior से बचने के लिए strict mention और allowlist rules उपयोग करें.
    केवल उन bot messages को स्वीकार करने के लिए `channels.discord.allowBots="mentions"` को प्राथमिकता दें जो bot को mention करते हैं.

    OpenClaw shared [bot loop protection](/hi/channels/bot-loop-protection) भी ship करता है. जब भी `allowBots` bot-authored messages को dispatch तक पहुंचने देता है, Discord inbound event को `(account, channel, bot pair)` facts पर map करता है और generic pair guard configured event budget पार होने के बाद pair को suppress करता है. यह guard runaway two-bot loops को रोकता है, जिन्हें पहले Discord rate limits द्वारा रोकना पड़ता था; यह single-bot deployments या budget के भीतर रहने वाले one-shot bot replies को प्रभावित नहीं करता.

    Default settings (`allowBots` सेट होने पर active):

    - `maxEventsPerWindow: 20` -- bot pair sliding window के भीतर 20 messages exchange कर सकता है
    - `windowSeconds: 60` -- sliding window length
    - `cooldownSeconds: 60` -- budget trip होने के बाद, किसी भी direction में हर additional bot-to-bot message एक minute के लिए drop किया जाता है

    Shared default को एक बार `channels.defaults.botLoopProtection` के अंतर्गत configure करें, फिर जब किसी legitimate workflow को अधिक headroom चाहिए हो तो Discord को override करें. Precedence है:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - built-in defaults

    Discord generic `maxEventsPerWindow`, `windowSeconds`, और `cooldownSeconds` keys उपयोग करता है.

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
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
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

  <Accordion title="DecryptionFailed(...) के साथ Voice STT drops">

    - OpenClaw को current रखें (`openclaw update`) ताकि Discord voice receive recovery logic मौजूद रहे
    - पुष्टि करें कि `channels.discord.voice.daveEncryption=true` है (default)
    - `channels.discord.voice.decryptionFailureTolerance=24` (upstream default) से शुरू करें और केवल आवश्यकता होने पर tune करें
    - इन logs पर नजर रखें:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - यदि automatic rejoin के बाद failures जारी रहते हैं, तो logs collect करें और [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) और [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) में upstream DAVE receive history से तुलना करें

  </Accordion>
</AccordionGroup>

## Configuration reference

Primary reference: [Configuration reference - Discord](/hi/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (listener budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (legacy alias: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (outbound Discord uploads को cap करता है, default `100MB`), `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, top-level `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Safety and operations

- bot tokens को secrets की तरह मानें (supervised environments में `DISCORD_BOT_TOKEN` preferred).
- least-privilege Discord permissions दें.
- यदि command deploy/state stale है, gateway restart करें और `openclaw channels status --probe` से फिर check करें.

## Related

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Discord user को gateway से pair करें.
  </Card>
  <Card title="Groups" icon="users" href="/hi/channels/groups">
    Group chat और allowlist behavior.
  </Card>
  <Card title="Channel routing" icon="route" href="/hi/channels/channel-routing">
    Inbound messages को agents तक route करें.
  </Card>
  <Card title="Security" icon="shield" href="/hi/gateway/security">
    Threat model और hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/hi/concepts/multi-agent">
    Guilds और channels को agents से map करें.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/hi/tools/slash-commands">
    Native command behavior.
  </Card>
</CardGroup>
