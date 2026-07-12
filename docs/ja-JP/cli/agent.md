---
read_when:
    - スクリプトからエージェントを1ターン実行する（必要に応じて応答を配信する）
summary: '`openclaw agent` の CLI リファレンス（Gateway 経由でエージェントのターンを 1 回送信）'
title: エージェント
x-i18n:
    generated_at: "2026-07-12T14:24:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway を介してエージェントを 1 ターン実行します。Gateway リクエストが失敗した場合は組み込みエージェントにフォールバックします。最初から組み込み実行を強制するには `--local` を渡します。

セッションセレクターとして `--to`、`--session-key`、`--session-id`、`--agent` のうち少なくとも 1 つを渡してください。

関連項目: [エージェント送信ツール](/ja-JP/tools/agent-send)

## オプション

- `-m, --message <text>`: メッセージ本文
- `--message-file <path>`: UTF-8 ファイルからメッセージ本文を読み取る
- `-t, --to <dest>`: セッションキーの導出に使用する受信者
- `--session-key <key>`: ルーティングに使用する明示的なセッションキー
- `--session-id <id>`: 明示的なセッション ID
- `--agent <id>`: エージェント ID。ルーティングバインディングを上書きする
- `--model <id>`: この実行のモデルを上書きする（`provider/model` またはモデル ID）
- `--thinking <level>`: エージェントの思考レベル（`off`、`minimal`、`low`、`medium`、`high`、および `xhigh`、`adaptive`、`max` などプロバイダーがサポートするカスタムレベル）
- `--verbose <on|off>`: セッションの詳細出力レベルを永続化する
- `--channel <channel>`: 配信チャネル。省略するとメインセッションのチャネルを使用する
- `--reply-to <target>`: 配信先を上書きする
- `--reply-channel <channel>`: 配信チャネルを上書きする
- `--reply-account <id>`: 配信アカウントを上書きする
- `--local`: Plugin レジストリの事前読み込み後、組み込みエージェントを直接実行する
- `--deliver`: 選択したチャネルまたは配信先へ応答を送信する
- `--timeout <seconds>`: エージェントのタイムアウトを上書きする（デフォルトは 600、または `agents.defaults.timeoutSeconds`）。`0` でタイムアウトを無効にする
- `--json`: JSON を出力する

## 例

```bash
openclaw agent --to +15555550123 --message "ステータス更新" --deliver
openclaw agent --agent ops --message "ログを要約"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "ログを要約"
openclaw agent --session-key agent:ops:incident-42 --message "ステータスを要約"
openclaw agent --agent ops --session-key incident-42 --message "ステータスを要約"
openclaw agent --session-id 1234 --message "受信トレイを要約" --thinking medium
openclaw agent --to +15555550123 --message "ログを追跡" --verbose on --json
openclaw agent --agent ops --message "レポートを生成" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "ローカルで実行" --local
```

## 注記

