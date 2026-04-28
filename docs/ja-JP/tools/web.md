---
read_when:
    - '`web_search` を有効化または設定したい場合'
    - '`x_search` を有効化または設定したい場合'
    - 検索 provider を選ぶ必要がある場合
    - 自動検出と provider fallback を理解したい場合
sidebarTitle: Web Search
summary: '`web_search`、`x_search`、および `web_fetch` -- Web を検索する、X の投稿を検索する、またはページ内容を取得する'
title: Web 検索
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T05:27:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2713e8b13cf0f3c6bba38bee50c24771b914a5cd235ca521bed434a6ddbe2305
    source_path: tools/web.md
    workflow: 15
---

`web_search` ツールは、設定された provider を使って Web を検索し、
結果を返します。結果はクエリごとに 15 分間キャッシュされます（設定可能）。

OpenClaw には、X（旧 Twitter）の投稿向け `x_search` と、
軽量 URL 取得向け `web_fetch` も含まれています。この段階では、`web_fetch` はローカルのままですが、
`web_search` と `x_search` は内部で xAI Responses を使うことがあります。

<Info>
  `web_search` は軽量な HTTP ツールであり、ブラウザ自動化ではありません。
  JS を多用するサイトやログインが必要な場合は、[Web Browser](/ja-JP/tools/browser) を使ってください。特定の URL を取得するには、[Web Fetch](/ja-JP/tools/web-fetch) を使ってください。
</Info>

## クイックスタート

<Steps>
  <Step title="provider を選ぶ">
    provider を選び、必要なセットアップを完了します。一部の provider は
    キー不要で、他は API キーを使います。詳細は以下の provider ページを参照してください。
  </Step>
  <Step title="設定する">
    ```bash
    openclaw configure --section web
    ```
    これにより provider と必要な認証情報が保存されます。API ベースの
    provider では、env var（たとえば `BRAVE_API_KEY`）を設定してこの手順を省略することもできます。
  </Step>
  <Step title="使う">
    これで agent は `web_search` を呼び出せます:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X 投稿には次を使います:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## provider を選ぶ

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ja-JP/tools/brave-search">
    スニペット付きの構造化結果。`llm-context` モード、国 / 言語フィルタをサポート。無料 tier あり。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ja-JP/tools/duckduckgo-search">
    キー不要の fallback。API キー不要。非公式の HTML ベース統合。
  </Card>
  <Card title="Exa" icon="brain" href="/ja-JP/tools/exa-search">
    コンテンツ抽出（highlight、text、summary）付きの neural + keyword search。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ja-JP/tools/firecrawl">
    構造化結果。深い抽出には `firecrawl_search` と `firecrawl_scrape` の併用が最適。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ja-JP/tools/gemini-search">
    Google Search grounding 経由の、引用付き AI 合成回答。
  </Card>
  <Card title="Grok" icon="zap" href="/ja-JP/tools/grok-search">
    xAI web grounding 経由の、引用付き AI 合成回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/ja-JP/tools/kimi-search">
    Moonshot web search 経由の、引用付き AI 合成回答。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ja-JP/tools/minimax-search">
    MiniMax Coding Plan search API 経由の構造化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ja-JP/tools/ollama-search">
    設定済み Ollama host 経由のキー不要検索。`ollama signin` が必要です。
  </Card>
  <Card title="Perplexity" icon="search" href="/ja-JP/tools/perplexity-search">
    コンテンツ抽出制御とドメインフィルタ付きの構造化結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/ja-JP/tools/searxng-search">
    セルフホストのメタ検索。API キー不要。Google、Bing、DuckDuckGo などを集約します。
  </Card>
  <Card title="Tavily" icon="globe" href="/ja-JP/tools/tavily">
    search depth、topic filtering、URL 抽出用 `tavily_extract` を備えた構造化結果。
  </Card>
</CardGroup>

### provider 比較

| Provider                                  | 結果スタイル               | フィルタ                                         | API キー                                                                          |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [Brave](/ja-JP/tools/brave-search)              | 構造化スニペット           | 国、言語、時間、`llm-context` モード             | `BRAVE_API_KEY`                                                                    |
| [DuckDuckGo](/ja-JP/tools/duckduckgo-search)    | 構造化スニペット           | --                                               | なし（キー不要）                                                                   |
| [Exa](/ja-JP/tools/exa-search)                  | 構造化 + 抽出結果          | Neural / keyword モード、日付、コンテンツ抽出    | `EXA_API_KEY`                                                                      |
| [Firecrawl](/ja-JP/tools/firecrawl)             | 構造化スニペット           | `firecrawl_search` ツール経由                    | `FIRECRAWL_API_KEY`                                                                |
| [Gemini](/ja-JP/tools/gemini-search)            | AI 合成 + 引用             | --                                               | `GEMINI_API_KEY`                                                                   |
| [Grok](/ja-JP/tools/grok-search)                | AI 合成 + 引用             | --                                               | `XAI_API_KEY`                                                                      |
| [Kimi](/ja-JP/tools/kimi-search)                | AI 合成 + 引用             | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                |
| [MiniMax Search](/ja-JP/tools/minimax-search)   | 構造化スニペット           | リージョン（`global` / `cn`）                    | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                 |
| [Ollama Web Search](/ja-JP/tools/ollama-search) | 構造化スニペット           | --                                               | デフォルトでは不要。`ollama signin` が必要で、必要なら Ollama provider の bearer auth を再利用可能 |
| [Perplexity](/ja-JP/tools/perplexity-search)    | 構造化スニペット           | 国、言語、時間、domains、コンテンツ上限          | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                        |
| [SearXNG](/ja-JP/tools/searxng-search)          | 構造化スニペット           | Categories、言語                                 | なし（セルフホスト）                                                               |
| [Tavily](/ja-JP/tools/tavily)                   | 構造化スニペット           | `tavily_search` ツール経由                       | `TAVILY_API_KEY`                                                                   |

