---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストを追加する
    - Gateway + エージェントの動作のデバッグ
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-07-06T21:50:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7ecac8598f07ecc41f150e0112d6e9d5eb9941494dd66df308dc1ec0a5fc364a
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と Docker
ランナーがあります。このページでは、各スイートの対象、特定のワークフローで実行するコマンド、
live テストが認証情報を検出する方法、実際のプロバイダー/モデルのバグに対する
リグレッションの追加方法について説明します。

<Note>
**QA スタック（qa-lab、qa-channel、live transport lanes）**は別ページで説明されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - アーキテクチャ、コマンド面、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) - `pnpm openclaw qa matrix` のリファレンス。
- [成熟度スコアカード](/ja-JP/maturity/scorecard) - リリース QA エビデンスが安定性と LTS 判断を支える方法。
- [QA チャンネル](/ja-JP/channels/qa-channel) - repo-backed シナリオで使われる合成 transport Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーを扱います。下の [QA 固有ランナー](#qa-specific-runners) では具体的な `qa` 呼び出しを一覧にし、上記のリファレンスへ戻れるようにしています。
</Note>

## クイックスタート

多くの日は次を使います。

- フルゲート（push 前に想定）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカルフルスイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接ファイル指定は Plugin/チャンネルのパスにもルーティングされます: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復修正する場合は、まずターゲットを絞った実行を優先してください。
- Docker-backed QA サイト: `pnpm qa:lab:up`
- Linux VM-backed QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストを変更した場合や追加の信頼性が欲しい場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

## テスト用一時ディレクトリ

テスト所有の一時ディレクトリには `test/helpers/temp-dir.ts` の共有ヘルパーを使い、
所有権を明示し、クリーンアップをテストのライフサイクル内に保ってください。

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` は意図的に手動
クリーンアップメソッドを公開していません。各テスト後のクリーンアップは Vitest が所有します。古い低レベル
ヘルパー（`makeTempDir`、`cleanupTempDirs`、`createTempDirTracker`）は、まだ移行していない
テスト向けに残っています。新規利用は避け、テストが生の temp-dir
動作を明示的に検証している場合を除き、新しい素の
`fs.mkdtemp*` 呼び出しも避けてください。素の一時ディレクトリが本当に必要な場合は、理由付きで監査可能な allow
コメントを追加してください。

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` は、追加された diff 行における新しい素の temp-dir
作成と、共有ヘルパーの新しい手動利用を報告します。既存のクリーンアップスタイルはブロックしません。これは
`scripts/changed-lanes.mjs` と同じテストパス分類に従い、共有ヘルパー実装
自体はスキップします。`check:changed` は、変更されたテストパスに対してこのレポートを
warning-only の CI シグナル（GitHub の警告アノテーションであり、失敗ではありません）として実行します。

## Live と Docker/Parallels ワークフロー

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）:

- live スイート（モデル + gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイム性能レポート: 実際の `openai/gpt-5.5` agent turn には
  `live_openai_candidate=true`、Kova の CPU/heap/trace アーティファクトには
  `deep_profile=true` を付けて `OpenClaw Performance` を dispatch します。毎日のスケジュール実行は、
  `CLAWGRIT_REPORTS_TOKEN` が設定されている場合に mock-provider、deep-profile、GPT 5.5 レーンのアーティファクトを
  `openclaw/clawgrit-reports` に公開します。
  mock-provider レポートには、ソースレベルの Gateway 起動、メモリ、
  Plugin-pressure、繰り返し fake-model hello-loop、CLI 起動の数値も含まれます。
- Docker live モデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキスト turn と小さな file-read 形式のプローブを実行します。
    メタデータが `image` 入力を示すモデルは、小さな画像 turn も実行します。
    プロバイダー障害を切り分ける場合は、追加プローブを `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で無効化してください。
  - CI カバレッジ: 毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` は、どちらも
    `include_live_suites: true` で再利用可能な live/E2E ワークフローを呼び出します。これには、プロバイダーごとにシャードされた Docker live モデルマトリクスジョブが含まれます。
  - 集中的な CI 再実行では、`include_live_suites: true` と `live_models_only: true` を付けて
    `OpenClaw Live And E2E Checks (Reusable)` を dispatch します。
  - 新しい高シグナルのプロバイダー secret は `scripts/ci-hydrate-live-auth.sh` に加え、
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` とその
    scheduled/release 呼び出し元にも追加してください。
- ネイティブ Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live レーンを実行し、
    合成 Slack DM を `/codex bind` でバインドし、`/codex fast` と
    `/codex permissions` を実行した後、ACP ではなくネイティブ Plugin バインディング経由で
    通常の返信と画像添付ルートを検証します。
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Plugin 所有の Codex app-server
    harness を通じて Gateway agent turn を実行し、`/codex status` と `/codex models` を検証します。デフォルトでは
    画像、cron MCP、sub-agent、Guardian プローブも実行します。他の障害を切り分ける場合は、
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` で
    sub-agent プローブを無効化してください。集中的な sub-agent チェックでは、
    他のプローブを無効化します。
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、
    sub-agent プローブ後に終了します。
- Codex オンデマンドインストール smoke: `pnpm test:docker:codex-on-demand`
  - パッケージ化された OpenClaw tarball を Docker にインストールし、OpenAI API-key
    オンボーディングを実行し、Codex Plugin と `@openai/codex` 依存関係が必要時に
    managed npm project root へダウンロードされたことを検証します。
- live Plugin ツール依存関係 smoke: `pnpm test:docker:live-plugin-tool`
  - 実際の `slugify` 依存関係を持つ fixture Plugin を pack し、
    `npm-pack:` 経由でインストールし、managed npm
    project root 配下の依存関係を検証した後、live OpenAI モデルに Plugin ツールを呼び出させ、
    隠された slug を返させます。
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command
    面に対する opt-in の belt-and-suspenders チェックです。
    `/crestodian status` を実行し、永続的なモデル変更をキューに入れ、
    `/crestodian yes` に返信し、audit/config write
    パスを検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に fake Claude CLI がある configless コンテナーで Crestodian を実行し、
    fuzzy planner fallback が監査済みの typed config write に変換されることを検証します。
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、モダンな onboard
    Crestodian エントリーポイントを検証し、setup/model/agent/Discord Plugin +
    SecretRef writes を適用し、config を検証し、audit entries を検証します。同じ
    Ring 0 セットアップパスは QA Lab でも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によりカバーされています。
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` を設定して、
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して isolated な
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSON が Moonshot/K2.6 を報告し、
  assistant transcript が正規化された `usage.cost` を保存していることを検証します。

<Tip>
失敗ケースが 1 つだけ必要な場合は、下で説明する allowlist env vars を使って live テストを絞り込むことを優先してください。
</Tip>

## QA 固有ランナー

これらのコマンドは、QA-lab のリアリズムが必要な場合にメインのテストスイートの横で使います。

CI は専用ワークフローで QA Lab を実行します。Agentic parity は
`QA-Lab - All Lanes` とリリース検証の配下にネストされており、独立した PR ワークフローではありません。
広範な検証には、`rerun_group=qa-parity` または release-checks QA group を指定して
`Full Release Validation` を使ってください。Stable/default リリース
チェックでは、網羅的な live/Docker soak は `run_release_soak=true` の背後に置かれます。
`full` プロファイルは soak を強制的に有効にします。`QA-Lab - All Lanes` は `main` で nightly に、
また manual dispatch から、mock parity レーン、live Matrix レーン、
Convex-managed live Telegram レーン、Convex-managed live Discord レーンを
並列ジョブとして実行します。Scheduled QA と release checks は Matrix に `--profile fast` を
明示的に渡しますが、Matrix CLI と manual workflow input のデフォルトは
`all` のままです。manual dispatch では `all` を `transport`、`media`、
`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブへシャードできます。`OpenClaw Release Checks` は
リリース承認前に parity と fast Matrix および Telegram レーンを実行し、
リリース transport チェックには `mock-openai/gpt-5.5` を使うことで、決定的に保ち、
通常の provider-plugin 起動を避けます。これらの live transport Gateway は
memory search を無効化します。memory behavior は QA parity スイートで引き続きカバーされます。

Full release live media shards は
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使います。これにはすでに
`ffmpeg` と `ffprobe` が含まれています。Docker live model/backend shards は、選択された
commit ごとに一度だけビルドされる共有
`ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使い、各 shard 内で再ビルドする代わりに
`OPENCLAW_SKIP_DOCKER_BUILD=1` で pull します。

- `pnpm openclaw qa suite`
  - ホスト上でリポジトリに裏付けられた QA シナリオを直接実行します。
  - 選択したシナリオセットについて、混在フロー、Vitest、Playwright のシナリオ選択を含む、トップレベルの `qa-evidence.json`、`qa-suite-summary.json`、`qa-suite-report.md` アーティファクトを書き出します。
  - `pnpm openclaw qa run --qa-profile <profile>` によってディスパッチされた場合、選択した分類プロファイルのスコアカードを同じ `qa-evidence.json` に埋め込みます。`smoke-ci` はスリムな証跡（`evidenceMode: "slim"`、エントリごとの `execution` なし）を書き出します。`release` はリリース準備状況の精選スライスを対象にします。`all` はすべての有効な成熟度カテゴリを選択し、完全なスコアカードアーティファクトが必要な場合は明示的な QA Profile Evidence ワークフローディスパッチを対象にします。
  - デフォルトでは、分離された gateway ワーカーで複数の選択済みシナリオを並列実行します。`qa-channel` のデフォルト並列数は 4 です（選択したシナリオ数で上限設定）。ワーカー数を調整するには `--concurrency <count>` を使用し、従来の直列レーンには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトを作成するには `--allow-failures` を使用します。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` は、シナリオ対応の `mock-openai` レーンを置き換えずに、実験的なフィクスチャとプロトコルモックのカバレッジ用にローカルの AIMock 裏付けプロバイダーサーバーを起動します。
- `pnpm openclaw qa coverage --match <query>`
  - シナリオ ID、タイトル、サーフェス、カバレッジ ID、ドキュメント参照、コード参照、Plugin、プロバイダー要件を検索し、一致するスイートターゲットを出力します。
  - 変更対象の挙動やファイルパスは分かっているが最小のシナリオが分からない場合、QA Lab 実行の前にこれを使用します。助言専用です。変更される挙動に基づいて、mock、live、Multipass、Matrix、またはトランスポート証跡を引き続き選択してください。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab を通じて live OpenAI Kitchen Sink Plugin の難関テストを実行します。外部 Kitchen Sink パッケージをインストールし、Plugin SDK サーフェスのインベントリを検証し、`/healthz` と `/readyz` をプローブし、gateway の CPU/RSS 証跡を記録し、live OpenAI ターンを実行し、敵対的診断を確認します。`OPENAI_API_KEY` などの live OpenAI 認証が必要です。ハイドレート済み Testbox セッションでは、`openclaw-testbox-env` ヘルパーが存在する場合、Testbox の live-auth プロファイルを自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - gateway 起動ベンチに加えて、小さな mock QA Lab シナリオパック（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`）を実行し、結合された CPU 観測サマリーを `.artifacts/gateway-cpu-scenarios/` 配下に書き出します。
  - デフォルトでは継続的な高 CPU 観測のみをフラグします（`--cpu-core-warn`、デフォルト `0.9`、`--hot-wall-warn-ms`、デフォルト `30000`）。そのため、短い起動時バーストは、数分間続く gateway 固定化リグレッションのようには見えず、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトに対して実行します。チェックアウトに新しいランタイム出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行し、`qa suite` と同じシナリオ選択およびプロバイダー/モデルフラグを維持します。
  - live 実行では、ゲストで実用的な QA 認証入力を転送します。env ベースのプロバイダーキー、QA live プロバイダー設定パス、存在する場合は `CODEX_HOME` です。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるように、リポジトリルート配下に置く必要があります。
  - 通常の QA レポートとサマリーに加え、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き出します。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業用に、Docker 裏付けの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルインストールし、非対話式の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、パッケージ化された Plugin ランタイムが起動時の依存関係修復なしで読み込まれることを検証し、doctor を実行し、mock OpenAI エンドポイントに対してローカルエージェントターンを 1 回実行します。
  - Discord で同じパッケージ化インストールレーンを実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストトランスクリプト向けに、決定的なビルド済みアプリ Docker smoke を実行します。非表示の OpenClaw ランタイムコンテキストが、表示されるユーザーターンへ漏れるのではなく、非表示のカスタムメッセージとして保持されることを検証します。その後、影響を受けた壊れたセッション JSONL をシードし、`openclaw doctor --fix` がそれをバックアップ付きで active ブランチへ書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内に OpenClaw パッケージ候補をインストールし、インストール済みパッケージのオンボーディングを実行し、インストール済み CLI 経由で Telegram を設定した後、そのインストール済みパッケージを SUT Gateway として live Telegram QA レーンを再利用します。
  - ラッパーはチェックアウトから `qa-lab` ハーネスソースのみをマウントします。インストール済みパッケージが `dist`、`openclaw/plugin-sdk`、バンドル済み Plugin ランタイムを所有するため、このレーンはテスト対象パッケージに現在のチェックアウトの Plugin を混在させません。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。レジストリからインストールする代わりに解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - デフォルトでは `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` により、反復 RTT タイミングを `qa-evidence.json` に出力します。実行を調整するには、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。`OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` はサンプリングする Telegram QA チェック ID のカンマ区切りリストを受け付けます。未設定の場合、デフォルトの RTT 対応チェックは `telegram-mentioned-message-reply` です。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使用します。CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて、`OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定します。CI に `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットが存在する場合、Docker ラッパーは自動的に Convex を選択します。
  - ラッパーは、Docker のビルド/インストール作業の前に、ホスト上の Telegram または Convex 認証情報 env を検証します。意図的に認証情報前のセットアップをデバッグする場合にのみ、`OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに限って共有の `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。Convex 認証情報が選択され、ロールが設定されていない場合、ラッパーは CI では `ci`、CI 外では `maintainer` を使用します。
  - GitHub Actions はこのレーンを手動メンテナーワークフロー `NPM Telegram Beta E2E` として公開します。マージ時には実行されません。このワークフローは `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- GitHub Actions は、1 つの候補パッケージに対するサイド実行のプロダクト証跡用に `Package Acceptance` も公開しています。これは Git ref、公開 npm spec、SHA-256 付き HTTPS tarball URL、信頼済み URL ポリシー、または別の実行からの tarball アーティファクト（`source=ref|npm|url|trusted-url|artifact`）を受け付け、正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、その後、既存の Docker E2E スケジューラーを `smoke`、`package`、`product`、`full`、または `custom` レーンプロファイルで実行します。同じ `package-under-test` アーティファクトに対して Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta プロダクト証跡:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 厳密な tarball URL 証跡にはダイジェストが必要で、公開 URL 安全ポリシーを使用します:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- エンタープライズ/プライベート tarball ミラーは明示的な信頼済みソースポリシーを使用します:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` は信頼済みワークフロー ref から `.github/package-trusted-sources.json` を読み取り、URL 認証情報やワークフロー入力によるプライベートネットワークバイパスは受け付けません。名前付きポリシーが bearer auth を宣言している場合は、固定シークレット `OPENCLAW_TRUSTED_PACKAGE_TOKEN` を設定してください。

- アーティファクト証跡は、別の Actions 実行から tarball アーティファクトをダウンロードします:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI を設定した状態で Gateway を起動した後、設定編集を通じてバンドル済みチャネル/Plugin を有効化します。
  - setup discovery が未設定のダウンロード可能 Plugin を不在のままにすること、最初の設定済み doctor repair が不足している各ダウンロード可能 Plugin を明示的にインストールすること、2 回目の再起動で隠れた依存関係修復が実行されないことを検証します。
  - 既知の古い npm ベースラインもインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補の更新後 doctor がハーネス側の postinstall repair なしでレガシー Plugin 依存関係の残骸をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージ化インストール更新 smoke を実行します。選択された各プラットフォームは、まず要求されたベースラインパッケージをインストールし、その後同じゲスト内でインストール済みの `openclaw update` コマンドを実行し、インストール済みバージョン、更新ステータス、gateway readiness、ローカルエージェントターン 1 回を検証します。
  - 1 つのゲストで反復する場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使用します。サマリーアーティファクトパスとレーンごとのステータスには `--json` を使用します。
  - OpenAI レーンは、デフォルトで live エージェントターン証跡に `openai/gpt-5.5` を使用します。別の OpenAI モデルを検証するには、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels トランスポートの停止が残りのテスト時間を消費しないように、長いローカル実行はホストのタイムアウトでラップします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトはネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き出します。外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認してください。
  - Windows 更新は、コールドゲスト上で更新後 doctor とパッケージ更新作業に 10 分から 15 分かかることがあります。ネストされた npm debug ログが進んでいれば、これは正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux smoke レーンと並列に実行しないでください。これらは VM 状態を共有しており、スナップショット復元、パッケージ提供、またはゲスト gateway 状態で衝突する可能性があります。
  - 更新後証跡は通常のバンドル済み Plugin サーフェスを実行します。音声、画像生成、メディア理解などの capability facade は、エージェントターン自体が単純なテキスト応答のみを確認する場合でも、バンドル済みランタイム API 経由で読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接プロトコルスモークテスト用に、ローカル AIMock provider サーバーだけを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker-backed Tuwunel homeserver に対して Matrix ライブ QA レーンを実行します。ソースチェックアウト専用です - パッケージ化されたインストールには `qa-lab` は含まれません。
  - 完全な CLI、profile/scenario カタログ、env vars、artifact レイアウト:
    [Matrix QA](/ja-JP/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - env の driver と SUT bot token を使用して、実際のプライベートグループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、および
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group id は数値の Telegram chat id である必要があります。
  - 共有プールされた認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使用するか、プールされた lease を有効にするには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - デフォルトは canary、mention gating、command addressing、`/status`、bot-to-bot の mention 付き返信、および core native command replies をカバーします。
    `mock-openai` のデフォルトは、決定論的な reply-chain と Telegram final-message streaming の regression もカバーします。`session_status` などの任意 probe には `--list-scenarios` を使用します。
  - いずれかの scenario が失敗すると非ゼロで終了します。失敗 exit code なしで artifacts を得るには `--allow-failures` を使用します。
  - 同じプライベートグループ内に 2 つの異なる bot が必要で、SUT bot は Telegram username を公開している必要があります。
  - 安定した bot-to-bot 観測のために、両方の bot で `@BotFather` の Bot-to-Bot Communication Mode を有効にし、driver bot がグループ内の bot traffic を観測できるようにしてください。
  - `.artifacts/qa-e2e/...` の下に Telegram QA report、summary、`qa-evidence.json` を書き込みます。返信する scenario には、driver send request から観測された SUT reply までの RTT が含まれます。

`Mantis Telegram Live` は、このレーンの周りにある PR-evidence wrapper です。candidate ref を Convex-leased Telegram credentials で実行し、redacted QA report/evidence bundle を Crabbox desktop browser にレンダリングし、MP4 evidence を記録し、motion-trimmed GIF を生成し、artifact bundle をアップロードし、`pr_number` が設定されている場合は Mantis GitHub App を通じて inline PR evidence を投稿します。maintainer は Actions UI の `Mantis Scenario` (`scenario_id: telegram-live`) から、または pull request comment から直接開始できます。

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` は、PR visual proof 用の agentic native Telegram Desktop before/after wrapper です。Actions UI で freeform `instructions` を指定して、`Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) を通じて、または PR comment から開始します。

```text
@openclaw-mantis telegram desktop proof
```

Mantis agent は PR を読み、どの Telegram-visible behavior が変更を証明するかを判断し、baseline と candidate refs で real-user Crabbox Telegram Desktop proof lane を実行し、native GIF が有用になるまで反復し、ペアの `motionPreview` manifest を書き込み、`pr_number` が設定されている場合は Mantis GitHub App を通じて同じ 2-column GIF table を投稿します。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux desktop を lease または再利用し、native Telegram Desktop をインストールし、leased Telegram SUT bot token で OpenClaw を設定し、gateway を開始し、表示されている VNC desktop から screenshot/MP4 evidence を記録します。
  - デフォルトは `--credential-source convex` なので、workflow には Convex broker secret だけが必要です。`pnpm openclaw qa telegram` と同じ `OPENCLAW_QA_TELEGRAM_*` variables で `--credential-source env` を使用します。
  - Telegram Desktop には引き続き user login/profile が必要です。bot token は OpenClaw だけを設定します。base64 `.tgz` profile archive には `--telegram-profile-archive-env <name>` を使用するか、`--keep-lease` を使用して一度 VNC 経由で手動ログインします。
  - output directory の下に `mantis-telegram-desktop-builder-report.md`、
    `mantis-telegram-desktop-builder-summary.json`、
    `telegram-desktop-builder.png`、および `telegram-desktop-builder.mp4` を書き込みます。

ライブ transport lane は 1 つの標準 contract を共有するため、新しい transport がずれません。レーンごとの coverage matrix は
[QA overview - Live transport coverage](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。
`qa-channel` は広範な synthetic suite であり、その matrix には含まれません。

### Convex 経由の共有 Telegram credentials (v1)

ライブ transport QA で `--credential-source convex` (または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) が有効な場合、QA lab は Convex-backed pool から exclusive lease を取得し、レーン実行中にその lease に Heartbeat を送り、shutdown 時に lease を解放します。この section 名は Discord、Slack、WhatsApp サポートより前のものです。lease contract は kind 間で共有されています。

Reference Convex project scaffold: `qa/convex-credential-broker/`

必須 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (例: `https://your-deployment.convex.site`)
- 選択した role 用の 1 つの secret:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- Credential role selection:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI ではデフォルト `ci`、それ以外では `maintainer`)

