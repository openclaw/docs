---
read_when:
    - どの機能が有料 API を呼び出す可能性があるかを理解したい
    - キー、コスト、使用状況の可視性を監査する必要があります
    - /status または /usage のコストレポートについて説明している
summary: 費用が発生し得るもの、使用されるキー、使用状況の確認方法を監査する
title: API の使用量とコスト
x-i18n:
    generated_at: "2026-06-27T12:54:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

このドキュメントでは、**API キーを呼び出す可能性がある機能**と、そのコストがどこに表示されるかを示します。対象は、プロバイダー使用量または有料 API 呼び出しを発生させる可能性がある OpenClaw 機能です。

## コストが表示される場所（チャット + CLI）

**セッションごとのコストスナップショット**

- `/status` は、現在のセッションモデル、コンテキスト使用量、最後の応答トークンを表示します。
- OpenClaw が使用量メタデータとアクティブモデルのローカル価格を持っている場合、`/status` は最後の返信の**推定コスト**も表示します。これには、Bedrock `aws-sdk` モデルのように、明示的に価格設定された API キー不要プロバイダーも含まれる場合があります。
- ライブセッションメタデータが少ない場合、`/status` は最新のトランスクリプト使用量エントリからトークン/キャッシュカウンターとアクティブなランタイムモデルラベルを復元できます。既存のゼロ以外のライブ値は引き続き優先され、保存済み合計が欠落しているか小さい場合は、プロンプトサイズのトランスクリプト合計が優先されることがあります。

**メッセージごとのコストフッター**

- `/usage full` は、アクティブモデルのローカル価格が設定され、使用量メタデータが利用可能な場合、**推定コスト**を含む使用量フッターをすべての返信に追加します。
- `/usage tokens` はトークンのみを表示します。サブスクリプション形式の OAuth/トークンおよび CLI フローでは、そのランタイムが互換性のある使用量メタデータを提供し、明示的なローカル価格が設定されていない限り、引き続きトークンのみが表示されます。
- Gemini CLI 注記: デフォルトの `stream-json` 出力とレガシー JSON オーバーライドはいずれも `stats` から使用量を読み取り、`stats.cached` を `cacheRead` に正規化し、必要に応じて `stats.input_tokens - stats.cached` から入力トークンを導出します。

Anthropic 注記: Anthropic スタッフから、OpenClaw 形式の Claude CLI 使用が再び許可されたと伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合における Claude CLI の再利用と `claude -p` の使用を認可済みとして扱います。Anthropic は今も、OpenClaw が `/usage full` で表示できるメッセージごとのドル建て推定額を公開していません。

**CLI 使用量ウィンドウ（プロバイダークォータ）**

- `openclaw status --usage` と `openclaw channels list` は、プロバイダーの**使用量ウィンドウ**（メッセージごとのコストではなくクォータスナップショット）を表示します。
- 人間向けの出力は、プロバイダー間で `X% left` に正規化されます。
- 現在の使用量ウィンドウプロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi、z.ai。
- MiniMax 注記: 生の `usage_percent` / `usagePercent` フィールドは残りクォータを意味するため、OpenClaw は表示前にそれらを反転します。カウントベースのフィールドが存在する場合は引き続き優先されます。プロバイダーが `model_remains` を返す場合、OpenClaw はチャットモデルのエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- これらのクォータウィンドウの使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。それ以外の場合、OpenClaw は認証プロファイル、環境、または設定から一致する OAuth/API キー認証情報にフォールバックします。

詳細と例については、[トークン使用量とコスト](/ja-JP/reference/token-use)を参照してください。

## キーの検出方法

OpenClaw は次の場所から認証情報を取得できます。

