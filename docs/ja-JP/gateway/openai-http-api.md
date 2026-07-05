---
read_when:
    - OpenAI Chat Completions を想定するツールの統合
summary: Gateway から OpenAI 互換の /v1/chat/completions HTTP エンドポイントを公開する
title: OpenAI チャット補完
x-i18n:
    generated_at: "2026-07-05T11:22:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway は小さな OpenAI 互換の Chat Completions サーフェスを提供できます。これは**デフォルトで無効**です。

有効にすると、Gateway と同じポートでこれらすべてを提供します (WS + HTTP 多重化):

| メソッド | パス                   |
| -------- | ---------------------- |
| POST     | `/v1/chat/completions` |
| GET      | `/v1/models`           |
| GET      | `/v1/models/{id}`      |
| POST     | `/v1/embeddings`       |
| POST     | `/v1/responses`        |

リクエストは通常の Gateway エージェント実行 (`openclaw agent` と同じコードパス) として実行されるため、ルーティング、権限、設定は Gateway と一致します。

## エンドポイントの有効化

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

無効にするには `enabled: false` を設定します (または省略します)。

## セキュリティ境界 (重要)

このエンドポイントは、Gateway インスタンスへの**完全なオペレーターアクセス**として扱ってください。

- このエンドポイントの有効な Gateway トークン/パスワードは、狭いユーザー単位のスコープではなく、所有者/オペレーターの認証情報と同等です。
- リクエストは信頼済みオペレーター操作と同じコントロールプレーンのエージェントパスを通るため、対象エージェントのポリシーが機密性の高いツールを許可している場合、このエンドポイントもそれらを使用できます。
- loopback/tailnet/プライベートイングレスのみに限定してください。公開インターネットには公開しないでください。

認証マトリクス:

| 認証パス                                                                                             | 動作                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`                        | 共有 Gateway シークレットの所持を証明します。`x-openclaw-scopes` ヘッダーはすべて無視し、完全なデフォルトのオペレータースコープセット `operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write` を復元します。チャットターンを所有者送信者のターンとして扱います。 |
| 信頼済み ID 付き HTTP (trusted-proxy 認証、またはプライベートイングレス上の `gateway.auth.mode="none"`) | `x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合はデフォルトのオペレータースコープセットにフォールバックします。呼び出し元が明示的にスコープを狭め、`operator.admin` を省略した場合にのみ、所有者セマンティクスを失います。`x-openclaw-model` などの所有者レベルの制御には `operator.admin` が必要です。                 |

[オペレータースコープ](/ja-JP/gateway/operator-scopes)、[セキュリティ](/ja-JP/gateway/security)、[リモートアクセス](/ja-JP/gateway/remote)を参照してください。

## 認証

Gateway の認証設定を使用します (そのモードの詳細は [Trusted proxy 認証](/ja-JP/gateway/trusted-proxy-auth) を参照):

| モード                              | 認証方法                                                                                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`。`gateway.auth.token` または `OPENCLAW_GATEWAY_TOKEN` で設定します。                                                                                     |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`。`gateway.auth.password` または `OPENCLAW_GATEWAY_PASSWORD` で設定します。                                                                            |
| `gateway.auth.mode="trusted-proxy"` | 設定済みの ID 対応プロキシ経由でルーティングします。必要な ID ヘッダーはプロキシが注入します。同一ホストの loopback プロキシには明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。 |
| `gateway.auth.mode="none"`          | 認証ヘッダーは不要です (プライベートイングレスのみ)。                                                                                                                                     |

注:

- `trusted-proxy` Gateway でプロキシをバイパスする同一ホストの呼び出し元は、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` に直接フォールバックできます。`Forwarded`、`X-Forwarded-*`、または `X-Real-IP` ヘッダーの証拠がある場合は、代わりにリクエストは trusted-proxy パスに留まります。
- `gateway.auth.rateLimit` が設定され、認証試行の失敗が多すぎる場合、エンドポイントは `Retry-After` ヘッダー付きで `429` を返します。

## このエンドポイントを使う場合

- 統合が同じ Gateway に対する別のオペレーター/クライアントサーフェスにすぎない場合は、新しい組み込みチャネルを追加するよりもこちらを優先してください。
- リモート Gateway に直接接続するネイティブモバイルクライアントでは、共有 HTTP トークン/パスワードをデバイスに持たせずに済むよう、ペア済みデバイスのブートストラップ/デバイストークンフローを備えた [WebChat](/ja-JP/web/webchat) または [Gateway Protocol](/ja-JP/gateway/protocol) を優先してください。
- 独自のユーザー、ルーム、Webhook 配信、または送信トランスポートを持つ外部メッセージングネットワークと統合する場合は、代わりにチャネル Plugin を構築してください。[Plugin の構築](/ja-JP/plugins/building-plugins)を参照してください。

## エージェント優先のモデル契約

OpenClaw は OpenAI の `model` フィールドを、生のプロバイダーモデル ID ではなく**エージェントターゲット**として扱います。

| `model` 値                                 | ルーティング先                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                 | 設定済みのデフォルトエージェント                                                                                         |
| `openclaw/default`                         | 設定済みのデフォルトエージェント (安定エイリアス。実際のデフォルトエージェント ID が環境間で変わってもハードコードして安全) |
| `openclaw/<agentId>` または `openclaw:<agentId>` | 特定のエージェント                                                                                                       |
| `agent:<agentId>`                          | 特定のエージェント (互換性エイリアス)                                                                                     |

任意のリクエストヘッダー:

| ヘッダー                                        | 効果                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | 選択されたエージェントのバックエンドモデルを上書きします。共有シークレットの bearer 呼び出し元はこれを直接使用できます。ID 付き呼び出し元 (trusted-proxy、または `x-openclaw-scopes` 付きのプライベート no-auth イングレス) は `operator.admin` が必要で、そうでない場合は `403 missing scope: operator.admin` になります。 |
| `x-openclaw-agent-id: <agentId>`                | エージェント選択の互換性上書きです。                                                                                                                                                                                                                                      |
| `x-openclaw-session-key: <sessionKey>`          | 明示的なセッションルーティングです。予約済みの内部名前空間 (`subagent:`、`cron:`、`acp:`) を使用すると、`400 invalid_request_error` で拒否されます。                                                                                                                        |
| `x-openclaw-message-channel: <channel>`         | チャネル対応のプロンプト/ポリシー向けに、合成イングレスチャネルコンテキストを設定します。                                                                                                                                                                                   |

`/v1/models` はトップレベルのエージェントターゲット (`openclaw`、`openclaw/default`、`openclaw/<agentId>`) を一覧表示します。バックエンドプロバイダーモデルやサブエージェントは一覧表示しません。サブエージェントは内部の実行トポロジーに留まります。`x-openclaw-model` を省略すると、選択されたエージェントは通常の設定済みモデルで実行されます。

`/v1/embeddings` は同じエージェントターゲットの `model` ID を使用します。特定の埋め込みモデルを選ぶには、`x-openclaw-model` を送信します (共有シークレットの呼び出し元、または `operator.admin` を持つ ID 付き呼び出し元から)。それ以外の場合、リクエストは選択されたエージェントの通常の埋め込み設定を使用します。

## セッション動作

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です (呼び出しごとに新しいセッションキーが生成されます)。

リクエストに OpenAI の `user` 文字列が含まれている場合、Gateway はそこから安定したセッションキーを導出するため、繰り返しの呼び出しでエージェントセッションを共有できます。カスタムアプリでは、会話スレッドごとに同じ `user` 値を再利用してください。複数の会話/デバイスで 1 つの OpenClaw セッションを共有したい場合を除き、アカウントレベルの識別子は避けてください。複数のクライアント/スレッドをまたいで明示的なルーティング制御が必要な場合にのみ、上記の予約済み名前空間を避けたアプリケーション所有のキーで `x-openclaw-session-key` を使用してください。

## リクエスト制限 (設定)

デフォルトは `gateway.http.endpoints.chatCompletions` 配下で調整できます。

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
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

| キー                  | デフォルト                                                                  |
| --------------------- | --------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20MB                                                                        |
| `maxImageParts`       | 8 (最新のユーザーメッセージから読み取る `image_url` パーツの最大数)          |
| `maxTotalImageBytes`  | 20MB (1 つのリクエスト内のすべての `image_url` パーツにまたがる累積デコード済みバイト数) |
| `images.allowUrl`     | `false` (URL 由来の `image_url` パーツは、有効化されていない限り拒否されます) |
| `images.maxBytes`     | 画像ごとに 10MB                                                             |
| `images.maxRedirects` | 3                                                                           |
| `images.timeoutMs`    | 10s                                                                         |

HEIC/HEIF の `image_url` ソースは受け入れられ、共有 OpenClaw 画像プロセッサー (Rastermill) を通じたプロバイダー配信の前に JPEG へ正規化されます。外部コーデックサポートが必要な形式では、システムコンバーター (`sips`、ImageMagick、GraphicsMagick、または ffmpeg) にフォールバックします。

セキュリティ上の注意: ホスト名を許可リストに入れても、プライベート/内部 IP のブロックは回避されません。インターネットに公開されたゲートウェイでは、アプリレベルのガードに加えてネットワークの送信制御を適用してください。[セキュリティ](/ja-JP/gateway/security)を参照してください。

## Chat ツール契約

`/v1/chat/completions` は、一般的な OpenAI Chat クライアントと互換性のある function-tool サブセットをサポートします。

### サポートされるリクエストフィールド

| フィールド                 | 注記                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | `{ "type": "function", "function": { ... } }` の配列                                                                                                                |
| `tool_choice`              | `"auto"`、`"none"`、`"required"`、または `{ "type": "function", "function": { "name": "..." } }`                                                                    |
| `messages[*].role: "tool"` | 後続ターン                                                                                                                                                          |
| `messages[*].tool_call_id` | ツール結果を以前のツール呼び出しに紐付けます                                                                                                                        |
| `max_completion_tokens`    | 数値。合計補完トークン数に対する呼び出しごとの上限 (推論トークンを含む)。現在のフィールド名であり、これと `max_tokens` の両方が送信された場合に使用されます。       |
| `max_tokens`               | 数値。レガシーエイリアス。`max_completion_tokens` も存在する場合は無視されます。                                                                                   |
| `temperature`              | 数値 0-2。ベストエフォートで、上流プロバイダーに転送されます。範囲外の場合は `400 invalid_request_error`。                                                         |
| `top_p`                    | 数値 0-1。ベストエフォート。範囲外の場合は `400 invalid_request_error`。                                                                                            |
| `frequency_penalty`        | 数値 -2.0 から 2.0。ベストエフォート。範囲外の場合は `400 invalid_request_error`。                                                                                  |
| `presence_penalty`         | 数値 -2.0 から 2.0。ベストエフォート。範囲外の場合は `400 invalid_request_error`。                                                                                  |
| `seed`                     | 整数。ベストエフォート。整数以外の値の場合は `400 invalid_request_error`。                                                                                          |
| `stop`                     | 文字列、または最大 4 個の文字列の配列。ベストエフォート。4 個を超えるシーケンス、または文字列でない/空のエントリの場合は `400 invalid_request_error`。             |

すべてのサンプリングおよびトークン上限フィールドは、同じエージェント stream-param チャネルに載り、ベストエフォートで転送されます。

- トークン上限: ワイヤ上のフィールド名はプロバイダーのトランスポートによって選択されます。OpenAI 系エンドポイントでは `max_completion_tokens`、レガシー名のみを受け付けるプロバイダー (Mistral、Chutes) では `max_tokens` です。
- `stop` はトランスポートの stop フィールドにマッピングされます。Chat Completions バックエンドでは `stop`、Anthropic では `stop_sequences` です。OpenAI Responses API には stop パラメーターがないため、Responses ベースのモデルでは `stop` は適用されません。
- ChatGPT ベースの Codex Responses バックエンドは固定のサーバー側サンプリングを使用し、そのバックエンドにリクエストが到達する前に `temperature`/`top_p` (`max_output_tokens`、`metadata`、`prompt_cache_retention`、`service_tier` とともに) を取り除きます。

### サポートされないバリアント

次の場合は `400 invalid_request_error` を返します。

- 配列でない `tools`、function ではないツールエントリ、または `tool.function.name` の欠落
- `allowed_tools` や `custom` などの `tool_choice` バリアント
- 提供されたツールと一致しない `tool_choice.function.name` 値

`tool_choice: "required"` および function に固定された `tool_choice` の場合、エンドポイントは公開されるクライアント function-tool セットを絞り込み、応答前にクライアントツールを呼び出すようランタイムに指示し、エージェント応答に一致する構造化されたクライアントツール呼び出しがない場合はエラーになります。これは、すべての内部 OpenClaw エージェントツールではなく、呼び出し元が指定した HTTP `tools` リストに適用されます。

### 非ストリーミングのツール応答形式

エージェントがツールを呼び出す場合、応答は次を使用します。

- `choices[0].finish_reason = "tool_calls"`
- `id`、`type: "function"`、`function.name`、`function.arguments` (JSON 文字列) を持つ `choices[0].message.tool_calls[]` エントリ
- ツール呼び出し前のアシスタントのコメント。`choices[0].message.content` 内 (空の場合があります)

### ストリーミングのツール応答形式

`stream: true` の場合、ツール呼び出しは増分 SSE チャンクとして到着します。最初のアシスタント role delta、任意のアシスタントコメント delta、ツール ID と引数フラグメントを含む 1 つ以上の `delta.tool_calls` チャンク、その後 `finish_reason: "tool_calls"` と `data: [DONE]` を含む最後のチャンクです。

`stream_options.include_usage=true` の場合、`[DONE]` の前に末尾の使用量チャンクが送出されます。

### ツール後続ループ

`tool_calls` を受信したら、要求された関数を実行し、以前のアシスタントツール呼び出しメッセージに加えて、一致する `tool_call_id` を持つ 1 つ以上の `role: "tool"` メッセージを含む後続リクエストを送信します。これにより同じエージェント推論ループが継続され、最終回答が生成されます。

## ストリーミング (SSE)

Server-Sent Events を受信するには `stream: true` を設定します。

- `Content-Type: text/event-stream`
- 各イベント行は `data: <json>`
- ストリームは `data: [DONE]` で終了します

## Open WebUI クイックセットアップ

- ベース URL: `http://127.0.0.1:18789/v1`
- macOS 上の Docker ベース URL: `http://host.docker.internal:18789/v1`
- API キー: Gateway bearer token
- モデル: `openclaw/default`

期待される動作: `GET /v1/models` は `openclaw/default` を一覧表示し、Open WebUI はそれをチャットモデル ID として使用します。特定のバックエンドプロバイダー/モデルの場合は、エージェントの通常のデフォルトモデルを設定するか、`x-openclaw-model` (shared-secret 呼び出し元、または `operator.admin` を持つ identity-bearing 呼び出し元) を送信します。

クイックスモークテスト:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

これが `openclaw/default` を返す場合、ほとんどの Open WebUI セットアップは同じベース URL とトークンで接続できます。

## 例

1 つのアプリ会話の安定したセッション:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

その会話で後続の呼び出しを行う際に同じ `user` 値を再利用すると、同じエージェントセッションを継続できます。

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

モデルを一覧表示:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

1 つのモデルを取得:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

埋め込みを作成:

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

`/v1/embeddings` は `input` として文字列または文字列の配列をサポートします。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [オペレーター スコープ](/ja-JP/gateway/operator-scopes)
- [OpenAI](/ja-JP/providers/openai)
