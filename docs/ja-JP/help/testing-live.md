---
read_when:
    - ライブモデルマトリックス / CLI バックエンド / ACP / メディアプロバイダーのスモークを実行する
    - ライブテスト認証情報解決のデバッグ
    - 新しいプロバイダー固有のライブテストを追加する
sidebarTitle: Live tests
summary: 'ライブ（ネットワークに接続する）テスト: モデルマトリクス、CLI バックエンド、ACP、メディアプロバイダー、認証情報'
title: 'テスト: ライブスイート'
x-i18n:
    generated_at: "2026-06-28T20:43:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 087ec52b395131889d4ae113f304d71199c58dc9f61a1a5e1e511ae4c5b48c0b
    source_path: help/testing-live.md
    workflow: 16
---

クイックスタート、QA ランナー、ユニット/統合スイート、Docker フローについては、
[テスト](/ja-JP/help/testing)を参照してください。このページでは、**ライブ**（ネットワークに触れる）テスト
スイートを扱います。モデルマトリックス、CLI バックエンド、ACP、メディアプロバイダーのライブテスト、
および認証情報の扱いです。

## ライブ: ローカルスモークコマンド

アドホックなライブチェックの前に、必要なプロバイダーキーをプロセス環境にエクスポートします。

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

`voicecall smoke` は、`--yes` も指定されていない限りドライランです。実際に通知通話を発信する意図がある場合にのみ `--yes` を使用してください。Twilio、Telnyx、Plivo では、準備チェックが成功するには公開 Webhook URL が必要です。ローカルのみのループバック/プライベートフォールバックは設計上拒否されます。

## ライブ: Android ノード機能スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続済み Android ノードが**現在広告しているすべてのコマンド**を呼び出し、コマンド契約の動作を検証する。
- スコープ:
  - 事前条件付き/手動セットアップ（このスイートはアプリのインストール/実行/ペアリングを行いません）。
  - 選択した Android ノードに対する、コマンドごとの Gateway `node.invoke` 検証。
- 必要な事前セットアップ:
  - Android アプリがすでに Gateway に接続済み + ペアリング済み。
  - アプリをフォアグラウンドに維持。
  - 合格を期待する機能について、権限/キャプチャ同意を付与済み。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android セットアップの全詳細: [Android アプリ](/ja-JP/platforms/android)

## ライブ: モデルスモーク（プロファイルキー）

ライブテストは、障害を切り分けられるように 2 つのレイヤーに分かれています。

- 「直接モデル」は、指定されたキーでプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gateway スモーク」は、そのモデルについて Gateway+エージェントのパイプライン全体（セッション、履歴、ツール、サンドボックスポリシーなど）が動作するかを示します。

