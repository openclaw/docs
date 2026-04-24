---
read_when:
    - アイデンティティ認識プロキシの背後でOpenClawを実行する場合
    - OpenClawの前段にOAuth付きPomerium、Caddy、またはnginxを設定する場合
    - リバースプロキシ構成でのWebSocket 1008 unauthorizedエラーを修正する場合
    - HSTSやその他のHTTPハードニングヘッダーをどこで設定するか判断する場合
summary: 信頼できるリバースプロキシ（Pomerium、Caddy、nginx + OAuth）にgateway認証を委譲する
title: trusted-proxy認証
x-i18n:
    generated_at: "2026-04-24T05:00:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **セキュリティに敏感な機能です。** このモードでは認証を完全にリバースプロキシへ委譲します。設定ミスがあると、Gatewayが未認可アクセスにさらされる可能性があります。有効化する前に、このページを注意深く読んでください。

## 使用するべき場面

次のような場合は`trusted-proxy`認証モードを使用してください。

- OpenClawを**アイデンティティ認識プロキシ**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）の背後で実行している
- プロキシがすべての認証を処理し、ヘッダー経由でユーザーアイデンティティを渡している
- Kubernetesまたはコンテナ環境で、Gatewayへの唯一の経路がプロキシである
- ブラウザーがWSペイロード内でトークンを渡せないため、WebSocketの`1008 unauthorized`エラーが発生している

## 使用してはいけない場面

- プロキシがユーザー認証をしていない場合（単なるTLS終端またはロードバランサー）
- プロキシをバイパスしてGatewayへ到達できる経路が少しでも存在する場合（ファイアウォールの穴、内部ネットワークアクセス）
- プロキシがforwardedヘッダーを正しく取り除く/上書きするか確信がない場合
- 個人用の単一ユーザーアクセスだけが必要な場合（より単純なセットアップとしてTailscale Serve + loopbackを検討してください）

## 仕組み

1. リバースプロキシがユーザーを認証する（OAuth、OIDC、SAMLなど）
2. プロキシが認証済みユーザーアイデンティティを含むヘッダーを追加する（例: `x-forwarded-user: nick@example.com`）
3. OpenClawは、リクエストが**信頼されたプロキシIP**（`gateway.trustedProxies`で設定）から来たことを確認する
4. OpenClawは、設定されたヘッダーからユーザーアイデンティティを抽出する
5. すべて問題なければ、リクエストは認可される

## Control UIのペアリング動作

`gateway.auth.mode = "trusted-proxy"`が有効で、リクエストが
trusted-proxyチェックを通過した場合、Control UIのWebSocketセッションは
デバイスペアリングアイデンティティなしで接続できます。

意味すること:

- このモードでは、ペアリングはもはやControl UIアクセスの主要なゲートではありません。
- 実効的なアクセス制御は、リバースプロキシの認証ポリシーと`allowUsers`になります。
- Gatewayのingressは、信頼されたプロキシIPのみに必ず制限してください（`gateway.trustedProxies` + ファイアウォール）。

## 設定

```json5
{
  gateway: {
    // trusted-proxy認証は、loopbackではない信頼されたプロキシ送信元からのリクエストを想定します
    bind: "lan",

    // 重要: ここには実際のプロキシIPだけを追加してください
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 認証済みユーザーアイデンティティを含むヘッダー（必須）
        userHeader: "x-forwarded-user",

        // 任意: 必ず存在しなければならないヘッダー（プロキシ検証）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 任意: 特定のユーザーに制限（空 = 全員許可）
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

重要な実行時ルール:

- trusted-proxy認証はloopback送信元リクエスト（`127.0.0.1`、`::1`、loopback CIDR）を拒否します。
- 同一ホスト上のloopbackリバースプロキシはtrusted-proxy認証を満たしません。
- 同一ホストのloopbackプロキシ構成では、代わりにtoken/password認証を使用するか、OpenClawが検証可能なloopbackではない信頼されたプロキシアドレス経由でルーティングしてください。
- loopbackではないControl UIデプロイでは、依然として明示的な`gateway.controlUi.allowedOrigins`が必要です。
- **Forwardedヘッダーの証拠はloopbackのローカル性より優先されます。** リクエストがloopback上で到着しても、`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`ヘッダーが付いていて、非ローカルな送信元を指している場合、その証拠によりloopbackローカル性の主張は無効になります。リクエストは、ペアリング、trusted-proxy認証、およびControl UIのデバイスアイデンティティゲーティングにおいてリモートとして扱われます。これにより、同一ホストのloopbackプロキシがforwardedヘッダー由来のアイデンティティをtrusted-proxy認証へ流し込むことを防ぎます。

### 設定リファレンス

| フィールド | 必須 | 説明 |
| ------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | はい | 信頼するプロキシIPアドレスの配列。その他のIPからのリクエストは拒否されます。 |
| `gateway.auth.mode`                         | はい | `"trusted-proxy"`でなければなりません |
| `gateway.auth.trustedProxy.userHeader`      | はい | 認証済みユーザーアイデンティティを含むヘッダー名 |
| `gateway.auth.trustedProxy.requiredHeaders` | いいえ | リクエストを信頼済みと見なすために追加で必要なヘッダー |
| `gateway.auth.trustedProxy.allowUsers`      | いいえ | ユーザーアイデンティティの許可リスト。空の場合は認証済みの全ユーザーを許可します。 |

## TLS終端とHSTS

TLS終端ポイントは1つだけ使い、HSTSはそこで適用してください。

### 推奨パターン: プロキシでTLS終端

リバースプロキシが`https://control.example.com`のHTTPSを処理する場合は、
そのドメインに対してプロキシで`Strict-Transport-Security`を設定してください。

