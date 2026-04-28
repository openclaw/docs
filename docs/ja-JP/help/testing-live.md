---
read_when:
    - ライブ model マトリクス / CLI バックエンド / ACP / メディア provider のスモークを実行すること
    - ライブテストの認証情報解決をデバッグすること
    - 新しい provider 固有のライブテストを追加すること
sidebarTitle: Live tests
summary: 'Live（ネットワークに接触する）テスト: model マトリクス、CLI バックエンド、ACP、メディア provider、認証情報'
title: 'テスト: ライブスイート'
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:32:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 669d68dc80d0bf86942635c792f64f1edc7a23684c880cb66799401dee3d127f
    source_path: help/testing-live.md
    workflow: 15
---

クイックスタート、QA ランナー、unit/integration スイート、Docker フローについては
[Testing](/ja-JP/help/testing) を参照してください。このページでは **live**（ネットワークに接触する）テスト
スイートを扱います。model マトリクス、CLI バックエンド、ACP、media-provider のライブテスト、および
認証情報の取り扱いです。

## Live: ローカル profile スモークコマンド

アドホックなライブチェックの前に `~/.profile` を source して、provider キーとローカルツール
パスがシェルと一致するようにしてください。

```bash
source ~/.profile
```

安全な media スモーク:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全な voicecall readiness スモーク:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` は `--yes` も指定しない限り dry run です。実際に通知コールを発信したいときにのみ
`--yes` を使ってください。Twilio、Telnyx、Plivo では、
readiness チェックを成功させるには公開 Webhook URL が必要です。ローカル専用の
loopback/private フォールバックは設計上拒否されます。

## Live: Android Node capability sweep

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続された Android Node が現在広告している **すべてのコマンド** を呼び出し、コマンド契約の動作を検証する。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/実行/ペアリングは行いません）。
  - 選択された Android Node に対する、コマンドごとの Gateway `node.invoke` 検証。
- 必要な事前セットアップ:
  - Android アプリがすでに Gateway に接続 + ペアリング済みであること。
  - アプリがフォアグラウンドに保たれていること。
  - 成功を期待する capability に対して permissions/capture consent が付与されていること。
- 任意の対象オーバーライド:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android セットアップの詳細: [Android App](/ja-JP/platforms/android)

## Live: model スモーク（profile キー）

ライブテストは、障害を切り分けられるよう 2 層に分かれています。

- 「Direct model」は、与えられたキーで provider/model がそもそも応答できるかを示します。
- 「Gateway smoke」は、その model で完全な Gateway+agent パイプラインが動作するか（sessions、history、tools、sandbox policy など）を示します。

### レイヤー 1: Direct model completion（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って認証情報を持つモデルを選ぶ
  - モデルごとに小さな completion を実行する（必要に応じて対象を絞ったリグレッションも）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接起動する場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`。modern の別名）を設定します。そうしないと、`pnpm test:live` を Gateway smoke に集中させるためスキップされます
