---
read_when:
    - Firecrawl を利用した Web 抽出を行いたい場合
    - キー不要の Firecrawl `web_fetch` を使用する
    - 検索または上限の引き上げには Firecrawl API キーが必要です
    - web_search プロバイダーとして Firecrawl を使用したい場合
    - web_fetch のボット対策回避抽出が必要です
summary: Firecrawl の検索、スクレイピング、web_fetch フォールバック
title: Firecrawl
x-i18n:
    generated_at: "2026-07-11T22:46:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw は **Firecrawl** を3つの方法で使用できます。

- `web_search` プロバイダーとして
- 明示的な Plugin ツールとして：`firecrawl_search` と `firecrawl_scrape`
- `web_fetch` のフォールバック抽出機能として

これは、ボット回避とキャッシュに対応するホステッド型の抽出／検索サービスです。JavaScript を多用するサイトや、通常の HTTP フェッチをブロックするページで役立ちます。

## Plugin のインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## API キーなしの web_fetch と API キー

明示的に選択したホステッド Firecrawl の `web_fetch` フォールバックでは、API キーなしでスターターアクセスを利用できます。より高い上限が必要な場合は、Gateway 環境に `FIRECRAWL_API_KEY` を追加するか、設定で指定します。Firecrawl の `web_search` と `firecrawl_scrape` には API キーが必要です。

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

注：

- オンボーディングまたは `openclaw configure --section web` で Firecrawl を選択すると、インストール済みの Firecrawl Plugin が自動的に有効になります。
- Firecrawl を使用する `web_search` は、`query` と `count` に対応しています。
- `sources`、`categories`、検索結果のスクレイピングなど、Firecrawl 固有の制御には `firecrawl_search` を使用します。
- `baseUrl` のデフォルトは、`https://api.firecrawl.dev` のホステッド Firecrawl です。セルフホストのオーバーライドはプライベート／内部エンドポイントにのみ許可され、HTTP もそれらのプライベートな接続先にのみ使用できます。
- `FIRECRAWL_BASE_URL` は、Firecrawl の検索およびスクレイピングのベース URL に共通して使用される環境変数のフォールバックです。
- Firecrawl の検索リクエストのデフォルトタイムアウトは30秒です。`firecrawl_search` の `timeoutSeconds` パラメーターを指定すると、呼び出しごとに上書きできます。

## Firecrawl の web_fetch フォールバックの設定

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 明示的に選択すると、API キーなしのフォールバックが有効になります
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

注：

- 明示的に選択した Firecrawl の `web_fetch` フォールバックは、API キーなしで動作します。設定されている場合、OpenClaw はより高い上限を利用するために `plugins.entries.firecrawl.config.webFetch.apiKey` または `FIRECRAWL_API_KEY` を送信します。
- オンボーディング中または `openclaw configure --section web` で Firecrawl を選択すると、Plugin が有効になり、別のフェッチプロバイダーがすでに設定されていない限り、`web_fetch` に Firecrawl が選択されます。
- `firecrawl_scrape` には API キーが必要です。
- `maxAgeMs` は、キャッシュされた結果をどの程度古くまで使用できるかをミリ秒単位で制御します。デフォルトは 172,800,000 ミリ秒（2日間）です。
- `onlyMainContent` のデフォルトは `true`、`timeoutSeconds` のデフォルトは 60 です。
- 旧形式の `tools.web.fetch.firecrawl.*` および `tools.web.search.firecrawl.*` の設定は、`openclaw doctor --fix` によって自動的に移行されます。
- Firecrawl のスクレイピング／ベース URL のオーバーライドには、検索と同じホステッド／プライベート規則が適用されます。公開ホステッドトラフィックでは `https://api.firecrawl.dev` を使用し、セルフホストのオーバーライドはプライベート／内部エンドポイントに解決される必要があります。
- `firecrawl_scrape` は、Firecrawl に転送する前に、明らかなプライベート、ループバック、メタデータ、および HTTP(S) 以外の接続先 URL を拒否します。これは、明示的な Firecrawl スクレイピング呼び出しに対する `web_fetch` の接続先安全性契約と一致します。

`firecrawl_scrape` は、必須の API キーを含め、同じ `plugins.entries.firecrawl.config.webFetch.*` 設定と環境変数を再利用します。

### セルフホスト Firecrawl

Firecrawl を自分で実行する場合は、`plugins.entries.firecrawl.config.webSearch.baseUrl`、`plugins.entries.firecrawl.config.webFetch.baseUrl`、または `FIRECRAWL_BASE_URL` を設定します。OpenClaw は、ループバック、プライベートネットワーク、`.local`、`.internal`、または `.localhost` の接続先に限り、`http://` を許可します。Firecrawl の API キーが誤って任意のエンドポイントへ送信されないよう、公開カスタムホストは拒否されます。

## Firecrawl Plugin ツール

### `firecrawl_search`

汎用の `web_search` ではなく、Firecrawl 固有の検索制御を使用する場合に使用します。

パラメーター：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

通常の `web_fetch` では十分に処理できない、JavaScript を多用するページやボット対策されたページに使用します。

パラメーター：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## ステルス／ボット回避

呼び出し元がこれらのパラメーターを上書きしない限り、`firecrawl_scrape` と `web_fetch` の Firecrawl フォールバックでは、デフォルトで `proxy: "auto"` と `storeInCache: true` が使用されます。`firecrawl_search` と `web_search` の Firecrawl プロバイダーには `proxy`／`storeInCache` の制御はありません。ステルスプロキシモードは、スクレイピング／フェッチリクエストにのみ適用されます。

Firecrawl の `proxy` モードは、ボット回避を制御します（`basic`、`stealth`、または `auto`）。`auto` は基本的な試行が失敗するとステルスプロキシで再試行するため、基本スクレイピングのみの場合より多くのクレジットを使用する可能性があります。

## `web_fetch` での Firecrawl の使用方法

`web_fetch` の抽出順序：

1. Readability（ローカル）
2. Firecrawl など、設定済みのフェッチプロバイダー（選択されている場合、または設定済みの認証情報から自動検出された場合）
3. 基本的な HTML クリーンアップ（最後のフォールバック）

選択に使用する設定は `tools.web.fetch.provider` です。省略した場合、OpenClaw は利用可能な認証情報から、準備が整っている最初の Web フェッチプロバイダーを自動検出します。公式 Firecrawl Plugin がそのフォールバックを提供します。

## 関連項目

- [Web 検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Web フェッチ](/ja-JP/tools/web-fetch) -- Firecrawl フォールバックを備えた `web_fetch` ツール
- [Tavily](/ja-JP/tools/tavily) -- 検索＋抽出ツール
