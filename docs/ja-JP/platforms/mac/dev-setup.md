---
read_when:
    - macOS開発環境をセットアップする場合
summary: OpenClaw macOSアプリを開発する開発者向けセットアップガイド
title: macOS開発セットアップ
x-i18n:
    generated_at: "2026-04-24T05:08:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# macOS開発者セットアップ

このガイドでは、ソースからOpenClaw macOSアプリケーションをビルドして実行するために必要な手順を扱います。

## 前提条件

アプリをビルドする前に、次がインストールされていることを確認してください。

1. **Xcode 26.2+**: Swift開発に必要です。
2. **Node.js 24 & pnpm**: gateway、CLI、およびパッケージングスクリプト向けに推奨されます。互換性のため、Node 22 LTS（現在は`22.14+`）も引き続きサポートされています。

## 1. 依存関係をインストールする

プロジェクト全体の依存関係をインストールします。

```bash
pnpm install
```

## 2. アプリをビルドしてパッケージ化する

macOSアプリをビルドし、それを`dist/OpenClaw.app`へパッケージ化するには、次を実行します。

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID証明書がない場合、このスクリプトは自動的に**ad-hoc signing**（`-`）を使用します。

開発実行モード、署名フラグ、およびTeam IDのトラブルシューティングについては、macOSアプリREADMEを参照してください:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **注意**: ad-hoc署名されたアプリはセキュリティプロンプトを引き起こす場合があります。アプリが「Abort trap 6」で即座にクラッシュする場合は、[トラブルシューティング](#トラブルシューティング)セクションを参照してください。

## 3. CLIをインストールする

macOSアプリは、バックグラウンドタスク管理のためにグローバルな`openclaw` CLIインストールを前提としています。

**インストールするには（推奨）:**

1. OpenClawアプリを開きます。
2. **General**設定タブへ移動します。
3. **"Install CLI"**をクリックします。

または、手動でインストールします。

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>`および`bun add -g openclaw@<version>`も動作します。
Gatewayランタイムでは、引き続きNodeパスが推奨です。

## トラブルシューティング

### ビルド失敗: ツールチェーンまたはSDK不一致

macOSアプリのビルドは、最新のmacOS SDKとSwift 6.2ツールチェーンを前提としています。

**システム依存関係（必須）:**

- **Software Updateで利用可能な最新のmacOSバージョン**（Xcode 26.2 SDKに必要）
- **Xcode 26.2**（Swift 6.2ツールチェーン）

**確認:**

```bash
xcodebuild -version
xcrun swift --version
```

バージョンが一致しない場合は、macOS/Xcodeを更新してからビルドを再実行してください。

### 権限付与時にアプリがクラッシュする

**Speech Recognition**または**Microphone**アクセスを許可しようとしたときにアプリがクラッシュする場合、TCCキャッシュ破損または署名不一致が原因の可能性があります。

**修正:**

1. TCC権限をリセットします。

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. それでも失敗する場合は、[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)内の`BUNDLE_ID`を一時的に変更し、macOS側で「クリーンスレート」を強制してください。

### Gatewayが「Starting...」のままになる

gatewayステータスが「Starting...」のままの場合、zombie processがポートを保持していないか確認してください。

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgentを使っていない場合（開発モード / 手動実行）、listenerを探します:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

手動実行がポートを保持している場合は、そのプロセスを停止してください（Ctrl+C）。最後の手段として、上で見つけたPIDをkillしてください。

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [Install overview](/ja-JP/install)
