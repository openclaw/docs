---
read_when:
    - ローカルまたはCIでテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway + エージェントの動作をデバッグする
summary: 'テストキット: unit/e2e/liveスイート、Dockerランナー、各テストがカバーする内容'
title: テスト中
x-i18n:
    generated_at: "2026-04-10T04:43:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21b78e59a5189f4e8e6e1b490d350f4735c0395da31d21fc5d10b825313026b4
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClawには3つのVitestスイート（unit/integration、e2e、live）と、少数のDockerランナーがあります。

このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何をカバーするか（そして意図的に何を _カバーしないか_）
- 一般的なワークフロー（ローカル、push前、デバッグ）で実行するコマンド
- liveテストがどのように認証情報を検出し、モデル/プロバイダーを選択するか
- 実際のモデル/プロバイダーの問題に対する回帰テストを追加する方法

## クイックスタート

ほとんどの日は次で十分です。

- フルゲート（push前に想定）: `pnpm build && pnpm check && pnpm test`
- 余裕のあるマシンでの高速なローカル全スイート実行: `pnpm test:max`
- 直接Vitestのwatchループを使う: `pnpm test:watch`
- 直接ファイル指定はextension/channelのパスにも対応するようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復しているときは、まず対象を絞った実行を優先してください。
- DockerベースのQAサイト: `pnpm qa:lab:up`
- Linux VMベースのQAレーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたときや、追加の確信がほしいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2Eスイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- liveスイート（モデル + Gatewayのtool/imageプローブ）: `pnpm test:live`
- 1つのliveファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

ヒント: 必要なのが1つの失敗ケースだけなら、以下で説明するallowlist環境変数を使ってliveテストを絞り込むのを優先してください。

## QA専用ランナー

これらのコマンドは、QA-labレベルの現実性が必要なときにメインのテストスイートと並んで使います。

- `pnpm openclaw qa suite`
  - リポジトリベースのQAシナリオをホスト上で直接実行します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じQAスイートを使い捨てのMultipass Linux VM内で実行します。
  - ホスト上の`qa suite`と同じシナリオ選択の挙動を維持します。
  - `qa suite`と同じプロバイダー/モデル選択フラグを再利用します。
  - live実行では、ゲストで現実的に扱える対応QA認証入力を転送します:
    環境変数ベースのプロバイダーキー、QA liveプロバイダー設定パス、存在する場合の`CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるよう、リポジトリルート配下に維持する必要があります。
  - 通常のQAレポート + サマリーに加えて、Multipassログを`.artifacts/qa-e2e/...`配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式のQA作業向けに、DockerベースのQAサイトを起動します。

## テストスイート（どこで何が動くか）

スイートは「現実性が高くなるほど、flakiness/コストも増える」と考えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 既存のスコープ付きVitestプロジェクトに対する10個の順次シャード実行（`vitest.full-*.config.ts`）
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`配下のcore/unitインベントリと、`vitest.unit.config.ts`でカバーされる許可済みの`ui` nodeテスト
- スコープ:
  - 純粋なunitテスト
  - プロセス内integrationテスト（Gateway認証、ルーティング、tooling、パース、設定）
  - 既知バグに対する決定論的な回帰テスト
- 想定:
  - CIで実行される
  - 実際のキーは不要
  - 高速で安定しているべき
- プロジェクトに関する補足:
  - 対象指定なしの`pnpm test`は、巨大な単一のネイティブルートプロジェクトプロセスではなく、11個の小さなシャード設定（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行するようになりました。これにより、負荷の高いマシンでのピークRSSを削減し、auto-reply/extension作業が無関係なスイートを圧迫するのを防ぎます。
  - `pnpm test --watch`は、マルチシャードのwatchループが現実的でないため、引き続きネイティブルートの`vitest.config.ts`プロジェクトグラフを使用します。
  - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports`は、明示的なファイル/ディレクトリ指定をまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`ではフルルートプロジェクト起動のコストを回避できます。
  - `pnpm test:changed`は、差分がルーティング可能なソース/テストファイルのみに触れている場合、変更されたgitパスを同じスコープ付きレーンに展開します。設定/セットアップの編集は引き続き広範なルートプロジェクト再実行にフォールバックします。
  - 一部の`plugin-sdk`および`commands`テストも、`test/setup-openclaw-runtime.ts`をスキップする専用の軽量レーンを通るようにルーティングされます。stateful/runtime-heavyなファイルは既存のレーンに残ります。
  - 一部の`plugin-sdk`および`commands`のヘルパーソースファイルも、changedモード実行をそれらの軽量レーン内の明示的な兄弟テストにマッピングするため、ヘルパー編集でそのディレクトリの重い全スイートを再実行せずに済みます。
  - `auto-reply`には現在、3つの専用バケットがあります: トップレベルのcoreヘルパー、トップレベルの`reply.*` integrationテスト、`src/auto-reply/reply/**`サブツリーです。これにより、最も重いreplyハーネスの処理を軽量なstatus/chunk/tokenテストから切り離せます。
