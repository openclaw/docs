---
read_when:
    - macOS 開発環境のセットアップ
summary: OpenClaw macOS アプリに取り組む開発者向けのセットアップガイド
title: macOS 開発セットアップ
x-i18n:
    generated_at: "2026-07-04T06:22:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開発者セットアップ

ソースから OpenClaw macOS アプリケーションをビルドして実行します。

## 前提条件

アプリをビルドする前に、次のものがインストールされていることを確認してください。

1. **Xcode 26.2+**: Swift 開発に必要です。
2. **Node.js 24 & pnpm**: Gateway、CLI、パッケージングスクリプトに推奨されます。Node 22 LTS（現在は `22.19+`）も互換性のため引き続きサポートされます。

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

Apple Developer ID 証明書がない場合、スクリプトは自動的に **ad-hoc signing**（`-`）を使用します。

開発実行モード、署名フラグ、Team ID のトラブルシューティングについては、macOS アプリの README を参照してください。
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注記**: ad-hoc 署名されたアプリでは、セキュリティプロンプトが表示されることがあります。アプリがすぐに "Abort trap 6" でクラッシュする場合は、[トラブルシューティング](#troubleshooting) セクションを参照してください。

## 3. CLI と Gateway をインストールする

パッケージ化されたアプリには、正規の `scripts/install-cli.sh` インストーラーが組み込まれています。新しいプロファイルでは、オンボーディング中に **This Mac** を選択してください。アプリは、Gateway ウィザードを開始する前に、対応するユーザー空間の CLI とランタイムをインストールします。

手動の開発リカバリーでは、対応する CLI を自分でインストールします。

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` と `bun add -g openclaw@<version>` も機能します。
Gateway ランタイムについては、Node が引き続き推奨される方法です。

## トラブルシューティング

### ビルド失敗: ツールチェーンまたは SDK の不一致

macOS アプリのビルドでは、最新の macOS SDK と Swift 6.2 ツールチェーンが想定されています。

**システム依存関係（必須）:**

- **Software Update で利用可能な最新の macOS バージョン**（Xcode 26.2 SDK に必要）
- **Xcode 26.2**（Swift 6.2 ツールチェーン）

**確認:**

```bash
xcodebuild -version
xcrun swift --version
```

バージョンが一致しない場合は、macOS/Xcode を更新してビルドを再実行してください。

### 権限付与時にアプリがクラッシュする

**Speech Recognition** または **Microphone** へのアクセスを許可しようとしたときにアプリがクラッシュする場合、TCC キャッシュの破損または署名の不一致が原因の可能性があります。

**修正:**

1. TCC 権限をリセットします。

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. それでも失敗する場合は、macOS から「クリーンスレート」を強制するために、[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) の `BUNDLE_ID` を一時的に変更します。

### Gateway が "Starting..." のままになる

Gateway のステータスが "Starting..." のままの場合は、ゾンビプロセスがポートを保持していないか確認してください。

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

手動実行がポートを保持している場合は、そのプロセスを停止します（Ctrl+C）。最後の手段として、上で見つけた PID を kill します。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [インストール概要](/ja-JP/install)
