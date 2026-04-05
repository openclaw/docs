---
read_when:
    - Esecuzione dei test in locale o in CI
    - Aggiunta di regressioni per bug di modelli/provider
    - Debug del comportamento del gateway + agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Testing
x-i18n:
    generated_at: "2026-04-05T13:56:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854a39ae261d8749b8d8d82097b97a7c52cf2216d1fe622e302d830a888866ab
    source_path: help/testing.md
    workflow: 15
---

# Testing

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme di runner Docker.

Questo documento è una guida al “come testiamo”:

- Cosa copre ciascuna suite (e cosa deliberatamente _non_ copre)
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug)
- Come i test live individuano le credenziali e selezionano modelli/provider
- Come aggiungere regressioni per problemi reali di modelli/provider

## Guida rapida

La maggior parte dei giorni:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm test`
- Esecuzione locale più rapida dell'intera suite su una macchina capiente: `pnpm test:max`
- Ciclo watch diretto di Vitest (configurazione di progetti moderni): `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi di extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

Quando tocchi i test o vuoi maggiore sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali (richiede credenziali reali):

- Suite live (probe di modelli + strumenti/immagini del gateway): `pnpm test:live`
- Esegui in modo silenzioso un singolo file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Suggerimento: quando ti serve solo un singolo caso in errore, preferisci restringere i test live tramite le variabili di ambiente di allowlist descritte sotto.

## Suite di test (cosa viene eseguito dove)

Pensa alle suite come a “realismo crescente” (e crescente instabilità/costo):

### Unit / integration (predefinito)

- Comando: `pnpm test`
- Configurazione: `projects` nativi di Vitest tramite `vitest.config.ts`
- File: inventari core/unit in `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process (auth del gateway, routing, tooling, parsing, configurazione)
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Eseguiti in CI
  - Nessuna chiave reale richiesta
  - Dovrebbero essere veloci e stabili
- Nota sui progetti:
  - `pnpm test`, `pnpm test:watch` e `pnpm test:changed` usano tutti la stessa configurazione root nativa `projects` di Vitest.
  - I filtri diretti sui file instradano in modo nativo attraverso il grafo dei progetti root, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` funziona senza un wrapper personalizzato.
- Nota sull'embedded runner:
  - Quando modifichi gli input di discovery degli strumenti di messaggio o il contesto runtime della compattazione,
    mantieni entrambi i livelli di copertura.
  - Aggiungi regressioni helper mirate per i confini puri di routing/normalizzazione.
  - Mantieni in salute anche le suite di integrazione dell'embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Queste suite verificano che gli id con ambito definito e il comportamento di compattazione continuino a fluire
    attraverso i veri percorsi `run.ts` / `compact.ts`; i test solo-helper non sono
    un sostituto sufficiente per questi percorsi di integrazione.
- Nota sul pool:
  - La configurazione base di Vitest ora usa `threads` per impostazione predefinita.
  - La configurazione Vitest condivisa imposta anche `isolate: false` e usa il runner non isolato nei progetti root, nelle configurazioni e2e e live.
  - La corsia UI root mantiene la propria configurazione `jsdom` e optimizer, ma ora viene eseguita anch'essa sul runner condiviso non isolato.
  - `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false` dalla configurazione `projects` in `vitest.config.ts`.
  - Il launcher condiviso `scripts/run-vitest.mjs` ora aggiunge anche `--no-maglev` ai processi Node figli di Vitest per impostazione predefinita, per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se devi confrontarti con il comportamento V8 standard.
- Nota sull'iterazione locale veloce:
  - `pnpm test:changed` esegue la configurazione nativa dei progetti con `--changed origin/main`.
  - `pnpm test:max` e `pnpm test:changed:max` mantengono la stessa configurazione nativa dei progetti, solo con un limite di worker più alto.
  - L'auto-scaling locale dei worker ora è intenzionalmente prudente e riduce ulteriormente quando il load average dell'host è già alto, così più esecuzioni Vitest concorrenti causano meno danni per impostazione predefinita.
  - La configurazione base di Vitest contrassegna i file di progetto/configurazione come `forceRerunTriggers` così i riesegui in modalità changed restano corretti quando cambia il wiring dei test.
  - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi una posizione di cache esplicita per il profiling diretto.
