---
read_when:
    - Vuoi una configurazione guidata per Gateway, area di lavoro, autenticazione, canali e Skills
summary: Riferimento CLI per `openclaw onboard` (onboarding interattivo)
title: Configurazione iniziale
x-i18n:
    generated_at: "2026-06-27T17:20:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding guidato completo per la configurazione di Gateway locale o remoto. Usalo quando vuoi che OpenClaw ti guidi attraverso autenticazione del modello, workspace, Gateway, canali, Skills e stato di salute in un unico flusso.

## Guide correlate

<CardGroup cols={2}>
  <Card title="Hub di onboarding CLI" href="/it/start/wizard" icon="rocket">
    Guida dettagliata del flusso CLI interattivo.
  </Card>
  <Card title="Panoramica dell'onboarding" href="/it/start/onboarding-overview" icon="map">
    Come si integra l'onboarding di OpenClaw.
  </Card>
  <Card title="Riferimento setup CLI" href="/it/start/wizard-cli-reference" icon="book">
    Output, dettagli interni e comportamento per ogni passaggio.
  </Card>
  <Card title="Automazione CLI" href="/it/start/wizard-cli-automation" icon="terminal">
    Flag non interattivi e setup tramite script.
  </Card>
  <Card title="Onboarding dell'app macOS" href="/it/start/onboarding" icon="apple">
    Flusso di onboarding per l'app della barra dei menu macOS.
  </Card>
</CardGroup>

## Esempi

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` usa provider di migrazione di proprietà dei plugin, come Hermes. Viene eseguito solo su una configurazione OpenClaw nuova; se sono presenti configurazione, credenziali, sessioni o file di memoria/identità del workspace esistenti, reimposta o scegli una configurazione nuova prima di importare.

`--modern` avvia l'anteprima dell'onboarding conversazionale Crestodian. Senza
`--modern`, `openclaw onboard` mantiene il flusso di onboarding classico.

Su una nuova installazione in cui il file di configurazione attivo manca o non contiene impostazioni
create dall'utente (vuoto o solo metadati), anche il semplice `openclaw` avvia il flusso di onboarding
classico. Dopo che un file di configurazione contiene impostazioni create dall'utente, il semplice `openclaw`
apre invece Crestodian.

Il plaintext `ws://` è accettato per local loopback, literal IP privati, `.local` e
URL Gateway Tailnet `*.ts.net`. Per altri nomi DNS privati attendibili, imposta
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nell'ambiente del processo di onboarding.

## Locale

L'onboarding interattivo usa la locale della procedura guidata CLI per il testo fisso di setup. L'ordine
di risoluzione è:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Fallback inglese

Le locale supportate dalla procedura guidata sono `en`, `zh-CN` e `zh-TW`. I valori di locale possono usare
forme con underscore o suffisso POSIX come `zh_CN.UTF-8`. Nomi di prodotto, nomi di comando,
chiavi di configurazione, URL, ID provider, ID modello ed etichette di plugin/canale
restano letterali.

Esempio:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Provider personalizzato non interattivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` è opzionale in modalità non interattiva. Se omesso, l'onboarding controlla `CUSTOM_API_KEY`.
OpenClaw contrassegna automaticamente gli ID dei modelli vision comuni come capaci di gestire immagini. Passa `--custom-image-input` per ID vision personalizzati sconosciuti, oppure `--custom-text-input` per forzare metadati solo testo.
Usa `--custom-compatibility openai-responses` per endpoint compatibili con OpenAI che supportano `/v1/responses` ma non `/v1/chat/completions`.

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

`--custom-base-url` ha come predefinito `http://127.0.0.1:11434`. `--custom-model-id` è opzionale; se omesso, l'onboarding usa i valori predefiniti suggeriti da Ollama. Anche gli ID dei modelli cloud come `kimi-k2.5:cloud` funzionano qui.