- モデルの選択方法:
  - modern allowlist を実行するには `OPENCLAW_LIVE_MODELS=modern`（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` は modern allowlist の別名
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."`（カンマ区切りの allowlist）
  - modern/all sweep はデフォルトで厳選された高シグナル上限を使用します。網羅的な modern sweep には `OPENCLAW_LIVE_MAX_MODELS=0` を、小さめの上限には正の数を設定してください。
  - 網羅的 sweep は direct-model テスト全体のタイムアウトに `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使います。デフォルトは 60 分です。
  - direct-model プローブはデフォルトで 20 並列で実行されます。上書きするには `OPENCLAW_LIVE_MODEL_CONCURRENCY` を設定してください。
- provider の選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りの allowlist）
- キーの取得元:
  - デフォルト: profile store と env フォールバック
  - **profile store** のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定します
- このテストの存在理由:
  - 「provider API が壊れている / キーが無効」と「Gateway agent パイプラインが壊れている」を切り分けるため
  - 小さく孤立したリグレッションを含めるため（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + dev agent スモーク（`@openclaw` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - インプロセス Gateway を起動する
  - `agent:dev:*` セッションを作成/patch する（実行ごとの model オーバーライド）
  - キー付きモデルを反復し、次を検証する:
    - 「意味のある」レスポンス（tools なし）
    - 実際のツール呼び出しが動作する（read probe）
    - 任意の追加ツールプローブ（exec+read probe）
    - OpenAI のリグレッション経路（tool-call-only → follow-up）が引き続き動作する
- プローブ詳細（障害をすばやく説明できるように）:
  - `read` probe: テストが workspace に nonce ファイルを書き込み、agent にそれを `read` して nonce を返すよう求めます。
  - `exec+read` probe: テストが agent に `exec` で一時ファイルへ nonce を書かせ、その後 `read` で読み返させます。
  - image probe: テストが生成した PNG（猫 + ランダムコード）を添付し、model が `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` および `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接起動する場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: modern allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern allowlist の別名
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定して絞り込む
  - modern/all の Gateway sweep はデフォルトで厳選された高シグナル上限を使います。網羅的な modern sweep には `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を、小さめの上限には正の数を設定してください。
- provider の選択方法（「OpenRouter ですべて」になるのを避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りの allowlist）
- tool + image プローブはこのライブテストでは常に有効です:
  - `read` probe + `exec+read` probe（ツールストレス）
  - model が image input support を広告している場合は image probe を実行
  - フロー（高レベル）:
    - テストが「CAT」+ ランダムコードを含む小さな PNG を生成します（`src/gateway/live-image-probe.ts`）
    - `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信します
    - Gateway が attachments を `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 組み込み agent が multimodal user message を model に渡します
    - 検証: 返信に `cat` + そのコードが含まれていること（OCR 許容: 軽微な誤りは許可）

ヒント: 自分のマシンで何をテストできるか（および正確な `provider/model` id）を見るには、次を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI バックエンドスモーク（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト config に触れずに、ローカル CLI バックエンドを使って Gateway + agent パイプラインを検証する。
- バックエンド固有のスモークデフォルトは、その所有 extension の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接起動する場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルト provider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image 動作は、所有 CLI バックエンド Plugin の metadata から取得されます。
- オーバーライド（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送るには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。Docker レシピでは、明示的に要求されない限りこれはデフォルトでオフです。
  - 画像ファイルパスをプロンプト注入ではなく CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG` が設定されているとき、画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）
  - 2 ターン目を送信して resume フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - 選択された model が switch target をサポートしている場合、同一セッション継続性の Claude Sonnet -> Opus プローブを有効にするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`。Docker レシピでは、全体の信頼性のためデフォルトでオフです。
  - MCP/tool loopback プローブを有効にするには `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`。Docker レシピでは、明示的に要求されない限りデフォルトでオフです。

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

安価な Gemini MCP config スモーク:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

これは Gemini にレスポンス生成を求めません。OpenClaw が Gemini に与えるのと同じ system
settings を書き込み、その後 `gemini --debug mcp list` を実行して、
保存済みの `transport: "streamable-http"` サーバーが Gemini の HTTP MCP
形式に正規化され、ローカルの streamable-HTTP MCP サーバーに接続できることを証明します。

Docker レシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一 provider の Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注記:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これはリポジトリ Docker image 内で、非 root の `node` ユーザーとして live CLI-backend スモークを実行します。
- 所有 extension から CLI スモーク metadata を解決し、その後、一致する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、キャッシュ可能で書き込み可能な prefix `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）にインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` では、`~/.claude/.credentials.json` 内の `claudeAiOauth.subscriptionType` または `claude setup-token` の `CLAUDE_CODE_OAUTH_TOKEN` のいずれかを通じた、移植可能な Claude Code subscription OAuth が必要です。まず Docker 内での直接 `claude -p` を証明し、その後 Anthropic API-key env var を保持せずに 2 回の Gateway CLI-backend ターンを実行します。この subscription レーンでは、Claude が現在サードパーティアプリ利用を通常の subscription プラン上限ではなく extra-usage billing 経由でルーティングするため、Claude MCP/tool と image プローブはデフォルトで無効です。
- live CLI-backend スモークは現在、Claude、Codex、Gemini に対して同じ end-to-end フローを実行します: テキストターン、画像分類ターン、その後 Gateway CLI を通じて検証される MCP `cron` ツール呼び出しです。
- Claude のデフォルトスモークでは、セッションを Sonnet から Opus に patch し、再開後のセッションが以前のメモをまだ覚えていることも検証します。

## Live: ACP bind スモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: ライブ ACP agent を使って、実際の ACP conversation-bind フローを検証する:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成した message-channel conversation をその場で bind する
  - 同じ conversation 上で通常の follow-up を送信する
  - その follow-up が bind 済み ACP セッション transcript に到達することを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP agents: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP agent: `claude`
  - 合成チャネル: Slack DM 風の conversation context
  - ACP バックエンド: `acpx`
- オーバーライド:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- 注記:
  - このレーンは、admin 専用の合成 originating-route フィールドを持つ Gateway `chat.send` サーフェスを使うため、外部配信を装わずにテストで message-channel context を付与できます。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP harness agent に対して、埋め込み `acpx` Plugin の組み込み agent registry を使用します。

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

単一 agent の Docker レシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker に関する注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、集約された live CLI agents に対して ACP bind スモークを順番に実行します: `claude`、`codex`、次に `gemini`。
- マトリクスを絞るには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使ってください。
- これは `~/.profile` を source し、一致する CLI 認証マテリアルをコンテナに配置し、その後必要であれば要求された live CLI（`@anthropic-ai/claude-code`、`@openai/codex`、`https://app.factory.ai/cli` 経由の Factory Droid、`@google/gemini-cli`、または `opencode-ai`）をインストールします。ACP バックエンド自体は `acpx` Plugin に含まれるバンドル済み埋め込み `acpx/runtime` パッケージです。
- Droid の Docker バリアントは、設定用に `~/.factory` を配置し、`FACTORY_API_KEY` を転送し、その API キーを必須とします。ローカルの Factory OAuth/keyring 認証はコンテナに移植できないためです。これは ACPX 組み込みの `droid exec --output-format acp` registry エントリを使用します。
- OpenCode の Docker バリアントは厳格な単一 agent のリグレッションレーンです。`~/.profile` を source した後、`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（デフォルト `opencode/kimi-k2.6`）から一時的な `OPENCODE_CONFIG_CONTENT` デフォルト model を書き込み、`pnpm test:docker:live-acp-bind:opencode` では、汎用 post-bind skip を受け入れる代わりに bind された assistant transcript を要求します。
- 直接の `acpx` CLI 呼び出しは、Gateway の外で動作を比較するための手動/回避用経路にすぎません。Docker ACP bind スモークは OpenClaw の埋め込み `acpx` ランタイムバックエンドを検証します。

## Live: Codex app-server harness スモーク

- 目的: 通常の Gateway
  `agent` メソッドを通じて Plugin 所有の Codex harness を検証する:
  - バンドル済みの `codex` Plugin を読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - Codex harness を強制した状態で `openai/gpt-5.2` に最初の Gateway agent ターンを送る
  - 同じ OpenClaw セッションに 2 回目のターンを送り、app-server
    thread が再開できることを検証する
  - 同じ Gateway コマンド
    経路を通して `/codex status` と `/codex models` を実行する
  - 任意で、Guardian 審査済みの 2 つの権限昇格 shell プローブを実行する: 承認されるべき無害な
    コマンド 1 つと、agent が聞き返すべき拒否される偽のシークレットアップロード 1 つ
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルト model: `openai/gpt-5.2`
- 任意の image プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/tool プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークでは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れた Codex
  harness が黙って PI にフォールバックして通過することはありません。
- 認証: ローカルの Codex subscription ログインから得られる Codex app-server 認証。
  Docker スモークでは、該当する場合に非 Codex プローブ用の `OPENAI_API_KEY` も提供でき、
  さらに任意でコピーした `~/.codex/auth.json` と `~/.codex/config.toml` も使えます。

ローカルレシピ:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker レシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker に関する注記:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- これはマウントされた `~/.profile` を source し、`OPENAI_API_KEY` を渡し、
  もしあれば Codex CLI 認証ファイルをコピーし、`@openai/codex` を書き込み可能なマウント済み npm
  prefix にインストールし、ソースツリーを配置した後、Codex-harness ライブテストだけを実行します。
- Docker では image、MCP/tool、Guardian プローブがデフォルトで有効です。より狭いデバッグ実行が必要な場合は
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`、または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定してください。
- Docker でも `OPENCLAW_AGENT_HARNESS_FALLBACK=none` をエクスポートします。これはライブ
  テスト設定と一致し、レガシー alias や PI フォールバックが Codex harness
  リグレッションを隠せないようにします。

