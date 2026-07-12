---
read_when:
    - ライブモデルマトリクス / CLI バックエンド / ACP / メディアプロバイダーのスモークテストの実行
    - ライブテストの認証情報解決をデバッグする
    - プロバイダー固有の新しいライブテストの追加
sidebarTitle: Live tests
summary: ライブ（ネットワークにアクセスする）テスト：モデルマトリックス、CLI バックエンド、ACP、メディアプロバイダー、認証情報
title: 'テスト: ライブスイート'
x-i18n:
    generated_at: "2026-07-11T22:18:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

クイックスタート、QA ランナー、ユニット/統合スイート、Docker フローについては、
[テスト](/ja-JP/help/testing)を参照してください。このページでは、**ライブ**（ネットワークにアクセスする）テストを扱います。
モデルマトリクス、CLI バックエンド、ACP、メディアプロバイダー、認証情報の取り扱いが対象です。

## ライブ：ローカルスモークコマンド

アドホックなライブチェックを行う前に、必要なプロバイダーキーをプロセス環境にエクスポートしてください。

安全なメディアスモークテスト：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

安全な音声通話準備状況スモークテスト：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`は、`--yes`も指定しない限りドライランです。実際に通話を発信する場合にのみ
`--yes`を使用してください。Twilio、Telnyx、Plivo では、
準備状況チェックに成功するには公開 Webhook URL が必要です。これらのプロバイダーから到達できないため、
ローカル/プライベートループバック URL は拒否されます。

## ライブ：Android Node 機能の一括検証

- テスト：`src/gateway/android-node.capabilities.live.test.ts`
- スクリプト：`pnpm android:test:integration`
- 目的：接続済みの Android Node が**現在公開しているすべてのコマンド**を呼び出し、コマンド契約の動作を検証します。
- 範囲：
  - 前提条件を満たした手動セットアップ（このスイートはアプリのインストール、実行、ペアリングを行いません）。
  - 選択した Android Node に対する、コマンドごとの Gateway `node.invoke` 検証。
- 必須の事前セットアップ：
  - Android アプリがすでに Gateway に接続され、ペアリング済みであること。
  - アプリをフォアグラウンドに維持すること。
  - 成功を期待する機能に必要な権限/キャプチャ同意が付与されていること。
- 任意の対象オーバーライド：
  - `OPENCLAW_ANDROID_NODE_ID`または`OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細：[Android アプリ](/ja-JP/platforms/android)

## ライブ：モデルスモーク（プロファイルキー）

障害を分離できるように、ライブモデルテストは 2 つのレイヤーに分かれています。

- 「直接モデル」では、指定したキーを使用してプロバイダー/モデルがそもそも応答できるかを確認します。
- 「Gateway スモーク」では、そのモデルで Gateway とエージェントを含むパイプライン全体（セッション、履歴、ツール、サンドボックスポリシーなど）が動作するかを確認します。

以下の厳選モデルリストは`src/agents/live-model-filter.ts`にあり、
時間の経過とともに変更されます。このページではなく、同ファイル内の配列を信頼できる唯一の情報源として扱ってください。

MiniMax M3 は、デフォルトのプロバイダー/モデル参照として`minimax/MiniMax-M3`を使用します。

### レイヤー 1：モデルの直接補完（Gateway なし）

- テスト：`src/agents/models.profiles.live.test.ts`
- 目的：
  - 検出されたモデルを列挙する
  - `getApiKeyForModel`を使用して、認証情報を持っているモデルを選択する
  - モデルごとに小規模な補完を実行する（必要に応じて対象を絞った回帰テストも実行）
- 有効化方法：
  - `pnpm test:live`（または Vitest を直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
  - このスイートを実際に実行するには、`OPENCLAW_LIVE_MODELS=modern`、`small`、または`all`（`modern`の別名）を設定します。設定しない場合はスキップされるため、`pnpm test:live`単体では Gateway スモークに対象を絞った状態が維持されます。
