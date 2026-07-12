---
read_when:
    - Esecuzione degli smoke test live per matrice dei modelli / backend CLI / ACP / provider multimediali
    - Debug della risoluzione delle credenziali per i test live
    - Aggiunta di un nuovo test live specifico per un provider
sidebarTitle: Live tests
summary: 'Test live (con accesso alla rete): matrice dei modelli, backend della CLI, ACP, fornitori multimediali, credenziali'
title: 'Test: suite live'
x-i18n:
    generated_at: "2026-07-12T07:08:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Per l'avvio rapido, gli esecutori QA, le suite unitarie/di integrazione e i flussi Docker, consulta
[Test](/it/help/testing). Questa pagina tratta i test **live** (che accedono alla rete):
matrice dei modelli, backend CLI, ACP, provider multimediali e gestione delle credenziali.

## Live: comandi smoke locali

Esporta la chiave del provider necessaria nell'ambiente del processo prima di eseguire
controlli live ad hoc.

Test smoke sicuro per i contenuti multimediali:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Test smoke sicuro per la disponibilità delle chiamate vocali:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` esegue una simulazione, a meno che non sia presente anche `--yes`; usa `--yes` solo
quando intendi effettuare una chiamata reale. Per Twilio, Telnyx e Plivo, un
controllo di disponibilità riuscito richiede un URL Webhook pubblico: gli URL
locali/privati di local loopback vengono rifiutati perché tali provider non possono raggiungerli.

## Live: scansione delle funzionalità del Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: richiamare **ogni comando attualmente dichiarato** da un Node Android connesso e verificare il comportamento del contratto dei comandi.
- Ambito:
  - Configurazione preliminare/manuale (la suite non installa, esegue né associa l'app).
  - Convalida comando per comando di `node.invoke` del Gateway per il Node Android selezionato.
- Configurazione preliminare richiesta:
  - App Android già connessa e associata al Gateway.
  - App mantenuta in primo piano.
  - Autorizzazioni/consenso all'acquisizione concessi per le funzionalità che si prevede superino il test.
- Sostituzioni facoltative della destinazione:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi sulla configurazione di Android: [App Android](/it/platforms/android)

## Live: test smoke dei modelli (chiavi dei profili)

I test live dei modelli sono suddivisi in due livelli per isolare gli errori:

- "Modello diretto" indica se il provider/modello è in grado di rispondere con la chiave fornita.
- "Test smoke del Gateway" indica se l'intera pipeline Gateway+agente funziona per quel modello (sessioni, cronologia, strumenti, criteri della sandbox e così via).

Gli elenchi selezionati di modelli riportati di seguito si trovano in `src/agents/live-model-filter.ts` e
cambiano nel tempo; considera gli array presenti in quel file come fonte attendibile, non questa
pagina.

MiniMax M3 usa `minimax/MiniMax-M3` come riferimento provider/modello predefinito.

### Livello 1: completamento diretto del modello (senza Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli individuati
  - Usare `getApiKeyForModel` per selezionare i modelli per cui disponi delle credenziali
  - Eseguire un breve completamento per ciascun modello (e regressioni mirate ove necessario)
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se richiami direttamente Vitest)
  - Imposta `OPENCLAW_LIVE_MODELS=modern`, `small` o `all` (alias di `modern`) per eseguire effettivamente questa suite; altrimenti viene ignorata, in modo che `pnpm test:live` da solo rimanga incentrato sul test smoke del Gateway.
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` esegue l'elenco prioritario selezionato ad alto valore informativo (consulta [Live: matrice dei modelli](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` esegue l'elenco prioritario selezionato dei modelli di piccole dimensioni
  - `OPENCLAW_LIVE_MODELS=all` è un alias di `modern`
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (elenco consentito separato da virgole)
  - Le esecuzioni locali dei modelli Ollama di piccole dimensioni usano per impostazione predefinita `http://127.0.0.1:11434`; imposta `OPENCLAW_LIVE_OLLAMA_BASE_URL` solo per endpoint LAN, personalizzati o Ollama Cloud.
  - Le scansioni modern/all e small usano per impostazione predefinita la lunghezza del rispettivo elenco selezionato come limite; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per una scansione completa dei profili selezionati oppure un numero positivo per un limite inferiore.
  - Le scansioni complete usano `OPENCLAW_LIVE_TEST_TIMEOUT_MS` come timeout per l'intero test diretto dei modelli. Valore predefinito: 60 minuti.
  - Le verifiche dirette dei modelli vengono eseguite per impostazione predefinita con un parallelismo pari a 20; imposta `OPENCLAW_LIVE_MODEL_CONCURRENCY` per sostituirlo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (elenco consentito separato da virgole)
