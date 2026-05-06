---
read_when:
    - スクリプトまたはコマンドラインからエージェント実行をトリガーしたい
    - エージェントの返信をプログラムからチャットチャネルに配信する必要がある
summary: CLI からエージェントターンを実行し、任意で返信をチャネルへ配信します
title: エージェント送信
x-i18n:
    generated_at: "2026-05-06T05:19:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` は、受信チャットメッセージを必要とせずに、コマンドラインから単一のエージェントターンを実行します。スクリプト化されたワークフロー、テスト、プログラムによる配信に使用します。

## クイックスタート

<Steps>
  <Step title="単純なエージェントターンを実行する">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    これにより、メッセージが Gateway 経由で送信され、返信が出力されます。

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
| `--to \<dest\>`               | 対象（電話、チャット ID）からセッションキーを導出します      |
| `--agent \<id\>`              | 設定済みエージェントを対象にします（その `main` セッションを使用） |
| `--session-id \<id\>`         | ID で既存のセッションを再利用します                         |
| `--local`                     | ローカルの組み込みランタイムを強制します（Gateway をスキップ） |
| `--deliver`                   | 返信をチャットチャンネルに送信します                        |
| `--channel \<name\>`          | 配信チャンネル（whatsapp、telegram、discord、slack など）    |
| `--reply-to \<target\>`       | 配信先の上書き                                              |
| `--reply-channel \<name\>`    | 配信チャンネルの上書き                                      |
| `--reply-account \<id\>`      | 配信アカウント ID の上書き                                  |
| `--thinking \<level\>`        | 選択したモデルプロファイルの思考レベルを設定します          |
| `--verbose \<on\|full\|off\>` | 詳細出力レベルを設定します                                  |
| `--timeout \<seconds\>`       | エージェントのタイムアウトを上書きします                    |
| `--json`                      | 構造化 JSON を出力します                                    |

## 動作

- デフォルトでは、CLI は **Gateway 経由**で動作します。現在のマシン上の組み込みランタイムを強制するには `--local` を追加します。
- Gateway に到達できない場合、CLI はローカルの組み込み実行に**フォールバック**します。
- セッション選択: `--to` はセッションキーを導出します（グループ/チャンネル対象は分離を保持し、直接チャットは `main` に集約されます）。
- thinking と verbose のフラグはセッションストアに保持されます。
- 出力: デフォルトはプレーンテキスト、構造化ペイロード + メタデータには `--json` を使用します。

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
    `openclaw agent` のすべてのフラグとオプションのリファレンス。
  </Card>
  <Card title="サブエージェント" href="/ja-JP/tools/subagents" icon="users">
    バックグラウンドでのサブエージェントの起動。
  </Card>
  <Card title="セッション" href="/ja-JP/concepts/session" icon="comments">
    セッションキーの仕組みと、`--to`、`--agent`、`--session-id` がそれらを解決する方法。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="slash">
    エージェントセッション内で使用されるネイティブコマンドカタログ。
  </Card>
</CardGroup>
