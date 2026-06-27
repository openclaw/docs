---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway + エージェントの動作のデバッグ
summary: 'テストキット: ユニット/e2e/live スイート、Docker ランナー、および各テストの対象'
title: テスト
x-i18n:
    generated_at: "2026-06-27T11:45:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e20fc4964326d1b3a3c0f5f2c48985b373a528f0734c4a89ac0925032070fa2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（ユニット/統合、e2e、ライブ）と小規模な
Docker ランナー群があります。このドキュメントは「テスト方法」のガイドです。

- 各スイートが対象とする範囲（および意図的に _対象外_ としている範囲）。
- 一般的なワークフロー（ローカル、プッシュ前、デバッグ）で実行するコマンド。
- ライブテストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダーの問題に対する回帰テストを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、ライブトランスポートレーン）** は別途文書化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) - `pnpm openclaw qa matrix` のリファレンス。
- [成熟度スコアカード](/ja-JP/maturity/scorecard) - リリース QA 証拠が安定性と LTS 判断を支える方法。
- [QA チャンネル](/ja-JP/channels/qa-channel) - リポジトリ由来のシナリオで使用する合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行を扱います。以下の QA 固有ランナーのセクション（[QA 固有ランナー](#qa-specific-runners)）では、具体的な `qa` 呼び出しを列挙し、上記のリファレンスへ戻る導線を示します。
</Note>

## クイックスタート

通常の作業日:

- フルゲート（プッシュ前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカルフルスイート実行: `pnpm test:max`
- 直接の Vitest ウォッチループ: `pnpm test:watch`
- 直接のファイル指定は、extension/channel パスにもルーティングされるようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 1 つの失敗を反復調査している場合は、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れる場合、または追加の確信が必要な場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

## テスト用一時ディレクトリ

テストが所有する一時ディレクトリには、`test/helpers/temp-dir.ts` の共有ヘルパーを優先して使用してください。これにより所有権が明示され、同じテストライフサイクル内でクリーンアップを保てます。

```ts
import { afterEach } from "vitest";
import { createTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = createTempDirTracker();

afterEach(tempDirs.cleanup);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

テストがすでにパスの配列またはセットを所有している場合は、`makeTempDir(tempDirs, prefix)` と `cleanupTempDirs(tempDirs)` を使用してください。生の temp-dir 挙動を明示的に検証するケースでない限り、テスト内で新しい裸の `fs.mkdtemp*` 呼び出しを追加することは避けてください。テストが意図的に裸の一時ディレクトリを必要とする場合は、具体的な理由を含む監査可能な許可コメントを追加してください。

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

移行の可視性のために、`node scripts/report-test-temp-creations.mjs` は、既存のクリーンアップスタイルをブロックせず、追加された diff 行にある新しい裸の temp-dir 作成を報告します。そのファイルスコープは、別個の test-helper ファイル名ヒューリスティックを維持するのではなく、`scripts/changed-lanes.mjs` が使うものと同じテストパス分類に意図的に従い、共有ヘルパー実装自体はスキップします。`check:changed` は変更されたテストパスに対してこのレポートを警告専用の CI シグナルとして実行します。検出結果は GitHub の警告アノテーションであり、失敗ではありません。

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）:

- ライブスイート（モデル + Gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つのライブファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイム性能レポート: 実際の `openai/gpt-5.5` エージェントターンには `live_openai_candidate=true` を、Kova の CPU/ヒープ/トレース成果物には `deep_profile=true` を付けて `OpenClaw Performance` をディスパッチします。日次スケジュール実行は、`CLAWGRIT_REPORTS_TOKEN` が構成されている場合、mock-provider、deep-profile、GPT 5.5 レーンの成果物を `openclaw/clawgrit-reports` に公開します。mock-provider レポートには、ソースレベルの Gateway 起動、メモリ、Plugin 圧力、反復 fake-model hello-loop、CLI 起動の数値も含まれます。
- Docker ライブモデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さなファイル読み取り形式のプローブを実行するようになりました。メタデータが `image` 入力を示すモデルは、小さな画像ターンも実行します。プロバイダー失敗を切り分ける場合は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効にしてください。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の `OpenClaw Release Checks` はどちらも、`include_live_suites: true` で再利用可能なライブ/E2E ワークフローを呼び出します。これには、プロバイダーごとにシャーディングされた個別の Docker ライブモデルマトリックスジョブが含まれます。
  - 集中した CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)` をディスパッチしてください。
  - 新しい高シグナルのプロバイダーシークレットは、`scripts/ci-hydrate-live-auth.sh` に加え、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` とそのスケジュール/リリース呼び出し元に追加してください。
- ネイティブ Codex bound-chat スモーク: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker ライブレーンを実行し、`/codex bind` で合成 Slack DM をバインドし、`/codex fast` と `/codex permissions` を実行したうえで、ACP ではなくネイティブ Plugin バインディング経由で通常の返信と画像添付ルートを検証します。
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness`
  - Plugin 所有の Codex app-server ハーネスを通じて Gateway エージェントターンを実行し、`/codex status` と `/codex models` を検証します。デフォルトでは、画像、cron MCP、サブエージェント、Guardian プローブも実行します。他の Codex app-server 失敗を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` でサブエージェントプローブを無効にしてください。サブエージェント確認に集中する場合は、他のプローブを無効にします: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、これはサブエージェントプローブ後に終了します。
- Codex オンデマンドインストールスモーク: `pnpm test:docker:codex-on-demand`
  - パッケージ化された OpenClaw tarball を Docker にインストールし、OpenAI API キーのオンボーディングを実行し、Codex Plugin と `@openai/codex` 依存関係が必要時に管理対象 npm プロジェクトルートへダウンロードされたことを検証します。
- ライブ Plugin ツール依存関係スモーク: `pnpm test:docker:live-plugin-tool`
  - 実際の `slugify` 依存関係を持つフィクスチャ Plugin をパックし、`npm-pack:` 経由でインストールし、管理対象 npm プロジェクトルート配下の依存関係を検証したうえで、ライブ OpenAI モデルに Plugin ツールを呼び出して隠し slug を返すよう要求します。
- Crestodian レスキューコマンドスモーク: `pnpm test:live:crestodian-rescue-channel`
  - メッセージチャンネルのレスキューコマンドサーフェスに対するオプトインの念押し確認です。`/crestodian status` を実行し、永続的なモデル変更をキューに入れ、`/crestodian yes` と返信し、監査/設定書き込みパスを検証します。
- Crestodian プランナー Docker スモーク: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に偽の Claude CLI を置いた設定なしコンテナー内で Crestodian を実行し、ファジープランナーのフォールバックが監査済みの型付き設定書き込みに変換されることを検証します。
- Crestodian 初回実行 Docker スモーク: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw 状態ディレクトリから開始し、現代的な onboard Crestodian エントリポイントを検証し、setup/model/agent/Discord Plugin + SecretRef 書き込みを適用し、設定を検証し、監査エントリを検証します。同じ Ring 0 セットアップパスは、QA Lab でも `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi コストスモーク: `MOONSHOT_API_KEY` を設定して、`openclaw models list --provider moonshot --json` を実行し、その後 `moonshot/kimi-k2.6` に対して隔離された `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` を実行します。JSON が Moonshot/K2.6 を報告し、アシスタントトランスクリプトが正規化済みの `usage.cost` を保存していることを検証します。

<Tip>
失敗しているケースが 1 つだけ必要な場合は、以下で説明する allowlist 環境変数を使ってライブテストを絞り込むことを優先してください。
</Tip>

## QA 固有ランナー

QA-lab の現実性が必要な場合、これらのコマンドはメインのテストスイートと並んで使います。

CI は専用ワークフローで QA Lab を実行します。エージェント的な同等性は `QA-Lab - All Lanes` とリリース検証の下にネストされており、独立した PR ワークフローではありません。広範な検証では、`rerun_group=qa-parity` または release-checks QA グループを指定した `Full Release Validation` を使用してください。stable/default リリースチェックでは、網羅的なライブ/Docker soak は `run_release_soak=true` の背後に置かれます。`full` プロファイルは soak を強制的に有効にします。`QA-Lab - All Lanes` は、`main` で毎晩実行され、手動ディスパッチからも実行されます。mock parity レーン、ライブ Matrix レーン、Convex 管理のライブ Telegram レーン、Convex 管理のライブ Discord レーンが並列ジョブとして実行されます。スケジュール QA とリリースチェックは Matrix に `--profile fast` を明示的に渡しますが、Matrix CLI と手動ワークフロー入力のデフォルトは `all` のままです。手動ディスパッチでは、`all` を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャーディングできます。`OpenClaw Release Checks` はリリース承認前に、parity に加えて fast Matrix と Telegram レーンを実行し、リリーストランスポートチェックには `mock-openai/gpt-5.5` を使用するため、決定的であり、通常のプロバイダー Plugin 起動を避けられます。これらのライブトランスポート Gateway はメモリ検索を無効にします。メモリ挙動は QA parity スイートで引き続きカバーされます。

フルリリースのライブメディアシャードは `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。これにはすでに `ffmpeg` と `ffprobe` が含まれています。Docker ライブモデル/バックエンドシャードは、選択されたコミットごとに 1 回ビルドされる共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各シャード内で再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` でそれを pull します。

- `pnpm openclaw qa suite`
  - リポジトリに基づく QA シナリオをホスト上で直接実行します。
  - 選択したシナリオセットについて、混合フロー、Vitest、Playwright のシナリオ選択を含む、トップレベルの `qa-evidence.json`、`qa-suite-summary.json`、`qa-suite-report.md` アーティファクトを書き込みます。
  - `pnpm openclaw qa run --qa-profile <profile>` によってディスパッチされると、選択されたタクソノミープロファイルのスコアカードを同じ `qa-evidence.json` に埋め込みます。`smoke-ci` はスリムな証跡を書き込み、`evidenceMode: "slim"` を設定して、各エントリの `execution` を省略します。`release` は厳選されたリリース準備状況の範囲をカバーします。`all` は有効なすべての成熟度カテゴリを選択し、完全なスコアカードアーティファクトが必要な場合の明示的な QA Profile Evidence ワークフローディスパッチを意図しています。
  - デフォルトでは、分離された Gateway ワーカーで複数の選択済みシナリオを並列実行します。`qa-channel` のデフォルト並列数は 4 です（選択されたシナリオ数で上限設定）。ワーカー数を調整するには `--concurrency <count>` を使用し、以前のシリアルレーンには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` は、シナリオ対応の `mock-openai` レーンを置き換えずに、実験的なフィクスチャおよびプロトコルモックのカバレッジ用に、ローカル AIMock ベースのプロバイダーサーバーを起動します。
- `pnpm openclaw qa coverage --match <query>`
  - シナリオ ID、タイトル、サーフェス、カバレッジ ID、ドキュメント参照、コード参照、Plugin、プロバイダー要件を検索し、一致するスイートターゲットを出力します。
  - 変更された挙動またはファイルパスは分かっているが最小のシナリオが分からない場合、QA Lab 実行の前にこれを使用します。これは助言のみです。変更される挙動に基づいて、mock、live、Multipass、Matrix、またはトランスポート証跡を引き続き選択してください。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab を通じて live OpenAI Kitchen Sink Plugin のガントレットを実行します。外部 Kitchen Sink パッケージをインストールし、Plugin SDK サーフェスインベントリを検証し、`/healthz` と `/readyz` をプローブし、Gateway の CPU/RSS 証跡を記録し、live OpenAI ターンを実行し、敵対的診断を確認します。`OPENAI_API_KEY` などの live OpenAI 認証が必要です。hydrated Testbox セッションでは、`openclaw-testbox-env` ヘルパーが存在する場合、Testbox live-auth プロファイルを自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチに加えて、小さな mock QA Lab シナリオパック（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`）を実行し、`.artifacts/gateway-cpu-scenarios/` 配下に結合された CPU 観測サマリーを書き込みます。
  - デフォルトでは継続的な高 CPU 観測のみをフラグします（`--cpu-core-warn` と `--hot-wall-warn-ms`）。そのため、短い起動時バーストは、数分間続く Gateway 固着リグレッションのように見せずにメトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使用します。チェックアウトに新しいランタイム出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択挙動を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、ゲストで実用的なサポート対象 QA 認証入力を転送します。env ベースのプロバイダーキー、QA live プロバイダー設定パス、存在する場合は `CODEX_HOME` です。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるように、リポジトリルート配下に維持する必要があります。
  - 通常の QA レポートとサマリーに加えて、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業向けに、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルにインストールし、非対話式の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、パッケージ化された Plugin ランタイムが起動時依存関係修復なしでロードされることを検証し、doctor を実行し、mock OpenAI エンドポイントに対して 1 回のローカルエージェントターンを実行します。
  - Discord で同じパッケージ化インストールレーンを実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストトランスクリプト用の決定的なビルド済みアプリ Docker smoke を実行します。非表示の OpenClaw ランタイムコンテキストが、表示されるユーザーターンへ漏れずに、非表示のカスタムメッセージとして永続化されることを検証します。その後、影響を受ける壊れたセッション JSONL をシードし、`openclaw doctor --fix` がバックアップ付きでそれをアクティブブランチに書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内に OpenClaw パッケージ候補をインストールし、インストール済みパッケージのオンボーディングを実行し、インストール済み CLI 経由で Telegram を設定し、そのインストール済みパッケージを SUT Gateway として live Telegram QA レーンを再利用します。
  - ラッパーはチェックアウトから `qa-lab` ハーネスソースのみをマウントします。インストール済みパッケージが `dist`、`openclaw/plugin-sdk`、同梱 Plugin ランタイムを所有するため、このレーンは現在のチェックアウトの Plugin をテスト対象パッケージへ混在させません。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。レジストリからインストールする代わりに解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - デフォルトでは、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` により、反復 RTT タイミングを `qa-evidence.json` に出力します。RTT 実行を調整するには、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。`OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` は、サンプリングする Telegram QA チェック ID のカンマ区切りリストを受け付けます。未設定の場合、デフォルトの RTT 対応チェックは `telegram-mentioned-message-reply` です。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使用します。CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて `OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定します。CI で `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットが存在する場合、Docker ラッパーは Convex を自動選択します。
  - ラッパーは、Docker のビルド/インストール作業の前に、ホスト上で Telegram または Convex 認証情報 env を検証します。認証情報設定前のデバッグを意図的に行う場合のみ、`OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンでのみ共有の `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。Convex 認証情報が選択され、ロールが設定されていない場合、ラッパーは CI 内では `ci`、CI 外では `maintainer` を使用します。
  - GitHub Actions は、このレーンを手動メンテナーワークフロー `NPM Telegram Beta E2E` として公開します。merge 時には実行されません。このワークフローは `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- GitHub Actions は、1 つの候補パッケージに対するサイド実行の製品証跡として `Package Acceptance` も公開しています。信頼済み ref、公開 npm spec、SHA-256 付き HTTPS tarball URL、または別の実行からの tarball アーティファクトを受け付け、正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、その後、smoke、package、product、full、または custom レーンプロファイルで既存の Docker E2E スケジューラを実行します。同じ `package-under-test` アーティファクトに対して Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta 製品証跡:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL 証跡にはダイジェストが必要で、公開 URL 安全ポリシーを使用します:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- エンタープライズ/プライベート tarball ミラーは、明示的な信頼済みソースポリシーを使用します:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` は信頼済みワークフロー ref から `.github/package-trusted-sources.json` を読み取り、URL 認証情報やワークフロー入力のプライベートネットワークバイパスを受け付けません。指定されたポリシーが bearer auth を宣言している場合は、固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを設定します。

- アーティファクト証跡は、別の Actions 実行から tarball アーティファクトをダウンロードします:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI を設定した Gateway を起動してから、設定編集によって同梱チャネル/Plugin を有効化します。
  - セットアップ検出により、未設定のダウンロード可能 Plugin が存在しないままになること、最初の設定済み doctor 修復が不足している各ダウンロード可能 Plugin を明示的にインストールすること、2 回目の再起動で非表示の依存関係修復が実行されないことを検証します。
  - 既知の古い npm ベースラインもインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補の更新後 doctor がハーネス側 postinstall 修復なしでレガシー Plugin 依存関係の残骸をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージ化インストール更新 smoke を実行します。選択された各プラットフォームは、まず要求されたベースラインパッケージをインストールし、その後、同じゲスト内でインストール済みの `openclaw update` コマンドを実行して、インストール済みバージョン、更新ステータス、Gateway readiness、1 回のローカルエージェントターンを検証します。
  - 1 つのゲストで反復作業を行う場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使用します。サマリーアーティファクトパスとレーンごとのステータスには `--json` を使用します。
  - OpenAI レーンは、デフォルトで live エージェントターン証跡に `openai/gpt-5.5` を使用します。別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels トランスポートの停止が残りのテスト時間を消費しないように、長いローカル実行はホストの timeout でラップします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトはネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認してください。
  - Windows 更新は、コールドゲスト上の更新後 doctor とパッケージ更新作業で 10 分から 15 分かかることがあります。ネストされた npm debug ログが進んでいる場合、それはまだ正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux smoke レーンと並列実行しないでください。これらは VM 状態を共有しており、スナップショット復元、パッケージ提供、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後証跡は通常の同梱 Plugin サーフェスを実行します。speech、image generation、media understanding などの capability facade は、エージェントターン自体が単純なテキスト応答のみをチェックする場合でも、同梱ランタイム API 経由でロードされるためです。

- `pnpm openclaw qa aimock`
  - 直接プロトコルのスモークテスト用に、ローカル AIMock プロバイダーサーバーだけを起動します。
- `pnpm openclaw qa matrix`
  - 破棄可能な Docker バックエンドの Tuwunel ホームサーバーに対して Matrix ライブ QA レーンを実行します。ソースチェックアウト限定です - パッケージ済みインストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、環境変数、アーティファクトレイアウト: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 環境変数のドライバーと SUT ボットトークンを使用して、実際の非公開グループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール資格情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使用するか、プールされたリースをオプトインするには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - デフォルトでは、カナリア、メンションゲート、コマンドアドレス指定、`/status`、ボット間のメンション付き返信、コアネイティブコマンド返信をカバーします。`mock-openai` のデフォルトでは、決定的な返信チェーンと Telegram 最終メッセージストリーミングのリグレッションもカバーします。`session_status` などの任意プローブには `--list-scenarios` を使用します。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じ非公開グループ内に、2 つの異なるボットが必要です。SUT ボットは Telegram ユーザー名を公開している必要があります。
  - 安定したボット間観測のために、両方のボットで `@BotFather` の Bot-to-Bot Communication Mode を有効化し、ドライバーボットがグループのボットトラフィックを観測できるようにします。
  - Telegram QA レポート、サマリー、`qa-evidence.json` を `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、ドライバーの送信リクエストから観測された SUT 返信までの RTT が含まれます。

`Mantis Telegram Live` は、このレーンを囲む PR エビデンスラッパーです。候補 ref を Convex リースの Telegram 資格情報で実行し、伏せ字化された QA レポート/エビデンスバンドルを Crabbox デスクトップブラウザーでレンダリングし、MP4 エビデンスを記録し、モーショントリミング済み GIF を生成し、アーティファクトバンドルをアップロードし、`pr_number` が設定されている場合は Mantis GitHub App 経由でインライン PR エビデンスを投稿します。メンテナーは Actions UI の `Mantis Scenario` (`scenario_id:
telegram-live`) から、またはプルリクエストコメントから直接開始できます。

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` は、PR の視覚的証明のためのエージェント型ネイティブ Telegram Desktop 前後比較ラッパーです。Actions UI から自由形式の `instructions` で、`Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) 経由で、または PR コメントから開始します。

