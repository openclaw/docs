---
read_when:
    - ライブモデルマトリックス / CLI バックエンド / ACP / media-provider スモークテストの実行
    - ライブテストの認証情報解決のデバッグ
    - 新しいプロバイダー固有のライブテストを追加する
sidebarTitle: Live tests
summary: 'ライブ（ネットワークにアクセスする）テスト: モデルマトリックス、CLI バックエンド、ACP、メディアプロバイダー、認証情報'
title: 'テスト: ライブスイート'
x-i18n:
    generated_at: "2026-05-02T20:49:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2268f20ce5c0bbee8bf610938851fe529f5e21fa31fe08a70400df94e9241cc3
    source_path: help/testing-live.md
    workflow: 16
---

クイックスタート、QA ランナー、ユニット/統合スイート、Docker フローについては、[テスト](/ja-JP/help/testing)を参照してください。このページでは、**ライブ**（ネットワークに接続する）テストスイート（モデルマトリックス、CLI バックエンド、ACP、メディアプロバイダーのライブテスト）と認証情報の扱いについて説明します。

## ライブ: ローカルプロファイルのスモークコマンド

アドホックなライブチェックの前に `~/.profile` を source して、プロバイダーキーとローカルツールのパスがシェルと一致するようにします。

```bash
source ~/.profile
```

安全なメディアスモーク:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全な音声通話準備スモーク:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` は、`--yes` も指定されていない限りドライランです。実際の通知通話を発信したい場合にのみ `--yes` を使用してください。Twilio、Telnyx、Plivo では、準備チェックが成功するには公開 webhook URL が必要です。ローカル専用の loopback/プライベートフォールバックは設計上拒否されます。

## ライブ: Android ノード機能スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目標: 接続された Android ノードによって**現在公開されているすべてのコマンド**を呼び出し、コマンド契約の動作を検証する。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/実行/ペアリングを行いません）。
  - 選択された Android ノードに対する、コマンド単位の gateway `node.invoke` 検証。
- 必須の事前セットアップ:
  - Android アプリがすでに gateway に接続済み + ペアリング済み。
  - アプリをフォアグラウンドに維持。
  - 成功を期待する機能について、権限/キャプチャ同意が付与済み。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android セットアップの詳細: [Android アプリ](/ja-JP/platforms/android)

## ライブ: モデルスモーク（プロファイルキー）

ライブテストは、失敗を切り分けられるように 2 つのレイヤーに分かれています。

- 「直接モデル」は、指定されたキーでプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gateway スモーク」は、そのモデルで完全な gateway+agent パイプラインが機能するかを示します（セッション、履歴、ツール、サンドボックスポリシーなど）。

### レイヤー 1: 直接モデル補完（gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目標:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使用して、認証情報があるモデルを選択する
  - モデルごとに小さな補完を実行する（必要な場合はターゲットを絞ったリグレッションも実行）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または modern のエイリアスである `all`）を設定します。そうしない場合、`pnpm test:live` を gateway スモークに集中させるためスキップされます。
- モデルの選択方法:
  - `OPENCLAW_LIVE_MODELS=modern` で modern allowlist を実行します（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_MODELS=all` は modern allowlist のエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（カンマ区切り allowlist）
  - Modern/all スイープは、既定で厳選された高シグナルの上限を使用します。網羅的な modern スイープには `OPENCLAW_LIVE_MAX_MODELS=0` を設定し、より小さい上限には正の数を設定します。
  - 網羅的スイープでは、直接モデルテスト全体のタイムアウトに `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使用します。既定値: 60 分。
  - 直接モデルプローブは既定で 20 並列で実行されます。上書きするには `OPENCLAW_LIVE_MODEL_CONCURRENCY` を設定します。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り allowlist）
- キーの取得元:
  - 既定: プロファイルストアと env フォールバック
  - **プロファイルストア**のみに強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定
- これが存在する理由:
  - 「プロバイダー API が壊れている / キーが無効」と「gateway agent パイプラインが壊れている」を分離する
  - 小さく分離されたリグレッションを含む（例: OpenAI Responses/Codex Responses の reasoning リプレイ + ツール呼び出しフロー）

### レイヤー 2: Gateway + 開発 agent スモーク（"@openclaw" が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目標:
  - インプロセス gateway を起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとにモデルを上書き）
  - キーがあるモデルを反復し、以下を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが機能する（read プローブ）
    - 任意の追加ツールプローブ（exec+read プローブ）
    - OpenAI リグレッションパス（ツール呼び出しのみ → フォローアップ）が機能し続ける
- プローブの詳細（失敗をすばやく説明できるようにするため）:
  - `read` プローブ: テストはワークスペースに nonce ファイルを書き込み、agent にそれを `read` して nonce をそのまま返すよう求めます。
  - `exec+read` プローブ: テストは agent に temp ファイルへ nonce を `exec` で書き込ませ、その後 `read` で読み戻させます。
  - 画像プローブ: テストは生成された PNG（cat + ランダム化されたコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装リファレンス: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - 既定: modern allowlist（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern allowlist のエイリアスです
  - または絞り込むには `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定
  - Modern/all gateway スイープは、既定で厳選された高シグナルの上限を使用します。網羅的な modern スイープには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を設定し、より小さい上限には正の数を設定します。