- 埋め込みランナーに関する補足:
  - メッセージtool検出入力またはcompactionランタイムコンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
  - 純粋なルーティング/正規化境界に対して、焦点を絞ったヘルパー回帰テストを追加してください。
  - 加えて、埋め込みランナーintegrationスイートも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、スコープ付きidとcompactionの挙動が実際の`run.ts` / `compact.ts`経路を通って引き続き流れることを検証します。ヘルパーだけのテストは、これらのintegration経路の十分な代替にはなりません。
- プールに関する補足:
  - ベースのVitest設定は現在デフォルトで`threads`を使用します。
  - 共通のVitest設定では`isolate: false`も固定されており、ルートプロジェクト、e2e、live設定全体で非分離ランナーを使用します。
  - ルートUIレーンはその`jsdom`セットアップとoptimizerを維持しつつ、共通の非分離ランナー上で実行されるようになりました。
  - 各`pnpm test`シャードは、共通のVitest設定から同じ`threads` + `isolate: false`のデフォルトを継承します。
  - 共通の`scripts/run-vitest.mjs`ランチャーは、大規模なローカル実行中のV8コンパイル負荷を減らすため、Vitestの子Nodeプロセスにデフォルトで`--no-maglev`も追加するようになりました。標準のV8挙動と比較したい場合は、`OPENCLAW_VITEST_ENABLE_MAGLEV=1`を設定してください。
- 高速なローカル反復に関する補足:
  - `pnpm test:changed`は、変更パスがより小さいスイートにきれいに対応する場合、スコープ付きレーンを通してルーティングします。
  - `pnpm test:max`および`pnpm test:changed:max`も同じルーティング挙動を維持しつつ、ワーカー上限だけを高くします。
  - ローカルワーカーの自動スケーリングは現在意図的に保守的で、ホストのロードアベレージがすでに高い場合にも抑制されるため、複数のVitest実行が同時に走ってもデフォルトで被害が少なくなります。
  - ベースのVitest設定は、テスト配線が変わったときにもchangedモードの再実行が正しくなるよう、プロジェクト/設定ファイルを`forceRerunTriggers`としてマークします。
  - 設定は、対応ホスト上で`OPENCLAW_VITEST_FS_MODULE_CACHE`を有効に維持します。直接プロファイリング用に明示的なキャッシュ場所を1つ指定したい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`を設定してください。
- パフォーマンスデバッグに関する補足:
  - `pnpm test:perf:imports`は、Vitestのimport時間レポートとimport内訳出力を有効にします。
  - `pnpm test:perf:imports:changed`は、`origin/main`以降で変更されたファイルに同じプロファイリングビューを絞り込みます。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`は、そのコミット済み差分に対してルーティングされた`test:changed`とネイティブルートプロジェクト経路を比較し、wall timeとmacOS max RSSを出力します。
- `pnpm test:perf:changed:bench -- --worktree`は、変更されたファイル一覧を`scripts/test-projects.mjs`とルートVitest設定に通すことで、現在のdirty treeをベンチマークします。
  - `pnpm test:perf:profile:main`は、Vitest/Viteの起動とtransformオーバーヘッドに対するメインスレッドCPUプロファイルを書き出します。
  - `pnpm test:perf:profile:runner`は、ファイル並列を無効にしたunitスイート向けのランナーCPU+heapプロファイルを書き出します。

### E2E（Gatewayスモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- ランタイムデフォルト:
  - リポジトリ全体の他の部分と同様に、Vitestの`threads`と`isolate: false`を使用します。
  - 適応型ワーカーを使用します（CI: 最大2、ローカル: デフォルトで1）。
  - コンソールI/Oオーバーヘッドを減らすため、デフォルトでsilentモードで実行されます。
- 便利なオーバーライド:
  - ワーカー数を強制するには`OPENCLAW_E2E_WORKERS=<n>`（上限16）。
  - 詳細なコンソール出力を再有効化するには`OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - 複数インスタンスのGatewayエンドツーエンド挙動
  - WebSocket/HTTPサーフェス、ノードペアリング、より重いネットワーキング
- 想定:
  - CIで実行される（パイプラインで有効な場合）
  - 実際のキーは不要
  - unitテストより可動部分が多い（遅くなることがある）

### E2E: OpenShellバックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `test/openshell-sandbox.e2e.test.ts`
- スコープ:
  - Docker経由でホスト上に分離されたOpenShell Gatewayを起動
  - 一時的なローカルDockerfileからsandboxを作成
  - 実際の`sandbox ssh-config` + SSH execを通じてOpenClawのOpenShellバックエンドを実行
  - sandbox fs bridgeを通じてリモート正準ファイルシステムの挙動を検証
- 想定:
  - オプトインのみ。デフォルトの`pnpm test:e2e`実行には含まれない
  - ローカルの`openshell` CLIと動作するDocker daemonが必要
  - 分離された`HOME` / `XDG_CONFIG_HOME`を使用し、その後テスト用Gatewayとsandboxを破棄する
- 便利なオーバーライド:
  - より広いe2eスイートを手動実行するときにテストを有効化するには`OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外のCLIバイナリまたはラッパースクリプトを指定するには`OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`
