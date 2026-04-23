---
read_when:
    - identity-aware proxy の背後で OpenClaw を実行する
    - OpenClaw の前段に Pomerium、Caddy、または OAuth 付き nginx を設定する
    - リバースプロキシ構成での WebSocket 1008 unauthorized errors を修正する
    - HSTS やその他の HTTP hardening headers をどこで設定するか決める
summary: 信頼できるリバースプロキシ（Pomerium、Caddy、nginx + OAuth）に gateway 認証を委譲する
title: Trusted Proxy Auth
x-i18n:
    generated_at: "2026-04-23T14:04:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Trusted Proxy Auth

> ⚠️ **セキュリティに敏感な機能です。** このモードでは認証を完全にリバースプロキシに委譲します。設定を誤ると、Gateway が未認可アクセスにさらされる可能性があります。有効にする前に、このページを注意深く読んでください。

## 使用するタイミング

次の場合は `trusted-proxy` auth mode を使用してください。

- OpenClaw を **identity-aware proxy**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）の背後で動かしている
- proxy がすべての認証を処理し、headers 経由で user identity を渡す
- Kubernetes またはコンテナ環境で、proxy だけが Gateway への唯一の経路になっている
- browser が WS payloads に token を渡せないため、WebSocket の `1008 unauthorized` errors に遭遇している

## 使用しないタイミング

- proxy が users を認証しない場合（単なる TLS terminator または load balancer）
- proxy をバイパスして Gateway に到達できる経路が少しでもある場合（firewall の穴、内部ネットワークアクセス）
- proxy が forwarded headers を正しく strip/overwrite しているか確信が持てない場合
- 個人用の単一ユーザーアクセスだけが必要な場合（より単純な構成として Tailscale Serve + loopback を検討してください）

## 仕組み

1. リバースプロキシが users を認証します（OAuth、OIDC、SAML など）
2. proxy が認証済み user identity を含む header を追加します（例: `x-forwarded-user: nick@example.com`）
3. OpenClaw は、その request が **信頼された proxy IP**（`gateway.trustedProxies` で設定）から来たことを確認します
4. OpenClaw は設定された header から user identity を抽出します
5. すべてが正しければ、その request は認可されます

## Control UI のペアリング動作

`gateway.auth.mode = "trusted-proxy"` が有効で、その request が
trusted-proxy チェックを通過した場合、Control UI の WebSocket sessions は device
pairing identity なしで接続できます。

影響:

- このモードでは、Control UI アクセスにおいて pairing はもはや主要な gate ではありません。
- reverse proxy の auth policy と `allowUsers` が実効的なアクセス制御になります。
- gateway ingress は trusted proxy IP のみに制限してください（`gateway.trustedProxies` + firewall）。

## 設定

```json5
{
  gateway: {
    // trusted-proxy auth は、loopback ではない trusted proxy source からの requests を想定します
    bind: "lan",

    // 重要: ここには proxy の IP だけを追加してください
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 認証済み user identity を含む header（必須）
        userHeader: "x-forwarded-user",

        // 任意: 必ず存在しなければならない headers（proxy 検証）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 任意: 特定 users のみに制限（空 = すべて許可）
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

重要なランタイムルール:

- trusted-proxy auth は loopback source の requests（`127.0.0.1`、`::1`、loopback CIDRs）を拒否します。
- 同一 host の loopback reverse proxies は trusted-proxy auth の条件を満たしません。
- 同一 host の loopback proxy 構成では、代わりに token/password auth を使うか、OpenClaw が検証できる loopback ではない trusted proxy address を経由させてください。
- loopback ではない Control UI デプロイでは、引き続き明示的な `gateway.controlUi.allowedOrigins` が必要です。
- **forwarded-header の証拠は loopback のローカル性を上書きします。** request が loopback 経由で到着しても、`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` headers に loopback ではない origin が示されている場合、その証拠によって loopback ローカル性の主張は無効になります。その request は、pairing、trusted-proxy auth、Control UI の device-identity gating において remote として扱われます。これにより、同一 host の loopback proxy が forwarded-header identity を trusted-proxy auth に偽装注入することを防ぎます。

### Configuration Reference

| Field                                       | Required | 説明 |
| ------------------------------------------- | -------- | ---- |
| `gateway.trustedProxies`                    | Yes      | 信頼する proxy IP addresses の配列。その他の IP からの requests は拒否されます。 |
| `gateway.auth.mode`                         | Yes      | `"trusted-proxy"` である必要があります |
| `gateway.auth.trustedProxy.userHeader`      | Yes      | 認証済み user identity を含む header 名 |
| `gateway.auth.trustedProxy.requiredHeaders` | No       | request が信頼されるために追加で存在しなければならない headers |
| `gateway.auth.trustedProxy.allowUsers`      | No       | user identities の allowlist。空の場合はすべての認証済み users を許可します。 |

## TLS termination と HSTS

TLS termination point は 1 か所にし、HSTS はそこに適用してください。

### 推奨パターン: proxy で TLS termination

reverse proxy が `https://control.example.com` の HTTPS を処理する場合は、
その domain に対して proxy で `Strict-Transport-Security` を設定してください。

