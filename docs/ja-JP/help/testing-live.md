---
read_when:
    - ライブモデルマトリックス / CLI バックエンド / ACP / メディアプロバイダーのスモークテストを実行する
    - ライブテストの認証情報解決をデバッグする
    - プロバイダー固有の新しいライブテストの追加
sidebarTitle: Live tests
summary: ライブ（ネットワーク接続を伴う）テスト：モデルマトリックス、CLI バックエンド、ACP、メディアプロバイダー、認証情報
title: テスト：ライブスイート
x-i18n:
    generated_at: "2026-07-12T14:32:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

クイックスタート、QA ランナー、ユニット/統合スイート、Docker フローについては、
[テスト](/ja-JP/help/testing)を参照してください。このページでは、**ライブ**（ネットワークにアクセスする）テスト、
つまりモデルマトリクス、CLI バックエンド、ACP、メディアプロバイダー、認証情報の取り扱いについて説明します。

## ライブ：ローカルスモークコマンド

アドホックなライブチェックを行う前に、必要なプロバイダーキーをプロセス環境へエクスポートします。

安全なメディアスモーク：

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw のライブスモーク。" \
  --output /tmp/openclaw-live-smoke.mp3
```

安全な音声通話準備状況スモーク：

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke`は、`--yes`も指定しない限りドライランです。実際に
通話を発信する場合にのみ`--yes`を使用してください。Twilio、Telnyx、Plivo では、
準備状況チェックが成功するには公開 Webhook URL が必要です。これらのプロバイダーから
到達できないため、ローカル/プライベートのループバック URL は拒否されます。

## ライブ：Android Node 機能スイープ

- テスト：`src/gateway/android-node.capabilities.live.test.ts`
- スクリプト：`pnpm android:test:integration`
- 目的：接続された Android Node が**現在公開しているすべてのコマンド**を呼び出し、コマンド契約の動作を検証します。
- スコープ：
  - 事前条件を満たした手動セットアップ（このスイートはアプリのインストール、実行、ペアリングを行いません）。
  - 選択した Android Node に対するコマンドごとの Gateway `node.invoke`検証。
- 必要な事前セットアップ：
  - Android アプリがすでに Gateway に接続され、ペアリングされていること。
  - アプリがフォアグラウンドで維持されていること。
  - 成功を期待する機能について、権限/キャプチャへの同意が付与されていること。
- オプションの対象オーバーライド：
  - `OPENCLAW_ANDROID_NODE_ID`または`OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細：[Android アプリ](/ja-JP/platforms/android)

## ライブ：モデルスモーク（プロファイルキー）

ライブモデルテストは、障害を分離できるように 2 つのレイヤーに分かれています。

- 「直接モデル」は、指定されたキーでプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gateway スモーク」は、そのモデルについて Gateway+エージェントのパイプライン全体（セッション、履歴、ツール、サンドボックスポリシーなど）が動作するかを示します。

以下の厳選されたモデルリストは`src/agents/live-model-filter.ts`にあり、
時間の経過とともに変更されます。このページではなく、そこにある配列を信頼できる唯一の情報源として
扱ってください。

MiniMax M3 は、デフォルトのプロバイダー/モデル参照として`minimax/MiniMax-M3`を使用します。

### レイヤー 1：直接モデル補完（Gateway なし）

- テスト：`src/agents/models.profiles.live.test.ts`
- 目的：
  - 検出されたモデルを列挙する
  - `getApiKeyForModel`を使用して、認証情報を持つモデルを選択する
  - モデルごとに小規模な補完を実行する（必要に応じて対象を絞った回帰テストも実行）
- 有効化方法：
  - `pnpm test:live`（または Vitest を直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
  - このスイートを実際に実行するには、`OPENCLAW_LIVE_MODELS=modern`、`small`、または`all`（`modern`のエイリアス）を設定します。それ以外の場合はスキップされるため、`pnpm test:live`単独では Gateway スモークに集中します。
- モデルの選択方法：
  - `OPENCLAW_LIVE_MODELS=modern`は、厳選されたシグナルの高い優先リストを実行します（[ライブ：モデルマトリクス](#live-model-matrix-what-we-cover)を参照）
  - `OPENCLAW_LIVE_MODELS=small`は、厳選された小規模モデルの優先リストを実行します
  - `OPENCLAW_LIVE_MODELS=all`は`modern`のエイリアスです
  - または`OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."`（カンマ区切りの許可リスト）
  - ローカル Ollama の小規模モデル実行では、デフォルトで`http://127.0.0.1:11434`を使用します。LAN、カスタム、または Ollama Cloud エンドポイントの場合にのみ`OPENCLAW_LIVE_OLLAMA_BASE_URL`を設定してください。
  - modern/all および small のスイープでは、デフォルトで各厳選リストの長さを上限とします。選択したプロファイルを網羅的にスイープするには`OPENCLAW_LIVE_MAX_MODELS=0`を、より小さい上限にするには正の数を設定します。
  - 網羅的なスイープでは、直接モデルテスト全体のタイムアウトとして`OPENCLAW_LIVE_TEST_TIMEOUT_MS`を使用します。デフォルト：60 分。
  - 直接モデルプローブは、デフォルトで 20 並列で実行されます。変更するには`OPENCLAW_LIVE_MODEL_CONCURRENCY`を設定します。
