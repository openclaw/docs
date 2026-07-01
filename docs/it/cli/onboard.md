---
read_when:
    - Vuoi una configurazione guidata per gateway, workspace, auth, canali e skills
summary: Riferimento CLI per `openclaw onboard` (onboarding interattivo)
title: Onboarding
x-i18n:
    generated_at: "2026-07-01T13:05:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding guidato completo per la configurazione del Gateway locale o remoto. Usalo quando vuoi che OpenClaw guidi in un unico flusso l’autenticazione del modello, il workspace, il gateway, i canali, le Skills e lo stato di salute.

## Guide correlate

<CardGroup cols={2}>
  <Card title="Hub di onboarding CLI" href="/it/start/wizard" icon="rocket">
    Procedura guidata del flusso CLI interattivo.
  </Card>
  <Card title="Panoramica dell’onboarding" href="/it/start/onboarding-overview" icon="map">
    Come si integra l’onboarding di OpenClaw.
  </Card>
  <Card title="Riferimento configurazione CLI" href="/it/start/wizard-cli-reference" icon="book">
    Output, componenti interni e comportamento per ogni passaggio.
  </Card>
  <Card title="Automazione CLI" href="/it/start/wizard-cli-automation" icon="terminal">
    Flag non interattivi e configurazioni tramite script.
  </Card>
  <Card title="Onboarding app macOS" href="/it/start/onboarding" icon="apple">
    Flusso di onboarding per l’app della barra dei menu macOS.
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

`--flow import` usa provider di migrazione di proprietà del plugin, come Hermes. Viene eseguito solo su una configurazione OpenClaw nuova; se sono presenti config, credenziali, sessioni o file di memoria/identità del workspace esistenti, reimposta o scegli una configurazione nuova prima di importare.

`--modern` avvia l’anteprima di onboarding conversazionale Crestodian. Senza
`--modern`, `openclaw onboard` mantiene il flusso di onboarding classico.

In una nuova installazione in cui il file di configurazione attivo manca o non contiene
impostazioni create dall’utente (vuoto o solo metadati), anche `openclaw` senza argomenti avvia il flusso di
onboarding classico. Dopo che un file di configurazione contiene impostazioni create dall’utente, `openclaw`
senza argomenti apre invece Crestodian.

`ws://` in chiaro è accettato per local loopback, literal IP privati, `.local` e
URL Gateway Tailnet `*.ts.net`. Per altri nomi DNS privati attendibili, imposta
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nell’ambiente del processo di onboarding.

## Locale

L’onboarding interattivo usa la locale della procedura guidata CLI per il testo fisso di configurazione. L’ordine di risoluzione
è:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Fallback all’inglese

Le locale supportate dalla procedura guidata sono `en`, `zh-CN` e `zh-TW`. I valori della locale possono usare
forme con underscore o suffissi POSIX, come `zh_CN.UTF-8`. Nomi di prodotto, nomi di comando,
chiavi di configurazione, URL, ID provider, ID modello ed etichette di plugin/canale
rimangono letterali.

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

`--custom-api-key` è opzionale in modalità non interattiva. Se omesso, l’onboarding controlla `CUSTOM_API_KEY`.
OpenClaw contrassegna automaticamente come compatibili con le immagini gli ID modello di visione più comuni. Passa `--custom-image-input` per ID di visione personalizzati sconosciuti, oppure `--custom-text-input` per forzare metadati solo testo.
Usa `--custom-compatibility openai-responses` per endpoint compatibili con OpenAI che supportano `/v1/responses` ma non `/v1/chat/completions`.

LM Studio supporta anche un flag di chiave specifico del provider in modalità non interattiva:

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

`--custom-base-url` usa come predefinito `http://127.0.0.1:11434`. `--custom-model-id` è opzionale; se omesso, l’onboarding usa i valori predefiniti suggeriti da Ollama. Anche gli ID modello cloud come `kimi-k2.5:cloud` funzionano qui.