- インターネット向けデプロイに適しています。
- 証明書とHTTPハードニングポリシーを1か所で管理できます。
- OpenClawはプロキシの背後でloopback HTTPのままにできます。

ヘッダー値の例:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### GatewayでTLS終端

OpenClaw自体がHTTPSを直接提供する場合（TLS終端プロキシなし）は、次を設定します。

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

`strictTransportSecurity`は、文字列のヘッダー値、または明示的に無効化する`false`を受け付けます。

### ロールアウトのガイダンス

- まずは短いmax age（たとえば`max-age=300`）から始めて、トラフィックを検証してください。
- 十分な確信が得られてから、長期間の値（たとえば`max-age=31536000`）へ増やしてください。
- すべてのサブドメインがHTTPS対応である場合にのみ`includeSubDomains`を追加してください。
- preloadは、ドメイン全体が意図的にpreload要件を満たす場合にのみ使用してください。
- loopback専用のローカル開発ではHSTSの利点はありません。

## プロキシ設定例

### Pomerium

Pomeriumは`x-pomerium-claim-email`（またはその他のclaimヘッダー）と、`x-pomerium-jwt-assertion`内のJWTでアイデンティティを渡します。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // PomeriumのIP
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

Pomerium設定スニペット:

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

### OAuth付きCaddy

`caddy-security` Plugin付きのCaddyは、ユーザーを認証してアイデンティティヘッダーを渡せます。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Caddy/sidecarプロキシIP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Caddyfileスニペット:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxyはユーザーを認証し、`x-auth-request-email`でアイデンティティを渡します。

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxyのIP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

nginx設定スニペット:

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

### Forward Auth付きTraefik

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // TraefikコンテナIP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## 混在したtoken設定

OpenClawは、`gateway.auth.token`（または`OPENCLAW_GATEWAY_TOKEN`）と`trusted-proxy`モードが同時に有効なあいまいな設定を拒否します。混在したtoken設定は、loopbackリクエストが誤った認証パスで静かに認証される原因になります。

起動時に`mixed_trusted_proxy_token`エラーが表示された場合:

- trusted-proxyモードを使うなら共有tokenを削除する、または
- tokenベース認証を意図しているなら`gateway.auth.mode`を`"token"`へ切り替える

loopbackのtrusted-proxy認証もfail closedです。同一ホストの呼び出し側は、静かに認証されるのではなく、信頼されたプロキシ経由で設定済みのアイデンティティヘッダーを供給する必要があります。

## Operator scopesヘッダー

trusted-proxy認証は**アイデンティティを伴う**HTTPモードであるため、呼び出し側は
`x-openclaw-scopes`でoperator scopeを任意に宣言できます。

例:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

動作:

- ヘッダーが存在する場合、OpenClawは宣言されたscope集合を尊重します。
- ヘッダーが存在するが空の場合、そのリクエストは**operator scopeなし**を宣言します。
- ヘッダーが存在しない場合、通常のアイデンティティ付きHTTP APIは標準のoperatorデフォルトscope集合へフォールバックします。
- Gateway認証の**plugin HTTP route**はデフォルトでより狭くなっています。`x-openclaw-scopes`がない場合、それらのランタイムscopeは`operator.write`へフォールバックします。
- ブラウザー起点のHTTPリクエストは、trusted-proxy認証成功後でも、依然として`gateway.controlUi.allowedOrigins`（または意図的なHost-headerフォールバックモード）を通過する必要があります。

実用ルール:

- trusted-proxyリクエストをデフォルトより狭くしたい場合、またはgateway認証plugin routeで
  write scopeより強いものが必要な場合は、`x-openclaw-scopes`を明示的に送信してください。

## セキュリティチェックリスト

trusted-proxy認証を有効にする前に、次を確認してください。

