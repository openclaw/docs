---
read_when:
    - localhostの外部にGateway Control UIを公開する場合
    - tailnetまたは公開ダッシュボードアクセスを自動化する場合
summary: Gatewayダッシュボード向けの統合Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T05:00:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale（Gatewayダッシュボード）

OpenClawは、GatewayダッシュボードおよびWebSocketポート向けに、Tailscaleの**Serve**（tailnet）または**Funnel**（公開）を自動設定できます。これにより、Gatewayはloopbackにbindしたまま、
TailscaleがHTTPS、ルーティング、および（Serveでは）アイデンティティヘッダーを提供します。

## モード

- `serve`: `tailscale serve`によるtailnet専用Serve。gatewayは`127.0.0.1`のままです。
- `funnel`: `tailscale funnel`による公開HTTPS。OpenClawでは共有パスワードが必要です。
- `off`: デフォルト（Tailscale自動化なし）。

## 認証

ハンドシェイクを制御するには`gateway.auth.mode`を設定します。

- `none`（プライベートなingressのみ）
- `token`（`OPENCLAW_GATEWAY_TOKEN`が設定されている場合のデフォルト）
- `password`（`OPENCLAW_GATEWAY_PASSWORD`または設定による共有シークレット）
- `trusted-proxy`（アイデンティティ認識リバースプロキシ。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth)を参照）

`tailscale.mode = "serve"`かつ`gateway.auth.allowTailscale`が`true`の場合、
Control UI/WebSocket認証ではTailscaleのアイデンティティヘッダー
（`tailscale-user-login`）を使用でき、token/passwordの提示は不要です。OpenClawは、
ローカルのTailscaleデーモン（`tailscale whois`）経由で`x-forwarded-for`アドレスを解決し、
それをヘッダーと照合してから受け入れることで、アイデンティティを検証します。
OpenClawがリクエストをServeとして扱うのは、それがloopbackから到着し、かつ
Tailscaleの`x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host`
ヘッダーが付いている場合のみです。
HTTP APIエンドポイント（たとえば`/v1/*`、`/tools/invoke`、`/api/channels/*`）では、
Tailscaleのアイデンティティヘッダー認証は**使用されません**。これらは引き続きgatewayの
通常のHTTP認証モードに従います。デフォルトでは共有シークレット認証であり、
意図的に設定されたtrusted-proxy / プライベートingress `none`セットアップも利用できます。
このtoken不要フローは、gatewayホストが信頼できることを前提としています。同じホスト上で
信頼できないローカルコードが動作する可能性がある場合は、`gateway.auth.allowTailscale`を無効化し、
代わりにtoken/password認証を必須にしてください。
明示的な共有シークレット資格情報を必須にするには、`gateway.auth.allowTailscale: false`
を設定し、`gateway.auth.mode: "token"`または`"password"`を使用してください。

## 設定例

### Tailnet専用（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開くURL: `https://<magicdns>/`（または設定した`gateway.controlUi.basePath`）

### Tailnet専用（Tailnet IPにbind）

これは、GatewayをTailnet IPで直接待ち受けさせたい場合に使用します（Serve/Funnelなし）。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

別のTailnetデバイスから接続:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

注意: このモードではloopback（`http://127.0.0.1:18789`）は**動作しません**。

### 公開インターネット（Funnel + 共有パスワード）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

パスワードをディスクへコミットする代わりに、`OPENCLAW_GATEWAY_PASSWORD`の使用を推奨します。

## CLI例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注意

- Tailscale Serve/Funnelには、`tailscale` CLIがインストールされ、ログイン済みである必要があります。
- `tailscale.mode: "funnel"`は、公開露出を避けるため、認証モードが`password`でない限り起動を拒否します。
- シャットダウン時にOpenClawへ`tailscale serve`
  または`tailscale funnel`設定を取り消させたい場合は、`gateway.tailscale.resetOnExit`を設定してください。
- `gateway.bind: "tailnet"`は直接のTailnet bindです（HTTPSなし、Serve/Funnelなし）。
- `gateway.bind: "auto"`はloopbackを優先します。Tailnet専用にしたい場合は`tailnet`を使用してください。
- Serve/Funnelが公開するのは**Gateway control UI + WS**のみです。Nodeは
  同じGateway WSエンドポイント経由で接続するため、ServeはNodeアクセスにも使えます。

## ブラウザー制御（リモートGateway + ローカルブラウザー）

Gatewayをあるマシンで動かしつつ、別のマシン上のブラウザーを操作したい場合は、
ブラウザーマシン上で**node host**を実行し、両方を同じtailnet上に置いてください。
Gatewayはブラウザーアクションをそのnodeへプロキシするため、別個の制御サーバーやServe URLは不要です。

ブラウザー制御にはFunnelを避け、nodeペアリングをオペレーターアクセスと同様に扱ってください。

## Tailscaleの前提条件 + 制限

- Serveには、tailnetでHTTPSが有効になっている必要があります。足りない場合はCLIがプロンプトを表示します。
- ServeはTailscaleアイデンティティヘッダーを注入します。Funnelは注入しません。
- Funnelには、Tailscale v1.38.3+、MagicDNS、有効なHTTPS、およびfunnel node属性が必要です。
- FunnelはTLS上で`443`、`8443`、`10000`ポートのみをサポートします。
- macOS上のFunnelには、オープンソース版のTailscaleアプリが必要です。

## 詳細情報

- Tailscale Serve概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve`コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel`コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 関連

- [Remote access](/ja-JP/gateway/remote)
- [Discovery](/ja-JP/gateway/discovery)
- [Authentication](/ja-JP/gateway/authentication)
