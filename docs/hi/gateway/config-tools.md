---
read_when:
    - '`tools.*` नीति, अनुमति-सूचियाँ या प्रायोगिक सुविधाएँ कॉन्फ़िगर करना'
    - कस्टम प्रदाताओं को पंजीकृत करना या बेस URL को ओवरराइड करना
    - OpenAI-संगत स्वयं-होस्टेड एंडपॉइंट सेट अप करना
sidebarTitle: Tools and custom providers
summary: टूल कॉन्फ़िगरेशन (नीति, प्रयोगात्मक टॉगल, प्रदाता-समर्थित टूल) और कस्टम प्रदाता/बेस-URL सेटअप
title: कॉन्फ़िगरेशन — टूल और कस्टम प्रदाता
x-i18n:
    generated_at: "2026-07-20T08:06:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 690d3c0bf9a1a542c6989c74f0bc15c7e52798892436aa8bd710d22b00fcf015
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` कॉन्फ़िगरेशन कुंजियाँ और कस्टम प्रदाता / आधार-URL सेटअप। एजेंट, चैनल और अन्य शीर्ष-स्तरीय कॉन्फ़िगरेशन कुंजियों के लिए, [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) देखें।

## टूल

### टूल प्रोफ़ाइल

`tools.profile`, `tools.allow`/`tools.deny` से पहले एक आधार अनुमति-सूची सेट करता है:

<Note>
सेट न होने पर स्थानीय ऑनबोर्डिंग नए स्थानीय कॉन्फ़िगरेशन को डिफ़ॉल्ट रूप से `tools.profile: "coding"` पर सेट करती है (मौजूदा स्पष्ट प्रोफ़ाइल संरक्षित रहती हैं)।
</Note>

| प्रोफ़ाइल     | शामिल टूल                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | केवल `session_status`                                                                                                                                                                                                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate`                |
| `messaging` | `group:messaging`, `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `ask_user` |
| `full`      | कोई प्रतिबंध नहीं (सेट न होने के समान)                                                                                                                                                                                                                          |

`coding` और `messaging`, `bundle-mcp` (कॉन्फ़िगर किए गए MCP सर्वर) को भी अंतर्निहित रूप से अनुमति देते हैं।

### टूल समूह

| समूह              | टूल                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` को `exec` के उपनाम के रूप में स्वीकार किया जाता है)                                                                                                                                                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                                                 |
| `group:sessions`   | `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                                                  |
| `group:ui`         | `browser`, `screen`, `terminal`, `canvas`, `show_widget`                                                                                                                                                                                               |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                                                                                                                              |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                                                    |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`                                                                                                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                                                   |
| `group:openclaw`   | `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` को छोड़कर ऊपर दिए गए सभी अंतर्निहित टूल (Plugin टूल को शामिल नहीं करता)                                                                                                                                  |
| `group:plugins`    | लोड किए गए plugins के स्वामित्व वाले टूल, जिनमें `bundle-mcp` के माध्यम से उपलब्ध कराए गए कॉन्फ़िगर किए गए MCP सर्वर शामिल हैं                                                                                                                                                           |

`spawn_task` किसी कोडिंग एजेंट को पुष्टि किया गया अनुवर्ती कार्य शुरू किए बिना प्रस्तावित करने देता है। Control UI शीर्षक और सारांश को कार्रवाई-योग्य चिप के रूप में दिखाता है; Gateway-समर्थित TUI एक समकक्ष इंटरैक्टिव प्रॉम्प्ट दिखाता है। इनमें से किसी को स्वीकार करने पर एक नया प्रबंधित-वर्कट्री सत्र बनता है और वर्तमान क्रम जारी रहते हुए पूरा प्रॉम्प्ट वहाँ भेजा जाता है। `dismiss_task`, `spawn_task` से लौटाई गई अस्थायी `task_id` के माध्यम से अब भी लंबित सुझाव को वापस लेता है।

ये टूल केवल तभी उपलब्ध कराए जाते हैं, जब आरंभ करने वाला ऑपरेटर इंटरफ़ेस Gateway कार्य-सुझाव इवेंट प्राप्त कर उन पर कार्रवाई कर सकता हो। चैनल सत्र और स्थानीय/एम्बेडेड TUI सत्र इन्हें प्राप्त नहीं करते; इस प्रवाह को सुरक्षित रूप से उपलब्ध कराने से पहले चैनल ट्रांसपोर्ट को एक पोर्टेबल टाइप की गई कार्य-कार्रवाई चाहिए। सुझाव प्रक्रिया-स्थानीय होते हैं और Gateway के पुनः आरंभ होने पर गायब हो जाते हैं। दोनों टूल `coding` प्रोफ़ाइल और `group:sessions` में बने रहते हैं, इसलिए इंटरफ़ेस द्वारा समर्थित होने पर सामान्य `tools.allow` और `tools.deny` नीति इन्हें स्वचालित रूप से कॉन्फ़िगर करती है।

### सैंडबॉक्स टूल नीति के भीतर MCP और Plugin टूल

कॉन्फ़िगर किए गए MCP सर्वर, `bundle-mcp` Plugin आईडी के अंतर्गत Plugin-स्वामित्व वाले टूल के रूप में उपलब्ध कराए जाते हैं। सामान्य टूल प्रोफ़ाइल उन्हें अनुमति दे सकती हैं, लेकिन सैंडबॉक्स किए गए सत्रों के लिए `tools.sandbox.tools` एक अतिरिक्त गेट है। यदि सैंडबॉक्स मोड `"all"` या `"non-main"` है, तो MCP/Plugin टूल दिखाई देने चाहिए तो सैंडबॉक्स टूल अनुमति-सूची में इनमें से एक प्रविष्टि शामिल करें:

