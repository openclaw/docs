---
read_when:
    - Kimi を web_search に使用したい
    - KIMI_API_KEY または MOONSHOT_API_KEY が必要です
summary: Moonshot ウェブ検索経由の Kimi ウェブ検索
title: Kimi 検索
x-i18n:
    generated_at: "2026-07-05T11:54:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi は、Moonshot のネイティブ Web 検索を基盤とする `web_search` プロバイダーです。Moonshot は、ランク付けされた結果リストを返すのではなく、Gemini や Grok のグラウンディング済み応答プロバイダーと同様に、インライン引用付きの 1 つの回答を合成します。

## セットアップ

<Steps>
  <Step title="キーを作成する">
    [Moonshot AI](https://platform.moonshot.cn/) から API キーを取得します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境で `KIMI_API_KEY` または `MOONSHOT_API_KEY` を設定します（Gateway インストールの場合は `~/.openclaw/.env` に追加します）。または、次のコマンドで設定します。

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` または `openclaw configure --section web` 中に **Kimi** を選択すると、次の入力も求められます。

- Moonshot API リージョン: `https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`
- Web 検索モデル（デフォルトは `kimi-k2.6`）

## 設定

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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

`tools.web.search.provider` は省略時に利用可能な API キーから自動検出されます。複数の検索認証情報が設定されている場合は、明示的に `kimi` に設定してください。

`tools.web.search.kimi` の下に置く同等のスコープ付き形式（`apiKey`、`baseUrl`、`model`）も機能します。どちらの形も同じ解決済み設定にマージされます。

デフォルト: `baseUrl` は省略時に `https://api.moonshot.ai/v1` に、`model` は `kimi-k2.6` にデフォルト設定されます。

チャットトラフィックが中国ホスト（`models.providers.moonshot.baseUrl`: `https://api.moonshot.cn/v1`）を使用している場合、Kimi `web_search` は独自の `baseUrl` が未設定のときにそのホストを自動的に再利用します。そのため、`.cn` キーが誤って国際エンドポイント（それらのキーでは HTTP 401 を返します）に送信されることはありません。この継承を上書きするには、明示的な Kimi `baseUrl` を設定してください。

## グラウンディング要件

OpenClaw は、Moonshot の応答に `$web_search` ツール呼び出しのリプレイ、`search_results`、引用 URL などのネイティブ Web 検索グラウンディング証拠が含まれている場合にのみ、Kimi `web_search` の結果を返します。Kimi がグラウンディングなしで直接回答した場合（例: 「インターネットを閲覧できません」）、OpenClaw はそのテキストを検索結果として扱う代わりに `kimi_web_search_ungrounded` エラーを返します。クエリを再試行するか、Brave などの構造化プロバイダーに切り替えるか、対象 URL がすでにある場合は `web_fetch` / ブラウザツールを使用してください。

## ツールパラメーター

| パラメーター                                                    | サポート                                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | はい                                                                                                                     |
| `count`                                                         | クロスプロバイダー互換性のため受け付けますが、無視されます。Kimi は N 件の結果リストではなく、常に 1 つの合成回答を返します |
| `country`, `language`, `freshness`, `date_after`, `date_before` | いいえ                                                                                                                   |

## 関連

- [Web 検索の概要](/ja-JP/tools/web) - すべてのプロバイダーと自動検出
- [Moonshot AI](/ja-JP/providers/moonshot) - Moonshot モデル + Kimi Coding プロバイダードキュメント
- [Gemini Search](/ja-JP/tools/gemini-search) - Google グラウンディングによる AI 合成回答
- [Grok Search](/ja-JP/tools/grok-search) - xAI グラウンディングによる AI 合成回答
