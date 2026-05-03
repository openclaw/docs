---
read_when:
    - Esecuzione degli smoke test della matrice dei modelli live / backend CLI / ACP / media-provider
    - Debug della risoluzione delle credenziali per i test live
    - Aggiungere un nuovo test live specifico del provider
sidebarTitle: Live tests
summary: 'Test live (che accedono alla rete): matrice dei modelli, backend CLI, ACP, provider multimediali, credenziali'
title: 'Test: suite live'
x-i18n:
    generated_at: "2026-05-03T21:36:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4057d8875fa3404108e89e4381c1dd14e96abbc2af13c4934fc6c0dbf878fc00
    source_path: help/testing-live.md
    workflow: 16
---

Per l'avvio rapido, i runner QA, le suite unità/integrazione e i flussi Docker, vedi
[Test](/it/help/testing). Questa pagina copre le suite di test **dal vivo** (che toccano la rete):
matrice dei modelli, backend CLI, ACP e test dal vivo dei provider multimediali, oltre alla
gestione delle credenziali.

## Dal vivo: comandi smoke del profilo locale

Sorgente `~/.profile` prima dei controlli dal vivo ad hoc, in modo che le chiavi dei provider e i percorsi degli strumenti locali
corrispondano alla tua shell:

```bash
source ~/.profile
```

Smoke multimediale sicuro:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke sicuro di prontezza per chiamata vocale:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` è un'esecuzione di prova a secco, a meno che non sia presente anche `--yes`. Usa `--yes` solo
quando vuoi intenzionalmente effettuare una vera chiamata di notifica. Per Twilio, Telnyx e
Plivo, un controllo di prontezza riuscito richiede un URL Webhook pubblico; i fallback solo locali
loopback/privati sono rifiutati per progettazione.

## Dal vivo: sweep delle capacità del nodo Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un nodo Android connesso e verificare il comportamento del contratto dei comandi.
- Ambito:
  - Configurazione manuale/precondizionata (la suite non installa/esegue/abbina l'app).
  - Convalida `node.invoke` del Gateway comando per comando per il nodo Android selezionato.
- Preconfigurazione richiesta:
  - App Android già connessa e abbinata al Gateway.
  - App mantenuta in primo piano.
  - Permessi/consenso alla cattura concessi per le capacità che ti aspetti superino il test.
- Override opzionali del target:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi della configurazione Android: [App Android](/it/platforms/android)

## Dal vivo: smoke dei modelli (chiavi profilo)

I test dal vivo sono divisi in due livelli, così possiamo isolare gli errori:

- “Modello diretto” ci dice se il provider/modello riesce a rispondere in assoluto con la chiave fornita.
- “Smoke Gateway” ci dice se l'intera pipeline gateway+agente funziona per quel modello (sessioni, cronologia, strumenti, policy sandbox, ecc.).

### Livello 1: completamento diretto del modello (nessun gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli scoperti
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove necessario)
- Come abilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias per modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` concentrato sullo smoke del Gateway
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire la lista consentita moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` è un alias per la lista consentita moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (lista consentita separata da virgole)
  - Gli sweep modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep moderno esaustivo o un numero positivo per un limite più piccolo.
  - Gli sweep esaustivi usano `OPENCLAW_LIVE_TEST_TIMEOUT_MS` per il timeout dell'intero test del modello diretto. Predefinito: 60 minuti.
  - Le sonde dei modelli diretti vengono eseguite con parallelismo a 20 vie per impostazione predefinita; imposta `OPENCLAW_LIVE_MODEL_CONCURRENCY` per eseguire l'override.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (lista consentita separata da virgole)
- Da dove provengono le chiavi:
  - Per impostazione predefinita: archivio profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre solo **archivio profili**
- Perché esiste:
  - Separa “l'API del provider è rotta / la chiave non è valida” da “la pipeline dell'agente Gateway è rotta”
  - Contiene regressioni piccole e isolate (esempio: replay del ragionamento OpenAI Responses/Codex Responses + flussi di chiamata strumento)

### Livello 2: Gateway + smoke agente dev (ciò che "@openclaw" fa realmente)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un Gateway nel processo
  - Creare/correggere una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare i modelli con chiavi e verificare:
    - risposta “significativa” (nessuno strumento)
    - funziona una vera invocazione di strumento (sonda di lettura)
    - sonde strumento extra opzionali (sonda exec+read)
    - i percorsi di regressione OpenAI (solo chiamata strumento → seguito) continuano a funzionare
- Dettagli delle sonde (così puoi spiegare rapidamente gli errori):
  - sonda `read`: il test scrive un file nonce nello spazio di lavoro e chiede all'agente di `read` leggerlo e restituire il nonce.
  - sonda `exec+read`: il test chiede all'agente di scrivere con `exec` un nonce in un file temporaneo, quindi di rileggerlo con `read`.
  - sonda immagine: il test allega un PNG generato (gatto + codice randomizzato) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: lista consentita moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias per la lista consentita moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o lista separata da virgole) per restringere
  - Gli sweep Gateway modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep moderno esaustivo o un numero positivo per un limite più piccolo.
- Come selezionare i provider (evita “tutto OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (lista consentita separata da virgole)
- Le sonde strumento + immagine sono sempre attive in questo test dal vivo:
  - sonda `read` + sonda `exec+read` (stress strumenti)
  - la sonda immagine viene eseguita quando il modello pubblicizza il supporto per input immagine
  - Flusso (alto livello):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente incorporato inoltra un messaggio utente multimodale al modello
    - Asserzione: la risposta contiene `cat` + il codice (tolleranza OCR: errori minori consentiti)

<Tip>
Per vedere cosa puoi testare sulla tua macchina (e gli ID `provider/model` esatti), esegui:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Dal vivo: smoke backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: convalidare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la configurazione predefinita.
- I valori predefiniti dello smoke specifici del backend risiedono nella definizione `cli-backend.ts` del Plugin proprietario.
- Abilitazione:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Comportamento comando/argomenti/immagine proveniente dai metadati del Plugin backend CLI proprietario.
- Override (opzionali):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt). Le ricette Docker lo disattivano per impostazione predefinita, salvo richiesta esplicita.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece dell'iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e convalidare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` per aderire alla sonda di continuità nella stessa sessione Claude Sonnet -> Opus quando il modello selezionato supporta un target di cambio. Le ricette Docker lo disattivano per impostazione predefinita per l'affidabilità aggregata.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` per aderire alla sonda MCP/strumento loopback. Le ricette Docker lo disattivano per impostazione predefinita, salvo richiesta esplicita.

