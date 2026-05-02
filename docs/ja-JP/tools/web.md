---
read_when:
    - web_search を有効化または設定したい場合
    - x_search を有効化または設定したい場合
    - 検索プロバイダーを選択する必要があります
    - 自動検出とプロバイダーのフォールバックについて理解したい場合
sidebarTitle: Web Search
summary: web_search、x_search、web_fetch -- ウェブを検索、Xの投稿を検索、またはページ内容を取得
title: ウェブ検索
x-i18n:
    generated_at: "2026-05-02T21:09:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: faa333a522a6690e92e8bd00c6096c84b386a97cbfeb508654929a409b39b8ef
    source_path: tools/web.md
    workflow: 16
---

`web_search` ツールは、設定済みのプロバイダーを使用して Web を検索し、
結果を返します。結果はクエリごとに 15 分間キャッシュされます（設定可能）。

OpenClaw には、X（旧 Twitter）の投稿用の `x_search` と、
軽量な URL 取得用の `web_fetch` も含まれています。このフェーズでは、`web_fetch` は
ローカルのままですが、`web_search` と `x_search` は内部で xAI Responses を使用できます。

<Info>
  `web_search` は軽量な HTTP ツールであり、ブラウザー自動化ではありません。
  JS が多いサイトやログインには、[Web Browser](/ja-JP/tools/browser) を使用してください。
  特定の URL を取得するには、[Web Fetch](/ja-JP/tools/web-fetch) を使用してください。
</Info>

## クイックスタート

<Steps>
  <Step title="プロバイダーを選択">
    プロバイダーを選び、必要なセットアップを完了します。一部のプロバイダーは
    キー不要ですが、他のプロバイダーは API キーを使用します。詳細は下記の
    プロバイダーページを参照してください。
  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    ```
    これにより、プロバイダーと必要な認証情報が保存されます。環境変数
    （例: `BRAVE_API_KEY`）を設定し、API ベースのプロバイダーではこの手順を
    省略することもできます。
  </Step>
  <Step title="使用">
    これでエージェントは `web_search` を呼び出せます。

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X の投稿には、次を使用します。

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## プロバイダーの選択

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ja-JP/tools/brave-search">
    スニペット付きの構造化された結果。`llm-context` モード、国/言語フィルターをサポートします。無料枠があります。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ja-JP/tools/duckduckgo-search">
    キー不要のフォールバック。API キーは不要です。非公式の HTML ベース統合です。
  </Card>
  <Card title="Exa" icon="brain" href="/ja-JP/tools/exa-search">
    コンテンツ抽出（ハイライト、テキスト、要約）付きのニューラル + キーワード検索。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ja-JP/tools/firecrawl">
    構造化された結果。深い抽出には `firecrawl_search` と `firecrawl_scrape` の併用が最適です。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ja-JP/tools/gemini-search">
    Google Search グラウンディング経由の引用付き AI 合成回答。
  </Card>
  <Card title="Grok" icon="zap" href="/ja-JP/tools/grok-search">
    xAI Web グラウンディング経由の引用付き AI 合成回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/ja-JP/tools/kimi-search">
    Moonshot Web 検索経由の引用付き AI 合成回答。グラウンディングされていないチャットフォールバックは明示的に失敗します。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ja-JP/tools/minimax-search">
    MiniMax Token Plan 検索 API 経由の構造化された結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ja-JP/tools/ollama-search">
    サインイン済みのローカル Ollama ホストまたはホスト型 Ollama API 経由で検索します。
  </Card>
  <Card title="Perplexity" icon="search" href="/ja-JP/tools/perplexity-search">
    コンテンツ抽出制御とドメインフィルタリング付きの構造化された結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/ja-JP/tools/searxng-search">
    セルフホスト型メタ検索。API キーは不要です。Google、Bing、DuckDuckGo などを集約します。
  </Card>
  <Card title="Tavily" icon="globe" href="/ja-JP/tools/tavily">
    検索深度、トピックフィルタリング、URL 抽出用の `tavily_extract` を備えた構造化された結果。
  </Card>
</CardGroup>

### プロバイダー比較

| プロバイダー                              | 結果の形式                                                     | フィルター                                       | API キー                                                                                |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ja-JP/tools/brave-search)              | 構造化されたスニペット                                         | 国、言語、時間、`llm-context` モード             | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/ja-JP/tools/duckduckgo-search)    | 構造化されたスニペット                                         | --                                               | なし（キー不要）                                                                        |
| [Exa](/ja-JP/tools/exa-search)                  | 構造化 + 抽出済み                                              | ニューラル/キーワードモード、日付、コンテンツ抽出 | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ja-JP/tools/firecrawl)             | 構造化されたスニペット                                         | `firecrawl_search` ツール経由                    | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ja-JP/tools/gemini-search)            | AI 合成 + 引用                                                 | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ja-JP/tools/grok-search)                | AI 合成 + 引用                                                 | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/ja-JP/tools/kimi-search)                | AI 合成 + 引用。グラウンディングされていないチャットフォールバックでは失敗 | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ja-JP/tools/minimax-search)   | 構造化されたスニペット                                         | 地域（`global` / `cn`）                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ja-JP/tools/ollama-search) | 構造化されたスニペット                                         | --                                               | サインイン済みローカルホストでは不要。直接 `https://ollama.com` 検索には `OLLAMA_API_KEY` |
| [Perplexity](/ja-JP/tools/perplexity-search)    | 構造化されたスニペット                                         | 国、言語、時間、ドメイン、コンテンツ制限         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ja-JP/tools/searxng-search)          | 構造化されたスニペット                                         | カテゴリー、言語                                 | なし（セルフホスト）                                                                    |
| [Tavily](/ja-JP/tools/tavily)                   | 構造化されたスニペット                                         | `tavily_search` ツール経由                       | `TAVILY_API_KEY`                                                                        |