- デフォルト: `pnpm test:live`で**有効**（`OPENCLAW_LIVE_TEST=1`を設定）
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で _今日_ 本当に動くか？」
  - プロバイダー形式の変更、tool-callingの癖、認証問題、レート制限の挙動を検出
- 想定:
  - 設計上CIで安定しない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - コストがかかる / レート制限を消費する
  - 「すべて」より、絞り込んだサブセット実行を優先
- live実行は、不足しているAPIキーを取り込むために`~/.profile`を読み込みます。
- デフォルトでは、live実行は引き続き`HOME`を分離し、設定/認証マテリアルを一時的なテストホームにコピーするため、unitフィクスチャが実際の`~/.openclaw`を変更できません。
- liveテストで意図的に実際のホームディレクトリを使う必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1`を設定してください。
- `pnpm test:live`は現在、より静かなモードがデフォルトです: `[live] ...`の進行出力は維持しますが、追加の`~/.profile`通知を抑制し、Gateway起動ログ/Bonjour chatterをミュートします。完全な起動ログを再表示したい場合は、`OPENCLAW_LIVE_TEST_QUIET=0`を設定してください。
- APIキーのローテーション（プロバイダー別）: カンマ/セミコロン形式の`*_API_KEYS`または`*_API_KEY_1`、`*_API_KEY_2`を設定します（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）。あるいは、liveごとの上書きとして`OPENCLAW_LIVE_*_KEY`を使います。テストはレート制限レスポンス時にリトライします。
- 進行状況/ハートビート出力:
  - liveスイートは現在、長いプロバイダー呼び出し中でもVitestのコンソールキャプチャが静かなときにアクティブ状態が見えるよう、進行行をstderrに出力します。
  - `vitest.live.config.ts`はVitestのコンソールインターセプトを無効化するため、プロバイダー/Gatewayの進行行がlive実行中に即座にストリームされます。
  - 直接モデルのハートビートを調整するには`OPENCLAW_LIVE_HEARTBEAT_MS`。
  - Gateway/プローブのハートビートを調整するには`OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`。

## どのスイートを実行すべきか？

この判断表を使ってください。

- ロジック/テストを編集している: `pnpm test`を実行する（大きく変更したなら`pnpm test:coverage`も）
- Gatewayのネットワーキング / WSプロトコル / ペアリングに触れている: `pnpm test:e2e`も追加する
- 「ボットが落ちている」/ プロバイダー固有の障害 / tool callingをデバッグしている: 絞り込んだ`pnpm test:live`を実行する

## Live: Androidノード機能スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続されたAndroidノードが**現在公開しているすべてのコマンド**を呼び出し、コマンド契約の挙動を検証すること。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/起動/ペアリングを行いません）。
  - 選択されたAndroidノードに対する、コマンドごとのGateway `node.invoke`検証。
- 必要な事前セットアップ:
  - AndroidアプリがすでにGatewayに接続され、ペアリング済みであること。
  - アプリをフォアグラウンドに維持すること。
  - 成功を期待する機能に必要な権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID`または`OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Androidの完全なセットアップ詳細: [Android App](/ja-JP/platforms/android)

## Live: モデルスモーク（プロファイルキー）

liveテストは、障害を切り分けられるように2つのレイヤーに分かれています。

- 「Direct model」は、指定したキーでプロバイダー/モデルがそもそも応答できるかを教えてくれます。
- 「Gateway smoke」は、そのモデルに対して完全なGateway+エージェントパイプラインが動作するか（セッション、履歴、ツール、sandboxポリシーなど）を教えてくれます。

### レイヤー1: Direct model completion（Gatewayなし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel`を使って、認証情報を持っているモデルを選択する
  - モデルごとに小さなcompletionを実行する（必要に応じて対象を絞った回帰テストも実行）
- 有効化方法:
  - `pnpm test:live`（またはVitestを直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには`OPENCLAW_LIVE_MODELS=modern`（または`all`。modernの別名）を設定します。そうしないと、`pnpm test:live`をGateway smokeに集中させるためスキップされます
- モデルの選択方法:
  - modern allowlistを実行するには`OPENCLAW_LIVE_MODELS=modern`（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all`はmodern allowlistの別名
  - または`OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切りallowlist）
  - modern/allスイープはデフォルトで厳選された高シグナル上限を使います。modernを網羅的にスイープするには`OPENCLAW_LIVE_MAX_MODELS=0`を設定し、より小さい上限にするには正の数を設定します。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りallowlist）
- キーの取得元:
  - デフォルト: プロファイルストアと環境変数フォールバック
  - **プロファイルストアのみ**を強制するには`OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`を設定
- これが存在する理由:
  - 「プロバイダーAPIが壊れている / キーが無効」と「Gatewayエージェントパイプラインが壊れている」を分離するため
  - 小さく分離された回帰テストを収容するため（例: OpenAI Responses/Codex Responsesのreasoning replay + tool-callフロー）

