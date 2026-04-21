---
read_when:
    - '`web_search` を有効化または設定したい'
    - '`x_search` を有効化または設定したい'
    - 検索 provider を選ぶ必要があります
    - 自動検出と provider フォールバックを理解したい
sidebarTitle: Web Search
summary: '`web_search`、`x_search`、および `web_fetch` -- Web を検索する、X の投稿を検索する、またはページ内容を取得する'
title: Web 検索
x-i18n:
    generated_at: "2026-04-21T04:51:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e88a891ce28a5fe1baf4b9ce8565c59ba2d2695c63d77af232edd7f3fd2cd8a
    source_path: tools/web.md
    workflow: 15
---

# Web 検索

`web_search` ツールは、設定された provider を使って Web を検索し、
結果を返します。結果はクエリごとに 15 分間キャッシュされます（設定変更可能）。

OpenClaw には、X（旧 Twitter）の投稿用の `x_search` と、
軽量な URL 取得用の `web_fetch` も含まれています。このフェーズでは、`web_fetch` は
ローカルのままですが、`web_search` と `x_search` は内部で xAI Responses を使うことができます。

<Info>
  `web_search` は軽量な HTTP ツールであり、ブラウザー automation ではありません。JS の多いサイトやログインが必要な場合は、[Web Browser](/ja-JP/tools/browser) を使用してください。特定の URL を取得したい場合は、[Web Fetch](/ja-JP/tools/web-fetch) を使用してください。
</Info>

## クイックスタート

<Steps>
  <Step title="provider を選ぶ">
    provider を選び、必要なセットアップを完了してください。key 不要の provider もあれば、API key を使う provider もあります。詳細は以下の provider ページを参照してください。
  </Step>
  <Step title="設定する">
    ```bash
    openclaw configure --section web
    ```
    これにより、provider と必要な認証情報が保存されます。API ベースの
    provider では、env var（たとえば `BRAVE_API_KEY`）を設定して、この手順を省略することもできます。
  </Step>
  <Step title="使う">
    agent は `web_search` を呼び出せるようになります:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X の投稿には、次を使用します:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## provider を選ぶ

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ja-JP/tools/brave-search">
    スニペット付きの構造化結果。`llm-context` モード、国/言語フィルターをサポートします。無料枠があります。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ja-JP/tools/duckduckgo-search">
    key 不要のフォールバック。API key は不要です。非公式の HTML ベース統合です。
  </Card>
  <Card title="Exa" icon="brain" href="/ja-JP/tools/exa-search">
    コンテンツ抽出（ハイライト、テキスト、要約）を備えた neural + keyword 検索。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ja-JP/tools/firecrawl">
    構造化結果。深い抽出には `firecrawl_search` と `firecrawl_scrape` と組み合わせるのが最適です。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ja-JP/tools/gemini-search">
    Google Search grounding による引用付き AI 合成回答。
  </Card>
  <Card title="Grok" icon="zap" href="/ja-JP/tools/grok-search">
    xAI Web grounding による引用付き AI 合成回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/ja-JP/tools/kimi-search">
    Moonshot Web 検索による引用付き AI 合成回答。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ja-JP/tools/minimax-search">
    MiniMax Coding Plan search API による構造化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ja-JP/tools/ollama-search">
    設定済みの Ollama host 経由の key 不要検索。`ollama signin` が必要です。
  </Card>
  <Card title="Perplexity" icon="search" href="/ja-JP/tools/perplexity-search">
    コンテンツ抽出制御とドメインフィルタリングを備えた構造化結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/ja-JP/tools/searxng-search">
    セルフホストのメタ検索。API key は不要です。Google、Bing、DuckDuckGo などを集約します。
  </Card>
  <Card title="Tavily" icon="globe" href="/ja-JP/tools/tavily">
    検索深度、トピックフィルタリング、および URL 抽出用の `tavily_extract` を備えた構造化結果。
  </Card>
</CardGroup>

### provider 比較

| Provider                                  | 結果形式                   | フィルター                                       | API key                                                                          |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/ja-JP/tools/brave-search)              | 構造化スニペット           | 国、言語、時間、`llm-context` モード             | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/ja-JP/tools/duckduckgo-search)    | 構造化スニペット           | --                                               | なし（key 不要）                                                                 |
| [Exa](/ja-JP/tools/exa-search)                  | 構造化 + 抽出             | Neural/keyword モード、日付、コンテンツ抽出      | `EXA_API_KEY`                                                                    |
| [Firecrawl](/ja-JP/tools/firecrawl)             | 構造化スニペット           | `firecrawl_search` ツール経由                    | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/ja-JP/tools/gemini-search)            | AI 合成 + 引用             | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/ja-JP/tools/grok-search)                | AI 合成 + 引用             | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/ja-JP/tools/kimi-search)                | AI 合成 + 引用             | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/ja-JP/tools/minimax-search)   | 構造化スニペット           | リージョン（`global` / `cn`）                    | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/ja-JP/tools/ollama-search) | 構造化スニペット           | --                                               | デフォルトでは不要。`ollama signin` が必要で、Ollama provider の bearer auth を再利用できます |
| [Perplexity](/ja-JP/tools/perplexity-search)    | 構造化スニペット           | 国、言語、時間、ドメイン、コンテンツ制限         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/ja-JP/tools/searxng-search)          | 構造化スニペット           | カテゴリ、言語                                   | なし（セルフホスト）                                                             |
| [Tavily](/ja-JP/tools/tavily)                   | 構造化スニペット           | `tavily_search` ツール経由                       | `TAVILY_API_KEY`                                                                 |