任意 env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (デフォルト `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (デフォルト `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (デフォルト `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (デフォルト `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (デフォルト `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (任意の trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は local-only development 用に loopback `http://` Convex URLs を許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用する必要があります。

Maintainer admin commands (pool add/remove/list) には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

maintainer 用 CLI helpers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

live run の前に `doctor` を使用して、secret values を出力せずに Convex site URL、broker secrets、endpoint prefix、HTTP timeout、admin/list reachability を確認します。scripts と CI utilities の machine-readable output には `--json` を使用します。

デフォルト endpoint contract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`)。
Requests は `Authorization: Bearer <role secret>` header で認証します。以下の bodies ではその header を省略しています。

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Exhausted/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Success: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Success: `{ status: "ok" }` (または空の `2xx`)
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success: `{ status: "ok" }` (または空の `2xx`)
- `POST /admin/add` (maintainer secret のみ)
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove` (maintainer secret のみ)
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (maintainer secret のみ)
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Telegram kind の payload shape:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id string である必要があります。
- `admin/add` は `kind: "telegram"` についてこの shape を検証し、不正な payload を拒否します。

Telegram real-user kind の payload shape:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId`、および `telegramApiId` は数値 string である必要があります。
- `tdlibArchiveSha256` と `desktopTdataArchiveSha256` は SHA-256 hex string である必要があります。
- `kind: "telegram-user"` は Mantis Telegram Desktop proof workflow 用に予約されています。Generic QA Lab lane はこれを acquire してはいけません。

Broker-validated multi-channel payloads:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack lane も pool から lease できますが、Slack payload validation は現在 broker ではなく Slack QA runner にあります。Slack rows には
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
を使用します。

### QA への channel の追加

新しい channel adapter の architecture と scenario-helper names は
[QA overview - Adding a channel](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。
最低条件: shared `qa-lab` host seam 上に transport runner を実装し、shared scenario 用の `adapterFactory` を追加し、plugin manifest で `qaRunners` を宣言し、`openclaw qa <runner>` として mount し、`qa/scenarios/` の下に scenarios を作成します。

## Test suites (どこで何が実行されるか)

suite は「realism の増加」(および flakiness/cost の増加) と考えてください。

### Unit / integration (デフォルト)

- Command: `pnpm test`
- Config: untargeted runs は `vitest.full-*.config.ts` shard set を使用し、parallel scheduling のために multi-project shards を per-project configs に展開する場合があります
- Files: `src/**/*.test.ts`、
  `packages/**/*.test.ts`、および `test/**/*.test.ts` の下の core/unit inventories。UI unit tests は専用の `unit-ui` shard で実行されます
- Scope:
  - 純粋な unit tests
  - in-process integration tests (gateway auth、routing、tooling、parsing、config)
  - 既知の bug に対する deterministic regressions
- Expectations:
  - CI で実行される
  - 実際の keys は不要
  - 高速で安定しているべき
  - Resolver と public-surface loader tests は、実際の bundled plugin source APIs ではなく、生成された小さな plugin fixtures で広範な `api.js` と
    `runtime-api.js` fallback behavior を証明する必要があります。実際の plugin API loads は plugin-owned contract/integration suites に属します。

Native dependency policy:

- デフォルトの test installs は任意の native Discord opus builds をスキップします。Discord
  voice は bundled `libopus-wasm` を使用し、`@discordjs/opus` は `allowBuilds` で無効のままにするため、local tests と Testbox lanes は native addon を compile しません。
- native opus performance はデフォルトの OpenClaw install/test loops ではなく、`libopus-wasm` benchmark repo で比較してください。デフォルトの `allowBuilds` で `@discordjs/opus` を `true` に設定しないでください。それにより、無関係な install/test loops が native code を compile することになります。

<AccordionGroup>
  <Accordion title="Projects、shards、scoped lanes">

    - ターゲット指定なしの `pnpm test` は、1つの巨大なネイティブ ルートプロジェクトプロセスではなく、13個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-tooling`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/plugin 作業が無関係なスイートを圧迫することを避けられます。
    - `pnpm test --watch` は引き続きネイティブ ルートの `vitest.config.ts` プロジェクトグラフを使用します。複数シャードのウォッチループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付きレーンに展開します。直接のテスト編集、隣接する `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフの依存先です。設定/セットアップ/パッケージの編集は、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使わない限り、テストを広範囲に実行しません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートなローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン更新では、対象を絞った version/config/root-dependency チェックを実行し、トップレベルの version フィールド以外のパッケージ変更を拒否するガードを適用します。
    - Live Docker ACP ハーネスの編集では、Live Docker 認証スクリプトの shell 構文チェックと Live Docker スケジューラの dry-run という重点チェックを実行します。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定される場合のみ含まれます。dependency、export、version、その他のパッケージサーフェスの編集では、引き続きより広範なガードを使用します。
    - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および同様の純粋なユーティリティ領域の import が軽いユニットテストは、`unit-fast` レーンを通ります。このレーンは `test/setup-openclaw-runtime.ts` をスキップします。状態を持つファイルや runtime が重いファイルは、既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` の helper ソースファイルも、変更モード実行をそれらの軽量レーン内の明示的な隣接テストにマッピングするため、helper の編集でそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルの core helper、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割するため、import が重い1つのバケットが Node テール全体を占有しません。
    - 通常の PR/main CI は、bundled plugin バッチ sweep とリリース専用の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補に対して、それらの plugin-heavy スイート用の別個の `Plugin Prerelease` 子ワークフローを dispatch します。

  </Accordion>

  <Accordion title="埋め込み runner カバレッジ">

    - message-tool discovery 入力や compaction runtime
      context を変更するときは、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化の境界には、重点的な helper 回帰テストを追加してください。
    - 埋め込み runner 統合スイートを健全に保ってください:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, and
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - これらのスイートは、スコープ付き id と compaction の挙動が実際の `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。helper のみのテストは、これらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool と isolation のデフォルト">

    - ベースの Vitest 設定はデフォルトで `threads` です。
    - 共有 Vitest 設定は `isolate: false` を固定し、ルートプロジェクト、e2e、live 設定全体で非分離 runner を使用します。
    - ルート UI レーンは `jsdom` セットアップと optimizer を維持しますが、こちらも共有の非分離 runner で実行します。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false` のデフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 コンパイルの揺れを減らすため、デフォルトで Vitest 子 Node プロセスに `--no-maglev` を追加します。通常の V8 挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
    - `scripts/run-vitest.mjs` は、明示的な非ウォッチ Vitest 実行で stdout または stderr 出力が5分間ない場合に終了します。意図的に無音の調査で watchdog を無効化するには、`OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、diff がどのアーキテクチャレーンをトリガーするかを表示します。
    - pre-commit hook はフォーマット専用です。フォーマット済みファイルを再ステージし、lint、typecheck、tests は実行しません。
    - スマートなローカルチェックゲートが必要な場合は、handoff または push の前に `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付きレーンを通ります。agent が harness、config、package、または contract の編集に本当により広い Vitest カバレッジが必要だと判断した場合のみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は、worker 上限が高いだけで、同じルーティング挙動を保ちます。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストのロードアベレージがすでに高い場合は抑制されるため、複数の同時 Vitest 実行がデフォルトで与える影響は小さくなります。
    - ベース Vitest 設定は、テスト配線が変わったときに changed-mode rerun が正しく保たれるよう、projects/config files を `forceRerunTriggers` としてマークします。
    - 設定は、対応ホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接プロファイリング用に明示的なキャッシュ場所を1つ指定するには、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf デバッグ">

    - `pnpm test:perf:imports` は、Vitest の import-duration レポートと import-breakdown 出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを `origin/main` 以降に変更されたファイルにスコープします。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。設定全体の実行では設定パスをキーとして使用します。include-pattern CI シャードでは、フィルタ済みシャードを個別に追跡できるようにシャード名を追加します。
    - ホットなテストが依然として起動 import に大半の時間を費やす場合は、重い依存関係を狭いローカルの `*.runtime.ts` seam の背後に置き、runtime helper を `vi.mock(...)` に渡すためだけに deep-import するのではなく、その seam を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み diff について、ルーティングされた `test:changed` とネイティブのルートプロジェクトパスを比較し、wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更されたファイル一覧を `scripts/test-projects.mjs` とルート Vitest 設定にルーティングして、現在の dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッドについて main-thread CPU profile を書き込みます。
    - `pnpm test:perf:profile:runner` は、ファイル並列処理を無効にした unit suite について runner CPU+heap profile を書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性 (gateway)

- コマンド: `pnpm test:stability:gateway`
- 設定: `test/vitest/vitest.gateway.config.ts`、`test/vitest/vitest.logging.config.ts`、`test/vitest/vitest.infra.config.ts`。それぞれ1 worker に強制
- スコープ:
  - diagnostics をデフォルトで有効にした実際の loopback Gateway を起動します
  - diagnostic event パスを通じて、合成 gateway message、memory、大きな payload の churn を駆動します
  - Gateway WS RPC 経由で `diagnostics.stability` をクエリします
  - diagnostic stability bundle persistence helper をカバーします
  - recorder が bounded のままであること、合成 RSS サンプルが pressure budget 未満に保たれること、session ごとの queue depth がゼロまで戻ることを assert します
- 期待事項:
  - CI-safe かつ keyless
  - stability-regression follow-up 用の狭いレーンであり、完全な Gateway スイートの代替ではありません

### E2E (repo aggregate)

- コマンド: `pnpm test:e2e`
- スコープ:
  - gateway smoke E2E レーンを実行します
  - mocked Control UI browser E2E レーンを実行します
- 期待事項:
  - CI-safe かつ keyless
  - Playwright Chromium がインストールされている必要があります

### E2E (gateway smoke)

- コマンド: `pnpm test:e2e:gateway`
- 設定: `test/vitest/vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E tests
- Runtime デフォルト:
  - リポジトリの他の部分と同様に、Vitest `threads` を `isolate: false` で使用します。
  - adaptive workers を使用します（CI: 最大2、local: デフォルトで1）。
  - console I/O オーバーヘッドを減らすため、デフォルトで silent mode で実行します。
- 便利な override:
  - worker 数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限16）。
  - verbose な console output を再度有効にするには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - 複数インスタンス gateway のエンドツーエンド挙動
  - WebSocket/HTTP サーフェス、node pairing、より重い networking
- 期待事項:
  - CI で実行されます（pipeline で有効な場合）
  - 実際の key は不要です
  - unit tests より可動部が多いです（遅くなる場合があります）

### E2E (Control UI mocked browser)

- コマンド: `pnpm test:ui:e2e`
- 設定: `test/vitest/vitest.ui-e2e.config.ts`
- ファイル: `ui/src/**/*.e2e.test.ts`
- スコープ:
  - Vite Control UI を起動します
  - Playwright を通じて実際の Chromium ページを駆動します
  - Gateway WebSocket を決定論的な in-browser mock に置き換えます
- 期待事項:
  - `pnpm test:e2e` の一部として CI で実行されます
  - 実際の Gateway、agents、provider keys は不要です
  - browser dependency が存在する必要があります（`pnpm --dir ui exec playwright install chromium`）

### E2E: OpenShell backend smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - アクティブなローカル OpenShell gateway を再利用します
  - 一時的なローカル Dockerfile から sandbox を作成します
  - 実際の `sandbox ssh-config` + SSH exec 経由で OpenClaw の OpenShell backend を実行します
  - sandbox fs bridge を通じて remote-canonical filesystem の挙動を検証します
- 期待事項:
  - Opt-in のみ。デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLI と動作する Docker daemon が必要です
  - アクティブなローカル OpenShell gateway とその config source が必要です
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後 test sandbox を破棄します
- 便利な override:
  - より広い e2e スイートを手動で実行するときにテストを有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI binary または wrapper script を指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - 登録済み gateway config を分離テストに公開するには `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - host policy fixture が使用する Docker gateway IP を上書きするには `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Live (実際の providers + 実際の models)

- コマンド: `pnpm test:live`
- 設定: `test/vitest/vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル済み Plugin ライブテスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で _today_ 本当に動作するか？」
  - プロバイダー形式の変更、ツール呼び出しの癖、認証の問題、レート制限の挙動を検出する
- 期待値:
  - 設計上 CI 安定ではない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - 費用がかかる / レート制限を消費する
  - 「すべて」ではなく、絞り込んだサブセットの実行を推奨
- ライブ実行では、すでにエクスポート済みの API キーとステージング済み認証プロファイルを使用する。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定/認証素材を一時テストホームにコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更することはできない。
- ライブテストで実際のホームディレクトリを意図的に使用する必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定する。
- `pnpm test:live` はデフォルトで静かなモードになる。`[live] ...` の進捗出力は保持し、Gateway ブートストラップログ/Bonjour の雑音はミュートする。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定する。
- API キーローテーション（プロバイダー固有）: カンマ/セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、`OPENCLAW_LIVE_*_KEY` によるライブごとの上書きを使用する。テストはレート制限応答でリトライする。
- 進捗/Heartbeat 出力:
  - ライブスイートは stderr に進捗行を出力するため、Vitest のコンソールキャプチャが静かな場合でも、長いプロバイダー呼び出しが動作中であることが見える。
  - `test/vitest/vitest.live.config.ts` は Vitest のコンソールインターセプトを無効化し、ライブ実行中にプロバイダー/Gateway の進捗行が即座にストリームされるようにする。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整する。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整する。

## どのスイートを実行すべきか？

この判断表を使用する:

- ロジック/テストを編集している: `pnpm test` を実行する（多く変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れている: `pnpm test:e2e` を追加する
- 「ボットが落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグしている: 絞り込んだ `pnpm test:live` を実行する

## ライブ（ネットワークに触れる）テスト

ライブモデルマトリクス、CLI バックエンドスモーク、ACP スモーク、Codex アプリサーバー
ハーネス、すべてのメディアプロバイダーライブテスト（Deepgram、BytePlus、ComfyUI、
画像、音楽、動画、メディアハーネス）、およびライブ実行の認証情報処理について

- [ライブスイートのテスト](/ja-JP/help/testing-live) を参照する。専用の更新および
  Plugin 検証チェックリストについては、
  [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照する。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つのバケットに分かれる:

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で一致するプロファイルキーのライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカル設定ディレクトリ、ワークスペース、任意のプロファイル環境ファイルをマウントする。一致するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles`。
- Docker ライブランナーは、必要に応じて独自の実用的な上限を保持する:
  `test:docker:live-models` は、キュレーション済みのサポート対象で高シグナルなセットをデフォルトとし、
  `test:docker:live-gateway` は `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` をデフォルトとする。明示的により小さい上限または大きなスキャンが必要な場合は、`OPENCLAW_LIVE_MAX_MODELS`
  または Gateway 環境変数を設定する。
- `test:docker:all` は `test:docker:live-build` でライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックし、その後 2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用する。ベアイメージはインストール/更新/Plugin 依存関係レーン用の Node/Git ランナーのみであり、これらのレーンは事前ビルド済み tarball をマウントする。機能イメージは、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールする。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行する。集約では重み付きローカルスケジューラーを使用する。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限は重いライブ、npm インストール、マルチサービスレーンが一斉に開始されないようにする。単一レーンが有効な上限より重い場合でも、プールが空であればスケジューラーはそれを開始でき、その後は再び容量が利用可能になるまで単独で実行し続ける。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`。Docker ホストに余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`（およびその他の `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` 上書き）を調整する。ランナーはデフォルトで Docker プリフライトを実行し、古い OpenClaw E2E コンテナーを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、以降の実行で長いレーンを先に開始するためにそれらのタイミングを使用する。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、パッケージ/イメージ要件、認証情報の CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用する。
- `Package Acceptance` は、「このインストール可能 tarball は製品として動作するか？」を確認する GitHub ネイティブのパッケージゲート。`source=npm`、`source=ref`、`source=url`、`source=trusted-url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードし、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行する。プロファイルは範囲の広さ順に `smoke`、`package`、`product`、`full`（明示的なレーンリスト用に `custom` も）として並ぶ。パッケージ/更新/Plugin 契約、公開済みアップグレード生存者マトリクス、リリースデフォルト、失敗トリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照する。
- ビルドおよびリリースチェックは tsdown 後に `scripts/check-cli-bootstrap-imports.mjs` を実行する。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的ビルドグラフをたどり、コマンドディスパッチ前にそのディスパッチ前ブートストラップグラフが外部パッケージ（Commander、プロンプト UI、undici、ロギング、および同様の起動時に重い依存関係はすべて該当）を静的インポートしている場合に失敗する。また、バンドル済み Gateway 実行チャンクを 70 KB に制限し、そのチャンクから既知のコールド Gateway パス（`control-ui-assets`、`diagnostic-stability-bundle`、`onboard-helpers`、`process-respawn`、`restart-sentinel`、`server-close`、`server-reload-handlers`）を静的インポートすることを拒否する。`scripts/release-check.ts` は別途、パック済み CLI を `--help`、`onboard --help`、`doctor --help`、`status --json --timeout 1`、`config schema`、`models list --provider openai` でスモークテストする。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）で上限が設定されている。そのカットオフまでは、ハーネスは出荷済みパッケージのメタデータ欠落のみを許容する。省略された非公開 QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 派生 git フィクスチャ内の欠落パッチファイル、永続化された `update.channel` の欠落、レガシー Plugin インストールレコード場所、マーケットプレイスインストールレコード永続化の欠落、`plugins update` 中の設定メタデータ移行が該当する。`2026.4.25` より後のパッケージでは、これらのパスは厳格な失敗となる。
- コンテナースモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1 つ以上の実コンテナーを起動し、より高レベルの統合パスを検証する。
- `scripts/lib/openclaw-e2e-instance.sh` を通じてパック済み OpenClaw tarball をインストールする Docker/Bash E2E レーンは、`npm install` を `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（デフォルト `600s`、デバッグのためにラッパーを無効化するには `0` を設定）で制限する。

ライブモデル Docker ランナーは、必要な CLI 認証ホームのみ
（実行が絞り込まれていない場合はサポート対象のすべて）もバインドマウントし、その後それらを
実行前にコンテナーホームへコピーするため、外部 CLI OAuth はホストの認証ストアを
変更せずにトークンを更新できる:

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`。デフォルトで Claude、Codex、Gemini をカバーし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` による厳格な Droid/OpenCode カバレッジを含む）
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex アプリサーバーハーネススモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- 可観測性スモーク: `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke`、および `pnpm qa:observability:smoke` は非公開 QA ソースチェックアウトレーン。npm tarball には QA Lab が含まれないため、意図的にパッケージ Docker リリースレーンには含めていない。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なスキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Npm tarball オンボーディング/チャネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パック済み OpenClaw tarball を Docker 内にグローバルインストールし、env-ref オンボーディング経由で OpenAI を設定し、デフォルトで Telegram も設定し、doctor を実行し、モックされた OpenAI エージェントターンを 1 回実行する。事前ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使用し、ホスト再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を使用し、チャネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使用する。

- リリースユーザージャーニースモーク: `pnpm test:docker:release-user-journey` は、パックされた OpenClaw tarball をクリーンな Docker ホームにグローバルインストールし、オンボーディングを実行し、モックされた OpenAI プロバイダーを設定し、エージェントターンを実行し、外部 Plugin をインストール/アンインストールし、ローカルフィクスチャに対して ClickClack を設定し、送信/受信メッセージングを検証し、Gateway を再起動し、doctor を実行します。
- リリース型付きオンボーディングスモーク: `pnpm test:docker:release-typed-onboarding` は、パックされた tarball をインストールし、実際の TTY を通じて `openclaw onboard` を操作し、OpenAI を env-ref プロバイダーとして設定し、生のキーが永続化されないことを検証し、モックされたエージェントターンを実行します。
- リリースメディア/メモリスモーク: `pnpm test:docker:release-media-memory` は、パックされた tarball をインストールし、PNG 添付からの画像理解、OpenAI 互換の画像生成出力、メモリ検索の想起、Gateway 再起動後も想起が維持されることを検証します。
- リリースアップグレードユーザージャーニースモーク: `pnpm test:docker:release-upgrade-user-journey` は、デフォルトで候補 tarball より古い最新の公開済みベースラインをインストールし、公開済みパッケージ上でプロバイダー/Plugin/ClickClack の状態を設定し、候補 tarball にアップグレードしてから、コアのエージェント/Plugin/チャネルジャーニーを再実行します。古い公開済みベースラインが存在しない場合は、候補バージョンを再利用します。`OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` でベースラインを上書きします。
- リリース Plugin マーケットプレイススモーク: `pnpm test:docker:release-plugin-marketplace` は、ローカルフィクスチャマーケットプレイスからインストールし、インストール済み Plugin を更新し、アンインストールし、インストールメタデータが削除された状態で Plugin CLI が消えることを検証します。
- Skill インストールスモーク: `pnpm test:docker:skill-install` は、パックされた OpenClaw tarball を Docker 内にグローバルインストールし、設定でアップロード済みアーカイブのインストールを無効化し、検索から現在のライブ ClawHub Skill slug を解決し、`openclaw skills install` でインストールし、インストール済み Skill と `.clawhub` の origin/lock メタデータを検証します。
- 更新チャネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パックされた OpenClaw tarball を Docker 内にグローバルインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャネルと更新後の Plugin 動作を検証し、その後パッケージ `stable` に戻して更新ステータスを確認します。
- アップグレードサバイバースモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャネル設定、Plugin allowlist、古い Plugin 依存関係状態、既存のワークスペース/セッションファイルを含む、汚れた古いユーザーフィクスチャの上に、パックされた OpenClaw tarball をインストールします。ライブプロバイダーやチャネルキーなしでパッケージ更新と非対話 doctor を実行し、その後 loopback Gateway を起動して、設定/状態の保持と起動/ステータス予算を確認します。
- 公開済みアップグレードサバイバースモーク: `pnpm test:docker:published-upgrade-survivor` は、デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、組み込みコマンドレシピでそのベースラインを設定し、結果の設定を検証し、その公開済みインストールを候補 tarball に更新し、非対話 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、設定済み intent、状態保持、起動、`/healthz`、`/readyz`、RPC ステータス予算を確認します。単一のベースラインは `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きし、集約スケジューラーには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような正確なローカルベースラインを展開させ、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` で `reported-issues` のような issue 形状のフィクスチャを展開します。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれます。Package Acceptance はこれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` のようなメタベースライントークンを解決し、Full Release Validation はリリースソークパッケージゲートを `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストのトランスクリプト永続化と、影響を受ける重複したプロンプト書き換えブランチの doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在のツリーをパックし、分離されたホーム内で `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み画像プロバイダーを返すことを検証します。事前ビルド済み tarball は `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用し、ホストビルドは `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` でスキップし、または `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` でビルド済み Docker イメージから `dist/` をコピーします。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各コンテナで 1 つの npm キャッシュを共有します。更新スモークは、候補 tarball にアップグレードする前の stable ベースラインとして、デフォルトで npm `latest` を使います。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きします。非 root インストーラーチェックは、root 所有のキャッシュエントリがユーザーローカルのインストール動作を隠さないよう、分離された npm キャッシュを維持します。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は、`OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` により重複する direct-npm グローバル更新をスキップします。直接の `npm install -g` カバレッジが必要な場合は、その env なしでスクリプトをローカル実行します。
- エージェント共有ワークスペース削除 CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) は、デフォルトでルート Dockerfile イメージをビルドし、分離されたコンテナホームに 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行し、有効な JSON と保持されたワークスペース動作を検証します。install-smoke イメージは `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` で再利用します。
- Gateway ネットワーキング (2 コンテナ、WS 認証 + ヘルス): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- ブラウザー CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) は、ソース E2E イメージと Chromium レイヤーをビルドし、生 CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP ロールスナップショットがリンク URL、カーソルに昇格されたクリック可能要素、iframe 参照、フレームメタデータをカバーすることを検証します。
- OpenAI Responses web_search 最小 reasoning リグレッション: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) は、モックされた OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後プロバイダースキーマを強制的に reject させ、生の詳細が Gateway ログに出ることを確認します。
- MCP チャネルブリッジ (シード済み Gateway + stdio ブリッジ + 生 Claude notification-frame スモーク): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- OpenClaw バンドル MCP ツール (実際の stdio MCP サーバー + 埋め込み OpenClaw プロファイル allow/deny スモーク): `pnpm test:docker:agent-bundle-mcp-tools` (スクリプト: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP クリーンアップ (実際の Gateway + 分離された cron と one-shot subagent 実行後の stdio MCP 子プロセス teardown): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (ローカルパス、`file:`、hoisted dependencies を持つ npm レジストリ、不正な npm パッケージメタデータ、git moving refs、ClawHub kitchen-sink、マーケットプレイス更新、Claude-bundle enable/inspect のインストール/更新スモーク): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトの kitchen-sink パッケージ/ランタイムペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を設定します。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub フィクスチャサーバーを使用します。
- Plugin 更新変更なしスモーク: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin ライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、パックされた OpenClaw tarball を素のコンテナにインストールし、npm Plugin をインストールし、enable/disable を切り替え、ローカル npm レジストリ経由でアップグレードとダウングレードを行い、インストール済みコードを削除し、その後、各ライフサイクルフェーズの RSS/CPU メトリクスをログしながら、アンインストールが古い状態を引き続き削除することを検証します。
- 設定リロードメタデータスモーク: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` は、ローカルパス、`file:`、hoisted dependencies を持つ npm レジストリ、git moving refs、ClawHub フィクスチャ、マーケットプレイス更新、Claude-bundle enable/inspect のインストール/更新スモークをカバーします。`pnpm test:docker:plugin-update` は、インストール済み Plugin の変更なし更新動作をカバーします。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡付きの npm Plugin のインストール、enable、disable、アップグレード、ダウングレード、欠落コードのアンインストールをカバーします。

共有機能イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにない場合に pull します。QR とインストーラー Docker テストは、共有のビルド済みアプリランタイムではなく、パッケージ/インストール動作を検証するため、独自の Dockerfile を維持します。

ライブモデル Docker ランナーも現在の checkout を読み取り専用で bind-mount
し、コンテナ内の一時 workdir にステージします。これにより、ランタイム
イメージをスリムに保ちながら、正確なローカル source/config に対して
Vitest を実行できます。ステージング手順は、`.pnpm-store`、`.worktrees`、
`__openclaw_vitest__`、アプリローカルの `.build` や Gradle 出力ディレクトリ
などの大きなローカル専用キャッシュやアプリビルド出力をスキップするため、
Docker ライブ実行がマシン固有のアーティファクトのコピーに数分を費やすことは
ありません。また、Gateway ライブプローブがコンテナ内で実際の
Telegram/Discord などのチャネルワーカーを起動しないように、
`OPENCLAW_SKIP_CHANNELS=1` も設定します。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、
その Docker レーンから Gateway ライブカバレッジを絞り込む、または除外する
必要がある場合は、`OPENCLAW_LIVE_GATEWAY_*` も渡してください。

`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換
HTTP エンドポイントを有効にした OpenClaw Gateway コンテナを起動し、その
Gateway に対して固定された Open WebUI コンテナを起動し、Open WebUI 経由で
サインインし、`/api/models` が `openclaw/default` を公開していることを検証し、
その後 Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャット
リクエストを送信します。ライブモデル完了を待たずに Open WebUI のサインインと
モデル検出後に停止すべきリリースパス CI チェックでは、`OPENWEBUI_SMOKE_MODE=models`
を設定します。初回実行は、Docker が Open WebUI イメージを pull する必要があり、
Open WebUI が独自のコールドスタートセットアップを完了する必要があるため、
目に見えて遅くなる場合があります。このレーンは、プロセス環境、ステージ済み
認証プロファイル、または明示的な `OPENCLAW_PROFILE_FILE` を通じて提供される、
利用可能なライブモデルキーを想定しています。成功した実行は
`{ "ok": true, "model": "openclaw/default", ... }` のような小さな JSON ペイロードを出力します。

`test:docker:mcp-channels` は意図的に決定的であり、実際の Telegram、Discord、または iMessage アカウントを必要としません。シード済みの Gateway コンテナを起動し、`openclaw mcp serve` を生成する 2 つ目のコンテナを開始してから、ルーティングされた会話の検出、トランスクリプトの読み取り、添付ファイルのメタデータ、ライブイベントキューの挙動、送信ルーティング、Claude 形式のチャンネル + 権限通知を、実際の stdio MCP ブリッジ越しに検証します。通知チェックは生の stdio MCP フレームを直接検査するため、特定のクライアント SDK がたまたま表面化する内容だけでなく、ブリッジが実際に出力する内容を smoke で検証できます。

`test:docker:agent-bundle-mcp-tools` は決定的であり、ライブモデルキーを必要としません。リポジトリの Docker イメージをビルドし、コンテナ内で実際の stdio MCP プローブサーバーを起動し、そのサーバーを埋め込みの OpenClaw bundle MCP ランタイム経由で実体化し、ツールを実行してから、`coding` と `messaging` が `bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルタすることを検証します。

`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデルキーを必要としません。実際の stdio MCP プローブサーバーを持つシード済み Gateway を起動し、分離された cron ターンと `sessions_spawn` の 1 回限りの子ターンを実行してから、各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP 平易な言語スレッド smoke (CI ではありません):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/debug ワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な env var:

- `OPENCLAW_CONFIG_DIR=...` (デフォルト: `~/.openclaw`) は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...` (デフォルト: `~/.openclaw/workspace`) は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...` はマウントされ、テスト実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時 config/workspace ディレクトリを使用し、外部 CLI auth マウントなしで、`OPENCLAW_PROFILE_FILE` から source された env var のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (デフォルト: `~/.cache/openclaw/docker-cli-tools`、ただし実行がすでに CI/managed bind dir を使用している場合を除く) は、Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI auth ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` へコピーされます
  - デフォルトディレクトリ (実行が特定の providers に絞られていない場合に使用): `.factory`, `.gemini`, `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれた provider 実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推論された必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きします
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` は実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` はコンテナ内の providers をフィルタします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドを必要としない再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、creds が env ではなく profile store から来ることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI smoke 用に gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI smoke で使用される nonce チェックプロンプトを上書きします
- `OPENWEBUI_IMAGE=...` は、固定された Open WebUI イメージタグを上書きします

## Docs 健全性

ドキュメント編集後は docs チェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全な Mintlify アンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフライン回帰 (CI-safe)

これらは実際の providers を使わない「実パイプライン」回帰です:

- Gateway ツール呼び出し (モック OpenAI、実際の gateway + agent loop): `src/gateway/gateway.test.ts` (ケース: 「gateway agent loop 経由でモック OpenAI ツール呼び出しを end-to-end で実行する」)
- Gateway ウィザード (WS `wizard.start`/`wizard.next`、config 書き込み + auth 強制): `src/gateway/gateway.test.ts` (ケース: 「ws 越しに ウィザード を実行し、auth token config を書き込む」)

## Agent 信頼性 evals (Skills)

「agent 信頼性 evals」のように振る舞う CI-safe テストはすでにいくつかあります:

- 実際の gateway + agent loop を通したモックツール呼び出し (`src/gateway/gateway.test.ts`)。
- セッション wiring と config 効果を検証する end-to-end ウィザードフロー (`src/gateway/gateway.test.ts`)。

Skills にまだ不足しているもの ([Skills](/ja-JP/tools/skills) を参照):

- **意思決定:** skills がプロンプトに列挙されているとき、agent は適切な skill を選ぶか (または無関係なものを避けるか)?
- **遵守:** agent は使用前に `SKILL.md` を読み、必要な手順/args に従うか?
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、sandbox 境界をアサートする multi-turn シナリオ。

将来の evals はまず決定的なものにしてください:

- mock providers を使用して、ツール呼び出し + 順序、skill ファイル読み取り、セッション wiring をアサートするシナリオ runner。
- skill に焦点を当てた小規模なシナリオスイート (使用 vs 回避、gating、prompt injection)。
- オプションの live evals (opt-in、env-gated) は、CI-safe スイートが整った後にのみ追加します。

## 契約テスト (plugin とチャンネル形状)

契約テストは、登録されたすべての plugin とチャンネルがそのインターフェース契約に準拠していることを検証します。検出されたすべての plugins を反復し、形状と挙動のアサーションスイートを実行します。デフォルトの `pnpm test` unit lane は、これらの共有 seam と smoke ファイルを意図的にスキップします。共有チャンネルまたは provider surface に触れる場合は、契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャンネル契約のみ: `pnpm test:contracts:channels`
- Provider 契約のみ: `pnpm test:contracts:plugins`

### チャンネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります。現在のトップレベルカテゴリ:

- **channel-catalog** - bundled/registry チャンネルカタログエントリメタデータ
- **plugin** (registry-backed, sharded) - 基本的な plugin 登録形状
- **surfaces-only** (registry-backed, sharded) - `actions`、`setup`、`status`、`outbound`、`messaging`、`threading`、`directory`、`gateway` の surface ごとの形状チェック
- **session-binding** (registry-backed) - セッション binding 挙動
- **outbound-payload** - メッセージ payload 構造と正規化
- **group-policy** (fallback) - チャンネルごとのデフォルト group policy 強制
- **threading** (registry-backed, sharded) - スレッド id 処理
- **directory** (registry-backed, sharded) - directory/roster API
- **registry** と **plugins-core.\*** - チャンネル plugin registry、loader、config-write authorization internals

これらのスイートで使用される inbound dispatch-capture と outbound-payload harness helper は、`src/plugin-sdk/channel-contract-testing.ts` (npm-excluded、公開 SDK subpath ではありません) を通じて内部的に公開されています。このディレクトリに standalone の `inbound.contract.test.ts` ファイルはありません。

### Provider 契約

`src/plugins/contracts/*.contract.test.ts` にあります。現在のカテゴリには次が含まれます:

- **shape** - plugin manifest、API、runtime export shape
- **plugin-registration** (+ parallel) - manifest 登録ケース
- **package-manifest** - package manifest 要件
- **loader** - plugin loader setup/teardown 挙動
- **registry** - plugin 契約 registry の内容と lookup
- **providers** - bundled providers 全体の共有 provider 挙動、および web-search providers
- **auth-choice** - auth choice メタデータと setup 挙動
- **provider-catalog-deprecation** - deprecated provider catalog メタデータ
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - provider setup ウィザード契約
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - capability-specific provider 契約
- **session-actions**, **session-attachments**, **session-entry-projection** - plugin-owned session state 契約
- **scheduled-turns** - plugin scheduled turn メタデータと timestamp bounds
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - plugin host/runtime lifecycle と import-boundary 契約
- **extension-runtime-dependencies** - extensions の runtime dependency placement

### 実行タイミング

- plugin-sdk exports または subpaths を変更した後
- チャンネルまたは provider plugin を追加または変更した後
- plugin 登録または検出をリファクタした後

契約テストは CI で実行され、実際の API keys を必要としません。

## 回帰の追加 (ガイダンス)

live で見つかった provider/model issue を修正するとき:

- 可能であれば CI-safe 回帰を追加します (mock/stub provider、または正確な request-shape 変換の capture)
- それが本質的に live-only (rate limits、auth policies) の場合は、live test を狭く保ち、env vars による opt-in にします
- バグを捕捉する最小の層を対象にすることを優先します:
  - provider request conversion/replay bug -> 直接 models test
  - gateway session/history/tool pipeline bug -> gateway live smoke または CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry metadata (`listSecretTargetRegistryEntries()`) から SecretRef class ごとに 1 つのサンプル target を導出し、traversal-segment exec ids が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは、分類されていない target ids で意図的に失敗するため、新しい classes が黙ってスキップされることはありません。

## 関連

- [live のテスト](/ja-JP/help/testing-live)
- [updates と plugins のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
