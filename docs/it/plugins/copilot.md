---
read_when:
    - Si desidera utilizzare l’harness SDK di GitHub Copilot per un agente
    - Sono necessari esempi di configurazione per il runtime `copilot`
    - Si sta collegando un agente a un abbonamento Copilot (github / openclaw / copilot) e si desidera eseguirlo tramite la CLI di Copilot
summary: Esegui i turni dell'agente integrato di OpenClaw tramite l'harness esterno dell'SDK GitHub Copilot
title: Harness dell’SDK Copilot
x-i18n:
    generated_at: "2026-07-16T14:40:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

Il plugin esterno `@openclaw/copilot` esegue i turni dell'agente Copilot con abbonamento incorporato tramite la GitHub Copilot CLI (`@github/copilot-sdk`) anziché tramite l'harness integrato di OpenClaw. La sessione della Copilot CLI gestisce il ciclo dell'agente di basso livello: esecuzione nativa degli strumenti, Compaction nativa (`infiniteSessions`) e stato del thread gestito dalla CLI in `copilotHome`. OpenClaw continua a gestire i canali di chat, i file di sessione, la selezione del modello, gli strumenti dinamici (collegati tramite bridge), le approvazioni, la consegna dei contenuti multimediali, la copia visibile della trascrizione, le domande secondarie `/btw` (vedere
[Domande secondarie (`/btw`)](#side-questions-btw)) e `openclaw doctor`.

Per una panoramica più ampia della separazione tra modello, provider e runtime, iniziare da
[Runtime degli agenti](/it/concepts/agent-runtimes).

## Requisiti

- OpenClaw con il plugin `@openclaw/copilot` installato.
- Se la configurazione usa `plugins.allow`, includere `copilot` (l'id del manifest dichiarato dal
  plugin). Una voce dell'elenco consentito per il nome del pacchetto npm
  `@openclaw/copilot` non corrisponderà e lascerà il plugin bloccato, anche con
  `agentRuntime.id: "copilot"` impostato.
- Un abbonamento GitHub Copilot in grado di utilizzare la Copilot CLI, oppure una
  variabile d'ambiente `gitHubToken` / voce del profilo di autenticazione per esecuzioni headless o Cron.
- Una directory `copilotHome` scrivibile. Il valore predefinito è `<agentDir>/copilot` quando
  OpenClaw fornisce una directory dell'agente, altrimenti
  `~/.openclaw/agents/<agentId>/copilot`.

`openclaw doctor` esegue il [contratto doctor](#doctor) del plugin per
la proprietà dello stato della sessione e le future migrazioni della configurazione. Non verifica l'ambiente
della Copilot CLI.

## Installazione

Il runtime Copilot viene distribuito come plugin esterno, in modo che il pacchetto principale `openclaw`
non includa `@github/copilot-sdk` né il relativo
binario CLI `@github/copilot-<platform>-<arch>` specifico della piattaforma (circa 260 MB complessivi).
Installarlo solo per gli agenti che adottano questo runtime:

```bash
openclaw plugins install @openclaw/copilot
```

La procedura guidata di configurazione installa automaticamente il plugin la prima volta che si seleziona
un modello `github-copilot/*` **e** la configurazione instrada tale modello (o il relativo
provider) al runtime Copilot tramite `agentRuntime: { id: "copilot" }`; vedere
[Avvio rapido](#quickstart). Senza tale adesione, OpenClaw usa il proprio provider
GitHub Copilot integrato e non installa mai questo plugin.

Il runtime risolve l'SDK nel seguente ordine:

1. `import("@github/copilot-sdk")` dal pacchetto `@openclaw/copilot`
   installato.
2. La directory di fallback `~/.openclaw/npm-runtime/copilot/` (destinazione legacy
   per l'installazione su richiesta).

Un SDK mancante genera un singolo errore con codice `COPILOT_SDK_MISSING` e il
comando di reinstallazione riportato sopra.

## Avvio rapido

Associare un modello (o un provider) all'harness:

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

Impostare `agentRuntime.id` su una singola voce di modello per instradare solo quel modello attraverso
l'harness oppure su un provider per instradare tutti i modelli di tale provider.

`github-copilot/auto` è il punto di partenza portabile. I modelli Copilot denominati dipendono
dall'account e dai criteri dell'organizzazione; verificare che la Copilot CLI autenticata
esponga effettivamente un modello prima di associarlo.

## Provider supportati

L'harness supporta il provider canonico `github-copilot` (gestito da
`extensions/github-copilot`), oltre alle voci personalizzate `models.providers` quando il
modello ha un valore `baseUrl` non vuoto e una delle seguenti forme `api`:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (completamenti compatibili con OpenAI)
- `openai-completions`
- `openai-responses`

Gli id dei provider nativi (`openai`, `anthropic`, `google`, `ollama`) restano gestiti dai
rispettivi runtime nativi. Usare un id di provider personalizzato distinto per instradare un endpoint
tramite Copilot BYOK.

Gli endpoint Copilot BYOK devono essere URL HTTPS pubblici. L'harness fornisce
all'SDK Copilot un proxy di loopback per ogni tentativo, quindi inoltra il traffico del provider
attraverso il percorso fetch protetto di OpenClaw, in modo che il blocco DNS e i criteri SSRF restino
gestiti da OpenClaw. Usare il runtime OpenClaw nativo per Ollama locale, LM
Studio o server di modelli nella LAN.

## BYOK

Copilot BYOK usa il contratto per provider personalizzati a livello di sessione dell'SDK. OpenClaw
passa l'endpoint del modello risolto, la chiave API, la modalità token bearer, le intestazioni, l'id del modello
e i limiti di contesto/output; la logica di trasporto del provider resta nell'SDK, non
nel core.

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

Le sessioni BYOK vengono identificate separatamente dalle sessioni in abbonamento e dagli altri
endpoint o credenziali BYOK. La rotazione della chiave, delle intestazioni, del modello o dell'endpoint
avvia una nuova sessione dell'SDK Copilot anziché riprendere uno stato incompatibile.

## Autenticazione

Precedenza applicata per ciascun agente durante `runCopilotAttempt`:

1. **`useLoggedInUser: true` esplicito** nell'input del tentativo — usa l'utente
   autenticato nella Copilot CLI tramite `copilotHome` dell'agente.
2. **`gitHubToken` esplicito** nell'input del tentativo (richiede `profileId` +
   `profileVersion`). Per invocazioni dirette della CLI e test che devono
   ignorare la risoluzione del profilo di autenticazione.
3. **`resolvedApiKey` + `authProfileId` risolti dal contratto** — il percorso principale
   di produzione. Il core risolve il profilo di autenticazione `github-copilot` configurato per l'agente
   (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) prima
   di invocare l'harness, quindi un profilo di autenticazione `github-copilot:<profile>` funziona
   end-to-end per configurazioni headless, Cron o con più profili senza variabili d'ambiente.
4. **Fallback delle variabili d'ambiente**, verificato nell'ordine seguente (prevale il primo valore non vuoto;
   le stringhe vuote sono considerate assenti; rispecchia la precedenza del provider `github-copilot`
   distribuita in `extensions/github-copilot/auth.ts`):
   1. `OPENCLAW_GITHUB_TOKEN` — override specifico dell'harness; consente di associare un
      token all'harness OpenClaw senza modificare la configurazione globale di `gh` /
      Copilot CLI.
   2. `COPILOT_GITHUB_TOKEN` — variabile d'ambiente standard dell'SDK / CLI Copilot.
   3. `GH_TOKEN` — variabile d'ambiente standard della CLI `gh`.
   4. `GITHUB_TOKEN` — fallback generico per il token GitHub.

   L'id sintetizzato del profilo del pool è `env:<NAME>`; la versione del profilo è
   un'impronta sha256 non reversibile del token, pertanto la rotazione del valore d'ambiente
   invalida correttamente il pool di client.

5. **`useLoggedInUser` predefinito** quando non è disponibile alcun segnale di token.

Ogni agente riceve il proprio `copilotHome`, affinché token, sessioni e
configurazione della Copilot CLI non vengano mai condivisi tra agenti sulla stessa macchina. Valore predefinito:
`<agentDir>/copilot` (mantiene lo stato dell'SDK fuori dalla stessa directory di
`models.json` / `auth-profiles.json` di OpenClaw), oppure
`~/.openclaw/agents/<agentId>/copilot` quando non viene fornita alcuna directory dell'agente.
Eseguire l'override con `copilotHome: <path>` nell'input del tentativo per una
posizione personalizzata (ad esempio, un volume condiviso per la migrazione).

I test live dell'harness usano `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` per un
token diretto. La configurazione condivisa dei test live elimina `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`
e `GITHUB_TOKEN` dopo aver predisposto profili di autenticazione reali nella home isolata dei test,
quindi un valore `gh auth token` passato tramite la variabile dedicata evita
salti erronei senza propagarsi a suite non correlate.

## Superficie di configurazione

L'harness legge la configurazione dall'input di ciascun tentativo (`runCopilotAttempt({...})`)
oltre a un piccolo insieme di valori d'ambiente predefiniti all'interno di `extensions/copilot/src/`:

| Campo                    | Scopo                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | Directory dello stato della CLI per agente (valori predefiniti indicati sopra).                                                                                                                                                                                                                                                 |
| `model`                  | Stringa o `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Omettere per usare la normale selezione del modello dell'agente; l'harness verifica che il provider risolto sia supportato.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. Deriva dalla risoluzione di `ThinkLevel` / `ReasoningLevel` di OpenClaw in `auto-reply/thinking.ts`.                                                                                                                                                          |
| `infiniteSessionConfig`  | Override facoltativo per il blocco `infiniteSessions` dell'SDK controllato da `harness.compact`. Può essere lasciato invariato in sicurezza.                                                                                                                                                                                        |
| `hooksConfig`            | Configurazione nativa facoltativa `SessionHooks` dell'SDK Copilot per callback di strumenti/MCP, prompt utente, sessione ed errori. Separata dagli hook portabili del ciclo di vita di OpenClaw.                                                                                                                                   |
| `permissionPolicy`       | Override facoltativo per il gestore `onPermissionRequest` dell'SDK per i tipi di strumenti integrati dell'SDK (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`). Il valore predefinito è `rejectAllPolicy` come rete di sicurezza; vedere [Autorizzazioni e ask_user](#permissions-and-ask_user) per il motivo per cui non viene mai effettivamente attivato. |
| `enableSessionTelemetry` | Flag facoltativo per la telemetria della sessione dell'SDK.                                                                                                                                                                                                                                                            |

Gli hook dei plugin OpenClaw non richiedono alcuna configurazione specifica di Copilot per i tentativi. L'harness
esegue `before_prompt_build` (e l'hook di compatibilità legacy `before_agent_start`),
`llm_input`, `llm_output` e `agent_end` tramite gli
helper standard dell'harness. Le Compaction dell'SDK riuscite eseguono inoltre
`before_compaction` e `after_compaction`. Gli strumenti OpenClaw collegati tramite bridge eseguono
`before_tool_call` e segnalano `after_tool_call`; `hooksConfig` resta disponibile per
callback native esclusive dell'SDK senza equivalente portabile.

Nessun altro componente di OpenClaw deve conoscere questi campi. Gli altri plugin,
canali e il codice del core vedono solo la forma standard `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult`.

## Compaction

Quando viene eseguito `harness.compact`, l'harness dell'SDK Copilot:

1. Riprende la sessione dell'SDK monitorata senza continuare il lavoro in sospeso.
2. Chiama l'RPC di Compaction della cronologia a livello di sessione dell'SDK.
3. Restituisce il risultato della Compaction dell'SDK senza scrivere file indicatori di compatibilità
   nell'area di lavoro.

La copia della trascrizione sul lato OpenClaw (riportata di seguito) continua a ricevere i messaggi
successivi alla Compaction, mantenendo coerente la cronologia della chat visibile all'utente.

## Copia della trascrizione

`runCopilotAttempt` esegue una doppia scrittura dei messaggi replicabili di ogni turno nella
trascrizione di audit di OpenClaw tramite
`extensions/copilot/src/dual-write-transcripts.ts`. La replica è circoscritta per
sessione (`copilot:${sessionId}`) e indicizzata per messaggio
(`${role}:${sha256_16(role,content)}`), quindi le voci dei turni precedenti riemesse
entrano in collisione con le chiavi già presenti su disco anziché essere duplicate.

Due livelli di contenimento degli errori racchiudono la replica affinché un errore di scrittura
della trascrizione non causi mai il fallimento del tentativo: un wrapper interno best effort, più una
protezione approfondita `.catch(...)` a livello di tentativo. Gli errori vengono registrati, non
esposti.

## Domande secondarie (`/btw`)

`/btw` **non** è nativo in questo harness. `createCopilotAgentHarness()`
lascia deliberatamente `harness.runSideQuestion` non definito
(come verificato in `extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`),
quindi il dispatcher `/btw` di OpenClaw (`src/agents/btw.ts`) ripiega sullo
stesso percorso usato per ogni runtime non Codex: il provider del modello configurato
viene chiamato direttamente con un breve prompt per la domanda secondaria e la risposta viene trasmessa in streaming tramite
`streamSimple` (nessuna sessione CLI, nessuno slot aggiuntivo nel pool).

In questo modo, le sessioni della CLI di Copilot restano riservate al ciclo principale dei turni dell'agente e
il comportamento di `/btw` rimane identico a quello degli altri runtime non Codex.

## Doctor

`extensions/copilot/doctor-contract-api.ts` viene caricato automaticamente da
`src/plugins/doctor-contract-registry.ts`. Fornisce:

- Un `legacyConfigRules` vuoto (nessun campo ritirato per ora).
- Un `normalizeCompatibilityConfig` senza operazioni (mantenuto affinché i futuri ritiri di campi
  abbiano una posizione stabile nell'albero dei sorgenti).
- Una voce `sessionRouteStateOwners`: provider `github-copilot`, runtime
  `copilot`, chiave di sessione CLI `copilot`, prefisso del profilo di autenticazione `github-copilot:`.

## Limitazioni

- L'harness rivendica `github-copilot` più gli ID dei provider BYOK personalizzati senza proprietario.
  Gli ID dei provider nativi appartenenti a un manifest restano nel runtime proprietario anche quando
  `agentRuntime.id` viene forzato a `copilot`.
- Nessuna superficie TUI; la TUI di PI rimane il fallback per i runtime privi di una
  superficie equivalente.
- Lo stato della sessione PI non viene migrato quando un agente passa a `copilot`.
  La selezione avviene per tentativo; le sessioni PI esistenti rimangono valide.
- `ask_user` usa lo stesso percorso di prompt e risposta di OpenClaw dell'harness Codex:
  quando l'SDK di Copilot richiede un input dell'utente, OpenClaw pubblica un
  prompt bloccante sul canale/TUI attivo e il successivo messaggio dell'utente
  in coda risolve la richiesta dell'SDK.

## Autorizzazioni e ask_user

L'applicazione delle autorizzazioni per gli strumenti OpenClaw collegati avviene **all'interno del wrapper dello
strumento**, non tramite il callback `onPermissionRequest` dell'SDK. Lo stesso
`wrapToolWithBeforeToolCallHook` usato da PI
(`src/agents/agent-tools.before-tool-call.ts`) viene applicato da
`createOpenClawCodingTools` a ogni strumento di programmazione: rilevamento dei cicli, criteri dei
Plugin attendibili, hook precedenti alla chiamata dello strumento e approvazioni dei Plugin in due fasi tramite
il Gateway (`plugin.approval.request`) seguono tutti esattamente lo stesso percorso di codice
dei tentativi PI nativi.

Ogni strumento SDK restituito dal bridge degli strumenti Copilot è contrassegnato con:

- `overridesBuiltInTool: true` — sostituisce lo strumento integrato della CLI di Copilot con
  lo stesso nome (edit, read, write, bash, ...) affinché ogni chiamata di strumento venga reindirizzata
  a OpenClaw.
- `skipPermission: true` — indica all'SDK di non attivare
  `onPermissionRequest({kind: "custom-tool"})` prima di invocare lo strumento. Il
  `execute()` racchiuso esegue già il controllo più completo dei criteri di OpenClaw; un
  prompt a livello di SDK aggirerebbe l'applicazione dei criteri di OpenClaw
  (consenti tutto) oppure bloccherebbe ogni chiamata di strumento (rifiuta tutto): nessuna delle due opzioni garantisce la
  parità con PI.

L'harness Codex incluso nell'albero usa la stessa separazione: gli strumenti OpenClaw collegati vengono
racchiusi (`extensions/codex/src/app-server/dynamic-tools.ts`) e i tipi di approvazione nativi
del codex-app-server
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`) vengono instradati tramite `plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`). L'equivalente nell'SDK di Copilot,
ovvero `rejectAllPolicy` con chiusura in caso di errore per qualsiasi tipo diverso da `custom-tool`
che raggiunga `onPermissionRequest`, costituisce la stessa rete di sicurezza e
in pratica non viene mai attivato perché `overridesBuiltInTool: true` sostituisce ogni
strumento integrato.

Affinché il livello degli strumenti racchiusi possa prendere decisioni sui criteri equivalenti a PI,
l'harness inoltra a
`createOpenClawCodingTools` l'intero contesto degli strumenti del tentativo PI: identità (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), canale/instradamento (`groupId`,
`currentChannelId`, `replyToMode`, opzioni degli strumenti di messaggistica), autenticazione
(`authProfileStore`), identità dell'esecuzione (`sessionKey` / `runSessionKey` derivati
da `sandboxSessionKey`, `runId`), contesto del modello (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) e hook dell'esecuzione
(`onToolOutcome`, `onYield`). Senza questi campi, gli elenchi di elementi consentiti riservati al proprietario
negano silenziosamente per impostazione predefinita, i criteri di attendibilità dei Plugin non possono determinare l'ambito
corretto e `session_status: "current"` viene risolto in una chiave sandbox obsoleta. Il
generatore del bridge è `extensions/copilot/src/tool-bridge.ts`, che rispecchia la chiamata
autorevole di PI in `src/agents/embedded-agent-runner/run/attempt.ts:1262`.
`runAttempt` risolve il contesto sandbox tramite il punto di integrazione condiviso
`resolveSandboxContext`, passa all'SDK una directory di lavoro effettiva
e inoltra `sandbox` insieme allo spazio di lavoro di generazione dei sottoagenti nel bridge degli strumenti.
Il bridge inoltra inoltre i controlli limitati di costruzione degli strumenti che
può applicare al confine dell'SDK: `includeCoreTools`, l'elenco degli strumenti consentiti
del runtime e `toolConstructionPlan`.

Il bridge usa inoltre l'helper condiviso per la superficie degli strumenti dell'harness da
`openclaw/plugin-sdk/agent-harness-tool-runtime` per garantire la parità con PI. Quando
la ricerca degli strumenti è abilitata, l'SDK vede strumenti di controllo compatti più un esecutore
nascosto del catalogo, anziché ogni schema degli strumenti OpenClaw. Quando la modalità codice è
abilitata, l'helper crea la stessa superficie di controllo della modalità codice e lo stesso ciclo di vita
del catalogo usati dagli altri harness degli agenti. Le impostazioni predefinite snelle per i modelli locali,
il filtraggio degli schemi compatibile con il runtime, l'idratazione delle directory e la
pulizia del catalogo rimangono tutti nell'helper condiviso, affinché gli harness Copilot e quelli
adiacenti a Codex non divergano.

### Token GitHub a livello di sessione

Il contratto dell'SDK di Copilot distingue il token GitHub **a livello di client**
(`CopilotClientOptions.gitHubToken`, autentica il processo CLI stesso)
dal token **a livello di sessione** (`SessionConfig.gitHubToken`, determina
l'esclusione dei contenuti, l'instradamento del modello e la quota per quella sessione; viene rispettato sia in
`createSession` sia in `resumeSession`). L'harness risolve l'autenticazione una sola volta tramite
`resolveCopilotAuth` e imposta entrambi i campi quando la modalità di autenticazione è `gitHubToken`
(un `auth.gitHubToken` esplicito o un `resolvedApiKey` risolto secondo contratto da
un profilo di autenticazione `github-copilot` configurato). Quando la modalità risolta è
`useLoggedInUser`, il campo a livello di sessione viene omesso affinché l'SDK continui a
derivare l'identità da quella connessa.

`ask_user` usa `SessionConfig.onUserInputRequest`. Il bridge accetta indici
o etichette delle opzioni per le richieste a scelta fissa, accetta risposte in formato libero quando
la richiesta dell'SDK le consente e annulla una richiesta in sospeso quando il tentativo OpenClaw
viene interrotto.

## Contenuti correlati

- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Harness Codex](/it/plugins/codex-harness)
- [Plugin per harness degli agenti (riferimento SDK)](/it/plugins/sdk-agent-harness)
