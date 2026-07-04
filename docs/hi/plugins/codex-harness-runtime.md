---
read_when:
    - आपको Codex harness रनटाइम समर्थन अनुबंध चाहिए
    - आप नेटिव Codex टूल, हुक, Compaction, या फ़ीडबैक अपलोड डीबग कर रहे हैं
    - आप OpenClaw और Codex harness टर्न्स में Plugin व्यवहार बदल रहे हैं
summary: Codex हार्नेस के लिए रनटाइम सीमाएँ, हुक, टूल, अनुमतियाँ और डायग्नोस्टिक्स
title: Codex हार्नेस रनटाइम
x-i18n:
    generated_at: "2026-07-04T20:33:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

यह पृष्ठ Codex हार्नेस टर्न के लिए रनटाइम अनुबंध का दस्तावेज़ीकरण करता है। सेटअप और
रूटिंग के लिए, [Codex हार्नेस](/hi/plugins/codex-harness) से शुरू करें। कॉन्फ़िग फ़ील्ड के लिए,
[Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference) देखें।

## अवलोकन

Codex मोड केवल नीचे अलग मॉडल कॉल वाला OpenClaw नहीं है। Codex नेटिव
मॉडल लूप का अधिक हिस्सा अपने पास रखता है, और OpenClaw अपनी plugin, टूल, सेशन, और
डायग्नोस्टिक सतहों को उस सीमा के आसपास अनुकूलित करता है।

OpenClaw अब भी चैनल रूटिंग, सेशन फ़ाइलें, दिखाई देने वाली मैसेज डिलीवरी,
OpenClaw डायनेमिक टूल्स, अनुमोदन, मीडिया डिलीवरी, और ट्रांसक्रिप्ट मिरर का मालिक है।
Codex कैनोनिकल नेटिव थ्रेड, नेटिव मॉडल लूप, नेटिव टूल
कंटिन्यूएशन, और नेटिव Compaction का मालिक है।

प्रॉम्प्ट रूटिंग चुने गए रनटाइम का अनुसरण करती है, केवल provider स्ट्रिंग का नहीं। एक
नेटिव Codex टर्न को Codex app-server डेवलपर निर्देश मिलते हैं, जबकि एक
स्पष्ट OpenClaw संगतता रूट सामान्य OpenClaw सिस्टम प्रॉम्प्ट बनाए रखता है, भले ही
वह Codex-फ्लेवर वाले OpenAI auth या transport का उपयोग करे।

नेटिव Codex सक्रिय Codex थ्रेड कॉन्फ़िग के अनुसार Codex-स्वामित्व वाले बेस/मॉडल निर्देश और project-doc व्यवहार बनाए रखता है। OpenClaw नेटिव
Codex थ्रेड्स को Codex की बिल्ट-इन पर्सनैलिटी अक्षम करके शुरू और फिर से शुरू करता है ताकि workspace
personality फ़ाइलें और OpenClaw agent पहचान प्रामाणिक रहें। हल्के
OpenClaw रन अब भी अपने मौजूदा project-doc suppression को सुरक्षित रखते हैं। OpenClaw
डेवलपर निर्देश OpenClaw रनटाइम चिंताओं को कवर करते हैं, जैसे source-channel
delivery, OpenClaw डायनेमिक टूल्स, ACP delegation, adapter context, और
सक्रिय agent workspace profile फ़ाइलें। OpenClaw skill catalogs और tool-routed
`MEMORY.md` pointers को नेटिव Codex के लिए turn-scoped collaboration developer
instructions के रूप में प्रोजेक्ट किया जाता है। सक्रिय `BOOTSTRAP.md` सामग्री और पूर्ण
`MEMORY.md` fallback injection अब भी turn input reference context का उपयोग करते हैं।

## थ्रेड बाइंडिंग और मॉडल परिवर्तन

जब कोई OpenClaw सेशन किसी मौजूदा Codex थ्रेड से जुड़ा होता है, तो अगला टर्न
वर्तमान में चुने गए OpenAI मॉडल, approval policy, sandbox, और service
tier को फिर से app-server को भेजता है। `openai/gpt-5.5` से
`openai/gpt-5.2` पर स्विच करने से थ्रेड बाइंडिंग बनी रहती है, लेकिन Codex से
नए चुने गए मॉडल के साथ जारी रखने को कहा जाता है।

## दिखाई देने वाले उत्तर और Heartbeat

