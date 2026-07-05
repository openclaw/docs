---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対するリグレッションを追加する
    - Gateway + エージェントの動作のデバッグ
summary: 'テストキット: 単体/e2e/ライブスイート、Dockerランナー、および各テストの対象'
title: テスト
x-i18n:
    generated_at: "2026-07-05T11:25:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d214989b949abec4c41701154e295d9da50a7e3bdae26e5e1835b78b2c0cf345
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と Docker
ランナーがあります。このページでは、各スイートの対象範囲、特定のワークフローで実行するコマンド、live テストが認証情報を検出する方法、実環境の provider/model バグに対するリグレッションの追加方法を説明します。

<Note>
**QA スタック（qa-lab、qa-channel、live transport lanes）** は別ページで説明しています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) - `pnpm openclaw qa matrix` のリファレンス。
- [成熟度スコアカード](/ja-JP/maturity/scorecard) - リリース QA エビデンスが安定性と LTS 判断をどう支えるか。
- [QA channel](/ja-JP/channels/qa-channel) - repo-backed シナリオで使う synthetic transport plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーを扱います。下の [QA-specific runners](#qa-specific-runners) には、具体的な `qa` 呼び出しを列挙し、上記のリファレンスに戻れるようにしています。
</Note>

## クイックスタート

通常は次を使います。

- フルゲート（push 前に実行想定）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカルフルスイート実行: `pnpm test:max`
- 直接 Vitest watch ループ: `pnpm test:watch`
- 直接ファイル指定は plugin/channel パスにもルーティングされます: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復調査するときは、まず対象を絞った実行を優先します。
- Docker-backed QA サイト: `pnpm qa:lab:up`
- Linux VM-backed QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れる場合や追加の確信が必要な場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

## テスト一時ディレクトリ

テスト所有の一時ディレクトリには、`test/helpers/temp-dir.ts` の共有ヘルパーを使ってください。所有権が明確になり、クリーンアップがテストのライフサイクル内に保たれます。

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` は意図的に手動クリーンアップメソッドを公開していません。各テスト後のクリーンアップは Vitest が所有します。古い低レベルヘルパー（`makeTempDir`、`cleanupTempDirs`、`createTempDirTracker`）は、まだ移行していないテスト向けに残っています。新規利用は避け、テストが生の temp-dir 挙動を明示的に検証している場合を除き、新しい裸の `fs.mkdtemp*` 呼び出しも避けてください。裸の temp dir が本当に必要な場合は、理由を添えた監査可能な allow コメントを追加します。

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` は、追加された diff 行における新しい裸の temp-dir 作成と、共有ヘルパーの新しい手動利用を報告します。既存のクリーンアップスタイルはブロックしません。これは `scripts/changed-lanes.mjs` と同じ test-path 分類に従い、共有ヘルパー実装自体はスキップします。`check:changed` は変更されたテストパスに対してこのレポートを warning-only の CI シグナル（失敗ではなく GitHub warning annotations）として実行します。

## Live と Docker/Parallels ワークフロー

実際の providers/models をデバッグする場合（実際の認証情報が必要）:

- Live スイート（models + gateway tool/image probes）: `pnpm test:live`
- 1 つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイムパフォーマンスレポート: 実際の `openai/gpt-5.5` agent turn には `live_openai_candidate=true`、Kova CPU/heap/trace artifacts には `deep_profile=true` を指定して `OpenClaw Performance` を dispatch します。日次スケジュール実行は、`CLAWGRIT_REPORTS_TOKEN` が構成されている場合、mock-provider、deep-profile、GPT 5.5 レーンの artifacts を `openclaw/clawgrit-reports` に公開します。mock-provider レポートには、source-level gateway boot、memory、plugin-pressure、repeated fake-model hello-loop、CLI startup の数値も含まれます。
- Docker live model sweep: `pnpm test:docker:live-models`
  - 選択された各 model は、テキスト turn と小さな file-read 風 probe を実行します。metadata が `image` input を宣伝している models は、小さな image turn も実行します。provider の失敗を切り分ける場合は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加 probe を無効化します。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の `OpenClaw Release Checks` はどちらも、`include_live_suites: true` を指定して再利用可能な live/E2E ワークフローを呼び出します。これには provider ごとに shard された Docker live model matrix jobs が含まれます。
  - 集中的な CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)` を dispatch します。
  - 新しい高シグナルの provider secrets は、`scripts/ci-hydrate-live-auth.sh`、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`、およびその scheduled/release callers に追加します。
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live レーンを実行し、synthetic Slack DM を `/codex bind` で bind し、`/codex fast` と `/codex permissions` を実行したうえで、ACP ではなく native plugin binding 経由でプレーンな返信と image attachment route を検証します。
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - plugin-owned Codex app-server harness 経由で gateway agent turns を実行し、`/codex status` と `/codex models` を検証します。デフォルトでは image、cron MCP、sub-agent、Guardian probes を実行します。他の失敗を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` で sub-agent probe を無効化します。sub-agent に絞ったチェックでは、他の probes を無効化します:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、これは sub-agent probe 後に終了します。
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Docker 内で packaged OpenClaw tarball をインストールし、OpenAI API-key オンボーディングを実行し、Codex plugin と `@openai/codex` dependency が必要時に managed npm project root へダウンロードされたことを検証します。
- Live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - 実際の `slugify` dependency を持つ fixture plugin を pack し、`npm-pack:` 経由でインストールし、managed npm project root 配下の dependency を検証したあと、live OpenAI model に plugin tool を呼び出して hidden slug を返すよう依頼します。
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command surface の opt-in belt-and-suspenders チェックです。`/crestodian status` を実行し、永続的な model 変更をキューに入れ、`/crestodian yes` に返信し、audit/config write path を検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に fake Claude CLI を置いた configless container で Crestodian を実行し、fuzzy planner fallback が audited typed config write に変換されることを検証します。
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、modern onboard Crestodian entrypoint を検証し、setup/model/agent/Discord plugin + SecretRef writes を適用し、config を検証し、audit entries を検証します。同じ Ring 0 setup path は QA Lab でも `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` を設定した状態で、`openclaw models list --provider moonshot --json` を実行し、その後 `moonshot/kimi-k2.6` に対して、隔離された `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` を実行します。JSON が Moonshot/K2.6 を報告し、assistant transcript が正規化された `usage.cost` を保存していることを検証します。

<Tip>
失敗ケースが 1 つだけ必要な場合は、下記の allowlist env vars で live tests を絞り込むことを優先してください。
</Tip>

## QA-specific runners

これらのコマンドは、QA-lab の現実性が必要なときに main test suites の隣で使います。

CI は専用ワークフローで QA Lab を実行します。Agentic parity は、独立した PR ワークフローではなく、`QA-Lab - All Lanes` と release validation の配下にネストされています。広範な検証には、`rerun_group=qa-parity` または release-checks QA group を指定した `Full Release Validation` を使ってください。Stable/default release checks では、網羅的な live/Docker soak は `run_release_soak=true` の背後に維持されます。`full` profile は soak を強制的に有効にします。`QA-Lab - All Lanes` は `main` で nightly に実行され、手動 dispatch では mock parity lane、live Matrix lane、Convex-managed live Telegram lane、Convex-managed live Discord lane が parallel jobs として実行されます。Scheduled QA と release checks は Matrix に `--profile fast` を明示的に渡しますが、Matrix CLI と手動ワークフロー input のデフォルトは `all` のままです。手動 dispatch では、`all` を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` jobs に shard できます。`OpenClaw Release Checks` は、release approval の前に parity と fast Matrix および Telegram lanes を実行し、release transport checks には `mock-openai/gpt-5.5` を使うことで、決定的な実行を保ち、通常の provider-plugin startup を避けます。これらの live transport gateways は memory search を無効化します。memory behavior は QA parity suites によって引き続きカバーされます。