### レイヤー2: Gateway + devエージェントスモーク（`@openclaw`が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内Gatewayを起動する
  - `agent:dev:*`セッションを作成/パッチする（実行ごとにモデル上書き）
  - キー付きモデルを反復し、次を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが機能すること（readプローブ）
    - 任意の追加ツールプローブ（exec+readプローブ）
    - OpenAIの回帰経路（tool-call-only → follow-up）が引き続き動作すること
- プローブ詳細（障害をすぐ説明できるように）:
  - `read`プローブ: テストはワークスペースにnonceファイルを書き込み、エージェントにそれを`read`してnonceを返答内でそのまま返すよう求めます。
  - `exec+read`プローブ: テストは、エージェントに`exec`でnonceを一時ファイルへ書き込み、その後`read`で読み戻すよう求めます。
  - imageプローブ: テストは生成したPNG（cat + ランダムコード）を添付し、モデルが`cat <CODE>`を返すことを期待します。
  - 実装リファレンス: `src/gateway/gateway-models.profiles.live.test.ts`および`src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（またはVitestを直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all`はmodern allowlistの別名
  - または、絞り込むには`OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定
  - modern/all Gatewayスイープはデフォルトで厳選された高シグナル上限を使います。modernを網羅的にスイープするには`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`を設定し、より小さい上限にするには正の数を設定します。
- プロバイダーの選択方法（「OpenRouterの全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りallowlist）
- このliveテストではtool + imageプローブは常に有効です:
  - `read`プローブ + `exec+read`プローブ（ツール負荷テスト）
  - image入力対応をモデルが公開している場合はimageプローブを実行
  - フロー（高レベル）:
    - テストが「CAT」+ ランダムコードを含む小さなPNGを生成する（`src/gateway/live-image-probe.ts`）
    - `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`で送信する
    - Gatewayが添付を`images[]`にパースする（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - 埋め込みエージェントがマルチモーダルなユーザーメッセージをモデルへ転送する
    - 検証: 返信に`cat` + そのコードが含まれること（OCR許容: 軽微な誤りは許可）

ヒント: 自分のマシンで何をテストできるか（および正確な`provider/model` id）を確認するには、次を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: CLIバックエンドスモーク（Claude、Codex、Gemini、または他のローカルCLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定に触れずに、ローカルCLIバックエンドを使ってGateway + エージェントパイプラインを検証すること。
- バックエンド固有のスモークデフォルトは、所有するextensionの`cli-backend.ts`定義にあります。
- 有効化:
  - `pnpm test:live`（またはVitestを直接呼び出す場合は`OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトのプロバイダー/モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド/引数/image挙動は、所有するCLIバックエンドpluginメタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送るには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。
  - プロンプト注入ではなくCLI引数として画像ファイルパスを渡すには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG`が設定されているときの画像引数の渡し方を制御するには`OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または`"list"`）。
  - 2ターン目を送ってresumeフローを検証するには`OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - デフォルトのClaude Sonnet -> Opus同一セッション継続性プローブを無効にするには`OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択モデルが切り替え先をサポートするときに強制的に有効化するには`1`）。

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Dockerレシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダー用Dockerレシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

補足:

- Dockerランナーは`scripts/test-live-cli-backend-docker.sh`にあります。
- リポジトリDockerイメージ内で、非rootの`node`ユーザーとしてlive CLIバックエンドスモークを実行します。
- 所有するextensionからCLIスモークメタデータを解決し、一致するLinux CLIパッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または`@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）のキャッシュ可能で書き込み可能なprefixにインストールします。
- live CLIバックエンドスモークは現在、Claude、Codex、Geminiに対して同じエンドツーエンドフローを実行します: テキストターン、画像分類ターン、その後Gateway CLI経由で検証されるMCP `cron`ツール呼び出しです。
- Claudeのデフォルトスモークでは、セッションをSonnetからOpusへパッチし、再開したセッションが以前のメモを引き続き覚えていることも検証します。

## Live: ACP bindスモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: live ACPエージェントを使って、実際のACP会話バインドフローを検証すること:
  - `/acp spawn <agent> --bind here`を送る
  - 合成メッセージチャネル会話をその場でバインドする
  - 同じ会話上で通常のfollow-upを送る
  - そのfollow-upが、バインドされたACPセッショントランスクリプトに記録されることを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker内のACPエージェント: `claude,codex,gemini`
  - 直接`pnpm test:live ...`する場合のACPエージェント: `claude`
  - 合成チャネル: Slack DM形式の会話コンテキスト
  - ACPバックエンド: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 補足:
  - このレーンでは、テストが外部配信を装わずにメッセージチャネルコンテキストを付与できるよう、管理者専用の合成originating-routeフィールドを持つGateway `chat.send`サーフェスを使用します。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND`が未設定の場合、テストは選択されたACPハーネスエージェントに対して埋め込み`acpx`pluginの組み込みエージェントレジストリを使用します。

例:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Dockerレシピ:

```bash
pnpm test:docker:live-acp-bind
```

単一エージェント用Dockerレシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker補足:

- Dockerランナーは`scripts/test-live-acp-bind-docker.sh`にあります。
- デフォルトでは、対応するすべてのlive CLIエージェントに対してACP bindスモークを順番に実行します: `claude`、`codex`、`gemini`です。
- マトリクスを絞り込むには`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または`OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`を使います。
- `~/.profile`を読み込み、一致するCLI認証マテリアルをコンテナにステージし、書き込み可能なnpm prefixへ`acpx`をインストールし、その後不足していれば要求されたlive CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または`@google/gemini-cli`）をインストールします。
- Docker内では、`acpx`が読み込まれたprofileのプロバイダー環境変数を子ハーネスCLIで使えるよう維持するため、ランナーは`OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`を設定します。

### 推奨liveレシピ

狭く明示的なallowlistが最も高速で、flakyさも最小です。

- 単一モデル、direct（Gatewayなし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがるtool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google重視（Gemini APIキー + Antigravity）:
  - Gemini（APIキー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

補足:

- `google/...`はGemini API（APIキー）を使います。
- `google-antigravity/...`はAntigravity OAuthブリッジ（Cloud Code Assist形式のエージェントエンドポイント）を使います。
- `google-gemini-cli/...`は、あなたのマシン上のローカルGemini CLIを使います（別の認証 + tooling特有の癖があります）。
- Gemini APIとGemini CLIの違い:
  - API: OpenClawがGoogleのホスト型Gemini APIをHTTP経由で呼び出します（APIキー / プロファイル認証）。ほとんどのユーザーが「Gemini」と言うときに意味しているのはこれです。
  - CLI: OpenClawがローカルの`gemini`バイナリをシェル実行します。独自の認証を持ち、挙動も異なることがあります（ストリーミング/ツール対応/バージョンずれ）。

## Live: モデルマトリクス（何をカバーするか）

固定の「CIモデル一覧」はありません（liveはオプトイン）が、キーを持つ開発マシンで定期的にカバーすることを**推奨**するモデルは以下です。

### Modernスモークセット（tool calling + image）

これは、動作し続けることを期待する「一般的なモデル」実行です。

- OpenAI（非Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または`anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview`および`google/gemini-3-flash-preview`（古いGemini 2.xモデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking`および`google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

tools + image付きでGateway smokeを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool calling（Read + 任意のExec）

少なくともプロバイダーファミリーごとに1つ選んでください。

- OpenAI: `openai/gpt-5.4`（または`openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または`anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または`google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あると望ましい）:

- xAI: `xai/grok-4`（または利用可能な最新）
- Mistral: `mistral/`…（有効化している「tools」対応モデルを1つ選ぶ）
- Cerebras: `cerebras/`…（アクセスがある場合）
- LM Studio: `lmstudio/`…（ローカル。tool callingはAPIモードに依存）

### Vision: image send（添付 → マルチモーダルメッセージ）

imageプローブを実行するため、`OPENCLAW_LIVE_GATEWAY_MODELS`に少なくとも1つの画像対応モデル（Claude/Gemini/OpenAIのvision対応バリアントなど）を含めてください。

### Aggregator / 代替Gateway

キーが有効なら、次経由のテストもサポートしています。

- OpenRouter: `openrouter/...`（数百のモデル。tools+image対応候補を見つけるには`openclaw models scan`を使ってください）
- OpenCode: Zen用の`opencode/...`およびGo用の`opencode-go/...`（認証は`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

liveマトリクスに含められる他のプロバイダー（認証情報/設定がある場合）:

- 組み込み: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers`経由（カスタムエンドポイント）: `minimax`（cloud/API）、および任意のOpenAI/Anthropic互換プロキシ（LM Studio、vLLM、LiteLLMなど）

ヒント: ドキュメントに「すべてのモデル」をハードコードしようとしないでください。信頼できる一覧は、あなたのマシンで`discoverModels(...)`が返すもの + 利用可能なキーです。

## 認証情報（絶対にコミットしない）

liveテストは、CLIと同じ方法で認証情報を検出します。実際上の意味は次のとおりです。

- CLIが動くなら、liveテストも同じキーを見つけられるはずです。
- liveテストが「認証情報なし」と言う場合は、`openclaw models list` / モデル選択をデバッグするときと同じようにデバッグしてください。

- エージェントごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（liveテストでの「profile keys」が意味するものです）
- 設定: `~/.openclaw/openclaw.json`（または`OPENCLAW_CONFIG_PATH`）
- レガシーstateディレクトリ: `~/.openclaw/credentials/`（存在する場合はステージされたlive homeにコピーされますが、メインのprofile-keyストアではありません）
- ローカルのlive実行は、デフォルトでアクティブ設定、エージェントごとの`auth-profiles.json`ファイル、レガシー`credentials/`、対応する外部CLI認証ディレクトリを一時的なテストhomeにコピーします。ステージされたlive homeでは`workspace/`と`sandboxes/`は除外され、`agents.*.workspace` / `agentDir`のパス上書きは除去されるため、プローブが実際のホストワークスペースに触れません。