```text
@openclaw-mantis telegram desktop proof
```

Mantis エージェントは PR を読み、変更を証明する Telegram に表示される動作を判断し、ベースライン ref と候補 ref で実ユーザーの Crabbox Telegram Desktop 証明レーンを実行し、ネイティブ GIF が有用になるまで反復し、ペアの `motionPreview` マニフェストを書き込み、`pr_number` が設定されている場合は Mantis GitHub App 経由で同じ 2 列 GIF テーブルを投稿します。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux デスクトップをリースまたは再利用し、ネイティブ Telegram Desktop をインストールし、リースされた Telegram SUT ボットトークンで OpenClaw を構成し、Gateway を起動し、表示されている VNC デスクトップからスクリーンショット/MP4 エビデンスを記録します。
  - ワークフローが Convex ブローカーシークレットだけを必要とするように、デフォルトは `--credential-source convex` です。`pnpm openclaw qa telegram` と同じ `OPENCLAW_QA_TELEGRAM_*` 変数で `--credential-source env` を使用します。
  - Telegram Desktop には、引き続きユーザーログイン/プロファイルが必要です。ボットトークンは OpenClaw のみを構成します。base64 `.tgz` プロファイルアーカイブには `--telegram-profile-archive-env <name>` を使用するか、`--keep-lease` を使用して一度 VNC 経由で手動ログインします。
  - 出力ディレクトリ配下に、`mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png`、`telegram-desktop-builder.mp4` を書き込みます。

