---
read_when:
    - ライブモデルマトリクス / CLI バックエンド / ACP / media-provider スモークの実行
    - ライブテストの認証情報解決のデバッグ
    - 新しいプロバイダー固有のライブテストを追加する
sidebarTitle: Live tests
summary: 'ライブ（ネットワークに接続する）テスト: モデルマトリックス、CLIバックエンド、ACP、メディアプロバイダー、認証情報'
title: 'テスト: ライブスイート'
x-i18n:
    generated_at: "2026-07-05T11:29:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de398a9334b060c2f1e520487cbf945589fb39e57cc7804a27b8a19de96c47a4
    source_path: help/testing-live.md
    workflow: 16
---

クイックスタート、QA ランナー、ユニット/統合スイート、Docker フローについては、
[テスト](/ja-JP/help/testing)を参照してください。このページでは、**ライブ**（ネットワークに触れる）テストを扱います:
モデルマトリクス、CLI バックエンド、ACP、メディアプロバイダー、認証情報の扱い。

## ライブ: ローカルスモークコマンド

アドホックなライブチェックの前に、必要なプロバイダーキーをプロセス環境へエクスポートします。

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

`voicecall smoke` は、`--yes` も指定されていない限りドライランです。実際に発信するつもりがある場合にのみ `--yes` を使ってください。Twilio、Telnyx、Plivo では、準備チェックが成功するには公開 Webhook URL が必要です。ローカル/プライベートの loopback URL は、これらのプロバイダーから到達できないため拒否されます。

## ライブ: Android ノード capability スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続済み Android ノードが**現在広告しているすべてのコマンド**を呼び出し、コマンド契約の動作を検証します。
- スコープ:
  - 事前条件付き/手動セットアップ（このスイートはアプリのインストール/実行/ペアリングを行いません）。
  - 選択した Android ノードに対するコマンドごとの gateway `node.invoke` 検証。
- 必須の事前セットアップ:
  - Android アプリがすでに gateway に接続され、ペアリング済みであること。
  - アプリをフォアグラウンドに保つこと。
  - 成功を期待する capability について、権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android セットアップの詳細: [Android アプリ](/ja-JP/platforms/android)

## ライブ: モデルスモーク（プロファイルキー）

ライブモデルテストは、失敗を分離できるように 2 つのレイヤーに分かれています:

- 「直接モデル」は、指定されたキーでプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gateway スモーク」は、そのモデルで gateway+agent パイプライン全体が動作するかを示します（セッション、履歴、ツール、サンドボックスポリシーなど）。

以下の curated モデルリストは `src/agents/live-model-filter.ts` にあり、時間とともに変わります。このページではなく、そこの配列を信頼できる情報源として扱ってください。

MiniMax M3 は、デフォルトのプロバイダー/モデル参照として `minimax/MiniMax-M3` を使います。

