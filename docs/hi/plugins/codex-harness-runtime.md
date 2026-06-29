---
read_when:
    - आपको Codex harness runtime support contract की आवश्यकता है
    - आप नेटिव Codex टूल्स, हुक्स, Compaction, या फ़ीडबैक अपलोड को डीबग कर रहे हैं
    - आप OpenClaw और Codex हार्नेस टर्न्स में Plugin का व्यवहार बदल रहे हैं
summary: Codex हार्नेस के लिए रनटाइम सीमाएँ, हुक, टूल, अनुमतियाँ और डायग्नोस्टिक्स
title: Codex हार्नेस रनटाइम
x-i18n:
    generated_at: "2026-06-28T23:33:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

यह पृष्ठ Codex हार्नेस टर्न के लिए रनटाइम अनुबंध का दस्तावेज़ीकरण करता है। सेटअप और
रूटिंग के लिए, [Codex हार्नेस](/hi/plugins/codex-harness) से शुरू करें। कॉन्फ़िग फ़ील्ड के लिए,
[Codex हार्नेस संदर्भ](/hi/plugins/codex-harness-reference) देखें।

## अवलोकन

Codex मोड केवल नीचे एक अलग मॉडल कॉल वाला OpenClaw नहीं है। Codex मूल
मॉडल लूप का अधिक स्वामित्व रखता है, और OpenClaw उस सीमा के इर्द-गिर्द अपनी Plugin, टूल, सत्र, और
नैदानिक सतहों को अनुकूलित करता है।

OpenClaw अभी भी चैनल रूटिंग, सत्र फ़ाइलों, दृश्यमान संदेश डिलीवरी,
OpenClaw डायनेमिक टूल्स, अनुमोदनों, मीडिया डिलीवरी, और ट्रांसक्रिप्ट मिरर का स्वामी है।
Codex कैननिकल मूल थ्रेड, मूल मॉडल लूप, मूल टूल
कंटिन्यूएशन, और मूल Compaction का स्वामी है।

प्रॉम्प्ट रूटिंग चयनित रनटाइम का अनुसरण करती है, केवल प्रोवाइडर स्ट्रिंग का नहीं। एक
मूल Codex टर्न को Codex ऐप-सर्वर डेवलपर निर्देश मिलते हैं, जबकि एक
स्पष्ट OpenClaw संगतता रूट सामान्य OpenClaw सिस्टम प्रॉम्प्ट को बनाए रखता है, भले ही
वह Codex-स्वाद वाले OpenAI auth या ट्रांसपोर्ट का उपयोग करे।

मूल Codex सक्रिय Codex थ्रेड कॉन्फ़िग के अनुसार Codex-स्वामित्व वाले आधार/मॉडल निर्देश और प्रोजेक्ट-डॉक व्यवहार
बनाए रखता है। OpenClaw मूल
Codex थ्रेड्स को Codex की अंतर्निहित पर्सनैलिटी अक्षम करके शुरू और फिर से शुरू करता है, ताकि वर्कस्पेस
पर्सनैलिटी फ़ाइलें और OpenClaw एजेंट पहचान आधिकारिक बनी रहें। हल्के
OpenClaw रन अब भी अपने मौजूदा प्रोजेक्ट-डॉक दमन को सुरक्षित रखते हैं। OpenClaw
डेवलपर निर्देश OpenClaw रनटाइम चिंताओं को कवर करते हैं, जैसे स्रोत-चैनल
डिलीवरी, OpenClaw डायनेमिक टूल्स, ACP डेलिगेशन, अडैप्टर संदर्भ, और
सक्रिय एजेंट वर्कस्पेस प्रोफ़ाइल फ़ाइलें। OpenClaw skill कैटलॉग और टूल-रूटेड
`MEMORY.md` पॉइंटर्स को मूल Codex के लिए टर्न-स्कोप्ड सहयोग डेवलपर
निर्देशों के रूप में प्रोजेक्ट किया जाता है। सक्रिय `BOOTSTRAP.md` सामग्री और पूर्ण
`MEMORY.md` फ़ॉलबैक इंजेक्शन अब भी टर्न इनपुट संदर्भ कॉन्टेक्स्ट का उपयोग करते हैं।

