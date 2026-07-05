---
read_when:
    - スクリプトまたはコマンドラインからエージェント実行をトリガーしたい
    - エージェントの返信をチャットチャンネルへプログラムで配信する必要がある
summary: CLI からエージェントターンを実行し、必要に応じて返信をチャネルへ配信する
title: エージェント送信
x-i18n:
    generated_at: "2026-07-05T11:52:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d18acce5a6925463d6fb97c2cbf1d6392611cbeced604a821fa1edaa7fbc5b01
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` は、受信チャットメッセージなしでコマンドラインから単一のエージェントターンを実行します。スクリプト化されたワークフロー、テスト、プログラムによる配信に使用します。フラグと動作の完全なリファレンス:
[Agent CLI リファレンス](/ja-JP/cli/agent)。

## クイックスタート

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Gateway 経由でメッセージを送信し、返信を出力します。

  </Step>

  <Step title="Send a multiline prompt from a file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    有効な UTF-8 ファイルをエージェントメッセージ本文として読み取ります。

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
| `--message-file <path>`     | 有効な UTF-8 ファイルからメッセージを読み取る                       |
| `--to <dest>`               | ターゲット（電話、チャット ID）からセッションキーを導出する         |
| `--session-key <key>`       | 明示的なセッションキーを使用する                                    |
| `--agent <id>`              | 設定済みエージェントをターゲットにする（その `main` セッションを使用） |
| `--session-id <id>`         | ID で既存のセッションを再利用する                                   |
| `--model <id>`              | この実行のモデル上書き（`provider/model` またはモデル ID）          |
| `--local`                   | ローカル埋め込みランタイムを強制する（Gateway をスキップ）          |
| `--deliver`                 | 返信をチャットチャンネルへ送信する                                  |
| `--channel <name>`          | 配信チャンネル（discord、slack、telegram、whatsapp など）           |
| `--reply-to <target>`       | 配信ターゲットの上書き                                              |
| `--reply-channel <name>`    | 配信チャンネルの上書き                                              |
| `--reply-account <id>`      | 配信アカウント ID の上書き                                          |
| `--thinking <level>`        | 選択したモデルプロファイルの思考レベルを設定する                    |
| `--verbose <on\|full\|off>` | セッションの verbose レベルを永続化する（`full` はツール出力もログに記録） |
| `--timeout <seconds>`       | エージェントタイムアウトを上書きする（デフォルト 600、または設定値） |
| `--json`                    | 構造化 JSON を出力する                                              |

## 動作

- デフォルトでは、CLI は **Gateway 経由**で実行されます。現在のマシン上の埋め込みランタイムを強制するには `--local` を追加します。
- `--message` または `--message-file` のどちらか一方だけを渡します。ファイルメッセージは、任意の UTF-8 BOM を削除した後も複数行コンテンツを保持します。
- Gateway リクエストが失敗した場合、CLI はローカル埋め込み実行へ**フォールバック**します。Gateway タイムアウト時は、元のトランスクリプトと競合させる代わりに、新しいセッションでフォールバックします。
- セッション選択: `--to` はセッションキーを導出します（グループ/チャンネルターゲットは分離を保持し、直接チャットは `main` に統合されます）。
- `--session-key` は明示的なキーを選択します。エージェント接頭辞付きキーは `agent:<agent-id>:<session-key>` を使用する必要があり、両方が指定された場合は `--agent` がそのエージェント ID と一致している必要があります。素の非センチネルキーは、指定されている場合は `--agent` にスコープされます。たとえば、`--agent ops --session-key incident-42` は `agent:ops:incident-42` にルーティングされます。`--agent` がない場合、素の非センチネルキーは設定済みのデフォルトエージェントにスコープされます。リテラルの `global` と `unknown` は、`--agent` が指定されていない場合にのみスコープなしのままです。埋め込みフォールバックパスは、これらのセンチネルセッションを設定済みのデフォルトエージェントに解決します。
- `--channel`、`--reply-channel`、`--reply-account` は返信配信に影響し、セッションルーティングには影響しません。
- thinking フラグと verbose フラグはセッションストアに永続化されます。
- 出力: デフォルトはプレーンテキスト、構造化ペイロード + メタデータには `--json` を使用します。
- `--json --deliver` では、JSON に送信済み、抑制済み、部分的、失敗した送信の配信ステータスが含まれます。[JSON 配信ステータス](/ja-JP/cli/agent#json-delivery-status)を参照してください。

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

## 関連

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/ja-JP/cli/agent" icon="terminal">
    `openclaw agent` のフラグとオプションの完全なリファレンス。
  </Card>
  <Card title="Sub-agents" href="/ja-JP/tools/subagents" icon="users">
    バックグラウンドのサブエージェント生成。
  </Card>
  <Card title="Sessions" href="/ja-JP/concepts/session" icon="comments">
    セッションキーの仕組みと、`--to`、`--agent`、`--session-id` がそれらを解決する方法。
  </Card>
  <Card title="Slash commands" href="/ja-JP/tools/slash-commands" icon="slash">
    エージェントセッション内で使用されるネイティブコマンドカタログ。
  </Card>
</CardGroup>
