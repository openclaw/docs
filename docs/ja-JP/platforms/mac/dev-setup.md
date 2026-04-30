---
read_when:
    - macOS 開発環境のセットアップ
summary: OpenClaw macOS アプリの開発に取り組む開発者向けセットアップガイド
title: macOS 開発環境のセットアップ
x-i18n:
    generated_at: "2026-04-30T05:23:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0c494b7a214b6db2880ba02c512653c35dbcdf80805bee9777ec946412668e1
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開発者セットアップ

OpenClaw macOS アプリケーションをソースからビルドして実行します。

## 前提条件

アプリをビルドする前に、以下がインストールされていることを確認してください。

1. **Xcode 26.2+**: Swift 開発に必要です。
2. **Node.js 24 & pnpm**: Gateway、CLI、パッケージングスクリプトに推奨されます。互換性のため、現在 `22.14+` の Node 22 LTS も引き続きサポートされています。

## 1. 依存関係をインストールする

プロジェクト全体の依存関係をインストールします。

```bash
pnpm install
```

## 2. アプリをビルドしてパッケージ化する

macOS アプリをビルドし、`dist/OpenClaw.app` にパッケージ化するには、次を実行します。

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID 証明書がない場合、スクリプトは自動的に **ad-hoc 署名** (`-`) を使用します。

開発実行モード、署名フラグ、Team ID のトラブルシューティングについては、macOS アプリの README を参照してください。
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注記**: ad-hoc 署名されたアプリでは、セキュリティプロンプトが表示される場合があります。アプリが "Abort trap 6" ですぐにクラッシュする場合は、[トラブルシューティング](#troubleshooting) セクションを参照してください。

## 3. CLI をインストールする

macOS アプリは、バックグラウンドタスクを管理するためにグローバルな `openclaw` CLI インストールを想定しています。

**インストールするには（推奨）:**

1. OpenClaw アプリを開きます。
2. **General** 設定タブに移動します。
3. **"Install CLI"** をクリックします。

または、手動でインストールします。

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` と `bun add -g openclaw@<version>` も使用できます。
Gateway ランタイムには、引き続き Node が推奨されます。

## トラブルシューティング

### ビルド失敗: ツールチェーンまたは SDK の不一致

macOS アプリのビルドには、最新の macOS SDK と Swift 6.2 ツールチェーンが必要です。

**システム依存関係（必須）:**

- **ソフトウェアアップデートで入手可能な最新の macOS バージョン**（Xcode 26.2 SDK に必要）
- **Xcode 26.2**（Swift 6.2 ツールチェーン）

**確認:**

```bash
xcodebuild -version
xcrun swift --version
```

バージョンが一致しない場合は、macOS/Xcode をアップデートしてからビルドを再実行してください。

### 権限付与時にアプリがクラッシュする

**Speech Recognition** または **Microphone** へのアクセスを許可しようとしたときにアプリがクラッシュする場合、TCC キャッシュの破損または署名の不一致が原因である可能性があります。

**修正:**

1. TCC 権限をリセットします。

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. それでも失敗する場合は、macOS から「クリーンスレート」を強制するために、[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) の `BUNDLE_ID` を一時的に変更します。

### Gateway が "Starting..." のまま終わらない

Gateway のステータスが "Starting..." のままの場合は、ゾンビプロセスがポートを保持していないか確認してください。

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent を使用していない場合（開発モード / 手動実行）、リスナーを探します:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

手動実行がポートを保持している場合は、そのプロセスを停止します（Ctrl+C）。最後の手段として、上で見つけた PID を kill してください。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [インストール概要](/ja-JP/install)
