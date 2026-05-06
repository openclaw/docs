---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway + エージェントの動作のデバッグ
summary: 'テストキット: 単体/e2e/ライブスイート、Docker ランナー、各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-05-06T05:08:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、小規模な Docker runner 群があります。このドキュメントは「テスト方法」のガイドです。

- 各スイートが対象にするもの（および意図的に対象にしないもの）。
- 一般的なワークフロー（local、pre-push、debugging）で実行するコマンド。
- live test が credential を検出し、model/provider を選択する方法。
- 実際の model/provider の問題に対する regression を追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、live transport lane）** は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - architecture、command surface、scenario authoring。
- [Matrix QA](/ja-JP/concepts/qa-matrix) - `pnpm openclaw qa matrix` のリファレンス。
- [QA channel](/ja-JP/channels/qa-channel) - repo-backed scenario で使われる synthetic transport Plugin。

このページでは、通常の test suite と Docker/Parallels runner の実行について扱います。下の QA-specific runners セクション（[QA-specific runners](#qa-specific-runners)）には、具体的な `qa` 呼び出しを列挙し、上記のリファレンスを参照しています。
</Note>

## クイックスタート

通常は次のとおりです。

- フル gate（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- リソースに余裕のあるマシンでの高速な local full-suite 実行: `pnpm test:max`
- 直接の Vitest watch loop: `pnpm test:watch`
- 直接の file targeting は extension/channel path にもルーティングされます: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 1 つの failure を反復修正しているときは、まず targeted run を優先してください。
- Docker-backed QA site: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

test に触れたとき、または追加の確信が欲しいとき:

- Coverage gate: `pnpm test:coverage`
- E2E suite: `pnpm test:e2e`

実際の provider/model を debug するとき（実 credential が必要）:

- Live suite（model + gateway tool/image probe）: `pnpm test:live`
- 1 つの live file を静かに対象化: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime performance report: 実際の `openai/gpt-5.4` agent turn には `live_gpt54=true`、Kova CPU/heap/trace artifact には `deep_profile=true` を指定して `OpenClaw Performance` を dispatch します。`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、daily scheduled run は mock-provider、deep-profile、GPT 5.4 lane artifact を `openclaw/clawgrit-reports` に公開します。mock-provider report には、source-level gateway boot、memory、plugin-pressure、repeated fake-model hello-loop、CLI startup の数値も含まれます。
- Docker live model sweep: `pnpm test:docker:live-models`
  - 選択された各 model は、text turn に加えて小さな file-read-style probe を実行します。metadata が `image` input を宣伝している model は、小さな image turn も実行します。provider failure を切り分けるときは、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加 probe を無効化してください。
  - CI coverage: daily の `OpenClaw Scheduled Live And E2E Checks` と manual の `OpenClaw Release Checks` はどちらも `include_live_suites: true` で reusable live/E2E workflow を呼び出します。これには、provider ごとに shard された separate Docker live model matrix job が含まれます。
  - focused CI rerun では、`include_live_suites: true` と `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)` を dispatch します。
  - 新しい高シグナルの provider secret は、`scripts/ci-hydrate-live-auth.sh` に加えて `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` と、その scheduled/release caller に追加してください。
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server path に対して Docker live lane を実行し、synthetic Slack DM を `/codex bind` で bind し、`/codex fast` と `/codex permissions` を exercise してから、plain reply と image attachment が ACP ではなく native Plugin binding 経由で route されることを検証します。
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Gateway agent turn を Plugin-owned Codex app-server harness 経由で実行し、`/codex status` と `/codex models` を検証し、デフォルトでは image、cron MCP、sub-agent、Guardian probe を exercise します。他の Codex app-server failure を切り分けるときは、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` で sub-agent probe を無効化してください。focused sub-agent check では、他の probe を無効化します: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、これは sub-agent probe 後に終了します。
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command surface 向けの opt-in belt-and-suspenders check です。`/crestodian status` を exercise し、persistent model change を queue し、`/crestodian yes` に reply し、audit/config write path を検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に fake Claude CLI がある configless container で Crestodian を実行し、fuzzy planner fallback が audited typed config write に変換されることを検証します。
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、bare `openclaw` を Crestodian に route し、setup/model/agent/Discord Plugin + SecretRef write を適用し、config を検証し、audit entry を検証します。同じ Ring 0 setup path は、QA Lab でも `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` を設定した状態で、`openclaw models list --provider moonshot --json` を実行してから、`moonshot/kimi-k2.6` に対して isolated な `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` を実行します。JSON が Moonshot/K2.6 を報告し、assistant transcript が正規化された `usage.cost` を保存することを検証します。

<Tip>
1 つの failing case だけが必要な場合は、下記の allowlist env var で live test を絞り込むことを優先してください。
</Tip>

## QA-specific runners

QA-lab のリアリティが必要な場合、これらのコマンドは main test suite の横にあります。

