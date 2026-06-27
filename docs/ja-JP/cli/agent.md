---
read_when:
    - スクリプトから1回のエージェントターンを実行したい（任意で返信を配信）
summary: '`openclaw agent` の CLI リファレンス（Gateway 経由で 1 回のエージェントターンを送信）'
title: エージェント
x-i18n:
    generated_at: "2026-06-27T10:51:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway 経由でエージェントターンを実行します（埋め込みには `--local` を使用）。
構成済みエージェントを直接対象にするには `--agent <id>` を使用します。

少なくとも 1 つのセッションセレクターを渡します。

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

関連:

- エージェント送信ツール: [エージェント送信](/ja-JP/tools/agent-send)

## オプション

- `-m, --message <text>`: メッセージ本文
- `--message-file <path>`: UTF-8 ファイルからメッセージ本文を読み取る
- `-t, --to <dest>`: セッションキーの導出に使用する受信者
- `--session-key <key>`: ルーティングに使用する明示的なセッションキー
- `--session-id <id>`: 明示的なセッション ID
- `--agent <id>`: エージェント ID。ルーティングバインディングを上書きします
- `--model <id>`: この実行のモデル上書き（`provider/model` またはモデル ID）
- `--thinking <level>`: エージェントの思考レベル（`off`、`minimal`、`low`、`medium`、`high` に加え、`xhigh`、`adaptive`、`max` などプロバイダーが対応するカスタムレベル）
- `--verbose <on|off>`: セッションの詳細出力レベルを永続化する
- `--channel <channel>`: 配信チャネル。メインセッションチャネルを使用する場合は省略します
- `--reply-to <target>`: 配信先の上書き
- `--reply-channel <channel>`: 配信チャネルの上書き
- `--reply-account <id>`: 配信アカウントの上書き
- `--local`: 埋め込みエージェントを直接実行する（Plugin レジストリのプリロード後）
- `--deliver`: 選択したチャネル/対象へ返信を送り返す
- `--timeout <seconds>`: エージェントのタイムアウトを上書きする（デフォルトは 600 または構成値）
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

- `--message` または `--message-file` のどちらか一方だけを渡します。`--message-file` は、任意の UTF-8 BOM を削除した後も複数行のファイル内容を保持し、有効な UTF-8 ではないファイルを拒否します。
- Gateway モードでは、Gateway リクエストが失敗すると埋め込みエージェントにフォールバックします。最初から埋め込み実行を強制するには `--local` を使用します。
- `--local` でも先に Plugin レジストリをプリロードするため、Plugin が提供するプロバイダー、ツール、チャネルは埋め込み実行中も利用できます。
- `--local` と埋め込みフォールバック実行は、ワンショット実行として扱われます。そのローカルプロセス用に開かれたバンドル済み MCP loopback リソースとウォームな Claude stdio セッションは返信後に破棄されるため、スクリプト呼び出しがローカル子プロセスを生存させ続けることはありません。
- Gateway ベースの実行では、Gateway 所有の MCP loopback リソースは実行中の Gateway プロセスの下に残ります。古いクライアントは履歴上のクリーンアップフラグをまだ送信する場合がありますが、Gateway は互換性のための no-op として受け入れます。
- `--channel`、`--reply-channel`、`--reply-account` は返信の配信に影響し、セッションルーティングには影響しません。
- `--session-key` は明示的なセッションキーを選択します。エージェント接頭辞付きキーは `agent:<agent-id>:<session-key>` を使用する必要があり、`--agent` とキーのエージェント ID は、両方が指定された場合に一致している必要があります。裸の非センチネルキーは、指定されている場合は `--agent` に、そうでない場合は構成済みのデフォルトエージェントにスコープされます。たとえば、`--agent ops --session-key incident-42` は `agent:ops:incident-42` にルーティングされます。リテラルの `global` と `unknown` は、`--agent` が指定されていない場合にのみスコープなしのままです。その場合、埋め込みフォールバックとストア所有権は構成済みのデフォルトエージェントを使用します。
- `--json` は stdout を JSON レスポンス専用に保ちます。Gateway、Plugin、埋め込みフォールバックの診断は stderr にルーティングされるため、スクリプトは stdout を直接解析できます。
- 埋め込みフォールバック JSON には `meta.transport: "embedded"` と `meta.fallbackFrom: "gateway"` が含まれるため、スクリプトはフォールバック実行と Gateway 実行を区別できます。
- Gateway がエージェント実行を受け付けたものの、CLI が最終返信を待機中にタイムアウトした場合、埋め込みフォールバックは新しい明示的な `gateway-fallback-*` セッション/実行 ID を使用し、フォールバックセッションフィールドに加えて `meta.fallbackReason: "gateway_timeout"` を報告します。これにより、Gateway 所有のトランスクリプトロックとの競合や、元のルーティング済み会話セッションの暗黙の置き換えを避けます。
- Gateway ベースの実行では、`SIGTERM` と `SIGINT` は待機中の CLI リクエストを中断します。Gateway がすでに実行を受け付けている場合、CLI は終了前に、その受け付け済み実行 ID に対して `chat.abort` も送信します。ローカルの `--local` 実行と埋め込みフォールバック実行は同じ中止シグナルを受け取りますが、`chat.abort` は送信しません。元のエージェント実行がまだアクティブな間に重複した `--run-id` が Gateway に到達した場合、重複レスポンスは `status: "in_flight"` を報告し、非 JSON CLI は空の返信ではなく stderr 診断を出力します。外部の cron/systemd ラッパーでは、シャットダウンを正常に完了できない場合でもスーパーバイザーがプロセスを回収できるように、`timeout -k 60 600 openclaw agent ...` のような外側のハードキルのバックストップを保持してください。
- このコマンドが `models.json` の再生成をトリガーする場合、SecretRef 管理のプロバイダー認証情報は、解決済みシークレット平文ではなく、非シークレットマーカー（たとえば環境変数名、`secretref-env:ENV_VAR_NAME`、または `secretref-managed`）として永続化されます。
- マーカー書き込みはソースを権威とします。OpenClaw は、解決済みランタイムシークレット値ではなく、アクティブなソース構成スナップショットからマーカーを永続化します。

