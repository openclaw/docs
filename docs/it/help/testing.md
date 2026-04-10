---
read_when:
    - Eseguire i test in locale o in CI
    - Aggiungere test di regressione per bug di modelli/provider
    - Debug del comportamento del gateway e dell'agente
summary: 'Kit di test: suite unit/e2e/live, runner Docker e cosa copre ciascun test'
title: Testირება
x-i18n:
    generated_at: "2026-04-10T08:13:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21b78e59a5189f4e8e6e1b490d350f4735c0395da31d21fc5d10b825313026b4
    source_path: help/testing.md
    workflow: 15
---

# Test

OpenClaw ha tre suite Vitest (unit/integration, e2e, live) e un piccolo insieme di runner Docker.

Questo documento è una guida a “come testiamo”:

- Cosa copre ogni suite, e cosa deliberatamente _non_ copre
- Quali comandi eseguire per i flussi di lavoro comuni (locale, pre-push, debug)
- Come i test live rilevano le credenziali e selezionano modelli/provider
- Come aggiungere regressioni per problemi reali di modelli/provider

## Avvio rapido

Nella maggior parte dei casi:

- Gate completo (atteso prima del push): `pnpm build && pnpm check && pnpm test`
- Esecuzione locale più rapida dell'intera suite su una macchina capiente: `pnpm test:max`
- Ciclo diretto di watch di Vitest: `pnpm test:watch`
- Il targeting diretto dei file ora instrada anche i percorsi extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Quando stai iterando su un singolo errore, preferisci prima esecuzioni mirate.
- Sito QA supportato da Docker: `pnpm qa:lab:up`
- Lane QA supportata da VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando tocchi i test o vuoi maggiore sicurezza:

- Gate di copertura: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Quando esegui il debug di provider/modelli reali, richiede credenziali reali:

- Suite live (modelli + probe di tool/immagini del gateway): `pnpm test:live`
- Esegui in modo silenzioso un singolo file live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Suggerimento: quando ti serve solo un caso in errore, preferisci restringere i test live tramite le variabili d'ambiente di allowlist descritte sotto.

## Runner specifici per QA

Questi comandi affiancano le suite di test principali quando ti serve il realismo di qa-lab:

- `pnpm openclaw qa suite`
  - Esegue direttamente sull'host gli scenari QA supportati dal repo.
- `pnpm openclaw qa suite --runner multipass`
  - Esegue la stessa suite QA dentro una VM Linux Multipass usa e getta.
  - Mantiene lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
  - Riutilizza gli stessi flag di selezione provider/modello di `qa suite`.
  - Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il guest:
    chiavi provider basate su env, il percorso della configurazione del provider live QA e `CODEX_HOME`
    quando presente.
  - Le directory di output devono restare sotto la root del repo in modo che il guest possa scrivere di nuovo tramite
    il workspace montato.
  - Scrive il normale report + riepilogo QA, oltre ai log di Multipass, sotto
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Avvia il sito QA supportato da Docker per lavoro QA in stile operatore.

## Suite di test, cosa viene eseguito e dove

Considera le suite come livelli di “realismo crescente”, e di crescente fragilità/costo:

### Unit / integration, predefinita

- Comando: `pnpm test`
- Configurazione: dieci esecuzioni sequenziali di shard (`vitest.full-*.config.ts`) sui progetti Vitest scoped esistenti
- File: inventari core/unit sotto `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e i test Node `ui` in allowlist coperti da `vitest.unit.config.ts`
- Ambito:
  - Test unitari puri
  - Test di integrazione in-process, autenticazione del gateway, routing, tooling, parsing, configurazione
  - Regressioni deterministiche per bug noti
- Aspettative:
  - Viene eseguita in CI
  - Non richiede chiavi reali
  - Dovrebbe essere veloce e stabile
- Nota sui progetti:
  - `pnpm test` senza target ora esegue undici configurazioni shard più piccole (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) invece di un unico enorme processo root-project nativo. Questo riduce il picco di RSS su macchine sotto carico ed evita che il lavoro di auto-reply/extension affami suite non correlate.
  - `pnpm test --watch` usa ancora il grafo di progetti del root nativo `vitest.config.ts`, perché un ciclo di watch multi-shard non è pratico.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` instradano prima file/directory espliciti attraverso lane scoped, quindi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita di pagare il costo di avvio completo del root project.
  - `pnpm test:changed` espande i percorsi git modificati nelle stesse lane scoped quando il diff tocca solo file sorgente/test instradabili; le modifiche a config/setup tornano comunque alla riesecuzione più ampia del root project.
  - Alcuni test `plugin-sdk` e `commands` selezionati passano anche attraverso lane leggere dedicate che saltano `test/setup-openclaw-runtime.ts`; i file stateful o pesanti in fase di runtime restano sulle lane esistenti.
  - Alcuni file sorgente helper `plugin-sdk` e `commands` selezionati mappano anche le esecuzioni in modalità changed ai test sibling espliciti in quelle lane leggere, così le modifiche agli helper evitano di rieseguire l'intera suite pesante per quella directory.
  - `auto-reply` ora ha tre bucket dedicati: helper core di primo livello, test di integrazione `reply.*` di primo livello e il sottoalbero `src/auto-reply/reply/**`. Questo tiene il lavoro più pesante dell'harness reply lontano dai test economici di status/chunk/token.
