---
read_when:
    - モデルまたはユーザーへのタイムスタンプの表示方法を変更しています
    - メッセージまたはシステムプロンプト出力の時刻フォーマットをデバッグしている
summary: エンベロープ、プロンプト、ツール、コネクタ全体での日付と時刻の扱い
title: 日付と時刻
x-i18n:
    generated_at: "2026-07-05T11:17:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw は **transport タイムスタンプにホストローカル時刻**を使用し、システムプロンプトには **タイムゾーンのみ**を入れます。
プロバイダーのタイムスタンプは保持されるため、ツールはネイティブのセマンティクスを維持します。エージェントが現在時刻を必要とする場合は、
`session_status` ツールを実行します。

## メッセージエンベロープ（デフォルトでローカル）

受信メッセージは、曜日と秒精度のタイムスタンプ付きでラップされます。

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] message text
```

エンベロープのタイムスタンプは、プロバイダーのタイムゾーンに関係なく、**デフォルトでホストローカル**です。
`agents.defaults` の下で上書きします。

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

| キー                | 値                                                   | 動作                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local`（デフォルト）、`utc`、`user`、明示的な IANA 名 | `user` は `agents.defaults.userTimezone` を使用します（未設定の場合はホストのタイムゾーン）。明示的な IANA 名（例: `"America/Chicago"`）は固定ゾーンに固定されます。認識されない名前は UTC にフォールバックします。 |
| `envelopeTimestamp` | `on`（デフォルト）、`off`                            | `off` は、エンベロープヘッダー、直接のエージェントプロンプト接頭辞、埋め込みモデル入力接頭辞から絶対タイムスタンプを削除します。                                                |
| `envelopeElapsed`   | `on`（デフォルト）、`off`                            | `off` は、セッション内の前のメッセージ以降に表示される経過時間サフィックス（`+30s` / `+2m` スタイル）を削除します。                                                            |

### 例

**ローカル（デフォルト）:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**ユーザーのタイムゾーン:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**`envelopeTimezone: "utc"` での経過時間:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## システムプロンプト: 現在の日付と時刻

システムプロンプトには、プロンプトキャッシュを安定させるため、**タイムゾーンのみ**を含む
**現在の日付と時刻**セクションが含まれます（時計や時刻形式は含みません）。

```
Time zone: America/Chicago
```

ゾーンは、設定されている場合は `agents.defaults.userTimezone`、それ以外の場合はホストのタイムゾーンです。
プロンプトはまた、現在の日付、時刻、曜日が必要な場合は常に `session_status` ツールを実行するよう
エージェントに指示します。

## システムイベント行（デフォルトでローカル）

エージェントコンテキストに挿入されるキュー済みシステムイベントには、メッセージエンベロープと同じ
`envelopeTimezone` の選択（デフォルト: ホストローカル）を使用したタイムスタンプが接頭辞として付与されます。

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

- `userTimezone` は、プロンプトコンテキスト用（および `envelopeTimezone: "user"` 用）の**ユーザーローカルタイムゾーン**を設定します。
- `timeFormat` は、プロンプトに表示される時刻の **12時間/24時間表示**を制御します。`auto` は OS の設定に従います。

## 時刻形式の検出（auto）

`timeFormat: "auto"` の場合、OpenClaw は OS の設定（macOS と Windows）を検査し、
ロケール形式にフォールバックします。検出された値は、繰り返しのシステムコールを避けるため、
**プロセスごとにキャッシュ**されます。

## ツールペイロード + コネクター（生のプロバイダー時刻 + 正規化フィールド）

チャンネルツールは **プロバイダーネイティブのタイムスタンプ**を返し、一貫性のために正規化フィールドを追加します。

- `timestampMs`: エポックミリ秒（UTC）
- `timestampUtc`: ISO 8601 UTC 文字列

生のプロバイダーフィールドは、何も失われないように保持されます。

- Discord: UTC ISO タイムスタンプ
- Slack: API からのエポック風文字列
- Telegram/WhatsApp: プロバイダー固有の数値/ISO タイムスタンプ

ローカル時刻が必要な場合は、既知のタイムゾーンを使用して下流で変換してください。

## 関連ドキュメント

- [システムプロンプト](/ja-JP/concepts/system-prompt)
- [タイムゾーン](/ja-JP/concepts/timezone)
- [メッセージ](/ja-JP/concepts/messages)
