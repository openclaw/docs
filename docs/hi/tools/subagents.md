---
read_when:
    - आप एजेंट के माध्यम से पृष्ठभूमि या समानांतर कार्य चाहते हैं
    - आप sessions_spawn या उप-एजेंट टूल नीति बदल रहे हैं
    - आप थ्रेड-बाउंड सबएजेंट सेशन लागू कर रहे हैं या समस्या-निवारण कर रहे हैं
sidebarTitle: Sub-agents
summary: अलग-थलग पृष्ठभूमि agent रन शुरू करें जो परिणामों की घोषणा अनुरोधकर्ता chat में वापस करते हैं
title: उप-एजेंट
x-i18n:
    generated_at: "2026-06-29T00:24:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

उप-एजेंट किसी मौजूदा एजेंट रन से शुरू किए गए पृष्ठभूमि एजेंट रन होते हैं।
वे अपने स्वयं के सत्र (`agent:<agentId>:subagent:<uuid>`) में चलते हैं और,
पूरा होने पर, अपना परिणाम अनुरोधकर्ता चैट चैनल पर वापस **घोषित** करते हैं।
हर उप-एजेंट रन को एक
[पृष्ठभूमि कार्य](/hi/automation/tasks) के रूप में ट्रैक किया जाता है।

प्राथमिक लक्ष्य:

- मुख्य रन को ब्लॉक किए बिना "शोध / लंबा कार्य / धीमा टूल" काम को समानांतर करना।
- उप-एजेंट को डिफ़ॉल्ट रूप से अलग रखना (सत्र पृथक्करण + वैकल्पिक सैंडबॉक्सिंग)।
- टूल सतह को दुरुपयोग के लिए कठिन रखना: उप-एजेंट को डिफ़ॉल्ट रूप से सत्र टूल नहीं मिलते।
- ऑर्केस्ट्रेटर पैटर्न के लिए कॉन्फ़िगर योग्य नेस्टिंग गहराई का समर्थन करना।

<Note>
**लागत नोट:** हर उप-एजेंट का अपना संदर्भ और टोकन उपयोग
डिफ़ॉल्ट रूप से होता है। भारी या दोहराए जाने वाले कार्यों के लिए, उप-एजेंट के लिए
सस्ता मॉडल सेट करें और अपने मुख्य एजेंट को उच्च-गुणवत्ता वाले मॉडल पर रखें।
`agents.defaults.subagents.model` या प्रति-एजेंट ओवरराइड के माध्यम से कॉन्फ़िगर करें। जब किसी चाइल्ड को
    वास्तव में अनुरोधकर्ता की मौजूदा ट्रांसक्रिप्ट चाहिए, तो एजेंट उस एक स्पॉन पर
    `context: "fork"` का अनुरोध कर सकता है। थ्रेड-बाउंड उप-एजेंट सत्र डिफ़ॉल्ट रूप से
    `context: "fork"` का उपयोग करते हैं क्योंकि वे मौजूदा बातचीत को एक
    फ़ॉलो-अप थ्रेड में शाखित करते हैं।
</Note>

## स्लैश कमांड