- Nota sul runner embedded:
  - Quando modifichi input di discovery dei message-tool o il contesto runtime di compaction,
    mantieni entrambi i livelli di copertura.
  - Aggiungi regressioni helper mirate per i boundary puri di routing/normalizzazione.
  - Mantieni anche in salute le suite di integrazione del runner embedded:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Queste suite verificano che gli id scoped e il comportamento di compaction continuino a fluire
    attraverso i percorsi reali `run.ts` / `compact.ts`; i soli test helper non sono un
    sostituto sufficiente di questi percorsi di integrazione.
- Nota sul pool:
  - La configurazione base di Vitest ora usa `threads` come predefinito.
  - La configurazione condivisa di Vitest fissa anche `isolate: false` e usa il runner non isolato nei root project, e2e e live config.
  - La lane UI root mantiene il proprio setup `jsdom` e optimizer, ma ora gira anch'essa sul runner condiviso non isolato.
  - Ogni shard di `pnpm test` eredita gli stessi valori predefiniti `threads` + `isolate: false` dalla configurazione condivisa di Vitest.
  - Il launcher condiviso `scripts/run-vitest.mjs` ora aggiunge anche `--no-maglev` per i processi child Node di Vitest per impostazione predefinita, per ridurre il churn di compilazione V8 durante grandi esecuzioni locali. Imposta `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se devi confrontarti con il comportamento V8 standard.
- Nota sull'iterazione locale veloce:
  - `pnpm test:changed` passa attraverso lane scoped quando i percorsi modificati corrispondono chiaramente a una suite più piccola.
  - `pnpm test:max` e `pnpm test:changed:max` mantengono lo stesso comportamento di routing, solo con un limite di worker più alto.
  - L'auto-scaling locale dei worker ora è intenzionalmente conservativo e riduce anche l'attività quando il load average dell'host è già alto, così più esecuzioni Vitest concorrenti causano meno danni per impostazione predefinita.
  - La configurazione base di Vitest contrassegna i file di progetto/config come `forceRerunTriggers`, così le riesecuzioni in modalità changed restano corrette quando cambia il wiring dei test.
  - La configurazione mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` abilitato sugli host supportati; imposta `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se vuoi un'unica posizione di cache esplicita per il profiling diretto.
- Nota sul debug delle prestazioni:
  - `pnpm test:perf:imports` abilita il reporting della durata degli import di Vitest insieme all'output di scomposizione degli import.
  - `pnpm test:perf:imports:changed` limita la stessa vista di profiling ai file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` confronta `test:changed` instradato con il percorso root-project nativo per quel diff committato e stampa wall time più RSS massimo su macOS.
- `pnpm test:perf:changed:bench -- --worktree` esegue il benchmark del dirty tree corrente instradando l'elenco dei file modificati attraverso `scripts/test-projects.mjs` e la configurazione root di Vitest.
  - `pnpm test:perf:profile:main` scrive un profilo CPU del thread principale per l'overhead di avvio e trasformazione di Vitest/Vite.
  - `pnpm test:perf:profile:runner` scrive profili CPU+heap del runner per la suite unit con il parallelismo dei file disabilitato.

### E2E, gateway smoke

- Comando: `pnpm test:e2e`
- Configurazione: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valori predefiniti di runtime:
  - Usa Vitest `threads` con `isolate: false`, in linea con il resto del repo.
  - Usa worker adattivi, CI: fino a 2, locale: 1 per impostazione predefinita.
  - Viene eseguita in modalità silenziosa per impostazione predefinita per ridurre l'overhead di I/O della console.
- Override utili:
  - `OPENCLAW_E2E_WORKERS=<n>` per forzare il numero di worker, limitato a 16.
  - `OPENCLAW_E2E_VERBOSE=1` per riattivare output dettagliato sulla console.
- Ambito:
  - Comportamento end-to-end del gateway multi-istanza
  - Superfici WebSocket/HTTP, pairing dei nodi e networking più pesante
- Aspettative:
  - Viene eseguita in CI, quando abilitata nella pipeline
  - Non richiede chiavi reali
  - Ha più parti in movimento rispetto ai test unitari, quindi può essere più lenta

