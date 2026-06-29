---
read_when:
    - आप ऐसा Plugin बना रहे हैं जिसे before_tool_call, before_agent_reply, message hooks, या lifecycle hooks की आवश्यकता है
    - आपको किसी Plugin से आने वाली टूल कॉलों को ब्लॉक करना, फिर से लिखना, या उनके लिए अनुमोदन आवश्यक करना होगा
    - आप internal hooks और plugin hooks के बीच निर्णय ले रहे हैं
summary: 'Plugin हुक: एजेंट, टूल, संदेश, सत्र, और Gateway जीवनचक्र इवेंट्स को इंटरसेप्ट करें'
title: Plugin हुक्स
x-i18n:
    generated_at: "2026-06-28T23:36:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Plugin हुक OpenClaw Plugin के लिए इन-प्रोसेस विस्तार बिंदु हैं। उनका उपयोग
तब करें जब किसी Plugin को एजेंट रन, टूल कॉल, संदेश प्रवाह,
सेशन लाइफसाइकल, सबएजेंट रूटिंग, इंस्टॉल, या Gateway स्टार्टअप की जांच करनी या उन्हें बदलना हो।

इसके बजाय [आंतरिक हुक](/hi/automation/hooks) का उपयोग करें जब आपको कमांड और Gateway इवेंट्स जैसे
`/new`, `/reset`, `/stop`, `agent:bootstrap`, या `gateway:startup` के लिए एक छोटा
ऑपरेटर-इंस्टॉल किया गया `HOOK.md` स्क्रिप्ट चाहिए।

## त्वरित शुरुआत

अपने Plugin एंट्री से `api.on(...)` के साथ टाइप किए गए Plugin हुक रजिस्टर करें:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

हुक हैंडलर घटते हुए `priority` क्रम में क्रमिक रूप से चलते हैं। समान-प्राथमिकता वाले हुक
रजिस्ट्रेशन क्रम बनाए रखते हैं।

`api.on(name, handler, opts?)` स्वीकार करता है:

- `priority` - हैंडलर क्रम (बड़ा मान पहले चलता है)।
- `timeoutMs` - वैकल्पिक प्रति-हुक बजट। सेट होने पर, हुक रनर बजट समाप्त होने के बाद
  उस हैंडलर को रोक देता है और अगले पर जारी रहता है, बजाय इसके कि
  धीमा सेटअप या रिकॉल कार्य कॉलर के कॉन्फ़िगर किए गए मॉडल
  टाइमआउट को खा जाए। उसे छोड़ दें ताकि हुक रनर द्वारा सामान्य रूप से लागू किया गया
  डिफ़ॉल्ट अवलोकन/निर्णय टाइमआउट उपयोग हो।

