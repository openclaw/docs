---
read_when:
    - URLを取得して読みやすいコンテンツを抽出したい場合
    - web_fetch またはその Firecrawl フォールバックを設定する必要があります
    - web_fetchの制限とキャッシュについて理解したい場合
sidebarTitle: Web Fetch
summary: web_fetch ツール -- 読みやすいコンテンツ抽出を伴う HTTP フェッチ
title: ウェブ取得
x-i18n:
    generated_at: "2026-07-11T22:49:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` は通常の HTTP GET を実行し、読みやすいコンテンツ（HTML から
Markdown またはテキスト）を抽出します。JavaScript は実行しません。JS を多用するサイトや
ログインで保護されたページには、代わりに [Web Browser](/ja-JP/tools/browser) を使用してください。

## クイックスタート

デフォルトで有効になっており、設定は不要です。

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## ツールのパラメータ

<ParamField path="url" type="string" required>
取得する URL。`http(s)` のみ。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
メインコンテンツ抽出後の出力形式。
</ParamField>

<ParamField path="maxChars" type="number">
出力をこの文字数に切り詰めます。`tools.web.fetch.maxCharsCap` を上限とします。
</ParamField>

## 仕組み

<Steps>
  <Step title="取得">
    Chrome に似た User-Agent と `Accept-Language` ヘッダーを使用して HTTP GET を送信します。
    プライベートまたは内部ホスト名をブロックし、リダイレクト先を再確認します。
  </Step>
  <Step title="抽出">
    HTML レスポンスに対して Readability（メインコンテンツ抽出）を実行します。
  </Step>
  <Step title="フォールバック（任意）">
    Readability が失敗し、取得プロバイダーが利用可能な場合は、そのプロバイダーを介して
    再試行します（たとえば、Firecrawl のボット回避モード）。
  </Step>
  <Step title="キャッシュ">
    同じ URL の繰り返し取得を減らすため、結果を 15 分間（設定可能）キャッシュします。
  </Step>
</Steps>

## 進捗の更新

`web_fetch` は、5 秒経過しても取得が保留中の場合にのみ、公開の進捗行を出力します。

```text
ページのコンテンツを取得しています...
```

高速なキャッシュヒットや短時間のネットワークレスポンスはタイマーが作動する前に完了するため、
進捗行は表示されません。呼び出しをキャンセルするとタイマーはクリアされます。
進捗行はチャンネル UI の状態のみを示し、取得したページのコンテンツを含むことはありません。

## 設定

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // デフォルト: true
        provider: "firecrawl", // 任意。自動検出する場合は省略
        maxChars: 20000, // デフォルトの出力文字数。maxCharsCap が上限
        maxCharsCap: 20000, // maxChars パラメータの絶対上限
        maxResponseBytes: 750000, // 切り詰め前の最大ダウンロードサイズ（32000～10000000）
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // 信頼できる HTTP(S) 環境プロキシによる DNS 解決を許可
        readability: true, // Readability 抽出を使用
        userAgent: "Mozilla/5.0 ...", // User-Agent を上書き
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // 198.18.0.0/15 を使用する信頼済み偽 IP プロキシ向けの明示的な許可
          allowIpv6UniqueLocalRange: true, // fc00::/7 を使用する信頼済み偽 IP プロキシ向けの明示的な許可
        },
      },
    },
  },
}
```

## Firecrawl フォールバック

Readability による抽出が失敗した場合、`web_fetch` はボット回避と抽出精度向上のために
[Firecrawl](/ja-JP/tools/firecrawl) へフォールバックできます。

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 任意。利用可能な認証情報から自動検出する場合は省略
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // 任意。キーなしのスターターアクセスでは省略
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // キャッシュ期間（2 日）
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` は任意で、SecretRef オブジェクトをサポートします。
旧形式の `tools.web.fetch.firecrawl.*` 設定は、`openclaw doctor --fix` によって
`plugins.entries.firecrawl.config.webFetch` に自動移行されます。

