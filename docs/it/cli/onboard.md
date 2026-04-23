---
read_when:
    - Vuoi una configurazione guidata per gateway, workspace, autenticazione, canali e Skills
summary: Riferimento CLI per `openclaw onboard` (onboarding interattivo)
title: onboard
x-i18n:
    generated_at: "2026-04-23T08:27:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348ee9cbc14ff78b588f10297e728473668a72f9f16be385f25022bf5108340c
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Onboarding interattivo per la configurazione locale o remota del Gateway.

## Guide correlate

- Hub onboarding CLI: [Onboarding (CLI)](/it/start/wizard)
- Panoramica onboarding: [Panoramica onboarding](/it/start/onboarding-overview)
- Riferimento onboarding CLI: [Riferimento configurazione CLI](/it/start/wizard-cli-reference)
- Automazione CLI: [Automazione CLI](/it/start/wizard-cli-automation)
- Onboarding macOS: [Onboarding (app macOS)](/it/start/onboarding)

## Esempi

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Per target `ws://` in testo semplice su rete privata (solo reti attendibili), imposta
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nell'ambiente del processo di onboarding.

Provider personalizzato non interattivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` è facoltativo in modalità non interattiva. Se omesso, l'onboarding controlla `CUSTOM_API_KEY`.

LM Studio supporta anche un flag chiave specifico del provider in modalità non interattiva:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama non interattivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` usa come predefinito `http://127.0.0.1:11434`. `--custom-model-id` è facoltativo; se omesso, l'onboarding usa i valori predefiniti suggeriti da Ollama. Qui funzionano anche ID modello cloud come `kimi-k2.5:cloud`.

Memorizza le chiavi del provider come ref invece che in testo semplice:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, l'onboarding scrive ref supportati da env invece di valori chiave in testo semplice.
Per i provider supportati da auth-profile, questo scrive voci `keyRef`; per i provider personalizzati, questo scrive `models.providers.<id>.apiKey` come ref env (per esempio `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contratto della modalità `ref` non interattiva:

- Imposta la variabile env del provider nell'ambiente del processo di onboarding (per esempio `OPENAI_API_KEY`).
- Non passare flag di chiavi inline (per esempio `--openai-api-key`) a meno che anche quella variabile env non sia impostata.
- Se viene passato un flag chiave inline senza la variabile env richiesta, l'onboarding fallisce subito con istruzioni.

Opzioni del token Gateway in modalità non interattiva:

- `--gateway-auth token --gateway-token <token>` memorizza un token in testo semplice.
- `--gateway-auth token --gateway-token-ref-env <name>` memorizza `gateway.auth.token` come env SecretRef.
- `--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.
- `--gateway-token-ref-env` richiede una variabile env non vuota nell'ambiente del processo di onboarding.
- Con `--install-daemon`, quando l'autenticazione token richiede un token, i token Gateway gestiti da SecretRef vengono convalidati ma non persistiti come testo semplice risolto nei metadati dell'ambiente del servizio supervisor.
- Con `--install-daemon`, se la modalità token richiede un token e il SecretRef del token configurato non è risolto, l'onboarding fallisce in modalità fail-closed con istruzioni di correzione.
- Con `--install-daemon`, se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'onboarding blocca l'installazione finché la modalità non viene impostata esplicitamente.
- L'onboarding locale scrive `gateway.mode="local"` nella configurazione. Se un file di configurazione successivo non contiene `gateway.mode`, trattalo come configurazione danneggiata o modifica manuale incompleta, non come scorciatoia valida per la modalità locale.
- `--allow-unconfigured` è una distinta via di fuga runtime del gateway. Non significa che l'onboarding possa omettere `gateway.mode`.

Esempio:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Salute del gateway locale in modalità non interattiva:

- A meno che tu non passi `--skip-health`, l'onboarding aspetta che un gateway locale raggiungibile sia disponibile prima di terminare con successo.
- `--install-daemon` avvia prima il percorso di installazione del gateway gestito. Senza di esso, devi già avere un gateway locale in esecuzione, per esempio `openclaw gateway run`.
- Se vuoi solo scritture di configurazione/workspace/bootstrap in automazione, usa `--skip-health`.
- Su Windows nativo, `--install-daemon` prova prima con Scheduled Tasks e usa il fallback a un elemento di accesso per utente nella cartella Startup se la creazione del task viene negata.

Comportamento dell'onboarding interattivo con modalità reference:

- Scegli **Use secret reference** quando richiesto.
- Poi scegli una delle seguenti opzioni:
  - Variabile di ambiente
  - Provider di segreti configurato (`file` o `exec`)
- L'onboarding esegue una rapida convalida preliminare prima di salvare il ref.
  - Se la convalida fallisce, l'onboarding mostra l'errore e ti consente di riprovare.

Scelte dell'endpoint Z.AI non interattive:

Nota: `--auth-choice zai-api-key` ora rileva automaticamente il miglior endpoint Z.AI per la tua chiave (preferisce l'API generale con `zai/glm-5.1`).
Se vuoi specificamente gli endpoint GLM Coding Plan, scegli `zai-coding-global` o `zai-coding-cn`.

```bash
# Selezione endpoint senza prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Altre scelte di endpoint Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Esempio Mistral non interattivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Note sui flussi:

- `quickstart`: prompt minimi, genera automaticamente un token gateway.
- `manual`: prompt completi per porta/bind/auth (alias di `advanced`).
- Quando una scelta auth implica un provider preferito, l'onboarding prefiltra i selettori di modello predefinito e allowlist a quel provider. Per Volcengine e BytePlus, questo corrisponde anche alle varianti coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).
- Se il filtro del provider preferito non produce ancora modelli caricati, l'onboarding usa il fallback al catalogo non filtrato invece di lasciare vuoto il selettore.
- Nella fase di web-search, alcuni provider possono attivare prompt di follow-up specifici del provider:
  - **Grok** può offrire la configurazione facoltativa `x_search` con la stessa `XAI_API_KEY` e una scelta del modello `x_search`.
  - **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e il modello predefinito di web-search Kimi.
- Comportamento dello scope DM nell'onboarding locale: [Riferimento configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals).
- Prima chat più veloce: `openclaw dashboard` (Control UI, nessuna configurazione canale).
- Provider personalizzato: collega qualsiasi endpoint compatibile con OpenAI o Anthropic, inclusi provider ospitati non elencati. Usa Unknown per il rilevamento automatico.

## Comandi di follow-up comuni

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` per gli script.
</Note>
