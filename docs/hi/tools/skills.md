---
read_when:
    - Skills जोड़ना या संशोधित करना
    - skill गेटिंग, अनुमति-सूचियों या लोड नियमों को बदलना
    - Skills की प्राथमिकता और स्नैपशॉट व्यवहार को समझना
sidebarTitle: Skills
summary: Skills आपके एजेंट को टूल्स का उपयोग करना सिखाते हैं। जानें कि वे कैसे लोड होते हैं, प्राथमिकता कैसे काम करती है, और gating, allowlists, तथा environment injection को कैसे कॉन्फ़िगर करें।
title: Skills
x-i18n:
    generated_at: "2026-06-29T00:23:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills markdown निर्देश फ़ाइलें हैं जो agent को सिखाती हैं कि tools का उपयोग कैसे और कब करना है। प्रत्येक skill एक ऐसी directory में रहती है जिसमें YAML frontmatter और markdown body वाली `SKILL.md` फ़ाइल होती है। OpenClaw bundled skills के साथ-साथ किसी भी local override को load करता है, और load time पर environment, config, और binary presence के आधार पर उन्हें filter करता है।

<CardGroup cols={2}>
  <Card title="Skills बनाना" href="/hi/tools/creating-skills" icon="hammer">
    शुरुआत से custom skill build और test करें।
  </Card>
  <Card title="Skill Workshop" href="/hi/tools/skill-workshop" icon="flask">
    agent-drafted skill proposals की समीक्षा और स्वीकृति दें।
  </Card>
  <Card title="Skills config" href="/hi/tools/skills-config" icon="gear">
    पूर्ण `skills.*` config schema और agent allowlists।
  </Card>
  <Card title="ClawHub" href="/hi/clawhub" icon="cloud">
    community skills browse और install करें।
  </Card>
</CardGroup>

## Loading order

OpenClaw इन sources से load करता है, **सबसे ऊंची precedence पहले**। जब वही skill name कई जगहों पर दिखाई देता है, तो सबसे ऊंचा source जीतता है।

| Priority    | Source                 | Path                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — highest | Workspace skills       | `<workspace>/skills`                    |
| 2           | Project agent skills   | `<workspace>/.agents/skills`            |
| 3           | Personal agent skills  | `~/.agents/skills`                      |
| 4           | Managed / local skills | `~/.openclaw/skills`                    |
| 5           | Bundled skills         | install के साथ shipped                 |
| 6 — lowest  | Extra directories      | `skills.load.extraDirs` + plugin skills |

Skill roots grouped layouts को support करते हैं। OpenClaw किसी configured root के नीचे कहीं भी `SKILL.md` दिखाई देने पर skill discover करता है:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Folder path केवल organization के लिए है। skill का name, slash command, और allowlist key सभी `name` frontmatter field से आते हैं (या `name` missing होने पर directory name से)।

<Note>
  Codex CLI की native `$CODEX_HOME/skills` directory OpenClaw skill root **नहीं** है। उन skills की inventory बनाने के लिए `openclaw migrate plan codex` का उपयोग करें, फिर उन्हें अपने OpenClaw workspace में copy करने के लिए `openclaw migrate codex` चलाएं।
</Note>

## Per-agent बनाम shared skills

Multi-agent setups में, प्रत्येक agent का अपना workspace होता है। अपने desired visibility से match करने वाला path उपयोग करें:

| Scope          | Path                         | Visible to                  |
| -------------- | ---------------------------- | --------------------------- |
| Per-agent      | `<workspace>/skills`         | केवल वह agent              |
| Project-agent  | `<workspace>/.agents/skills` | केवल उस workspace का agent |
| Personal-agent | `~/.agents/skills`           | इस machine पर सभी agents   |
| Shared managed | `~/.openclaw/skills`         | इस machine पर सभी agents   |
| Extra dirs     | `skills.load.extraDirs`      | इस machine पर सभी agents   |

## Agent allowlists

Skill **location** (precedence) और skill **visibility** (कौन सा agent इसका उपयोग कर सकता है) अलग controls हैं। कोई skill कहां से load हुई है, इससे अलग, agent कौन सी skills देखता है इसे restrict करने के लिए allowlists का उपयोग करें।

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
  <Accordion title="Allowlist rules">
    - default रूप से सभी skills को unrestricted छोड़ने के लिए `agents.defaults.skills` omit करें।
    - `agents.defaults.skills` inherit करने के लिए `agents.list[].skills` omit करें।
    - उस agent के लिए कोई skills expose न करने के लिए `agents.list[].skills: []` set करें।
    - non-empty `agents.list[].skills` list **final** set है — यह defaults के साथ merge नहीं होती।
    - effective allowlist prompt building, slash-command discovery, sandbox sync, और skill snapshots पर apply होती है।
  </Accordion>
