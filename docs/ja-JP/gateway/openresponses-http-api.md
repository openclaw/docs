---
read_when:
    - OpenResponses API に対応したクライアントの統合
    - 項目ベースの入力、クライアントツール呼び出し、または SSE イベントが必要な場合
summary: OpenResponses互換の /v1/responses HTTP エンドポイントを Gateway から公開する
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-30T05:14:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw の Gateway は OpenResponses 互換の `POST /v1/responses` エンドポイントを提供できます。

このエンドポイントは**デフォルトでは無効**です。まず config で有効にしてください。

- `POST /v1/responses`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/v1/responses`

内部では、リクエストは通常の Gateway エージェント実行（`openclaw agent` と同じコードパス）として実行されるため、ルーティング、権限、config は Gateway と一致します。

## 認証、セキュリティ、ルーティング

運用上の挙動は [OpenAI Chat Completions](/ja-JP/gateway/openai-http-api) と一致します。

- 対応する Gateway HTTP 認証パスを使用します:
  - 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）: `Authorization: Bearer <token-or-password>`
  - trusted-proxy 認証（`gateway.auth.mode="trusted-proxy"`）: 設定済みの信頼されたプロキシソースからの ID 対応プロキシヘッダー。同一ホストのループバックプロキシには明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です
  - private-ingress open 認証（`gateway.auth.mode="none"`）: 認証ヘッダーなし
- このエンドポイントを Gateway インスタンスへの完全なオペレーターアクセスとして扱います
- 共有シークレット認証モード（`token` と `password`）では、bearer が宣言したより狭い `x-openclaw-scopes` 値を無視し、通常の完全なオペレーターデフォルトを復元します
- 信頼された ID を持つ HTTP モード（たとえば trusted proxy 認証または `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在する場合は尊重し、それ以外の場合は通常のオペレーターデフォルトスコープセットにフォールバックします
- `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"`、または `x-openclaw-agent-id` でエージェントを選択します
- 選択されたエージェントのバックエンドモデルを上書きしたい場合は `x-openclaw-model` を使用します
- 明示的なセッションルーティングには `x-openclaw-session-key` を使用します
- デフォルト以外の合成 ingress チャネルコンテキストが必要な場合は `x-openclaw-message-channel` を使用します

認証マトリックス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway オペレーターシークレットの所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルトオペレータースコープセットを復元します:
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - このエンドポイント上のチャットターンを owner-sender ターンとして扱います
- 信頼された ID を持つ HTTP モード（たとえば trusted proxy 認証、または private ingress 上の `gateway.auth.mode="none"`）
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーがない場合は通常のオペレーターデフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、`operator.admin` を省略した場合にのみ owner セマンティクスを失います

このエンドポイントは `gateway.http.endpoints.responses.enabled` で有効化または無効化します。

同じ互換サーフェスには次も含まれます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

