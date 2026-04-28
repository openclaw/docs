---
read_when:
    - ID 認識型プロキシの背後で OpenClaw を実行する
    - OpenClaw の前段に Pomerium、Caddy、または nginx + OAuth を設定する
    - リバースプロキシ構成で WebSocket 1008 unauthorized エラーを修正する
    - HSTS やその他の HTTP ハードニングヘッダーをどこで設定するかを判断する
sidebarTitle: Trusted proxy auth
summary: 信頼できるリバースプロキシ（Pomerium、Caddy、nginx + OAuth）に Gateway 認証を委任する
title: 信頼済みプロキシ認証
x-i18n:
    generated_at: "2026-04-26T11:32:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**セキュリティ上重要な機能です。** このモードでは認証を完全にリバースプロキシに委任します。設定を誤ると、Gateway が未認可アクセスにさらされる可能性があります。有効化する前に、このページを注意深く読んでください。
</Warning>

## 使用する場面

次の場合は `trusted-proxy` 認証モードを使用してください。

- OpenClaw を **ID 認識型プロキシ**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）の背後で動かしている。
- プロキシがすべての認証を処理し、ヘッダー経由でユーザー ID を渡す。
- プロキシが Gateway への唯一の経路である Kubernetes またはコンテナ環境にいる。
- ブラウザが WS ペイロードにトークンを渡せないため、WebSocket の `1008 unauthorized` エラーに遭遇している。

## 使用しない場合

- プロキシがユーザー認証をしていない場合（単なる TLS 終端やロードバランサー）。
- プロキシをバイパスして Gateway に到達できる経路が少しでもある場合（ファイアウォールの穴、内部ネットワークアクセス）。
- プロキシが forwarded headers を正しく削除/上書きしているか確信がない場合。
- 個人の単一ユーザーアクセスだけが必要な場合（より簡単なセットアップとして Tailscale Serve + loopback を検討してください）。

## 仕組み

