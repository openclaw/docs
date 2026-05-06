---
read_when:
    - Esecuzione degli smoke test live per matrice dei modelli / motore CLI / ACP / media-provider
    - Debug della risoluzione delle credenziali per i test live
    - Aggiungere un nuovo test live specifico del provider
sidebarTitle: Live tests
summary: 'Test reali (che accedono alla rete): matrice dei modelli, backend CLI, ACP, provider multimediali, credenziali'
title: 'Test: suite live'
x-i18n:
    generated_at: "2026-05-06T08:54:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

Per l'avvio rapido, i runner QA, le suite unit/integration e i flussi Docker, vedi
[Testing](/it/help/testing). Questa pagina copre le suite di test **live** (con accesso alla rete):
matrice dei modelli, backend CLI, ACP e test live dei provider multimediali, oltre
alla gestione delle credenziali.

## Live: comandi smoke per profilo locale

Esegui `source ~/.profile` prima dei controlli live ad hoc, in modo che le chiavi dei provider e i percorsi degli strumenti locali corrispondano alla tua shell:

```bash
source ~/.profile
```

Smoke multimediale sicuro:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke sicuro di preparazione alle chiamate vocali:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` è una prova a secco, a meno che non sia presente anche `--yes`. Usa `--yes` solo
quando vuoi intenzionalmente effettuare una vera chiamata di notifica. Per Twilio, Telnyx e
Plivo, un controllo di preparazione riuscito richiede un URL webhook pubblico; i fallback
solo locali loopback/privati vengono rifiutati per progettazione.

## Live: sweep delle capacità del nodo Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un nodo Android connesso e verificare il comportamento del contratto dei comandi.
- Ambito:
  - Configurazione manuale/precondizionata (la suite non installa/esegue/associa l'app).
  - Validazione comando per comando di `node.invoke` del Gateway per il nodo Android selezionato.
- Preconfigurazione richiesta:
  - App Android già connessa e associata al gateway.
  - App mantenuta in primo piano.
  - Permessi/consenso di acquisizione concessi per le capacità che ti aspetti passino.
- Override opzionali del target:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi della configurazione Android: [App Android](/it/platforms/android)

## Live: smoke dei modelli (chiavi profilo)

I test live sono divisi in due livelli, così possiamo isolare gli errori:

- "Modello diretto" ci dice se il provider/modello può rispondere con la chiave fornita.
- "Gateway smoke" ci dice se l'intera pipeline gateway+agent funziona per quel modello (sessioni, cronologia, strumenti, policy sandbox, ecc.).

### Livello 1: completamento diretto del modello (senza gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli scoperti
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove necessario)
- Come abilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias per modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` concentrato sul Gateway smoke
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire la allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` è un alias per la allowlist moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep moderno esaustivo o un numero positivo per un limite più piccolo.
  - Gli sweep esaustivi usano `OPENCLAW_LIVE_TEST_TIMEOUT_MS` per il timeout dell'intero test diretto sui modelli. Predefinito: 60 minuti.
  - Le probe dirette dei modelli vengono eseguite con parallelismo a 20 vie per impostazione predefinita; imposta `OPENCLAW_LIVE_MODEL_CONCURRENCY` per sovrascriverlo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per impostazione predefinita: store dei profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre solo lo **store dei profili**
- Perché esiste:
  - Separa "l'API del provider è rotta / la chiave non è valida" da "la pipeline agente del gateway è rotta"
  - Contiene piccole regressioni isolate (esempio: replay del reasoning OpenAI Responses/Codex Responses + flussi tool-call)

### Livello 2: Gateway + smoke dell'agente dev (ciò che "@openclaw" fa davvero)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/patchare una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare sui modelli con chiavi e verificare:
    - risposta "significativa" (senza strumenti)
    - una vera invocazione di strumento funziona (probe di lettura)
    - probe opzionali aggiuntive degli strumenti (probe exec+read)
    - i percorsi di regressione OpenAI (solo tool-call → follow-up) continuano a funzionare
- Dettagli delle probe (così puoi spiegare rapidamente gli errori):
  - probe `read`: il test scrive un file nonce nel workspace e chiede all'agente di eseguirne `read` e restituire il nonce.
  - probe `exec+read`: il test chiede all'agente di scrivere con `exec` un nonce in un file temporaneo, poi leggerlo con `read`.
  - probe immagine: il test allega un PNG generato (gatto + codice randomizzato) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias per la allowlist moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o elenco separato da virgole) per restringere
  - Gli sweep Gateway modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep moderno esaustivo o un numero positivo per un limite più piccolo.
- Come selezionare i provider (evita "tutto OpenRouter"):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- Le probe strumenti + immagini sono sempre attive in questo test live:
  - probe `read` + probe `exec+read` (stress sugli strumenti)
  - la probe immagine viene eseguita quando il modello dichiara supporto per input immagine
  - Flusso (ad alto livello):
    - Il test genera un piccolo PNG con "CAT" + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente incorporato inoltra al modello un messaggio utente multimodale
    - Asserzione: la risposta contiene `cat` + il codice (tolleranza OCR: consentiti piccoli errori)

<Tip>
Per vedere cosa puoi testare sulla tua macchina (e gli ID `provider/model` esatti), esegui:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: smoke backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la tua configurazione predefinita.
- Le impostazioni smoke predefinite specifiche del backend risiedono nella definizione `cli-backend.ts` del Plugin proprietario.
- Abilita:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Comando/argomenti/comportamento immagini arrivano dai metadati del Plugin backend CLI proprietario.
- Override (opzionali):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt). Le recipe Docker lo disattivano per impostazione predefinita, salvo richiesta esplicita.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece dell'iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) per controllare come vengono passati gli argomenti immagine quando `IMAGE_ARG` è impostato.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di ripresa.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` per abilitare esplicitamente la probe di continuità nella stessa sessione Claude Sonnet -> Opus quando il modello selezionato supporta un target di switch. Le recipe Docker la disattivano per impostazione predefinita per affidabilità aggregata.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` per abilitare esplicitamente la probe MCP/tool loopback. Le recipe Docker la disattivano per impostazione predefinita, salvo richiesta esplicita.

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

Questo non chiede a Gemini di generare una risposta. Scrive le stesse impostazioni di sistema
che OpenClaw fornisce a Gemini, poi esegue `gemini --debug mcp list` per dimostrare che un
server `transport: "streamable-http"` salvato viene normalizzato nella forma HTTP MCP di Gemini
e può connettersi a un server MCP streamable-HTTP locale.

Recipe Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recipe Docker per provider singolo:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Note:

- Il runner Docker si trova in `scripts/test-live-cli-backend-docker.sh`.
- Esegue lo smoke live del backend CLI dentro l'immagine Docker del repo come utente non root `node`.
- Risolve i metadati smoke CLI dal Plugin proprietario, poi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile con cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile per l'abbonamento Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Dimostra prima `claude -p` diretto in Docker, poi esegue due turni del backend CLI Gateway senza preservare le variabili env della chiave API Anthropic. Questa lane di abbonamento disabilita per impostazione predefinita le probe Claude MCP/tool e immagine perché Claude attualmente instrada l'uso di app di terze parti tramite fatturazione di uso extra invece dei normali limiti del piano di abbonamento.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno testuale, turno di classificazione immagine, poi chiamata dello strumento MCP `cron` verificata tramite la CLI Gateway.
- Lo smoke predefinito di Claude patcha anche la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: raggiungibilità del proxy APNs HTTP/2

- Test: `src/infra/push-apns-http2.live.test.ts`
- Obiettivo: fare tunnel attraverso un proxy HTTP CONNECT locale verso l'endpoint APNs sandbox di Apple, inviare la richiesta di validazione APNs HTTP/2 e verificare che la vera risposta `403 InvalidProviderToken` di Apple ritorni attraverso il percorso proxy.
- Abilita:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Timeout opzionale:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: convalidare il flusso reale di associazione delle conversazioni ACP con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare sul posto una conversazione sintetica di canale messaggi
  - inviare un normale follow-up sulla stessa conversazione
  - verificare che il follow-up arrivi nella trascrizione della sessione ACP associata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valori predefiniti:
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
  - Questa lane usa la superficie `chat.send` del Gateway con campi admin-only per la route di origine sintetica, così i test possono collegare il contesto di canale messaggi senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agenti integrato del Plugin `acpx` incorporato per l'agente harness ACP selezionato.
  - La creazione MCP di Cron per la sessione associata è best-effort per impostazione predefinita, perché gli harness ACP esterni possono annullare le chiamate MCP dopo che la prova bind/immagine è passata; imposta `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` per rendere rigorosa quella sonda Cron post-bind.

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
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` oppure `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` per restringere la matrice.
- Esegue il source di `~/.profile`, prepara nel container il materiale di autenticazione CLI corrispondente, poi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid tramite `https://app.factory.ai/cli`, `@google/gemini-cli` oppure `opencode-ai`) se manca. Il backend ACP stesso è il pacchetto `acpx/runtime` incorporato dal Plugin ufficiale `acpx`.
- La variante Docker Droid prepara `~/.factory` per le impostazioni, inoltra `FACTORY_API_KEY` e richiede quella chiave API perché l'autenticazione OAuth/keyring locale di Factory non è portabile nel container. Usa la voce di registro integrata di ACPX `droid exec --output-format acp`.
- La variante Docker OpenCode è una lane di regressione rigorosa per singolo agente. Scrive un modello predefinito temporaneo `OPENCODE_CONFIG_CONTENT` da `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (predefinito `opencode/kimi-k2.6`) dopo il source di `~/.profile`, e `pnpm test:docker:live-acp-bind:opencode` richiede una trascrizione assistente associata invece di accettare lo skip generico post-bind.
- Le chiamate CLI `acpx` dirette sono solo un percorso manuale/di workaround per confrontare il comportamento fuori dal Gateway. Lo smoke Docker ACP bind esercita il backend runtime `acpx` incorporato di OpenClaw.

## Live: smoke dell'harness app-server Codex

- Obiettivo: convalidare l'harness Codex di proprietà del Plugin tramite il normale metodo gateway
  `agent`:
  - caricare il Plugin `codex` incluso
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno agente gateway a `openai/gpt-5.5` con l'harness Codex forzato
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread app-server
    possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso di comando gateway
  - opzionalmente eseguire due sonde shell con escalation revisionate da Guardian: un comando benigno
    che dovrebbe essere approvato e un caricamento con finto segreto che dovrebbe essere
    negato, così l'agente chiede conferma
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `openai/gpt-5.5`
- Sonda immagine opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/tool opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda Guardian opzionale: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Lo smoke usa `agentRuntime.id: "codex"`, così un harness Codex rotto non può
  passare ripiegando silenziosamente su PI.
- Autenticazione: autenticazione app-server Codex dal login locale all'abbonamento Codex. Gli smoke Docker
  possono anche fornire `OPENAI_API_KEY` per sonde non Codex quando applicabile,
  più eventuali `~/.codex/auth.json` e `~/.codex/config.toml` copiati.

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
- Esegue il source del `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file di
  autenticazione della CLI Codex quando presenti, installa `@openai/codex` in un prefisso npm
  montato scrivibile, prepara l'albero dei sorgenti, poi esegue solo il test live dell'harness Codex.
