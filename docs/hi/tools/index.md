---
doc-schema-version: 1
read_when:
    - आप समझना चाहते हैं कि OpenClaw कौन-से टूल प्रदान करता है
    - आप built-in tools, Skills, और plugins के बीच निर्णय ले रहे हैं
    - आपको टूल नीति, ऑटोमेशन, या एजेंट समन्वय के लिए सही दस्तावेज़ प्रवेश बिंदु चाहिए
summary: 'OpenClaw टूल्स, Skills, और plugins का अवलोकन: एजेंट क्या कॉल कर सकते हैं और उन्हें कैसे विस्तारित करें'
title: अवलोकन
x-i18n:
    generated_at: "2026-06-29T00:20:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

सही Capabilities सतह चुनने के लिए इस पृष्ठ का उपयोग करें। **टूल** कॉल किए जा सकने वाले
एक्शन हैं, **Skills** एजेंटों को काम करने का तरीका सिखाते हैं, और **Plugin** रनटाइम
क्षमताएं जोड़ते हैं, जैसे टूल, प्रोवाइडर, चैनल, हुक, और पैकेज की गई Skills।

यह एक अवलोकन और रूटिंग पृष्ठ है। विस्तृत टूल नीति, डिफॉल्ट,
ग्रुप सदस्यता, प्रोवाइडर प्रतिबंध, और कॉन्फिगरेशन फील्ड के लिए,
[टूल और कस्टम प्रोवाइडर](/hi/gateway/config-tools) का उपयोग करें।

## यहां से शुरू करें

अधिकांश एजेंटों के लिए, बिल्ट-इन टूल श्रेणियों से शुरू करें, फिर नीति को
केवल तब समायोजित करें जब एजेंट को कम टूल दिखने चाहिए या स्पष्ट होस्ट एक्सेस चाहिए।

