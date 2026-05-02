---
read_when:
    - ライブモデルマトリクス / CLI バックエンド / ACP / media-provider のスモークテストを実行する
    - ライブテストの認証情報解決をデバッグする
    - 新しいプロバイダー固有のライブテストを追加する
sidebarTitle: Live tests
summary: ライブ（ネットワークにアクセスする）テスト：モデルマトリックス、CLI バックエンド、ACP、メディアプロバイダー、認証情報
title: 'テスト: ライブスイート'
x-i18n:
    generated_at: "2026-05-02T04:58:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce8bd75ee7837b48e6ba1d888d281ee053fc13bdcf0907baddeb78ebcbbef31c
    source_path: help/testing-live.md
    workflow: 16
---

For クイックスタート、QA ランナー、ユニット/統合スイート、Docker フローについては、
[テスト](/ja-JP/help/testing)を参照してください。このページでは、**ライブ**（ネットワークに触れる）テスト
スイート（モデルマトリックス、CLI バックエンド、ACP、メディアプロバイダーのライブテスト）と、
認証情報の取り扱いについて説明します。

## ライブ: ローカルプロファイルのスモークコマンド

アドホックなライブチェックの前に `~/.profile` を source して、プロバイダーキーとローカルツール
パスがシェルと一致するようにします。

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

`voicecall smoke` は、`--yes` も指定されていない限りドライランです。実際の通知通話を発信したい意図がある場合にのみ `--yes` を使用してください。Twilio、Telnyx、Plivo では、準備チェックが成功するには公開 Webhook URL が必要です。ローカル専用の loopback/プライベートフォールバックは設計上拒否されます。

## ライブ: Android ノード機能スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続された Android ノードが**現在通知しているすべてのコマンド**を呼び出し、コマンド契約の動作を検証する。
- 範囲:
  - 事前条件付き/手動セットアップ（このスイートはアプリのインストール/実行/ペアリングを行いません）。
  - 選択した Android ノードに対する、コマンドごとの Gateway `node.invoke` 検証。
- 必要な事前セットアップ:
  - Android アプリがすでに接続され、Gateway とペアリングされている。
  - アプリをフォアグラウンドに維持する。
  - 成功を期待する機能について、権限/キャプチャ同意が付与されている。
- 任意のターゲットオーバーライド:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細: [Android アプリ](/ja-JP/platforms/android)

## ライブ: モデルスモーク（プロファイルキー）

失敗を切り分けられるよう、ライブテストは 2 つのレイヤーに分かれています。

- 「直接モデル」は、指定されたキーでプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gateway スモーク」は、そのモデルで完全な gateway+agent パイプライン（セッション、履歴、ツール、サンドボックスポリシーなど）が機能するかを示します。

### レイヤー 1: 直接モデル補完（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って、認証情報があるモデルを選択する
  - モデルごとに小さな補完を実行する（必要な場合はターゲットを絞ったリグレッションも実行）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`、modern のエイリアス）を設定します。設定しない場合、`pnpm test:live` を Gateway スモークに集中させるためスキップされます
- モデルの選択方法:
  - `OPENCLAW_LIVE_MODELS=modern` で modern 許可リスト（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）を実行
  - `OPENCLAW_LIVE_MODELS=all` は modern 許可リストのエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（カンマ区切りの許可リスト）
  - Modern/all スイープは、既定で厳選された高シグナルの上限を使います。網羅的な modern スイープには `OPENCLAW_LIVE_MAX_MODELS=0` を、より小さな上限には正の数を設定します。
  - 網羅的スイープは、直接モデルテスト全体のタイムアウトに `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使用します。既定値: 60 分。
  - 直接モデルプローブは、既定で 20 並列で実行されます。オーバーライドするには `OPENCLAW_LIVE_MODEL_CONCURRENCY` を設定します。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りの許可リスト）
- キーの取得元:
  - 既定: プロファイルストアと env フォールバック
  - **プロファイルストア**のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定します
- これが存在する理由:
  - 「プロバイダー API が壊れている / キーが無効」と「Gateway エージェントパイプラインが壊れている」を分離します
  - 小さく分離されたリグレッションを含みます（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + 開発エージェントスモーク（"@openclaw" が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - インプロセス Gateway を起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとにモデルをオーバーライド）
  - キーがあるモデルを反復し、次を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが機能する（読み取りプローブ）
    - 任意の追加ツールプローブ（exec+read プローブ）
    - OpenAI リグレッションパス（tool-call-only → follow-up）が機能し続ける