Full release live media shards は、すでに `ffmpeg` と `ffprobe` を含む `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使います。Docker live model/backend shards は、選択された commit ごとに一度だけビルドされた共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` image を使い、各 shard 内で再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` で pull します。

- `pnpm openclaw qa suite`
  - リポジトリに基づく QA シナリオをホスト上で直接実行します。
  - 選択したシナリオセットについて、mixed flow、Vitest、Playwright のシナリオ選択を含む、トップレベルの `qa-evidence.json`、`qa-suite-summary.json`、`qa-suite-report.md` アーティファクトを書き出します。
  - `pnpm openclaw qa run --qa-profile <profile>` から起動された場合は、選択された taxonomy プロファイルのスコアカードを同じ `qa-evidence.json` に埋め込みます。`smoke-ci` は軽量エビデンス（`evidenceMode: "slim"`、エントリごとの `execution` なし）を書き出します。`release` は、厳選されたリリース準備状況の範囲を対象にします。`all` はすべてのアクティブな maturity カテゴリを選択し、完全なスコアカードアーティファクトが必要な場合は明示的な QA Profile Evidence ワークフロー起動を対象にします。
  - デフォルトでは、分離された gateway worker を使って、選択された複数のシナリオを並列実行します。`qa-channel` のデフォルト同時実行数は 4 です（選択されたシナリオ数で上限設定）。worker 数を調整するには `--concurrency <count>` を使い、従来の直列レーンには `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗終了コードなしでアーティファクトを得るには `--allow-failures` を使います。
  - provider モード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` は、実験的なフィクスチャと protocol-mock カバレッジのために、ローカルの AIMock バックエンド provider サーバーを開始します。シナリオ対応の `mock-openai` レーンを置き換えるものではありません。
- `pnpm openclaw qa coverage --match <query>`
  - シナリオ ID、タイトル、surface、coverage ID、docs refs、code refs、plugins、provider 要件を検索し、一致する suite target を出力します。
  - 変更対象の動作やファイルパスは分かっているが最小シナリオが分からない場合に、QA Lab 実行前に使います。これは助言のみです。変更される動作に基づいて、mock、live、Multipass、Matrix、transport proof を引き続き選択してください。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab を通じて live OpenAI Kitchen Sink plugin gauntlet を実行します。外部 Kitchen Sink パッケージをインストールし、plugin SDK surface inventory を検証し、`/healthz` と `/readyz` をプローブし、gateway CPU/RSS エビデンスを記録し、live OpenAI ターンを実行し、adversarial diagnostics を確認します。`OPENAI_API_KEY` などの live OpenAI 認証が必要です。hydrated Testbox セッションでは、`openclaw-testbox-env` ヘルパーが存在する場合、Testbox live-auth プロファイルを自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - gateway startup bench に加えて、小規模な mock QA Lab シナリオパック（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`）を実行し、結合された CPU 観測サマリーを `.artifacts/gateway-cpu-scenarios/` 配下に書き出します。
  - デフォルトでは継続的な hot CPU 観測のみをフラグします（`--cpu-core-warn`、デフォルト `0.9`; `--hot-wall-warn-ms`、デフォルト `30000`）。そのため、短い起動バーストは、数分続く gateway peg 回帰のように見えることなくメトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトに対して実行します。チェックアウトに新しい runtime 出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 破棄可能な Multipass Linux VM 内で同じ QA suite を実行し、`qa suite` と同じシナリオ選択および provider/model フラグを維持します。
  - live 実行では、ゲストで実用的な QA 認証入力を転送します。env ベースの provider キー、QA live provider config パス、存在する場合は `CODEX_HOME` です。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるように、リポジトリルート配下に置く必要があります。
  - 通常の QA report と summary に加え、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き出します。
- `pnpm qa:lab:up`
  - operator 形式の QA 作業用に Docker バックエンドの QA サイトを開始します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルインストールし、非対話 OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、パッケージ化された plugin runtime が起動時依存関係修復なしで読み込まれることを検証し、doctor を実行し、mock OpenAI エンドポイントに対してローカル agent ターンを 1 回実行します。
  - Discord で同じ packaged-install レーンを実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使います。
- `pnpm test:docker:session-runtime-context`
  - embedded runtime context transcript 用の決定的な built-app Docker smoke を実行します。非表示の OpenClaw runtime context が、表示されるユーザーターンに漏れず、非表示の custom message として永続化されることを検証します。その後、影響を受ける壊れた session JSONL を seed し、`openclaw doctor --fix` がバックアップ付きで active branch に書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker に OpenClaw package candidate をインストールし、installed-package オンボーディングを実行し、インストール済み CLI 経由で Telegram を設定した後、そのインストール済みパッケージを SUT Gateway として live Telegram QA レーンを再利用します。
  - wrapper はチェックアウトから `qa-lab` harness ソースのみをマウントします。インストール済みパッケージが `dist`、`openclaw/plugin-sdk`、bundled plugin runtime を所有するため、このレーンは現在のチェックアウトの plugins をテスト対象パッケージに混在させません。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。registry からインストールする代わりに解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - デフォルトでは `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` により、`qa-evidence.json` に繰り返し RTT タイミングを出力します。実行を調整するには、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。`OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` は、サンプルする Telegram QA check ID のカンマ区切りリストを受け付けます。未設定の場合、デフォルトの RTT 対応 check は `telegram-mentioned-message-reply` です。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使います。CI/release automation では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて、`OPENCLAW_QA_CONVEX_SITE_URL` と role secret を設定します。CI に `OPENCLAW_QA_CONVEX_SITE_URL` と Convex role secret が存在する場合、Docker wrapper は Convex を自動的に選択します。
  - wrapper は Docker build/install 作業の前に、ホスト上で Telegram または Convex credential env を検証します。事前認証情報セットアップを意図的にデバッグする場合のみ、`OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンでのみ共有の `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。Convex 認証情報が選択され、role が設定されていない場合、wrapper は CI では `ci`、CI 外では `maintainer` を使います。
  - GitHub Actions は、このレーンを手動 maintainer ワークフロー `NPM Telegram Beta E2E` として公開しています。merge 時には実行されません。このワークフローは `qa-live-shared` environment と Convex CI credential lease を使います。
