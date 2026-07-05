---
read_when:
    - web_search を有効化または設定したい場合
    - x_search を有効化または設定する必要があります
    - 検索プロバイダーを選択する必要があります
    - OpenClaw で自動検出とプロバイダー選択を理解する
sidebarTitle: Web Search
summary: web_search、x_search、web_fetch -- Webを検索、Xの投稿を検索、またはページ内容を取得する
title: Web 検索
x-i18n:
    generated_at: "2026-07-05T11:58:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9963a532560581e4aa533d2706eaab8f22224fec022ec8b8a3b8a093430f6971
    source_path: tools/web.md
    workflow: 16
---

`web_search` は、設定済みのプロバイダーで Web を検索し、正規化された結果を返します。結果はクエリごとに 15 分間キャッシュされます（設定可能）。OpenClaw
には、X（旧 Twitter）の投稿向けの `x_search` と、軽量な URL 取得向けの `web_fetch` もバンドルされています。`web_fetch` は常にローカルで実行されます。`web_search` は、Grok がプロバイダーの場合は xAI Responses 経由でルーティングされ、`x_search` は常に xAI Responses を使用します。

<Info>
  `web_search` は軽量な HTTP ツールであり、ブラウザー自動化ではありません。
  JS が多いサイトやログインには、[Web Browser](/ja-JP/tools/browser) を使用してください。
  特定の URL を取得するには、[Web Fetch](/ja-JP/tools/web-fetch) を使用してください。
</Info>

## クイックスタート

<Steps>
  <Step title="プロバイダーを選択">
    プロバイダーを選び、必要なセットアップを完了します。一部のプロバイダーは
    キー不要で、その他は API キーが必要です。詳細は以下のプロバイダーページを
    参照してください。
  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    ```
    これにより、プロバイダーと必要な認証情報が保存されます。API ベースの
    プロバイダーでは、代わりにプロバイダーの環境変数（例:
    `BRAVE_API_KEY`）を設定し、この手順を省略できます。
  </Step>
  <Step title="使用">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X の投稿の場合:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## プロバイダーの選択

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ja-JP/tools/brave-search">
    スニペット付きの構造化結果。`llm-context` モード、国/言語フィルターをサポートします。無料枠があります。
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/ja-JP/plugins/codex-harness">
    Codex アプリサーバーアカウントを通じた、根拠付きの AI 合成回答。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ja-JP/tools/duckduckgo-search">
    キー不要のプロバイダー。API キーは不要です。非公式の HTML ベース統合です。
  </Card>
  <Card title="Exa" icon="brain" href="/ja-JP/tools/exa-search">
    コンテンツ抽出（ハイライト、テキスト、要約）を備えたニューラル検索 + キーワード検索。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ja-JP/tools/firecrawl">
    構造化結果。深い抽出には `firecrawl_search` と `firecrawl_scrape` の併用が最適です。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ja-JP/tools/gemini-search">
    Google Search グラウンディングによる、引用付きの AI 合成回答。
  </Card>
  <Card title="Grok" icon="zap" href="/ja-JP/tools/grok-search">
    xAI Web グラウンディングによる、引用付きの AI 合成回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/ja-JP/tools/kimi-search">
    Moonshot Web 検索による、引用付きの AI 合成回答。根拠なしのチャットフォールバックは明示的に失敗します。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ja-JP/tools/minimax-search">
    MiniMax Token Plan 検索 API による構造化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ja-JP/tools/ollama-search">
    サインイン済みのローカル Ollama ホスト、またはホスト型 Ollama API 経由の検索。
  </Card>
  <Card title="Parallel" icon="layer-group" href="/ja-JP/tools/parallel-search">
    有料の Parallel Search API（`PARALLEL_API_KEY`）。より高いレート制限と目的調整。
  </Card>
  <Card title="Parallel Search (無料)" icon="layer-group" href="/ja-JP/tools/parallel-search">
    キー不要のオプトイン。Parallel の無料 Search MCP。LLM 向けに最適化された高密度な抜粋を提供し、API キーは不要です。
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

| プロバイダー                                     | 結果スタイル                                                 | フィルター                                       | API キー                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ja-JP/tools/brave-search)                     | 構造化スニペット                                             | 国、言語、時間、`llm-context` モード             | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/ja-JP/plugins/codex-harness)    | AI 合成 + ソース URL                                          | ドメイン、コンテキストサイズ、ユーザー所在地     | なし。Codex/OpenAI サインインを使用                                                     |
| [DuckDuckGo](/ja-JP/tools/duckduckgo-search)           | 構造化スニペット                                             | --                                               | なし（キー不要）                                                                        |
| [Exa](/ja-JP/tools/exa-search)                         | 構造化 + 抽出済み                                            | ニューラル/キーワードモード、日付、コンテンツ抽出 | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ja-JP/tools/firecrawl)                    | 構造化スニペット                                             | `firecrawl_search` ツール経由                    | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ja-JP/tools/gemini-search)                   | AI 合成 + 引用                                               | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ja-JP/tools/grok-search)                       | AI 合成 + 引用                                               | --                                               | xAI OAuth、`XAI_API_KEY`、または `plugins.entries.xai.config.webSearch.apiKey`          |
| [Kimi](/ja-JP/tools/kimi-search)                       | AI 合成 + 引用。根拠なしのチャットフォールバックで失敗       | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ja-JP/tools/minimax-search)          | 構造化スニペット                                             | リージョン（`global` / `cn`）                    | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ja-JP/tools/ollama-search)        | 構造化スニペット                                             | --                                               | サインイン済みのローカルホストでは不要。直接 `https://ollama.com` 検索する場合は `OLLAMA_API_KEY` |
| [Parallel](/ja-JP/tools/parallel-search)               | LLM コンテキスト向けにランク付けされた高密度な抜粋           | --                                               | `PARALLEL_API_KEY`（有料）                                                              |
| [Parallel Search (無料)](/ja-JP/tools/parallel-search) | LLM コンテキスト向けにランク付けされた高密度な抜粋           | --                                               | なし（無料 Search MCP）                                                                 |
| [Perplexity](/ja-JP/tools/perplexity-search)           | 構造化スニペット                                             | 国、言語、時間、ドメイン、コンテンツ制限         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ja-JP/tools/searxng-search)                 | 構造化スニペット                                             | カテゴリ、言語                                   | なし（セルフホスト）                                                                    |
| [Tavily](/ja-JP/tools/tavily)                          | 構造化スニペット                                             | `tavily_search` ツール経由                       | `TAVILY_API_KEY`                                                                        |