CI は専用 workflow で QA Lab を実行します。Agentic parity は standalone PR workflow ではなく、`QA-Lab - All Lanes` と release validation の下にネストされています。広範な validation には、`rerun_group=qa-parity` または release-checks QA group を指定した `Full Release Validation` を使用してください。Stable/default release check は、exhaustive live/Docker soak を `run_release_soak=true` の背後に保持します。`full` profile は soak を強制的に有効にします。`QA-Lab - All Lanes` は `main` で nightly に実行され、manual dispatch からは mock parity lane、live Matrix lane、Convex-managed live Telegram lane、Convex-managed live Discord lane を parallel job として実行します。Scheduled QA と release check は Matrix に `--profile fast` を明示的に渡します。一方で、Matrix CLI と manual workflow input の default は `all` のままです。manual dispatch は `all` を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` job に shard できます。`OpenClaw Release Checks` は、release approval の前に parity と fast Matrix および Telegram lane を実行し、release transport check には `mock-openai/gpt-5.5` を使用することで、決定的なままにし、通常の provider-plugin startup を回避します。これらの live transport gateway は memory search を無効化します。memory behavior は QA parity suite で引き続きカバーされています。

Full release live media shard は `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。これには `ffmpeg` と `ffprobe` がすでに含まれています。Docker live model/backend shard は、選択された commit ごとに一度だけ build される共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` image を使用し、各 shard 内で rebuild する代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` で pull します。

- `pnpm openclaw qa suite`
  - リポジトリに基づく QA シナリオをホスト上で直接実行します。
  - 選択された複数のシナリオを、隔離された Gateway ワーカーでデフォルトで並列実行します。`qa-channel` のデフォルトの並列数は 4 です（選択されたシナリオ数で上限が決まります）。ワーカー数を調整するには `--concurrency <count>` を使用し、従来の直列レーンには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗の終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` は、シナリオ対応の `mock-openai` レーンを置き換えずに、実験的なフィクスチャとプロトコルモックのカバレッジ向けに、ローカルの AIMock ベースのプロバイダーサーバーを起動します。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab 経由で、ライブ OpenAI Kitchen Sink Plugin の厳格なテストを実行します。外部の Kitchen Sink パッケージをインストールし、Plugin SDK サーフェスのインベントリを検証し、`/healthz` と `/readyz` をプローブし、Gateway の CPU/RSS 証拠を記録し、ライブ OpenAI ターンを実行し、敵対的診断を確認します。`OPENAI_API_KEY` などのライブ OpenAI 認証が必要です。ハイドレート済みの Testbox セッションでは、`openclaw-testbox-env` ヘルパーが存在する場合、Testbox のライブ認証プロファイルを自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチに加えて、小規模なモック QA Lab シナリオパック（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`）を実行し、統合された CPU 観測サマリーを `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは、持続的な高 CPU 観測のみをフラグ付けします（`--cpu-core-warn` と `--hot-wall-warn-ms`）。そのため、短い起動時のバーストは、数分間にわたる Gateway の張り付き回帰のように見せず、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使用します。チェックアウトに新しいランタイム出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを、使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - ライブ実行では、ゲストで実用的なサポート済み QA 認証入力を転送します: env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、存在する場合は `CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるよう、リポジトリルート配下に留める必要があります。
  - 通常の QA レポートとサマリーに加えて、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業向けに、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルインストールし、非対話的な OpenAI API キーのオンボーディングを実行し、デフォルトで Telegram を設定し、パッケージ化された Plugin ランタイムが起動時の依存関係修復なしで読み込まれることを検証し、doctor を実行し、モックされた OpenAI エンドポイントに対してローカルエージェントターンを 1 回実行します。
  - Discord で同じパッケージインストールレーンを実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストのトランスクリプト向けに、決定的なビルド済みアプリの Docker smoke を実行します。非表示の OpenClaw ランタイムコンテキストが、表示されるユーザーターンに漏れずに、非表示のカスタムメッセージとして永続化されることを検証し、その後、影響を受けた壊れたセッション JSONL をシードして、`openclaw doctor --fix` がそれをバックアップ付きでアクティブブランチに書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内に OpenClaw パッケージ候補をインストールし、インストール済みパッケージのオンボーディングを実行し、インストール済み CLI 経由で Telegram を設定した後、そのインストール済みパッケージを SUT Gateway としてライブ Telegram QA レーンを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。レジストリからインストールする代わりに、解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使用します。CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて `OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定します。CI に `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットが存在する場合、Docker ラッパーは Convex を自動的に選択します。
  - このラッパーは、Docker のビルド/インストール作業の前に、ホスト上で Telegram または Convex 認証情報 env を検証します。`OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` は、認証情報前のセットアップを意図的にデバッグする場合にのみ設定してください。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンのみに対して共有の `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions では、このレーンを手動メンテナー向けワークフロー `NPM Telegram Beta E2E` として公開しています。マージ時には実行されません。このワークフローは `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- GitHub Actions は、1 つの候補パッケージに対するサイド実行の製品証明用に `Package Acceptance` も公開しています。信頼済み ref、公開済み npm spec、SHA-256 付き HTTPS tarball URL、または別の実行からの tarball アーティファクトを受け付け、正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、その後、既存の Docker E2E スケジューラーを smoke、package、product、full、または custom のレーンプロファイルで実行します。同じ `package-under-test` アーティファクトに対して Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta 製品証明:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL の証明にはダイジェストが必要です:

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
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI が設定された Gateway を起動した後、設定編集によってバンドル済みチャンネル/Plugin を有効化します。
  - セットアップ検出で未設定のダウンロード可能 Plugin が不在のままになること、最初に設定された doctor 修復で欠落している各ダウンロード可能 Plugin が明示的にインストールされること、2 回目の再起動で非表示の依存関係修復が実行されないことを検証します。
  - 既知の古い npm ベースラインもインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補の更新後 doctor がハーネス側の postinstall 修復なしでレガシー Plugin 依存関係の残骸をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージインストール更新 smoke を実行します。選択された各プラットフォームは、まず要求されたベースラインパッケージをインストールし、その後、同じゲスト内でインストール済みの `openclaw update` コマンドを実行し、インストール済みバージョン、更新ステータス、Gateway の準備完了状態、ローカルエージェントターン 1 回を検証します。
  - 1 つのゲストで反復作業する場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使用します。サマリーアーティファクトパスとレーンごとのステータスには `--json` を使用します。
  - OpenAI レーンは、ライブエージェントターン証明にデフォルトで `openai/gpt-5.5` を使用します。別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels トランスポートの停止が残りのテスト時間を消費しないよう、長時間のローカル実行はホストのタイムアウトでラップします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトは、ネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認してください。
  - Windows 更新は、コールドゲストでは更新後 doctor とパッケージ更新作業に 10 から 15 分かかることがあります。ネストされた npm デバッグログが進んでいれば、これは正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux smoke レーンと並列に実行しないでください。これらは VM 状態を共有しており、スナップショット復元、パッケージ提供、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後の証明では、通常のバンドル済み Plugin サーフェスを実行します。これは、エージェントターン自体が単純なテキスト応答だけを確認する場合でも、音声、画像生成、メディア理解などの capability facade がバンドル済みランタイム API 経由で読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接的なプロトコル smoke テスト向けに、ローカル AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベースの Tuwunel homeserver に対して、Matrix ライブ QA レーンを実行します。ソースチェックアウトのみです - パッケージ化されたインストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、env vars、アーティファクトレイアウト: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - env のドライバーおよび SUT ボットトークンを使用し、実際のプライベートグループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報向けに `--credential-source convex` をサポートします。デフォルトでは env モードを使用するか、プールされたリースを使用するには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗の終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じプライベートグループ内に 2 つの異なるボットが必要で、SUT ボットは Telegram ユーザー名を公開している必要があります。
  - 安定したボット間観測のために、両方のボットで `@BotFather` の Bot-to-Bot Communication Mode を有効にし、ドライバーボットがグループ内のボットトラフィックを観測できるようにしてください。
  - Telegram QA レポート、サマリー、観測メッセージアーティファクトを `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、ドライバー送信リクエストから観測された SUT 返信までの RTT が含まれます。

ライブトランスポートレーンは、新しいトランスポートでずれが生じないよう、1 つの標準契約を共有します。レーンごとのカバレッジマトリクスは [QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、このマトリクスの一部ではありません。

### Convex 経由の共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA lab は Convex ベースのプールから排他的リースを取得し、そのレーンの実行中にリースへ Heartbeat を送り、シャットダウン時にリースを解放します。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択されたロール用のシークレット 1 つ:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` は `maintainer` 用
  - `OPENCLAW_QA_CONVEX_SECRET_CI` は `ci` 用
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - Env デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトで `ci`、それ以外では `maintainer`）

