---
read_when:
    - OpenResponses API に対応するクライアントの統合
    - アイテムベースの入力、クライアントツール呼び出し、または SSE イベントを使いたい
summary: Gateway から OpenResponses 互換の /v1/responses HTTP エンドポイントを公開する
title: OpenResponses API
x-i18n:
    generated_at: "2026-07-05T11:25:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway は OpenResponses 互換の `POST /v1/responses` エンドポイントを提供できます。これは**デフォルトで無効**で、Gateway とポートを共有します（WS + HTTP 多重化）: `http://<gateway-host>:<port>/v1/responses`。

リクエストは通常の Gateway エージェント実行（`openclaw agent` と同じコードパス）として実行されるため、ルーティング、権限、設定は Gateway と一致します。

`gateway.http.endpoints.responses.enabled` で有効化または無効化します。有効にすると、同じ互換サーフェスで `GET /v1/models`、`GET /v1/models/{id}`、`POST /v1/embeddings`、`POST /v1/chat/completions` も提供されます。

## 認証、セキュリティ、ルーティング

運用上の挙動は [OpenAI Chat Completions](/ja-JP/gateway/openai-http-api) と一致します。

- 認証パスは `gateway.auth.mode` と一致します。shared-secret（`token`/`password`）は `Authorization: Bearer <token-or-password>` を使用します。trusted-proxy は ID 対応プロキシヘッダーを使用します（同一ホストのループバックプロキシには `gateway.auth.trustedProxy.allowLoopback = true` が必要で、`Forwarded`/`X-Forwarded-*`/`X-Real-IP` ヘッダーが存在しない場合は `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` による同一ホスト直接フォールバックがあります）。プライベート ingress 上の `none` は認証ヘッダーを必要としません。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください。
- このエンドポイントは、Gateway インスタンスへの完全なオペレーターアクセスとして扱ってください。
- shared-secret 認証モードは、より狭い bearer 宣言の `x-openclaw-scopes` を無視し、完全なデフォルトオペレータースコープセットを復元します: `operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`。このエンドポイント上のチャットターンは、所有者送信者ターンとして扱われます。
- 信頼済み ID を持つ HTTP モード（trusted-proxy、または `gateway.auth.mode="none"`）は、存在する場合は `x-openclaw-scopes` を尊重し、それ以外の場合はオペレーターのデフォルトスコープセットにフォールバックします。呼び出し元が明示的にスコープを狭め、`operator.admin` を省略した場合にのみ、所有者セマンティクスは失われます。
- `model: "openclaw"`、`"openclaw/default"`、`"openclaw/<agentId>"`、または `x-openclaw-agent-id` ヘッダーでエージェントを選択します。
- `x-openclaw-model` を使用して、選択したエージェントのバックエンドモデルを上書きします（ID を持つ認証パスでは `operator.admin` が必要です）。
- 明示的なセッションルーティングには `x-openclaw-session-key` を使用します（予約済み名前空間 `subagent:`、`cron:`、`acp:` を使用している場合は `400 invalid_request_error` で拒否されます）。
- デフォルト以外の合成 ingress チャンネルコンテキストには `x-openclaw-message-channel` を使用します。

