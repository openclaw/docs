---
read_when:
    - Gateway Control UI を localhost の外部に公開する
    - tailnet または公開ダッシュボードアクセスの自動化
summary: Gateway ダッシュボード向け統合 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-07-05T11:29:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e9622024cd94f6fc45cf14a9ecc3e4bb2fc8c43b23d8c0210c3a512e0cdf6ef
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw は、Gateway ダッシュボードと WebSocket ポート向けに Tailscale **Serve** (tailnet) または **Funnel** (public) を自動構成できます。これにより、gateway は loopback にバインドされたまま、Tailscale が HTTPS、ルーティング、(Serve の場合は) ID ヘッダーを提供します。

## モード

`gateway.tailscale.mode`:

| モード          | 動作                                                                        |
| --------------- | --------------------------------------------------------------------------- |
| `serve`         | `tailscale serve` による tailnet 専用 Serve。gateway は `127.0.0.1` のままです。 |
| `funnel`        | `tailscale funnel` による public HTTPS。共有パスワードが必要です。            |
| `off` (default) | Tailscale 自動化なし。                                                      |

ステータスと監査出力では、この OpenClaw Serve/Funnel モードに **Tailscale 公開状態** を使用します。`off` は OpenClaw が Serve または Funnel を管理していないことを意味します。ローカルの Tailscale デーモンが停止している、またはログアウトしているという意味ではありません。

## 構成例

### Tailnet 専用 (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開く: `https://<magicdns>/` (または構成済みの `gateway.controlUi.basePath`)

デバイスのホスト名ではなく、名前付き Tailscale Service 経由でコントロール UI を公開するには、`gateway.tailscale.serviceName` を Service 名に設定します。

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

起動時には、デバイスのホスト名ではなく `https://openclaw.<tailnet-name>.ts.net/` が Service URL として報告されます。Tailscale Services では、ホストが tailnet 内の承認済みタグ付きノードである必要があります。これを有効にする前に Tailscale でタグを構成し、Service を承認してください。そうしないと、gateway 起動中に `tailscale serve --service=...` が失敗します。

### Tailnet 専用 (Tailnet IP にバインド)

Serve/Funnel なしで、gateway に Tailnet IP を直接 listen させる場合に使用します。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

別の Tailnet デバイスから接続します。

- コントロール UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
このモードでは、Loopback (`http://127.0.0.1:18789`) は動作**しません**。
</Note>

### public インターネット (Funnel + 共有パスワード)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

パスワードをディスクにコミットするよりも、`OPENCLAW_GATEWAY_PASSWORD` を優先してください。

## CLI 例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 認証

`gateway.auth.mode` はハンドシェイクを制御します。

| モード                                                 | ユースケース                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | private ingress のみ                                                                |
| `token` (default when `OPENCLAW_GATEWAY_TOKEN` is set) | 共有トークン                                                                        |
| `password`                                             | `OPENCLAW_GATEWAY_PASSWORD` または config による共有シークレット                    |
| `trusted-proxy`                                        | ID 認識リバースプロキシ。[Trusted Proxy 認証](/ja-JP/gateway/trusted-proxy-auth) を参照   |

### Tailscale ID ヘッダー (Serve のみ)

`tailscale.mode: "serve"` で `gateway.auth.allowTailscale` が `true` の場合、コントロール UI/WebSocket 認証は、トークン/パスワードの代わりに Tailscale ID ヘッダー (`tailscale-user-login`) を使用できます。OpenClaw は、ローカルの Tailscale デーモン (`tailscale whois`) 経由でリクエストの `x-forwarded-for` アドレスを解決し、受け入れる前にそれがヘッダーログインと一致することを確認して、そのヘッダーを検証します。この経路の対象となるリクエストは、Tailscale の `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` ヘッダーを含んで loopback から到着したものに限られます。

このトークンなしフローは、gateway ホストが信頼されていることを前提とします。信頼できないローカルコードが同じホストで実行される可能性がある場合は、`gateway.auth.allowTailscale: false` を設定し、代わりにトークン/パスワード認証を要求してください。

バイパスの範囲:

- コントロール UI WebSocket 認証サーフェスにのみ適用されます。HTTP API エンドポイント (`/v1/*`、`/tools/invoke`、`/api/channels/*` など) は Tailscale ID ヘッダー認証を使用しません。常に gateway の通常の HTTP 認証モードに従います。
- すでにブラウザーデバイス ID を持つコントロール UI オペレーターセッションでは、検証済みの Tailscale ID により、bootstrap-token/QR ペアリングの往復がスキップされます。
- デバイス ID 自体はバイパスされません。デバイスなしのクライアントは引き続き拒否され、node-role 接続も通常のペアリングと認証チェックを通過します。

## 注記

- Tailscale Serve/Funnel には、`tailscale` CLI がインストールされ、ログイン済みである必要があります。
- `tailscale.mode: "funnel"` は、public 公開を避けるため、認証モードが `password` でない限り起動を拒否します。
- `gateway.tailscale.serviceName` は Serve モードにのみ適用され、`tailscale serve --service=<name>` に渡されます。値は Tailscale の `svc:<dns-label>` 形式を使用する必要があります。例: `svc:openclaw`。Tailscale では Service ホストがタグ付きノードである必要があり、Serve が公開できるようになる前に admin console の承認が必要になる場合があります。
- `gateway.tailscale.resetOnExit` は、シャットダウン時に `tailscale serve`/`tailscale funnel` の構成を元に戻します。
- `gateway.tailscale.preserveFunnel: true` は、外部で構成された `tailscale funnel` ルートを gateway 再起動後も維持します。`mode: "serve"` では、OpenClaw は Serve を再適用する前に `tailscale funnel status` を確認し、Funnel ルートがすでに gateway ポートをカバーしている場合はスキップします。OpenClaw 管理の Funnel パスワード専用ポリシーは変わりません。
- `gateway.bind: "tailnet"` は直接 Tailnet バインドです (HTTPS なし、Serve/Funnel なし)。
- `gateway.bind: "auto"` は loopback を優先します。Tailnet 専用バインドには `tailnet` を使用してください。
- Serve/Funnel は **Gateway コントロール UI + WS** のみを公開します。ノードは同じ Gateway WS エンドポイント経由で接続するため、Serve はノードアクセスにも機能します。

### Tailscale の前提条件と制限

- Serve には tailnet で HTTPS が有効になっている必要があります。不足している場合は CLI がプロンプトを表示します。
- Serve は Tailscale ID ヘッダーを注入します。Funnel は注入しません。
- Funnel には Tailscale v1.38.3+、MagicDNS、HTTPS 有効化、funnel node attribute が必要です。
- Funnel は TLS 経由ではポート `443`、`8443`、`10000` のみをサポートします。
- macOS 上の Funnel には、オープンソースの Tailscale アプリ版が必要です。

## ブラウザー制御 (リモート Gateway + ローカルブラウザー)

Gateway を一方のマシンで実行し、別のマシンのブラウザーを操作するには、ブラウザーマシンで **node host** を実行し、両方を同じ tailnet に置きます。Gateway はブラウザー操作をノードにプロキシします。別個の control server や Serve URL は不要です。

ブラウザー制御には Funnel を避けてください。ノードペアリングはオペレーターアクセスと同様に扱ってください。

## 詳細

- Tailscale Serve 概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 関連

- [リモートアクセス](/ja-JP/gateway/remote)
- [検出](/ja-JP/gateway/discovery)
- [認証](/ja-JP/gateway/authentication)
