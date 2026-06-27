---
read_when:
    - web_search を有効化または設定したい場合
    - x_search を有効化または設定したい場合
    - 検索プロバイダーを選択する必要があります
    - 自動検出とプロバイダー選択を理解したい場合
sidebarTitle: Web Search
summary: web_search、x_search、web_fetch -- Web を検索、X の投稿を検索、またはページ内容を取得
title: ウェブ検索
x-i18n:
    generated_at: "2026-06-27T13:22:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

`web_search` ツールは、設定済みのプロバイダーを使って Web を検索し、
結果を返します。結果はクエリごとに 15 分間キャッシュされます（設定可能）。

OpenClaw には、X（旧 Twitter）の投稿向けの `x_search` と、
軽量な URL 取得向けの `web_fetch` も含まれます。この段階では、`web_fetch` は
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
    キーなしで使用できますが、API キーを使うものもあります。詳細は以下の
    プロバイダーページを参照してください。
  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    ```
    これにより、プロバイダーと必要な認証情報が保存されます。env
    var（例: `BRAVE_API_KEY`）を設定して、API ベースの
    プロバイダーではこの手順を省略することもできます。
  </Step>
  <Step title="使用">
    エージェントは `web_search` を呼び出せるようになります。

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
    スニペット付きの構造化結果。`llm-context` モード、国/言語フィルターをサポートします。無料枠があります。
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/ja-JP/plugins/codex-harness">
    Codex app-server アカウント経由の、根拠に基づく AI 合成回答。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ja-JP/tools/duckduckgo-search">
    キー不要のプロバイダー。API キーは不要です。非公式の HTML ベース統合です。
  </Card>
  <Card title="Exa" icon="brain" href="/ja-JP/tools/exa-search">
    コンテンツ抽出（ハイライト、テキスト、要約）付きのニューラル + キーワード検索。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ja-JP/tools/firecrawl">
    構造化結果。深い抽出には `firecrawl_search` および `firecrawl_scrape` と組み合わせるのが最適です。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ja-JP/tools/gemini-search">
    Google Search grounding による引用付きの AI 合成回答。
  </Card>
  <Card title="Grok" icon="zap" href="/ja-JP/tools/grok-search">
    xAI web grounding による引用付きの AI 合成回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/ja-JP/tools/kimi-search">
    Moonshot web search による引用付きの AI 合成回答。根拠のないチャットフォールバックは明示的に失敗します。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ja-JP/tools/minimax-search">
    MiniMax Token Plan search API 経由の構造化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ja-JP/tools/ollama-search">
    サインイン済みのローカル Ollama ホスト、またはホスト型 Ollama API 経由の検索。
  </Card>
  <Card title="Parallel" icon="layer-group" href="/ja-JP/tools/parallel-search">
    有料の Parallel Search API（`PARALLEL_API_KEY`）。より高いレート制限と目的別チューニング。
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/ja-JP/tools/parallel-search">
    キー不要のオプトイン。LLM 向けに最適化された高密度の抜粋を提供し、API キー不要の Parallel の無料 Search MCP。
  </Card>
  <Card title="Perplexity" icon="search" href="/ja-JP/tools/perplexity-search">
    コンテンツ抽出制御とドメインフィルタリング付きの構造化結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/ja-JP/tools/searxng-search">
    セルフホスト型のメタ検索。API キーは不要です。Google、Bing、DuckDuckGo などを集約します。
  </Card>
  <Card title="Tavily" icon="globe" href="/ja-JP/tools/tavily">
    検索深度、トピックフィルタリング、URL 抽出向けの `tavily_extract` を備えた構造化結果。
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
| [Kimi](/ja-JP/tools/kimi-search)                       | AI 合成 + 引用。根拠のないチャットフォールバックでは失敗     | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ja-JP/tools/minimax-search)          | 構造化スニペット                                             | リージョン（`global` / `cn`）                    | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ja-JP/tools/ollama-search)        | 構造化スニペット                                             | --                                               | サインイン済みのローカルホストではなし。直接 `https://ollama.com` 検索には `OLLAMA_API_KEY` |
| [Parallel](/ja-JP/tools/parallel-search)               | LLM コンテキスト向けにランク付けされた高密度の抜粋           | --                                               | `PARALLEL_API_KEY`（有料）                                                              |
| [Parallel Search (Free)](/ja-JP/tools/parallel-search) | LLM コンテキスト向けにランク付けされた高密度の抜粋           | --                                               | なし（無料 Search MCP）                                                                 |
| [Perplexity](/ja-JP/tools/perplexity-search)           | 構造化スニペット                                             | 国、言語、時間、ドメイン、コンテンツ制限         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ja-JP/tools/searxng-search)                 | 構造化スニペット                                             | カテゴリ、言語                                   | なし（セルフホスト）                                                                    |
| [Tavily](/ja-JP/tools/tavily)                          | 構造化スニペット                                             | `tavily_search` ツール経由                       | `TAVILY_API_KEY`                                                                        |