- Nota sul debug delle prestazioni:
  - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest più l'output del dettaglio degli import.
  - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai file modificati rispetto a `origin/main`.
  - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per l'overhead di startup e trasformazione di Vitest/Vite.
  - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con il parallelismo dei file disabilitato.

### E2E (gateway smoke)

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valori predefiniti di runtime:
  - Usa `threads` di Vitest con `isolate: false`, in linea con il resto del repository.
  - Usa worker adattivi (CI: fino a 2, locale: 1 per impostazione predefinita).
  - Viene eseguito in modalità silenziosa per impostazione predefinita per ridurre l'overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker (massimo 16).
  - `OPENCLAW_E2E_VERBOSE=1` per riattivare l'output dettagliato della console.
- Ambito:
  - Comportamento end-to-end del gateway multiistanza
  - Superfici WebSocket/HTTP, pairing dei nodi e networking più pesante
- Aspettative:
  - Eseguito in CI (quando abilitato nella pipeline)
  - Nessuna chiave reale richiesta
  - Più parti in movimento rispetto ai test unitari (può essere più lento)

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Ambito:
  - Avvia un gateway OpenShell isolato sull'host tramite Docker
  - Crea una sandbox da un Dockerfile locale temporaneo
  - Esegue il backend OpenShell di OpenClaw tramite `sandbox ssh-config` + exec SSH reali
  - Verifica il comportamento canonico remoto del filesystem tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita `pnpm test:e2e`
  - Richiede una CLI `openshell` locale e un daemon Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, quindi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a un binario CLI non predefinito o a uno script wrapper