任意の env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

`OPENCLAW_QA_CONVEX_SITE_URL` は通常運用では `https://` を使用する必要があります。

メンテナー用の管理コマンド (pool add/remove/list) には、特に
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使って、Convex サイト URL、ブローカーシークレット、
エンドポイントプレフィックス、HTTP タイムアウト、admin/list の到達性を、シークレット値を出力せずに確認します。スクリプトや CI
ユーティリティで機械可読な出力が必要な場合は `--json` を使用してください。

デフォルトのエンドポイント契約 (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/リトライ可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - アクティブリースガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (メンテナーシークレットのみ)
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram kind のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正な形式のペイロードを拒否します。

### QA にチャネルを追加する

新しいチャネルアダプターのアーキテクチャとシナリオヘルパー名は、[QA 概要 → チャネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低限必要なことは、共有 `qa-lab` ホストシーム上でトランスポートランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成することです。

## テストスイート (どこで何が実行されるか)

スイートは「現実性が高まる」ものとして考えてください (それに伴って不安定さとコストも増えます):

### ユニット / 統合 (デフォルト)

- コマンド: `pnpm test`
- 設定: ターゲット指定なしの実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクト別設定に展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core/unit インベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- スコープ:
  - 純粋なユニットテスト
  - プロセス内統合テスト (gateway 認証、ルーティング、ツール、解析、設定)
  - 既知のバグに対する決定的なリグレッション
- 期待事項:
  - CI で実行される
  - 実キーは不要
  - 高速かつ安定しているべき
  - リゾルバーと公開サーフェスのローダーテストは、実際のバンドル済み Plugin ソース API ではなく、生成された小さな Plugin フィクスチャを使って、広範な `api.js` と
    `runtime-api.js` のフォールバック挙動を証明する必要があります。実際の Plugin API 読み込みは、
    Plugin 所有の契約/統合スイートに属します。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - ターゲット指定なしの `pnpm test` は、巨大な単一のネイティブルートプロジェクトプロセスではなく、十二個の小さなシャード設定 (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) を実行します。これにより、負荷の高いマシンでのピーク RSS を削減し、auto-reply/extension 作業が無関係なスイートを飢餓状態にするのを避けます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。マルチシャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで安価なスコープ付きレーンに展開します: 直接のテスト編集、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフの依存先です。設定/setup/package の編集では、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用しない限り、テストを広範囲に実行しません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、ガードコマンドを実行します。Vitest テストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョンバンプでは、対象を絞った version/config/root-dependency チェックを実行し、トップレベルの version フィールド以外の package 変更を拒否するガードを適用します。
    - Live Docker ACP ハーネス編集では、live Docker 認証スクリプトのシェル構文と live Docker スケジューラーのドライランというフォーカスしたチェックを実行します。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定される場合のみ含まれます。dependency、export、version、その他 package サーフェスの編集では、引き続きより広範なガードを使用します。
    - agents、commands、plugins、auto-reply ヘルパー、`plugin-sdk`、同様の純粋なユーティリティ領域の import-light なユニットテストは `unit-fast` レーンを通り、`test/setup-openclaw-runtime.ts` をスキップします。ステートフル/ランタイム負荷の高いファイルは既存レーンに残ります。
    - 選択された `plugin-sdk` と `commands` のヘルパーソースファイルも、変更モードの実行をそれらの軽量レーン内の明示的な兄弟テストにマップするため、ヘルパー編集ではそのディレクトリの重いスイート全体の再実行を避けられます。
    - `auto-reply` には、トップレベル core ヘルパー、トップレベル `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー向けの専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、import が重い 1 つのバケットが Node の末尾全体を占有しないようにしています。
    - 通常の PR/main CI は、extension バッチスイープとリリース専用の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補に対して Plugin/extension 負荷の高いそれらのスイートを別個の `Plugin Prerelease` 子ワークフローとしてディスパッチします。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - message-tool 検出入力または Compaction ランタイム
      コンテキストを変更する場合は、両レベルのカバレッジを維持してください。
    - 純粋なルーティングおよび正規化
      境界に対するフォーカスしたヘルパーリグレッションを追加してください。
    - embedded runner 統合スイートを健全に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付き ID と Compaction 挙動が実際の
      `run.ts` / `compact.ts` パスを通じて引き続き流れることを検証します。ヘルパーのみのテストは、
      それらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - ベース Vitest 設定のデフォルトは `threads` です。
    - 共有 Vitest 設定は `isolate: false` を固定し、ルートプロジェクト、e2e、live 設定全体で
      非分離 runner を使用します。
    - ルート UI レーンは `jsdom` setup と optimizer を維持しますが、同様に
      共有の非分離 runner で実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false`
      デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 コンパイルの揺れを減らすため、Vitest 子 Node
      プロセスにデフォルトで `--no-maglev` を追加します。
      通常の V8 挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` は、diff がどのアーキテクチャレーンをトリガーするかを表示します。
    - pre-commit フックはフォーマットのみです。フォーマットされたファイルを再ステージし、
      lint、typecheck、tests は実行しません。
    - スマートローカルチェックゲートが必要な場合は、引き渡しまたは push の前に
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで安価なスコープ付きレーンを通ります。
      agent が harness、config、package、または contract の編集に本当により広い
      Vitest カバレッジが必要だと判断した場合にのみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は、同じルーティング
      挙動を維持しつつ、worker 上限だけを高くします。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストのロードアベレージがすでに高い場合は抑制されるため、複数の同時
      Vitest 実行による影響はデフォルトで小さくなります。
    - ベース Vitest 設定は、テスト
      配線が変わったときに changed-mode の再実行が正しく保たれるように、projects/config files を
      `forceRerunTriggers` としてマークします。
    - 設定は、サポート対象の
      ホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接プロファイリング用に明示的なキャッシュ場所を 1 つ使いたい場合は、
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` は、Vitest の import-duration レポートに加えて
      import-breakdown 出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを
      `origin/main` 以降に変更されたファイルにスコープします。
    - シャードタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。
      whole-config 実行では設定パスをキーとして使用します。include-pattern CI
      シャードではシャード名を追加し、フィルタ済みシャードを個別に追跡できるようにします。
    - ある hot test が依然として起動時 import にほとんどの時間を費やしている場合は、
      重い依存関係を狭いローカル `*.runtime.ts` シームの背後に置き、
      runtime ヘルパーを `vi.mock(...)` に渡すためだけに deep-import するのではなく、そのシームを直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み
      diff に対してルーティングされた `test:changed` とネイティブルートプロジェクトパスを比較し、
      wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、現在の
      dirty tree を、変更ファイルリストを
      `scripts/test-projects.mjs` とルート Vitest 設定にルーティングしてベンチマークします。
    - `pnpm test:perf:profile:main` は、
      Vitest/Vite の起動と transform オーバーヘッドに対するメインスレッド CPU プロファイルを書き込みます。
    - `pnpm test:perf:profile:runner` は、
      ファイル並列性を無効にしたユニットスイートの runner CPU+heap プロファイルを書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性 (gateway)

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 worker に強制
- スコープ:
  - デフォルトで診断を有効にした実際の local loopback Gateway を起動する
  - 合成 gateway メッセージ、メモリ、大きなペイロードの churn を診断イベントパスに流す
  - Gateway WS RPC 経由で `diagnostics.stability` をクエリする
  - 診断安定性バンドルの永続化ヘルパーをカバーする
  - レコーダーが制限内に収まり、合成 RSS サンプルが pressure budget 未満に保たれ、セッションごとのキュー深度がゼロに戻ることをアサートする
- 期待事項:
  - CI-safe かつ keyless
  - 安定性リグレッションのフォローアップ向けの狭いレーンであり、Gateway スイート全体の代替ではない

### E2E (gateway smoke)

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E テスト
- ランタイムのデフォルト:
  - リポジトリの他の部分と同様に、`isolate: false` で Vitest `threads` を使用します。
  - 適応型ワーカーを使用します (CI: 最大 2、ローカル: デフォルトで 1)。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトではサイレントモードで実行します。
- 便利な上書き:
  - ワーカー数を強制するには `OPENCLAW_E2E_WORKERS=<n>` を使用します (上限 16)。
  - 詳細なコンソール出力を再度有効にするには `OPENCLAW_E2E_VERBOSE=1` を使用します。
- スコープ:
  - 複数インスタンスの Gateway エンドツーエンド動作
  - WebSocket/HTTP サーフェス、Node のペアリング、およびより重いネットワーク処理
- 期待事項:
  - CI で実行されます (パイプラインで有効な場合)
  - 実際のキーは不要です
  - ユニットテストより可動部分が多くなります (遅くなる場合があります)

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell Gateway を開始します
  - 一時的なローカル Dockerfile からサンドボックスを作成します
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell バックエンドを実行します
  - サンドボックス fs ブリッジを通じて remote-canonical ファイルシステムの動作を検証します
- 期待事項:
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLI と動作する Docker デーモンが必要です
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト Gateway とサンドボックスを破棄します
- 便利な上書き:
  - より広い e2e スイートを手動で実行するときにテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1` を使用します
  - デフォルト以外の CLI バイナリまたはラッパースクリプトを指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` を使用します

### ライブ (実プロバイダー + 実モデル)

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下の bundled-plugin ライブテスト
- デフォルト: `pnpm test:live` により **有効** です (`OPENCLAW_LIVE_TEST=1` を設定)
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で _今日_ 実際に動作するか?」
  - プロバイダーの形式変更、ツール呼び出しの癖、認証の問題、レート制限の動作を検出します
- 期待事項:
  - 設計上、CI で安定しません (実ネットワーク、実プロバイダーポリシー、クォータ、障害)
  - 費用が発生する / レート制限を消費します
  - 「すべて」ではなく、絞り込んだサブセットを実行することを推奨します
- ライブ実行では、不足している API キーを取得するために `~/.profile` を source します。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定/認証素材を一時テストホームにコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更することはありません。
- ライブテストで実際のホームディレクトリを意図的に使う必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードをデフォルトにしています。`[live] ...` の進行状況出力は維持しますが、追加の `~/.profile` 通知を抑制し、Gateway bootstrap ログ/Bonjour chatter をミュートします。起動ログ全体を戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーのローテーション (プロバイダー固有): `*_API_KEYS` をカンマ/セミコロン形式で設定するか、`*_API_KEY_1`、`*_API_KEY_2` (例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`) を設定します。または `OPENCLAW_LIVE_*_KEY` でライブごとに上書きします。テストはレート制限レスポンスで再試行します。
- 進行状況/Heartbeat 出力:
  - ライブスイートは現在、長いプロバイダー呼び出しが Vitest のコンソールキャプチャで静かな場合でも目に見えてアクティブであるように、進行状況行を stderr に出力します。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効にするため、ライブ実行中にプロバイダー/Gateway の進行状況行が即座にストリームされます。
  - direct-model Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway/プローブ Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきですか?

この判断表を使用してください:

- ロジック/テストを編集する場合: `pnpm test` を実行します (大きく変更した場合は `pnpm test:coverage` も実行)
- Gateway ネットワーク / WS プロトコル / ペアリングに触れる場合: `pnpm test:e2e` を追加します
- 「自分のボットが落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグする場合: 絞り込んだ `pnpm test:live` を実行します

## ライブ (ネットワークに触れる) テスト

ライブモデルマトリクス、CLI バックエンドスモーク、ACP スモーク、Codex app-server
ハーネス、およびすべてのメディアプロバイダーライブテスト (Deepgram、BytePlus、ComfyUI、image、
music、video、media harness) に加え、ライブ実行の認証情報処理については、
[ライブスイートのテスト](/ja-JP/help/testing-live) を参照してください。専用の更新および
Plugin 検証チェックリストについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

## Docker ランナー (任意の「Linux で動作する」チェック)

これらの Docker ランナーは 2 つの分類に分かれます:

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で一致する profile-key ライブファイル (`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`) のみを実行し、ローカル設定ディレクトリとワークスペースをマウントします (マウントされている場合は `~/.profile` も source します)。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker ライブランナーは、完全な Docker スイープを実用的に保つため、デフォルトで小さめのスモーク上限を使用します:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。明示的により大きな網羅的スキャンを行いたい場合は、これらの環境変数を上書きしてください。
- `test:docker:all` は、`test:docker:live-build` によりライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックし、その後 2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用します。ベア イメージは、install/update/plugin-dependency レーン用の Node/Git ランナーのみです。これらのレーンは事前ビルド済み tarball をマウントします。functional イメージは、built-app functionality レーン用に同じ tarball を `/app` にインストールします。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあります。プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあります。`scripts/test-docker-all.mjs` は選択されたプランを実行します。集約では重み付きローカルスケジューラーを使用します。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限は重いライブ、npm-install、マルチサービスのレーンがすべて同時に開始されることを防ぎます。単一のレーンがアクティブな上限より重い場合でも、プールが空ならスケジューラーはそれを開始でき、その後キャパシティが再び利用可能になるまで単独で実行し続けます。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、および `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。Docker ホストに余力がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整してください。ランナーはデフォルトで Docker preflight を実行し、古い OpenClaw E2E コンテナーを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、それらのタイミングを使用して後続の実行で長いレーンを先に開始します。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、package/image の必要性、および認証情報に関する CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用します。
- `Package Acceptance` は、「このインストール可能な tarball は製品として動作するか?」を確認する GitHub ネイティブのパッケージゲートです。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から 1 つの候補パッケージを解決し、それを `package-under-test` としてアップロードしてから、選択された ref を再パックするのではなく、その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。プロファイルは範囲の広さ順に `smoke`、`package`、`product`、`full` です。package/update/plugin 契約、published-upgrade survivor matrix、リリースデフォルト、および失敗トリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。
- ビルドおよびリリースチェックは、tsdown 後に `scripts/check-cli-bootstrap-imports.mjs` を実行します。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的ビルドグラフをたどり、コマンド dispatch 前の起動時に Commander、prompt UI、undici、logging などのパッケージ依存関係をインポートしている場合に失敗します。また、バンドルされた Gateway run chunk を予算内に保ち、既知の cold gateway path の静的インポートを拒否します。パッケージ化された CLI スモークでは、root help、onboard help、doctor help、status、config schema、および model-list コマンドも対象にします。
- Package Acceptance のレガシー互換性は `2026.4.25` (`2026.4.25-beta.*` を含む) までに制限されています。そのカットオフまでは、ハーネスは出荷済みパッケージのメタデータギャップのみを許容します。省略された private QA inventory entries、欠落した `gateway install --wrapper`、tarball 由来の git fixture に存在しないパッチファイル、永続化されていない `update.channel`、レガシー Plugin install-record の場所、marketplace install-record persistence の欠落、および `plugins update` 中の config metadata migration です。`2026.4.25` より後のパッケージでは、これらのパスは厳格な失敗になります。
- コンテナースモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1 つ以上の実コンテナーを起動し、より高レベルの統合パスを検証します。

ライブモデル Docker ランナーは、必要な CLI 認証ホームのみ (または実行が絞り込まれていない場合はサポートされているすべて) も bind mount し、その後実行前にコンテナーホームへコピーするため、external-CLI OAuth はホストの認証ストアを変更せずにトークンを更新できます:

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`; デフォルトで Claude、Codex、Gemini を対象にし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` による厳密な Droid/OpenCode カバレッジも含む）
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex アプリサーバーハーネススモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- オブザーバビリティスモーク: `pnpm qa:otel:smoke` は非公開 QA ソースチェックアウトレーン。npm tarball では QA Lab が省略されるため、意図的にパッケージ Docker リリースレーンには含めていない。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なスキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Npm tarball オンボーディング/チャンネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、env-ref オンボーディング経由の OpenAI とデフォルトの Telegram を設定し、doctor を実行し、モックされた OpenAI エージェントターンを 1 回実行する。事前ビルド済み tarball を `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用するか、`OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` でホストの再ビルドをスキップするか、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` でチャンネルを切り替える。
- 更新チャンネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャンネルと Plugin の更新後動作を検証し、その後パッケージ `stable` に戻して更新ステータスを確認する。
- アップグレードサバイバースモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャンネル設定、Plugin allowlist、古い Plugin 依存状態、既存のワークスペース/セッションファイルを含む、変更済みの古いユーザーフィクスチャにパック済み OpenClaw tarball をインストールする。ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話型 doctor を実行し、その後 loopback Gateway を起動して、設定/状態の保持と起動/ステータスの予算を確認する。
- 公開版アップグレードサバイバースモーク: `pnpm test:docker:published-upgrade-survivor` はデフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、焼き込み済みコマンドレシピでそのベースラインを設定し、結果の設定を検証し、その公開インストールを候補 tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、設定済み intent、状態保持、起動、`/healthz`、`/readyz`、RPC ステータス予算を確認する。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で 1 つのベースラインを上書きし、`openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で集約スケジューラーに正確なローカルベースラインを展開させ、`reported-issues` のような `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` で issue 形状のフィクスチャを展開する。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれる。Package Acceptance はそれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` のようなメタベースライントークンを解決し、Full Release Validation は release-soak パッケージゲートを `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開する。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストの transcript 永続化と、影響を受ける重複したプロンプト再書き込みブランチの doctor 修復を検証する。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は現在のツリーをパックし、隔離された home 内で `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み画像プロバイダーを返すことを検証する。事前ビルド済み tarball を `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用するか、`OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` でホストビルドをスキップするか、`OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` でビルド済み Docker イメージから `dist/` をコピーする。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各コンテナで 1 つの npm キャッシュを共有する。更新スモークは、候補 tarball にアップグレードする前の stable ベースラインとして、デフォルトで npm `latest` を使う。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きする。非 root インストーラー確認では、root 所有のキャッシュエントリがユーザーローカルインストールの動作を隠さないように、隔離された npm キャッシュを保持する。ローカル再実行で root/update/direct-npm キャッシュを再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定する。
- Install Smoke CI は、`OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` で重複する direct-npm グローバル更新をスキップする。直接の `npm install -g` カバレッジが必要な場合は、その env なしでスクリプトをローカル実行する。
- エージェント削除共有ワークスペース CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace`（スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`）はデフォルトで root Dockerfile イメージをビルドし、隔離されたコンテナ home に 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行し、有効な JSON とワークスペース保持動作を検証する。install-smoke イメージを再利用するには、`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使う。
- Gateway ネットワーキング（2 コンテナ、WS 認証 + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- Browser CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot`（スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`）は、ソース E2E イメージと Chromium レイヤーをビルドし、生 CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP ロールスナップショットがリンク URL、カーソルで昇格されたクリック可能要素、iframe 参照、フレームメタデータをカバーすることを検証する。
- OpenAI Responses web_search 最小推論リグレッション: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、モックされた OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後プロバイダースキーマの reject を強制して、生の詳細が Gateway ログに表示されることを確認する。
- MCP チャンネルブリッジ（シード済み Gateway + stdio ブリッジ + 生の Claude notification-frame スモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Pi バンドル MCP ツール（実 stdio MCP サーバー + 埋め込み Pi プロファイル allow/deny スモーク）: `pnpm test:docker:pi-bundle-mcp-tools`（スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/サブエージェント MCP クリーンアップ（実 Gateway + 隔離 cron と one-shot サブエージェント実行後の stdio MCP 子プロセス teardown）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（ローカルパス、`file:`、hoist された依存関係を持つ npm registry、git moving refs、ClawHub kitchen-sink、marketplace 更新、Claude-bundle の enable/inspect の install/update スモーク）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定するか、デフォルトの kitchen-sink パッケージ/ランタイムペアを `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` で上書きする。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub フィクスチャサーバーを使う。
- Plugin 更新変更なしスモーク: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin ライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、パック済み OpenClaw tarball を素のコンテナにインストールし、npm Plugin をインストールし、enable/disable を切り替え、ローカル npm registry 経由で upgrade と downgrade を行い、インストール済みコードを削除し、その後 stale state が uninstall で引き続き削除されることを検証しつつ、各ライフサイクルフェーズの RSS/CPU メトリクスをログに記録する。
- 設定リロードメタデータスモーク: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- Plugins: `pnpm test:docker:plugins` は、ローカルパス、`file:`、hoist された依存関係を持つ npm registry、git moving refs、ClawHub フィクスチャ、marketplace 更新、Claude-bundle の enable/inspect の install/update スモークをカバーする。`pnpm test:docker:plugin-update` は、インストール済み Plugins の変更なし更新動作をカバーする。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡付きの npm Plugin install、enable、disable、upgrade、downgrade、missing-code uninstall をカバーする。

共有機能イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きが設定されている場合は、引き続きそれが優先される。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにないときに pull する。QR とインストーラー Docker テストは、共有ビルド済みアプリランタイムではなくパッケージ/インストール動作を検証するため、独自の Dockerfile を保持している。

ライブモデル Docker ランナーは、現在のチェックアウトも読み取り専用でバインドマウントし、
コンテナ内の一時作業ディレクトリにステージングします。これにより、ランタイム
イメージをスリムに保ちながら、ローカルの正確なソース/設定に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、およびアプリローカルの `.build` や
Gradle 出力ディレクトリなど、大きなローカル専用キャッシュやアプリのビルド出力をスキップするため、
Docker ライブ実行がマシン固有の成果物のコピーに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定されるため、Gateway のライブプローブがコンテナ内で
実際の Telegram/Discord などのチャネルワーカーを起動することはありません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンから
Gateway ライブカバレッジを絞り込む、または除外する必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw Gateway コンテナを起動し、その Gateway に対して固定された Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証したうえで、
Open WebUI の `/api/chat/completions` プロキシを通じて実際のチャットリクエストを送信します。
初回実行は、Docker が Open WebUI イメージを取得する必要があり、Open WebUI 自体のコールドスタート設定が
完了する必要もあるため、目に見えて遅くなることがあります。
このレーンには利用可能なライブモデルキーが必要であり、Docker 化された実行でそれを提供する主な方法は
`OPENCLAW_PROFILE_FILE`（デフォルトは `~/.profile`）です。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の Telegram、Discord、iMessage アカウントは不要です。
シード済みの Gateway コンテナを起動し、`openclaw mcp serve` を生成する 2 つ目のコンテナを起動したうえで、
ルーティングされた会話の検出、トランスクリプトの読み取り、添付ファイルのメタデータ、
ライブイベントキューの挙動、アウトバウンド送信ルーティング、および実際の stdio MCP ブリッジ越しの
Claude 形式のチャネル + 権限通知を検証します。通知チェックは生の stdio MCP フレームを直接検査するため、
このスモークは特定のクライアント SDK がたまたま表面化する内容だけでなく、
ブリッジが実際に発行する内容を検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、ライブモデルキーは不要です。リポジトリの Docker イメージをビルドし、
コンテナ内で実際の stdio MCP プローブサーバーを起動し、埋め込み Pi バンドル
MCP ランタイムを通じてそのサーバーを実体化し、ツールを実行したうえで、`coding` と `messaging` が
`bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルタリングすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデルキーは不要です。実際の stdio MCP プローブサーバーを備えた
シード済み Gateway を起動し、分離された Cron ターンと `/subagents spawn` の一回限りの子ターンを実行したうえで、
各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP プレーン言語スレッドスモーク（CI ではありません）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

便利な環境変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に読み込まれます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な設定/ワークスペースディレクトリを使い、外部 CLI 認証マウントなしで、`OPENCLAW_PROFILE_FILE` から読み込まれた環境変数のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、その後テスト開始前に `/home/node/...` にコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定された必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きできます
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` で実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` でコンテナ内のプロバイダーをフィルタリングします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` で、再ビルドが不要な再実行時に既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で、認証情報が（環境変数ではなく）プロファイルストアから取得されることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` で、Open WebUI スモーク向けに Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` で、Open WebUI スモークが使用する nonce チェック用プロンプトを上書きします
- `OPENWEBUI_IMAGE=...` で、固定された Open WebUI イメージタグを上書きします

## ドキュメントの健全性確認

ドキュメント編集後にドキュメントチェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全な Mintlify アンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフライン回帰（CI セーフ）

これらは実際のプロバイダーを使わない「実パイプライン」回帰です:

- Gateway ツール呼び出し（モック OpenAI、実 Gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定の書き込み + 認証強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性評価（Skills）

「エージェント信頼性評価」のように振る舞う CI セーフなテストはすでにいくつかあります:

- 実際の Gateway + エージェントループを通じたモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **意思決定:** プロンプトに Skills が列挙されている場合、エージェントは正しい Skill を選択する（または無関係なものを避ける）か？
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか？
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界をアサートするマルチターンシナリオ。

将来の評価は、まず決定的であることを維持すべきです:

- モックプロバイダーを使用して、ツール呼び出し + 順序、Skill ファイル読み取り、セッション配線をアサートするシナリオランナー。
- Skill に焦点を当てた小さなシナリオスイート（使用と回避、ゲーティング、プロンプトインジェクション）。
- 任意のライブ評価（オプトイン、環境変数ゲート付き）は、CI セーフなスイートが整ってからのみ。

## 契約テスト（Plugin とチャネル形状）

契約テストは、登録済みのすべての Plugin とチャネルがその
インターフェイス契約に準拠していることを検証します。検出されたすべての Plugin を反復処理し、
形状と挙動のアサーションスイートを実行します。デフォルトの `pnpm test` ユニットレーンは、
これらの共有シームとスモークファイルを意図的にスキップします。共有チャネルまたはプロバイダーサーフェスに触れる場合は、
契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な Plugin 形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディングの挙動
- **outbound-payload** - メッセージペイロード構造
- **inbound** - インバウンドメッセージ処理
- **actions** - チャネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/ロスター API
- **group-policy** - グループポリシー強制

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャネルステータスプローブ
- **registry** - Plugin レジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証の選択/セレクション
- **catalog** - モデルカタログ API
- **discovery** - Plugin 検出
- **loader** - Plugin 読み込み
- **runtime** - プロバイダーランタイム
- **shape** - Plugin 形状/インターフェイス
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdk のエクスポートまたはサブパスを変更した後
- チャネルまたはプロバイダー Plugin を追加または変更した後
- Plugin 登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## 回帰の追加（ガイダンス）

ライブで発見されたプロバイダー/モデルの問題を修正する場合:

- 可能であれば CI セーフな回帰を追加します（モック/スタブプロバイダー、または正確なリクエスト形状変換のキャプチャ）
- それが本質的にライブ専用である場合（レート制限、認証ポリシー）、ライブテストは狭く保ち、環境変数によるオプトインにします
- バグを捕まえる最小レイヤーを対象にすることを優先します:
  - プロバイダーのリクエスト変換/リプレイバグ → 直接のモデルテスト
  - Gateway セッション/履歴/ツールパイプラインバグ → Gateway ライブスモークまたは CI セーフな Gateway モックテスト
- SecretRef 走査ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` はレジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとにサンプル対象を 1 つ導出し、走査セグメントの exec id が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef 対象ファミリーを追加する場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは未分類の対象 id で意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。

## 関連

- [ライブテスト](/ja-JP/help/testing-live)
- [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
