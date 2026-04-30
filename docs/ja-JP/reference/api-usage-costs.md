---
read_when:
    - どの機能が有料 API を呼び出す可能性があるかを理解したい場合
    - キー、コスト、使用状況の可視性を監査する必要があります
    - /status または /usage のコスト報告について説明しています
summary: 費用が発生し得るもの、使用されるキー、使用量の確認方法を監査する
title: API の使用量とコスト
x-i18n:
    generated_at: "2026-04-30T05:33:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# API の使用量とコスト

このドキュメントでは、**API キーを呼び出す可能性がある機能**と、そのコストがどこに表示されるかを一覧します。対象は、プロバイダー使用量または有料 API 呼び出しを発生させる可能性がある OpenClaw の機能です。

## コストが表示される場所（チャット + CLI）

**セッションごとのコストスナップショット**

- `/status` は、現在のセッションモデル、コンテキスト使用量、直近の応答トークンを表示します。
- モデルが **API キー認証**を使用している場合、`/status` は直近の返信の**推定コスト**も表示します。
- ライブセッションのメタデータが少ない場合、`/status` は最新のトランスクリプト使用量エントリから、トークン/キャッシュカウンターとアクティブなランタイムモデルラベルを復元できます。既存の非ゼロのライブ値がある場合は引き続き優先され、保存済み合計が欠落しているか小さい場合は、プロンプトサイズのトランスクリプト合計が優先されることがあります。

**メッセージごとのコストフッター**

- `/usage full` は、**推定コスト**（API キーのみ）を含む使用量フッターをすべての返信に追加します。
- `/usage tokens` はトークンのみを表示します。サブスクリプション形式の OAuth/トークンおよび CLI フローでは、ドル建てコストは非表示になります。
- Gemini CLI の注記: CLI が JSON 出力を返す場合、OpenClaw は `stats` から使用量を読み取り、`stats.cached` を `cacheRead` に正規化し、必要に応じて `stats.input_tokens - stats.cached` から入力トークンを導出します。

Anthropic の注記: Anthropic のスタッフから、OpenClaw 形式の Claude CLI 使用は再び許可されていると伝えられているため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの連携における Claude CLI の再利用と `claude -p` の使用を認可済みとして扱います。Anthropic は現在も、OpenClaw が `/usage full` に表示できるメッセージごとのドル建て推定額を公開していません。

**CLI 使用量ウィンドウ（プロバイダークォータ）**

- `openclaw status --usage` と `openclaw channels list` は、プロバイダーの**使用量ウィンドウ**（メッセージごとのコストではなく、クォータスナップショット）を表示します。
- 人間向けの出力は、プロバイダー間で `X% left` に正規化されます。
- 現在の使用量ウィンドウのプロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi、z.ai。
- MiniMax の注記: 生の `usage_percent` / `usagePercent` フィールドは残りクォータを意味するため、OpenClaw は表示前にそれらを反転します。カウントベースのフィールドが存在する場合は、引き続きそちらが優先されます。プロバイダーが `model_remains` を返す場合、OpenClaw はチャットモデルのエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- これらのクォータウィンドウの使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。それ以外の場合、OpenClaw は認証プロファイル、環境変数、または設定から一致する OAuth/API キー認証情報にフォールバックします。

詳細と例については、[トークン使用量とコスト](/ja-JP/reference/token-use)を参照してください。

## キーの検出方法

OpenClaw は次の場所から認証情報を取得できます。

