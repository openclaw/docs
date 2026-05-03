---
read_when:
    - ライブモデルマトリックス / CLI バックエンド / ACP / media-provider スモークテストを実行中
    - ライブテストの認証情報解決のデバッグ
    - 新しいプロバイダー固有のライブテストの追加
sidebarTitle: Live tests
summary: 'ライブ（ネットワークアクセスを伴う）テスト: モデルマトリクス、CLI バックエンド、ACP、メディアプロバイダー、認証情報'
title: 'テスト: ライブスイート'
x-i18n:
    generated_at: "2026-05-03T04:59:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4057d8875fa3404108e89e4381c1dd14e96abbc2af13c4934fc6c0dbf878fc00
    source_path: help/testing-live.md
    workflow: 16
---

クイックスタート、QA ランナー、ユニット/統合スイート、Docker フローについては、
[テスト](/ja-JP/help/testing)を参照してください。このページでは、**live**（ネットワークに触れる）テスト
スイート（モデルマトリクス、CLI バックエンド、ACP、メディアプロバイダーの live テスト）と
認証情報の扱いについて説明します。

## Live: ローカルプロファイルのスモークコマンド

アドホックな live チェックの前に `~/.profile` を source して、プロバイダーキーとローカルツールの
パスをシェルと一致させます。

```bash
source ~/.profile
```

安全なメディアスモーク:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全な音声通話準備状況スモーク:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` は、`--yes` も指定されていない限りドライランです。実際の通知通話を意図的に発信したい場合にのみ `--yes` を使ってください。Twilio、Telnyx、Plivo では、準備状況チェックが成功するには公開 Webhook URL が必要です。ローカルのみの loopback/プライベートフォールバックは、設計上拒否されます。

## Live: Android Node 機能スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続済み Android Node が**現在アドバタイズしているすべてのコマンド**を呼び出し、コマンド契約の動作をアサートする。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/実行/ペアリングを行いません）。
  - 選択した Android Node に対する、コマンド単位の Gateway `node.invoke` 検証。
- 必須の事前セットアップ:
  - Android アプリがすでに Gateway に接続済み + ペアリング済み。
  - アプリをフォアグラウンドに維持。
  - 成功を期待する機能について、権限/キャプチャ同意が付与済み。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細: [Android アプリ](/ja-JP/platforms/android)

## Live: モデルスモーク（プロファイルキー）

live テストは、失敗を切り分けられるように 2 つのレイヤーに分かれています。

- 「ダイレクトモデル」は、指定されたキーでプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gateway スモーク」は、そのモデルについて gateway+agent パイプライン全体が機能するかを示します（セッション、履歴、ツール、サンドボックスポリシーなど）。

### レイヤー 1: ダイレクトモデル補完（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って認証情報があるモデルを選択する
  - モデルごとに小さな補完を実行する（必要に応じて対象を絞った回帰テストも実行）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接起動する場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`、modern のエイリアス）を設定します。設定しない場合、`pnpm test:live` を Gateway スモークに集中させるためスキップされます
- モデルの選択方法:
  - `OPENCLAW_LIVE_MODELS=modern` で modern 許可リストを実行（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_MODELS=all` は modern 許可リストのエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（カンマ区切り許可リスト）
  - Modern/all スイープは、デフォルトで厳選された高シグナル上限を使います。網羅的な modern スイープには `OPENCLAW_LIVE_MAX_MODELS=0` を、より小さい上限には正の数を設定します。
  - 網羅的スイープでは、ダイレクトモデルテスト全体のタイムアウトに `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使います。デフォルト: 60 分。
  - ダイレクトモデルプローブは、デフォルトで 20 並列で実行されます。上書きするには `OPENCLAW_LIVE_MODEL_CONCURRENCY` を設定します。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り許可リスト）
- キーの取得元:
  - デフォルト: プロファイルストアと env フォールバック
  - **プロファイルストア**のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定
- 存在理由:
  - 「プロバイダー API が壊れている / キーが無効」と「Gateway agent パイプラインが壊れている」を分離します
  - 小さく分離された回帰テストを含みます（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + dev agent スモーク（"@openclaw" が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - インプロセス Gateway を起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとにモデルを上書き）
  - キー付きモデルを反復し、次をアサートする:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが機能する（read プローブ）
    - 任意の追加ツールプローブ（exec+read プローブ）
    - OpenAI 回帰パス（tool-call-only → follow-up）が機能し続ける
