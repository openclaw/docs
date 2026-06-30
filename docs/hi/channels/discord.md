---
read_when:
    - Discord चैनल सुविधाओं पर काम करना
summary: Discord bot समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Discord
x-i18n:
    generated_at: "2026-06-30T13:59:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw आधिकारिक Discord gateway के माध्यम से DM और guild channels के लिए तैयार है।

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Discord DM डिफ़ॉल्ट रूप से pairing mode में रहते हैं।
  </Card>
  <Card title="Slash commands" icon="terminal" href="/hi/tools/slash-commands">
    मूल command व्यवहार और command catalog।
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/hi/channels/troubleshooting">
    Cross-channel diagnostics और repair flow।
  </Card>
</CardGroup>

## त्वरित सेटअप

आपको bot के साथ एक नया application बनाना होगा, bot को अपने server में जोड़ना होगा, और उसे OpenClaw से pair करना होगा। हम आपके bot को अपने निजी server में जोड़ने की सलाह देते हैं। अगर आपके पास अभी तक server नहीं है, तो [पहले एक बनाएं](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** चुनें)।

<Steps>
  <Step title="Discord application और bot बनाएं">
    [Discord Developer Portal](https://discord.com/developers/applications) पर जाएं और **New Application** पर क्लिक करें। इसे "OpenClaw" जैसा कोई नाम दें।

    sidebar में **Bot** पर क्लिक करें। **Username** को अपने OpenClaw agent के नाम पर सेट करें।

  </Step>

  <Step title="Privileged intents सक्षम करें">
    अभी भी **Bot** page पर रहते हुए, नीचे **Privileged Gateway Intents** तक scroll करें और सक्षम करें:

    - **Message Content Intent** (आवश्यक)
    - **Server Members Intent** (अनुशंसित; role allowlists और name-to-ID matching के लिए आवश्यक)
    - **Presence Intent** (वैकल्पिक; केवल presence updates के लिए आवश्यक)

  </Step>

  <Step title="अपना bot token copy करें">
    **Bot** page पर वापस ऊपर scroll करें और **Reset Token** पर क्लिक करें।

    <Note>
    नाम के बावजूद, यह आपका पहला token generate करता है — कुछ भी "reset" नहीं हो रहा है।
    </Note>

    token copy करें और इसे कहीं save करें। यह आपका **Bot Token** है और आपको जल्द ही इसकी आवश्यकता होगी।

  </Step>

  <Step title="invite URL generate करें और bot को अपने server में जोड़ें">
    sidebar में **OAuth2** पर क्लिक करें। आप bot को अपने server में जोड़ने के लिए सही permissions वाला invite URL generate करेंगे।

    नीचे **OAuth2 URL Generator** तक scroll करें और सक्षम करें:

    - `bot`
    - `applications.commands`

    नीचे एक **Bot Permissions** section दिखाई देगा। कम से कम यह सक्षम करें:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (वैकल्पिक)

    यह सामान्य text channels के लिए baseline set है। अगर आप Discord threads में post करने की योजना बना रहे हैं, जिनमें forum या media channel workflows शामिल हैं जो thread बनाते या जारी रखते हैं, तो **Send Messages in Threads** भी सक्षम करें।
    नीचे generated URL copy करें, उसे अपने browser में paste करें, अपना server चुनें, और connect करने के लिए **Continue** पर क्लिक करें। अब आपको Discord server में अपना bot दिखना चाहिए।

  </Step>

  <Step title="Developer Mode सक्षम करें और अपनी IDs collect करें">
    Discord app में वापस जाकर, आपको Developer Mode सक्षम करना होगा ताकि आप internal IDs copy कर सकें।

    1. **User Settings** (अपने avatar के पास gear icon) पर क्लिक करें → sidebar में **Developer** तक scroll करें → **Developer Mode** toggle on करें

        *(नोट: Discord mobile app में, Developer Mode **App Settings** → **Advanced** के अंतर्गत है)*

    2. sidebar में अपने **server icon** पर right-click करें → **Copy Server ID**
    3. अपने **own avatar** पर right-click करें → **Copy User ID**

    अपने **Server ID** और **User ID** को अपने Bot Token के साथ save करें — अगले step में आप तीनों OpenClaw को भेजेंगे।

  </Step>

  <Step title="server members से DM allow करें">
    Pairing काम करने के लिए, Discord को आपके bot को आपको DM करने की अनुमति देनी होगी। अपने **server icon** पर right-click करें → **Privacy Settings** → **Direct Messages** toggle on करें।

    इससे server members (bots सहित) आपको DM भेज सकते हैं। अगर आप OpenClaw के साथ Discord DM इस्तेमाल करना चाहते हैं, तो इसे enabled रखें। अगर आप केवल guild channels इस्तेमाल करने की योजना बना रहे हैं, तो pairing के बाद DM disable कर सकते हैं।

  </Step>

  <Step title="अपना bot token सुरक्षित रूप से set करें (इसे chat में न भेजें)">
    आपका Discord bot token एक secret है (password जैसा)। अपने agent को message करने से पहले इसे OpenClaw चलाने वाली machine पर set करें।

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

    अगर OpenClaw पहले से background service के रूप में चल रहा है, तो उसे OpenClaw Mac app के माध्यम से या `openclaw gateway run` process को रोककर और फिर restart करके restart करें।
    managed service installs के लिए, उस shell से `openclaw gateway install` चलाएं जहां `DISCORD_BOT_TOKEN` मौजूद है, या variable को `~/.openclaw/.env` में store करें, ताकि service restart के बाद env SecretRef resolve कर सके।
    अगर आपका host Discord के startup application lookup से blocked या rate-limited है, तो Developer Portal से Discord application/client ID set करें ताकि startup उस REST call को skip कर सके। default account के लिए `channels.discord.applicationId` का उपयोग करें, या कई Discord bots चलाने पर `channels.discord.accounts.<accountId>.applicationId` का उपयोग करें।

  </Step>

  <Step title="OpenClaw configure करें और pair करें">

    <Tabs>
      <Tab title="अपने agent से पूछें">
        किसी भी मौजूदा channel (जैसे Telegram) पर अपने OpenClaw agent से chat करें और उसे बताएं। अगर Discord आपका पहला channel है, तो इसके बजाय CLI / config tab इस्तेमाल करें।

        > "मैंने पहले ही config में अपना Discord bot token set कर दिया है। कृपया User ID `<user_id>` और Server ID `<server_id>` के साथ Discord setup पूरा करें।"
      </Tab>
      <Tab title="CLI / config">
        अगर आप file-based config पसंद करते हैं, तो set करें:

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

        scripted या remote setup के लिए, वही JSON5 block `openclaw config patch --file ./discord.patch.json5 --dry-run` के साथ write करें और फिर `--dry-run` के बिना फिर से चलाएं। Plaintext `token` values supported हैं। SecretRef values भी env/file/exec providers में `channels.discord.token` के लिए supported हैं। [Secrets Management](/hi/gateway/secrets) देखें।

        कई Discord bots के लिए, हर bot token और application ID को उसके account के अंतर्गत रखें। top-level `channels.discord.applicationId` accounts द्वारा inherited होता है, इसलिए उसे वहां केवल तब set करें जब हर account को वही application ID इस्तेमाल करनी चाहिए।

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

  <Step title="पहली DM pairing approve करें">
    gateway चलने तक प्रतीक्षा करें, फिर Discord में अपने bot को DM करें। वह pairing code के साथ respond करेगा।

    <Tabs>
      <Tab title="अपने agent से पूछें">
        अपने मौजूदा channel पर अपने agent को pairing code भेजें:

        > "इस Discord pairing code को approve करें: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    Pairing codes 1 hour के बाद expire हो जाते हैं।

    अब आप DM के माध्यम से Discord में अपने agent से chat कर सकेंगे।

  </Step>
</Steps>

<Note>
Token resolution account-aware है। Config token values env fallback से ऊपर रहती हैं। `DISCORD_BOT_TOKEN` केवल default account के लिए इस्तेमाल होता है।
अगर दो enabled Discord accounts एक ही bot token पर resolve होते हैं, तो OpenClaw उस token के लिए केवल एक gateway monitor start करता है। config-sourced token default env fallback से ऊपर रहता है; अन्यथा पहला enabled account ऊपर रहता है और duplicate account को disabled के रूप में reported किया जाता है।
advanced outbound calls (message tool/channel actions) के लिए, एक explicit per-call `token` उस call के लिए इस्तेमाल होता है। यह send और read/probe-style actions (उदाहरण के लिए read/search/fetch/thread/pins/permissions) पर लागू होता है। Account policy/retry settings अभी भी active runtime snapshot में selected account से आती हैं।
</Note>

## अनुशंसित: guild workspace set up करें

DM काम करने के बाद, आप अपने Discord server को full workspace के रूप में set up कर सकते हैं जहां हर channel को अपने context के साथ अपना agent session मिलता है। यह उन private servers के लिए recommended है जहां केवल आप और आपका bot हैं।

<Steps>
  <Step title="अपने server को guild allowlist में जोड़ें">
    इससे आपका agent आपके server के किसी भी channel में respond कर सकता है, केवल DM में नहीं।

    <Tabs>
      <Tab title="अपने agent से पूछें">
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

  <Step title="@mention के बिना responses allow करें">
    डिफ़ॉल्ट रूप से, आपका agent guild channels में केवल @mentioned होने पर respond करता है। private server के लिए, आप शायद चाहते हैं कि यह हर message का respond करे।

    guild channels में, normal replies डिफ़ॉल्ट रूप से automatically post होते हैं। shared always-on rooms के लिए, `messages.groupChat.visibleReplies: "message_tool"` में opt in करें ताकि agent lurk कर सके और केवल तब post करे जब वह तय करे कि channel reply उपयोगी है। यह GPT 5.5 जैसे latest-generation, tool-reliable models के साथ सबसे अच्छा काम करता है। Ambient room events शांत रहते हैं जब तक tool send नहीं करता। full lurk-mode config के लिए [Ambient room events](/hi/channels/ambient-room-events) देखें।

    अगर Discord typing दिखाता है और logs token usage दिखाते हैं लेकिन कोई posted message नहीं है, तो check करें कि turn ambient room event के रूप में configured था या message-tool visible replies में opted into था।

    <Tabs>
      <Tab title="अपने agent से पूछें">
        > "मेरे agent को इस server पर @mentioned हुए बिना respond करने दें"
      </Tab>
      <Tab title="Config">
        अपने guild config में `requireMention: false` set करें:

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

        visible group/channel replies के लिए message-tool sends require करने हेतु, `messages.groupChat.visibleReplies: "message_tool"` set करें।

      </Tab>
    </Tabs>

  </Step>

  <Step title="guild channels में memory की योजना बनाएं">
    डिफ़ॉल्ट रूप से, long-term memory (MEMORY.md) केवल DM sessions में load होती है। Guild channels MEMORY.md को auto-load नहीं करते।

    <Tabs>
      <Tab title="अपने agent से पूछें">
        > "जब मैं Discord channels में सवाल पूछूं, तो अगर आपको MEMORY.md से long-term context चाहिए हो, तो memory_search या memory_get इस्तेमाल करें।"
      </Tab>
      <Tab title="Manual">
        अगर आपको हर channel में shared context चाहिए, तो stable instructions को `AGENTS.md` या `USER.md` में रखें (वे हर session के लिए injected होते हैं)। long-term notes को `MEMORY.md` में रखें और memory tools के साथ demand पर access करें।
      </Tab>
    </Tabs>

  </Step>
</Steps>

अब अपने Discord server पर कुछ channels बनाएं और chat शुरू करें। आपका agent channel name देख सकता है, और हर channel को अपना isolated session मिलता है — इसलिए आप `#coding`, `#home`, `#research`, या अपने workflow के अनुकूल कुछ भी set up कर सकते हैं।

## Runtime model

- Gateway Discord कनेक्शन का स्वामी है।
- Reply रूटिंग deterministic है: Discord inbound replies वापस Discord पर जाती हैं।
- Discord guild/channel metadata को model prompt में अविश्वसनीय
  context के रूप में जोड़ा जाता है, user-visible reply prefix के रूप में नहीं। अगर कोई model उस envelope को
  वापस कॉपी करता है, तो OpenClaw outbound replies और
  भविष्य के replay context से कॉपी किया गया metadata हटा देता है।
- डिफ़ॉल्ट रूप से (`session.dmScope=main`), direct chats agent main session (`agent:main:main`) साझा करती हैं।
- Guild channels isolated session keys (`agent:<agentId>:discord:channel:<channelId>`) हैं।
- Group DMs डिफ़ॉल्ट रूप से अनदेखे किए जाते हैं (`channels.discord.dm.groupEnabled=false`)।
- Native slash commands isolated command sessions (`agent:<agentId>:discord:slash:<userId>`) में चलते हैं, जबकि routed conversation session तक `CommandTargetSessionKey` अभी भी ले जाते हैं।
- Discord को text-only cron/heartbeat announce delivery अंतिम
  assistant-visible answer का एक बार उपयोग करती है। Media और structured component payloads
  multi-message बने रहते हैं जब agent कई deliverable payloads emit करता है।

## Forum channels

Discord forum और media channels केवल thread posts स्वीकार करते हैं। OpenClaw उन्हें बनाने के दो तरीके समर्थित करता है:

- Thread auto-create करने के लिए forum parent (`channel:<forumId>`) को message भेजें। Thread title आपके message की पहली non-empty line का उपयोग करता है।
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

Forum parents Discord components स्वीकार नहीं करते। यदि आपको components चाहिए, तो thread को ही भेजें (`channel:<threadId>`)।

## Interactive components

OpenClaw agent messages के लिए Discord components v2 containers समर्थित करता है। `components` payload के साथ message tool का उपयोग करें। Interaction results normal inbound messages के रूप में agent को वापस routed होते हैं और मौजूदा Discord `replyToMode` settings का पालन करते हैं।

Supported blocks:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Action rows में अधिकतम 5 buttons या एक single select menu हो सकता है
- Select types: `string`, `user`, `role`, `mentionable`, `channel`

डिफ़ॉल्ट रूप से, components single use होते हैं। Buttons, selects, और forms को expire होने तक कई बार उपयोग करने की अनुमति देने के लिए `components.reusable=true` सेट करें।

किसी button पर कौन click कर सकता है, इसे सीमित करने के लिए उस button पर `allowedUsers` सेट करें (Discord user IDs, tags, या `*`)। Configure किए जाने पर, unmatched users को ephemeral denial मिलता है।

Component callbacks डिफ़ॉल्ट रूप से 30 मिनट बाद expire होते हैं। Default Discord account के लिए उस callback registry lifetime को बदलने के लिए `channels.discord.agentComponents.ttlMs` सेट करें, या multi-account setup में किसी एक account को override करने के लिए `channels.discord.accounts.<accountId>.agentComponents.ttlMs` सेट करें। Value milliseconds में है, positive integer होनी चाहिए, और `86400000` (24 hours) पर capped है। Longer TTLs review या approval workflows के लिए उपयोगी हैं जिनमें buttons usable बने रहने चाहिए, लेकिन वे वह window भी बढ़ाते हैं जिसमें पुराना Discord message अभी भी action trigger कर सकता है। Workflow में fit होने वाला shortest TTL prefer करें, और stale callbacks surprising हों तो default रखें।

`/model` और `/models` slash commands provider, model, और compatible runtime dropdowns के साथ interactive model picker खोलते हैं, साथ में Submit step भी होता है। `/models add` deprecated है और अब chat से models register करने के बजाय deprecation message लौटाता है। Picker reply ephemeral है और केवल invoking user उसका उपयोग कर सकता है। Discord select menus 25 options तक सीमित हैं, इसलिए जब आप चाहते हैं कि picker dynamically discovered models केवल selected providers जैसे `openai` या `vllm` के लिए दिखाए, तो `agents.defaults.models` में `provider/*` entries जोड़ें।

File attachments:

- `file` blocks को attachment reference (`attachment://<filename>`) की ओर point करना चाहिए
- Attachment को `media`/`path`/`filePath` (single file) के माध्यम से दें; multiple files के लिए `media-gallery` का उपयोग करें
- जब upload name को attachment reference से match करना हो, तो उसे override करने के लिए `filename` का उपयोग करें

Modal forms:

- अधिकतम 5 fields के साथ `components.modal` जोड़ें
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

    अगर DM policy open नहीं है, तो unknown users block किए जाते हैं (या `pairing` mode में pairing के लिए prompt किए जाते हैं)।

    Multi-account precedence:

    - `channels.discord.accounts.default.allowFrom` केवल `default` account पर लागू होता है।
    - एक account के लिए, `allowFrom` legacy `dm.allowFrom` पर precedence लेता है।
    - Named accounts `channels.discord.allowFrom` inherit करते हैं जब उनका अपना `allowFrom` और legacy `dm.allowFrom` unset हो।
    - Named accounts `channels.discord.accounts.default.allowFrom` inherit नहीं करते।

    Legacy `channels.discord.dm.policy` और `channels.discord.dm.allowFrom` compatibility के लिए अभी भी read होते हैं। `openclaw doctor --fix` access बदले बिना ऐसा कर सके तो उन्हें `dmPolicy` और `allowFrom` में migrate करता है।

    Delivery के लिए DM target format:

    - `user:<id>`
    - `<@id>` mention

    Bare numeric IDs सामान्यतः channel IDs के रूप में resolve होते हैं जब channel default active हो, लेकिन account के effective DM `allowFrom` में listed IDs compatibility के लिए user DM targets माने जाते हैं।

  </Tab>

  <Tab title="Access groups">
    Discord DMs और text command authorization `channels.discord.allowFrom` में dynamic `accessGroup:<name>` entries का उपयोग कर सकते हैं।

    Access group names message channels में shared होते हैं। Static group के लिए `type: "message.senders"` का उपयोग करें जिसके members हर channel के normal `allowFrom` syntax में express किए जाते हैं, या `type: "discord.channelAudience"` जब Discord channel के current `ViewChannel` audience को dynamically membership define करनी चाहिए। Shared access-group behavior यहाँ documented है: [Access groups](/hi/channels/access-groups).

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

    Discord text channel की कोई separate member list नहीं होती। `type: "discord.channelAudience"` membership को इस तरह model करता है: DM sender configured guild का member है और role तथा channel overwrites apply होने के बाद configured channel पर currently effective `ViewChannel` permission रखता है।

    उदाहरण: जो भी `#maintainers` देख सकता है उसे bot को DM करने दें, जबकि बाकी सभी के लिए DMs closed रखें।

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

    Lookups fail closed होते हैं। अगर Discord `Missing Access` लौटाता है, member lookup fail होता है, या channel किसी अलग guild से संबंधित है, तो DM sender unauthorized माना जाता है।

    Channel-audience access groups का उपयोग करते समय bot के लिए Discord Developer Portal **Server Members Intent** enable करें। DMs में guild member state शामिल नहीं होती, इसलिए OpenClaw authorization time पर Discord REST के माध्यम से member resolve करता है।

  </Tab>

  <Tab title="Guild policy">
    Guild handling `channels.discord.groupPolicy` से नियंत्रित होती है:

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` मौजूद होने पर secure baseline `allowlist` है।

    `allowlist` behavior:

    - guild को `channels.discord.guilds` से match करना चाहिए (`id` preferred, slug accepted)
    - optional sender allowlists: `users` (stable IDs recommended) और `roles` (केवल role IDs); यदि इनमें से कोई भी configured है, तो senders तब allowed होते हैं जब वे `users` OR `roles` से match करें
    - direct name/tag matching डिफ़ॉल्ट रूप से disabled है; केवल break-glass compatibility mode के रूप में `channels.discord.dangerouslyAllowNameMatching: true` enable करें
    - `users` के लिए names/tags supported हैं, लेकिन IDs अधिक safe हैं; name/tag entries उपयोग होने पर `openclaw security audit` warn करता है
    - अगर किसी guild में `channels` configured हैं, तो non-listed channels denied होते हैं
    - अगर किसी guild में कोई `channels` block नहीं है, तो उस allowlisted guild के सभी channels allowed हैं

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
    Guild messages डिफ़ॉल्ट रूप से mention-gated होते हैं।

    Mention detection में शामिल है:

    - explicit bot mention
    - configured mention patterns (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - supported cases में implicit reply-to-bot behavior

    Outbound Discord messages लिखते समय canonical mention syntax का उपयोग करें: users के लिए `<@USER_ID>`, channels के लिए `<#CHANNEL_ID>`, और roles के लिए `<@&ROLE_ID>`। Legacy `<@!USER_ID>` nickname mention form का उपयोग न करें।

    `requireMention` per guild/channel (`channels.discord.guilds...`) configured है।
    `ignoreOtherMentions` optional रूप से ऐसे messages drop करता है जो किसी दूसरे user/role को mention करते हैं लेकिन bot को नहीं (excluding @everyone/@here)।

    Group DMs:

    - default: ignored (`dm.groupEnabled=false`)
    - optional allowlist via `dm.groupChannels` (channel IDs or slugs)

  </Tab>
</Tabs>

### Role-based agent routing

`bindings[].match.roles` का उपयोग करके Discord guild सदस्यों को भूमिका ID के आधार पर अलग-अलग agents पर रूट करें। भूमिका-आधारित bindings केवल भूमिका IDs स्वीकार करते हैं और peer या parent-peer bindings के बाद तथा केवल-guild bindings से पहले मूल्यांकित होते हैं। यदि कोई binding अन्य match fields भी सेट करती है (उदाहरण के लिए `peer` + `guildId` + `roles`), तो सभी कॉन्फ़िगर किए गए fields match होने चाहिए।

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

## नेटिव commands और command auth

- `commands.native` का डिफ़ॉल्ट `"auto"` है और यह Discord के लिए सक्षम है।
- प्रति-channel override: `channels.discord.commands.native`.
- `commands.native=false` startup के दौरान Discord slash-command registration और cleanup को छोड़ देता है। पहले registered commands Discord में तब तक visible रह सकते हैं जब तक आप उन्हें Discord app से हटाते नहीं हैं।
- नेटिव command auth सामान्य message handling वाली ही Discord allowlists/policies का उपयोग करता है।
- Commands अभी भी उन users के लिए Discord UI में visible हो सकते हैं जो authorized नहीं हैं; execution फिर भी OpenClaw auth लागू करता है और "अधिकृत नहीं" लौटाता है।

Command catalog और व्यवहार के लिए [Slash commands](/hi/tools/slash-commands) देखें।

डिफ़ॉल्ट slash command settings:

- `ephemeral: true`

## Feature विवरण

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

    नोट: `off` implicit reply threading को अक्षम करता है। Explicit `[[reply_to_*]]` tags फिर भी मान्य रहेंगे।
    `first` turn के पहले outbound Discord message में हमेशा implicit native reply reference जोड़ता है।
    `batched` Discord के implicit native reply reference को केवल तब जोड़ता है जब
    inbound event कई messages का debounced batch था। यह तब उपयोगी है
    जब आप native replies मुख्य रूप से ambiguous bursty chats के लिए चाहते हों, हर
    single-message turn के लिए नहीं।

    Message IDs context/history में दिखाई जाती हैं ताकि agents विशिष्ट messages को target कर सकें।

  </Accordion>

  <Accordion title="Link previews">
    Discord डिफ़ॉल्ट रूप से URLs के लिए rich link embeds बनाता है। OpenClaw डिफ़ॉल्ट रूप से outbound Discord messages पर उन generated embeds को suppress करता है, ताकि agent द्वारा भेजे गए URLs plain links बने रहें जब तक आप opt in न करें:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    एक account को override करने के लिए `channels.discord.accounts.<id>.suppressEmbeds` सेट करें। Agent message-tool sends किसी single message के लिए `suppressEmbeds: false` भी pass कर सकते हैं। Explicit Discord `embeds` payloads डिफ़ॉल्ट link-preview setting से suppress नहीं होते।

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw एक temporary message भेजकर और text आने पर उसे edit करके draft replies stream कर सकता है। `channels.discord.streaming` `off` | `partial` | `block` | `progress` (डिफ़ॉल्ट) लेता है। `progress` एक editable status draft रखता है और final delivery तक उसे tool progress के साथ update करता है; shared starter label एक rolling line है, इसलिए पर्याप्त work दिखने के बाद यह बाकी की तरह scroll away हो जाता है। `streamMode` एक legacy runtime alias है। Persisted config को canonical key पर rewrite करने के लिए `openclaw doctor --fix` चलाएं।

    Discord preview edits अक्षम करने के लिए `channels.discord.streaming.mode` को `off` पर सेट करें। यदि Discord block streaming explicit रूप से enabled है, तो OpenClaw double-streaming से बचने के लिए preview stream छोड़ देता है।

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

    - `partial` tokens आने पर एक single preview message edit करता है।
    - `block` draft-sized chunks emit करता है (size और breakpoints tune करने के लिए `draftChunk` का उपयोग करें, `textChunkLimit` तक clamped)।
    - Media, error, और explicit-reply finals pending preview edits cancel कर देते हैं।
    - `streaming.preview.toolProgress` (डिफ़ॉल्ट `true`) नियंत्रित करता है कि tool/progress updates preview message reuse करें या नहीं।
    - Tool/progress rows उपलब्ध होने पर compact emoji + title + detail के रूप में render होती हैं, उदाहरण के लिए `🛠️ Bash: run tests` या `🔎 Web Search: for "query"`।
    - `streaming.progress.commentary` (डिफ़ॉल्ट `false`) temporary progress draft में assistant commentary/preamble text opt in करता है। Commentary display से पहले cleaned होती है, transient रहती है, और final answer delivery को नहीं बदलती।
    - `streaming.progress.maxLineChars` per-line progress preview budget नियंत्रित करता है। Prose word boundaries पर shortened होता है; command और path details उपयोगी suffixes रखते हैं।
    - `streaming.preview.commandText` / `streaming.progress.commandText` compact progress lines में command/exec detail नियंत्रित करता है: `raw` (डिफ़ॉल्ट) या `status` (केवल tool label)।

    Compact progress lines बनाए रखते हुए raw command/exec text छिपाएं:

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

    Preview streaming केवल text है; media replies normal delivery पर fall back करती हैं। जब `block` streaming explicit रूप से enabled होती है, OpenClaw double-streaming से बचने के लिए preview stream छोड़ देता है।

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
    - Thread sessions parent channel के session-level `/model` selection को model-only fallback के रूप में inherit करते हैं; thread-local `/model` selections फिर भी precedence लेते हैं और transcript inheritance enabled न होने तक parent transcript history copy नहीं की जाती।
    - `channels.discord.thread.inheritParent` (डिफ़ॉल्ट `false`) new auto-threads को parent transcript से seeding में opt करता है। Per-account overrides `channels.discord.accounts.<id>.thread.inheritParent` के अंतर्गत रहते हैं।
    - Message-tool reactions `user:<id>` DM targets resolve कर सकते हैं।
    - `guilds.<guild>.channels.<channel>.requireMention: false` reply-stage activation fallback के दौरान preserved रहता है।

    Channel topics **untrusted** context के रूप में inject किए जाते हैं। Allowlists gate करती हैं कि agent को कौन trigger कर सकता है, यह पूर्ण supplemental-context redaction boundary नहीं है।

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord किसी thread को session target से bind कर सकता है ताकि उस thread में follow-up messages उसी session (subagent sessions सहित) पर route होते रहें।

    Commands:

    - `/focus <target>` current/new thread को subagent/session target से bind करें
    - `/unfocus` current thread binding हटाएं
    - `/agents` active runs और binding state दिखाएं
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
    - `spawnSessions` `sessions_spawn({ thread: true })` और ACP thread spawns के लिए auto-create/bind threads नियंत्रित करता है। डिफ़ॉल्ट: `true`.
    - `defaultSpawnContext` thread-bound spawns के लिए native subagent context नियंत्रित करता है। डिफ़ॉल्ट: `"fork"`.
    - Deprecated `spawnSubagentSessions`/`spawnAcpSessions` keys `openclaw doctor --fix` द्वारा migrated होती हैं।
    - यदि किसी account के लिए thread bindings disabled हैं, तो `/focus` और संबंधित thread binding operations unavailable हैं।

    Binding behavior details के लिए [Sub-agents](/hi/tools/subagents), [ACP Agents](/hi/tools/acp-agents), और [Configuration Reference](/hi/gateway/configuration-reference) देखें।

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Stable "always-on" ACP workspaces के लिए, Discord conversations को target करने वाली top-level typed ACP bindings configure करें।

    Config path:

    - `bindings[]` जिसमें `type: "acp"` और `match.channel: "discord"` हो

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

    - `/acp spawn codex --bind here` current channel या thread को in place bind करता है और future messages को उसी ACP session पर रखता है। Thread messages parent channel binding inherit करते हैं।
    - Bound channel या thread में, `/new` और `/reset` उसी ACP session को in place reset करते हैं। Temporary thread bindings active रहते समय target resolution override कर सकते हैं।
    - `spawnSessions` `--thread auto|here` के माध्यम से child thread creation/binding gate करता है।

    Binding behavior details के लिए [ACP Agents](/hi/tools/acp-agents) देखें।

  </Accordion>

  <Accordion title="Reaction notifications">
    Per-guild reaction notification mode:

    - `off`
    - `own` (डिफ़ॉल्ट)
    - `all`
    - `allowlist` (`guilds.<id>.users` का उपयोग करता है)

    Reaction events system events में बदले जाते हैं और routed Discord session से attached होते हैं।

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` OpenClaw के inbound message process करते समय acknowledgement emoji भेजता है।

    Resolution order:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji fallback (`agents.list[].identity.emoji`, अन्यथा "👀")

    Notes:

    - Discord unicode emoji या custom emoji names स्वीकार करता है।
    - किसी channel या account के लिए reaction disable करने हेतु `""` का उपयोग करें।

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

    टिप्पणियाँ:

    - अनुमति-सूचियाँ `pk:<memberId>` का उपयोग कर सकती हैं
    - सदस्य प्रदर्शन नामों का मिलान नाम/स्लग से केवल तब किया जाता है जब `channels.discord.dangerouslyAllowNameMatching: true` हो
    - lookup मूल संदेश ID का उपयोग करते हैं और समय-विंडो से सीमित होते हैं
    - यदि lookup विफल होता है, तो proxied संदेशों को bot संदेश माना जाता है और `allowBots=true` न होने पर छोड़ दिया जाता है

  </Accordion>

  <Accordion title="Outbound mention aliases">
    जब एजेंटों को ज्ञात Discord उपयोगकर्ताओं के लिए निर्धारक आउटबाउंड mentions चाहिए, तब `mentionAliases` का उपयोग करें। keys शुरुआती `@` के बिना handles हैं; values Discord उपयोगकर्ता ID हैं। अज्ञात handles, `@everyone`, `@here`, और Markdown code spans के अंदर mentions अपरिवर्तित रहते हैं।

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
    Presence अपडेट तब लागू होते हैं जब आप कोई status या activity field सेट करते हैं, या जब आप auto presence सक्षम करते हैं।

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
    - 1: Streaming (`activityUrl` आवश्यक है)
    - 2: Listening
    - 3: Watching
    - 4: Custom (activity text को status state के रूप में उपयोग करता है; emoji वैकल्पिक है)
    - 5: Competing

    Auto presence उदाहरण (रनटाइम स्वास्थ्य संकेत):

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

    Auto presence रनटाइम उपलब्धता को Discord status से मैप करता है: healthy => online, degraded या unknown => idle, exhausted या unavailable => dnd। वैकल्पिक text overrides:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` placeholder समर्थित है)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord DMs में button-आधारित approval handling का समर्थन करता है और वैकल्पिक रूप से मूल channel में approval prompts पोस्ट कर सकता है।

    Config path:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (वैकल्पिक; संभव होने पर `commands.ownerAllowFrom` पर वापस जाता है)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, डिफ़ॉल्ट: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    जब `enabled` unset या `"auto"` हो और कम से कम एक approver resolve किया जा सके, चाहे `execApprovals.approvers` से या `commands.ownerAllowFrom` से, Discord native exec approvals को अपने-आप सक्षम करता है। Discord channel `allowFrom`, legacy `dm.allowFrom`, या direct-message `defaultTo` से exec approvers अनुमानित नहीं करता। Discord को native approval client के रूप में स्पष्ट रूप से अक्षम करने के लिए `enabled: false` सेट करें।

    `/diagnostics` और `/export-trajectory` जैसे संवेदनशील owner-only group commands के लिए, OpenClaw approval prompts और अंतिम परिणाम निजी रूप से भेजता है। यदि invocation करने वाले owner के पास Discord owner route है, तो यह पहले Discord DM आज़माता है; यदि वह उपलब्ध नहीं है, तो यह `commands.ownerAllowFrom` से पहली उपलब्ध owner route पर वापस जाता है, जैसे Telegram।

    जब `target` `channel` या `both` हो, तो approval prompt channel में दिखाई देता है। केवल resolved approvers buttons का उपयोग कर सकते हैं; अन्य उपयोगकर्ताओं को ephemeral denial मिलता है। Approval prompts में command text शामिल होता है, इसलिए channel delivery केवल trusted channels में सक्षम करें। यदि session key से channel ID निकाली नहीं जा सकती, तो OpenClaw DM delivery पर वापस जाता है।

    Discord अन्य chat channels द्वारा उपयोग किए जाने वाले shared approval buttons भी render करता है। Native Discord adapter मुख्य रूप से approver DM routing और channel fanout जोड़ता है।
    जब ये buttons मौजूद हों, वे प्राथमिक approval UX हैं; OpenClaw को
    manual `/approve` command केवल तब शामिल करना चाहिए जब tool result कहे कि
    chat approvals उपलब्ध नहीं हैं या manual approval ही एकमात्र path है।
    यदि Discord native approval runtime सक्रिय नहीं है, तो OpenClaw
    local deterministic `/approve <id> <decision>` prompt को दृश्यमान रखता है। यदि
    runtime सक्रिय है लेकिन native card किसी भी target तक deliver नहीं किया जा सकता,
    तो OpenClaw pending approval से exact `/approve`
    command के साथ same-chat fallback notice भेजता है।

    Gateway auth और approval resolution shared Gateway client contract का पालन करते हैं (`plugin:` IDs `plugin.approval.resolve` के माध्यम से resolve होते हैं; अन्य IDs `exec.approval.resolve` के माध्यम से)। Approvals डिफ़ॉल्ट रूप से 30 मिनट बाद expire होते हैं।

    [Exec approvals](/hi/tools/exec-approvals) देखें।

  </Accordion>
