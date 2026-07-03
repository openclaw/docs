---
read_when:
    - Telegram सुविधाओं या Webhook पर काम करना
summary: Telegram bot समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Telegram
x-i18n:
    generated_at: "2026-07-03T13:26:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

grammY के माध्यम से बॉट DM और समूहों के लिए प्रोडक्शन-तैयार। लॉन्ग पोलिंग डिफ़ॉल्ट मोड है; Webhook मोड वैकल्पिक है।

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Telegram के लिए डिफ़ॉल्ट DM नीति pairing है।
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल डायग्नोस्टिक्स और सुधार प्लेबुक।
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/hi/gateway/configuration">
    पूर्ण चैनल कॉन्फ़िग पैटर्न और उदाहरण।
  </Card>
</CardGroup>

## त्वरित सेटअप

<Steps>
  <Step title="Create the bot token in BotFather">
    Telegram खोलें और **@BotFather** से चैट करें (पुष्टि करें कि हैंडल बिल्कुल `@BotFather` है)।

    `/newbot` चलाएँ, संकेतों का पालन करें, और टोकन सहेजें।

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

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (केवल डिफ़ॉल्ट खाते के लिए)।
    Telegram `openclaw channels login telegram` का उपयोग **नहीं** करता; टोकन को config/env में कॉन्फ़िगर करें, फिर Gateway शुरू करें।

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing कोड 1 घंटे बाद समाप्त हो जाते हैं।

  </Step>

  <Step title="Add the bot to a group">
    बॉट को अपने समूह में जोड़ें, फिर समूह एक्सेस के लिए आवश्यक दोनों ID प्राप्त करें:

    - आपका Telegram उपयोगकर्ता ID, जिसका उपयोग `allowFrom` / `groupAllowFrom` में होता है
    - Telegram समूह चैट ID, जिसका उपयोग `channels.telegram.groups` के अंतर्गत कुंजी के रूप में होता है

    पहली बार सेटअप के लिए, समूह चैट ID `openclaw logs --follow`, किसी forwarded-ID बॉट, या Bot API `getUpdates` से प्राप्त करें। समूह की अनुमति मिलने के बाद, `/whoami@<bot_username>` उपयोगकर्ता और समूह ID की पुष्टि कर सकता है।

    `-100` से शुरू होने वाले नकारात्मक Telegram supergroup ID समूह चैट ID होते हैं। उन्हें `channels.telegram.groups` के अंतर्गत रखें, `groupAllowFrom` के अंतर्गत नहीं।

  </Step>
</Steps>

<Note>
टोकन समाधान क्रम खाते के अनुसार होता है। व्यवहार में, config मान env fallback पर प्राथमिकता पाते हैं, और `TELEGRAM_BOT_TOKEN` केवल डिफ़ॉल्ट खाते पर लागू होता है।
सफल startup के बाद, OpenClaw state directory में बॉट पहचान को अधिकतम 24 घंटे तक cache करता है ताकि restart अतिरिक्त Telegram `getMe` कॉल से बच सकें; टोकन बदलने या हटाने से वह cache साफ़ हो जाता है।
</Note>