### E2E: smoke del backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Ambito:
  - Avvia sull'host un gateway OpenShell isolato tramite Docker
  - Crea una sandbox a partire da un Dockerfile locale temporaneo
  - Esegue il backend OpenShell di OpenClaw tramite `sandbox ssh-config` reale + esecuzione SSH
  - Verifica il comportamento del filesystem remote-canonical tramite il bridge fs della sandbox
- Aspettative:
  - Solo opt-in; non fa parte dell'esecuzione predefinita di `pnpm test:e2e`
  - Richiede una CLI `openshell` locale e un demone Docker funzionante
  - Usa `HOME` / `XDG_CONFIG_HOME` isolati, poi distrugge il gateway di test e la sandbox
- Override utili:
  - `OPENCLAW_E2E_OPENSHELL=1` per abilitare il test quando esegui manualmente la suite e2e più ampia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` per puntare a una CLI binaria o a uno script wrapper non predefinito

### Live, provider reali + modelli reali

- Comando: `pnpm test:live`
- Configurazione: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`
- Predefinito: **abilitata** da `pnpm test:live`, imposta `OPENCLAW_LIVE_TEST=1`
- Ambito:
  - “Questo provider/modello funziona davvero _oggi_ con credenziali reali?”
  - Individua cambiamenti nel formato del provider, particolarità del tool-calling, problemi di autenticazione e comportamento dei rate limit
- Aspettative:
  - Per progettazione non è stabile in CI, reti reali, policy reali dei provider, quote, interruzioni
  - Costa denaro / usa rate limit
  - È preferibile eseguire sottoinsiemi ristretti invece di “tutto”
- Le esecuzioni live caricano `~/.profile` per recuperare eventuali chiavi API mancanti.
- Per impostazione predefinita, le esecuzioni live isolano comunque `HOME` e copiano il materiale di config/auth in una home temporanea di test, così i fixture unit non possono modificare il tuo `~/.openclaw` reale.
- Imposta `OPENCLAW_LIVE_USE_REAL_HOME=1` solo quando vuoi intenzionalmente che i test live usino la tua home directory reale.
- `pnpm test:live` ora usa una modalità più silenziosa per impostazione predefinita: mantiene l'output di avanzamento `[live] ...`, ma sopprime l'avviso extra su `~/.profile` e silenzia i log di bootstrap del gateway e il rumore di Bonjour. Imposta `OPENCLAW_LIVE_TEST_QUIET=0` se vuoi di nuovo i log completi di avvio.
- Rotazione delle chiavi API, specifica per provider: imposta `*_API_KEYS` con formato separato da virgola/punto e virgola oppure `*_API_KEY_1`, `*_API_KEY_2`, per esempio `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`, oppure usa l'override per-live `OPENCLAW_LIVE_*_KEY`; i test ritentano sulle risposte di rate limit.
- Output di avanzamento/heartbeat:
  - Le suite live ora emettono righe di avanzamento su stderr così le chiamate lunghe ai provider risultano visibilmente attive anche quando la cattura della console di Vitest è silenziosa.
  - `vitest.live.config.ts` disabilita l'intercettazione della console di Vitest, così le righe di avanzamento di provider/gateway vengono trasmesse immediatamente durante le esecuzioni live.
  - Regola gli heartbeat del modello diretto con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Regola gli heartbeat di gateway/probe con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quale suite devo eseguire?

Usa questa tabella decisionale:

- Modifica di logica/test: esegui `pnpm test`, e `pnpm test:coverage` se hai cambiato molto
- Tocco di networking del gateway / protocollo WS / pairing: aggiungi `pnpm test:e2e`
- Debug di “il mio bot è giù” / errori specifici del provider / tool calling: esegui un `pnpm test:live` ristretto

## Live: sweep delle capacità del nodo Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un nodo Android connesso e verificare il comportamento del contratto dei comandi.
- Ambito:
  - Setup manuale/con precondizioni, la suite non installa, esegue o abbina l'app.
  - Validazione `node.invoke` del gateway comando per comando per il nodo Android selezionato.
- Pre-setup richiesto:
  - App Android già connessa e abbinata al gateway.
  - App mantenuta in primo piano.
  - Permessi/consenso alla cattura concessi per le capacità che ti aspetti passino.
- Override opzionali del target:
  - `OPENCLAW_ANDROID_NODE_ID` oppure `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi della configurazione Android: [Android App](/it/platforms/android)

## Live: smoke dei modelli, chiavi del profilo

I test live sono suddivisi in due livelli in modo da poter isolare i guasti:

- “Direct model” ci dice se il provider/modello può rispondere o meno con la chiave fornita.
- “Gateway smoke” ci dice se l'intera pipeline gateway+agente funziona per quel modello, sessioni, cronologia, tool, policy della sandbox e così via.

### Livello 1: completamento diretto del modello, senza gateway

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli rilevati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello, e regressioni mirate quando necessario
- Come abilitarlo:
  - `pnpm test:live` oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente
- Imposta `OPENCLAW_LIVE_MODELS=modern`, oppure `all`, alias di modern, per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` focalizzato sul gateway smoke
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire la allowlist moderna, Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4
  - `OPENCLAW_LIVE_MODELS=all` è un alias per la allowlist moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`, allowlist separata da virgole
  - Gli sweep modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep moderno esaustivo oppure un numero positivo per un limite più piccolo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`, allowlist separata da virgole
