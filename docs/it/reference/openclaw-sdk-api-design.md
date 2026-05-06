---
read_when:
    - Stai implementando l'SDK pubblico proposto per le app OpenClaw
    - Ti serve il contratto di bozza per namespace, evento, risultato, artefatto, approvazione o sicurezza dell'SDK dell'app
    - Stai confrontando le risorse del protocollo Gateway con il wrapper SDK OpenClaw App di alto livello
sidebarTitle: App SDK API design
summary: Progettazione di riferimento per l'API pubblica dell'OpenClaw App SDK, la tassonomia degli eventi, gli artefatti, le approvazioni e la struttura del pacchetto
title: Progettazione dell'API dell'SDK dell'app OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:07:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Questa pagina è la progettazione dettagliata del riferimento API per l'[OpenClaw App SDK](/it/concepts/openclaw-sdk) pubblico. È intenzionalmente separata dal [Plugin SDK](/it/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` è il pacchetto esterno per app/client per comunicare con il
  Gateway. `openclaw/plugin-sdk/*` è il contratto in-process per la creazione di Plugin.
  Non importare sottopercorsi del Plugin SDK da app che devono solo eseguire agenti.
</Note>

L'SDK pubblico per app dovrebbe essere costruito in due livelli:

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

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
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

`id` è un cursore di riproduzione. I consumatori dovrebbero potersi riconnettere con
`events({ after: id })` e ricevere gli eventi persi quando la conservazione lo consente.

Famiglie di eventi normalizzati consigliate:

| Evento                | Significato                                                 |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Esecuzione accettata.                                       |
| `run.queued`          | L'esecuzione attende una corsia di sessione, un runtime o un ambiente. |
| `run.started`         | Il runtime ha avviato l'esecuzione.                         |
| `run.completed`       | L'esecuzione è terminata correttamente.                     |
| `run.failed`          | L'esecuzione è terminata con un errore.                     |
| `run.cancelled`       | L'esecuzione è stata annullata.                             |
| `run.timed_out`       | L'esecuzione ha superato il proprio timeout.                |
| `assistant.delta`     | Delta di testo dell'assistente.                             |
| `assistant.message`   | Messaggio completo dell'assistente o sostituzione.          |
| `thinking.delta`      | Delta di ragionamento o piano, quando la policy consente l'esposizione. |
| `tool.call.started`   | La chiamata allo strumento è iniziata.                      |
| `tool.call.delta`     | La chiamata allo strumento ha inviato avanzamento in streaming o output parziale. |
| `tool.call.completed` | La chiamata allo strumento è tornata correttamente.         |
| `tool.call.failed`    | La chiamata allo strumento non è riuscita.                  |
| `approval.requested`  | Un'esecuzione o uno strumento richiede approvazione.        |
| `approval.resolved`   | L'approvazione è stata concessa, negata, è scaduta o è stata annullata. |
| `question.requested`  | Il runtime chiede input all'utente o all'app host.          |
| `question.answered`   | L'app host ha fornito una risposta.                         |
| `artifact.created`    | Nuovo artefatto disponibile.                                |
| `artifact.updated`    | Un artefatto esistente è cambiato.                          |
| `session.created`     | Sessione creata.                                            |
| `session.updated`     | I metadati della sessione sono cambiati.                    |
| `session.compacted`   | È avvenuta la compattazione della sessione.                 |
| `task.updated`        | Lo stato dell'attività in background è cambiato.            |
| `git.branch`          | Il runtime ha osservato o modificato lo stato del branch.   |
| `git.diff`            | Il runtime ha prodotto o modificato un diff.                |
| `git.pr`              | Il runtime ha aperto, aggiornato o collegato una pull request. |

I payload nativi del runtime dovrebbero essere disponibili tramite `raw`, ma le app non dovrebbero
dover analizzare `raw` per la normale UI.

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
quindi le esecuzioni attuali supportate dal ciclo di vita di solito riportano numeri in millisecondi
epoch, mentre gli adapter possono ancora esporre stringhe ISO. UI ricche, tracce degli strumenti e
dettagli nativi del runtime appartengono agli eventi e agli artefatti.

`accepted` è un risultato di attesa non terminale: significa che la scadenza di attesa del Gateway
è scaduta prima che l'esecuzione producesse una fine/errore del ciclo di vita. Non deve essere trattato come
`timed_out`; `timed_out` è riservato a un'esecuzione che ha superato il proprio timeout
di runtime.

## Approvazioni e domande

Le approvazioni devono essere entità di primo livello perché gli agenti di coding attraversano continuamente
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

- id approvazione
- id esecuzione e id sessione
- tipo di richiesta
- riepilogo dell'azione richiesta
- nome dello strumento o azione dell'ambiente
- livello di rischio
- decisioni disponibili
- scadenza
- se la decisione può essere riutilizzata

Le domande sono separate dalle approvazioni. Una domanda chiede informazioni all'utente o all'app host. Un'approvazione chiede il permesso di eseguire un'azione.

## Modello ToolSpace

Le app devono comprendere la superficie degli strumenti senza importare internals dei Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

L'SDK dovrebbe esporre:

- metadati normalizzati degli strumenti
- origine: OpenClaw, MCP, Plugin, canale, runtime o app
- riepilogo dello schema
- policy di approvazione
- compatibilità runtime
- se uno strumento è nascosto, di sola lettura, capace di scrittura o capace di host

L'invocazione degli strumenti tramite l'SDK dovrebbe essere esplicita e circoscritta. La maggior parte delle app dovrebbe
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
- traiettorie runtime
- snapshot di workspace di ambienti gestiti

L'accesso agli artefatti dovrebbe supportare redazione, conservazione e URL di download senza
assumere che ogni artefatto sia un normale file locale.

## Modello di sicurezza

L'app SDK deve essere esplicito riguardo all'autorità.

Ambiti token consigliati:

| Ambito              | Consente                                            |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Elencare e ispezionare agenti.                      |
| `agent.run`         | Avviare esecuzioni.                                 |
| `session.read`      | Leggere metadati e messaggi delle sessioni.         |
| `session.write`     | Creare sessioni, inviare a sessioni, fare fork, compattare e interrompere sessioni. |
| `task.read`         | Leggere lo stato delle attività in background.      |
| `task.write`        | Annullare o modificare la policy di notifica delle attività. |
| `approval.respond`  | Approvare o negare richieste.                       |
| `tools.invoke`      | Invocare direttamente strumenti esposti.            |
| `artifacts.read`    | Elencare e scaricare artefatti.                     |
| `environment.write` | Creare o distruggere ambienti gestiti.              |
| `admin`             | Operazioni amministrative.                          |

Impostazioni predefinite:

- nessun inoltro di segreti per impostazione predefinita
- nessun pass-through illimitato delle variabili d'ambiente
- riferimenti ai segreti invece di valori dei segreti
- policy esplicita per sandbox e rete
- conservazione esplicita dell'ambiente remoto
- approvazioni per l'esecuzione host salvo prova contraria della policy
- eventi runtime grezzi redatti prima che escano dal Gateway, salvo che il chiamante abbia un
  ambito diagnostico più forte

## Provider di ambienti gestiti

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

La prima implementazione non deve necessariamente essere un SaaS ospitato. Può puntare a
host Node esistenti, workspace effimeri, runner in stile CI o ambienti in stile Testbox.
Il contratto importante è:

1. preparare il workspace
2. associare ambiente e segreti sicuri
3. avviare l'esecuzione
4. trasmettere eventi in streaming
5. raccogliere artefatti
6. pulire o conservare secondo policy

Una volta stabilizzato, un servizio cloud ospitato può implementare lo stesso contratto
del provider.

## Struttura dei pacchetti

Pacchetti consigliati:

| Pacchetto               | Scopo                                                         |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK pubblico di alto livello e client Gateway generato di basso livello. |
| `@openclaw/sdk-react`   | Hook React opzionali per dashboard e sviluppatori di app.     |
| `@openclaw/sdk-testing` | Helper di test e server Gateway fittizio per integrazioni di app. |

Il repo ha già `openclaw/plugin-sdk/*` per i Plugin. Mantieni separato quel namespace
per evitare di confondere gli autori di Plugin con gli sviluppatori di app.

## Strategia del client generato

Il client di basso livello dovrebbe essere generato da schemi di protocollo Gateway
versionati, quindi racchiuso in classi ergonomiche scritte a mano.

Livelli:

1. Fonte di verità dello schema del Gateway.
2. Client TypeScript di basso livello generato.
3. Validatori runtime per input esterni e payload degli eventi.
4. Wrapper di alto livello `OpenClaw`, `Agent`, `Session`, `Run`, `Task` e `Artifact`.
5. Esempi cookbook e test di integrazione.

Vantaggi:

- la deriva del protocollo è visibile
- i test possono confrontare i metodi generati con le esportazioni del Gateway
- l'App SDK resta indipendente dagli internals del Plugin SDK
- i consumer di basso livello hanno ancora accesso completo al protocollo
- i consumer di alto livello ottengono la piccola API di prodotto

## Correlati

- [OpenClaw App SDK](/it/concepts/openclaw-sdk)
- [Riferimento RPC del Gateway](/it/reference/rpc)
- [Loop dell'agente](/it/concepts/agent-loop)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Attività in background](/it/automation/tasks)
- [Agenti ACP](/it/tools/acp-agents)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
