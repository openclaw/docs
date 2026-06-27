---
read_when:
    - ライブモデルマトリックス / CLI バックエンド / ACP / media-provider のスモークテストを実行中
    - ライブテストの認証情報解決をデバッグする
    - 新しいプロバイダー固有のライブテストを追加する
sidebarTitle: Live tests
summary: 'ライブ（ネットワークにアクセスする）テスト: モデルマトリックス、CLI バックエンド、ACP、メディアプロバイダー、認証情報'
title: 'テスト: ライブスイート'
x-i18n:
    generated_at: "2026-06-27T11:43:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe2bc8d775450803781caaf22079d5a4634537eb3a15c29e91be5b328d6b32b1
    source_path: help/testing-live.md
    workflow: 16
---

クイックスタート、QA ランナー、単体/統合スイート、Docker フローについては、
[テスト](/ja-JP/help/testing)を参照してください。このページでは、**live**（ネットワークに触れる）テスト
スイート、つまりモデルマトリクス、CLI バックエンド、ACP、メディアプロバイダーの live テスト、および
認証情報の取り扱いについて説明します。

## Live: ローカル smoke コマンド

アドホックな live
チェックの前に、必要なプロバイダーキーをプロセス環境にエクスポートします。

安全なメディア smoke:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全な音声通話準備状況 smoke:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` は、`--yes` も指定されていない限りドライランです。実際の通知通話を発信する意図がある場合にのみ `--yes` を使用してください。Twilio、Telnyx、Plivo では、準備状況チェックが成功するにはパブリック Webhook URL が必要です。ローカルのみの
loopback/プライベートフォールバックは設計上拒否されます。

## Live: Android ノード機能 sweep

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続済み Android ノードが**現在広告しているすべてのコマンド**を呼び出し、コマンド契約の動作をアサートする。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリをインストール/実行/ペアリングしません）。
  - 選択した Android ノードに対するコマンドごとの Gateway `node.invoke` 検証。
- 必須の事前セットアップ:
  - Android アプリがすでに Gateway に接続済み + ペアリング済み。
  - アプリをフォアグラウンドに維持。
  - 成功を期待する機能について、権限/キャプチャ同意が付与済み。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android セットアップの完全な詳細: [Android アプリ](/ja-JP/platforms/android)

## Live: モデル smoke（プロファイルキー）

live テストは、障害を分離できるように 2 つのレイヤーに分割されています。

- 「直接モデル」は、指定されたキーでプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gateway smoke」は、そのモデルで Gateway+エージェントのパイプライン全体が機能するかを示します（セッション、履歴、ツール、サンドボックスポリシーなど）。

### レイヤー 1: 直接モデル補完（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使用して、認証情報があるモデルを選択する
  - モデルごとに小さな補完を実行する（必要に応じて対象を絞った回帰も実行）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`、`small`、または `all`（modern のエイリアス）を設定します。それ以外の場合は、`pnpm test:live` を Gateway smoke に集中させるためスキップされます