**मौजूदा सत्र** के लिए उप-एजेंट रन देखने के लिए `/subagents` का उपयोग करें:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` रन मेटाडेटा (स्थिति, टाइमस्टैम्प, सत्र id,
ट्रांसक्रिप्ट पथ, क्लीनअप) दिखाता है। सीमित,
सुरक्षा-फ़िल्टर किए गए रिकॉल व्यू के लिए `sessions_history` का उपयोग करें; जब आपको
कच्ची पूरी ट्रांसक्रिप्ट चाहिए तो डिस्क पर ट्रांसक्रिप्ट पथ देखें।

### थ्रेड बाइंडिंग नियंत्रण

ये कमांड उन चैनलों पर काम करते हैं जो स्थायी थ्रेड बाइंडिंग का समर्थन करते हैं।
नीचे [थ्रेड समर्थित चैनल](#thread-supporting-channels) देखें।

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### स्पॉन व्यवहार

एजेंट `sessions_spawn` के साथ पृष्ठभूमि उप-एजेंट शुरू करते हैं। उप-एजेंट पूर्णताएं
आंतरिक पैरेंट-सत्र इवेंट के रूप में लौटती हैं; पैरेंट/अनुरोधकर्ता एजेंट तय करता है
कि उपयोगकर्ता-दिखाई देने वाला अपडेट आवश्यक है या नहीं।

<AccordionGroup>
  <Accordion title="नॉन-ब्लॉकिंग, पुश-आधारित पूर्णता">
    - `sessions_spawn` नॉन-ब्लॉकिंग है; यह तुरंत रन id लौटाता है।
    - पूर्ण होने पर, उप-एजेंट पैरेंट/अनुरोधकर्ता सत्र को वापस रिपोर्ट करता है।
    - जिन एजेंट टर्न को चाइल्ड परिणामों की आवश्यकता है, उन्हें आवश्यक काम स्पॉन करने के बाद `sessions_yield` कॉल करना चाहिए। यह मौजूदा टर्न समाप्त करता है और पूर्णता इवेंट को अगले मॉडल-दिखाई देने वाले संदेश के रूप में आने देता है।
    - पूर्णता पुश-आधारित है। स्पॉन होने के बाद, केवल उसके समाप्त होने की प्रतीक्षा करने के लिए लूप में `/subagents list`, `sessions_list`, या `sessions_history` को पोल **न करें**; डीबगिंग दृश्यता के लिए स्थिति केवल मांग पर देखें।
    - चाइल्ड आउटपुट अनुरोधकर्ता एजेंट के संश्लेषण के लिए रिपोर्ट/साक्ष्य है। यह उपयोगकर्ता-लिखित निर्देश पाठ नहीं है और system, developer, या user नीति को ओवरराइड नहीं कर सकता।
    - पूर्ण होने पर, OpenClaw सर्वोत्तम प्रयास से उस उप-एजेंट सत्र द्वारा खोले गए ट्रैक किए गए ब्राउज़र टैब/प्रोसेस को बंद करता है, फिर घोषणा क्लीनअप फ्लो जारी रहता है।

  </Accordion>
  <Accordion title="पूर्णता डिलीवरी">
    - OpenClaw स्थिर आइडेम्पोटेंसी कुंजी वाले `agent` टर्न के माध्यम से पूर्णताएं अनुरोधकर्ता सत्र को वापस देता है।
    - यदि अनुरोधकर्ता रन अभी भी सक्रिय है, तो OpenClaw पहले दूसरा दृश्य उत्तर पथ शुरू करने के बजाय उस रन को जगाने/दिशा देने की कोशिश करता है।
    - यदि सक्रिय अनुरोधकर्ता को जगाया नहीं जा सकता, तो OpenClaw घोषणा को छोड़ने के बजाय उसी पूर्णता संदर्भ के साथ अनुरोधकर्ता-एजेंट हैंडऑफ़ पर वापस जाता है।
    - सफल पैरेंट हैंडऑफ़ उप-एजेंट डिलीवरी को पूरा करता है, भले ही पैरेंट तय करे कि कोई दृश्य उपयोगकर्ता अपडेट आवश्यक नहीं है।
    - नेटिव उप-एजेंट को संदेश टूल नहीं मिलता। वे पैरेंट/अनुरोधकर्ता एजेंट को सादा असिस्टेंट पाठ लौटाते हैं; मानव-दिखाई देने वाले उत्तर पैरेंट/अनुरोधकर्ता एजेंट की सामान्य डिलीवरी नीति के अधीन होते हैं।
    - यदि प्रत्यक्ष हैंडऑफ़ का उपयोग नहीं किया जा सकता, तो यह कतार रूटिंग पर वापस जाता है।
    - यदि कतार रूटिंग अभी भी उपलब्ध नहीं है, तो अंतिम त्याग से पहले घोषणा को छोटे एक्सपोनेंशियल बैकऑफ़ के साथ फिर से आज़माया जाता है।
    - पूर्णता डिलीवरी हल किए गए अनुरोधकर्ता रूट को बनाए रखती है: उपलब्ध होने पर थ्रेड-बाउंड या बातचीत-बाउंड पूर्णता रूट जीतते हैं; यदि पूर्णता स्रोत केवल चैनल देता है, तो OpenClaw अनुरोधकर्ता सत्र के हल किए गए रूट (`lastChannel` / `lastTo` / `lastAccountId`) से गायब लक्ष्य/खाता भरता है ताकि प्रत्यक्ष डिलीवरी फिर भी काम करे।

  </Accordion>
  <Accordion title="पूर्णता हैंडऑफ़ मेटाडेटा">
    अनुरोधकर्ता सत्र को पूर्णता हैंडऑफ़ रनटाइम-जनित
    आंतरिक संदर्भ है (उपयोगकर्ता-लिखित पाठ नहीं) और इसमें शामिल है:

    - `Result` — चाइल्ड से नवीनतम दृश्य `assistant` उत्तर पाठ। टूल/toolResult आउटपुट को चाइल्ड परिणामों में प्रमोट नहीं किया जाता। टर्मिनल विफल रन कैप्चर किए गए उत्तर पाठ का पुन: उपयोग नहीं करते।
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - संक्षिप्त रनटाइम/टोकन आँकड़े।
    - अनुरोधकर्ता एजेंट को यह बताने वाला समीक्षा निर्देश कि मूल कार्य पूरा हुआ है या नहीं, यह तय करने से पहले परिणाम सत्यापित करें।
    - फ़ॉलो-अप मार्गदर्शन जो अनुरोधकर्ता एजेंट को चाइल्ड परिणाम अधिक कार्रवाई छोड़ने पर कार्य जारी रखने या फ़ॉलो-अप दर्ज करने को कहता है।
    - कोई और कार्रवाई न होने वाले पथ के लिए अंतिम-अपडेट निर्देश, सामान्य असिस्टेंट आवाज़ में लिखा गया, बिना कच्चे आंतरिक मेटाडेटा को आगे भेजे।

  </Accordion>
  <Accordion title="मोड और ACP रनटाइम">
    - `--model` और `--thinking` उस विशिष्ट रन के लिए डिफ़ॉल्ट को ओवरराइड करते हैं।
    - पूर्णता के बाद विवरण और आउटपुट देखने के लिए `info`/`log` का उपयोग करें।
    - स्थायी थ्रेड-बाउंड सत्रों के लिए, `thread: true` और `mode: "session"` के साथ `sessions_spawn` का उपयोग करें।
    - यदि अनुरोधकर्ता चैनल थ्रेड बाइंडिंग का समर्थन नहीं करता, तो असंभव थ्रेड-बाउंड संयोजनों को फिर से आज़माने के बजाय `mode: "run"` का उपयोग करें।
    - ACP हार्नेस सत्रों (Claude Code, Gemini CLI, OpenCode, या स्पष्ट Codex ACP/acpx) के लिए, जब टूल उस रनटाइम का विज्ञापन करता है तो `runtime: "acp"` के साथ `sessions_spawn` का उपयोग करें। पूर्णताओं या एजेंट-से-एजेंट लूप डीबग करते समय [ACP डिलीवरी मॉडल](/hi/tools/acp-agents#delivery-model) देखें। जब `codex` Plugin सक्षम हो, तो Codex चैट/थ्रेड नियंत्रण को ACP के बजाय `/codex ...` को प्राथमिकता देनी चाहिए, जब तक उपयोगकर्ता स्पष्ट रूप से ACP/acpx न मांगे।
    - OpenClaw `runtime: "acp"` को तब तक छिपाता है जब तक ACP सक्षम न हो, अनुरोधकर्ता सैंडबॉक्स्ड न हो, और `acpx` जैसा बैकएंड Plugin लोड न हो। `runtime: "acp"` बाहरी ACP हार्नेस id, या `runtime.type="acp"` वाली `agents.list[]` एंट्री की अपेक्षा करता है; `agents_list` से सामान्य OpenClaw कॉन्फ़िग एजेंटों के लिए डिफ़ॉल्ट उप-एजेंट रनटाइम का उपयोग करें।

  </Accordion>
</AccordionGroup>

## संदर्भ मोड

नेटिव उप-एजेंट अलग-थलग शुरू होते हैं, जब तक कॉलर स्पष्ट रूप से
मौजूदा ट्रांसक्रिप्ट को फोर्क करने के लिए न कहे।

| मोड       | इसका उपयोग कब करें                                                                                                                         | व्यवहार                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | नया शोध, स्वतंत्र कार्यान्वयन, धीमा टूल काम, या कुछ भी जिसे कार्य पाठ में संक्षेप में बताया जा सकता है                           | साफ़ चाइल्ड ट्रांसक्रिप्ट बनाता है। यह डिफ़ॉल्ट है और टोकन उपयोग कम रखता है।  |
| `fork`     | ऐसा काम जो मौजूदा बातचीत, पूर्व टूल परिणामों, या अनुरोधकर्ता ट्रांसक्रिप्ट में पहले से मौजूद सूक्ष्म निर्देशों पर निर्भर करता है | चाइल्ड शुरू होने से पहले अनुरोधकर्ता ट्रांसक्रिप्ट को चाइल्ड सत्र में शाखित करता है। |

`fork` का संयम से उपयोग करें। यह संदर्भ-संवेदनशील डेलीगेशन के लिए है,
स्पष्ट कार्य प्रॉम्प्ट लिखने का विकल्प नहीं।

## टूल: `sessions_spawn`

वैश्विक `subagent` लेन पर `deliver: false` के साथ उप-एजेंट रन शुरू करता है,
फिर घोषणा चरण चलाता है और घोषणा उत्तर को अनुरोधकर्ता
चैट चैनल पर पोस्ट करता है।

उपलब्धता कॉलर की प्रभावी टूल नीति पर निर्भर करती है। `coding` और
`full` प्रोफ़ाइल डिफ़ॉल्ट रूप से `sessions_spawn` उजागर करती हैं। `messaging` प्रोफ़ाइल
ऐसा नहीं करती; जिन एजेंटों को काम डेलीगेट करना चाहिए उनके लिए `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` जोड़ें या `tools.profile: "coding"` का उपयोग करें।
प्रोफ़ाइल चरण के बाद भी चैनल/समूह, प्रदाता, सैंडबॉक्स, और प्रति-एजेंट allow/deny नीतियां
टूल हटा सकती हैं। प्रभावी टूल सूची की पुष्टि करने के लिए उसी
सत्र से `/tools` का उपयोग करें।

**डिफ़ॉल्ट:**

- **मॉडल:** नेटिव उप-एजेंट कॉलर से विरासत में लेते हैं, जब तक आप `agents.defaults.subagents.model` (या प्रति-एजेंट `agents.list[].subagents.model`) सेट नहीं करते। ACP रनटाइम स्पॉन मौजूद होने पर वही कॉन्फ़िगर किया गया उप-एजेंट मॉडल उपयोग करते हैं; अन्यथा ACP हार्नेस अपना डिफ़ॉल्ट रखता है। स्पष्ट `sessions_spawn.model` फिर भी जीतता है।
- **Thinking:** नेटिव उप-एजेंट कॉलर से विरासत में लेते हैं, जब तक आप `agents.defaults.subagents.thinking` (या प्रति-एजेंट `agents.list[].subagents.thinking`) सेट नहीं करते। ACP रनटाइम स्पॉन चयनित मॉडल के लिए `agents.defaults.models["provider/model"].params.thinking` भी लागू करते हैं। स्पष्ट `sessions_spawn.thinking` फिर भी जीतता है।
- **रन टाइमआउट:** सेट होने पर OpenClaw `agents.defaults.subagents.runTimeoutSeconds` का उपयोग करता है; अन्यथा यह `0` (कोई टाइमआउट नहीं) पर वापस जाता है। `sessions_spawn` प्रति-कॉल टाइमआउट ओवरराइड स्वीकार नहीं करता।
- **कार्य डिलीवरी:** नेटिव उप-एजेंट को उनका डेलीगेट किया गया कार्य उनके पहले दृश्य `[Subagent Task]` संदेश में मिलता है। उप-एजेंट system प्रॉम्प्ट रनटाइम नियम और रूटिंग संदर्भ रखता है, कार्य की छिपी हुई डुप्लिकेट प्रति नहीं।

स्वीकृत नेटिव उप-एजेंट स्पॉन में टूल परिणाम में हल किया गया चाइल्ड मॉडल मेटाडेटा
शामिल होता है: `resolvedModel` लागू मॉडल ref रखता है और
जब ref में कोई प्रदाता प्रीफ़िक्स हो तो `resolvedProvider` उसे रखता है।

### डेलीगेशन प्रॉम्प्ट मोड

`agents.defaults.subagents.delegationMode` केवल प्रॉम्प्ट मार्गदर्शन नियंत्रित करता है; यह टूल नीति नहीं बदलता या डेलीगेशन लागू नहीं करता।

- `suggest` (डिफ़ॉल्ट): बड़े या धीमे काम के लिए उप-एजेंट उपयोग करने का मानक प्रॉम्प्ट संकेत रखें।
- `prefer`: मुख्य एजेंट को प्रतिक्रियाशील रहने और सीधे उत्तर से अधिक विस्तृत किसी भी चीज़ को `sessions_spawn` के माध्यम से डेलीगेट करने को कहें।

प्रति-एजेंट ओवरराइड `agents.list[].subagents.delegationMode` का उपयोग करते हैं।

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### टूल पैरामीटर

<ParamField path="task" type="string" required>
  उप-एजेंट के लिए कार्य विवरण।
</ParamField>
<ParamField path="taskName" type="string">
  बाद के स्थिति आउटपुट में किसी विशिष्ट child की पहचान के लिए वैकल्पिक स्थिर हैंडल। इसे `[a-z][a-z0-9_-]{0,63}` से मेल खाना चाहिए और `last` या `all` जैसे आरक्षित targets नहीं हो सकते।
</ParamField>
<ParamField path="label" type="string">
  वैकल्पिक मानव-पठनीय लेबल।
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents` द्वारा अनुमति मिलने पर किसी अन्य configured agent id के अंतर्गत spawn करें।
</ParamField>
<ParamField path="cwd" type="string">
  child run के लिए वैकल्पिक task working directory। Native sub-agents अभी भी target agent workspace से bootstrap files लोड करते हैं; `cwd` केवल यह बदलता है कि runtime tools और CLI harnesses delegated work कहाँ करते हैं।
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` केवल external ACP harnesses (`claude`, `droid`, `gemini`, `opencode`, या स्पष्ट रूप से मांगे गए Codex ACP/acpx) और उन `agents.list[]` entries के लिए है जिनका `runtime.type` `acp` है।
</ParamField>
<ParamField path="resumeSessionId" type="string">
  केवल ACP। `runtime: "acp"` होने पर मौजूदा ACP harness session फिर शुरू करता है; native sub-agent spawns के लिए अनदेखा किया जाता है।
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  केवल ACP। `runtime: "acp"` होने पर ACP run output को parent session में stream करता है; native sub-agent spawns के लिए छोड़ दें।
</ParamField>
<ParamField path="model" type="string">
  sub-agent model override करें। अमान्य values छोड़ दी जाती हैं और sub-agent default model पर चलता है, tool result में warning के साथ।
</ParamField>
<ParamField path="thinking" type="string">
  sub-agent run के लिए thinking level override करें।
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true` होने पर, इस sub-agent session के लिए channel thread binding का अनुरोध करता है।
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  यदि `thread: true` है और `mode` छोड़ा गया है, तो default `session` बन जाता है। `mode: "session"` के लिए `thread: true` आवश्यक है।
  यदि requester channel के लिए thread binding उपलब्ध नहीं है, तो इसके बजाय `mode: "run"` का उपयोग करें।
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` announce के तुरंत बाद archive करता है (फिर भी rename के जरिए transcript रखता है)।
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` spawn को अस्वीकार करता है जब तक कि target child runtime sandboxed न हो।
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` requester की current transcript को child session में branch करता है। केवल native sub-agents। Thread-bound spawns default रूप से `fork` होते हैं; non-thread spawns default रूप से `isolated` होते हैं।
</ParamField>

<Warning>
`sessions_spawn` channel-delivery params (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`) स्वीकार **नहीं** करता। Native sub-agents
अपना latest assistant turn requester को वापस report करते हैं; external delivery
parent/requester agent के पास ही रहती है।
</Warning>

