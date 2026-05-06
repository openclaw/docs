---
read_when:
    - mac アプリを Gateway のライフサイクルと統合する
summary: Gateway の macOS ライフサイクル (launchd)
title: macOS における Gateway ライフサイクル
x-i18n:
    generated_at: "2026-05-06T05:12:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOS アプリはデフォルトで **launchd 経由で Gateway を管理**し、Gateway を子プロセスとして生成しません。まず、設定済みポートで既に実行中の Gateway への接続を試みます。到達可能なものがない場合は、外部の `openclaw` CLI（埋め込みランタイムなし）を介して launchd サービスを有効にします。これにより、ログイン時の信頼性の高い自動起動と、クラッシュ時の再起動が得られます。

子プロセスモード（アプリが Gateway を直接生成する方式）は、現在 **使用されていません**。UI とより密に連携する必要がある場合は、ターミナルで Gateway を手動実行してください。

## デフォルトの動作（launchd）

- アプリは、`ai.openclaw.gateway` というラベルのユーザー単位 LaunchAgent をインストールします
  （`--profile`/`OPENCLAW_PROFILE` を使用する場合は `ai.openclaw.<profile>`。従来の `com.openclaw.*` もサポートされます）。
- ローカルモードが有効な場合、アプリは LaunchAgent が読み込まれていることを確認し、
  必要に応じて Gateway を起動します。
- ログは launchd の Gateway ログパスに書き込まれます（デバッグ設定で確認できます）。

一般的なコマンド:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付きプロファイルを実行する場合は、ラベルを `ai.openclaw.<profile>` に置き換えてください。

## 署名なしの開発ビルド

`scripts/restart-mac.sh --no-sign` は、署名キーがない場合の高速なローカルビルド用です。launchd が署名なしのリレーバイナリを指さないようにするため、これは次を実行します。

- `~/.openclaw/disable-launchagent` を書き込みます。

`scripts/restart-mac.sh` の署名済み実行では、このマーカーが存在する場合、この上書き設定をクリアします。手動でリセットするには:

```bash
rm ~/.openclaw/disable-launchagent
```

## アタッチ専用モード

macOS アプリが **launchd を一切インストールまたは管理しない**ように強制するには、`--attach-only`（または `--no-launchd`）付きで起動します。これにより `~/.openclaw/disable-launchagent` が設定されるため、アプリは既に実行中の Gateway にのみ接続します。同じ動作はデバッグ設定でも切り替えられます。

## リモートモード

リモートモードでは、ローカル Gateway は一切起動されません。アプリはリモートホストへの SSH トンネルを使用し、そのトンネル経由で接続します。

## launchd を推奨する理由

- ログイン時の自動起動。
- 組み込みの再起動/KeepAlive セマンティクス。
- 予測可能なログと監視。

真の子プロセスモードが再び必要になった場合は、独立した明示的な開発専用モードとして文書化するべきです。

## 関連

- [macOS アプリ](/ja-JP/platforms/macos)
- [Gateway ランブック](/ja-JP/gateway)
