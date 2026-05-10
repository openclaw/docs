---
read_when:
    - スクリプトまたはコマンドラインからエージェントの実行をトリガーしたい
    - エージェントの返信をプログラムでチャットチャネルに配信する必要がある
summary: CLI からエージェントターンを実行し、任意で返信をチャンネルに送信する
title: エージェント送信
x-i18n:
    generated_at: "2026-05-10T19:53:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` は、受信チャットメッセージを必要とせずにコマンドラインから単一のエージェントターンを実行します。スクリプト化されたワークフロー、テスト、プログラムによる配信に使用します。

## クイックスタート

<Steps>
  <Step title="単純なエージェントターンを実行する">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    これはメッセージを Gateway 経由で送信し、返信を出力します。

  </Step>

  <Step title="特定のエージェントまたはセッションを対象にする">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="返信をチャンネルに配信する">
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
| `--message \<text\>`          | 送信するメッセージ（必須）                                  |
| `--to \<dest\>`               | 対象（電話、チャット ID）からセッションキーを導出する       |
| `--agent \<id\>`              | 設定済みエージェントを対象にする（その `main` セッションを使用） |
| `--session-id \<id\>`         | ID で既存のセッションを再利用する                           |
| `--local`                     | ローカルの組み込みランタイムを強制する（Gateway をスキップ） |
| `--deliver`                   | 返信をチャットチャンネルに送信する                          |
| `--channel \<name\>`          | 配信チャンネル（whatsapp、telegram、discord、slack など）   |
| `--reply-to \<target\>`       | 配信先の上書き                                              |
| `--reply-channel \<name\>`    | 配信チャンネルの上書き                                      |
| `--reply-account \<id\>`      | 配信アカウント ID の上書き                                  |
| `--thinking \<level\>`        | 選択したモデルプロファイルの thinking レベルを設定する      |
| `--verbose \<on\|full\|off\>` | verbose レベルを設定する                                    |
| `--timeout \<seconds\>`       | エージェントのタイムアウトを上書きする                      |
| `--json`                      | 構造化 JSON を出力する                                      |

## 動作

- デフォルトでは、CLI は **Gateway 経由**で動作します。現在のマシン上の組み込みランタイムを強制するには `--local` を追加します。
- Gateway に到達できない場合、CLI はローカルの組み込み実行に**フォールバック**します。
- セッション選択: `--to` はセッションキーを導出します（グループ/チャンネルの対象は分離を維持し、直接チャットは `main` に統合されます）。
- thinking と verbose のフラグはセッションストアに永続化されます。
- 出力: デフォルトはプレーンテキスト、構造化ペイロード + メタデータには `--json` を使用します。
- `--json --deliver` を指定すると、JSON には送信済み、抑制済み、部分送信、送信失敗の配信ステータスが含まれます。[JSON 配信ステータス](/ja-JP/cli/agent#json-delivery-status)を参照してください。

## 例

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 関連

<CardGroup cols={2}>
  <Card title="エージェント CLI リファレンス" href="/ja-JP/cli/agent" icon="terminal">
    `openclaw agent` の全フラグとオプションのリファレンス。
  </Card>
  <Card title="サブエージェント" href="/ja-JP/tools/subagents" icon="users">
    バックグラウンドでのサブエージェント生成。
  </Card>
  <Card title="セッション" href="/ja-JP/concepts/session" icon="comments">
    セッションキーの仕組みと、`--to`、`--agent`、`--session-id` がそれらを解決する方法。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="slash">
    エージェントセッション内で使用されるネイティブコマンドカタログ。
  </Card>
</CardGroup>