- プローブ詳細（失敗をすばやく説明できるように）:
  - `read` プローブ: テストはワークスペースに nonce ファイルを書き込み、agent にそれを `read` して nonce をエコーバックするよう依頼します。
  - `exec+read` プローブ: テストは agent に nonce を一時ファイルへ `exec` で書き込み、その後それを `read` して戻すよう依頼します。
  - 画像プローブ: テストは生成された PNG（cat + ランダム化コード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接起動する場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: modern 許可リスト（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern 許可リストのエイリアスです
  - または絞り込むために `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定
  - Modern/all Gateway スイープは、デフォルトで厳選された高シグナル上限を使います。網羅的な modern スイープには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を、より小さい上限には正の数を設定します。
- プロバイダーの選択方法（「OpenRouter everything」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り許可リスト）
- この live テストではツール + 画像プローブは常にオンです:
  - `read` プローブ + `exec+read` プローブ（ツールストレス）
  - 画像プローブは、モデルが画像入力サポートをアドバタイズしている場合に実行されます
  - フロー（高レベル）:
    - テストが「CAT」+ ランダムコード入りの小さな PNG を生成（`src/gateway/live-image-probe.ts`）
    - `agent` 経由で `attachments: [{ mimeType: "image/png", content: "<base64>" }]` として送信
    - Gateway が添付ファイルを `images[]` に解析（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 埋め込み agent がマルチモーダルユーザーメッセージをモデルへ転送
    - アサーション: 返信に `cat` + コードが含まれる（OCR 許容度: 軽微な間違いは許容）

<Tip>
自分のマシンで何をテストできるか（および正確な `provider/model` ID）を確認するには、次を実行します。

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live: CLI バックエンドスモーク（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定に触れずに、ローカル CLI バックエンドを使って Gateway + agent パイプラインを検証する。
- バックエンド固有のスモークデフォルトは、所有する extension の `cli-backend.ts` 定義内にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接起動する場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトのプロバイダー/モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド/引数/画像動作は、所有する CLI バックエンド Plugin メタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` で実際の画像添付を送信（パスはプロンプトに注入されます）。Docker レシピでは、明示的に要求されない限りこれはデフォルトでオフです。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` で、プロンプト注入の代わりに画像ファイルパスを CLI 引数として渡します。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）で、`IMAGE_ARG` が設定されている場合の画像引数の渡し方を制御します。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` で 2 ターン目を送信し、resume フローを検証します。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` で、選択したモデルが切り替えターゲットをサポートする場合に、Claude Sonnet -> Opus の同一セッション継続性プローブを有効にします。Docker レシピでは、集約時の信頼性のためにこれはデフォルトでオフです。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` で MCP/ツール loopback プローブを有効にします。Docker レシピでは、明示的に要求されない限りこれはデフォルトでオフです。

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

安価な Gemini MCP 設定スモーク:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

これは Gemini に応答生成を依頼しません。OpenClaw が Gemini に渡すものと同じシステム
設定を書き込み、その後 `gemini --debug mcp list` を実行して、
保存された `transport: "streamable-http"` サーバーが Gemini の HTTP MCP
形状に正規化され、ローカルの streamable-HTTP MCP サーバーへ接続できることを証明します。

Docker レシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダーの Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注記:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- repo Docker イメージ内で、非 root の `node` ユーザーとして live CLI バックエンドスモークを実行します。
- 所有する extension から CLI スモークメタデータを解決し、その後対応する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）にあるキャッシュ済みの書き込み可能 prefix へインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`claudeAiOauth.subscriptionType` を含む `~/.claude/.credentials.json`、または `claude setup-token` からの `CLAUDE_CODE_OAUTH_TOKEN` のいずれかによる、ポータブルな Claude Code サブスクリプション OAuth が必要です。まず Docker 内で直接 `claude -p` を証明し、その後 Anthropic API キーの env vars を保持せずに 2 つの Gateway CLI バックエンドターンを実行します。このサブスクリプションレーンでは、Claude MCP/ツールと画像プローブはデフォルトで無効になります。これは、Claude が現在サードパーティアプリの使用を通常のサブスクリプションプラン制限ではなく追加使用量課金にルーティングしているためです。
- live CLI バックエンドスモークは現在、Claude、Codex、Gemini について同じエンドツーエンドフローを実行します: テキストターン、画像分類ターン、その後 Gateway CLI 経由で検証される MCP `cron` ツール呼び出し。
- Claude のデフォルトスモークは、セッションを Sonnet から Opus にパッチし、resume されたセッションが以前のメモをまだ覚えていることも検証します。