ऑपरेटर Plugin कोड पैच किए बिना भी हुक बजट सेट कर सकते हैं:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` `hooks.timeoutMs` को ओवरराइड करता है, जो
Plugin-लिखित `api.on(..., { timeoutMs })` मान को ओवरराइड करता है। प्रत्येक कॉन्फ़िगर किया गया मान
600000 मिलीसेकंड से अधिक न होने वाला धनात्मक पूर्णांक होना चाहिए। ज्ञात धीमे हुक के लिए प्रति-हुक
ओवरराइड को प्राथमिकता दें, ताकि किसी एक Plugin को हर जगह लंबा बजट न मिले।

प्रत्येक हुक को `event.context.pluginConfig` मिलता है, यानी उस Plugin के लिए हल किया गया कॉन्फ़िग
जिसने वह हैंडलर रजिस्टर किया था। वर्तमान Plugin विकल्पों की आवश्यकता वाले हुक निर्णयों के लिए
इसका उपयोग करें; OpenClaw इसे प्रति हैंडलर इंजेक्ट करता है, बिना उस साझा इवेंट ऑब्जेक्ट को बदले
जिसे अन्य Plugin देखते हैं।

## हुक कैटलॉग

हुक उस सतह के आधार पर समूहित हैं जिसे वे विस्तारित करते हैं। **बोल्ड** नाम
निर्णय परिणाम (ब्लॉक, रद्द, ओवरराइड, या स्वीकृति आवश्यक) स्वीकार करते हैं; बाकी सभी
केवल-अवलोकन हैं।

**एजेंट टर्न**

- `before_model_resolve` - सेशन संदेश लोड होने से पहले प्रदाता या मॉडल ओवरराइड करें
- `agent_turn_prepare` - कतारबद्ध Plugin टर्न इंजेक्शन का उपभोग करें और प्रॉम्प्ट हुक से पहले उसी टर्न का संदर्भ जोड़ें
- `before_prompt_build` - मॉडल कॉल से पहले डायनेमिक संदर्भ या सिस्टम-प्रॉम्प्ट टेक्स्ट जोड़ें
- `before_agent_start` - केवल-संगतता संयुक्त चरण; ऊपर के दो हुक को प्राथमिकता दें
- **`before_agent_run`** - मॉडल सबमिशन से पहले अंतिम प्रॉम्प्ट और सेशन संदेशों की जांच करें और वैकल्पिक रूप से रन ब्लॉक करें
- **`before_agent_reply`** - मॉडल टर्न को सिंथेटिक जवाब या मौन के साथ शॉर्ट-सर्किट करें
- **`before_agent_finalize`** - स्वाभाविक अंतिम उत्तर की जांच करें और एक और मॉडल पास का अनुरोध करें
- `agent_end` - अंतिम संदेशों, सफलता स्थिति, और रन अवधि का अवलोकन करें
- `heartbeat_prompt_contribution` - पृष्ठभूमि मॉनिटर और लाइफसाइकल Plugin के लिए केवल-Heartbeat संदर्भ जोड़ें

**बातचीत अवलोकन**

- `model_call_started` / `model_call_ended` - प्रॉम्प्ट या प्रतिक्रिया सामग्री के बिना स्वच्छ किए गए प्रदाता/मॉडल कॉल मेटाडेटा, टाइमिंग, परिणाम, और सीमित अनुरोध-id हैश का अवलोकन करें
- `llm_input` - प्रदाता इनपुट (सिस्टम प्रॉम्प्ट, प्रॉम्प्ट, इतिहास) का अवलोकन करें
- `llm_output` - उपलब्ध होने पर प्रदाता आउटपुट, उपयोग, और हल किए गए `contextTokenBudget` का अवलोकन करें

**टूल**

- **`before_tool_call`** - टूल पैरामीटर फिर से लिखें, निष्पादन ब्लॉक करें, या स्वीकृति आवश्यक करें
- `after_tool_call` - टूल परिणामों, त्रुटियों, और अवधि का अवलोकन करें
- `resolve_exec_env` - `exec` में Plugin-स्वामित्व वाले पर्यावरण वेरिएबल योगदान करें
- **`tool_result_persist`** - टूल परिणाम से बने सहायक संदेश को फिर से लिखें
- **`before_message_write`** - जारी संदेश लेखन की जांच करें या उसे ब्लॉक करें (दुर्लभ)

**संदेश और डिलीवरी**

- **`inbound_claim`** - एजेंट रूटिंग से पहले किसी इनबाउंड संदेश का दावा करें (सिंथेटिक जवाब)
- `message_received` — इनबाउंड सामग्री, प्रेषक, थ्रेड, और मेटाडेटा का अवलोकन करें
- **`message_sending`** — आउटबाउंड सामग्री फिर से लिखें या डिलीवरी रद्द करें
- **`reply_payload_sending`** — डिलीवरी से पहले सामान्यीकृत जवाब पेलोड बदलें या रद्द करें
- `message_sent` — आउटबाउंड डिलीवरी की सफलता या विफलता का अवलोकन करें
- **`before_dispatch`** - चैनल हैंडऑफ़ से पहले आउटबाउंड डिस्पैच की जांच करें या उसे फिर से लिखें
- **`reply_dispatch`** - अंतिम जवाब-डिस्पैच पाइपलाइन में भाग लें

**सेशन और Compaction**

- `session_start` / `session_end` - सेशन लाइफसाइकल सीमाओं को ट्रैक करें। इवेंट का `reason` `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart`, या `unknown` में से एक है। जब प्रक्रिया रुकती या पुनरारंभ होती है और सेशन अब भी सक्रिय होते हैं, तो `shutdown` और `restart` मान Gateway शटडाउन फाइनलाइज़र से फायर होते हैं, ताकि डाउनस्ट्रीम Plugin (जैसे मेमोरी या ट्रांसक्रिप्ट स्टोर) उन घोस्ट रो को अंतिम रूप दे सकें जो अन्यथा रीस्टार्ट के पार खुले स्टेट में रह जाते। फाइनलाइज़र सीमित है ताकि कोई धीमा Plugin SIGTERM/SIGINT को ब्लॉक न कर सके।
- `before_compaction` / `after_compaction` - Compaction चक्रों का अवलोकन करें या उन्हें एनोटेट करें
- `before_reset` - सेशन-रीसेट इवेंट्स (`/reset`, प्रोग्रामेटिक रीसेट) का अवलोकन करें

**सबएजेंट**

- `subagent_spawned` / `subagent_ended` - सबएजेंट लॉन्च और पूर्णता का अवलोकन करें।
- `subagent_delivery_target` - पूर्णता डिलीवरी के लिए संगतता हुक, जब कोई कोर सेशन बाइंडिंग रूट प्रोजेक्ट नहीं कर सकती।
- `subagent_spawning` - अप्रचलित संगतता हुक। कोर अब `subagent_spawned` फायर होने से पहले चैनल सेशन-बाइंडिंग अडैप्टर के माध्यम से `thread: true` सबएजेंट बाइंडिंग तैयार करता है।
- `subagent_spawned` में `resolvedModel` और `resolvedProvider` शामिल होते हैं जब OpenClaw ने लॉन्च से पहले चाइल्ड सेशन का नेटिव मॉडल हल कर लिया हो।
- `subagent_ended` `targetSessionKey` (पहचान — यह `subagent_spawned.childSessionKey` से मेल खाता है), `targetKind` (`"subagent"` या `"acp"`), `reason`, वैकल्पिक `outcome` (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"`, या `"deleted"`), वैकल्पिक `error`, `runId`, `endedAt`, `accountId`, और `sendFarewell` ले जाता है। इसमें **`agentId` या `childSessionKey` शामिल नहीं** हैं; संबंधित `subagent_spawned` इवेंट से संबद्ध करने के लिए `targetSessionKey` का उपयोग करें।