- Da dove arrivano le chiavi:
  - Per impostazione predefinita: store del profilo e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre **solo** lo store del profilo
- Perché esiste:
  - Separa “la API del provider è rotta / la chiave non è valida” da “la pipeline dell'agente del gateway è rotta”
  - Contiene regressioni piccole e isolate, esempio: replay del ragionamento OpenAI Responses/Codex Responses + flussi di tool-call

### Livello 2: smoke di gateway + agente dev, ciò che fa davvero "@openclaw"

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/modificare una sessione `agent:dev:*`, override del modello per esecuzione
  - Iterare sui modelli con chiavi e verificare:
    - risposta “significativa”, senza tool
    - funziona una vera invocazione di tool, probe di read
    - probe di tool extra opzionali, probe exec+read
    - i percorsi di regressione OpenAI, solo tool-call → follow-up, continuano a funzionare
- Dettagli delle probe, così puoi spiegare rapidamente i guasti:
  - probe `read`: il test scrive un file nonce nel workspace e chiede all'agente di `read` quel file e riecheggiare il nonce.
  - probe `exec+read`: il test chiede all'agente di scrivere tramite `exec` un nonce in un file temporaneo, poi di leggerlo di nuovo con `read`.
  - probe immagine: il test allega un PNG generato, gatto + codice randomizzato, e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente
- Come selezionare i modelli:
  - Predefinito: allowlist moderna, Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias per la allowlist moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`, o un elenco separato da virgole, per restringere
  - Gli sweep gateway modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep moderno esaustivo oppure un numero positivo per un limite più piccolo.
- Come selezionare i provider, evita “OpenRouter tutto”:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`, allowlist separata da virgole
- Le probe di tool + immagine sono sempre attive in questo test live:
  - probe `read` + probe `exec+read`, stress dei tool
  - la probe immagine viene eseguita quando il modello pubblicizza il supporto per input immagine
  - Flusso, ad alto livello:
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Il gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente embedded inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice, tolleranza OCR: piccoli errori sono consentiti

Suggerimento: per vedere cosa puoi testare sulla tua macchina, e gli id esatti `provider/model`, esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI, Claude, Codex, Gemini o altre CLI locali

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: convalidare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la configurazione predefinita.
- I valori predefiniti dello smoke specifici del backend si trovano nella definizione `cli-backend.ts` dell'extension proprietaria.
- Abilitazione:
  - `pnpm test:live` oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Il comportamento di comando/argomenti/immagine proviene dai metadati del plugin del backend CLI proprietario.
- Override, opzionali:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine, i percorsi vengono iniettati nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti della CLI invece di iniettarli nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`, oppure `"list"`, per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e convalidare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` per disabilitare la probe predefinita di continuità nella stessa sessione da Claude Sonnet a Opus, impostalo a `1` per forzarla quando il modello selezionato supporta un target di switch.

Esempio:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Ricetta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Ricette Docker per singolo provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Note:

- Il runner Docker si trova in `scripts/test-live-cli-backend-docker.sh`.
- Esegue lo smoke del backend CLI live dentro l'immagine Docker del repo come utente non root `node`.
- Risolve i metadati dello smoke CLI dall'extension proprietaria, poi installa il pacchetto CLI Linux corrispondente, `@anthropic-ai/claude-code`, `@openai/codex` oppure `@google/gemini-cli`, in un prefisso scrivibile in cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR`, predefinito: `~/.cache/openclaw/docker-cli-tools`.
- Lo smoke del backend CLI live ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno di testo, turno di classificazione immagine, quindi chiamata dello strumento MCP `cron` verificata tramite la CLI del gateway.
- Lo smoke predefinito di Claude modifica anche la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke ACP bind, `/acp spawn ... --bind here`

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: convalidare il vero flusso ACP conversation-bind con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare sul posto una conversazione sintetica del canale messaggi
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up finisca nella trascrizione della sessione ACP associata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Predefiniti:
  - Agenti ACP in Docker: `claude,codex,gemini`
  - Agente ACP per `pnpm test:live ...` diretto: `claude`
  - Canale sintetico: contesto di conversazione in stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Note:
  - Questa lane usa la superficie `chat.send` del gateway con campi di originating-route sintetici riservati agli admin, così i test possono allegare il contesto del canale messaggi senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agent integrato del plugin `acpx` embedded per l'agente harness ACP selezionato.

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

