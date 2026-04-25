---
read_when:
    - Stai automatizzando l'onboarding in script o CI
    - Hai bisogno di esempi non interattivi per provider specifici
sidebarTitle: CLI automation
summary: Onboarding scriptato e configurazione dell'agente per la CLI OpenClaw
title: Automazione CLI
x-i18n:
    generated_at: "2026-04-25T18:22:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50b6ef35554ec085012a84b8abb8d52013934ada5293d941babea56eaacf4a9f
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

Usa `--non-interactive` per automatizzare `openclaw onboard`.

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` (e `--workspace`) per gli script.
</Note>

## Esempio base non interattivo

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

Aggiungi `--json` per un riepilogo leggibile dalle macchine.

Usa `--skip-bootstrap` quando la tua automazione pre-popola i file del workspace e non vuole che l'onboarding crei i file bootstrap predefiniti.

Usa `--secret-input-mode ref` per memorizzare riferimenti supportati da env nei profili auth invece di valori in chiaro.
La selezione interattiva tra riferimenti env e riferimenti a provider configurati (`file` o `exec`) è disponibile nel flusso di onboarding.

In modalità non interattiva `ref`, le variabili env del provider devono essere impostate nell'ambiente del processo.
Il passaggio di flag inline della chiave senza la variabile env corrispondente ora fallisce immediatamente.

Esempio:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Esempi specifici per provider

<AccordionGroup>
  <Accordion title="Esempio chiave API Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio Cloudflare AI Gateway">
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
  <Accordion title="Esempio Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Sostituisci con `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` per il catalogo Go.
  </Accordion>
  <Accordion title="Esempio Ollama">
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
  <Accordion title="Esempio provider personalizzato">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` è facoltativo. Se omesso, l'onboarding controlla `CUSTOM_API_KEY`.

    Variante in modalità ref:

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
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    In questa modalità, l'onboarding memorizza `apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Il setup-token Anthropic resta disponibile come percorso token di onboarding supportato, ma OpenClaw ora preferisce il riuso della CLI Claude quando disponibile.
Per la produzione, preferisci una chiave API Anthropic.

## Aggiungere un altro agente

Usa `openclaw agents add <name>` per creare un agente separato con workspace,
sessioni e profili auth propri. L'esecuzione senza `--workspace` avvia la procedura guidata.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Cosa imposta:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Note:

- I workspace predefiniti seguono `~/.openclaw/workspace-<agentId>`.
- Aggiungi `bindings` per instradare i messaggi in ingresso (la procedura guidata può farlo).
- Flag non interattivi: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Documenti correlati

- Hub onboarding: [Onboarding (CLI)](/it/start/wizard)
- Riferimento completo: [Riferimento configurazione CLI](/it/start/wizard-cli-reference)
- Riferimento comando: [`openclaw onboard`](/it/cli/onboard)
