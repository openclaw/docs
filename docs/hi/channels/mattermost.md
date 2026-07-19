---
read_when:
    - Mattermost सेट अप करना
    - Mattermost रूटिंग की डीबगिंग
sidebarTitle: Mattermost
summary: Mattermost बॉट सेटअप और OpenClaw कॉन्फ़िगरेशन
title: Mattermost
x-i18n:
    generated_at: "2026-07-19T08:09:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ea41fb9a7e4e9ea6bd8d04a4f2c6d2d7f2e43cf71830e445f1e28e2e8737f3cb
    source_path: channels/mattermost.md
    workflow: 16
---

स्थिति: डाउनलोड करने योग्य Plugin (बॉट टोकन + WebSocket इवेंट)। चैनल, निजी चैनल, समूह DM और DM समर्थित हैं। Mattermost एक स्व-होस्ट करने योग्य टीम संदेश सेवा प्लेटफ़ॉर्म है ([mattermost.com](https://mattermost.com))।

## इंस्टॉल करें

<Tabs>
  <Tab title="npm रजिस्ट्री">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="स्थानीय चेकआउट">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

विवरण: [Plugins](/hi/tools/plugin)

## त्वरित सेटअप

<Steps>
  <Step title="सुनिश्चित करें कि Plugin उपलब्ध है">
    ऊपर दिए गए कमांड से `@openclaw/mattermost` इंस्टॉल करें, फिर यदि Gateway पहले से चल रहा है तो उसे पुनः प्रारंभ करें।
  </Step>
  <Step title="Mattermost बॉट बनाएँ">
    Mattermost बॉट खाता बनाएँ, **बॉट टोकन** कॉपी करें और बॉट को उन टीमों तथा चैनलों में जोड़ें जिन्हें उसे पढ़ना चाहिए।
  </Step>
  <Step title="बेस URL कॉपी करें">
    Mattermost का **बेस URL** कॉपी करें (उदाहरण के लिए, `https://chat.example.com`)। अंत में लगा `/api/v4` अपने-आप हटा दिया जाता है।
  </Step>
  <Step title="OpenClaw कॉन्फ़िगर करें और Gateway प्रारंभ करें">
    न्यूनतम कॉन्फ़िगरेशन:

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

    गैर-संवादात्मक विकल्प:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
निजी/LAN/tailnet पते पर स्व-होस्ट किया गया Mattermost: आउटबाउंड Mattermost API अनुरोध एक SSRF सुरक्षा जाँच से गुजरते हैं, जो डिफ़ॉल्ट रूप से निजी और आंतरिक IP को ब्लॉक करती है। `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` से अनुमति दें (प्रति खाता: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`)।
</Note>

## मूल स्लैश कमांड

मूल स्लैश कमांड वैकल्पिक हैं। सक्षम होने पर, OpenClaw हर उस टीम पर `oc_*` स्लैश कमांड पंजीकृत करता है जिसका बॉट सदस्य है और Gateway HTTP सर्वर पर कॉलबैक POST प्राप्त करता है।

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // जब Mattermost सीधे Gateway तक नहीं पहुँच सकता, तब उपयोग करें (रिवर्स प्रॉक्सी/सार्वजनिक URL)।
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

पंजीकृत कमांड: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`। `nativeSkills: true` के साथ, स्किल कमांड भी `/oc_<skill>` के रूप में पंजीकृत किए जाते हैं।

<AccordionGroup>
  <Accordion title="व्यवहार संबंधी टिप्पणियाँ">
    - `native` और `nativeSkills` डिफ़ॉल्ट रूप से `"auto"` होते हैं, जो Mattermost के लिए अक्षम के रूप में निर्धारित होता है। इन्हें स्पष्ट रूप से `true` पर सेट करें।
    - `callbackPath` डिफ़ॉल्ट रूप से `/api/channels/mattermost/command` होता है।
    - यदि `callbackUrl` को छोड़ दिया जाता है, तो OpenClaw `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>` व्युत्पन्न करता है। वाइल्डकार्ड बाइंड होस्ट (`0.0.0.0`, `::`) के लिए फ़ॉलबैक `localhost` होता है।
    - बहु-खाता सेटअप के लिए, `commands` को शीर्ष स्तर पर या `channels.mattermost.accounts.<id>.commands` के अंतर्गत सेट किया जा सकता है (खाता मान शीर्ष-स्तरीय फ़ील्ड को ओवरराइड करते हैं)।
    - अन्य एकीकरणों द्वारा बनाए गए समान ट्रिगर वाले मौजूदा स्लैश कमांड अपरिवर्तित रहते हैं (पंजीकरण उन्हें छोड़ देता है); बॉट द्वारा बनाए गए कमांड को कॉलबैक URL बदलने पर अपडेट किया जाता है या दोबारा बनाया जाता है।
    - कमांड कॉलबैक को उन प्रति-कमांड टोकन से सत्यापित किया जाता है जिन्हें Mattermost तब लौटाता है जब OpenClaw `oc_*` कमांड पंजीकृत करता है।
    - OpenClaw प्रत्येक कॉलबैक स्वीकार करने से पहले वर्तमान Mattermost कमांड पंजीकरण को रीफ़्रेश करता है, इसलिए हटाए गए या पुनः बनाए गए स्लैश कमांड के पुराने टोकन Gateway को पुनः प्रारंभ किए बिना स्वीकार होना बंद हो जाते हैं।
    - यदि Mattermost API यह पुष्टि नहीं कर पाता कि कमांड अब भी वर्तमान है, तो कॉलबैक सत्यापन सुरक्षित रूप से विफल होता है; विफल सत्यापन थोड़े समय के लिए कैश किए जाते हैं, समवर्ती लुकअप एकत्र किए जाते हैं और रीप्ले दबाव सीमित रखने के लिए नए लुकअप प्रारंभ प्रति कमांड दर-सीमित होते हैं।
    - जब पंजीकरण विफल हो गया हो, स्टार्टअप आंशिक रहा हो या कॉलबैक टोकन निर्धारित कमांड के पंजीकृत टोकन से मेल न खाता हो, तब स्लैश कॉलबैक सुरक्षित रूप से विफल होते हैं (एक कमांड के लिए मान्य टोकन किसी अलग कमांड के अपस्ट्रीम सत्यापन तक नहीं पहुँच सकता)।
    - स्वीकृत कॉलबैक की पुष्टि एक अस्थायी "प्रक्रिया जारी है..." उत्तर से की जाती है; वास्तविक उत्तर सामान्य संदेश के रूप में आता है।

  </Accordion>
  <Accordion title="पहुँच-योग्यता की आवश्यकता">
    कॉलबैक एंडपॉइंट Mattermost सर्वर से पहुँच योग्य होना चाहिए।

    - `callbackUrl` को `localhost` पर तब तक सेट न करें, जब तक Mattermost उसी होस्ट/नेटवर्क नेमस्पेस पर न चलता हो जिस पर OpenClaw चलता है।
    - `callbackUrl` को अपने Mattermost बेस URL पर तब तक सेट न करें, जब तक वह URL `/api/channels/mattermost/command` को OpenClaw पर रिवर्स-प्रॉक्सी न करता हो।
    - त्वरित जाँच के लिए `curl https://<gateway-host>/api/channels/mattermost/command` का उपयोग करें; GET को OpenClaw से `405 Method Not Allowed` लौटाना चाहिए, `404` नहीं।

  </Accordion>
  <Accordion title="Mattermost इग्रेस अनुमति-सूची">
    यदि आपका कॉलबैक निजी/tailnet/आंतरिक पतों को लक्षित करता है, तो कॉलबैक होस्ट/डोमेन शामिल करने के लिए Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` सेट करें।

    पूर्ण URL के बजाय होस्ट/डोमेन प्रविष्टियों का उपयोग करें।

    - सही: `gateway.tailnet-name.ts.net`
    - गलत: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## पर्यावरण चर (डिफ़ॉल्ट खाता)

यदि आप पर्यावरण चर पसंद करते हैं, तो इन्हें Gateway होस्ट पर सेट करें:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
पर्यावरण चर केवल **डिफ़ॉल्ट** खाते (`default`) पर लागू होते हैं। अन्य खातों को कॉन्फ़िगरेशन मानों का उपयोग करना होगा।

`MATTERMOST_URL` को वर्कस्पेस `.env` से सेट नहीं किया जा सकता; [वर्कस्पेस .env फ़ाइलें](/hi/gateway/security) देखें।
</Note>

## चैट मोड

Mattermost DM का उत्तर अपने-आप देता है। चैनल का व्यवहार `chatmode` द्वारा नियंत्रित होता है:

<Tabs>
  <Tab title="oncall (डिफ़ॉल्ट)">
    चैनलों में केवल @उल्लेख किए जाने पर उत्तर दें।
  </Tab>
  <Tab title="onmessage">
    प्रत्येक चैनल संदेश का उत्तर दें।
  </Tab>
  <Tab title="onchar">
    जब कोई संदेश ट्रिगर उपसर्ग से शुरू हो, तब उत्तर दें।
  </Tab>
</Tabs>

कॉन्फ़िगरेशन उदाहरण:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // डिफ़ॉल्ट
    },
  },
}
```

टिप्पणियाँ:

- `onchar` अब भी स्पष्ट @उल्लेखों का उत्तर देता है।
- `channels.mattermost.requireMention` का अब भी पालन किया जाता है, लेकिन `chatmode` को प्राथमिकता दी जाती है। प्रति-चैनल `groups.<channelId>.requireMention` सेटिंग दोनों पर वरीयता रखती हैं।
- बॉट द्वारा किसी चैनल थ्रेड में दृश्यमान उत्तर भेजने के बाद, उसी थ्रेड के बाद के संदेशों का उत्तर नए @उल्लेख या `onchar` उपसर्ग के बिना दिया जाता है, जिससे बहु-चरणीय थ्रेड वार्तालाप जारी रहते हैं। बॉट द्वारा उस थ्रेड में अंतिम उत्तर दिए जाने के बाद भागीदारी 7 दिनों तक याद रखी जाती है और Gateway पुनः प्रारंभ होने के बाद भी बनी रहती है। जिन थ्रेड को बॉट ने केवल देखा है, वे अप्रभावित रहते हैं; फिर से स्पष्ट उल्लेख आवश्यक बनाने के लिए नया शीर्ष-स्तरीय संदेश प्रारंभ करें।
- भागीदारी वाले थ्रेड के अनुवर्ती संदेशों को उल्लेख गेटिंग से बचने से रोकने के लिए `channels.mattermost.implicitMentions.threadParticipation: false` सेट करें। खाता ओवरराइड `channels.mattermost.accounts.<id>.implicitMentions` का उपयोग करते हैं। Mattermost वर्तमान में `replyToBot` या `quotedBot` तथ्य उत्पन्न नहीं करता, इसलिए उन फ़्लैग का यहाँ कोई प्रभाव नहीं पड़ता।

## थ्रेडिंग और सत्र

चैनल और समूह के उत्तर मुख्य चैनल में रहें या ट्रिगर करने वाली पोस्ट के अंतर्गत थ्रेड शुरू करें, इसे नियंत्रित करने के लिए `channels.mattermost.replyToMode` का उपयोग करें।

- `off` (डिफ़ॉल्ट): थ्रेड में उत्तर केवल तभी दें जब आने वाली पोस्ट पहले से किसी थ्रेड में हो।
- `first`: शीर्ष-स्तरीय चैनल/समूह पोस्ट के लिए, उस पोस्ट के अंतर्गत थ्रेड प्रारंभ करें और वार्तालाप को थ्रेड-स्कोप वाले सत्र पर रूट करें।
- `all` और `batched`: आज Mattermost के लिए `first` जैसा ही व्यवहार, क्योंकि Mattermost में थ्रेड रूट बनने के बाद अनुवर्ती खंड और मीडिया उसी थ्रेड में जारी रहते हैं।
- `replyToMode` सेट होने पर भी सीधे संदेश डिफ़ॉल्ट रूप से `off` का उपयोग करते हैं।

`direct`, `group` या `channel` चैट के लिए मोड ओवरराइड करने हेतु `channels.mattermost.replyToModeByChatType` का उपयोग करें। सीधे संदेशों में थ्रेडिंग स्वीकार करने के लिए `direct` सेट करें:

- `off` (डिफ़ॉल्ट): सीधे संदेश एक ही निरंतर सत्र में बिना थ्रेड के रहते हैं।
- `first`, `all` या `batched`: प्रत्येक शीर्ष-स्तरीय सीधा संदेश एक नए, स्वतंत्र सत्र द्वारा समर्थित Mattermost थ्रेड प्रारंभ करता है।

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

टिप्पणियाँ:

- थ्रेड-स्कोप वाले सत्र ट्रिगर करने वाली पोस्ट ID को थ्रेड रूट के रूप में उपयोग करते हैं।
- `first` और `all` वर्तमान में समतुल्य हैं, क्योंकि Mattermost में थ्रेड रूट बनने के बाद अनुवर्ती खंड और मीडिया उसी थ्रेड में जारी रहते हैं।
- प्रति-चैट-प्रकार ओवरराइड `replyToMode` पर वरीयता रखते हैं। `direct` ओवरराइड के बिना, मौजूदा परिनियोजनों में DM सपाट और बिना थ्रेड के बने रहते हैं।

## अभिगम नियंत्रण (DM)

- डिफ़ॉल्ट: `channels.mattermost.dmPolicy = "pairing"` (अज्ञात प्रेषकों को पेयरिंग कोड मिलता है)। अन्य मान: `allowlist`, `open`, `disabled`।
- इसके माध्यम से स्वीकृति दें:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- सार्वजनिक DM: `channels.mattermost.dmPolicy="open"` के साथ `channels.mattermost.allowFrom=["*"]` (कॉन्फ़िगरेशन स्कीमा वाइल्डकार्ड अनिवार्य करता है)।
- `channels.mattermost.allowFrom` उपयोगकर्ता ID (अनुशंसित) और `accessGroup:<name>` प्रविष्टियाँ स्वीकार करता है। [अभिगम समूह](/hi/channels/access-groups) देखें।

## चैनल (समूह)

- डिफ़ॉल्ट: `channels.mattermost.groupPolicy = "allowlist"` (उल्लेख द्वारा नियंत्रित)।
- `channels.mattermost.groupAllowFrom` से प्रेषकों को अनुमति-सूची में जोड़ें (उपयोगकर्ता ID अनुशंसित)।
- `channels.mattermost.groupAllowFrom`, `accessGroup:<name>` प्रविष्टियाँ स्वीकार करता है। [अभिगम समूह](/hi/channels/access-groups) देखें।
- प्रति-चैनल उल्लेख ओवरराइड `channels.mattermost.groups.<channelId>.requireMention` के अंतर्गत होते हैं या डिफ़ॉल्ट के लिए `channels.mattermost.groups["*"].requireMention` के अंतर्गत।
- `@username` मिलान परिवर्तनशील है और केवल `channels.mattermost.dangerouslyAllowNameMatching: true` होने पर सक्षम होता है।
- खुले चैनल: `channels.mattermost.groupPolicy="open"` (उल्लेख द्वारा नियंत्रित)।
- निर्धारण क्रम: `channels.mattermost.groupPolicy`, फिर `channels.defaults.groupPolicy`, फिर `"allowlist"`।
- रनटाइम टिप्पणी: यदि `channels.mattermost` अनुभाग पूरी तरह अनुपस्थित है, तो रनटाइम समूह जाँच के लिए सुरक्षित रूप से `groupPolicy="allowlist"` पर विफल होता है (`channels.defaults.groupPolicy` सेट होने पर भी) और एक बार की चेतावनी लॉग करता है।

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

## आउटबाउंड डिलीवरी के लक्ष्य

`openclaw message send` या cron/webhooks के साथ इन लक्ष्य प्रारूपों का उपयोग करें:

| लक्ष्य                              | यहाँ डिलीवर करता है                                                   |
| ----------------------------------- | ------------------------------------------------------------- |
| `channel:<id>`                      | ID द्वारा चैनल                                                 |
| `channel:<name>` या `#channel-name` | नाम द्वारा चैनल, बॉट की सदस्यता वाली सभी टीमों में खोजा जाता है |
| `user:<id>` या `mattermost:<id>`    | उस उपयोगकर्ता के साथ DM                                             |
| `@username`                         | DM (उपयोगकर्ता नाम Mattermost API के माध्यम से निर्धारित किया जाता है)                 |

आउटबाउंड प्रेषण प्रति संदेश अधिकतम एक अनुलग्नक का समर्थन करते हैं; एकाधिक फ़ाइलों को अलग-अलग प्रेषणों में विभाजित करें।

<Warning>
असंदर्भित अपारदर्शी ID (जैसे `64ifufp...`) Mattermost में **अस्पष्ट** हैं (उपयोगकर्ता ID बनाम चैनल ID)।

OpenClaw उन्हें **पहले उपयोगकर्ता** के रूप में निर्धारित करता है:

- यदि ID एक उपयोगकर्ता के रूप में मौजूद है (`GET /api/v4/users/<id>` सफल होता है), तो OpenClaw `/api/v4/channels/direct` के माध्यम से सीधे चैनल का समाधान करके एक **DM** भेजता है।
- अन्यथा ID को **चैनल ID** माना जाता है।

यदि आपको नियतात्मक व्यवहार चाहिए, तो हमेशा स्पष्ट उपसर्गों (`user:<id>` / `channel:<id>`) का उपयोग करें।
</Warning>

## DM चैनल पुनः प्रयास

जब OpenClaw किसी Mattermost DM लक्ष्य को भेजता है और पहले सीधे चैनल का समाधान करना आवश्यक होता है, तो वह डिफ़ॉल्ट रूप से सीधे चैनल के निर्माण की अस्थायी विफलताओं पर पुनः प्रयास करता है।

Mattermost plugin के लिए इस व्यवहार को वैश्विक रूप से समायोजित करने हेतु `channels.mattermost.dmChannelRetry` या किसी एक खाते के लिए `channels.mattermost.accounts.<id>.dmChannelRetry` का उपयोग करें। डिफ़ॉल्ट:

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

टिप्पणियाँ:

- यह केवल DM चैनल निर्माण (`/api/v4/channels/direct`) पर लागू होता है, प्रत्येक Mattermost API कॉल पर नहीं।
- पुनः प्रयास जिटर के साथ एक्सपोनेंशियल बैकऑफ़ का उपयोग करते हैं और दर सीमाओं, 5xx प्रतिक्रियाओं तथा नेटवर्क या टाइमआउट त्रुटियों जैसी अस्थायी विफलताओं पर लागू होते हैं।
- `429` के अतिरिक्त अन्य 4xx क्लाइंट त्रुटियों को स्थायी माना जाता है और उन पर पुनः प्रयास नहीं किया जाता।

## पूर्वावलोकन स्ट्रीमिंग

Mattermost विचार-प्रक्रिया, टूल गतिविधि और उत्तर के आंशिक टेक्स्ट को एक **ड्राफ़्ट पूर्वावलोकन पोस्ट** में स्ट्रीम करता है, जिसे अंतिम उत्तर भेजना सुरक्षित होने पर उसी स्थान पर अंतिम रूप दिया जाता है। `partial` मोड में पूर्वावलोकन प्रत्येक खंड के लिए अलग संदेशों से चैनल को भरने के बजाय उसी पोस्ट ID पर अपडेट होता है। `block` मोड में पूर्वावलोकन पूर्ण टेक्स्ट और टूल-गतिविधि ब्लॉक के बीच बदलता रहता है, इसलिए पिछले ब्लॉक अगले ब्लॉक द्वारा अधिलेखित होने के बजाय अलग पोस्ट के रूप में दिखाई देते रहते हैं। मीडिया/त्रुटि वाले अंतिम परिणाम लंबित पूर्वावलोकन संपादनों को रद्द करते हैं और अनुपयोगी पूर्वावलोकन पोस्ट को अंतिम रूप देने के बजाय सामान्य डिलीवरी का उपयोग करते हैं।

पूर्वावलोकन स्ट्रीमिंग `partial` मोड में **डिफ़ॉल्ट रूप से चालू** है। `channels.mattermost.streaming.mode` के माध्यम से कॉन्फ़िगर करें (पुराने स्केलर/बूलियन `streaming` मानों को `openclaw doctor --fix` द्वारा माइग्रेट किया जाता है):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // बंद | आंशिक | ब्लॉक | प्रगति
    },
  },
}
```

<AccordionGroup>
  <Accordion title="स्ट्रीमिंग मोड">
    - `partial` (डिफ़ॉल्ट): एक पूर्वावलोकन पोस्ट, जिसे उत्तर बढ़ने के साथ संपादित किया जाता है और फिर संपूर्ण उत्तर के साथ अंतिम रूप दिया जाता है।
    - `block` पूर्वावलोकन को पूर्ण टेक्स्ट और टूल-गतिविधि ब्लॉक के बीच बदलता है, इसलिए प्रत्येक ब्लॉक उसी स्थान पर अधिलेखित होने के बजाय अलग पोस्ट के रूप में दिखाई देता रहता है। समानांतर और लगातार टूल अपडेट वर्तमान टूल-गतिविधि पोस्ट साझा करते हैं।
    - `progress` जनरेट करते समय एक स्थिति पूर्वावलोकन दिखाता है और पूरा होने पर ही अंतिम उत्तर पोस्ट करता है।
    - `off` पूर्वावलोकन स्ट्रीमिंग को अक्षम करता है। `streaming.block.enabled: true` के साथ, पूर्ण सहायक ब्लॉक अब भी एकल समेकित अंतिम पोस्ट के बजाय सामान्य ब्लॉक उत्तरों (अलग पोस्ट) के रूप में डिलीवर किए जाते हैं।

  </Accordion>
  <Accordion title="स्ट्रीमिंग व्यवहार संबंधी टिप्पणियाँ">
    - यदि स्ट्रीम को उसी स्थान पर अंतिम रूप नहीं दिया जा सकता (उदाहरण के लिए, स्ट्रीम के दौरान पोस्ट हटा दिया गया), तो OpenClaw नया अंतिम पोस्ट भेजता है, ताकि उत्तर कभी न खोए।
    - केवल विचार-प्रक्रिया वाले पेलोड चैनल पोस्ट से हटा दिए जाते हैं, जिसमें `> Thinking` ब्लॉककोट के रूप में आने वाला टेक्स्ट भी शामिल है। अन्य सतहों पर विचार-प्रक्रिया देखने के लिए `/reasoning on` सेट करें; Mattermost की अंतिम पोस्ट में केवल उत्तर रहता है।
    - चैनल-मैपिंग मैट्रिक्स के लिए [स्ट्रीमिंग](/hi/concepts/streaming#preview-streaming-modes) देखें।

  </Accordion>
</AccordionGroup>

## प्रतिक्रियाएँ (संदेश टूल)

- `channel=mattermost` के साथ `message action=react` का उपयोग करें।
- `messageId` Mattermost पोस्ट ID है।
- `emoji`, `thumbsup` या `:+1:` जैसे नाम स्वीकार करता है (कोलन वैकल्पिक हैं)।
- प्रतिक्रिया हटाने के लिए `remove=true` (बूलियन) सेट करें।
- प्रतिक्रिया जोड़ने/हटाने की घटनाएँ संदेशों के समान DM/समूह नीति जाँचों के अधीन, रूट किए गए एजेंट सत्र को सिस्टम घटनाओं के रूप में अग्रेषित की जाती हैं।

उदाहरण:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

कॉन्फ़िगरेशन:

- `channels.mattermost.actions.reactions`: प्रतिक्रिया क्रियाएँ सक्षम/अक्षम करें (डिफ़ॉल्ट true)।
- प्रति-खाता ओवरराइड: `channels.mattermost.accounts.<id>.actions.reactions`।

## इंटरैक्टिव बटन (संदेश टूल)

क्लिक किए जा सकने वाले बटनों के साथ संदेश भेजें। जब कोई उपयोगकर्ता बटन पर क्लिक करता है, तो एजेंट को चयन प्राप्त होता है और वह उत्तर दे सकता है।

बटन सिमेंटिक `presentation` पेलोड से आते हैं (सामान्य एजेंट उत्तरों और `message action=send` में)। OpenClaw मान वाले बटनों को Mattermost इंटरैक्टिव बटन के रूप में रेंडर करता है, URL बटनों को संदेश टेक्स्ट में दिखाई देता रहने देता है और चयन मेनू को पठनीय टेक्स्ट में बदल देता है।

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

प्रस्तुति बटन फ़ील्ड:

<ParamField path="label" type="string" required>
  प्रदर्शन लेबल (उपनाम: `text`)।
</ParamField>
<ParamField path="value" type="string">
  क्लिक करने पर वापस भेजा गया मान, जिसका उपयोग क्रिया ID के रूप में होता है (उपनाम: `callback_data`, `callbackData`)। क्लिक किए जा सकने वाले बटन के लिए आवश्यक, जब तक `url` सेट न हो।
</ParamField>
<ParamField path="url" type="string">
  लिंक बटन; इंटरैक्टिव बटन के बजाय संदेश के मुख्य भाग में `label: url` टेक्स्ट के रूप में रेंडर किया जाता है।
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  बटन शैली। Mattermost असमर्थित मानों पर डिफ़ॉल्ट शैली लागू करता है।
</ParamField>

एजेंट सिस्टम प्रॉम्प्ट में बटन समर्थन घोषित करने के लिए, चैनल क्षमताओं में `inlineButtons` जोड़ें:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

जब कोई उपयोगकर्ता बटन पर क्लिक करता है:

<Steps>
  <Step title="पहुँच जाँच">
    क्लिक करने वाले को संदेश प्रेषक के समान DM/समूह नीति जाँचों में सफल होना आवश्यक है; अनधिकृत क्लिक को एक क्षणिक सूचना मिलती है और उसे अनदेखा कर दिया जाता है।
  </Step>
  <Step title="बटनों को पुष्टि से बदला जाता है">
    सभी बटनों को एक पुष्टि पंक्ति से बदल दिया जाता है (जैसे, "✓ **Yes** को @user ने चुना")।
  </Step>
  <Step title="एजेंट को चयन प्राप्त होता है">
    एजेंट को चयन एक इनबाउंड संदेश (साथ ही एक सिस्टम घटना) के रूप में प्राप्त होता है और वह उत्तर देता है।
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="कार्यान्वयन संबंधी टिप्पणियाँ">
    - बटन कॉलबैक HMAC-SHA256 सत्यापन का उपयोग करते हैं (स्वचालित, किसी कॉन्फ़िगरेशन की आवश्यकता नहीं)।
    - क्लिक करने पर संपूर्ण अटैचमेंट ब्लॉक बदल दिया जाता है, इसलिए सभी बटन एक साथ हटा दिए जाते हैं - आंशिक रूप से हटाना संभव नहीं है।
    - हाइफ़न या अंडरस्कोर वाली क्रिया ID स्वचालित रूप से सैनिटाइज़ की जाती हैं (Mattermost रूटिंग सीमा)।
    - जिन क्लिक की `action_id` मूल पोस्ट की किसी क्रिया से मेल नहीं खाती, उन्हें `403` ("अज्ञात क्रिया") के साथ अस्वीकार कर दिया जाता है।

  </Accordion>
  <Accordion title="कॉन्फ़िगरेशन और पहुँच-योग्यता">
    - `channels.mattermost.capabilities`: क्षमता स्ट्रिंगों की सरणी। एजेंट सिस्टम प्रॉम्प्ट में बटन टूल का विवरण सक्षम करने के लिए `"inlineButtons"` जोड़ें।
    - `channels.mattermost.interactions.callbackBaseUrl`: बटन कॉलबैक के लिए वैकल्पिक बाहरी आधार URL (उदाहरण के लिए `https://gateway.example.com`)। इसका उपयोग तब करें जब Mattermost सीधे Gateway के बाइंड होस्ट तक नहीं पहुँच सकता।
    - बहु-खाता सेटअप में, यही फ़ील्ड `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` के अंतर्गत भी सेट किया जा सकता है।
    - यदि `interactions.callbackBaseUrl` छोड़ा जाता है, तो OpenClaw `gateway.customBindHost` + `gateway.port` (डिफ़ॉल्ट 18789) से कॉलबैक URL निकालता है, फिर `http://localhost:<port>` का उपयोग करता है। कॉलबैक पथ `/mattermost/interactions/<accountId>` है।
    - पहुँच-योग्यता नियम: बटन कॉलबैक URL Mattermost सर्वर से पहुँच योग्य होना चाहिए। `localhost` केवल तभी काम करता है, जब Mattermost और OpenClaw एक ही होस्ट/नेटवर्क नेमस्पेस पर चलते हैं।
    - `channels.mattermost.interactions.allowedSourceIps`: बटन कॉलबैक के लिए स्रोत-IP अनुमति-सूची। इसके बिना केवल लूपबैक स्रोत (`127.0.0.1`, `::1`) स्वीकार किए जाते हैं, इसलिए दूरस्थ Mattermost सर्वर को यहाँ अनुमति-सूची में जोड़ना आवश्यक है, अन्यथा उसके क्लिक `403` के साथ अस्वीकार कर दिए जाते हैं। रिवर्स प्रॉक्सी के पीछे, `gateway.trustedProxies` भी सेट करें, ताकि वास्तविक क्लाइंट IP अग्रेषित हेडर से निकाला जा सके।
    - यदि आपका कॉलबैक लक्ष्य निजी/टेलनेट/आंतरिक है, तो उसके होस्ट/डोमेन को Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` में जोड़ें।

  </Accordion>
</AccordionGroup>

### प्रत्यक्ष API एकीकरण (बाहरी स्क्रिप्ट)

बाहरी स्क्रिप्ट और Webhook एजेंट के `message` टूल के माध्यम से जाने के बजाय Mattermost REST API के जरिए सीधे बटन पोस्ट कर सकते हैं। OpenClaw के `message` टूल को प्राथमिकता दें। प्रत्यक्ष एकीकरणों के लिए `@openclaw/mattermost/api.js` से `buildButtonAttachments` आयात करें; यदि रॉ JSON पोस्ट कर रहे हैं, तो इन नियमों का पालन करें:

**पेलोड संरचना:**

```json5
{
  channel_id: "<channelId>",
  message: "कोई विकल्प चुनें:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // केवल अक्षरांकीय - नीचे देखें
            type: "button", // आवश्यक, अन्यथा क्लिक चुपचाप अनदेखे कर दिए जाते हैं
            name: "स्वीकृत करें", // प्रदर्शन लेबल
            style: "primary", // वैकल्पिक: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // बटन ID से मेल खाना आवश्यक है
                action: "approve",
                // ... कोई भी कस्टम फ़ील्ड ...
                _token: "<hmac>", // नीचे HMAC अनुभाग देखें
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

1. अटैचमेंट शीर्ष-स्तरीय `attachments` में नहीं, बल्कि `props.attachments` में जाते हैं (चुपचाप अनदेखे कर दिए जाते हैं)।
2. प्रत्येक क्रिया को `type: "button"` की आवश्यकता होती है - इसके बिना क्लिक चुपचाप निगल लिए जाते हैं।
3. प्रत्येक क्रिया को एक `id` फ़ील्ड की आवश्यकता होती है - Mattermost बिना ID वाली क्रियाओं को अनदेखा करता है।
4. क्रिया `id` **केवल अक्षरांकीय** होनी चाहिए (`[a-zA-Z0-9]`)। हाइफ़न और अंडरस्कोर Mattermost की सर्वर-साइड क्रिया रूटिंग को बाधित करते हैं (404 लौटता है)। उपयोग से पहले उन्हें हटा दें।
5. `context.action_id` को बटन की `id` से मेल खाना आवश्यक है; Gateway उन क्लिक को अस्वीकार करता है जिनकी `action_id` पोस्ट पर मौजूद नहीं होती।
6. `context.action_id` आवश्यक है - इसके बिना इंटरैक्शन हैंडलर 400 लौटाता है।
7. कॉलबैक स्रोत IP अनुमत होना चाहिए (ऊपर `interactions.allowedSourceIps` देखें)।

</Warning>

**HMAC टोकन जनरेशन**

Gateway HMAC-SHA256 के साथ बटन क्लिक सत्यापित करता है। बाहरी स्क्रिप्ट को ऐसे टोकन जनरेट करने चाहिए, जो Gateway के सत्यापन तर्क से मेल खाते हों:

<Steps>
  <Step title="बॉट टोकन से सीक्रेट प्राप्त करें">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, हेक्स-एन्कोडेड।
  </Step>
  <Step title="कॉन्टेक्स्ट ऑब्जेक्ट बनाएँ">
    `_token` को **छोड़कर** अन्य सभी फ़ील्ड के साथ कॉन्टेक्स्ट ऑब्जेक्ट बनाएँ।
  </Step>
  <Step title="क्रमबद्ध कुंजियों के साथ क्रमबद्ध करें">
    **पुनरावर्ती रूप से क्रमबद्ध कुंजियों** और **बिना स्पेस** के क्रमबद्ध करें (Gateway नेस्टेड ऑब्जेक्ट को भी कैनोनिकलाइज़ करता है और संक्षिप्त JSON बनाता है)।
  </Step>
  <Step title="पेलोड पर हस्ताक्षर करें">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="टोकन जोड़ें">
    परिणामी हेक्स डाइजेस्ट को कॉन्टेक्स्ट में `_token` के रूप में जोड़ें।
  </Step>
</Steps>

Python उदाहरण:

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
  <Accordion title="HMAC की सामान्य समस्याएँ">
    - Python का `json.dumps` डिफ़ॉल्ट रूप से रिक्त स्थान जोड़ता है (`{"key": "val"}`)। JavaScript के संक्षिप्त आउटपुट (`{"key":"val"}`) से मिलान करने के लिए `separators=(",", ":")` का उपयोग करें।
    - हमेशा संदर्भ के **सभी** फ़ील्ड पर हस्ताक्षर करें (`_token` को छोड़कर)। Gateway `_token` को हटाता है, फिर शेष सभी चीज़ों पर हस्ताक्षर करता है। केवल कुछ फ़ील्ड पर हस्ताक्षर करने से सत्यापन बिना किसी सूचना के विफल हो जाता है।
    - `sort_keys=True` का उपयोग करें - Gateway हस्ताक्षर करने से पहले कुंजियों को क्रमबद्ध करता है, और पेलोड संग्रहीत करते समय Mattermost संदर्भ फ़ील्ड का क्रम बदल सकता है।
    - गोपनीय कुंजी को यादृच्छिक बाइट्स से नहीं, बल्कि बॉट टोकन से व्युत्पन्न करें (नियतात्मक रूप से)। बटन बनाने वाली प्रक्रिया और सत्यापन करने वाले Gateway—दोनों में गोपनीय कुंजी समान होनी चाहिए।

  </Accordion>
</AccordionGroup>

## डायरेक्टरी अडैप्टर

Mattermost Plugin में एक डायरेक्टरी अडैप्टर शामिल है, जो Mattermost API के माध्यम से चैनल और उपयोगकर्ता नामों का समाधान करता है। यह `openclaw message send` और cron/webhook डिलीवरी में `#channel-name` और `@username` लक्ष्यों को सक्षम करता है।

किसी कॉन्फ़िगरेशन की आवश्यकता नहीं है - अडैप्टर अकाउंट कॉन्फ़िगरेशन से बॉट टोकन का उपयोग करता है।

## एकाधिक अकाउंट

Mattermost `channels.mattermost.accounts` के अंतर्गत एकाधिक अकाउंट का समर्थन करता है:

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

अकाउंट मान शीर्ष-स्तरीय फ़ील्ड को ओवरराइड करते हैं; जब कोई अकाउंट निर्दिष्ट न हो, तो `channels.mattermost.defaultAccount` यह चुनता है कि किस अकाउंट का उपयोग किया जाए।

## समस्या निवारण

<AccordionGroup>
  <Accordion title="चैनलों में कोई उत्तर नहीं">
    सुनिश्चित करें कि बॉट चैनल में है और उसका उल्लेख करें (oncall), ट्रिगर प्रीफ़िक्स का उपयोग करें (onchar), या `chatmode: "onmessage"` सेट करें।
  </Accordion>
  <Accordion title="प्रमाणीकरण या एकाधिक अकाउंट संबंधी त्रुटियाँ">
    - बॉट टोकन, बेस URL और अकाउंट सक्षम है या नहीं, इसकी जाँच करें।
    - एकाधिक अकाउंट संबंधी समस्याएँ: पर्यावरण चर केवल `default` अकाउंट पर लागू होते हैं।
    - निजी/LAN Mattermost होस्ट को `network.dangerouslyAllowPrivateNetwork: true` की आवश्यकता होती है (SSRF सुरक्षा डिफ़ॉल्ट रूप से निजी IP को अवरुद्ध करती है)।

  </Accordion>
  <Accordion title="नेटिव स्लैश कमांड विफल होते हैं">
    - `Unauthorized: invalid command token.`: OpenClaw ने कॉलबैक टोकन स्वीकार नहीं किया। सामान्य कारण:
      - स्लैश कमांड का पंजीकरण विफल हुआ या स्टार्टअप पर केवल आंशिक रूप से पूरा हुआ
      - कॉलबैक गलत Gateway/अकाउंट तक पहुँच रहा है
      - Mattermost में अभी भी पुराने कमांड हैं, जो पिछले कॉलबैक लक्ष्य की ओर संकेत कर रहे हैं
      - Gateway स्लैश कमांड को फिर से सक्रिय किए बिना पुनः आरंभ हुआ
    - यदि नेटिव स्लैश कमांड काम करना बंद कर दें, तो लॉग में `mattermost: failed to register slash commands` या `mattermost: native slash commands enabled but no commands could be registered` की जाँच करें।
    - यदि `callbackUrl` छोड़ा गया है और लॉग चेतावनी देते हैं कि कॉलबैक का समाधान `http://localhost:18789/...` जैसे लूपबैक URL पर हुआ है, तो संभवतः वह URL केवल तभी पहुँच योग्य है जब Mattermost, OpenClaw के समान होस्ट/नेटवर्क नेमस्पेस में चलता हो। इसके बजाय स्पष्ट रूप से बाहरी रूप से पहुँच योग्य `commands.callbackUrl` सेट करें।

  </Accordion>
  <Accordion title="बटन संबंधी समस्याएँ">
    - बटन सफ़ेद बॉक्स के रूप में दिखाई देते हैं या बिल्कुल दिखाई नहीं देते: बटन डेटा विकृत है। प्रत्येक प्रस्तुति बटन में एक `label` और एक `value` होना आवश्यक है (इनमें से कोई भी न होने पर बटन हटा दिए जाते हैं)।
    - बटन रेंडर होते हैं, लेकिन क्लिक करने पर कुछ नहीं होता: सत्यापित करें कि Gateway, Mattermost सर्वर से पहुँच योग्य है, Mattermost सर्वर का IP `channels.mattermost.interactions.allowedSourceIps` में शामिल है (इसके बिना केवल लूपबैक स्वीकार किया जाता है), और निजी लक्ष्यों के लिए `ServiceSettings.AllowedUntrustedInternalConnections` में कॉलबैक होस्ट शामिल है।
    - क्लिक करने पर बटन 404 लौटाते हैं: बटन के `id` में संभवतः हाइफ़न या अंडरस्कोर हैं। Mattermost का एक्शन राउटर गैर-अल्फ़ान्यूमेरिक ID पर काम नहीं करता। केवल `[a-zA-Z0-9]` का उपयोग करें।
    - Gateway लॉग में `rejected callback source`: क्लिक `interactions.allowedSourceIps` से बाहर के IP से आया। Mattermost सर्वर या अपने इनग्रेस को अनुमति-सूची में जोड़ें, और रिवर्स प्रॉक्सी के पीछे `gateway.trustedProxies` सेट करें।
    - Gateway लॉग में `invalid _token`: HMAC मेल नहीं खाता। जाँच करें कि आप संदर्भ के सभी फ़ील्ड पर हस्ताक्षर करते हैं (केवल कुछ पर नहीं), क्रमबद्ध कुंजियों का उपयोग करते हैं, और संक्षिप्त JSON (रिक्त स्थान के बिना) का उपयोग करते हैं। ऊपर दिया गया HMAC अनुभाग देखें।
    - Gateway लॉग में `missing _token in context`: `_token` फ़ील्ड बटन के संदर्भ में नहीं है। एकीकरण पेलोड बनाते समय सुनिश्चित करें कि इसे शामिल किया गया हो।
    - Gateway `Unknown action` के साथ क्लिक अस्वीकार करता है: `context.action_id`, पोस्ट पर मौजूद किसी भी एक्शन `id` से मेल नहीं खाता। दोनों को समान स्वच्छीकृत मान पर सेट करें।
    - एजेंट बटन प्रस्तुत नहीं करता: Mattermost चैनल कॉन्फ़िगरेशन में `capabilities: ["inlineButtons"]` जोड़ें।

  </Accordion>
</AccordionGroup>

## संबंधित

- [चैनल रूटिंग](/hi/channels/channel-routing) - संदेशों के लिए सत्र रूटिंग
- [चैनलों का अवलोकन](/hi/channels) - सभी समर्थित चैनल
- [समूह](/hi/channels/groups) - समूह चैट का व्यवहार और उल्लेख नियंत्रण
- [पेयरिंग](/hi/channels/pairing) - DM प्रमाणीकरण और पेयरिंग प्रवाह
- [सुरक्षा](/hi/gateway/security) - पहुँच मॉडल और सुदृढ़ीकरण
