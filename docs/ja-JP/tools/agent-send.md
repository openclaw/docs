---
read_when:
    - スクリプトまたはコマンドラインからエージェントの実行をトリガーする場合
    - エージェントの返信をプログラムでチャットチャネルに配信する必要があります
summary: CLI からエージェントターンを実行し、必要に応じてチャンネルへ返信を配信する
title: エージェント送信
x-i18n:
    generated_at: "2026-07-11T22:45:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` は、受信チャットメッセージなしで、コマンドラインからエージェントのターンを1回実行します。スクリプト化されたワークフロー、テスト、プログラムによる配信に使用します。フラグと動作の完全なリファレンス：
[エージェント CLI リファレンス](/ja-JP/cli/agent)。

## クイックスタート

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Gateway を介してメッセージを送信し、応答を表示します。

  </Step>

  <Step title="Send a multiline prompt from a file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    有効な UTF-8 ファイルをエージェントメッセージの本文として読み取ります。

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## フラグ

| フラグ                      | 説明                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | 送信するインラインメッセージ                                         |
| `--message-file <path>`     | 有効な UTF-8 ファイルからメッセージを読み取る                         |
| `--to <dest>`               | 対象（電話番号、チャット ID）からセッションキーを導出する             |
| `--session-key <key>`       | 明示的なセッションキーを使用する                                     |
| `--agent <id>`              | 設定済みのエージェントを対象にする（その `main` セッションを使用）    |
| `--session-id <id>`         | ID を指定して既存のセッションを再利用する                             |
| `--model <id>`              | この実行でモデルを上書きする（`provider/model` またはモデル ID）      |
| `--local`                   | ローカルの組み込みランタイムを強制する（Gateway をスキップ）          |
| `--deliver`                 | 応答をチャットチャンネルへ送信する                                   |
| `--channel <name>`          | 配信チャンネル。`--agent` + `--to` と併用すると DM スコープにも適用   |
| `--reply-to <target>`       | 配信先を上書きする                                                   |
| `--reply-channel <name>`    | 配信チャンネルを上書きする                                           |
| `--reply-account <id>`      | 配信アカウント ID を上書きする                                       |
| `--thinking <level>`        | 選択したモデルプロファイルの思考レベルを設定する                     |
| `--verbose <on\|full\|off>` | セッションの詳細レベルを永続化する（`full` はツール出力も記録）       |
| `--timeout <seconds>`       | エージェントのタイムアウトを上書きする（既定値は600秒または設定値）   |
| `--json`                    | 構造化 JSON を出力する                                                |

## 動作

- 既定では、CLI は **Gateway を経由します**。現在のマシン上にある組み込みランタイムを強制するには、`--local` を追加します。
- `--message` または `--message-file` のどちらか一方だけを渡してください。ファイルメッセージでは、任意の UTF-8 BOM を削除した後も複数行の内容が保持されます。
- Gateway リクエストが失敗した場合、CLI はローカルの組み込み実行へ**フォールバック**します。Gateway がタイムアウトした場合は、元のトランスクリプトと競合することを避けるため、新しいセッションでフォールバックします。
- セッションの選択：`--to` はセッションキーを導出します（グループ／チャンネルの対象では分離が維持され、ダイレクトチャットは `main` に集約されます）。`--agent`、`--channel`、`--to` を同時に指定すると、ルーティングはチャンネルの正規の受信者と `session.dmScope` に従います。安定した送信専用 ID では、エージェントのメインセッションから分離された、プロバイダー所有のセッションが使用されます。
- `--session-key` は明示的なキーを選択します。エージェント接頭辞付きのキーは `agent:<agent-id>:<session-key>` を使用する必要があり、`--agent` も指定する場合は、そのエージェント ID と一致する必要があります。センチネルではない接頭辞なしのキーは、`--agent` が指定されている場合、そのエージェントのスコープになります。たとえば、`--agent ops --session-key incident-42` は `agent:ops:incident-42` にルーティングされます。`--agent` がない場合、センチネルではない接頭辞なしのキーは、設定済みの既定エージェントのスコープになります。リテラル値 `global` と `unknown` は、`--agent` が指定されていない場合にのみスコープなしのままになります。組み込みのフォールバック経路では、これらのセンチネルセッションは設定済みの既定エージェントに解決されます。
- `--reply-channel` と `--reply-account` は配信のみに影響します。
- 思考フラグと詳細フラグはセッションストアに永続化されます。
- 出力：既定ではプレーンテキスト、`--json` を指定すると構造化されたペイロードとメタデータが出力されます。
- `--json --deliver` を指定すると、JSON には送信済み、抑制済み、部分送信、送信失敗の配信状態が含まれます。[JSON の配信状態](/ja-JP/cli/agent#json-delivery-status)を参照してください。

## 例

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 関連項目

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/ja-JP/cli/agent" icon="terminal">
    `openclaw agent` のフラグとオプションに関する完全なリファレンス。
  </Card>
  <Card title="Sub-agents" href="/ja-JP/tools/subagents" icon="users">
    バックグラウンドでのサブエージェントの生成。
  </Card>
  <Card title="Sessions" href="/ja-JP/concepts/session" icon="comments">
    セッションキーの仕組みと、`--to`、`--agent`、`--session-id` による解決方法。
  </Card>
  <Card title="Slash commands" href="/ja-JP/tools/slash-commands" icon="slash">
    エージェントセッション内で使用されるネイティブコマンドのカタログ。
  </Card>
</CardGroup>