## 自動検出

## ネイティブ Codex Web 検索

Codex 対応モデルは、OpenClaw 管理の `web_search` 関数の代わりに、provider ネイティブの Responses `web_search` ツールを任意で使用できます。

- `tools.web.search.openaiCodex` 配下で設定します
- 有効になるのは Codex 対応モデル（`openai-codex/*` または `api: "openai-codex-responses"` を使う provider）のみです
- non-Codex モデルには、引き続き管理された `web_search` が適用されます
- `mode: "cached"` がデフォルトで、推奨設定です
- `tools.web.search.enabled: false` は、管理された検索とネイティブ検索の両方を無効にします

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

ネイティブ Codex 検索が有効でも、現在のモデルが Codex 対応でない場合、OpenClaw は通常の管理された `web_search` の挙動を維持します。

## Web 検索をセットアップする

ドキュメントとセットアップフローの provider 一覧はアルファベット順です。自動検出は
別の優先順位を保持します。

`provider` が設定されていない場合、OpenClaw は次の順で provider を確認し、準備できている最初のものを使用します:

まず API ベースの provider:

1. **Brave** -- `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` または `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `GEMINI_API_KEY` または `plugins.entries.google.config.webSearch.apiKey`（順序 20）
4. **Grok** -- `XAI_API_KEY` または `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` または `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` または `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）

その後に key 不要のフォールバック:

10. **DuckDuckGo** -- アカウントも API key も不要な key 不要 HTML フォールバック（順序 100）
11. **Ollama Web Search** -- 設定済み Ollama host 経由の key 不要フォールバック。Ollama に到達可能で、`ollama signin` でサインイン済みである必要があり、必要なら Ollama provider の bearer auth を再利用できます（順序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

provider が検出されない場合は、Brave にフォールバックします（設定を促す missing-key
error が出ます）。

<Note>
  すべての provider key field は SecretRef object をサポートします。自動検出モードでは、
  OpenClaw は選択された provider key のみを解決し、未選択の SecretRef は
  非アクティブのままです。
</Note>

## 設定

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // デフォルト: true
        provider: "brave", // または省略して自動検出
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

provider 固有の設定（API key、base URL、mode）は
`plugins.entries.<plugin>.config.webSearch.*` 配下にあります。例は各 provider ページを参照してください。

`web_fetch` のフォールバック provider 選択は別です:

- `tools.web.fetch.provider` で選択します
- またはその field を省略し、利用可能な認証情報から最初に準備できている web-fetch
  provider を OpenClaw に自動検出させます
- 現在の同梱 web-fetch provider は Firecrawl で、
  `plugins.entries.firecrawl.config.webFetch.*` 配下で設定します

`openclaw onboard` または
`openclaw configure --section web` の実行中に **Kimi** を選択すると、
OpenClaw は次も確認できます:

- Moonshot API リージョン（`https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`）
- デフォルトの Kimi Web 検索モデル（デフォルトは `kimi-k2.6`）

`x_search` には、`plugins.entries.xai.config.xSearch.*` を設定します。これは
Grok Web 検索と同じ `XAI_API_KEY` フォールバックを使います。
旧 `tools.web.x_search.*` 設定は `openclaw doctor --fix` により自動移行されます。
`openclaw onboard` または `openclaw configure --section web` 中に Grok を選ぶと、
OpenClaw は同じ key を使う任意の `x_search` セットアップも提案できます。
これは Grok 経路内の別個のフォローアップ手順であり、別のトップレベル
web-search provider 選択ではありません。別の provider を選んだ場合、OpenClaw は
`x_search` プロンプトを表示しません。

### API キーの保存

