---
read_when:
    - Gateway用の安価な常時稼働Linuxホストが欲しい
    - 自前のVPSを運用せずに、リモートのControl UIアクセスを使いたい
summary: exe.dev 上で OpenClaw Gateway を実行する（VM + HTTPSプロキシ、リモートアクセス向け）
title: exe.dev
x-i18n:
    generated_at: "2026-04-24T05:03:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

目標: OpenClaw Gateway を exe.dev のVM上で実行し、ラップトップから `https://<vm-name>.exe.xyz` 経由で到達できるようにする

このページは、exe.dev のデフォルト **exeuntu** イメージを前提としています。別のディストリビューションを選んだ場合は、パッケージ名を適宜読み替えてください。

## 初心者向けクイックパス

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 必要に応じて auth key/token を入力する
3. VMの横にある「Agent」をクリックし、Shelley のプロビジョニング完了を待つ
4. `https://<vm-name>.exe.xyz/` を開き、設定したshared secretで認証する（このガイドではデフォルトでtoken authを使いますが、`gateway.auth.mode` を切り替えればpassword authでも動作します）
5. 保留中のdevice pairing要求があれば、`openclaw devices approve <requestId>` で承認する

## 必要なもの

- exe.dev アカウント
- [exe.dev](https://exe.dev) 仮想マシンへの `ssh exe.dev` アクセス（任意）

## Shelley を使った自動インストール

[exe.dev](https://exe.dev) のagentである Shelley は、以下のプロンプトで OpenClaw を即座にインストールできます。

使用するプロンプトは次のとおりです:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手動インストール

## 1) VMを作成する

自分のデバイスから:

```bash
ssh exe.dev new
```

その後、接続します:

```bash
ssh <vm-name>.exe.xyz
```

ヒント: このVMは **stateful** のままにしてください。OpenClawは `~/.openclaw/` 配下に `openclaw.json`、エージェントごとの `auth-profiles.json`、sessions、チャネル/プロバイダ状態を保存し、workspaceは `~/.openclaw/workspace/` に保存します。

## 2) 前提パッケージをインストールする（VM上）

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClawをインストールする

OpenClawのインストールスクリプトを実行します:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) nginx を設定して OpenClaw をポート8000へプロキシする

`/etc/nginx/sites-enabled/default` を次の内容で編集します:

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

クライアントが供給したチェーンを保持するのではなく、forwarding headersは上書きしてください。OpenClawは、明示的に設定されたproxyからのforwarded IPメタデータのみを信頼し、追加方式の `X-Forwarded-For` チェーンはハードニング上のリスクとして扱います。

## 5) OpenClaw にアクセスして権限を付与する

`https://<vm-name>.exe.xyz/` にアクセスします（オンボーディング時の Control UI 出力を参照）。認証を求められた場合は、VM上の設定済みshared secretを貼り付けます。このガイドではtoken authを使うため、`openclaw config get gateway.auth.token` で `gateway.auth.token` を取得します（または `openclaw doctor --generate-gateway-token` で生成します）。
gatewayをpassword authに変更した場合は、代わりに `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` を使ってください。
デバイス承認は `openclaw devices list` と `openclaw devices approve <requestId>` で行います。迷ったら、ブラウザからShelleyを使ってください。

## リモートアクセス

リモートアクセスは [exe.dev](https://exe.dev) の認証によって処理されます。デフォルトでは、ポート8000からのHTTPトラフィックは、メール認証付きで `https://<vm-name>.exe.xyz` にforwardされます。

## 更新

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

ガイド: [更新](/ja-JP/install/updating)

## 関連

- [リモートgateway](/ja-JP/gateway/remote)
- [インストール概要](/ja-JP/install)