- `bundle-mcp`, `mcp.servers` के OpenClaw-प्रबंधित MCP सर्वरों के लिए
- किसी विशिष्ट मूल Plugin की Plugin आईडी
- `group:plugins`, लोड किए गए सभी Plugin-स्वामित्व वाले टूल के लिए
- सटीक MCP सर्वर टूल नाम या सर्वर ग्लॉब, जैसे `outlook__send_mail` या `outlook__*`, जब आपको केवल एक सर्वर चाहिए

सर्वर ग्लॉब प्रदाता-सुरक्षित MCP सर्वर उपसर्ग का उपयोग करते हैं, जो आवश्यक नहीं कि अपरिष्कृत `mcp.servers` कुंजी हो। गैर-`[A-Za-z0-9_-]` वर्ण `-` बन जाते हैं, जो नाम किसी अक्षर से शुरू नहीं होते उन्हें `mcp-` उपसर्ग मिलता है, और लंबे या डुप्लिकेट उपसर्गों को छोटा किया जा सकता है या उनमें प्रत्यय जोड़ा जा सकता है; उदाहरण के लिए, `mcp.servers["Outlook Graph"]`, `outlook-graph__*` जैसा ग्लॉब उपयोग करता है।

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

उस सैंडबॉक्स-स्तरीय प्रविष्टि के बिना, MCP सर्वर फिर भी सफलतापूर्वक लोड हो सकता है, जबकि उसके टूल प्रदाता अनुरोध से पहले फ़िल्टर कर दिए जाते हैं। `mcp.servers` में OpenClaw-प्रबंधित सर्वरों के लिए इस स्वरूप का पता लगाने हेतु `openclaw doctor` का उपयोग करें। बंडल किए गए Plugin मैनिफ़ेस्ट या Claude `.mcp.json` से लोड किए गए MCP सर्वर उसी सैंडबॉक्स गेट का उपयोग करते हैं, लेकिन यह निदान अभी उन स्रोतों की गणना नहीं करता; यदि सैंडबॉक्स किए गए क्रमों में उनके टूल गायब हो जाएँ, तो समान अनुमति-सूची प्रविष्टियों का उपयोग करें।

### `tools.codeMode`

`tools.codeMode` सामान्य OpenClaw कोड-मोड इंटरफ़ेस को सक्षम करता है। टूल वाले किसी रन के लिए इसे सक्षम करने पर,
सामान्य OpenClaw टूल सैंडबॉक्स के भीतर स्थित `tools.*`
कैटलॉग ब्रिज के पीछे चले जाते हैं और MCP टूल जनरेट किए गए `MCP`
नेमस्पेस के माध्यम से उपलब्ध होते हैं। मॉडल को सामान्यतः `exec` और `wait` दिखाई देते हैं; `computer` जैसे टूल,
जिनके संरचित परिणाम केवल-JSON ब्रिज को पार नहीं कर सकते, सीधे उपलब्ध रहते हैं।

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

संक्षिप्त रूप भी स्वीकार किया जाता है:

```json5
{
  tools: { codeMode: true },
}
```

कोड मोड में MCP घोषणाएँ केवल-पढ़ने योग्य वर्चुअल API फ़ाइल इंटरफ़ेस के माध्यम से उपलब्ध कराई जाती हैं।
अतिथि कोड, `MCP.<server>.<tool>()` को कॉल करने से पहले TypeScript-शैली के सिग्नेचर जाँचने के लिए
`API.list("mcp")` और `API.read("mcp/<server>.d.ts")` को कॉल कर सकता है।
रनटाइम अनुबंध, सीमाओं और डीबगिंग चरणों के लिए [कोड मोड](/hi/tools/code-mode) देखें।

### `tools.allow` / `tools.deny`

वैश्विक टूल अनुमति/निषेध नीति (निषेध को प्राथमिकता मिलती है)। केस-असंवेदी, `*` वाइल्डकार्ड का समर्थन करती है। Docker सैंडबॉक्स बंद होने पर भी लागू होती है।

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` और `apply_patch` अलग-अलग टूल आईडी हैं। संगत मॉडलों के लिए `allow: ["write"]`, `apply_patch` को भी सक्षम करता है, लेकिन `deny: ["write"]`, `apply_patch` को निषिद्ध नहीं करता। सभी फ़ाइल परिवर्तनों को अवरुद्ध करने के लिए, `group:fs` को निषिद्ध करें या प्रत्येक परिवर्तनकारी टूल को स्पष्ट रूप से सूचीबद्ध करें:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` और `alsoAllow` को एक ही दायरे (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) में दोनों सेट नहीं किया जा सकता—कॉन्फ़िगरेशन सत्यापन इसे अस्वीकार कर देता है। `alsoAllow` प्रविष्टियों को `allow` में मर्ज करें, या `allow` हटाकर इसके बजाय `profile` + `alsoAllow` का उपयोग करें।
</Note>

### `tools.byProvider`

विशिष्ट प्रदाताओं या मॉडलों के लिए टूल को और प्रतिबंधित करें। क्रम: आधार प्रोफ़ाइल → प्रदाता प्रोफ़ाइल → अनुमति/निषेध।

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

किसी विशिष्ट अनुरोधकर्ता पहचान के लिए टूल प्रतिबंधित करता है। यह चैनल अभिगम नियंत्रण के ऊपर अतिरिक्त सुरक्षा परत है; प्रेषक मान चैनल अडैप्टर से आने चाहिए, संदेश टेक्स्ट से नहीं।

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

