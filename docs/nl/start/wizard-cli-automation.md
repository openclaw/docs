---
read_when:
    - Je automatiseert het introductieproces in scripts of CI
    - Je hebt niet-interactieve voorbeelden nodig voor specifieke providers
sidebarTitle: CLI automation
summary: Gescripte onboarding en agentconfiguratie voor de OpenClaw CLI
title: CLI-automatisering
x-i18n:
    generated_at: "2026-04-29T23:20:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a169abafa682e99d2cd89dbcc9a738790d7fdfa7ba204f415baac35d6df4a2f
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Gebruik `--non-interactive` om `openclaw onboard` te automatiseren.

<Note>
`--json` impliceert geen niet-interactieve modus. Gebruik `--non-interactive` (en `--workspace`) voor scripts.
</Note>

## Basisvoorbeeld voor niet-interactief gebruik

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

Voeg `--json` toe voor een machineleesbare samenvatting.

Gebruik `--skip-bootstrap` wanneer je automatisering workspace-bestanden vooraf aanmaakt en je niet wilt dat onboarding de standaard bootstrap-bestanden maakt.

Gebruik `--secret-input-mode ref` om door env ondersteunde refs in auth-profielen op te slaan in plaats van platte tekstwaarden.
Interactieve selectie tussen env-refs en geconfigureerde provider-refs (`file` of `exec`) is beschikbaar in de onboarding-flow.

In niet-interactieve `ref`-modus moeten provider-env-vars zijn ingesteld in de procesomgeving.
Het doorgeven van inline sleutelvlaggen zonder de bijbehorende env-var faalt nu direct.

Voorbeeld:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Providerspecifieke voorbeelden

<AccordionGroup>
  <Accordion title="Voorbeeld met Anthropic API-sleutel">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini-voorbeeld">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI-voorbeeld">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Voorbeeld met Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Voorbeeld met Cloudflare AI Gateway">
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
  <Accordion title="Moonshot-voorbeeld">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral-voorbeeld">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Synthetic-voorbeeld">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode-voorbeeld">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Wissel naar `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` voor de Go-catalogus.
  </Accordion>
  <Accordion title="Ollama-voorbeeld">
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
  <Accordion title="Voorbeeld met aangepaste provider">
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

    `--custom-api-key` is optioneel. Als deze wordt weggelaten, controleert onboarding `CUSTOM_API_KEY`.
    OpenClaw markeert algemene vision-model-ID's automatisch als geschikt voor afbeeldingsinvoer. Voeg `--custom-image-input` toe voor onbekende aangepaste vision-ID's, of `--custom-text-input` om metadata voor alleen tekst af te dwingen.

    Variant voor ref-modus:

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

    In deze modus slaat onboarding `apiKey` op als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Anthropic setup-token blijft beschikbaar als ondersteund onboarding-tokenpad, maar OpenClaw geeft nu de voorkeur aan hergebruik van Claude CLI wanneer beschikbaar.
Geef voor productie de voorkeur aan een Anthropic API-sleutel.

## Nog een agent toevoegen

Gebruik `openclaw agents add <name>` om een aparte agent te maken met een eigen workspace,
sessies en auth-profielen. Uitvoeren zonder `--workspace` start de wizard.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Wat dit instelt:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Opmerkingen:

- Standaard-workspaces volgen `~/.openclaw/workspace-<agentId>`.
- Voeg `bindings` toe om inkomende berichten te routeren (de wizard kan dit doen).
- Niet-interactieve vlaggen: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Gerelateerde docs

- Onboarding-hub: [Onboarding (CLI)](/nl/start/wizard)
- Volledige referentie: [CLI-installatiereferentie](/nl/start/wizard-cli-reference)
- Commandoreferentie: [`openclaw onboard`](/nl/cli/onboard)
