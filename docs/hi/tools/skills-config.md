---
read_when:
    - Skills की लोडिंग, इंस्टॉलेशन या गेटिंग व्यवहार को कॉन्फ़िगर करना
    - प्रति-एजेंट Skills दृश्यता सेट करना
    - Skills वर्कशॉप की सीमाओं या अनुमोदन नीति को समायोजित करना
sidebarTitle: Skills config
summary: Skills.* कॉन्फ़िग स्कीमा, एजेंट अनुमति-सूचियों, वर्कशॉप सेटिंग्स और सैंडबॉक्स एनवायरनमेंट वेरिएबल प्रबंधन का संपूर्ण संदर्भ।
title: Skills कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-07-16T17:54:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

अधिकांश Skills कॉन्फ़िगरेशन `skills` के अंतर्गत
`~/.openclaw/openclaw.json` में होता है। एजेंट-विशिष्ट दृश्यता
`agents.defaults.skills` और `agents.list[].skills` के अंतर्गत होती है।

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "auto",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  अंतर्निहित इमेज जनरेशन के लिए `skills.entries` के बजाय `agents.defaults.imageGenerationModel`
  के साथ मुख्य `image_generate` टूल का उपयोग करें। Skill
  प्रविष्टियाँ केवल कस्टम या तृतीय-पक्ष Skill वर्कफ़्लो के लिए हैं।
</Note>

## लोडिंग (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  स्कैन करने के लिए अतिरिक्त Skill डायरेक्टरियाँ, सबसे कम प्राथमिकता पर
  (बंडल किए गए और Plugin Skills के नीचे)। पाथ को `~` समर्थन के साथ विस्तारित किया जाता है।
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  विश्वसनीय वास्तविक लक्ष्य डायरेक्टरियाँ, जिनमें सिमलिंक की गई Skill डायरेक्टरियाँ
  रिज़ॉल्व हो सकती हैं, भले ही सिमलिंक कॉन्फ़िगर किए गए रूट के बाहर हो। इसका उपयोग
  जानबूझकर बनाए गए सिबलिंग-रिपॉज़िटरी लेआउट के लिए करें, जैसे
  `<workspace>/skills/manager -> ~/Projects/manager/skills`। इस सूची को
  सीमित रखें — इसे `~` या `~/Projects` जैसे व्यापक रूट की ओर इंगित न करें।
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Skill फ़ोल्डर पर निगरानी रखें और `SKILL.md` फ़ाइलों में
  बदलाव होने पर Skills स्नैपशॉट रीफ़्रेश करें। इसमें समूहबद्ध Skill रूट के अंतर्गत नेस्टेड फ़ाइलें शामिल हैं।
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill वॉचर इवेंट के लिए मिलीसेकंड में डिबाउंस अवधि।
</ParamField>

## इंस्टॉल (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` उपलब्ध होने पर Homebrew इंस्टॉलर को प्राथमिकता दें।
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill इंस्टॉलेशन के लिए Node पैकेज मैनेजर की प्राथमिकता। यह केवल Skill
  इंस्टॉलेशन को प्रभावित करता है — OpenClaw CLI और Gateway रनटाइम को Node की आवश्यकता होती है, क्योंकि
  कैनॉनिकल स्टेट स्टोर `node:sqlite` का उपयोग करता है। `openclaw setup --node-manager` और
  `openclaw onboard --node-manager`, `npm`, `pnpm`, या `bun` स्वीकार करते हैं; Yarn-समर्थित Skill इंस्टॉलेशन के लिए
  कॉन्फ़िगरेशन में सीधे `"yarn"` सेट करें।
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  विश्वसनीय `operator.admin` Gateway क्लाइंट को `skills.upload.*` के माध्यम से स्टेज किए गए निजी zip
  आर्काइव इंस्टॉल करने की अनुमति दें। सामान्य ClawHub इंस्टॉलेशन के लिए
  इस सेटिंग की आवश्यकता नहीं होती।
</ParamField>

## ऑपरेटर इंस्टॉल नीति (`security.installPolicy`)

