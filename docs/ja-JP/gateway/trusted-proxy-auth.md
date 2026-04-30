---
read_when:
    - ID 認識型プロキシの背後で OpenClaw を実行する
    - OpenClaw の前段に OAuth 対応の Pomerium、Caddy、または nginx を設定する
    - リバースプロキシ構成での WebSocket 1008 未認可エラーの修正
    - HSTS とその他の HTTP セキュリティ強化ヘッダーを設定する場所を決める
sidebarTitle: Trusted proxy auth
summary: Gateway 認証を信頼済みのリバースプロキシ（Pomerium、Caddy、nginx + OAuth）に委任する
title: 信頼済みプロキシ認証
x-i18n:
    generated_at: "2026-04-30T05:17:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**セキュリティ上注意が必要な機能です。** このモードでは、認証を完全にリバースプロキシへ委任します。設定を誤ると、Gateway が不正アクセスにさらされる可能性があります。有効にする前に、このページを注意深く読んでください。
</Warning>

## 使用する場面

次の場合は `trusted-proxy` 認証モードを使用します。

- OpenClaw を **ID 認識プロキシ**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）の背後で実行している。
- プロキシがすべての認証を処理し、ヘッダー経由でユーザー ID を渡す。
- Kubernetes またはコンテナ環境で、プロキシが Gateway への唯一の経路である。
- ブラウザーが WS ペイロードでトークンを渡せないため、WebSocket `1008 unauthorized` エラーが発生している。

## 使用しない場面

- プロキシがユーザーを認証しない場合（単なる TLS 終端またはロードバランサー）。
- プロキシを迂回して Gateway に到達できる経路が少しでもある場合（ファイアウォールの穴、内部ネットワークアクセス）。
- プロキシが転送ヘッダーを正しく削除または上書きしているか不明な場合。
- 個人の単一ユーザーアクセスだけが必要な場合（より簡単な設定として Tailscale Serve + ループバックを検討してください）。

## 仕組み

