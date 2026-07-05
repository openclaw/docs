---
read_when:
    - OpenClaw を Upstash Box にデプロイする
    - OpenClaw 用に、SSH トンネル経由のダッシュボードアクセスを備えた管理型 Linux 環境が必要です
summary: Upstash Box で OpenClaw をホストし、キープアライブと SSH トンネルアクセスを利用する
title: Upstash ボックス
x-i18n:
    generated_at: "2026-07-05T11:28:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Upstash Box 上で、keep-alive ライフサイクル対応のマネージド Linux 環境を使用して、永続的な OpenClaw Gateway を実行します。

ダッシュボードへのアクセスには SSH トンネルを使用します。Gateway ポートを public internet に直接公開しないでください。

## 前提条件

- Upstash アカウント
- keep-alive Upstash Box
- ローカルマシン上の SSH クライアント

## Box を作成する

Upstash Console で keep-alive Box を作成します。Box ID（例: `right-flamingo-14486`）と Box API キーを控えておきます。

Upstash は現在の OpenClaw Box 手順を
[OpenClaw Setup](https://upstash.com/docs/box/guides/openclaw-setup) で管理しています。

## SSH トンネルで接続する

OpenClaw ダッシュボードポートをローカルマシンに転送します。プロンプトが表示されたら、Box API キーを SSH パスワードとして使用します。

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

keepalive オプションにより、オンボーディング中のアイドル状態によるトンネル切断が減ります。

## OpenClaw をインストールする

Box 内で:

```bash
sudo npm install -g openclaw
```

## オンボーディングを実行する

```bash
openclaw onboard --install-daemon
```

プロンプトに従います。オンボーディングが完了したら、ダッシュボード URL とトークンをコピーします。

## Gateway を起動する

Box ネットワーク用に Gateway を設定し、バックグラウンドで起動します。

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

SSH トンネルが有効な状態で、ダッシュボード URL をローカルで開きます。

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 自動再起動

Box の起動時に Gateway が再起動するように、このコマンドを Box init スクリプトとして設定します。

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## トラブルシューティング

オンボーディング中に SSH がフリーズする場合は、クリーンな SSH 設定と keepalive で再接続します。

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

これにより、古いローカル `~/.ssh/config` 設定をバイパスし、アイドル状態のネットワーク期間中もトンネルをアクティブに保てます。

## 関連

- [リモートアクセス](/ja-JP/gateway/remote)
- [Gateway セキュリティ](/ja-JP/gateway/security)
- [OpenClaw の更新](/ja-JP/install/updating)
