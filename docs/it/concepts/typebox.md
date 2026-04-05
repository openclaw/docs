---
read_when:
    - Aggiornamento degli schemi del protocollo o della generazione del codice
summary: Schemi TypeBox come unica fonte di verità per il protocollo gateway
title: TypeBox
x-i18n:
    generated_at: "2026-04-05T13:51:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f508523998f94d12fbd6ce98d8a7d49fa641913196a4ab7b01f91f83c01c7eb
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox come fonte di verità del protocollo

Ultimo aggiornamento: 2026-01-10

TypeBox è una libreria di schemi TypeScript-first. La usiamo per definire il **protocollo Gateway
WebSocket** (handshake, richiesta/risposta, eventi server). Questi schemi guidano la **validazione a runtime**, l'**esportazione JSON Schema** e la **generazione di codice Swift** per
l'app macOS. Un'unica fonte di verità; tutto il resto viene generato.

Se vuoi il contesto del protocollo a un livello più alto, inizia da
[Architettura del gateway](/concepts/architecture).

## Modello mentale (30 secondi)

Ogni messaggio Gateway WS è uno di tre frame:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Il primo frame **deve** essere una richiesta `connect`. Dopo di che, i client possono chiamare
metodi (ad esempio `health`, `send`, `chat.send`) e sottoscriversi agli eventi (ad esempio
`presence`, `tick`, `agent`).

Flusso di connessione (minimo):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Metodi + eventi comuni:

| Categoria   | Esempi                                                     | Note                               |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                              | `connect` deve essere il primo     |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | gli effetti collaterali richiedono `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat usa questi                 |
| Sessions   | `sessions.list`, `sessions.patch`, `sessions.delete`       | amministrazione delle sessioni     |
| Automation | `wake`, `cron.list`, `cron.run`, `cron.runs`               | controllo wake + cron              |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + azioni dei nodi       |
| Events     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push del server                    |

L'inventario **discovery** autorevole pubblicizzato si trova in
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Dove si trovano gli schemi

- Sorgente: `src/gateway/protocol/schema.ts`
- Validator runtime (AJV): `src/gateway/protocol/index.ts`
- Registro delle funzionalità/discovery pubblicizzate: `src/gateway/server-methods-list.ts`
- Handshake del server + dispatch dei metodi: `src/gateway/server.impl.ts`
- Client node: `src/gateway/client.ts`
- JSON Schema generato: `dist/protocol.schema.json`
- Modelli Swift generati: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline attuale

- `pnpm protocol:gen`
  - scrive JSON Schema (draft‑07) in `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - genera i modelli Swift del gateway
- `pnpm protocol:check`
  - esegue entrambi i generatori e verifica che l'output sia stato salvato nel commit

## Come vengono usati gli schemi a runtime

- **Lato server**: ogni frame in entrata viene validato con AJV. L'handshake accetta solo
  una richiesta `connect` i cui parametri corrispondono a `ConnectParams`.
- **Lato client**: il client JS valida i frame di eventi e risposte prima di
  usarli.
- **Feature discovery**: il Gateway invia un elenco conservativo `features.methods`
  e `features.events` in `hello-ok` da `listGatewayMethods()` e
  `GATEWAY_EVENTS`.
- Questo elenco discovery non è un dump generato di ogni helper richiamabile in
  `coreGatewayHandlers`; alcune RPC helper sono implementate in
  `src/gateway/server-methods/*.ts` senza essere elencate nell'elenco delle funzionalità
  pubblicizzate.

## Esempi di frame

Connect (primo messaggio):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Risposta hello-ok:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Richiesta + risposta:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Evento:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Client minimo (Node.js)

Flusso utile più piccolo: connect + health.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## Esempio pratico: aggiungere un metodo end-to-end

Esempio: aggiungere una nuova richiesta `system.echo` che restituisce `{ ok: true, text }`.

1. **Schema (fonte di verità)**

Aggiungi a `src/gateway/protocol/schema.ts`:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

Aggiungi entrambi a `ProtocolSchemas` ed esporta i tipi:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validazione**

In `src/gateway/protocol/index.ts`, esporta un validator AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Comportamento del server**

Aggiungi un handler in `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Registralo in `src/gateway/server-methods.ts` (unisce già `systemHandlers`),
quindi aggiungi `"system.echo"` all'input di `listGatewayMethods` in
`src/gateway/server-methods-list.ts`.

Se il metodo può essere chiamato da client operatore o nodo, classificalo anche in
`src/gateway/method-scopes.ts` in modo che l'applicazione dell'ambito e la pubblicizzazione delle feature
`hello-ok` rimangano allineate.

4. **Rigenera**

```bash
pnpm protocol:check
```

5. **Test + documentazione**

Aggiungi un test server in `src/gateway/server.*.test.ts` e annota il metodo nella documentazione.

## Comportamento della generazione di codice Swift

Il generatore Swift emette:

- enum `GatewayFrame` con i casi `req`, `res`, `event` e `unknown`
- struct/enum di payload fortemente tipizzate
- valori `ErrorCode` e `GATEWAY_PROTOCOL_VERSION`

I tipi di frame sconosciuti vengono preservati come payload grezzi per la compatibilità futura.

## Versioning + compatibilità

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le incompatibilità.
- I modelli Swift mantengono i tipi di frame sconosciuti per evitare di rompere i client meno recenti.

## Pattern e convenzioni degli schemi

- La maggior parte degli oggetti usa `additionalProperties: false` per payload rigorosi.
- `NonEmptyString` è il valore predefinito per ID e nomi di metodo/evento.
- Il `GatewayFrame` di primo livello usa un **discriminatore** su `type`.
- I metodi con effetti collaterali di solito richiedono un `idempotencyKey` nei parametri
  (esempio: `send`, `poll`, `agent`, `chat.send`).
- `agent` accetta `internalEvents` facoltativi per il contesto di orchestrazione generato a runtime
  (ad esempio il passaggio di completamento di attività subagent/cron); trattalo come una superficie API interna.

## JSON Schema live

Il JSON Schema generato si trova nel repo in `dist/protocol.schema.json`. Il
file raw pubblicato è normalmente disponibile qui:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Quando modifichi gli schemi

1. Aggiorna gli schemi TypeBox.
2. Registra il metodo/evento in `src/gateway/server-methods-list.ts`.
3. Aggiorna `src/gateway/method-scopes.ts` quando la nuova RPC richiede la classificazione dell'ambito operatore o
   nodo.
4. Esegui `pnpm protocol:check`.
5. Esegui il commit dello schema rigenerato + dei modelli Swift.
