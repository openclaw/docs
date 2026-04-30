---
read_when:
    - URLを取得して読みやすいコンテンツを抽出したい場合
    - web_fetch またはその Firecrawl フォールバックを設定する必要があります
    - web_fetch の制限とキャッシュを理解したい
sidebarTitle: Web Fetch
summary: web_fetch ツール -- 読みやすいコンテンツの抽出に対応した HTTP フェッチ
title: Web 取得
x-i18n:
    generated_at: "2026-04-30T05:40:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` ツールは通常の HTTP GET を実行し、読み取り可能な内容
（HTML から markdown またはテキスト）を抽出します。JavaScript は**実行しません**。

JS を多用するサイトやログイン保護されたページには、代わりに
[Web ブラウザー](/ja-JP/tools/browser)を使用してください。

## クイックスタート

`web_fetch` は**デフォルトで有効**です -- 設定は不要です。エージェントは
すぐに呼び出せます。

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## ツールパラメーター

<ParamField path="url" type="string" required>
取得する URL。`http(s)` のみ。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
メインコンテンツ抽出後の出力形式。
</ParamField>

<ParamField path="maxChars" type="number">
出力をこの文字数までに切り詰めます。
</ParamField>

## 仕組み

<Steps>
  <Step title="取得">
    Chrome に似た User-Agent と `Accept-Language` ヘッダーで HTTP GET を送信します。
    プライベート/内部ホスト名をブロックし、リダイレクトを再チェックします。
  </Step>
  <Step title="抽出">
    HTML レスポンスに対して Readability（メインコンテンツ抽出）を実行します。
  </Step>
  <Step title="フォールバック（任意）">
    Readability が失敗し、Firecrawl が設定されている場合は、
    ボット回避モードで Firecrawl API 経由で再試行します。
  </Step>
  <Step title="キャッシュ">
    同じ URL の繰り返し取得を減らすため、結果は 15 分間（設定可能）キャッシュされます。
  </Step>
</Steps>

## 設定

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Firecrawl フォールバック

Readability 抽出に失敗した場合、`web_fetch` はボット回避とより良い抽出のために
[Firecrawl](/ja-JP/tools/firecrawl)へフォールバックできます。

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` は SecretRef オブジェクトをサポートします。
従来の `tools.web.fetch.firecrawl.*` 設定は `openclaw doctor --fix` によって自動移行されます。

<Note>
  Firecrawl が有効で、その SecretRef が解決されておらず、
  `FIRECRAWL_API_KEY` env フォールバックもない場合、gateway の起動は即座に失敗します。
</Note>

<Note>
  Firecrawl の `baseUrl` オーバーライドは制限されています。`https://` と
  公式 Firecrawl ホスト（`api.firecrawl.dev`）を使用する必要があります。
</Note>

現在のランタイム動作:

- `tools.web.fetch.provider` は取得フォールバックプロバイダーを明示的に選択します。
- `provider` が省略された場合、OpenClaw は利用可能な認証情報から最初に準備できている
  web-fetch プロバイダーを自動検出します。現在、同梱プロバイダーは Firecrawl です。
- Readability が無効になっている場合、`web_fetch` は選択されたプロバイダーの
  フォールバックへ直接進みます。利用可能なプロバイダーがない場合は、閉じた状態で失敗します。

## 制限と安全性

- `maxChars` は `tools.web.fetch.maxCharsCap` に制限されます
- レスポンス本文は解析前に `maxResponseBytes` で上限が設定されます。サイズ超過の
  レスポンスは警告付きで切り詰められます
- プライベート/内部ホスト名はブロックされます
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` と
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` は、信頼された fake-IP プロキシスタック向けの限定的なオプトインです。プロキシが
  これらの合成範囲を所有し、独自の宛先ポリシーを強制している場合以外は未設定のままにしてください
- リダイレクトはチェックされ、`maxRedirects` で制限されます
- `web_fetch` はベストエフォートです -- 一部のサイトでは [Web ブラウザー](/ja-JP/tools/browser)が必要です

## ツールプロファイル

ツールプロファイルや許可リストを使用する場合は、`web_fetch` または `group:web` を追加します。

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## 関連

- [Web 検索](/ja-JP/tools/web) -- 複数のプロバイダーで Web を検索します
- [Web ブラウザー](/ja-JP/tools/browser) -- JS を多用するサイト向けの完全なブラウザー自動化
- [Firecrawl](/ja-JP/tools/firecrawl) -- Firecrawl の検索およびスクレイピングツール