### 推奨ライブレシピ

狭く明示的な allowlist が最も速く、最も不安定になりにくいです。

- 単一 model、direct（Gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一 model、Gateway スモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数 provider にわたるツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 重視（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking スモーク:
  - ローカルキーがシェル profile にある場合: `source ~/.profile`
  - Gemini 3 dynamic default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注記:

- `google/...` は Gemini API（API キー）を使います。
- `google-antigravity/...` は Antigravity OAuth bridge（Cloud Code Assist 風の agent endpoint）を使います。
- `google-gemini-cli/...` はマシン上のローカル Gemini CLI を使います（認証もツールの癖も別です）。
- Gemini API と Gemini CLI の違い:
  - API: OpenClaw は Google のホスト型 Gemini API を HTTP で呼び出します（API キー / profile 認証）。多くのユーザーが「Gemini」と言うときはこれを指します。
  - CLI: OpenClaw はローカルの `gemini` バイナリを shell 実行します。独自の認証を持ち、動作も異なることがあります（streaming/tool support/version skew）。

## Live: model マトリクス（何をカバーするか）

固定の「CI model list」はありません（live はオプトイン）が、キーを持つ開発マシンで定期的にカバーすべき **推奨** model は次です。

### Modern スモークセット（ツール呼び出し + 画像）

