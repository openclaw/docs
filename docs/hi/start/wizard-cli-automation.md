---
read_when:
    - आप scripts या CI में ऑनबोर्डिंग को स्वचालित कर रहे हैं
    - आपको विशिष्ट प्रदाताओं के लिए गैर-इंटरैक्टिव उदाहरण चाहिए
sidebarTitle: CLI automation
summary: OpenClaw CLI के लिए स्क्रिप्टेड ऑनबोर्डिंग और एजेंट सेटअप
title: CLI स्वचालन
x-i18n:
    generated_at: "2026-06-29T00:15:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a169abafa682e99d2cd89dbcc9a738790d7fdfa7ba204f415baac35d6df4a2f
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

`openclaw onboard` को स्वचालित करने के लिए `--non-interactive` का उपयोग करें।

<Note>
`--json` non-interactive मोड को निहित नहीं करता। scripts के लिए `--non-interactive` (और `--workspace`) का उपयोग करें।
</Note>

## आधारभूत non-interactive उदाहरण

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

मशीन-पठनीय सारांश के लिए `--json` जोड़ें।

जब आपकी automation workspace फ़ाइलों को पहले से seed करती है और onboarding से default bootstrap फ़ाइलें बनवाना नहीं चाहती, तब `--skip-bootstrap` का उपयोग करें।

plaintext values के बजाय auth profiles में env-backed refs store करने के लिए `--secret-input-mode ref` का उपयोग करें।
env refs और configured provider refs (`file` या `exec`) के बीच interactive selection onboarding flow में उपलब्ध है।

non-interactive `ref` मोड में, provider env vars process environment में set होने चाहिए।
matching env var के बिना inline key flags पास करने पर अब तुरंत fail होता है।

उदाहरण:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Provider-specific उदाहरण

<AccordionGroup>
  <Accordion title="Anthropic API key उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Synthetic उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Go catalog के लिए `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` पर switch करें।
  </Accordion>
  <Accordion title="Ollama उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Custom provider उदाहरण">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` वैकल्पिक है। यदि इसे छोड़ा गया है, तो onboarding `CUSTOM_API_KEY` जांचता है।
    OpenClaw सामान्य vision model IDs को image-capable के रूप में स्वचालित रूप से mark करता है। अज्ञात custom vision IDs के लिए `--custom-image-input` जोड़ें, या केवल-text metadata को force करने के लिए `--custom-text-input` जोड़ें।

    Ref-mode variant:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    इस मोड में, onboarding `apiKey` को `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` के रूप में store करता है।

  </Accordion>
</AccordionGroup>

Anthropic setup-token समर्थित onboarding token path के रूप में उपलब्ध रहता है, लेकिन OpenClaw अब उपलब्ध होने पर Claude CLI reuse को प्राथमिकता देता है।
production के लिए, Anthropic API key को प्राथमिकता दें।

## एक और agent जोड़ें

अपने workspace,
sessions, और auth profiles वाले अलग agent को बनाने के लिए `openclaw agents add <name>` का उपयोग करें। `--workspace` के बिना चलाने पर wizard launch होता है।

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

यह क्या set करता है:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

नोट्स:

- Default workspaces `~/.openclaw/workspace-<agentId>` का अनुसरण करते हैं।
- inbound messages route करने के लिए `bindings` जोड़ें (wizard यह कर सकता है)।
- Non-interactive flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`।

## संबंधित दस्तावेज़

- Onboarding hub: [Onboarding (CLI)](/hi/start/wizard)
- पूर्ण reference: [CLI Setup Reference](/hi/start/wizard-cli-reference)
- Command reference: [`openclaw onboard`](/hi/cli/onboard)
