---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway + エージェントの挙動のデバッグ
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-05-05T01:47:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、小規模な Docker ランナー群があります。このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何を対象にするか（そして意図的に何を対象にしないか）。
- 一般的なワークフロー（ローカル、push 前、デバッグ）で実行するコマンド。
- live テストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実世界のモデル/プロバイダー問題に対する回帰テストを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、live transport lanes）**は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) — `pnpm openclaw qa matrix` のリファレンス。
- [QA channel](/ja-JP/channels/qa-channel) — リポジトリに基づくシナリオで使用される合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行について説明します。下の QA 専用ランナーセクション（[QA 専用ランナー](#qa-specific-runners)）では、具体的な `qa` 呼び出しを列挙し、上記のリファレンスへ戻る導線を示します。
</Note>

## クイックスタート

普段は次を使います。

- フルゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は、extension/channel パスにもルーティングされるようになっています: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗に対して反復作業している場合は、まず対象を絞った実行を優先します。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れた場合、または追加の確信がほしい場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）:

- live スイート（モデル + Gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つの live ファイルを静かに対象化: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイムパフォーマンスレポート: 実際の `openai/gpt-5.4` agent turn には
  `live_gpt54=true`、Kova の CPU/heap/trace アーティファクトには
  `deep_profile=true` を付けて `OpenClaw Performance` を dispatch します。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、日次のスケジュール実行は mock-provider、deep-profile、GPT 5.4 lane のアーティファクトを
  `openclaw/clawgrit-reports` に公開します。mock-provider レポートには、ソースレベルの Gateway 起動、メモリ、Plugin 圧力、繰り返しの fake-model hello-loop、CLI 起動の数値も含まれます。
- Docker live model sweep: `pnpm test:docker:live-models`
  - 選択された各モデルは、text turn に加えて小さなファイル読み取り風プローブを実行します。
    メタデータが `image` 入力を示すモデルは、小さな画像 turn も実行します。
    プロバイダーの失敗を切り分ける場合は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効にします。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` はどちらも、`include_live_suites: true` を指定して再利用可能な live/E2E workflow を呼び出します。これにはプロバイダー別に shard された個別の Docker live model matrix job が含まれます。
  - 集中的な CI 再実行には、`include_live_suites: true` と `live_models_only: true` を指定して
    `OpenClaw Live And E2E Checks (Reusable)` を dispatch します。
  - 高シグナルな新しいプロバイダー secret は、`scripts/ci-hydrate-live-auth.sh` と
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`、およびそのスケジュール/リリース呼び出し元に追加します。
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live lane を実行し、`/codex bind` で合成
    Slack DM を bind し、`/codex fast` と
    `/codex permissions` を実行してから、通常の返信と画像添付が ACP ではなく native Plugin binding 経由でルーティングされることを検証します。
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Plugin 所有の Codex app-server harness 経由で Gateway agent turn を実行し、
    `/codex status` と `/codex models` を検証します。デフォルトでは画像、
    cron MCP、sub-agent、Guardian プローブも実行します。他の Codex app-server の失敗を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` で sub-agent プローブを無効にします。sub-agent の集中的なチェックでは、他のプローブを無効にします:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、これは sub-agent プローブの後に終了します。
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel の救援コマンドサーフェスに対する opt-in の念押しチェックです。
    `/crestodian status` を実行し、永続的なモデル変更をキューに入れ、
    `/crestodian yes` に返信し、audit/config 書き込みパスを検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - config なしのコンテナ内で、`PATH` 上の fake Claude CLI とともに Crestodian を実行し、fuzzy planner fallback が監査済みの型付き config 書き込みに変換されることを検証します。
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、bare `openclaw` を
    Crestodian にルーティングし、setup/model/agent/Discord Plugin + SecretRef 書き込みを適用し、config を検証し、audit entry を確認します。同じ Ring 0 setup パスは QA Lab でも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によりカバーされています。
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` を設定した状態で
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSON が Moonshot/K2.6 を報告し、assistant transcript が正規化された `usage.cost` を保存することを検証します。

<Tip>
失敗ケースが 1 つだけ必要な場合は、下記の allowlist env vars で live テストを絞り込むことを優先してください。
</Tip>

## QA 専用ランナー

QA-lab の実環境感が必要な場合、これらのコマンドはメインのテストスイートの横にあります。

CI は専用 workflow で QA Lab を実行します。Agentic parity はスタンドアロンの PR workflow ではなく、
`QA-Lab - All Lanes` とリリース検証の下にネストされています。
広範な検証では、`rerun_group=qa-parity` または release-checks QA group を指定した `Full Release Validation` を使用します。stable/default release checks では、網羅的な live/Docker soak は `run_release_soak=true` の背後に維持されます。`full` profile では soak が強制的に有効になります。`QA-Lab - All Lanes` は `main` で nightly に実行され、手動 dispatch からは mock parity lane、live Matrix lane、Convex 管理の live Telegram lane、Convex 管理の live Discord lane が並列 job として実行されます。Scheduled QA と release checks は Matrix に
`--profile fast` を明示的に渡しますが、Matrix CLI と手動 workflow input のデフォルトは `all` のままです。手動 dispatch では、`all` を `transport`、
`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` job に shard できます。`OpenClaw Release
Checks` は、リリース承認前に parity と fast Matrix および Telegram lanes を実行します。release transport checks には `mock-openai/gpt-5.5` を使用するため、決定的になり、通常の provider-plugin 起動を避けられます。これらの live transport
gateways はメモリ検索を無効にしています。メモリ挙動は QA parity
suites で引き続きカバーされます。

フルリリースの live media shard は
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。これにはすでに
`ffmpeg` と `ffprobe` が含まれています。Docker live model/backend shard は、選択された commit ごとに一度だけビルドされる共有
`ghcr.io/openclaw/openclaw-live-test:<sha>` image を使用し、各 shard 内で再ビルドする代わりに
`OPENCLAW_SKIP_DOCKER_BUILD=1` で pull します。

- `pnpm openclaw qa suite`
  - リポジトリに基づく QA シナリオをホスト上で直接実行します。
  - デフォルトでは、選択された複数のシナリオを、分離された
    Gateway ワーカーで並列実行します。`qa-channel` のデフォルト同時実行数は 4 です（選択されたシナリオ数で上限が決まります）。ワーカー数を調整するには `--concurrency <count>` を使用し、以前の直列レーンには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると、ゼロ以外で終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - provider モード `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、シナリオ対応の `mock-openai` レーンを置き換えずに、実験的なフィクスチャとプロトコルモックのカバレッジ用に、ローカルの AIMock ベース provider サーバーを起動します。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab 経由でライブ OpenAI Kitchen Sink Plugin ガントレットを実行します。外部 Kitchen Sink パッケージをインストールし、Plugin SDK サーフェスのインベントリを検証し、`/healthz` と `/readyz` をプローブし、Gateway CPU/RSS の証拠を記録し、ライブ OpenAI ターンを実行して、敵対的診断をチェックします。
    `OPENAI_API_KEY` などのライブ OpenAI 認証が必要です。ハイドレート済みの Testbox セッションでは、`openclaw-testbox-env` ヘルパーが存在する場合、Testbox ライブ認証プロファイルを自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチに加えて、小さなモック QA Lab シナリオパック
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) を実行し、結合された CPU 観測サマリーを
    `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは継続的な高 CPU 観測のみをフラグします（`--cpu-core-warn`
    と `--hot-wall-warn-ms`）。そのため、短い起動時バーストは、数分間続く Gateway 固定回帰のように見せず、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使用します。チェックアウトに新しいランタイム出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じ provider/モデル選択フラグを再利用します。
  - ライブ実行では、ゲストで実用的なサポート対象 QA 認証入力を転送します:
    env ベースの provider キー、QA ライブ provider 設定パス、および存在する場合の `CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるように、リポジトリルート配下に留める必要があります。
  - 通常の QA レポートとサマリーに加えて、Multipass ログを
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業用に、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内にグローバルインストールし、非対話型の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、パッケージ化された Plugin ランタイムが起動時の依存関係修復なしで読み込まれることを検証し、doctor を実行して、モックされた OpenAI エンドポイントに対してローカルエージェントターンを 1 回実行します。
  - 同じパッケージ化インストールレーンを Discord で実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキスト transcript 用の決定的なビルド済みアプリ Docker smoke を実行します。非表示の OpenClaw ランタイムコンテキストが、表示されるユーザーターンへ漏れず、非表示のカスタムメッセージとして永続化されることを検証します。その後、影響を受ける壊れたセッション JSONL を投入し、`openclaw doctor --fix` がバックアップ付きでアクティブブランチへ書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内に OpenClaw パッケージ候補をインストールし、インストール済みパッケージのオンボーディングを実行し、インストール済み CLI 経由で Telegram を設定し、そのインストール済みパッケージを SUT Gateway としてライブ Telegram QA レーンで再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。レジストリからインストールする代わりに解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使用します。CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて `OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定します。CI に `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットが存在する場合、Docker ラッパーは Convex を自動選択します。
  - ラッパーは、Docker のビルド/インストール作業前に、ホスト上の Telegram または Convex 認証情報 env を検証します。事前認証情報セットアップを意図的にデバッグする場合にのみ、`OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンだけに対して共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions は、このレーンを手動メンテナーワークフロー
    `NPM Telegram Beta E2E` として公開します。マージ時には実行されません。このワークフローは
    `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- GitHub Actions は、1 つの候補パッケージに対するサイドラン製品証明として `Package Acceptance` も公開します。信頼済み ref、公開済み npm spec、SHA-256 付き HTTPS tarball URL、または別の実行からの tarball アーティファクトを受け取り、正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、その後、smoke、package、product、full、または custom のレーンプロファイルで既存の Docker E2E スケジューラーを実行します。同じ `package-under-test` アーティファクトに対して Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta 製品証明:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL 証明にはダイジェストが必要です:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- アーティファクト証明は、別の Actions 実行から tarball アーティファクトをダウンロードします:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI を設定した Gateway を起動し、その後、設定編集によって同梱チャネル/Plugin を有効化します。
  - セットアップ検出によって未設定のダウンロード可能 Plugin が存在しないままになること、最初に設定された doctor 修復が不足している各ダウンロード可能 Plugin を明示的にインストールすること、2 回目の再起動では隠れた依存関係修復が実行されないことを検証します。
  - 既知の古い npm ベースラインもインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補の更新後 doctor が、ハーネス側の postinstall 修復なしでレガシー Plugin 依存関係の残骸を消去することを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージ化インストール更新 smoke を実行します。選択された各プラットフォームは、まず要求されたベースラインパッケージをインストールし、その後、同じゲスト内でインストール済みの `openclaw update` コマンドを実行し、インストール済みバージョン、更新ステータス、Gateway readiness、およびローカルエージェントターン 1 回を検証します。
  - 1 つのゲストで反復作業する場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使用します。サマリーアーティファクトパスとレーンごとのステータスには `--json` を使用します。
  - OpenAI レーンは、デフォルトでライブエージェントターン証明に `openai/gpt-5.5` を使用します。別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels トランスポートの停止が残りのテスト時間を消費しないように、長いローカル実行はホスト timeout でラップします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトは、ネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。
    外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認してください。
  - Windows 更新では、コールドゲスト上の更新後 doctor とパッケージ更新作業に 10 分から 15 分かかることがあります。ネストされた npm デバッグログが進んでいれば、これは健全な状態です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux smoke レーンと並列実行しないでください。これらは VM 状態を共有しており、スナップショット復元、パッケージ配信、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後の証明では、通常の同梱 Plugin サーフェスを実行します。これは、エージェントターン自体が単純なテキスト応答だけをチェックする場合でも、speech、image generation、media understanding などの capability facade が同梱ランタイム API 経由で読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接のプロトコル smoke テスト用に、ローカル AIMock provider サーバーだけを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel homeserver に対して Matrix ライブ QA レーンを実行します。ソースチェックアウト専用です。パッケージ化インストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、env vars、アーティファクトレイアウト: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - env のドライバーおよび SUT bot トークンを使用して、実際のプライベートグループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報用に `--credential-source convex` をサポートします。デフォルトでは env モードを使用し、プールされたリースを使用するには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - いずれかのシナリオが失敗すると、ゼロ以外で終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じプライベートグループ内に、SUT bot が Telegram username を公開している 2 つの異なる bot が必要です。
  - bot 間の安定した観測のために、両方の bot で `@BotFather` の Bot-to-Bot Communication Mode を有効化し、ドライバー bot がグループ内 bot トラフィックを観測できるようにしてください。
  - Telegram QA レポート、サマリー、および observed-messages アーティファクトを `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、ドライバー送信リクエストから観測された SUT 返信までの RTT が含まれます。

ライブトランスポートレーンは、新しいトランスポートがずれないように、1 つの標準契約を共有します。レーンごとのカバレッジマトリクスは [QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、そのマトリクスには含まれません。

### Convex 経由の共有 Telegram 認証情報 (v1)

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA lab は Convex ベースのプールから排他的リースを取得し、レーンの実行中はそのリースに Heartbeat を送信し、シャットダウン時にリースを解放します。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用のシークレット 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - env デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトで `ci`、それ以外では `maintainer`）

任意の env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意の trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

`OPENCLAW_QA_CONVEX_SITE_URL` は通常運用では `https://` を使用する必要があります。

メンテナーの管理コマンド (pool add/remove/list) には、特に
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

live 実行の前に `doctor` を使用して、Convex サイト URL、ブローカーシークレット、
エンドポイントプレフィックス、HTTP タイムアウト、admin/list の到達性を、
シークレット値を出力せずに確認します。スクリプトや CI
ユーティリティで機械可読の出力が必要な場合は `--json` を使用します。

デフォルトのエンドポイントコントラクト (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/再試行可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功: `{ status: "ok" }` (または空の `2xx`)
- `POST /release`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功: `{ status: "ok" }` (または空の `2xx`)
- `POST /admin/add` (メンテナーシークレットのみ)
  - リクエスト: `{ kind, actorId, payload, note?, status? }`
  - 成功: `{ status: "ok", credential }`
- `POST /admin/remove` (メンテナーシークレットのみ)
  - リクエスト: `{ credentialId, actorId }`
  - 成功: `{ status: "ok", changed, credential }`
  - アクティブなリースガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (メンテナーシークレットのみ)
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram 種別のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正な形式のペイロードを拒否します。

### QA にチャンネルを追加する

新しいチャンネルアダプターのアーキテクチャとシナリオヘルパー名は、[QA 概要 → チャンネルを追加する](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低条件: 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成します。

## テストスイート (どこで何が実行されるか)

スイートは「現実性が高まる」(そして不安定さ/コストも高まる) ものとして考えてください:

### ユニット / 統合 (デフォルト)

- コマンド: `pnpm test`
- 設定: ターゲット指定なしの実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定へ展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下のコア/ユニットインベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- スコープ:
  - 純粋なユニットテスト
  - プロセス内統合テスト (gateway 認証、ルーティング、ツール、解析、設定)
  - 既知のバグに対する決定的な回帰テスト
- 期待値:
  - CI で実行されます
  - 実際のキーは不要です
  - 高速で安定しているべきです
  - リゾルバーと公開サーフェスローダーのテストは、実際の同梱 Plugin ソース API ではなく、
    生成された小さな Plugin フィクスチャを使って、広範な `api.js` と
    `runtime-api.js` のフォールバック動作を証明する必要があります。実際の Plugin API 読み込みは、
    Plugin 所有のコントラクト/統合スイートに属します。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ付きレーン">

    - ターゲット指定なしの `pnpm test` は、巨大な単一のネイティブルートプロジェクトプロセスではなく、12 個のより小さなシャード設定 (`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`) を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/extension 作業が無関係なスイートを枯渇させるのを避けられます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。マルチシャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付きレーンへ展開します: 直接のテスト編集、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカルインポートグラフの依存先です。設定/setup/package の編集では、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用しない限り、テストを広範囲に実行しません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョンバンプでは、ターゲットを絞った version/config/root-dependency チェックを実行し、トップレベルの version フィールド以外の package 変更を拒否するガードがあります。
    - live Docker ACP ハーネスの編集では、焦点を絞ったチェックを実行します: live Docker 認証スクリプトのシェル構文と、live Docker スケジューラーの dry-run です。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定される場合にのみ含まれます。依存関係、export、version、その他の package サーフェス編集は引き続きより広範なガードを使用します。
    - agents、commands、plugins、auto-reply ヘルパー、`plugin-sdk`、および類似の純粋なユーティリティ領域からの import-light なユニットテストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンにルーティングされます。ステートフル/ランタイムが重いファイルは既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` のヘルパーソースファイルも、changed-mode の実行をこれらの軽量レーン内の明示的な兄弟テストにマッピングするため、ヘルパー編集ではそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルのコアヘルパー、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割するため、import が重い 1 つのバケットが Node テール全体を占有しません。
    - 通常の PR/main CI は、extension バッチスイープとリリース専用の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補に対して、これらの Plugin/extension が重いスイート用の別個の `Plugin Prerelease` 子ワークフローをディスパッチします。

  </Accordion>

  <Accordion title="組み込みランナーのカバレッジ">

    - メッセージツール探索入力または Compaction ランタイム
      コンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化境界のために、焦点を絞ったヘルパー回帰テストを追加します。
    - 組み込みランナー統合スイートを健全に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付き ID と Compaction 動作が実際の
      `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。ヘルパーのみのテストは、
      これらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest プールと分離のデフォルト">

    - ベース Vitest 設定のデフォルトは `threads` です。
    - 共有 Vitest 設定は `isolate: false` を固定し、ルートプロジェクト、e2e、live 設定全体で
      非分離ランナーを使用します。
    - ルート UI レーンは `jsdom` setup と optimizer を維持しますが、共有の非分離ランナーでも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false`
      デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 コンパイル churn を減らすために、
      デフォルトで Vitest 子 Node プロセスに `--no-maglev` を追加します。
      標準の V8 動作と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定します。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、diff がどのアーキテクチャレーンをトリガーするかを示します。
    - pre-commit フックは formatting のみです。フォーマット済みファイルを再ステージし、
      lint、typecheck、テストは実行しません。
    - ハンドオフまたは push 前にスマートローカルチェックゲートが必要な場合は、
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付きレーンを経由します。agent が
      ハーネス、設定、package、またはコントラクト編集により広範な Vitest カバレッジが本当に必要だと
      判断した場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング動作を維持し、
      ワーカー上限だけを高くします。
    - ローカルワーカーの自動スケーリングは意図的に保守的で、ホストの load average がすでに高い場合は
      後退するため、複数の同時 Vitest 実行による影響はデフォルトで抑えられます。
    - ベース Vitest 設定は、プロジェクト/設定ファイルを `forceRerunTriggers` としてマークするため、
      テスト配線が変更されたときも changed-mode の再実行は正しく保たれます。
    - 設定は対応ホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接プロファイリング用に
      明示的なキャッシュ場所を 1 つ使いたい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="パフォーマンスデバッグ">

    - `pnpm test:perf:imports` は、Vitest の import-duration レポートと
      import-breakdown 出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを
      `origin/main` 以降に変更されたファイルへスコープします。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。
      config 全体の実行では config パスをキーとして使用します。include-pattern CI
      シャードはシャード名を追加するため、フィルター済みシャードを別々に追跡できます。
    - 1 つのホットなテストがまだ時間の大半を起動時の import に費やしている場合は、
      重い依存関係を狭いローカル `*.runtime.ts` シームの背後に置き、
      runtime ヘルパーを `vi.mock(...)` に渡すためだけに deep-import するのではなく、
      そのシームを直接モックしてください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、ルーティングされた
      `test:changed` を、そのコミット済み diff に対するネイティブルートプロジェクトパスと比較し、
      wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更されたファイル一覧を
      `scripts/test-projects.mjs` とルート Vitest 設定にルーティングして、現在の
      dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite 起動と transform オーバーヘッドのための
      main-thread CPU プロファイルを書き込みます。
    - `pnpm test:perf:profile:runner` は、ファイル並列処理を無効にした unit スイート用の
      runner CPU+heap プロファイルを書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性 (gateway)

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 ワーカーに強制
- スコープ:
  - 診断をデフォルトで有効にした実際の local loopback Gateway を開始します
  - synthetic gateway メッセージ、メモリ、大きなペイロードの churn を診断イベントパスへ流します
  - Gateway WS RPC 経由で `diagnostics.stability` を問い合わせます
  - 診断安定性バンドル永続化ヘルパーをカバーします
  - recorder が境界内に保たれ、synthetic RSS サンプルが pressure budget 未満に収まり、セッションごとのキュー深度がゼロへ戻ることをアサートします
- 期待値:
  - CI セーフでキー不要
  - 安定性回帰のフォローアップ向けの狭いレーンであり、完全な Gateway スイートの代替ではありません

### E2E (gateway smoke)

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下のバンドル Plugin E2E テスト
- ランタイムのデフォルト:
  - リポジトリの他の部分と同じく、`isolate: false` で Vitest `threads` を使用します。
  - 適応型ワーカーを使用します（CI: 最大 2、ローカル: デフォルトで 1）。
  - コンソール I/O のオーバーヘッドを減らすため、デフォルトではサイレントモードで実行します。
- 便利な上書き:
  - `OPENCLAW_E2E_WORKERS=<n>` でワーカー数を強制します（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` で詳細なコンソール出力を再度有効化します。
- 範囲:
  - 複数インスタンスの Gateway のエンドツーエンド動作
  - WebSocket/HTTP サーフェス、Node ペアリング、より重いネットワーク処理
- 期待事項:
  - CI で実行されます（パイプラインで有効な場合）
  - 実際のキーは不要です
  - ユニットテストより可動部分が多いです（遅くなる場合があります）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- 範囲:
  - Docker 経由でホスト上に分離された OpenShell Gateway を起動します
  - 一時的なローカル Dockerfile からサンドボックスを作成します
  - 実際の `sandbox ssh-config` + SSH 実行を通じて OpenClaw の OpenShell バックエンドを実行します
  - サンドボックス fs ブリッジを通じて、リモート正規のファイルシステム動作を検証します
- 期待事項:
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLI と、動作する Docker デーモンが必要です
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト Gateway とサンドボックスを破棄します
- 便利な上書き:
  - `OPENCLAW_E2E_OPENSHELL=1` で、より広い e2e スイートを手動実行するときにテストを有効化します
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` で、デフォルト以外の CLI バイナリまたはラッパースクリプトを指定します

### ライブ（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル Plugin ライブテスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- 範囲:
  - 「このプロバイダー/モデルは、実際の認証情報で _今日_ 本当に動作するか？」
  - プロバイダーの形式変更、ツール呼び出しの癖、認証の問題、レート制限の動作を検出します
- 期待事項:
  - 設計上、CI で安定するものではありません（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - 費用が発生する / レート制限を消費します
  - 「すべて」ではなく、絞り込んだサブセットの実行を推奨します
- ライブ実行では、不足している API キーを取得するために `~/.profile` を読み込みます。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定/認証素材を一時的なテストホームへコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更することはありません。
- ライブテストで実際のホームディレクトリを使う必要があると意図している場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードをデフォルトにしています。`[live] ...` の進行状況出力は維持しますが、追加の `~/.profile` 通知を抑制し、Gateway ブートストラップログ/Bonjour の雑音をミュートします。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーローテーション（プロバイダー固有）: カンマ/セミコロン形式の `*_API_KEYS` または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、`OPENCLAW_LIVE_*_KEY` でライブごとの上書きを指定します。テストはレート制限レスポンス時に再試行します。
- 進行状況/Heartbeat 出力:
  - ライブスイートは stderr に進行状況行を出力するようになったため、Vitest のコンソールキャプチャが静かな場合でも、時間のかかるプロバイダー呼び出しが動作中であることを視認できます。
  - `vitest.live.config.ts` は Vitest のコンソール割り込みを無効化するため、ライブ実行中にプロバイダー/Gateway の進行状況行が即座にストリームされます。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

この判断表を使用してください:

- ロジック/テストを編集している: `pnpm test` を実行します（多く変更した場合は `pnpm test:coverage` も実行）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れている: `pnpm test:e2e` を追加します
- 「ボットが落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグしている: 絞り込んだ `pnpm test:live` を実行します

## ライブ（ネットワークに触れる）テスト

ライブモデルマトリクス、CLI バックエンドスモーク、ACP スモーク、Codex app-server
ハーネス、およびすべてのメディアプロバイダーライブテスト（Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス）、さらにライブ実行の認証情報処理については、
[ライブスイートのテスト](/ja-JP/help/testing-live) を参照してください。専用の更新および
Plugin 検証チェックリストについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つのバケットに分かれます:

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で対応するプロファイルキーのライブファイルのみを実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。ローカル設定ディレクトリとワークスペースをマウントします（マウントされている場合は `~/.profile` も読み込みます）。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker ライブランナーは、完全な Docker スイープを実用的に保つため、デフォルトで小さめのスモーク上限を使用します:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12` を使用し、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を使用します。より大きな網羅的スキャンを明示的に行いたい場合は、これらの env var を上書きしてください。
- `test:docker:all` は `test:docker:live-build` 経由でライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックし、その後 2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用します。ベア画像は install/update/plugin-dependency レーン用の Node/Git ランナーにすぎません。これらのレーンは事前ビルド済み tarball をマウントします。機能画像は、ビルド済みアプリ機能レーンのために同じ tarball を `/app` にインストールします。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行します。集約は重み付きローカルスケジューラを使用します。`OPENCLAW_DOCKER_ALL_PARALLELISM` がプロセススロットを制御し、リソース上限により重いライブ、npm-install、複数サービスのレーンが一斉に開始されないようにします。単一レーンがアクティブな上限より重い場合でも、プールが空ならスケジューラはそれを開始でき、その後容量が再び利用可能になるまで単独で実行し続けます。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、および `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。Docker ホストにさらに余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整してください。ランナーはデフォルトで Docker プリフライトを実行し、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、後続の実行ではそれらのタイミングを使用して長いレーンを先に開始します。ビルドや Docker 実行なしで重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、パッケージ/イメージ要件、認証情報の CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用してください。
- `Package Acceptance` は、「このインストール可能な tarball はプロダクトとして動作するか？」を検証する GitHub ネイティブのパッケージゲートです。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードしてから、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。プロファイルは範囲の広さ順に並びます: `smoke`、`package`、`product`、`full`。パッケージ/更新/Plugin 契約、公開済みアップグレード生存マトリクス、リリースデフォルト、失敗トリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。
- ビルドおよびリリースチェックは、tsdown 後に `scripts/check-cli-bootstrap-imports.mjs` を実行します。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的なビルド済みグラフをたどり、コマンドディスパッチ前のプリディスパッチ起動処理で Commander、プロンプト UI、undici、ロギングなどのパッケージ依存関係をインポートしている場合に失敗します。また、バンドルされた Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否します。パッケージ化された CLI スモークは、ルートヘルプ、オンボードヘルプ、doctor ヘルプ、status、config schema、model-list コマンドもカバーします。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限されています。その期限までは、ハーネスは出荷済みパッケージのメタデータ不足のみを許容します。省略された private QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落したパッチファイル、永続化されていない `update.channel`、レガシー Plugin インストール記録場所、欠落した marketplace インストール記録永続化、および `plugins update` 中の config メタデータ移行です。`2026.4.25` より後のパッケージでは、これらのパスは厳格な失敗になります。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1 つ以上の実コンテナを起動し、より高レベルの統合パスを検証します。

ライブモデル Docker ランナーは、必要な CLI 認証ホームのみ（または実行が絞り込まれていない場合はサポートされているすべて）もバインドマウントし、その後実行前にコンテナホームへコピーするため、外部 CLI OAuth はホストの認証ストアを変更せずにトークンを更新できます:

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind` (スクリプト: `scripts/test-live-acp-bind-docker.sh`; デフォルトで Claude、Codex、Gemini を対象にし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` による厳密な Droid/OpenCode カバレッジも含む)
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend` (スクリプト: `scripts/test-live-cli-backend-docker.sh`)
- Codex アプリサーバーハーネススモーク: `pnpm test:docker:live-codex-harness` (スクリプト: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- オブザーバビリティスモーク: `pnpm qa:otel:smoke` は非公開 QA ソースチェックアウトレーンです。npm tarball は QA Lab を省略するため、意図的にパッケージ Docker リリースレーンには含めていません。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui` (スクリプト: `scripts/e2e/openwebui-docker.sh`)
- オンボーディングウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- Npm tarball のオンボーディング/チャネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、env-ref オンボーディング経由の OpenAI とデフォルトの Telegram を構成し、doctor を実行して、モックされた OpenAI エージェントターンを 1 回実行します。ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホスト側の再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を使い、チャネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使います。
- 更新チャネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャネルと Plugin の更新後動作を検証した後、パッケージ `stable` に戻して更新状態を確認します。
- アップグレードサバイバースモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャネル設定、Plugin allowlist、古い Plugin 依存関係状態、既存のワークスペース/セッションファイルを含む、汚れた古いユーザーフィクスチャの上にパック済みの OpenClaw tarball をインストールします。ライブプロバイダーやチャネルキーなしで、パッケージ更新と非対話 doctor を実行した後、loopback Gateway を起動し、設定/状態の保持と起動/状態予算を確認します。
- 公開済みアップグレードサバイバースモーク: `pnpm test:docker:published-upgrade-survivor` は、デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、焼き込み済みコマンドレシピでそのベースラインを構成し、生成された設定を検証し、その公開済みインストールを候補 tarball に更新し、非対話 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、構成済み intent、状態保持、起動、`/healthz`、`/readyz`、RPC 状態予算を確認します。1 つのベースラインを上書きするには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` を使い、集約スケジューラーに正確なベースラインを展開させるには `all-since-2026.4.23` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` を使い、課題形状のフィクスチャを展開するには `reported-issues` のような `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を使います。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれます。Package Acceptance では、これらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開します。Full Release Validation は、ブロッキングパスではデフォルトの latest ベースラインを使い、`run_release_soak=true` または `release_profile=full` の場合にのみ all-since/reported-issues に展開します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストのトランスクリプト永続化と、影響を受けた重複プロンプト書き換えブランチの doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は現在のツリーをパックし、隔離されたホームで `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み画像プロバイダーを返すことを検証します。ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` を使い、ビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使います。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各コンテナ間で 1 つの npm キャッシュを共有します。更新スモークは、候補 tarball へアップグレードする前の stable ベースラインとして、デフォルトで npm `latest` を使います。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で上書きし、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きします。非 root インストーラーチェックは、root 所有のキャッシュエントリがユーザーローカルのインストール挙動を隠さないように、隔離された npm キャッシュを維持します。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は、重複する direct-npm グローバル更新を `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` でスキップします。直接の `npm install -g` カバレッジが必要な場合は、その env なしでスクリプトをローカル実行します。
- エージェント削除共有ワークスペース CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) はデフォルトでルート Dockerfile イメージをビルドし、隔離されたコンテナホームに 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行して、有効な JSON とワークスペース保持動作を検証します。install-smoke イメージを再利用するには `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使います。
- Gateway ネットワーク (2 コンテナ、WS 認証 + ヘルス): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- ブラウザー CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) はソース E2E イメージと Chromium レイヤーをビルドし、生の CDP で Chromium を起動し、`browser doctor --deep` を実行して、CDP ロールスナップショットがリンク URL、カーソル昇格クリック可能要素、iframe 参照、フレームメタデータを網羅することを検証します。
- OpenAI Responses web_search 最小 reasoning 回帰: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) は、モック OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証した後、プロバイダースキーマの拒否を強制し、生の詳細が Gateway ログに現れることを確認します。
- MCP チャネルブリッジ (シード済み Gateway + stdio ブリッジ + 生の Claude 通知フレームスモーク): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- Pi バンドル MCP ツール (実際の stdio MCP サーバー + 埋め込み Pi プロファイル allow/deny スモーク): `pnpm test:docker:pi-bundle-mcp-tools` (スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/サブエージェント MCP クリーンアップ (実際の Gateway + 隔離 cron と 1 回限りのサブエージェント実行後の stdio MCP 子プロセス終了): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (ローカルパス、`file:`、hoist された依存関係を持つ npm レジストリ、git moving refs、ClawHub kitchen-sink、marketplace 更新、Claude-bundle の有効化/検査のインストール/更新スモーク): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトの kitchen-sink パッケージ/ランタイムペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を使います。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub フィクスチャサーバーを使います。
- Plugin 更新未変更スモーク: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin ライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、パック済みの OpenClaw tarball を空のコンテナにインストールし、npm Plugin をインストールし、有効化/無効化を切り替え、ローカル npm レジストリ経由でアップグレードとダウングレードを行い、インストール済みコードを削除した後、各ライフサイクルフェーズの RSS/CPU メトリクスをログに記録しつつ、アンインストールが古い状態を引き続き削除することを検証します。
- 設定リロードメタデータスモーク: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` は、ローカルパス、`file:`、hoist された依存関係を持つ npm レジストリ、git moving refs、ClawHub フィクスチャ、marketplace 更新、Claude-bundle の有効化/検査のインストール/更新スモークを対象にします。`pnpm test:docker:plugin-update` は、インストール済み Plugin の未変更更新動作を対象にします。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡付きの npm Plugin インストール、有効化、無効化、アップグレード、ダウングレード、コード欠落時のアンインストールを対象にします。

共有機能イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指す場合、スクリプトはそれがローカルにまだ存在しなければ pull します。QR とインストーラーの Docker テストは、共有ビルド済みアプリランタイムではなく、パッケージ/インストール動作を検証するため、それぞれ独自の Dockerfile を維持します。

ライブモデルの Docker ランナーは、現在のチェックアウトも読み取り専用でバインドマウントし、
コンテナ内の一時作業ディレクトリにステージングします。これにより、ランタイム
イメージをスリムに保ちながら、正確なローカルソース/設定に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build`、Gradle 出力ディレクトリなどの大きなローカル専用キャッシュやアプリのビルド出力をスキップするため、Docker ライブ実行がマシン固有のアーティファクトのコピーに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、Gateway のライブプローブはコンテナ内で実際の Telegram/Discord などのチャネルワーカーを起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンから Gateway のライブカバレッジを絞り込む、または除外する必要がある場合は、`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルな互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした OpenClaw Gateway コンテナを起動し、その Gateway に向けて固定バージョンの Open WebUI コンテナを起動し、Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証してから、Open WebUI の `/api/chat/completions` プロキシを通じて実際のチャットリクエストを送信します。
初回実行は、Docker が Open WebUI イメージを pull する必要があったり、Open WebUI が自身のコールドスタート設定を完了する必要があったりするため、目に見えて遅くなることがあります。
このレーンでは利用可能なライブモデルキーが必要であり、Docker 化された実行でそれを提供する主な方法は `OPENCLAW_PROFILE_FILE`（デフォルトは `~/.profile`）です。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の Telegram、Discord、iMessage アカウントは不要です。シード済みの Gateway コンテナを起動し、`openclaw mcp serve` を spawn する 2 つ目のコンテナを起動してから、実際の stdio MCP ブリッジ上で、ルーティングされた会話の検出、トランスクリプト読み取り、添付ファイルメタデータ、ライブイベントキューの動作、アウトバウンド送信ルーティング、Claude 形式のチャネル + 権限通知を検証します。通知チェックは、生の stdio MCP フレームを直接検査するため、このスモークは特定のクライアント SDK がたまたま表面化する内容だけでなく、ブリッジが実際に発行する内容を検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、ライブモデルキーは不要です。リポジトリの Docker イメージをビルドし、コンテナ内で実際の stdio MCP プローブサーバーを起動し、埋め込み Pi バンドル MCP ランタイムを通じてそのサーバーを具現化し、ツールを実行してから、`coding` と `messaging` が `bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルタリングすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデルキーは不要です。実際の stdio MCP プローブサーバーを備えたシード済み Gateway を起動し、分離された cron ターンと `/subagents spawn` の 1 回限りの子ターンを実行してから、各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP 平易言語スレッドスモーク（CI ではありません）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な env vars:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な設定/ワークスペースディレクトリを使用し、外部 CLI 認証マウントなしで、`OPENCLAW_PROFILE_FILE` から source された env vars のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` にコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込まれた provider 実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定された必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマリストで手動上書きします
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` は実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` はコンテナ内の provider をフィルタリングします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報が（env ではなく）プロファイルストアから来ていることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI スモーク用に Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI スモークで使用される nonce チェックプロンプトを上書きします
- `OPENWEBUI_IMAGE=...` は、固定された Open WebUI イメージタグを上書きします

## Docs の健全性

ドキュメント編集後に docs チェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全な Mintlify アンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフラインリグレッション（CI セーフ）

これらは実際の provider を使わない「実パイプライン」リグレッションです:

- Gateway ツール呼び出し（モック OpenAI、実際の Gateway + agent loop）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定を書き込み + auth enforced）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性 evals（skills）

「エージェント信頼性 evals」のように振る舞う CI セーフなテストは、すでにいくつかあります:

- 実際の Gateway + agent loop を通じたモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills でまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **判定:** Skills がプロンプトに列挙されているとき、エージェントは適切な skill を選ぶ（または無関係なものを避ける）か？
- **遵守:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか？
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、sandbox 境界をアサートする複数ターンのシナリオ。

将来の evals は、まず決定的であるべきです:

- mock provider を使用して、ツール呼び出し + 順序、skill ファイル読み取り、セッション配線をアサートするシナリオランナー。
- skill に焦点を当てた小さなシナリオスイート（使用 vs 回避、ゲーティング、プロンプトインジェクション）。
- CI セーフなスイートが整った後の、任意のライブ evals（opt-in、env-gated）のみ。

## 契約テスト（plugin とチャネル形状）

契約テストは、登録されているすべての Plugin とチャネルがその
インターフェイス契約に準拠していることを検証します。検出されたすべての Plugin を反復処理し、
形状と動作のアサーションスイートを実行します。デフォルトの `pnpm test` ユニットレーンは、
これらの共有 seam とスモークファイルを意図的にスキップします。共有チャネルまたは provider サーフェスを触るときは、契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- Provider 契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な plugin 形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディング動作
- **outbound-payload** - メッセージペイロード構造
- **inbound** - インバウンドメッセージ処理
- **actions** - チャネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/roster API
- **group-policy** - グループポリシー適用

### Provider ステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャネルステータスプローブ
- **registry** - Plugin レジストリ形状

### Provider 契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証の選択/選定
- **catalog** - モデルカタログ API
- **discovery** - Plugin 検出
- **loader** - Plugin 読み込み
- **runtime** - Provider ランタイム
- **shape** - Plugin 形状/インターフェイス
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdk exports または subpaths を変更した後
- チャネルまたは provider Plugin を追加または変更した後
- Plugin 登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## リグレッションの追加（ガイダンス）

ライブで見つかった provider/モデル問題を修正するとき:

- 可能であれば CI セーフなリグレッションを追加します（mock/stub provider、または正確なリクエスト形状変換のキャプチャ）
- 本質的にライブ専用の場合（レート制限、認証ポリシー）、ライブテストは狭く保ち、env vars で opt-in にします
- バグを捕捉できる最小の層を対象にすることを優先します:
  - provider リクエスト変換/リプレイバグ → 直接の models テスト
  - Gateway セッション/履歴/ツールパイプラインバグ → Gateway ライブスモークまたは CI セーフな Gateway mock テスト
- SecretRef トラバーサルのガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとにサンプリングされたターゲットを 1 つ導出し、トラバーサルセグメント exec id が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef ターゲットファミリーを追加する場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは未分類のターゲット ID で意図的に失敗するため、新しいクラスが静かにスキップされることはありません。

## 関連

- [ライブテスト](/ja-JP/help/testing-live)
- [アップデートと Plugin のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
