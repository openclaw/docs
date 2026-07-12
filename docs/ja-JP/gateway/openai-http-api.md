---
read_when:
    - OpenAI Chat Completions を必要とするツールの統合
summary: Gateway から OpenAI 互換の /v1/chat/completions HTTP エンドポイントを公開する
title: OpenAI チャット補完
x-i18n:
    generated_at: "2026-07-11T22:15:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway は、小規模な OpenAI 互換の Chat Completions サーフェスを提供できます。これは**デフォルトでは無効**です。

有効にすると、Gateway と同じポート上で以下のすべてを提供します（WS + HTTP 多重化）：

| メソッド | パス                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

リクエストは通常の Gateway エージェント実行として処理され（`openclaw agent` と同じコードパス）、ルーティング、権限、設定は使用中の Gateway と一致します。

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

無効にするには、`enabled: false` を設定します（または省略します）。

## セキュリティ境界（重要）

このエンドポイントは、Gateway インスタンスへの**完全なオペレーターアクセス**として扱ってください：

- このエンドポイントで有効な Gateway トークン／パスワードは、ユーザーごとの限定的なスコープではなく、所有者／オペレーターの資格情報に相当します。
- リクエストは信頼されたオペレーター操作と同じコントロールプレーンのエージェントパスを通るため、対象エージェントのポリシーで機密性の高いツールが許可されている場合、このエンドポイントからそれらを使用できます。
- local loopback、tailnet、またはプライベートイングレスのみに限定してください。公開インターネットに公開しないでください。

認証マトリクス：

| 認証パス                                                                                            | 動作                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`                            | 共有 Gateway シークレットを保持していることを証明します。`x-openclaw-scopes` ヘッダーを無視し、完全なデフォルトオペレータースコープセット（`operator.admin`、`operator.approvals`、`operator.pairing`、`operator.read`、`operator.talk.secrets`、`operator.write`）を復元します。チャットターンを所有者送信者のターンとして扱います。 |
| ID 情報を含む信頼済み HTTP（trusted-proxy 認証、またはプライベートイングレス上の `gateway.auth.mode="none"`） | `x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合はデフォルトのオペレータースコープセットを使用します。呼び出し元がスコープを明示的に絞り込み、かつ `operator.admin` を除外した場合にのみ、所有者としてのセマンティクスを失います。`x-openclaw-model` などの所有者レベルの制御には `operator.admin` が必要です。                        |

[オペレータースコープ](/ja-JP/gateway/operator-scopes)、[セキュリティ](/ja-JP/gateway/security)、[リモートアクセス](/ja-JP/gateway/remote)を参照してください。

## 認証

