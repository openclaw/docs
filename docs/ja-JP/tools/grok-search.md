---
read_when:
    - web_search に Grok を使用したい
    - Web 検索に xAI OAuth または XAI_API_KEY を使用したい
summary: xAI の Web 根拠付き応答による Grok Web 検索
title: Grok 検索
x-i18n:
    generated_at: "2026-06-27T13:13:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw は Grok を `web_search` プロバイダーとしてサポートし、xAI のウェブ根拠付き
レスポンスを使用して、ライブ検索結果に基づき引用付きの AI 合成回答を生成します。

Grok web search は、利用可能な場合は既存の xAI OAuth サインインを優先します。
OAuth プロファイルが存在しない場合、同じ xAI API キーで、X（旧 Twitter）の投稿検索用の組み込み
`x_search` ツールと `code_execution`
ツールも利用できます。キーを `plugins.entries.xai.config.webSearch.apiKey` に保存すると、
OpenClaw はそれをバンドルされた xAI モデルプロバイダーのフォールバックとしても再利用します。

リポスト、返信、ブックマーク、表示回数などの投稿単位の X メトリクスには、広範な検索
クエリではなく、正確な投稿 URL またはステータス ID を指定した
`x_search` を優先してください。

## オンボーディングと設定

次の操作中に **Grok** を選択した場合:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw は、別個の web-search キーを求めずに既存の xAI OAuth プロファイルを使用できます。OAuth が利用できない場合は、xAI API キー設定にフォールバックします。
OpenClaw は、同じ xAI 認証情報で `x_search` を有効にするための別個のフォローアップ手順も表示できます。そのフォローアップは:

- `web_search` に Grok を選択した後にのみ表示されます
- 別個の最上位 web-search プロバイダー選択ではありません
- 同じフロー中に任意で `x_search` モデルを設定できます

スキップした場合でも、後から設定で `x_search` を有効化または変更できます。

## サインインまたは API キーを取得

<Steps>
  <Step title="xAI OAuth を使用">
    オンボーディングまたはモデル認証中にすでに xAI でサインインしている場合は、
    `web_search` プロバイダーとして Grok を選択します。別個の API キーは不要です:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="API キーフォールバックを使用">
    OAuth が利用できない場合、または意図的にキーに基づく web-search 設定を使いたい場合は、
    [xAI](https://console.x.ai/) から API キーを取得します。
  </Step>
  <Step title="キーを保存">
    Gateway 環境で `XAI_API_KEY` を設定するか、次の方法で構成します:

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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
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

**認証情報の代替:** `openclaw models auth login
--provider xai --method oauth` でサインインするか、Gateway 環境で `XAI_API_KEY` を設定するか、
`plugins.entries.xai.config.webSearch.apiKey` を保存します。gateway インストールの場合は、
環境変数を `~/.openclaw/.env` に配置します。

## 仕組み

Grok は xAI のウェブ根拠付きレスポンスを使用して、Gemini の Google Search grounding アプローチと同様に、インライン
引用付きの回答を合成します。

## サポートされるパラメーター

Grok search は `query` をサポートします。

`count` は共有 `web_search` 互換性のために受け付けられますが、Grok は N 件の結果リストではなく、引用付きの合成回答を 1 つ返します。

プロバイダー固有のフィルターは現在サポートされていません。

Grok は、xAI Responses のウェブ根拠付き検索が共有 `web_search` のデフォルトより長く実行される可能性があるため、プロバイダー固有の 60 秒のデフォルトタイムアウトを使用します。上書きするには
`tools.web.search.timeoutSeconds` を設定します。

## ベース URL の上書き

Grok web search をオペレータープロキシまたは xAI 互換の Responses エンドポイント経由でルーティングする必要がある場合は、`plugins.entries.xai.config.webSearch.baseUrl` を設定します。OpenClaw は末尾のスラッシュを削除した後、`<baseUrl>/responses` に投稿します。`x_search` は、
`plugins.entries.xai.config.xSearch.baseUrl` が設定されていない限り、同じ `webSearch.baseUrl` フォールバックを使用します。

## 関連

- [Web Search 概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Web Search の x_search](/ja-JP/tools/web#x_search) -- xAI によるファーストクラスの X 検索
- [Gemini Search](/ja-JP/tools/gemini-search) -- Google grounding による AI 合成回答