Ricette Docker per singolo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-acp-bind-docker.sh`.
- Per impostazione predefinita, esegue in sequenza lo smoke ACP bind contro tutti gli agenti CLI live supportati: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oppure `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` per restringere la matrice.
- Carica `~/.profile`, prepara nel container il materiale di autenticazione CLI corrispondente, installa `acpx` in un prefisso npm scrivibile, poi installa la CLI live richiesta, `@anthropic-ai/claude-code`, `@openai/codex` oppure `@google/gemini-cli`, se manca.
- Dentro Docker, il runner imposta `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` in modo che acpx mantenga disponibili alla CLI harness figlia le variabili env del provider dal profilo caricato.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono più veloci e meno fragili:

- Modello singolo, diretto, senza gateway:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modello singolo, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su vari provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus su Google, chiave API Gemini + Antigravity:
  - Gemini, chiave API: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity, OAuth: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Note:

- `google/...` usa la API Gemini, chiave API.
- `google-antigravity/...` usa il bridge OAuth Antigravity, endpoint agente in stile Cloud Code Assist.
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina, con autenticazione separata e particolarità proprie degli strumenti.
- Gemini API rispetto a Gemini CLI:
  - API: OpenClaw chiama la API Gemini ospitata da Google tramite HTTP, autenticazione con chiave API / profilo; questo è ciò che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw invoca una binaria locale `gemini`; ha una propria autenticazione e può comportarsi in modo diverso, streaming/supporto strumenti/disallineamento di versione.

## Live: matrice dei modelli, cosa copriamo

Non esiste un “elenco di modelli CI” fisso, live è opt-in, ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno, tool calling + immagini

Questa è l'esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI, non-Codex: `openai/gpt-5.4`, facoltativo: `openai/gpt-5.4-mini`
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`, oppure `anthropic/claude-sonnet-4-6`
- Google, API Gemini: `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview`, evita i modelli Gemini 2.x più vecchi
- Google, Antigravity: `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI, GLM: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui il gateway smoke con tool + immagini:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling, Read + Exec opzionale

Scegline almeno uno per ogni famiglia di provider:

- OpenAI: `openai/gpt-5.4`, oppure `openai/gpt-5.4-mini`
- Anthropic: `anthropic/claude-opus-4-6`, oppure `anthropic/claude-sonnet-4-6`
- Google: `google/gemini-3-flash-preview`, oppure `google/gemini-3.1-pro-preview`
- Z.AI, GLM: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva facoltativa, utile ma non indispensabile:

- xAI: `xai/grok-4`, oppure l'ultima disponibile
- Mistral: `mistral/`… scegli un modello abilitato ai “tools” che hai attivato
- Cerebras: `cerebras/`… se hai accesso
- LM Studio: `lmstudio/`… locale; il tool calling dipende dalla modalità API

### Vision: invio immagine, allegato → messaggio multimodale

Includi almeno un modello con capacità di immagini in `OPENCLAW_LIVE_GATEWAY_MODELS`, varianti Claude/Gemini/OpenAI con capacità vision e così via, per esercitare la probe immagine.

### Aggregatori / gateway alternativi

Se hai le chiavi abilitate, supportiamo anche i test tramite:

- OpenRouter: `openrouter/...`, centinaia di modelli; usa `openclaw models scan` per trovare candidati con capacità di tool+immagini
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go, autenticazione tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`

Altri provider che puoi includere nella matrice live, se hai credenziali/configurazione:

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers`, endpoint personalizzati: `minimax`, cloud/API, più qualsiasi proxy compatibile OpenAI/Anthropic, LM Studio, vLLM, LiteLLM e così via

Suggerimento: non provare a fissare nei documenti “tutti i modelli”. L'elenco autorevole è qualunque cosa restituisca `discoverModels(...)` sulla tua macchina più le chiavi disponibili.

## Credenziali, non fare mai commit

I test live rilevano le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “no creds”, esegui il debug nello stesso modo in cui faresti con `openclaw models list` / selezione del modello.

- Profili auth per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, questo è il significato di “profile keys” nei test live
- Configurazione: `~/.openclaw/openclaw.json`, oppure `OPENCLAW_CONFIG_PATH`
- Directory di stato legacy: `~/.openclaw/credentials/`, copiata nella home live preparata quando presente, ma non è lo store principale delle chiavi di profilo
- Le esecuzioni live locali copiano per impostazione predefinita la configurazione attiva, i file `auth-profiles.json` per agente, `credentials/` legacy e le directory auth delle CLI esterne supportate in una home temporanea di test; le home live preparate saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così le probe restano fuori dal tuo workspace reale sull'host.

Se vuoi basarti su chiavi env, per esempio esportate nel tuo `~/.profile`, esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto, che possono montare `~/.profile` nel container.

## Live Deepgram, trascrizione audio

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus, piano di coding

- Test: `src/agents/byteplus.live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override modello facoltativo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live ComfyUI, media del workflow

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi bundled comfy per immagini, video e `music_generate`
  - Salta ogni capacità a meno che `models.providers.comfy.<capability>` non sia configurato
  - Utile dopo modifiche all'invio del workflow comfy, polling, download o registrazione del plugin