- プロバイダーの選択方法（「OpenRouter 全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り allowlist）
- このライブテストでは、ツール + 画像プローブは常に有効です:
  - `read` プローブ + `exec+read` プローブ（ツール負荷）
  - モデルが画像入力サポートを公開している場合、画像プローブを実行
  - フロー（概要）:
    - テストが「CAT」+ ランダムコードを含む小さな PNG を生成（`src/gateway/live-image-probe.ts`）
    - `agent` 経由で `attachments: [{ mimeType: "image/png", content: "<base64>" }]` として送信
    - Gateway が添付ファイルを `images[]` に解析（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 組み込み agent がマルチモーダルなユーザーメッセージをモデルに転送
    - アサーション: 返信に `cat` + コードが含まれる（OCR 許容範囲: 軽微なミスは許容）

<Tip>
自分のマシンでテストできる内容（および正確な `provider/model` ID）を確認するには、次を実行します。

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## ライブ: CLI バックエンドスモーク（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目標: 既定の設定に触れずに、ローカル CLI バックエンドを使用して Gateway + agent パイプラインを検証する。
- バックエンド固有のスモーク既定値は、所有元 Plugin の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 既定値:
  - 既定のプロバイダー/モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド/引数/画像の動作は、所有元 CLI バックエンド Plugin メタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送信するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。Docker レシピでは、明示的に要求されない限り既定でオフです。
  - プロンプト注入ではなく CLI 引数として画像ファイルパスを渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されている場合に画像引数をどのように渡すかを制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 ターン目を送信して再開フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - 選択されたモデルが切り替え先をサポートしている場合に、Claude Sonnet -> Opus の同一セッション継続性プローブを有効にするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`。Docker レシピでは、集約時の信頼性のため既定でオフです。
  - MCP/ツール loopback プローブを有効にするには `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`。Docker レシピでは、明示的に要求されない限り既定でオフです。

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低コストの Gemini MCP 設定スモーク:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

これは Gemini に応答生成を求めません。OpenClaw が Gemini に渡すものと同じシステム設定を書き込み、その後 `gemini --debug mcp list` を実行して、保存された `transport: "streamable-http"` サーバーが Gemini の HTTP MCP 形式に正規化され、ローカルの streamable-HTTP MCP サーバーへ接続できることを証明します。

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
- リポジトリ Docker イメージ内で、非 root の `node` ユーザーとしてライブ CLI バックエンドスモークを実行します。
- 所有元 extension から CLI スモークメタデータを解決し、その後一致する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（既定: `~/.cache/openclaw/docker-cli-tools`）にあるキャッシュ済みの書き込み可能プレフィックスへインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`claudeAiOauth.subscriptionType` を含む `~/.claude/.credentials.json`、または `claude setup-token` からの `CLAUDE_CODE_OAUTH_TOKEN` のいずれかによる、ポータブルな Claude Code サブスクリプション OAuth が必要です。最初に Docker 内で直接 `claude -p` を証明し、その後 Anthropic API キーの env vars を保持せずに 2 つの Gateway CLI バックエンドターンを実行します。このサブスクリプションレーンでは、Claude が現在サードパーティアプリの利用を通常のサブスクリプションプラン上限ではなく追加利用課金として処理しているため、Claude MCP/ツールおよび画像プローブは既定で無効化されます。
- ライブ CLI バックエンドスモークは、Claude、Codex、Gemini で同じエンドツーエンドフローを実行するようになりました: テキストターン、画像分類ターン、その後 gateway CLI 経由で検証される MCP `cron` ツール呼び出し。
- Claude の既定スモークは、セッションを Sonnet から Opus にパッチし、再開されたセッションが以前のメモをまだ覚えていることも検証します。

## ライブ: ACP bind スモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: ライブ ACP エージェントで実際の ACP conversation-bind フローを検証する:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成メッセージチャネル会話をその場でバインドする
  - 同じ会話で通常のフォローアップを送信する
  - フォローアップがバインド済み ACP セッションのトランスクリプトに到達することを確認する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP エージェント: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP エージェント: `claude`
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
- メモ:
  - このレーンは Gateway の `chat.send` サーフェスを、管理者専用の合成 originating-route フィールドとともに使用するため、テストは外部配信を装わずにメッセージチャネルコンテキストを添付できる。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP ハーネスエージェントに対して、埋め込み `acpx` Plugin の組み込みエージェントレジストリを使用する。
  - バインド済みセッションの Cron MCP 作成はデフォルトではベストエフォートである。外部 ACP ハーネスは、バインド/画像の証明が通過した後に MCP 呼び出しをキャンセルする場合があるため。バインド後の Cron プローブを厳密にするには `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` を設定する。

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

単一エージェントの Docker レシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker メモ:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にある。
- デフォルトでは、集約されたライブ CLI エージェントに対して ACP bind スモークを順に実行する: `claude`、`codex`、その後 `gemini`。
- マトリクスを絞り込むには、`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使用する。
- `~/.profile` を読み込み、対応する CLI 認証素材をコンテナへステージングし、要求されたライブ CLI（`@anthropic-ai/claude-code`、`@openai/codex`、`https://app.factory.ai/cli` 経由の Factory Droid、`@google/gemini-cli`、または `opencode-ai`）がなければインストールする。ACP バックエンド自体は、公式 `acpx` Plugin の埋め込み `acpx/runtime` パッケージである。
- Droid Docker バリアントは設定用に `~/.factory` をステージングし、`FACTORY_API_KEY` を転送し、その API キーを必須とする。ローカルの Factory OAuth/keyring 認証はコンテナへ移植できないためである。これは ACPX の組み込み `droid exec --output-format acp` レジストリエントリを使用する。
- OpenCode Docker バリアントは厳密な単一エージェント回帰レーンである。`~/.profile` の読み込み後に、`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（デフォルト `opencode/kimi-k2.6`）から一時的な `OPENCODE_CONFIG_CONTENT` デフォルトモデルを書き込み、`pnpm test:docker:live-acp-bind:opencode` は汎用的なバインド後スキップを受け入れず、バインド済みアシスタントトランスクリプトを必須とする。
- 直接の `acpx` CLI 呼び出しは、Gateway 外で挙動を比較するための手動/回避策パスに限られる。Docker ACP bind スモークは OpenClaw の埋め込み `acpx` ランタイムバックエンドを実行する。

## ライブ: Codex アプリサーバーハーネススモーク

- 目的: 通常の Gateway
  `agent` メソッドを通じて、Plugin 所有の Codex ハーネスを検証する:
  - バンドルされた `codex` Plugin をロードする
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - Codex ハーネスを強制して、最初の Gateway エージェントターンを `openai/gpt-5.5` に送信する
  - 同じ OpenClaw セッションに 2 回目のターンを送信し、アプリサーバー
    スレッドが再開できることを確認する
  - 同じ Gateway コマンドパスを通じて `/codex status` と `/codex models` を実行する
  - 任意で、Guardian にレビューされた昇格シェルプローブを 2 つ実行する。承認されるべき無害な
    コマンド 1 つと、拒否されてエージェントが聞き返すべき偽シークレットのアップロード 1 つ
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `openai/gpt-5.5`
- 任意の画像プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/ツールプローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れた Codex
  ハーネスが PI に静かにフォールバックして通過することはできない。
- 認証: ローカル Codex サブスクリプションログインからの Codex アプリサーバー認証。Docker
  スモークでは、該当する場合に非 Codex プローブ用の `OPENAI_API_KEY` も提供でき、
  加えて任意でコピーされた `~/.codex/auth.json` と `~/.codex/config.toml` を使用できる。

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

Docker メモ:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にある。
- マウントされた `~/.profile` を読み込み、`OPENAI_API_KEY` を渡し、存在する場合は Codex CLI
  認証ファイルをコピーし、`@openai/codex` を書き込み可能なマウント済み npm
  プレフィックスへインストールし、ソースツリーをステージングしてから、Codex ハーネスのライブテストのみを実行する。
- Docker はデフォルトで画像、MCP/ツール、Guardian プローブを有効にする。より狭いデバッグ
  実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定する。
- Docker は `OPENCLAW_AGENT_HARNESS_FALLBACK=none` もエクスポートし、ライブ
  テスト設定と一致させるため、レガシーエイリアスや PI フォールバックが Codex ハーネスの
  回帰を隠すことはできない。

### 推奨ライブレシピ

狭く明示的な許可リストが最速で、最も不安定になりにくい:

- 単一モデル、直接（Gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、Gateway スモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがるツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google フォーカス（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking スモーク:
  - ローカルキーがシェルプロファイルにある場合: `source ~/.profile`
  - Gemini 3 動的デフォルト: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動的バジェット: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

メモ:

- `google/...` は Gemini API（API キー）を使用する。
- `google-antigravity/...` は Antigravity OAuth ブリッジ（Cloud Code Assist スタイルのエージェントエンドポイント）を使用する。
- `google-gemini-cli/...` はマシン上のローカル Gemini CLI を使用する（別個の認証とツールの癖がある）。
- Gemini API と Gemini CLI:
  - API: OpenClaw は HTTP 経由で Google のホスト型 Gemini API を呼び出す（API キー / プロファイル認証）。ほとんどのユーザーが「Gemini」と言うときに意味するのはこちら。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル実行する。独自の認証を持ち、挙動が異なる場合がある（ストリーミング/ツール対応/バージョンのずれ）。

## ライブ: モデルマトリクス（対象範囲）

固定の「CI モデルリスト」はない（ライブはオプトイン）が、以下はキーを持つ開発マシンで定期的にカバーする**推奨**モデルである。

### モダンスモークセット（ツール呼び出し + 画像）

これは動作し続けることを期待する「一般的なモデル」の実行である:

- OpenAI（非 Codex）: `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro`
- Z.AI（GLM）: `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

