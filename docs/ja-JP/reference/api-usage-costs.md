---
read_when:
    - 有料 API を呼び出す可能性がある機能を確認したい場合
    - キー、コスト、使用状況の可視性を監査する必要があります
    - /status または /usage のコストレポートについて説明している場合
summary: 費用が発生し得る機能、使用されるキー、使用量の確認方法を監査する
title: API の使用量とコスト
x-i18n:
    generated_at: "2026-07-11T22:39:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

OpenClaw の機能のうち、有料プロバイダー API を呼び出す可能性があるもの、各機能が認証情報を読み取る場所、および発生したコストが表示される場所の一覧です。

## コストが表示される場所

**`/status`**（セッション単位のスナップショット）

- 現在のセッションのモデル、コンテキスト使用量、直前の応答のトークン数を表示します。
- OpenClaw が使用量メタデータとアクティブなモデルのローカル価格情報を取得できる場合、直前の応答の**推定コスト**を追加します。これには、Bedrock の `aws-sdk` モデルなど、API キーを使用しないものの価格が明示的に設定されたプロバイダーも含まれます。
- ライブセッションのスナップショットに十分な情報がない場合、`/status` は最新のトランスクリプト使用量エントリからトークン数、キャッシュ数、およびアクティブなモデルのラベルを復元します。既存のライブ値がゼロでなければ、トランスクリプトのデータより優先されます。保存済みの合計がない場合や、トランスクリプト内のプロンプト相当の合計より小さい場合は、そのトランスクリプトの合計が優先されることがあります。

**`/usage`**（メッセージ単位のフッター）

- `/usage full` はすべての応答に使用量フッターを追加します。ローカル価格が設定され、使用量メタデータが利用可能な場合は、**推定コスト**も含まれます。
- `/usage tokens` はトークン数のみを表示します。サブスクリプション形式の OAuth／トークンおよび CLI ランタイムでは、互換性のある使用量メタデータと明示的なローカル価格の両方が提供されない限り、トークン数のみが表示されます。
- `/usage cost` はローカルのコスト概要を出力し、`/usage off` はフッターを無効にします。
- Gemini CLI に関する注記：`stream-json` と従来の `json` の両方で、使用量は `stats` に含まれます。OpenClaw は `stats.cached` を `cacheRead` に正規化し、必要に応じて `stats.input_tokens - stats.cached` から入力トークン数を算出します。

**Control UI → 使用量**（セッション横断分析）

- 選択した日付範囲について、トランスクリプトから算出したトークン合計と推定コスト合計を、プロバイダー、モデル、エージェント、チャンネル、トークン種別ごとの内訳とともに表示します。
- 選択範囲の終了日までの、より短い暦上の期間と比較します。データがない日付は使用量ゼロの暦日として数えられ、密度の高い期間を作るために除外されることはありません。
- 日次グラフの目盛りを直接表示します。`√` バッジは、平方根圧縮によって使用量の少ない日も見えるようにしていることを示します。
- これらの合計は、利用可能なローカルセッション履歴を表すものであり、プロバイダーの請求書や全期間の請求台帳ではありません。一部のエントリに価格情報がない場合、UI に警告が表示されます。

**CLI の使用量ウィンドウ**（メッセージ単位のコストではなく、プロバイダーのクォータ）

- `openclaw status --usage` と `openclaw channels list` は、プロバイダーの**使用量ウィンドウ**を `X% left` の形式で表示します。
- 現在、使用量ウィンドウに対応するプロバイダーは、Anthropic、ClawRouter、DeepSeek、GitHub Copilot、Gemini CLI、MiniMax、OpenAI（ChatGPT／Codex の OAuth／トークン認証を含む）、Xiaomi、z.ai です。プロバイダーとフラグの完全な一覧については、[モデル CLI](/ja-JP/cli/models)および[チャンネル CLI](/ja-JP/cli/channels)を参照してください。
- MiniMax の未加工の `usage_percent`／`usagePercent` フィールドは残りクォータを示すため、OpenClaw は値を反転します。件数ベースのフィールドがある場合は、そちらが優先されます。応答に `model_remains` 配列が含まれる場合、OpenClaw はチャットモデルのエントリを選択し、必要に応じてタイムスタンプからウィンドウラベルを算出し、プランラベルにモデル名を含めます。
- 使用量の認証情報は、利用可能な場合はプロバイダー固有のフックから取得されます。それ以外の場合、OpenClaw は認証プロファイル、環境変数、または設定から一致する OAuth／API キー認証情報を探します。