## Live: generazione immagini

- Test: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni plugin provider di generazione immagini registrato
  - Carica le variabili env mancanti dei provider dalla tua shell di login, `~/.profile`, prima di eseguire le probe
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabile
  - Esegue le varianti standard di generazione immagini tramite la capacità runtime condivisa:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider bundled attualmente coperti:
  - `openai`
  - `google`
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre auth dallo store dei profili e ignorare gli override solo-env

## Live: generazione musica

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso bundled del provider di generazione musica
  - Attualmente copre Google e MiniMax
  - Carica le variabili env dei provider dalla tua shell di login, `~/.profile`, prima di eseguire le probe
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della lane condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre auth dallo store dei profili e ignorare gli override solo-env

## Live: generazione video

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso bundled del provider di generazione video
  - Carica le variabili env dei provider dalla tua shell di login, `~/.profile`, prima di eseguire le probe
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza auth/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale basato su buffer nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale basato su buffer nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché il bundled `veo3` è solo testo e il bundled `kling` richiede un URL immagine remoto
  - Copertura Vydra specifica del provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una lane `kling` che usa per impostazione predefinita un fixture con URL immagine remoto
  - Copertura live `videoToVideo` attuale:
    - `runway` solo quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché questi percorsi al momento richiedono URL di riferimento remoti `http(s)` / MP4
    - `google` perché l'attuale lane condivisa Gemini/Veo usa input locale basato su buffer e quel percorso non è accettato nello sweep condiviso
    - `openai` perché l'attuale lane condivisa non garantisce accesso specifico all'organizzazione per video inpaint/remix
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre auth dallo store dei profili e ignorare gli override solo-env

## Harness live per media

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise per immagini, musica e video tramite un unico entrypoint nativo del repo
  - Carica automaticamente le variabili env mancanti dei provider da `~/.profile`
  - Per impostazione predefinita restringe automaticamente ogni suite ai provider che attualmente hanno auth utilizzabile
  - Riutilizza `scripts/test-live.mjs`, così il comportamento di heartbeat e quiet mode resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker, controlli facoltativi “funziona su Linux”

Questi runner Docker sono suddivisi in due categorie:

- Runner live-model: `test:docker:live-models` e `test:docker:live-gateway` eseguono solo il rispettivo file live con chiavi di profilo dentro l'immagine Docker del repo, `src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`, montando la directory di configurazione locale e il workspace, e caricando `~/.profile` se montato. Gli entrypoint locali corrispondenti sono `test:live:models-profiles` e `test:live:gateway-profiles`.
- I runner live Docker usano per impostazione predefinita un limite smoke più piccolo in modo che uno sweep Docker completo resti praticabile:
  `test:docker:live-models` usa per impostazione predefinita `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa per impostazione predefinita `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Esegui l'override di queste variabili env quando
  vuoi esplicitamente una scansione esaustiva più ampia.
