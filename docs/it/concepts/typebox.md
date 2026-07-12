---
read_when:
    - Aggiornamento degli schemi di protocollo o della generazione del codice
summary: Schemi TypeBox come unica fonte attendibile per il protocollo del Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T06:59:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox è una libreria di schemi orientata a TypeScript. OpenClaw la utilizza per definire il **protocollo WebSocket del Gateway** (handshake, richiesta/risposta, eventi del server). Questi schemi determinano la **validazione in fase di esecuzione** (AJV), l'**esportazione in JSON Schema** e la **generazione di codice Swift** per l'app macOS. Un'unica fonte di verità; tutto il resto viene generato.

Per il contesto generale del protocollo, inizia da [Architettura del Gateway](/it/concepts/architecture).

## Modello mentale (30 secondi)

Ogni messaggio WS del Gateway è uno dei tre tipi di frame:

- **Richiesta**: `{ type: "req", id, method, params }`
- **Risposta**: `{ type: "res", id, ok, payload | error }`
- **Evento**: `{ type: "event", event, payload, seq?, stateVersion? }`

Il primo frame **deve** essere una richiesta `connect`. Successivamente, i client chiamano metodi (ad esempio `health`, `send`, `chat.send`) e sottoscrivono eventi (ad esempio `presence`, `tick`, `agent`).

Flusso di connessione (minimo):

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Metodi ed eventi comuni:

| Categoria   | Esempi                                                     | Note                                                   |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Base        | `connect`, `health`, `status`                              | `connect` deve essere il primo                         |
| Messaggistica | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | i metodi con effetti collaterali richiedono `idempotencyKey` |
| Chat        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat utilizza questi                                |
| Sessioni    | `sessions.list`, `sessions.patch`, `sessions.delete`       | amministrazione delle sessioni                        |
| Automazione | `wake`, `cron.list`, `cron.run`, `cron.runs`               | controllo di riattivazione e cron                     |
| Node        | `node.list`, `node.invoke`, `node.pair.*`                  | WS del Gateway più azioni del Node                    |
| Eventi      | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | invio push dal server                                  |

L'inventario autorevole di **individuazione** pubblicizzato si trova in `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Dove si trovano gli schemi

- Barrel sorgente: `packages/gateway-protocol/src/schema.ts` riesporta i moduli di dominio in `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` per gli involucri di primo livello e l'handshake, `agent.ts`, `sessions.ts`, `cron.ts` e così via per ciascuna area funzionale). `protocol-schemas.ts` è il registro centrale `ProtocolSchemas` che associa i nomi degli schemi alle relative definizioni TypeBox.
- Validatori in fase di esecuzione (AJV): `packages/gateway-protocol/src/index.ts`
- Registro pubblicizzato delle funzionalità e dell'individuazione: `src/gateway/server-methods-list.ts`
- Handshake del server e distribuzione dei metodi: `src/gateway/server.impl.ts`
- Client Node: `src/gateway/client.ts`
- JSON Schema generato: `dist/protocol.schema.json` (output di compilazione, non incluso nel repository)
- Modelli Swift generati: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline attuale

- `pnpm protocol:gen` scrive il JSON Schema (draft-07) in `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` genera i modelli Swift del Gateway.
- `pnpm protocol:check` esegue entrambi i generatori e verifica che l'output Swift sia incluso nel repository (l'output JSON Schema è un artefatto di compilazione ignorato da Git).

## Come vengono utilizzati gli schemi in fase di esecuzione

- **Lato server**: ogni frame in entrata viene validato con AJV. L'handshake accetta soltanto una richiesta `connect` i cui parametri corrispondano a `ConnectParams`.
- **Lato client**: il client JS valida i frame di evento e risposta prima di utilizzarli.
- **Individuazione delle funzionalità**: il Gateway invia in `hello-ok` un elenco conservativo `features.methods` e `features.events`, ottenuto da `listGatewayMethods()` e `GATEWAY_EVENTS`.
- Tale elenco di individuazione non è un dump generato di ogni funzione di supporto richiamabile in `coreGatewayHandlers`; alcune RPC di supporto sono implementate in `src/gateway/server-methods/*.ts` senza essere enumerate nell'elenco delle funzionalità pubblicizzato.

