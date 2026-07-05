---
read_when:
    - MacアプリをGatewayライフサイクルと統合する
summary: macOS での Gateway ライフサイクル（launchd）
title: macOS での Gateway ライフサイクル
x-i18n:
    generated_at: "2026-07-05T11:34:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOSアプリはデフォルトで **launchd** 経由で Gateway を管理し、
Gateway を子プロセスとして起動しません。まず、設定済みポートで
すでに実行中の Gateway への接続を試みます。到達可能なものがない場合は、
外部の `openclaw` CLI を介して launchd サービスを有効にします（埋め込み
ランタイムなし）。これにより、ログイン時の信頼性の高い自動起動と
クラッシュ時の再起動が可能になります。

子プロセスモード（アプリが Gateway を直接起動する方式）は、現在は
**使用されていません**。UI とのより密な結合が必要な場合は、ターミナルで
Gateway を手動実行してください。

## デフォルトの動作（launchd）

- アプリは、`ai.openclaw.gateway`（または `--profile`/`OPENCLAW_PROFILE` 使用時は
  `ai.openclaw.<profile>`）というラベルのユーザー単位の LaunchAgent をインストールします。
- ローカルモードが有効な場合、アプリは LaunchAgent が読み込まれていることを確認し、
  必要に応じて Gateway を起動します。
- ログは launchd gateway ログパスに書き込まれます（Debug Settings で確認できます）。

一般的なコマンド:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付きプロファイルを実行している場合は、ラベルを `ai.openclaw.<profile>` に置き換えてください。

## 署名なしの開発ビルド

`scripts/restart-mac.sh --no-sign` は、署名キーなしで高速にローカルビルドするためのものです。
launchd が署名なしのリレーバイナリを指さないようにするため、
`~/.openclaw/disable-launchagent` を書き込みます。

`scripts/restart-mac.sh` の署名済み実行は、このマーカーが存在する場合、
この上書きを解除します。手動でリセットするには:

```bash
rm ~/.openclaw/disable-launchagent
```

## アタッチ専用モード

macOSアプリが launchd をインストールまたは管理しないよう強制するには、
`--attach-only`（または `--no-launchd`）付きで起動します。これにより
`~/.openclaw/disable-launchagent` が設定されるため、アプリはすでに
実行中の Gateway にのみアタッチします。同じ動作は Debug Settings で切り替えられます。

## リモートモード

リモートモードでは、ローカル Gateway は起動されません。アプリはリモートホストへの SSH トンネルを使用し、
そのトンネル経由で接続します。

## launchd を推奨する理由

- ログイン時の自動起動。
- 組み込みの再起動/KeepAlive セマンティクス。
- 予測可能なログと監視。

真の子プロセスモードが再び必要になった場合は、
独立した明示的な開発専用モードとして文書化する必要があります。

## 関連

- [macOSアプリ](/ja-JP/platforms/macos)
- [Gateway ランブック](/ja-JP/gateway)
