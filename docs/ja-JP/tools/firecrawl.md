---
read_when:
    - Firecrawl を使った web 抽出を行いたい場合
    - Firecrawl API キーが必要な場合
    - '`web_search` provider として Firecrawl を使いたい場合'
    - '`web_fetch` で anti-bot 抽出を使いたい場合'
summary: Firecrawl search、scrape、および `web_fetch` fallback
title: Firecrawl
x-i18n:
    generated_at: "2026-04-24T05:24:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

OpenClaw は **Firecrawl** を 3 つの方法で使えます:

- `web_search` provider として
- 明示的な Plugin ツールとして: `firecrawl_search` と `firecrawl_scrape`
- `web_fetch` の fallback extractor として

これはホスト型の抽出 / 検索サービスで、bot 回避とキャッシュをサポートしており、
JS を多用するサイトや通常の HTTP fetch をブロックするページで役立ちます。

## API キーを取得する

1. Firecrawl アカウントを作成し、API キーを生成します。
2. それを config に保存するか、gateway 環境で `FIRECRAWL_API_KEY` を設定します。

## Firecrawl search を設定する

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

注記:

- オンボーディングまたは `openclaw configure --section web` で Firecrawl を選ぶと、バンドル済み Firecrawl Plugin が自動的に有効になります。
- Firecrawl を使う `web_search` は `query` と `count` をサポートします。
- `sources`、`categories`、結果の scrape のような Firecrawl 固有の制御には、`firecrawl_search` を使ってください。
- `baseUrl` の override は `https://api.firecrawl.dev` のままにする必要があります。
- `FIRECRAWL_BASE_URL` は Firecrawl search と scrape の base URL に共通の env fallback です。

## Firecrawl scrape + `web_fetch` fallback を設定する

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

注記:

- Firecrawl fallback の試行は、API キーが利用可能な場合にのみ実行されます（`plugins.entries.firecrawl.config.webFetch.apiKey` または `FIRECRAWL_API_KEY`）。
- `maxAgeMs` は、キャッシュ済み結果をどれだけ古くまで許容するかを制御します（ms）。デフォルトは 2 日です。
- 旧来の `tools.web.fetch.firecrawl.*` config は `openclaw doctor --fix` で自動移行されます。
- Firecrawl scrape / base URL の override は `https://api.firecrawl.dev` に制限されます。

`firecrawl_scrape` は同じ `plugins.entries.firecrawl.config.webFetch.*` 設定と env var を再利用します。

## Firecrawl Plugin ツール

### `firecrawl_search`

汎用 `web_search` ではなく、Firecrawl 固有の検索制御を使いたい場合にこれを使います。

主要パラメータ:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

通常の `web_fetch` が弱い、JS を多用するページや bot 保護されたページにはこれを使います。

主要パラメータ:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / bot 回避

Firecrawl は bot 回避用に **proxy mode** パラメータ（`basic`、`stealth`、または `auto`）を公開しています。
OpenClaw は Firecrawl リクエストに常に `proxy: "auto"` と `storeInCache: true` を使います。
proxy を省略した場合、Firecrawl はデフォルトで `auto` を使います。`auto` は basic での試行が失敗したときに stealth proxy で再試行するため、basic のみの scraping より多くのクレジットを消費する場合があります。

## `web_fetch` が Firecrawl を使う方法

`web_fetch` の抽出順序:

1. Readability（ローカル）
2. Firecrawl（選択されている場合、またはアクティブな web-fetch fallback として自動検出された場合）
3. 基本的な HTML cleanup（最後の fallback）

選択用ノブは `tools.web.fetch.provider` です。これを省略すると、OpenClaw は
利用可能な認証情報から、最初に準備できている web-fetch provider を自動検出します。
現時点のバンドル済み provider は Firecrawl です。

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべての provider と自動検出
- [Web Fetch](/ja-JP/tools/web-fetch) -- Firecrawl fallback を備えた web_fetch ツール
- [Tavily](/ja-JP/tools/tavily) -- 検索 + 抽出ツール
