---
read_when:
    - 送信チャンネル向けの Markdown フォーマットまたはチャンク化を変更しています
    - 新しいチャンネルフォーマッターまたはスタイルマッピングを追加しています
    - チャンネル間のフォーマット回帰をデバッグしています
summary: 送信チャンネル向け Markdown フォーマットパイプライン
title: Markdown フォーマット
x-i18n:
    generated_at: "2026-04-24T04:53:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf052e11fe9fd075a4337ffa555391c7003a346240b57bb65054c3f08401dfd9
    source_path: concepts/markdown-formatting.md
    workflow: 15
---

OpenClaw は、送信 Markdown をチャンネル固有の出力としてレンダリングする前に、共有の中間
表現（IR）へ変換してフォーマットします。IR は、ソーステキストをそのまま保ちながら、スタイル/リンク span を保持するため、
チャンキングとレンダリングをチャンネル間で一貫させられます。

## 目標

- **一貫性:** 1 回の parse ステップで複数の renderer を使う。
- **安全なチャンキング:** レンダリング前にテキストを分割し、インラインフォーマットが
  チャンクをまたいで壊れないようにする。
- **チャンネル適合:** 同じ IR を再度 Markdown 解析せずに、Slack mrkdwn、Telegram HTML、Signal
  の style range にマップする。

## パイプライン

1. **Markdown を IR に parse**
   - IR はプレーンテキストに加えて、style span（bold/italic/strike/code/spoiler）と link span を持ちます。
   - オフセットは UTF-16 code unit なので、Signal の style range はその API と整合します。
   - テーブルは、チャンネルがテーブル変換にオプトインした場合にのみ parse されます。
2. **IR をチャンキング（format-first）**
   - チャンキングはレンダリング前に IR テキスト上で行われます。
   - インラインフォーマットはチャンクをまたいで分割されず、span はチャンクごとにスライスされます。
3. **チャンネルごとにレンダリング**
   - **Slack:** mrkdwn トークン（bold/italic/strike/code）、リンクは `<url|label>`。
   - **Telegram:** HTML タグ（`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`）。
   - **Signal:** プレーンテキスト + `text-style` range。label が異なる場合、リンクは `label (url)` になります。

## IR の例

入力 Markdown:

```markdown
Hello **world** — see [docs](https://docs.openclaw.ai).
```

IR（概略）:

```json
{
  "text": "Hello world — see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 使用箇所

- Slack、Telegram、Signal の送信アダプターは IR からレンダリングします。
- その他のチャンネル（WhatsApp、iMessage、Microsoft Teams、Discord）は、引き続きプレーンテキストまたは
  独自のフォーマットルールを使用し、Markdown テーブル変換は、有効な場合に
  チャンキング前に適用されます。

## テーブル処理

Markdown テーブルは、チャットクライアント間で一貫してサポートされていません。チャンネルごと（およびアカウントごと）に変換を制御するには
`markdown.tables` を使用します。

- `code`: テーブルをコードブロックとしてレンダリングします（ほとんどのチャンネルのデフォルト）。
- `bullets`: 各行を箇条書きに変換します（Signal + WhatsApp のデフォルト）。
- `off`: テーブルの parse と変換を無効にします。生のテーブルテキストがそのまま通過します。

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

## チャンキング規則

- チャンク制限はチャンネルアダプター/設定から取得され、IR テキストに適用されます。
- コードフェンスは末尾の改行を含む 1 つのブロックとして保持されるため、チャンネルで
  正しくレンダリングされます。
- リストプレフィックスと blockquote プレフィックスは IR テキストの一部なので、チャンキングで
  プレフィックス途中で分割されません。
- インラインスタイル（bold/italic/strike/inline-code/spoiler）はチャンクをまたいで決して分割されず、
  renderer は各チャンク内でスタイルを再オープンします。

チャンネル間のチャンキング挙動についてさらに知りたい場合は、
[ストリーミング + チャンキング](/ja-JP/concepts/streaming) を参照してください。

## リンクポリシー

- **Slack:** `[label](url)` -> `<url|label>`。ベア URL はそのまま維持されます。二重リンクを避けるため、
  parse 中の autolink は無効化されます。
- **Telegram:** `[label](url)` -> `<a href="url">label</a>`（HTML parse mode）。
- **Signal:** `[label](url)` -> label が URL と一致しない限り `label (url)`。

## スポイラー

スポイラーマーカー（`||spoiler||`）は Signal でのみ parse され、そこで
SPOILER style range にマップされます。その他のチャンネルではプレーンテキストとして扱われます。

## チャンネルフォーマッターを追加または更新する方法

1. **1 回だけ parse:** チャンネルに適した
   オプション（autolink、heading style、blockquote prefix）で共有の `markdownToIR(...)` ヘルパーを使用します。
2. **レンダリング:** `renderMarkdownWithMarkers(...)` と
   style marker map（または Signal style range）で renderer を実装します。
3. **チャンキング:** レンダリング前に `chunkMarkdownIR(...)` を呼び出し、各チャンクをレンダリングします。
4. **アダプター接続:** 新しい chunker と
   renderer を使うようにチャンネル送信アダプターを更新します。
5. **テスト:** フォーマットテストを追加または更新し、その
   チャンネルがチャンキングを使用する場合は送信配信テストも追加します。

## よくある落とし穴

- Slack の山括弧トークン（`<@U123>`, `<#C123>`, `<https://...>`）は
  保持しなければなりません。生の HTML は安全にエスケープしてください。
- Telegram HTML では、壊れたマークアップを避けるためにタグ外テキストをエスケープする必要があります。
- Signal の style range は UTF-16 オフセットに依存します。code point オフセットは使用しないでください。
- フェンス付きコードブロックでは、閉じマーカーが
  独立した行に来るよう、末尾改行を保持してください。

## 関連

- [ストリーミングとチャンキング](/ja-JP/concepts/streaming)
- [System prompt](/ja-JP/concepts/system-prompt)