- インターネット公開デプロイに適しています。
- certificate と HTTP hardening policy を 1 か所にまとめられます。
- OpenClaw は proxy の背後で loopback HTTP のままにできます。

header 値の例:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway で TLS termination

OpenClaw 自体が HTTPS を直接提供する場合（TLS termination する proxy がない場合）は、次を設定します。

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

`strictTransportSecurity` は string の header 値、または明示的に無効化する `false` を受け付けます。

### ロールアウトの指針

- まず短い max age（例: `max-age=300`）から始めて、トラフィックを検証してください。
- 十分な確信が持ててから、長期間の値（例: `max-age=31536000`）に増やしてください。
- すべての subdomain が HTTPS 対応済みの場合にのみ `includeSubDomains` を追加してください。
- preload は、domain 全体の条件を意図的に満たしている場合にのみ使ってください。
- loopback のみのローカル開発では HSTS の恩恵はありません。

## Proxy セットアップ例

### Pomerium

Pomerium は `x-pomerium-claim-email`（または他の claim headers）に identity を渡し、`x-pomerium-jwt-assertion` に JWT を渡します。

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

Pomerium config の例:

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

### OAuth 付き Caddy

`caddy-security` Plugin を使った Caddy は users を認証し、identity headers を渡せます。

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

Caddyfile の例:

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

oauth2-proxy は users を認証し、`x-auth-request-email` に identity を渡します。

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

nginx config の例:

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

### Forward Auth 付き Traefik

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

## 混在した token 設定

