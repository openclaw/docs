---
read_when:
    - スクリプトから1回のエージェントターンを実行する（任意で返信を配信する）
summary: '`openclaw agent` の CLI リファレンス（Gateway 経由で 1 回のエージェントターンを送信）'
title: エージェント
x-i18n:
    generated_at: "2026-07-05T11:10:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a0e1dcf7fb08e592cadf99380dcf700c82685a74d6fda2883ac2fdbb79267e
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway 経由で 1 回のエージェントターンを実行します。Gateway リクエストが失敗した場合は、埋め込みエージェントにフォールバックします。最初から埋め込み実行を強制するには `--local` を渡します。

少なくとも 1 つのセッションセレクターを渡してください: `--to`、`--session-key`、`--session-id`、または `--agent`。

関連: [エージェント送信ツール](/ja-JP/tools/agent-send)

## オプション

- `-m, --message <text>`: メッセージ本文
- `--message-file <path>`: UTF-8 ファイルからメッセージ本文を読み取る
- `-t, --to <dest>`: セッションキーの導出に使う受信者
- `--session-key <key>`: ルーティングに使用する明示的なセッションキー
- `--session-id <id>`: 明示的なセッション ID
- `--agent <id>`: エージェント ID。ルーティングバインディングを上書きする
- `--model <id>`: この実行のモデル上書き (`provider/model` またはモデル ID)
- `--thinking <level>`: エージェントの思考レベル (`off`、`minimal`、`low`、`medium`、`high`、および `xhigh`、`adaptive`、`max` などプロバイダーが対応するカスタムレベル)
- `--verbose <on|off>`: セッションの詳細出力レベルを永続化する
- `--channel <channel>`: 配信チャネル。メインのセッションチャネルを使用する場合は省略
- `--reply-to <target>`: 配信先ターゲットの上書き
- `--reply-channel <channel>`: 配信チャネルの上書き
- `--reply-account <id>`: 配信アカウントの上書き
- `--local`: 埋め込みエージェントを直接実行する (Plugin レジストリのプリロード後)
- `--deliver`: 選択したチャネル/ターゲットへ返信を送り返す
- `--timeout <seconds>`: エージェントのタイムアウトを上書きする (デフォルトは 600、または `agents.defaults.timeoutSeconds`)。`0` はタイムアウトを無効にする
- `--json`: JSON を出力する

## 例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 注記