### レイヤー 1: 直接モデル補完（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使用して、認証情報があるモデルを選択する
  - モデルごとに小さな補完を実行する（必要に応じて対象を絞ったリグレッションも実行）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`、`small`、または `all`（modern のエイリアス）を設定します。設定しない場合、`pnpm test:live` を Gateway スモークに集中させるためスキップされます
- モデルの選択方法:
  - `OPENCLAW_LIVE_MODELS=modern` でモダン許可リスト（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 5.1、MiniMax M3、Grok 4.3）を実行
  - `OPENCLAW_LIVE_MODELS=small` で制約付き小型モデル許可リスト（Qwen 8B/9B ローカル互換ルート、Ollama Gemma、OpenRouter Qwen/GLM、Z.AI GLM）を実行
  - `OPENCLAW_LIVE_MODELS=all` はモダン許可リストのエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."`（カンマ区切り許可リスト）
  - ローカル Ollama 小型モデル実行のデフォルトは `http://127.0.0.1:11434` です。LAN、カスタム、または Ollama Cloud エンドポイントの場合にのみ `OPENCLAW_LIVE_OLLAMA_BASE_URL` を設定します。
  - modern/all と small のスイープは、デフォルトでそれぞれのキュレートされた上限を使用します。選択プロファイルの網羅的スイープには `OPENCLAW_LIVE_MAX_MODELS=0` を、より小さい上限には正の数を設定します。
  - 網羅的スイープは、直接モデルテスト全体のタイムアウトとして `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使用します。デフォルト: 60 分。
  - 直接モデルプローブはデフォルトで 20 並列で実行されます。上書きするには `OPENCLAW_LIVE_MODEL_CONCURRENCY` を設定します。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り許可リスト）
- キーの取得元:
  - デフォルト: プロファイルストアと env フォールバック
  - **プロファイルストア**のみに強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定
- これが存在する理由:
  - 「プロバイダー API が壊れている / キーが無効」と「Gateway エージェントパイプラインが壊れている」を分離する
  - 小さく分離されたリグレッションを含む（例: OpenAI Responses/Codex Responses の推論リプレイ + ツール呼び出しフロー）

### レイヤー 2: Gateway + dev エージェントスモーク（"@openclaw" が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内 Gateway を起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとにモデルを上書き）
  - キーがあるモデルを反復処理し、次を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが動作する（read プローブ）
    - 任意の追加ツールプローブ（exec+read プローブ）
    - OpenAI リグレッションパス（ツール呼び出しのみ → フォローアップ）が動作し続ける
- プローブ詳細（障害をすばやく説明できるように）:
  - `read` プローブ: テストはワークスペースに nonce ファイルを書き込み、エージェントにそれを `read` して nonce をエコーバックするよう依頼します。
  - `exec+read` プローブ: テストはエージェントに temp ファイルへ nonce を `exec` で書き込ませ、その後 `read` で読み戻させます。
  - 画像プローブ: テストは生成された PNG（cat + ランダム化コード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `test/helpers/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: モダン許可リスト（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M3、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` で、同じ制約付き小型モデル許可リストを Gateway+エージェントパイプライン全体で実行
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` はモダン許可リストのエイリアスです
  - または絞り込むために `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定
  - modern/all と small の Gateway スイープは、デフォルトでそれぞれのキュレートされた上限を使用します。選択スイープの網羅実行には `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を、より小さい上限には正の数を設定します。
- プロバイダーの選択方法（「OpenRouter everything」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り許可リスト）
- このライブテストではツール + 画像プローブは常に有効です:
  - `read` プローブ + `exec+read` プローブ（ツールストレス）
  - モデルが画像入力対応を広告している場合、画像プローブが実行されます
  - フロー（概要）:
    - テストが "CAT" + ランダムコード入りの小さな PNG を生成（`test/helpers/live-image-probe.ts`）
    - `agent` 経由で `attachments: [{ mimeType: "image/png", content: "<base64>" }]` として送信
    - Gateway が添付を `images[]` に解析（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 埋め込みエージェントがマルチモーダルユーザーメッセージをモデルへ転送
    - アサーション: 返信に `cat` + コードが含まれる（OCR 許容: 軽微な誤りは許可）