**लाइफसाइकल**

- `gateway_start` / `gateway_stop` - Gateway के साथ Plugin-स्वामित्व वाली सेवाएं शुरू या बंद करें
- `deactivate` - `gateway_stop` के लिए अप्रचलित संगतता उपनाम; नए Plugin में `gateway_stop` का उपयोग करें
- `cron_changed` - Gateway-स्वामित्व वाले Cron लाइफसाइकल बदलावों (जोड़ा गया, अपडेट किया गया, हटाया गया, शुरू हुआ, समाप्त हुआ, शेड्यूल किया गया) का अवलोकन करें
- **`before_install`** - लोड किए गए
  Plugin रनटाइम से स्टेज की गई skill या Plugin इंस्टॉल सामग्री की जांच करें

## डीबग रनटाइम हुक

जब किसी Plugin को एजेंट टर्न के लिए प्रदाता या मॉडल बदलना हो, तो `before_model_resolve` का उपयोग करें।
यह मॉडल रिज़ॉल्यूशन से पहले चलता है; `llm_output` केवल तब चलता है जब
किसी मॉडल प्रयास से सहायक आउटपुट बनता है।

प्रभावी सेशन मॉडल के प्रमाण के लिए, रनटाइम रजिस्ट्रेशन की जांच करें, फिर
`openclaw sessions` या Gateway सेशन/status सतहों का उपयोग करें। प्रदाता पेलोड डीबग करते समय,
Gateway को `--raw-stream` और
`--raw-stream-path <path>` के साथ शुरू करें; ये फ्लैग कच्चे मॉडल स्ट्रीम इवेंट्स को jsonl
फ़ाइल में लिखते हैं।

## टूल कॉल नीति

`before_tool_call` प्राप्त करता है:

- `event.toolName`
- `event.params`
- वैकल्पिक `event.toolKind` और `event.toolInputKind`, ऐसे टूल के लिए होस्ट-प्रामाणिक
  डिस्क्रिमिनेटर जो जानबूझकर नाम साझा करते हैं; उदाहरण के लिए, बाहरी
  कोड-मोड `exec` कॉल `toolKind: "code_mode_exec"` का उपयोग करते हैं और
  इनपुट भाषा ज्ञात होने पर `toolInputKind: "javascript" | "typescript"` शामिल करते हैं
- वैकल्पिक `event.derivedPaths`, जिसमें `apply_patch` जैसे प्रसिद्ध टूल एनवेलप के लिए
  सर्वोत्तम-प्रयास होस्ट-व्युत्पन्न लक्ष्य पथ संकेत होते हैं; मौजूद होने पर,
  ये पथ अधूरे हो सकते हैं या टूल वास्तव में जिन चीजों को छुएगा उनका
  अत्यधिक अनुमान लगा सकते हैं (उदाहरण के लिए, विकृत या आंशिक इनपुट के साथ)
