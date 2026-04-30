---
read_when:
    - Esecuzione degli smoke test live della matrice dei modelli / backend CLI / ACP / provider multimediale
    - Debug della risoluzione delle credenziali dei test live
    - Aggiunta di un nuovo test dal vivo specifico del fornitore
sidebarTitle: Live tests
summary: 'Test in esecuzione reale (che accedono alla rete): matrice dei modelli, backend CLI, ACP, provider multimediali, credenziali'
title: 'Test: suite live'
x-i18n:
    generated_at: "2026-04-30T08:56:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01684475a08296e08e70c339c6d1a689fad8640bf747e8c72b6854045a70451e
    source_path: help/testing-live.md
    workflow: 16
---

Per avvio rapido, runner QA, suite unit/integration e flussi Docker, vedi
[Testing](/it/help/testing). Questa pagina copre le suite di test **live** (che toccano la rete):
matrice dei modelli, backend CLI, ACP e test live dei provider multimediali, oltre alla
gestione delle credenziali.

## Live: comandi smoke del profilo locale

Esegui il source di `~/.profile` prima dei controlli live ad hoc, così le chiavi dei provider e i percorsi degli strumenti locali
corrispondono alla tua shell:

```bash
source ~/.profile
```

Smoke multimediale sicuro:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke sicuro di prontezza per chiamate vocali:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` è una simulazione, a meno che non sia presente anche `--yes`. Usa `--yes` solo
quando vuoi intenzionalmente effettuare una vera chiamata di notifica. Per Twilio, Telnyx e
Plivo, un controllo di prontezza riuscito richiede un URL Webhook pubblico; i fallback solo locali
local loopback/privati vengono rifiutati per progettazione.

## Live: sweep delle capacità del nodo Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente annunciato** da un nodo Android connesso e verificare il comportamento del contratto del comando.
- Ambito:
  - Configurazione precondizionata/manuale (la suite non installa/esegue/abbina l'app).
  - Validazione Gateway `node.invoke` comando per comando per il nodo Android selezionato.
- Preconfigurazione richiesta:
  - App Android già connessa e abbinata al Gateway.
  - App mantenuta in primo piano.
  - Permessi/consenso alla cattura concessi per le capacità che ti aspetti superino il test.
- Override opzionali del target:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi della configurazione Android: [App Android](/it/platforms/android)

## Live: smoke dei modelli (chiavi del profilo)

I test live sono divisi in due livelli, così possiamo isolare gli errori:

- “Modello diretto” ci dice se il provider/modello può rispondere in assoluto con la chiave fornita.
- “Smoke Gateway” ci dice se la pipeline completa gateway+agente funziona per quel modello (sessioni, cronologia, strumenti, criterio sandbox, ecc.).

### Livello 1: completamento diretto del modello (senza Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli scoperti
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove necessario)
- Come abilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias di modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` concentrato sullo smoke del Gateway
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire l'allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias dell'allowlist moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep moderno esaustivo oppure un numero positivo per un limite più piccolo.
  - Gli sweep esaustivi usano `OPENCLAW_LIVE_TEST_TIMEOUT_MS` per il timeout dell'intero test diretto del modello. Predefinito: 60 minuti.
  - Le sonde dirette dei modelli vengono eseguite per impostazione predefinita con parallelismo a 20 vie; imposta `OPENCLAW_LIVE_MODEL_CONCURRENCY` per sovrascriverlo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove provengono le chiavi:
  - Per impostazione predefinita: archivio profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per applicare solo **l'archivio profili**
- Perché esiste:
  - Separa “l'API del provider è rotta / la chiave non è valida” da “la pipeline agente Gateway è rotta”
  - Contiene regressioni piccole e isolate (esempio: replay del reasoning OpenAI Responses/Codex Responses + flussi di chiamata strumenti)

### Livello 2: smoke Gateway + agente dev (ciò che "@openclaw" fa davvero)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un Gateway in-process
  - Creare/applicare patch a una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare sui modelli con chiavi e verificare:
    - risposta “significativa” (nessuno strumento)
    - funzionamento di una vera invocazione di strumento (sonda di lettura)
    - sonde strumento extra opzionali (sonda exec+read)
    - percorsi di regressione OpenAI (solo chiamata strumento → follow-up) continuano a funzionare
- Dettagli delle sonde (così puoi spiegare rapidamente gli errori):
  - Sonda `read`: il test scrive un file nonce nel workspace e chiede all'agente di eseguirne il `read` e restituire il nonce.
  - Sonda `exec+read`: il test chiede all'agente di scrivere con `exec` un nonce in un file temporaneo, poi di rileggerlo con `read`.
  - Sonda immagine: il test allega un PNG generato (cat + codice randomizzato) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias dell'allowlist moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o elenco separato da virgole) per restringere
  - Gli sweep Gateway modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep moderno esaustivo oppure un numero positivo per un limite più piccolo.