जब ऑपरेटर को होस्ट-विशिष्ट नीति से Skill और Plugin इंस्टॉलेशन
स्वीकृत या अवरुद्ध करने के लिए किसी विश्वसनीय स्थानीय कमांड की आवश्यकता हो, तब `security.installPolicy` का उपयोग करें।
यह नीति OpenClaw द्वारा स्रोत सामग्री स्टेज किए जाने के बाद और इंस्टॉलेशन
या अपडेट जारी रहने से पहले चलती है। यह ClawHub Skills, अपलोड किए गए Skills, Git/स्थानीय
Skills, Skill निर्भरता इंस्टॉलर और Plugin इंस्टॉल/अपडेट स्रोतों पर लागू होती है।

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // हर समर्थित लक्ष्य को शामिल करने के लिए targets को छोड़ दें।
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  ऑपरेटर-स्वामित्व वाली इंस्टॉल नीति सक्षम करता है। किसी मान्य `exec`
  कमांड के बिना सक्षम किए जाने पर इंस्टॉलेशन फ़ेल-क्लोज़ होते हैं।
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  वैकल्पिक लक्ष्य फ़िल्टर। इसे छोड़ने पर नीति प्रत्येक समर्थित
  लक्ष्य पर लागू होती है, ताकि नए इंस्टॉलेशन अनपेक्षित रूप से फ़ेल-ओपन न हों।
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  विश्वसनीय नीति एक्ज़ीक्यूटेबल का निरपेक्ष पाथ। OpenClaw इसे
  शेल के बिना चलाता है और उपयोग से पहले पाथ को सत्यापित करता है।
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` के बाद दिए जाने वाले स्थिर आर्ग्युमेंट।
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  एक नीति निर्णय के लिए अधिकतम वास्तविक समय रनटाइम।
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  नीति के फ़ेल-क्लोज़ होने से पहले stdout या stderr आउटपुट के बिना
  अधिकतम समय।
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  नीति प्रोसेस से स्वीकार किए जाने वाले संयुक्त stdout और stderr बाइट की अधिकतम संख्या।
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  नीति प्रोसेस को दिए जाने वाले लिटरल एनवायरनमेंट वेरिएबल।
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw प्रोसेस से नीति प्रोसेस में कॉपी किए जाने वाले एनवायरनमेंट वेरिएबल नाम।
  केवल नामित वेरिएबल ही पास किए जाते हैं।
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  उन डायरेक्टरियों की वैकल्पिक अनुमति-सूची, जिनमें नीति एक्ज़ीक्यूटेबल हो सकता है।
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  कमांड पाथ के स्वामित्व और अनुमति जाँच को बायपास करता है। इसका उपयोग केवल तभी करें जब
  पाथ किसी अन्य तंत्र से सुरक्षित हो।
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  कॉन्फ़िगर किए गए कमांड पाथ को सिमलिंक होने की अनुमति देता है। रिज़ॉल्व किया गया लक्ष्य
  फिर भी अन्य पाथ जाँचों को पूरा करना चाहिए। इंटरप्रेटर स्क्रिप्ट आर्ग्युमेंट
  सीधे नियमित फ़ाइल होने चाहिए, सिमलिंक नहीं।
</ParamField>

नीति को stdin पर `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
वैकल्पिक संरचित `source`, संरचित `origin`, और `request` वाला एक JSON ऑब्जेक्ट प्राप्त होता है। इसे
stdout पर एक JSON ऑब्जेक्ट लिखना होगा: `{ "protocolVersion": 1, "decision": "allow" }`
या `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`। गैर-शून्य
एग्ज़िट, टाइमआउट, विकृत JSON, अनुपस्थित फ़ील्ड या असमर्थित प्रोटोकॉल
संस्करण फ़ेल-क्लोज़ होते हैं।

OpenClaw सामान्य Gateway स्टार्टअप के दौरान इंस्टॉल नीति निष्पादित नहीं करता।
नीति सक्षम लेकिन अनुपलब्ध होने पर इंस्टॉलेशन और अपडेट फ़ेल-क्लोज़ होते हैं।
`openclaw doctor` स्थिर सत्यापन करता है; `openclaw doctor --deep`
कॉन्फ़िगर किए गए कमांड के विरुद्ध एक कृत्रिम इंस्टॉल प्रोब निष्पादित करता है।

