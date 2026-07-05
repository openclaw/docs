---
read_when:
    - Firecrawl バックの Web 抽出を使いたい
    - 鍵なしの Firecrawl web_fetch を使いたい
    - 検索または上限の引き上げには Firecrawl API キーが必要です
    - Firecrawl を `web_search` プロバイダーとして使いたい
    - web_fetch にアンチボット抽出を使いたい場合
summary: Firecrawl 検索、スクレイプ、および web_fetch フォールバック
title: Firecrawl
x-i18n:
    generated_at: "2026-07-05T11:53:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw は **Firecrawl** を 3 つの方法で使用できます。

- `web_search` プロバイダーとして
- 明示的な Plugin ツールとして: `firecrawl_search` と `firecrawl_scrape`
- `web_fetch` のフォールバック抽出器として

これは、Bot 回避とキャッシュをサポートするホスト型の抽出/検索サービスです。JS の多いサイトや、通常の HTTP fetch をブロックするページで役立ちます。

## Plugin のインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## キーなし web_fetch と API キー

明示的に選択されたホスト型 Firecrawl の `web_fetch` フォールバックは、API キーなしのスターターアクセスをサポートします。より高い制限が必要な場合は、Gateway 環境に `FIRECRAWL_API_KEY` を追加するか、設定してください。Firecrawl `web_search` と `firecrawl_scrape` には API キーが必要です。

## Firecrawl 検索の設定

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

注:

- オンボーディングまたは `openclaw configure --section web` で Firecrawl を選択すると、インストール済みの Firecrawl Plugin が自動的に有効になります。
- Firecrawl を使用する `web_search` は `query` と `count` をサポートします。
- `sources`、`categories`、結果のスクレイピングなど、Firecrawl 固有の制御には `firecrawl_search` を使用してください。
- `baseUrl` のデフォルトは `https://api.firecrawl.dev` のホスト型 Firecrawl です。セルフホストの上書きはプライベート/内部エンドポイントでのみ許可されます。HTTP はそれらのプライベートターゲットでのみ受け入れられます。
- `FIRECRAWL_BASE_URL` は、Firecrawl の検索およびスクレイプのベース URL に対する共有環境フォールバックです。
- Firecrawl 検索リクエストのデフォルトタイムアウトは 30 秒です。`firecrawl_search` の `timeoutSeconds` パラメーターで呼び出しごとに上書きできます。

## Firecrawl web_fetch フォールバックの設定

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

注:

- 明示的に選択された Firecrawl の `web_fetch` フォールバックは、API キーなしで動作します。設定されている場合、OpenClaw はより高い制限のために `plugins.entries.firecrawl.config.webFetch.apiKey` または `FIRECRAWL_API_KEY` を送信します。
- オンボーディング中または `openclaw configure --section web` で Firecrawl を選択すると、Plugin が有効になり、別の fetch プロバイダーがすでに設定されていない限り、`web_fetch` に Firecrawl が選択されます。
- `firecrawl_scrape` には API キーが必要です。
- `maxAgeMs` は、キャッシュ済み結果をどれだけ古くできるかを制御します (ms)。デフォルトは 172,800,000 ms (2 日) です。
- `onlyMainContent` のデフォルトは `true` です。`timeoutSeconds` のデフォルトは 60 です。
- 従来の `tools.web.fetch.firecrawl.*` と `tools.web.search.firecrawl.*` 設定は、`openclaw doctor --fix` によって自動移行されます。
- Firecrawl のスクレイプ/ベース URL の上書きは、検索と同じホスト型/プライベートのルールに従います。公開ホスト型トラフィックは `https://api.firecrawl.dev` を使用します。セルフホストの上書きはプライベート/内部エンドポイントに解決される必要があります。
- `firecrawl_scrape` は、明らかなプライベート、ループバック、メタデータ、および非 HTTP(S) のターゲット URL を、Firecrawl に転送する前に拒否します。これは、明示的な Firecrawl スクレイプ呼び出しに対する `web_fetch` のターゲット安全性契約と一致します。

`firecrawl_scrape` は、必須の API キーを含め、同じ `plugins.entries.firecrawl.config.webFetch.*` 設定と環境変数を再利用します。

### セルフホスト Firecrawl

Firecrawl を自分で実行する場合は、`plugins.entries.firecrawl.config.webSearch.baseUrl`、`plugins.entries.firecrawl.config.webFetch.baseUrl`、または `FIRECRAWL_BASE_URL` を設定します。OpenClaw は、ループバック、プライベートネットワーク、`.local`、`.internal`、または `.localhost` ターゲットに対してのみ `http://` を受け入れます。Firecrawl API キーが任意のエンドポイントへ誤って送信されないように、公開カスタムホストは拒否されます。

## Firecrawl Plugin ツール

### `firecrawl_search`

汎用の `web_search` ではなく Firecrawl 固有の検索制御が必要な場合に使用します。

パラメーター:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

通常の `web_fetch` が弱い、JS の多いページや Bot 保護されたページに使用します。

パラメーター:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## ステルス / Bot 回避

`firecrawl_scrape` と `web_fetch` の Firecrawl フォールバックは、呼び出し元がこれらのパラメーターを上書きしない限り、デフォルトで `proxy: "auto"` と `storeInCache: true` を使用します。`firecrawl_search` と `web_search` の Firecrawl プロバイダーには `proxy`/`storeInCache` 制御はありません。ステルスプロキシモードはスクレイプ/fetch リクエストにのみ適用されます。

Firecrawl の `proxy` モードは Bot 回避 (`basic`、`stealth`、または `auto`) を制御します。`auto` は、基本的な試行が失敗した場合にステルスプロキシで再試行します。そのため、basic のみのスクレイピングよりも多くのクレジットを使用する場合があります。

## `web_fetch` が Firecrawl を使用する方法

`web_fetch` の抽出順序:

1. Readability (ローカル)
2. Firecrawl などの設定済み fetch プロバイダー (選択されている場合、または設定済み認証情報から自動検出された場合)
3. 基本的な HTML クリーンアップ (最後のフォールバック)

選択ノブは `tools.web.fetch.provider` です。省略すると、OpenClaw は利用可能な認証情報から最初に準備完了の web-fetch プロバイダーを自動検出します。公式 Firecrawl Plugin がそのフォールバックを提供します。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Web Fetch](/ja-JP/tools/web-fetch) -- Firecrawl フォールバック付きの web_fetch ツール
- [Tavily](/ja-JP/tools/tavily) -- 検索 + 抽出ツール
