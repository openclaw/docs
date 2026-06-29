---
read_when:
    - Telegram सुविधाओं या Webhook पर काम करना
summary: Telegram bot समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Telegram
x-i18n:
    generated_at: "2026-06-28T22:40:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

Production-ready for bot DMs and groups via grammY. Long polling is the default mode; webhook mode is optional.

<CardGroup cols={3}>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    Telegram के लिए डिफ़ॉल्ट DM नीति पेयरिंग है।
  </Card>
  <Card title="चैनल समस्या निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल निदान और मरम्मत प्लेबुक।
  </Card>
  <Card title="Gateway कॉन्फ़िगरेशन" icon="settings" href="/hi/gateway/configuration">
    पूर्ण चैनल कॉन्फ़िग पैटर्न और उदाहरण।
  </Card>
</CardGroup>

## त्वरित सेटअप

<Steps>
  <Step title="BotFather में bot token बनाएं">
    Telegram खोलें और **@BotFather** से चैट करें (पुष्टि करें कि हैंडल ठीक `@BotFather` है)।

    `/newbot` चलाएं, संकेतों का पालन करें, और token सहेजें।

  </Step>

  <Step title="token और DM नीति कॉन्फ़िगर करें">

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

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (केवल डिफ़ॉल्ट खाता)।
    Telegram `openclaw channels login telegram` का उपयोग **नहीं** करता; config/env में token कॉन्फ़िगर करें, फिर gateway शुरू करें।

  </Step>

  <Step title="gateway शुरू करें और पहला DM अनुमोदित करें">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    पेयरिंग कोड 1 घंटे बाद समाप्त हो जाते हैं।

  </Step>

  <Step title="bot को समूह में जोड़ें">
    bot को अपने समूह में जोड़ें, फिर वे दोनों ID प्राप्त करें जिनकी समूह पहुंच को ज़रूरत है:

    - आपका Telegram उपयोगकर्ता ID, जिसका उपयोग `allowFrom` / `groupAllowFrom` में होता है
    - Telegram समूह chat ID, जिसका उपयोग `channels.telegram.groups` के अंतर्गत key के रूप में होता है

    पहली बार सेटअप के लिए, समूह chat ID `openclaw logs --follow`, किसी forwarded-ID bot, या Bot API `getUpdates` से प्राप्त करें। समूह को अनुमति मिलने के बाद, `/whoami@<bot_username>` उपयोगकर्ता और समूह ID की पुष्टि कर सकता है।

    `-100` से शुरू होने वाले नकारात्मक Telegram supergroup ID समूह chat ID होते हैं। उन्हें `groupAllowFrom` के अंतर्गत नहीं, बल्कि `channels.telegram.groups` के अंतर्गत रखें।

  </Step>
</Steps>

<Note>
token समाधान क्रम खाता-सचेत है। व्यवहार में, config मान env fallback पर प्राथमिकता लेते हैं, और `TELEGRAM_BOT_TOKEN` केवल डिफ़ॉल्ट खाते पर लागू होता है।
सफल startup के बाद, OpenClaw bot पहचान को state directory में 24 घंटे तक cache करता है ताकि restart अतिरिक्त Telegram `getMe` call से बच सकें; token बदलने या हटाने से वह cache साफ़ हो जाता है।
</Note>

## Telegram पक्ष की सेटिंग

<AccordionGroup>
  <Accordion title="Privacy mode और समूह दृश्यता">
    Telegram bots डिफ़ॉल्ट रूप से **Privacy Mode** में होते हैं, जो यह सीमित करता है कि उन्हें कौन से समूह संदेश मिलते हैं।

    यदि bot को सभी समूह संदेश देखने ही हैं, तो इनमें से कोई एक करें:

    - `/setprivacy` के माध्यम से privacy mode अक्षम करें, या
    - bot को समूह admin बनाएं।

    privacy mode toggle करते समय, प्रत्येक समूह में bot को हटाकर फिर से जोड़ें ताकि Telegram बदलाव लागू करे।

  </Accordion>

  <Accordion title="समूह अनुमतियां">
    Admin स्थिति Telegram समूह सेटिंग में नियंत्रित होती है।

    Admin bots को सभी समूह संदेश मिलते हैं, जो हमेशा-सक्रिय समूह व्यवहार के लिए उपयोगी है।

  </Accordion>

  <Accordion title="उपयोगी BotFather toggles">

    - समूह में जोड़े जाने की अनुमति/मनाही के लिए `/setjoingroups`
    - समूह दृश्यता व्यवहार के लिए `/setprivacy`

  </Accordion>
</AccordionGroup>

## पहुंच नियंत्रण और सक्रियण

### समूह bot पहचान

Telegram समूहों और forum topics में, कॉन्फ़िगर किए गए bot handle (उदाहरण के लिए `@my_bot`) का स्पष्ट mention चयनित OpenClaw agent को संबोधित करने के रूप में माना जाता है, भले ही agent persona name Telegram username से अलग हो। समूह silence policy असंबंधित समूह traffic पर फिर भी लागू होती है, लेकिन bot handle स्वयं "कोई और" नहीं माना जाता।

