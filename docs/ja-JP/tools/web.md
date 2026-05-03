---
read_when:
    - web_searchを有効化または設定したい
    - x_search を有効化または設定したい場合
    - 検索プロバイダーを選択する必要があります
    - 自動検出とプロバイダーのフォールバックについて理解したい場合
sidebarTitle: Web Search
summary: web_search、x_search、web_fetch -- ウェブを検索、Xの投稿を検索、またはページコンテンツを取得
title: ウェブ検索
x-i18n:
    generated_at: "2026-05-03T21:40:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84de67b51f02e3b901bfa55017ae8e88de49295dfe6ed1103a45f034e073c087
    source_path: tools/web.md
    workflow: 16
---

`web_search` ツールは、設定済みのプロバイダーを使用して Web を検索し、
結果を返します。結果はクエリごとに 15 分間キャッシュされます（設定可能）。

OpenClaw には、X（旧 Twitter）の投稿用の `x_search` と、
軽量な URL 取得用の `web_fetch` も含まれています。このフェーズでは、`web_fetch` は
ローカルのままで、`web_search` と `x_search` は内部で xAI Responses を使用できます。

<Info>
  `web_search` は軽量な HTTP ツールであり、ブラウザー自動化ではありません。
  JS が多いサイトやログインには、[Web Browser](/ja-JP/tools/browser) を使用してください。
  特定の URL を取得するには、[Web Fetch](/ja-JP/tools/web-fetch) を使用してください。
</Info>

## クイックスタート

<Steps>
  <Step title="プロバイダーを選択">
    プロバイダーを選択し、必要なセットアップを完了します。一部のプロバイダーは
    キー不要で、ほかは API キーを使用します。詳細は以下のプロバイダーページを
    参照してください。
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
    スニペット付きの構造化結果。`llm-context` モード、国/言語フィルターをサポートします。無料枠を利用できます。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ja-JP/tools/duckduckgo-search">
    キー不要のフォールバック。API キーは不要です。非公式の HTML ベース統合です。
  </Card>
  <Card title="Exa" icon="brain" href="/ja-JP/tools/exa-search">
    コンテンツ抽出（ハイライト、テキスト、要約）付きのニューラル検索 + キーワード検索。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ja-JP/tools/firecrawl">
    構造化結果。詳細な抽出には `firecrawl_search` と `firecrawl_scrape` の併用が最適です。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ja-JP/tools/gemini-search">
    Google 検索グラウンディングによる引用付きの AI 合成回答。
  </Card>
  <Card title="Grok" icon="zap" href="/ja-JP/tools/grok-search">
    xAI Web グラウンディングによる引用付きの AI 合成回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/ja-JP/tools/kimi-search">
    Moonshot Web 検索による引用付きの AI 合成回答。グラウンディングされていないチャットのフォールバックは明示的に失敗します。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ja-JP/tools/minimax-search">
    MiniMax Token Plan 検索 API による構造化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ja-JP/tools/ollama-search">
    サインイン済みのローカル Ollama ホスト、またはホスト型 Ollama API 経由で検索します。
  </Card>
  <Card title="Perplexity" icon="search" href="/ja-JP/tools/perplexity-search">
    コンテンツ抽出制御とドメインフィルタリングを備えた構造化結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/ja-JP/tools/searxng-search">
    セルフホスト型メタ検索。API キーは不要です。Google、Bing、DuckDuckGo などを集約します。
  </Card>
  <Card title="Tavily" icon="globe" href="/ja-JP/tools/tavily">
    検索深度、トピックフィルタリング、URL 抽出用の `tavily_extract` を備えた構造化結果。
  </Card>
</CardGroup>

### プロバイダー比較

