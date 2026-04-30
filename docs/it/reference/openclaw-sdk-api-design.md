---
read_when:
    - Stai implementando l'SDK pubblico proposto per l'app OpenClaw
    - Ti serve il contratto in bozza per namespace, evento, risultato, artefatto, approvazione o sicurezza per l'SDK dell'app
    - Stai confrontando le risorse del protocollo Gateway con il wrapper di alto livello di OpenClaw App SDK
sidebarTitle: App SDK API design
summary: Design di riferimento per l'API pubblica dell'SDK dell'app OpenClaw, la tassonomia degli eventi, gli artefatti, le approvazioni e la struttura del pacchetto
title: Progettazione dell'API dell'SDK per app OpenClaw
x-i18n:
    generated_at: "2026-04-30T09:11:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Questa pagina è il progetto dettagliato del riferimento API per lo
[SDK per app OpenClaw](/it/concepts/openclaw-sdk) pubblico. È intenzionalmente separata dal
[Plugin SDK](/it/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` è il pacchetto esterno per app/client per comunicare con il
  Gateway. `openclaw/plugin-sdk/*` è il contratto di authoring dei Plugin in-process.
  Non importare sottopercorsi del Plugin SDK da app che devono solo eseguire agenti.
</Note>

L'SDK pubblico per app dovrebbe essere costruito in due livelli:

1. Un client Gateway generato di basso livello.
2. Un wrapper ergonomico di alto livello con oggetti `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` e `Environment`.

## Progettazione dei namespace

I namespace di basso livello dovrebbero seguire da vicino le risorse Gateway:

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

I wrapper di alto livello dovrebbero restituire oggetti che rendono piacevoli i flussi comuni:

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## Contratto degli eventi

L'SDK pubblico dovrebbe esporre eventi versionati, riproducibili e normalizzati.

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: unknown;
};
```

`id` è un cursore di riproduzione. I consumer dovrebbero potersi riconnettere con
`events({ after: id })` e ricevere gli eventi persi quando la conservazione lo consente.

Famiglie di eventi normalizzati consigliate:

| Evento                | Significato                                                |
| --------------------- | ---------------------------------------------------------- |
| `run.created`         | Run accettata.                                             |
| `run.queued`          | La run è in attesa di una lane di sessione, runtime o ambiente. |
| `run.started`         | Il runtime ha avviato l'esecuzione.                        |
| `run.completed`       | Run completata correttamente.                              |
| `run.failed`          | Run terminata con un errore.                               |
| `run.cancelled`       | Run annullata.                                             |
| `run.timed_out`       | Run oltre il proprio timeout.                              |
| `assistant.delta`     | Delta di testo dell'assistente.                            |
| `assistant.message`   | Messaggio completo dell'assistente o sostituzione.         |
| `thinking.delta`      | Delta di ragionamento o piano, quando la policy ne consente l'esposizione. |
| `tool.call.started`   | Chiamata allo strumento iniziata.                          |
| `tool.call.delta`     | La chiamata allo strumento ha trasmesso avanzamento o output parziale. |
| `tool.call.completed` | Chiamata allo strumento completata correttamente.           |
| `tool.call.failed`    | Chiamata allo strumento non riuscita.                       |
| `approval.requested`  | Una run o uno strumento richiede approvazione.              |
| `approval.resolved`   | L'approvazione è stata concessa, negata, è scaduta o è stata annullata. |
| `question.requested`  | Il runtime chiede input all'utente o all'app host.          |
| `question.answered`   | L'app host ha fornito una risposta.                         |
| `artifact.created`    | Nuovo artefatto disponibile.                               |
| `artifact.updated`    | Artefatto esistente modificato.                            |
| `session.created`     | Sessione creata.                                           |
| `session.updated`     | Metadati della sessione modificati.                        |
| `session.compacted`   | Compaction della sessione avvenuta.                        |
| `task.updated`        | Stato del task in background modificato.                   |
| `git.branch`          | Il runtime ha osservato o modificato lo stato del branch.   |
| `git.diff`            | Il runtime ha prodotto o modificato una diff.               |
| `git.pr`              | Il runtime ha aperto, aggiornato o collegato una pull request. |

I payload nativi del runtime dovrebbero essere disponibili tramite `raw`, ma le app non dovrebbero
dover analizzare `raw` per una UI normale.

## Contratto del risultato

`Run.wait()` dovrebbe restituire un envelope di risultato stabile:

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

Il risultato dovrebbe essere semplice e stabile. I valori timestamp preservano la forma del Gateway,
quindi le run attuali basate sul ciclo di vita in genere riportano numeri in millisecondi epoch
mentre gli adapter possono ancora esporre stringhe ISO. UI ricca, tracce degli strumenti e
dettagli nativi del runtime appartengono a eventi e artefatti.

`accepted` è un risultato di attesa non terminale: significa che la scadenza di attesa del Gateway
è scaduta prima che la run producesse una fine/errore del ciclo di vita. Non deve essere trattato come
`timed_out`; `timed_out` è riservato a una run che ha superato il proprio timeout di runtime.

## Approvazioni e domande

Le approvazioni devono essere entità di prima classe perché gli agenti di coding attraversano costantemente
confini di sicurezza.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Gli eventi di approvazione dovrebbero includere:

- id dell'approvazione
- id della run e id della sessione
- tipo di richiesta
- riepilogo dell'azione richiesta
- nome dello strumento o azione sull'ambiente
- livello di rischio
- decisioni disponibili
- scadenza
- se la decisione può essere riutilizzata

Le domande sono separate dalle approvazioni. Una domanda chiede informazioni all'utente o all'app host. Un'approvazione chiede il permesso di eseguire un'azione.

## Modello ToolSpace

Le app devono comprendere la superficie degli strumenti senza importare gli internals dei Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

L'SDK dovrebbe esporre:

- metadati degli strumenti normalizzati
- origine: OpenClaw, MCP, Plugin, canale, runtime o app
- riepilogo dello schema
- policy di approvazione
- compatibilità runtime
- se uno strumento è nascosto, di sola lettura, capace di scrittura o capace come host

L'invocazione degli strumenti tramite l'SDK dovrebbe essere esplicita e con ambito definito. La maggior parte delle app dovrebbe
eseguire agenti, non chiamare direttamente strumenti arbitrari.

## Modello degli artefatti

Gli artefatti dovrebbero coprire più dei file.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

Esempi comuni:

- modifiche ai file e file generati
- bundle di patch
- diff VCS
- screenshot e output multimediali
- log e bundle di tracce
- link a pull request
- traiettorie del runtime
- snapshot di workspace di ambienti gestiti

L'accesso agli artefatti dovrebbe supportare redazione, conservazione e URL di download senza
presumere che ogni artefatto sia un normale file locale.

## Modello di sicurezza

L'SDK per app deve essere esplicito sull'autorità.

Scope token consigliati:

| Scope               | Consente                                            |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Elencare e ispezionare agenti.                      |
| `agent.run`         | Avviare run.                                        |
| `session.read`      | Leggere metadati e messaggi della sessione.         |
| `session.write`     | Creare, inviare a, effettuare fork, compattare e interrompere sessioni. |
| `task.read`         | Leggere lo stato dei task in background.            |
| `task.write`        | Annullare o modificare la policy di notifica dei task. |
| `approval.respond`  | Approvare o negare richieste.                       |
| `tools.invoke`      | Invocare direttamente strumenti esposti.            |
| `artifacts.read`    | Elencare e scaricare artefatti.                     |
| `environment.write` | Creare o distruggere ambienti gestiti.              |
| `admin`             | Operazioni amministrative.                          |

Impostazioni predefinite:

- nessun inoltro dei secret per impostazione predefinita
- nessun pass-through illimitato delle variabili d'ambiente
- riferimenti ai secret invece dei valori dei secret
- policy esplicita di sandbox e rete
- conservazione esplicita dell'ambiente remoto
- approvazioni per l'esecuzione host a meno che la policy dimostri diversamente
- eventi runtime grezzi redatti prima che escano dal Gateway, a meno che il chiamante abbia uno
  scope diagnostico più forte

## Provider di ambienti gestiti

Gli agenti gestiti dovrebbero essere implementati come provider di ambiente.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

La prima implementazione non deve necessariamente essere una SaaS ospitata. Può indirizzare
host Node esistenti, workspace effimeri, runner in stile CI o ambienti in stile Testbox.
Il contratto importante è:

1. preparare il workspace
2. associare ambiente e secret sicuri
3. avviare la run
4. trasmettere eventi in streaming
5. raccogliere artefatti
6. pulire o conservare in base alla policy

Una volta che questo è stabile, un servizio cloud ospitato può implementare lo stesso contratto
di provider.

## Struttura dei pacchetti

Pacchetti consigliati:

| Pacchetto               | Scopo                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK pubblico di alto livello e client Gateway generato di basso livello. |
| `@openclaw/sdk-react`   | Hook React opzionali per dashboard e sviluppatori di app.     |
| `@openclaw/sdk-testing` | Helper di test e server Gateway finto per integrazioni app.   |

Il repository dispone già di `openclaw/plugin-sdk/*` per i Plugin. Mantieni separato questo namespace
per evitare di confondere gli autori di Plugin con gli sviluppatori di app.

## Strategia del client generato

Il client di basso livello dovrebbe essere generato da schemi del protocollo Gateway versionati, poi incapsulato in classi ergonomiche scritte manualmente.

Stratificazione:

1. Fonte di verità degli schemi Gateway.
2. Client TypeScript di basso livello generato.
3. Validatori a runtime per input esterni e payload degli eventi.
4. Wrapper di alto livello `OpenClaw`, `Agent`, `Session`, `Run`, `Task` e `Artifact`.
5. Esempi pratici e test di integrazione.

Vantaggi:

- la deriva del protocollo è visibile
- i test possono confrontare i metodi generati con le esportazioni Gateway
- l'SDK App resta indipendente dagli interni del Plugin SDK
- i consumatori di basso livello hanno comunque accesso completo al protocollo
- i consumatori di alto livello ottengono la piccola API di prodotto

## Documenti correlati

- [SDK App OpenClaw](/it/concepts/openclaw-sdk)
- [Riferimento RPC Gateway](/it/reference/rpc)
- [Loop dell'agente](/it/concepts/agent-loop)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Attività in background](/it/automation/tasks)
- [Agenti ACP](/it/tools/acp-agents)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
