---
read_when:
    - ライブモデルマトリックス / CLI バックエンド / ACP / media-provider スモークテストの実行
    - ライブテストの認証情報解決のデバッグ
    - 新しいプロバイダー固有のライブテストを追加する
sidebarTitle: Live tests
summary: 'ライブ（ネットワーク接続を伴う）テスト: モデルマトリックス、CLI バックエンド、ACP、メディアプロバイダー、認証情報'
title: 'テスト: ライブスイート'
x-i18n:
    generated_at: "2026-05-06T05:08:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

For クイックスタート、QA ランナー、ユニット/統合スイート、Docker フローについては、
[テスト](/ja-JP/help/testing)を参照してください。このページでは、**ライブ**（ネットワークにアクセスする）テスト
スイートを扱います: モデルマトリクス、CLI バックエンド、ACP、メディアプロバイダーのライブテスト、および
認証情報の扱いです。

## ライブ: ローカルプロファイルのスモークコマンド

アドホックなライブチェックの前に `~/.profile` を読み込み、プロバイダーキーとローカルツール
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

`voicecall smoke` は、`--yes` も指定されていない限りドライランです。実際の通知通話を意図して発信したい場合にのみ `--yes` を使用してください。Twilio、Telnyx、Plivo では、準備チェックが成功するには公開 Webhook URL が必要です。ローカルのみのループバック/プライベートフォールバックは設計上拒否されます。

## ライブ: Android ノード機能スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続済み Android ノードが**現在公開しているすべてのコマンド**を呼び出し、コマンド契約の挙動を検証します。
- 範囲:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/実行/ペアリングを行いません）。
  - 選択した Android ノードに対するコマンド単位の Gateway `node.invoke` 検証。
- 必須の事前セットアップ:
  - Android アプリがすでに Gateway に接続済みかつペアリング済み。
  - アプリをフォアグラウンドに維持。
  - 成功を期待する機能について、権限/キャプチャ同意を付与済み。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android セットアップの詳細全体: [Android アプリ](/ja-JP/platforms/android)

## ライブ: モデルスモーク（プロファイルキー）

ライブテストは、障害を切り分けられるように 2 つの層に分かれています。

- 「直接モデル」は、指定されたキーでプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gateway スモーク」は、そのモデルで Gateway+エージェントのフルパイプラインが動作するかを示します（セッション、履歴、ツール、サンドボックスポリシーなど）。

### レイヤー 1: 直接モデル補完（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使用して、認証情報があるモデルを選択する
  - モデルごとに小さな補完を実行する（必要に応じて対象を絞ったリグレッションも実行）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`、modern のエイリアス）を設定します。設定しない場合、`pnpm test:live` を Gateway スモークに集中させるためスキップされます
- モデルの選択方法:
  - `OPENCLAW_LIVE_MODELS=modern` で modern 許可リストを実行します（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_MODELS=all` は modern 許可リストのエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."`（カンマ区切りの許可リスト）
  - Modern/all スイープは既定で、厳選された高シグナルの上限を使用します。網羅的な modern スイープには `OPENCLAW_LIVE_MAX_MODELS=0` を設定し、より小さい上限には正の数を設定します。
  - 網羅的なスイープでは、直接モデルテスト全体のタイムアウトに `OPENCLAW_LIVE_TEST_TIMEOUT_MS` を使用します。既定: 60 分。
  - 直接モデルプローブは既定で 20 並列で実行されます。上書きするには `OPENCLAW_LIVE_MODEL_CONCURRENCY` を設定します。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りの許可リスト）
- キーの取得元:
  - 既定: プロファイルストアと env フォールバック
  - **プロファイルストア**のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定します
- これが存在する理由:
  - 「プロバイダー API が壊れている / キーが無効」と「Gateway エージェントパイプラインが壊れている」を切り分けます
  - 小さく分離されたリグレッションを含みます（例: OpenAI Responses/Codex Responses の推論リプレイ + ツール呼び出しフロー）

### レイヤー 2: Gateway + 開発エージェントスモーク（「@openclaw」が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内 Gateway を起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとにモデルを上書き）
  - キーがあるモデルを反復し、次を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが動作する（読み取りプローブ）
    - 任意の追加ツールプローブ（exec+read プローブ）
    - OpenAI リグレッションパス（ツール呼び出しのみ → フォローアップ）が動作し続ける
