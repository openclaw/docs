---
read_when:
    - Stai creando un'applicazione esterna, uno script, una dashboard, un job CI o un'estensione IDE che comunica con OpenClaw
    - Stai scegliendo tra l'App SDK e il Plugin SDK
    - Stai integrando con esecuzioni di agenti del Gateway, sessioni, eventi, approvazioni, modelli o strumenti
sidebarTitle: App SDK
summary: SDK pubblico dell'app OpenClaw per app esterne, script, dashboard, job di CI ed estensioni IDE
title: SDK dell'app OpenClaw
x-i18n:
    generated_at: "2026-04-30T08:47:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

L'**OpenClaw App SDK** è l'API client pubblica per le app esterne al
processo OpenClaw. Usa `@openclaw/sdk` quando uno script, una dashboard, un job CI, un'estensione IDE
o un'altra app esterna vuole connettersi al Gateway, avviare esecuzioni di agenti,
trasmettere eventi in streaming, attendere risultati, annullare lavori o ispezionare le
risorse del Gateway.

<Note>
  L'App SDK è diverso dal [Plugin SDK](/it/plugins/sdk-overview).
  `@openclaw/sdk` comunica con il Gateway dall'esterno di OpenClaw.
  `openclaw/plugin-sdk/*` è solo per i plugin che vengono eseguiti dentro OpenClaw e
  registrano provider, canali, strumenti, hook o runtime attendibili.
</Note>

## Cosa Viene Distribuito Oggi

`@openclaw/sdk` viene distribuito con:

| Interfaccia              | Stato    | Cosa fa                                                                      |
| ------------------------ | -------- | ---------------------------------------------------------------------------- |
| `OpenClaw`               | Pronto   | Punto di ingresso principale del client. Gestisce trasporto, connessione, richieste ed eventi. |
| `GatewayClientTransport` | Pronto   | Trasporto WebSocket basato sul client Gateway.                              |
| `oc.agents`              | Pronto   | Elenca, crea, aggiorna, elimina e ottiene handle degli agenti.              |
| `Agent.run()`            | Pronto   | Avvia un'esecuzione Gateway `agent` e restituisce una `Run`.                |
| `oc.runs`                | Pronto   | Crea, ottiene, attende, annulla e trasmette in streaming le esecuzioni.     |
| `Run.events()`           | Pronto   | Trasmette in streaming eventi normalizzati per esecuzione con replay per esecuzioni rapide. |
| `Run.wait()`             | Pronto   | Chiama `agent.wait` e restituisce un `RunResult` stabile.                   |
| `Run.cancel()`           | Pronto   | Chiama `sessions.abort` per id dell'esecuzione, con chiave di sessione quando disponibile. |
| `oc.sessions`            | Pronto   | Crea, risolve, invia a, applica patch, compatta e ottiene handle di sessione. |
| `Session.send()`         | Pronto   | Chiama `sessions.send` e restituisce una `Run`.                             |
| `oc.models`              | Pronto   | Chiama `models.list` e l'RPC di stato corrente `models.authStatus`.         |
| `oc.tools`               | Parziale | Elenca il catalogo degli strumenti e gli strumenti effettivi; l'invocazione diretta degli strumenti non è collegata. |
| `oc.approvals`           | Pronto   | Elenca e risolve le approvazioni exec tramite RPC di approvazione del Gateway. |
| `oc.rawEvents()`         | Pronto   | Espone gli eventi grezzi del Gateway per consumatori avanzati.              |
| `normalizeGatewayEvent()` | Pronto  | Converte gli eventi grezzi del Gateway nella forma evento stabile dell'SDK. |

L'SDK esporta anche i tipi principali usati da queste interfacce:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` e tipi di risultato correlati.

## Connettersi A Un Gateway

Crea un client con un URL Gateway esplicito, oppure inietta un trasporto personalizzato per
test e runtime di app incorporati.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` è equivalente a `url`. L'opzione
`gateway: "auto"` è accettata dal costruttore, ma la scoperta automatica del Gateway
non è ancora una funzionalità SDK separata; passa `url` quando l'app non sa già
come scoprire il Gateway.

Per i test, passa un oggetto che implementa `OpenClawTransport`:

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## Eseguire Un Agente

Usa `oc.agents.get(id)` quando l'app vuole un handle di agente, poi chiama
`agent.run()`.

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

I riferimenti a modelli qualificati per provider, come `openai/gpt-5.5`, vengono suddivisi in override Gateway
`provider` e `model`. `timeoutMs` resta in millisecondi nell'SDK e
viene convertito in secondi di timeout Gateway per l'RPC `agent`.

`run.wait()` usa l'RPC Gateway `agent.wait`. Una scadenza di attesa che scade
mentre l'esecuzione è ancora attiva restituisce `status: "accepted"` invece di far finta
che l'esecuzione stessa sia scaduta. Timeout di runtime, esecuzioni interrotte ed esecuzioni annullate vengono
normalizzati in `timed_out` o `cancelled`.

## Creare E Riutilizzare Sessioni

Usa le sessioni quando l'app vuole uno stato del transcript duraturo.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` chiama `sessions.send` e restituisce una `Run`. Gli handle di sessione supportano anche:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Trasmettere Eventi In Streaming

