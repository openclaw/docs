---
read_when:
    - Skills जोड़ना या संशोधित करना
    - Skills गेटिंग, अनुमति-सूचियों, या लोड नियमों में बदलाव
    - कौशल प्राथमिकता और स्नैपशॉट व्यवहार को समझना
sidebarTitle: Skills
summary: Skills आपके एजेंट को उपकरणों का उपयोग करना सिखाते हैं। जानें कि वे कैसे लोड होते हैं, प्राथमिकता क्रम कैसे काम करता है, और गेटिंग, अनुमति-सूचियां, और परिवेश इंजेक्शन को कैसे कॉन्फ़िगर करें।
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:07:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills markdown निर्देश फ़ाइलें हैं जो agent को सिखाती हैं कि tools का उपयोग कैसे और कब करना है। प्रत्येक skill एक directory में रहती है जिसमें YAML frontmatter और markdown body वाली `SKILL.md` फ़ाइल होती है। OpenClaw bundled skills और किसी भी local override को load करता है, और environment, config, और binary की मौजूदगी के आधार पर load time पर उन्हें filter करता है।

<CardGroup cols={2}>
  <Card title="Creating skills" href="/hi/tools/creating-skills" icon="hammer">
    scratch से custom skill build और test करें।
  </Card>
  <Card title="Skill Workshop" href="/hi/tools/skill-workshop" icon="flask">
    agent द्वारा draft किए गए skill proposals की review और approval करें।
  </Card>
  <Card title="Skills config" href="/hi/tools/skills-config" icon="gear">
    पूरा `skills.*` config schema और agent allowlists।
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    community skills browse और install करें।
  </Card>
</CardGroup>

## Loading order

OpenClaw इन sources से load करता है, **सबसे अधिक precedence पहले**। जब एक ही skill name कई जगहों पर दिखाई देता है, तो सबसे उच्च source जीतता है।

| Priority    | Source                 | Path                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — highest | Workspace skills       | `<workspace>/skills`                    |
| 2           | Project agent skills   | `<workspace>/.agents/skills`            |
| 3           | Personal agent skills  | `~/.agents/skills`                      |
| 4           | Managed / local skills | `~/.openclaw/skills`                    |
| 5           | Bundled skills         | install के साथ shipped                 |
| 6 — lowest  | Extra directories      | `skills.load.extraDirs` + plugin skills |

Skill roots grouped layouts support करते हैं। OpenClaw configured root के अंतर्गत कहीं भी `SKILL.md` दिखाई देने पर skill discover करता है:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Folder path केवल organization के लिए है। skill का name, slash command, और allowlist key सभी `name` frontmatter field से आते हैं (या `name` missing होने पर directory name से)।

<Note>
  Codex CLI की native `$CODEX_HOME/skills` directory OpenClaw skill root **नहीं** है। उन skills की inventory बनाने के लिए `openclaw migrate plan codex` का उपयोग करें, फिर उन्हें अपने OpenClaw workspace में copy करने के लिए `openclaw migrate codex` चलाएँ।
</Note>

## Per-agent बनाम shared skills

Multi-agent setups में, प्रत्येक agent का अपना workspace होता है। अपनी desired visibility से match करने वाला path उपयोग करें:

| Scope          | Path                         | Visible to                  |
| -------------- | ---------------------------- | --------------------------- |
| Per-agent      | `<workspace>/skills`         | केवल वह agent              |
| Project-agent  | `<workspace>/.agents/skills` | केवल उस workspace का agent |
| Personal-agent | `~/.agents/skills`           | इस machine पर सभी agents   |
| Shared managed | `~/.openclaw/skills`         | इस machine पर सभी agents   |
| Extra dirs     | `skills.load.extraDirs`      | इस machine पर सभी agents   |

## Agent allowlists

