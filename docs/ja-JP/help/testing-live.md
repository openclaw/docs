---
read_when:
    - Live モデルマトリクス / CLI バックエンド / ACP / メディアプロバイダーのスモークを実行する場合
    - Live テストの認証情報解決をデバッグする場合
    - 新しいプロバイダー固有の Live テストを追加する場合
sidebarTitle: Live tests
summary: 'Live（ネットワークに触れる）テスト: モデルマトリクス、CLI バックエンド、ACP、メディアプロバイダー、認証情報'
title: 'テスト: Live スイート'
x-i18n:
    generated_at: "2026-04-24T05:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: db73b9ad5c15569f5772a91d0d2532923015bf98a21da9c833c59a9cfa5cec4e
    source_path: help/testing-live.md
    workflow: 15
---

クイックスタート、QA ランナー、unit/integration スイート、Docker フローについては
[Testing](/ja-JP/help/testing) を参照してください。このページでは **live**（ネットワークに触れる）テスト
スイート、つまりモデルマトリクス、CLI バックエンド、ACP、メディアプロバイダーの live テスト、および
認証情報処理を扱います。

## Live: Android Node 機能スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続された Android Node が現在広告している **すべてのコマンド** を呼び出し、コマンド契約の動作を検証すること。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/実行/ペアリングを行いません）。
  - 選択された Android Node に対する、コマンドごとの gateway `node.invoke` 検証。
- 必要な事前セットアップ:
  - Android アプリがすでに gateway に接続され、ペアリングされていること。
  - アプリをフォアグラウンドに保つこと。
  - 通過を期待する機能に対して、権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細: [Android App](/ja-JP/platforms/android)

## Live: モデルスモーク（プロファイルキー）

Live テストは、失敗を切り分けられるよう 2 層に分かれています。

- 「Direct model」は、そのキーで provider/model がそもそも応答できるかを教えてくれます。
- 「Gateway smoke」は、そのモデルに対して gateway+agent の完全なパイプライン（sessions、history、tools、sandbox policy など）が動くかを教えてくれます。

### レイヤー 1: Direct model completion（gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って、認証情報があるモデルを選択する
  - モデルごとに小さな completion を実行する（必要に応じて対象回帰も）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または modern の別名である `all`）を設定してください。そうしないと、`pnpm test:live` を gateway smoke に集中させるためスキップされます
- モデルの選択方法:
  - modern allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）を実行するには `OPENCLAW_LIVE_MODELS=modern`
  - `OPENCLAW_LIVE_MODELS=all` は modern allowlist の別名
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."`（カンマ区切り allowlist）
  - modern/all スイープは、デフォルトでは高シグナルに厳選した上限を使います。網羅的な modern スイープには `OPENCLAW_LIVE_MAX_MODELS=0`、より小さい上限には正の数を設定します。
  - 網羅的スイープでは、direct-model テスト全体のタイムアウトに `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使います。デフォルト: 60 分。
  - direct-model probe を並列実行するには `OPENCLAW_LIVE_MODEL_CONCURRENCY=10` を設定します。デフォルト: 1。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り allowlist）
- キーの取得元:
  - デフォルト: profile store と env fallback
  - **profile store のみ** を強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定
- これが存在する理由:
  - 「provider API が壊れている / キーが無効」と「gateway agent pipeline が壊れている」を分離するため
  - 小さく独立した回帰を含めるため（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + dev agent smoke（`@openclaw` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内 gateway を起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとの model override）
  - キー付きモデルを反復し、以下を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが動作する（read probe）
    - 任意の追加ツール probe（exec+read probe）
    - OpenAI 回帰経路（tool-call-only → follow-up）が引き続き動作する
- Probe の詳細（失敗をすばやく説明できるように）:
  - `read` probe: テストはワークスペースに nonce ファイルを書き、エージェントにそれを `read` して nonce を返すよう求めます。
  - `exec+read` probe: テストはエージェントに `exec` で nonce を temp ファイルに書かせ、その後 `read` で読み戻させます。
  - image probe: テストは生成した PNG（cat + ランダムコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: modern allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern allowlist の別名
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）で絞り込み
  - modern/all gateway スイープは、デフォルトでは高シグナルに厳選した上限を使います。網羅的な modern スイープには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`、より小さい上限には正の数を設定します。
