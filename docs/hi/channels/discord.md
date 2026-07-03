---
read_when:
    - Discord चैनल सुविधाओं पर काम करना
summary: Discord बॉट समर्थन की स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:46:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
    source_path: channels/discord.md
    workflow: 16
---

आधिकारिक Discord Gateway के माध्यम से DMs और guild चैनलों के लिए तैयार।

<CardGroup cols={3}>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    Discord DMs डिफ़ॉल्ट रूप से पेयरिंग मोड में होते हैं।
  </Card>
  <Card title="Slash commands" icon="terminal" href="/hi/tools/slash-commands">
    नेटिव कमांड व्यवहार और कमांड कैटलॉग।
  </Card>
  <Card title="चैनल समस्या निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल डायग्नोस्टिक्स और रिपेयर फ़्लो।
  </Card>
</CardGroup>

## त्वरित सेटअप

आपको बॉट के साथ एक नया ऐप्लिकेशन बनाना होगा, बॉट को अपने सर्वर में जोड़ना होगा, और उसे OpenClaw से पेयर करना होगा। हम आपके बॉट को अपने निजी सर्वर में जोड़ने की सलाह देते हैं। यदि आपके पास अभी तक कोई सर्वर नहीं है, तो [पहले एक बनाएँ](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** चुनें)।