</AccordionGroup>

## Plugins और skills

Plugins `openclaw.plugin.json` में `skills` directories list करके अपनी skills ship कर सकते हैं (paths plugin root के relative होते हैं)। Plugin enabled होने पर plugin skills load होती हैं — उदाहरण के लिए, browser plugin multi-step browser control के लिए `browser-automation` skill ship करता है।

Plugin skill directories `skills.load.extraDirs` के समान low-precedence level पर merge होती हैं, इसलिए same-named bundled, managed, agent, या workspace skill उन्हें override करती है। Plugin की config entry पर `metadata.openclaw.requires.config` के ज़रिए उन्हें gate करें।

पूर्ण plugin system के लिए [Plugins](/hi/tools/plugin) और [Tools](/hi/tools) देखें।

## Skill Workshop

[Skill Workshop](/hi/tools/skill-workshop) agent और आपकी active skill files के बीच proposal queue है। जब agent reusable work पहचानता है, तो वह सीधे `SKILL.md` में लिखने के बजाय proposal draft करता है। कुछ भी बदलने से पहले आप review और approve करते हैं।

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

पूर्ण lifecycle, CLI reference, और configuration के लिए [Skill Workshop](/hi/tools/skill-workshop) देखें।

## ClawHub से install करना

[ClawHub](https://clawhub.ai) public skills registry है। install और update के लिए `openclaw skills` commands का उपयोग करें, या publish और sync के लिए `clawhub` CLI का उपयोग करें।

| Action                             | Command                                                |
| ---------------------------------- | ------------------------------------------------------ |
| Workspace में skill install करें   | `openclaw skills install @owner/<slug>`                |
| Git repository से install करें     | `openclaw skills install git:owner/repo@ref`           |
| Local skill directory install करें | `openclaw skills install ./path/to/skill --as my-tool` |
| सभी local agents के लिए install करें | `openclaw skills install @owner/<slug> --global`       |
| सभी workspace skills update करें  | `openclaw skills update --all`                         |
| shared managed skill update करें   | `openclaw skills update @owner/<slug> --global`        |
| सभी shared managed skills update करें | `openclaw skills update --all --global`                |
| skill का trust envelope verify करें | `openclaw skills verify @owner/<slug>`                 |
| generated Skill Card print करें    | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI के ज़रिए publish / sync | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` default रूप से active workspace `skills/`
    directory में install करता है। shared `~/.openclaw/skills` directory में
    install करने के लिए `--global` जोड़ें, जो सभी local agents को दिखती है
    जब तक agent allowlists इसे narrow न करें।

    Git और local installs source root पर `SKILL.md` expect करते हैं। valid होने पर slug `SKILL.md` frontmatter `name` से आता है, फिर directory या repository name पर fallback करता है। override करने के लिए `--as <slug>` का उपयोग करें।
    `openclaw skills update` केवल ClawHub installs track करता है — Git या local sources को refresh करने के लिए reinstall करें।

  </Accordion>
  <Accordion title="Verification और security scanning">
    `openclaw skills verify @owner/<slug>` ClawHub से skill का
    `clawhub.skill.verify.v1` trust envelope मांगता है। Installed ClawHub skills `.clawhub/origin.json` में recorded version और registry के against verify होती हैं।
    Bare slugs existing installed या unambiguous skills के लिए accepted रहते हैं, लेकिन owner-qualified refs publisher ambiguity से बचाते हैं।

    ClawHub skill pages install से पहले latest security scan state expose करते हैं,
    VirusTotal, ClawScan, और static analysis के detail pages के साथ। जब ClawHub verification को failed mark करता है, तो command non-zero exit करती है। Publishers false positives को ClawHub dashboard या `clawhub skill rescan @owner/<slug>` के ज़रिए recover करते हैं।

  </Accordion>
  <Accordion title="Private archive installs">
    जिन Gateway clients को non-ClawHub delivery की जरूरत है वे `skills.upload.begin`, `skills.upload.chunk`, और `skills.upload.commit` के साथ zip skill archive stage कर सकते हैं,
    फिर `skills.install({ source: "upload", ... })` से install कर सकते हैं। यह path default रूप से off है और `openclaw.json` में `skills.install.allowUploadedArchives: true` की आवश्यकता होती है। Normal ClawHub installs को इस setting की कभी जरूरत नहीं होती।
  </Accordion>
</AccordionGroup>

## Security

<Warning>
  Third-party skills को **untrusted code** मानें। Enable करने से पहले उन्हें पढ़ें।
  Untrusted inputs और risky tools के लिए sandboxed runs prefer करें। Agent-side controls के लिए [Sandboxing](/hi/gateway/sandboxing) देखें।
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Workspace, project-agent, और extra-dir skill discovery केवल ऐसे skill roots accept करती है जिनका resolved realpath configured root के अंदर रहता है, जब तक `skills.load.allowSymlinkTargets` किसी target root पर explicitly trust न करे।
    Skill Workshop उन trusted targets के ज़रिए केवल तब लिखता है जब `skills.workshop.allowSymlinkTargetWrites` enabled हो।
    Managed `~/.openclaw/skills` और personal `~/.agents/skills` में symlinked skill folders हो सकते हैं, लेकिन हर `SKILL.md` realpath को फिर भी अपनी resolved skill directory के अंदर रहना होगा।
  </Accordion>
  <Accordion title="Operator install policy">
    Skill installs continue होने से पहले trusted local policy command run करने के लिए `security.installPolicy` configure करें। Policy metadata और staged source path receive करती है, ClawHub, uploaded, Git, local, update, और dependency-installer paths पर apply होती है, और जब command valid decision return नहीं कर सकती तो fail closed होती है।
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` और `skills.entries.*.apiKey` secrets को केवल उस agent turn के लिए **host** process में inject करते हैं — sandbox में नहीं। Secrets को prompts और logs से बाहर रखें।
  </Accordion>
</AccordionGroup>

Broader threat model और security checklists के लिए [Security](/hi/gateway/security) देखें।

## SKILL.md format

हर skill को frontmatter में कम से कम `name` और `description` चाहिए:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw [AgentSkills](https://agentskills.io) spec का पालन करता है। Frontmatter parser **केवल single-line keys** support करता है — `metadata` single-line JSON object होना चाहिए। Skill folder path reference करने के लिए body में `{baseDir}` का उपयोग करें।
</Note>

### Optional frontmatter keys

<ParamField path="homepage" type="string">
  macOS Skills UI में "Website" के रूप में दिखाया गया URL। `metadata.openclaw.homepage` के ज़रिए भी supported।
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  जब `true` हो, skill user-invocable slash command के रूप में expose होती है।
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  जब `true` हो, OpenClaw skill के instructions को agent के normal prompt से बाहर रखता है। `user-invocable` भी `true` होने पर skill फिर भी slash command के रूप में available रहती है।
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` पर set होने पर, slash command model को bypass करता है और सीधे registered tool को dispatch करता है।
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` set होने पर invoke करने के लिए tool name।
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Tool dispatch के लिए, raw args string को बिना core parsing के tool को forward करता है। Tool को
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` receive होता है।
</ParamField>

## Gating

OpenClaw कौशलों को लोड समय पर `metadata.openclaw` (frontmatter में एक-पंक्ति
JSON) का उपयोग करके फ़िल्टर करता है। जिस कौशल में `metadata.openclaw` ब्लॉक नहीं है, वह हमेशा
पात्र होता है, जब तक कि उसे स्पष्ट रूप से अक्षम न किया गया हो।

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
  जब `true` हो, तो कौशल को हमेशा शामिल करें और बाकी सभी गेट छोड़ दें।
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI में दिखाया जाने वाला वैकल्पिक इमोजी।
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI में "Website" के रूप में दिखाया जाने वाला वैकल्पिक URL।
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  प्लेटफ़ॉर्म फ़िल्टर। सेट होने पर, कौशल केवल सूचीबद्ध OSes पर पात्र होता है।
</ParamField>

<ParamField path="requires.bins" type="string[]">
  प्रत्येक बाइनरी `PATH` पर मौजूद होनी चाहिए।
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  कम से कम एक बाइनरी `PATH` पर मौजूद होनी चाहिए।
</ParamField>

<ParamField path="requires.env" type="string[]">
  प्रत्येक env var प्रक्रिया में मौजूद होना चाहिए या config के माध्यम से प्रदान किया जाना चाहिए।
</ParamField>

<ParamField path="requires.config" type="string[]">
  प्रत्येक `openclaw.json` पथ truthy होना चाहिए।
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` से संबद्ध env var नाम।
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI द्वारा उपयोग किए जाने वाले वैकल्पिक इंस्टॉलर specs (brew / node / go / uv / download)।
</ParamField>

<Note>
  जब `metadata.openclaw` अनुपस्थित हो, तब भी पुराने `metadata.clawdbot` ब्लॉक स्वीकार किए जाते हैं,
  इसलिए पुराने स्थापित कौशल अपने dependency gates और installer hints बनाए रखते हैं। नए कौशलों को
  `metadata.openclaw` का उपयोग करना चाहिए।
</Note>

### इंस्टॉलर specs

इंस्टॉलर specs macOS Skills UI को बताते हैं कि dependency कैसे इंस्टॉल करनी है:

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
  <Accordion title="इंस्टॉलर चयन नियम">
    - जब कई इंस्टॉलर सूचीबद्ध हों, तो gateway एक पसंदीदा विकल्प चुनता है
      (उपलब्ध होने पर brew, अन्यथा node)।
    - यदि सभी इंस्टॉलर `download` हैं, तो OpenClaw हर entry को सूचीबद्ध करता है ताकि आप
      सभी उपलब्ध artifacts देख सकें।
    - प्लेटफ़ॉर्म के अनुसार फ़िल्टर करने के लिए specs में `os: ["darwin"|"linux"|"win32"]` शामिल हो सकता है।
    - Node इंस्टॉल `openclaw.json` में `skills.install.nodeManager` का सम्मान करते हैं
      (default: npm; options: npm / pnpm / yarn / bun)। यह केवल skill
      installs को प्रभावित करता है; Gateway runtime फिर भी Node होना चाहिए।
    - Gateway इंस्टॉलर प्राथमिकता: Homebrew → uv → configured node manager →
      go → download।
  </Accordion>
  <Accordion title="प्रति-इंस्टॉलर विवरण">
    - **Homebrew:** OpenClaw Homebrew को auto-install नहीं करता या brew
      formulas को system package commands में translate नहीं करता। Linux containers में
      `brew` के बिना, brew-only installers छिपे रहते हैं; custom image का उपयोग करें या
      dependency को manually install करें।
    - **Go:** यदि `go` अनुपस्थित है और `brew` उपलब्ध है, तो gateway पहले Homebrew के माध्यम से
      Go install करता है और `GOBIN` को Homebrew के `bin` पर सेट करता है।
    - **Download:** `url` (required), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (default: archive detect होने पर auto), `stripComponents`,
      `targetDir` (default: `~/.openclaw/tools/<skillKey>`)।
  </Accordion>
  <Accordion title="Sandboxing नोट्स">
    `requires.bins` को skill load time पर **host** पर जांचा जाता है। यदि कोई agent
    sandbox में चलता है, तो binary **container के अंदर** भी मौजूद होनी चाहिए।
    इसे `agents.defaults.sandbox.docker.setupCommand` या custom
    image के माध्यम से install करें। `setupCommand` container creation के बाद एक बार चलता है और उसे
    network egress, writable root FS, और sandbox में root user की आवश्यकता होती है।
  </Accordion>
</AccordionGroup>

## Config overrides

bundled या managed कौशलों को `~/.openclaw/openclaw.json` में `skills.entries` के तहत
toggle और configure करें:

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
  `false` कौशल को bundled या installed होने पर भी अक्षम कर देता है। `coding-agent`
  bundled skill opt-in है — `skills.entries.coding-agent.enabled: true` सेट करें
  और सुनिश्चित करें कि `claude`, `codex`, `opencode`, या कोई अन्य supported CLI
  installed और authenticated हो।
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  उन कौशलों के लिए सुविधा field जो `metadata.openclaw.primaryEnv` declare करते हैं।
  plaintext string या SecretRef object का समर्थन करता है।
</ParamField>

<ParamField path="env" type="Record<string, string>">
  agent run के लिए injected environment variables। केवल तब inject किए जाते हैं जब
  variable process में पहले से set न हो।
</ParamField>

<ParamField path="config" type="object">
  custom per-skill configuration fields के लिए वैकल्पिक bag।
</ParamField>

<ParamField path="allowBundled" type="string[]">
  केवल **bundled** कौशलों के लिए वैकल्पिक allowlist। सेट होने पर, सूची में मौजूद bundled skills
  ही पात्र होते हैं। Managed और workspace skills अप्रभावित रहते हैं।
</ParamField>

<Note>
  Config keys default रूप से **skill name** से match करते हैं। यदि कोई skill
  `metadata.openclaw.skillKey` define करता है, तो `skills.entries` के तहत उसी key का उपयोग करें। Hyphenated
  names को quote करें: JSON5 quoted keys की अनुमति देता है।
</Note>

## Environment injection

जब agent run शुरू होता है, OpenClaw:

<Steps>
  <Step title="Skill metadata पढ़ता है">
    OpenClaw agent के लिए effective skill list resolve करता है, gating
    rules, allowlists, और config overrides apply करते हुए।
  </Step>
  <Step title="env और API keys inject करता है">
    `skills.entries.<key>.env` और `skills.entries.<key>.apiKey` को run की अवधि के लिए
    `process.env` पर apply किया जाता है।
  </Step>
  <Step title="system prompt बनाता है">
    पात्र skills को compact XML block में compile किया जाता है और
    system prompt में inject किया जाता है।
  </Step>
  <Step title="environment restore करता है">
    run समाप्त होने के बाद, original environment restore कर दिया जाता है।
  </Step>
</Steps>

<Warning>
  Env injection **host** agent run तक scoped है, sandbox तक नहीं। Sandbox के अंदर,
  `env` और `apiKey` का कोई प्रभाव नहीं होता। sandboxed runs में secrets pass करने का तरीका जानने के लिए
  [Skills config](/hi/tools/skills-config#sandboxed-skills-and-env-vars) देखें।
</Warning>

bundled `claude-cli` backend के लिए, OpenClaw वही पात्र
skill snapshot temporary Claude Code plugin के रूप में materialize भी करता है और उसे
`--plugin-dir` के माध्यम से pass करता है। अन्य CLI backends केवल prompt catalog का उपयोग करते हैं।

## Snapshots और refresh

OpenClaw पात्र skills को **session शुरू होने पर** snapshot करता है और session में
बाद के सभी turns के लिए उसी list का पुन: उपयोग करता है। Skills या config में बदलाव
अगले नए session पर प्रभावी होते हैं।

Skills mid-session दो मामलों में refresh होते हैं:

- skills watcher किसी `SKILL.md` बदलाव का पता लगाता है।
- नया पात्र remote node connect होता है।

refreshed list अगले agent turn पर उपयोग की जाती है। यदि effective agent
allowlist बदलती है, तो OpenClaw visible skills को aligned रखने के लिए snapshot refresh करता है।

<AccordionGroup>
  <Accordion title="Skills watcher">
    By default, OpenClaw skill folders देखता है और `SKILL.md` files बदलने पर
    snapshot bump करता है। `skills.load` के तहत configure करें:

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

    intentional symlinked layouts के लिए `allowSymlinkTargets` का उपयोग करें, जहां skill
    root symlink configured root के बाहर point करता है, उदाहरण के लिए
    `<workspace>/skills/manager -> ~/Projects/manager/skills`।
    `skills.workshop.allowSymlinkTargetWrites` केवल तब enable करें जब Skill Workshop
    को उन trusted symlinked paths के माध्यम से proposals भी apply करने चाहिए।

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    यदि Gateway Linux पर चलता है लेकिन कोई **macOS node** `system.run` allowed के साथ connected है,
    तो OpenClaw macOS-only skills को पात्र मान सकता है जब
    required binaries उस node पर मौजूद हों। Agent को उन
    skills को `exec` tool के माध्यम से `host=node` के साथ चलाना चाहिए।

    Offline nodes remote-only skills को visible **नहीं** बनाते। यदि कोई node
    bin probes का उत्तर देना बंद कर देता है, तो OpenClaw उसके cached bin matches clear कर देता है।

  </Accordion>
</AccordionGroup>

## Token impact

जब skills पात्र होते हैं, OpenClaw system prompt में compact XML block
inject करता है। लागत deterministic है:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Base overhead** (केवल जब ≥ 1 skill): ~195 characters
- **Per skill:** ~97 characters + आपके `name`, `description`, और `location` field lengths
- XML escaping `& < > " '` को entities में expand करता है, जिससे हर occurrence पर कुछ characters जुड़ते हैं
- ~4 chars/token पर, 97 chars ≈ field lengths से पहले प्रति skill 24 tokens

prompt overhead कम रखने के लिए descriptions को छोटा और descriptive रखें।

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills बनाना" href="/hi/tools/creating-skills" icon="hammer">
    custom skill author करने के लिए step-by-step guide।
  </Card>
  <Card title="Skill Workshop" href="/hi/tools/skill-workshop" icon="flask">
    agent-drafted skills के लिए proposal queue।
  </Card>
  <Card title="Skills config" href="/hi/tools/skills-config" icon="gear">
    पूरा `skills.*` config schema और agent allowlists।
  </Card>
  <Card title="Slash commands" href="/hi/tools/slash-commands" icon="terminal">
    skill slash commands कैसे register और route किए जाते हैं।
  </Card>
  <Card title="ClawHub" href="/hi/clawhub" icon="cloud">
    public registry पर skills browse और publish करें।
  </Card>
  <Card title="Plugins" href="/hi/tools/plugin" icon="plug">
    Plugins अपने द्वारा document किए जाने वाले tools के साथ skills ship कर सकते हैं।
  </Card>
</CardGroup>