ツール + 画像つきで Gateway スモークを実行する:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: ツール呼び出し（Read + 任意の Exec）

プロバイダーファミリーごとに少なくとも 1 つ選ぶ:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI（GLM）: `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あるとよい）:

- xAI: `xai/grok-4.3`（または利用可能な最新）
- Mistral: `mistral/`…（有効化済みの「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセス権がある場合）
- LM Studio: `lmstudio/`…（ローカル。ツール呼び出しは API モードに依存する）

### ビジョン: 画像送信（添付ファイル → マルチモーダルメッセージ）

画像プローブを実行するため、`OPENCLAW_LIVE_GATEWAY_MODELS` に少なくとも 1 つの画像対応モデル（Claude/Gemini/OpenAI のビジョン対応バリアントなど）を含める。

### アグリゲーター / 代替 Gateway

キーを有効にしている場合は、以下経由のテストにも対応している:

- OpenRouter: `openrouter/...`（数百のモデル。ツール + 画像対応候補を見つけるには `openclaw models scan` を使用する）
- OpenCode: Zen 用の `opencode/...` と Go 用の `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 経由）

ライブマトリクスに含められるその他のプロバイダー（認証情報/設定がある場合）:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（クラウド/API）、および任意の OpenAI/Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

<Tip>
ドキュメントに「すべてのモデル」をハードコードしない。信頼できるリストは、あなたのマシンで `discoverModels(...)` が返すものと、利用可能なキーである。
</Tip>