### Task names और targeting

`taskName` orchestration के लिए model-facing handle है, session key नहीं।
जब coordinator को बाद में उस child को inspect करने की आवश्यकता हो सकती है, तो stable child names जैसे `review_subagents`,
`linux_validation`, या `docs_update` के लिए इसका उपयोग करें।

Target resolution exact `taskName` matches और unambiguous
prefixes स्वीकार करता है। Matching उसी active/recent target window तक scoped है जिसका उपयोग
numbered `/subagents` targets करते हैं, इसलिए stale completed child
reused handle को ambiguous नहीं बनाता। यदि दो active या recent children समान
`taskName` साझा करते हैं, तो target ambiguous है; इसके बजाय list index, session key, या
run id का उपयोग करें।

Reserved targets `last` और `all` valid `taskName` values नहीं हैं
क्योंकि उनके पास पहले से control meanings हैं।

## Tool: `sessions_yield`

Current model turn समाप्त करता है और runtime events, मुख्य रूप से
sub-agent completion events, के अगले message के रूप में आने की प्रतीक्षा करता है। Required child work spawn करने के बाद इसका उपयोग करें जब requester उन completions के आने तक final
answer produce नहीं कर सकता।

`sessions_yield` waiting primitive है। Child completion detect करने के लिए इसे `subagents`, `sessions_list`, `sessions_history`, shell
`sleep`, या process polling पर polling
loops से replace न करें।

