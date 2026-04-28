---
read_when:
    - mac アプリを gateway ライフサイクルに統合すること
summary: macOS での Gateway ライフサイクル（launchd）
title: Gateway ライフサイクル
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T05:08:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# macOS での Gateway ライフサイクル

macOS アプリは、デフォルトで **launchd 経由で Gateway を管理** し、Gateway を子プロセスとして起動しません。まず、設定されたポートで既に動作中の Gateway へのアタッチを試みます。到達可能なものがなければ、外部の `openclaw` CLI を使って launchd service を有効化します（埋め込みランタイムは使いません）。これにより、ログイン時の確実な自動起動と、クラッシュ時の再起動が得られます。

子プロセスモード（アプリが Gateway を直接起動する）は、現在**使われていません**。
UI とより密接に結合したい場合は、ターミナルで Gateway を手動実行してください。

## デフォルト動作（launchd）

- アプリは、ユーザーごとの LaunchAgent `ai.openclaw.gateway`
  をインストールします（`--profile`/`OPENCLAW_PROFILE` 使用時は `ai.openclaw.<profile>`、旧式の `com.openclaw.*` もサポートされます）。
- Local mode が有効なとき、アプリは LaunchAgent がロードされていることを確認し、
  必要なら Gateway を起動します。
- ログは launchd の gateway ログパスに書き込まれます（Debug Settings で確認できます）。

よく使うコマンド:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付き profile を使っている場合は、ラベルを `ai.openclaw.<profile>` に置き換えてください。

## 署名なし開発ビルド

`scripts/restart-mac.sh --no-sign` は、署名キーがない場合の高速ローカルビルド向けです。launchd が署名なし relay バイナリを指さないようにするため、これにより:

- `~/.openclaw/disable-launchagent` が書き込まれます。

署名付きで `scripts/restart-mac.sh` を実行すると、そのマーカーが
存在する場合はこの上書きが解除されます。手動でリセットするには:

```bash
rm ~/.openclaw/disable-launchagent
```

## アタッチ専用モード

macOS アプリが launchd を**決してインストールも管理もしない**ようにするには、
`--attach-only`（または `--no-launchd`）付きで起動してください。これにより `~/.openclaw/disable-launchagent`
が設定され、アプリは既に動作中の Gateway にのみアタッチします。同じ
動作は Debug Settings でも切り替えられます。

## Remote mode

Remote mode はローカル Gateway を起動しません。アプリはリモートホストへの SSH トンネルを使い、
そのトンネル越しに接続します。

## なぜ launchd を好むのか

- ログイン時の自動起動。
- 組み込みの再起動/KeepAlive セマンティクス。
- 予測可能なログと supervision。

もし真の子プロセスモードが再び必要になったとしても、それは別の、
明示的な開発専用モードとして文書化されるべきです。

## 関連

- [macOS app](/ja-JP/platforms/macos)
- [Gateway runbook](/ja-JP/gateway)
