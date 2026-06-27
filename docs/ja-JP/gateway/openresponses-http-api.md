---
read_when:
    - OpenResponses API を話すクライアントの統合
    - 項目ベースの入力、クライアントツール呼び出し、または SSE イベントが必要な場合
summary: Gateway から OpenResponses 互換の /v1/responses HTTP エンドポイントを公開する
title: OpenResponses API
x-i18n:
    generated_at: "2026-06-27T11:31:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClawのGatewayは、OpenResponses互換の`POST /v1/responses`エンドポイントを提供できます。

このエンドポイントは**デフォルトで無効**です。まず設定で有効にしてください。

- `POST /v1/responses`
- Gatewayと同じポート（WS + HTTP多重化）: `http://<gateway-host>:<port>/v1/responses`

内部では、リクエストは通常のGatewayエージェント実行（`openclaw agent`と同じコードパス）として実行されるため、ルーティング/権限/設定はGatewayと一致します。

## 認証、セキュリティ、ルーティング

運用上の動作は[OpenAI Chat Completions](/ja-JP/gateway/openai-http-api)と一致します。

- 対応するGateway HTTP認証パスを使用します。
  - 共有シークレット認証（`gateway.auth.mode="token"`または`"password"`）: `Authorization: Bearer <token-or-password>`
  - 信頼済みプロキシ認証（`gateway.auth.mode="trusted-proxy"`）: 設定済みの信頼済みプロキシ送信元からのID対応プロキシヘッダー。同一ホストのループバックプロキシには明示的な`gateway.auth.trustedProxy.allowLoopback = true`が必要です
  - 信頼済みプロキシのローカル直接フォールバック: `Forwarded`、`X-Forwarded-*`、`X-Real-IP`ヘッダーがない同一ホストの呼び出し元は、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`を使用できます
  - プライベートイングレスのオープン認証（`gateway.auth.mode="none"`）: 認証ヘッダーなし
- このエンドポイントをGatewayインスタンスに対する完全なオペレーターアクセスとして扱います
- 共有シークレット認証モード（`token`および`password`）では、より狭いBearer宣言の`x-openclaw-scopes`値を無視し、通常の完全なオペレーターデフォルトを復元します
- 信頼済みIDを持つHTTPモード（たとえば信頼済みプロキシ認証や`gateway.auth.mode="none"`）では、`x-openclaw-scopes`が存在する場合はそれを尊重し、存在しない場合は通常のオペレーターデフォルトスコープセットにフォールバックします
- `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"`、または`x-openclaw-agent-id`でエージェントを選択します
- 選択したエージェントのバックエンドモデルを上書きしたい場合は、`x-openclaw-model`を使用します
- 明示的なセッションルーティングには`x-openclaw-session-key`を使用します
- デフォルト以外の合成イングレスチャネルコンテキストが必要な場合は、`x-openclaw-message-channel`を使用します

認証マトリクス:

- `gateway.auth.mode="token"`または`"password"` + `Authorization: Bearer ...`
  - 共有Gatewayオペレーターシークレットの所持を証明します
  - より狭い`x-openclaw-scopes`を無視します
  - 完全なデフォルトオペレータースコープセットを復元します:
    `operator.admin`、`operator.approvals`、`operator.pairing`、
    `operator.read`、`operator.talk.secrets`、`operator.write`
  - このエンドポイント上のチャットターンを所有者送信者ターンとして扱います
- 信頼済みIDを持つHTTPモード（たとえば信頼済みプロキシ認証、またはプライベートイングレス上の`gateway.auth.mode="none"`）
  - ヘッダーが存在する場合は`x-openclaw-scopes`を尊重します
  - ヘッダーがない場合は通常のオペレーターデフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、`operator.admin`を省略した場合にのみ所有者セマンティクスを失います

このエンドポイントは`gateway.http.endpoints.responses.enabled`で有効または無効にします。

同じ互換性サーフェスには、以下も含まれます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

