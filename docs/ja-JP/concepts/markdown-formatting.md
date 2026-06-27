---
read_when:
    - 送信チャネル向けの Markdown 書式設定またはチャンク分割を変更している
    - 新しいチャネルフォーマッターまたはスタイルマッピングを追加している場合
    - チャネル全体でフォーマットのリグレッションをデバッグしています
summary: 送信チャネル向けの Markdown フォーマット処理パイプライン
title: Markdown の書式設定
x-i18n:
    generated_at: "2026-05-12T12:51:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92aaf1063ebcbd8630dfcb8ca0a4e9eeb1c64f5b8868bf11c836777180515
    source_path: concepts/markdown-formatting.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw は、送信 Markdown をチャネル固有の出力としてレンダリングする前に、共有の中間表現 (IR) へ変換して整形します。IR は元のテキストをそのまま保ちながら、スタイル/リンクのスパンを保持するため、チャンク分割とレンダリングをチャネル間で一貫させられます。

## 目標

- **一貫性:** 1 回の解析ステップで、複数のレンダラーに対応。
- **安全なチャンク分割:** レンダリング前にテキストを分割するため、インライン書式がチャンクをまたいで壊れません。
- **チャネルへの適合:** Markdown を再解析せずに、同じ IR を Slack mrkdwn、Telegram HTML、Signal スタイル範囲へマッピングします。

## パイプライン

1. **Markdown を解析 -> IR**
   - IR はプレーンテキストに、スタイルスパン (bold/italic/strike/code/spoiler) とリンクスパンを加えたものです。
   - オフセットは UTF-16 コード単位なので、Signal スタイル範囲はその API と一致します。
   - テーブルは、チャネルがテーブル変換を有効にした場合にのみ解析されます。
2. **IR をチャンク分割 (書式優先)**
   - チャンク分割は、レンダリング前に IR テキスト上で行われます。
   - インライン書式はチャンクをまたいで分割されません。スパンはチャンクごとに切り出されます。
3. **チャネルごとにレンダリング**
   - **Slack:** mrkdwn トークン (bold/italic/strike/code)、リンクは `<url|label>`。
   - **Telegram:** HTML タグ (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`)。
   - **Signal:** プレーンテキスト + `text-style` 範囲。ラベルが異なる場合、リンクは `label (url)` になります。

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
- その他のチャネル (WhatsApp、iMessage、Microsoft Teams、Discord) は、引き続きプレーンテキストまたは独自の書式ルールを使い、有効な場合はチャンク分割前に Markdown テーブル変換を適用します。

## テーブル処理

Markdown テーブルはチャットクライアント間で一貫してサポートされているわけではありません。チャネルごと (およびアカウントごと) の変換を制御するには `markdown.tables` を使います。

- `code`: テーブルをコードブロックとしてレンダリングします (ほとんどのチャネルのデフォルト)。
- `bullets`: 各行を箇条書きに変換します (Matrix、Signal、WhatsApp のデフォルト)。
- `off`: テーブルの解析と変換を無効化します。生のテーブルテキストがそのまま渡されます。

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

## チャンク分割ルール

- チャンク制限はチャネルアダプター/設定から取得され、IR テキストに適用されます。
- コードフェンスは、チャネルが正しくレンダリングできるように、末尾の改行を含む単一のブロックとして保持されます。
- リスト接頭辞と blockquote 接頭辞は IR テキストの一部なので、チャンク分割で接頭辞の途中が分断されません。
- インラインスタイル (bold/italic/strike/inline-code/spoiler) はチャンク間で分割されません。レンダラーは各チャンク内でスタイルを再度開きます。

チャネル間のチャンク分割動作について詳しくは、[ストリーミング + チャンク分割](/ja-JP/concepts/streaming) を参照してください。

## リンクポリシー

- **Slack:** `[label](url)` -> `<url|label>`。ベア URL はベアのままです。二重リンク化を避けるため、解析中の autolink は無効化されます。
- **Telegram:** `[label](url)` -> `<a href="url">label</a>` (HTML 解析モード)。
- **Signal:** `[label](url)` -> ラベルが URL と一致しない限り `label (url)`。

## スポイラー

スポイラーマーカー (`||spoiler||`) は Signal の場合にのみ解析され、SPOILER スタイル範囲へマッピングされます。その他のチャネルではプレーンテキストとして扱われます。

## チャネルフォーマッターを追加または更新する方法

1. **1 回だけ解析:** チャネルに適したオプション (autolink、見出しスタイル、blockquote 接頭辞) とともに、共有の `markdownToIR(...)` ヘルパーを使います。
2. **レンダリング:** `renderMarkdownWithMarkers(...)` とスタイルマーカーマップ (または Signal スタイル範囲) を使ってレンダラーを実装します。
3. **チャンク分割:** レンダリング前に `chunkMarkdownIR(...)` を呼び出し、各チャンクをレンダリングします。
4. **アダプター接続:** 新しいチャンク分割器とレンダラーを使うように、チャネル送信アダプターを更新します。
5. **テスト:** 書式テストを追加または更新し、チャネルがチャンク分割を使う場合は送信配信テストも追加します。

## よくある落とし穴

- Slack の山括弧トークン (`<@U123>`, `<#C123>`, `<https://...>`) は保持する必要があります。生の HTML は安全にエスケープしてください。
- Telegram HTML では、壊れたマークアップを避けるため、タグ外のテキストをエスケープする必要があります。
- Signal スタイル範囲は UTF-16 オフセットに依存します。コードポイントオフセットは使わないでください。
- フェンス付きコードブロックでは、閉じマーカーが独立した行に配置されるように、末尾の改行を保持してください。

## 関連

<CardGroup cols={2}>
  <Card title="ストリーミングとチャンク分割" href="/ja-JP/concepts/streaming" icon="bars-staggered">
    送信ストリーミング動作、チャンク境界、チャネル固有の配信。
  </Card>
  <Card title="システムプロンプト" href="/ja-JP/concepts/system-prompt" icon="message-lines">
    注入されたワークスペースファイルを含め、会話の前にモデルが見る内容。
  </Card>
</CardGroup>