## 自動検出

## ネイティブ OpenAI Web 検索

直接の OpenAI Responses モデルは、OpenClaw の Web 検索が有効で、管理対象プロバイダーが固定されていない場合、OpenAI のホスト型 `web_search` ツールを自動的に使用します。これはバンドルされた OpenAI plugin 内のプロバイダー所有の動作であり、ネイティブ OpenAI API トラフィックにのみ適用されます。OpenAI 互換プロキシのベース URL や Azure ルートには適用されません。OpenAI モデルで管理対象の `web_search` ツールを使い続けるには、`tools.web.search.provider` を `brave` など別のプロバイダーに設定します。管理対象検索とネイティブ OpenAI 検索の両方を無効にするには、`tools.web.search.enabled: false` を設定します。

## ネイティブ Codex Web 検索

Codex 対応モデルは、OpenClaw の管理対象 `web_search` 関数の代わりに、プロバイダーネイティブの Responses `web_search` ツールを任意で使用できます。

- `tools.web.search.openaiCodex` の下で設定します
- Codex 対応モデル（`openai-codex/*`、または `api: "openai-codex-responses"` を使用するプロバイダー）でのみ有効になります
- 管理対象の `web_search` は Codex 以外のモデルに引き続き適用されます
- `mode: "cached"` がデフォルトで推奨設定です
- `tools.web.search.enabled: false` は管理対象検索とネイティブ検索の両方を無効にします

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

ネイティブ Codex 検索が有効でも、現在のモデルが Codex 対応でない場合、OpenClaw は通常の管理対象 `web_search` 動作を維持します。

## Web 検索のセットアップ

ドキュメントとセットアップフロー内のプロバイダー一覧はアルファベット順です。自動検出では
別の優先順位を使用します。

`provider` が設定されていない場合、OpenClaw は次の順序でプロバイダーを確認し、
準備ができている最初のものを使用します。

API ベースのプロバイダーが先です。

1. **Brave** -- `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` または `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY`、または `models.providers.google.apiKey`（順序 20）
4. **Grok** -- `XAI_API_KEY` または `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` または `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` または `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`。任意の `plugins.entries.exa.config.webSearch.baseUrl` は Exa エンドポイントを上書きします（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）

その後にキー不要のフォールバックが続きます。

10. **DuckDuckGo** -- アカウントや API キーなしのキー不要 HTML フォールバック（順序 100）
11. **Ollama Web Search** -- 設定済みのローカル Ollama ホストに到達可能で、`ollama signin` でサインイン済みの場合に使用するキー不要フォールバック。ホストが必要とする場合は Ollama プロバイダーのベアラー認証を再利用でき、`OLLAMA_API_KEY` が設定されている場合は直接 `https://ollama.com` 検索を呼び出せます（順序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