Esempio:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke economico della configurazione MCP Gemini:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Questo non chiede a Gemini di generare una risposta. Scrive le stesse
impostazioni di sistema che OpenClaw fornisce a Gemini, quindi esegue `gemini --debug mcp list` per dimostrare che un
server salvato `transport: "streamable-http"` viene normalizzato nella forma HTTP MCP di Gemini
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

- Il runner Docker risiede in `scripts/test-live-cli-backend-docker.sh`.
- Esegue lo smoke dal vivo del backend CLI dentro l'immagine Docker del repo come utente non root `node`.
- Risolve i metadati dello smoke CLI dal Plugin proprietario, quindi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile memorizzato nella cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile dell'abbonamento Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Dimostra prima `claude -p` diretto in Docker, quindi esegue due turni backend CLI Gateway senza preservare le variabili env della chiave API Anthropic. Questa corsia di abbonamento disabilita per impostazione predefinita le sonde MCP/strumento e immagine di Claude perché Claude attualmente instrada l'uso di app di terze parti tramite fatturazione per uso extra invece dei normali limiti del piano di abbonamento.
- Lo smoke dal vivo del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno testuale, turno di classificazione immagine, quindi chiamata strumento MCP `cron` verificata tramite la CLI Gateway.
- Lo smoke predefinito di Claude corregge anche la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Dal vivo: smoke di binding ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: convalidare il flusso reale di associazione conversazione ACP con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare sul posto una conversazione sintetica di canale messaggi
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up arrivi nella trascrizione della sessione ACP associata
- Abilitare:
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
  - Questa lane usa la superficie `chat.send` del Gateway con campi di route originante sintetica solo per amministratori, così i test possono collegare il contesto del canale messaggi senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agenti integrato del Plugin `acpx` incorporato per l’agente harness ACP selezionato.
  - La creazione MCP Cron della sessione associata è best-effort per impostazione predefinita, perché gli harness ACP esterni possono annullare le chiamate MCP dopo che la prova di bind/immagine è passata; impostare `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` per rendere rigorosa quella sonda Cron post-bind.

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
- Per impostazione predefinita, esegue lo smoke ACP bind contro gli agenti CLI live aggregati in sequenza: `claude`, `codex`, poi `gemini`.
- Usare `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` oppure `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` per restringere la matrice.
- Esegue il source di `~/.profile`, prepara nel container il materiale di autenticazione CLI corrispondente, quindi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid tramite `https://app.factory.ai/cli`, `@google/gemini-cli` oppure `opencode-ai`) se manca. Il backend ACP stesso è il pacchetto `acpx/runtime` incorporato dal Plugin ufficiale `acpx`.
- La variante Docker Droid prepara `~/.factory` per le impostazioni, inoltra `FACTORY_API_KEY` e richiede quella chiave API perché l’autenticazione locale Factory OAuth/keyring non è portabile nel container. Usa la voce di registro integrata di ACPX `droid exec --output-format acp`.
- La variante Docker OpenCode è una lane di regressione rigorosa per singolo agente. Scrive un modello predefinito temporaneo `OPENCODE_CONFIG_CONTENT` da `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (predefinito `opencode/kimi-k2.6`) dopo il source di `~/.profile`, e `pnpm test:docker:live-acp-bind:opencode` richiede una trascrizione dell’assistente associata invece di accettare il generico skip post-bind.
- Le chiamate CLI dirette a `acpx` sono solo un percorso manuale/di workaround per confrontare il comportamento fuori dal Gateway. Lo smoke ACP bind Docker esercita il backend runtime `acpx` incorporato di OpenClaw.

## Live: smoke dell’harness app-server Codex

- Obiettivo: convalidare l’harness Codex di proprietà del Plugin tramite il normale metodo gateway
  `agent`:
  - caricare il Plugin `codex` in bundle
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno dell’agente Gateway a `openai/gpt-5.5` con l’harness Codex forzato
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread app-server possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso di comando Gateway
  - facoltativamente eseguire due sonde shell con escalation revisionate da Guardian: un comando benigno che dovrebbe essere approvato e un caricamento con segreto falso che dovrebbe essere negato così l’agente risponde con una domanda
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitare: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `openai/gpt-5.5`
- Sonda immagine facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/tool facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda Guardian facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Lo smoke usa `agentRuntime.id: "codex"` così un harness Codex rotto non può passare ricadendo silenziosamente su PI.
- Autenticazione: autenticazione app-server Codex dal login dell’abbonamento Codex locale. Gli smoke Docker possono anche fornire `OPENAI_API_KEY` per sonde non Codex quando applicabile, più eventuali `~/.codex/auth.json` e `~/.codex/config.toml` copiati.

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
- Esegue il source del `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file di autenticazione CLI Codex quando presenti, installa `@openai/codex` in un prefisso npm montato e scrivibile, prepara l’albero sorgente, quindi esegue solo il test live dell’harness Codex.
- Docker abilita per impostazione predefinita le sonde immagine, MCP/tool e Guardian. Impostare `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oppure `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oppure `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando serve un’esecuzione di debug più ristretta.
- Docker usa la stessa configurazione runtime Codex esplicita, quindi alias legacy o fallback PI non possono nascondere una regressione dell’harness Codex.

### Ricette live consigliate

Le allowlist ristrette ed esplicite sono le più rapide e le meno instabili:

- Singolo modello, diretto (senza gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Singolo modello, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chiamata tool tra più provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke di adaptive thinking Google:
  - Se le chiavi locali stanno nel profilo shell: `source ~/.profile`
  - Predefinito dinamico Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Budget dinamico Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Note:

- `google/...` usa l’API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agente in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (autenticazione separata + particolarità degli strumenti).
- Gemini API vs Gemini CLI:
  - API: OpenClaw chiama l’API Gemini ospitata da Google su HTTP (chiave API / autenticazione profilo); questo è ciò che la maggior parte degli utenti intende per “Gemini”.
  - CLI: OpenClaw invoca tramite shell un binario locale `gemini`; ha la propria autenticazione e può comportarsi diversamente (supporto streaming/tool/disallineamento versioni).

## Live: matrice modelli (cosa copriamo)

Non esiste una “lista modelli CI” fissa (live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (chiamata tool + immagine)

Questa è l’esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI (non Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evitare i modelli Gemini 2.x più vecchi)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Eseguire lo smoke Gateway con tool + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: chiamata tool (Read + Exec facoltativo)

Sceglierne almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oppure `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva facoltativa (utile da avere):

