---
read_when:
    - OpenAI Chat Completionsを前提とするツールを統合する
summary: GatewayからOpenAI互換の `/v1/chat/completions` HTTPエンドポイントを公開する
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-04-24T04:58:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions（HTTP）

OpenClawのGatewayは、小規模なOpenAI互換のChat Completionsエンドポイントを提供できます。

このエンドポイントは**デフォルトで無効**です。まず設定で有効にしてください。

- `POST /v1/chat/completions`
- Gatewayと同じポート（WS + HTTP多重化）: `http://<gateway-host>:<port>/v1/chat/completions`

GatewayのOpenAI互換HTTPサーフェスを有効にすると、次も提供されます:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

内部的には、リクエストは通常のGateway agent実行（`openclaw agent` と同じコードパス）として処理されるため、ルーティング/権限/設定はGatewayと一致します。

## 認証

Gateway auth設定を使います。

一般的なHTTP認証経路:

- shared-secret認証（`gateway.auth.mode="token"` または `"password"`）:
  `Authorization: Bearer <token-or-password>`
- 信頼されたidentity付きHTTP認証（`gateway.auth.mode="trusted-proxy"`）:
  設定済みのidentity-aware proxyを経由し、必要なidentityヘッダーを注入させる
- プライベート受信のオープン認証（`gateway.auth.mode="none"`）:
  authヘッダー不要

注記:

- `gateway.auth.mode="token"` の場合、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使います。
- `gateway.auth.mode="password"` の場合、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使います。
- `gateway.auth.mode="trusted-proxy"` の場合、HTTPリクエストは設定済みのloopback外trusted proxyソースから来る必要があります。同一ホストのloopback proxyではこのモードを満たしません。
- `gateway.auth.rateLimit` が設定されており、認証失敗が多すぎる場合、エンドポイントは `Retry-After` 付きで `429` を返します。

## セキュリティ境界（重要）

このエンドポイントは、このgatewayインスタンスに対する**完全なoperatorアクセス**のサーフェスとして扱ってください。

- ここでのHTTP bearer認証は、狭いユーザー単位スコープモデルではありません。
- このエンドポイント用の有効なGateway token/passwordは、オーナー/operator認証情報として扱う必要があります。
- リクエストは、信頼されたoperatorアクションと同じコントロールプレーンagentパスを通って実行されます。
- このエンドポイントには、オーナー以外/ユーザーごとの独立したツール境界はありません。ここでGateway authを通過した呼び出し元は、このgatewayに対する信頼されたoperatorとしてOpenClawに扱われます。
- shared-secret認証モード（`token` と `password`）では、呼び出し元がより狭い `x-openclaw-scopes` ヘッダーを送っても、エンドポイントは通常の完全operatorデフォルトを復元します。
- trusted identity付きHTTPモード（たとえばtrusted proxy認証や、プライベート受信での `gateway.auth.mode="none"`）では、`x-openclaw-scopes` が存在すればそれを尊重し、なければ通常のoperatorデフォルトスコープセットにフォールバックします。
- 対象agentポリシーが機微なツールを許可している場合、このエンドポイントはそれらを使用できます。
- このエンドポイントはloopback/tailnet/private ingressのみに置き、公開インターネットへ直接公開しないでください。

認証マトリクス:

- `gateway.auth.mode="token"` または `"password"` + `Authorization: Bearer ...`
  - 共有gateway operator secretの保有を証明します
  - より狭い `x-openclaw-scopes` は無視します
  - 完全なデフォルトoperatorスコープセットを復元します:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - このエンドポイント上のチャットターンをowner-senderターンとして扱います
- trusted identity付きHTTPモード（たとえばtrusted proxy認証、またはプライベート受信での `gateway.auth.mode="none"`）
  - 何らかの外側の信頼されたidentityまたはデプロイ境界で認証します
  - ヘッダーが存在する場合は `x-openclaw-scopes` を尊重します
  - ヘッダーがない場合は通常のoperatorデフォルトスコープセットにフォールバックします
  - 呼び出し元が明示的にscopesを狭め、`operator.admin` を省略した場合にのみownerセマンティクスを失います

[セキュリティ](/ja-JP/gateway/security) と [Remote access](/ja-JP/gateway/remote) を参照してください。

## agent-firstモデル契約

OpenClawは、OpenAIの `model` フィールドを、生のプロバイダモデルIDではなく**agentターゲット**として扱います。

- `model: "openclaw"` は、設定済みのデフォルトagentへルーティングします。
- `model: "openclaw/default"` も、設定済みのデフォルトagentへルーティングします。
- `model: "openclaw/<agentId>"` は、特定のagentへルーティングします。

任意のリクエストヘッダー:

- `x-openclaw-model: <provider/model-or-bare-id>` は、選択されたagentのバックエンドモデルを上書きします。
- `x-openclaw-agent-id: <agentId>` も互換上書きとして引き続きサポートされます。
- `x-openclaw-session-key: <sessionKey>` は、セッションルーティングを完全に制御します。
- `x-openclaw-message-channel: <channel>` は、チャネル認識プロンプトとポリシーのために、合成された受信チャネルコンテキストを設定します。

互換エイリアスも引き続き受け付けます:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## エンドポイントを有効にする

`gateway.http.endpoints.chatCompletions.enabled` を `true` に設定します:

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

## エンドポイントを無効にする

`gateway.http.endpoints.chatCompletions.enabled` を `false` に設定します:

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

デフォルトでは、このエンドポイントは**リクエストごとにステートレス**です（呼び出しごとに新しいsession keyが生成されます）。

リクエストにOpenAIの `user` 文字列が含まれている場合、Gatewayはそこから安定したsession keyを導出するため、繰り返し呼び出しでagent sessionを共有できます。

## このサーフェスが重要な理由

これは、セルフホストのフロントエンドやツール向けに最も効果の高い互換セットです:

- 多くのOpen WebUI、LobeChat、LibreChat構成は `/v1/models` を前提としています。
- 多くのRAGシステムは `/v1/embeddings` を前提としています。
- 既存のOpenAIチャットクライアントは通常、`/v1/chat/completions` から開始できます。
- よりagent-nativeなクライアントは、ますます `/v1/responses` を好むようになっています。

## モデル一覧とagentルーティング

<AccordionGroup>
  <Accordion title="`/v1/models` は何を返しますか？">
    OpenClawのagentターゲット一覧です。

    返されるidは `openclaw`、`openclaw/default`、`openclaw/<agentId>` の各エントリです。
    OpenAIの `model` 値としてそのまま使ってください。

  </Accordion>
  <Accordion title="`/v1/models` はagentを一覧表示しますか、それともsub-agentですか？">
    一覧表示するのはトップレベルのagentターゲットであり、バックエンドプロバイダモデルでもsub-agentでもありません。

    sub-agentは内部実行トポロジーのままです。擬似モデルとしては表示されません。

  </Accordion>
  <Accordion title="なぜ `openclaw/default` が含まれているのですか？">
    `openclaw/default` は、設定済みデフォルトagentに対する安定したエイリアスです。

    つまり、実際のデフォルトagent idが環境によって変わっても、クライアントは予測可能な1つのidを使い続けられます。

  </Accordion>
  <Accordion title="バックエンドモデルを上書きするにはどうすればよいですか？">
    `x-openclaw-model` を使ってください。

    例:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    これを省略すると、選択されたagentは通常の設定済みモデル選択で実行されます。

  </Accordion>
  <Accordion title="埋め込みはこの契約にどう適合しますか？">
    `/v1/embeddings` は同じagentターゲット `model` idを使います。

    `model: "openclaw/default"` または `model: "openclaw/<agentId>"` を使ってください。
    特定の埋め込みモデルが必要な場合は、それを `x-openclaw-model` に送信します。
    このヘッダーがなければ、リクエストは選択されたagentの通常の埋め込み設定にそのまま渡されます。

  </Accordion>
</AccordionGroup>

## ストリーミング（SSE）

SSEを受け取るには `stream: true` を設定します:

- `Content-Type: text/event-stream`
- 各イベント行は `data: <json>`
- ストリームは `data: [DONE]` で終了します

## Open WebUI クイックセットアップ

基本的なOpen WebUI接続では:

- Base URL: `http://127.0.0.1:18789/v1`
- macOS上のDocker用Base URL: `http://host.docker.internal:18789/v1`
- API key: あなたのGateway bearer token
- モデル: `openclaw/default`

期待される動作:

- `GET /v1/models` で `openclaw/default` が一覧表示されること
- Open WebUI がチャットモデルidとして `openclaw/default` を使うこと
- そのagentに対して特定のバックエンドprovider/modelを使いたい場合は、agentの通常のデフォルトモデルを設定するか、`x-openclaw-model` を送信すること

簡易スモークテスト:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

これが `openclaw/default` を返せば、ほとんどのOpen WebUI構成は同じbase URLとtokenで接続できます。

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

モデル一覧:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

1つのモデルを取得する:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

埋め込みを作成する:

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

- `/v1/models` が返すのは生のプロバイダカタログではなく、OpenClawのagentターゲットです。
- `openclaw/default` は常に存在するため、1つの安定したidを環境間で使えます。
- バックエンドprovider/modelの上書きは、OpenAIの `model` フィールドではなく `x-openclaw-model` に指定します。
- `/v1/embeddings` は、文字列または文字列配列としての `input` をサポートします。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [OpenAI](/ja-JP/providers/openai)