बल्क अपडेट प्रत्येक लक्ष्य पर अलग-अलग नीति लागू करते हैं: अवरुद्ध Skill या Plugin अपडेट
नीति को अक्षम किए बिना या बैच में बाद के लक्ष्यों को छोड़े बिना
उस लक्ष्य को विफल करता है।

stdin का उदाहरण:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

न्यूनतम नीति कमांड:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "इस होस्ट पर स्थानीय Plugin पाथ स्वीकृत नहीं हैं",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## बंडल किए गए Skill की अनुमति-सूची

<ParamField path="skills.allowBundled" type="string[]">
  केवल **बंडल किए गए** Skills के लिए वैकल्पिक अनुमति-सूची। सेट किए जाने पर सूची में मौजूद
  बंडल किए गए Skills ही पात्र होते हैं। प्रबंधित, एजेंट-स्तरीय और वर्कस्पेस
  Skills अप्रभावित रहते हैं।
</ParamField>

## प्रति-Skill प्रविष्टियाँ (`skills.entries`)

डिफ़ॉल्ट रूप से `entries` के अंतर्गत कुंजियाँ Skill के `name` से मेल खाती हैं। यदि कोई Skill
`metadata.openclaw.skillKey` परिभाषित करता है, तो उसके बजाय उस कुंजी का उपयोग करें। हाइफ़न वाले नामों को
उद्धरण चिह्नों में रखें (JSON5 उद्धृत कुंजियों की अनुमति देता है)।

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` बंडल या इंस्टॉल होने पर भी Skill को अक्षम करता है।
  `coding-agent` बंडल किया गया Skill ऑप्ट-इन है — इसे `true` पर सेट करें और सुनिश्चित करें कि
  `claude`, `codex`, `opencode`, या कोई अन्य समर्थित CLI इंस्टॉल और
  प्रमाणीकृत हो।
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  `metadata.openclaw.primaryEnv` घोषित करने वाले Skills के लिए सुविधाजनक फ़ील्ड।
  प्लेनटेक्स्ट स्ट्रिंग या SecretRef का समर्थन करता है: `{ source: "env", provider: "default", id: "VAR_NAME" }`।
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  एजेंट रन के लिए इंजेक्ट किए जाने वाले एनवायरनमेंट वेरिएबल। केवल तभी इंजेक्ट किए जाते हैं जब
  वेरिएबल प्रोसेस में पहले से सेट न हो।
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  कस्टम प्रति-Skill कॉन्फ़िगरेशन फ़ील्ड के लिए वैकल्पिक संग्रह।
</ParamField>

## एजेंट अनुमति-सूचियाँ (`agents`)

जब समान मशीन/वर्कस्पेस Skill रूट रखते हुए प्रत्येक एजेंट के लिए
अलग दृश्यमान Skill सेट चाहिए, तब एजेंट कॉन्फ़िगरेशन का उपयोग करें।

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // साझा आधाररेखा
    },
    list: [
      { id: "writer" }, // github, weather इनहेरिट करता है
      { id: "docs", skills: ["docs-search"] }, // डिफ़ॉल्ट को पूरी तरह प्रतिस्थापित करता है
      { id: "locked-down", skills: [] }, // कोई Skill नहीं
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  `agents.list[].skills` को छोड़ने वाले एजेंट द्वारा इनहेरिट की जाने वाली साझा आधाररेखा अनुमति-सूची।
  Skills को डिफ़ॉल्ट रूप से अप्रतिबंधित रखने के लिए इसे पूरी तरह छोड़ दें।
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  उस एजेंट के लिए स्पष्ट अंतिम Skill सेट। स्पष्ट सूचियाँ इनहेरिट किए गए डिफ़ॉल्ट को
  **प्रतिस्थापित** करती हैं — वे मर्ज नहीं होतीं। उस एजेंट के लिए कोई Skill प्रदर्शित न करने हेतु
  `[]` पर सेट करें।
</ParamField>

<Warning>
  एजेंट Skill अनुमति-सूचियाँ OpenClaw की Skill खोज,
  प्रॉम्प्ट, स्लैश-कमांड खोज, सैंडबॉक्स सिंक और Skill स्नैपशॉट के लिए दृश्यता और लोडिंग फ़िल्टर हैं।
  वे शेल-समय प्राधिकरण सीमा नहीं हैं। यदि कोई एजेंट
  होस्ट `exec` चला सकता है, तो वह शेल अब भी बाहरी क्लाइंट चला सकता है या
  निष्पादन उपयोगकर्ता को दिखाई देने वाली होस्ट फ़ाइलें पढ़ सकता है, जिनमें `~/.openclaw/skills/config/mcporter.json` जैसी MCP क्लाइंट
  रजिस्ट्रियाँ शामिल हैं। प्रति-एजेंट MCP आइसोलेशन के लिए Skill अनुमति-सूचियों को
  सैंडबॉक्स/OS-उपयोगकर्ता आइसोलेशन के साथ संयोजित करें, होस्ट exec को अस्वीकार करें या उसकी अनुमति-सूची अत्यंत सीमित रखें,
  और MCP सर्वर पर प्रति-एजेंट क्रेडेंशियल को प्राथमिकता दें।
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  जब `true` हो, तब OpenClaw स्थायी सुधारों से लंबित प्रस्ताव बना सकता है
  और सिस्टम के निष्क्रिय होने के बाद सफलतापूर्वक पूर्ण किए गए पर्याप्त कार्य की
  समीक्षा कर सकता है। इससे पात्र टर्न के बाद बैकग्राउंड में मॉडल रन जोड़ा जा सकता है। उपयोगकर्ता द्वारा आरंभ किया गया
  स्किल निर्माण और `/learn`, सेटिंग के `false` होने पर भी काम करते रहते हैं।
</ParamField>

पात्रता, गोपनीयता, लागत, केवल-प्रस्ताव अनुमतियों और समस्या निवारण के लिए
[स्व-अधिगम](/hi/tools/self-learning) देखें।

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` किसी अतिरिक्त अनुमोदन प्रॉम्प्ट के बिना एजेंट द्वारा आरंभ किए गए लागू करने,
  अस्वीकार करने या क्वारंटीन करने की अनुमति देता है। `pending` के लिए ऑपरेटर का अनुमोदन आवश्यक है।
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Skill Workshop को लागू करते समय उन कार्यस्थान स्किल सिमलिंक के माध्यम से लिखने की अनुमति दें,
  जिनका वास्तविक लक्ष्य पहले से `skills.load.allowSymlinkTargets` द्वारा विश्वसनीय है। इसे तब तक
  अक्षम रखें, जब तक जनरेट किए गए प्रस्तावों को लागू करने पर उस साझा
  स्किल रूट में बदलाव करना आवश्यक न हो।
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  प्रति कार्यस्थान बनाए रखे जाने वाले लंबित और क्वारंटीन किए गए प्रस्तावों की अधिकतम संख्या (अनुमत
  सीमा: 1-200)।
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  प्रस्ताव के मुख्य भाग का अधिकतम आकार बाइट में (अनुमत सीमा: 1024-200000)। प्रस्ताव
  विवरणों पर अलग से 160 बाइट की कठोर सीमा है, क्योंकि वे खोज और सूचीकरण
  आउटपुट में दिखाई देते हैं।
