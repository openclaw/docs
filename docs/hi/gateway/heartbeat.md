---
read_when:
    - Heartbeat की आवृत्ति या संदेश-प्रेषण समायोजित करना
    - निर्धारित कार्यों के लिए Heartbeat और Cron के बीच निर्णय लेना
sidebarTitle: Heartbeat
summary: Heartbeat पोलिंग संदेश और सूचना नियम
title: Heartbeat
x-i18n:
    generated_at: "2026-06-28T23:09:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 415c8f8f18143320a015e44237471b09b8fc091975f78dd9de025310df39645b
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat बनाम cron?** प्रत्येक का उपयोग कब करना है, इस पर मार्गदर्शन के लिए [Automation](/hi/automation) देखें।
</Note>

Heartbeat मुख्य सत्र में **आवधिक agent turns** चलाता है ताकि मॉडल आपको spam किए बिना ध्यान देने योग्य कोई भी चीज़ सामने ला सके।

Heartbeat एक निर्धारित मुख्य-सत्र turn है — यह [background task](/hi/automation/tasks) रिकॉर्ड नहीं बनाता। Task रिकॉर्ड अलग किए गए काम (ACP runs, subagents, isolated cron jobs) के लिए होते हैं।

समस्या-निवारण: [Scheduled Tasks](/hi/automation/cron-jobs#troubleshooting)

## तुरंत शुरू करें (शुरुआती)

<Steps>
  <Step title="एक cadence चुनें">
    heartbeats सक्षम छोड़ें (डिफ़ॉल्ट `30m` है, या Anthropic OAuth/token auth के लिए `1h`, जिसमें Claude CLI reuse भी शामिल है) या अपनी cadence सेट करें।
  </Step>
  <Step title="HEARTBEAT.md जोड़ें (वैकल्पिक)">
    agent workspace में एक छोटी `HEARTBEAT.md` checklist या `tasks:` block बनाएँ।
  </Step>
  <Step title="तय करें कि heartbeat संदेश कहाँ जाएँ">
    `target: "none"` डिफ़ॉल्ट है; अंतिम contact तक route करने के लिए `target: "last"` सेट करें।
  </Step>
  <Step title="वैकल्पिक tuning">
    - पारदर्शिता के लिए heartbeat reasoning delivery सक्षम करें।
    - अगर heartbeat runs को केवल `HEARTBEAT.md` चाहिए, तो lightweight bootstrap context उपयोग करें।
    - हर heartbeat पर पूरी conversation history भेजने से बचने के लिए isolated sessions सक्षम करें।
    - heartbeats को active hours (local time) तक सीमित करें।

  </Step>
</Steps>

उदाहरण config:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Thinking` message too
      },
    },
  },
}
```

## डिफ़ॉल्ट

- अंतराल: `30m` (या जब Anthropic OAuth/token auth detected auth mode हो, जिसमें Claude CLI reuse भी शामिल है, तब `1h`)। `agents.defaults.heartbeat.every` या प्रति-agent `agents.list[].heartbeat.every` सेट करें; अक्षम करने के लिए `0m` उपयोग करें।
- Prompt body (`agents.defaults.heartbeat.prompt` के ज़रिए configurable): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Timeout: unset heartbeat turns सेट होने पर `agents.defaults.timeoutSeconds` उपयोग करते हैं। अन्यथा, वे heartbeat cadence का उपयोग करते हैं, जिसे 600 seconds पर cap किया जाता है। लंबे heartbeat work के लिए `agents.defaults.heartbeat.timeoutSeconds` या प्रति-agent `agents.list[].heartbeat.timeoutSeconds` सेट करें।
- heartbeat prompt को user message के रूप में **जैसा है वैसा** भेजा जाता है। system prompt में "Heartbeat" section केवल तब शामिल होता है जब default agent के लिए heartbeats सक्षम हों, और run को internally flagged किया जाता है।
- जब heartbeats `0m` से अक्षम किए जाते हैं, तो normal runs bootstrap context से `HEARTBEAT.md` भी छोड़ देते हैं ताकि मॉडल heartbeat-only निर्देश न देखे।
- Active hours (`heartbeat.activeHours`) configured timezone में जाँचे जाते हैं। window के बाहर, heartbeats को window के भीतर अगले tick तक skip किया जाता है।
- cron work सक्रिय या queued होने पर heartbeats अपने-आप defer हो जाते हैं। किसी agent को उसके अपने session-keyed subagent या nested command lanes पर भी defer करने के लिए `heartbeat.skipWhenBusy: true` सेट करें; sibling agents अब सिर्फ इसलिए pause नहीं होते कि किसी दूसरे agent का subagent work चल रहा है।

## heartbeat prompt किसके लिए है

डिफ़ॉल्ट prompt जानबूझकर व्यापक है:

- **Background tasks**: "Consider outstanding tasks" agent को follow-ups (inbox, calendar, reminders, queued work) की समीक्षा करने और जरूरी चीज़ें सामने लाने के लिए प्रेरित करता है।
- **Human check-in**: "Checkup sometimes on your human during day time" कभी-कभी हल्का "कुछ चाहिए?" संदेश भेजने के लिए प्रेरित करता है, लेकिन आपकी configured local timezone का उपयोग करके रात का spam टालता है ([Timezone](/hi/concepts/timezone) देखें)।

Heartbeat पूरे हुए [background tasks](/hi/automation/tasks) पर प्रतिक्रिया दे सकता है, लेकिन heartbeat run स्वयं task record नहीं बनाता।

अगर आप चाहते हैं कि heartbeat कुछ बहुत विशिष्ट करे (जैसे "check Gmail PubSub stats" या "verify gateway health"), तो `agents.defaults.heartbeat.prompt` (या `agents.list[].heartbeat.prompt`) को custom body पर सेट करें (जैसा है वैसा भेजा जाता है)।

## Response contract

- अगर ध्यान देने योग्य कुछ नहीं है, तो **`HEARTBEAT_OK`** से reply करें।
- Tool-capable heartbeat runs इसके बजाय कोई visible update न देने के लिए `notify: false` के साथ `heartbeat_respond` call कर सकते हैं, या alert के लिए `notify: true` और `notificationText` उपयोग कर सकते हैं। मौजूद होने पर, structured tool response text fallback पर precedence लेता है।
- heartbeat runs के दौरान, OpenClaw `HEARTBEAT_OK` को ack मानता है जब यह reply के **शुरू या अंत** में आता है। token हटाया जाता है और यदि बची हुई content **≤ `ackMaxChars`** (डिफ़ॉल्ट: 300) है तो reply drop कर दिया जाता है।
- यदि `HEARTBEAT_OK` reply के **बीच** में आता है, तो उसके साथ कोई विशेष व्यवहार नहीं होता।
- alerts के लिए, **`HEARTBEAT_OK` शामिल न करें**; केवल alert text लौटाएँ।

heartbeats के बाहर, message के start/end पर stray `HEARTBEAT_OK` हटाया और logged किया जाता है; केवल `HEARTBEAT_OK` वाला message drop कर दिया जाता है।

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Thinking message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Scope और precedence

- `agents.defaults.heartbeat` global heartbeat behavior सेट करता है।
- `agents.list[].heartbeat` ऊपर merge होता है; यदि किसी agent में `heartbeat` block है, तो **केवल वे agents** heartbeats चलाते हैं।
- `channels.defaults.heartbeat` सभी channels के लिए visibility defaults सेट करता है।
- `channels.<channel>.heartbeat` channel defaults को override करता है।
- `channels.<channel>.accounts.<id>.heartbeat` (multi-account channels) per-channel settings को override करता है।

### प्रति-agent heartbeats

यदि किसी `agents.list[]` entry में `heartbeat` block शामिल है, तो **केवल वे agents** heartbeats चलाते हैं। per-agent block `agents.defaults.heartbeat` के ऊपर merge होता है (इसलिए आप shared defaults एक बार सेट करके प्रति agent override कर सकते हैं)।

उदाहरण: दो agents, केवल दूसरा agent heartbeats चलाता है।

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Active hours उदाहरण

किसी विशिष्ट timezone में heartbeats को business hours तक सीमित करें:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

इस window के बाहर (Eastern में सुबह 9 बजे से पहले या रात 10 बजे के बाद), heartbeats skip किए जाते हैं। window के भीतर अगला scheduled tick सामान्य रूप से चलेगा।

### 24/7 setup

अगर आप चाहते हैं कि heartbeats पूरे दिन चलें, तो इनमें से कोई pattern उपयोग करें:

- `activeHours` को पूरी तरह omit करें (कोई time-window restriction नहीं; यह default behavior है)।
- full-day window सेट करें: `activeHours: { start: "00:00", end: "24:00" }`।

<Warning>
एक ही `start` और `end` time सेट न करें (उदाहरण के लिए `08:00` से `08:00`)। इसे zero-width window माना जाता है, इसलिए heartbeats हमेशा skip किए जाते हैं।
</Warning>

### Multi-account उदाहरण

Telegram जैसे multi-account channels पर किसी specific account को target करने के लिए `accountId` उपयोग करें:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Field notes

<ParamField path="every" type="string">
  Heartbeat interval (duration string; default unit = minutes)।
</ParamField>
<ParamField path="model" type="string">
  heartbeat runs के लिए वैकल्पिक model override (`provider/model`)।
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  सक्षम होने पर, उपलब्ध होने पर अलग `Thinking` message भी deliver करें (`/reasoning on` जैसा same shape)।
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  true होने पर, heartbeat runs lightweight bootstrap context उपयोग करते हैं और workspace bootstrap files से केवल `HEARTBEAT.md` रखते हैं।
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  true होने पर, प्रत्येक heartbeat बिना prior conversation history के fresh session में चलता है। cron `sessionTarget: "isolated"` जैसा same isolation pattern उपयोग करता है। प्रति-heartbeat token cost बहुत कम करता है। अधिकतम savings के लिए `lightContext: true` के साथ combine करें। Delivery routing अब भी main session context उपयोग करता है।
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  true होने पर, heartbeat runs उस agent की अतिरिक्त busy lanes पर defer होते हैं: उसका अपना session-keyed subagent या nested command work। Cron lanes हमेशा heartbeats को defer करते हैं, इस flag के बिना भी, ताकि local-model hosts एक ही समय में cron और heartbeat prompts न चलाएँ।
</ParamField>
<ParamField path="session" type="string">
  heartbeat runs के लिए वैकल्पिक session key।

- `main` (डिफ़ॉल्ट): agent main session।
- Explicit session key (`openclaw sessions --json` या [sessions CLI](/hi/cli/sessions) से copy करें)।
- Session key formats: [Sessions](/hi/concepts/session) और [Groups](/hi/channels/groups) देखें।

</ParamField>
<ParamField path="target" type="string">
- `last`: अंतिम उपयोग किए गए external channel पर deliver करें।
- explicit channel: कोई भी configured channel या plugin id, उदाहरण के लिए `discord`, `matrix`, `telegram`, या `whatsapp`।
- `none` (डिफ़ॉल्ट): heartbeat चलाएँ लेकिन externally **deliver न करें**।

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  direct/DM delivery behavior को नियंत्रित करता है। `allow`: direct/DM heartbeat delivery allow करें। `block`: direct/DM delivery suppress करें (`reason=dm-blocked`)।

</ParamField>
<ParamField path="to" type="string">
  वैकल्पिक recipient override (channel-specific id, जैसे WhatsApp के लिए E.164 या Telegram chat id)। Telegram topics/threads के लिए, `<chatId>:topic:<messageThreadId>` उपयोग करें।

</ParamField>
<ParamField path="accountId" type="string">
  बहु-खाता चैनलों के लिए वैकल्पिक खाता id। जब `target: "last"` हो, तो खाता id हल किए गए अंतिम चैनल पर लागू होता है यदि वह खातों का समर्थन करता है; अन्यथा इसे अनदेखा किया जाता है। यदि खाता id हल किए गए चैनल के लिए कॉन्फ़िगर किए गए खाते से मेल नहीं खाता, तो डिलीवरी छोड़ दी जाती है।

</ParamField>
<ParamField path="prompt" type="string">
  डिफ़ॉल्ट प्रॉम्प्ट बॉडी को ओवरराइड करता है (मर्ज नहीं किया जाता)।

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  डिलीवरी से पहले `HEARTBEAT_OK` के बाद अनुमत अधिकतम वर्ण।

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  true होने पर, Heartbeat रन के दौरान टूल त्रुटि चेतावनी पेलोड दबाता है।

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Heartbeat एजेंट टर्न के निरस्त होने से पहले अनुमत अधिकतम सेकंड। सेट न होने पर, यदि `agents.defaults.timeoutSeconds` सेट है तो उसका उपयोग किया जाता है, अन्यथा Heartbeat कैडेंस का उपयोग किया जाता है, जिसकी सीमा 600 सेकंड है।

</ParamField>
<ParamField path="activeHours" type="object">
  Heartbeat रन को समय विंडो तक सीमित करता है। ऑब्जेक्ट जिसमें `start` (HH:MM, समावेशी; दिन की शुरुआत के लिए `00:00` का उपयोग करें), `end` (HH:MM अपवर्जक; दिन के अंत के लिए `24:00` अनुमत), और वैकल्पिक `timezone` होता है।

- छोड़ा गया या `"user"`: यदि सेट है तो आपके `agents.defaults.userTimezone` का उपयोग करता है, अन्यथा होस्ट सिस्टम समयक्षेत्र पर वापस जाता है।
- `"local"`: हमेशा होस्ट सिस्टम समयक्षेत्र का उपयोग करता है।
- कोई भी IANA पहचानकर्ता (जैसे `America/New_York`): सीधे उपयोग किया जाता है; अमान्य होने पर, ऊपर दिए गए `"user"` व्यवहार पर वापस जाता है।
- सक्रिय विंडो के लिए `start` और `end` बराबर नहीं होने चाहिए; बराबर मानों को शून्य-चौड़ाई माना जाता है (हमेशा विंडो के बाहर)।
- सक्रिय विंडो के बाहर, Heartbeat को विंडो के अंदर अगले टिक तक छोड़ दिया जाता है।

</ParamField>

## डिलीवरी व्यवहार

<AccordionGroup>
  <Accordion title="सत्र और लक्ष्य रूटिंग">
    - Heartbeat डिफ़ॉल्ट रूप से एजेंट के मुख्य सत्र (`agent:<id>:<mainKey>`) में चलते हैं, या जब `session.scope = "global"` हो तो `global` में। किसी विशिष्ट चैनल सत्र (Discord/WhatsApp/आदि) पर ओवरराइड करने के लिए `session` सेट करें।
    - `session` केवल रन संदर्भ को प्रभावित करता है; डिलीवरी `target` और `to` द्वारा नियंत्रित होती है।
    - किसी विशिष्ट चैनल/प्राप्तकर्ता को डिलीवर करने के लिए, `target` + `to` सेट करें। `target: "last"` के साथ, डिलीवरी उस सत्र के अंतिम बाहरी चैनल का उपयोग करती है।
    - Heartbeat डिलीवरी डिफ़ॉल्ट रूप से direct/DM लक्ष्यों की अनुमति देती हैं। Heartbeat टर्न चलाते हुए भी direct-target भेजने को दबाने के लिए `directPolicy: "block"` सेट करें।
    - यदि मुख्य कतार, लक्ष्य सत्र लेन, Cron लेन, या कोई सक्रिय Cron जॉब व्यस्त है, तो Heartbeat छोड़ दिया जाता है और बाद में फिर से प्रयास किया जाता है।
    - यदि `skipWhenBusy: true` है, तो इस एजेंट का session-keyed subagent और nested lanes भी Heartbeat रन को स्थगित करते हैं। अन्य एजेंटों की व्यस्त लेन इस एजेंट को स्थगित नहीं करतीं।
    - यदि `target` किसी बाहरी गंतव्य में हल नहीं होता, तो रन फिर भी होता है लेकिन कोई आउटबाउंड संदेश नहीं भेजा जाता।

  </Accordion>
  <Accordion title="दृश्यता और छोड़ने का व्यवहार">
    - यदि `showOk`, `showAlerts`, और `useIndicator` सभी अक्षम हैं, तो रन शुरुआत में ही `reason=alerts-disabled` के रूप में छोड़ दिया जाता है।
    - यदि केवल अलर्ट डिलीवरी अक्षम है, तो OpenClaw फिर भी Heartbeat चला सकता है, देय-कार्य टाइमस्टैम्प अपडेट कर सकता है, सत्र idle टाइमस्टैम्प पुनर्स्थापित कर सकता है, और बाहरी अलर्ट पेलोड दबा सकता है।
    - यदि हल किया गया Heartbeat लक्ष्य typing का समर्थन करता है, तो OpenClaw Heartbeat रन सक्रिय होने के दौरान typing दिखाता है। यह उसी लक्ष्य का उपयोग करता है जिस पर Heartbeat चैट आउटपुट भेजता, और इसे `typingMode: "never"` द्वारा अक्षम किया जाता है।

  </Accordion>
  <Accordion title="सत्र जीवनचक्र और ऑडिट">
    - केवल-Heartbeat उत्तर सत्र को जीवित **नहीं** रखते। Heartbeat मेटाडेटा सत्र पंक्ति को अपडेट कर सकता है, लेकिन idle expiry अंतिम वास्तविक उपयोगकर्ता/चैनल संदेश के `lastInteractionAt` का उपयोग करती है, और daily expiry `sessionStartedAt` का उपयोग करती है।
    - Control UI और WebChat इतिहास Heartbeat प्रॉम्प्ट और केवल-OK स्वीकृतियों को छिपाते हैं। अंतर्निहित सत्र ट्रांसक्रिप्ट में ऑडिट/रीप्ले के लिए वे टर्न फिर भी हो सकते हैं।
    - अलग किए गए [पृष्ठभूमि कार्य](/hi/automation/tasks) एक सिस्टम इवेंट को कतारबद्ध कर सकते हैं और जब मुख्य सत्र को किसी बात पर जल्दी ध्यान देना चाहिए, तब Heartbeat को जगा सकते हैं। वह wake Heartbeat रन को पृष्ठभूमि कार्य नहीं बनाता।

  </Accordion>
</AccordionGroup>

## दृश्यता नियंत्रण

डिफ़ॉल्ट रूप से, `HEARTBEAT_OK` स्वीकृतियां दबाई जाती हैं जबकि अलर्ट सामग्री डिलीवर होती है। आप इसे प्रति चैनल या प्रति खाते समायोजित कर सकते हैं:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

प्राथमिकता: प्रति-खाता → प्रति-चैनल → चैनल डिफ़ॉल्ट → अंतर्निहित डिफ़ॉल्ट।

### प्रत्येक फ़्लैग क्या करता है

- `showOk`: जब मॉडल केवल-OK उत्तर लौटाता है, तो `HEARTBEAT_OK` स्वीकृति भेजता है।
- `showAlerts`: जब मॉडल non-OK उत्तर लौटाता है, तो अलर्ट सामग्री भेजता है।
- `useIndicator`: UI स्थिति सतहों के लिए indicator events उत्सर्जित करता है।

यदि **तीनों** false हैं, तो OpenClaw Heartbeat रन को पूरी तरह छोड़ देता है (कोई मॉडल कॉल नहीं)।

### प्रति-चैनल बनाम प्रति-खाता उदाहरण

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### सामान्य पैटर्न

| लक्ष्य                                     | कॉन्फ़िगरेशन                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| डिफ़ॉल्ट व्यवहार (मौन OK, अलर्ट चालू) | _(कोई कॉन्फ़िगरेशन आवश्यक नहीं)_                                                                     |
| पूरी तरह मौन (कोई संदेश नहीं, कोई indicator नहीं) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| केवल-indicator (कोई संदेश नहीं)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| केवल एक चैनल में OK                  | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (वैकल्पिक)

यदि कार्यक्षेत्र में `HEARTBEAT.md` फ़ाइल मौजूद है, तो डिफ़ॉल्ट प्रॉम्प्ट एजेंट को इसे पढ़ने के लिए कहता है। इसे अपनी "Heartbeat चेकलिस्ट" समझें: छोटी, स्थिर, और हर 30 मिनट में विचार करने के लिए सुरक्षित।

सामान्य रन में, `HEARTBEAT.md` केवल तब inject किया जाता है जब डिफ़ॉल्ट एजेंट के लिए Heartbeat guidance सक्षम हो। Heartbeat कैडेंस को `0m` से अक्षम करना या `includeSystemPromptSection: false` सेट करना इसे सामान्य bootstrap context से हटा देता है।

native Codex harness पर, `HEARTBEAT.md` सामग्री टर्न में inject नहीं की जाती। यदि फ़ाइल मौजूद है और उसमें non-whitespace सामग्री है, तो Heartbeat collaboration-mode निर्देश Codex को फ़ाइल की ओर इंगित करते हैं और आगे बढ़ने से पहले उसे पढ़ने को कहते हैं।

यदि `HEARTBEAT.md` मौजूद है लेकिन व्यावहारिक रूप से खाली है (केवल खाली पंक्तियां, Markdown/HTML टिप्पणियां, `# Heading` जैसे Markdown शीर्षक, fence markers, या खाली checklist stubs), तो OpenClaw API कॉल बचाने के लिए Heartbeat रन छोड़ देता है। वह छोड़ना `reason=empty-heartbeat-file` के रूप में रिपोर्ट किया जाता है। यदि फ़ाइल अनुपस्थित है, तो Heartbeat फिर भी चलता है और मॉडल तय करता है कि क्या करना है।

प्रॉम्प्ट bloat से बचने के लिए इसे बहुत छोटा रखें (छोटी चेकलिस्ट या reminders)।

उदाहरण `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### `tasks:` ब्लॉक

`HEARTBEAT.md` Heartbeat के अंदर अंतराल-आधारित जांचों के लिए एक छोटे संरचित `tasks:` ब्लॉक का भी समर्थन करता है।

उदाहरण:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="व्यवहार">
    - OpenClaw `tasks:` ब्लॉक को parse करता है और प्रत्येक कार्य को उसके अपने `interval` के विरुद्ध जांचता है।
    - उस tick के लिए Heartbeat प्रॉम्प्ट में केवल **देय** कार्य शामिल किए जाते हैं।
    - यदि कोई कार्य देय नहीं है, तो बेकार मॉडल कॉल से बचने के लिए Heartbeat पूरी तरह छोड़ दिया जाता है (`reason=no-tasks-due`)।
    - `HEARTBEAT.md` में non-task सामग्री संरक्षित रहती है और due-task सूची के बाद अतिरिक्त संदर्भ के रूप में जोड़ी जाती है।
    - कार्य last-run टाइमस्टैम्प सत्र स्थिति (`heartbeatTaskState`) में संग्रहीत होते हैं, इसलिए अंतराल सामान्य restart के बाद भी बने रहते हैं।
    - कार्य टाइमस्टैम्प केवल Heartbeat रन के अपना सामान्य reply path पूरा करने के बाद ही आगे बढ़ाए जाते हैं। छोड़े गए `empty-heartbeat-file` / `no-tasks-due` रन कार्यों को पूरा चिह्नित नहीं करते।

  </Accordion>
</AccordionGroup>

Task mode तब उपयोगी होता है जब आप एक Heartbeat फ़ाइल में कई आवधिक जांचें रखना चाहते हैं, बिना हर tick पर उन सभी के लिए भुगतान किए।

### क्या एजेंट HEARTBEAT.md अपडेट कर सकता है?

हां — यदि आप उससे ऐसा करने को कहें।

`HEARTBEAT.md` एजेंट कार्यक्षेत्र में बस एक सामान्य फ़ाइल है, इसलिए आप एजेंट को (सामान्य चैट में) कुछ इस तरह बता सकते हैं:

- "`HEARTBEAT.md` अपडेट करके दैनिक calendar check जोड़ें।"
- "`HEARTBEAT.md` को फिर से लिखें ताकि यह छोटा हो और inbox follow-ups पर केंद्रित हो।"

यदि आप चाहते हैं कि यह proactively हो, तो आप अपने Heartbeat प्रॉम्प्ट में एक स्पष्ट पंक्ति भी शामिल कर सकते हैं, जैसे: "यदि checklist पुरानी हो जाए, तो HEARTBEAT.md को बेहतर वाली से अपडेट करें।"

<Warning>
`HEARTBEAT.md` में secrets (API keys, phone numbers, private tokens) न डालें — यह prompt context का हिस्सा बन जाता है।
</Warning>

## मैन्युअल wake (on-demand)

आप एक सिस्टम इवेंट कतारबद्ध कर सकते हैं और तत्काल Heartbeat trigger कर सकते हैं:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

यदि कई एजेंटों में `heartbeat` कॉन्फ़िगर है, तो manual wake उन प्रत्येक एजेंट Heartbeat को तुरंत चलाता है।

अगले scheduled tick की प्रतीक्षा करने के लिए `--mode next-heartbeat` का उपयोग करें।

## Reasoning डिलीवरी (वैकल्पिक)

डिफ़ॉल्ट रूप से, Heartbeat केवल अंतिम "answer" पेलोड डिलीवर करते हैं।

यदि आप transparency चाहते हैं, तो सक्षम करें:

- `agents.defaults.heartbeat.includeReasoning: true`

सक्षम होने पर, Heartbeat `Thinking` से prefixed एक अलग संदेश भी डिलीवर करेंगे (`/reasoning on` जैसी ही shape)। यह तब उपयोगी हो सकता है जब एजेंट कई sessions/codexes प्रबंधित कर रहा हो और आप देखना चाहते हों कि उसने आपको ping करने का निर्णय क्यों लिया — लेकिन यह आपकी इच्छा से अधिक internal detail भी leak कर सकता है। group chats में इसे बंद रखना बेहतर है।

## लागत जागरूकता

Heartbeat पूर्ण एजेंट टर्न चलाते हैं। छोटे अंतराल अधिक tokens खर्च करते हैं। लागत कम करने के लिए:

- पूरी conversation history भेजने से बचने के लिए `isolatedSession: true` का उपयोग करें (~100K tokens से घटकर प्रति रन ~2-5K)।
- bootstrap files को केवल `HEARTBEAT.md` तक सीमित करने के लिए `lightContext: true` का उपयोग करें।
- सस्ता `model` सेट करें (जैसे `ollama/llama3.2:1b`)।
- `HEARTBEAT.md` छोटा रखें।
- यदि आप केवल internal state updates चाहते हैं, तो `target: "none"` का उपयोग करें।

## Heartbeat के बाद संदर्भ overflow

यदि किसी Heartbeat ने पहले मौजूदा सत्र को छोटे local model पर छोड़ दिया था, उदाहरण के लिए 32k window वाला Ollama model, और अगला main-session turn context overflow रिपोर्ट करता है, तो सत्र runtime model को configured primary model पर वापस reset करें। जब अंतिम runtime model configured `heartbeat.model` से मेल खाता है, तो OpenClaw का reset message इसे स्पष्ट करता है।

वर्तमान Heartbeat रन पूरा होने के बाद shared session के मौजूदा runtime model को संरक्षित रखते हैं। आप फिर भी fresh session में Heartbeat चलाने के लिए `isolatedSession: true` का उपयोग कर सकते हैं, सबसे छोटे प्रॉम्प्ट के लिए इसे `lightContext: true` के साथ जोड़ सकते हैं, या shared session के लिए पर्याप्त बड़े context window वाला Heartbeat model चुन सकते हैं।

## संबंधित

- [ऑटोमेशन](/hi/automation) — सभी ऑटोमेशन तंत्रों का एक नज़र में अवलोकन
- [पृष्ठभूमि कार्य](/hi/automation/tasks) — अलग चलाए जाने वाले कार्य को कैसे ट्रैक किया जाता है
- [समयक्षेत्र](/hi/concepts/timezone) — समयक्षेत्र Heartbeat शेड्यूलिंग को कैसे प्रभावित करता है
- [समस्या निवारण](/hi/automation/cron-jobs#troubleshooting) — ऑटोमेशन समस्याओं को डीबग करना
