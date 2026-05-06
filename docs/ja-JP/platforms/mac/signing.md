---
read_when:
    - mac デバッグビルドのビルドまたは署名
summary: パッケージングスクリプトで生成された macOS デバッグビルドの署名手順
title: macOS 署名
x-i18n:
    generated_at: "2026-05-06T09:07:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac 署名（デバッグビルド）

このアプリは通常 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) からビルドされます。このスクリプトは現在、次を行います。

- 安定したデバッグ用バンドル識別子を設定します: `ai.openclaw.mac.debug`
- そのバンドル ID で Info.plist を書き込みます（`BUNDLE_ID=...` で上書き可能）
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) を呼び出してメインバイナリとアプリバンドルに署名し、macOS が各リビルドを同じ署名済みバンドルとして扱い、TCC 権限（通知、アクセシビリティ、画面収録、マイク、音声認識）を保持できるようにします。安定した権限のためには実際の署名 ID を使用してください。アドホックは明示的な opt-in であり壊れやすいです（[macOS 権限](/ja-JP/platforms/mac/permissions)を参照）。
- デフォルトで `CODESIGN_TIMESTAMP=auto` を使用します。これにより Developer ID 署名で信頼済みタイムスタンプが有効になります。タイムスタンプを省略するには `CODESIGN_TIMESTAMP=off` を設定します（オフラインのデバッグビルド）。
- ビルドメタデータを Info.plist に挿入します: `OpenClawBuildTimestamp`（UTC）と `OpenClawGitCommit`（短いハッシュ）。これにより、情報ペインでビルド、git、デバッグ/リリースチャンネルを表示できます。
- **パッケージングはデフォルトで Node 24 を使用します**: スクリプトは TS ビルドと Control UI ビルドを実行します。Node 22 LTS（現在は `22.14+`）も互換性のため引き続きサポートされます。
- 環境から `SIGN_IDENTITY` を読み取ります。常に証明書で署名するには、シェル rc に `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（または Developer ID Application 証明書）を追加します。アドホック署名には `ALLOW_ADHOC_SIGNING=1` または `SIGN_IDENTITY="-"` による明示的な opt-in が必要です（権限テストには推奨されません）。
- 署名後に Team ID 監査を実行し、アプリバンドル内の Mach-O が別の Team ID で署名されている場合は失敗します。回避するには `SKIP_TEAM_ID_CHECK=1` を設定します。

## 使用方法

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### アドホック署名に関する注意

`SIGN_IDENTITY="-"`（アドホック）で署名する場合、スクリプトは自動的に **Hardened Runtime**（`--options runtime`）を無効にします。これは、同じ Team ID を共有しない埋め込みフレームワーク（Sparkle など）をアプリが読み込もうとしたときのクラッシュを防ぐために必要です。アドホック署名では TCC 権限の永続化も壊れます。復旧手順については [macOS 権限](/ja-JP/platforms/mac/permissions) を参照してください。

## 情報用のビルドメタデータ

`package-mac-app.sh` はバンドルに次を刻印します。

- `OpenClawBuildTimestamp`: パッケージ作成時の ISO8601 UTC
- `OpenClawGitCommit`: 短い git ハッシュ（利用できない場合は `unknown`）

情報タブはこれらのキーを読み取り、バージョン、ビルド日、git コミット、およびデバッグビルドかどうか（`#if DEBUG` 経由）を表示します。コード変更後は、これらの値を更新するためにパッケージャーを実行してください。

## 理由

TCC 権限はバンドル識別子 _と_ コード署名に紐づいています。UUID が変わる未署名のデバッグビルドでは、macOS が各リビルド後に許可を忘れていました。バイナリに署名し（デフォルトではアドホック）、固定されたバンドル ID/パス（`dist/OpenClaw.app`）を維持することで、VibeTunnel のアプローチと同様に、ビルド間で許可を保持できます。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [macOS 権限](/ja-JP/platforms/mac/permissions)
