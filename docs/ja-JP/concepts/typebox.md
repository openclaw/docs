---
read_when:
    - プロトコルスキーマまたはコード生成の更新
summary: Gateway プロトコルの信頼できる唯一の情報源としての TypeBox スキーマ
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T05:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d96322ee66bbca2405f1cd3f9027be2bdddc40075d663c24714b0d3149744253
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox は TypeScript を第一に考えたスキーマライブラリです。これを使って **Gateway
WebSocket プロトコル**（ハンドシェイク、リクエスト/レスポンス、サーバーイベント）を定義しています。これらのスキーマは、macOS アプリ向けの **実行時検証**、**JSON Schema エクスポート**、**Swift コード生成**を駆動します。信頼できる唯一の情報源があり、それ以外はすべて生成されます。

より上位のプロトコルコンテキストを知りたい場合は、
[Gateway アーキテクチャ](/ja-JP/concepts/architecture)から始めてください。

## メンタルモデル（30 秒）

すべての Gateway WS メッセージは、次の 3 種類のフレームのいずれかです。

- **リクエスト**: `{ type: "req", id, method, params }`
- **レスポンス**: `{ type: "res", id, ok, payload | error }`
- **イベント**: `{ type: "event", event, payload, seq?, stateVersion? }`

最初のフレームは **必ず** `connect` リクエストである必要があります。その後、クライアントは
メソッド（例: `health`, `send`, `chat.send`）を呼び出し、イベント（例:
`presence`, `tick`, `agent`）を購読できます。

接続フロー（最小構成）:

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

一般的なメソッド + イベント:

| カテゴリ   | 例                                                         | メモ                               |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| コア       | `connect`, `health`, `status`                              | `connect` は最初である必要があります |
| メッセージング | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | 副作用には `idempotencyKey` が必要です |
| チャット   | `chat.history`, `chat.send`, `chat.abort`                  | WebChat がこれらを使用します        |
| セッション | `sessions.list`, `sessions.patch`, `sessions.delete`       | セッション管理                     |
| 自動化     | `wake`, `cron.list`, `cron.run`, `cron.runs`               | wake + cron 制御                   |
| ノード     | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + ノードアクション      |
| イベント   | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | サーバープッシュ                   |

権威ある公開 **discovery** インベントリは
`src/gateway/server-methods-list.ts`（`listGatewayMethods`, `GATEWAY_EVENTS`）にあります。

## スキーマの場所

- ソース: `src/gateway/protocol/schema.ts`
- 実行時バリデーター（AJV）: `src/gateway/protocol/index.ts`
- 公開される機能/discovery レジストリ: `src/gateway/server-methods-list.ts`
- サーバーハンドシェイク + メソッドディスパッチ: `src/gateway/server.impl.ts`
- Node クライアント: `src/gateway/client.ts`
- 生成された JSON Schema: `dist/protocol.schema.json`
- 生成された Swift モデル: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 現在のパイプライン

- `pnpm protocol:gen`
  - JSON Schema（draft‑07）を `dist/protocol.schema.json` に書き込みます
- `pnpm protocol:gen:swift`
  - Swift Gateway モデルを生成します
- `pnpm protocol:check`
  - 両方のジェネレーターを実行し、出力がコミットされていることを検証します

## 実行時にスキーマがどう使われるか

- **サーバー側**: すべての受信フレームが AJV で検証されます。ハンドシェイクは、
  params が `ConnectParams` に一致する `connect` リクエストだけを受け付けます。
- **クライアント側**: JS クライアントは、イベントフレームとレスポンスフレームを
  使用前に検証します。
- **機能 discovery**: Gateway は `hello-ok` で、`listGatewayMethods()` と
  `GATEWAY_EVENTS` から得た保守的な `features.methods` と
  `features.events` のリストを送信します。
- その discovery リストは、`coreGatewayHandlers` 内の呼び出し可能なすべてのヘルパーを
  生成して列挙したものではありません。一部のヘルパー RPC は、公開される
  機能リストに列挙されないまま `src/gateway/server-methods/*.ts` に実装されています。

## フレーム例

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

Hello-ok レスポンス:

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

リクエスト + レスポンス:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

イベント:

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

## 実例: メソッドをエンドツーエンドで追加する

例: `{ ok: true, text }` を返す新しい `system.echo` リクエストを追加します。

1. **スキーマ（信頼できる唯一の情報源）**

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

`src/gateway/protocol/index.ts` で、AJV バリデーターをエクスポートします。

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **サーバー動作**

`src/gateway/server-methods/system.ts` にハンドラーを追加します。

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

`src/gateway/server-methods.ts`（すでに `systemHandlers` をマージしています）に登録し、
`src/gateway/server-methods-list.ts` の `listGatewayMethods` 入力に
`"system.echo"` を追加します。

そのメソッドをオペレーターまたはノードクライアントから呼び出せる場合は、
スコープ強制と `hello-ok` の機能公開が揃うように、
`src/gateway/method-scopes.ts` でも分類してください。

4. **再生成**

```bash
pnpm protocol:check
```

5. **テスト + ドキュメント**

`src/gateway/server.*.test.ts` にサーバーテストを追加し、ドキュメントにそのメソッドを記載します。

## Swift コード生成の動作

Swift ジェネレーターは次を出力します。

- `req`, `res`, `event`, `unknown` のケースを持つ `GatewayFrame` enum
- 強く型付けされた payload 構造体/enum
- `ErrorCode` 値と `GATEWAY_PROTOCOL_VERSION`

不明なフレームタイプは、前方互換性のために raw payload として保持されます。

## バージョニング + 互換性

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信し、サーバーは不一致を拒否します。
- Swift モデルは、古いクライアントを壊さないように不明なフレームタイプを保持します。

## スキーマパターンと規約

- ほとんどのオブジェクトは、厳密な payload のために `additionalProperties: false` を使用します。
- ID とメソッド/イベント名では、`NonEmptyString` がデフォルトです。
- トップレベルの `GatewayFrame` は `type` 上の **discriminator** を使用します。
- 副作用のあるメソッドは通常、params 内に `idempotencyKey` を要求します
  （例: `send`, `poll`, `agent`, `chat.send`）。
- `agent` は、実行時に生成されるオーケストレーションコンテキスト向けの任意の `internalEvents` を受け付けます
  （例: サブエージェント/cron タスク完了の引き継ぎ）。これは内部 API サーフェスとして扱ってください。

## ライブスキーマ JSON

生成された JSON Schema は、リポジトリの `dist/protocol.schema.json` にあります。
公開されている raw ファイルは通常、次で利用できます。

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## スキーマを変更するとき

1. TypeBox スキーマを更新します。
2. `src/gateway/server-methods-list.ts` にメソッド/イベントを登録します。
3. 新しい RPC がオペレーターまたはノードスコープの分類を必要とする場合は、
   `src/gateway/method-scopes.ts` を更新します。
4. `pnpm protocol:check` を実行します。
5. 再生成されたスキーマ + Swift モデルをコミットします。

## 関連

- [リッチ出力プロトコル](/ja-JP/reference/rich-output-protocol)
- [RPC アダプター](/ja-JP/reference/rpc)
