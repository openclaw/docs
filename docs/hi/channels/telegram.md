---
read_when:
    - Telegram सुविधाओं या Webhook पर काम करना
summary: Telegram बॉट समर्थन स्थिति, क्षमताएं, और कॉन्फ़िगरेशन
title: Telegram
x-i18n:
    generated_at: "2026-06-30T13:58:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e143096bbcdf949ef11566ffe2a5360eea261cd5bf99f0cf90d31c8e9d4637d6
    source_path: channels/telegram.md
    workflow: 16
---

Telegram bot DM और groups के लिए grammY के जरिए production-ready. Long polling डिफ़ॉल्ट mode है; webhook mode वैकल्पिक है.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Telegram के लिए डिफ़ॉल्ट DM policy pairing है.
  </Card>
  <Card title="Channel समस्या निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    Cross-channel diagnostics और repair playbooks.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/hi/gateway/configuration">
    पूरे channel config patterns और examples.
  </Card>
</CardGroup>

## त्वरित setup

<Steps>
  <Step title="BotFather में bot token बनाएं">
    Telegram खोलें और **@BotFather** से chat करें (पुष्टि करें कि handle ठीक `@BotFather` ही है).

    `/newbot` चलाएं, prompts follow करें, और token save करें.

  </Step>

  <Step title="Token और DM policy configure करें">

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

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (केवल default account).
    Telegram `openclaw channels login telegram` का उपयोग **नहीं** करता; config/env में token configure करें, फिर gateway start करें.

  </Step>

  <Step title="Gateway start करें और पहला DM approve करें">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing codes 1 घंटे के बाद expire हो जाते हैं.

  </Step>

  <Step title="Bot को group में जोड़ें">
    Bot को अपने group में जोड़ें, फिर group access के लिए जरूरी दोनों IDs लें:

    - आपका Telegram user ID, जो `allowFrom` / `groupAllowFrom` में उपयोग होता है
    - Telegram group chat ID, जो `channels.telegram.groups` के तहत key के रूप में उपयोग होता है

    पहली बार setup के लिए, group chat ID `openclaw logs --follow`, किसी forwarded-ID bot, या Bot API `getUpdates` से लें. Group allow होने के बाद, `/whoami@<bot_username>` user और group IDs confirm कर सकता है.

    `-100` से शुरू होने वाले negative Telegram supergroup IDs group chat IDs हैं. इन्हें `channels.telegram.groups` के तहत रखें, `groupAllowFrom` के तहत नहीं.

  </Step>
</Steps>

<Note>
Token resolution order account-aware है. व्यवहार में, config values env fallback से आगे रहती हैं, और `TELEGRAM_BOT_TOKEN` केवल default account पर लागू होता है.
Successful startup के बाद, OpenClaw bot identity को state directory में 24 घंटे तक cache करता है ताकि restarts extra Telegram `getMe` call से बच सकें; token बदलने या हटाने पर वह cache clear हो जाता है.
</Note>

## Telegram side settings

<AccordionGroup>
  <Accordion title="Privacy mode और group visibility">
    Telegram bots डिफ़ॉल्ट रूप से **Privacy Mode** पर होते हैं, जो उन्हें मिलने वाले group messages को सीमित करता है.

    अगर bot को सभी group messages देखने हैं, तो इनमें से एक करें:

    - `/setprivacy` के जरिए privacy mode disable करें, या
    - bot को group admin बनाएं.

    Privacy mode toggle करते समय, हर group में bot को remove + re-add करें ताकि Telegram change लागू करे.

  </Accordion>

  <Accordion title="Group permissions">
    Admin status Telegram group settings में control होता है.

    Admin bots सभी group messages receive करते हैं, जो always-on group behavior के लिए उपयोगी है.

  </Accordion>

  <Accordion title="उपयोगी BotFather toggles">

    - `/setjoingroups` group adds allow/deny करने के लिए
    - `/setprivacy` group visibility behavior के लिए

  </Accordion>
</AccordionGroup>

## Access control और activation

### Group bot identity