エージェントターゲットモデル、`openclaw/default`、埋め込みのパススルー、バックエンドモデルの上書きがどのように組み合わさるかの標準的な説明については、[OpenAI Chat Completions](/ja-JP/gateway/openai-http-api#agent-first-model-contract)および[モデル一覧とエージェントルーティング](/ja-JP/gateway/openai-http-api#model-list-and-agent-routing)を参照してください。

## セッション動作

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しいセッションキーが生成されます）。

リクエストにOpenResponsesの`user`文字列が含まれている場合、Gatewayはそこから安定したセッションキーを導出するため、繰り返し呼び出しでエージェントセッションを共有できます。

## リクエスト形式（対応）

リクエストは、項目ベースの入力を持つOpenResponses APIに従います。現在の対応範囲:

- `input`: 文字列、または項目オブジェクトの配列。
- `instructions`: システムプロンプトにマージされます。
- `tools`: クライアントツール定義（関数ツール）。
- `tool_choice`: クライアントツールを絞り込む、または必須にするための`"auto"`、`"none"`、`"required"`、または`{ "type": "function", "name": "..." }`。
- `stream`: SSEストリーミングを有効にします。
- `max_output_tokens`: ベストエフォートの出力制限（プロバイダー依存）。
- `temperature`: プロバイダーに転送されるベストエフォートのサンプリング温度。固定のサーバー側サンプリングを使用するChatGPTベースのCodex Responsesバックエンドでは無視されます。
- `top_p`: プロバイダーに転送されるベストエフォートのニュークリアスサンプリング。`temperature`と同じCodex Responsesの注意事項があります。
- `user`: 安定したセッションルーティング。

受け付けますが、**現在は無視されます**。

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

対応:

- `previous_response_id`: リクエストが同じエージェント/ユーザー/要求セッションのスコープ内に留まる場合、OpenClawは以前のレスポンスセッションを再利用します。

## 項目（入力）

### `message`

ロール: `system`、`developer`、`user`、`assistant`。

- `system`と`developer`はシステムプロンプトに追加されます。
- 最新の`user`または`function_call_output`項目が「現在のメッセージ」になります。
- それ以前のユーザー/アシスタントメッセージは、コンテキスト用の履歴として含まれます。

### `function_call_output`（ターンベースのツール）

ツール結果をモデルに返します。

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning`および`item_reference`

スキーマ互換性のために受け付けますが、プロンプト構築時には無視されます。

## ツール（クライアント側関数ツール）

`tools: [{ type: "function", name, description?, parameters? }]`でツールを提供します。

エージェントがツールを呼び出すと判断した場合、レスポンスは`function_call`出力項目を返します。その後、ターンを継続するために`function_call_output`を含むフォローアップリクエストを送信します。

`tool_choice: "required"`および関数固定の`tool_choice`では、エンドポイントは公開されるクライアント関数ツールセットを絞り込み、レスポンス前にクライアントツールを呼び出すようランタイムに指示し、一致する構造化クライアントツール呼び出しが含まれていない場合はターンを拒否します。この契約は、呼び出し元が指定したHTTP `tools`リストに適用され、すべての内部OpenClawエージェントツールには適用されません。非ストリーミングリクエストは`api_error`付きの`502`を返し、ストリーミングリクエストは`response.failed`イベントを発行します。これは`/v1/chat/completions`の契約と一致します。

## 画像 (`input_image`)

base64 または URL ソースをサポートします。

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

許可される MIME タイプ（現在）: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`。
最大サイズ（現在）: 10MB。

## ファイル (`input_file`)

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

許可される MIME タイプ（現在）: `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`。

最大サイズ（現在）: 5MB。

現在の動作:

- ファイル内容はデコードされ、ユーザーメッセージではなく **system prompt** に追加されるため、
  一時的なままになります（セッション履歴には永続化されません）。
- デコードされたファイルテキストは、追加される前に **信頼されていない外部コンテンツ** としてラップされるため、
  ファイルバイトは信頼済み命令ではなくデータとして扱われます。
- 挿入されるブロックは
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使い、
  `Source: External` メタデータ行を含みます。
- このファイル入力パスでは、プロンプト予算を保つため、長い `SECURITY NOTICE:` バナーを意図的に省略します。
  境界マーカーとメタデータは引き続き維持されます。
- PDF はまずテキストとして解析されます。テキストがほとんど見つからない場合、最初のページが
  画像にラスタライズされてモデルに渡され、挿入されるファイルブロックには
  プレースホルダー `[PDF content rendered to images]` が使われます。

PDF 解析は同梱の `document-extract` Plugin によって提供されます。この Plugin は
テキスト抽出とページレンダリングに `clawpdf` と、そのパッケージ化された PDFium WebAssembly ランタイムを使用します。

URL フェッチのデフォルト:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8`（リクエストあたりの URL ベースの `input_file` + `input_image` パーツ合計）
- リクエストは保護されます（DNS 解決、プライベート IP ブロック、リダイレクト上限、タイムアウト）。
- 任意のホスト名許可リストが入力タイプごとにサポートされます（`files.urlAllowlist`, `images.urlAllowlist`）。
  - 完全一致ホスト: `"cdn.example.com"`
  - ワイルドカードサブドメイン: `"*.assets.example.com"`（apex には一致しません）
  - 空または省略された許可リストは、ホスト名許可リスト制限がないことを意味します。
- URL ベースのフェッチを完全に無効化するには、`files.allowUrl: false` および/または `images.allowUrl: false` を設定します。

## ファイル + 画像の制限（設定）

デフォルトは `gateway.http.endpoints.responses` の下で調整できます。

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
- HEIC/HEIF `input_image` ソースは、システムコンバーターが利用可能な場合に受け付けられ、プロバイダーへ渡される前に JPEG に正規化されます。サポートされるコンバーターは macOS `sips`、ImageMagick、GraphicsMagick、または ffmpeg です。

セキュリティ注記:

- URL 許可リストは、フェッチ前とリダイレクトホップ時に適用されます。
- ホスト名を許可リストに入れても、プライベート/内部 IP ブロックはバイパスされません。
- インターネットに公開された Gateway では、アプリレベルのガードに加えてネットワーク送信制御を適用してください。
  [セキュリティ](/ja-JP/gateway/security) を参照してください。

## ストリーミング (SSE)

Server-Sent Events (SSE) を受信するには `stream: true` を設定します。

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
OpenClaw は、それらのカウンターが下流のステータス/セッション面に到達する前に、
`input_tokens` / `output_tokens` や `prompt_tokens` / `completion_tokens` を含む
一般的な OpenAI スタイルのエイリアスを正規化します。

## エラー

エラーは次のような JSON オブジェクトを使用します。

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

一般的なケース:

- `401` 認証がない/無効
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

- [OpenAI チャット補完](/ja-JP/gateway/openai-http-api)
- [OpenAI](/ja-JP/providers/openai)