कुंजियाँ स्पष्ट उपसर्गों का उपयोग करती हैं: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, या `"*"`। चैनल आईडी मानक OpenClaw आईडी हैं; `teams` जैसे उपनाम `msteams` में सामान्यीकृत होते हैं। पुराने उपसर्ग-रहित कुंजी मान केवल `id:` के रूप में स्वीकार किए जाते हैं। मिलान क्रम है: चैनल+आईडी, आईडी, e164, उपयोगकर्ता नाम, नाम, फिर वाइल्डकार्ड।

मिलान होने पर प्रति-एजेंट `agents.list[].tools.toolsBySender` वैश्विक प्रेषक मिलान को ओवरराइड करता है, खाली `{}` नीति के साथ भी।

### `tools.elevated`

सैंडबॉक्स के बाहर उन्नत exec अभिगम नियंत्रित करता है:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- प्रति-एजेंट ओवरराइड (`agents.list[].tools.elevated`) केवल और प्रतिबंध लगा सकता है।
- `/elevated on|off|ask|full` प्रति सत्र स्थिति संग्रहीत करता है; इनलाइन निर्देश केवल एक संदेश पर लागू होते हैं।
- उन्नत `exec` सैंडबॉक्सिंग को बायपास करता है और कॉन्फ़िगर किए गए एस्केप पथ का उपयोग करता है (डिफ़ॉल्ट रूप से `gateway`, या जब exec लक्ष्य `node` हो तो `node`)।

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

दिखाए गए मान डिफ़ॉल्ट हैं, सिवाय `applyPatch.allowModels` के (डिफ़ॉल्ट रूप से खाली/अनसेट, जिसका अर्थ है कि कोई भी संगत मॉडल `apply_patch` का उपयोग कर सकता है)। अनुमोदन-समर्थित exec के लंबे समय तक चलने पर `approvalRunningNoticeMs` चालू होने की सूचना देता है; `0` इसे अक्षम करता है।

### `tools.loopDetection`

टूल-लूप सुरक्षा जाँच **डिफ़ॉल्ट रूप से अक्षम** होती हैं। पहचान सक्रिय करने के लिए `enabled: true` सेट करें। सेटिंग्स को `tools.loopDetection` में वैश्विक रूप से परिभाषित किया जा सकता है और `agents.list[].tools.loopDetection` में प्रति-एजेंट ओवरराइड किया जा सकता है।

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
    },
  },
}
```

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

दिखाए गए मान डिफ़ॉल्ट हैं, सिवाय `provider` और `userAgent` के। `maxResponseBytes` को 32000–10000000 के बीच सीमित किया जाता है; `maxChars` को `maxCharsCap` तक सीमित किया जाता है (बड़ी प्रतिक्रियाओं की अनुमति देने के लिए `maxCharsCap` बढ़ाएँ)।

### `tools.media`

आने वाले मीडिया की समझ (चित्र/ऑडियो/वीडियो) कॉन्फ़िगर करता है:

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency` (डिफ़ॉल्ट `2`), `audio.maxBytes` (डिफ़ॉल्ट 20 MB), और `video.maxBytes` (डिफ़ॉल्ट 50 MB) अपने डिफ़ॉल्ट मानों पर दिखाए गए हैं; `image.maxBytes` का डिफ़ॉल्ट 10 MB है। प्रति-क्षमता अनुरोध टाइमआउट के डिफ़ॉल्ट: चित्र/ऑडियो `60` सेकंड, वीडियो `120` सेकंड।