- वैकल्पिक `event.runId`
- वैकल्पिक `event.toolCallId`
- संदर्भ फ़ील्ड जैसे `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (Cron-चालित रन पर सेट), `ctx.toolKind`,
  `ctx.toolInputKind`, और डायग्नोस्टिक `ctx.trace`

यह लौटा सकता है:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

टाइप किए गए लाइफसाइकल हुक के लिए हुक गार्ड व्यवहार:

- `block: true` टर्मिनल है और कम-प्राथमिकता वाले हैंडलर छोड़ देता है।
- `block: false` को कोई निर्णय नहीं माना जाता।
- `params` निष्पादन के लिए टूल पैरामीटर फिर से लिखता है।
- `requireApproval` एजेंट रन को रोकता है और Plugin
  स्वीकृतियों के माध्यम से उपयोगकर्ता से पूछता है। `/approve` कमांड exec और Plugin स्वीकृतियों, दोनों को स्वीकृत कर सकता है।
  Codex ऐप-सर्वर रिपोर्ट-मोड नेटिव `PreToolUse` रिले में, इसे मेल खाते
  ऐप-सर्वर स्वीकृति अनुरोध तक स्थगित किया जाता है; [Codex हार्नेस रनटाइम](/hi/plugins/codex-harness-runtime#hook-boundaries) देखें।
- किसी उच्च-प्राथमिकता हुक द्वारा स्वीकृति मांगे जाने के बाद भी कम-प्राथमिकता वाला `block: true`
  ब्लॉक कर सकता है।
- `onResolution` को हल किया गया स्वीकृति निर्णय मिलता है - `allow-once`,
  `allow-always`, `deny`, `timeout`, या `cancelled`।

स्वीकृति रूटिंग, निर्णय व्यवहार, और वैकल्पिक टूल या exec स्वीकृतियों के बजाय
`requireApproval` कब उपयोग करना है, इसके लिए [Plugin अनुमति अनुरोध](/hi/plugins/plugin-permission-requests) देखें।

जिन Plugin को होस्ट-स्तर की नीति चाहिए, वे
`api.registerTrustedToolPolicy(...)` के साथ विश्वसनीय टूल नीतियां रजिस्टर कर सकते हैं। ये सामान्य
`before_tool_call` हुक से पहले और सामान्य हुक निर्णयों से पहले चलते हैं। बंडल की गई विश्वसनीय
नीतियां पहले चलती हैं; इंस्टॉल किए गए-Plugin की विश्वसनीय नीतियां Plugin-लोड
क्रम में आगे चलती हैं; सामान्य `before_tool_call` हुक उनके बाद चलते हैं। बंडल किए गए Plugin
मौजूदा विश्वसनीय-नीति पथ बनाए रखते हैं। इंस्टॉल किए गए Plugin स्पष्ट रूप से सक्षम होने चाहिए
और `contracts.trustedToolPolicies` में हर नीति id घोषित करनी होगी; अघोषित ids
रजिस्ट्रेशन से पहले अस्वीकार कर दी जाती हैं। नीति ids रजिस्टर करने वाले
Plugin के दायरे में होती हैं, इसलिए अलग-अलग Plugin वही स्थानीय id फिर से उपयोग कर सकते हैं। इस स्तर का उपयोग केवल
होस्ट-विश्वसनीय गेट जैसे वर्कस्पेस नीति, बजट प्रवर्तन, या
आरक्षित वर्कफ़्लो सुरक्षा के लिए करें।

### Exec पर्यावरण हुक

`resolve_exec_env` Plugin को बेस exec पर्यावरण बनने के बाद और
कमांड चलने से पहले `exec` टूल इनवोकेशन में पर्यावरण वेरिएबल योगदान करने देता है।
यह प्राप्त करता है:

- `event.sessionKey`
- `event.toolName`, वर्तमान में हमेशा `"exec"`
- `event.host`, `"gateway"`, `"sandbox"`, या `"node"` में से एक
- संदर्भ फ़ील्ड जैसे `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider`, और `ctx.channelId`

exec पर्यावरण में मिलाने के लिए `Record<string, string>` लौटाएं। हैंडलर
प्राथमिकता क्रम में चलते हैं, और बाद के हुक परिणाम उसी कुंजी के लिए पहले के हुक परिणामों को ओवरराइड करते हैं।

Hook आउटपुट को मर्ज करने से पहले होस्ट exec environment कुंजी नीति से फ़िल्टर किया जाता है। अमान्य कुंजियां, `PATH`, और खतरनाक होस्ट override कुंजियां जैसे `LD_*`, `DYLD_*`, `NODE_OPTIONS`, proxy variables, और TLS override variables हटा दिए जाते हैं। फ़िल्टर किया गया plugin env gateway approval/audit मेटाडेटा में शामिल किया जाता है और node-host execution requests को आगे भेजा जाता है।

### टूल परिणाम persistence

टूल परिणामों में UI rendering, diagnostics, media routing, या plugin-owned मेटाडेटा के लिए structured `details` शामिल हो सकते हैं। `details` को runtime मेटाडेटा मानें, prompt content नहीं:

- OpenClaw provider replay और compaction input से पहले `toolResult.details` हटा देता है
  ताकि मेटाडेटा model context न बन जाए।
- Persisted session entries केवल bounded `details` रखती हैं। बहुत बड़े details को
  compact summary और `persistedDetailsTruncated: true` से बदल दिया जाता है।
- `tool_result_persist` और `before_message_write` अंतिम persistence cap से पहले चलते हैं।
  Hooks को फिर भी लौटाए गए `details` छोटे रखने चाहिए और prompt-relevant text को केवल
  `details` में रखने से बचना चाहिए; model-visible tool output को `content` में रखें।

## Prompt और model hooks

नए plugins के लिए phase-specific hooks का उपयोग करें:

- `before_model_resolve`: केवल वर्तमान prompt और attachment
  मेटाडेटा प्राप्त करता है। `providerOverride` या `modelOverride` लौटाएं।
- `agent_turn_prepare`: वर्तमान prompt, prepared session messages,
  और इस session के लिए drained की गई any exactly-once queued injections प्राप्त करता है। `prependContext` या `appendContext` लौटाएं।
- `before_prompt_build`: वर्तमान prompt और session messages प्राप्त करता है।
  `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, या `appendSystemContext` लौटाएं।