- `test:docker:all` costruisce una sola volta l'immagine Docker live tramite `test:docker:live-build`, poi la riutilizza per le due lane Docker live.
- Runner smoke del container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` avviano uno o più container reali e verificano percorsi di integrazione di livello superiore.

I runner Docker live-model montano anche in bind solo le home di autenticazione CLI necessarie, oppure tutte quelle supportate quando l'esecuzione non è ristretta, poi le copiano nella home del container prima dell'esecuzione in modo che l'OAuth delle CLI esterne possa aggiornare i token senza modificare lo store di autenticazione dell'host:

- Modelli diretti: `pnpm test:docker:live-models`, script: `scripts/test-live-models-docker.sh`
- Smoke ACP bind: `pnpm test:docker:live-acp-bind`, script: `scripts/test-live-acp-bind-docker.sh`
- Smoke backend CLI: `pnpm test:docker:live-cli-backend`, script: `scripts/test-live-cli-backend-docker.sh`
- Gateway + agente dev: `pnpm test:docker:live-gateway`, script: `scripts/test-live-gateway-models-docker.sh`
- Smoke live Open WebUI: `pnpm test:docker:openwebui`, script: `scripts/e2e/openwebui-docker.sh`
- Wizard di onboarding, TTY, scaffolding completo: `pnpm test:docker:onboard`, script: `scripts/e2e/onboard-docker.sh`
- Networking del gateway, due container, autenticazione WS + health: `pnpm test:docker:gateway-network`, script: `scripts/e2e/gateway-network-docker.sh`
- Bridge del canale MCP, Gateway inizializzato + bridge stdio + smoke raw Claude notification-frame: `pnpm test:docker:mcp-channels`, script: `scripts/e2e/mcp-channels-docker.sh`
- Plugin, smoke di installazione + alias `/plugin` + semantica di riavvio del bundle Claude: `pnpm test:docker:plugins`, script: `scripts/e2e/plugins-docker.sh`

I runner Docker live-model montano inoltre in bind il checkout corrente in sola lettura e
lo preparano in una workdir temporanea dentro il container. Questo mantiene l'immagine runtime
leggera pur continuando a eseguire Vitest sulla tua esatta configurazione/sorgente locale.
Il passaggio di preparazione salta cache locali di grandi dimensioni e output di build delle app
come `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e directory `.build` locali dell'app o
directory di output Gradle, così le esecuzioni Docker live non passano minuti a copiare
artefatti specifici della macchina.
Impostano anche `OPENCLAW_SKIP_CHANNELS=1` così le probe live del gateway non avviano
veri worker di canale Telegram/Discord/ecc. dentro il container.
`test:docker:live-models` esegue comunque `pnpm test:live`, quindi fai passare
anche `OPENCLAW_LIVE_GATEWAY_*` quando devi restringere o escludere la copertura
live del gateway da quella lane Docker.
`test:docker:openwebui` è uno smoke di compatibilità di livello superiore: avvia un
container gateway OpenClaw con gli endpoint HTTP compatibili con OpenAI abilitati,
avvia un container Open WebUI fissato contro quel gateway, esegue l'accesso tramite
Open WebUI, verifica che `/api/models` esponga `openclaw/default`, poi invia una
vera richiesta di chat tramite il proxy `/api/chat/completions` di Open WebUI.
La prima esecuzione può essere sensibilmente più lenta perché Docker potrebbe dover scaricare
l'immagine Open WebUI e Open WebUI potrebbe dover completare la propria configurazione iniziale.
Questa lane richiede una chiave di modello live utilizzabile, e `OPENCLAW_PROFILE_FILE`,
`~/.profile` per impostazione predefinita, è il modo principale per fornirla nelle esecuzioni Docker.
Le esecuzioni riuscite stampano un piccolo payload JSON come `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` è intenzionalmente deterministico e non richiede un vero
account Telegram, Discord o iMessage. Avvia un container Gateway inizializzato,
avvia un secondo container che esegue `openclaw mcp serve`, poi
verifica il rilevamento delle conversazioni instradate, la lettura delle trascrizioni, i metadati degli allegati,
il comportamento della coda eventi live, l'instradamento degli invii in uscita e le notifiche di canale +
permessi in stile Claude sul vero bridge MCP stdio. Il controllo delle notifiche
ispeziona direttamente i frame MCP stdio raw così lo smoke convalida ciò che il
bridge emette davvero, non solo ciò che un determinato SDK client capita di esporre.

Smoke manuale ACP di thread in linguaggio naturale, non CI:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantieni questo script per i flussi di lavoro di regressione/debug. Potrebbe servire di nuovo per la convalida del routing dei thread ACP, quindi non eliminarlo.

Variabili env utili:

- `OPENCLAW_CONFIG_DIR=...`, predefinito: `~/.openclaw`, montata in `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`, predefinito: `~/.openclaw/workspace`, montata in `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`, predefinito: `~/.profile`, montata in `/home/node/.profile` e caricata prima di eseguire i test
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`, predefinito: `~/.cache/openclaw/docker-cli-tools`, montata in `/home/node/.npm-global` per installazioni CLI in cache dentro Docker
- Directory/file di autenticazione CLI esterni sotto `$HOME` sono montati in sola lettura sotto `/host-auth...`, poi copiati in `/home/node/...` prima dell'avvio dei test
  - Directory predefinite: `.minimax`
  - File predefiniti: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Le esecuzioni ristrette per provider montano solo le directory/file necessari dedotti da `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manuale con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oppure un elenco separato da virgole come `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` per restringere l'esecuzione
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` per filtrare i provider nel container
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per garantire che le credenziali provengano dallo store dei profili, non da env
- `OPENCLAW_OPENWEBUI_MODEL=...` per scegliere il modello esposto dal gateway per lo smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` per eseguire l'override del prompt di controllo nonce usato dallo smoke Open WebUI
- `OPENWEBUI_IMAGE=...` per eseguire l'override del tag immagine Open WebUI fissato

## Verifica rapida della documentazione

Esegui i controlli della documentazione dopo modifiche ai documenti: `pnpm check:docs`.
Esegui la validazione completa degli anchor Mintlify quando ti servono anche controlli sugli heading nella pagina: `pnpm docs:check-links:anchors`.

## Regressione offline, sicura per CI

