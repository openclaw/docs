---
read_when:
    - Gateway 用の terminal UI が必要です（リモートフレンドリー）
    - スクリプトから url/token/session を渡したいです
    - Gateway なしで TUI をローカル組み込みモードで実行したいです
    - '`openclaw chat` または `openclaw tui --local` を使いたいです'
summary: '`openclaw tui` の CLI リファレンス（Gateway 対応またはローカル組み込みの terminal UI）'
title: TUI
x-i18n:
    generated_at: "2026-04-23T14:02:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Gateway に接続された terminal UI を開くか、ローカル組み込み
モードで実行します。

関連:

- TUI ガイド: [TUI](/ja-JP/web/tui)

注記:

- `chat` と `terminal` は `openclaw tui --local` のエイリアスです。
- `--local` は `--url`、`--token`、`--password` と組み合わせて使用できません。
- `tui` は、可能な場合、token/password 認証のために設定済みの gateway auth SecretRefs を解決します（`env`/`file`/`exec` providers）。
- 設定済みの agent workspace directory 内から起動した場合、TUI はその agent を session key のデフォルトとして自動選択します（`--session` が明示的に `agent:<id>:...` の場合を除く）。
- ローカルモードでは組み込み agent runtime を直接使用します。ほとんどのローカル tools は動作しますが、Gateway 専用機能は利用できません。
- ローカルモードでは、TUI の command surface に `/auth [provider]` が追加されます。
- plugin approval gates はローカルモードでも適用されます。approval が必要な tools は terminal 上で判断を求めます。Gateway が関与しないからといって、何も黙って自動承認されることはありません。

## 例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# agent workspace 内で実行した場合、その agent を自動推定
openclaw tui --session bugfix
```

## Config 修復ループ

現在の config がすでに妥当で、組み込み agent にその内容を調べさせ、docs と比較し、同じ terminal から修復を手伝わせたい場合は、ローカルモードを使用してください。

すでに `openclaw config validate` が失敗している場合は、先に `openclaw configure` または `openclaw doctor --fix` を使用してください。`openclaw chat` は無効な config ガードを回避しません。

```bash
openclaw chat
```

その後、TUI 内で:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

`openclaw config set` または `openclaw configure` で対象を絞った修正を適用し、その後 `openclaw config validate` を再実行してください。[TUI](/ja-JP/web/tui) と [Config](/ja-JP/cli/config) を参照してください。
