---
read_when:
    - Vuoi usare l’harness SDK di GitHub Copilot per un agente
    - Ti servono esempi di configurazione per l'ambiente di esecuzione `copilot`
    - Stai collegando un agente a Copilot con abbonamento (github / openclaw / copilot) e vuoi eseguirlo tramite la Copilot CLI
summary: Esegui i turni dell'agente incorporato di OpenClaw tramite l'harness SDK esterno di GitHub Copilot
title: Harness SDK Copilot
x-i18n:
    generated_at: "2026-06-27T17:49:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Il plugin esterno `@openclaw/copilot` consente a OpenClaw di eseguire turni dell'agente Copilot con sottoscrizione incorporata tramite la GitHub Copilot CLI (`@github/copilot-sdk`) invece dell'harness PI integrato.

Usa l'harness Copilot SDK quando vuoi che la sessione Copilot CLI gestisca il ciclo agente di basso livello: esecuzione nativa degli strumenti, compaction nativa (`infiniteSessions`) e stato dei thread gestito dalla CLI sotto `copilotHome`. OpenClaw continua a gestire canali chat, file di sessione, selezione del modello, strumenti dinamici OpenClaw (collegati tramite bridge), approvazioni, consegna dei media, mirror visibile della trascrizione, domande laterali `/btw` (gestite dal fallback PI nel tree — vedi [Domande laterali (`/btw`)](#side-questions-btw)) e `openclaw doctor`.

Per la suddivisione più ampia tra modello/provider/runtime, inizia da [Runtime degli agenti](/it/concepts/agent-runtimes).

## Requisiti

