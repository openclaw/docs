---
read_when:
    - 有料 API を呼び出す可能性がある機能を把握したい
    - キー、コスト、使用状況の可視性を監査する必要がある
    - /status または /usage のコストレポートについて説明しています
summary: 支出が発生し得るもの、使用されるキー、使用状況の確認方法を監査する
title: API の使用量とコスト
x-i18n:
    generated_at: "2026-07-05T11:47:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d31e60931d8142ea808ae2eb8ed10d9f241ce987e46eadc9d8b7d0614befd1a1
    source_path: reference/api-usage-costs.md
    workflow: 16
---

有料プロバイダー API を呼び出せる OpenClaw 機能、それぞれが認証情報を読み取る場所、および発生したコストが表示される場所の一覧。

## コストが表示される場所

**`/status`**（セッションごとのスナップショット）

- 現在のセッションモデル、コンテキスト使用量、直近レスポンスのトークン数を表示します。
- OpenClaw が使用量メタデータとアクティブモデルのローカル価格を持っている場合、直近の返信に対する**推定コスト**を追加します。これには Bedrock `aws-sdk` モデルなど、明示的に価格設定された非 API キープロバイダーも含まれます。
- ライブセッションのスナップショットがまばらな場合、`/status` は最新のトランスクリプト使用量エントリからトークン/キャッシュカウンターとアクティブモデルラベルを復元します。既存のゼロでないライブ値はトランスクリプトデータより優先されます。保存済み合計が欠落しているか小さい場合は、プロンプトサイズのトランスクリプト合計が引き続き優先されることがあります。

**`/usage`**（メッセージごとのフッター）

- `/usage full` はすべての返信に使用量フッターを追加します。ローカル価格が設定され、使用量メタデータが利用可能な場合は**推定コスト**も含まれます。
- `/usage tokens` はトークンのみを表示します。サブスクリプション形式の OAuth/トークンおよび CLI ランタイムは、互換性のある使用量メタデータと明示的なローカル価格の両方を提供しない限り、トークンのみを表示します。
- `/usage cost` はローカルコストの概要を出力します。`/usage off` はフッターを無効にします。
- Gemini CLI の注記: `stream-json` とレガシー `json` 出力はどちらも `stats` の下に使用量を含めます。OpenClaw は `stats.cached` を `cacheRead` に正規化し、必要に応じて `stats.input_tokens - stats.cached` から入力トークンを導出します。

**CLI 使用量ウィンドウ**（メッセージごとのコストではなく、プロバイダークォータ）

- `openclaw status --usage` と `openclaw channels list` は、プロバイダーの**使用量ウィンドウ**を `X% left` として表示します。
- 現在の使用量ウィンドウプロバイダー: Anthropic、ClawRouter、DeepSeek、GitHub Copilot、Gemini CLI、MiniMax、OpenAI（ChatGPT/Codex OAuth/トークン認証を含む）、Xiaomi、z.ai。完全なプロバイダー/フラグ一覧は [Models CLI](/ja-JP/cli/models) と [Channels CLI](/ja-JP/cli/channels) を参照してください。
- MiniMax の生の `usage_percent` / `usagePercent` フィールドは残りクォータを報告するため、OpenClaw はそれらを反転します。カウントベースのフィールドが存在する場合はそちらが優先されます。レスポンスに `model_remains` 配列が含まれる場合、OpenClaw はチャットモデルのエントリを選択し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。それ以外の場合、OpenClaw は認証プロファイル、env、または設定から一致する OAuth/API キー認証情報にフォールバックします。

詳細な例は [トークン使用量とコスト](/ja-JP/reference/token-use) を参照してください。

<Note>
Anthropic は、Claude CLI の再利用（`claude -p` を含む）が、新しいポリシーを公開しない限り認可された統合パターンであることを確認しています。Anthropic はメッセージごとのドル建て見積もりを公開していないため、`/usage full` は Claude CLI の使用量に対するコストを表示できません。
</Note>

## キーの検出方法