## थ्रेड बाइंडिंग और मॉडल परिवर्तन

जब कोई OpenClaw सत्र किसी मौजूदा Codex थ्रेड से जुड़ा होता है, तो अगला टर्न
वर्तमान में चयनित OpenAI मॉडल, अनुमोदन नीति, सैंडबॉक्स, और सेवा
स्तर को फिर से ऐप-सर्वर को भेजता है। `openai/gpt-5.5` से
`openai/gpt-5.2` पर स्विच करने से थ्रेड बाइंडिंग बनी रहती है, लेकिन Codex से
नए चयनित मॉडल के साथ जारी रखने को कहा जाता है।

## दृश्यमान जवाब और Heartbeat

जब कोई डायरेक्ट/स्रोत चैट टर्न Codex हार्नेस के माध्यम से चलता है, तो दृश्यमान जवाब
आंतरिक WebChat सतहों के लिए डिफ़ॉल्ट रूप से स्वचालित अंतिम असिस्टेंट डिलीवरी पर रहते हैं।
यह Codex को Pi हार्नेस प्रॉम्प्ट अनुबंध के साथ संरेखित रखता है: एजेंट सामान्य रूप से जवाब देते हैं,
और OpenClaw अंतिम टेक्स्ट को स्रोत वार्तालाप में पोस्ट करता है। जब किसी डायरेक्ट/स्रोत चैट को
अंतिम असिस्टेंट टेक्स्ट को जानबूझकर निजी रखना हो, जब तक एजेंट
`message(action="send")` कॉल न करे, तब
`messages.visibleReplies: "message_tool"` सेट करें।

Codex Heartbeat टर्न को डिफ़ॉल्ट रूप से खोजयोग्य OpenClaw
टूल कैटलॉग में `heartbeat_respond` भी मिलता है, ताकि एजेंट रिकॉर्ड कर सके कि वेक शांत रहना चाहिए
या सूचित करना चाहिए, बिना उस नियंत्रण प्रवाह को अंतिम टेक्स्ट में एन्कोड किए।

Heartbeat-विशिष्ट पहल मार्गदर्शन Heartbeat टर्न पर ही Codex सहयोग-मोड
डेवलपर निर्देश के रूप में भेजा जाता है। सामान्य चैट टर्न
अपने सामान्य रनटाइम प्रॉम्प्ट में Heartbeat दर्शन को साथ ले जाने के बजाय
Codex Default मोड पुनर्स्थापित करते हैं। जब गैर-खाली `HEARTBEAT.md` मौजूद हो, तो Heartbeat
सहयोग-मोड निर्देश Codex को उसकी सामग्री इनलाइन करने के बजाय फ़ाइल की ओर इंगित करते हैं।

## हुक सीमाएँ

Codex हार्नेस में तीन हुक परतें हैं:

| परत                                  | स्वामी                    | उद्देश्य                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin हुक                 | OpenClaw                 | OpenClaw और Codex हार्नेसों में उत्पाद/Plugin संगतता।   |
| Codex ऐप-सर्वर एक्सटेंशन मिडलवेयर | OpenClaw बंडल्ड plugins | OpenClaw डायनेमिक टूल्स के इर्द-गिर्द प्रति-टर्न अडैप्टर व्यवहार।            |
| Codex मूल हुक                    | Codex                    | Codex कॉन्फ़िग से निम्न-स्तरीय Codex जीवनचक्र और मूल टूल नीति। |

OpenClaw, OpenClaw Plugin व्यवहार को रूट करने के लिए प्रोजेक्ट या ग्लोबल Codex `hooks.json` फ़ाइलों का उपयोग नहीं करता।
समर्थित मूल टूल और अनुमति ब्रिज के लिए,
OpenClaw `PreToolUse`, `PostToolUse`,
`PermissionRequest`, और `Stop` के लिए प्रति-थ्रेड Codex कॉन्फ़िग इंजेक्ट करता है।

