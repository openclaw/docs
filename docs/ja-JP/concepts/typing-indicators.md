---
read_when:
    - 入力中インジケーターの動作または既定値の変更
summary: OpenClaw がタイピングインジケーターを表示するタイミングと調整方法
title: 入力中インジケーター
x-i18n:
    generated_at: "2026-05-06T05:03:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

入力中インジケーターは、実行がアクティブな間、チャットチャネルへ送信されます。
`agents.defaults.typingMode` で入力中表示を開始する**タイミング**を制御し、`typingIntervalSeconds`
で更新する**頻度**を制御します。

## デフォルト

`agents.defaults.typingMode` が**未設定**の場合、OpenClaw は従来の動作を維持します。

- **ダイレクトチャット**: モデルループが開始するとすぐに入力中表示が始まります。
- **メンション付きのグループチャット**: 入力中表示がすぐに始まります。
- **メンションなしのグループチャット**: メッセージテキストのストリーミングが始まったときだけ入力中表示が始まります。
- **Heartbeat 実行**: 解決された Heartbeat ターゲットが入力中表示に対応したチャットであり、入力中表示が無効化されていない場合、Heartbeat 実行の開始時に入力中表示が始まります。

## モード

`agents.defaults.typingMode` を次のいずれかに設定します。

- `never` - 入力中インジケーターを一切表示しません。
- `instant` - 実行が後でサイレント返信トークンだけを返す場合でも、**モデルループが開始した直後**に入力中表示を始めます。
- `thinking` - **最初の推論デルタ**で入力中表示を始めます（その実行に `reasoningLevel: "stream"` が必要です）。
- `message` - **最初の非サイレントテキストデルタ**で入力中表示を始めます（`NO_REPLY` サイレントトークンは無視します）。

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

セッションごとにモードや間隔を上書きできます。

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注記

- `message` モードでは、ペイロード全体が正確なサイレントトークン（たとえば `NO_REPLY` / `no_reply`。大文字小文字を区別せずに照合）だけである場合、サイレントのみの返信では入力中表示は表示されません。
- `thinking` は、実行が推論をストリーミングする場合（`reasoningLevel: "stream"`）にのみ発火します。モデルが推論デルタを出力しない場合、入力中表示は始まりません。
- Heartbeat の入力中表示は、解決された配信ターゲットに対するライブネスシグナルです。`message` や `thinking` のストリームタイミングに従うのではなく、Heartbeat 実行の開始時に始まります。無効化するには `typingMode: "never"` を設定します。
- Heartbeat は、`target: "none"` の場合、ターゲットを解決できない場合、Heartbeat のチャット配信が無効化されている場合、またはチャネルが入力中表示をサポートしていない場合、入力中表示を表示しません。
- `typingIntervalSeconds` は**更新間隔**を制御するものであり、開始時刻ではありません。デフォルトは 6 秒です。

## 関連

<CardGroup cols={2}>
  <Card title="Presence" href="/ja-JP/concepts/presence" icon="signal">
    Gateway が接続済みクライアントを追跡し、macOS のインスタンスタブに表示する方法。
  </Card>
  <Card title="Streaming and chunking" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    アウトバウンドストリーミングの動作、チャンク境界、チャネル固有の配信。
  </Card>
</CardGroup>