<Tabs>
  <Tab title="DM नीति">
    `channels.telegram.dmPolicy` direct message access नियंत्रित करता है:

    - `pairing` (डिफ़ॉल्ट)
    - `allowlist` (`allowFrom` में कम से कम एक sender ID आवश्यक)
    - `open` (`allowFrom` में `"*"` शामिल होना आवश्यक)
    - `disabled`

    `allowFrom: ["*"]` के साथ `dmPolicy: "open"` किसी भी Telegram खाते को, जो bot username ढूंढता या अनुमान लगाता है, bot को command देने देता है। इसका उपयोग केवल जानबूझकर public bots के लिए करें जिनके tools कड़ाई से प्रतिबंधित हों; one-owner bots को numeric user IDs के साथ `allowlist` का उपयोग करना चाहिए।

    `channels.telegram.allowFrom` numeric Telegram user IDs स्वीकार करता है। `telegram:` / `tg:` prefixes स्वीकार किए जाते हैं और normalized होते हैं।
    multi-account configs में, restrictive top-level `channels.telegram.allowFrom` को safety boundary माना जाता है: account-level `allowFrom: ["*"]` entries उस account को public नहीं बनातीं जब तक effective account allowlist में merging के बाद भी explicit wildcard न हो।
    खाली `allowFrom` के साथ `dmPolicy: "allowlist"` सभी DMs को block करता है और config validation द्वारा reject किया जाता है।
    Setup केवल numeric user IDs पूछता है।
    यदि आपने upgrade किया है और आपके config में `@username` allowlist entries हैं, तो उन्हें resolve करने के लिए `openclaw doctor --fix` चलाएं (best-effort; Telegram bot token आवश्यक)।
    यदि आप पहले pairing-store allowlist files पर निर्भर थे, तो `openclaw doctor --fix` allowlist flows में entries को `channels.telegram.allowFrom` में recover कर सकता है (उदाहरण के लिए जब `dmPolicy: "allowlist"` में अभी explicit IDs न हों)।

    one-owner bots के लिए, access policy को config में टिकाऊ रखने के लिए explicit numeric `allowFrom` IDs के साथ `dmPolicy: "allowlist"` को प्राथमिकता दें (previous pairing approvals पर निर्भर रहने के बजाय)।

    सामान्य भ्रम: DM pairing approval का अर्थ "यह sender हर जगह authorized है" नहीं है।
    Pairing DM access देती है। यदि अभी तक कोई command owner मौजूद नहीं है, तो पहली approved pairing `commands.ownerAllowFrom` भी set करती है ताकि owner-only commands और exec approvals के पास explicit operator account हो।
    Group sender authorization फिर भी explicit config allowlists से आता है।
    यदि आप चाहते हैं "मैं एक बार authorized हूं और DMs तथा group commands दोनों काम करें", तो अपना numeric Telegram user ID `channels.telegram.allowFrom` में रखें; owner-only commands के लिए, सुनिश्चित करें कि `commands.ownerAllowFrom` में `telegram:<your user id>` शामिल हो।

    ### अपना Telegram user ID ढूंढना

    अधिक सुरक्षित (बिना third-party bot):

    1. अपने bot को DM करें।
    2. `openclaw logs --follow` चलाएं।
    3. `from.id` पढ़ें।

    Official Bot API method:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Third-party method (कम private): `@userinfobot` या `@getidsbot`।

  </Tab>

  <Tab title="समूह नीति और allowlists">
    दो controls साथ में लागू होते हैं:

    1. **कौन से समूह allowed हैं** (`channels.telegram.groups`)
       - कोई `groups` config नहीं:
         - `groupPolicy: "open"` के साथ: कोई भी समूह group-ID checks pass कर सकता है
         - `groupPolicy: "allowlist"` (डिफ़ॉल्ट) के साथ: समूह तब तक blocked रहते हैं जब तक आप `groups` entries (या `"*"`) नहीं जोड़ते
       - `groups` configured: allowlist के रूप में कार्य करता है (explicit IDs या `"*"`)

    2. **समूहों में कौन से senders allowed हैं** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (डिफ़ॉल्ट)
       - `disabled`

    `groupAllowFrom` का उपयोग group sender filtering के लिए होता है। यदि set नहीं है, तो Telegram `allowFrom` पर fallback करता है।
    `groupAllowFrom` entries numeric Telegram user IDs होनी चाहिए (`telegram:` / `tg:` prefixes normalized होते हैं)।
    Telegram group या supergroup chat IDs को `groupAllowFrom` में न रखें। Negative chat IDs `channels.telegram.groups` के अंतर्गत आते हैं।
    Non-numeric entries sender authorization के लिए ignored होती हैं।
    Security boundary (`2026.2.25+`): group sender auth DM pairing-store approvals को inherit **नहीं** करता।
    Pairing केवल DM-only रहती है। समूहों के लिए, `groupAllowFrom` या per-group/per-topic `allowFrom` set करें।
    यदि `groupAllowFrom` unset है, तो Telegram config `allowFrom` पर fallback करता है, pairing store पर नहीं।
    one-owner bots के लिए practical pattern: अपना user ID `channels.telegram.allowFrom` में set करें, `groupAllowFrom` unset छोड़ें, और target groups को `channels.telegram.groups` के अंतर्गत allow करें।
    Runtime note: यदि `channels.telegram` पूरी तरह missing है, तो runtime fail-closed `groupPolicy="allowlist"` पर default करता है जब तक `channels.defaults.groupPolicy` स्पष्ट रूप से set न हो।

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

    इसे समूह से `@<bot_username> ping` के साथ test करें। `requireMention: true` रहते हुए सामान्य समूह messages bot को trigger नहीं करते।

    उदाहरण: एक specific group में किसी भी member को allow करें:

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

    उदाहरण: एक specific group के अंदर केवल specific users को allow करें:

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

      - `-1001234567890` जैसे negative Telegram group या supergroup chat IDs को `channels.telegram.groups` के अंतर्गत रखें।
      - जब आप यह limit करना चाहते हों कि allowed group के अंदर कौन लोग bot को trigger कर सकते हैं, तो `8734062810` जैसे Telegram user IDs को `groupAllowFrom` के अंतर्गत रखें।
      - `groupAllowFrom: ["*"]` का उपयोग केवल तब करें जब आप चाहते हों कि allowed group का कोई भी member bot से बात कर सके।

    </Warning>

  </Tab>

  <Tab title="Mention व्यवहार">
    Group replies को डिफ़ॉल्ट रूप से mention की आवश्यकता होती है।

    Mention इनमें से आ सकता है:

    - native `@botusername` mention, या
    - इनमें mention patterns:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Session-level command toggles:

    - `/activation always`
    - `/activation mention`

    ये केवल session state update करते हैं। persistence के लिए config का उपयोग करें।

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

    Group history context का default `mention-only` है: पिछले group messages
    केवल तब शामिल किए जाते हैं जब वे bot को addressed थे, bot के replies थे,
    या bot के अपने messages थे। trusted groups के लिए recent room history
    शामिल करने हेतु `includeGroupHistoryContext: "recent"` set करें। अगले turn
    के साथ कोई prior Telegram group history न भेजने के लिए
    `includeGroupHistoryContext: "none"` set करें।

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    group chat ID प्राप्त करना:

    - group message को `@userinfobot` / `@getidsbot` को forward करें
    - या `openclaw logs --follow` से `chat.id` पढ़ें
    - या Bot API `getUpdates` inspect करें
    - group allowed होने के बाद, यदि native commands enabled हैं तो `/whoami@<bot_username>` चलाएं

  </Tab>
</Tabs>

## Runtime व्यवहार

