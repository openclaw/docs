---
read_when:
    - Skills जोड़ना या संशोधित करना
    - Skills की गेटिंग, अनुमति-सूचियाँ या लोड नियम बदलना
    - Skills की प्राथमिकता और स्नैपशॉट व्यवहार को समझना
sidebarTitle: Skills
summary: Skills आपके एजेंट को टूल का उपयोग करना सिखाते हैं। जानें कि वे कैसे लोड होते हैं, वरीयता कैसे काम करती है, और गेटिंग, अनुमत-सूचियों तथा एनवायरनमेंट इंजेक्शन को कैसे कॉन्फ़िगर किया जाता है।
title: Skills
x-i18n:
    generated_at: "2026-07-16T17:36:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills मार्कडाउन निर्देश फ़ाइलें हैं, जो एजेंट को सिखाती हैं कि टूल्स का उपयोग कैसे और कब करना है।
प्रत्येक skill एक ऐसी डायरेक्टरी में रहती है जिसमें YAML frontmatter और मार्कडाउन
बॉडी वाली `SKILL.md` फ़ाइल होती है। OpenClaw बंडल की गई skills के साथ सभी स्थानीय
ओवरराइड लोड करता है और लोड करते समय उन्हें परिवेश, कॉन्फ़िगरेशन और
बाइनरी की उपलब्धता के आधार पर फ़िल्टर करता है।

<CardGroup cols={2}>
  <Card title="Skills बनाना" href="/hi/tools/creating-skills" icon="hammer">
    शुरुआत से एक कस्टम skill बनाएँ और उसका परीक्षण करें।
  </Card>
  <Card title="Skill Workshop" href="/hi/tools/skill-workshop" icon="flask">
    एजेंट द्वारा तैयार किए गए skill प्रस्तावों की समीक्षा करें और उन्हें स्वीकृत करें।
  </Card>
  <Card title="Skills कॉन्फ़िगरेशन" href="/hi/tools/skills-config" icon="gear">
    संपूर्ण `skills.*` कॉन्फ़िगरेशन स्कीमा और एजेंट अनुमति-सूचियाँ।
  </Card>
  <Card title="ClawHub" href="/hi/clawhub" icon="cloud">
    समुदाय की skills ब्राउज़ और इंस्टॉल करें।
  </Card>
</CardGroup>

## लोडिंग क्रम

OpenClaw इन स्रोतों से लोड करता है, **सर्वोच्च प्राथमिकता पहले**। जब समान
skill नाम कई स्थानों पर दिखाई देता है, तो सर्वोच्च स्रोत प्रभावी होता है।

| प्राथमिकता   | स्रोत                   | पथ                                     |
| ------------ | ----------------------- | --------------------------------------- |
| 1 — सर्वोच्च | वर्कस्पेस skills        | `<workspace>/skills`                    |
| 2            | प्रोजेक्ट एजेंट skills  | `<workspace>/.agents/skills`            |
| 3            | व्यक्तिगत एजेंट skills | `~/.agents/skills`                      |
| 4            | प्रबंधित / स्थानीय skills | `~/.openclaw/skills`                    |
| 5            | बंडल की गई skills       | इंस्टॉलेशन के साथ शामिल                 |
| 6 — न्यूनतम  | अतिरिक्त डायरेक्टरियाँ  | `skills.load.extraDirs` + Plugin skills |

Skill रूट समूहबद्ध लेआउट का समर्थन करते हैं। किसी कॉन्फ़िगर किए गए रूट के अंतर्गत
`SKILL.md` कहीं भी दिखाई देने पर OpenClaw उस skill को खोज लेता है (अधिकतम 6 स्तर गहराई तक):

```text
<workspace>/skills/research/SKILL.md          ✓ "research" के रूप में मिला
<workspace>/skills/personal/research/SKILL.md ✓ "research" के रूप में भी मिला
```

फ़ोल्डर पथ केवल संगठन के लिए है। Skill का नाम और स्लैश कमांड
`name` frontmatter फ़ील्ड से आते हैं (या `name` अनुपस्थित होने पर
डायरेक्टरी नाम से)। एजेंट अनुमति-सूचियाँ (नीचे) भी इसी `name` से मिलान करती हैं।

<Note>
  Codex CLI की मूल `$CODEX_HOME/skills` डायरेक्टरी OpenClaw
  skill रूट **नहीं** है। उन skills की सूची बनाने के लिए `openclaw migrate plan codex` का उपयोग करें, फिर
  उन्हें अपने OpenClaw वर्कस्पेस में कॉपी करने के लिए `openclaw migrate codex` का उपयोग करें।
</Note>

## Node पर होस्ट की गई skills

