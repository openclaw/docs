---
read_when:
    - QRコードログインに対応した個人用Zaloアシスタントボットが必要です
    - openclaw-zaloclawbot チャンネル Plugin をインストールまたはトラブルシューティングしています
summary: 外部 openclaw-zaloclawbot Plugin を通じた Zalo ClawBot チャネル設定
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T10:45:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw は、カタログ掲載の外部 `@zalo-platforms/openclaw-zaloclawbot` Plugin を通じて Zalo ClawBot に接続します。ログインには Zalo Mini App の QR コードを使用します。

## 互換性

| Plugin バージョン | OpenClaw バージョン | npm dist-tag | 状態          |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.x          | >=2026.4.10      | `latest`     | アクティブ / ベータ |

## 前提条件

- Node.js **>= 22**
- [OpenClaw](https://docs.openclaw.ai/install) がインストール済みであること（`openclaw` CLI が利用可能）。
- ログイン用 QR コードをスキャンするための、モバイルデバイス上の Zalo アカウント。

## onboard でインストール（推奨）

OpenClaw のオンボーディングウィザードを実行し、チャンネルメニューから **Zalo ClawBot** を選択します。

```bash
openclaw onboard
```

ウィザードは公式カタログから Plugin をインストールし（完全性検証済み）、ターミナル内にログイン QR を表示し、Zalo アプリでスキャンするとチャンネルの設定を完了します。追加のコマンドは不要です。

## 手動インストール

すでにオンボーディング済みの Gateway にチャンネルを追加するには、次の手順に従います。

### 1. Plugin をインストールする

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

上記の正確に固定されたバージョンを使用してください（公式カタログのエントリと一致します）。これにより、OpenClaw はインストール時にカタログの完全性ハッシュに照らしてパッケージを検証します。

### 2. 設定で Plugin を有効化する

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. QR コードを生成してログインする

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Zalo モバイルアプリでターミナルに表示された QR コードをスキャンし、Zalo Mini App 内で利用規約に同意して、セッションを認可します。

### 4. Gateway を再起動する

```bash
openclaw gateway restart
```

---

## 仕組み

独自の Zalo Official Account（OA）を登録して静的な開発者認証情報を貼り付ける必要がある標準の開発者向け Zalo チャンネルとは異なり、Zalo ClawBot は共有の公式インフラストラクチャを使用する **所有者に紐づくパーソナルアシスタント** として動作します。

1. **セキュアなオンボーディング:** QR コードは、新しくプロビジョニングされたプライベートボットを、共有公式 OA の下であなたの Zalo User ID に直接紐づける、安全な Zalo Mini App に解決されます。
2. **所有者に紐づくプライバシー:** 設計上、ボットは所有者との通信 _のみ_ に制限されています。他のユーザーからのメッセージはプラットフォームレベルで破棄されるため、接続はプライベートかつ安全です。
3. **公式 API パス:** Plugin はブラウザや Web セッションの自動化ではなく、Zalo Bot Platform API を使用します。

## 内部の仕組み

Zalo ClawBot Plugin は、永続的なロングポーリングメッセージループを介して Zalo API と通信します。クリーンで軽量なランタイムを維持するために、次のようになっています。

- ロングポーリング接続は `getUpdates` エンドポイントを利用します。
- ローカルのデスクトップ/ターミナル Gateway 実行では、Webhook はデフォルトで無効です。
- メッセージはクライアント側で処理され、ローカルのエージェントランタイムに直接マッピングされます。

外部 Plugin は OpenClaw の状態ディレクトリ配下でボット認証情報を管理します。そのディレクトリは機密情報として扱い、OpenClaw の他の状態と同じアクセス制御およびバックアップポリシーに含めてください。

---

## トラブルシューティング

- **QR ログインのタイムアウト:** ログイントークン（`zbsk`）はセキュリティ上の理由により 5 分後に期限切れになります。スキャンする前に QR コードの有効期限が切れた場合は、ログインコマンドを再実行して新しいものを生成してください。
- **Gateway の読み込み失敗:** OpenClaw ホストのバージョンが `2026.4.10` 以上であることを確認してください。古いバージョンは、外部 npm Plugin インストール台帳をサポートしていません。