<Steps>
  <Step title="プロキシがユーザーを認証する">
    リバースプロキシがユーザーを認証します（OAuth、OIDC、SAML など）。
  </Step>
  <Step title="プロキシが ID ヘッダーを追加する">
    プロキシが認証済みユーザー ID を含むヘッダーを追加します（例: `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway が信頼済み送信元を検証する">
    OpenClaw は、リクエストが **信頼済みプロキシ IP**（`gateway.trustedProxies` で設定）から来たことを確認します。
  </Step>
  <Step title="Gateway が ID を抽出する">
    OpenClaw は設定されたヘッダーからユーザー ID を抽出します。
  </Step>
  <Step title="認可する">
    すべてのチェックに通ると、リクエストは認可されます。
  </Step>
</Steps>

## Control UI ペアリングの動作

`gateway.auth.mode = "trusted-proxy"` が有効で、リクエストが trusted-proxy チェックを通過した場合、Control UI WebSocket セッションはデバイスペアリング ID なしで接続できます。

影響:

- このモードでは、ペアリングは Control UI アクセスの主なゲートではなくなります。
- リバースプロキシの認証ポリシーと `allowUsers` が実効的なアクセス制御になります。
- Gateway への入口は信頼済みプロキシ IP のみに制限してください（`gateway.trustedProxies` + ファイアウォール）。

## 設定

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**重要なランタイムルール**

- Trusted-proxy 認証は、デフォルトでループバック送信元のリクエスト（`127.0.0.1`、`::1`、ループバック CIDR）を拒否します。
- 同一ホストのループバックリバースプロキシは、`gateway.auth.trustedProxy.allowLoopback = true` を明示的に設定し、ループバックアドレスを `gateway.trustedProxies` に含めない限り、trusted-proxy 認証を満たしません。
- `allowLoopback` は、Gateway ホスト上のローカルプロセスをリバースプロキシと同じ程度に信頼します。Gateway が引き続き直接のリモートアクセスからファイアウォールで保護され、ローカルプロキシがクライアント提供の ID ヘッダーを削除または上書きする場合にのみ有効にしてください。
- リバースプロキシを経由しない内部 Gateway クライアントは、trusted-proxy ID ヘッダーではなく、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を使用してください。
- 非ループバックの Control UI デプロイでは、引き続き明示的な `gateway.controlUi.allowedOrigins` が必要です。
- **転送ヘッダーの証拠は、ローカル直接フォールバックにおいてループバックのローカル性より優先されます。** リクエストがループバックで到着しても、非ローカル送信元を指す `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` ヘッダーを含む場合、その証拠によりローカル直接パスワードフォールバックとデバイス ID ゲートの対象外になります。`allowLoopback: true` の場合、trusted-proxy 認証はそのリクエストを同一ホストプロキシリクエストとして受け入れられますが、`requiredHeaders` と `allowUsers` は引き続き適用されます。

</Warning>

### 設定リファレンス

<ParamField path="gateway.trustedProxies" type="string[]" required>
  信頼するプロキシ IP アドレスの配列。他の IP からのリクエストは拒否されます。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  `"trusted-proxy"` である必要があります。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  認証済みユーザー ID を含むヘッダー名。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  リクエストを信頼するために存在している必要がある追加ヘッダー。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  ユーザー ID の許可リスト。空の場合、すべての認証済みユーザーを許可します。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  同一ホストのループバックリバースプロキシのサポートをオプトインします。デフォルトは `false` です。
</ParamField>

<Warning>
ローカルリバースプロキシを意図した信頼境界にする場合にのみ、`allowLoopback` を有効にしてください。Gateway に接続できる任意のローカルプロセスは、プロキシ ID ヘッダーの送信を試みることができます。そのため、Gateway への直接アクセスはホスト内に限定し、`x-forwarded-proto` のようなプロキシ所有のヘッダー、またはプロキシが対応している場合は署名付きアサーションヘッダーを要求してください。
</Warning>

## TLS 終端と HSTS

TLS 終端点を 1 つ使用し、そこで HSTS を適用します。

<Tabs>
  <Tab title="プロキシ TLS 終端（推奨）">
    リバースプロキシが `https://control.example.com` の HTTPS を処理する場合、そのドメインの `Strict-Transport-Security` をプロキシで設定します。

    - インターネット公開デプロイに適しています。
    - 証明書と HTTP 強化ポリシーを 1 か所に保てます。
    - OpenClaw はプロキシ背後のループバック HTTP のままにできます。

    ヘッダー値の例:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS 終端">
    OpenClaw 自体が HTTPS を直接提供する場合（TLS 終端プロキシなし）、次を設定します。

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` は文字列ヘッダー値、または明示的に無効化する `false` を受け付けます。

  </Tab>
</Tabs>

### ロールアウトガイダンス

- トラフィックを検証している間は、まず短い max age（例: `max-age=300`）から始めます。
- 十分に確信が持てた後でのみ、長期間の値（例: `max-age=31536000`）へ増やします。
- すべてのサブドメインが HTTPS 対応済みの場合にのみ、`includeSubDomains` を追加します。
- ドメインセット全体で preload 要件を意図的に満たす場合にのみ、プリロードを使用します。
- ループバック専用のローカル開発では、HSTS の利点はありません。

## プロキシ設定例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium は `x-pomerium-claim-email`（または他のクレームヘッダー）で ID を渡し、`x-pomerium-jwt-assertion` で JWT を渡します。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Pomerium 設定スニペット:

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="OAuth を使用した Caddy">
    `caddy-security` Plugin を使用した Caddy は、ユーザーを認証して ID ヘッダーを渡せます。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Caddyfile スニペット:

    ```
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy はユーザーを認証し、`x-auth-request-email` で ID を渡します。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    nginx 設定スニペット:

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="forward auth を使用した Traefik">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 混在トークン設定

OpenClaw は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）と `trusted-proxy` モードの両方が同時に有効な曖昧な設定を拒否します。混在トークン設定では、ループバックリクエストが誤った認証経路で暗黙的に認証される可能性があります。

