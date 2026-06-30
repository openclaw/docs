---
read_when:
    - Vuoi una configurazione guidata per gateway, workspace, autenticazione, canali e skills
summary: Riferimento CLI per `openclaw onboard` (configurazione guidata interattiva)
title: Configurazione iniziale
x-i18n:
    generated_at: "2026-06-30T22:18:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding guidato completo per la configurazione locale o remota del Gateway. Usalo quando vuoi che OpenClaw guidi in un unico flusso l'autenticazione del modello, lo spazio di lavoro, il gateway, i canali, le Skills e lo stato di salute.

## Guide correlate

<CardGroup cols={2}>
  <Card title="Hub di onboarding CLI" href="/it/start/wizard" icon="rocket">
    Procedura guidata del flusso CLI interattivo.
  </Card>
  <Card title="Panoramica dell'onboarding" href="/it/start/onboarding-overview" icon="map">
    Come si integra l'onboarding di OpenClaw.
  </Card>
  <Card title="Riferimento per la configurazione CLI" href="/it/start/wizard-cli-reference" icon="book">
    Output, elementi interni e comportamento per passaggio.
  </Card>
  <Card title="Automazione CLI" href="/it/start/wizard-cli-automation" icon="terminal">
    Flag non interattivi e configurazioni tramite script.
  </Card>
  <Card title="Onboarding dell'app macOS" href="/it/start/onboarding" icon="apple">
    Flusso di onboarding per l'app della barra dei menu di macOS.
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

`--flow import` usa provider di migrazione gestiti dal Plugin, come Hermes. Viene eseguito solo su una configurazione OpenClaw nuova; se sono presenti configurazioni, credenziali, sessioni o file di memoria/identità dello spazio di lavoro esistenti, reimposta o scegli una configurazione nuova prima dell'importazione.

`--modern` avvia l'anteprima dell'onboarding conversazionale Crestodian. Senza
`--modern`, `openclaw onboard` mantiene il flusso di onboarding classico.

In una nuova installazione in cui il file di configurazione attivo manca o non contiene impostazioni create
(vuoto o solo con metadati), anche `openclaw` senza argomenti avvia il flusso di onboarding
classico. Quando un file di configurazione contiene impostazioni create, `openclaw` senza argomenti
apre invece Crestodian.

`ws://` in chiaro è accettato per local loopback, valori letterali IP privati, `.local` e
URL Gateway Tailnet `*.ts.net`. Per altri nomi DNS privati attendibili, imposta
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nell'ambiente del processo di onboarding.

## Localizzazione

L'onboarding interattivo usa la localizzazione della procedura guidata CLI per il testo fisso di configurazione. L'ordine di risoluzione è:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. fallback inglese

Le localizzazioni supportate dalla procedura guidata sono `en`, `zh-CN` e `zh-TW`. I valori di localizzazione possono usare
forme con underscore o suffisso POSIX come `zh_CN.UTF-8`. Nomi di prodotto, nomi di comando,
chiavi di configurazione, URL, ID provider, ID modello ed etichette plugin/canale
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

`--custom-api-key` è facoltativo in modalità non interattiva. Se omesso, l'onboarding controlla `CUSTOM_API_KEY`.
OpenClaw contrassegna automaticamente come compatibili con immagini gli ID dei modelli visivi comuni. Passa `--custom-image-input` per ID di modelli visivi personalizzati sconosciuti, oppure `--custom-text-input` per forzare metadati solo testo.
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

`--custom-base-url` usa come valore predefinito `http://127.0.0.1:11434`. `--custom-model-id` è facoltativo; se omesso, l'onboarding usa i valori predefiniti suggeriti da Ollama. Anche gli ID di modelli cloud come `kimi-k2.5:cloud` funzionano qui.

