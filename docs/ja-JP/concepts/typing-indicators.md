---
read_when:
    - 入力中インジケーターの動作またはデフォルトの変更
summary: OpenClaw が入力中インジケーターを表示するタイミングと、その調整方法
title: 入力中インジケーター
x-i18n:
    generated_at: "2026-07-12T14:31:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

実行中は、チャットチャンネルに入力中インジケーターが送信されます。入力中表示を**いつ**開始するかは `agents.defaults.typingMode` で、**どの頻度で**更新するかは `typingIntervalSeconds` で制御します（キープアライブ間隔、デフォルトは 6 秒）。

## デフォルト

`agents.defaults.typingMode` が**未設定**の場合：

- **ダイレクトチャット**：モデルループが開始すると、すぐに入力中表示を開始します。
- **メンションのあるグループチャット**：すぐに入力中表示を開始します。
- **メンションのないグループチャット**：受け付けられた実行で、ハーネスの実行アクティビティやメッセージテキストなど、ユーザーに表示されるアクティビティが発生すると、入力中表示を開始します。
- **Heartbeat 実行**：解決された Heartbeat の送信先が入力中表示に対応するチャットであり、入力中表示が無効になっていない場合、Heartbeat 実行の開始時に入力中表示を開始します。

## モード

`agents.defaults.typingMode` を次のいずれかに設定します：

- `never` - 入力中インジケーターを一切表示しません。
- `instant` - 実行が後で無応答トークンのみを返す場合でも、**モデルループが開始するとすぐに**入力中表示を開始します。
- `thinking` - **最初の推論差分**が発生した時点、またはターンが受け付けられた後にハーネスの実行がアクティブになった時点で、入力中表示を開始します。
- `message` - ハーネスのアクティブな実行や、無応答ではないテキスト差分など、**ユーザーに表示される最初の返信アクティビティ**が発生した時点で入力中表示を開始します。`NO_REPLY` などの無応答トークンは、テキストアクティビティとして扱われません。

「どれだけ早く作動するか」の順序：`never` -> `message`/`thinking` -> `instant`。

## 設定

エージェントレベルのデフォルトを設定します：

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

セッションごとにモードまたは更新間隔を上書きします：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意事項

- `message` モードは無応答トークンでは開始されませんが、アクティブな実行により、アシスタントのテキストが利用可能になる前でも入力中表示が示される場合があります。
- `thinking` はストリーミングされる推論（`reasoningLevel: "stream"`）にも反応し、推論差分が到着する前にアクティブな実行から開始することもあります。
- Heartbeat の入力中表示は、解決された送信先に対する稼働中シグナルです。`message` または `thinking` のストリームタイミングに従うのではなく、Heartbeat 実行の開始時に始まります。無効にするには `typingMode: "never"` を設定します。
- Heartbeat の送信先が `"none"` の場合、送信先を解決できない場合、Heartbeat のチャット配信が無効になっている場合、またはチャンネルが入力中表示をサポートしていない場合、Heartbeat は入力中表示を示しません。
- `typingIntervalSeconds` は開始時刻ではなく、**更新間隔**を制御します。デフォルト：6 秒。

## 関連項目

<CardGroup cols={2}>
  <Card title="プレゼンス" href="/ja-JP/concepts/presence" icon="signal">
    Gateway が Control UI の Devices ページと macOS の Instances タブ向けに、接続中のクライアントを追跡する仕組み。
  </Card>
  <Card title="ストリーミングとチャンク分割" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    送信ストリーミングの動作、チャンク境界、チャンネル固有の配信。
  </Card>
</CardGroup>
