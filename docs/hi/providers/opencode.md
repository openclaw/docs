---
read_when:
    - आप OpenCode-होस्टेड मॉडल एक्सेस चाहते हैं
    - आप Zen और Go कैटलॉग में से चुनना चाहते हैं
summary: OpenCode Zen और Go कैटलॉग को OpenClaw के साथ उपयोग करें
title: OpenCode
x-i18n:
    generated_at: "2026-06-29T00:01:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode, OpenClaw में दो hosted catalog उजागर करता है:

| Catalog | Prefix            | Runtime provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

दोनों catalog एक ही OpenCode API key का उपयोग करते हैं। OpenClaw runtime provider ids को
अलग रखता है ताकि upstream per-model routing सही रहे, लेकिन onboarding और docs उन्हें
एक OpenCode setup के रूप में देखते हैं।

## शुरू करना

<Tabs>
  <Tab title="Zen catalog">
    **इसके लिए सर्वोत्तम:** curated OpenCode multi-model proxy (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="onboarding चलाएँ">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        या key सीधे पास करें:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="एक Zen model को default के रूप में सेट करें">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="सत्यापित करें कि models उपलब्ध हैं">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **इसके लिए सर्वोत्तम:** OpenCode-hosted Kimi, GLM, और MiniMax lineup.

    <Steps>
      <Step title="onboarding चलाएँ">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        या key सीधे पास करें:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="एक Go model को default के रूप में सेट करें">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="सत्यापित करें कि models उपलब्ध हैं">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Config उदाहरण

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## अंतर्निहित catalog

### Zen

| गुण              | मान                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Runtime provider | `opencode`                                                                                    |
| उदाहरण models    | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| गुण              | मान                                                                      |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime provider | `opencode-go`                                                            |
| उदाहरण models    | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## उन्नत configuration

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY`, `OPENCODE_API_KEY` के alias के रूप में भी समर्थित है।
  </Accordion>

  <Accordion title="साझा credentials">
    setup के दौरान एक OpenCode key दर्ज करने से दोनों runtime
    providers के लिए credentials संग्रहीत हो जाते हैं। आपको प्रत्येक catalog को अलग से onboard करने की आवश्यकता नहीं है।
  </Accordion>

  <Accordion title="Billing और dashboard">
    आप OpenCode में sign in करते हैं, billing details जोड़ते हैं, और अपनी API key copy करते हैं। Billing
    और catalog availability OpenCode dashboard से manage की जाती है।
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Gemini-backed OpenCode refs proxy-Gemini path पर रहते हैं, इसलिए OpenClaw वहाँ
    Gemini thought-signature sanitation रखता है, native Gemini
    replay validation या bootstrap rewrites enable किए बिना।
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    Non-Gemini OpenCode refs न्यूनतम OpenAI-compatible replay policy रखते हैं।
  </Accordion>
</AccordionGroup>

<Tip>
setup के दौरान एक OpenCode key दर्ज करने से Zen और
Go दोनों runtime providers के लिए credentials संग्रहीत हो जाते हैं, इसलिए आपको केवल एक बार onboard करना होता है।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="Model selection" href="/hi/concepts/model-providers" icon="layers">
    providers, model refs, और failover behavior चुनना।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/configuration-reference" icon="gear">
    agents, models, और providers के लिए पूरा config reference।
  </Card>
</CardGroup>
