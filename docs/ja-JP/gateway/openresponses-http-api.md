---
read_when:
    - OpenResponses APIを話すクライアントを統合する
    - itemベースの入力、クライアントツール呼び出し、またはSSEイベントが必要な場合
summary: GatewayからOpenResponses互換の `/v1/responses` HTTPエンドポイントを公開する
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-24T04:58:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73f2e075b78e5153633af17c3f59cace4516e5aaa88952d643cfafb9d0df8022
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API（HTTP）

OpenClawのGatewayは、OpenResponses互換の `POST /v1/responses` エンドポイントを提供できます。

このエンドポイントは**デフォルトで無効**です。まずconfigで有効化してください。

- `POST /v1/responses`
- Gatewayと同じポート（WS + HTTP多重化）: `http://<gateway-host>:<port>/v1/responses`

内部的には、リクエストは通常のGateway agent実行として処理されます（
`openclaw agent` と同じコードパス）ので、routing/permissions/configはGatewayと一致します。

## 認証、セキュリティ、ルーティング

運用上の動作は [OpenAI Chat Completions](/ja-JP/gateway/openai-http-api) と一致します:

- 対応するGateway HTTP auth pathを使います:
  - shared-secret auth（`gateway.auth.mode="token"` または `"password"`）: `Authorization: Bearer <token-or-password>`
  - trusted-proxy auth（`gateway.auth.mode="trusted-proxy"`）: 設定済みのnon-loopback trusted proxy sourceからのidentity-aware proxy header
  - private-ingress open auth（`gateway.auth.mode="none"`）: auth headerなし
- このエンドポイントは、そのgatewayインスタンスに対する完全なoperator accessとして扱ってください
- shared-secret auth mode（`token` と `password`）では、より狭いbearer宣言の `x-openclaw-scopes` 値は無視し、通常の完全なoperatorデフォルトへ戻します
- trustedなidentity-bearing HTTP mode（たとえばtrusted proxy authや `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在すればそれを尊重し、なければ通常のoperatorデフォルトscope setへフォールバックします
- agentの選択には `model: "openclaw"`、`model: "openclaw/default"`、`model: "openclaw/<agentId>"`、または `x-openclaw-agent-id` を使います
- 選択したagentのバックエンドmodelをoverrideしたい場合は `x-openclaw-model` を使います
- 明示的なsession routingには `x-openclaw-session-key` を使います
- デフォルト以外のsynthetic ingress channel contextが欲しい場合は `x-openclaw-message-channel` を使います

Authマトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有gateway operator secretの所持を証明します
  - より狭い `x-openclaw-scopes` は無視します
  - 完全なデフォルトoperator scope setを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上のchat turnをowner-sender turnとして扱います
- trustedなidentity-bearing HTTP mode（たとえばtrusted proxy authや、private ingress上の `gateway.auth.mode="none"`）
  - headerが存在する場合は `x-openclaw-scopes` を尊重します
  - headerがない場合は通常のoperatorデフォルトscope setへフォールバックします
  - callerが明示的にscopeを狭め、かつ `operator.admin` を省略した場合にのみowner semanticsを失います

このエンドポイントの有効/無効は `gateway.http.endpoints.responses.enabled` で切り替えます。

同じ互換サーフェスには次も含まれます:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

agent-target model、`openclaw/default`、embeddings pass-through、バックエンドmodel overrideの関係についての正規の説明は、[OpenAI Chat Completions](/ja-JP/gateway/openai-http-api#agent-first-model-contract) と [Model list and agent routing](/ja-JP/gateway/openai-http-api#model-list-and-agent-routing) を参照してください。

## セッション動作

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しいsession keyが生成されます）。

リクエストにOpenResponsesの `user` 文字列が含まれる場合、Gatewayはそこから安定したsession keyを導出するため、
繰り返し呼び出しで同じagent sessionを共有できます。

## リクエスト形状（サポート範囲）

リクエストはitemベースの入力を持つOpenResponses APIに従います。現在のサポート:

- `input`: 文字列またはitemオブジェクト配列。
- `instructions`: システムプロンプトにマージされます。
- `tools`: クライアントツール定義（function tool）。
- `tool_choice`: クライアントツールをフィルタまたは必須化します。
- `stream`: SSE Streamingを有効化します。
- `max_output_tokens`: ベストエフォートの出力制限（プロバイダー依存）。
- `user`: 安定したsession routing。

受理されるが**現在は無視される**もの:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

サポート済み:

- `previous_response_id`: リクエストが同じagent/user/requested-session scope内に留まる場合、OpenClawは以前のresponse sessionを再利用します。

## item（入力）

### `message`

role: `system`、`developer`、`user`、`assistant`。

- `system` と `developer` はシステムプロンプトに追記されます。
- 最新の `user` または `function_call_output` itemが「現在のメッセージ」になります。
- それ以前のuser/assistant messageは、コンテキスト用の履歴として含まれます。

### `function_call_output`（turnベースツール）

ツール結果をmodelへ送り返します:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` と `item_reference`