- モデルの選択方法:
  - `OPENCLAW_LIVE_MODELS=modern` で modern allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 5.1、MiniMax M3、Grok 4.3）を実行
  - `OPENCLAW_LIVE_MODELS=small` で制約付き小規模モデル allowlist（Qwen 8B/9B local-compatible ルート、Ollama Gemma、OpenRouter Qwen/GLM、Z.AI GLM）を実行
  - `OPENCLAW_LIVE_MODELS=all` は modern allowlist のエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."`（カンマ区切り allowlist）
  - ローカル Ollama 小規模モデル実行はデフォルトで `http://127.0.0.1:11434` を使用します。LAN、カスタム、または Ollama Cloud エンドポイントの場合にのみ `OPENCLAW_LIVE_OLLAMA_BASE_URL` を設定してください。
  - Modern/all および small sweep は、デフォルトでキュレーション済み上限を使用します。選択プロファイルの網羅的 sweep には `OPENCLAW_LIVE_MAX_MODELS=0` を設定し、より小さい上限には正の数を設定してください。
  - 網羅的 sweep は、直接モデルテスト全体のタイムアウトに `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使用します。デフォルト: 60 分。
  - 直接モデルプローブはデフォルトで 20 並列で実行されます。上書きするには `OPENCLAW_LIVE_MODEL_CONCURRENCY` を設定してください。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り allowlist）
- キーの取得元:
  - デフォルト: プロファイルストアと env フォールバック
  - **プロファイルストア**のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定
- これが存在する理由:
  - 「プロバイダー API が壊れている/キーが無効」と「Gateway エージェントパイプラインが壊れている」を分離する
  - 小さく分離された回帰を含む（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + dev エージェント smoke（"@openclaw" が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - インプロセス Gateway を起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとにモデルを上書き）
  - キーがあるモデルを反復し、以下をアサートする:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが機能する（read プローブ）
    - 任意の追加ツールプローブ（exec+read プローブ）
    - OpenAI 回帰パス（tool-call-only → follow-up）が引き続き機能する
- プローブの詳細（障害をすばやく説明できるように）:
  - `read` プローブ: テストはワークスペースに nonce ファイルを書き込み、エージェントにそれを `read` して nonce を返すよう依頼します。
  - `exec+read` プローブ: テストはエージェントに、nonce を一時ファイルへ `exec` で書き込み、その後 `read` で読み戻すよう依頼します。
  - 画像プローブ: テストは生成された PNG（cat + ランダムコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `test/helpers/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: modern allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M3、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` で、同じ制約付き小規模モデル allowlist を Gateway+エージェントのパイプライン全体で実行
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern allowlist のエイリアスです
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定して絞り込み
  - Modern/all および small Gateway sweep は、デフォルトでキュレーション済み上限を使用します。選択対象の網羅的 sweep には `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を設定し、より小さい上限には正の数を設定してください。
- プロバイダーの選択方法（「OpenRouter のすべて」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り allowlist）
- ツール + 画像プローブはこの live テストで常に有効です:
  - `read` プローブ + `exec+read` プローブ（ツール負荷）
  - モデルが画像入力サポートを広告している場合、画像プローブが実行される
  - フロー（大まか）:
    - テストは "CAT" + ランダムコードを含む小さな PNG を生成（`test/helpers/live-image-probe.ts`）
    - `agent` 経由で `attachments: [{ mimeType: "image/png", content: "<base64>" }]` として送信
    - Gateway が添付を `images[]` に解析（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 埋め込みエージェントがマルチモーダルなユーザーメッセージをモデルへ転送
    - アサーション: 返信に `cat` + コードが含まれる（OCR 許容: 軽微な誤りは許可）