Archivia le chiavi provider come riferimenti invece che come testo in chiaro:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, l’onboarding scrive riferimenti basati su env invece di valori chiave in chiaro.
Per i provider basati su profilo di autenticazione, questo scrive voci `keyRef`; per i provider personalizzati scrive `models.providers.<id>.apiKey` come riferimento env (per esempio `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contratto della modalità non interattiva `ref`:

- Imposta la variabile env del provider nell’ambiente del processo di onboarding (per esempio `OPENAI_API_KEY`).
- Non passare flag di chiave inline (per esempio `--openai-api-key`) a meno che anche quella variabile env non sia impostata.
- Se viene passato un flag di chiave inline senza la variabile env richiesta, l’onboarding fallisce subito con indicazioni.

Opzioni token Gateway in modalità non interattiva:

- `--gateway-auth token --gateway-token <token>` archivia un token in chiaro.
- `--gateway-auth token --gateway-token-ref-env <name>` archivia `gateway.auth.token` come SecretRef env.
- `--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.
- `--gateway-token-ref-env` richiede una variabile env non vuota nell’ambiente del processo di onboarding.
- Con `--install-daemon`, quando l’autenticazione token richiede un token, i token Gateway gestiti tramite SecretRef vengono convalidati ma non persistiti come testo in chiaro risolto nei metadati dell’ambiente del servizio supervisor.
- Con `--install-daemon`, se la modalità token richiede un token e il SecretRef del token configurato non viene risolto, l’onboarding fallisce in modo chiuso con indicazioni di correzione.
- Con `--install-daemon`, se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l’onboarding blocca l’installazione finché la modalità non viene impostata esplicitamente.
- L’onboarding locale scrive `gateway.mode="local"` nella configurazione. Se un file di configurazione successivo non contiene `gateway.mode`, considera questo come una configurazione danneggiata o una modifica manuale incompleta, non come una scorciatoia valida per la modalità locale.
- L’onboarding locale installa i plugin scaricabili selezionati quando il percorso di configurazione scelto li richiede.
- L’onboarding remoto scrive solo le informazioni di connessione per il Gateway remoto e non installa pacchetti plugin locali.
- `--allow-unconfigured` è una via di fuga separata per il runtime Gateway. Non significa che l’onboarding possa omettere `gateway.mode`.

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

Stato di salute del gateway locale non interattivo:

- A meno che tu non passi `--skip-health`, l’onboarding attende un gateway locale raggiungibile prima di uscire con successo.
- `--install-daemon` avvia prima il percorso di installazione del gateway gestito. Senza di esso, devi già avere un gateway locale in esecuzione, per esempio `openclaw gateway run`.
- Se in automazione vuoi solo scritture di config/workspace/bootstrap, usa `--skip-health`.
- Se gestisci autonomamente i file del workspace, passa `--skip-bootstrap` per impostare `agents.defaults.skipBootstrap: true` e saltare la creazione di `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Su Windows nativo, `--install-daemon` prova prima le Attività pianificate e, se la creazione dell’attività viene negata, ripiega su un elemento di login nella cartella Esecuzione automatica per utente.

Comportamento dell’onboarding interattivo con modalità riferimento:

- Scegli **Usa riferimento segreto** quando richiesto.
- Poi scegli una delle due opzioni:
  - Variabile di ambiente
  - Provider di segreti configurato (`file` o `exec`)
- L’onboarding esegue una rapida convalida preliminare prima di salvare il riferimento.
  - Se la convalida fallisce, l’onboarding mostra l’errore e ti permette di riprovare.

### Scelte endpoint Z.AI non interattive

<Note>
`--auth-choice zai-api-key` rileva automaticamente l’endpoint e il modello Z.AI migliori per
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

## Flag non interattivi aggiuntivi

Autenticazione modello basata su token (non interattiva; usata con `--auth-choice token`):

- `--token-provider <id>` — ID provider del token. Identifica quale provider emette il token.
- `--token <token>` — Valore del token per l’autenticazione del modello.
- `--token-profile-id <id>` — ID profilo di autenticazione. L’archiviazione generica dei token usa come predefinito `<provider>:manual`; i flussi di configurazione di proprietà del provider possono usare il proprio valore predefinito, come `anthropic:default`.
- `--token-expires-in <duration>` — Durata opzionale della scadenza del token (per esempio `365d`, `12h`).

Cloudflare AI Gateway (non interattivo):

- `--cloudflare-ai-gateway-account-id <id>` — ID account Cloudflare per il routing tramite Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — ID Cloudflare AI Gateway.

Controllo installazione daemon:

- `--no-install-daemon` — Salta esplicitamente l’installazione del servizio gateway.
- `--skip-daemon` — Alias di `--no-install-daemon`.

Controllo configurazione UI e hook:

- `--skip-ui` — Salta le richieste Control UI / TUI durante l’onboarding.
- `--skip-hooks` — Salta le richieste di configurazione webhook / hook durante l’onboarding.

Soppressione output:

- `--suppress-gateway-token-output` — Sopprime l’output Gateway/UI contenente token (suggerimenti token, URL di accesso automatico con token incorporato e avvio automatico della Control UI). Utile in ambienti terminale condivisi e CI.

## Note sul flusso

<AccordionGroup>
  <Accordion title="Tipi di flusso">
    - `quickstart`: richieste minime, genera automaticamente un token gateway.
    - `manual`: richieste complete per porta, bind e autenticazione (alias di `advanced`).
    - `import`: esegue un provider di migrazione rilevato, mostra l’anteprima del piano, poi applica dopo la conferma.

  </Accordion>
  <Accordion title="Prefiltraggio provider">
    Quando una scelta di autenticazione implica un provider preferito, l’onboarding prefiltra i selettori del modello predefinito e dell’allowlist su quel provider. Per Volcengine e BytePlus, questo corrisponde anche alle varianti coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Se il filtro del provider preferito non produce ancora modelli caricati, l’onboarding ripiega sul catalogo non filtrato invece di lasciare il selettore vuoto.

  </Accordion>
  <Accordion title="Follow-up ricerca web">
    Alcuni provider di ricerca web attivano richieste di follow-up specifiche del provider:

    - **Grok** può offrire una configurazione opzionale `x_search` con lo stesso profilo OAuth xAI o la stessa chiave API e una scelta di modello `x_search`.
    - **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` rispetto a `api.moonshot.cn`) e il modello di ricerca web Kimi predefinito.

  </Accordion>
  <Accordion title="Altri comportamenti">
    - Comportamento dell’ambito DM dell’onboarding locale: [Riferimento configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals).
    - Prima chat più rapida: `openclaw dashboard` (Control UI, nessuna configurazione canale).
    - Provider personalizzato: connetti qualsiasi endpoint compatibile con OpenAI o Anthropic, inclusi provider ospitati non elencati. Usa Unknown per rilevare automaticamente.
    - Se viene rilevato uno stato Hermes, l’onboarding offre un flusso di migrazione. Usa [Migra](/it/cli/migrate) per piani dry-run, modalità sovrascrittura, report e mappature esatte.

  </Accordion>
</AccordionGroup>

## Comandi comuni di follow-up

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Usa `openclaw setup` come lo stesso punto di ingresso dell’onboarding guidato. Usa `openclaw setup --baseline` quando ti serve solo la configurazione/workspace di base, `openclaw configure` in seguito per modifiche mirate e `openclaw channels add` per la configurazione solo dei canali.

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` per gli script.
</Note>
