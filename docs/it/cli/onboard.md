---
read_when:
    - Vuoi una configurazione guidata per Gateway, spazio di lavoro, autenticazione, canali e Skills
summary: Riferimento CLI per `openclaw onboard` (onboarding interattivo)
title: Onboard
x-i18n:
    generated_at: "2026-04-24T08:34:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1959ad7014b891230e497a2e0ab494ba316090c81629f25b8147614b694ead5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Onboarding interattivo per la configurazione del Gateway locale o remoto.

## Guide correlate

- Hub onboarding CLI: [Onboarding (CLI)](/it/start/wizard)
- Panoramica onboarding: [Onboarding Overview](/it/start/onboarding-overview)
- Riferimento onboarding CLI: [CLI Setup Reference](/it/start/wizard-cli-reference)
- Automazione CLI: [CLI Automation](/it/start/wizard-cli-automation)
- Onboarding macOS: [Onboarding (macOS App)](/it/start/onboarding)

## Esempi

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Per target `ws://` in testo semplice su rete privata (solo reti attendibili), imposta
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nell'ambiente del processo di onboarding.
Non esiste un equivalente in `openclaw.json` per questa misura straordinaria lato client
sul trasporto.

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

LM Studio supporta anche un flag specifico del provider per la chiave in modalità non interattiva:

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

`--custom-base-url` ha come valore predefinito `http://127.0.0.1:11434`. `--custom-model-id` è facoltativo; se omesso, l'onboarding usa i valori predefiniti suggeriti da Ollama. Anche gli ID modello cloud come `kimi-k2.5:cloud` funzionano qui.

Archivia le chiavi del provider come ref invece che in chiaro:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, l'onboarding scrive ref supportati da env invece di valori chiave in chiaro.
Per i provider supportati da profilo auth questo scrive voci `keyRef`; per i provider personalizzati scrive `models.providers.<id>.apiKey` come ref env (ad esempio `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contratto della modalità `ref` non interattiva:

- Imposta la variabile env del provider nell'ambiente del processo di onboarding (ad esempio `OPENAI_API_KEY`).
- Non passare flag di chiavi inline (ad esempio `--openai-api-key`) a meno che anche quella variabile env non sia impostata.
- Se viene passato un flag di chiave inline senza la variabile env richiesta, l'onboarding fallisce immediatamente con indicazioni.

Opzioni del token del Gateway in modalità non interattiva:

- `--gateway-auth token --gateway-token <token>` archivia un token in chiaro.
- `--gateway-auth token --gateway-token-ref-env <name>` archivia `gateway.auth.token` come SecretRef env.
- `--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.
- `--gateway-token-ref-env` richiede una variabile env non vuota nell'ambiente del processo di onboarding.
- Con `--install-daemon`, quando l'autenticazione token richiede un token, i token Gateway gestiti da SecretRef vengono convalidati ma non persistiti come testo in chiaro risolto nei metadati dell'ambiente del servizio supervisor.
- Con `--install-daemon`, se la modalità token richiede un token e il SecretRef del token configurato non è risolto, l'onboarding fallisce in modalità fail-closed con indicazioni per la correzione.
- Con `--install-daemon`, se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'onboarding blocca l'installazione finché la modalità non viene impostata esplicitamente.
- L'onboarding locale scrive `gateway.mode="local"` nella configurazione. Se un file di configurazione successivo non contiene `gateway.mode`, trattalo come danno alla configurazione o come modifica manuale incompleta, non come scorciatoia valida per la modalità locale.
- `--allow-unconfigured` è una misura di emergenza separata per il runtime del Gateway. Non significa che l'onboarding possa omettere `gateway.mode`.

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

Stato del Gateway locale in modalità non interattiva:

- A meno che tu non passi `--skip-health`, l'onboarding attende un Gateway locale raggiungibile prima di terminare con successo.
- `--install-daemon` avvia prima il percorso di installazione gestito del Gateway. Senza questo flag, devi avere già un Gateway locale in esecuzione, ad esempio `openclaw gateway run`.
- Se in automazione vuoi solo scritture di configurazione/spazio di lavoro/bootstrap, usa `--skip-health`.
- Su Windows nativo, `--install-daemon` prova prima con Scheduled Tasks e ripiega su un elemento di avvio al login nella cartella Startup per utente se la creazione del task viene negata.

Comportamento dell'onboarding interattivo con modalità riferimento:

- Scegli **Use secret reference** quando richiesto.
- Poi scegli una delle due opzioni:
  - Variabile d'ambiente
  - Provider di segreti configurato (`file` o `exec`)
- L'onboarding esegue una rapida convalida preliminare prima di salvare il ref.
  - Se la convalida fallisce, l'onboarding mostra l'errore e ti consente di riprovare.

Scelte dell'endpoint Z.AI in modalità non interattiva:

Nota: `--auth-choice zai-api-key` ora rileva automaticamente il miglior endpoint Z.AI per la tua chiave (preferisce l'API generale con `zai/glm-5.1`).
Se vuoi specificamente gli endpoint GLM Coding Plan, scegli `zai-coding-global` o `zai-coding-cn`.

```bash
# Selezione dell'endpoint senza prompt
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

- `quickstart`: prompt minimi, genera automaticamente un token del Gateway.
- `manual`: prompt completi per porta/bind/auth (alias di `advanced`).
- Quando una scelta di autenticazione implica un provider preferito, l'onboarding prefiltra i selettori del modello predefinito e della allowlist a quel provider. Per Volcengine e BytePlus, questo corrisponde anche alle varianti coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).
- Se il filtro del provider preferito non produce ancora modelli caricati, l'onboarding torna al catalogo non filtrato invece di lasciare il selettore vuoto.
- Nella fase di ricerca web, alcuni provider possono attivare prompt di follow-up specifici del provider:
  - **Grok** può offrire una configurazione facoltativa `x_search` con la stessa `XAI_API_KEY` e una scelta del modello `x_search`.
  - **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e il modello di ricerca web Kimi predefinito.
- Comportamento dell'ambito DM dell'onboarding locale: [CLI Setup Reference](/it/start/wizard-cli-reference#outputs-and-internals).
- Chat più rapida per iniziare: `openclaw dashboard` (interfaccia Control, nessuna configurazione del canale).
- Provider personalizzato: collega qualsiasi endpoint compatibile OpenAI o Anthropic, inclusi provider ospitati non elencati. Usa Unknown per il rilevamento automatico.

## Comandi di follow-up comuni

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` per gli script.
</Note>
