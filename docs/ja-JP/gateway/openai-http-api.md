---
read_when:
    - OpenAI Chat Completions を想定するツールの統合
summary: Gateway から OpenAI 互換の /v1/chat/completions HTTP エンドポイントを公開する
title: OpenAI チャット補完
x-i18n:
    generated_at: "2026-05-11T20:30:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw の Gateway は、小さな OpenAI 互換の Chat Completions エンドポイントを提供できます。

このエンドポイントは**デフォルトで無効**です。まず設定で有効にしてください。

- `POST /v1/chat/completions`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/v1/chat/completions`

Gateway の OpenAI 互換 HTTP サーフェスが有効な場合、次も提供されます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

内部的には、リクエストは通常の Gateway エージェント実行（`openclaw agent` と同じコードパス）として実行されるため、ルーティング、権限、設定は Gateway と一致します。

## 認証

Gateway 認証設定を使用します。

一般的な HTTP 認証パス:

- 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- 信頼済みの ID 付き HTTP 認証（`gateway.auth.mode="trusted-proxy"`）:
  設定済みの ID 対応プロキシ経由でルーティングし、必要な ID ヘッダーを挿入させます
- プライベート ingress のオープン認証（`gateway.auth.mode="none"`）:
  認証ヘッダーは不要です

注:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTP リクエストは設定済みの信頼済みプロキシソースから来る必要があります。同一ホストのループバックプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- `gateway.auth.rateLimit` が設定され、認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、Gateway インスタンスに対する**完全なオペレーターアクセス**サーフェスとして扱ってください。

- ここでの HTTP ベアラー認証は、狭いユーザー単位スコープモデルではありません。
- このエンドポイントの有効な Gateway トークン/パスワードは、所有者/オペレーター資格情報として扱う必要があります。
- リクエストは、信頼済みオペレーター操作と同じコントロールプレーンエージェントパスを通ります。
- このエンドポイントには、所有者以外/ユーザー単位の独立したツール境界はありません。ここで呼び出し元が Gateway 認証を通過すると、OpenClaw はその呼び出し元をこの Gateway の信頼済みオペレーターとして扱います。
- 共有シークレット認証モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送信しても、エンドポイントは通常の完全なオペレーターデフォルトを復元します。
- 信頼済みの ID 付き HTTP モード（例: 信頼済みプロキシ認証または `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合は通常のオペレーター既定スコープセットにフォールバックします。
- 対象エージェントのポリシーで機密ツールが許可されている場合、このエンドポイントはそれらを使用できます。
- このエンドポイントはループバック/tailnet/プライベート ingress のみに配置してください。公開インターネットへ直接公開しないでください。

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway オペレーターシークレットの所有を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全な既定オペレータースコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上のチャットターンを所有者送信者ターンとして扱います
- 信頼済みの ID 付き HTTP モード（例: 信頼済みプロキシ認証、またはプライベート ingress 上の `gateway.auth.mode="none"`）
  - 何らかの外側の信頼済み ID またはデプロイ境界を認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーが存在しない場合は通常のオペレーター既定スコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、`operator.admin` を省略した場合にのみ、所有者セマンティクスを失います

[セキュリティ](/ja-JP/gateway/security) と [リモートアクセス](/ja-JP/gateway/remote) を参照してください。

## エージェントファーストのモデル契約

OpenClaw は OpenAI の `model` フィールドを、生のプロバイダーモデル ID ではなく**エージェントターゲット**として扱います。

- `model: "openclaw"` は設定済みの既定エージェントへルーティングします。
- `model: "openclaw/default"` も設定済みの既定エージェントへルーティングします。
- `model: "openclaw/<agentId>"` は特定のエージェントへルーティングします。

任意のリクエストヘッダー:

- `x-openclaw-model: <provider/model-or-bare-id>` は、選択したエージェントのバックエンドモデルを上書きします。
- `x-openclaw-agent-id: <agentId>` は互換性用の上書きとして引き続きサポートされます。
- `x-openclaw-session-key: <sessionKey>` はセッションルーティングを完全に制御します。
- `x-openclaw-message-channel: <channel>` は、チャネル対応プロンプトとポリシー向けの合成 ingress チャネルコンテキストを設定します。

互換性エイリアスも引き続き受け付けます。

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## エンドポイントの有効化

`gateway.http.endpoints.chatCompletions.enabled` を `true` に設定します。

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## エンドポイントの無効化

`gateway.http.endpoints.chatCompletions.enabled` を `false` に設定します。

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## セッションの動作

デフォルトでは、このエンドポイントは**リクエスト単位でステートレス**です（呼び出しごとに新しいセッションキーが生成されます）。

リクエストに OpenAI の `user` 文字列が含まれる場合、Gateway はそれから安定したセッションキーを導出するため、繰り返しの呼び出しでエージェントセッションを共有できます。

## このサーフェスが重要な理由

これは、セルフホストされたフロントエンドとツール向けに最もレバレッジの高い互換性セットです。

- ほとんどの Open WebUI、LobeChat、LibreChat セットアップは `/v1/models` を想定しています。
- 多くの RAG システムは `/v1/embeddings` を想定しています。
- 既存の OpenAI チャットクライアントは通常、`/v1/chat/completions` から開始できます。
- よりエージェントネイティブなクライアントでは、`/v1/responses` がますます好まれています。

## モデル一覧とエージェントルーティング