ライブトランスポートレーンは、新しいトランスポートがずれないように 1 つの標準コントラクトを共有します。レーンごとのカバレッジマトリックスは [QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、そのマトリックスの一部ではありません。

### Convex 経由の共有 Telegram 資格情報 (v1)

ライブトランスポート QA で `--credential-source convex` (または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) が有効な場合、QA lab は Convex バックエンドのプールから排他的リースを取得し、レーンの実行中にそのリースへ Heartbeat を送信し、シャットダウン時にリースを解放します。このセクション名は Discord、Slack、WhatsApp サポートより前からありますが、リースコントラクトは種類をまたいで共有されます。

参考 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必要な環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL` (例: `https://your-deployment.convex.site`)
- 選択したロール用のシークレット 1 つ:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` は `maintainer` 用
  - `OPENCLAW_QA_CONVEX_SECRET_CI` は `ci` 用
- 資格情報ロール選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数のデフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI ではデフォルトで `ci`、それ以外では `maintainer`)

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (デフォルト `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (デフォルト `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (デフォルト `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (デフォルト `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (デフォルト `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (任意のトレース ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル限定開発用に loopback `http://` Convex URL を許可します。

`OPENCLAW_QA_CONVEX_SITE_URL` は通常運用では `https://` を使用するべきです。

メンテナー管理コマンド (プールの追加/削除/一覧) には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー用 CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を出力せずに Convex サイト URL、ブローカーシークレット、エンドポイントプレフィックス、HTTP タイムアウト、管理/一覧到達性を確認します。スクリプトと CI ユーティリティで機械可読出力が必要な場合は `--json` を使用します。

デフォルトエンドポイントコントラクト (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/再試行可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 成功: `{ status: "ok", index, data }`
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

Telegram 種類のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` でこの形状を検証し、不正な形式のペイロードを拒否します。

Telegram 実ユーザー種類のペイロード形状:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId`、`telegramApiId` は数値文字列である必要があります。
- `tdlibArchiveSha256` と `desktopTdataArchiveSha256` は SHA-256 16 進文字列である必要があります。
- `kind: "telegram-user"` は Mantis Telegram Desktop 証明ワークフロー用に予約されています。汎用 QA Lab レーンはこれを取得してはいけません。

ブローカー検証済みのマルチチャネルペイロード:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack レーンもプールからリースできますが、Slack ペイロード検証は現在、ブローカーではなく Slack QA ランナーにあります。Slack 行には `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用します。

### QA へのチャネル追加

新しいチャネルアダプターのアーキテクチャとシナリオヘルパー名は [QA 概要 → チャネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低基準: 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成します。

## テストスイート (どこで何が実行されるか)

スイートは「リアリズムが増す」もの (そして不安定さ/コストも増すもの) と考えてください。

### ユニット / 統合 (デフォルト)

- コマンド: `pnpm test`
- 設定: ターゲット指定なしの実行は `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定へ展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下のコア/ユニットインベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- 範囲:
  - 純粋なユニットテスト
  - インプロセス統合テスト (Gateway 認証、ルーティング、ツーリング、解析、設定)
  - 既知のバグに対する決定的リグレッション
- 期待:
  - CI で実行されます
  - 実キーは不要です
  - 高速かつ安定しているべきです
  - リゾルバーと公開サーフェスローダーのテストは、実際のバンドル Plugin ソース API ではなく、生成された小さな Plugin フィクスチャで広範な `api.js` と `runtime-api.js` のフォールバック動作を証明する必要があります。実 Plugin API のロードは、Plugin 所有のコントラクト/統合スイートに属します。

ネイティブ依存関係ポリシー:

- デフォルトのテストインストールでは、任意のネイティブ Discord opus ビルドをスキップします。Discord 音声はバンドルされた `libopus-wasm` を使用し、`@discordjs/opus` は `allowBuilds` で無効のままにするため、ローカルテストと Testbox レーンはネイティブアドオンをコンパイルしません。
- ネイティブ opus の性能比較は、デフォルトの OpenClaw インストール/テストループではなく、`libopus-wasm` ベンチマークリポジトリで行います。デフォルトの `allowBuilds` で `@discordjs/opus` を `true` に設定しないでください。それにより、無関係なインストール/テストループがネイティブコードをコンパイルするようになります。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ付きレーン">

    - ターゲット指定のない `pnpm test` は、1 つの巨大なネイティブルートプロジェクトプロセスではなく、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/extension 作業が無関係なスイートを圧迫するのを避けられます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使います。複数シャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンへルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付きレーンへ展開します。直接編集されたテスト、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカルの import グラフ依存先が対象です。config/setup/package の編集では、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使わない限り、テストを広範囲には実行しません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートなローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン更新では、ターゲットを絞った version/config/root-dependency チェックを実行し、トップレベルの version フィールド以外の package 変更を拒否するガードも適用します。
    - Live Docker ACP ハーネスの編集では、重点チェックを実行します。live Docker 認証スクリプトのシェル構文と、live Docker スケジューラのドライランです。`package.json` 変更は、diff が `scripts["test:docker:live-*"]` に限定されている場合のみ含まれます。依存関係、export、version、その他の package surface の編集では、引き続きより広いガードを使います。
    - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および類似の純粋なユーティリティ領域からの import の軽いユニットテストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンにルーティングされます。stateful/runtime-heavy なファイルは既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` の helper ソースファイルも、changed-mode 実行をそれらの軽いレーン内の明示的な兄弟テストにマッピングするため、helper の編集ではそのディレクトリの重いスイート全体の再実行を避けられます。
    - `auto-reply` には、トップレベルの core helpers、トップレベルの `reply.*` integration tests、`src/auto-reply/reply/**` サブツリー向けの専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードへ分割し、import の重い 1 つのバケットが Node の末尾全体を占有しないようにしています。
    - 通常の PR/main CI は、extension の一括 sweep とリリース専用の `agentic-plugins` シャードを意図的にスキップします。完全リリース検証は、リリース候補でそれらの plugin/extension-heavy なスイート向けに、別個の `Plugin プレリリース` 子ワークフローをディスパッチします。

  </Accordion>

  <Accordion title="組み込み runner カバレッジ">

    - message-tool discovery 入力または compaction runtime
      context を変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋な routing と normalization
      境界には、重点を絞った helper regression を追加してください。
    - 組み込み runner の integration suites を健全に保ってください:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, and
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - これらのスイートは、スコープ付き id と compaction の動作が実際の
      `run.ts` / `compact.ts` パスを通じて引き続き流れることを検証します。helper-only tests は、
      それらの integration paths の十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool と isolation defaults">

    - ベース Vitest config のデフォルトは `threads` です。
    - 共有 Vitest config は `isolate: false` を固定し、
      root projects、e2e、live configs 全体で non-isolated runner を使います。
    - root UI レーンは独自の `jsdom` setup と optimizer を維持しますが、
      共有 non-isolated runner でも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest config から同じ `threads` + `isolate: false`
      デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 compile churn を減らすため、Vitest 子 Node
      プロセスにデフォルトで `--no-maglev` を追加します。
      標準の V8 動作と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
    - `scripts/run-vitest.mjs` は、明示的な非 watch Vitest 実行で
      stdout または stderr 出力が 5 分間ない場合に終了します。意図的に無音の調査で watchdog を無効にするには
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、diff がどの architecture lane をトリガーするかを表示します。
    - pre-commit hook は formatting-only です。フォーマット済みファイルを再ステージし、
      lint、typecheck、tests は実行しません。
    - handoff または push の前にスマートなローカルチェックゲートが必要な場合は、
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付きレーンを経由します。
      agent が harness、config、package、または contract の編集に本当により広い Vitest カバレッジが必要だと判断した場合のみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使ってください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じ routing
      動作を保ち、worker cap だけを高くします。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストの load average がすでに高い場合は後退するため、複数の同時
      Vitest 実行による影響はデフォルトで小さくなります。
    - ベース Vitest config は、test wiring が変わったときにも changed-mode rerun が正しく保たれるように、
      projects/config files を `forceRerunTriggers` としてマークします。
    - config は、サポート対象ホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接 profiling 用に明示的な cache location を 1 つ使いたい場合は、
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` は、Vitest import-duration reporting と
      import-breakdown output を有効にします。
    - `pnpm test:perf:imports:changed` は、同じ profiling view を
      `origin/main` 以降に変更されたファイルへスコープします。
    - シャード timing data は `.artifacts/vitest-shard-timings.json` に書き込まれます。
      whole-config runs は config path を key として使います。include-pattern CI
      shards は shard name を追加するため、filtered shards を個別に追跡できます。
    - ある hot test がまだ startup imports にほとんどの時間を費やしている場合は、
      heavy dependencies を狭いローカル `*.runtime.ts` 境界の背後に置き、
      `vi.mock(...)` に渡すためだけに runtime helpers を deep-import するのではなく、その境界を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、routing された
      `test:changed` を、その committed
      diff に対するネイティブルートプロジェクトパスと比較し、wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更されたファイル一覧を
      `scripts/test-projects.mjs` と root Vitest config にルーティングして、現在の
      dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite startup と transform overhead 用の main-thread CPU profile を書き込みます。
    - `pnpm test:perf:profile:runner` は、file parallelism を無効にした unit suite 用の runner CPU+heap profiles を書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（gateway）

- コマンド: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`、1 worker に強制
- スコープ:
  - diagnostics をデフォルトで有効にした実際の loopback Gateway を起動する
  - synthetic gateway message、memory、large-payload churn を diagnostic event path 経由で駆動する
  - Gateway WS RPC 経由で `diagnostics.stability` を問い合わせる
  - diagnostic stability bundle persistence helpers をカバーする
  - recorder が bounded のままであること、synthetic RSS samples が pressure budget を下回ること、per-session queue depths がゼロに戻ることをアサートする
- 期待事項:
  - CI-safe かつ keyless
  - stability-regression follow-up 向けの狭いレーンであり、完全な Gateway suite の代替ではない

### E2E（repo aggregate）

- コマンド: `pnpm test:e2e`
- スコープ:
  - gateway smoke E2E レーンを実行する
  - mocked Control UI browser E2E レーンを実行する
- 期待事項:
  - CI-safe かつ keyless
  - Playwright Chromium がインストールされている必要がある

### E2E（gateway smoke）

- コマンド: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E tests
- Runtime defaults:
  - repo の他の部分と同様に、Vitest `threads` と `isolate: false` を使います。
  - adaptive workers を使います（CI: 最大 2、local: デフォルト 1）。
  - console I/O overhead を減らすため、デフォルトで silent mode で実行します。
- 便利な overrides:
  - worker count を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - verbose console output を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - multi-instance gateway の end-to-end 動作
  - WebSocket/HTTP surfaces、node pairing、より重い networking
- 期待事項:
  - CI で実行される（pipeline で有効な場合）
  - 実際の keys は不要
  - unit tests より moving parts が多い（遅くなる場合がある）

### E2E（Control UI mocked browser）

- コマンド: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- ファイル: `ui/src/**/*.e2e.test.ts`
- スコープ:
  - Vite Control UI を起動する
  - Playwright で実際の Chromium page を操作する
  - Gateway WebSocket を deterministic in-browser mocks に置き換える
- 期待事項:
  - `pnpm test:e2e` の一部として CI で実行される
  - 実際の Gateway、agents、provider keys は不要
  - Browser dependency が存在する必要がある（`pnpm --dir ui exec playwright install chromium`）

### E2E: OpenShell backend smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - active local OpenShell gateway を再利用する
  - 一時的な local Dockerfile から sandbox を作成する
  - 実際の `sandbox ssh-config` + SSH exec 越しに OpenClaw の OpenShell backend を実行する
  - sandbox fs bridge を通じて remote-canonical filesystem behavior を検証する
- 期待事項:
  - opt-in のみ。デフォルトの `pnpm test:e2e` 実行には含まれない
  - local `openshell` CLI と動作する Docker daemon が必要
  - active local OpenShell gateway とその config source が必要
  - isolated `HOME` / `XDG_CONFIG_HOME` を使い、その後 test sandbox を破棄する
- 便利な overrides:
  - broader e2e suite を手動で実行するときにテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - non-default CLI binary または wrapper script を指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - registered gateway config を isolated test に公開するには `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - host policy fixture が使う Docker gateway IP を上書きするには `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Live（実際の providers + 実際の models）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル Plugin ライブテスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で _今日_ 本当に動くか？」
  - プロバイダー形式の変更、ツール呼び出しの癖、認証の問題、レート制限の挙動を検出する
- 期待値:
  - 設計上 CI 安定ではない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - 費用がかかる / レート制限を消費する
  - 「すべて」ではなく、絞り込んだサブセットの実行を推奨
- ライブ実行では、すでにエクスポート済みの API キーとステージ済みの認証プロファイルを使用する。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定/認証素材を一時テストホームへコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更できない。
- ライブテストで実際のホームディレクトリを意図的に使用する必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定する。
- `pnpm test:live` はデフォルトで静かなモードになる。`[live] ...` の進行出力は保持し、Gateway ブートストラップログ/Bonjour の雑音をミュートする。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定する。
- API キーのローテーション（プロバイダー固有）: カンマ/セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、`OPENCLAW_LIVE_*_KEY` によるライブごとの上書きを使用する。テストはレート制限レスポンス時に再試行する。
- 進行/Heartbeat 出力:
  - ライブスイートは stderr に進行行を出力するようになったため、Vitest のコンソールキャプチャが静かな場合でも、時間のかかるプロバイダー呼び出しがアクティブであることを視認できる。
  - `vitest.live.config.ts` は Vitest のコンソール介入を無効化し、ライブ実行中にプロバイダー/Gateway の進行行が即座にストリームされるようにする。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整する。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整する。

## どのスイートを実行すべきか？

この判断表を使用する:

- ロジック/テストを編集する場合: `pnpm test` を実行（多く変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れる場合: `pnpm test:e2e` を追加
- 「ボットが落ちている」のデバッグ / プロバイダー固有の失敗 / ツール呼び出し: 絞り込んだ `pnpm test:live` を実行

## ライブ（ネットワークに触れる）テスト

ライブモデルマトリクス、CLI バックエンドスモーク、ACP スモーク、Codex app-server
ハーネス、およびすべてのメディアプロバイダーのライブテスト（Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス）、さらにライブ実行の認証情報処理については、
[ライブスイートのテスト](/ja-JP/help/testing-live) を参照。専用の更新および
Plugin 検証チェックリストについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照。

## Docker ランナー（任意の「Linux で動く」チェック）

これらの Docker ランナーは 2 つの区分に分かれる:

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で対応するプロファイルキーのライブファイルのみ（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）を実行し、ローカル設定ディレクトリ、ワークスペース、任意のプロファイル env ファイルをマウントする。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles`。
- Docker ライブランナーは、必要に応じて独自の実用的な上限を保持する:
  `test:docker:live-models` は、キュレーション済みの対応済み高シグナルセットをデフォルトとし、
  `test:docker:live-gateway` は `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` をデフォルトとする。明示的により小さい上限やより大きいスキャンが必要な場合は、`OPENCLAW_LIVE_MAX_MODELS`
  または Gateway env 変数を設定する。
- `test:docker:all` は `test:docker:live-build` でライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックしてから、2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用する。ベアイメージは install/update/plugin-dependency レーン用の Node/Git ランナーのみであり、それらのレーンは事前ビルド済み tarball をマウントする。機能イメージは built-app 機能レーン用に、同じ tarball を `/app` へインストールする。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択済みプランを実行する。集約は重み付きローカルスケジューラーを使用する。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限により重いライブ、npm-install、マルチサービスのレーンがすべて同時に開始しないようにする。単一のレーンがアクティブな上限より重い場合でも、プールが空ならスケジューラーはそれを開始でき、その後キャパシティが再び利用可能になるまで単独で実行し続ける。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`、および `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`。Docker ホストに余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整する。ランナーはデフォルトで Docker preflight を実行し、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを表示し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、後続の実行で長いレーンを先に開始するためにそのタイミングを使用する。Docker をビルドまたは実行せずに重み付きレーンマニフェストを表示するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択済みレーン、パッケージ/イメージ要件、認証情報の CI プランを表示するには `node scripts/test-docker-all.mjs --plan-json` を使用する。
- `Package Acceptance` は「このインストール可能な tarball はプロダクトとして動くか？」を検証する GitHub ネイティブのパッケージゲート。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から 1 つの候補パッケージを解決し、それを `package-under-test` としてアップロードしてから、選択された ref を再パックするのではなく、その正確な tarball に対して再利用可能な Docker E2E レーンを実行する。プロファイルは範囲の広さ順に `smoke`、`package`、`product`、`full`。パッケージ/更新/Plugin 契約、公開済みアップグレード生存マトリクス、リリースデフォルト、失敗トリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照。
- ビルドおよびリリースチェックは tsdown 後に `scripts/check-cli-bootstrap-imports.mjs` を実行する。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的ビルドグラフをたどり、コマンドディスパッチ前の pre-dispatch 起動が Commander、プロンプト UI、undici、ロギングなどのパッケージ依存関係をインポートしている場合に失敗する。また、バンドルされた Gateway 実行チャンクを予算内に保ち、既知の cold Gateway パスの静的インポートを拒否する。パッケージ化 CLI スモークは、ルートヘルプ、onboard ヘルプ、doctor ヘルプ、status、config schema、model-list コマンドもカバーする。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限される。その期限までは、ハーネスは出荷済みパッケージのメタデータ不足のみを許容する。省略された private QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 派生 git フィクスチャ内の欠落したパッチファイル、欠落した永続化済み `update.channel`、レガシー Plugin install-record の場所、欠落した marketplace install-record 永続化、および `plugins update` 中の設定メタデータ移行。`2026.4.25` より後のパッケージでは、これらのパスは厳密な失敗になる。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1 つ以上の実コンテナを起動し、より高レベルの統合パスを検証する。
- `scripts/lib/openclaw-e2e-instance.sh` を通じてパック済み OpenClaw tarball をインストールする Docker/Bash E2E レーンは、`npm install` を `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（デフォルト `600s`。デバッグ時にラッパーを無効化するには `0` を設定）で制限する。

ライブモデル Docker ランナーは、必要な CLI 認証ホームのみ（または実行が絞り込まれていない場合は対応するすべて）もバインドマウントし、実行前にそれらをコンテナホームへコピーする。これにより、外部 CLI OAuth はホスト認証ストアを変更せずにトークンを更新できる:

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`。デフォルトで Claude、Codex、Gemini をカバーし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` による厳密な Droid/OpenCode カバレッジを含む）
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- 可観測性スモーク: `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke`、および `pnpm qa:observability:smoke` は private QA ソースチェックアウトレーン。npm tarball には QA Lab が含まれないため、意図的にパッケージ Docker リリースレーンの一部ではない。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なスキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Npm tarball オンボーディング/チャンネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パック済み OpenClaw tarball を Docker にグローバルインストールし、デフォルトで env-ref オンボーディングを介して OpenAI と Telegram を設定し、doctor を実行し、モック済み OpenAI エージェントターンを 1 回実行する。事前ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使用し、ホスト再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を使用し、チャンネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使用する。

- リリースユーザージャーニースモーク: `pnpm test:docker:release-user-journey` は、パックされた OpenClaw tarball をクリーンな Docker ホームにグローバルインストールし、オンボーディングを実行し、モックされた OpenAI プロバイダーを設定し、エージェントターンを実行し、外部プラグインをインストール/アンインストールし、ローカルフィクスチャに対して ClickClack を設定し、送信/受信メッセージングを検証し、Gateway を再起動し、doctor を実行します。
- リリース型付きオンボーディングスモーク: `pnpm test:docker:release-typed-onboarding` は、パックされた tarball をインストールし、実際の TTY 経由で `openclaw onboard` を操作し、OpenAI を env-ref プロバイダーとして設定し、生キーが永続化されていないことを検証し、モックされたエージェントターンを実行します。
- リリースメディア/メモリースモーク: `pnpm test:docker:release-media-memory` は、パックされた tarball をインストールし、PNG 添付ファイルからの画像理解、OpenAI 互換の画像生成出力、メモリー検索の想起、Gateway 再起動後も想起が保持されることを検証します。
- リリースアップグレードユーザージャーニースモーク: `pnpm test:docker:release-upgrade-user-journey` は、デフォルトでは候補 tarball より古い最新の公開済みベースラインをインストールし、公開済みパッケージ上でプロバイダー/プラグイン/ClickClack 状態を設定し、候補 tarball にアップグレードしてから、コアのエージェント/プラグイン/チャンネルジャーニーを再実行します。古い公開済みベースラインが存在しない場合は、候補バージョンを再利用します。ベースラインを `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` で上書きできます。
- リリースプラグインマーケットプレイススモーク: `pnpm test:docker:release-plugin-marketplace` は、ローカルフィクスチャマーケットプレイスからインストールし、インストール済みプラグインを更新し、アンインストールし、インストールメタデータが刈り込まれた状態でプラグイン CLI が消えることを検証します。
- Skill インストールスモーク: `pnpm test:docker:skill-install` は、パックされた OpenClaw tarball を Docker にグローバルインストールし、設定でアップロード済みアーカイブのインストールを無効化し、検索から現在のライブ ClawHub skill slug を解決し、`openclaw skills install` でインストールし、インストール済み Skill と `.clawhub` の origin/lock メタデータを検証します。
- 更新チャンネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パックされた OpenClaw tarball を Docker にグローバルインストールし、package `stable` から git `dev` に切り替え、永続化されたチャンネルとプラグインの更新後動作を検証し、その後 package `stable` に戻して更新ステータスを確認します。
- アップグレードサバイバースモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャンネル設定、プラグイン許可リスト、古いプラグイン依存状態、既存のワークスペース/セッションファイルを含む汚れた旧ユーザーフィクスチャの上に、パックされた OpenClaw tarball をインストールします。ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話 doctor を実行し、その後 loopback Gateway を起動して、設定/状態の保持と起動/ステータス予算を確認します。
- 公開済みアップグレードサバイバースモーク: `pnpm test:docker:published-upgrade-survivor` は、デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、組み込みコマンドレシピでそのベースラインを設定し、結果の設定を検証し、その公開済みインストールを候補 tarball に更新し、非対話 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、設定済み intent、状態保持、起動、`/healthz`、`/readyz`、RPC ステータス予算を確認します。単一のベースラインは `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きできます。集約スケジューラには、`openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なローカルベースラインを展開させ、`reported-issues` のような `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` で issue 形状のフィクスチャを展開させます。reported-issues セットには、外部 OpenClaw プラグインインストールの自動修復用に `configured-plugin-installs` が含まれます。パッケージ受け入れでは、それらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` のようなメタベースライントークンを解決し、完全リリース検証では release-soak パッケージゲートを `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストの transcript 永続化と、影響を受ける重複したプロンプト書き換え分岐の doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在のツリーをパックし、隔離されたホーム内で `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み画像プロバイダーを返すことを検証します。ビルド済み tarball は `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用し、ホストビルドは `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` でスキップし、ビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使います。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各コンテナ間で 1 つの npm キャッシュを共有します。更新スモークは、候補 tarball にアップグレードする前の stable ベースラインとして、デフォルトで npm `latest` を使います。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きできます。非 root インストーラーチェックは、root 所有のキャッシュエントリがユーザーローカルのインストール挙動を覆い隠さないように、隔離された npm キャッシュを維持します。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` で重複する direct-npm グローバル更新をスキップします。直接 `npm install -g` のカバレッジが必要な場合は、その環境変数なしでローカルにスクリプトを実行します。
- エージェント共有ワークスペース削除 CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace`（スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`）は、デフォルトで root Dockerfile イメージをビルドし、隔離されたコンテナホームに 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行し、有効な JSON と保持されたワークスペース挙動を検証します。インストールスモークイメージを再利用するには、`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使います。
- Gateway ネットワーキング（2 コンテナ、WS 認証 + ヘルス）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- Browser CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot`（スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`）は、ソース E2E イメージと Chromium レイヤーをビルドし、生 CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP ロールスナップショットがリンク URL、カーソル昇格クリック可能要素、iframe ref、フレームメタデータをカバーすることを検証します。
- OpenAI Responses web_search minimal reasoning 回帰: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、モックされた OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後プロバイダースキーマの拒否を強制して、生の詳細が Gateway ログに現れることを確認します。
- MCP チャンネルブリッジ（シード済み Gateway + stdio ブリッジ + 生 Claude notification-frame スモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw バンドル MCP ツール（実際の stdio MCP サーバー + 埋め込み OpenClaw プロファイル allow/deny スモーク）: `pnpm test:docker:agent-bundle-mcp-tools`（スクリプト: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- Cron/サブエージェント MCP クリーンアップ（実際の Gateway + 隔離された cron とワンショットサブエージェント実行後の stdio MCP 子プロセス解体）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- プラグイン（ローカルパス、`file:`、hoist された依存関係を持つ npm レジストリ、不正な npm パッケージメタデータ、git moving refs、ClawHub kitchen-sink、マーケットプレイス更新、Claude-bundle 有効化/検査のインストール/更新スモーク）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定します。デフォルトの kitchen-sink パッケージ/ランタイムペアを上書きするには、`OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を使います。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub フィクスチャサーバーを使います。
- プラグイン更新 unchanged スモーク: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- プラグインライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、パックされた OpenClaw tarball を bare コンテナにインストールし、npm プラグインをインストールし、有効化/無効化を切り替え、ローカル npm レジストリ経由でアップグレードとダウングレードを行い、インストール済みコードを削除し、その後アンインストールが古い状態を削除し続けることを検証しつつ、各ライフサイクルフェーズの RSS/CPU メトリクスをログに記録します。
- 設定再読み込みメタデータスモーク: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- プラグイン: `pnpm test:docker:plugins` は、ローカルパス、`file:`、hoist された依存関係を持つ npm レジストリ、git moving refs、ClawHub フィクスチャ、マーケットプレイス更新、Claude-bundle 有効化/検査のインストール/更新スモークをカバーします。`pnpm test:docker:plugin-update` は、インストール済みプラグインの unchanged 更新挙動をカバーします。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡付き npm プラグインのインストール、有効化、無効化、アップグレード、ダウングレード、コード欠落時のアンインストールをカバーします。

共有 functional イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにない場合に pull します。QR とインストーラーの Docker テストは、共有のビルド済みアプリランタイムではなくパッケージ/インストール挙動を検証するため、それぞれ独自の Dockerfile を維持します。

live-model Docker ランナーは、現在のチェックアウトも読み取り専用で bind-mount し、
コンテナ内の一時 workdir にステージングします。これにより、ランタイム
イメージをスリムに保ちながら、正確にローカルのソース/設定に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build` や
Gradle 出力ディレクトリなど、大きなローカル専用キャッシュやアプリのビルド出力をスキップするため、
Docker live 実行がマシン固有のアーティファクトのコピーに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、gateway live probe はコンテナ内で
実際の Telegram/Discord などの channel worker を起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker lane から gateway
live coverage を絞り込む、または除外する必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルな互換性 smoke です。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw gateway コンテナを起動し、その gateway に対して固定された Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証してから、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
live model completion を待たずに Open WebUI サインインとモデル検出後に停止する必要がある
release-path CI チェックでは、`OPENWEBUI_SMOKE_MODE=models` を設定してください。
初回実行は、Docker が Open WebUI イメージを pull する必要があり、Open WebUI 自体の cold-start setup が
完了するまで待つ必要があるため、目に見えて遅くなることがあります。
この lane は使用可能な live model key を想定しています。プロセス環境、
ステージング済みの auth profile、または明示的な `OPENCLAW_PROFILE_FILE` で指定してください。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の Telegram、Discord、iMessage アカウントを必要としません。
seed 済みの Gateway コンテナを起動し、`openclaw mcp serve` を spawn する 2 つ目のコンテナを起動してから、
routed conversation discovery、transcript reads、attachment metadata、
live event queue behavior、outbound send routing、そして実際の stdio MCP bridge 越しの Claude-style channel +
permission notifications を検証します。notification チェックは raw stdio MCP frame を直接検査するため、
smoke は特定の client SDK がたまたま公開するものだけでなく、bridge が実際に emit する内容を検証します。
`test:docker:agent-bundle-mcp-tools` は決定的で、live model key は不要です。repo Docker image をビルドし、
コンテナ内で実際の stdio MCP probe server を起動し、その server を embedded OpenClaw bundle
MCP runtime 経由で materialize し、tool を実行してから、`coding` と `messaging` が
`bundle-mcp` tools を保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらを filter することを検証します。
`test:docker:cron-mcp-cleanup` は決定的で、live model
key は不要です。実際の stdio MCP probe server を持つ seed 済み Gateway を起動し、
分離された cron turn と `sessions_spawn` one-shot child turn を実行してから、
各実行後に MCP child process が終了することを検証します。

手動 ACP プレーン言語 thread smoke (CI ではありません):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- この script は regression/debug workflow 用に保持してください。ACP thread routing validation で再び必要になる可能性があるため、削除しないでください。

便利な env vars:

- `OPENCLAW_CONFIG_DIR=...` (デフォルト: `~/.openclaw`) は `/home/node/.openclaw` に mount されます
- `OPENCLAW_WORKSPACE_DIR=...` (デフォルト: `~/.openclaw/workspace`) は `/home/node/.openclaw/workspace` に mount されます
- `OPENCLAW_PROFILE_FILE=...` は mount され、tests の実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時 config/workspace dirs を使い、外部 CLI auth mount なしで、`OPENCLAW_PROFILE_FILE` から source された env vars のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (デフォルト: `~/.cache/openclaw/docker-cli-tools`) は Docker 内の cached CLI installs 用に `/home/node/.npm-global` に mount されます
- `$HOME` 配下の外部 CLI auth dirs/files は `/host-auth...` 配下に読み取り専用で mount され、tests 開始前に `/home/node/...` にコピーされます
  - デフォルト dirs: `.minimax`
  - デフォルト files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれた provider 実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定される必要な dirs/files のみを mount します
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動 override します
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` で実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` でコンテナ内の provider を filter します
- `OPENCLAW_SKIP_DOCKER_BUILD=1` で、rebuild が不要な rerun に既存の `openclaw:local-live` image を再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で、creds が env ではなく profile store から来ることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` で、Open WebUI smoke 用に gateway が公開する model を選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` で、Open WebUI smoke が使用する nonce-check prompt を override します
- `OPENWEBUI_IMAGE=...` で、固定された Open WebUI image tag を override します

## Docs sanity

doc 編集後に docs checks を実行します: `pnpm check:docs`。
in-page heading checks も必要な場合は、full Mintlify anchor validation を実行します: `pnpm docs:check-links:anchors`。

## オフライン regression (CI-safe)

これらは実際の provider を使わない「real pipeline」regressions です:

- Gateway tool calling (mock OpenAI、実際の gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway ウィザード (WS `wizard.start`/`wizard.next`、config を書き込み + auth を強制): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

「agent reliability evals」のように振る舞う CI-safe tests はすでにいくつかあります:

- 実際の gateway + agent loop 経由の mock tool-calling (`src/gateway/gateway.test.ts`)。
- session wiring と config effects を検証する end-to-end ウィザード flows (`src/gateway/gateway.test.ts`)。

skills についてまだ不足しているもの ([Skills](/ja-JP/tools/skills) を参照):

- **Decisioning:** prompt に skills が列挙されているとき、agent は正しい skill を選ぶか (または無関係なものを避けるか)?
- **Compliance:** agent は使用前に `SKILL.md` を読み、必要な steps/args に従うか?
- **Workflow contracts:** tool order、session history carryover、sandbox boundaries を assert する multi-turn scenarios。

今後の evals は、まず決定的であるべきです:

- mock providers を使い、tool calls + order、skill file reads、session wiring を assert する scenario runner。
- skill-focused scenarios の小さな suite (use vs avoid、gating、prompt injection)。
- CI-safe suite が整ってからのみ、optional live evals (opt-in、env-gated)。

## Contract tests (Plugin と channel shape)

Contract tests は、登録されているすべての Plugin と channel がその
interface contract に準拠していることを検証します。検出されたすべての plugins を反復し、
shape と behavior assertions の suite を実行します。デフォルトの `pnpm test` unit lane は、
これらの shared seam と smoke files を意図的にスキップします。shared channel または provider surfaces に触れる場合は、
contract commands を明示的に実行してください。

### Commands

- すべての contracts: `pnpm test:contracts`
- Channel contracts のみ: `pnpm test:contracts:channels`
- Provider contracts のみ: `pnpm test:contracts:plugins`

### Channel contracts

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な Plugin shape (id、name、capabilities)
- **setup** - Setup ウィザード contract
- **session-binding** - Session binding behavior
- **outbound-payload** - Message payload structure
- **inbound** - Inbound message handling
- **actions** - Channel action handlers
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contracts

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - Channel status probes
- **registry** - Plugin registry shape

### Provider contracts

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

- plugin-sdk exports または subpaths を変更した後
- channel または provider Plugin を追加または変更した後
- Plugin registration または discovery を refactor した後

Contract tests は CI で実行され、実際の API keys は不要です。

## regressions の追加 (guidance)

live で見つかった provider/model issue を修正するとき:

- 可能であれば CI-safe regression を追加します (mock/stub provider、または正確な request-shape transformation を capture)
- 本質的に live-only の場合 (rate limits、auth policies) は、live test を狭く保ち、env vars で opt-in にします
- bug を捕捉する最小レイヤーを target することを優先します:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke または CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は registry metadata (`listSecretTargetRegistryEntries()`) から SecretRef class ごとに 1 つの sampled target を derive し、traversal-segment exec ids が reject されることを assert します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、その test の `classifyTargetClass` を更新してください。この test は未分類の target ids で意図的に失敗するため、新しい classes が黙ってスキップされることはありません。

## 関連

- [Testing live](/ja-JP/help/testing-live)
- [Testing updates and plugins](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
