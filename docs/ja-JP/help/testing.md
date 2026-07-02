---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対するリグレッションの追加
    - Gateway + エージェント動作のデバッグ
summary: 'テストキット: ユニット/E2E/ライブスイート、Docker ランナー、および各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-07-02T07:58:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、小規模な Docker ランナー群があります。このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートがカバーする内容（および意図的にカバーしない内容）。
- 一般的なワークフロー（local、pre-push、debugging）で実行するコマンド。
- live テストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダーの問題に対する回帰テストの追加方法。

<Note>
**QA スタック（qa-lab、qa-channel、live transport レーン）**は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) - `pnpm openclaw qa matrix` のリファレンス。
- [成熟度スコアカード](/ja-JP/maturity/scorecard) - リリース QA 証拠が安定性と LTS 判断をどう支えるか。
- [QA channel](/ja-JP/channels/qa-channel) - repo-backed シナリオで使われる合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行を扱います。下の QA 固有ランナーセクション（[QA 固有ランナー](#qa-specific-runners)）には、具体的な `qa` 呼び出しを列挙し、上記のリファレンスに戻れるようにしています。
</Note>

## クイックスタート

通常の日々:

- フルゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカルフルスイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接ファイル指定は、extension/channel パスにもルーティングされます: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復修正している場合は、まず対象を絞った実行を優先してください。
- Docker-backed QA サイト: `pnpm qa:lab:up`
- Linux VM-backed QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れる場合、または追加の確信がほしい場合:

- Coverage ゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

## テスト一時ディレクトリ

テスト所有の一時ディレクトリには、`test/helpers/temp-dir.ts` の共有ヘルパーを優先してください。これらは所有権を明示し、同じテストライフサイクル内でクリーンアップを保ちます。

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` は意図的に手動クリーンアップメソッドを公開しません。各テスト後のクリーンアップは Vitest が所有します。まだ移行していないテスト向けに既存の低レベルヘルパーは残っていますが、新規および移行済みのテストでは自動クリーンアップの tracker を使うべきです。テストで raw temp-dir 動作を明示的に検証するケースを除き、新しい手動の `makeTempDir`、`cleanupTempDirs`、`createTempDirTracker` の使用や、新しい bare `fs.mkdtemp*` 呼び出しは避けてください。テストが意図的に bare 一時ディレクトリを必要とする場合は、具体的な理由を添えた監査可能な allow コメントを追加してください。

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

移行の可視性のため、`node scripts/report-test-temp-creations.mjs` は、追加された diff 行における新しい bare temp-dir 作成と、新しい手動共有ヘルパー使用を報告しますが、既存のクリーンアップスタイルはブロックしません。そのファイルスコープは、別個の test-helper ファイル名ヒューリスティックを維持する代わりに、`scripts/changed-lanes.mjs` と同じテストパス分類に意図的に従い、共有ヘルパー実装自体はスキップします。`check:changed` は、変更されたテストパスに対してこのレポートを warning-only の CI シグナルとして実行します。検出結果は GitHub warning annotations であり、失敗ではありません。

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）:

- Live スイート（models + gateway tool/image probes）: `pnpm test:live`
- 1 つの live ファイルだけを静かに対象化: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Runtime performance reports: 実際の `openai/gpt-5.5` エージェントターンには `live_openai_candidate=true` を、Kova CPU/heap/trace artifacts には `deep_profile=true` を指定して `OpenClaw Performance` を dispatch します。日次スケジュール実行は、`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、mock-provider、deep-profile、GPT 5.5 レーン artifacts を `openclaw/clawgrit-reports` に公開します。mock-provider レポートには、source-level gateway boot、memory、plugin-pressure、repeated fake-model hello-loop、CLI startup の数値も含まれます。
- Docker live model sweep: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さな file-read 形式の probe を実行します。メタデータが `image` 入力を広告しているモデルでは、小さな画像ターンも実行します。プロバイダー障害を切り分ける場合は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加 probe を無効化してください。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の `OpenClaw Release Checks` はどちらも、`include_live_suites: true` で再利用可能な live/E2E workflow を呼び出します。これには、プロバイダー別に shard された個別の Docker live model matrix jobs が含まれます。
  - 対象を絞った CI rerun では、`include_live_suites: true` と `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)` を dispatch してください。
  - 新しい高シグナルのプロバイダー secrets は、`scripts/ci-hydrate-live-auth.sh` に加えて `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` とその scheduled/release callers に追加してください。
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live レーンを実行し、合成 Slack DM を `/codex bind` で bind し、`/codex fast` と `/codex permissions` を実行したうえで、ACP の代わりに native Plugin binding を通じて通常の返信と画像添付ルートを検証します。
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Plugin 所有の Codex app-server harness を通じて Gateway エージェントターンを実行し、`/codex status` と `/codex models` を検証し、デフォルトで画像、cron MCP、sub-agent、Guardian probe を実行します。他の Codex app-server 障害を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` で sub-agent probe を無効化してください。対象を絞った sub-agent チェックでは、他の probe を無効化します: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、これは sub-agent probe 後に終了します。
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Docker 内でパッケージ化された OpenClaw tarball をインストールし、OpenAI API-key オンボーディングを実行し、Codex Plugin と `@openai/codex` 依存関係がオンデマンドで managed npm project root にダウンロードされたことを検証します。
- Live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - 実際の `slugify` 依存関係を持つ fixture Plugin を pack し、`npm-pack:` 経由でインストールし、managed npm project root 配下の依存関係を検証したうえで、live OpenAI モデルに Plugin tool を呼び出して hidden slug を返すよう依頼します。
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command サーフェスの opt-in belt-and-suspenders チェックです。`/crestodian status` を実行し、永続的なモデル変更をキューに入れ、`/crestodian yes` に返信し、audit/config write パスを検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に fake Claude CLI がある configless コンテナで Crestodian を実行し、fuzzy planner fallback が監査済み typed config write に変換されることを検証します。
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、modern onboard Crestodian entrypoint を検証し、setup/model/agent/Discord Plugin + SecretRef の書き込みを適用し、config を検証し、audit entries を検証します。同じ Ring 0 setup パスは、QA Lab でも `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` を設定した状態で、`openclaw models list --provider moonshot --json` を実行し、次に `moonshot/kimi-k2.6` に対して isolated な `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` を実行します。JSON が Moonshot/K2.6 を報告し、assistant transcript が正規化された `usage.cost` を保存していることを検証してください。

<Tip>
失敗している 1 ケースだけが必要な場合は、下で説明する allowlist env vars によって live テストを絞り込むことを優先してください。
</Tip>

## QA 固有ランナー

QA-lab の実環境に近い検証が必要な場合、これらのコマンドはメインのテストスイートの隣に位置します。

CI は専用 workflow で QA Lab を実行します。Agentic parity は `QA-Lab - All Lanes` と release validation の下にネストされており、単独の PR workflow ではありません。広範な validation では、`rerun_group=qa-parity` または release-checks QA group を指定した `Full Release Validation` を使うべきです。Stable/default release checks は、`run_release_soak=true` の背後に exhaustive live/Docker soak を保持します。`full` profile は soak を強制的に有効にします。`QA-Lab - All Lanes` は、`main` で nightly に、また manual dispatch から、mock parity レーン、live Matrix レーン、Convex-managed live Telegram レーン、Convex-managed live Discord レーンを並列ジョブとして実行します。Scheduled QA と release checks は Matrix に `--profile fast` を明示的に渡します。一方で、Matrix CLI と manual workflow input のデフォルトは `all` のままです。manual dispatch は `all` を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` jobs に shard できます。`OpenClaw Release Checks` は、リリース承認前に parity と fast Matrix および Telegram レーンを実行し、release transport checks には `mock-openai/gpt-5.5` を使うため、決定論的な状態を保ち、通常の provider-plugin startup を避けられます。これらの live transport gateways は memory search を無効化します。memory の動作は QA parity スイートで引き続きカバーされます。

Full release live media shards は、すでに `ffmpeg` と `ffprobe` を備えた `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使います。Docker live model/backend shards は、選択された commit ごとに一度だけビルドされた共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使い、各 shard 内で再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` で pull します。

- `pnpm openclaw qa suite`
  - リポジトリ backed の QA シナリオをホスト上で直接実行します。
  - 選択したシナリオセットについて、mixed flow、Vitest、Playwright のシナリオ選択を含む、トップレベルの `qa-evidence.json`、`qa-suite-summary.json`、および
    `qa-suite-report.md` アーティファクトを書き込みます。
  - `pnpm openclaw qa run --qa-profile <profile>` によってディスパッチされた場合、選択した taxonomy プロファイルのスコアカードを同じ `qa-evidence.json` に埋め込みます。
    `smoke-ci` はスリムな証跡を書き込み、`evidenceMode: "slim"` を設定し、各エントリの `execution` を省略します。`release` は厳選されたリリース準備状況の範囲をカバーします。
    `all` はすべてのアクティブな maturity カテゴリを選択し、完全なスコアカードアーティファクトが必要な場合に明示的な QA
    Profile Evidence ワークフローディスパッチで使うことを意図しています。
  - デフォルトでは、分離された
    gateway ワーカーを使って、複数の選択済みシナリオを並列実行します。`qa-channel` のデフォルト並行数は 4 です（選択されたシナリオ数が上限）。ワーカー数を調整するには `--concurrency <count>` を使い、以前のシリアルレーンには `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使います。
  - provider モード `live-frontier`、`mock-openai`、および `aimock` をサポートします。
    `aimock` は、シナリオ対応の `mock-openai` レーンを置き換えることなく、実験的な fixture と protocol-mock カバレッジのためにローカルの AIMock-backed provider サーバーを起動します。
- `pnpm openclaw qa coverage --match <query>`
  - シナリオ ID、タイトル、surface、coverage ID、docs ref、code ref、
    Plugin、provider 要件を検索し、一致する suite target を出力します。
  - 変更対象の挙動やファイルパスは分かっているが、最小のシナリオが分からない場合に、QA Lab 実行の前に使います。これは助言目的のみです。mock、
    live、Multipass、Matrix、または transport proof は、変更される挙動から引き続き選択してください。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab を通して、live OpenAI Kitchen Sink Plugin の gauntlet を実行します。外部の Kitchen Sink パッケージをインストールし、Plugin SDK surface
    inventory を検証し、`/healthz` と `/readyz` を probe し、gateway CPU/RSS
    証跡を記録し、live OpenAI turn を実行し、adversarial diagnostics をチェックします。
    `OPENAI_API_KEY` などの live OpenAI auth が必要です。hydrated Testbox
    セッションでは、`openclaw-testbox-env` helper が存在する場合、Testbox live-auth プロファイルを自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - gateway startup bench と小さな mock QA Lab シナリオパック
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) を実行し、結合された CPU observation
    summary を `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは、持続的な hot CPU observation のみをフラグします（`--cpu-core-warn`
    と `--hot-wall-warn-ms`）。そのため短い起動バーストは、数分続く gateway peg 回帰のようには見えず、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使います。チェックアウトに新しい runtime 出力がまだない場合は、先にビルドを実行します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA suite を disposable Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択の挙動を維持します。
  - `qa suite` と同じ provider/model 選択フラグを再利用します。
  - live 実行では、guest にとって実用的なサポート済み QA auth 入力を転送します:
    env ベースの provider key、QA live provider config パス、および存在する場合は `CODEX_HOME`。
  - 出力ディレクトリは repo root 配下に置く必要があります。これにより guest が mounted workspace を通して書き戻せます。
  - 通常の QA report + summary に加えて、Multipass log を
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - operator-style QA 作業のために、Docker-backed QA site を起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルにインストールし、non-interactive OpenAI API-key onboarding を実行し、デフォルトで Telegram
    を構成し、packaged Plugin runtime が startup
    dependency repair なしでロードされることを検証し、doctor を実行し、mocked OpenAI endpoint に対して 1 回の local agent turn を実行します。
  - Discord で同じ packaged-install レーンを実行するには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使います。
- `pnpm test:docker:session-runtime-context`
  - embedded runtime context transcript のために、deterministic built-app Docker smoke を実行します。hidden OpenClaw runtime context が visible user turn に漏れず、non-display custom message として永続化されることを検証し、その後、影響を受ける壊れた session JSONL を seed し、
    `openclaw doctor --fix` がバックアップ付きで active branch に書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内に OpenClaw package candidate をインストールし、installed-package
    onboarding を実行し、installed CLI を通して Telegram を構成し、その後、その installed package を SUT Gateway として live Telegram QA レーンを再利用します。
  - wrapper はチェックアウトから `qa-lab` harness source のみをマウントします。installed package が `dist`、`openclaw/plugin-sdk`、および bundled Plugin
    runtime を所有するため、このレーンは現在のチェックアウトの Plugin をテスト対象パッケージに混在させません。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。registry からインストールする代わりに解決済みのローカル tarball をテストするには、
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - デフォルトでは `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` により、反復 RTT timing を `qa-evidence.json` に出力します。
    RTT 実行を調整するには、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` は、sample 対象の Telegram QA check ID のカンマ区切りリストを受け取ります。未設定の場合、デフォルトの RTT-capable check は `telegram-mentioned-message-reply` です。
  - `pnpm openclaw qa telegram` と同じ Telegram env credential または Convex credential source を使います。CI/release automation では、
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて
    `OPENCLAW_QA_CONVEX_SITE_URL` と role secret を設定します。CI に
    `OPENCLAW_QA_CONVEX_SITE_URL` と Convex role secret が存在する場合、Docker wrapper は Convex を自動的に選択します。
  - wrapper は Docker build/install 作業の前に、ホスト上で Telegram または Convex credential env を検証します。意図的に pre-credential setup をデバッグする場合のみ、
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに限り、共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。Convex credential が選択され、role が設定されていない場合、wrapper は CI では `ci`、CI 外では
    `maintainer` を使います。
  - GitHub Actions は、このレーンを手動 maintainer workflow
    `NPM Telegram Beta E2E` として公開します。これは merge 時には実行されません。この workflow は
    `qa-live-shared` environment と Convex CI credential lease を使います。
- GitHub Actions は、1 つの candidate package に対する side-run product proof 用に `Package Acceptance` も公開しています。trusted ref、公開済み npm spec、
  HTTPS tarball URL と SHA-256、または別の実行からの tarball artifact を受け取り、正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、その後、既存の Docker E2E scheduler を smoke、package、product、full、または custom
  lane profile で実行します。同じ `package-under-test` artifact に対して Telegram QA workflow を実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL proof には digest が必要で、public URL safety policy を使います:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Enterprise/private tarball mirror は明示的な trusted-source policy を使います:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` は trusted workflow ref から `.github/package-trusted-sources.json` を読み取り、URL credential や workflow-input private-network bypass を受け付けません。指定された policy が bearer auth を宣言している場合は、固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret を構成します。

- Artifact proof は、別の Actions run から tarball artifact をダウンロードします:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw build を Docker 内で pack してインストールし、OpenAI を構成して Gateway
    を起動し、その後 config edit によって bundled channel/Plugin を有効にします。
  - setup discovery が未構成の downloadable Plugin を absent のままにすること、最初の configured doctor repair が欠落した各 downloadable
    Plugin を明示的にインストールすること、2 回目の restart で hidden dependency repair が実行されないことを検証します。
  - 既知の古い npm baseline もインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、candidate の
    post-update doctor が harness-side postinstall repair なしで legacy Plugin dependency debris をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels guest 全体で native packaged-install update smoke を実行します。選択された各 platform は、まず要求された baseline package をインストールし、その後、同じ guest 内でインストール済みの `openclaw update` コマンドを実行し、installed version、update status、gateway readiness、および 1 回の local agent
    turn を検証します。
  - 1 つの guest で反復作業する場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使います。summary artifact path と per-lane status には
    `--json` を使います。
  - OpenAI レーンは、デフォルトで live agent-turn proof に `openai/gpt-5.5` を使います。別の OpenAI model を意図的に検証する場合は、
    `--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - 長いローカル実行は host timeout でラップし、Parallels transport stall が残りの testing window を消費しないようにします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script は nested lane log を `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。
    outer wrapper が hung していると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認してください。
  - Windows update は cold guest では post-update doctor と package
    update 作業に 10 から 15 分かかる場合があります。nested npm
    debug log が進んでいるなら、それでも正常です。
  - この aggregate wrapper を個別の Parallels
    macOS、Windows、または Linux smoke レーンと並列に実行しないでください。これらは VM state を共有しており、snapshot restore、package serving、または guest gateway state で衝突する可能性があります。
  - post-update proof は通常の bundled Plugin surface を実行します。speech、image generation、media
    understanding などの capability facade は bundled runtime API を通してロードされるためです。agent
    turn 自体が単純な text response だけをチェックする場合でも同様です。

- `pnpm openclaw qa aimock`
  - 直接プロトコルのスモークテスト用に、ローカル AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker バック Tuwunel homeserver に対して Matrix ライブ QA レーンを実行します。ソースチェックアウトのみ - パッケージ版インストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、環境変数、アーティファクト配置: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 環境変数のドライバーおよび SUT bot トークンを使用して、実際のプライベートグループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使用するか、`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してプールリースを有効にします。
  - デフォルトは、canary、メンションゲート、コマンドアドレス指定、`/status`、bot-to-bot のメンション付き返信、コアネイティブコマンドの返信をカバーします。`mock-openai` のデフォルトは、決定的な返信チェーンと Telegram 最終メッセージストリーミングの回帰もカバーします。`session_status` などの任意プローブには `--list-scenarios` を使用します。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じプライベートグループ内に 2 つの異なる bot が必要で、SUT bot は Telegram ユーザー名を公開している必要があります。
  - 安定した bot-to-bot 観測のため、両方の bot で `@BotFather` の Bot-to-Bot Communication Mode を有効にし、ドライバー bot がグループの bot トラフィックを観測できるようにしてください。
  - `.artifacts/qa-e2e/...` の下に Telegram QA レポート、概要、`qa-evidence.json` を書き込みます。返信シナリオには、ドライバー送信リクエストから観測された SUT 返信までの RTT が含まれます。

`Mantis Telegram Live` は、このレーンの PR エビデンスラッパーです。候補 ref を Convex リースの Telegram 認証情報で実行し、編集済みの QA レポート/エビデンスバンドルを Crabbox デスクトップブラウザーでレンダリングし、MP4 エビデンスを記録し、モーションをトリミングした GIF を生成し、アーティファクトバンドルをアップロードし、`pr_number` が設定されている場合は Mantis GitHub App を通じてインライン PR エビデンスを投稿します。メンテナーは、Actions UI から `Mantis Scenario`（`scenario_id:
telegram-live`）で、またはプルリクエストコメントから直接開始できます。

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` は、PR の視覚的証明用のエージェント型ネイティブ Telegram Desktop 前後比較ラッパーです。Actions UI から自由形式の `instructions` で、`Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）を通じて、または PR コメントから開始します。

```text
@openclaw-mantis telegram desktop proof
```

Mantis エージェントは PR を読み、どの Telegram 表示動作が変更を証明するかを判断し、baseline ref と candidate ref で実ユーザー Crabbox Telegram Desktop 証明レーンを実行し、ネイティブ GIF が有用になるまで反復し、ペアの `motionPreview` マニフェストを書き込み、`pr_number` が設定されている場合は Mantis GitHub App を通じて同じ 2 カラム GIF テーブルを投稿します。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux デスクトップをリースまたは再利用し、ネイティブ Telegram Desktop をインストールし、リースされた Telegram SUT bot トークンで OpenClaw を設定し、Gateway を起動し、表示されている VNC デスクトップからスクリーンショット/MP4 エビデンスを記録します。
  - デフォルトは `--credential-source convex` なので、ワークフローには Convex broker シークレットのみが必要です。`pnpm openclaw qa telegram` と同じ `OPENCLAW_QA_TELEGRAM_*` 変数で `--credential-source env` を使用します。
  - Telegram Desktop には引き続きユーザーログイン/プロファイルが必要です。bot トークンは OpenClaw のみを設定します。base64 `.tgz` プロファイルアーカイブには `--telegram-profile-archive-env <name>` を使用するか、`--keep-lease` を使用して VNC 経由で一度手動ログインします。
  - 出力ディレクトリの下に `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png`、`telegram-desktop-builder.mp4` を書き込みます。

ライブトランスポートレーンは、新しいトランスポートがずれないように、1 つの標準契約を共有します。レーンごとのカバレッジマトリクスは [QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、そのマトリクスの一部ではありません。

### Convex 経由の共有 Telegram 認証情報 (v1)

ライブトランスポート QA で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA ラボは Convex バックのプールから排他的リースを取得し、レーン実行中にそのリースへ Heartbeat を送信し、シャットダウン時にリースを解放します。このセクション名は Discord、Slack、WhatsApp サポートより前のものです。リース契約は種類間で共有されます。

参照 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用のシークレット 1 つ:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` は `maintainer` 用
  - `OPENCLAW_QA_CONVEX_SECRET_CI` は `ci` 用
- 認証情報ロール選択:
  - CLI: `--credential-role maintainer|ci`
  - Env デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトが `ci`、それ以外では `maintainer`）

任意環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

`OPENCLAW_QA_CONVEX_SITE_URL` は通常運用では `https://` を使用する必要があります。

メンテナー管理コマンド（プールの追加/削除/一覧表示）には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を出力せずに、Convex サイト URL、broker シークレット、エンドポイントプレフィックス、HTTP タイムアウト、管理/一覧到達性を確認します。スクリプトや CI ユーティリティで機械可読出力が必要な場合は `--json` を使用します。

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

Telegram kind のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正な形式のペイロードを拒否します。

Telegram 実ユーザー kind のペイロード形状:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId`、`telegramApiId` は数値文字列である必要があります。
- `tdlibArchiveSha256` と `desktopTdataArchiveSha256` は SHA-256 16 進文字列である必要があります。
- `kind: "telegram-user"` は Mantis Telegram Desktop 証明ワークフロー用に予約されています。汎用 QA Lab レーンはこれを取得してはいけません。

Broker 検証済みマルチチャネルペイロード:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack レーンもプールからリースできますが、Slack ペイロード検証は現在 broker ではなく Slack QA ランナー内にあります。Slack 行には `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用します。

### QA にチャネルを追加する

新しいチャネルアダプターのアーキテクチャとシナリオヘルパー名は [QA 概要 → チャネルを追加する](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低条件: 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` の下でシナリオを作成します。

## テストスイート（どこで何が実行されるか）

スイートは「リアリズムの増加」（および不安定さ/コストの増加）として考えてください。

### ユニット / インテグレーション（デフォルト）

- コマンド: `pnpm test`
- 設定: ターゲット指定なしの実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定に展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` の下のコア/ユニットインベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- スコープ:
  - 純粋なユニットテスト
  - インプロセスインテグレーションテスト（Gateway 認証、ルーティング、ツール、解析、設定）
  - 既知のバグに対する決定的な回帰
- 期待事項:
  - CI で実行されます
  - 実際のキーは不要です
  - 高速かつ安定しているべきです
  - リゾルバーおよび公開サーフェスローダーテストは、実際のバンドル済み Plugin ソース API ではなく、生成された小さな Plugin フィクスチャで、広範な `api.js` および `runtime-api.js` のフォールバック動作を証明する必要があります。実際の Plugin API ロードは、Plugin 所有の契約/インテグレーションスイートに属します。

ネイティブ依存関係ポリシー:

- デフォルトのテストインストールでは、任意のネイティブ Discord opus ビルドをスキップします。Discord voice はバンドル済みの `libopus-wasm` を使用し、`@discordjs/opus` は `allowBuilds` で無効のままにして、ローカルテストと Testbox レーンがネイティブアドオンをコンパイルしないようにします。
- ネイティブ opus のパフォーマンスは、デフォルトの OpenClaw インストール/テストループではなく、`libopus-wasm` ベンチマークリポジトリで比較します。デフォルトの `allowBuilds` で `@discordjs/opus` を `true` に設定しないでください。そうすると無関係なインストール/テストループでネイティブコードがコンパイルされます。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ付きレーン">

    - ターゲット未指定の `pnpm test` は、巨大な単一のネイティブルートプロジェクトプロセスではなく、十二個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/拡張の作業が無関係なスイートを枯渇させることを避けられます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。複数シャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、デフォルトで変更された git パスを低コストなスコープ付きレーンに展開します。対象は、直接編集されたテスト、兄弟の `*.test.ts` ファイル、明示的なソースマッピング、ローカルの import グラフ依存です。設定/セットアップ/package の編集は、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使わない限り、広範囲のテスト実行を行いません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートなローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン更新では、対象を絞った version/config/root-dependency チェックを実行し、トップレベルの version フィールド以外の package 変更を拒否するガードが付きます。
    - ライブ Docker ACP ハーネスの編集では、対象を絞ったチェックを実行します。ライブ Docker 認証スクリプトのシェル構文と、ライブ Docker スケジューラの dry-run です。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定される場合のみ含まれます。dependency、export、version、その他の package サーフェス編集では、引き続きより広いガードを使用します。
    - agents、commands、plugins、auto-reply ヘルパー、`plugin-sdk`、および同様の純粋なユーティリティ領域の import が軽いユニットテストは、`unit-fast` レーンを通ります。このレーンは `test/setup-openclaw-runtime.ts` をスキップします。状態を持つファイルや runtime が重いファイルは既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` のヘルパーソースファイルも、変更モード実行をそれらの軽量レーン内の明示的な兄弟テストにマッピングするため、ヘルパー編集でそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルの core ヘルパー、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー向けの専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、import が重い単一のバケットが Node の末尾全体を占有しないようにしています。
    - 通常の PR/main CI は、意図的に拡張バッチスイープとリリース専用の `agentic-plugins` シャードをスキップします。完全なリリース検証では、リリース候補に対して、それらの Plugin/拡張が重いスイート用に別個の `Plugin Prerelease` 子ワークフローを dispatch します。

  </Accordion>

  <Accordion title="埋め込みランナーのカバレッジ">

    - message-tool の discovery 入力や Compaction runtime
      context を変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化の境界には、対象を絞ったヘルパーのリグレッションを追加してください。
    - 埋め込みランナーの統合スイートを健全に保ってください:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`、および
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付き ID と Compaction の挙動が実際の
      `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。ヘルパーのみのテストは、
      これらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest プールと分離のデフォルト">

    - ベースの Vitest 設定はデフォルトで `threads` です。
    - 共有 Vitest 設定は `isolate: false` を固定し、
      root projects、e2e、live 設定全体で非分離ランナーを使用します。
    - root UI レーンは `jsdom` セットアップと optimizer を維持しますが、
      共有の非分離ランナーでも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false`
      デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大きなローカル実行時の V8 コンパイル churn を減らすため、
      デフォルトで Vitest 子 Node プロセスに `--no-maglev` を追加します。
      標準の V8 挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
    - `scripts/run-vitest.mjs` は、stdout または stderr 出力が 5 分間ない明示的な非 watch Vitest 実行を終了します。
      意図的に無音の調査で watchdog を無効化するには
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、diff がどのアーキテクチャレーンをトリガーするかを表示します。
    - pre-commit hook はフォーマットのみです。フォーマット済みファイルを再ステージし、
      lint、typecheck、テストは実行しません。
    - スマートなローカルチェックゲートが必要な場合は、handoff または push の前に
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` は、デフォルトで低コストなスコープ付きレーンを通ります。agent が
      harness、config、package、または contract の編集により広い
      Vitest カバレッジが本当に必要だと判断した場合のみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は、同じルーティング挙動を維持しつつ、
      worker 上限だけを高くします。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストの load average がすでに高い場合は後退するため、
      複数の同時 Vitest 実行による影響はデフォルトで抑えられます。
    - ベースの Vitest 設定は、projects/config files を
      `forceRerunTriggers` としてマークしているため、テスト配線が変わったときも changed-mode の再実行は正確なままです。
    - 設定は、サポートされるホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。
      直接プロファイリング用に明示的なキャッシュ場所を 1 つ指定したい場合は、
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf デバッグ">

    - `pnpm test:perf:imports` は、Vitest の import-duration レポートと
      import-breakdown 出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを
      `origin/main` 以降に変更されたファイルへスコープします。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。
      設定全体の実行では config path をキーとして使用します。include-pattern CI
      シャードではシャード名を追加するため、フィルタ済みシャードを個別に追跡できます。
    - 1 つの hot test が依然として startup imports に時間の大半を費やす場合は、
      重い依存関係を狭いローカルの `*.runtime.ts` 境界の背後に置き、
      runtime helper を `vi.mock(...)` に渡すためだけに deep-import するのではなく、
      その境界を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み diff について、
      ルーティングされた `test:changed` をネイティブルートプロジェクトパスと比較し、
      wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を
      `scripts/test-projects.mjs` と root Vitest config にルーティングして、
      現在の dirty tree を benchmark します。
    - `pnpm test:perf:profile:main` は、
      Vitest/Vite の startup と transform overhead に対する main-thread CPU profile を書き込みます。
    - `pnpm test:perf:profile:runner` は、file parallelism を無効化した unit suite の
      runner CPU+heap profile を書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（Gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 worker に強制
- スコープ:
  - diagnostics をデフォルトで有効にした実際の loopback Gateway を開始します
  - synthetic gateway message、memory、large-payload churn を diagnostic event path 経由で駆動します
  - Gateway WS RPC 経由で `diagnostics.stability` をクエリします
  - diagnostic stability bundle persistence helpers をカバーします
  - recorder が bounded のままであること、synthetic RSS samples が pressure budget 未満に収まること、per-session queue depths がゼロまで drain されることをアサートします
- 期待事項:
  - CI-safe かつ keyless
  - stability-regression のフォローアップ向けの狭いレーンであり、完全な Gateway スイートの代替ではありません

### E2E（repo aggregate）

- コマンド: `pnpm test:e2e`
- スコープ:
  - gateway smoke E2E レーンを実行します
  - mocked Control UI browser E2E レーンを実行します
- 期待事項:
  - CI-safe かつ keyless
  - Playwright Chromium がインストールされている必要があります

### E2E（gateway smoke）

- コマンド: `pnpm test:e2e:gateway`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E tests
- runtime デフォルト:
  - リポジトリの他の部分と同様に、Vitest `threads` を `isolate: false` で使用します。
  - adaptive workers を使用します（CI: 最大 2、ローカル: デフォルトで 1）。
  - console I/O overhead を減らすため、デフォルトで silent mode で実行します。
- 便利な overrides:
  - worker count を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - verbose console output を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - multi-instance gateway の end-to-end 挙動
  - WebSocket/HTTP surfaces、node pairing、より重い networking
- 期待事項:
  - CI で実行されます（pipeline で有効化されている場合）
  - 実際の key は不要です
  - unit tests より moving parts が多いです（遅くなる場合があります）

### E2E（Control UI mocked browser）

- コマンド: `pnpm test:ui:e2e`
- 設定: `test/vitest/vitest.ui-e2e.config.ts`
- ファイル: `ui/src/**/*.e2e.test.ts`
- スコープ:
  - Vite Control UI を開始します
  - Playwright 経由で実際の Chromium page を駆動します
  - Gateway WebSocket を決定的な in-browser mocks に置き換えます
- 期待事項:
  - `pnpm test:e2e` の一部として CI で実行されます
  - 実際の Gateway、agents、provider keys は不要です
  - Browser dependency が存在する必要があります（`pnpm --dir ui exec playwright install chromium`）

### E2E: OpenShell backend smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - アクティブなローカル OpenShell Gateway を再利用します
  - 一時的なローカル Dockerfile から sandbox を作成します
  - 実際の `sandbox ssh-config` + SSH exec 経由で OpenClaw の OpenShell backend を実行します
  - sandbox fs bridge 経由で remote-canonical filesystem behavior を検証します
- 期待事項:
  - opt-in のみです。デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLI と動作する Docker daemon が必要です
  - アクティブなローカル OpenShell Gateway とその config source が必要です
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後 test sandbox を破棄します
- 便利な overrides:
  - broader e2e suite を手動実行する際に test を有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - default ではない CLI binary または wrapper script を指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - 登録済み gateway config を分離 test に公開するには `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - host policy fixture が使用する Docker gateway IP を override するには `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Live（実プロバイダー + 実モデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル Plugin ライブテスト
- デフォルト: `pnpm test:live` により**有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で_今日_本当に動作するか？」
  - プロバイダー形式の変更、ツール呼び出しの癖、認証の問題、レート制限の挙動を検出する
- 期待値:
  - 設計上 CI 安定ではない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - コストがかかる / レート制限を消費する
  - 「すべて」ではなく、絞り込んだサブセットの実行を推奨
- ライブ実行は、すでにエクスポート済みの API キーとステージング済み認証プロファイルを使用する。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定/認証素材を一時テストホームにコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更することはない。
- ライブテストで実際のホームディレクトリを意図的に使う必要がある場合のみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定する。
- `pnpm test:live` はデフォルトでより静かなモードになる: `[live] ...` の進捗出力は維持し、Gateway のブートストラップログ/Bonjour の雑音をミュートする。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定する。
- API キーローテーション（プロバイダー固有）: `*_API_KEYS` をカンマ/セミコロン形式で設定するか、`*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定する。または `OPENCLAW_LIVE_*_KEY` でライブごとに上書きする。テストはレート制限レスポンスで再試行する。
- 進捗/Heartbeat 出力:
  - ライブスイートは stderr に進捗行を出力するようになったため、Vitest のコンソールキャプチャが静かな場合でも、長いプロバイダー呼び出しが動作中であることが見える。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効にするため、ライブ実行中にプロバイダー/Gateway の進捗行が即座にストリームされる。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整する。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整する。

## どのスイートを実行すべきか？

この判断表を使用する:

- ロジック/テストを編集する: `pnpm test` を実行する（大きく変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れる: `pnpm test:e2e` を追加する
- 「自分の bot が落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグする: 絞り込んだ `pnpm test:live` を実行する

## ライブ（ネットワークに触れる）テスト

ライブモデルマトリクス、CLI バックエンドスモーク、ACP スモーク、Codex app-server
ハーネス、すべてのメディアプロバイダーライブテスト（Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス）、およびライブ実行の認証情報処理については、
[ライブスイートのテスト](/ja-JP/help/testing-live)を参照。専用の更新および
Plugin 検証チェックリストについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照。

## Docker ランナー（任意の「Linux で動く」確認）

これらの Docker ランナーは 2 つの区分に分かれる:

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で対応するプロファイルキーのライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカル設定ディレクトリ、ワークスペース、任意のプロファイル env ファイルをマウントする。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles`。
- Docker ライブランナーは、必要に応じて独自の実用的な上限を維持する:
  `test:docker:live-models` は、厳選されたサポート済み高シグナルセットをデフォルトとし、
  `test:docker:live-gateway` は `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` をデフォルトとする。明示的により小さい上限やより大きいスキャンが必要な場合は、`OPENCLAW_LIVE_MAX_MODELS`
  または Gateway の env 変数を設定する。
- `test:docker:all` は `test:docker:live-build` 経由でライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックし、その後 2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用する。ベア イメージは、インストール/更新/Plugin 依存関係レーン用の Node/Git ランナーのみであり、これらのレーンは事前ビルド済み tarball をマウントする。機能イメージは、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールする。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行する。集約は重み付きローカルスケジューラーを使用する: `OPENCLAW_DOCKER_ALL_PARALLELISM` がプロセススロットを制御し、リソース上限により重いライブ、npm インストール、複数サービスのレーンがすべて同時に開始されないようにする。単一のレーンが有効な上限より重い場合でも、プールが空ならスケジューラーはそれを開始でき、その後キャパシティが再び利用可能になるまで単独で実行し続ける。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`。Docker ホストにより多くの余裕がある場合のみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整する。ランナーはデフォルトで Docker プリフライトを実行し、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、後続の実行で長いレーンを先に開始するためにそのタイミングを使用する。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、パッケージ/イメージ要件、認証情報に関する CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用する。
- 「パッケージ受け入れ」は、「このインストール可能な tarball は製品として動作するか？」を確認する GitHub ネイティブのパッケージゲートである。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードし、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行する。プロファイルは範囲の広さ順に `smoke`、`package`、`product`、`full`。パッケージ/更新/Plugin 契約、公開済みアップグレード生存マトリクス、リリースデフォルト、失敗トリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照。
- ビルドおよびリリースチェックは、tsdown の後に `scripts/check-cli-bootstrap-imports.mjs` を実行する。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的ビルドグラフをたどり、コマンドディスパッチ前の起動で Commander、プロンプト UI、undici、ロギングなどのパッケージ依存関係をインポートしている場合に失敗する。また、バンドルされた Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否する。パッケージ化 CLI スモークは、ルートヘルプ、onboard ヘルプ、doctor ヘルプ、status、設定スキーマ、モデル一覧コマンドもカバーする。
- パッケージ受け入れのレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）で上限が設定される。その期限までは、ハーネスは出荷済みパッケージのメタデータ欠落のみを許容する: 省略されたプライベート QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落パッチファイル、欠落した永続化 `update.channel`、レガシー Plugin インストールレコード場所、欠落した marketplace インストールレコード永続化、および `plugins update` 中の設定メタデータ移行。`2026.4.25` より後のパッケージでは、これらのパスは厳格な失敗になる。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は 1 つ以上の実コンテナを起動し、より高レベルの統合パスを検証する。
- `scripts/lib/openclaw-e2e-instance.sh` を通じてパック済み OpenClaw tarball をインストールする Docker/Bash E2E レーンは、`npm install` を `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（デフォルト `600s`; デバッグ用にラッパーを無効化するには `0` を設定）で上限設定する。

ライブモデル Docker ランナーは、必要な CLI 認証ホームのみ（または実行が絞り込まれていない場合はサポートされているすべて）を bind mount し、実行前にそれらをコンテナホームへコピーする。これにより、外部 CLI OAuth はホストの認証ストアを変更せずにトークンを更新できる:

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`; デフォルトで Claude、Codex、Gemini をカバーし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` により Droid/OpenCode を厳格にカバー）
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- 可観測性スモーク: `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke`、および `pnpm qa:observability:smoke` はプライベート QA ソースチェックアウトレーンである。npm tarball は QA Lab を省略するため、これらは意図的にパッケージ Docker リリースレーンの一部ではない。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なスキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Npm tarball オンボーディング/チャネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パック済み OpenClaw tarball を Docker 内でグローバルにインストールし、env-ref オンボーディング経由で OpenAI を、デフォルトで Telegram も設定し、doctor を実行し、モックされた OpenAI エージェントターンを 1 回実行する。事前ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使用し、ホスト再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を使用し、チャネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使用する。

- リリースユーザージャーニースモーク: `pnpm test:docker:release-user-journey` は、パック済みの OpenClaw tarball をクリーンな Docker ホームへグローバルにインストールし、オンボーディングを実行し、モックされた OpenAI プロバイダーを構成し、エージェントターンを実行し、外部 Plugin をインストール/アンインストールし、ローカルフィクスチャに対して ClickClack を構成し、送信/受信メッセージングを検証し、Gateway を再起動し、doctor を実行します。
- リリース型付きオンボーディングスモーク: `pnpm test:docker:release-typed-onboarding` は、パック済み tarball をインストールし、実際の TTY で `openclaw onboard` を操作し、OpenAI を env-ref プロバイダーとして構成し、生のキーが永続化されないことを検証し、モックされたエージェントターンを実行します。
- リリースメディア/メモリスモーク: `pnpm test:docker:release-media-memory` は、パック済み tarball をインストールし、PNG 添付からの画像理解、OpenAI 互換の画像生成出力、メモリ検索の想起、Gateway 再起動後も想起が維持されることを検証します。
- リリースアップグレードユーザージャーニースモーク: `pnpm test:docker:release-upgrade-user-journey` は、デフォルトでは候補 tarball より古い最新の公開済みベースラインをインストールし、公開済みパッケージ上でプロバイダー/Plugin/ClickClack 状態を構成し、候補 tarball へアップグレードしてから、コアのエージェント/Plugin/チャンネルジャーニーを再実行します。古い公開済みベースラインが存在しない場合は、候補バージョンを再利用します。ベースラインを `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` で上書きできます。
- リリース Plugin マーケットプレイススモーク: `pnpm test:docker:release-plugin-marketplace` は、ローカルフィクスチャマーケットプレイスからインストールし、インストール済み Plugin を更新し、アンインストールし、インストールメタデータが削除された状態で Plugin CLI が消えることを検証します。
- Skill インストールスモーク: `pnpm test:docker:skill-install` は、パック済み OpenClaw tarball を Docker 内へグローバルにインストールし、構成でアップロード済みアーカイブインストールを無効化し、検索から現在のライブ ClawHub skill slug を解決し、`openclaw skills install` でインストールし、インストール済み Skill と `.clawhub` の origin/lock メタデータを検証します。
- 更新チャンネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パック済み OpenClaw tarball を Docker 内へグローバルにインストールし、パッケージ `stable` から git `dev` へ切り替え、永続化されたチャンネルと Plugin の更新後動作を検証してから、パッケージ `stable` へ戻して更新ステータスを確認します。
- アップグレードサバイバースモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャンネル構成、Plugin 許可リスト、古い Plugin 依存関係状態、既存のワークスペース/セッションファイルを含む汚れた旧ユーザーフィクスチャの上に、パック済み OpenClaw tarball をインストールします。ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話 doctor を実行し、その後 loopback Gateway を起動して、構成/状態の保持と起動/ステータス予算を確認します。
- 公開済みアップグレードサバイバースモーク: `pnpm test:docker:published-upgrade-survivor` は、デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、組み込みコマンドレシピでそのベースラインを構成し、結果の構成を検証し、その公開済みインストールを候補 tarball へ更新し、非対話 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、構成済み intent、状態保持、起動、`/healthz`、`/readyz`、RPC ステータス予算を確認します。単一ベースラインは `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きし、集約スケジューラーには `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なローカルベースラインを展開させ、`reported-issues` のような `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` で issue 形式のフィクスチャを展開させます。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれます。Package Acceptance はそれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` のようなメタベースライントークンを解決し、Full Release Validation はリリースソークパッケージゲートを `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストのトランスクリプト永続化と、影響を受けた重複プロンプト書き換え分岐の doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在のツリーをパックし、隔離されたホームで `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み画像プロバイダーを返すことを検証します。事前ビルド済み tarball は `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用し、ホストビルドは `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` でスキップし、ビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使用します。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各コンテナー間で 1 つの npm キャッシュを共有します。更新スモークは、候補 tarball へアップグレードする前の stable ベースラインとして、デフォルトで npm `latest` を使用します。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きできます。非 root インストーラーチェックでは、root 所有のキャッシュエントリがユーザーローカルのインストール動作を覆い隠さないよう、隔離された npm キャッシュを維持します。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` で重複する direct-npm グローバル更新をスキップします。直接の `npm install -g` カバレッジが必要な場合は、その環境変数なしでスクリプトをローカル実行してください。
- エージェント共有ワークスペース削除 CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace`（スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`）は、デフォルトでルート Dockerfile イメージをビルドし、隔離されたコンテナーホーム内に 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行し、有効な JSON と保持されたワークスペースの動作を検証します。インストールスモークイメージを再利用するには、`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使用します。
- Gateway ネットワーキング（2 つのコンテナー、WS 認証 + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- Browser CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot`（スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`）は、ソース E2E イメージと Chromium レイヤーをビルドし、生 CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP ロールスナップショットがリンク URL、カーソルで昇格されたクリック可能要素、iframe 参照、フレームメタデータをカバーしていることを検証します。
- OpenAI Responses web_search 最小 reasoning 回帰: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、モックされた OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` へ引き上げることを検証し、その後プロバイダースキーマの reject を強制して、生の詳細が Gateway ログに現れることを確認します。
- MCP チャンネルブリッジ（シード済み Gateway + stdio ブリッジ + 生 Claude notification-frame スモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw バンドル MCP ツール（実際の stdio MCP サーバー + 組み込み OpenClaw プロファイル allow/deny スモーク）: `pnpm test:docker:agent-bundle-mcp-tools`（スクリプト: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- Cron/サブエージェント MCP クリーンアップ（実際の Gateway + 隔離された cron と 1 回限りのサブエージェント実行後の stdio MCP 子プロセス解体）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（ローカルパス、`file:`、ホイストされた依存関係を持つ npm レジストリ、不正な npm パッケージメタデータ、git moving refs、ClawHub kitchen-sink、マーケットプレイス更新、Claude バンドル enable/inspect のインストール/更新スモーク）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトの kitchen-sink パッケージ/ランタイムペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を使用します。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは密閉されたローカル ClawHub フィクスチャサーバーを使用します。
- Plugin 更新 unchanged スモーク: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin ライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、パック済み OpenClaw tarball を素のコンテナーへインストールし、npm Plugin をインストールし、enable/disable を切り替え、ローカル npm レジストリ経由でアップグレードとダウングレードを行い、インストール済みコードを削除し、その後、各ライフサイクルフェーズの RSS/CPU メトリクスをログに記録しながら、アンインストールが古い状態を引き続き削除することを検証します。
- 構成リロードメタデータスモーク: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- Plugins: `pnpm test:docker:plugins` は、ローカルパス、`file:`、ホイストされた依存関係を持つ npm レジストリ、git moving refs、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドル enable/inspect のインストール/更新スモークをカバーします。`pnpm test:docker:plugin-update` は、インストール済み Plugin の変更なし更新動作をカバーします。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡付きの npm Plugin インストール、enable、disable、upgrade、downgrade、missing-code uninstall をカバーします。

共有機能イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きが設定されている場合は、それが引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにないときに pull します。QR とインストーラーの Docker テストは、共有ビルド済みアプリランタイムではなくパッケージ/インストール動作を検証するため、独自の Dockerfile を維持します。

live-model Docker ランナーは、現在のチェックアウトも読み取り専用で bind-mount し、
コンテナ内の一時 workdir にステージングします。これにより、ランタイム
イメージをスリムに保ちながら、正確なローカルのソース/config に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、
app ローカルの `.build`、Gradle 出力ディレクトリなど、大きなローカル専用キャッシュや app ビルド出力をスキップするため、
Docker live 実行がマシン固有の成果物のコピーに数分かけることはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、gateway live プローブは
コンテナ内で実際の Telegram/Discord などの channel worker を起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、
その Docker lane で gateway live カバレッジを絞り込む、または除外する必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換の HTTP エンドポイントを有効にした
OpenClaw gateway コンテナを起動し、その gateway に対して固定版の Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証したうえで、
Open WebUI の `/api/chat/completions` プロキシ経由で実際の chat リクエストを送信します。
live model completion を待たずに、Open WebUI のサインインとモデル検出の後で停止すべき release-path CI チェックでは、
`OPENWEBUI_SMOKE_MODE=models` を設定してください。
初回実行は、Docker が Open WebUI イメージを pull する必要があり、Open WebUI 自身の cold-start setup が完了する必要もあるため、
明らかに遅くなることがあります。
この lane には使用可能な live model key が必要です。プロセス環境、ステージング済み auth profile、
または明示的な `OPENCLAW_PROFILE_FILE` を通じて提供してください。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON payload が出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、iMessage アカウントを必要としません。seed 済みの Gateway
コンテナを boot し、`openclaw mcp serve` を spawn する 2 つ目のコンテナを起動し、
その後、routed conversation discovery、transcript read、attachment metadata、
live event queue behavior、outbound send routing、Claude 形式の channel +
permission notification を、実際の stdio MCP bridge 経由で検証します。notification チェックは
raw stdio MCP frame を直接検査するため、このスモークは特定の client SDK がたまたま surface するものだけでなく、
bridge が実際に emit する内容を検証します。
`test:docker:agent-bundle-mcp-tools` は決定的で、live
model key を必要としません。repo Docker イメージをビルドし、コンテナ内で実際の stdio MCP probe server を起動し、
embedded OpenClaw bundle MCP runtime 経由でその server を materialize し、
tool を実行したうえで、`coding` と `messaging` は `bundle-mcp` tool を保持し、
`minimal` と `tools.deny: ["bundle-mcp"]` はそれらを filter することを検証します。
`test:docker:cron-mcp-cleanup` は決定的で、live model
key を必要としません。実際の stdio MCP probe server を含む seed 済み Gateway を起動し、
isolated cron turn と `sessions_spawn` one-shot child turn を実行したうえで、
各 run の後に MCP child process が終了することを検証します。

手動 ACP plain-language thread スモーク（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは regression/debug workflow のために保持してください。ACP thread routing validation で再び必要になる可能性があるため、削除しないでください。

便利な env vars:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` に mount されます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` に mount されます
- `OPENCLAW_PROFILE_FILE=...` は mount され、test 実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時 config/workspace dir を使用し、外部 CLI auth mount を使わずに、`OPENCLAW_PROFILE_FILE` から source された env vars のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内の cached CLI install 用に `/home/node/.npm-global` に mount されます
- `$HOME` 配下の外部 CLI auth dir/file は `/host-auth...` の下に読み取り専用で mount され、その後 test 開始前に `/home/node/...` へコピーされます
  - デフォルト dir: `.minimax`
  - デフォルト file: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれた provider 実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推論された必要な dir/file のみを mount します
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のような comma list で手動 override できます
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` で run を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` で in-container の provider を filter します
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、rebuild が不要な再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、creds が env ではなく profile store から来ることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI スモーク用に gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI スモークで使用される nonce-check prompt を override します
- `OPENWEBUI_IMAGE=...` は、固定版 Open WebUI image tag を override します

## Docs sanity

doc 編集後に docs チェックを実行します: `pnpm check:docs`。
in-page heading チェックも必要な場合は、完全な Mintlify anchor validation を実行します: `pnpm docs:check-links:anchors`。

## Offline regression（CI-safe）

これらは実 provider なしの「real pipeline」regression です:

- Gateway tool calling（mock OpenAI、実 gateway + agent loop）: `src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、config 書き込み + auth 強制）: `src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent reliability evals（skills）

「agent reliability evals」のように動作する CI-safe test は、すでにいくつかあります:

- 実 gateway + agent loop 経由の mock tool-calling（`src/gateway/gateway.test.ts`）。
- session wiring と config effect を検証する end-to-end ウィザード flow（`src/gateway/gateway.test.ts`）。

skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **意思決定:** skills が prompt に列挙されているとき、agent は正しい skill を選ぶか（または無関係なものを避けるか）?
- **遵守:** agent は使用前に `SKILL.md` を読み、必須の step/arg に従うか?
- **Workflow contract:** tool order、session history carryover、sandbox boundary を assert する multi-turn scenario。

今後の eval は、まず決定的であるべきです:

- mock provider を使用して tool call + order、skill file read、session wiring を assert する scenario runner。
- skill に焦点を当てた小さな scenario suite（use vs avoid、gating、prompt injection）。
- CI-safe suite が整備された後に限り、任意の live eval（opt-in、env-gated）。

## Contract tests（plugin と channel shape）

Contract test は、登録されているすべての plugin と channel が
interface contract に準拠していることを検証します。検出されたすべての plugin を iterate し、
shape と behavior の assertion suite を実行します。デフォルトの `pnpm test` unit lane は、
これらの shared seam と smoke file を意図的にスキップします。shared channel surface または provider surface を触る場合は、
contract command を明示的に実行してください。

### コマンド

- すべての contract: `pnpm test:contracts`
- Channel contract のみ: `pnpm test:contracts:channels`
- Provider contract のみ: `pnpm test:contracts:plugins`

### Channel contract

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

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

`src/plugins/contracts/*.contract.test.ts` にあります:

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

## Regression の追加（guidance）

live で発見された provider/model issue を修正するとき:

- 可能であれば CI-safe regression を追加します（mock/stub provider、または正確な request-shape transformation の capture）
- 本質的に live-only の場合（rate limit、auth policy）は、live test を狭く保ち、env vars 経由の opt-in にします
- bug を捕捉する最小の layer を target することを優先します:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke または CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry metadata（`listSecretTargetRegistryEntries()`）から SecretRef class ごとに sampled target を 1 つ derive し、traversal-segment exec id が reject されることを assert します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、その test の `classifyTargetClass` を更新してください。新しい class が黙って skip されないように、この test は unclassified target id で意図的に失敗します。

## 関連

- [Testing live](/ja-JP/help/testing-live)
- [Testing updates and plugins](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