- GitHub Actions は、1 つの candidate package に対する side-run product proof 用に `Package Acceptance` も公開しています。Git ref、公開 npm spec、HTTPS tarball URL と SHA-256、trusted-URL policy、または別の run からの tarball artifact（`source=ref|npm|url|trusted-url|artifact`）を受け付け、正規化した `openclaw-current.tgz` を `package-under-test` としてアップロードした後、既存の Docker E2E scheduler を `smoke`、`package`、`product`、`full`、または `custom` レーンプロファイルで実行します。同じ `package-under-test` アーティファクトに対して Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL proof には digest が必要で、public URL safety policy を使います。

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/private tarball mirror は、明示的な trusted-source policy を使います。

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` は trusted workflow ref から `.github/package-trusted-sources.json` を読み取り、URL 認証情報や workflow-input の private-network bypass は受け付けません。名前付き policy が bearer auth を宣言している場合は、固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret を設定します。

- Artifact proof は、別の Actions run から tarball artifact をダウンロードします。

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw build を Docker 内で pack してインストールし、OpenAI を設定した Gateway を開始した後、config 編集を通じて bundled channel/plugins を有効化します。
  - setup discovery が未設定の downloadable plugins を absent のままにすること、最初の configured doctor repair が不足している各 downloadable plugin を明示的にインストールすること、2 回目の再起動で hidden dependency repair が実行されないことを検証します。
  - 既知の古い npm baseline もインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、candidate の post-update doctor が harness 側の postinstall repair なしで legacy plugin dependency debris をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で native packaged-install update smoke を実行します。選択された各 platform は、まず要求された baseline package をインストールし、その後同じゲスト内でインストール済みの `openclaw update` コマンドを実行し、インストール済み version、update status、gateway readiness、ローカル agent ターン 1 回を検証します。
  - 1 つのゲストで反復する場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使います。summary artifact path と lane ごとの status には `--json` を使います。
  - OpenAI レーンは、デフォルトで live agent-turn proof に `openai/gpt-5.5` を使います。別の OpenAI model を検証するには、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels transport の stall が残りの testing window を消費しないように、長時間のローカル実行は host timeout でラップします。

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - このスクリプトは、ネストされた lane ログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き出します。外側の wrapper が hung していると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認してください。
  - Windows update は、cold guest では post-update doctor と package update 作業に 10 から 15 分かかることがあります。ネストされた npm debug log が進んでいれば、これは正常です。
  - この集約 wrapper を、個別の Parallels macOS、Windows、または Linux smoke レーンと並列実行しないでください。これらは VM state を共有しており、snapshot restore、package serving、または guest gateway state で衝突する可能性があります。
  - post-update proof は通常の bundled plugin surface を実行します。speech、image generation、media understanding などの capability facade は、agent ターン自体が単純な text response のみを確認する場合でも、bundled runtime API を通じて読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接プロトコルのスモークテスト用に、ローカル AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker-backed Tuwunel ホームサーバーに対して Matrix ライブ QA レーンを実行します。ソースチェックアウト専用です - パッケージ化されたインストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、環境変数、アーティファクトレイアウト:
    [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 環境変数の driver と SUT ボットトークンを使い、実際のプライベートグループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、および
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報用に `--credential-source convex` をサポートします。
    デフォルトでは env モードを使用するか、プールされたリースを使うには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - デフォルトは canary、メンションゲート、コマンドアドレッシング、`/status`、
    ボット間のメンション付き返信、コアのネイティブコマンド返信をカバーします。
    `mock-openai` のデフォルトは、決定的な返信チェーンと
    Telegram 最終メッセージストリーミングのリグレッションもカバーします。`session_status` などの任意プローブには `--list-scenarios` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトを得るには `--allow-failures` を使用します。
  - 同じプライベートグループ内の 2 つの異なるボットが必要で、SUT ボットは Telegram ユーザー名を公開している必要があります。
  - 安定したボット間観測のため、両方のボットで `@BotFather` の Bot-to-Bot Communication Mode を有効にし、driver ボットがグループのボットトラフィックを観測できるようにしてください。
  - `.artifacts/qa-e2e/...` 配下に Telegram QA レポート、サマリー、`qa-evidence.json` を書き込みます。返信シナリオには、driver の送信リクエストから観測された SUT 返信までの RTT が含まれます。

`Mantis Telegram Live` は、このレーンを囲む PR 証拠ラッパーです。Convex でリースされた Telegram 認証情報を使って候補 ref を実行し、Crabbox デスクトップブラウザーで秘匿化された QA レポート/証拠バンドルをレンダリングし、MP4 証拠を記録し、モーショントリミング済み GIF を生成し、アーティファクトバンドルをアップロードし、`pr_number` が設定されている場合は Mantis GitHub App を通じてインライン PR 証拠を投稿します。メンテナーは Actions UI の `Mantis Scenario`（`scenario_id: telegram-live`）から、または pull request コメントから直接開始できます。

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` は、PR の視覚的証拠用のエージェント型ネイティブ Telegram Desktop before/after ラッパーです。自由形式の `instructions` を指定して Actions UI から、`Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）を通じて、または PR コメントから開始します。

```text
@openclaw-mantis telegram desktop proof
```

Mantis エージェントは PR を読み、変更を証明する Telegram 上で見える挙動を判断し、baseline と候補 ref で実ユーザー Crabbox Telegram Desktop 証拠レーンを実行し、ネイティブ GIF が有用になるまで反復し、ペアの `motionPreview` マニフェストを書き込み、`pr_number` が設定されている場合は Mantis GitHub App を通じて同じ 2 カラム GIF テーブルを投稿します。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux デスクトップをリースまたは再利用し、ネイティブ Telegram Desktop をインストールし、リースされた Telegram SUT ボットトークンで OpenClaw を構成し、Gateway を起動し、表示中の VNC デスクトップからスクリーンショット/MP4 証拠を記録します。
  - デフォルトは `--credential-source convex` なので、ワークフローに必要なのは Convex ブローカーシークレットのみです。`pnpm openclaw qa telegram` と同じ `OPENCLAW_QA_TELEGRAM_*` 変数で `--credential-source env` を使用します。
  - Telegram Desktop には引き続きユーザーログイン/プロファイルが必要です。ボットトークンは OpenClaw のみを構成します。base64 `.tgz` プロファイルアーカイブには `--telegram-profile-archive-env <name>` を使用するか、`--keep-lease` を使用して VNC 経由で一度手動ログインします。
  - 出力ディレクトリ配下に `mantis-telegram-desktop-builder-report.md`、
    `mantis-telegram-desktop-builder-summary.json`、
    `telegram-desktop-builder.png`、および `telegram-desktop-builder.mp4` を書き込みます。

ライブトランスポートレーンは、新しいトランスポートが逸脱しないように 1 つの標準契約を共有します。レーンごとのカバレッジマトリクスは
[QA 概要 - ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。
`qa-channel` は広範な合成スイートであり、このマトリクスには含まれません。

### Convex 経由の共有 Telegram 認証情報（v1）

ライブトランスポート QA で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA lab は Convex-backed プールから排他的リースを取得し、レーン実行中にそのリースへ Heartbeat を送り、シャットダウン時にリースを解放します。このセクション名は Discord、Slack、WhatsApp サポートより前のものです。リース契約は種類をまたいで共有されます。

参照 Convex プロジェクトスキャフォールド: `qa/convex-credential-broker/`

必須環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用のシークレット 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロール選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルト `ci`、それ以外では `maintainer`）

任意環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用する必要があります。

メンテナー管理コマンド（プールの add/remove/list）には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー用 CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を出力せずに Convex サイト URL、ブローカーシークレット、エンドポイントプレフィックス、HTTP タイムアウト、admin/list 到達性を確認します。スクリプトや CI ユーティリティで機械可読出力を得るには `--json` を使用します。

デフォルトエンドポイント契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）。
リクエストは `Authorization: Bearer <role secret>` ヘッダーで認証します。以下の body ではそのヘッダーを省略しています。

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
- `groupId`、`testerUserId`、および `telegramApiId` は数値文字列である必要があります。
- `tdlibArchiveSha256` と `desktopTdataArchiveSha256` は SHA-256 hex 文字列である必要があります。
- `kind: "telegram-user"` は Mantis Telegram Desktop proof ワークフロー用に予約されています。汎用 QA Lab レーンはこれを取得してはいけません。

ブローカー検証済みマルチチャネルペイロード:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack レーンもプールからリースできますが、Slack ペイロード検証は現在ブローカーではなく Slack QA runner にあります。Slack 行には
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
を使用します。

### QA へのチャネル追加

新しいチャネルアダプターのアーキテクチャとシナリオヘルパー名は
[QA 概要 - チャネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。
最小要件: 共有 `qa-lab` ホストシーム上でトランスポート runner を実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成します。

## テストスイート（どこで何が実行されるか）

スイートは「現実性が高くなる」（そして flaky/コストも高くなる）ものとして考えてください。

### ユニット / 統合（デフォルト）

- コマンド: `pnpm test`
- Config: ターゲット指定のない実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの config に展開する場合があります
- ファイル: `src/**/*.test.ts`、
  `packages/**/*.test.ts`、および `test/**/*.test.ts` 配下の core/unit インベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- スコープ:
  - 純粋なユニットテスト
  - インプロセス統合テスト（gateway auth、routing、tooling、parsing、config）
  - 既知のバグに対する決定的なリグレッション
- 期待事項:
  - CI で実行されます
  - 実キーは不要です
  - 高速で安定しているべきです
  - resolver と public-surface loader のテストは、実際のバンドル Plugin ソース API ではなく、生成された小さな Plugin fixture で広範な `api.js` と
    `runtime-api.js` のフォールバック挙動を証明する必要があります。実際の Plugin API ロードは、Plugin 所有の contract/integration スイートに属します。

ネイティブ依存関係ポリシー:

- デフォルトのテストインストールでは、任意のネイティブ Discord opus ビルドをスキップします。Discord voice はバンドルされた `libopus-wasm` を使用し、ローカルテストと Testbox レーンがネイティブアドオンをコンパイルしないように `@discordjs/opus` は `allowBuilds` で無効のままにします。
- ネイティブ opus 性能の比較は、デフォルトの OpenClaw install/test ループではなく `libopus-wasm` benchmark repo で行います。デフォルトの `allowBuilds` で `@discordjs/opus` を `true` に設定しないでください。それにより無関係な install/test ループがネイティブコードをコンパイルするようになります。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ付きレーン">

    - ターゲットを指定しない `pnpm test` は、巨大な単一のネイティブルートプロジェクトプロセスではなく、13 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-tooling`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/Plugin 作業が無関係なスイートを圧迫することを避けられます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。複数シャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付きレーンに展開します。直接のテスト編集、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフの依存先が対象です。config/setup/package の編集では、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使わない限り、広範囲のテストは実行されません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートなローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。release metadata のみのバージョン更新では、対象を絞った version/config/root-dependency チェックを実行し、最上位の version フィールド以外の package 変更を拒否する guard が付きます。
    - Live Docker ACP ハーネスの編集では、Live Docker 認証スクリプトのシェル構文と Live Docker スケジューラのドライランという、対象を絞ったチェックを実行します。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定される場合のみ含まれます。dependency、export、version、その他の package surface の編集では、引き続きより広い guard が使われます。
    - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および同様の純粋な utility 領域の import が軽いユニットテストは `unit-fast` レーンを通ります。このレーンは `test/setup-openclaw-runtime.ts` をスキップします。stateful/runtime-heavy なファイルは既存レーンに残ります。
    - 選択された `plugin-sdk` と `commands` の helper ソースファイルも、changed-mode の実行をそれらの軽量レーン内の明示的な兄弟テストにマップするため、helper の編集でそのディレクトリ全体の重いスイートを再実行せずに済みます。
    - `auto-reply` には、トップレベル core helpers、トップレベル `reply.*` integration tests、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、import が重い 1 つのバケットが Node の末尾全体を占有しないようにしています。
    - 通常の PR/main CI は、バンドル Plugin の一括 sweep とリリース専用の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補に対して、Plugin が重いそれらのスイート用に別個の `Plugin Prerelease` 子ワークフローを dispatch します。

  </Accordion>

  <Accordion title="組み込み runner のカバレッジ">

    - message-tool discovery input または Compaction runtime
      context を変更するときは、両方のレベルのカバレッジを維持してください。
    - 純粋な routing と normalization
      boundary には、対象を絞った helper regression を追加してください。
    - 組み込み runner integration スイートを健全に保ってください:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, and
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - これらのスイートは、スコープ付き id と Compaction の挙動が実際の
      `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。helper のみのテストは、
      それらの integration パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool と isolation のデフォルト">

    - ベース Vitest config のデフォルトは `threads` です。
    - 共有 Vitest config は `isolate: false` を固定し、
      root projects、e2e、live configs 全体で非 isolation runner を使用します。
    - root UI レーンは `jsdom` setup と optimizer を維持しますが、
      共有の非 isolation runner 上でも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest config から同じ `threads` + `isolate: false`
      デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 compile churn を減らすため、
      デフォルトで Vitest 子 Node プロセスに `--no-maglev` を追加します。
      標準の V8 の挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
    - `scripts/run-vitest.mjs` は、明示的な非 watch Vitest 実行で
      stdout または stderr の出力が 5 分間ない場合に終了します。意図的に無音の調査で
      watchdog を無効にするには、`OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、diff がどの architecture レーンをトリガーするかを表示します。
    - pre-commit hook は formatting のみです。整形済みファイルを再ステージし、
      lint、typecheck、tests は実行しません。
    - スマートなローカルチェックゲートが必要な場合は、handoff または push の前に
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付きレーンを通ります。agent が
      harness、config、package、または contract の編集により広い Vitest カバレッジが本当に必要だと判断した場合にのみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じ routing
      挙動を維持し、worker cap だけを高くします。
    - ローカル worker の auto-scaling は意図的に保守的で、ホストの load average がすでに高い場合は
      back off するため、複数の同時 Vitest 実行による影響はデフォルトで小さくなります。
    - ベース Vitest config は、test wiring が変わったときにも changed-mode の再実行が正しく保たれるよう、
      projects/config files を `forceRerunTriggers` としてマークします。
    - config は、サポートされるホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。
      直接 profiling するための明示的な単一 cache location には
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` は、Vitest import-duration reporting と
      import-breakdown output を有効にします。
    - `pnpm test:perf:imports:changed` は、同じ profiling view を
      `origin/main` 以降に変更されたファイルにスコープします。
    - シャード timing data は `.artifacts/vitest-shard-timings.json` に書き込まれます。
      Whole-config runs は config path を key として使用します。include-pattern CI
      shards は shard name を追加するため、filtered shards を個別に追跡できます。
    - ある hot test が依然として startup imports に大半の時間を費やしている場合は、
      heavy dependencies を狭いローカル `*.runtime.ts` seam の背後に置き、
      runtime helpers を `vi.mock(...)` に渡すためだけに deep-import するのではなく、
      その seam を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、routing された
      `test:changed` を、その committed diff に対するネイティブルートプロジェクトパスと比較し、
      wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更済みファイルリストを
      `scripts/test-projects.mjs` と root Vitest config に通して routing することで、
      現在の dirty tree を benchmark します。
    - `pnpm test:perf:profile:main` は、Vitest/Vite startup と transform overhead のための
      main-thread CPU profile を書き込みます。
    - `pnpm test:perf:profile:runner` は、file parallelism を無効にした unit suite の
      runner CPU+heap profiles を書き込みます。

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- Command: `pnpm test:stability:gateway`
- Config: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts`, and `test/vitest/vitest.infra.config.ts`, each forced to one worker
- Scope:
  - デフォルトで diagnostics を有効にした実際の loopback Gateway を開始します
  - synthetic gateway message、memory、large-payload churn を diagnostic event path 経由で駆動します
  - Gateway WS RPC 経由で `diagnostics.stability` を問い合わせます
  - diagnostic stability bundle persistence helpers をカバーします
  - recorder が bounded のままであること、synthetic RSS samples が pressure budget 未満にとどまること、per-session queue depths がゼロに戻って drain されることを assert します
