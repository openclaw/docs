---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway とエージェントの動作のデバッグ
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-05-11T20:32:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、小規模な
Docker ランナー群があります。このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何を対象にするか（そして意図的に何を対象に_しない_か）。
- よくあるワークフロー（ローカル、プッシュ前、デバッグ）でどのコマンドを実行するか。
- live テストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実世界のモデル/プロバイダーの問題に対するリグレッションを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、live トランスポートレーン）**は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - アーキテクチャ、コマンド面、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) - `pnpm openclaw qa matrix` のリファレンス。
- [QA channel](/ja-JP/channels/qa-channel) - リポジトリに基づくシナリオで使われる合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行について説明します。下の QA 固有ランナーのセクション（[QA 固有ランナー](#qa-specific-runners)）では、具体的な `qa` 呼び出しを列挙し、上記のリファレンスを参照します。
</Note>

## クイックスタート

通常の日は次のとおりです。

- フルゲート（プッシュ前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの、より高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest ウォッチループ: `pnpm test:watch`
- 直接ファイルを指定する実行は、拡張/チャンネルのパスにもルーティングされます: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復調査している場合は、まず対象を絞った実行を優先してください。
- Docker に基づく QA サイト: `pnpm qa:lab:up`
- Linux VM に基づく QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れる場合、または追加の確信がほしい場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）:

- live スイート（モデル + Gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイム性能レポート: 実際の `openai/gpt-5.4` エージェントターンでは
  `live_gpt54=true` を、Kova の CPU/ヒープ/トレース成果物では
  `deep_profile=true` を指定して `OpenClaw Performance` をディスパッチします。毎日スケジュールされる実行は、
  `CLAWGRIT_REPORTS_TOKEN` が設定されている場合、モックプロバイダー、ディーププロファイル、GPT 5.4 レーンの成果物を
  `openclaw/clawgrit-reports` に公開します。
  モックプロバイダーのレポートには、ソースレベルの Gateway 起動、メモリ、
  Plugin 圧力、反復 fake-model hello-loop、CLI 起動の数値も含まれます。
- Docker live モデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さなファイル読み取り風プローブを実行します。
    メタデータが `image` 入力を通知しているモデルでは、小さな画像ターンも実行されます。
    プロバイダー障害を切り分ける場合は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効にします。
  - CI カバレッジ: 毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` はどちらも、`include_live_suites: true` を指定して再利用可能な live/E2E ワークフローを呼び出します。これには、プロバイダー別にシャードされた個別の Docker live モデル
    マトリックスジョブが含まれます。
  - 集中的な CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して
    `OpenClaw Live And E2E Checks (Reusable)` をディスパッチします。
  - 高シグナルな新しいプロバイダーシークレットを `scripts/ci-hydrate-live-auth.sh` に追加し、
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` と、その
    スケジュール/リリース呼び出し元にも追加します。
- ネイティブ Codex バインドチャットスモーク: `pnpm test:docker:live-codex-bind`
  - Codex アプリサーバーパスに対して Docker live レーンを実行し、`/codex bind` で合成
    Slack DM をバインドし、`/codex fast` と
    `/codex permissions` を実行してから、通常の返信と画像添付が
    ACP ではなくネイティブ Plugin バインディングを通ることを検証します。
- Codex アプリサーバーハーネススモーク: `pnpm test:docker:live-codex-harness`
  - Plugin 所有の Codex アプリサーバーハーネスを通じて Gateway エージェントターンを実行し、
    `/codex status` と `/codex models` を検証し、デフォルトでは画像、
    cron MCP、サブエージェント、Guardian プローブを実行します。他の Codex
    アプリサーバー障害を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` でサブエージェントプローブを無効にします。集中的なサブエージェントチェックでは、他のプローブを無効にします:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、
    これはサブエージェントプローブの後に終了します。
- Codex オンデマンドインストールスモーク: `pnpm test:docker:codex-on-demand`
  - パッケージ化された OpenClaw tarball を Docker にインストールし、OpenAI API キー
    オンボーディングを実行し、Codex Plugin と `@openai/codex` 依存関係が
    必要に応じて管理対象 npm ルートにダウンロードされたことを検証します。
- live Plugin ツール依存関係スモーク: `pnpm test:docker:live-plugin-tool`
  - 実際の `slugify` 依存関係を持つフィクスチャ Plugin をパックし、
    `npm-pack:` 経由でインストールし、管理対象 npm ルート配下の依存関係を検証してから、
    live OpenAI モデルに Plugin ツールを呼び出して隠し slug を返すよう依頼します。
- Crestodian レスキューコマンドスモーク: `pnpm test:live:crestodian-rescue-channel`
  - メッセージチャンネルのレスキューコマンド面に対するオプトインの念入りなチェックです。
    `/crestodian status` を実行し、永続的なモデル変更をキューに入れ、
    `/crestodian yes` に返信し、監査/設定の書き込みパスを検証します。
- Crestodian プランナー Docker スモーク: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に偽の Claude CLI がある設定なしコンテナで Crestodian を実行し、
    あいまいプランナーのフォールバックが、監査付きの型付き設定書き込みに変換されることを検証します。
- Crestodian 初回実行 Docker スモーク: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw 状態ディレクトリから開始し、裸の `openclaw` を
    Crestodian にルーティングし、セットアップ/モデル/エージェント/Discord Plugin + SecretRef 書き込みを適用し、
    設定を検証し、監査エントリを確認します。同じ Ring 0 セットアップパスは、
    QA Lab でも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi コストスモーク: `MOONSHOT_API_KEY` を設定した状態で、
  `openclaw models list --provider moonshot --json` を実行してから、分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を `moonshot/kimi-k2.6` に対して実行します。JSON が Moonshot/K2.6 を報告し、
  アシスタントのトランスクリプトに正規化された `usage.cost` が保存されることを検証します。

<Tip>
失敗しているケースが 1 つだけ必要な場合は、下記の allowlist 環境変数で live テストを絞り込むことを優先してください。
</Tip>

## QA 固有ランナー

QA-lab の現実性が必要な場合、これらのコマンドはメインのテストスイートと並んで使われます。

CI は専用ワークフローで QA Lab を実行します。エージェント的パリティは
`QA-Lab - All Lanes` とリリース検証の下にネストされており、独立した PR ワークフローではありません。
広範な検証には、`rerun_group=qa-parity` または release-checks QA グループを指定した
`Full Release Validation` を使用してください。安定版/デフォルトのリリースチェックでは、
網羅的な live/Docker ソークは `run_release_soak=true` の背後に置かれます。
`full` プロファイルはソークを強制的に有効にします。`QA-Lab - All Lanes` は
`main` で毎晩実行され、手動ディスパッチからは、モックパリティレーン、live
Matrix レーン、Convex 管理の live Telegram レーン、Convex 管理の live Discord
レーンを並列ジョブとして実行します。スケジュールされた QA とリリースチェックは Matrix
`--profile fast` を明示的に渡しますが、Matrix CLI と手動ワークフロー入力の
デフォルトは `all` のままです。手動ディスパッチでは、`all` を `transport`、
`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードできます。`OpenClaw Release
Checks` は、リリース承認前にパリティと高速 Matrix および Telegram レーンを実行し、
リリーストランスポートチェックには `mock-openai/gpt-5.5` を使用することで、
決定論的に保ち、通常のプロバイダー Plugin 起動を避けます。これらの live トランスポート
Gateway はメモリ検索を無効にします。メモリ動作は QA パリティ
スイートで引き続きカバーされます。

フルリリースの live メディアシャードは
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。これにはすでに
`ffmpeg` と `ffprobe` が含まれています。Docker live モデル/バックエンドシャードは、選択されたコミットごとに一度だけビルドされる共有
`ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各シャード内で再ビルドする代わりに
`OPENCLAW_SKIP_DOCKER_BUILD=1` でそれを pull します。

- `pnpm openclaw qa suite`
  - リポジトリに裏付けられた QA シナリオをホスト上で直接実行します。
  - 分離された Gateway ワーカーを使い、選択された複数のシナリオをデフォルトで並列実行します。`qa-channel` はデフォルトで並行数 4 です（選択されたシナリオ数が上限）。ワーカー数を調整するには `--concurrency <count>` を使用し、従来の直列レーンには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` は、シナリオ対応の `mock-openai` レーンを置き換えずに、実験的なフィクスチャとプロトコルモックのカバレッジ用に、ローカルの AIMock ベースのプロバイダーサーバーを起動します。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab を通じてライブ OpenAI Kitchen Sink Plugin のガントレットを実行します。外部 Kitchen Sink パッケージをインストールし、Plugin SDK サーフェスのインベントリを検証し、`/healthz` と `/readyz` をプローブし、Gateway の CPU/RSS 証拠を記録し、ライブ OpenAI ターンを実行し、敵対的診断を確認します。`OPENAI_API_KEY` などのライブ OpenAI 認証が必要です。ハイドレート済み Testbox セッションでは、`openclaw-testbox-env` ヘルパーが存在する場合に Testbox ライブ認証プロファイルを自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチに加え、小さなモック QA Lab シナリオパック（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`）を実行し、結合された CPU 観測サマリーを `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは持続的な高 CPU 観測のみをフラグします（`--cpu-core-warn` と `--hot-wall-warn-ms`）。そのため、短い起動時バーストは、数分続く Gateway 張り付き回帰のように見せず、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使用します。チェックアウトに新しいランタイム出力がまだない場合は、先にビルドを実行します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - ライブ実行では、ゲストで実用的なサポート済み QA 認証入力を転送します。env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および存在する場合の `CODEX_HOME` です。
  - 出力ディレクトリは、ゲストがマウント済みワークスペース経由で書き戻せるよう、リポジトリルート配下に置く必要があります。
  - 通常の QA レポートとサマリーに加え、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業用に、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内にグローバルインストールし、非対話の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、パッケージ化された Plugin ランタイムが起動時の依存関係修復なしでロードされることを検証し、doctor を実行し、モックされた OpenAI エンドポイントに対してローカルエージェントターンを 1 回実行します。
  - Discord で同じパッケージインストールレーンを実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストのトランスクリプト向けに、決定的なビルド済みアプリ Docker スモークを実行します。隠し OpenClaw ランタイムコンテキストが、表示されるユーザーターンに漏れず、非表示のカスタムメッセージとして永続化されることを検証します。その後、影響を受ける壊れたセッション JSONL をシードし、`openclaw doctor --fix` がバックアップ付きでアクティブブランチへ書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内に OpenClaw パッケージ候補をインストールし、インストール済みパッケージのオンボーディングを実行し、インストール済み CLI 経由で Telegram を設定し、その後、そのインストール済みパッケージを SUT Gateway としてライブ Telegram QA レーンを再利用します。
  - ラッパーは、チェックアウトから `qa-lab` ハーネスソースのみをマウントします。インストール済みパッケージが `dist`、`openclaw/plugin-sdk`、同梱 Plugin ランタイムを所有するため、このレーンは現在のチェックアウトの Plugin をテスト対象パッケージに混在させません。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。レジストリからインストールする代わりに解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使用します。CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて `OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定します。CI に `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットが存在する場合、Docker ラッパーは Convex を自動的に選択します。
  - ラッパーは、Docker のビルド/インストール作業の前に、ホスト上で Telegram または Convex 認証情報の env を検証します。認証情報準備前のセットアップを意図的にデバッグする場合にのみ、`OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンでのみ共有の `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions はこのレーンを手動メンテナーワークフロー `NPM Telegram Beta E2E` として公開します。マージ時には実行されません。このワークフローは `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- GitHub Actions は、1 つの候補パッケージに対するサイド実行のプロダクト証拠用に `Package Acceptance` も公開します。信頼済み ref、公開済み npm spec、SHA-256 付き HTTPS tarball URL、または別の実行からの tarball アーティファクトを受け付け、正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、その後、既存の Docker E2E スケジューラーを smoke、package、product、full、または custom レーンプロファイルで実行します。同じ `package-under-test` アーティファクトに対して Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta プロダクト証拠:

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
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI が設定された状態で Gateway を起動し、その後、設定編集により同梱チャネル/Plugin を有効化します。
  - セットアップ検出で未設定のダウンロード可能 Plugin が存在しないままになること、最初の設定済み doctor 修復で不足している各ダウンロード可能 Plugin が明示的にインストールされること、2 回目の再起動では隠し依存関係修復が実行されないことを検証します。
  - 既知の古い npm ベースラインもインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補の更新後 doctor がハーネス側の postinstall 修復なしでレガシー Plugin 依存関係の残骸をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージインストール更新スモークを実行します。選択された各プラットフォームは、まず要求されたベースラインパッケージをインストールし、その後同じゲスト内でインストール済みの `openclaw update` コマンドを実行し、インストール済みバージョン、更新ステータス、Gateway readiness、およびローカルエージェントターン 1 回を検証します。
  - 1 つのゲストで反復する場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使用します。サマリーアーティファクトパスとレーンごとのステータスには `--json` を使用します。
  - OpenAI レーンは、ライブエージェントターン証拠にデフォルトで `openai/gpt-5.5` を使用します。別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels トランスポートの停止が残りのテスト時間を消費しないよう、長いローカル実行はホストの timeout でラップします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトはネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認します。
  - Windows 更新では、コールドゲスト上の更新後 doctor とパッケージ更新作業に 10〜15 分かかる場合があります。ネストされた npm デバッグログが進んでいるなら、それでも正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux スモークレーンと並列で実行しないでください。これらは VM 状態を共有しており、スナップショット復元、パッケージ配信、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後の証拠では通常の同梱 Plugin サーフェスを実行します。これは、エージェントターン自体が単純なテキスト応答のみを確認する場合でも、speech、image generation、media understanding などの capability facade が同梱ランタイム API 経由でロードされるためです。

- `pnpm openclaw qa aimock`
  - 直接のプロトコルスモークテスト用に、ローカル AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel homeserver に対して Matrix ライブ QA レーンを実行します。ソースチェックアウト専用です - パッケージインストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、env vars、アーティファクトレイアウト: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - env からの driver と SUT bot トークンを使い、実際のプライベートグループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、および `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報用に `--credential-source convex` をサポートします。デフォルトでは env モードを使用し、プールリースを選択するには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - デフォルトでは canary、mention gating、command addressing、`/status`、bot-to-bot mentioned replies、および core native command replies をカバーします。`mock-openai` のデフォルトでは、決定的な reply-chain と Telegram final-message streaming の回帰もカバーします。`session_status` などの任意プローブには `--list-scenarios` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じプライベートグループ内に 2 つの異なる bot が必要で、SUT bot は Telegram ユーザー名を公開している必要があります。
  - 安定した bot-to-bot 観測のため、両方の bot で `@BotFather` の Bot-to-Bot Communication Mode を有効にし、driver bot がグループ内の bot トラフィックを観測できるようにします。
  - Telegram QA レポート、サマリー、および observed-messages アーティファクトを `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、driver の送信リクエストから観測された SUT 返信までの RTT が含まれます。

`Mantis Telegram Live` は、このレーンを囲む PR 証拠ラッパーです。候補 ref を Convex リースの Telegram 認証情報で実行し、リダクション済みの observed-message トランスクリプトを Crabbox デスクトップブラウザーでレンダリングし、MP4 証拠を記録し、モーションでトリミングした GIF を生成し、アーティファクトバンドルをアップロードし、`pr_number` が設定されている場合は Mantis GitHub App 経由でインライン PR 証拠を投稿します。メンテナーは、Actions UI から `Mantis Scenario`（`scenario_id:
telegram-live`）経由で開始するか、pull request コメントから直接開始できます:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` は、PR 視覚証拠用のエージェント式ネイティブ Telegram Desktop before/after ラッパーです。Actions UI から自由形式の `instructions` で、`Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）経由で、または PR コメントから開始します:

```text
@Mantis telegram desktop proof
```

Mantis エージェントは PR を読み、Telegram で見えるどの挙動が変更の証明になるかを判断し、ベースライン ref と候補 ref で実ユーザーの Crabbox Telegram Desktop 証明レーンを実行し、ネイティブ GIF が有用になるまで反復し、対応する `motionPreview` マニフェストを書き、`pr_number` が設定されている場合は Mantis GitHub App 経由で同じ 2 列の GIF テーブルを投稿します。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux デスクトップをリースまたは再利用し、ネイティブ Telegram Desktop をインストールし、リースされた Telegram SUT ボットトークンで OpenClaw を構成し、Gateway を起動し、表示されている VNC デスクトップからスクリーンショット/MP4 証拠を記録します。
  - デフォルトは `--credential-source convex` なので、ワークフローに必要なのは Convex ブローカーシークレットだけです。`pnpm openclaw qa telegram` と同じ `OPENCLAW_QA_TELEGRAM_*` 変数で `--credential-source env` を使用します。
  - Telegram Desktop には引き続きユーザーログイン/プロファイルが必要です。ボットトークンは OpenClaw のみを構成します。base64 `.tgz` プロファイルアーカイブには `--telegram-profile-archive-env <name>` を使用するか、`--keep-lease` を使用して VNC 経由で一度手動ログインします。
  - 出力ディレクトリ配下に `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png`、`telegram-desktop-builder.mp4` を書き込みます。

ライブトランスポートレーンは、新しいトランスポートが逸脱しないように 1 つの標準契約を共有します。レーンごとのカバレッジマトリクスは [QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、そのマトリクスには含まれません。

### Convex 経由の共有 Telegram 認証情報 (v1)

ライブトランスポート QA で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA lab は Convex バックのプールから排他的リースを取得し、レーンの実行中はそのリースに Heartbeat を送り、シャットダウン時にリースを解放します。セクション名は Discord、Slack、WhatsApp 対応より前のものです。リース契約は種類をまたいで共有されます。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用のシークレット 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用する必要があります。

メンテナー管理コマンド（プールの追加/削除/一覧表示）には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を出力せずに Convex サイト URL、ブローカーシークレット、エンドポイントプレフィックス、HTTP タイムアウト、admin/list 到達性を確認します。スクリプトや CI ユーティリティで機械可読出力が必要な場合は `--json` を使用します。

デフォルトエンドポイント契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/リトライ可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 成功: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功: `{ status: "ok" }`（または空の `2xx`）
- `POST /release`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功: `{ status: "ok" }`（または空の `2xx`）
- `POST /admin/add`（メンテナーシークレットのみ）
  - リクエスト: `{ kind, actorId, payload, note?, status? }`
  - 成功: `{ status: "ok", credential }`
- `POST /admin/remove`（メンテナーシークレットのみ）
  - リクエスト: `{ credentialId, actorId }`
  - 成功: `{ status: "ok", changed, credential }`
  - アクティブリースガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（メンテナーシークレットのみ）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram 種類のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正な形式のペイロードを拒否します。

Telegram 実ユーザー種類のペイロード形状:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId`、`telegramApiId` は数値文字列である必要があります。
- `tdlibArchiveSha256` と `desktopTdataArchiveSha256` は SHA-256 16 進文字列である必要があります。
- `kind: "telegram-user"` は 1 つの Telegram burner アカウントを表します。リースはアカウント全体に対するものとして扱います。TDLib CLI ドライバーと Telegram Desktop の視覚的証人は同じペイロードから復元され、同時にリースを保持するジョブは 1 つだけである必要があります。

Telegram 実ユーザーリースの復元:

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

視覚的な記録が必要な場合は、復元した Desktop プロファイルを `Telegram -workdir "$tmp/desktop"` で使用します。ローカルオペレーター環境では、プロセス環境変数がない場合、`scripts/e2e/telegram-user-credential.ts` はデフォルトで `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` を読み取ります。

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

`start` は `telegram-user` 認証情報をリースし、Crabbox Linux デスクトップ上で同じアカウントを TDLib と Telegram Desktop に復元し、現在のチェックアウトからローカルモック SUT Gateway を起動し、表示される Telegram チャットを開き、デスクトップ記録を開始し、プライベートな `session.json` を書き込みます。セッションが生存している間、エージェントは満足するまでテストを続けられます。

- `send --session <file> --text <message>` は実際の TDLib ユーザー経由で送信し、SUT の返信を待ちます。
- `run --session <file> -- <remote command>` は Crabbox 上で任意のコマンドを実行し、その出力を保存します。例: `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`。
- `screenshot --session <file>` は現在表示されているデスクトップをキャプチャします。
- `status --session <file>` はリースと WebVNC コマンドを出力します。
- `finish --session <file>` はレコーダーを停止し、スクリーンショット/動画/motion-trim アーティファクトをキャプチャし、Convex 認証情報を解放し、ローカル SUT プロセスを停止し、`--keep-box` が渡されていない限り Crabbox リースを停止します。
- `publish --session <file> --pr <number>` はデフォルトで GIF のみの PR コメントを公開します。ログまたは JSON アーティファクトが意図的に必要な場合のみ `--full-artifacts` を渡します。

決定論的な視覚再現には、`start` または 1 コマンドの `probe` ショートハンドに `--mock-response-file <path>` を渡します。ランナーのデフォルトは標準 Crabbox クラス、24fps 記録、24fps motion GIF プレビュー、1920px GIF 幅です。証明に異なるキャプチャ設定が必要な場合のみ、`--class`、`--record-fps`、`--preview-fps`、`--preview-width` で上書きします。

1 コマンド Crabbox 証明:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

デフォルトの `probe` コマンドは、1 回の start/send/finish サイクルのショートハンドです。手早い `/status` スモークに使用します。PR レビュー、バグ再現作業、またはエージェントが証明完了を判断する前に数分間の任意実験を必要とする場合には、セッションコマンドを使用します。ウォーム済みデスクトップリースを再利用するには `--id <cbx_...>`、finish 後も VNC を開いたままにするには `--keep-box`、表示されるチャットを選択するには `--desktop-chat-title <name>`、新しいボックスで TDLib をビルドする代わりに事前作成済み Linux `libtdjson.so` アーカイブを使用する場合は `--tdlib-url <tgz>` を使用します。ランナーは `--tdlib-url` を `--tdlib-sha256 <hex>`、またはデフォルトでは隣接する `<url>.sha256` ファイルで検証します。

ブローカー検証済みマルチチャンネルペイロード:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack レーンもプールからリースできますが、Slack ペイロード検証は現在ブローカーではなく Slack QA ランナー側にあります。Slack 行には `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用します。

### QA にチャンネルを追加する

新しいチャンネルアダプターのアーキテクチャとシナリオヘルパー名は [QA 概要 → チャンネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低基準: 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成します。

## テストスイート（どこで何が実行されるか）

スイートは「現実性が増す」もの（そして不安定さ/コストも増すもの）として考えてください。

### ユニット / インテグレーション（デフォルト）

- コマンド: `pnpm test`
- 設定: ターゲットなしの実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定へ展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core/unit インベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- スコープ:
  - 純粋なユニットテスト
  - インプロセスのインテグレーションテスト（Gateway 認証、ルーティング、ツーリング、解析、設定）
  - 既知のバグに対する決定論的リグレッション
- 期待値:
  - CI で実行される
  - 実キーは不要
  - 高速かつ安定しているべき
  - resolver と public-surface loader のテストは、実際のバンドル済み Plugin ソース API ではなく、生成された小さな Plugin fixture で広範な `api.js` と `runtime-api.js` の fallback 挙動を証明する必要があります。実 Plugin API のロードは、Plugin 所有の契約/インテグレーションスイートに属します。

ネイティブ依存関係ポリシー:

- デフォルトのテスト用インストールでは、任意のネイティブ Discord opus ビルドをスキップします。Discord 音声受信は pure-JS の `opusscript` デコーダーを使用し、`@discordjs/opus` は `allowBuilds` で無効のままにするため、ローカルテストと Testbox レーンはネイティブアドオンをコンパイルしません。
- ネイティブ opus ビルドを意図的に比較する必要がある場合は、専用の Discord 音声パフォーマンスレーンまたはライブレーンを使用してください。デフォルトの `allowBuilds` で `@discordjs/opus` を `true` に設定しないでください。無関係なインストール/テストループでネイティブコードがコンパイルされるようになります。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ付きレーン">

    - ターゲット指定なしの `pnpm test` は、巨大な単一のネイティブルートプロジェクトプロセスではなく、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS を削減し、auto-reply/拡張機能の処理が無関係なスイートを圧迫することを避けます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。複数シャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを支払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付きレーンに展開します。直接のテスト編集、隣接する `*.test.ts` ファイル、明示的なソースマッピング、ローカルのインポートグラフ依存先が対象です。設定/セットアップ/package の編集では、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を明示的に使用しない限り、広範囲のテストは実行されません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートなローカルチェックゲートです。差分を core、core テスト、拡張機能、拡張機能テスト、アプリ、ドキュメント、リリースメタデータ、ライブ Docker ツーリング、ツーリングに分類し、対応する型チェック、lint、ガードコマンドを実行します。Vitest テストは実行しません。テスト証跡には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン更新では、対象を絞ったバージョン/設定/ルート依存関係チェックを実行し、トップレベルの version フィールド以外の package 変更を拒否するガードも実行します。
    - ライブ Docker ACP ハーネスの編集では、重点チェックを実行します。ライブ Docker 認証スクリプトのシェル構文と、ライブ Docker スケジューラーのドライランです。`package.json` の変更は、差分が `scripts["test:docker:live-*"]` に限定される場合のみ含まれます。依存関係、export、バージョン、その他のパッケージサーフェスの編集では、引き続きより広範なガードを使用します。
    - agents、commands、Plugin、自動返信ヘルパー、`plugin-sdk`、および同様の純粋なユーティリティ領域の、インポートが軽いユニットテストは `unit-fast` レーンにルーティングされます。このレーンは `test/setup-openclaw-runtime.ts` をスキップします。状態を持つファイルやランタイムが重いファイルは既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` のヘルパーソースファイルも、changed モードの実行をこれらの軽量レーン内の明示的な隣接テストにマッピングするため、ヘルパー編集でそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルの core ヘルパー、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、インポートが重い 1 つのバケットが Node の長いテール全体を占有しないようにします。
    - 通常の PR/main CI では、拡張機能のバッチスイープとリリース専用の `agentic-plugins` シャードを意図的にスキップします。完全リリース検証では、リリース候補に対してこれらの Plugin/拡張機能が重いスイート用に、別個の `Plugin Prerelease` 子ワークフローをディスパッチします。

  </Accordion>

  <Accordion title="埋め込みランナーのカバレッジ">

    - メッセージツール探索入力または Compaction ランタイム
      コンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化の境界には、対象を絞ったヘルパー回帰テストを追加してください。
    - 埋め込みランナー統合スイートを正常に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, and
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - これらのスイートは、スコープ付き ID と Compaction の挙動が実際の
      `run.ts` / `compact.ts` パスを通って引き続き流れることを検証します。ヘルパーのみのテストは、
      これらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest プールと分離のデフォルト">

    - ベースの Vitest 設定はデフォルトで `threads` です。
    - 共有 Vitest 設定は `isolate: false` に固定され、ルートプロジェクト、e2e、ライブ設定全体で
      非分離ランナーを使用します。
    - ルート UI レーンは `jsdom` セットアップと optimizer を維持しますが、
      共有の非分離ランナーでも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false`
      デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 コンパイルの反復コストを減らすため、デフォルトで Vitest 子 Node
      プロセスに `--no-maglev` を追加します。
      標準 V8 の挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は差分がどのアーキテクチャレーンをトリガーするかを表示します。
    - pre-commit フックはフォーマットのみです。フォーマット済みファイルを再度ステージングし、
      lint、型チェック、テストは実行しません。
    - 引き継ぎまたはプッシュ前にスマートなローカルチェックゲートが必要な場合は、
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付きレーンを通します。
      エージェントがハーネス、設定、package、またはコントラクトの編集に本当に広範な
      Vitest カバレッジが必要だと判断した場合のみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング
      挙動を維持し、ワーカー上限だけを高くします。
    - ローカルワーカーの自動スケーリングは意図的に保守的で、
      ホストのロードアベレージがすでに高い場合は引き下げるため、複数の同時
      Vitest 実行による影響はデフォルトで抑えられます。
    - ベース Vitest 設定では、テストの接続設定が変わった場合でも changed モードの再実行が正しく保たれるよう、projects/config ファイルを
      `forceRerunTriggers` としてマークしています。
    - 設定では、サポート対象ホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効のままにします。直接プロファイリング用に
      明示的なキャッシュ場所を 1 つ指定したい場合は、
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="パフォーマンスデバッグ">

    - `pnpm test:perf:imports` は、Vitest のインポート所要時間レポートと
      インポート内訳出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを
      `origin/main` 以降に変更されたファイルにスコープします。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。
      設定全体の実行では設定パスをキーとして使用します。include パターン CI
      シャードではシャード名を追加するため、フィルター済みシャードを個別に追跡できます。
    - 1 つの高負荷なテストが依然として時間の大半を起動時インポートに費やす場合は、
      重い依存関係を狭いローカル `*.runtime.ts` 境界の背後に置き、
      `vi.mock(...)` に渡すためだけにランタイムヘルパーを深く import するのではなく、
      その境界を直接モックしてください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み差分について、ルーティングされた
      `test:changed` とネイティブルートプロジェクトパスを比較し、経過時間と macOS 最大 RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイルリストを
      `scripts/test-projects.mjs` とルート Vitest 設定に通してルーティングすることで、現在の未コミットのワークツリーをベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform のオーバーヘッドについて
      メインスレッド CPU プロファイルを書き込みます。
    - `pnpm test:perf:profile:runner` は、ファイル並列を無効化した状態で、
      ユニットスイートのランナー CPU+heap プロファイルを書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（Gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 ワーカーに強制
- スコープ:
  - diagnostics をデフォルトで有効にした実際のループバック Gateway を起動します
  - 合成 gateway メッセージ、メモリ、大きなペイロードのチャーンを診断イベントパスに通します
  - Gateway WS RPC 経由で `diagnostics.stability` をクエリします
  - 診断安定性バンドル永続化ヘルパーをカバーします
  - レコーダーが上限内に収まり、合成 RSS サンプルが負荷予算を下回り、セッションごとのキュー深度がゼロまで排出されることをアサートします
- 期待事項:
  - CI で安全に実行でき、キー不要
  - 安定性回帰の追跡用の狭いレーンであり、Gateway スイート全体の代替ではありません

### E2E（Gateway スモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の同梱 Plugin E2E テスト
- ランタイムのデフォルト:
  - リポジトリの他の部分と同じく、Vitest `threads` と `isolate: false` を使用します。
  - 適応型ワーカーを使用します（CI: 最大 2、ローカル: デフォルトで 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトで silent モードで実行します。
- 有用な上書き設定:
  - `OPENCLAW_E2E_WORKERS=<n>` でワーカー数を強制します（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` で詳細なコンソール出力を再度有効にします。
- スコープ:
  - 複数インスタンス Gateway のエンドツーエンド挙動
  - WebSocket/HTTP サーフェス、ノードペアリング、重めのネットワーク処理
- 期待事項:
  - CI で実行されます（パイプラインで有効な場合）
  - 実キー不要
  - ユニットテストより可動部分が多い（遅くなる場合があります）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell Gateway を起動します
  - 一時ローカル Dockerfile からサンドボックスを作成します
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell バックエンドを実行します
  - サンドボックス fs ブリッジを介したリモート正準ファイルシステム挙動を検証します
- 期待事項:
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLI と動作する Docker デーモンが必要です
  - 分離した `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト Gateway とサンドボックスを破棄します
- 有用な上書き設定:
  - `OPENCLAW_E2E_OPENSHELL=1` で、より広範な e2e スイートを手動実行する際にテストを有効にします
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` で、デフォルト以外の CLI バイナリまたはラッパースクリプトを指すようにします

### ライブ（実プロバイダー + 実モデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル済み Plugin の live テスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- 範囲:
  - 「このプロバイダー/モデルは、実際の認証情報を使って _今日_ 本当に動作するか？」
  - プロバイダーのフォーマット変更、ツール呼び出しの癖、認証の問題、レート制限の挙動を検出する
- 期待事項:
  - 設計上 CI で安定するものではない（実ネットワーク、実際のプロバイダーポリシー、クォータ、障害）
  - 費用が発生する / レート制限を消費する
  - 「すべて」ではなく、絞り込んだサブセットの実行を推奨
- live 実行は `~/.profile` を読み込み、不足している API キーを取得する。
- デフォルトでは、live 実行も引き続き `HOME` を分離し、設定/認証素材を一時テストホームへコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更することはない。
- live テストで実際のホームディレクトリを使う必要があると意図している場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定する。
- `pnpm test:live` は現在、より静かなモードがデフォルトになっている。`[live] ...` の進行状況出力は保持するが、追加の `~/.profile` 通知を抑制し、Gateway のブートストラップログ/Bonjour の雑音をミュートする。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定する。
- API キーのローテーション（プロバイダー固有）: `*_API_KEYS` にカンマ/セミコロン形式を設定するか、`*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定する。または `OPENCLAW_LIVE_*_KEY` で live ごとの上書きを設定する。テストはレート制限レスポンス時に再試行する。
- 進行状況/Heartbeat 出力:
  - live スイートは stderr に進行状況行を出力するようになったため、Vitest のコンソールキャプチャが静かな場合でも、長いプロバイダー呼び出しがアクティブであることを視認できる。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効化し、live 実行中にプロバイダー/Gateway の進行状況行が即時にストリームされるようにする。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整する。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整する。

## どのスイートを実行すべきか？

この判断表を使用する:

- ロジック/テストの編集: `pnpm test` を実行する（大きく変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れる場合: `pnpm test:e2e` を追加する
- 「自分の bot が落ちている」/ プロバイダー固有の失敗 / ツール呼び出しのデバッグ: 絞り込んだ `pnpm test:live` を実行する

## live（ネットワークに触れる）テスト

live モデルマトリクス、CLI バックエンド smoke、ACP smoke、Codex アプリサーバー
ハーネス、およびすべてのメディアプロバイダー live テスト（Deepgram、BytePlus、ComfyUI、image、
music、video、media ハーネス）に加えて、live 実行の認証情報処理については、
[Testing live suites](/ja-JP/help/testing-live) を参照。専用の更新および
Plugin 検証チェックリストについては、
[Testing updates and plugins](/ja-JP/help/testing-updates-plugins) を参照。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つの区分に分かれる:

- live モデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で、一致するプロファイルキー live ファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカル設定ディレクトリとワークスペースをマウントする（マウントされている場合は `~/.profile` も読み込む）。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles`。
- Docker live ランナーはデフォルトで小さめの smoke 上限を使用するため、Docker 全体スイープを現実的に保てる:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。より大きな網羅的スキャンを明示的に
  必要とする場合は、これらの環境変数を上書きする。
- `test:docker:all` は `test:docker:live-build` で live Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックし、その後 2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用する。ベア画像は install/update/plugin-dependency レーン用の Node/Git ランナーのみであり、それらのレーンは事前ビルド済み tarball をマウントする。機能画像は、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールする。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行する。集約は重み付きローカルスケジューラーを使用する: `OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限は重い live、npm-install、複数サービスのレーンがすべて同時に開始されないようにする。単一のレーンが有効な上限より重い場合でも、プールが空であればスケジューラーはそれを開始でき、その後は再びキャパシティが利用可能になるまで単独で実行し続ける。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、および `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`。Docker ホストにさらに余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整する。ランナーはデフォルトで Docker preflight を実行し、古い OpenClaw E2E コンテナーを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、後続の実行でそれらのタイミングを使って長いレーンから先に開始する。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、パッケージ/イメージの必要性、認証情報について CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用する。
- `Package Acceptance` は、「このインストール可能な tarball は製品として動作するか？」を確認する GitHub ネイティブのパッケージゲート。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードし、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行する。プロファイルは範囲の広さ順に `smoke`、`package`、`product`、`full`。パッケージ/update/Plugin の契約、公開済みアップグレードの survivor マトリクス、リリースデフォルト、失敗時のトリアージについては [Testing updates and plugins](/ja-JP/help/testing-updates-plugins) を参照。
- ビルドおよびリリースチェックは tsdown 後に `scripts/check-cli-bootstrap-imports.mjs` を実行する。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的ビルドグラフをたどり、コマンドディスパッチ前の起動処理が Commander、プロンプト UI、undici、logging などのパッケージ依存関係をインポートしている場合に失敗する。また、バンドルされた Gateway 実行チャンクを予算内に保ち、既知の cold Gateway パスの静的インポートを拒否する。パッケージ化された CLI smoke は、ルートヘルプ、onboard ヘルプ、doctor ヘルプ、status、config schema、および model-list コマンドもカバーする。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）で上限が設定されている。その期限までは、ハーネスは出荷済みパッケージのメタデータ欠落のみを許容する: 省略された private QA inventory エントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャにないパッチファイル、永続化された `update.channel` の欠落、レガシー Plugin install-record の場所、marketplace install-record 永続化の欠落、および `plugins update` 中の設定メタデータ移行。`2026.4.25` より後のパッケージでは、これらのパスは厳格な失敗となる。
- コンテナー smoke ランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1 つ以上の実コンテナーを起動し、より上位の統合パスを検証する。

live モデル Docker ランナーは、必要な CLI 認証ホームのみ（または実行が絞り込まれていない場合はサポートされているすべてのもの）も bind mount し、実行前にそれらをコンテナーのホームへコピーする。これにより、外部 CLI OAuth はホストの認証ストアを変更せずにトークンを更新できる:

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind` (スクリプト: `scripts/test-live-acp-bind-docker.sh`; デフォルトで Claude、Codex、Gemini を対象にし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` によって厳密な Droid/OpenCode カバレッジを提供)
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend` (スクリプト: `scripts/test-live-cli-backend-docker.sh`)
- Codex アプリサーバーハーネススモーク: `pnpm test:docker:live-codex-harness` (スクリプト: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- Observability スモーク: `pnpm qa:otel:smoke` はプライベートな QA ソースチェックアウトレーンです。npm tarball では QA Lab が省略されるため、意図的にパッケージ Docker リリースレーンには含めていません。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui` (スクリプト: `scripts/e2e/openwebui-docker.sh`)
- オンボーディング ウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- npm tarball のオンボーディング/チャンネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` はパック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、env-ref オンボーディング経由で OpenAI を設定し、デフォルトで Telegram も設定し、doctor を実行して、モックされた OpenAI エージェントのターンを 1 回実行します。ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホストでの再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を使い、チャンネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使います。
- Skill インストールスモーク: `pnpm test:docker:skill-install` はパック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、設定でアップロード済みアーカイブのインストールを無効化し、検索から現在のライブ ClawHub Skill スラッグを解決し、`openclaw skills install` でインストールし、インストール済み Skill と `.clawhub` の origin/lock メタデータを検証します。
- 更新チャンネル切り替えスモーク: `pnpm test:docker:update-channel-switch` はパック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャンネルと Plugin の更新後動作を検証し、その後パッケージ `stable` に戻して更新ステータスを確認します。
- アップグレード生存スモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャンネル設定、Plugin 許可リスト、古い Plugin 依存関係状態、既存のワークスペース/セッションファイルを含む、汚れた旧ユーザーフィクスチャの上にパック済みの OpenClaw tarball をインストールします。ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話型 doctor を実行し、その後 loopback Gateway を起動して、設定/状態の保持と起動/ステータスの予算を確認します。
- 公開済みアップグレード生存スモーク: `pnpm test:docker:published-upgrade-survivor` はデフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、焼き込み済みコマンドレシピでそのベースラインを設定し、結果の設定を検証し、その公開済みインストールを候補 tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、設定済み intent、状態保持、起動、`/healthz`、`/readyz`、RPC ステータスの予算を確認します。単一のベースラインを上書きするには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` を使い、集約スケジューラに正確なローカルベースラインを展開させるには `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` を使い、issue 形式のフィクスチャを展開するには `reported-issues` のような `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を使います。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれます。Package Acceptance はそれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` などのメタベースライントークンを解決し、Full Release Validation はリリースソークのパッケージゲートを `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストのトランスクリプト永続化と、影響を受けた重複 prompt-rewrite ブランチの doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は現在のツリーをパックし、分離されたホーム内で `bun install -g` によってインストールし、`openclaw infer image providers --json` がハングせずに同梱画像プロバイダーを返すことを検証します。ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` を使い、ビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使います。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は root、update、direct-npm の各コンテナ間で 1 つの npm キャッシュを共有します。更新スモークでは、候補 tarball にアップグレードする前の安定版ベースラインとして、デフォルトで npm `latest` を使います。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で上書きでき、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きできます。非 root インストーラーチェックは分離された npm キャッシュを維持するため、root 所有のキャッシュエントリがユーザーローカルのインストール動作を隠すことはありません。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` により、重複する direct-npm グローバル更新をスキップします。直接 `npm install -g` のカバレッジが必要な場合は、その env なしでスクリプトをローカル実行してください。
- エージェント共有ワークスペース削除 CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) はデフォルトでルート Dockerfile イメージをビルドし、分離されたコンテナホームに 1 つのワークスペースを共有する 2 つのエージェントをシードし、`agents delete --json` を実行して、有効な JSON とワークスペース保持の動作を検証します。install-smoke イメージを再利用するには `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使います。
- Gateway ネットワーキング (2 つのコンテナ、WS 認証 + ヘルス): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) はソース E2E イメージと Chromium レイヤーをビルドし、生 CDP で Chromium を起動し、`browser doctor --deep` を実行して、CDP ロールスナップショットがリンク URL、カーソルで昇格されたクリック可能要素、iframe 参照、フレームメタデータを網羅することを検証します。
- OpenAI Responses web_search 最小推論リグレッション: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) はモック OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後プロバイダースキーマの拒否を強制して、生の詳細が Gateway ログに現れることを確認します。
- MCP チャンネルブリッジ (シード済み Gateway + stdio ブリッジ + 生 Claude notification-frame スモーク): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- Pi バンドル MCP ツール (実 stdio MCP サーバー + 埋め込み Pi プロファイルの許可/拒否スモーク): `pnpm test:docker:pi-bundle-mcp-tools` (スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/サブエージェント MCP クリーンアップ (実 Gateway + 分離 Cron とワンショットサブエージェント実行後の stdio MCP 子プロセス終了処理): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (ローカルパス、`file:`、ホイストされた依存関係を持つ npm レジストリ、git moving refs、ClawHub kitchen-sink、マーケットプレイス更新、Claude バンドルの有効化/検査に対するインストール/更新スモーク): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトの kitchen-sink パッケージ/ランタイムのペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を設定します。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub フィクスチャサーバーを使います。
- Plugin 更新変更なしスモーク: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin ライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` はパック済みの OpenClaw tarball を空のコンテナにインストールし、npm Plugin をインストールし、有効化/無効化を切り替え、ローカル npm レジストリ経由でアップグレードおよびダウングレードし、インストール済みコードを削除した後、各ライフサイクルフェーズの RSS/CPU メトリクスをログしながら、アンインストールが古い状態を引き続き削除することを検証します。
- 設定リロードメタデータスモーク: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` は、ローカルパス、`file:`、ホイストされた依存関係を持つ npm レジストリ、git moving refs、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドルの有効化/検査に対するインストール/更新スモークを対象にします。`pnpm test:docker:plugin-update` はインストール済み Plugin の変更なし更新動作を対象にします。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡付き npm Plugin のインストール、有効化、無効化、アップグレード、ダウングレード、コード欠落時のアンインストールを対象にします。

共有機能イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにないときに pull します。QR とインストーラーの Docker テストは、共有のビルド済みアプリランタイムではなくパッケージ/インストール動作を検証するため、それぞれ独自の Dockerfile を維持します。

ライブモデルの Docker ランナーは、現在のチェックアウトも読み取り専用でバインドマウントし、
コンテナー内の一時作業ディレクトリにステージングします。これにより、ランタイム
イメージを軽量に保ちながら、正確なローカルソース/設定に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build` や
Gradle 出力ディレクトリなど、大きなローカル専用キャッシュとアプリのビルド出力をスキップするため、
Docker のライブ実行がマシン固有の成果物のコピーに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、Gateway のライブプローブが
コンテナー内で実際の Telegram/Discord などのチャネルワーカーを起動することはありません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンで
Gateway のライブカバレッジを絞り込む、または除外する必要がある場合は
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw Gateway コンテナーを起動し、その Gateway に対して固定バージョンの Open WebUI コンテナーを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証してから、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
ライブモデルの完了を待たずに、Open WebUI サインインとモデル検出の後で停止すべきリリース経路の CI チェックには
`OPENWEBUI_SMOKE_MODE=models` を設定してください。
初回実行では、Docker が Open WebUI イメージをプルする必要があり、Open WebUI 側でもコールドスタート設定の完了が必要な場合があるため、
目に見えて遅くなることがあります。
このレーンでは使用可能なライブモデルキーが必要で、Docker 化された実行でそれを提供する主な方法は
`OPENCLAW_PROFILE_FILE`（デフォルトは `~/.profile`）です。
成功した実行では `{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、iMessage アカウントは必要ありません。シード済み Gateway
コンテナーを起動し、`openclaw mcp serve` を生成する 2 つ目のコンテナーを起動してから、
ルーティングされた会話検出、トランスクリプト読み取り、添付ファイルメタデータ、
ライブイベントキューの動作、送信ルーティング、実際の stdio MCP ブリッジ上での Claude 風のチャネル +
権限通知を検証します。通知チェックは生の stdio MCP フレームを直接検査するため、
スモークは特定のクライアント SDK がたまたま表出するものではなく、ブリッジが実際に出力するものを検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、ライブモデルキーは必要ありません。
リポジトリの Docker イメージをビルドし、コンテナー内で実際の stdio MCP プローブサーバーを起動し、
埋め込み Pi バンドルの MCP ランタイム経由でそのサーバーを実体化し、ツールを実行してから、
`coding` と `messaging` が `bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルタすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデルキーは必要ありません。
実際の stdio MCP プローブサーバー付きのシード済み Gateway を起動し、
分離された Cron ターンと `/subagents spawn` のワンショット子ターンを実行してから、
各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP 平易文スレッドスモーク（CI ではありません）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な環境変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に読み込まれます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時設定/ワークスペースディレクトリを使用し、外部 CLI 認証マウントなしで、`OPENCLAW_PROFILE_FILE` から読み込まれた環境変数のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内でキャッシュされた CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` にコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定される必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きできます
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` で実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` でコンテナー内のプロバイダーをフィルタします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` で、再ビルドが不要な再実行に既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で、認証情報が（環境変数ではなく）プロファイルストアから来ていることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` で、Open WebUI スモーク向けに Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` で、Open WebUI スモークが使用する nonce チェックプロンプトを上書きします
- `OPENWEBUI_IMAGE=...` で、固定された Open WebUI イメージタグを上書きします

## ドキュメント健全性

ドキュメント編集後にドキュメントチェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、Mintlify の完全なアンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフラインリグレッション（CI セーフ）

これらは、実プロバイダーなしの「実パイプライン」リグレッションです:

- Gateway ツール呼び出し（モック OpenAI、実 Gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定書き込み + 認証強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性 eval（Skills）

「エージェント信頼性 eval」のように振る舞う CI セーフなテストが、すでにいくつかあります:

- 実 Gateway + エージェントループ経由のモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **意思決定:** プロンプトに Skills が一覧表示されたとき、エージェントは正しい skill を選択する（または無関係なものを避ける）か?
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか?
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界をアサートするマルチターンシナリオ。

将来の eval は、まず決定的であることを優先すべきです:

- モックプロバイダーを使用してツール呼び出し + 順序、skill ファイル読み取り、セッション配線をアサートするシナリオランナー。
- skill に焦点を当てた小さなシナリオ群（使用と回避、ゲーティング、プロンプトインジェクション）。
- CI セーフなスイートが整った後にのみ、任意のライブ eval（オプトイン、環境変数でゲート）。

## 契約テスト（Plugin とチャネルの形状）

契約テストは、登録されたすべての Plugin とチャネルが
そのインターフェース契約に準拠していることを検証します。検出されたすべての Plugin を反復処理し、
形状と動作のアサーション群を実行します。デフォルトの `pnpm test` ユニットレーンは、
これらの共有シームとスモークファイルを意図的にスキップします。共有チャネルまたはプロバイダーの面に触れる場合は、
契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な Plugin 形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディング動作
- **outbound-payload** - メッセージペイロード構造
- **inbound** - 受信メッセージ処理
- **actions** - チャネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/ロスター API
- **group-policy** - グループポリシー適用

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャネルステータスプローブ
- **registry** - Plugin レジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証の選択/選定
- **catalog** - モデルカタログ API
- **discovery** - Plugin 検出
- **loader** - Plugin 読み込み
- **runtime** - プロバイダーランタイム
- **shape** - Plugin 形状/インターフェース
- **wizard** - セットアップウィザード

### 実行タイミング

- plugin-sdk のエクスポートまたはサブパスを変更した後
- チャネルまたはプロバイダー Plugin を追加または変更した後
- Plugin 登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは必要ありません。

## リグレッションの追加（ガイダンス）

ライブで検出されたプロバイダー/モデル問題を修正する場合:

- 可能であれば CI セーフなリグレッションを追加します（モック/スタブプロバイダー、または正確なリクエスト形状変換のキャプチャ）
- 本質的にライブのみの場合（レート制限、認証ポリシー）は、ライブテストを狭く保ち、環境変数によるオプトインにします
- バグを捕捉する最小のレイヤーをターゲットにすることを優先します:
  - プロバイダーリクエスト変換/リプレイのバグ → 直接のモデルテスト
  - Gateway セッション/履歴/ツールパイプラインのバグ → Gateway ライブスモークまたは CI セーフな Gateway モックテスト
- SecretRef トラバーサルガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとにサンプルターゲットを 1 つ導出し、トラバーサルセグメントの exec id が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef ターゲットファミリーを追加する場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは未分類のターゲット ID で意図的に失敗するため、新しいクラスを静かにスキップできません。

## 関連

- [ライブテスト](/ja-JP/help/testing-live)
- [更新とPluginのテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
