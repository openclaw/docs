---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway とエージェントの挙動のデバッグ
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-05-10T19:39:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には3つの Vitest スイート（unit/integration、e2e、live）と小規模な
Docker ランナー群があります。このドキュメントは「テスト方法」のガイドです。

- 各スイートが対象にするもの（および意図的に _対象にしない_ もの）。
- 一般的なワークフロー（ローカル、push 前、デバッグ）で実行するコマンド。
- live テストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダー問題に対する回帰テストを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、live transport lanes）** は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) - `pnpm openclaw qa matrix` のリファレンス。
- [QA channel](/ja-JP/channels/qa-channel) - リポジトリに支えられたシナリオで使われる合成 transport Plugin。

このページでは通常のテストスイートと Docker/Parallels ランナーの実行について説明します。下の QA 固有ランナーのセクション（[QA 固有ランナー](#qa-specific-runners)）では、具体的な `qa` 呼び出しを列挙し、上記のリファレンスを参照します。
</Note>

## クイックスタート

ほとんどの日は:

- フルゲート（push 前に期待される）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでのより高速なローカルフルスイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は、extension/channel パスにもルーティングされるようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗に取り組んでいるときは、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたとき、または追加の信頼性がほしいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（モデル + gateway tool/image probes）: `pnpm test:live`
- 1つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイムパフォーマンスレポート: 実際の `openai/gpt-5.4` エージェントターンには
  `live_gpt54=true`、Kova CPU/heap/trace アーティファクトには
  `deep_profile=true` を付けて `OpenClaw Performance` を dispatch します。日次の定期実行は、
  `CLAWGRIT_REPORTS_TOKEN` が設定されている場合、mock-provider、deep-profile、GPT 5.4 レーンのアーティファクトを
  `openclaw/clawgrit-reports` に公開します。
  mock-provider レポートには、ソースレベルの gateway 起動、メモリ、
  plugin-pressure、反復 fake-model hello-loop、CLI 起動の数値も含まれます。
- Docker live モデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さな file-read 風プローブを実行します。
    メタデータが `image` 入力を示すモデルは、小さな画像ターンも実行します。
    プロバイダーの失敗を切り分けるときは、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効にしてください。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` はどちらも、`include_live_suites: true` 付きで再利用可能な live/E2E ワークフローを呼び出します。これには、プロバイダー別にシャードされた個別の Docker live モデル
    matrix ジョブが含まれます。
  - 集中した CI 再実行では、`include_live_suites: true` と `live_models_only: true` を付けて
    `OpenClaw Live And E2E Checks (Reusable)` を dispatch します。
  - 新しい高シグナルのプロバイダーシークレットを `scripts/ci-hydrate-live-auth.sh`、
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`、およびその
    scheduled/release caller に追加します。
- ネイティブ Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live レーンを実行し、`/codex bind` で合成
    Slack DM を bind し、`/codex fast` と
    `/codex permissions` を実行してから、ACP ではなくネイティブ Plugin binding 経由でプレーン返信と画像添付のルートを検証します。
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Plugin が所有する Codex app-server harness 経由で gateway エージェントターンを実行し、
    `/codex status` と `/codex models` を検証し、デフォルトで image、
    cron MCP、sub-agent、Guardian probes を実行します。他の Codex
    app-server の失敗を切り分けるときは、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` で
    sub-agent プローブを無効にしてください。sub-agent の集中チェックでは、他のプローブを無効にします:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、
    sub-agent プローブ後に終了します。
- Codex オンデマンドインストール smoke: `pnpm test:docker:codex-on-demand`
  - パッケージ化された OpenClaw tarball を Docker にインストールし、OpenAI API キー
    オンボーディングを実行し、Codex Plugin と `@openai/codex` 依存関係がオンデマンドで managed npm root にダウンロードされたことを検証します。
- live Plugin tool 依存関係 smoke: `pnpm test:docker:live-plugin-tool`
  - 実際の `slugify` 依存関係を持つ fixture Plugin を pack し、
    `npm-pack:` 経由でインストールし、managed npm root 配下の依存関係を検証してから、
    live OpenAI モデルに Plugin tool を呼び出させ、隠された slug を返させます。
- Crestodian rescue コマンド smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue コマンドサーフェス向けのオプトインの念押しチェックです。
    `/crestodian status` を実行し、永続的なモデル変更をキューに入れ、
    `/crestodian yes` に返信し、audit/config 書き込みパスを検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に偽の Claude CLI がある config なしコンテナで Crestodian を実行し、
    fuzzy planner fallback が監査済みの typed config 書き込みに変換されることを検証します。
- Crestodian 初回実行 Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、素の `openclaw` を
    Crestodian にルーティングし、setup/model/agent/Discord Plugin + SecretRef 書き込みを適用し、
    config を検証し、audit entries を検証します。同じ Ring 0 セットアップパスは
    QA Lab でも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` を設定して、
  `openclaw models list --provider moonshot --json` を実行してから、分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を `moonshot/kimi-k2.6` に対して実行します。JSON が Moonshot/K2.6 を報告し、
  assistant transcript が正規化された `usage.cost` を保存することを検証します。

<Tip>
失敗ケースが1つだけ必要な場合は、下で説明する allowlist env vars によって live テストを絞り込むことを優先してください。
</Tip>

## QA 固有ランナー

QA-lab の現実性が必要なとき、これらのコマンドはメインのテストスイートの横に位置します。

CI は専用ワークフローで QA Lab を実行します。Agentic parity は
スタンドアロンの PR ワークフローではなく、`QA-Lab - All Lanes` とリリース検証の配下にネストされています。
広範な検証では、`rerun_group=qa-parity` 付きの `Full Release Validation` または release-checks QA group を使用してください。Stable/default release
checks は、網羅的な live/Docker soak を `run_release_soak=true` の背後に保持します。
`full` profile は soak を強制的に有効にします。`QA-Lab - All Lanes` は
`main` で nightly に、また手動 dispatch から、mock parity lane、live
Matrix lane、Convex 管理の live Telegram lane、Convex 管理の live Discord
lane を並列ジョブとして実行します。Scheduled QA と release checks は Matrix
`--profile fast` を明示的に渡しますが、Matrix CLI と手動ワークフロー入力の
デフォルトは `all` のままです。手動 dispatch では `all` を `transport`、
`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードできます。
`OpenClaw Release Checks` は、リリース承認前に parity に加えて fast Matrix と Telegram レーンを実行し、リリース transport checks には `mock-openai/gpt-5.5` を使用するため、
決定論的に保たれ、通常の provider-plugin startup を回避します。これらの live transport
gateways は memory search を無効にします。memory behavior は QA parity
suites によって引き続きカバーされます。

Full release live media shards は
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。これにはすでに
`ffmpeg` と `ffprobe` が含まれています。Docker live model/backend shards は、選択された
commit ごとに一度だけビルドされる共有
`ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各 shard 内で再ビルドする代わりに
`OPENCLAW_SKIP_DOCKER_BUILD=1` で pull します。

- `pnpm openclaw qa suite`
  - リポジトリに基づく QA シナリオをホスト上で直接実行します。
  - デフォルトでは、分離された Gateway ワーカーを使って、選択された複数のシナリオを並列に実行します。`qa-channel` のデフォルト並行数は 4 です（選択されたシナリオ数が上限）。ワーカー数を調整するには `--concurrency <count>` を使い、以前の直列レーンを使うには `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗の終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使います。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` は、シナリオ対応の `mock-openai` レーンを置き換えずに、実験的なフィクスチャとプロトコルモックのカバレッジ用に、ローカルの AIMock ベースのプロバイダーサーバーを起動します。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab 経由でライブ OpenAI Kitchen Sink Plugin のガントレットを実行します。外部 Kitchen Sink パッケージをインストールし、Plugin SDK サーフェスのインベントリを検証し、`/healthz` と `/readyz` をプローブし、Gateway の CPU/RSS 証拠を記録し、ライブ OpenAI ターンを実行し、敵対的診断をチェックします。`OPENAI_API_KEY` などのライブ OpenAI 認証が必要です。ハイドレート済みの Testbox セッションでは、`openclaw-testbox-env` ヘルパーが存在する場合、Testbox ライブ認証プロファイルを自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチと、小さなモック QA Lab シナリオパック（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`）を実行し、結合された CPU 観測サマリーを `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは、継続的な高 CPU 観測のみをフラグします（`--cpu-core-warn` と `--hot-wall-warn-ms`）。そのため、短い起動時バーストは、数分続く Gateway 固定化リグレッションのように見せずに、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使います。チェックアウトに新しいランタイム出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - ライブ実行では、ゲストで実用的なサポート済み QA 認証入力を転送します。env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、存在する場合は `CODEX_HOME` です。
  - 出力ディレクトリはリポジトリルート配下に置く必要があります。これにより、ゲストがマウントされたワークスペース経由で書き戻せます。
  - 通常の QA レポートとサマリーに加えて、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター風の QA 作業向けに、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルにインストールし、非対話型の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、パッケージ化された Plugin ランタイムが起動時の依存関係修復なしで読み込まれることを検証し、doctor を実行し、モック OpenAI エンドポイントに対してローカルエージェントの 1 ターンを実行します。
  - Discord で同じパッケージ化インストールレーンを実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使います。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストのトランスクリプト向けに、決定的なビルド済みアプリ Docker スモークを実行します。隠し OpenClaw ランタイムコンテキストが、表示されるユーザーターンに漏れるのではなく、非表示のカスタムメッセージとして永続化されることを検証します。その後、影響を受ける壊れたセッション JSONL をシードし、`openclaw doctor --fix` がバックアップ付きでそれをアクティブブランチへ書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内で OpenClaw パッケージ候補をインストールし、インストール済みパッケージのオンボーディングを実行し、インストール済み CLI 経由で Telegram を設定した後、そのインストール済みパッケージを SUT Gateway としてライブ Telegram QA レーンを再利用します。
  - ラッパーは、チェックアウトから `qa-lab` ハーネスソースのみをマウントします。インストール済みパッケージが `dist`、`openclaw/plugin-sdk`、バンドル済み Plugin ランタイムを所有するため、このレーンは現在のチェックアウトの plugins をテスト対象パッケージに混在させません。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。レジストリからインストールする代わりに、解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使います。CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて `OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定します。CI に `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットが存在する場合、Docker ラッパーは Convex を自動的に選択します。
  - ラッパーは、Docker のビルド/インストール作業の前に、ホスト上で Telegram または Convex 認証情報 env を検証します。認証情報前のセットアップを意図的にデバッグする場合にのみ、`OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンだけで共有の `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions は、このレーンを手動メンテナーワークフロー `NPM Telegram Beta E2E` として公開します。マージ時には実行されません。このワークフローは `qa-live-shared` 環境と Convex CI 認証情報リースを使います。
- GitHub Actions は、1 つの候補パッケージに対するサイドランのプロダクト証拠として `Package Acceptance` も公開します。信頼済み ref、公開済み npm spec、SHA-256 付き HTTPS tarball URL、または別の実行からの tarball アーティファクトを受け取り、正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードした後、既存の Docker E2E スケジューラーを、スモーク、パッケージ、プロダクト、フル、またはカスタムのレーンプロファイルで実行します。同じ `package-under-test` アーティファクトに対して Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新ベータのプロダクト証拠:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL 証拠にはダイジェストが必要です:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- アーティファクト証拠は、別の Actions 実行から tarball アーティファクトをダウンロードします:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI が設定された状態で Gateway を起動した後、設定編集でバンドル済みチャンネル/plugins を有効にします。
  - セットアップ検出で未設定のダウンロード可能な plugins が存在しないままになること、最初に設定された doctor 修復が欠落している各ダウンロード可能 Plugin を明示的にインストールすること、2 回目の再起動で隠し依存関係修復が実行されないことを検証します。
  - また、既知の古い npm ベースラインをインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補の更新後 doctor がハーネス側の postinstall 修復なしでレガシー Plugin 依存関係の残骸をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージ化インストール更新スモークを実行します。選択された各プラットフォームでは、まず要求されたベースラインパッケージをインストールし、その後同じゲスト内でインストール済みの `openclaw update` コマンドを実行し、インストール済みバージョン、更新ステータス、Gateway 準備完了状態、ローカルエージェントの 1 ターンを検証します。
  - 1 つのゲストで反復する場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使います。サマリーアーティファクトパスとレーンごとのステータスには `--json` を使います。
  - OpenAI レーンは、デフォルトでライブエージェントターン証拠に `openai/gpt-5.5` を使います。別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels 転送の停止が残りのテスト時間を消費しないように、長いローカル実行はホストのタイムアウトでラップします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトは、入れ子になったレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認します。
  - Windows 更新は、コールドゲスト上で更新後 doctor とパッケージ更新作業に 10 分から 15 分かかることがあります。入れ子になった npm デバッグログが進んでいる場合、それは正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux スモークレーンと並列に実行しないでください。これらは VM 状態を共有しており、スナップショット復元、パッケージ提供、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後証拠では通常のバンドル済み Plugin サーフェスを実行します。これは、エージェントターン自体が単純なテキスト応答だけをチェックする場合でも、音声、画像生成、メディア理解などのケイパビリティファサードがバンドル済みランタイム API 経由で読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接的なプロトコルスモークテスト用に、ローカル AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel ホームサーバーに対して、Matrix ライブ QA レーンを実行します。ソースチェックアウト専用です。パッケージ化インストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、env vars、アーティファクトレイアウト: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - env からのドライバーと SUT ボットトークンを使って、実際の非公開グループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報向けに `--credential-source convex` をサポートします。デフォルトでは env モードを使うか、プールされたリースを使うには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - デフォルトは、カナリア、メンションゲート、コマンドアドレッシング、`/status`、ボット間のメンション付き返信、コアネイティブコマンド返信をカバーします。`mock-openai` のデフォルトは、決定的な返信チェーンと Telegram 最終メッセージストリーミングのリグレッションもカバーします。`session_status` などの任意プローブには `--list-scenarios` を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗の終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使います。
  - 同じ非公開グループ内に 2 つの異なるボットが必要で、SUT ボットは Telegram ユーザー名を公開している必要があります。
  - 安定したボット間観測のため、両方のボットで `@BotFather` のボット間通信モードを有効にし、ドライバーボットがグループ内のボットトラフィックを観測できることを確認します。
  - Telegram QA レポート、サマリー、観測メッセージアーティファクトを `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、ドライバーの送信要求から観測された SUT 返信までの RTT が含まれます。

`Mantis Telegram Live` は、このレーンを囲む PR 証拠ラッパーです。候補 ref を Convex リースの Telegram 認証情報で実行し、秘匿化された観測メッセージトランスクリプトを Crabbox デスクトップブラウザーでレンダリングし、MP4 証拠を記録し、モーションでトリミングされた GIF を生成し、アーティファクトバンドルをアップロードし、`pr_number` が設定されている場合は Mantis GitHub App 経由でインライン PR 証拠を投稿します。メンテナーは、Actions UI の `Mantis Scenario`（`scenario_id:
telegram-live`）から、またはプルリクエストコメントから直接開始できます:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux デスクトップをリースまたは再利用し、ネイティブの Telegram Desktop をインストールし、リース済み Telegram SUT bot token で OpenClaw を設定し、Gateway を起動し、表示されている VNC デスクトップからスクリーンショット/MP4 の証拠を記録します。
  - デフォルトは `--credential-source convex` のため、ワークフローに必要なのは Convex broker secret だけです。`pnpm openclaw qa telegram` と同じ `OPENCLAW_QA_TELEGRAM_*` 変数を使う場合は `--credential-source env` を使用します。
  - Telegram Desktop には引き続きユーザーログイン/プロファイルが必要です。bot token は OpenClaw だけを設定します。base64 の `.tgz` プロファイルアーカイブには `--telegram-profile-archive-env <name>` を使うか、`--keep-lease` を使って VNC 経由で一度手動ログインします。
  - 出力ディレクトリ配下に `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png`、`telegram-desktop-builder.mp4` を書き込みます。

ライブトランスポートレーンは 1 つの標準契約を共有するため、新しいトランスポートが逸脱しません。レーンごとのカバレッジマトリクスは [QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、そのマトリクスには含まれません。

### Convex 経由の共有 Telegram 認証情報 (v1)

ライブトランスポート QA で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、QA lab は Convex backed pool から排他的リースを取得し、レーンの実行中にそのリースへ Heartbeat し、シャットダウン時にリースを解放します。このセクション名は Discord、Slack、WhatsApp 対応より前のものです。リース契約は種類をまたいで共有されます。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用の secret 1 つ:
  - `maintainer` には `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` には `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトが `ci`、それ以外では `maintainer`）

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意の trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` はローカル専用開発のために loopback `http://` Convex URL を許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用する必要があります。

メンテナー管理コマンド（pool の追加/削除/一覧）には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使って、secret 値を表示せずに Convex site URL、broker secrets、endpoint prefix、HTTP timeout、admin/list 到達性を確認します。スクリプトや CI ユーティリティで機械可読な出力が必要な場合は `--json` を使用します。

デフォルトエンドポイント契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/再試行可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 成功: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功: `{ status: "ok" }`（または空の `2xx`）
- `POST /release`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功: `{ status: "ok" }`（または空の `2xx`）
- `POST /admin/add`（メンテナー secret のみ）
  - リクエスト: `{ kind, actorId, payload, note?, status? }`
  - 成功: `{ status: "ok", credential }`
- `POST /admin/remove`（メンテナー secret のみ）
  - リクエスト: `{ credentialId, actorId }`
  - 成功: `{ status: "ok", changed, credential }`
  - アクティブリースガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（メンテナー secret のみ）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram kind の payload 形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正な payload を拒否します。

Telegram real-user kind の payload 形状:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId`、`telegramApiId` は数値文字列である必要があります。
- `tdlibArchiveSha256` と `desktopTdataArchiveSha256` は SHA-256 hex 文字列である必要があります。
- `kind: "telegram-user"` は 1 つの Telegram burner account を表します。リースはアカウント全体として扱います。TDLib CLI driver と Telegram Desktop visual witness は同じ payload から復元し、一度に 1 つのジョブだけがリースを保持する必要があります。

Telegram real-user リース復元:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

視覚的な記録が必要な場合は、復元済み Desktop プロファイルを `Telegram -workdir "$tmp/desktop"` で使用します。ローカルオペレーター環境では、process env vars が存在しない場合、`scripts/e2e/telegram-user-credential.ts` はデフォルトで `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` を読み取ります。

エージェント駆動の Crabbox セッション:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` は `telegram-user` 認証情報をリースし、同じアカウントを Crabbox Linux デスクトップ上の TDLib と Telegram Desktop に復元し、現在の checkout からローカル mock SUT Gateway を起動し、表示可能な Telegram chat を開き、デスクトップ記録を開始し、private な `session.json` を書き込みます。セッションが生きている間、エージェントは納得するまでテストを続けられます:

- `send --session <file> --text <message>` は実際の TDLib ユーザー経由で送信し、SUT の返信を待ちます。
- `run --session <file> -- <remote command>` は Crabbox 上で任意のコマンドを実行し、その出力を保存します。例: `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`。
- `screenshot --session <file>` は現在表示されているデスクトップをキャプチャします。
- `status --session <file>` はリースと WebVNC コマンドを出力します。
- `finish --session <file>` はレコーダーを停止し、スクリーンショット/動画/motion-trim アーティファクトをキャプチャし、Convex 認証情報を解放し、ローカル SUT プロセスを停止し、`--keep-box` が渡されていない限り Crabbox リースを停止します。
- `publish --session <file> --pr <number>` はデフォルトで GIF のみの PR コメントを公開します。ログや JSON アーティファクトが意図的に必要な場合にだけ `--full-artifacts` を渡します。

決定的な視覚再現には、`start` または 1 コマンドの `probe` 省略形に `--mock-response-file <path>` を渡します。runner はデフォルトで標準の Crabbox class、24fps 記録、24fps motion GIF プレビュー、1920px GIF 幅を使用します。証拠に別のキャプチャ設定が必要な場合にだけ、`--class`、`--record-fps`、`--preview-fps`、`--preview-width` で上書きします。

1 コマンドの Crabbox 証拠:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

デフォルトの `probe` コマンドは、1 回の start/send/finish サイクルの省略形です。簡単な `/status` smoke に使用します。PR レビュー、バグ再現作業、または証拠が完全だと判断する前にエージェントが数分間任意の実験を行う必要がある場合は、セッションコマンドを使用します。warm desktop lease を再利用するには `--id <cbx_...>`、finish 後も VNC を開いたままにするには `--keep-box`、表示する chat を選ぶには `--desktop-chat-title <name>`、新しい box で TDLib をビルドする代わりに事前作成済み Linux `libtdjson.so` アーカイブを使う場合は `--tdlib-url <tgz>` を使用します。runner は `--tdlib-url` を `--tdlib-sha256 <hex>`、またはデフォルトでは兄弟の `<url>.sha256` ファイルで検証します。

broker で検証されるマルチチャネル payload:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack レーンも pool からリースできますが、Slack payload 検証は現在 broker ではなく Slack QA runner 側にあります。Slack 行には `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用します。

### QA へのチャネル追加

新しいチャネルアダプターのアーキテクチャと scenario-helper 名は [QA 概要 → チャネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低条件は、共有 `qa-lab` host seam 上で transport runner を実装し、Plugin manifest で `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成することです。

## テストスイート（どこで何が実行されるか）

スイートは「リアリズムが増す」（そして不安定さ/コストも増す）ものとして考えます:

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: ターゲットなしの実行では `vitest.full-*.config.ts` shard set を使用し、並列スケジューリングのために multi-project shard を per-project config に展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core/unit inventories。UI unit tests は専用の `unit-ui` shard で実行されます
- スコープ:
  - 純粋な unit tests
  - プロセス内 integration tests（Gateway auth、routing、tooling、parsing、config）
  - 既知のバグに対する決定的なリグレッション
- 期待値:
  - CI で実行される
  - 実際の keys は不要
  - 高速かつ安定している必要がある
  - Resolver と public-surface loader tests は、実際の bundled Plugin source APIs ではなく、生成された小さな Plugin fixture を使って、広範な `api.js` と `runtime-api.js` の fallback 挙動を証明する必要があります。実際の Plugin API load は、Plugin が所有する contract/integration suites に属します。

ネイティブ依存関係ポリシー:

- デフォルトのテストインストールでは、任意のネイティブ Discord opus builds をスキップします。Discord voice receive は pure-JS `opusscript` decoder を使用し、`@discordjs/opus` は `ignoredBuiltDependencies` に残るため、ローカルテストや Testbox レーンでネイティブ addon はコンパイルされません。
- ネイティブ opus build を意図的に比較する必要がある場合は、専用の Discord voice performance または live lane を使用します。`@discordjs/opus` をデフォルトの `onlyBuiltDependencies` に戻さないでください。無関係な install/test loop がネイティブコードをコンパイルすることになります。

<AccordionGroup>
  <Accordion title="プロジェクト、shard、scoped lane">

    - ターゲット指定のない `pnpm test` は、巨大な単一のネイティブルートプロジェクトプロセスではなく、十二個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/extension の処理が無関係なスイートを飢餓状態にすることを避けられます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。マルチシャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを支払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付きレーンへ展開します。対象は、直接編集されたテスト、隣接する `*.test.ts` ファイル、明示的なソースマッピング、ローカルのインポートグラフ依存先です。設定/セットアップ/package の編集では、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使わない限り、テストを広範囲に実行しません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン更新では、対象を絞ったバージョン/設定/ルート依存関係チェックを実行し、トップレベルの version フィールド以外の package 変更を拒否するガードが入ります。
    - Live Docker ACP ハーネスの編集では、live Docker 認証スクリプトのシェル構文と live Docker スケジューラの dry-run という焦点を絞ったチェックを実行します。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定される場合のみ含まれます。依存関係、export、version、その他の package サーフェスの編集では、引き続きより広いガードを使用します。
    - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および類似の純粋なユーティリティ領域のインポートが軽いユニットテストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンを通ります。状態を持つファイルやランタイム負荷の重いファイルは、既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` の helper ソースファイルも、changed モード実行をこれらの軽量レーン内の明示的な隣接テストへマップするため、helper の編集でそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルの core helpers、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、インポートの重い 1 つのバケットが Node の長い末尾全体を抱え込まないようにします。
    - 通常の PR/main CI は、extension バッチスイープとリリース専用の `agentic-plugins` シャードを意図的にスキップします。完全な Release Validation は、リリース候補に対して plugin/extension 負荷の重いそれらのスイート用に、別個の `Plugin Prerelease` 子ワークフローを dispatch します。

  </Accordion>

  <Accordion title="埋め込み runner カバレッジ">

    - message-tool discovery の入力や Compaction ランタイムコンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化境界には、焦点を絞った helper 回帰テストを追加してください。
    - 埋め込み runner 統合スイートを健全に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, and
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - これらのスイートは、スコープ付き id と Compaction の挙動が実際の `run.ts` / `compact.ts` パスを通って引き続き流れることを検証します。helper のみのテストは、それらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool と isolation のデフォルト">

    - ベースの Vitest 設定はデフォルトで `threads` です。
    - 共有 Vitest 設定は `isolate: false` に固定し、ルートプロジェクト、e2e、live 設定全体で非分離 runner を使用します。
    - ルート UI レーンは自身の `jsdom` セットアップと optimizer を保持しますが、共有の非分離 runner 上でも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false` のデフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大きなローカル実行中の V8 コンパイル churn を減らすため、デフォルトで Vitest 子 Node プロセスに `--no-maglev` を追加します。通常の V8 挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、diff がどのアーキテクチャレーンをトリガーするかを表示します。
    - pre-commit フックは formatting のみです。フォーマット済みファイルを再ステージし、lint、typecheck、tests は実行しません。
    - スマートローカルチェックゲートが必要な場合は、handoff または push の前に `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付きレーンを通ります。agent がハーネス、設定、package、またはコントラクトの編集に本当により広い Vitest カバレッジが必要だと判断した場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング挙動を維持し、worker 上限だけを高くします。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストの load average がすでに高い場合は後退するため、複数の同時 Vitest 実行による影響はデフォルトで小さくなります。
    - ベースの Vitest 設定は、テストの配線が変わったときに changed-mode の再実行が正しく保たれるよう、projects/config ファイルを `forceRerunTriggers` としてマークします。
    - 設定は、サポートされるホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効なままにします。直接プロファイリング用に明示的なキャッシュ場所を 1 つ使いたい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf デバッグ">

    - `pnpm test:perf:imports` は、Vitest の import-duration レポートと import-breakdown 出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを `origin/main` 以降に変更されたファイルへスコープします。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。設定全体の実行では設定パスをキーとして使用します。include-pattern CI シャードはシャード名を追加するため、フィルター済みシャードを個別に追跡できます。
    - 1 つのホットなテストがまだ起動時インポートに大半の時間を費やしている場合は、重い依存関係を狭いローカル `*.runtime.ts` の境界の背後に置き、単に `vi.mock(...)` へ渡すためだけに runtime helpers を深くインポートするのではなく、その境界を直接モックしてください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み diff についてルーティングされた `test:changed` とネイティブルートプロジェクトパスを比較し、wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイルリストを `scripts/test-projects.mjs` とルート Vitest 設定にルーティングして、現在の dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッド用のメインスレッド CPU プロファイルを書き込みます。
    - `pnpm test:perf:profile:runner` は、ファイル並列性を無効にした unit スイート用の runner CPU+heap プロファイルを書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 worker に強制
- スコープ:
  - デフォルトで diagnostics を有効にして実際の loopback Gateway を起動します
  - diagnostic event パスを通じて、合成 gateway message、memory、大きな payload の churn を駆動します
  - Gateway WS RPC 経由で `diagnostics.stability` をクエリします
  - diagnostic stability bundle 永続化 helper をカバーします
  - recorder が bounded のままであること、合成 RSS サンプルが pressure budget 未満に収まること、session ごとの queue depth がゼロに戻ることをアサートします
- 期待値:
  - CI-safe かつ keyless
  - stability-regression フォローアップ用の狭いレーンであり、Gateway スイート全体の代替ではありません

### E2E（gateway smoke）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E tests
- ランタイムデフォルト:
  - リポジトリの他の部分と一致するように、Vitest `threads` と `isolate: false` を使用します。
  - adaptive workers を使用します（CI: 最大 2、local: デフォルトで 1）。
  - console I/O オーバーヘッドを減らすため、デフォルトで silent mode で実行します。
- 便利な上書き:
  - `OPENCLAW_E2E_WORKERS=<n>` で worker 数を強制します（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` で verbose console output を再有効化します。
- スコープ:
  - 複数インスタンス Gateway の end-to-end 挙動
  - WebSocket/HTTP サーフェス、node pairing、より重い networking
- 期待値:
  - CI で実行されます（pipeline で有効な場合）
  - 実際の key は不要です
  - unit tests より moving parts が多いです（遅くなる可能性があります）

### E2E: OpenShell backend smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell gateway を起動します
  - 一時ローカル Dockerfile から sandbox を作成します
  - 実際の `sandbox ssh-config` + SSH exec を通じて OpenClaw の OpenShell backend を実行します
  - sandbox fs bridge を通じて remote-canonical filesystem の挙動を検証します
- 期待値:
  - opt-in のみです。デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLI と動作する Docker daemon が必要です
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後 test gateway と sandbox を破棄します
- 便利な上書き:
  - `OPENCLAW_E2E_OPENSHELL=1` で、より広い e2e スイートを手動実行するときにテストを有効化します
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` で、デフォルト以外の CLI バイナリまたは wrapper script を指します

### Live（実際の providers + 実際の models）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下の bundled-plugin live tests
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「この provider/model は実際の creds で _今日_ 本当に動くか？」
  - provider format の変更、tool-calling の癖、auth issues、rate limit behavior を検出します
- 期待値:
  - 設計上 CI-stable ではありません（実際の networks、実際の provider policies、quotas、outages）
  - 費用がかかります / rate limits を使用します
  - 「全部」ではなく、絞り込んだ subset の実行を推奨します
- Live 実行は `~/.profile` を source して不足している API keys を取得します。
- デフォルトでは、live 実行は引き続き `HOME` を分離し、config/auth material を一時 test home にコピーするため、unit fixtures が実際の `~/.openclaw` を変更することはありません。
- live tests に意図的に実際の home directory を使わせる必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、デフォルトでより静かな mode になっています。`[live] ...` progress output は維持しますが、追加の `~/.profile` notice を抑制し、gateway bootstrap logs/Bonjour chatter をミュートします。完全な startup logs を戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API key rotation（provider 固有）: `*_API_KEYS` を comma/semicolon 形式で設定するか、`*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定します。または `OPENCLAW_LIVE_*_KEY` で live ごとの上書きを使用します。tests は rate limit responses でリトライします。
- Progress/Heartbeat 出力:
  - Live suites は現在 progress lines を stderr に出力するため、Vitest console capture が quiet でも長い provider calls が動作中であることを視認できます。
  - `vitest.live.config.ts` は Vitest console interception を無効にするため、provider/gateway progress lines は live runs 中に即座に stream されます。
  - direct-model Heartbeats は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - gateway/probe Heartbeats は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

この決定表を使用してください:

- 編集ロジック/テスト: `pnpm test` を実行します（多くを変更した場合は `pnpm test:coverage` も）
- Gateway networking / WS protocol / pairing に触れる場合: `pnpm test:e2e` を追加します
- 「my bot is down」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグする場合: 絞り込んだ `pnpm test:live` を実行します

## ライブ（ネットワークに触れる）テスト

ライブモデルマトリクス、CLI バックエンドのスモークテスト、ACP スモークテスト、Codex アプリサーバーハーネス、およびすべてのメディアプロバイダーのライブテスト（Deepgram、BytePlus、ComfyUI、画像、音楽、動画、メディアハーネス）と、ライブ実行の認証情報処理については、[ライブスイートのテスト](/ja-JP/help/testing-live)を参照してください。専用の更新およびPlugin検証チェックリストについては、[更新とPluginのテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つの分類に分かれます。

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で対応するプロファイルキーのライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカルの設定ディレクトリとワークスペースをマウントします（マウントされている場合は `~/.profile` も読み込みます）。対応するローカルのエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker ライブランナーは、Docker の完全スイープを現実的に保つため、デフォルトで小さめのスモーク上限を使います。
  `test:docker:live-models` のデフォルトは `OPENCLAW_LIVE_MAX_MODELS=12` で、
  `test:docker:live-gateway` のデフォルトは `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。明示的により大きい網羅的スキャンを行いたい場合は、これらの環境変数を上書きしてください。
- `test:docker:all` は `test:docker:live-build` によりライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックし、その後 2 つの `scripts/e2e/Dockerfile` イメージをビルドまたは再利用します。素のイメージは install/update/plugin-dependency レーン用の Node/Git ランナーにすぎません。これらのレーンは事前ビルド済み tarball をマウントします。機能イメージは、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールします。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあります。`scripts/test-docker-all.mjs` は選択されたプランを実行します。集約処理は重み付きローカルスケジューラーを使います。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限により重いライブ、npm-install、マルチサービスの各レーンが一斉に開始されないようにします。単一のレーンが有効な上限より重い場合でも、プールが空ならスケジューラーはそれを開始でき、その後キャパシティが再び利用可能になるまで単独で実行し続けます。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。Docker ホストにさらに余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整してください。ランナーはデフォルトで Docker の事前確認を行い、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを出力し、成功したレーンの所要時間を `.artifacts/docker-tests/lane-timings.json` に保存し、以降の実行ではその所要時間を使って長いレーンを先に開始します。ビルドや Docker 実行なしで重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使い、選択されたレーン、パッケージ/イメージ要件、認証情報に対する CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使います。
- `Package Acceptance` は、「このインストール可能な tarball は製品として動作するか」を確認する GitHub ネイティブのパッケージゲートです。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から 1 つの候補パッケージを解決し、それを `package-under-test` としてアップロードしてから、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。プロファイルは範囲の広さ順に `smoke`、`package`、`product`、`full` です。パッケージ/更新/Plugin契約、公開済みアップグレードの生存マトリクス、リリースデフォルト、失敗トリアージについては、[更新とPluginのテスト](/ja-JP/help/testing-updates-plugins)を参照してください。
- ビルドおよびリリースチェックは、tsdown の後に `scripts/check-cli-bootstrap-imports.mjs` を実行します。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的なビルド済みグラフをたどり、コマンドディスパッチ前の起動処理が Commander、プロンプト UI、undici、ロギングなどのパッケージ依存関係をインポートしている場合に失敗します。また、バンドルされた Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否します。パッケージ化された CLI スモークテストは、ルートヘルプ、onboard ヘルプ、doctor ヘルプ、status、config schema、model-list コマンドもカバーします。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限されています。その期限までは、ハーネスは出荷済みパッケージのメタデータ不足のみを許容します。省略された private QA inventory エントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落したパッチファイル、永続化された `update.channel` の欠落、レガシーPluginインストールレコードの場所、マーケットプレイスインストールレコード永続化の欠落、および `plugins update` 中の設定メタデータ移行です。`2026.4.25` より後のパッケージでは、これらのパスは厳密な失敗になります。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1 つ以上の実コンテナを起動し、より高レベルの統合パスを検証します。

ライブモデル Docker ランナーは、必要な CLI 認証ホームのみ（または実行が絞り込まれていない場合はサポートされるすべてのもの）を bind mount し、実行前にそれらをコンテナホームへコピーします。これにより、外部 CLI OAuth はホストの認証ストアを変更せずにトークンを更新できます。

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ACP バインド smoke: `pnpm test:docker:live-acp-bind` (スクリプト: `scripts/test-live-acp-bind-docker.sh`; デフォルトで Claude、Codex、Gemini を対象にし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` によって厳密な Droid/OpenCode カバレッジを含む)
- CLI バックエンド smoke: `pnpm test:docker:live-cli-backend` (スクリプト: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server ハーネス smoke: `pnpm test:docker:live-codex-harness` (スクリプト: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 開発 agent: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` は非公開 QA ソースチェックアウトレーンです。npm tarball では QA Lab が省略されるため、意図的にパッケージ Docker リリースレーンには含めていません。
- Open WebUI ライブ smoke: `pnpm test:docker:openwebui` (スクリプト: `scripts/e2e/openwebui-docker.sh`)
- オンボーディングウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- Npm tarball オンボーディング/チャンネル/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` は、パック済みの OpenClaw tarball を Docker 内にグローバルインストールし、env-ref オンボーディングとデフォルトの Telegram で OpenAI を設定し、doctor を実行して、モックされた OpenAI agent ターンを 1 回実行します。事前ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホスト側リビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`、チャンネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使用します。
- Skill install smoke: `pnpm test:docker:skill-install` は、パック済みの OpenClaw tarball を Docker 内にグローバルインストールし、config でアップロード済みアーカイブのインストールを無効化し、検索から現在のライブ ClawHub skill slug を解決し、`openclaw skills install` でインストールして、インストール済み skill と `.clawhub` の origin/lock メタデータを検証します。
- 更新チャンネル切り替え smoke: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker 内にグローバルインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャンネルと Plugin の更新後動作を検証し、その後パッケージ `stable` に戻して更新状態を確認します。
- アップグレード survivor smoke: `pnpm test:docker:upgrade-survivor` は、agents、チャンネル config、Plugin allowlist、古い Plugin 依存関係状態、既存の workspace/session ファイルを含む汚れた旧ユーザーフィクスチャの上に、パック済みの OpenClaw tarball をインストールします。ライブ provider やチャンネルキーなしでパッケージ更新と非対話 doctor を実行し、その後 loopback Gateway を起動して、config/state の保持と起動/status 予算を確認します。
- 公開済みアップグレード survivor smoke: `pnpm test:docker:published-upgrade-survivor` は、デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルを seed し、組み込みコマンドレシピでその baseline を設定し、生成された config を検証し、その公開済みインストールを候補 tarball に更新し、非対話 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、設定済み intents、state 保持、起動、`/healthz`、`/readyz`、RPC status 予算を確認します。単一 baseline を上書きするには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`、集約スケジューラに正確なローカル baseline を展開させるには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` に `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` などを指定し、issue 形式のフィクスチャを展開するには `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` に `reported-issues` などを指定します。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれます。Package Acceptance はこれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` のようなメタ baseline トークンを解決し、Full Release Validation は release-soak パッケージ gate を `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開します。
- セッション runtime context smoke: `pnpm test:docker:session-runtime-context` は、隠し runtime context transcript の永続化と、影響を受けた重複 prompt-rewrite 分岐の doctor 修復を検証します。
- Bun グローバルインストール smoke: `bash scripts/e2e/bun-global-install-smoke.sh` は現在のツリーをパックし、隔離された home で `bun install -g` によってインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み画像 provider を返すことを検証します。事前ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`、ビルド済み Docker image から `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使用します。
- インストーラー Docker smoke: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各コンテナ間で 1 つの npm cache を共有します。update smoke は、候補 tarball にアップグレードする前の stable baseline として npm `latest` をデフォルトで使用します。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`、GitHub では Install Smoke workflow の `update_baseline_version` input で上書きします。非 root インストーラーチェックは隔離された npm cache を保持するため、root 所有の cache entries が user-local インストール動作を隠しません。ローカル再実行間で root/update/direct-npm cache を再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` によって重複する direct-npm グローバル更新をスキップします。直接 `npm install -g` のカバレッジが必要な場合は、その env なしでスクリプトをローカル実行します。
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) はデフォルトで root Dockerfile image をビルドし、隔離されたコンテナ home に 1 つの workspace を持つ 2 つの agents を seed し、`agents delete --json` を実行し、有効な JSON と workspace 保持動作を検証します。install-smoke image を再利用するには `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使用します。
- Gateway ネットワーキング (2 つのコンテナ、WS auth + health): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) はソース E2E image と Chromium レイヤーをビルドし、raw CDP で Chromium を起動し、`browser doctor --deep` を実行して、CDP role snapshot が link URL、cursor-promoted clickable、iframe ref、frame メタデータを網羅することを検証します。
- OpenAI Responses web_search minimal reasoning 回帰: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) は、モックされた OpenAI server を Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後 provider schema reject を強制して raw detail が Gateway logs に現れることを確認します。
- MCP チャンネルブリッジ (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (実際の stdio MCP server + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (実際の Gateway + 隔離された cron と one-shot subagent 実行後の stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (ローカルパス、`file:`、hoisted dependencies を持つ npm registry、git moving refs、ClawHub kitchen-sink、marketplace 更新、Claude-bundle enable/inspect の install/update smoke): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトの kitchen-sink package/runtime ペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を設定します。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub fixture server を使用します。
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix smoke: `pnpm test:docker:plugin-lifecycle-matrix` は、bare container にパック済みの OpenClaw tarball をインストールし、npm Plugin をインストールし、enable/disable を切り替え、ローカル npm registry 経由で upgrade と downgrade を行い、インストール済み code を削除し、その後 uninstall が古い state を引き続き削除することを検証しながら、各 lifecycle phase の RSS/CPU metrics をログ出力します。
- Config reload metadata smoke: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` は、ローカルパス、`file:`、hoisted dependencies を持つ npm registry、git moving refs、ClawHub fixtures、marketplace 更新、Claude-bundle enable/inspect の install/update smoke を対象にします。`pnpm test:docker:plugin-update` はインストール済み plugins の unchanged update behavior を対象にします。`pnpm test:docker:plugin-lifecycle-matrix` は、resource-tracked npm Plugin の install、enable、disable、upgrade、downgrade、missing-code uninstall を対象にします。

共有 functional image を手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のような suite-specific image overrides は、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` が remote shared image を指している場合、スクリプトはそれがまだローカルにない場合に pull します。QR と installer Docker tests は、共有 built-app runtime ではなく package/install behavior を検証するため、独自の Dockerfiles を保持します。

live-model Docker ランナーは、現在のチェックアウトも読み取り専用でバインドマウントし、
コンテナ内の一時 workdir にステージングします。これにより、runtime
イメージをスリムに保ちながら、正確なローカル source/config に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、app-local の `.build` や
Gradle 出力ディレクトリなど、大きな local-only キャッシュやアプリのビルド出力をスキップするため、
Docker live 実行が machine-specific artifacts のコピーに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、gateway live probe はコンテナ内で
実際の Telegram/Discord などの channel worker を開始しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker lane から
gateway live coverage を絞り込んだり除外したりする必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルな互換性 smoke です。OpenAI互換 HTTP endpoint を有効化した
OpenClaw gateway container を開始し、その gateway に対して pinned Open WebUI container を開始し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証してから、
Open WebUI の `/api/chat/completions` proxy 経由で実際の chat request を送信します。
live model completion を待たずに、Open WebUI sign-in と model discovery の後で停止すべき
release-path CI check には `OPENWEBUI_SMOKE_MODE=models` を設定します。
初回実行は、Docker が Open WebUI image を pull する必要があったり、Open WebUI が自身の
cold-start setup を完了する必要があったりするため、かなり遅くなることがあります。
この lane は使用可能な live model key を想定しており、Dockerized run でそれを提供する主な方法は
`OPENCLAW_PROFILE_FILE`（デフォルトは `~/.profile`）です。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON payload が出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の Telegram、Discord、iMessage アカウントは不要です。
seeded Gateway container を起動し、`openclaw mcp serve` を生成する 2 つ目の container を開始してから、
routed conversation discovery、transcript read、attachment metadata、live event queue behavior、
outbound send routing、および実際の stdio MCP bridge 経由の Claude-style channel +
permission notification を検証します。notification check は raw stdio MCP frame を直接検査するため、
smoke は特定の client SDK がたまたま surface する内容だけでなく、bridge が実際に emit する内容を検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、live model key は不要です。repo Docker image をビルドし、
container 内で実際の stdio MCP probe server を開始し、その server を embedded Pi bundle
MCP runtime 経由で materialize し、tool を実行してから、`coding` と `messaging` が
`bundle-mcp` tools を保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらを filter することを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、live model key は不要です。
実際の stdio MCP probe server を持つ seeded Gateway を開始し、isolated cron turn と
`/subagents spawn` one-shot child turn を実行してから、各実行後に MCP child process が終了することを検証します。

手動 ACP plain-language thread smoke（CI ではありません）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは regression/debug workflow のために保持してください。ACP thread routing validation に再び必要になる可能性があるため、削除しないでください。

便利な env var:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、test 実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時 config/workspace dir を使用し、外部 CLI auth mount なしで、`OPENCLAW_PROFILE_FILE` から source された env var のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内で cached CLI install 用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI auth dir/file は `/host-auth...` 配下に読み取り専用でマウントされ、test 開始前に `/home/node/...` にコピーされます
  - デフォルト dir: `.minimax`
  - デフォルト file: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれた provider run では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推論される必要な dir/file のみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のような comma list で手動 override します
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` で実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` で container 内の provider を filter します
- rebuild が不要な rerun で既存の `openclaw:local-live` image を再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`
- creds が env ではなく profile store から来ることを保証するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smoke のために gateway が公開する model を選択するには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke が使用する nonce-check prompt を override するには `OPENCLAW_OPENWEBUI_PROMPT=...`
- pinned Open WebUI image tag を override するには `OPENWEBUI_IMAGE=...`

## docs sanity

doc edit 後に docs check を実行します: `pnpm check:docs`。
in-page heading check も必要な場合は、full Mintlify anchor validation を実行します: `pnpm docs:check-links:anchors`。

## Offline regression（CI-safe）

これらは、実際の provider を使わない「real pipeline」regression です。

- Gateway tool calling（mock OpenAI、実際の gateway + agent loop）: `src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、config の書き込み + auth enforced）: `src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent reliability eval（skills）

すでに「agent reliability evals」のように振る舞う CI-safe test がいくつかあります。

- 実際の gateway + agent loop を通した mock tool-calling（`src/gateway/gateway.test.ts`）。
- session wiring と config effect を検証する end-to-end ウィザード flow（`src/gateway/gateway.test.ts`）。

skills でまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **Decisioning:** prompt に skills が listed されている場合、agent は正しい skill を選ぶか（または無関係なものを避けるか）?
- **Compliance:** agent は使用前に `SKILL.md` を読み、required steps/args に従うか?
- **Workflow contracts:** tool order、session history carryover、sandbox boundary を assert する multi-turn scenario。

今後の eval は、まず決定的であるべきです。

- mock provider を使用して tool call + order、skill file read、session wiring を assert する scenario runner。
- skill-focused scenario の小さな suite（use vs avoid、gating、prompt injection）。
- CI-safe suite が整ってからのみ、optional live eval（opt-in、env-gated）。

## Contract test（plugin と channel shape）

Contract test は、登録されたすべての plugin と channel がその
interface contract に準拠していることを検証します。discovered plugin すべてを反復し、
shape と behavior assertion の suite を実行します。デフォルトの `pnpm test` unit lane は、
これらの shared seam と smoke file を意図的にスキップします。shared channel または provider surface を触る場合は、
contract command を明示的に実行してください。

### コマンド

- すべての contract: `pnpm test:contracts`
- channel contract のみ: `pnpm test:contracts:channels`
- provider contract のみ: `pnpm test:contracts:plugins`

### Channel contract

`src/channels/plugins/contracts/*.contract.test.ts` にあります。

- **plugin** - 基本的な plugin shape（id、name、capabilities）
- **setup** - Setup ウィザード contract
- **session-binding** - Session binding behavior
- **outbound-payload** - Message payload structure
- **inbound** - Inbound message handling
- **actions** - Channel action handler
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contract

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - Channel status probe
- **registry** - Plugin registry shape

### Provider contract

`src/plugins/contracts/*.contract.test.ts` にあります。

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup ウィザード

### 実行するタイミング

- plugin-sdk export または subpath を変更した後
- channel または provider plugin を追加または変更した後
- plugin registration または discovery を refactor した後

Contract test は CI で実行され、実際の API key は不要です。

## regression の追加（guidance）

live で発見された provider/model issue を修正する場合:

- 可能であれば CI-safe regression を追加します（mock/stub provider、または正確な request-shape transformation を capture）
- 本質的に live-only の場合（rate limit、auth policy）、live test は narrow に保ち、env var 経由で opt-in にします
- bug を捕捉する最小の layer を target することを優先します:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke または CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は registry metadata（`listSecretTargetRegistryEntries()`）から SecretRef class ごとに sampled target を 1 つ derive し、traversal-segment exec id が reject されることを assert します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、その test の `classifyTargetClass` を更新してください。この test は unclassified target id で意図的に fail するため、新しい class が暗黙にスキップされることはありません。

## 関連

- [Testing live](/ja-JP/help/testing-live)
- [Testing updates and plugins](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