</AccordionGroup>

## Tools और action gates

Discord message actions में messaging, channel admin, moderation, presence, और metadata actions शामिल हैं।

Core examples:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

`event-create` action scheduled event cover image सेट करने के लिए वैकल्पिक `image` parameter (URL या local file path) स्वीकार करता है।

Action gates `channels.discord.actions.*` के अंतर्गत रहते हैं।

डिफ़ॉल्ट gate behavior:

| Action group                                                                                                                                                             | Default |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClaw exec approvals और cross-context markers के लिए Discord components v2 का उपयोग करता है। Discord message actions custom UI के लिए `components` भी स्वीकार कर सकते हैं (advanced; discord tool के माध्यम से component payload बनाना आवश्यक है), जबकि legacy `embeds` उपलब्ध रहते हैं लेकिन अनुशंसित नहीं हैं।

- `channels.discord.ui.components.accentColor` Discord component containers द्वारा उपयोग किया जाने वाला accent color सेट करता है (hex)।
- प्रति account `channels.discord.accounts.<id>.ui.components.accentColor` से सेट करें।
- `channels.discord.agentComponents.ttlMs` नियंत्रित करता है कि भेजे गए Discord component callbacks कितनी देर registered रहें (डिफ़ॉल्ट `1800000`, अधिकतम `86400000`)। प्रति account `channels.discord.accounts.<id>.agentComponents.ttlMs` से सेट करें।
- components v2 मौजूद होने पर `embeds` ignored होते हैं।
- Plain URL previews डिफ़ॉल्ट रूप से suppressed होते हैं। जब एक single outbound link expand होना चाहिए, तो message action पर `suppressEmbeds: false` सेट करें।

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

