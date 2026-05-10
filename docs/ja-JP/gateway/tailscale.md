---
read_when:
    - Gateway 制御 UI を localhost の外部に公開する
    - tailnet または公開ダッシュボードへのアクセスの自動化
summary: Gatewayダッシュボード向けの統合Tailscale Serve/Funnel
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw は、Gateway ダッシュボードと WebSocket ポート向けに Tailscale **Serve**（tailnet）または **Funnel**（公開）を自動構成できます。これにより Gateway はループバックにバインドされたまま、Tailscale が HTTPS、ルーティング、および（Serve の場合）ID ヘッダーを提供します。

## モード

- `serve`: `tailscale serve` による tailnet 専用 Serve。Gateway は `127.0.0.1` に留まります。
- `funnel`: `tailscale funnel` による公開 HTTPS。OpenClaw は共有パスワードを要求します。
- `off`: デフォルト（Tailscale 自動化なし）。

ステータスと監査出力では、この OpenClaw Serve/Funnel モードに **Tailscale 公開** を使用します。`off` は OpenClaw が Serve または Funnel を管理していないことを意味します。ローカルの Tailscale デーモンが停止している、またはログアウトしているという意味ではありません。

## 認証

ハンドシェイクを制御するには `gateway.auth.mode` を設定します。

- `none`（プライベートな入口のみ）
- `token`（`OPENCLAW_GATEWAY_TOKEN` が設定されている場合のデフォルト）
- `password`（`OPENCLAW_GATEWAY_PASSWORD` または構成による共有シークレット）
- `trusted-proxy`（ID 対応リバースプロキシ。[Trusted Proxy Auth](/ja-JP/gateway/trusted-proxy-auth) を参照）

`tailscale.mode = "serve"` で `gateway.auth.allowTailscale` が `true` の場合、Control UI/WebSocket 認証はトークン/パスワードを指定せずに Tailscale ID ヘッダー（`tailscale-user-login`）を使用できます。OpenClaw はローカルの Tailscale デーモン（`tailscale whois`）で `x-forwarded-for` アドレスを解決し、それをヘッダーと照合してから受け入れることで ID を検証します。OpenClaw は、リクエストがループバックから到着し、Tailscale の `x-forwarded-for`、`x-forwarded-proto`、`x-forwarded-host` ヘッダーを伴う場合にのみ、そのリクエストを Serve として扱います。
ブラウザーのデバイス ID を含む Control UI オペレーターセッションでは、この検証済み Serve パスによりデバイスペアリングの往復も省略されます。これはブラウザーのデバイス ID を迂回するものではありません。デバイスなしのクライアントは引き続き拒否され、ノードロールまたは Control UI 以外の WebSocket 接続は通常のペアリングと認証チェックに従います。
HTTP API エンドポイント（例: `/v1/*`、`/tools/invoke`、`/api/channels/*`）は Tailscale ID ヘッダー認証を使用**しません**。これらは引き続き Gateway の通常の HTTP 認証モードに従います。デフォルトでは共有シークレット認証、または意図的に構成された trusted-proxy / プライベート入口の `none` セットアップです。
このトークンなしフローは、Gateway ホストが信頼されていることを前提とします。同じホスト上で信頼できないローカルコードが実行される可能性がある場合は、`gateway.auth.allowTailscale` を無効にし、代わりにトークン/パスワード認証を要求してください。
明示的な共有シークレット資格情報を要求するには、`gateway.auth.allowTailscale: false` を設定し、`gateway.auth.mode: "token"` または `"password"` を使用します。

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

### tailnet 専用（tailnet IP にバインド）

Gateway が tailnet IP で直接待ち受けるようにしたい場合に使用します（Serve/Funnel なし）。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

別の tailnet デバイスから接続します。

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
このモードでは、ループバック（`http://127.0.0.1:18789`）は動作**しません**。
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

パスワードをディスクにコミットするより、`OPENCLAW_GATEWAY_PASSWORD` を優先してください。

## CLI 例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注記

- Tailscale Serve/Funnel には、`tailscale` CLI がインストールされ、ログイン済みである必要があります。
- `tailscale.mode: "funnel"` は、公開露出を避けるため、認証モードが `password` でない限り起動を拒否します。
- シャットダウン時に OpenClaw が `tailscale serve` または `tailscale funnel` 構成を元に戻すようにしたい場合は、`gateway.tailscale.resetOnExit` を設定します。
- 外部で構成された `tailscale funnel` ルートを Gateway の再起動をまたいで維持するには、`gateway.tailscale.preserveFunnel: true` を設定します。有効化され、Gateway が `mode: "serve"` で動作している場合、OpenClaw は Serve を再適用する前に `tailscale funnel status` を確認し、Funnel ルートがすでに Gateway ポートをカバーしている場合はスキップします。OpenClaw が管理する Funnel のパスワード専用ポリシーは変更されません。
- `gateway.bind: "tailnet"` は直接の tailnet バインドです（HTTPS なし、Serve/Funnel なし）。
- `gateway.bind: "auto"` はループバックを優先します。tailnet 専用にしたい場合は `tailnet` を使用します。
- Serve/Funnel が公開するのは **Gateway Control UI + WS** のみです。ノードは同じ Gateway WS エンドポイント経由で接続するため、Serve はノードアクセスにも使用できます。

## ブラウザー制御（リモート Gateway + ローカルブラウザー）

1 台のマシンで Gateway を実行し、別のマシン上のブラウザーを操作したい場合は、ブラウザーマシン上で **ノードホスト** を実行し、両方を同じ tailnet に置きます。Gateway はブラウザー操作をノードへプロキシします。別個の制御サーバーや Serve URL は不要です。

ブラウザー制御には Funnel を避け、ノードペアリングをオペレーターアクセスと同様に扱ってください。

## Tailscale の前提条件 + 制限

- Serve には tailnet で HTTPS が有効になっている必要があります。未設定の場合、CLI がプロンプトを表示します。
- Serve は Tailscale ID ヘッダーを挿入します。Funnel は挿入しません。
- Funnel には Tailscale v1.38.3 以降、MagicDNS、HTTPS の有効化、および funnel ノード属性が必要です。
- Funnel が TLS 経由でサポートするポートは `443`、`8443`、`10000` のみです。
- macOS 上の Funnel には、オープンソース版の Tailscale アプリが必要です。

## 詳細情報

- Tailscale Serve 概要: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` コマンド: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概要: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` コマンド: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## 関連

- [リモートアクセス](/ja-JP/gateway/remote)
- [検出](/ja-JP/gateway/discovery)
- [認証](/ja-JP/gateway/authentication)
