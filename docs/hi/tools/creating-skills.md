---
read_when:
    - आप एक नया कस्टम skill बना रहे हैं
    - आपको SKILL.md-आधारित Skills के लिए एक त्वरित प्रारंभिक वर्कफ़्लो चाहिए
    - आप एजेंट समीक्षा के लिए कोई skill प्रस्तावित करने हेतु Skill Workshop का उपयोग करना चाहते हैं
sidebarTitle: Creating skills
summary: अपने OpenClaw एजेंटों के लिए कस्टम SKILL.md workspace skills बनाएं, टेस्ट करें, और प्रकाशित करें।
title: Skills बनाना
x-i18n:
    generated_at: "2026-06-29T00:17:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills एजेंट को सिखाते हैं कि टूल्स का उपयोग कैसे और कब करना है। हर skill एक डायरेक्टरी होती है
जिसमें YAML frontmatter और markdown निर्देशों वाली `SKILL.md` फ़ाइल होती है।
OpenClaw कई roots से skills को एक निर्धारित [precedence order](/hi/tools/skills#loading-order) में लोड करता है।

## अपनी पहली skill बनाएँ

<Steps>
  <Step title="Create the skill directory">
    Skills आपके workspace के `skills/` फ़ोल्डर में रहती हैं। अपनी
    नई skill के लिए एक डायरेक्टरी बनाएँ:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    संगठन के लिए आप skills को subfolders में समूहित कर सकते हैं — फिर भी skill का नाम
    `SKILL.md` frontmatter से तय होता है, फ़ोल्डर path से नहीं:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    डायरेक्टरी के अंदर `SKILL.md` बनाएँ। frontmatter metadata परिभाषित करता है;
    body एजेंट को निर्देश देता है।

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    नामकरण नियम:
    - `name` के लिए lowercase अक्षर, अंक और hyphens का उपयोग करें।
    - डायरेक्टरी नाम और frontmatter `name` को समान रखें।
    - `description` एजेंट को और slash-command discovery में दिखाया जाता है —
      इसे एक पंक्ति में और 160 वर्णों से कम रखें।

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw डिफ़ॉल्ट रूप से skills roots के अंतर्गत `SKILL.md` फ़ाइलों को देखता है। यदि
    watcher अक्षम है या आप किसी मौजूदा session को जारी रख रहे हैं, तो एक नया
    session शुरू करें ताकि एजेंट को refreshed सूची मिल सके:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    ऐसा संदेश भेजें जिससे skill trigger होनी चाहिए:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    या chat खोलें और एजेंट से सीधे पूछें। नाम से स्पष्ट रूप से invoke करने के लिए
    `/skill hello-world` का उपयोग करें।

  </Step>
</Steps>

## SKILL.md संदर्भ

### आवश्यक fields

| Field         | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `name`        | lowercase अक्षरों, अंकों और hyphens वाला unique slug        |
| `description` | एजेंट और discovery output में दिखाया जाने वाला एक-पंक्ति विवरण |

### वैकल्पिक frontmatter keys

| Field                      | Default | Description                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | skill को user slash command के रूप में expose करें                                         |
| `disable-model-invocation` | `false` | skill को एजेंट के system prompt से बाहर रखें (`/skill` के ज़रिए फिर भी चलता है)        |
| `command-dispatch`         | —       | model को bypass करते हुए slash command को सीधे tool पर route करने के लिए `tool` पर set करें |
| `command-tool`             | —       | `command-dispatch: tool` set होने पर invoke किया जाने वाला tool नाम                         |
| `command-arg-mode`         | `raw`   | tool dispatch के लिए raw args string को tool तक forward करता है                      |
| `homepage`                 | —       | macOS Skills UI में "Website" के रूप में दिखाया जाने वाला URL                                    |

Gating fields (`requires.bins`, `requires.env`, आदि) के लिए देखें
[Skills — Gating](/hi/tools/skills#gating)।

### `{baseDir}` का उपयोग

skill body में `{baseDir}` का उपयोग करके hardcoded paths के बिना skill
डायरेक्टरी के अंदर की फ़ाइलों को reference करें:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## conditional activation जोड़ना

अपनी skill को gate करें ताकि वह केवल तब load हो जब उसकी dependencies उपलब्ध हों:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | Key | Description |
    | --- | --- |
    | `requires.bins` | सभी binaries `PATH` पर मौजूद होनी चाहिए |
    | `requires.anyBins` | कम से कम एक binary `PATH` पर मौजूद होनी चाहिए |
    | `requires.env` | हर env var process या config में मौजूद होना चाहिए |
    | `requires.config` | हर `openclaw.json` path truthy होना चाहिए |
    | `os` | Platform filter: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | सभी gates छोड़ने और skill को हमेशा शामिल करने के लिए `true` set करें |

    पूरा संदर्भ: [Skills — Gating](/hi/tools/skills#gating)।

  </Accordion>
  <Accordion title="Environment and API keys">
    `openclaw.json` में किसी skill entry से API key जोड़ें:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    key केवल उस agent turn के लिए host process में inject की जाती है।
    यह sandbox तक नहीं पहुँचती — देखें
    [sandboxed env vars](/hi/tools/skills-config#sandboxed-skills-and-env-vars)।

  </Accordion>
</AccordionGroup>

## Skill Workshop के ज़रिए प्रस्ताव दें

agent-drafted skills के लिए या जब आप किसी skill के live होने से पहले operator review चाहते हों,
`SKILL.md` सीधे लिखने के बजाय [Skill Workshop](/hi/tools/skill-workshop) proposals का उपयोग करें।

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

जब proposal में support files शामिल हों, तो `--proposal-dir` का उपयोग करें:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

डायरेक्टरी में `PROPOSAL.md` होना चाहिए। Support files `assets/`,
`examples/`, `references/`, `scripts/`, या `templates/` में जा सकती हैं।

review के बाद:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

पूरे proposal lifecycle के लिए [Skill Workshop](/hi/tools/skill-workshop) देखें।

## ClawHub पर publish करना

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    सुनिश्चित करें कि `name`, `description`, और कोई भी `metadata.openclaw` gating fields
    set हैं। यदि आपके पास project page है तो `homepage` URL जोड़ें।
  </Step>
  <Step title="Install the ClawHub skill">
    ClawHub skill current publish command shape और आवश्यक
    metadata को document करती है:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publish">
    ```bash
    clawhub publish
    ```

    पूरे flow के लिए [ClawHub — Publishing](/hi/clawhub/publishing) देखें।

  </Step>
</Steps>

## Best practices

<Tip>
  - **संक्षिप्त रहें** — model को निर्देश दें कि *क्या* करना है, यह नहीं कि AI कैसे होना है।
  - **Safety पहले** — यदि आपकी skill `exec` का उपयोग करती है, तो सुनिश्चित करें कि prompts untrusted input से
    arbitrary command injection की अनुमति न दें।
  - **स्थानीय रूप से test करें** — share करने से पहले `openclaw agent --message "..."` का उपयोग करें।
  - **ClawHub का उपयोग करें** — scratch से बनाने से पहले [clawhub.ai](https://clawhub.ai) पर community skills
    browse करें।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills reference" href="/hi/tools/skills" icon="puzzle-piece">
    Loading order, gating, allowlists, और SKILL.md format।
  </Card>
  <Card title="Skill Workshop" href="/hi/tools/skill-workshop" icon="flask">
    agent-drafted skills के लिए proposal queue।
  </Card>
  <Card title="Skills config" href="/hi/tools/skills-config" icon="gear">
    पूरा `skills.*` config schema।
  </Card>
  <Card title="ClawHub" href="/hi/clawhub" icon="cloud">
    public registry पर skills browse और publish करें।
  </Card>
  <Card title="Building plugins" href="/hi/plugins/building-plugins" icon="plug">
    Plugins उन tools के साथ skills ship कर सकते हैं जिन्हें वे document करते हैं।
  </Card>
</CardGroup>
