---
read_when:
    - Telegram सुविधाओं या Webhook पर काम करना
summary: Telegram बॉट समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:19:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

बॉट DM और समूहों के लिए grammY के माध्यम से production-ready। Long polling डिफ़ॉल्ट मोड है; Webhook मोड वैकल्पिक है।

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Telegram के लिए डिफ़ॉल्ट DM नीति pairing है।
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल डायग्नोस्टिक्स और सुधार playbooks।
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/hi/gateway/configuration">
    पूर्ण चैनल config patterns और उदाहरण।
  </Card>
</CardGroup>

## त्वरित setup

<Steps>
  <Step title="Create the bot token in BotFather">
    Telegram खोलें और **@BotFather** से chat करें (confirm करें कि handle बिल्कुल `@BotFather` है)।

    `/newbot` चलाएँ, prompts follow करें, और token save करें।

  </Step>

  <Step title="Configure token and DM policy">

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

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (केवल default account)।
    Telegram `openclaw channels login telegram` का उपयोग **नहीं** करता; token को config/env में configure करें, फिर Gateway start करें।

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing codes 1 घंटे के बाद expire हो जाते हैं।

  </Step>

  <Step title="Add the bot to a group">
    बॉट को अपने group में add करें, फिर group access के लिए ज़रूरी दोनों IDs लें:

    - आपकी Telegram user ID, जो `allowFrom` / `groupAllowFrom` में इस्तेमाल होती है
    - Telegram group chat ID, जो `channels.telegram.groups` के तहत key के रूप में इस्तेमाल होती है

    पहली बार setup के लिए, group chat ID `openclaw logs --follow`, किसी forwarded-ID bot, या Bot API `getUpdates` से लें। group allowed होने के बाद, `/whoami@<bot_username>` user और group IDs confirm कर सकता है।

    `-100` से शुरू होने वाली negative Telegram supergroup IDs group chat IDs होती हैं। उन्हें `channels.telegram.groups` के तहत रखें, `groupAllowFrom` के तहत नहीं।

  </Step>
</Steps>

<Note>
Token resolution order account-aware है। व्यवहार में, config values env fallback पर प्राथमिकता लेती हैं, और `TELEGRAM_BOT_TOKEN` केवल default account पर लागू होता है।
सफल startup के बाद, OpenClaw state directory में बॉट identity को 24 घंटे तक cache करता है ताकि restarts अतिरिक्त Telegram `getMe` call से बच सकें; token बदलने या हटाने से वह cache clear हो जाता है।
</Note>

## Telegram side settings

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram bots default रूप से **Privacy Mode** में होते हैं, जो उन्हें मिलने वाले group messages को सीमित करता है।

    अगर बॉट को सभी group messages देखने की ज़रूरत है, तो इनमें से कोई एक करें:

    - `/setprivacy` के माध्यम से privacy mode disable करें, या
    - बॉट को group admin बनाएँ।

    Privacy mode toggle करते समय, हर group में बॉट को remove + re-add करें ताकि Telegram बदलाव apply करे।

  </Accordion>

  <Accordion title="Group permissions">
    Admin status Telegram group settings में controlled होता है।

    Admin bots सभी group messages receive करते हैं, जो always-on group behavior के लिए उपयोगी है।

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - group adds allow/deny करने के लिए `/setjoingroups`
    - group visibility behavior के लिए `/setprivacy`

  </Accordion>
</AccordionGroup>

## Access control और activation

### Group bot identity