<Tip>
自分のマシンでテストできるもの（および正確な `provider/model` ID）を確認するには、次を実行します:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## ライブ: CLI バックエンドスモーク（Claude、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定に触れずに、ローカル CLI バックエンドを使用して Gateway + エージェントパイプラインを検証する。
- バックエンド固有のスモークデフォルトは、所有する拡張機能の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトプロバイダー/モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド/引数/画像の動作は、所有する CLI バックエンド Plugin メタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` で実際の画像添付を送信（パスはプロンプトに注入されます）。Docker レシピでは、明示的に要求されない限りデフォルトでオフです。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` で、プロンプト注入の代わりに画像ファイルパスを CLI 引数として渡します。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）で、`IMAGE_ARG` が設定されている場合の画像引数の渡し方を制御します。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` で 2 ターン目を送信し、再開フローを検証します。
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` で、選択モデルが切り替え先をサポートしている場合に Claude Sonnet -> Opus の同一セッション継続性プローブへオプトインします。Docker レシピでは、集約信頼性のためデフォルトでオフです。
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` で MCP/ツールの loopback プローブへオプトインします。Docker レシピでは、明示的に要求されない限りデフォルトでオフです。

例:

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

安価な Gemini MCP 設定スモーク:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

これは Gemini に応答生成を求めません。OpenClaw が Gemini に渡すものと同じシステム設定を書き込み、その後 `gemini --debug mcp list` を実行して、保存済みの `transport: "streamable-http"` サーバーが Gemini の HTTP MCP 形状に正規化され、ローカルの streamable-HTTP MCP サーバーへ接続できることを証明します。

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

注:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- リポジトリの Docker イメージ内で、非 root の `node` ユーザーとしてライブ CLI バックエンドスモークを実行します。
- 所有する拡張機能から CLI スモークメタデータを解決し、その後対応する Linux CLI パッケージ（`@anthropic-ai/claude-code` または `@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）にあるキャッシュ済みの書き込み可能プレフィックスへインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`claudeAiOauth.subscriptionType` を含む `~/.claude/.credentials.json`、または `claude setup-token` からの `CLAUDE_CODE_OAUTH_TOKEN` のいずれかによる、ポータブルな Claude Code サブスクリプション OAuth が必要です。まず Docker 内で直接 `claude -p` を証明し、その後 Anthropic API キーの env vars を保持せずに Gateway CLI バックエンドの 2 ターンを実行します。このサブスクリプションレーンは、サインイン済みサブスクリプションの使用量上限を消費し、Anthropic が OpenClaw リリースなしに Claude Agent SDK / `claude -p` の課金およびレート制限動作を変更できるため、Claude MCP/ツールおよび画像プローブをデフォルトで無効化します。
- ライブ CLI バックエンドスモークは、Claude と Gemini で同じエンドツーエンドフローを実行するようになりました。テキストターン、画像分類ターン、その後 Gateway CLI 経由で検証される MCP `cron` ツール呼び出しです。
- Claude のデフォルトスモークは、セッションを Sonnet から Opus にパッチし、再開されたセッションが以前のメモをまだ覚えていることも検証します。

## ライブ: APNs HTTP/2 プロキシ到達性

