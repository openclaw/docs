---
read_when:
    - Firecrawl を利用した Web 抽出を使いたい
    - Firecrawl APIキーが必要です
    - Firecrawl を web_search プロバイダーとして使いたい場合
    - web_fetch 用のボット対策抽出が必要です
summary: Firecrawl の検索、スクレイピング、および web_fetch フォールバック
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T21:07:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw は **Firecrawl** を 3 つの方法で使用できます。

- `web_search` プロバイダーとして
- 明示的な Plugin ツールとして: `firecrawl_search` と `firecrawl_scrape`
- `web_fetch` のフォールバック抽出器として

これは、ボット回避とキャッシュに対応したホスト型の抽出/検索サービスで、
JS の多いサイトや、通常の HTTP フェッチをブロックするページで役立ちます。

## API キーを取得する

1. Firecrawl アカウントを作成し、API キーを生成します。
2. config に保存するか、Gateway 環境で `FIRECRAWL_API_KEY` を設定します。

## Firecrawl 検索を設定する

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

- オンボーディングまたは `openclaw configure --section web` で Firecrawl を選択すると、同梱の Firecrawl Plugin が自動的に有効になります。
- Firecrawl を使う `web_search` は `query` と `count` に対応しています。
- `sources`、`categories`、結果のスクレイピングなど Firecrawl 固有の制御には、`firecrawl_search` を使用します。
- `baseUrl` のデフォルトは、ホスト型 Firecrawl の `https://api.firecrawl.dev` です。セルフホストの上書きはプライベート/内部エンドポイントに対してのみ許可されます。HTTP はそれらのプライベートターゲットに対してのみ受け入れられます。
- `FIRECRAWL_BASE_URL` は、Firecrawl の検索およびスクレイプのベース URL 用の共有 env フォールバックです。

## Firecrawl スクレイプ + web_fetch フォールバックを設定する

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

注:

- Firecrawl フォールバックの試行は、API キーが利用可能な場合（`plugins.entries.firecrawl.config.webFetch.apiKey` または `FIRECRAWL_API_KEY`）にのみ実行されます。
- `maxAgeMs` はキャッシュ結果をどれだけ古いものまで許可するか（ms）を制御します。デフォルトは 2 日です。
- レガシーの `tools.web.fetch.firecrawl.*` config は、`openclaw doctor --fix` によって自動移行されます。
- Firecrawl のスクレイプ/ベース URL の上書きは、検索と同じホスト型/プライベートのルールに従います。公開ホスト型トラフィックは `https://api.firecrawl.dev` を使用します。セルフホストの上書きは、プライベート/内部エンドポイントに解決される必要があります。
- `firecrawl_scrape` は、明示的な Firecrawl スクレイプ呼び出しについて `web_fetch` のターゲット安全性契約に合わせ、Firecrawl に転送する前に、明らかなプライベート、loopback、メタデータ、および非 HTTP(S) のターゲット URL を拒否します。

`firecrawl_scrape` は、同じ `plugins.entries.firecrawl.config.webFetch.*` 設定と env vars を再利用します。

### セルフホスト Firecrawl

Firecrawl を自分で実行する場合は、`plugins.entries.firecrawl.config.webSearch.baseUrl`、
`plugins.entries.firecrawl.config.webFetch.baseUrl`、または `FIRECRAWL_BASE_URL`
を設定します。OpenClaw は、loopback、プライベートネットワーク、`.local`、`.internal`、または `.localhost` のターゲットに対してのみ `http://` を受け入れます。公開カスタム
ホストは拒否されるため、Firecrawl API キーが誤って任意のエンドポイントに送信されることはありません。

## Firecrawl Plugin ツール

### `firecrawl_search`

汎用の `web_search` ではなく、Firecrawl 固有の検索制御が必要な場合に使用します。

主要パラメーター:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

通常の `web_fetch` が弱い、JS の多いページやボット保護されたページに使用します。

主要パラメーター:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## ステルス / ボット回避

Firecrawl は、ボット回避用の **プロキシモード** パラメーター（`basic`、`stealth`、または `auto`）を公開しています。
OpenClaw は、Firecrawl リクエストに対して常に `proxy: "auto"` と `storeInCache: true` を使用します。
proxy が省略された場合、Firecrawl のデフォルトは `auto` です。`auto` は、基本的な試行が失敗した場合にステルスプロキシで再試行するため、basic のみのスクレイピングより多くのクレジットを使用する場合があります。

## `web_fetch` が Firecrawl を使用する仕組み

`web_fetch` の抽出順序:

1. Readability（ローカル）
2. Firecrawl（アクティブな web-fetch フォールバックとして選択または自動検出された場合）
3. 基本的な HTML クリーンアップ（最後のフォールバック）

選択ノブは `tools.web.fetch.provider` です。省略した場合、OpenClaw は利用可能な認証情報から最初の準備済み web-fetch プロバイダーを自動検出します。
現在、同梱プロバイダーは Firecrawl です。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Web Fetch](/ja-JP/tools/web-fetch) -- Firecrawl フォールバック付きの web_fetch ツール
- [Tavily](/ja-JP/tools/tavily) -- 検索 + 抽出ツール