Archivia le chiavi del provider come riferimenti anziché in chiaro:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, l'onboarding scrive riferimenti basati su env anziché valori chiave in chiaro.
Per i provider basati su profilo di autenticazione, questo scrive voci `keyRef`; per i provider personalizzati, scrive `models.providers.<id>.apiKey` come riferimento env (per esempio `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contratto della modalità non interattiva `ref`:

- Imposta la variabile env del provider nell'ambiente del processo di onboarding (per esempio `OPENAI_API_KEY`).
- Non passare flag chiave inline (per esempio `--openai-api-key`) a meno che anche quella variabile env non sia impostata.
- Se viene passato un flag chiave inline senza la variabile env richiesta, l'onboarding fallisce rapidamente con indicazioni.

Opzioni del token Gateway in modalità non interattiva:

- `--gateway-auth token --gateway-token <token>` archivia un token in chiaro.
- `--gateway-auth token --gateway-token-ref-env <name>` archivia `gateway.auth.token` come SecretRef env.
- `--gateway-token` e `--gateway-token-ref-env` sono mutuamente esclusivi.
- `--gateway-token-ref-env` richiede una variabile env non vuota nell'ambiente del processo di onboarding.
- Con `--install-daemon`, quando l'autenticazione tramite token richiede un token, i token gateway gestiti da SecretRef vengono convalidati ma non persistiti come testo in chiaro risolto nei metadati dell'ambiente del servizio supervisor.
- Con `--install-daemon`, se la modalità token richiede un token e il SecretRef del token configurato non è risolto, l'onboarding fallisce in modo chiuso con indicazioni per la correzione.
- Con `--install-daemon`, se `gateway.auth.token` e `gateway.auth.password` sono entrambi configurati e `gateway.auth.mode` non è impostato, l'onboarding blocca l'installazione finché la modalità non viene impostata esplicitamente.
- L'onboarding locale scrive `gateway.mode="local"` nella configurazione. Se in un file di configurazione successivo manca `gateway.mode`, trattalo come un danneggiamento della configurazione o una modifica manuale incompleta, non come una scorciatoia valida per la modalità locale.
- L'onboarding locale installa i plugin scaricabili selezionati quando il percorso di configurazione scelto li richiede.
- L'onboarding remoto scrive solo le informazioni di connessione per il Gateway remoto e non installa pacchetti plugin locali.
- `--allow-unconfigured` è un meccanismo di escape separato per il runtime gateway. Non significa che l'onboarding possa omettere `gateway.mode`.

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

- A meno che tu non passi `--skip-health`, l'onboarding attende che un gateway locale sia raggiungibile prima di uscire correttamente.
- `--install-daemon` avvia prima il percorso di installazione del gateway gestito. Senza, devi già avere un gateway locale in esecuzione, per esempio `openclaw gateway run`.
- Se in automazione vuoi solo scrivere configurazione/spazio di lavoro/bootstrap, usa `--skip-health`.
- Se gestisci autonomamente i file dello spazio di lavoro, passa `--skip-bootstrap` per impostare `agents.defaults.skipBootstrap: true` e saltare la creazione di `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Su Windows nativo, `--install-daemon` prova prima le Attività pianificate e ripiega su un elemento di login nella cartella Esecuzione automatica per utente se la creazione dell'attività viene negata.

Comportamento dell'onboarding interattivo con modalità di riferimento:

- Scegli **Usa riferimento segreto** quando richiesto.
- Poi scegli una delle due opzioni:
  - Variabile d'ambiente
  - Provider di segreti configurato (`file` o `exec`)
- L'onboarding esegue una rapida convalida preliminare prima di salvare il riferimento.
  - Se la convalida fallisce, l'onboarding mostra l'errore e consente di riprovare.

### Scelte di endpoint Z.AI non interattive

<Note>
`--auth-choice zai-api-key` rileva automaticamente l'endpoint e il modello Z.AI migliori per
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
    - `quickstart`: prompt minimi, genera automaticamente un token gateway.
    - `manual`: prompt completi per porta, bind e autenticazione (alias di `advanced`).
    - `import`: esegue un provider di migrazione rilevato, mostra l'anteprima del piano, quindi applica dopo la conferma.

  </Accordion>
  <Accordion title="Prefiltraggio dei provider">
    Quando una scelta di autenticazione implica un provider preferito, l'onboarding prefiltra i selettori di modello predefinito e allowlist su quel provider. Per Volcengine e BytePlus, questo corrisponde anche alle varianti coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Se il filtro del provider preferito non produce ancora modelli caricati, l'onboarding ripiega sul catalogo non filtrato invece di lasciare vuoto il selettore.

  </Accordion>
  <Accordion title="Follow-up della ricerca web">
    Alcuni provider di ricerca web attivano prompt di follow-up specifici del provider:

    - **Grok** può offrire la configurazione facoltativa di `x_search` con lo stesso profilo OAuth xAI o la stessa chiave API e una scelta di modello `x_search`.
    - **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e il modello predefinito di ricerca web Kimi.

  </Accordion>
  <Accordion title="Altri comportamenti">
    - Comportamento dell'ambito DM dell'onboarding locale: [Riferimento per la configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals).
    - Prima chat più rapida: `openclaw dashboard` (Control UI, nessuna configurazione canale).
    - Provider personalizzato: collega qualsiasi endpoint compatibile con OpenAI o Anthropic, inclusi provider ospitati non elencati. Usa Unknown per il rilevamento automatico.
    - Se viene rilevato lo stato Hermes, l'onboarding offre un flusso di migrazione. Usa [Migrate](/it/cli/migrate) per piani dry-run, modalità sovrascrittura, report e mappature esatte.

  </Accordion>
</AccordionGroup>

## Comandi comuni di follow-up

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Usa `openclaw setup` come stesso punto di ingresso dell'onboarding guidato. Usa `openclaw setup --baseline` quando ti servono solo la configurazione/spazio di lavoro di base, `openclaw configure` in seguito per modifiche mirate e `openclaw channels add` per una configurazione solo canale.

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` per gli script.
</Note>
