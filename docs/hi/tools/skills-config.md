---
read_when:
    - Skills लोडिंग, इंस्टॉल या गेटिंग व्यवहार कॉन्फ़िगर करना
    - प्रति-एजेंट skill दृश्यता सेट करना
    - Skill Workshop सीमाएँ या स्वीकृति नीति समायोजित करना
sidebarTitle: Skills config
summary: skills.* कॉन्फ़िग स्कीमा, एजेंट allowlists, कार्यशाला सेटिंग्स, और sandbox env var हैंडलिंग के लिए पूर्ण संदर्भ।
title: Skills कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-06-29T00:23:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

अधिकांश Skills कॉन्फ़िगरेशन `skills` के अंतर्गत
`~/.openclaw/openclaw.json` में रहता है। Agent-विशिष्ट दृश्यता
`agents.defaults.skills` और `agents.list[].skills` के अंतर्गत रहती है।

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
      approvalPolicy: "pending",
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
  अंतर्निहित इमेज जनरेशन के लिए, `skills.entries` के बजाय
  `agents.defaults.imageGenerationModel` और मुख्य `image_generate` टूल का उपयोग करें। Skill
  entries केवल कस्टम या तृतीय-पक्ष Skill कार्यप्रवाहों के लिए हैं।
</Note>

## लोडिंग (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  स्कैन करने के लिए अतिरिक्त Skill डायरेक्टरियां, सबसे कम प्राथमिकता पर (बंडल किए गए
  और Plugin Skills के बाद)। पाथ `~` समर्थन के साथ विस्तारित किए जाते हैं।
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  भरोसेमंद वास्तविक लक्ष्य डायरेक्टरियां जिनमें symlink किए गए Skill फ़ोल्डर resolve हो सकते हैं,
  भले ही symlink कॉन्फ़िगर किए गए root के बाहर हो। इसे
  `<workspace>/skills/manager -> ~/Projects/manager/skills` जैसे जानबूझकर बनाए गए sibling-repo layouts
  के लिए उपयोग करें। इस सूची को सीमित रखें — `~` या `~/Projects` जैसे व्यापक roots की ओर संकेत न करें।
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Skill फ़ोल्डरों को देखें और `SKILL.md` फ़ाइलों में बदलाव होने पर Skills snapshot को
  refresh करें। grouped Skill roots के अंतर्गत nested फ़ाइलें भी शामिल हैं।
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill watcher events के लिए debounce window, milliseconds में।
</ParamField>

## इंस्टॉल (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  जब `brew` उपलब्ध हो, तो Homebrew installers को प्राथमिकता दें।
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill installs के लिए Node package manager प्राथमिकता। यह केवल Skill
  installs को प्रभावित करता है — Gateway runtime को फिर भी Node का उपयोग करना चाहिए (WhatsApp/Telegram के लिए Bun अनुशंसित नहीं है)।
  npm, pnpm, या bun के लिए `openclaw setup --node-manager` का उपयोग करें;
  Yarn-आधारित Skill installs के लिए `"yarn"` को manually set करें।
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  भरोसेमंद `operator.admin` Gateway clients को `skills.upload.*` के माध्यम से staged private zip
  archives install करने दें। सामान्य ClawHub installs को
  इस setting की आवश्यकता नहीं होती।
</ParamField>

## ऑपरेटर इंस्टॉल नीति (`security.installPolicy`)

