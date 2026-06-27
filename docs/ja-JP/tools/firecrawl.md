---
read_when:
    - Firecrawl を利用した Web 抽出を使いたい
    - キーなしの Firecrawl web_fetch が必要です
    - 検索または上限の引き上げにはFirecrawl APIキーが必要です
    - Firecrawl を web_search プロバイダーとして使いたい場合
    - web_fetch 用のボット対策抽出が必要です
summary: Firecrawl の検索、スクレイピング、web_fetch フォールバック
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T13:13:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw は **Firecrawl** を 3 つの方法で使用できます。

- `web_search` プロバイダーとして
- 明示的な Plugin ツールとして: `firecrawl_search` と `firecrawl_scrape`
- `web_fetch` のフォールバック抽出器として

これは、ボット回避とキャッシュをサポートするホスト型の抽出/検索サービスであり、
JS の多いサイトやプレーンな HTTP fetch をブロックするページに役立ちます。

## Plugin をインストールする

公式 Plugin をインストールし、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## キーなし web_fetch と API キー

明示的に選択されたホスト型 Firecrawl の `web_fetch` フォールバックは、API キーなしのスターター
アクセスをサポートします。より高い制限が必要な場合は、Gateway 環境に
`FIRECRAWL_API_KEY` を追加するか、設定してください。Firecrawl `web_search` と
`firecrawl_scrape` には API キーが必要です。

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

注記:

- オンボーディングまたは `openclaw configure --section web` で Firecrawl を選択すると、インストール済みの Firecrawl Plugin が自動的に有効になります。
- Firecrawl を使う `web_search` は `query` と `count` をサポートします。
- `sources`、`categories`、結果スクレイピングなど Firecrawl 固有の制御には、`firecrawl_search` を使用してください。
- `baseUrl` はデフォルトで `https://api.firecrawl.dev` のホスト型 Firecrawl になります。セルフホストのオーバーライドはプライベート/内部エンドポイントに対してのみ許可されます。HTTP はそれらのプライベートターゲットに対してのみ受け入れられます。
- `FIRECRAWL_BASE_URL` は、Firecrawl 検索とスクレイプのベース URL に対する共有 env フォールバックです。

## Firecrawl web_fetch フォールバックを設定する

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

注記:

- 明示的に選択された Firecrawl `web_fetch` フォールバックは API キーなしで動作します。設定されている場合、OpenClaw はより高い制限のために `plugins.entries.firecrawl.config.webFetch.apiKey` または `FIRECRAWL_API_KEY` を送信します。
- オンボーディング中または `openclaw configure --section web` で Firecrawl を選択すると、別の fetch プロバイダーがすでに設定されていない限り、Plugin が有効になり、`web_fetch` に Firecrawl が選択されます。
- `firecrawl_scrape` には API キーが必要です。
- `maxAgeMs` はキャッシュ結果をどれだけ古いものまで許可するかを制御します (ms)。デフォルトは 2 日です。
- レガシーの `tools.web.fetch.firecrawl.*` 設定は `openclaw doctor --fix` によって自動移行されます。
- Firecrawl のスクレイプ/ベース URL オーバーライドは、検索と同じホスト型/プライベートのルールに従います。公開ホスト型トラフィックは `https://api.firecrawl.dev` を使用します。セルフホストのオーバーライドはプライベート/内部エンドポイントに解決される必要があります。
- `firecrawl_scrape` は、Firecrawl に転送する前に、明らかなプライベート、ループバック、メタデータ、非 HTTP(S) のターゲット URL を拒否し、明示的な Firecrawl スクレイプ呼び出しに対する `web_fetch` のターゲット安全性コントラクトと一致させます。

`firecrawl_scrape` は、必須 API キーを含め、同じ `plugins.entries.firecrawl.config.webFetch.*` 設定と env vars を再利用します。

### セルフホスト Firecrawl

Firecrawl を自分で実行する場合は、`plugins.entries.firecrawl.config.webSearch.baseUrl`、
`plugins.entries.firecrawl.config.webFetch.baseUrl`、または `FIRECRAWL_BASE_URL`
を設定します。OpenClaw は、ループバック、プライベートネットワーク、`.local`、`.internal`、または `.localhost`
ターゲットに対してのみ `http://` を受け入れます。Firecrawl API キーが誤って任意のエンドポイントに
送信されないよう、公開カスタムホストは拒否されます。

## Firecrawl Plugin ツール

### `firecrawl_search`

汎用の `web_search` ではなく、Firecrawl 固有の検索制御を使用したい場合に使用します。

コアパラメーター:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

プレーンな `web_fetch` が弱い、JS の多いページやボット保護されたページに使用します。

コアパラメーター:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## ステルス / ボット回避

Firecrawl は、ボット回避のための **proxy mode** パラメーター (`basic`、`stealth`、または `auto`) を公開しています。
OpenClaw は Firecrawl リクエストに対して常に `proxy: "auto"` と `storeInCache: true` を使用します。
proxy が省略された場合、Firecrawl のデフォルトは `auto` です。`auto` は basic の試行が失敗した場合にステルスプロキシで再試行するため、basic のみのスクレイピングより多くのクレジットを使用する場合があります。

## `web_fetch` が Firecrawl を使用する方法

`web_fetch` の抽出順序:

1. Readability (ローカル)
2. Firecrawl (選択されている場合、または設定済み認証情報から自動検出された場合)
3. 基本 HTML クリーンアップ (最後のフォールバック)

選択ノブは `tools.web.fetch.provider` です。省略すると、OpenClaw は
利用可能な認証情報から最初に準備できた web-fetch プロバイダーを自動検出します。
公式 Firecrawl Plugin がそのフォールバックを提供します。

## 関連

- [Web Search 概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Web Fetch](/ja-JP/tools/web-fetch) -- Firecrawl フォールバック付き web_fetch ツール
- [Tavily](/ja-JP/tools/tavily) -- 検索 + 抽出ツール