Archivia le chiavi provider come riferimenti anziché come plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, l'onboarding scrive riferimenti basati su env anziché valori chiave in plaintext.
Per i provider basati su profilo di autenticazione, questo scrive voci `keyRef`; per i provider personalizzati, scrive `models.providers.<id>.apiKey` come riferimento env (per esempio `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contratto della modalità non interattiva `ref`:

- Imposta la variabile env del provider nell'ambiente del processo di onboarding (per esempio `OPENAI_API_KEY`).
- Non passare flag chiave inline (per esempio `--openai-api-key`) a meno che anche quella variabile env sia impostata.
- Se viene passato un flag chiave inline senza la variabile env richiesta, l'onboarding fallisce subito con istruzioni.

Opzioni token Gateway in modalità non interattiva:

- `--gateway-auth token --gateway-token <token>` archivia un token in plaintext.
- `--gateway-auth token --gateway-token-ref-env <name>` archivia `gateway.auth.token` come SecretRef env.
- `--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.
- `--gateway-token-ref-env` richiede una variabile env non vuota nell'ambiente del processo di onboarding.
- Con `--install-daemon`, quando l'autenticazione tramite token richiede un token, i token Gateway gestiti da SecretRef vengono convalidati ma non persistiti come plaintext risolto nei metadati dell'ambiente del servizio supervisor.
- Con `--install-daemon`, se la modalità token richiede un token e il SecretRef del token configurato non è risolto, l'onboarding fallisce in modo chiuso con istruzioni di remediation.
- Con `--install-daemon`, se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'onboarding blocca l'installazione finché la modalità non viene impostata esplicitamente.
- L'onboarding locale scrive `gateway.mode="local"` nella configurazione. Se in seguito in un file di configurazione manca `gateway.mode`, trattalo come configurazione danneggiata o modifica manuale incompleta, non come una scorciatoia valida per la modalità locale.
- L'onboarding locale installa i plugin scaricabili selezionati quando il percorso di setup scelto li richiede.
- L'onboarding remoto scrive solo le informazioni di connessione per il Gateway remoto e non installa pacchetti plugin locali.
- `--allow-unconfigured` è una via di uscita separata del runtime Gateway. Non significa che l'onboarding possa omettere `gateway.mode`.

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

Stato di salute del Gateway locale non interattivo:

- A meno che tu non passi `--skip-health`, l'onboarding attende che un Gateway locale sia raggiungibile prima di uscire con successo.
- `--install-daemon` avvia prima il percorso di installazione del Gateway gestito. Senza, devi già avere un Gateway locale in esecuzione, per esempio `openclaw gateway run`.
- Se in automazione vuoi solo scrivere configurazione/workspace/bootstrap, usa `--skip-health`.
- Se gestisci autonomamente i file del workspace, passa `--skip-bootstrap` per impostare `agents.defaults.skipBootstrap: true` e saltare la creazione di `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Su Windows nativo, `--install-daemon` prova prima le Attività pianificate e ripiega su un elemento di accesso nella cartella Startup per utente se la creazione dell'attività viene negata.

Comportamento dell'onboarding interattivo con modalità riferimento:

- Scegli **Usa riferimento segreto** quando richiesto.
- Poi scegli una delle opzioni:
  - Variabile di ambiente
  - Provider di segreti configurato (`file` o `exec`)
- L'onboarding esegue una rapida convalida preliminare prima di salvare il riferimento.
  - Se la convalida fallisce, l'onboarding mostra l'errore e ti permette di riprovare.

### Scelte endpoint Z.AI non interattive

<Note>
`--auth-choice zai-api-key` rileva automaticamente il miglior endpoint e modello Z.AI per
la tua chiave. Gli endpoint Coding Plan preferiscono `zai/glm-5.2`; gli endpoint API generali usano
`zai/glm-5.1`. Per forzare un endpoint Coding Plan, scegli `zai-coding-global` o
`zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
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

## Note sul flusso

<AccordionGroup>
  <Accordion title="Tipi di flusso">
    - `quickstart`: prompt minimi, genera automaticamente un token Gateway.
    - `manual`: prompt completi per porta, bind e autenticazione (alias di `advanced`).
    - `import`: esegue un provider di migrazione rilevato, mostra un'anteprima del piano, poi applica dopo conferma.

  </Accordion>
  <Accordion title="Prefiltro dei provider">
    Quando una scelta di autenticazione implica un provider preferito, l'onboarding prefiltra i selettori del modello predefinito e della allowlist su quel provider. Per Volcengine e BytePlus, questo corrisponde anche alle varianti coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Se il filtro del provider preferito non produce ancora modelli caricati, l'onboarding ripiega sul catalogo non filtrato invece di lasciare vuoto il selettore.

  </Accordion>
  <Accordion title="Follow-up per la ricerca web">
    Alcuni provider di ricerca web attivano prompt di follow-up specifici del provider:

    - **Grok** può offrire il setup opzionale `x_search` con lo stesso profilo OAuth xAI o la stessa chiave API e una scelta di modello `x_search`.
    - **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` rispetto a `api.moonshot.cn`) e il modello di ricerca web Kimi predefinito.

  </Accordion>
  <Accordion title="Altri comportamenti">
    - Comportamento dell'ambito DM dell'onboarding locale: [Riferimento setup CLI](/it/start/wizard-cli-reference#outputs-and-internals).
    - Prima chat più rapida: `openclaw dashboard` (Control UI, nessun setup canale).
    - Provider personalizzato: collega qualsiasi endpoint compatibile con OpenAI o Anthropic, inclusi provider hosted non elencati. Usa Unknown per il rilevamento automatico.
    - Se viene rilevato lo stato Hermes, l'onboarding offre un flusso di migrazione. Usa [Migra](/it/cli/migrate) per piani dry-run, modalità overwrite, report e mapping esatti.

  </Accordion>
</AccordionGroup>

## Comandi comuni di follow-up

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Usa invece `openclaw setup` quando ti serve solo la configurazione/workspace di base. Usa `openclaw configure` più tardi per modifiche mirate e `openclaw channels add` per il setup solo canale.

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` per gli script.
</Note>