- プローブの詳細（失敗を素早く説明できるように）:
  - `read` プローブ: テストがワークスペースに nonce ファイルを書き込み、エージェントにそれを `read` して nonce を返すよう依頼します。
  - `exec+read` プローブ: テストがエージェントに、一時ファイルへ nonce を `exec` で書き込み、その後 `read` で読み戻すよう依頼します。
  - 画像プローブ: テストが生成 PNG（猫 + ランダム化されたコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装リファレンス: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - 既定: modern 許可リスト（Opus/Sonnet 4.6+、GPT-5.2 + Codex、Gemini 3、DeepSeek V4、GLM 4.7、MiniMax M2.7、Grok 4.3）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern 許可リストのエイリアスです
  - または絞り込むには `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定します
  - Modern/all Gateway スイープは既定で、厳選された高シグナルの上限を使用します。網羅的な modern スイープには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を設定し、より小さい上限には正の数を設定します。
- プロバイダーの選択方法（「OpenRouter のすべて」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りの許可リスト）
- このライブテストでは、ツール + 画像プローブは常に有効です:
  - `read` プローブ + `exec+read` プローブ（ツール負荷）
  - 画像プローブは、モデルが画像入力サポートを公開している場合に実行されます
  - フロー（高レベル）:
    - テストが「CAT」+ ランダムコード入りの小さな PNG を生成します（`src/gateway/live-image-probe.ts`）
    - `agent` 経由で `attachments: [{ mimeType: "image/png", content: "<base64>" }]` として送信します
    - Gateway が添付を `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 埋め込みエージェントがマルチモーダルユーザーメッセージをモデルへ転送します
    - アサーション: 返信に `cat` + コードが含まれる（OCR 許容: 軽微な誤りは許可）

<Tip>
自分のマシンで何をテストできるか（および正確な `provider/model` ID）を確認するには、次を実行します。

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## ライブ: CLI バックエンドスモーク（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: 既定の設定に触れずに、ローカル CLI バックエンドを使用して Gateway + エージェントパイプラインを検証します。
- バックエンド固有のスモーク既定値は、所有する extension の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- 既定値:
  - 既定のプロバイダー/モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド/引数/画像の挙動は、所有する CLI バックエンド Plugin メタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送信するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。Docker レシピでは、明示的に要求されない限り既定でオフです。
  - プロンプト注入の代わりに画像ファイルパスを CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されている場合の画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 ターン目を送信して再開フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - 選択したモデルが切り替えターゲットをサポートしている場合に、Claude Sonnet -> Opus の同一セッション継続性プローブへ明示的に参加するには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`。Docker レシピでは、集約時の信頼性のため既定でオフです。
  - MCP/ツールのループバックプローブへ明示的に参加するには `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`。Docker レシピでは、明示的に要求されない限り既定でオフです。

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

これは Gemini に応答の生成を要求しません。OpenClaw が Gemini に渡すものと同じシステム
設定を書き込み、その後 `gemini --debug mcp list` を実行して、保存済みの
`transport: "streamable-http"` サーバーが Gemini の HTTP MCP
形式へ正規化され、ローカルの streamable-HTTP MCP サーバーへ接続できることを証明します。

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
- リポジトリの Docker イメージ内で、非 root の `node` ユーザーとしてライブ CLI バックエンドスモークを実行します。
- 所有する extension から CLI スモークメタデータを解決し、対応する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（既定: `~/.cache/openclaw/docker-cli-tools`）のキャッシュ済み書き込み可能プレフィックスにインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`claudeAiOauth.subscriptionType` を含む `~/.claude/.credentials.json`、または `claude setup-token` からの `CLAUDE_CODE_OAUTH_TOKEN` のいずれかを通じた、ポータブルな Claude Code サブスクリプション OAuth が必要です。まず Docker 内で直接 `claude -p` を証明し、その後 Anthropic API キーの env vars を保持せずに Gateway CLI バックエンドを 2 ターン実行します。このサブスクリプションレーンでは、Claude MCP/ツールおよび画像プローブを既定で無効にします。これは、Claude が現在、サードパーティアプリの使用を通常のサブスクリプションプラン上限ではなく追加使用量課金経由でルーティングしているためです。
- ライブ CLI バックエンドスモークは、Claude、Codex、Gemini について同じエンドツーエンドフローを実行するようになりました: テキストターン、画像分類ターン、その後 Gateway CLI 経由で検証される MCP `cron` ツール呼び出し。
- Claude の既定スモークでは、セッションを Sonnet から Opus へパッチし、再開されたセッションが以前のメモをまだ覚えていることも検証します。

## ライブ: APNs HTTP/2 プロキシ到達性

- テスト: `src/infra/push-apns-http2.live.test.ts`
- 目的: ローカル HTTP CONNECT プロキシ経由で Apple のサンドボックス APNs エンドポイントへトンネルし、APNs HTTP/2 検証リクエストを送信して、Apple の実際の `403 InvalidProviderToken` 応答がプロキシパス経由で戻ることを検証します。
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
  - フォローアップがバインド済み ACP セッションのトランスクリプトに到達することを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP エージェント: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` を実行する場合の ACP エージェント: `claude`
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
  - このレーンは Gateway の `chat.send` サーフェスを、管理者専用の合成 originating-route フィールドとともに使用するため、テストは外部配信を装わずにメッセージチャネルコンテキストをアタッチできる。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP ハーネスエージェントについて、組み込み `acpx` Plugin の組み込みエージェントレジストリを使用する。
  - バインド済みセッションの Cron MCP 作成はデフォルトでベストエフォート。外部 ACP ハーネスはバインド/画像の証明が通過した後に MCP 呼び出しをキャンセルすることがあるためである。このバインド後 Cron プローブを厳密にするには、`OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` を設定する。

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