Discord की दो अलग-अलग voice surfaces हैं: realtime **voice channels** (निरंतर conversations) और **voice message attachments** (waveform preview format)। Gateway दोनों का समर्थन करता है।

### Voice channels

Setup checklist:

1. Discord Developer Portal में Message Content Intent सक्षम करें।
2. जब role/user अनुमति-सूचियाँ उपयोग की जाती हैं, तब Server Members Intent सक्षम करें।
3. bot को `bot` और `applications.commands` scopes के साथ invite करें।
4. target voice channel में Connect, Speak, Send Messages, और Read Message History grant करें।
5. native commands (`commands.native` या `channels.discord.commands.native`) सक्षम करें।
6. `channels.discord.voice` configure करें।

Sessions नियंत्रित करने के लिए `/vc join|leave|status` का उपयोग करें। command account default agent का उपयोग करता है और अन्य Discord commands जैसे ही allowlist और group policy rules का पालन करता है।

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Join करने से पहले bot की effective permissions inspect करने के लिए, चलाएँ:

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

टिप्पणियाँ:

- `voice.tts` केवल `stt-tts` वॉइस प्लेबैक के लिए `messages.tts` को ओवरराइड करता है। रीयलटाइम मोड `voice.realtime.speakerVoice` का उपयोग करते हैं।
- `voice.mode` बातचीत के पथ को नियंत्रित करता है। डिफ़ॉल्ट `agent-proxy` है: एक रीयलटाइम वॉइस फ्रंट एंड टर्न टाइमिंग, व्यवधान और प्लेबैक संभालता है, `openclaw_agent_consult` के माध्यम से रूट किए गए OpenClaw एजेंट को मुख्य काम सौंपता है, और परिणाम को उस स्पीकर से आए टाइप किए गए Discord प्रॉम्प्ट की तरह मानता है। `stt-tts` पुराने बैच STT प्लस TTS फ़्लो को बनाए रखता है। `bidi` रीयलटाइम मॉडल को सीधे बातचीत करने देता है, साथ ही OpenClaw ब्रेन के लिए `openclaw_agent_consult` उपलब्ध कराता है।
- `voice.agentSession` नियंत्रित करता है कि कौन-सी OpenClaw बातचीत वॉइस टर्न प्राप्त करती है। वॉइस चैनल के अपने सेशन के लिए इसे सेट न करें, या वॉइस चैनल को `#maintainers` जैसे किसी मौजूदा Discord टेक्स्ट चैनल सेशन का माइक्रोफ़ोन/स्पीकर एक्सटेंशन बनाने के लिए `{ mode: "target", target: "channel:<text-channel-id>" }` सेट करें।
- `voice.model` Discord वॉइस प्रतिक्रियाओं और रीयलटाइम कंसल्ट के लिए OpenClaw एजेंट ब्रेन को ओवरराइड करता है। रूट किए गए एजेंट मॉडल को इनहेरिट करने के लिए इसे सेट न करें। यह `voice.realtime.model` से अलग है।
- `voice.followUsers` बॉट को चुने गए उपयोगकर्ताओं के साथ Discord वॉइस में जुड़ने, स्थानांतरित होने और छोड़ने देता है। व्यवहार नियमों और उदाहरणों के लिए [वॉइस में उपयोगकर्ताओं का अनुसरण करें](#follow-users-in-voice) देखें।
- `agent-proxy` स्पीच को `discord-voice` के माध्यम से रूट करता है, जो स्पीकर और लक्षित सेशन के लिए सामान्य ओनर/टूल प्राधिकरण को सुरक्षित रखता है लेकिन एजेंट `tts` टूल को छिपाता है क्योंकि Discord वॉइस प्लेबैक का मालिक है। डिफ़ॉल्ट रूप से, `agent-proxy` ओनर स्पीकरों के लिए कंसल्ट को पूर्ण ओनर-समकक्ष टूल एक्सेस देता है (`voice.realtime.toolPolicy: "owner"`) और मुख्य उत्तरों से पहले OpenClaw एजेंट से कंसल्ट करने को दृढ़ता से प्राथमिकता देता है (`voice.realtime.consultPolicy: "always"`)। उस डिफ़ॉल्ट `always` मोड में, रीयलटाइम लेयर कंसल्ट उत्तर से पहले अपने-आप फिलर नहीं बोलती; यह स्पीच कैप्चर और ट्रांसक्राइब करती है, फिर रूट किया गया OpenClaw उत्तर बोलती है। यदि कई अनिवार्य कंसल्ट उत्तर तब समाप्त होते हैं जब Discord अभी भी पहला उत्तर चला रहा हो, तो बाद के सटीक-स्पीच उत्तर वाक्य के बीच में स्पीच को बदलने के बजाय प्लेबैक निष्क्रिय होने तक कतार में रखे जाते हैं।
- `stt-tts` मोड में, STT `tools.media.audio` का उपयोग करता है; `voice.model` ट्रांसक्रिप्शन को प्रभावित नहीं करता।
- रीयलटाइम मोड में, `voice.realtime.provider`, `voice.realtime.model`, और `voice.realtime.speakerVoice` रीयलटाइम ऑडियो सेशन को कॉन्फ़िगर करते हैं। OpenAI Realtime 2 प्लस Codex ब्रेन के लिए, `voice.realtime.model: "gpt-realtime-2"` और `voice.model: "openai/gpt-5.5"` का उपयोग करें।
- रीयलटाइम वॉइस मोड डिफ़ॉल्ट रूप से रीयलटाइम प्रदाता निर्देशों में छोटी `IDENTITY.md`, `USER.md`, और `SOUL.md` प्रोफ़ाइल फ़ाइलें शामिल करते हैं ताकि तेज़ सीधे टर्न वही पहचान, उपयोगकर्ता आधार और पर्सोना बनाए रखें जो रूट किए गए OpenClaw एजेंट में है। इसे कस्टमाइज़ करने के लिए `voice.realtime.bootstrapContextFiles` को किसी उपसमुच्चय पर सेट करें, या इसे अक्षम करने के लिए `[]` सेट करें। समर्थित रीयलटाइम बूटस्ट्रैप फ़ाइलें केवल उन्हीं प्रोफ़ाइल फ़ाइलों तक सीमित हैं; `AGENTS.md` सामान्य एजेंट संदर्भ में रहता है। इंजेक्ट किया गया प्रोफ़ाइल संदर्भ वर्कस्पेस कार्य, मौजूदा तथ्यों, मेमोरी लुकअप या टूल-समर्थित कार्रवाइयों के लिए `openclaw_agent_consult` को प्रतिस्थापित नहीं करता।
- OpenAI `agent-proxy` रीयलटाइम मोड में, Discord रीयलटाइम वॉइस को तब तक मौन रखने के लिए `voice.realtime.requireWakeName: true` सेट करें जब तक कोई ट्रांसक्रिप्ट वेक नाम से शुरू या समाप्त न हो। कॉन्फ़िगर किए गए वेक नाम एक या दो शब्दों के होने चाहिए। यदि `voice.realtime.wakeNames` सेट नहीं है, तो OpenClaw रूट किए गए एजेंट `name` प्लस `OpenClaw` का उपयोग करता है, और फ़ॉलबैक के रूप में एजेंट id प्लस `OpenClaw` का उपयोग करता है। वेक-नाम गेटिंग रीयलटाइम प्रदाता ऑटो-रिस्पॉन्स को अक्षम करती है, स्वीकृत टर्न को OpenClaw एजेंट कंसल्ट पथ से रूट करती है, और अंतिम ट्रांसक्रिप्ट आने से पहले आंशिक ट्रांसक्रिप्शन से अग्रणी वेक नाम पहचाने जाने पर एक छोटा बोला गया स्वीकार देती है।
- OpenAI रीयलटाइम प्रदाता आउटपुट ऑडियो और ट्रांसक्रिप्ट इवेंट के लिए मौजूदा Realtime 2 इवेंट नाम और लेगेसी Codex-संगत एलियस स्वीकार करता है, ताकि संगत प्रदाता स्नैपशॉट असिस्टेंट ऑडियो छोड़े बिना बदल सकें।
- `voice.realtime.bargeIn` नियंत्रित करता है कि Discord स्पीकर-स्टार्ट इवेंट सक्रिय रीयलटाइम प्लेबैक को बाधित करते हैं या नहीं। यदि सेट नहीं है, तो यह रीयलटाइम प्रदाता की इनपुट-ऑडियो व्यवधान सेटिंग का अनुसरण करता है।
- `voice.realtime.minBargeInAudioEndMs` OpenAI रीयलटाइम बार्ज-इन द्वारा ऑडियो को काटने से पहले न्यूनतम असिस्टेंट प्लेबैक अवधि नियंत्रित करता है। डिफ़ॉल्ट: `250`। कम-इको कमरों में तुरंत व्यवधान के लिए `0` सेट करें, या अधिक इको वाले स्पीकर सेटअप के लिए इसे बढ़ाएँ।
- Discord प्लेबैक पर OpenAI वॉइस के लिए, `voice.tts.provider: "openai"` सेट करें और `voice.tts.providers.openai.speakerVoice` के अंतर्गत Text-to-speech वॉइस चुनें। मौजूदा OpenAI TTS मॉडल पर `cedar` एक अच्छा पुरुष-ध्वनि वाला विकल्प है।
- प्रति-चैनल Discord `systemPrompt` ओवरराइड उस वॉइस चैनल के वॉइस ट्रांसक्रिप्ट टर्न पर लागू होते हैं।
- वॉइस ट्रांसक्रिप्ट टर्न ओनर-गेटेड कमांड और चैनल कार्रवाइयों के लिए Discord `allowFrom` (या `dm.allowFrom`) से ओनर स्थिति निकालते हैं। एजेंट टूल दृश्यता रूट किए गए सेशन के लिए कॉन्फ़िगर की गई टूल नीति का पालन करती है।
- केवल टेक्स्ट कॉन्फ़िग के लिए Discord वॉइस ऑप्ट-इन है; `/vc` कमांड, वॉइस रनटाइम, और `GuildVoiceStates` Gateway इंटेंट सक्षम करने के लिए `channels.discord.voice.enabled=true` सेट करें (या मौजूदा `channels.discord.voice` ब्लॉक बनाए रखें)।
- `channels.discord.intents.voiceStates` वॉइस-स्टेट इंटेंट सब्सक्रिप्शन को स्पष्ट रूप से ओवरराइड कर सकता है। इंटेंट को प्रभावी वॉइस सक्षमकरण का पालन करने देने के लिए इसे सेट न करें।
- यदि `voice.autoJoin` में एक ही गिल्ड के लिए कई प्रविष्टियाँ हैं, तो OpenClaw उस गिल्ड के लिए अंतिम कॉन्फ़िगर किए गए चैनल से जुड़ता है।
- `voice.allowedChannels` एक वैकल्पिक रेज़िडेंसी अनुमति-सूची है। किसी भी अधिकृत Discord वॉइस चैनल में `/vc join` की अनुमति देने के लिए इसे सेट न करें। सेट होने पर, `/vc join`, स्टार्टअप ऑटो-जॉइन, और बॉट वॉइस-स्टेट मूव सूचीबद्ध `{ guildId, channelId }` प्रविष्टियों तक सीमित होते हैं। सभी Discord वॉइस जॉइन अस्वीकार करने के लिए इसे खाली ऐरे पर सेट करें। यदि Discord बॉट को अनुमति-सूची से बाहर ले जाता है, तो OpenClaw उस चैनल को छोड़ देता है और उपलब्ध होने पर कॉन्फ़िगर किए गए ऑटो-जॉइन लक्ष्य से दोबारा जुड़ता है।
- `voice.daveEncryption` और `voice.decryptionFailureTolerance` `@discordjs/voice` जॉइन विकल्पों तक पास थ्रू होते हैं।
- यदि सेट नहीं हैं, तो `@discordjs/voice` डिफ़ॉल्ट `daveEncryption=true` और `decryptionFailureTolerance=24` हैं।
- OpenClaw Discord वॉइस रिसीव और रीयलटाइम रॉ PCM प्लेबैक के लिए बंडल किए गए `libopus-wasm` कोडेक का उपयोग करता है। यह पिन किया गया libopus WebAssembly बिल्ड शिप करता है और नेटिव opus ऐडऑन की आवश्यकता नहीं होती।
- `voice.connectTimeoutMs` `/vc join` और ऑटो-जॉइन प्रयासों के लिए शुरुआती `@discordjs/voice` Ready प्रतीक्षा नियंत्रित करता है। डिफ़ॉल्ट: `30000`।
- `voice.reconnectGraceMs` नियंत्रित करता है कि OpenClaw डिस्कनेक्ट हुए वॉइस सेशन को नष्ट करने से पहले उसके दोबारा कनेक्ट होना शुरू करने के लिए कितनी देर प्रतीक्षा करता है। डिफ़ॉल्ट: `15000`।
- `stt-tts` मोड में, केवल इसलिए वॉइस प्लेबैक नहीं रुकता कि कोई दूसरा उपयोगकर्ता बोलना शुरू करता है। फीडबैक लूप से बचने के लिए, OpenClaw TTS चलने के दौरान नया वॉइस कैप्चर अनदेखा करता है; अगले टर्न के लिए प्लेबैक समाप्त होने के बाद बोलें। रीयलटाइम मोड स्पीकर शुरू होने को बार्ज-इन संकेतों के रूप में रीयलटाइम प्रदाता को फ़ॉरवर्ड करते हैं।
- रीयलटाइम मोड में, स्पीकरों से खुले माइक्रोफ़ोन में आने वाली इको बार्ज-इन जैसी दिख सकती है और प्लेबैक को बाधित कर सकती है। अधिक इको वाले Discord कमरों के लिए, इनपुट ऑडियो पर OpenAI को अपने-आप बाधित होने से रोकने के लिए `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` सेट करें। यदि आप फिर भी चाहते हैं कि Discord स्पीकर-स्टार्ट इवेंट सक्रिय प्लेबैक को बाधित करें, तो `voice.realtime.bargeIn: true` जोड़ें। OpenAI रीयलटाइम ब्रिज `voice.realtime.minBargeInAudioEndMs` से छोटी प्लेबैक ट्रंकेशन को संभावित इको/शोर मानकर अनदेखा करता है और Discord प्लेबैक साफ़ करने के बजाय उन्हें छोड़ा गया लॉग करता है।
- `voice.captureSilenceGraceMs` नियंत्रित करता है कि Discord द्वारा किसी स्पीकर के रुकने की रिपोर्ट करने के बाद OpenClaw उस ऑडियो सेगमेंट को STT के लिए अंतिम रूप देने से पहले कितनी देर प्रतीक्षा करता है। डिफ़ॉल्ट: `2000`; यदि Discord सामान्य विरामों को खंडित आंशिक ट्रांसक्रिप्ट में बाँटता है, तो इसे बढ़ाएँ।
- जब ElevenLabs चयनित TTS प्रदाता होता है, तो Discord वॉइस प्लेबैक स्ट्रीमिंग TTS का उपयोग करता है और प्रदाता प्रतिक्रिया स्ट्रीम से शुरू होता है। स्ट्रीमिंग समर्थन के बिना प्रदाता सिंथेसाइज़ किए गए अस्थायी-फ़ाइल पथ पर फ़ॉलबैक करते हैं।
- OpenClaw रिसीव डिक्रिप्ट विफलताओं पर भी नज़र रखता है और छोटी अवधि में बार-बार विफलताओं के बाद वॉइस चैनल छोड़कर/दोबारा जुड़कर अपने-आप रिकवर करता है।
- यदि अपडेट करने के बाद रिसीव लॉग बार-बार `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` दिखाते हैं, तो डिपेंडेंसी रिपोर्ट और लॉग एकत्र करें। बंडल की गई `@discordjs/voice` लाइन में discord.js PR #11449 से अपस्ट्रीम पैडिंग फ़िक्स शामिल है, जिसने discord.js issue #11419 को बंद किया था।
- OpenClaw द्वारा कैप्चर किए गए स्पीकर सेगमेंट को अंतिम रूप देने पर `The operation was aborted` रिसीव इवेंट अपेक्षित हैं; वे विस्तृत डायग्नोस्टिक हैं, चेतावनियाँ नहीं।
- वर्बोज़ Discord वॉइस लॉग हर स्वीकृत स्पीकर सेगमेंट के लिए सीमित एक-पंक्ति STT ट्रांसक्रिप्ट प्रीव्यू शामिल करते हैं, ताकि डिबगिंग में अनबाउंड ट्रांसक्रिप्ट टेक्स्ट डंप किए बिना उपयोगकर्ता पक्ष और एजेंट उत्तर पक्ष दोनों दिखें।
- `agent-proxy` मोड में, अनिवार्य कंसल्ट फ़ॉलबैक संभावित अधूरे ट्रांसक्रिप्ट खंडों को छोड़ देता है, जैसे `...` पर समाप्त होने वाला टेक्स्ट या `and` जैसा अंतिम कनेक्टर, साथ ही “be right back” या “bye” जैसे स्पष्ट गैर-कार्रवाई योग्य समापन। जब यह पुराने कतारबद्ध उत्तर को रोकता है, तो लॉग `forced agent consult skipped reason=...` दिखाते हैं।

### वॉइस में उपयोगकर्ताओं का अनुसरण करें

जब आप चाहते हैं कि Discord वॉइस बॉट स्टार्टअप पर किसी निश्चित चैनल से जुड़ने या `/vc join` की प्रतीक्षा करने के बजाय एक या अधिक ज्ञात Discord उपयोगकर्ताओं के साथ रहे, तो `voice.followUsers` का उपयोग करें।

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

- `followUsers` रॉ Discord उपयोगकर्ता ID और `discord:<id>` मान स्वीकार करता है। OpenClaw वॉइस-स्टेट इवेंट से मिलान करने से पहले दोनों रूपों को सामान्यीकृत करता है।
- जब `followUsers` कॉन्फ़िगर किया गया हो, तो `followUsersEnabled` डिफ़ॉल्ट रूप से `true` होता है। सेव की गई सूची रखने लेकिन स्वचालित वॉइस अनुसरण रोकने के लिए इसे `false` पर सेट करें।
- जब अनुसरण किया गया उपयोगकर्ता किसी अनुमत वॉइस चैनल से जुड़ता है, तो OpenClaw उस चैनल से जुड़ता है। जब उपयोगकर्ता स्थानांतरित होता है, तो OpenClaw उसके साथ स्थानांतरित होता है। जब सक्रिय अनुसरण किया गया उपयोगकर्ता डिस्कनेक्ट होता है, तो OpenClaw छोड़ देता है।
- यदि कई अनुसरण किए गए उपयोगकर्ता एक ही गिल्ड में हैं और सक्रिय अनुसरण किया गया उपयोगकर्ता छोड़ देता है, तो OpenClaw गिल्ड छोड़ने से पहले किसी अन्य ट्रैक किए गए अनुसरण किए गए उपयोगकर्ता के चैनल में चला जाता है। यदि कई अनुसरण किए गए उपयोगकर्ता एक साथ स्थानांतरित होते हैं, तो सबसे नया देखा गया वॉइस-स्टेट इवेंट प्रभावी होता है।
- `allowedChannels` अब भी लागू होता है। अस्वीकृत चैनल में मौजूद अनुसरण किया गया उपयोगकर्ता अनदेखा किया जाता है, और फ़ॉलो-स्वामित्व वाला सेशन किसी अन्य अनुसरण किए गए उपयोगकर्ता पर चला जाता है या छोड़ देता है।
- OpenClaw स्टार्टअप पर और सीमित अंतराल पर छूटे हुए वॉइस-स्टेट इवेंट का मिलान करता है। मिलान कॉन्फ़िगर किए गए गिल्ड का नमूना लेता है और प्रति रन REST लुकअप की सीमा लगाता है, इसलिए बहुत बड़ी `followUsers` सूचियों को कन्वर्ज करने में एक से अधिक अंतराल लग सकते हैं।
- यदि Discord या कोई एडमिन बॉट को तब स्थानांतरित करता है जब वह किसी उपयोगकर्ता का अनुसरण कर रहा हो, तो OpenClaw वॉइस सेशन को फिर से बनाता है और गंतव्य अनुमत होने पर फ़ॉलो स्वामित्व को सुरक्षित रखता है। यदि बॉट को `allowedChannels` से बाहर ले जाया जाता है, तो OpenClaw छोड़ देता है और कोई लक्ष्य मौजूद होने पर कॉन्फ़िगर किए गए लक्ष्य से दोबारा जुड़ता है।
- DAVE रिसीव रिकवरी बार-बार डिक्रिप्ट विफलताओं के बाद उसी चैनल को छोड़कर दोबारा जुड़ सकती है। फ़ॉलो-स्वामित्व वाले सेशन उस रिकवरी पथ के दौरान अपना फ़ॉलो स्वामित्व बनाए रखते हैं, इसलिए बाद में अनुसरण किए गए उपयोगकर्ता के डिस्कनेक्ट होने पर चैनल फिर भी छोड़ा जाता है।

जॉइन मोड के बीच चुनें:

- उन व्यक्तिगत या ऑपरेटर सेटअप के लिए `followUsers` का उपयोग करें जहाँ बॉट को आपके वॉइस में होते ही स्वचालित रूप से वॉइस में होना चाहिए।
- निश्चित-कमरे वाले बॉट के लिए `autoJoin` का उपयोग करें जिन्हें तब भी उपस्थित रहना चाहिए जब कोई ट्रैक किया गया उपयोगकर्ता वॉइस में न हो।
- एकबारगी जॉइन या उन कमरों के लिए `/vc join` का उपयोग करें जहाँ स्वचालित वॉइस उपस्थिति अप्रत्याशित लगेगी।

Discord वॉइस कोडेक:

- वॉइस प्राप्ति लॉग `discord voice: opus decoder: libopus-wasm` दिखाते हैं।
- Realtime प्लेबैक पैकेटों को `@discordjs/voice` को सौंपने से पहले उसी bundled `libopus-wasm` पैकेज से कच्चे 48 kHz स्टीरियो PCM को Opus में एन्कोड करता है।
- फ़ाइल और provider-stream प्लेबैक ffmpeg से कच्चे 48 kHz स्टीरियो PCM में ट्रांसकोड करता है, फिर Discord को भेजी जाने वाली Opus पैकेट स्ट्रीम के लिए `libopus-wasm` का उपयोग करता है।

STT और TTS पाइपलाइन:

- Discord PCM कैप्चर को WAV अस्थायी फ़ाइल में बदला जाता है।
- `tools.media.audio` STT संभालता है, उदाहरण के लिए `openai/gpt-4o-mini-transcribe`।
- ट्रांसक्रिप्ट को Discord ingress और routing के माध्यम से भेजा जाता है, जबकि response LLM एक voice-output policy के साथ चलता है जो agent `tts` tool को छिपाती है और लौटाया गया टेक्स्ट मांगती है, क्योंकि अंतिम TTS प्लेबैक Discord voice के स्वामित्व में है।
- `voice.model`, सेट होने पर, इस voice-channel turn के लिए केवल response LLM को override करता है।
- `voice.tts` को `messages.tts` के ऊपर merge किया जाता है; streaming-capable providers player को सीधे feed करते हैं, अन्यथा परिणामी audio file joined channel में चलाई जाती है।

Default agent-proxy voice-channel session उदाहरण:

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

`voice.agentSession` block न होने पर, हर voice channel को अपना routed OpenClaw session मिलता है। उदाहरण के लिए, `/vc join channel:234567890123456789` उस Discord voice channel के session से बात करता है। realtime model केवल voice front end है; substantive requests configured OpenClaw agent को सौंपी जाती हैं। अगर realtime model consult tool को call किए बिना final transcript बनाता है, तो OpenClaw fallback के रूप में consult को force करता है ताकि default अब भी agent से बात करने जैसा व्यवहार करे।

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

मौजूदा Discord channel session के extension के रूप में voice:

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

`agent-proxy` mode में bot configured voice channel से जुड़ता है, लेकिन OpenClaw agent turns target channel के सामान्य routed session और agent का उपयोग करते हैं। realtime voice session लौटाए गए result को voice channel में वापस बोलता है। supervisor agent अपनी tool policy के अनुसार अब भी सामान्य message tools का उपयोग कर सकता है, जिसमें सही action होने पर अलग Discord message भेजना भी शामिल है।

जब delegated OpenClaw run active होता है, तो नए Discord voice transcripts को दूसरा agent turn शुरू करने से पहले live run control माना जाता है। "status", "cancel that", "use the smaller fix", या "when you're done also check tests" जैसे phrases को active session के लिए status, cancel, steering, या follow-up input के रूप में classified किया जाता है। Status, cancel, accepted steering, और follow-up outcomes को voice channel में वापस बोला जाता है ताकि caller जान सके कि OpenClaw ने request संभाली या नहीं।

उपयोगी target forms:

- `target: "channel:123456789012345678"` Discord text channel session के माध्यम से route करता है।
- `target: "123456789012345678"` को channel target माना जाता है।
- `target: "dm:123456789012345678"` या `target: "user:123456789012345678"` उस direct-message session के माध्यम से route करता है।

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

इसे तब उपयोग करें जब model अपनी ही Discord playback को open mic के माध्यम से सुनता है, लेकिन आप फिर भी बोलकर उसे interrupt करना चाहते हैं। OpenClaw OpenAI को raw input audio पर auto-interrupt करने से रोकता है, जबकि `bargeIn: true` Discord speaker-start events और पहले से active speaker audio को अगला captured turn OpenAI तक पहुंचने से पहले active realtime responses cancel करने देता है। `minBargeInAudioEndMs` से कम `audioEndMs` वाले बहुत शुरुआती barge-in signals को संभावित echo/noise माना जाता है और ignore किया जाता है ताकि model पहले playback frame पर ही cut off न हो।

अपेक्षित voice logs:

- Join पर: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- Realtime start पर: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Speaker audio पर: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`, और `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Skipped stale speech पर: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` या `reason=non-actionable-closing ...`
- Realtime response completion पर: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- Playback stop/reset पर: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Realtime consult पर: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Agent answer पर: `discord voice: agent turn answer ...`
- Queued exact speech पर: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, जिसके बाद `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Barge-in detection पर: `discord voice: realtime barge-in detected source=speaker-start ...` या `discord voice: realtime barge-in detected source=active-speaker-audio ...`, जिसके बाद `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Realtime interruption पर: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, जिसके बाद या तो `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` या `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Ignored echo/noise पर: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Disabled barge-in पर: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Idle playback पर: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Cut-off audio debug करने के लिए, realtime voice logs को timeline की तरह पढ़ें:

1. `realtime audio playback started` का मतलब है कि Discord ने assistant audio चलाना शुरू कर दिया है। bridge इस point से assistant output chunks, Discord PCM bytes, provider realtime bytes, और synthesized audio duration की counting शुरू करता है।
2. `realtime speaker turn opened` किसी Discord speaker के active होने को mark करता है। अगर playback पहले से active है और `bargeIn` enabled है, तो इसके बाद `barge-in detected source=speaker-start` आ सकता है।
3. `realtime input audio started` उस speaker turn के लिए मिले पहले वास्तविक audio frame को mark करता है। यहां `outputActive=true` या nonzero `outputAudioMs` का मतलब है कि mic input भेज रहा है जबकि assistant playback अब भी active है।
4. `barge-in detected source=active-speaker-audio` का मतलब है कि OpenClaw ने assistant playback active रहते हुए live speaker audio देखा। यह किसी वास्तविक interruption को बिना उपयोगी audio वाले Discord speaker-start event से अलग पहचानने में उपयोगी है।
5. `barge-in requested reason=...` का मतलब है कि OpenClaw ने realtime provider से active response cancel या truncate करने को कहा। इसमें `outputAudioMs`, `outputActive`, और `playbackChunks` शामिल होते हैं ताकि आप देख सकें कि interruption से पहले assistant audio वास्तव में कितना चला था।
6. `realtime audio playback stopped reason=...` local Discord playback reset point है। reason बताता है कि playback किसने रोका: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close`, या `session-close`।
7. `realtime speaker turn closed` captured input turn का सार देता है। `chunks=0` या `hasAudio=false` का मतलब है कि speaker turn खुला लेकिन कोई usable audio realtime bridge तक नहीं पहुंचा। `interruptedPlayback=true` का मतलब है कि वह input turn assistant output के साथ overlap हुआ और barge-in logic trigger किया।

उपयोगी fields:

- `outputAudioMs`: log line से पहले realtime provider द्वारा generated assistant audio duration।
- `audioMs`: playback रुकने से पहले OpenClaw द्वारा counted assistant audio duration।
- `elapsedMs`: playback stream या speaker turn खोलने और बंद करने के बीच wall-clock time।
- `discordBytes`: Discord voice को भेजे गए या उससे प्राप्त 48 kHz stereo PCM bytes।
- `realtimeBytes`: realtime provider को भेजे गए या उससे प्राप्त provider-format PCM bytes।
- `playbackChunks`: active response के लिए Discord को forwarded assistant audio chunks।
- `sinceLastAudioMs`: last captured speaker audio frame और speaker turn closing के बीच gap।

Common patterns:

- `source=active-speaker-audio`, छोटे `outputAudioMs`, और पास में उसी user के साथ immediate cut-off आमतौर पर speaker echo के mic में जाने की ओर इशारा करता है। `voice.realtime.minBargeInAudioEndMs` बढ़ाएं, speaker volume घटाएं, headphones उपयोग करें, या `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` सेट करें।
- `source=speaker-start` के बाद `speaker turn closed ... hasAudio=false` का मतलब है कि Discord ने speaker start report किया लेकिन कोई audio OpenClaw तक नहीं पहुंचा। यह transient Discord voice event, noise gate behavior, या client द्वारा mic को थोड़ी देर key करने से हो सकता है।
- पास में barge-in या `provider-clear-audio` के बिना `audio playback stopped reason=stream-close` का मतलब है कि local Discord playback stream अप्रत्याशित रूप से समाप्त हो गई। पहले के provider और Discord player logs जांचें।
- `capture ignored during playback (barge-in disabled)` का मतलब है कि assistant audio active रहते हुए OpenClaw ने जानबूझकर input drop किया। अगर आप speech से playback interrupt कराना चाहते हैं तो `voice.realtime.bargeIn` enable करें।
- `barge-in ignored ... outputActive=false` का मतलब है कि Discord या provider VAD ने speech report की, लेकिन OpenClaw के पास interrupt करने के लिए कोई active playback नहीं था। इससे audio cut off नहीं होना चाहिए।

Credentials प्रति component resolve होते हैं: `voice.model` के लिए LLM route auth, `tools.media.audio` के लिए STT auth, `messages.tts`/`voice.tts` के लिए TTS auth, और `voice.realtime.providers` या provider के सामान्य auth config के लिए realtime provider auth।

### वॉइस संदेश

Discord वॉइस संदेश waveform preview दिखाते हैं और OGG/Opus audio की आवश्यकता होती है। OpenClaw waveform अपने-आप generate करता है, लेकिन inspect और convert करने के लिए gateway host पर `ffmpeg` और `ffprobe` चाहिए।

- एक **स्थानीय फ़ाइल पथ** दें (URLs अस्वीकार किए जाते हैं).
- टेक्स्ट सामग्री छोड़ दें (Discord एक ही payload में टेक्स्ट + वॉइस संदेश अस्वीकार करता है).
- कोई भी ऑडियो फ़ॉर्मैट स्वीकार है; OpenClaw ज़रूरत के अनुसार OGG/Opus में बदल देता है.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## समस्या निवारण

<AccordionGroup>
  <Accordion title="अस्वीकृत intents इस्तेमाल किए गए या बॉट को कोई guild संदेश नहीं दिख रहा">

    - Message Content Intent सक्षम करें
    - जब आप user/member resolution पर निर्भर हों, तब Server Members Intent सक्षम करें
    - intents बदलने के बाद gateway फिर से शुरू करें

  </Accordion>

  <Accordion title="Guild संदेश अनपेक्षित रूप से ब्लॉक हो रहे हैं">

    - `groupPolicy` सत्यापित करें
    - `channels.discord.guilds` के अंतर्गत guild allowlist सत्यापित करें
    - यदि guild `channels` map मौजूद है, तो केवल सूचीबद्ध channels की अनुमति होती है
    - `requireMention` व्यवहार और mention patterns सत्यापित करें

    उपयोगी जांचें:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false है लेकिन फिर भी ब्लॉक हो रहा है">
    सामान्य कारण:

    - मिलती-जुलती guild/channel allowlist के बिना `groupPolicy="allowlist"`
    - `requireMention` गलत जगह कॉन्फ़िगर किया गया है (`channels.discord.guilds` या channel entry के अंतर्गत होना चाहिए)
    - sender guild/channel `users` allowlist से ब्लॉक है

  </Accordion>

  <Accordion title="लंबे समय तक चलने वाले Discord turns या डुप्लिकेट replies">

    सामान्य logs:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway queue knobs:

    - single-account: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - यह केवल Discord gateway listener work नियंत्रित करता है, agent turn lifetime नहीं

    Discord queued agent turns पर channel-owned timeout लागू नहीं करता। Message listeners तुरंत hand off करते हैं, और queued Discord runs per-session ordering को तब तक सुरक्षित रखते हैं जब तक session/tool/runtime lifecycle काम पूरा या abort नहीं कर देता।

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
    OpenClaw कनेक्ट करने से पहले Discord `/gateway/bot` metadata fetch करता है। अस्थायी failures Discord के default gateway URL पर fallback करते हैं और logs में rate-limited होते हैं।

    Metadata timeout knobs:

    - single-account: `channels.discord.gatewayInfoTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - config unset होने पर env fallback: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - default: `30000` (30 सेकंड), max: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw startup के दौरान और runtime reconnects के बाद Discord के gateway `READY` event की प्रतीक्षा करता है। startup staggering वाले multi-account setups को default की तुलना में लंबी startup READY window की ज़रूरत हो सकती है।

    READY timeout knobs:

    - startup single-account: `channels.discord.gatewayReadyTimeoutMs`
    - startup multi-account: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - config unset होने पर startup env fallback: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - startup default: `15000` (15 सेकंड), max: `120000`
    - runtime single-account: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-account: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - config unset होने पर runtime env fallback: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - runtime default: `30000` (30 सेकंड), max: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe` permission checks केवल numeric channel IDs के लिए काम करते हैं।

    यदि आप slug keys इस्तेमाल करते हैं, तो runtime matching फिर भी काम कर सकती है, लेकिन probe permissions को पूरी तरह सत्यापित नहीं कर सकता।

  </Accordion>

  <Accordion title="DM और pairing समस्याएं">

    - DM disabled: `channels.discord.dm.enabled=false`
    - DM policy disabled: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - `pairing` mode में pairing approval की प्रतीक्षा

  </Accordion>

  <Accordion title="Bot to bot loops">
    default रूप से bot-authored messages अनदेखा किए जाते हैं।

    यदि आप `channels.discord.allowBots=true` सेट करते हैं, तो loop behavior से बचने के लिए strict mention और allowlist rules इस्तेमाल करें।
    केवल उन bot messages को स्वीकार करने के लिए जो bot को mention करते हैं, `channels.discord.allowBots="mentions"` को प्राथमिकता दें।

    OpenClaw shared [bot loop protection](/hi/channels/bot-loop-protection) भी ship करता है। जब भी `allowBots` bot-authored messages को dispatch तक पहुंचने देता है, Discord inbound event को `(account, channel, bot pair)` facts पर map करता है और generic pair guard configured event budget पार होने के बाद pair को suppress करता है। Guard runaway two-bot loops रोकता है जिन्हें पहले Discord rate limits से रोकना पड़ता था; यह single-bot deployments या budget के भीतर रहने वाले one-shot bot replies को प्रभावित नहीं करता।

    Default settings (`allowBots` सेट होने पर active):

    - `maxEventsPerWindow: 20` -- bot pair sliding window के भीतर 20 messages exchange कर सकता है
    - `windowSeconds: 60` -- sliding window length
    - `cooldownSeconds: 60` -- budget trip होने के बाद, किसी भी दिशा में हर अतिरिक्त bot-to-bot message एक मिनट के लिए drop किया जाता है

    Shared default को `channels.defaults.botLoopProtection` के अंतर्गत एक बार configure करें, फिर जब किसी legitimate workflow को अधिक headroom चाहिए तो Discord override करें। Precedence है:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - built-in defaults

    Discord generic `maxEventsPerWindow`, `windowSeconds`, और `cooldownSeconds` keys इस्तेमाल करता है।

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - OpenClaw current रखें (`openclaw update`) ताकि Discord voice receive recovery logic मौजूद हो
    - पुष्टि करें कि `channels.discord.voice.daveEncryption=true` (default) है
    - `channels.discord.voice.decryptionFailureTolerance=24` (upstream default) से शुरू करें और केवल ज़रूरत होने पर tune करें
    - logs देखें:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - यदि automatic rejoin के बाद भी failures जारी रहें, तो logs collect करें और [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) और [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) में upstream DAVE receive history से तुलना करें

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

## सुरक्षा और संचालन

- bot tokens को secrets मानें (supervised environments में `DISCORD_BOT_TOKEN` को प्राथमिकता दें).
- least-privilege Discord permissions दें।
- यदि command deploy/state stale है, तो gateway restart करें और `openclaw channels status --probe` से फिर से जांचें।

## संबंधित

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Discord user को gateway से pair करें।
  </Card>
  <Card title="Groups" icon="users" href="/hi/channels/groups">
    Group chat और allowlist behavior।
  </Card>
  <Card title="Channel routing" icon="route" href="/hi/channels/channel-routing">
    Inbound messages को agents तक route करें।
  </Card>
  <Card title="Security" icon="shield" href="/hi/gateway/security">
    Threat model और hardening।
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/hi/concepts/multi-agent">
    Guilds और channels को agents से map करें।
  </Card>
  <Card title="Slash commands" icon="terminal" href="/hi/tools/slash-commands">
    Native command behavior।
  </Card>
</CardGroup>