- Telegram का स्वामित्व Gateway प्रक्रिया के पास होता है।
- रूटिंग निर्धारक है: Telegram inbound उत्तर Telegram को ही वापस जाते हैं (मॉडल चैनल नहीं चुनता)।
- inbound संदेश साझा चैनल envelope में reply metadata, media placeholders, और Gateway द्वारा देखे गए Telegram replies के लिए persisted reply-chain context के साथ normalize होते हैं।
- समूह sessions समूह ID से अलग रखे जाते हैं। Forum topics topics को अलग रखने के लिए `:topic:<threadId>` जोड़ते हैं।
- DM संदेश `message_thread_id` ले जा सकते हैं; OpenClaw replies के लिए इसे सुरक्षित रखता है। DM topic sessions केवल तब विभाजित होते हैं जब Telegram `getMe` bot के लिए `has_topics_enabled: true` रिपोर्ट करता है; अन्यथा DMs flat session पर रहते हैं।
- Long polling per-chat/per-thread sequencing के साथ grammY runner का उपयोग करता है। Overall runner sink concurrency `agents.defaults.maxConcurrent` का उपयोग करती है।
- Multi-account startup समानांतर Telegram `getMe` probes को सीमित करता है ताकि बड़े bot fleets हर account probe को एक साथ fan out न करें।
- Long polling हर Gateway प्रक्रिया के अंदर संरक्षित होती है ताकि एक समय में केवल एक active poller bot token का उपयोग कर सके। यदि आपको फिर भी `getUpdates` 409 conflicts दिखते हैं, तो संभवतः कोई दूसरा OpenClaw Gateway, script, या external poller वही token उपयोग कर रहा है।
- Long-polling watchdog restarts default रूप से 120 seconds तक completed `getUpdates` liveness न होने पर trigger होते हैं। `channels.telegram.pollingStallThresholdMs` केवल तब बढ़ाएँ जब आपका deployment लंबे समय तक चलने वाले काम के दौरान अब भी false polling-stall restarts देखता हो। value milliseconds में है और `30000` से `600000` तक allowed है; per-account overrides समर्थित हैं।
- Telegram Bot API में read-receipt support नहीं है (`sendReadReceipts` लागू नहीं होता)।

<Note>
  `channels.telegram.dm.threadReplies` और `channels.telegram.direct.<chatId>.threadReplies` हटा दिए गए थे। upgrade के बाद अगर आपकी config में अब भी ये keys हैं, तो `openclaw doctor --fix` चलाएँ। DM topic routing अब Telegram `getMe.has_topics_enabled` से मिलने वाली bot capability का पालन करती है, जिसे BotFather threaded mode नियंत्रित करता है: topics-enabled bots thread-scoped DM sessions का उपयोग करते हैं जब Telegram `message_thread_id` भेजता है; अन्य DMs flat session पर रहते हैं।
</Note>