- Docker abilita per impostazione predefinita le sonde immagine, MCP/tool e Guardian. Imposta
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` oppure
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando serve una run di debug più ristretta.
- Docker usa la stessa configurazione runtime Codex esplicita, quindi alias legacy o fallback PI
  non possono nascondere una regressione dell'harness Codex.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono le più rapide e meno instabili:

- Singolo modello, diretto (senza gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Singolo modello, smoke gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chiamata di tool su diversi provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke del thinking adattivo Google:
  - Se le chiavi locali sono nel profilo shell: `source ~/.profile`
  - Predefinito dinamico Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Budget dinamico Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Note:

- `google/...` usa l'API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agente in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (autenticazione separata + particolarità degli strumenti).
- API Gemini vs CLI Gemini:
  - API: OpenClaw chiama l'API Gemini ospitata da Google via HTTP (chiave API / autenticazione profilo); è ciò che la maggior parte degli utenti intende per "Gemini".
  - CLI: OpenClaw esegue una shell verso un binario locale `gemini`; ha la propria autenticazione e può comportarsi diversamente (supporto streaming/tool/disallineamento di versione).

## Live: matrice dei modelli (cosa copriamo)

Non esiste una "lista modelli CI" fissa (live è opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (chiamata di tool + immagine)

Questa è la run dei "modelli comuni" che ci aspettiamo continui a funzionare:

- OpenAI (non Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i vecchi modelli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui lo smoke gateway con tool + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: chiamata di tool (Read + Exec opzionale)

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva opzionale (utile da avere):

- xAI: `xai/grok-4.3` (o il più recente disponibile)
- Mistral: `mistral/`… (scegli un modello capace di usare "tools" che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; la chiamata di tool dipende dalla modalità API)

### Visione: invio immagine (allegato → messaggio multimodale)

Includi almeno un modello capace di immagini in `OPENCLAW_LIVE_GATEWAY_MODELS` (varianti Claude/Gemini/OpenAI con capacità vision, ecc.) per esercitare la sonda immagine.

### Aggregatori / gateway alternativi

Se hai chiavi abilitate, supportiamo anche il testing tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati capaci di tool+immagine)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (autenticazione tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/configurazione):

- Integrati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualunque proxy compatibile con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

<Tip>
Non codificare "tutti i modelli" nella documentazione. La lista autorevole è qualunque cosa `discoverModels(...)` restituisca sulla tua macchina, più le chiavi disponibili.
</Tip>

## Credenziali (non eseguire mai commit)

I test live individuano le credenziali nello stesso modo della CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice "no creds", esegui il debug come faresti per `openclaw models list` / la selezione del modello.

- Profili di autenticazione per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è ciò che significa "chiavi di profilo" nei test in tempo reale)
- Configurazione: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Directory di stato legacy: `~/.openclaw/credentials/` (copiata nella home temporanea predisposta per i test in tempo reale quando presente, ma non nello store principale delle chiavi di profilo)
- Le esecuzioni locali in tempo reale copiano per impostazione predefinita la configurazione attiva, i file `auth-profiles.json` per agente, `credentials/` legacy e le directory di autenticazione CLI esterne supportate in una home di test temporanea; le home temporanee predisposte per i test in tempo reale saltano `workspace/` e `sandboxes/`, e le sostituzioni di percorso `agents.*.workspace` / `agentDir` vengono rimosse in modo che le sonde restino fuori dal workspace reale del tuo host.

Se vuoi fare affidamento su chiavi env (ad esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto (possono montare `~/.profile` nel container).

## Deepgram in tempo reale (trascrizione audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Piano di codifica BytePlus in tempo reale

- Test: `extensions/byteplus/live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Sostituzione facoltativa del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Media workflow ComfyUI in tempo reale

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi comfy in bundle per immagini, video e `music_generate`
  - Salta ogni funzionalità a meno che `plugins.entries.comfy.config.<capability>` sia configurato
  - Utile dopo modifiche all'invio dei workflow comfy, al polling, ai download o alla registrazione del plugin

