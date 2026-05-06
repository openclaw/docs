---
read_when:
    - Aggiornamento degli schemi di protocollo o della generazione di codice
summary: Schemi TypeBox come unica fonte di verità per il protocollo Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T08:48:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox è una libreria di schemi TypeScript-first. La usiamo per definire il **protocollo WebSocket del Gateway** (handshake, richiesta/risposta, eventi del server). Questi schemi gestiscono **validazione a runtime**, **esportazione JSON Schema** e **codegen Swift** per l'app macOS. Un'unica fonte di verità; tutto il resto viene generato.

Se vuoi il contesto di protocollo di livello più alto, inizia da
[Architettura del Gateway](/it/concepts/architecture).

## Modello mentale (30 secondi)

Ogni messaggio WS del Gateway è uno di tre frame:

- **Richiesta**: `{ type: "req", id, method, params }`
- **Risposta**: `{ type: "res", id, ok, payload | error }`
- **Evento**: `{ type: "event", event, payload, seq?, stateVersion? }`

Il primo frame **deve** essere una richiesta `connect`. Dopo, i client possono chiamare
metodi (ad es. `health`, `send`, `chat.send`) e sottoscrivere eventi (ad es.
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

| Categoria  | Esempi                                                    | Note                               |
| ---------- | --------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                             | `connect` deve essere il primo     |
| Messaggi   | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | gli effetti collaterali richiedono `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                 | WebChat usa questi                 |
| Sessioni   | `sessions.list`, `sessions.patch`, `sessions.delete`      | amministrazione delle sessioni     |
| Automazione | `wake`, `cron.list`, `cron.run`, `cron.runs`             | controllo wake + Cron              |
| Node       | `node.list`, `node.invoke`, `node.pair.*`                 | WS del Gateway + azioni del Node   |
| Eventi     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | push del server                    |

L'inventario autorevole di **discovery** pubblicizzato si trova in
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Dove si trovano gli schemi

- Sorgente: `src/gateway/protocol/schema.ts`
- Validatori runtime (AJV): `src/gateway/protocol/index.ts`
- Registro feature/discovery pubblicizzato: `src/gateway/server-methods-list.ts`
- Handshake del server + dispatch dei metodi: `src/gateway/server.impl.ts`
- Client Node: `src/gateway/client.ts`
- JSON Schema generato: `dist/protocol.schema.json`
- Modelli Swift generati: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline attuale

- `pnpm protocol:gen`
  - scrive JSON Schema (draft-07) in `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - genera i modelli Swift del Gateway
- `pnpm protocol:check`
  - esegue entrambi i generatori e verifica che l'output sia stato committato

## Come gli schemi vengono usati a runtime

- **Lato server**: ogni frame in ingresso viene validato con AJV. L'handshake accetta solo
  una richiesta `connect` i cui parametri corrispondono a `ConnectParams`.
- **Lato client**: il client JS valida i frame di evento e risposta prima di
  usarli.
- **Discovery delle feature**: il Gateway invia un elenco conservativo `features.methods`
  e `features.events` in `hello-ok` da `listGatewayMethods()` e
  `GATEWAY_EVENTS`.
- Quell'elenco di discovery non è un dump generato di ogni helper chiamabile in
  `coreGatewayHandlers`; alcuni RPC helper sono implementati in
  `src/gateway/server-methods/*.ts` senza essere enumerati nell'elenco delle
  feature pubblicizzato.

## Frame di esempio

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

## Esempio guidato: aggiungere un metodo end-to-end

Esempio: aggiungi una nuova richiesta `system.echo` che restituisce `{ ok: true, text }`.

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

In `src/gateway/protocol/index.ts`, esporta un validatore AJV:

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
poi aggiungi `"system.echo"` all'input di `listGatewayMethods` in
`src/gateway/server-methods-list.ts`.

Se il metodo è chiamabile da client operatore o Node, classificalo anche in
`src/gateway/method-scopes.ts` così l'applicazione degli scope e la pubblicizzazione
delle feature in `hello-ok` restano allineate.

4. **Rigenerare**

```bash
pnpm protocol:check
```

5. **Test + documentazione**

Aggiungi un test del server in `src/gateway/server.*.test.ts` e annota il metodo nella documentazione.

## Comportamento del codegen Swift

Il generatore Swift emette:

- enum `GatewayFrame` con casi `req`, `res`, `event` e `unknown`
- struct/enum del payload fortemente tipizzati
- valori `ErrorCode` e `GATEWAY_PROTOCOL_VERSION`

I tipi di frame sconosciuti vengono preservati come payload grezzi per la compatibilità futura.

## Versioning + compatibilità

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le mancate corrispondenze.
- I modelli Swift mantengono i tipi di frame sconosciuti per evitare di interrompere i client più vecchi.

## Pattern e convenzioni degli schemi

- La maggior parte degli oggetti usa `additionalProperties: false` per payload rigorosi.
- `NonEmptyString` è il valore predefinito per ID e nomi di metodi/eventi.
- Il `GatewayFrame` di primo livello usa un **discriminator** su `type`.
- I metodi con effetti collaterali di solito richiedono un `idempotencyKey` nei parametri
  (esempio: `send`, `poll`, `agent`, `chat.send`).
- `agent` accetta `internalEvents` opzionali per il contesto di orchestrazione generato a runtime
  (ad esempio handoff di completamento di attività subagent/Cron); considera questo come superficie API interna.

## JSON dello schema live

Il JSON Schema generato si trova nel repo in `dist/protocol.schema.json`. Il
file raw pubblicato è in genere disponibile a:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Quando modifichi gli schemi

1. Aggiorna gli schemi TypeBox.
2. Registra il metodo/evento in `src/gateway/server-methods-list.ts`.
3. Aggiorna `src/gateway/method-scopes.ts` quando il nuovo RPC necessita di classificazione
   dello scope operatore o Node.
4. Esegui `pnpm protocol:check`.
5. Committa lo schema rigenerato + i modelli Swift.

## Correlati

- [Protocollo rich output](/it/reference/rich-output-protocol)
- [Adattatori RPC](/it/reference/rpc)