- `heartbeat_prompt_contribution`: केवल heartbeat turns के लिए चलता है और
  `prependContext` या `appendContext` लौटाता है। यह उन background monitors के लिए है
  जिन्हें user-initiated turns बदले बिना current state summarize करनी होती है।

`before_agent_start` compatibility के लिए बना हुआ है। ऊपर दिए गए explicit hooks को प्राथमिकता दें
ताकि आपका plugin किसी legacy combined phase पर निर्भर न रहे।

`before_agent_run` prompt construction के बाद और किसी भी model input से पहले चलता है,
जिसमें prompt-local image loading और `llm_input` observation शामिल हैं। यह
वर्तमान user input को `prompt` के रूप में, loaded session history को `messages`
में, और active system prompt प्राप्त करता है। Model द्वारा prompt पढ़ने से पहले run रोकने के लिए
`{ outcome: "block", reason, message? }` लौटाएं। `reason` internal है;
`message` user-facing replacement है। केवल समर्थित outcomes
`pass` और `block` हैं; unsupported decision shapes fail closed होते हैं।

जब कोई run blocked होता है, OpenClaw केवल replacement text को
`message.content` में और non-sensitive block मेटाडेटा जैसे blocking plugin
id और timestamp को store करता है। मूल user text transcript या future
context में retained नहीं किया जाता। Internal block reasons sensitive माने जाते हैं और
transcript, history, broadcast, log, और diagnostics payloads से बाहर रखे जाते हैं। Observability
को sanitized fields जैसे blocker id, outcome, timestamp, या safe
category का उपयोग करना चाहिए।

`before_agent_start` और `agent_end` में `event.runId` शामिल होता है जब OpenClaw
active run की पहचान कर सकता है। वही value `ctx.runId` पर भी उपलब्ध होती है।
Cron-driven runs `ctx.jobId` (originating cron job id) भी expose करते हैं ताकि
plugin hooks metrics, side effects, या state को किसी specific scheduled
job तक scope कर सकें।

Channel-originated runs के लिए, `ctx.channel` और `ctx.messageProvider`
provider surface की पहचान करते हैं जैसे `discord` या `telegram`, जबकि `ctx.channelId`
conversation target identifier होता है जब OpenClaw उसे session
key या delivery metadata से derive कर सकता है।

जब sender identity उपलब्ध हो, agent hook contexts में ये भी शामिल होते हैं:

