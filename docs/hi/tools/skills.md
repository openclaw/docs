---
read_when:
    - Skills जोड़ना या संशोधित करना
    - Skill गेटिंग, अनुमति-सूचियाँ, या लोड नियम बदलना
    - स्किल प्राथमिकता और स्नैपशॉट व्यवहार को समझना
sidebarTitle: Skills
summary: Skills आपके agent को tools का उपयोग करना सिखाते हैं। जानें कि वे कैसे लोड होते हैं, precedence कैसे काम करता है, और gating, allowlists, व environment injection को कैसे configure करें।
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:32:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills मार्कडाउन निर्देश फ़ाइलें हैं, जो एजेंट को सिखाती हैं कि टूल्स का उपयोग कैसे और कब करना है। प्रत्येक स्किल एक डायरेक्टरी में रहती है जिसमें YAML frontmatter और मार्कडाउन बॉडी वाली `SKILL.md` फ़ाइल होती है। OpenClaw बंडल्ड Skills और किसी भी स्थानीय ओवरराइड को लोड करता है, और वातावरण, कॉन्फ़िग, तथा बाइनरी उपलब्धता के आधार पर लोड समय पर उन्हें फ़िल्टर करता है।

<CardGroup cols={2}>
  <Card title="स्किल बनाना" href="/hi/tools/creating-skills" icon="hammer">
    शुरू से एक कस्टम स्किल बनाएँ और टेस्ट करें।
  </Card>
  <Card title="स्किल वर्कशॉप" href="/hi/tools/skill-workshop" icon="flask">
    एजेंट द्वारा ड्राफ़्ट किए गए स्किल प्रस्तावों की समीक्षा और स्वीकृति करें।
  </Card>
  <Card title="Skills कॉन्फ़िग" href="/hi/tools/skills-config" icon="gear">
    पूरा `skills.*` कॉन्फ़िग स्कीमा और एजेंट allowlists।
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    समुदाय की Skills ब्राउज़ और इंस्टॉल करें।
  </Card>
</CardGroup>

## लोडिंग क्रम

OpenClaw इन स्रोतों से लोड करता है, **सबसे अधिक प्राथमिकता पहले**। जब वही स्किल नाम कई जगहों पर दिखाई देता है, तो सबसे ऊँचा स्रोत जीतता है।

| प्राथमिकता   | स्रोत                   | पथ                                      |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — सबसे ऊँची | वर्कस्पेस Skills       | `<workspace>/skills`                    |
| 2           | प्रोजेक्ट एजेंट Skills  | `<workspace>/.agents/skills`            |
| 3           | व्यक्तिगत एजेंट Skills | `~/.agents/skills`                      |
| 4           | प्रबंधित / स्थानीय Skills | `~/.openclaw/skills`                 |
| 5           | बंडल्ड Skills          | इंस्टॉल के साथ शिप की गई               |
| 6 — सबसे कम | अतिरिक्त डायरेक्टरीज़   | `skills.load.extraDirs` + Plugin Skills |

स्किल रूट्स समूहित लेआउट का समर्थन करते हैं। OpenClaw किसी भी कॉन्फ़िगर किए गए रूट के नीचे कहीं भी `SKILL.md` दिखाई देने पर स्किल खोज लेता है:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

फ़ोल्डर पथ केवल संगठन के लिए है। स्किल का नाम, स्लैश कमांड, और allowlist कुंजी सभी `name` frontmatter फ़ील्ड से आते हैं (या `name` न होने पर डायरेक्टरी नाम से)।

<Note>
  Codex CLI की मूल `$CODEX_HOME/skills` डायरेक्टरी OpenClaw स्किल रूट **नहीं** है। उन Skills की इन्वेंटरी बनाने के लिए `openclaw migrate plan codex` का उपयोग करें, फिर उन्हें अपने OpenClaw वर्कस्पेस में कॉपी करने के लिए `openclaw migrate codex` चलाएँ।
</Note>

## प्रति-एजेंट बनाम साझा Skills

मल्टी-एजेंट सेटअप में, प्रत्येक एजेंट का अपना वर्कस्पेस होता है। अपनी वांछित दृश्यता से मेल खाने वाला पथ उपयोग करें:

