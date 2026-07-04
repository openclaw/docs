---
read_when:
    - Vuoi una configurazione guidata per Gateway, workspace, autenticazione, canali e Skills
summary: Riferimento CLI per `openclaw onboard` (onboarding interattivo)
title: Onboarding
x-i18n:
    generated_at: "2026-07-04T20:33:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding guidato completo per configurare un Gateway locale o remoto. Usalo quando vuoi che OpenClaw ti guidi attraverso autenticazione del modello, area di lavoro, gateway, canali, Skills e stato di salute in un unico flusso.

## Guide correlate

<CardGroup cols={2}>
  <Card title="Hub di onboarding CLI" href="/it/start/wizard" icon="rocket">
    Guida dettagliata al flusso CLI interattivo.
  </Card>
  <Card title="Panoramica dell’onboarding" href="/it/start/onboarding-overview" icon="map">
    Come si integra l’onboarding di OpenClaw.
  </Card>
  <Card title="Riferimento per la configurazione CLI" href="/it/start/wizard-cli-reference" icon="book">
    Output, dettagli interni e comportamento per passaggio.
  </Card>
  <Card title="Automazione CLI" href="/it/start/wizard-cli-automation" icon="terminal">
    Flag non interattivi e configurazioni tramite script.
  </Card>
  <Card title="Onboarding dell’app macOS" href="/it/start/onboarding" icon="apple">
    Flusso di onboarding per l’app della barra dei menu di macOS.
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

`--flow import` usa provider di migrazione di proprietà del plugin, come Hermes. Viene eseguito solo su una nuova configurazione OpenClaw; se sono presenti configurazioni, credenziali, sessioni o file di memoria/identità dell’area di lavoro esistenti, reimposta o scegli una configurazione nuova prima di importare.

`--modern` avvia l’anteprima dell’onboarding conversazionale Crestodian. Senza
`--modern`, `openclaw onboard` mantiene il flusso di onboarding classico.

In un terminale interattivo, `openclaw` semplice (senza sottocomando) instrada in base allo stato della configurazione:

- Se il file di configurazione attivo manca o non contiene impostazioni create dall’utente (vuoto o solo metadati), avvia questo flusso di onboarding classico.
- Se il file di configurazione esiste ma non supera la validazione, avvia
  [Crestodian](/it/cli/crestodian) per la riparazione.
- Se il file di configurazione è valido, apre la normale TUI dell’agente, localmente oppure connessa a un Gateway configurato raggiungibile. Su un’installazione configurata, raggiungi Crestodian con `/crestodian` dentro la TUI o `openclaw crestodian`.

`ws://` in testo semplice è accettato per loopback, letterali IP privati, `.local` e
URL Gateway Tailnet `*.ts.net`. Per altri nomi DNS privati attendibili, imposta
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nell’ambiente del processo di onboarding.

## Locale

L’onboarding interattivo usa la lingua della procedura guidata CLI per il testo fisso di configurazione. L’ordine di risoluzione è:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. fallback inglese

Le lingue supportate dalla procedura guidata sono `en`, `zh-CN` e `zh-TW`. I valori di locale possono usare forme con trattino basso o suffisso POSIX, come `zh_CN.UTF-8`. Nomi di prodotto, nomi di comandi, chiavi di configurazione, URL, ID provider, ID modello ed etichette di plugin/canale restano letterali.

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

`--custom-api-key` è facoltativo in modalità non interattiva. Se omesso, l’onboarding controlla `CUSTOM_API_KEY`.
OpenClaw contrassegna automaticamente gli ID comuni dei modelli vision come compatibili con immagini. Passa `--custom-image-input` per ID vision personalizzati sconosciuti oppure `--custom-text-input` per forzare metadati solo testo.
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

`--custom-base-url` usa come predefinito `http://127.0.0.1:11434`. `--custom-model-id` è facoltativo; se omesso, l’onboarding usa i valori predefiniti suggeriti da Ollama. Anche gli ID modello cloud come `kimi-k2.5:cloud` funzionano qui.