- プローブ詳細（失敗をすばやく説明できるように）:
  - `read` プローブ: テストはワークスペースに nonce ファイルを書き込み、エージェントにそれを `read` して nonce をエコーバックするよう依頼します。
  - `exec+read` プローブ: テストはエージェントに、temp ファイルへ nonce を `exec` で書き込み、その後それを `read` するよう依頼します。
  - 画像プローブ: テストは生成された PNG（cat + ランダム化コード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - 既定: modern 許可リスト（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern 許可リストのエイリアスです
  - または絞り込むには `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定します
  - Modern/all Gateway スイープは、既定で厳選された高シグナルの上限を使います。網羅的な modern スイープには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を、より小さな上限には正の数を設定します。
- プロバイダーの選択方法（「OpenRouter のすべて」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りの許可リスト）
- このライブテストでは、ツール + 画像プローブは常に有効です:
  - `read` プローブ + `exec+read` プローブ（ツールストレス）
  - モデルが画像入力サポートを通知している場合、画像プローブが実行されます
  - フロー（概要）:
    - テストは「CAT」+ ランダムコードを含む小さな PNG を生成します（`src/gateway/live-image-probe.ts`）
    - `agent` 経由で `attachments: [{ mimeType: "image/png", content: "<base64>" }]` として送信します
    - Gateway は添付ファイルを `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 埋め込みエージェントはマルチモーダルなユーザーメッセージをモデルに転送します
    - アサーション: 返信に `cat` + コードが含まれる（OCR 許容: 軽微な誤りは許容）

<Tip>
自分のマシンでテストできるもの（および正確な `provider/model` ID）を確認するには、次を実行します。

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## ライブ: CLI バックエンドスモーク（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: 既定の設定に触れずに、ローカル CLI バックエンドを使って Gateway + エージェントパイプラインを検証する。
- バックエンド固有のスモーク既定値は、所有元のPluginの `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 既定:
  - 既定のプロバイダー/モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド/引数/画像の動作は、所有元の CLI バックエンド Plugin メタデータから取得されます。
- オーバーライド（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送信するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。Docker レシピでは、明示的に要求されない限り既定でオフです。
  - プロンプト注入の代わりに画像ファイルパスを CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されている場合に画像引数を渡す方法を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 ターン目を送信して再開フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - 選択したモデルが切り替え先をサポートしている場合に、Claude Sonnet -> Opus の同一セッション継続性プローブへ明示的に参加するには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`。Docker レシピでは、集約信頼性のため既定でオフです。
  - MCP/ツール loopback プローブへ明示的に参加するには `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`。Docker レシピでは、明示的に要求されない限り既定でオフです。

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

これは Gemini に応答生成を求めません。OpenClaw が Gemini に渡すものと同じシステム
設定を書き込み、その後 `gemini --debug mcp list` を実行して、保存済みの
`transport: "streamable-http"` サーバーが Gemini の HTTP MCP 形式に正規化され、
ローカルの streamable-HTTP MCP サーバーに接続できることを証明します。

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

メモ:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- repo Docker イメージ内で、non-root の `node` ユーザーとしてライブ CLI-backend スモークを実行します。
- 所有元のPluginから CLI スモークメタデータを解決し、一致する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（既定: `~/.cache/openclaw/docker-cli-tools`）にあるキャッシュ済みの書き込み可能なプレフィックスへインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`claudeAiOauth.subscriptionType` を含む `~/.claude/.credentials.json`、または `claude setup-token` の `CLAUDE_CODE_OAUTH_TOKEN` のいずれかを通じた、ポータブルな Claude Code サブスクリプション OAuth が必要です。最初に Docker 内で直接 `claude -p` を証明し、その後 Anthropic API キーの env vars を保持せずに、Gateway CLI-backend の 2 ターンを実行します。このサブスクリプションレーンでは、Claude が現在サードパーティアプリの使用を通常のサブスクリプションプラン上限ではなく追加使用量課金へルーティングしているため、Claude MCP/ツールおよび画像プローブを既定で無効にしています。
- ライブ CLI-backend スモークは現在、Claude、Codex、Gemini に対して同じエンドツーエンドフローを実行します。テキストターン、画像分類ターン、その後 Gateway CLI 経由で検証される MCP `cron` ツール呼び出しです。
- Claude の既定スモークは、セッションを Sonnet から Opus にパッチし、再開されたセッションが以前のメモをまだ覚えていることも検証します。

