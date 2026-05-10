---
read_when:
    - Stai implementando l'SDK pubblico proposto per app OpenClaw
    - È necessario il contratto bozza per namespace, evento, risultato, artefatto, approvazione o sicurezza per l'SDK dell'app
    - Stai confrontando le risorse del protocollo Gateway con il wrapper OpenClaw App SDK di alto livello
sidebarTitle: App SDK API design
summary: Progetto di riferimento per l'API pubblica dell'SDK dell'app OpenClaw, la tassonomia degli eventi, gli artefatti, le approvazioni e la struttura del pacchetto
title: Progettazione dell'API dell'SDK dell'app OpenClaw
x-i18n:
    generated_at: "2026-05-10T19:51:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Questa pagina è la progettazione dettagliata del riferimento API per l'[OpenClaw App SDK](/it/concepts/openclaw-sdk) pubblico. È intenzionalmente separata dal [Plugin SDK](/it/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` è il pacchetto app/client esterno per comunicare con il
  Gateway. `openclaw/plugin-sdk/*` è il contratto di authoring dei plugin
  in-process. Non importare sottopercorsi del Plugin SDK da app che devono solo
  eseguire agenti.
</Note>

L'SDK per app pubblico dovrebbe essere costruito in due livelli:

1. Un client Gateway generato di basso livello.
2. Un wrapper ergonomico di alto livello con oggetti `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` ed `Environment`.

## Progettazione dei namespace

I namespace di basso livello dovrebbero seguire da vicino le risorse del Gateway:

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

oc.tasks.list({ status: "running" });
oc.tasks.get(taskId);
oc.tasks.cancel(taskId, { reason });
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
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

`id` è un cursore di replay. I consumer dovrebbero poter riconnettersi con
`events({ after: id })` e ricevere gli eventi persi quando la conservazione lo consente.

Famiglie di eventi normalizzate consigliate:

| Evento                | Significato                                                  |
| --------------------- | ------------------------------------------------------------ |
| `run.created`         | Run accettata.                                               |
| `run.queued`          | La run è in attesa di una lane di sessione, runtime o ambiente. |
| `run.started`         | Il runtime ha iniziato l'esecuzione.                         |
| `run.completed`       | La run è terminata correttamente.                            |
| `run.failed`          | La run è terminata con un errore.                            |
| `run.cancelled`       | La run è stata annullata.                                    |
| `run.timed_out`       | La run ha superato il timeout.                               |
| `assistant.delta`     | Delta del testo dell'assistente.                             |
| `assistant.message`   | Messaggio completo dell'assistente o sostituzione.           |
| `thinking.delta`      | Delta di ragionamento o piano, quando la policy consente l'esposizione. |
| `tool.call.started`   | Chiamata allo strumento iniziata.                            |
| `tool.call.delta`     | La chiamata allo strumento ha trasmesso progressi o output parziale. |
| `tool.call.completed` | La chiamata allo strumento è stata restituita correttamente. |
| `tool.call.failed`    | Chiamata allo strumento non riuscita.                        |
| `approval.requested`  | Una run o uno strumento richiede approvazione.                |
| `approval.resolved`   | L'approvazione è stata concessa, negata, scaduta o annullata. |
| `question.requested`  | Il runtime chiede input all'utente o all'app host.            |
| `question.answered`   | L'app host ha fornito una risposta.                          |
| `artifact.created`    | Nuovo artifact disponibile.                                  |
| `artifact.updated`    | Artifact esistente modificato.                               |
| `session.created`     | Sessione creata.                                             |
| `session.updated`     | Metadati della sessione modificati.                          |
| `session.compacted`   | È avvenuta la Compaction della sessione.                     |
| `task.updated`        | Stato dell'attività in background modificato.                |
| `git.branch`          | Il runtime ha osservato o modificato lo stato del branch.    |
| `git.diff`            | Il runtime ha prodotto o modificato un diff.                 |
| `git.pr`              | Il runtime ha aperto, aggiornato o collegato una pull request. |

I payload nativi del runtime dovrebbero essere disponibili tramite `raw`, ma le app non dovrebbero
dover analizzare `raw` per l'interfaccia utente normale.

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
quindi le run attuali basate sul ciclo di vita di solito riportano numeri in millisecondi epoch,
mentre gli adapter possono ancora esporre stringhe ISO. Interfacce utente ricche, tracce degli strumenti e
dettagli nativi del runtime appartengono a eventi e artifact.

`accepted` è un risultato di attesa non terminale: significa che la scadenza di attesa del Gateway
è scaduta prima che la run producesse una fine/errore del ciclo di vita. Non deve essere trattato come
`timed_out`; `timed_out` è riservato a una run che ha superato il proprio timeout di runtime.

## Approvazioni e domande

Le approvazioni devono essere first-class perché gli agenti di coding attraversano costantemente
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
- nome dello strumento o azione dell'ambiente
- livello di rischio
- decisioni disponibili
- scadenza
- se la decisione può essere riutilizzata