जब कोई direct/source chat टर्न Codex हार्नेस से चलता है, तो दिखाई देने वाले उत्तर
आंतरिक WebChat सतहों के लिए डिफ़ॉल्ट रूप से automatic final assistant delivery पर सेट होते हैं।
यह Codex को Pi हार्नेस प्रॉम्प्ट अनुबंध के साथ संरेखित रखता है: agents सामान्य रूप से उत्तर देते हैं,
और OpenClaw अंतिम टेक्स्ट को source conversation में पोस्ट करता है। जब direct/source chat को
जानबूझकर final assistant text को निजी रखना हो, जब तक agent
`message(action="send")` कॉल न करे, तब `messages.visibleReplies: "message_tool"` सेट करें।

Codex Heartbeat टर्न को डिफ़ॉल्ट रूप से searchable OpenClaw
tool catalog में `heartbeat_respond` भी मिलता है, ताकि agent रिकॉर्ड कर सके कि wake को
शांत रहना चाहिए या अंतिम टेक्स्ट में उस control flow को एन्कोड किए बिना notify करना चाहिए।

Heartbeat-विशिष्ट initiative guidance को Heartbeat टर्न पर ही Codex collaboration-mode
developer instruction के रूप में भेजा जाता है। सामान्य chat टर्न अपने सामान्य
runtime prompt में Heartbeat philosophy ले जाने के बजाय Codex Default mode को restore करते हैं।
जब एक non-empty `HEARTBEAT.md` मौजूद होती है, तो Heartbeat
collaboration-mode instructions उसकी सामग्री inline करने के बजाय Codex को उस फ़ाइल की ओर इंगित करते हैं।

## हुक सीमाएँ

Codex हार्नेस में तीन हुक स्तर हैं:

| स्तर                                  | मालिक                    | उद्देश्य                                                            |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin हुक                   | OpenClaw                 | OpenClaw और Codex हार्नेस में product/plugin संगतता।               |
| Codex app-server extension middleware | OpenClaw bundled plugins | OpenClaw डायनेमिक टूल्स के आसपास per-turn adapter व्यवहार।         |
| Codex नेटिव हुक                       | Codex                    | Codex कॉन्फ़िग से low-level Codex lifecycle और नेटिव टूल नीति।      |

OpenClaw plugin व्यवहार को रूट करने के लिए OpenClaw project या global Codex `hooks.json` फ़ाइलों का उपयोग नहीं करता।
समर्थित नेटिव टूल और permission bridge के लिए,
OpenClaw `PreToolUse`, `PostToolUse`,
`PermissionRequest`, और `Stop` के लिए per-thread Codex config inject करता है।

जब Codex app-server approvals सक्षम होते हैं, यानी `approvalPolicy`
`"never"` नहीं होता, तो डिफ़ॉल्ट injected native hook config `PermissionRequest` को छोड़ देता है ताकि
Codex का app-server reviewer और OpenClaw का approval bridge review के बाद वास्तविक
escalations संभालें। Operators compatibility relay की आवश्यकता होने पर
`nativeHookRelay.events` में स्पष्ट रूप से `permission_request` जोड़ सकते हैं।

अन्य Codex हुक, जैसे `SessionStart` और `UserPromptSubmit`, Codex-level controls बने रहते हैं।
वे v1 अनुबंध में OpenClaw plugin hooks के रूप में उजागर नहीं किए गए हैं।

OpenClaw डायनेमिक टूल्स के लिए, Codex द्वारा कॉल मांगने के बाद OpenClaw टूल निष्पादित करता है,
इसलिए OpenClaw harness adapter में अपने स्वामित्व वाले plugin और middleware व्यवहार को चलाता है।
Codex-native टूल्स के लिए, Codex canonical tool record का मालिक है।
OpenClaw चुने हुए events को mirror कर सकता है, लेकिन जब तक Codex उस operation को app-server या native hook
callbacks के माध्यम से expose न करे, वह नेटिव Codex थ्रेड को rewrite नहीं कर सकता।

Codex app-server report-mode `PreToolUse` events plugin approval requests को
matching app-server approval तक defer करते हैं। यदि कोई OpenClaw `before_tool_call` hook
`requireApproval` लौटाता है जबकि native payload report approval mode सेट करता है
(`openclaw_approval_mode` `"report"` है), तो native hook relay
plugin approval requirement रिकॉर्ड करता है और कोई native decision नहीं लौटाता। जब Codex उसी
tool use के लिए app-server approval request भेजता है, OpenClaw plugin
approval prompt खोलता है और decision को वापस Codex में map करता है। Codex `PermissionRequest`
events एक अलग approval path हैं और runtime उस bridge के लिए configured होने पर भी OpenClaw
approvals के माध्यम से route कर सकते हैं।