<Tip>
自分のマシンでテストできる内容（および正確な `provider/model` ID）を確認するには、次を実行します:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI バックエンド smoke（Claude、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定に触れずに、ローカル CLI バックエンドを使用して Gateway + エージェントパイプラインを検証する。
- バックエンド固有の smoke デフォルトは、所有する拡張機能の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトのプロバイダー/モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド/引数/画像の動作は、所有する CLI バックエンド Plugin メタデータに由来します。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - 実際の画像添付を送信するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。Docker レシピでは、明示的に要求されない限りデフォルトでオフです。
  - プロンプト注入ではなく CLI 引数として画像ファイルパスを渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されている場合に画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 ターン目を送信して再開フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - 選択したモデルが切り替え先をサポートする場合に、Claude Sonnet -> Opus の同一セッション継続性プローブへオプトインするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`。Docker レシピでは集約信頼性のためデフォルトでオフです。
  - MCP/tool loopback プローブへオプトインするには `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`。Docker レシピでは、明示的に要求されない限りデフォルトでオフです。

例:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低コストの Gemini MCP config smoke:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

これは Gemini に応答生成を要求しません。OpenClaw が Gemini に渡すのと同じシステム
設定を書き込み、その後 `gemini --debug mcp list` を実行して、保存済みの `transport: "streamable-http"` サーバーが Gemini の HTTP MCP
形状へ正規化され、ローカルの streamable-HTTP MCP サーバーへ接続できることを証明します。

Docker レシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダー Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

注記:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これは、repo の Docker イメージ内で非 root の `node` ユーザーとして live CLI バックエンド smoke を実行します。
- 所有する拡張機能から CLI smoke メタデータを解決し、一致する Linux CLI パッケージ（`@anthropic-ai/claude-code` または `@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）のキャッシュ済み書き込み可能プレフィックスにインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`claudeAiOauth.subscriptionType` を含む `~/.claude/.credentials.json`、または `claude setup-token` からの `CLAUDE_CODE_OAUTH_TOKEN` のいずれかによる、ポータブルな Claude Code サブスクリプション OAuth が必要です。まず Docker 内で直接 `claude -p` を証明し、その後 Anthropic API キー環境変数を保持せずに 2 回の Gateway CLI バックエンドターンを実行します。このサブスクリプションレーンでは、Claude が現在サードパーティアプリ使用を通常のサブスクリプションプラン上限ではなく追加使用量課金へルーティングするため、Claude MCP/tool と画像プローブがデフォルトで無効化されます。
- live CLI バックエンド smoke は現在、Claude と Gemini で同じエンドツーエンドフローを実行します: テキストターン、画像分類ターン、その後 Gateway CLI を通じて検証される MCP `cron` ツール呼び出し。
- Claude のデフォルト smoke は、セッションを Sonnet から Opus にパッチし、再開されたセッションが以前のメモを引き続き覚えていることも検証します。

## Live: APNs HTTP/2 プロキシ到達性

- テスト: `src/infra/push-apns-http2.live.test.ts`
- 目的: ローカル HTTP CONNECT プロキシ経由で Apple の sandbox APNs エンドポイントへトンネルし、APNs HTTP/2 検証リクエストを送信して、Apple の実際の `403 InvalidProviderToken` 応答がプロキシパスを通って戻ることをアサートする。
- 有効化:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 任意のタイムアウト:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live: ACP bind smoke（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: ライブ ACP エージェントで実際の ACP conversation-bind フローを検証する:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成 message-channel 会話をその場でバインドする
  - 同じ会話で通常のフォローアップを送信する
  - フォローアップがバインド済み ACP セッションのトランスクリプトに届くことを確認する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP エージェント: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` する場合の ACP エージェント: `claude`
  - 合成チャネル: Slack DM スタイルの会話コンテキスト
  - ACP バックエンド: `acpx`
- オーバーライド:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- 注記:
  - このレーンは、テストが外部配信を装わずに message-channel コンテキストを添付できるように、管理者専用の合成 originating-route フィールド付きで Gateway `chat.send` サーフェスを使用する。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP ハーネスエージェント向けに、埋め込み `acpx` Plugin の組み込みエージェントレジストリを使用する。
  - bound-session cron MCP 作成はデフォルトでベストエフォート。これは、外部 ACP ハーネスが bind/image 証明の通過後に MCP 呼び出しをキャンセルする可能性があるため。`OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` を設定すると、そのバインド後 cron プローブを厳格にできる。

例:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-acp-bind
```