エージェント対象モデル、`openclaw/default`、embeddings パススルー、バックエンドモデル上書きの標準的な説明については、[OpenAI Chat Completions](/ja-JP/gateway/openai-http-api#agent-first-model-contract) を参照してください。

[オペレータースコープ](/ja-JP/gateway/operator-scopes)と[セキュリティ](/ja-JP/gateway/security)を参照してください。

## セッションの挙動

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（各呼び出しで新しいセッションキーが生成されます）。

リクエストに OpenResponses の `user` 文字列が含まれている場合、Gateway はそこから安定したセッションキーを導出するため、繰り返し呼び出しでエージェントセッションを共有できます。

`previous_response_id` は、リクエストが同じエージェント/ユーザー/要求セッションスコープ内に留まる場合、以前のレスポンスのセッションを再利用します（認証サブジェクト、エージェント ID、`x-openclaw-session-key` で照合されます）。

## リクエスト形状

| フィールド                                                       | サポート                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | 文字列、または項目オブジェクトの配列。                                                                                          |
| `instructions`                                                   | システムプロンプトにマージされます。                                                                                            |
| `tools`                                                          | クライアントツール定義（function tools）。                                                                                      |
| `tool_choice`                                                    | クライアントツールをフィルターまたは必須にするための `"auto"`、`"none"`、`"required"`、または `{ "type": "function", "name": "..." }`。 |
| `stream`                                                         | SSE ストリーミングを有効にします。                                                                                              |
| `max_output_tokens`                                              | ベストエフォートの出力制限（プロバイダー依存）。                                                                                 |
| `temperature`                                                    | ベストエフォートのサンプリング温度。ChatGPT ベースの Codex Responses バックエンドでは無視され、固定のサーバー側サンプリングが使用されます。 |
| `top_p`                                                          | ベストエフォートの nucleus sampling。`temperature` と同じ Codex Responses の注意事項が適用されます。                            |
| `user`                                                           | 安定したセッションルーティング。                                                                                                |
| `previous_response_id`                                           | セッション継続性（上記を参照）。                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | 受け付けられますが、現在は無視されます。                                                                                        |

## 項目（入力）

### `message`

ロール: `system`、`developer`、`user`、`assistant`。

- `system` と `developer` はシステムプロンプトに追加されます。
- 最新の `user` または `function_call_output` 項目が「現在のメッセージ」になります。
- それ以前の user/assistant メッセージは、コンテキスト用の履歴として含まれます。

### `function_call_output`（ターンベースツール）

ツール結果をモデルに返します。

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` と `item_reference`

スキーマ互換性のため受け付けられますが、プロンプト構築時には無視されます。

## ツール（クライアント側 function tools）

`tools: [{ type: "function", name, description?, parameters? }]` でツールを指定します。

エージェントがツールを呼び出すと、レスポンスは `function_call` 出力項目を返します。ターンを続行するには、`function_call_output` を含むフォローアップリクエストを送信します。

`tool_choice: "required"` と function 固定の `tool_choice` では、エンドポイントは公開されるクライアント function-tool セットを狭め、レスポンス前にクライアントツールを呼び出すようランタイムに指示し、一致する構造化クライアントツール呼び出しが含まれていない場合はターンを拒否します。これは `/v1/chat/completions` コントラクトと一致します。非ストリーミングリクエストは `api_error` を伴う `502` を返し、ストリーミングリクエストは `response.failed` イベントを発行します。

## 画像（`input_image`）

base64 または URL ソースをサポートします。

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

許可される MIME タイプ（デフォルト）: `image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。最大サイズ（デフォルト）: 10MB。

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

許可される MIME タイプ（デフォルト）: `text/plain`、`text/markdown`、`text/html`、`text/csv`、`application/json`、`application/pdf`。最大サイズ（デフォルト）: 5MB。

現在の挙動:

- ファイル内容はデコードされ、ユーザーメッセージではなく**システムプロンプト**に追加されるため、一時的なままです（セッション履歴には永続化されません）。
- デコードされたファイルテキストは、追加前に**信頼されない外部コンテンツ**としてラップされるため、ファイルバイトは信頼済み命令ではなくデータとして扱われます。挿入されるブロックは明示的な境界マーカー（`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`）と `Source: External` メタデータ行を使用します。プロンプト予算を保つため、長い `SECURITY NOTICE:` バナーは意図的に省略されますが、境界マーカーとメタデータは引き続き適用されます。
- PDF はまずテキスト解析されます。テキストがほとんど見つからない場合、最初のページが画像にラスタライズされてモデルに渡され、挿入されるファイルブロックはプレースホルダー `[PDF content rendered to images]` を使用します。

PDF 解析は、同梱の `document-extract` Plugin によって提供されます。この Plugin は、テキスト抽出とページレンダリングに `clawpdf` とその同梱 PDFium WebAssembly ランタイムを使用します。

URL フェッチのデフォルト:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8`（リクエストごとの URL ベースの `input_file` + `input_image` パート合計）
- リクエストは保護されます（DNS 解決、プライベート IP ブロック、リダイレクト上限、タイムアウト）。
- 任意のホスト名許可リストは入力タイプごとにサポートされます（`files.urlAllowlist`、`images.urlAllowlist`）: 完全一致ホスト（`"cdn.example.com"`）またはワイルドカードサブドメイン（`"*.assets.example.com"`、apex には一致しません）。空または省略された許可リストは、ホスト名許可リスト制限がないことを意味します。
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
            maxChars: 60000,
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

| キー                     | デフォルト |
| ------------------------ | ---------- |
| `maxBodyBytes`           | 20MB       |
| `maxUrlParts`            | 8          |
| `files.maxBytes`         | 5MB        |
| `files.maxChars`         | 60k        |
| `files.maxRedirects`     | 3          |
| `files.timeoutMs`        | 10s        |
| `files.pdf.maxPages`     | 4          |
| `files.pdf.maxPixels`    | 4,000,000  |
| `files.pdf.minTextChars` | 200        |
| `images.maxBytes`        | 10MB       |
| `images.maxRedirects`    | 3          |
| `images.timeoutMs`       | 10s        |

HEIC/HEIF の `input_image` ソースは、共有 OpenClaw 画像プロセッサー（Rastermill）を通じて、プロバイダー配信前に JPEG に正規化されます。外部コーデックサポートが必要な形式では、システムコンバーター（`sips`、ImageMagick、GraphicsMagick、または ffmpeg）にフォールバックします。

セキュリティ注記: URL 許可リストは、フェッチ前およびリダイレクトホップ時に適用されます。ホスト名を許可リストに入れても、プライベート/内部 IP ブロックはバイパスされません。インターネットに公開された Gateway では、アプリレベルのガードに加えてネットワーク egress 制御を適用してください。[セキュリティ](/ja-JP/gateway/security)を参照してください。

## ストリーミング（SSE）

Server-Sent Events を受信するには `stream: true` を設定します。

- `Content-Type: text/event-stream`
- 各イベント行は `event: <type>` と `data: <json>` です
- ストリームは `data: [DONE]` で終了します

現在発行されるイベントタイプ: `response.created`、`response.in_progress`、`response.output_item.added`、`response.content_part.added`、`response.output_text.delta`、`response.output_text.done`、`response.content_part.done`、`response.output_item.done`、`response.completed`、`response.failed` (エラー時)。

## 使用方法

`usage` は、基盤となるプロバイダーがトークン数を報告したときに設定されます。OpenClaw は、これらのカウンターが下流のステータス/セッションサーフェスに到達する前に、`input_tokens` / `output_tokens` や `prompt_tokens` / `completion_tokens` を含む、一般的な OpenAI 形式のエイリアスを正規化します。

## エラー

エラーは次のような JSON オブジェクトを使用します。

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

一般的なケース: `400` 無効なリクエスト本文、`401` 認証の欠落/無効、`403` オペレータースコープの欠落、`405` 誤ったメソッド、`429` 認証失敗の試行回数が多すぎる (`Retry-After` 付き)。

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
- [オペレータースコープ](/ja-JP/gateway/operator-scopes)
- [OpenAI](/ja-JP/providers/openai)