`security.installPolicy` का उपयोग तब करें जब ऑपरेटरों को होस्ट-विशिष्ट नीति के साथ
Skills और Plugin इंस्टॉल को स्वीकृत या ब्लॉक करने के लिए किसी भरोसेमंद स्थानीय कमांड की आवश्यकता हो। नीति
OpenClaw द्वारा स्रोत सामग्री स्टेज करने के बाद और इंस्टॉल या अपडेट
जारी रहने से पहले चलती है। यह ClawHub Skills, अपलोड किए गए Skills, Git/local Skills,
Skill निर्भरता इंस्टॉलर, और Plugin इंस्टॉल/अपडेट स्रोतों पर लागू होती है।

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
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
  ऑपरेटर-स्वामित्व वाली इंस्टॉल नीति सक्षम करता है। वैध `exec`
  कमांड के बिना सक्षम होने पर, इंस्टॉल बंद-स्थिति में विफल हो जाते हैं।
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  वैकल्पिक लक्ष्य फ़िल्टर। छोड़े जाने पर, नीति हर समर्थित लक्ष्य पर लागू होती है
  ताकि नए इंस्टॉल अप्रत्याशित रूप से खुले न रह जाएँ।
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  भरोसेमंद नीति executable का absolute path। OpenClaw इसे
  shell के बिना चलाता है और उपयोग से पहले path को validate करता है।
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` के बाद पास किए जाने वाले static arguments।
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  एक नीति निर्णय के लिए अधिकतम wall-clock runtime।
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  नीति के बंद-स्थिति में विफल होने से पहले stdout या stderr output के बिना अधिकतम समय।
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  नीति प्रक्रिया से स्वीकार किए जाने वाले संयुक्त stdout और stderr bytes की अधिकतम संख्या।
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  नीति प्रक्रिया को दिए गए literal environment variables।
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw प्रक्रिया से नीति प्रक्रिया में कॉपी किए गए environment variable names।
  केवल नामित variables पास किए जाते हैं।
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  उन directories की वैकल्पिक allowlist जिनमें नीति executable हो सकता है।
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  कमांड पाथ के स्वामित्व और अनुमति जांचों को बायपास करता है। इसका उपयोग केवल
  तब करें जब पाथ किसी अन्य तंत्र से सुरक्षित हो।
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  कॉन्फ़िगर किए गए कमांड पाथ को symlink होने की अनुमति देता है। resolved target को
  फिर भी अन्य पाथ जांचों को पूरा करना होगा। Interpreter script arguments सीधे
  regular files होने चाहिए, symlinks नहीं।
</ParamField>

पॉलिसी stdin पर `protocolVersion: 1`, `openclawVersion`, `targetType`,
`targetName`, `sourcePath`, `sourcePathKind`, वैकल्पिक संरचित `source`,
संरचित `origin`, और `request` के साथ एक JSON ऑब्जेक्ट प्राप्त करती है। इसे stdout
पर एक JSON ऑब्जेक्ट लिखना होगा: `{ "protocolVersion": 1, "decision": "allow" }` या
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`। non-zero
exit, timeout, malformed JSON, missing fields, या unsupported protocol versions
fail closed होते हैं।

सामान्य Gateway startup के दौरान OpenClaw install policy निष्पादित नहीं करता। जब
policy सक्षम हो लेकिन उपलब्ध न हो, तो installs और updates fail closed होते हैं।
`openclaw doctor` static validation करता है, और `openclaw doctor --deep`
कॉन्फ़िगर किए गए command के विरुद्ध synthetic install probe निष्पादित करता है।

Bulk updates हर target पर अलग से policy लागू करते हैं: block किया गया skill या Plugin update
उस target को विफल करता है, policy को अक्षम किए बिना या batch में बाद के targets को छोड़े बिना।

Example stdin:

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

न्यूनतम policy command:

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
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## बंडल किए गए skill की अनुमति-सूची

<ParamField path="skills.allowBundled" type="string[]">
  केवल **बंडल किए गए** skills के लिए वैकल्पिक अनुमति-सूची। सेट होने पर, केवल सूची
  में मौजूद बंडल किए गए skills पात्र होते हैं। Managed, agent-level, और workspace skills
  अप्रभावित रहते हैं।
</ParamField>

## प्रति-skill प्रविष्टियां (`skills.entries`)

`entries` के अंतर्गत keys डिफ़ॉल्ट रूप से skill `name` से मेल खाती हैं। यदि कोई skill
`metadata.openclaw.skillKey` परिभाषित करता है, तो उसके बजाय वह key उपयोग करें।
hyphenated names को quote करें (JSON5 quoted keys की अनुमति देता है)।

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` skill को अक्षम करता है, भले ही वह बंडल या install किया गया हो। `coding-agent`
  बंडल किया गया skill opt-in है — इसे `true` पर सेट करें और सुनिश्चित करें कि `claude`,
  `codex`, `opencode`, या कोई अन्य समर्थित CLI install और authenticated है।
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  उन skills के लिए सुविधा field जो `metadata.openclaw.primaryEnv` घोषित करते हैं।
  plaintext string या SecretRef का समर्थन करता है: `{ source: "env", provider: "default", id: "VAR_NAME" }`।
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  agent run के लिए inject किए गए environment variables। केवल तब inject किए जाते हैं जब
  variable process में पहले से set नहीं होता।
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  custom प्रति-skill configuration fields के लिए वैकल्पिक bag।
</ParamField>

## Agent अनुमति-सूचियां (`agents`)

जब आप समान machine/workspace skill roots चाहते हों लेकिन हर agent के लिए
अलग visible skill set चाहिए, तब agent config का उपयोग करें।

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<ParamField path="agents.defaults.skills" type="string[]">
  उन agents द्वारा inherited shared baseline अनुमति-सूची जो `agents.list[].skills` छोड़ देते हैं।
  skills को डिफ़ॉल्ट रूप से unrestricted छोड़ने के लिए इसे पूरी तरह omit करें।
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  उस agent के लिए स्पष्ट final skill set। स्पष्ट सूचियां inherited defaults को **replace**
  करती हैं — वे merge नहीं करतीं। उस agent के लिए कोई skills expose न करने के लिए `[]` सेट करें।
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  जब `true` हो, तो agents सफल turns के बाद टिकाऊ conversation signals से pending proposals
  बना सकते हैं। User-prompted skill creation इस setting की परवाह किए बिना हमेशा
  Skill Workshop से होकर जाता है।
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` agent-initiated apply, reject, या quarantine से पहले operator approval मांगता है।
  `auto` इन actions को approval के बिना अनुमति देता है।
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Skill Workshop apply को उन workspace skill symlinks के माध्यम से लिखने दें जिनका
  real target पहले से `skills.load.allowSymlinkTargets` द्वारा trusted है। इसे
  disabled रखें, जब तक generated proposal applies को उस shared skill root को mutate नहीं करना चाहिए।
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  प्रति वर्कस्पेस रखे जाने वाले लंबित और क्वारंटाइन किए गए प्रस्तावों की अधिकतम संख्या।
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  प्रस्ताव बॉडी का अधिकतम आकार, बाइट में। प्रस्ताव विवरणों पर 160 बाइट की
  सख्त सीमा है क्योंकि वे खोज और सूची आउटपुट में दिखाई देते हैं।