- テスト: `src/infra/push-apns-http2.live.test.ts`
- 目的: ローカル HTTP CONNECT プロキシを経由して Apple のサンドボックス APNs エンドポイントへトンネルし、APNs HTTP/2 検証リクエストを送信し、Apple の実際の `403 InvalidProviderToken` 応答がプロキシ経路を通って返ることを検証する。
- 有効化:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 任意のタイムアウト:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## ライブ: ACP バインドスモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: ライブ ACP エージェントで実際の ACP 会話バインドフローを検証する:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成メッセージチャネル会話をその場でバインドする
  - 同じ会話で通常のフォローアップを送信する
  - フォローアップがバインド済み ACP セッショントランスクリプトに届くことを確認する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP エージェント: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP エージェント: `claude`
  - 合成チャネル: Slack DM 形式の会話コンテキスト
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
  - このレーンは、テストが外部配信を装わずにメッセージチャネルコンテキストを添付できるよう、管理者専用の合成 originating-route フィールド付きで gateway `chat.send` サーフェスを使用する。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP ハーネスエージェントに対して、組み込み `acpx` Plugin の内蔵エージェントレジストリを使用する。
  - バインド済みセッションの cron MCP 作成は、デフォルトではベストエフォートである。外部 ACP ハーネスはバインド/画像の証明が通った後に MCP 呼び出しをキャンセルできるためである。このバインド後 cron プローブを厳格にするには、`OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` を設定する。

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
- デフォルトでは、ACP バインドスモークを集約ライブ CLI エージェントに対して順番に実行する: `claude`、`codex`、次に `gemini`。
- マトリクスを絞るには、`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使用する。
- 一致する CLI 認証素材をコンテナにステージングし、要求されたライブ CLI（`@anthropic-ai/claude-code`、`@openai/codex`、`https://app.factory.ai/cli` 経由の Factory Droid、`@google/gemini-cli`、または `opencode-ai`）がなければインストールする。ACP バックエンド自体は公式 `acpx` Plugin の組み込み `acpx/runtime` パッケージである。
- Droid Docker バリアントは設定用に `~/.factory` をステージングし、`FACTORY_API_KEY` を転送し、その API キーを必須とする。ローカルの Factory OAuth/keyring 認証はコンテナに移植できないためである。ACPX の内蔵 `droid exec --output-format acp` レジストリエントリを使用する。
- OpenCode Docker バリアントは厳格な単一エージェント回帰レーンである。`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（デフォルト `opencode/kimi-k2.6`）から一時的な `OPENCODE_CONFIG_CONTENT` デフォルトモデルを書き込み、`pnpm test:docker:live-acp-bind:opencode` は汎用的なバインド後スキップを受け入れず、バインド済みアシスタントトランスクリプトを必須とする。
- 直接の `acpx` CLI 呼び出しは、Gateway 外で挙動を比較するための手動/回避策パスにすぎない。Docker ACP バインドスモークは OpenClaw の組み込み `acpx` ランタイムバックエンドを実行する。

## ライブ: Codex アプリサーバーハーネススモーク

- 目的: 通常の gateway
  `agent` メソッドを通して Plugin 所有の Codex ハーネスを検証する:
  - バンドルされた `codex` Plugin を読み込む
  - `openai/gpt-5.5` を選択する。これにより OpenAI エージェントターンはデフォルトで Codex 経由にルーティングされる
  - Codex ハーネスを選択した状態で、最初の gateway エージェントターンを `openai/gpt-5.5` に送信する
  - 同じ OpenClaw セッションに 2 回目のターンを送信し、アプリサーバー
    スレッドを再開できることを確認する
  - 同じ gateway コマンドパスを通して `/codex status` と `/codex models` を実行する
  - 任意で、Guardian レビュー済みの権限昇格シェルプローブを 2 つ実行する: 承認されるべき無害な
    コマンド 1 つと、拒否されてエージェントが聞き返すべき偽シークレットアップロード 1 つ
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `openai/gpt-5.5`
- 任意の画像プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/tool プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークは provider/model `agentRuntime.id: "codex"` を強制するため、壊れた Codex
  ハーネスが OpenClaw に静かにフォールバックして通ることはできない。
- 認証: ローカル Codex サブスクリプションログインによる Codex アプリサーバー認証。Docker
  スモークでは、該当する場合に非 Codex プローブ用の `OPENAI_API_KEY` も提供でき、
  任意でコピー済みの `~/.codex/auth.json` と `~/.codex/config.toml` も使用できる。

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
- `OPENAI_API_KEY` を渡し、存在する場合は Codex CLI 認証ファイルをコピーし、書き込み可能なマウント済み npm
  prefix に `@openai/codex` をインストールし、ソースツリーをステージングしてから、Codex ハーネスのライブテストのみを実行する。
- Docker は画像、MCP/tool、Guardian プローブをデフォルトで有効にする。より狭いデバッグ
  実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定する。
- Docker は同じ明示的な Codex ランタイム設定を使用するため、レガシーエイリアスや OpenClaw
  フォールバックで Codex ハーネス回帰を隠すことはできない。

### 推奨ライブレシピ

狭く明示的な allowlist が最速で、最も不安定になりにくい:

- 単一モデル、直接（gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型モデルの直接プロファイル:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小型モデルの gateway プロファイル:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API スモーク:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 単一モデル、gateway スモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダー横断の tool calling:
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
- `google-antigravity/...` は Antigravity OAuth ブリッジ（Cloud Code Assist 形式のエージェントエンドポイント）を使用する。
- `google-gemini-cli/...` は自分のマシン上のローカル Gemini CLI を使用する（別個の認証 + ツールの癖）。
- Gemini API と Gemini CLI:
  - API: OpenClaw は HTTP 経由で Google のホスト型 Gemini API を呼び出す（API キー / プロファイル認証）。これは多くのユーザーが「Gemini」と呼ぶもの。
  - CLI: OpenClaw はローカルの `gemini` バイナリを shell out する。独自の認証を持ち、挙動が異なる場合がある（ストリーミング/tool サポート/バージョンずれ）。

## ライブ: モデルマトリクス（カバー対象）

固定の「CI モデルリスト」はない（ライブは opt-in）が、これらはキーを持つ開発マシンで定期的にカバーすることを**推奨**するモデルである。

### モダンスモークセット（tool calling + 画像）

これは、動作し続けることを期待する「一般的なモデル」の実行である:

- OpenAI（非 Codex）: `openai/gpt-5.5`
- OpenAI ChatGPT/Codex OAuth: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro`
- Z.AI（GLM）: `zai/glm-5.1`（汎用 API）または `zai/glm-5.2`（Coding Plan）
- MiniMax: `minimax/MiniMax-M3`