## 認証情報（絶対にコミットしない）

ライブテストは CLI と同じ方法で認証情報を検出する。実際上の意味:

- CLI が動作する場合、ライブテストは同じキーを見つけるはずです。
- ライブテストが「no creds」と表示する場合は、`openclaw models list` / モデル選択をデバッグするのと同じ方法でデバッグしてください。

- エージェントごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（これがライブテストで「プロファイルキー」が意味するものです）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー状態ディレクトリ: `~/.openclaw/credentials/`（存在する場合はステージングされたライブホームにコピーされますが、メインのプロファイルキー保存先ではありません）
- ローカルのライブ実行では、デフォルトでアクティブな設定、エージェントごとの `auth-profiles.json` ファイル、レガシー `credentials/`、および対応している外部 CLI 認証ディレクトリを一時テストホームにコピーします。ステージングされたライブホームでは `workspace/` と `sandboxes/` をスキップし、`agents.*.workspace` / `agentDir` のパス上書きは削除されるため、プローブは実際のホストワークスペースから外れた状態を保ちます。

環境キー（例: `~/.profile` でエクスポート済み）に依存したい場合は、`source ~/.profile` の後にローカルテストを実行するか、下記の Docker ランナーを使用してください（コンテナ内に `~/.profile` をマウントできます）。

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
- スコープ:
  - バンドルされた comfy の画像、動画、`music_generate` パスを実行します
  - `plugins.entries.comfy.config.<capability>` が設定されていない限り、各機能をスキップします
  - comfy ワークフロー送信、ポーリング、ダウンロード、または Plugin 登録を変更した後に有用です

