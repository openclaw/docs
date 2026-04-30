---
read_when:
    - OpenAI Chat Completions を想定するツールの統合
summary: Gateway から OpenAI 互換の /v1/chat/completions HTTP エンドポイントを公開する
title: OpenAI チャット補完
x-i18n:
    generated_at: "2026-04-30T05:14:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw の Gateway は、小さな OpenAI 互換の Chat Completions エンドポイントを提供できます。

このエンドポイントは**デフォルトで無効**です。まず設定で有効にしてください。

- `POST /v1/chat/completions`
- Gateway と同じポート（WS + HTTP 多重化）: `http://<gateway-host>:<port>/v1/chat/completions`

Gateway の OpenAI 互換 HTTP サーフェスを有効にすると、次も提供されます。

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

内部では、リクエストは通常の Gateway エージェント実行（`openclaw agent` と同じコードパス）として実行されるため、ルーティング、権限、設定は Gateway と一致します。

## 認証

Gateway の認証設定を使用します。

一般的な HTTP 認証パス:

- 共有シークレット認証（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- 信頼済みの ID 付き HTTP 認証（`gateway.auth.mode="trusted-proxy"`）:
  設定済みの ID 対応プロキシ経由でルーティングし、必要な ID ヘッダーを注入させます
- プライベート Ingress のオープン認証（`gateway.auth.mode="none"`）:
  認証ヘッダーは不要です

