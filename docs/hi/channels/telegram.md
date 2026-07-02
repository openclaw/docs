---
read_when:
    - Telegram सुविधाओं या Webhook पर काम करना
summary: Telegram बॉट समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:37:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

Production के लिए तैयार, grammY के ज़रिए बॉट DMs और समूहों के लिए। Long polling डिफ़ॉल्ट मोड है; Webhook मोड वैकल्पिक है।

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Telegram के लिए डिफ़ॉल्ट DM नीति pairing है।
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/hi/channels/troubleshooting">
    क्रॉस-चैनल निदान और मरम्मत प्लेबुक।
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/hi/gateway/configuration">
    पूर्ण चैनल कॉन्फ़िग पैटर्न और उदाहरण।
  </Card>
</CardGroup>

## त्वरित सेटअप

<Steps>
  <Step title="Create the bot token in BotFather">
    Telegram खोलें और **@BotFather** से चैट करें (पुष्टि करें कि हैंडल ठीक `@BotFather` ही है)।

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

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (केवल डिफ़ॉल्ट अकाउंट)।
    Telegram `openclaw channels login telegram` का उपयोग **नहीं** करता; टोकन को config/env में कॉन्फ़िगर करें, फिर gateway शुरू करें।

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing कोड 1 घंटे के बाद समाप्त हो जाते हैं।

  </Step>

  <Step title="Add the bot to a group">
    बॉट को अपने समूह में जोड़ें, फिर वे दोनों IDs लें जिनकी समूह पहुँच को ज़रूरत है:

    - आपका Telegram user ID, जो `allowFrom` / `groupAllowFrom` में उपयोग होता है
    - Telegram group chat ID, जो `channels.telegram.groups` के अंतर्गत कुंजी के रूप में उपयोग होता है

    पहली बार सेटअप के लिए, group chat ID `openclaw logs --follow`, किसी forwarded-ID बॉट, या Bot API `getUpdates` से लें। समूह की अनुमति मिलने के बाद, `/whoami@<bot_username>` user और group IDs की पुष्टि कर सकता है।

    `-100` से शुरू होने वाली नकारात्मक Telegram supergroup IDs group chat IDs होती हैं। उन्हें `channels.telegram.groups` के अंतर्गत रखें, `groupAllowFrom` के अंतर्गत नहीं।

  </Step>
</Steps>

<Note>
टोकन resolution order अकाउंट-aware है। व्यवहार में, config values env fallback पर प्राथमिकता लेते हैं, और `TELEGRAM_BOT_TOKEN` केवल डिफ़ॉल्ट अकाउंट पर लागू होता है।
सफल startup के बाद, OpenClaw state directory में बॉट identity को 24 घंटे तक cache करता है ताकि restarts अतिरिक्त Telegram `getMe` call से बच सकें; टोकन बदलने या हटाने से वह cache साफ़ हो जाता है।
</Note>

## Telegram पक्ष की सेटिंग्स

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram बॉट डिफ़ॉल्ट रूप से **Privacy Mode** पर होते हैं, जो यह सीमित करता है कि उन्हें कौन-से समूह संदेश मिलते हैं।

    यदि बॉट को सभी समूह संदेश देखने चाहिए, तो इनमें से कोई एक करें:

    - `/setprivacy` के ज़रिए privacy mode अक्षम करें, या
    - बॉट को group admin बनाएँ।

    privacy mode toggle करते समय, प्रत्येक समूह में बॉट को हटाकर फिर से जोड़ें ताकि Telegram बदलाव लागू करे।

  </Accordion>

  <Accordion title="Group permissions">
    Admin स्थिति Telegram group settings में नियंत्रित होती है।

    Admin बॉट सभी समूह संदेश प्राप्त करते हैं, जो हमेशा चालू समूह व्यवहार के लिए उपयोगी है।

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - समूह में जोड़ने की अनुमति/मनाही के लिए `/setjoingroups`
    - समूह visibility व्यवहार के लिए `/setprivacy`

  </Accordion>
</AccordionGroup>

## पहुँच नियंत्रण और सक्रियण

### समूह बॉट identity

