---
read_when:
    - ID 認識プロキシの背後で OpenClaw を実行する
    - OpenClaw の前段に OAuth 付きの Pomerium、Caddy、または nginx を設定する
    - リバースプロキシ構成で WebSocket 1008 unauthorized エラーを修正する
    - HSTS およびその他の HTTP 強化ヘッダーを設定する場所の決定
sidebarTitle: Trusted proxy auth
summary: Gateway認証を信頼済みのリバースプロキシ（Pomerium、Caddy、nginx + OAuth）に委任する
title: 信頼済みプロキシ認証
x-i18n:
    generated_at: "2026-07-05T11:29:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**セキュリティ上重要な機能です。** このモードでは認証を完全にリバースプロキシへ委任します。設定を誤ると、Gateway が不正アクセスにさらされる可能性があります。有効化する前に、このページを注意深く読んでください。
</Warning>

## 使用する場合

- OpenClaw を **ID 認識プロキシ**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）の背後で実行している。
- プロキシがすべての認証を処理し、ヘッダー経由でユーザー ID を渡す。
- Kubernetes またはコンテナ環境で、プロキシが Gateway への唯一の経路になっている。
- ブラウザーが WS ペイロードでトークンを渡せないため、WebSocket `1008 unauthorized` エラーが発生している。

## 使用しない場合

- プロキシがユーザーを認証していない（単なる TLS ターミネーターまたはロードバランサー）。
- プロキシを迂回して Gateway に到達できる経路がある（ファイアウォールの穴、内部ネットワークアクセス）。
- プロキシが転送ヘッダーを正しく削除または上書きしているか不明。
- 個人の単一ユーザーアクセスだけが必要（代わりに Tailscale Serve + loopback を検討）。

## 仕組み