起動時に `mixed_trusted_proxy_token` エラーが表示される場合:

- trusted-proxy モードを使用する場合は共有トークンを削除する、または
- トークンベースの認証を意図している場合は、`gateway.auth.mode` を `"token"` に切り替える。

ループバックの trusted-proxy ID ヘッダーは引き続きフェイルクローズします。同一ホストの呼び出し元がプロキシユーザーとして暗黙的に認証されることはありません。プロキシを迂回する内部 OpenClaw 呼び出し元は、代わりに `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` で認証できます。trusted-proxy モードでは、トークンフォールバックは意図的にサポートされていません。

## オペレータースコープヘッダー

Trusted-proxy 認証は **ID を伴う** HTTP モードであるため、呼び出し元は任意で `x-openclaw-scopes` によりオペレータースコープを宣言できます。

例:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

動作:

- ヘッダーが存在する場合、OpenClaw は宣言されたスコープセットを尊重します。
- ヘッダーが存在するが空の場合、リクエストはオペレータースコープが **ない** ことを宣言します。
- ヘッダーが存在しない場合、通常の ID を伴う HTTP API は標準のオペレーター既定スコープセットにフォールバックします。
- Gateway 認証の **Plugin HTTP ルート** はデフォルトでより狭くなります。`x-openclaw-scopes` が存在しない場合、そのランタイムスコープは `operator.write` にフォールバックします。
- ブラウザー送信元の HTTP リクエストは、trusted-proxy 認証に成功した後でも、`gateway.controlUi.allowedOrigins`（または意図的な Host ヘッダーフォールバックモード）を通過する必要があります。

実用的なルール: trusted-proxy リクエストをデフォルトより狭くしたい場合、または Gateway 認証 Plugin ルートで write スコープより強いものが必要な場合は、`x-openclaw-scopes` を明示的に送信してください。

## セキュリティチェックリスト

trusted-proxy 認証を有効にする前に、次を確認してください。

- [ ] **プロキシが唯一の経路**: Gateway ポートは、プロキシ以外のすべてからファイアウォールで遮断されています。
- [ ] **trustedProxies は最小限**: サブネット全体ではなく、実際のプロキシ IP のみです。
- [ ] **ループバックのプロキシソースは意図的**: trusted-proxy 認証は、同一ホストのプロキシ向けに `gateway.auth.trustedProxy.allowLoopback` が明示的に有効化されていない限り、ループバックソースのリクエストをフェイルクローズします。
- [ ] **プロキシがヘッダーを除去**: プロキシはクライアントからの `x-forwarded-*` ヘッダーを追記ではなく上書きします。
- [ ] **TLS 終端**: プロキシが TLS を処理し、ユーザーは HTTPS 経由で接続します。
- [ ] **allowedOrigins は明示的**: 非ループバックのコントロール UI は明示的な `gateway.controlUi.allowedOrigins` を使用します。
- [ ] **allowUsers が設定されている**（推奨）: 認証済みの全員を許可するのではなく、既知のユーザーに制限します。
- [ ] **トークン設定が混在していない**: `gateway.auth.token` と `gateway.auth.mode: "trusted-proxy"` の両方を設定しないでください。
- [ ] **ローカルパスワードのフォールバックは非公開**: 内部の直接呼び出し元向けに `gateway.auth.password` を構成する場合は、非プロキシのリモートクライアントが直接到達できないように Gateway ポートをファイアウォールで遮断してください。

## セキュリティ監査

`openclaw security audit` は trusted-proxy 認証に **critical** 重大度の検出結果を付けます。これは意図的です。セキュリティをプロキシ設定に委任していることを思い出すためのものです。

監査では次をチェックします。

- 基本の `gateway.trusted_proxy_auth` warning/critical リマインダー
- `trustedProxies` 構成の欠落
- `userHeader` 構成の欠落
- 空の `allowUsers`（認証済みユーザーをすべて許可）
- 同一ホストのプロキシソース向けに有効化された `allowLoopback`
- 公開されたコントロール UI サーフェスでのワイルドカードまたは欠落したブラウザーオリジンポリシー

