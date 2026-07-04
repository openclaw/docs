---
read_when:
    - आप समझना चाहते हैं कि एजेंट के पास कौन-से सत्र टूल हैं
    - आप क्रॉस-सेशन एक्सेस या सब-एजेंट स्पॉनिंग कॉन्फ़िगर करना चाहते हैं
    - आप स्पॉन किए गए सब-एजेंट की स्थिति देखना चाहते हैं
summary: क्रॉस-सेशन स्थिति, स्मरण, संदेश-प्रेषण, और उप-एजेंट ऑर्केस्ट्रेशन के लिए एजेंट टूलز
title: सत्र टूल्स
x-i18n:
    generated_at: "2026-07-04T20:33:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw एजेंटों को सत्रों के पार काम करने, स्थिति का निरीक्षण करने, और
उप-एजेंटों को व्यवस्थित करने के लिए टूल देता है।

## उपलब्ध टूल

| टूल               | यह क्या करता है                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | वैकल्पिक फ़िल्टरों (kind, label, agent, archive, preview) के साथ सत्रों की सूची बनाता है  |
| `sessions_history` | किसी विशिष्ट सत्र का प्रतिलेख पढ़ता है                                   |
| `sessions_send`    | दूसरे सत्र को संदेश भेजता है और वैकल्पिक रूप से प्रतीक्षा करता है                       |
| `sessions_spawn`   | पृष्ठभूमि कार्य के लिए एक अलग-थलग उप-एजेंट सत्र शुरू करता है                     |
| `sessions_yield`   | मौजूदा टर्न समाप्त करता है और फ़ॉलो-अप उप-एजेंट परिणामों की प्रतीक्षा करता है               |
| `subagents`        | इस सत्र के लिए शुरू किए गए उप-एजेंट की स्थिति सूचीबद्ध करता है                              |
| `session_status`   | `/status`-शैली का कार्ड दिखाता है और वैकल्पिक रूप से प्रति-सत्र मॉडल ओवरराइड सेट करता है |

ये टूल अभी भी सक्रिय टूल प्रोफ़ाइल और अनुमति/अस्वीकृति
नीति के अधीन हैं। `tools.profile: "coding"` में पूरा सत्र ऑर्केस्ट्रेशन
सेट शामिल है, जिसमें `sessions_spawn`, `sessions_yield`, और `subagents` शामिल हैं।
`tools.profile: "messaging"` में क्रॉस-सत्र मैसेजिंग टूल
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) शामिल हैं, लेकिन
उप-एजेंट शुरू करना शामिल नहीं है। मैसेजिंग प्रोफ़ाइल बनाए रखने और फिर भी
नेटिव डेलिगेशन की अनुमति देने के लिए, जोड़ें:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

समूह, प्रदाता, sandbox, और प्रति-एजेंट नीतियां प्रोफ़ाइल चरण के बाद भी
उन टूल को हटा सकती हैं। प्रभावी टूल सूची देखने के लिए प्रभावित सत्र से
`/tools` का उपयोग करें।

## सत्रों को सूचीबद्ध करना और पढ़ना

`sessions_list` सत्रों को उनकी key, agentId, kind, channel, model,
टोकन गणनाओं, और टाइमस्टैम्प के साथ लौटाता है। kind (`main`, `group`, `cron`, `hook`,
`node`), सटीक `label`, सटीक `agentId`, खोज टेक्स्ट, या हालियापन
(`activeMinutes`) के आधार पर फ़िल्टर करें। सक्रिय सत्र डिफ़ॉल्ट रूप से लौटाए जाते हैं; संग्रहित सत्रों की जांच करने के लिए `archived: true`
पास करें। पंक्तियों में उनकी पिन की गई और संग्रहित स्थिति शामिल होती है। जब
आपको mailbox-शैली ट्रायेज चाहिए, तो यह प्रत्येक पंक्ति पर
visibility-स्कोप वाला व्युत्पन्न शीर्षक, अंतिम-संदेश पूर्वावलोकन स्निपेट, या सीमित हालिया
संदेश भी मांग सकता है। व्युत्पन्न शीर्षक और पूर्वावलोकन केवल उन सत्रों के लिए बनाए जाते हैं
जिन्हें कॉलर कॉन्फ़िगर की गई सत्र टूल दृश्यता नीति के तहत पहले से देख सकता है, इसलिए
असंबंधित सत्र छिपे रहते हैं। जब दृश्यता प्रतिबंधित होती है, `sessions_list`
वैकल्पिक `visibility` मेटाडेटा लौटाता है जो प्रभावी मोड और यह चेतावनी दिखाता है कि
परिणाम स्कोप-सीमित हो सकते हैं।