Docker の注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にある。
- デフォルトでは、集約されたライブ CLI エージェントに対して ACP バインドスモークを順に実行する: `claude`、`codex`、続いて `gemini`。
- マトリクスを絞り込むには、`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使用する。
- `~/.profile` を読み込み、一致する CLI 認証素材をコンテナにステージングし、要求されたライブ CLI（`@anthropic-ai/claude-code`、`@openai/codex`、Factory Droid via `https://app.factory.ai/cli`、`@google/gemini-cli`、または `opencode-ai`）がなければインストールする。ACP バックエンド自体は、公式 `acpx` Plugin の組み込み `acpx/runtime` パッケージである。
- Droid Docker バリアントは設定用に `~/.factory` をステージングし、`FACTORY_API_KEY` を転送し、ローカル Factory OAuth/keyring 認証はコンテナへ移植できないため、その API キーを必須とする。ACPX の組み込み `droid exec --output-format acp` レジストリエントリを使用する。
- OpenCode Docker バリアントは厳密な単一エージェント回帰レーンである。`~/.profile` を読み込んだ後、`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（デフォルト `opencode/kimi-k2.6`）から一時的な `OPENCODE_CONFIG_CONTENT` デフォルトモデルを書き込み、`pnpm test:docker:live-acp-bind:opencode` は汎用的なバインド後スキップを受け入れず、バインド済みアシスタントトランスクリプトを必須とする。
- 直接の `acpx` CLI 呼び出しは、Gateway の外で挙動を比較するための手動/回避パスに限られる。Docker ACP バインドスモークは、OpenClaw の組み込み `acpx` ランタイムバックエンドを実行する。

## ライブ: Codex app-server ハーネススモーク

- 目的: 通常の Gateway `agent` メソッド経由で Plugin 所有の Codex ハーネスを検証する:
  - バンドルされた `codex` Plugin を読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - Codex ハーネスを強制して、最初の Gateway エージェントターンを `openai/gpt-5.5` に送信する
  - 同じ OpenClaw セッションに 2 回目のターンを送信し、app-server スレッドを再開できることを検証する
  - 同じ Gateway コマンドパス経由で `/codex status` と `/codex models` を実行する
  - オプションで、Guardian レビュー済みの権限昇格シェルプローブを 2 つ実行する: 承認されるべき無害なコマンドと、拒否されてエージェントが確認を返すべき偽シークレットのアップロード
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `openai/gpt-5.5`
- オプションの画像プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- オプションの MCP/ツールプローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- オプションの Guardian プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークは `agentRuntime.id: "codex"` を使用するため、壊れた Codex ハーネスが黙って PI にフォールバックして通過することはできない。
- 認証: ローカル Codex サブスクリプションログインからの Codex app-server 認証。Docker スモークは該当する場合、非 Codex プローブ用に `OPENAI_API_KEY` も提供でき、任意でコピーした `~/.codex/auth.json` と `~/.codex/config.toml` も提供できる。

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

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にある。
- マウントされた `~/.profile` を読み込み、`OPENAI_API_KEY` を渡し、存在する場合は Codex CLI 認証ファイルをコピーし、`@openai/codex` を書き込み可能なマウント済み npm プレフィックスにインストールし、ソースツリーをステージングしてから、Codex ハーネスのライブテストだけを実行する。
- Docker はデフォルトで画像、MCP/ツール、Guardian プローブを有効にする。より絞り込んだデバッグ実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`、または `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定する。
- Docker は同じ明示的な Codex ランタイム設定を使用するため、レガシーエイリアスや PI フォールバックで Codex ハーネス回帰を隠すことはできない。

### 推奨ライブレシピ

狭く明示的な許可リストが最速で、最も不安定になりにくい:

- 単一モデル、直接（Gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、Gateway スモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーをまたぐツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google に重点（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google adaptive thinking スモーク:
  - ローカルキーがシェルプロファイルにある場合: `source ~/.profile`
  - Gemini 3 動的デフォルト: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 動的バジェット: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注記:

- `google/...` は Gemini API（API キー）を使用する。
- `google-antigravity/...` は Antigravity OAuth ブリッジ（Cloud Code Assist スタイルのエージェントエンドポイント）を使用する。
- `google-gemini-cli/...` はマシン上のローカル Gemini CLI を使用する（別個の認証 + ツールまわりの癖）。
- Gemini API と Gemini CLI:
  - API: OpenClaw は HTTP 経由で Google のホスト型 Gemini API を呼び出す（API キー / プロファイル認証）。これは多くのユーザーが「Gemini」と呼ぶもの。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル実行する。独自の認証を持ち、挙動が異なる場合がある（ストリーミング/ツール対応/バージョン差異）。

## ライブ: モデルマトリクス（カバー対象）

固定の「CI モデルリスト」はない（ライブはオプトイン）が、これらはキーを持つ開発マシンで定期的にカバーすることを**推奨**するモデルである。

### モダンスモークセット（ツール呼び出し + 画像）

これは動作を維持することを期待する「一般的なモデル」の実行である:

- OpenAI（非 Codex）: `openai/gpt-5.5`
- OpenAI Codex OAuth: `openai-codex/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro`
- Z.AI（GLM）: `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