| स्कोप          | पथ                          | किसे दिखाई देता है          |
| -------------- | ---------------------------- | --------------------------- |
| प्रति-एजेंट     | `<workspace>/skills`         | केवल उस एजेंट को            |
| प्रोजेक्ट-एजेंट | `<workspace>/.agents/skills` | केवल उस वर्कस्पेस के एजेंट को |
| व्यक्तिगत-एजेंट | `~/.agents/skills`           | इस मशीन के सभी एजेंटों को    |
| साझा प्रबंधित  | `~/.openclaw/skills`         | इस मशीन के सभी एजेंटों को    |
| अतिरिक्त dirs  | `skills.load.extraDirs`      | इस मशीन के सभी एजेंटों को    |

## एजेंट allowlists

स्किल **स्थान** (प्राथमिकता) और स्किल **दृश्यता** (कौन सा एजेंट इसे उपयोग कर सकता है) अलग नियंत्रण हैं। एजेंट कौन सी Skills देखता है, इसे सीमित करने के लिए allowlists का उपयोग करें, चाहे वे कहीं से भी लोड हुई हों।

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

<AccordionGroup>
  <Accordion title="Allowlist नियम">
    - सभी Skills को डिफ़ॉल्ट रूप से अनियंत्रित छोड़ने के लिए `agents.defaults.skills` हटाएँ।
    - `agents.defaults.skills` इनहेरिट करने के लिए `agents.list[].skills` हटाएँ।
    - उस एजेंट के लिए कोई Skills उजागर न करने के लिए `agents.list[].skills: []` सेट करें।
    - गैर-खाली `agents.list[].skills` सूची **अंतिम** सेट है — यह defaults के साथ merge नहीं होती।
    - प्रभावी allowlist prompt building, slash-command discovery, sandbox sync, और skill snapshots पर लागू होती है।
    - यह host shell authorization boundary नहीं है। यदि वही एजेंट `exec` उपयोग कर सकता है, तो उस shell को अलग से sandboxing, OS-user isolation, exec deny/allowlists, और प्रति-संसाधन credentials से सीमित करें।

  </Accordion>
</AccordionGroup>

## Plugins और Skills

Plugins अपनी `openclaw.plugin.json` में `skills` डायरेक्टरीज़ सूचीबद्ध करके अपनी Skills शिप कर सकते हैं (Plugin रूट के सापेक्ष पथ)। Plugin enabled होने पर Plugin Skills लोड होती हैं — उदाहरण के लिए, browser Plugin multi-step browser control के लिए `browser-automation` स्किल शिप करता है।

Plugin स्किल डायरेक्टरीज़ `skills.load.extraDirs` जैसी ही कम-प्राथमिकता वाले स्तर पर merge होती हैं, इसलिए समान नाम वाली बंडल्ड, प्रबंधित, एजेंट, या वर्कस्पेस स्किल उन्हें ओवरराइड कर देती है। उन्हें Plugin की कॉन्फ़िग एंट्री पर `metadata.openclaw.requires.config` के ज़रिए gate करें।

पूरे Plugin सिस्टम के लिए [Plugins](/hi/tools/plugin) और [Tools](/hi/tools) देखें।

## स्किल वर्कशॉप

[स्किल वर्कशॉप](/hi/tools/skill-workshop) एजेंट और आपकी सक्रिय स्किल फ़ाइलों के बीच एक प्रस्ताव queue है। जब एजेंट reusable work पहचानता है, तो वह सीधे `SKILL.md` में लिखने के बजाय एक प्रस्ताव ड्राफ़्ट करता है। कुछ भी बदलने से पहले आप समीक्षा और स्वीकृति करते हैं।

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

पूरे lifecycle, CLI reference, और configuration के लिए [स्किल वर्कशॉप](/hi/tools/skill-workshop) देखें।

## ClawHub से इंस्टॉल करना

