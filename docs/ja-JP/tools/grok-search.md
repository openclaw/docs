---
read_when:
    - web_search に Grok を使用したい場合
    - ウェブ検索には XAI_API_KEY が必要です
summary: xAI のウェブに基づくレスポンスによる Grok ウェブ検索
title: Grok 検索
x-i18n:
    generated_at: "2026-05-02T05:07:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw は Grok を `web_search` プロバイダーとしてサポートし、xAI の Web に基づく
レスポンスを使用して、ライブ検索結果に裏付けられた AI 合成の回答を引用付きで生成します。

同じ `XAI_API_KEY` は、X（旧 Twitter）の投稿検索用の組み込み `x_search` ツールにも使用できます。キーを
`plugins.entries.xai.config.webSearch.apiKey` に保存すると、OpenClaw はバンドルされた xAI モデルプロバイダーの
フォールバックとしても再利用するようになりました。

リポスト、返信、ブックマーク、表示回数などの投稿レベルの X メトリクスには、広範な検索
クエリではなく、正確な投稿 URL またはステータス ID で `x_search` を使用することを推奨します。

## オンボーディングと設定

次の実行中に **Grok** を選択した場合:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw は、同じ `XAI_API_KEY` で `x_search` を有効にする別個のフォローアップ手順を表示できます。そのフォローアップは:

- `web_search` に Grok を選択した後にのみ表示されます
- 別個のトップレベル Web 検索プロバイダー選択ではありません
- 同じフロー内で任意に `x_search` モデルを設定できます

スキップした場合は、後で設定から `x_search` を有効化または変更できます。

## API キーを取得する

<Steps>
  <Step title="Create a key">
    [xAI](https://console.x.ai/) から API キーを取得します。
  </Step>
  <Step title="Store the key">
    Gateway 環境で `XAI_API_KEY` を設定するか、次で設定します:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 設定

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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

**環境による代替:** Gateway 環境で `XAI_API_KEY` を設定します。
Gateway インストールでは、`~/.openclaw/.env` に配置します。

## 仕組み

Grok は xAI の Web に基づくレスポンスを使用して、Gemini の Google Search grounding アプローチと同様に、インライン引用付きの回答を合成します。

## サポートされるパラメーター

Grok 検索は `query` をサポートします。

`count` は共有 `web_search` 互換性のために受け付けられますが、Grok は N 件の結果リストではなく、引用付きの合成回答を 1 件返します。

プロバイダー固有のフィルターは現在サポートされていません。

Grok はプロバイダー固有の 60 秒のデフォルトタイムアウトを使用します。これは、xAI Responses の
Web に基づく検索が共有 `web_search` のデフォルトより長く実行される場合があるためです。
上書きするには `tools.web.search.timeoutSeconds` を設定します。

## ベース URL の上書き

Grok Web 検索をオペレータープロキシまたは xAI 互換の Responses エンドポイント経由でルーティングする必要がある場合は、
`plugins.entries.xai.config.webSearch.baseUrl` を設定します。OpenClaw は末尾のスラッシュを削除した後、
`<baseUrl>/responses` に投稿します。`plugins.entries.xai.config.xSearch.baseUrl` が設定されていない限り、
`x_search` は同じ `webSearch.baseUrl` フォールバックを使用します。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Web Search の x_search](/ja-JP/tools/web#x_search) -- xAI によるファーストクラスの X 検索
- [Gemini Search](/ja-JP/tools/gemini-search) -- Google grounding による AI 合成の回答
