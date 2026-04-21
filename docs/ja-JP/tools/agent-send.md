---
read_when:
    - スクリプトやコマンドラインからエージェント実行をトリガーしたいです
    - エージェントの返信をプログラムからチャットチャネルに配信する必要があります
summary: CLIからエージェントターンを実行し、必要に応じて返信をチャネルへ配信します
title: エージェント送信
x-i18n:
    generated_at: "2026-04-21T13:37:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# エージェント送信

`openclaw agent` は、受信チャットメッセージを必要とせずに、コマンドラインから単一のエージェントターンを実行します。スクリプト化されたワークフロー、テスト、プログラムによる配信に使用します。

## クイックスタート

<Steps>
  <Step title="シンプルなエージェントターンを実行する">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    これにより、メッセージが Gateway 経由で送信され、返信が表示されます。

  </Step>

  <Step title="特定のエージェントまたはセッションを対象にする">
    ```bash
    # 特定のエージェントを対象にする
    openclaw agent --agent ops --message "Summarize logs"

    # 電話番号を対象にする（セッションキーを導出）
    openclaw agent --to +15555550123 --message "Status update"

    # 既存のセッションを再利用する
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="返信をチャネルに配信する">
    ```bash
    # WhatsApp に配信（デフォルトチャネル）
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Slack に配信
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## フラグ

| フラグ                        | 説明                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | 送信するメッセージ（必須）                                  |
| `--to \<dest\>`               | 対象（電話番号、チャットID）からセッションキーを導出        |
| `--agent \<id\>`              | 設定済みエージェントを対象にする（その `main` セッションを使用） |
| `--session-id \<id\>`         | ID で既存のセッションを再利用                               |
| `--local`                     | ローカルの埋め込みランタイムを強制する（Gateway をスキップ） |
| `--deliver`                   | 返信をチャットチャネルに送信する                            |
| `--channel \<name\>`          | 配信チャネル（whatsapp、telegram、discord、slack など）     |
| `--reply-to \<target\>`       | 配信先の上書き                                              |
| `--reply-channel \<name\>`    | 配信チャネルの上書き                                        |
| `--reply-account \<id\>`      | 配信アカウントIDの上書き                                    |
| `--thinking \<level\>`        | 選択したモデルプロファイルの thinking レベルを設定          |
| `--verbose \<on\|full\|off\>` | verbose レベルを設定                                        |
| `--timeout \<seconds\>`       | エージェントタイムアウトを上書き                            |
| `--json`                      | 構造化 JSON を出力                                          |

## 動作

- デフォルトでは、CLI は **Gateway 経由**で実行されます。現在のマシン上の埋め込みランタイムを強制するには `--local` を追加してください。
- Gateway に到達できない場合、CLI はローカルの埋め込み実行に**フォールバック**します。
- セッション選択: `--to` はセッションキーを導出します（グループ/チャネル対象は分離を維持し、ダイレクトチャットは `main` に集約されます）。
- thinking と verbose のフラグはセッションストアに永続化されます。
- 出力: デフォルトではプレーンテキスト、または構造化ペイロード + メタデータ用の `--json`。

## 例

```bash
# JSON 出力付きのシンプルなターン
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# thinking レベル付きのターン
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# セッションとは異なるチャネルに配信
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 関連

- [Agent CLI reference](/cli/agent)
- [Sub-agents](/ja-JP/tools/subagents) — バックグラウンドの sub-agent 起動
- [Sessions](/ja-JP/concepts/session) — セッションキーの仕組み