## Feature reference

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw partial replies को real time में stream कर सकता है:

    - direct chats: preview message + `editMessageText`
    - groups/topics: preview message + `editMessageText`

    आवश्यकता:

    - `channels.telegram.streaming` `off | partial | block | progress` है (default: `partial`)
    - छोटे initial answer previews debounced होते हैं, फिर run अब भी active होने पर bounded delay के बाद materialize किए जाते हैं
    - `progress` tool progress के लिए एक editable status draft रखता है, tool progress से पहले answer activity आने पर stable status label दिखाता है, completion पर इसे clear करता है, और final answer को सामान्य message के रूप में भेजता है
    - `streaming.preview.toolProgress` नियंत्रित करता है कि tool/progress updates वही edited preview message फिर से उपयोग करें या नहीं (default: `true` जब preview streaming active हो)
    - `streaming.preview.commandText` उन tool-progress lines के अंदर command/exec detail नियंत्रित करता है: `raw` (default, released behavior सुरक्षित रखता है) या `status` (केवल tool label)
    - `streaming.progress.commentary` (default: `false`) temporary progress draft में assistant commentary/preamble text को opt in करता है
    - legacy `channels.telegram.streamMode`, boolean `streaming` values, और retired native draft preview keys detect किए जाते हैं; उन्हें current streaming config में migrate करने के लिए `openclaw doctor --fix` चलाएँ

    Tool-progress preview updates वे छोटी status lines हैं जो tools चलने के दौरान दिखाई जाती हैं, उदाहरण के लिए command execution, file reads, planning updates, patch summaries, या Codex app-server mode में Codex preamble/commentary text। Telegram इन्हें default रूप से enabled रखता है ताकि `v2026.4.22` और बाद के released OpenClaw behavior से मेल रहे।

    answer text के लिए edited preview बनाए रखने लेकिन tool-progress lines छिपाने के लिए, set करें:

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

    tool-progress visible रखने लेकिन command/exec text छिपाने के लिए, set करें:

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

    `progress` mode का उपयोग करें जब आप final answer को उसी message में edit किए बिना visible tool progress चाहते हों। command-text policy को `streaming.progress` के अंतर्गत रखें:

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

    `streaming.mode: "off"` का उपयोग केवल तब करें जब आप final-only delivery चाहते हों: Telegram preview edits disabled होते हैं और generic tool/progress chatter को standalone status messages के रूप में भेजने के बजाय suppress किया जाता है। Approval prompts, media payloads, और errors अब भी सामान्य final delivery से route होते हैं। `streaming.preview.toolProgress: false` का उपयोग तब करें जब आप tool-progress status lines छिपाते हुए केवल answer preview edits बनाए रखना चाहते हों।

    <Note>
      Telegram selected quote replies अपवाद हैं। जब `replyToMode` `"first"`, `"all"`, या `"batched"` हो और inbound message में selected quote text शामिल हो, OpenClaw answer preview को edit करने के बजाय Telegram के native quote-reply path से final answer भेजता है, इसलिए `streaming.preview.toolProgress` उस turn के लिए छोटी status lines नहीं दिखा सकता। selected quote text के बिना current-message replies अब भी preview streaming रखते हैं। जब tool-progress visibility native quote replies से अधिक महत्वपूर्ण हो, तो `replyToMode: "off"` set करें, या trade-off स्वीकार करने के लिए `streaming.preview.toolProgress: false` set करें।
    </Note>

    केवल text replies के लिए:

    - छोटे DM/group/topic previews: OpenClaw वही preview message रखता है और final edit in place करता है
    - लंबे text finals जो कई Telegram messages में split होते हैं, संभव होने पर existing preview को first final chunk के रूप में reuse करते हैं, फिर केवल remaining chunks भेजते हैं
    - progress-mode finals status draft clear करते हैं और draft को answer में edit करने के बजाय normal final delivery का उपयोग करते हैं
    - अगर completed text confirm होने से पहले final edit fail हो जाता है, OpenClaw normal final delivery का उपयोग करता है और stale preview clean up करता है

    complex replies के लिए (उदाहरण के लिए media payloads), OpenClaw normal final delivery पर fallback करता है और फिर preview message clean up करता है।

    Preview streaming block streaming से अलग है। जब Telegram के लिए block streaming explicitly enabled हो, OpenClaw double-streaming से बचने के लिए preview stream skip करता है।

    Reasoning stream behavior:

    - `/reasoning stream` supported channel के reasoning-preview path का उपयोग करता है; Telegram पर, यह generate करते समय reasoning को live preview में stream करता है
    - final delivery के बाद reasoning preview delete कर दिया जाता है; जब reasoning visible रहना चाहिए, `/reasoning on` का उपयोग करें
    - final answer reasoning text के बिना भेजा जाता है

  </Accordion>

  <Accordion title="Rich message formatting">
    Outbound text default रूप से standard Telegram HTML messages का उपयोग करता है ताकि replies current Telegram clients पर readable रहें। यह compatibility mode normal bold, italic, links, code, spoilers, और quotes को support करता है, लेकिन Bot API 10.1 rich-only blocks जैसे native tables, details, rich media, और formulas को नहीं।

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

    enabled होने पर:

    - agent को बताया जाता है कि इस bot/account के लिए Telegram rich messages available हैं।
    - Markdown text OpenClaw के Markdown IR से render होता है और Telegram rich HTML के रूप में भेजा जाता है।
    - Explicit rich HTML payloads supported Bot API 10.1 tags जैसे headings, tables, details, rich media, और formulas को preserve करते हैं।
    - Media captions अब भी Telegram HTML captions का उपयोग करते हैं क्योंकि rich messages captions को replace नहीं करते।

    यह model text को Telegram Rich Markdown sigils से दूर रखता है, इसलिए `$400-600K` जैसी currency math के रूप में parse नहीं होती। Long rich text automatically Telegram के rich text और rich block limits में split हो जाता है। Telegram की column limit से ऊपर की tables code blocks के रूप में भेजी जाती हैं।

    Default: client compatibility के लिए off। Rich messages को compatible Telegram clients चाहिए; कुछ current Desktop, Web, Android, और third-party clients accepted rich messages को unsupported के रूप में दिखाते हैं। जब तक bot के साथ उपयोग किए जाने वाले हर client उन्हें render न कर सके, इस option को disabled रखें। `/status` दिखाता है कि current Telegram session में rich messages on हैं या off।

    Link previews default रूप से enabled हैं। `channels.telegram.linkPreview: false` rich text के लिए automatic entity detection skip करता है।

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Telegram command menu registration startup पर `setMyCommands` से handle किया जाता है।

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

    - names normalized होते हैं (leading `/` strip, lowercase)
    - valid pattern: `a-z`, `0-9`, `_`, length `1..32`
    - custom commands native commands को override नहीं कर सकते
    - conflicts/duplicates skip और log किए जाते हैं

    Notes:

    - custom commands केवल menu entries हैं; वे behavior auto-implement नहीं करते
    - plugin/skill commands typed होने पर अब भी काम कर सकते हैं, भले ही Telegram menu में न दिखें

    यदि native commands disabled हैं, built-ins हटाए जाते हैं। Custom/plugin commands configured होने पर अब भी register हो सकते हैं।

    Common setup failures:

    - `BOT_COMMANDS_TOO_MUCH` के साथ `setMyCommands failed` का मतलब है कि trimming के बाद भी Telegram menu overflow हुआ; plugin/skill/custom commands घटाएँ या `channels.telegram.commands.native` disable करें।
    - direct Bot API curl commands काम करने के दौरान `deleteWebhook`, `deleteMyCommands`, या `setMyCommands` का `404: Not Found` के साथ fail होना यह बता सकता है कि `channels.telegram.apiRoot` full `/bot<TOKEN>` endpoint पर set था। `apiRoot` केवल Bot API root होना चाहिए, और `openclaw doctor --fix` accidental trailing `/bot<TOKEN>` हटाता है।
    - `getMe returned 401` का मतलब है कि Telegram ने configured bot token reject किया। current BotFather token के साथ `botToken`, `tokenFile`, या `TELEGRAM_BOT_TOKEN` update करें; OpenClaw polling से पहले रुक जाता है, इसलिए इसे webhook cleanup failure के रूप में report नहीं किया जाता।
    - network/fetch errors के साथ `setMyCommands failed` का मतलब आम तौर पर outbound DNS/HTTPS to `api.telegram.org` blocked है।

    ### Device pairing commands (`device-pair` plugin)

    जब `device-pair` plugin installed हो:

    1. `/pair` setup code generate करता है
    2. code iOS app में paste करें
    3. `/pair pending` pending requests list करता है (role/scopes सहित)
    4. request approve करें:
       - explicit approval के लिए `/pair approve <requestId>`
       - जब केवल एक pending request हो तो `/pair approve`
       - सबसे recent के लिए `/pair approve latest`

    setup code short-lived bootstrap token ले जाता है। Built-in setup-code bootstrap node-only है: पहली connect pending node request बनाती है, और approval के बाद Gateway `scopes: []` के साथ durable node token लौटाता है। यह handed-off operator token नहीं लौटाता; operator access के लिए अलग approved operator pairing या token flow चाहिए।

    यदि device changed auth details (उदाहरण के लिए role/scopes/public key) के साथ retry करता है, तो previous pending request supersede हो जाती है और new request अलग `requestId` का उपयोग करती है। approve करने से पहले `/pair pending` फिर से चलाएँ।

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

    लीगेसी `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` पर मैप होता है।

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

    Telegram `web_app` बटन केवल किसी उपयोगकर्ता और bot के बीच निजी चैट में काम करते हैं।

    कॉलबैक क्लिक एजेंट को टेक्स्ट के रूप में पास किए जाते हैं:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="एजेंट और ऑटोमेशन के लिए Telegram संदेश कार्रवाइयां">
    Telegram टूल कार्रवाइयों में शामिल हैं:

    - `sendMessage` (`to`, `content`, वैकल्पिक `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` या `caption`, वैकल्पिक `presentation` इनलाइन बटन; केवल-बटन संपादन रिप्लाई मार्कअप अपडेट करते हैं)
    - `createForumTopic` (`chatId`, `name`, वैकल्पिक `iconColor`, `iconCustomEmojiId`)

    चैनल संदेश कार्रवाइयां सुविधाजनक उपनाम उजागर करती हैं (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)।

    गेटिंग नियंत्रण:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (डिफ़ॉल्ट: अक्षम)

    नोट: `edit` और `topic-create` वर्तमान में डिफ़ॉल्ट रूप से सक्षम हैं और इनके लिए अलग `channels.telegram.actions.*` टॉगल नहीं हैं।
    रनटाइम भेजने की कार्रवाइयां सक्रिय कॉन्फ़िग/सीक्रेट्स स्नैपशॉट (स्टार्टअप/रीलोड) का उपयोग करती हैं, इसलिए कार्रवाई पथ हर भेजने पर तदर्थ SecretRef री-रिज़ॉल्यूशन नहीं करते।

    रिएक्शन हटाने की सिमेंटिक्स: [/tools/reactions](/hi/tools/reactions)

  </Accordion>

  <Accordion title="रिप्लाई थ्रेडिंग टैग">
    Telegram जनरेट किए गए आउटपुट में स्पष्ट रिप्लाई थ्रेडिंग टैग का समर्थन करता है:

    - `[[reply_to_current]]` ट्रिगर करने वाले संदेश का रिप्लाई करता है
    - `[[reply_to:<id>]]` किसी विशिष्ट Telegram संदेश ID का रिप्लाई करता है

    `channels.telegram.replyToMode` हैंडलिंग नियंत्रित करता है:

    - `off` (डिफ़ॉल्ट)
    - `first`
    - `all`

    जब रिप्लाई थ्रेडिंग सक्षम हो और मूल Telegram टेक्स्ट या कैप्शन उपलब्ध हो, OpenClaw अपने-आप एक नेटिव Telegram उद्धरण अंश शामिल करता है। Telegram नेटिव उद्धरण टेक्स्ट को 1024 UTF-16 कोड यूनिट तक सीमित करता है, इसलिए लंबे संदेशों को शुरुआत से उद्धृत किया जाता है और यदि Telegram उद्धरण अस्वीकार करता है तो साधारण रिप्लाई पर फ़ॉलबैक होता है।

    नोट: `off` निहित रिप्लाई थ्रेडिंग को अक्षम करता है। स्पष्ट `[[reply_to_*]]` टैग फिर भी मान्य रहते हैं।

  </Accordion>

  <Accordion title="फ़ोरम टॉपिक और थ्रेड व्यवहार">
    फ़ोरम सुपरग्रुप:

    - टॉपिक सेशन कुंजियां `:topic:<threadId>` जोड़ती हैं
    - रिप्लाई और टाइपिंग टॉपिक थ्रेड को लक्षित करते हैं
    - टॉपिक कॉन्फ़िग पथ:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    सामान्य टॉपिक (`threadId=1`) विशेष-केस:

    - संदेश भेजना `message_thread_id` छोड़ देता है (Telegram `sendMessage(...thread_id=1)` को अस्वीकार करता है)
    - टाइपिंग कार्रवाइयां फिर भी `message_thread_id` शामिल करती हैं

    टॉपिक इनहेरिटेंस: टॉपिक एंट्रियां समूह सेटिंग्स इनहेरिट करती हैं जब तक ओवरराइड न की जाएं (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)।
    `agentId` केवल-टॉपिक है और समूह डिफ़ॉल्ट से इनहेरिट नहीं होता।
    `topics."*"` उस समूह के हर टॉपिक के लिए डिफ़ॉल्ट सेट करता है; सटीक टॉपिक ID फिर भी `"*"` पर प्राथमिकता रखते हैं।

    **प्रति-टॉपिक एजेंट रूटिंग**: टॉपिक कॉन्फ़िग में `agentId` सेट करके हर टॉपिक किसी अलग एजेंट को रूट कर सकता है। इससे हर टॉपिक को अपना अलग वर्कस्पेस, मेमरी और सेशन मिलता है। उदाहरण:

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

    फिर हर टॉपिक की अपनी सेशन कुंजी होती है: `agent:zu:telegram:group:-1001234567890:topic:3`

    **स्थायी ACP टॉपिक बाइंडिंग**: फ़ोरम टॉपिक टॉप-लेवल टाइप्ड ACP बाइंडिंग (`bindings[]` जिसमें `type: "acp"` और `match.channel: "telegram"`, `peer.kind: "group"`, और `-1001234567890:topic:42` जैसी टॉपिक-योग्य ID हो) के माध्यम से ACP हार्नेस सेशन पिन कर सकते हैं। वर्तमान में समूहों/सुपरग्रुप में फ़ोरम टॉपिक तक सीमित। [ACP एजेंट](/hi/tools/acp-agents) देखें।

    **चैट से थ्रेड-बाउंड ACP स्पॉन**: `/acp spawn <agent> --thread here|auto` वर्तमान टॉपिक को नए ACP सेशन से बांधता है; आगे के संदेश सीधे वहीं रूट होते हैं। OpenClaw स्पॉन पुष्टि को टॉपिक में पिन करता है। `channels.telegram.threadBindings.spawnSessions` का सक्षम रहना आवश्यक है (डिफ़ॉल्ट: `true`)।

    टेम्पलेट संदर्भ `MessageThreadId` और `IsForum` उजागर करता है। `message_thread_id` वाली DM चैट रिप्लाई मेटाडेटा रखती हैं; वे थ्रेड-अवेयर सेशन कुंजियों का उपयोग केवल तब करती हैं जब Telegram `getMe` bot के लिए `has_topics_enabled: true` रिपोर्ट करता है।
    पुराने `dm.threadReplies` और `direct.*.threadReplies` ओवरराइड जानबूझकर हटाए गए हैं; BotFather थ्रेडेड मोड को सत्य का एकमात्र स्रोत मानें और पुराने कॉन्फ़िग कुंजियां हटाने के लिए `openclaw doctor --fix` चलाएं।

  </Accordion>

  <Accordion title="ऑडियो, वीडियो और स्टिकर">
    ### ऑडियो संदेश

    Telegram वॉयस नोट और ऑडियो फ़ाइलों में अंतर करता है।

    - डिफ़ॉल्ट: ऑडियो फ़ाइल व्यवहार
    - एजेंट रिप्लाई में टैग `[[audio_as_voice]]` वॉयस-नोट भेजने को बाध्य करता है
    - इनबाउंड वॉयस-नोट ट्रांसक्रिप्ट एजेंट संदर्भ में मशीन-जनरेटेड,
      अविश्वसनीय टेक्स्ट के रूप में फ़्रेम किए जाते हैं; मेंशन डिटेक्शन फिर भी कच्चे
      ट्रांसक्रिप्ट का उपयोग करता है ताकि मेंशन-गेटेड वॉयस संदेश काम करते रहें।

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

    बार-बार होने वाली vision calls को कम करने के लिए स्टिकर विवरण OpenClaw SQLite plugin स्थिति में कैश किए जाते हैं।

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

  <Accordion title="Reaction सूचनाएं">
    Telegram reactions `message_reaction` updates के रूप में आते हैं (संदेश payloads से अलग)।

    सक्षम होने पर, OpenClaw इस तरह के सिस्टम events queue में डालता है:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    कॉन्फ़िगरेशन:

    - `channels.telegram.reactionNotifications`: `off | own | all` (डिफ़ॉल्ट: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (डिफ़ॉल्ट: `minimal`)

    नोट्स:

    - `own` का मतलब केवल bot द्वारा भेजे गए संदेशों पर user reactions है (sent-message cache के माध्यम से best-effort)।
    - Reaction events अब भी Telegram access controls (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) का पालन करते हैं; अनधिकृत senders छोड़ दिए जाते हैं।
    - Telegram reaction updates में thread IDs नहीं देता।
      - non-forum groups group chat session पर route होते हैं
      - forum groups group general-topic session (`:topic:1`) पर route होते हैं, सटीक मूल topic पर नहीं

    polling/webhook के लिए `allowed_updates` में `message_reaction` अपने-आप शामिल होता है।

  </Accordion>

  <Accordion title="Ack reactions">
    जब OpenClaw किसी inbound message को process कर रहा होता है, तब `ackReaction` एक acknowledgement emoji भेजता है। `ackReactionScope` तय करता है कि वह emoji वास्तव में *कब* भेजा जाता है।

    **Emoji (`ackReaction`) resolution order:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji fallback (`agents.list[].identity.emoji`, अन्यथा "👀")

    नोट्स:

    - Telegram unicode emoji की अपेक्षा करता है (उदाहरण के लिए "👀")।
    - किसी channel या account के लिए reaction निष्क्रिय करने हेतु `""` का उपयोग करें।

    **Scope (`messages.ackReactionScope`):**

    Telegram provider scope को `messages.ackReactionScope` से पढ़ता है (डिफ़ॉल्ट `"group-mentions"`)। आज Telegram-account या Telegram-channel-level override नहीं है।

    मान: `"all"` (DMs + groups), `"direct"` (केवल DMs), `"group-all"` (हर group message, कोई DMs नहीं), `"group-mentions"` (groups में जब bot को mention किया जाए; **कोई DMs नहीं** — यही डिफ़ॉल्ट है), `"off"` / `"none"` (निष्क्रिय)।

    <Note>
    डिफ़ॉल्ट scope (`"group-mentions"`) direct messages में ack reactions trigger नहीं करता। inbound Telegram DMs पर ack reaction पाने के लिए, `messages.ackReactionScope` को `"direct"` या `"all"` पर सेट करें। मान Telegram provider startup पर पढ़ा जाता है, इसलिए बदलाव लागू करने के लिए gateway restart आवश्यक है।
    </Note>

  </Accordion>

  <Accordion title="Telegram events और commands से config writes">
    Channel config writes डिफ़ॉल्ट रूप से सक्षम हैं (`configWrites !== false`)।

    Telegram-triggered writes में शामिल हैं:

    - `channels.telegram.groups` को update करने के लिए group migration events (`migrate_to_chat_id`)
    - `/config set` और `/config unset` (command enablement आवश्यक)

    निष्क्रिय करें:

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
    डिफ़ॉल्ट long polling है। webhook mode के लिए `channels.telegram.webhookUrl` और `channels.telegram.webhookSecret` सेट करें; वैकल्पिक `webhookPath`, `webhookHost`, `webhookPort` (डिफ़ॉल्ट `/telegram-webhook`, `127.0.0.1`, `8787`)।

    long-polling mode में OpenClaw अपना restart watermark केवल तब persist करता है जब कोई update सफलतापूर्वक dispatch हो जाता है। यदि कोई handler विफल होता है, तो वह update उसी process में retryable रहता है और restart dedupe के लिए completed के रूप में नहीं लिखा जाता।

    local listener `127.0.0.1:8787` से bind होता है। public ingress के लिए, या तो local port के सामने reverse proxy लगाएं या जानबूझकर `webhookHost: "0.0.0.0"` सेट करें।

    Telegram को `200` लौटाने से पहले webhook mode request guards, Telegram secret token, और JSON body को validate करता है।
    इसके बाद OpenClaw उसी per-chat/per-topic bot lanes के माध्यम से update को asynchronously process करता है जो long polling में उपयोग होती हैं, इसलिए slow agent turns Telegram के delivery ACK को रोके नहीं रखते।

  </Accordion>

  <Accordion title="सीमाएं, पुनः प्रयास, और CLI लक्ष्य">
    - `channels.telegram.textChunkLimit` का डिफॉल्ट 4000 है।
    - `channels.telegram.chunkMode="newline"` लंबाई के आधार पर विभाजन से पहले पैराग्राफ सीमाओं (खाली पंक्तियों) को प्राथमिकता देता है।
    - `channels.telegram.mediaMaxMb` (डिफॉल्ट 100) आने वाले और बाहर जाने वाले Telegram मीडिया आकार को सीमित करता है।
    - `channels.telegram.mediaGroupFlushMs` (डिफॉल्ट 500) नियंत्रित करता है कि Telegram एल्बम/मीडिया समूहों को OpenClaw द्वारा एक इनबाउंड संदेश के रूप में भेजने से पहले कितनी देर तक बफर किया जाता है। यदि एल्बम के हिस्से देर से आते हैं तो इसे बढ़ाएं; एल्बम जवाब की विलंबता घटाने के लिए इसे घटाएं।
    - `channels.telegram.timeoutSeconds` Telegram API क्लाइंट टाइमआउट को ओवरराइड करता है (यदि सेट नहीं है, तो grammY डिफॉल्ट लागू होता है)। Bot क्लाइंट कॉन्फ़िगर किए गए मानों को 60-सेकंड के आउटबाउंड टेक्स्ट/टाइपिंग अनुरोध गार्ड से नीचे सीमित करते हैं ताकि OpenClaw का ट्रांसपोर्ट गार्ड और फॉलबैक चलने से पहले grammY दृश्य जवाब डिलीवरी को निरस्त न करे। Long polling अब भी 45-सेकंड `getUpdates` अनुरोध गार्ड का उपयोग करता है ताकि निष्क्रिय polls को अनिश्चित काल तक छोड़ा न जाए।
    - `channels.telegram.pollingStallThresholdMs` का डिफॉल्ट `120000` है; केवल false-positive polling-stall पुनरारंभों के लिए `30000` और `600000` के बीच समायोजित करें।
    - समूह संदर्भ इतिहास `channels.telegram.historyLimit` या `messages.groupChat.historyLimit` (डिफॉल्ट 50) का उपयोग करता है; `0` अक्षम करता है।
    - जब gateway ने parent संदेश देखे हों, तो reply/quote/forward पूरक संदर्भ को एक चयनित conversation context window में सामान्यीकृत किया जाता है; observed-message cache OpenClaw SQLite plugin state में रहता है, और `openclaw doctor --fix` legacy sidecars आयात करता है। Telegram updates में केवल एक सतही `reply_to_message` शामिल करता है, इसलिए cache से पुरानी chains Telegram के वर्तमान update payload तक सीमित होती हैं।
    - Telegram allowlists मुख्य रूप से नियंत्रित करती हैं कि agent को कौन trigger कर सकता है, यह पूर्ण supplemental-context redaction boundary नहीं है।
    - DM इतिहास नियंत्रण:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config recoverable outbound API errors के लिए Telegram send helpers (CLI/tools/actions) पर लागू होता है। इनबाउंड अंतिम-जवाब डिलीवरी Telegram pre-connect failures के लिए bounded safe-send retry भी उपयोग करती है, लेकिन यह ऐसे ambiguous post-send network envelopes को retry नहीं करती जो दृश्य संदेशों को duplicate कर सकते हैं।

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

    Telegram send यह भी समर्थन करता है:

    - जब `channels.telegram.capabilities.inlineButtons` अनुमति देता है, तो inline keyboards के लिए `buttons` blocks के साथ `--presentation`
    - जब bot उस chat में pin कर सकता है, तो pinned delivery का अनुरोध करने के लिए `--pin` या `--delivery '{"pin":true}'`
    - outbound images, GIFs, और videos को compressed photo, animated-media, या video uploads के बजाय documents के रूप में भेजने के लिए `--force-document`

    Action gating:

    - `channels.telegram.actions.sendMessage=false` polls सहित outbound Telegram messages को अक्षम करता है
    - `channels.telegram.actions.poll=false` नियमित sends को सक्षम रखते हुए Telegram poll creation को अक्षम करता है

  </Accordion>

  <Accordion title="Telegram में exec approvals">
    Telegram approver DMs में exec approvals का समर्थन करता है और वैकल्पिक रूप से originating chat या topic में prompts पोस्ट कर सकता है। Approvers numeric Telegram user IDs होने चाहिए।

    Config path:

    - `channels.telegram.execApprovals.enabled` (जब कम से कम एक approver resolvable हो तो auto-enable होता है)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` से numeric owner IDs पर fallback करता है)
    - `channels.telegram.execApprovals.target`: `dm` (डिफॉल्ट) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, और `defaultTo` नियंत्रित करते हैं कि bot से कौन बात कर सकता है और यह सामान्य replies कहां भेजता है। वे किसी को exec approver नहीं बनाते। जब अभी कोई command owner मौजूद नहीं होता, तो पहला approved DM pairing `commands.ownerAllowFrom` को bootstrap करता है, इसलिए one-owner setup अब भी `execApprovals.approvers` के अंतर्गत IDs duplicate किए बिना काम करता है।

    Channel delivery chat में command text दिखाती है; trusted groups/topics में ही `channel` या `both` enable करें। जब prompt किसी forum topic में पहुंचता है, तो OpenClaw approval prompt और follow-up के लिए topic को संरक्षित रखता है। Exec approvals डिफॉल्ट रूप से 30 मिनट बाद expire होते हैं।

    Inline approval buttons के लिए भी `channels.telegram.capabilities.inlineButtons` का target surface (`dm`, `group`, या `all`) को allow करना आवश्यक है। `plugin:` prefix वाले approval IDs plugin approvals के माध्यम से resolve होते हैं; अन्य पहले exec approvals के माध्यम से resolve होते हैं।

    [Exec approvals](/hi/tools/exec-approvals) देखें।

  </Accordion>
</AccordionGroup>

## Error reply controls

जब agent को delivery या provider error मिलता है, तो Telegram error text के साथ reply कर सकता है या उसे suppress कर सकता है। दो config keys इस व्यवहार को नियंत्रित करती हैं:

| Key                                 | Values            | Default | Description                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` chat को friendly error message भेजता है। `silent` error replies को पूरी तरह suppress करता है। |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | उसी chat को error replies के बीच न्यूनतम समय। Outages के दौरान error spam रोकता है।        |

Per-account, per-group, और per-topic overrides समर्थित हैं (अन्य Telegram config keys जैसी ही inheritance).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
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

    - यदि `requireMention=false` है, तो Telegram privacy mode को full visibility की अनुमति देनी चाहिए।
      - BotFather: `/setprivacy` -> Disable
      - फिर bot को group से हटाएं + दोबारा जोड़ें
    - जब config unmentioned group messages की अपेक्षा करता है, तो `openclaw channels status` चेतावनी देता है।
    - `openclaw channels status --probe` explicit numeric group IDs जांच सकता है; wildcard `"*"` को membership-probe नहीं किया जा सकता।
    - quick session test: `/activation always`.

  </Accordion>

  <Accordion title="Bot group messages बिल्कुल नहीं देख रहा">

    - जब `channels.telegram.groups` मौजूद हो, तो group सूचीबद्ध होना चाहिए (या `"*"` शामिल करें)
    - group में bot membership सत्यापित करें
    - skip reasons के लिए logs देखें: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Commands आंशिक रूप से काम करते हैं या बिल्कुल नहीं करते">

    - अपनी sender identity authorize करें (pairing और/या numeric `allowFrom`)
    - group policy `open` होने पर भी command authorization लागू रहता है
    - `BOT_COMMANDS_TOO_MUCH` के साथ `setMyCommands failed` का अर्थ है कि native menu में बहुत अधिक entries हैं; plugin/skill/custom commands घटाएं या native menus अक्षम करें
    - `deleteMyCommands` / `setMyCommands` startup calls और `sendChatAction` typing calls bounded हैं और request timeout पर Telegram के transport fallback के माध्यम से एक बार retry करते हैं। Persistent network/fetch errors आमतौर पर `api.telegram.org` तक DNS/HTTPS reachability issues दर्शाते हैं

  </Accordion>

  <Accordion title="Startup unauthorized token रिपोर्ट करता है">

    - `getMe returned 401` configured bot token के लिए Telegram authentication failure है।
    - BotFather में bot token फिर से copy या regenerate करें, फिर default account के लिए `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, या `TELEGRAM_BOT_TOKEN` update करें।
    - startup के दौरान `deleteWebhook 401 Unauthorized` भी auth failure है; इसे "no webhook exists" मानना उसी bad-token failure को केवल बाद की API calls तक defer करेगा।

  </Accordion>

  <Accordion title="Polling या network instability">

    - Node 22+ + custom fetch/proxy, AbortSignal types mismatch होने पर immediate abort behavior trigger कर सकता है।
    - कुछ hosts `api.telegram.org` को पहले IPv6 पर resolve करते हैं; broken IPv6 egress intermittent Telegram API failures का कारण बन सकता है।
    - यदि logs में `TypeError: fetch failed` या `Network request for 'getUpdates' failed!` शामिल है, तो OpenClaw अब इन्हें recoverable network errors के रूप में retry करता है।
    - polling startup के दौरान, OpenClaw grammY के लिए successful startup `getMe` probe reuse करता है ताकि runner को पहले `getUpdates` से पहले दूसरे `getMe` की जरूरत न पड़े।
    - यदि polling startup के दौरान transient network error के साथ `deleteWebhook` fail होता है, तो OpenClaw दूसरा pre-poll control-plane call करने के बजाय long polling में आगे बढ़ता है। Still-active webhook `getUpdates` conflict के रूप में surface होता है; फिर OpenClaw Telegram transport rebuild करता है और webhook cleanup retry करता है।
    - यदि Telegram sockets short fixed cadence पर recycle होते हैं, तो low `channels.telegram.timeoutSeconds` जांचें; bot clients configured values को outbound और `getUpdates` request guards से नीचे clamp करते हैं, लेकिन पुराने releases हर poll या reply abort कर सकते थे जब यह उन guards से नीचे set था।
    - यदि logs में `Polling stall detected` शामिल है, तो OpenClaw डिफॉल्ट रूप से completed long-poll liveness के बिना 120 seconds के बाद polling restart करता है और Telegram transport rebuild करता है।
    - जब running polling account ने startup grace के बाद `getUpdates` complete नहीं किया हो, running webhook account ने startup grace के बाद `setWebhook` complete नहीं किया हो, या last successful polling transport activity stale हो, तो `openclaw channels status --probe` और `openclaw doctor` चेतावनी देते हैं।
    - `channels.telegram.pollingStallThresholdMs` केवल तब बढ़ाएं जब long-running `getUpdates` calls healthy हों लेकिन आपका host अब भी false polling-stall restarts रिपोर्ट करता हो। Persistent stalls आमतौर पर host और `api.telegram.org` के बीच proxy, DNS, IPv6, या TLS egress issues की ओर संकेत करते हैं।
    - Telegram Bot API transport के लिए process proxy env का भी सम्मान करता है, जिनमें `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, और उनके lowercase variants शामिल हैं। `NO_PROXY` / `no_proxy` अब भी `api.telegram.org` को bypass कर सकते हैं।
    - यदि OpenClaw managed proxy किसी service environment के लिए `OPENCLAW_PROXY_URL` के माध्यम से configured है और कोई standard proxy env मौजूद नहीं है, तो Telegram भी Bot API transport के लिए वही URL उपयोग करता है।
    - अस्थिर direct egress/TLS वाले VPS hosts पर, Telegram API calls को `channels.telegram.proxy` के माध्यम से route करें:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ का डिफॉल्ट `autoSelectFamily=true` है (WSL2 को छोड़कर)। Telegram DNS result order पहले `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, फिर `channels.telegram.network.dnsResultOrder`, फिर process default जैसे `NODE_OPTIONS=--dns-result-order=ipv4first` का सम्मान करता है; यदि कोई लागू नहीं होता, तो Node 22+ `ipv4first` पर fallback करता है।
    - यदि आपका host WSL2 है या explicit रूप से IPv4-only behavior के साथ बेहतर काम करता है, तो family selection force करें:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 बेंचमार्क-रेंज उत्तर (`198.18.0.0/15`) पहले से ही
      Telegram मीडिया डाउनलोड के लिए डिफ़ॉल्ट रूप से अनुमत हैं। यदि कोई विश्वसनीय fake-IP या
      पारदर्शी प्रॉक्सी मीडिया डाउनलोड के दौरान `api.telegram.org` को किसी अन्य
      निजी/आंतरिक/विशेष-उपयोग पते पर फिर से लिखता है, तो आप Telegram-केवल बायपास के लिए
      ऑप्ट इन कर सकते हैं:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - वही ऑप्ट-इन प्रति खाते पर
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` पर उपलब्ध है।
    - यदि आपकी प्रॉक्सी Telegram मीडिया होस्ट को `198.18.x.x` में रिज़ॉल्व करती है, तो पहले
      खतरनाक फ़्लैग बंद रखें। Telegram मीडिया पहले से ही RFC 2544
      बेंचमार्क रेंज को डिफ़ॉल्ट रूप से अनुमति देता है।

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` Telegram
      मीडिया SSRF सुरक्षा को कमजोर करता है। इसे केवल Clash, Mihomo, या Surge fake-IP routing जैसे
      विश्वसनीय ऑपरेटर-नियंत्रित प्रॉक्सी परिवेशों के लिए उपयोग करें, जब वे
      RFC 2544 बेंचमार्क रेंज से बाहर निजी या विशेष-उपयोग उत्तर
      synthesize करते हैं। सामान्य सार्वजनिक इंटरनेट Telegram पहुँच के लिए इसे बंद रखें।
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

अधिक सहायता: [चैनल समस्या-निवारण](/hi/channels/troubleshooting).

## कॉन्फ़िगरेशन संदर्भ

प्राथमिक संदर्भ: [कॉन्फ़िगरेशन संदर्भ - Telegram](/hi/gateway/config-channels#telegram).

<Accordion title="उच्च-संकेत Telegram फ़ील्ड">

- स्टार्टअप/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` को नियमित फ़ाइल की ओर इंगित करना चाहिए; symlinks अस्वीकार किए जाते हैं)
- पहुँच नियंत्रण: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, शीर्ष-स्तरीय `bindings[]` (`type: "acp"`)
- विषय डिफ़ॉल्ट: `groups.<chatId>.topics."*"` unmatched forum topics पर लागू होता है; सटीक topic IDs इसे ओवरराइड करते हैं
- exec अनुमोदन: `execApprovals`, `accounts.*.execApprovals`
- कमांड/मेनू: `commands.native`, `commands.nativeSkills`, `customCommands`
- थ्रेडिंग/उत्तर: `replyToMode`
- स्ट्रीमिंग: `streaming` (पूर्वावलोकन), `streaming.preview.toolProgress`, `blockStreaming`
- फ़ॉर्मैटिंग/डिलीवरी: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- मीडिया/नेटवर्क: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- कस्टम API root: `apiRoot` (केवल Bot API root; `/bot<TOKEN>` शामिल न करें)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- कार्रवाइयाँ/क्षमताएँ: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- प्रतिक्रियाएँ: `reactionNotifications`, `reactionLevel`
- त्रुटियाँ: `errorPolicy`, `errorCooldownMs`
- लेखन/इतिहास: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
बहु-खाता precedence: जब दो या अधिक account IDs कॉन्फ़िगर किए गए हों, तो default routing को स्पष्ट बनाने के लिए `channels.telegram.defaultAccount` सेट करें (या `channels.telegram.accounts.default` शामिल करें)। अन्यथा OpenClaw पहले normalized account ID पर वापस जाता है और `openclaw doctor` चेतावनी देता है। नामित खाते `channels.telegram.allowFrom` / `groupAllowFrom` inherit करते हैं, लेकिन `accounts.default.*` मान नहीं।
</Note>

## संबंधित

<CardGroup cols={2}>
  <Card title="पेयरिंग" icon="link" href="/hi/channels/pairing">
    Telegram उपयोगकर्ता को Gateway से पेयर करें।
  </Card>
  <Card title="समूह" icon="users" href="/hi/channels/groups">
    समूह और topic allowlist व्यवहार।
  </Card>
  <Card title="चैनल रूटिंग" icon="route" href="/hi/channels/channel-routing">
    इनबाउंड संदेशों को एजेंट्स तक रूट करें।
  </Card>
  <Card title="सुरक्षा" icon="shield" href="/hi/gateway/security">
    खतरा मॉडल और hardening।
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/hi/concepts/multi-agent">
    समूहों और विषयों को एजेंट्स से मैप करें।
  </Card>
  <Card title="समस्या-निवारण" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल डायग्नॉस्टिक्स।
  </Card>
</CardGroup>
