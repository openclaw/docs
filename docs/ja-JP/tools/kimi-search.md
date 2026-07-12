---
read_when:
    - web_search に Kimi を使用する場合
    - KIMI_API_KEY または MOONSHOT_API_KEY が必要です
summary: Moonshot ウェブ検索経由の Kimi ウェブ検索
title: Kimi検索
x-i18n:
    generated_at: "2026-07-11T22:47:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi は、Moonshot のネイティブ Web 検索を基盤とする `web_search` プロバイダーです。Moonshot は、順位付けされた結果一覧を返すのではなく、Gemini や Grok のグラウンディング応答プロバイダーと同様に、インライン引用付きの回答を 1 つ生成します。

## セットアップ

<Steps>
  <Step title="キーを作成する">
    [Moonshot AI](https://platform.moonshot.cn/) から API キーを取得します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境で `KIMI_API_KEY` または `MOONSHOT_API_KEY` を設定するか（Gateway をインストールしている場合は `~/.openclaw/.env` に追加）、次のコマンドで設定します。

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` または `openclaw configure --section web` の実行中に **Kimi** を選択すると、次の項目も入力するよう求められます。

- Moonshot API のリージョン：`https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`
- Web 検索モデル（デフォルトは `kimi-k2.6`）

## 設定

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // KIMI_API_KEY または MOONSHOT_API_KEY が設定されている場合は省略可能
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

`tools.web.search.provider` を省略すると、利用可能な API キーから自動検出されます。複数の検索認証情報が設定されている場合は、明示的に `kimi` を設定してください。

`tools.web.search.kimi` の配下に置く同等のスコープ形式（`apiKey`、`baseUrl`、`model`）も使用できます。どちらの形式も、同じ解決済み設定に統合されます。

デフォルト：省略した場合、`baseUrl` は `https://api.moonshot.ai/v1`、`model` は `kimi-k2.6` になります。

チャット通信で中国向けホスト（`models.providers.moonshot.baseUrl`：`https://api.moonshot.cn/v1`）を使用している場合、Kimi の `web_search` は自身の `baseUrl` が未設定であれば、そのホストを自動的に再利用します。これにより、`.cn` キーが誤って国際エンドポイントに送信されることを防ぎます（国際エンドポイントでは、これらのキーに対して HTTP 401 が返されます）。この継承を上書きするには、Kimi の `baseUrl` を明示的に設定してください。

## グラウンディング要件

OpenClaw は、Moonshot の応答に `$web_search` ツール呼び出しの再現、`search_results`、引用 URL など、ネイティブ Web 検索のグラウンディング証拠が含まれている場合にのみ、Kimi の `web_search` 結果を返します。Kimi がグラウンディングなしで直接回答した場合（たとえば「インターネットを閲覧できません」）、OpenClaw はそのテキストを検索結果として扱わず、代わりに `kimi_web_search_ungrounded` エラーを返します。クエリを再試行するか、Brave などの構造化プロバイダーに切り替えるか、対象 URL がすでに分かっている場合は `web_fetch` またはブラウザツールを使用してください。

## ツールパラメーター

| パラメーター                                                    | 対応状況                                                                                                              |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | はい                                                                                                                  |
| `count`                                                         | プロバイダー間の互換性のため受け付けますが、無視されます。Kimi は N 件の結果一覧ではなく、常に生成した回答を 1 つ返します |
| `country`, `language`, `freshness`, `date_after`, `date_before` | いいえ                                                                                                                |

## 関連項目

- [Web 検索の概要](/ja-JP/tools/web) - すべてのプロバイダーと自動検出
- [Moonshot AI](/ja-JP/providers/moonshot) - Moonshot モデルと Kimi Coding プロバイダーのドキュメント
- [Gemini Search](/ja-JP/tools/gemini-search) - Google のグラウンディングによる AI 生成回答
- [Grok Search](/ja-JP/tools/grok-search) - xAI のグラウンディングによる AI 生成回答