- **認証プロファイル**（エージェントごと、`auth-profiles.json` に保存）。
- **環境変数**（例: `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **設定**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、`talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`）。これはキーをスキルプロセスの環境にエクスポートする場合があります。

## キーを消費する可能性がある機能

### 1) コアモデル応答（チャット + ツール）

すべての返信またはツール呼び出しは、**現在のモデルプロバイダー**（OpenAI、Anthropic など）を使用します。これは使用量とコストの主な発生源です。

これには、OpenClaw のローカル UI の外で課金されるサブスクリプション形式のホスト型プロバイダーも含まれます。たとえば、**OpenAI Codex**、**Alibaba Cloud Model Studio Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**、および **Extra Usage** が有効な Anthropic の OpenClaw Claude ログイン経路です。

価格設定については[モデル](/ja-JP/providers/models)を、表示については[トークン使用量とコスト](/ja-JP/reference/token-use)を参照してください。

### 2) メディア理解（音声/画像/動画）

受信メディアは、返信の実行前に要約/文字起こしされる場合があります。これはモデル/プロバイダー API を使用します。

- 音声: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral。
- 画像: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 動画: Google / Qwen / Moonshot。

[メディア理解](/ja-JP/nodes/media-understanding)を参照してください。

### 3) 画像および動画生成

共有生成機能もプロバイダーキーを消費する場合があります。

- 画像生成: OpenAI / Google / DeepInfra / fal / MiniMax
- 動画生成: DeepInfra / Qwen

画像生成は、`agents.defaults.imageGenerationModel` が未設定の場合、認証に裏付けられたデフォルトプロバイダーを推定できます。動画生成では現在、`qwen/wan2.6-t2v` などの明示的な `agents.defaults.videoGenerationModel` が必要です。

[画像生成](/ja-JP/tools/image-generation)、[Qwen Cloud](/ja-JP/providers/qwen)、および[モデル](/ja-JP/concepts/models)を参照してください。

### 4) メモリエンベディング + セマンティック検索

セマンティックメモリ検索は、リモートプロバイダー向けに設定されている場合、**エンベディング API** を使用します。

- `memorySearch.provider = "openai"` → OpenAI エンベディング
- `memorySearch.provider = "gemini"` → Gemini エンベディング
- `memorySearch.provider = "voyage"` → Voyage エンベディング
- `memorySearch.provider = "mistral"` → Mistral エンベディング
- `memorySearch.provider = "deepinfra"` → DeepInfra エンベディング
- `memorySearch.provider = "lmstudio"` → LM Studio エンベディング（ローカル/セルフホスト）
- `memorySearch.provider = "ollama"` → Ollama エンベディング（ローカル/セルフホスト。通常、ホスト型 API 課金なし）
- ローカルエンベディングが失敗した場合のリモートプロバイダーへの任意のフォールバック

`memorySearch.provider = "local"` を使用するとローカルに保てます（API 使用なし）。

[メモリ](/ja-JP/concepts/memory)を参照してください。

### 5) Web 検索ツール

`web_search` は、プロバイダーによっては使用料が発生する場合があります。

- **Brave Search API**: `BRAVE_API_KEY` または `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` または `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` または `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: xAI OAuth プロファイル、`XAI_API_KEY`、または `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`、`MOONSHOT_API_KEY`、または `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY`、または `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: 到達可能でサインイン済みのローカル Ollama ホストではキー不要。直接の `https://ollama.com` 検索は `OLLAMA_API_KEY` を使用し、認証で保護されたホストは通常の Ollama プロバイダーの bearer 認証を再利用できます
- **Perplexity Search API**: `PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY`、または `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` または `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: 明示的に選択された場合のキー不要プロバイダー（API 課金なし。ただし非公式で HTML ベース）
- **SearXNG**: `SEARXNG_BASE_URL` または `plugins.entries.searxng.config.webSearch.baseUrl`（キー不要/セルフホスト。ホスト型 API 課金なし）

レガシーの `tools.web.search.*` プロバイダーパスは、引き続き一時的な互換性 shim を通じて読み込まれますが、推奨される設定サーフェスではなくなりました。

**Brave Search 無料クレジット:** 各 Brave プランには、毎月更新される \$5/月の無料クレジットが含まれます。Search プランは 1,000 リクエストあたり \$5 のため、このクレジットで月 1,000 リクエストを無料で利用できます。予期しない請求を避けるには、Brave ダッシュボードで使用量上限を設定してください。

[Web ツール](/ja-JP/tools/web)を参照してください。

### 5) Web 取得ツール（Firecrawl）

`web_fetch` は、キー不要のスターターアクセスで **Firecrawl** を呼び出せます。より高い上限には API キーを追加してください。

- `FIRECRAWL_API_KEY` または `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl が設定されていない場合、このツールは直接取得と同梱の `web-readability` Plugin にフォールバックします（有料 API なし）。ローカルの Readability 抽出をスキップするには、`plugins.entries.web-readability.enabled` を無効にします。

[Web ツール](/ja-JP/tools/web)を参照してください。

### 6) プロバイダー使用量スナップショット（ステータス/ヘルス）

一部のステータスコマンドは、クォータウィンドウまたは認証ヘルスを表示するために**プロバイダー使用量エンドポイント**を呼び出します。これらは通常低頻度の呼び出しですが、それでもプロバイダー API に到達します。

- `openclaw status --usage`
- `openclaw models status --json`

[モデル CLI](/ja-JP/cli/models)を参照してください。

### 7) Compaction セーフガード要約

Compaction セーフガードは、**現在のモデル**を使用してセッション履歴を要約できます。実行時にはプロバイダー API を呼び出します。

[セッション管理 + Compaction](/ja-JP/reference/session-management-compaction)を参照してください。

### 8) モデルスキャン / プローブ

`openclaw models scan` は OpenRouter モデルをプローブでき、プローブが有効な場合は `OPENROUTER_API_KEY` を使用します。

[モデル CLI](/ja-JP/cli/models)を参照してください。

### 9) Talk（音声）

Talk モードは、設定されている場合に **ElevenLabs** を呼び出せます。

- `ELEVENLABS_API_KEY` または `talk.providers.elevenlabs.apiKey`

[Talk モード](/ja-JP/nodes/talk)を参照してください。

### 10) Skills（サードパーティ API）

Skills は `skills.entries.<name>.apiKey` に `apiKey` を保存できます。スキルが外部 API にそのキーを使用する場合、そのスキルのプロバイダーに応じてコストが発生する可能性があります。

[Skills](/ja-JP/tools/skills)を参照してください。

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量追跡](/ja-JP/concepts/usage-tracking)
