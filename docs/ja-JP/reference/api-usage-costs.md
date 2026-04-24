---
read_when:
    - どの機能が有料 API を呼び出す可能性があるかを理解したい場合
    - キー、コスト、使用量の可視性を監査する必要があります
    - '`/status` または `/usage` のコストレポートを説明しています'
summary: 何が費用を発生させるか、どのキーが使われるか、使用量をどう確認するかを監査する
title: API 使用量とコスト
x-i18n:
    generated_at: "2026-04-24T05:18:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API 使用量とコスト

このドキュメントでは、**API キーを呼び出し得る機能**と、そのコストがどこに表示されるかを一覧にします。ここでは、
provider 使用量や有料 API 呼び出しを発生させ得る OpenClaw 機能に焦点を当てます。

## コストの表示場所（chat + CLI）

**セッションごとのコストスナップショット**

- `/status` は、現在のセッションモデル、コンテキスト使用量、最後の応答トークン数を表示します。
- モデルが **API キー認証** を使っている場合、`/status` は最後の返信の **推定コスト** も表示します。
- live セッションメタデータが疎な場合、`/status` は最新のトランスクリプト使用量
  エントリーから token/cache カウンターとアクティブなランタイム model label を復元できます。既存の非ゼロ live 値は引き続き優先され、保存済み合計が欠けているか小さい場合は、prompt サイズのトランスクリプト合計が優先されることがあります。

**メッセージごとのコストフッター**

- `/usage full` は、**推定コスト**（API キーのみ）を含む usage フッターを各返信に追加します。
- `/usage tokens` はトークンのみを表示します。サブスクリプション形式の OAuth/token および CLI フローではドルコストを隠します。
- Gemini CLI 注記: CLI が JSON 出力を返す場合、OpenClaw は
  `stats` から使用量を読み取り、`stats.cached` を `cacheRead` に正規化し、必要に応じて
  `stats.input_tokens - stats.cached` から入力トークンを導出します。

Anthropic 注記: Anthropic のスタッフから、OpenClaw 形式の Claude CLI 使用は
再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、
OpenClaw はこの統合において Claude CLI の再利用と `claude -p` の使用を
許可されたものとして扱います。Anthropic は依然として、OpenClaw が
`/usage full` に表示できるメッセージ単位のドル推定値を公開していません。

**CLI 使用期間ウィンドウ（provider クォータ）**

- `openclaw status --usage` と `openclaw channels list` は provider の **使用期間ウィンドウ**
  を表示します（メッセージ単位コストではなく、クォータスナップショット）。
- 人間向け出力は、provider 間で `X% left` に正規化されます。
- 現在の使用期間ウィンドウ対応 provider: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, z.ai。
- MiniMax 注記: その生の `usage_percent` / `usagePercent` フィールドは残り
  クォータを意味するため、OpenClaw は表示前にそれを反転します。count ベースのフィールドがある場合はそちらが引き続き優先されます。provider が `model_remains` を返す場合、OpenClaw は
  chat-model エントリーを優先し、必要に応じてタイムスタンプから window label を導出し、
  plan label に model 名を含めます。
- それらのクォータウィンドウ向けの使用量 auth は、利用可能な場合は provider 固有フックから取得されます。
  それ以外の場合、OpenClaw は auth profiles, env, または config にある対応する OAuth/API-key
  認証情報にフォールバックします。

詳細と例については [Token use & costs](/ja-JP/reference/token-use) を参照してください。

## キーの検出方法

OpenClaw は、次の場所から認証情報を取得できます。

- **auth profiles**（agent ごと。`auth-profiles.json` に保存）
- **環境変数**（例: `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`）
- **config**（`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`）
- **Skills**（`skills.entries.<name>.apiKey`）は、skill process env にキーを export できます

## キーを消費し得る機能

### 1) core モデル応答（chat + tools）

すべての返信やツール呼び出しは **現在の model provider**（OpenAI, Anthropic など）を使用します。これは
使用量とコストの主な発生源です。

これには、OpenClaw のローカル UI 外で課金されるサブスクリプション形式の hosted provider も含まれます。
たとえば **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**、および
**Extra Usage** が有効な Anthropic の OpenClaw Claude-login 経路です。

価格設定 config については [Models](/ja-JP/providers/models) を、表示については [Token use & costs](/ja-JP/reference/token-use) を参照してください。

### 2) メディア理解（音声/画像/動画）

受信メディアは、返信実行前に要約/転写されることがあります。これは model/provider API を使用します。