Le domande sono separate dalle approvazioni. Una domanda chiede informazioni all'utente o all'app host.
Un'approvazione chiede il permesso di eseguire un'azione.

## Modello ToolSpace

Le app devono comprendere la superficie degli strumenti senza importare interni dei Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

L'SDK dovrebbe esporre:

- metadati degli strumenti normalizzati
- fonte: OpenClaw, MCP, Plugin, canale, runtime o app
- riepilogo dello schema
- policy di approvazione
- compatibilità runtime
- se uno strumento è nascosto, readonly, capace di scrittura o capace di host

L'invocazione degli strumenti tramite l'SDK dovrebbe essere esplicita e con ambito definito. La maggior parte delle app dovrebbe
eseguire agenti, non chiamare direttamente strumenti arbitrari.

## Modello degli artifact

Gli artifact dovrebbero coprire più dei file.

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

L'accesso agli artifact dovrebbe supportare redazione, conservazione e URL di download senza
presumere che ogni artifact sia un normale file locale.

## Modello di sicurezza

L'SDK per app deve essere esplicito sull'autorità.

Ambiti token consigliati:

| Ambito              | Consente                                             |
| ------------------- | ---------------------------------------------------- |
| `agent.read`        | Elencare e ispezionare agenti.                       |
| `agent.run`         | Avviare run.                                         |
| `session.read`      | Leggere metadati e messaggi della sessione.          |
| `session.write`     | Creare, inviare a, forkare, compattare e interrompere sessioni. |
| `task.read`         | Leggere lo stato delle attività in background.       |
| `task.write`        | Annullare o modificare la policy di notifica delle attività. |
| `approval.respond`  | Approvare o negare richieste.                        |
| `tools.invoke`      | Invocare direttamente strumenti esposti.             |
| `artifacts.read`    | Elencare e scaricare artifact.                       |
| `environment.write` | Creare o distruggere ambienti gestiti.               |
| `admin`             | Operazioni amministrative.                           |

Impostazioni predefinite:

- nessun inoltro di segreti per impostazione predefinita
- nessun pass-through illimitato delle variabili d'ambiente
- riferimenti ai segreti invece dei valori dei segreti
- policy esplicita di sandbox e rete
- conservazione esplicita dell'ambiente remoto
- approvazioni per l'esecuzione host salvo prova contraria da parte della policy
- eventi runtime raw redatti prima che lascino il Gateway, salvo che il chiamante abbia un
  ambito diagnostico più forte

## Provider di ambiente gestito

Gli agenti gestiti dovrebbero essere implementati come provider di ambienti.

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

La prima implementazione non deve essere necessariamente un SaaS ospitato. Può puntare a
host Node esistenti, workspace effimeri, runner in stile CI o ambienti in stile Testbox.
Il contratto importante è:

1. preparare il workspace
2. associare ambiente sicuro e segreti
3. avviare la run
4. trasmettere eventi in streaming
5. raccogliere artifact
6. pulire o conservare secondo la policy

Una volta stabilizzato questo, un servizio cloud ospitato può implementare lo stesso contratto
di provider.

## Struttura dei pacchetti

Pacchetti consigliati:

| Pacchetto               | Scopo                                                        |
| ----------------------- | ------------------------------------------------------------ |
| `@openclaw/sdk`         | SDK pubblico di alto livello e client Gateway generato di basso livello. |
| `@openclaw/sdk-react`   | Hook React opzionali per dashboard e app builder.            |
| `@openclaw/sdk-testing` | Helper di test e server Gateway finto per integrazioni app.  |

Il repo ha già `openclaw/plugin-sdk/*` per i Plugin. Mantieni quel namespace
separato per evitare di confondere gli autori di Plugin con gli sviluppatori di app.

## Strategia del client generato

Il client di basso livello dovrebbe essere generato da schemi del protocollo Gateway
versionati, quindi racchiuso da classi ergonomiche scritte a mano.

Stratificazione:

1. Fonte di verità dello schema del Gateway.
2. Client TypeScript di basso livello generato.
3. Validatori runtime per input esterni e payload di eventi.
4. Wrapper di alto livello `OpenClaw`, `Agent`, `Session`, `Run`, `Task` e `Artifact`.
5. Esempi di ricettario e test di integrazione.

Vantaggi:

- la deriva del protocollo è visibile
- i test possono confrontare i metodi generati con le esportazioni del Gateway
- l'App SDK resta indipendente dagli interni del Plugin SDK
- i consumer di basso livello hanno comunque accesso completo al protocollo
- i consumer di alto livello ottengono la piccola API di prodotto

## Correlati

- [OpenClaw App SDK](/it/concepts/openclaw-sdk)
- [Riferimento RPC del Gateway](/it/reference/rpc)
- [Ciclo dell'agente](/it/concepts/agent-loop)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Attività in background](/it/automation/tasks)
- [Agenti ACP](/it/tools/acp-agents)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
