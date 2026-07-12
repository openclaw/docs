---
read_when:
    - スクリプトからエージェントを1ターン実行する（必要に応じて返信を配信する）
summary: '`openclaw agent` の CLI リファレンス（Gateway 経由でエージェントのターンを1回送信）'
title: エージェント
x-i18n:
    generated_at: "2026-07-11T22:06:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway を介してエージェントのターンを1回実行します。Gateway リクエストが失敗した場合は組み込みエージェントにフォールバックします。最初から組み込み実行を強制するには `--local` を渡します。

セッションセレクターとして `--to`、`--session-key`、`--session-id`、`--agent` のうち少なくとも1つを渡します。

関連項目: [エージェント送信ツール](/ja-JP/tools/agent-send)

## オプション

- `-m, --message <text>`: メッセージ本文
- `--message-file <path>`: UTF-8 ファイルからメッセージ本文を読み取る
- `-t, --to <dest>`: セッションキーの導出に使用する受信者
- `--session-key <key>`: ルーティングに使用する明示的なセッションキー
- `--session-id <id>`: 明示的なセッション ID
- `--agent <id>`: エージェント ID。ルーティングバインディングを上書きする
- `--model <id>`: この実行で使用するモデルの上書き指定（`provider/model` またはモデル ID）
- `--thinking <level>`: エージェントの思考レベル（`off`、`minimal`、`low`、`medium`、`high` に加え、`xhigh`、`adaptive`、`max` などプロバイダーがサポートするカスタムレベル）
- `--verbose <on|off>`: セッションの詳細出力レベルを永続化する
- `--channel <channel>`: 配信チャネル。省略するとメインセッションのチャネルを使用する
- `--reply-to <target>`: 配信先の上書き指定
- `--reply-channel <channel>`: 配信チャネルの上書き指定
- `--reply-account <id>`: 配信アカウントの上書き指定
- `--local`: 組み込みエージェントを直接実行する（Plugin レジストリのプリロード後）
- `--deliver`: 選択したチャネルまたは配信先へ応答を送り返す
- `--timeout <seconds>`: エージェントのタイムアウトを上書きする（デフォルトは600、または `agents.defaults.timeoutSeconds`）。`0` でタイムアウトを無効化する
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

## 注意事項

- `--message` または `--message-file` のどちらか一方だけを渡します。`--message-file` は先頭の UTF-8 BOM を除去し、複数行の内容を保持します。有効な UTF-8 ではないファイルは拒否されます。
- スラッシュコマンド（例: `/compact`）は `--message` では実行できません。CLI はこれを拒否し、代わりに専用コマンド（Compaction の場合は `openclaw sessions compact <key>`）を案内します。
- `--local` および組み込みフォールバックによる実行は単発です。実行用に開かれた同梱 MCP ループバックリソースとウォーム状態の Claude stdio セッションは応答後に破棄されるため、スクリプトから呼び出してもローカルの子プロセスが実行中のまま残ることはありません。一方、Gateway 経由の実行では、Gateway が所有する MCP ループバックリソースは実行中の Gateway プロセス配下で維持されます。
- `--agent`、`--channel`、`--to` を同時に指定した場合、セッションルーティングはチャネルの正規受信者と `session.dmScope` に従います。送信専用の安定した受信者 ID を持つチャネルでは、エージェントのメインセッションから分離された、プロバイダー所有のセッションを使用します。`--reply-channel` と `--reply-account` は配信のみに影響します。
- `--session-key` は明示的なセッションキーを選択します。エージェント接頭辞付きのキーは `agent:<agent-id>:<session-key>` を使用する必要があり、両方を指定する場合は `--agent` がキーのエージェント ID と一致する必要があります。センチネルではない接頭辞なしのキーは、`--agent` が指定されていればそのエージェントのスコープになり、指定されていなければ設定済みのデフォルトエージェントのスコープになります。たとえば `--agent ops --session-key incident-42` は `agent:ops:incident-42` にルーティングされます。リテラルキー `global` と `unknown` は、`--agent` が指定されていない場合に限りスコープなしのままです。
- `--json` は標準出力を JSON 応答専用にします。Gateway、Plugin、組み込みフォールバックの診断は標準エラー出力へ送られるため、スクリプトは標準出力を直接解析できます。
- 組み込みフォールバックの JSON には `meta.transport: "embedded"` と `meta.fallbackFrom: "gateway"` が含まれるため、スクリプトでフォールバック実行を検出できます。
- Gateway が実行を受け付けたものの、CLI が最終応答の待機中にタイムアウトした場合、組み込みフォールバックは新しい `gateway-fallback-*` セッション ID／実行 ID を使用し、フォールバックセッションのフィールドとともに `meta.fallbackReason: "gateway_timeout"` を報告します。Gateway が所有するトランスクリプトと競合したり、元のセッションを暗黙に置き換えたりすることはありません。
- `SIGTERM`／`SIGINT` は、待機中の Gateway 経由リクエストを中断します。Gateway がすでに実行を受け付けている場合、CLI は終了前にその実行 ID に対して `chat.abort` も送信します。`--local` と組み込みフォールバックによる実行も同じシグナルを受け取りますが、`chat.abort` は送信しません。内部の実行重複排除キーにより、このセッションですでにアクティブな実行が存在する場合、応答は `status: "in_flight"` を報告し、非 JSON の CLI は空の応答ではなく診断を標準エラー出力に出力します。外部の cron／systemd ラッパーでは、シャットダウン処理を完了できない場合でもスーパーバイザーがプロセスを回収できるよう、`timeout -k 60 600 openclaw agent ...` のような強制終了の予備手段を用意してください。
- このコマンドが `models.json` の再生成を引き起こす場合、SecretRef で管理されるプロバイダー認証情報は、解決済みの秘密情報の平文ではなく、非機密のマーカー（環境変数名、`secretref-env:ENV_VAR_NAME`、`secretref-managed` など）として永続化されます。マーカーの書き込み元は、解決済みのランタイム秘密値ではなく、アクティブなソース設定のスナップショットです。