## Live: ACP bind スモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: ライブ ACP agent を使って実際の ACP conversation-bind フローを検証する:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成 message-channel conversation をその場でバインドする
  - 同じ conversation に通常のフォローアップを送信する
  - フォローアップがバインドされた ACP session transcript に到達することを確認する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP agents: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP agent: `claude`
  - 合成 channel: Slack DM 形式の conversation context
  - ACP backend: `acpx`
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
  - この lane は gateway `chat.send` surface と、admin-only の合成 originating-route fields を使うため、テストは外部配信を装うことなく message-channel context をアタッチできる。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP harness agent に対して、組み込みの `acpx` plugin の組み込み agent registry を使う。
  - Bound-session cron MCP の作成は、bind/image proof が通過した後に外部 ACP harness が MCP calls をキャンセルすることがあるため、デフォルトでは best-effort。`OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` を設定すると、その post-bind cron probe が strict になる。

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

Docker 注記:

- Docker runner は `scripts/test-live-acp-bind-docker.sh` にある。
- デフォルトでは、ACP bind smoke を集約された live CLI agents に対して順に実行する: `claude`、`codex`、次に `gemini`。
- matrix を絞るには、`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使う。
- これは `~/.profile` を読み込み、一致する CLI auth material を container に staging し、要求された live CLI（`@anthropic-ai/claude-code`、`@openai/codex`、Factory Droid via `https://app.factory.ai/cli`、`@google/gemini-cli`、または `opencode-ai`）がなければインストールする。ACP backend 自体は公式 `acpx` plugin の組み込み `acpx/runtime` package。
- Droid Docker variant は settings 用に `~/.factory` を staging し、`FACTORY_API_KEY` を転送し、その API key を要求する。local Factory OAuth/keyring auth は container に移植できないため。これは ACPX の組み込み `droid exec --output-format acp` registry entry を使う。
- OpenCode Docker variant は strict な単一 agent regression lane。`~/.profile` を読み込んだ後、`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（デフォルト `opencode/kimi-k2.6`）から一時的な `OPENCODE_CONFIG_CONTENT` default model を書き込み、`pnpm test:docker:live-acp-bind:opencode` は generic post-bind skip を受け入れるのではなく、バインドされた assistant transcript を要求する。
- 直接の `acpx` CLI calls は、Gateway 外の挙動を比較するためだけの手動/回避策パス。Docker ACP bind smoke は OpenClaw の組み込み `acpx` runtime backend を実行する。

## ライブ: Codex app-server harness smoke

- 目的: plugin 所有の Codex harness を通常の gateway
  `agent` method 経由で検証する:
  - bundled `codex` plugin を読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - Codex harness を強制した状態で、最初の gateway agent turn を `openai/gpt-5.5` に送信する
  - 同じ OpenClaw session に 2 回目の turn を送信し、app-server
    thread が再開できることを確認する
  - 同じ gateway command
    path 経由で `/codex status` と `/codex models` を実行する
  - 必要に応じて、Guardian によってレビューされた escalated shell probes を 2 つ実行する: 承認されるべき無害な
    command と、拒否されて agent が確認を返すべき fake-secret upload
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルト model: `openai/gpt-5.5`
- 任意の image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- smoke は `agentRuntime.id: "codex"` を使うため、壊れた Codex harness が
  PI に黙って fallback して成功することはできない。
- Auth: local Codex subscription login からの Codex app-server auth。Docker
  smokes は、該当する場合に non-Codex probes 用の `OPENAI_API_KEY` も提供でき、
  さらに任意でコピーされた `~/.codex/auth.json` と `~/.codex/config.toml` も提供できる。

ローカルレシピ:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker レシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker 注記:

- Docker runner は `scripts/test-live-codex-harness-docker.sh` にある。
- これは mounted `~/.profile` を読み込み、`OPENAI_API_KEY` を渡し、存在する場合は Codex CLI
  auth files をコピーし、`@openai/codex` を writable mounted npm
  prefix にインストールし、source tree を staging してから、Codex-harness live test だけを実行する。
- Docker は image、MCP/tool、Guardian probes をデフォルトで有効にする。より狭い debug
  run が必要な場合は、
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定する。
- Docker は同じ明示的な Codex runtime config を使うため、legacy aliases や PI
  fallback が Codex harness regression を隠すことはできない。

### 推奨ライブレシピ

狭く明示的な allowlists が最も高速で flake が少ない:

- 単一 model、直接（gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一 model、gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数 providers にまたがる tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google focus（Gemini API key + Antigravity）:
  - Gemini（API key）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking smoke:
  - local keys が shell profile にある場合: `source ~/.profile`
  - Gemini 3 dynamic default: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 dynamic budget: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注記:

- `google/...` は Gemini API（API key）を使う。
- `google-antigravity/...` は Antigravity OAuth bridge（Cloud Code Assist-style agent endpoint）を使う。
- `google-gemini-cli/...` はマシン上の local Gemini CLI を使う（別の auth + tooling quirks）。
- Gemini API と Gemini CLI:
  - API: OpenClaw は Google の hosted Gemini API を HTTP 経由で呼び出す（API key / profile auth）。多くの users が「Gemini」と言うときに意味するのはこちら。
  - CLI: OpenClaw は local `gemini` binary を shell out する。独自の auth があり、挙動が異なる場合がある（streaming/tool support/version skew）。

## ライブ: model matrix（カバー範囲）

固定の「CI model list」はない（live は opt-in）が、keys を持つ dev machine で定期的にカバーすることを**推奨**する models は次のとおり。

### Modern smoke set（tool calling + image）

これは動作し続けることを期待する「common models」の実行:

- OpenAI（non-Codex）: `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x models は避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro`
- Z.AI（GLM）: `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