## Telegram साइड सेटिंग्स

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram बॉट डिफ़ॉल्ट रूप से **Privacy Mode** में होते हैं, जो यह सीमित करता है कि वे कौन से समूह संदेश प्राप्त करते हैं।

    यदि बॉट को सभी समूह संदेश देखने चाहिए, तो इनमें से कोई एक करें:

    - `/setprivacy` के माध्यम से privacy mode अक्षम करें, या
    - बॉट को समूह admin बनाएँ।

    privacy mode बदलते समय, प्रत्येक समूह में बॉट को हटाकर फिर से जोड़ें ताकि Telegram बदलाव लागू करे।

  </Accordion>

  <Accordion title="Group permissions">
    Admin स्थिति Telegram समूह सेटिंग्स में नियंत्रित होती है।

    Admin बॉट सभी समूह संदेश प्राप्त करते हैं, जो हमेशा-चालू समूह व्यवहार के लिए उपयोगी है।

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` समूह में जोड़ने की अनुमति/मनाही के लिए
    - `/setprivacy` समूह visibility व्यवहार के लिए

  </Accordion>
</AccordionGroup>

## एक्सेस नियंत्रण और activation

### समूह बॉट पहचान

Telegram समूहों और forum topics में, कॉन्फ़िगर किए गए बॉट हैंडल (उदाहरण के लिए `@my_bot`) के स्पष्ट mention को चुने गए OpenClaw agent को संबोधित करना माना जाता है, भले ही agent persona नाम Telegram username से अलग हो। असंबंधित समूह traffic पर group silence policy अभी भी लागू होती है, लेकिन बॉट हैंडल स्वयं "कोई और" नहीं माना जाता।

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` direct message access नियंत्रित करता है:

    - `pairing` (डिफ़ॉल्ट)
    - `allowlist` (`allowFrom` में कम से कम एक sender ID आवश्यक)
    - `open` (`allowFrom` में `"*"` शामिल होना आवश्यक)
    - `disabled`

    `dmPolicy: "open"` के साथ `allowFrom: ["*"]` किसी भी Telegram खाते को, जो बॉट username खोजता या अनुमान लगाता है, बॉट को command करने देता है। इसे केवल जानबूझकर public bots के लिए कसकर restricted tools के साथ उपयोग करें; एक-owner बॉटों को numeric user IDs के साथ `allowlist` उपयोग करना चाहिए।

    `channels.telegram.allowFrom` numeric Telegram user IDs स्वीकार करता है। `telegram:` / `tg:` prefixes स्वीकार किए जाते हैं और normalize किए जाते हैं।
    multi-account configs में, restrictive top-level `channels.telegram.allowFrom` को safety boundary माना जाता है: account-level `allowFrom: ["*"]` entries उस खाते को public नहीं बनातीं, जब तक merge के बाद effective account allowlist में explicit wildcard अभी भी मौजूद न हो।
    खाली `allowFrom` के साथ `dmPolicy: "allowlist"` सभी DMs को block करता है और config validation द्वारा reject किया जाता है।
    Setup केवल numeric user IDs माँगता है।
    यदि आपने upgrade किया है और आपके config में `@username` allowlist entries हैं, तो उन्हें resolve करने के लिए `openclaw doctor --fix` चलाएँ (best-effort; Telegram bot token आवश्यक है)।
    यदि आप पहले pairing-store allowlist files पर निर्भर थे, तो `openclaw doctor --fix` allowlist flows में entries को `channels.telegram.allowFrom` में recover कर सकता है (उदाहरण के लिए जब `dmPolicy: "allowlist"` में अभी explicit IDs नहीं हैं)।

    एक-owner बॉटों के लिए, access policy को config में टिकाऊ रखने के लिए explicit numeric `allowFrom` IDs के साथ `dmPolicy: "allowlist"` पसंद करें (पिछली pairing approvals पर निर्भर होने के बजाय)।

    सामान्य भ्रम: DM pairing approval का अर्थ "यह sender हर जगह authorized है" नहीं होता।
    Pairing DM access देती है। यदि अभी कोई command owner मौजूद नहीं है, तो पहली approved pairing `commands.ownerAllowFrom` भी set करती है ताकि owner-only commands और exec approvals के पास explicit operator account हो।
    Group sender authorization अभी भी explicit config allowlists से आता है।
    यदि आप चाहते हैं कि "मैं एक बार authorized हूँ और DMs तथा group commands दोनों काम करें", तो अपना numeric Telegram user ID `channels.telegram.allowFrom` में रखें; owner-only commands के लिए, सुनिश्चित करें कि `commands.ownerAllowFrom` में `telegram:<your user id>` शामिल है।

    ### अपना Telegram user ID ढूँढना

    अधिक सुरक्षित (third-party bot नहीं):

    1. अपने बॉट को DM करें।
    2. `openclaw logs --follow` चलाएँ।
    3. `from.id` पढ़ें।

    आधिकारिक Bot API विधि:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Third-party विधि (कम private): `@userinfobot` या `@getidsbot`।

  </Tab>

  <Tab title="Group policy and allowlists">
    दो controls साथ में लागू होते हैं:

    1. **कौन से समूह allowed हैं** (`channels.telegram.groups`)
       - कोई `groups` config नहीं:
         - `groupPolicy: "open"` के साथ: कोई भी समूह group-ID checks पास कर सकता है
         - `groupPolicy: "allowlist"` (डिफ़ॉल्ट) के साथ: समूह तब तक block होते हैं जब तक आप `groups` entries (या `"*"`) नहीं जोड़ते
       - `groups` configured: allowlist के रूप में काम करता है (explicit IDs या `"*"`)

    2. **समूहों में कौन से senders allowed हैं** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (डिफ़ॉल्ट)
       - `disabled`

    `groupAllowFrom` group sender filtering के लिए उपयोग होता है। यदि set नहीं है, तो Telegram `allowFrom` पर fallback करता है।
    `groupAllowFrom` entries numeric Telegram user IDs होनी चाहिए (`telegram:` / `tg:` prefixes normalize किए जाते हैं)।
    Telegram group या supergroup chat IDs को `groupAllowFrom` में न रखें। नकारात्मक chat IDs `channels.telegram.groups` के अंतर्गत आते हैं।
    Non-numeric entries sender authorization के लिए ignore की जाती हैं।
    Security boundary (`2026.2.25+`): group sender auth DM pairing-store approvals inherit **नहीं** करता।
    Pairing केवल DM रहती है। समूहों के लिए, `groupAllowFrom` या per-group/per-topic `allowFrom` set करें।
    यदि `groupAllowFrom` unset है, तो Telegram config `allowFrom` पर fallback करता है, pairing store पर नहीं।
    एक-owner बॉटों के लिए व्यावहारिक pattern: अपना user ID `channels.telegram.allowFrom` में set करें, `groupAllowFrom` unset छोड़ें, और target groups को `channels.telegram.groups` के अंतर्गत allow करें।
    Runtime note: यदि `channels.telegram` पूरी तरह missing है, तो runtime fail-closed `groupPolicy="allowlist"` पर default करता है, जब तक `channels.defaults.groupPolicy` explicit रूप से set न हो।

    Owner-only समूह setup:

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

    इसे समूह से `@<bot_username> ping` के साथ test करें। `requireMention: true` रहते हुए plain group messages बॉट को trigger नहीं करते।

    उदाहरण: एक specific समूह में किसी भी member को allow करें:

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

    उदाहरण: एक specific समूह के अंदर केवल specific users को allow करें:

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

      - `-1001234567890` जैसे नकारात्मक Telegram group या supergroup chat IDs को `channels.telegram.groups` के अंतर्गत रखें।
      - जब आप यह सीमित करना चाहते हैं कि allowed group के अंदर कौन लोग बॉट को trigger कर सकते हैं, तब `8734062810` जैसे Telegram user IDs को `groupAllowFrom` के अंतर्गत रखें।
      - `groupAllowFrom: ["*"]` का उपयोग केवल तब करें जब आप चाहते हों कि allowed group का कोई भी member बॉट से बात कर सके।

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Group replies के लिए डिफ़ॉल्ट रूप से mention आवश्यक होता है।

    Mention इनसे आ सकता है:

    - native `@botusername` mention, या
    - इनमें mention patterns:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Session-level command toggles:

    - `/activation always`
    - `/activation mention`

    ये केवल session state update करते हैं। persistence के लिए config का उपयोग करें।

    Persistent config उदाहरण:

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

    Group history context समूहों के लिए हमेशा on रहता है और
    `historyLimit` से bounded होता है। Telegram group history window अक्षम करने के लिए `channels.telegram.historyLimit: 0` set करें। retired `includeGroupHistoryContext`
    key को `openclaw doctor --fix` द्वारा हटा दिया जाता है।

    समूह chat ID प्राप्त करना:

    - group message को `@userinfobot` / `@getidsbot` पर forward करें
    - या `openclaw logs --follow` से `chat.id` पढ़ें
    - या Bot API `getUpdates` inspect करें
    - समूह allowed होने के बाद, यदि native commands enabled हैं तो `/whoami@<bot_username>` चलाएँ

  </Tab>
</Tabs>

## Runtime व्यवहार

