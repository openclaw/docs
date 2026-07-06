---
read_when:
    - どの機能が有料 API を呼び出す可能性があるかを理解したい
    - キー、コスト、使用状況の可視性を監査する必要があります
    - /status または /usage のコストレポートを説明している
summary: 支出が発生する可能性があるもの、使用されるキー、使用量の確認方法を監査する
title: API の使用量とコスト
x-i18n:
    generated_at: "2026-07-06T10:54:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

OpenClaw の有料プロバイダー API を呼び出せる機能、それぞれが認証情報を読み取る場所、および発生したコストが表示される場所の対応表。

## コストが表示される場所

**`/status`**（セッション単位のスナップショット）

- 現在のセッションモデル、コンテキスト使用量、直近レスポンスのトークン数を表示します。
- OpenClaw が使用量メタデータとアクティブなモデルのローカル価格を持っている場合、直近の返信について**推定コスト**を追加します。Bedrock `aws-sdk` モデルのように、明示的に価格設定された非 API キープロバイダーも含まれます。
- ライブセッションのスナップショットが疎な場合、`/status` は最新のトランスクリプト使用量エントリからトークン/キャッシュカウンターとアクティブなモデルラベルを復元します。既存の非ゼロのライブ値はトランスクリプトデータより優先されます。保存済み合計が欠落しているか小さい場合でも、プロンプトサイズのトランスクリプト合計が優先されることがあります。

**`/usage`**（メッセージ単位のフッター）

- `/usage full` はすべての返信に使用量フッターを追加し、ローカル価格が設定されていて使用量メタデータが利用できる場合は**推定コスト**も含めます。
- `/usage tokens` はトークンのみを表示します。サブスクリプション形式の OAuth/トークンおよび CLI ランタイムは、互換性のある使用量メタデータと明示的なローカル価格を提供しない限り、トークンのみを表示します。
- `/usage cost` はローカルコストの概要を出力します。`/usage off` はフッターを無効にします。
- Gemini CLI の注記: `stream-json` と従来の `json` 出力はいずれも `stats` の下に使用量を含みます。OpenClaw は必要に応じて `stats.cached` を `cacheRead` に正規化し、`stats.input_tokens - stats.cached` から入力トークンを導出します。

**コントロール UI → 使用量**（セッション横断分析）

- 選択した日付範囲について、トランスクリプトから導出したトークン合計と推定コスト合計を表示し、プロバイダー、モデル、エージェント、チャンネル、トークン種別ごとの内訳も示します。
- 選択範囲の終了日に終わる、より短いカレンダーウィンドウを比較します。欠落した日付は使用量ゼロのカレンダー日として数えられ、密度の高いウィンドウを作るためにスキップされることはありません。
- 日次チャートのスケールを直接ラベル表示します。`√` バッジは、平方根圧縮によって使用量の少ない日も見える状態に保たれていることを意味します。
- これらの合計は、利用可能なローカルセッション履歴を説明するものであり、プロバイダーの請求書や通算の課金台帳ではありません。価格がないエントリがある場合、UI は警告します。

**CLI 使用量ウィンドウ**（プロバイダーのクォータであり、メッセージ単位のコストではありません）

- `openclaw status --usage` と `openclaw channels list` は、プロバイダーの**使用量ウィンドウ**を `X% left` として表示します。
- 現在の使用量ウィンドウ対応プロバイダー: Anthropic、ClawRouter、DeepSeek、GitHub Copilot、Gemini CLI、MiniMax、OpenAI（ChatGPT/Codex OAuth/トークン認証を含む）、Xiaomi、z.ai。完全なプロバイダー/フラグ一覧については、[モデル CLI](/ja-JP/cli/models) と [チャンネル CLI](/ja-JP/cli/channels) を参照してください。
- MiniMax の生の `usage_percent` / `usagePercent` フィールドは残りクォータを報告するため、OpenClaw はそれらを反転します。件数ベースのフィールドが存在する場合はそちらが優先されます。レスポンスに `model_remains` 配列が含まれる場合、OpenClaw はチャットモデルのエントリを選び、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 使用量認証は、利用可能な場合はプロバイダー固有のフックから取得されます。それ以外の場合、OpenClaw は認証プロファイル、環境、または設定から一致する OAuth/API キー認証情報にフォールバックします。

詳細な例については、[トークン使用量とコスト](/ja-JP/reference/token-use) を参照してください。

<Note>
Anthropic は、新しいポリシーを公開しない限り、Claude CLI の再利用（`claude -p` を含む）が認可された統合パターンであることを確認しています。Anthropic はメッセージ単位の金額見積もりを公開していないため、`/usage full` は Claude CLI 使用量のコストを表示できません。
</Note>

## キーの検出方法