Gateway の認証設定を使用します（このモードの詳細については[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照してください）：

| モード                                | 認証方法                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`。`gateway.auth.token` または `OPENCLAW_GATEWAY_TOKEN` で設定します。                                                                                              |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`。`gateway.auth.password` または `OPENCLAW_GATEWAY_PASSWORD` で設定します。                                                                                     |
| `gateway.auth.mode="trusted-proxy"` | 設定済みの ID 対応プロキシを経由してルーティングします。このプロキシが必要な ID ヘッダーを挿入します。同一ホストの local loopback プロキシでは、`gateway.auth.trustedProxy.allowLoopback = true` を明示的に設定する必要があります。 |
| `gateway.auth.mode="none"`          | 認証ヘッダーは不要です（プライベートイングレスのみ）。                                                                                                                                         |

注：

- `trusted-proxy` Gateway でプロキシを迂回する同一ホストの呼び出し元は、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を直接使用する方式にフォールバックできます。ただし、`Forwarded`、`X-Forwarded-*`、または `X-Real-IP` ヘッダーが存在する場合、リクエストは引き続き trusted-proxy パスで処理されます。
- `gateway.auth.rateLimit` が設定されており、認証試行の失敗回数が多すぎる場合、エンドポイントは `Retry-After` ヘッダー付きの `429` を返します。

## このエンドポイントを使用する場合

- 統合対象が同じ Gateway に対する別のオペレーター／クライアントサーフェスにすぎない場合は、新しい組み込みチャネルを追加するよりも、このエンドポイントを優先してください。
- リモート Gateway に直接接続するネイティブモバイルクライアントでは、共有 HTTP トークン／パスワードをデバイスに持たせずに済むよう、ペアリング済みデバイスのブートストラップ／デバイストークンフローを備えた [WebChat](/ja-JP/web/webchat) または [Gateway プロトコル](/ja-JP/gateway/protocol)を優先してください。
- 独自のユーザー、ルーム、Webhook 配信、または送信トランスポートを持つ外部メッセージングネットワークと統合する場合は、代わりにチャネル Plugin を構築してください。[Plugin の構築](/ja-JP/plugins/building-plugins)を参照してください。

## エージェント優先のモデル契約

OpenClaw は OpenAI の `model` フィールドを、生のプロバイダーモデル ID ではなく**エージェントターゲット**として扱います。

| `model` の値                                | ルーティング先                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | 設定済みのデフォルトエージェント                                                                                                 |
| `openclaw/default`                           | 設定済みのデフォルトエージェント（安定したエイリアス。実際のデフォルトエージェント ID が環境間で変わる場合でも安全にハードコード可能） |
| `openclaw/<agentId>` または `openclaw:<agentId>` | 特定のエージェント                                                                                                           |
| `agent:<agentId>`                            | 特定のエージェント（互換性エイリアス）                                                                                     |

任意のリクエストヘッダー：

| ヘッダー                                          | 効果                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | 選択したエージェントのバックエンドモデルを上書きします。共有シークレットの Bearer 認証を使用する呼び出し元は直接使用できます。ID 情報を含む呼び出し元（trusted-proxy、または `x-openclaw-scopes` を使用するプライベートな認証なしイングレス）には `operator.admin` が必要で、ない場合は `403 missing scope: operator.admin` になります。 |
| `x-openclaw-agent-id: <agentId>`                | エージェント選択用の互換性上書きです。                                                                                                                                                                                                                                 |
| `x-openclaw-session-key: <sessionKey>`          | 明示的なセッションルーティングです。予約済みの内部名前空間（`subagent:`、`cron:`、`acp:`）を使用すると、`400 invalid_request_error` で拒否されます。                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | チャネル対応のプロンプト／ポリシー用に、合成イングレスチャネルコンテキストを設定します。                                                                                                                                                                                              |

`/v1/models` は、バックエンドプロバイダーモデルやサブエージェントではなく、最上位のエージェントターゲット（`openclaw`、`openclaw/default`、`openclaw/<agentId>`）を一覧表示します。サブエージェントは内部実行トポロジーのままです。`x-openclaw-model` を省略すると、選択したエージェントは通常設定されているモデルで実行されます。

`/v1/embeddings` は同じエージェントターゲットの `model` ID を使用します。特定の埋め込みモデルを選択するには、`x-openclaw-model` を送信します（共有シークレットを使用する呼び出し元、または `operator.admin` を持つ ID 情報付きの呼び出し元）。指定しない場合、リクエストは選択したエージェントの通常の埋め込み設定を使用します。

## セッションの動作

デフォルトでは、エンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しいセッションキーが生成されます）。

リクエストに OpenAI の `user` 文字列が含まれている場合、Gateway はそこから安定したセッションキーを導出するため、繰り返しの呼び出しでエージェントセッションを共有できます。カスタムアプリでは、会話スレッドごとに同じ `user` 値を再利用してください。複数の会話／デバイスで 1 つの OpenClaw セッションを共有したい場合を除き、アカウントレベルの識別子は避けてください。複数のクライアント／スレッド間で明示的なルーティング制御が必要な場合にのみ、上記の予約済み名前空間を避けたアプリケーション所有のキーで `x-openclaw-session-key` を使用してください。

## リクエスト制限（設定）

デフォルト値は `gateway.http.endpoints.chatCompletions` 配下で調整できます：

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

省略時のデフォルト値：

| キー                   | デフォルト                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20MB                                                                        |
| `maxImageParts`       | 8（最新のユーザーメッセージから読み取る `image_url` パーツの最大数）                 |
| `maxTotalImageBytes`  | 20MB（1 リクエスト内のすべての `image_url` パーツを合計したデコード後の累積バイト数） |
| `images.allowUrl`     | `false`（有効にしない限り、URL をソースとする `image_url` パーツは拒否されます）         |
| `images.maxBytes`     | 画像 1 件あたり 10MB                                                              |
| `images.maxRedirects` | 3                                                                           |
| `images.timeoutMs`    | 10 秒                                                                         |

HEIC/HEIF の `image_url` ソースは受け入れられ、共有 OpenClaw 画像プロセッサ（Rastermill）を通じてプロバイダーへ配信される前に JPEG に正規化されます。外部コーデックのサポートが必要な形式では、システムコンバーター（`sips`、ImageMagick、GraphicsMagick、または ffmpeg）にフォールバックします。

セキュリティに関する注意: ホスト名を許可リストに追加しても、プライベート/内部 IP のブロックは回避されません。インターネットに公開する Gateway では、アプリレベルの保護に加えて、ネットワークの外向き通信制御を適用してください。[セキュリティ](/ja-JP/gateway/security)を参照してください。

## チャットツールの契約

`/v1/chat/completions` は、一般的な OpenAI Chat クライアントと互換性のある関数ツールのサブセットをサポートします。

### サポートされるリクエストフィールド

| フィールド                 | 注記                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | `{ "type": "function", "function": { ... } }` の配列                                                                                                    |
| `tool_choice`              | `"auto"`、`"none"`、`"required"`、または `{ "type": "function", "function": { "name": "..." } }`                                                        |
| `messages[*].role: "tool"` | 後続ターン                                                                                                                                              |
| `messages[*].tool_call_id` | ツール結果を以前のツール呼び出しに関連付けます                                                                                                          |
| `max_completion_tokens`    | 数値。呼び出しごとの完了トークン総数の上限（推論トークンを含む）。現在のフィールド名であり、`max_tokens` と両方が送信された場合はこちらが使用されます。 |
| `max_tokens`               | 数値。旧形式の別名であり、`max_completion_tokens` も指定されている場合は無視されます。                                                                  |
| `temperature`              | 0〜2 の数値。ベストエフォートで上流プロバイダーに転送されます。範囲外の場合は `400 invalid_request_error`。                                             |
| `top_p`                    | 0〜1 の数値。ベストエフォート。範囲外の場合は `400 invalid_request_error`。                                                                             |
| `frequency_penalty`        | -2.0〜2.0 の数値。ベストエフォート。範囲外の場合は `400 invalid_request_error`。                                                                        |
| `presence_penalty`         | -2.0〜2.0 の数値。ベストエフォート。範囲外の場合は `400 invalid_request_error`。                                                                        |
| `seed`                     | 整数。ベストエフォート。整数以外の値の場合は `400 invalid_request_error`。                                                                              |
| `stop`                     | 文字列、または最大 4 個の文字列の配列。ベストエフォート。シーケンスが 4 個を超える場合、または文字列以外/空の項目がある場合は `400 invalid_request_error`。 |

すべてのサンプリングフィールドとトークン上限フィールドは、同じエージェントストリームパラメーターチャネルを通り、ベストエフォートで転送されます。

- トークン上限: ワイヤー上のフィールド名は、プロバイダーのトランスポートによって選択されます。OpenAI 系エンドポイントでは `max_completion_tokens`、旧形式の名前しか受け付けないプロバイダー（Mistral、Chutes）では `max_tokens` です。
- `stop` はトランスポートの停止フィールドに対応付けられます。Chat Completions バックエンドでは `stop`、Anthropic では `stop_sequences` です。OpenAI Responses API には停止パラメーターがないため、Responses ベースのモデルには `stop` は適用されません。
- ChatGPT ベースの Codex Responses バックエンドでは、固定されたサーバー側サンプリングを使用し、リクエストがそのバックエンドに到達する前に `temperature`/`top_p`（および `max_output_tokens`、`metadata`、`prompt_cache_retention`、`service_tier`）を除去します。

### サポートされていないバリアント

次の場合は `400 invalid_request_error` を返します。

- 配列ではない `tools`、関数ではないツール項目、または `tool.function.name` の欠落
- `allowed_tools` や `custom` などの `tool_choice` バリアント
- 提供されたツールと一致しない `tool_choice.function.name` の値

`tool_choice: "required"` および関数を固定した `tool_choice` の場合、エンドポイントは公開するクライアント関数ツールの集合を限定し、応答前にクライアントツールを呼び出すようランタイムに指示します。エージェントの応答に一致する構造化クライアントツール呼び出しがない場合はエラーになります。これは、すべての内部 OpenClaw エージェントツールではなく、呼び出し元が指定した HTTP `tools` リストに適用されます。

### 非ストリーミングのツール応答形式

エージェントがツールを呼び出す場合、応答では次の形式を使用します。

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` の各項目には `id`、`type: "function"`、`function.name`、`function.arguments`（JSON 文字列）が含まれます
- ツール呼び出し前のアシスタントによる補足説明は `choices[0].message.content` に入ります（空の場合があります）

### ストリーミングのツール応答形式

`stream: true` の場合、ツール呼び出しは増分 SSE チャンクとして到着します。最初にアシスタントロールの差分、必要に応じてアシスタントによる補足説明の差分、ツールの識別情報と引数の断片を含む 1 個以上の `delta.tool_calls` チャンクが続き、最後に `finish_reason: "tool_calls"` と `data: [DONE]` を含むチャンクが送信されます。

`stream_options.include_usage=true` の場合、`[DONE]` の前に末尾の使用量チャンクが送信されます。

### ツールの後続処理ループ

`tool_calls` を受信したら、要求された関数を実行し、以前のアシスタントのツール呼び出しメッセージと、一致する `tool_call_id` を持つ 1 個以上の `role: "tool"` メッセージを含めて後続リクエストを送信します。これにより、同じエージェント推論ループを継続して最終回答を生成します。

## ストリーミング（SSE）

Server-Sent Events を受信するには `stream: true` を設定します。

- `Content-Type: text/event-stream`
- 各イベント行は `data: <json>`
- ストリームは `data: [DONE]` で終了します

## Open WebUI のクイックセットアップ

- ベース URL: `http://127.0.0.1:18789/v1`
- macOS 上の Docker でのベース URL: `http://host.docker.internal:18789/v1`
- API キー: 使用する Gateway ベアラートークン
- モデル: `openclaw/default`

期待される動作: `GET /v1/models` は `openclaw/default` を一覧に表示し、Open WebUI はそれをチャットモデル ID として使用します。特定のバックエンドプロバイダー/モデルを使用するには、エージェントの通常のデフォルトモデルを設定するか、`x-openclaw-model` を送信します（共有シークレットを使用する呼び出し元、または `operator.admin` を持つ ID 付きの呼び出し元）。

簡易スモークテスト:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

これが `openclaw/default` を返す場合、ほとんどの Open WebUI セットアップでは、同じベース URL とトークンを使用して接続できます。

## 例

1 つのアプリ会話で安定したセッションを使用する場合:

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

その会話の後続呼び出しで同じ `user` 値を再利用すると、同じエージェントセッションを継続できます。

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

モデル一覧を取得:

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

`/v1/embeddings` は、文字列または文字列配列として `input` をサポートします。

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [オペレーターのスコープ](/ja-JP/gateway/operator-scopes)
- [OpenAI](/ja-JP/providers/openai)