tools + image 付きで gateway smoke を実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool calling（Read + 任意の Exec）

provider family ごとに少なくとも 1 つ選ぶ:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI（GLM）: `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加 coverage（あるとよい）:

- xAI: `xai/grok-4.3`（または利用可能な最新）
- Mistral: `mistral/`…（有効化済みの「tools」対応 model を 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセス権がある場合）
- LM Studio: `lmstudio/`…（local。tool calling は API mode に依存）

### Vision: image send（attachment → multimodal message）

image probe を実行するため、少なくとも 1 つの image 対応 model（Claude/Gemini/OpenAI vision-capable variants など）を `OPENCLAW_LIVE_GATEWAY_MODELS` に含める。

### Aggregators / alternate gateways

keys が有効なら、次経由のテストもサポートする:

- OpenRouter: `openrouter/...`（数百の models。tool+image 対応 candidates を見つけるには `openclaw models scan` を使う）
- OpenCode: Zen 用の `opencode/...` と Go 用の `opencode-go/...`（auth は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 経由）

live matrix に含められる追加 providers（creds/config がある場合）:

- 組み込み: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` 経由（custom endpoints）: `minimax`（cloud/API）に加えて、任意の OpenAI/Anthropic-compatible proxy（LM Studio、vLLM、LiteLLM など）

<Tip>
docs で "all models" を hardcode しない。authoritative list は、あなたのマシンで `discoverModels(...)` が返すものに、利用可能な keys を加えたもの。
</Tip>

## Credentials（絶対に commit しない）

Live tests は CLI と同じ方法で credentials を検出する。実務上の意味:

- CLI が動作する場合、ライブテストは同じキーを見つけるはずです。
- ライブテストで「認証情報なし」と表示される場合は、`openclaw models list` / モデル選択をデバッグするのと同じ方法でデバッグしてください。

- エージェントごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（ライブテストでの「プロファイルキー」とはこれを意味します）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー状態ディレクトリ: `~/.openclaw/credentials/`（存在する場合はステージングされたライブホームにコピーされますが、メインのプロファイルキーストアではありません）
- ライブローカル実行では、既定でアクティブな設定、エージェントごとの `auth-profiles.json` ファイル、レガシー `credentials/`、サポートされている外部 CLI 認証ディレクトリが一時テストホームにコピーされます。ステージングされたライブホームでは `workspace/` と `sandboxes/` がスキップされ、`agents.*.workspace` / `agentDir` パスのオーバーライドは削除されるため、プローブが実際のホストワークスペースに触れません。

環境キーに依存したい場合（たとえば `~/.profile` でエクスポートしている場合）は、`source ~/.profile` の後にローカルテストを実行するか、以下の Docker ランナーを使用してください（コンテナ内に `~/.profile` をマウントできます）。

## Deepgram ライブ（音声文字起こし）