ツール + 画像付きで Gateway スモークを実行する:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: ツール呼び出し（Read + オプションの Exec）

プロバイダーファミリーごとに少なくとも 1 つ選ぶ:

- OpenAI: `openai/gpt-5.5`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI（GLM）: `zai/glm-5.1`
- MiniMax: `minimax/MiniMax-M2.7`

オプションの追加カバレッジ（あるとよい）:

- xAI: `xai/grok-4.3`（または利用可能な最新）
- Mistral: `mistral/`…（有効化済みの「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセス権がある場合）
- LM Studio: `lmstudio/`…（ローカル。ツール呼び出しは API モードに依存する）

### Vision: 画像送信（添付 → マルチモーダルメッセージ）

画像プローブを実行するため、`OPENCLAW_LIVE_GATEWAY_MODELS` に画像対応モデルを少なくとも 1 つ含める（Claude/Gemini/OpenAI の Vision 対応バリアントなど）。

### アグリゲーター / 代替 Gateway

キーが有効な場合、以下を経由したテストにも対応している:

- OpenRouter: `openrouter/...`（数百のモデル。ツール+画像対応候補を見つけるには `openclaw models scan` を使用する）
- OpenCode: Zen は `opencode/...`、Go は `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` 経由）

ライブマトリクスに含められる追加プロバイダー（認証情報/設定がある場合）:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（クラウド/API）に加え、任意の OpenAI/Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

<Tip>
ドキュメントに「すべてのモデル」をハードコードしない。権威あるリストは、マシン上で `discoverModels(...)` が返すものに、利用可能なキーを加えたものである。
</Tip>

## 認証情報（絶対にコミットしない）

ライブテストは CLI と同じ方法で認証情報を検出する。実務上の意味は次のとおり:

- CLI が動作するなら、ライブテストも同じキーを見つけるはずである。
- ライブテストが「認証情報なし」と言う場合は、`openclaw models list` / モデル選択をデバッグするのと同じ方法でデバッグする。

- エージェントごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（ライブテストで「プロファイルキー」が意味するもの）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー状態ディレクトリ: `~/.openclaw/credentials/`（存在する場合はステージングされたライブホームへコピーされるが、メインのプロファイルキーストアではない）
- ローカルのライブ実行では、デフォルトでアクティブな設定、エージェントごとの `auth-profiles.json` ファイル、レガシー `credentials/`、サポート対象の外部 CLI 認証ディレクトリが一時テストホームへコピーされる。ステージングされたライブホームでは `workspace/` と `sandboxes/` はスキップされ、`agents.*.workspace` / `agentDir` のパス上書きは削除されるため、プローブは実ホストのワークスペースに触れない。