Codex app-server item notifications उन native tool completions के लिए async `after_tool_call`
observations भी प्रदान करते हैं जो पहले से native `PostToolUse` relay से covered नहीं हैं।
ये observations केवल telemetry और plugin compatibility के लिए हैं; वे native tool call को
block, delay, या mutate नहीं कर सकते।

Compaction और LLM lifecycle projections Codex app-server
notifications और OpenClaw adapter state से आते हैं, native Codex hook commands से नहीं।
OpenClaw के `before_compaction`, `after_compaction`, `llm_input`, और
`llm_output` events adapter-level observations हैं, Codex के internal request या compaction payloads के
byte-for-byte captures नहीं।

Codex native `hook/started` और `hook/completed` app-server notifications को
trajectory और debugging के लिए `codex_app_server.hook` agent events के रूप में
project किया जाता है। वे OpenClaw plugin hooks invoke नहीं करते।

## V1 समर्थन अनुबंध

Codex runtime v1 में समर्थित:

| क्षेत्र                                       | समर्थन                                                                          | कारण                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex के माध्यम से OpenAI मॉडल लूप               | समर्थित                                                                        | Codex app-server OpenAI टर्न, नेटिव थ्रेड resume, और नेटिव टूल continuation का स्वामी है।                                                                                                                                                                                                                                                                                                                                                                                          |
| OpenClaw चैनल रूटिंग और डिलीवरी         | समर्थित                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage, और अन्य चैनल मॉडल रनटाइम के बाहर रहते हैं।                                                                                                                                                                                                                                                                                                                                                                                    |
| OpenClaw डायनेमिक टूल                        | समर्थित                                                                        | Codex OpenClaw से इन टूल को निष्पादित करने के लिए कहता है, इसलिए OpenClaw निष्पादन पथ में बना रहता है।                                                                                                                                                                                                                                                                                                                                                                                                |
| प्रॉम्प्ट और कॉन्टेक्स्ट Plugin                    | समर्थित                                                                        | OpenClaw, OpenClaw-विशिष्ट प्रॉम्प्ट/कॉन्टेक्स्ट को Codex टर्न में प्रोजेक्ट करता है, जबकि Codex-स्वामित्व वाले base, model, और कॉन्फ़िगर किए गए project-doc प्रॉम्प्ट नेटिव Codex लेन में रहते हैं। OpenClaw नेटिव थ्रेड के लिए Codex की बिल्ट-इन personality को अक्षम करता है ताकि agent workspace personality फ़ाइलें प्रामाणिक बनी रहें। नेटिव Codex developer instructions केवल `codex_app_server` तक स्पष्ट रूप से scoped command guidance स्वीकार करती हैं; legacy global command hints non-Codex prompt surfaces के लिए बने रहते हैं। |
| कॉन्टेक्स्ट इंजन जीवनचक्र                      | समर्थित                                                                        | Assemble, ingest, और after-turn maintenance Codex टर्न के इर्द-गिर्द चलते हैं। कॉन्टेक्स्ट इंजन नेटिव Codex Compaction को प्रतिस्थापित नहीं करते।                                                                                                                                                                                                                                                                                                                                                        |
| डायनेमिक टूल हुक                            | समर्थित                                                                        | `before_tool_call`, `after_tool_call`, और tool-result middleware OpenClaw-स्वामित्व वाले डायनेमिक टूल के इर्द-गिर्द चलते हैं।                                                                                                                                                                                                                                                                                                                                                                          |
| जीवनचक्र हुक                               | एडेप्टर observations के रूप में समर्थित                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, और `after_compaction` ईमानदार Codex-mode payloads के साथ fire होते हैं।                                                                                                                                                                                                                                                                                                                                                           |
| अंतिम-उत्तर संशोधन गेट                    | नेटिव hook relay के माध्यम से समर्थित                                              | Codex `Stop` को `before_agent_finalize` तक relay किया जाता है; `revise` finalization से पहले Codex से एक और मॉडल पास मांगता है।                                                                                                                                                                                                                                                                                                                                                                |
| नेटिव shell, patch, और MCP block या observe | नेटिव hook relay के माध्यम से समर्थित                                              | Codex `PreToolUse` और `PostToolUse` committed native tool surfaces के लिए relay किए जाते हैं, जिनमें Codex app-server `0.125.0` या नए पर MCP payloads शामिल हैं। Blocking समर्थित है; argument rewriting नहीं।                                                                                                                                                                                                                                                                               |
| नेटिव permission policy                      | Codex app-server approvals और compatibility native hook relay के माध्यम से समर्थित | Codex app-server approval requests Codex review के बाद OpenClaw के माध्यम से route होते हैं। `PermissionRequest` native hook relay नेटिव approval modes के लिए opt-in है क्योंकि Codex इसे guardian review से पहले emit करता है।                                                                                                                                                                                                                                                                          |
| App-server trajectory capture                 | समर्थित                                                                        | OpenClaw app-server को भेजे गए request और प्राप्त app-server notifications को record करता है।                                                                                                                                                                                                                                                                                                                                                                                    |