- テスト: `extensions/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus コーディングプランライブ

- テスト: `extensions/byteplus/live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 任意のモデルオーバーライド: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI ワークフローメディアライブ

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 範囲:
  - バンドルされた comfy の画像、動画、`music_generate` パスを実行します
  - `plugins.entries.comfy.config.<capability>` が設定されていない限り、各機能をスキップします
  - comfy ワークフロー送信、ポーリング、ダウンロード、または Plugin 登録を変更した後に有用です

## 画像生成ライブ

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- 範囲:
  - 登録済みのすべての画像生成プロバイダー Plugin を列挙します
  - プローブ前に、ログインシェル（`~/.profile`）から不足しているプロバイダー環境変数を読み込みます
  - 既定では保存済み認証プロファイルよりもライブ/環境 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 設定済みの各プロバイダーを共有画像生成ランタイムで実行します:
    - `<provider>:generate`
    - プロバイダーが編集サポートを宣言している場合は `<provider>:edit`
- 現在対象となるバンドル済みプロバイダー:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で、プロファイルストア認証を強制し、環境のみのオーバーライドを無視します

出荷済み CLI パスについては、プロバイダー/ランタイムのライブテストが通過した後に `infer` スモークを追加します:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

これは CLI 引数解析、設定/既定エージェント解決、バンドル済み Plugin の有効化、共有画像生成ランタイム、ライブプロバイダーリクエストを対象にします。Plugin 依存関係は、ランタイム読み込み前に存在していることが期待されます。

## 音楽生成ライブ

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- 範囲:
  - 共有バンドル済み音楽生成プロバイダーパスを実行します
  - 現在は Google と MiniMax を対象にします
  - プローブ前に、ログインシェル（`~/.profile`）からプロバイダー環境変数を読み込みます
  - 既定では保存済み認証プロファイルよりもライブ/環境 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 利用可能な場合は、宣言済みの両方のランタイムモードを実行します:
    - プロンプトのみの入力で `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合は `edit`
  - 現在の共有レーン対象範囲:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: この共有スイープではなく、別の Comfy ライブファイル
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で、プロファイルストア認証を強制し、環境のみのオーバーライドを無視します

## 動画生成ライブ

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- 範囲:
  - 共有バンドル済み動画生成プロバイダーパスを実行します
  - 既定ではリリース安全なスモークパスになります: FAL 以外のプロバイダー、プロバイダーごとに 1 件のテキストから動画へのリクエスト、1 秒のロブスタープロンプト、`OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（既定は `180000`）からのプロバイダーごとの操作上限
  - プロバイダー側のキュー遅延がリリース時間を支配する可能性があるため、既定では FAL をスキップします。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - プローブ前に、ログインシェル（`~/.profile`）からプロバイダー環境変数を読み込みます
  - 既定では保存済み認証プロファイルよりもライブ/環境 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 既定では `generate` のみを実行します
  - 利用可能な場合に宣言済みの変換モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択したプロバイダー/モデルが共有スイープでバッファ支援のローカル画像入力を受け入れる場合は `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択したプロバイダー/モデルが共有スイープでバッファ支援のローカル動画入力を受け入れる場合は `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - `vydra`。バンドル済みの `veo3` はテキストのみで、バンドル済みの `kling` はリモート画像 URL を必要とするため
  - プロバイダー固有の Vydra 対象範囲:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - そのファイルは `veo3` のテキストから動画へのレーンと、既定でリモート画像 URL フィクスチャを使用する `kling` レーンを実行します
  - 現在の `videoToVideo` ライブ対象範囲:
    - 選択したモデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`, `qwen`, `xai`。これらのパスは現在リモート `http(s)` / MP4 参照 URL を必要とするため
    - `google`。現在の共有 Gemini/Veo レーンはローカルのバッファ支援入力を使用し、そのパスは共有スイープで受け入れられないため
    - `openai`。現在の共有レーンには、組織固有の動画インペイント/リミックスアクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL を含むすべてのプロバイダーを既定スイープに含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 積極的なスモーク実行向けに各プロバイダー操作上限を下げるには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で、プロファイルストア認証を強制し、環境のみのオーバーライドを無視します

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有画像、音楽、動画のライブスイートを、1 つのリポジトリネイティブなエントリポイントで実行します
  - `~/.profile` から不足しているプロバイダー環境変数を自動読み込みします
  - 既定では、現在使用可能な認証があるプロバイダーに各スイートを自動で絞り込みます
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と quiet モードの動作は一貫します
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [テスト](/ja-JP/help/testing) — ユニット、統合、QA、Docker スイート
