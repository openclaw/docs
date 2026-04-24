---
read_when:
    - 入力中インジケーターの動作またはデフォルトを変更しています
summary: OpenClaw が入力中インジケーターを表示するタイミングと、その調整方法
title: 入力中インジケーター
x-i18n:
    generated_at: "2026-04-24T04:55:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 15
---

入力中インジケーターは、実行がアクティブな間にチャットチャンネルへ送信されます。**いつ**入力中を開始するかは
`agents.defaults.typingMode` で制御し、**どれくらいの頻度**で更新するかは `typingIntervalSeconds`
で制御します。

## デフォルト

`agents.defaults.typingMode` が**未設定**の場合、OpenClaw はレガシー動作を維持します。

- **ダイレクトチャット**: モデルループが始まるとすぐに入力中を開始します。
- **メンション付きグループチャット**: すぐに入力中を開始します。
- **メンションなしグループチャット**: メッセージテキストのストリーミングが始まったときにのみ入力中を開始します。
- **Heartbeat 実行**: 解決された Heartbeat ターゲットが入力中に対応したチャットで、かつ入力中が無効化されていない場合、
  Heartbeat 実行開始時に入力中を開始します。

## モード

`agents.defaults.typingMode` には次のいずれかを設定します。

- `never` — 入力中インジケーターを一切送信しません。
- `instant` — 実行が後で無音返信トークンしか返さない場合でも、
  **モデルループ開始と同時に**入力中を開始します。
- `thinking` — **最初の reasoning 差分**で入力中を開始します（実行で
  `reasoningLevel: "stream"` が必要です）。
- `message` — **最初の非無音テキスト差分**で入力中を開始します（
  `NO_REPLY` 無音トークンは無視します）。

「どれだけ早く発火するか」の順序:
`never` → `message` → `thinking` → `instant`

## 設定

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

セッションごとにモードまたは更新間隔を上書きすることもできます。

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意

- `message` モードでは、ペイロード全体が完全一致の無音トークン
  （例: `NO_REPLY` / `no_reply`、大文字小文字を区別せず一致）である場合、
  無音のみの返信に対して入力中は表示されません。
- `thinking` は、実行が reasoning をストリーミングする場合にのみ発火します（`reasoningLevel: "stream"`）。
  モデルが reasoning 差分を発行しない場合、入力中は開始されません。
- Heartbeat の入力中は、解決された配信ターゲットに対する生存シグナルです。
  `message` や `thinking` のストリームタイミングには従わず、Heartbeat 実行開始時に開始します。
  無効化するには `typingMode: "never"` を設定します。
- `target: "none"` の場合、ターゲットを解決できない場合、Heartbeat のチャット配信が無効な場合、
  またはチャンネルが入力中をサポートしていない場合、Heartbeat は入力中を表示しません。
- `typingIntervalSeconds` は**更新間隔**を制御するものであり、開始時刻ではありません。
  デフォルトは 6 秒です。

## 関連

- [Presence](/ja-JP/concepts/presence)
- [ストリーミングとチャンキング](/ja-JP/concepts/streaming)
