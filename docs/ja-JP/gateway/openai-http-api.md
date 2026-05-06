---
read_when:
    - OpenAI Chat Completions を想定するツールの統合
summary: Gateway から OpenAI 互換の /v1/chat/completions HTTP エンドポイントを公開する
title: OpenAI チャット補完
x-i18n:
    generated_at: "2026-05-06T09:04:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw の Gateway は、小さな OpenAI 互換の Chat Completions エンドポイントを提供できます。

このエンドポイントは**デフォルトでは無効**です。まず設定で有効にしてください。

- `POST /v1/chat/completions`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/v1/chat/completions`

Gateway の OpenAI 互換 HTTP サーフェスを有効にすると、次も提供されます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

内部では、リクエストは通常の Gateway エージェント実行（`openclaw agent` と同じコードパス）として実行されるため、ルーティング/権限/設定は Gateway と一致します。

## 認証

Gateway の認証設定を使用します。

一般的な HTTP 認証パス:

- 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- 信頼済みの ID 付き HTTP 認証（`gateway.auth.mode="trusted-proxy"`）:
  設定済みの ID 対応プロキシを経由し、必要な ID ヘッダーを注入させます
- プライベートイングレスのオープン認証（`gateway.auth.mode="none"`）:
  認証ヘッダーは不要です

注記:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTP リクエストは設定済みの信頼済みプロキシソースから来ている必要があります。同一ホストのループバックプロキシには、明示的に `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- `gateway.auth.rateLimit` が設定されていて認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、Gateway インスタンスに対する**完全なオペレーターアクセス**サーフェスとして扱ってください。

