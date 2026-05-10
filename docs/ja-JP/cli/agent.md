---
read_when:
    - スクリプトからエージェントの1ターンを実行したい（任意で返信を送信する）
summary: '`openclaw agent` の CLI リファレンス（Gateway 経由でエージェントの1ターンを送信）'
title: エージェント
x-i18n:
    generated_at: "2026-05-10T19:26:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Gateway 経由でエージェントターンを実行します（組み込みには `--local` を使用）。
構成済みエージェントを直接対象にするには、`--agent <id>` を使用します。

少なくとも 1 つのセッションセレクターを渡してください。

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

関連:

- エージェント送信ツール: [エージェント送信](/ja-JP/tools/agent-send)

## オプション

- `-m, --message <text>`: 必須のメッセージ本文
- `-t, --to <dest>`: セッションキーの導出に使用する受信者
- `--session-id <id>`: 明示的なセッション ID
- `--agent <id>`: エージェント ID。ルーティングバインディングを上書きします
- `--model <id>`: この実行のモデル上書き（`provider/model` またはモデル ID）
- `--thinking <level>`: エージェントの思考レベル（`off`、`minimal`、`low`、`medium`、`high`、および `xhigh`、`adaptive`、`max` などのプロバイダー対応カスタムレベル）
- `--verbose <on|off>`: セッションの詳細出力レベルを永続化
- `--channel <channel>`: 配信チャンネル。メインセッションチャンネルを使用する場合は省略
- `--reply-to <target>`: 配信先ターゲットの上書き
- `--reply-channel <channel>`: 配信チャンネルの上書き
- `--reply-account <id>`: 配信アカウントの上書き
- `--local`: 組み込みエージェントを直接実行（Plugin レジストリのプリロード後）
- `--deliver`: 選択したチャンネル/ターゲットへ返信を送り返す
- `--timeout <seconds>`: エージェントのタイムアウトを上書き（デフォルトは 600 または構成値）
- `--json`: JSON を出力

## 例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 注記

- Gateway モードでは、Gateway リクエストが失敗した場合に組み込みエージェントへフォールバックします。最初から組み込み実行を強制するには `--local` を使用します。
- `--local` でも最初に Plugin レジストリをプリロードするため、Plugin が提供するプロバイダー、ツール、チャンネルは組み込み実行中も利用できます。
- `--local` と組み込みフォールバック実行は、ワンショット実行として扱われます。そのローカルプロセス用に開かれたバンドル済み MCP ループバックリソースとウォームな Claude stdio セッションは返信後に破棄されるため、スクリプト化された呼び出しでローカル子プロセスが生き続けることはありません。
- Gateway バック実行では、Gateway 所有の MCP ループバックリソースは実行中の Gateway プロセス配下に残ります。古いクライアントは過去のクリーンアップフラグを送信する場合がありますが、Gateway は互換性のための no-op として受け入れます。
- `--channel`、`--reply-channel`、`--reply-account` は返信配信に影響し、セッションルーティングには影響しません。
- `--json` は stdout を JSON レスポンス専用に保ちます。Gateway、Plugin、組み込みフォールバックの診断情報は stderr に送られるため、スクリプトは stdout を直接解析できます。
- 組み込みフォールバックの JSON には `meta.transport: "embedded"` と `meta.fallbackFrom: "gateway"` が含まれるため、スクリプトはフォールバック実行と Gateway 実行を区別できます。
- Gateway がエージェント実行を受け入れたものの、CLI が最終返信を待機中にタイムアウトした場合、組み込みフォールバックは新しい明示的な `gateway-fallback-*` セッション/実行 ID を使用し、`meta.fallbackReason: "gateway_timeout"` とフォールバックセッションフィールドを報告します。これにより、Gateway 所有のトランスクリプトロックとの競合や、元のルーティング済み会話セッションの暗黙的な置き換えを避けます。
- このコマンドが `models.json` の再生成をトリガーする場合、SecretRef 管理のプロバイダー認証情報は解決済みのシークレット平文ではなく、非シークレットマーカー（たとえば環境変数名、`secretref-env:ENV_VAR_NAME`、`secretref-managed`）として永続化されます。
- マーカー書き込みではソースが権威を持ちます。OpenClaw は解決済みランタイムシークレット値ではなく、アクティブなソース構成スナップショットからマーカーを永続化します。

## JSON 配信ステータス

`--json --deliver` を使用すると、CLI JSON レスポンスにトップレベルの `deliveryStatus` が含まれる場合があり、スクリプトは配信済み、抑制済み、部分的、失敗の送信を区別できます。

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

`deliveryStatus.status` は `sent`、`suppressed`、`partial_failed`、`failed` のいずれかです。`suppressed` は、たとえばメッセージ送信フックがキャンセルした、または表示可能な結果がなかったなど、配信が意図的に送信されなかったことを意味します。それでも再試行しない終端結果です。`partial_failed` は、後続のペイロードが失敗する前に少なくとも 1 つのペイロードが送信されたことを意味します。`failed` は、永続的な送信が完了していない、または配信プリフライトが失敗したことを意味します。

Gateway バック CLI レスポンスでは、生の Gateway 結果形状も保持され、同じオブジェクトを `result.deliveryStatus` で利用できます。

共通フィールド:

- `requested`: オブジェクトが存在する場合は常に `true`。
- `attempted`: 永続的な送信パスが実行された後は `true`。プリフライト失敗または表示可能なペイロードがない場合は `false`。
- `succeeded`: `true`、`false`、または `"partial"`。`"partial"` は `status: "partial_failed"` と組み合わせて使用されます。
- `reason`: 永続的な配信またはプリフライト検証からの小文字の snake-case 理由。既知の理由には `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target`、`no_delivery_target` が含まれます。失敗した永続的送信では、失敗したステージも報告される場合があります。値の集合は拡張される可能性があるため、未知の値は不透明なものとして扱ってください。
- `resultCount`: 利用可能な場合のチャンネル送信結果数。
- `sentBeforeError`: 部分的な失敗で、エラー前に少なくとも 1 つのペイロードが送信された場合は `true`。
- `error`: 失敗または部分的に失敗した送信ではブール値 `true`。
- `errorMessage`: 基礎となる配信エラーメッセージが取得された場合のみ含まれます。プリフライト失敗では `error` と `reason` を持ちますが、`errorMessage` はありません。
- `payloadOutcomes`: 利用可能な場合、`index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`、またはフックメタデータを含む、任意のペイロード別結果。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [エージェントランタイム](/ja-JP/concepts/agent)