जब Codex ऐप-सर्वर अनुमोदन सक्षम हों, अर्थात `approvalPolicy`
`"never"` नहीं है, तो डिफ़ॉल्ट इंजेक्टेड मूल हुक कॉन्फ़िग `PermissionRequest` को छोड़ देता है ताकि
Codex का ऐप-सर्वर समीक्षक और OpenClaw का अनुमोदन ब्रिज समीक्षा के बाद वास्तविक
एस्केलेशन संभालें। जब ऑपरेटरों को संगतता रिले की आवश्यकता हो, तो वे स्पष्ट रूप से
`nativeHookRelay.events` में `permission_request` जोड़ सकते हैं।

अन्य Codex हुक जैसे `SessionStart` और `UserPromptSubmit`
Codex-स्तरीय नियंत्रण बने रहते हैं। उन्हें v1
अनुबंध में OpenClaw Plugin हुक के रूप में उजागर नहीं किया गया है।

OpenClaw डायनेमिक टूल्स के लिए, Codex द्वारा कॉल मांगने के बाद OpenClaw टूल निष्पादित करता है,
इसलिए OpenClaw हार्नेस अडैप्टर में अपने स्वामित्व वाला Plugin और मिडलवेयर व्यवहार चलाता है।
Codex-मूल टूल्स के लिए, Codex कैननिकल टूल रिकॉर्ड का स्वामी है।
OpenClaw चयनित घटनाओं को मिरर कर सकता है, लेकिन वह मूल Codex
थ्रेड को फिर से नहीं लिख सकता, जब तक Codex उस ऑपरेशन को ऐप-सर्वर या मूल हुक
कॉलबैक के माध्यम से उजागर न करे।

Codex ऐप-सर्वर रिपोर्ट-मोड `PreToolUse` घटनाएं Plugin अनुमोदन अनुरोधों को
मेल खाते ऐप-सर्वर अनुमोदन तक स्थगित करती हैं। यदि कोई OpenClaw `before_tool_call` हुक
`requireApproval` लौटाता है जबकि मूल पेलोड रिपोर्ट अनुमोदन मोड सेट करता है
(`openclaw_approval_mode` `"report"` है), तो मूल हुक रिले
Plugin अनुमोदन आवश्यकता रिकॉर्ड करता है और कोई मूल निर्णय नहीं लौटाता। जब Codex
उसी टूल उपयोग के लिए ऐप-सर्वर अनुमोदन अनुरोध भेजता है, तो OpenClaw Plugin
अनुमोदन प्रॉम्प्ट खोलता है और निर्णय को वापस Codex पर मैप करता है। Codex `PermissionRequest`
घटनाएं एक अलग अनुमोदन पथ हैं और रनटाइम को उस ब्रिज के लिए कॉन्फ़िगर किए जाने पर
अब भी OpenClaw अनुमोदनों के माध्यम से रूट हो सकती हैं।

Codex ऐप-सर्वर आइटम सूचनाएं मूल टूल पूर्णताओं के लिए async `after_tool_call`
अवलोकन भी प्रदान करती हैं, जो पहले से मूल `PostToolUse` रिले द्वारा कवर नहीं हैं।
ये अवलोकन केवल टेलीमेट्री और Plugin संगतता के लिए हैं; वे मूल टूल कॉल को
ब्लॉक, विलंबित, या परिवर्तित नहीं कर सकते।

Compaction और LLM जीवनचक्र प्रोजेक्शन Codex ऐप-सर्वर
सूचनाओं और OpenClaw अडैप्टर स्थिति से आते हैं, मूल Codex हुक कमांड से नहीं।
OpenClaw के `before_compaction`, `after_compaction`, `llm_input`, और
`llm_output` घटनाएं अडैप्टर-स्तरीय अवलोकन हैं, Codex के आंतरिक अनुरोध या Compaction पेलोड्स की
बाइट-दर-बाइट कैप्चर नहीं।

