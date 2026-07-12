---
read_when:
    - スクリプトまたはコマンドラインからエージェントの実行をトリガーしたい場合
    - エージェントの応答をプログラムからチャットチャンネルへ配信する必要があります
summary: CLI からエージェントターンを実行し、必要に応じてチャンネルに応答を配信する
title: エージェント送信
x-i18n:
    generated_at: "2026-07-12T14:51:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` は、受信チャットメッセージなしでコマンドラインから単一のエージェントターンを実行します。スクリプト化されたワークフロー、テスト、プログラムによる配信に使用します。フラグと動作の完全なリファレンス:
[エージェント CLI リファレンス](/ja-JP/cli/agent)。

## クイックスタート

<Steps>
  <Step title="シンプルなエージェントターンを実行する">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Gateway を介してメッセージを送信し、応答を出力します。

  </Step>

  <Step title="ファイルから複数行のプロンプトを送信する">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    有効な UTF-8 ファイルをエージェントメッセージの本文として読み取ります。

  </Step>

  <Step title="特定のエージェントまたはセッションを指定する">
    ```bash
    # 特定のエージェントを指定
    openclaw agent --agent ops --message "Summarize logs"

    # 電話番号を指定（セッションキーを導出）
    openclaw agent --to +15555550123 --message "Status update"

    # 既存のセッションを再利用
    openclaw agent --session-id abc123 --message "Continue the task"

    # 正確なセッションキーを指定
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="応答をチャンネルに配信する">
    ```bash
    # WhatsApp に配信（デフォルトチャンネル）
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Slack に配信
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
| `--to <dest>`               | 対象（電話番号、チャット ID）からセッションキーを導出する            |
| `--session-key <key>`       | 明示的なセッションキーを使用する                                     |
| `--agent <id>`              | 設定済みのエージェントを指定する（その `main` セッションを使用）     |
| `--session-id <id>`         | ID を指定して既存のセッションを再利用する                            |
| `--model <id>`              | この実行で使用するモデルを上書きする（`provider/model` またはモデル ID） |
| `--local`                   | ローカルの組み込みランタイムを強制する（Gateway をスキップ）         |
| `--deliver`                 | 応答をチャットチャンネルに送信する                                   |
| `--channel <name>`          | 配信チャンネル。`--agent` + `--to` と併用すると DM スコープにも適用  |
| `--reply-to <target>`       | 配信先を上書きする                                                   |
| `--reply-channel <name>`    | 配信チャンネルを上書きする                                           |
| `--reply-account <id>`      | 配信アカウント ID を上書きする                                      |
| `--thinking <level>`        | 選択したモデルプロファイルの思考レベルを設定する                     |
| `--verbose <on\|full\|off>` | セッションの詳細レベルを永続化する（`full` ではツール出力もログに記録） |
| `--timeout <seconds>`       | エージェントのタイムアウトを上書きする（デフォルトは 600、または設定値） |
| `--json`                    | 構造化された JSON を出力する                                         |

## 動作

- デフォルトでは、CLI は **Gateway を経由します**。現在のマシン上の組み込みランタイムを強制するには、`--local` を追加します。
- `--message` または `--message-file` のいずれか一方だけを渡します。ファイルメッセージでは、任意の UTF-8 BOM を削除した後も複数行の内容が保持されます。
- Gateway リクエストが失敗した場合、CLI はローカルの組み込み実行に**フォールバック**します。Gateway がタイムアウトした場合は、元のトランスクリプトと競合させず、新しいセッションでフォールバックします。
- セッションの選択: `--to` はセッションキーを導出します（グループ/チャンネルの対象では分離が維持され、ダイレクトチャットは `main` に統合されます）。`--agent`、`--channel`、`--to` を併用すると、ルーティングはチャンネルの正規受信者と `session.dmScope` に従います。安定した送信専用 ID では、エージェントのメインセッションから分離された、プロバイダー所有のセッションを使用します。
- `--session-key` は明示的なキーを選択します。エージェント接頭辞付きキーは `agent:<agent-id>:<session-key>` を使用する必要があり、`--agent` も指定されている場合は、そのエージェント ID と一致する必要があります。センチネルではない接頭辞なしのキーは、`--agent` が指定されている場合、そのエージェントのスコープになります。たとえば、`--agent ops --session-key incident-42` は `agent:ops:incident-42` にルーティングされます。`--agent` がない場合、センチネルではない接頭辞なしのキーは、設定済みのデフォルトエージェントのスコープになります。リテラルの `global` と `unknown` は、`--agent` が指定されていない場合にのみスコープなしのままです。組み込みフォールバックパスでは、これらのセンチネルセッションを設定済みのデフォルトエージェントに解決します。
- `--reply-channel` と `--reply-account` は配信にのみ影響します。
- 思考フラグと詳細フラグはセッションストアに永続化されます。
- 出力: デフォルトではプレーンテキスト、または `--json` で構造化されたペイロードとメタデータを出力します。
- `--json --deliver` を使用すると、JSON には送信済み、抑制済み、部分的、失敗の各送信に関する配信ステータスが含まれます。[JSON 配信ステータス](/ja-JP/cli/agent#json-delivery-status)を参照してください。

## 例

```bash
# JSON 出力を伴うシンプルなターン
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# モデルを上書きするターン
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# 思考レベルを指定するターン
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# ファイルから複数行のプロンプトを読み取る
openclaw agent --agent ops --message-file ./task.md

# 正確なセッションキー
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# エージェントのスコープに設定されたレガシーキー
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# セッションとは異なるチャンネルに配信
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## 関連項目

<CardGroup cols={2}>
  <Card title="エージェント CLI リファレンス" href="/ja-JP/cli/agent" icon="terminal">
    `openclaw agent` のフラグとオプションの完全なリファレンス。
  </Card>
  <Card title="サブエージェント" href="/ja-JP/tools/subagents" icon="users">
    バックグラウンドでのサブエージェントの起動。
  </Card>
  <Card title="セッション" href="/ja-JP/concepts/session" icon="comments">
    セッションキーの仕組みと、`--to`、`--agent`、`--session-id` による解決方法。
  </Card>
  <Card title="スラッシュコマンド" href="/ja-JP/tools/slash-commands" icon="slash">
    エージェントセッション内で使用されるネイティブコマンドカタログ。
  </Card>
</CardGroup>