## トラブルシューティング

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    リクエストが `gateway.trustedProxies` 内の IP から来ていません。確認してください。

    - プロキシ IP は正しいですか？（Docker コンテナーの IP は変わることがあります。）
    - プロキシの前にロードバランサーがありますか？
    - 実際の IP を見つけるには `docker inspect` または `kubectl get pods -o wide` を使用してください。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw はループバックソースの trusted-proxy リクエストを拒否しました。

    確認してください。

    - プロキシは `127.0.0.1` / `::1` から接続していますか？
    - 同一ホストのループバックリバースプロキシで trusted-proxy 認証を使おうとしていますか？

    修正:

    - プロキシを経由しない内部の同一ホストクライアントには、トークン/パスワード認証を優先するか、
    - 非ループバックの信頼済みプロキシアドレスを経由し、その IP を `gateway.trustedProxies` に保持するか、
    - 意図的な同一ホストのリバースプロキシでは、`gateway.auth.trustedProxy.allowLoopback = true` を設定し、ループバックアドレスを `gateway.trustedProxies` に保持し、プロキシが ID ヘッダーを除去または上書きすることを確認してください。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    ユーザーヘッダーが空、または欠落しています。確認してください。

    - プロキシは ID ヘッダーを渡すように構成されていますか？
    - ヘッダー名は正しいですか？（大文字小文字は区別されませんが、スペルは重要です）
    - ユーザーは実際にプロキシで認証されていますか？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    必須ヘッダーが存在しませんでした。確認してください。

    - その特定のヘッダーに関するプロキシ構成。
    - チェーン内のどこかでヘッダーが除去されていないか。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    ユーザーは認証されていますが、`allowUsers` に含まれていません。追加するか、許可リストを削除してください。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy 認証は成功しましたが、ブラウザーの `Origin` ヘッダーがコントロール UI のオリジンチェックを通過しませんでした。

    確認してください。

    - `gateway.controlUi.allowedOrigins` に正確なブラウザーオリジンが含まれている。
    - allow-all 動作を意図的に望んでいる場合を除き、ワイルドカードオリジンに依存していない。
    - Host ヘッダーのフォールバックモードを意図的に使用する場合は、`gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` が意図的に設定されている。

  </Accordion>
  <Accordion title="WebSocket still failing">
    プロキシが次を満たしていることを確認してください。

    - WebSocket アップグレードをサポートしている（`Upgrade: websocket`、`Connection: upgrade`）。
    - WebSocket アップグレードリクエストで ID ヘッダーを渡している（HTTP だけではない）。
    - WebSocket 接続用に別の認証パスを持っていない。

  </Accordion>
</AccordionGroup>

## トークン認証からの移行

トークン認証から trusted-proxy に移行する場合:

<Steps>
  <Step title="Configure the proxy">
    ユーザーを認証し、ヘッダーを渡すようにプロキシを構成します。
  </Step>
  <Step title="Test the proxy independently">
    プロキシ設定を独立してテストします（ヘッダー付きの curl）。
  </Step>
  <Step title="Update OpenClaw config">
    trusted-proxy 認証で OpenClaw 構成を更新します。
  </Step>
  <Step title="Restart the Gateway">
    Gateway を再起動します。
  </Step>
  <Step title="Test WebSocket">
    コントロール UI から WebSocket 接続をテストします。
  </Step>
  <Step title="Audit">
    `openclaw security audit` を実行し、検出結果を確認します。
  </Step>
</Steps>

## 関連

- [構成](/ja-JP/gateway/configuration) — 構成リファレンス
- [リモートアクセス](/ja-JP/gateway/remote) — その他のリモートアクセスパターン
- [セキュリティ](/ja-JP/gateway/security) — 完全なセキュリティガイド
- [Tailscale](/ja-JP/gateway/tailscale) — tailnet 専用アクセス向けのよりシンプルな代替手段
