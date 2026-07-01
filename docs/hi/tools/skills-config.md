---
read_when:
    - Skills लोड करना, इंस्टॉलेशन या गेटिंग व्यवहार कॉन्फ़िगर करना
    - प्रति-एजेंट skill दृश्यता सेट करना
    - Skill Workshop सीमाएँ या स्वीकृति नीति समायोजित करना
sidebarTitle: Skills config
summary: skills.* कॉन्फ़िग स्कीमा, एजेंट allowlists, workshop सेटिंग्स, और sandbox env var हैंडलिंग के लिए पूर्ण संदर्भ।
title: Skills कॉन्फ़िगरेशन
x-i18n:
    generated_at: "2026-07-01T08:07:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

अधिकांश कौशल कॉन्फ़िगरेशन `~/.openclaw/openclaw.json` में
`skills` के अंतर्गत रहता है। एजेंट-विशिष्ट दृश्यता
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
  बिल्ट-इन इमेज जनरेशन के लिए, `skills.entries` के बजाय
  `agents.defaults.imageGenerationModel` और कोर `image_generate` टूल का उपयोग करें। कौशल
  प्रविष्टियां केवल कस्टम या तृतीय-पक्ष कौशल वर्कफ़्लो के लिए हैं।
</Note>

## लोड करना (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  स्कैन करने के लिए अतिरिक्त कौशल डायरेक्टरियां, सबसे कम प्राथमिकता पर (बंडल किए गए
  और Plugin कौशल के बाद)। पाथ `~` समर्थन के साथ विस्तारित किए जाते हैं।
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  विश्वसनीय वास्तविक लक्ष्य डायरेक्टरियां जिनमें सिमलिंक किए गए कौशल फ़ोल्डर रिज़ॉल्व हो सकते हैं,
  भले ही सिमलिंक कॉन्फ़िगर किए गए रूट के बाहर हो। इसका उपयोग
  जानबूझकर बनाए गए सिबलिंग-रेपो लेआउट के लिए करें, जैसे
  `<workspace>/skills/manager -> ~/Projects/manager/skills`। इस सूची को
  सीमित रखें — `~` या `~/Projects` जैसे व्यापक रूट की ओर संकेत न करें।
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  कौशल फ़ोल्डर देखें और `SKILL.md` फ़ाइलों में बदलाव होने पर कौशल स्नैपशॉट
  रीफ़्रेश करें। समूहित कौशल रूट के अंतर्गत नेस्टेड फ़ाइलों को कवर करता है।
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  कौशल वॉचर इवेंट के लिए मिलीसेकंड में डिबाउंस विंडो।
</ParamField>

## इंस्टॉल (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  `brew` उपलब्ध होने पर Homebrew इंस्टॉलर को प्राथमिकता दें।
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  कौशल इंस्टॉल के लिए Node पैकेज मैनेजर प्राथमिकता। यह केवल कौशल
  इंस्टॉल को प्रभावित करता है — Gateway रनटाइम को फिर भी Node का उपयोग करना चाहिए (WhatsApp/Telegram के लिए Bun की अनुशंसा नहीं है)।
  npm, pnpm, या bun के लिए `openclaw setup --node-manager` का उपयोग करें;
  Yarn-समर्थित कौशल इंस्टॉल के लिए `"yarn"` मैन्युअल रूप से सेट करें।
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  विश्वसनीय `operator.admin` Gateway क्लाइंट को `skills.upload.*` के माध्यम से स्टेज किए गए निजी zip
  आर्काइव इंस्टॉल करने दें। सामान्य ClawHub इंस्टॉल के लिए
  इस सेटिंग की आवश्यकता नहीं है।
</ParamField>

## ऑपरेटर इंस्टॉल नीति (`security.installPolicy`)