### Live (provider reali + modelli reali)

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`
- Predefinito: **abilitato** da `pnpm test:live` (imposta `OPENCLAW_LIVE_TEST=1`)
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Individuare cambiamenti di formato del provider, peculiarità del tool-calling, problemi di auth e comportamento dei limiti di frequenza
- Aspettative:
  - Non stabile in CI per definizione (reti reali, policy reali dei provider, quote, outage)
  - Costa denaro / consuma limiti di frequenza
  - È preferibile eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live caricano `~/.profile` per raccogliere eventuali API key mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano configurazione/materiale auth in una home di test temporanea in modo che le fixture unit non possano modificare il tuo vero `~/.openclaw`.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live usino la tua vera home directory.
- `pnpm test:live` ora usa per impostazione predefinita una modalità più silenziosa: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra su `~/.profile` e silenzia i log di bootstrap del gateway/il chatter Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi di nuovo i log completi di avvio.
- Rotazione delle API key (specifica per provider): imposta `*_API_KEYS` con formato separato da virgole/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2` (ad esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oppure override per-live tramite `OPENCLAW_LIVE_*_KEY`; i test ritentano in caso di risposte di rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le lunghe chiamate ai provider risultano visibilmente attive anche quando la cattura della console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest così le righe di avanzamento provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat dei modelli diretti con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite dovrei eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test` (e `pnpm test:coverage` se hai cambiato molto)
- Se tocchi networking del gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Se stai eseguendo il debug di “il mio bot è giù” / errori specifici di provider / tool calling: esegui un `pnpm test:live` ristretto

## Live: sweep delle capacità del nodo Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente dichiarato** da un nodo Android connesso e verificare il comportamento del contratto del comando.
- Ambito:
  - Setup precondizionato/manuale (la suite non installa/esegue/associa l'app).
  - Validazione `node.invoke` del gateway comando per comando per il nodo Android selezionato.
- Setup preliminare richiesto:
  - App Android già connessa e associata al gateway.
  - App mantenuta in primo piano.
  - Permessi/consenso alla cattura concessi per le capacità che ti aspetti superino il test.
- Override facoltativi della destinazione:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi del setup Android: [App Android](/platforms/android)

## Live: smoke dei modelli (chiavi di profilo)

I test live sono suddivisi in due livelli così possiamo isolare i guasti:

- “Modello diretto” ci dice se il provider/modello può rispondere del tutto con la chiave data.
- “Gateway smoke” ci dice se l'intera pipeline gateway+agente funziona per quel modello (sessioni, cronologia, strumenti, policy sandbox, ecc.).

### Livello 1: completamento diretto del modello (senza gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli individuati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate quando necessario)
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (oppure `all`, alias di modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` concentrato sul gateway smoke
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire l'allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias dell'allowlist moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove provengono le chiavi:
  - Per impostazione predefinita: store dei profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre **solo** lo store dei profili
- Perché esiste:
  - Separa “l'API del provider è rotta / la chiave non è valida” da “la pipeline dell'agente gateway è rotta”
  - Contiene regressioni piccole e isolate (esempio: replay del reasoning di OpenAI Responses/Codex Responses + flussi di tool-call)

### Livello 2: smoke del gateway + agente dev (quello che fa `@openclaw`)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/applicare patch a una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare sui modelli-con-chiavi e verificare:
    - risposta “significativa” (senza strumenti)
    - un'invocazione reale di strumento funziona (probe read)
    - probe facoltativi aggiuntivi sugli strumenti (probe exec+read)
    - i percorsi di regressione OpenAI (solo tool-call → follow-up) continuano a funzionare
- Dettagli dei probe (così puoi spiegare rapidamente gli errori):
  - probe `read`: il test scrive un file nonce nel workspace e chiede all'agente di eseguire `read` su quel file e riecheggiare il nonce.
  - probe `exec+read`: il test chiede all'agente di scrivere con `exec` un nonce in un file temporaneo, quindi di leggerlo con `read`.
  - probe immagini: il test allega un PNG generato (gatto + codice casuale) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias dell'allowlist moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o lista separata da virgole) per restringere
- Come selezionare i provider (evita “tutto OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- I probe di strumenti + immagini sono sempre attivi in questo test live:
  - probe `read` + probe `exec+read` (stress sugli strumenti)
  - il probe immagini viene eseguito quando il modello dichiara supporto all'input immagini
  - Flusso (alto livello):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Il gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente embedded inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: piccoli errori consentiti)

Suggerimento: per vedere cosa puoi testare sulla tua macchina (e gli esatti id `provider/model`), esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude CLI o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: convalidare la pipeline gateway + agente usando un backend CLI locale, senza toccare la configurazione predefinita.
- Abilitazione:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valori predefiniti:
  - Modello: `claude-cli/claude-sonnet-4-6`
  - Comando: `claude`
  - Argomenti: `["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]`
- Override (facoltativi):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece di iniettarli nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) per controllare come gli argomenti immagine vengono passati quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e convalidare il flusso di ripresa.
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` per mantenere abilitata la configurazione MCP di Claude CLI (per impostazione predefinita viene iniettato un `--mcp-config` temporaneo vuoto e rigoroso così i server MCP ambientali/globali restano disabilitati durante lo smoke).

Esempio:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Ricetta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Note:

- Il runner Docker si trova in `scripts/test-live-cli-backend-docker.sh`.
- Esegue lo smoke live del backend CLI all'interno dell'immagine Docker del repository come utente `node` non root, perché Claude CLI rifiuta `bypassPermissions` quando viene invocata come root.
- Per `claude-cli`, installa il pacchetto Linux `@anthropic-ai/claude-code` in un prefisso cache scrivibile in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- Per `claude-cli`, lo smoke live inietta una configurazione MCP vuota e rigorosa a meno che tu non imposti `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0`.
- Copia `~/.claude` nel container quando disponibile, ma sulle macchine in cui l'auth di Claude è supportata da `ANTHROPIC_API_KEY`, conserva anche `ANTHROPIC_API_KEY` / `ANTHROPIC_API_KEY_OLD` per la CLI Claude figlia tramite `OPENCLAW_LIVE_CLI_BACKEND_PRESERVE_ENV`.

## Live: smoke del bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: convalidare il vero flusso di conversation-bind ACP con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare sul posto una conversazione sintetica di canale messaggi
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up finisca nella trascrizione della sessione ACP associata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valori predefiniti:
  - Agente ACP: `claude`
  - Canale sintetico: contesto di conversazione stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=/full/path/to/acpx`
