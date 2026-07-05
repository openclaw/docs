---
read_when:
    - プロトコルスキーマまたはコード生成の更新
summary: Gateway プロトコルの唯一の信頼できる情報源としての TypeBox スキーマ
title: TypeBox
x-i18n:
    generated_at: "2026-07-05T11:16:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBoxはTypeScriptファーストのスキーマライブラリです。OpenClawはこれを使って**Gateway WebSocketプロトコル**（ハンドシェイク、リクエスト/レスポンス、サーバーイベント）を定義しています。これらのスキーマは、**ランタイム検証**（AJV）、**JSON Schemaエクスポート**、macOSアプリ向けの**Swiftコード生成**を駆動します。単一の信頼できる情報源があり、それ以外はすべて生成されます。

より高レベルのプロトコルコンテキストについては、[Gatewayアーキテクチャ](/ja-JP/concepts/architecture)から始めてください。

## メンタルモデル（30秒）

すべてのGateway WSメッセージは、次の3種類のフレームのいずれかです。

- **リクエスト**: `{ type: "req", id, method, params }`
- **レスポンス**: `{ type: "res", id, ok, payload | error }`
- **イベント**: `{ type: "event", event, payload, seq?, stateVersion? }`

最初のフレームは**必ず**`connect`リクエストでなければなりません。その後、クライアントはメソッド（例: `health`, `send`, `chat.send`）を呼び出し、イベント（例: `presence`, `tick`, `agent`）を購読します。

接続フロー（最小）:

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

一般的なメソッドとイベント:

| カテゴリ   | 例                                                         | 注記                                         |
| ---------- | ---------------------------------------------------------- | -------------------------------------------- |
| コア       | `connect`, `health`, `status`                              | `connect`は最初でなければなりません         |
| メッセージング | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | 副作用のあるメソッドには`idempotencyKey`が必要です |
| チャット   | `chat.history`, `chat.send`, `chat.abort`                  | WebChatはこれらを使用します                  |
| セッション | `sessions.list`, `sessions.patch`, `sessions.delete`       | セッション管理                               |
| 自動化     | `wake`, `cron.list`, `cron.run`, `cron.runs`               | wakeとcronの制御                             |
| ノード     | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WSとノードアクション                 |
| イベント   | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | サーバープッシュ                             |

権威ある広告済みの**ディスカバリー**インベントリは、`src/gateway/server-methods-list.ts`（`listGatewayMethods`, `GATEWAY_EVENTS`）にあります。

## スキーマの場所

- ソースbarrel: `packages/gateway-protocol/src/schema.ts`は、`packages/gateway-protocol/src/schema/*.ts`配下のドメインモジュールを再エクスポートします（トップレベルのエンベロープとハンドシェイク用の`frames.ts`、機能領域ごとの`agent.ts`, `sessions.ts`, `cron.ts`など）。`protocol-schemas.ts`は、スキーマ名をTypeBox定義にマッピングする中心的な`ProtocolSchemas`レジストリです。
- ランタイムバリデーター（AJV）: `packages/gateway-protocol/src/index.ts`
- 広告される機能/ディスカバリーレジストリ: `src/gateway/server-methods-list.ts`
- サーバーハンドシェイクとメソッドディスパッチ: `src/gateway/server.impl.ts`
- Nodeクライアント: `src/gateway/client.ts`
- 生成されたJSON Schema: `dist/protocol.schema.json`（ビルド出力、コミットされません）
- 生成されたSwiftモデル: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## 現在のパイプライン

- `pnpm protocol:gen`はJSON Schema（draft-07）を`dist/protocol.schema.json`へ書き込みます。
- `pnpm protocol:gen:swift`はSwift gatewayモデルを生成します。
- `pnpm protocol:check`は両方のジェネレーターを実行し、Swift出力がコミットされていることを検証します（JSON Schema出力はgitignoreされたビルドアーティファクトです）。

## ランタイムでのスキーマの使われ方

