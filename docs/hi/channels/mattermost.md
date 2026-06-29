---
read_when:
    - Mattermost सेट अप करना
    - Mattermost रूटिंग की डिबगिंग
sidebarTitle: Mattermost
summary: Mattermost बॉट सेटअप और OpenClaw कॉन्फिग
title: Mattermost
x-i18n:
    generated_at: "2026-06-28T22:36:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

स्थिति: डाउनलोड करने योग्य Plugin (बॉट टोकन + WebSocket इवेंट)। चैनल, समूह और DM समर्थित हैं। Mattermost एक स्वयं-होस्ट करने योग्य टीम मैसेजिंग प्लेटफ़ॉर्म है; उत्पाद विवरण और डाउनलोड के लिए आधिकारिक साइट [mattermost.com](https://mattermost.com) देखें।

## इंस्टॉल करें

चैनल कॉन्फ़िगर करने से पहले Mattermost इंस्टॉल करें:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

विवरण: [Plugins](/hi/tools/plugin)

## त्वरित सेटअप

<Steps>
  <Step title="Ensure plugin is available">
    ऊपर दिए गए कमांड से `@openclaw/mattermost` इंस्टॉल करें, फिर यदि Gateway पहले से चल रहा है तो उसे रीस्टार्ट करें।
  </Step>
  <Step title="Create a Mattermost bot">
    Mattermost बॉट खाता बनाएं और **बॉट टोकन** कॉपी करें।
  </Step>
  <Step title="Copy the base URL">
    Mattermost **बेस URL** कॉपी करें (जैसे, `https://chat.example.com`)।
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
    न्यूनतम कॉन्फ़िग:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## नेटिव स्लैश कमांड

नेटिव स्लैश कमांड ऑप्ट-इन हैं। सक्षम होने पर, OpenClaw Mattermost API के माध्यम से `oc_*` स्लैश कमांड रजिस्टर करता है और Gateway HTTP सर्वर पर कॉलबैक POST प्राप्त करता है।

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Behavior notes">
    - `native: "auto"` Mattermost के लिए डिफ़ॉल्ट रूप से अक्षम रहता है। सक्षम करने के लिए `native: true` सेट करें।
    - यदि `callbackUrl` छोड़ा गया है, तो OpenClaw Gateway होस्ट/पोर्ट + `callbackPath` से एक बनाता है।
    - मल्टी-अकाउंट सेटअप के लिए, `commands` को शीर्ष स्तर पर या `channels.mattermost.accounts.<id>.commands` के अंतर्गत सेट किया जा सकता है (अकाउंट मान शीर्ष-स्तरीय फ़ील्ड को ओवरराइड करते हैं)।
    - कमांड कॉलबैक उन प्रति-कमांड टोकन से सत्यापित होते हैं जो OpenClaw द्वारा `oc_*` कमांड रजिस्टर करने पर Mattermost लौटाता है।
    - OpenClaw प्रत्येक कॉलबैक स्वीकार करने से पहले वर्तमान Mattermost कमांड रजिस्ट्रेशन रीफ़्रेश करता है, ताकि हटाए गए या फिर से जनरेट किए गए स्लैश कमांड के पुराने टोकन Gateway रीस्टार्ट के बिना स्वीकार होना बंद हो जाएं।
    - यदि Mattermost API यह पुष्टि नहीं कर सकता कि कमांड अभी भी वर्तमान है, तो कॉलबैक सत्यापन बंद-स्थिति में विफल होता है; विफल सत्यापन थोड़े समय के लिए कैश होते हैं, समवर्ती लुकअप को मिलाया जाता है, और ताज़े लुकअप की शुरुआत को प्रति कमांड रेट-लिमिट किया जाता है ताकि रीप्ले दबाव सीमित रहे।
    - जब रजिस्ट्रेशन विफल हुआ हो, स्टार्टअप आंशिक रहा हो, या कॉलबैक टोकन resolved कमांड के रजिस्टर्ड टोकन से मेल न खाता हो, तो स्लैश कॉलबैक बंद-स्थिति में विफल होते हैं (एक कमांड के लिए वैध टोकन किसी दूसरे कमांड के लिए upstream सत्यापन तक नहीं पहुंच सकता)।

  </Accordion>
  <Accordion title="Reachability requirement">
    कॉलबैक endpoint Mattermost सर्वर से पहुंच योग्य होना चाहिए।

    - `callbackUrl` को `localhost` पर सेट न करें, जब तक Mattermost उसी होस्ट/नेटवर्क नेमस्पेस पर OpenClaw के साथ न चल रहा हो।
    - `callbackUrl` को अपने Mattermost बेस URL पर सेट न करें, जब तक वह URL `/api/channels/mattermost/command` को OpenClaw पर रिवर्स-प्रॉक्सी न करता हो।
    - एक त्वरित जांच `curl https://<gateway-host>/api/channels/mattermost/command` है; GET को OpenClaw से `405 Method Not Allowed` लौटाना चाहिए, `404` नहीं।

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    यदि आपका कॉलबैक निजी/tailnet/आंतरिक पतों को लक्षित करता है, तो Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` को कॉलबैक होस्ट/डोमेन शामिल करने के लिए सेट करें।

    पूर्ण URL नहीं, होस्ट/डोमेन प्रविष्टियां उपयोग करें।

    - सही: `gateway.tailnet-name.ts.net`
    - गलत: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## पर्यावरण चर (डिफ़ॉल्ट अकाउंट)

यदि आप env vars पसंद करते हैं, तो इन्हें Gateway होस्ट पर सेट करें:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Env vars केवल **डिफ़ॉल्ट** अकाउंट (`default`) पर लागू होते हैं। अन्य अकाउंट को कॉन्फ़िग मान उपयोग करने होंगे।

`MATTERMOST_URL` को workspace `.env` से सेट नहीं किया जा सकता; [Workspace `.env` फ़ाइलें](/hi/gateway/security) देखें।
</Note>

## चैट मोड

Mattermost DM का अपने-आप उत्तर देता है। चैनल व्यवहार `chatmode` से नियंत्रित होता है:

<Tabs>
  <Tab title="oncall (default)">
    चैनलों में केवल @mention किए जाने पर उत्तर दें।
  </Tab>
  <Tab title="onmessage">
    हर चैनल संदेश का उत्तर दें।
  </Tab>
  <Tab title="onchar">
    जब संदेश trigger prefix से शुरू हो, तब उत्तर दें।
  </Tab>
</Tabs>

कॉन्फ़िग उदाहरण:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

नोट्स:

- `onchar` फिर भी स्पष्ट @mentions का उत्तर देता है।
- लेगेसी कॉन्फ़िग के लिए `channels.mattermost.requireMention` का सम्मान किया जाता है, लेकिन `chatmode` को प्राथमिकता दी जाती है।
- बॉट द्वारा चैनल थ्रेड में दृश्यमान उत्तर भेजने के बाद, उसी थ्रेड में बाद के संदेशों का उत्तर नए @mention या `onchar` prefix के बिना दिया जाता है, ताकि बहु-टर्न थ्रेड वार्तालाप चलते रहें। भागीदारी थ्रेड निष्क्रियता के 7 दिनों तक याद रखी जाती है (हर उत्तर पर रीफ़्रेश होती है) और Gateway रीस्टार्ट के बाद भी बनी रहती है। जिन थ्रेड को बॉट ने केवल देखा है, वे अप्रभावित रहते हैं; फिर से स्पष्ट mention आवश्यक करने के लिए नया top-level संदेश शुरू करें।

## थ्रेडिंग और सेशन

`channels.mattermost.replyToMode` का उपयोग करके नियंत्रित करें कि चैनल और समूह उत्तर मुख्य चैनल में रहें या triggering पोस्ट के अंतर्गत थ्रेड शुरू करें।

- `off` (डिफ़ॉल्ट): केवल तब थ्रेड में उत्तर दें जब inbound पोस्ट पहले से किसी थ्रेड में हो।
- `first`: top-level चैनल/समूह पोस्ट के लिए, उस पोस्ट के अंतर्गत थ्रेड शुरू करें और वार्तालाप को thread-scoped session पर रूट करें।
- `all`: Mattermost के लिए आज `first` जैसा ही व्यवहार।
- डायरेक्ट मैसेज इस सेटिंग को अनदेखा करते हैं और non-threaded रहते हैं।

कॉन्फ़िग उदाहरण:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

नोट्स:

- Thread-scoped sessions triggering पोस्ट id को thread root के रूप में उपयोग करते हैं।
- `first` और `all` अभी समान हैं क्योंकि Mattermost के पास thread root हो जाने पर follow-up chunks और media उसी थ्रेड में जारी रहते हैं।

## एक्सेस नियंत्रण (DMs)

- डिफ़ॉल्ट: `channels.mattermost.dmPolicy = "pairing"` (अज्ञात भेजने वालों को pairing code मिलता है)।
- इसके माध्यम से अनुमोदित करें:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- सार्वजनिक DMs: `channels.mattermost.dmPolicy="open"` और `channels.mattermost.allowFrom=["*"]`।
- `channels.mattermost.allowFrom` `accessGroup:<name>` प्रविष्टियां स्वीकार करता है। [Access groups](/hi/channels/access-groups) देखें।

## चैनल (समूह)

- डिफ़ॉल्ट: `channels.mattermost.groupPolicy = "allowlist"` (mention-gated)।
- `channels.mattermost.groupAllowFrom` से भेजने वालों को allowlist करें (user IDs अनुशंसित)।
- `channels.mattermost.groupAllowFrom` `accessGroup:<name>` प्रविष्टियां स्वीकार करता है। [Access groups](/hi/channels/access-groups) देखें।
- प्रति-चैनल mention overrides `channels.mattermost.groups.<channelId>.requireMention` या डिफ़ॉल्ट के लिए `channels.mattermost.groups["*"].requireMention` के अंतर्गत रहते हैं।
- `@username` matching mutable है और केवल तब सक्षम होता है जब `channels.mattermost.dangerouslyAllowNameMatching: true` हो।
- खुले चैनल: `channels.mattermost.groupPolicy="open"` (mention-gated)।
- रनटाइम नोट: यदि `channels.mattermost` पूरी तरह अनुपस्थित है, तो रनटाइम समूह जांचों के लिए `groupPolicy="allowlist"` पर fallback करता है (भले ही `channels.defaults.groupPolicy` सेट हो)।

उदाहरण:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## आउटबाउंड डिलीवरी के लिए target

इन target formats को `openclaw message send` या Cron/Webhook के साथ उपयोग करें:

- चैनल के लिए `channel:<id>`
- DM के लिए `user:<id>`
- DM के लिए `@username` (Mattermost API के माध्यम से resolved)

<Warning>
Bare opaque IDs (जैसे `64ifufp...`) Mattermost में **अस्पष्ट** हैं (user ID बनाम channel ID)।

OpenClaw उन्हें **user-first** resolve करता है:

- यदि ID user के रूप में मौजूद है (`GET /api/v4/users/<id>` सफल होता है), तो OpenClaw direct channel को `/api/v4/channels/direct` के माध्यम से resolve करके **DM** भेजता है।
- अन्यथा ID को **channel ID** माना जाता है।

यदि आपको deterministic व्यवहार चाहिए, तो हमेशा स्पष्ट prefixes (`user:<id>` / `channel:<id>`) उपयोग करें।
</Warning>

## DM चैनल retry

जब OpenClaw Mattermost DM target को भेजता है और पहले direct channel resolve करना पड़ता है, तो यह डिफ़ॉल्ट रूप से transient direct-channel creation failures को retry करता है।

Mattermost Plugin के लिए इस व्यवहार को globally tune करने के लिए `channels.mattermost.dmChannelRetry` उपयोग करें, या किसी एक अकाउंट के लिए `channels.mattermost.accounts.<id>.dmChannelRetry`।

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

नोट्स:

- यह केवल DM channel creation (`/api/v4/channels/direct`) पर लागू होता है, हर Mattermost API call पर नहीं।
- Retries transient failures पर लागू होते हैं, जैसे rate limits, 5xx responses, और network या timeout errors।
- `429` के अलावा 4xx client errors को स्थायी माना जाता है और retry नहीं किया जाता।

## प्रीव्यू स्ट्रीमिंग

Mattermost thinking, tool activity, और partial reply text को एक **draft preview post** में stream करता है, जो अंतिम उत्तर भेजने के लिए सुरक्षित होने पर उसी स्थान पर final हो जाता है। Preview updates प्रति-chunk messages से चैनल को spam करने के बजाय उसी post id पर होते हैं। Media/error finals pending preview edits को cancel करते हैं और throwaway preview post flush करने के बजाय सामान्य delivery उपयोग करते हैं।

`channels.mattermost.streaming` के माध्यम से सक्षम करें:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Streaming modes">
    - `partial` सामान्य विकल्प है: एक preview post जिसे reply बढ़ने पर edit किया जाता है, फिर पूर्ण उत्तर के साथ final किया जाता है।
    - `block` preview post के अंदर append-style draft chunks उपयोग करता है।
    - `progress` generation के दौरान status preview दिखाता है और completion पर ही अंतिम उत्तर पोस्ट करता है।
    - `off` preview streaming को अक्षम करता है।

  </Accordion>
  <Accordion title="Streaming behavior notes">
    - यदि stream को उसी स्थान पर final नहीं किया जा सकता (उदाहरण के लिए post mid-stream में delete हो गया), तो OpenClaw नया final post भेजने पर fallback करता है ताकि reply कभी खोए नहीं।
    - Thinking-only payloads को channel posts से suppress किया जाता है, जिसमें वह text भी शामिल है जो `> Thinking` blockquote के रूप में आता है। अन्य surfaces में thinking देखने के लिए `/reasoning on` सेट करें; Mattermost final post केवल उत्तर रखता है।
    - channel-mapping matrix के लिए [Streaming](/hi/concepts/streaming#preview-streaming-modes) देखें।

  </Accordion>
</AccordionGroup>

## Reactions (message tool)

- `channel=mattermost` के साथ `message action=react` उपयोग करें।
- `messageId` Mattermost post id है।
- `emoji` `thumbsup` या `:+1:` जैसे names स्वीकार करता है (colons वैकल्पिक हैं)।
- reaction हटाने के लिए `remove=true` (boolean) सेट करें।
- Reaction add/remove events routed agent session को system events के रूप में forward किए जाते हैं।

उदाहरण:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

कॉन्फ़िग:

- `channels.mattermost.actions.reactions`: reaction actions सक्षम/अक्षम करें (डिफ़ॉल्ट true)।
- प्रति-अकाउंट override: `channels.mattermost.accounts.<id>.actions.reactions`।

## Interactive buttons (message tool)

Clickable buttons वाले संदेश भेजें। जब user button पर क्लिक करता है, तो agent selection प्राप्त करता है और उत्तर दे सकता है।

सामान्य एजेंट उत्तरों में semantic `presentation` payloads भी शामिल हो सकते हैं। OpenClaw value बटनों को Mattermost interactive buttons के रूप में render करता है, URL बटनों को message text में visible रखता है, और select menus को readable text में downgrade करता है।

Channel capabilities में `inlineButtons` जोड़कर buttons enable करें:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` parameter के साथ `message action=send` का उपयोग करें। Buttons एक 2D array होते हैं (buttons की rows):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Button fields:

<ParamField path="text" type="string" required>
  Display label.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Click पर वापस भेजा गया value (action ID के रूप में उपयोग होता है)।
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Button style.
</ParamField>

जब कोई user button पर click करता है:

<Steps>
  <Step title="Buttons replaced with confirmation">
    सभी buttons को confirmation line से बदल दिया जाता है (उदा., "✓ **Yes** selected by @user")।
  </Step>
  <Step title="Agent receives the selection">
    एजेंट selection को inbound message के रूप में प्राप्त करता है और जवाब देता है।
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - Button callbacks HMAC-SHA256 verification का उपयोग करते हैं (automatic, कोई config आवश्यक नहीं)।
    - Mattermost अपने API responses से callback data हटा देता है (security feature), इसलिए click पर सभी buttons हटा दिए जाते हैं - partial removal संभव नहीं है।
    - Hyphens या underscores वाले Action IDs अपने-आप sanitize हो जाते हैं (Mattermost routing limitation)।

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: capability strings की array। Agent system prompt में buttons tool description enable करने के लिए `"inlineButtons"` जोड़ें।
    - `channels.mattermost.interactions.callbackBaseUrl`: button callbacks के लिए optional external base URL (उदाहरण के लिए `https://gateway.example.com`)। इसका उपयोग तब करें जब Mattermost gateway तक उसके bind host पर सीधे नहीं पहुंच सकता।
    - Multi-account setups में, आप वही field `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` के अंतर्गत भी set कर सकते हैं।
    - यदि `interactions.callbackBaseUrl` omit किया गया है, OpenClaw callback URL को `gateway.customBindHost` + `gateway.port` से derive करता है, फिर `http://localhost:<port>` पर fall back करता है।
    - Reachability rule: button callback URL Mattermost server से reachable होना चाहिए। `localhost` केवल तब काम करता है जब Mattermost और OpenClaw same host/network namespace पर run करते हैं।
    - यदि आपका callback target private/tailnet/internal है, तो उसके host/domain को Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` में जोड़ें।

  </Accordion>
</AccordionGroup>

### Direct API integration (external scripts)

External scripts और webhooks, एजेंट के `message` tool से गुजरने के बजाय Mattermost REST API के माध्यम से सीधे buttons post कर सकते हैं। जब संभव हो Plugin से `buildButtonAttachments()` का उपयोग करें; यदि raw JSON post कर रहे हैं, तो इन नियमों का पालन करें:

**Payload structure:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**महत्वपूर्ण नियम**

1. Attachments `props.attachments` में जाते हैं, top-level `attachments` में नहीं (silently ignored)।
2. हर action को `type: "button"` चाहिए - इसके बिना, clicks silently swallowed हो जाते हैं।
3. हर action को `id` field चाहिए - Mattermost IDs के बिना actions को ignore करता है।
4. Action `id` **केवल alphanumeric** (`[a-zA-Z0-9]`) होना चाहिए। Hyphens और underscores Mattermost की server-side action routing तोड़ देते हैं (404 return होता है)। उपयोग से पहले उन्हें strip करें।
5. `context.action_id` button के `id` से match होना चाहिए ताकि confirmation message raw ID के बजाय button name (उदा., "Approve") दिखाए।
6. `context.action_id` required है - इसके बिना interaction handler 400 return करता है।

</Warning>

**HMAC token generation**

Gateway button clicks को HMAC-SHA256 से verify करता है। External scripts को ऐसे tokens generate करने होंगे जो Gateway की verification logic से match करें:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    `_token` को छोड़कर सभी fields के साथ context object build करें।
  </Step>
  <Step title="Serialize with sorted keys">
    **Sorted keys** और **no spaces** के साथ serialize करें (Gateway sorted keys के साथ `JSON.stringify` का उपयोग करता है, जो compact output बनाता है)।
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    Resulting hex digest को context में `_token` के रूप में जोड़ें।
  </Step>
</Steps>

Python example:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Common HMAC pitfalls">
    - Python का `json.dumps` default रूप से spaces जोड़ता है (`{"key": "val"}`)। JavaScript के compact output (`{"key":"val"}`) से match करने के लिए `separators=(",", ":")` का उपयोग करें।
    - हमेशा **सभी** context fields (minus `_token`) sign करें। Gateway `_token` strip करता है, फिर बचे हुए सभी fields sign करता है। Subset sign करने से silent verification failure होता है।
    - `sort_keys=True` का उपयोग करें - Gateway signing से पहले keys sort करता है, और Mattermost payload store करते समय context fields reorder कर सकता है।
    - Secret को bot token (deterministic) से derive करें, random bytes से नहीं। Secret, buttons बनाने वाली process और verify करने वाले Gateway में समान होना चाहिए।

  </Accordion>
</AccordionGroup>

## Directory adapter

Mattermost Plugin में एक directory adapter शामिल है जो Mattermost API के माध्यम से channel और user names resolve करता है। इससे `openclaw message send` और cron/webhook deliveries में `#channel-name` और `@username` targets enable होते हैं।

कोई configuration आवश्यक नहीं है - adapter account config से bot token का उपयोग करता है।

## Multi-account

Mattermost `channels.mattermost.accounts` के अंतर्गत multiple accounts support करता है:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Troubleshooting

<AccordionGroup>
  <Accordion title="No replies in channels">
    सुनिश्चित करें कि bot channel में है और उसे mention करें (oncall), trigger prefix (onchar) का उपयोग करें, या `chatmode: "onmessage"` set करें।
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - Bot token, base URL, और account enabled है या नहीं, जांचें।
    - Multi-account issues: env vars केवल `default` account पर apply होते हैं।

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: OpenClaw ने callback token accept नहीं किया। Typical causes:
      - slash command registration failed या startup पर केवल partially completed हुआ
      - callback wrong Gateway/account पर hit कर रहा है
      - Mattermost में अभी भी old commands हैं जो previous callback target की ओर point कर रहे हैं
      - Gateway slash commands reactivate किए बिना restart हुआ
    - यदि native slash commands काम करना बंद कर दें, तो logs में `mattermost: failed to register slash commands` या `mattermost: native slash commands enabled but no commands could be registered` देखें।
    - यदि `callbackUrl` omit किया गया है और logs warning देते हैं कि callback `http://127.0.0.1:18789/...` पर resolved हुआ, तो वह URL शायद केवल तब reachable है जब Mattermost, OpenClaw के same host/network namespace पर run करता है। इसके बजाय explicit externally reachable `commands.callbackUrl` set करें।

  </Accordion>
  <Accordion title="Buttons issues">
    - Buttons white boxes के रूप में appear होते हैं: एजेंट malformed button data भेज रहा हो सकता है। जांचें कि प्रत्येक button में `text` और `callback_data` दोनों fields हैं।
    - Buttons render होते हैं लेकिन clicks कुछ नहीं करते: verify करें कि Mattermost server config में `AllowedUntrustedInternalConnections` में `127.0.0.1 localhost` शामिल है, और ServiceSettings में `EnablePostActionIntegration` `true` है।
    - Buttons click पर 404 return करते हैं: button `id` में संभवतः hyphens या underscores हैं। Mattermost का action router non-alphanumeric IDs पर break करता है। केवल `[a-zA-Z0-9]` का उपयोग करें।
    - Gateway logs `invalid _token`: HMAC mismatch। जांचें कि आप सभी context fields sign करते हैं (subset नहीं), sorted keys का उपयोग करते हैं, और compact JSON (no spaces) का उपयोग करते हैं। ऊपर HMAC section देखें।
    - Gateway logs `missing _token in context`: `_token` field button के context में नहीं है। Integration payload build करते समय सुनिश्चित करें कि यह शामिल है।
    - Confirmation button name के बजाय raw ID दिखाता है: `context.action_id` button के `id` से match नहीं करता। दोनों को same sanitized value पर set करें।
    - Agent को buttons के बारे में पता नहीं है: Mattermost channel config में `capabilities: ["inlineButtons"]` जोड़ें।

  </Accordion>
</AccordionGroup>

## Related

- [Channel Routing](/hi/channels/channel-routing) - messages के लिए session routing
- [Channels Overview](/hi/channels) - सभी supported channels
- [Groups](/hi/channels/groups) - group chat behavior और mention gating
- [Pairing](/hi/channels/pairing) - DM authentication और pairing flow
- [Security](/hi/gateway/security) - access model और hardening
