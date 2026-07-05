---
read_when:
    - QR コードログインを使う個人用 Zalo アシスタントボットが欲しい
    - openclaw-zaloclawbot チャンネル Plugin をインストールまたはトラブルシューティングしています
summary: 外部 openclaw-zaloclawbot Plugin による Zalo ClawBot チャンネルセットアップ
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-05T11:05:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw は、カタログに掲載されている外部 `@zalo-platforms/openclaw-zaloclawbot` Plugin を通じて Zalo ClawBot に接続します。ログインには Zalo Mini App の QRコードを使用します。config 内の Plugin id は `openclaw-zaloclawbot` です。

## 互換性

| Plugin バージョン | OpenClaw バージョン | npm dist-tag | ステータス        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.4          | >=2026.4.10      | `latest`     | アクティブ / ベータ |

## 前提条件

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) がインストール済み（`openclaw` CLI が利用可能）
- ログイン QRコードをスキャンするための、モバイルデバイス上の Zalo アカウント

## onboard でインストール（推奨）

```bash
openclaw onboard
```

チャンネルメニューから **Zalo ClawBot** を選択します。ウィザードは公式カタログから Plugin をインストールし（整合性検証済み）、ターミナルにログイン QR を表示し、Zalo アプリでスキャンするとチャンネルの設定を完了します。

## 手動インストール

すでにオンボーディング済みの Gateway にチャンネルを追加するには、次の手順を実行します。

### 1. Plugin をインストールする

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

インストール時に OpenClaw がカタログの整合性ハッシュに照らしてパッケージを検証できるよう、正確に固定されたバージョンを使用してください。

### 2. config で Plugin を有効にする

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. QRコードを生成してログインする

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

ターミナルに表示された QRコードを Zalo モバイルアプリでスキャンし、Zalo Mini App 内の利用規約に同意して、セッションを認可します。

### 4. Gateway を再起動する

```bash
openclaw gateway restart
```

## 仕組み

標準の Zalo チャンネルでは、自分の Zalo Official Account（OA）を登録し、静的な開発者認証情報を設定する必要があります。一方、Zalo ClawBot は共有公式インフラ上の **所有者に紐づくパーソナルアシスタント** です。

1. **オンボーディング:** QRコードは Zalo Mini App に解決され、新しくプロビジョニングされたプライベートボットを、共有公式 OA の下であなたの Zalo ユーザー ID に直接紐づけます。
2. **所有者に紐づくプライバシー:** ボットは所有者とのみ通信します。他のユーザーからのメッセージはプラットフォームレベルで破棄されます。
3. **公式 API パス:** Plugin はブラウザや Web セッションの自動化ではなく、Zalo Bot Platform API を使用します。

## 内部動作

Plugin は永続的なロングポーリングループ（`getUpdates`）を介して Zalo と通信します。Webhook は、ローカルのデスクトップ/ターミナル Gateway 実行ではデフォルトで無効です。メッセージはクライアント側で処理され、ローカルのエージェントランタイムにマッピングされます。

Plugin は OpenClaw state ディレクトリ配下でボット認証情報を管理します。そのディレクトリは機密として扱い、OpenClaw state の他の部分と同じアクセス制御およびバックアップポリシーの対象にしてください。

この Plugin のランタイムは完全に外部 `@zalo-platforms/openclaw-zaloclawbot` パッケージ内にあります。以下のインストール/config 以外の動作詳細は Plugin のメンテナーによる報告に基づくものであり、OpenClaw core source に照らして検証されたものではありません。

## トラブルシューティング

- **QR ログインのタイムアウト:** ログイントークン（`zbsk`）はセキュリティのため 5 分後に期限切れになります。スキャンする前に QRコードの期限が切れた場合は、ログインコマンドを再実行して新しいものを生成してください。
- **Gateway の読み込みに失敗する:** OpenClaw ホストバージョンが `2026.4.10` 以上であることを確認してください。古いバージョンは、この ID が必要とする外部 npm-plugin インストール台帳をサポートしていません。

## 関連

- [チャンネル概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [Zalo](/ja-JP/channels/zalo) - 同梱の Zalo Bot Creator / Marketplace チャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [Plugins](/ja-JP/tools/plugin) - Plugin のインストールと管理