- プロバイダーの選択方法：
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りの許可リスト）
- キーの取得元：
  - デフォルト：プロファイルストアと環境変数のフォールバック
  - **プロファイルストア**のみに限定するには`OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`を設定
- このテストが存在する理由：
  - 「プロバイダー API が壊れている/キーが無効」と「Gateway エージェントパイプラインが壊れている」を分離します
  - 小規模で独立した回帰テストを含みます（例：OpenAI Responses/Codex Responses の推論リプレイとツール呼び出しフロー）

### レイヤー 2：Gateway + 開発エージェントスモーク（「@openclaw」が実際に行うこと）

- テスト：`src/gateway/gateway-models.profiles.live.test.ts`
- 目的：
  - インプロセス Gateway を起動する
  - `agent:dev:*`セッションを作成/パッチする（実行ごとにモデルをオーバーライド）
  - キーを持つモデルを反復し、以下を検証する：
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが動作する（読み取りプローブ）
    - オプションの追加ツールプローブ（実行+読み取りプローブ）
    - OpenAI の回帰パス（ツール呼び出しのみ -> フォローアップ）が引き続き動作する
- プローブの詳細（障害をすばやく説明できるようにするため）：
  - `read`プローブ：テストはワークスペースに nonce ファイルを書き込み、エージェントにそれを`read`して nonce をそのまま返すよう依頼します。
  - `exec+read`プローブ：テストはエージェントに、一時ファイルへ nonce を`exec`で書き込み、その後`read`で読み戻すよう依頼します。
  - 画像プローブ：テストは生成した PNG（猫 + ランダム化されたコード）を添付し、モデルが`cat <CODE>`を返すことを期待します。
  - 実装リファレンス：`src/gateway/gateway-models.profiles.live.test.ts`および`test/helpers/live-image-probe.ts`。