- **認証プロファイル**: エージェントごとに `auth-profiles.json` に保存されます。
- **環境変数**: 例: `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`。
- **設定**: `models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`agents.defaults.memorySearch.*`、`talk.providers.*.apiKey`。
- **Skills**: `skills.entries.<name>.apiKey`。キーをスキルプロセスの env にエクスポートする場合があります。

## キーを消費し得る機能

### コアモデルレスポンス（チャット + ツール）

すべての返信またはツール呼び出しは、現在のモデルプロバイダー上で実行されます。これは使用量とコストの主な発生源であり、OpenClaw のローカル UI 外で課金されるサブスクリプション形式のホスト型プランも含まれます: OpenAI Codex、Alibaba Cloud Model Studio Coding Plan、MiniMax Coding Plan、Z.AI/GLM Coding Plan、および追加使用量が有効な Anthropic の Claude ログイン経路。

価格設定については [モデル](/ja-JP/providers/models)、表示については [トークン使用量とコスト](/ja-JP/reference/token-use) を参照してください。

### メディア理解（音声/画像/動画）

受信メディアは、返信パイプラインが実行される前にプロバイダー API 経由で要約または文字起こしされる場合があります。プロバイダー対応は Plugin ごとに登録され、Plugin が追加されるにつれて変わります。現在の一覧と設定については [メディア理解](/ja-JP/nodes/media-understanding) を参照してください。

### 画像および動画生成

`image_generate` と `video_generate` は、利用可能な設定済みプロバイダーにルーティングされます。画像生成は、`agents.defaults.imageGenerationModel` が未設定の場合、認証に基づくプロバイダーデフォルトを推論できます。動画生成には明示的な `agents.defaults.videoGenerationModel`（例: `qwen/wan2.6-t2v`）が必要です。

現在のプロバイダー一覧については [画像生成](/ja-JP/tools/image-generation) と [動画生成](/ja-JP/tools/video-generation) を参照してください。

### メモリエンベディングとセマンティック検索

セマンティックメモリ検索は、`agents.defaults.memorySearch.provider` がリモートアダプター（例: `openai`、`gemini`、`voyage`、`mistral`、`deepinfra`、`github-copilot`、`amazon-bedrock`）を指定している場合、エンベディング API を使用します。`memorySearch.provider = "lmstudio"` または `"ollama"` はローカル/セルフホストサーバーに対して実行され、通常はホスト型課金がありません。`memorySearch.provider = "local"` はすべてをデバイス上に保持し、API 使用量は発生しません。任意の `memorySearch.fallback` プロバイダーで、ローカルエンベディングの失敗を補えます。

[メモリ](/ja-JP/concepts/memory) を参照してください。

### Web 検索ツール

`web_search` は、選択されたプロバイダーによっては使用料が発生する場合があります。各プロバイダーは、まず env var からキーを読み取り、その後 `plugins.entries.<id>.config.webSearch.apiKey` から読み取ります。

| プロバイダー           | Env var(s)                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                             |
| DuckDuckGo             | キー不要、非公式、HTML ベース、課金なし                                                                                                                                     |
| Exa                    | `EXA_API_KEY`                                                                                                                                                               |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                         |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                            |
| Grok (xAI)             | xAI OAuth プロファイルまたは `XAI_API_KEY`                                                                                                                                  |
| Kimi (Moonshot)        | `KIMI_API_KEY` または `MOONSHOT_API_KEY`                                                                                                                                    |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`、または `MINIMAX_API_KEY`                                                                          |
| Ollama Web Search      | 到達可能なサインイン済みローカルホストではキー不要。直接の `https://ollama.com` 検索は `OLLAMA_API_KEY` を使用します。認証保護されたホストは通常の Ollama プロバイダーベアラー認証を再利用します |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                          |
| Perplexity Search API  | `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY`                                                                                                                           |
| SearXNG                | `SEARXNG_BASE_URL`。キー不要/セルフホスト、ホスト型課金なし                                                                                                                 |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                            |

レガシーの `tools.web.search.*` 設定パスは互換性 shim を通じて引き続き読み込まれますが、推奨されるサーフェスではなくなりました。

**Brave Search 無料クレジット**: 各プランには毎月更新される $5/月の無料クレジットが含まれます。Searchプランは 1,000 リクエストあたり $5 なので、このクレジットにより月 1,000 リクエストを無料で利用できます。予期しない請求を避けるため、Brave ダッシュボードで使用量上限を設定してください。

[Web ツール](/ja-JP/tools/web) を参照してください。

### Web 取得ツール（Firecrawl）

`web_fetch` はキー不要のスターターアクセスで Firecrawl を呼び出せます。より高い制限には `FIRECRAWL_API_KEY`（または `plugins.entries.firecrawl.config.webFetch.apiKey`）を追加してください。Firecrawl が設定されていない場合、ツールは直接取得とバンドルされた `web-readability` Plugin（有料 API なし）にフォールバックします。ローカルの Readability 抽出をスキップするには、`plugins.entries.web-readability.enabled` を無効にしてください。

[Web ツール](/ja-JP/tools/web) を参照してください。

### プロバイダー使用量スナップショット（ステータス/ヘルス）

`openclaw status --usage` と `openclaw models status --json` は、プロバイダー使用量エンドポイントを呼び出してクォータウィンドウまたは認証ヘルスを表示します。呼び出しは低頻度ですが、それでもプロバイダー API に到達します。

[Models CLI](/ja-JP/cli/models) を参照してください。

### Compaction セーフガード要約

Compaction セーフガードは、現在のモデルを使用してセッション履歴を要約することがあり、実行時にはプロバイダー API を呼び出します。

[セッション管理と Compaction](/ja-JP/reference/session-management-compaction) を参照してください。

### モデルスキャン/プローブ

`openclaw models scan` は OpenRouter モデルをプローブでき、プローブが有効な場合は `OPENROUTER_API_KEY` を使用します。

[Models CLI](/ja-JP/cli/models) を参照してください。

### Talk（音声）

Talk モードは、設定されている場合に ElevenLabs を呼び出せます: `ELEVENLABS_API_KEY` または `talk.providers.elevenlabs.apiKey`。

[Talk モード](/ja-JP/nodes/talk) を参照してください。

### Skills（サードパーティ API）

Skills は `skills.entries.<name>.apiKey` に `apiKey` を保存できます。Skill がそのキーを外部 API に対して使用する場合、コストはその Skill のプロバイダーに従います。

[Skills](/ja-JP/tools/skills) を参照してください。

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量追跡](/ja-JP/concepts/usage-tracking)