- Audio: OpenAI / Groq / Deepgram / Google / Mistral
- Image: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI
- Video: Google / Qwen / Moonshot

[Media understanding](/ja-JP/nodes/media-understanding) を参照してください。

### 3) 画像生成と動画生成

共有生成機能も provider キーを消費することがあります。

- 画像生成: OpenAI / Google / fal / MiniMax
- 動画生成: Qwen

`agents.defaults.imageGenerationModel` が unset の場合、画像生成は auth-backed な provider デフォルトを推論できます。動画生成は現在、`qwen/wan2.6-t2v` のような明示的な `agents.defaults.videoGenerationModel` を必要とします。

[Image generation](/ja-JP/tools/image-generation), [Qwen Cloud](/ja-JP/providers/qwen),
および [Models](/ja-JP/concepts/models) を参照してください。

### 4) memory embeddings + semantic search

semantic memory search は、リモート provider 用に設定されている場合、**embedding API** を使用します。

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings（ローカル/セルフホスト）
- `memorySearch.provider = "ollama"` → Ollama embeddings（ローカル/セルフホスト。通常 hosted API 課金なし）
- ローカル embeddings 失敗時に任意でリモート provider へフォールバック

`memorySearch.provider = "local"` にすればローカルのままにできます（API 使用なし）。

[Memory](/ja-JP/concepts/memory) を参照してください。

### 5) web search ツール

`web_search` は provider に応じて使用料金が発生することがあります。

- **Brave Search API**: `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` または `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` または `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, または `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, または `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: デフォルトではキー不要ですが、到達可能な Ollama host と `ollama signin` が必要です。host が要求する場合は通常の Ollama provider bearer auth も再利用できます
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, または `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: キー不要のフォールバック（API 課金なし。ただし非公式で HTML ベース）
- **SearXNG**: `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（キー不要/セルフホスト。hosted API 課金なし）

レガシーな `tools.web.search.*` provider path も一時的な互換 shim を通じて引き続き読み込まれますが、現在は推奨される config surface ではありません。

**Brave Search の無料クレジット:** 各 Brave プランには、毎月更新される
\$5/月の無料クレジットが含まれます。Search プランの料金は
1,000 リクエストあたり \$5 なので、このクレジットで月
1,000 リクエストを無料で利用できます。予期しない請求を防ぐため、Brave ダッシュボードで
使用量上限を設定してください。

[Web tools](/ja-JP/tools/web) を参照してください。

### 5) web fetch ツール（Firecrawl）

`web_fetch` は、API キーが存在する場合 **Firecrawl** を呼び出すことができます。

- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl が設定されていない場合、ツールは direct fetch + readability にフォールバックします（有料 API なし）。

[Web tools](/ja-JP/tools/web) を参照してください。

### 6) provider 使用量スナップショット（status/health）

一部の status コマンドは、クォータウィンドウまたは auth health を表示するために
**provider 使用量 endpoint** を呼び出します。
これらは通常は低頻度の呼び出しですが、それでも provider API にアクセスします。

- `openclaw status --usage`
- `openclaw models status --json`

[Models CLI](/ja-JP/cli/models) を参照してください。

### 7) Compaction safeguard 要約

compaction safeguard は、**現在の model** を使ってセッション履歴を要約することがあり、
実行時には provider API を呼び出します。

[Session management + compaction](/ja-JP/reference/session-management-compaction) を参照してください。

### 8) model scan / probe

`openclaw models scan` は OpenRouter model を probe でき、
probe が有効な場合は `OPENROUTER_API_KEY` を使用します。

[Models CLI](/ja-JP/cli/models) を参照してください。

### 9) Talk（speech）

Talk mode は、設定されている場合 **ElevenLabs** を呼び出すことがあります。

- `ELEVENLABS_API_KEY` または `talk.providers.elevenlabs.apiKey`

[Talk mode](/ja-JP/nodes/talk) を参照してください。

### 10) Skills（サードパーティ API）

Skills は `skills.entries.<name>.apiKey` に `apiKey` を保存できます。その
skill がそのキーを外部 API に使用する場合、その skill の provider に従ってコストが発生することがあります。

[Skills](/ja-JP/tools/skills) を参照してください。

## 関連

- [Token use and costs](/ja-JP/reference/token-use)
- [Prompt caching](/ja-JP/reference/prompt-caching)
- [Usage tracking](/ja-JP/concepts/usage-tracking)
