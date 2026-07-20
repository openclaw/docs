---
read_when:
    - आप कई एजेंटों में कार्य वितरित करने के लिए Code Mode स्क्रिप्ट चाहते हैं
    - आपको संरचित चाइल्ड परिणामों, निर्णय गेटों या पहले पूर्ण होने वाली पाइपलाइनों की आवश्यकता है
    - आप `tools.swarm` सीमाएँ सक्षम या समायोजित कर रहे हैं
    - आप सत्र डैशबोर्ड में कलेक्टर चाइल्ड प्रक्रियाओं को देखना चाहते हैं
sidebarTitle: Swarm
summary: संरचित परिणामों, सीमित फ़ैन-आउट और लाइव प्रगति के साथ Code Mode स्क्रिप्ट से समवर्ती उप-एजेंटों का समन्वय करें
title: झुंड
x-i18n:
    generated_at: "2026-07-20T16:53:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00881c10c314eca667dd826584bfc83a4d848d8995e68905e4e53782d61c59cd
    source_path: tools/swarm.md
    workflow: 16
---

Swarm, [Code Mode](/hi/tools/code-mode) स्क्रिप्ट से कई उप-एजेंटों को ऑर्केस्ट्रेट करने का एक प्रयोगात्मक, ऑप्ट-इन तरीका है। काम को फैलाने, परिणाम एकत्र करने और निर्णय लेने के लिए सामान्य JavaScript या TypeScript नियंत्रण प्रवाह, जैसे `Promise.all`, `while` और `if`, का उपयोग करें।

इसमें कोई ग्राफ़ DSL और कोई अलग वर्कफ़्लो प्रारूप नहीं है। प्रोग्राम ही ऑर्केस्ट्रेशन है। Swarm उस प्रोग्राम में प्रतीक्षा-योग्य कलेक्टर चिल्ड्रन, संरचित परिणाम, सीमित समवर्ती निष्पादन और प्रगति रिपोर्टिंग जोड़ता है।

## Swarm सक्षम करें

अनुशंसित तरीका Control UI में **Settings → Labs → Swarm** है। टॉगल तुरंत प्रभावी होता है और आपके कॉन्फ़िगरेशन में `tools.swarm.enabled` लिखता है।

आप `openclaw.json` में भी सीधे Swarm सक्षम कर सकते हैं:

```json5
{
  tools: {
    swarm: {
      enabled: true,
      maxConcurrent: 8,
      maxChildrenPerGroup: 50,
      maxTotalPerGroup: 200,
      waitTimeoutSecondsMax: 600,
      defaultAgentId: "",
    },
  },
}
```

बूलियन शॉर्टहैंड अन्य सभी मानों को उनके डिफ़ॉल्ट पर रखते हुए सुविधा को सक्षम या अक्षम करता है:

```json5
{
  tools: {
    swarm: true,
  },
}
```

