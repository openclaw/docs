---
read_when:
    - モデル向けにタイムスタンプがどのように正規化されるかを理解する必要がある
    - システムプロンプト用のユーザータイムゾーンを設定する
summary: エージェント、エンベロープ、プロンプトにおけるタイムゾーン処理
title: タイムゾーン
x-i18n:
    generated_at: "2026-04-24T04:55:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 15
---

OpenClawはタイムスタンプを標準化し、モデルが**単一の基準時刻**を見るようにします。

## メッセージエンベロープ（デフォルトではlocal）

受信メッセージは、次のようなエンベロープでラップされます:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

エンベロープ内のタイムスタンプは、デフォルトでは**ホストのlocal time**で、精度は分単位です。

これは次で上書きできます:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` はUTCを使います。
- `envelopeTimezone: "user"` は `agents.defaults.userTimezone` を使います（ホストのタイムゾーンにフォールバック）。
- 固定オフセットには、明示的なIANAタイムゾーン（例: `"Europe/Vienna"`）を使います。
- `envelopeTimestamp: "off"` は、エンベロープヘッダーから絶対タイムスタンプを削除します。
- `envelopeElapsed: "off"` は、経過時間サフィックス（`+2m` のような形式）を削除します。

### 例

**local（デフォルト）:**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**固定タイムゾーン:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**経過時間:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## ツールペイロード（生のプロバイダデータ + 正規化フィールド）

ツール呼び出し（`channels.discord.readMessages`、`channels.slack.readMessages` など）は**生のプロバイダタイムスタンプ**を返します。
一貫性のため、正規化フィールドも追加します:

- `timestampMs`（UTC epoch milliseconds）
- `timestampUtc`（ISO 8601 UTC文字列）

生のプロバイダフィールドは保持されます。

## システムプロンプト用のユーザータイムゾーン

`agents.defaults.userTimezone` を設定すると、ユーザーのローカルタイムゾーンをモデルに伝えられます。未設定の場合、OpenClawは**ホストタイムゾーンを実行時に解決**します（設定への書き込みは行いません）。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

システムプロンプトには次が含まれます:

- local timeとタイムゾーンを含む `Current Date & Time` セクション
- `Time format: 12-hour` または `24-hour`

プロンプト形式は `agents.defaults.timeFormat`（`auto` | `12` | `24`）で制御できます。

完全な動作と例については [Date & Time](/ja-JP/date-time) を参照してください。

## 関連

- [Heartbeat](/ja-JP/gateway/heartbeat) — active hours はスケジューリングにタイムゾーンを使います
- [Cron Jobs](/ja-JP/automation/cron-jobs) — cron式はスケジューリングにタイムゾーンを使います
- [Date & Time](/ja-JP/date-time) — 日付/時刻の完全な動作と例