## JSON 配信ステータス

`--json --deliver` を使用すると、CLI の JSON レスポンスにはトップレベルの `deliveryStatus` が含まれる場合があり、スクリプトは配信済み、抑制、部分的、失敗した送信を区別できます。

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

`deliveryStatus.status` は `sent`、`suppressed`、`partial_failed`、`failed` のいずれかです。`suppressed` は、たとえばメッセージ送信フックがキャンセルした、または可視の結果がなかったなどの理由で、配信が意図的に送信されなかったことを意味します。それでもこれは再試行しない終端結果です。`partial_failed` は、後続のペイロードが失敗する前に少なくとも 1 つのペイロードが送信されたことを意味します。`failed` は、永続的な送信が完了しなかったか、配信の事前確認が失敗したことを意味します。

Gateway ベースの CLI レスポンスは、生の Gateway 結果形状も保持します。同じオブジェクトは `result.deliveryStatus` で利用できます。

共通フィールド:

- `requested`: オブジェクトが存在する場合は常に `true`。
- `attempted`: 永続的な送信パスが実行された後は `true`。事前確認失敗または可視ペイロードなしの場合は `false`。
- `succeeded`: `true`、`false`、または `"partial"`。`"partial"` は `status: "partial_failed"` と組み合わせられます。
- `reason`: 永続的な配信または事前確認バリデーションからの小文字のスネークケース理由。既知の理由には `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target`、`no_delivery_target` が含まれます。永続的な送信の失敗では、失敗したステージも報告される場合があります。集合は拡張される可能性があるため、不明な値は不透明なものとして扱ってください。
- `resultCount`: 利用可能な場合のチャネル送信結果数。
- `sentBeforeError`: 部分的な失敗で、エラー前に少なくとも 1 つのペイロードが送信された場合は `true`。
- `error`: 失敗または部分的失敗の送信では boolean `true`。
- `errorMessage`: 基礎となる配信エラーメッセージが捕捉された場合にのみ含まれます。事前確認失敗では `error` と `reason` は含まれますが、`errorMessage` は含まれません。
- `payloadOutcomes`: 利用可能な場合、`index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`、またはフックメタデータを含む、ペイロードごとの任意の結果。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [エージェントランタイム](/ja-JP/concepts/agent)
