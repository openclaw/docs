---
read_when:
    - mac デバッグビルドのビルドまたは署名
summary: パッケージングスクリプトによって生成された macOS デバッグビルドの署名手順
title: macOS 署名
x-i18n:
    generated_at: "2026-06-27T12:04:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac 署名（デバッグビルド）

このアプリは通常 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) からビルドされ、現在は次を行います。

- 安定したデバッグ用バンドル識別子を設定します: `ai.openclaw.mac.debug`
- そのバンドル ID で Info.plist を書き込みます（`BUNDLE_ID=...` で上書き）
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) を呼び出してメインバイナリとアプリバンドルに署名し、macOS が各リビルドを同じ署名済みバンドルとして扱い、TCC 権限（通知、アクセシビリティ、画面収録、マイク、音声認識）を保持できるようにします。安定した権限には実際の署名 ID を使ってください。アドホックは明示的に選択する方式で、壊れやすいです（[macOS 権限](/ja-JP/platforms/mac/permissions)を参照）。
- 既定で `CODESIGN_TIMESTAMP=auto` を使います。Developer ID 署名で信頼されたタイムスタンプを有効にします。タイムスタンプ付与をスキップするには `CODESIGN_TIMESTAMP=off` を設定します（オフラインのデバッグビルド）。
- ビルドメタデータを Info.plist に注入します: `OpenClawBuildTimestamp`（UTC）と `OpenClawGitCommit`（短いハッシュ）。これにより、情報ペインでビルド、git、デバッグ/リリースチャネルを表示できます。
- **パッケージングは既定で Node 24 を使います**: スクリプトは TS ビルドと Control UI ビルドを実行します。互換性のため、Node 22 LTS（現在は `22.19+`）も引き続きサポートされます。
- 環境から `SIGN_IDENTITY` を読み取ります。常に自分の証明書で署名するには、シェル rc に `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（または Developer ID Application 証明書）を追加します。アドホック署名には `ALLOW_ADHOC_SIGNING=1` または `SIGN_IDENTITY="-"` による明示的な選択が必要です（権限テストには推奨しません）。
- 署名後にチーム ID 監査を実行し、アプリバンドル内のいずれかの Mach-O が異なるチーム ID で署名されている場合は失敗します。回避するには `SKIP_TEAM_ID_CHECK=1` を設定します。

## 使用方法

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### アドホック署名の注意

`SIGN_IDENTITY="-"`（アドホック）で署名する場合、スクリプトは自動的に **強化されたランタイム**（`--options runtime`）を無効にします。これは、同じチーム ID を共有していない埋め込みフレームワーク（Sparkle など）をアプリが読み込もうとしたときのクラッシュを防ぐために必要です。アドホック署名は TCC 権限の永続性も壊します。復旧手順は [macOS 権限](/ja-JP/platforms/mac/permissions)を参照してください。

## 情報表示用のビルドメタデータ

`package-mac-app.sh` はバンドルに次を刻印します。

- `OpenClawBuildTimestamp`: パッケージ時点の ISO8601 UTC
- `OpenClawGitCommit`: 短い git ハッシュ（取得できない場合は `unknown`）

情報タブはこれらのキーを読み取り、バージョン、ビルド日、git コミット、そしてデバッグビルドかどうか（`#if DEBUG` 経由）を表示します。コード変更後にこれらの値を更新するには、パッケージャを実行してください。

## 理由

TCC 権限はバンドル識別子 _と_ コード署名に紐づいています。UUID が変わる未署名のデバッグビルドでは、リビルドのたびに macOS が許可を忘れていました。バイナリに署名し（既定ではアドホック）、固定のバンドル ID/パス（`dist/OpenClaw.app`）を維持することで、VibeTunnel のアプローチと同様に、ビルド間で許可を保持できます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