<Steps>
  <Step title="プロキシがユーザーを認証">
    リバースプロキシがユーザーを認証します（OAuth、OIDC、SAML など）。
  </Step>
  <Step title="プロキシが ID ヘッダーを追加">
    プロキシが認証済みユーザー ID を含むヘッダーを追加します（例: `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway が信頼済みソースを検証">
    OpenClaw は、リクエストが **信頼済みプロキシ IP**（`gateway.trustedProxies` で設定）から来たことを確認します。
  </Step>
  <Step title="Gateway が ID を抽出">
    OpenClaw は設定されたヘッダーからユーザー ID を抽出します。
  </Step>
  <Step title="認可">
    すべてのチェックに通ると、リクエストは認可されます。
  </Step>
</Steps>

## Control UI の pairing 動作

`gateway.auth.mode = "trusted-proxy"` が有効で、そのリクエストが trusted-proxy チェックに通る場合、Control UI の WebSocket セッションはデバイス pairing ID なしで接続できます。

影響:

- このモードでは、pairing は Control UI アクセスの主要なゲートではなくなります。
- 実効的なアクセス制御は、リバースプロキシの認証ポリシーと `allowUsers` になります。
- Gateway への ingress は、信頼済みプロキシ IP のみに必ず制限してください（`gateway.trustedProxies` + ファイアウォール）。

## 設定

```json5
{
  gateway: {
    // trusted-proxy 認証は、loopback ではない信頼済みプロキシソースからのリクエストを前提とします
    bind: "lan",

    // 重要: ここには自分のプロキシの IP のみを追加してください
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 認証済みユーザー ID を含むヘッダー（必須）
        userHeader: "x-forwarded-user",

        // 任意: 必ず存在しなければならないヘッダー（プロキシ検証）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 任意: 特定ユーザーのみに制限（空 = 全許可）
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**重要なランタイムルール**

- trusted-proxy 認証は、loopback ソースのリクエスト（`127.0.0.1`、`::1`、loopback CIDR）を拒否します。
- 同一ホストの loopback リバースプロキシは trusted-proxy 認証の条件を満たしません。
- 同一ホストの loopback プロキシ構成では、代わりに token/password 認証を使用するか、OpenClaw が検証できる loopback ではない信頼済みプロキシアドレスを経由させてください。
- loopback ではない Control UI デプロイでは、依然として明示的な `gateway.controlUi.allowedOrigins` が必要です。
- **Forwarded-header の証拠は loopback ローカリティより優先されます。** リクエストが loopback で到着しても、`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` ヘッダーが非ローカルなオリジンを指している場合、その証拠によって loopback ローカリティの主張は無効になります。リクエストは pairing、trusted-proxy 認証、Control UI デバイス ID ゲートにおいてリモートとして扱われます。これにより、同一ホストの loopback プロキシが forwarded-header の ID を trusted-proxy 認証へ偽装することを防ぎます。
</Warning>

### 設定リファレンス

<ParamField path="gateway.trustedProxies" type="string[]" required>
  信頼するプロキシ IP アドレスの配列です。それ以外の IP からのリクエストは拒否されます。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  `"trusted-proxy"` である必要があります。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  認証済みユーザー ID を含むヘッダー名です。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  リクエストが信頼されるために追加で存在しなければならないヘッダーです。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  ユーザー ID の allowlist です。空の場合は、認証済みのすべてのユーザーを許可します。
</ParamField>

## TLS 終端と HSTS

TLS 終端ポイントは 1 か所にし、HSTS もそこで適用してください。

<Tabs>
  <Tab title="プロキシ TLS 終端（推奨）">
    リバースプロキシが `https://control.example.com` の HTTPS を処理している場合、そのドメインに対する `Strict-Transport-Security` はプロキシ側で設定してください。

    - インターネット向けデプロイに適しています。
    - 証明書と HTTP ハードニングポリシーを 1 か所にまとめられます。
    - OpenClaw はプロキシの背後で loopback HTTP のままにできます。

    ヘッダー値の例:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS 終端">
    OpenClaw 自体が HTTPS を直接提供する場合（TLS 終端プロキシなし）は、次を設定してください。

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

    `strictTransportSecurity` は、文字列のヘッダー値、または明示的に無効化する `false` を受け付けます。

  </Tab>
</Tabs>

### 段階的導入ガイダンス

- まず短い max age（例: `max-age=300`）で開始し、トラフィックを検証してください。
- 十分な確信が得られてから、長期間の値（例: `max-age=31536000`）へ増やしてください。
- すべてのサブドメインが HTTPS 対応済みの場合のみ `includeSubDomains` を追加してください。
- preload は、ドメイン全体で preload 要件を意図的に満たす場合にのみ使用してください。
- loopback のみのローカル開発では HSTS の恩恵はありません。

## プロキシ設定例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium は `x-pomerium-claim-email`（または他の claim ヘッダー）に ID を渡し、`x-pomerium-jwt-assertion` に JWT を渡します。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium の IP
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
  <Accordion title="OAuth 付き Caddy">
    `caddy-security` Plugin を使った Caddy は、ユーザーを認証し、ID ヘッダーを渡せます。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar プロキシ IP
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
    oauth2-proxy はユーザーを認証し、`x-auth-request-email` に ID を渡します。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy の IP
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
  <Accordion title="forward auth 付き Traefik">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik コンテナ IP
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

## 混在 token 設定

OpenClaw は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）と `trusted-proxy` モードが同時に有効な曖昧な設定を拒否します。token 設定が混在すると、loopback リクエストが誤った認証経路で黙って認証される可能性があります。

起動時に `mixed_trusted_proxy_token` エラーが表示された場合:

- trusted-proxy モードを使うなら共有 token を削除する、または
- token ベース認証を意図しているなら `gateway.auth.mode` を `"token"` に切り替える

loopback の trusted-proxy 認証も fail closed です。同一ホストの呼び出し元は、黙って認証されるのではなく、信頼済みプロキシ経由で設定済み ID ヘッダーを渡す必要があります。

## オペレータースコープ ヘッダー

trusted-proxy 認証は **ID を持つ** HTTP モードなので、呼び出し元は任意で `x-openclaw-scopes` によりオペレータースコープを宣言できます。

例:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

動作:

- ヘッダーが存在する場合、OpenClaw は宣言されたスコープ集合を尊重します。
- ヘッダーが存在するが空の場合、そのリクエストは **オペレータースコープなし** を宣言します。
- ヘッダーが存在しない場合、通常の ID 付き HTTP API は標準のデフォルト オペレータースコープ集合にフォールバックします。
- Gateway 認証 **plugin HTTP ルート** はデフォルトでより狭く、`x-openclaw-scopes` が存在しない場合、そのランタイムスコープは `operator.write` にフォールバックします。
- ブラウザ起点の HTTP リクエストは、trusted-proxy 認証が成功した後でも、`gateway.controlUi.allowedOrigins`（または意図的な Host-header フォールバックモード）を通過する必要があります。

実務上のルール: trusted-proxy リクエストをデフォルトより狭い権限にしたい場合、または gateway-auth plugin ルートに write スコープより強い権限が必要な場合は、`x-openclaw-scopes` を明示的に送ってください。

## セキュリティチェックリスト

trusted-proxy 認証を有効にする前に、次を確認してください。

- [ ] **プロキシが唯一の経路である**: Gateway ポートは、プロキシ以外のすべてからファイアウォールで遮断されている。
- [ ] **trustedProxies が最小である**: サブネット全体ではなく、実際のプロキシ IP のみ。
- [ ] **loopback プロキシソースがない**: trusted-proxy 認証は loopback ソースのリクエストに対して fail closed になる。
- [ ] **プロキシがヘッダーを削除する**: プロキシがクライアントからの `x-forwarded-*` ヘッダーを追記ではなく上書きしている。
- [ ] **TLS 終端**: プロキシが TLS を処理しており、ユーザーは HTTPS 経由で接続している。
- [ ] **allowedOrigins が明示されている**: loopback ではない Control UI で明示的な `gateway.controlUi.allowedOrigins` を使っている。
- [ ] **allowUsers が設定されている**（推奨）: 認証された誰でも許可するのではなく、既知のユーザーのみに制限している。
- [ ] **token 設定が混在していない**: `gateway.auth.token` と `gateway.auth.mode: "trusted-proxy"` を同時に設定していない。

## セキュリティ監査

`openclaw security audit` は、trusted-proxy 認証を **critical** 重大度の検出として報告します。これは意図的なもので、セキュリティをプロキシ設定に委任していることを思い出させるためです。

監査で確認される内容:

- 基本の `gateway.trusted_proxy_auth` 警告/critical リマインダー
- `trustedProxies` 設定の欠如
- `userHeader` 設定の欠如
- 空の `allowUsers`（認証済みの任意のユーザーを許可）
- 公開された Control UI 画面におけるワイルドカードまたは欠如したブラウザオリジンポリシー

## トラブルシューティング

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    リクエストが `gateway.trustedProxies` 内の IP から来ていません。確認してください:

    - プロキシ IP は正しいですか？（Docker コンテナ IP は変わることがあります。）
    - プロキシの前にロードバランサーがありますか？
    - 実際の IP を確認するには `docker inspect` または `kubectl get pods -o wide` を使用してください。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw が loopback ソースの trusted-proxy リクエストを拒否しました。

    確認してください:

    - プロキシは `127.0.0.1` / `::1` から接続していますか？
    - 同一ホストの loopback リバースプロキシで trusted-proxy 認証を使おうとしていますか？

    修正方法:

    - 同一ホストの loopback プロキシ構成では token/password 認証を使う、または
    - loopback ではない信頼済みプロキシアドレスを経由させ、その IP を `gateway.trustedProxies` に保持してください。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    ユーザーヘッダーが空、または存在しませんでした。確認してください:

    - プロキシは ID ヘッダーを渡すよう設定されていますか？
    - ヘッダー名は正しいですか？（大文字小文字は区別しませんが、スペルは重要です）
    - ユーザーは実際にプロキシで認証されていますか？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    必須ヘッダーが存在しませんでした。確認してください:

    - その特定ヘッダーに対するプロキシ設定
    - チェーンのどこかでヘッダーが削除されていないか

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    ユーザーは認証されていますが、`allowUsers` に含まれていません。追加するか、allowlist を削除してください。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    trusted-proxy 認証は成功しましたが、ブラウザの `Origin` ヘッダーが Control UI の origin チェックを通過しませんでした。

    確認してください:

    - `gateway.controlUi.allowedOrigins` に正確なブラウザ origin が含まれている
    - 意図的に全許可動作を望むのでない限り、ワイルドカード origin に依存していない
    - Host-header フォールバックモードを意図的に使う場合、`gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` が明示的に設定されている

  </Accordion>
  <Accordion title="WebSocket がまだ失敗する">
    プロキシが次を満たしていることを確認してください:

    - WebSocket upgrade をサポートしている（`Upgrade: websocket`, `Connection: upgrade`）。
    - WebSocket upgrade リクエストでも ID ヘッダーを渡している（HTTP だけでなく）。
    - WebSocket 接続用に別の認証経路を持っていない。

  </Accordion>
</AccordionGroup>

## token 認証からの移行

token 認証から trusted-proxy へ移行する場合:

<Steps>
  <Step title="プロキシを設定">
    ユーザーを認証し、ヘッダーを渡すようにプロキシを設定します。
  </Step>
  <Step title="プロキシを個別にテスト">
    プロキシ設定を個別にテストします（ヘッダー付き curl）。
  </Step>
  <Step title="OpenClaw config を更新">
    trusted-proxy 認証で OpenClaw config を更新します。
  </Step>
  <Step title="Gateway を再起動">
    Gateway を再起動します。
  </Step>
  <Step title="WebSocket をテスト">
    Control UI からの WebSocket 接続をテストします。
  </Step>
  <Step title="監査">
    `openclaw security audit` を実行し、検出結果を確認します。
  </Step>
</Steps>

## 関連

- [Configuration](/ja-JP/gateway/configuration) — config リファレンス
- [Remote access](/ja-JP/gateway/remote) — その他のリモートアクセス パターン
- [Security](/ja-JP/gateway/security) — 完全なセキュリティガイド
- [Tailscale](/ja-JP/gateway/tailscale) — tailnet 専用アクセス向けのより簡単な代替手段