| फ़ील्ड                   | डिफ़ॉल्ट | विवरण                                                                                                                    |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`               | `false` | कलेक्टर-मोड स्पॉन विकल्पों, `agents_wait` और Code Mode `agents.*` गेस्ट API को उपलब्ध कराता है।                                   |
| `maxConcurrent`         | `8`     | एक Swarm समूह में समवर्ती रूप से चलने वाले कलेक्टर चिल्ड्रन की अधिकतम संख्या। अतिरिक्त स्वीकृत चिल्ड्रन FIFO क्रम में कतारबद्ध होते हैं।          |
| `maxChildrenPerGroup`   | `50`    | एक समूह में लाइव कलेक्टर चिल्ड्रन की अधिकतम संख्या।                                                                                  |
| `maxTotalPerGroup`      | `200`   | अपने जीवनकाल में किसी समूह द्वारा स्पॉन किए जा सकने वाले कलेक्टर चिल्ड्रन की अधिकतम संख्या। यह अनियंत्रित स्पॉन को रोकने वाला अंतिम सुरक्षा उपाय है।                            |
| `waitTimeoutSecondsMax` | `600`   | एक `agents_wait` कॉल द्वारा स्वीकार की जाने वाली अधिकतम टाइमआउट अवधि। कॉल का डिफ़ॉल्ट 30 सेकंड है।                                            |
| `defaultAgentId`        | `""`    | जब कोई स्पॉन `agentId` छोड़ देता है, तब उपयोग किया जाने वाला लक्ष्य एजेंट। रिक्त मान अनुरोध करने वाले एजेंट का उपयोग करता है। मौजूदा उप-एजेंट अनुमतिसूचियाँ लागू होती हैं। |

संख्यात्मक मान धनात्मक पूर्णांक होने चाहिए। OpenClaw
`maxConcurrent` को `1`–`1000`, `maxChildrenPerGroup` को `1`–`10000`,
`maxTotalPerGroup` को `1`–`100000` और `waitTimeoutSecondsMax` को
`1`–`86400` तक सीमित करता है।

आप किसी एक कॉन्फ़िगर किए गए एजेंट के लिए
`agents.list[].tools.swarm` से Swarm को ओवरराइड कर सकते हैं। प्रति-एजेंट ऑब्जेक्ट शीर्ष-स्तरीय
`tools.swarm` ऑब्जेक्ट के ऊपर मर्ज होता है।

## आवश्यकताएँ

`agents.run`, `phase` और `log` गेस्ट ग्लोबल्स के लिए Swarm और
OpenClaw Code Mode दोनों आवश्यक हैं:

```json5
{
  tools: {
    codeMode: true,
    swarm: true,
  },
}
```

Code Mode के पास `sessions_spawn` तक प्रभावी पहुँच भी होनी चाहिए। टूल प्रोफ़ाइल,
अनुमति/अस्वीकृति नीति, प्रदाता नियम और सैंडबॉक्स नीति उस टूल को हटा सकते हैं।
यदि कोई स्क्रिप्ट रिपोर्ट करती है कि `sessions_spawn`
अनुपलब्ध है, तो [Code Mode सक्रियण](/hi/tools/code-mode#activation) और
[उप-एजेंट](/hi/tools/subagents) देखें।

`defaultAgentId` और प्रति-रन `agentId` मानों में अनुरोधकर्ता की
`subagents.allowAgents` नीति द्वारा अनुमत कॉन्फ़िगर किए गए लक्ष्य का नाम होना चाहिए। OpenClaw किसी अन्य एजेंट पर फ़ॉलबैक करने के बजाय
अज्ञात या अस्वीकृत लक्ष्य को अस्वीकार करता है।

## Swarm स्क्रिप्ट लिखें

Swarm सक्षम होने पर Code Mode यह गेस्ट API उपलब्ध कराता है:

```typescript
type AgentRunOptions = {
  label?: string;
  model?: string;
  thinking?: string;
  fastMode?: boolean | "auto";
  agentId?: string;
  schema?: Record<string, unknown>;
  phase?: string;
};

agents.run(prompt: string, options?: AgentRunOptions & { schema?: undefined }): Promise<string>;
agents.run<T>(prompt: string, options: AgentRunOptions & { schema: Record<string, unknown> }): Promise<T>;
phase(title: string): void;
log(message: string): void;
```

`schema` के बिना, `agents.run()` चाइल्ड के अंतिम टेक्स्ट में रिज़ॉल्व होता है। JSON Schema के साथ, यह चाइल्ड के
`structured_output` टूल के माध्यम से सबमिट किए गए मान में रिज़ॉल्व होता है। विफल, समाप्त किया गया, टाइमआउट हुआ या स्कीमा-अमान्य चाइल्ड
`SwarmAgentError` के साथ प्रॉमिस अस्वीकार करता है। Code Mode के भीतर
`API.read("agents.d.ts")` से सटीक जनरेटेड घोषणाएँ और संक्षिप्त ऑर्केस्ट्रेशन मुहावरे पढ़ें।

डैशबोर्ड और साइडबार में पहचानने योग्य चाइल्ड नाम के लिए `label` का उपयोग करें। उस चाइल्ड के
शुरू होने से ठीक पहले कोई चरण प्रकाशित करने के लिए विकल्पों में `phase` का उपयोग करें, या जब कई चिल्ड्रन एक ही चरण से संबंधित हों तब
`phase()` कॉल करें।
`log()` एक छोटा प्रगति नोट प्रकाशित करता है। प्रगति कॉल फ़ायर-एंड-फ़ॉरगेट होती हैं;
UI अनुपलब्ध होने पर वे स्क्रिप्ट को विलंबित नहीं करतीं।

### संरचित परिणामों के साथ समानांतर रूप से काम फैलाएँ

यह उदाहरण प्रत्येक विषय के लिए एक शोधकर्ता लॉन्च करता है, उन सभी की प्रतीक्षा करता है, फिर
एक अंतिम चाइल्ड से उनकी संरचित रिपोर्टों का संश्लेषण करने को कहता है:

```javascript
const reportSchema = {
  type: "object",
  properties: {
    finding: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
  },
  required: ["finding", "evidence", "confidence"],
  additionalProperties: false,
};

