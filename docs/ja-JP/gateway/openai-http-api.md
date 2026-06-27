---
read_when:
    - OpenAI Chat Completions を想定するツールの統合
summary: Gateway から OpenAI 互換の /v1/chat/completions HTTP エンドポイントを公開する
title: OpenAI チャット補完
x-i18n:
    generated_at: "2026-06-27T11:31:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw の Gateway は、小さな OpenAI 互換の Chat Completions エンドポイントを提供できます。

このエンドポイントは**デフォルトでは無効**です。まず config で有効にしてください。

- `POST /v1/chat/completions`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/v1/chat/completions`

Gateway の OpenAI 互換 HTTP サーフェスを有効にすると、次も提供されます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

内部では、リクエストは通常の Gateway エージェント実行（`openclaw agent` と同じコードパス）として実行されるため、ルーティング、権限、config は Gateway と一致します。

## 認証

Gateway auth config を使用します。

一般的な HTTP auth パス:

- 共有シークレット auth（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- 信頼済みの identity-bearing HTTP auth（`gateway.auth.mode="trusted-proxy"`）:
  configured identity-aware proxy 経由でルーティングし、必要な identity ヘッダーを注入させます
- private-ingress open auth（`gateway.auth.mode="none"`）:
  auth ヘッダーは不要です

注記:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTP リクエストは configured trusted proxy source から来る必要があります。同一ホストの loopback proxy には明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- proxy をバイパスする内部の同一ホスト caller は、local direct fallback として `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を使用できます。`Forwarded`、`X-Forwarded-*`、または `X-Real-IP` ヘッダーの証拠がある場合は、代わりにリクエストは trusted-proxy パスに維持されます。
- `gateway.auth.rateLimit` が構成され、auth 失敗が多すぎる場合、エンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、Gateway インスタンスに対する**完全な operator-access** サーフェスとして扱ってください。

- ここでの HTTP bearer auth は、狭い per-user scope model ではありません。
- このエンドポイントで有効な Gateway token/password は、owner/operator credential と同等に扱うべきです。
- リクエストは、信頼済み operator action と同じ control-plane agent パスを通ります。
- このエンドポイントには別個の non-owner/per-user tool 境界はありません。caller がここで Gateway auth を通過すると、OpenClaw はその caller をこの Gateway の信頼済み operator として扱います。
- 共有シークレット auth モード（`token` と `password`）では、caller がより狭い `x-openclaw-scopes` ヘッダーを送信しても、エンドポイントは通常の完全な operator default を復元します。
- Trusted identity-bearing HTTP モード（たとえば trusted proxy auth や `gateway.auth.mode="none"`）は、存在する場合は `x-openclaw-scopes` を尊重し、存在しない場合は通常の operator default scope set にフォールバックします。
- 対象エージェントの policy が sensitive tools を許可している場合、このエンドポイントはそれらを使用できます。
- このエンドポイントは loopback/tailnet/private ingress のみに置いてください。public internet に直接公開しないでください。

Auth マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway operator secret の所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルト operator scope set を復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上の chat turn を owner-sender turn として扱います
- trusted identity-bearing HTTP モード（たとえば trusted proxy auth、または private ingress 上の `gateway.auth.mode="none"`）
  - 外側の信頼済み identity または deployment boundary を認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーが存在しない場合は通常の operator default scope set にフォールバックします
  - caller が明示的に scope を狭め、`operator.admin` を省略した場合にのみ owner semantics を失います
  - `x-openclaw-model` などの owner-level request control には `operator.admin` が必要です

[Security](/ja-JP/gateway/security) と [Remote access](/ja-JP/gateway/remote) を参照してください。

## このエンドポイントを使う場面

既存の Gateway に tooling や信頼済み app-side backend を統合しており、Gateway operator credential を安全に保持できる場合は、`/v1/chat/completions` を使用します。

- 統合が同じ Gateway に対する別の operator/client surface にすぎない場合は、新しい built-in channel を追加するよりもこちらを優先してください。
- remote Gateway に直接接続する native mobile client では、[WebChat](/ja-JP/web/webchat) または [Gateway Protocol](/ja-JP/gateway/protocol) を優先し、device が共有 HTTP token/password を必要としないように paired-device bootstrap/device-token flow を実装してください。
- 独自の users、rooms、webhook delivery、outbound transport を持つ external messaging network を統合する場合は、代わりに channel plugin を構築してください。[Building plugins](/ja-JP/plugins/building-plugins) を参照してください。

## Agent-first model contract

OpenClaw は OpenAI の `model` フィールドを、raw provider model id ではなく**agent target**として扱います。

- `model: "openclaw"` は configured default agent にルーティングします。
- `model: "openclaw/default"` も configured default agent にルーティングします。
- `model: "openclaw/<agentId>"` は特定の agent にルーティングします。

任意の request header:

- `x-openclaw-model: <provider/model-or-bare-id>` は、選択された agent の backend model を上書きします。Shared-secret bearer caller はこのヘッダーを使用できます。trusted-proxy や `x-openclaw-scopes` 付きの private no-auth ingress request などの identity-bearing caller には `operator.admin` が必要です。write-only caller は `403 missing scope: operator.admin` を受け取ります。
- `x-openclaw-agent-id: <agentId>` は compatibility override として引き続きサポートされます。
- `x-openclaw-session-key: <sessionKey>` は session routing を明示的に制御します。値には `subagent:`、`cron:`、`acp:` などの予約済み internal session namespace を使用してはいけません。そのようなリクエストは `400 invalid_request_error` で拒否されます。
- `x-openclaw-message-channel: <channel>` は、channel-aware prompts と policies 用の synthetic ingress channel context を設定します。

引き続き受け付けられる compatibility alias:

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

## セッション動作

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（各呼び出しで新しい session key が生成されます）。

リクエストに OpenAI の `user` 文字列が含まれる場合、Gateway はそこから安定した session key を導出するため、繰り返しの呼び出しで agent session を共有できます。

custom app では、conversation thread ごとに同じ `user` 値を再利用するのが最も安全なデフォルトです。複数の会話や device で 1 つの OpenClaw session を共有することを明示的に望む場合を除き、account-level identifier は避けてください。複数の client や thread にまたがって明示的な routing control が必要な場合にのみ `x-openclaw-session-key` を使用し、`subagent:`、`cron:`、`acp:` などの予約済み internal namespace で始まらない application-owned key を選んでください。

## このサーフェスが重要な理由

これは、self-hosted frontend と tooling にとって最も効果の高い compatibility set です。

- 多くの Open WebUI、LobeChat、LibreChat setup は `/v1/models` を期待します。
- 多くの RAG system は `/v1/embeddings` を期待します。
- 既存の OpenAI chat client は、通常 `/v1/chat/completions` から開始できます。
- より agent-native な client は、ますます `/v1/responses` を好むようになっています。

## Model list と agent routing

<AccordionGroup>
  <Accordion title="`/v1/models` は何を返しますか？">
    OpenClaw agent-target list です。

    返される id は `openclaw`、`openclaw/default`、および `openclaw/<agentId>` entries です。
    それらを OpenAI `model` 値として直接使用してください。

  </Accordion>
  <Accordion title="`/v1/models` は agent または sub-agent を一覧しますか？">
    top-level agent target を一覧します。backend provider model でも sub-agent でもありません。

    Sub-agent は internal execution topology のままです。pseudo-model としては表示されません。

  </Accordion>
  <Accordion title="なぜ `openclaw/default` が含まれているのですか？">
    `openclaw/default` は configured default agent の安定した alias です。

    つまり、実際の default agent id が環境間で変わっても、client は予測可能な 1 つの id を使い続けられます。

  </Accordion>
  <Accordion title="backend model を上書きするにはどうすればよいですか？">
    `x-openclaw-model` を使用します。これは owner-level override です。Gateway shared-secret bearer token/password path で動作し、trusted proxy auth などの identity-bearing HTTP path では `operator.admin` が必要です。

    例:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    省略した場合、選択された agent は通常の configured model choice で実行されます。

  </Accordion>
  <Accordion title="embeddings はこの contract にどう適合しますか？">
    `/v1/embeddings` は同じ agent-target `model` id を使用します。

    `model: "openclaw/default"` または `model: "openclaw/<agentId>"` を使用してください。
    特定の embedding model が必要な場合は、shared-secret caller または `operator.admin` を持つ identity-bearing caller から `x-openclaw-model` で送信してください。
    そのヘッダーがない場合、リクエストは選択された agent の通常の embedding setup に渡されます。

  </Accordion>
</AccordionGroup>

## Streaming（SSE）

Server-Sent Events（SSE）を受信するには `stream: true` を設定します。

- `Content-Type: text/event-stream`
- 各 event line は `data: <json>` です
- Stream は `data: [DONE]` で終了します

## Chat tool contract

`/v1/chat/completions` は、一般的な OpenAI Chat client と互換性のある function-tool subset をサポートします。

### サポートされる request field

- `tools`: `{ "type": "function", "function": { ... } }` の array
- `tool_choice`: `"auto"`、`"none"`、`"required"`、または `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` follow-up turn
- `messages[*].tool_call_id`: tool result を prior tool call に binding します
- `max_completion_tokens`: number。total completion token（reasoning token を含む）の per-call cap。現在の OpenAI Chat Completions field name です。`max_completion_tokens` と `max_tokens` の両方が送信された場合はこちらが優先されます。
- `max_tokens`: number。backwards compatibility のために受け付けられる legacy alias です。`max_completion_tokens` も存在する場合は無視されます。
- `temperature`: number。best-effort sampling temperature が agent stream-param channel 経由で upstream provider に転送されます。
- `top_p`: number。best-effort nucleus sampling が agent stream-param channel 経由で upstream provider に転送されます。
- `frequency_penalty`: number。best-effort frequency penalty が agent stream-param channel 経由で upstream provider に転送されます。有効範囲: -2.0 から 2.0。範囲外の値には `400 invalid_request_error` を返します。
- `presence_penalty`: number。best-effort presence penalty が agent stream-param channel 経由で upstream provider に転送されます。有効範囲: -2.0 から 2.0。範囲外の値には `400 invalid_request_error` を返します。
- `seed`: number（integer）。best-effort seed が agent stream-param channel 経由で upstream provider に転送されます。integer でない値には `400 invalid_request_error` を返します。
- `stop`: string、または最大 4 つの string の array。best-effort stop sequence が agent stream-param channel 経由で upstream provider に転送されます。4 つを超える sequence、または string でない/空の entry には `400 invalid_request_error` を返します。

