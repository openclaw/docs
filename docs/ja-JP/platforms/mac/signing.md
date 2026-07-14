---
read_when:
    - mac デバッグビルドの作成または署名
summary: パッケージングスクリプトで生成された macOS デバッグビルドの署名手順
title: macOS 署名
x-i18n:
    generated_at: "2026-07-14T13:52:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac 署名（デバッグビルド）

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) は、アプリを固定パス（`dist/OpenClaw.app`）にビルドしてパッケージ化した後、[`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) を呼び出して署名します。TCC 権限はバンドル ID とコード署名に紐付けられています。再ビルド後も両方を一定に保ち（さらにアプリを固定パスに配置し）続けることで、macOS が TCC の許可（通知、アクセシビリティ、画面収録、マイク、音声認識）を忘れないようにできます。

- デバッグ用バンドル識別子のデフォルトは `ai.openclaw.mac.debug` です（`BUNDLE_ID=...` で上書きできます）。
- Node: `>=22.22.3 <23`、`>=24.15.0 <25`、または `>=25.9.0`（リポジトリの `package.json` `engines`）。パッケージャーは Control UI（`pnpm ui:build`）もビルドします。
- デフォルトでは実在する署名 ID が必要です。署名 ID が見つからず、`ALLOW_ADHOC_SIGNING` が設定されていない場合、codesign スクリプトはエラーで終了します。アドホック署名（`SIGN_IDENTITY="-"`）は明示的なオプトインであり、再ビルド後に TCC 権限を維持できません。[macOS の権限](/ja-JP/platforms/mac/permissions)を参照してください。
- 環境から `SIGN_IDENTITY` を読み取ります（例: `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`、または Developer ID Application 証明書）。指定されていない場合、`codesign-mac-app.sh` は Developer ID Application、Apple Distribution、Apple Development、見つかった最初の有効なコード署名 ID の順に ID を自動選択します。
- `CODESIGN_TIMESTAMP=auto`（デフォルト）は、Developer ID Application 署名の場合にのみ信頼されたタイムスタンプを有効にします。どちらかの動作を強制するには、`on`/`off` を設定します。
- Info.plist に `OpenClawBuildTimestamp`（ISO8601 UTC）と `OpenClawGitCommit`（短縮ハッシュ。取得できない場合は `unknown`）を記録し、About タブにビルド、git、デバッグ／リリースチャンネルを表示できるようにします。
- 署名後に Team ID の監査を実行し、バンドル内のいずれかの Mach-O に異なる Team ID が含まれている場合は失敗します。回避するには `SKIP_TEAM_ID_CHECK=1` を設定します。

## 使用方法

```bash
# リポジトリのルートから
scripts/package-mac-app.sh                                                      # ID を自動選択。見つからない場合はエラー
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 実在する証明書
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # アドホック（権限は維持されません）
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # 明示的なアドホック（同じ注意事項が適用されます）
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # 開発専用の Sparkle Team ID 不一致回避策
```

### アドホック署名に関する注意

`SIGN_IDENTITY="-"` は Hardened Runtime（`--options runtime`）を無効にし、同じ Team ID を共有しない組み込みフレームワーク（Sparkle など）をアプリが読み込む際のクラッシュを防ぎます。アドホック署名では TCC 権限の維持もできなくなります。復旧手順については、[macOS の権限](/ja-JP/platforms/mac/permissions)を参照してください。

## About のビルドメタデータ

About タブは Info.plist から `OpenClawBuildTimestamp` と `OpenClawGitCommit` を読み取り、バージョン、ビルド日時、git コミット、およびビルドが DEBUG かどうか（`#if DEBUG` による）を表示します。コードを変更した後は、これらの値を更新するためにパッケージャーを再実行してください。

## 関連項目

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS の権限](/ja-JP/platforms/mac/permissions)