const topics = ["authentication", "storage", "recovery"];
phase("Independent review");

const reports = await Promise.all(
  topics.map((topic) =>
    agents.run(`Review the ${topic} path. Return one finding with evidence.`, {
      label: `review-${topic}`,
      thinking: "high",
      fastMode: "auto",
      schema: reportSchema,
    }),
  ),
);

phase("Synthesis");
log(`Collected ${reports.length} independent reports.`);

return await agents.run(
  `Reconcile these reports and explain disagreements:\n${JSON.stringify(reports)}`,
  { label: "synthesis" },
);
```

`Promise.all` कार्य फैलाने और परिणाम समेटने की सीमा है। OpenClaw समूह के लिए
अधिकतम `maxConcurrent` चिल्ड्रन शुरू करता है और शेष को सबमिशन
क्रम में कतारबद्ध करता है।

### निर्णय गेट पर लूप चलाएँ

जब प्रत्येक पास यह तय करता है कि एक और पास आवश्यक है या नहीं, तब सीमित `while` लूप का उपयोग करें:

```javascript
const gateSchema = {
  type: "object",
  properties: {
    ready: { type: "boolean" },
    reason: { type: "string" },
    nextAction: { type: "string" },
  },
  required: ["ready", "reason", "nextAction"],
  additionalProperties: false,
};

let pass = 0;
let decision = { ready: false, reason: "Not checked", nextAction: "Review" };

while (!decision.ready && pass < 4) {
  pass += 1;
  phase(`Decision pass ${pass}`);
  decision = await agents.run(
    `Check whether the release evidence is complete. Previous decision: ${JSON.stringify(decision)}`,
    {
      label: `release-gate-${pass}`,
      schema: gateSchema,
    },
  );
  log(decision.reason);
}

if (!decision.ready) {
  throw new Error(`Gate still closed after ${pass} passes: ${decision.nextAction}`);
}