これは「共通モデル」の実行として動作し続けることを期待しているセットです。

- OpenAI（非 Codex）: `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x model は避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

tools + image 付きで Gateway スモークを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: ツール呼び出し（Read + 任意の Exec）

provider ファミリーごとに少なくとも 1 つは選んでください。

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あるとよいもの）:

- xAI: `xai/grok-4`（または利用可能な最新）
- Mistral: `mistral/`…（有効化済みの「tools」対応 model を 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセスがある場合）
- LM Studio: `lmstudio/`…（ローカル。ツール呼び出しは API モード依存）

### Vision: 画像送信（添付 → multimodal message）

image probe を実行するため、少なくとも 1 つの image-capable model（Claude/Gemini/OpenAI の vision 対応バリアントなど）を `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください。

### アグリゲーター / 代替 Gateway

キーを有効化していれば、次経由のテストもサポートしています。

- OpenRouter: `openrouter/...`（数百の model。tool+image 対応候補を探すには `openclaw models scan` を使ってください）
- OpenCode: Zen 用に `opencode/...`、Go 用に `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

ライブマトリクスに含められる他の provider（認証情報/config がある場合）:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（cloud/API）、および任意の OpenAI/Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

ヒント: ドキュメントに「すべての model」をハードコードしようとしないでください。信頼できる一覧は、そのマシン上で `discoverModels(...)` が返すものと、利用可能なキーです。

## 認証情報（絶対にコミットしない）

ライブテストは CLI と同じ方法で認証情報を検出します。実際上の意味は次のとおりです。

- CLI が動くなら、ライブテストも同じキーを見つけられるはずです。
- ライブテストが「認証情報なし」と言う場合は、`openclaw models list` / model 選択のデバッグと同じ方法で調べてください。

- agent ごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（ライブテストでいう「profile keys」はこれを意味します）
- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー状態ディレクトリ: `~/.openclaw/credentials/`（存在する場合は staged live home にコピーされますが、メインの profile-key store ではありません）
- Live のローカル実行では、デフォルトで active config、agent ごとの `auth-profiles.json` ファイル、レガシー `credentials/`、対応する外部 CLI 認証ディレクトリを一時テスト home にコピーします。staged live home では `workspace/` と `sandboxes/` はスキップされ、`agents.*.workspace` / `agentDir` のパスオーバーライドは削除されるため、プローブが実際のホスト workspace に触れません。

env キー（たとえば `~/.profile` に export 済みのもの）に依存したい場合は、`source ~/.profile` の後にローカルテストを実行するか、以下の Docker ランナーを使ってください（`~/.profile` をコンテナにマウントできます）。

## Deepgram live（音声文字起こし）

- テスト: `extensions/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- テスト: `extensions/byteplus/live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 任意の model オーバーライド: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- スコープ:
  - バンドル済み comfy の画像、動画、`music_generate` 経路を検証
  - `plugins.entries.comfy.config.<capability>` が設定されていない capability はそれぞれスキップ
  - comfy workflow の送信、ポーリング、ダウンロード、または Plugin 登録を変更した後に有用

## 画像生成 live

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- スコープ:
  - 登録されているすべての画像生成 provider Plugin を列挙
  - プローブ前に、欠けている provider env var をログインシェル（`~/.profile`）から読み込む
  - デフォルトでは、保存済み auth profile より live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な認証/profile/model がない provider はスキップ
  - 各設定済み provider を共有画像生成ランタイム経由で実行:
    - `<provider>:generate`
    - provider が edit support を宣言している場合は `<provider>:edit`
- 現在カバーされているバンドル済み provider:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で profile-store 認証を強制し、env-only オーバーライドを無視

出荷されている CLI 経路については、provider/runtime の live
テストが通った後に `infer` スモークを追加してください。

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

これにより、CLI 引数解析、config/default-agent 解決、バンドル済み
Plugin 有効化、オンデマンドのバンドル済みランタイム依存関係修復、共有
画像生成ランタイム、および live provider リクエストがカバーされます。

## 音楽生成 live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- スコープ:
  - 共有のバンドル済み音楽生成 provider 経路を検証
  - 現在は Google と MiniMax をカバー
  - プローブ前に provider env var をログインシェル（`~/.profile`）から読み込む
  - デフォルトでは、保存済み auth profile より live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な認証/profile/model がない provider はスキップ
  - 利用可能な場合は、宣言された両方のランタイムモードを実行:
    - プロンプトのみ入力の `generate`
    - provider が `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンのカバレッジ:
    - `google`: `generate`、`edit`
    - `minimax`: `generate`
    - `comfy`: この共有 sweep ではなく、別の Comfy live ファイル
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で profile-store 認証を強制し、env-only オーバーライドを無視