- Provenienza delle chiavi:
  - Per impostazione predefinita: archivio dei profili e valori di riserva delle variabili d'ambiente
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre l'uso esclusivo dell'**archivio dei profili**
- Motivo per cui esiste:
  - Separa "l'API del provider non funziona / la chiave non è valida" da "la pipeline agente del Gateway non funziona"
  - Include regressioni piccole e isolate (esempio: riproduzione del ragionamento OpenAI Responses/Codex Responses + flussi di chiamata degli strumenti)

### Livello 2: test smoke del Gateway + agente di sviluppo (ciò che "@openclaw" fa realmente)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un Gateway all'interno del processo
  - Creare/modificare una sessione `agent:dev:*` (sostituzione del modello per ogni esecuzione)
  - Iterare sui modelli con chiavi e verificare:
    - risposta "significativa" (senza strumenti)
    - funzionamento di una chiamata reale a uno strumento (verifica di lettura)
    - verifiche aggiuntive facoltative degli strumenti (verifica di esecuzione+lettura)
    - funzionamento continuativo dei percorsi di regressione OpenAI (solo chiamata allo strumento -> interazione successiva)
- Dettagli delle verifiche (per poter spiegare rapidamente gli errori):
  - Verifica `read`: il test scrive un file nonce nell'area di lavoro e chiede all'agente di eseguirne la `read` e restituire il nonce.
  - Verifica `exec+read`: il test chiede all'agente di usare `exec` per scrivere un nonce in un file temporaneo, quindi di rileggerlo con `read`.
  - Verifica dell'immagine: il test allega un PNG generato (gatto + codice casuale) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento dell'implementazione: `src/gateway/gateway-models.profiles.live.test.ts` e `test/helpers/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se richiami direttamente Vitest)
- Come selezionare i modelli:
  - Valore predefinito: l'elenco prioritario selezionato ad alto valore informativo (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` esegue l'elenco selezionato dei modelli di piccole dimensioni attraverso l'intera pipeline Gateway+agente
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias di `modern`
  - In alternativa, imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o un elenco separato da virgole) per restringere la selezione
  - Le scansioni Gateway modern/all e small usano per impostazione predefinita la lunghezza del rispettivo elenco selezionato come limite; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per una scansione completa della selezione oppure un numero positivo per un limite inferiore.
