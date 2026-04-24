---
read_when:
    - タイムスタンプをモデルまたはユーザーにどのように表示するかを変更している場合
    - メッセージやシステムプロンプト出力での時刻フォーマットをデバッグしている場合
summary: envelope、プロンプト、ツール、コネクタ全体での日付と時刻の扱い
title: 日付と時刻
x-i18n:
    generated_at: "2026-04-24T04:55:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 15
---

# 日付と時刻

OpenClaw は、**トランスポートタイムスタンプにはホストローカル時刻** を、**システムプロンプトではユーザータイムゾーンのみ** をデフォルトで使います。
プロバイダのタイムスタンプは保持されるため、ツールはネイティブな意味論を維持します（現在時刻は `session_status` で取得できます）。

## メッセージ envelope（デフォルトでローカル）

受信メッセージはタイムスタンプ付きでラップされます（分精度）:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

この envelope タイムスタンプは、プロバイダのタイムゾーンに関係なく、**デフォルトではホストローカル** です。

この動作は上書きできます:

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

- `envelopeTimezone: "utc"` は UTC を使います。
- `envelopeTimezone: "local"` はホストタイムゾーンを使います。
- `envelopeTimezone: "user"` は `agents.defaults.userTimezone` を使います（なければホストタイムゾーンにフォールバック）。
- 固定ゾーンには明示的な IANA タイムゾーン（例: `"America/Chicago"`）を使ってください。
- `envelopeTimestamp: "off"` は envelope ヘッダーから絶対タイムスタンプを削除します。
- `envelopeElapsed: "off"` は経過時間サフィックス（`+2m` のような形式）を削除します。

### 例

**ローカル（デフォルト）:**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**ユーザータイムゾーン:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**経過時間を有効化:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## システムプロンプト: Current Date & Time

ユーザータイムゾーンが分かっている場合、システムプロンプトには専用の
**Current Date & Time** セクションが含まれ、**タイムゾーンのみ**（時刻や時刻フォーマットはなし）を
入れて、プロンプトキャッシュが安定するようにします:

```
Time zone: America/Chicago
```

エージェントが現在時刻を必要とする場合は `session_status` ツールを使ってください。ステータス
カードにはタイムスタンプ行が含まれます。

## システムイベント行（デフォルトでローカル）

エージェントコンテキストに挿入されるキュー済みシステムイベントには、メッセージ envelope と
同じタイムゾーン選択（デフォルト: ホストローカル）を使ったタイムスタンプ接頭辞が付きます。

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### ユーザータイムゾーン + フォーマットの設定

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` は、プロンプトコンテキスト用の **ユーザーローカルタイムゾーン** を設定します。
- `timeFormat` は、プロンプト内の **12 時間 / 24 時間表示** を制御します。`auto` は OS 設定に従います。

## 時刻フォーマット検出（auto）

`timeFormat: "auto"` の場合、OpenClaw は OS 設定（macOS/Windows）を確認し、
ロケールフォーマットにフォールバックします。検出された値は、繰り返しのシステムコールを避けるため
**プロセスごとにキャッシュ** されます。

## ツールペイロード + コネクタ（生のプロバイダ時刻 + 正規化フィールド）

チャネルツールは **プロバイダネイティブのタイムスタンプ** を返し、一貫性のために正規化フィールドも追加します:

- `timestampMs`: epoch ミリ秒（UTC）
- `timestampUtc`: ISO 8601 UTC 文字列

生のプロバイダフィールドは、何も失われないよう保持されます。

- Slack: API 由来の epoch 風文字列
- Discord: UTC ISO タイムスタンプ
- Telegram/WhatsApp: プロバイダ固有の数値/ISO タイムスタンプ

ローカル時刻が必要な場合は、既知のタイムゾーンを使って下流で変換してください。

## 関連ドキュメント

- [System Prompt](/ja-JP/concepts/system-prompt)
- [Timezones](/ja-JP/concepts/timezone)
- [Messages](/ja-JP/concepts/messages)
