---
read_when:
    - URLを取得して読みやすいコンテンツを抽出したい
    - web_fetch またはその Firecrawl フォールバックを設定する必要があります
    - web_fetch の制限とキャッシュについて理解したい
sidebarTitle: Web Fetch
summary: web_fetch ツール -- 読みやすいコンテンツ抽出付きの HTTP フェッチ
title: Web fetch
x-i18n:
    generated_at: "2026-07-05T11:54:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` はプレーンな HTTP GET を実行し、読み取り可能なコンテンツ（HTML から
markdown またはテキスト）を抽出します。JavaScript は実行**しません**。JS が多いサイトや
ログイン保護されたページでは、代わりに [Web Browser](/ja-JP/tools/browser) を使用してください。

## クイックスタート

デフォルトで有効で、設定は不要です。

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
出力をこの文字数に切り詰めます。`tools.web.fetch.maxCharsCap` にクランプされます。
</ParamField>

## 仕組み

<Steps>
  <Step title="Fetch">
    Chrome 風の User-Agent と `Accept-Language`
    ヘッダーで HTTP GET を送信します。プライベート/内部ホスト名をブロックし、リダイレクトを再チェックします。
  </Step>
  <Step title="Extract">
    HTML レスポンスに対して Readability（メインコンテンツ抽出）を実行します。
  </Step>
  <Step title="Fallback (optional)">
    Readability が失敗し、fetch provider が利用可能な場合は、その provider 経由で再試行します
    （例: Firecrawl のボット回避モード）。
  </Step>
  <Step title="Cache">
    同じ URL の繰り返し取得を減らすため、結果は 15 分間（設定可能）キャッシュされます。
  </Step>
</Steps>

## 進行状況の更新

`web_fetch` は、取得が 5 秒後もまだ保留中の場合にのみ、公開の進行状況行を出力します。

```text
Fetching page content...
```

高速なキャッシュヒットや素早いネットワークレスポンスはタイマーが発火する前に完了するため、
進行状況行は表示されません。呼び出しをキャンセルするとタイマーがクリアされます。この
進行状況行はチャネル UI 状態のみであり、取得したページコンテンツを含むことはありません。

## 設定

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000, // default output chars; capped by maxCharsCap
        maxCharsCap: 20000, // hard cap for maxChars param
        maxResponseBytes: 750000, // max download size before truncation (32000-10000000)
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

Readability 抽出が失敗した場合、`web_fetch` はボット回避とより良い抽出のために
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
            // apiKey: "fc-...", // optional; omit for keyless starter access
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // cache duration (2 days)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` は任意で、SecretRef オブジェクトをサポートします。
レガシーの `tools.web.fetch.firecrawl.*` 設定は、`openclaw doctor --fix` によって
`plugins.entries.firecrawl.config.webFetch` へ自動移行されます。

<Note>
  Firecrawl API キー SecretRef を設定していて、それが解決されず、
  `FIRECRAWL_API_KEY` env フォールバックもない場合、Gateway の起動は即座に失敗します。
</Note>

<Note>
  Firecrawl の `baseUrl` オーバーライドは制限されています。ホストされたトラフィックは
  `https://api.firecrawl.dev` を使用します。セルフホストのオーバーライドはプライベートまたは
  内部エンドポイントを対象にする必要があり、`http://` はそれらのプライベートターゲットに対してのみ受け入れられます。
</Note>

現在のランタイム動作:

- `tools.web.fetch.provider` は fetch フォールバック provider を明示的に選択します。
- `provider` が省略された場合、OpenClaw は設定済み認証情報から最初に準備完了になった web-fetch
  provider を自動検出します。サンドボックス化されていない `web_fetch` は、
  `contracts.webFetchProviders` を宣言し、実行時に一致する provider を登録する
  インストール済み plugins を使用できます。公式 Firecrawl plugin は現在この
  フォールバックを提供します。
- サンドボックス化された `web_fetch` 呼び出しでは、バンドル済み provider と、公式 npm または
  ClawHub の由来が検証されたインストール済み provider が許可されます。現在は
  公式 Firecrawl plugin が許可され、サードパーティの外部 fetch plugins は除外されたままです。
- Readability が無効な場合、`web_fetch` は選択された provider フォールバックへ直接進みます。
  provider が利用できない場合は fail closed します。

## 信頼済み env proxy

デプロイ環境で `web_fetch` が信頼済みのアウトバウンド
HTTP(S) proxy を経由する必要がある場合は、`tools.web.fetch.useTrustedEnvProxy: true` を設定します。

このモードでも、OpenClaw はリクエスト送信前にホスト名ベースの SSRF チェックを適用しますが、
ローカル DNS ピンニングではなく proxy に DNS 解決を任せます。これは proxy が operator によって制御され、
DNS 解決後にアウトバウンドポリシーを適用する場合にのみ有効にしてください。

<Note>
  HTTP(S) proxy env var が設定されていない場合、またはターゲットホストが
  `NO_PROXY` によって除外されている場合、`web_fetch` はローカル DNS
  ピンニングを伴う通常の厳格なパスにフォールバックします。
</Note>

## 制限と安全性

- `maxChars` は `tools.web.fetch.maxCharsCap`（デフォルト `20000`）にクランプされます
- レスポンス本文は解析前に `maxResponseBytes`（デフォルト `750000`、32000-10000000 にクランプ）で上限設定されます。大きすぎるレスポンスは警告付きで切り詰められます
- プライベート/内部ホスト名はブロックされます
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` と
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` は、信頼済み fake-IP proxy スタック向けの
  狭い opt-in です。proxy がそれらの合成レンジを所有し、独自の宛先ポリシーを適用している場合を除き、
  未設定のままにしてください
- リダイレクトはチェックされ、`maxRedirects`（デフォルト `3`）によって制限されます
- `useTrustedEnvProxy` は明示的な opt-in であり、DNS
  解決後もアウトバウンドポリシーを適用する operator 管理の proxy に対してのみ有効にしてください
- `web_fetch` はベストエフォートです。一部のサイトでは [Web Browser](/ja-JP/tools/browser) が必要です

## ツールプロファイル

ツールプロファイルまたは allowlist を使用している場合は、`web_fetch` または `group:web` を追加します。

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## 関連

- [Web Search](/ja-JP/tools/web) -- 複数の provider で Web を検索
- [Web Browser](/ja-JP/tools/browser) -- JS が多いサイト向けの完全なブラウザー自動化
- [Firecrawl](/ja-JP/tools/firecrawl) -- Firecrawl の検索およびスクレイピングツール
