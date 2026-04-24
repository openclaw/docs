---
read_when:
    - Aggiornamento degli schemi del protocollo o della generazione del codice
summary: Schemi TypeBox come unica fonte di verità per il protocollo Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-04-24T08:38:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox come fonte di verità del protocollo

Ultimo aggiornamento: 2026-01-10

TypeBox è una libreria di schemi TypeScript-first. La usiamo per definire il **protocollo
WebSocket del Gateway** (handshake, request/response, eventi server). Questi schemi
guidano la **validazione a runtime**, l'**esportazione JSON Schema** e la **generazione di codice Swift** per l'app macOS. Un'unica fonte di verità; tutto il resto è generato.

Se vuoi il contesto del protocollo a un livello più alto, inizia da
[Architettura del Gateway](/it/concepts/architecture).

## Modello mentale (30 secondi)

Ogni messaggio WS del Gateway è uno di tre frame:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Il primo frame **deve** essere una request `connect`. Dopo di ciò, i client possono chiamare
metodi (per esempio `health`, `send`, `chat.send`) e sottoscrivere eventi (per esempio
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
| ----------- | ---------------------------------------------------------- | ---------------------------------- |
| Core        | `connect`, `health`, `status`                              | `connect` deve essere il primo     |
| Messaggistica | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | gli effetti collaterali richiedono `idempotencyKey` |
| Chat        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat usa questi                 |
| Sessioni    | `sessions.list`, `sessions.patch`, `sessions.delete`       | amministrazione sessioni           |
| Automazione | `wake`, `cron.list`, `cron.run`, `cron.runs`               | controllo wake + Cron             |
| Node        | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + azioni Node           |
| Eventi      | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push del server                    |

L'inventario **discovery** autorevole pubblicizzato si trova in
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Dove si trovano gli schemi

- Sorgente: `src/gateway/protocol/schema.ts`
- Validator runtime (AJV): `src/gateway/protocol/index.ts`
- Registro di feature/discovery pubblicizzato: `src/gateway/server-methods-list.ts`
- Handshake server + dispatch dei metodi: `src/gateway/server.impl.ts`
- Client Node: `src/gateway/client.ts`
- JSON Schema generato: `dist/protocol.schema.json`
- Modelli Swift generati: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline attuale

- `pnpm protocol:gen`
  - scrive JSON Schema (draft‑07) in `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - genera i modelli Swift del Gateway
- `pnpm protocol:check`
  - esegue entrambi i generatori e verifica che l'output sia nel commit

## Come vengono usati gli schemi a runtime

- **Lato server**: ogni frame in ingresso viene validato con AJV. L'handshake
  accetta solo una request `connect` i cui parametri corrispondono a `ConnectParams`.
- **Lato client**: il client JS valida i frame di evento e response prima di
  usarli.
- **Feature discovery**: il Gateway invia un elenco conservativo `features.methods`
  e `features.events` in `hello-ok` da `listGatewayMethods()` e
  `GATEWAY_EVENTS`.
- Questo elenco discovery non è un dump generato di ogni helper richiamabile in
  `coreGatewayHandlers`; alcuni helper RPC sono implementati in
  `src/gateway/server-methods/*.ts` senza essere enumerati nell'elenco delle feature
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

Response hello-ok:

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

Request + response:

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

## Esempio completo: aggiungere un metodo end-to-end

Esempio: aggiungi una nuova request `system.echo` che restituisce `{ ok: true, text }`.

1. **Schema (fonte di verità)**

Aggiungi in `src/gateway/protocol/schema.ts`:

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

Registralo in `src/gateway/server-methods.ts` (che già unisce `systemHandlers`),
poi aggiungi `"system.echo"` all'input di `listGatewayMethods` in
`src/gateway/server-methods-list.ts`.

Se il metodo è richiamabile da client operator o Node, classificalo anche in
`src/gateway/method-scopes.ts` così l'applicazione dell'ambito e la pubblicizzazione
delle feature `hello-ok` restano allineate.

4. **Rigenera**

```bash
pnpm protocol:check
```

5. **Test + documentazione**

Aggiungi un test del server in `src/gateway/server.*.test.ts` e annota il metodo nella documentazione.

## Comportamento della generazione di codice Swift

Il generatore Swift emette:

- enum `GatewayFrame` con i casi `req`, `res`, `event` e `unknown`
- struct/enum payload fortemente tipizzati
- valori `ErrorCode` e `GATEWAY_PROTOCOL_VERSION`

I tipi di frame sconosciuti vengono mantenuti come payload raw per la compatibilità futura.

## Versionamento + compatibilità

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le incompatibilità.
- I modelli Swift mantengono i tipi di frame sconosciuti per evitare di rompere i client più vecchi.

## Pattern e convenzioni degli schemi

- La maggior parte degli oggetti usa `additionalProperties: false` per payload rigorosi.
- `NonEmptyString` è il valore predefinito per ID e nomi di metodo/evento.
- Il `GatewayFrame` di primo livello usa un **discriminator** su `type`.
- I metodi con effetti collaterali di solito richiedono un `idempotencyKey` nei parametri
  (esempio: `send`, `poll`, `agent`, `chat.send`).
- `agent` accetta `internalEvents` facoltativi per il contesto di orchestrazione generato dal runtime
  (per esempio handoff di completamento di attività subagente/Cron); considera questa una superficie API interna.

## JSON Schema live

Il JSON Schema generato si trova nel repository in `dist/protocol.schema.json`. Il
file raw pubblicato è di solito disponibile a:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Quando modifichi gli schemi

1. Aggiorna gli schemi TypeBox.
2. Registra il metodo/evento in `src/gateway/server-methods-list.ts`.
3. Aggiorna `src/gateway/method-scopes.ts` quando il nuovo RPC richiede una classificazione
   di ambito operator o Node.
4. Esegui `pnpm protocol:check`.
5. Esegui il commit dello schema rigenerato + dei modelli Swift.

## Correlati

- [Protocollo di output avanzato](/it/reference/rich-output-protocol)
- [Adapter RPC](/it/reference/rpc)
