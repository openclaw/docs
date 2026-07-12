---
read_when:
    - QRコードログインを使用する個人用Zaloアシスタントボットが必要な場合
    - openclaw-zaloclawbot チャンネル Plugin をインストール、またはトラブルシューティングしています
summary: 外部の openclaw-zaloclawbot Plugin を使用した Zalo ClawBot チャンネルのセットアップ
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-11T21:59:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw は、カタログに掲載された外部 Plugin `@zalo-platforms/openclaw-zaloclawbot` を通じて Zalo ClawBot に接続します。ログインには Zalo Mini App の QR コードを使用します。設定内の Plugin ID は `openclaw-zaloclawbot` です。

## 互換性

| Plugin バージョン | OpenClaw バージョン | npm dist-tag | ステータス        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.4          | >=2026.4.10      | `latest`     | 有効 / ベータ |

## 前提条件

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) がインストール済み（`openclaw` CLI が利用可能）
- ログイン用 QR コードをスキャンするための、モバイル端末上の Zalo アカウント

## オンボーディングによるインストール（推奨）

```bash
openclaw onboard
```

チャンネルメニューから **Zalo ClawBot** を選択します。ウィザードが公式カタログから Plugin をインストールし（整合性検証済み）、ターミナルにログイン用 QR コードを表示します。Zalo アプリでスキャンすると、チャンネルのセットアップが完了します。

## 手動インストール

すでにオンボーディング済みの Gateway にチャンネルを追加するには、次の手順を実行します。

### 1. Plugin をインストールする

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

インストール時に OpenClaw がカタログの整合性ハッシュとパッケージを照合できるよう、正確に固定されたバージョンを使用してください。

### 2. 設定で Plugin を有効にする

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. QR コードを生成してログインする

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

ターミナルに表示された QR コードを Zalo モバイルアプリでスキャンし、Zalo Mini App 内の利用規約に同意して、セッションを認可します。

### 4. Gateway を再起動する

```bash
openclaw gateway restart
```

## 仕組み

独自の Zalo Official Account（OA）を登録して固定の開発者認証情報を設定する必要がある標準の Zalo チャンネルとは異なり、Zalo ClawBot は共有の公式インフラストラクチャ上で動作する、**所有者に紐付けられたパーソナルアシスタント**です。

1. **オンボーディング：** QR コードから Zalo Mini App が開き、共有の公式 OA 配下に新しくプロビジョニングされた非公開ボットが、Zalo ユーザー ID に直接紐付けられます。
2. **所有者に紐付けられたプライバシー：** ボットは所有者とのみ通信します。他のユーザーからのメッセージはプラットフォームレベルで破棄されます。
3. **公式 API 経由：** Plugin はブラウザや Web セッションの自動化ではなく、Zalo Bot Platform API を使用します。

## 内部の仕組み

Plugin は永続的なロングポーリングループ（`getUpdates`）を介して Zalo と通信します。ローカルのデスクトップまたはターミナルで Gateway を実行する場合、Webhook はデフォルトで無効です。メッセージはクライアント側で処理され、ローカルのエージェントランタイムにマッピングされます。

Plugin は OpenClaw の状態ディレクトリ内でボットの認証情報を管理します。このディレクトリは機密情報として扱い、OpenClaw のその他の状態データと同じアクセス制御およびバックアップポリシーの対象にしてください。

この Plugin のランタイムは、すべて外部パッケージ `@zalo-platforms/openclaw-zaloclawbot` 内にあります。以下に示すインストールおよび設定以外の動作詳細は Plugin のメンテナーから報告されたものであり、OpenClaw コアのソースに照らした検証は行われていません。

## トラブルシューティング

- **QR ログインのタイムアウト：** セキュリティ上の理由により、ログイントークン（`zbsk`）は 5 分後に期限切れになります。スキャンする前に QR コードが期限切れになった場合は、ログインコマンドを再実行して新しいコードを生成してください。
- **Gateway の読み込みに失敗する：** OpenClaw ホストのバージョンが `2026.4.10` 以降であることを確認してください。それより古いバージョンは、この ID に必要な外部 npm Plugin のインストール台帳をサポートしていません。

## 関連項目

- [チャンネルの概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [Zalo](/ja-JP/channels/zalo) - 同梱されている Zalo Bot Creator / Marketplace チャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングのフロー
- [Plugin](/ja-JP/tools/plugin) - Plugin のインストールと管理