<Note>
  Firecrawl API キーの SecretRef を設定し、それが解決されず、かつ
  `FIRECRAWL_API_KEY` 環境変数によるフォールバックもない場合、Gateway の起動は即座に失敗します。
</Note>

<Note>
  Firecrawl の `baseUrl` 上書きは制限されています。ホスト型サービスへの通信では
  `https://api.firecrawl.dev` を使用します。セルフホストの上書き先はプライベートまたは
  内部エンドポイントでなければならず、`http://` はそのようなプライベートな宛先に限り許可されます。
</Note>

現在のランタイム動作:

- `tools.web.fetch.provider` は取得フォールバックプロバイダーを明示的に選択します。
- `provider` を省略すると、OpenClaw は設定済みの認証情報から、準備が完了している最初の
  Web 取得プロバイダーを自動検出します。サンドボックス化されていない `web_fetch` は、
  `contracts.webFetchProviders` を宣言し、ランタイムで対応するプロバイダーを登録する
  インストール済み Plugin を使用できます。現在、公式 Firecrawl Plugin がこのフォールバックを提供します。
- サンドボックス化された `web_fetch` 呼び出しでは、同梱プロバイダーに加え、公式 npm または
  ClawHub 由来であることが検証されたインストール済みプロバイダーを許可します。現在許可されるのは
  公式 Firecrawl Plugin で、サードパーティーの外部取得 Plugin は引き続き除外されます。
- Readability が無効な場合、`web_fetch` は選択されたプロバイダーへのフォールバックに直接進みます。
  利用可能なプロバイダーがない場合は、安全側に倒して失敗します。

## 信頼済み環境プロキシ

デプロイ環境で `web_fetch` が信頼済みの外向き HTTP(S) プロキシを経由する必要がある場合は、
`tools.web.fetch.useTrustedEnvProxy: true` を設定します。

このモードでも、OpenClaw はリクエスト送信前にホスト名ベースの SSRF チェックを適用しますが、
ローカルで DNS を固定する代わりに、プロキシによる DNS 解決を許可します。この設定は、
プロキシが運用者の管理下にあり、DNS 解決後も外向き通信ポリシーを適用する場合にのみ有効にしてください。

<Note>
  HTTP(S) プロキシ環境変数が設定されていない場合、または対象ホストが `NO_PROXY` によって除外されている場合、
  `web_fetch` はローカル DNS 固定を使用する通常の厳格な経路にフォールバックします。
</Note>

## 制限と安全性

- `maxChars` は `tools.web.fetch.maxCharsCap`（デフォルト `20000`）を上限とします
- レスポンス本文は解析前に `maxResponseBytes`（デフォルト `750000`、32000～10000000 の範囲に制限）を
  上限とし、上限を超えるレスポンスは警告付きで切り詰められます
- プライベートまたは内部ホスト名はブロックされます
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` と
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` は、信頼済みの偽 IP プロキシスタック向けの
  限定的な明示許可です。プロキシがこれらの合成範囲を所有し、独自の宛先ポリシーを適用している場合を除き、
  設定しないでください
- リダイレクトは検査され、`maxRedirects`（デフォルト `3`）によって制限されます
- `useTrustedEnvProxy` は明示的なオプトインであり、DNS 解決後も外向き通信ポリシーを適用する、
  運用者管理下のプロキシに対してのみ有効にしてください
- `web_fetch` はベストエフォートです。一部のサイトでは [Web Browser](/ja-JP/tools/browser) が必要です

## ツールプロファイル

ツールプロファイルまたは許可リストを使用する場合は、`web_fetch` または `group:web` を追加します。

```json5
{
  tools: {
    allow: ["web_fetch"],
    // または: allow: ["group:web"]（web_fetch、web_search、x_search を含む）
  },
}
```

## 関連項目

- [Web 検索](/ja-JP/tools/web) -- 複数のプロバイダーで Web を検索
- [Web Browser](/ja-JP/tools/browser) -- JS を多用するサイト向けの完全なブラウザー自動操作
- [Firecrawl](/ja-JP/tools/firecrawl) -- Firecrawl の検索およびスクレイピングツール