Telegram groups और forum topics में, configured bot handle का explicit mention (उदाहरण के लिए `@my_bot`) selected OpenClaw agent को address करना माना जाता है, भले ही agent persona name Telegram username से अलग हो. Group silence policy असंबंधित group traffic पर अब भी लागू होती है, लेकिन bot handle को खुद "someone else" नहीं माना जाता.

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` direct message access control करता है:

    - `pairing` (default)
    - `allowlist` (`allowFrom` में कम से कम एक sender ID चाहिए)
    - `open` (`allowFrom` में `"*"` शामिल होना चाहिए)
    - `disabled`

    `allowFrom: ["*"]` के साथ `dmPolicy: "open"` किसी भी Telegram account को, जो bot username ढूंढता या guess करता है, bot को command देने देता है. इसे केवल tightly restricted tools वाले जानबूझकर public bots के लिए इस्तेमाल करें; one-owner bots को numeric user IDs के साथ `allowlist` इस्तेमाल करना चाहिए.

    `channels.telegram.allowFrom` numeric Telegram user IDs स्वीकार करता है. `telegram:` / `tg:` prefixes स्वीकार और normalize किए जाते हैं.
    Multi-account configs में, restrictive top-level `channels.telegram.allowFrom` को safety boundary माना जाता है: account-level `allowFrom: ["*"]` entries उस account को public नहीं बनातीं, जब तक merged होने के बाद effective account allowlist में explicit wildcard अब भी न हो.
    Empty `allowFrom` के साथ `dmPolicy: "allowlist"` सभी DMs block करता है और config validation द्वारा reject होता है.
    Setup केवल numeric user IDs मांगता है.
    अगर आपने upgrade किया है और आपकी config में `@username` allowlist entries हैं, तो उन्हें resolve करने के लिए `openclaw doctor --fix` चलाएं (best-effort; Telegram bot token चाहिए).
    अगर आप पहले pairing-store allowlist files पर निर्भर थे, तो `openclaw doctor --fix` allowlist flows में entries को `channels.telegram.allowFrom` में recover कर सकता है (उदाहरण के लिए जब `dmPolicy: "allowlist"` में अभी explicit IDs न हों).

    One-owner bots के लिए, access policy को config में durable रखने के लिए explicit numeric `allowFrom` IDs के साथ `dmPolicy: "allowlist"` prefer करें (previous pairing approvals पर निर्भर रहने के बजाय).

    Common confusion: DM pairing approval का मतलब "यह sender हर जगह authorized है" नहीं है.
    Pairing DM access grant करता है. अगर अभी कोई command owner मौजूद नहीं है, तो first approved pairing `commands.ownerAllowFrom` भी set करता है ताकि owner-only commands और exec approvals के पास explicit operator account हो.
    Group sender authorization अब भी explicit config allowlists से आता है.
    अगर आप चाहते हैं "मैं एक बार authorized हूं और DMs तथा group commands दोनों काम करें", तो अपना numeric Telegram user ID `channels.telegram.allowFrom` में डालें; owner-only commands के लिए, सुनिश्चित करें कि `commands.ownerAllowFrom` में `telegram:<your user id>` शामिल है.

    ### अपना Telegram user ID ढूंढना

    ज्यादा सुरक्षित (third-party bot नहीं):

    1. अपने bot को DM करें.
    2. `openclaw logs --follow` चलाएं.
    3. `from.id` पढ़ें.

    Official Bot API method:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Third-party method (कम private): `@userinfobot` या `@getidsbot`.

  </Tab>

  <Tab title="Group policy और allowlists">
    दो controls साथ में लागू होते हैं:

    1. **कौन से groups allowed हैं** (`channels.telegram.groups`)
       - कोई `groups` config नहीं:
         - `groupPolicy: "open"` के साथ: कोई भी group group-ID checks pass कर सकता है
         - `groupPolicy: "allowlist"` (default) के साथ: groups तब तक blocked रहते हैं जब तक आप `groups` entries (या `"*"`) add नहीं करते
       - `groups` configured: allowlist की तरह काम करता है (explicit IDs या `"*"`)

    2. **Groups में कौन से senders allowed हैं** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` group sender filtering के लिए उपयोग होता है. अगर set नहीं है, तो Telegram `allowFrom` पर fall back करता है.
    `groupAllowFrom` entries numeric Telegram user IDs होनी चाहिए (`telegram:` / `tg:` prefixes normalize किए जाते हैं).
    Telegram group या supergroup chat IDs को `groupAllowFrom` में न डालें. Negative chat IDs `channels.telegram.groups` के तहत आते हैं.
    Non-numeric entries sender authorization के लिए ignored होती हैं.
    Security boundary (`2026.2.25+`): group sender auth DM pairing-store approvals inherit **नहीं** करता.
    Pairing DM-only रहता है. Groups के लिए, `groupAllowFrom` या per-group/per-topic `allowFrom` set करें.
    अगर `groupAllowFrom` unset है, तो Telegram config `allowFrom` पर fall back करता है, pairing store पर नहीं.
    One-owner bots के लिए practical pattern: अपना user ID `channels.telegram.allowFrom` में set करें, `groupAllowFrom` unset छोड़ें, और target groups को `channels.telegram.groups` के तहत allow करें.
    Runtime note: अगर `channels.telegram` पूरी तरह missing है, तो runtime fail-closed `groupPolicy="allowlist"` पर default करता है, जब तक `channels.defaults.groupPolicy` explicitly set न हो.

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

    इसे group से `@<bot_username> ping` के साथ test करें. `requireMention: true` रहते plain group messages bot को trigger नहीं करते.

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
      Common mistake: `groupAllowFrom` Telegram group allowlist नहीं है.

      - Negative Telegram group या supergroup chat IDs जैसे `-1001234567890` को `channels.telegram.groups` के तहत रखें.
      - जब आप limit करना चाहते हैं कि allowed group के अंदर कौन लोग bot को trigger कर सकते हैं, तो Telegram user IDs जैसे `8734062810` को `groupAllowFrom` के तहत रखें.
      - `groupAllowFrom: ["*"]` केवल तब इस्तेमाल करें जब आप चाहते हैं कि allowed group का कोई भी member bot से बात कर सके.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Group replies में default रूप से mention चाहिए.

    Mention इनसे आ सकता है:

    - native `@botusername` mention, या
    - इनमें mention patterns:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Session-level command toggles:

    - `/activation always`
    - `/activation mention`

    ये केवल session state update करते हैं. Persistence के लिए config इस्तेमाल करें.

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

    Group history context default रूप से `mention-only` होता है: prior group messages
    केवल तब शामिल होते हैं जब वे bot को addressed थे, bot को replies थे,
    या bot के अपने messages थे. Trusted groups के लिए recent room history
    शामिल करने के लिए `includeGroupHistoryContext: "recent"` set करें. Next turn के साथ
    कोई prior Telegram group history न भेजने के लिए
    `includeGroupHistoryContext: "none"` set करें.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Group chat ID लेना:

    - group message को `@userinfobot` / `@getidsbot` पर forward करें
    - या `openclaw logs --follow` से `chat.id` पढ़ें
    - या Bot API `getUpdates` inspect करें
    - group allow होने के बाद, native commands enabled हों तो `/whoami@<bot_username>` चलाएं

  </Tab>
</Tabs>

## Runtime behavior

- Telegram का स्वामित्व Gateway प्रक्रिया के पास होता है।
- रूटिंग निर्धारक है: Telegram इनबाउंड जवाब Telegram पर ही वापस जाते हैं (मॉडल चैनल नहीं चुनता)।
- इनबाउंड संदेश साझा चैनल एनवेलप में सामान्यीकृत होते हैं, जिनमें जवाब मेटाडेटा, मीडिया प्लेसहोल्डर, और Gateway द्वारा देखे गए Telegram जवाबों के लिए स्थायी जवाब-श्रृंखला संदर्भ शामिल होता है।
- समूह सत्र समूह ID के आधार पर अलग रखे जाते हैं। फ़ोरम टॉपिक अलग रखने के लिए `:topic:<threadId>` जोड़ते हैं।
- DM संदेश `message_thread_id` ले जा सकते हैं; OpenClaw जवाबों के लिए इसे सुरक्षित रखता है। DM टॉपिक सत्र केवल तब अलग होते हैं जब Telegram `getMe` बॉट के लिए `has_topics_enabled: true` रिपोर्ट करता है; अन्यथा DM सपाट सत्र पर ही रहते हैं।
- लॉन्ग पोलिंग प्रति-चैट/प्रति-थ्रेड अनुक्रमण के साथ grammY runner का उपयोग करती है। कुल runner sink concurrency `agents.defaults.maxConcurrent` का उपयोग करती है।
- मल्टी-अकाउंट स्टार्टअप समवर्ती Telegram `getMe` probes को सीमित करता है ताकि बड़े बॉट समूह हर अकाउंट probe को एक साथ न फैलाएँ।
- प्रत्येक Gateway प्रक्रिया के भीतर लॉन्ग पोलिंग सुरक्षित रहती है ताकि एक समय में केवल एक सक्रिय poller बॉट token का उपयोग कर सके। अगर आपको फिर भी `getUpdates` 409 conflicts दिखते हैं, तो संभव है कि कोई दूसरा OpenClaw Gateway, script, या बाहरी poller उसी token का उपयोग कर रहा हो।
- लॉन्ग-पोलिंग watchdog restart डिफ़ॉल्ट रूप से 120 सेकंड तक पूर्ण `getUpdates` liveness न मिलने पर trigger होते हैं। `channels.telegram.pollingStallThresholdMs` केवल तब बढ़ाएँ जब आपका deployment लंबे समय तक चलने वाले काम के दौरान अब भी गलत polling-stall restarts देखता हो। मान milliseconds में है और `30000` से `600000` तक अनुमति है; प्रति-अकाउंट overrides समर्थित हैं।
- Telegram Bot API में read-receipt समर्थन नहीं है (`sendReadReceipts` लागू नहीं होता)।