- xAI: `xai/grok-4.3` (oppure l’ultimo disponibile)
- Mistral: `mistral/`… (scegliere un modello capace di “tools” che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; la chiamata tool dipende dalla modalità API)

### Vision: invio immagine (allegato → messaggio multimodale)

Includere almeno un modello capace di immagini in `OPENCLAW_LIVE_GATEWAY_MODELS` (varianti Claude/Gemini/OpenAI con capacità vision, ecc.) per esercitare la sonda immagine.

### Aggregatori / gateway alternativi

Se hai chiavi abilitate, supportiamo anche il test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usare `openclaw models scan` per trovare candidati capaci di tool+immagine)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (autenticazione tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/configurazione):

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualsiasi proxy compatibile con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

<Tip>
Non codificare rigidamente "all models" nella documentazione. La lista autorevole è qualunque cosa `discoverModels(...)` restituisca sulla tua macchina più le chiavi disponibili.
</Tip>

## Credenziali (mai fare commit)

I test live scoprono le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “no creds”, esegui il debug nello stesso modo in cui eseguiresti il debug di `openclaw models list` / della selezione del modello.

- Profili di autenticazione per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è ciò che “profile keys” significa nei test live)
- Configurazione: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home live in staging quando presente, ma non nell’archivio principale delle chiavi profilo)
- Le esecuzioni live locali copiano per impostazione predefinita la configurazione attiva, i file `auth-profiles.json` per agente, `credentials/` legacy e le directory di autenticazione CLI esterne supportate in una home di test temporanea; le home live in staging saltano `workspace/` e `sandboxes/`, e gli override dei percorsi `agents.*.workspace` / `agentDir` vengono rimossi, così le sonde restano fuori dalla tua workspace host reale.

