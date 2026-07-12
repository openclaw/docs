---
read_when:
    - Gateway 用のターミナル UI が必要（リモート環境向け）
    - スクリプトから url/token/session を渡す場合
    - Gateway を使用せずに、ローカル組み込みモードで TUI を実行する場合
    - openclaw chat または openclaw tui --local を使用する場合
summary: '`openclaw tui` の CLI リファレンス（Gateway 経由またはローカル組み込み型のターミナル UI）'
title: TUI
x-i18n:
    generated_at: "2026-07-11T22:04:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Gateway に接続されたターミナル UI を開くか、ローカルの埋め込みモードで実行します。

関連ガイド: [TUI](/ja-JP/web/tui)

## オプション

| フラグ                       | デフォルト                                | 説明                                                                               |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Gateway の代わりに、ローカルの埋め込みエージェントランタイムに対して実行します。  |
| `--url <url>`                | 設定の `gateway.remote.url`               | Gateway の WebSocket URL。                                                         |
| `--token <token>`            | （なし）                                  | 必要な場合の Gateway トークン。                                                    |
| `--password <pass>`          | （なし）                                  | 必要な場合の Gateway パスワード。                                                  |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | ピン留めされた `wss://` Gateway で想定される TLS 証明書フィンガープリント。         |
| `--session <key>`            | `main`（スコープがグローバルなら `global`） | セッションキー。エージェントワークスペース内では、接頭辞がなければそのエージェントが自動選択されます。 |
| `--deliver`                  | `false`                                   | 設定済みのチャンネルを通じてアシスタントの応答を配信します。                       |
| `--thinking <level>`         | （モデルのデフォルト）                    | 思考レベルを上書きします。                                                         |
| `--message <text>`           | （なし）                                  | 接続後に最初のメッセージを送信します。                                             |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | エージェントのタイムアウト。無効な値は警告がログに記録され、無視されます。         |
| `--history-limit <n>`        | `200`                                     | アタッチ時に読み込む履歴エントリ数。                                               |

エイリアス: `openclaw chat` と `openclaw terminal` は、`--local` を暗黙的に指定してこのコマンドを呼び出します。

## 注意事項

- `--local` は `--url`、`--token`、`--password`、`--tls-fingerprint` と併用できません。
- `tui` は、可能な場合にトークンまたはパスワード認証用として設定された Gateway 認証の SecretRef を解決します（`env`/`file`/`exec` プロバイダー）。
- URL またはポートが明示されていない場合、`tui` は実行中の Gateway によって記録された、現在有効なローカル Gateway ポートを使用します。明示的な `--url`、`OPENCLAW_GATEWAY_URL`、`OPENCLAW_GATEWAY_PORT`、リモート Gateway 設定が引き続き優先されます。
- 設定済みエージェントのワークスペースディレクトリ内から起動すると、TUI はセッションキーのデフォルトとしてそのエージェントを自動選択します（`--session` が明示的に `agent:<id>:...` に設定されている場合を除く）。
- ローカル以外の URL ベースの接続でフッターに Gateway のホスト名を表示するには、`openclaw config set tui.footer.showRemoteHost true` を実行します。デフォルトでは無効で、ループバック接続または埋め込みローカル接続では表示されません。
- ローカルモードでは、埋め込みエージェントランタイムを直接使用します。ほとんどのローカルツールは動作しますが、Gateway 専用機能は利用できません。
- ローカルモードでは、TUI のコマンド一覧に `/auth [provider]` が追加されます。
- ローカルモードでも Plugin の承認ゲートが適用されます。承認が必要なツールはターミナルで判断を求め、暗黙的に自動承認されることはありません。
- セッションの[目標](/ja-JP/tools/goal)はフッターに表示され、`/goal` で管理できます。

## 例

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "設定をドキュメントと比較し、修正すべき点を教えて"
# エージェントワークスペース内で実行すると、そのエージェントを自動的に推測
openclaw tui --session bugfix
```

## 設定修復ループ

ローカルモードを使用すると、埋め込みエージェントが現在の設定を検査してドキュメントと比較し、同じターミナルから修復を支援できます。

`openclaw config validate` がすでに失敗している場合は、先に `openclaw configure` または `openclaw doctor --fix` を実行してください。`openclaw chat` は無効な設定に対するガードを回避しません。

```bash
openclaw chat
```

次に、TUI 内で以下を実行します。

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

`openclaw config set` または `openclaw configure` で対象を絞った修正を適用し、`openclaw config validate` を再実行します。[TUI](/ja-JP/web/tui)および[設定](/ja-JP/cli/config)を参照してください。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [TUI](/ja-JP/web/tui)
- [目標](/ja-JP/tools/goal)
