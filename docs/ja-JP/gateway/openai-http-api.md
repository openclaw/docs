---
read_when:
    - OpenAI Chat Completions を想定するツールの統合
summary: Gateway から OpenAI 互換の /v1/chat/completions HTTP エンドポイントを公開する
title: OpenAI チャット補完
x-i18n:
    generated_at: "2026-05-12T15:43:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw の Gateway は、小さな OpenAI 互換 Chat Completions エンドポイントを提供できます。

このエンドポイントは**デフォルトで無効**です。先に設定で有効化してください。

- `POST /v1/chat/completions`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/v1/chat/completions`

Gateway の OpenAI 互換 HTTP サーフェスが有効な場合、次も提供されます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

内部的には、リクエストは通常の Gateway エージェント実行（`openclaw agent` と同じコードパス）として実行されるため、ルーティング、権限、設定は Gateway と一致します。

## 認証

Gateway の認証設定を使用します。

一般的な HTTP 認証パス:

- 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- 信頼された ID 付き HTTP 認証（`gateway.auth.mode="trusted-proxy"`）:
  設定済みの ID 認識プロキシ経由でルーティングし、必要な ID ヘッダーを注入させます
- プライベート入口のオープン認証（`gateway.auth.mode="none"`）:
  認証ヘッダーは不要です

注記:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTP リクエストは設定済みの信頼されたプロキシソースから送信される必要があります。同一ホストのループバックプロキシには、明示的に `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- `gateway.auth.rateLimit` が設定されていて認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、Gateway インスタンスに対する**完全なオペレーターアクセス**サーフェスとして扱ってください。

- ここでの HTTP ベアラー認証は、狭いユーザー別スコープモデルではありません。
- このエンドポイントの有効な Gateway トークン/パスワードは、所有者/オペレーター資格情報と同様に扱う必要があります。
- リクエストは、信頼されたオペレーター操作と同じコントロールプレーンエージェントパスを通じて実行されます。
- このエンドポイントには、別個の非所有者/ユーザー別ツール境界はありません。呼び出し元がここで Gateway 認証を通過すると、OpenClaw はその呼び出し元をこの Gateway の信頼されたオペレーターとして扱います。
- 共有シークレット認証モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送信しても、エンドポイントは通常の完全なオペレーターデフォルトを復元します。
- 信頼された ID 付き HTTP モード（たとえば信頼済みプロキシ認証や `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合は通常のオペレーターデフォルトスコープセットにフォールバックします。
- 対象エージェントポリシーが機密性の高いツールを許可している場合、このエンドポイントはそれらを使用できます。
- このエンドポイントは loopback/tailnet/プライベート入口のみに置いてください。公開インターネットへ直接公開しないでください。

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway オペレーターシークレットの所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルトオペレータースコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上のチャットターンを所有者送信者ターンとして扱います
- 信頼された ID 付き HTTP モード（たとえば信頼済みプロキシ認証、またはプライベート入口上の `gateway.auth.mode="none"`）
  - 何らかの外側の信頼された ID またはデプロイ境界を認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーが存在しない場合は通常のオペレーターデフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、`operator.admin` を省略した場合にのみ所有者セマンティクスを失います

[セキュリティ](/ja-JP/gateway/security) と [リモートアクセス](/ja-JP/gateway/remote) を参照してください。

## エージェント優先モデル契約

OpenClaw は OpenAI の `model` フィールドを、生のプロバイダーモデル ID ではなく**エージェントターゲット**として扱います。

- `model: "openclaw"` は設定済みのデフォルトエージェントへルーティングします。
- `model: "openclaw/default"` も設定済みのデフォルトエージェントへルーティングします。
- `model: "openclaw/<agentId>"` は特定のエージェントへルーティングします。

任意のリクエストヘッダー:

- `x-openclaw-model: <provider/model-or-bare-id>` は選択されたエージェントのバックエンドモデルを上書きします。
- `x-openclaw-agent-id: <agentId>` は互換性のための上書きとして引き続きサポートされます。
- `x-openclaw-session-key: <sessionKey>` はセッションルーティングを完全に制御します。
- `x-openclaw-message-channel: <channel>` は、チャネル対応プロンプトとポリシー用の合成入口チャネルコンテキストを設定します。

互換エイリアスも引き続き受け付けます。

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## エンドポイントを有効化する

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

## エンドポイントを無効化する

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

## セッション動作

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（各呼び出しで新しいセッションキーが生成されます）。

リクエストに OpenAI の `user` 文字列が含まれる場合、Gateway はそこから安定したセッションキーを導出するため、繰り返し呼び出しでエージェントセッションを共有できます。

## このサーフェスが重要な理由

これは、セルフホストのフロントエンドとツール向けに最も効果の高い互換性セットです。

- ほとんどの Open WebUI、LobeChat、LibreChat セットアップは `/v1/models` を期待します。
- 多くの RAG システムは `/v1/embeddings` を期待します。
- 既存の OpenAI チャットクライアントは通常、`/v1/chat/completions` から開始できます。
- よりエージェントネイティブなクライアントでは、`/v1/responses` がますます好まれています。

## モデル一覧とエージェントルーティング

<AccordionGroup>
  <Accordion title="`/v1/models` は何を返しますか？">
    OpenClaw のエージェントターゲット一覧です。

    返される ID は、`openclaw`、`openclaw/default`、および `openclaw/<agentId>` エントリです。
    それらを OpenAI の `model` 値として直接使用してください。

  </Accordion>
  <Accordion title="`/v1/models` はエージェントまたはサブエージェントを一覧表示しますか？">
    バックエンドプロバイダーモデルでもサブエージェントでもなく、トップレベルのエージェントターゲットを一覧表示します。

    サブエージェントは内部実行トポロジーのままです。疑似モデルとしては表示されません。

  </Accordion>
  <Accordion title="なぜ `openclaw/default` が含まれていますか？">
    `openclaw/default` は、設定済みのデフォルトエージェントに対する安定したエイリアスです。

    つまり、環境間で実際のデフォルトエージェント ID が変わっても、クライアントは予測可能な 1 つの ID を使い続けられます。

  </Accordion>
  <Accordion title="バックエンドモデルを上書きするにはどうすればよいですか？">
    `x-openclaw-model` を使用します。

    例:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    省略した場合、選択されたエージェントは通常の設定済みモデル選択で実行されます。

  </Accordion>
  <Accordion title="埋め込みはこの契約にどのように適合しますか？">
    `/v1/embeddings` は同じエージェントターゲット `model` ID を使用します。

    `model: "openclaw/default"` または `model: "openclaw/<agentId>"` を使用してください。
    特定の埋め込みモデルが必要な場合は、`x-openclaw-model` で送信します。
    そのヘッダーがない場合、リクエストは選択されたエージェントの通常の埋め込み設定へ渡されます。

  </Accordion>
</AccordionGroup>

## ストリーミング（SSE）

Server-Sent Events（SSE）を受信するには `stream: true` を設定します。

- `Content-Type: text/event-stream`
- 各イベント行は `data: <json>` です
- ストリームは `data: [DONE]` で終了します

## チャットツール契約

`/v1/chat/completions` は、一般的な OpenAI Chat クライアントと互換性のある関数ツールサブセットをサポートします。

### サポートされるリクエストフィールド

- `tools`: `{ "type": "function", "function": { ... } }` の配列
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` のフォローアップターン
- 以前のツール呼び出しへツール結果を結び付けるための `messages[*].tool_call_id`
- `max_completion_tokens`: 数値。完了トークン合計（推論トークンを含む）の呼び出しごとの上限です。現在の OpenAI Chat Completions フィールド名です。`max_completion_tokens` と `max_tokens` の両方が送信された場合はこちらが優先されます。
- `max_tokens`: 数値。後方互換性のために受け付けられるレガシーエイリアスです。`max_completion_tokens` も存在する場合は無視されます。