- Note:
  - Questa corsia usa la superficie `chat.send` del gateway con campi di route di origine sintetica solo-admin così i test possono collegare il contesto del canale messaggi senza fingere la consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND` non è impostato, il test usa il comando acpx configurato/incluso. Se l'auth del tuo harness dipende da variabili env di `~/.profile`, preferisci un comando `acpx` personalizzato che preservi l'env del provider.

Esempio:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Ricetta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-acp-bind-docker.sh`.
- Carica `~/.profile`, copia nel container la home auth CLI corrispondente (`~/.claude` o `~/.codex`), installa `acpx` in un prefisso npm scrivibile, quindi installa la CLI live richiesta (`@anthropic-ai/claude-code` o `@openai/codex`) se manca.
- Dentro Docker, il runner imposta `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` così acpx mantiene disponibili alla CLI harness figlia le variabili env del provider dal profilo caricato.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono più veloci e meno instabili:

- Singolo modello, diretto (senza gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Singolo modello, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su più provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Note:

- `google/...` usa l'API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agente in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (auth separata + peculiarità degli strumenti).
- API Gemini vs CLI Gemini:
  - API: OpenClaw chiama via HTTP l'API Gemini ospitata da Google (chiave API / auth del profilo); questo è ciò che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw esegue una shell verso un binario locale `gemini`; ha auth propria e può comportarsi in modo diverso (streaming/supporto strumenti/version skew).

## Live: matrice dei modelli (cosa copriamo)

Non esiste un “elenco modelli CI” fisso (live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (tool calling + immagine)

Questa è l'esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI (non-Codex): `openai/gpt-5.4` (facoltativo: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i modelli Gemini 2.x più vecchi)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui gateway smoke con strumenti + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec facoltativo)

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.4` (oppure `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oppure `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva facoltativa (utile da avere):

- xAI: `xai/grok-4` (o l'ultima disponibile)
- Mistral: `mistral/`… (scegline uno con capacità “tools” che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; il tool calling dipende dalla modalità API)

### Vision: invio di immagini (allegato → messaggio multimodale)

Includi almeno un modello con capacità immagine in `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/varianti OpenAI con capacità visive, ecc.) per esercitare il probe immagini.

### Aggregatori / gateway alternativi

Se hai chiavi abilitate, supportiamo anche test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati con capacità tool+image)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (auth tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/configurazione):

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualsiasi proxy compatibile OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

Suggerimento: non cercare di fissare nei documenti “tutti i modelli”. L'elenco autorevole è qualunque cosa restituisca `discoverModels(...)` sulla tua macchina + qualunque chiave sia disponibile.

## Credenziali (non fare mai commit)

I test live individuano le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “nessuna credenziale”, esegui il debug come faresti per `openclaw models list` / selezione del modello.

- Profili auth per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è ciò che significa “chiavi di profilo” nei test live)
- Configurazione: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home live staged quando presente, ma non è lo store principale delle chiavi di profilo)
- Le esecuzioni locali live copiano per impostazione predefinita la configurazione attiva, i file `auth-profiles.json` per agente, `credentials/` legacy e le directory auth CLI esterne supportate in una home di test temporanea; gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi in quella configurazione staged così i probe restano fuori dal tuo vero workspace host.