Codex runtime v1 में समर्थित नहीं:

| क्षेत्र                                             | V1 सीमा                                                                                                                                     | भावी मार्ग                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| नेटिव टूल argument mutation                       | Codex native pre-tool hooks block कर सकते हैं, लेकिन OpenClaw Codex-native tool arguments को rewrite नहीं करता।                                               | replacement tool input के लिए Codex hook/schema support की आवश्यकता है।                            |
| Editable Codex-native transcript history            | Codex canonical native thread history का स्वामी है। OpenClaw mirror का स्वामी है और future context project कर सकता है, लेकिन unsupported internals को mutate नहीं करना चाहिए। | अगर native thread surgery की जरूरत हो तो explicit Codex app-server APIs जोड़ें।                    |
| Codex-native tool records के लिए `tool_result_persist` | वह hook OpenClaw-स्वामित्व वाली transcript writes को transform करता है, Codex-native tool records को नहीं।                                                           | transformed records mirror किए जा सकते हैं, लेकिन canonical rewrite के लिए Codex support चाहिए।              |
| Rich native compaction metadata                     | OpenClaw native Compaction request कर सकता है, लेकिन stable kept/dropped list, token delta, completion summary, या summary payload प्राप्त नहीं करता।   | अधिक समृद्ध Codex Compaction events चाहिए।                                                     |
| Compaction intervention                             | OpenClaw Plugin या context engines को native Codex Compaction को veto, rewrite, या replace करने नहीं देता।                                             | अगर Plugin को native Compaction को veto या rewrite करना हो तो Codex pre/post Compaction hooks जोड़ें। |
| Byte-for-byte model API request capture             | OpenClaw app-server requests और notifications capture कर सकता है, लेकिन Codex core final OpenAI API request internally बनाता है।                      | Codex model-request tracing event या debug API चाहिए।                                   |

## नेटिव permissions और MCP elicitations

`PermissionRequest` के लिए, OpenClaw केवल स्पष्ट allow या deny decisions लौटाता है
जब policy फैसला करती है। no-decision result allow नहीं है। Codex इसे no
hook decision मानता है और अपने guardian या user approval path पर आगे बढ़ता है।

Codex app-server approval modes default रूप से इस native hook को omit करते हैं। यह behavior
तब लागू होता है जब `permission_request` को `nativeHookRelay.events` में
explicitly शामिल किया गया हो या कोई compatibility runtime इसे install करे।

जब कोई operator Codex native permission request के लिए `allow-always` चुनता है,
OpenClaw उस exact provider/session/tool input/cwd fingerprint को
bounded session window के लिए याद रखता है। remembered decision जानबूझकर exact-match
only है: बदला हुआ command, arguments, tool payload, या cwd एक fresh
approval बनाता है।

Codex MCP tool approval elicitations को OpenClaw के Plugin
approval flow के माध्यम से route किया जाता है जब Codex `_meta.codex_approval_kind` को
`"mcp_tool_call"` के रूप में mark करता है। Codex `request_user_input` prompts को
originating chat में वापस भेजा जाता है, और अगला queued follow-up message उस native
server request का उत्तर देता है, बजाय इसके कि उसे extra context के रूप में steer किया जाए। अन्य MCP elicitation
requests fail closed होते हैं।

इन prompts को carry करने वाले सामान्य Plugin approval flow के लिए, देखें
[Plugin permission requests](/hi/plugins/plugin-permission-requests).

