---
read_when:
    - スクリプトまたはコマンドラインからエージェント実行をトリガーしたい場合
    - チャットチャネルへエージェントの返信をプログラムで配信する必要がある
summary: CLI からエージェントターンを実行し、任意で返信をチャンネルへ配信する
title: エージェント送信
x-i18n:
    generated_at: "2026-06-27T13:07:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` は、受信チャットメッセージを必要とせず、コマンドラインから単一のエージェントターンを実行します。スクリプト化されたワークフロー、テスト、プログラムによる配信に使用します。

## クイックスタート

<Steps>
  <Step title="単純なエージェントターンを実行する">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    これはメッセージを Gateway 経由で送信し、返信を出力します。

  </Step>

  <Step title="ファイルから複数行プロンプトを送信する">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    これは有効な UTF-8 ファイルをエージェントメッセージ本文として読み取ります。

  </Step>

  <Step title="特定のエージェントまたはセッションを対象にする">
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

  <Step title="返信をチャネルに配信する">
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

| フラグ                        | 説明                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | 送信するインラインメッセージ                                |
| `--message-file \<path\>`     | 有効な UTF-8 ファイルからメッセージを読み取る               |
| `--to \<dest\>`               | ターゲット（電話、チャット ID）からセッションキーを導出する |
| `--session-key \<key\>`       | 明示的なセッションキーを使用する                            |
| `--agent \<id\>`              | 設定済みエージェントを対象にする（その `main` セッションを使用） |
| `--session-id \<id\>`         | ID で既存のセッションを再利用する                           |
| `--local`                     | ローカル埋め込みランタイムを強制する（Gateway をスキップ）  |
| `--deliver`                   | 返信をチャットチャネルに送信する                            |
| `--channel \<name\>`          | 配信チャネル（whatsapp、telegram、discord、slack など）     |
| `--reply-to \<target\>`       | 配信ターゲットのオーバーライド                              |
| `--reply-channel \<name\>`    | 配信チャネルのオーバーライド                                |
| `--reply-account \<id\>`      | 配信アカウント ID のオーバーライド                          |
| `--thinking \<level\>`        | 選択したモデルプロファイルの thinking レベルを設定する      |
| `--verbose \<on\|full\|off\>` | verbose レベルを設定する                                    |
| `--timeout \<seconds\>`       | エージェントのタイムアウトを上書きする                      |
| `--json`                      | 構造化 JSON を出力する                                      |

## 動作

- デフォルトでは、CLI は **Gateway 経由**で動作します。現在のマシン上の埋め込みランタイムを強制するには `--local` を追加します。
- `--message` または `--message-file` のどちらか 1 つだけを渡します。ファイルメッセージは、任意の UTF-8 BOM を削除した後、複数行の内容を保持します。
- Gateway に到達できない場合、CLI はローカル埋め込み実行に**フォールバック**します。
- セッション選択: `--to` はセッションキーを導出します（グループ/チャネルターゲットは分離を保持し、直接チャットは `main` に集約されます）。
- `--session-key` は明示的なキーを選択します。エージェント接頭辞付きキーは `agent:<agent-id>:<session-key>` を使用する必要があり、両方が指定された場合は `--agent` がそのエージェント ID と一致している必要があります。裸の非センチネルキーは、指定されている場合 `--agent` にスコープされます。たとえば、`--agent ops --session-key incident-42` は `agent:ops:incident-42` にルーティングされます。`--agent` がない場合、裸の非センチネルキーは設定済みのデフォルトエージェントにスコープされます。リテラルの `global` と `unknown` は、`--agent` が指定されていない場合にのみスコープなしのままです。その場合、埋め込みフォールバックとストア所有権は設定済みのデフォルトエージェントを使用します。
- thinking と verbose フラグはセッションストアに永続化されます。
- 出力: デフォルトではプレーンテキスト、または構造化ペイロードとメタデータには `--json` を使用します。
- `--json --deliver` を指定すると、JSON には送信済み、抑制済み、部分的、失敗の送信に対する配信ステータスが含まれます。[JSON 配信ステータス](/ja-JP/cli/agent#json-delivery-status)を参照してください。

## 例

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

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
  <Card title="エージェント CLI リファレンス" href="/ja-JP/cli/agent" icon="terminal">
    `openclaw agent` の完全なフラグとオプションのリファレンス。
  </Card>
  <Card title="サブエージェント" href="/ja-JP/tools/subagents" icon="users">
    バックグラウンドでのサブエージェント生成。
  </Card>
  <Card title="セッション" href="/ja-JP/concepts/session" icon="comments">
    セッションキーの仕組み、および `--to`、`--agent`、`--session-id` がそれらを解決する方法。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="slash">
    エージェントセッション内で使用されるネイティブコマンドカタログ。
  </Card>
</CardGroup>
