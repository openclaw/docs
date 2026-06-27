---
read_when:
    - Tailscale 経由で Gateway にアクセスしたい
    - ブラウザーの Control UI と設定編集を使いたい
summary: 'Gateway Web サーフェス: Control UI、バインドモード、セキュリティ'
title: ウェブ
x-i18n:
    generated_at: "2026-06-27T13:23:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway は、Gateway WebSocket と同じポートから小さな **ブラウザー Control UI** (Vite + Lit) を配信します。

- デフォルト: `http://<host>:18789/`
- `gateway.tls.enabled: true` の場合: `https://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

機能は [Control UI](/ja-JP/web/control-ui) にあります。このページの残りでは、バインドモード、セキュリティ、Web 向けサーフェスに焦点を当てます。

## Webhook

`hooks.enabled=true` の場合、Gateway は同じ HTTP サーバー上に小さな Webhook エンドポイントも公開します。
認証とペイロードについては、[Gateway 設定](/ja-JP/gateway/configuration) → `hooks` を参照してください。

## 管理 HTTP RPC

管理 HTTP RPC は、選択された Gateway コントロールプレーンメソッドを `POST /api/v1/admin/rpc` で公開します。
デフォルトではオフで、`admin-http-rpc` Plugin が有効な場合にのみ登録されます。
認証モデル、許可されるメソッド、WebSocket との比較については、[管理 HTTP RPC](/ja-JP/plugins/admin-http-rpc) を参照してください。

## 設定 (デフォルトでオン)

Control UI は、アセットが存在する場合 (`dist/control-ui`) **デフォルトで有効** です。
設定で制御できます。

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale アクセス

### 統合 Serve (推奨)

Gateway をループバックに維持し、Tailscale Serve にプロキシさせます。

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

次に Gateway を起動します。

```bash
openclaw gateway
```

開く:

- `https://<magicdns>/` (または設定済みの `gateway.controlUi.basePath`)

### Tailnet バインド + トークン

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

次に Gateway を起動します (この非ループバックの例では共有シークレットトークン
認証を使用します)。

```bash
openclaw gateway
```

開く:

- `http://<tailscale-ip>:18789/` (または設定済みの `gateway.controlUi.basePath`)

### パブリックインターネット (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## セキュリティノート

- Gateway 認証はデフォルトで必須です (トークン、パスワード、信頼済みプロキシ、または有効化されている場合は Tailscale Serve ID ヘッダー)。
- 非ループバックバインドでも Gateway 認証は **必須** です。実際には、トークン/パスワード認証、または `gateway.auth.mode: "trusted-proxy"` を使用する ID 対応リバースプロキシを意味します。
- ウィザードはデフォルトで共有シークレット認証を作成し、通常は
  Gateway トークンを生成します (ループバック上でも)。
- 共有シークレットモードでは、UI は `connect.params.auth.token` または
  `connect.params.auth.password` を送信します。
- `gateway.tls.enabled: true` の場合、ローカルダッシュボードとステータスヘルパーは
  `https://` ダッシュボード URL と `wss://` WebSocket URL を表示します。
- Tailscale Serve や `trusted-proxy` などの ID を持つモードでは、
  代わりにリクエストヘッダーから WebSocket 認証チェックが満たされます。
- パブリックな非ループバック Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を
  明示的に設定してください (完全なオリジン)。プライベートな同一オリジンの LAN/Tailnet 読み込みは、ループバック、
  RFC1918/link-local、`.local`、`.ts.net`、Tailscale CGNAT ホストで受け入れられます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は
  Host ヘッダーオリジンフォールバックモードを有効にしますが、危険なセキュリティ低下です。
- Serve では、`gateway.auth.allowTailscale` が `true` の場合、Tailscale ID ヘッダーで Control UI/WebSocket 認証を満たせます (トークン/パスワードは不要)。
  HTTP API エンドポイントはそれらの Tailscale ID ヘッダーを使用せず、代わりに
  Gateway の通常の HTTP 認証モードに従います。明示的な認証情報を必須にするには
  `gateway.auth.allowTailscale: false` を設定してください。[Tailscale](/ja-JP/gateway/tailscale) と [セキュリティ](/ja-JP/gateway/security) を参照してください。この
  トークンなしフローは、Gateway ホストが信頼されていることを前提とします。
- `gateway.tailscale.mode: "funnel"` には `gateway.auth.mode: "password"` (共有パスワード) が必要です。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを配信します。次でビルドします。

```bash
pnpm ui:build
```
