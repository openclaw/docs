---
read_when:
    - protocol スキーマまたはコード生成を更新する შემთხვევაში
summary: Gateway protocol の単一の正本としての TypeBox スキーマ
title: TypeBox
x-i18n:
    generated_at: "2026-04-24T04:55:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 15
---

# Gateway protocol の正本としての TypeBox

最終更新: 2026-01-10

TypeBox は TypeScript ファーストのスキーマライブラリです。OpenClaw ではこれを使って **Gateway WebSocket protocol**（handshake、request/response、server event）を定義しています。これらのスキーマは **ランタイム検証**、**JSON Schema エクスポート**、**macOS アプリ向け Swift コード生成**を駆動します。正本は 1 つだけで、それ以外はすべて生成物です。

より高レベルな protocol の文脈を知りたい場合は、[Gateway architecture](/ja-JP/concepts/architecture) から始めてください。

## メンタルモデル（30 秒）

各 Gateway WS メッセージは次の 3 種類の frame のいずれかです。

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

最初の frame は**必ず** `connect` request でなければなりません。その後、クライアントはメソッド（例: `health`, `send`, `chat.send`）を呼び出し、event（例: `presence`, `tick`, `agent`）を購読できます。

接続フロー（最小）:

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

よく使うメソッド + event:

| Category   | 例 | 注記 |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                              | `connect` が最初でなければならない |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | 副作用を持つものには `idempotencyKey` が必要 |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat はこれらを使う |
| Sessions   | `sessions.list`, `sessions.patch`, `sessions.delete`       | セッション管理 |
| Automation | `wake`, `cron.list`, `cron.run`, `cron.runs`               | wake と Cron 制御 |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + Node action |
| Events     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | server push |

権威ある公開 **discovery** インベントリは
`src/gateway/server-methods-list.ts`（`listGatewayMethods`, `GATEWAY_EVENTS`）にあります。

## スキーマの場所

- ソース: `src/gateway/protocol/schema.ts`
- ランタイムバリデーター（AJV）: `src/gateway/protocol/index.ts`
- 公開される機能/discovery レジストリ: `src/gateway/server-methods-list.ts`
- server handshake + メソッドディスパッチ: `src/gateway/server.impl.ts`
- Node クライアント: `src/gateway/client.ts`
- 生成される JSON Schema: `dist/protocol.schema.json`
- 生成される Swift モデル: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 現在のパイプライン

- `pnpm protocol:gen`
  - JSON Schema（draft‑07）を `dist/protocol.schema.json` に書き出す
- `pnpm protocol:gen:swift`
  - Swift の Gateway モデルを生成する
- `pnpm protocol:check`
  - 両方のジェネレーターを実行し、生成物がコミット済みか検証する

## ランタイムでのスキーマの使われ方

- **サーバー側**: すべての受信 frame は AJV で検証されます。handshake は、params が `ConnectParams` に一致する `connect` request のみ受け付けます。
- **クライアント側**: JS クライアントは、使用前に event frame と response frame を検証します。
- **機能 discovery**: Gateway は、`listGatewayMethods()` と `GATEWAY_EVENTS` から、保守的な `features.methods` と `features.events` の一覧を `hello-ok` で送ります。
- この discovery 一覧は、`coreGatewayHandlers` にあるすべての呼び出し可能 helper の生成ダンプではありません。一部の helper RPC は
  `src/gateway/server-methods/*.ts` で実装されていても、公開される機能一覧には列挙されていません。

## frame の例

Connect（最初のメッセージ）:

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

Hello-ok response:

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

Event:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## 最小クライアント（Node.js）

最小限で有用なフロー: connect + health。

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

## 実例: メソッドを end-to-end で追加する

例: `{ ok: true, text }` を返す新しい `system.echo` request を追加する。

1. **スキーマ（正本）**

`src/gateway/protocol/schema.ts` に追加します。

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

両方を `ProtocolSchemas` に追加し、型をエクスポートします。

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **検証**

`src/gateway/protocol/index.ts` で AJV バリデーターをエクスポートします。

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **サーバー動作**

`src/gateway/server-methods/system.ts` に handler を追加します。

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

これを `src/gateway/server-methods.ts` に登録し（ここではすでに `systemHandlers` をマージしています）、
さらに `src/gateway/server-methods-list.ts` の `listGatewayMethods` 入力へ `"system.echo"` を追加します。

そのメソッドが operator または Node クライアントから呼び出し可能なら、
`src/gateway/method-scopes.ts` にも分類を追加し、スコープ強制と `hello-ok` の機能公開が整合するようにしてください。

4. **再生成**

```bash
pnpm protocol:check
```

5. **テスト + ドキュメント**

`src/gateway/server.*.test.ts` にサーバーテストを追加し、そのメソッドを docs に記載します。

## Swift コード生成の動作

Swift ジェネレーターは次を出力します。

- `req`, `res`, `event`, `unknown` ケースを持つ `GatewayFrame` enum
- 強い型付けの payload struct/enum
- `ErrorCode` 値と `GATEWAY_PROTOCOL_VERSION`

未知の frame 型は forward compatibility のため raw payload として保持されます。

## バージョニング + 互換性

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、サーバーは不一致を拒否します。
- Swift モデルは、古いクライアントが壊れないよう未知の frame 型を保持します。

## スキーマパターンと慣例

- 多くのオブジェクトは厳密な payload のために `additionalProperties: false` を使います。
- `NonEmptyString` は ID や method/event 名のデフォルトです。
- トップレベルの `GatewayFrame` は `type` の**discriminator**を使います。
- 副作用を持つメソッドでは、通常 params に `idempotencyKey` が必要です
  （例: `send`, `poll`, `agent`, `chat.send`）。
- `agent` はランタイム生成のオーケストレーションコンテキスト向けに任意の `internalEvents` を受け付けます
  （たとえば subagent/Cron タスク完了の引き継ぎ）。これは内部 API サーフェスとして扱ってください。

## ライブスキーマ JSON

生成される JSON Schema は `dist/protocol.schema.json` にあります。
公開 raw ファイルは通常次の場所で利用できます。

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## スキーマを変更するとき

1. TypeBox スキーマを更新する。
2. `src/gateway/server-methods-list.ts` に method/event を登録する。
3. 新しい RPC に operator または Node スコープ分類が必要なら `src/gateway/method-scopes.ts` を更新する。
4. `pnpm protocol:check` を実行する。
5. 再生成された schema + Swift モデルをコミットする。

## 関連

- [Rich output protocol](/ja-JP/reference/rich-output-protocol)
- [RPC adapters](/ja-JP/reference/rpc)
