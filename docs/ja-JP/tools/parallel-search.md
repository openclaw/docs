---
read_when:
    - APIキーなしでWeb検索を使いたい
    - Parallel の有料 Search API が必要です
    - LLM コンテキスト効率のためにランク付けされた高密度の抜粋が必要です
summary: Parallel Search -- LLM 最適化された Web ソースからの高密度抜粋
title: 並列検索
x-i18n:
    generated_at: "2026-07-05T11:54:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3abb2b64499966ef1d1d8c905f17ae4845f09de62cfb23eeac535ecaeafde3b9
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel Plugin は、AI エージェント向けに構築された Web インデックスから、ランク付け済みで LLM 向けに最適化された抜粋を返す 2 つの [Parallel](https://parallel.ai/) `web_search`
プロバイダーを提供します。

| プロバイダー           | id              | 認証                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel Search (Free) | `parallel-free` | なし -- Parallel の無料 [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` -- 有料 Search API、より高いレート制限と目的チューニング               |

明示的に選択するには、`tools.web.search.provider` を `parallel-free` または `parallel` に設定します。どちらも自動検出されません。

<Note>
  直接 OpenAI Responses models（`api: "openai-responses"`、provider
  `openai`、公式 API ベース URL）は、`tools.web.search.provider` が未設定、空、`"auto"`、
  または `"openai"` の場合、OpenAI のホスト型ネイティブ Web 検索を自動的に使用します。そのため、デフォルトでは Parallel をバイパスします。代わりに Parallel 経由でルーティングするには、
  `tools.web.search.provider` を `parallel-free` または `parallel` に設定します。[Web Search の概要](/ja-JP/tools/web)を参照してください。
</Note>

## Plugin をインストール

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API キー（有料プロバイダー）

`parallel-free` にキーは不要ですが、それでも明示的に選択する必要があります。有料の
`parallel` プロバイダーには API キーが必要です。

<Steps>
  <Step title="アカウントを作成">
    [platform.parallel.ai](https://platform.parallel.ai) でサインアップし、ダッシュボードから API キーを生成します。
  </Step>
  <Step title="キーを保存">
    Gateway 環境に `PARALLEL_API_KEY` を設定するか、次で構成します。

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
        // "parallel-free" for the free Search MCP, or "parallel" for the
        // paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**環境での代替:** Gateway 環境に `PARALLEL_API_KEY` を設定します。gateway インストールでは、`~/.openclaw/.env` に配置します。

## ベース URL の上書き

有料の `parallel` プロバイダーにのみ適用されます。`parallel-free` は常に
`https://search.parallel.ai/mcp` を使用し、この設定を無視します。

互換プロキシや代替エンドポイント（たとえば Cloudflare AI Gateway）経由で有料リクエストをルーティングするには、`plugins.entries.parallel.config.webSearch.baseUrl` を設定します。OpenClaw は、裸のホストには
`https://` を先頭に付け、パスがすでにそこで終わっていない限り `/v1/search` を追加して正規化します。解決済みエンドポイントは検索キャッシュキーの一部になるため、異なるエンドポイントからの結果が共有されることはありません。

## ツールパラメーター

どちらのプロバイダーも Parallel のネイティブ検索形状を公開するため、モデルは自然言語の目標といくつかの短いキーワードクエリを入力します。これは最良の結果を得るために Parallel が[推奨](https://docs.parallel.ai/search/best-practices)する組み合わせです。

<ParamField path="objective" type="string" required>
基礎となる質問または目標の自然言語による説明（最大 5000 文字）。自己完結している必要があります。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
簡潔なキーワード検索クエリ。各 3〜6 語（1〜5 件、各最大 200 文字）。最良の結果を得るには、多様なクエリを 2〜3 件指定します。
</ParamField>

<ParamField path="count" type="number">
返す結果数（1〜40）。
</ParamField>

<ParamField path="session_id" type="string">
以前の結果の `sessionId` から取得した任意の Parallel セッション ID。同じタスク内の後続検索で渡すと、Parallel が関連する呼び出しをグループ化し、後続結果を改善できます。`parallel` では最大 1000 文字、無料の
`parallel-free` Search MCP では 100 文字に制限されます。制限を超える ID は破棄される（有料）か、新しいものが発行されます（無料）。
</ParamField>

<ParamField path="client_model" type="string">
呼び出しを行うモデルの任意の識別子（例: `claude-opus-4-7`、
`gpt-5.5`）、最大 100 文字。Parallel がモデルの能力に合わせてデフォルト設定を調整できるようにします。正確なアクティブモデル slug を渡し、ファミリー別名に短縮しないでください。
</ParamField>

## 注記

- Parallel は、人間のクリック率ではなく LLM 推論での有用性に合わせて結果をランク付けし圧縮します。結果ごとにフルページの内容ではなく、密度の高い抜粋が返ることを想定してください。
- 結果の抜粋は `excerpts` 配列として返り、汎用 `web_search` コントラクトとの互換性のために `description` にも結合されます。
- どちらのプロバイダーも `session_id` を返します。OpenClaw はそれをツールペイロード内で `sessionId` として公開するため、呼び出し元は後続検索をグループ化できます。Parallel が生成したセッション ID（呼び出し元が指定していないもの）は、同一クエリを持つ無関係なタスクがそれを継承しないよう、キャッシュエントリから除外されます。
- Parallel からの `searchId`、`warnings`、`usage` は、存在する場合にそのまま渡されます。
- OpenClaw は、解決済みの結果数を常に `advanced_settings.max_results`（`parallel`）として Parallel に転送するか、Parallel の固定サイズレスポンス後にクライアント側で `count` を適用します（`parallel-free`）。呼び出し元の `count` 引数が優先され、次に `tools.web.search.maxResults`、それ以外の場合は OpenClaw の汎用 `web_search` デフォルト（5）が使われます。Parallel 自身の API デフォルトは 10 です。
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes`）。
- 呼び出し元が指定しない場合、`parallel-free` は MCP ハンドシェイクを介して呼び出しごとに新しい `session_id` を発行します。`parallel` はその場合、未設定のままにします。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Exa 検索](/ja-JP/tools/exa-search) -- コンテンツ抽出を備えたニューラル検索
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタリングを備えた構造化結果