- プロバイダーの選択方法（「OpenRouter ですべて」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り allowlist）
- ツール + image probe は、この live テストでは常に有効です:
  - `read` probe + `exec+read` probe（ツール負荷）
  - image probe は、モデルが画像入力サポートを広告している場合に実行されます
  - フロー（高レベル）:
    - テストは「CAT」+ ランダムコードの小さな PNG を生成します（`src/gateway/live-image-probe.ts`）
    - それを `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信します
    - Gateway は attachments を `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 埋め込みエージェントはマルチモーダルなユーザーメッセージをモデルへ転送します
    - 検証: 返信に `cat` + そのコードが含まれること（OCR 許容: 軽微な誤りは許可）

ヒント: 自分のマシンで何をテストできるか（および正確な `provider/model` ID）を見るには、次を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI バックエンドスモーク（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト config には触れずに、ローカル CLI バックエンドを使って Gateway + agent パイプラインを検証すること。
- バックエンド固有のスモークデフォルトは、所有する extension の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルト provider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image の挙動は、所有する CLI バックエンド Plugin のメタデータから取得します。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送るには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）
  - 画像ファイルパスをプロンプト注入ではなく CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）で、`IMAGE_ARG` 設定時の画像引数の渡し方を制御
  - 2 回目のターンを送り、resume フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - デフォルトの Claude Sonnet -> Opus 同一セッション継続性 probe を無効化するには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択モデルが切り替え先をサポートしている場合に強制オンするには `1`）

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダー Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これは、repo Docker イメージ内で非 root の `node` ユーザーとして live CLI-backend smoke を実行します。
- 所有する extension から CLI smoke メタデータを解決し、その後、一致する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）にあるキャッシュされた書き込み可能 prefix にインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`~/.claude/.credentials.json` の `claudeAiOauth.subscriptionType` または `claude setup-token` からの `CLAUDE_CODE_OAUTH_TOKEN` を通じた portable Claude Code subscription OAuth が必要です。まず Docker 内で直接 `claude -p` を証明し、その後 Anthropic API-key env var を保持せずに 2 回の Gateway CLI-backend ターンを実行します。この subscription レーンでは、Claude が現在、サードパーティアプリ使用を通常の subscription plan 制限ではなく追加使用量課金へルーティングするため、Claude MCP/tool および image probe はデフォルトで無効になります。
- live CLI-backend smoke は、現在 Claude、Codex、Gemini に対して同じ end-to-end フローを実行します: テキストターン、画像分類ターン、その後 gateway CLI を通して検証される MCP `cron` ツール呼び出し。
- Claude のデフォルトスモークでは、Sonnet から Opus へセッションをパッチし、再開されたセッションが以前のメモを引き続き覚えていることも検証します。