- Telegram का स्वामित्व Gateway प्रक्रिया के पास है।
- Routing निर्धारक है: Telegram inbound उत्तर Telegram पर ही वापस जाते हैं (मॉडल चैनल नहीं चुनता)।
- Inbound संदेश साझा channel envelope में normalize होते हैं, जिसमें reply metadata, media placeholders, और Gateway द्वारा देखे गए Telegram replies के लिए persisted reply-chain context शामिल होता है।
- Group sessions group ID से अलग किए जाते हैं। Forum topics को अलग रखने के लिए `:topic:<threadId>` जोड़ा जाता है।
- DM संदेशों में `message_thread_id` हो सकता है; OpenClaw इसे replies के लिए सुरक्षित रखता है। DM topic sessions केवल तब split होते हैं जब Telegram `getMe` bot के लिए `has_topics_enabled: true` रिपोर्ट करता है; अन्यथा DMs flat session पर रहते हैं।
- Long polling, per-chat/per-thread sequencing के साथ grammY runner का उपयोग करता है। Overall runner sink concurrency `agents.defaults.maxConcurrent` का उपयोग करती है।
- Multi-account startup concurrent Telegram `getMe` probes को सीमित करता है, ताकि बड़े bot fleets हर account probe को एक साथ fan out न करें।
- Long polling हर Gateway process के भीतर guarded है, ताकि एक समय में केवल एक active poller bot token का उपयोग कर सके। अगर आपको अभी भी `getUpdates` 409 conflicts दिखते हैं, तो संभवतः कोई दूसरा OpenClaw Gateway, script, या external poller वही token उपयोग कर रहा है।
- Long-polling watchdog restarts default रूप से 120 seconds तक completed `getUpdates` liveness न मिलने पर trigger होते हैं। `channels.telegram.pollingStallThresholdMs` केवल तब बढ़ाएँ जब आपके deployment में long-running work के दौरान अभी भी false polling-stall restarts दिखते हों। मान milliseconds में है और `30000` से `600000` तक allowed है; per-account overrides समर्थित हैं।
- Telegram Bot API में read-receipt support नहीं है (`sendReadReceipts` लागू नहीं होता)।

<Note>
  `channels.telegram.dm.threadReplies` और `channels.telegram.direct.<chatId>.threadReplies` हटा दिए गए थे। Upgrade करने के बाद अगर आपके config में अभी भी वे keys हैं, तो `openclaw doctor --fix` चलाएँ। DM topic routing अब Telegram `getMe.has_topics_enabled` से मिली bot capability का पालन करती है, जिसे BotFather threaded mode नियंत्रित करता है: topics-enabled bots, Telegram द्वारा `message_thread_id` भेजे जाने पर thread-scoped DM sessions का उपयोग करते हैं; अन्य DMs flat session पर रहते हैं।
</Note>