- Expectations:
  - CI-safe かつ keyless
  - stability-regression follow-up 用の狭いレーンであり、完全な Gateway スイートの代替ではありません

### E2E (repo aggregate)

- Command: `pnpm test:e2e`
- Scope:
  - gateway smoke E2E レーンを実行します
  - mocked Control UI browser E2E レーンを実行します
- Expectations:
  - CI-safe かつ keyless
  - Playwright Chromium がインストールされている必要があります

### E2E (gateway smoke)

- Command: `pnpm test:e2e:gateway`
- Config: `test/vitest/vitest.e2e.config.ts`
- Files: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, and bundled-plugin E2E tests under `extensions/`
- Runtime defaults:
  - リポジトリの他部分と一致するように、Vitest `threads` と `isolate: false` を使用します。
  - adaptive workers を使用します（CI: 最大 2、local: デフォルト 1）。
  - console I/O overhead を減らすため、デフォルトで silent mode で実行します。
- Useful overrides:
  - worker count を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - verbose console output を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- Scope:
  - multi-instance gateway の end-to-end 挙動
  - WebSocket/HTTP surfaces、node pairing、より重い networking
- Expectations:
  - CI で実行されます（pipeline で有効な場合）
  - 実際の keys は不要です
  - unit tests より moving parts が多いです（遅くなる可能性があります）