環境変数キー（たとえば`~/.profile`でexportされたもの）に依存したい場合は、`source ~/.profile`の後にローカルテストを実行するか、以下のDockerランナーを使ってください（コンテナに`~/.profile`をマウントできます）。

## Deepgram live（音声文字起こし）

- テスト: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- テスト: `src/agents/byteplus.live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- スコープ:
  - バンドルされたcomfyの画像、動画、`music_generate`経路を実行する
  - `models.providers.comfy.<capability>`が設定されていない限り、各機能をスキップする
  - comfyのworkflow送信、ポーリング、ダウンロード、またはplugin登録を変更した後に有用

## Image generation live

- テスト: `src/image-generation/runtime.live.test.ts`
- コマンド: `pnpm test:live src/image-generation/runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- スコープ:
  - 登録されているすべてのimage-generation provider pluginを列挙する
  - プローブ前に、ログインシェル（`~/.profile`）から不足しているprovider環境変数を読み込む
  - デフォルトでは、保存済み認証プロファイルよりlive/env APIキーを優先して使うため、`auth-profiles.json`内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーはスキップする
  - 共有ランタイム機能を通じて標準のimage-generationバリアントを実行する:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされているバンドル済みプロバイダー:
  - `openai`
  - `google`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 任意の認証挙動:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`でprofile-store認証を強制し、環境変数のみの上書きを無視する

## Music generation live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- スコープ:
  - 共有のバンドル済みmusic-generation provider経路を実行する
  - 現在はGoogleとMiniMaxをカバーする
  - プローブ前に、ログインシェル（`~/.profile`）からprovider環境変数を読み込む
  - デフォルトでは、保存済み認証プロファイルよりlive/env APIキーを優先して使うため、`auth-profiles.json`内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーはスキップする
  - 利用可能な場合、宣言された両方のランタイムモードを実行する:
    - プロンプトのみ入力の`generate`
    - プロバイダーが`capabilities.edit.enabled`を宣言している場合の`edit`
  - 現在の共有レーンのカバレッジ:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 別のComfy liveファイルであり、この共有スイープではない
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意の認証挙動:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`でprofile-store認証を強制し、環境変数のみの上書きを無視する

## Video generation live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- スコープ:
  - 共有のバンドル済みvideo-generation provider経路を実行する
  - プローブ前に、ログインシェル（`~/.profile`）からprovider環境変数を読み込む
  - デフォルトでは、保存済み認証プロファイルよりlive/env APIキーを優先して使うため、`auth-profiles.json`内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な認証/プロファイル/モデルがないプロバイダーはスキップする
  - 利用可能な場合、宣言された両方のランタイムモードを実行する:
    - プロンプトのみ入力の`generate`
    - プロバイダーが`capabilities.imageToVideo.enabled`を宣言しており、選択されたプロバイダー/モデルが共有スイープでbuffer-backedなローカル画像入力を受け付ける場合の`imageToVideo`
    - プロバイダーが`capabilities.videoToVideo.enabled`を宣言しており、選択されたプロバイダー/モデルが共有スイープでbuffer-backedなローカル動画入力を受け付ける場合の`videoToVideo`
  - 共有スイープ内で現在宣言済みだがスキップされる`imageToVideo`プロバイダー:
    - バンドル済み`veo3`はテキスト専用で、バンドル済み`kling`はリモート画像URLを必要とするため、`vydra`
  - プロバイダー固有のVydraカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは、`veo3`のtext-to-videoに加え、デフォルトでリモート画像URLフィクスチャを使う`kling`レーンを実行します
  - 現在の`videoToVideo` liveカバレッジ:
    - 選択モデルが`runway/gen4_aleph`のときのみ`runway`
  - 共有スイープ内で現在宣言済みだがスキップされる`videoToVideo`プロバイダー:
    - これらの経路は現在リモート`http(s)` / MP4参照URLを必要とするため、`alibaba`、`qwen`、`xai`
    - 現在の共有Gemini/Veoレーンはローカルbuffer-backed入力を使い、その経路は共有スイープでは受け付けられないため、`google`
    - 現在の共有レーンにはorg固有のvideo inpaint/remixアクセス保証がないため、`openai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- 任意の認証挙動:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`でprofile-store認証を強制し、環境変数のみの上書きを無視する

## Media liveハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有のimage、music、video liveスイートを、リポジトリ標準の単一エントリーポイントから実行する
  - `~/.profile`から不足しているprovider環境変数を自動読み込みする
  - デフォルトで、現在使用可能な認証を持つプロバイダーに各スイートを自動で絞り込む
  - `scripts/test-live.mjs`を再利用するため、heartbeatとquiet modeの挙動が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Dockerランナー（任意の「Linuxでも動く」確認）

これらのDockerランナーは2つのカテゴリに分かれます。

