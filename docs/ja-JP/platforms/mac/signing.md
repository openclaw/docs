---
read_when:
    - mac デバッグビルドのビルドまたは署名
summary: パッケージ化スクリプトで生成された macOS デバッグビルドの署名手順
title: macOS 署名
x-i18n:
    generated_at: "2026-07-11T22:23:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac 署名（デバッグビルド）

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) はアプリをビルドして固定パス（`dist/OpenClaw.app`）にパッケージ化し、続いて [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) を呼び出して署名します。TCC 権限はバンドル ID とコード署名に紐づいています。再ビルド時にその両方を安定させ（かつアプリを固定パスに配置し）続けることで、macOS が TCC の許可（通知、アクセシビリティ、画面収録、マイク、音声認識）を忘れないようにできます。

- デバッグ用バンドル識別子のデフォルトは `ai.openclaw.mac.debug` です（`BUNDLE_ID=...` で上書きできます）。
- Node: `>=22.19.0 <23` または `>=23.11.0`（リポジトリの `package.json` の `engines`）。パッケージャーは Control UI（`pnpm ui:build`）もビルドします。
- デフォルトでは実在する署名 ID が必要です。署名 ID が見つからず、`ALLOW_ADHOC_SIGNING` が設定されていない場合、コード署名スクリプトはエラーで終了します。アドホック署名（`SIGN_IDENTITY="-"`）は明示的なオプトインであり、再ビルド後も TCC 権限を維持することはできません。[macOS の権限](/ja-JP/platforms/mac/permissions)を参照してください。
- 環境から `SIGN_IDENTITY` を読み取ります（例: `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`、または Developer ID Application 証明書）。指定されていない場合、`codesign-mac-app.sh` は次の順序で署名 ID を自動選択します: Developer ID Application、Apple Distribution、Apple Development、その後に最初に見つかった有効なコード署名 ID。
- `CODESIGN_TIMESTAMP=auto`（デフォルト）は、Developer ID Application 署名の場合にのみ信頼されたタイムスタンプを有効にします。どちらかを強制するには `on`/`off` を設定します。
- Info.plist に `OpenClawBuildTimestamp`（ISO8601 UTC）と `OpenClawGitCommit`（短縮ハッシュ、取得できない場合は `unknown`）を書き込み、情報タブにビルド、Git、デバッグ／リリースチャンネルを表示できるようにします。
- 署名後に Team ID の監査を実行し、バンドル内のいずれかの Mach-O が異なる Team ID を持つ場合は失敗します。回避するには `SKIP_TEAM_ID_CHECK=1` を設定します。

## 使用方法

```bash
# リポジトリのルートから
scripts/package-mac-app.sh                                                      # 署名 ID を自動選択。見つからない場合はエラー
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 実在する証明書
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # アドホック（権限は維持されない）
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # 明示的なアドホック（同じ注意事項が適用される）
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # 開発専用の Sparkle Team ID 不一致回避策
```

### アドホック署名に関する注意

`SIGN_IDENTITY="-"` は、アプリが同じ Team ID を共有しない組み込みフレームワーク（Sparkle など）を読み込む際のクラッシュを防ぐため、Hardened Runtime（`--options runtime`）を無効にします。また、アドホック署名では TCC 権限を維持できません。復旧手順については [macOS の権限](/ja-JP/platforms/mac/permissions)を参照してください。

## 情報表示用のビルドメタデータ

情報タブは Info.plist から `OpenClawBuildTimestamp` と `OpenClawGitCommit` を読み取り、バージョン、ビルド日時、Git コミット、およびビルドが DEBUG かどうか（`#if DEBUG` により判定）を表示します。コード変更後はパッケージャーを再実行して、これらの値を更新してください。

## 関連項目

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS の権限](/ja-JP/platforms/mac/permissions)