## Queue steering

Active-run queue steering Codex app-server `turn/steer` पर map होता है। Default
`messages.queue.mode: "steer"` के साथ, OpenClaw configured quiet window के लिए steer-mode chat
messages को batch करता है और उन्हें arrival order में एक `turn/steer`
request के रूप में भेजता है।

Codex समीक्षा और मैनुअल Compaction टर्न उसी-टर्न की दिशा-निर्देशन को अस्वीकार कर सकते हैं। ऐसे
मामले में, OpenClaw प्रॉम्प्ट शुरू करने से पहले सक्रिय रन के समाप्त होने की प्रतीक्षा करता है।
जब संदेशों को दिशा-निर्देशन के बजाय डिफ़ॉल्ट रूप से कतार में लगना चाहिए, तो
`/queue followup` या `/queue collect` का उपयोग करें। [दिशा-निर्देशन कतार](/hi/concepts/queue-steering) देखें।

## Codex फ़ीडबैक अपलोड

जब नेटिव Codex हार्नेस का उपयोग कर रहे किसी सेशन के लिए `/diagnostics [note]`
स्वीकृत होता है, तो OpenClaw संबंधित Codex थ्रेड्स के लिए Codex app-server
`feedback/upload` को भी कॉल करता है। अपलोड app-server से प्रत्येक सूचीबद्ध थ्रेड
और उपलब्ध होने पर स्पॉन किए गए Codex सबथ्रेड्स के लिए लॉग शामिल करने का अनुरोध करता है।

अपलोड Codex के सामान्य फ़ीडबैक पथ से OpenAI सर्वरों तक जाता है। यदि उस app-server में Codex
फ़ीडबैक अक्षम है, तो कमांड app-server त्रुटि लौटाता है। पूर्ण हुई डायग्नॉस्टिक्स प्रतिक्रिया भेजे गए थ्रेड्स के लिए चैनल, OpenClaw सेशन आईडी,
Codex थ्रेड आईडी, और स्थानीय `codex resume <thread-id>` कमांड सूचीबद्ध करती है।

यदि आप स्वीकृति अस्वीकार करते हैं या अनदेखा करते हैं, तो OpenClaw वे Codex आईडी नहीं प्रिंट करता और
Codex फ़ीडबैक नहीं भेजता। अपलोड स्थानीय Gateway डायग्नॉस्टिक्स एक्सपोर्ट को प्रतिस्थापित नहीं करता। स्वीकृति, गोपनीयता, स्थानीय बंडल, और समूह-चैट व्यवहार के लिए
[डायग्नॉस्टिक्स एक्सपोर्ट](/hi/gateway/diagnostics) देखें।

`/codex diagnostics [note]` का उपयोग केवल तब करें जब आप पूर्ण Gateway डायग्नॉस्टिक्स बंडल के बिना
वर्तमान में संलग्न थ्रेड के लिए विशेष रूप से Codex फ़ीडबैक अपलोड चाहते हों।

## Compaction और ट्रांसक्रिप्ट मिरर

जब चयनित मॉडल Codex हार्नेस का उपयोग करता है, तो नेटिव थ्रेड Compaction
Codex app-server का होता है। OpenClaw Codex टर्न के लिए प्रीफ़्लाइट Compaction नहीं चलाता,
Codex Compaction को context-engine Compaction से प्रतिस्थापित नहीं करता, और जब नेटिव Codex
Compaction शुरू नहीं किया जा सकता, तो OpenClaw या सार्वजनिक OpenAI सारांश पर
वापस नहीं जाता। OpenClaw चैनल इतिहास, खोज, `/new`, `/reset`, और भविष्य में मॉडल या हार्नेस स्विचिंग के लिए
ट्रांसक्रिप्ट मिरर रखता है।