### E2E (Control UI mocked browser)

- Command: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Files: `ui/src/**/*.e2e.test.ts`
- Scope:
  - Vite Control UI を開始します
  - Playwright 経由で実際の Chromium page を駆動します
  - Gateway WebSocket を deterministic な in-browser mocks に置き換えます
- Expectations:
  - `pnpm test:e2e` の一部として CI で実行されます
  - 実際の Gateway、agents、または provider keys は不要です
  - browser dependency が存在する必要があります（`pnpm --dir ui exec playwright install chromium`）

### E2E: OpenShell backend smoke

- Command: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - active local OpenShell gateway を再利用します
  - temporary local Dockerfile から sandbox を作成します
  - 実際の `sandbox ssh-config` + SSH exec を通じて OpenClaw の OpenShell backend を演習します
  - sandbox fs bridge を通じて remote-canonical filesystem の挙動を検証します
- Expectations:
  - opt-in のみです。デフォルトの `pnpm test:e2e` 実行には含まれません
  - local `openshell` CLI と動作する Docker daemon が必要です
  - active local OpenShell gateway とその config source が必要です
  - 隔離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後 test sandbox を破棄します
- Useful overrides:
  - broader e2e suite を手動実行する際にテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI binary または wrapper script を指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - registered gateway config を隔離された test に公開するには `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - host policy fixture が使用する Docker gateway IP を override するには `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Live (real providers + real models)

- コマンド: `pnpm test:live`
- 設定: `test/vitest/vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル済みPluginライブテスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で _今日_ 本当に動作するか？」
  - プロバイダーの形式変更、ツール呼び出しの癖、認証の問題、レート制限の挙動を検出する
- 期待事項:
  - 設計上、CIで安定するものではない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - コストが発生する / レート制限を消費する
  - 「すべて」を実行するのではなく、絞り込んだサブセットの実行を推奨
- ライブ実行では、すでにエクスポート済みのAPIキーとステージ済みの認証プロファイルを使用する。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定/認証素材を一時テストホームにコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更することはない。
- ライブテストで実際のホームディレクトリを意図的に使用する必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定する。
- `pnpm test:live` はデフォルトで静かなモードになる。`[live] ...` の進捗出力は維持し、gatewayのブートストラップログ/Bonjourの雑音をミュートする。完全な起動ログを戻したい場合は、`OPENCLAW_LIVE_TEST_QUIET=0` を設定する。
- APIキーのローテーション（プロバイダー固有）: カンマ/セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、`OPENCLAW_LIVE_*_KEY` でライブごとの上書きを設定する。テストはレート制限レスポンス時に再試行する。
- 進捗/Heartbeat出力:
  - ライブスイートは進捗行をstderrに出力するため、Vitestのコンソールキャプチャが静かな場合でも、長いプロバイダー呼び出しが動作中であることを視認できる。
  - `test/vitest/vitest.live.config.ts` はVitestのコンソール割り込みを無効にするため、ライブ実行中にプロバイダー/gatewayの進捗行が即時にストリームされる。
  - ダイレクトモデルのHeartbeatは `OPENCLAW_LIVE_HEARTBEAT_MS` で調整する。
  - gateway/プローブのHeartbeatは `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整する。

## どのスイートを実行すべきか？

この判断表を使用する:

- ロジック/テストを編集する場合: `pnpm test` を実行する（大きく変更した場合は `pnpm test:coverage` も実行）
- gatewayネットワーク / WSプロトコル / ペアリングに触れる場合: `pnpm test:e2e` を追加する
- 「自分のボットが落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグする場合: 絞り込んだ `pnpm test:live` を実行する

## ライブ（ネットワークに触れる）テスト

ライブモデルマトリクス、CLIバックエンドスモーク、ACPスモーク、Codex app-server
ハーネス、およびすべてのメディアプロバイダーライブテスト（Deepgram、BytePlus、ComfyUI、
image、music、video、mediaハーネス）に加え、ライブ実行の認証情報処理については

- [ライブスイートのテスト](/ja-JP/help/testing-live) を参照する。専用の更新および
  Plugin検証チェックリストについては、
  [更新とPluginのテスト](/ja-JP/help/testing-updates-plugins) を参照する。

## Dockerランナー（任意の「Linuxで動作する」チェック）