## Live: ACP bind スモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: 実際の ACP エージェントを使って、実際の ACP conversation-bind フローを検証すること:
  - `/acp spawn <agent> --bind here` を送る
  - 合成 message-channel conversation をその場で bind する
  - 同じ conversation で通常の follow-up を送る
  - その follow-up が bind された ACP セッション transcript に入ることを確認する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP エージェント: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP エージェント: `claude`
  - 合成チャンネル: Slack DM スタイルの conversation context
  - ACP バックエンド: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- 注:
  - このレーンは、admin 専用の synthetic originating-route フィールド付きで gateway `chat.send` サーフェスを使うため、外部配送を装うことなく、テストが message-channel context を付与できます。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP harness agent に対して、埋め込み `acpx` Plugin の組み込み agent registry を使います。

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
pnpm test:docker:live-acp-bind:gemini
```

Docker 注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、サポートされているすべての live CLI エージェントに対して ACP bind smoke を順番に実行します: `claude`、`codex`、その後 `gemini`。
- マトリクスを絞るには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` を使います。
- これは `~/.profile` を読み込み、一致する CLI 認証情報をコンテナへステージし、書き込み可能 npm prefix に `acpx` をインストールし、その後要求された live CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）がなければインストールします。
- Docker 内では、ランナーは `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定するため、acpx は読み込まれた profile の provider env var を子 harness CLI でも利用可能に保ちます。

## Live: Codex app-server harness スモーク

- 目的: 通常の gateway
  `agent` メソッドを通して Plugin 所有の Codex harness を検証すること:
  - バンドル済み `codex` Plugin をロードする
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - Codex harness を強制した状態で、`openai/gpt-5.2` への最初の gateway agent turn を送る
  - 同じ OpenClaw セッションに 2 回目のターンを送り、app-server
    thread が resume できることを確認する
  - 同じ gateway command
    path を通して `/codex status` と `/codex models` を実行する
  - 任意で、Guardian にレビューされた 2 つの escalated shell probe を実行する: 1 つは承認されるべき無害な
    コマンド、もう 1 つはエージェントが差し戻すべき偽のシークレットアップロード
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `openai/gpt-5.2`
- 任意の image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れた Codex
  harness が PI へ黙ってフォールバックして通過することはできません。
- 認証: ローカルの Codex subscription login からの Codex app-server 認証。Docker
  スモークでは、該当する非 Codex probe 用に `OPENAI_API_KEY` も提供できます。
  さらに任意で `~/.codex/auth.json` と `~/.codex/config.toml` をコピーできます。

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

Docker 注記:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- これはマウントされた `~/.profile` を読み込み、`OPENAI_API_KEY` を渡し、存在すれば Codex CLI
  認証ファイルをコピーし、書き込み可能なマウント済み npm
  prefix に `@openai/codex` をインストールし、ソースツリーをステージしてから、Codex-harness live test のみを実行します。
- Docker では image、MCP/tool、Guardian probe がデフォルトで有効です。より狭いデバッグ
  実行が必要な場合は `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`、または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定してください。
- Docker は `OPENCLAW_AGENT_HARNESS_FALLBACK=none` も export し、live
  test config と一致させるため、レガシーエイリアスや PI フォールバックでは Codex harness
  回帰を隠せません。

### 推奨 live レシピ

狭く明示的な allowlist が最も高速で不安定さも少ないです。

- 単一モデル、direct（gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがるツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 集中（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注:

- `google/...` は Gemini API（API キー）を使います。
- `google-antigravity/...` は Antigravity OAuth bridge（Cloud Code Assist 風の agent endpoint）を使います。
- `google-gemini-cli/...` は、マシン上のローカル Gemini CLI を使います（別個の認証 + ツール挙動の癖あり）。
- Gemini API vs Gemini CLI:
  - API: OpenClaw は Google のホスト型 Gemini API を HTTP で呼びます（API キー / profile 認証）。ほとんどのユーザーが「Gemini」と言うときはこちらです。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル呼び出しします。独自の認証があり、挙動も異なることがあります（ストリーミング/ツールサポート/バージョン差異）。

## Live: モデルマトリクス（何をカバーするか）

固定の「CI モデル一覧」はありません（live はオプトイン）ですが、キーを持つ開発マシンで定期的にカバーすることが**推奨**されるモデルは次のとおりです。

### Modern スモークセット（ツール呼び出し + 画像）

これは、動作し続けることを期待する「共通モデル」実行です。

- OpenAI（非 Codex）: `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ツール + 画像付きで gateway smoke を実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: ツール呼び出し（Read + 任意の Exec）

プロバイダーファミリーごとに少なくとも 1 つ選んでください。

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あるとよい）:

- xAI: `xai/grok-4`（または利用可能な最新）
- Mistral: `mistral/`…（有効にしている「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセスがある場合）
- LM Studio: `lmstudio/`…（ローカル。ツール呼び出しは API モードに依存）

### Vision: image send（添付 → マルチモーダルメッセージ）

image probe を実行するには、画像対応モデルを少なくとも 1 つ `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください（Claude/Gemini/OpenAI の vision 対応バリアントなど）。

### アグリゲーター / 代替ゲートウェイ

キーが有効なら、次経由のテストもサポートしています。

- OpenRouter: `openrouter/...`（数百のモデル。tools+image 対応候補を探すには `openclaw models scan` を使用）
- OpenCode: Zen には `opencode/...`、Go には `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

認証情報/config があれば live マトリクスに含められるプロバイダー:

- 組み込み: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（cloud/API）、および任意の OpenAI/Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

ヒント: docs に「全モデル」をハードコードしようとしないでください。正しい一覧は、自分のマシンで `discoverModels(...)` が返すもの + 利用可能なキーです。

## 認証情報（絶対にコミットしないこと）

Live テストは、CLI と同じ方法で認証情報を検出します。実際の意味は次のとおりです。

- CLI が動くなら、live テストも同じキーを見つけられるはずです。
- live テストが「認証情報なし」と言うなら、`openclaw models list` / モデル選択をデバッグするのと同じ方法でデバッグします。

- エージェントごとの auth profiles: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（これが live テストでいう「profile keys」の意味です）
- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー state dir: `~/.openclaw/credentials/`（存在する場合はステージされた live home にコピーされますが、メインの profile-key ストアではありません）
- ローカル live 実行では、デフォルトでアクティブ config、エージェントごとの `auth-profiles.json`、レガシー `credentials/`、対応する外部 CLI 認証ディレクトリを temp test home にコピーします。ステージされた live home では `workspace/` と `sandboxes/` をスキップし、`agents.*.workspace` / `agentDir` のパス上書きも除去されるため、probe が実ホストワークスペースに触れません。