कनेक्ट किया हुआ हेडलेस Node अपनी सक्रिय OpenClaw
skills डायरेक्टरी में इंस्टॉल की गई skills प्रकाशित कर सकता है (डिफ़ॉल्ट रूप से `~/.openclaw/skills`; प्रोफ़ाइल परिवेश
ओवरराइड लागू होते हैं)। Node के कनेक्ट रहने पर वे सामान्य एजेंट skill सूची में दिखाई देती हैं
और उसका कनेक्शन टूटने पर गायब हो जाती हैं। नाम टकराने पर स्थानीय या Gateway skill अपना नाम बनाए
रखती है; Node skill को निर्धारक Node-प्रीफ़िक्स वाला नाम मिलता है।
Node पर होस्ट किए गए v1 में डायरेक्टरी नाम का skill के `name`
frontmatter फ़ील्ड से मेल खाना आवश्यक है।

Skill प्रविष्टि में Node लोकेटर शामिल होता है। इसकी फ़ाइलें, सापेक्ष संदर्भ और
बाइनरी Node पर रहती हैं, इसलिए इसे `exec host=node node=<node-id>` से लोड और निष्पादित करें।
इसकी skill फ़ाइलें बदलने के बाद Node होस्ट पुनः आरंभ करें।
पेयरिंग और बंद करने के विकल्पों के लिए [Nodes](/hi/nodes#node-hosted-skills) देखें।

## प्रति-एजेंट बनाम साझा skills

बहु-एजेंट सेटअप में प्रत्येक एजेंट का अपना वर्कस्पेस होता है। अपनी इच्छित दृश्यता से
मेल खाने वाले पथ का उपयोग करें:

| दायरा          | पथ                          | किसे दिखाई देता है             |
| -------------- | ---------------------------- | ------------------------------- |
| प्रति-एजेंट    | `<workspace>/skills`         | केवल उस एजेंट को                |
| प्रोजेक्ट-एजेंट | `<workspace>/.agents/skills` | केवल उस वर्कस्पेस के एजेंट को   |
| व्यक्तिगत-एजेंट | `~/.agents/skills`           | इस मशीन के सभी एजेंटों को       |
| साझा प्रबंधित  | `~/.openclaw/skills`         | इस मशीन के सभी एजेंटों को       |
| अतिरिक्त डायरेक्टरियाँ | `skills.load.extraDirs`      | इस मशीन के सभी एजेंटों को       |

## एजेंट अनुमति-सूचियाँ

Skill का **स्थान** (प्राथमिकता) और skill की **दृश्यता** (कौन-सा एजेंट उसका उपयोग कर सकता है)
अलग-अलग नियंत्रण हैं। एजेंट को कौन-सी skills दिखाई देंगी, इसे सीमित करने के लिए अनुमति-सूचियों का उपयोग करें,
चाहे वे कहीं से भी लोड हुई हों।

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // साझा आधार
    },
    list: [
      { id: "writer" }, // github, weather विरासत में मिलती हैं
      { id: "docs", skills: ["docs-search"] }, // डिफ़ॉल्ट को पूरी तरह बदलता है
      { id: "locked-down", skills: [] }, // कोई skills नहीं
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="अनुमति-सूची के नियम">
    - डिफ़ॉल्ट रूप से सभी skills को अप्रतिबंधित रखने के लिए `agents.defaults.skills` को छोड़ दें।
    - `agents.defaults.skills` को विरासत में लेने के लिए `agents.list[].skills` को छोड़ दें।
    - उस एजेंट के लिए कोई skill उपलब्ध न कराने हेतु `agents.list[].skills: []` सेट करें।
    - गैर-रिक्त `agents.list[].skills` सूची **अंतिम** सेट होती है — यह
      डिफ़ॉल्ट के साथ मर्ज नहीं होती।
    - प्रभावी अनुमति-सूची प्रॉम्प्ट निर्माण, स्लैश-कमांड
      खोज, सैंडबॉक्स सिंक और skill स्नैपशॉट पर लागू होती है।
    - यह होस्ट शेल प्राधिकरण सीमा नहीं है। यदि वही एजेंट
      `exec` का उपयोग कर सकता है, तो सैंडबॉक्सिंग, OS-उपयोगकर्ता
      पृथक्करण, exec निषेध/अनुमति-सूचियों और प्रति-संसाधन क्रेडेंशियल से उस शेल को अलग से सीमित करें।
  </Accordion>
</AccordionGroup>

## Plugins और skills

Plugins `openclaw.plugin.json` में `skills` डायरेक्टरियाँ सूचीबद्ध करके
अपनी skills शामिल कर सकते हैं (पथ Plugin रूट के सापेक्ष होते हैं)। Plugin सक्षम होने पर Plugin skills लोड
होती हैं — उदाहरण के लिए, ब्राउज़र Plugin बहु-चरणीय ब्राउज़र नियंत्रण के लिए
`browser-automation` skill शामिल करता है।

Plugin skill डायरेक्टरियाँ `skills.load.extraDirs` के समान निम्न-प्राथमिकता स्तर पर
मर्ज होती हैं, इसलिए समान नाम वाली बंडल, प्रबंधित, एजेंट या वर्कस्पेस
skill उन्हें ओवरराइड कर देती है। किसी Plugin skill की अपनी पात्रता को उसके frontmatter में
`metadata.openclaw.requires` के माध्यम से नियंत्रित करें, ठीक किसी अन्य skill की तरह।

संपूर्ण Plugin सिस्टम के लिए [Plugins](/hi/tools/plugin) और [टूल्स](/hi/tools) देखें।

## Skill Workshop

[Skill Workshop](/hi/tools/skill-workshop) एजेंट और आपकी सक्रिय skill फ़ाइलों के बीच
एक प्रस्ताव कतार है। एजेंट को पुनः उपयोग योग्य कार्य मिलने पर वह सीधे
`SKILL.md` में लिखने के बजाय एक प्रस्ताव तैयार करता है। कोई परिवर्तन होने से पहले
आप उसकी समीक्षा करके उसे स्वीकृत करते हैं।

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

संपूर्ण जीवनचक्र, CLI संदर्भ और कॉन्फ़िगरेशन के लिए
[Skill Workshop](/hi/tools/skill-workshop) देखें।

## ClawHub से इंस्टॉल करना

[ClawHub](https://clawhub.ai) सार्वजनिक skills रजिस्ट्री है। इंस्टॉल और अपडेट के लिए
`openclaw skills` कमांड या प्रकाशित और सिंक करने के लिए `clawhub` CLI का उपयोग करें।

| क्रिया                              | कमांड                                                  |
| ----------------------------------- | ------------------------------------------------------ |
| वर्कस्पेस में skill इंस्टॉल करें    | `openclaw skills install @owner/<slug>`                |
| Git रिपॉज़िटरी से इंस्टॉल करें      | `openclaw skills install git:owner/repo@ref`           |
| स्थानीय skill डायरेक्टरी इंस्टॉल करें | `openclaw skills install ./path/to/skill --as my-tool` |
| सभी स्थानीय एजेंटों के लिए इंस्टॉल करें | `openclaw skills install @owner/<slug> --global`       |
| सभी वर्कस्पेस skills अपडेट करें     | `openclaw skills update --all`                         |
| साझा प्रबंधित skill अपडेट करें      | `openclaw skills update @owner/<slug> --global`        |
| सभी साझा प्रबंधित skills अपडेट करें | `openclaw skills update --all --global`                |
| skill के विश्वास आवरण को सत्यापित करें | `openclaw skills verify @owner/<slug>`                 |
| जनरेट किया गया Skill Card प्रिंट करें | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI द्वारा प्रकाशित / सिंक करें | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="इंस्टॉलेशन विवरण">
    `openclaw skills install` डिफ़ॉल्ट रूप से सक्रिय वर्कस्पेस की `skills/`
    डायरेक्टरी में इंस्टॉल करता है। साझा `~/.openclaw/skills` डायरेक्टरी में
    इंस्टॉल करने के लिए `--global` जोड़ें, जो सभी स्थानीय एजेंटों को दिखाई देती है,
    जब तक कि एजेंट अनुमति-सूचियाँ इसे सीमित न करें।

    Git और स्थानीय इंस्टॉलेशन स्रोत रूट पर `SKILL.md` अपेक्षित करते हैं। मान्य होने पर स्लग
    `SKILL.md` frontmatter के `name` से आता है, फिर
    डायरेक्टरी या रिपॉज़िटरी नाम पर फ़ॉलबैक करता है। ओवरराइड करने के लिए `--as <slug>` का उपयोग करें।
    `openclaw skills update` केवल ClawHub इंस्टॉलेशन ट्रैक करता है — Git या
    स्थानीय स्रोतों को रीफ़्रेश करने के लिए उन्हें पुनः इंस्टॉल करें।

  </Accordion>
  <Accordion title="सत्यापन और सुरक्षा स्कैनिंग">
    `openclaw skills verify @owner/<slug>` ClawHub से skill का
    `clawhub.skill.verify.v1` विश्वास आवरण माँगता है। इंस्टॉल की गई ClawHub skills का सत्यापन
    `.clawhub/origin.json` में दर्ज संस्करण और रजिस्ट्री के आधार पर होता है।
    मौजूदा इंस्टॉल की गई या अस्पष्टता-रहित skills के लिए केवल स्लग अभी भी स्वीकार किए जाते हैं, लेकिन
    स्वामी-योग्य संदर्भ प्रकाशक की अस्पष्टता से बचाते हैं।

    ClawHub skill पृष्ठ इंस्टॉल से पहले नवीनतम सुरक्षा स्कैन स्थिति दिखाते हैं,
    जिसमें VirusTotal, ClawScan और स्थैतिक विश्लेषण के विवरण पृष्ठ शामिल होते हैं।
    ClawHub द्वारा सत्यापन विफल चिह्नित किए जाने पर कमांड गैर-शून्य मान के साथ समाप्त होता है। प्रकाशक
    ClawHub डैशबोर्ड या `clawhub skill rescan @owner/<slug>` के माध्यम से गलत सकारात्मक परिणामों से उबरते हैं।

  </Accordion>
  <Accordion title="निजी आर्काइव इंस्टॉलेशन">
    जिन Gateway क्लाइंट को गैर-ClawHub वितरण चाहिए, वे `skills.upload.begin`,
    `skills.upload.chunk` और `skills.upload.commit` के साथ zip skill आर्काइव तैयार कर सकते हैं,
    फिर `skills.install({ source: "upload", ... })` से इंस्टॉल कर सकते हैं। यह पथ
    डिफ़ॉल्ट रूप से बंद होता है और इसके लिए `openclaw.json` में
    `skills.install.allowUploadedArchives: true` आवश्यक है। सामान्य ClawHub इंस्टॉलेशन में उस सेटिंग की कभी आवश्यकता नहीं होती।
  </Accordion>
</AccordionGroup>

## सुरक्षा

<Warning>
  तृतीय-पक्ष skills को **अविश्वसनीय कोड** मानें। सक्षम करने से पहले उन्हें पढ़ें।
  अविश्वसनीय इनपुट और जोखिमपूर्ण टूल्स के लिए सैंडबॉक्स किए गए रन को प्राथमिकता दें। एजेंट-पक्षीय
  नियंत्रणों के लिए [सैंडबॉक्सिंग](/hi/gateway/sandboxing) देखें।
</Warning>

<AccordionGroup>
  <Accordion title="पथ परिसीमन">
    वर्कस्पेस, प्रोजेक्ट-एजेंट और अतिरिक्त-डायरेक्टरी skill खोज केवल उन्हीं skill
    रूट को स्वीकार करती है जिनका हल किया गया वास्तविक पथ कॉन्फ़िगर किए गए रूट के भीतर रहता है, जब तक
    `skills.load.allowSymlinkTargets` किसी लक्ष्य रूट पर स्पष्ट रूप से भरोसा न करे।
    `skills.workshop.allowSymlinkTargetWrites` सक्षम होने पर ही Skill Workshop उन विश्वसनीय लक्ष्यों के माध्यम से लिखता है।
    प्रबंधित `~/.openclaw/skills` और व्यक्तिगत `~/.agents/skills` में
    सिमलिंक किए गए skill फ़ोल्डर हो सकते हैं, लेकिन प्रत्येक `SKILL.md` वास्तविक पथ को फिर भी
    उसकी हल की गई skill डायरेक्टरी के भीतर रहना चाहिए।
  </Accordion>
  <Accordion title="ऑपरेटर इंस्टॉलेशन नीति">
    Skill इंस्टॉलेशन जारी रहने से पहले एक विश्वसनीय स्थानीय नीति कमांड चलाने के लिए
    `security.installPolicy` कॉन्फ़िगर करें। नीति को मेटाडेटा और तैयार किया गया
    स्रोत पथ मिलता है, यह ClawHub, अपलोड किए गए, Git, स्थानीय, अपडेट और
    निर्भरता-इंस्टॉलर पथों पर लागू होती है और कमांड द्वारा
    मान्य निर्णय न लौटाए जा सकने पर बंद होकर विफल होती है।
  </Accordion>
  <Accordion title="सीक्रेट इंजेक्शन का दायरा">
    `skills.entries.*.env` और `skills.entries.*.apiKey` केवल उस एजेंट टर्न के लिए
    **होस्ट** प्रोसेस में सीक्रेट इंजेक्ट करते हैं — सैंडबॉक्स में नहीं। सीक्रेट को
    प्रॉम्प्ट और लॉग से बाहर रखें।
  </Accordion>
</AccordionGroup>

व्यापक खतरा मॉडल और सुरक्षा जाँच-सूचियों के लिए
[सुरक्षा](/hi/gateway/security) देखें।

## SKILL.md प्रारूप

प्रत्येक skill के frontmatter में कम-से-कम `name` और `description` आवश्यक हैं:

```markdown
---
name: image-lab
description: प्रदाता-समर्थित इमेज वर्कफ़्लो के माध्यम से इमेज जनरेट या संपादित करें
---

जब उपयोगकर्ता कोई इमेज जनरेट करने के लिए कहे, तो `image_generate` टूल का उपयोग करें...
```

<Note>
  OpenClaw [AgentSkills](https://agentskills.io) विनिर्देश का पालन करता है। Frontmatter को
  पहले YAML के रूप में पार्स किया जाता है; यदि वह विफल होता है, तो यह केवल एकल-पंक्ति
  पार्सर पर फ़ॉलबैक करता है। नेस्ट किए गए `metadata` ब्लॉक (बहु-पंक्ति YAML मैपिंग सहित)
  को JSON स्ट्रिंग में समतल करके JSON5 के रूप में पुनः पार्स किया जाता है, इसलिए
  [गेटिंग](#gating) के अंतर्गत दिखाया गया ब्लॉक प्रारूप काम करता है। Skill फ़ोल्डर पथ को संदर्भित करने के लिए
  बॉडी में `{baseDir}` का उपयोग करें।
</Note>

### वैकल्पिक frontmatter कुंजियाँ

<ParamField path="homepage" type="string">
  macOS Skills UI में "Website" के रूप में दिखाई जाने वाली URL। यह
  `metadata.openclaw.homepage` के माध्यम से भी समर्थित है।
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  जब `true` हो, तब skill को उपयोगकर्ता द्वारा आह्वान योग्य स्लैश कमांड के रूप में उपलब्ध कराया जाता है।
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  जब `true` हो, तब OpenClaw skill के निर्देशों को एजेंट के सामान्य
  प्रॉम्प्ट से बाहर रखता है। जब `user-invocable`
  भी `true` हो, तब skill स्लैश कमांड के रूप में फिर भी उपलब्ध रहती है।
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  जब इसे `tool` पर सेट किया जाता है, तब स्लैश कमांड मॉडल को बायपास करके
  सीधे किसी पंजीकृत टूल को डिस्पैच होती है।
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` सेट होने पर आह्वान किए जाने वाले टूल का नाम।
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  टूल डिस्पैच के लिए, मूल पार्सिंग के बिना कच्ची args स्ट्रिंग को टूल तक
  अग्रेषित करता है। टूल को
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` प्राप्त होता है।
</ParamField>

## गेटिंग

OpenClaw लोड के समय `metadata.openclaw` (frontmatter में एम्बेड किया गया JSON5 ऑब्जेक्ट,
ऊपर पार्सिंग संबंधी टिप्पणी देखें) का उपयोग करके skills को फ़िल्टर करता है। बिना
`metadata.openclaw` ब्लॉक वाली skill हमेशा पात्र होती है, जब तक कि उसे स्पष्ट रूप से अक्षम न किया गया हो।

```markdown
---
name: image-lab
description: प्रदाता-समर्थित इमेज वर्कफ़्लो के माध्यम से इमेज जनरेट या संपादित करें
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  जब `true` हो, तब हमेशा skill को शामिल करें और अन्य सभी गेट छोड़ दें।
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI में दिखाया जाने वाला वैकल्पिक इमोजी।
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI में "Website" के रूप में दिखाया जाने वाला वैकल्पिक URL।
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  प्लेटफ़ॉर्म फ़िल्टर। सेट होने पर skill केवल सूचीबद्ध OS पर पात्र होती है।
</ParamField>

<ParamField path="requires.bins" type="string[]">
  प्रत्येक बाइनरी `PATH` पर मौजूद होनी चाहिए।
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  कम-से-कम एक बाइनरी `PATH` पर मौजूद होनी चाहिए।
</ParamField>

<ParamField path="requires.env" type="string[]">
  प्रत्येक env var प्रक्रिया में मौजूद होना चाहिए या config के माध्यम से प्रदान किया जाना चाहिए।
</ParamField>

<ParamField path="requires.config" type="string[]">
  प्रत्येक `openclaw.json` पथ का मान truthy होना चाहिए।
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` से संबद्ध env var का नाम।
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI द्वारा उपयोग किए जाने वाले वैकल्पिक इंस्टॉलर विनिर्देश (brew / node / go / uv / download)।
</ParamField>

<Note>
  जब `metadata.openclaw` अनुपस्थित हो, तब पुराने `metadata.clawdbot` ब्लॉक अब भी स्वीकार किए जाते हैं,
  ताकि पहले से इंस्टॉल की गई skills अपने निर्भरता गेट और इंस्टॉलर संकेत बनाए रखें।
  नई skills को `metadata.openclaw` का उपयोग करना चाहिए।
</Note>

### इंस्टॉलर विनिर्देश

इंस्टॉलर विनिर्देश macOS Skills UI को बताते हैं कि किसी निर्भरता को कैसे इंस्टॉल करना है:

```markdown
---
name: gemini
description: कोडिंग सहायता और Google खोज लुकअप के लिए Gemini CLI का उपयोग करें।
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Gemini CLI इंस्टॉल करें (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="इंस्टॉलर चयन नियम">
    - जब कई इंस्टॉलर सूचीबद्ध हों, तब Gateway एक पसंदीदा
      विकल्प चुनता है (उपलब्ध होने पर brew, अन्यथा node)।
    - यदि सभी इंस्टॉलर `download` हों, तो OpenClaw प्रत्येक प्रविष्टि सूचीबद्ध करता है,
      ताकि आप सभी उपलब्ध आर्टिफ़ैक्ट देख सकें।
    - प्लेटफ़ॉर्म के अनुसार फ़िल्टर करने के लिए विनिर्देशों में `os: ["darwin"|"linux"|"win32"]` शामिल किया जा सकता है।
    - Node इंस्टॉल, `openclaw.json` में `skills.install.nodeManager` का पालन करते हैं
      (डिफ़ॉल्ट: npm; विकल्प: npm / pnpm / yarn / bun)। यह केवल skill
      इंस्टॉल को प्रभावित करता है; Gateway रनटाइम फिर भी Node होना चाहिए।
    - Gateway इंस्टॉलर वरीयता: Homebrew → uv → कॉन्फ़िगर किया गया node मैनेजर →
      go → download।
  </Accordion>
  <Accordion title="प्रत्येक इंस्टॉलर का विवरण">
    - **Homebrew:** OpenClaw, Homebrew को स्वतः इंस्टॉल नहीं करता और न ही brew
      फ़ॉर्मूलों को सिस्टम पैकेज कमांड में बदलता है। `brew` के बिना Linux कंटेनरों में,
      केवल brew वाले इंस्टॉलर छिपे रहते हैं; कस्टम इमेज का उपयोग करें या निर्भरता को
      मैन्युअल रूप से इंस्टॉल करें।
    - **Go:** स्वचालित skill इंस्टॉल के लिए OpenClaw को Go 1.21 या उससे नया संस्करण चाहिए।
      यदि `go` अनुपस्थित है और Homebrew उपलब्ध है, तो OpenClaw पहले Homebrew के माध्यम से Go
      इंस्टॉल करता है; Homebrew के बिना Linux पर, जब रिफ़्रेश किया गया `golang-go`
      उम्मीदवार न्यूनतम संस्करण पूरा करता है, तब वह इसके बजाय root के रूप में या पासवर्ड-रहित
      `sudo` के माध्यम से `apt-get` का उपयोग कर सकता है। निर्भरता के लिए वास्तविक
      `go install` हमेशा आपके कॉन्फ़िगर किए गए `GOBIN` के बजाय
      OpenClaw द्वारा प्रबंधित समर्पित bin डायरेक्टरी (नए इंस्टॉल पर Homebrew का
      `bin`, अन्यथा `~/.local/bin`) को लक्षित करता है — आपके अपने
      `GOBIN`, `GOPATH`, और `GOTOOLCHAIN` env vars पढ़े जाते हैं, लेकिन कभी अधिलेखित नहीं किए जाते।
    - **डाउनलोड:** `url` (आवश्यक), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (डिफ़ॉल्ट: आर्काइव मिलने पर auto), `stripComponents`,
      `targetDir` (डिफ़ॉल्ट: `~/.openclaw/tools/<skillKey>`)।
  </Accordion>
  <Accordion title="सैंडबॉक्सिंग संबंधी टिप्पणियाँ">
    skill लोड के समय `requires.bins` को **होस्ट** पर जाँचा जाता है। यदि कोई एजेंट
    सैंडबॉक्स में चलता है, तो बाइनरी **कंटेनर के अंदर** भी मौजूद होनी चाहिए।
    इसे `agents.defaults.sandbox.docker.setupCommand` या कस्टम
    इमेज के माध्यम से इंस्टॉल करें। कंटेनर बनने के बाद `setupCommand` एक बार चलता है और इसके लिए
    नेटवर्क एग्रेस, लिखने योग्य root FS, और सैंडबॉक्स में root उपयोगकर्ता आवश्यक होते हैं।
  </Accordion>
</AccordionGroup>

## Config ओवरराइड

`~/.openclaw/openclaw.json` में `skills.entries` के अंतर्गत बंडल या प्रबंधित skills को
टॉगल और कॉन्फ़िगर करें:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` बंडल या इंस्टॉल होने पर भी skill को अक्षम कर देता है। बंडल की गई
  `coding-agent` skill ऑप्ट-इन है — `skills.entries.coding-agent.enabled: true` सेट करें
  और सुनिश्चित करें कि `claude`, `codex`, `opencode`, या कोई अन्य समर्थित CLI
  इंस्टॉल और प्रमाणीकृत हो।
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` घोषित करने वाली skills के लिए सुविधा फ़ील्ड।
  सादा टेक्स्ट स्ट्रिंग या SecretRef ऑब्जेक्ट का समर्थन करता है।
</ParamField>

<ParamField path="env" type="Record<string, string>">
  एजेंट रन के लिए इंजेक्ट किए गए पर्यावरण चर। केवल तभी इंजेक्ट किए जाते हैं जब
  चर प्रक्रिया में पहले से सेट न हो।
</ParamField>

<ParamField path="config" type="object">
  प्रत्येक skill के कस्टम कॉन्फ़िगरेशन फ़ील्ड के लिए वैकल्पिक संग्रह।
</ParamField>

<ParamField path="allowBundled" type="string[]">
  केवल **बंडल की गई** skills के लिए वैकल्पिक अनुमति-सूची। सेट होने पर केवल सूची में मौजूद
  बंडल skills पात्र होती हैं। प्रबंधित और कार्यस्थान skills अप्रभावित रहती हैं।
</ParamField>

<Note>
  डिफ़ॉल्ट रूप से Config कुंजियाँ **skill के नाम** से मेल खाती हैं। यदि कोई skill
  `metadata.openclaw.skillKey` परिभाषित करती है, तो उसके बजाय `skills.entries` के अंतर्गत उस कुंजी का उपयोग करें।
  हाइफ़न वाले नाम उद्धरण चिह्नों में रखें: JSON5 उद्धृत कुंजियों की अनुमति देता है।
</Note>

## पर्यावरण इंजेक्शन

एजेंट रन शुरू होने पर OpenClaw:

<Steps>
  <Step title="skill मेटाडेटा पढ़ता है">
    OpenClaw एजेंट के लिए प्रभावी skill सूची निर्धारित करता है और गेटिंग
    नियम, अनुमति-सूचियाँ तथा config ओवरराइड लागू करता है।
  </Step>
  <Step title="env और API कुंजियाँ इंजेक्ट करता है">
    रन की अवधि के लिए `skills.entries.<key>.env` और `skills.entries.<key>.apiKey` को
    `process.env` पर लागू किया जाता है।
  </Step>
  <Step title="सिस्टम प्रॉम्प्ट बनाता है">
    पात्र skills को एक संक्षिप्त XML ब्लॉक में संकलित करके
    सिस्टम प्रॉम्प्ट में इंजेक्ट किया जाता है।
  </Step>
  <Step title="पर्यावरण पुनर्स्थापित करता है">
    रन समाप्त होने के बाद मूल पर्यावरण पुनर्स्थापित किया जाता है।
  </Step>
</Steps>

<Warning>
  Env इंजेक्शन **होस्ट** एजेंट रन तक सीमित है, सैंडबॉक्स तक नहीं। सैंडबॉक्स के अंदर
  `env` और `apiKey` का कोई प्रभाव नहीं होता। सैंडबॉक्स किए गए रन में
  secrets पास करने की विधि के लिए
  [Skills config](/hi/tools/skills-config#sandboxed-skills-and-env-vars) देखें।
</Warning>

बंडल किए गए `claude-cli` बैकएंड के लिए OpenClaw उसी पात्र skill स्नैपशॉट को
अस्थायी Claude Code Plugin के रूप में भी मूर्त रूप देता है और उसे
`--plugin-dir` के माध्यम से पास करता है। अन्य CLI बैकएंड केवल प्रॉम्प्ट कैटलॉग का उपयोग करते हैं।

## स्नैपशॉट और रिफ़्रेश

OpenClaw पात्र skills का स्नैपशॉट **सत्र शुरू होने पर** लेता है और सत्र के सभी
बाद के टर्न के लिए उसी सूची का पुनः उपयोग करता है। skills या config में किए गए बदलाव
अगले नए सत्र में प्रभावी होते हैं।

सत्र के बीच में Skills दो स्थितियों में रिफ़्रेश होती हैं:

- skills वॉचर को `SKILL.md` में बदलाव मिलता है।
- कोई नया पात्र रिमोट node कनेक्ट होता है।

रिफ़्रेश की गई सूची अगले एजेंट टर्न में अपनाई जाती है। यदि प्रभावी एजेंट
अनुमति-सूची बदलती है, तो OpenClaw दिखाई देने वाली skills को संरेखित रखने के लिए
स्नैपशॉट रिफ़्रेश करता है।

<AccordionGroup>
  <Accordion title="Skills वॉचर">
    डिफ़ॉल्ट रूप से OpenClaw skill फ़ोल्डरों पर नज़र रखता है और
    `SKILL.md` फ़ाइलें बदलने पर स्नैपशॉट बढ़ाता है। `skills.load` के अंतर्गत कॉन्फ़िगर करें:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // डिफ़ॉल्ट
          watchDebounceMs: 250, // डिफ़ॉल्ट
        },
      },
    }
    ```

    ऐसे जानबूझकर बनाए गए सिमलिंक लेआउट के लिए `allowSymlinkTargets` का उपयोग करें, जहाँ कोई skill
    root सिमलिंक कॉन्फ़िगर किए गए root से बाहर इंगित करता है, उदाहरण के लिए
    `<workspace>/skills/manager -> ~/Projects/manager/skills`।
    `skills.workshop.allowSymlinkTargetWrites` केवल तभी सक्षम करें जब Skill Workshop को
    उन विश्वसनीय सिमलिंक पथों के माध्यम से भी प्रस्ताव लागू करने चाहिए।

  </Accordion>
  <Accordion title="रिमोट macOS nodes (Linux gateway)">
    यदि Gateway Linux पर चलता है, लेकिन `system.run` की अनुमति वाला
    **macOS node** कनेक्ट है, तो आवश्यक बाइनरी उस node पर मौजूद होने पर OpenClaw
    केवल macOS वाली skills को पात्र मान सकता है। एजेंट को उन
    skills को `host=node` के साथ `exec` टूल के माध्यम से चलाना चाहिए।

    ऑफ़लाइन nodes केवल-रिमोट skills को दृश्यमान **नहीं** बनाते। यदि कोई node
    bin जाँचों का उत्तर देना बंद कर देता है, तो OpenClaw उसके कैश किए गए bin मिलान साफ़ कर देता है।

  </Accordion>
</AccordionGroup>

## टोकन प्रभाव

skills पात्र होने पर OpenClaw सिस्टम प्रॉम्प्ट में एक संक्षिप्त XML ब्लॉक
इंजेक्ट करता है। लागत नियतात्मक होती है और प्रत्येक skill के अनुसार रैखिक रूप से बढ़ती है:

- **आधार ओवरहेड** (केवल तब, जब 1+ skills पात्र हों): परिचयात्मक
  गद्य का एक निश्चित ब्लॉक और `<available_skills>` रैपर।
- **प्रति skill:** ~97 वर्ण + आपके `name`, `description`, और `location`
  फ़ील्ड की लंबाइयाँ।
- XML एस्केपिंग `& < > " '` को एंटिटी में विस्तारित करती है, जिससे प्रत्येक
  उपस्थिति पर कुछ वर्ण जुड़ते हैं।
- ~4 वर्ण/टोकन पर, फ़ील्ड लंबाइयों से पहले 97 वर्ण ≈ प्रति skill 24 टोकन।

यदि रेंडर किया गया ब्लॉक कॉन्फ़िगर किए गए प्रॉम्प्ट बजट
(`skills.limits.maxSkillsPromptChars`) से अधिक हो जाए, तो OpenClaw पहले उतनी skill
पहचानों (नाम, स्थान और संस्करण) को सुरक्षित रखता है, जितनी विवरण-रहित संक्षिप्त फ़ॉर्मैट
में समा सकती हैं। इसके बाद यह शेष बजट का उपयोग संक्षिप्त विवरणों के लिए करता है। यदि
विवरण के लिए कोई बजट शेष नहीं रहता, तो विवरण छोड़ दिए जाते हैं। जब भी संक्षिप्त फ़ॉर्मैटिंग या सूची
को छोटा करना आवश्यक होता है, प्रॉम्प्ट में `openclaw skills check` की ओर संकेत करने वाला
एक नोट शामिल होता है।

प्रॉम्प्ट ओवरहेड को न्यूनतम रखने के लिए विवरण छोटे और वर्णनात्मक रखें।

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills बनाना" href="/hi/tools/creating-skills" icon="hammer">
    कस्टम skill तैयार करने की चरण-दर-चरण मार्गदर्शिका।
  </Card>
  <Card title="Skill कार्यशाला" href="/hi/tools/skill-workshop" icon="flask">
    एजेंट द्वारा प्रारूपित Skills के लिए प्रस्ताव कतार।
  </Card>
  <Card title="Skills कॉन्फ़िगरेशन" href="/hi/tools/skills-config" icon="gear">
    पूर्ण `skills.*` कॉन्फ़िगरेशन स्कीमा और एजेंट अनुमति-सूचियाँ।
  </Card>
  <Card title="स्लैश कमांड" href="/hi/tools/slash-commands" icon="terminal">
    skill स्लैश कमांड कैसे पंजीकृत और रूट किए जाते हैं।
  </Card>
  <Card title="ClawHub" href="/hi/clawhub" icon="cloud">
    सार्वजनिक रजिस्ट्री पर Skills ब्राउज़ और प्रकाशित करें।
  </Card>
  <Card title="Plugins" href="/hi/tools/plugin" icon="plug">
    Plugins अपने द्वारा प्रलेखित टूल के साथ Skills भी वितरित कर सकते हैं।
  </Card>
</CardGroup>
