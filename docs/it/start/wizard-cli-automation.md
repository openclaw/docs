---
read_when:
    - Stai automatizzando la configurazione iniziale negli script o in CI
    - Servono esempi non interattivi per provider specifici
sidebarTitle: CLI automation
summary: Avvio guidato tramite script e configurazione degli agenti per la CLI di OpenClaw
title: Automazione CLI
x-i18n:
    generated_at: "2026-04-30T09:13:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a169abafa682e99d2cd89dbcc9a738790d7fdfa7ba204f415baac35d6df4a2f
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Usa `--non-interactive` per automatizzare `openclaw onboard`.

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` (e `--workspace`) per gli script.
</Note>

## Esempio di base non interattivo

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

Aggiungi `--json` per un riepilogo leggibile da una macchina.

Usa `--skip-bootstrap` quando la tua automazione precompila i file del workspace e non vuoi che l'onboarding crei i file di bootstrap predefiniti.

Usa `--secret-input-mode ref` per archiviare riferimenti basati su env nei profili di autenticazione invece di valori in testo semplice.
La selezione interattiva tra riferimenti env e riferimenti provider configurati (`file` o `exec`) è disponibile nel flusso di onboarding.

Nella modalità `ref` non interattiva, le variabili env del provider devono essere impostate nell'ambiente del processo.
Il passaggio di flag di chiave inline senza la variabile env corrispondente ora fallisce immediatamente.

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
  <Accordion title="Esempio di chiave API Anthropic">
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
    Passa a `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` per il catalogo Go.
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
  <Accordion title="Esempio di provider personalizzato">
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

    `--custom-api-key` è facoltativo. Se omesso, l'onboarding controlla `CUSTOM_API_KEY`.
    OpenClaw contrassegna automaticamente gli ID dei modelli di visione comuni come compatibili con le immagini. Aggiungi `--custom-image-input` per ID di visione personalizzati sconosciuti, oppure `--custom-text-input` per forzare metadati solo testo.

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
      --custom-image-input \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    In questa modalità, l'onboarding archivia `apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Il setup-token Anthropic resta disponibile come percorso di token di onboarding supportato, ma OpenClaw ora preferisce il riutilizzo di Claude CLI quando disponibile.
Per la produzione, preferisci una chiave API Anthropic.

## Aggiungere un altro agente

Usa `openclaw agents add <name>` per creare un agente separato con il proprio workspace,
sessioni e profili di autenticazione. L'esecuzione senza `--workspace` avvia la procedura guidata.

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

- Hub dell'onboarding: [Onboarding (CLI)](/it/start/wizard)
- Riferimento completo: [Riferimento configurazione CLI](/it/start/wizard-cli-reference)
- Riferimento comando: [`openclaw onboard`](/it/cli/onboard)