いずれかのトークン上限フィールドが設定されると、その値はエージェントの stream-param チャネルを介して上流プロバイダーへ転送されます。上流プロバイダーへ送信される実際のワイヤーフィールド名は、プロバイダーのトランスポートによって選択されます。OpenAI 系エンドポイントでは `max_completion_tokens`、レガシー名のみを受け付けるプロバイダー（Mistral や Chutes など）では `max_tokens` です。サンプリングフィールド（`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`）も同じ stream-param チャネルに従います。ChatGPT ベースの Codex Responses バックエンドは固定サンプリングを使用するため、これらをサーバー側で取り除きます。`stop` も stream-param チャネルに乗り、トランスポートの stop フィールド（Chat Completions バックエンドでは `stop`、Anthropic では `stop_sequences`）にマップされます。OpenAI Responses API には stop パラメーターがないため、Responses バックエンドのモデルでは `stop` は適用されません。

### サポートされていないバリアント

このエンドポイントは、次を含むサポートされていないツールバリアントに対して `400 invalid_request_error` を返します。

- 配列ではない `tools`
- function ではないツールエントリ
- `tool.function.name` の欠落
- `allowed_tools` や `custom` などの `tool_choice` バリアント
- 提供された `tools` と一致しない `tool_choice.function.name` 値

`tool_choice: "required"` と function 固定の `tool_choice` では、このエンドポイントは公開されるクライアント function ツールセットを絞り込み、応答前にクライアントツールを呼び出すようランタイムに指示し、エージェント応答に一致する構造化クライアントツール呼び出しが含まれない場合はエラーを返します。このコントラクトは、呼び出し元が指定した HTTP `tools` リストに適用され、OpenClaw エージェント内部のすべてのツールに適用されるわけではありません。

### 非ストリーミングのツール応答形式

エージェントがツールを呼び出すと判断した場合、応答は次を使用します。

- `choices[0].finish_reason = "tool_calls"`
- 次を含む `choices[0].message.tool_calls[]` エントリ:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments`（JSON 文字列）

ツール呼び出し前のアシスタントのコメントは `choices[0].message.content`（空の場合あり）で返されます。

### ストリーミングのツール応答形式

`stream: true` の場合、ツール呼び出しは増分 SSE チャンクとして送信されます。

- 最初の assistant role delta
- 任意の assistant commentary deltas
- ツール識別情報と引数フラグメントを運ぶ 1 つ以上の `delta.tool_calls` チャンク
- `finish_reason: "tool_calls"` を含む最終チャンク
- `data: [DONE]`

`stream_options.include_usage=true` の場合、`[DONE]` の前に末尾の使用量チャンクが送信されます。

### ツールフォローアップループ

`tool_calls` を受信した後、クライアントは要求された関数を実行し、次を含むフォローアップリクエストを送信する必要があります。

- 以前の assistant ツール呼び出しメッセージ
- 一致する `tool_call_id` を持つ 1 つ以上の `role: "tool"` メッセージ

これにより、Gateway エージェント実行は同じ推論ループを継続し、最終的な assistant 回答を生成できます。

## Open WebUI のクイックセットアップ

基本的な Open WebUI 接続では:

- Base URL: `http://127.0.0.1:18789/v1`
- Docker on macOS base URL: `http://host.docker.internal:18789/v1`
- API key: Gateway ベアラートークン
- Model: `openclaw/default`

期待される動作:

- `GET /v1/models` は `openclaw/default` を一覧表示する必要があります
- Open WebUI は `openclaw/default` をチャットモデル ID として使用する必要があります
- そのエージェントに特定のバックエンドプロバイダー/モデルを使いたい場合は、エージェントの通常のデフォルトモデルを設定するか、共有シークレットの呼び出し元、または `operator.admin` を持つ ID 付き呼び出し元から `x-openclaw-model` を送信します

簡易スモーク:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

これが `openclaw/default` を返す場合、ほとんどの Open WebUI セットアップは同じ Base URL とトークンで接続できます。

## 例

1 つのアプリ会話用の安定したセッション:

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

その会話で後続の呼び出しを行う際は、同じ `user` 値を再利用して同じエージェントセッションを継続します。

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

注:

- `/v1/models` は、生のプロバイダーカタログではなく OpenClaw エージェントターゲットを返します。
- `openclaw/default` は常に存在するため、1 つの安定した ID が環境をまたいで機能します。
- バックエンドプロバイダー/モデルの上書きは、OpenAI の `model` フィールドではなく `x-openclaw-model` に属します。ID 付き HTTP 認証パスでは、このヘッダーには `operator.admin` が必要です。
- `/v1/embeddings` は、`input` を文字列または文字列の配列としてサポートします。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [OpenAI](/ja-JP/providers/openai)
