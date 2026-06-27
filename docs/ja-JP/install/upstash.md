---
read_when:
    - OpenClaw を Upstash Box にデプロイする
    - OpenClaw 用のマネージド Linux 環境と、SSH トンネル経由のダッシュボードアクセスが必要な場合
summary: キープアライブと SSH トンネルアクセスを使って Upstash Box で OpenClaw をホストする
title: Upstash ボックス
x-i18n:
    generated_at: "2026-06-27T11:51:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Upstash Box 上で永続的な OpenClaw Gateway を実行します。これは、キープアライブのライフサイクルサポートを備えたマネージド Linux 環境です。

ダッシュボードへのアクセスには SSH トンネルを使用します。Gateway ポートを公開インターネットへ直接公開しないでください。

## 前提条件

- Upstash アカウント
- 常時稼働 Upstash Box
- ローカルマシン上の SSH クライアント

## Box を作成する

Upstash Console で常時稼働 Box を作成します。`right-flamingo-14486` のような Box ID と、Box API キーを控えておきます。

Upstash は現在の OpenClaw Box 手順を
[OpenClaw セットアップ](https://upstash.com/docs/box/guides/openclaw-setup)で管理しています。

## SSH トンネルで接続する

OpenClaw ダッシュボードのポートをローカルマシンへ転送します。求められたら、Box API キーを SSH パスワードとして使用します。

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

キープアライブオプションにより、オンボーディング中のアイドル状態によるトンネル切断を減らせます。

## OpenClaw をインストールする

Box 内で実行します。

```bash
sudo npm install -g openclaw
```

## オンボーディングを実行する

```bash
openclaw onboard --install-daemon
```

プロンプトに従います。オンボーディングが完了したら、ダッシュボード URL とトークンをコピーします。

## Gateway を起動する

Box ネットワーク向けに Gateway を設定し、バックグラウンドで起動します。

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

SSH トンネルが有効な状態で、ダッシュボード URL をローカルで開きます。

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 自動再起動

Box の起動時に Gateway が再起動するように、このコマンドを Box の init スクリプトとして設定します。

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## トラブルシューティング

オンボーディング中に SSH がフリーズする場合は、クリーンな SSH 設定とキープアライブで再接続します。

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

これにより、古いローカルの `~/.ssh/config` 設定を迂回し、アイドル状態のネットワーク期間中もトンネルをアクティブに保ちます。

## 関連

- [リモートアクセス](/ja-JP/gateway/remote)
- [Gateway セキュリティ](/ja-JP/gateway/security)
- [OpenClaw の更新](/ja-JP/install/updating)