जब ऑपरेटर को होस्ट-विशिष्ट नीति के साथ कौशल और Plugin इंस्टॉल को
स्वीकृत या ब्लॉक करने के लिए किसी विश्वसनीय स्थानीय कमांड की आवश्यकता हो, तो `security.installPolicy` का उपयोग करें। नीति
OpenClaw द्वारा स्रोत सामग्री स्टेज करने के बाद और इंस्टॉल या अपडेट
जारी रहने से पहले चलती है। यह ClawHub कौशल, अपलोड किए गए कौशल, Git/स्थानीय कौशल,
कौशल डिपेंडेंसी इंस्टॉलर, और Plugin इंस्टॉल/अपडेट स्रोतों पर लागू होती है।

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
  कमांड के बिना सक्षम होने पर, इंस्टॉल fail closed होते हैं।
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  वैकल्पिक लक्ष्य फ़िल्टर। छोड़े जाने पर, नीति हर समर्थित लक्ष्य पर लागू होती है
  ताकि नए इंस्टॉल अप्रत्याशित रूप से fail open न हों।
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  विश्वसनीय नीति executable का absolute path। OpenClaw इसे
  shell के बिना चलाता है और उपयोग से पहले पाथ को वैलिडेट करता है।
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  `command` के बाद पास किए गए स्थिर आर्ग्युमेंट।
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  एक नीति निर्णय के लिए अधिकतम wall-clock रनटाइम।
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  नीति के fail closed होने से पहले stdout या stderr आउटपुट के बिना अधिकतम समय।
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  नीति प्रक्रिया से स्वीकार किए जाने वाले अधिकतम संयुक्त stdout और stderr बाइट।
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  नीति प्रक्रिया को प्रदान किए गए literal environment variables।
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  OpenClaw प्रक्रिया से नीति प्रक्रिया में कॉपी किए गए environment variable नाम।
  केवल नामित variables पास किए जाते हैं।
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  उन डायरेक्टरियों की वैकल्पिक allowlist जिनमें नीति executable हो सकता है।
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  कमांड पाथ ownership और permission जांचों को बायपास करता है। केवल तब उपयोग करें जब पाथ
  किसी अन्य mechanism द्वारा सुरक्षित हो।
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  कॉन्फ़िगर किए गए कमांड पाथ को सिमलिंक होने देता है। resolved target को
  फिर भी अन्य पाथ जांचें पूरी करनी होंगी। Interpreter script arguments
  सीधे regular files होने चाहिए, सिमलिंक नहीं।
</ParamField>

नीति stdin पर `protocolVersion: 1`, `openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
वैकल्पिक structured `source`, structured `origin`, और `request` के साथ एक JSON object प्राप्त करती है। इसे stdout पर
एक JSON object लिखना होगा: `{ "protocolVersion": 1, "decision": "allow" }` या
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`। Non-zero
exit, timeout, malformed JSON, missing fields, या unsupported protocol versions
fail closed होते हैं।

OpenClaw सामान्य Gateway startup के दौरान install policy execute नहीं करता। policy सक्षम लेकिन unavailable होने पर installs
और updates fail closed होते हैं। `openclaw doctor`
static validation करता है, और `openclaw doctor --deep` configured command के विरुद्ध एक synthetic
install probe execute करता है।

Bulk updates target के अनुसार policy apply करते हैं: blocked skill या Plugin update
उस target को fail करता है, policy को disable किए बिना या batch में बाद के targets को skip किए बिना।

उदाहरण stdin:

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
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## बंडल किए गए कौशल की allowlist

<ParamField path="skills.allowBundled" type="string[]">
  केवल **बंडल किए गए** कौशल के लिए वैकल्पिक allowlist। सेट होने पर, सूची में मौजूद केवल बंडल किए गए कौशल
  पात्र होते हैं। Managed, agent-level, और workspace कौशल
  अप्रभावित रहते हैं।
</ParamField>

## प्रति-कौशल प्रविष्टियां (`skills.entries`)