<Steps>
  <Step title="Proxy authenticates the user">
    リバースプロキシがユーザーを認証します（OAuth、OIDC、SAML など）。
  </Step>
  <Step title="Proxy adds an identity header">
    プロキシが、認証済みユーザー ID を含むヘッダーを追加します（例: `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw は、リクエストが **信頼済みプロキシ IP**（`gateway.trustedProxies`）から来ており、Gateway 自身の loopback またはローカルインターフェースアドレスではないことを確認します。
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw は必須ヘッダーを読み取り、続いて設定済みヘッダーからユーザー ID を読み取ります。
  </Step>
  <Step title="Authorize">
    すべてのチェックに通り、ユーザーが `allowUsers`（設定されている場合）を通過すると、リクエストは認可されます。
  </Step>
</Steps>

## 設定

```json5
{
  gateway: {
    // Trusted-proxy auth expects the proxy's source IP to be non-loopback by default
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
**ランタイムルール（評価順）**

1. リクエストの送信元 IP は `gateway.trustedProxies`（CIDR 対応）に一致している必要があります。一致しない場合は拒否されます（`trusted_proxy_untrusted_source`）。
2. loopback 送信元のリクエスト（`127.0.0.1`、`::1`）は、`gateway.auth.trustedProxy.allowLoopback = true` で、かつ loopback アドレスも `trustedProxies` に含まれていない限り拒否されます（`trusted_proxy_loopback_source`）。このチェックはヘッダーチェックより前に実行されるため、必須ヘッダーも欠落していても、loopback 送信元はこの理由で失敗します。
3. Gateway ホスト自身のローカルネットワークインターフェースアドレスのいずれかに一致する非 loopback 送信元は、なりすまし防止のため拒否されます（`trusted_proxy_local_interface_source`）。インターフェース検出自体が失敗した場合も、リクエストは拒否されます（`trusted_proxy_local_interface_check_failed`）。
4. `requiredHeaders` と `userHeader` は存在し、空白のみであってはいけません。
5. `allowUsers` が空でない場合、抽出されたユーザーを含んでいる必要があります。

**転送ヘッダーの証拠は、ローカル直接フォールバックにおける loopback のローカル性を上書きします。** リクエストが loopback で到着しても、`Forwarded`、任意の `X-Forwarded-*`、または `X-Real-IP` ヘッダーを持っている場合、その証拠により local-direct パスワードフォールバックとデバイス ID ゲートの対象外になります。ただし、trusted-proxy 認証としては引き続き loopback として失敗します。

`allowLoopback` は、Gateway ホスト上のローカルプロセスをリバースプロキシと同程度に信頼します。Gateway が直接のリモートアクセスから引き続きファイアウォールで保護されており、ローカルプロキシがクライアント提供の ID ヘッダーを削除または上書きする場合にのみ有効化してください。

リバースプロキシを経由しない内部 Gateway クライアントは、trusted-proxy ID ヘッダーではなく、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を使用してください。非 loopback の Control UI デプロイでは、引き続き明示的な `gateway.controlUi.allowedOrigins` が必要です。
</Warning>

### 設定リファレンス

<ParamField path="gateway.trustedProxies" type="string[]" required>
  信頼するプロキシ IP アドレス（または CIDR）の配列。他の IP からのリクエストは拒否されます。
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
  ユーザー ID の許可リスト。空の場合は、すべての認証済みユーザーを許可します。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  同一ホストの loopback リバースプロキシを明示的にサポートします。
</ParamField>

<Warning>
ローカルのリバースプロキシが意図した信頼境界である場合にのみ、`allowLoopback` を有効化してください。Gateway に接続できるローカルプロセスは、プロキシ ID ヘッダーの送信を試みることができます。そのため、Gateway への直接アクセスはホスト内に限定し、`x-forwarded-proto` のようなプロキシ所有ヘッダー、またはプロキシが対応している場合は署名付きアサーションヘッダーを必須にしてください。
</Warning>

## Control UI ペアリング動作

`gateway.auth.mode = "trusted-proxy"` が有効で、リクエストが trusted-proxy チェックを通過すると、Control UI WebSocket セッションはデバイスペアリング ID なしで接続できます。

スコープへの影響:

- デバイスなしの Control UI WebSocket セッションは接続できますが、デフォルトではオペレータースコープを受け取りません。OpenClaw は要求されたスコープリストを `[]` にクリアするため、承認済みのペアリング済みデバイスまたはトークンに紐づいていないセッションは、権限を自己宣言できません。
- WebSocket 接続に成功した後にメソッドが `missing scope` で失敗する場合は、ブラウザーがデバイス ID を生成してペアリングを完了できるように HTTPS を使用してください。[Control UI の安全でない HTTP](/ja-JP/web/control-ui#insecure-http) を参照してください。
- 緊急時のみ: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` は、デバイス ID がなくても要求されたスコープを保持します。これは重大なセキュリティ低下です。すばやく元に戻してください。[Control UI の安全でない HTTP](/ja-JP/web/control-ui#insecure-http) を参照してください。

リバースプロキシによるスコープ上限: プロキシが Control UI WebSocket アップグレードリクエストで `x-openclaw-scopes` を送信する場合、OpenClaw はセッションスコープを、要求されたスコープと宣言されたスコープの共通部分に制限します。このヘッダーはスコープを付与しません。セッションが保持できる内容を狭めるだけです。

影響:

- このモードでは、ペアリングは Control UI アクセスの主要なゲートではなくなります。
- リバースプロキシの認証ポリシーと `allowUsers` が実効的なアクセス制御になります。
- Gateway の ingress は、信頼済みプロキシ IP のみにロックしてください（`gateway.trustedProxies` + ファイアウォール）。

カスタム WebSocket クライアントは Control UI セッションではありません。`gateway.controlUi.dangerouslyDisableDeviceAuth` は、任意の `client.mode: "backend"` または CLI 風クライアントにスコープを付与しません。カスタム自動化では、デバイス ID/ペアリング、予約済みの直接ローカル `client.id: "gateway-client"` バックエンドヘルパーパス、または HTTP リクエスト/レスポンス面の方が適している場合は [admin HTTP RPC Plugin](/ja-JP/plugins/admin-http-rpc) を使用してください。

## オペレータースコープヘッダー

trusted-proxy 認証は **ID を伴う** HTTP モードであるため、呼び出し元は HTTP API リクエストで `x-openclaw-scopes` を使ってオペレータースコープを任意で宣言できます。

注: WebSocket スコープは、Gateway プロトコルハンドシェイクとデバイス ID バインディングによって決まります。Control UI WebSocket アップグレードリクエストでは、`x-openclaw-scopes` はネゴシエートされたセッションスコープの上限にすぎず、付与ではありません。[Control UI ペアリング動作](#control-ui-pairing-behavior) を参照してください。

例:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

動作:

- ヘッダーが存在する場合、OpenClaw は宣言されたスコープセットを尊重します。
- ヘッダーが存在するが空の場合、リクエストはオペレータースコープを **一切** 宣言しません。
- ヘッダーが存在しない場合、通常の ID を伴う HTTP API は、標準のオペレーターデフォルトスコープセット（`operator.admin`、`operator.read`、`operator.write`、`operator.approvals`、`operator.pairing`、`operator.talk.secrets`）にフォールバックします。
- Gateway 認証の **Plugin HTTP ルート** はデフォルトでより狭くなります。`x-openclaw-scopes` が存在しない場合、ランタイムスコープは `operator.write` のみにフォールバックします。
- ブラウザー起点の HTTP リクエストは、trusted-proxy 認証が成功した後でも、`gateway.controlUi.allowedOrigins`（または意図的な Host ヘッダーフォールバックモード）を通過する必要があります。

実用上のルール: trusted-proxy リクエストをデフォルトより狭くしたい場合、または gateway-auth Plugin ルートに write スコープより強いものが必要な場合は、`x-openclaw-scopes` を明示的に送信してください。

## TLS 終端と HSTS

TLS 終端ポイントを 1 つ使用し、そこで HSTS を適用してください。

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    リバースプロキシが `https://control.example.com` の HTTPS を処理する場合、そのドメインに対してプロキシで `Strict-Transport-Security` を設定します。

    - インターネット向けデプロイに適しています。
    - 証明書と HTTP 強化ポリシーを 1 か所に保てます。
    - OpenClaw はプロキシの背後で loopback HTTP のままにできます。

    ヘッダー値の例:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    OpenClaw 自体が HTTPS を直接提供する場合（TLS 終端プロキシなし）は、次を設定します。

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

    `strictTransportSecurity` は文字列のヘッダー値、または明示的に無効化する `false` を受け入れます。

  </Tab>
</Tabs>

### ロールアウトガイダンス

- トラフィックを検証している間は、まず短い max age（例: `max-age=300`）から始めます。
- 十分な確信が得られた後でのみ、長期間の値（例: `max-age=31536000`）へ増やします。
- すべてのサブドメインが HTTPS 対応済みの場合にのみ、`includeSubDomains` を追加します。
- ドメインセット全体について preload 要件を意図的に満たす場合にのみ、preload を使用します。
- loopback のみのローカル開発では、HSTS の恩恵はありません。

## プロキシ設定例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium は `x-pomerium-claim-email`（または他の claim ヘッダー）で ID を渡し、`x-pomerium-jwt-assertion` で JWT を渡します。

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
  <Accordion title="Caddy with OAuth">
    `caddy-security` Plugin を使用した Caddy は、ユーザーを認証し、ID ヘッダーを渡すことができます。

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

    ```caddy
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
  <Accordion title="forward auth を使う Traefik">
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

共有トークンも設定されている場合（`gateway.auth.token` または `OPENCLAW_GATEWAY_TOKEN`）、Gateway の起動は trusted-proxy 認証を拒否します。この 2 つは相互排他です。共有トークンを許可すると、このモードが強制することを意図しているプロキシ検証済み ID とはまったく別の経路で、同一ホストの呼び出し元が認証できてしまうためです。

起動が `gateway auth mode is trusted-proxy, but a shared token is also configured` のようなエラーで失敗する場合:

- trusted-proxy モードを使う場合は共有トークンを削除する、または
- トークンベース認証を意図している場合は `gateway.auth.mode` を `"token"` に切り替えます。

ループバックの trusted-proxy ID ヘッダーも fail closed します。同一ホストの呼び出し元がプロキシユーザーとして黙って認証されることはありません。プロキシを迂回する内部 OpenClaw 呼び出し元は、代わりに `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` で認証できます。trusted-proxy モードでは、トークンのフォールバックは意図的に未対応のままです。

## セキュリティチェックリスト

trusted-proxy 認証を有効にする前に、次を確認してください。

- [ ] **プロキシが唯一の経路である**: Gateway ポートは、プロキシ以外のすべてからファイアウォールで遮断されている。
- [ ] **trustedProxies は最小限である**: サブネット全体ではなく、実際のプロキシ IP のみ。
- [ ] **ループバックプロキシ送信元は意図的である**: `gateway.auth.trustedProxy.allowLoopback` が同一ホストプロキシ用に明示的に有効化されていない限り、trusted-proxy 認証はループバック送信元リクエストを fail closed する。
- [ ] **プロキシがヘッダーを除去する**: プロキシはクライアントからの `x-forwarded-*` ヘッダーを追加ではなく上書きする。
- [ ] **TLS 終端**: プロキシが TLS を処理し、ユーザーは HTTPS で接続する。
- [ ] **allowedOrigins が明示的である**: 非ループバックの Control UI は明示的な `gateway.controlUi.allowedOrigins` を使う。
- [ ] **allowUsers が設定されている**（推奨）: 認証済みなら誰でも許可するのではなく、既知のユーザーに制限する。
- [ ] **混在トークン設定がない**: `gateway.auth.token` と `gateway.auth.mode: "trusted-proxy"` の両方を設定しない。
- [ ] **ローカルパスワードフォールバックは非公開である**: 内部の直接呼び出し元向けに `gateway.auth.password` を設定する場合、非プロキシのリモートクライアントが直接到達できないように Gateway ポートをファイアウォールで遮断する。

## セキュリティ監査

`openclaw security audit` は trusted-proxy 認証を **critical** 重大度の検出事項としてフラグします。これは意図的な動作です。セキュリティをプロキシ設定に委任していることを思い出させるためです。

監査では次を確認します。

- 基本の `gateway.trusted_proxy_auth` 警告/critical リマインダー。
- `trustedProxies` 設定の欠落。
- `userHeader` 設定の欠落。
- 空の `allowUsers`（認証済みユーザーを誰でも許可）。
- 同一ホストプロキシ送信元に対する `allowLoopback` の有効化。

trusted-proxy 固有ではない別の検出事項も、Control UI が公開されている場合は常に適用されます。ワイルドカードまたは欠落した `gateway.controlUi.allowedOrigins`、および Host ヘッダー origin フォールバックです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    リクエストは `gateway.trustedProxies` 内の IP から送信されていません。次を確認してください。

    - プロキシ IP は正しいですか？（Docker コンテナ IP は変わることがあります。）
    - プロキシの前段にロードバランサーがありますか？
    - 実際の IP を見つけるには、`docker inspect` または `kubectl get pods -o wide` を使ってください。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw はループバック送信元の trusted-proxy リクエストを拒否しました。

    確認:

    - プロキシは `127.0.0.1` / `::1` から接続していますか？
    - 同一ホストのループバックリバースプロキシで trusted-proxy 認証を使おうとしていますか？

    修正:

    - プロキシを通らない内部の同一ホストクライアントには、トークン/パスワード認証を優先する、または
    - 非ループバックの信頼済みプロキシアドレス経由でルーティングし、その IP を `gateway.trustedProxies` に保持する、または
    - 意図的な同一ホストリバースプロキシの場合は、`gateway.auth.trustedProxy.allowLoopback = true` を設定し、ループバックアドレスを `gateway.trustedProxies` に保持し、プロキシが ID ヘッダーを除去または上書きすることを確認します。

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    リクエストの送信元 IP が、Gateway ホスト自身の非ループバックネットワークインターフェースアドレスの 1 つ（プロキシではない）に一致しました。これは tailnet や Docker ブリッジネットワーク上の偽装された同一ホストトラフィックに対するガードです。`..._check_failed` はインターフェース検出自体でエラーが発生したことを意味するため、OpenClaw は fail closed します。

    確認:

    - Gateway ホスト自身のプロセスが、プロキシを迂回して ID ヘッダーを直接送信していますか？
    - プロキシは Gateway と同じネットワーク名前空間で実行され、ローカルインターフェースとしても表示される IP を持っていますか？

    修正: Gateway ホストによってローカルにもバインドされていないアドレス経由でプロキシトラフィックをルーティングするか、本物の同一ホストプロキシ設定に限って `allowLoopback` を使ってください。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    ユーザーヘッダーが空、または欠落しています。次を確認してください。

    - プロキシは ID ヘッダーを渡すように設定されていますか？
    - ヘッダー名は正しいですか？（大文字小文字は区別されませんが、綴りは重要です）
    - ユーザーは実際にプロキシで認証されていますか？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    必須ヘッダーが存在しませんでした。次を確認してください。

    - それらの特定ヘッダーに対するプロキシ設定。
    - チェーン内のどこかでヘッダーが除去されていないか。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    ユーザーは認証済みですが、`allowUsers` に含まれていません。ユーザーを追加するか、許可リストを削除してください。
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` は `"trusted-proxy"` ですが、`gateway.trustedProxies` が空であるか、`gateway.auth.trustedProxy` 自体が欠落しています。両方が設定されるまで、すべてのリクエストが拒否されます。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy 認証は成功しましたが、ブラウザーの `Origin` ヘッダーが Control UI の origin チェックを通過しませんでした。

    確認:

    - `gateway.controlUi.allowedOrigins` に正確なブラウザー origin が含まれている。
    - 意図的に全許可の動作を求めていない限り、ワイルドカード origin に依存していない。
    - 意図的に Host ヘッダーフォールバックモードを使う場合、`gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` が意図して設定されている。

  </Accordion>
  <Accordion title="接続は成功するが、メソッドがスコープ欠落を報告する">
    WebSocket は接続しますが、`chat.history`、`sessions.list`、または
    `models.list` が `missing scope: operator.read` で失敗します。

    よくある原因:

    - デバイスなしの Control UI セッション: trusted-proxy 認証はデバイス ID なしで WebSocket 接続を許可できますが、OpenClaw は設計上、デバイスなしセッションのスコープをクリアします。
    - カスタムバックエンドクライアント: `gateway.controlUi.dangerouslyDisableDeviceAuth` は Control UI スコープであり、任意のバックエンドまたは CLI 形式の WebSocket クライアントにスコープを付与しません。
    - 過度に狭い `x-openclaw-scopes`: プロキシが Control UI WebSocket アップグレードリクエストにこのヘッダーを注入する場合、セッションスコープはその集合に制限されます。空のヘッダー値はスコープなしになります。

    修正:

    - Control UI では、ブラウザーがデバイス ID を生成してペアリングを完了できるように HTTPS を使ってください。
    - カスタム自動化では、デバイス ID/ペアリング、予約済みの直接ローカル `gateway-client` バックエンドヘルパー経路、または [admin HTTP RPC](/ja-JP/plugins/admin-http-rpc) を使ってください。
    - `gateway.controlUi.dangerouslyDisableDeviceAuth: true` は、一時的な Control UI の緊急回避経路としてのみ使ってください。

  </Accordion>
  <Accordion title="WebSocket がまだ失敗する">
    プロキシが次を満たしていることを確認してください。

    - WebSocket アップグレードをサポートしている（`Upgrade: websocket`、`Connection: upgrade`）。
    - WebSocket アップグレードリクエストで ID ヘッダーを渡している（HTTP だけではない）。
    - WebSocket 接続用の別個の認証経路を持っていない。

  </Accordion>
</AccordionGroup>

## トークン認証からの移行

<Steps>
  <Step title="プロキシを設定する">
    ユーザーを認証してヘッダーを渡すようにプロキシを設定します。
  </Step>
  <Step title="プロキシを単独でテストする">
    プロキシ設定を単独でテストします（ヘッダー付き curl）。
  </Step>
  <Step title="OpenClaw 設定を更新する">
    trusted-proxy 認証で OpenClaw 設定を更新します。
  </Step>
  <Step title="Gateway を再起動する">
    Gateway を再起動します。
  </Step>
  <Step title="WebSocket をテストする">
    Control UI からの WebSocket 接続をテストします。
  </Step>
  <Step title="監査">
    `openclaw security audit` を実行し、検出事項を確認します。
  </Step>
</Steps>

## 関連

- [設定](/ja-JP/gateway/configuration) — 設定リファレンス
- [オペレータースコープ](/ja-JP/gateway/operator-scopes) — ロール、スコープ、承認チェック
- [リモートアクセス](/ja-JP/gateway/remote) — その他のリモートアクセスパターン
- [セキュリティ](/ja-JP/gateway/security) — 完全なセキュリティガイド
- [Tailscale](/ja-JP/gateway/tailscale) — tailnet 専用アクセスのより簡単な代替手段