Codex मूल `hook/started` और `hook/completed` ऐप-सर्वर सूचनाएं
ट्रैजेक्टरी और डिबगिंग के लिए `codex_app_server.hook` एजेंट घटनाओं के रूप में
प्रोजेक्ट की जाती हैं।
वे OpenClaw Plugin हुक नहीं चलातीं।

## V1 समर्थन अनुबंध

Codex रनटाइम v1 में समर्थित:

| सतह                                          | समर्थन                                                                          | कारण                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex के माध्यम से OpenAI मॉडल लूप               | समर्थित                                                                        | Codex ऐप-सर्वर OpenAI टर्न, नेटिव थ्रेड रिज्यूम, और नेटिव टूल निरंतरता का स्वामी है।                                                                                                                                                                                                                                                                                                                                                                                          |
| OpenClaw चैनल रूटिंग और डिलीवरी         | समर्थित                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage, और अन्य चैनल मॉडल रनटाइम के बाहर रहते हैं।                                                                                                                                                                                                                                                                                                                                                                                    |
| OpenClaw डायनेमिक टूल                        | समर्थित                                                                        | Codex OpenClaw से इन टूल्स को निष्पादित करने के लिए कहता है, इसलिए OpenClaw निष्पादन पथ में रहता है।                                                                                                                                                                                                                                                                                                                                                                                                |
| प्रॉम्प्ट और कॉन्टेक्स्ट plugins                    | समर्थित                                                                        | OpenClaw OpenClaw-विशिष्ट प्रॉम्प्ट/कॉन्टेक्स्ट को Codex टर्न में प्रोजेक्ट करता है, जबकि Codex-स्वामित्व वाले बेस, मॉडल, और कॉन्फिगर किए गए प्रोजेक्ट-डॉक प्रॉम्प्ट नेटिव Codex लेन में रहते हैं। OpenClaw नेटिव थ्रेड्स के लिए Codex की बिल्ट-इन पर्सनैलिटी को निष्क्रिय करता है ताकि एजेंट वर्कस्पेस पर्सनैलिटी फाइलें अधिकृत बनी रहें। नेटिव Codex डेवलपर निर्देश केवल `codex_app_server` के लिए स्पष्ट रूप से स्कोप किए गए कमांड मार्गदर्शन को स्वीकार करते हैं; लेगसी वैश्विक कमांड संकेत गैर-Codex प्रॉम्प्ट सतहों के लिए बने रहते हैं। |
| कॉन्टेक्स्ट इंजन लाइफसाइकल                      | समर्थित                                                                        | असेंबल, इंजेस्ट, और आफ्टर-टर्न रखरखाव Codex टर्न्स के आसपास चलते हैं। कॉन्टेक्स्ट इंजन नेटिव Codex Compaction को प्रतिस्थापित नहीं करते।                                                                                                                                                                                                                                                                                                                                                        |
| डायनेमिक टूल हुक्स                            | समर्थित                                                                        | `before_tool_call`, `after_tool_call`, और टूल-रिजल्ट मिडलवेयर OpenClaw-स्वामित्व वाले डायनेमिक टूल्स के आसपास चलते हैं।                                                                                                                                                                                                                                                                                                                                                                          |
| लाइफसाइकल हुक्स                               | अडैप्टर अवलोकनों के रूप में समर्थित                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, और `after_compaction` ईमानदार Codex-मोड पेलोड्स के साथ फायर होते हैं।                                                                                                                                                                                                                                                                                                                                                           |
| अंतिम-उत्तर संशोधन गेट                    | नेटिव हुक रिले के माध्यम से समर्थित                                              | Codex `Stop` को `before_agent_finalize` तक रिले किया जाता है; `revise` अंतिम रूप देने से पहले Codex से एक और मॉडल पास मांगता है।                                                                                                                                                                                                                                                                                                                                                                |
| नेटिव shell, patch, और MCP ब्लॉक या अवलोकन | नेटिव हुक रिले के माध्यम से समर्थित                                              | Codex `PreToolUse` और `PostToolUse` प्रतिबद्ध नेटिव टूल सतहों के लिए रिले किए जाते हैं, जिसमें Codex ऐप-सर्वर `0.125.0` या नए पर MCP पेलोड्स शामिल हैं। ब्लॉकिंग समर्थित है; आर्ग्युमेंट री-राइटिंग नहीं।                                                                                                                                                                                                                                                                               |
| नेटिव अनुमति नीति                      | Codex ऐप-सर्वर अनुमोदनों और संगतता नेटिव हुक रिले के माध्यम से समर्थित | Codex ऐप-सर्वर अनुमोदन अनुरोध Codex समीक्षा के बाद OpenClaw के माध्यम से रूट होते हैं। `PermissionRequest` नेटिव हुक रिले नेटिव अनुमोदन मोड्स के लिए ऑप्ट-इन है क्योंकि Codex इसे गार्डियन समीक्षा से पहले उत्सर्जित करता है।                                                                                                                                                                                                                                                                          |
| ऐप-सर्वर ट्रैजेक्टरी कैप्चर                 | समर्थित                                                                        | OpenClaw ऐप-सर्वर को भेजे गए अनुरोध और प्राप्त ऐप-सर्वर नोटिफिकेशन रिकॉर्ड करता है।                                                                                                                                                                                                                                                                                                                                                                                    |