return decision;
```

निर्णय लूप को हमेशा सीमित रखें। `maxTotalPerGroup` अंतिम सुरक्षा उपाय है,
स्पष्ट समाप्ति शर्त का विकल्प नहीं।

### सबसे पहले समाप्त होने वाले चाइल्ड को प्रोसेस करें

`agents.run()` एक सामान्य प्रॉमिस लौटाता है, इसलिए `Promise.race` पहले
Code Mode चाइल्ड पर प्रतिक्रिया कर सकता है। निम्न-स्तरीय टूल कॉल करने वाले हार्नेस के लिए,
`agents_wait` वही प्रथम-पूर्णता सीमा प्रदान करता है: कम-से-कम एक अनुरोधित रन पूरा होते ही
या सीमित टाइमआउट समाप्त होने पर यह लौटता है।
पूर्ण ड्रेन लूप के लिए [अन्य हार्नेस से Swarm का उपयोग करें](#use-swarm-from-other-harnesses) देखें।

## कलेक्टर चिल्ड्रन का व्यवहार

कलेक्टर चिल्ड्रन सामान्य पृथक उप-एजेंट सत्र होते हैं, जिनका पूर्णता पथ अलग होता है। वे पैरेंट सत्र में
उत्तर की घोषणा करने या उसे निर्देशित करने के बजाय पैरेंट द्वारा प्रतीक्षा किए जाने के लिए एक टिकाऊ कलेक्टर परिणाम लिखते हैं।

लक्ष्य एजेंट इस क्रम में रिज़ॉल्व होता है:

1. `agentId` स्पॉन या `agents.run()` कॉल पर।
2. `tools.swarm.defaultAgentId`।
3. अनुरोध करने वाला एजेंट।

जब Swarm चिल्ड्रन को छोटी टूल सतह, सस्ता मॉडल या अधिक कठोर सैंडबॉक्स नीति चाहिए, तब एक समर्पित, हल्का वर्कर एजेंट उपयोगी होता है। OpenClaw में
अंतर्निहित `worker` एजेंट id शामिल नहीं है; इसे डिफ़ॉल्ट के रूप में नामित करने से पहले कॉन्फ़िगर करें।
उस वर्कर को उसके प्रति-एजेंट कॉन्फ़िगरेशन में `tools.swarm: false` के साथ सुदृढ़ करें, ताकि
उसे स्पॉन किया जा सके लेकिन वह अपने शीर्ष-स्तरीय सत्रों से Swarm शुरू न कर सके:

```json5
{
  tools: { swarm: { enabled: true, defaultAgentId: "worker" } },
  agents: {
    list: [
      {
        id: "main",
        default: true,
        subagents: { allowAgents: ["worker"] },
      },
      { id: "worker", tools: { swarm: false } },
    ],
  },
}
```

कलेक्टर अनुमोदन डिफ़ॉल्ट रूप से असफल होते हैं। कोई चाइल्ड कभी ऑपरेटर अनुमोदन
प्रॉम्प्ट नहीं खोलता। जिस टूल कार्रवाई को अनुमोदन की आवश्यकता हो, उसे अस्वीकार कर दिया जाता है और चाइल्ड
अपने परिणाम में उस अस्वीकृति की रिपोर्ट कर सकता है, ताकि स्क्रिप्ट तय कर सके कि आगे क्या करना है।

संरचित आउटपुट के लिए, OpenClaw चाइल्ड में एक सिंथेटिक `structured_output` टूल जोड़ता है और
उसके पेलोड को दिए गए JSON Schema के विरुद्ध सत्यापित करता है। अमान्य या अनुपस्थित पेलोड को सुधार के लिए एक संकेत मिलता है। यदि पुनः प्रयास भी
सत्यापित नहीं होता, तो कलेक्टर पूर्णता चाइल्ड का कच्चा टेक्स्ट बनाए रखती है,
`structured` को सेट नहीं करती और `schemaError` शामिल करती है। निम्न-स्तरीय `agents_wait`
परिणाम स्पष्ट रिकवरी लॉजिक के लिए उन फ़ील्डों को उपलब्ध कराता है।

### चिल्ड्रन लीफ़ होते हैं

Swarm चिल्ड्रन डिफ़ॉल्ट रूप से लीफ़ होते हैं। सार्वभौमिक
`agents.defaults.subagents.maxSpawnDepth` गार्ड, `1` की डिफ़ॉल्ट गहराई पर किसी चाइल्ड को
अपने चिल्ड्रन स्पॉन करने से रोकता है। सामान्य ऑर्केस्ट्रेशन मुहावरा चाइल्ड से और काम स्पॉन करना नहीं, बल्कि
काम को पैरेंट को लौटाना है:

```javascript
const plan = await agents.run("Plan this job as independent tasks.", {
  schema: {
    type: "object",
    properties: { tasks: { type: "array", items: { type: "string" } } },
    required: ["tasks"],
    additionalProperties: false,
  },
});
return await Promise.all(plan.tasks.map((task) => agents.run(task)));
```

नेस्टेड उप-एजेंटों के लिए ऑपरेटर को
`agents.defaults.subagents.maxSpawnDepth` के माध्यम से ऑप्ट-इन करना होता है और Swarm के लिए इन्हें हतोत्साहित किया जाता है।
समूह सीमाएँ, बजट और अवलोकनीयता सभी समतल कलेक्टर समूह मानकर चलते हैं।

प्रत्येक चाइल्ड का एक प्रवेश स्वामी होता है। घोषणा और इंटरैक्टिव चिल्ड्रन
`agents.defaults.subagents.maxChildrenPerAgent` (डिफ़ॉल्ट `5`) का उपयोग करते हैं और
कलेक्टर चिल्ड्रन को नहीं गिनते। कलेक्टर चिल्ड्रन केवल `maxChildrenPerGroup` और
`maxTotalPerGroup` का उपयोग करते हैं; वे प्रति-सत्र चाइल्ड बजट का उपभोग नहीं करते। स्पॉन
गहराई गार्ड फिर भी दोनों मोड पर लागू होता है।

प्रवेश के बाद, `maxConcurrent` से अधिक चिल्ड्रन अपने Swarm
समूह के भीतर FIFO क्रम में, वैश्विक उप-एजेंट लेन के अंदर कतारबद्ध होते हैं। ये समवर्ती निष्पादन परतें
काम को अस्वीकार करने के बजाय कतारबद्ध करती हैं। किसी भी समूह सीमा को पार करने वाला कलेक्टर स्पॉन
त्रुटि में संबंधित कॉन्फ़िग कुंजी के साथ अस्वीकार कर दिया जाता है।

## Swarm का अवलोकन करें

Swarm सक्रिय रहने के दौरान Control UI में पैरेंट सत्र का डैशबोर्ड खोलें।
Swarm विजेट प्रत्येक सक्रिय कलेक्टर समूह को हर चाइल्ड के लिए एक बिंदु के रूप में प्रस्तुत करता है, जिसमें
कतारबद्ध, चल रहा, पूर्ण या विफल स्थिति होती है। लेबल बिंदुओं के टूलटिप में दिखाई देते हैं, इसलिए छोटे,
स्थिर लेबल बड़े Swarm को पढ़ना आसान बनाते हैं।

सत्र साइडबार सामान्य पैरेंट/चाइल्ड वृक्ष बनाए रखता है। Swarm
पदानुक्रम खोए बिना किसी कलेक्टर चाइल्ड का निरीक्षण करने या उसका ट्रांसक्रिप्ट खोलने के लिए पैरेंट पंक्ति को विस्तृत करें।

कलेक्टर परिणाम अपने समूह के संग्रहित होने तक प्रतीक्षा-योग्य रहते हैं। प्रत्येक
सदस्य की प्रतिधारण समय-सीमा पूरी होने के बाद, OpenClaw समूह के चिल्ड्रन को
एक बैच के रूप में संग्रहित करता है, ताकि पूर्ण हुए Swarm लाइव सत्र वृक्ष में न रहें।

## अन्य हार्नेस से Swarm का उपयोग करें

आप OpenClaw Code Mode के बिना Swarm का उपयोग कर सकते हैं। इसके मुख्य टूल
हार्नेस-स्वतंत्र हैं: कलेक्टर चाइल्ड को
`sessions_spawn({ collect: true })` से शुरू करें और सीमित `agents_wait`
कॉल से उनसे परिणाम प्राप्त करें।

Codex Code Mode योग्य डायनेमिक OpenClaw टूल को स्वचालित रूप से
`tools.*` के अंतर्गत उपलब्ध कराता है। यह OpenClaw के QuickJS गेस्ट API का उपयोग नहीं करता या
`tools.codeMode` की आवश्यकता नहीं होती, लेकिन `tools.swarm` को फिर भी सक्षम होना चाहिए। Codex हार्नेस
`agents_wait` कॉल पूरे 600-सेकंड टाइमआउट का समर्थन करते हैं। इस पैटर्न का उपयोग करें:

```javascript
const tasks = [
  "प्रमाणीकरण पथ की जाँच करें।",
  "स्टोरेज पथ की जाँच करें।",
  "रिकवरी पथ की जाँच करें।",
];

