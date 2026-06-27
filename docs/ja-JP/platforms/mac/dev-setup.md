---
read_when:
    - macOS 開発環境のセットアップ
summary: OpenClaw macOS アプリに取り組む開発者向けセットアップガイド
title: macOS 開発環境のセットアップ
x-i18n:
    generated_at: "2026-06-27T12:03:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開発者セットアップ

OpenClaw macOS アプリケーションをソースからビルドして実行します。

## 前提条件

アプリをビルドする前に、以下がインストールされていることを確認してください。

1. **Xcode 26.2+**: Swift 開発に必要です。
2. **Node.js 24 & pnpm**: Gateway、CLI、パッケージ化スクリプトに推奨されます。Node 22 LTS（現在は `22.19+`）も互換性のため引き続きサポートされています。

## 1. 依存関係をインストール

プロジェクト全体の依存関係をインストールします。

```bash
pnpm install
```

## 2. アプリをビルドしてパッケージ化

macOS アプリをビルドし、`dist/OpenClaw.app` にパッケージ化するには、次を実行します。

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID 証明書がない場合、スクリプトは自動的に **アドホック署名**（`-`）を使用します。

開発実行モード、署名フラグ、Team ID のトラブルシューティングについては、macOS アプリの README を参照してください。
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注**: アドホック署名されたアプリでは、セキュリティプロンプトが表示される場合があります。アプリがすぐに "Abort trap 6" でクラッシュする場合は、[トラブルシューティング](#troubleshooting) セクションを参照してください。

## 3. CLI をインストール

macOS アプリは、バックグラウンドタスクを管理するためにグローバルな `openclaw` CLI インストールを想定しています。

**インストールするには（推奨）:**

1. OpenClaw アプリを開きます。
2. **General** 設定タブに移動します。
3. **"Install CLI"** をクリックします。

または、手動でインストールします。

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` と `bun add -g openclaw@<version>` も機能します。
Gateway ランタイムでは、Node が引き続き推奨パスです。

## トラブルシューティング

### ビルド失敗: ツールチェーンまたは SDK の不一致

macOS アプリのビルドでは、最新の macOS SDK と Swift 6.2 ツールチェーンが想定されています。

**システム依存関係（必須）:**

- **ソフトウェアアップデートで利用可能な最新の macOS バージョン**（Xcode 26.2 SDK で必須）
- **Xcode 26.2**（Swift 6.2 ツールチェーン）

**確認:**

```bash
xcodebuild -version
xcrun swift --version
```

バージョンが一致しない場合は、macOS/Xcode を更新してビルドを再実行してください。

### 権限付与時にアプリがクラッシュする

**Speech Recognition** または **Microphone** アクセスを許可しようとしたときにアプリがクラッシュする場合、TCC キャッシュの破損または署名の不一致が原因である可能性があります。

**修正:**

1. TCC 権限をリセットします。

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. それでも失敗する場合は、[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) の `BUNDLE_ID` を一時的に変更し、macOS から「クリーンスレート」として扱わせます。

### Gateway が "Starting..." のままになる

Gateway のステータスが "Starting..." のままの場合は、ゾンビプロセスがポートを保持していないか確認してください。

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent を使用していない場合（開発モード / 手動実行）、リスナーを探します:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

手動実行がポートを保持している場合は、そのプロセスを停止します（Ctrl+C）。最後の手段として、上で見つけた PID を kill します。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [インストール概要](/ja-JP/install)