プロバイダーが検出されない場合は Brave にフォールバックします（設定を促す
キー不足エラーが表示されます）。

<Note>
  すべてのプロバイダーキー項目は SecretRef オブジェクトをサポートします。
  `plugins.entries.<plugin>.config.webSearch.apiKey` の下にある plugin スコープの SecretRef は、
  Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax、Perplexity、Tavily を含む
  バンドルされた API ベース Web 検索プロバイダーで解決されます。
  これは、プロバイダーが `tools.web.search.provider` 経由で明示的に選択される場合でも、
  自動検出で選択される場合でも同じです。自動検出モードでは、OpenClaw は
  選択されたプロバイダーキーのみを解決します。選択されていない SecretRef は非アクティブのままなので、
  使用していないプロバイダーの解決コストを払わずに、複数のプロバイダーを
  設定しておけます。
</Note>

## 設定

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

プロバイダー固有の設定（API キー、ベース URL、モード）は
`plugins.entries.<plugin>.config.webSearch.*` の下にあります。Gemini は、専用の Web 検索設定と `GEMINI_API_KEY` の後の低優先度フォールバックとして、
`models.providers.google.apiKey` と `models.providers.google.baseUrl` も再利用できます。例については
プロバイダーページを参照してください。

`tools.web.search.provider` は、バンドル済みおよびインストール済み Plugin のマニフェストで宣言された Web 検索プロバイダー ID に対して検証されます。`"brvae"` のような入力ミスは、暗黙に自動検出へフォールバックするのではなく、設定検証で失敗します。設定済みプロバイダーに、サードパーティ Plugin をアンインストールした後に残った `plugins.entries.<plugin>` ブロックのような古い Plugin 証跡しかない場合、OpenClaw は起動の回復性を維持し、Plugin を再インストールするか `openclaw doctor --fix` を実行して古い設定をクリーンアップできるように警告を報告します。

`web_fetch` のフォールバックプロバイダー選択は別です。

- `tools.web.fetch.provider` で選択します
- またはそのフィールドを省略し、OpenClaw に利用可能な認証情報から最初に準備完了した Web フェッチプロバイダーを自動検出させます
- サンドボックス化されていない `web_fetch` は、`contracts.webFetchProviders` を宣言するインストール済み Plugin プロバイダーを使用できます。サンドボックス化された取得はバンドル済みのみに留まります
- 現在のバンドル済み Web フェッチプロバイダーは Firecrawl で、`plugins.entries.firecrawl.config.webFetch.*` の下で設定されます

`openclaw onboard` または `openclaw configure --section web` で **Kimi** を選択すると、OpenClaw は次の項目も尋ねることができます。

- Moonshot API リージョン (`https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`)
- 既定の Kimi Web 検索モデル (既定は `kimi-k2.6`)

`x_search` については、`plugins.entries.xai.config.xSearch.*` を設定します。これは Grok Web 検索と同じ `XAI_API_KEY` フォールバックを使用します。
従来の `tools.web.x_search.*` 設定は `openclaw doctor --fix` によって自動移行されます。
`openclaw onboard` または `openclaw configure --section web` で Grok を選択すると、OpenClaw は同じキーを使った任意の `x_search` セットアップも提示できます。
これは Grok パス内の個別のフォローアップ手順であり、別のトップレベル Web 検索プロバイダー選択ではありません。別のプロバイダーを選んだ場合、OpenClaw は `x_search` プロンプトを表示しません。

### API キーの保存