環境変数キーに依存したい場合（例: `~/.profile` でエクスポートしている場合）は、`source ~/.profile` の後にローカルテストを実行するか、以下の Docker ランナーを使用する（コンテナへ `~/.profile` をマウントできる）。

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
  - バンドル済みの comfy 画像、動画、`music_generate` パスを実行する
  - `plugins.entries.comfy.config.<capability>` が設定されていない限り、各機能をスキップする
  - comfy ワークフロー送信、ポーリング、ダウンロード、Plugin 登録を変更した後に有用

## 画像生成ライブ

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- 範囲:
  - 登録済みのすべての画像生成プロバイダー Plugin を列挙する
  - プローブ前に、ログインシェル（`~/.profile`）から不足しているプロバイダー環境変数を読み込む
  - デフォルトでは保存済み認証プロファイルよりもライブ/環境変数 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠さない
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップする
  - 設定済みの各プロバイダーを共有画像生成ランタイムで実行する:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視する

出荷済み CLI パスについては、プロバイダー/ランタイムのライブテストが通った後に `infer` スモークを追加する:

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
リクエストをカバーする。Plugin 依存関係は、ランタイム読み込み前に存在していることが期待される。

## 音楽生成ライブ

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- 範囲:
  - 共有バンドル済み音楽生成プロバイダーパスを実行する
  - 現在は Google と MiniMax を対象にする
  - プローブ前に、ログインシェル（`~/.profile`）からプロバイダー環境変数を読み込む
  - デフォルトでは保存済み認証プロファイルよりもライブ/環境変数 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠さない
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップする
  - 利用可能な場合、宣言済みの両方のランタイムモードを実行する:
    - プロンプトのみの入力で `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合は `edit`
  - 現在の共有レーンのカバレッジ:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 別の Comfy ライブファイルで、この共有スイープではない
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視する

## 動画生成ライブ

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- 範囲:
  - 共有バンドル済み動画生成プロバイダーパスを実行する
  - デフォルトではリリースセーフなスモークパスを使用する: FAL 以外のプロバイダー、プロバイダーごとに 1 件のテキストから動画へのリクエスト、1 秒のロブスタープロンプト、`OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` からのプロバイダーごとの操作上限（デフォルトは `180000`）
  - プロバイダー側のキュー遅延がリリース時間を支配することがあるため、デフォルトでは FAL をスキップする。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡す
  - プローブ前に、ログインシェル（`~/.profile`）からプロバイダー環境変数を読み込む
  - デフォルトでは保存済み認証プロファイルよりもライブ/環境変数 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠さない
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップする
  - デフォルトでは `generate` のみを実行する
  - 利用可能な場合に宣言済みの変換モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定する:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有スイープでバッファ裏付けのローカル画像入力を受け入れる場合は `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有スイープでバッファ裏付けのローカル動画入力を受け入れる場合は `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - `vydra`。バンドル済みの `veo3` はテキストのみで、バンドル済みの `kling` にはリモート画像 URL が必要なため
  - プロバイダー固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - そのファイルは、`veo3` のテキストから動画に加え、デフォルトでリモート画像 URL フィクスチャを使用する `kling` レーンを実行する
  - 現在の `videoToVideo` ライブカバレッジ:
    - 選択されたモデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`, `qwen`, `xai`。これらのパスは現在リモート `http(s)` / MP4 参照 URL を必要とするため
    - `google`。現在の共有 Gemini/Veo レーンはローカルのバッファ裏付け入力を使用し、そのパスは共有スイープで受け入れられないため
    - `openai`。現在の共有レーンには、組織固有の動画インペイント/リミックスアクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルトスイープに FAL を含むすべてのプロバイダーを含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 積極的なスモーク実行向けに各プロバイダーの操作上限を減らすには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` でプロファイルストア認証を強制し、環境変数のみの上書きを無視する

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の画像、音楽、動画ライブスイートを、リポジトリネイティブな単一エントリポイントで実行する
  - `~/.profile` から不足しているプロバイダー環境変数を自動読み込みする
  - デフォルトで、現在使用可能な認証を持つプロバイダーへ各スイートを自動的に絞り込む
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と静音モードの動作が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連

- [テスト](/ja-JP/help/testing) - ユニット、統合、QA、Docker スイート
