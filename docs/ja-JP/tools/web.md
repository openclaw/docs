---
read_when:
    - web_search を有効化または設定する場合
    - x_search を有効化または設定しようとしています
    - 検索プロバイダーを選択する必要があります
    - 自動検出とプロバイダーの選択について理解したい場合
sidebarTitle: Web Search
summary: web_search、x_search、web_fetch -- Web を検索、X の投稿を検索、またはページのコンテンツを取得
title: Web 検索
x-i18n:
    generated_at: "2026-07-12T14:58:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` は、設定済みのプロバイダーでウェブを検索し、正規化された結果を返します。結果はクエリごとに 15 分間キャッシュされます（設定可能）。OpenClaw には、X（旧 Twitter）の投稿を検索する `x_search` と、軽量な URL 取得を行う `web_fetch` も同梱されています。`web_fetch` は常にローカルで実行されます。Grok がプロバイダーの場合、`web_search` は xAI Responses 経由でルーティングされ、`x_search` は常に xAI Responses を使用します。

<Info>
  `web_search` は軽量な HTTP ツールであり、ブラウザー自動化ではありません。
  JS を多用するサイトやログインが必要な場合は、[ウェブブラウザー](/ja-JP/tools/browser)を使用してください。
  特定の URL を取得する場合は、[Web Fetch](/ja-JP/tools/web-fetch)を使用してください。
</Info>

## クイックスタート

