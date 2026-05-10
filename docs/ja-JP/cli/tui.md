---
read_when:
    - Gateway 用のターミナル UI が必要な場合（リモート向き）
    - スクリプトから url/token/session を渡したい場合
    - Gateway なしでローカル埋め込みモードの TUI を実行したい
    - openclaw chat または openclaw tui --local を使用したい場合
summary: '`openclaw tui` の CLI リファレンス（Gateway バックまたはローカル組み込みターミナル UI）'
title: TUI
x-i18n:
    generated_at: "2026-05-10T19:30:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Gateway に接続されたターミナル UI を開くか、ローカル埋め込みモードで実行します。

関連:

- TUI ガイド: [TUI](/ja-JP/web/tui)

## オプション

| フラグ                | 既定値                                    | 説明                                                                               |
| --------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`             | `false`                                   | Gateway ではなくローカルの埋め込みエージェントランタイムに対して実行します。      |
| `--url <url>`         | config の `gateway.remote.url`            | Gateway WebSocket URL。                                                            |
| `--token <token>`     | （なし）                                  | 必要な場合の Gateway トークン。                                                    |
| `--password <pass>`   | （なし）                                  | 必要な場合の Gateway パスワード。                                                  |
| `--session <key>`     | `main`（スコープが global の場合は `global`） | セッションキー。エージェントワークスペース内では、接頭辞がない限りそのエージェントが自動選択されます。 |
| `--deliver`           | `false`                                   | 設定済みチャンネル経由でアシスタントの返信を配信します。                          |
| `--thinking <level>`  | （モデルの既定値）                        | Thinking レベルの上書き。                                                          |
| `--message <text>`    | （なし）                                  | 接続後に初期メッセージを送信します。                                               |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`          | エージェントタイムアウト。無効な値は警告をログに記録して無視されます。            |
| `--history-limit <n>` | `200`                                     | アタッチ時に読み込む履歴エントリ数。                                               |

エイリアス: `openclaw chat` と `openclaw terminal` は、`--local` が暗黙的に指定された同じコマンドを呼び出します。

注記:

- `chat` と `terminal` は `openclaw tui --local` のエイリアスです。
- `--local` は `--url`、`--token`、`--password` と組み合わせることはできません。
- `tui` は、可能な場合にトークン/パスワード認証用に設定された Gateway 認証 SecretRefs を解決します（`env`/`file`/`exec` プロバイダー）。
- 設定済みエージェントワークスペースディレクトリ内から起動すると、TUI はセッションキーの既定値としてそのエージェントを自動選択します（`--session` が明示的に `agent:<id>:...` でない限り）。
- ローカルモードは埋め込みエージェントランタイムを直接使用します。ほとんどのローカルツールは動作しますが、Gateway 専用機能は利用できません。
- ローカルモードでは、TUI コマンド面に `/auth [provider]` が追加されます。
- Plugin 承認ゲートはローカルモードでも適用されます。承認が必要なツールはターミナルで判断を求めます。Gateway が関与していないことを理由に、何かが暗黙的に自動承認されることはありません。

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

## Config 修復ループ

現在の config がすでに検証に通っており、埋め込みエージェントにそれを調査させ、ドキュメントと比較し、同じターミナルから修復を支援させたい場合は、ローカルモードを使用します。

`openclaw config validate` がすでに失敗している場合は、先に `openclaw configure` または `openclaw doctor --fix` を使用します。`openclaw chat` は無効な config ガードを回避しません。

```bash
openclaw chat
```

その後、TUI 内で次を実行します。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

`openclaw config set` または `openclaw configure` で対象を絞った修正を適用し、その後 `openclaw config validate` を再実行します。[TUI](/ja-JP/web/tui) と [Config](/ja-JP/cli/config) を参照してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [TUI](/ja-JP/web/tui)