L'SDK normalizza gli eventi grezzi del Gateway in un envelope `OpenClawEvent` stabile:

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
  raw?: GatewayEvent;
};
```

I tipi di evento comuni includono:

| Tipo di evento       | Evento Gateway di origine                  |
| -------------------- | ------------------------------------------ |
| `run.started`        | Avvio del ciclo di vita `agent`            |
| `run.completed`      | Fine del ciclo di vita `agent`             |
| `run.failed`         | Errore del ciclo di vita `agent`           |
| `run.cancelled`      | Fine del ciclo di vita interrotta/annullata |
| `run.timed_out`      | Fine del ciclo di vita per timeout         |
| `assistant.delta`    | Delta di streaming dell'assistente         |
| `assistant.message`  | Messaggio dell'assistente                  |
| `thinking.delta`     | Flusso di ragionamento o piano             |
| `tool.call.started`  | Avvio di strumento/elemento/comando        |
| `tool.call.delta`    | Aggiornamento di strumento/elemento/comando |
| `tool.call.completed` | Completamento di strumento/elemento/comando |
| `tool.call.failed`   | Errore o stato bloccato di strumento/elemento/comando |
| `approval.requested` | Richiesta di approvazione exec o plugin    |
| `approval.resolved`  | Risoluzione di approvazione exec o plugin  |
| `session.created`    | Creazione `sessions.changed`               |
| `session.updated`    | Aggiornamento `sessions.changed`           |
| `session.compacted`  | Compaction `sessions.changed`              |
| `task.updated`       | Eventi di aggiornamento attività           |
| `artifact.updated`   | Eventi di streaming patch                  |
| `raw`                | Qualsiasi evento senza ancora una mappatura SDK stabile |

`Run.events()` filtra gli eventi su un singolo id di esecuzione e riproduce gli eventi già visti per
esecuzioni rapide. Questo significa che il flusso documentato è sicuro:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Per stream a livello di app, usa `oc.events()`. Per frame Gateway grezzi, usa
`oc.rawEvents()`.

## Modelli, Strumenti E Approvazioni

Gli helper dei modelli vengono mappati ai metodi Gateway correnti:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Gli helper degli strumenti espongono il catalogo Gateway e la vista degli strumenti effettivi:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Gli helper di approvazione usano gli RPC di approvazione exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Esplicitamente Non Supportato Oggi

L'SDK include nomi per il modello di prodotto che vogliamo, ma non finge silenziosamente
che esistano RPC Gateway. Queste chiamate al momento generano errori espliciti di
funzionalità non supportata:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

I campi per esecuzione `workspace`, `runtime`, `environment` e `approvals` sono tipizzati
come forma futura, ma il Gateway corrente non supporta quegli override sull'RPC
`agent`. Se i chiamanti li passano, l'SDK genera un errore prima di inviare l'esecuzione
così il lavoro non viene eseguito accidentalmente con il comportamento predefinito di workspace, runtime,
ambiente o approvazione.

## App SDK Rispetto A Plugin SDK

Usa l'App SDK quando il codice vive fuori da OpenClaw:

- script Node che avviano o osservano esecuzioni di agenti
- job CI che chiamano un Gateway
- dashboard e pannelli di amministrazione
- estensioni IDE
- bridge esterni che non devono diventare plugin di canale
- test di integrazione con trasporti Gateway falsi o reali

Usa il Plugin SDK quando il codice viene eseguito dentro OpenClaw:

- plugin provider
- plugin di canale
- strumenti o hook del ciclo di vita
- plugin harness per agenti
- helper runtime attendibili

Il codice App SDK deve importare da `@openclaw/sdk`. Il codice Plugin deve importare dai
sottopercorsi documentati `openclaw/plugin-sdk/*`. Non mescolare i due contratti.

## Documentazione Correlata

- [Progettazione API OpenClaw App SDK](/it/reference/openclaw-sdk-api-design)
- [Riferimento RPC Gateway](/it/reference/rpc)
- [Ciclo agente](/it/concepts/agent-loop)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Sessioni](/it/concepts/session)
- [Attività in background](/it/automation/tasks)
- [Agenti ACP](/it/tools/acp-agents)
- [Panoramica Plugin SDK](/it/plugins/sdk-overview)
