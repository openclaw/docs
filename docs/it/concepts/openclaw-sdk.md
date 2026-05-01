---
read_when:
    - Stai creando un'app esterna, uno script, una dashboard, un job CI o un'estensione IDE che comunica con OpenClaw
    - Stai scegliendo tra l'App SDK e il Plugin SDK
    - Stai integrando esecuzioni degli agenti del Gateway, sessioni, eventi, approvazioni, modelli o strumenti
sidebarTitle: App SDK
summary: SDK pubblico dell'app OpenClaw per app esterne, script, dashboard, job CI ed estensioni IDE
title: SDK dell'app OpenClaw
x-i18n:
    generated_at: "2026-05-01T08:30:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6b22e9f4f809a572cfd19fd22f633a706dd23b8bee2f3c244003a0861a41073
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** è l'API client pubblica per le app esterne al
processo OpenClaw. Usa `@openclaw/sdk` quando uno script, una dashboard, un job CI, un'estensione IDE
o un'altra app esterna vuole connettersi al Gateway, avviare esecuzioni degli agenti,
trasmettere eventi in streaming, attendere risultati, annullare lavoro o ispezionare
risorse del Gateway.

<Note>
  L'App SDK è diverso dal [Plugin SDK](/it/plugins/sdk-overview).
  `@openclaw/sdk` comunica con il Gateway dall'esterno di OpenClaw.
  `openclaw/plugin-sdk/*` è solo per i plugins che vengono eseguiti dentro OpenClaw e
  registrano provider, canali, strumenti, hook o runtime attendibili.
</Note>

## Cosa Viene Fornito Oggi

`@openclaw/sdk` include:

| Superficie                | Stato  | Cosa fa                                                                    |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| `OpenClaw`                | Pronto | Punto di ingresso principale del client. Gestisce trasporto, connessione, richieste ed eventi. |
| `GatewayClientTransport`  | Pronto | Trasporto WebSocket basato sul client Gateway.                             |
| `oc.agents`               | Pronto | Elenca, crea, aggiorna, elimina e ottiene handle degli agenti.             |
| `Agent.run()`             | Pronto | Avvia un'esecuzione `agent` del Gateway e restituisce un `Run`.            |
| `oc.runs`                 | Pronto | Crea, ottiene, attende, annulla e trasmette in streaming le esecuzioni.    |
| `Run.events()`            | Pronto | Trasmette in streaming eventi normalizzati per esecuzione con replay per esecuzioni rapide. |
| `Run.wait()`              | Pronto | Chiama `agent.wait` e restituisce un `RunResult` stabile.                  |
| `Run.cancel()`            | Pronto | Chiama `sessions.abort` per ID esecuzione, con chiave di sessione quando disponibile. |
| `oc.sessions`             | Pronto | Crea, risolve, invia a, applica patch, compatta e ottiene handle di sessione. |
| `Session.send()`          | Pronto | Chiama `sessions.send` e restituisce un `Run`.                             |
| `oc.models`               | Pronto | Chiama `models.list` e l'RPC di stato `models.authStatus` corrente.        |
| `oc.tools`                | Pronto | Elenca, definisce ambiti e invoca strumenti del Gateway attraverso la pipeline di policy. |
| `oc.artifacts`            | Pronto | Elenca, ottiene e scarica artefatti di trascrizione del Gateway.           |
| `oc.approvals`            | Pronto | Elenca e risolve approvazioni exec tramite RPC di approvazione del Gateway. |
| `oc.rawEvents()`          | Pronto | Espone eventi grezzi del Gateway per consumatori avanzati.                 |
| `normalizeGatewayEvent()` | Pronto | Converte eventi grezzi del Gateway nella forma evento stabile dell'SDK.    |

L'SDK esporta anche i tipi principali usati da queste superfici:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` e tipi di
risultato correlati.

## Connettersi A Un Gateway

Crea un client con un URL Gateway esplicito oppure inietta un trasporto personalizzato per
test e runtime di app incorporate.

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

I riferimenti a modelli qualificati per provider come `openai/gpt-5.5` vengono suddivisi in override
`provider` e `model` del Gateway. `timeoutMs` resta in millisecondi nell'SDK e
viene convertito in secondi di timeout del Gateway per l'RPC `agent`.

`run.wait()` usa l'RPC `agent.wait` del Gateway. Una scadenza di attesa che termina
mentre l'esecuzione è ancora attiva restituisce `status: "accepted"` invece di fingere
che l'esecuzione stessa sia andata in timeout. Timeout di runtime, esecuzioni interrotte ed esecuzioni annullate sono
normalizzati in `timed_out` o `cancelled`.