- `ctx.senderId` — channel-scoped sender ID (जैसे Feishu `open_id`, Discord
  user ID)। तब populated होता है जब run known sender metadata वाले user message से originate होता है।
- `ctx.chatId` — transport-native conversation identifier (जैसे Feishu
  `chat_id`, Telegram `chat_id`)। तब populated होता है जब originating channel
  native conversation ID प्रदान करता है।
- `ctx.channelContext.sender.id` — `ctx.senderId` जैसा ही sender ID, ऐसे
  channel-owned object के अंतर्गत जिसे plugins channel-specific fields से extend कर सकते हैं।
- `ctx.channelContext.chat.id` — `ctx.chatId` जैसा ही conversation ID, ऐसे
  channel-owned object के अंतर्गत जिसे plugins channel-specific fields से extend कर सकते हैं।

Core केवल nested `id` fields define करता है। Channel plugins जो richer
sender या chat metadata inbound helper के माध्यम से pass करते हैं, वे
`openclaw/plugin-sdk/channel-inbound` से
`PluginHookChannelSenderContext` या `PluginHookChannelChatContext` augment कर सकते हैं:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Channel plugins उन fields को inbound SDK helper के माध्यम से pass करते हैं:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

ये fields optional हैं और system-originated runs (heartbeat,
cron, exec-event) के लिए absent होते हैं।

`ctx.senderExternalId` पुराने plugins के लिए deprecated source-compatibility field के रूप में बना हुआ है।
Core इसे populate नहीं करता; नई channel-specific sender identities
module augmentation के माध्यम से `ctx.channelContext.sender` के अंतर्गत होनी चाहिए।

`agent_end` एक observation hook है। Gateway और persistent harness paths इसे
turn के बाद fire-and-forget चलाते हैं, जबकि short-lived one-shot CLI paths
process cleanup से पहले hook promise का wait करते हैं ताकि trusted plugins terminal
observability flush कर सकें या state capture कर सकें। Hook runner 30 second timeout apply करता है ताकि
wedged plugin या embedding endpoint hook promise को हमेशा pending न छोड़ सके।
Timeout log किया जाता है और OpenClaw जारी रहता है; यह
plugin-owned network work को cancel नहीं करता जब तक plugin अपना abort signal भी use न करे।

Provider-call telemetry के लिए `model_call_started` और `model_call_ended` का उपयोग करें
जिसे raw prompts, history, responses, headers, request
bodies, या provider request IDs नहीं मिलने चाहिए। इन hooks में stable metadata शामिल होता है जैसे
`runId`, `callId`, `provider`, `model`, optional `api`/`transport`, terminal
`durationMs`/`outcome`, और `upstreamRequestIdHash` जब OpenClaw bounded provider request-id hash derive कर सकता है।
जब runtime ने context-window metadata resolve कर लिया हो, hook event और context में
`contextTokenBudget` भी शामिल होता है, model/config/agent caps के बाद effective token budget,
साथ ही `contextWindowSource` और `contextWindowReferenceTokens` जब कोई lower cap
apply किया गया हो।

`before_agent_finalize` केवल तब चलता है जब कोई harness natural
final assistant answer accept करने वाला हो। यह `/stop` cancellation path नहीं है और
user द्वारा turn abort करने पर नहीं चलता। Finalization से पहले harness से one more model pass मांगने के लिए
`{ action: "revise", reason }` लौटाएं, finalization force करने के लिए `{ action:
"finalize", reason? }` लौटाएं, या जारी रखने के लिए result omit करें।
Codex native `Stop` hooks इस hook में OpenClaw
`before_agent_finalize` decisions के रूप में relay किए जाते हैं।

