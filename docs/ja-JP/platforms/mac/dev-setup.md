---
read_when:
    - macOS 開発環境のセットアップ
summary: OpenClaw macOS アプリに取り組む開発者向けセットアップガイド
title: macOS 開発環境のセットアップ
x-i18n:
    generated_at: "2026-07-16T11:48:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS 開発環境のセットアップ

OpenClaw macOS アプリケーションをソースからビルドして実行します。

## 前提条件

- **Xcode 26.2 以降**（Swift 6.2 ツールチェーン）。Software Update で入手可能な最新の macOS 上で使用してください。
- Gateway、CLI、パッケージングスクリプトには **Node.js 24.15 以降および pnpm** が必要です。Node 22.22.3 以降も使用できます。

## 1. 依存関係をインストールする

```bash
pnpm install
```

## 2. アプリをビルドしてパッケージ化する

```bash
./scripts/package-mac-app.sh
```

出力先は `dist/OpenClaw.app` です。Apple Developer ID 証明書がない場合、スクリプトはアドホック署名にフォールバックします。

開発用の実行モード、署名フラグ、Team ID のトラブルシューティングについては、[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)を参照してください。
リポジトリルートからの高速な開発ループ: `scripts/restart-mac.sh`（アドホック署名には `--no-sign` を追加します。`--no-sign` では TCC 権限が保持されません）。

<Note>
アドホック署名されたアプリでは、セキュリティプロンプトが表示される場合があります。アプリが「Abort trap 6」で即座にクラッシュする場合は、[トラブルシューティング](#troubleshooting)を参照してください。
</Note>

## 3. CLI と Gateway をインストールする

パッケージ化されたアプリには、正規の `scripts/install-cli.sh` インストーラーが組み込まれています。新しいプロファイルでは、オンボーディング中に **This Mac** を選択してください。アプリは Gateway ウィザードを開始する前に、対応するユーザー空間の CLI とランタイムをインストールします。

開発環境を手動で復旧する場合は、対応する CLI を自身でインストールします。

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` と `bun add -g openclaw@<version>` も使用できます。Gateway 自体には引き続き Node が推奨ランタイムです。

## トラブルシューティング

### ビルドに失敗する: ツールチェーンまたは SDK の不一致

macOS アプリのビルドには、最新の macOS SDK と Swift 6.2 ツールチェーン（Xcode 26.2 以降）が必要です。

```bash
xcodebuild -version
xcrun swift --version
```

バージョンが一致しない場合は macOS/Xcode を更新し、ビルドを再実行してください。

### 権限の付与時にアプリがクラッシュする

**Speech Recognition** または **Microphone** へのアクセスを許可しようとしたときにアプリがクラッシュする場合は、TCC キャッシュの破損または署名の不一致が原因である可能性があります。

1. デバッグ用バンドル ID の TCC 権限をリセットします。

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. それでも解決しない場合は、[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)の `BUNDLE_ID` を一時的に変更し、macOS でクリーンな状態を強制します。

### Gateway が「Starting...」のまま進まない

ゾンビプロセスがポートを保持していないか確認します。

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent を使用していない場合（開発モード／手動実行）、リスナーを探します:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

手動実行がポートを保持している場合は停止（Ctrl+C）するか、最後の手段として上記で見つかった PID を強制終了します。

## 関連情報

- [macOS アプリ](/ja-JP/platforms/macos)
- [インストールの概要](/ja-JP/install)