Queste sono regressioni della “pipeline reale” senza provider reali:

- Tool calling del gateway, OpenAI simulato, vero loop gateway + agente: `src/gateway/gateway.test.ts`, caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop"
- Wizard del gateway, WS `wizard.start`/`wizard.next`, scrive config + auth enforced: `src/gateway/gateway.test.ts`, caso: "runs wizard over ws and writes auth token config"

## Valutazioni di affidabilità dell'agente, Skills

Abbiamo già alcuni test sicuri per CI che si comportano come “valutazioni di affidabilità dell'agente”:

- Mock del tool-calling tramite il vero loop gateway + agente, `src/gateway/gateway.test.ts`.
- Flussi wizard end-to-end che convalidano il wiring della sessione e gli effetti della configurazione, `src/gateway/gateway.test.ts`.

Cosa manca ancora per le Skills, vedi [Skills](/it/tools/skills):

- **Decisioning:** quando le Skills sono elencate nel prompt, l'agente sceglie la Skill corretta, o evita quelle irrilevanti?
- **Compliance:** l'agente legge `SKILL.md` prima dell'uso e segue i passaggi/gli argomenti richiesti?
- **Workflow contracts:** scenari multi-turno che verificano ordine degli strumenti, riporto della cronologia della sessione e boundary della sandbox.

Le valutazioni future dovrebbero prima di tutto restare deterministiche:

- Un runner di scenari che usa provider simulati per verificare chiamate agli strumenti + ordine, lettura dei file skill e wiring della sessione.
- Una piccola suite di scenari focalizzati sulle skill, usare vs evitare, gating, prompt injection.
- Valutazioni live facoltative, opt-in e controllate da env, solo dopo che la suite sicura per CI sarà pronta.

## Test di contratto, forma di plugin e channel

I test di contratto verificano che ogni plugin e channel registrato sia conforme al
proprio contratto di interfaccia. Iterano su tutti i plugin rilevati ed eseguono una suite di
verifiche su forma e comportamento. La lane unit predefinita di `pnpm test`
salta intenzionalmente questi file condivisi di seam e smoke; esegui esplicitamente
i comandi di contratto quando modifichi superfici condivise di channel o provider.

### Comandi

- Tutti i contratti: `pnpm test:contracts`
- Solo contratti dei channel: `pnpm test:contracts:channels`
- Solo contratti dei provider: `pnpm test:contracts:plugins`

### Contratti dei channel

Si trovano in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma base del plugin, id, nome, capacità
- **setup** - Contratto del wizard di configurazione
- **session-binding** - Comportamento di associazione della sessione
- **outbound-payload** - Struttura del payload del messaggio
- **inbound** - Gestione dei messaggi in ingresso
- **actions** - Handler delle azioni del channel
- **threading** - Gestione degli id dei thread
- **directory** - API di directory/roster
- **group-policy** - Applicazione della policy di gruppo

### Contratti di stato dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe di stato del channel
- **registry** - Forma del registro dei plugin

### Contratti dei provider

Si trovano in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contratto del flusso di autenticazione
- **auth-choice** - Scelta/selezione dell'autenticazione
- **catalog** - API del catalogo dei modelli
- **discovery** - Rilevamento dei plugin
- **loader** - Caricamento dei plugin
- **runtime** - Runtime del provider
- **shape** - Forma/interfaccia del plugin
- **wizard** - Wizard di configurazione

### Quando eseguirli

- Dopo aver modificato export o subpath del plugin-sdk
- Dopo aver aggiunto o modificato un plugin channel o provider
- Dopo aver rifattorizzato la registrazione o il rilevamento dei plugin

I test di contratto vengono eseguiti in CI e non richiedono chiavi API reali.

## Aggiungere regressioni, linee guida

Quando correggi un problema provider/modello scoperto in live:

- Aggiungi una regressione sicura per CI se possibile, provider simulato/stub oppure acquisizione dell'esatta trasformazione della forma della richiesta
- Se è intrinsecamente solo live, rate limit, policy di autenticazione, mantieni il test live ristretto e opt-in tramite variabili env
- Preferisci puntare al livello più piccolo che intercetta il bug:
  - bug di conversione/replay della richiesta del provider → test direct models
  - bug della pipeline gateway sessione/cronologia/tool → gateway live smoke o test mock del gateway sicuro per CI
- Guardrail di attraversamento SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` ricava un target campionato per classe SecretRef dai metadati del registro, `listSecretTargetRegistryEntries()`, poi verifica che gli id exec dei segmenti di attraversamento vengano rifiutati.
  - Se aggiungi una nuova famiglia di target SecretRef `includeInPlan` in `src/secrets/target-registry-data.ts`, aggiorna `classifyTargetClass` in quel test. Il test fallisce intenzionalmente sugli id target non classificati così le nuove classi non possono essere saltate in silenzio.