env キー（たとえば `~/.profile` で export 済み）に頼りたい場合は、ローカルテストを `source ~/.profile` の後に実行するか、以下の Docker ランナーを使ってください（`~/.profile` をコンテナにマウントできます）。

## Deepgram live（音声文字起こし）

- テスト: `extensions/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- テスト: `extensions/byteplus/live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- スコープ:
  - バンドル済み comfy の画像、動画、`music_generate` 経路を実行
  - `models.providers.comfy.<capability>` が設定されていない各機能はスキップ
  - comfy の workflow submission、polling、downloads、Plugin 登録を変更した後に有用

## 画像生成 live

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- スコープ:
  - 登録済みのすべての画像生成 provider Plugin を列挙
  - probe 前に、欠けている provider env var をログインシェル（`~/.profile`）から読み込む
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な auth/profile/model がない provider はスキップ
  - 標準の画像生成バリアントを共有ランタイム機能経由で実行:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされるバンドル済みプロバイダー:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で profile-store auth を強制し、env のみの上書きを無視

## 音楽生成 live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- スコープ:
  - 共有のバンドル済み音楽生成 provider 経路を実行
  - 現在は Google と MiniMax をカバー
  - probe 前に provider env var をログインシェル（`~/.profile`）から読み込む
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な auth/profile/model がない provider はスキップ
  - 利用可能な場合、宣言されたランタイムモードを両方実行:
    - プロンプトのみ入力の `generate`
    - provider が `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンカバレッジ:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: この共有スイープではなく、別の Comfy live ファイル
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で profile-store auth を強制し、env のみの上書きを無視

## 動画生成 live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- スコープ:
  - 共有のバンドル済み動画生成 provider 経路を実行
  - デフォルトではリリース安全なスモーク経路を使います: FAL 以外のプロバイダー、provider ごとに 1 回の text-to-video リクエスト、1 秒の lobster プロンプト、そして `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（デフォルト `180000`）由来の provider ごとの操作上限
  - provider 側のキュー遅延がリリース時間を支配し得るため、デフォルトでは FAL をスキップします。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - probe 前に provider env var をログインシェル（`~/.profile`）から読み込みます
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な auth/profile/model がない provider はスキップします
  - デフォルトでは `generate` のみを実行します
  - 利用可能な場合に宣言された transform モードも実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します:
    - provider が `capabilities.imageToVideo.enabled` を宣言し、選択した provider/model が共有スイープ内で buffer-backed のローカル画像入力を受け付ける場合の `imageToVideo`
    - provider が `capabilities.videoToVideo.enabled` を宣言し、選択した provider/model が共有スイープ内で buffer-backed のローカル動画入力を受け付ける場合の `videoToVideo`
  - 現在、共有スイープでは宣言されているがスキップされる `imageToVideo` provider:
    - バンドル済み `veo3` はテキスト専用で、バンドル済み `kling` はリモート画像 URL を必要とするため `vydra`
  - provider 固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` の text-to-video と、デフォルトでリモート画像 URL fixture を使う `kling` レーンを実行します
  - 現在の `videoToVideo` live カバレッジ:
    - 選択モデルが `runway/gen4_aleph` の場合のみ `runway`
  - 現在、共有スイープでは宣言されているがスキップされる `videoToVideo` provider:
    - それらの経路が現在リモート `http(s)` / MP4 参照 URL を必要とするため `alibaba`, `qwen`, `xai`
    - 現在の共有 Gemini/Veo レーンがローカル buffer-backed 入力を使っており、その経路は共有スイープでは受け付けられないため `google`
    - 現在の共有レーンには org 固有の video inpaint/remix アクセス保証がないため `openai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルトスイープで FAL を含むすべての provider を含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 積極的なスモーク実行のために、各 provider 操作上限を減らすには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で profile-store auth を強制し、env のみの上書きを無視

## メディア live harness

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の画像、音楽、動画 live スイートを 1 つの repo ネイティブ entrypoint から実行する
  - `~/.profile` から不足している provider env var を自動読み込みする
  - デフォルトで、現在使用可能な auth がある provider に各スイートを自動的に絞り込む
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と quiet-mode の動作が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [Testing](/ja-JP/help/testing) — unit、integration、QA、Docker スイート