## 自動検出

## Native OpenAI web search

直接の OpenAI Responses model は、OpenClaw web search が有効で managed provider が固定されていない場合、自動的に OpenAI のホスト型 `web_search` ツールを使います。これはバンドル済み OpenAI Plugin に属する provider 所有の動作であり、native OpenAI API トラフィックにのみ適用されます。OpenAI 互換の proxy base URL や Azure route には適用されません。OpenAI model でも managed `web_search` ツールを使い続けたい場合は、`tools.web.search.provider` を `brave` のような別 provider に設定してください。managed search と native OpenAI search の両方を無効にするには、`tools.web.search.enabled: false` を設定します。

## Native Codex web search

Codex 対応 model は、OpenClaw の managed `web_search` function の代わりに、provider native の Responses `web_search` ツールを任意で使えます。

- `tools.web.search.openaiCodex` 配下で設定します
- 有効になるのは Codex 対応 model（`openai-codex/*` または `api: "openai-codex-responses"` を使う provider）のみです
- managed `web_search` は引き続き非 Codex model に適用されます
- `mode: "cached"` がデフォルトかつ推奨設定です
- `tools.web.search.enabled: false` は managed search と native search の両方を無効にします

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

native Codex search が有効でも、現在の model が Codex 対応でない場合、OpenClaw は通常の managed `web_search` 動作を維持します。

## web search を設定する

ドキュメントとセットアップフロー内の provider 一覧はアルファベット順です。自動検出は
別の優先順位を使います。

`provider` が設定されていない場合、OpenClaw は次の順序で provider を確認し、準備できている最初のものを使います:

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

その後にキー不要の fallback:

10. **DuckDuckGo** -- アカウントや API キー不要の、キー不要 HTML fallback（順序 100）
11. **Ollama Web Search** -- 設定済み Ollama host 経由のキー不要 fallback。Ollama に到達可能で、`ollama signin` によりサインイン済みである必要があり、必要なら Ollama provider の bearer auth を再利用できます（順序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

どの provider も検出されない場合は、Brave に fallback します（不足キー
エラーが出て設定を促されます）。

<Note>
  すべての provider キーフィールドは SecretRef object をサポートします。`plugins.entries.<plugin>.config.webSearch.apiKey` 配下の Plugin スコープ SecretRef は、bundled Exa、Firecrawl、Gemini、Grok、Kimi、Perplexity、Tavily provider で、provider が `tools.web.search.provider` により明示選択された場合でも、自動検出で選ばれた場合でも解決されます。自動検出モードでは、OpenClaw は選択された provider キーだけを解決します。非選択の SecretRef は非アクティブのままなので、使っていない provider の解決コストを払わずに複数 provider を設定しておけます。
</Note>

## 設定

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // デフォルト: true
        provider: "brave", // または自動検出のため省略
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

provider 固有の設定（API キー、base URL、mode）は
`plugins.entries.<plugin>.config.webSearch.*` 配下にあります。例は各 provider ページを参照してください。

`web_fetch` fallback provider の選択は別です:

- `tools.web.fetch.provider` で選ぶ
- またはそのフィールドを省略し、利用可能な認証情報から最初に準備できている web-fetch
  provider を OpenClaw に自動検出させる
- 現在の bundled web-fetch provider は Firecrawl で、
  `plugins.entries.firecrawl.config.webFetch.*` 配下で設定します

`openclaw onboard` または
`openclaw configure --section web` 中に **Kimi** を選ぶと、OpenClaw は次も確認できます:

- Moonshot API リージョン（`https://api.moonshot.ai/v1` または `https://api.moonshot.cn/v1`）
- デフォルトの Kimi web-search model（デフォルトは `kimi-k2.6`）

`x_search` は `plugins.entries.xai.config.xSearch.*` で設定します。これは
Grok web search と同じ `XAI_API_KEY` fallback を使います。
旧来の `tools.web.x_search.*` config は `openclaw doctor --fix` によって自動移行されます。
`openclaw onboard` または `openclaw configure --section web` 中に Grok を選ぶと、
OpenClaw は同じキーを使う任意の `x_search` セットアップも提示できます。
これは Grok パス内の別個の後続ステップであり、独立したトップレベルの
web-search provider 選択ではありません。別の provider を選んだ場合、OpenClaw は
`x_search` プロンプトを表示しません。