- [ ] **プロキシが唯一の経路**: Gatewayポートが、プロキシ以外すべてからファイアウォールで遮断されている
- [ ] **trustedProxiesが最小**: サブネット全体ではなく、実際のプロキシIPのみ
- [ ] **loopbackプロキシ送信元なし**: trusted-proxy認証はloopback送信元リクエストでfail closedになる
- [ ] **プロキシがヘッダーを除去する**: プロキシがクライアントからの`x-forwarded-*`ヘッダーを追記ではなく上書きする
- [ ] **TLS終端**: プロキシがTLSを処理し、ユーザーはHTTPS経由で接続する
- [ ] **allowedOriginsが明示的**: loopbackではないControl UIでは、明示的な`gateway.controlUi.allowedOrigins`を使う
- [ ] **allowUsersが設定されている**（推奨）: 認証済みなら誰でも許可するのではなく、既知のユーザーへ制限する
- [ ] **混在token設定なし**: `gateway.auth.token`と`gateway.auth.mode: "trusted-proxy"`を同時に設定しない

## セキュリティ監査

`openclaw security audit`は、trusted-proxy認証を**critical**重要度の検出結果としてフラグ付けします。これは意図的なもので、セキュリティをプロキシ設定へ委譲していることを思い出させるためです。

監査では次を確認します。

- 基本の`gateway.trusted_proxy_auth`警告/criticalリマインダー
- `trustedProxies`設定の欠落
- `userHeader`設定の欠落
- 空の`allowUsers`（認証済みなら誰でも許可）
- 公開されたControl UIインターフェースでのワイルドカードまたは欠落したブラウザーoriginポリシー

## トラブルシューティング

### `trusted_proxy_untrusted_source`

リクエストが`gateway.trustedProxies`内のIPから来ていません。次を確認してください。

- プロキシIPは正しいですか？（DockerコンテナIPは変わることがあります）
- プロキシの前段にロードバランサーがありませんか？
- 実際のIPを確認するには`docker inspect`または`kubectl get pods -o wide`を使ってください

### `trusted_proxy_loopback_source`

OpenClawがloopback送信元のtrusted-proxyリクエストを拒否しました。

確認事項:

- プロキシは`127.0.0.1` / `::1`から接続していますか？
- 同一ホストのloopbackリバースプロキシでtrusted-proxy認証を使おうとしていませんか？

修正:

- 同一ホストのloopbackプロキシ構成ではtoken/password認証を使用する、または
- loopbackではないtrusted proxyアドレス経由でルーティングし、そのIPを`gateway.trustedProxies`に保持してください。

### `trusted_proxy_user_missing`

ユーザーヘッダーが空または欠落しています。次を確認してください。

- プロキシはアイデンティティヘッダーを渡すように設定されていますか？
- ヘッダー名は正しいですか？（大文字小文字は区別されませんが、スペルは重要です）
- ユーザーは実際にプロキシで認証されていますか？

### `trusted*proxy_missing_header*\*`

必要なヘッダーが存在しませんでした。次を確認してください。

- それらの特定ヘッダーに関するプロキシ設定
- チェーンのどこかでヘッダーが取り除かれていないか

### `trusted_proxy_user_not_allowed`

ユーザーは認証されていますが、`allowUsers`に含まれていません。追加するか、allowlistを削除してください。

### `trusted_proxy_origin_not_allowed`

trusted-proxy認証は成功しましたが、ブラウザーの`Origin`ヘッダーがControl UIのoriginチェックを通過しませんでした。

次を確認してください。

- `gateway.controlUi.allowedOrigins`に正確なブラウザーoriginが含まれている
- 意図的に全許可したい場合を除き、ワイルドカードoriginに依存していない
- 意図的にHost-headerフォールバックモードを使う場合は、`gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`が明示的に設定されている

### WebSocketがまだ失敗する

プロキシが次を満たしていることを確認してください。

- WebSocket upgrade（`Upgrade: websocket`、`Connection: upgrade`）をサポートしている
- WebSocket upgradeリクエストでもアイデンティティヘッダーを渡す（HTTPのみではない）
- WebSocket接続に対して別の認証パスを持っていない

## token認証からの移行

token認証からtrusted-proxyへ移行する場合:

1. プロキシを、ユーザーを認証してヘッダーを渡すよう設定する
2. プロキシ設定を独立してテストする（ヘッダー付きcurl）
3. trusted-proxy認証でOpenClaw設定を更新する
4. Gatewayを再起動する
5. Control UIからWebSocket接続をテストする
6. `openclaw security audit`を実行して結果を確認する

## 関連

- [Security](/ja-JP/gateway/security) — 完全なセキュリティガイド
- [Configuration](/ja-JP/gateway/configuration) — 設定リファレンス
- [Remote Access](/ja-JP/gateway/remote) — その他のリモートアクセスパターン
- [Tailscale](/ja-JP/gateway/tailscale) — tailnet専用アクセス向けの、より簡単な代替手段