| プロバイダー                              | 結果スタイル                                                   | フィルター                                       | API キー                                                                                |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ja-JP/tools/brave-search)              | 構造化スニペット                                               | 国、言語、時間、`llm-context` モード             | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/ja-JP/tools/duckduckgo-search)    | 構造化スニペット                                               | --                                               | なし（キー不要）                                                                        |
| [Exa](/ja-JP/tools/exa-search)                  | 構造化 + 抽出済み                                              | ニューラル/キーワードモード、日付、コンテンツ抽出 | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ja-JP/tools/firecrawl)             | 構造化スニペット                                               | `firecrawl_search` ツール経由                    | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ja-JP/tools/gemini-search)            | AI 合成 + 引用                                                 | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ja-JP/tools/grok-search)                | AI 合成 + 引用                                                 | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/ja-JP/tools/kimi-search)                | AI 合成 + 引用。グラウンディングされていないチャットのフォールバックでは失敗 | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ja-JP/tools/minimax-search)   | 構造化スニペット                                               | リージョン（`global` / `cn`）                    | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ja-JP/tools/ollama-search) | 構造化スニペット                                               | --                                               | サインイン済みローカルホストではなし。直接 `https://ollama.com` 検索には `OLLAMA_API_KEY` |
| [Perplexity](/ja-JP/tools/perplexity-search)    | 構造化スニペット                                               | 国、言語、時間、ドメイン、コンテンツ制限         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ja-JP/tools/searxng-search)          | 構造化スニペット                                               | カテゴリー、言語                                 | なし（セルフホスト）                                                                    |
| [Tavily](/ja-JP/tools/tavily)                   | 構造化スニペット                                               | `tavily_search` ツール経由                       | `TAVILY_API_KEY`                                                                        |

## 自動検出

## ネイティブ OpenAI Web 検索

直接の OpenAI Responses モデルは、OpenClaw の Web 検索が有効で、管理対象プロバイダーが固定されていない場合、OpenAI のホスト型 `web_search` ツールを自動的に使用します。これはバンドルされた OpenAI Plugin のプロバイダー所有の動作であり、ネイティブ OpenAI API トラフィックにのみ適用されます。OpenAI 互換プロキシのベース URL や Azure ルートには適用されません。OpenAI モデルで管理対象の `web_search` ツールを維持するには、`tools.web.search.provider` を `brave` など別のプロバイダーに設定します。また、管理対象検索とネイティブ OpenAI 検索の両方を無効にするには、`tools.web.search.enabled: false` を設定します。

## ネイティブ Codex Web 検索

Codex 対応モデルは、OpenClaw の管理対象 `web_search` 関数の代わりに、プロバイダーネイティブの Responses `web_search` ツールを任意で使用できます。

- `tools.web.search.openaiCodex` の下で設定します
- Codex 対応モデル（`openai-codex/*`、または `api: "openai-codex-responses"` を使用するプロバイダー）でのみ有効になります
- 管理対象の `web_search` は Codex 以外のモデルにも引き続き適用されます
- `mode: "cached"` がデフォルトであり推奨設定です
- `tools.web.search.enabled: false` は、管理対象検索とネイティブ検索の両方を無効にします

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

## ネットワーク安全性

管理対象の `web_search` プロバイダー呼び出しは、OpenClaw の保護された fetch パスを使用します。
信頼されたプロバイダー API ホストについては、OpenClaw は Surge、Clash、sing-box の fake-IP
DNS 応答を `198.18.0.0/15` と `fc00::/7` で許可しますが、そのプロバイダーのホスト名に対してのみです。
その他のプライベート、ループバック、リンクローカル、メタデータ宛先は引き続きブロックされます。

この自動許可は、任意の `web_fetch` URL には適用されません。
`web_fetch` では、信頼済みプロキシがそれらの合成範囲を所有している場合にのみ、
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` と
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` を明示的に有効にしてください。

## Web 検索のセットアップ

ドキュメントとセットアップフロー内のプロバイダー一覧はアルファベット順です。自動検出は
別の優先順位を維持します。

`provider` が設定されていない場合、OpenClaw は次の順序でプロバイダーを確認し、
準備できている最初のものを使用します。

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

その後にキー不要のフォールバックがあります。

10. **DuckDuckGo** -- アカウントや API キーが不要な、キー不要の HTML フォールバック（順序 100）
11. **Ollama Web Search** -- 設定済みのローカル Ollama ホストに到達可能で、`ollama signin` でサインイン済みの場合、そのホスト経由のキー不要フォールバック。ホストが必要とする場合は Ollama プロバイダーのベアラー認証を再利用でき、`OLLAMA_API_KEY` が設定されている場合は直接 `https://ollama.com` 検索を呼び出せます（順序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