`action: "revise"` लौटाते समय, plugins extra model pass को bounded और replay-safe बनाने के लिए
`retry` metadata शामिल कर सकते हैं:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` harness को भेजे गए revision reason में append किया जाता है।
`idempotencyKey` host को equivalent finalize decisions में same plugin request के लिए retries count करने देता है,
और `maxAttempts` यह cap करता है कि natural final answer के साथ जारी रखने से पहले host कितने extra passes allow करेगा।

Non-bundled plugins जिन्हें raw conversation hooks (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, या `before_agent_run`) चाहिए, उन्हें set करना होगा:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Prompt-mutating hooks और durable next-turn injections को प्रति plugin
`plugins.entries.<id>.hooks.allowPromptInjection=false` से disable किया जा सकता है।

### Session extensions और next-turn injections

Workflow plugins `api.registerSessionExtension(...)` के साथ छोटा JSON-compatible session state
persist कर सकते हैं और Gateway
`sessions.pluginPatch` method के माध्यम से उसे update कर सकते हैं। Session rows registered extension state को
`pluginExtensions` के माध्यम से project करती हैं, जिससे Control UI और अन्य clients
plugin internals जाने बिना plugin-owned status render कर सकते हैं।

जब किसी plugin को durable context को अगले model turn तक exactly once पहुंचाना हो, तो
`api.enqueueNextTurnInjection(...)` का उपयोग करें। OpenClaw prompt hooks से पहले queued injections drain करता है,
expired injections drop करता है, और प्रति plugin `idempotencyKey` से deduplicate करता है।
यह approval resumes, policy summaries,
background monitor deltas, और command continuations के लिए सही seam है जिन्हें
अगले turn पर model को visible होना चाहिए लेकिन permanent system prompt text नहीं बनना चाहिए।

Cleanup semantics contract का हिस्सा हैं। Session extension cleanup और
runtime lifecycle cleanup callbacks को `reset`, `delete`, `disable`, या
`restart` प्राप्त होता है। Host reset/delete/disable के लिए owning plugin की persistent session extension
state और pending next-turn injections हटाता है; restart durable session state रखता है
जबकि cleanup callbacks plugins को पुराने runtime generation के लिए scheduler
jobs, run context, और अन्य out-of-band resources release करने देते हैं।

## Message hooks

Channel-level routing और delivery policy के लिए message hooks का उपयोग करें:

- `message_received`: inbound content, sender, `threadId`, `messageId`,
  `senderId`, optional run/session correlation, और metadata observe करें।
- `message_sending`: `content` rewrite करें या `{ cancel: true }` लौटाएं।
- `reply_payload_sending`: normalized `ReplyPayload` objects (जिसमें
  `presentation`, `delivery`, media refs, और text शामिल हैं) rewrite करें या `{ cancel: true }` लौटाएं।
- `message_sent`: final success या failure observe करें।

Audio-only TTS replies के लिए, `content` में hidden spoken transcript शामिल हो सकता है
भले ही channel payload में visible text/caption न हो। उस
`content` को rewrite करने से केवल hook-visible transcript update होता है; यह
media caption के रूप में render नहीं होता।

`reply_payload_sending` events में `usageState`, एक best-effort live
per-turn model/usage/context snapshot, शामिल हो सकता है। Durable delivery, recovered replay, और
exact run correlation के बिना replies इसे omit करते हैं।

Message hook contexts उपलब्ध होने पर stable correlation fields expose करते हैं:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, और `ctx.callDepth`। Inbound
और `before_dispatch` contexts reply metadata भी expose करते हैं जब channel के पास
visibility-filtered quoted message data हो: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender`, और `replyToIsQuote`। Legacy metadata पढ़ने से पहले
इन first-class fields को प्राथमिकता दें।

Channel-specific metadata का उपयोग करने से पहले typed `threadId` और `replyToId` fields को प्राथमिकता दें।

Decision rules:

- `cancel: true` के साथ `message_sending` अंतिम है.
- `cancel: false` के साथ `message_sending` को कोई निर्णय नहीं माना जाता.
- फिर से लिखा गया `content` कम-प्राथमिकता वाले hooks तक जारी रहता है जब तक कोई बाद का hook
  वितरण रद्द नहीं कर देता.
- `reply_payload_sending` payload normalization के बाद और channel
  delivery से पहले चलता है, जिसमें originating channel पर वापस route किए गए replies भी शामिल हैं. Handlers
  क्रम से चलते हैं और प्रत्येक handler उच्च-प्राथमिकता वाले handlers द्वारा बनाए गए नवीनतम payload को देखता है.
- `reply_payload_sending` payloads runtime trust markers जैसे
  `trustedLocalMedia` को expose नहीं करते; plugins payload shape edit कर सकते हैं लेकिन local
  media trust grant नहीं कर सकते.
- `message_sending` cancellation के साथ `cancelReason` और सीमित `metadata`
  लौटा सकता है. नए message lifecycle APIs इसे reason
  `cancelled_by_message_sending_hook` के साथ suppressed delivery outcome के रूप में expose करते हैं; legacy direct
  delivery compatibility के लिए empty result array लौटाता रहता है.
- `message_sent` केवल observation के लिए है. Handler failures log किए जाते हैं और
  delivery result नहीं बदलते.

