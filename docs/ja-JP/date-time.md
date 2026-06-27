---
read_when:
    - モデルまたはユーザーにタイムスタンプを表示する方法を変更している
    - メッセージまたはシステムプロンプト出力での時刻フォーマットをデバッグしている
summary: エンベロープ、プロンプト、ツール、コネクター全体での日付と時刻の扱い
title: 日付と時刻
x-i18n:
    generated_at: "2026-06-27T11:20:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw はデフォルトで、**トランスポートのタイムスタンプにはホストのローカル時刻**を使い、**システムプロンプト内でのみユーザーのタイムゾーン**を使います。
Provider のタイムスタンプは保持されるため、ツールはネイティブのセマンティクスを維持できます（現在時刻は `session_status` で利用できます）。

## メッセージエンベロープ（デフォルトはローカル）

受信メッセージはタイムスタンプ（秒精度）でラップされます。

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

このエンベロープのタイムスタンプは、Provider のタイムゾーンに関係なく、**デフォルトでホストのローカル**です。

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

- `envelopeTimezone: "utc"` は UTC を使います。
- `envelopeTimezone: "local"` はホストのタイムゾーンを使います。
- `envelopeTimezone: "user"` は `agents.defaults.userTimezone` を使います（ホストのタイムゾーンへフォールバックします）。
- 固定ゾーンには明示的な IANA タイムゾーン（例: `"America/Chicago"`）を使います。
- `envelopeTimestamp: "off"` は、エンベロープヘッダー、直接のエージェントプロンプトプレフィックス、埋め込みモデル入力プレフィックスから絶対タイムスタンプを削除します。
- `envelopeElapsed: "off"` は経過時間サフィックス（`+2m` 形式）を削除します。

### 例

**ローカル（デフォルト）:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**ユーザーのタイムゾーン:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**経過時間が有効:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## システムプロンプト: 現在の日付と時刻

ユーザーのタイムゾーンが既知の場合、システムプロンプトには、プロンプトキャッシュを安定させるために、**タイムゾーンのみ**（時計/時刻形式なし）を含む専用の
**現在の日付と時刻**セクションが含まれます。

```
Time zone: America/Chicago
```

エージェントが現在時刻を必要とする場合は、`session_status` ツールを使います。ステータスカードにはタイムスタンプ行が含まれます。

## システムイベント行（デフォルトはローカル）

エージェントコンテキストに挿入されるキュー済みシステムイベントには、メッセージエンベロープと同じタイムゾーン選択（デフォルト: ホストのローカル）を使ったタイムスタンプがプレフィックスとして付けられます。

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

- `userTimezone` は、プロンプトコンテキスト用の**ユーザーローカルのタイムゾーン**を設定します。
- `timeFormat` は、プロンプト内の**12時間/24時間表示**を制御します。`auto` は OS 設定に従います。

## 時刻形式の検出（auto）

`timeFormat: "auto"` の場合、OpenClaw は OS 設定（macOS/Windows）を確認し、ロケール形式へフォールバックします。検出された値は、繰り返しのシステムコールを避けるために**プロセスごとにキャッシュ**されます。

## ツールペイロードとコネクター（Provider の生時刻 + 正規化フィールド）

チャネルツールは**Provider ネイティブのタイムスタンプ**を返し、一貫性のために正規化フィールドを追加します。

- `timestampMs`: エポックミリ秒（UTC）
- `timestampUtc`: ISO 8601 UTC 文字列

Provider の生フィールドは、何も失われないように保持されます。

- Slack: API からのエポック風文字列
- Discord: UTC ISO タイムスタンプ
- Telegram/WhatsApp: Provider 固有の数値/ISO タイムスタンプ

ローカル時刻が必要な場合は、既知のタイムゾーンを使って下流で変換します。

## 関連ドキュメント

- [システムプロンプト](/ja-JP/concepts/system-prompt)
- [タイムゾーン](/ja-JP/concepts/timezone)
- [メッセージ](/ja-JP/concepts/messages)
