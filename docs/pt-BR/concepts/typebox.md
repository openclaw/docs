---
read_when:
    - Atualizando esquemas de protocolo ou codegen
summary: Esquemas TypeBox como a fonte única da verdade para o protocolo do Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-06-27T17:27:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2f3da11e9dcf3250fd77e0c43f4ed918551a536d93fa71bce95eaf3d7539f6d
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox é uma biblioteca de esquemas com TypeScript em primeiro lugar. Nós a usamos para definir o **protocolo WebSocket do Gateway** (handshake, solicitação/resposta, eventos do servidor). Esses esquemas orientam a **validação em runtime**, a **exportação de JSON Schema** e a **geração de código Swift** para o app macOS. Uma única fonte da verdade; todo o restante é gerado.

Se você quiser o contexto de protocolo de nível mais alto, comece com
[Arquitetura do Gateway](/pt-BR/concepts/architecture).

## Modelo mental (30 segundos)

Toda mensagem WS do Gateway é um de três quadros:

- **Solicitação**: `{ type: "req", id, method, params }`
- **Resposta**: `{ type: "res", id, ok, payload | error }`
- **Evento**: `{ type: "event", event, payload, seq?, stateVersion? }`

O primeiro quadro **deve** ser uma solicitação `connect`. Depois disso, os clientes podem chamar
métodos (por exemplo, `health`, `send`, `chat.send`) e assinar eventos (por exemplo,
`presence`, `tick`, `agent`).

Fluxo de conexão (mínimo):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Métodos + eventos comuns:

| Categoria  | Exemplos                                                   | Observações                        |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Núcleo     | `connect`, `health`, `status`                              | `connect` deve ser o primeiro      |
| Mensagens  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | efeitos colaterais precisam de `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat usa estes                  |
| Sessões    | `sessions.list`, `sessions.patch`, `sessions.delete`       | administração de sessão            |
| Automação  | `wake`, `cron.list`, `cron.run`, `cron.runs`               | controle de wake + cron            |
| Nós        | `node.list`, `node.invoke`, `node.pair.*`                  | WS do Gateway + ações de nó        |
| Eventos    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push do servidor                   |

O inventário autoritativo de **descoberta** anunciado vive em
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Onde ficam os esquemas

- Fonte: `packages/gateway-protocol/src/schema.ts`
- Validadores de runtime (AJV): `packages/gateway-protocol/src/index.ts`
- Registro anunciado de recursos/descoberta: `src/gateway/server-methods-list.ts`
- Handshake do servidor + despacho de métodos: `src/gateway/server.impl.ts`
- Cliente Node: `src/gateway/client.ts`
- JSON Schema gerado: `dist/protocol.schema.json`
- Modelos Swift gerados: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline atual

- `pnpm protocol:gen`
  - grava JSON Schema (draft-07) em `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - gera modelos Swift do gateway
- `pnpm protocol:check`
  - executa ambos os geradores e verifica se a saída foi commitada

## Como os esquemas são usados em runtime

- **Lado do servidor**: todo quadro recebido é validado com AJV. O handshake só
  aceita uma solicitação `connect` cujos parâmetros correspondam a `ConnectParams`.
- **Lado do cliente**: o cliente JS valida quadros de evento e resposta antes de
  usá-los.
- **Descoberta de recursos**: o Gateway envia uma lista conservadora de `features.methods`
  e `features.events` em `hello-ok` a partir de `listGatewayMethods()` e
  `GATEWAY_EVENTS`.
- Essa lista de descoberta não é um despejo gerado de todo helper chamável em
  `coreGatewayHandlers`; alguns RPCs auxiliares são implementados em
  `src/gateway/server-methods/*.ts` sem serem enumerados na lista de recursos
  anunciada.

## Quadros de exemplo

Connect (primeira mensagem):

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

Resposta hello-ok:

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
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Solicitação + resposta:

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

## Exemplo trabalhado: adicionar um método de ponta a ponta

Exemplo: adicione uma nova solicitação `system.echo` que retorna `{ ok: true, text }`.

1. **Esquema (fonte da verdade)**

Adicione a `packages/gateway-protocol/src/schema.ts`:

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

Adicione ambos a `ProtocolSchemas` e exporte os tipos:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validação**

Em `packages/gateway-protocol/src/index.ts`, exporte um validador AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Comportamento do servidor**

Adicione um handler em `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Registre-o em `src/gateway/server-methods.ts` (já mescla `systemHandlers`),
depois adicione `"system.echo"` à entrada de `listGatewayMethods` em
`src/gateway/server-methods-list.ts`.

Se o método puder ser chamado por clientes operadores ou nós, classifique-o também em
`src/gateway/method-scopes.ts` para que a imposição de escopo e o anúncio de recursos
em `hello-ok` permaneçam alinhados.

4. **Regenerar**

```bash
pnpm protocol:check
```

5. **Testes + docs**

Adicione um teste de servidor em `src/gateway/server.*.test.ts` e mencione o método na documentação.

## Comportamento da geração de código Swift

O gerador Swift emite:

- enum `GatewayFrame` com casos `req`, `res`, `event` e `unknown`
- structs/enums de payload fortemente tipados
- valores `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` e `GATEWAY_MIN_PROTOCOL_VERSION`

Tipos de quadro desconhecidos são preservados como payloads brutos para compatibilidade futura.

## Versionamento + compatibilidade

- `PROTOCOL_VERSION` vive em `packages/gateway-protocol/src/version.ts`.
- Clientes enviam `minProtocol` + `maxProtocol`; o servidor rejeita intervalos que
  não incluem seu protocolo atual.
- Os modelos Swift mantêm tipos de quadro desconhecidos para evitar quebrar clientes mais antigos.

## Padrões e convenções de esquema

- A maioria dos objetos usa `additionalProperties: false` para payloads estritos.
- `NonEmptyString` é o padrão para IDs e nomes de métodos/eventos.
- O `GatewayFrame` de nível superior usa um **discriminador** em `type`.
- Métodos com efeitos colaterais geralmente exigem um `idempotencyKey` nos parâmetros
  (exemplo: `send`, `poll`, `agent`, `chat.send`).
- `agent` aceita `internalEvents` opcionais para contexto de orquestração gerado pelo runtime
  (por exemplo, handoff de conclusão de tarefa de subagente/cron); trate isso como superfície de API interna.

## JSON de esquema ao vivo

O JSON Schema gerado está no repositório em `dist/protocol.schema.json`. O
arquivo bruto publicado normalmente está disponível em:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Quando você altera esquemas

1. Atualize os esquemas TypeBox.
2. Registre o método/evento em `src/gateway/server-methods-list.ts`.
3. Atualize `src/gateway/method-scopes.ts` quando o novo RPC precisar de classificação
   de escopo de operador ou nó.
4. Execute `pnpm protocol:check`.
5. Commite o esquema regenerado + modelos Swift.

## Relacionados

- [Protocolo de saída rica](/pt-BR/reference/rich-output-protocol)
- [Adaptadores RPC](/pt-BR/reference/rpc)
