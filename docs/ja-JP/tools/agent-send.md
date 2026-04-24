---
read_when:
    - scriptまたはcommand lineからagent runをトリガーしたい場合
    - agentのreplyをプログラムからchat channelへ配信する必要がある場合
summary: CLIからagent turnを実行し、必要に応じてreplyをchannelへ配信する
title: Agent send
x-i18n:
    generated_at: "2026-04-24T05:22:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent` は、受信chat messageを必要とせずに、command lineから単一のagent turnを実行します。script化されたworkflow、テスト、プログラムによる配信に使ってください。

## クイックスタート

<Steps>
  <Step title="シンプルなagent turnを実行する">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    これにより、messageはGateway経由で送信され、replyが表示されます。

  </Step>

  <Step title="特定のagentまたはsessionを対象にする">
    ```bash
    # 特定のagentを対象にする
    openclaw agent --agent ops --message "Summarize logs"

    # 電話番号を対象にする（session keyを導出）
    openclaw agent --to +15555550123 --message "Status update"

    # 既存のsessionを再利用する
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="replyをchannelに配信する">
    ```bash
    # WhatsAppに配信（デフォルトchannel）
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Slackに配信
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## フラグ

| Flag                          | 説明                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | 送信するmessage（必須）                                     |
| `--to \<dest\>`               | target（電話番号、chat id）からsession keyを導出する        |
| `--agent \<id\>`              | 設定済みagentを対象にする（その `main` sessionを使う）      |
| `--session-id \<id\>`         | idで既存のsessionを再利用する                               |
| `--local`                     | ローカルembedded runtimeを強制する（Gatewayをスキップ）     |
| `--deliver`                   | replyをchat channelに送信する                               |
| `--channel \<name\>`          | 配信channel（whatsapp、telegram、discord、slackなど）       |
| `--reply-to \<target\>`       | 配信target override                                         |
| `--reply-channel \<name\>`    | 配信channel override                                        |
| `--reply-account \<id\>`      | 配信account id override                                     |
| `--thinking \<level\>`        | 選択したmodel profileのthinking levelを設定する             |
| `--verbose \<on\|full\|off\>` | verbose levelを設定する                                     |
| `--timeout \<seconds\>`       | agent timeoutをoverrideする                                 |
| `--json`                      | 構造化JSONを出力する                                        |

## 動作

- デフォルトでは、CLIは **Gateway経由** で動作します。現在のマシン上の
  embedded runtimeを強制するには `--local` を追加してください。
- Gatewayに到達できない場合、CLIは **ローカルembedded runへフォールバック** します。
- Session選択: `--to` はsession keyを導出します（group/channel targetは
  分離を維持し、direct chatは `main` に集約されます）。
- thinkingとverboseフラグはsession storeに永続化されます。
- 出力: デフォルトはplain text、構造化payload + metadataには `--json` を使います。

## 例

```bash
# JSON出力付きのシンプルなturn
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# thinking level付きのturn
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# sessionとは別のchannelに配信する
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 関連

- [Agent CLIリファレンス](/ja-JP/cli/agent)
- [Sub-agent](/ja-JP/tools/subagents) — バックグラウンドsub-agentの起動
- [セッション](/ja-JP/concepts/session) — session keyの仕組み
