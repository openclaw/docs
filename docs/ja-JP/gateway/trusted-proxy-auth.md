---
read_when:
    - ID 認識プロキシの背後で OpenClaw を実行する
    - OpenClaw の前段に OAuth 対応の Pomerium、Caddy、または nginx をセットアップする
    - リバースプロキシ構成での WebSocket 1008 未認証エラーの修正
    - HSTS およびその他の HTTP セキュリティ強化ヘッダーを設定する場所の決定
sidebarTitle: Trusted proxy auth
summary: Gateway 認証を信頼できるリバースプロキシ（Pomerium、Caddy、nginx + OAuth）に委任する
title: 信頼済みプロキシ認証
x-i18n:
    generated_at: "2026-07-11T22:18:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**セキュリティに影響する機能です。** このモードでは、認証をリバースプロキシに全面的に委任します。設定を誤ると、Gateway が不正アクセスにさらされる可能性があります。有効にする前に、このページを注意深く読んでください。
</Warning>

## 使用する場合

- OpenClaw を **ID 認識プロキシ**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）の背後で実行している。
- プロキシがすべての認証を処理し、ヘッダーを介してユーザー ID を渡している。
- プロキシが Gateway への唯一の経路となる Kubernetes またはコンテナ環境を使用している。
- ブラウザーが WS ペイロードでトークンを渡せないため、WebSocket の `1008 unauthorized` エラーが発生している。

## 使用しない場合

- プロキシがユーザーを認証しない（単なる TLS 終端またはロードバランサーである）。
- プロキシを迂回して Gateway に到達できる経路がある（ファイアウォールの穴、内部ネットワークからのアクセスなど）。
- プロキシが転送ヘッダーを正しく削除または上書きするか確信がない。
- 個人用の単一ユーザーアクセスだけが必要である（代わりに Tailscale Serve + loopback を検討してください）。

## 仕組み

<Steps>
  <Step title="プロキシがユーザーを認証する">
    リバースプロキシがユーザーを認証します（OAuth、OIDC、SAML など）。
  </Step>
  <Step title="プロキシが ID ヘッダーを追加する">
    プロキシが認証済みユーザーの ID を含むヘッダーを追加します（例: `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway が信頼済みの送信元を検証する">
    OpenClaw は、リクエストが **信頼済みプロキシ IP**（`gateway.trustedProxies`）から送信され、Gateway 自身の loopback アドレスまたはローカルインターフェースアドレスからではないことを確認します。
  </Step>
  <Step title="Gateway が ID を抽出する">
    OpenClaw は必須ヘッダーを読み取り、設定されたヘッダーからユーザー ID を取得します。
  </Step>
  <Step title="認可する">
    すべての検証に成功し、ユーザーが `allowUsers`（設定されている場合）の条件を満たすと、リクエストが認可されます。
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
**評価順に示したランタイム規則**

1. リクエストの送信元 IP は `gateway.trustedProxies` のいずれかと一致する必要があります（CIDR 対応）。一致しない場合は拒否されます（`trusted_proxy_untrusted_source`）。
2. loopback からのリクエスト（`127.0.0.1`、`::1`）は、`gateway.auth.trustedProxy.allowLoopback = true` であり、かつその loopback アドレスも `trustedProxies` に含まれている場合を除き拒否されます（`trusted_proxy_loopback_source`）。この検査はヘッダー検査より先に実行されるため、必須ヘッダーも欠けている場合でも、loopback の送信元はこの理由で失敗します。
3. `trustedProxies` のいずれかと一致する非 loopback の送信元でも、Gateway ホスト自身のローカルネットワークインターフェースアドレスと一致する場合は、なりすまし防止のため拒否されます（`trusted_proxy_local_interface_source`）。インターフェースの検出自体に失敗した場合も、リクエストは拒否されます（`trusted_proxy_local_interface_check_failed`）。
4. `requiredHeaders` と `userHeader` が存在し、空白のみではない必要があります。
5. `allowUsers` が空でない場合、抽出されたユーザーが含まれている必要があります。

**転送ヘッダーの存在は、ローカル直接フォールバックにおける loopback のローカル性より優先されます。** リクエストが loopback に到着しても、`Forwarded`、いずれかの `X-Forwarded-*`、または `X-Real-IP` ヘッダーを含んでいる場合、その情報によりローカル直接パスワードフォールバックおよびデバイス ID によるゲーティングの対象外になります。ただし、loopback であるため信頼済みプロキシ認証には引き続き失敗します。

`allowLoopback` は、Gateway ホスト上のローカルプロセスをリバースプロキシと同程度に信頼します。Gateway がリモートからの直接アクセスに対して引き続きファイアウォールで保護されており、ローカルプロキシがクライアント提供の ID ヘッダーを削除または上書きする場合にのみ有効にしてください。

リバースプロキシを経由しない内部 Gateway クライアントでは、信頼済みプロキシの ID ヘッダーではなく、`gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を使用してください。非 loopback の Control UI デプロイでは、引き続き `gateway.controlUi.allowedOrigins` の明示的な設定が必要です。
</Warning>

