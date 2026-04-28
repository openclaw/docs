---
read_when:
    - URL を取得して readable なコンテンツを抽出したい場合
    - web_fetch またはその Firecrawl フォールバックを設定する必要があります
    - web_fetch の制限とキャッシュを理解したい場合
sidebarTitle: Web Fetch
summary: web_fetch ツール -- readable コンテンツ抽出付き HTTP fetch
title: Web fetch
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T05:27:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

`web_fetch` ツールは、通常の HTTP GET を行い、readable なコンテンツ
（HTML を markdown または text に変換）を抽出します。JavaScript は**実行しません**。

JS を多用するサイトやログイン保護されたページでは、
代わりに [Web Browser](/ja-JP/tools/browser) を使ってください。

## クイックスタート

`web_fetch` は **デフォルトで有効** です -- 設定は不要です。エージェントは
すぐに呼び出せます:

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
この文字数まで出力を切り詰めます。
</ParamField>

## 仕組み

<Steps>
  <Step title="取得">
    Chrome 風の User-Agent と `Accept-Language`
    ヘッダーを付けて HTTP GET を送信します。private/internal hostname をブロックし、redirect も再チェックします。
  </Step>
  <Step title="抽出">
    HTML レスポンスに対して Readability（メインコンテンツ抽出）を実行します。
  </Step>
  <Step title="フォールバック（任意）">
    Readability が失敗し、Firecrawl が設定されている場合、
    bot-circumvention mode で Firecrawl API 経由にリトライします。
  </Step>
  <Step title="キャッシュ">
    同じ URL の繰り返し取得を減らすため、結果は 15 分間キャッシュされます（設定可能）。
  </Step>
</Steps>

## config

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
      },
    },
  },
}
```

## Firecrawl フォールバック

Readability 抽出が失敗した場合、`web_fetch` は
bot-circumvention とより良い抽出のために [Firecrawl](/ja-JP/tools/firecrawl) にフォールバックできます。

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

`plugins.entries.firecrawl.config.webFetch.apiKey` は SecretRef object をサポートします。
レガシーな `tools.web.fetch.firecrawl.*` config は `openclaw doctor --fix` により自動移行されます。

<Note>
  Firecrawl が有効で、その SecretRef が未解決かつ
  `FIRECRAWL_API_KEY` の env fallback もない場合、gateway の起動は fail fast します。
</Note>

<Note>
  Firecrawl `baseUrl` 上書きは制限されています。`https://` と
  公式 Firecrawl host（`api.firecrawl.dev`）を使わなければなりません。
</Note>

現在の runtime 挙動:

- `tools.web.fetch.provider` は fetch フォールバック provider を明示的に選択します。
- `provider` が省略されている場合、OpenClaw は利用可能な認証情報から最初に ready な web-fetch
  provider を自動検出します。現在の bundled provider は Firecrawl です。
- Readability が無効な場合、`web_fetch` は選択された
  provider fallback へ直接進みます。利用可能な provider がなければ fail closed します。

## 制限と安全性

- `maxChars` は `tools.web.fetch.maxCharsCap` にクランプされます
- レスポンス body は parse 前に `maxResponseBytes` で上限設定されます。過大な
  レスポンスは警告付きで切り詰められます
- private/internal hostname はブロックされます
- redirect はチェックされ、`maxRedirects` によって制限されます
- `web_fetch` はベストエフォートです -- 一部のサイトでは [Web Browser](/ja-JP/tools/browser) が必要です

## ツールプロファイル

ツールプロファイルまたは allowlist を使っている場合は、`web_fetch` または `group:web` を追加してください。

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## 関連

- [Web Search](/ja-JP/tools/web) -- 複数 provider で web を検索する
- [Web Browser](/ja-JP/tools/browser) -- JS を多用するサイト向けの完全な browser automation
- [Firecrawl](/ja-JP/tools/firecrawl) -- Firecrawl 検索・スクレイプツール
