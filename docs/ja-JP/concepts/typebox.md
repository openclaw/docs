---
read_when:
    - プロトコルスキーマまたはコード生成の更新
summary: Gateway プロトコルの唯一の信頼できる情報源としての TypeBox スキーマ
title: TypeBox
x-i18n:
    generated_at: "2026-06-27T11:19:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2f3da11e9dcf3250fd77e0c43f4ed918551a536d93fa71bce95eaf3d7539f6d
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox は TypeScript ファーストのスキーマライブラリです。OpenClaw では、**Gateway
WebSocket プロトコル** (ハンドシェイク、リクエスト/レスポンス、サーバーイベント) の定義に使用しています。これらのスキーマは、**実行時検証**、**JSON Schema エクスポート**、macOS アプリ向けの **Swift コード生成**を駆動します。信頼できる情報源は 1 つで、それ以外はすべて生成されます。

より高レベルのプロトコルの文脈を知りたい場合は、
[Gateway アーキテクチャ](/ja-JP/concepts/architecture) から始めてください。

## メンタルモデル (30 秒)

すべての Gateway WS メッセージは、次の 3 種類のフレームのいずれかです。

- **リクエスト**: `{ type: "req", id, method, params }`
- **レスポンス**: `{ type: "res", id, ok, payload | error }`
- **イベント**: `{ type: "event", event, payload, seq?, stateVersion? }`

最初のフレームは **必ず** `connect` リクエストでなければなりません。その後、クライアントはメソッド (例: `health`, `send`, `chat.send`) を呼び出し、イベント (例:
`presence`, `tick`, `agent`) を購読できます。

接続フロー (最小構成):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

一般的なメソッドとイベント:

| カテゴリ   | 例                                                         | 注記                               |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| コア       | `connect`, `health`, `status`                              | `connect` は最初である必要があります |
| メッセージング | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | 副作用には `idempotencyKey` が必要です |
| チャット   | `chat.history`, `chat.send`, `chat.abort`                  | WebChat はこれらを使用します        |
| セッション | `sessions.list`, `sessions.patch`, `sessions.delete`       | セッション管理                     |
| 自動化     | `wake`, `cron.list`, `cron.run`, `cron.runs`               | wake + cron 制御                   |
| ノード     | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + ノードアクション      |
| イベント   | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | サーバープッシュ                   |

権威ある広告済みの **ディスカバリ** インベントリは
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`) にあります。

## スキーマの場所

- ソース: `packages/gateway-protocol/src/schema.ts`
- 実行時バリデーター (AJV): `packages/gateway-protocol/src/index.ts`
- 広告される機能/ディスカバリレジストリ: `src/gateway/server-methods-list.ts`
- サーバーハンドシェイク + メソッドディスパッチ: `src/gateway/server.impl.ts`
- Node クライアント: `src/gateway/client.ts`
- 生成された JSON Schema: `dist/protocol.schema.json`
- 生成された Swift モデル: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 現在のパイプライン

- `pnpm protocol:gen`
  - JSON Schema (draft-07) を `dist/protocol.schema.json` に書き込みます
- `pnpm protocol:gen:swift`
  - Swift Gateway モデルを生成します
- `pnpm protocol:check`
  - 両方のジェネレーターを実行し、出力がコミット済みであることを検証します

## スキーマが実行時に使われる仕組み

- **サーバー側**: すべての受信フレームは AJV で検証されます。ハンドシェイクは、params が `ConnectParams` に一致する `connect` リクエストのみを受け入れます。
- **クライアント側**: JS クライアントは、イベントフレームとレスポンスフレームを使用する前に検証します。
- **機能ディスカバリ**: Gateway は `listGatewayMethods()` と `GATEWAY_EVENTS` から、保守的な `features.methods` と `features.events` のリストを `hello-ok` で送信します。
- このディスカバリリストは、`coreGatewayHandlers` 内の呼び出し可能なすべてのヘルパーを生成して列挙したものではありません。一部のヘルパー RPC は、広告される機能リストに列挙されないまま `src/gateway/server-methods/*.ts` に実装されています。

## フレーム例

Connect (最初のメッセージ):

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

Hello-ok レスポンス:

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

## 最小クライアント (Node.js)

最小の有用なフロー: connect + health。

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

## 実例: メソッドをエンドツーエンドで追加する

例: `{ ok: true, text }` を返す新しい `system.echo` リクエストを追加します。

1. **スキーマ (信頼できる情報源)**

`packages/gateway-protocol/src/schema.ts` に追加します。

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

`packages/gateway-protocol/src/index.ts` で、AJV バリデーターをエクスポートします。

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **サーバーの動作**

`src/gateway/server-methods/system.ts` にハンドラーを追加します。

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

`src/gateway/server-methods.ts` に登録し (`systemHandlers` はすでにマージされています)、
その後 `src/gateway/server-methods-list.ts` の `listGatewayMethods` 入力に `"system.echo"` を追加します。

このメソッドをオペレーターまたはノードクライアントから呼び出せる場合は、スコープ適用と `hello-ok` の機能広告が揃うように、`src/gateway/method-scopes.ts` でも分類してください。

4. **再生成**

```bash
pnpm protocol:check
```

5. **テスト + ドキュメント**

`src/gateway/server.*.test.ts` にサーバーテストを追加し、ドキュメントにメソッドを記載します。

## Swift コード生成の動作

Swift ジェネレーターは次を出力します。

- `req`, `res`, `event`, `unknown` ケースを持つ `GatewayFrame` enum
- 強く型付けされたペイロード struct/enum
- `ErrorCode` 値、`GATEWAY_PROTOCOL_VERSION`、`GATEWAY_MIN_PROTOCOL_VERSION`

不明なフレーム型は、前方互換性のために raw payload として保持されます。

## バージョニング + 互換性

- `PROTOCOL_VERSION` は `packages/gateway-protocol/src/version.ts` にあります。
- クライアントは `minProtocol` + `maxProtocol` を送信します。サーバーは、現在のプロトコルを含まない範囲を拒否します。
- Swift モデルは、古いクライアントを壊さないように不明なフレーム型を保持します。

## スキーマパターンと規約

- ほとんどのオブジェクトは、厳密なペイロードのために `additionalProperties: false` を使用します。
- `NonEmptyString` は、ID とメソッド/イベント名のデフォルトです。
- トップレベルの `GatewayFrame` は、`type` 上の **discriminator** を使用します。
- 副作用のあるメソッドは通常、params に `idempotencyKey` を必要とします
  (例: `send`, `poll`, `agent`, `chat.send`)。
- `agent` は、実行時に生成されるオーケストレーションコンテキストのための任意の `internalEvents` を受け入れます
  (例: サブエージェント/cron タスク完了の引き渡し)。これは内部 API サーフェスとして扱ってください。

## ライブスキーマ JSON

生成された JSON Schema は、リポジトリ内の `dist/protocol.schema.json` にあります。公開 raw ファイルは通常、次で利用できます。

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## スキーマを変更する場合

1. TypeBox スキーマを更新します。
2. `src/gateway/server-methods-list.ts` にメソッド/イベントを登録します。
3. 新しい RPC にオペレーターまたはノードのスコープ分類が必要な場合は、`src/gateway/method-scopes.ts` を更新します。
4. `pnpm protocol:check` を実行します。
5. 再生成されたスキーマ + Swift モデルをコミットします。

## 関連

- [リッチ出力プロトコル](/ja-JP/reference/rich-output-protocol)
- [RPC アダプター](/ja-JP/reference/rpc)
