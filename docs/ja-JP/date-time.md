---
read_when:
    - モデルまたはユーザーにタイムスタンプが表示される方法を変更している
    - メッセージまたはシステムプロンプト出力の時刻フォーマットをデバッグしている
summary: エンベロープ、プロンプト、ツール、コネクター全体における日時の処理
title: 日付と時刻
x-i18n:
    generated_at: "2026-05-06T05:03:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw は既定で、**トランスポートタイムスタンプにホストローカル時刻**を使用し、**system prompt 内でのみユーザーのタイムゾーン**を使用します。
Provider のタイムスタンプは保持されるため、tools はネイティブなセマンティクスを維持します（現在時刻は `session_status` で利用できます）。

## メッセージエンベロープ（既定ではローカル）

受信メッセージはタイムスタンプ（分単位の精度）でラップされます。

```
[Provider ... 2026-01-05 16:26 PST] message text
```

このエンベロープのタイムスタンプは、Provider のタイムゾーンに関係なく、**既定ではホストローカル**です。

この動作は上書きできます。

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

- `envelopeTimezone: "utc"` は UTC を使用します。
- `envelopeTimezone: "local"` はホストのタイムゾーンを使用します。
- `envelopeTimezone: "user"` は `agents.defaults.userTimezone` を使用します（ホストのタイムゾーンにフォールバックします）。
- 固定ゾーンには明示的な IANA タイムゾーン（例: `"America/Chicago"`）を使用します。
- `envelopeTimestamp: "off"` はエンベロープヘッダーから絶対タイムスタンプを削除します。
- `envelopeElapsed: "off"` は経過時間のサフィックス（`+2m` 形式）を削除します。

### 例

**ローカル（既定）:**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**ユーザーのタイムゾーン:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**経過時間が有効:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## System prompt: 現在の日付と時刻

ユーザーのタイムゾーンが既知の場合、system prompt には専用の
**現在の日付と時刻**セクションが含まれ、prompt caching を安定させるために**タイムゾーンのみ**（時計/時刻形式なし）が含まれます。

```
Time zone: America/Chicago
```

agent が現在時刻を必要とする場合は、`session_status` tool を使用します。ステータス
カードにはタイムスタンプ行が含まれます。

## システムイベント行（既定ではローカル）

agent context に挿入されるキュー済みシステムイベントには、メッセージエンベロープと同じタイムゾーン選択（既定: ホストローカル）を使用したタイムスタンプがプレフィックスとして付けられます。

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### ユーザーのタイムゾーンと形式を設定する

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

- `userTimezone` は prompt context 用の**ユーザーローカルのタイムゾーン**を設定します。
- `timeFormat` は prompt 内の**12 時間/24 時間表示**を制御します。`auto` は OS 設定に従います。

## 時刻形式の検出（auto）

`timeFormat: "auto"` の場合、OpenClaw は OS 設定（macOS/Windows）を検査し、ロケール形式にフォールバックします。検出された値は、システムコールの繰り返しを避けるため、**プロセスごとにキャッシュ**されます。

## Tool ペイロード + コネクタ（生の Provider 時刻 + 正規化フィールド）

Channel tools は**Provider ネイティブのタイムスタンプ**を返し、一貫性のために正規化フィールドを追加します。

- `timestampMs`: エポックミリ秒（UTC）
- `timestampUtc`: ISO 8601 UTC 文字列

生の Provider フィールドは保持されるため、何も失われません。

- Slack: API からのエポック風の文字列
- Discord: UTC ISO タイムスタンプ
- Telegram/WhatsApp: Provider 固有の数値/ISO タイムスタンプ

ローカル時刻が必要な場合は、既知のタイムゾーンを使用して下流で変換してください。

## 関連ドキュメント

- [System Prompt](/ja-JP/concepts/system-prompt)
- [タイムゾーン](/ja-JP/concepts/timezone)
- [メッセージ](/ja-JP/concepts/messages)