これらのDockerランナーは2つのバケットに分かれる:

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリのDockerイメージ内で対応するプロファイルキーのライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカル設定ディレクトリ、ワークスペース、任意のプロファイルenvファイルをマウントする。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles`。
- Dockerライブランナーは、必要に応じて独自の実用的な上限を保持する:
  `test:docker:live-models` は、キュレーション済みのサポート対象高シグナルセットをデフォルトとし、
  `test:docker:live-gateway` は `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` をデフォルトとする。明示的により小さい上限またはより大きいスキャンを望む場合は、`OPENCLAW_LIVE_MAX_MODELS`
  またはgatewayのenv varを設定する。
- `test:docker:all` は `test:docker:live-build` 経由でライブDockerイメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じてOpenClawをnpm tarballとして一度パックし、その後2つの `scripts/e2e/Dockerfile` イメージをビルド/再利用する。ベア画像は、install/update/plugin-dependencyレーン用のNode/Gitランナーのみで、これらのレーンは事前ビルド済みtarballをマウントする。機能画像は、built-app機能レーンのために同じtarballを `/app` にインストールする。Dockerレーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行する。集約は重み付きローカルスケジューラーを使用する。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限は重いライブ、npm-install、マルチサービスのレーンがすべて同時に開始されないようにする。単一レーンがアクティブな上限より重い場合でも、プールが空ならスケジューラーはそのレーンを開始でき、その後キャパシティが再び利用可能になるまで単独で実行し続ける。デフォルトは10スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`。Dockerホストに余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`（およびその他の `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` 上書き）を調整する。ランナーはデフォルトでDockerプリフライトを実行し、古いOpenClaw E2Eコンテナを削除し、30秒ごとに状態を出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、以後の実行でそのタイミングを使って長いレーンから開始する。Dockerをビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、パッケージ/イメージ要件、認証情報のCIプランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用する。
- `Package Acceptance` は、「このインストール可能なtarballは製品として動作するか？」を確認するGitHubネイティブのパッケージゲート。`source=npm`、`source=ref`、`source=url`、`source=trusted-url`、または `source=artifact` から候補パッケージを1つ解決し、それを `package-under-test` としてアップロードし、選択されたrefを再パックする代わりに、その正確なtarballに対して再利用可能なDocker E2Eレーンを実行する。プロファイルは範囲の広さ順に `smoke`、`package`、`product`、`full`（さらに明示的なレーンリスト用の `custom`）がある。パッケージ/更新/Plugin契約、公開済みアップグレード生存者マトリクス、リリースデフォルト、失敗トリアージについては、[更新とPluginのテスト](/ja-JP/help/testing-updates-plugins) を参照する。
- ビルドおよびリリースチェックは、tsdown後に `scripts/check-cli-bootstrap-imports.mjs` を実行する。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的ビルドグラフをたどり、コマンドディスパッチ前のブートストラップグラフが外部パッケージ（Commander、プロンプトUI、undici、ロギング、および同様の起動時に重い依存関係はすべて該当）を静的にインポートしている場合は失敗する。また、バンドルされたgateway実行チャンクを70 KBに制限し、そのチャンクから既知のコールドgatewayパス（`control-ui-assets`、`diagnostic-stability-bundle`、`onboard-helpers`、`process-respawn`、`restart-sentinel`、`server-close`、`server-reload-handlers`）を静的にインポートすることを拒否する。`scripts/release-check.ts` は別途、パックされたCLIを `--help`、`onboard --help`、`doctor --help`、`status --json --timeout 1`、`config schema`、`models list --provider openai` でスモークテストする。
- Package Acceptanceのレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）で上限が設定されている。このカットオフまでは、ハーネスは出荷済みパッケージのメタデータ欠落のみを許容する。具体的には、private QAインベントリエントリの省略、`gateway install --wrapper` の欠落、tarball由来のgitフィクスチャ内のパッチファイル欠落、永続化された `update.channel` の欠落、レガシーPluginインストールレコードの場所、マーケットプレイスのインストールレコード永続化欠落、および `plugins update` 中の設定メタデータ移行。`2026.4.25` より後のパッケージでは、これらのパスは厳格な失敗となる。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1つ以上の実コンテナを起動し、上位の統合パスを検証する。
- `scripts/lib/openclaw-e2e-instance.sh` を通じてパック済みOpenClaw tarballをインストールするDocker/Bash E2Eレーンは、`npm install` を `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（デフォルト `600s`。デバッグのためにラッパーを無効にするには `0` を設定）で制限する。

ライブモデルDockerランナーは、必要なCLI認証ホームのみ
（実行が絞り込まれていない場合はサポート対象のすべて）もバインドマウントし、その後実行前に
コンテナホームへコピーするため、外部CLI OAuthはホストの認証ストアを変更せずに
トークンを更新できる:

- ダイレクトモデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACPバインドスモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`。デフォルトでClaude、Codex、Geminiを対象とし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` による厳格なDroid/OpenCodeカバレッジを含む）
- CLIバックエンドスモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-serverハーネススモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- オブザーバビリティスモーク: `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke`、および `pnpm qa:observability:smoke` はprivate QAソースチェックアウトレーン。npm tarballはQA Labを省略するため、意図的にパッケージDockerリリースレーンには含めていない。
- Open WebUIライブスモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なスキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Npm tarballのオンボーディング/チャンネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パック済みOpenClaw tarballをDocker内にグローバルインストールし、env-refオンボーディング経由でOpenAIを、デフォルトでTelegramも設定し、doctorを実行し、モックされたOpenAIエージェントターンを1回実行する。事前ビルド済みtarballを再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使用し、ホストでの再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を使用し、チャンネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使用する。