- Come selezionare i provider (evitando "tutto tramite OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (elenco consentito separato da virgole)
- Le verifiche degli strumenti e delle immagini sono sempre attive in questo test live:
  - Verifica `read` + verifica `exec+read` (stress degli strumenti)
  - La verifica dell'immagine viene eseguita quando il modello dichiara il supporto per l'input di immagini
  - Flusso (ad alto livello):
    - Il test genera un piccolo PNG con "CAT" + codice casuale (`test/helpers/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Il Gateway analizza gli allegati trasformandoli in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente incorporato inoltra al modello un messaggio utente multimodale
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: sono ammessi errori minori)

<Tip>
Per vedere cosa puoi testare sul tuo computer (e gli ID `provider/model` esatti), esegui:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: test smoke del backend CLI (Claude, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: convalidare la pipeline Gateway + agente usando un backend CLI locale, senza modificare la configurazione predefinita.
- Le impostazioni predefinite del test smoke specifiche per ciascun backend si trovano nella definizione `cli-backend.ts` del Plugin proprietario.
- Abilitazione:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se richiami direttamente Vitest)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Impostazioni predefinite:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Il comportamento di comandi/argomenti/immagini deriva dai metadati del Plugin proprietario del backend CLI.
- Sostituzioni (facoltative):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un allegato immagine reale (i percorsi vengono inseriti nel prompt). Disattivato per impostazione predefinita nelle procedure Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI anziché inserirli nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oppure `"list"`) per controllare come vengono passati gli argomenti delle immagini quando è impostato `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare una seconda interazione e convalidare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` per abilitare esplicitamente la verifica di continuità nella stessa sessione Claude Sonnet -> Opus quando il modello selezionato supporta una destinazione di cambio. Disattivata per impostazione predefinita, incluse le procedure Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` per abilitare esplicitamente la verifica del loopback MCP/strumenti. Disattivata per impostazione predefinita nelle procedure Docker.

Esempio:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Test smoke economico della configurazione MCP di Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Questo test non chiede a Gemini di generare una risposta. Scrive le stesse impostazioni di
sistema che OpenClaw fornisce a Gemini, quindi esegue `gemini --debug mcp list` per dimostrare che un
server salvato con `transport: "streamable-http"` viene normalizzato nel formato MCP HTTP di Gemini
e può connettersi a un server MCP HTTP in streaming locale.

Procedura Docker:

```bash
pnpm test:docker:live-cli-backend
```

Procedure Docker per singolo provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Note:

- L'esecutore Docker si trova in `scripts/test-live-cli-backend-docker.sh`.
- Esegue il test smoke live del backend CLI nell'immagine Docker del repository come utente `node` non root.
- Risolve i metadati del test smoke CLI dal Plugin proprietario, quindi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code` o `@google/gemini-cli`) in un prefisso scrivibile memorizzato nella cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (valore predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` non è più un backend CLI incluso; usa invece `openai/*` con il runtime del server applicativo Codex (consulta [Live: test smoke dell'harness del server applicativo Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede l'OAuth portabile dell'abbonamento Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` ottenuto da `claude setup-token`. Prima verifica direttamente `claude -p` in Docker, quindi esegue due interazioni del backend CLI del Gateway senza conservare le variabili d'ambiente delle chiavi API Anthropic. Questo percorso per abbonamento disabilita per impostazione predefinita le verifiche MCP/strumenti e immagini di Claude, perché consuma i limiti di utilizzo dell'abbonamento autenticato e Anthropic può modificare il comportamento di fatturazione e limitazione della frequenza di Claude Agent SDK / `claude -p` senza una versione di OpenClaw.
- Claude e Gemini supportano lo stesso insieme di verifiche (interazione testuale, classificazione delle immagini, chiamata allo strumento MCP `cron`, continuità nel cambio di modello) tramite i flag precedenti, ma nessuna di queste verifiche viene eseguita per impostazione predefinita: abilitale esplicitamente tramite il relativo flag secondo necessità.

## Live: raggiungibilità del proxy HTTP/2 APNs

- Test: `src/infra/push-apns-http2.live.test.ts`
- Obiettivo: creare un tunnel attraverso un proxy HTTP CONNECT locale verso l'endpoint APNs sandbox di Apple, inviare la richiesta di convalida HTTP/2 APNs e verificare che la risposta reale `403 InvalidProviderToken` di Apple ritorni attraverso il percorso del proxy.
- Abilitazione:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout facoltativo:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: test smoke del binding ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: convalidare il flusso reale di associazione delle conversazioni ACP con un agente ACP attivo:
  - inviare `/acp spawn <agent> --bind here`
  - associare sul posto una conversazione sintetica di un canale di messaggistica
  - inviare un normale messaggio di follow-up nella stessa conversazione
  - verificare che il follow-up venga registrato nella trascrizione della sessione ACP associata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valori predefiniti:
  - Agenti ACP in Docker: `claude,codex,gemini`
  - Agente ACP per l'esecuzione diretta di `pnpm test:live ...`: `claude`
  - Canale sintetico: contesto di conversazione in stile messaggio diretto Slack
  - Backend ACP: `acpx`
- Sostituzioni:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (oppure `on`/`true`/`yes`) per forzare l'attivazione della verifica delle immagini; qualsiasi altro valore la disattiva forzatamente. Per impostazione predefinita viene eseguita per tutti gli agenti tranne `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Note:
  - Questo percorso usa l'interfaccia `chat.send` del Gateway con campi sintetici della route di origine riservati agli amministratori, affinché i test possano collegare il contesto del canale di messaggistica senza simulare una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agenti integrato del Plugin `acpx` incorporato per l'agente selezionato nell'harness ACP.
  - La creazione Cron MCP della sessione associata viene eseguita con il massimo impegno per impostazione predefinita, perché gli harness ACP esterni possono annullare le chiamate MCP dopo il superamento della prova di associazione/immagine; impostare `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` per rendere rigorosa la verifica Cron successiva all'associazione.

Esempio:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Procedura Docker:

```bash
pnpm test:docker:live-acp-bind
```

Procedure Docker per un singolo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Note su Docker:

- Il runner Docker si trova in `scripts/test-live-acp-bind-docker.sh`.
- Per impostazione predefinita, esegue in sequenza lo smoke test dell'associazione ACP sugli agenti CLI attivi aggregati: `claude`, `codex`, quindi `gemini`.
- Usare `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` oppure `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` per restringere la matrice.
- Predispone nel container il materiale di autenticazione CLI corrispondente, quindi installa la CLI attiva richiesta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid tramite `https://app.factory.ai/cli`, `@google/gemini-cli` oppure `opencode-ai`), se assente. Il backend ACP stesso è il pacchetto `acpx/runtime` incorporato dal Plugin ufficiale `acpx`.
- La variante Docker di Droid predispone `~/.factory` per le impostazioni, inoltra `FACTORY_API_KEY` e richiede tale chiave API, perché l'autenticazione locale Factory tramite OAuth/portachiavi non è trasferibile nel container. Usa la voce di registro integrata di ACPX `droid exec --output-format acp`.
- La variante Docker di OpenCode è un percorso rigoroso di regressione per un singolo agente. Scrive un modello predefinito temporaneo in `OPENCODE_CONFIG_CONTENT` da `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (valore predefinito `opencode/kimi-k2.6`).
- Le chiamate dirette alla CLI `acpx` costituiscono solo un percorso manuale/alternativo per confrontare il comportamento al di fuori del Gateway. Lo smoke test Docker dell'associazione ACP esercita il backend di runtime `acpx` incorporato in OpenClaw.

## Attivo: smoke test dell'harness app-server Codex

- Obiettivo: convalidare l'harness Codex gestito dal Plugin tramite il normale metodo
  `agent` del Gateway:
  - caricare il Plugin `codex` incluso
  - selezionare un modello OpenAI tramite `/model <ref> --runtime codex`
  - inviare un primo turno dell'agente tramite Gateway con il livello di ragionamento richiesto
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread dell'app-server
    possa riprendere
  - eseguire `/codex status` e `/codex models` attraverso lo stesso percorso dei comandi del Gateway
  - eseguire facoltativamente due verifiche della shell con privilegi elevati esaminate da Guardian: un comando innocuo
    che dovrebbe essere approvato e un caricamento contenente un falso segreto che dovrebbe essere
    negato, in modo che l'agente chieda conferma
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello di riferimento dell'harness: `openai/gpt-5.6-luna`
- Selezione predefinita per una nuova chiave API OpenAI: `openai/gpt-5.6`
- Ragionamento predefinito: `low`
- Sostituzione del modello: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Sostituzione del ragionamento: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Sostituzione della matrice: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Modalità di autenticazione: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (valore predefinito) usa
  l'accesso Codex copiato; `api-key` usa `OPENAI_API_KEY` tramite l'app-server Codex.
- Verifica facoltativa delle immagini: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Verifica facoltativa MCP/strumenti: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Verifica facoltativa Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Lo smoke test forza `agentRuntime.id: "codex"` per provider/modello, affinché un harness Codex
  non funzionante non possa superare il test ricorrendo silenziosamente a OpenClaw.
- Autenticazione: autenticazione dell'app-server Codex dall'accesso locale con abbonamento Codex oppure
  `OPENAI_API_KEY` quando `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker può
  copiare `~/.codex/auth.json` e `~/.codex/config.toml` per le esecuzioni con abbonamento.

Procedura locale:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Procedura Docker:

```bash
pnpm test:docker:live-codex-harness
```

Matrice Codex nativa GPT-5.6:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Valore predefinito per una nuova chiave API OpenAI:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Questa prova lascia `OPENCLAW_LIVE_GATEWAY_MODELS` non impostato, risolve il modello tramite
l'interfaccia di selezione per inferenza della nuova procedura di configurazione iniziale, verifica `openai/gpt-5.6`, quindi
esegue un turno reale tramite Gateway con il modello risolto.

Matrice GPT-5.6 incorporata in OpenClaw:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Note su Docker:

- Il runner Docker si trova in `scripts/test-live-codex-harness-docker.sh`.
- Passa `OPENAI_API_KEY`, copia i file di autenticazione della CLI Codex quando presenti, installa
  `@openai/codex` in un prefisso npm montato e scrivibile,
  predispone l'albero dei sorgenti, quindi esegue soltanto il test attivo dell'harness Codex.
- Docker abilita per impostazione predefinita le verifiche delle immagini, MCP/strumenti e Guardian. Impostare
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando è necessaria un'esecuzione di debug
  più circoscritta.
- Docker usa la stessa configurazione esplicita del runtime Codex, perciò gli alias obsoleti o il ripiego su OpenClaw
  non possono nascondere una regressione dell'harness Codex.
- Le destinazioni della matrice vengono eseguite in sequenza in un unico container. Lo script Docker adatta il
  timeout predefinito di 35 minuti al numero di destinazioni; qualsiasi timeout della shell esterna o della CI deve
  consentire la stessa durata complessiva. La CI canonica mantiene ogni destinazione GPT-5.6 in uno shard separato.

### Procedure attive consigliate

Gli elenchi di elementi consentiti circoscritti ed espliciti sono i più rapidi e meno soggetti a errori intermittenti:

- Modello singolo, diretto (senza Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Profilo diretto per modelli piccoli:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Profilo Gateway per modelli piccoli:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke test dell'API Ollama Cloud:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Modello singolo, smoke test del Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chiamata degli strumenti con diversi provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke test diretto di Z.AI Coding Plan GLM-5.2:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Ambito Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke test del ragionamento adattivo di Google (`qa manual` dalla CLI QA privata; richiede `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` e un checkout dei sorgenti; consultare la [panoramica QA](/it/concepts/qa-e2e-automation)):
  - Valore predefinito dinamico di Gemini 3: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Budget dinamico di Gemini 2.5: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Note:

- `google/...` usa l'API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint dell'agente in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sul computer (autenticazione separata e peculiarità degli strumenti).
- API Gemini e CLI Gemini:
  - API: OpenClaw chiama tramite HTTP l'API Gemini ospitata da Google (chiave API/autenticazione del profilo); è ciò che la maggior parte degli utenti intende per "Gemini".
  - CLI: OpenClaw avvia un processo shell per un eseguibile locale `gemini`; dispone di una propria autenticazione e può comportarsi diversamente (streaming/supporto degli strumenti/disallineamento delle versioni).

## Attivo: matrice dei modelli (copertura)

I test attivi sono facoltativi, quindi non esiste un "elenco di modelli CI" fisso. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (e il relativo alias `all`) eseguono l'elenco curato delle priorità da `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` in `src/agents/live-model-filter.ts`, nel seguente ordine di priorità:

| Provider/modello                               | Note       |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | API Gemini |
| `google/gemini-3.5-flash`                     | API Gemini |
| `cohere/command-a-plus-05-2026`               |            |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

L'elenco curato dei **modelli piccoli** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), tratto da `SMALL_LIVE_MODEL_PRIORITY`:

| Provider/modello              |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Note sull'elenco moderno:

- I provider `codex` e `codex-cli` sono esclusi dalla scansione moderna predefinita (coprono il comportamento del backend CLI/ACP, verificato separatamente in precedenza). `openai/gpt-5.5` viene instradato per impostazione predefinita tramite l'harness app-server di Codex; consulta [Test live: controllo rapido dell'harness app-server di Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` e `xai` eseguono nella scansione moderna soltanto gli ID modello esplicitamente selezionati (senza espansione automatica a "tutti i modelli di questo provider").
- Includi almeno un modello compatibile con le immagini (varianti con funzionalità visive delle famiglie Claude/Gemini/OpenAI e così via) in `OPENCLAW_LIVE_GATEWAY_MODELS` per eseguire la verifica delle immagini.

Esegui il controllo rapido del Gateway con strumenti e immagini su un insieme selezionato manualmente di provider diversi:

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Copertura aggiuntiva facoltativa al di fuori degli elenchi curati (utile ma non indispensabile; scegli un modello compatibile con gli "strumenti" che hai abilitato):

- Mistral: `mistral/...`
- Cerebras: `cerebras/...` (se hai accesso)
- LM Studio: `lmstudio/...` (locale; la chiamata degli strumenti dipende dalla modalità API)

### Aggregatori / Gateway alternativi

Se hai abilitato le chiavi, puoi eseguire i test anche tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati compatibili con strumenti e immagini)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (autenticazione tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se disponi di credenziali/configurazione):

- Integrati: `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), oltre a qualsiasi proxy compatibile con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM e così via)

<Tip>
Non codificare direttamente "tutti i modelli" nella documentazione. L'elenco autorevole è quello restituito da `discoverModels(...)` sul tuo computer, insieme alle chiavi disponibili.
</Tip>

## Credenziali (non eseguire mai il commit)

I test live rilevano le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live segnala "no creds", esegui il debug come faresti per `openclaw models list` / la selezione del modello.

- Profili di autenticazione per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (nei test live, "profile keys" indica questo)
- Configurazione: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Directory OAuth precedente: `~/.openclaw/credentials/` (quando presente, viene copiata nella directory home live di staging, ma non costituisce l'archivio principale delle chiavi dei profili)
- Le esecuzioni live locali copiano la configurazione attiva (rimuovendo le sostituzioni di `agents.*.workspace` / `agentDir`) e il file `auth-profiles.json` di ogni agente, ma non il resto della directory dell'agente, quindi i dati di `workspace/` e `sandboxes/` non raggiungono mai la directory home di staging; copiano inoltre la directory precedente `credentials/` e i file/le directory di autenticazione supportati delle CLI esterne (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) in una directory home temporanea per i test.

Se vuoi fare affidamento sulle chiavi delle variabili d'ambiente, esportale prima dei test locali oppure usa gli esecutori Docker riportati di seguito con un `OPENCLAW_PROFILE_FILE` esplicito.

## Test live di Deepgram (trascrizione audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Test live del piano di programmazione BytePlus

- Test: `extensions/byteplus/live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sostituzione facoltativa del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Test live dei contenuti multimediali del flusso di lavoro ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Verifica i percorsi integrati di Comfy per immagini, video e `music_generate`
  - Ignora ogni funzionalità, a meno che `plugins.entries.comfy.config.<capability>` non sia configurato
  - Utile dopo modifiche all'invio dei flussi di lavoro Comfy, al polling, ai download o alla registrazione del Plugin

## Test live della generazione di immagini

- Test: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Elenca ogni Plugin provider registrato per la generazione di immagini
  - Utilizza le variabili d'ambiente dei provider già esportate prima della verifica
  - Per impostazione predefinita, usa le chiavi API live/dell'ambiente prima dei profili di autenticazione archiviati, in modo che le chiavi di test obsolete in `auth-profiles.json` non nascondano le credenziali reali della shell
  - Ignora i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue ogni provider configurato tramite il runtime condiviso per la generazione di immagini:
    - `<provider>:generate`
    - `<provider>:edit` quando il provider dichiara il supporto per la modifica
- Provider integrati attualmente coperti:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamento facoltativo dell'autenticazione:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre l'autenticazione tramite l'archivio dei profili e ignorare le sostituzioni basate esclusivamente sull'ambiente

Per il percorso CLI distribuito, aggiungi un controllo rapido di `infer` dopo il superamento del test live del provider/runtime:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Immagine di prova piatta e minimale: un quadrato blu su sfondo bianco, senza testo." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Questo copre l'analisi degli argomenti della CLI, la risoluzione della configurazione e dell'agente predefinito, l'attivazione dei Plugin integrati, il runtime condiviso per la generazione di immagini e la richiesta live al provider. Le dipendenze dei Plugin devono essere presenti prima del caricamento del runtime.

## Test live della generazione musicale

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Verifica il percorso condiviso dei provider integrati per la generazione musicale
  - Attualmente copre `fal`, `google`, `minimax` e `openrouter`
  - Utilizza le variabili d'ambiente dei provider già esportate prima della verifica
  - Per impostazione predefinita, usa le chiavi API live/dell'ambiente prima dei profili di autenticazione archiviati, in modo che le chiavi di test obsolete in `auth-profiles.json` non nascondano le credenziali reali della shell
  - Ignora i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate, quando disponibili:
    - `generate` con input costituito dal solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - `comfy` dispone di un proprio file live separato e non fa parte di questa scansione condivisa
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento facoltativo dell'autenticazione:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre l'autenticazione tramite l'archivio dei profili e ignorare le sostituzioni basate esclusivamente sull'ambiente

## Test live della generazione video

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso dei provider integrati per la generazione video tra `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Usa per impostazione predefinita il percorso di smoke test sicuro per il rilascio: una richiesta da testo a video per provider, un prompt di un secondo con un'aragosta e un limite operativo per provider definito da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Salta FAL per impostazione predefinita perché la latenza della coda lato provider può incidere fortemente sui tempi di rilascio; specificare `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (oppure svuotare l'elenco delle esclusioni) per eseguirlo esplicitamente
  - Prima di effettuare il rilevamento, usa le variabili d'ambiente del provider già esportate
  - Per impostazione predefinita, usa le chiavi API live/d'ambiente prima dei profili di autenticazione archiviati, affinché chiavi di test obsolete in `auth-profiles.json` non nascondano credenziali reali della shell
  - Salta i provider privi di autenticazione, profilo o modello utilizzabili
  - Per impostazione predefinita, esegue solo `generate`
  - Impostare `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità di trasformazione dichiarate, quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta, nell'esecuzione condivisa, un'immagine locale fornita come buffer
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta, nell'esecuzione condivisa, un video locale fornito come buffer
  - Provider `imageToVideo` attualmente dichiarato ma escluso nell'esecuzione condivisa:
    - `vydra` (l'input di immagini locali fornito come buffer non è supportato in questa corsia)
  - Copertura specifica del provider Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Quel file esegue la conversione da testo a video con `veo3`, oltre a una corsia da immagine a video con `kling` che usa per impostazione predefinita una fixture con URL di immagine remoto (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` per sostituirlo).
  - Copertura specifica del provider xAI:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Il caso classico genera come primo fotogramma un PNG locale quadrato, omette la geometria, richiede un clip da immagine a video di un secondo, effettua il polling fino al completamento e verifica il buffer scaricato.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Il caso 1.5 genera come primo fotogramma un PNG locale, richiede un clip da immagine a video di un secondo in 1080P, effettua il polling fino al completamento e verifica il buffer scaricato.
  - Copertura live `videoToVideo` attuale:
    - Solo `runway`, quando il modello selezionato viene risolto in `gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma esclusi nell'esecuzione condivisa:
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, perché questi percorsi richiedono attualmente URL di riferimento `http(s)` remoti anziché input locali forniti come buffer
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere tutti i provider nell'esecuzione predefinita, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il limite di ogni operazione del provider durante uno smoke test aggressivo
- Comportamento facoltativo dell'autenticazione:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'autenticazione tramite l'archivio dei profili e ignorare le sostituzioni presenti solo nell'ambiente

## Harness live per i contenuti multimediali

- Comando: `pnpm test:live:media`
- Punto di ingresso: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, che esegue `pnpm test:live -- <suite-test-file>` per ogni suite selezionata, in modo che il comportamento di Heartbeat e della modalità silenziosa rimanga coerente con le altre esecuzioni di `pnpm test:live`.
- Scopo:
  - Esegue le suite live condivise per immagini, musica e video tramite un unico punto di ingresso nativo del repository
  - Carica automaticamente da `~/.profile` le variabili d'ambiente mancanti dei provider
  - Per impostazione predefinita, limita automaticamente ogni suite ai provider che dispongono attualmente di un'autenticazione utilizzabile
- Flag:
  - `--providers <csv>` filtro globale dei provider; `--image-providers` / `--music-providers` / `--video-providers` limitano un filtro a una singola suite
  - `--all-providers` salta il filtro automatico basato sull'autenticazione
  - `--allow-empty` termina con `0` quando il filtro non lascia alcun provider eseguibile
  - `--quiet` / `--no-quiet` vengono inoltrati a `test:live`
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Contenuti correlati

- [Test](/it/help/testing) - suite di test unitari, di integrazione, QA e Docker