## ライブ: ACP バインドスモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目標: ライブ ACP エージェントで実際の ACP 会話バインドフローを検証する:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成メッセージチャネル会話をその場でバインドする
  - 同じ会話で通常のフォローアップを送信する
  - フォローアップがバインド済み ACP セッションのトランスクリプトに届くことを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- 既定値:
  - Docker 内の ACP エージェント: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` する場合の ACP エージェント: `claude`
  - 合成チャネル: Slack DM 形式の会話コンテキスト
  - ACP バックエンド: `acpx`
- 上書き:
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
  - このレーンは gateway の `chat.send` サーフェスを admin 専用の合成 originating-route フィールドとともに使用するため、テストは外部配信を装わずにメッセージチャネルのコンテキストを添付できます。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは埋め込み `acpx` Plugin の組み込みエージェントレジストリを、選択された ACP ハーネスエージェントに使用します。
  - バインド済みセッションの cron MCP 作成は既定ではベストエフォートです。これは、外部 ACP ハーネスがバインド/画像の証明に合格した後に MCP 呼び出しをキャンセルする可能性があるためです。そのバインド後 cron プローブを厳密にするには `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` を設定します。

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

Docker の注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- 既定では、集約されたライブ CLI エージェントに対して ACP バインドスモークを順番に実行します: `claude`、`codex`、次に `gemini`。
- マトリクスを絞るには、`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使用します。
- `~/.profile` を読み込み、対応する CLI 認証素材をコンテナにステージングし、要求されたライブ CLI (`@anthropic-ai/claude-code`、`@openai/codex`、`https://app.factory.ai/cli` 経由の Factory Droid、`@google/gemini-cli`、または `opencode-ai`) がなければインストールします。ACP バックエンド自体は、`acpx` Plugin からバンドルされた埋め込み `acpx/runtime` パッケージです。
- Droid Docker バリアントは設定用に `~/.factory` をステージングし、`FACTORY_API_KEY` を転送し、その API キーを必須とします。これはローカルの Factory OAuth/keyring 認証をコンテナへ移植できないためです。ACPX の組み込み `droid exec --output-format acp` レジストリエントリを使用します。
- OpenCode Docker バリアントは厳密な単一エージェントのリグレッションレーンです。`~/.profile` を読み込んだ後、`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` から一時的な `OPENCODE_CONFIG_CONTENT` 既定モデルを書き込みます (既定は `opencode/kimi-k2.6`)。また、`pnpm test:docker:live-acp-bind:opencode` は、汎用のバインド後スキップを受け入れる代わりに、バインド済みアシスタントのトランスクリプトを必須とします。
- 直接の `acpx` CLI 呼び出しは、Gateway 外部の挙動を比較するための手動/回避策パスに限られます。Docker ACP バインドスモークは OpenClaw の埋め込み `acpx` ランタイムバックエンドを実行します。

## ライブ: Codex app-server ハーネススモーク

- 目標: 通常の gateway
  `agent` メソッドを通じて、Plugin 所有の Codex ハーネスを検証する:
  - バンドルされた `codex` Plugin を読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - Codex ハーネスを強制した状態で、最初の gateway agent ターンを `openai/gpt-5.5` に送信する
  - 同じ OpenClaw セッションに 2 回目のターンを送信し、app-server
    スレッドを再開できることを検証する
  - 同じ gateway コマンド
    パスを通じて `/codex status` と `/codex models` を実行する
  - 任意で、Guardian レビュー済みの昇格シェルプローブを 2 つ実行する: 承認されるべき無害な
    コマンド 1 つと、拒否されてエージェントが確認を返すべき偽シークレットのアップロード 1 つ
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- 既定モデル: `openai/gpt-5.5`
- 任意の画像プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/tool プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れた Codex
  ハーネスが黙って PI にフォールバックして合格することはできません。
- 認証: ローカル Codex サブスクリプションログインからの Codex app-server 認証。Docker
  スモークは、該当する場合に非 Codex プローブ用の `OPENAI_API_KEY` も提供できます。
  さらに任意でコピーした `~/.codex/auth.json` と `~/.codex/config.toml` も使用できます。

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

Docker の注記:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- マウントされた `~/.profile` を読み込み、`OPENAI_API_KEY` を渡し、存在する場合は Codex CLI
  認証ファイルをコピーし、書き込み可能なマウント済み npm
  prefix に `@openai/codex` をインストールし、ソースツリーをステージングしてから、Codex ハーネスのライブテストだけを実行します。
- Docker は既定で画像、MCP/tool、Guardian プローブを有効にします。より狭いデバッグ
  実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定します。