</ParamField>

इस कॉन्फ़िग द्वारा नियंत्रित प्रस्ताव जीवनचक्र, CLI कमांड,
एजेंट टूल पैरामीटर और Gateway विधियों के लिए [Skill Workshop](/hi/tools/skill-workshop) देखें।

## सिमलिंक किए गए स्किल रूट

डिफ़ॉल्ट रूप से, कार्यस्थान, प्रोजेक्ट-एजेंट, अतिरिक्त-डायरेक्टरी और बंडल किए गए स्किल रूट
सीमांकन सीमाएँ हैं। `<workspace>/skills` के अंतर्गत ऐसा सिमलिंक किया गया स्किल फ़ोल्डर,
जो रूट के बाहर रेज़ॉल्व होता है, लॉग संदेश के साथ छोड़ दिया जाता है।

किसी अभिप्रेत सिमलिंक लेआउट की अनुमति देने के लिए, विश्वसनीय लक्ष्य घोषित करें:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

इस कॉन्फ़िग के साथ, `<workspace>/skills/manager -> ~/Projects/manager/skills`
को realpath रेज़ोल्यूशन के बाद स्वीकार किया जाता है। `extraDirs` सिबलिंग रिपॉज़िटरी को
सीधे स्कैन करता है; `allowSymlinkTargets` मौजूदा
लेआउट के लिए सिमलिंक किए गए पथ को बनाए रखता है।