</ParamField>

## सिमलिंक किए गए skill roots

डिफ़ॉल्ट रूप से, वर्कस्पेस, प्रोजेक्ट-एजेंट, अतिरिक्त-निर्देशिका, और बंडल किए गए skill roots
कंटेनमेंट सीमाएं हैं। `<workspace>/skills` के अंतर्गत कोई सिमलिंक किया गया skill फ़ोल्डर
जो root के बाहर resolve होता है, लॉग संदेश के साथ छोड़ दिया जाता है।

जानबूझकर बनाए गए सिमलिंक लेआउट की अनुमति देने के लिए, विश्वसनीय लक्ष्य घोषित करें:

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

इस कॉन्फ़िग के साथ, `<workspace>/skills/manager -> ~/Projects/manager/skills` को
realpath resolution के बाद स्वीकार किया जाता है। `extraDirs` sibling repo को सीधे स्कैन करता है;
`allowSymlinkTargets` मौजूदा लेआउट के लिए सिमलिंक किए गए पथ को सुरक्षित रखता है।

Skill Workshop apply डिफ़ॉल्ट रूप से उन सिमलिंक के माध्यम से नहीं लिखता। Workshop apply को
पहले से विश्वसनीय सिमलिंक लक्ष्यों के अंतर्गत skills बदलने देने के लिए, अलग से opt in करें:

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

प्रबंधित `~/.openclaw/skills` और निजी `~/.agents/skills` निर्देशिकाएं
पहले से skill-directory सिमलिंक स्वीकार करती हैं (प्रति-skill `SKILL.md` कंटेनमेंट फिर भी लागू होता है)।

## सैंडबॉक्स किए गए skills और env vars

<Warning>
  `skills.entries.<skill>.env` और `apiKey` केवल **host** runs पर लागू होते हैं। sandbox के अंदर
  उनका कोई प्रभाव नहीं होता — `GEMINI_API_KEY` पर निर्भर कोई skill
  `apiKey not configured` के साथ विफल होगा, जब तक sandbox को यह variable
  अलग से न दिया जाए।
</Warning>

Docker sandbox में secrets इस तरह पास करें:

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
  Docker daemon access वाले उपयोगकर्ता Docker metadata के माध्यम से `sandbox.docker.env` मानों
  की जांच कर सकते हैं। जब यह exposure स्वीकार्य न हो, तो mounted secret file, custom image, या
  कोई दूसरा delivery path उपयोग करें।
</Note>

## लोडिंग क्रम रिमाइंडर

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

watcher सक्षम होने पर skills और config में बदलाव अगले नए session पर प्रभावी होते हैं,
या watcher द्वारा बदलाव का पता लगाने पर अगले agent turn में।

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills reference" href="/hi/tools/skills" icon="puzzle-piece">
    skills क्या हैं, loading order, gating, और SKILL.md format।
  </Card>
  <Card title="Creating skills" href="/hi/tools/creating-skills" icon="hammer">
    custom workspace skills लिखना।
  </Card>
  <Card title="Skill Workshop" href="/hi/tools/skill-workshop" icon="flask">
    agent-drafted skills के लिए प्रस्ताव queue।
  </Card>
  <Card title="Slash commands" href="/hi/tools/slash-commands" icon="terminal">
    Native slash-command catalog और chat directives।
  </Card>
</CardGroup>