tools + 画像付きで gateway スモークを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool calling（Read + 任意の Exec）

プロバイダーファミリーごとに少なくとも 1 つ選ぶ:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI（GLM）: `zai/glm-5.1`（汎用 API）または `zai/glm-5.2`（Coding Plan）
- MiniMax: `minimax/MiniMax-M3`

任意の追加カバレッジ（あると望ましい）:

- xAI: `xai/grok-4.3`（または利用可能な最新）
- Mistral: `mistral/`…（有効化している「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセス権がある場合）
- LM Studio: `lmstudio/`…（ローカル。tool calling は API モードに依存する）

### Vision: 画像送信（添付 → マルチモーダルメッセージ）

画像プローブを実行するため、`OPENCLAW_LIVE_GATEWAY_MODELS` に画像対応モデルを少なくとも 1 つ含める（Claude/Gemini/OpenAI の vision 対応バリアントなど）。

### アグリゲーター / 代替 gateway

キーを有効化している場合、次経由のテストもサポートする:

- OpenRouter: `openrouter/...`（数百のモデル。tool+画像対応候補を見つけるには `openclaw models scan` を使用する）
- OpenCode: Zen 用の `opencode/...` と Go 用の `opencode-go/...`（`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 経由の認証）

ライブマトリクスに含められる追加プロバイダー（認証情報/設定がある場合）:

- 組み込み: `openai`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（クラウド/API）に加え、任意の OpenAI/Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

<Tip>
ドキュメント内で「すべてのモデル」をハードコードしないでください。信頼できる一覧は、手元のマシンで `discoverModels(...)` が返すものに、利用可能なキーを加えたものです。
</Tip>

## 認証情報（絶対にコミットしない）

ライブテストは CLI と同じ方法で認証情報を検出します。実務上の意味は次のとおりです。

- CLI が動作する場合、ライブテストも同じキーを見つけるはずです。
- ライブテストが「認証情報なし」と表示する場合は、`openclaw models list` / モデル選択をデバッグする場合と同じ方法でデバッグしてください。

- エージェントごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（ライブテストでいう「プロファイルキー」はこれを意味します）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー状態ディレクトリ: `~/.openclaw/credentials/`（存在する場合はステージングされたライブホームへコピーされますが、メインのプロファイルキー保存先ではありません）
- ローカルのライブ実行では、既定でアクティブな設定、エージェントごとの `auth-profiles.json` ファイル、レガシー `credentials/`、サポート対象の外部 CLI 認証ディレクトリを一時テストホームへコピーします。ステージングされたライブホームでは `workspace/` と `sandboxes/` をスキップし、`agents.*.workspace` / `agentDir` のパス上書きは削除されるため、プローブが実ホストのワークスペースに触れません。

環境変数キーに依存したい場合は、ローカルテストの前にエクスポートするか、
明示的な `OPENCLAW_PROFILE_FILE` を指定して下記の Docker ランナーを使用してください。

## Deepgram ライブ（音声文字起こし）

- テスト: `extensions/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus コーディングプランのライブ

