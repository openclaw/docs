---
read_when:
    - Tailscale 経由で Gateway にアクセスしたい場合
    - ブラウザーの Control UI と設定編集が必要です
summary: 'Gateway の Web サーフェス: コントロール UI、バインドモード、セキュリティ'
title: ウェブ
x-i18n:
    generated_at: "2026-04-30T05:41:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 16
---

Gateway は、Gateway WebSocket と同じポートから小さな **ブラウザー Control UI** (Vite + Lit) を提供します。

- デフォルト: `http://<host>:18789/`
- `gateway.tls.enabled: true` の場合: `https://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

機能は [Control UI](/ja-JP/web/control-ui) にあります。このページの残りでは、バインドモード、セキュリティ、Web 向けサーフェスに焦点を当てます。

## Webhook

`hooks.enabled=true` の場合、Gateway は同じ HTTP サーバー上に小さな Webhook エンドポイントも公開します。
認証とペイロードについては、[Gateway 設定](/ja-JP/gateway/configuration) → `hooks` を参照してください。

## 設定 (デフォルトで有効)

Control UI は、アセットが存在する場合 (`dist/control-ui`) **デフォルトで有効**です。
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

Gateway を loopback のままにし、Tailscale Serve にプロキシさせます。

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

次に Gateway を起動します (この非 loopback の例では共有シークレットトークン認証を使用します)。

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

## セキュリティメモ

- Gateway 認証はデフォルトで必須です (有効な場合はトークン、パスワード、trusted-proxy、または Tailscale Serve ID ヘッダー)。
- 非 loopback バインドでも Gateway 認証は引き続き**必須**です。実際には、これはトークン/パスワード認証、または `gateway.auth.mode: "trusted-proxy"` を使用した ID 対応リバースプロキシを意味します。
- ウィザードはデフォルトで共有シークレット認証を作成し、通常は Gateway トークンを生成します (loopback の場合でも)。
- 共有シークレットモードでは、UI は `connect.params.auth.token` または `connect.params.auth.password` を送信します。
- `gateway.tls.enabled: true` の場合、ローカルダッシュボードとステータスヘルパーは `https://` ダッシュボード URL と `wss://` WebSocket URL を表示します。
- Tailscale Serve や `trusted-proxy` などの ID を含むモードでは、代わりにリクエストヘッダーから WebSocket 認証チェックが満たされます。
- 非 loopback の Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定してください (完全なオリジン)。設定しない場合、Gateway の起動はデフォルトで拒否されます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は Host ヘッダーのオリジンフォールバックモードを有効にしますが、危険なセキュリティ低下です。
- Serve では、`gateway.auth.allowTailscale` が `true` の場合、Tailscale ID ヘッダーで Control UI/WebSocket 認証を満たせます (トークン/パスワードは不要)。HTTP API エンドポイントはこれらの Tailscale ID ヘッダーを使用せず、代わりに Gateway の通常の HTTP 認証モードに従います。明示的な認証情報を要求するには、`gateway.auth.allowTailscale: false` を設定します。[Tailscale](/ja-JP/gateway/tailscale) と [セキュリティ](/ja-JP/gateway/security) を参照してください。このトークンなしフローは、Gateway ホストが信頼されていることを前提としています。
- `gateway.tailscale.mode: "funnel"` には `gateway.auth.mode: "password"` (共有パスワード) が必要です。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。次でビルドします。

```bash
pnpm ui:build
```