- Come selezionare i provider (evita “tutto OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- Le sonde strumenti + immagini sono sempre attive in questo test live:
  - Sonda `read` + sonda `exec+read` (stress sugli strumenti)
  - La sonda immagine viene eseguita quando il modello dichiara il supporto all'input immagine
  - Flusso (ad alto livello):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente incorporato inoltra al modello un messaggio utente multimodale
    - Asserzione: la risposta contiene `cat` + il codice (tolleranza OCR: ammessi piccoli errori)

<Tip>
Per vedere cosa puoi testare sulla tua macchina (e gli ID `provider/model` esatti), esegui:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke del backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la tua configurazione predefinita.
- I valori predefiniti dello smoke specifici del backend vivono nella definizione `cli-backend.ts` dell'estensione proprietaria.
- Abilita:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Comando/argomenti/comportamento immagine provengono dai metadati del plugin backend CLI proprietario.
- Override (opzionali):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt). Le ricette Docker lo disattivano per impostazione predefinita, salvo richiesta esplicita.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece dell'iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` per aderire alla sonda di continuità nella stessa sessione Claude Sonnet -> Opus quando il modello selezionato supporta un target di cambio. Le ricette Docker lo disattivano per impostazione predefinita per l'affidabilità aggregata.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` per aderire alla sonda MCP/strumento local loopback. Le ricette Docker lo disattivano per impostazione predefinita, salvo richiesta esplicita.

Esempio:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke economico della configurazione MCP di Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Questo non chiede a Gemini di generare una risposta. Scrive le stesse impostazioni di sistema
che OpenClaw fornisce a Gemini, poi esegue `gemini --debug mcp list` per dimostrare che un
server `transport: "streamable-http"` salvato viene normalizzato nella forma MCP HTTP di Gemini
e può connettersi a un server MCP streamable-HTTP locale.

Ricetta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Ricette Docker per singolo provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Note:

- Il runner Docker si trova in `scripts/test-live-cli-backend-docker.sh`.
- Esegue lo smoke live del backend CLI dentro l'immagine Docker del repo come utente non root `node`.
- Risolve i metadati dello smoke CLI dall'estensione proprietaria, poi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile in cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile per l'abbonamento Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Prima dimostra `claude -p` diretto in Docker, poi esegue due turni backend CLI Gateway senza preservare le variabili env della chiave API Anthropic. Questa corsia di abbonamento disabilita per impostazione predefinita le sonde MCP/strumento e immagine di Claude perché Claude attualmente instrada l'uso di app di terze parti tramite fatturazione per uso extra invece che tramite i normali limiti del piano di abbonamento.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno testuale, turno di classificazione immagine, poi chiamata allo strumento MCP `cron` verificata tramite la CLI Gateway.
- Lo smoke predefinito di Claude applica anche una patch alla sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke di bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: validare il flusso reale di associazione conversazione ACP con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare in loco una conversazione sintetica di canale messaggi
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up arrivi nella trascrizione della sessione ACP associata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valori predefiniti:
  - agenti ACP in Docker: `claude,codex,gemini`
  - agente ACP per `pnpm test:live ...` diretto: `claude`
  - Canale sintetico: contesto di conversazione stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Note:
  - Questa corsia usa la superficie `chat.send` del Gateway con campi synthetic originating-route solo per amministratori, così i test possono allegare il contesto del canale messaggi senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agenti integrato del Plugin `acpx` incorporato per l’agente dell’harness ACP selezionato.
  - La creazione MCP Cron della sessione associata è best-effort per impostazione predefinita, perché gli harness ACP esterni possono annullare le chiamate MCP dopo che la prova di associazione/immagine è passata; imposta `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` per rendere rigorosa quella sonda Cron post-associazione.

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
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-acp-bind-docker.sh`.
- Per impostazione predefinita, esegue lo smoke di associazione ACP contro gli agenti CLI live aggregati in sequenza: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` per restringere la matrice.
- Esegue il source di `~/.profile`, prepara nel container il materiale di autenticazione CLI corrispondente, quindi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid tramite `https://app.factory.ai/cli`, `@google/gemini-cli` o `opencode-ai`) se manca. Il backend ACP stesso è il pacchetto `acpx/runtime` incorporato in bundle dal Plugin `acpx`.
- La variante Docker Droid prepara `~/.factory` per le impostazioni, inoltra `FACTORY_API_KEY` e richiede tale chiave API perché l’autenticazione locale Factory OAuth/keyring non è portabile nel container. Usa la voce di registro integrata di ACPX `droid exec --output-format acp`.
- La variante Docker OpenCode è una corsia di regressione rigorosa per singolo agente. Scrive un modello predefinito temporaneo `OPENCODE_CONFIG_CONTENT` da `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (predefinito `opencode/kimi-k2.6`) dopo il source di `~/.profile`, e `pnpm test:docker:live-acp-bind:opencode` richiede una trascrizione assistente associata invece di accettare lo skip generico post-associazione.
- Le chiamate CLI `acpx` dirette sono solo un percorso manuale/di workaround per confrontare il comportamento fuori dal Gateway. Lo smoke Docker di associazione ACP esercita il backend runtime `acpx` incorporato di OpenClaw.

## Live: smoke dell’harness app-server Codex

- Obiettivo: validare l’harness Codex di proprietà del Plugin tramite il normale metodo Gateway
  `agent`:
  - caricare il Plugin `codex` in bundle
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno agente Gateway a `openai/gpt-5.5` con l’harness Codex forzato
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread app-server possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso di comando Gateway
  - facoltativamente eseguire due sonde shell con escalation revisionate da Guardian: un comando benigno che dovrebbe essere approvato e un caricamento di falso segreto che dovrebbe essere negato così l’agente chiede conferma
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `openai/gpt-5.5`
- Sonda immagine facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/strumento facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda Guardian facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Lo smoke imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, così un harness Codex rotto non può passare ricadendo silenziosamente su PI.
- Autenticazione: autenticazione app-server Codex dal login della sottoscrizione Codex locale. Gli smoke Docker possono anche fornire `OPENAI_API_KEY` per sonde non Codex quando applicabile, più `~/.codex/auth.json` e `~/.codex/config.toml` copiati facoltativi.

Ricetta locale:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Ricetta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-codex-harness-docker.sh`.
- Esegue il source di `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file di autenticazione della CLI Codex quando presenti, installa `@openai/codex` in un prefisso npm montato scrivibile, prepara l’albero sorgente, quindi esegue solo il test live dell’harness Codex.
- Docker abilita per impostazione predefinita le sonde immagine, MCP/strumento e Guardian. Imposta `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando ti serve un’esecuzione di debug più ristretta.
- Docker esporta anche `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, in linea con la configurazione del test live, così alias legacy o fallback PI non possono nascondere una regressione dell’harness Codex.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono le più veloci e meno soggette a flakiness:

- Singolo modello, diretto (senza Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Singolo modello, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chiamata strumenti su più provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke Google adaptive thinking:
  - Se le chiavi locali vivono nel profilo shell: `source ~/.profile`
  - Predefinito dinamico Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Budget dinamico Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Note:

- `google/...` usa l’API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agente stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (autenticazione separata + particolarità degli strumenti).
- API Gemini vs CLI Gemini:
  - API: OpenClaw chiama l’API Gemini ospitata da Google via HTTP (chiave API / autenticazione profilo); è ciò che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw esegue una shell verso un binario locale `gemini`; ha la propria autenticazione e può comportarsi diversamente (supporto streaming/strumenti/disallineamento versioni).

## Live: matrice dei modelli (cosa copriamo)

Non esiste una “lista modelli CI” fissa (live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (chiamata strumenti + immagine)

Questa è l’esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI (non Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i modelli Gemini 2.x più vecchi)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui lo smoke Gateway con strumenti + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: chiamata strumenti (Read + Exec facoltativo)

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva facoltativa (utile da avere):

- xAI: `xai/grok-4` (o l’ultimo disponibile)
- Mistral: `mistral/`… (scegli un modello capace di “tools” che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; la chiamata strumenti dipende dalla modalità API)

### Visione: invio immagine (allegato → messaggio multimodale)

Includi almeno un modello capace di gestire immagini in `OPENCLAW_LIVE_GATEWAY_MODELS` (varianti Claude/Gemini/OpenAI con capacità visive, ecc.) per esercitare la sonda immagine.

### Aggregatori / Gateway alternativi

Se hai chiavi abilitate, supportiamo anche test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati capaci di strumenti+immagine)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (autenticazione tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/configurazione):

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualunque proxy compatibile con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

<Tip>
Non codificare staticamente "tutti i modelli" nella documentazione. La lista autorevole è ciò che `discoverModels(...)` restituisce sulla tua macchina più le chiavi disponibili.
</Tip>

## Credenziali (non committare mai)

I test live scoprono le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “nessuna credenziale”, esegui il debug nello stesso modo in cui faresti per `openclaw models list` / selezione del modello.

- Profili di autenticazione per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è ciò che “chiavi del profilo” significa nei test live)
- Configurazione: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home live di staging quando presente, ma non nell'archivio principale delle chiavi del profilo)
- Le esecuzioni live locali copiano per impostazione predefinita la configurazione attiva, i file `auth-profiles.json` per agente, `credentials/` legacy e le directory di autenticazione CLI esterne supportate in una home di test temporanea; le home live di staging saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così i probe restano fuori dal workspace reale del tuo host.

Se vuoi affidarti alle chiavi env (ad esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto (possono montare `~/.profile` nel container).

## Deepgram live (trascrizione audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Abilita: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Piano di codifica BytePlus live

- Test: `extensions/byteplus/live.test.ts`
- Abilita: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override opzionale del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Media del workflow ComfyUI live

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi immagine, video e `music_generate` comfy in bundle
  - Salta ogni capacità a meno che `plugins.entries.comfy.config.<capability>` non sia configurato
  - Utile dopo modifiche a invio workflow comfy, polling, download o registrazione plugin

## Generazione immagini live

- Test: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni plugin provider di generazione immagini registrato
  - Carica le env var provider mancanti dalla tua shell di login (`~/.profile`) prima del probing
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili di autenticazione salvati, così chiavi di test obsolete in `auth-profiles.json` non mascherano credenziali shell reali
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue ogni provider configurato tramite il runtime condiviso di generazione immagini:
    - `<provider>:generate`
    - `<provider>:edit` quando il provider dichiara il supporto alla modifica
- Provider in bundle attualmente coperti:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Restrizione opzionale:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamento di autenticazione opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'autenticazione dell'archivio profili e ignorare gli override solo env

Per il percorso CLI distribuito, aggiungi uno smoke `infer` dopo che il test live provider/runtime è passato:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Questo copre parsing degli argomenti CLI, risoluzione della configurazione/agente predefinito, attivazione del plugin in bundle, riparazione on-demand delle dipendenze runtime in bundle, il runtime condiviso di generazione immagini e la richiesta live al provider.

## Generazione musica live

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso provider condiviso in bundle di generazione musica
  - Attualmente copre Google e MiniMax
  - Carica le env var provider dalla tua shell di login (`~/.profile`) prima del probing
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili di autenticazione salvati, così chiavi di test obsolete in `auth-profiles.json` non mascherano credenziali shell reali
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della lane condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restrizione opzionale:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento di autenticazione opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'autenticazione dell'archivio profili e ignorare gli override solo env

## Generazione video live

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso provider condiviso in bundle di generazione video
  - Usa per impostazione predefinita il percorso smoke sicuro per la release: provider non FAL, una richiesta text-to-video per provider, prompt di un secondo con aragosta e un limite operativo per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Salta FAL per impostazione predefinita perché la latenza della coda lato provider può dominare il tempo di release; passa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Carica le env var provider dalla tua shell di login (`~/.profile`) prima del probing
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili di autenticazione salvati, così chiavi di test obsolete in `auth-profiles.json` non mascherano credenziali shell reali
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue solo `generate` per impostazione predefinita
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità di trasformazione dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale basato su buffer nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale basato su buffer nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché `veo3` in bundle è solo testo e `kling` in bundle richiede un URL immagine remoto
  - Copertura Vydra specifica per provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una lane `kling` che usa per impostazione predefinita una fixture con URL immagine remoto
  - Copertura live `videoToVideo` attuale:
    - `runway` solo quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché quei percorsi attualmente richiedono URL di riferimento `http(s)` / MP4 remoti
    - `google` perché l'attuale lane condivisa Gemini/Veo usa input locale basato su buffer e quel percorso non è accettato nello sweep condiviso
    - `openai` perché l'attuale lane condivisa non ha garanzie di accesso specifiche dell'organizzazione a inpaint/remix video
- Restrizione opzionale:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nello sweep predefinito, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il limite operativo di ogni provider per uno smoke run aggressivo
- Comportamento di autenticazione opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'autenticazione dell'archivio profili e ignorare gli override solo env

## Harness media live

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di immagini, musica e video tramite un unico entrypoint nativo del repo
  - Carica automaticamente le env var provider mancanti da `~/.profile`
  - Restringe automaticamente ogni suite ai provider che attualmente hanno autenticazione utilizzabile per impostazione predefinita
  - Riusa `scripts/test-live.mjs`, quindi il comportamento di Heartbeat e modalità silenziosa resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Correlati

- [Test](/it/help/testing) — suite unit, di integrazione, QA e Docker