### レイヤー 1: 直接モデル completion（gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って認証情報があるモデルを選択する
  - モデルごとに小さな completion を実行する（必要に応じて対象を絞ったリグレッションも実行）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`、`small`、または `all`（`modern` のエイリアス）を設定します。そうしない場合はスキップされるため、`pnpm test:live` 単体では gateway スモークに集中します。
- モデルの選択方法:
  - `OPENCLAW_LIVE_MODELS=modern` は curated された高シグナル優先リストを実行します（[ライブ: モデルマトリクス](#live-model-matrix-what-we-cover)を参照）
  - `OPENCLAW_LIVE_MODELS=small` は curated された小型モデル優先リストを実行します
  - `OPENCLAW_LIVE_MODELS=all` は `modern` のエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."`（カンマ区切りの許可リスト）
  - ローカル Ollama の小型モデル実行はデフォルトで `http://127.0.0.1:11434` を使います。LAN、カスタム、または Ollama Cloud エンドポイントの場合にのみ `OPENCLAW_LIVE_OLLAMA_BASE_URL` を設定します。
  - modern/all と small のスイープは、デフォルトで curated リストの長さを上限にします。選択プロファイルの網羅的なスイープには `OPENCLAW_LIVE_MAX_MODELS=0` を設定し、より小さい上限には正の数を設定します。
  - 網羅的なスイープでは、直接モデルテスト全体のタイムアウトに `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使います。デフォルト: 60 分。
  - 直接モデルプローブはデフォルトで 20 並列で実行されます。上書きするには `OPENCLAW_LIVE_MODEL_CONCURRENCY` を設定します。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りの許可リスト）
- キーの取得元:
  - デフォルト: プロファイルストアと env フォールバック
  - **プロファイルストア**のみに強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定します
- これが存在する理由:
  - 「プロバイダー API が壊れている / キーが無効」と「gateway agent パイプラインが壊れている」を分離します
  - 小さく分離されたリグレッションを含みます（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + dev agent スモーク（「@openclaw」が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - インプロセス gateway を起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとにモデルを上書き）
  - キーがあるモデルを反復処理し、次を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが動作する（read プローブ）
    - 任意の追加ツールプローブ（exec+read プローブ）
    - OpenAI リグレッションパス（tool-call-only -> follow-up）が動作し続ける
- プローブの詳細（失敗をすばやく説明できるように）:
  - `read` プローブ: テストが workspace に nonce ファイルを書き込み、agent にそれを `read` して nonce をそのまま返すよう依頼します。
  - `exec+read` プローブ: テストが agent に一時ファイルへ nonce を `exec` で書き込ませ、その後それを `read` で読み戻させます。
  - 画像プローブ: テストが生成された PNG（cat + ランダム化されたコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `test/helpers/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: curated された高シグナル（`modern`）優先リスト
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` は curated された小型モデルリストを gateway+agent パイプライン全体で実行します
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は `modern` のエイリアスです
  - または、絞り込むために `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定します
  - modern/all と small の gateway スイープは、デフォルトで curated リストの長さを上限にします。選択スイープを網羅的に行うには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を設定し、より小さい上限には正の数を設定します。
- プロバイダーの選択方法（「OpenRouter のすべて」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りの許可リスト）
- ツール + 画像プローブは、このライブテストでは常に有効です:
  - `read` プローブ + `exec+read` プローブ（ツール負荷）
  - モデルが画像入力サポートを広告している場合、画像プローブが実行されます
  - フロー（概要）:
    - テストが「CAT」+ ランダムコードを含む小さな PNG を生成します（`test/helpers/live-image-probe.ts`）
    - `agent` 経由で `attachments: [{ mimeType: "image/png", content: "<base64>" }]` として送信します
    - Gateway が添付を `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 埋め込み agent がマルチモーダル user message をモデルへ転送します
    - 検証: 返信に `cat` + コードが含まれること（OCR 許容: 軽微な誤りは許容）

<Tip>
自分のマシンで何をテストできるか（および正確な `provider/model` id）を確認するには、次を実行します:

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## ライブ: CLI バックエンドスモーク（Claude、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定に触れずに、ローカル CLI バックエンドを使って Gateway + agent パイプラインを検証します。
- バックエンド固有のスモークデフォルトは、所有 Plugin の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトのプロバイダー/モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド/引数/画像の動作は、所有 CLI バックエンド Plugin メタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - 実際の画像添付を送信するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。Docker レシピではデフォルトでオフです。
  - プロンプト注入ではなく CLI 引数として画像ファイルパスを渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されている場合に画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 ターン目を送信して resume フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - 選択したモデルが切り替え先をサポートしている場合、Claude Sonnet -> Opus の同一セッション継続性プローブにオプトインするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`。Docker レシピを含め、デフォルトではオフです。
  - MCP/tool loopback プローブにオプトインするには `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`。Docker レシピではデフォルトでオフです。

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

単一プロバイダーの Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

