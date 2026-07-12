---
read_when:
    - Stai automatizzando l'onboarding negli script o nella CI
    - Hai bisogno di esempi non interattivi per provider specifici
sidebarTitle: CLI automation
summary: Onboarding tramite script e configurazione dell’agente per la CLI di OpenClaw
title: Automazione della CLI
x-i18n:
    generated_at: "2026-07-12T07:30:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Usa `openclaw onboard --non-interactive` per automatizzare la configurazione tramite script. Richiede `--accept-risk`: la configurazione non interattiva può scrivere credenziali e la configurazione del demone senza una richiesta di conferma, quindi il flag costituisce l'accettazione esplicita del rischio.

<Note>
`--json` non implica la modalità non interattiva. Per gli script, passa esplicitamente `--non-interactive --accept-risk`.
</Note>

## Esempio di base non interattivo

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

Aggiungi `--json` per ottenere un riepilogo leggibile dalla macchina.

- Il valore predefinito di `--gateway-port` è `18789`; passalo solo per sostituirlo.
- `--skip-bootstrap` evita la creazione dei file predefiniti dell'area di lavoro, per le automazioni che precompilano la propria area di lavoro.
- `--secret-input-mode ref` memorizza nel profilo di autenticazione un riferimento basato su una variabile di ambiente (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) anziché la chiave in testo normale. Nella modalità non interattiva `ref`, la variabile di ambiente del provider deve essere già impostata nell'ambiente del processo: il passaggio di un flag con una chiave inline senza la variabile di ambiente corrispondente causa un errore immediato.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Esempi specifici per provider

<AccordionGroup>
  <Accordion title="Esempio con chiave API Anthropic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio con Cloudflare AI Gateway">
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
  <Accordion title="Esempio con Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio con Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio con Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio con Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio con OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Per il catalogo Go, sostituisci con `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`.
  </Accordion>
  <Accordion title="Esempio con Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio con Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio con Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Esempio con provider personalizzato">
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

    `--custom-api-key` è facoltativo; alcuni endpoint non richiedono l'autenticazione. Se omesso, il processo di onboarding verifica la presenza di `CUSTOM_API_KEY` nell'ambiente. `--custom-provider-id` è facoltativo e, se omesso, viene derivato automaticamente dall'URL di base. Il valore predefinito di `--custom-compatibility` è `openai` (altri valori: `openai-responses`, `anthropic`).

    OpenClaw deduce il supporto per l'input di immagini dai modelli noti degli identificatori dei modelli di visione (`gpt-4o`, `claude-3/4`, `gemini`, suffissi `-vl`/`vision` e simili). Aggiungi `--custom-image-input` per abilitarlo forzatamente per un modello di visione non riconosciuto oppure `--custom-text-input` per imporre l'uso esclusivo del testo.

    Variante in modalità `ref`, che memorizza `apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

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

L'autenticazione tramite token di configurazione Anthropic rimane supportata, ma OpenClaw preferisce riutilizzare Claude CLI quando è disponibile un accesso locale a Claude CLI. Per la produzione, preferisci una chiave API Anthropic.

## Aggiungere un altro agente

`openclaw agents add <name>` crea un agente separato con la propria area di lavoro, le proprie sessioni e i propri profili di autenticazione. Eseguendolo senza `--workspace` (e senza altri flag) viene avviata la procedura guidata interattiva; il passaggio di uno qualsiasi tra `--workspace`, `--model`, `--agent-dir`, `--bind` o `--non-interactive` lo esegue in modalità non interattiva e richiede quindi `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Chiavi di configurazione scritte dal comando (voce `agents.list[]` per il nuovo identificatore dell'agente):

- `name`
- `workspace`
- `agentDir`
- `model` (solo quando viene passato `--model`)

Note:

- Area di lavoro predefinita (quando `--workspace` viene omesso nella procedura guidata interattiva): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` è ripetibile; aggiungi associazioni per instradare i messaggi in arrivo al nuovo agente (la procedura guidata consente di farlo anche in modo interattivo).
- Il nome dell'agente viene normalizzato in un identificatore agente valido; `main` è riservato.

## Documentazione correlata

- Centro per l'onboarding: [Onboarding (CLI)](/it/start/wizard)
- Riferimento completo: [Riferimento per la configurazione tramite CLI](/it/start/wizard-cli-reference)
- Riferimento del comando: [`openclaw onboard`](/it/cli/onboard)