## 自動検出

ドキュメントとセットアップフロー内のプロバイダー一覧はアルファベット順です。自動検出では、
別個の固定された優先順位を使用し、認証情報が必要なプロバイダー
（`requiresCredential !== false`）について、設定済みのものが見つかった場合にのみ選択します。
`provider` が設定されていない場合、OpenClaw は以下の順序でプロバイダーを確認し、
最初に準備できているものを使用します。

API ベースのプロバイダーが先です:

1. **Brave** -- `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` または `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY`、または `models.providers.google.apiKey`（順序 20）
4. **Grok** -- xAI OAuth、`XAI_API_KEY`、または `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` または `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` または `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`。任意の `plugins.entries.exa.config.webSearch.baseUrl` は Exa エンドポイントを上書きします（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）
10. **Parallel** -- `PARALLEL_API_KEY` または `plugins.entries.parallel.config.webSearch.apiKey` 経由の有料 Parallel Search API。任意の `plugins.entries.parallel.config.webSearch.baseUrl` はエンドポイントを上書きします（順序 75）

その後に、エンドポイント設定済みのプロバイダーが続きます:

11. **SearXNG** -- `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

**Parallel Search (無料)**、**DuckDuckGo**、
**Ollama Web Search**、**Codex Hosted Search** などのキー不要プロバイダーは、
内部の順序値を持っていても自動検出では選ばれません。これらは
`tools.web.search.provider` で明示的に選択した場合、または
`openclaw configure --section web` を通じて選択した場合にのみ使用されます。OpenClaw は、
API ベースのプロバイダーが設定されていないという理由だけで、管理対象の
`web_search` クエリをキー不要プロバイダーへ送信することはありません。

OpenAI Responses モデルは例外です。`tools.web.search.provider`
が未設定の間は、上記の管理対象プロバイダーではなく OpenAI のネイティブ Web 検索を使用します（下記参照）。
代わりに管理対象パス経由でルーティングするには、`tools.web.search.provider` を
`parallel-free`（または別のプロバイダー）に設定します。

<Note>
  すべてのプロバイダーキー項目は SecretRef オブジェクトをサポートします。
  `plugins.entries.<plugin>.config.webSearch.apiKey` 配下の Plugin スコープの SecretRef は、
  インストール済みの API ベース Web 検索プロバイダーに対して解決されます。対象には Brave、Exa、Firecrawl、
  Gemini、Grok、Kimi、MiniMax、Parallel、Perplexity、Tavily が含まれます。
  これは、プロバイダーが `tools.web.search.provider` 経由で明示的に選択された場合でも、
  自動検出で選択された場合でも同じです。自動検出モードでは、OpenClaw は
  選択されたプロバイダーキーだけを解決します。選択されていない SecretRef は非アクティブのままなので、
  複数のプロバイダーを設定しておいても、使用していないものの解決コストは発生しません。
</Note>

## ネイティブ OpenAI Web 検索

直接 OpenAI Responses モデル（`api: "openai-responses"`、provider `openai`、base URL なし、または公式 OpenAI API base URL）は、OpenClaw web search が有効で、managed provider が固定されていない場合、OpenAI のホスト型 `web_search` ツールを自動的に使用します。これはバンドルされた OpenAI Plugin 内の provider 所有の動作であり、OpenAI 互換プロキシ base URL や Azure ルートには適用されません。OpenAI モデルで managed `web_search` ツールを使い続けるには、`tools.web.search.provider` を `brave` など別の provider に設定します。または、managed search とネイティブ OpenAI search の両方を無効にするには、`tools.web.search.enabled: false` を設定します。

## ネイティブ Codex web search

Codex app-server ランタイムは、web search が有効で managed provider が選択されていない場合、Codex のホスト型 `web_search` ツールを自動的に使用します。ネイティブのホスト型 search と OpenClaw の managed `web_search` 動的ツールは相互排他的であるため、managed search でネイティブのドメイン制限をバイパスすることはできません。OpenClaw は、ホスト型 search が利用できない、明示的に無効化されている、または選択済みの managed provider に置き換えられている場合に managed ツールを使用します。OpenClaw は、Codex のスタンドアロン `web.run` 拡張を無効のままにします（`features.standalone_web_search: false`）。これは本番 app-server トラフィックが、そのユーザー定義 `web` 名前空間を拒否するためです。

- ネイティブ search は `tools.web.search.openaiCodex` で設定します
- 任意の親モデル向けに、Codex Hosted Search を managed `web_search` provider としてプロビジョニングするには、`tools.web.search.provider: "codex"` を設定します。各呼び出しは有界の一時的な Codex app-server turn を実行し、Codex がホスト型 `webSearch` item を出力しない場合は失敗します。
- `mode: "cached"` はデフォルトの設定ですが、Codex は無制限の app-server turn ではこれを live external access として解決します。live access を明示的に要求するには `"live"` を設定します
- OpenClaw の managed `web_search` を使用するには、`tools.web.search.provider` を `brave` などの managed provider に設定します
- Codex ホスト型 search をオプトアウトするには、`tools.web.search.openaiCodex.enabled: false` を設定します。他の managed provider は引き続き利用できます
- Codex ネイティブツールサーフェスを制限しても、managed `web_search` は利用可能なままです
- `allowedDomains` が設定されている場合、ホスト型 search が利用できないと自動 managed フォールバックはフェイルクローズし、ネイティブ allowlist をバイパスできないようにします
- ツール無効の LLM のみの実行では、ネイティブ search と managed search の両方が無効になります
- `tools.web.search.enabled: false` は managed search とネイティブ search の両方を無効にします

永続的な有効 Codex search-policy の変更は、新しいバインド済みスレッドを開始します。これにより、すでにロードされた app-server スレッドが古い hosted-search access を保持できなくなります。一時的な per-turn 制限では、一時的な制限付きスレッドを使用し、後で resume するために既存の binding を保持します。

直接の OpenAI ChatGPT Responses トラフィックでも、OpenAI のホスト型 `web_search` ツールを使用できます。この別経路は引き続き `tools.web.search.openaiCodex.enabled: true` によるオプトインであり、`api: "openai-chatgpt-responses"` を使用する対象の `openai/*` モデルにのみ適用されます。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

ネイティブ Codex search をサポートしないランタイムや provider では、Codex は OpenClaw の動的ツール名前空間を通じて managed `web_search` フォールバックを使用できます。Codex ホスト型 search ではなく、OpenClaw の provider 固有のネットワーク制御が必要な場合は、明示的な managed provider を使用してください。

`provider: "codex"` を選択すると、バンドルされた `codex` Plugin が有効になり、上記と同じ `tools.web.search.openaiCodex` 制限が使用されます。先に `openclaw models auth login --provider openai` で Codex app-server を認証してください。親エージェントは任意のモデルまたはランタイムを使用できます。有界 search worker だけが Codex 経由で実行されます。

## ネットワーク安全性

Managed HTTP `web_search` provider 呼び出しは、現在の provider 自身のホスト名にスコープされた OpenClaw の保護付き fetch 経路を使用します。そのホスト名に限り、OpenClaw は `198.18.0.0/15` と `fc00::/7` にある Surge、Clash、sing-box の fake-IP DNS 応答を許可します。その他の private、loopback、link-local、metadata 宛先は引き続きブロックされます。Codex Hosted Search は例外です。その有界 worker は、ネットワークアクセスを Codex app-server のホスト型 `web_search` ツールに委譲します。

この自動許可は、任意の `web_fetch` URL には適用されません。`web_fetch` では、信頼済みプロキシがそれらの合成範囲を所有している場合にのみ、`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` と `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` を明示的に有効にしてください。

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

Provider 固有の設定（API keys、base URLs、modes）は `plugins.entries.<plugin>.config.webSearch.*` 配下にあります。Gemini は、専用の web-search 設定と `GEMINI_API_KEY` の後の低優先度フォールバックとして、`models.providers.google.apiKey` と `models.providers.google.baseUrl` も再利用できます。例については provider ページを参照してください。
Grok は、`openclaw models auth login --provider xai --method oauth` の xAI OAuth auth profile も再利用できます。API-key 設定は引き続きフォールバックです。

`tools.web.search.provider` は、バンドル済みおよびインストール済みの Plugin manifest で宣言された web-search provider id に対して検証されます。`"brvae"` のようなタイプミスは、自動検出へ静かにフォールバックするのではなく、設定検証で失敗します。設定済み provider に古い Plugin evidence しかない場合、たとえばサードパーティ Plugin のアンインストール後に残った `plugins.entries.<plugin>` ブロックがある場合、OpenClaw は起動の回復性を維持しつつ警告を報告します。そのため、Plugin を再インストールするか、`openclaw doctor --fix` を実行して古い設定をクリーンアップできます。

`web_fetch` フォールバック provider の選択は別です。

- `tools.web.fetch.provider` で選択します
- またはそのフィールドを省略し、OpenClaw に設定済み認証情報から最初に準備完了となった web-fetch provider を自動検出させます
- 非 sandbox の `web_fetch` は、`contracts.webFetchProviders` を宣言するインストール済み Plugin provider を使用できます。sandbox fetch は、バンドル済み provider と検証済みの公式 Plugin インストールを許可しますが、サードパーティの外部 Plugin は除外します
- 公式 Firecrawl Plugin は、現時点でバンドルされた唯一の `webFetchProviders` contributor であり、`plugins.entries.firecrawl.config.webFetch.*` 配下で設定されます

`openclaw onboard` または `openclaw configure --section web` で **Kimi** を選択すると、OpenClaw は次も尋ねる場合があります。

- Moonshot API region（`https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`）
- デフォルトの Kimi web-search model（デフォルトは `kimi-k2.6`）

`x_search` は `plugins.entries.xai.config.xSearch.*` で設定します。これは chat と同じ xAI auth profile、または Grok web search で使用される `XAI_API_KEY` / Plugin web-search credential を使用します。
従来の `tools.web.x_search.*` 設定は、`openclaw doctor --fix` によって自動移行されます。
`openclaw onboard` または `openclaw configure --section web` で Grok を選択すると、OpenClaw は Grok セットアップ完了直後に、同じ credential を使った任意の `x_search` セットアップも提示します。これは Grok 経路内の別のフォローアップ手順であり、別のトップレベル web-search provider 選択ではありません。別の provider を選んだ場合、OpenClaw は `x_search` プロンプトを表示しません。

### API keys の保存

<Tabs>
  <Tab title="設定ファイル">
    `openclaw configure --section web` を実行するか、key を直接設定します。

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
    Gateway プロセス環境で provider env var を設定します。

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    gateway インストールでは、`~/.openclaw/.env` に入れます。
    [Env vars](/ja-JP/help/faq#env-vars-and-env-loading) を参照してください。

  </Tab>
</Tabs>

## ツールパラメーター

| Parameter             | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | 検索クエリ（必須）                                            |
| `count`               | 返す結果数（1-10、デフォルト: 5）                               |
| `country`             | 2文字の ISO 国コード（例: "US", "DE"）                        |
| `language`            | ISO 639-1 言語コード（例: "en", "de"）                          |
| `search_lang`         | 検索言語コード（Brave のみ）                                  |
| `freshness`           | 時間フィルター: `day`、`week`、`month`、または `year`                     |
| `date_after`          | この日付より後の結果（YYYY-MM-DD）                               |
| `date_before`         | この日付より前の結果（YYYY-MM-DD）                              |
| `ui_lang`             | UI 言語コード（Brave のみ）                                      |
| `domain_filter`       | ドメイン allowlist/denylist 配列（Perplexity のみ）                  |
| `max_tokens`          | 合計コンテンツ token budget、ネイティブ Perplexity Search API のみ      |
| `max_tokens_per_page` | ページごとの抽出 token 制限、ネイティブ Perplexity Search API のみ |

<Warning>
  すべてのパラメーターがすべての provider で機能するわけではありません。Brave `llm-context` mode は `ui_lang` を拒否します。`date_before` も `date_after` を必要とします。これは Brave のカスタム freshness 範囲に開始日と終了日の両方が必要なためです。
  Gemini、Grok、Kimi は citations 付きの合成回答を1つ返します。これらは shared-tool 互換性のために `count` を受け付けますが、根拠付き回答の形は変わりません。Gemini は `day` freshness を recency hint として扱います。より広い freshness 値と明示的な日付は、Google Search grounding time range を設定します。
  Sonar/OpenRouter 互換経路（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` または `OPENROUTER_API_KEY`）を使用する場合、Perplexity も同じように動作します。その経路では `max_tokens` と `max_tokens_per_page` のサポートも削除されます。
  SearXNG は、信頼済みの private-network または loopback ホストに対してのみ `http://` を受け付けます。public SearXNG endpoints は `https://` を使用する必要があります。
  Firecrawl と Tavily は、`web_search` を通じて `query` と `count` のみをサポートします。高度なオプションには専用ツールを使用してください。
</Warning>

## x_search

`x_search` は xAI を使用して X（旧 Twitter）の投稿をクエリし、citations 付きの AI 合成回答を返します。自然言語クエリと任意の構造化フィルターを受け付けます。OpenClaw は、組み込みの xAI `x_search` ツールを永続的に登録しておくのではなく、リクエストごとに構築します。そのため、実際にそれを呼び出す turn でのみ有効です。

<Note>
  xAI は `x_search` がキーワード検索、セマンティック検索、ユーザー検索、スレッド取得をサポートすると文書化しています。reposts、replies、bookmarks、views などの投稿ごとの engagement stats については、正確な投稿 URL または status ID に対する targeted lookup を優先してください。広いキーワード検索でも該当する投稿を見つけられる場合がありますが、投稿ごとの metadata が完全ではないことがあります。良いパターンは、先に投稿を見つけてから、その正確な投稿に絞った2回目の `x_search` クエリを実行することです。
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
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`plugins.entries.xai.config.xSearch.baseUrl` が設定されている場合、
`x_search` は `<baseUrl>/responses` に投稿します。そのフィールドが省略されている場合は、
`plugins.entries.xai.config.webSearch.baseUrl`、次にレガシーの
`tools.web.search.grok.baseUrl`、最後に公開 xAI エンドポイント
(`https://api.x.ai/v1`) にフォールバックします。

### x_search パラメーター

| パラメーター                 | 説明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 検索クエリ (必須)                                     |
| `allowed_x_handles`          | 結果を特定の X ハンドルに制限                         |
| `excluded_x_handles`         | 特定の X ハンドルを除外                               |
| `from_date`                  | この日付以降の投稿のみを含める (YYYY-MM-DD)           |
| `to_date`                    | この日付以前の投稿のみを含める (YYYY-MM-DD)           |
| `enable_image_understanding` | 一致する投稿に添付された画像を xAI に検査させる       |
| `enable_video_understanding` | 一致する投稿に添付された動画を xAI に検査させる       |

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

- [Web Fetch](/ja-JP/tools/web-fetch) -- URL を取得し、読み取り可能なコンテンツを抽出する
- [Web Browser](/ja-JP/tools/browser) -- JS の多いサイト向けの完全なブラウザー自動化
- [Grok Search](/ja-JP/tools/grok-search) -- `web_search` プロバイダーとしての Grok
- [Ollama Web Search](/ja-JP/tools/ollama-search) -- Ollama ホスト経由のキー不要の Web 検索
