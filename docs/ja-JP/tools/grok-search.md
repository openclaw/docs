---
read_when:
    - web_search に Grok を使いたい場合
    - Web検索には XAI_API_KEY が必要です
summary: xAI のウェブに基づく応答による Grok ウェブ検索
title: Grok 検索
x-i18n:
    generated_at: "2026-05-10T19:54:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw は Grok を `web_search` プロバイダーとしてサポートし、xAI の Web に基づく
レスポンスを使用して、ライブ検索結果に基づき引用付きの AI 合成回答を生成します。

同じ xAI API キーは、X（旧 Twitter）の投稿検索用の組み込み `x_search` ツールと
`code_execution` ツールにも使用できます。キーを
`plugins.entries.xai.config.webSearch.apiKey` に保存すると、OpenClaw はそれを
バンドルされた xAI モデルプロバイダーのフォールバックとしても再利用します。

再投稿、返信、ブックマーク、表示回数などの投稿レベルの X メトリクスには、広範な検索
クエリではなく、正確な投稿 URL またはステータス ID を指定した `x_search` を優先してください。

## オンボーディングと設定

次の実行中に **Grok** を選択した場合:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw は、同じ `XAI_API_KEY` で `x_search` を有効にするための個別のフォローアップ手順を表示できます。そのフォローアップは次のとおりです。

- `web_search` に Grok を選択した後にのみ表示されます
- 個別のトップレベル Web 検索プロバイダー選択ではありません
- 同じフロー内で任意に `x_search` モデルを設定できます

スキップした場合でも、後から設定で `x_search` を有効化または変更できます。

## API キーを取得する

<Steps>
  <Step title="キーを作成する">
    [xAI](https://console.x.ai/) から API キーを取得します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境で `XAI_API_KEY` を設定するか、次のコマンドで設定します。

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
Gateway インストールの場合は、`~/.openclaw/.env` に配置します。

## 仕組み

Grok は xAI の Web に基づくレスポンスを使用して、Gemini の Google Search grounding アプローチと同様に、インライン引用付きの回答を合成します。

## サポートされるパラメーター

Grok 検索は `query` をサポートします。

`count` は共有 `web_search` 互換性のために受け付けられますが、Grok は N 件の結果リストではなく、引用付きの合成回答を 1 件返します。

プロバイダー固有のフィルターは現在サポートされていません。

Grok はプロバイダー固有のデフォルトタイムアウト 60 秒を使用します。これは、xAI Responses の Web に基づく検索が、共有 `web_search` のデフォルトより長く実行される場合があるためです。上書きするには `tools.web.search.timeoutSeconds` を設定します。

## ベース URL の上書き

Grok Web 検索をオペレータープロキシまたは xAI 互換の Responses エンドポイント経由でルーティングする必要がある場合は、`plugins.entries.xai.config.webSearch.baseUrl` を設定します。OpenClaw は末尾のスラッシュを削除した後、`<baseUrl>/responses` に POST します。`plugins.entries.xai.config.xSearch.baseUrl` が設定されていない限り、`x_search` は同じ `webSearch.baseUrl` フォールバックを使用します。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Web Search の x_search](/ja-JP/tools/web#x_search) -- xAI による第一級の X 検索
- [Gemini Search](/ja-JP/tools/gemini-search) -- Google grounding による AI 合成回答