Se vuoi affidarti a chiavi env (ad esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto (possono montare `~/.profile` nel container).

## Live Deepgram (trascrizione audio)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `src/agents/byteplus.live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override facoltativo del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live image generation

- Test: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Ambito:
  - Enumera ogni plugin provider di image generation registrato
  - Carica dal tuo login shell (`~/.profile`) le variabili env mancanti del provider prima del probe
  - Usa per impostazione predefinita live/env API key prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabile
  - Esegue le varianti standard di image generation tramite la capacità runtime condivisa:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider inclusi attualmente coperti:
  - `openai`
  - `google`
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'auth dello store dei profili e ignorare override solo-env

## Runner Docker (controlli facoltativi “funziona su Linux”)

Questi runner Docker si dividono in due categorie:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono soltanto il rispettivo file live a chiavi di profilo corrispondente dentro l'immagine Docker del repository (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando la directory di configurazione e il workspace locali (e caricando `~/.profile` se montato). Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner Docker live usano per impostazione predefinita un limite smoke più piccolo così una sweep Docker completa resta pratica:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sovrascrivi queste variabili env quando
  vuoi esplicitamente la scansione esaustiva più ampia.
- `test:docker:all` costruisce una volta l'immagine Docker live tramite `test:docker:live-build`, poi la riutilizza per le due corsie Docker live.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker live-model montano anche in bind solo le home auth CLI necessarie (oppure tutte quelle supportate quando l'esecuzione non è ristretta), quindi le copiano nella home del container prima dell'esecuzione così l'OAuth della CLI esterna può aggiornare i token senza modificare lo store auth dell'host:

- Modelli diretti: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke del bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Wizard di onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking del gateway (due container, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Bridge canali MCP (Gateway seeded + bridge stdio + smoke raw dei frame di notifica Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin (smoke di installazione + alias `/plugin` + semantica di riavvio del bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

I runner Docker live-model montano anche in bind il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene snella l'immagine runtime
pur eseguendo Vitest contro il tuo esatto sorgente/configurazione locale.
Impostano inoltre `OPENCLAW_SKIP_CHANNELS=1` così i probe live del gateway non avviano
worker reali di canali Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi passa anche
`OPENCLAW_LIVE_GATEWAY_*` quando ti serve restringere o escludere la copertura
live del gateway da quella corsia Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container gateway OpenClaw con gli endpoint HTTP compatibili OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, esegue l'accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, quindi invia una
vera richiesta chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l'immagine Open WebUI e Open WebUI potrebbe dover completare il proprio setup cold-start.
Questa corsia si aspetta una chiave live model utilizzabile, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` per impostazione predefinita) è il modo principale per fornirla nelle esecuzioni Docker.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un
account reale Telegram, Discord o iMessage. Avvia un container Gateway seeded,
avvia un secondo container che esegue `openclaw mcp serve`, quindi
verifica discovery della conversazione instradata, letture della trascrizione, metadati degli allegati,
comportamento della coda di eventi live, routing dell'invio in uscita e notifiche in stile Claude di canale +
permessi sul vero bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio grezzi così lo smoke convalida ciò che il
bridge emette davvero, non solo ciò che un particolare SDK client capita a mostrare.

Smoke manuale ACP plain-language thread (non CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per i flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la convalida dell'instradamento dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...` (predefinito: `~/.openclaw`) montato in `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predefinito: `~/.openclaw/workspace`) montato in `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predefinito: `~/.profile`) montato in `/home/node/.profile` e caricato prima di eseguire i test
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predefinito: `~/.cache/openclaw/docker-cli-tools`) montato in `/home/node/.npm-global` per installazioni CLI cache dentro Docker
- Le directory auth CLI esterne sotto `$HOME` sono montate in sola lettura sotto `/host-auth/...`, quindi copiate in `/home/node/...` prima dell'avvio dei test
  - Predefinito: monta tutte le directory supportate (`.codex`, `.claude`, `.minimax`)
  - Le esecuzioni ristrette ai provider montano solo le directory necessarie dedotte da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separata da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per assicurarti che le credenziali provengano dallo store dei profili (non dall'env)
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per sostituire il prompt di verifica nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per sostituire il tag dell'immagine Open WebUI fissata

## Controlli di sanità della documentazione

Esegui i controlli doc dopo modifiche alla documentazione: `pnpm check:docs`.
Esegui la convalida completa degli anchor Mintlify quando ti servono anche i controlli degli heading in-page: `pnpm docs:check-links:anchors`.

## Regressione offline (sicura per CI)

Queste sono regressioni della “pipeline reale” senza provider reali:

- Tool calling del gateway (mock OpenAI, vero loop gateway + agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard del gateway (WS `wizard.start`/`wizard.next`, scrive config + auth applicata): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Valutazioni di affidabilità dell'agente (Skills)

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità dell'agente”:

- Mock del tool-calling tramite il vero loop gateway + agente (`src/gateway/gateway.test.ts`).
- Flussi wizard end-to-end che convalidano il wiring della sessione e gli effetti della configurazione (`src/gateway/gateway.test.ts`).

Cosa manca ancora per le Skills (vedi [Skills](/tools/skills)):

- **Decisioning:** quando le skill sono elencate nel prompt, l'agente sceglie la skill giusta (o evita quelle irrilevanti)?
- **Compliance:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/gli argomenti richiesti?
- **Workflow contracts:** scenari multi-turn che verificano ordine degli strumenti, carryover della cronologia di sessione e confini della sandbox.

Le valutazioni future dovrebbero restare prima di tutto deterministiche:

- Un runner di scenari che usa provider mock per verificare tool call + ordine, letture dei file skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle skill (usa vs evita, gating, prompt injection).
- Valutazioni live facoltative (opt-in, protette da env) solo dopo che la suite sicura per CI è attiva.

## Test di contratto (forma di plugin e canali)

I test di contratto verificano che ogni plugin e canale registrato sia conforme al proprio
contratto di interfaccia. Iterano su tutti i plugin scoperti ed eseguono una suite di
verifiche di forma e comportamento. La corsia unit predefinita `pnpm test`
salta intenzionalmente questi file condivisi di seam e smoke; esegui esplicitamente
i comandi di contratto quando tocchi superfici condivise di canali o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei canali: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei canali

Situati in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin (id, nome, capacità)
- **setup** - Contratto della procedura guidata di setup
- **session-binding** - Comportamento del binding di sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del canale
- **threading** - Gestione dell'id del thread
- **directory** - API directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato del provider

Situati in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato dei canali
- **registry** - Forma del registro dei plugin

### Contratti dei provider

Situati in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso auth
- **auth-choice** - Scelta/selezione auth
- **catalog** - API del catalogo modelli
- **discovery** - Discovery del plugin
- **loader** - Caricamento del plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Procedura guidata di setup

### Quando eseguirli

- Dopo aver modificato export o subpath del plugin-sdk
- Dopo aver aggiunto o modificato un plugin di canale o provider
- Dopo refactor di registrazione o discovery dei plugin

I test di contratto vengono eseguiti in CI e non richiedono API key reali.

## Aggiungere regressioni (linee guida)

Quando correggi un problema di provider/modello scoperto live:

- Aggiungi, se possibile, una regressione sicura per CI (provider mock/stub, oppure cattura l'esatta trasformazione della forma della richiesta)
- Se è intrinsecamente solo-live (limiti di frequenza, policy auth), mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci colpire il livello più piccolo che intercetta il bug:
  - bug nella conversione/riproduzione della richiesta del provider → test dei modelli diretti
  - bug nella pipeline gateway sessione/cronologia/strumenti → gateway live smoke o test mock gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` ricava un target campione per classe SecretRef dai metadati del registro (`listSecretTargetRegistryEntries()`), quindi verifica che gli id exec dei segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati così le nuove classi non possono essere saltate in silenzio.