単一エージェント Docker レシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker 注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にある。
- デフォルトでは、ACP bind スモークを集約ライブ CLI エージェントに対して順番に実行する: `claude`、`codex`、その後 `gemini`。
- マトリクスを絞るには、`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使用する。
- 一致する CLI 認証素材をコンテナにステージングし、要求されたライブ CLI（`@anthropic-ai/claude-code`、`@openai/codex`、`https://app.factory.ai/cli` 経由の Factory Droid、`@google/gemini-cli`、または `opencode-ai`）がなければインストールする。ACP バックエンド自体は、公式 `acpx` Plugin の埋め込み `acpx/runtime` パッケージ。
- Droid Docker バリアントは設定用に `~/.factory` をステージングし、`FACTORY_API_KEY` を転送し、local Factory OAuth/keyring 認証はコンテナに移植できないため、その API キーを要求する。ACPX の組み込み `droid exec --output-format acp` レジストリエントリを使用する。
- OpenCode Docker バリアントは厳格な単一エージェント回帰レーン。`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（デフォルト `opencode/kimi-k2.6`）から一時的な `OPENCODE_CONFIG_CONTENT` デフォルトモデルを書き込み、`pnpm test:docker:live-acp-bind:opencode` は汎用のバインド後スキップを受け入れる代わりに、バインド済みアシスタントのトランスクリプトを要求する。
- 直接の `acpx` CLI 呼び出しは、Gateway 外部の挙動を比較するための手動/回避策パスに限られる。Docker ACP bind スモークは OpenClaw の埋め込み `acpx` ランタイムバックエンドを実行する。

## ライブ: Codex app-server ハーネススモーク

- 目的: 通常の gateway
  `agent` メソッドを通して、Plugin 所有の Codex ハーネスを検証する:
  - バンドルされた `codex` Plugin を読み込む
  - `openai/gpt-5.5` を選択する。これはデフォルトで OpenAI エージェントターンを Codex 経由にルーティングする
  - Codex ハーネスを選択した状態で、最初の gateway エージェントターンを `openai/gpt-5.5` に送信する
  - 同じ OpenClaw セッションに 2 回目のターンを送信し、app-server
    スレッドが再開できることを確認する
  - 同じ gateway コマンドパスを通して `/codex status` と `/codex models` を実行する
  - 任意で、Guardian レビュー済みの昇格 shell プローブを 2 つ実行する: 承認されるべき無害な
    コマンドと、拒否されてエージェントが問い返すべき偽シークレットのアップロード
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `openai/gpt-5.5`
- 任意の画像プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/ツールプローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークは provider/model `agentRuntime.id: "codex"` を強制するため、壊れた Codex
  ハーネスが OpenClaw に静かにフォールバックして通過することはできない。
- 認証: ローカル Codex サブスクリプションログインからの Codex app-server 認証。Docker
  スモークでは、該当する場合に Codex 以外のプローブ用に `OPENAI_API_KEY` も提供でき、
  任意でコピーされた `~/.codex/auth.json` と `~/.codex/config.toml` も使用できる。

ローカルレシピ:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-codex-harness
```

Docker 注記:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にある。
- `OPENAI_API_KEY` を渡し、存在する場合は Codex CLI 認証ファイルをコピーし、
  `@openai/codex` を書き込み可能なマウント済み npm
  プレフィックスにインストールし、ソースツリーをステージングしてから、Codex ハーネスのライブテストのみを実行する。
- Docker はデフォルトで画像、MCP/ツール、Guardian プローブを有効にする。より狭いデバッグ
  実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定する。
- Docker は同じ明示的な Codex ランタイム設定を使用するため、レガシーエイリアスや OpenClaw
  フォールバックが Codex ハーネスの回帰を隠すことはできない。

### 推奨ライブレシピ

狭く明示的な allowlist が最速で、最も不安定さが少ない:

- 単一モデル、直接（gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型モデル直接プロファイル:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型モデル gateway プロファイル:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API スモーク:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 単一モデル、gateway スモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがるツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 直接スモーク:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google フォーカス（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking スモーク:
  - Gemini 3 動的デフォルト: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動的予算: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注記:

- `google/...` は Gemini API（API キー）を使用する。
- `google-antigravity/...` は Antigravity OAuth ブリッジ（Cloud Code Assist スタイルのエージェントエンドポイント）を使用する。
- `google-gemini-cli/...` はマシン上のローカル Gemini CLI を使用する（別の認証 + ツール面の癖）。
- Gemini API と Gemini CLI:
  - API: OpenClaw は HTTP 経由で Google のホスト型 Gemini API を呼び出す（API キー / プロファイル認証）。これは多くのユーザーが「Gemini」と呼ぶもの。
  - CLI: OpenClaw はローカルの `gemini` バイナリを shell 実行する。独自の認証があり、挙動が異なる場合がある（streaming/tool サポート/バージョンのずれ）。