स्पष्ट Compaction अनुरोध, जैसे `/compact` या Plugin-अनुरोधित मैनुअल
compact ऑपरेशन, `thread/compact/start` के साथ नेटिव Codex Compaction शुरू करते हैं।
OpenClaw अनुरोध और साझा-क्लाइंट लीज़ को तब तक खुला रखता है जब तक Codex मेल खाता
`contextCompaction` पूर्णता आइटम उत्सर्जित नहीं करता, और फिर Compaction टर्न को
पूर्ण के रूप में रिपोर्ट करता है। यदि वह टर्मिनल टर्न कॉन्फ़िगर किए गए Compaction टाइमआउट से अधिक हो जाता है,
तो OpenClaw नेटिव टर्न इंटरप्ट का अनुरोध करता है। लीज़ और प्रति-थ्रेड Compaction
फ़ेंस तब तक पकड़े रहते हैं जब तक Codex टर्मिनल स्थिति रिपोर्ट नहीं करता या इंटरप्ट RPC की पुष्टि नहीं करता।
यदि Codex इंटरप्ट ग्रेस अवधि के भीतर पुष्टि नहीं करता, तो OpenClaw फ़ेंस रिलीज़ करने से पहले
कनेक्शन को रिटायर कर देता है। रिमोट कनेक्शन मेल खाते थ्रेड बाइंडिंग को भी अलग कर देते हैं
ताकि बाद का काम किसी अपुष्ट रिमोट टर्न से ओवरलैप न कर सके। रिटायर किए गए कनेक्शन पर अन्य टर्न विफल होते हैं
और नए क्लाइंट पर फिर से प्रयास कर सकते हैं। क्लाइंट बंद होना, अनुरोध रद्द होना, या विफल Compaction टर्न
विफल ऑपरेशन लौटाता है।

जब कोई कॉन्टेक्स्ट इंजन Codex थ्रेड-बूटस्ट्रैप प्रोजेक्शन का अनुरोध करता है, तो OpenClaw
टूल-कॉल नाम और आईडी, इनपुट शेप्स, और रिडैक्ट की गई टूल-परिणाम सामग्री को
नए Codex थ्रेड में प्रोजेक्ट करता है। यह कच्चे टूल-कॉल आर्ग्युमेंट मानों को
उस प्रोजेक्शन में कॉपी नहीं करता।

मिरर में उपयोगकर्ता प्रॉम्प्ट, अंतिम असिस्टेंट टेक्स्ट, और app-server द्वारा उत्सर्जित किए जाने पर हल्के Codex
रीज़निंग या प्लान रिकॉर्ड शामिल होते हैं। OpenClaw नेटिव Compaction शुरू और टर्मिनल स्थिति रिकॉर्ड करता है,
लेकिन यह मानव-पठनीय Compaction सारांश या इस बात की ऑडिट योग्य सूची उजागर नहीं करता
कि Compaction के बाद Codex ने कौन-सी प्रविष्टियां रखीं।

क्योंकि Codex कैनॉनिकल नेटिव थ्रेड का स्वामी है, `tool_result_persist` वर्तमान में
Codex-नेटिव टूल परिणाम रिकॉर्ड को फिर से नहीं लिखता। यह केवल तब लागू होता है
जब OpenClaw किसी OpenClaw-स्वामित्व वाले सेशन ट्रांसक्रिप्ट टूल परिणाम को लिख रहा हो।

## मीडिया और डिलीवरी

OpenClaw मीडिया डिलीवरी और मीडिया प्रदाता चयन का स्वामी बना रहता है। इमेज,
वीडियो, संगीत, PDF, TTS, और मीडिया समझ मिलती-जुलती प्रदाता/मॉडल
सेटिंग्स का उपयोग करते हैं, जैसे `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel`, और `messages.tts`.

टेक्स्ट, इमेज, वीडियो, संगीत, TTS, स्वीकृतियां, और मैसेजिंग-टूल आउटपुट सामान्य
OpenClaw डिलीवरी पथ से जारी रहते हैं। मीडिया जनरेशन के लिए लेगेसी रनटाइम आवश्यक नहीं है।
जब Codex `savedPath` के साथ नेटिव इमेज-जनरेशन आइटम उत्सर्जित करता है, तो OpenClaw
उस सटीक फ़ाइल को सामान्य रिप्लाई-मीडिया पथ से आगे भेजता है, भले ही Codex
टर्न में कोई असिस्टेंट टेक्स्ट न हो।

## संबंधित

- [Codex हार्नेस](/hi/plugins/codex-harness)
- [Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference)
- [नेटिव Codex plugins](/hi/plugins/codex-native-plugins)
- [Plugin हुक्स](/hi/plugins/hooks)
- [एजेंट हार्नेस plugins](/hi/plugins/sdk-agent-harness)
- [डायग्नॉस्टिक्स एक्सपोर्ट](/hi/gateway/diagnostics)
- [ट्रैजेक्टरी एक्सपोर्ट](/hi/tools/trajectory)