const launches = await Promise.all(
  tasks.map((task, index) =>
    tools.sessions_spawn({
      task,
      collect: true,
      label: `review-${index + 1}`,
    }),
  ),
);

for (const launch of launches) {
  if (launch.status !== "accepted") {
    throw new Error(launch.error ?? "कलेक्टर स्पॉन स्वीकार नहीं किया गया।");
  }
}

const pending = new Set(launches.map((launch) => launch.runId));
const completed = [];

while (pending.size > 0) {
  const ids = [...pending].slice(0, 1000);
  const batch = await tools.agents_wait({
    ids,
    timeoutSeconds: 30,
  });

  // इस सीमित विंडो को उन आईडी के पीछे घुमाएँ जिनकी अभी जाँच नहीं हुई है।
  for (const runId of ids) {
    if (pending.delete(runId)) pending.add(runId);
  }

  for (const item of batch.completed) {
    pending.delete(item.runId);
    if (item.status !== "done") {
      throw new Error(item.schemaError ?? item.result ?? `${item.runId}: ${item.status}`);
    }
    completed.push(item); // प्रत्येक परिणाम के पूर्ण होते ही उसे प्रोसेस करें।
  }

  for (const failure of batch.errors ?? []) {
    pending.delete(failure.runId);
    throw new Error(`${failure.runId}: ${failure.error}`);
  }
}