## 動画生成 live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- スコープ:
  - 共有のバンドル済み動画生成 provider 経路を検証
  - デフォルトでは release-safe なスモーク経路を使います: FAL 以外の provider、provider ごとに 1 件の text-to-video リクエスト、1 秒の lobster prompt、および `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（デフォルト `180000`）による provider ごとの操作上限
  - FAL は provider 側キュー待ち時間が release 時間を大きく支配する可能性があるため、デフォルトではスキップされます。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を指定してください
  - プローブ前に provider env var をログインシェル（`~/.profile`）から読み込む
  - デフォルトでは、保存済み auth profile より live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な認証/profile/model がない provider はスキップ
  - デフォルトでは `generate` のみ実行
  - 利用可能な場合に宣言済み transform モードも実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定:
    - provider が `capabilities.imageToVideo.enabled` を宣言し、選択された provider/model が共有 sweep でバッファベースのローカル画像入力を受け付ける場合は `imageToVideo`
    - provider が `capabilities.videoToVideo.enabled` を宣言し、選択された provider/model が共有 sweep でバッファベースのローカル動画入力を受け付ける場合は `videoToVideo`
  - 現在、共有 sweep で宣言済みだがスキップされる `imageToVideo` provider:
    - `vydra`。バンドル済み `veo3` はテキスト専用で、バンドル済み `kling` はリモート画像 URL を必要とするため
  - provider 固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` の text-to-video と、デフォルトでリモート画像 URL fixture を使う `kling` レーンを実行します
  - 現在の `videoToVideo` live カバレッジ:
    - 選択された model が `runway/gen4_aleph` の場合のみ `runway`
  - 現在、共有 sweep で宣言済みだがスキップされる `videoToVideo` provider:
    - `alibaba`、`qwen`、`xai`。これらの経路は現在リモートの `http(s)` / MP4 参照 URL を必要とするため
    - `google`。現在の共有 Gemini/Veo レーンはローカルのバッファベース入力を使っており、その経路は共有 sweep では受け付けられないため
    - `openai`。現在の共有レーンでは org 固有の video inpaint/remix アクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルト sweep に FAL を含めたすべての provider を含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - より攻撃的なスモーク実行として provider ごとの操作上限を減らすには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で profile-store 認証を強制し、env-only オーバーライドを無視

## Media live ハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の image、music、video live スイートを 1 つのリポジトリネイティブ entrypoint で実行する
  - 欠けている provider env var を `~/.profile` から自動で読み込む
  - デフォルトで、現在使用可能な認証を持つ provider に各スイートを自動で絞り込む
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と quiet-mode の動作が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [Testing](/ja-JP/help/testing) — unit、integration、QA、Docker スイート