- `--message` または `--message-file` のいずれかを正確に 1 つ渡します。`--message-file` は先頭の UTF-8 BOM を取り除き、複数行コンテンツを保持します。有効な UTF-8 ではないファイルは拒否されます。
- スラッシュコマンド (例: `/compact`) は `--message` 経由では実行できません。CLI はこれらを拒否し、代わりに第一級コマンドを案内します (Compaction の場合は `openclaw sessions compact <key>`)。
- `--local` と埋め込みフォールバック実行は 1 回限りです。実行用に開かれたバンドル MCP loopback リソースとウォーム済み Claude stdio セッションは返信後に破棄されるため、スクリプト呼び出しでローカル子プロセスが実行されたままになることはありません。Gateway ベースの実行では、代わりに実行中の Gateway プロセス配下に Gateway 所有の MCP loopback リソースを保持します。
- `--channel`、`--reply-channel`、`--reply-account` は返信配信に影響し、セッションルーティングには影響しません。
- `--session-key` は明示的なセッションキーを選択します。エージェント接頭辞付きキーは `agent:<agent-id>:<session-key>` を使う必要があり、両方が指定されている場合、`--agent` はキーのエージェント ID と一致する必要があります。ベアの非センチネルキーは、指定されている場合は `--agent` にスコープされ、そうでない場合は設定済みのデフォルトエージェントにスコープされます。たとえば `--agent ops --session-key incident-42` は `agent:ops:incident-42` にルーティングします。リテラルキー `global` と `unknown` は、`--agent` が指定されていない場合のみスコープなしのままです。
- `--json` は JSON レスポンス用に stdout を予約します。Gateway、Plugin、埋め込みフォールバックの診断は stderr に送られるため、スクリプトは stdout を直接解析できます。
- 埋め込みフォールバックの JSON には `meta.transport: "embedded"` と `meta.fallbackFrom: "gateway"` が含まれるため、スクリプトはフォールバック実行を検出できます。
- Gateway が実行を受け付けたものの、CLI が最終返信を待つ間にタイムアウトした場合、埋め込みフォールバックは新しい `gateway-fallback-*` セッション/実行 ID を使用し、Gateway 所有のトランスクリプトと競合したり元のセッションを暗黙に置き換えたりする代わりに、`meta.fallbackReason: "gateway_timeout"` とフォールバックセッションフィールドを報告します。
- `SIGTERM`/`SIGINT` は待機中の Gateway ベースのリクエストを中断します。Gateway がすでに実行を受け付けている場合、CLI は終了前にその実行 ID に対して `chat.abort` も送信します。`--local` と埋め込みフォールバック実行は同じシグナルを受け取りますが、`chat.abort` は送信しません。内部の実行重複排除キーにこのセッションのアクティブな実行がすでにある場合、レスポンスは `status: "in_flight"` を報告し、非 JSON CLI は空の返信の代わりに stderr 診断を出力します。外部 cron/systemd ラッパーでは、シャットダウンを排出できない場合にスーパーバイザーがプロセスを回収できるよう、`timeout -k 60 600 openclaw agent ...` のような強制終了のバックストップを維持してください。
- このコマンドが `models.json` の再生成をトリガーする場合、SecretRef 管理のプロバイダー認証情報は、解決済みシークレット平文ではなく、非シークレットマーカー (たとえば env var 名、`secretref-env:ENV_VAR_NAME`、または `secretref-managed`) として永続化されます。マーカー書き込みは、解決済みランタイムシークレット値ではなく、アクティブなソース設定スナップショットから行われます。

## JSON 配信ステータス

`--json --deliver` を指定すると、CLI の JSON レスポンスにはトップレベルの `deliveryStatus` が含まれるため、スクリプトは配信済み、抑制済み、部分的、失敗した送信を区別できます。

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
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

Gateway ベースの CLI レスポンスも、生の Gateway 結果形状を `result.deliveryStatus` に保持します。

`deliveryStatus.status` は次のいずれかです。

| ステータス       | 意味                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | 配信が完了しました。                                                                                                                       |
| `suppressed`     | 配信は意図的に送信されませんでした (たとえばメッセージ送信フックがキャンセルした、または表示可能な結果がなかった場合)。終端状態で、再試行はありません。 |
| `partial_failed` | 後続のペイロードが失敗する前に、少なくとも 1 つのペイロードが送信されました。                                                              |
| `failed`         | 永続的な送信が完了しなかった、または配信のプリフライトに失敗しました。                                                                     |

共通フィールド:

- `requested`: オブジェクトが存在する場合は常に `true`。
- `attempted`: 永続的な送信パスが実行されると `true`。プリフライト失敗または表示可能なペイロードがない場合は `false`。
- `succeeded`: `true`、`false`、または `"partial"`。`"partial"` は `status: "partial_failed"` と組み合わせられます。
- `reason`: 永続配信またはプリフライト検証からの小文字の snake-case 理由。既知の値には `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target`、`no_delivery_target` が含まれます。失敗した永続送信では、失敗したステージも報告される場合があります。集合は拡張される可能性があるため、不明な値は不透明なものとして扱ってください。
- `resultCount`: 利用可能な場合、チャネル送信結果の数。
- `sentBeforeError`: 部分失敗で、エラーになる前に少なくとも 1 つのペイロードを送信した場合は `true`。
- `error`: 失敗または部分失敗した送信の場合は `true`。
- `errorMessage`: 基底の配信エラーメッセージが取得された場合のみ存在します。プリフライト失敗では `error`/`reason` は保持しますが、`errorMessage` はありません。
- `payloadOutcomes`: 利用可能な場合、`index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`、またはフックメタデータを含む任意のペイロードごとの結果。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [エージェントランタイム](/ja-JP/concepts/agent)