## Feature reference

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw partial replies को real time में stream कर सकता है:

    - direct chats: preview message + `editMessageText`
    - groups/topics: preview message + `editMessageText`

    आवश्यकता:

    - `channels.telegram.streaming` `off | partial | block | progress` है (default: `partial`)
    - छोटे initial answer previews debounce किए जाते हैं, फिर run अभी भी active होने पर bounded delay के बाद materialize होते हैं
    - `progress` tool progress के लिए एक editable status draft रखता है, tool progress से पहले answer activity आने पर stable status label दिखाता है, completion पर उसे clear करता है, और final answer को normal message के रूप में भेजता है
    - `streaming.preview.toolProgress` नियंत्रित करता है कि tool/progress updates वही edited preview message reuse करें या नहीं (default: preview streaming active होने पर `true`)
    - `streaming.preview.commandText` उन tool-progress lines के अंदर command/exec detail नियंत्रित करता है: `raw` (default, released behavior सुरक्षित रखता है) या `status` (केवल tool label)
    - `streaming.progress.commentary` (default: `false`) temporary progress draft में assistant commentary/preamble text को opt in करता है
    - legacy `channels.telegram.streamMode`, boolean `streaming` values, और retired native draft preview keys detect की जाती हैं; उन्हें current streaming config में migrate करने के लिए `openclaw doctor --fix` चलाएँ

    Tool-progress preview updates वे छोटे status lines हैं जो tools चलने के दौरान दिखते हैं, जैसे command execution, file reads, planning updates, patch summaries, या Codex app-server mode में Codex preamble/commentary text। Telegram इन्हें default रूप से enabled रखता है ताकि `v2026.4.22` और बाद के released OpenClaw behavior से मेल बना रहे।

    Answer text के लिए edited preview रखना लेकिन tool-progress lines छिपाना हो, तो set करें:

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

    Tool-progress visible रखना लेकिन command/exec text छिपाना हो, तो set करें:

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

    जब आप final answer को उसी message में edit किए बिना visible tool progress चाहते हों, तब `progress` mode का उपयोग करें। Command-text policy को `streaming.progress` के नीचे रखें:

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

    `streaming.mode: "off"` केवल तब उपयोग करें जब आप final-only delivery चाहते हों: Telegram preview edits disabled होते हैं और generic tool/progress chatter को standalone status messages के रूप में भेजने के बजाय suppress किया जाता है। Approval prompts, media payloads, और errors फिर भी normal final delivery के माध्यम से route होते हैं। `streaming.preview.toolProgress: false` तब उपयोग करें जब आप tool-progress status lines छिपाते हुए केवल answer preview edits रखना चाहते हों।

    <Note>
      Telegram selected quote replies exception हैं। जब `replyToMode` `"first"`, `"all"`, या `"batched"` हो और inbound message में selected quote text शामिल हो, तो OpenClaw answer preview edit करने के बजाय Telegram के native quote-reply path से final answer भेजता है, इसलिए `streaming.preview.toolProgress` उस turn के लिए छोटे status lines नहीं दिखा सकता। Selected quote text के बिना current-message replies में preview streaming बनी रहती है। जब tool-progress visibility native quote replies से अधिक महत्वपूर्ण हो, तो `replyToMode: "off"` set करें, या trade-off स्वीकार करने के लिए `streaming.preview.toolProgress: false` set करें।
    </Note>

    Text-only replies के लिए:

    - छोटे DM/group/topic previews: OpenClaw वही preview message रखता है और final edit in place करता है
    - कई Telegram messages में split होने वाले long text finals, संभव होने पर existing preview को first final chunk के रूप में reuse करते हैं, फिर केवल remaining chunks भेजते हैं
    - progress-mode finals status draft clear करते हैं और draft को answer में edit करने के बजाय normal final delivery उपयोग करते हैं
    - अगर completed text confirm होने से पहले final edit fail हो जाता है, तो OpenClaw normal final delivery उपयोग करता है और stale preview साफ करता है

    Complex replies (जैसे media payloads) के लिए, OpenClaw normal final delivery पर fall back करता है और फिर preview message साफ करता है।

    Preview streaming, block streaming से अलग है। जब Telegram के लिए block streaming explicitly enabled हो, तो OpenClaw double-streaming से बचने के लिए preview stream skip करता है।

    Reasoning stream behavior:

    - `/reasoning stream` supported channel के reasoning-preview path का उपयोग करता है; Telegram पर, यह generate करते समय reasoning को live preview में stream करता है
    - final delivery के बाद reasoning preview delete हो जाता है; reasoning visible रखना हो तो `/reasoning on` उपयोग करें
    - final answer reasoning text के बिना भेजा जाता है

  </Accordion>

  <Accordion title="Rich message formatting">
    Outbound text default रूप से standard Telegram HTML messages का उपयोग करता है, ताकि replies current Telegram clients में readable रहें। यह compatibility mode normal bold, italic, links, code, spoilers, और quotes को support करता है, लेकिन Bot API 10.1 rich-only blocks जैसे native tables, details, rich media, और formulas को नहीं।

    Bot API 10.1 rich messages में opt in करने के लिए `channels.telegram.richMessages: true` set करें:

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
    - Explicit rich HTML payloads supported Bot API 10.1 tags जैसे headings, tables, details, rich media, और formulas को preserve करते हैं।
    - Media captions अभी भी Telegram HTML captions का उपयोग करते हैं क्योंकि rich messages captions को replace नहीं करते।

    इससे model text Telegram Rich Markdown sigils से दूर रहता है, इसलिए `$400-600K` जैसी currency math के रूप में parse नहीं होती। Long rich text automatically Telegram की rich text और rich block limits के पार split होता है। Telegram की column limit से अधिक tables code blocks के रूप में भेजे जाते हैं।

    Default: client compatibility के लिए off। Rich messages के लिए compatible Telegram clients आवश्यक हैं; कुछ current Desktop, Web, Android, और third-party clients accepted rich messages को unsupported के रूप में display करते हैं। इस option को disabled रखें, जब तक bot के साथ उपयोग होने वाला हर client इन्हें render न कर सके। `/status` दिखाता है कि current Telegram session में rich messages on हैं या off।

    Link previews default रूप से enabled हैं। `channels.telegram.linkPreview: false` rich text के लिए automatic entity detection skip करता है।

  </Accordion>

  <Accordion title="Native commands and custom commands">
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
    - conflicts/duplicates skip किए जाते हैं और log होते हैं

    Notes:

    - custom commands केवल menu entries हैं; वे behavior को auto-implement नहीं करते
    - plugin/skill commands typed होने पर अभी भी काम कर सकते हैं, भले ही Telegram menu में न दिखें

    अगर native commands disabled हैं, तो built-ins हटाए जाते हैं। Custom/plugin commands configured होने पर अभी भी register हो सकते हैं।

    Common setup failures:

    - `setMyCommands failed` के साथ `BOT_COMMANDS_TOO_MUCH` का मतलब है कि trimming के बाद भी Telegram menu overflow हुआ; plugin/skill/custom commands कम करें या `channels.telegram.commands.native` disable करें।
    - Direct Bot API curl commands काम करते समय `deleteWebhook`, `deleteMyCommands`, या `setMyCommands` का `404: Not Found` के साथ fail होना यह संकेत दे सकता है कि `channels.telegram.apiRoot` को full `/bot<TOKEN>` endpoint पर set किया गया था। `apiRoot` केवल Bot API root होना चाहिए, और `openclaw doctor --fix` accidental trailing `/bot<TOKEN>` को हटाता है।
    - `getMe returned 401` का मतलब है कि Telegram ने configured bot token reject कर दिया। Current BotFather token के साथ `botToken`, `tokenFile`, या `TELEGRAM_BOT_TOKEN` update करें; OpenClaw polling से पहले रुक जाता है, इसलिए इसे webhook cleanup failure के रूप में report नहीं किया जाता।
    - Network/fetch errors के साथ `setMyCommands failed` का आमतौर पर मतलब है कि `api.telegram.org` तक outbound DNS/HTTPS blocked है।

    ### Device pairing commands (`device-pair` plugin)

    जब `device-pair` plugin installed हो:

    1. `/pair` setup code generate करता है
    2. iOS app में code paste करें
    3. `/pair pending` pending requests list करता है (role/scopes सहित)
    4. request approve करें:
       - explicit approval के लिए `/pair approve <requestId>`
       - जब केवल एक pending request हो, तो `/pair approve`
       - most recent के लिए `/pair approve latest`

    Setup code एक short-lived bootstrap token carry करता है। Built-in setup-code bootstrap `scopes: []` के साथ durable node token और trusted mobile onboarding के लिए bounded operator handoff token लौटाता है। वह operator token setup-time native configuration पढ़ सकता है, लेकिन pairing mutation scopes या `operator.admin` grant नहीं करता।

    अगर device बदली हुई auth details (जैसे role/scopes/public key) के साथ retry करता है, तो पिछली pending request supersede हो जाती है और नई request अलग `requestId` उपयोग करती है। Approve करने से पहले `/pair pending` फिर से चलाएँ।

    अधिक विवरण: [पेयरिंग](/hi/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
    इनलाइन कीबोर्ड scope कॉन्फ़िगर करें:

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

    प्रति-अकाउंट override:

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

    Scopes:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (डिफ़ॉल्ट)

    Legacy `capabilities: ["inlineButtons"]` `inlineButtons: "all"` पर मैप होता है।

    संदेश action उदाहरण:

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

    Telegram `web_app` बटन केवल किसी उपयोगकर्ता और bot के बीच निजी चैट में काम करते हैं।

    Callback क्लिक जिन्हें किसी रजिस्टर्ड plugin interactive handler ने claim नहीं किया है,
    agent को टेक्स्ट के रूप में पास किए जाते हैं:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Telegram tool actions में शामिल हैं:

    - `sendMessage` (`to`, `content`, वैकल्पिक `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` या `caption`, वैकल्पिक `presentation` इनलाइन बटन; केवल-बटन edits reply markup अपडेट करते हैं)
    - `createForumTopic` (`chatId`, `name`, वैकल्पिक `iconColor`, `iconCustomEmojiId`)

    Channel message actions ergonomic aliases (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`) expose करते हैं।

    Gating controls:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (डिफ़ॉल्ट: disabled)

    नोट: `edit` और `topic-create` फ़िलहाल डिफ़ॉल्ट रूप से enabled हैं और इनके लिए अलग `channels.telegram.actions.*` toggles नहीं हैं।
    Runtime sends सक्रिय config/secrets snapshot (startup/reload) का उपयोग करते हैं, इसलिए action paths प्रत्येक send पर ad-hoc SecretRef re-resolution नहीं करते।

    Reaction removal semantics: [/tools/reactions](/hi/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram generated output में explicit reply threading tags का समर्थन करता है:

    - `[[reply_to_current]]` triggering message का reply देता है
    - `[[reply_to:<id>]]` किसी विशिष्ट Telegram message ID का reply देता है

    `channels.telegram.replyToMode` handling नियंत्रित करता है:

    - `off` (डिफ़ॉल्ट)
    - `first`
    - `all`

    जब reply threading enabled हो और मूल Telegram text या caption उपलब्ध हो, OpenClaw अपने-आप native Telegram quote excerpt शामिल करता है। Telegram native quote text को 1024 UTF-16 code units तक सीमित करता है, इसलिए लंबे messages की quote शुरुआत से ली जाती है और अगर Telegram quote अस्वीकार कर दे तो plain reply पर fallback होता है।

    नोट: `off` implicit reply threading को disabled करता है। Explicit `[[reply_to_*]]` tags फिर भी सम्मानित किए जाते हैं।

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    Forum supergroups:

    - topic session keys में `:topic:<threadId>` जुड़ता है
    - replies और typing topic thread को target करते हैं
    - topic config path:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    General topic (`threadId=1`) special-case:

    - message sends `message_thread_id` छोड़ देते हैं (Telegram `sendMessage(...thread_id=1)` को reject करता है)
    - typing actions फिर भी `message_thread_id` शामिल करते हैं

    Topic inheritance: topic entries group settings को inherit करती हैं जब तक override न किया जाए (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)।
    `agentId` केवल topic के लिए है और group defaults से inherit नहीं करता।
    `topics."*"` उस group के हर topic के लिए defaults सेट करता है; exact topic IDs फिर भी `"*"` से अधिक प्राथमिकता रखते हैं।

    **प्रति-topic agent routing**: हर topic, topic config में `agentId` सेट करके अलग agent को route कर सकता है। इससे हर topic को अपना isolated workspace, memory, और session मिलता है। उदाहरण:

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

    फिर हर topic की अपनी session key होती है: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistent ACP topic binding**: Forum topics top-level typed ACP bindings (`bindings[]` जिसमें `type: "acp"` और `match.channel: "telegram"`, `peer.kind: "group"`, और `-1001234567890:topic:42` जैसी topic-qualified id हो) के माध्यम से ACP harness sessions pin कर सकते हैं। फ़िलहाल groups/supergroups में forum topics तक scoped है। देखें [ACP Agents](/hi/tools/acp-agents)।

    **Chat से thread-bound ACP spawn**: `/acp spawn <agent> --thread here|auto` current topic को नए ACP session से bind करता है; follow-ups सीधे वहीं route होते हैं। OpenClaw spawn confirmation को in-topic pin करता है। `channels.telegram.threadBindings.spawnSessions` enabled रहना आवश्यक है (डिफ़ॉल्ट: `true`)।

    Template context `MessageThreadId` और `IsForum` expose करता है। `message_thread_id` वाली DM chats reply metadata रखती हैं; वे thread-aware session keys केवल तब उपयोग करती हैं जब Telegram `getMe` bot के लिए `has_topics_enabled: true` report करता है।
    पुराने `dm.threadReplies` और `direct.*.threadReplies` overrides जानबूझकर retired हैं; BotFather threaded mode को single source of truth के रूप में उपयोग करें और stale config keys हटाने के लिए `openclaw doctor --fix` चलाएं।

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Audio messages

    Telegram voice notes और audio files में अंतर करता है।

    - डिफ़ॉल्ट: audio file behavior
    - voice-note send force करने के लिए agent reply में tag `[[audio_as_voice]]`
    - inbound voice-note transcripts को agent context में machine-generated,
      untrusted text के रूप में frame किया जाता है; mention detection फिर भी raw
      transcript का उपयोग करता है ताकि mention-gated voice messages काम करते रहें।

    Message action उदाहरण:

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

    - static WEBP: डाउनलोड और प्रोसेस किया गया (placeholder `<media:sticker>`)
    - animated TGS: छोड़ा गया
    - video WEBM: छोड़ा गया

    स्टिकर संदर्भ फ़ील्ड:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    बार-बार vision कॉल कम करने के लिए स्टिकर विवरण OpenClaw SQLite Plugin स्टेट में कैश किए जाते हैं।

    स्टिकर कार्रवाइयां सक्षम करें:

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

  <Accordion title="प्रतिक्रिया सूचनाएं">
    Telegram प्रतिक्रियाएं `message_reaction` अपडेट के रूप में आती हैं (संदेश payloads से अलग)।

    सक्षम होने पर, OpenClaw इस तरह के सिस्टम इवेंट कतार में डालता है:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    कॉन्फ़िग:

    - `channels.telegram.reactionNotifications`: `off | own | all` (डिफ़ॉल्ट: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (डिफ़ॉल्ट: `minimal`)

    नोट्स:

    - `own` का अर्थ है केवल bot द्वारा भेजे गए संदेशों पर उपयोगकर्ता प्रतिक्रियाएं (भेजे गए संदेश कैश के माध्यम से best-effort)।
    - प्रतिक्रिया इवेंट फिर भी Telegram एक्सेस नियंत्रणों (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) का पालन करते हैं; अनधिकृत प्रेषक हटा दिए जाते हैं।
    - Telegram प्रतिक्रिया अपडेट में thread IDs प्रदान नहीं करता।
      - non-forum groups समूह चैट सत्र पर रूट होते हैं
      - forum groups समूह के general-topic सत्र (`:topic:1`) पर रूट होते हैं, सटीक मूल topic पर नहीं

    polling/Webhook के लिए `allowed_updates` में `message_reaction` अपने आप शामिल होता है।

  </Accordion>

  <Accordion title="Ack प्रतिक्रियाएं">
    जब OpenClaw किसी आने वाले संदेश को प्रोसेस कर रहा होता है, तो `ackReaction` एक acknowledgement emoji भेजता है। `ackReactionScope` तय करता है कि वह emoji वास्तव में *कब* भेजा जाता है।

    **Emoji (`ackReaction`) समाधान क्रम:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji fallback (`agents.list[].identity.emoji`, अन्यथा "👀")

    नोट्स:

    - Telegram unicode emoji की अपेक्षा करता है (उदाहरण के लिए "👀")।
    - किसी channel या account के लिए प्रतिक्रिया अक्षम करने हेतु `""` का उपयोग करें।

    **Scope (`messages.ackReactionScope`):**

    Telegram provider scope को `messages.ackReactionScope` से पढ़ता है (डिफ़ॉल्ट `"group-mentions"`)। आज कोई Telegram-account या Telegram-channel-level override नहीं है।

    मान: `"all"` (DMs + groups), `"direct"` (केवल DMs), `"group-all"` (हर group message, DMs नहीं), `"group-mentions"` (groups जब bot का उल्लेख हो; **DMs नहीं** — यह डिफ़ॉल्ट है), `"off"` / `"none"` (अक्षम)।

    <Note>
    डिफ़ॉल्ट scope (`"group-mentions"`) direct messages में ack reactions नहीं चलाता। आने वाले Telegram DMs पर ack reaction पाने के लिए, `messages.ackReactionScope` को `"direct"` या `"all"` पर सेट करें। मान Telegram provider startup पर पढ़ा जाता है, इसलिए बदलाव प्रभावी करने के लिए Gateway restart आवश्यक है।
    </Note>

  </Accordion>

  <Accordion title="Telegram इवेंट और कमांड से कॉन्फ़िग लेखन">
    Channel config writes डिफ़ॉल्ट रूप से सक्षम होते हैं (`configWrites !== false`)।

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

  <Accordion title="Long polling बनाम Webhook">
    डिफ़ॉल्ट long polling है। Webhook मोड के लिए `channels.telegram.webhookUrl` और `channels.telegram.webhookSecret` सेट करें; वैकल्पिक `webhookPath`, `webhookHost`, `webhookPort` (डिफ़ॉल्ट `/telegram-webhook`, `127.0.0.1`, `8787`)।

    long-polling मोड में OpenClaw अपना restart watermark केवल किसी update के सफलतापूर्वक dispatch होने के बाद persist करता है। यदि कोई handler विफल होता है, तो वह update उसी process में retryable रहता है और restart dedupe के लिए completed के रूप में नहीं लिखा जाता।

    local listener `127.0.0.1:8787` से bind होता है। public ingress के लिए, या तो local port के सामने reverse proxy लगाएं या जानबूझकर `webhookHost: "0.0.0.0"` सेट करें।

    Webhook मोड Telegram को `200` लौटाने से पहले request guards, Telegram secret token, और JSON body को validate करता है।
    फिर OpenClaw update को long polling द्वारा उपयोग की जाने वाली उसी per-chat/per-topic bot lanes के माध्यम से asynchronously प्रोसेस करता है, इसलिए धीमे agent turns Telegram के delivery ACK को रोकते नहीं हैं।

  </Accordion>

  <Accordion title="सीमाएं, पुनः प्रयास, और CLI लक्ष्य">
    - `channels.telegram.textChunkLimit` का डिफ़ॉल्ट 4000 है.
    - `channels.telegram.chunkMode="newline"` लंबाई के आधार पर विभाजन से पहले अनुच्छेद सीमाओं (खाली पंक्तियों) को प्राथमिकता देता है.
    - `channels.telegram.mediaMaxMb` (डिफ़ॉल्ट 100) आने वाले और जाने वाले Telegram मीडिया आकार को सीमित करता है.
    - `channels.telegram.mediaGroupFlushMs` (डिफ़ॉल्ट 500) नियंत्रित करता है कि OpenClaw द्वारा Telegram एल्बम/मीडिया समूहों को एक इनबाउंड संदेश के रूप में भेजने से पहले उन्हें कितनी देर बफ़र किया जाता है. यदि एल्बम के हिस्से देर से आते हैं तो इसे बढ़ाएं; एल्बम जवाब विलंबता घटाने के लिए इसे घटाएं.
    - `channels.telegram.timeoutSeconds` Telegram API क्लाइंट टाइमआउट को ओवरराइड करता है (यदि सेट नहीं है, तो grammY डिफ़ॉल्ट लागू होता है). Bot क्लाइंट कॉन्फ़िगर किए गए मानों को 60-सेकंड आउटबाउंड टेक्स्ट/टाइपिंग अनुरोध गार्ड से नीचे सीमित करते हैं ताकि grammY, OpenClaw के ट्रांसपोर्ट गार्ड और fallback के चलने से पहले दृश्य जवाब डिलीवरी को रोक न दे. Long polling अब भी 45-सेकंड `getUpdates` अनुरोध गार्ड का उपयोग करता है ताकि निष्क्रिय polls को अनिश्चितकाल तक छोड़ा न जाए.
    - `channels.telegram.pollingStallThresholdMs` का डिफ़ॉल्ट `120000` है; केवल false-positive polling-stall restart के लिए `30000` और `600000` के बीच ट्यून करें.
    - समूह संदर्भ इतिहास `channels.telegram.historyLimit` या `messages.groupChat.historyLimit` (डिफ़ॉल्ट 50) का उपयोग करता है; `0` अक्षम करता है.
    - reply/quote/forward पूरक संदर्भ को एक चुनी हुई बातचीत संदर्भ विंडो में सामान्यीकृत किया जाता है जब Gateway ने parent संदेश देखे हों; observed-message cache OpenClaw SQLite plugin state में रहता है, और `openclaw doctor --fix` legacy sidecars को आयात करता है. Telegram updates में केवल एक shallow `reply_to_message` शामिल करता है, इसलिए cache से पुरानी chains Telegram के मौजूदा update payload तक सीमित होती हैं.
    - Telegram allowlists मुख्य रूप से यह नियंत्रित करती हैं कि agent को कौन trigger कर सकता है, वे पूर्ण supplemental-context redaction boundary नहीं हैं.
    - DM इतिहास नियंत्रण:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config recoverable outbound API errors के लिए Telegram send helpers (CLI/tools/actions) पर लागू होता है. Inbound final-reply delivery भी Telegram pre-connect failures के लिए bounded safe-send retry का उपयोग करती है, लेकिन यह ambiguous post-send network envelopes पर retry नहीं करती, जिनसे visible messages duplicate हो सकते हैं.

    CLI और message-tool send targets numeric chat ID, username, या forum topic target हो सकते हैं:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram polls `openclaw message poll` का उपयोग करते हैं और forum topics को support करते हैं:

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
    - `--thread-id` forum topics के लिए (या `:topic:` target का उपयोग करें)

    Telegram send यह भी support करता है:

    - `--presentation` के साथ `buttons` blocks inline keyboards के लिए, जब `channels.telegram.capabilities.inlineButtons` इसकी अनुमति देता है
    - `--pin` या `--delivery '{"pin":true}'` pinned delivery का अनुरोध करने के लिए, जब bot उस chat में pin कर सकता है
    - `--force-document` आउटबाउंड images, GIFs, और videos को compressed photo, animated-media, या video uploads के बजाय documents के रूप में भेजने के लिए

    Action gating:

    - `channels.telegram.actions.sendMessage=false` polls सहित outbound Telegram messages को अक्षम करता है
    - `channels.telegram.actions.poll=false` regular sends को enabled रखते हुए Telegram poll creation को अक्षम करता है

  </Accordion>

  <Accordion title="Telegram में निष्पादन अनुमोदन">
    Telegram approver DMs में exec approvals को support करता है और वैकल्पिक रूप से originating chat या topic में prompts post कर सकता है. Approvers numeric Telegram user IDs होने चाहिए.

    Config path:

    - `channels.telegram.execApprovals.enabled` (जब कम से कम एक approver resolvable हो तो auto-enable होता है)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` से numeric owner IDs पर fallback करता है)
    - `channels.telegram.execApprovals.target`: `dm` (डिफ़ॉल्ट) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, और `defaultTo` नियंत्रित करते हैं कि bot से कौन बात कर सकता है और वह सामान्य replies कहां भेजता है. वे किसी को exec approver नहीं बनाते. पहला approved DM pairing `commands.ownerAllowFrom` को bootstrap करता है जब अभी तक कोई command owner मौजूद नहीं होता, इसलिए one-owner setup अब भी `execApprovals.approvers` के तहत IDs duplicate किए बिना काम करता है.

    Channel delivery chat में command text दिखाती है; `channel` या `both` को केवल trusted groups/topics में enable करें. जब prompt किसी forum topic में आता है, OpenClaw approval prompt और follow-up के लिए topic को सुरक्षित रखता है. Exec approvals डिफ़ॉल्ट रूप से 30 मिनट बाद expire हो जाते हैं.

    Inline approval buttons के लिए भी `channels.telegram.capabilities.inlineButtons` का target surface (`dm`, `group`, या `all`) allow करना आवश्यक है. `plugin:` prefix वाले Approval IDs plugin approvals के माध्यम से resolve होते हैं; अन्य पहले exec approvals के माध्यम से resolve होते हैं.

    देखें [निष्पादन अनुमोदन](/hi/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Error reply controls

जब agent को delivery या provider error मिलता है, तो error policy नियंत्रित करती है कि error messages Telegram chat में भेजे जाएं या नहीं:

| कुंजी                               | मान                        | डिफ़ॉल्ट        | विवरण                                                                                                                                                                                                    |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — हर error message chat में भेजें. `once` — प्रत्येक unique error message को cooldown window में एक बार भेजें (बार-बार आने वाली identical errors को suppress करें). `silent` — error messages कभी chat में न भेजें. |
| `channels.telegram.errorCooldownMs` | संख्या (ms)               | `14400000` (4h) | `once` policy के लिए cooldown window. Error भेजे जाने के बाद, वही error message इस interval के बीतने तक suppress रहता है. Outages के दौरान error spam रोकता है.                                      |

Per-account, per-group, और per-topic overrides supported हैं (अन्य Telegram config keys जैसी inheritance).

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
  <Accordion title="Bot non mention group messages का जवाब नहीं देता">

    - यदि `requireMention=false`, तो Telegram privacy mode को full visibility allow करनी चाहिए.
      - BotFather: `/setprivacy` -> Disable
      - फिर bot को group से हटाकर दोबारा जोड़ें
    - जब config unmentioned group messages की अपेक्षा करता है, तो `openclaw channels status` चेतावनी देता है.
    - `openclaw channels status --probe` explicit numeric group IDs जांच सकता है; wildcard `"*"` को membership-probe नहीं किया जा सकता.
    - quick session test: `/activation always`.

  </Accordion>

  <Accordion title="Bot group messages बिल्कुल नहीं देख रहा">

    - जब `channels.telegram.groups` मौजूद हो, group listed होना चाहिए (या `"*"` शामिल करें)
    - group में bot membership verify करें
    - skip reasons के लिए logs देखें: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Commands आंशिक रूप से काम करते हैं या बिल्कुल नहीं">

    - अपनी sender identity authorize करें (pairing और/या numeric `allowFrom`)
    - command authorization अब भी लागू होता है, भले ही group policy `open` हो
    - `setMyCommands failed` के साथ `BOT_COMMANDS_TOO_MUCH` का मतलब है कि native menu में बहुत अधिक entries हैं; plugin/skill/custom commands घटाएं या native menus disable करें
    - `deleteMyCommands` / `setMyCommands` startup calls और `sendChatAction` typing calls bounded हैं और request timeout पर Telegram के transport fallback के माध्यम से एक बार retry करते हैं. Persistent network/fetch errors आमतौर पर `api.telegram.org` तक DNS/HTTPS reachability issues दिखाते हैं

  </Accordion>

  <Accordion title="Startup unauthorized token report करता है">

    - `getMe returned 401` configured bot token के लिए Telegram authentication failure है.
    - BotFather में bot token दोबारा copy या regenerate करें, फिर default account के लिए `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, या `TELEGRAM_BOT_TOKEN` update करें.
    - Startup के दौरान `deleteWebhook 401 Unauthorized` भी auth failure है; इसे "no webhook exists" मानना उसी bad-token failure को बाद के API calls तक टाल देगा.

  </Accordion>

  <Accordion title="Polling या network instability">

    - Node 22+ + custom fetch/proxy immediate abort behavior trigger कर सकता है यदि AbortSignal types mismatch हों.
    - कुछ hosts `api.telegram.org` को पहले IPv6 में resolve करते हैं; broken IPv6 egress intermittent Telegram API failures पैदा कर सकता है.
    - यदि logs में `TypeError: fetch failed` या `Network request for 'getUpdates' failed!` शामिल हो, तो OpenClaw अब इन्हें recoverable network errors के रूप में retry करता है.
    - Polling startup के दौरान, OpenClaw grammY के लिए successful startup `getMe` probe reuse करता है ताकि runner को पहले `getUpdates` से पहले दूसरे `getMe` की जरूरत न पड़े.
    - यदि polling startup के दौरान `deleteWebhook` transient network error के साथ fail होता है, तो OpenClaw दूसरा pre-poll control-plane call करने के बजाय long polling में continue करता है. अब भी active webhook `getUpdates` conflict के रूप में सामने आता है; फिर OpenClaw Telegram transport rebuild करता है और webhook cleanup retry करता है.
    - यदि Telegram sockets छोटे fixed cadence पर recycle होते हैं, तो low `channels.telegram.timeoutSeconds` जांचें; bot clients configured values को outbound और `getUpdates` request guards से नीचे clamp करते हैं, लेकिन पुराने releases हर poll या reply abort कर सकते थे जब इसे उन guards से नीचे set किया गया था.
    - यदि logs में `Polling stall detected` शामिल हो, तो OpenClaw डिफ़ॉल्ट रूप से completed long-poll liveness के बिना 120 seconds के बाद polling restart करता है और Telegram transport rebuild करता है.
    - `openclaw channels status --probe` और `openclaw doctor` चेतावनी देते हैं जब कोई running polling account startup grace के बाद `getUpdates` complete नहीं कर पाया हो, जब कोई running webhook account startup grace के बाद `setWebhook` complete नहीं कर पाया हो, या जब last successful polling transport activity stale हो.
    - `channels.telegram.pollingStallThresholdMs` केवल तब बढ़ाएं जब long-running `getUpdates` calls healthy हों लेकिन आपका host फिर भी false polling-stall restarts report करता हो. Persistent stalls आमतौर पर host और `api.telegram.org` के बीच proxy, DNS, IPv6, या TLS egress issues की ओर इशारा करते हैं.
    - Telegram Bot API transport के लिए process proxy env का भी सम्मान करता है, जिसमें `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, और उनके lowercase variants शामिल हैं. `NO_PROXY` / `no_proxy` अब भी `api.telegram.org` को bypass कर सकते हैं.
    - यदि OpenClaw managed proxy service environment के लिए `OPENCLAW_PROXY_URL` के माध्यम से configured है और कोई standard proxy env मौजूद नहीं है, तो Telegram भी Bot API transport के लिए उस URL का उपयोग करता है.
    - unstable direct egress/TLS वाले VPS hosts पर, Telegram API calls को `channels.telegram.proxy` के माध्यम से route करें:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ में `autoSelectFamily=true` डिफ़ॉल्ट होता है (WSL2 को छोड़कर)। Telegram DNS परिणाम क्रम पहले `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, फिर `channels.telegram.network.dnsResultOrder`, फिर प्रक्रिया डिफ़ॉल्ट जैसे `NODE_OPTIONS=--dns-result-order=ipv4first` का पालन करता है; यदि कोई लागू नहीं होता, तो Node 22+ `ipv4first` पर वापस जाता है।
    - यदि आपका होस्ट WSL2 है या स्पष्ट रूप से केवल-IPv4 व्यवहार के साथ बेहतर काम करता है, तो family चयन बाध्य करें:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 benchmark-range उत्तर (`198.18.0.0/15`) Telegram मीडिया डाउनलोड के लिए
      डिफ़ॉल्ट रूप से पहले से अनुमत हैं। यदि कोई भरोसेमंद fake-IP या
      पारदर्शी proxy मीडिया डाउनलोड के दौरान `api.telegram.org` को किसी अन्य
      निजी/आंतरिक/special-use पते में फिर से लिखता है, तो आप केवल-Telegram बायपास
      के लिए opt in कर सकते हैं:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - यही opt-in प्रति खाते पर
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` में उपलब्ध है।
    - यदि आपका proxy Telegram मीडिया hosts को `198.18.x.x` में resolve करता है, तो पहले
      dangerous flag बंद रखें। Telegram मीडिया पहले से ही RFC 2544
      benchmark range को डिफ़ॉल्ट रूप से अनुमति देता है।

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` Telegram
      मीडिया SSRF सुरक्षा को कमजोर करता है। इसे केवल Clash, Mihomo, या Surge fake-IP routing जैसे
      भरोसेमंद operator-controlled proxy environments के लिए उपयोग करें, जब वे
      RFC 2544 benchmark range के बाहर private या special-use उत्तर synthesize करते हैं।
      सामान्य सार्वजनिक internet Telegram access के लिए इसे बंद रखें।
    </Warning>

    - Environment overrides (अस्थायी):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS उत्तर validate करें:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

अधिक सहायता: [Channel troubleshooting](/hi/channels/troubleshooting).

## Configuration reference

प्राथमिक reference: [Configuration reference - Telegram](/hi/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` को नियमित file की ओर point करना चाहिए; symlinks अस्वीकार किए जाते हैं)
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
Multi-account precedence: जब दो या अधिक account IDs configured हों, तो default routing को स्पष्ट बनाने के लिए `channels.telegram.defaultAccount` सेट करें (या `channels.telegram.accounts.default` शामिल करें)। अन्यथा OpenClaw पहले normalized account ID पर fallback करता है और `openclaw doctor` चेतावनी देता है। Named accounts `channels.telegram.allowFrom` / `groupAllowFrom` inherit करते हैं, लेकिन `accounts.default.*` values नहीं।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Telegram उपयोगकर्ता को Gateway से pair करें।
  </Card>
  <Card title="Groups" icon="users" href="/hi/channels/groups">
    Group और topic allowlist व्यवहार।
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