Archivia le chiavi provider come riferimenti invece che come testo semplice:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, l’onboarding scrive riferimenti basati su variabili d’ambiente invece di valori chiave in testo semplice.
Per i provider basati su profili di autenticazione, questo scrive voci `keyRef`; per i provider personalizzati, scrive `models.providers.<id>.apiKey` come riferimento env (per esempio `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contratto della modalità non interattiva `ref`:

- Imposta la variabile d’ambiente del provider nell’ambiente del processo di onboarding (per esempio `OPENAI_API_KEY`).
- Non passare flag chiave inline (per esempio `--openai-api-key`) a meno che anche quella variabile d’ambiente non sia impostata.
- Se viene passato un flag chiave inline senza la variabile d’ambiente richiesta, l’onboarding fallisce subito con indicazioni.

Opzioni token Gateway in modalità non interattiva:

- `--gateway-auth token --gateway-token <token>` archivia un token in testo semplice.
- `--gateway-auth token --gateway-token-ref-env <name>` archivia `gateway.auth.token` come SecretRef env.
- `--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.
- `--gateway-token-ref-env` richiede una variabile d’ambiente non vuota nell’ambiente del processo di onboarding.
- Con `--install-daemon`, quando l’autenticazione token richiede un token, i token Gateway gestiti da SecretRef vengono validati ma non persistiti come testo semplice risolto nei metadati dell’ambiente del servizio supervisor.
- Con `--install-daemon`, se la modalità token richiede un token e il SecretRef del token configurato non è risolto, l’onboarding fallisce in modo chiuso con indicazioni di correzione.
- Con `--install-daemon`, se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l’onboarding blocca l’installazione finché la modalità non viene impostata esplicitamente.
- L’onboarding locale scrive `gateway.mode="local"` nella configurazione. Se un file di configurazione successivo non contiene `gateway.mode`, trattalo come configurazione danneggiata o modifica manuale incompleta, non come scorciatoia valida per la modalità locale.
- L’onboarding locale installa i plugin scaricabili selezionati quando il percorso di configurazione scelto li richiede.
- L’onboarding remoto scrive solo le informazioni di connessione per il Gateway remoto e non installa pacchetti plugin locali.
- `--allow-unconfigured` è una via di uscita separata per il runtime del gateway. Non significa che l’onboarding possa omettere `gateway.mode`.

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

Salute del gateway locale non interattivo:

- A meno che tu non passi `--skip-health`, l’onboarding attende un gateway locale raggiungibile prima di uscire con successo.
- `--install-daemon` avvia prima il percorso di installazione del gateway gestito. Senza di esso, devi già avere un gateway locale in esecuzione, per esempio `openclaw gateway run`.
- Se in automazione vuoi solo scrivere configurazione/area di lavoro/bootstrap, usa `--skip-health`.
- Se gestisci autonomamente i file dell’area di lavoro, passa `--skip-bootstrap` per impostare `agents.defaults.skipBootstrap: true` e saltare la creazione di `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Su Windows nativo, `--install-daemon` prova prima le Attività pianificate e ripiega su un elemento di accesso nella cartella Avvio per utente se la creazione dell’attività viene negata.

Comportamento dell’onboarding interattivo con modalità riferimento:

- Scegli **Usa riferimento segreto** quando richiesto.
- Poi scegli uno dei seguenti:
  - Variabile d’ambiente
  - Provider segreto configurato (`file` o `exec`)
- L’onboarding esegue una rapida validazione preflight prima di salvare il riferimento.
  - Se la validazione fallisce, l’onboarding mostra l’errore e ti consente di riprovare.

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

## Flag non interattivi aggiuntivi

Autenticazione modello basata su token (non interattiva; usata con `--auth-choice token`):

- `--token-provider <id>` — ID provider token. Identifica quale provider emette il token.
- `--token <token>` — Valore del token per l’autenticazione del modello.
- `--token-profile-id <id>` — ID profilo di autenticazione. L’archiviazione generica dei token usa come predefinito `<provider>:manual`; i flussi di configurazione di proprietà del provider possono usare il proprio valore predefinito, come `anthropic:default`.
- `--token-expires-in <duration>` — Durata facoltativa della scadenza del token (per esempio `365d`, `12h`).

Cloudflare AI Gateway (non interattivo):

- `--cloudflare-ai-gateway-account-id <id>` — ID account Cloudflare per l’instradamento tramite Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — ID Cloudflare AI Gateway.

Controllo dell’installazione daemon:

- `--no-install-daemon` — Salta esplicitamente l’installazione del servizio gateway.
- `--skip-daemon` — Alias per `--no-install-daemon`.

Controllo della configurazione UI e hook:

- `--skip-ui` — Salta le richieste Control UI / TUI durante l’onboarding.
- `--skip-hooks` — Salta le richieste di configurazione webhook / hook durante l’onboarding.

Soppressione dell’output:

- `--suppress-gateway-token-output` — Sopprime l’output Gateway/UI che contiene token (suggerimenti token, URL di accesso automatico con token incorporato e avvio automatico della Control UI). Utile in ambienti terminale condivisi e CI.

## Note sui flussi

<AccordionGroup>
  <Accordion title="Tipi di flusso">
    - `quickstart`: richieste minime, genera automaticamente un token gateway.
    - `manual`: richieste complete per porta, bind e autenticazione (alias di `advanced`).
    - `import`: esegue un provider di migrazione rilevato, mostra un’anteprima del piano, poi applica dopo conferma.

  </Accordion>
  <Accordion title="Prefiltro dei provider">
    Quando una scelta di autenticazione implica un provider preferito, l’onboarding prefiltra i selettori del modello predefinito e dell’allowlist su quel provider. Per Volcengine e BytePlus, questo corrisponde anche alle varianti coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Se il filtro del provider preferito non produce ancora modelli caricati, l’onboarding ripiega sul catalogo non filtrato invece di lasciare il selettore vuoto.

  </Accordion>
  <Accordion title="Follow-up della ricerca web">
    Alcuni provider di ricerca web attivano richieste di follow-up specifiche del provider:

    - **Grok** può offrire una configurazione facoltativa di `x_search` con lo stesso profilo OAuth xAI o chiave API e una scelta di modello `x_search`.
    - **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e il modello predefinito Kimi per la ricerca web.

  </Accordion>
  <Accordion title="Altri comportamenti">
    - Comportamento dell’ambito DM dell’onboarding locale: [Riferimento per la configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals).
    - Prima chat più rapida: `openclaw dashboard` (Control UI, nessuna configurazione canale).
    - Provider personalizzato: connetti qualsiasi endpoint compatibile con OpenAI o Anthropic, inclusi provider ospitati non elencati. Usa Unknown per il rilevamento automatico.
    - Se viene rilevato lo stato Hermes, l’onboarding offre un flusso di migrazione. Usa [Migra](/it/cli/migrate) per piani dry-run, modalità sovrascrittura, report e mappature esatte.

  </Accordion>
</AccordionGroup>

## Comandi di follow-up comuni

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Usa `openclaw setup` come lo stesso punto di ingresso guidato per l'onboarding. Usa `openclaw setup --baseline` quando ti serve solo la configurazione/area di lavoro di base, `openclaw configure` in seguito per modifiche mirate e `openclaw channels add` per la configurazione solo dei canali.

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` per gli script.
</Note>