Codex रनटाइम v1 में समर्थित नहीं:

| सतह                                             | V1 सीमा                                                                                                                                     | भावी पथ                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| नेटिव टूल आर्ग्युमेंट म्यूटेशन                       | Codex नेटिव प्री-टूल हुक्स ब्लॉक कर सकते हैं, लेकिन OpenClaw Codex-नेटिव टूल आर्ग्युमेंट्स को फिर से नहीं लिखता।                                               | प्रतिस्थापन टूल इनपुट के लिए Codex हुक/स्कीमा समर्थन आवश्यक है।                            |
| संपादन योग्य Codex-नेटिव ट्रांसक्रिप्ट इतिहास            | Codex कैनॉनिकल नेटिव थ्रेड इतिहास का स्वामी है। OpenClaw एक मिरर का स्वामी है और भावी कॉन्टेक्स्ट प्रोजेक्ट कर सकता है, लेकिन असमर्थित आंतरिक हिस्सों को म्यूटेट नहीं करना चाहिए। | यदि नेटिव थ्रेड सर्जरी की आवश्यकता हो तो स्पष्ट Codex ऐप-सर्वर API जोड़ें।                    |
| Codex-नेटिव टूल रिकॉर्ड्स के लिए `tool_result_persist` | वह हुक OpenClaw-स्वामित्व वाली ट्रांसक्रिप्ट राइट्स को रूपांतरित करता है, Codex-नेटिव टूल रिकॉर्ड्स को नहीं।                                                           | रूपांतरित रिकॉर्ड्स को मिरर कर सकता है, लेकिन कैनॉनिकल री-राइट के लिए Codex समर्थन चाहिए।              |
| समृद्ध नेटिव Compaction मेटाडेटा                     | OpenClaw नेटिव Compaction का अनुरोध कर सकता है, लेकिन स्थिर रखी/छोड़ी गई सूची, टोकन डेल्टा, पूर्णता सारांश, या सारांश पेलोड प्राप्त नहीं करता।   | अधिक समृद्ध Codex Compaction ईवेंट्स चाहिए।                                                     |
| Compaction हस्तक्षेप                             | OpenClaw plugins या कॉन्टेक्स्ट इंजनों को नेटिव Codex Compaction को वीटो, री-राइट, या प्रतिस्थापित करने नहीं देता।                                             | यदि plugins को नेटिव Compaction को वीटो या री-राइट करने की आवश्यकता हो तो Codex प्री/पोस्ट Compaction हुक्स जोड़ें। |
| बाइट-फॉर-बाइट मॉडल API अनुरोध कैप्चर             | OpenClaw ऐप-सर्वर अनुरोधों और नोटिफिकेशन को कैप्चर कर सकता है, लेकिन Codex कोर अंतिम OpenAI API अनुरोध आंतरिक रूप से बनाता है।                      | Codex मॉडल-अनुरोध ट्रेसिंग ईवेंट या डीबग API चाहिए।                                   |