<Steps>
  <Step title="プロバイダーを選択">
    プロバイダーを選択し、必要なセットアップを完了します。キーが不要なプロバイダーもあれば、API キーが必要なものもあります。詳細については、以下のプロバイダーページを参照してください。
  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    ```
    これにより、プロバイダーと必要な認証情報が保存されます。API ベースのプロバイダーでは、代わりにプロバイダーの環境変数（例: `BRAVE_API_KEY`）を設定し、この手順を省略できます。
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
    スニペット付きの構造化された結果。`llm-context` モード、国および言語フィルターをサポートします。無料枠を利用できます。
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/ja-JP/plugins/codex-harness">
    Codex app-server アカウントを通じて、根拠に基づき AI が統合した回答を提供します。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ja-JP/tools/duckduckgo-search">
    キー不要のプロバイダーです。API キーは不要です。非公式の HTML ベースの統合です。
  </Card>
  <Card title="Exa" icon="brain" href="/ja-JP/tools/exa-search">
    コンテンツ抽出（ハイライト、テキスト、要約）を備えたニューラル検索とキーワード検索。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ja-JP/tools/firecrawl">
    構造化された結果。詳細な抽出には、`firecrawl_search` および `firecrawl_scrape` と組み合わせるのが最適です。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ja-JP/tools/gemini-search">
    Google Search グラウンディングを介して、引用付きの AI が統合した回答を提供します。
  </Card>
  <Card title="Grok" icon="zap" href="/ja-JP/tools/grok-search">
    xAI ウェブグラウンディングを介して、引用付きの AI が統合した回答を提供します。
  </Card>
  <Card title="Kimi" icon="moon" href="/ja-JP/tools/kimi-search">
    Moonshot ウェブ検索を介して、引用付きの AI が統合した回答を提供します。グラウンディングされていないチャットへのフォールバックは明示的に失敗します。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ja-JP/tools/minimax-search">
    MiniMax Token Plan 検索 API を介した構造化された結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ja-JP/tools/ollama-search">
    サインイン済みのローカル Ollama ホストまたはホスト型 Ollama API を介して検索します。
  </Card>
  <Card title="Parallel" icon="layer-group" href="/ja-JP/tools/parallel-search">
    有料の Parallel Search API（`PARALLEL_API_KEY`）。より高いレート制限と目的に応じた調整を提供します。
  </Card>
  <Card title="Parallel Search（無料）" icon="layer-group" href="/ja-JP/tools/parallel-search">
    オプトインでキー不要。Parallel の無料 Search MCP で、LLM 向けに最適化された高密度な抜粋を API キーなしで提供します。
  </Card>
  <Card title="Perplexity" icon="search" href="/ja-JP/tools/perplexity-search">
    コンテンツ抽出制御とドメインフィルタリングを備えた構造化された結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/ja-JP/tools/searxng-search">
    セルフホスト型のメタ検索。API キーは不要です。Google、Bing、DuckDuckGo などを集約します。
  </Card>
  <Card title="Tavily" icon="globe" href="/ja-JP/tools/tavily">
    検索深度、トピックフィルタリング、URL 抽出用の `tavily_extract` を備えた構造化された結果。
  </Card>
</CardGroup>

### プロバイダーの比較

| プロバイダー                                    | 結果の形式                                                     | フィルター                                       | API キー                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/ja-JP/tools/brave-search)                     | 構造化されたスニペット                                         | 国、言語、期間、`llm-context` モード             | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/ja-JP/plugins/codex-harness)    | AI による統合 + ソース URL                                     | ドメイン、コンテキストサイズ、ユーザーの所在地   | なし。Codex/OpenAI のサインインを使用                                                   |
| [DuckDuckGo](/ja-JP/tools/duckduckgo-search)           | 構造化されたスニペット                                         | --                                               | なし（キー不要）                                                                        |
| [Exa](/ja-JP/tools/exa-search)                         | 構造化 + 抽出                                                  | ニューラル／キーワードモード、日付、コンテンツ抽出 | `EXA_API_KEY`                                                                           |
| [Firecrawl](/ja-JP/tools/firecrawl)                    | 構造化されたスニペット                                         | `firecrawl_search` ツール経由                    | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/ja-JP/tools/gemini-search)                   | AI による統合 + 引用                                           | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/ja-JP/tools/grok-search)                       | AI による統合 + 引用                                           | --                                               | xAI OAuth、`XAI_API_KEY`、または `plugins.entries.xai.config.webSearch.apiKey`          |
| [Kimi](/ja-JP/tools/kimi-search)                       | AI による統合 + 引用。グラウンディングされていないチャットへのフォールバック時は失敗 | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/ja-JP/tools/minimax-search)          | 構造化されたスニペット                                         | リージョン（`global` / `cn`）                    | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/ja-JP/tools/ollama-search)        | 構造化されたスニペット                                         | --                                               | サインイン済みのローカルホストでは不要。`https://ollama.com` の直接検索には `OLLAMA_API_KEY` |
| [Parallel](/ja-JP/tools/parallel-search)               | LLM コンテキスト向けに順位付けされた高密度な抜粋              | --                                               | `PARALLEL_API_KEY`（有料）                                                               |
| [Parallel Search（無料）](/ja-JP/tools/parallel-search) | LLM コンテキスト向けに順位付けされた高密度な抜粋              | --                                               | なし（無料 Search MCP）                                                                  |
| [Perplexity](/ja-JP/tools/perplexity-search)           | 構造化されたスニペット                                         | 国、言語、期間、ドメイン、コンテンツ制限         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/ja-JP/tools/searxng-search)                 | 構造化されたスニペット                                         | カテゴリー、言語                                 | なし（セルフホスト）                                                                      |
| [Tavily](/ja-JP/tools/tavily)                          | 構造化されたスニペット                                         | `tavily_search` ツール経由                       | `TAVILY_API_KEY`                                                                        |

## 自動検出

ドキュメントおよびセットアップフロー内のプロバイダー一覧はアルファベット順です。自動検出では、別個の固定された優先順位を使用し、認証情報が必要なプロバイダー（`requiresCredential !== false`）について、設定済みのものが見つかった場合にのみ選択します。`provider` が設定されていない場合、OpenClaw は次の順序でプロバイダーを確認し、最初に準備が整っているものを使用します。

まず API ベースのプロバイダー:

1. **Brave** -- `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` または `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY`、または `models.providers.google.apiKey`（順序 20）
4. **Grok** -- xAI OAuth、`XAI_API_KEY`、または `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` または `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` または `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`。オプションの `plugins.entries.exa.config.webSearch.baseUrl` で Exa エンドポイントを上書きできます（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）
10. **Parallel** -- `PARALLEL_API_KEY` または `plugins.entries.parallel.config.webSearch.apiKey` を介した有料の Parallel Search API。オプションの `plugins.entries.parallel.config.webSearch.baseUrl` でエンドポイントを上書きできます（順序 75）

その後に、設定済みエンドポイントのプロバイダー:

11. **SearXNG** -- `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

**Parallel Search（無料）**、**DuckDuckGo**、**Ollama Web Search**、**Codex Hosted Search** などのキー不要のプロバイダーは、内部的な順序値を持っていても、自動検出では決して選択されません。これらは、`tools.web.search.provider` または `openclaw configure --section web` を通じて明示的に選択した場合にのみ使用されます。API ベースのプロバイダーが設定されていないという理由だけで、OpenClaw が管理対象の `web_search` クエリをキー不要のプロバイダーに送信することはありません。

OpenAI Responses モデルは例外です。`tools.web.search.provider` が未設定の場合、上記の管理対象プロバイダーではなく、OpenAI のネイティブウェブ検索を使用します（以下を参照）。代わりに管理対象の経路を通すには、`tools.web.search.provider` を `parallel-free`（または別のプロバイダー）に設定します。

<Note>
  すべてのプロバイダーのキーフィールドは SecretRef オブジェクトをサポートします。`plugins.entries.<plugin>.config.webSearch.apiKey` 配下の Plugin スコープの SecretRef は、インストール済みの API ベースのウェブ検索プロバイダー（Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax、Parallel、Perplexity、Tavily を含む）について、`tools.web.search.provider` でプロバイダーを明示的に指定した場合でも、自動検出で選択された場合でも解決されます。自動検出モードでは、OpenClaw は選択されたプロバイダーのキーのみを解決します。選択されていない SecretRef は非アクティブなままなので、使用していないプロバイダーの解決コストを負担せずに、複数のプロバイダーを設定しておけます。
</Note>

## OpenAI ネイティブウェブ検索

OpenAI Responses モデルを直接使用する場合（`api: "openai-responses"`、プロバイダーは `openai`、
ベース URL なし、または OpenAI 公式 API のベース URL）、OpenClaw のウェブ検索が有効で、
管理対象プロバイダーが固定されていなければ、OpenAI がホストする `web_search` ツールが
自動的に使用されます。これは同梱の OpenAI Plugin におけるプロバイダー所有の動作であり、
OpenAI 互換プロキシのベース URL や Azure ルートには適用されません。
OpenAI モデルで管理対象の `web_search` ツールを引き続き使用するには、
`tools.web.search.provider` を `brave` など別のプロバイダーに設定します。
管理対象検索と OpenAI ネイティブ検索の両方を無効にするには、
`tools.web.search.enabled: false` を設定します。

## Codex ネイティブウェブ検索

Codex app-server ランタイムでは、ウェブ検索が有効で管理対象プロバイダーが選択されていない場合、
Codex がホストする `web_search` ツールが自動的に使用されます。ネイティブのホスト型検索と
OpenClaw の管理対象 `web_search` 動的ツールは相互排他的であるため、管理対象検索でネイティブの
ドメイン制限を回避することはできません。ホスト型検索が利用できない場合、明示的に無効化されている場合、
または選択した管理対象プロバイダーに置き換えられている場合、OpenClaw は管理対象ツールを使用します。
本番環境の app-server トラフィックでは、ユーザー定義の `web` 名前空間が拒否されるため、
OpenClaw は Codex のスタンドアロン `web.run` 拡張機能を無効
（`features.standalone_web_search: false`）に保ちます。

- ネイティブ検索は `tools.web.search.openaiCodex` で設定します
- 任意の親モデルで Codex Hosted Search を管理対象 `web_search` プロバイダーとして用意するには、
  `tools.web.search.provider: "codex"` を設定します。各呼び出しでは、範囲が制限された一時的な
  Codex app-server ターンが実行され、Codex がホスト型 `webSearch` 項目を出力しなければ失敗します。
- デフォルトの優先モードは `mode: "cached"` ですが、制限のない app-server ターンでは、
  Codex によって外部へのライブアクセスとして解決されます。ライブアクセスを明示的に要求するには
  `"live"` を設定します
- 代わりに OpenClaw の管理対象 `web_search` を使用するには、
  `tools.web.search.provider` を `brave` などの管理対象プロバイダーに設定します
- Codex がホストする検索を使用しないようにするには、
  `tools.web.search.openaiCodex.enabled: false` を設定します。他の管理対象プロバイダーは引き続き利用できます
- Codex のネイティブツールサーフェスを制限した場合も、管理対象 `web_search` は引き続き利用できます
- `allowedDomains` が設定されている場合、ホスト型検索が利用できなければ自動的な管理対象フォールバックは
  フェイルクローズとなり、ネイティブの許可リストを回避できません
- ツールを無効にした LLM のみの実行では、ネイティブ検索と管理対象検索の両方が無効になります
- `tools.web.search.enabled: false` は管理対象検索とネイティブ検索の両方を無効にします

永続的かつ実効的な Codex 検索ポリシーを変更すると、新しいバインド済みスレッドが開始され、
すでに読み込まれている app-server スレッドが古いホスト型検索アクセスを保持できないようにします。
ターンごとの一時的な制限では、一時的な制限付きスレッドを使用し、後で再開できるよう既存のバインディングを維持します。

OpenAI ChatGPT Responses の直接トラフィックでも、OpenAI がホストする `web_search` ツールを使用できます。
この別経路は引き続き `tools.web.search.openaiCodex.enabled: true` によるオプトイン方式であり、
`api: "openai-chatgpt-responses"` を使用する対象の `openai/*` モデルにのみ適用されます。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // 任意: Codex 以外の親モデルからも Codex Hosted Search を使用します。
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

Codex ネイティブ検索をサポートしないランタイムやプロバイダーでは、Codex は OpenClaw の動的ツール名前空間を通じて、
管理対象 `web_search` フォールバックを使用できます。Codex がホストする検索ではなく、
OpenClaw のプロバイダー固有のネットワーク制御が必要な場合は、管理対象プロバイダーを明示的に指定してください。

`provider: "codex"` を選択すると、同梱の `codex` Plugin が有効になり、
上記と同じ `tools.web.search.openaiCodex` の制限が使用されます。
まず `openclaw models auth login --provider openai` を使用して Codex app-server を認証してください。
親エージェントは任意のモデルまたはランタイムを使用できます。Codex を経由して実行されるのは、
範囲が制限された検索ワーカーのみです。

## ネットワークの安全性

管理対象の HTTP `web_search` プロバイダー呼び出しでは、現在のプロバイダー自身のホスト名に限定して、OpenClaw の保護されたフェッチ経路を使用します。そのホスト名に限り、OpenClaw は `198.18.0.0/15` および `fc00::/7` に含まれる Surge、Clash、sing-box の fake-IP DNS 応答を許可します。その他のプライベート、ループバック、リンクローカル、およびメタデータ宛先は引き続きブロックされます。Codex Hosted Search は例外です。範囲が制限されたワーカーが、Codex app-server のホスト型 `web_search` ツールにネットワークアクセスを委任します。

この自動許可は、任意の `web_fetch` URL には適用されません。`web_fetch` では、信頼できるプロキシがこれらの合成範囲を所有している場合に限り、`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` と `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` を明示的に有効にしてください。

## 設定

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // デフォルト: true
        provider: "brave", // または自動検出する場合は省略
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

プロバイダー固有の設定（API キー、ベース URL、モード）は、`plugins.entries.<plugin>.config.webSearch.*` に配置します。Gemini は、専用の Web 検索設定と `GEMINI_API_KEY` に続く優先度の低いフォールバックとして、`models.providers.google.apiKey` と `models.providers.google.baseUrl` も再利用できます。例については、各プロバイダーのページを参照してください。
Grok は、`openclaw models auth login
--provider xai --method oauth` で作成した xAI OAuth 認証プロファイルも再利用できます。API キー設定は引き続きフォールバックです。

`tools.web.search.provider` は、同梱およびインストール済みの Plugin マニフェストで宣言された Web 検索プロバイダー ID に照らして検証されます。`"brvae"` のような入力ミスがあると、自動検出へ暗黙的にフォールバックするのではなく、設定検証に失敗します。設定済みのプロバイダーに古い Plugin 情報しか存在しない場合（たとえば、サードパーティー Plugin のアンインストール後に `plugins.entries.<plugin>` ブロックが残っている場合）、OpenClaw は起動の耐障害性を維持しつつ警告を報告するため、Plugin を再インストールするか、`openclaw doctor --fix` を実行して古い設定をクリーンアップできます。

`web_fetch` のフォールバックプロバイダーの選択は別途行われます。

- `tools.web.fetch.provider` で選択する
- または、そのフィールドを省略し、設定済みの認証情報から準備済みの最初の Web フェッチプロバイダーを OpenClaw に自動検出させる
- サンドボックス化されていない `web_fetch` では、`contracts.webFetchProviders` を宣言するインストール済み Plugin プロバイダーを使用できます。サンドボックス化されたフェッチでは、同梱プロバイダーと検証済みの公式 Plugin インストールが許可されますが、外部のサードパーティー Plugin は除外されます
- 公式の Firecrawl Plugin は現在、同梱されている唯一の `webFetchProviders` コントリビューターであり、`plugins.entries.firecrawl.config.webFetch.*` で設定します

`openclaw onboard` または `openclaw configure --section web` で **Kimi** を選択すると、OpenClaw は次の項目も確認できます。

- Moonshot API のリージョン（`https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`）
- デフォルトの Kimi Web 検索モデル（デフォルトは `kimi-k2.6`）

`x_search` では、`plugins.entries.xai.config.xSearch.*` を設定します。チャットと同じ xAI 認証プロファイル、または Grok Web 検索で使用される `XAI_API_KEY` / Plugin の Web 検索認証情報を使用します。
従来の `tools.web.x_search.*` 設定は、`openclaw doctor --fix` によって自動的に移行されます。
`openclaw onboard` または `openclaw configure --section web` で Grok を選択すると、Grok の設定完了直後に、同じ認証情報を使用するオプションの `x_search` 設定も OpenClaw から提示されます。これは Grok の設定経路内にある独立した追加手順であり、トップレベルの Web 検索プロバイダーを別途選択するものではありません。別のプロバイダーを選択した場合、OpenClaw は `x_search` のプロンプトを表示しません。

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
    Gateway プロセスの環境でプロバイダーの環境変数を設定します。

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Gateway のインストール環境では、`~/.openclaw/.env` に記述します。
    [環境変数](/ja-JP/help/faq#env-vars-and-env-loading)を参照してください。

  </Tab>
</Tabs>

## ツールのパラメーター

| パラメーター          | 説明                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | 検索クエリ（必須）                                                 |
| `count`               | 返す結果数（1～10、デフォルト: 5）                                 |
| `country`             | 2 文字の ISO 国コード（例: "US"、"DE"）                            |
| `language`            | ISO 639-1 言語コード（例: "en"、"de"）                             |
| `search_lang`         | 検索言語コード（Brave のみ）                                       |
| `freshness`           | 時間フィルター: `day`、`week`、`month`、または `year`              |
| `date_after`          | この日付より後の結果（YYYY-MM-DD）                                 |
| `date_before`         | この日付より前の結果（YYYY-MM-DD）                                 |
| `ui_lang`             | UI 言語コード（Brave のみ）                                        |
| `domain_filter`       | ドメインの許可リスト/拒否リスト配列（Perplexity のみ）             |
| `max_tokens`          | コンテンツ全体のトークン予算（ネイティブ Perplexity Search API のみ） |
| `max_tokens_per_page` | ページごとの抽出トークン上限（ネイティブ Perplexity Search API のみ） |

<Warning>
  すべてのパラメーターがすべてのプロバイダーで機能するわけではありません。Brave の `llm-context` モードでは
  `ui_lang` が拒否されます。また、Brave のカスタム鮮度範囲には開始日と終了日の両方が必要なため、
  `date_before` を使用する場合は `date_after` も必要です。
  Gemini、Grok、Kimi は、引用付きの統合された回答を 1 件返します。共有ツールとの互換性のため
  `count` を受け付けますが、根拠付き回答の形式は変わりません。Gemini は `day` の鮮度を
  新しさのヒントとして扱います。より広い鮮度値と明示的な日付を指定すると、Google Search の
  グラウンディング時間範囲が設定されます。
  Sonar/OpenRouter 互換経路（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` または `OPENROUTER_API_KEY`）を使用する場合、Perplexity も同様に動作します。
  この経路では、`max_tokens` と `max_tokens_per_page` のサポートも失われます。
  SearXNG で `http://` を使用できるのは、信頼されたプライベートネットワークまたはループバックホストのみです。
  公開 SearXNG エンドポイントでは `https://` を使用する必要があります。
  Firecrawl と Tavily が `web_search` 経由でサポートするのは `query` と `count` のみです。
  高度なオプションには、それぞれの専用ツールを使用してください。
</Warning>

## x_search

`x_search` は xAI を使用して X（旧 Twitter）の投稿を検索し、引用付きの
AI が統合した回答を返します。自然言語クエリと、オプションの構造化フィルターを受け付けます。
OpenClaw は組み込みの xAI `x_search` ツールを永続的に登録しておくのではなく、
リクエストごとに構築するため、実際に呼び出したターンでのみ有効になります。

<Warning>
  `x_search` は xAI のサーバー上で実行されます。xAI の料金はツール呼び出し 1,000 回あたり $5 で、
  これにモデルの入力トークンと出力トークンの料金が加算されます。
</Warning>

<Note>
  xAI のドキュメントでは、`x_search` はキーワード検索、セマンティック検索、ユーザー検索、
  スレッド取得をサポートしています。リポスト、返信、ブックマーク、閲覧数など、
  投稿ごとのエンゲージメント統計を取得する場合は、正確な投稿 URL またはステータス ID を対象とした
  検索を推奨します。広範なキーワード検索でも目的の投稿が見つかる場合がありますが、
  投稿ごとのメタデータが不完全になる可能性があります。まず投稿を特定してから、
  その投稿だけに絞った 2 回目の `x_search` クエリを実行する方法が効果的です。
</Note>

### x_search の設定

`enabled`を省略した場合、`x_search`は、アクティブなモデルのプロバイダーが`xai`であり、かつxAI認証情報を解決できる場合にのみ公開されます。既知の非xAIプロバイダーを使用するアクティブなモデルで、プロバイダーをまたいだ利用を有効にするには、`plugins.entries.xai.config.xSearch.enabled`を`true`に設定します。アクティブなモデルのプロバイダーが存在しないか解決できない場合、ツールは非表示のままです。すべてのプロバイダーで無効にするには、`enabled`を`false`に設定します。xAI認証情報は常に必要です。

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // 既知の非xAIモデルプロバイダーでは必須
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // 任意。webSearch.baseUrlを上書き
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // xAI認証プロファイルまたはXAI_API_KEYが設定されている場合は任意
            baseUrl: "https://api.x.ai/v1", // 任意の共有xAI ResponsesベースURL
          },
        },
      },
    },
  },
}
```

`plugins.entries.xai.config.xSearch.baseUrl`が設定されている場合、`x_search`は`<baseUrl>/responses`にPOSTします。このフィールドを省略した場合、`plugins.entries.xai.config.webSearch.baseUrl`、従来の`tools.web.search.grok.baseUrl`、最後に公開xAIエンドポイント（`https://api.x.ai/v1`）の順にフォールバックします。

### x_searchのパラメーター

| パラメーター                 | 説明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 検索クエリ（必須）                                     |
| `allowed_x_handles`          | 結果を最大20個のXハンドルに制限                        |
| `excluded_x_handles`         | 最大20個のXハンドルを除外                              |
| `from_date`                  | この日付以降の投稿のみを含める（YYYY-MM-DD）           |
| `to_date`                    | この日付以前の投稿のみを含める（YYYY-MM-DD）           |
| `enable_image_understanding` | 一致した投稿に添付された画像をxAIが解析できるようにする |
| `enable_video_understanding` | 一致した投稿に添付された動画をxAIが解析できるようにする |

`allowed_x_handles`と`excluded_x_handles`は同時に指定できません。

### x_searchの例

```javascript
await x_search({
  query: "夕食のレシピ",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 投稿ごとの統計：可能であれば正確なステータスURLまたはステータスIDを使用
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 例

```javascript
// 基本的な検索
await web_search({ query: "OpenClaw Plugin SDK" });

// ドイツ向けの検索
await web_search({ query: "オンラインでテレビを見る", country: "DE", language: "de" });

// 最近の結果（過去1週間）
await web_search({ query: "AIの進展", freshness: "week" });

// 日付範囲
await web_search({
  query: "気候研究",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// ドメインフィルタリング（Perplexityのみ）
await web_search({
  query: "製品レビュー",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## ツールプロファイル

ツールプロファイルまたは許可リストを使用する場合は、`web_search`、`x_search`、または`group:web`を追加します。

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // または: allow: ["group:web"]  （web_search、x_search、web_fetchを含む）
  },
}
```

## 関連項目

- [Web Fetch](/ja-JP/tools/web-fetch) -- URLを取得し、読みやすいコンテンツを抽出
- [Web Browser](/ja-JP/tools/browser) -- JSを多用するサイト向けの完全なブラウザー自動化
- [Grok Search](/ja-JP/tools/grok-search) -- `web_search`プロバイダーとしてのGrok
- [Ollama Web Search](/ja-JP/tools/ollama-search) -- Ollamaホスト経由のキー不要のWeb検索