- モデルの選択方法：
  - `OPENCLAW_LIVE_MODELS=modern`は、厳選された重要度の高い優先リストを実行します（[ライブ：モデルマトリクス](#live-model-matrix-what-we-cover)を参照）
  - `OPENCLAW_LIVE_MODELS=small`は、厳選された小規模モデルの優先リストを実行します
  - `OPENCLAW_LIVE_MODELS=all`は`modern`の別名です
  - または`OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."`（カンマ区切りの許可リスト）
  - ローカル Ollama の小規模モデル実行では、デフォルトで`http://127.0.0.1:11434`を使用します。`OPENCLAW_LIVE_OLLAMA_BASE_URL`は、LAN、カスタム、または Ollama Cloud エンドポイントの場合にのみ設定してください。
  - modern/all および small の一括検証では、デフォルトで各厳選リストの長さが上限になります。選択したプロファイルを網羅的に一括検証するには`OPENCLAW_LIVE_MAX_MODELS=0`を設定し、より小さい上限にするには正の数を設定します。
  - 網羅的な一括検証では、直接モデルテスト全体のタイムアウトとして`OPENCLAW_LIVE_TEST_TIMEOUT_MS`を使用します。デフォルト：60 分。
  - 直接モデルプローブは、デフォルトで 20 並列で実行されます。変更するには`OPENCLAW_LIVE_MODEL_CONCURRENCY`を設定します。
- プロバイダーの選択方法：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りの許可リスト）
- キーの取得元：
  - デフォルト：プロファイルストアと環境変数のフォールバック
  - **プロファイルストア**のみに限定するには`OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`を設定します
- このテストが存在する理由：
  - 「プロバイダー API が壊れている/キーが無効」と「Gateway エージェントパイプラインが壊れている」を切り分ける
  - 小規模で分離された回帰テストを含む（例：OpenAI Responses/Codex Responses の推論リプレイとツール呼び出しフロー）

### レイヤー 2：Gateway + 開発エージェントスモーク（「@openclaw」が実際に行うこと）

- テスト：`src/gateway/gateway-models.profiles.live.test.ts`
- 目的：
  - プロセス内 Gateway を起動する
  - `agent:dev:*`セッションを作成/パッチする（実行ごとにモデルをオーバーライド）
  - キーを持つモデルを順に処理し、以下を検証する：
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが動作する（read プローブ）
    - 任意の追加ツールプローブ（exec+read プローブ）
    - OpenAI の回帰経路（ツール呼び出しのみ -> 後続処理）が引き続き動作する
- プローブの詳細（障害をすばやく説明できるようにするため）：
  - `read`プローブ：テストがワークスペースに nonce ファイルを書き込み、エージェントにそのファイルを`read`して nonce をそのまま返すよう求めます。
  - `exec+read`プローブ：テストがエージェントに`exec`で一時ファイルへ nonce を書き込み、その後`read`で読み戻すよう求めます。
  - 画像プローブ：テストが生成した PNG（猫 + ランダムなコード）を添付し、モデルが`cat <CODE>`を返すことを期待します。
  - 実装リファレンス：`src/gateway/gateway-models.profiles.live.test.ts`および`test/helpers/live-image-probe.ts`。
- 有効化方法：
  - `pnpm test:live`（または Vitest を直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法：
  - デフォルト：厳選された重要度の高い（`modern`）優先リスト
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small`は、厳選された小規模モデルリストを Gateway とエージェントを含むパイプライン全体で実行します
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`は`modern`の別名です
  - または、対象を絞るために`OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りのリスト）を設定します
  - modern/all および small の Gateway 一括検証では、デフォルトで各厳選リストの長さが上限になります。選択対象を網羅的に一括検証するには`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`を設定し、より小さい上限にするには正の数を設定します。
- プロバイダーの選択方法（「すべて OpenRouter」を避ける）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りの許可リスト）
- このライブテストでは、ツール + 画像プローブが常に有効です：
  - `read`プローブ + `exec+read`プローブ（ツールの負荷テスト）
  - モデルが画像入力対応を公開している場合、画像プローブを実行
  - フロー（概要）：
    - テストが「CAT」+ ランダムなコードを含む小さな PNG を生成（`test/helpers/live-image-probe.ts`）
    - `agent`経由で`attachments: [{ mimeType: "image/png", content: "<base64>" }]`として送信
    - Gateway が添付ファイルを`images[]`に解析（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 組み込みエージェントがマルチモーダルなユーザーメッセージをモデルに転送
    - 検証：応答に`cat` + コードが含まれる（OCR の許容範囲：軽微な誤りは許容）

<Tip>
使用中のマシンでテストできる対象（および正確な`provider/model` ID）を確認するには、以下を実行します。

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## ライブ：CLI バックエンドスモーク（Claude、Gemini、またはその他のローカル CLI）

- テスト：`src/gateway/gateway-cli-backend.live.test.ts`
- 目的：デフォルト設定に影響を与えず、ローカル CLI バックエンドを使用して Gateway とエージェントを含むパイプラインを検証します。
- バックエンド固有のスモークテストのデフォルトは、所有する Plugin の`cli-backend.ts`定義にあります。
- 有効化：
  - `pnpm test:live`（または Vitest を直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト：
  - デフォルトのプロバイダー/モデル：`claude-cli/claude-sonnet-4-6`
  - コマンド/引数/画像の動作は、所有する CLI バックエンド Plugin のメタデータから取得されます。
- オーバーライド（任意）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - 実際の画像添付を送信するには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに挿入されます）。Docker レシピではデフォルトで無効です。
  - プロンプトへの挿入ではなく、CLI 引数として画像ファイルパスを渡すには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG`が設定されている場合の画像引数の渡し方を制御するには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または`"list"`）。
  - 2 ターン目を送信して再開フローを検証するには`OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - 選択したモデルが切り替え先をサポートしている場合に、Claude Sonnet -> Opus の同一セッション継続性プローブを有効にするには`OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`。Docker レシピを含め、デフォルトでは無効です。
  - MCP/ツールループバックプローブを有効にするには`OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`。Docker レシピではデフォルトで無効です。

例：

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低コストな Gemini MCP 設定スモークテスト：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

これは Gemini に応答の生成を求めません。OpenClaw が Gemini に渡すものと同じシステム設定を書き込み、
その後`gemini --debug mcp list`を実行して、保存された`transport: "streamable-http"`サーバーが Gemini の HTTP MCP
形式に正規化され、ローカルのストリーミング可能な HTTP MCP サーバーに接続できることを確認します。

Docker レシピ：

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダー用 Docker レシピ：

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

注：

- Docker ランナーは`scripts/test-live-cli-backend-docker.sh`にあります。
- リポジトリの Docker イメージ内で、非 root の`node`ユーザーとしてライブ CLI バックエンドスモークテストを実行します。
- 所有する Plugin から CLI スモークテストのメタデータを解決し、対応する Linux CLI パッケージ（`@anthropic-ai/claude-code`または`@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト：`~/.cache/openclaw/docker-cli-tools`）にあるキャッシュ済みの書き込み可能なプレフィックスへインストールします。
- `codex-cli`はバンドルされた CLI バックエンドではなくなりました。代わりに Codex app-server ランタイムで`openai/*`を使用してください（[ライブ：Codex app-server ハーネススモーク](#live-codex-app-server-harness-smoke)を参照）。
- `pnpm test:docker:live-cli-backend:claude-subscription`では、`claudeAiOauth.subscriptionType`を含む`~/.claude/.credentials.json`、または`claude setup-token`から取得した`CLAUDE_CODE_OAUTH_TOKEN`のいずれかを通じた、ポータブルな Claude Code サブスクリプション OAuth が必要です。最初に Docker 内で直接`claude -p`が動作することを確認し、その後 Anthropic API キーの環境変数を保持せずに Gateway CLI バックエンドを 2 ターン実行します。このサブスクリプションレーンでは、ログイン済みサブスクリプションの使用量上限を消費すること、また Anthropic が OpenClaw のリリースなしに Claude Agent SDK / `claude -p`の課金およびレート制限の動作を変更する可能性があることから、Claude MCP/ツールおよび画像プローブがデフォルトで無効になっています。
- Claude と Gemini は、上記のフラグを通じて同じプローブセット（テキストターン、画像分類、MCP `cron`ツール呼び出し、モデル切り替えの継続性）をサポートしますが、これらのプローブはいずれもデフォルトでは実行されません。必要に応じて各フラグで有効にしてください。

## ライブ：APNs HTTP/2 プロキシ到達性

- テスト：`src/infra/push-apns-http2.live.test.ts`
- 目的：ローカル HTTP CONNECT プロキシを経由して Apple のサンドボックス APNs エンドポイントへトンネリングし、APNs HTTP/2 検証リクエストを送信して、Apple の実際の`403 InvalidProviderToken`応答がプロキシ経路を通じて返されることを検証します。
- 有効化：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- 任意のタイムアウト：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## ライブ：ACP バインドスモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: ライブ ACP エージェントを使用して、実際の ACP 会話バインドフローを検証する:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成メッセージチャネル会話をその場でバインドする
  - 同じ会話で通常のフォローアップを送信する
  - フォローアップがバインドされた ACP セッションのトランスクリプトに記録されることを確認する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP エージェント: `claude,codex,gemini`
  - `pnpm test:live ...` を直接実行する場合の ACP エージェント: `claude`
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1`（または `on`/`true`/`yes`）で画像プローブを強制的に有効化する。それ以外の値では強制的に無効化される。`opencode` を除くすべてのエージェントでデフォルト実行される。
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- 注記:
  - このレーンでは、テストが外部配信を装うことなくメッセージチャネルのコンテキストを付加できるように、管理者専用の合成送信元ルートフィールドを指定して Gateway の `chat.send` サーフェスを使用する。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP ハーネスエージェントについて、組み込みの `acpx` Plugin に内蔵されたエージェントレジストリを使用する。
  - バインド済みセッションでの Cron MCP 作成は、外部 ACP ハーネスがバインドおよび画像の検証完了後に MCP 呼び出しをキャンセルする可能性があるため、デフォルトではベストエフォートである。バインド後の Cron プローブを厳密にするには、`OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` を設定する。

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

単一エージェント用 Docker レシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Docker に関する注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にある。
- デフォルトでは、集約されたライブ CLI エージェントに対して ACP バインドのスモークテストを順番に実行する: `claude`、`codex`、その後 `gemini`。
- マトリクスを絞り込むには、`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使用する。
- 対応する CLI 認証情報をコンテナに配置し、要求されたライブ CLI（`@anthropic-ai/claude-code`、`@openai/codex`、`https://app.factory.ai/cli` 経由の Factory Droid、`@google/gemini-cli`、または `opencode-ai`）が存在しない場合はインストールする。ACP バックエンド自体は、公式 `acpx` Plugin に組み込まれた `acpx/runtime` パッケージである。
- Droid の Docker バリアントでは、設定用に `~/.factory` を配置し、`FACTORY_API_KEY` を転送する。ローカルの Factory OAuth/キーリング認証はコンテナへ移植できないため、この API キーが必須となる。ACPX に組み込まれた `droid exec --output-format acp` レジストリエントリを使用する。
- OpenCode の Docker バリアントは、厳密な単一エージェント回帰レーンである。`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（デフォルトは `opencode/kimi-k2.6`）から一時的な `OPENCODE_CONFIG_CONTENT` のデフォルトモデルを書き込む。
- `acpx` CLI の直接呼び出しは、Gateway 外部で動作を比較するための手動または回避策の経路に限られる。Docker ACP バインドスモークテストでは、OpenClaw に組み込まれた `acpx` ランタイムバックエンドを使用する。

## ライブ: Codex app-server ハーネスのスモークテスト

- 目的: 通常の Gateway `agent` メソッドを通じて、Plugin が所有する Codex ハーネスを検証する:
  - バンドルされた `codex` Plugin を読み込む
  - `/model <ref> --runtime codex` を使用して OpenAI モデルを選択する
  - 指定された思考レベルで、最初の Gateway エージェントターンを送信する
  - 同じ OpenClaw セッションに2回目のターンを送信し、app-server スレッドを再開できることを確認する
  - 同じ Gateway コマンド経路を通じて `/codex status` と `/codex models` を実行する
  - 必要に応じて、Guardian がレビューする権限昇格済みシェルプローブを2つ実行する。1つは承認されるべき無害なコマンド、もう1つは拒否され、エージェントがユーザーに確認を求めるべき偽のシークレットアップロードである
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- ハーネスの基準モデル: `openai/gpt-5.6-luna`
- 新規 OpenAI API キー選択のデフォルト: `openai/gpt-5.6`
- デフォルトの思考レベル: `low`
- モデルのオーバーライド: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- 思考レベルのオーバーライド: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- マトリクスのオーバーライド: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- 認証モード: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth`（デフォルト）はコピーされた Codex ログインを使用し、`api-key` は Codex app-server 経由で `OPENAI_API_KEY` を使用する。
- 任意の画像プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/ツールプローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークテストでは、プロバイダー/モデルの `agentRuntime.id: "codex"` を強制するため、壊れた Codex ハーネスが暗黙的に OpenClaw へフォールバックしてテストを通過することはできない。
- 認証: ローカルの Codex サブスクリプションログインによる Codex app-server 認証、または `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` の場合は `OPENAI_API_KEY`。Docker では、サブスクリプション実行用に `~/.codex/auth.json` と `~/.codex/config.toml` をコピーできる。

ローカルレシピ:

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-codex-harness
```

GPT-5.6 ネイティブ Codex マトリクス:

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

新規 OpenAI API キーのデフォルト:

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

この検証では `OPENCLAW_LIVE_GATEWAY_MODELS` を未設定のままにし、新規オンボーディングの推論選択シームを通じてモデルを解決し、`openai/gpt-5.6` であることを表明した後、その解決済みモデルを使用して実際の Gateway ターンを実行する。

GPT-5.6 組み込み OpenClaw マトリクス:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker に関する注記:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にある。
- `OPENAI_API_KEY` を渡し、存在する場合は Codex CLI の認証ファイルをコピーし、書き込み可能なマウント済み npm プレフィックスに `@openai/codex` をインストールし、ソースツリーを配置してから、Codex ハーネスのライブテストのみを実行する。
- Docker では画像、MCP/ツール、および Guardian のプローブがデフォルトで有効になる。より限定したデバッグ実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`、または `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定する。
- Docker は同じ明示的な Codex ランタイム設定を使用するため、レガシーエイリアスや OpenClaw へのフォールバックによって Codex ハーネスの回帰が隠れることはない。
- マトリクスのターゲットは、1つのコンテナ内で順番に実行される。Docker スクリプトはデフォルトの35分のタイムアウトをターゲット数に応じて拡張する。外側のシェルまたは CI のタイムアウトでも、同じ合計時間を許容する必要がある。標準 CI では、各 GPT-5.6 ターゲットを個別のシャードに分ける。

### 推奨ライブレシピ

限定的で明示的な許可リストが最も高速で不安定性が少ない:

- 単一モデル、直接実行（Gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小規模モデルの直接プロファイル:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小規模モデルの Gateway プロファイル:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API のスモークテスト:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 単一モデルの Gateway スモークテスト:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーでのツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 の直接スモークテスト:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google に重点を置いたテスト（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 適応的思考のスモークテスト（非公開 QA CLI の `qa manual`。`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` とソースチェックアウトが必要。[QA の概要](/ja-JP/concepts/qa-e2e-automation)を参照）:
  - Gemini 3 の動的デフォルト: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 の動的予算: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注記:

- `google/...` は Gemini API（API キー）を使用する。
- `google-antigravity/...` は Antigravity OAuth ブリッジ（Cloud Code Assist 形式のエージェントエンドポイント）を使用する。
- `google-gemini-cli/...` はマシン上のローカル Gemini CLI を使用する（認証が別で、ツール固有の癖もある）。
- Gemini API と Gemini CLI の比較:
  - API: OpenClaw は Google がホストする Gemini API を HTTP 経由で呼び出す（API キー/プロファイル認証）。多くのユーザーが「Gemini」と呼ぶものはこれを指す。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェルから実行する。独自の認証を持ち、動作が異なる場合がある（ストリーミング/ツール対応/バージョン差異）。

## ライブ: モデルマトリクス（対象範囲）

ライブテストはオプトインのため、固定された「CI モデル一覧」は存在しない。`OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern`（およびその `all` エイリアス）は、`src/agents/live-model-filter.ts` の `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` にある厳選された優先リストを、次の優先順位で実行する:

| プロバイダー/モデル                            | 注記       |
| --------------------------------------------- | ---------- |
| `anthropic/claude-opus-4-8`                   |            |
| `anthropic/claude-sonnet-5`                   |            |
| `anthropic/claude-sonnet-4-6`                 |            |
| `anthropic/claude-opus-4-7`                   |            |
| `google/gemini-3.1-pro-preview`               | Gemini API |
| `google/gemini-3.5-flash`                     | Gemini API |
| `cohere/command-a-plus-05-2026`               |            |
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
| `xai/grok-4.5`                                |            |
| `xai/grok-4.20-0309-reasoning`                |            |
| `zai/glm-5.1`                                 |            |
| `fireworks/accounts/fireworks/models/glm-5p1` |            |
| `minimax-portal/minimax-m3`                   |            |

`SMALL_LIVE_MODEL_PRIORITY` に基づく、厳選された**小規模モデル**リスト（`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`）：

| プロバイダー/モデル          |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

最新リストに関する注記：

- `codex` および `codex-cli` プロバイダーは、デフォルトの最新スイープから除外されています（これらは CLI バックエンド/ACP の動作を対象とし、上記で個別にテストされます）。`openai/gpt-5.5` 自体は、デフォルトで Codex app-server ハーネスを経由します。[ライブ：Codex app-server ハーネスのスモークテスト](#live-codex-app-server-harness-smoke)を参照してください。
- `fireworks`、`google`、`openrouter`、`xai` は、最新スイープで明示的に厳選されたモデル ID のみを実行します（「このプロバイダーの全モデル」を自動的に展開することはありません）。
- 画像プローブを実行するには、`OPENCLAW_LIVE_GATEWAY_MODELS` に画像対応モデル（Claude/Gemini/OpenAI 系のビジョンバリアントなど）を少なくとも1つ含めてください。

厳選した複数プロバイダーのセットで、ツールと画像を使用する Gateway スモークテストを実行します：

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

厳選リスト外での追加カバレッジ（任意。利用可能な「ツール」対応モデルを選択）：

- Mistral：`mistral/...`
- Cerebras：`cerebras/...`（アクセス権がある場合）
- LM Studio：`lmstudio/...`（ローカル。ツール呼び出しは API モードに依存）

### アグリゲーター / 代替 Gateway

キーを有効にしている場合は、以下を経由してテストすることもできます：

- OpenRouter：`openrouter/...`（数百のモデル。ツールと画像に対応した候補を見つけるには `openclaw models scan` を使用）
- OpenCode：Zen には `opencode/...`、Go には `opencode-go/...`（`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` で認証）

ライブマトリックスに含められるその他のプロバイダー（認証情報/設定がある場合）：

- 組み込み：`anthropic`、`cerebras`、`github-copilot`、`google`、`google-antigravity`、`google-gemini-cli`、`google-vertex`、`groq`、`mistral`、`openai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`zai`
- `models.providers` 経由（カスタムエンドポイント）：`minimax`（クラウド/API）、および任意の OpenAI/Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

<Tip>
ドキュメントに「すべてのモデル」をハードコードしないでください。正式なリストは、使用しているマシン上で `discoverModels(...)` が返す内容と、利用可能なキーによって決まります。
</Tip>

## 認証情報（絶対にコミットしない）

ライブテストは、CLI と同じ方法で認証情報を検出します。実務上の意味は次のとおりです：

- CLI が動作する場合、ライブテストも同じキーを検出できるはずです。
- ライブテストで「認証情報なし」と表示された場合は、`openclaw models list` / モデル選択をデバッグする場合と同じ方法でデバッグしてください。

- エージェントごとの認証プロファイル：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（ライブテスト内の「プロファイルキー」はこれを意味します）
- 設定：`~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- 旧 OAuth ディレクトリ：`~/.openclaw/credentials/`（存在する場合はステージング済みのライブホームにコピーされますが、メインのプロファイルキーストアではありません）
- ローカルのライブ実行では、アクティブな設定（`agents.*.workspace` / `agentDir` のオーバーライドを除去）と各エージェントの `auth-profiles.json` のみを一時テストホームにコピーします。そのエージェントの残りのディレクトリはコピーしないため、`workspace/` と `sandboxes/` のデータがステージング済みホームに到達することはありません。さらに、旧 `credentials/` ディレクトリと、サポートされている外部 CLI の認証ファイル/ディレクトリ（`.claude.json`、`.claude/.credentials.json`、`.claude/settings*.json`、`.claude/backups`、`.codex/auth.json`、`.codex/config.toml`、`.gemini`、`.minimax`）もコピーします。

環境変数のキーを使用する場合は、ローカルテストの前にエクスポートするか、
以下の Docker ランナーで明示的な `OPENCLAW_PROFILE_FILE` を使用してください。

## Deepgram ライブ（音声文字起こし）

- テスト：`extensions/deepgram/audio.live.test.ts`
- 有効化：`DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus コーディングプランのライブテスト

- テスト：`extensions/byteplus/live.test.ts`
- 有効化：`BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 任意のモデルオーバーライド：`BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI ワークフローメディアのライブテスト

- テスト：`extensions/comfy/comfy.live.test.ts`
- 有効化：`OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 対象範囲：
  - バンドルされた comfy の画像、動画、および `music_generate` パスを実行
  - `plugins.entries.comfy.config.<capability>` が設定されていない各機能をスキップ
  - comfy のワークフロー送信、ポーリング、ダウンロード、または Plugin 登録を変更した後に有用

## 画像生成のライブテスト

- テスト：`test/image-generation.runtime.live.test.ts`
- コマンド：`pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス：`pnpm test:live:media image`
- 対象範囲：
  - 登録済みのすべての画像生成プロバイダー Plugin を列挙
  - プローブの前に、すでにエクスポートされているプロバイダー環境変数を使用
  - デフォルトでは保存済みの認証プロファイルよりライブ/環境 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠すことはない
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップ
  - 設定済みの各プロバイダーを共有画像生成ランタイムで実行：
    - `<provider>:generate`
    - プロバイダーが編集対応を宣言している場合は `<provider>:edit`
- 現在対象となるバンドル済みプロバイダー：
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- 任意の絞り込み：
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- 任意の認証動作：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：プロファイルストア認証を強制し、環境変数のみのオーバーライドを無視

出荷済みの CLI パスについては、プロバイダー/ランタイムのライブテストが
成功した後に `infer` スモークテストを追加します：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

これは、CLI 引数の解析、設定/デフォルトエージェントの解決、バンドル済み
Plugin の有効化、共有画像生成ランタイム、およびライブプロバイダーへの
リクエストを対象とします。Plugin の依存関係は、ランタイムのロード前に存在している必要があります。

## 音楽生成のライブテスト

- テスト：`extensions/music-generation-providers.live.test.ts`
- 有効化：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス：`pnpm test:live:media music`
- 対象範囲：
  - 共有のバンドル済み音楽生成プロバイダーパスを実行
  - 現在は `fal`、`google`、`minimax`、`openrouter` を対象とする
  - プローブの前に、すでにエクスポートされているプロバイダー環境変数を使用
  - デフォルトでは保存済みの認証プロファイルよりライブ/環境 API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠すことはない
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップ
  - 利用可能な場合は、宣言された両方のランタイムモードを実行：
    - プロンプトのみの入力による `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合は `edit`
  - `comfy` には独自のライブファイルがあり、この共有スイープには含まれない
- 任意の絞り込み：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 任意の認証動作：
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`：プロファイルストア認証を強制し、環境変数のみのオーバーライドを無視

## 動画生成のライブテスト

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- 対象範囲:
  - `alibaba`、`byteplus`、`deepinfra`、`fal`、`google`、`minimax`、`openai`、`openrouter`、`pixverse`、`qwen`、`runway`、`together`、`vydra`、`xai` にわたって、共有のバンドル済み動画生成プロバイダーパスを実行する
  - デフォルトではリリースに安全なスモークパスを使用する。プロバイダーごとにテキストから動画へのリクエストを1回、1秒間のロブスタープロンプト、および `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` に基づくプロバイダーごとの処理上限（デフォルトは `180000`）を使用する
  - プロバイダー側のキュー遅延がリリース時間の大半を占める可能性があるため、デフォルトでは FAL をスキップする。明示的に実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡す（またはスキップリストを空にする）
  - プローブの前に、すでにエクスポートされているプロバイダー環境変数を使用する
  - デフォルトでは、保存済み認証プロファイルよりもライブ環境または環境変数の API キーを優先するため、`auth-profiles.json` 内の古いテストキーによって実際のシェル認証情報が隠されることはない
  - 使用可能な認証、プロファイル、モデルがないプロバイダーをスキップする
  - デフォルトでは `generate` のみを実行する
  - 使用可能な場合に宣言済みの変換モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定する:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択したプロバイダーとモデルが共有スイープ内でバッファーに格納されたローカル画像入力を受け付ける場合は `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択したプロバイダーとモデルが共有スイープ内でバッファーに格納されたローカル動画入力を受け付ける場合は `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - `vydra`（このレーンではバッファーに格納されたローカル画像入力はサポートされない）
  - Vydra 固有のカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは、`veo3` のテキストから動画へのレーンに加え、デフォルトでリモート画像 URL フィクスチャを使用する `kling` の画像から動画へのレーンを実行する（上書きするには `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` を使用する）。
  - xAI 固有のカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - クラシックケースでは、正方形のローカル PNG を最初のフレームとして生成し、ジオメトリを省略し、1秒間の画像から動画へのクリップをリクエストし、完了までポーリングして、ダウンロードしたバッファーを検証する。
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - 1.5 ケースでは、ローカル PNG を最初のフレームとして生成し、1秒間の 1080P 画像から動画へのクリップをリクエストし、完了までポーリングして、ダウンロードしたバッファーを検証する。
  - 現在の `videoToVideo` ライブカバレッジ:
    - 選択したモデルが `gen4_aleph` に解決される場合のみ `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`、`google`、`openai`、`qwen`、`xai`。これらのパスでは現在、バッファーに格納されたローカル入力ではなく、リモートの `http(s)` 参照 URL が必要なため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL を含むすべてのプロバイダーをデフォルトのスイープに含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - アグレッシブなスモーク実行のために、各プロバイダーの処理上限を短縮するには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - プロファイルストアの認証を強制し、環境変数のみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- エントリーポイント: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`。選択したスイートごとに `pnpm test:live -- <suite-test-file>` を実行するため、Heartbeat と静音モードの動作はほかの `pnpm test:live` 実行と一貫する。
- 目的:
  - 共有の画像、音楽、動画ライブスイートを、リポジトリ標準の単一エントリーポイントから実行する
  - 不足しているプロバイダー環境変数を `~/.profile` から自動的に読み込む
  - デフォルトでは、各スイートを現在使用可能な認証を持つプロバイダーに自動的に絞り込む
- フラグ:
  - `--providers <csv>` はグローバルなプロバイダーフィルター。`--image-providers` / `--music-providers` / `--video-providers` はフィルターを1つのスイートに限定する
  - `--all-providers` は認証に基づく自動フィルターをスキップする
  - `--allow-empty` は、フィルタリング後に実行可能なプロバイダーが残らない場合に `0` で終了する
  - `--quiet` / `--no-quiet` は `test:live` にそのまま渡される
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連項目

- [テスト](/ja-JP/help/testing) - ユニット、統合、QA、Docker スイート
