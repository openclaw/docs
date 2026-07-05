---
read_when:
    - macOS 開発環境のセットアップ
summary: OpenClaw macOS アプリに取り組む開発者向けのセットアップガイド
title: macOS 開発環境設定
x-i18n:
    generated_at: "2026-07-05T11:29:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd7d556af92892d3deea3f5d8238a33cd413e10b0b377468396221e174ace8fe
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開発者セットアップ

ソースから OpenClaw macOS アプリケーションをビルドして実行します。

## 前提条件

- **Xcode 26.2+**（Swift 6.2 ツールチェーン）。Software Update で入手できる最新の macOS 上で使用してください。
- Gateway、CLI、パッケージングスクリプト用の **Node.js 24 & pnpm**。Node 22.19+ でも動作します。

## 1. 依存関係をインストールする

```bash
pnpm install
```

## 2. アプリをビルドしてパッケージ化する

```bash
./scripts/package-mac-app.sh
```

`dist/OpenClaw.app` を出力します。Apple Developer ID 証明書がない場合、スクリプトはアドホック署名にフォールバックします。

開発用の実行モード、署名フラグ、Team ID のトラブルシューティングについては、[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md) を参照してください。
リポジトリルートからの高速な開発ループ: `scripts/restart-mac.sh`（アドホック署名には `--no-sign` を追加します。TCC 権限は `--no-sign` では保持されません）。

<Note>
アドホック署名されたアプリは、セキュリティプロンプトを表示する場合があります。アプリが「Abort trap 6」で即座にクラッシュする場合は、[トラブルシューティング](#troubleshooting)を参照してください。
</Note>

## 3. CLI と Gateway をインストールする

パッケージ化されたアプリには、正規の `scripts/install-cli.sh` インストーラーが組み込まれています。新しいプロファイルでは、オンボーディング中に **この Mac** を選択します。アプリは Gateway ウィザードを開始する前に、対応するユーザー空間の CLI とランタイムをインストールします。

手動の開発リカバリでは、対応する CLI を自分でインストールします。

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` と `bun add -g openclaw@<version>` も動作します。Gateway 自体の推奨ランタイムは引き続き Node です。

## トラブルシューティング

### ビルドに失敗する: ツールチェーンまたは SDK の不一致

macOS アプリのビルドには、最新の macOS SDK と Swift 6.2 ツールチェーン（Xcode 26.2+）が必要です。

```bash
xcodebuild -version
xcrun swift --version
```

バージョンが一致しない場合は、macOS/Xcode を更新してビルドを再実行してください。

### 権限付与時にアプリがクラッシュする

**Speech Recognition** または **Microphone** へのアクセスを許可しようとしたときにアプリがクラッシュする場合、TCC キャッシュの破損または署名の不一致が原因の可能性があります。

1. デバッグバンドル ID の TCC 権限をリセットします。

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. それでも失敗する場合は、[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) の `BUNDLE_ID` を一時的に変更して、macOS からクリーンな状態を強制します。

### Gateway がいつまでも「Starting...」のままになる

ゾンビプロセスがポートを保持していないか確認します。

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

手動実行がポートを保持している場合は、それを停止（Ctrl+C）するか、最後の手段として上で見つかった PID を kill します。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [インストール概要](/ja-JP/install)
