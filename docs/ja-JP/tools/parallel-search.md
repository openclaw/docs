---
read_when:
    - APIキーなしでウェブ検索を利用したい場合
    - Parallel の有料 Search API を利用する場合
    - LLMのコンテキスト効率を重視して順位付けされた高密度な抜粋が必要です
summary: 並列検索 -- Web ソースからの LLM 向けに最適化された高密度な抜粋
title: 並列検索
x-i18n:
    generated_at: "2026-07-11T22:47:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel Plugin は、2 つの [Parallel](https://parallel.ai/) `web_search`
プロバイダーを提供します。どちらも、AI エージェント向けに構築されたウェブインデックスから、
順位付けされ、LLM 向けに最適化された抜粋を返します。

| プロバイダー           | id              | 認証                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel Search（無料） | `parallel-free` | なし -- Parallel の無料 [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` -- 有料 Search API、より高いレート制限と目的の調整                      |

明示的に選択するには、`tools.web.search.provider` を `parallel-free` または
`parallel` に設定します。どちらも自動検出されません。

<Note>
  OpenAI Responses モデルを直接使用する場合（`api: "openai-responses"`、プロバイダー
  `openai`、公式 API ベース URL）、`tools.web.search.provider` が未設定、空、`"auto"`、
  または `"openai"` のときは、OpenAI がホストするネイティブウェブ検索が
  自動的に使用されるため、デフォルトでは Parallel を経由しません。代わりに
  Parallel 経由でルーティングするには、`tools.web.search.provider` を
  `parallel-free` または `parallel` に設定します。[ウェブ検索の概要](/ja-JP/tools/web)
  を参照してください。
</Note>

## Plugin のインストール

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API キー（有料プロバイダー）

`parallel-free` にはキーは不要ですが、明示的に選択する必要があります。有料の
`parallel` プロバイダーには API キーが必要です。

<Steps>
  <Step title="アカウントを作成">
    [platform.parallel.ai](https://platform.parallel.ai) で登録し、
    ダッシュボードから API キーを生成します。
  </Step>
  <Step title="キーを保存">
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
            baseUrl: "https://api.parallel.ai", // 省略可能。OpenClaw が /v1/search を追加
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // 無料の Search MCP には "parallel-free"、ここで示す
        // 有料 API ベースのプロバイダーには "parallel"。
        provider: "parallel",
      },
    },
  },
}
```

**環境変数による代替方法：** Gateway 環境に `PARALLEL_API_KEY` を設定します。
Gateway をインストールしている場合は、`~/.openclaw/.env` に記述します。

## ベース URL の上書き

有料の `parallel` プロバイダーにのみ適用されます。`parallel-free` は常に
`https://search.parallel.ai/mcp` を使用し、この設定を無視します。

互換プロキシまたは代替エンドポイント（Cloudflare AI Gateway など）を介して
有料リクエストをルーティングするには、`plugins.entries.parallel.config.webSearch.baseUrl`
を設定します。OpenClaw は、スキームのないホストの先頭に `https://` を付けて正規化し、
パスがすでに `/v1/search` で終わっていない限り、これを追加します。
解決されたエンドポイントは検索キャッシュキーの一部となるため、異なる
エンドポイントからの結果が共有されることはありません。

## ツールパラメーター

どちらのプロバイダーも Parallel ネイティブの検索形式を公開します。これにより、
モデルは自然言語の目的と、短いキーワードクエリをいくつか入力します。この組み合わせは、
最良の結果を得るために Parallel が[推奨](https://docs.parallel.ai/search/best-practices)
しているものです。

<ParamField path="objective" type="string" required>
根底にある質問または目的の自然言語による説明（最大 5000 文字）。
それ単独で内容が理解できるようにする必要があります。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
簡潔なキーワード検索クエリ。各 3～6 語（1～5 件、各最大 200 文字）。
最良の結果を得るには、異なる観点のクエリを 2～3 件指定します。
</ParamField>

<ParamField path="count" type="number">
返す結果数（1～40）。
</ParamField>

<ParamField path="session_id" type="string">
以前の結果の `sessionId` から取得した、任意指定の Parallel セッション ID。
同じタスク内の後続検索に渡すと、Parallel が関連する呼び出しをグループ化し、
以降の結果を改善できます。`parallel` では最大 1000 文字、無料の
`parallel-free` Search MCP では最大 100 文字です。上限を超える ID は、
有料版では破棄され、無料版では新しい ID が発行されます。
</ParamField>

<ParamField path="client_model" type="string">
呼び出し元モデルの任意指定の識別子（例：`claude-opus-4-7`、
`gpt-5.6-sol`）。最大 100 文字です。Parallel がモデルの能力に合わせて
デフォルト設定を調整できるようにします。有効なモデルの正確なスラッグを渡し、
ファミリーのエイリアスに短縮しないでください。
</ParamField>

## 注記

- Parallel は、人間によるリンク先の閲覧ではなく、LLM の推論に役立つことを目的として
  結果を順位付けし圧縮します。ページ全体の内容ではなく、結果ごとに情報量の多い抜粋が
  返されます。
- 結果の抜粋は `excerpts` 配列として返され、汎用 `web_search` 契約との互換性のために
  結合されて `description` にも格納されます。
- どちらのプロバイダーも `session_id` を返します。OpenClaw はツールペイロードで
  これを `sessionId` として公開し、呼び出し元が後続検索をグループ化できるようにします。
  Parallel が生成したセッション ID（呼び出し元が指定していないもの）は、
  同一クエリを使用する無関係なタスクに引き継がれないよう、キャッシュエントリから除外されます。
- Parallel の `searchId`、`warnings`、`usage` は、存在する場合にそのまま渡されます。
- OpenClaw は、解決された結果数を常に `advanced_settings.max_results`（`parallel`）として
  Parallel に転送するか、Parallel の固定件数レスポンスを受け取った後にクライアント側で
  `count` を適用します（`parallel-free`）。呼び出し元の `count` 引数が最優先され、
  次に `tools.web.search.maxResults`、それ以外の場合は OpenClaw の汎用 `web_search`
  デフォルト値（5）が使用されます。Parallel 自体の API のデフォルト値は 10 です。
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes`）。
- 呼び出し元が `session_id` を指定しない場合、`parallel-free` は MCP ハンドシェイクを通じて
  呼び出しごとに新しい `session_id` を発行します。`parallel` はその場合、未設定のままにします。

## 関連項目

- [ウェブ検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Exa 検索](/ja-JP/tools/exa-search) -- コンテンツ抽出を備えたニューラル検索
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタリングを備えた構造化結果