`entries` के अंतर्गत keys default रूप से skill `name` से match करती हैं। यदि कोई skill
`metadata.openclaw.skillKey` define करता है, तो उसके बजाय उस key का उपयोग करें। hyphenated names को quote करें
(JSON5 quoted keys की अनुमति देता है)।

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` skill को disable करता है, भले ही वह bundled या installed हो। `coding-agent`
  bundled skill opt-in है — इसे `true` पर सेट करें और सुनिश्चित करें कि `claude`,
  `codex`, `opencode`, या कोई अन्य supported CLI installed और authenticated है।
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  उन skills के लिए convenience field जो `metadata.openclaw.primaryEnv` declare करते हैं।
  plaintext string या SecretRef support करता है: `{ source: "env", provider: "default", id: "VAR_NAME" }`।
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  agent run के लिए inject किए गए environment variables। केवल तब inject किए जाते हैं जब
  variable process में पहले से set न हो।
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  custom per-skill configuration fields के लिए वैकल्पिक bag।
</ParamField>

## एजेंट allowlists (`agents`)

जब आप समान machine/workspace skill roots लेकिन प्रति agent
अलग visible skill set चाहते हैं, तो agent config का उपयोग करें।

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
  उन agents द्वारा inherited shared baseline allowlist जो `agents.list[].skills` omit करते हैं।
  skills को default रूप से unrestricted छोड़ने के लिए पूरी तरह omit करें।
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  उस agent के लिए explicit final skill set। Explicit lists inherited
  defaults को **replace** करती हैं — वे merge नहीं करतीं। उस agent के लिए कोई skills expose न करने के लिए `[]` पर set करें।
</ParamField>

<Warning>
  Agent skill allowlists OpenClaw skill
  discovery, prompts, slash-command discovery, sandbox sync, और skill
  snapshots के लिए visibility और loading filter हैं। वे shell-time authorization boundary नहीं हैं। यदि कोई agent
  host `exec` run कर सकता है, तो वह shell अब भी external clients run कर सकता है या host files पढ़ सकता है
  जो execution user को visible हैं, जिसमें MCP client registries जैसे
  `~/.openclaw/skills/config/mcporter.json` शामिल हैं। per-agent MCP isolation के लिए,
  skill allowlists को sandbox/OS-user isolation के साथ combine करें, host exec को deny करें या tightly
  allowlist करें, और MCP server पर per-agent credentials को prefer करें।
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  जब `true` हो, तो agents सफल turns के बाद durable conversation
  signals से pending proposals create कर सकते हैं। User-prompted skill creation हमेशा
  इस setting की परवाह किए बिना Skill Workshop से होकर जाती है।
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` के लिए एजेंट द्वारा शुरू किए गए लागू करने, अस्वीकार करने, या
  क्वारंटीन से पहले ऑपरेटर की स्वीकृति आवश्यक होती है। `auto` उन कार्रवाइयों को बिना स्वीकृति की अनुमति देता है।
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Skill Workshop apply को उन workspace skill सिमलिंक के माध्यम से लिखने की अनुमति दें जिनका
  वास्तविक लक्ष्य पहले से ही `skills.load.allowSymlinkTargets` द्वारा विश्वसनीय है। इसे
  अक्षम रखें जब तक कि जनरेट किए गए प्रस्ताव लागू होने पर उस साझा skill
  रूट को बदलना आवश्यक न हो।
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  प्रति workspace रखे जाने वाले अधिकतम लंबित और क्वारंटीन किए गए प्रस्ताव।
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  बाइट में अधिकतम प्रस्ताव बॉडी आकार। प्रस्ताव विवरणों पर
  160 बाइट की कठोर सीमा है क्योंकि वे डिस्कवरी और लिस्टिंग आउटपुट में दिखाई देते हैं।
</ParamField>

## सिमलिंक किए गए skill रूट

डिफ़ॉल्ट रूप से, workspace, project-agent, extra-dir, और bundled skill रूट
containment सीमाएं हैं। `<workspace>/skills` के अंतर्गत ऐसा सिमलिंक किया गया skill फ़ोल्डर
जो रूट के बाहर resolve होता है, लॉग संदेश के साथ छोड़ दिया जाता है।

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

इस config के साथ, `<workspace>/skills/manager -> ~/Projects/manager/skills` को
realpath resolution के बाद स्वीकार किया जाता है। `extraDirs` sibling repo को सीधे स्कैन करता है;
`allowSymlinkTargets` मौजूदा लेआउट के लिए सिमलिंक किए गए path को सुरक्षित रखता है।

Skill Workshop apply डिफ़ॉल्ट रूप से उन सिमलिंक के माध्यम से नहीं लिखता। Workshop apply को
पहले से विश्वसनीय सिमलिंक लक्ष्यों के अंतर्गत skills बदलने देने के लिए, अलग से
opt in करें:

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

प्रबंधित `~/.openclaw/skills` और व्यक्तिगत `~/.agents/skills` directories
पहले से ही skill-directory सिमलिंक स्वीकार करती हैं (प्रति-skill `SKILL.md` containment अभी भी
लागू होता है)।

## सैंडबॉक्स किए गए skills और env vars

<Warning>
  `skills.entries.<skill>.env` और `apiKey` केवल **host** runs पर लागू होते हैं। सैंडबॉक्स के अंदर
  उनका कोई प्रभाव नहीं होता — `GEMINI_API_KEY` पर निर्भर skill
  `apiKey not configured` के साथ विफल होगा, जब तक कि सैंडबॉक्स को variable
  अलग से न दिया जाए।
</Warning>

Docker सैंडबॉक्स में secrets इस तरह पास करें:

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
  की जांच कर सकते हैं। जब वह exposure स्वीकार्य न हो, तो mounted secret file, custom image, या
  कोई अन्य delivery path उपयोग करें।
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
या जब watcher कोई बदलाव detect करता है तो अगले agent turn पर।

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills संदर्भ" href="/hi/tools/skills" icon="puzzle-piece">
    Skills क्या हैं, loading order, gating, और SKILL.md format।
  </Card>
  <Card title="Skills बनाना" href="/hi/tools/creating-skills" icon="hammer">
    custom workspace skills लिखना।
  </Card>
  <Card title="Skill Workshop" href="/hi/tools/skill-workshop" icon="flask">
    एजेंट द्वारा draft किए गए skills के लिए proposal queue।
  </Card>
  <Card title="स्लैश कमांड" href="/hi/tools/slash-commands" icon="terminal">
    native slash-command catalog और chat directives।
  </Card>
</CardGroup>