`sessions_history` किसी विशिष्ट सत्र का वार्तालाप प्रतिलेख लाता है।
डिफ़ॉल्ट रूप से, टूल परिणाम बाहर रखे जाते हैं -- उन्हें देखने के लिए `includeTools: true` पास करें।
सबसे नए सीमित tail के लिए `limit` का उपयोग करें। जब आपको
पेजिनेशन मेटाडेटा चाहिए, तो `offset: 0` पास करें, फिर कच्ची प्रतिलेख फ़ाइलों को पढ़े बिना
पुरानी OpenClaw प्रतिलेख विंडो में पीछे की ओर पेज करने के लिए लौटाए गए `nextOffset` मान पास करें।
स्पष्ट offset पेज बाहरी CLI fallback इम्पोर्ट को मर्ज नहीं करते; जब आपको
वह मर्ज किया गया डिस्प्ले इतिहास चाहिए, तो डिफ़ॉल्ट newest-tail दृश्य का उपयोग करें।
लौटाया गया दृश्य जानबूझकर सीमित और सुरक्षा-फ़िल्टर किया गया है:

- assistant टेक्स्ट recall से पहले सामान्यीकृत किया जाता है:
  - thinking टैग हटाए जाते हैं
  - `<relevant-memories>` / `<relevant_memories>` scaffolding ब्लॉक हटाए जाते हैं
  - plain-text tool-call XML payload ब्लॉक जैसे `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, और
    `<function_calls>...</function_calls>` हटाए जाते हैं, जिनमें अधूरे
    payload भी शामिल हैं जो साफ़ तरीके से कभी बंद नहीं होते
  - डाउनग्रेड किया गया tool-call/result scaffolding जैसे `[Tool Call: ...]`,
    `[Tool Result ...]`, और `[Historical context ...]` हटाया जाता है
  - लीक हुए मॉडल नियंत्रण टोकन जैसे `<|assistant|>`, अन्य ASCII
    `<|...|>` टोकन, और full-width `<｜...｜>` वैरिएंट हटाए जाते हैं
  - विकृत MiniMax tool-call XML जैसे `<invoke ...>` /
    `</minimax:tool_call>` हटाया जाता है
- क्रेडेंशियल/टोकन-जैसा टेक्स्ट लौटाए जाने से पहले redacted किया जाता है
- लंबे टेक्स्ट ब्लॉक काटे जाते हैं
- बहुत बड़े इतिहास पुरानी पंक्तियां छोड़ सकते हैं या किसी बहुत बड़ी पंक्ति को
  `[sessions_history omitted: message too large]` से बदल सकते हैं
- टूल `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes`, और पेजिनेशन मेटाडेटा जैसे सारांश फ़्लैग रिपोर्ट करता है

दोनों टूल या तो **session key** (जैसे `"main"`) या पिछले list कॉल से मिली **session ID**
स्वीकार करते हैं।

यदि आपको बिल्कुल byte-for-byte प्रतिलेख चाहिए, तो `sessions_history` को कच्चा dump मानने के बजाय
डिस्क पर प्रतिलेख फ़ाइल देखें।

## क्रॉस-सत्र संदेश भेजना

`sessions_send` दूसरे सत्र को संदेश डिलीवर करता है और वैकल्पिक रूप से
प्रतिक्रिया की प्रतीक्षा करता है:

- **भेजें और भूल जाएं:** enqueue करने और तुरंत लौटने के लिए `timeoutSeconds: 0` सेट करें।
- **उत्तर की प्रतीक्षा करें:** timeout सेट करें और प्रतिक्रिया inline प्राप्त करें।

थ्रेड-स्कोप वाले चैट सत्र, जैसे Slack या Discord keys जो
`:thread:<id>` पर समाप्त होती हैं, मान्य `sessions_send` target नहीं हैं। inter-agent समन्वय के लिए parent channel
session key का उपयोग करें ताकि tool-routed संदेश सक्रिय human-facing thread
के अंदर दिखाई न दें।

संदेश और A2A फ़ॉलो-अप उत्तर प्राप्त करने वाले prompt
(`[Inter-session message ... isUser=false]`) और प्रतिलेख provenance में inter-session data के रूप में चिह्नित होते हैं। प्राप्त करने वाले एजेंट को उन्हें
tool-routed data मानना चाहिए, सीधे end-user-authored निर्देश नहीं।

target के जवाब देने के बाद, OpenClaw **reply-back loop** चला सकता है जहां
एजेंट बारी-बारी से संदेश भेजते हैं (`session.agentToAgent.maxPingPongTurns` तक, range
0-20, default 5)। target एजेंट जल्दी रोकने के लिए
`REPLY_SKIP` जवाब दे सकता है।

## स्थिति और ऑर्केस्ट्रेशन सहायक

`session_status` वर्तमान या किसी अन्य दृश्यमान सत्र के लिए हल्का `/status`-समकक्ष टूल है।
यह usage, समय, model/runtime state, और मौजूद होने पर
linked background-task context रिपोर्ट करता है। `/status` की तरह, यह latest transcript usage entry से
sparse token/cache counters backfill कर सकता है, और
`model=default` प्रति-सत्र override साफ़ करता है। कॉलर के वर्तमान सत्र के लिए `sessionKey="current"` का उपयोग करें;
दृश्यमान client labels जैसे `openclaw-tui` session keys नहीं हैं।

जब route metadata उपलब्ध होता है, `session_status` एक दृश्यमान
`Route context` JSON block और matching structured `details` fields भी शामिल करता है। ये
fields session key को उस route से अलग करते हैं जो अभी live run
संभाल रहा है:

- `origin` वह जगह है जहां सत्र बनाया गया था, या जब पुराने state में stored origin metadata नहीं होता तो
  deliverable session-key prefix से inferred provider होता है।
- `active` वर्तमान live-run route है। यह केवल अभी संभाले जा रहे live या
  current session के लिए रिपोर्ट किया जाता है।
- `deliveryContext` सत्र पर stored persisted delivery route है,
  जिसे OpenClaw बाद की delivery के लिए फिर से उपयोग कर सकता है, भले ही active surface
  अलग हो।

`sessions_yield` जानबूझकर वर्तमान turn समाप्त करता है ताकि अगला संदेश वह
follow-up event हो सके जिसका आप इंतज़ार कर रहे हैं। उप-एजेंट शुरू करने के बाद इसका उपयोग करें जब
आप completion results को poll loops बनाने के बजाय अगले संदेश के रूप में पाना चाहते हैं।

`subagents` पहले से शुरू किए गए OpenClaw
उप-एजेंटों के लिए visibility helper है। यह सक्रिय/हालिया runs देखने के लिए `action: "list"` समर्थित करता है।

## उप-एजेंट शुरू करना

`sessions_spawn` डिफ़ॉल्ट रूप से पृष्ठभूमि कार्य के लिए एक अलग-थलग सत्र बनाता है।
यह हमेशा non-blocking होता है -- यह तुरंत `runId` और
`childSessionKey` के साथ लौटता है। नेटिव उप-एजेंट runs delegated task को
child session के पहले दृश्यमान `[Subagent Task]` संदेश में प्राप्त करते हैं, जबकि system
prompt में केवल उप-एजेंट runtime rules और routing context होता है।

मुख्य विकल्प:

- `runtime: "subagent"` (default) या external harness agents के लिए `"acp"`।
- child session के लिए `model` और `thinking` overrides।
- spawn को chat thread (Discord, Slack, आदि) से bind करने के लिए `thread: true`।
- child पर sandboxing लागू करने के लिए `sandbox: "require"`।
- नेटिव उप-एजेंटों के लिए `context: "fork"` जब child को current
  requester transcript चाहिए; साफ़ child के लिए इसे छोड़ दें या `context: "isolated"` का उपयोग करें।
  Thread-bound नेटिव उप-एजेंट डिफ़ॉल्ट रूप से `context: "fork"` उपयोग करते हैं, जब तक
  `threadBindings.defaultSpawnContext` कुछ और न कहे।

डिफ़ॉल्ट leaf उप-एजेंटों को session tools नहीं मिलते। जब
`maxSpawnDepth >= 2`, depth-1 orchestrator उप-एजेंटों को अतिरिक्त रूप से
`sessions_spawn`, `subagents`, `sessions_list`, और `sessions_history` मिलते हैं ताकि वे
अपने children को manage कर सकें। Leaf runs को फिर भी recursive
orchestration tools नहीं मिलते।

पूरा होने के बाद, announce step requester के channel पर परिणाम पोस्ट करता है।
Completion delivery उपलब्ध होने पर bound thread/topic routing को सुरक्षित रखती है, और यदि
completion origin केवल channel की पहचान करता है तो OpenClaw direct
delivery के लिए requester session का stored route (`lastChannel` / `lastTo`) फिर भी reuse कर सकता है।

ACP-विशिष्ट behavior के लिए, [ACP एजेंट](/hi/tools/acp-agents) देखें।

## दृश्यता

Session tools का scope सीमित किया जाता है ताकि एजेंट क्या देख सकता है:

| स्तर   | Scope                                    |
| ------- | ---------------------------------------- |
| `self`  | केवल वर्तमान सत्र                 |
| `tree`  | वर्तमान सत्र + शुरू किए गए उप-एजेंट     |
| `agent` | इस एजेंट के लिए सभी सत्र              |
| `all`   | सभी सत्र (कॉन्फ़िगर होने पर cross-agent) |

Default `tree` है। Sandboxed सत्र config की परवाह किए बिना
`tree` तक clamp किए जाते हैं।

## आगे पढ़ें

- [सत्र प्रबंधन](/hi/concepts/session) -- routing, lifecycle, maintenance
- [ACP एजेंट](/hi/tools/acp-agents) -- external harness spawning
- [Multi-agent](/hi/concepts/multi-agent) -- multi-agent architecture
- [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration) -- session tool config knobs

## संबंधित

- [सत्र प्रबंधन](/hi/concepts/session)
- [सत्र pruning](/hi/concepts/session-pruning)