## ライブ: モデルマトリクス（カバー範囲）

固定の「CI モデルリスト」はない（ライブはオプトイン）が、キーを持つ開発マシンで定期的にカバーすることを**推奨**するモデルは次のとおり。

### モダンスモークセット（ツール呼び出し + 画像）

これは、動作を維持することを期待する「一般的なモデル」の実行:

- OpenAI（非 Codex）: `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro`
- Z.AI（GLM）: `zai/glm-5.1`（汎用 API）または `zai/glm-5.2`（Coding Plan）
- MiniMax: `minimax/MiniMax-M3`

ツール + 画像付きで gateway スモークを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: ツール呼び出し（Read + 任意の Exec）

provider ファミリーごとに少なくとも 1 つ選ぶ:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI（GLM）: `zai/glm-5.1`（汎用 API）または `zai/glm-5.2`（Coding Plan）
- MiniMax: `minimax/MiniMax-M3`

任意の追加カバレッジ（あるとよい）:

- xAI: `xai/grok-4.3`（または利用可能な最新）
- Mistral: `mistral/`…（有効化済みの「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセス権がある場合）
- LM Studio: `lmstudio/`…（ローカル。ツール呼び出しは API モードに依存）

### Vision: 画像送信（添付 → マルチモーダルメッセージ）

画像プローブを実行するために、`OPENCLAW_LIVE_GATEWAY_MODELS` に画像対応モデル（Claude/Gemini/OpenAI の vision 対応バリアントなど）を少なくとも 1 つ含める。

### アグリゲーター / 代替 gateway

キーが有効であれば、次経由のテストもサポートしている:

- OpenRouter: `openrouter/...`（数百のモデル。ツール+画像対応候補を見つけるには `openclaw models scan` を使用）
- OpenCode: Zen には `opencode/...`、Go には `opencode-go/...`（`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 経由で認証）

ライブマトリクスに含められる追加プロバイダー（認証情報/設定がある場合）:

- 組み込み: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（クラウド/API）、および任意の OpenAI/Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

<Tip>
ドキュメントで「すべてのモデル」をハードコードしないでください。信頼できる一覧は、自分のマシンで `discoverModels(...)` が返す内容と、利用可能なキーです。
</Tip>

## 認証情報（絶対にコミットしない）

ライブテストは、CLI と同じ方法で認証情報を検出します。実用上の意味は次のとおりです。

- CLI が動作するなら、ライブテストも同じキーを見つけるはずです。
- ライブテストが「認証情報なし」と表示する場合は、`openclaw models list` / モデル選択をデバッグするのと同じ方法でデバッグしてください。

- エージェントごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（ライブテストでいう「プロファイルキー」はこれを意味します）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー状態ディレクトリ: `~/.openclaw/credentials/`（存在する場合はステージングされたライブホームへコピーされますが、メインのプロファイルキーストアではありません）
- ライブのローカル実行では、既定でアクティブな設定、エージェントごとの `auth-profiles.json` ファイル、レガシー `credentials/`、およびサポート対象の外部 CLI 認証ディレクトリを一時テストホームへコピーします。ステージングされたライブホームは `workspace/` と `sandboxes/` をスキップし、`agents.*.workspace` / `agentDir` パスの上書きは削除されるため、プローブは実ホストのワークスペースに触れません。

環境変数キーに依存したい場合は、ローカルテストの前にエクスポートするか、
明示的な `OPENCLAW_PROFILE_FILE` を指定して下記の Docker ランナーを使用してください。

## Deepgram ライブ（音声文字起こし）

- テスト: `extensions/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus コーディング計画ライブ

