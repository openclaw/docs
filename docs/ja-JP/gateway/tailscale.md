---
read_when:
    - localhost の外部に Gateway 制御 UI を公開する
    - tailnetまたは公開ダッシュボードアクセスの自動化
summary: Gatewayダッシュボード向けの統合Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T05:16:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw は、Gateway ダッシュボードと WebSocket ポート向けに Tailscale **Serve**（tailnet）または **Funnel**（公開）を自動構成できます。これにより Gateway は loopback にバインドされたまま、Tailscale が HTTPS、ルーティング、および（Serve の場合）ID ヘッダーを提供します。

## モード

- `serve`: `tailscale serve` による tailnet 専用 Serve。Gateway は `127.0.0.1` のままです。
- `funnel`: `tailscale funnel` による公開 HTTPS。OpenClaw は共有パスワードを要求します。
- `off`: デフォルト（Tailscale 自動化なし）。

ステータスと監査出力では、この OpenClaw Serve/Funnel モードに **Tailscale 公開** を使用します。`off` は、OpenClaw が Serve または Funnel を管理していないことを意味します。local Tailscale デーモンが停止している、またはログアウトしているという意味ではありません。

## 認証

ハンドシェイクを制御するには `gateway.auth.mode` を設定します。

- `none`（プライベート ingress のみ）
- `token`（`OPENCLAW_GATEWAY_TOKEN` が設定されている場合のデフォルト）
- `password`（`OPENCLAW_GATEWAY_PASSWORD` または構成による共有シークレット）
- `trusted-proxy`（ID 対応リバースプロキシ。[信頼済みプロキシ認証](/ja-JP/gateway/trusted-proxy-auth)を参照）

`tailscale.mode = "serve"` かつ `gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket 認証はトークン/パスワードを指定せずに Tailscale ID ヘッダー（`tailscale-user-login`）を使用できます。OpenClaw は、local Tailscale デーモン（`tailscale whois`）で `x-forwarded-for` アドレスを解決し、受け入れる前にそれがヘッダーと一致することを確認して ID を検証します。OpenClaw は、リクエストが loopback から到着し、Tailscale の `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` ヘッダーを含む場合にのみ、そのリクエストを Serve として扱います。
ブラウザーデバイス ID を含む Control UI オペレーターセッションでは、この検証済み Serve パスはデバイスペアリングの往復もスキップします。ブラウザーデバイス ID を迂回するわけではありません。デバイスのないクライアントは引き続き拒否され、ノードロールまたは Control UI 以外の WebSocket 接続は通常のペアリングと認証チェックに従います。
HTTP API エンドポイント（たとえば `/v1/*`、`/tools/invoke`、`/api/channels/*`）は Tailscale ID ヘッダー認証を使用**しません**。これらは引き続き Gateway の通常の HTTP 認証モードに従います。デフォルトでは共有シークレット認証、または意図的に構成された trusted-proxy / プライベート ingress の `none` セットアップです。
このトークンレスフローは、Gateway ホストが信頼済みであることを前提とします。同じホスト上で信頼できないローカルコードが実行される可能性がある場合は、`gateway.auth.allowTailscale` を無効にし、代わりにトークン/パスワード認証を要求してください。
明示的な共有シークレット資格情報を必須にするには、`gateway.auth.allowTailscale: false` を設定し、`gateway.auth.mode: "token"` または `"password"` を使用します。

## 構成例

### tailnet 専用（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

開く: `https://<magicdns>/`（または構成済みの `gateway.controlUi.basePath`）

### tailnet 専用（Tailnet IP にバインド）

Gateway を Tailnet IP で直接待ち受けさせたい場合に使用します（Serve/Funnel なし）。

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
このモードでは、Loopback（`http://127.0.0.1:18789`）は動作**しません**。
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

パスワードをディスクにコミットするよりも、`OPENCLAW_GATEWAY_PASSWORD` を優先してください。

## CLI 例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注記

- Tailscale Serve/Funnel には、`tailscale` CLI がインストールされ、ログイン済みである必要があります。
- `tailscale.mode: "funnel"` は、公開露出を避けるため、認証モードが `password` でない限り起動を拒否します。
- シャットダウン時に OpenClaw に `tailscale serve` または `tailscale funnel` 構成を元に戻させたい場合は、`gateway.tailscale.resetOnExit` を設定してください。
- `gateway.bind: "tailnet"` は直接 Tailnet バインドです（HTTPS なし、Serve/Funnel なし）。
- `gateway.bind: "auto"` は loopback を優先します。Tailnet 専用にしたい場合は `tailnet` を使用します。
- Serve/Funnel は **Gateway Control UI + WS** のみを公開します。ノードは同じ Gateway WS エンドポイント経由で接続するため、Serve はノードアクセスにも利用できます。

## ブラウザー制御（リモート Gateway + ローカルブラウザー）

Gateway をあるマシンで実行し、別のマシン上のブラウザーを操作したい場合は、ブラウザーマシンで **ノードホスト** を実行し、両方を同じ tailnet 上に置いてください。Gateway はブラウザー操作をノードにプロキシします。別個の制御サーバーや Serve URL は不要です。

ブラウザー制御に Funnel は避けてください。ノードペアリングはオペレーターアクセスと同様に扱ってください。

## Tailscale の前提条件と制限

- Serve には、tailnet で HTTPS が有効化されている必要があります。未設定の場合、CLI がプロンプトを表示します。
- Serve は Tailscale ID ヘッダーを挿入します。Funnel は挿入しません。
- Funnel には Tailscale v1.38.3 以上、MagicDNS、HTTPS の有効化、および funnel ノード属性が必要です。
- Funnel は TLS 経由でポート `443`、`8443`、`10000` のみをサポートします。
- macOS 上の Funnel には、オープンソース版 Tailscale アプリが必要です。

## 詳細

- Tailscale Serve 概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 関連

- [リモートアクセス](/ja-JP/gateway/remote)
- [検出](/ja-JP/gateway/discovery)
- [認証](/ja-JP/gateway/authentication)