<AccordionGroup>
  <Accordion title="`/v1/models` は何を返しますか？">
    OpenClaw のエージェントターゲット一覧です。

    返される ID は `openclaw`、`openclaw/default`、`openclaw/<agentId>` のエントリです。
    それらを OpenAI の `model` 値として直接使用してください。

  </Accordion>
  <Accordion title="`/v1/models` はエージェントまたはサブエージェントを一覧表示しますか？">
    トップレベルのエージェントターゲットを一覧表示します。バックエンドプロバイダーモデルでも、サブエージェントでもありません。

    サブエージェントは内部実行トポロジーのままです。疑似モデルとしては表示されません。

  </Accordion>
  <Accordion title="なぜ `openclaw/default` が含まれているのですか？">
    `openclaw/default` は、設定済みの既定エージェントに対する安定したエイリアスです。

    つまり、実際の既定エージェント ID が環境間で変わっても、クライアントは予測可能な 1 つの ID を使い続けられます。

  </Accordion>
  <Accordion title="バックエンドモデルを上書きするにはどうすればよいですか？">
    `x-openclaw-model` を使用します。

    例:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    省略した場合、選択されたエージェントは通常の設定済みモデル選択で実行されます。

  </Accordion>
  <Accordion title="embeddings はこの契約にどのように適合しますか？">
    `/v1/embeddings` は同じエージェントターゲット `model` ID を使用します。

    `model: "openclaw/default"` または `model: "openclaw/<agentId>"` を使用します。
    特定の embedding モデルが必要な場合は、`x-openclaw-model` で送信します。
    そのヘッダーがない場合、リクエストは選択されたエージェントの通常の embedding セットアップへ渡されます。

  </Accordion>
</AccordionGroup>

## ストリーミング（SSE）

Server-Sent Events（SSE）を受信するには `stream: true` を設定します。

- `Content-Type: text/event-stream`
- 各イベント行は `data: <json>` です
- ストリームは `data: [DONE]` で終了します

## チャットツール契約

`/v1/chat/completions` は、一般的な OpenAI Chat クライアントと互換性のある function-tool サブセットをサポートします。

### サポートされるリクエストフィールド

- `tools`: `{ "type": "function", "function": { ... } }` の配列
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` のフォローアップターン
- ツール結果を以前のツール呼び出しへ関連付けるための `messages[*].tool_call_id`

### サポートされないバリアント

エンドポイントは、以下を含むサポートされないツールバリアントに対して `400 invalid_request_error` を返します。

- 配列でない `tools`
- function ではないツールエントリ
- `tool.function.name` の欠落
- `allowed_tools` や `custom` などの `tool_choice` バリアント
- `tool_choice: "required"`（ランタイムではまだ強制されません。強制実装後にサポートされます）
- `tool_choice: { "type": "function", "function": { "name": "..." } }`（`required` と同じ理由）
- 提供された `tools` と一致しない `tool_choice.function.name` 値

### 非ストリーミングのツールレスポンス形状

エージェントがツールを呼び出すと判断した場合、レスポンスは次を使用します。

- `choices[0].finish_reason = "tool_calls"`
- 次を持つ `choices[0].message.tool_calls[]` エントリ:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments`（JSON 文字列）

ツール呼び出し前のアシスタントのコメントは、`choices[0].message.content`（空の場合あり）で返されます。

### ストリーミングのツールレスポンス形状

`stream: true` の場合、ツール呼び出しは増分 SSE チャンクとして出力されます。

- 初期アシスタントロール delta
- 任意のアシスタントコメント delta
- ツール ID と引数フラグメントを運ぶ 1 つ以上の `delta.tool_calls` チャンク
- `finish_reason: "tool_calls"` を持つ最終チャンク
- `data: [DONE]`

`stream_options.include_usage=true` の場合、`[DONE]` の前に末尾の usage チャンクが出力されます。

### ツールフォローアップループ

`tool_calls` を受信した後、クライアントは要求された関数を実行し、次を含むフォローアップリクエストを送信する必要があります。

- 以前のアシスタントツール呼び出しメッセージ
- 一致する `tool_call_id` を持つ 1 つ以上の `role: "tool"` メッセージ

これにより、Gateway エージェント実行は同じ推論ループを継続し、最終的なアシスタント回答を生成できます。

## Open WebUI クイックセットアップ

基本的な Open WebUI 接続の場合:

- ベース URL: `http://127.0.0.1:18789/v1`
- macOS 上の Docker ベース URL: `http://host.docker.internal:18789/v1`
- API キー: Gateway ベアラートークン
- モデル: `openclaw/default`

期待される動作:

- `GET /v1/models` は `openclaw/default` を一覧表示する必要があります
- Open WebUI は `openclaw/default` をチャットモデル ID として使用する必要があります
- そのエージェントに対して特定のバックエンドプロバイダー/モデルを使用したい場合は、エージェントの通常の既定モデルを設定するか、`x-openclaw-model` を送信します

クイックスモーク:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

これが `openclaw/default` を返す場合、ほとんどの Open WebUI セットアップは同じベース URL とトークンで接続できます。

## 例

非ストリーミング:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

ストリーミング:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

モデル一覧:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

1 つのモデルを取得:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

embeddings の作成:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

注:

- `/v1/models` は、生のプロバイダーカタログではなく OpenClaw エージェントターゲットを返します。
- `openclaw/default` は常に存在するため、1 つの安定した ID が環境をまたいで機能します。
- バックエンドプロバイダー/モデルの上書きは、OpenAI の `model` フィールドではなく `x-openclaw-model` に属します。
- `/v1/embeddings` は `input` を文字列または文字列の配列としてサポートします。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [OpenAI](/ja-JP/providers/openai)
