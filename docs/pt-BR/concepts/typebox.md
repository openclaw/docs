---
read_when:
    - Atualizando schemas de protocolo ou geração de código
summary: Schemas TypeBox como fonte única da verdade para o protocolo do gateway
title: TypeBox
x-i18n:
    generated_at: "2026-04-24T05:49:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox como fonte única da verdade do protocolo

Última atualização: 2026-01-10

TypeBox é uma biblioteca de schema voltada para TypeScript. Nós a usamos para definir o **protocolo WebSocket do Gateway** (handshake, request/response, eventos do servidor). Esses schemas orientam a **validação em runtime**, a **exportação de JSON Schema** e a **geração de código Swift** para o app macOS. Uma única fonte da verdade; todo o resto é gerado.

Se você quiser o contexto de mais alto nível do protocolo, comece por
[Gateway architecture](/pt-BR/concepts/architecture).

## Modelo mental (30 segundos)

Toda mensagem WS do Gateway é um de três frames:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

O primeiro frame **deve** ser um request `connect`. Depois disso, clientes podem chamar
métodos (por exemplo `health`, `send`, `chat.send`) e assinar eventos (por exemplo
`presence`, `tick`, `agent`).

Fluxo de conexão (mínimo):

```
Cliente                   Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Métodos + eventos comuns:

| Categoria   | Exemplos                                                   | Observações                        |
| ----------- | ---------------------------------------------------------- | ---------------------------------- |
| Core        | `connect`, `health`, `status`                              | `connect` deve vir primeiro        |
| Mensagens   | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | efeitos colaterais precisam de `idempotencyKey` |
| Chat        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat usa estes                  |
| Sessões     | `sessions.list`, `sessions.patch`, `sessions.delete`       | administração de sessão            |
| Automação   | `wake`, `cron.list`, `cron.run`, `cron.runs`               | controle de wake + Cron            |
| Nodes       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + ações de node         |
| Eventos     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | envio do servidor                  |

O inventário autoritativo anunciado para **descoberta** fica em
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Onde os schemas ficam

- Fonte: `src/gateway/protocol/schema.ts`
- Validadores em runtime (AJV): `src/gateway/protocol/index.ts`
- Registro anunciado de recursos/descoberta: `src/gateway/server-methods-list.ts`
- Handshake do servidor + despacho de método: `src/gateway/server.impl.ts`
- Cliente de Node: `src/gateway/client.ts`
- JSON Schema gerado: `dist/protocol.schema.json`
- Modelos Swift gerados: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline atual

- `pnpm protocol:gen`
  - grava JSON Schema (draft‑07) em `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - gera modelos Swift do gateway
- `pnpm protocol:check`
  - executa ambos os geradores e verifica se a saída foi commitada

## Como os schemas são usados em runtime

- **Lado do servidor**: todo frame de entrada é validado com AJV. O handshake só
  aceita um request `connect` cujos params correspondam a `ConnectParams`.
- **Lado do cliente**: o cliente JS valida frames de evento e de resposta antes
  de usá-los.
- **Descoberta de recursos**: o Gateway envia uma lista conservadora `features.methods`
  e `features.events` em `hello-ok` a partir de `listGatewayMethods()` e
  `GATEWAY_EVENTS`.
- Essa lista de descoberta não é um dump gerado de todo helper chamável em
  `coreGatewayHandlers`; alguns helper RPCs são implementados em
  `src/gateway/server-methods/*.ts` sem serem enumerados na lista anunciada
  de recursos.

## Exemplos de frame

Connect (primeira mensagem):

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

Resposta hello-ok:

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

## Cliente mínimo (Node.js)

Menor fluxo útil: connect + health.

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

## Exemplo completo: adicionar um método ponta a ponta

Exemplo: adicionar um novo request `system.echo` que retorna `{ ok: true, text }`.

1. **Schema (fonte da verdade)**

Adicione em `src/gateway/protocol/schema.ts`:

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

Adicione ambos em `ProtocolSchemas` e exporte os tipos:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validação**

Em `src/gateway/protocol/index.ts`, exporte um validador AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Comportamento do servidor**

Adicione um manipulador em `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Registre-o em `src/gateway/server-methods.ts` (que já mescla `systemHandlers`),
depois adicione `"system.echo"` à entrada de `listGatewayMethods` em
`src/gateway/server-methods-list.ts`.

Se o método puder ser chamado por clientes operador ou node, classifique-o também em
`src/gateway/method-scopes.ts` para que a aplicação de escopo e a
anunciação de recursos em `hello-ok` permaneçam alinhadas.

4. **Regenerar**

```bash
pnpm protocol:check
```

5. **Testes + documentação**

Adicione um teste de servidor em `src/gateway/server.*.test.ts` e registre o método na documentação.

## Comportamento da geração de código Swift

O gerador Swift emite:

- enum `GatewayFrame` com casos `req`, `res`, `event` e `unknown`
- structs/enums de payload fortemente tipados
- valores `ErrorCode` e `GATEWAY_PROTOCOL_VERSION`

Tipos de frame desconhecidos são preservados como payloads brutos para compatibilidade futura.

## Versionamento + compatibilidade

- `PROTOCOL_VERSION` fica em `src/gateway/protocol/schema.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita incompatibilidades.
- Os modelos Swift mantêm tipos de frame desconhecidos para evitar quebrar clientes antigos.

## Padrões e convenções de schema

- A maioria dos objetos usa `additionalProperties: false` para payloads estritos.
- `NonEmptyString` é o padrão para IDs e nomes de método/evento.
- O `GatewayFrame` de nível superior usa um **discriminator** em `type`.
- Métodos com efeitos colaterais normalmente exigem um `idempotencyKey` em params
  (exemplo: `send`, `poll`, `agent`, `chat.send`).
- `agent` aceita `internalEvents` opcionais para contexto de orquestração gerado em runtime
  (por exemplo handoff de conclusão de tarefa de subagente/Cron); trate isso como superfície interna de API.

## JSON Schema ativo

O JSON Schema gerado está no repositório em `dist/protocol.schema.json`. O
arquivo bruto publicado normalmente está disponível em:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Quando você altera schemas

1. Atualize os schemas TypeBox.
2. Registre o método/evento em `src/gateway/server-methods-list.ts`.
3. Atualize `src/gateway/method-scopes.ts` quando o novo RPC precisar de classificação de escopo de operador ou
   node.
4. Execute `pnpm protocol:check`.
5. Faça commit do schema regenerado + modelos Swift.

## Relacionados

- [Rich output protocol](/pt-BR/reference/rich-output-protocol)
- [RPC adapters](/pt-BR/reference/rpc)
