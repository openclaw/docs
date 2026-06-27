---
read_when:
    - Gateway Control UI を localhost の外部に公開する
    - tailnetまたは公開ダッシュボードアクセスの自動化
summary: Gateway ダッシュボード向けの統合 Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T11:38:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw は、Gateway ダッシュボードと WebSocket ポート向けに Tailscale **Serve**（tailnet）または **Funnel**（公開）を自動設定できます。これにより、Gateway を loopback にバインドしたまま、Tailscale が HTTPS、ルーティング、および（Serve の場合は）ID ヘッダーを提供します。

## モード

- `serve`: `tailscale serve` による tailnet 限定の Serve。Gateway は `127.0.0.1` のままです。
- `funnel`: `tailscale funnel` による公開 HTTPS。OpenClaw では共有パスワードが必要です。
- `off`: デフォルト（Tailscale 自動化なし）。

ステータスと監査出力では、この OpenClaw Serve/Funnel モードに **Tailscale 公開状態** を使用します。`off` は、OpenClaw が Serve または Funnel を管理していないことを意味します。ローカルの Tailscale デーモンが停止している、またはログアウトしているという意味ではありません。

## 認証

ハンドシェイクを制御するには、`gateway.auth.mode` を設定します。

- `none`（プライベート ingress のみ）
- `token`（`OPENCLAW_GATEWAY_TOKEN` が設定されている場合のデフォルト）
- `password`（`OPENCLAW_GATEWAY_PASSWORD` または設定による共有シークレット）
- `trusted-proxy`（ID 対応リバースプロキシ。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照）

`tailscale.mode = "serve"` かつ `gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket 認証では、トークンやパスワードを指定せずに Tailscale ID ヘッダー（`tailscale-user-login`）を使用できます。OpenClaw は、ローカル Tailscale デーモン（`tailscale whois`）を使って `x-forwarded-for` アドレスを解決し、受け入れる前にその結果をヘッダーと照合することで ID を検証します。OpenClaw は、リクエストが loopback から到着し、Tailscale の `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` ヘッダーを含む場合にのみ、そのリクエストを Serve として扱います。
ブラウザーのデバイス ID を含む Control UI オペレーターセッションでは、この検証済み Serve パスでもデバイスペアリングの往復をスキップします。ただし、ブラウザーのデバイス ID を迂回するわけではありません。デバイスのないクライアントは引き続き拒否され、ノードロールまたは Control UI 以外の WebSocket 接続は通常どおりペアリングと認証チェックに従います。
HTTP API エンドポイント（たとえば `/v1/*`、`/tools/invoke`、`/api/channels/*`）は、Tailscale ID ヘッダー認証を使用しません。これらは引き続き Gateway の通常の HTTP 認証モードに従います。デフォルトでは共有シークレット認証、または意図的に設定された trusted-proxy / プライベート ingress の `none` 構成です。
このトークンレスフローは、Gateway ホストが信頼されていることを前提とします。同じホスト上で信頼できないローカルコードが実行される可能性がある場合は、`gateway.auth.allowTailscale` を無効にし、代わりにトークン/パスワード認証を必須にしてください。
明示的な共有シークレット認証情報を必須にするには、`gateway.auth.allowTailscale: false` を設定し、`gateway.auth.mode: "token"` または `"password"` を使用します。

## 設定例

### Tailnet 限定（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開く: `https://<magicdns>/`（または設定済みの `gateway.controlUi.basePath`）

デバイスホスト名の代わりに名前付き Tailscale Service 経由で Control UI を公開するには、`gateway.tailscale.serviceName` を Service 名に設定します。

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

上の例では、起動時に Service URL がデバイスホスト名ではなく `https://openclaw.<tailnet-name>.ts.net/` として報告されます。Tailscale Services では、ホストが tailnet 内で承認済みのタグ付きノードである必要があります。このオプションを有効にする前に Tailscale でタグを設定し、Service を承認してください。そうしないと、Gateway 起動中に `tailscale serve --service=...` が失敗します。

### Tailnet 限定（Tailnet IP にバインド）

Gateway が Tailnet IP で直接待ち受けるようにしたい場合に使用します（Serve/Funnel なし）。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

別の Tailnet デバイスから接続します。

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
このモードでは loopback（`http://127.0.0.1:18789`）は**動作しません**。
</Note>

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

パスワードをディスクにコミットするより、`OPENCLAW_GATEWAY_PASSWORD` を使用することを推奨します。

## CLI 例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注記

- Tailscale Serve/Funnel には、`tailscale` CLI がインストールされ、ログイン済みである必要があります。
- `tailscale.mode: "funnel"` は、公開露出を避けるため、認証モードが `password` でない限り起動を拒否します。
- `gateway.tailscale.serviceName` は Serve モードにのみ適用され、`tailscale serve --service=<name>` に渡されます。値は、たとえば `svc:openclaw` のような Tailscale の `svc:<dns-label>` Service 名形式を使用する必要があります。Tailscale では Service ホストがタグ付きノードである必要があり、Serve が公開できるようになる前に管理コンソールで Service の承認が必要になる場合があります。
- シャットダウン時に OpenClaw が `tailscale serve` または `tailscale funnel` 設定を元に戻すようにするには、`gateway.tailscale.resetOnExit` を設定します。
- 外部で設定された `tailscale funnel` ルートを Gateway 再起動後も維持するには、`gateway.tailscale.preserveFunnel: true` を設定します。有効にして Gateway が `mode: "serve"` で実行されている場合、OpenClaw は Serve を再適用する前に `tailscale funnel status` を確認し、Funnel ルートがすでに Gateway ポートをカバーしている場合はスキップします。OpenClaw 管理の Funnel パスワード必須ポリシーは変更されません。
- `gateway.bind: "tailnet"` は直接 Tailnet バインドです（HTTPS なし、Serve/Funnel なし）。
- `gateway.bind: "auto"` は loopback を優先します。Tailnet 限定にしたい場合は `tailnet` を使用してください。
- Serve/Funnel が公開するのは **Gateway Control UI + WS** のみです。ノードは同じ Gateway WS エンドポイント経由で接続するため、Serve はノードアクセスにも使用できます。

## ブラウザー制御（リモート Gateway + ローカルブラウザー）

あるマシンで Gateway を実行し、別のマシン上のブラウザーを操作したい場合は、ブラウザーマシンで**ノードホスト**を実行し、両方を同じ tailnet 上に置きます。Gateway はブラウザー操作をノードへプロキシします。別個の制御サーバーや Serve URL は不要です。

ブラウザー制御には Funnel を避けてください。ノードペアリングはオペレーターアクセスと同じように扱います。

## Tailscale の前提条件と制限

- Serve には tailnet で HTTPS が有効になっている必要があります。不足している場合、CLI がプロンプトを表示します。
- Serve は Tailscale ID ヘッダーを注入します。Funnel は注入しません。
- Funnel には Tailscale v1.38.3 以降、MagicDNS、HTTPS の有効化、および funnel ノード属性が必要です。
- Funnel は TLS 経由でポート `443`、`8443`、`10000` のみをサポートします。
- macOS 上の Funnel には、オープンソースの Tailscale アプリバリアントが必要です。

## 詳細

- Tailscale Serve 概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 関連

- [リモートアクセス](/ja-JP/gateway/remote)
- [検出](/ja-JP/gateway/discovery)
- [認証](/ja-JP/gateway/authentication)
