---
read_when:
    - '`web_search` に Grok を使いたい場合'
    - Web 検索には `XAI_API_KEY` が必要な場合
summary: xAI の web-grounded responses による Grok Web 検索
title: Grok 検索
x-i18n:
    generated_at: "2026-04-24T05:24:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

OpenClaw は、xAI の web-grounded
responses を使い、ライブ検索結果に citation を付けて AI が要約した回答を返す `web_search` provider として Grok をサポートしています。

同じ `XAI_API_KEY` は、X
（旧 Twitter）の投稿検索用 built-in `x_search` tool にも使えます。key を
`plugins.entries.xai.config.webSearch.apiKey` に保存すると、OpenClaw はそれを bundled xAI model provider 用のフォールバックとしても再利用します。

repost、reply、bookmark、view などの投稿レベル X metrics が必要な場合は、
広い検索 query ではなく、正確な投稿 URL または status ID とともに `x_search` を使ってください。

## オンボーディングと設定

次のいずれかの中で **Grok** を選ぶと:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw は、同じ `XAI_API_KEY` で `x_search` を有効にするための個別のフォローアップ step を表示できます。このフォローアップは:

- `web_search` 用に Grok を選んだ後にのみ表示される
- 独立したトップレベル web-search provider 選択肢ではない
- 同じフロー内で `x_search` model を任意で設定できる

これをスキップした場合でも、後で config で `x_search` を有効化または変更できます。

## API key を取得する

<Steps>
  <Step title="key を作成する">
    [xAI](https://console.x.ai/) で API key を取得します。
  </Step>
  <Step title="key を保存する">
    Gateway 環境で `XAI_API_KEY` を設定するか、次で設定してください:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Config

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // XAI_API_KEY が設定されていれば任意
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**環境変数による代替:** Gateway 環境で `XAI_API_KEY` を設定してください。
gateway インストールでは、`~/.openclaw/.env` に置いてください。

## 仕組み

Grok は xAI web-grounded responses を使って、Gemini の Google Search grounding アプローチに近い形で、inline
citation 付きの回答を生成します。

## サポートされるパラメータ

Grok search は `query` をサポートします。

共有 `web_search` 互換性のために `count` も受け付けますが、Grok は依然として
N 件の結果リストではなく、citation 付きの 1 つの要約回答を返します。

provider 固有フィルターは現在サポートされていません。

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべての provider と自動検出
- [Web Search 内の x_search](/ja-JP/tools/web#x_search) -- xAI によるファーストクラスの X 検索
- [Gemini Search](/ja-JP/tools/gemini-search) -- Google grounding による AI 要約回答
