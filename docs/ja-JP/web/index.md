---
read_when:
    - Tailscale 経由で Gateway にアクセスしたい
    - ブラウザーの Control UI と設定編集を使いたい場合
summary: 'Gateway Web サーフェス: Control UI、バインドモード、セキュリティ'
title: Web
x-i18n:
    generated_at: "2026-07-05T11:56:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway は、Gateway WebSocket と同じポートから小さな **ブラウザー Control UI** (Vite + Lit) を提供します。

- デフォルト: `http://<host>:18789/`
- `gateway.tls.enabled: true` の場合: `https://<host>:18789/`
- 任意のプレフィックス: `gateway.controlUi.basePath` を設定します (例: `/openclaw`)

機能は [Control UI](/ja-JP/web/control-ui) にあります。このページでは、バインドモード、セキュリティ、その他の Web 向けサーフェスについて説明します。

## 設定 (デフォルトで有効)

Control UI は、アセットが存在する場合 (`dist/control-ui`) に **デフォルトで有効** です。

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Webhook

`hooks.enabled=true` の場合、Gateway は同じ HTTP サーバー上に Webhook エンドポイントも公開します。認証とペイロードについては、[Gateway 設定リファレンス](/ja-JP/gateway/configuration-reference#hooks) の `hooks` を参照してください。

## 管理 HTTP RPC

`POST /api/v1/admin/rpc` は、選択された Gateway コントロールプレーンメソッドを HTTP 経由で公開します。デフォルトではオフで、`admin-http-rpc` Plugin が有効な場合にのみ登録されます。認証モデル、許可されるメソッド、WebSocket API との比較については、[管理 HTTP RPC](/ja-JP/plugins/admin-http-rpc) を参照してください。

## Tailscale アクセス

<Tabs>
  <Tab title="Integrated Serve (recommended)">
    Gateway を loopback に保持し、Tailscale Serve にプロキシさせます。

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Gateway を起動します。

    ```bash
    openclaw gateway
    ```

    `https://<magicdns>/` (または設定済みの `gateway.controlUi.basePath`) を開きます。

  </Tab>
  <Tab title="Tailnet bind + token">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Gateway を起動します (この非 loopback の例では共有シークレットトークン認証を使用します)。

    ```bash
    openclaw gateway
    ```

    `http://<tailscale-ip>:18789/` (または設定済みの `gateway.controlUi.basePath`) を開きます。

  </Tab>
  <Tab title="Public internet (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` には `gateway.auth.mode: "password"` が必要です。Serve と Funnel はどちらも `gateway.bind: "loopback"` を必要とします。

  </Tab>
</Tabs>

## セキュリティメモ

- Gateway 認証はデフォルトで必須です。token、password、trusted-proxy、または有効化されている場合は Tailscale Serve ID ヘッダーを使用します。
- 非 loopback バインドでも Gateway 認証は **必須** です。token/password 認証、または `gateway.auth.mode: "trusted-proxy"` を持つ ID 対応リバースプロキシを使用します。
- オンボーディング ウィザードはデフォルトで共有シークレット認証を作成し、通常は loopback 上でも Gateway トークンを生成します。
- 共有シークレットモードでは、UI は WebSocket ハンドシェイク中に `connect.params.auth.token` または `connect.params.auth.password` を送信します。
- `gateway.tls.enabled: true` の場合、ローカルのダッシュボード/ステータスヘルパーは `https://` URL と `wss://` WebSocket URL をレンダリングします。
- ID を持つモード (Tailscale Serve、`trusted-proxy`) では、WebSocket 認証チェックは共有シークレットではなくリクエストヘッダーから満たされます。
- 公開された非 loopback Control UI デプロイでは、`gateway.controlUi.allowedOrigins` を明示的に設定してください (完全なオリジン)。プライベートな同一オリジン読み込みは、loopback、RFC1918/link-local、`.local`、`.ts.net`、Tailscale CGNAT ホストでは、設定なしで受け入れられます。
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` は Host ヘッダーのオリジンフォールバックを有効にします。これは危険なセキュリティ低下です。
- Serve では、`gateway.auth.allowTailscale: true` の場合、Tailscale ID ヘッダーが Control UI/WebSocket 認証を満たします (token/password は不要)。HTTP API エンドポイントは Tailscale ID ヘッダーを使用せず、常に Gateway の通常の HTTP 認証モードに従います。Serve 経由でも明示的な認証情報を必須にするには、`gateway.auth.allowTailscale: false` を設定します。このトークンなしフローは、Gateway ホスト自体が信頼されていることを前提とします。[Tailscale](/ja-JP/gateway/tailscale) と [セキュリティ](/ja-JP/gateway/security) を参照してください。

## UI のビルド

Gateway は `dist/control-ui` から静的ファイルを提供します。

```bash
pnpm ui:build
```
