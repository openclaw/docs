---
read_when:
    - URLを取得して読み取りやすいコンテンツを抽出したい場合
    - web_fetch またはその Firecrawl フォールバックを設定する必要があります
    - web_fetch の制限とキャッシュについて理解したい
sidebarTitle: Web Fetch
summary: web_fetch ツール -- 読みやすいコンテンツ抽出を伴う HTTP 取得
title: ウェブ取得
x-i18n:
    generated_at: "2026-05-04T05:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` ツールは通常の HTTP GET を行い、読み取り可能なコンテンツを抽出します
(HTML を markdown または text に変換)。JavaScript は実行**しません**。

JS を多用するサイトやログイン保護されたページには、代わりに
[Web Browser](/ja-JP/tools/browser) を使用してください。

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
出力をこの文字数に切り詰めます。
</ParamField>

## 仕組み

<Steps>
  <Step title="Fetch">
    Chrome 風の User-Agent と `Accept-Language` ヘッダーで HTTP GET を送信します。
    private/internal ホスト名をブロックし、リダイレクトを再チェックします。
  </Step>
  <Step title="Extract">
    HTML レスポンスに対して Readability (メインコンテンツ抽出) を実行します。
  </Step>
  <Step title="Fallback (optional)">
    Readability が失敗し、Firecrawl が設定されている場合は、bot 回避モードで
    Firecrawl API 経由で再試行します。
  </Step>
  <Step title="Cache">
    同じ URL の繰り返し取得を減らすため、結果は 15 分間 (設定可能) キャッシュされます。
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

Readability 抽出が失敗した場合、`web_fetch` は bot 回避とより優れた抽出のために
[Firecrawl](/ja-JP/tools/firecrawl) へフォールバックできます。

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
  Firecrawl が有効で、その SecretRef が解決されず、`FIRECRAWL_API_KEY` env フォールバックもない場合、
  gateway 起動は即座に失敗します。
</Note>

<Note>
  Firecrawl の `baseUrl` オーバーライドはロックダウンされています。ホスト型トラフィックは
  `https://api.firecrawl.dev` を使用します。セルフホストのオーバーライドは private または
  internal エンドポイントを対象にする必要があり、`http://` はそれらの private ターゲットでのみ受け入れられます。
</Note>

現在のランタイム動作:

- `tools.web.fetch.provider` は取得フォールバックプロバイダーを明示的に選択します。
- `provider` が省略された場合、OpenClaw は利用可能な認証情報から、最初に準備済みの web-fetch
  プロバイダーを自動検出します。非サンドボックスの `web_fetch` は、`contracts.webFetchProviders` を宣言し、ランタイムで
  一致するプロバイダーを登録するインストール済み plugins を使用できます。現在の同梱プロバイダーは Firecrawl です。
- サンドボックス化された `web_fetch` 呼び出しは、同梱プロバイダーに限定されたままです。
- Readability が無効な場合、`web_fetch` は選択されたプロバイダーフォールバックへ直接進みます。
  利用可能なプロバイダーがない場合は、閉じた状態で失敗します。

## 信頼済み環境プロキシ

デプロイ環境で、`web_fetch` が信頼済みの送信
HTTP(S) プロキシを経由する必要がある場合は、`tools.web.fetch.useTrustedEnvProxy: true` を設定します。

このモードでは、OpenClaw はリクエスト送信前にホスト名ベースの SSRF チェックを引き続き適用しますが、
ローカル DNS ピン留めを行う代わりに、プロキシに DNS 解決を任せます。
これは、プロキシがオペレーター管理であり、DNS 解決後に送信ポリシーを適用する場合にのみ有効にしてください。

<Note>
  HTTP(S) プロキシ env var が設定されていない場合、または対象ホストが `NO_PROXY` によって除外されている場合、
  `web_fetch` は local DNS ピン留めを使う通常の厳格なパスにフォールバックします。
</Note>

## 制限と安全性

- `maxChars` は `tools.web.fetch.maxCharsCap` に制限されます
- レスポンス本文は解析前に `maxResponseBytes` で上限設定されます。サイズ超過の
  レスポンスは警告付きで切り詰められます
- Private/internal ホスト名はブロックされます
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` と
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` は、信頼済み fake-IP プロキシスタック用の限定的なオプトインです。
  プロキシがそれらの合成範囲を所有し、独自の宛先ポリシーを適用している場合を除き、未設定のままにしてください
- リダイレクトはチェックされ、`maxRedirects` によって制限されます
- `useTrustedEnvProxy` は明示的なオプトインであり、DNS 解決後も送信ポリシーを適用する
  オペレーター管理プロキシでのみ有効にしてください
- `web_fetch` はベストエフォートです -- 一部のサイトには [Web Browser](/ja-JP/tools/browser) が必要です

## ツールプロファイル

ツールプロファイルまたは許可リストを使用する場合は、`web_fetch` または `group:web` を追加します。

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## 関連

- [Web Search](/ja-JP/tools/web) -- 複数のプロバイダーで web を検索する
- [Web Browser](/ja-JP/tools/browser) -- JS を多用するサイト向けの完全なブラウザー自動化
- [Firecrawl](/ja-JP/tools/firecrawl) -- Firecrawl 検索および scrape ツール