return completed;
```

प्रत्येक `agents_wait` कॉल 1–1000 रन आईडी स्वीकार करता है। यह लौटाता है:

```typescript
type AgentsWaitResult = {
  completed: Array<{
    runId: string;
    status: "done" | "failed" | "killed" | "timeout";
    result: string;
    structured?: unknown;
    schemaError?: string;
    sessionKey: string;
    label?: string;
    usage?: { inputTokens: number; outputTokens: number };
  }>;
  pending: string[];
  errors?: Array<{
    runId: string;
    error: "not_found" | "not_owner";
  }>;
};
```

जब अनुरोधित कोई चाइल्ड पहले ही पूर्ण हो चुका हो,
जब कम-से-कम एक लंबित चाइल्ड पूर्ण हो जाए, जब कोई मान्य लंबित आईडी शेष न रहे,
या जब इसका टाइमआउट समाप्त हो जाए, तब कॉल तुरंत लौटती है। पूर्ण रिकॉर्ड आइडेम्पोटेंट होते हैं, इसलिए किसी
पहले से पूर्ण रन आईडी को पास करने पर उसका परिणाम फिर से लौटता है। केवल स्पॉन करने वाला सेशन
या उसकी अधिकृत पैरेंट शृंखला ही किसी कलेक्टर की प्रतीक्षा कर सकती है।

यह सीमित लॉन्ग पोलिंग है, व्यस्त स्टेटस लूप नहीं। केवल
शेष रन आईडी पास करते रहें, जब तक `pending` रिक्त न हो जाए। कलेक्टर मोड नेटिव
OpenClaw सब-एजेंट का समर्थन करता है; यह ACP रनटाइम, थ्रेड बाइंडिंग, दृश्यमान
सेशन या स्थायी सेशन मोड का समर्थन नहीं करता।

## सीमाएँ और रोडमैप

Swarm v1 एकल-चरण कलेक्टर चाइल्ड चलाता है; नियोजित `agents.session()` API
स्टेटफुल बहु-चरण वर्कर जोड़ेगा। चाइल्ड वर्तमान में स्थानीय
Gateway की सब-एजेंट लेन पर चलते हैं; क्लाउड प्लेसमेंट को एक स्पष्ट स्पॉन
विकल्प के रूप में जोड़ने की योजना है। सहेजी गई वर्कफ़्लो परिभाषाएँ और ग्राफ़ DSL, Swarm की
वर्तमान दिशा का हिस्सा नहीं हैं।

## संबंधित

- [Code Mode](/hi/tools/code-mode) QuickJS गेस्ट रनटाइम और सक्रियण नियमों के लिए
- [सब-एजेंट](/hi/tools/subagents) चाइल्ड नीति, आइसोलेशन और सेशन व्यवहार के लिए
- [मल्टी-एजेंट सैंडबॉक्स टूल](/hi/tools/multi-agent-sandbox-tools) प्रति-एजेंट प्रतिबंधों के लिए
- [टूल अवलोकन](/hi/tools) टूल प्रोफ़ाइल और नीति रूटिंग के लिए