- Live modelランナー: `test:docker:live-models`と`test:docker:live-gateway`は、対応するprofile-key liveファイルのみをリポジトリDockerイメージ内で実行します（`src/agents/models.profiles.live.test.ts`と`src/gateway/gateway-models.profiles.live.test.ts`）。ローカルのconfigディレクトリとworkspaceをマウントし（マウントされていれば`~/.profile`も読み込みます）。対応するローカルエントリーポイントは`test:live:models-profiles`と`test:live:gateway-profiles`です。
- Docker liveランナーは、完全なDockerスイープを現実的に保つため、デフォルトで小さめのスモーク上限を使います:
  `test:docker:live-models`はデフォルトで`OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway`はデフォルトで`OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`を使います。より大きい網羅的スキャンを明示的に行いたい場合は、これらの環境変数を上書きしてください。
- `test:docker:all`は、まず`test:docker:live-build`でlive Dockerイメージを一度だけビルドし、その後2つのlive Dockerレーンでそれを再利用します。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:plugins`は、1つ以上の実コンテナを起動し、より高レベルのintegration経路を検証します。

live model Dockerランナーは、必要なCLI認証homeだけ（または実行が絞り込まれていない場合は対応するものすべて）をbind mountし、実行前にそれらをコンテナhomeへコピーします。これにより、外部CLI OAuthがホストの認証ストアを変更せずにトークンを更新できます。

- Direct models: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bindスモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLIバックエンドスモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Gateway + devエージェント: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI liveスモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なscaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Gatewayネットワーキング（2コンテナ、WS認証 + ヘルス）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- MCP channel bridge（シード済みGateway + stdio bridge + 生のClaude notification-frameスモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Plugins（インストールスモーク + `/plugin`エイリアス + Claudeバンドル再起動セマンティクス）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）

live model Dockerランナーは、現在のチェックアウトも読み取り専用でbind mountし、それをコンテナ内の一時workdirへステージします。これにより、ランタイムイメージをスリムに保ちながら、正確なローカルソース/設定に対してVitestを実行できます。
このステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの`.build`やGradle出力ディレクトリなど、大きなローカル専用キャッシュやアプリのビルド出力をスキップするため、Docker live実行でマシン固有の成果物のコピーに何分も費やすことがありません。
また、Gateway liveプローブがコンテナ内で実際のTelegram/Discordなどのchannelワーカーを起動しないよう、`OPENCLAW_SKIP_CHANNELS=1`も設定します。
`test:docker:live-models`は引き続き`pnpm test:live`を実行するため、そのDockerレーンでGateway liveカバレッジを絞り込む、または除外する必要がある場合は、`OPENCLAW_LIVE_GATEWAY_*`も渡してください。
`test:docker:openwebui`は、より高レベルの互換性スモークです。OpenAI互換HTTPエンドポイントを有効にしたOpenClaw Gatewayコンテナを起動し、そのGatewayに対して固定版のOpen WebUIコンテナを起動し、Open WebUI経由でサインインし、`/api/models`が`openclaw/default`を公開していることを検証したうえで、Open WebUIの`/api/chat/completions`プロキシ経由で実際のchatリクエストを送信します。
初回実行は、DockerがOpen WebUIイメージをpullする必要があったり、Open WebUI自身のコールドスタートセットアップを完了する必要があったりするため、目に見えて遅くなることがあります。
このレーンは使用可能なliveモデルキーを前提とし、Docker化された実行では`OPENCLAW_PROFILE_FILE`（デフォルトは`~/.profile`）がそれを提供する主要な方法です。
成功した実行では、`{ "ok": true, "model": "openclaw/default", ... }`のような小さなJSONペイロードが出力されます。
`test:docker:mcp-channels`は意図的に決定論的で、実際のTelegram、Discord、iMessageアカウントを必要としません。シード済みGatewayコンテナを起動し、`openclaw mcp serve`を起動する2つ目のコンテナを開始し、その後、ルーティングされた会話検出、トランスクリプト読み取り、添付メタデータ、liveイベントキューの挙動、送信ルーティング、および実際のstdio MCP bridge上のClaude形式のchannel + permission通知を検証します。通知チェックは、生のstdio MCPフレームを直接検査するため、このスモークは特定のclient SDKがたまたま表面化するものではなく、bridgeが実際に出力する内容を検証します。

手動ACPプレーンランゲージスレッドスモーク（CIではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に残してください。ACPスレッドルーティングの検証で再び必要になる可能性があるため、削除しないでください。

便利な環境変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）を`/home/node/.openclaw`にマウント
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）を`/home/node/.openclaw/workspace`にマウント
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）を`/home/node/.profile`にマウントし、テスト実行前に読み込む
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）を`/home/node/.npm-global`にマウントし、Docker内でCLIインストールをキャッシュ
- `$HOME`配下の外部CLI認証ディレクトリ/ファイルは、`/host-auth...`配下に読み取り専用でマウントされ、テスト開始前に`/home/node/...`へコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`から推定された必要なディレクトリ/ファイルだけをマウントします
  - 手動で上書きするには`OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または`OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`のようなカンマ区切りリストを使います
- 実行を絞り込むには`OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内でプロバイダーをフィルタするには`OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 認証情報がprofileストア由来であることを保証するには`OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（環境変数由来ではない）
- Open WebUIスモーク向けにGatewayが公開するモデルを選ぶには`OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUIスモークで使うnonceチェックプロンプトを上書きするには`OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定されたOpen WebUIイメージタグを上書きするには`OPENWEBUI_IMAGE=...`

