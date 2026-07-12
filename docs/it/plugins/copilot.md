---
read_when:
    - Vuoi usare l'infrastruttura GitHub Copilot SDK per un agente
    - Ti servono esempi di configurazione per il runtime `copilot`
    - Stai collegando un agente a un abbonamento Copilot (github / openclaw / copilot) e vuoi eseguirlo tramite la CLI di Copilot
summary: Esegui i turni dell'agente integrato di OpenClaw tramite l'harness esterno dell'SDK GitHub Copilot
title: Harness dell'SDK Copilot
x-i18n:
    generated_at: "2026-07-12T07:14:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

Il plugin esterno `@openclaw/copilot` esegue le interazioni dell'agente Copilot con abbonamento incorporato tramite la CLI GitHub Copilot (`@github/copilot-sdk`), anziché tramite l'infrastruttura di esecuzione integrata di OpenClaw. La sessione della CLI Copilot gestisce il ciclo dell'agente di basso livello: esecuzione nativa degli strumenti, Compaction nativa (`infiniteSessions`) e stato dei thread gestito dalla CLI in `copilotHome`. OpenClaw continua a gestire i canali di chat, i file di sessione, la selezione del modello, gli strumenti dinamici (collegati), le approvazioni, la distribuzione dei contenuti multimediali, la copia visibile della trascrizione, le domande secondarie `/btw` (vedere [Domande secondarie (`/btw`)](#side-questions-btw)) e `openclaw doctor`.

Per una panoramica più ampia della separazione tra modello, provider e runtime, iniziare da
[Runtime degli agenti](/it/concepts/agent-runtimes).

## Requisiti

