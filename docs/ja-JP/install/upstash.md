---
read_when:
    - Upstash Box への OpenClaw のデプロイ
    - SSH トンネル経由でダッシュボードにアクセスできる、OpenClaw 用のマネージド Linux 環境が必要な場合
summary: キープアライブと SSH トンネルアクセスを使用して Upstash Box 上で OpenClaw をホストする
title: Upstash Box
x-i18n:
    generated_at: "2026-07-11T22:20:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Upstash Box（キープアライブライフサイクルをサポートするマネージド Linux 環境）上で、常時稼働する OpenClaw Gateway を実行します。

ダッシュボードへのアクセスには SSH トンネルを使用してください。Gateway ポートを公開インターネットに直接公開しないでください。

## 前提条件

- Upstash アカウント
- キープアライブ対応の Upstash Box
- ローカルマシン上の SSH クライアント

## Box の作成

Upstash Console でキープアライブ対応の Box を作成します。Box ID（例：`right-flamingo-14486`）と Box API キーを控えてください。

Upstash では、最新の OpenClaw Box セットアップ手順を
[OpenClaw のセットアップ](https://upstash.com/docs/box/guides/openclaw-setup)で公開しています。

## SSH トンネルでの接続

OpenClaw ダッシュボードのポートをローカルマシンへ転送します。入力を求められたら、Box API キーを SSH パスワードとして使用してください。

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

キープアライブオプションにより、オンボーディング中にアイドル状態が原因でトンネルが切断される可能性を低減できます。

## OpenClaw のインストール

Box 内で次を実行します。

```bash
sudo npm install -g openclaw
```

## オンボーディングの実行

```bash
openclaw onboard --install-daemon
```

画面の指示に従ってください。オンボーディングが完了したら、ダッシュボードの URL とトークンをコピーします。

## Gateway の起動

Box ネットワーク向けに Gateway を設定し、バックグラウンドで起動します。

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

SSH トンネルが有効な状態で、ローカルからダッシュボードの URL を開きます。

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 自動再起動

Box の起動時に Gateway が再起動するように、次のコマンドを Box の初期化スクリプトとして設定します。

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## トラブルシューティング

オンボーディング中に SSH が停止した場合は、クリーンな SSH 設定とキープアライブを使用して再接続します。

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

これにより、古いローカルの `~/.ssh/config` 設定を迂回し、ネットワークがアイドル状態の間もトンネルを維持できます。

## 関連項目

- [リモートアクセス](/ja-JP/gateway/remote)
- [Gateway のセキュリティ](/ja-JP/gateway/security)
- [OpenClaw の更新](/ja-JP/install/updating)
