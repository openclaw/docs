---
read_when:
    - API キーなしでウェブ検索を利用したい場合
    - Parallel の有料 Search API を利用したい場合
    - LLMのコンテキスト効率を高めるために順位付けされた、情報密度の高い抜粋が必要な場合
summary: 並列検索 -- Web ソースからの LLM 向けに最適化された高密度な抜粋
title: 並列検索
x-i18n:
    generated_at: "2026-07-12T14:56:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel Plugin は、2 つの [Parallel](https://parallel.ai/) `web_search`
プロバイダーを提供します。どちらも、AI エージェント向けに構築された Web インデックスから、
ランキング済みで LLM 向けに最適化された抜粋を返します。

| プロバイダー               | id              | 認証                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel Search（無料） | `parallel-free` | なし -- Parallel の無料 [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` -- 有料の Search API、より高いレート制限と目的別チューニング             |

明示的に選択するには、`tools.web.search.provider` を `parallel-free` または
`parallel` に設定します。どちらも自動検出されません。

<Note>
  OpenAI Responses の直接モデル（`api: "openai-responses"`、プロバイダー
  `openai`、公式 API ベース URL）は、`tools.web.search.provider` が未設定、空、
  `"auto"`、または `"openai"` の場合、OpenAI がホストするネイティブ Web 検索を
  自動的に使用するため、デフォルトでは Parallel を経由しません。代わりに Parallel
  経由でルーティングするには、`tools.web.search.provider` を `parallel-free` または
  `parallel` に設定します。[Web 検索の概要](/ja-JP/tools/web)を参照してください。
</Note>

## Plugin をインストールする

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API キー（有料プロバイダー）

`parallel-free` にはキーは不要ですが、明示的に選択する必要があります。有料の
`parallel` プロバイダーには API キーが必要です。

<Steps>
  <Step title="アカウントを作成する">
    [platform.parallel.ai](https://platform.parallel.ai) でサインアップし、
    ダッシュボードから API キーを生成します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境に `PARALLEL_API_KEY` を設定するか、次のコマンドで構成します。

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
            apiKey: "par-...", // PARALLEL_API_KEY が設定されている場合は省略可能
            baseUrl: "https://api.parallel.ai", // 省略可能。OpenClaw は /v1/search を末尾に追加
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // 無料の Search MCP には "parallel-free"、ここに示す有料の
        // API ベースのプロバイダーには "parallel" を使用します。
        provider: "parallel",
      },
    },
  },
}
```

**環境変数を使用する方法:** Gateway 環境に `PARALLEL_API_KEY` を設定します。
Gateway をインストールしている場合は、`~/.openclaw/.env` に記述します。

## ベース URL の上書き

有料の `parallel` プロバイダーにのみ適用されます。`parallel-free` は常に
`https://search.parallel.ai/mcp` を使用し、この設定を無視します。

有料リクエストを互換プロキシまたは代替エンドポイント（たとえば
Cloudflare AI Gateway）経由でルーティングするには、`plugins.entries.parallel.config.webSearch.baseUrl`
を設定します。OpenClaw は、ホスト名だけが指定された場合は先頭に
`https://` を付加して正規化し、パスの末尾がすでに `/v1/search` でない限り、
これを追加します。解決されたエンドポイントは検索キャッシュキーの一部になるため、
異なるエンドポイントからの結果が共有されることはありません。

## ツールパラメーター

どちらのプロバイダーも Parallel のネイティブ検索形式を公開しているため、モデルは自然言語による目標と、いくつかの短いキーワードクエリを入力します。これは、最良の結果を得るために Parallel が[推奨している](https://docs.parallel.ai/search/best-practices)組み合わせです。

<ParamField path="objective" type="string" required>
基となる質問または目標の自然言語による説明（最大 5000 文字）。
それ自体で完結している必要があります。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
簡潔なキーワード検索クエリ。各クエリは 3～6 語（1～5 件、各最大 200 文字）。
最良の結果を得るには、多様なクエリを 2～3 件指定してください。
</ParamField>

<ParamField path="count" type="number">
返す結果の数（1～40）。
</ParamField>

<ParamField path="session_id" type="string">
以前の結果の `sessionId` から取得した、オプションの Parallel セッション ID。同じタスク内の後続検索でこれを渡すと、Parallel が関連する呼び出しをグループ化し、以降の結果を改善します。最大文字数は `parallel` では 1000 文字、無料の `parallel-free` Search MCP では 100 文字に制限されます。上限を超える ID は破棄される（有料）か、新しい ID が生成されます（無料）。
</ParamField>

<ParamField path="client_model" type="string">
呼び出しを行うモデルのオプション識別子（例: `claude-opus-4-7`、`gpt-5.6-sol`）。最大 100 文字。Parallel がモデルの能力に合わせてデフォルト設定を調整できるようにします。現在アクティブなモデルの正確なスラッグを渡してください。ファミリーのエイリアスに短縮しないでください。
</ParamField>

## 注記

- Parallel は、人間がクリックして閲覧するためではなく、LLM の推論における有用性を重視して結果を順位付けし、圧縮します。ページ全体の
  コンテンツではなく、結果ごとに情報密度の高い抜粋が返されます。
- 結果の抜粋は `excerpts` 配列として返され、汎用 `web_search` コントラクトとの互換性のため、
  `description` に結合された形でも格納されます。
- 両プロバイダーは `session_id` を返します。OpenClaw は呼び出し元が後続の検索をグループ化できるように、
  ツールペイロード内でこれを `sessionId` として公開します。呼び出し元が指定していない、
  Parallel によって生成されたセッション ID は、同一クエリを使用する無関係なタスクに
  引き継がれないよう、キャッシュエントリから除外されます。
- Parallel からの `searchId`、`warnings`、`usage` は、存在する場合、
  そのまま渡されます。
- OpenClaw は、解決済みの結果件数を常に `advanced_settings.max_results`（`parallel`）として
  Parallel に転送するか、Parallel の固定件数レスポンス（`parallel-free`）を受け取った後、
  クライアント側で `count` を適用します。呼び出し元の `count` 引数が最優先され、
  次に `tools.web.search.maxResults`、それ以外の場合は OpenClaw の汎用 `web_search` のデフォルト値（5）が
  使用されます。Parallel 自体の API のデフォルト値は 10 です。
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes`）。
- 呼び出し元が指定しない場合、`parallel-free` は MCP ハンドシェイクを介して呼び出しごとに
  新しい `session_id` を生成します。一方、`parallel` はその場合、
  未設定のままにします。

## 関連項目

- [Web 検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Exa 検索](/ja-JP/tools/exa-search) -- コンテンツ抽出を備えたニューラル検索
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタリングを備えた構造化された結果