### 設定リファレンス

<ParamField path="gateway.trustedProxies" type="string[]" required>
  信頼するプロキシ IP アドレス（または CIDR）の配列です。それ以外の IP からのリクエストは拒否されます。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  `"trusted-proxy"` である必要があります。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  認証済みユーザーの ID を含むヘッダー名です。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  リクエストを信頼するために存在する必要がある追加ヘッダーです。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  ユーザー ID の許可リストです。空の場合、認証済みのすべてのユーザーを許可します。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  同一ホスト上の loopback リバースプロキシを明示的に有効化するための設定です。
</ParamField>

<Warning>
ローカルリバースプロキシを意図した信頼境界とする場合にのみ、`allowLoopback` を有効にしてください。Gateway に接続できるすべてのローカルプロセスがプロキシ ID ヘッダーの送信を試行できるため、Gateway への直接アクセスはホスト内に限定し、`x-forwarded-proto` のようなプロキシ管理のヘッダー、またはプロキシが対応している場合は署名付きアサーションヘッダーを必須にしてください。
</Warning>

## Control UI のペアリング動作

`gateway.auth.mode = "trusted-proxy"` が有効で、リクエストが信頼済みプロキシの検査に合格すると、Control UI の WebSocket セッションはデバイスのペアリング ID なしで接続できます。

スコープへの影響:

- デバイスのない Control UI WebSocket セッションは接続できますが、デフォルトではオペレータースコープを受け取りません。承認済みのペアリング済みデバイスまたはトークンに関連付けられていないセッションが権限を自己申告できないように、OpenClaw は要求されたスコープのリストを `[]` に消去します。
- WebSocket への接続に成功した後、メソッドが `missing scope` で失敗する場合は、ブラウザーがデバイス ID を生成してペアリングを完了できるように HTTPS を使用してください。[Control UI の安全でない HTTP](/ja-JP/web/control-ui#insecure-http)を参照してください。
- 緊急時のみ: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` を指定すると、デバイス ID がなくても要求されたスコープが維持されます。これはセキュリティを大幅に低下させるため、速やかに元に戻してください。[Control UI の安全でない HTTP](/ja-JP/web/control-ui#insecure-http)を参照してください。

リバースプロキシによるスコープの上限制限: プロキシが Control UI の WebSocket アップグレードリクエストで `x-openclaw-scopes` を送信すると、OpenClaw はセッションのスコープを、要求されたスコープと宣言されたスコープの積集合に制限します。このヘッダーはスコープを付与せず、セッションが保持できるスコープを狭めるだけです。

影響:

- このモードでは、ペアリングは Control UI へのアクセスにおける主要なゲートではなくなります。
- リバースプロキシの認証ポリシーと `allowUsers` が実質的なアクセス制御になります。
- Gateway への受信アクセスは、信頼済みプロキシ IP のみに制限してください（`gateway.trustedProxies` + ファイアウォール）。

カスタム WebSocket クライアントは Control UI セッションではありません。`gateway.controlUi.dangerouslyDisableDeviceAuth` は、任意の `client.mode: "backend"` クライアントや CLI 形式のクライアントにスコープを付与しません。カスタム自動化では、デバイス ID とペアリング、予約済みの直接ローカル `client.id: "gateway-client"` バックエンドヘルパーパス、または HTTP のリクエスト／レスポンス形式が適している場合は [管理 HTTP RPC plugin](/ja-JP/plugins/admin-http-rpc)を使用してください。

## オペレータースコープヘッダー

信頼済みプロキシ認証は ID を伴う HTTP モードであるため、呼び出し元は必要に応じて、HTTP API リクエストの `x-openclaw-scopes` でオペレータースコープを宣言できます。

注: WebSocket のスコープは、Gateway プロトコルのハンドシェイクとデバイス ID の関連付けによって決まります。Control UI の WebSocket アップグレードリクエストでは、`x-openclaw-scopes` はネゴシエートされたセッションスコープの上限としてのみ機能し、スコープを付与しません。[Control UI のペアリング動作](#control-ui-pairing-behavior)を参照してください。

例:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

動作:

- ヘッダーが存在する場合、OpenClaw は宣言されたスコープセットを適用します。
- ヘッダーが存在していても空の場合、リクエストはオペレータースコープを **一切** 宣言しません。
- ヘッダーが存在しない場合、通常の ID を伴う HTTP API は、標準のオペレーターデフォルトスコープセット（`operator.admin`、`operator.read`、`operator.write`、`operator.approvals`、`operator.pairing`、`operator.talk.secrets`）にフォールバックします。
- Gateway 認証を使用する **plugin HTTP ルート** のデフォルトは、より限定的です。`x-openclaw-scopes` が存在しない場合、そのランタイムスコープは `operator.write` のみにフォールバックします。
- ブラウザーオリジンからの HTTP リクエストは、信頼済みプロキシ認証に成功した後も、`gateway.controlUi.allowedOrigins`（または意図的に設定された Host ヘッダーフォールバックモード）の検査に合格する必要があります。

実用上の規則: 信頼済みプロキシからのリクエストをデフォルトより狭いスコープにしたい場合、または Gateway 認証を使用する plugin ルートで書き込みスコープより強い権限が必要な場合は、`x-openclaw-scopes` を明示的に送信してください。

## TLS 終端と HSTS

TLS 終端ポイントは 1 つにし、そこで HSTS を適用してください。

<Tabs>
  <Tab title="プロキシでの TLS 終端（推奨）">
    リバースプロキシが `https://control.example.com` の HTTPS を処理する場合、そのドメインの `Strict-Transport-Security` をプロキシで設定してください。

    - インターネット公開デプロイに適しています。
    - 証明書と HTTP 強化ポリシーを 1 か所に集約できます。
    - OpenClaw はプロキシの背後で loopback HTTP を引き続き使用できます。

    ヘッダー値の例:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway での TLS 終端">
    OpenClaw 自身が HTTPS を直接提供する場合（TLS 終端プロキシを使用しない場合）、次のように設定します。

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

    `strictTransportSecurity` には文字列のヘッダー値を指定できます。明示的に無効化するには `false` を指定します。

  </Tab>
</Tabs>

### 導入ガイダンス

- トラフィックを検証している間は、まず短い最大有効期間（例: `max-age=300`）から始めてください。
- 十分な確信を得た後でのみ、長期間の値（例: `max-age=31536000`）に増やしてください。
- すべてのサブドメインで HTTPS の準備ができている場合にのみ、`includeSubDomains` を追加してください。
- ドメイン全体が意図的にプリロード要件を満たしている場合にのみ、プリロードを使用してください。
- loopback のみを使用するローカル開発では、HSTS の利点はありません。

## プロキシ設定例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium は `x-pomerium-claim-email`（またはその他のクレームヘッダー）で ID を渡し、`x-pomerium-jwt-assertion` で JWT を渡します。

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

    Pomerium の設定スニペット:

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
  <Accordion title="OAuth を使用する Caddy">
    `caddy-security` plugin を使用する Caddy は、ユーザーを認証して ID ヘッダーを渡すことができます。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/サイドカープロキシの IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Caddyfile のスニペット:

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
    oauth2-proxy はユーザーを認証し、`x-auth-request-email` でアイデンティティを渡します。

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

    nginx 設定のスニペット:

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
  <Accordion title="Traefik with forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik コンテナの IP
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

## トークン設定との併用

共有トークン（`gateway.auth.token` または `OPENCLAW_GATEWAY_TOKEN`）も設定されている場合、Gateway の起動時に trusted-proxy 認証は拒否されます。この 2 つは相互排他的です。共有トークンを使用すると、このモードで適用することを意図したプロキシ検証済みアイデンティティとはまったく異なる経路で、同一ホストの呼び出し元が認証できてしまうためです。

`gateway auth mode is trusted-proxy, but a shared token is also configured` のようなエラーで起動に失敗する場合:

- trusted-proxy モードを使用するときは共有トークンを削除するか、
- トークンベースの認証を使用する場合は、`gateway.auth.mode` を `"token"` に変更します。

ループバックからの trusted-proxy アイデンティティヘッダーもフェイルクローズされます。同一ホストの呼び出し元がプロキシユーザーとして暗黙に認証されることはありません。プロキシを経由しない OpenClaw の内部呼び出し元は、代わりに `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` で認証できます。trusted-proxy モードでは、トークンへのフォールバックは意図的にサポートされていません。

## セキュリティチェックリスト

trusted-proxy 認証を有効にする前に、以下を確認してください:

- [ ] **プロキシが唯一の経路である**: Gateway ポートが、使用するプロキシ以外のすべてからファイアウォールで遮断されている。
- [ ] **trustedProxies が最小限である**: サブネット全体ではなく、実際に使用するプロキシの IP のみが指定されている。
- [ ] **ループバックのプロキシ送信元が意図的である**: 同一ホストのプロキシ向けに `gateway.auth.trustedProxy.allowLoopback` を明示的に有効にしない限り、ループバックを送信元とするリクエストに対して trusted-proxy 認証はフェイルクローズされる。
- [ ] **プロキシがヘッダーを除去する**: プロキシがクライアントからの `x-forwarded-*` ヘッダーに追記せず、上書きする。
- [ ] **TLS 終端**: プロキシが TLS を処理し、ユーザーが HTTPS 経由で接続する。
- [ ] **allowedOrigins が明示されている**: local loopback 以外の Control UI では、`gateway.controlUi.allowedOrigins` が明示的に設定されている。
- [ ] **allowUsers が設定されている**（推奨）: 認証されたすべてのユーザーを許可するのではなく、既知のユーザーに制限する。
- [ ] **トークン設定が混在していない**: `gateway.auth.token` と `gateway.auth.mode: "trusted-proxy"` の両方を設定しない。
- [ ] **ローカルパスワードへのフォールバックが非公開である**: 内部から直接呼び出すクライアント向けに `gateway.auth.password` を設定する場合、プロキシを経由しないリモートクライアントが Gateway ポートへ直接アクセスできないよう、ファイアウォールで遮断する。

## セキュリティ監査

`openclaw security audit` は、trusted-proxy 認証を **重大** 深刻度の検出事項として報告します。これは意図的なものであり、セキュリティをプロキシ設定に委任していることを注意喚起するためです。

監査では以下を確認します:

- 基本となる `gateway.trusted_proxy_auth` の警告／重大リマインダー。
- `trustedProxies` 設定の欠落。
- `userHeader` 設定の欠落。
- 空の `allowUsers`（認証されたすべてのユーザーを許可）。
- 同一ホストのプロキシ送信元に対して有効化された `allowLoopback`。

Control UI が公開されている場合は、trusted-proxy 固有ではない別の検出事項も適用されます。これには、ワイルドカードまたは未設定の `gateway.controlUi.allowedOrigins`、および Host ヘッダーを使用したオリジンのフォールバックが含まれます。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    リクエストの送信元が `gateway.trustedProxies` 内の IP ではありません。以下を確認してください:

    - プロキシの IP は正しいですか？（Docker コンテナの IP は変わることがあります。）
    - プロキシの前段にロードバランサーがありますか？
    - 実際の IP を確認するには、`docker inspect` または `kubectl get pods -o wide` を使用してください。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw が、ループバックを送信元とする trusted-proxy リクエストを拒否しました。

    確認事項:

    - プロキシは `127.0.0.1` / `::1` から接続していますか？
    - 同一ホストのループバックリバースプロキシで trusted-proxy 認証を使用しようとしていますか？

    修正方法:

    - プロキシを経由しない同一ホストの内部クライアントには、トークン／パスワード認証を優先するか、
    - local loopback ではない信頼済みプロキシアドレスを経由させ、その IP を `gateway.trustedProxies` に含めるか、
    - 同一ホストのリバースプロキシを意図的に使用する場合は、`gateway.auth.trustedProxy.allowLoopback = true` を設定し、ループバックアドレスを `gateway.trustedProxies` に含め、プロキシがアイデンティティヘッダーを除去または上書きするようにしてください。

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    リクエストの送信元 IP が、プロキシではなく Gateway ホスト自身の local loopback 以外のネットワークインターフェースアドレスのいずれかと一致しました。これは、tailnet または Docker ブリッジネットワーク上で偽装された同一ホストのトラフィックを防ぐための保護機構です。`..._check_failed` はインターフェース検出自体でエラーが発生したことを意味するため、OpenClaw はフェイルクローズします。

    確認事項:

    - Gateway ホスト上のプロセスが、プロキシを迂回してアイデンティティヘッダーを直接送信していませんか？
    - プロキシが Gateway と同じネットワーク名前空間で動作し、その IP がローカルインターフェースとしても表示されていませんか？

    修正方法: Gateway ホストにもローカルでバインドされているアドレスを避けてプロキシトラフィックをルーティングするか、実際に同一ホストのプロキシを使用する構成に限って `allowLoopback` を使用してください。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    ユーザーヘッダーが空か、存在しません。以下を確認してください:

    - プロキシはアイデンティティヘッダーを渡すよう設定されていますか？
    - ヘッダー名は正しいですか？（大文字と小文字は区別されませんが、綴りは一致する必要があります）
    - ユーザーは実際にプロキシで認証されていますか？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    必須ヘッダーが存在しません。以下を確認してください:

    - 該当するヘッダーに関するプロキシ設定。
    - 経路の途中でヘッダーが除去されていないか。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    ユーザーは認証されていますが、`allowUsers` に含まれていません。ユーザーを追加するか、許可リストを削除してください。
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` が `"trusted-proxy"` であるにもかかわらず、`gateway.trustedProxies` が空か、`gateway.auth.trustedProxy` 自体がありません。両方が設定されるまで、すべてのリクエストが拒否されます。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    trusted-proxy 認証には成功しましたが、ブラウザーの `Origin` ヘッダーが Control UI のオリジンチェックを通過しませんでした。

    確認事項:

    - `gateway.controlUi.allowedOrigins` にブラウザーの正確なオリジンが含まれている。
    - すべてを許可する動作を意図していない限り、ワイルドカードオリジンに依存していない。
    - Host ヘッダーのフォールバックモードを意図的に使用する場合、`gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` が明示的に設定されている。

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket は接続されますが、`chat.history`、`sessions.list`、または
    `models.list` が `missing scope: operator.read` で失敗します。

    一般的な原因:

    - デバイスなしの Control UI セッション: trusted-proxy 認証ではデバイスアイデンティティなしで WebSocket 接続を許可できますが、OpenClaw は設計上、デバイスなしのセッションからスコープを削除します。
    - カスタムバックエンドクライアント: `gateway.controlUi.dangerouslyDisableDeviceAuth` は Control UI に限定され、任意のバックエンドや CLI 形式の WebSocket クライアントにはスコープを付与しません。
    - 過度に限定された `x-openclaw-scopes`: プロキシが Control UI の WebSocket アップグレードリクエストにこのヘッダーを挿入すると、セッションのスコープはその集合に制限されます。ヘッダー値が空の場合、スコープは付与されません。

    修正方法:

    - Control UI では、ブラウザーがデバイスアイデンティティを生成してペアリングを完了できるよう、HTTPS を使用してください。
    - カスタム自動化では、デバイスアイデンティティ／ペアリング、予約済みの直接ローカル `gateway-client` バックエンドヘルパー経路、または [管理者 HTTP RPC](/ja-JP/plugins/admin-http-rpc) を使用してください。
    - `gateway.controlUi.dangerouslyDisableDeviceAuth: true` は、Control UI の緊急回避手段として一時的にのみ使用してください。

  </Accordion>
  <Accordion title="WebSocket still failing">
    プロキシが以下を満たしていることを確認してください:

    - WebSocket アップグレード（`Upgrade: websocket`、`Connection: upgrade`）をサポートしている。
    - HTTP だけでなく、WebSocket アップグレードリクエストでもアイデンティティヘッダーを渡している。
    - WebSocket 接続に別の認証経路を使用していない。

  </Accordion>
</AccordionGroup>

## トークン認証からの移行

<Steps>
  <Step title="Configure the proxy">
    ユーザーを認証してヘッダーを渡すようにプロキシを設定します。
  </Step>
  <Step title="Test the proxy independently">
    プロキシ設定を単独でテストします（ヘッダー付きの curl）。
  </Step>
  <Step title="Update OpenClaw config">
    OpenClaw の設定を trusted-proxy 認証に更新します。
  </Step>
  <Step title="Restart the Gateway">
    Gateway を再起動します。
  </Step>
  <Step title="Test WebSocket">
    Control UI から WebSocket 接続をテストします。
  </Step>
  <Step title="Audit">
    `openclaw security audit` を実行し、検出事項を確認します。
  </Step>
</Steps>

## 関連項目

- [設定](/ja-JP/gateway/configuration) — 設定リファレンス
- [オペレータースコープ](/ja-JP/gateway/operator-scopes) — ロール、スコープ、承認チェック
- [リモートアクセス](/ja-JP/gateway/remote) — その他のリモートアクセスパターン
- [セキュリティ](/ja-JP/gateway/security) — 完全なセキュリティガイド
- [Tailscale](/ja-JP/gateway/tailscale) — tailnet のみにアクセスを制限する場合の、より簡単な代替手段