## 画像生成ライブ

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- スコープ:
  - 登録済みのすべての画像生成プロバイダー Plugin を列挙します
  - プローブ前にログインシェル（`~/.profile`）から不足しているプロバイダー環境変数を読み込みます
  - デフォルトでは保存済み認証プロファイルよりライブ/API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 設定済みの各プロバイダーを共有画像生成ランタイム経由で実行します:
    - `<provider>:generate`
    - プロバイダーが編集対応を宣言している場合は `<provider>:edit`
- 対象となる現在のバンドル済みプロバイダー:
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

出荷済み CLI パスについては、プロバイダー/ランタイムのライブテストが通った後に `infer` スモークを追加してください:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

これは CLI 引数の解析、設定/デフォルトエージェントの解決、バンドル済み
Plugin の有効化、共有画像生成ランタイム、ライブプロバイダー
リクエストを対象にします。Plugin 依存関係はランタイム読み込み前に存在していることが期待されます。

## 音楽生成ライブ

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- スコープ:
  - 共有バンドル済み音楽生成プロバイダーパスを実行します
  - 現在は Google と MiniMax を対象にします
  - プローブ前にログインシェル（`~/.profile`）からプロバイダー環境変数を読み込みます
  - デフォルトでは保存済み認証プロファイルよりライブ/API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 利用可能な場合、宣言された両方のランタイムモードを実行します:
    - プロンプトのみの入力で `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合は `edit`
  - 現在の共有レーンの対象範囲:
    - `google`: `generate`、`edit`
    - `minimax`: `generate`
    - `comfy`: 別個の Comfy ライブファイル。この共有スイープではありません
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視します

## 動画生成ライブ

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- スコープ:
  - 共有バンドル済み動画生成プロバイダーパスを実行します
  - デフォルトではリリースセーフなスモークパスを使用します: FAL 以外のプロバイダー、プロバイダーごとに 1 件のテキストから動画へのリクエスト、1 秒のロブスタープロンプト、および `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（デフォルトは `180000`）によるプロバイダーごとの操作上限
  - プロバイダー側のキュー遅延がリリース時間を支配する可能性があるため、デフォルトでは FAL をスキップします。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - プローブ前にログインシェル（`~/.profile`）からプロバイダー環境変数を読み込みます
  - デフォルトでは保存済み認証プロファイルよりライブ/API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - デフォルトでは `generate` のみを実行します
  - 利用可能な場合に宣言済みの変換モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言しており、選択されたプロバイダー/モデルが共有スイープでバッファーベースのローカル画像入力を受け付ける場合は `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言しており、選択されたプロバイダー/モデルが共有スイープでバッファーベースのローカル動画入力を受け付ける場合は `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - バンドル済みの `veo3` はテキストのみで、バンドル済みの `kling` はリモート画像 URL を必要とするため、`vydra`
  - Vydra 固有の対象範囲:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - そのファイルは、デフォルトでリモート画像 URL フィクスチャを使用する `kling` レーンに加えて、`veo3` のテキストから動画を実行します
  - 現在の `videoToVideo` ライブ対象範囲:
    - 選択されたモデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - これらのパスは現在、リモート `http(s)` / MP4 参照 URL を必要とするため、`alibaba`、`qwen`、`xai`
    - 現在の共有 Gemini/Veo レーンはローカルのバッファーベース入力を使用しており、そのパスは共有スイープで受け付けられないため、`google`
    - 現在の共有レーンには組織固有の動画インペイント/リミックスアクセス保証がないため、`openai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL を含むデフォルトスイープのすべてのプロバイダーを含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 積極的なスモーク実行で各プロバイダーの操作上限を短縮するには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視します

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 1 つのリポジトリネイティブなエントリーポイントを通じて、共有画像、音楽、動画のライブスイートを実行します
  - `~/.profile` から不足しているプロバイダー環境変数を自動読み込みします
  - デフォルトでは、現在使用可能な認証を持つプロバイダーに各スイートを自動で絞り込みます
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と静音モードの動作は一貫したままです
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [テスト](/ja-JP/help/testing) — 単体、統合、QA、Docker スイート