プロバイダーが検出されない場合、Brave にフォールバックします（設定を促す
キー不足エラーが表示されます）。

<Note>
  すべてのプロバイダーキー項目は SecretRef オブジェクトをサポートします。
  `plugins.entries.<plugin>.config.webSearch.apiKey` の下にある Plugin スコープの SecretRef は、
  Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax、Perplexity、Tavily など、
  バンドルされた API ベースの Web 検索プロバイダーで解決されます。
  これは、プロバイダーが `tools.web.search.provider` によって明示的に選択された場合でも、
  自動検出で選択された場合でも同じです。自動検出モードでは、OpenClaw は
  選択されたプロバイダーキーのみを解決します。選択されていない SecretRef は非アクティブのままなので、
  使用していないプロバイダーの解決コストを払わずに、複数のプロバイダーを設定しておけます。
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
`plugins.entries.<plugin>.config.webSearch.*` の下にあります。Gemini は、専用のウェブ検索設定と `GEMINI_API_KEY` の後に、低優先度のフォールバックとして
`models.providers.google.apiKey` と `models.providers.google.baseUrl` も再利用できます。例については
プロバイダーページを参照してください。

`tools.web.search.provider` は、同梱およびインストール済みの Plugin マニフェストで宣言されたウェブ検索プロバイダー ID に対して検証されます。
`"brvae"` のようなタイプミスは、自動検出へ黙ってフォールバックするのではなく、設定検証で失敗します。設定されたプロバイダーに古い Plugin 証跡しかない場合、たとえばサードパーティ Plugin をアンインストールした後に残った
`plugins.entries.<plugin>` ブロックがある場合でも、OpenClaw は起動の耐障害性を保ち、警告を報告するため、Plugin を再インストールするか
`openclaw doctor --fix` を実行して古い設定をクリーンアップできます。

`web_fetch` のフォールバックプロバイダー選択は別です。

- `tools.web.fetch.provider` で選択する
- またはそのフィールドを省略し、OpenClaw に利用可能な認証情報から最初に準備できている web-fetch プロバイダーを自動検出させる
- サンドボックス化されていない `web_fetch` は、`contracts.webFetchProviders` を宣言するインストール済み Plugin プロバイダーを使用できます。サンドボックス化されたフェッチは同梱のみのままです
- 現在の同梱 web-fetch プロバイダーは Firecrawl で、`plugins.entries.firecrawl.config.webFetch.*` の下で設定します

`openclaw onboard` または
`openclaw configure --section web` 中に **Kimi** を選択すると、OpenClaw は次の項目も尋ねる場合があります。

- Moonshot API リージョン（`https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`）
- デフォルトの Kimi ウェブ検索モデル（デフォルトは `kimi-k2.6`）

