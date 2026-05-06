---
read_when:
    - URLを取得し、読みやすいコンテンツを抽出したい場合
    - web_fetch またはその Firecrawl フォールバックを設定する必要があります
    - web_fetch の制限とキャッシュを理解したい場合
sidebarTitle: Web Fetch
summary: web_fetch ツール -- 読みやすいコンテンツ抽出付きの HTTP フェッチ
title: ウェブ取得
x-i18n:
    generated_at: "2026-05-06T18:00:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` ツールは通常の HTTP GET を実行し、読み取り可能なコンテンツを抽出します
（HTML から markdown または text）。JavaScript は実行**しません**。

JS が多用されているサイトやログイン保護されたページには、代わりに
[Webブラウザー](/ja-JP/tools/browser) を使用してください。

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
    プライベート/内部ホスト名をブロックし、リダイレクトを再チェックします。
  </Step>
  <Step title="Extract">
    HTML レスポンスに対して Readability（メインコンテンツ抽出）を実行します。
  </Step>
  <Step title="Fallback (optional)">
    Readability が失敗し、Firecrawl が設定されている場合は、bot 回避モードで
    Firecrawl API 経由で再試行します。
  </Step>
  <Step title="Cache">
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
レガシーの `tools.web.fetch.firecrawl.*` 設定は `openclaw doctor --fix` によって自動移行されます。

<Note>
  Firecrawl が有効で、その SecretRef が解決されず、`FIRECRAWL_API_KEY` env フォールバックもない場合、
  gateway の起動は早期に失敗します。
</Note>

<Note>
  Firecrawl の `baseUrl` オーバーライドは制限されています。ホスト型トラフィックは
  `https://api.firecrawl.dev` を使用します。セルフホストのオーバーライドはプライベートまたは
  内部エンドポイントを対象にする必要があり、`http://` はそれらのプライベート対象にのみ受け入れられます。
</Note>

現在のランタイム動作:

- `tools.web.fetch.provider` は取得フォールバックプロバイダーを明示的に選択します。
- `provider` が省略された場合、OpenClaw は利用可能な認証情報から、準備済みの最初の web-fetch
  プロバイダーを自動検出します。サンドボックス外の `web_fetch` は、
  `contracts.webFetchProviders` を宣言し、実行時に一致するプロバイダーを登録する
  インストール済み plugins を使用できます。現在、バンドルされているプロバイダーは Firecrawl です。
- サンドボックス化された `web_fetch` 呼び出しは、バンドルされたプロバイダーに限定されたままです。
- Readability が無効な場合、`web_fetch` は選択されたプロバイダーフォールバックへ直接進みます。
  利用可能なプロバイダーがない場合は、クローズドに失敗します。

## 信頼済み env プロキシ

デプロイで `web_fetch` が信頼済みのアウトバウンド HTTP(S) プロキシを通る必要がある場合は、
`tools.web.fetch.useTrustedEnvProxy: true` を設定します。

このモードでも、OpenClaw はリクエスト送信前にホスト名ベースの SSRF チェックを適用しますが、
ローカル DNS ピンニングを行う代わりに、プロキシに DNS 解決を任せます。
これは、プロキシが運用者によって管理され、DNS 解決後にアウトバウンドポリシーを強制する場合にのみ有効にしてください。

<Note>
  HTTP(S) プロキシ env var が設定されていない場合、または対象ホストが `NO_PROXY` によって除外されている場合、
  `web_fetch` は local DNS ピンニングを使用する通常の厳格なパスにフォールバックします。
</Note>

## 制限と安全性

- `maxChars` は `tools.web.fetch.maxCharsCap` にクランプされます
- レスポンス本文は解析前に `maxResponseBytes` で上限設定されます。過大な
  レスポンスは警告付きで切り詰められます
- プライベート/内部ホスト名はブロックされます
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` と
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` は、信頼済みの fake-IP プロキシスタック向けの狭いオプトインです。
  それらの合成範囲をプロキシが所有し、独自の宛先ポリシーを強制している場合を除き、未設定のままにしてください
- リダイレクトはチェックされ、`maxRedirects` によって制限されます
- `useTrustedEnvProxy` は明示的なオプトインであり、DNS 解決後もアウトバウンドポリシーを強制する
  運用者管理のプロキシに対してのみ有効にしてください
- `web_fetch` はベストエフォートです -- 一部のサイトには [Webブラウザー](/ja-JP/tools/browser) が必要です

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

- [Web検索](/ja-JP/tools/web) -- 複数のプロバイダーで Web を検索
- [Webブラウザー](/ja-JP/tools/browser) -- JS が多用されているサイト向けの完全なブラウザー自動化
- [Firecrawl](/ja-JP/tools/firecrawl) -- Firecrawl の検索およびスクレイピングツール