<Tabs>
  <Tab title="Config file">
    `openclaw configure --section web` を実行するか、直接 key を設定します:

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
  <Tab title="Environment variable">
    Gateway プロセス環境に provider の env var を設定します:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    gateway インストールの場合は、`~/.openclaw/.env` に配置します。
    [Env vars](/ja-JP/help/faq#env-vars-and-env-loading) を参照してください。

  </Tab>
</Tabs>

## ツールパラメーター

| Parameter             | 説明                                                      |
| --------------------- | --------------------------------------------------------- |
| `query`               | 検索クエリ（必須）                                        |
| `count`               | 返す結果数（1-10、デフォルト: 5）                         |
| `country`             | 2 文字の ISO 国コード（例: `"US"`, `"DE"`）               |
| `language`            | ISO 639-1 言語コード（例: `"en"`, `"de"`）                |
| `search_lang`         | 検索言語コード（Brave のみ）                              |
| `freshness`           | 時間フィルター: `day`, `week`, `month`, または `year`     |
| `date_after`          | この日付以降の結果（YYYY-MM-DD）                          |
| `date_before`         | この日付以前の結果（YYYY-MM-DD）                          |
| `ui_lang`             | UI 言語コード（Brave のみ）                               |
| `domain_filter`       | ドメイン allowlist/denylist 配列（Perplexity のみ）       |
| `max_tokens`          | 総コンテンツ予算。デフォルト 25000（Perplexity のみ）     |
| `max_tokens_per_page` | ページごとのトークン上限。デフォルト 2048（Perplexity のみ） |

<Warning>
  すべての provider ですべてのパラメーターが使えるわけではありません。Brave の `llm-context` モードは
  `ui_lang`、`freshness`、`date_after`、`date_before` を拒否します。
  Gemini、Grok、および Kimi は、引用付きの 1 つの合成回答を返します。これらは
  共有ツール互換性のために `count` を受け付けますが、grounded な回答の形状は変わりません。
  Perplexity も Sonar/OpenRouter
  互換パス（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` または `OPENROUTER_API_KEY`）を使用する場合は同じ挙動です。
  SearXNG は、信頼できるプライベートネットワークまたは loopback host に対してのみ `http://` を受け付けます。
  公開 SearXNG endpoint では `https://` を使用する必要があります。
  Firecrawl と Tavily が `web_search` 経由でサポートするのは `query` と `count` のみです。
  高度なオプションには、それぞれの専用ツールを使用してください。
</Warning>

## x_search

`x_search` は xAI を使って X（旧 Twitter）の投稿を検索し、
引用付きの AI 合成回答を返します。自然言語クエリと、
任意の構造化フィルターを受け付けます。OpenClaw は、このツール呼び出しを処理するリクエストに対してのみ、
内蔵の xAI `x_search` ツールを有効化します。

<Note>
  xAI は `x_search` が keyword search、semantic search、user
  search、および thread fetch をサポートすると説明しています。repost、
  reply、bookmark、view のような投稿ごとの engagement stats には、正確な投稿 URL
  または status ID を使った対象限定 lookup を優先してください。
  広い keyword search でも適切な投稿が見つかることはありますが、投稿ごとの metadata が十分でないことがあります。
  推奨パターンは、まず投稿を特定し、その後その正確な投稿に絞った 2 回目の `x_search` クエリを実行することです。
</Note>

### x_search の設定

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // XAI_API_KEY が設定されている場合は任意
          },
        },
      },
    },
  },
}
```

### x_search のパラメーター

| Parameter                    | 説明                                                    |
| ---------------------------- | ------------------------------------------------------- |
| `query`                      | 検索クエリ（必須）                                      |
| `allowed_x_handles`          | 結果を特定の X handle に限定する                        |
| `excluded_x_handles`         | 特定の X handle を除外する                              |
| `from_date`                  | この日付以降の投稿のみを含める（YYYY-MM-DD）            |
| `to_date`                    | この日付以前の投稿のみを含める（YYYY-MM-DD）            |
| `enable_image_understanding` | 一致した投稿に添付された画像を xAI が解析できるようにする |
| `enable_video_understanding` | 一致した投稿に添付された動画を xAI が解析できるようにする |

### x_search の例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 投稿ごとの統計: 可能なら正確な status URL または status ID を使用
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 例

```javascript
// 基本検索
await web_search({ query: "OpenClaw plugin SDK" });

// ドイツ向け検索
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// 最近の結果（過去 1 週間）
await web_search({ query: "AI developments", freshness: "week" });

// 日付範囲
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// ドメインフィルタリング（Perplexity のみ）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## ツールプロファイル

ツールプロファイルまたは allowlist を使用する場合は、`web_search`、`x_search`、または `group:web` を追加してください:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // または: allow: ["group:web"]  (web_search、x_search、web_fetch を含む)
  },
}
```

## 関連

- [Web Fetch](/ja-JP/tools/web-fetch) -- URL を取得して読みやすいコンテンツを抽出する
- [Web Browser](/ja-JP/tools/browser) -- JS の多いサイト向けの完全なブラウザー automation
- [Grok Search](/ja-JP/tools/grok-search) -- `web_search` provider としての Grok
- [Ollama Web Search](/ja-JP/tools/ollama-search) -- あなたの Ollama host を通る key 不要の Web 検索
