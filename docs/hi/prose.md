---
read_when:
    - आप .prose वर्कफ़्लो फ़ाइलें चलाना या लिखना चाहते हैं
    - आप OpenProse Plugin सक्षम करना चाहते हैं
    - आपको समझना होगा कि OpenProse, OpenClaw प्रिमिटिव्स से कैसे मैप होता है
sidebarTitle: OpenProse
summary: OpenProse बहु-एजेंट AI सत्रों के लिए Markdown-प्रथम वर्कफ़्लो फ़ॉर्मैट है। OpenClaw में यह /prose स्लैश कमांड और skill pack वाले Plugin के रूप में शामिल होता है।
title: ओपनप्रोज़
x-i18n:
    generated_at: "2026-06-28T23:55:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse AI सत्रों को संचालित करने के लिए एक पोर्टेबल, markdown-first वर्कफ़्लो फ़ॉर्मैट है। OpenClaw में यह एक Plugin के रूप में आता है, जो एक OpenProse कौशल पैक और `/prose` slash कमांड इंस्टॉल करता है। प्रोग्राम `.prose` फ़ाइलों में रहते हैं और स्पष्ट नियंत्रण प्रवाह के साथ कई sub-agents शुरू कर सकते हैं।

<CardGroup cols={3}>
  <Card title="Install" icon="download" href="#install">
    OpenProse Plugin सक्षम करें और Gateway फिर से शुरू करें।
  </Card>
  <Card title="Run a program" icon="play" href="#slash-command">
    किसी `.prose` फ़ाइल या रिमोट प्रोग्राम को चलाने के लिए `/prose run` का उपयोग करें।
  </Card>
  <Card title="Write programs" icon="pencil" href="#example">
    समानांतर और क्रमिक चरणों के साथ multi-agent वर्कफ़्लो लिखें।
  </Card>
</CardGroup>

## इंस्टॉल करें

<Steps>
  <Step title="Enable the plugin">
    Bundled plugins डिफ़ॉल्ट रूप से अक्षम होते हैं। OpenProse सक्षम करें:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="Verify">
    ```bash
    openclaw plugins list | grep prose
    ```

    आपको `open-prose` सक्षम के रूप में दिखना चाहिए। `/prose` कौशल कमांड अब
    चैट में उपलब्ध है।

  </Step>
</Steps>

स्थानीय checkout के लिए: `openclaw plugins install ./path/to/local/open-prose-plugin`

## Slash कमांड

OpenProse `/prose` को उपयोगकर्ता द्वारा चलाए जा सकने वाले कौशल कमांड के रूप में पंजीकृत करता है:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` `https://p.prose.md/<handle>/<slug>` पर resolve होता है।
सीधे URLs को `web_fetch` टूल का उपयोग करके जैसे हैं वैसे fetch किया जाता है।

Top-level रिमोट runs स्पष्ट होते हैं। `.prose` प्रोग्राम के अंदर रिमोट imports
transitive code dependencies हैं: OpenProse किसी भी रिमोट `use` target को fetch करने से पहले,
resolved import list दिखाता है और उस run के लिए operator से ठीक
`approve remote prose imports` जवाब देने की आवश्यकता होती है।

## यह क्या कर सकता है

- स्पष्ट parallelism के साथ multi-agent research और synthesis।
- दोहराए जा सकने वाले, approval-safe वर्कफ़्लो (code review, incident triage, content pipelines)।
- पुन: उपयोग योग्य `.prose` प्रोग्राम जिन्हें आप समर्थित agent runtimes में चला सकते हैं।

## उदाहरण: समानांतर research और synthesis

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## OpenClaw runtime mapping

OpenProse प्रोग्राम OpenClaw primitives पर map होते हैं:

| OpenProse concept         | OpenClaw tool    |
| ------------------------- | ---------------- |
| Spawn session / Task tool | `sessions_spawn` |
| File read / write         | `read` / `write` |
| Web fetch                 | `web_fetch`      |

<Warning>
  अगर आपकी tool allowlist `sessions_spawn`, `read`, `write`, या
  `web_fetch` को block करती है, तो OpenProse प्रोग्राम विफल होंगे। अपनी
  [tools allowlist config](/hi/gateway/config-tools) जांचें।
</Warning>

## फ़ाइल स्थान

OpenProse आपके workspace में `.prose/` के अंतर्गत state रखता है:

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

User-level persistent agents यहां रहते हैं:

```text
~/.prose/agents/
```

## State backends

<AccordionGroup>
  <Accordion title="filesystem (default)">
    State workspace में `.prose/runs/...` पर लिखा जाता है। कोई अतिरिक्त
    dependencies आवश्यक नहीं हैं।
  </Accordion>
  <Accordion title="in-context">
    Transient state context window में रखा जाता है। छोटे, कम समय तक चलने वाले
    प्रोग्रामों के लिए उपयुक्त।
  </Accordion>
  <Accordion title="sqlite (experimental)">
    `PATH` पर `sqlite3` binary की आवश्यकता होती है।
  </Accordion>
  <Accordion title="postgres (experimental)">
    `psql` और connection string की आवश्यकता होती है।

    <Warning>
      Postgres credentials sub-agent logs में चले जाते हैं। एक dedicated,
      least-privileged database का उपयोग करें।
    </Warning>

  </Accordion>
</AccordionGroup>

## सुरक्षा

`.prose` फ़ाइलों को code की तरह मानें। उन्हें चलाने से पहले review करें, जिसमें रिमोट
`use` imports भी शामिल हैं। Top-level `/prose run https://...` अनुरोध स्पष्ट होते हैं, लेकिन
transitive remote imports को fetch या execute करने से पहले प्रति-run approval की आवश्यकता होती है।
Side effects को नियंत्रित करने के लिए OpenClaw tool allowlists और approval gates का उपयोग करें।
Deterministic, approval-gated वर्कफ़्लो के लिए,
[Lobster](/hi/tools/lobster) से तुलना करें।

## संबंधित

<CardGroup cols={2}>
  <Card title="Skills reference" href="/hi/tools/skills" icon="puzzle-piece">
    OpenProse का कौशल पैक कैसे load होता है और कौन-से gates लागू होते हैं।
  </Card>
  <Card title="Subagents" href="/hi/tools/subagents" icon="users">
    OpenClaw की native multi-agent coordination layer।
  </Card>
  <Card title="Text-to-speech" href="/hi/tools/tts" icon="volume-high">
    अपने वर्कफ़्लो में audio output जोड़ें।
  </Card>
  <Card title="Slash commands" href="/hi/tools/slash-commands" icon="terminal">
    /prose सहित सभी उपलब्ध chat commands।
  </Card>
</CardGroup>

आधिकारिक साइट: [https://www.prose.md](https://www.prose.md)
