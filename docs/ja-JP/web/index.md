---
read_when:
    - Tailscale 経由で Gateway にアクセスしたい場合
    - ブラウザの Control UI と config 編集を使いたい場合
summary: 'Gateway の Web サーフェス: Control UI、bind モード、セキュリティ'
title: Web
x-i18n:
    generated_at: "2026-04-23T14:11:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# Web（Gateway）

Gateway は、Gateway WebSocket と同じポートで小さな **ブラウザ Control UI**（Vite + Lit）を配信します。

- デフォルト: `http://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定（例: `/openclaw`）

機能については [Control UI](/ja-JP/web/control-ui) にあります。
このページでは、bind モード、セキュリティ、および Web 向けサーフェスに焦点を当てます。

## Webhook

`hooks.enabled=true` の場合、Gateway は同じ HTTP サーバー上に小さな Webhook エンドポイントも公開します。
認証とペイロードについては [Gateway の設定](/ja-JP/gateway/configuration) → `hooks` を参照してください。

## 設定（デフォルトで有効）

Control UI は、アセット（`dist/control-ui`）が存在する場合 **デフォルトで有効** です。
config で制御できます。

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath は任意
  },
}
```

## Tailscale アクセス

### 統合 Serve（推奨）

Gateway は loopback のままにし、Tailscale Serve にプロキシさせます。

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

その後 Gateway を起動します。

```bash
openclaw gateway
```

開く URL:

- `https://<magicdns>/`（または設定した `gateway.controlUi.basePath`）

### tailnet bind + トークン

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

その後 Gateway を起動します（この非 loopback の例では共有 secret の token
認証を使います）。

```bash
openclaw gateway
```

開く URL:

- `http://<tailscale-ip>:18789/`（または設定した `gateway.controlUi.basePath`）

### パブリックインターネット（Funnel）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // または OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## セキュリティ上の注意

- Gateway 認証はデフォルトで必須です（token、password、trusted-proxy、または有効時の Tailscale Serve identity header）。
- 非 loopback bind でも **Gateway 認証が必要** です。実際には token/password 認証、または `gateway.auth.mode: "trusted-proxy"` を使う identity-aware reverse proxy を意味します。
- ウィザードはデフォルトで共有 secret 認証を作成し、通常は
  gateway token も生成します（loopback 上でも）。
- 共有 secret モードでは、UI は `connect.params.auth.token` または
  `connect.params.auth.password` を送信します。
- Tailscale Serve や `trusted-proxy` のような identity を持つモードでは、
  WebSocket 認証チェックは代わりにリクエストヘッダーから満たされます。
- 非 loopback の Control UI デプロイでは、
  `gateway.controlUi.allowedOrigins` を明示的に設定してください（完全な origin）。これがない場合、gateway の起動はデフォルトで拒否されます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` は
  Host ヘッダー origin フォールバックモードを有効にしますが、危険なセキュリティ低下です。
- Serve では、`gateway.auth.allowTailscale` が `true` の場合、
  Tailscale identity header が Control UI/WebSocket 認証を満たせます（token/password は不要）。
  HTTP API エンドポイントはこれらの Tailscale identity header を使わず、
  通常の Gateway HTTP 認証モードに従います。明示的な認証情報を必須にするには
  `gateway.auth.allowTailscale: false` を設定してください。[Tailscale](/ja-JP/gateway/tailscale) および [Security](/ja-JP/gateway/security) を参照してください。この token なしフローは gateway ホストが信頼されている前提です。
- `gateway.tailscale.mode: "funnel"` には `gateway.auth.mode: "password"`（共有パスワード）が必要です。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを配信します。次でビルドしてください。

```bash
pnpm ui:build
```