## Creare E Riutilizzare Sessioni

Usa le sessioni quando l'app vuole uno stato di trascrizione durevole.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` chiama `sessions.send` e restituisce un `Run`. Gli handle di sessione
supportano anche:

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

| Tipo di evento        | Evento Gateway sorgente                      |
| --------------------- | ------------------------------------------- |
| `run.started`         | Avvio ciclo di vita `agent`                 |
| `run.completed`       | Fine ciclo di vita `agent`                  |
| `run.failed`          | Errore ciclo di vita `agent`                |
| `run.cancelled`       | Fine ciclo di vita interrotto/annullato     |
| `run.timed_out`       | Fine ciclo di vita per timeout              |
| `assistant.delta`     | Delta di streaming dell'assistente          |
| `assistant.message`   | Messaggio dell'assistente                   |
| `thinking.delta`      | Flusso di pensiero o piano                  |
| `tool.call.started`   | Avvio strumento/elemento/comando            |
| `tool.call.delta`     | Aggiornamento strumento/elemento/comando    |
| `tool.call.completed` | Completamento strumento/elemento/comando    |
| `tool.call.failed`    | Errore o stato bloccato di strumento/elemento/comando |
| `approval.requested`  | Richiesta di approvazione exec o plugin     |
| `approval.resolved`   | Risoluzione di approvazione exec o plugin   |
| `session.created`     | Creazione `sessions.changed`                |
| `session.updated`     | Aggiornamento `sessions.changed`            |
| `session.compacted`   | Compaction `sessions.changed`               |
| `task.updated`        | Eventi di aggiornamento attività            |
| `artifact.updated`    | Eventi del flusso patch                     |
| `raw`                 | Qualsiasi evento senza ancora una mappatura SDK stabile |

`Run.events()` filtra gli eventi su un ID esecuzione e riproduce gli eventi già visti per
esecuzioni rapide. Questo significa che il flusso documentato è sicuro:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Per flussi a livello di app, usa `oc.events()`. Per frame Gateway grezzi, usa
`oc.rawEvents()`.

## Modelli, Strumenti, Artefatti E Approvazioni

Gli helper dei modelli mappano ai metodi Gateway correnti:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Gli helper degli strumenti espongono il catalogo Gateway, la vista strumenti effettiva e l'invocazione diretta
di strumenti Gateway. `oc.tools.invoke()` restituisce un envelope tipizzato invece
di generare eccezioni per rifiuti di policy o approvazione.

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

Gli helper degli artefatti espongono la proiezione artefatti del Gateway per il contesto di sessione, esecuzione o
attività. Ogni chiamata richiede un ambito esplicito `sessionKey`, `runId` o
`taskId`:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Gli helper di approvazione usano le RPC di approvazione exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Esplicitamente Non Supportato Oggi

L'SDK include nomi per il modello di prodotto che vogliamo, ma non finge silenziosamente
che le RPC Gateway esistano. Queste chiamate attualmente generano errori espliciti di funzionalità
non supportata:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

I campi per esecuzione `workspace`, `runtime`, `environment` e `approvals` sono tipizzati
come forma futura, ma il Gateway corrente non supporta questi override
sull'RPC `agent`. Se i chiamanti li passano, l'SDK genera un errore prima di inviare l'esecuzione,
così il lavoro non viene eseguito accidentalmente con il comportamento predefinito di workspace, runtime,
ambiente o approvazione.

## App SDK Rispetto A Plugin SDK

Usa l'App SDK quando il codice vive fuori da OpenClaw:

- script Node che avviano o osservano esecuzioni di agenti
- job CI che chiamano un Gateway
- dashboard e pannelli di amministrazione
- estensioni IDE
- bridge esterni che non devono diventare plugins di canale
- test di integrazione con trasporti Gateway finti o reali

Usa il Plugin SDK quando il codice viene eseguito dentro OpenClaw:

- plugins provider
- plugins di canale
- hook di strumenti o ciclo di vita
- plugins di harness per agenti
- helper di runtime attendibili

Il codice App SDK deve importare da `@openclaw/sdk`. Il codice Plugin deve importare dai
sottopercorsi documentati `openclaw/plugin-sdk/*`. Non mescolare i due contratti.

## Documentazione Correlata

- [Progettazione dell'API OpenClaw App SDK](/it/reference/openclaw-sdk-api-design)
- [Riferimento RPC Gateway](/it/reference/rpc)
- [Ciclo dell'agente](/it/concepts/agent-loop)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Sessioni](/it/concepts/session)
- [Attività in background](/it/automation/tasks)
- [Agenti ACP](/it/tools/acp-agents)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