- **認証プロファイル**: エージェント単位で、`auth-profiles.json` に保存されます。
- **環境変数**: 例: `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`。
- **設定**: `models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`agents.defaults.memorySearch.*`、`talk.providers.*.apiKey`。
- **Skills**: `skills.entries.<name>.apiKey`。キーを Skills プロセス環境へエクスポートする場合があります。

## キーを消費し得る機能

### コアモデルレスポンス（チャット + ツール）

すべての返信またはツール呼び出しは、現在のモデルプロバイダー上で実行されます。これは使用量とコストの主な発生源であり、OpenClaw のローカル UI の外で課金されるサブスクリプション形式のホスト型プランも含まれます: OpenAI Codex、Alibaba Cloud Model Studio Coding Plan、MiniMax Coding Plan、Z.AI/GLM Coding Plan、および Extra Usage が有効な Anthropic の Claude ログイン経路。

価格設定については[モデル](/ja-JP/providers/models)、表示については[トークン使用量とコスト](/ja-JP/reference/token-use)を参照してください。

### メディア理解（音声/画像/動画）

受信メディアは、返信パイプラインが実行される前に、プロバイダー API 経由で要約または文字起こしされる場合があります。プロバイダー対応は Plugin ごとに登録され、Plugin の追加に伴って変わります。現在の一覧と設定については、[メディア理解](/ja-JP/nodes/media-understanding) を参照してください。

### 画像と動画の生成

`image_generate` と `video_generate` は、利用可能な設定済みプロバイダーへルーティングされます。画像生成は、`agents.defaults.imageGenerationModel` が未設定の場合、認証に基づくプロバイダーのデフォルトを推論できます。動画生成には明示的な `agents.defaults.videoGenerationModel` が必要です（例: `qwen/wan2.6-t2v`）。

現在のプロバイダー一覧については、[画像生成](/ja-JP/tools/image-generation) と [動画生成](/ja-JP/tools/video-generation) を参照してください。

### メモリ埋め込みとセマンティック検索

セマンティックメモリ検索は、`agents.defaults.memorySearch.provider` がリモートアダプターを指定している場合（例: `openai`、`gemini`、`voyage`、`mistral`、`deepinfra`、`github-copilot`、`amazon-bedrock`）、埋め込み API を使用します。`memorySearch.provider = "lmstudio"` または `"ollama"` はローカル/セルフホスト型サーバーに対して実行され、通常はホスト型課金がありません。`memorySearch.provider = "local"` はすべてをデバイス上に保持し、API 使用はありません。任意の `memorySearch.fallback` プロバイダーで、ローカル埋め込みの失敗を補えます。

[メモリ](/ja-JP/concepts/memory)を参照してください。

### Web 検索ツール

`web_search` は、選択したプロバイダーによっては使用料金が発生する場合があります。各プロバイダーはまず環境変数からキーを読み取り、その後 `plugins.entries.<id>.config.webSearch.apiKey` を読み取ります。

| プロバイダー               | 環境変数                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                        |
| DuckDuckGo             | キー不要。非公式、HTML ベース、課金なし                                                                                                                           |
| Exa                    | `EXA_API_KEY`                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                    |
| Gemini（Google Search） | `GEMINI_API_KEY`                                                                                                                                                       |
| Grok（xAI）             | xAI OAuth プロファイルまたは `XAI_API_KEY`                                                                                                                                     |
| Kimi（Moonshot）        | `KIMI_API_KEY` または `MOONSHOT_API_KEY`                                                                                                                                   |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`、または `MINIMAX_API_KEY`                                                                         |
| Ollama Web Search      | 到達可能なサインイン済みローカルホストではキー不要。直接の `https://ollama.com` 検索は `OLLAMA_API_KEY` を使用します。認証で保護されたホストは通常の Ollama プロバイダーのベアラー認証を再利用します |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY`                                                                                                                           |
| SearXNG                | `SEARXNG_BASE_URL`。キー不要/セルフホスト型、ホスト型課金なし                                                                                                            |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                       |

従来の `tools.web.search.*` 設定パスは互換性シムを通じて引き続き読み込まれますが、推奨されるサーフェスではなくなりました。

**Brave Search の無料クレジット**: 各プランには毎月更新される $5/月の無料クレジットが含まれます。Search プランは 1,000 リクエストあたり $5 なので、クレジットにより月 1,000 リクエストまで無料で利用できます。予期しない請求を避けるには、Brave ダッシュボードで使用量上限を設定してください。

[Web ツール](/ja-JP/tools/web)を参照してください。

### Web 取得ツール（Firecrawl）

`web_fetch` は、キーなしのスターターアクセスで Firecrawl を呼び出せます。上限を増やすには `FIRECRAWL_API_KEY`（または `plugins.entries.firecrawl.config.webFetch.apiKey`）を追加してください。Firecrawl が設定されていない場合、このツールは直接取得とバンドル済みの `web-readability` Plugin（有料 API なし）にフォールバックします。ローカルの Readability 抽出をスキップするには、`plugins.entries.web-readability.enabled` を無効にします。

[Web ツール](/ja-JP/tools/web)を参照してください。

### プロバイダー使用量スナップショット（ステータス/ヘルス）

`openclaw status --usage` と `openclaw models status --json` は、プロバイダーの使用量エンドポイントを呼び出してクォータウィンドウまたは認証ヘルスを表示します。呼び出し回数は少量ですが、それでもプロバイダー API にアクセスします。

[モデル CLI](/ja-JP/cli/models)を参照してください。

### Compaction セーフガードの要約

Compaction セーフガードは現在のモデルを使ってセッション履歴を要約する場合があり、実行時にはプロバイダー API を呼び出します。

[セッション管理と Compaction](/ja-JP/reference/session-management-compaction)を参照してください。

### モデルスキャン/プローブ

`openclaw models scan` は OpenRouter モデルをプローブでき、プローブが有効な場合は `OPENROUTER_API_KEY` を使用します。

[モデル CLI](/ja-JP/cli/models)を参照してください。

### Talk（音声）

Talk モードは、設定されている場合に ElevenLabs を呼び出せます: `ELEVENLABS_API_KEY` または `talk.providers.elevenlabs.apiKey`。

[Talk モード](/ja-JP/nodes/talk)を参照してください。

### Skills（サードパーティ API）

Skills は `skills.entries.<name>.apiKey` に `apiKey` を保存できます。Skills がそのキーを外部 API に対して使用する場合、コストは Skills のプロバイダーに従います。

[Skills](/ja-JP/tools/skills)を参照してください。

## 関連

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量追跡](/ja-JP/concepts/usage-tracking)