Skill **location** (precedence) और skill **visibility** (कौन सा agent उसे use कर सकता है) अलग controls हैं। कोई skill कहाँ से load हुई है, इससे independent होकर किसी agent को कौन-सी skills दिखती हैं, इसे restrict करने के लिए allowlists उपयोग करें।

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
    - उस agent के लिए कोई skill expose न करने के लिए `agents.list[].skills: []` set करें।
    - non-empty `agents.list[].skills` list **final** set है — यह defaults के साथ merge नहीं होती।
    - effective allowlist prompt building, slash-command discovery, sandbox sync, और skill snapshots पर apply होती है।
    - यह host shell authorization boundary नहीं है। अगर वही agent `exec` use कर सकता है, तो उस shell को अलग से sandboxing, OS-user isolation, exec deny/allowlists, और per-resource credentials से constrain करें।

  </Accordion>
</AccordionGroup>

## Plugins और skills

Plugins `openclaw.plugin.json` में `skills` directories list करके अपनी skills ship कर सकते हैं (paths plugin root के relative होते हैं)। Plugin enabled होने पर Plugin skills load होती हैं — उदाहरण के लिए, browser plugin multi-step browser control के लिए `browser-automation` skill ship करता है।

Plugin skill directories `skills.load.extraDirs` की तरह same low-precedence level पर merge होती हैं, इसलिए same-named bundled, managed, agent, या workspace skill उन्हें override करती है। Plugin के config entry पर `metadata.openclaw.requires.config` के जरिए उन्हें gate करें।

पूरे plugin system के लिए [Plugins](/hi/tools/plugin) और [Tools](/hi/tools) देखें।

## Skill Workshop

[Skill Workshop](/hi/tools/skill-workshop) agent और आपकी active skill files के बीच proposal queue है। जब agent reusable work देखता है, तो वह सीधे `SKILL.md` में लिखने के बजाय proposal draft करता है। किसी भी change से पहले आप review और approve करते हैं।

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

पूरे lifecycle, CLI reference, और configuration के लिए [Skill Workshop](/hi/tools/skill-workshop) देखें।

## ClawHub से install करना