- **サーバー側**: すべての受信フレームはAJVで検証されます。ハンドシェイクは、paramsが`ConnectParams`に一致する`connect`リクエストのみを受け入れます。
- **クライアント側**: JSクライアントは、イベントフレームとレスポンスフレームを使用する前に検証します。
- **機能ディスカバリー**: Gatewayは、`listGatewayMethods()`と`GATEWAY_EVENTS`から得た保守的な`features.methods`と`features.events`リストを`hello-ok`で送信します。
- このディスカバリーリストは、`coreGatewayHandlers`内の呼び出し可能なすべてのヘルパーを生成してダンプしたものではありません。一部のヘルパーRPCは、広告される機能リストに列挙されずに`src/gateway/server-methods/*.ts`で実装されています。

## フレーム例

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

Hello-okレスポンス:

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

最小限の有用なフロー: 接続 + health。

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

例: `{ ok: true, text }`を返す新しい`system.echo`リクエストを追加します。

1. **スキーマ（信頼できる情報源）**

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

両方を`packages/gateway-protocol/src/schema/protocol-schemas.ts`にインポートし、`ProtocolSchemas`レジストリへ追加して、派生型をエクスポートします。

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **検証**

`packages/gateway-protocol/src/index.ts`で、AJVバリデーターをエクスポートします。

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **サーバー動作**

`src/gateway/server-methods/system.ts`にハンドラーを追加します。

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

`src/gateway/server-methods.ts`で登録します（すでに`systemHandlers`をマージしています）。その後、`src/gateway/server-methods-list.ts`の`listGatewayMethods`入力に`"system.echo"`を追加します。

そのメソッドがoperatorまたはノードクライアントから呼び出し可能な場合は、スコープ適用と`hello-ok`機能広告が揃うように、`src/gateway/method-scopes.ts`でも分類します。

4. **再生成**

```bash
pnpm protocol:check
```

5. **テストとドキュメント**

`src/gateway/server.*.test.ts`にサーバーテストを追加し、ドキュメントにそのメソッドを記載します。

## Swiftコード生成の動作

Swiftジェネレーターは次を出力します。

- `req`, `res`, `event`, `unknown`ケースを持つ`GatewayFrame` enum
- 強く型付けされたpayloadのstruct/enum
- `ErrorCode`値、`GATEWAY_PROTOCOL_VERSION`、`GATEWAY_MIN_PROTOCOL_VERSION`

未知のフレームタイプは、前方互換性のためにraw payloadとして保持されます。

## バージョニングと互換性

- `PROTOCOL_VERSION`は`packages/gateway-protocol/src/version.ts`にあります（現在値: `4`）。
- クライアントは`minProtocol`と`maxProtocol`を送信します。サーバーは、現在のプロトコルを含まない範囲を拒否します。
- Swiftモデルは、古いクライアントを壊さないように未知のフレームタイプを保持します。

## スキーマのパターンと規約

- ほとんどのオブジェクトは、厳密なpayloadのために`additionalProperties: false`を使用します。
- `NonEmptyString`（`Type.String({ minLength: 1 })`）は、IDとメソッド/イベント名のデフォルトです。
- トップレベルの`GatewayFrame`は、`type`上の**discriminator**を使用します。
- 副作用のあるメソッドは通常、params内に`idempotencyKey`を必要とします（例: `send`, `poll`, `agent`, `chat.send`）。
- `agent`は、ランタイム生成のオーケストレーションコンテキスト（例: サブエージェント/cronタスク完了の引き継ぎ）向けに任意の`internalEvents`を受け入れます。これは内部APIサーフェスとして扱ってください。

## ライブスキーマJSON

生成されたJSON Schemaはビルドアーティファクトであり、リポジトリにはコミットされません。公開されるrawファイルは通常、次の場所で利用できます。

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## スキーマを変更するとき

1. 所有する`packages/gateway-protocol/src/schema/*.ts`モジュールのTypeBoxスキーマを更新し、`protocol-schemas.ts`に登録します。
2. `src/gateway/server-methods-list.ts`にメソッド/イベントを登録します。
3. 新しいRPCがoperatorまたはノードスコープ分類を必要とする場合は、`src/gateway/method-scopes.ts`を更新します。
4. `pnpm protocol:check`を実行します。
5. 再生成されたSwiftモデルをコミットします。

## 関連

- [リッチ出力プロトコル](/ja-JP/reference/rich-output-protocol)
- [RPCアダプター](/ja-JP/reference/rpc)