Skill Workshop लागू करते समय डिफ़ॉल्ट रूप से उन सिमलिंक के माध्यम से नहीं लिखता। Workshop को
पहले से विश्वसनीय सिमलिंक लक्ष्यों के अंतर्गत स्किल में बदलाव करने की अनुमति देने के लिए, अलग से
ऑप्ट इन करें:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

प्रबंधित `~/.openclaw/skills` और व्यक्तिगत `~/.agents/skills` डायरेक्टरी
पहले से ही स्किल-डायरेक्टरी सिमलिंक को बिना शर्त स्वीकार करती हैं (प्रति-स्किल
`SKILL.md` सीमांकन फिर भी लागू होता है) — `allowSymlinkTargets` की आवश्यकता केवल
कार्यस्थान, अतिरिक्त-डायरेक्टरी और प्रोजेक्ट-एजेंट (`<workspace>/.agents/skills`)
रूट के लिए होती है।

## सैंडबॉक्स किए गए स्किल और परिवेश चर

<Warning>
  `skills.entries.<skill>.env` और `apiKey` केवल **होस्ट** रन पर लागू होते हैं।
  सैंडबॉक्स के अंदर उनका कोई प्रभाव नहीं होता — `GEMINI_API_KEY` पर निर्भर
  स्किल `apiKey not configured` के साथ विफल होगा, जब तक सैंडबॉक्स को
  वह चर अलग से न दिया जाए।
</Warning>

Docker सैंडबॉक्स में सीक्रेट इस प्रकार पास करें:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Docker डेमन की पहुँच वाले उपयोगकर्ता Docker मेटाडेटा के माध्यम से
  `sandbox.docker.env` मानों का निरीक्षण कर सकते हैं। जब यह एक्सपोज़र स्वीकार्य न हो, तब माउंट की गई
  सीक्रेट फ़ाइल, कस्टम इमेज या किसी अन्य डिलीवरी पथ का उपयोग करें।
</Note>

## लोडिंग क्रम का स्मरण

```text
workspace/skills      (सर्वोच्च)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
बंडल किए गए स्किल
skills.load.extraDirs (न्यूनतम)
```

वॉचर सक्षम होने पर स्किल और कॉन्फ़िग में किए गए बदलाव अगले नए सत्र में प्रभावी होते हैं,
या वॉचर द्वारा बदलाव का पता लगाने पर अगले एजेंट टर्न में प्रभावी होते हैं।

## संबंधित

<CardGroup cols={2}>
  <Card title="स्किल संदर्भ" href="/hi/tools/skills" icon="puzzle-piece">
    स्किल क्या हैं, लोडिंग क्रम, गेटिंग और SKILL.md प्रारूप।
  </Card>
  <Card title="स्किल बनाना" href="/hi/tools/creating-skills" icon="hammer">
    कस्टम कार्यस्थान स्किल लिखना।
  </Card>
  <Card title="Skill Workshop" href="/hi/tools/skill-workshop" icon="flask">
    एजेंट द्वारा प्रारूपित स्किल के लिए प्रस्ताव कतार।
  </Card>
  <Card title="स्व-अधिगम" href="/hi/tools/self-learning" icon="brain">
    पूर्ण किए गए कार्य से सावधानीपूर्ण, ऑप्ट-इन प्रस्ताव।
  </Card>
  <Card title="स्लैश कमांड" href="/hi/tools/slash-commands" icon="terminal">
    नेटिव स्लैश-कमांड कैटलॉग और चैट निर्देश।
  </Card>
</CardGroup>