[ClawHub](https://clawhub.ai) public skills registry है। install और update के लिए `openclaw skills` commands का उपयोग करें, या publish और sync के लिए `clawhub` CLI का उपयोग करें।

| Action                             | Command                                                |
| ---------------------------------- | ------------------------------------------------------ |
| workspace में skill install करें   | `openclaw skills install @owner/<slug>`                |
| Git repository से install करें     | `openclaw skills install git:owner/repo@ref`           |
| local skill directory install करें | `openclaw skills install ./path/to/skill --as my-tool` |
| सभी local agents के लिए install करें | `openclaw skills install @owner/<slug> --global`       |
| सभी workspace skills update करें   | `openclaw skills update --all`                         |
| shared managed skill update करें   | `openclaw skills update @owner/<slug> --global`        |
| सभी shared managed skills update करें | `openclaw skills update --all --global`                |
| skill का trust envelope verify करें | `openclaw skills verify @owner/<slug>`                 |
| generated Skill Card print करें    | `openclaw skills verify @owner/<slug> --card`          |
| ClawHub CLI के जरिए publish / sync | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    `openclaw skills install` default रूप से active workspace `skills/`
    directory में install करता है। shared `~/.openclaw/skills` directory में install करने के लिए `--global` जोड़ें, जो सभी local agents को visible होती है जब तक agent allowlists इसे narrow न करें।

    Git और local installs source root पर `SKILL.md` expect करते हैं। slug valid होने पर `SKILL.md` frontmatter `name` से आता है, फिर directory या repository name पर fallback करता है। Override करने के लिए `--as <slug>` उपयोग करें।
    `openclaw skills update` केवल ClawHub installs track करता है — Git या local sources refresh करने के लिए उन्हें reinstall करें।

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` ClawHub से skill का `clawhub.skill.verify.v1` trust envelope मांगता है। Installed ClawHub skills `.clawhub/origin.json` में recorded version और registry के against verify होती हैं।
    Bare slugs existing installed या unambiguous skills के लिए accepted रहते हैं, लेकिन owner-qualified refs publisher ambiguity से बचाते हैं।

    ClawHub skill pages install से पहले latest security scan state expose करते हैं, जिसमें VirusTotal, ClawScan, और static analysis के detail pages होते हैं। जब ClawHub verification को failed mark करता है, command non-zero exit करती है। Publishers ClawHub dashboard या `clawhub skill rescan @owner/<slug>` के जरिए false positives recover करते हैं।

  </Accordion>
  <Accordion title="Private archive installs">
    जिन Gateway clients को non-ClawHub delivery चाहिए, वे `skills.upload.begin`, `skills.upload.chunk`, और `skills.upload.commit` के साथ zip skill archive stage कर सकते हैं, फिर `skills.install({ source: "upload", ... })` के साथ install कर सकते हैं। यह path default रूप से off है और `openclaw.json` में `skills.install.allowUploadedArchives: true` की आवश्यकता होती है। Normal ClawHub installs को कभी उस setting की जरूरत नहीं होती।
  </Accordion>
</AccordionGroup>

## Security

<Warning>
  Third-party skills को **untrusted code** मानें। Enable करने से पहले उन्हें पढ़ें।
  Untrusted inputs और risky tools के लिए sandboxed runs prefer करें। agent-side controls के लिए [Sandboxing](/hi/gateway/sandboxing) देखें।
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Workspace, project-agent, और extra-dir skill discovery केवल उन skill roots को accept करती है जिनका resolved realpath configured root के अंदर रहता है, जब तक `skills.load.allowSymlinkTargets` किसी target root को explicitly trust न करे।
    Skill Workshop केवल उन trusted targets के through लिखता है जब `skills.workshop.allowSymlinkTargetWrites` enabled हो।
    Managed `~/.openclaw/skills` और personal `~/.agents/skills` में symlinked skill folders हो सकते हैं, लेकिन हर `SKILL.md` realpath फिर भी अपनी resolved skill directory के अंदर ही रहना चाहिए।
  </Accordion>
  <Accordion title="Operator install policy">
    Skill installs continue होने से पहले trusted local policy command run करने के लिए `security.installPolicy` configure करें। Policy metadata और staged source path receive करती है, ClawHub, uploaded, Git, local, update, और dependency-installer paths पर apply होती है, और command valid decision return न कर पाए तो fail closed होती है।
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` और `skills.entries.*.apiKey` secrets को उस agent turn के लिए केवल **host** process में inject करते हैं — sandbox में नहीं। Secrets को prompts और logs से बाहर रखें।
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
  OpenClaw [AgentSkills](https://agentskills.io) spec follow करता है। frontmatter parser **single-line keys only** support करता है — `metadata` single-line JSON object होना चाहिए। Skill folder path reference करने के लिए body में `{baseDir}` उपयोग करें।
</Note>

### Optional frontmatter keys

<ParamField path="homepage" type="string">
  macOS Skills UI में "Website" के रूप में दिखाया गया URL। `metadata.openclaw.homepage` के जरिए भी supported।
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  जब `true` हो, skill user-invocable slash command के रूप में expose होती है।
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  जब `true` हो, OpenClaw skill के instructions को agent के normal prompt से बाहर रखता है। `user-invocable` भी `true` होने पर skill अभी भी slash command के रूप में available रहती है।
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  `tool` पर set होने पर, slash command model को bypass करता है और सीधे registered tool को dispatch करता है।
</ParamField>

<ParamField path="command-tool" type="string">
  `command-dispatch: tool` set होने पर invoke करने के लिए tool name।
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  टूल डिस्पैच के लिए, बिना किसी core parsing के raw args string को टूल को
  आगे भेजता है। टूल को
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` प्राप्त होता है।
</ParamField>

## गेटिंग

OpenClaw लोड समय पर `metadata.openclaw` (frontmatter में single-line
JSON) का उपयोग करके skills को फ़िल्टर करता है। जिस skill में `metadata.openclaw`
ब्लॉक नहीं होता, वह हमेशा योग्य होती है, जब तक उसे स्पष्ट रूप से disabled न किया गया हो।

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
  जब `true` हो, तो skill को हमेशा शामिल करें और बाकी सभी gates छोड़ दें।
</ParamField>

<ParamField path="emoji" type="string">
  macOS Skills UI में दिखाया जाने वाला वैकल्पिक emoji।
</ParamField>

<ParamField path="homepage" type="string">
  macOS Skills UI में "वेबसाइट" के रूप में दिखाया जाने वाला वैकल्पिक URL।
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Platform filter। सेट होने पर, skill केवल सूचीबद्ध OSes पर योग्य होती है।
</ParamField>

<ParamField path="requires.bins" type="string[]">
  प्रत्येक binary `PATH` पर मौजूद होनी चाहिए।
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  कम से कम एक binary `PATH` पर मौजूद होनी चाहिए।
</ParamField>

<ParamField path="requires.env" type="string[]">
  प्रत्येक env var process में मौजूद होनी चाहिए या config के माध्यम से दी जानी चाहिए।
</ParamField>

<ParamField path="requires.config" type="string[]">
  प्रत्येक `openclaw.json` path truthy होना चाहिए।
</ParamField>

<ParamField path="primaryEnv" type="string">
  `skills.entries.<name>.apiKey` से जुड़ा env var नाम।
</ParamField>

<ParamField path="install" type="object[]">
  macOS Skills UI द्वारा उपयोग किए जाने वाले वैकल्पिक installer specs (brew / node / go / uv / download)।
</ParamField>

<Note>
  Legacy `metadata.clawdbot` blocks अभी भी स्वीकार किए जाते हैं जब
  `metadata.openclaw` अनुपस्थित हो, ताकि पुरानी installed skills अपने
  dependency gates और installer hints बनाए रखें। नई skills को
  `metadata.openclaw` का उपयोग करना चाहिए।
</Note>

### Installer specs

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
    - जब कई installers सूचीबद्ध हों, तो gateway एक preferred
      option चुनता है (उपलब्ध होने पर brew, अन्यथा node)।
    - यदि सभी installers `download` हैं, तो OpenClaw प्रत्येक entry सूचीबद्ध करता है ताकि आप
      सभी उपलब्ध artifacts देख सकें।
    - Specs में platform के अनुसार filter करने के लिए `os: ["darwin"|"linux"|"win32"]` शामिल हो सकता है।
    - Node installs `openclaw.json` में `skills.install.nodeManager` का सम्मान करते हैं
      (default: npm; options: npm / pnpm / yarn / bun)। यह केवल skill
      installs को प्रभावित करता है; Gateway runtime फिर भी Node होना चाहिए।
    - Gateway installer preference: Homebrew → uv → configured node manager →
      go → download।
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw Homebrew को auto-install नहीं करता या brew
      formulas को system package commands में translate नहीं करता। `brew` के बिना Linux containers में,
      brew-only installers छिपे रहते हैं; custom image का उपयोग करें या
      dependency को manually install करें।
    - **Go:** यदि `go` अनुपस्थित है और `brew` उपलब्ध है, तो gateway पहले
      Homebrew के माध्यम से Go install करता है और `GOBIN` को Homebrew के `bin` पर सेट करता है।
    - **Download:** `url` (required), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (default: archive detected होने पर auto), `stripComponents`,
      `targetDir` (default: `~/.openclaw/tools/<skillKey>`)।
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` skill load time पर **host** पर check किया जाता है। यदि agent
    sandbox में चलता है, तो binary **container के अंदर** भी मौजूद होनी चाहिए।
    इसे `agents.defaults.sandbox.docker.setupCommand` या custom
    image के माध्यम से install करें। `setupCommand` container creation के बाद एक बार चलता है और इसके लिए
    network egress, writable root FS, और sandbox में root user आवश्यक है।
  </Accordion>
</AccordionGroup>

## Config overrides

`~/.openclaw/openclaw.json` में `skills.entries` के अंतर्गत bundled या managed skills को
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
  `false` skill को disabled कर देता है, भले ही वह bundled या installed हो। `coding-agent`
  bundled skill opt-in है — `skills.entries.coding-agent.enabled: true` सेट करें
  और सुनिश्चित करें कि `claude`, `codex`, `opencode`, या कोई अन्य supported CLI
  installed और authenticated है।
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  उन skills के लिए convenience field जो `metadata.openclaw.primaryEnv` declare करती हैं।
  Plaintext string या SecretRef object का समर्थन करता है।
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Agent run के लिए injected environment variables। केवल तब injected होते हैं जब
  variable पहले से process में set न हो।
</ParamField>

<ParamField path="config" type="object">
  Custom per-skill configuration fields के लिए वैकल्पिक bag।
</ParamField>

<ParamField path="allowBundled" type="string[]">
  केवल **bundled** skills के लिए वैकल्पिक allowlist। सेट होने पर, केवल सूची में मौजूद bundled skills
  योग्य होती हैं। Managed और workspace skills अप्रभावित रहती हैं।
</ParamField>

<Note>
  Config keys default रूप से **skill name** से match करती हैं। यदि कोई skill
  `metadata.openclaw.skillKey` define करती है, तो `skills.entries` के अंतर्गत उस key का उपयोग करें। Hyphenated
  names को quote करें: JSON5 quoted keys की अनुमति देता है।
</Note>

## Environment injection

जब agent run शुरू होता है, OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw agent के लिए effective skill list resolve करता है, gating
    rules, allowlists, और config overrides लागू करते हुए।
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` और `skills.entries.<key>.apiKey` run की अवधि के लिए
    `process.env` पर लागू किए जाते हैं।
  </Step>
  <Step title="Builds the system prompt">
    योग्य skills को compact XML block में compile किया जाता है और
    system prompt में inject किया जाता है।
  </Step>
  <Step title="Restores the environment">
    Run समाप्त होने के बाद, original environment restore किया जाता है।
  </Step>
</Steps>

<Warning>
  Env injection **host** agent run तक scoped है, sandbox तक नहीं। Sandbox के अंदर
  `env` और `apiKey` का कोई प्रभाव नहीं होता। Sandboxed runs में secrets pass करने के तरीके के लिए
  [Skills config](/hi/tools/skills-config#sandboxed-skills-and-env-vars) देखें।
</Warning>

Bundled `claude-cli` backend के लिए, OpenClaw उसी
eligible skill snapshot को temporary Claude Code plugin के रूप में materialize भी करता है और उसे
`--plugin-dir` के माध्यम से pass करता है। अन्य CLI backends केवल prompt catalog का उपयोग करते हैं।

## Snapshots और refresh

OpenClaw eligible skills का snapshot **session शुरू होने पर** लेता है और session में बाद के
सभी turns के लिए उस list का पुन: उपयोग करता है। Skills या config में बदलाव
अगले नए session पर प्रभावी होते हैं।

Skills दो मामलों में mid-session refresh होती हैं:

- Skills watcher `SKILL.md` change detect करता है।
- एक नया eligible remote node connect होता है।

Refreshed list अगले agent turn पर picked up होती है। यदि effective agent
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

    Intentional symlinked layouts के लिए `allowSymlinkTargets` का उपयोग करें जहाँ skill
    root symlink configured root के बाहर point करता है, उदाहरण के लिए
    `<workspace>/skills/manager -> ~/Projects/manager/skills`।
    `skills.workshop.allowSymlinkTargetWrites` केवल तब enable करें जब Skill Workshop
    उन trusted symlinked paths के माध्यम से proposals भी apply करे।

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    यदि Gateway Linux पर चलता है लेकिन **macOS node** `system.run`
    allowed के साथ connected है, तो OpenClaw macOS-only skills को eligible मान सकता है जब
    required binaries उस node पर मौजूद हों। Agent को उन
    skills को `exec` tool के माध्यम से `host=node` के साथ चलाना चाहिए।

    Offline nodes remote-only skills को visible **नहीं** बनाते। यदि कोई node
    bin probes का जवाब देना बंद कर देता है, तो OpenClaw उसके cached bin matches clear कर देता है।

  </Accordion>
</AccordionGroup>

## Token impact

जब skills eligible होती हैं, OpenClaw system
prompt में compact XML block inject करता है। Cost deterministic है:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Base overhead** (केवल जब ≥ 1 skill): ~195 characters
- **Per skill:** ~97 characters + आपके `name`, `description`, और `location` field lengths
- XML escaping `& < > " '` को entities में expand करता है, जिससे प्रति occurrence कुछ characters जुड़ते हैं
- ~4 chars/token पर, field lengths से पहले 97 chars ≈ 24 tokens per skill

Prompt overhead को कम करने के लिए descriptions को short और descriptive रखें।

## Related

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
    Plugins उन tools के साथ skills ship कर सकते हैं जिन्हें वे document करते हैं।
  </Card>
</CardGroup>