`sessions_yield` का उपयोग केवल तब करें जब session की effective tool list में
यह शामिल हो। कुछ minimal या custom tool profiles `sessions_yield` expose किए बिना `sessions_spawn` और
`subagents` expose कर सकते हैं; उस स्थिति में, completion की प्रतीक्षा करने के लिए polling loop invent न करें।

जब active children मौजूद होते हैं, OpenClaw normal turns में एक compact runtime-generated
`Active Subagents` prompt block inject करता है ताकि requester current child sessions, run ids, statuses, labels, tasks, और
`taskName` aliases को polling के बिना देख सके। उस
block में task और label fields data के रूप में quoted होते हैं, instructions के रूप में नहीं, क्योंकि वे
user/model-provided spawn arguments से originate हो सकते हैं।

## Tool: `subagents`

requester session के owned spawned sub-agent runs list करता है। यह current requester तक scoped
है; child केवल अपने controlled children देख सकता है।

On-demand status और debugging के लिए `subagents` का उपयोग करें। Completion events की प्रतीक्षा करने के लिए `sessions_yield` का उपयोग करें।

## Thread-bound sessions

जब किसी channel के लिए thread bindings enabled होते हैं, तो sub-agent thread से bound रह सकता है ताकि उस thread में follow-up user messages उसी sub-agent session तक route होते रहें।