## ドキュメントの健全性確認

ドキュメント編集後は、ドキュメントチェックを実行してください: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全なMintlifyアンカー検証を実行してください: `pnpm docs:check-links:anchors`。

## オフライン回帰テスト（CIで安全）

これらは、実プロバイダーなしでの「実パイプライン」回帰テストです。

- Gateway tool calling（モックOpenAI、実際のGateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gatewayウィザード（WS `wizard.start`/`wizard.next`、設定 + 認証の書き込みを強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性evals（Skills）

すでにいくつかのCIで安全なテストがあり、それらは「エージェント信頼性eval」に近い振る舞いをします。

- 実際のGateway + エージェントループを通したモックtool-calling（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skillsについてまだ不足しているもの（[Skills](/ja-JP/tools/skills)を参照）:

- **Decisioning:** Skillsがプロンプトに一覧表示されたとき、エージェントは正しいskillを選ぶか（または無関係なものを避けるか）？
- **Compliance:** エージェントは使用前に`SKILL.md`を読み、必要な手順/引数に従うか？
- **Workflow contracts:** ツール順序、セッション履歴の引き継ぎ、sandbox境界を検証する複数ターンのシナリオ。

将来のevalは、まず決定論的であるべきです。

- mock providerを使って、ツール呼び出し + 順序、skillファイルの読み取り、セッション配線を検証するシナリオランナー。
- skillに焦点を当てた小規模シナリオスイート（使う/避ける、ゲーティング、プロンプトインジェクション）。
- オプションのlive evals（オプトイン、環境変数ゲート付き）は、CIで安全なスイートが整ってからにする。

## Contract tests（pluginとchannelの形状）

Contract testsは、登録されているすべてのpluginとchannelがそのinterface contractに準拠していることを検証します。検出されたすべてのpluginを反復し、形状と挙動に関する一連のアサーションを実行します。デフォルトの`pnpm test` unitレーンでは、これらの共有seamおよびスモークファイルを意図的にスキップします。共有channelまたはproviderサーフェスに触れた場合は、contractコマンドを明示的に実行してください。

### コマンド

- すべてのcontract: `pnpm test:contracts`
- channel contractのみ: `pnpm test:contracts:channels`
- provider contractのみ: `pnpm test:contracts:plugins`

### Channel contracts

`src/channels/plugins/contracts/*.contract.test.ts`にあります:

- **plugin** - 基本的なplugin形状（id、name、capabilities）
- **setup** - セットアップウィザードcontract
- **session-binding** - セッションバインディングの挙動
- **outbound-payload** - メッセージpayload構造
- **inbound** - 受信メッセージ処理
- **actions** - channel actionハンドラー
- **threading** - スレッドID処理
- **directory** - ディレクトリ/roster API
- **group-policy** - グループポリシー強制

### Provider status contracts

`src/plugins/contracts/*.contract.test.ts`にあります。

- **status** - Channel statusプローブ
- **registry** - Plugin registryの形状

### Provider contracts

`src/plugins/contracts/*.contract.test.ts`にあります:

- **auth** - 認証フローcontract
- **auth-choice** - 認証の選択
- **catalog** - モデルcatalog API
- **discovery** - Plugin検出
- **loader** - Plugin読み込み
- **runtime** - Providerランタイム
- **shape** - Pluginの形状/interface
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdkのexportまたはsubpathを変更した後
- channelまたはprovider pluginを追加または変更した後
- plugin登録または検出をリファクタリングした後

Contract testsはCIで実行され、実際のAPIキーは不要です。

## 回帰テストの追加（ガイダンス）

liveで見つかったprovider/modelの問題を修正するときは:

- 可能ならCIで安全な回帰テストを追加してください（providerのmock/stub、または正確なリクエスト形状変換のキャプチャ）
- 本質的にlive専用の場合（レート制限、認証ポリシーなど）は、liveテストを狭く保ち、環境変数でオプトインにしてください
- バグを捉えられる最小のレイヤーを狙うことを優先してください:
  - providerのリクエスト変換/replayバグ → direct modelsテスト
  - Gatewayのセッション/履歴/ツールパイプラインのバグ → Gateway liveスモークまたはCIで安全なGateway mockテスト
- SecretRef走査のガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts`は、registryメタデータ（`listSecretTargetRegistryEntries()`）からSecretRefクラスごとに1つのサンプル対象を導出し、走査セグメントのexec idが拒否されることを検証します。
  - `src/secrets/target-registry-data.ts`に新しい`includeInPlan` SecretRef対象ファミリーを追加する場合は、そのテストの`classifyTargetClass`を更新してください。このテストは、未分類のtarget idで意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。