- OpenClaw con il plugin `@openclaw/copilot` installato.
- Se la tua configurazione usa `plugins.allow`, includi `copilot` (l'id del manifest dichiarato dal plugin). Una allowlist restrittiva che usa il nome del pacchetto in stile npm `@openclaw/copilot` lascerà il plugin bloccato e il runtime non verrà caricato anche con `agentRuntime.id: "copilot"`.
- Una sottoscrizione GitHub Copilot in grado di usare la Copilot CLI (o una voce `gitHubToken` env / auth-profile per esecuzioni headless / cron).
- Una directory `copilotHome` scrivibile. L'harness usa per impostazione predefinita `<agentDir>/copilot` quando OpenClaw fornisce una directory agente, altrimenti `~/.openclaw/agents/<agentId>/copilot` per un isolamento completo per agente.

`openclaw doctor` esegue il [contratto doctor](#doctor) del plugin per la proprietà dichiarativa dello stato di sessione e future migrazioni di compatibilità. Non esegue sonde dell'ambiente Copilot CLI.

## Installazione del Plugin

Il runtime Copilot è un plugin esterno, quindi il pacchetto core `openclaw` non include la dipendenza `@github/copilot-sdk` né il relativo binario CLI specifico per piattaforma `@github/copilot-<platform>-<arch>`. Insieme aggiungono circa 260 MB, quindi installali solo per gli agenti che scelgono questo runtime:

```bash
openclaw plugins install @openclaw/copilot
```

La procedura guidata installa il plugin la prima volta che selezioni un modello `github-copilot/*` **e** la tua configurazione instrada il modello (o il suo provider) nel runtime agente Copilot tramite `agentRuntime: { id: "copilot" }` (vedi [Avvio rapido](#quickstart) sotto). Senza l'opt-in, openclaw usa il suo provider GitHub Copilot integrato e non installa mai il plugin runtime.

Il runtime risolve l'SDK in questo ordine:

1. `import("@github/copilot-sdk")` dal pacchetto `@openclaw/copilot` installato.
2. La directory di fallback nota `~/.openclaw/npm-runtime/copilot/` (il target legacy di installazione on-demand).

Un SDK mancante produce un unico errore con codice `COPILOT_SDK_MISSING` e il comando di reinstallazione del plugin riportato sopra.

## Avvio rapido

Fissa un modello (o un provider) all'harness:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Entrambi i percorsi sono equivalenti. Usa `agentRuntime.id` su una singola voce modello quando solo quel modello deve essere instradato attraverso l'harness; imposta `agentRuntime.id` su un provider quando ogni modello sotto quel provider deve usarlo.

`github-copilot/auto` è il punto di partenza portabile. I modelli Copilot nominati dipendono dalle policy dell'account e dell'organizzazione, quindi fissane uno solo dopo aver confermato che la Copilot CLI autenticata lo espone.

## Provider supportati

L'harness dichiara il supporto per il provider canonico `github-copilot` (lo stesso id gestito da `extensions/github-copilot`):

- `github-copilot`

Supporta anche voci personalizzate `models.providers` quando il modello selezionato ha un `baseUrl` non vuoto e una di queste forme API:

- `openai-responses`
- `openai-completions`
- `ollama` (completion compatibili con OpenAI)
- `azure-openai-responses`
- `anthropic-messages`

Gli id dei provider nativi come `openai`, `anthropic`, `google` e `ollama` restano gestiti dai rispettivi runtime nativi. Usa un id provider personalizzato distinto quando instradi un endpoint tramite Copilot BYOK.

Gli endpoint Copilot BYOK devono essere URL HTTPS di rete pubblica. L'harness fornisce al Copilot SDK un URL proxy local loopback per tentativo, poi inoltra il traffico del provider attraverso il percorso fetch protetto di OpenClaw, così il pinning DNS e la policy SSRF restano gestiti da OpenClaw. Usa il runtime nativo OpenClaw per Ollama locale, LM Studio o server modello LAN.

## BYOK

Copilot BYOK usa il contratto del provider personalizzato a livello di sessione dell'SDK. OpenClaw passa l'endpoint modello risolto, la chiave API, la modalità bearer-token, gli header, l'id modello e i limiti di contesto/output senza spostare la logica di trasporto del provider nel core.

Per esempio:

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

Le sessioni BYOK sono indicizzate separatamente dalle sessioni in sottoscrizione e da altri endpoint o fingerprint delle credenziali. La rotazione della chiave, degli header, del modello o dell'endpoint crea una nuova sessione Copilot SDK invece di riprendere uno stato incompatibile.

## Autenticazione

Precedenza per agente, applicata durante `runCopilotAttempt`:

1. **`useLoggedInUser: true` esplicito** nell'input del tentativo. Usa l'utente connesso della Copilot CLI risolto sotto il `copilotHome` dell'agente.
2. **`gitHubToken` esplicito** nell'input del tentativo (con `profileId` + `profileVersion`). Utile per invocazioni dirette della CLI e test in cui il chiamante vuole bypassare la risoluzione degli auth-profile.
3. **`resolvedApiKey` + `authProfileId` risolti dal contratto** dalla forma `EmbeddedRunAttemptParams`. Questo è il **percorso principale di produzione**: il core risolve l'auth profile `github-copilot` configurato dell'agente (tramite `src/infra/provider-usage.auth.ts:resolveProviderAuths`) prima di invocare l'harness, e l'harness consuma direttamente entrambi i campi. Questo fa funzionare end-to-end un auth profile `github-copilot:<profile>` per configurazioni headless / cron / multi-profilo senza env vars.
4. **Fallback tramite env-var** per esecuzioni dirette CLI / dogfood in cui non è configurato alcun auth profile. Il runtime controlla le seguenti variabili in ordine di precedenza, rispecchiando il provider `github-copilot` distribuito (`extensions/github-copilot/auth.ts`) e la configurazione documentata del Copilot SDK:
   1. `OPENCLAW_GITHUB_TOKEN` -- override specifico dell'harness; impostalo per fissare un token per l'harness OpenClaw senza interferire con la configurazione globale di sistema `gh` / Copilot CLI.
   2. `COPILOT_GITHUB_TOKEN` -- env var standard di Copilot SDK / CLI.
   3. `GH_TOKEN` -- env var standard della CLI `gh` (corrisponde alla precedenza del provider `github-copilot` esistente).
   4. `GITHUB_TOKEN` -- fallback generico per token GitHub.

   Vince il primo valore non vuoto; le stringhe vuote sono trattate come assenti. L'id del profilo pool sintetizzato è `env:<NAME>` e `profileVersion` è un fingerprint sha256 non reversibile del token, quindi la rotazione del valore env invalida correttamente il pool client.

5. **`useLoggedInUser` predefinito** quando non è disponibile alcun segnale di token.

Ogni agente riceve un `copilotHome` dedicato, così token, sessioni e configurazione della Copilot CLI non trapelano tra agenti sulla stessa macchina. Il valore predefinito è `<agentDir>/copilot` quando l'host passa all'harness una directory agente (isolando lo stato SDK da `models.json` / `auth-profiles.json` di OpenClaw nella stessa directory), oppure `~/.openclaw/agents/<agentId>/copilot` altrimenti. Sovrascrivi con `copilotHome: <path>` nell'input del tentativo quando ti serve una posizione personalizzata (per esempio, un mount condiviso per la migrazione).

I test live dell'harness usano `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` quando serve un token diretto. La configurazione condivisa dei test live elimina intenzionalmente `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` e `GITHUB_TOKEN` dopo aver predisposto veri auth profile nella home di test isolata, quindi passare un valore `gh auth token` tramite la variabile dedicata ai test live evita skip errati senza esporre il token a suite non correlate.

## Superficie di configurazione

L'harness legge la sua configurazione dall'input per tentativo (`runCopilotAttempt({...})`) più un piccolo insieme di default env dentro `extensions/copilot/src/`:

- `copilotHome` — directory dello stato CLI per agente (default documentati sopra).
- `model` — stringa o `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Quando omesso, OpenClaw usa la normale selezione del modello dell'agente e l'harness verifica che il provider risolto sia supportato.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. Mappa dalla risoluzione `ThinkLevel` / `ReasoningLevel` di OpenClaw in `auto-reply/thinking.ts`.
- `infiniteSessionConfig` — override opzionale per il blocco SDK `infiniteSessions` guidato da `harness.compact`. I default possono essere lasciati così come sono in sicurezza.
- `hooksConfig` — configurazione opzionale di compatibilità nativa Copilot SDK `SessionHooks` per callback di tool/MCP, prompt utente, sessione ed errore. È separata dagli hook portabili del ciclo di vita di OpenClaw.
- `permissionPolicy` — override opzionale per l'handler SDK `onPermissionRequest` usato per i tipi di strumenti SDK integrati (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Il default è `rejectAllPolicy` come rete di sicurezza; in pratica l'SDK non invoca mai nessuno di questi tipi perché ogni strumento OpenClaw collegato tramite bridge è registrato con `overridesBuiltInTool: true` e `skipPermission: true`, così il 100% delle chiamate agli strumenti passa attraverso `execute()` wrappato di OpenClaw. Vedi [Permessi e ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — flag opzionale per la telemetria di sessione SDK.

Gli hook dei Plugin OpenClaw non richiedono configurazione di tentativo specifica per Copilot. L'harness esegue `before_prompt_build` (e l'hook di compatibilità legacy `before_agent_start`), `llm_input`, `llm_output` e `agent_end` tramite gli helper standard dell'harness. Le compaction SDK riuscite eseguono anche `before_compaction` e `after_compaction`. Gli strumenti OpenClaw collegati tramite bridge continuano a eseguire `before_tool_call` e a riportare `after_tool_call`; `hooksConfig` resta per callback native solo SDK che non hanno un equivalente portabile.

Nient'altro nel resto di OpenClaw deve conoscere questi campi. Altri plugin, canali e codice core vedono solo la forma standard `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Quando `harness.compact` viene eseguito, l'harness Copilot SDK:

1. Riprende la sessione SDK tracciata senza continuare il lavoro in sospeso.
2. Chiama l'RPC di compaction della cronologia con ambito di sessione dell'SDK.
3. Restituisce l'esito della compaction SDK senza scrivere file marker di compatibilità sotto il workspace.

Il mirror della trascrizione lato OpenClaw (vedi sotto) continua a ricevere i messaggi post-compaction, quindi la cronologia chat visibile all'utente resta coerente.

## Mirroring della trascrizione

`runCopilotAttempt` scrive in dual-write i messaggi mirrorabili di ogni turno nella trascrizione di audit di OpenClaw tramite `extensions/copilot/src/dual-write-transcripts.ts`. Il mirror ha ambito per sessione (`copilot:${sessionId}`) e usa un'identità per messaggio (`${role}:${sha256_16(role,content)}`), così le riemissioni di voci di turni precedenti collidono con le chiavi già su disco e non duplicano.

Il mirror è avvolto in due livelli di contenimento degli errori così un errore di scrittura della trascrizione non può far fallire il tentativo: un wrapper interno best-effort e un `.catch(...)` defense-in-depth a livello di tentativo. Gli errori vengono registrati nei log ma non esposti.

## Domande laterali (`/btw`)

`/btw` **non** è nativo su questo harness. `createCopilotAgentHarness()`
lascia deliberatamente `harness.runSideQuestion` non definito, quindi il dispatcher
`/btw` di OpenClaw (`src/agents/btw.ts`) ricade nello stesso percorso di fallback
PI interno al repository che usa per ogni runtime non Codex: il provider del
modello configurato viene chiamato direttamente con un breve prompt di domanda
secondaria e lo stream viene restituito tramite `streamSimple` (nessuna sessione
CLI, nessuno slot aggiuntivo nel pool).

Questo mantiene le sessioni Copilot CLI riservate al ciclo principale dei turni
dell'agente e mantiene il comportamento di `/btw` identico a quello degli altri
runtime basati su PI. Il contratto è verificato in
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
sotto `describe("runSideQuestion")`.

## Diagnostica

`extensions/copilot/doctor-contract-api.ts` viene caricato automaticamente da
`src/plugins/doctor-contract-registry.ts`. Contribuisce:

- Un `legacyConfigRules` vuoto (nessun campo ritirato nell'MVP).
- Un `normalizeCompatibilityConfig` senza effetti (mantenuto affinché i futuri
  ritiri di campi abbiano una collocazione stabile interna al repository).
- Una voce `sessionRouteStateOwners` che rivendica il provider `github-copilot`;
  runtime `copilot`; chiave di sessione CLI `copilot`; prefisso del profilo di
  autenticazione `github-copilot:`.

## Limitazioni

- L'harness rivendica `github-copilot` più gli ID provider BYOK personalizzati
  non posseduti. Gli ID provider nativi posseduti dal manifest restano sul
  runtime proprietario anche quando `agentRuntime.id` viene forzato a `copilot`.
- L'harness non fornisce la TUI; la TUI di PI non è interessata e resta il
  fallback per qualunque runtime non abbia una superficie equivalente.
- Lo stato della sessione PI non viene migrato quando un agente passa a
  `copilot`. La selezione è per tentativo; le sessioni PI esistenti restano
  valide.
- `ask_user` usa lo stesso percorso prompt-e-risposta di OpenClaw dell'harness
  Codex. Quando l'SDK Copilot richiede input dall'utente, OpenClaw pubblica un
  prompt bloccante sul canale/TUI attivo e il messaggio utente successivo in coda
  risolve la richiesta dell'SDK.

## Autorizzazioni e ask_user

L'applicazione delle autorizzazioni per gli strumenti OpenClaw collegati avviene
**dentro il wrapper dello strumento**, non tramite il callback
`onPermissionRequest` dell'SDK. Lo stesso `wrapToolWithBeforeToolCallHook` usato
da PI (`src/agents/pi-tools.before-tool-call.ts`) viene applicato da
`createOpenClawCodingTools` a ogni strumento di coding: rilevamento dei loop,
policy dei Plugin attendibili, hook before-tool-call e approvazioni Plugin in due
fasi tramite il Gateway (`plugin.approval.request`) eseguono tutti lo stesso
identico percorso di codice dei tentativi PI nativi.

Per consentire a quel wrapper di possedere la decisione, l'SDK Tool restituito da
`convertOpenClawToolToSdkTool` è marcato con:

- `overridesBuiltInTool: true` — sostituisce lo strumento integrato della Copilot
  CLI con lo stesso nome (edit, read, write, bash, …), così ogni invocazione dello
  strumento viene instradata di nuovo a OpenClaw.
- `skipPermission: true` — indica all'SDK di non attivare
  `onPermissionRequest({kind: "custom-tool"})` prima di invocare lo strumento.
  L'`execute()` wrappato esegue internamente il controllo di policy OpenClaw più
  ricco; un prompt a livello SDK aggirerebbe l'applicazione di OpenClaw (se
  consentissimo tutto) oppure bloccherebbe ogni chiamata a strumento (se
  rifiutassimo tutto) — nessuno dei due comportamenti corrisponde alla parità con
  PI.

L'harness codex interno al repository usa la stessa separazione: gli strumenti
OpenClaw collegati sono wrappati
(`extensions/codex/src/app-server/dynamic-tools.ts`) e i tipi di approvazione
nativi _propri_ del codex-app-server
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) sono instradati tramite
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). L'equivalente dell'SDK
Copilot — `rejectAllPolicy` fail-closed per qualunque tipo non `custom-tool` che
raggiunga mai `onPermissionRequest` — è la stessa rete di sicurezza, e in pratica
non si attiva perché `overridesBuiltInTool: true` sostituisce ogni strumento
integrato.

Affinché il livello dello strumento wrappato prenda decisioni di policy
equivalenti a PI, l'harness inoltra il contesto completo attempt-tool di PI a
`createOpenClawCodingTools` — identità (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, …), canale/instradamento (`groupId`,
`currentChannelId`, `replyToMode`, toggle degli strumenti messaggio),
autenticazione (`authProfileStore`), identità dell'esecuzione
(`sessionKey`/`runSessionKey` derivati da `sandboxSessionKey`, `runId`), contesto
del modello (`modelApi`, `modelContextWindowTokens`, `modelCompat`,
`modelHasVision`) e hook dell'esecuzione (`onToolOutcome`, `onYield`). Senza
questi campi, le allowlist solo-owner si comportano silenziosamente come
deny-by-default, le policy di attendibilità dei Plugin non possono risolversi
allo scope corretto e `session_status: "current"` si risolve in una chiave
sandbox obsoleta. Il builder del bridge si trova in
`extensions/copilot/src/tool-bridge.ts` e rispecchia la chiamata autorevole di PI
in `src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`. `runAttempt`
risolve già il contesto sandbox tramite la seam condivisa `resolveSandboxContext`,
passa all'SDK una directory di lavoro effettiva e inoltra `sandbox` più il
workspace di spawn del subagent nel bridge degli strumenti. Il bridge inoltra
anche i controlli limitati di costruzione degli strumenti che può applicare al
confine dell'SDK: `includeCoreTools`, la allowlist degli strumenti del runtime e
`toolConstructionPlan`.

Il bridge usa anche l'helper condiviso della superficie strumenti dell'harness da
`openclaw/plugin-sdk/agent-harness-tool-runtime` per la parità con PI. Quando la
ricerca strumenti è abilitata, l'SDK vede strumenti di controllo compatti più un
esecutore di catalogo nascosto invece di ogni schema di strumento OpenClaw.
Quando la modalità codice è abilitata, l'helper costruisce la stessa superficie
di controllo della modalità codice e lo stesso ciclo di vita del catalogo usati
dagli altri harness agente. Default snelli per modelli locali, filtraggio degli
schemi compatibile con il runtime, idratazione delle directory e pulizia del
catalogo restano tutti nell'helper condiviso, così gli harness Copilot e quelli
adiacenti a Codex non divergono.

### Token GitHub a livello di sessione

Il contratto dell'SDK Copilot distingue il token GitHub **a livello client**
(`CopilotClientOptions.gitHubToken`, usato per autenticare il processo CLI
stesso) dal token **a livello di sessione** (`SessionConfig.gitHubToken`, che
determina esclusione dei contenuti, instradamento del modello e quota per quella
sessione ed è rispettato sia su `createSession` sia su `resumeSession`).
L'harness risolve l'autenticazione una sola volta tramite `resolveCopilotAuth` e
imposta entrambi i campi quando la modalità di autenticazione è `gitHubToken` (un
`auth.gitHubToken` esplicito o un `resolvedApiKey` risolto dal contratto da un
profilo di autenticazione `github-copilot` configurato). Quando la modalità
risolta è `useLoggedInUser`, il campo a livello di sessione viene omesso, così
l'SDK continua a derivare l'identità dall'identità connessa.

`ask_user` usa `SessionConfig.onUserInputRequest`. Il bridge accetta indici o
etichette di scelta per richieste a scelta fissa, accetta risposte libere quando
la richiesta dell'SDK le consente e annulla una richiesta pendente quando il
tentativo OpenClaw viene interrotto.

## Correlati

- [Runtime agente](/it/concepts/agent-runtimes)
- [Harness Codex](/it/plugins/codex-harness)
- [Plugin harness agente (riferimento SDK)](/it/plugins/sdk-agent-harness)