### Thread supporting channels

Session-binding adapter वाला कोई भी channel persistent
thread-bound subagent sessions (`sessions_spawn` with `thread: true`) support कर सकता है।
Bundled adapters में वर्तमान में Discord threads, Matrix threads,
Telegram forum topics, और Feishu के लिए current-conversation bindings शामिल हैं।
Enablement, timeouts, और `spawnSessions` के लिए per-channel `threadBindings` config keys का उपयोग करें।

### Quick flow

<Steps>
  <Step title="Spawn">
    `sessions_spawn` with `thread: true` (और वैकल्पिक रूप से `mode: "session"`)।
  </Step>
  <Step title="Bind">
    OpenClaw active channel में उस session target के लिए thread बनाता है या bind करता है।
  </Step>
  <Step title="Route follow-ups">
    उस thread में replies और follow-up messages bound session तक route होते हैं।
  </Step>
  <Step title="Inspect timeouts">
    inactivity auto-unfocus inspect/update करने के लिए `/session idle` और
    hard cap control करने के लिए `/session max-age` का उपयोग करें।
  </Step>
  <Step title="Detach">
    manually detach करने के लिए `/unfocus` का उपयोग करें।
  </Step>
</Steps>

### Manual controls

| Command            | Effect                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | current thread को sub-agent/session target से bind करें (या एक बनाएं) |
| `/unfocus`         | current bound thread के लिए binding हटाएं                       |
| `/agents`          | active runs और binding state (`thread:<id>` या `unbound`) list करें       |
| `/session idle`    | idle auto-unfocus inspect/update करें (केवल focused bound threads)         |
| `/session max-age` | hard cap inspect/update करें (केवल focused bound threads)                  |

### Config switches