- 有効化方法：
  - `pnpm test:live`（または Vitest を直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法：
  - デフォルト：厳選されたシグナルの高い（`modern`）優先リスト
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small`は、厳選された小規模モデルリストを Gateway+エージェントのパイプライン全体で実行します
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`は`modern`のエイリアスです
  - または、対象を絞るには`OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りのリスト）を設定
  - modern/all および small の Gateway スイープでは、デフォルトで各厳選リストの長さを上限とします。選択した対象を網羅的にスイープするには`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`を、より小さい上限にするには正の数を設定します。
- プロバイダーの選択方法（「すべて OpenRouter」を避ける）：
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りの許可リスト）
- このライブテストでは、ツール + 画像プローブが常に有効です：
  - `read`プローブ + `exec+read`プローブ（ツールのストレステスト）
  - モデルが画像入力のサポートを公開している場合、画像プローブを実行
  - フロー（概要）：
    - テストが「CAT」+ ランダムコードを含む小さな PNG を生成します（`test/helpers/live-image-probe.ts`）
    - `agent`の`attachments: [{ mimeType: "image/png", content: "<base64>" }]`を介して送信します
    - Gateway が添付ファイルを`images[]`へ解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 組み込みエージェントがマルチモーダルなユーザーメッセージをモデルへ転送します
    - 検証：応答に`cat` + コードが含まれること（OCR 許容範囲：軽微な誤りは許可）

<Tip>
お使いのマシンでテストできる対象（および正確な`provider/model` ID）を確認するには、次を実行します：

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## ライブ：CLI バックエンドスモーク（Claude、Gemini、またはその他のローカル CLI）

- テスト：`src/gateway/gateway-cli-backend.live.test.ts`
- 目的：デフォルト設定に触れることなく、ローカル CLI バックエンドを使用して Gateway + エージェントパイプラインを検証します。
- バックエンド固有のスモークデフォルトは、所有する Plugin の`cli-backend.ts`定義にあります。
- 有効化：
  - `pnpm test:live`（または Vitest を直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト：
  - デフォルトのプロバイダー/モデル：`claude-cli/claude-sonnet-4-6`
  - コマンド/引数/画像の動作は、所有する CLI バックエンド Plugin のメタデータから取得されます。
- オーバーライド（オプション）：
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - 実際の画像添付を送信するには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに挿入されます）。Docker レシピではデフォルトで無効です。
  - プロンプトへの挿入ではなく、画像ファイルのパスを CLI 引数として渡すには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG`が設定されている場合に画像引数を渡す方法を制御するには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または`"list"`）。
  - 2 ターン目を送信して再開フローを検証するには`OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - 選択したモデルが切り替え先をサポートしている場合に、同一セッション内の Claude Sonnet -> Opus 継続性プローブを有効にするには`OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`。Docker レシピを含め、デフォルトでは無効です。
  - MCP/ツールのループバックプローブを有効にするには`OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`。Docker レシピではデフォルトで無効です。

例：

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

低コストの Gemini MCP 設定スモーク：

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

これは Gemini に応答の生成を依頼しません。OpenClaw が Gemini に渡すものと同じシステム
設定を書き込み、その後`gemini --debug mcp list`を実行して、保存された
`transport: "streamable-http"`サーバーが Gemini の HTTP MCP 形式に正規化され、
ローカルの streamable-HTTP MCP サーバーへ接続できることを証明します。

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
- リポジトリの Docker イメージ内で、非 root の`node`ユーザーとしてライブ CLI バックエンドスモークを実行します。
- 所有する Plugin から CLI スモークメタデータを解決し、一致する Linux CLI パッケージ（`@anthropic-ai/claude-code`または`@google/gemini-cli`）を`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト：`~/.cache/openclaw/docker-cli-tools`）のキャッシュされた書き込み可能なプレフィックスへインストールします。
- `codex-cli`はバンドルされた CLI バックエンドではなくなりました。代わりに Codex app-server ランタイムで`openai/*`を使用してください（[ライブ：Codex app-server ハーネススモーク](#live-codex-app-server-harness-smoke)を参照）。
- `pnpm test:docker:live-cli-backend:claude-subscription`には、`claudeAiOauth.subscriptionType`を含む`~/.claude/.credentials.json`、または`claude setup-token`から取得した`CLAUDE_CODE_OAUTH_TOKEN`のいずれかを使用した、移植可能な Claude Code サブスクリプション OAuth が必要です。まず Docker 内で直接`claude -p`を実行できることを証明し、その後 Anthropic API キーの環境変数を保持せずに Gateway CLI バックエンドの 2 ターンを実行します。このサブスクリプションレーンでは、サインイン済みサブスクリプションの使用量制限を消費すること、また Anthropic が OpenClaw のリリースなしに Claude Agent SDK / `claude -p`の課金およびレート制限の動作を変更できることから、Claude MCP/ツールおよび画像プローブをデフォルトで無効にします。
- Claude と Gemini は、上記のフラグを介して同じプローブセット（テキストターン、画像分類、MCP `cron`ツール呼び出し、モデル切り替えの継続性）をサポートしますが、これらのプローブはいずれもデフォルトでは実行されません。必要に応じてフラグごとに有効化してください。

## ライブ：APNs HTTP/2 プロキシ到達可能性

- テスト：`src/infra/push-apns-http2.live.test.ts`
- 目的：ローカル HTTP CONNECT プロキシを介して Apple のサンドボックス APNs エンドポイントへトンネリングし、APNs HTTP/2 検証リクエストを送信して、Apple の実際の`403 InvalidProviderToken`応答がプロキシパス経由で返されることを検証します。
- 有効化：
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- オプションのタイムアウト：
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## ライブ：ACP バインドスモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: ライブ ACP エージェントを使用して、実際の ACP 会話バインドフローを検証する:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成メッセージチャネルの会話をその場でバインドする
  - 同じ会話で通常のフォローアップを送信する
  - フォローアップがバインドされた ACP セッションのトランスクリプトに記録されることを確認する
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1`（または `on`/`true`/`yes`）で画像プローブを強制的に有効化する。それ以外の値では強制的に無効化される。`opencode` を除くすべてのエージェントでデフォルト実行される。
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- 注記:
  - このレーンでは、管理者専用の合成送信元ルートフィールドとともに Gateway の `chat.send` サーフェスを使用するため、テストは外部配信を装うことなくメッセージチャネルのコンテキストを関連付けられる。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択された ACP ハーネスエージェントについて、組み込み `acpx` Plugin の内蔵エージェントレジストリを使用する。
  - 外部 ACP ハーネスはバインド/画像の検証が成功した後に MCP 呼び出しをキャンセルする可能性があるため、バインド済みセッションでの Cron MCP 作成はデフォルトでベストエフォートとなる。バインド後の Cron プローブを厳格にするには、`OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` を設定する。

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
- デフォルトでは、集約されたライブ CLI エージェントに対して、`claude`、`codex`、`gemini` の順に ACP バインドスモークを実行する。
- マトリクスを絞り込むには、`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` を使用する。
- 一致する CLI 認証情報をコンテナにステージングし、要求されたライブ CLI（`@anthropic-ai/claude-code`、`@openai/codex`、`https://app.factory.ai/cli` 経由の Factory Droid、`@google/gemini-cli`、または `opencode-ai`）が存在しない場合はインストールする。ACP バックエンド自体は、公式 `acpx` Plugin に含まれる組み込みの `acpx/runtime` パッケージである。
- Droid の Docker バリアントは、設定用に `~/.factory` をステージングし、`FACTORY_API_KEY` を転送する。ローカルの Factory OAuth/キーリング認証はコンテナに移植できないため、この API キーが必要となる。ACPX 内蔵の `droid exec --output-format acp` レジストリエントリを使用する。
- OpenCode の Docker バリアントは、厳格な単一エージェント回帰レーンである。`OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL`（デフォルトは `opencode/kimi-k2.6`）から、一時的な `OPENCODE_CONFIG_CONTENT` のデフォルトモデルを書き込む。
- `acpx` CLI の直接呼び出しは、Gateway 外部の動作を比較するための手動/回避策のパスにすぎない。Docker ACP バインドスモークは、OpenClaw の組み込み `acpx` ランタイムバックエンドを実行する。

## ライブ: Codex app-server ハーネススモーク

- 目的: Plugin が所有する Codex ハーネスを通常の Gateway
  `agent` メソッド経由で検証する:
  - バンドルされた `codex` Plugin を読み込む
  - `/model <ref> --runtime codex` で OpenAI モデルを選択する
  - 要求された思考レベルで最初の Gateway エージェントターンを送信する
  - 同じ OpenClaw セッションに 2 回目のターンを送信し、app-server
    スレッドを再開できることを確認する
  - 同じ Gateway コマンドパスを通じて `/codex status` と `/codex models`
    を実行する
  - 必要に応じて、Guardian によるレビューを受ける権限昇格シェルプローブを 2 つ実行する。1 つは承認されるべき無害な
    コマンドで、もう 1 つは拒否されてエージェントが確認を求めるべき偽シークレットのアップロードである
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- ハーネスのベースラインモデル: `openai/gpt-5.6-luna`
- 新規 OpenAI API キー選択のデフォルト: `openai/gpt-5.6`
- デフォルトの思考レベル: `low`
- モデルのオーバーライド: `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- 思考レベルのオーバーライド: `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- マトリクスのオーバーライド: `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- 認証モード: `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth`（デフォルト）はコピーされた
  Codex ログインを使用し、`api-key` は Codex app-server 経由で `OPENAI_API_KEY` を使用する。
- オプションの画像プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- オプションの MCP/ツールプローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- オプションの Guardian プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークはプロバイダー/モデルの `agentRuntime.id: "codex"` を強制するため、壊れた Codex
  ハーネスが暗黙に OpenClaw へフォールバックして成功することはない。
- 認証: ローカル Codex サブスクリプションログインによる Codex app-server 認証、または
  `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key` の場合は `OPENAI_API_KEY`。Docker は
  サブスクリプション実行用に `~/.codex/auth.json` と `~/.codex/config.toml` をコピーできる。

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

この検証では `OPENCLAW_LIVE_GATEWAY_MODELS` を未設定のままにし、新規オンボーディングの推論選択シームを通じて
モデルを解決し、`openai/gpt-5.6` であることをアサートした後、その解決済みモデルで
実際の Gateway ターンを実行する。

GPT-5.6 組み込み OpenClaw マトリクス:

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Docker に関する注記:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にある。
- `OPENAI_API_KEY` を渡し、存在する場合は Codex CLI 認証ファイルをコピーし、書き込み可能なマウント済み npm
  プレフィックスに `@openai/codex` をインストールし、ソースツリーをステージングしてから、Codex ハーネスのライブテストのみを実行する。
- Docker では画像、MCP/ツール、Guardian の各プローブがデフォルトで有効になる。より限定的なデバッグ
  実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`、または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定する。
- Docker は同じ明示的な Codex ランタイム設定を使用するため、レガシーエイリアスや OpenClaw
  フォールバックで Codex ハーネスの回帰を隠すことはできない。
- マトリクスターゲットは 1 つのコンテナ内で順次実行される。Docker スクリプトはターゲット数に応じて
  デフォルトの 35 分タイムアウトを調整するため、外側のシェルまたは CI のタイムアウトでも同じ合計時間を
  許容する必要がある。標準 CI では各 GPT-5.6 ターゲットを個別のシャードに分ける。

### 推奨ライブレシピ

限定的で明示的な許可リストが最速かつ最も不安定になりにくい:

- 単一モデル、直接実行（Gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- 小規模モデルの直接プロファイル:
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- 小規模モデルの Gateway プロファイル:
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ollama Cloud API スモーク:
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- 単一モデル、Gateway スモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがるツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Z.AI Coding Plan GLM-5.2 の直接スモーク:
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Google に焦点を当てた実行（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 適応的思考スモーク（プライベート QA CLI の `qa manual`。`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` とソースチェックアウトが必要。[QA の概要](/ja-JP/concepts/qa-e2e-automation)を参照）:
  - Gemini 3 の動的デフォルト: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Gemini 2.5 の動的バジェット: `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

注記:

- `google/...` は Gemini API（API キー）を使用する。
- `google-antigravity/...` は Antigravity OAuth ブリッジ（Cloud Code Assist 形式のエージェントエンドポイント）を使用する。
- `google-gemini-cli/...` はマシン上のローカル Gemini CLI を使用する（個別の認証とツール固有の挙動がある）。
- Gemini API と Gemini CLI の比較:
  - API: OpenClaw は Google がホストする Gemini API を HTTP 経由で呼び出す（API キー/プロファイル認証）。これは、ほとんどのユーザーが「Gemini」と呼ぶものを指す。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル経由で実行する。独自の認証を持ち、動作が異なる場合がある（ストリーミング/ツール対応/バージョン差異）。

## ライブ: モデルマトリクス（対象範囲）

ライブ実行はオプトインであるため、固定の「CI モデルリスト」は存在しない。`OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern`（およびそれらの `all` エイリアス）は、`src/agents/live-model-filter.ts` の `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` にある厳選された優先リストを、次の優先順位で実行する:

| プロバイダー/モデル                            | 備考       |
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

- `codex` および `codex-cli` プロバイダーは、デフォルトの最新スイープから除外されます（これらは CLI バックエンド/ACP の動作を対象とし、上記で個別にテストされています）。`openai/gpt-5.5` 自体はデフォルトで Codex app-server ハーネス経由でルーティングされます。[ライブ：Codex app-server ハーネスのスモークテスト](#live-codex-app-server-harness-smoke)を参照してください。
- 最新スイープでは、`fireworks`、`google`、`openrouter`、`xai` は明示的に厳選されたモデル ID のみを実行します（「このプロバイダーのすべてのモデル」への自動展開は行いません）。
- 画像プローブを実行するには、画像対応モデル（Claude/Gemini/OpenAI ファミリーのビジョンバリアントなど）を少なくとも 1 つ `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください。

厳選した複数プロバイダーのセットに対して、ツールと画像を使用する Gateway スモークテストを実行します：

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

厳選リスト外での追加カバレッジ（任意。あると望ましい。有効化済みの「ツール」対応モデルを選択）：

- Mistral：`mistral/...`
- Cerebras：`cerebras/...`（アクセス権がある場合）
- LM Studio：`lmstudio/...`（ローカル。ツール呼び出しは API モードに依存）

### アグリゲーター / 代替 Gateway

キーを有効化している場合は、以下を介してテストすることもできます：

- OpenRouter：`openrouter/...`（数百のモデル。ツールと画像に対応する候補を見つけるには `openclaw models scan` を使用）
- OpenCode：Zen には `opencode/...`、Go には `opencode-go/...`（`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` で認証）

ライブマトリックスに追加できるプロバイダー（認証情報/設定がある場合）：

- 組み込み：`anthropic`、`cerebras`、`github-copilot`、`google`、`google-antigravity`、`google-gemini-cli`、`google-vertex`、`groq`、`mistral`、`openai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`zai`
- `models.providers` 経由（カスタムエンドポイント）：`minimax`（クラウド/API）、および OpenAI/Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

<Tip>
ドキュメントに「すべてのモデル」をハードコードしないでください。正規のリストは、利用可能なキーに加えて、使用しているマシン上で `discoverModels(...)` が返す内容です。
</Tip>

## 認証情報（絶対にコミットしないこと）

ライブテストは CLI と同じ方法で認証情報を検出します。実用上の意味は次のとおりです：

- CLI が動作する場合、ライブテストでも同じキーが検出されるはずです。
- ライブテストで「認証情報なし」と表示された場合は、`openclaw models list` / モデル選択をデバッグする場合と同じ方法でデバッグしてください。

- エージェントごとの認証プロファイル：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（ライブテストでいう「プロファイルキー」とはこれを指します）
- 設定：`~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー OAuth ディレクトリ：`~/.openclaw/credentials/`（存在する場合はステージング済みライブホームにコピーされますが、主要なプロファイルキーストアではありません）
- ローカルライブ実行では、アクティブな設定（`agents.*.workspace` / `agentDir` のオーバーライドを除去済み）と各エージェントの `auth-profiles.json` のみをコピーし、そのエージェントの残りのディレクトリはコピーしません。そのため、`workspace/` および `sandboxes/` のデータがステージング済みホームに到達することはありません。さらに、レガシーの `credentials/` ディレクトリと、サポートされる外部 CLI の認証ファイル/ディレクトリ（`.claude.json`、`.claude/.credentials.json`、`.claude/settings*.json`、`.claude/backups`、`.codex/auth.json`、`.codex/config.toml`、`.gemini`、`.minimax`）を一時テストホームにコピーします。

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
  - バンドルされた comfy の画像、動画、`music_generate` パスを実行します
  - `plugins.entries.comfy.config.<capability>` が設定されていない限り、各機能をスキップします
  - comfy ワークフローの送信、ポーリング、ダウンロード、または Plugin 登録を変更した後に役立ちます

## 画像生成のライブテスト

- テスト：`test/image-generation.runtime.live.test.ts`
- コマンド：`pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス：`pnpm test:live:media image`
- 対象範囲：
  - 登録済みのすべての画像生成プロバイダー Plugin を列挙します
  - プローブの前に、すでにエクスポートされているプロバイダー環境変数を使用します
  - デフォルトでは、保存済み認証プロファイルよりライブ/環境変数の API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠すことはありません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 設定済みの各プロバイダーを共有画像生成ランタイム経由で実行します：
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
  - プロファイルストア認証を強制し、環境変数のみのオーバーライドを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

リリース済み CLI パスについては、プロバイダー/ランタイムのライブ
テストに合格した後で `infer` スモークテストを追加します：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "テキストなし、白い背景に青い正方形が 1 つある、ミニマルでフラットなテスト画像。" \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

これは、CLI 引数の解析、設定/デフォルトエージェントの解決、バンドル済み
Plugin の有効化、共有画像生成ランタイム、およびライブプロバイダー
リクエストを対象とします。Plugin の依存関係は、ランタイムの読み込み前に存在することが前提です。

## 音楽生成のライブテスト

- テスト：`extensions/music-generation-providers.live.test.ts`
- 有効化：`OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス：`pnpm test:live:media music`
- 対象範囲：
  - 共有のバンドル済み音楽生成プロバイダーパスを実行します
  - 現在は `fal`、`google`、`minimax`、`openrouter` を対象とします
  - プローブの前に、すでにエクスポートされているプロバイダー環境変数を使用します
  - デフォルトでは、保存済み認証プロファイルよりライブ/環境変数の API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠すことはありません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーをスキップします
  - 利用可能な場合は、宣言された両方のランタイムモードを実行します：
    - プロンプトのみの入力による `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合は `edit`
  - `comfy` には独自の個別ライブファイルがあり、この共有スイープには含まれません
- 任意の絞り込み：
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- 任意の認証動作：
  - プロファイルストア認証を強制し、環境変数のみのオーバーライドを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 動画生成のライブテスト

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- 対象範囲:
  - `alibaba`、`byteplus`、`deepinfra`、`fal`、`google`、`minimax`、`openai`、`openrouter`、`pixverse`、`qwen`、`runway`、`together`、`vydra`、`xai` にわたり、バンドルされた共有動画生成プロバイダーパスを検証する
  - デフォルトでは、リリースに安全なスモークパスを使用する。プロバイダーごとに1件のテキストから動画へのリクエスト、1秒間のロブスタープロンプト、および `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` によるプロバイダーごとの処理上限（デフォルトは `180000`）
  - プロバイダー側のキュー遅延がリリース時間の大半を占める可能性があるため、デフォルトでは FAL をスキップする。明示的に実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡す（またはスキップリストを空にする）
  - プローブの前に、すでにエクスポートされているプロバイダー環境変数を使用する
  - デフォルトでは、保存された認証プロファイルよりもライブ環境／環境変数の API キーを優先するため、`auth-profiles.json` 内の古いテストキーによって実際のシェル認証情報が隠されることはない
  - 使用可能な認証／プロファイル／モデルがないプロバイダーをスキップする
  - デフォルトでは `generate` のみを実行する
  - 利用可能な場合に、宣言された変換モードも実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定する:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択したプロバイダー／モデルが共有スイープでバッファに格納されたローカル画像入力を受け付ける場合の `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択したプロバイダー／モデルが共有スイープでバッファに格納されたローカル動画入力を受け付ける場合の `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - `vydra`（このレーンではバッファに格納されたローカル画像入力はサポートされていない）
  - Vydra のプロバイダー固有のカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは、`veo3` のテキストから動画への変換に加え、デフォルトでリモート画像 URL フィクスチャを使用する `kling` の画像から動画へのレーンを実行する（上書きするには `OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL`）。
  - xAI のプロバイダー固有のカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - クラシックケースでは、正方形のローカル PNG の最初のフレームを生成し、ジオメトリを省略して、1秒間の画像から動画へのクリップをリクエストし、完了までポーリングして、ダウンロードしたバッファを検証する。
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - 1.5 ケースでは、ローカル PNG の最初のフレームを生成し、1秒間の 1080P 画像から動画へのクリップをリクエストし、完了までポーリングして、ダウンロードしたバッファを検証する。
  - 現在の `videoToVideo` ライブカバレッジ:
    - 選択したモデルが `gen4_aleph` に解決される場合に限り `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`、`google`、`openai`、`qwen`、`xai`。これらのパスは現在、バッファに格納されたローカル入力ではなく、リモートの `http(s)` 参照 URL を必要とするため
- オプションの絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - FAL を含むすべてのプロバイダーをデフォルトのスイープに含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 積極的なスモーク実行のため、各プロバイダーの処理上限を短縮するには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- オプションの認証動作:
  - プロファイルストアの認証を強制し、環境変数のみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## メディアライブハーネス

- コマンド: `pnpm test:live:media`
- エントリーポイント: `test/e2e/qa-lab/media/hosted-media-provider-live.ts`。選択したスイートごとに `pnpm test:live -- <suite-test-file>` を実行するため、Heartbeat と静音モードの動作は他の `pnpm test:live` 実行と一貫したままになる。
- 目的:
  - リポジトリ固有の1つのエントリーポイントを通じて、共有の画像、音楽、動画ライブスイートを実行する
  - 不足しているプロバイダー環境変数を `~/.profile` から自動的に読み込む
  - デフォルトでは、各スイートを現在使用可能な認証を持つプロバイダーに自動的に絞り込む
- フラグ:
  - `--providers <csv>` はグローバルなプロバイダーフィルター。`--image-providers` / `--music-providers` / `--video-providers` はフィルターを1つのスイートに限定する
  - `--all-providers` は認証に基づく自動フィルターをスキップする
  - フィルタリング後に実行可能なプロバイダーがない場合、`--allow-empty` は `0` で終了する
  - `--quiet` / `--no-quiet` は `test:live` にそのまま渡される
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## 関連項目

- [テスト](/ja-JP/help/testing) - ユニット、統合、QA、Docker スイート