エージェント対象モデル、`openclaw/default`、embeddings パススルー、バックエンドモデル上書きがどのように組み合わさるかについての標準的な説明は、[OpenAI Chat Completions](/ja-JP/gateway/openai-http-api#agent-first-model-contract) と [モデルリストとエージェントルーティング](/ja-JP/gateway/openai-http-api#model-list-and-agent-routing) を参照してください。

## セッションの挙動

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しいセッションキーが生成されます）。

リクエストに OpenResponses の `user` 文字列が含まれる場合、Gateway はそこから安定したセッションキーを導出するため、繰り返し呼び出しでエージェントセッションを共有できます。

## リクエスト形状（サポート済み）

リクエストは item ベースの input を持つ OpenResponses API に従います。現在のサポート:

- `input`: 文字列、または item オブジェクトの配列。
- `instructions`: システムプロンプトにマージされます。
- `tools`: クライアントツール定義（function tools）。
- `tool_choice`: クライアントツールをフィルタまたは必須化します。
- `stream`: SSE ストリーミングを有効にします。
- `max_output_tokens`: ベストエフォートの出力制限（プロバイダー依存）。
- `user`: 安定したセッションルーティング。

受け付けますが、**現在は無視**されます。

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

サポート済み:

- `previous_response_id`: リクエストが同じエージェント、ユーザー、要求セッションのスコープ内にとどまる場合、OpenClaw は以前のレスポンスセッションを再利用します。

## Items（input）

### `message`

ロール: `system`、`developer`、`user`、`assistant`。

- `system` と `developer` はシステムプロンプトに追加されます。
- 最新の `user` または `function_call_output` item が「現在のメッセージ」になります。
- 以前のユーザー/アシスタントメッセージは、コンテキスト用の履歴として含まれます。

### `function_call_output`（ターンベースのツール）

ツール結果をモデルへ送り返します。

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` と `item_reference`

スキーマ互換性のため受け付けますが、プロンプト構築時には無視されます。

## ツール（クライアント側 function tools）

`tools: [{ type: "function", function: { name, description?, parameters? } }]` でツールを指定します。

エージェントがツールを呼び出すと判断した場合、レスポンスは `function_call` output item を返します。
その後、ターンを継続するために `function_call_output` を含むフォローアップリクエストを送信します。

## 画像（`input_image`）

base64 または URL ソースをサポートします。

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

許可される MIME タイプ（現在）: `image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。
最大サイズ（現在）: 10MB。

## ファイル（`input_file`）

base64 または URL ソースをサポートします。

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

許可される MIME タイプ（現在）: `text/plain`、`text/markdown`、`text/html`、`text/csv`、
`application/json`、`application/pdf`。

最大サイズ（現在）: 5MB。

現在の挙動:

- ファイル内容はデコードされ、ユーザーメッセージではなく**システムプロンプト**に追加されます。
  そのため、これは一時的なままです（セッション履歴には永続化されません）。
- デコードされたファイルテキストは、追加される前に**信頼されない外部コンテンツ**としてラップされます。
  そのため、ファイルのバイト列は信頼された指示ではなくデータとして扱われます。
- 注入されるブロックは
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使用し、
  `Source: External` メタデータ行を含みます。
- このファイル input パスは、プロンプト予算を保つため、長い `SECURITY NOTICE:` バナーを意図的に省略します。
  境界マーカーとメタデータは引き続き保持されます。
- PDF はまずテキストとして解析されます。十分なテキストが見つからない場合は、最初の数ページが画像にラスタライズされてモデルに渡され、注入されるファイルブロックではプレースホルダー `[PDF content rendered to images]` が使用されます。

PDF 解析は同梱の `document-extract` Plugin によって提供されます。この Plugin は Node 向けの `pdfjs-dist` legacy ビルド（worker なし）を使用します。モダンな PDF.js ビルドはブラウザー worker/DOM グローバルを想定するため、Gateway では使用されません。

URL fetch のデフォルト:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8`（リクエストあたりの URL ベース `input_file` + `input_image` パーツの合計）
- リクエストはガードされます（DNS 解決、プライベート IP ブロック、リダイレクト上限、タイムアウト）。
- 任意のホスト名 allowlist は input タイプごとにサポートされます（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 完全一致ホスト: `"cdn.example.com"`
  - ワイルドカードサブドメイン: `"*.assets.example.com"`（apex には一致しません）
  - 空、または省略された allowlist は、ホスト名 allowlist 制限がないことを意味します。
- URL ベースの fetch を完全に無効にするには、`files.allowUrl: false` および/または `images.allowUrl: false` を設定します。

## ファイル + 画像の制限（config）

デフォルトは `gateway.http.endpoints.responses` 配下で調整できます。

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

省略時のデフォルト:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- HEIC/HEIF `input_image` ソースは受け付けられ、プロバイダーへ送信される前に JPEG へ正規化されます。

セキュリティ上の注意:

- URL allowlist は fetch 前とリダイレクトホップ時に適用されます。
- ホスト名を allowlist に含めても、プライベート/内部 IP ブロックは回避されません。
- インターネットに公開される Gateway では、アプリレベルのガードに加えてネットワーク egress 制御を適用してください。
  [セキュリティ](/ja-JP/gateway/security) を参照してください。

## ストリーミング（SSE）

Server-Sent Events（SSE）を受信するには `stream: true` を設定します。

- `Content-Type: text/event-stream`
- 各イベント行は `event: <type>` と `data: <json>` です
- ストリームは `data: [DONE]` で終了します

現在出力されるイベントタイプ:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed`（エラー時）

## 使用量

`usage` は、基盤プロバイダーがトークン数を報告した場合に設定されます。
OpenClaw は、それらのカウンターが downstream のステータス/セッションサーフェスに到達する前に、`input_tokens` / `output_tokens` や `prompt_tokens` / `completion_tokens` を含む一般的な OpenAI 形式のエイリアスを正規化します。

## エラー

エラーは次のような JSON オブジェクトを使用します。

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

一般的なケース:

- `401` 認証がない、または無効
- `400` リクエスト本文が無効
- `405` メソッドが間違っています

## 例

非ストリーミング:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

ストリーミング:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## 関連

- [OpenAI chat completions](/ja-JP/gateway/openai-http-api)
- [OpenAI](/ja-JP/providers/openai)
