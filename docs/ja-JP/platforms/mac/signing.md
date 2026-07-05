---
read_when:
    - mac デバッグビルドのビルドまたは署名
summary: パッケージ化スクリプトで生成された macOS デバッグビルドの署名手順
title: macOS 署名
x-i18n:
    generated_at: "2026-07-05T11:35:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac署名（デバッグビルド）

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) はアプリを固定パス（`dist/OpenClaw.app`）にビルドしてパッケージ化し、その後 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) を呼び出して署名します。TCC権限はバンドルIDとコード署名に結び付いています。再ビルド間でその両方を安定させる（かつアプリを固定パスに置く）ことで、macOS がTCC許可（通知、アクセシビリティ、画面収録、マイク、音声入力）を忘れにくくなります。

- デバッグ用バンドル識別子のデフォルトは `ai.openclaw.mac.debug` です（`BUNDLE_ID=...` で上書き）。
- Node: `>=22.19.0 <23` または `>=23.11.0`（リポジトリの `package.json` の `engines`）。パッケージャーは Control UI（`pnpm ui:build`）もビルドします。
- デフォルトでは実在する署名IDが必要です。見つからず、`ALLOW_ADHOC_SIGNING` が設定されていない場合、codesignスクリプトはエラーで終了します。アドホック署名（`SIGN_IDENTITY="-"`）は明示的なオプトインであり、再ビルド間でTCC権限を保持しません。[macOS権限](/ja-JP/platforms/mac/permissions) を参照してください。
- 環境から `SIGN_IDENTITY` を読み取ります（例: `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`、または Developer ID Application 証明書）。指定しない場合、`codesign-mac-app.sh` は次の順序でIDを自動選択します: Developer ID Application、Apple Distribution、Apple Development、その後、最初に見つかった有効なコード署名ID。
- `CODESIGN_TIMESTAMP=auto`（デフォルト）は、Developer ID Application 署名の場合のみ信頼されたタイムスタンプを有効にします。どちらかに強制するには `on`/`off` を設定します。
- 「About」タブでビルド、git、デバッグ/リリースチャネルを表示できるよう、Info.plist に `OpenClawBuildTimestamp`（ISO8601 UTC）と `OpenClawGitCommit`（短縮ハッシュ、利用不可の場合は `unknown`）をスタンプします。
- 署名後にTeam ID監査を実行し、バンドル内のいずれかのMach-Oが異なるTeam IDを持つ場合は失敗します。回避するには `SKIP_TEAM_ID_CHECK=1` を設定します。

## 使用方法

```bash
# from repo root
scripts/package-mac-app.sh                                                      # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # dev-only Sparkle Team ID mismatch workaround
```

### アドホック署名の注記

`SIGN_IDENTITY="-"` は、同じTeam IDを共有しない埋め込みフレームワーク（Sparkleなど）をアプリが読み込む際のクラッシュを防ぐため、Hardened Runtime（`--options runtime`）を無効にします。アドホック署名はTCC権限の保持も壊します。復旧手順については [macOS権限](/ja-JP/platforms/mac/permissions) を参照してください。

## Aboutのビルドメタデータ

「About」タブは、バージョン、ビルド日、gitコミット、およびビルドがDEBUGかどうか（`#if DEBUG` 経由）を表示するために、Info.plist から `OpenClawBuildTimestamp` と `OpenClawGitCommit` を読み取ります。コード変更後は、これらの値を更新するためにパッケージャーを再実行してください。

## 関連

- [macOSアプリ](/ja-JP/platforms/macos)
- [macOS権限](/ja-JP/platforms/mac/permissions)