Se vuoi fare affidamento sulle chiavi env (ad esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto (possono montare `~/.profile` nel container).

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
  - Esercita i percorsi comfy inclusi per immagine, video e `music_generate`
  - Salta ciascuna capability a meno che `plugins.entries.comfy.config.<capability>` non sia configurata
  - Utile dopo modifiche all’invio di workflow comfy, al polling, ai download o alla registrazione del Plugin

## Generazione di immagini live

- Test: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni Plugin provider di generazione immagini registrato
  - Carica le variabili env del provider mancanti dalla tua shell di login (`~/.profile`) prima della sonda
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili di autenticazione salvati, così le chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue ogni provider configurato tramite il runtime condiviso di generazione immagini:
    - `<provider>:generate`
    - `<provider>:edit` quando il provider dichiara il supporto alla modifica
- Provider inclusi attualmente coperti:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Restringimento opzionale:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamento di autenticazione opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’autenticazione dall’archivio profili e ignorare gli override solo env

Per il percorso CLI rilasciato, aggiungi uno smoke `infer` dopo che il test live provider/runtime è passato:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Questo copre il parsing degli argomenti CLI, la risoluzione della configurazione/agente predefinito, l’attivazione del Plugin incluso, il runtime condiviso di generazione immagini e la richiesta live al provider. Le dipendenze del Plugin devono essere presenti prima del caricamento del runtime.

## Generazione musicale live

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso del provider di generazione musicale incluso
  - Attualmente copre Google e MiniMax
  - Carica le variabili env del provider dalla tua shell di login (`~/.profile`) prima della sonda
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili di autenticazione salvati, così le chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della lane condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restringimento opzionale:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento di autenticazione opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’autenticazione dall’archivio profili e ignorare gli override solo env

## Generazione video live

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilita: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso del provider di generazione video incluso
  - Per impostazione predefinita usa il percorso smoke sicuro per il rilascio: provider non FAL, una richiesta text-to-video per provider, prompt di un secondo con aragosta e un limite operativo per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Salta FAL per impostazione predefinita perché la latenza della coda lato provider può dominare il tempo di rilascio; passa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Carica le variabili env del provider dalla tua shell di login (`~/.profile`) prima della sonda
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili di autenticazione salvati, così le chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue solo `generate` per impostazione predefinita
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità di trasformazione dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale basato su buffer nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale basato su buffer nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché il `veo3` incluso è solo testo e il `kling` incluso richiede un URL immagine remoto
  - Copertura specifica per provider Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una lane `kling` che usa per impostazione predefinita una fixture URL immagine remota
  - Copertura live attuale di `videoToVideo`:
    - solo `runway` quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché quei percorsi attualmente richiedono URL di riferimento remoti `http(s)` / MP4
    - `google` perché la lane condivisa Gemini/Veo attuale usa input locale basato su buffer e quel percorso non è accettato nello sweep condiviso
    - `openai` perché la lane condivisa attuale non ha garanzie di accesso specifiche per org a video inpaint/remix
- Restringimento opzionale:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nello sweep predefinito, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il limite operativo di ciascun provider per una smoke run aggressiva
- Comportamento di autenticazione opzionale:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l’autenticazione dall’archivio profili e ignorare gli override solo env

## Harness media live

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di immagini, musica e video tramite un unico entrypoint nativo del repo
  - Carica automaticamente le variabili env del provider mancanti da `~/.profile`
  - Restringe automaticamente per impostazione predefinita ciascuna suite ai provider che attualmente hanno un’autenticazione utilizzabile
  - Riusa `scripts/test-live.mjs`, così il comportamento di Heartbeat e modalità silenziosa resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Correlati

- [Testing](/it/help/testing) — suite unit, di integrazione, QA e Docker