- **認証プロファイル**（エージェントごと、`auth-profiles.json` に保存）。
- **環境変数**（例: `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **設定**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、`talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`）。Skill プロセスの環境変数へキーをエクスポートする場合があります。

## キーを消費する可能性がある機能

### 1) コアモデル応答（チャット + ツール）

すべての返信またはツール呼び出しは、**現在のモデルプロバイダー**（OpenAI、Anthropic など）を使用します。これが使用量とコストの主な発生源です。

これには、OpenClaw のローカル UI の外部で課金されるサブスクリプション形式のホスト型プロバイダーも含まれます。例として、**OpenAI Codex**、**Alibaba Cloud Model Studio Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**、および **Extra Usage** が有効な Anthropic の OpenClaw Claude ログインパスがあります。

価格設定については[モデル](/ja-JP/providers/models)を、表示については[トークン使用量とコスト](/ja-JP/reference/token-use)を参照してください。

### 2) メディア理解（音声/画像/動画）

受信メディアは、返信の実行前に要約または文字起こしされることがあります。これはモデル/プロバイダー API を使用します。

- 音声: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral。
- 画像: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 動画: Google / Qwen / Moonshot。

[メディア理解](/ja-JP/nodes/media-understanding)を参照してください。

### 3) 画像と動画の生成

共有生成機能もプロバイダーキーを消費する可能性があります。

- 画像生成: OpenAI / Google / DeepInfra / fal / MiniMax
- 動画生成: DeepInfra / Qwen

`agents.defaults.imageGenerationModel` が未設定の場合、画像生成は認証に裏付けられたデフォルトプロバイダーを推定できます。動画生成では現在、`qwen/wan2.6-t2v` などの明示的な `agents.defaults.videoGenerationModel` が必要です。

[画像生成](/ja-JP/tools/image-generation)、[Qwen Cloud](/ja-JP/providers/qwen)、[モデル](/ja-JP/concepts/models)を参照してください。

### 4) メモリ埋め込み + セマンティック検索

セマンティックメモリ検索は、リモートプロバイダー向けに設定されている場合、**埋め込み API** を使用します。

- `memorySearch.provider = "openai"` → OpenAI 埋め込み
- `memorySearch.provider = "gemini"` → Gemini 埋め込み
- `memorySearch.provider = "voyage"` → Voyage 埋め込み
- `memorySearch.provider = "mistral"` → Mistral 埋め込み
- `memorySearch.provider = "deepinfra"` → DeepInfra 埋め込み
- `memorySearch.provider = "lmstudio"` → LM Studio 埋め込み（ローカル/セルフホスト）
- `memorySearch.provider = "ollama"` → Ollama 埋め込み（ローカル/セルフホスト。通常、ホスト型 API 課金なし）
- ローカル埋め込みが失敗した場合、任意でリモートプロバイダーへフォールバック

`memorySearch.provider = "local"` にするとローカルのままにできます（API 使用なし）。

[メモリ](/ja-JP/concepts/memory)を参照してください。

### 5) Web 検索ツール

`web_search` は、プロバイダーによっては使用料が発生する場合があります。

- **Brave Search API**: `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` または `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` または `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`、`MOONSHOT_API_KEY`、または `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY`、または `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: 到達可能なサインイン済みローカル Ollama ホストではキー不要。直接 `https://ollama.com` 検索は `OLLAMA_API_KEY` を使用し、認証で保護されたホストは通常の Ollama プロバイダーベアラー認証を再利用できます
- **Perplexity Search API**: `PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY`、または `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: キー不要のフォールバック（API 課金なし。ただし非公式で HTML ベース）
- **SearXNG**: `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（キー不要/セルフホスト。ホスト型 API 課金なし）

従来の `tools.web.search.*` プロバイダーパスは、一時的な互換性 shim を通じて引き続き読み込まれますが、推奨される設定サーフェスではなくなりました。

**Brave Search の無料クレジット:** 各 Brave プランには、毎月更新される \$5/月の無料クレジットが含まれます。Search プランは 1,000 リクエストあたり \$5 のため、このクレジットで月 1,000 リクエストまで無料で利用できます。予期しない請求を避けるには、Brave ダッシュボードで使用量上限を設定してください。

[Web ツール](/ja-JP/tools/web)を参照してください。

### 5) Web 取得ツール（Firecrawl）

API キーが存在する場合、`web_fetch` は **Firecrawl** を呼び出すことがあります。

- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl が設定されていない場合、このツールは直接取得に加えて同梱の `web-readability` Plugin にフォールバックします（有料 API なし）。ローカルの Readability 抽出をスキップするには、`plugins.entries.web-readability.enabled` を無効にしてください。

[Web ツール](/ja-JP/tools/web)を参照してください。

### 6) プロバイダー使用量スナップショット（ステータス/ヘルス）

一部のステータスコマンドは、クォータウィンドウまたは認証ヘルスを表示するために**プロバイダー使用量エンドポイント**を呼び出します。通常は低頻度の呼び出しですが、それでもプロバイダー API にアクセスします。

- `openclaw status --usage`
- `openclaw models status --json`

[モデル CLI](/ja-JP/cli/models)を参照してください。

### 7) Compaction 保護要約

Compaction 保護機能は、**現在のモデル**を使用してセッション履歴を要約することがあり、実行時にプロバイダー API を呼び出します。

[セッション管理 + Compaction](/ja-JP/reference/session-management-compaction)を参照してください。

### 8) モデルスキャン/プローブ

`openclaw models scan` は OpenRouter モデルをプローブでき、プローブが有効な場合は `OPENROUTER_API_KEY` を使用します。

[モデル CLI](/ja-JP/cli/models)を参照してください。

### 9) トーク（音声）

トークモードは、設定されている場合に **ElevenLabs** を呼び出すことがあります。

- `ELEVENLABS_API_KEY` または `talk.providers.elevenlabs.apiKey`

[トークモード](/ja-JP/nodes/talk)を参照してください。

### 10) Skills（サードパーティ API）

Skills は `skills.entries.<name>.apiKey` に `apiKey` を保存できます。Skill がそのキーを外部 API に使用する場合、その Skill のプロバイダーに応じてコストが発生する可能性があります。

[Skills](/ja-JP/tools/skills)を参照してください。

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量トラッキング](/ja-JP/concepts/usage-tracking)