Telegram groups और forum topics में, configured bot handle (उदाहरण के लिए `@my_bot`) का explicit mention selected OpenClaw agent को address करना माना जाता है, भले ही agent persona name Telegram username से अलग हो। group silence policy unrelated group traffic पर अभी भी लागू होती है, लेकिन bot handle खुद "someone else" नहीं माना जाता।

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` direct message access control करता है:

    - `pairing` (default)
    - `allowlist` (`allowFrom` में कम से कम एक sender ID आवश्यक)
    - `open` (`allowFrom` में `"*"` शामिल होना आवश्यक)
    - `disabled`

    `allowFrom: ["*"]` के साथ `dmPolicy: "open"` किसी भी Telegram account को, जो bot username ढूँढता या guess करता है, bot को command करने देता है। इसे केवल tightly restricted tools वाले जानबूझकर public bots के लिए इस्तेमाल करें; one-owner bots को numeric user IDs के साथ `allowlist` इस्तेमाल करना चाहिए।

    `channels.telegram.allowFrom` numeric Telegram user IDs accept करता है। `telegram:` / `tg:` prefixes accepted और normalized हैं।
    Multi-account configs में, restrictive top-level `channels.telegram.allowFrom` को safety boundary माना जाता है: account-level `allowFrom: ["*"]` entries उस account को public नहीं बनातीं, जब तक merged effective account allowlist में अभी भी explicit wildcard न हो।
    खाली `allowFrom` के साथ `dmPolicy: "allowlist"` सभी DMs block करता है और config validation द्वारा rejected होता है।
    Setup केवल numeric user IDs माँगता है।
    अगर आपने upgrade किया है और आपके config में `@username` allowlist entries हैं, तो उन्हें resolve करने के लिए `openclaw doctor --fix` चलाएँ (best-effort; Telegram bot token आवश्यक है)।
    अगर आप पहले pairing-store allowlist files पर निर्भर थे, तो `openclaw doctor --fix` allowlist flows में entries को `channels.telegram.allowFrom` में recover कर सकता है (उदाहरण के लिए जब `dmPolicy: "allowlist"` में अभी explicit IDs नहीं हैं)।

    One-owner bots के लिए, access policy को config में durable रखने के लिए explicit numeric `allowFrom` IDs के साथ `dmPolicy: "allowlist"` prefer करें (previous pairing approvals पर निर्भर रहने के बजाय)।

    सामान्य भ्रम: DM pairing approval का मतलब "यह sender हर जगह authorized है" नहीं होता।
    Pairing DM access grant करता है। अगर अभी तक कोई command owner मौजूद नहीं है, तो पहली approved pairing `commands.ownerAllowFrom` भी set करती है ताकि owner-only commands और exec approvals के पास explicit operator account हो।
    Group sender authorization अभी भी explicit config allowlists से आता है।
    अगर आप चाहते हैं कि "मैं एक बार authorized हूँ और DMs तथा group commands दोनों काम करें", तो अपनी numeric Telegram user ID को `channels.telegram.allowFrom` में रखें; owner-only commands के लिए, सुनिश्चित करें कि `commands.ownerAllowFrom` में `telegram:<your user id>` शामिल है।

    ### अपनी Telegram user ID ढूँढना

    सुरक्षित तरीका (third-party bot नहीं):

    1. अपने bot को DM करें।
    2. `openclaw logs --follow` चलाएँ।
    3. `from.id` पढ़ें।

    Official Bot API method:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Third-party method (कम private): `@userinfobot` या `@getidsbot`।

  </Tab>

  <Tab title="Group policy and allowlists">
    दो controls साथ में apply होते हैं:

    1. **कौन से groups allowed हैं** (`channels.telegram.groups`)
       - कोई `groups` config नहीं:
         - `groupPolicy: "open"` के साथ: कोई भी group group-ID checks pass कर सकता है
         - `groupPolicy: "allowlist"` (default) के साथ: groups तब तक blocked रहते हैं जब तक आप `groups` entries (या `"*"`) add नहीं करते
       - `groups` configured: allowlist की तरह act करता है (explicit IDs या `"*"`)

    2. **Groups में कौन से senders allowed हैं** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` group sender filtering के लिए इस्तेमाल होता है। अगर set नहीं है, तो Telegram `allowFrom` पर fallback करता है।
    `groupAllowFrom` entries numeric Telegram user IDs होनी चाहिए (`telegram:` / `tg:` prefixes normalized हैं)।
    Telegram group या supergroup chat IDs को `groupAllowFrom` में न रखें। Negative chat IDs `channels.telegram.groups` के तहत होती हैं।
    Non-numeric entries sender authorization के लिए ignored होती हैं।
    Security boundary (`2026.2.25+`): group sender auth DM pairing-store approvals inherit **नहीं** करता।
    Pairing DM-only रहती है। Groups के लिए, `groupAllowFrom` या per-group/per-topic `allowFrom` set करें।
    अगर `groupAllowFrom` unset है, तो Telegram config `allowFrom` पर fallback करता है, pairing store पर नहीं।
    One-owner bots के लिए practical pattern: अपनी user ID को `channels.telegram.allowFrom` में set करें, `groupAllowFrom` unset छोड़ें, और target groups को `channels.telegram.groups` के तहत allow करें।
    Runtime note: अगर `channels.telegram` पूरी तरह missing है, तो runtime default रूप से fail-closed `groupPolicy="allowlist"` करता है, जब तक `channels.defaults.groupPolicy` explicitly set न हो।

    Owner-only group setup:

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

    इसे group से `@<bot_username> ping` के साथ test करें। `requireMention: true` रहते हुए plain group messages bot को trigger नहीं करते।

    Example: एक specific group में किसी भी member को allow करें:

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

    Example: एक specific group के अंदर केवल specific users को allow करें:

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
      सामान्य गलती: `groupAllowFrom` Telegram group allowlist नहीं है।

      - `-1001234567890` जैसी negative Telegram group या supergroup chat IDs को `channels.telegram.groups` के तहत रखें।
      - जब आप allowed group के अंदर किन लोगों को bot trigger करने देना है यह limit करना चाहते हैं, तो `8734062810` जैसी Telegram user IDs को `groupAllowFrom` के तहत रखें।
      - `groupAllowFrom: ["*"]` केवल तब इस्तेमाल करें जब आप चाहते हों कि allowed group का कोई भी member bot से बात कर सके।

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Group replies default रूप से mention require करती हैं।

    Mention इनसे आ सकता है:

    - native `@botusername` mention, या
    - इनमें mention patterns:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Session-level command toggles:

    - `/activation always`
    - `/activation mention`

    ये केवल session state update करते हैं। Persistence के लिए config इस्तेमाल करें।

    Persistent config example:

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

    Group history context default रूप से `mention-only` है: prior group messages केवल तब
    include होते हैं जब वे bot को addressed थे, bot को replies हैं,
    या bot के अपने messages हैं। Trusted groups के लिए recent room history include करने हेतु
    `includeGroupHistoryContext: "recent"` set करें। Next turn के साथ कोई prior Telegram group history
    न भेजने के लिए `includeGroupHistoryContext: "none"` set करें।

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Group chat ID प्राप्त करना:

    - group message को `@userinfobot` / `@getidsbot` पर forward करें
    - या `openclaw logs --follow` से `chat.id` पढ़ें
    - या Bot API `getUpdates` inspect करें
    - group allowed होने के बाद, अगर native commands enabled हैं तो `/whoami@<bot_username>` चलाएँ

  </Tab>
</Tabs>

## Runtime behavior

- Telegram का स्वामित्व Gateway प्रक्रिया के पास है।
- रूटिंग निर्धारक है: Telegram से आने वाले उत्तर वापस Telegram पर जाते हैं (मॉडल चैनल नहीं चुनता)।
- आने वाले संदेश reply metadata, media placeholders, और Gateway द्वारा देखे गए Telegram उत्तरों के लिए persisted reply-chain context के साथ साझा channel envelope में सामान्यीकृत होते हैं।
- समूह सत्र group ID से अलग रखे जाते हैं। Forum topics को अलग रखने के लिए `:topic:<threadId>` जोड़ा जाता है।
- DM संदेशों में `message_thread_id` हो सकता है; OpenClaw इसे उत्तरों के लिए सुरक्षित रखता है। DM topic sessions केवल तब विभाजित होते हैं जब Telegram `getMe` bot के लिए `has_topics_enabled: true` रिपोर्ट करता है; अन्यथा DMs flat session पर रहते हैं।
- Long polling per-chat/per-thread sequencing के साथ grammY runner का उपयोग करता है। कुल runner sink concurrency `agents.defaults.maxConcurrent` का उपयोग करती है।
- Multi-account startup समवर्ती Telegram `getMe` probes को सीमित करता है ताकि बड़े bot fleets हर account probe को एक साथ fan out न करें।
- Long polling प्रत्येक Gateway प्रक्रिया के भीतर सुरक्षित है ताकि एक समय में केवल एक active poller ही bot token का उपयोग कर सके। यदि आपको अब भी `getUpdates` 409 conflicts दिखते हैं, तो संभव है कि कोई अन्य OpenClaw Gateway, script, या external poller उसी token का उपयोग कर रहा हो।
- Long-polling watchdog restarts डिफ़ॉल्ट रूप से 120 seconds तक completed `getUpdates` liveness न मिलने के बाद trigger होते हैं। `channels.telegram.pollingStallThresholdMs` को केवल तब बढ़ाएँ जब आपके deployment में लंबे समय तक चलने वाले कार्य के दौरान अब भी false polling-stall restarts दिखते हों। मान milliseconds में है और `30000` से `600000` तक स्वीकार्य है; per-account overrides समर्थित हैं।
- Telegram Bot API में read-receipt support नहीं है (`sendReadReceipts` लागू नहीं होता)।

<Note>
  `channels.telegram.dm.threadReplies` और `channels.telegram.direct.<chatId>.threadReplies` हटा दिए गए थे। Upgrade करने के बाद यदि आपके config में अब भी ये keys हैं, तो `openclaw doctor --fix` चलाएँ। DM topic routing अब Telegram `getMe.has_topics_enabled` से मिली bot capability का पालन करती है, जिसे BotFather threaded mode नियंत्रित करता है: topics-enabled bots तब thread-scoped DM sessions का उपयोग करते हैं जब Telegram `message_thread_id` भेजता है; अन्य DMs flat session पर रहते हैं।