[ClawHub](https://clawhub.ai) सार्वजनिक Skills registry है। install और update के लिए `openclaw skills` कमांड्स का उपयोग करें, या publish और sync के लिए `clawhub` CLI का उपयोग करें।

| कार्रवाई                             | कमांड                                                 |
| ---------------------------------- | ------------------------------------------------------ |
| वर्कस्पेस में स्किल इंस्टॉल करें      | `openclaw skills install @owner/<slug>`                |
| Git repository से इंस्टॉल करें       | `openclaw skills install git:owner/repo@ref`           |
| स्थानीय स्किल डायरेक्टरी इंस्टॉल करें | `openclaw skills install ./path/to/skill --as my-tool` |
| सभी स्थानीय एजेंटों के लिए इंस्टॉल करें | `openclaw skills install @owner/<slug> --global`     |
| सभी वर्कस्पेस Skills अपडेट करें      | `openclaw skills update --all`                         |
| साझा प्रबंधित स्किल अपडेट करें       | `openclaw skills update @owner/<slug> --global`        |
| सभी साझा प्रबंधित Skills अपडेट करें  | `openclaw skills update --all --global`                |
| स्किल का trust envelope सत्यापित करें | `openclaw skills verify @owner/<slug>`                |
| generated Skill Card प्रिंट करें     | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI से publish / sync करें   | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="इंस्टॉल विवरण">
    `openclaw skills install` डिफ़ॉल्ट रूप से सक्रिय वर्कस्पेस की `skills/` डायरेक्टरी में इंस्टॉल करता है। साझा `~/.openclaw/skills` डायरेक्टरी में इंस्टॉल करने के लिए `--global` जोड़ें, जो सभी स्थानीय एजेंटों को दिखाई देती है जब तक एजेंट allowlists इसे सीमित न करें।

    Git और स्थानीय इंस्टॉल स्रोत रूट पर `SKILL.md` की अपेक्षा करते हैं। मान्य होने पर slug `SKILL.md` frontmatter `name` से आता है, फिर डायरेक्टरी या repository नाम पर fallback करता है। ओवरराइड करने के लिए `--as <slug>` उपयोग करें। `openclaw skills update` केवल ClawHub installs को track करता है — Git या local sources को refresh करने के लिए उन्हें फिर से इंस्टॉल करें।

  </Accordion>
  <Accordion title="सत्यापन और सुरक्षा स्कैनिंग">
    `openclaw skills verify @owner/<slug>` ClawHub से स्किल का `clawhub.skill.verify.v1` trust envelope माँगता है। इंस्टॉल की गई ClawHub Skills `.clawhub/origin.json` में दर्ज version और registry के विरुद्ध verify होती हैं। मौजूदा installed या unambiguous Skills के लिए bare slugs स्वीकार रहते हैं, लेकिन owner-qualified refs publisher ambiguity से बचाते हैं।

    ClawHub स्किल पेज install से पहले latest security scan state दिखाते हैं, जिसमें VirusTotal, ClawScan, और static analysis के detail pages होते हैं। जब ClawHub verification को failed चिह्नित करता है, तो command non-zero exit करता है। Publishers ClawHub dashboard या `clawhub skill rescan @owner/<slug>` के ज़रिए false positives से recover करते हैं।

  </Accordion>
  <Accordion title="Private archive installs">
    जिन Gateway clients को non-ClawHub delivery चाहिए, वे `skills.upload.begin`, `skills.upload.chunk`, और `skills.upload.commit` के साथ zip skill archive stage कर सकते हैं, फिर `skills.install({ source: "upload", ... })` से इंस्टॉल कर सकते हैं। यह path डिफ़ॉल्ट रूप से off है और `openclaw.json` में `skills.install.allowUploadedArchives: true` की आवश्यकता होती है। सामान्य ClawHub installs को इस setting की कभी आवश्यकता नहीं होती।
  </Accordion>
</AccordionGroup>

## सुरक्षा

<Warning>
  third-party Skills को **untrusted code** मानें। सक्षम करने से पहले उन्हें पढ़ें। untrusted inputs और risky tools के लिए sandboxed runs को प्राथमिकता दें। agent-side controls के लिए [Sandboxing](/hi/gateway/sandboxing) देखें।
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Workspace, project-agent, और extra-dir skill discovery केवल वे skill roots स्वीकार करती है जिनका resolved realpath configured root के अंदर रहता है, जब तक `skills.load.allowSymlinkTargets` किसी target root पर स्पष्ट रूप से trust न करे। Skill Workshop उन trusted targets के ज़रिए केवल तब लिखता है जब `skills.workshop.allowSymlinkTargetWrites` enabled हो। Managed `~/.openclaw/skills` और personal `~/.agents/skills` में symlinked skill folders हो सकते हैं, लेकिन हर `SKILL.md` realpath को फिर भी अपनी resolved skill directory के अंदर रहना चाहिए।
  </Accordion>
  <Accordion title="Operator install policy">
    skill installs जारी रहने से पहले trusted local policy command चलाने के लिए `security.installPolicy` कॉन्फ़िगर करें। policy metadata और staged source path प्राप्त करती है, ClawHub, uploaded, Git, local, update, और dependency-installer paths पर लागू होती है, और command valid decision return न कर पाने पर fails closed होती है।
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` और `skills.entries.*.apiKey` secrets को केवल उस agent turn के लिए **host** process में inject करते हैं — sandbox में नहीं। secrets को prompts और logs से बाहर रखें।
  </Accordion>
</AccordionGroup>

व्यापक threat model और security checklists के लिए [Security](/hi/gateway/security) देखें।

## SKILL.md फ़ॉर्मैट

हर स्किल को frontmatter में कम से कम `name` और `description` चाहिए:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw [AgentSkills](https://agentskills.io) spec का पालन करता है। frontmatter parser **केवल single-line keys** का समर्थन करता है — `metadata` एक single-line JSON object होना चाहिए। स्किल folder path को reference करने के लिए body में `{baseDir}` उपयोग करें।
</Note>

### वैकल्पिक frontmatter keys

<ParamField path="homepage" type="string">
  macOS Skills UI में "Website" के रूप में दिखाई जाने वाली URL। `metadata.openclaw.homepage` के ज़रिए भी समर्थित।
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  जब `true` हो, तो स्किल user-invocable slash command के रूप में exposed होती है।
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  जब `true` हो, तो OpenClaw स्किल के instructions को एजेंट के सामान्य prompt से बाहर रखता है। `user-invocable` भी `true` होने पर स्किल slash command के रूप में अभी भी उपलब्ध रहती है।
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` पर set होने पर, slash command model को bypass करती है और सीधे registered tool को dispatch करती है।
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` set होने पर invoke करने वाला tool name।
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  टूल डिस्पैच के लिए, कच्ची args स्ट्रिंग को बिना किसी core parsing के
  टूल को आगे भेजता है। टूल को
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` मिलता है।
</ParamField>

## गेटिंग

OpenClaw लोड समय पर `metadata.openclaw` (frontmatter में एक-पंक्ति
JSON) का उपयोग करके skills को फ़िल्टर करता है। जिस skill में `metadata.openclaw` ब्लॉक
नहीं है, वह हमेशा पात्र होती है, जब तक उसे स्पष्ट रूप से अक्षम न किया गया हो।

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
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
  जब `true` हो, skill को हमेशा शामिल करें और बाकी सभी gates छोड़ दें।
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI में दिखाया जाने वाला वैकल्पिक emoji।
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI में "वेबसाइट" के रूप में दिखाया जाने वाला वैकल्पिक URL।
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  प्लेटफ़ॉर्म फ़िल्टर। सेट होने पर, skill केवल सूचीबद्ध OSes पर पात्र होती है।
</ParamField>

<ParamField path="requires.bins" type="string[]">
  हर binary `PATH` पर मौजूद होनी चाहिए।
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  कम से कम एक binary `PATH` पर मौजूद होनी चाहिए।
</ParamField>

<ParamField path="requires.env" type="string[]">
  हर env var process में मौजूद होनी चाहिए या config के माध्यम से दी जानी चाहिए।
</ParamField>

<ParamField path="requires.config" type="string[]">
  हर `openclaw.json` path truthy होना चाहिए।
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` से जुड़ा env var नाम।
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI द्वारा उपयोग किए जाने वाले वैकल्पिक installer specs (brew / node / go / uv / download)।
</ParamField>

<Note>
  Legacy `metadata.clawdbot` blocks अब भी स्वीकार किए जाते हैं जब
  `metadata.openclaw` अनुपस्थित हो, ताकि पुराने installed skills अपने
  dependency gates और installer hints बनाए रखें। नई skills को
  `metadata.openclaw` का उपयोग करना चाहिए।
</Note>

### इंस्टॉलर विनिर्देश

Installer specs macOS Skills UI को बताते हैं कि dependency कैसे install करनी है:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
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
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Installer selection rules">
    - जब कई installers सूचीबद्ध हों, Gateway एक पसंदीदा
      विकल्प चुनता है (उपलब्ध होने पर brew, अन्यथा node)।
    - यदि सभी installers `download` हैं, तो OpenClaw प्रत्येक entry सूचीबद्ध करता है ताकि आप
      सभी उपलब्ध artifacts देख सकें।
    - Specs में platform के आधार पर filter करने के लिए `os: ["darwin"|"linux"|"win32"]` शामिल हो सकता है।
    - Node installs `openclaw.json` में `skills.install.nodeManager` का सम्मान करते हैं
      (default: npm; options: npm / pnpm / yarn / bun)। यह केवल skill
      installs को प्रभावित करता है; Gateway runtime अब भी Node होना चाहिए।
    - Gateway installer preference: Homebrew → uv → configured node manager →
      go → download।
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw Homebrew को auto-install नहीं करता या brew
      formulas को system package commands में translate नहीं करता। Linux containers में जहाँ
      `brew` नहीं है, brew-only installers छिपे रहते हैं; custom image का उपयोग करें या
      dependency को manually install करें।
    - **Go:** OpenClaw automatic skill installs के लिए Go 1.21 या उससे नया मांगता है और
      मौजूदा `GOBIN`, `GOPATH`, और `GOTOOLCHAIN` settings को सुरक्षित रखता है। यदि
      configured toolchain किसी module के required Go version को satisfy नहीं कर सकता,
      तो onboarding install attempt के बाद skill को manual Go prerequisites के साथ group करता है।
      यदि `go` गायब है और Homebrew उपलब्ध है, तो OpenClaw पहले
      Homebrew के माध्यम से Go install करता है और `GOBIN` को Homebrew के `bin` पर set करता है। Linux पर,
      OpenClaw इसके बजाय root के रूप में या passwordless `sudo` के माध्यम से `apt-get` का उपयोग कर सकता है
      जब refreshed `golang-go` candidate minimum version को पूरा करता हो।
    - **Download:** `url` (required), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (default: archive detected होने पर auto), `stripComponents`,
      `targetDir` (default: `~/.openclaw/tools/<skillKey>`)।
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` skill load time पर **host** पर check किया जाता है। यदि कोई agent
    sandbox में चलता है, तो binary **container के अंदर** भी मौजूद होनी चाहिए।
    इसे `agents.defaults.sandbox.docker.setupCommand` या custom
    image के माध्यम से install करें। `setupCommand` container creation के बाद एक बार चलता है और उसे
    network egress, writable root FS, और sandbox में root user चाहिए।
  </Accordion>
</AccordionGroup>

## कॉन्फ़िग ओवरराइड्स

Bundled या managed skills को `~/.openclaw/openclaw.json` में
`skills.entries` के अंतर्गत toggle और configure करें:

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
  `false` skill को अक्षम करता है, भले ही वह bundled या installed हो। `coding-agent`
  bundled skill opt-in है — `skills.entries.coding-agent.enabled: true` set करें
  और सुनिश्चित करें कि `claude`, `codex`, `opencode`, या कोई दूसरा supported CLI
  installed और authenticated हो।
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  उन skills के लिए convenience field जो `metadata.openclaw.primaryEnv` declare करती हैं।
  Plaintext string या SecretRef object का समर्थन करता है।
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Agent run के लिए inject किए गए environment variables। केवल तब inject किए जाते हैं जब
  variable process में पहले से set न हो।
</ParamField>

<ParamField path="config" type="object">
  Custom per-skill configuration fields के लिए वैकल्पिक bag।
</ParamField>

<ParamField path="allowBundled" type="string[]">
  केवल **bundled** skills के लिए वैकल्पिक allowlist। सेट होने पर, केवल list में मौजूद bundled skills
  पात्र होती हैं। Managed और workspace skills अप्रभावित रहती हैं।
</ParamField>

<Note>
  Config keys default रूप से **skill name** से match करती हैं। यदि कोई skill
  `metadata.openclaw.skillKey` define करती है, तो `skills.entries` के अंतर्गत वही key उपयोग करें। Hyphenated
  names को quote करें: JSON5 quoted keys की अनुमति देता है।
</Note>

## एनवायरनमेंट इंजेक्शन

जब agent run शुरू होता है, OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw agent के लिए effective skill list resolve करता है, gating
    rules, allowlists, और config overrides apply करते हुए।
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` और `skills.entries.<key>.apiKey` run की अवधि के लिए
    `process.env` पर apply किए जाते हैं।
  </Step>
  <Step title="Builds the system prompt">
    पात्र skills को compact XML block में compile किया जाता है और
    system prompt में inject किया जाता है।
  </Step>
  <Step title="Restores the environment">
    Run समाप्त होने के बाद, मूल environment restore किया जाता है।
  </Step>
</Steps>

<Warning>
  Env injection **host** agent run तक scoped है, sandbox तक नहीं। Sandbox के अंदर,
  `env` और `apiKey` का कोई प्रभाव नहीं होता। Secrets को sandboxed runs में pass करने के तरीके के लिए
  [Skills कॉन्फ़िग](/hi/tools/skills-config#sandboxed-skills-and-env-vars) देखें।
</Warning>

Bundled `claude-cli` backend के लिए, OpenClaw उसी eligible skill snapshot को
temporary Claude Code plugin के रूप में materialize भी करता है और उसे
`--plugin-dir` के माध्यम से pass करता है। अन्य CLI backends केवल prompt catalog का उपयोग करते हैं।

## स्नैपशॉट और रिफ़्रेश

OpenClaw eligible skills को **session शुरू होने पर** snapshot करता है और session में
बाद के सभी turns के लिए उसी list का पुनः उपयोग करता है। Skills या config में बदलाव
अगले नए session पर प्रभावी होते हैं।

Skills mid-session दो मामलों में refresh होती हैं:

- Skills watcher `SKILL.md` बदलाव detect करता है।
- कोई नया eligible remote node connect करता है।

Refreshed list अगले agent turn पर pick up होती है। यदि effective agent
allowlist बदलती है, तो OpenClaw visible skills को aligned रखने के लिए snapshot refresh करता है।

<AccordionGroup>
  <Accordion title="Skills watcher">
    Default रूप से, OpenClaw skill folders को watch करता है और
    `SKILL.md` files बदलने पर snapshot bump करता है। `skills.load` के अंतर्गत configure करें:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    `allowSymlinkTargets` का उपयोग intentional symlinked layouts के लिए करें जहाँ कोई skill
    root symlink configured root के बाहर point करता हो, उदाहरण के लिए
    `<workspace>/skills/manager -> ~/Projects/manager/skills`।
    `skills.workshop.allowSymlinkTargetWrites` केवल तब enable करें जब Skill Workshop
    को उन trusted symlinked paths के माध्यम से proposals भी apply करनी हों।

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    यदि Gateway Linux पर चलता है लेकिन कोई **macOS node** connected है और
    `system.run` allowed है, तो OpenClaw macOS-only skills को eligible मान सकता है जब
    required binaries उस node पर मौजूद हों। Agent को उन
    skills को `exec` tool के माध्यम से `host=node` के साथ चलाना चाहिए।

    Offline nodes remote-only skills को visible **नहीं** बनाते। यदि कोई node
    bin probes का जवाब देना बंद कर देता है, तो OpenClaw उसके cached bin matches clear कर देता है।

  </Accordion>
</AccordionGroup>

## टोकन प्रभाव

जब skills eligible होती हैं, OpenClaw system
prompt में compact XML block inject करता है। लागत deterministic है:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Base overhead** (केवल जब ≥ 1 skill): ~195 characters
- **Per skill:** ~97 characters + आपके `name`, `description`, और `location` field lengths
- XML escaping `& < > " '` को entities में expand करता है, जिससे हर occurrence पर कुछ characters जुड़ते हैं
- ~4 chars/token पर, field lengths से पहले 97 chars ≈ प्रति skill 24 tokens

Prompt overhead को minimize करने के लिए descriptions छोटी और descriptive रखें।

## संबंधित

<CardGroup cols={2}>
  <Card title="Creating skills" href="/hi/tools/creating-skills" icon="hammer">
    Custom skill author करने के लिए step-by-step guide।
  </Card>
  <Card title="Skill Workshop" href="/hi/tools/skill-workshop" icon="flask">
    Agent-drafted skills के लिए proposal queue।
  </Card>
  <Card title="Skills config" href="/hi/tools/skills-config" icon="gear">
    पूरा `skills.*` config schema और agent allowlists।
  </Card>
  <Card title="Slash commands" href="/hi/tools/slash-commands" icon="terminal">
    Skill slash commands कैसे registered और routed होते हैं।
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Public registry पर skills browse और publish करें।
  </Card>
  <Card title="Plugins" href="/hi/tools/plugin" icon="plug">
    Plugins अपने documented tools के साथ skills ship कर सकते हैं।
  </Card>
</CardGroup>