注記:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- リポジトリの Docker イメージ内で、非 root の `node` ユーザーとしてライブ CLI バックエンドスモークを実行します。
- 所有 Plugin から CLI スモークメタデータを解決し、その後対応する Linux CLI パッケージ（`@anthropic-ai/claude-code` または `@google/gemini-cli`）を `OPENCLAW_DOCKER_CLI_TOOLS_DIR` のキャッシュ済み書き込み可能 prefix にインストールします（デフォルト: `~/.cache/openclaw/docker-cli-tools`）。
- `codex-cli` はもはやバンドルされた CLI バックエンドではありません。代わりに Codex app-server ランタイムで `openai/*` を使ってください（[ライブ: Codex app-server ハーネススモーク](#live-codex-app-server-harness-smoke)を参照）。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`claudeAiOauth.subscriptionType` を含む `~/.claude/.credentials.json` または `claude setup-token` からの `CLAUDE_CODE_OAUTH_TOKEN` による、ポータブルな Claude Code サブスクリプション OAuth が必要です。まず Docker 内で直接 `claude -p` を証明し、その後 Anthropic API キーの env var を保持せずに Gateway CLI バックエンドを 2 ターン実行します。このサブスクリプションレーンでは、Claude MCP/tool と画像プローブはデフォルトで無効です。これは、サインイン済みサブスクリプションの使用上限を消費し、Anthropic が OpenClaw のリリースなしに Claude Agent SDK / `claude -p` の課金およびレート制限動作を変更できるためです。
- Claude と Gemini は、上記のフラグを通じて同じプローブセット（テキストターン、画像分類、MCP `cron` ツール呼び出し、モデル切り替え継続性）をサポートしますが、これらのプローブはいずれもデフォルトでは実行されません。必要に応じてフラグごとにオプトインしてください。

## ライブ: APNs HTTP/2 プロキシ到達性

- テスト: `src/infra/push-apns-http2.live.test.ts`
- 目的: ローカル HTTP CONNECT プロキシ経由で Apple の sandbox APNs エンドポイントへトンネルし、APNs HTTP/2 検証リクエストを送信し、Apple の実際の `403 InvalidProviderToken` 応答がプロキシパス経由で返ってくることを検証します。
- 有効化:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 任意のタイムアウト:
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## ライブ: ACP bind スモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: ライブ ACP エージェントで実際の ACP 会話バインドフローを検証する:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成メッセージチャネル会話をその場でバインドする
  - 同じ会話で通常のフォローアップを送信する
  - フォローアップがバインド済み ACP セッションのトランスクリプトに到達することを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP エージェント: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` を実行する場合の ACP エージェント: `claude`
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
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1`（または `on`/`true`/`yes`）で画像プローブを強制的にオンにする。それ以外の値は強制的にオフにする。`opencode` 以外のすべてのエージェントではデフォルトで実行される。
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- 注記:
  - このレーンは、テストが外部配信を装わずにメッセージチャネルのコンテキストを添付できるよう、管理者専用の合成 originating-route フィールドを使って Gateway の `chat.send` サーフェスを使用する。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP ハーネスエージェントについて、組み込み `acpx` plugin の内蔵エージェントレジストリを使用する。
  - バインド済みセッションの cron MCP 作成はデフォルトでベストエフォート。これは、外部 ACP ハーネスがバインド/画像の証明に合格した後に MCP 呼び出しをキャンセルできるため。バインド後 cron プローブを厳格にするには `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` を設定する。

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

Docker 注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にある。
- デフォルトでは、ACP バインドスモークを集約ライブ CLI エージェントに対して順番に実行する: `claude`、`codex`、その後 `gemini`。
- マトリクスを絞るには、`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使用する。
- 一致する CLI 認証素材をコンテナにステージングし、要求されたライブ CLI（`@anthropic-ai/claude-code`、`@openai/codex`、`https://app.factory.ai/cli` 経由の Factory Droid、`@google/gemini-cli`、または `opencode-ai`）がなければインストールする。ACP バックエンド自体は、公式 `acpx` plugin の組み込み `acpx/runtime` パッケージである。
- Droid Docker バリアントは設定用に `~/.factory` をステージングし、`FACTORY_API_KEY` を転送し、その API キーを必須とする。これはローカルの Factory OAuth/keyring 認証がコンテナに移植できないためである。ACPX の内蔵 `droid exec --output-format acp` レジストリエントリを使用する。
- OpenCode Docker バリアントは厳格な単一エージェント回帰レーンである。`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（デフォルト `opencode/kimi-k2.6`）から一時的な `OPENCODE_CONFIG_CONTENT` デフォルトモデルを書き込む。
- 直接の `acpx` CLI 呼び出しは、Gateway 外で挙動を比較するための手動/回避策パスに限られる。Docker ACP バインドスモークは OpenClaw の組み込み `acpx` ランタイムバックエンドを実行する。

## ライブ: Codex app-server ハーネススモーク

- 目的: 通常の gateway
  `agent` メソッドを通じて、plugin 所有の Codex ハーネスを検証する:
  - バンドルされた `codex` plugin を読み込む
  - `openai/gpt-5.5` を選択する。これはデフォルトで OpenAI エージェントターンを Codex 経由にルーティングする
  - Codex ハーネスを選択した状態で、最初の gateway エージェントターンを `openai/gpt-5.5` に送信する
  - 同じ OpenClaw セッションに 2 回目のターンを送信し、app-server
    スレッドを再開できることを検証する
  - 同じ gateway コマンドパスを通じて `/codex status` と `/codex models` を実行する
  - 任意で、Guardian レビュー付きの昇格シェルプローブを 2 つ実行する: 承認されるべき無害な
    コマンドと、拒否されてエージェントが聞き返すべき偽シークレットアップロード
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `openai/gpt-5.5`
- 任意の画像プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/ツールプローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークは provider/model `agentRuntime.id: "codex"` を強制するため、壊れた Codex
  ハーネスが OpenClaw に黙ってフォールバックして合格することはできない。
- 認証: ローカル Codex サブスクリプションログインからの Codex app-server 認証。Docker
  スモークでは、該当する場合に非 Codex プローブ向けの `OPENAI_API_KEY` も提供でき、
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
- `OPENAI_API_KEY` を渡し、存在する場合は Codex CLI 認証ファイルをコピーし、書き込み可能なマウント済み npm
  プレフィックスに `@openai/codex` をインストールし、ソースツリーをステージングしてから、Codex ハーネスのライブテストのみを実行する。
- Docker では画像、MCP/ツール、Guardian プローブがデフォルトで有効になる。より絞ったデバッグ
  実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定する。
- Docker は同じ明示的な Codex ランタイム設定を使用するため、レガシーエイリアスや OpenClaw
  フォールバックで Codex ハーネス回帰を隠すことはできない。

### 推奨ライブレシピ

狭く明示的な許可リストが最速で、最も不安定になりにくい:

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

- 複数 provider をまたぐツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 直接スモーク:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google フォーカス（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking スモーク（プライベート QA CLI からの `qa manual` - `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` とソースチェックアウトが必要。[QA 概要](/ja-JP/concepts/qa-e2e-automation)を参照）:
  - Gemini 3 動的デフォルト: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動的予算: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注記:

- `google/...` は Gemini API（API キー）を使用する。
- `google-antigravity/...` は Antigravity OAuth ブリッジ（Cloud Code Assist 形式のエージェントエンドポイント）を使用する。
- `google-gemini-cli/...` はマシン上のローカル Gemini CLI を使用する（別個の認証 + ツール上の癖がある）。
- Gemini API と Gemini CLI:
  - API: OpenClaw は HTTP 経由で Google のホスト型 Gemini API を呼び出す（API キー / プロファイル認証）。これは多くのユーザーが「Gemini」と呼ぶものを指す。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル実行する。独自の認証を持ち、挙動が異なる場合がある（ストリーミング/ツール対応/バージョンのずれ）。

## ライブ: モデルマトリクス（カバー範囲）

ライブはオプトインなので、固定の「CI モデルリスト」はない。`OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern`（およびそれらの `all` エイリアス）は、`src/agents/live-model-filter.ts` の `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` から curated priority list をこの優先順で実行する:

| Provider/model                                | 注記       |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3-flash-preview`               | Gemini API |
| `moonshot/kimi-k2.7-code`                     |            |
| `anthropic/claude-opus-4-6`                   |            |
| `deepseek/deepseek-v4-flash`                  |            |
| `deepseek/deepseek-v4-pro`                    |            |
| `minimax/MiniMax-M3`                          |            |
| `openai/gpt-5.5`                              |            |
| `openrouter/openai/gpt-5.2-chat`              |            |
| `openrouter/minimax/minimax-m2.7`             |            |
| `opencode-go/glm-5`                           |            |
| `openrouter/ai21/jamba-large-1.7`             |            |
| `xai/grok-4.3`                                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

curated **小型モデル** リスト（`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`）は、`SMALL_LIVE_MODEL_PRIORITY` から:

| Provider/model               |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

modern リストに関する注記:

- `codex` と `codex-cli` プロバイダーは、デフォルトのモダンスイープから除外されています（CLI バックエンド/ACP の動作を対象としており、上で個別にテストされています）。`openai/gpt-5.5` 自体はデフォルトで Codex アプリサーバーハーネス経由でルーティングされます。[ライブ: Codex アプリサーバーハーネススモーク](#live-codex-app-server-harness-smoke)を参照してください。
- `fireworks`、`google`、`openrouter`、`xai` は、モダンスイープで明示的にキュレーションされたモデル ID のみを実行します（「このプロバイダーの全モデル」への自動展開はありません）。
- 画像プローブを実行するため、`OPENCLAW_LIVE_GATEWAY_MODELS` には画像対応モデル（Claude/Gemini/OpenAI 系の vision バリアントなど）を少なくとも 1 つ含めてください。

手動で選んだクロスプロバイダーセットに対して、ツール + 画像付きの Gateway スモークを実行します。

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

キュレーション済みリスト外の追加カバレッジ（任意、使用可能な「tools」対応モデルを選択）:

- Mistral: `mistral/...`
- Cerebras: `cerebras/...`（アクセス権がある場合）
- LM Studio: `lmstudio/...`（ローカル。ツール呼び出しは API モードに依存）

### アグリゲーター / 代替 Gateway

キーが有効な場合、次の経由でもテストできます。

- OpenRouter: `openrouter/...`（数百のモデル。ツール+画像対応候補を見つけるには `openclaw models scan` を使用）
- OpenCode: Zen は `opencode/...`、Go は `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 経由）

ライブマトリックスに含められる追加プロバイダー（認証情報/設定がある場合）:

- 組み込み: `anthropic`、`cerebras`、`github-copilot`、`google`、`google-antigravity`、`google-gemini-cli`、`google-vertex`、`groq`、`mistral`、`openai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`zai`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（クラウド/API）に加えて、任意の OpenAI/Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

<Tip>
ドキュメントに「all models」をハードコードしないでください。信頼できる一覧は、あなたのマシンで `discoverModels(...)` が返す内容と、利用可能なキーの組み合わせです。
</Tip>

## 認証情報（絶対にコミットしない）

ライブテストは CLI と同じ方法で認証情報を検出します。実務上の意味は次のとおりです。

- CLI が動作する場合、ライブテストも同じキーを見つけるはずです。
- ライブテストが「no creds」と表示する場合は、`openclaw models list` / モデル選択をデバッグするのと同じ方法でデバッグしてください。

- エージェントごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（ライブテストで「profile keys」と呼ぶもの）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー OAuth ディレクトリ: `~/.openclaw/credentials/`（存在する場合はステージング済みライブホームにコピーされますが、メインのプロファイルキー保存先ではありません）
- ローカルライブ実行では、アクティブな設定（`agents.*.workspace` / `agentDir` のオーバーライドを除去）と各エージェントの `auth-profiles.json` をコピーします。そのエージェントディレクトリの残りはコピーしないため、`workspace/` と `sandboxes/` のデータがステージング済みホームに到達することはありません。加えて、レガシー `credentials/` ディレクトリと、サポートされる外部 CLI 認証ファイル/ディレクトリ（`.claude.json`、`.claude/.credentials.json`、`.claude/settings*.json`、`.claude/backups`、`.codex/auth.json`、`.codex/config.toml`、`.gemini`、`.minimax`）を一時テストホームにコピーします。

env キーに依存したい場合は、ローカルテストの前にそれらを export するか、
以下の Docker ランナーで明示的な `OPENCLAW_PROFILE_FILE` を使用してください。

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
- スコープ:
  - バンドル済み comfy の画像、動画、`music_generate` パスを実行します
  - `plugins.entries.comfy.config.<capability>` が設定されていない限り、各 capability をスキップします
  - comfy ワークフロー送信、ポーリング、ダウンロード、Plugin 登録を変更した後に有用です

## 画像生成ライブ

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- スコープ:
  - 登録済みのすべての画像生成プロバイダーPluginを列挙します
  - プローブ前に、すでに export されているプロバイダー env vars を使用します
  - デフォルトでは保存済み認証プロファイルよりもライブ/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 設定済みの各プロバイダーを共有画像生成ランタイム経由で実行します。
    - `<provider>:generate`
    - プロバイダーが edit サポートを宣言している場合は `<provider>:edit`
- 現在対象のバンドル済みプロバイダー:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、env のみのオーバーライドを無視します

出荷済み CLI パスについては、プロバイダー/ランタイムのライブテストが
成功した後に `infer` スモークを追加します。

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

これは CLI 引数解析、設定/デフォルトエージェント解決、バンドル済み
Plugin 有効化、共有画像生成ランタイム、ライブプロバイダー
リクエストをカバーします。Plugin の依存関係は、ランタイム読み込み前に存在していることが期待されます。

## 音楽生成ライブ

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- スコープ:
  - 共有バンドル済み音楽生成プロバイダーパスを実行します
  - 現在 `fal`、`google`、`minimax`、`openrouter` を対象にしています
  - プローブ前に、すでに export されているプロバイダー env vars を使用します
  - デフォルトでは保存済み認証プロファイルよりもライブ/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 利用可能な場合、宣言済みの両方のランタイムモードを実行します。
    - prompt のみの入力で `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合は `edit`
  - `comfy` は独自の別ライブファイルを持ち、この共有スイープには含まれません
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、env のみのオーバーライドを無視します

## 動画生成ライブ

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- スコープ:
  - `alibaba`、`byteplus`、`deepinfra`、`fal`、`google`、`minimax`、`openai`、`openrouter`、`pixverse`、`qwen`、`runway`、`together`、`vydra`、`xai` にわたって共有バンドル済み動画生成プロバイダーパスを実行します
  - デフォルトではリリース向けに安全なスモークパスを使用します。プロバイダーごとに 1 つの text-to-video リクエスト、1 秒のロブスタープロンプト、および `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` からのプロバイダーごとの操作上限（デフォルトは `180000`）です
  - プロバイダー側のキュー遅延がリリース時間を支配することがあるため、デフォルトでは FAL をスキップします。明示的に実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡す（またはスキップリストをクリアする）してください
  - プローブ前に、すでに export されているプロバイダー env vars を使用します
  - デフォルトでは保存済み認証プロファイルよりもライブ/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - デフォルトでは `generate` のみを実行します
  - 利用可能な場合に宣言済みの transform モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します。
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択したプロバイダー/モデルが共有スイープでバッファー backed のローカル画像入力を受け付ける場合は `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択したプロバイダー/モデルが共有スイープでバッファー backed のローカル動画入力を受け付ける場合は `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - `vydra`（バッファー backed のローカル画像入力はこのレーンではサポートされていません）
  - プロバイダー固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` text-to-video に加えて、デフォルトでリモート画像 URL fixture を使用する `kling` image-to-video レーンを実行します（オーバーライドするには `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL`）。
  - 現在の `videoToVideo` ライブカバレッジ:
    - 選択したモデルが `gen4_aleph` に解決される場合のみ `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`、`google`、`openai`、`qwen`、`xai`。これらのパスは現在、バッファー backed のローカル入力ではなくリモート `http(s)` 参照 URL を必要とするためです
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL を含むデフォルトスイープの全プロバイダーを含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - アグレッシブなスモーク実行のため、各プロバイダー操作上限を下げるには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、env のみのオーバーライドを無視します

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- エントリーポイント: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`。これは選択された suite ごとに `pnpm test:live -- <suite-test-file>` を実行するため、Heartbeat と quiet-mode の動作は他の `pnpm test:live` 実行と一貫します。
- 目的:
  - 共有の画像、音楽、動画ライブ suite を 1 つのリポジトリネイティブなエントリーポイントから実行します
  - 不足しているプロバイダー env vars を `~/.profile` から自動読み込みします
  - デフォルトで、現在使用可能な認証を持つプロバイダーに各 suite を自動的に絞り込みます
- フラグ:
  - `--providers <csv>` グローバルプロバイダーフィルター。`--image-providers` / `--music-providers` / `--video-providers` はフィルターを 1 つの suite にスコープします
  - `--all-providers` は認証ベースの自動フィルターをスキップします
  - `--allow-empty` は、フィルタリングの結果実行可能なプロバイダーが残らない場合に `0` で終了します
  - `--quiet` / `--no-quiet` は `test:live` にそのまま渡されます
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [テスト](/ja-JP/help/testing) - unit、integration、QA、Docker suite
