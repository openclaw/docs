---
read_when:
    - OpenResponses API に対応するクライアントの統合
    - 項目ベースの入力、クライアントツール呼び出し、または SSE イベントを使用したい場合
summary: Gateway から OpenResponses 互換の /v1/responses HTTP エンドポイントを公開する
title: OpenResponses API
x-i18n:
    generated_at: "2026-05-06T09:05:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw の Gateway は、OpenResponses 互換の `POST /v1/responses` エンドポイントを提供できます。

このエンドポイントは**デフォルトで無効**です。先に設定で有効化してください。

- `POST /v1/responses`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/v1/responses`

内部では、リクエストは通常の Gateway エージェント実行（`openclaw agent` と同じコードパス）として実行されるため、ルーティング/権限/設定は Gateway と一致します。

## 認証、セキュリティ、ルーティング

運用上の動作は [OpenAI Chat Completions](/ja-JP/gateway/openai-http-api) と一致します。

- 一致する Gateway HTTP 認証パスを使用します。
  - 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）: `Authorization: Bearer <token-or-password>`
  - 信頼済みプロキシ認証（`gateway.auth.mode="trusted-proxy"`）: 設定済みの信頼済みプロキシソースからの ID 対応プロキシヘッダー。同一ホストのループバックプロキシには明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です
  - プライベートイングレスのオープン認証（`gateway.auth.mode="none"`）: 認証ヘッダーなし
- このエンドポイントは Gateway インスタンスに対する完全なオペレーターアクセスとして扱います
- 共有シークレット認証モード（`token` と `password`）では、ベアラーで宣言されたより狭い `x-openclaw-scopes` 値を無視し、通常の完全なオペレーターデフォルトを復元します
- 信頼済み ID を含む HTTP モード（たとえば信頼済みプロキシ認証や `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合は通常のオペレーターデフォルトスコープセットにフォールバックします
- `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"`、または `x-openclaw-agent-id` でエージェントを選択します
- 選択されたエージェントのバックエンドモデルを上書きしたい場合は `x-openclaw-model` を使用します
- 明示的なセッションルーティングには `x-openclaw-session-key` を使用します
- デフォルトではない合成イングレスチャネルコンテキストが必要な場合は `x-openclaw-message-channel` を使用します

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway オペレーターシークレットの所有を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルトオペレータースコープセットを復元します:
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - このエンドポイントでのチャットターンを所有者送信者ターンとして扱います
- 信頼済み ID を含む HTTP モード（たとえば信頼済みプロキシ認証、またはプライベートイングレス上の `gateway.auth.mode="none"`）
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーがない場合は通常のオペレーターデフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、`operator.admin` を省略した場合にのみ所有者セマンティクスを失います

このエンドポイントは `gateway.http.endpoints.responses.enabled` で有効化または無効化します。

同じ互換サーフェスには次も含まれます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