いずれかのフィールドが設定されると、その値はエージェントのストリームパラメータチャネル経由で上流プロバイダーに転送されます。上流プロバイダーへ送信される実際のワイヤーフィールド名は、プロバイダートランスポートによって選択されます。OpenAI 系エンドポイントでは `max_completion_tokens`、レガシー名のみを受け付けるプロバイダー（Mistral や Chutes など）では `max_tokens` です。

### サポートされないバリアント

このエンドポイントは、サポートされないツールバリアントに対して `400 invalid_request_error` を返します。例:

- 配列でない `tools`
- 関数でないツールエントリ
- `tool.function.name` の欠落
- `allowed_tools` や `custom` などの `tool_choice` バリアント
- `tool_choice: "required"`（ランタイムではまだ強制されません。強制が実装されるとサポートされます）
- `tool_choice: { "type": "function", "function": { "name": "..." } }`（`required` と同じ理由）
- 指定された `tools` と一致しない `tool_choice.function.name` 値

### 非ストリーミングツール応答の形状

エージェントがツールを呼び出すと決定した場合、応答は次を使用します。

- `choices[0].finish_reason = "tool_calls"`
- 次を含む `choices[0].message.tool_calls[]` エントリ:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments`（JSON 文字列）

ツール呼び出し前のアシスタントコメントは `choices[0].message.content` に返されます（空の場合があります）。

### ストリーミングツール応答の形状

`stream: true` の場合、ツール呼び出しは増分 SSE チャンクとして送出されます。

- 初期のアシスタントロールデルタ
- 任意のアシスタントコメントデルタ
- ツール ID と引数フラグメントを運ぶ 1 つ以上の `delta.tool_calls` チャンク
- `finish_reason: "tool_calls"` を含む最終チャンク
- `data: [DONE]`

`stream_options.include_usage=true` の場合、`[DONE]` の前に末尾の使用量チャンクが送出されます。

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
- そのエージェントに特定のバックエンドプロバイダー/モデルを使いたい場合は、エージェントの通常のデフォルトモデルを設定するか、`x-openclaw-model` を送信します

簡単なスモーク:

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

モデルを一覧表示する:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

1 つのモデルを取得する:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

埋め込みを作成する:

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

注記:

- `/v1/models` は未加工のプロバイダーカタログではなく、OpenClaw エージェントターゲットを返します。
- `openclaw/default` は常に存在するため、1 つの安定した id が環境をまたいで機能します。
- バックエンドのプロバイダー/モデルのオーバーライドは、OpenAI の `model` フィールドではなく `x-openclaw-model` に指定します。
- `/v1/embeddings` は、`input` を文字列または文字列の配列としてサポートします。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [OpenAI](/ja-JP/providers/openai)