- リリースユーザージャーニースモーク: `pnpm test:docker:release-user-journey` は、パック済みの OpenClaw tarball をクリーンな Docker ホームにグローバルインストールし、オンボーディングを実行し、モックされた OpenAI provider を設定し、agent turn を実行し、外部Pluginをインストール/アンインストールし、ローカル fixture に対して ClickClack を設定し、送信/受信メッセージングを検証し、Gateway を再起動し、doctor を実行します。
- リリース typed オンボーディングスモーク: `pnpm test:docker:release-typed-onboarding` は、パック済み tarball をインストールし、実際の TTY 経由で `openclaw onboard` を操作し、OpenAI を env-ref provider として設定し、生のキーが永続化されないことを検証し、モックされた agent turn を実行します。
- リリースメディア/メモリスモーク: `pnpm test:docker:release-media-memory` は、パック済み tarball をインストールし、PNG 添付からの画像理解、OpenAI 互換の画像生成出力、メモリ検索の想起、Gateway 再起動後の想起の維持を検証します。
- リリースアップグレードユーザージャーニースモーク: `pnpm test:docker:release-upgrade-user-journey` は、デフォルトで候補 tarball より古い最新の公開済みベースラインをインストールし、公開済みパッケージ上で provider/Plugin/ClickClack 状態を設定し、候補 tarball にアップグレードしてから、コアの agent/Plugin/channel ジャーニーを再実行します。より古い公開済みベースラインが存在しない場合は、候補バージョンを再利用します。`OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` でベースラインを上書きします。
- リリースPluginマーケットプレイススモーク: `pnpm test:docker:release-plugin-marketplace` は、ローカル fixture マーケットプレイスからインストールし、インストール済みPluginを更新し、アンインストールし、インストールメタデータが削除されて Plugin CLI が消えることを検証します。
- Skill インストールスモーク: `pnpm test:docker:skill-install` は、パック済みの OpenClaw tarball を Docker にグローバルインストールし、設定でアップロード済みアーカイブのインストールを無効化し、検索から現在のライブ ClawHub skill slug を解決し、`openclaw skills install` でインストールし、インストール済み skill と `.clawhub` の origin/lock メタデータを検証します。
- 更新チャネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker にグローバルインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャネルと Plugin の更新後動作を検証し、その後パッケージ `stable` に戻して更新ステータスを確認します。
- アップグレードサバイバースモーク: `pnpm test:docker:upgrade-survivor` は、agents、channel config、Plugin allowlists、古い Plugin 依存関係状態、既存の workspace/session ファイルを含む、汚れた旧ユーザー fixture の上にパック済みの OpenClaw tarball をインストールします。ライブ provider や channel key なしでパッケージ更新と非対話 doctor を実行し、その後 loopback Gateway を起動して、設定/状態の保持と起動/ステータス予算を確認します。
- 公開済みアップグレードサバイバースモーク: `pnpm test:docker:published-upgrade-survivor` は、デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルを seed し、組み込みのコマンドレシピでそのベースラインを設定し、結果の設定を検証し、その公開済みインストールを候補 tarball に更新し、非対話 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、設定済み intent、状態保持、起動、`/healthz`、`/readyz`、RPC ステータス予算を確認します。1 つのベースラインは `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きし、集約スケジューラーに `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような正確なローカルベースラインを展開させ、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` で `reported-issues` のような issue 形状の fixture を展開させます。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれます。Package Acceptance はそれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` のようなメタベースライントークンを解決し、Full Release Validation は release-soak package gate を `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストの transcript 永続化と、影響を受けた重複 prompt-rewrite branch の doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在の tree を pack し、隔離された home で `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み image provider を返すことを検証します。ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` を使い、ビルド済み Docker image から `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使います。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各コンテナ間で 1 つの npm cache を共有します。更新スモークは、候補 tarball へアップグレードする前の stable ベースラインとして、デフォルトで npm `latest` を使います。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke workflow の `update_baseline_version` input で上書きします。非 root インストーラーチェックでは、root 所有の cache entry が user-local install の動作を覆い隠さないように、隔離された npm cache を維持します。ローカル再実行間で root/update/direct-npm cache を再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は、`OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` で重複する direct-npm グローバル更新をスキップします。直接の `npm install -g` カバレッジが必要な場合は、その env なしでスクリプトをローカル実行します。
- agents delete shared workspace CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) は、デフォルトで root Dockerfile image をビルドし、隔離されたコンテナ home に 1 つの workspace を持つ 2 つの agent を seed し、`agents delete --json` を実行し、有効な JSON と workspace 保持動作を検証します。install-smoke image を再利用するには、`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使います。
- Gateway ネットワーク (2 つのコンテナ、WS 認証 + ヘルス): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot スモーク: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) は、ソース E2E image と Chromium layer をビルドし、生 CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP role snapshot が link URL、cursor-promoted clickable、iframe ref、frame metadata をカバーすることを検証します。
- OpenAI Responses web_search minimal reasoning 回帰: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) は、モックされた OpenAI server を Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後 provider schema reject を強制して、生の detail が Gateway logs に出ることを確認します。
- MCP channel bridge (seed 済み Gateway + stdio bridge + 生 Claude notification-frame スモーク): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw bundle MCP tools (実際の stdio MCP server + 埋め込み OpenClaw profile allow/deny スモーク): `pnpm test:docker:agent-bundle-mcp-tools` (スクリプト: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (実際の Gateway + 隔離 cron と one-shot subagent 実行後の stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (ローカルパス、`file:`、hoisted dependencies を持つ npm registry、不正な npm package metadata、git moving refs、ClawHub kitchen-sink、marketplace updates、Claude-bundle enable/inspect の install/update スモーク): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトの kitchen-sink package/runtime ペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を設定します。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub fixture server を使います。
- Plugin 更新 unchanged スモーク: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix スモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、bare container にパック済み OpenClaw tarball をインストールし、npm Plugin をインストールし、enable/disable を切り替え、ローカル npm registry 経由で upgrade/downgrade し、インストール済みコードを削除し、その後各 lifecycle phase の RSS/CPU metrics をログに記録しながら、uninstall が stale state を引き続き削除することを検証します。
- Config reload metadata スモーク: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` は、ローカルパス、`file:`、hoisted dependencies を持つ npm registry、git moving refs、ClawHub fixtures、marketplace updates、Claude-bundle enable/inspect の install/update スモークをカバーします。`pnpm test:docker:plugin-update` は、インストール済みPluginの unchanged update behavior をカバーします。`pnpm test:docker:plugin-lifecycle-matrix` は、resource-tracked npm Plugin の install、enable、disable、upgrade、downgrade、missing-code uninstall をカバーします。

共有 functional image を手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のような suite 固有の image override は、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有 image を指している場合、スクリプトはそれがまだローカルにない場合に pull します。QR とインストーラーの Docker テストは、共有 built-app runtime ではなく package/install behavior を検証するため、独自の Dockerfile を維持します。

live-model Docker runner は、現在の checkout も read-only で bind-mount し、
コンテナ内の一時 workdir に stage します。これにより runtime image を小さく保ちながら、
正確なローカル source/config に対して Vitest を実行できます。staging step は、
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、app-local `.build`、Gradle output directories
などの大きなローカル専用 cache や app build output をスキップするため、Docker live runs が
マシン固有の artifact のコピーに何分も費やすことはありません。また、コンテナ内で実際の
Telegram/Discord などの channel worker を gateway live probe が起動しないように、
`OPENCLAW_SKIP_CHANNELS=1` も設定します。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker lane から
gateway live coverage を絞り込む、または除外する必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。