- **Global default:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Channel override और spawn auto-bind keys** adapter-specific हैं। ऊपर [Thread supporting channels](#thread-supporting-channels) देखें।

Current adapter details के लिए [Configuration reference](/hi/gateway/configuration-reference) और
[Slash commands](/hi/tools/slash-commands) देखें।

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  configured agent ids की list जिन्हें explicit `agentId` (`["*"]` किसी भी configured target की अनुमति देता है) के जरिए target किया जा सकता है। Default: केवल requester agent। यदि आप list set करते हैं और फिर भी requester को `agentId` के साथ खुद को spawn करने देना चाहते हैं, तो list में requester id शामिल करें।
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Default configured target-agent allowlist, जिसका उपयोग तब होता है जब requester agent अपना `subagents.allowAgents` set नहीं करता।
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  उन `sessions_spawn` calls को block करें जो `agentId` छोड़ती हैं (explicit profile selection force करता है)। Per-agent override: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  gateway `agent` announce delivery attempts के लिए per-call timeout। Values positive integer milliseconds हैं और platform-safe timer maximum तक clamped होती हैं। Transient retries total announce wait को एक configured timeout से लंबा बना सकती हैं।
</ParamField>

यदि requester session sandboxed है, तो `sessions_spawn` उन targets को reject करता है
जो unsandboxed run करेंगे।

### Discovery

वर्तमान में `sessions_spawn` के लिए कौन से agent ids allowed हैं, यह देखने के लिए `agents_list` का उपयोग करें। Response में प्रत्येक listed agent का effective
model और embedded runtime metadata शामिल होता है ताकि callers OpenClaw, Codex
app-server, और अन्य configured native runtimes में अंतर कर सकें।

`allowAgents` entries को `agents.list[]` में configured agent ids की ओर point करना चाहिए।
`["*"]` का अर्थ है कोई भी configured target agent और requester। यदि agent config
delete हो गया है लेकिन उसका id `allowAgents` में रहता है, तो `sessions_spawn` उस id को reject करता है
और `agents_list` उसे omit करता है। Stale
allowlist entries साफ करने के लिए `openclaw doctor --fix` चलाएं, या जब target को defaults inherit करते हुए spawnable रहना चाहिए तो minimal `agents.list[]` entry जोड़ें।

### Auto-archive

- Sub-agent sessions `agents.defaults.subagents.archiveAfterMinutes` (default `60`) के बाद automatically archived हो जाते हैं।
- Archive `sessions.delete` का उपयोग करता है और transcript को `*.deleted.<timestamp>` (same folder) में rename करता है।
- `cleanup: "delete"` announce के तुरंत बाद archives करता है (फिर भी rename के जरिए transcript रखता है)।
- Auto-archive best-effort है; gateway restart होने पर pending timers खो जाते हैं।
- Configured run timeouts auto-archive **नहीं** करते; वे केवल run को रोकते हैं। Session auto-archive तक रहता है।
- Auto-archive depth-1 और depth-2 sessions पर समान रूप से लागू होता है।
- Browser cleanup archive cleanup से अलग है: tracked browser tabs/processes run finishes होने पर best-effort close किए जाते हैं, भले ही transcript/session record रखा गया हो।

## Nested sub-agents

Default रूप से, sub-agents अपने sub-agents spawn नहीं कर सकते
(`maxSpawnDepth: 1`)। Nesting का एक level enable करने के लिए `maxSpawnDepth: 2` set करें — **orchestrator pattern**: main → orchestrator sub-agent →
worker sub-sub-agents।

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Depth levels

| Depth | Session key shape                            | Role                                          | Can spawn?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Main agent                                    | हमेशा                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (depth 2 allowed होने पर orchestrator) | केवल यदि `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (leaf worker)                   | कभी नहीं                        |

### Announce chain

Results chain में ऊपर की ओर flow करते हैं:

1. गहराई-2 कार्यकर्ता समाप्त होता है → अपने पैरेंट (गहराई-1 संयोजक) को घोषणा करता है।
2. गहराई-1 संयोजक घोषणा प्राप्त करता है, परिणामों को संश्लेषित करता है, समाप्त होता है → मुख्य को घोषणा करता है।
3. मुख्य एजेंट घोषणा प्राप्त करता है और उपयोगकर्ता को वितरित करता है।

हर स्तर केवल अपने प्रत्यक्ष बच्चों से आई घोषणाएं देखता है।

<Note>
**संचालन मार्गदर्शन:** `sessions_list`,
`sessions_history`, `/subagents list`, या `exec` sleep कमांड के आसपास
पोल लूप बनाने के बजाय चाइल्ड कार्य एक बार शुरू करें और पूर्णता
इवेंट की प्रतीक्षा करें। `sessions_list` और `/subagents list`
चाइल्ड-सेशन संबंधों को लाइव कार्य पर केंद्रित रखते हैं — लाइव बच्चे
जुड़े रहते हैं, समाप्त बच्चे एक छोटी हालिया विंडो के लिए दिखाई देते
हैं, और बासी स्टोर-केवल चाइल्ड लिंक उनकी ताजगी विंडो के बाद अनदेखे
किए जाते हैं। यह पुराने `spawnedBy` / `parentSessionKey` मेटाडेटा को
रीस्टार्ट के बाद घोस्ट बच्चों को फिर से जीवित करने से रोकता है। अगर
आपके अंतिम उत्तर भेजने के बाद चाइल्ड पूर्णता इवेंट आता है, तो सही
अनुवर्ती कार्रवाई सटीक मौन टोकन `NO_REPLY` / `no_reply` है।
</Note>

### गहराई के अनुसार टूल नीति

- भूमिका और नियंत्रण दायरा स्पॉन समय पर सेशन मेटाडेटा में लिखे जाते हैं। इससे फ्लैट या बहाल सेशन कुंजियां गलती से संयोजक विशेषाधिकार फिर से प्राप्त नहीं करतीं।
- **गहराई 1 (संयोजक, जब `maxSpawnDepth >= 2`):** `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` प्राप्त करता है ताकि यह बच्चों को स्पॉन कर सके और उनकी स्थिति जांच सके। अन्य सेशन/सिस्टम टूल अस्वीकृत रहते हैं।
- **गहराई 1 (लीफ, जब `maxSpawnDepth == 1`):** कोई सेशन टूल नहीं (वर्तमान डिफ़ॉल्ट व्यवहार)।
- **गहराई 2 (लीफ कार्यकर्ता):** कोई सेशन टूल नहीं — `sessions_spawn` गहराई 2 पर हमेशा अस्वीकृत होता है। आगे बच्चे स्पॉन नहीं कर सकता।

### प्रति-एजेंट स्पॉन सीमा

हर एजेंट सेशन (किसी भी गहराई पर) के पास एक समय में अधिकतम
`maxChildrenPerAgent` (डिफ़ॉल्ट `5`) सक्रिय बच्चे हो सकते हैं। यह
एकल संयोजक से अनियंत्रित फैलाव रोकता है।

### कैस्केड स्टॉप

गहराई-1 संयोजक को रोकने से उसके सभी गहराई-2 बच्चे अपने-आप रुक जाते हैं:

- मुख्य चैट में `/stop` सभी गहराई-1 एजेंटों को रोकता है और उनके गहराई-2 बच्चों तक कैस्केड करता है।

## प्रमाणीकरण

उप-एजेंट प्रमाणीकरण **एजेंट id** से हल होता है, सेशन प्रकार से नहीं:

- उप-एजेंट सेशन कुंजी `agent:<agentId>:subagent:<uuid>` है।
- auth स्टोर उस एजेंट के `agentDir` से लोड होता है।
- मुख्य एजेंट की auth प्रोफ़ाइलें **fallback** के रूप में मर्ज की जाती हैं; टकराव पर एजेंट प्रोफ़ाइलें मुख्य प्रोफ़ाइलों को ओवरराइड करती हैं।

मर्ज योगात्मक है, इसलिए मुख्य प्रोफ़ाइलें fallback के रूप में हमेशा
उपलब्ध रहती हैं। प्रति एजेंट पूरी तरह अलग-थलग auth अभी समर्थित नहीं है।

## घोषणा

उप-एजेंट घोषणा चरण के माध्यम से वापस रिपोर्ट करते हैं:

- घोषणा चरण उप-एजेंट सेशन के अंदर चलता है (अनुरोधकर्ता सेशन में नहीं)।
- अगर उप-एजेंट ठीक `ANNOUNCE_SKIP` जवाब देता है, तो कुछ भी पोस्ट नहीं होता।
- अगर नवीनतम असिस्टेंट टेक्स्ट सटीक मौन टोकन `NO_REPLY` / `no_reply` है, तो घोषणा आउटपुट दबा दिया जाता है, भले ही पहले दृश्य प्रगति मौजूद रही हो।

डिलीवरी अनुरोधकर्ता की गहराई पर निर्भर करती है:

- शीर्ष-स्तरीय अनुरोधकर्ता सेशन बाहरी डिलीवरी (`deliver=true`) के साथ अनुवर्ती `agent` कॉल का उपयोग करते हैं।
- नेस्टेड अनुरोधकर्ता उप-एजेंट सेशन आंतरिक अनुवर्ती इंजेक्शन (`deliver=false`) प्राप्त करते हैं ताकि संयोजक चाइल्ड परिणामों को सेशन के अंदर संश्लेषित कर सके।
- अगर कोई नेस्टेड अनुरोधकर्ता उप-एजेंट सेशन चला गया है, तो उपलब्ध होने पर OpenClaw उस सेशन के अनुरोधकर्ता पर fallback करता है।

शीर्ष-स्तरीय अनुरोधकर्ता सेशन के लिए, पूर्णता-मोड प्रत्यक्ष डिलीवरी पहले
किसी भी बाउंड conversation/thread रूट और hook override को हल करती है,
फिर अनुरोधकर्ता सेशन के संग्रहीत रूट से गुम channel-target फ़ील्ड भरती
है। इससे पूर्णताएं सही चैट/topic पर रहती हैं, भले ही पूर्णता स्रोत केवल
चैनल की पहचान करता हो।

नेस्टेड पूर्णता निष्कर्ष बनाते समय चाइल्ड पूर्णता एकत्रीकरण वर्तमान
अनुरोधकर्ता रन तक सीमित रहता है, जिससे पुराने prior-run चाइल्ड आउटपुट
वर्तमान घोषणा में लीक नहीं होते। चैनल adapters पर उपलब्ध होने पर घोषणा
जवाब thread/topic routing संरक्षित रखते हैं।

### घोषणा संदर्भ

घोषणा संदर्भ को स्थिर आंतरिक इवेंट ब्लॉक में सामान्यीकृत किया जाता है:

| फ़ील्ड          | स्रोत                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| स्रोत         | `subagent` या `cron`                                                                                          |
| सेशन ids    | चाइल्ड सेशन कुंजी/id                                                                                          |
| प्रकार           | घोषणा प्रकार + कार्य लेबल                                                                                    |
| स्थिति         | runtime outcome (`success`, `error`, `timeout`, या `unknown`) से निकाली गई — मॉडल टेक्स्ट से अनुमानित **नहीं** |
| परिणाम सामग्री | बच्चे से नवीनतम दृश्य असिस्टेंट टेक्स्ट                                                                  |
| अनुवर्ती      | कब जवाब देना है बनाम मौन रहना है, इसका वर्णन करने वाला निर्देश                                                           |

टर्मिनल विफल रन कैप्चर किए गए जवाब टेक्स्ट को फिर चलाए बिना विफलता
स्थिति रिपोर्ट करते हैं। Tool/toolResult आउटपुट को चाइल्ड परिणाम टेक्स्ट
में पदोन्नत नहीं किया जाता।

### आँकड़ों की पंक्ति

घोषणा payloads अंत में आँकड़ों की पंक्ति शामिल करते हैं (wrap होने पर भी):

- Runtime (जैसे `runtime 5m12s`)।
- टोकन उपयोग (input/output/total)।
- मॉडल मूल्य निर्धारण कॉन्फ़िगर होने पर अनुमानित लागत (`models.providers.*.models[].cost`)।
- `sessionKey`, `sessionId`, और transcript path ताकि मुख्य एजेंट `sessions_history` के माध्यम से history ला सके या डिस्क पर फ़ाइल inspect कर सके।

आंतरिक मेटाडेटा केवल orchestration के लिए है; उपयोगकर्ता-सामना जवाबों
को सामान्य असिस्टेंट आवाज़ में फिर से लिखा जाना चाहिए।

### `sessions_history` को प्राथमिकता क्यों दें

`sessions_history` अधिक सुरक्षित orchestration पथ है:

- असिस्टेंट recall पहले सामान्यीकृत किया जाता है: thinking tags हटाए जाते हैं; `<relevant-memories>` / `<relevant_memories>` scaffolding हटाई जाती है; plain-text tool-call XML payload blocks (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) हटाए जाते हैं, उन truncated payloads सहित जो साफ़ तौर पर कभी बंद नहीं होते; downgraded tool-call/result scaffolding और historical-context markers हटाए जाते हैं; leaked model control tokens (`<|assistant|>`, अन्य ASCII `<|...|>`, full-width `<｜...｜>`) हटाए जाते हैं; malformed MiniMax tool-call XML हटाया जाता है।
- Credential/token-जैसा टेक्स्ट redact किया जाता है।
- लंबे blocks truncate किए जा सकते हैं।
- बहुत बड़े histories पुराने rows drop कर सकते हैं या oversized row को `[sessions_history omitted: message too large]` से बदल सकते हैं।
- पुराने transcript windows में पीछे की ओर page करने के लिए मौजूद होने पर `nextOffset` का उपयोग करें।
- Raw on-disk transcript inspection fallback है जब आपको पूर्ण byte-for-byte transcript चाहिए।

## टूल नीति

उप-एजेंट पहले पैरेंट या target agent के समान profile और tool-policy
pipeline का उपयोग करते हैं। उसके बाद, OpenClaw उप-एजेंट restriction
layer लागू करता है।

कोई restrictive `tools.profile` न होने पर, उप-एजेंट को **message tool,
session tools, और system tools को छोड़कर सभी tools** मिलते हैं:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` यहां भी bounded, sanitized recall view ही रहता है —
यह raw transcript dump नहीं है।

जब `maxSpawnDepth >= 2`, गहराई-1 संयोजक उप-एजेंट अतिरिक्त रूप से
`sessions_spawn`, `subagents`, `sessions_list`, और `sessions_history`
प्राप्त करते हैं ताकि वे अपने बच्चों को manage कर सकें।

### config के माध्यम से override

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` अंतिम allow-only filter है। यह पहले से
हल किए गए tool set को संकीर्ण कर सकता है, लेकिन `tools.profile` द्वारा
हटाए गए tool को **वापस जोड़** नहीं सकता। उदाहरण के लिए,
`tools.profile: "coding"` में `web_search`/`web_fetch` शामिल हैं लेकिन
`browser` tool नहीं। coding-profile उप-एजेंटों को browser automation
उपयोग करने देने के लिए, profile stage पर browser जोड़ें:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

जब केवल एक एजेंट को browser automation मिलना चाहिए, तो प्रति-एजेंट
`agents.list[].tools.alsoAllow: ["browser"]` का उपयोग करें।

## Concurrency

उप-एजेंट एक समर्पित in-process queue lane का उपयोग करते हैं:

- **Lane name:** `subagent`
- **Concurrency:** `agents.defaults.subagents.maxConcurrent` (डिफ़ॉल्ट `8`)

## Liveness और recovery

OpenClaw `endedAt` की अनुपस्थिति को इस बात का स्थायी प्रमाण नहीं मानता
कि कोई उप-एजेंट अभी भी जीवित है। stale-run window से पुराने unended runs
`/subagents list`, status summaries, descendant completion gating, और
per-session concurrency checks में active/pending के रूप में गिनना बंद कर
देते हैं।

Gateway restart के बाद, stale unended restored runs prune किए जाते हैं,
जब तक उनका child session `abortedLastRun: true` चिह्नित न हो। वे
restart-aborted child sessions sub-agent orphan recovery flow के माध्यम से
recoverable रहते हैं, जो aborted marker clear करने से पहले synthetic
resume message भेजता है।

Automatic restart recovery प्रति child session bounded है। अगर वही
sub-agent child rapid re-wedge window के अंदर बार-बार orphan recovery के
लिए स्वीकार किया जाता है, तो OpenClaw उस session पर recovery tombstone
persist करता है और बाद के restarts पर उसे auto-resume करना बंद कर देता
है। task record reconcile करने के लिए `openclaw tasks maintenance --apply`
चलाएं, या tombstoned sessions पर stale aborted recovery flags clear करने
के लिए `openclaw doctor --fix` चलाएं।

<Note>
अगर sub-agent spawn Gateway `PAIRING_REQUIRED` / `scope-upgrade` के साथ
विफल होता है, तो pairing state edit करने से पहले RPC caller जांचें।
Internal `sessions_spawn` coordination तब process में dispatch करता है जब
caller पहले से gateway request context के अंदर चल रहा होता है, इसलिए यह
loopback WebSocket नहीं खोलता और CLI के paired-device scope baseline पर
निर्भर नहीं करता। Gateway process के बाहर callers अभी भी direct loopback
shared-token/password auth पर `client.id: "gateway-client"` और
`client.mode: "backend"` के रूप में WebSocket fallback का उपयोग करते हैं।
Remote callers, explicit `deviceIdentity`, explicit device-token paths, और
browser/node clients को scope upgrades के लिए अभी भी normal device
approval चाहिए।
</Note>

## रोकना

- अनुरोधकर्ता चैट में `/stop` भेजने से अनुरोधकर्ता सेशन abort होता है और उससे spawned किसी भी सक्रिय sub-agent runs को रोकता है, nested बच्चों तक cascade करते हुए।

## सीमाएं

- उप-एजेंट घोषणा **best-effort** है। अगर gateway restart होता है, तो लंबित "announce back" कार्य खो जाता है।
- उप-एजेंट अभी भी वही gateway process resources साझा करते हैं; `maxConcurrent` को safety valve मानें।
- `sessions_spawn` हमेशा non-blocking है: यह तुरंत `{ status: "accepted", runId, childSessionKey }` लौटाता है।
- उप-एजेंट संदर्भ केवल `AGENTS.md` और `TOOLS.md` inject करता है (कोई `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, या `BOOTSTRAP.md` नहीं)। Codex-native subagents समान boundary का पालन करते हैं: `TOOLS.md` inherited Codex thread instructions में रहता है, जबकि parent-only persona, identity, और user files turn-scoped collaboration instructions के रूप में inject किए जाते हैं ताकि बच्चे उन्हें clone न करें।
- अधिकतम nesting depth 5 है (`maxSpawnDepth` range: 1–5)। अधिकांश use cases के लिए depth 2 recommended है।
- `maxChildrenPerAgent` प्रति session active children cap करता है (डिफ़ॉल्ट `5`, range `1–20`)।

## संबंधित

- [ACP एजेंट](/hi/tools/acp-agents)
- [एजेंट send](/hi/tools/agent-send)
- [Background tasks](/hi/automation/tasks)
- [Multi-agent sandbox tools](/hi/tools/multi-agent-sandbox-tools)