詳細な例については、[トークン使用量とコスト](/ja-JP/reference/token-use)を参照してください。

<Note>
Anthropic は、新しいポリシーを公開しない限り、Claude CLI の再利用（`claude -p` を含む）が承認された統合パターンであることを確認しています。Anthropic はメッセージ単位の金額見積もりを提供していないため、`/usage full` では Claude CLI の使用コストを表示できません。
</Note>

## キーの検出方法

- **認証プロファイル**：エージェント単位で `auth-profiles.json` に保存されます。
- **環境変数**：例として `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`。
- **設定**：`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`agents.defaults.memorySearch.*`、`talk.providers.*.apiKey`。
- **Skills**：`skills.entries.<name>.apiKey`。キーが Skills のプロセス環境にエクスポートされる場合があります。

## キーを使用してコストが発生する可能性がある機能

### コアモデルの応答（チャット＋ツール）

すべての応答またはツール呼び出しは、現在のモデルプロバイダー上で実行されます。これは使用量とコストの主な発生源です。OpenClaw のローカル UI の外部で請求されるサブスクリプション形式のホスト型プランも含まれます。対象には OpenAI Codex、Alibaba Cloud Model Studio Coding Plan、MiniMax Coding Plan、Z.AI／GLM Coding Plan、および Extra Usage が有効な Anthropic の Claude ログイン経路があります。

価格設定については[モデル](/ja-JP/providers/models)、表示については[トークン使用量とコスト](/ja-JP/reference/token-use)を参照してください。

### メディア理解（音声／画像／動画）

受信したメディアは、応答パイプラインの実行前にプロバイダー API を介して要約または文字起こしされることがあります。プロバイダー対応は Plugin ごとに登録され、Plugin の追加に伴って変わります。現在の一覧と設定については、[メディア理解](/ja-JP/nodes/media-understanding)を参照してください。

### 画像および動画の生成

`image_generate` と `video_generate` は、利用可能な設定済みプロバイダーに処理を振り分けます。`agents.defaults.imageGenerationModel` が未設定の場合、画像生成では認証情報に基づいてデフォルトのプロバイダーを推定できます。動画生成には `agents.defaults.videoGenerationModel` の明示的な設定が必要です（例：`qwen/wan2.6-t2v`）。

現在のプロバイダー一覧については、[画像生成](/ja-JP/tools/image-generation)および[動画生成](/ja-JP/tools/video-generation)を参照してください。

### メモリ埋め込みとセマンティック検索

`agents.defaults.memorySearch.provider` にリモートアダプター（例：`openai`、`gemini`、`voyage`、`mistral`、`deepinfra`、`github-copilot`、`amazon-bedrock`）を指定すると、セマンティックメモリ検索は埋め込み API を使用します。`memorySearch.provider = "lmstudio"` または `"ollama"` はローカル／セルフホスト型サーバーに対して実行され、通常はホスト型サービスの請求は発生しません。`memorySearch.provider = "local"` はすべての処理をデバイス上に保持し、API を使用しません。任意の `memorySearch.fallback` プロバイダーを指定すると、ローカル埋め込みの失敗を補うことができます。

[メモリ](/ja-JP/concepts/memory)を参照してください。

### Web 検索ツール

`web_search` では、選択したプロバイダーに応じて使用料金が発生することがあります。各プロバイダーは、最初に環境変数からキーを読み取り、次に `plugins.entries.<id>.config.webSearch.apiKey` から読み取ります。

| プロバイダー           | 環境変数                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                                        |
| DuckDuckGo             | キー不要。非公式の HTML ベースで、料金は発生しません                                                                                                                                   |
| Exa                    | `EXA_API_KEY`                                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                                    |
| Gemini（Google Search） | `GEMINI_API_KEY`                                                                                                                                                                       |
| Grok（xAI）             | xAI OAuth プロファイルまたは `XAI_API_KEY`                                                                                                                                             |
| Kimi（Moonshot）        | `KIMI_API_KEY` または `MOONSHOT_API_KEY`                                                                                                                                               |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`、または `MINIMAX_API_KEY`                                                                                     |
| Ollama Web Search      | 到達可能でログイン済みのローカルホストではキー不要。`https://ollama.com` を直接検索する場合は `OLLAMA_API_KEY` を使用。認証で保護されたホストでは通常の Ollama プロバイダーの Bearer 認証を再利用 |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY`                                                                                                                                       |
| SearXNG                | `SEARXNG_BASE_URL`。キー不要／セルフホスト型で、ホスト型サービスの請求は発生しません                                                                                                   |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                                       |

従来の `tools.web.search.*` 設定パスも互換性シムを介して引き続き読み込まれますが、現在は推奨される設定方法ではありません。

**Brave Search の無料クレジット**：各プランには毎月更新される 5 ドル分の無料クレジットが含まれます。Search プランは 1,000 リクエストあたり 5 ドルのため、このクレジットにより毎月 1,000 リクエストまで無料で利用できます。予期しない料金を避けるため、Brave ダッシュボードで使用量上限を設定してください。

[Web ツール](/ja-JP/tools/web)を参照してください。

### Web 取得ツール（Firecrawl）

`web_fetch` は、キーなしのスターターアクセスで Firecrawl を呼び出せます。上限を引き上げるには、`FIRECRAWL_API_KEY`（または `plugins.entries.firecrawl.config.webFetch.apiKey`）を追加します。Firecrawl が設定されていない場合、ツールは直接取得と同梱の `web-readability` Plugin にフォールバックします（有料 API は使用しません）。ローカルの Readability 抽出を省略するには、`plugins.entries.web-readability.enabled` を無効にします。

[Web ツール](/ja-JP/tools/web)を参照してください。

### プロバイダー使用量のスナップショット（状態／稼働状況）

`openclaw status --usage` と `openclaw models status --json` は、プロバイダーの使用量エンドポイントを呼び出して、クォータウィンドウまたは認証状態を表示します。呼び出し頻度は低いものの、プロバイダー API へのアクセスは発生します。

[モデル CLI](/ja-JP/cli/models)を参照してください。

### Compaction セーフガードによる要約

Compaction セーフガードは、現在のモデルを使用してセッション履歴を要約することがあり、実行時にプロバイダー API を呼び出します。

[セッション管理と Compaction](/ja-JP/reference/session-management-compaction)を参照してください。

### モデルのスキャン／プローブ

`openclaw models scan` は OpenRouter モデルをプローブでき、プローブが有効な場合は `OPENROUTER_API_KEY` を使用します。

[モデル CLI](/ja-JP/cli/models)を参照してください。

### トーク（音声）

トークモードは、設定されている場合に ElevenLabs を呼び出せます：`ELEVENLABS_API_KEY` または `talk.providers.elevenlabs.apiKey`。

[トークモード](/ja-JP/nodes/talk)を参照してください。

### Skills（サードパーティ API）

Skills は `skills.entries.<name>.apiKey` に `apiKey` を保存できます。Skills がそのキーを外部 API に使用する場合、コストはその Skills のプロバイダーに従います。

[Skills](/ja-JP/tools/skills)を参照してください。

## 関連項目

- [トークン使用量とコスト](/ja-JP/reference/token-use)
- [プロンプトキャッシュ](/ja-JP/reference/prompt-caching)
- [使用量の追跡](/ja-JP/concepts/usage-tracking)