| यदि आपको यह करना है...                           | पहले इसका उपयोग करें                                 | फिर पढ़ें                                                                                                       |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| किसी एजेंट को मौजूदा क्षमताओं के साथ कार्य करने दें | [बिल्ट-इन टूल](#built-in-tool-categories)    | [टूल श्रेणियां](#built-in-tool-categories)                                                                    |
| नियंत्रित करें कि एजेंट क्या कॉल कर सकता है              | [टूल नीति](#configure-access-and-approvals) | [टूल और कस्टम प्रोवाइडर](/hi/gateway/config-tools)                                                             |
| एजेंट को वर्कफ़्लो सिखाएं                   | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/hi/tools/skills), [Skills बनाना](/hi/tools/creating-skills), और [Skill Workshop](/hi/tools/skill-workshop) |
| नया इंटीग्रेशन या रनटाइम सतह जोड़ें    | [Plugin](#extend-capabilities)                | [Plugin](/hi/tools/plugin) और [Plugin बनाएं](/hi/plugins/building-plugins)                                         |
| बाद में या बैकग्राउंड में काम चलाएं         | [Automation](/hi/automation)                      | [Automation अवलोकन](/hi/automation)                                                                              |
| कई एजेंट या हार्नेस समन्वित करें     | [सब-एजेंट](/hi/tools/subagents)                 | [ACP एजेंट](/hi/tools/acp-agents) और [एजेंट भेजें](/hi/tools/agent-send)                                             |
| बड़े OpenClaw टूल कैटलॉग में खोजें        | [टूल खोज](/hi/tools/tool-search)              | [टूल खोज](/hi/tools/tool-search)                                                                               |

## टूल, Skills, या Plugin चुनें

<Steps>
  <Step title="जब एजेंट को कार्य करना हो, तो टूल का उपयोग करें">
    टूल एक टाइप्ड फ़ंक्शन है जिसे एजेंट कॉल कर सकता है, जैसे `exec`, `browser`,
    `web_search`, `message`, या `image_generate`। जब एजेंट को
    डेटा पढ़ना, फाइलें बदलना, संदेश भेजना, प्रोवाइडर कॉल करना, या किसी
    दूसरी प्रणाली को संचालित करना हो, तब टूल का उपयोग करें। दिखने वाले टूल मॉडल को संरचित फ़ंक्शन
    परिभाषाओं के रूप में भेजे जाते हैं।

    मॉडल केवल वे टूल देखता है जो सक्रिय प्रोफ़ाइल, allow/deny
    नीति, प्रोवाइडर प्रतिबंध, सैंडबॉक्स स्थिति, चैनल अनुमतियां, और
    Plugin उपलब्धता से गुजरते हैं।

  </Step>

  <Step title="जब एजेंट को निर्देश चाहिए हों, तो Skill का उपयोग करें">
    Skill एक `SKILL.md` निर्देश पैक है जो एजेंट प्रॉम्प्ट में लोड होता है। Skill का उपयोग
    तब करें जब एजेंट के पास आवश्यक टूल पहले से हों, लेकिन उसे दोहराए जा सकने वाला
    वर्कफ़्लो, समीक्षा रूब्रिक, कमांड क्रम, या संचालन संबंधी बाधा चाहिए हो।

    Skills वर्कस्पेस, साझा skill डायरेक्टरी, प्रबंधित OpenClaw
    skill रूट, या Plugin पैकेज में रह सकती हैं।

    [Skills](/hi/tools/skills) | [Skill Workshop](/hi/tools/skill-workshop) | [Skills बनाना](/hi/tools/creating-skills) | [Skills कॉन्फिग](/hi/tools/skills-config)

  </Step>

  <Step title="जब OpenClaw को नई क्षमता चाहिए हो, तो Plugin का उपयोग करें">
    Plugin टूल, Skills, चैनल, मॉडल प्रोवाइडर, स्पीच, रीयलटाइम
    वॉयस, मीडिया जनरेशन, वेब खोज, वेब फेच, हुक, और अन्य रनटाइम
    क्षमताएं जोड़ सकता है। जब क्षमता में कोड, क्रेडेंशियल,
    लाइफसाइकल हुक, मैनिफेस्ट मेटाडेटा, या इंस्टॉल किया जा सकने वाला पैकेजिंग हो, तब Plugin का उपयोग करें। मौजूदा
    Plugin ClawHub, npm, git, लोकल डायरेक्टरी, या
    आर्काइव से इंस्टॉल किए जा सकते हैं।

    [Plugin इंस्टॉल और कॉन्फिगर करें](/hi/tools/plugin) | [Plugin बनाएं](/hi/plugins/building-plugins) | [Plugin SDK](/hi/plugins/sdk-overview)

  </Step>
</Steps>

## बिल्ट-इन टूल श्रेणियां

तालिका प्रतिनिधि टूल सूचीबद्ध करती है ताकि आप सतह को पहचान सकें। यह
पूर्ण नीति संदर्भ नहीं है। सटीक ग्रुप, डिफॉल्ट, और allow/deny
सेमांटिक्स के लिए, [टूल और कस्टम प्रोवाइडर](/hi/gateway/config-tools) का उपयोग करें।

| श्रेणी                | उपयोग तब करें जब एजेंट को यह करना हो...                                                | प्रतिनिधि टूल                                                 | आगे पढ़ें                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| रनटाइम                 | कमांड चलाना, प्रक्रियाएं प्रबंधित करना, या प्रोवाइडर-समर्थित Python विश्लेषण का उपयोग करना        | `exec`, `process`, `code_execution`                                  | [Exec](/hi/tools/exec), [कोड निष्पादन](/hi/tools/code-execution)                                |
| फाइलें                   | वर्कस्पेस फाइलें पढ़ना और बदलना                                               | `read`, `write`, `edit`, `apply_patch`                               | [Apply patch](/hi/tools/apply-patch)                                                           |
| वेब                     | वेब खोजना, X पोस्ट खोजना, या पढ़ने योग्य पृष्ठ सामग्री फेच करना                | `web_search`, `x_search`, `web_fetch`                                | [वेब टूल](/hi/tools/web), [वेब फेच](/hi/tools/web-fetch)                                      |
| ब्राउज़र                 | ब्राउज़र सत्र संचालित करना                                                     | `browser`                                                            | [ब्राउज़र](/hi/tools/browser)                                                                   |
| मैसेजिंग और चैनल  | जवाब या चैनल एक्शन भेजना                                               | `message`                                                            | [एजेंट भेजें](/hi/tools/agent-send)                                                             |
| सत्र और एजेंट     | सत्र निरीक्षण करना, काम डेलिगेट करना, दूसरा रन संचालित करना, या स्थिति रिपोर्ट करना          | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`   | [Goal](/hi/tools/goal), [सब-एजेंट](/hi/tools/subagents), [सत्र टूल](/hi/concepts/session-tool) |
| Automation              | काम शेड्यूल करना या बैकग्राउंड घटनाओं का जवाब देना                                 | `cron`, `heartbeat_respond`                                          | [Automation](/hi/automation)                                                                   |
| Gateway और नोड       | Gateway स्थिति या पेयर्ड लक्षित डिवाइस निरीक्षण करना                                | `gateway`, `nodes`                                                   | [Gateway कॉन्फिगरेशन](/hi/gateway/configuration), [नोड](/hi/nodes)                            |
| मीडिया                   | मीडिया का विश्लेषण, जनरेशन, या वाचन करना                                             | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [मीडिया अवलोकन](/hi/tools/media-overview)                                                     |
| बड़े OpenClaw कैटलॉग | हर स्कीमा मॉडल को भेजे बिना कई पात्र टूल खोजना और कॉल करना | `tool_search_code`, `tool_search`, `tool_describe`                   | [टूल खोज](/hi/tools/tool-search)                                                           |

<Note>
टूल खोज एक प्रयोगात्मक OpenClaw एजेंट सतह है। Codex हार्नेस रन
`tools.toolSearch` के बजाय Codex-नेटिव कोड मोड, नेटिव टूल खोज, स्थगित
डायनमिक टूल, और नेस्टेड टूल कॉल का उपयोग करते हैं।
</Note>

## Plugin-प्रदत्त टूल

Plugin अतिरिक्त टूल रजिस्टर कर सकते हैं। Plugin लेखक टूल को
`api.registerTool(...)` और मैनिफेस्ट के `contracts.tools` के माध्यम से वायर करते हैं; कॉन्ट्रैक्ट विवरण के लिए
[Plugin SDK](/hi/plugins/sdk-overview) और [Plugin मैनिफेस्ट](/hi/plugins/manifest)
का उपयोग करें।

सामान्य Plugin-प्रदत्त टूल में शामिल हैं:

- फाइल और markdown diff रेंडर करने के लिए [Diffs](/hi/tools/diffs)
- केवल JSON वर्कफ़्लो चरणों के लिए [LLM Task](/hi/tools/llm-task)
- फिर से शुरू की जा सकने वाली स्वीकृतियों वाले टाइप्ड वर्कफ़्लो के लिए [Lobster](/hi/tools/lobster)
- शोर वाले `exec` और `bash` टूल आउटपुट को संक्षिप्त करने के लिए
  [Tokenjuice](/hi/tools/tokenjuice)
- हर स्कीमा को प्रॉम्प्ट में डाले बिना बड़े टूल
  कैटलॉग खोजने और कॉल करने के लिए [टूल खोज](/hi/tools/tool-search)
- नोड Canvas नियंत्रण और A2UI
  रेंडरिंग के लिए [Canvas](/hi/plugins/reference/canvas)

## एक्सेस और स्वीकृतियां कॉन्फिगर करें

टूल नीति मॉडल कॉल से पहले लागू की जाती है। यदि नीति कोई टूल हटाती है, तो
मॉडल को उस टर्न के लिए उस टूल का स्कीमा नहीं मिलता। कोई रन टूल खो सकता है
क्योंकि ग्लोबल कॉन्फिग, प्रति-एजेंट कॉन्फिग, चैनल नीति, प्रोवाइडर
प्रतिबंध, सैंडबॉक्स नियम, चैनल/रनटाइम नीति, या Plugin उपलब्धता लागू हो सकती है।

- [टूल और कस्टम प्रोवाइडर](/hi/gateway/config-tools) टूल प्रोफ़ाइल,
  allow/deny सूचियां, प्रोवाइडर-विशिष्ट प्रतिबंध, लूप डिटेक्शन, और
  प्रोवाइडर-समर्थित टूल सेटिंग्स दस्तावेजित करता है।
- [Exec स्वीकृतियां](/hi/tools/exec-approvals) होस्ट कमांड स्वीकृति
  नीति दस्तावेजित करता है।
- [Elevated exec](/hi/tools/elevated) सैंडबॉक्स के बाहर नियंत्रित निष्पादन
  दस्तावेजित करता है।
- [सैंडबॉक्स बनाम टूल नीति बनाम elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) समझाता है कि कौन सी परत फाइल और प्रक्रिया एक्सेस नियंत्रित करती है।
- [प्रति-एजेंट सैंडबॉक्स और टूल प्रतिबंध](/hi/tools/multi-agent-sandbox-tools)
  डेलिगेटेड रन के लिए एजेंट-विशिष्ट प्रतिबंध दस्तावेजित करता है।

## क्षमताएं बढ़ाएं

जिस काम के लिए आपको OpenClaw चाहिए, उसके आधार पर एक्सटेंशन पथ चुनें:

- मौजूदा Plugin को [Plugin](/hi/tools/plugin) के साथ इंस्टॉल या प्रबंधित करें।
- नया इंटीग्रेशन, प्रोवाइडर, चैनल, टूल, या हुक
  [Plugin बनाएं](/hi/plugins/building-plugins) के साथ बनाएं।
- [Skills](/hi/tools/skills) और
  [Skills बनाना](/hi/tools/creating-skills) के साथ पुन: उपयोग योग्य एजेंट निर्देश जोड़ें या ट्यून करें।
- जब आपको इम्प्लीमेंटेशन कॉन्ट्रैक्ट चाहिए हों, तो [Plugin SDK](/hi/plugins/sdk-overview) और [Plugin मैनिफेस्ट](/hi/plugins/manifest) का उपयोग करें।

## गायब टूल की समस्या सुलझाएं

यदि मॉडल कोई टूल देख या कॉल नहीं कर सकता, तो मौजूदा टर्न की प्रभावी नीति से
शुरू करें:

1. सक्रिय प्रोफ़ाइल, `tools.allow`, और `tools.deny` को
   [टूल और कस्टम प्रोवाइडर](/hi/gateway/config-tools) में जांचें।
2. [टूल और कस्टम प्रोवाइडर](/hi/gateway/config-tools) में
   प्रोवाइडर-विशिष्ट प्रतिबंध जांचें और पुष्टि करें कि चुना गया
   [मॉडल प्रोवाइडर](/hi/concepts/model-providers) टूल आकार का समर्थन करता है।
3. चैनल अनुमतियां, सैंडबॉक्स स्थिति, और elevated एक्सेस को
   [सैंडबॉक्स बनाम टूल नीति बनाम elevated](/hi/gateway/sandbox-vs-tool-policy-vs-elevated) और [Elevated exec](/hi/tools/elevated) के साथ जांचें।
4. जांचें कि मालिक Plugin इंस्टॉल और सक्षम है या नहीं
   [Plugin](/hi/tools/plugin) में।
5. डेलिगेटेड रन के लिए,
   [प्रति-एजेंट सैंडबॉक्स और टूल प्रतिबंध](/hi/tools/multi-agent-sandbox-tools) में प्रति-एजेंट प्रतिबंध जांचें।
6. बड़े OpenClaw कैटलॉग के लिए, पुष्टि करें कि रन सीधे टूल एक्सपोजर का उपयोग करता है या
   [टूल खोज](/hi/tools/tool-search) का।

## संबंधित

- cron, कार्य, heartbeat, commitments, हुक, standing orders, और Task Flow के लिए [Automation](/hi/automation)
- एजेंट मॉडल, सत्र, मेमोरी, और मल्टी-एजेंट समन्वय के लिए [एजेंट](/hi/concepts/agent)
- कैननिकल टूल नीति संदर्भ के लिए [टूल और कस्टम प्रोवाइडर](/hi/gateway/config-tools)
- Plugin इंस्टॉलेशन और प्रबंधन के लिए [Plugin](/hi/tools/plugin)
- Plugin लेखक संदर्भ के लिए [Plugin SDK](/hi/plugins/sdk-overview)
- skill लोड क्रम, gating, और कॉन्फिग के लिए [Skills](/hi/tools/skills)
- जनरेट और समीक्षा की गई skill बनाने के लिए [Skill Workshop](/hi/tools/skill-workshop)
- संक्षिप्त OpenClaw टूल कैटलॉग खोज के लिए [टूल खोज](/hi/tools/tool-search)