## Install hooks

operator-owned allow/block decisions के लिए `security.installPolicy` का उपयोग करें. वह
policy OpenClaw config से चलती है, CLI install और update paths को cover करती है, और enabled
लेकिन unavailable होने पर fail closed करती है.

`before_install` एक plugin-runtime lifecycle hook है. यह
`security.installPolicy` के बाद केवल उस OpenClaw process में चलता है जहां plugin hooks
पहले से loaded हैं, जैसे Gateway-backed install flows. यह
plugin-owned observations, warnings, और compatibility checks के लिए उपयोगी है, लेकिन यह
installs के लिए primary enterprise या host security boundary नहीं है. `builtinScan`
field compatibility के लिए event payload में रहता है, लेकिन OpenClaw अब
built-in install-time dangerous-code blocking नहीं चलाता, इसलिए यह empty `ok`
result है. इस process में install रोकने के लिए additional findings या `{ block: true, blockReason }` return करें.

`block: true` terminal है. `block: false` को no decision माना जाता है.
Handler failures install को fail-closed block करते हैं.

## Gateway lifecycle

उन plugin services के लिए `gateway_start` का उपयोग करें जिन्हें Gateway-owned state चाहिए. 
context cron inspection और updates के लिए `ctx.config`, `ctx.workspaceDir`, और `ctx.getCron?.()` expose करता है. long-running
resources clean up करने के लिए `gateway_stop` का उपयोग करें.

plugin-owned runtime services के लिए internal `gateway:startup` hook पर निर्भर न रहें.

`cron_changed` gateway-owned cron lifecycle events के लिए typed
event payload के साथ fire होता है, जिसमें `added`, `updated`, `removed`, `started`, `finished`,
और `scheduled` reasons cover होते हैं. event में एक `PluginHookGatewayCronJob`
snapshot होता है (जिसमें मौजूद होने पर `state.nextRunAtMs`, `state.lastRunStatus`, और
`state.lastError` शामिल हैं) साथ ही `PluginHookGatewayCronDeliveryStatus`
`not-requested` | `delivered` | `not-delivered` | `unknown` होता है. Removed
events में अभी भी deleted job snapshot होता है ताकि external schedulers
state reconcile कर सकें. external wake schedulers sync करते समय runtime
context से `ctx.getCron?.()` और `ctx.config` का उपयोग करें, और due checks तथा execution के लिए OpenClaw को
source of truth बनाए रखें.

## आगामी deprecations

कुछ hook-adjacent surfaces deprecated हैं लेकिन अभी भी supported हैं. अगले major release से
पहले migrate करें:

- **Plaintext channel envelopes** `inbound_claim` और `message_received`
  handlers में. flat envelope text parse करने के बजाय `BodyForAgent` और structured user-context blocks
  पढ़ें. देखें
  [Plaintext channel envelopes → BodyForAgent](/hi/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** compatibility के लिए रहता है. नए plugins को combined
  phase के बजाय `before_model_resolve` और `before_prompt_build` का उपयोग करना चाहिए.
- **`subagent_spawning`** पुराने plugins के साथ compatibility के लिए रहता है, लेकिन
  नए plugins को इससे thread routing return नहीं करनी चाहिए. Core
  `subagent_spawned` fire होने से पहले channel session-binding adapters के माध्यम से
  `thread: true` subagent bindings prepare करता है.
- **`deactivate`** 2026-08-16 के बाद तक deprecated cleanup compatibility alias के रूप में रहता है. नए plugins को `gateway_stop` का उपयोग करना चाहिए.
- **`onResolution` in `before_tool_call`** अब free-form `string` के बजाय typed
  `PluginApprovalResolution` union (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) का उपयोग करता है.

पूरी सूची के लिए - memory capability registration, provider thinking
profile, external auth providers, provider discovery types, task runtime
accessors, और `command-auth` → `command-status` rename - देखें
[Plugin SDK migration → Active deprecations](/hi/plugins/sdk-migration#active-deprecations).

## संबंधित

- [Plugin SDK migration](/hi/plugins/sdk-migration) - active deprecations और removal timeline
- [Building plugins](/hi/plugins/building-plugins)
- [Plugin SDK overview](/hi/plugins/sdk-overview)
- [Plugin entry points](/hi/plugins/sdk-entrypoints)
- [Internal hooks](/hi/automation/hooks)
- [Plugin architecture internals](/hi/plugins/architecture-internals)