`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換 HTTP endpoint が有効な
OpenClaw gateway container を起動し、その gateway に対して pinned Open WebUI container を起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開することを検証し、
その後 Open WebUI の `/api/chat/completions` proxy 経由で実際の chat request を送信します。
Open WebUI のサインインと model discovery の後で停止すべき release-path CI check には、
`OPENWEBUI_SMOKE_MODE=models` を設定します。初回実行は、Docker が Open WebUI image を pull する必要があったり、
Open WebUI が独自の cold-start setup を完了する必要があったりするため、目に見えて遅くなる場合があります。
この lane は、process environment、staged auth profiles、または明示的な
`OPENCLAW_PROFILE_FILE` を通じて提供される、使用可能な live model key を想定しています。
成功した実行では、`{ "ok": true, "model": "openclaw/default", ... }` のような小さな JSON payload が出力されます。

`test:docker:mcp-channels` は意図的に決定的であり、実際の Telegram、Discord、iMessage アカウントは必要ありません。シード済みの Gateway コンテナを起動し、`openclaw mcp serve` を生成する 2 つ目のコンテナを開始してから、ルーティングされた会話の検出、トランスクリプト読み取り、添付ファイルメタデータ、ライブイベントキューの挙動、送信ルーティング、実際の stdio MCP ブリッジ越しの Claude 形式のチャンネル + 権限通知を検証します。通知チェックは生の stdio MCP フレームを直接検査するため、このスモークは特定のクライアント SDK がたまたま表面化するものだけでなく、ブリッジが実際に送出するものを検証します。

`test:docker:agent-bundle-mcp-tools` は決定的であり、ライブモデルキーは必要ありません。リポジトリの Docker イメージをビルドし、コンテナ内で実際の stdio MCP プローブサーバーを起動し、そのサーバーを埋め込み OpenClaw バンドル MCP ランタイム経由で実体化し、ツールを実行してから、`coding` と `messaging` は `bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` はそれらをフィルターすることを検証します。

`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデルキーは必要ありません。実際の stdio MCP プローブサーバーを備えたシード済み Gateway を起動し、隔離された cron ターンと `sessions_spawn` のワンショット子ターンを実行してから、各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP 自然言語スレッドスモーク（CI ではありません）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフローのために保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な env vars:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...` はマウントされ、テスト実行前に読み込まれます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な config/workspace dir を使用し、外部 CLI 認証マウントなしで、`OPENCLAW_PROFILE_FILE` から読み込まれた env vars のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`、ただし実行がすでに CI/管理対象のバインド dir を使用している場合を除く）は、Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証 dirs/files は `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` へコピーされます
  - デフォルト dirs（実行が特定のプロバイダーに絞り込まれていない場合に使用）: `.factory`, `.gemini`, `.minimax`
  - デフォルト files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定される必要な dirs/files のみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きします
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` は実行を絞り込むために使用します
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` はコンテナ内のプロバイダーをフィルターするために使用します
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用するために使用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報が（env ではなく）プロファイルストアから来ることを保証するために使用します
- `OPENCLAW_OPENWEBUI_MODEL=...` は Open WebUI スモーク用に gateway が公開するモデルを選択するために使用します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は Open WebUI スモークで使用される nonce チェックプロンプトを上書きするために使用します
- `OPENWEBUI_IMAGE=...` は固定された Open WebUI イメージタグを上書きするために使用します

## Docs sanity

docs 編集後に docs チェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全な Mintlify アンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフライン回帰（CI セーフ）

これらは実プロバイダーなしの「実パイプライン」回帰です:

- Gateway ツール呼び出し（モック OpenAI、実 gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: 「gateway エージェントループ経由でモック OpenAI ツール呼び出しをエンドツーエンドで実行する」）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、config 書き込み + auth 強制）: `src/gateway/gateway.test.ts`（ケース: 「ws 経由で ウィザード を実行し、auth token config を書き込む」）

## エージェント信頼性評価（skills）

「エージェント信頼性評価」のように振る舞う CI セーフなテストがすでにいくつかあります:

- 実 gateway + エージェントループを通したモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と config 効果を検証するエンドツーエンドの ウィザード フロー（`src/gateway/gateway.test.ts`）。

skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **意思決定:** プロンプトに skills が列挙されているとき、エージェントは正しい skill を選ぶ（または無関係なものを避ける）か?
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必要な steps/args に従うか?
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界をアサートするマルチターンシナリオ。

将来の評価はまず決定的に保つべきです:

- モックプロバイダーを使用し、ツール呼び出し + 順序、skill ファイル読み取り、セッション配線をアサートするシナリオランナー。
- skill に焦点を当てた小さなシナリオスイート（使用 vs 回避、ゲーティング、プロンプトインジェクション）。
- オプションのライブ評価（オプトイン、env gated）は、CI セーフなスイートが整った後にのみ追加します。

## 契約テスト（plugin と channel shape）

契約テストは、登録済みのすべての plugin と channel がそのインターフェース契約に準拠していることを検証します。検出されたすべての plugins を反復処理し、shape と挙動のアサーションのスイートを実行します。デフォルトの `pnpm test` unit lane は、これらの共有 seam と smoke files を意図的にスキップします。共有 channel または provider surfaces に触れた場合は、契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- Channel 契約のみ: `pnpm test:contracts:channels`
- Provider 契約のみ: `pnpm test:contracts:plugins`

### Channel 契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります。現在のトップレベルカテゴリ:

- **channel-catalog** - bundled/registry channel catalog entry metadata
- **plugin**（registry-backed、sharded）- 基本的な plugin registration shape
- **surfaces-only**（registry-backed、sharded）- `actions`、`setup`、`status`、`outbound`、`messaging`、`threading`、`directory`、`gateway` の surface ごとの shape checks
- **session-binding**（registry-backed）- session binding behavior
- **outbound-payload** - message payload structure と normalization
- **group-policy**（fallback）- channel ごとの default group policy enforcement
- **threading**（registry-backed、sharded）- thread id handling
- **directory**（registry-backed、sharded）- directory/roster API
- **registry** と **plugins-core.\*** - channel plugin registry、loader、config-write authorization internals

これらのスイートで使用される inbound dispatch-capture と outbound-payload harness helpers は、`src/plugin-sdk/channel-contract-testing.ts`（npm-excluded、public SDK subpath ではありません）を通じて内部公開されています。このディレクトリには単独の `inbound.contract.test.ts` ファイルはありません。

### Provider 契約

`src/plugins/contracts/*.contract.test.ts` にあります。現在のカテゴリは次を含みます:

- **shape** - plugin manifest、API、runtime export shape
- **plugin-registration**（+ parallel）- manifest registration cases
- **package-manifest** - package manifest requirements
- **loader** - plugin loader setup/teardown behavior
- **registry** - plugin contract registry contents と lookup
- **providers** - bundled providers 全体での共有 provider behavior と web-search providers
- **auth-choice** - auth choice metadata と setup behavior
- **provider-catalog-deprecation** - deprecated provider catalog metadata
- **wizard.choice-resolution**、**wizard.model-picker**、**wizard.setup-options** - provider setup wizard contracts
- **embedding-provider**、**memory-embedding-provider**、**web-fetch-provider**、**tts** - capability-specific provider contracts
- **session-actions**、**session-attachments**、**session-entry-projection** - plugin-owned session state contracts
- **scheduled-turns** - plugin scheduled turn metadata と timestamp bounds
- **host-hooks**、**run-context-lifecycle**、**runtime-import-side-effects**、**runtime-seams** - plugin host/runtime lifecycle と import-boundary contracts
- **extension-runtime-dependencies** - extensions の runtime dependency placement

### 実行するタイミング

- plugin-sdk exports または subpaths を変更した後
- channel または provider plugin を追加または変更した後
- plugin registration または discovery をリファクタリングした後

契約テストは CI で実行され、実際の API keys は必要ありません。

## 回帰の追加（ガイダンス）

ライブで発見された provider/model 問題を修正する場合:

- 可能であれば CI セーフな回帰を追加します（mock/stub provider、または正確な request-shape transformation の capture）
- 本質的に live-only（rate limits、auth policies）の場合は、live test を狭く保ち、env vars 経由でオプトインにします
- バグを捕捉する最小レイヤーを対象にすることを優先します:
  - provider request conversion/replay bug -> direct models test
  - gateway session/history/tool pipeline bug -> gateway live smoke または CI セーフな gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は registry metadata（`listSecretTargetRegistryEntries()`）から SecretRef class ごとに 1 つの sampled target を導出し、traversal-segment exec ids が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは未分類の target ids で意図的に失敗するため、新しい classes が黙ってスキップされることはありません。

## 関連

- [ライブテスト](/ja-JP/help/testing-live)
- [アップデートと plugins のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
