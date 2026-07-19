---
read_when:
    - आप स्क्रिप्ट या CI में ऑनबोर्डिंग को स्वचालित कर रहे हैं
    - आपको विशिष्ट प्रदाताओं के लिए गैर-संवादात्मक उदाहरण चाहिए
sidebarTitle: CLI automation
summary: OpenClaw CLI के लिए स्क्रिप्ट-आधारित ऑनबोर्डिंग और एजेंट सेटअप
title: CLI स्वचालन
x-i18n:
    generated_at: "2026-07-19T09:46:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

सेटअप को स्क्रिप्ट करने के लिए `openclaw onboard --non-interactive` का उपयोग करें। इसके लिए `--accept-risk` आवश्यक है: गैर-इंटरैक्टिव सेटअप बिना किसी पुष्टिकरण प्रॉम्प्ट के क्रेडेंशियल और डेमन कॉन्फ़िगरेशन लिख सकता है, इसलिए यह फ़्लैग जोखिम की स्पष्ट स्वीकृति है।

<Note>
`--json` गैर-इंटरैक्टिव मोड को इंगित नहीं करता। स्क्रिप्ट के लिए `--non-interactive --accept-risk` स्पष्ट रूप से पास करें।
</Note>

## आधारभूत गैर-इंटरैक्टिव उदाहरण

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

मशीन-पठनीय सारांश के लिए `--json` जोड़ें।

- `--gateway-port` का डिफ़ॉल्ट मान `18789` है; इसे केवल ओवरराइड करने के लिए पास करें।
- `--skip-bootstrap` डिफ़ॉल्ट वर्कस्पेस फ़ाइलें बनाना छोड़ देता है, ऐसी ऑटोमेशन के लिए जो अपने वर्कस्पेस को पहले से तैयार करती है।
- `--secret-input-mode ref` प्लेनटेक्स्ट कुंजी के बजाय प्रमाणीकरण प्रोफ़ाइल में पर्यावरण-समर्थित संदर्भ (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) संग्रहीत करता है। गैर-इंटरैक्टिव `ref` मोड में, प्रदाता का पर्यावरण चर प्रक्रिया के परिवेश में पहले से सेट होना चाहिए: उसके संगत पर्यावरण चर के बिना इनलाइन कुंजी फ़्लैग पास करने पर प्रक्रिया तुरंत विफल हो जाती है।

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## प्रदाता-विशिष्ट उदाहरण

<AccordionGroup>
  <Accordion title="Anthropic API कुंजी का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ollama का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Go कैटलॉग के लिए इसे `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` से बदलें।
  </Accordion>
  <Accordion title="Synthetic का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="कस्टम प्रदाता का उदाहरण">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    `--custom-api-key` वैकल्पिक है; कुछ एंडपॉइंट को प्रमाणीकरण की आवश्यकता नहीं होती। इसे छोड़ने पर, ऑनबोर्डिंग पर्यावरण में `CUSTOM_API_KEY` की जाँच करती है। `--custom-provider-id` वैकल्पिक है और इसे छोड़ने पर यह आधार URL से स्वतः प्राप्त होता है। `--custom-compatibility` का डिफ़ॉल्ट मान `openai` है (अन्य मान: `openai-responses`, `anthropic`)।

    OpenClaw ज्ञात विज़न मॉडल आईडी पैटर्न (`gpt-4o`, `claude-3/4`, `gemini`, `-vl`/`vision` प्रत्यय और इसी तरह के पैटर्न) से इमेज-इनपुट समर्थन का अनुमान लगाता है। किसी अपरिचित विज़न मॉडल के लिए इसे बलपूर्वक चालू करने हेतु `--custom-image-input` जोड़ें, या केवल-टेक्स्ट लागू करने हेतु `--custom-text-input` जोड़ें।

    संदर्भ-मोड संस्करण, जो `apiKey` को `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` के रूप में संग्रहीत करता है:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

Anthropic सेटअप-टोकन प्रमाणीकरण अभी भी समर्थित है, लेकिन स्थानीय Claude CLI लॉगिन उपलब्ध होने पर OpenClaw Claude CLI के पुनः उपयोग को प्राथमिकता देता है। प्रोडक्शन के लिए Anthropic API कुंजी को प्राथमिकता दें।

## एक और एजेंट जोड़ें

`openclaw agents add <name>` अपने वर्कस्पेस, सत्रों और प्रमाणीकरण प्रोफ़ाइल वाला एक अलग एजेंट बनाता है। इसे `--workspace` के बिना (और किसी अन्य फ़्लैग के बिना) चलाने पर इंटरैक्टिव विज़ार्ड शुरू होता है; `--workspace`, `--model`, `--agent-dir`, `--bind`, या `--non-interactive` में से कोई भी पास करने पर यह गैर-इंटरैक्टिव रूप से चलता है और फिर `--workspace` आवश्यक होता है।

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

इसके द्वारा लिखी जाने वाली कॉन्फ़िगरेशन कुंजियाँ (नए एजेंट आईडी के लिए `agents.list[]` प्रविष्टि):

- `name`
- `workspace`
- `agentDir`
- `model` (केवल जब `--model` पास किया जाता है)

टिप्पणियाँ:

- डिफ़ॉल्ट वर्कस्पेस (जब इंटरैक्टिव विज़ार्ड में `--workspace` छोड़ दिया जाता है): `~/.openclaw/workspace-<agentId>`।
- `--bind <channel[:accountId]>` को दोहराया जा सकता है; आने वाले संदेशों को नए एजेंट तक रूट करने के लिए बाइंडिंग जोड़ें (विज़ार्ड इसे इंटरैक्टिव रूप से भी कर सकता है)।
- एजेंट के नाम को मान्य एजेंट आईडी में सामान्यीकृत किया जाता है; `main` आरक्षित है।

## संबंधित दस्तावेज़

- ऑनबोर्डिंग केंद्र: [ऑनबोर्डिंग (CLI)](/hi/start/wizard)
- पूर्ण संदर्भ: [CLI सेटअप संदर्भ](/hi/start/wizard-cli-reference)
- कमांड संदर्भ: [`openclaw onboard`](/hi/cli/onboard)