- ここでの HTTP ベアラー認証は、狭いユーザーごとのスコープモデルではありません。
- このエンドポイントの有効な Gateway トークン/パスワードは、所有者/オペレーターの認証情報として扱うべきです。
- リクエストは、信頼済みオペレーター操作と同じコントロールプレーンのエージェントパスを通って実行されます。
- このエンドポイントには、所有者以外/ユーザーごとの独立したツール境界はありません。呼び出し元がここで Gateway 認証を通過すると、OpenClaw はその呼び出し元をこの Gateway の信頼済みオペレーターとして扱います。
- 共有シークレット認証モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送信しても、エンドポイントは通常の完全なオペレーター既定値を復元します。
- 信頼済みの ID 付き HTTP モード（たとえば信頼済みプロキシ認証や `gateway.auth.mode="none"`）は、`x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合は通常のオペレーター既定スコープセットにフォールバックします。
- 対象エージェントのポリシーが機密ツールを許可している場合、このエンドポイントはそれらを使用できます。
- このエンドポイントは loopback/tailnet/private ingress のみに置いてください。公開インターネットに直接公開しないでください。

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway オペレーターシークレットの所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全な既定オペレータースコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイントでのチャットターンを所有者送信者のターンとして扱います
- 信頼済みの ID 付き HTTP モード（たとえば信頼済みプロキシ認証、またはプライベートイングレス上の `gateway.auth.mode="none"`）
  - 外側の信頼済み ID またはデプロイ境界を認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーが存在しない場合は、通常のオペレーター既定スコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、`operator.admin` を省略した場合にのみ所有者セマンティクスを失います

[セキュリティ](/ja-JP/gateway/security) と [リモートアクセス](/ja-JP/gateway/remote) を参照してください。

## エージェント優先モデル契約

OpenClaw は OpenAI の `model` フィールドを、生のプロバイダーモデル ID ではなく**エージェントターゲット**として扱います。

- `model: "openclaw"` は設定済みのデフォルトエージェントへルーティングされます。
- `model: "openclaw/default"` も設定済みのデフォルトエージェントへルーティングされます。
- `model: "openclaw/<agentId>"` は特定のエージェントへルーティングされます。

任意のリクエストヘッダー:

- `x-openclaw-model: <provider/model-or-bare-id>` は、選択されたエージェントのバックエンドモデルを上書きします。
- `x-openclaw-agent-id: <agentId>` は互換性のための上書きとして引き続きサポートされます。
- `x-openclaw-session-key: <sessionKey>` はセッションルーティングを完全に制御します。
- `x-openclaw-message-channel: <channel>` は、チャネル対応プロンプトとポリシーのための合成イングレスチャネルコンテキストを設定します。

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

## セッション動作

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しいセッションキーが生成されます）。

リクエストに OpenAI の `user` 文字列が含まれている場合、Gateway はそれから安定したセッションキーを導出するため、繰り返しの呼び出しでエージェントセッションを共有できます。

## このサーフェスが重要な理由

これは、セルフホストのフロントエンドとツールにとって最も効果の高い互換性セットです。

- ほとんどの Open WebUI、LobeChat、LibreChat セットアップは `/v1/models` を期待します。
- 多くの RAG システムは `/v1/embeddings` を期待します。
- 既存の OpenAI チャットクライアントは、通常 `/v1/chat/completions` から開始できます。
- よりエージェントネイティブなクライアントでは、`/v1/responses` を好むものが増えています。

## モデル一覧とエージェントルーティング

<AccordionGroup>
  <Accordion title="`/v1/models` は何を返しますか？">
    OpenClaw のエージェントターゲット一覧です。

    返される ID は `openclaw`、`openclaw/default`、および `openclaw/<agentId>` エントリです。
    それらを OpenAI の `model` 値として直接使用してください。

  </Accordion>
  <Accordion title="`/v1/models` はエージェントまたはサブエージェントを一覧表示しますか？">
    最上位のエージェントターゲットを一覧表示します。バックエンドプロバイダーモデルやサブエージェントではありません。

    サブエージェントは内部の実行トポロジーのままです。疑似モデルとしては表示されません。

  </Accordion>
  <Accordion title="なぜ `openclaw/default` が含まれるのですか？">
    `openclaw/default` は設定済みのデフォルトエージェントの安定したエイリアスです。

    つまり、実際のデフォルトエージェント ID が環境間で変わっても、クライアントは予測可能な 1 つの ID を使い続けられます。

  </Accordion>
  <Accordion title="バックエンドモデルを上書きするにはどうすればよいですか？">
    `x-openclaw-model` を使用します。

    例:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    省略した場合、選択されたエージェントは通常の設定済みモデル選択で実行されます。

  </Accordion>
  <Accordion title="埋め込みはこの契約にどのように適合しますか？">
    `/v1/embeddings` は同じエージェントターゲットの `model` ID を使用します。

    `model: "openclaw/default"` または `model: "openclaw/<agentId>"` を使用してください。
    特定の埋め込みモデルが必要な場合は、`x-openclaw-model` で送信してください。
    そのヘッダーがない場合、リクエストは選択されたエージェントの通常の埋め込み設定に渡されます。

  </Accordion>
</AccordionGroup>

## ストリーミング（SSE）

Server-Sent Events（SSE）を受信するには、`stream: true` を設定します。

- `Content-Type: text/event-stream`
- 各イベント行は `data: <json>` です
- ストリームは `data: [DONE]` で終了します

## Open WebUI クイックセットアップ

基本的な Open WebUI 接続の場合:

- ベース URL: `http://127.0.0.1:18789/v1`
- macOS 上の Docker のベース URL: `http://host.docker.internal:18789/v1`
- API キー: Gateway のベアラートークン
- モデル: `openclaw/default`

期待される動作:

- `GET /v1/models` は `openclaw/default` を一覧表示するはずです
- Open WebUI はチャットモデル ID として `openclaw/default` を使用するはずです
- そのエージェントに特定のバックエンドプロバイダー/モデルを使いたい場合は、エージェントの通常のデフォルトモデルを設定するか、`x-openclaw-model` を送信します

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

注記:

- `/v1/models` は、生のプロバイダーカタログではなく OpenClaw エージェントターゲットを返します。
- `openclaw/default` は常に存在するため、1 つの安定した ID が環境をまたいで機能します。
- バックエンドプロバイダー/モデルの上書きは、OpenAI の `model` フィールドではなく `x-openclaw-model` に指定します。
- `/v1/embeddings` は、文字列または文字列配列としての `input` をサポートします。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [OpenAI](/ja-JP/providers/openai)