`x_search` については、`plugins.entries.xai.config.xSearch.*` を設定します。Grok ウェブ検索と同じ `XAI_API_KEY` フォールバックを使用します。
従来の `tools.web.x_search.*` 設定は `openclaw doctor --fix` によって自動移行されます。
`openclaw onboard` または `openclaw configure --section web` 中に Grok を選択すると、OpenClaw は同じキーで任意の `x_search` セットアップも提供できます。
これは Grok パス内の別の後続ステップであり、別個のトップレベルのウェブ検索プロバイダー選択ではありません。別のプロバイダーを選ぶと、OpenClaw は `x_search` プロンプトを表示しません。

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

    Gateway インストールの場合は、`~/.openclaw/.env` に入れます。
    [環境変数](/ja-JP/help/faq#env-vars-and-env-loading)を参照してください。

  </Tab>
</Tabs>

## ツールパラメーター

| パラメーター          | 説明                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | 検索クエリ（必須）                                    |
| `count`               | 返す結果数（1-10、デフォルト: 5）                     |
| `country`             | 2 文字の ISO 国コード（例: "US", "DE"）               |
| `language`            | ISO 639-1 言語コード（例: "en", "de"）                |
| `search_lang`         | 検索言語コード（Brave のみ）                          |
| `freshness`           | 時間フィルター: `day`、`week`、`month`、または `year` |
| `date_after`          | この日付より後の結果（YYYY-MM-DD）                    |
| `date_before`         | この日付より前の結果（YYYY-MM-DD）                    |
| `ui_lang`             | UI 言語コード（Brave のみ）                           |
| `domain_filter`       | ドメイン許可リスト/拒否リスト配列（Perplexity のみ） |
| `max_tokens`          | 合計コンテンツ予算、デフォルト 25000（Perplexity のみ） |
| `max_tokens_per_page` | ページごとのトークン上限、デフォルト 2048（Perplexity のみ） |

<Warning>
  すべてのパラメーターがすべてのプロバイダーで動作するわけではありません。Brave の `llm-context` モードは
  `ui_lang` を拒否します。`date_before` には `date_after` も必要です。Brave のカスタム
  freshness 範囲では開始日と終了日の両方が必要なためです。
  Gemini、Grok、Kimi は引用付きの合成回答を 1 つ返します。共有ツール互換性のために
  `count` は受け付けますが、根拠付き回答の形は変わりません。Gemini は `freshness`、`date_after`、`date_before` を Google Search グラウンディングの時間範囲に変換してサポートします。
  Perplexity は Sonar/OpenRouter 互換パス（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` または `OPENROUTER_API_KEY`）を使用する場合に同じように動作します。
  SearXNG は信頼済みのプライベートネットワークまたはループバックホストに対してのみ `http://` を受け付けます。
  公開 SearXNG エンドポイントは `https://` を使用する必要があります。
  Firecrawl と Tavily は `web_search` 経由では `query` と `count` のみをサポートします
  -- 高度なオプションには専用ツールを使用してください。
</Warning>

## x_search

`x_search` は xAI を使用して X（旧 Twitter）の投稿をクエリし、引用付きの AI 合成回答を返します。自然言語クエリと任意の構造化フィルターを受け付けます。OpenClaw は、このツール呼び出しを処理するリクエストでのみ、組み込みの xAI `x_search` ツールを有効にします。

<Note>
  xAI は `x_search` がキーワード検索、セマンティック検索、ユーザー検索、スレッド取得をサポートすると文書化しています。再投稿、返信、ブックマーク、表示回数など投稿ごとのエンゲージメント統計については、正確な投稿 URL またはステータス ID を対象にしたルックアップを推奨します。
  広いキーワード検索でも正しい投稿が見つかることはありますが、投稿ごとのメタデータが不完全になる場合があります。よいパターンは、まず投稿を見つけ、その後その正確な投稿に絞った 2 回目の `x_search` クエリを実行することです。
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

`plugins.entries.xai.config.xSearch.baseUrl` が設定されている場合、`x_search` は `<baseUrl>/responses` に投稿します。そのフィールドが省略されている場合は、
`plugins.entries.xai.config.webSearch.baseUrl`、次に従来の `tools.web.search.grok.baseUrl`、最後に公開 xAI エンドポイントへフォールバックします。

### x_search パラメーター

| パラメーター                 | 説明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 検索クエリ（必須）                                     |
| `allowed_x_handles`          | 結果を特定の X ハンドルに制限する                      |
| `excluded_x_handles`         | 特定の X ハンドルを除外する                            |
| `from_date`                  | この日付以降の投稿のみを含める（YYYY-MM-DD）           |
| `to_date`                    | この日付以前の投稿のみを含める（YYYY-MM-DD）           |
| `enable_image_understanding` | 一致する投稿に添付された画像を xAI に検査させる        |
| `enable_video_understanding` | 一致する投稿に添付された動画を xAI に検査させる        |

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

- [Web Fetch](/ja-JP/tools/web-fetch) -- URL をフェッチして読みやすいコンテンツを抽出する
- [Web Browser](/ja-JP/tools/browser) -- JS が多いサイト向けの完全なブラウザー自動操作
- [Grok Search](/ja-JP/tools/grok-search) -- `web_search` プロバイダーとしての Grok
- [Ollama Web Search](/ja-JP/tools/ollama-search) -- 使用中の Ollama ホストを通じたキー不要のウェブ検索