## 自動検出

## ネイティブ OpenAI web search

直接の OpenAI Responses モデルは、OpenClaw web search が有効で、管理対象プロバイダーが固定されていない場合、OpenAI のホスト型 `web_search` ツールを自動的に使用します。これはバンドルされた OpenAI Plugin 内のプロバイダー所有の挙動であり、ネイティブ OpenAI API トラフィックにのみ適用され、OpenAI 互換プロキシのベース URL や Azure ルートには適用されません。OpenAI モデルに管理対象の `web_search` ツールを維持するには、`tools.web.search.provider` を `brave` など別のプロバイダーに設定します。または、管理対象検索とネイティブ OpenAI 検索の両方を無効にするには、`tools.web.search.enabled: false` を設定します。

## ネイティブ Codex web search

Codex app-server ランタイムは、web search が有効で管理対象プロバイダーが選択されていない場合、Codex のホスト型 `web_search` ツールを自動的に使用します。ネイティブのホスト型検索と OpenClaw の管理対象 `web_search` 動的ツールは相互排他的であるため、管理対象検索がネイティブのドメイン制限を迂回することはできません。OpenClaw は、ホスト型検索が利用できない、明示的に無効化されている、または選択された管理対象プロバイダーに置き換えられている場合に、管理対象ツールを使用します。OpenClaw は Codex のスタンドアロン `web.run` 拡張を無効のままにします。本番 app-server トラフィックがユーザー定義の `web` 名前空間を拒否するためです。

- ネイティブ検索は `tools.web.search.openaiCodex` で設定します
- `tools.web.search.provider: "codex"` を設定すると、任意の親モデル向けの管理対象 `web_search` プロバイダーとして Codex Hosted Search をプロビジョニングします。各呼び出しは、境界付きの一時的な Codex app-server ターンを実行し、Codex がホスト型 `webSearch` 項目を出力しない場合は失敗します。
- `mode: "cached"` がデフォルトの優先設定ですが、Codex は制限のない app-server ターンではこれをライブ外部アクセスに解決します。ライブアクセスを明示的に要求するには `"live"` を設定します
- OpenClaw の管理対象 `web_search` を代わりに使用するには、`tools.web.search.provider` を `brave` などの管理対象プロバイダーに設定します
- Codex ホスト型検索をオプトアウトするには、`tools.web.search.openaiCodex.enabled: false` を設定します。他の管理対象プロバイダーは引き続き利用できます
- Codex ネイティブツールサーフェスを制限しても、管理対象 `web_search` は利用可能なままです
- `allowedDomains` が設定されている場合、ホスト型検索が利用できないと自動管理対象フォールバックはフェイルクローズするため、ネイティブの許可リストを迂回できません
- ツール無効の LLM のみの実行では、ネイティブ検索と管理対象検索の両方が無効になります
- `tools.web.search.enabled: false` は、管理対象検索とネイティブ検索の両方を無効にします

