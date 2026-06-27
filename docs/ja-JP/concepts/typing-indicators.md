---
read_when:
    - 入力中インジケーターの動作またはデフォルトを変更する
summary: OpenClaw が入力中インジケーターを表示するタイミングと、その調整方法
title: 入力中インジケーター
x-i18n:
    generated_at: "2026-06-27T11:19:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

入力中インジケーターは、実行がアクティブな間にチャットチャネルへ送信されます。
`agents.defaults.typingMode` を使用して入力中が**いつ**始まるかを制御し、`typingIntervalSeconds`
で**どの頻度で**更新されるかを制御します。

## デフォルト

`agents.defaults.typingMode` が**未設定**の場合、OpenClaw は従来の動作を維持します。

- **ダイレクトチャット**: モデルループが開始するとすぐに入力中が始まります。
- **メンションありのグループチャット**: 入力中がすぐに始まります。
- **メンションなしのグループチャット**: 許可された実行に、ハーネス実行アクティビティやメッセージテキストなど、
  ユーザーに見えるアクティビティがあると入力中が始まります。
- **Heartbeat 実行**: 解決された Heartbeat ターゲットが入力中に対応したチャットで、
  入力中が無効化されていない場合、Heartbeat 実行の開始時に入力中が始まります。

## モード

`agents.defaults.typingMode` を次のいずれかに設定します。

- `never` - 入力中インジケーターを一切表示しません。
- `instant` - 実行が後でサイレント返信トークンだけを返す場合でも、
  **モデルループが開始するとすぐに**入力中を開始します。
- `thinking` - ターンが受け付けられた後、**最初の推論デルタ**またはアクティブな
  ハーネス実行で入力中を開始します。
- `message` - アクティブなハーネス実行やサイレントではないテキストデルタなど、
  **最初のユーザーに見える返信アクティビティ**で入力中を開始します。
  `NO_REPLY` などのサイレント返信トークンは、テキストアクティビティとして扱われません。

「どれだけ早く発火するか」の順序:
`never` → `message`/`thinking` → `instant`

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

- `message` モードはサイレント返信トークンからは開始しませんが、アクティブな実行により、
  アシスタントのテキストが利用可能になる前でも入力中を表示できます。
- `thinking` はストリーミングされた推論 (`reasoningLevel: "stream"`) に引き続き反応し、
  推論デルタが届く前にアクティブな実行から開始することもできます。
- Heartbeat の入力中表示は、解決された配信ターゲットに対する生存シグナルです。
  `message` または `thinking` のストリームタイミングに従うのではなく、
  Heartbeat 実行の開始時に始まります。無効化するには `typingMode: "never"` を設定します。
- Heartbeat は、`target: "none"` の場合、ターゲットを解決できない場合、
  Heartbeat のチャット配信が無効化されている場合、またはチャネルが入力中をサポートしていない場合、
  入力中を表示しません。
- `typingIntervalSeconds` は**更新間隔**を制御し、開始時刻は制御しません。
  デフォルトは 6 秒です。

## 関連

<CardGroup cols={2}>
  <Card title="Presence" href="/ja-JP/concepts/presence" icon="signal">
    Gateway が接続済みクライアントを追跡し、それらを macOS Instances タブに表示する方法。
  </Card>
  <Card title="Streaming and chunking" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    送信ストリーミングの動作、チャンク境界、チャネル固有の配信。
  </Card>
</CardGroup>