schema互換性のために受理されますが、プロンプト構築時には無視されます。

## ツール（クライアント側function tool）

`tools: [{ type: "function", function: { name, description?, parameters? } }]` でツールを提供します。

agentがツールを呼ぶと判断した場合、responseは `function_call` 出力itemを返します。
その後、turnを継続するには `function_call_output` を持つ後続リクエストを送ってください。

## 画像（`input_image`）

base64またはURL sourceをサポートします:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

許可されるMIME type（現在）: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`。
最大サイズ（現在）: 10MB。

## ファイル（`input_file`）

base64またはURL sourceをサポートします:

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

許可されるMIME type（現在）: `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`。

最大サイズ（現在）: 5MB。

現在の動作:

- ファイル内容はデコードされて**システムプロンプト**に追加され、ユーザーメッセージには入りません。
  これによりエフェメラルなまま保たれます（session履歴には永続化されません）。
- デコードされたファイルテキストは、追加前に**信頼されていない外部コンテンツ**としてラップされるため、
  ファイルのbytesは信頼されたinstructionではなくデータとして扱われます。
- 注入されるブロックは
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` のような明示的な境界マーカーを使い、
  `Source: External` メタデータ行を含みます。
- このファイル入力パスでは、プロンプト予算を保つために長い `SECURITY NOTICE:` バナーを意図的に省略します。
  それでも境界マーカーとメタデータは保持されます。
- PDFはまずテキスト解析されます。ほとんどテキストが見つからない場合、最初のページが
  画像にラスタライズされてmodelへ渡され、注入されるファイルブロックでは
  `[PDF content rendered to images]` プレースホルダーが使われます。

PDF解析には、Node向けの `pdfjs-dist` legacy build（workerなし）を使います。モダンな
PDF.js buildはbrowser worker/DOM globalsを期待するため、Gatewayでは使いません。

URL fetchのデフォルト:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8`（リクエストごとのURLベース `input_file` + `input_image` part合計）
- リクエストにはガードがあります（DNS解決、private IP blocking、redirect上限、timeout）。
- 入力タイプごとに任意のhostname allowlistをサポートします（`files.urlAllowlist`, `images.urlAllowlist`）。
  - 完全一致host: `"cdn.example.com"`
  - ワイルドカードsubdomain: `"*.assets.example.com"`（apexには一致しません）
  - allowlistが空または省略されている場合、hostname allowlist制限はありません。
- URLベースfetchを完全に無効化するには、`files.allowUrl: false` および/または `images.allowUrl: false` を設定してください。

## ファイル + 画像の上限（config）

デフォルトは `gateway.http.endpoints.responses` の下で調整できます:

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
- HEIC/HEIFの `input_image` sourceは受理され、プロバイダーへ渡す前にJPEGへ正規化されます。

セキュリティに関する注記:

- URL allowlistはfetch前とredirect hopごとに強制されます。
- hostnameをallowlist化しても、private/internal IP blockingは回避されません。
- インターネット公開gatewayでは、アプリレベルのガードに加えてネットワークegress制御も適用してください。
  [Security](/ja-JP/gateway/security) を参照してください。

## Streaming（SSE）

SSE（Server-Sent Events）を受け取るには `stream: true` を設定します:

- `Content-Type: text/event-stream`
- 各イベント行は `event: <type>` と `data: <json>`
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

## Usage

基盤となるプロバイダーがtoken数を報告する場合、`usage` が設定されます。
OpenClawは、これらのカウンターが下流のstatus/sessionサーフェスに届く前に、
一般的なOpenAIスタイルのaliasを正規化します。これには
`input_tokens` / `output_tokens`
および `prompt_tokens` / `completion_tokens`
が含まれます。

## エラー

エラーは次のようなJSONオブジェクトを使います:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

よくあるケース:

- `401` authなし/不正なauth
- `400` 不正なリクエストbody
- `405` 誤ったmethod

## 例

非Streaming:

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

Streaming:

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