永続的に有効な Codex 検索ポリシーの変更では、新しいバインド済みスレッドを開始するため、すでに読み込まれた app-server スレッドが古いホスト型検索アクセスを保持することはできません。一時的なターン単位の制限では、一時的な制限付きスレッドを使用し、後で再開するために既存のバインディングを保持します。

直接の OpenAI ChatGPT Responses トラフィックでも、OpenAI のホスト型
`web_search` ツールを使用できます。この別経路は
`tools.web.search.openaiCodex.enabled: true` によるオプトインのままであり、
`api: "openai-chatgpt-responses"` を使用する対象の
`openai/*` モデルにのみ適用されます。

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

ネイティブ Codex 検索をサポートしないランタイムやプロバイダーでは、Codex は OpenClaw の動的ツール名前空間を通じて、管理対象 `web_search` フォールバックを使用できます。Codex ホスト型検索ではなく、OpenClaw のプロバイダー固有のネットワーク制御が必要な場合は、明示的な管理対象プロバイダーを使用してください。

`provider: "codex"` を選択すると、バンドルされた `codex` Plugin が有効になり、上記と同じ `tools.web.search.openaiCodex` 制限が使用されます。先に `openclaw models auth login --provider openai` で Codex app-server を認証してください。親エージェントは任意のモデルまたはランタイムを使用できます。Codex 経由で実行されるのは、範囲が限定された検索ワーカーだけです。

## ネットワーク安全性

管理対象 HTTP `web_search` プロバイダー呼び出しは、OpenClaw の保護された fetch パスを使用します。信頼済みプロバイダー API ホストについては、OpenClaw は Surge、Clash、sing-box の fake-IP DNS 応答を、そのプロバイダーのホスト名に対してのみ `198.18.0.0/15` と `fc00::/7` で許可します。それ以外のプライベート、ループバック、リンクローカル、メタデータ宛先は引き続きブロックされます。Codex Hosted Search は例外です。その範囲限定ワーカーは、ネットワークアクセスを Codex app-server のホスト型 `web_search` ツールに委譲します。

この自動許可は、任意の `web_fetch` URL には適用されません。`web_fetch` では、信頼済みプロキシがそれらの合成範囲を所有している場合にのみ、`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` と `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` を明示的に有効にしてください。

## Web 検索の設定

ドキュメントとセットアップフロー内のプロバイダー一覧はアルファベット順です。自動検出では別の優先順位が保持されます。

`provider` が設定されていない場合、OpenClaw は次の順序でプロバイダーを確認し、最初に準備できているものを使用します。

まず API ベースのプロバイダー:

1. **Brave** -- `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey` (順序 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` または `plugins.entries.minimax.config.webSearch.apiKey` (順序 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY`、または `models.providers.google.apiKey` (順序 20)
4. **Grok** -- xAI OAuth、`XAI_API_KEY`、または `plugins.entries.xai.config.webSearch.apiKey` (順序 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` または `plugins.entries.moonshot.config.webSearch.apiKey` (順序 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` または `plugins.entries.perplexity.config.webSearch.apiKey` (順序 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey` (順序 60)
8. **Exa** -- `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`; 任意の `plugins.entries.exa.config.webSearch.baseUrl` は Exa エンドポイントを上書きします (順序 65)
9. **Tavily** -- `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey` (順序 70)
10. **Parallel** -- `PARALLEL_API_KEY` または `plugins.entries.parallel.config.webSearch.apiKey` 経由の有料 Parallel Search API; 任意の `plugins.entries.parallel.config.webSearch.baseUrl` はエンドポイントを上書きします (順序 75)

その後に構成済みエンドポイントプロバイダー:

11. **SearXNG** -- `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl` (順序 200)

**Parallel Search (Free)**、**DuckDuckGo**、**Ollama Web Search**、**Codex Hosted Search** などのキー不要プロバイダーは、`tools.web.search.provider` または `openclaw configure --section web` で明示的に選択した場合にのみ利用できます。API ベースのプロバイダーが構成されていないという理由だけで、OpenClaw が管理対象の `web_search` クエリをキー不要プロバイダーへ送ることはありません。

OpenAI Responses モデルは例外です。`tools.web.search.provider` が未設定の場合、上記の管理対象プロバイダーではなく OpenAI のネイティブ Web 検索を使用します。管理対象パス経由でルーティングするには、`tools.web.search.provider` を `parallel-free` (または別のプロバイダー) に設定してください。

<Note>
  すべてのプロバイダーキー項目は SecretRef オブジェクトをサポートします。
  `plugins.entries.<plugin>.config.webSearch.apiKey` 配下の Plugin スコープ SecretRef は、Brave、Exa、Firecrawl、
  Gemini、Grok、Kimi、MiniMax、Parallel、Perplexity、Tavily を含む、インストール済みの API ベース Web 検索プロバイダーで解決されます。
  これは、プロバイダーが `tools.web.search.provider` で明示的に選択された場合でも、自動検出で選択された場合でも同じです。
  自動検出モードでは、OpenClaw は選択されたプロバイダーキーのみを解決します。選択されなかった SecretRef は非アクティブのままなので、使用していないプロバイダーの解決コストを払わずに複数のプロバイダーを構成しておけます。
</Note>

## 構成

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

プロバイダー固有の構成 (API キー、ベース URL、モード) は `plugins.entries.<plugin>.config.webSearch.*` 配下にあります。Gemini は、専用の Web 検索構成と `GEMINI_API_KEY` の後の低優先度フォールバックとして、`models.providers.google.apiKey` と `models.providers.google.baseUrl` も再利用できます。例についてはプロバイダーページを参照してください。
Grok は、`openclaw models auth login
--provider xai --method oauth` の xAI OAuth 認証プロファイルも再利用できます。API キー構成は引き続きフォールバックです。

`tools.web.search.provider` は、バンドル済みおよびインストール済み Plugin マニフェストで宣言された Web 検索プロバイダー ID に対して検証されます。`"brvae"` のような typo は、自動検出へ黙ってフォールバックするのではなく、構成検証で失敗します。サードパーティ Plugin をアンインストールした後に残った `plugins.entries.<plugin>` ブロックなど、構成済みプロバイダーに古い Plugin の証跡しかない場合、OpenClaw は起動の堅牢性を維持し、Plugin を再インストールするか `openclaw doctor --fix` を実行して古い構成をクリーンアップできるよう警告を報告します。

`web_fetch` フォールバックプロバイダーの選択は別です。

- `tools.web.fetch.provider` で選択します
- またはその項目を省略し、OpenClaw に構成済み認証情報から最初に準備できている web-fetch プロバイダーを自動検出させます
- 非サンドボックスの `web_fetch` は、`contracts.webFetchProviders` を宣言するインストール済み Plugin プロバイダーを使用できます。サンドボックス化された fetch はバンドル済みプロバイダーと検証済み公式 Plugin インストールを許可しますが、サードパーティ外部 Plugin は除外します
- 公式 Firecrawl Plugin は web-fetch フォールバックを提供し、`plugins.entries.firecrawl.config.webFetch.*` 配下で構成されます

`openclaw onboard` または `openclaw configure --section web` で **Kimi** を選択すると、OpenClaw は次の内容も尋ねることができます。

- Moonshot API リージョン (`https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`)
- 既定の Kimi Web 検索モデル (既定は `kimi-k2.6`)

`x_search` では、`plugins.entries.xai.config.xSearch.*` を構成してください。これはチャットと同じ xAI 認証プロファイル、または Grok Web 検索で使用される `XAI_API_KEY` / Plugin Web 検索認証情報を使用します。
従来の `tools.web.x_search.*` 構成は、`openclaw doctor --fix` によって自動移行されます。
`openclaw onboard` または `openclaw configure --section web` で Grok を選択すると、OpenClaw は同じ認証情報で任意の `x_search` セットアップも提示できます。
これは Grok パス内の別個の後続ステップであり、トップレベルの Web 検索プロバイダー選択ではありません。別のプロバイダーを選択した場合、OpenClaw は `x_search` プロンプトを表示しません。

### API キーの保存

<Tabs>
  <Tab title="構成ファイル">
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
    Gateway プロセス環境でプロバイダー環境変数を設定します。

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Gateway インストールでは、`~/.openclaw/.env` に入れてください。
    [環境変数](/ja-JP/help/faq#env-vars-and-env-loading) を参照してください。

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
| `date_after`          | この日付より後の結果 (YYYY-MM-DD)                     |
| `date_before`         | この日付より前の結果 (YYYY-MM-DD)                     |
| `ui_lang`             | UI 言語コード (Brave のみ)                            |
| `domain_filter`       | ドメイン許可リスト/拒否リスト配列 (Perplexity のみ)  |
| `max_tokens`          | 合計コンテンツ予算、既定 25000 (Perplexity のみ)      |
| `max_tokens_per_page` | ページごとのトークン上限、既定 2048 (Perplexity のみ) |

<Warning>
  すべてのパラメーターがすべてのプロバイダーで機能するわけではありません。Brave `llm-context` モードは `ui_lang` を拒否します。Brave のカスタム freshness 範囲では開始日と終了日の両方が必要なため、`date_before` には `date_after` も必要です。
  Gemini、Grok、Kimi は引用付きの合成回答を 1 つ返します。共有ツール互換性のために `count` を受け付けますが、根拠付き回答の形は変わりません。Gemini は `day` freshness を新しさのヒントとして扱います。より広い freshness 値と明示的な日付は、Google Search grounding の時間範囲を設定します。
  Sonar/OpenRouter 互換パス (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` または `OPENROUTER_API_KEY`) を使用する場合、Perplexity も同じように動作します。
  SearXNG は、信頼済みプライベートネットワークまたはループバックホストに対してのみ `http://` を受け付けます。公開 SearXNG エンドポイントでは `https://` を使用する必要があります。
  Firecrawl と Tavily は `web_search` 経由では `query` と `count` のみをサポートします。高度なオプションには専用ツールを使用してください。
</Warning>

## x_search

`x_search` は xAI を使用して X (旧 Twitter) の投稿をクエリし、引用付きの AI 合成回答を返します。自然言語クエリと任意の構造化フィルターを受け付けます。OpenClaw は、このツール呼び出しを処理するリクエストでのみ、組み込み xAI `x_search` ツールを有効にします。

<Note>
  xAI は、`x_search` がキーワード検索、セマンティック検索、ユーザー検索、スレッド取得をサポートすると文書化しています。リポスト、返信、ブックマーク、表示回数など投稿ごとのエンゲージメント統計には、正確な投稿 URL またはステータス ID を対象にした検索を推奨します。広範なキーワード検索でも正しい投稿を見つけられる場合がありますが、投稿ごとのメタデータが完全ではないことがあります。良いパターンは、まず投稿を特定し、その正確な投稿に焦点を当てた 2 回目の `x_search` クエリを実行することです。
</Note>

### x_search 構成

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

`plugins.entries.xai.config.xSearch.baseUrl` が設定されている場合、`x_search` は `<baseUrl>/responses` に投稿します。その項目が省略されている場合、`plugins.entries.xai.config.webSearch.baseUrl`、次に従来の `tools.web.search.grok.baseUrl`、最後に公開 xAI エンドポイントへフォールバックします。

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

## 関連情報

- [Web Fetch](/ja-JP/tools/web-fetch) -- URL を取得し、読みやすいコンテンツを抽出する
- [Web Browser](/ja-JP/tools/browser) -- JS の多いサイト向けの完全なブラウザー自動化
- [Grok Search](/ja-JP/tools/grok-search) -- `web_search` プロバイダーとしての Grok
- [Ollama Web Search](/ja-JP/tools/ollama-search) -- Ollama ホスト経由のキー不要のウェブ検索