<Note>
  `channels.telegram.dm.threadReplies` और `channels.telegram.direct.<chatId>.threadReplies` हटा दिए गए थे। अगर upgrade के बाद आपके config में ये keys अब भी हैं, तो `openclaw doctor --fix` चलाएँ। DM topic routing अब Telegram `getMe.has_topics_enabled` से मिली bot capability का अनुसरण करती है, जिसे BotFather threaded mode नियंत्रित करता है: topics-enabled bots तब thread-scoped DM sessions उपयोग करते हैं जब Telegram `message_thread_id` भेजता है; अन्य DM सपाट session पर ही रहते हैं।
</Note>

## फ़ीचर संदर्भ

<AccordionGroup>
  <Accordion title="लाइव स्ट्रीम पूर्वावलोकन (संदेश संपादन)">
    OpenClaw वास्तविक समय में आंशिक जवाब stream कर सकता है:

    - सीधे chats: preview message + `editMessageText`
    - groups/topics: preview message + `editMessageText`

    आवश्यकता:

    - `channels.telegram.streaming` `off | partial | block | progress` है (डिफ़ॉल्ट: `partial`)
    - छोटे शुरुआती answer previews debounce किए जाते हैं, फिर अगर run अब भी active है तो bounded delay के बाद materialize किए जाते हैं
    - `progress` tool progress के लिए एक editable status draft रखता है, tool progress से पहले answer activity आने पर stable status label दिखाता है, completion पर उसे clear करता है, और final answer को normal message के रूप में भेजता है
    - `streaming.preview.toolProgress` नियंत्रित करता है कि tool/progress updates उसी edited preview message को reuse करें या नहीं (डिफ़ॉल्ट: जब preview streaming active हो तो `true`)
    - `streaming.preview.commandText` उन tool-progress lines में command/exec detail नियंत्रित करता है: `raw` (डिफ़ॉल्ट, released behavior सुरक्षित रखता है) या `status` (केवल tool label)
    - `streaming.progress.commentary` (डिफ़ॉल्ट: `false`) temporary progress draft में assistant commentary/preamble text को opt in करता है
    - legacy `channels.telegram.streamMode`, boolean `streaming` values, और retired native draft preview keys detect किए जाते हैं; उन्हें current streaming config में migrate करने के लिए `openclaw doctor --fix` चलाएँ

    Tool-progress preview updates वे छोटे status lines हैं जो tools चलने के दौरान दिखती हैं, जैसे command execution, file reads, planning updates, patch summaries, या Codex app-server mode में Codex preamble/commentary text। Telegram इन्हें डिफ़ॉल्ट रूप से enabled रखता है ताकि `v2026.4.22` और उसके बाद के released OpenClaw behavior से मेल रहे।

    answer text के लिए edited preview बनाए रखते हुए tool-progress lines छिपाने के लिए, set करें:

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

    tool-progress visible रखते हुए command/exec text छिपाने के लिए, set करें:

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

    जब आप final answer को उसी message में edit किए बिना visible tool progress चाहते हों, तो `progress` mode का उपयोग करें। command-text policy को `streaming.progress` के अंतर्गत रखें:

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

    `streaming.mode: "off"` केवल तब उपयोग करें जब आप केवल-final delivery चाहते हों: Telegram preview edits disabled होते हैं और generic tool/progress chatter को standalone status messages के रूप में भेजने के बजाय suppress किया जाता है। Approval prompts, media payloads, और errors अब भी normal final delivery से route होते हैं। जब आप tool-progress status lines छिपाते हुए केवल answer preview edits रखना चाहते हों, तो `streaming.preview.toolProgress: false` उपयोग करें।

    <Note>
      Telegram selected quote replies अपवाद हैं। जब `replyToMode` `"first"`, `"all"`, या `"batched"` हो और inbound message में selected quote text शामिल हो, तो OpenClaw answer preview edit करने के बजाय Telegram के native quote-reply path से final answer भेजता है, इसलिए `streaming.preview.toolProgress` उस turn के लिए छोटे status lines नहीं दिखा सकता। selected quote text के बिना current-message replies अब भी preview streaming रखते हैं। जब tool-progress visibility native quote replies से अधिक महत्वपूर्ण हो तो `replyToMode: "off"` set करें, या trade-off स्वीकार करने के लिए `streaming.preview.toolProgress: false` set करें।
    </Note>

    केवल-text replies के लिए:

    - छोटे DM/group/topic previews: OpenClaw वही preview message रखता है और final edit उसी जगह करता है
    - लंबे text finals जो कई Telegram messages में split होते हैं, जहाँ संभव हो वहाँ existing preview को पहले final chunk के रूप में reuse करते हैं, फिर केवल remaining chunks भेजते हैं
    - progress-mode finals status draft clear करते हैं और draft को answer में edit करने के बजाय normal final delivery उपयोग करते हैं
    - अगर completed text confirm होने से पहले final edit fail हो जाए, तो OpenClaw normal final delivery उपयोग करता है और stale preview साफ करता है

    complex replies (जैसे media payloads) के लिए, OpenClaw normal final delivery पर fallback करता है और फिर preview message साफ करता है।

    Preview streaming block streaming से अलग है। जब Telegram के लिए block streaming स्पष्ट रूप से enabled हो, तो OpenClaw double-streaming से बचने के लिए preview stream छोड़ देता है।

    Reasoning stream behavior:

    - `/reasoning stream` समर्थित channel के reasoning-preview path का उपयोग करता है; Telegram पर, generation के दौरान यह reasoning को live preview में stream करता है
    - final delivery के बाद reasoning preview delete कर दिया जाता है; जब reasoning visible रहनी चाहिए तो `/reasoning on` उपयोग करें
    - final answer reasoning text के बिना भेजा जाता है

  </Accordion>

  <Accordion title="समृद्ध संदेश फ़ॉर्मैटिंग">
    Outbound text डिफ़ॉल्ट रूप से standard Telegram HTML messages का उपयोग करता है ताकि वर्तमान Telegram clients में replies readable रहें। यह compatibility mode सामान्य bold, italic, links, code, spoilers, और quotes का समर्थन करता है, लेकिन Bot API 10.1 rich-only blocks जैसे native tables, details, rich media, और formulas का नहीं।

    Bot API 10.1 rich messages opt into करने के लिए `channels.telegram.richMessages: true` set करें:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    enabled होने पर:

    - agent को बताया जाता है कि इस bot/account के लिए Telegram rich messages उपलब्ध हैं।
    - Markdown text OpenClaw के Markdown IR से render किया जाता है और Telegram rich HTML के रूप में भेजा जाता है।
    - Explicit rich HTML payloads supported Bot API 10.1 tags जैसे headings, tables, details, rich media, और formulas को सुरक्षित रखते हैं।
    - Media captions अब भी Telegram HTML captions का उपयोग करते हैं क्योंकि rich messages captions को replace नहीं करते।

    यह model text को Telegram Rich Markdown sigils से दूर रखता है, इसलिए `$400-600K` जैसी currency math के रूप में parse नहीं होती। Long rich text Telegram की rich text और rich block limits के अनुसार अपने आप split होता है। Telegram की column limit से बड़े tables code blocks के रूप में भेजे जाते हैं।

    डिफ़ॉल्ट: client compatibility के लिए off। Rich messages के लिए compatible Telegram clients चाहिए; कुछ current Desktop, Web, Android, और third-party clients accepted rich messages को unsupported के रूप में display करते हैं। इस option को disabled रखें जब तक bot के साथ उपयोग होने वाला हर client इन्हें render न कर सके। `/status` दिखाता है कि current Telegram session में rich messages on हैं या off।

    Link previews डिफ़ॉल्ट रूप से enabled हैं। `channels.telegram.linkPreview: false` rich text के लिए automatic entity detection skip करता है।

  </Accordion>

  <Accordion title="Native commands और custom commands">
    Telegram command menu registration startup पर `setMyCommands` से handle होता है।

    Native command defaults:

    - `commands.native: "auto"` Telegram के लिए native commands enable करता है

    custom command menu entries जोड़ें:

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

    - names normalize किए जाते हैं (leading `/` हटाएँ, lowercase)
    - valid pattern: `a-z`, `0-9`, `_`, length `1..32`
    - custom commands native commands को override नहीं कर सकते
    - conflicts/duplicates skip और log किए जाते हैं

    Notes:

    - custom commands केवल menu entries हैं; वे behavior अपने आप implement नहीं करते
    - plugin/skill commands typed होने पर अब भी काम कर सकते हैं, भले ही Telegram menu में न दिखें

    अगर native commands disabled हैं, built-ins हटा दिए जाते हैं। Custom/plugin commands configured होने पर अब भी register हो सकते हैं।

    आम setup failures:

    - `BOT_COMMANDS_TOO_MUCH` के साथ `setMyCommands failed` का मतलब है कि trimming के बाद भी Telegram menu overflow हुआ; plugin/skill/custom commands घटाएँ या `channels.telegram.commands.native` disable करें।
    - direct Bot API curl commands काम करने के बावजूद `deleteWebhook`, `deleteMyCommands`, या `setMyCommands` का `404: Not Found` के साथ fail होना यह मतलब हो सकता है कि `channels.telegram.apiRoot` full `/bot<TOKEN>` endpoint पर set था। `apiRoot` केवल Bot API root होना चाहिए, और `openclaw doctor --fix` accidental trailing `/bot<TOKEN>` हटाता है।
    - `getMe returned 401` का मतलब है कि Telegram ने configured bot token reject कर दिया। current BotFather token के साथ `botToken`, `tokenFile`, या `TELEGRAM_BOT_TOKEN` update करें; OpenClaw polling से पहले रुकता है, इसलिए इसे webhook cleanup failure के रूप में report नहीं किया जाता।
    - network/fetch errors के साथ `setMyCommands failed` का सामान्य मतलब है कि `api.telegram.org` तक outbound DNS/HTTPS blocked है।

    ### Device pairing commands (`device-pair` plugin)

    जब `device-pair` plugin installed हो:

    1. `/pair` setup code generate करता है
    2. code को iOS app में paste करें
    3. `/pair pending` pending requests list करता है (role/scopes सहित)
    4. request approve करें:
       - explicit approval के लिए `/pair approve <requestId>`
       - जब केवल एक pending request हो तो `/pair approve`
       - सबसे recent के लिए `/pair approve latest`

    setup code एक short-lived bootstrap token रखता है। Built-in setup-code bootstrap केवल Node है: पहला connect pending node request बनाता है, और approval के बाद Gateway `scopes: []` के साथ durable node token लौटाता है। यह handed-off operator token नहीं लौटाता; operator access के लिए अलग approved operator pairing या token flow चाहिए।

    अगर कोई device बदले हुए auth details (जैसे role/scopes/public key) के साथ retry करता है, तो पिछली pending request supersede हो जाती है और नई request अलग `requestId` उपयोग करती है। approve करने से पहले `/pair pending` फिर से चलाएँ।

    अधिक विवरण: [पेयरिंग](/hi/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    स्कोप:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (डिफ़ॉल्ट)

    पुराने `capabilities: ["inlineButtons"]` को `inlineButtons: "all"` से मैप किया जाता है।

    संदेश कार्रवाई उदाहरण:

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

    Callback क्लिक एजेंट को टेक्स्ट के रूप में पास किए जाते हैं:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="एजेंट और ऑटोमेशन के लिए Telegram संदेश कार्रवाइयां">
    Telegram टूल कार्रवाइयों में शामिल हैं:

    - `sendMessage` (`to`, `content`, वैकल्पिक `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` या `caption`, वैकल्पिक `presentation` इनलाइन बटन; केवल-बटन संपादन reply markup अपडेट करते हैं)
    - `createForumTopic` (`chatId`, `name`, वैकल्पिक `iconColor`, `iconCustomEmojiId`)

    चैनल संदेश कार्रवाइयां सुविधाजनक उपनाम (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`) प्रदर्शित करती हैं।

    गेटिंग नियंत्रण:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (डिफ़ॉल्ट: अक्षम)

    नोट: `edit` और `topic-create` वर्तमान में डिफ़ॉल्ट रूप से सक्षम हैं और इनके लिए अलग `channels.telegram.actions.*` टॉगल नहीं हैं।
    रनटाइम भेजे जाने में सक्रिय कॉन्फ़िग/सीक्रेट्स स्नैपशॉट (स्टार्टअप/रीलोड) का उपयोग होता है, इसलिए कार्रवाई पाथ हर भेजने पर तदर्थ SecretRef को फिर से रिज़ॉल्व नहीं करते।

    प्रतिक्रिया हटाने की semantics: [/tools/reactions](/hi/tools/reactions)

  </Accordion>

  <Accordion title="रिप्लाई थ्रेडिंग टैग">
    Telegram जनरेट किए गए आउटपुट में स्पष्ट रिप्लाई थ्रेडिंग टैग का समर्थन करता है:

    - `[[reply_to_current]]` ट्रिगर करने वाले संदेश का उत्तर देता है
    - `[[reply_to:<id>]]` किसी विशिष्ट Telegram संदेश ID का उत्तर देता है

    `channels.telegram.replyToMode` हैंडलिंग नियंत्रित करता है:

    - `off` (डिफ़ॉल्ट)
    - `first`
    - `all`

    जब रिप्लाई थ्रेडिंग सक्षम होती है और मूल Telegram टेक्स्ट या कैप्शन उपलब्ध होता है, OpenClaw अपने-आप मूल Telegram quote अंश शामिल करता है। Telegram मूल quote टेक्स्ट को 1024 UTF-16 कोड यूनिट तक सीमित करता है, इसलिए लंबे संदेश शुरुआत से quote किए जाते हैं और अगर Telegram quote को अस्वीकार करता है तो plain reply पर वापस चले जाते हैं।

    नोट: `off` implicit रिप्लाई थ्रेडिंग को अक्षम करता है। स्पष्ट `[[reply_to_*]]` टैग फिर भी मान्य रहते हैं।

  </Accordion>

  <Accordion title="Forum विषय और थ्रेड व्यवहार">
    Forum supergroups:

    - विषय session keys में `:topic:<threadId>` जोड़ा जाता है
    - रिप्लाई और टाइपिंग विषय थ्रेड को लक्षित करते हैं
    - विषय कॉन्फ़िग पाथ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    सामान्य विषय (`threadId=1`) विशेष-केस:

    - संदेश भेजने में `message_thread_id` छोड़ा जाता है (Telegram `sendMessage(...thread_id=1)` को अस्वीकार करता है)
    - टाइपिंग कार्रवाइयों में फिर भी `message_thread_id` शामिल होता है

    विषय इनहेरिटेंस: विषय एंट्री समूह सेटिंग्स को इनहेरिट करती हैं जब तक ओवरराइड न किया जाए (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)।
    `agentId` केवल-विषय है और समूह डिफ़ॉल्ट से इनहेरिट नहीं करता।
    `topics."*"` उस समूह के हर विषय के लिए डिफ़ॉल्ट सेट करता है; सटीक विषय IDs फिर भी `"*"` पर प्राथमिकता रखते हैं।

    **प्रति-विषय एजेंट रूटिंग**: हर विषय, विषय कॉन्फ़िग में `agentId` सेट करके किसी अलग एजेंट पर रूट हो सकता है। इससे हर विषय को अपना अलग isolated workspace, memory, और session मिलता है। उदाहरण:

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

    फिर हर विषय की अपनी session key होती है: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistent ACP विषय binding**: Forum विषय top-level typed ACP bindings (`bindings[]` with `type: "acp"` and `match.channel: "telegram"`, `peer.kind: "group"`, and a topic-qualified id like `-1001234567890:topic:42`) के माध्यम से ACP harness sessions को पिन कर सकते हैं। वर्तमान में groups/supergroups में forum विषयों तक सीमित। [ACP Agents](/hi/tools/acp-agents) देखें।

    **चैट से थ्रेड-बाउंड ACP spawn**: `/acp spawn <agent> --thread here|auto` वर्तमान विषय को नए ACP session से bind करता है; follow-ups सीधे वहां route होते हैं। OpenClaw spawn confirmation को in-topic pin करता है। `channels.telegram.threadBindings.spawnSessions` enabled रहना आवश्यक है (डिफ़ॉल्ट: `true`)।

    Template context `MessageThreadId` और `IsForum` प्रदर्शित करता है। `message_thread_id` वाली DM chats reply metadata बनाए रखती हैं; वे thread-aware session keys केवल तब उपयोग करती हैं जब Telegram `getMe` bot के लिए `has_topics_enabled: true` रिपोर्ट करता है।
    पुराने `dm.threadReplies` और `direct.*.threadReplies` overrides जानबूझकर हटाए गए हैं; BotFather threaded mode को single source of truth के रूप में उपयोग करें और stale config keys हटाने के लिए `openclaw doctor --fix` चलाएं।

  </Accordion>

  <Accordion title="ऑडियो, वीडियो, और स्टिकर">
    ### ऑडियो संदेश

    Telegram voice notes बनाम audio files में अंतर करता है।

    - डिफ़ॉल्ट: audio file व्यवहार
    - एजेंट रिप्लाई में टैग `[[audio_as_voice]]`, voice-note भेजना बाध्य करने के लिए
    - इनबाउंड voice-note transcripts एजेंट context में मशीन-जनरेटेड,
      untrusted text के रूप में framed होते हैं; mention detection फिर भी raw
      transcript का उपयोग करता है ताकि mention-gated voice messages काम करते रहें।

    संदेश कार्रवाई उदाहरण:

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

    संदेश एक्शन उदाहरण:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    वीडियो नोट्स कैप्शन का समर्थन नहीं करते; दिया गया संदेश पाठ अलग से भेजा जाता है।

    ### स्टिकर

    इनबाउंड स्टिकर हैंडलिंग:

    - स्थिर WEBP: डाउनलोड और प्रोसेस किया गया (प्लेसहोल्डर `<media:sticker>`)
    - एनिमेटेड TGS: छोड़ा गया
    - वीडियो WEBM: छोड़ा गया

    स्टिकर संदर्भ फ़ील्ड:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    बार-बार होने वाली विज़न कॉल कम करने के लिए स्टिकर विवरण OpenClaw SQLite Plugin स्टेट में कैश किए जाते हैं।

    स्टिकर एक्शन सक्षम करें:

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

    स्टिकर एक्शन भेजें:

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

    सक्षम होने पर, OpenClaw ऐसे सिस्टम इवेंट कतारबद्ध करता है:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    कॉन्फ़िग:

    - `channels.telegram.reactionNotifications`: `off | own | all` (डिफ़ॉल्ट: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (डिफ़ॉल्ट: `minimal`)

    नोट्स:

    - `own` का अर्थ है केवल बॉट द्वारा भेजे गए संदेशों पर उपयोगकर्ता प्रतिक्रियाएँ (भेजे गए संदेश कैश के ज़रिए सर्वश्रेष्ठ-प्रयास)।
    - प्रतिक्रिया इवेंट फिर भी Telegram एक्सेस कंट्रोल (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) का पालन करते हैं; अनधिकृत प्रेषक छोड़ दिए जाते हैं।
    - Telegram प्रतिक्रिया अपडेट में थ्रेड ID प्रदान नहीं करता।
      - गैर-फ़ोरम समूह समूह चैट सेशन में रूट होते हैं
      - फ़ोरम समूह सटीक मूल विषय में नहीं, बल्कि समूह के सामान्य-विषय सेशन (`:topic:1`) में रूट होते हैं

    पोलिंग/Webhook के लिए `allowed_updates` में `message_reaction` अपने-आप शामिल होता है।

  </Accordion>

  <Accordion title="Ack प्रतिक्रियाएँ">
    जब OpenClaw किसी इनबाउंड संदेश को प्रोसेस कर रहा होता है, तो `ackReaction` एक स्वीकृति इमोजी भेजता है। `ackReactionScope` तय करता है कि वह इमोजी वास्तव में *कब* भेजा जाए।

    **इमोजी (`ackReaction`) रिज़ॉल्यूशन क्रम:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - एजेंट पहचान इमोजी फ़ॉलबैक (`agents.list[].identity.emoji`, अन्यथा "👀")

    नोट्स:

    - Telegram यूनिकोड इमोजी की अपेक्षा करता है (उदाहरण के लिए "👀")।
    - किसी चैनल या खाते के लिए प्रतिक्रिया बंद करने हेतु `""` का उपयोग करें।

    **स्कोप (`messages.ackReactionScope`):**

    Telegram प्रोवाइडर स्कोप `messages.ackReactionScope` से पढ़ता है (डिफ़ॉल्ट `"group-mentions"`)। आज कोई Telegram-खाता या Telegram-चैनल-स्तरीय ओवरराइड नहीं है।

    मान: `"all"` (DMs + समूह), `"direct"` (केवल DMs), `"group-all"` (हर समूह संदेश, कोई DMs नहीं), `"group-mentions"` (जब बॉट का उल्लेख हो तो समूह; **कोई DMs नहीं** — यही डिफ़ॉल्ट है), `"off"` / `"none"` (बंद)।

    <Note>
    डिफ़ॉल्ट स्कोप (`"group-mentions"`) सीधे संदेशों में ack प्रतिक्रियाएँ नहीं चलाता। इनबाउंड Telegram DMs पर ack प्रतिक्रिया पाने के लिए, `messages.ackReactionScope` को `"direct"` या `"all"` पर सेट करें। मान Telegram प्रोवाइडर स्टार्टअप पर पढ़ा जाता है, इसलिए बदलाव लागू करने के लिए Gateway रीस्टार्ट आवश्यक है।
    </Note>

  </Accordion>

  <Accordion title="Telegram इवेंट और कमांड से कॉन्फ़िग लेखन">
    चैनल कॉन्फ़िग लेखन डिफ़ॉल्ट रूप से सक्षम होता है (`configWrites !== false`)।

    Telegram द्वारा ट्रिगर किए गए लेखन में शामिल हैं:

    - `channels.telegram.groups` अपडेट करने के लिए समूह माइग्रेशन इवेंट (`migrate_to_chat_id`)
    - `/config set` और `/config unset` (कमांड सक्षम होना आवश्यक)

    बंद करें:

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
    डिफ़ॉल्ट लॉन्ग पोलिंग है। Webhook मोड के लिए `channels.telegram.webhookUrl` और `channels.telegram.webhookSecret` सेट करें; वैकल्पिक `webhookPath`, `webhookHost`, `webhookPort` (डिफ़ॉल्ट `/telegram-webhook`, `127.0.0.1`, `8787`)।

    लॉन्ग-पोलिंग मोड में OpenClaw अपना रीस्टार्ट वॉटरमार्क केवल किसी अपडेट के सफलतापूर्वक डिस्पैच होने के बाद ही स्थायी करता है। यदि कोई हैंडलर विफल होता है, तो वह अपडेट उसी प्रक्रिया में फिर से प्रयास योग्य रहता है और रीस्टार्ट डीड्यूप के लिए पूर्ण के रूप में नहीं लिखा जाता।

    स्थानीय लिसनर `127.0.0.1:8787` से बाइंड होता है। सार्वजनिक इनग्रेस के लिए, या तो स्थानीय पोर्ट के आगे रिवर्स प्रॉक्सी लगाएँ या जानबूझकर `webhookHost: "0.0.0.0"` सेट करें।

    Webhook मोड Telegram को `200` लौटाने से पहले अनुरोध गार्ड, Telegram सीक्रेट टोकन, और JSON बॉडी को वैलिडेट करता है।
    फिर OpenClaw उसी प्रति-चैट/प्रति-विषय बॉट लेन के माध्यम से अपडेट को असिंक्रोनस रूप से प्रोसेस करता है जो लॉन्ग पोलिंग में उपयोग होती हैं, इसलिए धीमे एजेंट टर्न Telegram के डिलीवरी ACK को रोके नहीं रखते।

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - `channels.telegram.textChunkLimit` का डिफ़ॉल्ट 4000 है।
    - `channels.telegram.chunkMode="newline"` लंबाई के आधार पर विभाजन से पहले अनुच्छेद सीमाओं (खाली पंक्तियों) को प्राथमिकता देता है।
    - `channels.telegram.mediaMaxMb` (डिफ़ॉल्ट 100) आने और जाने वाले Telegram मीडिया आकार को सीमित करता है।
    - `channels.telegram.mediaGroupFlushMs` (डिफ़ॉल्ट 500) नियंत्रित करता है कि Telegram एल्बम/मीडिया समूहों को OpenClaw द्वारा एक इनबाउंड संदेश के रूप में भेजने से पहले कितनी देर तक बफ़र किया जाए। यदि एल्बम के हिस्से देर से आते हैं तो इसे बढ़ाएँ; एल्बम उत्तर विलंबता घटाने के लिए इसे घटाएँ।
    - `channels.telegram.timeoutSeconds` Telegram API क्लाइंट टाइमआउट को ओवरराइड करता है (यदि सेट नहीं है, तो grammY डिफ़ॉल्ट लागू होता है)। Bot क्लाइंट कॉन्फ़िगर किए गए मानों को 60-सेकंड के आउटबाउंड टेक्स्ट/टाइपिंग अनुरोध गार्ड से नीचे सीमित करते हैं ताकि OpenClaw के ट्रांसपोर्ट गार्ड और फ़ॉलबैक चलने से पहले grammY दृश्य उत्तर डिलीवरी को निरस्त न करे। Long polling अब भी 45-सेकंड के `getUpdates` अनुरोध गार्ड का उपयोग करता है ताकि निष्क्रिय polls अनिश्चित काल तक छोड़े न जाएँ।
    - `channels.telegram.pollingStallThresholdMs` का डिफ़ॉल्ट `120000` है; केवल false-positive polling-stall रीस्टार्ट के लिए `30000` और `600000` के बीच ट्यून करें।
    - समूह संदर्भ इतिहास `channels.telegram.historyLimit` या `messages.groupChat.historyLimit` (डिफ़ॉल्ट 50) का उपयोग करता है; `0` अक्षम करता है।
    - reply/quote/forward पूरक संदर्भ को एक चयनित बातचीत संदर्भ विंडो में सामान्यीकृत किया जाता है जब gateway ने parent messages देखे हों; observed-message cache OpenClaw SQLite plugin state में रहता है, और `openclaw doctor --fix` legacy sidecars आयात करता है। Telegram updates में केवल एक उथला `reply_to_message` शामिल करता है, इसलिए cache से पुराने chains Telegram के वर्तमान update payload तक सीमित हैं।
    - Telegram allowlists मुख्य रूप से यह नियंत्रित करती हैं कि agent को कौन trigger कर सकता है, यह पूर्ण पूरक-संदर्भ redaction boundary नहीं है।
    - DM इतिहास controls:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config recoverable outbound API errors के लिए Telegram send helpers (CLI/tools/actions) पर लागू होता है। Inbound final-reply delivery भी Telegram pre-connect failures के लिए bounded safe-send retry का उपयोग करती है, लेकिन यह ambiguous post-send network envelopes को retry नहीं करती जो दृश्य messages को duplicate कर सकते हैं।

    CLI और message-tool send targets numeric chat ID, username, या forum topic target हो सकते हैं:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram polls `openclaw message poll` का उपयोग करते हैं और forum topics का समर्थन करते हैं:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    केवल-Telegram poll flags:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum topics के लिए `--thread-id` (या `:topic:` target का उपयोग करें)

    Telegram send इसका भी समर्थन करता है:

    - `--presentation` के साथ `buttons` blocks, inline keyboards के लिए जब `channels.telegram.capabilities.inlineButtons` इसकी अनुमति देता है
    - `--pin` या `--delivery '{"pin":true}'`, pinned delivery का अनुरोध करने के लिए जब bot उस chat में pin कर सकता है
    - outbound images, GIFs, और videos को compressed photo, animated-media, या video uploads के बजाय documents के रूप में भेजने के लिए `--force-document`

    Action gating:

    - `channels.telegram.actions.sendMessage=false` polls सहित outbound Telegram messages को अक्षम करता है
    - `channels.telegram.actions.poll=false` regular sends को enabled रखते हुए Telegram poll creation को अक्षम करता है

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram approver DMs में exec approvals का समर्थन करता है और वैकल्पिक रूप से originating chat या topic में prompts post कर सकता है। Approvers numeric Telegram user IDs होने चाहिए।

    Config path:

    - `channels.telegram.execApprovals.enabled` (कम से कम एक approver resolvable होने पर auto-enable होता है)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` से numeric owner IDs पर fallback करता है)
    - `channels.telegram.execApprovals.target`: `dm` (डिफ़ॉल्ट) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, और `defaultTo` नियंत्रित करते हैं कि bot से कौन बात कर सकता है और वह सामान्य replies कहाँ भेजता है। वे किसी को exec approver नहीं बनाते। पहला approved DM pairing `commands.ownerAllowFrom` को bootstrap करता है जब अभी कोई command owner मौजूद नहीं है, इसलिए one-owner setup अब भी `execApprovals.approvers` के अंतर्गत IDs duplicate किए बिना काम करता है।

    Channel delivery chat में command text दिखाती है; `channel` या `both` केवल trusted groups/topics में enable करें। जब prompt किसी forum topic में पहुँचता है, OpenClaw approval prompt और follow-up के लिए topic को सुरक्षित रखता है। Exec approvals डिफ़ॉल्ट रूप से 30 मिनट बाद expire हो जाते हैं।

    Inline approval buttons के लिए भी `channels.telegram.capabilities.inlineButtons` को target surface (`dm`, `group`, या `all`) की अनुमति देनी होती है। `plugin:` prefix वाले Approval IDs plugin approvals के माध्यम से resolve होते हैं; अन्य पहले exec approvals के माध्यम से resolve होते हैं।

    [Exec approvals](/hi/tools/exec-approvals) देखें।

  </Accordion>
</AccordionGroup>

## Error reply controls

जब agent को delivery या provider error मिलता है, error policy नियंत्रित करती है कि error messages Telegram chat में भेजे जाएँ या नहीं:

| Key                                 | मान                        | डिफ़ॉल्ट        | विवरण                                                                                                                                                                                               |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — हर error message chat में भेजें। `once` — हर unique error message cooldown window में एक बार भेजें (दोहराए गए identical errors को suppress करें)। `silent` — error messages कभी भी chat में न भेजें। |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | `once` policy के लिए cooldown window। Error भेजे जाने के बाद, वही error message इस interval के बीतने तक suppress किया जाता है। Outages के दौरान error spam रोकता है।                                      |

Per-account, per-group, और per-topic overrides समर्थित हैं (अन्य Telegram config keys जैसी ही inheritance)।

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
  <Accordion title="Bot does not respond to non mention group messages">

    - यदि `requireMention=false` है, तो Telegram privacy mode को full visibility की अनुमति देनी चाहिए।
      - BotFather: `/setprivacy` -> Disable
      - फिर bot को group से हटाकर दोबारा जोड़ें
    - जब config unmentioned group messages की अपेक्षा करता है, `openclaw channels status` चेतावनी देता है।
    - `openclaw channels status --probe` explicit numeric group IDs की जाँच कर सकता है; wildcard `"*"` को membership-probe नहीं किया जा सकता।
    - quick session test: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - जब `channels.telegram.groups` मौजूद हो, group listed होना चाहिए (या `"*"` शामिल करें)
    - group में bot membership सत्यापित करें
    - logs देखें: skip reasons के लिए `openclaw logs --follow`

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - अपनी sender identity authorize करें (pairing और/या numeric `allowFrom`)
    - command authorization अब भी लागू होता है, भले ही group policy `open` हो
    - `BOT_COMMANDS_TOO_MUCH` के साथ `setMyCommands failed` का अर्थ है कि native menu में बहुत अधिक entries हैं; plugin/skill/custom commands घटाएँ या native menus अक्षम करें
    - `deleteMyCommands` / `setMyCommands` startup calls और `sendChatAction` typing calls bounded हैं और request timeout पर Telegram के transport fallback के माध्यम से एक बार retry करते हैं। Persistent network/fetch errors आमतौर पर `api.telegram.org` तक DNS/HTTPS reachability issues दर्शाते हैं

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` configured bot token के लिए Telegram authentication failure है।
    - BotFather में bot token फिर से copy या regenerate करें, फिर default account के लिए `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, या `TELEGRAM_BOT_TOKEN` update करें।
    - startup के दौरान `deleteWebhook 401 Unauthorized` भी auth failure है; इसे "कोई webhook मौजूद नहीं है" मानना उसी bad-token failure को केवल बाद की API calls तक टाल देगा।

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ + custom fetch/proxy immediate abort behavior trigger कर सकते हैं यदि AbortSignal types mismatch हों।
    - कुछ hosts पहले `api.telegram.org` को IPv6 में resolve करते हैं; broken IPv6 egress intermittent Telegram API failures का कारण बन सकता है।
    - यदि logs में `TypeError: fetch failed` या `Network request for 'getUpdates' failed!` शामिल है, तो OpenClaw अब इन्हें recoverable network errors के रूप में retry करता है।
    - polling startup के दौरान, OpenClaw grammY के लिए successful startup `getMe` probe reuse करता है ताकि runner को पहले `getUpdates` से पहले दूसरे `getMe` की आवश्यकता न हो।
    - यदि polling startup के दौरान `deleteWebhook` transient network error के साथ fail होता है, तो OpenClaw एक और pre-poll control-plane call करने के बजाय long polling में जारी रहता है। अब भी active webhook `getUpdates` conflict के रूप में सामने आता है; OpenClaw फिर Telegram transport rebuild करता है और webhook cleanup retry करता है।
    - यदि Telegram sockets छोटे fixed cadence पर recycle होते हैं, तो कम `channels.telegram.timeoutSeconds` की जाँच करें; bot clients configured values को outbound और `getUpdates` request guards से नीचे clamp करते हैं, लेकिन पुराने releases हर poll या reply को abort कर सकते थे जब इसे उन guards से नीचे set किया गया था।
    - यदि logs में `Polling stall detected` शामिल है, तो OpenClaw polling restart करता है और डिफ़ॉल्ट रूप से completed long-poll liveness के बिना 120 seconds के बाद Telegram transport rebuild करता है।
    - `openclaw channels status --probe` और `openclaw doctor` चेतावनी देते हैं जब कोई running polling account startup grace के बाद `getUpdates` complete नहीं कर पाया है, जब कोई running webhook account startup grace के बाद `setWebhook` complete नहीं कर पाया है, या जब last successful polling transport activity stale है।
    - `channels.telegram.pollingStallThresholdMs` केवल तब बढ़ाएँ जब long-running `getUpdates` calls healthy हों लेकिन आपका host अब भी false polling-stall restarts report करता हो। Persistent stalls आमतौर पर host और `api.telegram.org` के बीच proxy, DNS, IPv6, या TLS egress issues की ओर संकेत करते हैं।
    - Telegram Bot API transport के लिए process proxy env का भी सम्मान करता है, जिनमें `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, और उनके lowercase variants शामिल हैं। `NO_PROXY` / `no_proxy` अब भी `api.telegram.org` को bypass कर सकते हैं।
    - यदि OpenClaw managed proxy किसी service environment के लिए `OPENCLAW_PROXY_URL` के माध्यम से configured है और कोई standard proxy env मौजूद नहीं है, तो Telegram Bot API transport के लिए भी उस URL का उपयोग करता है।
    - unstable direct egress/TLS वाले VPS hosts पर, Telegram API calls को `channels.telegram.proxy` के माध्यम से route करें:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ में `autoSelectFamily=true` डिफ़ॉल्ट होता है (WSL2 को छोड़कर)। Telegram DNS परिणाम क्रम पहले `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, फिर `channels.telegram.network.dnsResultOrder`, फिर प्रक्रिया के डिफ़ॉल्ट जैसे `NODE_OPTIONS=--dns-result-order=ipv4first` का पालन करता है; यदि इनमें से कोई लागू नहीं होता, तो Node 22+ `ipv4first` पर वापस जाता है।
    - यदि आपका होस्ट WSL2 है या स्पष्ट रूप से केवल-IPv4 व्यवहार के साथ बेहतर काम करता है, तो फ़ैमिली चयन को बाध्य करें:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 बेंचमार्क-रेंज उत्तर (`198.18.0.0/15`) Telegram मीडिया डाउनलोड के लिए
      डिफ़ॉल्ट रूप से पहले से अनुमत हैं। यदि कोई विश्वसनीय fake-IP या
      पारदर्शी प्रॉक्सी मीडिया डाउनलोड के दौरान `api.telegram.org` को किसी अन्य
      निजी/आंतरिक/विशेष-उपयोग पते पर पुनर्लेखित करता है, तो आप केवल-Telegram बायपास में
      ऑप्ट इन कर सकते हैं:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - यही ऑप्ट-इन प्रति खाते पर
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` पर उपलब्ध है।
    - यदि आपकी प्रॉक्सी Telegram मीडिया होस्ट को `198.18.x.x` में रिज़ॉल्व करती है, तो पहले
      खतरनाक फ़्लैग बंद रखें। Telegram मीडिया पहले से ही RFC 2544
      बेंचमार्क रेंज को डिफ़ॉल्ट रूप से अनुमति देता है।

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` Telegram
      मीडिया SSRF सुरक्षा को कमज़ोर करता है। इसे केवल Clash, Mihomo, या Surge fake-IP रूटिंग जैसे विश्वसनीय ऑपरेटर-नियंत्रित प्रॉक्सी
      परिवेशों के लिए उपयोग करें, जब वे RFC 2544 बेंचमार्क
      रेंज के बाहर निजी या विशेष-उपयोग उत्तर बनाते हैं। सामान्य सार्वजनिक इंटरनेट Telegram पहुंच के लिए इसे बंद रखें।
    </Warning>

    - परिवेश ओवरराइड (अस्थायी):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS उत्तर सत्यापित करें:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

अधिक सहायता: [चैनल समस्या निवारण](/hi/channels/troubleshooting).

## कॉन्फ़िगरेशन संदर्भ

प्राथमिक संदर्भ: [कॉन्फ़िगरेशन संदर्भ - Telegram](/hi/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- स्टार्टअप/प्रमाणीकरण: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` को किसी नियमित फ़ाइल की ओर इंगित करना चाहिए; सिमलिंक अस्वीकार किए जाते हैं)
- पहुंच नियंत्रण: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, शीर्ष-स्तरीय `bindings[]` (`type: "acp"`)
- टॉपिक डिफ़ॉल्ट: `groups.<chatId>.topics."*"` मेल न खाने वाले फ़ोरम टॉपिक पर लागू होता है; सटीक टॉपिक ID इसे ओवरराइड करते हैं
- निष्पादन अनुमोदन: `execApprovals`, `accounts.*.execApprovals`
- कमांड/मेनू: `commands.native`, `commands.nativeSkills`, `customCommands`
- थ्रेडिंग/उत्तर: `replyToMode`
- स्ट्रीमिंग: `streaming` (पूर्वावलोकन), `streaming.preview.toolProgress`, `blockStreaming`
- फ़ॉर्मैटिंग/डिलीवरी: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- मीडिया/नेटवर्क: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- कस्टम API रूट: `apiRoot` (केवल Bot API रूट; `/bot<TOKEN>` शामिल न करें)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- क्रियाएं/क्षमताएं: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- प्रतिक्रियाएं: `reactionNotifications`, `reactionLevel`
- त्रुटियां: `errorPolicy`, `errorCooldownMs`
- लेखन/इतिहास: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
मल्टी-अकाउंट प्राथमिकता: जब दो या अधिक खाता ID कॉन्फ़िगर किए गए हों, तो डिफ़ॉल्ट रूटिंग को स्पष्ट बनाने के लिए `channels.telegram.defaultAccount` सेट करें (या `channels.telegram.accounts.default` शामिल करें)। अन्यथा OpenClaw पहले सामान्यीकृत खाता ID पर वापस जाता है और `openclaw doctor` चेतावनी देता है। नामित खाते `channels.telegram.allowFrom` / `groupAllowFrom` विरासत में लेते हैं, लेकिन `accounts.default.*` मान नहीं।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Telegram उपयोगकर्ता को Gateway से जोड़ें।
  </Card>
  <Card title="Groups" icon="users" href="/hi/channels/groups">
    समूह और टॉपिक allowlist व्यवहार।
  </Card>
  <Card title="Channel routing" icon="route" href="/hi/channels/channel-routing">
    आने वाले संदेशों को एजेंटों तक रूट करें।
  </Card>
  <Card title="Security" icon="shield" href="/hi/gateway/security">
    ख़तरा मॉडल और हार्डनिंग।
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/hi/concepts/multi-agent">
    समूहों और टॉपिक को एजेंटों से मैप करें।
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल डायग्नोस्टिक्स।
  </Card>
</CardGroup>
