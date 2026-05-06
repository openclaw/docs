---
read_when:
    - アウトバウンドチャネル向けの Markdown 書式設定またはチャンク化を変更する場合
    - 新しいチャネルフォーマッターまたはスタイルマッピングを追加する場合
    - 複数のチャネルにわたる書式設定のリグレッションをデバッグしています
summary: 送信チャネル向けの Markdown 整形パイプライン
title: Markdown の書式設定
x-i18n:
    generated_at: "2026-05-06T05:01:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9dcc75cec0462d610f2b5bbd258a2686b15eeb4b9d369ee4d7727571da7edcc
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw は、送信 Markdown をチャンネル固有の出力としてレンダリングする前に、共有の中間表現 (IR) に変換して整形します。IR はソーステキストをそのまま保ちながら、スタイル/リンクのスパンを保持するため、チャンク化とレンダリングをチャンネル間で一貫させられます。

## 目標

- **一貫性:** 1 回の解析ステップで、複数のレンダラーに対応します。
- **安全なチャンク化:** レンダリング前にテキストを分割するため、インライン書式がチャンクをまたいで壊れることはありません。
- **チャンネル適合:** Markdown を再解析せずに、同じ IR を Slack mrkdwn、Telegram HTML、Signal のスタイル範囲にマッピングします。

## パイプライン

1. **Markdown を解析 -> IR**
   - IR はプレーンテキストに、スタイルスパン (bold/italic/strike/code/spoiler) とリンクスパンを加えたものです。
   - オフセットは UTF-16 コード単位なので、Signal のスタイル範囲が API と一致します。
   - テーブルは、チャンネルがテーブル変換を有効にした場合にのみ解析されます。
2. **IR をチャンク化 (format-first)**
   - チャンク化は、レンダリング前の IR テキスト上で行われます。
   - インライン書式はチャンクをまたいで分割されません。スパンはチャンクごとに切り出されます。
3. **チャンネルごとにレンダリング**
   - **Slack:** mrkdwn トークン (bold/italic/strike/code)、リンクは `<url|label>`。
   - **Telegram:** HTML タグ (`<b>`、`<i>`、`<s>`、`<code>`、`<pre><code>`、`<a href>`)。
   - **Signal:** プレーンテキスト + `text-style` 範囲。リンクは、ラベルが異なる場合 `label (url)` になります。

## IR の例

入力 Markdown:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR (概略):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 使用箇所

- Slack、Telegram、Signal の送信アダプターは IR からレンダリングします。
- その他のチャンネル (WhatsApp、iMessage、Microsoft Teams、Discord) は引き続きプレーンテキストまたは独自の書式ルールを使用し、有効な場合はチャンク化の前に Markdown テーブル変換が適用されます。

## テーブル処理

Markdown テーブルは、チャットクライアント間で一貫してサポートされているわけではありません。チャンネルごと (およびアカウントごと) の変換を制御するには `markdown.tables` を使用します。

- `code`: テーブルをコードブロックとしてレンダリングします (ほとんどのチャンネルのデフォルト)。
- `bullets`: 各行を箇条書きに変換します (Signal + WhatsApp のデフォルト)。
- `off`: テーブルの解析と変換を無効にします。未加工のテーブルテキストがそのまま渡されます。

設定キー:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## チャンク化ルール

- チャンク制限はチャンネルアダプター/設定から取得され、IR テキストに適用されます。
- コードフェンスは末尾の改行付きの単一ブロックとして保持されるため、チャンネルは正しくレンダリングできます。
- リスト接頭辞と blockquote 接頭辞は IR テキストの一部であるため、チャンク化で接頭辞の途中が分割されることはありません。
- インラインスタイル (bold/italic/strike/inline-code/spoiler) はチャンクをまたいで分割されません。レンダラーは各チャンク内でスタイルを再度開きます。

チャンネル間のチャンク化動作について詳しくは、[ストリーミング + チャンク化](/ja-JP/concepts/streaming) を参照してください。

## リンクポリシー

- **Slack:** `[label](url)` -> `<url|label>`。ベア URL はベアのままです。二重リンク化を避けるため、解析中の Autolink は無効です。
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML 解析モード)。
- **Signal:** `[label](url)` -> ラベルが URL と一致しない限り `label (url)`。

## スポイラー

スポイラーマーカー (`||spoiler||`) は Signal の場合にのみ解析され、SPOILER スタイル範囲にマッピングされます。他のチャンネルではプレーンテキストとして扱われます。

## チャンネルフォーマッターを追加または更新する方法

1. **一度だけ解析:** チャンネルに適したオプション (autolink、見出しスタイル、blockquote 接頭辞) を指定して、共有の `markdownToIR(...)` ヘルパーを使用します。
2. **レンダリング:** `renderMarkdownWithMarkers(...)` とスタイルマーカーマップ (または Signal のスタイル範囲) を使用してレンダラーを実装します。
3. **チャンク化:** レンダリング前に `chunkMarkdownIR(...)` を呼び出し、各チャンクをレンダリングします。
4. **アダプターの接続:** 新しいチャンク処理とレンダラーを使用するように、チャンネル送信アダプターを更新します。
5. **テスト:** 書式テストを追加または更新し、チャンネルがチャンク化を使用する場合は送信配信テストも追加します。

## よくある落とし穴

- Slack の山括弧トークン (`<@U123>`、`<#C123>`、`<https://...>`) は保持する必要があります。生の HTML は安全にエスケープしてください。
- Telegram HTML では、壊れたマークアップを避けるため、タグ外のテキストをエスケープする必要があります。
- Signal のスタイル範囲は UTF-16 オフセットに依存します。コードポイントオフセットを使用しないでください。
- フェンス付きコードブロックでは末尾の改行を保持し、終了マーカーが独立した行に置かれるようにします。

## 関連

<CardGroup cols={2}>
  <Card title="ストリーミングとチャンク化" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    送信ストリーミングの動作、チャンク境界、チャンネル固有の配信。
  </Card>
  <Card title="システムプロンプト" href="/ja-JP/concepts/system-prompt" icon="message-lines">
    注入されたワークスペースファイルを含め、会話の前にモデルが見る内容。
  </Card>
</CardGroup>