## नेटिव अनुमतियां और MCP एलिसिटेशन

`PermissionRequest` के लिए, OpenClaw केवल स्पष्ट अनुमति या अस्वीकार निर्णय लौटाता है
जब नीति निर्णय लेती है। कोई-निर्णय-नहीं परिणाम अनुमति नहीं है। Codex इसे कोई
हुक निर्णय नहीं मानता और अपने गार्डियन या उपयोगकर्ता अनुमोदन पथ पर आगे बढ़ता है।

Codex ऐप-सर्वर अनुमोदन मोड डिफ़ॉल्ट रूप से इस नेटिव हुक को छोड़ देते हैं। यह व्यवहार
तब लागू होता है जब `permission_request` को स्पष्ट रूप से
`nativeHookRelay.events` में शामिल किया जाता है या कोई संगतता रनटाइम इसे इंस्टॉल करता है।

जब कोई ऑपरेटर Codex नेटिव अनुमति अनुरोध के लिए `allow-always` चुनता है,
OpenClaw सीमित सत्र विंडो के लिए वही सटीक प्रदाता/सत्र/टूल इनपुट/cwd फिंगरप्रिंट
याद रखता है। याद रखा गया निर्णय जानबूझकर केवल सटीक-मिलान है:
बदला हुआ कमांड, आर्ग्युमेंट्स, टूल पेलोड, या cwd नया अनुमोदन बनाता है।

Codex MCP टूल अनुमोदन एलिसिटेशन OpenClaw के Plugin
अनुमोदन प्रवाह के माध्यम से रूट किए जाते हैं जब Codex `_meta.codex_approval_kind` को
`"mcp_tool_call"` के रूप में चिह्नित करता है। Codex `request_user_input` प्रॉम्प्ट्स
मूल चैट पर वापस भेजे जाते हैं, और अगला कतारबद्ध फॉलो-अप संदेश उस नेटिव
सर्वर अनुरोध का उत्तर देता है, बजाय इसके कि उसे अतिरिक्त कॉन्टेक्स्ट के रूप में मोड़ा जाए। अन्य MCP एलिसिटेशन
अनुरोध fail closed होते हैं।

इन प्रॉम्प्ट्स को ले जाने वाले सामान्य Plugin अनुमोदन प्रवाह के लिए, देखें
[Plugin अनुमति अनुरोध](/hi/plugins/plugin-permission-requests).

## क्यू स्टीयरिंग

सक्रिय-रन क्यू स्टीयरिंग Codex ऐप-सर्वर `turn/steer` पर मैप होती है। डिफ़ॉल्ट
`messages.queue.mode: "steer"` के साथ, OpenClaw कॉन्फिगर की गई शांत विंडो के लिए
steer-मोड चैट संदेशों को बैच करता है और उन्हें आगमन क्रम में एक `turn/steer`
अनुरोध के रूप में भेजता है।

Codex समीक्षा और मैनुअल Compaction टर्न same-turn steering को अस्वीकार कर सकते हैं। उस
स्थिति में, OpenClaw प्रॉम्प्ट शुरू करने से पहले सक्रिय रन के समाप्त होने की प्रतीक्षा करता है।
जब संदेशों को steering के बजाय डिफ़ॉल्ट रूप से कतारबद्ध होना चाहिए, तो `/queue followup` या `/queue collect` का उपयोग करें।
[Steering queue](/hi/concepts/queue-steering) देखें।

## Codex feedback upload

जब native Codex
harness का उपयोग करने वाले सत्र के लिए `/diagnostics [note]` स्वीकृत होता है, OpenClaw प्रासंगिक
Codex threads के लिए Codex app-server `feedback/upload` को भी कॉल करता है। अपलोड app-server से प्रत्येक सूचीबद्ध thread
और उपलब्ध होने पर spawned Codex subthreads के लिए logs शामिल करने का अनुरोध करता है।

