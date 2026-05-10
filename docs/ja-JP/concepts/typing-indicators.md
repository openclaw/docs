---
read_when:
    - 入力中インジケーターの動作またはデフォルトの変更
summary: OpenClaw が入力中インジケーターを表示するタイミングと、その調整方法
title: 入力中インジケーター
x-i18n:
    generated_at: "2026-05-10T19:32:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

入力中インジケーターは、実行がアクティブな間チャットチャンネルに送信されます。
`agents.defaults.typingMode` で入力中表示が **いつ** 開始するかを制御し、`typingIntervalSeconds`
で **どの頻度で** 更新するかを制御します。

## デフォルト

`agents.defaults.typingMode` が **未設定** の場合、OpenClaw は従来の動作を維持します。

- **ダイレクトチャット**: モデルループが開始するとすぐに入力中表示が始まります。
- **メンション付きのグループチャット**: 入力中表示がすぐに始まります。
- **メンションなしのグループチャット**: メッセージテキストのストリーミングが始まったときにのみ入力中表示が始まります。
- **Heartbeat 実行**: 解決された Heartbeat ターゲットが入力中表示に対応したチャットで、
  入力中表示が無効化されていない場合、Heartbeat 実行の開始時に入力中表示が始まります。

## モード

`agents.defaults.typingMode` を次のいずれかに設定します。

- `never` - 入力中インジケーターを一切表示しません。
- `instant` - 実行が後で無音返信トークンのみを返す場合でも、**モデルループが開始した直後** に入力中表示を始めます。
- `thinking` - **最初の推論デルタ** で入力中表示を始めます（その実行に
  `reasoningLevel: "stream"` が必要です）。
- `message` - **最初の非無音テキストデルタ** で入力中表示を始めます（`NO_REPLY`
  無音トークンは無視します）。

「どれだけ早く発火するか」の順序:
`never` → `message` → `thinking` → `instant`

## 設定

エージェントレベルのデフォルトを設定します。

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

セッションごとにモードまたは間隔を上書きします。

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注記

- `message` モードでは、ペイロード全体が正確な無音トークン（例: `NO_REPLY` / `no_reply`、
  大文字小文字を区別せずに一致）だけである場合、無音のみの返信に対して入力中表示は表示されません。
- `thinking` は、実行が推論をストリーミングする場合（`reasoningLevel: "stream"`）にのみ発火します。
  モデルが推論デルタを発行しない場合、入力中表示は始まりません。
- Heartbeat の入力中表示は、解決された配信ターゲットに対するライブネスシグナルです。
  `message` または `thinking` のストリームタイミングに従うのではなく、Heartbeat 実行の開始時に始まります。
  無効化するには `typingMode: "never"` を設定します。
- Heartbeat は、`target: "none"` の場合、ターゲットを解決できない場合、Heartbeat のチャット配信が無効化されている場合、
  またはチャンネルが入力中表示をサポートしていない場合、入力中表示を表示しません。
- `typingIntervalSeconds` は **更新間隔** を制御し、開始時刻は制御しません。
  デフォルトは 6 秒です。

## 関連

<CardGroup cols={2}>
  <Card title="プレゼンス" href="/ja-JP/concepts/presence" icon="signal">
    Gateway が接続済みクライアントを追跡し、macOS の Instances タブに表示する方法。
  </Card>
  <Card title="ストリーミングとチャンク化" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    送信ストリーミング動作、チャンク境界、チャンネル固有の配信。
  </Card>
</CardGroup>