## Frame di esempio

Connessione (primo messaggio):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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
    "protocol": 4,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Richiesta e risposta:

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

Flusso utile più semplice: connessione + controllo dello stato.

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
        minProtocol: 4,
        maxProtocol: 4,
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

Esempio: aggiungere una nuova richiesta `system.echo` che restituisce `{ ok: true, text }`.

1. **Schema (fonte di verità)**

Aggiungi quanto segue a `packages/gateway-protocol/src/schema/system.ts` (o al modulo funzionale più pertinente):

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

Importa entrambi in `packages/gateway-protocol/src/schema/protocol-schemas.ts`, aggiungili al registro `ProtocolSchemas` ed esporta i tipi derivati:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validazione**

In `packages/gateway-protocol/src/index.ts`, esporta un validatore AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Comportamento del server**

Aggiungi un gestore in `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Registralo in `src/gateway/server-methods.ts` (che già unisce `systemHandlers`), quindi aggiungi `"system.echo"` all'input di `listGatewayMethods` in `src/gateway/server-methods-list.ts`.

Se il metodo può essere chiamato da client operatore o Node, classificalo anche in `src/gateway/method-scopes.ts`, affinché l'applicazione degli ambiti e la pubblicizzazione delle funzionalità in `hello-ok` rimangano allineate.

4. **Rigenerazione**

```bash
pnpm protocol:check
```

5. **Test e documentazione**

Aggiungi un test del server in `src/gateway/server.*.test.ts` e documenta il metodo.

## Comportamento della generazione di codice Swift

Il generatore Swift produce:

- un'enumerazione `GatewayFrame` con i casi `req`, `res`, `event` e `unknown`
- strutture ed enumerazioni del payload fortemente tipizzate
- valori `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` e `GATEWAY_MIN_PROTOCOL_VERSION`

I tipi di frame sconosciuti vengono conservati come payload grezzi per garantire la compatibilità futura.

## Controllo delle versioni e compatibilità

- `PROTOCOL_VERSION` si trova in `packages/gateway-protocol/src/version.ts` (valore attuale: `4`).
- I client inviano `minProtocol` e `maxProtocol`; il server rifiuta gli intervalli che non includono il protocollo attuale.
- I modelli Swift conservano i tipi di frame sconosciuti per evitare di compromettere i client meno recenti.

## Modelli e convenzioni degli schemi

- La maggior parte degli oggetti utilizza `additionalProperties: false` per payload rigorosi.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) è l'impostazione predefinita per ID e nomi di metodi/eventi.
- Il `GatewayFrame` di primo livello utilizza un **discriminatore** su `type`.
- I metodi con effetti collaterali richiedono solitamente un `idempotencyKey` nei parametri (esempio: `send`, `poll`, `agent`, `chat.send`).
- `agent` accetta il parametro facoltativo `internalEvents` per il contesto di orchestrazione generato in fase di esecuzione (ad esempio il passaggio di consegne al completamento di attività di subagenti/cron); consideralo parte della superficie API interna.

## JSON dello schema pubblicato

Il JSON Schema generato è un artefatto di compilazione e non è incluso nel repository. Il file grezzo pubblicato è generalmente disponibile all'indirizzo:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Quando modifichi gli schemi

1. Aggiorna gli schemi TypeBox nel modulo proprietario `packages/gateway-protocol/src/schema/*.ts` e registrali in `protocol-schemas.ts`.
2. Registra il metodo/evento in `src/gateway/server-methods-list.ts`.
3. Aggiorna `src/gateway/method-scopes.ts` quando la nuova RPC richiede la classificazione dell'ambito operatore o Node.
4. Esegui `pnpm protocol:check`.
5. Includi nel commit i modelli Swift rigenerati.

## Contenuti correlati

- [Protocollo di output avanzato](/it/reference/rich-output-protocol)
- [Adattatori RPC](/it/reference/rpc)