## Generazione immagini in tempo reale

- Test: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni Plugin provider di generazione immagini registrato
  - Carica le variabili env mancanti del provider dalla tua shell di login (`~/.profile`) prima di sondare
  - Usa per impostazione predefinita le chiavi API in tempo reale/env prima dei profili di autenticazione salvati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
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
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamento di autenticazione facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'autenticazione dallo store dei profili e ignorare le sostituzioni solo env

Per il percorso CLI distribuito, aggiungi uno smoke `infer` dopo che il test in tempo reale del provider/runtime è riuscito:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Questo copre il parsing degli argomenti CLI, la risoluzione di configurazione/agente predefinito, l'attivazione del plugin in bundle, il runtime condiviso di generazione immagini e la richiesta in tempo reale al provider. È previsto che le dipendenze del plugin siano presenti prima del caricamento del runtime.

## Generazione musica in tempo reale

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso dei provider di generazione musica in bundle
  - Attualmente copre Google e MiniMax
  - Carica le variabili env del provider dalla tua shell di login (`~/.profile`) prima di sondare
  - Usa per impostazione predefinita le chiavi API in tempo reale/env prima dei profili di autenticazione salvati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input di solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della corsia condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file Comfy in tempo reale separato, non questa scansione condivisa
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento di autenticazione facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'autenticazione dallo store dei profili e ignorare le sostituzioni solo env