- OpenClaw con il plugin `@openclaw/copilot` installato.
- Se la configurazione usa `plugins.allow`, includere `copilot` (l'id del manifest dichiarato dal plugin). Una voce dell'elenco consentito con il nome del pacchetto npm `@openclaw/copilot` non corrisponderà e lascerà il plugin bloccato, anche se è impostato `agentRuntime.id: "copilot"`.
- Un abbonamento GitHub Copilot in grado di utilizzare la CLI Copilot oppure una variabile d'ambiente `gitHubToken` / voce del profilo di autenticazione per le esecuzioni headless o Cron.
- Una directory `copilotHome` scrivibile. Il valore predefinito è `<agentDir>/copilot` quando OpenClaw fornisce una directory dell'agente; altrimenti è `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` esegue il [contratto di doctor](#doctor) del plugin per la proprietà dello stato della sessione e le future migrazioni della configurazione. Non verifica l'ambiente della CLI Copilot.

## Installazione

Il runtime Copilot viene distribuito come plugin esterno, così il pacchetto principale `openclaw` non include `@github/copilot-sdk` né il relativo binario della CLI specifico per piattaforma `@github/copilot-<platform>-<arch>` (complessivamente circa 260 MB).
Installarlo solo per gli agenti che scelgono esplicitamente questo runtime:

```bash
openclaw plugins install @openclaw/copilot
```

La procedura guidata di configurazione installa automaticamente il plugin la prima volta che si seleziona un modello `github-copilot/*` **e** la configurazione instrada tale modello (o il relativo provider) al runtime Copilot tramite `agentRuntime: { id: "copilot" }`; vedere [Avvio rapido](#quickstart). Senza questa scelta esplicita, OpenClaw usa il proprio provider GitHub Copilot integrato e non installa mai questo plugin.

Il runtime risolve l'SDK nel seguente ordine:

1. `import("@github/copilot-sdk")` dal pacchetto `@openclaw/copilot` installato.
2. La directory di ripiego `~/.openclaw/npm-runtime/copilot/` (destinazione precedente per l'installazione su richiesta).

L'assenza dell'SDK produce un singolo errore con codice `COPILOT_SDK_MISSING` e il comando di reinstallazione riportato sopra.

## Avvio rapido

Associare un modello (o un provider) all'infrastruttura di esecuzione:

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

Impostare `agentRuntime.id` nella voce di un singolo modello per instradare solo quel modello attraverso l'infrastruttura di esecuzione oppure in un provider per instradare tutti i modelli di quel provider.

`github-copilot/auto` è il punto di partenza portabile. I modelli Copilot con nome specifico dipendono dall'account e dai criteri dell'organizzazione; verificare che la CLI Copilot autenticata esponga effettivamente un modello prima di associarlo.

## Provider supportati

L'infrastruttura di esecuzione supporta il provider canonico `github-copilot` (gestito da `extensions/github-copilot`), oltre alle voci personalizzate di `models.providers` quando il modello dispone di un `baseUrl` non vuoto e di una delle seguenti forme di `api`:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (completamenti compatibili con OpenAI)
- `openai-completions`
- `openai-responses`

Gli id dei provider nativi (`openai`, `anthropic`, `google`, `ollama`) restano gestiti dai rispettivi runtime nativi. Usare invece un id provider personalizzato distinto per instradare un endpoint tramite Copilot BYOK.

Gli endpoint Copilot BYOK devono essere URL HTTPS pubblici. L'infrastruttura di esecuzione fornisce all'SDK Copilot un proxy local loopback per ogni tentativo, quindi inoltra il traffico del provider attraverso il percorso di recupero protetto di OpenClaw, affinché il blocco DNS e i criteri SSRF restino gestiti da OpenClaw. Usare il runtime nativo di OpenClaw per Ollama locale, LM Studio o i server di modelli della LAN.

## BYOK

Copilot BYOK usa il contratto del provider personalizzato a livello di sessione dell'SDK. OpenClaw passa l'endpoint del modello risolto, la chiave API, la modalità token bearer, le intestazioni, l'id del modello e i limiti di contesto/output; la logica di trasporto del provider rimane nell'SDK, non nel nucleo.

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

Le sessioni BYOK sono identificate separatamente dalle sessioni con abbonamento e dalle sessioni di altri endpoint o credenziali BYOK. La rotazione della chiave, delle intestazioni, del modello o dell'endpoint avvia una nuova sessione dell'SDK Copilot anziché riprendere uno stato incompatibile.

## Autenticazione

Ordine di precedenza, applicato per ciascun agente durante `runCopilotAttempt`:

1. **`useLoggedInUser: true` esplicito** nell'input del tentativo: usa l'utente autenticato nella CLI Copilot all'interno di `copilotHome` dell'agente.
2. **`gitHubToken` esplicito** nell'input del tentativo (richiede `profileId` + `profileVersion`). Per le invocazioni dirette della CLI e i test che devono ignorare la risoluzione del profilo di autenticazione.
3. **`resolvedApiKey` + `authProfileId` risolti dal contratto**: il percorso principale di produzione. Il nucleo risolve il profilo di autenticazione `github-copilot` configurato per l'agente (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) prima di invocare l'infrastruttura di esecuzione, così un profilo di autenticazione `github-copilot:<profile>` funziona end-to-end per configurazioni headless, Cron o con più profili senza variabili d'ambiente.
4. **Ripiego sulle variabili d'ambiente**, verificate nel seguente ordine (prevale il primo valore non vuoto; le stringhe vuote sono considerate assenti; rispecchia l'ordine di precedenza del provider `github-copilot` distribuito in `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN`: sostituzione specifica dell'infrastruttura di esecuzione; consente di associare un token all'infrastruttura di esecuzione di OpenClaw senza interferire con la configurazione globale di `gh` / della CLI Copilot.
   2. `COPILOT_GITHUB_TOKEN`: variabile d'ambiente standard dell'SDK / della CLI Copilot.
   3. `GH_TOKEN`: variabile d'ambiente standard della CLI `gh`.
   4. `GITHUB_TOKEN`: ripiego generico per il token GitHub.

   L'id sintetizzato del profilo del pool è `env:<NAME>`; la versione del profilo è un'impronta sha256 non reversibile del token, quindi la rotazione del valore d'ambiente invalida correttamente il pool di client.

5. **`useLoggedInUser` predefinito** quando non è disponibile alcuna indicazione di token.

Ogni agente dispone del proprio `copilotHome`, affinché token, sessioni e configurazione della CLI Copilot non vengano mai condivisi tra agenti sulla stessa macchina. Valore predefinito:
`<agentDir>/copilot` (mantiene lo stato dell'SDK fuori dalla directory contenente `models.json` / `auth-profiles.json` di OpenClaw) oppure
`~/.openclaw/agents/<agentId>/copilot` quando non viene fornita alcuna directory dell'agente.
Sostituire il valore con `copilotHome: <path>` nell'input del tentativo per usare una posizione personalizzata (ad esempio, un montaggio condiviso per la migrazione).

I test live dell'infrastruttura di esecuzione usano `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` per un token diretto. La configurazione condivisa dei test live rimuove `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` e `GITHUB_TOKEN` dopo aver predisposto i profili di autenticazione reali nell'ambiente di test isolato, così un valore `gh auth token` passato tramite la variabile dedicata evita esclusioni errate senza propagarsi a suite non correlate.

## Superficie di configurazione

L'infrastruttura di esecuzione legge la configurazione dall'input di ciascun tentativo (`runCopilotAttempt({...})`) e da un piccolo insieme di valori d'ambiente predefiniti all'interno di `extensions/copilot/src/`:

| Campo                    | Scopo                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Directory dello stato della CLI per agente (valori predefiniti indicati sopra).                                                                                                                                                                                                                                                 |
| `model`                  | Stringa oppure `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Omettere per usare la normale selezione del modello dell'agente; l'infrastruttura di esecuzione verifica che il provider risolto sia supportato.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Deriva dalla risoluzione `ThinkLevel` / `ReasoningLevel` di OpenClaw in `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | Sostituzione facoltativa del blocco `infiniteSessions` dell'SDK controllato da `harness.compact`. Può essere lasciato invariato in sicurezza.                                                                                                                                                                                        |
| `hooksConfig`            | Configurazione nativa facoltativa `SessionHooks` dell'SDK Copilot per callback di strumenti/MCP, prompt utente, sessione ed errori. Separata dagli hook portabili del ciclo di vita di OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | Sostituzione facoltativa del gestore `onPermissionRequest` dell'SDK per i tipi di strumenti integrati nell'SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Il valore predefinito è `rejectAllPolicy` come misura di sicurezza; vedere [Autorizzazioni e ask_user](#permissions-and-ask_user) per il motivo per cui non viene mai effettivamente attivato. |
| `enableSessionTelemetry` | Flag facoltativo per la telemetria della sessione dell'SDK.                                                                                                                                                                                                                                                            |

Gli hook dei plugin OpenClaw non richiedono una configurazione specifica di Copilot per il tentativo. L'infrastruttura di esecuzione esegue `before_prompt_build` (e l'hook di compatibilità precedente `before_agent_start`), `llm_input`, `llm_output` e `agent_end` tramite gli helper standard dell'infrastruttura. Le Compaction dell'SDK completate correttamente eseguono inoltre `before_compaction` e `after_compaction`. Gli strumenti OpenClaw collegati eseguono `before_tool_call` e comunicano `after_tool_call`; `hooksConfig` rimane disponibile per callback native riservate all'SDK senza un equivalente portabile.

Nessun altro componente di OpenClaw deve conoscere questi campi. Gli altri plugin, i canali e il codice del nucleo vedono solo la forma standard `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult`.

## Compaction

Quando viene eseguito `harness.compact`, l'infrastruttura basata sull'SDK Copilot:

1. Riprende la sessione SDK monitorata senza proseguire il lavoro in sospeso.
2. Chiama l'RPC di Compaction della cronologia specifica della sessione dell'SDK.
3. Restituisce il risultato della Compaction dell'SDK senza scrivere file indicatori di compatibilità nell'area di lavoro.

La copia della trascrizione sul lato OpenClaw (descritta di seguito) continua a ricevere i messaggi successivi alla Compaction, mantenendo coerente la cronologia delle chat visibile agli utenti.

## Copia della trascrizione

`runCopilotAttempt` scrive in parallelo i messaggi replicabili di ogni interazione nella trascrizione di controllo di OpenClaw tramite
`extensions/copilot/src/dual-write-transcripts.ts`. La copia è limitata alla singola sessione (`copilot:${sessionId}`) e dispone di una chiave per ogni messaggio
(`${role}:${sha256_16(role,content)}`), quindi le voci delle interazioni precedenti emesse nuovamente coincidono con le chiavi già presenti su disco anziché essere duplicate.

Due livelli di contenimento degli errori avvolgono il mirror, affinché un errore
di scrittura della trascrizione non provochi mai il fallimento del tentativo: un
wrapper interno che opera al meglio delle possibilità, più un `.catch(...)`
di difesa in profondità a livello di tentativo. Gli errori vengono registrati,
non esposti.

## Domande collaterali (`/btw`)

`/btw` **non** è nativo in questo framework di esecuzione.
`createCopilotAgentHarness()` lascia deliberatamente
`harness.runSideQuestion` non definito
(come verificato in `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
quindi il dispatcher `/btw` di OpenClaw (`src/agents/btw.ts`) prosegue lungo
lo stesso percorso utilizzato per ogni ambiente di esecuzione non Codex: il
provider del modello configurato viene chiamato direttamente con un breve
prompt per la domanda collaterale e la risposta viene restituita in streaming
tramite `streamSimple` (nessuna sessione CLI, nessuno slot aggiuntivo nel pool).

In questo modo, le sessioni della CLI di Copilot restano riservate al ciclo
principale dei turni dell'agente e il comportamento di `/btw` rimane identico
a quello degli altri ambienti di esecuzione non Codex.

## Diagnostica

`extensions/copilot/doctor-contract-api.ts` viene caricato automaticamente da
`src/plugins/doctor-contract-registry.ts`. Fornisce:

- Un `legacyConfigRules` vuoto (non sono ancora presenti campi ritirati).
- Un `normalizeCompatibilityConfig` che non esegue operazioni (mantenuto
  affinché i futuri ritiri di campi abbiano una posizione stabile nel repository).
- Una voce `sessionRouteStateOwners`: provider `github-copilot`, ambiente di
  esecuzione `copilot`, chiave di sessione CLI `copilot`, prefisso del profilo
  di autenticazione `github-copilot:`.

## Limitazioni

- Il framework di esecuzione rivendica `github-copilot` insieme agli
  identificatori di provider BYOK personalizzati privi di proprietario. Gli
  identificatori dei provider nativi posseduti dal manifest rimangono
  nell'ambiente di esecuzione proprietario anche quando `agentRuntime.id`
  viene forzato su `copilot`.
- Nessuna interfaccia TUI; la TUI di PI rimane la soluzione di ripiego per gli
  ambienti di esecuzione privi di un'interfaccia equivalente.
- Lo stato della sessione PI non viene migrato quando un agente passa a
  `copilot`. La selezione avviene per ogni tentativo; le sessioni PI esistenti
  rimangono valide.
- `ask_user` utilizza lo stesso percorso di richiesta e risposta di OpenClaw
  impiegato dal framework di esecuzione Codex: quando l'SDK di Copilot richiede
  un input dell'utente, OpenClaw pubblica una richiesta bloccante nel canale o
  nella TUI attivi e il successivo messaggio utente in coda soddisfa la
  richiesta dell'SDK.

## Autorizzazioni e ask_user

L'applicazione delle autorizzazioni per gli strumenti OpenClaw collegati
avviene **all'interno del wrapper dello strumento**, non tramite il callback
`onPermissionRequest` dell'SDK. Lo stesso `wrapToolWithBeforeToolCallHook`
utilizzato da PI (`src/agents/agent-tools.before-tool-call.ts`) viene applicato
da `createOpenClawCodingTools` a ogni strumento di programmazione: rilevamento
dei cicli, criteri dei Plugin attendibili, hook precedenti alla chiamata dello
strumento e approvazioni dei Plugin in due fasi tramite il Gateway
(`plugin.approval.request`) seguono tutti esattamente lo stesso percorso di
codice dei tentativi PI nativi.

Lo strumento dell'SDK restituito da `convertOpenClawToolToSdkTool` è
contrassegnato con:

- `overridesBuiltInTool: true` — sostituisce lo strumento integrato omonimo
  della CLI di Copilot (modifica, lettura, scrittura, bash, ...) affinché ogni
  chiamata dello strumento venga reindirizzata a OpenClaw.
- `skipPermission: true` — indica all'SDK di non attivare
  `onPermissionRequest({kind: "custom-tool"})` prima di invocare lo strumento.
  Il metodo `execute()` avvolto esegue già il controllo più completo dei
  criteri di OpenClaw; una richiesta a livello di SDK aggirerebbe
  l'applicazione dei criteri di OpenClaw (consentendo tutto) oppure bloccherebbe
  ogni chiamata degli strumenti (rifiutando tutto): nessuno dei due
  comportamenti corrisponde alla parità con PI.

Il framework di esecuzione Codex incluso nel repository usa la stessa
separazione: gli strumenti OpenClaw collegati vengono avvolti
(`extensions/codex/src/app-server/dynamic-tools.ts`) e i tipi di approvazione
nativi di codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) vengono instradati tramite
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). L'equivalente
nell'SDK di Copilot, ossia il criterio `rejectAllPolicy` a chiusura sicura per
qualsiasi tipo diverso da `custom-tool` che raggiunga `onPermissionRequest`,
costituisce la stessa rete di sicurezza e, nella pratica, non viene mai
attivato perché `overridesBuiltInTool: true` sostituisce ogni strumento
integrato.

Affinché il livello degli strumenti avvolti prenda decisioni sui criteri
equivalenti a quelle di PI, il framework di esecuzione inoltra a
`createOpenClawCodingTools` l'intero contesto degli strumenti del tentativo PI:
identità (`senderIsOwner`, `memberRoleIds`, `ownerOnlyToolAllowlist`, ...),
canale e instradamento (`groupId`, `currentChannelId`, `replyToMode`, opzioni
degli strumenti di messaggistica), autenticazione (`authProfileStore`),
identità dell'esecuzione (`sessionKey` / `runSessionKey` derivati da
`sandboxSessionKey`, `runId`), contesto del modello (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) e hook
dell'esecuzione (`onToolOutcome`, `onYield`). Senza questi campi, gli elenchi
di elementi consentiti riservati al proprietario negano silenziosamente
l'accesso per impostazione predefinita, i criteri di attendibilità dei Plugin
non possono determinare l'ambito corretto e `session_status: "current"` viene
risolto in una chiave sandbox obsoleta. Il generatore del collegamento è
`extensions/copilot/src/tool-bridge.ts` e rispecchia la chiamata autorevole di
PI in `src/agents/embedded-agent-runner/run/attempt.ts:1262`. `runAttempt`
risolve il contesto sandbox tramite il punto di integrazione condiviso
`resolveSandboxContext`, passa all'SDK una directory di lavoro effettiva e
inoltra `sandbox` insieme allo spazio di lavoro di creazione dei sottoagenti
al collegamento degli strumenti. Il collegamento inoltra inoltre i controlli
limitati di costruzione degli strumenti che può applicare al confine
dell'SDK: `includeCoreTools`, l'elenco degli strumenti consentiti
dell'ambiente di esecuzione e `toolConstructionPlan`.

Il collegamento utilizza inoltre l'helper condiviso per l'interfaccia degli
strumenti del framework di esecuzione, proveniente da
`openclaw/plugin-sdk/agent-harness-tool-runtime`, per garantire la parità con
PI. Quando la ricerca degli strumenti è abilitata, l'SDK vede strumenti di
controllo compatti più un esecutore nascosto del catalogo, anziché tutti gli
schemi degli strumenti OpenClaw. Quando la modalità codice è abilitata,
l'helper crea la stessa interfaccia di controllo della modalità codice e lo
stesso ciclo di vita del catalogo utilizzati dagli altri framework di
esecuzione degli agenti. Le impostazioni predefinite essenziali per i modelli
locali, il filtraggio degli schemi compatibile con l'ambiente di esecuzione,
il popolamento delle directory e la pulizia del catalogo rimangono tutti
nell'helper condiviso, evitando divergenze tra i framework di esecuzione
Copilot e quelli affini a Codex.

### Token GitHub a livello di sessione

Il contratto dell'SDK di Copilot distingue il token GitHub **a livello di
client** (`CopilotClientOptions.gitHubToken`, che autentica il processo CLI
stesso) dal token **a livello di sessione** (`SessionConfig.gitHubToken`, che
determina l'esclusione dei contenuti, l'instradamento del modello e la quota
per quella sessione; viene rispettato sia da `createSession` sia da
`resumeSession`). Il framework di esecuzione risolve l'autenticazione una sola
volta tramite `resolveCopilotAuth` e imposta entrambi i campi quando la
modalità di autenticazione è `gitHubToken` (un `auth.gitHubToken` esplicito
oppure un `resolvedApiKey` risolto dal contratto a partire da un profilo di
autenticazione `github-copilot` configurato). Quando la modalità risolta è
`useLoggedInUser`, il campo a livello di sessione viene omesso, affinché l'SDK
continui a derivare l'identità da quella dell'utente autenticato.

`ask_user` utilizza `SessionConfig.onUserInputRequest`. Il collegamento accetta
gli indici o le etichette delle scelte per le richieste a scelta fissa,
accetta risposte in formato libero quando la richiesta dell'SDK le consente e
annulla una richiesta in sospeso quando il tentativo OpenClaw viene interrotto.

## Contenuti correlati

- [Ambienti di esecuzione degli agenti](/it/concepts/agent-runtimes)
- [Framework di esecuzione Codex](/it/plugins/codex-harness)
- [Plugin per framework di esecuzione degli agenti (riferimento SDK)](/it/plugins/sdk-agent-harness)