अपलोड Codex के सामान्य feedback path से OpenAI servers तक जाता है। यदि उस app-server में Codex
feedback अक्षम है, तो command app-server
error लौटाता है। पूर्ण diagnostics reply भेजे गए threads के लिए channels, OpenClaw session ids,
Codex thread ids, और स्थानीय `codex resume <thread-id>` commands सूचीबद्ध करता है।

यदि आप approval को अस्वीकार या अनदेखा करते हैं, तो OpenClaw वे Codex ids प्रिंट नहीं करता और
Codex feedback नहीं भेजता। अपलोड स्थानीय Gateway
diagnostics export को प्रतिस्थापित नहीं करता। approval, privacy, local bundle, और group-chat behavior के लिए
[Diagnostics export](/hi/gateway/diagnostics) देखें।

`/codex diagnostics [note]` का उपयोग केवल तब करें जब आप पूर्ण Gateway
diagnostics bundle के बिना वर्तमान में संलग्न thread के लिए विशेष रूप से Codex
feedback upload चाहते हों।

## Compaction और transcript mirror

जब चयनित model Codex harness का उपयोग करता है, native thread compaction
Codex app-server की होती है। OpenClaw Codex turns के लिए preflight compaction नहीं चलाता,
Codex compaction को context-engine compaction से प्रतिस्थापित नहीं करता, और जब native Codex
compaction शुरू नहीं की जा सकती तो OpenClaw या public OpenAI summarization पर fallback नहीं करता। OpenClaw channel
history, search, `/new`, `/reset`, और भविष्य में model या harness switching के लिए transcript mirror रखता है।

स्पष्ट compaction requests, जैसे `/compact` या plugin-requested manual
compact operation, `thread/compact/start` के साथ native Codex compaction शुरू करते हैं।
OpenClaw उस native operation को शुरू करने के बाद लौट आता है। यह completion की प्रतीक्षा नहीं करता,
अलग OpenClaw timeout लागू नहीं करता, shared Codex
app-server को restart नहीं करता, या operation को OpenClaw-completed compaction के रूप में record नहीं करता।

जब context engine Codex thread-bootstrap projection का अनुरोध करता है, OpenClaw
tool-call names और ids, input shapes, और redacted tool-result content को
fresh Codex thread में project करता है। यह raw tool-call argument values को उस projection में copy नहीं करता।

mirror में user prompt, final assistant text, और app-server द्वारा emit किए जाने पर lightweight Codex
reasoning या plan records शामिल होते हैं। आज, OpenClaw केवल explicit native compaction start signals
record करता है जब वह compaction का अनुरोध करता है। यह human-readable compaction summary या
compaction के बाद Codex ने कौन-सी entries रखीं, इसकी auditable list expose नहीं करता।

क्योंकि Codex canonical native thread का स्वामी है, `tool_result_persist` वर्तमान में
Codex-native tool result records को rewrite नहीं करता। यह केवल तब लागू होता है जब
OpenClaw OpenClaw-owned session transcript tool result लिख रहा हो।

## Media और delivery

OpenClaw media delivery और media provider selection का स्वामित्व जारी रखता है। Image,
video, music, PDF, TTS, और media understanding उपयुक्त provider/model
settings जैसे `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel`, और `messages.tts` का उपयोग करते हैं।

Text, images, video, music, TTS, approvals, और messaging-tool output सामान्य
OpenClaw delivery path से ही जारी रहते हैं। Media generation के लिए legacy runtime की आवश्यकता नहीं होती।
जब Codex `savedPath` के साथ native image-generation item emit करता है, OpenClaw
उस exact file को सामान्य reply-media path से forward करता है, भले ही Codex
turn में कोई assistant text न हो।

## Related

- [Codex harness](/hi/plugins/codex-harness)
- [Codex harness reference](/hi/plugins/codex-harness-reference)
- [Native Codex plugins](/hi/plugins/codex-native-plugins)
- [Plugin hooks](/hi/plugins/hooks)
- [Agent harness plugins](/hi/plugins/sdk-agent-harness)
- [Diagnostics export](/hi/gateway/diagnostics)
- [Trajectory export](/hi/tools/trajectory)