<Steps>
  <Step title="Discord ऐप्लिकेशन और बॉट बनाएँ">
    [Discord Developer Portal](https://discord.com/developers/applications) पर जाएँ और **New Application** पर क्लिक करें। इसे "OpenClaw" जैसा कोई नाम दें।

    साइडबार में **Bot** पर क्लिक करें। **Username** को वही सेट करें जो आप अपने OpenClaw एजेंट को कहते हैं।

  </Step>

  <Step title="विशेषाधिकार प्राप्त intents सक्षम करें">
    अभी भी **Bot** पेज पर रहते हुए, नीचे **Privileged Gateway Intents** तक स्क्रॉल करें और सक्षम करें:

    - **Message Content Intent** (आवश्यक)
    - **Server Members Intent** (अनुशंसित; भूमिका allowlists और नाम-से-ID मिलान के लिए आवश्यक)
    - **Presence Intent** (वैकल्पिक; केवल presence अपडेट के लिए आवश्यक)

  </Step>

  <Step title="अपना बॉट token कॉपी करें">
    **Bot** पेज पर वापस ऊपर स्क्रॉल करें और **Reset Token** पर क्लिक करें।

    <Note>
    नाम के बावजूद, यह आपका पहला token जनरेट करता है — कुछ भी "reset" नहीं किया जा रहा है।
    </Note>

    token कॉपी करें और उसे कहीं सहेजें। यह आपका **Bot Token** है और आपको जल्द ही इसकी आवश्यकता होगी।

  </Step>

  <Step title="invite URL जनरेट करें और बॉट को अपने सर्वर में जोड़ें">
    साइडबार में **OAuth2** पर क्लिक करें। आप अपने सर्वर में बॉट जोड़ने के लिए सही permissions वाला invite URL जनरेट करेंगे।

    नीचे **OAuth2 URL Generator** तक स्क्रॉल करें और सक्षम करें:

    - `bot`
    - `applications.commands`

    नीचे एक **Bot Permissions** सेक्शन दिखाई देगा। कम से कम इन्हें सक्षम करें:

    **सामान्य permissions**
      - चैनल देखें

    **टेक्स्ट permissions**
      - संदेश भेजें
      - संदेश इतिहास पढ़ें
      - लिंक एम्बेड करें
      - फ़ाइलें अटैच करें
      - प्रतिक्रियाएँ जोड़ें (वैकल्पिक)

    यह सामान्य टेक्स्ट चैनलों के लिए बेसलाइन सेट है। यदि आप Discord थ्रेड्स में पोस्ट करने की योजना बना रहे हैं, जिसमें किसी थ्रेड को बनाने या जारी रखने वाले forum या media चैनल workflows शामिल हैं, तो **Send Messages in Threads** भी सक्षम करें।
    नीचे जनरेट किया गया URL कॉपी करें, उसे अपने ब्राउज़र में पेस्ट करें, अपना सर्वर चुनें, और कनेक्ट करने के लिए **Continue** पर क्लिक करें। अब आपको Discord सर्वर में अपना बॉट दिखना चाहिए।

  </Step>

  <Step title="Developer Mode सक्षम करें और अपनी IDs इकट्ठा करें">
    Discord ऐप में वापस जाकर, आपको Developer Mode सक्षम करना होगा ताकि आप आंतरिक IDs कॉपी कर सकें।

    1. **User Settings** पर क्लिक करें (अपने avatar के पास gear icon) → साइडबार में **Developer** तक स्क्रॉल करें → **Developer Mode** चालू करें

        *(नोट: Discord मोबाइल ऐप में, Developer Mode **App Settings** → **Advanced** के अंतर्गत होता है)*

    2. साइडबार में अपने **server icon** पर राइट-क्लिक करें → **Copy Server ID**
    3. अपने **own avatar** पर राइट-क्लिक करें → **Copy User ID**

    अपनी **Server ID** और **User ID** को अपने Bot Token के साथ सहेजें — अगले चरण में आप ये तीनों OpenClaw को भेजेंगे।

  </Step>

  <Step title="सर्वर सदस्यों से DMs की अनुमति दें">
    पेयरिंग काम करने के लिए, Discord को आपके बॉट को आपको DM करने की अनुमति देनी होगी। अपने **server icon** पर राइट-क्लिक करें → **Privacy Settings** → **Direct Messages** चालू करें।

    इससे सर्वर सदस्य (बॉट सहित) आपको DMs भेज सकते हैं। यदि आप OpenClaw के साथ Discord DMs का उपयोग करना चाहते हैं, तो इसे सक्षम रखें। यदि आप केवल guild चैनलों का उपयोग करने की योजना बना रहे हैं, तो पेयरिंग के बाद DMs अक्षम कर सकते हैं।

  </Step>

  <Step title="अपना बॉट token सुरक्षित रूप से सेट करें (इसे chat में न भेजें)">
    आपका Discord बॉट token एक secret है (पासवर्ड जैसा)। अपने एजेंट को संदेश भेजने से पहले इसे उस मशीन पर सेट करें जो OpenClaw चला रही है।

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

    यदि OpenClaw पहले से background service के रूप में चल रहा है, तो इसे OpenClaw Mac ऐप के माध्यम से या `openclaw gateway run` प्रक्रिया को रोककर और फिर से शुरू करके restart करें।
    managed service installs के लिए, ऐसे shell से `openclaw gateway install` चलाएँ जहाँ `DISCORD_BOT_TOKEN` मौजूद हो, या variable को `~/.openclaw/.env` में स्टोर करें, ताकि restart के बाद service env SecretRef को resolve कर सके।
    यदि आपका host Discord के startup application lookup से blocked या rate-limited है, तो Developer Portal से Discord application/client ID सेट करें ताकि startup उस REST call को छोड़ सके। default account के लिए `channels.discord.applicationId` का उपयोग करें, या जब आप कई Discord bots चलाते हैं तो `channels.discord.accounts.<accountId>.applicationId` का उपयोग करें।

  </Step>

  <Step title="OpenClaw कॉन्फ़िगर करें और पेयर करें">

    <Tabs>
      <Tab title="अपने एजेंट से पूछें">
        किसी भी मौजूदा चैनल (जैसे Telegram) पर अपने OpenClaw एजेंट से chat करें और उसे बताएँ। यदि Discord आपका पहला चैनल है, तो इसके बजाय CLI / config tab का उपयोग करें।

        > "मैंने अपना Discord बॉट token पहले ही config में सेट कर दिया है। कृपया User ID `<user_id>` और Server ID `<server_id>` के साथ Discord setup पूरा करें।"
      </Tab>
      <Tab title="CLI / config">
        यदि आप file-based config पसंद करते हैं, तो सेट करें:

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

        default account के लिए env fallback:

```bash
DISCORD_BOT_TOKEN=...
```

        scripted या remote setup के लिए, वही JSON5 block `openclaw config patch --file ./discord.patch.json5 --dry-run` के साथ लिखें और फिर `--dry-run` के बिना दोबारा चलाएँ। Plaintext `token` values समर्थित हैं। SecretRef values भी env/file/exec providers में `channels.discord.token` के लिए समर्थित हैं। [Secrets Management](/hi/gateway/secrets) देखें।

        कई Discord bots के लिए, प्रत्येक bot token और application ID को उसके account के अंतर्गत रखें। top-level `channels.discord.applicationId` accounts द्वारा inherited होता है, इसलिए उसे वहाँ केवल तभी सेट करें जब हर account को वही application ID उपयोग करनी चाहिए।

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

  <Step title="पहली DM पेयरिंग approve करें">
    Gateway चलने तक प्रतीक्षा करें, फिर Discord में अपने बॉट को DM करें। यह pairing code के साथ उत्तर देगा।

    <Tabs>
      <Tab title="अपने एजेंट से पूछें">
        pairing code को अपने मौजूदा चैनल पर अपने एजेंट को भेजें:

        > "इस Discord pairing code को approve करें: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Pairing codes 1 घंटे के बाद expire हो जाते हैं।

    अब आपको DM के माध्यम से Discord में अपने एजेंट से chat करने में सक्षम होना चाहिए।

  </Step>
</Steps>

<Note>
Token resolution account-aware है। Config token values env fallback पर प्राथमिकता पाते हैं। `DISCORD_BOT_TOKEN` केवल default account के लिए उपयोग होता है।
यदि दो enabled Discord accounts उसी bot token पर resolve होते हैं, तो OpenClaw उस token के लिए केवल एक Gateway monitor शुरू करता है। config-sourced token default env fallback पर प्राथमिकता पाता है; अन्यथा पहला enabled account प्राथमिकता पाता है और duplicate account disabled के रूप में report होता है।
advanced outbound calls (message tool/channel actions) के लिए, explicit per-call `token` उस call के लिए उपयोग होता है। यह send और read/probe-style actions (उदाहरण के लिए read/search/fetch/thread/pins/permissions) पर लागू होता है। Account policy/retry settings अब भी active runtime snapshot में selected account से आते हैं।
</Note>

## अनुशंसित: guild workspace सेट करें

DMs काम करने के बाद, आप अपने Discord सर्वर को full workspace के रूप में सेट कर सकते हैं जहाँ प्रत्येक चैनल को अपने context के साथ अपना एजेंट session मिलता है। यह उन private servers के लिए अनुशंसित है जहाँ सिर्फ आप और आपका बॉट हैं।

<Steps>
  <Step title="अपने सर्वर को guild allowlist में जोड़ें">
    यह आपके एजेंट को आपके सर्वर के किसी भी चैनल में जवाब देने में सक्षम करता है, केवल DMs में नहीं।

    <Tabs>
      <Tab title="अपने एजेंट से पूछें">
        > "मेरी Discord Server ID `<server_id>` को guild allowlist में जोड़ें"
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

  <Step title="@mention के बिना responses की अनुमति दें">
    डिफ़ॉल्ट रूप से, आपका एजेंट guild चैनलों में केवल @mentioned होने पर जवाब देता है। private server के लिए, आप शायद चाहेंगे कि यह हर message का जवाब दे।

    guild चैनलों में, normal replies डिफ़ॉल्ट रूप से automatically post होते हैं। shared always-on rooms के लिए, `messages.groupChat.visibleReplies: "message_tool"` में opt in करें ताकि एजेंट चुपचाप मौजूद रह सके और केवल तब post करे जब वह तय करे कि channel reply उपयोगी है। यह GPT 5.5 जैसे latest-generation, tool-reliable models के साथ सबसे अच्छा काम करता है। Ambient room events शांत रहते हैं जब तक tool नहीं भेजता। पूरा lurk-mode config देखने के लिए [Ambient room events](/hi/channels/ambient-room-events) देखें।

    यदि Discord typing दिखाता है और logs token usage दिखाते हैं लेकिन कोई posted message नहीं है, तो जाँचें कि turn ambient room event के रूप में configured था या message-tool visible replies में opt in किया गया था।

    <Tabs>
      <Tab title="अपने एजेंट से पूछें">
        > "मेरे एजेंट को इस सर्वर पर @mentioned हुए बिना जवाब देने की अनुमति दें"
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

        visible group/channel replies के लिए message-tool sends आवश्यक करने हेतु, `messages.groupChat.visibleReplies: "message_tool"` सेट करें।

      </Tab>
    </Tabs>

  </Step>

  <Step title="guild चैनलों में memory की योजना बनाएँ">
    डिफ़ॉल्ट रूप से, long-term memory (MEMORY.md) केवल DM sessions में load होती है। Guild चैनल MEMORY.md को auto-load नहीं करते।

    <Tabs>
      <Tab title="अपने एजेंट से पूछें">
        > "जब मैं Discord चैनलों में सवाल पूछूँ, तो यदि आपको MEMORY.md से long-term context की आवश्यकता हो तो memory_search या memory_get का उपयोग करें।"
      </Tab>
      <Tab title="Manual">
        यदि आपको हर चैनल में shared context चाहिए, तो stable instructions को `AGENTS.md` या `USER.md` में रखें (वे हर session के लिए injected होते हैं)। long-term notes को `MEMORY.md` में रखें और memory tools के साथ मांग पर उन्हें access करें।
      </Tab>
    </Tabs>

  </Step>
</Steps>

अब अपने Discord सर्वर पर कुछ चैनल बनाएँ और chat शुरू करें। आपका एजेंट channel name देख सकता है, और प्रत्येक चैनल को अपना isolated session मिलता है — इसलिए आप `#coding`, `#home`, `#research`, या अपने workflow के अनुरूप कोई भी channel सेट कर सकते हैं।

## Runtime model

- Gateway Discord कनेक्शन का स्वामी है।
- जवाब रूटिंग निर्धारक है: Discord से आने वाले जवाब वापस Discord पर जाते हैं।
- Discord guild/channel मेटाडेटा मॉडल प्रॉम्प्ट में अविश्वसनीय
  संदर्भ के रूप में जोड़ा जाता है, उपयोगकर्ता-दृश्यमान जवाब prefix के रूप में नहीं। अगर कोई मॉडल उस envelope को
  वापस कॉपी करता है, तो OpenClaw outbound जवाबों और
  भविष्य के replay संदर्भ से कॉपी किया गया मेटाडेटा हटा देता है।
- डिफ़ॉल्ट रूप से (`session.dmScope=main`), direct chats agent main session (`agent:main:main`) साझा करती हैं।
- Guild channels अलग-थलग session keys हैं (`agent:<agentId>:discord:channel:<channelId>`)।
- Group DMs डिफ़ॉल्ट रूप से अनदेखे किए जाते हैं (`channels.discord.dm.groupEnabled=false`)।
- Native slash commands अलग-थलग command sessions (`agent:<agentId>:discord:slash:<userId>`) में चलते हैं, जबकि routed conversation session तक `CommandTargetSessionKey` फिर भी ले जाते हैं।
- Discord को text-only cron/heartbeat announce delivery अंतिम
  assistant-visible answer को एक बार उपयोग करती है। Media और structured component payloads तब
  multi-message रहते हैं जब agent कई deliverable payloads emits करता है।

## Forum channels

Discord forum और media channels केवल thread posts स्वीकार करते हैं। OpenClaw उन्हें बनाने के दो तरीके समर्थित करता है:

- Thread अपने-आप बनाने के लिए forum parent (`channel:<forumId>`) को message भेजें। Thread title आपके message की पहली non-empty line का उपयोग करता है।
- Thread सीधे बनाने के लिए `openclaw message thread create` का उपयोग करें। Forum channels के लिए `--message-id` पास न करें।

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

Forum parents Discord components स्वीकार नहीं करते। अगर आपको components चाहिए, तो thread खुद (`channel:<threadId>`) को भेजें।

## Interactive components

OpenClaw agent messages के लिए Discord components v2 containers समर्थित करता है। `components` payload के साथ message tool का उपयोग करें। Interaction results सामान्य inbound messages के रूप में agent को वापस routed होते हैं और मौजूदा Discord `replyToMode` settings का पालन करते हैं।

समर्थित blocks:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action rows में अधिकतम 5 buttons या एक single select menu हो सकता है
- Select types: `string`, `user`, `role`, `mentionable`, `channel`

डिफ़ॉल्ट रूप से, components single use हैं। Buttons, selects, और forms को expire होने तक कई बार उपयोग करने की अनुमति देने के लिए `components.reusable=true` सेट करें।

किसी button पर कौन click कर सकता है, इसे सीमित करने के लिए उस button पर `allowedUsers` सेट करें (Discord user IDs, tags, या `*`)। Configure होने पर, unmatched users को ephemeral denial मिलता है।

Component callbacks डिफ़ॉल्ट रूप से 30 मिनट बाद expire होते हैं। Default Discord account के लिए उस callback registry lifetime को बदलने के लिए `channels.discord.agentComponents.ttlMs` सेट करें, या multi-account setup में किसी एक account को override करने के लिए `channels.discord.accounts.<accountId>.agentComponents.ttlMs` सेट करें। Value milliseconds में है, positive integer होनी चाहिए, और `86400000` (24 घंटे) पर capped है। Longer TTLs review या approval workflows के लिए उपयोगी हैं जिनमें buttons usable रहने चाहिए, लेकिन वे वह window भी बढ़ाते हैं जहाँ कोई पुराना Discord message अब भी action trigger कर सकता है। Workflow में फिट होने वाला सबसे छोटा TTL prefer करें, और जब stale callbacks surprising होंगे तब default रखें।

`/model` और `/models` slash commands provider, model, और compatible runtime dropdowns तथा Submit step के साथ interactive model picker खोलते हैं। `/models add` deprecated है और अब chat से models register करने के बजाय deprecation message लौटाता है। Picker reply ephemeral है और केवल invoking user इसका उपयोग कर सकता है। Discord select menus 25 options तक सीमित हैं, इसलिए जब आप चाहते हैं कि picker केवल selected providers जैसे `openai` या `vllm` के लिए dynamically discovered models दिखाए, तो `agents.defaults.models` में `provider/*` entries जोड़ें।

File attachments:

- `file` blocks को attachment reference (`attachment://<filename>`) की ओर point करना चाहिए
- Attachment को `media`/`path`/`filePath` (single file) के माध्यम से दें; multiple files के लिए `media-gallery` उपयोग करें
- Upload name को attachment reference से match कराना हो तो override करने के लिए `filename` का उपयोग करें

Modal forms:

- अधिकतम 5 fields के साथ `components.modal` जोड़ें
- Field types: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw trigger button automatically जोड़ता है

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
    `channels.discord.dmPolicy` DM access नियंत्रित करता है। `channels.discord.allowFrom` canonical DM allowlist है।

    - `pairing` (default)
    - `allowlist`
    - `open` (`channels.discord.allowFrom` में `"*"` शामिल होना आवश्यक है)
    - `disabled`

    अगर DM policy open नहीं है, तो unknown users blocked होते हैं (या `pairing` mode में pairing के लिए prompted होते हैं)।

    Multi-account precedence:

    - `channels.discord.accounts.default.allowFrom` केवल `default` account पर लागू होता है।
    - एक account के लिए, `allowFrom` legacy `dm.allowFrom` पर precedence लेता है।
    - Named accounts `channels.discord.allowFrom` inherit करते हैं जब उनका अपना `allowFrom` और legacy `dm.allowFrom` unset हो।
    - Named accounts `channels.discord.accounts.default.allowFrom` inherit नहीं करते।

    Legacy `channels.discord.dm.policy` और `channels.discord.dm.allowFrom` अभी भी compatibility के लिए read होते हैं। `openclaw doctor --fix` उन्हें `dmPolicy` और `allowFrom` में migrate करता है जब वह access बदले बिना ऐसा कर सकता है।

    Delivery के लिए DM target format:

    - `user:<id>`
    - `<@id>` mention

    Bare numeric IDs सामान्यतः channel IDs के रूप में resolve होते हैं जब channel default active हो, लेकिन account के effective DM `allowFrom` में listed IDs compatibility के लिए user DM targets की तरह treat होते हैं।

  </Tab>

  <Tab title="Access groups">
    Discord DMs और text command authorization `channels.discord.allowFrom` में dynamic `accessGroup:<name>` entries उपयोग कर सकते हैं।

    Access group names message channels में shared होते हैं। Static group के लिए `type: "message.senders"` उपयोग करें जिसके members हर channel की normal `allowFrom` syntax में व्यक्त हों, या `type: "discord.channelAudience"` तब उपयोग करें जब Discord channel की current `ViewChannel` audience membership dynamically define करे। Shared access-group behavior यहाँ documented है: [Access groups](/hi/channels/access-groups).

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

    Discord text channel की कोई अलग member list नहीं होती। `type: "discord.channelAudience"` membership को इस तरह model करता है: DM sender configured guild का member है और role तथा channel overwrites लागू होने के बाद configured channel पर उसके पास currently effective `ViewChannel` permission है।

    उदाहरण: DMs को बाकी सभी के लिए closed रखते हुए, जो भी `#maintainers` देख सकता है उसे bot को DM करने दें।

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

    आप dynamic और static entries mix कर सकते हैं:

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

    Lookups fail closed होते हैं। अगर Discord `Missing Access` लौटाता है, member lookup fail होता है, या channel किसी अलग guild से संबंधित है, तो DM sender unauthorized माना जाता है।

    Channel-audience access groups उपयोग करते समय bot के लिए Discord Developer Portal **Server Members Intent** enable करें। DMs में guild member state शामिल नहीं होती, इसलिए OpenClaw authorization time पर Discord REST के माध्यम से member resolve करता है।

  </Tab>

  <Tab title="Guild policy">
    Guild handling `channels.discord.groupPolicy` द्वारा नियंत्रित होता है:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` मौजूद होने पर secure baseline `allowlist` है।

    `allowlist` behavior:

    - guild को `channels.discord.guilds` से match करना चाहिए (`id` preferred, slug accepted)
    - optional sender allowlists: `users` (stable IDs recommended) और `roles` (केवल role IDs); अगर इनमें से कोई configured है, तो senders तब allowed होते हैं जब वे `users` OR `roles` से match करते हैं
    - direct name/tag matching default रूप से disabled है; `channels.discord.dangerouslyAllowNameMatching: true` को केवल break-glass compatibility mode के रूप में enable करें
    - `users` के लिए names/tags supported हैं, लेकिन IDs safer हैं; name/tag entries उपयोग होने पर `openclaw security audit` warning देता है
    - अगर किसी guild में `channels` configured हैं, तो non-listed channels denied होते हैं
    - अगर किसी guild में `channels` block नहीं है, तो उस allowlisted guild के सभी channels allowed हैं

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

    अगर आप केवल `DISCORD_BOT_TOKEN` सेट करते हैं और `channels.discord` block नहीं बनाते, तो runtime fallback `groupPolicy="allowlist"` होता है (logs में warning के साथ), भले ही `channels.defaults.groupPolicy` `open` हो।

  </Tab>

  <Tab title="Mentions and group DMs">
    Guild messages default रूप से mention-gated होते हैं।

    Mention detection में शामिल है:

    - explicit bot mention
    - configured mention patterns (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - supported cases में implicit reply-to-bot behavior

    Outbound Discord messages लिखते समय, canonical mention syntax उपयोग करें: users के लिए `<@USER_ID>`, channels के लिए `<#CHANNEL_ID>`, और roles के लिए `<@&ROLE_ID>`। Legacy `<@!USER_ID>` nickname mention form उपयोग न करें।

    `requireMention` per guild/channel configured होता है (`channels.discord.guilds...`)।
    `ignoreOtherMentions` optional रूप से उन messages को drop करता है जो दूसरे user/role को mention करते हैं लेकिन bot को नहीं (excluding @everyone/@here)।

    Group DMs:

    - default: ignored (`dm.groupEnabled=false`)
    - optional allowlist via `dm.groupChannels` (channel IDs या slugs)

  </Tab>
</Tabs>

### Role-based agent routing

Discord guild सदस्यों को role ID के आधार पर अलग-अलग agents पर route करने के लिए `bindings[].match.roles` का उपयोग करें। Role-आधारित bindings केवल role IDs स्वीकार करते हैं और peer या parent-peer bindings के बाद तथा guild-only bindings से पहले मूल्यांकित होते हैं। यदि कोई binding अन्य match fields भी सेट करती है (उदाहरण के लिए `peer` + `guildId` + `roles`), तो सभी configured fields match होने चाहिए।

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

## Native commands और command auth

- `commands.native` का default `"auto"` है और यह Discord के लिए enabled है।
- Per-channel override: `channels.discord.commands.native`।
- `commands.native=false` startup के दौरान Discord slash-command registration और cleanup को skip करता है। पहले से registered commands Discord में तब तक visible रह सकते हैं जब तक आप उन्हें Discord app से remove नहीं करते।
- Native command auth वही Discord allowlists/policies उपयोग करता है जो normal message handling में उपयोग होती हैं।
- Commands उन users के लिए भी Discord UI में visible रह सकते हैं जो authorized नहीं हैं; execution फिर भी OpenClaw auth enforce करता है और "not authorized" लौटाता है।

Command catalog और behavior के लिए [Slash commands](/hi/tools/slash-commands) देखें।

Default slash command settings:

- `ephemeral: true`

## Feature details

<AccordionGroup>
  <Accordion title="Reply tags और native replies">
    Discord agent output में reply tags support करता है:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` द्वारा नियंत्रित:

    - `off` (default)
    - `first`
    - `all`
    - `batched`

    Note: `off` implicit reply threading को disable करता है। Explicit `[[reply_to_*]]` tags फिर भी honored होते हैं।
    `first` turn के लिए first outbound Discord message में हमेशा implicit native reply reference attach करता है।
    `batched` Discord के implicit native reply reference को केवल तब attach करता है जब
    inbound event multiple messages का debounced batch था। यह तब उपयोगी है
    जब आप native replies मुख्य रूप से ambiguous bursty chats के लिए चाहते हैं, हर
    single-message turn के लिए नहीं।

    Message IDs context/history में surfaced होते हैं ताकि agents specific messages target कर सकें।

  </Accordion>

  <Accordion title="Link previews">
    Discord default रूप से URLs के लिए rich link embeds generate करता है। OpenClaw default रूप से outbound Discord messages पर वे generated embeds suppress करता है, इसलिए agent-sent URLs plain links के रूप में रहते हैं जब तक आप opt in नहीं करते:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    एक account override करने के लिए `channels.discord.accounts.<id>.suppressEmbeds` सेट करें। Agent message-tool sends single message के लिए `suppressEmbeds: false` भी pass कर सकते हैं। Explicit Discord `embeds` payloads default link-preview setting से suppressed नहीं होते।

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw temporary message भेजकर और text आने पर उसे edit करके draft replies stream कर सकता है। `channels.discord.streaming` `off` | `partial` | `block` | `progress` (default) लेता है। `progress` एक editable status draft बनाए रखता है और final delivery तक उसे tool progress के साथ update करता है; shared starter label एक rolling line है, इसलिए पर्याप्त work दिखने पर यह बाकी content की तरह scroll away हो जाता है। `streamMode` legacy runtime alias है। Persisted config को canonical key में rewrite करने के लिए `openclaw doctor --fix` चलाएँ।

    Discord preview edits disable करने के लिए `channels.discord.streaming.mode` को `off` पर सेट करें। यदि Discord block streaming explicit रूप से enabled है, तो OpenClaw double-streaming से बचने के लिए preview stream skip करता है।

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

    - `partial` tokens आने पर single preview message edit करता है।
    - `block` draft-sized chunks emit करता है (size और breakpoints tune करने के लिए `draftChunk` उपयोग करें, `textChunkLimit` तक clamped)।
    - Media, error, और explicit-reply finals pending preview edits cancel करते हैं।
    - `streaming.preview.toolProgress` (default `true`) control करता है कि tool/progress updates preview message reuse करते हैं या नहीं।
    - Tool/progress rows उपलब्ध होने पर compact emoji + title + detail के रूप में render होते हैं, उदाहरण के लिए `🛠️ Bash: run tests` या `🔎 Web Search: for "query"`।
    - `streaming.progress.commentary` (default `false`) temporary progress draft में assistant commentary/preamble text के लिए opt in करता है। Commentary display से पहले clean की जाती है, transient रहती है, और final answer delivery नहीं बदलती।
    - `streaming.progress.maxLineChars` per-line progress preview budget control करता है। Prose word boundaries पर short किया जाता है; command और path details useful suffixes रखते हैं।
    - `streaming.preview.commandText` / `streaming.progress.commandText` compact progress lines में command/exec detail control करता है: `raw` (default) या `status` (tool label only)।

    Compact progress lines रखते हुए raw command/exec text छिपाएँ:

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

    Preview streaming text-only है; media replies normal delivery पर fall back करते हैं। जब `block` streaming explicit रूप से enabled होती है, OpenClaw double-streaming से बचने के लिए preview stream skip करता है।

  </Accordion>

  <Accordion title="History, context, और thread behavior">
    Guild history context:

    - `channels.discord.historyLimit` default `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disables

    DM history controls:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Thread behavior:

    - Discord threads channel sessions के रूप में route होते हैं और override न होने पर parent channel config inherit करते हैं।
    - Thread sessions parent channel के session-level `/model` selection को model-only fallback के रूप में inherit करते हैं; thread-local `/model` selections फिर भी precedence लेते हैं और transcript inheritance enabled न होने पर parent transcript history copy नहीं होती।
    - `channels.discord.thread.inheritParent` (default `false`) new auto-threads को parent transcript से seed करने के लिए opt in करता है। Per-account overrides `channels.discord.accounts.<id>.thread.inheritParent` के अंतर्गत रहते हैं।
    - Message-tool reactions `user:<id>` DM targets resolve कर सकते हैं।
    - `guilds.<guild>.channels.<channel>.requireMention: false` reply-stage activation fallback के दौरान preserved रहता है।

    Channel topics **untrusted** context के रूप में injected होते हैं। Allowlists gate करती हैं कि agent को कौन trigger कर सकता है, लेकिन वे full supplemental-context redaction boundary नहीं हैं।

  </Accordion>

  <Accordion title="Subagents के लिए thread-bound sessions">
    Discord किसी thread को session target से bind कर सकता है ताकि उस thread में follow-up messages उसी session (subagent sessions सहित) पर route होते रहें।

    Commands:

    - `/focus <target>` current/new thread को subagent/session target से bind करें
    - `/unfocus` current thread binding remove करें
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

    Notes:

    - `session.threadBindings.*` global defaults सेट करता है।
    - `channels.discord.threadBindings.*` Discord behavior override करता है।
    - `spawnSessions` `sessions_spawn({ thread: true })` और ACP thread spawns के लिए auto-create/bind threads control करता है। Default: `true`।
    - `defaultSpawnContext` thread-bound spawns के लिए native subagent context control करता है। Default: `"fork"`।
    - Deprecated `spawnSubagentSessions`/`spawnAcpSessions` keys `openclaw doctor --fix` द्वारा migrated होती हैं।
    - यदि किसी account के लिए thread bindings disabled हैं, तो `/focus` और related thread binding operations unavailable हैं।

    [Sub-agents](/hi/tools/subagents), [ACP Agents](/hi/tools/acp-agents), और [Configuration Reference](/hi/gateway/configuration-reference) देखें।

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Stable "always-on" ACP workspaces के लिए, Discord conversations target करने वाली top-level typed ACP bindings configure करें।

    Config path:

    - `bindings[]` with `type: "acp"` और `match.channel: "discord"`

    Example:

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

    Notes:

    - `/acp spawn codex --bind here` current channel या thread को उसी स्थान पर bind करता है और future messages को same ACP session पर रखता है। Thread messages parent channel binding inherit करते हैं।
    - Bound channel या thread में, `/new` और `/reset` same ACP session को उसी स्थान पर reset करते हैं। Temporary thread bindings active रहते हुए target resolution override कर सकते हैं।
    - `spawnSessions` `--thread auto|here` के माध्यम से child thread creation/binding gate करता है।

    Binding behavior details के लिए [ACP Agents](/hi/tools/acp-agents) देखें।

  </Accordion>

  <Accordion title="Reaction notifications">
    Per-guild reaction notification mode:

    - `off`
    - `own` (default)
    - `all`
    - `allowlist` (`guilds.<id>.users` उपयोग करता है)

    Reaction events system events में बदले जाते हैं और routed Discord session से attached होते हैं।

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` OpenClaw द्वारा inbound message process करते समय acknowledgement emoji भेजता है।

    Resolution order:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji fallback (`agents.list[].identity.emoji`, else "👀")

    Notes:

    - Discord unicode emoji या custom emoji names स्वीकार करता है।
    - किसी channel या account के लिए reaction disable करने के लिए `""` उपयोग करें।

  </Accordion>

  <Accordion title="Config writes">
    Channel-initiated config writes default रूप से enabled हैं।

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
    Discord Gateway WebSocket proxying explicit है; WebSocket connections Gateway process से ambient proxy environment variables inherit नहीं करते। Startup REST lookups इस proxy का उपयोग करते हैं जब `channels.discord.proxy` configured हो।

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

  <Accordion title="PluralKit समर्थन">
    प्रॉक्सी किए गए संदेशों को सिस्टम सदस्य पहचान से मैप करने के लिए PluralKit रिज़ॉल्यूशन सक्षम करें:

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

    - allowlist में `pk:<memberId>` का उपयोग किया जा सकता है
    - सदस्य प्रदर्शन नामों का मिलान नाम/स्लग से केवल तब किया जाता है जब `channels.discord.dangerouslyAllowNameMatching: true` हो
    - lookup मूल संदेश ID का उपयोग करते हैं और समय-विंडो से सीमित होते हैं
    - यदि lookup विफल होता है, तो प्रॉक्सी किए गए संदेशों को bot संदेश माना जाता है और `allowBots=true` न होने पर छोड़ दिया जाता है

  </Accordion>

  <Accordion title="आउटबाउंड mention aliases">
    जब एजेंटों को ज्ञात Discord उपयोगकर्ताओं के लिए नियतात्मक आउटबाउंड mentions चाहिए हों, तब `mentionAliases` का उपयोग करें। Keys अग्रणी `@` के बिना handles हैं; values Discord user IDs हैं। अज्ञात handles, `@everyone`, `@here`, और Markdown code spans के अंदर mentions अपरिवर्तित छोड़े जाते हैं।

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

  <Accordion title="Presence कॉन्फ़िगरेशन">
    Presence अपडेट तब लागू होते हैं जब आप status या activity field सेट करते हैं, या जब आप auto presence सक्षम करते हैं।

    केवल status का उदाहरण:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Activity उदाहरण (custom status डिफ़ॉल्ट activity type है):

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

    Streaming उदाहरण:

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

    Activity type map:

    - 0: Playing
    - 1: Streaming (`activityUrl` आवश्यक)
    - 2: Listening
    - 3: Watching
    - 4: Custom (activity text को status state के रूप में उपयोग करता है; emoji वैकल्पिक है)
    - 5: Competing

    Auto presence उदाहरण (runtime health signal):

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

    Auto presence runtime availability को Discord status से मैप करता है: healthy => online, degraded या unknown => idle, exhausted या unavailable => dnd. वैकल्पिक text overrides:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` placeholder का समर्थन करता है)

  </Accordion>

  <Accordion title="Discord में अनुमोदन">
    Discord DMs में button-आधारित approval handling का समर्थन करता है और वैकल्पिक रूप से originating channel में approval prompts पोस्ट कर सकता है।

    Config path:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (वैकल्पिक; संभव होने पर `commands.ownerAllowFrom` पर fallback करता है)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord native exec approvals को auto-enable करता है जब `enabled` unset या `"auto"` हो और कम से कम एक approver resolve किया जा सके, या तो `execApprovals.approvers` से या `commands.ownerAllowFrom` से। Discord channel `allowFrom`, legacy `dm.allowFrom`, या direct-message `defaultTo` से exec approvers infer नहीं करता। Discord को native approval client के रूप में स्पष्ट रूप से अक्षम करने के लिए `enabled: false` सेट करें।

    `/diagnostics` और `/export-trajectory` जैसे संवेदनशील owner-only group commands के लिए, OpenClaw approval prompts और अंतिम results निजी रूप से भेजता है। जब invoking owner के पास Discord owner route होता है, तो यह पहले Discord DM आज़माता है; यदि वह उपलब्ध नहीं है, तो यह `commands.ownerAllowFrom` से पहले उपलब्ध owner route, जैसे Telegram, पर fallback करता है।

    जब `target` `channel` या `both` हो, तो approval prompt channel में दिखाई देता है। केवल resolved approvers buttons का उपयोग कर सकते हैं; अन्य उपयोगकर्ताओं को ephemeral denial मिलता है। Approval prompts में command text शामिल होता है, इसलिए channel delivery केवल trusted channels में सक्षम करें। यदि channel ID को session key से derive नहीं किया जा सकता, तो OpenClaw DM delivery पर fallback करता है।

    Discord अन्य chat channels द्वारा उपयोग किए जाने वाले साझा approval buttons भी render करता है। native Discord adapter मुख्य रूप से approver DM routing और channel fanout जोड़ता है।
    जब वे buttons मौजूद हों, वे primary approval UX होते हैं; OpenClaw
    को manual `/approve` command केवल तब शामिल करनी चाहिए जब tool result कहे कि
    chat approvals अनुपलब्ध हैं या manual approval ही एकमात्र path है।
    यदि Discord native approval runtime सक्रिय नहीं है, तो OpenClaw
    local deterministic `/approve <id> <decision>` prompt दिखाई देता रखता है। यदि
    runtime सक्रिय है लेकिन native card किसी target तक deliver नहीं किया जा सकता,
    तो OpenClaw pending approval से exact `/approve`
    command के साथ same-chat fallback notice भेजता है।

    Gateway auth और approval resolution साझा Gateway client contract का पालन करते हैं (`plugin:` IDs `plugin.approval.resolve` के माध्यम से resolve होते हैं; अन्य IDs `exec.approval.resolve` के माध्यम से)। Approvals डिफ़ॉल्ट रूप से 30 मिनट के बाद expire हो जाते हैं।

    [Exec approvals](/hi/tools/exec-approvals) देखें।

  </Accordion>
