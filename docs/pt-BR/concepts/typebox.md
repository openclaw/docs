---
read_when:
    - Atualização de esquemas de protocolo ou geração de código
summary: Esquemas TypeBox como a única fonte de verdade para o protocolo do Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-11T23:54:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox é uma biblioteca de esquemas voltada prioritariamente para TypeScript. O OpenClaw a utiliza para definir o **protocolo WebSocket do Gateway** (handshake, solicitação/resposta, eventos do servidor). Esses esquemas orientam a **validação em tempo de execução** (AJV), a **exportação de JSON Schema** e a **geração de código Swift** para o aplicativo macOS. Uma única fonte de verdade; todo o restante é gerado.

Para obter o contexto de nível mais alto do protocolo, comece pela [arquitetura do Gateway](/pt-BR/concepts/architecture).

## Modelo mental (30 segundos)

Cada mensagem WS do Gateway é um destes três quadros:

- **Solicitação**: `{ type: "req", id, method, params }`
- **Resposta**: `{ type: "res", id, ok, payload | error }`
- **Evento**: `{ type: "event", event, payload, seq?, stateVersion? }`

O primeiro quadro **deve** ser uma solicitação `connect`. Depois disso, os clientes chamam métodos (por exemplo, `health`, `send`, `chat.send`) e assinam eventos (por exemplo, `presence`, `tick`, `agent`).

Fluxo de conexão (mínimo):

```text
Cliente                   Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Métodos e eventos comuns:

| Categoria  | Exemplos                                                   | Observações                                               |
| ---------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| Núcleo     | `connect`, `health`, `status`                              | `connect` deve ser o primeiro                             |
| Mensagens  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | métodos com efeitos colaterais precisam de `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | o WebChat usa estes                                      |
| Sessões    | `sessions.list`, `sessions.patch`, `sessions.delete`       | administração de sessões                                 |
| Automação  | `wake`, `cron.list`, `cron.run`, `cron.runs`               | controle de ativação e cron                              |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | WS do Gateway mais ações de Node                         |
| Eventos    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | envio iniciado pelo servidor                             |

O inventário oficial anunciado de **descoberta** fica em `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Onde ficam os esquemas

- Barrel de origem: `packages/gateway-protocol/src/schema.ts` reexporta módulos de domínio em `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` para os envelopes de nível superior e o handshake, `agent.ts`, `sessions.ts`, `cron.ts` etc., por área funcional). `protocol-schemas.ts` é o registro central `ProtocolSchemas` que mapeia nomes de esquemas para suas definições TypeBox.
- Validadores em tempo de execução (AJV): `packages/gateway-protocol/src/index.ts`
- Registro anunciado de recursos/descoberta: `src/gateway/server-methods-list.ts`
- Handshake do servidor e despacho de métodos: `src/gateway/server.impl.ts`
- Cliente Node: `src/gateway/client.ts`
- JSON Schema gerado: `dist/protocol.schema.json` (saída da compilação, não versionada)
- Modelos Swift gerados: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline atual

- `pnpm protocol:gen` grava o JSON Schema (draft-07) em `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` gera os modelos Swift do Gateway.
- `pnpm protocol:check` executa ambos os geradores e verifica se a saída Swift está versionada (a saída JSON Schema é um artefato de compilação ignorado pelo Git).

## Como os esquemas são usados em tempo de execução

- **No servidor**: cada quadro recebido é validado com AJV. O handshake aceita apenas uma solicitação `connect` cujos parâmetros correspondam a `ConnectParams`.
- **No cliente**: o cliente JS valida os quadros de evento e resposta antes de usá-los.
- **Descoberta de recursos**: o Gateway envia uma lista conservadora de `features.methods` e `features.events` em `hello-ok`, proveniente de `listGatewayMethods()` e `GATEWAY_EVENTS`.
- Essa lista de descoberta não é um despejo gerado de todos os auxiliares chamáveis em `coreGatewayHandlers`; alguns RPCs auxiliares são implementados em `src/gateway/server-methods/*.ts` sem serem enumerados na lista de recursos anunciados.

## Exemplos de quadros

Conexão (primeira mensagem):

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
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Solicitação e resposta:

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

Menor fluxo útil: conexão + verificação de integridade.

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

## Exemplo completo: adicionar um método de ponta a ponta

Exemplo: adicionar uma nova solicitação `system.echo` que retorna `{ ok: true, text }`.

1. **Esquema (fonte de verdade)**

Adicione a `packages/gateway-protocol/src/schema/system.ts` (ou ao módulo funcional correspondente mais próximo):

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

Importe ambos em `packages/gateway-protocol/src/schema/protocol-schemas.ts`, adicione-os ao registro `ProtocolSchemas` e exporte os tipos derivados:

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

Adicione um manipulador em `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Registre-o em `src/gateway/server-methods.ts` (que já combina `systemHandlers`) e, em seguida, adicione `"system.echo"` à entrada de `listGatewayMethods` em `src/gateway/server-methods-list.ts`.

Se o método puder ser chamado por clientes operadores ou Node, classifique-o também em `src/gateway/method-scopes.ts` para manter alinhadas a aplicação de escopos e a divulgação de recursos em `hello-ok`.

4. **Gerar novamente**

```bash
pnpm protocol:check
```

5. **Testes e documentação**

Adicione um teste de servidor em `src/gateway/server.*.test.ts` e mencione o método na documentação.

## Comportamento da geração de código Swift

O gerador Swift emite:

- um enum `GatewayFrame` com os casos `req`, `res`, `event` e `unknown`
- structs/enums de payload fortemente tipados
- valores de `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` e `GATEWAY_MIN_PROTOCOL_VERSION`

Tipos de quadro desconhecidos são preservados como payloads brutos para compatibilidade futura.

## Versionamento e compatibilidade

- `PROTOCOL_VERSION` fica em `packages/gateway-protocol/src/version.ts` (valor atual: `4`).
- Os clientes enviam `minProtocol` e `maxProtocol`; o servidor rejeita intervalos que não incluam seu protocolo atual.
- Os modelos Swift mantêm tipos de quadro desconhecidos para evitar incompatibilidade com clientes mais antigos.

## Padrões e convenções de esquema

- A maioria dos objetos usa `additionalProperties: false` para payloads estritos.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) é o padrão para IDs e nomes de métodos/eventos.
- O `GatewayFrame` de nível superior usa um **discriminador** em `type`.
- Métodos com efeitos colaterais geralmente exigem um `idempotencyKey` nos parâmetros (exemplo: `send`, `poll`, `agent`, `chat.send`).
- `agent` aceita `internalEvents` opcionais para contexto de orquestração gerado em tempo de execução (por exemplo, transferência da conclusão de uma tarefa de subagente/cron); trate isso como uma superfície de API interna.

## JSON do esquema publicado

O JSON Schema gerado é um artefato de compilação e não é versionado no repositório. O arquivo bruto publicado geralmente está disponível em:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Ao alterar esquemas

1. Atualize os esquemas TypeBox no módulo responsável em `packages/gateway-protocol/src/schema/*.ts` e registre-os em `protocol-schemas.ts`.
2. Registre o método/evento em `src/gateway/server-methods-list.ts`.
3. Atualize `src/gateway/method-scopes.ts` quando o novo RPC precisar de classificação de escopo de operador ou Node.
4. Execute `pnpm protocol:check`.
5. Faça commit dos modelos Swift gerados novamente.

## Relacionado

- [Protocolo de saída avançada](/pt-BR/reference/rich-output-protocol)
- [Adaptadores RPC](/pt-BR/reference/rpc)