- Docker は `OPENCLAW_AGENT_HARNESS_FALLBACK=none` もエクスポートし、ライブ
  テスト設定と一致させます。これにより、レガシーエイリアスや PI フォールバックが Codex ハーネスの
  リグレッションを隠すことはできません。

### 推奨ライブレシピ

狭く明示的な許可リストが最速で、最も不安定さが少なくなります:

- 単一モデル、直接 (gateway なし):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、gateway スモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがる tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google フォーカス (Gemini API キー + Antigravity):
  - Gemini (API キー): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking スモーク:
  - ローカルキーがシェルプロファイルにある場合: `source ~/.profile`
  - Gemini 3 動的既定値: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動的バジェット: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注記:

- `google/...` は Gemini API (API キー) を使用します。
- `google-antigravity/...` は Antigravity OAuth ブリッジ (Cloud Code Assist 形式のエージェントエンドポイント) を使用します。
- `google-gemini-cli/...` はマシン上のローカル Gemini CLI を使用します (別の認証 + ツール上の癖)。
- Gemini API と Gemini CLI:
  - API: OpenClaw は HTTP 経由で Google のホスト型 Gemini API を呼び出します (API キー / プロファイル認証)。これは多くのユーザーが「Gemini」と呼ぶものです。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル実行します。独自の認証があり、挙動が異なる場合があります (ストリーミング/tool 対応/バージョンのずれ)。

## ライブ: モデルマトリクス (対象範囲)

固定の「CI モデルリスト」はありません (ライブはオプトインです) が、キーを持つ開発マシンで定期的に対象にする**推奨**モデルは次のとおりです。

### モダンスモークセット (tool calling + 画像)

これは、動作し続けることを期待する「一般的なモデル」の実行です:

- OpenAI (非 Codex): `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (または `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview` (古い Gemini 2.x モデルは避ける)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

tools + 画像付きで gateway スモークを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool calling (Read + 任意の Exec)

プロバイダーファミリーごとに少なくとも 1 つ選択してください:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6` (または `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (または `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ (あるとよい):

- xAI: `xai/grok-4.3` (または利用可能な最新)
- Mistral: `mistral/`… (有効化済みの「tools」対応モデルを 1 つ選択)
- Cerebras: `cerebras/`… (アクセス権がある場合)
- LM Studio: `lmstudio/`… (ローカル。tool calling は API モードに依存)

### ビジョン: 画像送信 (添付ファイル → マルチモーダルメッセージ)

画像プローブを実行するため、`OPENCLAW_LIVE_GATEWAY_MODELS` に画像対応モデルを少なくとも 1 つ含めてください (Claude/Gemini/OpenAI のビジョン対応バリアントなど)。

### アグリゲーター / 代替ゲートウェイ

キーが有効であれば、次の経由でのテストもサポートしています:

- OpenRouter: `openrouter/...` (数百のモデル。tool+image 対応候補を見つけるには `openclaw models scan` を使用)
- OpenCode: Zen 用の `opencode/...` と Go 用の `opencode-go/...` (認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 経由)

ライブマトリクスに含められる追加プロバイダー (認証情報/設定がある場合):

- 組み込み: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` 経由 (カスタムエンドポイント): `minimax` (クラウド/API)、および任意の OpenAI/Anthropic 互換プロキシ (LM Studio, vLLM, LiteLLM など)

<Tip>
ドキュメントで「すべてのモデル」をハードコードしないでください。信頼できるリストは、あなたのマシンで `discoverModels(...)` が返すものと、利用可能なキーです。
</Tip>

## 認証情報 (絶対にコミットしない)

ライブテストは CLI と同じ方法で認証情報を検出します。実務上の影響は次のとおりです:

- CLI が動作する場合、ライブテストは同じキーを見つけるはずです。
- ライブテストが「認証情報なし」と表示する場合は、`openclaw models list` / モデル選択をデバッグするのと同じ方法でデバッグしてください。

- エージェントごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（ライブテストでいう「プロファイルキー」はこれを意味します）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー状態ディレクトリ: `~/.openclaw/credentials/`（存在する場合はステージングされたライブホームにコピーされますが、メインのプロファイルキーストアではありません）
- ローカルでのライブ実行は、既定でアクティブな設定、エージェントごとの `auth-profiles.json` ファイル、レガシー `credentials/`、サポート対象の外部 CLI 認証ディレクトリを一時テストホームにコピーします。ステージングされたライブホームは `workspace/` と `sandboxes/` をスキップし、`agents.*.workspace` / `agentDir` のパス上書きは削除されるため、プローブは実ホストのワークスペースから離れたままになります。

環境キーに依存したい場合（例: `~/.profile` でエクスポート済み）、`source ~/.profile` の後にローカルテストを実行するか、下記の Docker ランナーを使用してください（コンテナ内に `~/.profile` をマウントできます）。

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
- スコープ:
  - バンドルされた comfy の画像、動画、`music_generate` パスを実行します
  - `plugins.entries.comfy.config.<capability>` が設定されていない限り、各機能をスキップします
  - comfy ワークフローの送信、ポーリング、ダウンロード、または Plugin 登録を変更した後に有用です

## 画像生成ライブ

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- スコープ:
  - 登録済みのすべての画像生成プロバイダー Plugin を列挙します
  - プローブ前に、ログインシェル（`~/.profile`）から不足しているプロバイダー環境変数を読み込みます
  - 既定では、保存済み認証プロファイルよりもライブ/環境 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 設定済みの各プロバイダーを共有画像生成ランタイムで実行します:
    - `<provider>:generate`
    - プロバイダーが編集サポートを宣言している場合は `<provider>:edit`
- 現在対象になっているバンドル済みプロバイダー:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境のみの上書きを無視します

出荷済み CLI パスでは、プロバイダー/ランタイムのライブテストが通った後に `infer` スモークを追加します:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

これは、CLI 引数の解析、設定/既定エージェントの解決、バンドルされた Plugin の有効化、共有画像生成ランタイム、ライブプロバイダーリクエストをカバーします。Plugin 依存関係は、ランタイム読み込み前に存在していることが期待されます。

## 音楽生成ライブ

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- スコープ:
  - 共有されたバンドル済み音楽生成プロバイダーパスを実行します
  - 現在は Google と MiniMax をカバーしています
  - プローブ前に、ログインシェル（`~/.profile`）からプロバイダー環境変数を読み込みます
  - 既定では、保存済み認証プロファイルよりもライブ/環境 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 利用可能な場合は、宣言された両方のランタイムモードを実行します:
    - プロンプトのみの入力で `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合は `edit`
  - 現在の共有レーンのカバレッジ:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 別の Comfy ライブファイルであり、この共有スイープではありません
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境のみの上書きを無視します

## 動画生成ライブ

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- スコープ:
  - 共有されたバンドル済み動画生成プロバイダーパスを実行します
  - 既定では、リリース安全なスモークパスを使用します: FAL 以外のプロバイダー、プロバイダーごとに 1 件のテキストから動画へのリクエスト、1 秒のロブスタープロンプト、`OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（既定は `180000`）からのプロバイダーごとの操作上限
  - プロバイダー側のキュー待機時間がリリース時間の大部分を占める可能性があるため、既定では FAL をスキップします。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - プローブ前に、ログインシェル（`~/.profile`）からプロバイダー環境変数を読み込みます
  - 既定では、保存済み認証プロファイルよりもライブ/環境 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 既定では `generate` のみを実行します
  - 利用可能な場合に宣言済み変換モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有スイープでバッファーベースのローカル画像入力を受け付ける場合は `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有スイープでバッファーベースのローカル動画入力を受け付ける場合は `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - `vydra`: バンドルされた `veo3` はテキスト専用であり、バンドルされた `kling` はリモート画像 URL を必要とするため
  - Vydra 固有のカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは、既定でリモート画像 URL フィクスチャを使用する `kling` レーンに加えて、`veo3` のテキストから動画への処理を実行します
  - 現在の `videoToVideo` ライブカバレッジ:
    - 選択されたモデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`, `qwen`, `xai`: これらのパスは現在、リモートの `http(s)` / MP4 参照 URL を必要とするため
    - `google`: 現在の共有 Gemini/Veo レーンはローカルのバッファーベース入力を使用しており、そのパスは共有スイープで受け付けられないため
    - `openai`: 現在の共有レーンには、組織固有の動画インペイント/リミックスアクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` で、FAL を含むすべてのプロバイダーを既定のスイープに含めます
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` で、積極的なスモーク実行向けに各プロバイダー操作の上限を短縮します
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境のみの上書きを無視します

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有された画像、音楽、動画のライブスイートを、1 つのリポジトリネイティブなエントリーポイントから実行します
  - `~/.profile` から不足しているプロバイダー環境変数を自動読み込みします
  - 既定では、現在利用可能な認証があるプロバイダーに各スイートを自動で絞り込みます
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と静音モードの動作は一貫します
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [テスト](/ja-JP/help/testing) — ユニット、統合、QA、Docker スイート