<Tabs>
  <Tab title="設定ファイル">
    `openclaw configure --section web` を実行するか、キーを直接設定します。

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="環境変数">
    Gateway プロセス環境にプロバイダーの環境変数を設定します。

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Gateway インストールの場合は、`~/.openclaw/.env` に配置します。
    [環境変数](/ja-JP/help/faq#env-vars-and-env-loading)を参照してください。

  </Tab>
</Tabs>

## ツールパラメーター

| パラメーター          | 説明                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | 検索クエリ (必須)                                    |
| `count`               | 返す結果数 (1-10、既定: 5)                           |
| `country`             | 2 文字の ISO 国コード (例: "US", "DE")                |
| `language`            | ISO 639-1 言語コード (例: "en", "de")                 |
| `search_lang`         | 検索言語コード (Brave のみ)                           |
| `freshness`           | 時間フィルター: `day`、`week`、`month`、または `year` |
| `date_after`          | この日付以降の結果 (YYYY-MM-DD)                      |
| `date_before`         | この日付以前の結果 (YYYY-MM-DD)                      |
| `ui_lang`             | UI 言語コード (Brave のみ)                            |
| `domain_filter`       | ドメイン許可リスト/拒否リスト配列 (Perplexity のみ)   |
| `max_tokens`          | 合計コンテンツ予算、既定 25000 (Perplexity のみ)      |
| `max_tokens_per_page` | ページごとのトークン上限、既定 2048 (Perplexity のみ) |

<Warning>
  すべてのパラメーターがすべてのプロバイダーで動作するわけではありません。Brave の `llm-context` モードは `ui_lang` を拒否します。Brave のカスタム鮮度範囲には開始日と終了日の両方が必要なため、`date_before` には `date_after` も必要です。
  Gemini、Grok、Kimi は引用付きの合成された回答を 1 つ返します。共有ツール互換性のために `count` は受け付けますが、根拠付き回答の形式は変わりません。Gemini は `freshness`、`date_after`、`date_before` を Google Search グラウンディングの時間範囲に変換してサポートします。
  Sonar/OpenRouter 互換パス (`plugins.entries.perplexity.config.webSearch.baseUrl` / `model` または `OPENROUTER_API_KEY`) を使用する場合、Perplexity も同じように動作します。
  SearXNG は、信頼されたプライベートネットワークまたはループバックホストに対してのみ `http://` を受け付けます。公開 SearXNG エンドポイントは `https://` を使用する必要があります。
  Firecrawl と Tavily は、`web_search` 経由では `query` と `count` のみをサポートします。高度なオプションには専用ツールを使用してください。
</Warning>

## x_search

`x_search` は xAI を使用して X (旧 Twitter) の投稿を照会し、引用付きの AI 合成回答を返します。自然言語クエリと任意の構造化フィルターを受け付けます。OpenClaw は、このツール呼び出しを提供するリクエストでのみ組み込み xAI `x_search` ツールを有効にします。

<Note>
  xAI は `x_search` がキーワード検索、セマンティック検索、ユーザー検索、スレッド取得をサポートすると文書化しています。リポスト、返信、ブックマーク、表示回数など、投稿ごとのエンゲージメント統計については、正確な投稿 URL またはステータス ID を対象にした検索を優先してください。広範なキーワード検索で正しい投稿が見つかる場合もありますが、投稿ごとのメタデータが不完全になることがあります。よいパターンは、まず投稿を特定し、その後その正確な投稿に絞った 2 回目の `x_search` クエリを実行することです。
</Note>

### x_search 設定

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`plugins.entries.xai.config.xSearch.baseUrl` が設定されている場合、`x_search` は `<baseUrl>/responses` に投稿します。そのフィールドが省略されている場合は、`plugins.entries.xai.config.webSearch.baseUrl`、次に従来の `tools.web.search.grok.baseUrl`、最後に公開 xAI エンドポイントへフォールバックします。

### x_search パラメーター

| パラメーター                 | 説明                                                  |
| ---------------------------- | ----------------------------------------------------- |
| `query`                      | 検索クエリ (必須)                                    |
| `allowed_x_handles`          | 結果を特定の X ハンドルに制限します                  |
| `excluded_x_handles`         | 特定の X ハンドルを除外します                        |
| `from_date`                  | この日付以降の投稿のみを含めます (YYYY-MM-DD)        |
| `to_date`                    | この日付以前の投稿のみを含めます (YYYY-MM-DD)        |
| `enable_image_understanding` | xAI に一致する投稿に添付された画像を検査させます     |
| `enable_video_understanding` | xAI に一致する投稿に添付された動画を検査させます     |

### x_search の例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 例

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## ツールプロファイル

ツールプロファイルまたは許可リストを使用する場合は、`web_search`、`x_search`、または `group:web` を追加します。

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## 関連

- [Web Fetch](/ja-JP/tools/web-fetch) -- URL を取得して読みやすいコンテンツを抽出します
- [Web Browser](/ja-JP/tools/browser) -- JS が多いサイト向けの完全なブラウザー自動化
- [Grok Search](/ja-JP/tools/grok-search) -- `web_search` プロバイダーとしての Grok
- [Ollama Web Search](/ja-JP/tools/ollama-search) -- Ollama ホストを通じたキー不要の Web 検索