- テスト: `extensions/byteplus/live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI ワークフローメディアのライブ

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
  - プローブ前に、すでにエクスポート済みのプロバイダー環境変数を使用します
  - 既定では保存済み認証プロファイルよりもライブ/環境変数 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーはスキップします
  - 設定済みの各プロバイダーを共有画像生成ランタイム経由で実行します:
    - `<provider>:generate`
    - プロバイダーが編集サポートを宣言している場合は `<provider>:edit`
- 対象の現在のバンドル済みプロバイダー:
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

出荷済み CLI パスについては、プロバイダー/ランタイムのライブテストが通過した後に
`infer` スモークを追加してください:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

これは CLI 引数の解析、設定/既定エージェントの解決、バンドル済み
Plugin の有効化、共有画像生成ランタイム、ライブプロバイダー
リクエストをカバーします。Plugin 依存関係は、ランタイム読み込み前に存在していることが期待されます。

## 音楽生成ライブ

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- 範囲:
  - 共有のバンドル済み音楽生成プロバイダーパスを実行します
  - 現在は Google と MiniMax をカバーします
  - プローブ前に、すでにエクスポート済みのプロバイダー環境変数を使用します
  - 既定では保存済み認証プロファイルよりもライブ/環境変数 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーはスキップします
  - 利用可能な場合は、宣言された両方のランタイムモードを実行します:
    - プロンプトのみの入力で `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合は `edit`
  - 現在の共有レーンのカバレッジ:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 個別の Comfy ライブファイルで扱い、この共有スイープでは扱いません
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
  - 共有のバンドル済み動画生成プロバイダーパスを実行します
  - 既定ではリリース向けに安全なスモークパスを使用します: FAL 以外のプロバイダー、プロバイダーごとに 1 件のテキストから動画へのリクエスト、1 秒のロブスタープロンプト、`OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` から取得するプロバイダーごとの操作上限（既定は `180000`）
  - FAL は、プロバイダー側のキュー待ち時間がリリース時間の大半を占める可能性があるため既定でスキップします。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - プローブ前に、すでにエクスポート済みのプロバイダー環境変数を使用します
  - 既定では保存済み認証プロファイルよりもライブ/環境変数 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーはスキップします
  - 既定では `generate` のみ実行します
  - 利用可能な場合に宣言済みの変換モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有スイープでバッファベースのローカル画像入力を受け付ける場合は `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有スイープでバッファベースのローカル動画入力を受け付ける場合は `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - `vydra`: バンドル済みの `veo3` はテキストのみで、バンドル済みの `kling` はリモート画像 URL を必要とするため
  - プロバイダー固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは、既定で `veo3` のテキストから動画へのレーンに加え、リモート画像 URL フィクスチャを使用する `kling` レーンを実行します
  - 現在の `videoToVideo` ライブカバレッジ:
    - 選択されたモデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`, `qwen`, `xai`: これらのパスは現在、リモートの `http(s)` / MP4 参照 URL を必要とするため
    - `google`: 現在の共有 Gemini/Veo レーンはローカルのバッファベース入力を使用しており、そのパスは共有スイープで受け付けられないため
    - `openai`: 現在の共有レーンには、組織固有の動画編集アクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` で、FAL を含むすべてのプロバイダーを既定スイープに含めます
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` で、積極的なスモーク実行向けに各プロバイダー操作上限を短縮します
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視します

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の画像、音楽、動画ライブスイートを、単一のリポジトリネイティブなエントリポイント経由で実行します
  - すでにエクスポート済みのプロバイダー環境変数を使用します
  - 既定では、現在利用可能な認証を持つプロバイダーに各スイートを自動的に絞り込みます
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と静音モードの動作は一貫します
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [テスト](/ja-JP/help/testing) - ユニット、統合、QA、Docker スイート