</Note>

## सुविधा संदर्भ

<AccordionGroup>
  <Accordion title="लाइव स्ट्रीम पूर्वावलोकन (message edits)">
    OpenClaw real time में partial replies stream कर सकता है:

    - direct chats: preview message + `editMessageText`
    - groups/topics: preview message + `editMessageText`

    आवश्यकता:

    - `channels.telegram.streaming` `off | partial | block | progress` है (डिफ़ॉल्ट: `partial`)
    - छोटे initial answer previews debounced होते हैं, फिर यदि run अब भी active है तो bounded delay के बाद materialize किए जाते हैं
    - `progress` tool progress के लिए एक editable status draft रखता है, tool progress से पहले answer activity आने पर stable status label दिखाता है, completion पर उसे clear करता है, और final answer को normal message के रूप में भेजता है
    - `streaming.preview.toolProgress` नियंत्रित करता है कि tool/progress updates वही edited preview message फिर से उपयोग करें या नहीं (डिफ़ॉल्ट: preview streaming active होने पर `true`)
    - `streaming.preview.commandText` उन tool-progress lines के भीतर command/exec detail नियंत्रित करता है: `raw` (डिफ़ॉल्ट, released behavior को सुरक्षित रखता है) या `status` (केवल tool label)
    - `streaming.progress.commentary` (डिफ़ॉल्ट: `false`) अस्थायी progress draft में assistant commentary/preamble text को opt in करता है
    - legacy `channels.telegram.streamMode`, boolean `streaming` values, और retired native draft preview keys detect किए जाते हैं; उन्हें current streaming config में migrate करने के लिए `openclaw doctor --fix` चलाएँ

    Tool-progress preview updates वे छोटी status lines हैं जो tools चलने के दौरान दिखाई जाती हैं, जैसे command execution, file reads, planning updates, patch summaries, या Codex app-server mode में Codex preamble/commentary text। Telegram इन्हें डिफ़ॉल्ट रूप से enabled रखता है ताकि `v2026.4.22` और उसके बाद के released OpenClaw behavior से मेल बना रहे।

    Answer text के लिए edited preview बनाए रखने लेकिन tool-progress lines छिपाने के लिए, set करें:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Tool-progress visible रखने लेकिन command/exec text छिपाने के लिए, set करें:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    `progress` mode का उपयोग तब करें जब आप final answer को उसी message में edit किए बिना visible tool progress चाहते हों। command-text policy को `streaming.progress` के तहत रखें:

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

    `streaming.mode: "off"` का उपयोग केवल तब करें जब आप final-only delivery चाहते हों: Telegram preview edits disabled होते हैं और generic tool/progress chatter को standalone status messages के रूप में भेजने के बजाय suppressed किया जाता है। Approval prompts, media payloads, और errors अब भी normal final delivery के माध्यम से route होते हैं। `streaming.preview.toolProgress: false` का उपयोग तब करें जब आप केवल answer preview edits रखना चाहते हों और tool-progress status lines छिपाना चाहते हों।

    <Note>
      Telegram selected quote replies अपवाद हैं। जब `replyToMode` `"first"`, `"all"`, या `"batched"` है और inbound message में selected quote text शामिल है, तो OpenClaw answer preview edit करने के बजाय Telegram के native quote-reply path से final answer भेजता है, इसलिए `streaming.preview.toolProgress` उस turn के लिए छोटी status lines नहीं दिखा सकता। Selected quote text के बिना current-message replies अब भी preview streaming बनाए रखते हैं। जब tool-progress visibility native quote replies से अधिक महत्वपूर्ण हो तो `replyToMode: "off"` set करें, या trade-off स्वीकार करने के लिए `streaming.preview.toolProgress: false` set करें।
    </Note>

    Text-only replies के लिए:

    - छोटे DM/group/topic previews: OpenClaw वही preview message रखता है और final edit in place करता है
    - लंबे text finals जो कई Telegram messages में split होते हैं, जब संभव हो तो existing preview को पहले final chunk के रूप में reuse करते हैं, फिर केवल remaining chunks भेजते हैं
    - progress-mode finals status draft clear करते हैं और draft को answer में edit करने के बजाय normal final delivery का उपयोग करते हैं
    - यदि completed text confirm होने से पहले final edit fail होता है, तो OpenClaw normal final delivery का उपयोग करता है और stale preview clean up करता है

    Complex replies (जैसे media payloads) के लिए, OpenClaw normal final delivery पर fallback करता है और फिर preview message clean up करता है।

    Preview streaming block streaming से अलग है। जब Telegram के लिए block streaming स्पष्ट रूप से enabled होती है, तो OpenClaw double-streaming से बचने के लिए preview stream skip करता है।

    Reasoning stream behavior:

    - `/reasoning stream` समर्थित channel के reasoning-preview path का उपयोग करता है; Telegram पर, यह generate करते समय reasoning को live preview में stream करता है
    - final delivery के बाद reasoning preview delete कर दिया जाता है; जब reasoning visible रहनी चाहिए तो `/reasoning on` का उपयोग करें
    - final answer reasoning text के बिना भेजा जाता है

  </Accordion>

  <Accordion title="समृद्ध message formatting">
    Outbound text डिफ़ॉल्ट रूप से standard Telegram HTML messages का उपयोग करता है ताकि replies current Telegram clients में readable रहें। यह compatibility mode सामान्य bold, italic, links, code, spoilers, और quotes को support करता है, लेकिन native tables, details, rich media, और formulas जैसे Bot API 10.1 rich-only blocks को नहीं।

    Bot API 10.1 rich messages opt in करने के लिए `channels.telegram.richMessages: true` set करें:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Enabled होने पर:

    - Agent को बताया जाता है कि इस bot/account के लिए Telegram rich messages available हैं।
    - Markdown text OpenClaw के Markdown IR से render होकर Telegram rich HTML के रूप में भेजा जाता है।
    - Explicit rich HTML payloads headings, tables, details, rich media, और formulas जैसे supported Bot API 10.1 tags को preserve करते हैं।
    - Media captions अब भी Telegram HTML captions का उपयोग करते हैं क्योंकि rich messages captions को replace नहीं करते।

    इससे model text Telegram Rich Markdown sigils से दूर रहता है, इसलिए `$400-600K` जैसी currency math के रूप में parse नहीं होती। Long rich text अपने आप Telegram की rich text और rich block limits में split होता है। Telegram की column limit से अधिक tables code blocks के रूप में भेजे जाते हैं।

    डिफ़ॉल्ट: client compatibility के लिए off। Rich messages के लिए compatible Telegram clients चाहिए; कुछ current Desktop, Web, Android, और third-party clients accepted rich messages को unsupported के रूप में display करते हैं। इस option को disabled रखें जब तक bot के साथ उपयोग होने वाला हर client उन्हें render न कर सके। `/status` दिखाता है कि current Telegram session में rich messages on हैं या off।

    Link previews डिफ़ॉल्ट रूप से enabled हैं। `channels.telegram.linkPreview: false` rich text के लिए automatic entity detection skip करता है।

  </Accordion>

  <Accordion title="Native commands और custom commands">
    Telegram command menu registration startup पर `setMyCommands` के साथ handle किया जाता है।

    Native command defaults:

    - `commands.native: "auto"` Telegram के लिए native commands enable करता है

    Custom command menu entries जोड़ें:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    नियम:

    - names normalized होते हैं (leading `/` हटाएँ, lowercase)
    - valid pattern: `a-z`, `0-9`, `_`, length `1..32`
    - custom commands native commands को override नहीं कर सकते
    - conflicts/duplicates skipped और logged होते हैं

    Notes:

    - custom commands केवल menu entries हैं; वे behavior को auto-implement नहीं करते
    - plugin/skill commands typed होने पर अब भी work कर सकते हैं, भले ही Telegram menu में न दिखें

    यदि native commands disabled हैं, तो built-ins removed हो जाते हैं। Custom/plugin commands configured होने पर अब भी register हो सकते हैं।

    Common setup failures:

    - `BOT_COMMANDS_TOO_MUCH` के साथ `setMyCommands failed` का मतलब है कि trimming के बाद भी Telegram menu overflow हुआ; plugin/skill/custom commands कम करें या `channels.telegram.commands.native` disable करें।
    - Direct Bot API curl commands के work करने के बावजूद `deleteWebhook`, `deleteMyCommands`, या `setMyCommands` का `404: Not Found` के साथ fail होना यह संकेत दे सकता है कि `channels.telegram.apiRoot` को full `/bot<TOKEN>` endpoint पर set किया गया था। `apiRoot` केवल Bot API root होना चाहिए, और `openclaw doctor --fix` accidental trailing `/bot<TOKEN>` को remove करता है।
    - `getMe returned 401` का मतलब है कि Telegram ने configured bot token reject किया। `botToken`, `tokenFile`, या `TELEGRAM_BOT_TOKEN` को current BotFather token से update करें; OpenClaw polling से पहले stop हो जाता है, इसलिए इसे webhook cleanup failure के रूप में report नहीं किया जाता।
    - Network/fetch errors के साथ `setMyCommands failed` का सामान्य अर्थ है कि `api.telegram.org` तक outbound DNS/HTTPS blocked है।

    ### Device pairing commands (`device-pair` plugin)

    जब `device-pair` plugin installed हो:

    1. `/pair` setup code generate करता है
    2. iOS app में code paste करें
    3. `/pair pending` pending requests list करता है (role/scopes सहित)
    4. request approve करें:
       - explicit approval के लिए `/pair approve <requestId>`
       - जब केवल एक pending request हो तो `/pair approve`
       - सबसे recent के लिए `/pair approve latest`

    Setup code में short-lived bootstrap token होता है। Built-in setup-code bootstrap node-only है: पहला connect एक pending node request बनाता है, और approval के बाद Gateway `scopes: []` के साथ durable node token लौटाता है। यह handed-off operator token नहीं लौटाता; operator access के लिए separate approved operator pairing या token flow चाहिए।

    यदि कोई device बदले हुए auth details (जैसे role/scopes/public key) के साथ retry करता है, तो previous pending request superseded हो जाती है और new request अलग `requestId` उपयोग करती है। Approve करने से पहले `/pair pending` फिर चलाएँ।

    अधिक विवरण: [पेयरिंग](/hi/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="इनलाइन बटन">
    इनलाइन कीबोर्ड दायरा कॉन्फ़िगर करें:

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

    प्रति-खाता ओवरराइड:

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

    दायरे:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (डिफ़ॉल्ट)

    पुराना `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` पर मैप होता है।

    संदेश क्रिया उदाहरण:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Mini App बटन उदाहरण:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Telegram `web_app` बटन केवल उपयोगकर्ता और bot के बीच निजी चैट में काम करते हैं।

    Callback क्लिक, जिन्हें किसी पंजीकृत plugin interactive handler द्वारा दावा नहीं किया जाता,
    agent को टेक्स्ट के रूप में पास किए जाते हैं:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="एजेंटों और ऑटोमेशन के लिए Telegram संदेश क्रियाएँ">
    Telegram टूल क्रियाओं में शामिल हैं:

    - `sendMessage` (`to`, `content`, वैकल्पिक `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` या `caption`, वैकल्पिक `presentation` इनलाइन बटन; केवल-बटन संपादन reply markup अपडेट करते हैं)
    - `createForumTopic` (`chatId`, `name`, वैकल्पिक `iconColor`, `iconCustomEmojiId`)

    चैनल संदेश क्रियाएँ सुविधाजनक alias उजागर करती हैं (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)।

    गेटिंग नियंत्रण:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (डिफ़ॉल्ट: अक्षम)

    नोट: `edit` और `topic-create` वर्तमान में डिफ़ॉल्ट रूप से सक्षम हैं और इनके अलग `channels.telegram.actions.*` toggle नहीं हैं।
    Runtime sends सक्रिय config/secrets snapshot (startup/reload) का उपयोग करते हैं, इसलिए action paths हर send पर ad-hoc SecretRef re-resolution नहीं करते।

    Reaction हटाने का अर्थ: [/tools/reactions](/hi/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram जनरेट किए गए आउटपुट में explicit reply threading tags का समर्थन करता है:

    - `[[reply_to_current]]` triggering message का उत्तर देता है
    - `[[reply_to:<id>]]` किसी विशिष्ट Telegram message ID का उत्तर देता है

    `channels.telegram.replyToMode` handling नियंत्रित करता है:

    - `off` (डिफ़ॉल्ट)
    - `first`
    - `all`

    जब reply threading सक्षम होता है और मूल Telegram टेक्स्ट या कैप्शन उपलब्ध होता है, OpenClaw अपने-आप एक native Telegram quote excerpt शामिल करता है। Telegram native quote text को 1024 UTF-16 code units तक सीमित करता है, इसलिए लंबे messages को शुरुआत से quote किया जाता है और यदि Telegram quote को अस्वीकार करता है तो plain reply पर fallback होता है।

    नोट: `off` implicit reply threading अक्षम करता है। Explicit `[[reply_to_*]]` tags फिर भी honored रहते हैं।

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Forum supergroups:

    - topic session keys में `:topic:<threadId>` जुड़ता है
    - replies और typing topic thread को target करते हैं
    - topic config path:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    General topic (`threadId=1`) special-case:

    - message sends में `message_thread_id` छोड़ा जाता है (Telegram `sendMessage(...thread_id=1)` अस्वीकार करता है)
    - typing actions में फिर भी `message_thread_id` शामिल होता है

    Topic inheritance: topic entries, override न होने पर group settings inherit करती हैं (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)।
    `agentId` केवल topic के लिए है और group defaults से inherit नहीं होता।
    `topics."*"` उस group के हर topic के लिए defaults सेट करता है; exact topic IDs फिर भी `"*"` पर प्राथमिकता लेते हैं।

    **प्रति-topic agent routing**: हर topic, topic config में `agentId` सेट करके किसी अलग agent को route कर सकता है। इससे हर topic को अपना isolated workspace, memory, और session मिलता है। उदाहरण:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    इसके बाद हर topic की अपनी session key होती है: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistent ACP topic binding**: Forum topics top-level typed ACP bindings (`bindings[]` with `type: "acp"` और `match.channel: "telegram"`, `peer.kind: "group"`, और `-1001234567890:topic:42` जैसी topic-qualified id) के माध्यम से ACP harness sessions को pin कर सकते हैं। वर्तमान में groups/supergroups में forum topics तक scoped है। देखें [ACP Agents](/hi/tools/acp-agents)।

    **चैट से thread-bound ACP spawn**: `/acp spawn <agent> --thread here|auto` वर्तमान topic को नए ACP session से bind करता है; follow-ups सीधे वहीं route होते हैं। OpenClaw spawn confirmation को in-topic pin करता है। इसके लिए `channels.telegram.threadBindings.spawnSessions` सक्षम रहना आवश्यक है (डिफ़ॉल्ट: `true`)।

    Template context `MessageThreadId` और `IsForum` उजागर करता है। `message_thread_id` वाली DM chats reply metadata बनाए रखती हैं; वे thread-aware session keys केवल तब इस्तेमाल करती हैं जब Telegram `getMe` bot के लिए `has_topics_enabled: true` report करता है।
    पुराने `dm.threadReplies` और `direct.*.threadReplies` overrides जानबूझकर retired हैं; BotFather threaded mode को single source of truth के रूप में उपयोग करें और stale config keys हटाने के लिए `openclaw doctor --fix` चलाएँ।

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### ऑडियो संदेश

    Telegram voice notes और audio files में अंतर करता है।

    - डिफ़ॉल्ट: audio file व्यवहार
    - voice-note send बाध्य करने के लिए agent reply में tag `[[audio_as_voice]]`
    - inbound voice-note transcripts को agent context में machine-generated,
      untrusted text के रूप में framed किया जाता है; mention detection फिर भी raw
      transcript का उपयोग करता है ताकि mention-gated voice messages काम करते रहें।

    संदेश क्रिया उदाहरण:

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

    Telegram वीडियो फ़ाइलों और वीडियो नोट्स में अंतर करता है।

    संदेश कार्रवाई उदाहरण:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    वीडियो नोट्स कैप्शन का समर्थन नहीं करते; दिया गया संदेश टेक्स्ट अलग से भेजा जाता है।

    ### स्टिकर

    आने वाले स्टिकर का प्रबंधन:

    - static WEBP: डाउनलोड और प्रोसेस किया गया (प्लेसहोल्डर `<media:sticker>`)
    - animated TGS: छोड़ा गया
    - video WEBM: छोड़ा गया

    स्टिकर संदर्भ फ़ील्ड:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    बार-बार होने वाली vision कॉल घटाने के लिए स्टिकर विवरण OpenClaw SQLite plugin स्टेट में कैश किए जाते हैं।

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

    स्टिकर कार्रवाई भेजें:

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
    Telegram प्रतिक्रियाएँ `message_reaction` अपडेट के रूप में आती हैं (संदेश पेलोड से अलग)।

    सक्षम होने पर, OpenClaw इस तरह के सिस्टम इवेंट कतार में डालता है:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    कॉन्फ़िग:

    - `channels.telegram.reactionNotifications`: `off | own | all` (डिफ़ॉल्ट: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (डिफ़ॉल्ट: `minimal`)

    नोट्स:

    - `own` का मतलब केवल bot द्वारा भेजे गए संदेशों पर उपयोगकर्ता प्रतिक्रियाएँ हैं (भेजे गए संदेश कैश के जरिए best-effort)।
    - प्रतिक्रिया इवेंट अब भी Telegram एक्सेस नियंत्रणों (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) का पालन करते हैं; अनधिकृत प्रेषक हटा दिए जाते हैं।
    - Telegram प्रतिक्रिया अपडेट में thread IDs नहीं देता।
      - गैर-फ़ोरम समूह group chat session पर रूट होते हैं
      - फ़ोरम समूह group general-topic session (`:topic:1`) पर रूट होते हैं, ठीक मूल topic पर नहीं

    polling/webhook के लिए `allowed_updates` में `message_reaction` अपने-आप शामिल होता है।

  </Accordion>

  <Accordion title="Ack प्रतिक्रियाएँ">
    जब OpenClaw किसी आने वाले संदेश को प्रोसेस कर रहा होता है, तब `ackReaction` एक acknowledgement emoji भेजता है। `ackReactionScope` तय करता है कि वह emoji वास्तव में *कब* भेजा जाता है।

    **Emoji (`ackReaction`) समाधान क्रम:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - एजेंट पहचान emoji fallback (`agents.list[].identity.emoji`, अन्यथा "👀")

    नोट्स:

    - Telegram unicode emoji की अपेक्षा करता है (उदाहरण के लिए "👀")।
    - किसी channel या account के लिए प्रतिक्रिया अक्षम करने हेतु `""` का उपयोग करें।

    **Scope (`messages.ackReactionScope`):**

    Telegram provider scope को `messages.ackReactionScope` से पढ़ता है (डिफ़ॉल्ट `"group-mentions"`)। आज कोई Telegram-account या Telegram-channel-स्तर override नहीं है।

    मान: `"all"` (DMs + groups), `"direct"` (केवल DMs), `"group-all"` (हर group message, कोई DMs नहीं), `"group-mentions"` (जब bot का उल्लेख हो तब groups; **कोई DMs नहीं** — यह डिफ़ॉल्ट है), `"off"` / `"none"` (अक्षम)।

    <Note>
    डिफ़ॉल्ट scope (`"group-mentions"`) direct messages में ack प्रतिक्रियाएँ ट्रिगर नहीं करता। आने वाले Telegram DMs पर ack प्रतिक्रिया पाने के लिए, `messages.ackReactionScope` को `"direct"` या `"all"` पर सेट करें। मान Telegram provider startup पर पढ़ा जाता है, इसलिए बदलाव लागू करने के लिए gateway restart आवश्यक है।
    </Note>

  </Accordion>

  <Accordion title="Telegram इवेंट और कमांड से कॉन्फ़िग लेखन">
    Channel config writes डिफ़ॉल्ट रूप से सक्षम हैं (`configWrites !== false`)।

    Telegram-triggered writes में शामिल हैं:

    - `channels.telegram.groups` अपडेट करने के लिए group migration events (`migrate_to_chat_id`)
    - `/config set` और `/config unset` (command enablement आवश्यक)

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

  <Accordion title="Long polling बनाम webhook">
    डिफ़ॉल्ट long polling है। Webhook mode के लिए `channels.telegram.webhookUrl` और `channels.telegram.webhookSecret` सेट करें; वैकल्पिक `webhookPath`, `webhookHost`, `webhookPort` (डिफ़ॉल्ट `/telegram-webhook`, `127.0.0.1`, `8787`)।

    long-polling mode में OpenClaw अपना restart watermark केवल किसी update के सफलतापूर्वक dispatch होने के बाद ही सहेजता है। यदि कोई handler विफल होता है, तो वह update उसी process में retryable रहता है और restart dedupe के लिए completed के रूप में नहीं लिखा जाता।

    local listener `127.0.0.1:8787` से bind होता है। Public ingress के लिए, या तो local port के आगे reverse proxy लगाएँ या जानबूझकर `webhookHost: "0.0.0.0"` सेट करें।

    Webhook mode Telegram को `200` लौटाने से पहले request guards, Telegram secret token, और JSON body को validate करता है।
    इसके बाद OpenClaw उसी per-chat/per-topic bot lanes के जरिए update को asynchronously process करता है जिनका long polling उपयोग करता है, इसलिए slow agent turns Telegram के delivery ACK को रोके नहीं रखते।

  </Accordion>

  <Accordion title="सीमाएं, पुनर्प्रयास, और CLI लक्ष्य">
    - `channels.telegram.textChunkLimit` का डिफ़ॉल्ट 4000 है।
    - `channels.telegram.chunkMode="newline"` लंबाई के आधार पर विभाजन से पहले अनुच्छेद सीमाओं (खाली पंक्तियां) को प्राथमिकता देता है।
    - `channels.telegram.mediaMaxMb` (डिफ़ॉल्ट 100) इनबाउंड और आउटबाउंड Telegram मीडिया आकार को सीमित करता है।
    - `channels.telegram.mediaGroupFlushMs` (डिफ़ॉल्ट 500) नियंत्रित करता है कि OpenClaw द्वारा Telegram एल्बम/मीडिया समूहों को एक इनबाउंड संदेश के रूप में भेजने से पहले कितनी देर तक बफ़र किया जाए। यदि एल्बम के हिस्से देर से आते हैं तो इसे बढ़ाएं; एल्बम उत्तर विलंबता कम करने के लिए इसे घटाएं।
    - `channels.telegram.timeoutSeconds` Telegram API क्लाइंट टाइमआउट को ओवरराइड करता है (यदि सेट नहीं है, तो grammY डिफ़ॉल्ट लागू होता है)। Bot क्लाइंट कॉन्फ़िगर किए गए मानों को 60-सेकंड के आउटबाउंड टेक्स्ट/टाइपिंग अनुरोध गार्ड से नीचे सीमित करते हैं, ताकि grammY OpenClaw के ट्रांसपोर्ट गार्ड और फ़ॉलबैक के चलने से पहले दृश्यमान उत्तर डिलीवरी को निरस्त न करे। लंबी पोलिंग अब भी 45-सेकंड के `getUpdates` अनुरोध गार्ड का उपयोग करती है, ताकि निष्क्रिय पोल अनिश्चित काल तक छोड़े न जाएं।
    - `channels.telegram.pollingStallThresholdMs` का डिफ़ॉल्ट `120000` है; केवल गलत-सकारात्मक पोलिंग-स्टॉल पुनरारंभों के लिए `30000` और `600000` के बीच समायोजित करें।
    - समूह संदर्भ इतिहास `channels.telegram.historyLimit` या `messages.groupChat.historyLimit` (डिफ़ॉल्ट 50) का उपयोग करता है; `0` अक्षम करता है।
    - जब Gateway ने पैरेंट संदेशों को देखा हो, तो reply/quote/forward पूरक संदर्भ को एक चयनित वार्तालाप संदर्भ विंडो में सामान्यीकृत किया जाता है; देखे गए संदेशों का कैश OpenClaw SQLite Plugin स्थिति में रहता है, और `openclaw doctor --fix` पुराने साइडकार आयात करता है। Telegram अपडेट में केवल एक उथला `reply_to_message` शामिल करता है, इसलिए कैश से पुरानी श्रृंखलाएं Telegram के मौजूदा अपडेट पेलोड तक सीमित होती हैं।
    - Telegram allowlist मुख्य रूप से यह नियंत्रित करती हैं कि एजेंट को कौन ट्रिगर कर सकता है, यह पूर्ण पूरक-संदर्भ रिडैक्शन सीमा नहीं है।
    - DM इतिहास नियंत्रण:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` कॉन्फ़िग पुनर्प्राप्ति योग्य आउटबाउंड API त्रुटियों के लिए Telegram भेजने वाले हेल्पर (CLI/tools/actions) पर लागू होता है। इनबाउंड अंतिम-उत्तर डिलीवरी Telegram प्री-कनेक्ट विफलताओं के लिए सीमित सुरक्षित-भेज पुनर्प्रयास का भी उपयोग करती है, लेकिन यह अस्पष्ट पोस्ट-सेंड नेटवर्क एनवेलप का पुनर्प्रयास नहीं करती जो दृश्यमान संदेशों को डुप्लिकेट कर सकते हैं।

    CLI और message-tool भेजने के लक्ष्य संख्यात्मक चैट ID, उपयोगकर्ता नाम, या फ़ोरम टॉपिक लक्ष्य हो सकते हैं:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram पोल `openclaw message poll` का उपयोग करते हैं और फ़ोरम टॉपिक का समर्थन करते हैं:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    केवल-Telegram पोल फ़्लैग:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - फ़ोरम टॉपिक के लिए `--thread-id` (या `:topic:` लक्ष्य का उपयोग करें)

    Telegram भेजना यह भी समर्थन करता है:

    - जब `channels.telegram.capabilities.inlineButtons` इसकी अनुमति देता है, तो इनलाइन कीबोर्ड के लिए `buttons` ब्लॉक के साथ `--presentation`
    - जब bot उस चैट में पिन कर सकता है, तो पिन की गई डिलीवरी का अनुरोध करने के लिए `--pin` या `--delivery '{"pin":true}'`
    - आउटबाउंड छवियों, GIF, और वीडियो को संपीड़ित फोटो, एनिमेटेड-मीडिया, या वीडियो अपलोड के बजाय दस्तावेज़ों के रूप में भेजने के लिए `--force-document`

    कार्रवाई गेटिंग:

    - `channels.telegram.actions.sendMessage=false` पोल सहित आउटबाउंड Telegram संदेशों को अक्षम करता है
    - `channels.telegram.actions.poll=false` नियमित भेजना सक्षम रखते हुए Telegram पोल निर्माण को अक्षम करता है

  </Accordion>

  <Accordion title="Telegram में exec अनुमोदन">
    Telegram अनुमोदक DM में exec अनुमोदन का समर्थन करता है और वैकल्पिक रूप से मूल चैट या टॉपिक में प्रॉम्प्ट पोस्ट कर सकता है। अनुमोदक संख्यात्मक Telegram उपयोगकर्ता ID होने चाहिए।

    कॉन्फ़िग पथ:

    - `channels.telegram.execApprovals.enabled` (जब कम से कम एक अनुमोदक रिज़ॉल्व हो सके तो स्वतः सक्षम होता है)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` से संख्यात्मक स्वामी ID पर वापस जाता है)
    - `channels.telegram.execApprovals.target`: `dm` (डिफ़ॉल्ट) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, और `defaultTo` नियंत्रित करते हैं कि bot से कौन बात कर सकता है और वह सामान्य उत्तर कहां भेजता है। वे किसी को exec अनुमोदक नहीं बनाते। पहली स्वीकृत DM pairing `commands.ownerAllowFrom` को बूटस्ट्रैप करती है जब अभी कोई कमांड स्वामी मौजूद नहीं है, इसलिए एक-स्वामी सेटअप अभी भी `execApprovals.approvers` के तहत ID दोहराए बिना काम करता है।

    चैनल डिलीवरी चैट में कमांड टेक्स्ट दिखाती है; `channel` या `both` को केवल विश्वसनीय समूहों/टॉपिक में सक्षम करें। जब प्रॉम्प्ट किसी फ़ोरम टॉपिक में पहुंचता है, तो OpenClaw अनुमोदन प्रॉम्प्ट और फ़ॉलो-अप के लिए टॉपिक को संरक्षित रखता है। Exec अनुमोदन डिफ़ॉल्ट रूप से 30 मिनट के बाद समाप्त हो जाते हैं।

    इनलाइन अनुमोदन बटन के लिए भी `channels.telegram.capabilities.inlineButtons` को लक्ष्य सतह (`dm`, `group`, या `all`) की अनुमति देनी होगी। `plugin:` से प्रीफ़िक्स किए गए अनुमोदन ID Plugin अनुमोदनों के माध्यम से रिज़ॉल्व होते हैं; अन्य पहले exec अनुमोदनों के माध्यम से रिज़ॉल्व होते हैं।

    [Exec अनुमोदन](/hi/tools/exec-approvals) देखें।

  </Accordion>
</AccordionGroup>

## त्रुटि उत्तर नियंत्रण

जब एजेंट को डिलीवरी या प्रदाता त्रुटि मिलती है, तो त्रुटि नीति नियंत्रित करती है कि त्रुटि संदेश Telegram चैट में भेजे जाएं या नहीं:

| कुंजी                                | मान                        | डिफ़ॉल्ट        | विवरण                                                                                                                                                                                                    |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — हर त्रुटि संदेश चैट में भेजें। `once` — प्रत्येक अद्वितीय त्रुटि संदेश को प्रति कूलडाउन विंडो एक बार भेजें (दोहराई गई समान त्रुटियों को दबाएं)। `silent` — चैट में कभी भी त्रुटि संदेश न भेजें। |
| `channels.telegram.errorCooldownMs` | संख्या (ms)                | `14400000` (4h) | `once` नीति के लिए कूलडाउन विंडो। त्रुटि भेजे जाने के बाद, वही त्रुटि संदेश इस अंतराल के बीतने तक दबा दिया जाता है। आउटेज के दौरान त्रुटि स्पैम को रोकता है।                                      |

प्रति-खाता, प्रति-समूह, और प्रति-टॉपिक ओवरराइड समर्थित हैं (अन्य Telegram कॉन्फ़िग कुंजियों जैसी ही inheritance)।

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## समस्या निवारण

<AccordionGroup>
  <Accordion title="Bot mention के बिना समूह संदेशों का उत्तर नहीं देता">

    - यदि `requireMention=false` है, तो Telegram privacy mode को पूर्ण दृश्यता की अनुमति देनी होगी।
      - BotFather: `/setprivacy` -> Disable
      - फिर bot को समूह से हटाकर फिर से जोड़ें
    - `openclaw channels status` चेतावनी देता है जब कॉन्फ़िग में बिना mention वाले समूह संदेशों की अपेक्षा होती है।
    - `openclaw channels status --probe` स्पष्ट संख्यात्मक समूह ID की जांच कर सकता है; wildcard `"*"` की सदस्यता-प्रोब नहीं की जा सकती।
    - त्वरित सेशन परीक्षण: `/activation always`।

  </Accordion>

  <Accordion title="Bot समूह संदेश बिल्कुल नहीं देख रहा">

    - जब `channels.telegram.groups` मौजूद हो, तो समूह सूचीबद्ध होना चाहिए (या `"*"` शामिल करें)
    - समूह में bot सदस्यता सत्यापित करें
    - skip कारणों के लिए लॉग समीक्षा करें: `openclaw logs --follow`

  </Accordion>

  <Accordion title="कमांड आंशिक रूप से काम करते हैं या बिल्कुल नहीं">

    - अपनी sender identity को अधिकृत करें (pairing और/या संख्यात्मक `allowFrom`)
    - समूह नीति `open` होने पर भी कमांड authorization लागू रहता है
    - `setMyCommands failed` के साथ `BOT_COMMANDS_TOO_MUCH` का मतलब है कि native menu में बहुत अधिक प्रविष्टियां हैं; Plugin/skill/custom कमांड कम करें या native menu अक्षम करें
    - `deleteMyCommands` / `setMyCommands` startup कॉल और `sendChatAction` typing कॉल सीमित हैं और अनुरोध timeout पर Telegram के transport fallback के माध्यम से एक बार पुनर्प्रयास करते हैं। लगातार network/fetch त्रुटियां आमतौर पर `api.telegram.org` तक DNS/HTTPS पहुंच संबंधी समस्याएं दर्शाती हैं

  </Accordion>

  <Accordion title="Startup unauthorized token रिपोर्ट करता है">

    - `getMe returned 401` कॉन्फ़िगर किए गए bot token के लिए Telegram प्रमाणीकरण विफलता है।
    - BotFather में bot token फिर से कॉपी या regenerate करें, फिर डिफ़ॉल्ट खाते के लिए `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, या `TELEGRAM_BOT_TOKEN` अपडेट करें।
    - startup के दौरान `deleteWebhook 401 Unauthorized` भी auth विफलता है; इसे "कोई webhook मौजूद नहीं है" के रूप में मानना उसी खराब-token विफलता को बाद के API कॉल तक टाल देगा।

  </Accordion>

  <Accordion title="Polling या network अस्थिरता">

    - Node 22+ + custom fetch/proxy AbortSignal प्रकार mismatch होने पर तत्काल abort व्यवहार ट्रिगर कर सकते हैं।
    - कुछ hosts `api.telegram.org` को पहले IPv6 पर resolve करते हैं; टूटा हुआ IPv6 egress बीच-बीच में Telegram API विफलताएं पैदा कर सकता है।
    - यदि logs में `TypeError: fetch failed` या `Network request for 'getUpdates' failed!` शामिल है, तो OpenClaw अब इन्हें recoverable network errors के रूप में पुनर्प्रयास करता है।
    - polling startup के दौरान, OpenClaw grammY के लिए सफल startup `getMe` probe का पुनः उपयोग करता है ताकि runner को पहले `getUpdates` से पहले दूसरे `getMe` की आवश्यकता न हो।
    - यदि polling startup के दौरान `deleteWebhook` transient network error के साथ विफल होता है, तो OpenClaw एक और pre-poll control-plane call करने के बजाय long polling में जारी रहता है। अभी भी सक्रिय webhook `getUpdates` conflict के रूप में सामने आता है; OpenClaw फिर Telegram transport को फिर से बनाता है और webhook cleanup का पुनर्प्रयास करता है।
    - यदि Telegram sockets छोटे fixed cadence पर recycle होते हैं, तो कम `channels.telegram.timeoutSeconds` जांचें; bot clients configured values को outbound और `getUpdates` request guards के नीचे clamp करते हैं, लेकिन पुराने releases हर poll या reply को abort कर सकते थे जब इसे उन guards से नीचे set किया गया था।
    - यदि logs में `Polling stall detected` शामिल है, तो OpenClaw डिफ़ॉल्ट रूप से पूरे हुए long-poll liveness के बिना 120 seconds के बाद polling को restart करता है और Telegram transport को फिर से बनाता है।
    - `openclaw channels status --probe` और `openclaw doctor` चेतावनी देते हैं जब running polling account ने startup grace के बाद `getUpdates` पूरा नहीं किया है, जब running webhook account ने startup grace के बाद `setWebhook` पूरा नहीं किया है, या जब अंतिम सफल polling transport activity stale है।
    - `channels.telegram.pollingStallThresholdMs` केवल तब बढ़ाएं जब लंबे समय तक चलने वाली `getUpdates` calls healthy हों लेकिन आपका host फिर भी false polling-stall restarts रिपोर्ट करता हो। लगातार stalls आमतौर पर host और `api.telegram.org` के बीच proxy, DNS, IPv6, या TLS egress समस्याओं की ओर इशारा करते हैं।
    - Telegram Bot API transport के लिए process proxy env का भी सम्मान करता है, जिसमें `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, और उनके lowercase variants शामिल हैं। `NO_PROXY` / `no_proxy` अब भी `api.telegram.org` को bypass कर सकते हैं।
    - यदि OpenClaw managed proxy किसी service environment के लिए `OPENCLAW_PROXY_URL` के माध्यम से configured है और कोई standard proxy env मौजूद नहीं है, तो Telegram भी Bot API transport के लिए वही URL उपयोग करता है।
    - unstable direct egress/TLS वाले VPS hosts पर, Telegram API calls को `channels.telegram.proxy` के माध्यम से route करें:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ डिफ़ॉल्ट रूप से `autoSelectFamily=true` होता है (WSL2 को छोड़कर)। Telegram DNS परिणाम क्रम पहले `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER` का सम्मान करता है, फिर `channels.telegram.network.dnsResultOrder`, फिर प्रक्रिया डिफ़ॉल्ट जैसे `NODE_OPTIONS=--dns-result-order=ipv4first`; यदि कोई लागू नहीं होता, तो Node 22+ `ipv4first` पर वापस चला जाता है।
    - यदि आपका होस्ट WSL2 है या स्पष्ट रूप से केवल-IPv4 व्यवहार के साथ बेहतर काम करता है, तो family चयन बाध्य करें:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 बेंचमार्क-रेंज उत्तर (`198.18.0.0/15`) डिफ़ॉल्ट रूप से Telegram मीडिया डाउनलोड के लिए पहले से अनुमत हैं। यदि कोई विश्वसनीय fake-IP या
      पारदर्शी प्रॉक्सी मीडिया डाउनलोड के दौरान `api.telegram.org` को किसी अन्य
      निजी/internal/special-use पते पर फिर से लिखता है, तो आप केवल-Telegram bypass में opt in कर सकते हैं:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - यही opt-in प्रति खाते पर भी उपलब्ध है
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` पर।
    - यदि आपका प्रॉक्सी Telegram मीडिया होस्ट को `198.18.x.x` में resolve करता है, तो पहले
      dangerous flag बंद रखें। Telegram मीडिया पहले से ही RFC 2544
      बेंचमार्क रेंज को डिफ़ॉल्ट रूप से अनुमति देता है।

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` Telegram
      मीडिया SSRF सुरक्षाओं को कमजोर करता है। इसे केवल विश्वसनीय operator-controlled proxy
      environments जैसे Clash, Mihomo, या Surge fake-IP routing के लिए उपयोग करें, जब वे
      RFC 2544 benchmark range से बाहर private या special-use answers synthesize करते हैं।
      सामान्य public internet Telegram access के लिए इसे बंद रखें।
    </Warning>

    - Environment overrides (अस्थायी):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS answers सत्यापित करें:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

अधिक सहायता: [Channel troubleshooting](/hi/channels/troubleshooting).

## Configuration reference

प्राथमिक संदर्भ: [Configuration reference - Telegram](/hi/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` को regular file की ओर इंगित करना चाहिए; symlinks अस्वीकार किए जाते हैं)
- access control: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- topic defaults: `groups.<chatId>.topics."*"` unmatched forum topics पर लागू होता है; exact topic IDs इसे override करते हैं
- exec approvals: `execApprovals`, `accounts.*.execApprovals`
- command/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`
- streaming: `streaming` (preview), `streaming.preview.toolProgress`, `blockStreaming`
- formatting/delivery: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- media/network: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- custom API root: `apiRoot` (केवल Bot API root; `/bot<TOKEN>` शामिल न करें)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- errors: `errorPolicy`, `errorCooldownMs`
- writes/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Multi-account precedence: जब दो या अधिक account IDs configured हों, default routing को explicit बनाने के लिए `channels.telegram.defaultAccount` सेट करें (या `channels.telegram.accounts.default` शामिल करें)। अन्यथा OpenClaw पहले normalized account ID पर वापस जाता है और `openclaw doctor` चेतावनी देता है। Named accounts `channels.telegram.allowFrom` / `groupAllowFrom` inherit करते हैं, लेकिन `accounts.default.*` values नहीं।
</Note>

## Related

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Telegram user को gateway से pair करें।
  </Card>
  <Card title="Groups" icon="users" href="/hi/channels/groups">
    Group और topic allowlist behavior।
  </Card>
  <Card title="Channel routing" icon="route" href="/hi/channels/channel-routing">
    Inbound messages को agents तक route करें।
  </Card>
  <Card title="Security" icon="shield" href="/hi/gateway/security">
    Threat model और hardening।
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/hi/concepts/multi-agent">
    Groups और topics को agents से map करें।
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/hi/channels/troubleshooting">
    Cross-channel diagnostics।
  </Card>
</CardGroup>
