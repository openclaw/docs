---
read_when:
    - プロトコルスキーマまたはコード生成の更新
summary: Gatewayプロトコルの信頼できる唯一の情報源としてのTypeBoxスキーマ
title: TypeBox
x-i18n:
    generated_at: "2026-07-11T22:08:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox は TypeScript ファーストのスキーマライブラリです。OpenClaw では、**Gateway WebSocket プロトコル**（ハンドシェイク、リクエスト/レスポンス、サーバーイベント）の定義に使用しています。これらのスキーマは、**ランタイム検証**（AJV）、**JSON Schema のエクスポート**、および macOS アプリ向けの **Swift コード生成**に使用されます。信頼できる唯一の情報源であり、その他はすべてここから生成されます。

上位レベルのプロトコルの背景については、[Gateway アーキテクチャ](/ja-JP/concepts/architecture)から参照してください。

## メンタルモデル（30 秒）

すべての Gateway WS メッセージは、次の 3 種類のフレームのいずれかです。

- **リクエスト**: `{ type: "req", id, method, params }`
- **レスポンス**: `{ type: "res", id, ok, payload | error }`
- **イベント**: `{ type: "event", event, payload, seq?, stateVersion? }`

最初のフレームは、**必ず** `connect` リクエストでなければなりません。その後、クライアントはメソッド（例: `health`、`send`、`chat.send`）を呼び出し、イベント（例: `presence`、`tick`、`agent`）を購読します。

接続フロー（最小構成）:

```text
クライアント              Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

一般的なメソッドとイベント:

| カテゴリ   | 例                                                         | 注記                                             |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------ |
| コア       | `connect`, `health`, `status`                              | `connect` は最初でなければならない               |
| メッセージング | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | 副作用のあるメソッドには `idempotencyKey` が必要 |
| チャット   | `chat.history`, `chat.send`, `chat.abort`                  | WebChat はこれらを使用                           |
| セッション | `sessions.list`, `sessions.patch`, `sessions.delete`       | セッション管理                                   |
| 自動化     | `wake`, `cron.list`, `cron.run`, `cron.runs`               | wake と cron の制御                              |
| Node       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS と Node アクション                    |
| イベント   | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | サーバープッシュ                                 |

正式に公開される **ディスカバリー** 一覧は、`src/gateway/server-methods-list.ts`（`listGatewayMethods`、`GATEWAY_EVENTS`）にあります。

## スキーマの配置場所

- ソースバレル: `packages/gateway-protocol/src/schema.ts` は、`packages/gateway-protocol/src/schema/*.ts` 配下のドメインモジュールを再エクスポートします（トップレベルのエンベロープとハンドシェイクは `frames.ts`、機能領域ごとに `agent.ts`、`sessions.ts`、`cron.ts` など）。`protocol-schemas.ts` は、スキーマ名を TypeBox 定義にマッピングする中央の `ProtocolSchemas` レジストリです。
- ランタイムバリデーター（AJV）: `packages/gateway-protocol/src/index.ts`
- 公開される機能/ディスカバリーレジストリ: `src/gateway/server-methods-list.ts`
- サーバーのハンドシェイクとメソッドディスパッチ: `src/gateway/server.impl.ts`
- Node クライアント: `src/gateway/client.ts`
- 生成された JSON Schema: `dist/protocol.schema.json`（ビルド出力、コミット対象外）
- 生成された Swift モデル: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## 現在のパイプライン

- `pnpm protocol:gen` は、JSON Schema（draft-07）を `dist/protocol.schema.json` に書き出します。
- `pnpm protocol:gen:swift` は、Swift の Gateway モデルを生成します。
- `pnpm protocol:check` は両方のジェネレーターを実行し、Swift 出力がコミットされていることを検証します（JSON Schema 出力は gitignore 対象のビルド成果物です）。

## ランタイムでのスキーマの使用方法

- **サーバー側**: 受信するすべてのフレームを AJV で検証します。ハンドシェイクでは、パラメーターが `ConnectParams` に一致する `connect` リクエストのみを受け付けます。
- **クライアント側**: JS クライアントは、イベントフレームとレスポンスフレームを使用する前に検証します。
- **機能ディスカバリー**: Gateway は、`listGatewayMethods()` と `GATEWAY_EVENTS` から得た保守的な `features.methods` および `features.events` の一覧を `hello-ok` で送信します。
- このディスカバリー一覧は、`coreGatewayHandlers` 内の呼び出し可能なすべてのヘルパーを自動生成したものではありません。一部のヘルパー RPC は、公開される機能一覧に列挙されないまま `src/gateway/server-methods/*.ts` に実装されています。

## フレームの例

接続（最初のメッセージ）:

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
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

リクエストとレスポンス:

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

実用上最小のフロー: 接続 + ヘルスチェック。

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

1. **スキーマ（信頼できる唯一の情報源）**

`packages/gateway-protocol/src/schema/system.ts`（または最も近い機能モジュール）に追加します。

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

両方を `packages/gateway-protocol/src/schema/protocol-schemas.ts` にインポートし、`ProtocolSchemas` レジストリに追加して、派生型をエクスポートします。

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

`src/gateway/server-methods.ts` に登録し（ここではすでに `systemHandlers` をマージしています）、`src/gateway/server-methods-list.ts` の `listGatewayMethods` の入力に `"system.echo"` を追加します。

このメソッドをオペレーターまたは Node クライアントから呼び出せる場合は、スコープの適用と `hello-ok` の機能公開が一致するように、`src/gateway/method-scopes.ts` でも分類してください。

4. **再生成**

```bash
pnpm protocol:check
```

5. **テストとドキュメント**

`src/gateway/server.*.test.ts` にサーバーテストを追加し、ドキュメントにもこのメソッドを記載します。

## Swift コード生成の動作

Swift ジェネレーターは次を出力します。

- `req`、`res`、`event`、`unknown` ケースを持つ `GatewayFrame` 列挙型
- 厳密に型付けされたペイロード構造体/列挙型
- `ErrorCode` の値、`GATEWAY_PROTOCOL_VERSION`、`GATEWAY_MIN_PROTOCOL_VERSION`

前方互換性のため、不明なフレームタイプは生のペイロードとして保持されます。

## バージョニングと互換性

- `PROTOCOL_VERSION` は `packages/gateway-protocol/src/version.ts` にあります（現在の値: `4`）。
- クライアントは `minProtocol` と `maxProtocol` を送信します。サーバーは、現在のプロトコルを含まない範囲を拒否します。
- Swift モデルは、古いクライアントを破壊しないよう、不明なフレームタイプを保持します。

## スキーマのパターンと規約

- ほとんどのオブジェクトでは、厳密なペイロードのために `additionalProperties: false` を使用します。
- `NonEmptyString`（`Type.String({ minLength: 1 })`）は、ID とメソッド名/イベント名のデフォルトです。
- トップレベルの `GatewayFrame` は、`type` を **判別子**として使用します。
- 副作用のあるメソッドでは通常、パラメーターに `idempotencyKey` が必要です（例: `send`、`poll`、`agent`、`chat.send`）。
- `agent` は、ランタイムが生成するオーケストレーションコンテキスト（たとえば、サブエージェント/Cron タスク完了時の引き継ぎ）用に、省略可能な `internalEvents` を受け付けます。これは内部 API サーフェスとして扱ってください。

## ライブスキーマ JSON

生成された JSON Schema はビルド成果物であり、リポジトリにはコミットされません。公開されている raw ファイルは通常、次の場所で利用できます。

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## スキーマを変更する場合

1. 所有元の `packages/gateway-protocol/src/schema/*.ts` モジュールで TypeBox スキーマを更新し、`protocol-schemas.ts` に登録します。
2. `src/gateway/server-methods-list.ts` にメソッド/イベントを登録します。
3. 新しい RPC にオペレーターまたは Node のスコープ分類が必要な場合は、`src/gateway/method-scopes.ts` を更新します。
4. `pnpm protocol:check` を実行します。
5. 再生成された Swift モデルをコミットします。

## 関連項目

- [リッチ出力プロトコル](/ja-JP/reference/rich-output-protocol)
- [RPC アダプター](/ja-JP/reference/rpc)