## JSON 配信ステータス

`--json --deliver` を使用すると、CLI の JSON 応答にトップレベルの `deliveryStatus` が含まれ、スクリプトで配信済み、抑止、一部失敗、失敗を区別できます。

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

Gateway 経由の CLI 応答では、未加工の Gateway 結果の形式も `result.deliveryStatus` に保持されます。

`deliveryStatus.status` は次のいずれかです。

| ステータス       | 意味                                                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | 配信が完了しました。                                                                                                                         |
| `suppressed`     | 配信は意図的に送信されませんでした（たとえば、メッセージ送信フックによってキャンセルされた場合や、表示可能な結果がなかった場合）。終了状態であり、再試行はありません。 |
| `partial_failed` | 後続のペイロードが失敗する前に、少なくとも1つのペイロードが送信されました。                                                                  |
| `failed`         | 永続的な送信が1件も完了しなかったか、配信の事前検証に失敗しました。                                                                           |

共通フィールド:

- `requested`: オブジェクトが存在する場合は常に `true`。
- `attempted`: 永続的な送信パスが実行されると `true`。事前検証の失敗時または表示可能なペイロードがない場合は `false`。
- `succeeded`: `true`、`false`、または `"partial"`。`"partial"` は `status: "partial_failed"` と組み合わせて使用されます。
- `reason`: 永続的な配信または事前検証から得られる、小文字のスネークケース形式の理由。既知の値には `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target`、`no_delivery_target` が含まれます。永続的な送信に失敗した場合は、失敗したステージも報告されることがあります。値の種類は今後増える可能性があるため、未知の値は不透明なものとして扱ってください。
- `resultCount`: 利用可能な場合、チャネル送信結果の数。
- `sentBeforeError`: 部分的な失敗で、エラー発生前に少なくとも1つのペイロードが送信された場合は `true`。
- `error`: 失敗または部分的な失敗となった送信では `true`。
- `errorMessage`: 基礎となる配信エラーメッセージが取得された場合にのみ存在します。事前検証の失敗には `error`／`reason` が含まれますが、`errorMessage` は含まれません。
- `payloadOutcomes`: ペイロードごとの結果を表す任意のフィールド。利用可能な場合、`index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`、またはフックのメタデータを含みます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [エージェントランタイム](/ja-JP/concepts/agent)