Telegram समूहों और forum topics में, कॉन्फ़िगर किए गए बॉट हैंडल (उदाहरण के लिए `@my_bot`) का स्पष्ट mention चयनित OpenClaw agent को संबोधित करने के रूप में माना जाता है, भले ही agent persona name Telegram username से अलग हो। असंबंधित समूह traffic पर group silence policy फिर भी लागू होती है, लेकिन बॉट हैंडल स्वयं "किसी और" के रूप में नहीं माना जाता।

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` direct message access नियंत्रित करता है:

    - `pairing` (डिफ़ॉल्ट)
    - `allowlist` (`allowFrom` में कम से कम एक sender ID आवश्यक)
    - `open` (`allowFrom` में `"*"` शामिल होना आवश्यक)
    - `disabled`

    `allowFrom: ["*"]` के साथ `dmPolicy: "open"` किसी भी Telegram अकाउंट को, जो बॉट username ढूँढता या अनुमान लगाता है, बॉट को command करने देता है। इसका उपयोग केवल जानबूझकर सार्वजनिक बॉट्स के लिए करें जिनके tools कड़े रूप से प्रतिबंधित हों; one-owner बॉट्स को numeric user IDs के साथ `allowlist` उपयोग करना चाहिए।

    `channels.telegram.allowFrom` numeric Telegram user IDs स्वीकार करता है। `telegram:` / `tg:` prefixes स्वीकार करके normalize किए जाते हैं।
    multi-account configs में, restrictive top-level `channels.telegram.allowFrom` को safety boundary माना जाता है: account-level `allowFrom: ["*"]` entries उस account को public नहीं बनातीं, जब तक merge के बाद effective account allowlist में explicit wildcard फिर भी मौजूद न हो।
    खाली `allowFrom` के साथ `dmPolicy: "allowlist"` सभी DMs block करता है और config validation द्वारा अस्वीकार किया जाता है।
    Setup केवल numeric user IDs माँगता है।
    यदि आपने upgrade किया है और आपके config में `@username` allowlist entries हैं, तो उन्हें resolve करने के लिए `openclaw doctor --fix` चलाएँ (best-effort; Telegram bot token आवश्यक है)।
    यदि आप पहले pairing-store allowlist files पर निर्भर थे, तो `openclaw doctor --fix` allowlist flows में entries को `channels.telegram.allowFrom` में recover कर सकता है (उदाहरण के लिए जब `dmPolicy: "allowlist"` में अभी कोई explicit IDs नहीं हैं)।

    one-owner बॉट्स के लिए, access policy को config में durable रखने के लिए explicit numeric `allowFrom` IDs के साथ `dmPolicy: "allowlist"` को प्राथमिकता दें (पिछली pairing approvals पर निर्भर होने के बजाय)।

    सामान्य भ्रम: DM pairing approval का अर्थ "यह sender हर जगह authorized है" नहीं है।
    Pairing DM access देता है। यदि अभी तक कोई command owner मौजूद नहीं है, तो पहली approved pairing `commands.ownerAllowFrom` भी set करती है ताकि owner-only commands और exec approvals के लिए explicit operator account हो।
    Group sender authorization अब भी explicit config allowlists से आता है।
    यदि आप चाहते हैं कि "मैं एक बार authorized हूँ और DMs तथा group commands दोनों काम करें", तो अपना numeric Telegram user ID `channels.telegram.allowFrom` में डालें; owner-only commands के लिए, सुनिश्चित करें कि `commands.ownerAllowFrom` में `telegram:<your user id>` मौजूद है।

    ### अपना Telegram user ID ढूँढना

    अधिक सुरक्षित (third-party बॉट नहीं):

    1. अपने बॉट को DM करें।
    2. `openclaw logs --follow` चलाएँ।
    3. `from.id` पढ़ें।

    आधिकारिक Bot API method:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Third-party method (कम private): `@userinfobot` या `@getidsbot`।

  </Tab>

  <Tab title="Group policy and allowlists">
    दो controls साथ में लागू होते हैं:

    1. **कौन-से groups allowed हैं** (`channels.telegram.groups`)
       - कोई `groups` config नहीं:
         - `groupPolicy: "open"` के साथ: कोई भी group group-ID checks pass कर सकता है
         - `groupPolicy: "allowlist"` (डिफ़ॉल्ट) के साथ: groups तब तक blocked रहते हैं जब तक आप `groups` entries (या `"*"`) नहीं जोड़ते
       - `groups` configured: allowlist की तरह काम करता है (explicit IDs या `"*"`)

    2. **groups में कौन-से senders allowed हैं** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (डिफ़ॉल्ट)
       - `disabled`

    `groupAllowFrom` group sender filtering के लिए उपयोग होता है। यदि set नहीं है, तो Telegram `allowFrom` पर fall back करता है।
    `groupAllowFrom` entries numeric Telegram user IDs होनी चाहिए (`telegram:` / `tg:` prefixes normalize किए जाते हैं)।
    Telegram group या supergroup chat IDs को `groupAllowFrom` में न डालें। Negative chat IDs `channels.telegram.groups` के अंतर्गत आती हैं।
    Non-numeric entries sender authorization के लिए ignore की जाती हैं।
    Security boundary (`2026.2.25+`): group sender auth DM pairing-store approvals inherit **नहीं** करता।
    Pairing DM-only रहता है। Groups के लिए, `groupAllowFrom` या per-group/per-topic `allowFrom` set करें।
    यदि `groupAllowFrom` unset है, तो Telegram config `allowFrom` पर fall back करता है, pairing store पर नहीं।
    one-owner बॉट्स के लिए व्यावहारिक pattern: अपना user ID `channels.telegram.allowFrom` में set करें, `groupAllowFrom` unset छोड़ें, और target groups को `channels.telegram.groups` के अंतर्गत allow करें।
    Runtime note: यदि `channels.telegram` पूरी तरह missing है, तो runtime fail-closed `groupPolicy="allowlist"` पर default करता है, जब तक `channels.defaults.groupPolicy` explicit रूप से set न हो।

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

    इसे group से `@<bot_username> ping` के साथ test करें। `requireMention: true` रहते हुए plain group messages बॉट को trigger नहीं करते।

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

      - `-1001234567890` जैसी negative Telegram group या supergroup chat IDs को `channels.telegram.groups` के अंतर्गत रखें।
      - जब आप allowed group के अंदर कौन-से लोग बॉट को trigger कर सकते हैं सीमित करना चाहते हैं, तो `8734062810` जैसी Telegram user IDs को `groupAllowFrom` के अंतर्गत रखें।
      - `groupAllowFrom: ["*"]` केवल तब उपयोग करें जब आप चाहते हैं कि allowed group का कोई भी member बॉट से बात कर सके।

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Group replies में डिफ़ॉल्ट रूप से mention आवश्यक होता है।

    Mention इनसे आ सकता है:

    - native `@botusername` mention, या
    - इनमें mention patterns:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Session-level command toggles:

    - `/activation always`
    - `/activation mention`

    ये केवल session state update करते हैं। persistence के लिए config उपयोग करें।

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

    Group history context groups के लिए हमेशा on रहता है और
    `historyLimit` से bounded होता है। Telegram group history window को disable करने के लिए
    `channels.telegram.historyLimit: 0` set करें। Retired `includeGroupHistoryContext`
    key को `openclaw doctor --fix` द्वारा remove किया जाता है।

    group chat ID प्राप्त करना:

    - किसी group message को `@userinfobot` / `@getidsbot` पर forward करें
    - या `openclaw logs --follow` से `chat.id` पढ़ें
    - या Bot API `getUpdates` inspect करें
    - group allowed होने के बाद, native commands enabled हों तो `/whoami@<bot_username>` चलाएँ

  </Tab>
</Tabs>

## Runtime व्यवहार

- Telegram का स्वामित्व Gateway प्रक्रिया के पास होता है।
- रूटिंग निर्धारक है: Telegram से आने वाले संदेशों के उत्तर Telegram पर ही वापस जाते हैं (मॉडल चैनल नहीं चुनता)।
- आने वाले संदेश उत्तर मेटाडेटा, मीडिया प्लेसहोल्डर, और Gateway द्वारा देखे गए Telegram उत्तरों के लिए स्थायी reply-chain संदर्भ के साथ साझा चैनल envelope में सामान्यीकृत होते हैं।
- समूह सत्र समूह ID से अलग-थलग रखे जाते हैं। Forum topics विषयों को अलग-थलग रखने के लिए `:topic:<threadId>` जोड़ते हैं।
- DM संदेश `message_thread_id` ले जा सकते हैं; OpenClaw इसे उत्तरों के लिए सुरक्षित रखता है। DM topic सत्र केवल तब विभाजित होते हैं जब Telegram `getMe` bot के लिए `has_topics_enabled: true` रिपोर्ट करता है; अन्यथा DM सपाट सत्र पर रहते हैं।
- Long polling प्रति-chat/प्रति-thread sequencing के साथ grammY runner का उपयोग करता है। कुल runner sink concurrency `agents.defaults.maxConcurrent` का उपयोग करती है।
- Multi-account startup समवर्ती Telegram `getMe` probes को सीमित करता है ताकि बड़े bot fleets हर account probe को एक साथ fan out न करें।
- Long polling प्रत्येक Gateway प्रक्रिया के अंदर सुरक्षित है ताकि एक समय में केवल एक सक्रिय poller bot token का उपयोग कर सके। अगर आपको फिर भी `getUpdates` 409 conflicts दिखते हैं, तो संभवतः कोई दूसरा OpenClaw Gateway, script, या external poller उसी token का उपयोग कर रहा है।
- Long-polling watchdog restart डिफ़ॉल्ट रूप से 120 seconds तक पूर्ण `getUpdates` liveness न मिलने पर trigger होते हैं। `channels.telegram.pollingStallThresholdMs` केवल तभी बढ़ाएँ जब आपके deployment में long-running work के दौरान अब भी झूठे polling-stall restarts दिखते हों। मान milliseconds में है और `30000` से `600000` तक अनुमत है; प्रति-account overrides समर्थित हैं।
- Telegram Bot API में read-receipt support नहीं है (`sendReadReceipts` लागू नहीं होता)।

<Note>
  `channels.telegram.dm.threadReplies` और `channels.telegram.direct.<chatId>.threadReplies` हटाए गए थे। Upgrade करने के बाद `openclaw doctor --fix` चलाएँ अगर आपके config में अब भी ये keys हैं। DM topic routing अब Telegram `getMe.has_topics_enabled` से मिली bot capability का पालन करती है, जिसे BotFather threaded mode नियंत्रित करता है: topics-enabled bots Telegram द्वारा `message_thread_id` भेजे जाने पर thread-scoped DM sessions का उपयोग करते हैं; दूसरे DM सपाट session पर रहते हैं।
</Note>

## फीचर संदर्भ

<AccordionGroup>
  <Accordion title="लाइव stream preview (message edits)">
    OpenClaw वास्तविक समय में partial replies stream कर सकता है:

    - direct chats: preview message + `editMessageText`
    - groups/topics: preview message + `editMessageText`

    आवश्यकता:

    - `channels.telegram.streaming` `off | partial | block | progress` है (डिफ़ॉल्ट: `partial`)
    - छोटे initial answer previews debounce किए जाते हैं, फिर अगर run अब भी active है तो bounded delay के बाद materialize किए जाते हैं
    - `progress` tool progress के लिए एक editable status draft रखता है, tool progress से पहले answer activity आने पर stable status label दिखाता है, completion पर उसे clear करता है, और final answer को normal message के रूप में भेजता है
    - `streaming.preview.toolProgress` नियंत्रित करता है कि tool/progress updates वही edited preview message दोबारा उपयोग करें या नहीं (डिफ़ॉल्ट: preview streaming active होने पर `true`)
    - `streaming.preview.commandText` उन tool-progress lines के अंदर command/exec detail नियंत्रित करता है: `raw` (डिफ़ॉल्ट, released behavior सुरक्षित रखता है) या `status` (केवल tool label)
    - `streaming.progress.commentary` (डिफ़ॉल्ट: `false`) temporary progress draft में assistant commentary/preamble text को opt in करता है
    - legacy `channels.telegram.streamMode`, boolean `streaming` values, और retired native draft preview keys detect किए जाते हैं; उन्हें current streaming config में migrate करने के लिए `openclaw doctor --fix` चलाएँ

    Tool-progress preview updates वे छोटी status lines हैं जो tools चलने के दौरान दिखाई जाती हैं, उदाहरण के लिए command execution, file reads, planning updates, patch summaries, या Codex app-server mode में Codex preamble/commentary text। Telegram इन्हें डिफ़ॉल्ट रूप से enabled रखता है ताकि `v2026.4.22` और बाद के released OpenClaw behavior से मेल रहे।

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

    जब आप final answer को उसी message में edit किए बिना visible tool progress चाहते हैं, तब `progress` mode का उपयोग करें। Command-text policy को `streaming.progress` के अंतर्गत रखें:

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

    `streaming.mode: "off"` का उपयोग केवल तब करें जब आप final-only delivery चाहते हों: Telegram preview edits disabled होते हैं और generic tool/progress chatter को standalone status messages के रूप में भेजने के बजाय suppress किया जाता है। Approval prompts, media payloads, और errors अब भी normal final delivery से route होते हैं। `streaming.preview.toolProgress: false` का उपयोग तब करें जब आप केवल answer preview edits रखना चाहते हों और tool-progress status lines छिपाना चाहते हों।

    <Note>
      Telegram selected quote replies अपवाद हैं। जब `replyToMode` `"first"`, `"all"`, या `"batched"` हो और inbound message में selected quote text शामिल हो, तो OpenClaw answer preview edit करने के बजाय Telegram के native quote-reply path से final answer भेजता है, इसलिए `streaming.preview.toolProgress` उस turn के लिए छोटी status lines नहीं दिखा सकता। Selected quote text के बिना current-message replies अब भी preview streaming रखते हैं। जब tool-progress visibility native quote replies से अधिक महत्वपूर्ण हो, तो `replyToMode: "off"` set करें, या trade-off स्वीकार करने के लिए `streaming.preview.toolProgress: false` set करें।
    </Note>

    केवल text replies के लिए:

    - छोटे DM/group/topic previews: OpenClaw वही preview message रखता है और final edit को वहीं perform करता है
    - लंबे text finals जो कई Telegram messages में split होते हैं, जहाँ संभव हो existing preview को first final chunk के रूप में reuse करते हैं, फिर केवल remaining chunks भेजते हैं
    - progress-mode finals status draft clear करते हैं और draft को answer में edit करने के बजाय normal final delivery का उपयोग करते हैं
    - अगर completed text confirm होने से पहले final edit fail हो जाए, तो OpenClaw normal final delivery का उपयोग करता है और stale preview clean up करता है

    Complex replies (उदाहरण के लिए media payloads) के लिए, OpenClaw normal final delivery पर fall back करता है और फिर preview message clean up करता है।

    Preview streaming, block streaming से अलग है। जब Telegram के लिए block streaming स्पष्ट रूप से enabled होती है, तो OpenClaw double-streaming से बचने के लिए preview stream skip करता है।

    Reasoning stream behavior:

    - `/reasoning stream` supported channel के reasoning-preview path का उपयोग करता है; Telegram पर, यह generation के दौरान reasoning को live preview में stream करता है
    - final delivery के बाद reasoning preview delete हो जाता है; जब reasoning visible रहना चाहिए, तो `/reasoning on` का उपयोग करें
    - final answer reasoning text के बिना भेजा जाता है

  </Accordion>

  <Accordion title="समृद्ध message formatting">
    Outbound text डिफ़ॉल्ट रूप से standard Telegram HTML messages का उपयोग करता है ताकि replies current Telegram clients में readable रहें। यह compatibility mode normal bold, italic, links, code, spoilers, और quotes support करता है, लेकिन Bot API 10.1 rich-only blocks जैसे native tables, details, rich media, और formulas नहीं।

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
    - Explicit rich HTML payloads supported Bot API 10.1 tags जैसे headings, tables, details, rich media, और formulas सुरक्षित रखते हैं।
    - Media captions अब भी Telegram HTML captions का उपयोग करते हैं क्योंकि rich messages captions को replace नहीं करते।

    इससे model text Telegram Rich Markdown sigils से दूर रहता है, इसलिए `$400-600K` जैसी currency math के रूप में parse नहीं होती। Long rich text स्वचालित रूप से Telegram की rich text और rich block limits में split होता है। Telegram की column limit से अधिक tables code blocks के रूप में भेजी जाती हैं।

    डिफ़ॉल्ट: client compatibility के लिए off। Rich messages के लिए compatible Telegram clients आवश्यक हैं; कुछ current Desktop, Web, Android, और third-party clients accepted rich messages को unsupported के रूप में display करते हैं। इस option को disabled रखें जब तक bot के साथ उपयोग होने वाला हर client इन्हें render न कर सके। `/status` दिखाता है कि current Telegram session में rich messages on हैं या off।

    Link previews डिफ़ॉल्ट रूप से enabled हैं। `channels.telegram.linkPreview: false` rich text के लिए automatic entity detection skip करता है।

  </Accordion>

  <Accordion title="Native commands और custom commands">
    Telegram command menu registration startup पर `setMyCommands` से handle होता है।

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

    - names normalize किए जाते हैं (leading `/` हटाएँ, lowercase)
    - valid pattern: `a-z`, `0-9`, `_`, length `1..32`
    - custom commands native commands को override नहीं कर सकते
    - conflicts/duplicates skip और log किए जाते हैं

    नोट्स:

    - custom commands केवल menu entries हैं; वे behavior auto-implement नहीं करते
    - plugin/skill commands typed होने पर अब भी काम कर सकते हैं, भले ही Telegram menu में न दिखें

    अगर native commands disabled हैं, तो built-ins हटा दिए जाते हैं। Custom/plugin commands configured होने पर अब भी register हो सकते हैं।

    सामान्य setup failures:

    - `BOT_COMMANDS_TOO_MUCH` के साथ `setMyCommands failed` का मतलब है कि trimming के बाद भी Telegram menu overflow हुआ; plugin/skill/custom commands घटाएँ या `channels.telegram.commands.native` disable करें।
    - Direct Bot API curl commands काम करते समय `deleteWebhook`, `deleteMyCommands`, या `setMyCommands` का `404: Not Found` के साथ fail होना यह संकेत दे सकता है कि `channels.telegram.apiRoot` को full `/bot<TOKEN>` endpoint पर set किया गया था। `apiRoot` केवल Bot API root होना चाहिए, और `openclaw doctor --fix` accidental trailing `/bot<TOKEN>` हटाता है।
    - `getMe returned 401` का मतलब है Telegram ने configured bot token reject किया। Current BotFather token के साथ `botToken`, `tokenFile`, या `TELEGRAM_BOT_TOKEN` update करें; OpenClaw polling से पहले stop हो जाता है, इसलिए इसे webhook cleanup failure के रूप में report नहीं किया जाता।
    - Network/fetch errors के साथ `setMyCommands failed` का आम तौर पर मतलब है कि `api.telegram.org` तक outbound DNS/HTTPS blocked है।

    ### Device pairing commands (`device-pair` plugin)

    जब `device-pair` plugin installed हो:

    1. `/pair` setup code generate करता है
    2. iOS app में code paste करें
    3. `/pair pending` pending requests list करता है (role/scopes सहित)
    4. request approve करें:
       - explicit approval के लिए `/pair approve <requestId>`
       - जब केवल एक pending request हो, तब `/pair approve`
       - सबसे recent के लिए `/pair approve latest`

    Setup code एक short-lived bootstrap token ले जाता है। Built-in setup-code bootstrap node-only है: first connect एक pending node request बनाता है, और approval के बाद Gateway `scopes: []` के साथ durable node token लौटाता है। यह handed-off operator token नहीं लौटाता; operator access के लिए अलग approved operator pairing या token flow आवश्यक है।

    अगर कोई device बदली हुई auth details (उदाहरण के लिए role/scopes/public key) के साथ retry करता है, तो previous pending request supersede हो जाती है और नई request अलग `requestId` उपयोग करती है। Approve करने से पहले `/pair pending` फिर से run करें।

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

    लेगेसी `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` पर मैप होता है।

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

    Callback क्लिक, जिन्हें किसी पंजीकृत Plugin इंटरैक्टिव हैंडलर द्वारा क्लेम नहीं किया जाता,
    एजेंट को टेक्स्ट के रूप में पास किए जाते हैं:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="एजेंटों और ऑटोमेशन के लिए Telegram संदेश कार्रवाइयां">
    Telegram टूल कार्रवाइयों में शामिल हैं:

    - `sendMessage` (`to`, `content`, वैकल्पिक `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` या `caption`, वैकल्पिक `presentation` इनलाइन बटन; केवल-बटन संपादन reply markup अपडेट करते हैं)
    - `createForumTopic` (`chatId`, `name`, वैकल्पिक `iconColor`, `iconCustomEmojiId`)

    चैनल संदेश कार्रवाइयां सुविधाजनक एलियस दिखाती हैं (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`)।

    गेटिंग नियंत्रण:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (डिफ़ॉल्ट: अक्षम)

    नोट: `edit` और `topic-create` वर्तमान में डिफ़ॉल्ट रूप से सक्षम हैं और इनके लिए अलग `channels.telegram.actions.*` टॉगल नहीं हैं।
    Runtime भेजाव सक्रिय config/secrets snapshot (startup/reload) का उपयोग करते हैं, इसलिए कार्रवाई पथ हर भेजाव पर ad-hoc SecretRef को फिर से resolve नहीं करते।

    Reaction हटाने की semantics: [/tools/reactions](/hi/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading टैग">
    Telegram जनरेट किए गए आउटपुट में स्पष्ट reply threading टैग का समर्थन करता है:

    - `[[reply_to_current]]` ट्रिगर करने वाले संदेश का उत्तर देता है
    - `[[reply_to:<id>]]` किसी विशिष्ट Telegram संदेश ID का उत्तर देता है

    `channels.telegram.replyToMode` हैंडलिंग नियंत्रित करता है:

    - `off` (डिफ़ॉल्ट)
    - `first`
    - `all`

    जब reply threading सक्षम हो और मूल Telegram टेक्स्ट या caption उपलब्ध हो, OpenClaw अपने-आप native Telegram quote excerpt शामिल करता है। Telegram native quote टेक्स्ट को 1024 UTF-16 code units तक सीमित करता है, इसलिए लंबे संदेशों को शुरुआत से quote किया जाता है और अगर Telegram quote अस्वीकार करता है तो plain reply पर fall back किया जाता है।

    नोट: `off` implicit reply threading को अक्षम करता है। स्पष्ट `[[reply_to_*]]` टैग फिर भी माने जाते हैं।

  </Accordion>

  <Accordion title="Forum topics और thread व्यवहार">
    Forum supergroups:

    - topic session keys में `:topic:<threadId>` जोड़ा जाता है
    - replies और typing topic thread को target करते हैं
    - topic config path:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    General topic (`threadId=1`) विशेष-मामला:

    - message sends में `message_thread_id` छोड़ा जाता है (Telegram `sendMessage(...thread_id=1)` अस्वीकार करता है)
    - typing actions में फिर भी `message_thread_id` शामिल होता है

    Topic inheritance: topic entries group settings से inherit करती हैं जब तक override न किया जाए (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`)।
    `agentId` केवल-topic है और group defaults से inherit नहीं करता।
    `topics."*"` उस group में हर topic के लिए defaults सेट करता है; exact topic IDs फिर भी `"*"` पर प्राथमिकता रखते हैं।

    **प्रति-topic एजेंट routing**: topic config में `agentId` सेट करके प्रत्येक topic को अलग एजेंट तक route किया जा सकता है। इससे हर topic को अपना अलग workspace, memory, और session मिलता है। उदाहरण:

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

    **Persistent ACP topic binding**: Forum topics top-level typed ACP bindings (`bindings[]`, `type: "acp"` और `match.channel: "telegram"`, `peer.kind: "group"`, और `-1001234567890:topic:42` जैसे topic-qualified id के साथ) के जरिए ACP harness sessions pin कर सकते हैं। वर्तमान में groups/supergroups में forum topics तक scoped है। [ACP Agents](/hi/tools/acp-agents) देखें।

    **चैट से thread-bound ACP spawn**: `/acp spawn <agent> --thread here|auto` मौजूदा topic को नए ACP session से bind करता है; follow-ups सीधे वहीं route होते हैं। OpenClaw spawn confirmation को in-topic pin करता है। `channels.telegram.threadBindings.spawnSessions` का सक्षम रहना आवश्यक है (डिफ़ॉल्ट: `true`)।

    Template context `MessageThreadId` और `IsForum` expose करता है। `message_thread_id` वाली DM chats reply metadata रखती हैं; वे thread-aware session keys केवल तब उपयोग करती हैं जब Telegram `getMe` bot के लिए `has_topics_enabled: true` रिपोर्ट करता है।
    पुराने `dm.threadReplies` और `direct.*.threadReplies` overrides जानबूझकर retired हैं; BotFather threaded mode को single source of truth के रूप में उपयोग करें और stale config keys हटाने के लिए `openclaw doctor --fix` चलाएं।

  </Accordion>

  <Accordion title="Audio, video, और stickers">
    ### Audio messages

    Telegram voice notes और audio files में अंतर करता है।

    - डिफ़ॉल्ट: audio file व्यवहार
    - voice-note भेजने को force करने के लिए एजेंट reply में `[[audio_as_voice]]` टैग
    - inbound voice-note transcripts को एजेंट context में machine-generated,
      untrusted text के रूप में framed किया जाता है; mention detection फिर भी raw
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

    संदेश action उदाहरण:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    वीडियो नोट्स captions का समर्थन नहीं करते; दिया गया संदेश टेक्स्ट अलग से भेजा जाता है।

    ### स्टिकर

    इनबाउंड स्टिकर हैंडलिंग:

    - static WEBP: डाउनलोड और प्रोसेस किया गया (placeholder `<media:sticker>`)
    - animated TGS: छोड़ा गया
    - video WEBM: छोड़ा गया

    स्टिकर context फ़ील्ड:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    बार-बार vision calls को कम करने के लिए स्टिकर विवरण OpenClaw SQLite Plugin state में cache किए जाते हैं।

    स्टिकर actions सक्षम करें:

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

    स्टिकर action भेजें:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    cache किए गए स्टिकर खोजें:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction notifications">
    Telegram प्रतिक्रियाएँ `message_reaction` updates के रूप में आती हैं (message payloads से अलग)।

    सक्षम होने पर, OpenClaw इस तरह के system events enqueue करता है:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    नोट्स:

    - `own` का अर्थ है केवल bot द्वारा भेजे गए messages पर user reactions (sent-message cache के माध्यम से best-effort)।
    - Reaction events अब भी Telegram access controls (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) का सम्मान करते हैं; अनधिकृत senders हटा दिए जाते हैं।
    - Telegram reaction updates में thread IDs प्रदान नहीं करता।
      - non-forum groups को group chat session पर route किया जाता है
      - forum groups को group general-topic session (`:topic:1`) पर route किया जाता है, सटीक originating topic पर नहीं

    polling/Webhook के लिए `allowed_updates` में `message_reaction` अपने आप शामिल होता है।

  </Accordion>

  <Accordion title="Ack reactions">
    जब OpenClaw किसी inbound message को process कर रहा होता है, `ackReaction` एक acknowledgement emoji भेजता है। `ackReactionScope` तय करता है कि वह emoji वास्तव में *कब* भेजा जाए।

    **Emoji (`ackReaction`) resolution order:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji fallback (`agents.list[].identity.emoji`, अन्यथा "👀")

    नोट्स:

    - Telegram unicode emoji की अपेक्षा करता है (उदाहरण के लिए "👀")।
    - किसी channel या account के लिए reaction अक्षम करने हेतु `""` का उपयोग करें।

    **Scope (`messages.ackReactionScope`):**

    Telegram provider scope को `messages.ackReactionScope` से पढ़ता है (default `"group-mentions"`)। आज कोई Telegram-account या Telegram-channel-level override नहीं है।

    Values: `"all"` (DMs + groups), `"direct"` (केवल DMs), `"group-all"` (हर group message, कोई DMs नहीं), `"group-mentions"` (groups जब bot का उल्लेख किया गया हो; **कोई DMs नहीं** — यह default है), `"off"` / `"none"` (अक्षम)।

    <Note>
    default scope (`"group-mentions"`) direct messages में ack reactions fire नहीं करता। inbound Telegram DMs पर ack reaction पाने के लिए, `messages.ackReactionScope` को `"direct"` या `"all"` पर set करें। value Telegram provider startup पर पढ़ी जाती है, इसलिए बदलाव प्रभावी करने के लिए gateway restart आवश्यक है।
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    Channel config writes default रूप से सक्षम हैं (`configWrites !== false`)।

    Telegram-triggered writes में शामिल हैं:

    - `channels.telegram.groups` update करने के लिए group migration events (`migrate_to_chat_id`)
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

  <Accordion title="Long polling vs webhook">
    default long polling है। Webhook mode के लिए `channels.telegram.webhookUrl` और `channels.telegram.webhookSecret` set करें; वैकल्पिक `webhookPath`, `webhookHost`, `webhookPort` (defaults `/telegram-webhook`, `127.0.0.1`, `8787`)।

    long-polling mode में OpenClaw अपना restart watermark केवल update सफलतापूर्वक dispatch होने के बाद persist करता है। यदि कोई handler विफल होता है, तो वह update उसी process में retryable रहता है और restart dedupe के लिए completed के रूप में नहीं लिखा जाता।

    local listener `127.0.0.1:8787` से bind होता है। public ingress के लिए, या तो local port के सामने reverse proxy लगाएँ या जानबूझकर `webhookHost: "0.0.0.0"` set करें।

    Webhook mode Telegram को `200` लौटाने से पहले request guards, Telegram secret token, और JSON body को validate करता है।
    इसके बाद OpenClaw update को long polling द्वारा उपयोग की जाने वाली समान per-chat/per-topic bot lanes के माध्यम से asynchronously process करता है, इसलिए slow agent turns Telegram के delivery ACK को रोके नहीं रखते।

  </Accordion>

  <Accordion title="सीमाएं, पुनः प्रयास, और CLI लक्ष्य">
    - `channels.telegram.textChunkLimit` का डिफ़ॉल्ट 4000 है.
    - `channels.telegram.chunkMode="newline"` लंबाई के आधार पर विभाजन से पहले अनुच्छेद सीमाओं (खाली पंक्तियों) को प्राथमिकता देता है.
    - `channels.telegram.mediaMaxMb` (डिफ़ॉल्ट 100) आने वाले और बाहर जाने वाले Telegram मीडिया आकार की सीमा तय करता है.
    - `channels.telegram.mediaGroupFlushMs` (डिफ़ॉल्ट 500) नियंत्रित करता है कि OpenClaw द्वारा Telegram एल्बम/मीडिया समूहों को एक आने वाले संदेश के रूप में भेजने से पहले कितनी देर तक बफ़र किया जाए. यदि एल्बम के भाग देर से आते हैं तो इसे बढ़ाएं; एल्बम उत्तर विलंबता घटाने के लिए इसे घटाएं.
    - `channels.telegram.timeoutSeconds` Telegram API क्लाइंट टाइमआउट को ओवरराइड करता है (यदि सेट न हो, तो grammY डिफ़ॉल्ट लागू होता है). बॉट क्लाइंट कॉन्फ़िगर किए गए मानों को 60-सेकंड के आउटबाउंड टेक्स्ट/टाइपिंग अनुरोध गार्ड से नीचे सीमित करते हैं ताकि OpenClaw के ट्रांसपोर्ट गार्ड और फ़ॉलबैक चलने से पहले grammY दृश्यमान उत्तर डिलीवरी को रद्द न करे. लॉन्ग पोलिंग अब भी 45-सेकंड के `getUpdates` अनुरोध गार्ड का उपयोग करती है ताकि निष्क्रिय पोल अनिश्चितकाल तक छोड़े न जाएं.
    - `channels.telegram.pollingStallThresholdMs` का डिफ़ॉल्ट `120000` है; केवल फ़ॉल्स-पॉज़िटिव पोलिंग-स्टॉल पुनःआरंभों के लिए `30000` और `600000` के बीच समायोजित करें.
    - समूह संदर्भ इतिहास `channels.telegram.historyLimit` या `messages.groupChat.historyLimit` (डिफ़ॉल्ट 50) का उपयोग करता है; `0` अक्षम करता है.
    - जब gateway ने पैरेंट संदेश देखे हों, तो reply/quote/forward पूरक संदर्भ को एक चयनित वार्तालाप संदर्भ विंडो में सामान्यीकृत किया जाता है; देखे गए संदेशों का कैश OpenClaw SQLite plugin स्थिति में रहता है, और `openclaw doctor --fix` पुराने sidecar आयात करता है. Telegram अपडेट में केवल एक उथला `reply_to_message` शामिल करता है, इसलिए कैश से पुराने चेन Telegram के मौजूदा अपडेट पेलोड तक सीमित होते हैं.
    - Telegram allowlists मुख्य रूप से यह नियंत्रित करती हैं कि एजेंट को कौन ट्रिगर कर सकता है, वे पूर्ण पूरक-संदर्भ रिडैक्शन सीमा नहीं हैं.
    - DM इतिहास नियंत्रण:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` कॉन्फ़िगरेशन पुनर्प्राप्त करने योग्य आउटबाउंड API त्रुटियों के लिए Telegram भेजने वाले सहायकों (CLI/टूल्स/एक्शन) पर लागू होता है. इनबाउंड अंतिम-उत्तर डिलीवरी Telegram प्री-कनेक्ट विफलताओं के लिए सीमित सुरक्षित-भेज पुनः प्रयास भी उपयोग करती है, लेकिन यह अस्पष्ट पोस्ट-सेंड नेटवर्क एनवलप पर पुनः प्रयास नहीं करती जो दृश्यमान संदेशों की डुप्लिकेट बना सकते हैं.

    CLI और संदेश-टूल भेजने के लक्ष्य संख्यात्मक चैट ID, उपयोगकर्ता नाम, या forum topic लक्ष्य हो सकते हैं:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram पोल `openclaw message poll` का उपयोग करते हैं और forum topics का समर्थन करते हैं:

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
    - forum topics के लिए `--thread-id` (या `:topic:` लक्ष्य का उपयोग करें)

    Telegram भेजना यह भी समर्थन करता है:

    - `buttons` ब्लॉक वाले inline keyboards के लिए `--presentation`, जब `channels.telegram.capabilities.inlineButtons` इसकी अनुमति देता है
    - जब बॉट उस चैट में पिन कर सकता हो, तो pinned delivery का अनुरोध करने के लिए `--pin` या `--delivery '{"pin":true}'`
    - आउटबाउंड images, GIFs, और videos को compressed photo, animated-media, या video uploads के बजाय documents के रूप में भेजने के लिए `--force-document`

    एक्शन गेटिंग:

    - `channels.telegram.actions.sendMessage=false` पोल सहित आउटबाउंड Telegram संदेशों को अक्षम करता है
    - `channels.telegram.actions.poll=false` नियमित भेजना सक्षम रखते हुए Telegram पोल बनाना अक्षम करता है

  </Accordion>

  <Accordion title="Telegram में exec अनुमोदन">
    Telegram अनुमोदक DMs में exec अनुमोदनों का समर्थन करता है और वैकल्पिक रूप से मूल चैट या topic में prompts पोस्ट कर सकता है. अनुमोदक संख्यात्मक Telegram user IDs होने चाहिए.

    कॉन्फ़िगरेशन पथ:

    - `channels.telegram.execApprovals.enabled` (कम से कम एक अनुमोदक resolvable होने पर अपने-आप सक्षम होता है)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` से संख्यात्मक owner IDs पर fallback करता है)
    - `channels.telegram.execApprovals.target`: `dm` (डिफ़ॉल्ट) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom`, और `defaultTo` नियंत्रित करते हैं कि बॉट से कौन बात कर सकता है और वह सामान्य उत्तर कहां भेजता है. वे किसी को exec अनुमोदक नहीं बनाते. जब कोई command owner अभी मौजूद न हो, तो पहली अनुमोदित DM pairing `commands.ownerAllowFrom` को bootstraps करती है, इसलिए one-owner setup अब भी `execApprovals.approvers` के तहत IDs डुप्लिकेट किए बिना काम करता है.

    Channel delivery चैट में command text दिखाती है; `channel` या `both` को केवल विश्वसनीय groups/topics में सक्षम करें. जब prompt किसी forum topic में पहुंचता है, तो OpenClaw approval prompt और follow-up के लिए topic को संरक्षित रखता है. Exec अनुमोदन डिफ़ॉल्ट रूप से 30 मिनट बाद समाप्त हो जाते हैं.

    Inline approval buttons के लिए भी `channels.telegram.capabilities.inlineButtons` को लक्ष्य सतह (`dm`, `group`, या `all`) की अनुमति देनी होती है. `plugin:` से शुरू होने वाली Approval IDs plugin approvals के माध्यम से resolve होती हैं; बाकी पहले exec approvals के माध्यम से resolve होती हैं.

    [Exec अनुमोदन](/hi/tools/exec-approvals) देखें.

  </Accordion>
</AccordionGroup>

## त्रुटि उत्तर नियंत्रण

जब एजेंट को डिलीवरी या provider त्रुटि मिलती है, तो error policy नियंत्रित करती है कि त्रुटि संदेश Telegram चैट में भेजे जाएं या नहीं:

| कुंजी                                | मान                        | डिफ़ॉल्ट        | विवरण                                                                                                                                                                                                    |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — हर त्रुटि संदेश चैट में भेजें. `once` — प्रत्येक अद्वितीय त्रुटि संदेश को प्रति cooldown window एक बार भेजें (दोहराई गई समान त्रुटियों को दबाएं). `silent` — चैट में त्रुटि संदेश कभी न भेजें. |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | `once` नीति के लिए cooldown window. कोई त्रुटि भेजे जाने के बाद, वही त्रुटि संदेश इस अंतराल के समाप्त होने तक दबा दिया जाता है. outages के दौरान error spam रोकता है.                                      |

प्रति-account, प्रति-group, और प्रति-topic overrides समर्थित हैं (अन्य Telegram config keys जैसी ही inheritance).

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
  <Accordion title="बॉट non mention समूह संदेशों का उत्तर नहीं देता">

    - यदि `requireMention=false` है, तो Telegram privacy mode को पूरी visibility की अनुमति देनी होगी.
      - BotFather: `/setprivacy` -> Disable
      - फिर बॉट को समूह से हटाएं + फिर से जोड़ें
    - जब config unmentioned group messages की अपेक्षा करता है, तो `openclaw channels status` चेतावनी देता है.
    - `openclaw channels status --probe` स्पष्ट संख्यात्मक group IDs जांच सकता है; wildcard `"*"` की membership-probe नहीं की जा सकती.
    - त्वरित session test: `/activation always`.

  </Accordion>

  <Accordion title="बॉट को समूह संदेश बिल्कुल दिखाई नहीं दे रहे">

    - जब `channels.telegram.groups` मौजूद हो, तो समूह सूचीबद्ध होना चाहिए (या `"*"` शामिल करें)
    - समूह में बॉट membership सत्यापित करें
    - skip reasons के लिए logs देखें: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Commands आंशिक रूप से काम करते हैं या बिल्कुल नहीं">

    - अपनी sender identity को authorize करें (pairing और/या संख्यात्मक `allowFrom`)
    - group policy `open` होने पर भी command authorization लागू रहता है
    - `setMyCommands failed` के साथ `BOT_COMMANDS_TOO_MUCH` का अर्थ है कि native menu में बहुत अधिक entries हैं; plugin/skill/custom commands घटाएं या native menus अक्षम करें
    - `deleteMyCommands` / `setMyCommands` startup calls और `sendChatAction` typing calls bounded हैं और request timeout पर Telegram के transport fallback के माध्यम से एक बार पुनः प्रयास करते हैं. लगातार network/fetch errors आमतौर पर `api.telegram.org` तक DNS/HTTPS reachability समस्याओं का संकेत देते हैं

  </Accordion>

  <Accordion title="Startup unauthorized token रिपोर्ट करता है">

    - `getMe returned 401` कॉन्फ़िगर किए गए bot token के लिए Telegram authentication failure है.
    - BotFather में bot token को फिर से कॉपी या regenerate करें, फिर default account के लिए `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken`, या `TELEGRAM_BOT_TOKEN` अपडेट करें.
    - startup के दौरान `deleteWebhook 401 Unauthorized` भी auth failure है; इसे "no webhook exists" मानना उसी bad-token failure को बाद की API calls तक ही टालेगा.

  </Accordion>

  <Accordion title="Polling या network instability">

    - Node 22+ + custom fetch/proxy तत्काल abort behavior ट्रिगर कर सकते हैं यदि AbortSignal types mismatch हों.
    - कुछ hosts पहले `api.telegram.org` को IPv6 पर resolve करते हैं; broken IPv6 egress बीच-बीच में Telegram API failures पैदा कर सकता है.
    - यदि logs में `TypeError: fetch failed` या `Network request for 'getUpdates' failed!` शामिल है, तो OpenClaw अब इन्हें recoverable network errors के रूप में retry करता है.
    - polling startup के दौरान, OpenClaw grammY के लिए सफल startup `getMe` probe का पुनः उपयोग करता है ताकि runner को पहले `getUpdates` से पहले दूसरे `getMe` की आवश्यकता न हो.
    - यदि polling startup के दौरान `deleteWebhook` transient network error के साथ विफल होता है, तो OpenClaw एक और pre-poll control-plane call करने के बजाय long polling में जारी रहता है. अब भी सक्रिय webhook `getUpdates` conflict के रूप में सामने आता है; फिर OpenClaw Telegram transport को rebuild करता है और webhook cleanup का retry करता है.
    - यदि Telegram sockets छोटे fixed cadence पर recycle होते हैं, तो कम `channels.telegram.timeoutSeconds` की जांच करें; bot clients configured values को outbound और `getUpdates` request guards से नीचे clamp करते हैं, लेकिन पुराने releases हर poll या reply को abort कर सकते थे जब इसे उन guards से नीचे सेट किया गया था.
    - यदि logs में `Polling stall detected` शामिल है, तो OpenClaw डिफ़ॉल्ट रूप से completed long-poll liveness के बिना 120 seconds के बाद polling restart करता है और Telegram transport rebuild करता है.
    - `openclaw channels status --probe` और `openclaw doctor` चेतावनी देते हैं जब कोई running polling account startup grace के बाद `getUpdates` पूरा नहीं कर पाया हो, जब कोई running webhook account startup grace के बाद `setWebhook` पूरा नहीं कर पाया हो, या जब अंतिम सफल polling transport activity stale हो.
    - `channels.telegram.pollingStallThresholdMs` केवल तब बढ़ाएं जब long-running `getUpdates` calls स्वस्थ हों लेकिन आपका host अब भी false polling-stall restarts रिपोर्ट करे. Persistent stalls आमतौर पर host और `api.telegram.org` के बीच proxy, DNS, IPv6, या TLS egress issues की ओर संकेत करते हैं.
    - Telegram Bot API transport के लिए process proxy env का भी सम्मान करता है, जिनमें `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, और उनके lowercase variants शामिल हैं. `NO_PROXY` / `no_proxy` अब भी `api.telegram.org` को bypass कर सकते हैं.
    - यदि OpenClaw managed proxy किसी service environment के लिए `OPENCLAW_PROXY_URL` के माध्यम से configured है और कोई standard proxy env मौजूद नहीं है, तो Telegram भी Bot API transport के लिए वही URL उपयोग करता है.
    - unstable direct egress/TLS वाले VPS hosts पर, Telegram API calls को `channels.telegram.proxy` के माध्यम से route करें:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ में `autoSelectFamily=true` डिफ़ॉल्ट होता है (WSL2 को छोड़कर)। Telegram DNS परिणाम क्रम पहले `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, फिर `channels.telegram.network.dnsResultOrder`, फिर प्रक्रिया डिफ़ॉल्ट जैसे `NODE_OPTIONS=--dns-result-order=ipv4first` का पालन करता है; यदि कोई लागू नहीं होता, तो Node 22+ `ipv4first` पर वापस जाता है।
    - यदि आपका होस्ट WSL2 है या स्पष्ट रूप से IPv4-only व्यवहार के साथ बेहतर काम करता है, तो family चयन को बाध्य करें:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 बेंचमार्क-रेंज उत्तर (`198.18.0.0/15`) Telegram मीडिया डाउनलोड के लिए
      डिफ़ॉल्ट रूप से पहले से अनुमत हैं। यदि कोई विश्वसनीय fake-IP या
      पारदर्शी प्रॉक्सी मीडिया डाउनलोड के दौरान `api.telegram.org` को किसी अन्य
      private/internal/special-use पते पर फिर से लिखता है, तो आप केवल-Telegram बायपास
      में opt in कर सकते हैं:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - वही opt-in प्रति खाते पर
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` में उपलब्ध है।
    - यदि आपका प्रॉक्सी Telegram मीडिया होस्ट को `198.18.x.x` में resolve करता है, तो पहले
      dangerous फ्लैग बंद रखें। Telegram मीडिया पहले से ही डिफ़ॉल्ट रूप से RFC 2544
      बेंचमार्क रेंज की अनुमति देता है।

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` Telegram
      मीडिया SSRF सुरक्षा को कमजोर करता है। इसे केवल Clash, Mihomo, या Surge fake-IP routing जैसे
      विश्वसनीय operator-controlled प्रॉक्सी environments के लिए उपयोग करें, जब वे
      RFC 2544 बेंचमार्क रेंज के बाहर private या special-use उत्तर synthesize करते हैं।
      सामान्य public internet Telegram access के लिए इसे बंद रखें।
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

अधिक सहायता: [Channel troubleshooting](/hi/channels/troubleshooting)।

## Configuration reference

प्राथमिक reference: [Configuration reference - Telegram](/hi/gateway/config-channels#telegram)।

<Accordion title="High-signal Telegram fields">

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` को regular file की ओर point करना चाहिए; symlink अस्वीकार किए जाते हैं)
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
Multi-account precedence: जब दो या अधिक account IDs configured हों, तो default routing को explicit बनाने के लिए `channels.telegram.defaultAccount` set करें (या `channels.telegram.accounts.default` शामिल करें)। अन्यथा OpenClaw पहले normalized account ID पर वापस जाता है और `openclaw doctor` चेतावनी देता है। Named accounts `channels.telegram.allowFrom` / `groupAllowFrom` inherit करते हैं, लेकिन `accounts.default.*` values नहीं।
</Note>

## Related

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/hi/channels/pairing">
    Telegram user को Gateway से pair करें।
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
