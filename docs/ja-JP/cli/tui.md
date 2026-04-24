---
read_when:
    - Gateway用のターミナルUIが欲しい（リモート対応）
    - スクリプトからurl/token/sessionを渡したい
    - GatewayなしでTUIをローカル埋め込みモードで実行したい
    - '`openclaw chat` または `openclaw tui --local` を使いたい'
summary: '`openclaw tui` のCLIリファレンス（Gatewayバックエンドまたはローカル埋め込みのターミナルUI）'
title: TUI
x-i18n:
    generated_at: "2026-04-24T04:52:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Gatewayに接続されたターミナルUIを開くか、ローカル埋め込みモードで実行します。

関連:

- TUIガイド: [TUI](/ja-JP/web/tui)

注記:

- `chat` と `terminal` は `openclaw tui --local` のエイリアスです。
- `--local` は `--url`、`--token`、`--password` と併用できません。
- `tui` は、可能な場合、トークン/パスワード認証用に設定済みgateway auth SecretRefを解決します（`env` / `file` / `exec` プロバイダ）。
- 設定済みエージェントワークスペースディレクトリ内から起動された場合、TUIはそのエージェントをセッションキーのデフォルトとして自動選択します（`--session` が明示的に `agent:<id>:...` でない限り）。
- ローカルモードは埋め込みエージェントランタイムを直接使います。ほとんどのローカルツールは動作しますが、Gateway専用機能は利用できません。
- ローカルモードでは、TUIコマンドサーフェス内に `/auth [provider]` が追加されます。
- ローカルモードでもPlugin承認ゲートは引き続き適用されます。承認が必要なツールはターミナルで判断を求めます。Gatewayが関与しないため、自動的に承認されることはありません。

## 例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## 設定修復ループ

現在の設定がすでに検証に通っていて、埋め込みエージェントにそれを調査させ、ドキュメントと比較し、同じターミナルから修復を支援させたい場合は、ローカルモードを使ってください。

`openclaw config validate` がすでに失敗している場合は、まず `openclaw configure` または `openclaw doctor --fix` を使ってください。`openclaw chat` は無効な設定ガードを回避しません。

```bash
openclaw chat
```

その後、TUI内で:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

`openclaw config set` または `openclaw configure` で対象を絞った修正を適用し、その後 `openclaw config validate` を再実行します。[TUI](/ja-JP/web/tui) と [Config](/ja-JP/cli/config) を参照してください。

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [TUI](/ja-JP/web/tui)