- `--message` または `--message-file` のいずれか 1 つだけを渡してください。`--message-file` は先頭の UTF-8 BOM を除去し、複数行の内容を保持します。有効な UTF-8 ではないファイルは拒否されます。
- スラッシュコマンド（例: `/compact`）は `--message` 経由では実行できません。CLI はそれらを拒否し、代わりに専用コマンドを案内します（Compaction の場合は `openclaw sessions compact <key>`）。
- `--local` と組み込みフォールバックの実行は単発です。実行用に開かれたバンドル済み MCP ループバックリソースとウォーム Claude stdio セッションは応答後に終了するため、スクリプトから呼び出してもローカルの子プロセスは実行中のまま残りません。一方、Gateway 経由の実行では、Gateway が所有する MCP ループバックリソースは実行中の Gateway プロセス配下に保持されます。
- `--agent`、`--channel`、`--to` を併用すると、セッションルーティングはチャネルの正規受信者と `session.dmScope` に従います。安定した送信専用の受信者 ID を持つチャネルは、エージェントのメインセッションから分離された、プロバイダー所有のセッションを使用します。`--reply-channel` と `--reply-account` は配信にのみ影響します。
- `--session-key` は明示的なセッションキーを選択します。エージェント接頭辞付きキーは `agent:<agent-id>:<session-key>` を使用する必要があり、両方を指定した場合、`--agent` はキーのエージェント ID と一致する必要があります。接頭辞のない非センチネルキーは、`--agent` が指定されていればそのエージェントのスコープになり、指定されていなければ設定済みのデフォルトエージェントのスコープになります。たとえば、`--agent ops --session-key incident-42` は `agent:ops:incident-42` にルーティングされます。リテラルキー `global` と `unknown` は、`--agent` が指定されていない場合に限りスコープなしのままです。
- `--json` は JSON 応答用に stdout を予約します。スクリプトが stdout を直接解析できるように、Gateway、Plugin、および組み込みフォールバックの診断は stderr に出力されます。
- 組み込みフォールバックの JSON には `meta.transport: "embedded"` と `meta.fallbackFrom: "gateway"` が含まれるため、スクリプトでフォールバック実行を検出できます。
- Gateway が実行を受け付けたものの、CLI が最終応答の待機中にタイムアウトした場合、組み込みフォールバックは新しい `gateway-fallback-*` セッション ID／実行 ID を使用し、フォールバックセッションのフィールドとともに `meta.fallbackReason: "gateway_timeout"` を報告します。Gateway が所有するトランスクリプトと競合したり、元のセッションを暗黙に置き換えたりすることはありません。
- `SIGTERM`／`SIGINT` は、Gateway 経由の待機中のリクエストを中断します。Gateway がすでに実行を受け付けている場合、CLI は終了前にその実行 ID に対して `chat.abort` も送信します。`--local` と組み込みフォールバックの実行も同じシグナルを受信しますが、`chat.abort` は送信しません。内部の実行重複排除キーに、このセッションのアクティブな実行がすでに存在する場合、応答は `status: "in_flight"` を報告し、非 JSON CLI は空の応答の代わりに stderr へ診断を出力します。外部の cron／systemd ラッパーでは、シャットダウンを完了できない場合でもスーパーバイザーがプロセスを回収できるように、`timeout -k 60 600 openclaw agent ...` のような強制終了のバックストップを維持してください。
- このコマンドが `models.json` の再生成をトリガーした場合、SecretRef で管理されるプロバイダー認証情報は、解決済みのシークレット平文ではなく、非シークレットマーカー（例: 環境変数名、`secretref-env:ENV_VAR_NAME`、`secretref-managed`）として永続化されます。マーカーの書き込みには、解決済みのランタイムシークレット値ではなく、アクティブなソース設定のスナップショットが使用されます。

## JSON 配信ステータス

`--json --deliver` を指定すると、CLI の JSON 応答にはトップレベルの `deliveryStatus` が含まれ、スクリプトで配信済み、抑止、一部失敗、失敗した送信を区別できます。

```json
{
  "payloads": [{ "text": "レポートの準備ができました", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

Gateway 経由の CLI 応答では、未加工の Gateway 結果の形式も `result.deliveryStatus` に保持されます。

`deliveryStatus.status` は次のいずれかです。

| ステータス       | 意味                                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | 配信が完了しました。                                                                                                                                                   |
| `suppressed`     | 配信は意図的に送信されませんでした（例: メッセージ送信フックによってキャンセルされた、または表示可能な結果がなかった）。終端状態であり、再試行はありません。             |
| `partial_failed` | 後続のペイロードが失敗する前に、少なくとも 1 つのペイロードが送信されました。                                                                                          |
| `failed`         | 永続的な送信が 1 件も完了しなかったか、配信の事前検証に失敗しました。                                                                                                  |

共通フィールド:

- `requested`: オブジェクトが存在する場合は常に `true`。
- `attempted`: 永続的な送信経路が実行されると `true`。事前検証の失敗または表示可能なペイロードがない場合は `false`。
- `succeeded`: `true`、`false`、または `"partial"`。`"partial"` は `status: "partial_failed"` と組み合わせて使用されます。
- `reason`: 永続的な配信または事前検証から返される小文字のスネークケース形式の理由。既知の値には `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target`、`no_delivery_target` が含まれます。永続的な送信の失敗では、失敗したステージが報告されることもあります。この値の種類は増える可能性があるため、未知の値は不透明なものとして扱ってください。
- `resultCount`: 利用可能な場合のチャネル送信結果数。
- `sentBeforeError`: 一部失敗で、エラーが発生する前に少なくとも 1 つのペイロードを送信した場合は `true`。
- `error`: 失敗または一部失敗した送信の場合は `true`。
- `errorMessage`: 基礎となる配信エラーメッセージを取得できた場合にのみ存在します。事前検証の失敗には `error`／`reason` が含まれますが、`errorMessage` は含まれません。
- `payloadOutcomes`: ペイロードごとの結果を示す省略可能なフィールド。利用可能な場合は `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`、またはフックのメタデータが含まれます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [エージェントランタイム](/ja-JP/concepts/agent)