</AccordionGroup>

## Tools और action gates

Discord message actions में messaging, channel admin, moderation, presence, और metadata actions शामिल हैं।

Core उदाहरण:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` action scheduled event cover image सेट करने के लिए वैकल्पिक `image` parameter (URL या local file path) स्वीकार करता है।

Action gates `channels.discord.actions.*` के अंतर्गत रहते हैं।

Default gate behavior:

| Action group                                                                                                                                                             | Default |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClaw exec approvals और cross-context markers के लिए Discord components v2 का उपयोग करता है। Discord message actions custom UI के लिए `components` भी स्वीकार कर सकते हैं (advanced; discord tool के माध्यम से component payload बनाने की आवश्यकता होती है), जबकि legacy `embeds` उपलब्ध रहते हैं लेकिन recommended नहीं हैं।

- `channels.discord.ui.components.accentColor` Discord component containers द्वारा उपयोग किया जाने वाला accent color सेट करता है (hex)।
- प्रति account `channels.discord.accounts.<id>.ui.components.accentColor` से सेट करें।
- `channels.discord.agentComponents.ttlMs` नियंत्रित करता है कि भेजे गए Discord component callbacks कितनी देर तक registered रहते हैं (default `1800000`, maximum `86400000`)। प्रति account `channels.discord.accounts.<id>.agentComponents.ttlMs` से सेट करें।
- components v2 मौजूद होने पर `embeds` ignore किए जाते हैं।
- Plain URL previews default रूप से suppress किए जाते हैं। जब single outbound link expand होना चाहिए, तो message action पर `suppressEmbeds: false` सेट करें।

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

## Voice

Discord में दो अलग-अलग voice surfaces हैं: realtime **voice channels** (continuous conversations) और **voice message attachments** (waveform preview format)। Gateway दोनों का समर्थन करता है।

### Voice channels

Setup checklist:

1. Discord Developer Portal में Message Content Intent सक्षम करें।
2. role/user allowlists उपयोग होने पर Server Members Intent सक्षम करें।
3. bot को `bot` और `applications.commands` scopes के साथ invite करें।
4. target voice channel में Connect, Speak, Send Messages, और Read Message History प्रदान करें।
5. native commands (`commands.native` या `channels.discord.commands.native`) सक्षम करें।
6. `channels.discord.voice` configure करें।

sessions को control करने के लिए `/vc join|leave|status` का उपयोग करें। command account default agent का उपयोग करता है और अन्य Discord commands जैसे ही allowlist और group policy rules का पालन करता है।

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

join करने से पहले bot की effective permissions inspect करने के लिए, चलाएँ:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Auto-join उदाहरण:

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

- `voice.tts` केवल `stt-tts` वॉइस प्लेबैक के लिए `messages.tts` को ओवरराइड करता है। रीयलटाइम मोड `voice.realtime.speakerVoice` का उपयोग करते हैं।
- `voice.mode` बातचीत पथ को नियंत्रित करता है। डिफ़ॉल्ट `agent-proxy` है: एक रीयलटाइम वॉइस फ्रंट एंड टर्न टाइमिंग, इंटरप्शन, और प्लेबैक संभालता है, `openclaw_agent_consult` के ज़रिए रूट किए गए OpenClaw एजेंट को सार्थक काम सौंपता है, और परिणाम को उस स्पीकर से आए टाइप किए गए Discord प्रॉम्प्ट की तरह मानता है। `stt-tts` पुराना बैच STT प्लस TTS फ़्लो रखता है। `bidi` रीयलटाइम मॉडल को सीधे बातचीत करने देता है, जबकि OpenClaw ब्रेन के लिए `openclaw_agent_consult` उपलब्ध कराता है।
- `voice.agentSession` नियंत्रित करता है कि कौन-सी OpenClaw बातचीत वॉइस टर्न प्राप्त करती है। वॉइस चैनल के अपने सेशन के लिए इसे सेट न करें, या वॉइस चैनल को `#maintainers` जैसे मौजूदा Discord टेक्स्ट चैनल सेशन के माइक्रोफ़ोन/स्पीकर एक्सटेंशन के रूप में काम कराने के लिए `{ mode: "target", target: "channel:<text-channel-id>" }` सेट करें।
- `voice.model` Discord वॉइस जवाबों और रीयलटाइम कंसल्ट्स के लिए OpenClaw एजेंट ब्रेन को ओवरराइड करता है। रूट किए गए एजेंट मॉडल को इनहेरिट करने के लिए इसे सेट न करें। यह `voice.realtime.model` से अलग है।
- `voice.followUsers` बॉट को चुने हुए उपयोगकर्ताओं के साथ Discord वॉइस में जुड़ने, मूव करने, और छोड़ने देता है। व्यवहार नियमों और उदाहरणों के लिए [वॉइस में उपयोगकर्ताओं का अनुसरण करें](#follow-users-in-voice) देखें।
- `agent-proxy` स्पीच को `discord-voice` के माध्यम से रूट करता है, जो स्पीकर और टार्गेट सेशन के लिए सामान्य owner/tool ऑथराइज़ेशन बनाए रखता है, लेकिन एजेंट `tts` टूल छिपाता है क्योंकि Discord वॉइस प्लेबैक का मालिक है। डिफ़ॉल्ट रूप से, `agent-proxy` owner स्पीकर्स के लिए कंसल्ट को पूर्ण owner-समकक्ष टूल एक्सेस देता है (`voice.realtime.toolPolicy: "owner"`) और सार्थक उत्तरों से पहले OpenClaw एजेंट से कंसल्ट करने को बहुत प्राथमिकता देता है (`voice.realtime.consultPolicy: "always"`)। उस डिफ़ॉल्ट `always` मोड में, रीयलटाइम लेयर कंसल्ट उत्तर से पहले अपने-आप फ़िलर नहीं बोलती; यह स्पीच कैप्चर और ट्रांसक्राइब करती है, फिर रूट किया गया OpenClaw उत्तर बोलती है। यदि Discord पहले उत्तर को अभी भी चला रहा हो और कई मजबूर कंसल्ट उत्तर समाप्त हो जाएँ, तो बाद के exact-speech उत्तरों को बीच वाक्य में स्पीच बदलने के बजाय प्लेबैक निष्क्रिय होने तक क्यू में रखा जाता है।
- `stt-tts` मोड में, STT `tools.media.audio` का उपयोग करता है; `voice.model` ट्रांसक्रिप्शन को प्रभावित नहीं करता।
- रीयलटाइम मोड में, `voice.realtime.provider`, `voice.realtime.model`, और `voice.realtime.speakerVoice` रीयलटाइम ऑडियो सेशन कॉन्फ़िगर करते हैं। OpenAI Realtime 2 प्लस Codex ब्रेन के लिए, `voice.realtime.model: "gpt-realtime-2"` और `voice.model: "openai/gpt-5.5"` उपयोग करें।
- रीयलटाइम वॉइस मोड डिफ़ॉल्ट रूप से रीयलटाइम प्रदाता निर्देशों में छोटे `IDENTITY.md`, `USER.md`, और `SOUL.md` प्रोफ़ाइल फ़ाइलें शामिल करते हैं, ताकि तेज़ सीधे टर्न वही पहचान, उपयोगकर्ता आधार, और persona रखें जो रूट किए गए OpenClaw एजेंट में है। इसे कस्टमाइज़ करने के लिए `voice.realtime.bootstrapContextFiles` को किसी subset पर सेट करें, या इसे बंद करने के लिए `[]` सेट करें। समर्थित रीयलटाइम bootstrap फ़ाइलें केवल उन प्रोफ़ाइल फ़ाइलों तक सीमित हैं; `AGENTS.md` सामान्य एजेंट संदर्भ में रहता है। इंजेक्ट किया गया प्रोफ़ाइल संदर्भ workspace काम, मौजूदा तथ्यों, मेमोरी lookup, या टूल-समर्थित कार्रवाइयों के लिए `openclaw_agent_consult` को प्रतिस्थापित नहीं करता।
- OpenAI `agent-proxy` रीयलटाइम मोड में, Discord रीयलटाइम वॉइस को तब तक मौन रखने के लिए `voice.realtime.requireWakeName: true` सेट करें जब तक कोई ट्रांसक्रिप्ट wake name से शुरू या समाप्त न हो। कॉन्फ़िगर किए गए wake names एक या दो शब्द होने चाहिए। यदि `voice.realtime.wakeNames` सेट नहीं है, तो OpenClaw रूट किए गए एजेंट `name` प्लस `OpenClaw` का उपयोग करता है, और fallback में एजेंट id प्लस `OpenClaw` का उपयोग करता है। Wake-name gating रीयलटाइम प्रदाता auto-response को बंद करती है, स्वीकार किए गए टर्न को OpenClaw एजेंट कंसल्ट पथ से रूट करती है, और अंतिम ट्रांसक्रिप्ट आने से पहले partial transcription से leading wake name पहचाने जाने पर एक छोटा बोला गया acknowledgement देती है।
- OpenAI रीयलटाइम प्रदाता आउटपुट ऑडियो और ट्रांसक्रिप्ट इवेंट्स के लिए मौजूदा Realtime 2 इवेंट नाम और legacy Codex-compatible aliases स्वीकार करता है, ताकि compatible provider snapshots सहायक ऑडियो छोड़े बिना drift कर सकें।
- `voice.realtime.bargeIn` नियंत्रित करता है कि Discord speaker-start events सक्रिय रीयलटाइम प्लेबैक को interrupt करते हैं या नहीं। यदि unset हो, तो यह रीयलटाइम प्रदाता की input-audio interruption setting का पालन करता है।
- `voice.realtime.minBargeInAudioEndMs` OpenAI रीयलटाइम barge-in द्वारा ऑडियो truncate करने से पहले न्यूनतम assistant playback duration नियंत्रित करता है। डिफ़ॉल्ट: `250`। low-echo rooms में immediate interruption के लिए `0` सेट करें, या echo-heavy speaker setups के लिए इसे बढ़ाएँ।
- Discord प्लेबैक पर OpenAI वॉइस के लिए, `voice.tts.provider: "openai"` सेट करें और `voice.tts.providers.openai.speakerVoice` के अंतर्गत Text-to-speech voice चुनें। मौजूदा OpenAI TTS मॉडल पर `cedar` एक अच्छा masculine-sounding विकल्प है।
- Per-channel Discord `systemPrompt` overrides उस वॉइस चैनल के वॉइस ट्रांसक्रिप्ट टर्न पर लागू होते हैं।
- वॉइस ट्रांसक्रिप्ट टर्न owner-gated commands और channel actions के लिए Discord `allowFrom` (या `dm.allowFrom`) से owner status प्राप्त करते हैं। एजेंट टूल visibility रूट किए गए सेशन के लिए कॉन्फ़िगर की गई tool policy का पालन करती है।
- Discord वॉइस text-only configs के लिए opt-in है; `/vc` commands, वॉइस runtime, और `GuildVoiceStates` gateway intent सक्षम करने के लिए `channels.discord.voice.enabled=true` सेट करें (या मौजूदा `channels.discord.voice` block रखें)।
- `channels.discord.intents.voiceStates` voice-state intent subscription को स्पष्ट रूप से override कर सकता है। intent को प्रभावी voice enablement का पालन कराने के लिए इसे unset छोड़ें।
- यदि `voice.autoJoin` में एक ही guild के लिए कई entries हैं, तो OpenClaw उस guild के लिए आख़िरी configured channel में जुड़ता है।
- `voice.allowedChannels` एक वैकल्पिक residency allowlist है। किसी भी authorized Discord voice channel में `/vc join` की अनुमति देने के लिए इसे unset छोड़ें। सेट होने पर, `/vc join`, startup auto-join, और bot voice-state moves सूचीबद्ध `{ guildId, channelId }` entries तक सीमित रहते हैं। सभी Discord voice joins deny करने के लिए इसे empty array पर सेट करें। यदि Discord बॉट को allowlist के बाहर move करता है, तो OpenClaw उस channel को छोड़ देता है और उपलब्ध होने पर configured auto-join target से फिर जुड़ता है।
- `voice.daveEncryption` और `voice.decryptionFailureTolerance` `@discordjs/voice` join options तक pass through होते हैं।
- यदि unset हों, तो `@discordjs/voice` defaults `daveEncryption=true` और `decryptionFailureTolerance=24` हैं।
- OpenClaw Discord voice receive और realtime raw PCM playback के लिए bundled `libopus-wasm` codec का उपयोग करता है। यह pinned libopus WebAssembly build ship करता है और native opus addons की आवश्यकता नहीं होती।
- `voice.connectTimeoutMs` `/vc join` और auto-join attempts के लिए शुरुआती `@discordjs/voice` Ready wait नियंत्रित करता है। डिफ़ॉल्ट: `30000`।
- `voice.reconnectGraceMs` नियंत्रित करता है कि disconnected voice session को destroy करने से पहले OpenClaw उसके reconnecting शुरू होने का कितनी देर इंतज़ार करता है। डिफ़ॉल्ट: `15000`।
- `stt-tts` मोड में, वॉइस प्लेबैक सिर्फ़ इसलिए नहीं रुकता क्योंकि कोई दूसरा उपयोगकर्ता बोलना शुरू कर देता है। feedback loops से बचने के लिए, TTS playing होने के दौरान OpenClaw नया voice capture ignore करता है; अगले turn के लिए playback समाप्त होने के बाद बोलें। रीयलटाइम मोड speaker starts को barge-in signals के रूप में realtime provider को forward करते हैं।
- रीयलटाइम मोड में, speakers से open mic में आने वाली echo barge-in जैसी दिख सकती है और playback interrupt कर सकती है। echo-heavy Discord rooms के लिए, input audio पर OpenAI को auto-interrupt करने से रोकने के लिए `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` सेट करें। यदि आप अभी भी चाहते हैं कि Discord speaker-start events सक्रिय playback interrupt करें, तो `voice.realtime.bargeIn: true` जोड़ें। OpenAI realtime bridge `voice.realtime.minBargeInAudioEndMs` से छोटी playback truncations को संभावित echo/noise मानकर ignore करता है और Discord playback clear करने के बजाय उन्हें skipped के रूप में log करता है।
- `voice.captureSilenceGraceMs` नियंत्रित करता है कि Discord द्वारा किसी speaker के रुकने की रिपोर्ट के बाद OpenClaw उस audio segment को STT के लिए finalize करने से पहले कितनी देर इंतज़ार करता है। डिफ़ॉल्ट: `2000`; यदि Discord सामान्य pauses को choppy partial transcripts में बाँटता है, तो इसे बढ़ाएँ।
- जब ElevenLabs चुना गया TTS provider हो, तो Discord voice playback streaming TTS का उपयोग करता है और provider response stream से शुरू होता है। Streaming support के बिना providers synthesized temp-file path पर fallback करते हैं।
- OpenClaw receive decrypt failures को भी देखता है और कम समय में repeated failures के बाद voice channel छोड़कर/rejoin करके auto-recover करता है।
- यदि update करने के बाद receive logs बार-बार `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` दिखाएँ, तो dependency report और logs collect करें। bundled `@discordjs/voice` line में discord.js PR #11449 से upstream padding fix शामिल है, जिसने discord.js issue #11419 बंद किया।
- `The operation was aborted` receive events अपेक्षित हैं जब OpenClaw captured speaker segment को finalize करता है; वे verbose diagnostics हैं, warnings नहीं।
- Verbose Discord voice logs हर accepted speaker segment के लिए bounded one-line STT transcript preview शामिल करते हैं, ताकि debugging unbounded transcript text dump किए बिना user side और agent reply side दोनों दिखाए।
- `agent-proxy` मोड में, forced consult fallback संभावित incomplete transcript fragments को skip करता है, जैसे `...` पर समाप्त text या `and` जैसा trailing connector, साथ ही “be right back” या “bye” जैसे obvious non-actionable closings। जब यह stale queued answer को रोकता है, logs `forced agent consult skipped reason=...` दिखाते हैं।

### वॉइस में उपयोगकर्ताओं का अनुसरण करें

जब आप चाहते हैं कि Discord voice bot startup पर किसी fixed channel में जुड़ने या `/vc join` की प्रतीक्षा करने के बजाय एक या अधिक ज्ञात Discord users के साथ रहे, तो `voice.followUsers` का उपयोग करें।

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

- `followUsers` raw Discord user IDs और `discord:<id>` values स्वीकार करता है। OpenClaw voice-state events match करने से पहले दोनों forms normalize करता है।
- `followUsersEnabled` डिफ़ॉल्ट रूप से `true` होता है जब `followUsers` configured हो। saved list रखने लेकिन automatic voice following रोकने के लिए इसे `false` पर सेट करें।
- जब followed user allowed voice channel में जुड़ता है, तो OpenClaw उस channel में जुड़ता है। जब user move करता है, OpenClaw उनके साथ move करता है। जब active followed user disconnect करता है, OpenClaw leave करता है।
- यदि एक ही guild में कई followed users हैं और active followed user leave करता है, तो OpenClaw guild छोड़ने से पहले किसी दूसरे tracked followed user's channel में move करता है। यदि कई followed users एक साथ move करते हैं, तो latest observed voice-state event जीतता है।
- `allowedChannels` अब भी लागू होता है। disallowed channel में followed user को ignore किया जाता है, और follow-owned session किसी दूसरे followed user पर move करता है या leave करता है।
- OpenClaw startup पर और bounded interval पर missed voice-state events reconcile करता है। Reconciliation configured guilds sample करता है और प्रति run REST lookups cap करता है, इसलिए बहुत बड़ी `followUsers` lists को converge होने में एक से अधिक interval लग सकते हैं।
- यदि Discord या कोई admin बॉट को user follow करते समय move करता है, तो OpenClaw voice session rebuild करता है और destination allowed होने पर follow ownership preserve करता है। यदि बॉट `allowedChannels` के बाहर move किया जाता है, तो OpenClaw leave करता है और कोई configured target मौजूद होने पर rejoin करता है।
- DAVE receive recovery repeated decrypt failures के बाद वही channel छोड़कर फिर जुड़ सकती है। Follow-owned sessions उस recovery path के दौरान अपनी follow ownership बनाए रखते हैं, इसलिए बाद में followed-user disconnect होने पर channel अब भी leave होता है।

join modes में से चुनें:

- personal या operator setups के लिए `followUsers` उपयोग करें जहाँ bot को आपके voice में होने पर अपने-आप voice में होना चाहिए।
- fixed-room bots के लिए `autoJoin` उपयोग करें जिन्हें voice में कोई tracked user न होने पर भी present रहना चाहिए।
- one-off joins या ऐसे rooms के लिए `/vc join` उपयोग करें जहाँ automatic voice presence अप्रत्याशित होगी।

Discord voice codec:

- वॉइस प्राप्ति लॉग `discord voice: opus decoder: libopus-wasm` दिखाते हैं।
- Realtime प्लेबैक पैकेटों को `@discordjs/voice` को सौंपने से पहले उसी बंडल किए गए `libopus-wasm` पैकेज के साथ कच्चे 48 kHz स्टीरियो PCM को Opus में एन्कोड करता है।
- फ़ाइल और provider-stream प्लेबैक ffmpeg के साथ कच्चे 48 kHz स्टीरियो PCM में ट्रांसकोड करता है, फिर Discord को भेजी जाने वाली Opus पैकेट स्ट्रीम के लिए `libopus-wasm` का उपयोग करता है।

STT और TTS पाइपलाइन:

- Discord PCM कैप्चर को WAV अस्थायी फ़ाइल में बदला जाता है।
- `tools.media.audio` STT संभालता है, उदाहरण के लिए `openai/gpt-4o-mini-transcribe`।
- ट्रांसक्रिप्ट Discord ingress और रूटिंग से होकर भेजी जाती है, जबकि प्रतिक्रिया LLM एक voice-output नीति के साथ चलता है जो एजेंट `tts` टूल को छिपाती है और लौटाया गया टेक्स्ट मांगती है, क्योंकि अंतिम TTS प्लेबैक Discord voice के स्वामित्व में है।
- `voice.model`, सेट होने पर, इस voice-channel turn के लिए केवल प्रतिक्रिया LLM को ओवरराइड करता है।
- `voice.tts` को `messages.tts` पर मर्ज किया जाता है; स्ट्रीमिंग-सक्षम प्रदाता प्लेयर को सीधे फ़ीड करते हैं, अन्यथा परिणामी ऑडियो फ़ाइल जुड़े हुए चैनल में चलाई जाती है।

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

`voice.agentSession` ब्लॉक न होने पर, प्रत्येक वॉइस चैनल को अपना रूटेड OpenClaw सत्र मिलता है। उदाहरण के लिए, `/vc join channel:234567890123456789` उस Discord वॉइस चैनल के सत्र से बात करता है। Realtime मॉडल केवल वॉइस फ्रंट एंड है; वास्तविक अनुरोध कॉन्फ़िगर किए गए OpenClaw एजेंट को सौंपे जाते हैं। यदि realtime मॉडल consult टूल को कॉल किए बिना अंतिम ट्रांसक्रिप्ट बनाता है, तो OpenClaw fallback के रूप में consult को बाध्य करता है ताकि डिफ़ॉल्ट अभी भी एजेंट से बात करने जैसा व्यवहार करे।

लेगेसी STT और TTS उदाहरण:

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

मौजूदा Discord चैनल सत्र के विस्तार के रूप में voice:

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

`agent-proxy` मोड में bot कॉन्फ़िगर किए गए वॉइस चैनल से जुड़ता है, लेकिन OpenClaw एजेंट turns लक्ष्य चैनल के सामान्य रूटेड सत्र और एजेंट का उपयोग करते हैं। Realtime वॉइस सत्र लौटाए गए परिणाम को वापस वॉइस चैनल में बोलता है। supervisor एजेंट अभी भी अपनी tool policy के अनुसार सामान्य message tools का उपयोग कर सकता है, जिसमें अलग Discord संदेश भेजना भी शामिल है यदि वही सही कार्रवाई हो।

जब कोई delegated OpenClaw run सक्रिय होता है, नए Discord वॉइस ट्रांसक्रिप्ट को दूसरा एजेंट turn शुरू करने से पहले live run control माना जाता है। "status", "cancel that", "use the smaller fix", या "when you're done also check tests" जैसे वाक्यांशों को सक्रिय सत्र के लिए status, cancel, steering, या follow-up input के रूप में वर्गीकृत किया जाता है। Status, cancel, accepted steering, और follow-up परिणाम वॉइस चैनल में बोलकर लौटाए जाते हैं ताकि कॉलर को पता चले कि OpenClaw ने अनुरोध संभाला या नहीं।

उपयोगी target रूप:

- `target: "channel:123456789012345678"` Discord टेक्स्ट चैनल सत्र से होकर रूट करता है।
- `target: "123456789012345678"` को चैनल target माना जाता है।
- `target: "dm:123456789012345678"` या `target: "user:123456789012345678"` उस direct-message सत्र से होकर रूट करता है।

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

इसका उपयोग तब करें जब मॉडल खुले mic के माध्यम से अपना ही Discord प्लेबैक सुनता है, लेकिन आप फिर भी बोलकर उसे बाधित करना चाहते हैं। OpenClaw OpenAI को raw input audio पर auto-interrupt करने से रोकता है, जबकि `bargeIn: true` Discord speaker-start events और पहले से सक्रिय speaker audio को अगला captured turn OpenAI तक पहुंचने से पहले सक्रिय realtime responses को cancel करने देता है। `minBargeInAudioEndMs` से कम `audioEndMs` वाले बहुत शुरुआती barge-in signals को संभावित echo/noise माना जाता है और अनदेखा किया जाता है ताकि मॉडल पहले playback frame पर कट ऑफ न हो।

अपेक्षित वॉइस लॉग:

- join पर: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- realtime start पर: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- speaker audio पर: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, और `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- छोड़ी गई stale speech पर: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` या `reason=non-actionable-closing ...`
- realtime response completion पर: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- playback stop/reset पर: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- realtime consult पर: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- agent answer पर: `discord voice: agent turn answer ...`
- queued exact speech पर: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, इसके बाद `discord voice: realtime exact speech dequeued reason=player-idle ...`
- barge-in detection पर: `discord voice: realtime barge-in detected source=speaker-start ...` या `discord voice: realtime barge-in detected source=active-speaker-audio ...`, इसके बाद `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- realtime interruption पर: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, इसके बाद या तो `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` या `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- अनदेखे echo/noise पर: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- disabled barge-in पर: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- idle playback पर: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

कटे हुए ऑडियो को debug करने के लिए, realtime वॉइस लॉग को timeline की तरह पढ़ें:

1. `realtime audio playback started` का अर्थ है कि Discord ने assistant audio चलाना शुरू कर दिया है। Bridge इस बिंदु से assistant output chunks, Discord PCM bytes, provider realtime bytes, और synthesized audio duration गिनना शुरू करता है।
2. `realtime speaker turn opened` किसी Discord speaker के active होने को चिह्नित करता है। यदि playback पहले से active है और `bargeIn` enabled है, तो इसके बाद `barge-in detected source=speaker-start` आ सकता है।
3. `realtime input audio started` उस speaker turn के लिए प्राप्त पहले वास्तविक audio frame को चिह्नित करता है। यहां `outputActive=true` या nonzero `outputAudioMs` का अर्थ है कि mic input भेज रहा है जबकि assistant playback अभी भी active है।
4. `barge-in detected source=active-speaker-audio` का अर्थ है कि OpenClaw ने assistant playback active रहने के दौरान live speaker audio देखा। यह वास्तविक interruption को बिना उपयोगी audio वाले Discord speaker-start event से अलग पहचानने में उपयोगी है।
5. `barge-in requested reason=...` का अर्थ है कि OpenClaw ने realtime provider से active response को cancel या truncate करने को कहा। इसमें `outputAudioMs`, `outputActive`, और `playbackChunks` शामिल हैं ताकि आप देख सकें कि interruption से पहले assistant audio वास्तव में कितना चला था।
6. `realtime audio playback stopped reason=...` स्थानीय Discord playback reset point है। Reason बताता है कि playback किसने रोका: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, या `session-close`।
7. `realtime speaker turn closed` captured input turn का सारांश देता है। `chunks=0` या `hasAudio=false` का अर्थ है कि speaker turn खुला लेकिन कोई usable audio realtime bridge तक नहीं पहुंचा। `interruptedPlayback=true` का अर्थ है कि वह input turn assistant output के साथ overlap हुआ और barge-in logic trigger किया।

उपयोगी फ़ील्ड:

- `outputAudioMs`: log line से पहले realtime provider द्वारा generated assistant audio duration।
- `audioMs`: playback रुकने से पहले OpenClaw द्वारा गिनी गई assistant audio duration।
- `elapsedMs`: playback stream या speaker turn खोलने और बंद करने के बीच wall-clock time।
- `discordBytes`: Discord voice को भेजे गए या उससे प्राप्त 48 kHz stereo PCM bytes।
- `realtimeBytes`: realtime provider को भेजे गए या उससे प्राप्त provider-format PCM bytes।
- `playbackChunks`: active response के लिए Discord को forward किए गए assistant audio chunks।
- `sinceLastAudioMs`: आखिरी captured speaker audio frame और speaker turn closing के बीच gap।

सामान्य पैटर्न:

- `source=active-speaker-audio`, छोटे `outputAudioMs`, और वही user पास में होने के साथ तत्काल cut-off आमतौर पर speaker echo के mic में आने की ओर संकेत करता है। `voice.realtime.minBargeInAudioEndMs` बढ़ाएं, speaker volume कम करें, headphones उपयोग करें, या `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` सेट करें।
- `source=speaker-start` के बाद `speaker turn closed ... hasAudio=false` का अर्थ है कि Discord ने speaker start report किया, लेकिन कोई audio OpenClaw तक नहीं पहुंचा। यह transient Discord voice event, noise gate behavior, या किसी client द्वारा mic को थोड़ी देर के लिए key करना हो सकता है।
- पास के barge-in या `provider-clear-audio` के बिना `audio playback stopped reason=stream-close` का अर्थ है कि स्थानीय Discord playback stream अप्रत्याशित रूप से समाप्त हो गई। पिछले provider और Discord player logs जांचें।
- `capture ignored during playback (barge-in disabled)` का अर्थ है कि assistant audio active रहते हुए OpenClaw ने जानबूझकर input drop किया। यदि आप चाहते हैं कि speech playback को interrupt करे, तो `voice.realtime.bargeIn` enable करें।
- `barge-in ignored ... outputActive=false` का अर्थ है कि Discord या provider VAD ने speech report की, लेकिन OpenClaw के पास interrupt करने के लिए कोई active playback नहीं था। इससे audio cut off नहीं होना चाहिए।

Credentials प्रत्येक component के अनुसार resolve होते हैं: `voice.model` के लिए LLM route auth, `tools.media.audio` के लिए STT auth, `messages.tts`/`voice.tts` के लिए TTS auth, और `voice.realtime.providers` या provider के सामान्य auth config के लिए realtime provider auth।

### वॉइस संदेश

Discord voice messages waveform preview दिखाते हैं और OGG/Opus audio की आवश्यकता होती है। OpenClaw waveform अपने आप generate करता है, लेकिन inspect और convert करने के लिए gateway host पर `ffmpeg` और `ffprobe` चाहिए।

- एक **स्थानीय फ़ाइल पथ** दें (URLs अस्वीकार किए जाते हैं).
- टेक्स्ट सामग्री छोड़ दें (Discord एक ही payload में टेक्स्ट + वॉइस संदेश अस्वीकार करता है).
- कोई भी ऑडियो फ़ॉर्मैट स्वीकार है; OpenClaw ज़रूरत के अनुसार OGG/Opus में बदलता है.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## समस्या निवारण

<AccordionGroup>
  <Accordion title="अस्वीकृत intents उपयोग किए गए या बॉट को कोई गिल्ड संदेश नहीं दिखता">

    - Message Content Intent सक्षम करें
    - जब आप उपयोगकर्ता/सदस्य resolution पर निर्भर हों, Server Members Intent सक्षम करें
    - intents बदलने के बाद gateway पुनः प्रारंभ करें

  </Accordion>

  <Accordion title="गिल्ड संदेश अनपेक्षित रूप से ब्लॉक हुए">

    - `groupPolicy` सत्यापित करें
    - `channels.discord.guilds` के अंतर्गत गिल्ड allowlist सत्यापित करें
    - यदि गिल्ड `channels` map मौजूद है, तो केवल सूचीबद्ध चैनलों की अनुमति है
    - `requireMention` व्यवहार और mention पैटर्न सत्यापित करें

    उपयोगी जांचें:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false है, लेकिन फिर भी ब्लॉक हो रहा है">
    सामान्य कारण:

    - मिलती-जुलती गिल्ड/चैनल allowlist के बिना `groupPolicy="allowlist"`
    - `requireMention` गलत स्थान पर कॉन्फ़िगर किया गया है (`channels.discord.guilds` या चैनल entry के अंतर्गत होना चाहिए)
    - प्रेषक गिल्ड/चैनल `users` allowlist से ब्लॉक है

  </Accordion>

  <Accordion title="लंबे समय तक चलने वाले Discord turns या duplicate replies">

    सामान्य logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway queue knobs:

    - एकल-खाता: `channels.discord.eventQueue.listenerTimeout`
    - बहु-खाता: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - यह केवल Discord gateway listener कार्य को नियंत्रित करता है, agent turn lifetime को नहीं

    Discord queued agent turns पर चैनल-स्वामित्व वाला timeout लागू नहीं करता. Message listeners तुरंत hand off करते हैं, और queued Discord runs per-session ordering को तब तक बनाए रखते हैं जब तक session/tool/runtime lifecycle कार्य को पूरा या abort नहीं कर देता.

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

  <Accordion title="Gateway metadata lookup timeout चेतावनियां">
    OpenClaw कनेक्ट करने से पहले Discord `/gateway/bot` metadata fetch करता है. अस्थायी विफलताएं Discord के default gateway URL पर fallback करती हैं और logs में rate-limited होती हैं.

    Metadata timeout knobs:

    - एकल-खाता: `channels.discord.gatewayInfoTimeoutMs`
    - बहु-खाता: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - config unset होने पर env fallback: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000` (30 सेकंड), अधिकतम: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw startup के दौरान और runtime reconnects के बाद Discord के gateway `READY` event की प्रतीक्षा करता है. Startup staggering वाले बहु-खाता setups को default से लंबी startup READY window की आवश्यकता हो सकती है.

    READY timeout knobs:

    - startup एकल-खाता: `channels.discord.gatewayReadyTimeoutMs`
    - startup बहु-खाता: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - config unset होने पर startup env fallback: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - startup default: `15000` (15 सेकंड), अधिकतम: `120000`
    - runtime एकल-खाता: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime बहु-खाता: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - config unset होने पर runtime env fallback: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime default: `30000` (30 सेकंड), अधिकतम: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` permission checks केवल numeric channel IDs के लिए काम करते हैं.

    यदि आप slug keys का उपयोग करते हैं, तो runtime matching फिर भी काम कर सकती है, लेकिन probe permissions को पूरी तरह verify नहीं कर सकता.

  </Accordion>

  <Accordion title="DM और pairing समस्याएं">

    - DM disabled: `channels.discord.dm.enabled=false`
    - DM policy disabled: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - `pairing` mode में pairing approval की प्रतीक्षा

  </Accordion>

  <Accordion title="बॉट-से-बॉट loops">
    default रूप से बॉट-द्वारा-लिखे संदेश ignore किए जाते हैं.

    यदि आप `channels.discord.allowBots=true` सेट करते हैं, तो loop behavior से बचने के लिए strict mention और allowlist rules का उपयोग करें.
    केवल उन bot messages को स्वीकार करने के लिए जो bot को mention करते हैं, `channels.discord.allowBots="mentions"` को प्राथमिकता दें.

    OpenClaw shared [बॉट loop protection](/hi/channels/bot-loop-protection) भी ship करता है. जब भी `allowBots` bot-authored messages को dispatch तक पहुंचने देता है, Discord inbound event को `(account, channel, bot pair)` facts में map करता है और generic pair guard configured event budget पार होने के बाद pair को suppress करता है. Guard runaway दो-बॉट loops को रोकता है जिन्हें पहले Discord rate limits से रोकना पड़ता था; यह single-bot deployments या budget के अंतर्गत रहने वाले one-shot bot replies को प्रभावित नहीं करता.

    Default settings (`allowBots` सेट होने पर active):

    - `maxEventsPerWindow: 20` -- bot pair sliding window के भीतर 20 messages exchange कर सकता है
    - `windowSeconds: 60` -- sliding window की लंबाई
    - `cooldownSeconds: 60` -- budget trip होने के बाद, किसी भी दिशा में हर अतिरिक्त bot-to-bot message एक मिनट के लिए drop किया जाता है

    Shared default को एक बार `channels.defaults.botLoopProtection` के अंतर्गत configure करें, फिर जब किसी legitimate workflow को अधिक headroom चाहिए तब Discord override करें. Precedence है:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - built-in defaults

    Discord generic `maxEventsPerWindow`, `windowSeconds`, और `cooldownSeconds` keys का उपयोग करता है.

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

  <Accordion title="Voice STT DecryptionFailed(...) के साथ drop होता है">

    - OpenClaw को current रखें (`openclaw update`) ताकि Discord voice receive recovery logic मौजूद रहे
    - पुष्टि करें कि `channels.discord.voice.daveEncryption=true` (default)
    - `channels.discord.voice.decryptionFailureTolerance=24` (upstream default) से शुरू करें और केवल ज़रूरत होने पर tune करें
    - logs देखें:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - यदि automatic rejoin के बाद failures जारी रहें, तो logs collect करें और [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) और [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) में upstream DAVE receive history से तुलना करें

  </Accordion>
</AccordionGroup>

## कॉन्फ़िगरेशन संदर्भ

Primary reference: [कॉन्फ़िगरेशन संदर्भ - Discord](/hi/gateway/config-channels#discord).

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

## सुरक्षा और संचालन

- bot tokens को secrets मानें (supervised environments में `DISCORD_BOT_TOKEN` preferred).
- least-privilege Discord permissions दें.
- यदि command deploy/state stale है, तो gateway restart करें और `openclaw channels status --probe` से फिर जांचें.

## संबंधित

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
