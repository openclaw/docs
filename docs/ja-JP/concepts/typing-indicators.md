---
read_when:
    - 入力インジケーターの動作またはデフォルトの変更
summary: OpenClaw が入力中インジケーターを表示するタイミングと、その調整方法
title: 入力インジケーター
x-i18n:
    generated_at: "2026-07-05T11:22:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1be9429a6a5be0dd754e6a088f3afe3681def05be68db3e62c3a2a3ac4b4463
    source_path: concepts/typing-indicators.md
    workflow: 16
---

実行がアクティブな間、入力中インジケーターがチャットチャネルに送信されます。`agents.defaults.typingMode` を使用して入力開始の**タイミング**を制御し、`typingIntervalSeconds` を使用して更新**頻度**を制御します（キープアライブ間隔、デフォルトは 6 秒）。

## デフォルト

`agents.defaults.typingMode` が**未設定**の場合:

- **ダイレクトチャット**: モデルループが開始するとすぐに入力が開始されます。
- **メンションありのグループチャット**: 入力がすぐに開始されます。
- **メンションなしのグループチャット**: 許可された実行に、ハーネス実行アクティビティやメッセージテキストなど、ユーザーに表示されるアクティビティがあると入力が開始されます。
- **Heartbeat 実行**: 解決された Heartbeat ターゲットが入力対応のチャットで、入力が無効化されていない場合、Heartbeat 実行の開始時に入力が開始されます。

## モード

`agents.defaults.typingMode` を次のいずれかに設定します:

- `never` - 入力インジケーターを一切表示しません。
- `instant` - 実行が後でサイレント応答トークンのみを返す場合でも、**モデルループが開始した直後**に入力を開始します。
- `thinking` - **最初の推論デルタ**、またはターンが受理された後のアクティブなハーネス実行で入力を開始します。
- `message` - アクティブなハーネス実行や非サイレントのテキストデルタなど、**ユーザーに表示される最初の応答アクティビティ**で入力を開始します。`NO_REPLY` などのサイレント応答トークンはテキストアクティビティとしてカウントされません。

「どれだけ早く発火するか」の順序: `never` -> `message`/`thinking` -> `instant`。

## 設定

エージェントレベルのデフォルトを設定します:

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

セッションごとにモードまたは間隔を上書きします:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注記

- `message` モードはサイレント応答トークンから開始しませんが、アクティブな実行により、アシスタントのテキストが利用可能になる前に入力が表示される場合があります。
- `thinking` はストリーミングされる推論（`reasoningLevel: "stream"`）にも反応し、推論デルタが到着する前にアクティブな実行から開始することもできます。
- Heartbeat 入力は、解決された配信ターゲットの生存シグナルです。`message` または `thinking` のストリームタイミングに従うのではなく、Heartbeat 実行の開始時に開始されます。無効化するには `typingMode: "never"` を設定します。
- Heartbeat ターゲットが `"none"` の場合、ターゲットを解決できない場合、Heartbeat のチャット配信が無効な場合、またはチャネルが入力に対応していない場合、Heartbeat は入力を表示しません。
- `typingIntervalSeconds` は開始時刻ではなく、**更新間隔**を制御します。デフォルト: 6 秒。

## 関連

<CardGroup cols={2}>
  <Card title="Presence" href="/ja-JP/concepts/presence" icon="signal">
    Gateway が接続済みクライアントを追跡し、macOS の Instances タブに表示する方法。
  </Card>
  <Card title="Streaming and chunking" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    アウトバウンドストリーミングの動作、チャンク境界、チャネル固有の配信。
  </Card>
</CardGroup>