### API キーの保存

<Tabs>
  <Tab title="Config file">
    `openclaw configure --section web` を実行するか、キーを直接設定します:

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
    Gateway process 環境で provider の env var を設定します:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    gateway インストールでは、これを `~/.openclaw/.env` に置いてください。
    [Env vars](/ja-JP/help/faq#env-vars-and-env-loading) を参照してください。

  </Tab>
</Tabs>

## ツールパラメータ

| パラメータ            | 説明                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | 検索クエリ（必須）                                    |
| `count`               | 返す結果数（1-10、デフォルト: 5）                     |
| `country`             | 2 文字の ISO 国コード（例: "US", "DE"）               |
| `language`            | ISO 639-1 言語コード（例: "en", "de"）                |
| `search_lang`         | 検索言語コード（Brave のみ）                          |
| `freshness`           | 時間フィルタ: `day`、`week`、`month`、`year`          |
| `date_after`          | この日付以降の結果（YYYY-MM-DD）                      |
| `date_before`         | この日付以前の結果（YYYY-MM-DD）                      |
| `ui_lang`             | UI 言語コード（Brave のみ）                           |
| `domain_filter`       | ドメイン allowlist / denylist 配列（Perplexity のみ） |
| `max_tokens`          | 合計コンテンツ予算、デフォルト 25000（Perplexity のみ） |
| `max_tokens_per_page` | ページごとの token 上限、デフォルト 2048（Perplexity のみ） |

<Warning>
  すべてのパラメータがすべての provider で動作するわけではありません。Brave の `llm-context` モードは
  `ui_lang`、`freshness`、`date_after`、`date_before` を拒否します。
  Gemini、Grok、Kimi は、引用付きの 1 つの合成回答を返します。これらは
  共有ツール互換性のために `count` を受け付けますが、grounded answer の形状は変わりません。
  Perplexity も、Sonar / OpenRouter
  互換パス（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` または `OPENROUTER_API_KEY`）を使う場合は同様です。
  SearXNG は、信頼されたプライベートネットワークまたは local loopback host に対してのみ `http://` を受け付けます。
  公開 SearXNG endpoint は `https://` を使う必要があります。
  Firecrawl と Tavily は `web_search` 経由では `query` と `count` しかサポートしません
  -- 高度なオプションには専用ツールを使ってください。
</Warning>

## x_search

`x_search` は xAI を使って X（旧 Twitter）の投稿を検索し、
引用付きの AI 合成回答を返します。自然言語クエリと、
任意の構造化フィルタを受け付けます。OpenClaw は、このツール呼び出しに対応するリクエストでのみ、
組み込み xAI `x_search` ツールを有効にします。

<Note>
  xAI のドキュメントでは、`x_search` はキーワード検索、セマンティック検索、ユーザー
  検索、スレッド取得をサポートするとされています。repost、reply、bookmark、view のような投稿ごとの engagement 統計には、正確な投稿 URL
  または status ID へのターゲット lookup を優先してください。広いキーワード検索でも正しい投稿が見つかることはありますが、投稿ごとの metadata は不完全になりがちです。良いパターンは、まず投稿を見つけ、その後その正確な投稿に絞った 2 回目の `x_search` クエリを実行することです。
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

### x_search パラメータ

| パラメータ                   | 説明                                                   |
| --------------------------- | ------------------------------------------------------ |
| `query`                     | 検索クエリ（必須）                                     |
| `allowed_x_handles`         | 結果を特定の X handle に制限する                       |
| `excluded_x_handles`        | 特定の X handle を除外する                             |
| `from_date`                 | この日付以降の投稿のみ含める（YYYY-MM-DD）             |
| `to_date`                   | この日付以前の投稿のみ含める（YYYY-MM-DD）             |
| `enable_image_understanding` | xAI が一致した投稿に添付された画像を調べられるようにする |
| `enable_video_understanding` | xAI が一致した投稿に添付された動画を調べられるようにする |

### x_search 例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 投稿ごとの統計: 可能なら正確な status URL または status ID を使う
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

// ドメインフィルタ（Perplexity のみ）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## ツールプロファイル

ツールプロファイルまたは allowlist を使っている場合は、`web_search`、`x_search`、または `group:web` を追加してください:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // または: allow: ["group:web"]  （web_search、x_search、web_fetch を含む）
  },
}
```

## 関連

- [Web Fetch](/ja-JP/tools/web-fetch) -- URL を取得して読みやすいコンテンツを抽出する
- [Web Browser](/ja-JP/tools/browser) -- JS を多用するサイト向けの完全なブラウザ自動化
- [Grok Search](/ja-JP/tools/grok-search) -- `web_search` provider としての Grok
- [Ollama Web Search](/ja-JP/tools/ollama-search) -- Ollama host 経由のキー不要 web search