注記:

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTP リクエストは設定済みの信頼済みプロキシソースから来る必要があります。同一ホストのループバックプロキシには、明示的な `gateway.auth.trustedProxy.allowLoopback = true` が必要です。
- `gateway.auth.rateLimit` が設定されていて認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きの `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、Gateway インスタンスに対する**完全なオペレーターアクセス**サーフェスとして扱ってください。

- ここでの HTTP ベアラー認証は、狭いユーザー単位のスコープモデルではありません。
- このエンドポイントに対する有効な Gateway トークン/パスワードは、所有者/オペレーターの認証情報と同じように扱う必要があります。
- リクエストは、信頼済みオペレーター操作と同じコントロールプレーンのエージェントパスを通って実行されます。
- このエンドポイントには、所有者以外/ユーザー単位の別個のツール境界はありません。呼び出し元がここで Gateway 認証を通過すると、OpenClaw はその呼び出し元をこの Gateway の信頼済みオペレーターとして扱います。
- 共有シークレット認証モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送信しても、エンドポイントは通常の完全なオペレーターのデフォルトを復元します。
- 信頼済みの ID 付き HTTP モード（例: 信頼済みプロキシ認証、または `gateway.auth.mode="none"`）は、`x-openclaw-scopes` が存在する場合はそれを尊重し、存在しない場合は通常のオペレーターのデフォルトスコープセットにフォールバックします。
- 対象エージェントのポリシーが機密性の高いツールを許可している場合、このエンドポイントはそれらを使用できます。
- このエンドポイントはループバック、tailnet、またはプライベート Ingress のみに置いてください。公開インターネットに直接公開しないでください。

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有 Gateway オペレーターシークレットの所持を証明します
  - より狭い `x-openclaw-scopes` を無視します
  - 完全なデフォルトオペレータースコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上のチャットターンを所有者送信者ターンとして扱います
- 信頼済みの ID 付き HTTP モード（例: 信頼済みプロキシ認証、またはプライベート Ingress 上の `gateway.auth.mode="none"`）
  - 外側の信頼済み ID またはデプロイ境界を認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーが存在しない場合は、通常のオペレーターのデフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にスコープを狭め、`operator.admin` を省略した場合にのみ所有者セマンティクスを失います

[セキュリティ](/ja-JP/gateway/security) と [リモートアクセス](/ja-JP/gateway/remote) を参照してください。

## エージェント優先のモデル契約

OpenClaw は、OpenAI の `model` フィールドを生のプロバイダーモデル ID ではなく、**エージェントターゲット**として扱います。

- `model: "openclaw"` は、設定済みのデフォルトエージェントにルーティングします。
- `model: "openclaw/default"` も、設定済みのデフォルトエージェントにルーティングします。
- `model: "openclaw/<agentId>"` は、特定のエージェントにルーティングします。

任意のリクエストヘッダー:

- `x-openclaw-model: <provider/model-or-bare-id>` は、選択したエージェントのバックエンドモデルを上書きします。
- `x-openclaw-agent-id: <agentId>` は、互換性のための上書きとして引き続きサポートされます。
- `x-openclaw-session-key: <sessionKey>` は、セッションルーティングを完全に制御します。
- `x-openclaw-message-channel: <channel>` は、チャンネル対応のプロンプトとポリシー向けに合成 Ingress チャンネルコンテキストを設定します。

互換性エイリアスも引き続き受け入れられます。

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

## セッションの動作

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しいセッションキーが生成されます）。

リクエストに OpenAI の `user` 文字列が含まれている場合、Gateway はそこから安定したセッションキーを派生するため、繰り返しの呼び出しでエージェントセッションを共有できます。

## このサーフェスが重要な理由

これは、セルフホストのフロントエンドとツール向けに最も効果の高い互換性セットです。

- ほとんどの Open WebUI、LobeChat、LibreChat のセットアップは `/v1/models` を想定しています。
- 多くの RAG システムは `/v1/embeddings` を想定しています。
- 既存の OpenAI チャットクライアントは、通常 `/v1/chat/completions` から開始できます。
- よりエージェントネイティブなクライアントでは、`/v1/responses` を好むものが増えています。

## モデル一覧とエージェントルーティング

<AccordionGroup>
  <Accordion title="`/v1/models` は何を返しますか？">
    OpenClaw のエージェントターゲット一覧です。

    返される ID は、`openclaw`、`openclaw/default`、`openclaw/<agentId>` のエントリです。
    それらを OpenAI の `model` 値として直接使用してください。

  </Accordion>
  <Accordion title="`/v1/models` はエージェントまたはサブエージェントを一覧表示しますか？">
    バックエンドプロバイダーモデルやサブエージェントではなく、トップレベルのエージェントターゲットを一覧表示します。

    サブエージェントは内部の実行トポロジーのままです。疑似モデルとしては表示されません。

  </Accordion>
  <Accordion title="なぜ `openclaw/default` が含まれていますか？">
    `openclaw/default` は、設定済みのデフォルトエージェントの安定したエイリアスです。

    つまり、実際のデフォルトエージェント ID が環境間で変わっても、クライアントは予測可能な 1 つの ID を使い続けられます。

  </Accordion>
  <Accordion title="バックエンドモデルを上書きするにはどうすればよいですか？">
    `x-openclaw-model` を使用します。

    例:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    省略した場合、選択したエージェントは通常設定されたモデル選択で実行されます。

  </Accordion>
  <Accordion title="埋め込みはこの契約にどのように適合しますか？">
    `/v1/embeddings` は同じエージェントターゲット `model` ID を使用します。

    `model: "openclaw/default"` または `model: "openclaw/<agentId>"` を使用します。
    特定の埋め込みモデルが必要な場合は、`x-openclaw-model` で送信します。
    そのヘッダーがない場合、リクエストは選択したエージェントの通常の埋め込み設定に渡されます。

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
- macOS 上の Docker ベース URL: `http://host.docker.internal:18789/v1`
- API キー: 使用する Gateway ベアラートークン
- モデル: `openclaw/default`

想定される動作:

- `GET /v1/models` は `openclaw/default` を一覧表示する必要があります
- Open WebUI は `openclaw/default` をチャットモデル ID として使用する必要があります
- そのエージェントに対して特定のバックエンドプロバイダー/モデルを使いたい場合は、エージェントの通常のデフォルトモデルを設定するか、`x-openclaw-model` を送信します

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
- バックエンドプロバイダー/モデルの上書きは、OpenAI の `model` フィールドではなく `x-openclaw-model` に置きます。
- `/v1/embeddings` は、文字列または文字列の配列として `input` をサポートします。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [OpenAI](/ja-JP/providers/openai)
