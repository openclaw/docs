---
read_when:
    - Grok で web_search を使用したい
    - Web検索に xAI OAuth または XAI_API_KEY を使用したい
summary: xAI の Web に基づく応答による Grok Web 検索
title: Grok 検索
x-i18n:
    generated_at: "2026-07-05T11:53:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw は Grok を `web_search` プロバイダーとしてサポートし、xAI の Web に基づく
応答を使用して、ライブ検索結果と引用に裏付けられた AI 合成回答を生成します。

Grok Web 検索は、利用可能な場合は既存の xAI OAuth サインインを優先します。
OAuth プロファイルが存在しない場合、同じ xAI API キーが X（旧 Twitter）の投稿検索用の組み込み
`x_search` ツールと `code_execution`
ツールも提供します。キーを `plugins.entries.xai.config.webSearch.apiKey` に保存すると、
OpenClaw はそれをバンドルされた xAI モデルプロバイダーのフォールバックとしても再利用できます。

投稿レベルの X メトリクス（再投稿、返信、ブックマーク、表示回数）には、広範な検索クエリではなく、
正確な投稿 URL またはステータス ID とともに
[`x_search`](/ja-JP/tools/web#x_search) を使用してください。

## オンボーディングと設定

`openclaw onboard` または `openclaw configure --section
web` の実行中に **Grok** を選択すると、OpenClaw は別の Web 検索キーの入力を求めずに、既存の xAI OAuth プロファイルを再利用できます。OAuth がない場合は、xAI API キーのセットアップにフォールバックします。

その後、OpenClaw は同じ xAI 認証情報で `x_search` を有効にするフォローアップ手順を提示します。
このフォローアップは次のとおりです。

- `web_search` に Grok を選択した後にのみ表示されます
- 別個のトップレベル Web 検索プロバイダー選択ではありません
- 同じフローで任意に `x_search` モデルを設定できます

後で設定で `x_search` を有効化または変更するには、スキップしてください。

## サインインまたは API キーを取得

<Steps>
  <Step title="xAI OAuth を使用">
    オンボーディングまたはモデル認証中にすでに xAI でサインインしている場合は、
    `web_search` プロバイダーとして Grok を選択します。別の API キーは不要です。

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="API キーフォールバックを使用">
    OAuth が利用できない場合、または意図的にキーに基づく Web 検索設定を使いたい場合は、
    [xAI](https://console.x.ai/) から API キーを取得します。
  </Step>
  <Step title="キーを保存">
    Gateway 環境に `XAI_API_KEY` を設定するか、次の方法で設定します。

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
            apiKey: "xai-...", // xAI OAuth または XAI_API_KEY が利用可能な場合は任意
            baseUrl: "https://api.x.ai/v1", // 任意の Responses API プロキシ/ベース URL オーバーライド
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

**認証情報の代替:** `openclaw models auth login --provider xai
--method oauth`、Gateway 環境内の `XAI_API_KEY`、または
`plugins.entries.xai.config.webSearch.apiKey`。Gateway インストールでは、環境変数を
`~/.openclaw/.env` に配置します。

## 仕組み

Grok は xAI の Web に基づく応答を使用して、Gemini の Google Search グラウンディング手法と同様に、インライン引用付きの回答を合成します。

## サポートされるパラメーター

Grok 検索は `query` をサポートします。`count` は共有 `web_search`
互換性のために受け付けられますが、Grok は N 件の結果リストではなく、常に引用付きの合成回答を 1 件返します。プロバイダー固有のフィルターはサポートされていません。

Grok のデフォルトタイムアウトは 60 秒です。これは、xAI Responses の Web に基づく検索が共有 `web_search` のデフォルトより長く実行される場合があるためです。
`tools.web.search.timeoutSeconds` で上書きできます。

## ベース URL オーバーライド

`plugins.entries.xai.config.webSearch.baseUrl` を設定すると、Grok Web 検索をオペレータープロキシまたは xAI 互換の Responses エンドポイント経由でルーティングできます。OpenClaw
は末尾のスラッシュを削除した後、`<baseUrl>/responses` に投稿します。`x_search`
は `plugins.entries.xai.config.xSearch.baseUrl` が設定されていない限り、同じ `webSearch.baseUrl` にフォールバックします。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Web Search の x_search](/ja-JP/tools/web#x_search) -- xAI 経由のファーストクラス X 検索
- [Gemini Search](/ja-JP/tools/gemini-search) -- Google グラウンディングによる AI 合成回答
