---
read_when:
    - U automatiseert onboarding in scripts of CI
    - U hebt niet-interactieve voorbeelden nodig voor specifieke providers
sidebarTitle: CLI automation
summary: Gescripte onboarding en agentconfiguratie voor de OpenClaw CLI
title: CLI-automatisering
x-i18n:
    generated_at: "2026-07-12T09:19:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Gebruik `openclaw onboard --non-interactive` om de configuratie te scripten. Hiervoor is `--accept-risk` vereist: niet-interactieve configuratie kan aanmeldgegevens en daemonconfiguratie wegschrijven zonder bevestigingsprompt, dus deze vlag is de expliciete erkenning van het risico.

<Note>
`--json` activeert niet automatisch de niet-interactieve modus. Geef voor scripts expliciet `--non-interactive --accept-risk` door.
</Note>

## Niet-interactief basisvoorbeeld

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

Voeg `--json` toe voor een machineleesbare samenvatting.

- `--gateway-port` is standaard `18789`; geef deze optie alleen door om de standaardwaarde te overschrijven.
- `--skip-bootstrap` slaat het aanmaken van standaardwerkruimtebestanden over, voor automatisering die vooraf een eigen werkruimte vult.
- `--secret-input-mode ref` slaat in het authenticatieprofiel een door een omgevingsvariabele ondersteunde verwijzing (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) op in plaats van de sleutel als platte tekst. In de niet-interactieve `ref`-modus moet de omgevingsvariabele van de provider al in de procesomgeving zijn ingesteld: het doorgeven van een inline sleutelvlag zonder de bijbehorende omgevingsvariabele mislukt onmiddellijk.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Providerspecifieke voorbeelden

<AccordionGroup>
  <Accordion title="Voorbeeld met een Anthropic API-sleutel">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Voorbeeld met Cloudflare AI Gateway">
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
  <Accordion title="Voorbeeld met Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Voorbeeld met Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Voorbeeld met Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Voorbeeld met Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Voorbeeld met OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Gebruik `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` voor de Go-catalogus.
  </Accordion>
  <Accordion title="Voorbeeld met Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Voorbeeld met Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Voorbeeld met Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Voorbeeld met een aangepaste provider">
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

    `--custom-api-key` is optioneel; sommige eindpunten vereisen geen authenticatie. Wanneer deze optie wordt weggelaten, controleert het onboardingproces de omgevingsvariabele `CUSTOM_API_KEY`. `--custom-provider-id` is optioneel en wordt bij weglating automatisch afgeleid van de basis-URL. `--custom-compatibility` is standaard `openai` (andere waarden: `openai-responses`, `anthropic`).

    OpenClaw leidt ondersteuning voor beeldinvoer af uit bekende patronen voor model-ID's van beeldmodellen (`gpt-4o`, `claude-3/4`, `gemini`, de achtervoegsels `-vl`/`vision` en vergelijkbare patronen). Voeg `--custom-image-input` toe om deze ondersteuning af te dwingen voor een niet-herkend beeldmodel, of `--custom-text-input` om alleen tekst af te dwingen.

    Variant voor de verwijzingsmodus, waarbij `apiKey` wordt opgeslagen als `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

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

Authenticatie met een Anthropic-configuratietoken blijft ondersteund, maar OpenClaw geeft de voorkeur aan hergebruik van de Claude CLI wanneer lokaal een Claude CLI-aanmelding beschikbaar is. Gebruik voor productie bij voorkeur een Anthropic API-sleutel.

## Nog een agent toevoegen

`openclaw agents add <name>` maakt een afzonderlijke agent met een eigen werkruimte, sessies en authenticatieprofielen. Als u deze opdracht zonder `--workspace` (en zonder andere vlaggen) uitvoert, wordt de interactieve wizard gestart; als u `--workspace`, `--model`, `--agent-dir`, `--bind` of `--non-interactive` doorgeeft, wordt de opdracht niet-interactief uitgevoerd en is `--workspace` vereist.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Configuratiesleutels die worden geschreven (`agents.list[]`-vermelding voor het ID van de nieuwe agent):

- `name`
- `workspace`
- `agentDir`
- `model` (alleen wanneer `--model` wordt doorgegeven)

Opmerkingen:

- Standaardwerkruimte (wanneer `--workspace` in de interactieve wizard wordt weggelaten): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` kan meerdere keren worden gebruikt; voeg bindingen toe om inkomende berichten naar de nieuwe agent te routeren (dit kan ook interactief in de wizard).
- De naam van de agent wordt genormaliseerd naar een geldig agent-ID; `main` is gereserveerd.

## Gerelateerde documentatie

- Onboardingcentrum: [Onboarding (CLI)](/nl/start/wizard)
- Volledige naslag: [Naslag voor CLI-configuratie](/nl/start/wizard-cli-reference)
- Opdrachtnaslag: [`openclaw onboard`](/nl/cli/onboard)