- テスト: `extensions/byteplus/live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI ワークフローメディアライブ

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 範囲:
  - バンドルされた comfy の画像、動画、`music_generate` パスを実行します
  - `plugins.entries.comfy.config.<capability>` が設定されていない限り、各ケイパビリティをスキップします
  - comfy ワークフロー送信、ポーリング、ダウンロード、Plugin 登録を変更した後に有用です

## 画像生成ライブ

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- 範囲:
  - 登録済みのすべての画像生成プロバイダーPluginを列挙します
  - プローブの前に、すでにエクスポート済みのプロバイダー環境変数を使用します
  - 既定では保存済み認証プロファイルよりライブ/環境変数 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 設定済みの各プロバイダーを共有画像生成ランタイム経由で実行します:
    - `<provider>:generate`
    - プロバイダーが編集サポートを宣言している場合は `<provider>:edit`
- 対象となる現在のバンドルプロバイダー:
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視します

出荷済み CLI パスでは、プロバイダー/ランタイムのライブテストが通った後に
`infer` スモークを追加します。

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

これは CLI 引数解析、設定/既定エージェントの解決、バンドル
Plugin の有効化、共有画像生成ランタイム、ライブプロバイダー
リクエストをカバーします。Plugin 依存関係はランタイム読み込み前に存在していることが期待されます。

## 音楽生成ライブ

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- 範囲:
  - 共有のバンドル音楽生成プロバイダーパスを実行します
  - 現在は Google と MiniMax を対象にしています
  - プローブの前に、すでにエクスポート済みのプロバイダー環境変数を使用します
  - 既定では保存済み認証プロファイルよりライブ/環境変数 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 利用可能な場合は宣言済みの両方のランタイムモードを実行します:
    - プロンプトのみの入力で `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合は `edit`
  - 現在の共有レーンのカバレッジ:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: この共有スイープではなく、別の Comfy ライブファイル
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視します

## 動画生成ライブ

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- 範囲:
  - 共有のバンドル動画生成プロバイダーパスを実行します
  - 既定ではリリースに安全なスモークパスを使用します: FAL 以外のプロバイダー、プロバイダーごとに 1 つのテキストから動画へのリクエスト、1 秒のロブスタープロンプト、および `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（既定は `180000`）からのプロバイダーごとの操作上限
  - プロバイダー側のキュー待ち時間がリリース時間を支配する可能性があるため、既定では FAL をスキップします。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - プローブの前に、すでにエクスポート済みのプロバイダー環境変数を使用します
  - 既定では保存済み認証プロファイルよりライブ/環境変数 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 既定では `generate` のみを実行します
  - 利用可能な場合に宣言済みの変換モードも実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有スイープでバッファーベースのローカル画像入力を受け付ける場合は `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有スイープでバッファーベースのローカル動画入力を受け付ける場合は `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - `vydra`: バンドルされた `veo3` はテキストのみで、バンドルされた `kling` はリモート画像 URL を必要とするため
  - プロバイダー固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` のテキストから動画に加え、既定でリモート画像 URL フィクスチャを使用する `kling` レーンを実行します
  - 現在の `videoToVideo` ライブカバレッジ:
    - 選択されたモデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`, `qwen`, `xai`: これらのパスは現在リモート `http(s)` / MP4 参照 URL を必要とするため
    - `google`: 現在の共有 Gemini/Veo レーンはローカルのバッファーベース入力を使用しており、そのパスは共有スイープでは受け付けられないため
    - `openai`: 現在の共有レーンには組織固有の動画編集アクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL を含むすべてのプロバイダーを既定スイープに含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 積極的なスモーク実行のために、各プロバイダー操作上限を短縮するには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視します

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の画像、音楽、動画ライブスイートを、1 つのリポジトリネイティブなエントリーポイント経由で実行します
  - すでにエクスポート済みのプロバイダー環境変数を使用します
  - 既定では、現在使用可能な認証を持つプロバイダーに各スイートを自動的に絞り込みます
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と quiet-mode の動作は一貫したままです
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [テスト](/ja-JP/help/testing) - ユニット、統合、QA、Docker スイート
