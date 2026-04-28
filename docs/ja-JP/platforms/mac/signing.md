---
read_when:
    - macOS デバッグビルドをビルドまたは署名しています
summary: パッケージングスクリプトで生成された macOS デバッグビルドの署名手順
title: macOS 署名
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T05:08:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# mac 署名（デバッグビルド）

このアプリは通常 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) からビルドされます。このスクリプトは現在、次のことを行います。

- 安定したデバッグ bundle identifier を設定する: `ai.openclaw.mac.debug`
- その bundle id で Info.plist を書き込む（`BUNDLE_ID=...` で上書き可能）
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) を呼び出してメインバイナリと app bundle に署名する。これにより macOS は各 rebuild を同じ署名済み bundle として扱い、TCC 権限（通知、アクセシビリティ、画面収録、マイク、音声）を維持します。安定した権限のためには実際の signing identity を使用してください。ad-hoc はオプトインで不安定です（[macOS permissions](/ja-JP/platforms/mac/permissions) を参照）。
- デフォルトで `CODESIGN_TIMESTAMP=auto` を使用する。これにより Developer ID 署名に trusted timestamp が有効になります。timestamp をスキップするには `CODESIGN_TIMESTAMP=off` を設定してください（オフラインのデバッグビルド）。
- ビルドメタデータを Info.plist に注入する: `OpenClawBuildTimestamp`（UTC）と `OpenClawGitCommit`（短いハッシュ）。これにより About ペインに build、git、debug/release channel を表示できます。
- **パッケージングはデフォルトで Node 24**: スクリプトは TS ビルドと Control UI ビルドを実行します。Node 22 LTS（現在 `22.14+`）も互換性のため引き続きサポートされます。
- 環境から `SIGN_IDENTITY` を読み取る。常に自分の証明書で署名するには、`export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（または Developer ID Application 証明書）を shell rc に追加してください。ad-hoc 署名には `ALLOW_ADHOC_SIGNING=1` または `SIGN_IDENTITY="-"` による明示的なオプトインが必要です（権限テストには非推奨）。
- 署名後に Team ID 監査を実行し、app bundle 内のいずれかの Mach-O が別の Team ID で署名されていた場合は失敗する。回避するには `SKIP_TEAM_ID_CHECK=1` を設定します。

## 使い方

```bash
# repo root から
scripts/package-mac-app.sh               # identity を自動選択。見つからなければエラー
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 実際の証明書
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc（権限は維持されません）
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # 明示的な ad-hoc（同じ注意あり）
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # 開発専用の Sparkle Team ID 不一致回避策
```

### Ad-hoc Signing に関する注記

`SIGN_IDENTITY="-"`（ad-hoc）で署名する場合、スクリプトは自動的に **Hardened Runtime**（`--options runtime`）を無効にします。これは、アプリが同じ Team ID を共有しない埋め込み framework（Sparkle など）をロードしようとしたときのクラッシュを防ぐために必要です。ad-hoc 署名は TCC 権限の永続化も壊します。復旧手順については [macOS permissions](/ja-JP/platforms/mac/permissions) を参照してください。

## About 用ビルドメタデータ

`package-mac-app.sh` は bundle に次を stamp します。

- `OpenClawBuildTimestamp`: package 時点の ISO8601 UTC
- `OpenClawGitCommit`: 短い git hash（取得できない場合は `unknown`）

About タブはこれらのキーを読み取り、バージョン、ビルド日時、git commit、およびデバッグビルドかどうか（`#if DEBUG` による）を表示します。コード変更後にこれらの値を更新するには、packager を実行してください。

## 理由

TCC 権限は bundle identifier とコード署名の _両方_ に結び付いています。UUID が変わる未署名デバッグビルドにより、macOS は各 rebuild 後に許可を忘れていました。バイナリに署名し（デフォルトは ad-hoc）、
固定の bundle id/path（`dist/OpenClaw.app`）を維持することで、ビルド間で許可が保持され、VibeTunnel の方式と一致します。

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [macOS permissions](/ja-JP/platforms/mac/permissions)