エージェント対象モデル、`openclaw/default`、埋め込みのパススルー、バックエンドモデル上書きがどのように組み合わさるかの標準的な説明については、[OpenAI Chat Completions](/ja-JP/gateway/openai-http-api#agent-first-model-contract) と [モデル一覧とエージェントルーティング](/ja-JP/gateway/openai-http-api#model-list-and-agent-routing) を参照してください。

## セッション動作

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しいセッションキーが生成されます）。

リクエストに OpenResponses の `user` 文字列が含まれる場合、Gateway はそこから安定したセッションキーを導出するため、繰り返しの呼び出しでエージェントセッションを共有できます。

## リクエスト形状（サポート対象）

リクエストは、項目ベースの入力を持つ OpenResponses API に従います。現在のサポート:

- `input`: 文字列または項目オブジェクトの配列。
- `instructions`: システムプロンプトにマージされます。
- `tools`: クライアントツール定義（関数ツール）。
- `tool_choice`: クライアントツールをフィルタリングまたは必須化します。
- `stream`: SSE ストリーミングを有効化します。
- `max_output_tokens`: ベストエフォートの出力制限（プロバイダー依存）。
- `user`: 安定したセッションルーティング。

受け付けますが、**現在は無視**されます。

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

サポート対象:

- `previous_response_id`: リクエストが同じエージェント/ユーザー/要求セッションスコープ内に留まる場合、OpenClaw は以前のレスポンスセッションを再利用します。

## 項目（入力）

### `message`

ロール: `system`、`developer`、`user`、`assistant`。

- `system` と `developer` はシステムプロンプトに追加されます。
- 最新の `user` または `function_call_output` 項目が「現在のメッセージ」になります。
- 以前のユーザー/アシスタントメッセージは、コンテキスト用の履歴として含まれます。

### `function_call_output`（ターンベースのツール）

ツール結果をモデルへ返します。

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` と `item_reference`

スキーマ互換性のため受け付けますが、プロンプト作成時には無視されます。

## ツール（クライアント側関数ツール）

`tools: [{ type: "function", function: { name, description?, parameters? } }]` でツールを指定します。

エージェントがツール呼び出しを決定した場合、レスポンスは `function_call` 出力項目を返します。
その後、ターンを続行するために `function_call_output` を含むフォローアップリクエストを送信します。

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

現在の動作:

- ファイル内容はデコードされ、ユーザーメッセージではなく**システムプロンプト**に追加されます。そのため一時的なままです（セッション履歴に永続化されません）。
- デコードされたファイルテキストは、追加前に**信頼されていない外部コンテンツ**としてラップされるため、ファイルのバイト列は信頼済み命令ではなくデータとして扱われます。
- 挿入されるブロックは
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使用し、
  `Source: External` メタデータ行を含みます。
- このファイル入力パスでは、プロンプト予算を維持するため、長い `SECURITY NOTICE:` バナーを意図的に省略します。ただし境界マーカーとメタデータは引き続き保持されます。
- PDF はまずテキストとして解析されます。十分なテキストが見つからない場合、最初のページが画像にラスタライズされてモデルへ渡され、挿入されるファイルブロックにはプレースホルダー `[PDF content rendered to images]` が使用されます。

PDF 解析は、バンドルされた `document-extract` Plugin によって提供されます。この Plugin は Node に適した `pdfjs-dist` レガシービルド（ワーカーなし）を使用します。最新の PDF.js ビルドはブラウザワーカー/DOM グローバルを想定しているため、Gateway では使用されません。

URL フェッチのデフォルト:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8`（リクエストあたりの URL ベースの `input_file` + `input_image` パーツ合計）
- リクエストはガードされます（DNS 解決、プライベート IP ブロック、リダイレクト上限、タイムアウト）。
- 入力タイプごとに任意のホスト名許可リストがサポートされます（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 完全一致ホスト: `"cdn.example.com"`
  - ワイルドカードサブドメイン: `"*.assets.example.com"`（apex には一致しません）
  - 空または省略された許可リストは、ホスト名許可リスト制限がないことを意味します。
- URL ベースのフェッチを完全に無効化するには、`files.allowUrl: false` および/または `images.allowUrl: false` を設定します。

## ファイル + 画像の制限（設定）

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
- HEIC/HEIF の `input_image` ソースは受け付けられ、プロバイダーへの配信前に JPEG へ正規化されます。

セキュリティメモ:

- URL 許可リストは、フェッチ前およびリダイレクトホップで強制されます。
- ホスト名を許可リストに追加しても、プライベート/内部 IP ブロックはバイパスされません。
- インターネットに公開された Gateway では、アプリレベルのガードに加えてネットワークの外向き通信制御を適用してください。
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

基盤となるプロバイダーがトークン数を報告する場合、`usage` が設定されます。
OpenClaw は、それらのカウンターが下流のステータス/セッションサーフェスへ到達する前に、`input_tokens` / `output_tokens` や `prompt_tokens` / `completion_tokens` などの一般的な OpenAI 形式のエイリアスを正規化します。

## エラー

エラーは次のような JSON オブジェクトを使用します。

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

一般的なケース:

- `401` 認証がない、または無効
- `400` リクエスト本文が無効
- `405` メソッドが誤っている

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
