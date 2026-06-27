---
read_when:
    - API キーなしで Web 検索を使いたい
    - Parallel の有料 Search API が必要です
    - LLM コンテキスト効率のためにランク付けされた高密度の抜粋が必要です
summary: 並列検索 -- Web ソースからの LLM 最適化済み高密度抜粋
title: 並列検索
x-i18n:
    generated_at: "2026-06-27T13:15:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel Plugin は、2 つの [Parallel](https://parallel.ai/) `web_search` プロバイダーを提供します。

- **Parallel Search (Free)** (`parallel-free`) -- Parallel の無料
  [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp)。アカウントや API キーは不要です。Parallel のホスト型
  キー不要検索パスを使いたい場合に明示的に選択します。
- **Parallel Search** (`parallel`) -- Parallel の有料 Search API。`PARALLEL_API_KEY`
  が必要で、より高いレート制限と objective チューニングを提供します。

どちらも、AI エージェント向けに構築された Web インデックスから、ランキング済みで LLM 向けに最適化された抜粋を返します。
どちらかを明示的に選択するには、`tools.web.search.provider` を `parallel-free` または `parallel` に設定します。

<Note>
  OpenAI Responses モデルは、`tools.web.search.provider` が未設定の場合、
  OpenAI のネイティブ Web 検索を使用するため、Parallel プロバイダーをバイパスします。
  Parallel 経由にルーティングするには、`tools.web.search.provider` を
  `parallel-free` または `parallel` に設定します。
</Note>

## Plugin をインストールする

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API キー（有料プロバイダー）

`parallel-free` には API キーは不要ですが、管理対象プロバイダーとして選択する必要があります。
有料の `parallel` プロバイダーには API キーが必要です。

<Steps>
  <Step title="アカウントを作成する">
    [platform.parallel.ai](https://platform.parallel.ai) でサインアップし、
    ダッシュボードから API キーを生成します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境で `PARALLEL_API_KEY` を設定するか、次で構成します。

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 設定

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**環境変数の代替:** Gateway 環境で `PARALLEL_API_KEY` を設定します。
Gateway インストールでは、`~/.openclaw/.env` に配置します。

## ベース URL の上書き

ベース URL の上書きは、有料の `parallel` プロバイダーのみに適用されます。無料の
`parallel-free` プロバイダーは常に `https://search.parallel.ai/mcp` を使用します。

Parallel リクエストを互換プロキシまたは代替の Parallel エンドポイント（たとえば
Cloudflare AI Gateway）経由にする必要がある場合は、
`plugins.entries.parallel.config.webSearch.baseUrl` を設定します。OpenClaw は、
裸のホストの先頭に `https://` を付け、パスがすでにそこで終わっていない限り
`/v1/search` を追加して正規化します。解決済みエンドポイントは検索キャッシュキーに含まれるため、
異なる Parallel エンドポイントからの結果は共有されません。

## ツールパラメーター

OpenClaw は Parallel のネイティブ検索形状を公開するため、モデルは自然言語のゴールと
いくつかの短いキーワードクエリの両方を入力できます。これは最良の結果のために
Parallel が[推奨](https://docs.parallel.ai/search/best-practices)する組み合わせです。

<ParamField path="objective" type="string" required>
基になる質問またはゴールの自然言語による説明（最大 5000 文字）。
自己完結している必要があります。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
簡潔なキーワード検索クエリ。各 3～6 語（1～5 件、各最大 200 文字）。
最良の結果のために、2～3 個の多様なクエリを指定します。
</ParamField>

<ParamField path="count" type="number">
返す結果数（1～40）。
</ParamField>

<ParamField path="session_id" type="string">
任意の Parallel セッション ID（`parallel` では最大 1000 文字、無料の
`parallel-free` Search MCP では 100 文字に制限）。同じタスクの一部であるフォローアップ検索では、
以前の Parallel 結果の `sessionId` を渡すと、Parallel が関連する呼び出しをグループ化し、
後続の結果を改善できます。上限を超える ID は破棄され、新しい ID が生成されます。
</ParamField>

<ParamField path="client_model" type="string">
呼び出しを行うモデルの任意の識別子（例: `claude-opus-4-7`、
`gpt-5.5`）。Parallel がモデルの能力に合わせてデフォルト設定を調整できるようにします。
有効なモデルの正確な slug を渡し、ファミリーのエイリアスに短縮しないでください。
</ParamField>

## 注記

- Parallel は、人間のクリック率ではなく LLM 推論での有用性に基づいて結果をランク付けし圧縮します。
  各結果にはフルページの内容ではなく、密度の高い抜粋が含まれると考えてください
- 結果の抜粋は `excerpts` 配列として返され、汎用 `web_search`
  コントラクトとの互換性のために `description` フィールドにも結合されます
- Parallel はすべてのレスポンスで `session_id` を返します。OpenClaw はツールペイロード内で
  `sessionId` として公開するため、呼び出し元はフォローアップ検索をグループ化できます
- Parallel からの `searchId`、`warnings`、`usage` は、存在する場合にそのまま渡されます
- OpenClaw は、解決済みの結果数を常に `advanced_settings.max_results`
  として Parallel に転送します。呼び出し元の `count` 引数が優先され、次にトップレベルの
  `tools.web.search.maxResults` 設定、それ以外の場合は OpenClaw の汎用
  `web_search` デフォルト（5）が使用されます。これにより、プロバイダーを切り替えても結果数が一貫します。
  Parallel 単独のデフォルトは 10 です
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で構成可能）
- 無料の `parallel-free` プロバイダーは同じパラメーターを受け入れます。`count` はクライアント側で適用され、
  指定されていない場合は呼び出しごとに `session_id` を生成します。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Exa 検索](/ja-JP/tools/exa-search) -- コンテンツ抽出付きニューラル検索
- [Perplexity 検索](/ja-JP/tools/perplexity-search) -- ドメインフィルタリング付きの構造化結果
