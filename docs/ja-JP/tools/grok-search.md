---
read_when:
    - web_search に Grok を使用する場合
    - Web 検索に xAI OAuth または XAI_API_KEY を使用する場合
summary: xAI のウェブグラウンディング応答を介した Grok ウェブ検索
title: Grok 検索
x-i18n:
    generated_at: "2026-07-11T22:47:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw は、Grok を `web_search` プロバイダーとしてサポートしています。xAI のウェブグラウンディングされたレスポンスを使用して、ライブ検索結果に基づく、引用付きの AI 合成回答を生成します。

Grok ウェブ検索では、利用可能な場合、既存の xAI OAuth サインインが優先されます。OAuth プロファイルが存在しない場合、同じ xAI API キーで、X（旧 Twitter）の投稿を検索する組み込みの `x_search` ツールと `code_execution` ツールも利用できます。キーを `plugins.entries.xai.config.webSearch.apiKey` に保存すると、OpenClaw はバンドルされている xAI モデルプロバイダーのフォールバックとしてもそのキーを再利用できます。

投稿単位の X 指標（リポスト、返信、ブックマーク、閲覧数）を取得するには、広範な検索クエリではなく、正確な投稿 URL またはステータス ID を指定して [`x_search`](/ja-JP/tools/web#x_search) を使用してください。

## オンボーディングと設定

`openclaw onboard` または `openclaw configure --section
web` の実行中に **Grok** を選択すると、OpenClaw は個別のウェブ検索キーの入力を求めずに、既存の xAI OAuth プロファイルを再利用できます。OAuth がない場合は、xAI API キーの設定にフォールバックします。

その後、OpenClaw は、同じ xAI 認証情報で `x_search` を有効にするための追加手順を提示します。この追加手順は次のとおりです。

- `web_search` に Grok を選択した後にのみ表示されます
- 独立した最上位のウェブ検索プロバイダー選択肢ではありません
- 同じフロー内で、必要に応じて `x_search` モデルを設定できます

後で設定から `x_search` を有効化または変更する場合は、この手順をスキップしてください。

## サインインまたは API キーの取得

<Steps>
  <Step title="xAI OAuth を使用する">
    オンボーディングまたはモデル認証時にすでに xAI へサインインしている場合は、`web_search` プロバイダーとして Grok を選択してください。個別の API キーは不要です。

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="API キーのフォールバックを使用する">
    OAuth が利用できない場合、または意図的にキーを使用するウェブ検索設定を利用する場合は、[xAI](https://console.x.ai/) から API キーを取得してください。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境に `XAI_API_KEY` を設定するか、次のコマンドで設定してください。

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
            apiKey: "xai-...", // xAI OAuth または XAI_API_KEY が利用可能な場合は省略可能
            baseUrl: "https://api.x.ai/v1", // 省略可能な Responses API プロキシ／ベース URL の上書き
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

**認証情報の代替手段：** `openclaw models auth login --provider xai
--method oauth`、Gateway 環境の `XAI_API_KEY`、または
`plugins.entries.xai.config.webSearch.apiKey` を使用できます。Gateway をインストールしている場合は、環境変数を `~/.openclaw/.env` に設定してください。

## 仕組み

Grok は、Gemini の Google Search グラウンディング方式と同様に、xAI のウェブグラウンディングされたレスポンスを使用して、インライン引用付きの回答を合成します。

## サポートされるパラメーター

Grok 検索は `query` をサポートします。共有の `web_search` との互換性のために `count` も受け付けますが、Grok は N 件の結果リストではなく、常に引用付きの合成回答を 1 件返します。プロバイダー固有のフィルターはサポートされていません。

xAI Responses のウェブグラウンディング検索は、共有の `web_search` のデフォルトよりも長く実行される場合があるため、Grok のデフォルトタイムアウトは 60 秒です。`tools.web.search.timeoutSeconds` で上書きできます。

## ベース URL の上書き

Grok ウェブ検索を運用者のプロキシまたは xAI 互換の Responses エンドポイント経由でルーティングするには、`plugins.entries.xai.config.webSearch.baseUrl` を設定します。OpenClaw は末尾のスラッシュを削除した後、`<baseUrl>/responses` に POST します。`plugins.entries.xai.config.xSearch.baseUrl` が設定されていない場合、`x_search` は同じ `webSearch.baseUrl` にフォールバックします。

## 関連項目

- [ウェブ検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [ウェブ検索の x_search](/ja-JP/tools/web#x_search) -- xAI を介した第一級の X 検索
- [Gemini Search](/ja-JP/tools/gemini-search) -- Google グラウンディングによる AI 合成回答
