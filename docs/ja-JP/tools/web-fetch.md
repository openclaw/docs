---
read_when:
    - URL を取得して読みやすいコンテンツを抽出したい
    - web_fetch またはその Firecrawl フォールバックを設定する必要があります
    - web_fetch の制限とキャッシュを理解したい
sidebarTitle: Web Fetch
summary: web_fetch ツール -- 読みやすいコンテンツ抽出を伴う HTTP フェッチ
title: Web fetch
x-i18n:
    generated_at: "2026-06-27T13:22:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` ツールは通常の HTTP GET を実行し、読み取り可能なコンテンツを抽出します
（HTML を Markdown またはテキストに変換）。JavaScript は**実行しません**。

JS に大きく依存するサイトやログイン保護されたページには、代わりに
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
本文抽出後の出力形式。
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
    HTML レスポンスに対して Readability（本文抽出）を実行します。
  </Step>
  <Step title="Fallback (optional)">
    Readability が失敗し、Firecrawl が選択されている場合は、ボット回避モードで
    Firecrawl API 経由で再試行します。
  </Step>
  <Step title="Cache">
    同じ URL の繰り返し取得を減らすため、結果は 15 分間（設定可能）キャッシュされます。
  </Step>
</Steps>

## 進行状況の更新

`web_fetch` は、取得が 5 秒後もまだ保留中の場合にのみ公開の進行状況行を出力します。

```text
Fetching page content...
```

高速なキャッシュヒットや素早いネットワーク応答はタイマー発火前に完了するため、
進行状況行は表示されません。呼び出しがキャンセルされると、タイマーはクリアされます。
取得が最終的に完了すると、エージェントは通常のツール結果を受け取ります。
進行状況行はチャンネル UI 状態にすぎず、取得したページ内容を含むことはありません。

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

Readability 抽出が失敗した場合、`web_fetch` はボット回避とより良い抽出のために
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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` は任意で、SecretRef オブジェクトをサポートします。
従来の `tools.web.fetch.firecrawl.*` 設定は `openclaw doctor --fix` によって自動移行されます。

<Note>
  Firecrawl API キーの SecretRef を設定していて、それが解決されず、
  `FIRECRAWL_API_KEY` env フォールバックもない場合、gateway 起動は即座に失敗します。
</Note>

<Note>
  Firecrawl の `baseUrl` オーバーライドは制限されています。ホストされたトラフィックは
  `https://api.firecrawl.dev` を使用します。セルフホストのオーバーライドはプライベートまたは
  内部エンドポイントを対象にする必要があり、`http://` はそれらのプライベート対象にのみ受け入れられます。
</Note>

現在のランタイム動作:

- `tools.web.fetch.provider` は取得フォールバックプロバイダーを明示的に選択します。
- `provider` が省略されている場合、OpenClaw は設定済み認証情報から最初に準備できた web-fetch
  プロバイダーを自動検出します。サンドボックス化されていない `web_fetch` は、
  `contracts.webFetchProviders` を宣言し、ランタイムで一致するプロバイダーを登録する
  インストール済み plugins を使用できます。公式 Firecrawl plugin がこのフォールバックを提供します。
- サンドボックス化された `web_fetch` 呼び出しは、バンドル済みプロバイダーに加えて、
  公式 npm または ClawHub の来歴が検証されたインストール済みプロバイダーを許可します。
  現時点では公式 Firecrawl plugin が許可されます。サードパーティの外部取得 plugins は除外されたままです。
- Readability が無効な場合、`web_fetch` は選択されたプロバイダーフォールバックへ直接進みます。
  利用可能なプロバイダーがない場合は、フェイルクローズします。

## 信頼済み env プロキシ

デプロイで `web_fetch` が信頼済みのアウトバウンド HTTP(S) プロキシを経由する必要がある場合は、
`tools.web.fetch.useTrustedEnvProxy: true` を設定します。

このモードでも、OpenClaw はリクエスト送信前にホスト名ベースの SSRF チェックを適用しますが、
ローカル DNS ピン留めを行わず、プロキシに DNS 解決を任せます。これは、プロキシがオペレーター管理下にあり、
DNS 解決後にアウトバウンドポリシーを適用する場合にのみ有効にしてください。

<Note>
  HTTP(S) プロキシ env 変数が設定されていない場合、または対象ホストが
  `NO_PROXY` によって除外されている場合、`web_fetch` はローカル DNS ピン留めを伴う通常の厳格なパスへフォールバックします。
</Note>

## 制限と安全性

- `maxChars` は `tools.web.fetch.maxCharsCap` に丸められます
- レスポンス本文は解析前に `maxResponseBytes` で上限が設定されます。大きすぎるレスポンスは警告付きで切り詰められます
- プライベート/内部ホスト名はブロックされます
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` と
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` は、信頼済み fake-IP プロキシスタック向けの限定的なオプトインです。
  プロキシがそれらの合成範囲を所有し、独自の宛先ポリシーを適用している場合を除き、未設定のままにしてください
- リダイレクトはチェックされ、`maxRedirects` によって制限されます
- `useTrustedEnvProxy` は明示的なオプトインであり、DNS 解決後もアウトバウンドポリシーを適用する
  オペレーター管理下のプロキシに対してのみ有効にするべきです
- `web_fetch` はベストエフォートです -- 一部のサイトでは [Web ブラウザー](/ja-JP/tools/browser)が必要です

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

- [Web 検索](/ja-JP/tools/web) -- 複数のプロバイダーで Web を検索
- [Web ブラウザー](/ja-JP/tools/browser) -- JS に大きく依存するサイト向けのフルブラウザー自動化
- [Firecrawl](/ja-JP/tools/firecrawl) -- Firecrawl の検索およびスクレイピングツール