`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）と `trusted-proxy` mode が同時に有効な、曖昧な設定は OpenClaw が拒否します。混在した token configs は、loopback requests が誤った auth path で静かに認証される原因になります。

起動時に `mixed_trusted_proxy_token` error が表示される場合:

- trusted-proxy mode を使うなら共有 token を削除する、または
- token ベース auth を意図しているなら `gateway.auth.mode` を `"token"` に切り替える

loopback の trusted-proxy auth も fail closed します。同一 host の callers は、静かに認証されるのではなく、trusted proxy を通じて設定済みの identity headers を提供する必要があります。

## Operator scopes header

trusted-proxy auth は **identity-bearing** HTTP mode なので、callers は
必要に応じて `x-openclaw-scopes` で operator scopes を宣言できます。

例:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

動作:

- header が存在する場合、OpenClaw は宣言された scope set を尊重します。
- header が存在するが空の場合、その request は **operator scopes なし** を宣言します。
- header が存在しない場合、通常の identity-bearing HTTP APIs は標準の operator default scope set にフォールバックします。
- Gateway-auth の **plugin HTTP routes** はデフォルトでより狭く、`x-openclaw-scopes` が存在しない場合、その runtime scope は `operator.write` にフォールバックします。
- browser-origin の HTTP requests は、trusted-proxy auth が成功した後でも、`gateway.controlUi.allowedOrigins`（または意図的な Host-header fallback mode）を通過する必要があります。

実務上のルール:

- trusted-proxy request をデフォルトより狭いものにしたい場合、または gateway-auth plugin route に write scope より強いものが必要な場合は、`x-openclaw-scopes` を明示的に送信してください。

## セキュリティチェックリスト

trusted-proxy auth を有効にする前に、次を確認してください。

- [ ] **Proxy だけが唯一の経路**: Gateway port は proxy 以外からはすべて firewall で遮断されている
- [ ] **trustedProxies は最小限**: サブネット全体ではなく、実際の proxy IPs のみ
- [ ] **loopback proxy source ではない**: trusted-proxy auth は loopback-source requests では fail closed する
- [ ] **Proxy が headers を strip する**: proxy は clients からの `x-forwarded-*` headers を append ではなく overwrite する
- [ ] **TLS termination**: proxy が TLS を処理し、users は HTTPS 経由で接続する
- [ ] **allowedOrigins が明示的**: loopback ではない Control UI では明示的な `gateway.controlUi.allowedOrigins` を使う
- [ ] **allowUsers が設定されている**（推奨）: 認証済みなら誰でも許可するのではなく、既知の users に制限する
- [ ] **混在 token config がない**: `gateway.auth.token` と `gateway.auth.mode: "trusted-proxy"` を同時に設定しない

## Security Audit

`openclaw security audit` は、trusted-proxy auth を **critical** severity の finding として報告します。これは意図的なもので、セキュリティを proxy 設定に委譲していることを思い出させるためです。

audit は次をチェックします。

- ベースとなる `gateway.trusted_proxy_auth` の warning/critical reminder
- `trustedProxies` 設定の欠落
- `userHeader` 設定の欠落
- 空の `allowUsers`（認証済みなら誰でも許可）
- 公開された Control UI surface 上の wildcard または欠落した browser-origin policy

## トラブルシューティング

### 「trusted_proxy_untrusted_source」

request が `gateway.trustedProxies` にある IP から来ていません。確認してください。

- proxy IP は正しいですか。（Docker の container IPs は変わることがあります）
- proxy の前段に load balancer はありますか。
- 実際の IP を調べるには `docker inspect` または `kubectl get pods -o wide` を使ってください

### 「trusted_proxy_loopback_source」

OpenClaw は loopback-source の trusted-proxy request を拒否しました。

確認してください。

- proxy は `127.0.0.1` / `::1` から接続していますか。
- 同一 host の loopback reverse proxy で trusted-proxy auth を使おうとしていませんか。

修正:

- 同一 host の loopback proxy 構成では token/password auth を使用する、または
- loopback ではない trusted proxy address を経由し、その IP を `gateway.trustedProxies` に保持する

### 「trusted_proxy_user_missing」

user header が空か、存在しませんでした。次を確認してください。

- proxy が identity headers を渡すよう設定されていますか。
- header 名は正しいですか。（大文字小文字は区別されませんが、スペルは重要です）
- user は実際に proxy で認証されていますか。

### 「trusted_proxy_missing_header_*」

必要な header が存在しませんでした。次を確認してください。

- それらの specific headers に対する proxy 設定
- chain のどこかで headers が strip されていないか

### 「trusted_proxy_user_not_allowed」

user は認証されていますが、`allowUsers` に含まれていません。追加するか、allowlist を削除してください。

### 「trusted_proxy_origin_not_allowed」

trusted-proxy auth は成功しましたが、browser の `Origin` header が Control UI の origin checks を通過しませんでした。

次を確認してください。

- `gateway.controlUi.allowedOrigins` に正確な browser origin が含まれている
- 意図的に allow-all 動作を望んでいない限り、wildcard origins に依存していない
- 意図的に Host-header fallback mode を使う場合、`gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` を意図的に設定している

### WebSocket がまだ失敗する

proxy が次を満たしていることを確認してください。

- WebSocket upgrades をサポートしている（`Upgrade: websocket`, `Connection: upgrade`）
- WebSocket upgrade requests に対しても identity headers を渡す（HTTP だけではない）
- WebSocket 接続用に別の auth path を持っていない

## Token Auth からの移行

token auth から trusted-proxy へ移行する場合:

1. proxy が users を認証し、headers を渡すよう設定する
2. proxy 設定を単独でテストする（headers 付きの curl）
3. OpenClaw config を trusted-proxy auth で更新する
4. Gateway を再起動する
5. Control UI からの WebSocket 接続をテストする
6. `openclaw security audit` を実行し、findings を確認する

## 関連

- [Security](/ja-JP/gateway/security) — 完全なセキュリティガイド
- [Configuration](/ja-JP/gateway/configuration) — config リファレンス
- [Remote Access](/ja-JP/gateway/remote) — その他のリモートアクセスパターン
- [Tailscale](/ja-JP/gateway/tailscale) — tailnet 専用アクセス向けのより単純な代替手段