<AccordionGroup>
  <Accordion title="मीडिया मॉडल प्रविष्टि फ़ील्ड">
    **प्रदाता प्रविष्टि** (`type: "provider"` या छोड़ा गया):

    - `provider`: API प्रदाता आईडी (`openai`, `anthropic`, `google`/`gemini`, `groq`, आदि)
    - `model`: मॉडल आईडी ओवरराइड
    - `profile` / `preferredProfile`: `auth-profiles.json` प्रोफ़ाइल चयन

    **CLI प्रविष्टि** (`type: "cli"`):

    - `command`: चलाने के लिए निष्पादनयोग्य फ़ाइल
    - `args`: टेम्पलेट किए गए आर्ग्युमेंट (जैसे `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, आदि का समर्थन करता है; `openclaw doctor --fix` अप्रचलित `{input}` प्लेसहोल्डरों को `{{MediaPath}}` में माइग्रेट करता है)

    **सामान्य फ़ील्ड:**

    - `capabilities`: वैकल्पिक सूची (`image`, `audio`, `video`)। प्रत्येक प्रदाता Plugin अपना डिफ़ॉल्ट क्षमता सेट घोषित करता है; उदाहरण के लिए, बंडल किए गए `openai` प्रदाता का डिफ़ॉल्ट चित्र+ऑडियो, `anthropic`/`minimax` का चित्र, `google` का चित्र+ऑडियो+वीडियो, और `groq` का ऑडियो है।
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: प्रति-प्रविष्टि ओवरराइड।
    - `tools.media.image.timeoutSeconds` और मेल खाने वाली चित्र मॉडल `timeoutSeconds` प्रविष्टियाँ तब भी लागू होती हैं जब एजेंट स्पष्ट `image` टूल को कॉल करता है। चित्र समझ के लिए यह टाइमआउट स्वयं अनुरोध पर लागू होता है और पहले किए गए तैयारी कार्य से कम नहीं होता।
    - विफलता होने पर अगली प्रविष्टि का उपयोग किया जाता है।

    प्रदाता प्रमाणीकरण मानक क्रम का पालन करता है: `auth-profiles.json` → पर्यावरण चर → `models.providers.*.apiKey`।

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

नियंत्रित करता है कि सत्र टूल (`sessions_list`, `sessions_history`, `sessions_send`) किन सत्रों को लक्षित कर सकते हैं।

डिफ़ॉल्ट: `tree` (वर्तमान सत्र + इसके द्वारा बनाए गए सत्र, जैसे उप-एजेंट, साथ ही उसी एजेंट के परिवेशगत रूप से
देखे जा रहे समूह सत्र)।

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="दृश्यता दायरे">
    - `self`: केवल वर्तमान सत्र कुंजी।
    - `tree`: वर्तमान सत्र + वर्तमान सत्र द्वारा बनाए गए सत्र (उप-एजेंट)। पठन संचालनों के लिए इसमें उसी एजेंट के वे समूह सत्र भी शामिल होते हैं जिन्हें वर्तमान सत्र परिवेशगत समूह जागरूकता के माध्यम से देखता है।
    - `agent`: वर्तमान एजेंट आईडी से संबंधित कोई भी सत्र (यदि आप एक ही एजेंट आईडी के अंतर्गत प्रति-प्रेषक सत्र चलाते हैं, तो इसमें अन्य उपयोगकर्ता शामिल हो सकते हैं)।
    - `all`: कोई भी सत्र। क्रॉस-एजेंट लक्ष्यीकरण के लिए फिर भी `tools.agentToAgent` आवश्यक है।
    - सैंडबॉक्स सीमा: जब वर्तमान सत्र सैंडबॉक्स में हो और `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (डिफ़ॉल्ट) हो, तो `tools.sessions.visibility="all"` होने पर भी दृश्यता को `tree` पर बाध्य किया जाता है।
    - जब `all` न हो, तब `sessions_list` में एक संक्षिप्त `visibility` फ़ील्ड शामिल होता है
      जो प्रभावी मोड का वर्णन करता है और चेतावनी देता है कि वर्तमान दायरे के बाहर
      कुछ सत्र छोड़े जा सकते हैं।

  </Accordion>
</AccordionGroup>

डिफ़ॉल्ट `session.dmScope: "main"` के साथ, किसी समूह में मानवीय गतिविधि उसी एजेंट के उस समूह
सत्र को एजेंट के मुख्य सत्र के लिए परिवेशगत रूप से दृश्यमान बनाती है। बहु-उपयोगकर्ता सेटअप में, `"main"` उपयोगकर्ताओं के बीच
एक DM सत्र भी साझा करता है, इसलिए वहाँ रूट किया गया प्रत्येक उपयोगकर्ता परिवेशगत रूप से देखे जा रहे समूहों से पढ़ सकता है,
जिसमें सत्र-मेमोरी `memory_search` के माध्यम से पढ़ना भी शामिल है। DM अलगाव के लिए प्रति-पीयर `dmScope` का उपयोग करें, या
परिवेशगत रूप से देखे जा रहे सत्रों से पठन बंद करने के लिए `tools.sessions.visibility: "self"` सेट करें।

### `tools.sessions_spawn`

`sessions_spawn` के लिए इनलाइन अटैचमेंट समर्थन नियंत्रित करता है।

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="अटैचमेंट संबंधी टिप्पणियाँ">
    - अटैचमेंट के लिए `enabled: true` आवश्यक है।
    - उप-एजेंट अटैचमेंट को चाइल्ड कार्यक्षेत्र में `.openclaw/attachments/<uuid>/` पर एक `.manifest.json` के साथ भौतिक रूप दिया जाता है।
    - ACP अटैचमेंट केवल चित्र हो सकते हैं और समान फ़ाइल संख्या, प्रति-फ़ाइल बाइट तथा कुल बाइट सीमाएँ पार होने के बाद ACP रनटाइम को इनलाइन अग्रेषित किए जाते हैं।
    - अटैचमेंट की सामग्री को ट्रांसक्रिप्ट स्थायित्व से स्वचालित रूप से संपादित कर दिया जाता है।
    - Base64 इनपुट का सख्त वर्णमाला/पैडिंग जाँच और डीकोड-पूर्व आकार सुरक्षा के साथ सत्यापन किया जाता है।
    - उप-एजेंट अटैचमेंट फ़ाइल अनुमतियाँ निर्देशिकाओं के लिए `0700` और फ़ाइलों के लिए `0600` होती हैं।
    - उप-एजेंट सफ़ाई `cleanup` नीति का पालन करती है: `delete` हमेशा अटैचमेंट हटाता है; `keep` उन्हें केवल तब बनाए रखता है जब `retainOnSessionKeep: true`।

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

प्रयोगात्मक अंतर्निहित टूल फ़्लैग। जब तक सख्त-एजेंटिक GPT-5 स्वतः-सक्षमीकरण नियम लागू न हो, डिफ़ॉल्ट रूप से बंद।

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: गैर-सामान्य बहु-चरणीय कार्य ट्रैकिंग के लिए संरचित `update_plan` टूल सक्षम करता है।
- डिफ़ॉल्ट: `false`, जब तक `agents.defaults.embeddedAgent.executionContract` (या प्रति-एजेंट ओवरराइड) को GPT-5-परिवार मॉडल आईडी के विरुद्ध `openai` प्रदाता रन के लिए `"strict-agentic"` पर सेट न किया गया हो (इसमें OpenAI Codex CLI रन भी शामिल हैं, क्योंकि Codex प्रमाणीकरण/मॉडल रूटिंग `openai` प्रदाता के अंतर्गत रहती है)। उस दायरे के बाहर टूल को बाध्यतः चालू करने के लिए `true` सेट करें, या सख्त-एजेंटिक GPT-5 रन के लिए भी इसे बंद रखने हेतु `false` सेट करें।
- सक्षम होने पर, सिस्टम प्रॉम्प्ट उपयोग संबंधी मार्गदर्शन भी जोड़ता है, ताकि मॉडल इसका उपयोग केवल पर्याप्त कार्य के लिए करे और अधिकतम एक चरण को `in_progress` रखे।

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: उत्पन्न किए गए उप-एजेंटों के लिए डिफ़ॉल्ट मॉडल। इसे छोड़ने पर, उप-एजेंट कॉलर का मॉडल इनहेरिट करते हैं।
- `allowAgents`: जब अनुरोधकर्ता एजेंट अपना `subagents.allowAgents` सेट नहीं करता, तब `sessions_spawn` के लिए कॉन्फ़िगर किए गए लक्ष्य एजेंट आईडी की डिफ़ॉल्ट अनुमति-सूची (`["*"]` = कोई भी कॉन्फ़िगर किया गया लक्ष्य; डिफ़ॉल्ट: केवल वही एजेंट)। जिन अप्रचलित प्रविष्टियों का एजेंट कॉन्फ़िगरेशन हटा दिया गया है, उन्हें `sessions_spawn` अस्वीकार करता है और `agents_list` से बाहर रखता है; उन्हें साफ़ करने के लिए `openclaw doctor --fix` चलाएँ।
- `maxConcurrent`: समवर्ती उप-एजेंट रन की अधिकतम संख्या। डिफ़ॉल्ट: `8`।
- `runTimeoutSeconds`: जब कॉलर अपना ओवरराइड पास नहीं करता, तब `sessions_spawn` के लिए टाइमआउट (सेकंड)। डिफ़ॉल्ट: `0` (कोई टाइमआउट नहीं); ऊपर दिखाया गया `900` एक सामान्य वैकल्पिक मान है, अंतर्निहित डिफ़ॉल्ट नहीं।
- `announceTimeoutMs`: Gateway `agent` घोषणा डिलीवरी प्रयासों के लिए प्रति-कॉल टाइमआउट (मिलीसेकंड)। डिफ़ॉल्ट: `120000`। अस्थायी पुनः प्रयासों के कारण घोषणा की कुल प्रतीक्षा कॉन्फ़िगर किए गए एक टाइमआउट से अधिक हो सकती है।
- `archiveAfterMinutes`: उप-एजेंट सत्र पूरा होने के बाद उसे स्वचालित रूप से संग्रहित करने से पहले के मिनट। डिफ़ॉल्ट: `60`; `0` स्वचालित संग्रहण अक्षम करता है।
- प्रति-उप-एजेंट टूल नीति: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`।

---

## कस्टम प्रदाता और आधार URL

प्रदाता Plugin अपनी मॉडल कैटलॉग पंक्तियाँ प्रकाशित करते हैं। कॉन्फ़िगरेशन में `models.providers` या `~/.openclaw/agents/<agentId>/agent/models.json` के माध्यम से कस्टम प्रदाता जोड़ें।

कस्टम/स्थानीय प्रदाता `baseUrl` को कॉन्फ़िगर करना मॉडल HTTP अनुरोधों के लिए सीमित नेटवर्क विश्वास निर्णय भी है: OpenClaw किसी अलग कॉन्फ़िगरेशन विकल्प को जोड़े या अन्य निजी मूलों पर विश्वास किए बिना, सुरक्षित फ़ेच पथ से ठीक उसी `scheme://host:port` मूल को अनुमति देता है।

```json5
{
  models: {
    mode: "merge", // मर्ज (डिफ़ॉल्ट) | प्रतिस्थापित करें
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | आदि
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="प्रमाणीकरण और मर्ज वरीयता">
    - कस्टम प्रमाणीकरण आवश्यकताओं के लिए `authHeader: true` + `headers` का उपयोग करें।
    - `OPENCLAW_AGENT_DIR` से एजेंट कॉन्फ़िगरेशन रूट को ओवरराइड करें।
    - मेल खाते प्रदाता आईडी के लिए मर्ज वरीयता:
      - एजेंट के गैर-रिक्त `models.json` `baseUrl` मानों को वरीयता मिलती है।
      - एजेंट के गैर-रिक्त `apiKey` मानों को केवल तभी वरीयता मिलती है, जब वर्तमान कॉन्फ़िगरेशन/प्रमाणीकरण-प्रोफ़ाइल संदर्भ में वह प्रदाता SecretRef द्वारा प्रबंधित न हो।
      - SecretRef द्वारा प्रबंधित प्रदाता के `apiKey` मानों को हल किए गए सीक्रेट स्थायी रूप से सहेजने के बजाय स्रोत मार्करों (`ENV_VAR_NAME` पर्यावरण संदर्भों के लिए, `secretref-managed` फ़ाइल/निष्पादन संदर्भों के लिए) से ताज़ा किया जाता है।
      - SecretRef द्वारा प्रबंधित प्रदाता हेडर मानों को स्रोत मार्करों (`secretref-env:ENV_VAR_NAME` पर्यावरण संदर्भों के लिए, `secretref-managed` फ़ाइल/निष्पादन संदर्भों के लिए) से ताज़ा किया जाता है।
      - एजेंट के रिक्त या अनुपस्थित `apiKey`/`baseUrl` कॉन्फ़िगरेशन के `models.providers` पर वापस जाते हैं।
      - मेल खाते मॉडल `contextWindow`/`maxTokens`: स्पष्ट कॉन्फ़िगरेशन मान मौजूद और मान्य होने पर (धनात्मक सीमित संख्या) उसे वरीयता मिलती है; अन्यथा अंतर्निहित/उत्पन्न कैटलॉग मान उपयोग किया जाता है।
      - मेल खाते मॉडल `contextTokens` पर भी यही स्पष्ट-मान-को-वरीयता-अन्यथा-अंतर्निहित नियम लागू होता है; मूल मॉडल मेटाडेटा बदले बिना प्रभावी संदर्भ सीमित करने के लिए इसका उपयोग करें।
      - प्रदाता-Plugin कैटलॉग एजेंट की Plugin स्थिति के अंतर्गत उत्पन्न, Plugin-स्वामित्व वाले कैटलॉग खंडों के रूप में संग्रहीत किए जाते हैं।
      - जब आप चाहते हैं कि कॉन्फ़िगरेशन `models.json` को पूरी तरह दोबारा लिखे और Plugin-स्वामित्व वाले कैटलॉग खंडों का मर्ज छोड़ दे, तब `models.mode: "replace"` का उपयोग करें।
      - मार्कर का स्थायीकरण स्रोत-प्रामाणिक है: मार्कर सक्रिय स्रोत कॉन्फ़िगरेशन स्नैपशॉट (रिज़ॉल्यूशन से पहले) से लिखे जाते हैं, हल किए गए रनटाइम सीक्रेट मानों से नहीं।

  </Accordion>
</AccordionGroup>

### प्रदाता फ़ील्ड का विवरण

<AccordionGroup>
  <Accordion title="शीर्ष-स्तरीय कैटलॉग">
    - `models.mode`: प्रदाता कैटलॉग व्यवहार (`merge` या `replace`)।
    - `models.providers`: प्रदाता आईडी द्वारा कुंजीबद्ध कस्टम प्रदाता मैप।
      - सुरक्षित संपादन: योगात्मक अपडेट के लिए `openclaw config set models.providers.<id> '<json>' --strict-json --merge` या `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` का उपयोग करें। जब तक आप `--replace` पास नहीं करते, `config set` विनाशकारी प्रतिस्थापन अस्वीकार करता है।

  </Accordion>
  <Accordion title="प्रदाता कनेक्शन और प्रमाणीकरण">
    - `models.providers.*.api`: अनुरोध अडैप्टर (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`)। MLX, vLLM, SGLang और अधिकांश OpenAI-संगत स्थानीय सर्वरों जैसे स्व-होस्ट किए गए `/v1/chat/completions` बैकएंड के लिए `openai-completions` का उपयोग करें। `baseUrl` वाले लेकिन `api` के बिना कस्टम प्रदाता का डिफ़ॉल्ट `openai-completions` होता है; `openai-responses` केवल तभी सेट करें जब बैकएंड `/v1/responses` का समर्थन करता हो।
    - `models.providers.*.apiKey`: प्रदाता क्रेडेंशियल (SecretRef/पर्यावरण प्रतिस्थापन को प्राथमिकता दें)।
    - `models.providers.*.auth`: प्रमाणीकरण रणनीति (`api-key`, `token`, `oauth`, `aws-sdk`)।
    - `models.providers.*.contextWindow`: जब मॉडल प्रविष्टि `contextWindow` सेट नहीं करती, तब इस प्रदाता के अंतर्गत मॉडल के लिए डिफ़ॉल्ट मूल संदर्भ विंडो।
    - `models.providers.*.contextTokens`: जब मॉडल प्रविष्टि `contextTokens` सेट नहीं करती, तब इस प्रदाता के अंतर्गत मॉडल के लिए डिफ़ॉल्ट प्रभावी रनटाइम संदर्भ सीमा।
    - `models.providers.*.maxTokens`: जब मॉडल प्रविष्टि `maxTokens` सेट नहीं करती, तब इस प्रदाता के अंतर्गत मॉडल के लिए डिफ़ॉल्ट आउटपुट-टोकन सीमा।
    - `models.providers.*.timeoutSeconds`: प्रति-प्रदाता मॉडल HTTP अनुरोध का वैकल्पिक टाइमआउट, सेकंड में, जिसमें कनेक्ट, हेडर, बॉडी और कुल अनुरोध निरस्तीकरण प्रबंधन शामिल है।
    - `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` के लिए, अनुरोधों में `options.num_ctx` डालें (डिफ़ॉल्ट: `true`)।
    - `models.providers.*.authHeader`: आवश्यक होने पर `Authorization` हेडर में क्रेडेंशियल परिवहन बाध्य करें।
    - `models.providers.*.baseUrl`: अपस्ट्रीम API आधार URL।
    - `models.providers.*.headers`: प्रॉक्सी/टेनेंट रूटिंग के लिए अतिरिक्त स्थिर हेडर।

  </Accordion>
  <Accordion title="अनुरोध परिवहन ओवरराइड">
    `models.providers.*.request`: मॉडल-प्रदाता HTTP अनुरोधों के लिए परिवहन ओवरराइड।

    - `request.headers`: अतिरिक्त हेडर (प्रदाता डिफ़ॉल्ट के साथ मर्ज किए जाते हैं)। मान SecretRef स्वीकार करते हैं।
    - `request.auth`: प्रमाणीकरण रणनीति ओवरराइड। मोड: `"provider-default"` (प्रदाता का अंतर्निहित प्रमाणीकरण उपयोग करें), `"authorization-bearer"` (`token` के साथ), `"header"` (`headerName`, `value`, वैकल्पिक `prefix` के साथ)।
    - `request.proxy`: HTTP प्रॉक्सी ओवरराइड। मोड: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY` पर्यावरण चर उपयोग करें), `"explicit-proxy"` (`url` के साथ)। दोनों मोड वैकल्पिक `tls` उप-ऑब्जेक्ट स्वीकार करते हैं।
    - `request.tls`: सीधे कनेक्शन के लिए TLS ओवरराइड। फ़ील्ड: `ca`, `cert`, `key`, `passphrase` (सभी SecretRef स्वीकार करते हैं), `serverName`, `insecureSkipVerify`।
    - `request.allowPrivateNetwork`: जब `true` हो, तब प्रदाता HTTP फ़ेच गार्ड के माध्यम से निजी, CGNAT या समान श्रेणियों में मॉडल-प्रदाता HTTP अनुरोधों की अनुमति दें। कस्टम/स्थानीय प्रदाता आधार URL पहले से ठीक उसी कॉन्फ़िगर किए गए मूल पर विश्वास करते हैं, सिवाय मेटाडेटा/लिंक-लोकल मूलों के, जो स्पष्ट सहमति के बिना अवरुद्ध रहते हैं। सटीक-मूल विश्वास से बाहर निकलने के लिए इसे `false` पर सेट करें। WebSocket हेडर/TLS के लिए उसी `request` का उपयोग करता है, लेकिन उस फ़ेच SSRF गेट का नहीं। डिफ़ॉल्ट `false`।

  </Accordion>
  <Accordion title="मॉडल कैटलॉग प्रविष्टियाँ">
    - `models.providers.*.models`: स्पष्ट प्रदाता मॉडल कैटलॉग प्रविष्टियाँ।
    - `models.providers.*.models.*.input`: मॉडल इनपुट मोडैलिटी। केवल-पाठ मॉडल के लिए `["text"]` और मूल छवि/विज़न मॉडल के लिए `["text", "image"]` का उपयोग करें। छवि संलग्नक एजेंट टर्न में केवल तभी डाले जाते हैं जब चयनित मॉडल को छवि-सक्षम चिह्नित किया गया हो।
    - `models.providers.*.models.*.contextWindow`: मूल मॉडल संदर्भ विंडो मेटाडेटा। यह उस मॉडल के लिए प्रदाता-स्तरीय `contextWindow` को ओवरराइड करता है।
    - `models.providers.*.models.*.contextTokens`: वैकल्पिक रनटाइम संदर्भ सीमा। यह प्रदाता-स्तरीय `contextTokens` को ओवरराइड करती है; जब आप मॉडल के मूल `contextWindow` से छोटा प्रभावी संदर्भ बजट चाहते हैं, तब इसका उपयोग करें; दोनों मान अलग होने पर `openclaw models list` दोनों दिखाता है।
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: वैकल्पिक संगतता संकेत। गैर-रिक्त, गैर-मूल `baseUrl` (होस्ट `api.openai.com` नहीं) वाले `api: "openai-completions"` के लिए, OpenClaw रनटाइम पर इसे `false` पर बाध्य करता है। रिक्त/छोड़ा गया `baseUrl` डिफ़ॉल्ट OpenAI व्यवहार बनाए रखता है।
    - `models.providers.*.models.*.compat.requiresStringContent`: केवल-स्ट्रिंग OpenAI-संगत चैट एंडपॉइंट के लिए वैकल्पिक संगतता संकेत। जब `true` हो, तब OpenClaw अनुरोध भेजने से पहले शुद्ध-पाठ `messages[].content` सरणियों को साधारण स्ट्रिंग में समतल करता है।
    - `models.providers.*.models.*.compat.strictMessageKeys`: सख्त OpenAI-संगत चैट एंडपॉइंट के लिए वैकल्पिक संगतता संकेत। जब `true` हो, तब OpenClaw अनुरोध भेजने से पहले आउटगोइंग Chat Completions संदेश ऑब्जेक्ट को `role` और `content` तक सीमित कर देता है।
    - `models.providers.*.models.*.compat.thinkingFormat`: वैकल्पिक थिंकिंग पेलोड संकेत। Together-शैली `reasoning.enabled` के लिए `"together"`, शीर्ष-स्तरीय `enable_thinking` के लिए `"qwen"`, या vLLM जैसे अनुरोध-स्तरीय चैट-टेम्पलेट kwargs का समर्थन करने वाले Qwen-परिवार OpenAI-संगत सर्वरों पर `chat_template_kwargs.enable_thinking` के लिए `"qwen-chat-template"` का उपयोग करें। कॉन्फ़िगर किए गए vLLM Qwen मॉडल इन प्रारूपों के लिए द्विआधारी `/think` विकल्प (`off`, `on`) उपलब्ध कराते हैं।
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: DeepSeek-शैली Chat Completions बैकएंड के लिए वैकल्पिक संगतता संकेत, जिन्हें रीप्ले पर पिछले सहायक संदेशों में `reasoning_content` बनाए रखना आवश्यक होता है। जब `true` हो, तब OpenClaw आउटगोइंग सहायक संदेशों में उस फ़ील्ड को बनाए रखता है। इसका उपयोग ऐसे कस्टम DeepSeek-संगत प्रॉक्सी को जोड़ते समय करें, जो हटाए गए रीजनिंग के बाद अनुरोध अस्वीकार करता है। डिफ़ॉल्ट `false`।

  </Accordion>
  <Accordion title="Amazon Bedrock खोज">
    - `plugins.entries.amazon-bedrock.config.discovery`: Bedrock स्वतः-खोज सेटिंग का रूट।
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: अंतर्निहित खोज चालू/बंद करें।
    - `plugins.entries.amazon-bedrock.config.discovery.region`: खोज के लिए AWS क्षेत्र।
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: लक्षित खोज के लिए वैकल्पिक प्रदाता-आईडी फ़िल्टर।
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: खोज रीफ़्रेश के लिए पोलिंग अंतराल।
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: खोजे गए मॉडल के लिए फ़ॉलबैक संदर्भ विंडो।
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: खोजे गए मॉडल के लिए फ़ॉलबैक अधिकतम आउटपुट टोकन।

  </Accordion>
</AccordionGroup>

इंटरैक्टिव कस्टम-प्रोवाइडर ऑनबोर्डिंग ज्ञात विज़न-मॉडल-ID पैटर्न के लिए इमेज इनपुट का अनुमान लगाती है, जिनमें GPT-4o/GPT-4.1/GPT-5+, `o1`/`o3`/`o4` रीजनिंग फ़ैमिली, Claude, Gemini, कोई भी `-vl`-प्रत्यय वाला ID (Qwen-VL और समान), तथा LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V और GLM-4V जैसी नामित फ़ैमिली शामिल हैं; यह ज्ञात केवल-टेक्स्ट फ़ैमिली (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama और vl/vision प्रत्यय के बिना मूल Qwen ID) के लिए अतिरिक्त प्रश्न छोड़ देती है। अज्ञात मॉडल ID के लिए अभी भी इमेज समर्थन के बारे में पूछा जाता है। गैर-इंटरैक्टिव ऑनबोर्डिंग भी इसी अनुमान का उपयोग करती है; इमेज-सक्षम मेटाडेटा बाध्य करने के लिए `--custom-image-input` या केवल-टेक्स्ट मेटाडेटा बाध्य करने के लिए `--custom-text-input` पास करें।

### प्रोवाइडर के उदाहरण

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    आधिकारिक बाहरी `cerebras` प्रोवाइडर Plugin इसे `openclaw onboard --auth-choice cerebras-api-key` के माध्यम से कॉन्फ़िगर कर सकता है। स्पष्ट प्रोवाइडर कॉन्फ़िगरेशन का उपयोग केवल डिफ़ॉल्ट को ओवरराइड करते समय करें।

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Cerebras के लिए `cerebras/zai-glm-4.7`; सीधे Z.AI के लिए `zai/glm-4.7` का उपयोग करें।

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic-संगत, अंतर्निहित प्रोवाइडर। शॉर्टकट: `openclaw onboard --auth-choice kimi-code-api-key`।

  </Accordion>
  <Accordion title="स्थानीय मॉडल (LM Studio)">
    [स्थानीय मॉडल](/hi/gateway/local-models) देखें। संक्षेप में: सक्षम हार्डवेयर पर LM Studio Responses API के माध्यम से एक बड़ा स्थानीय मॉडल चलाएँ; फ़ॉलबैक के लिए होस्ट किए गए मॉडल मर्ज रखें।
  </Accordion>
  <Accordion title="MiniMax M3 (प्रत्यक्ष)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    `MINIMAX_API_KEY` सेट करें। शॉर्टकट: `openclaw onboard --auth-choice minimax-global-api` या `openclaw onboard --auth-choice minimax-cn-api`। मॉडल कैटलॉग का डिफ़ॉल्ट M3 है और इसमें M2.7 वेरिएंट भी शामिल हैं। Anthropic-संगत स्ट्रीमिंग पथ पर, OpenClaw डिफ़ॉल्ट रूप से MiniMax M2.x थिंकिंग अक्षम करता है, जब तक कि आप स्वयं स्पष्ट रूप से `thinking` सेट न करें; MiniMax-M3 (और M3.x) डिफ़ॉल्ट रूप से प्रोवाइडर के छोड़े गए/अनुकूली थिंकिंग पथ पर बना रहता है। `/fast on` या `params.fastMode: true`, `MiniMax-M2.7` को `MiniMax-M2.7-highspeed` के रूप में फिर से लिखता है।

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    चीन एंडपॉइंट के लिए: `baseUrl: "https://api.moonshot.cn/v1"` या `openclaw onboard --auth-choice moonshot-api-key-cn`।

    नेटिव Moonshot एंडपॉइंट साझा `openai-completions` ट्रांसपोर्ट पर स्ट्रीमिंग उपयोग संगतता की घोषणा करते हैं, और OpenClaw इसे केवल अंतर्निहित प्रोवाइडर ID के बजाय एंडपॉइंट क्षमताओं के आधार पर सक्रिय करता है।

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    `OPENCODE_API_KEY` (या `OPENCODE_ZEN_API_KEY`) सेट करें। Zen कैटलॉग के लिए `opencode/...` संदर्भ या Go कैटलॉग के लिए `opencode-go/...` संदर्भ का उपयोग करें। शॉर्टकट: `openclaw onboard --auth-choice opencode-zen` या `openclaw onboard --auth-choice opencode-go`।

  </Accordion>
  <Accordion title="Synthetic (Anthropic-संगत)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    बेस URL में `/v1` शामिल नहीं होना चाहिए (Anthropic क्लाइंट इसे जोड़ता है)। शॉर्टकट: `openclaw onboard --auth-choice synthetic-api-key`।

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    `ZAI_API_KEY` सेट करें। मॉडल संदर्भ कैनोनिकल `zai/*` प्रोवाइडर ID का उपयोग करते हैं। शॉर्टकट: `openclaw onboard --auth-choice zai-api-key`।

    - सामान्य एंडपॉइंट: `https://api.z.ai/api/paas/v4`
    - कोडिंग एंडपॉइंट: `https://api.z.ai/api/coding/paas/v4`
    - डिफ़ॉल्ट `zai-api-key` प्रमाणीकरण विकल्प आपकी कुंजी की जाँच करता है और स्वतः पता लगाता है कि वह किस एंडपॉइंट की है (यदि पहचान अनिर्णायक हो, तो प्रॉम्प्ट पर लौटते हुए और डिफ़ॉल्ट रूप से Global चुनते हुए)। स्पष्ट चयन के लिए समर्पित CN और Coding-Plan प्रमाणीकरण विकल्प भी उपलब्ध हैं।
    - सामान्य एंडपॉइंट के लिए, बेस URL ओवरराइड के साथ एक कस्टम प्रोवाइडर परिभाषित करें।

  </Accordion>
</AccordionGroup>

---

## संबंधित

- [कॉन्फ़िगरेशन — एजेंट](/hi/gateway/config-agents)
- [कॉन्फ़िगरेशन — चैनल](/hi/gateway/config-channels)
- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference) — अन्य शीर्ष-स्तरीय कुंजियाँ
- [टूल और Plugin](/hi/tools)