## Generazione video in tempo reale

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso dei provider di generazione video in bundle
  - Usa come impostazione predefinita il percorso smoke sicuro per la release: provider non FAL, una richiesta da testo a video per provider, prompt di un secondo con aragosta e un limite operativo per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Salta FAL per impostazione predefinita perché la latenza della coda lato provider può dominare il tempo di release; passa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Carica le variabili env del provider dalla tua shell di login (`~/.profile`) prima di sondare
  - Usa per impostazione predefinita le chiavi API in tempo reale/env prima dei profili di autenticazione salvati, così chiavi di test obsolete in `auth-profiles.json` non mascherano le credenziali reali della shell
  - Salta i provider senza autenticazione/profilo/modello utilizzabile
  - Esegue solo `generate` per impostazione predefinita
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità di trasformazione dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale basato su buffer nella scansione condivisa
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale basato su buffer nella scansione condivisa
  - Provider `imageToVideo` attualmente dichiarati ma saltati nella scansione condivisa:
    - `vydra` perché `veo3` in bundle è solo testo e `kling` in bundle richiede un URL immagine remoto
  - Copertura Vydra specifica del provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` da testo a video più una corsia `kling` che usa per impostazione predefinita una fixture URL immagine remota
  - Copertura in tempo reale attuale di `videoToVideo`:
    - `runway` solo quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nella scansione condivisa:
    - `alibaba`, `qwen`, `xai` perché quei percorsi attualmente richiedono URL di riferimento remoti `http(s)` / MP4
    - `google` perché la corsia Gemini/Veo condivisa attuale usa input locale basato su buffer e quel percorso non è accettato nella scansione condivisa
    - `openai` perché alla corsia condivisa attuale mancano garanzie di accesso specifiche dell'organizzazione per inpaint/remix video
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nella scansione predefinita, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il limite di ogni operazione del provider per un'esecuzione smoke aggressiva
- Comportamento di autenticazione facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'autenticazione dallo store dei profili e ignorare le sostituzioni solo env

## Harness media in tempo reale

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite condivise in tempo reale di immagini, musica e video tramite un unico entrypoint nativo del repo
  - Carica automaticamente le variabili env mancanti del provider da `~/.profile`
  - Restringe automaticamente per impostazione predefinita ogni suite ai provider che al momento hanno autenticazione utilizzabile
  - Riutilizza `scripts/test-live.mjs`, così il comportamento di Heartbeat e modalità silenziosa resta coerente
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Correlati

- [Test](/it/help/testing) - suite unità, integrazione, QA e Docker
