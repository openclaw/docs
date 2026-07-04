---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーバグのリグレッションを追加する
    - Gateway + エージェントの動作のデバッグ
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、各テストがカバーする内容'
title: テスト
x-i18n:
    generated_at: "2026-07-04T03:35:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（ユニット/統合、e2e、ライブ）と小規模な
Docker ランナー群があります。このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何をカバーするか（そして意図的に何をカバーしないか）。
- 一般的なワークフロー（ローカル、プッシュ前、デバッグ）で実行するコマンド。
- ライブテストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダー問題に対するリグレッションを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、ライブトランスポートレーン）** は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) - `pnpm openclaw qa matrix` のリファレンス。
- [成熟度スコアカード](/ja-JP/maturity/scorecard) - リリース QA エビデンスが安定性と LTS 判断を支える方法。
- [QA チャンネル](/ja-JP/channels/qa-channel) - リポジトリに基づくシナリオで使われる合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行について説明します。以下の QA 固有ランナーのセクション（[QA 固有ランナー](#qa-specific-runners)）には、具体的な `qa` 呼び出しを列挙し、上記のリファレンスへ戻る参照を示しています。
</Note>

## クイックスタート

通常は次のとおりです。

- フルゲート（プッシュ前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカルフルスイート実行: `pnpm test:max`
- 直接の Vitest ウォッチループ: `pnpm test:watch`
- 直接ファイル指定は、拡張機能/チャンネルパスにもルーティングされるようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復している場合は、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れた場合や追加の信頼性が必要な場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

## テスト一時ディレクトリ

テスト所有の一時ディレクトリには、`test/helpers/temp-dir.ts` の共有ヘルパーを優先してください。これらは所有権を明示し、同じテストライフサイクル内でクリーンアップを維持します。

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` は意図的に手動クリーンアップメソッドを公開していません。Vitest が各テスト後のクリーンアップを所有します。まだ移行していないテストのために既存の低レベルヘルパーは残っていますが、新規および移行済みのテストでは自動クリーンアップトラッカーを使うべきです。新しい手動の `makeTempDir`、`cleanupTempDirs`、または
`createTempDirTracker` の使用は避け、テスト内で新たに裸の `fs.mkdtemp*` 呼び出しを追加することも避けてください。ただし、生の一時ディレクトリ挙動を明示的に検証するケースは例外です。テストが意図的に裸の一時ディレクトリを必要とする場合は、具体的な理由を含む監査可能な許可コメントを追加してください。

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

移行の可視性のために、`node scripts/report-test-temp-creations.mjs` は追加された差分行における新しい裸の一時ディレクトリ作成と、新しい手動共有ヘルパー使用を報告しますが、既存のクリーンアップスタイルはブロックしません。そのファイルスコープは、別個のテストヘルパーファイル名ヒューリスティックを維持する代わりに、`scripts/changed-lanes.mjs` で使われている同じテストパス分類に意図的に従い、共有ヘルパー実装自体はスキップします。`check:changed` は変更されたテストパスに対してこのレポートを警告専用の CI シグナルとして実行します。検出結果は GitHub の警告アノテーションであり、失敗ではありません。

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）:

- ライブスイート（モデル + Gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つのライブファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイムパフォーマンスレポート: 実際の `openai/gpt-5.5` エージェントターンには `live_openai_candidate=true` を、Kova CPU/ヒープ/トレースアーティファクトには
  `deep_profile=true` を付けて `OpenClaw Performance` をディスパッチします。日次スケジュール実行は、`CLAWGRIT_REPORTS_TOKEN` が設定されている場合に、モックプロバイダー、ディーププロファイル、GPT 5.5 レーンのアーティファクトを
  `openclaw/clawgrit-reports` に公開します。モックプロバイダーレポートには、ソースレベルの Gateway 起動、メモリ、Plugin 負荷、反復 fake-model hello-loop、CLI 起動の数値も含まれます。
- Docker ライブモデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さなファイル読み取り風プローブを実行するようになりました。メタデータが `image` 入力を宣伝しているモデルでは、小さな画像ターンも実行します。プロバイダーの失敗を切り分けるときは、追加プローブを `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で無効化してください。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` はどちらも、`include_live_suites: true` で再利用可能なライブ/E2E ワークフローを呼び出します。これには、プロバイダー別にシャーディングされた個別の Docker ライブモデルマトリックスジョブが含まれます。
  - 集中的な CI 再実行には、`include_live_suites: true` と `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)` をディスパッチします。
  - 新しい高シグナルのプロバイダーシークレットは、`scripts/ci-hydrate-live-auth.sh` に加え、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` とそのスケジュール/リリース呼び出し元に追加してください。
- ネイティブ Codex バインドチャットスモーク: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker ライブレーンを実行し、`/codex bind` で合成 Slack DM をバインドし、`/codex fast` と
    `/codex permissions` を実行してから、プレーン返信と画像添付が ACP ではなくネイティブ Plugin バインディング経由でルーティングされることを検証します。
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness`
  - Plugin 所有の Codex app-server ハーネスを通じて Gateway エージェントターンを実行し、
    `/codex status` と `/codex models` を検証し、デフォルトでは画像、cron MCP、サブエージェント、Guardian プローブを実行します。他の Codex app-server 失敗を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` でサブエージェントプローブを無効化します。サブエージェントに集中したチェックでは、他のプローブを無効化してください:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、これはサブエージェントプローブ後に終了します。
- Codex オンデマンドインストールスモーク: `pnpm test:docker:codex-on-demand`
  - パッケージ化された OpenClaw tarball を Docker にインストールし、OpenAI API キーのオンボーディングを実行し、Codex Plugin と `@openai/codex` 依存関係がオンデマンドで管理対象 npm プロジェクトルートにダウンロードされたことを検証します。
- ライブ Plugin ツール依存関係スモーク: `pnpm test:docker:live-plugin-tool`
  - 実際の `slugify` 依存関係を持つフィクスチャ Plugin をパックし、`npm-pack:` 経由でインストールし、管理対象 npm プロジェクトルート配下の依存関係を検証してから、ライブ OpenAI モデルに Plugin ツールを呼び出して隠された slug を返すよう要求します。
- Crestodian レスキューコマンドスモーク: `pnpm test:live:crestodian-rescue-channel`
  - メッセージチャンネルのレスキューコマンドサーフェスに対するオプトインの二重確認チェックです。`/crestodian status` を実行し、永続的なモデル変更をキューに入れ、`/crestodian yes` と返信し、監査/設定書き込みパスを検証します。
- Crestodian プランナー Docker スモーク: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に偽の Claude CLI を置いた設定なしコンテナーで Crestodian を実行し、ファジープランナーフォールバックが監査済みの型付き設定書き込みへ変換されることを検証します。
- Crestodian 初回実行 Docker スモーク: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw 状態ディレクトリから開始し、最新のオンボード Crestodian エントリーポイントを検証し、セットアップ/モデル/エージェント/Discord Plugin + SecretRef 書き込みを適用し、設定を検証し、監査エントリを検証します。同じ Ring 0 セットアップパスは QA Lab でも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によりカバーされています。
- Moonshot/Kimi コストスモーク: `MOONSHOT_API_KEY` を設定した状態で
  `openclaw models list --provider moonshot --json` を実行し、その後 `moonshot/kimi-k2.6` に対して分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSON が Moonshot/K2.6 を報告し、アシスタントトランスクリプトが正規化された `usage.cost` を保存していることを確認してください。

<Tip>
失敗している 1 ケースだけが必要な場合は、以下で説明する allowlist 環境変数でライブテストを絞り込むことを優先してください。
</Tip>

## QA 固有ランナー

これらのコマンドは、QA-lab の現実性が必要なときにメインのテストスイートの隣で使います。

CI は専用ワークフローで QA Lab を実行します。エージェント型パリティはスタンドアロンの PR ワークフローではなく、
`QA-Lab - All Lanes` とリリース検証の下にネストされています。広範な検証には、`rerun_group=qa-parity` またはリリースチェックの QA グループを指定した `Full Release Validation` を使うべきです。安定版/デフォルトのリリースチェックでは、網羅的なライブ/Docker ソークは `run_release_soak=true` の背後に置かれます。
`full` プロファイルはソークを強制的に有効化します。`QA-Lab - All Lanes` は `main` で毎晩、および手動ディスパッチから、モックパリティレーン、ライブ Matrix レーン、Convex 管理のライブ Telegram レーン、Convex 管理のライブ Discord レーンを並列ジョブとして実行します。スケジュール済み QA とリリースチェックは Matrix に明示的に
`--profile fast` を渡しますが、Matrix CLI と手動ワークフロー入力のデフォルトは `all` のままです。手動ディスパッチでは `all` を `transport`、
`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブへシャーディングできます。`OpenClaw Release
Checks` はリリース承認前にパリティに加えて高速 Matrix と Telegram レーンを実行し、リリーストランスポートチェックには `mock-openai/gpt-5.5` を使うため、決定論的に保たれ、通常のプロバイダー Plugin 起動を回避できます。これらのライブトランスポート Gateway はメモリ検索を無効化します。メモリ挙動は引き続き QA パリティスイートでカバーされます。

フルリリースのライブメディアシャードでは
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使います。これにはすでに
`ffmpeg` と `ffprobe` が含まれています。Docker ライブモデル/バックエンドシャードは、選択されたコミットごとに一度だけビルドされる共有
`ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使い、各シャード内で再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` でそれをプルします。

- `pnpm openclaw qa suite`
  - リポジトリに裏付けられた QA シナリオをホスト上で直接実行します。
  - 選択されたシナリオセットについて、mixed flow、Vitest、Playwright のシナリオ選択を含む、トップレベルの `qa-evidence.json`、`qa-suite-summary.json`、および
    `qa-suite-report.md` アーティファクトを書き込みます。
  - `pnpm openclaw qa run --qa-profile <profile>` によってディスパッチされた場合、選択された分類プロファイルのスコアカードを同じ `qa-evidence.json` に埋め込みます。
    `smoke-ci` はスリムなエビデンスを書き込み、`evidenceMode: "slim"` を設定して、各エントリの `execution` を省略します。`release` は厳選されたリリース準備状況の範囲を対象にします。
    `all` はすべてのアクティブな成熟度カテゴリを選択し、完全なスコアカードアーティファクトが必要な場合に明示的な QA Profile Evidence ワークフローディスパッチで使うことを意図しています。
  - デフォルトでは、分離された gateway ワーカーを使って、選択された複数のシナリオを並列実行します。`qa-channel` のデフォルト並列数は 4 です（選択されたシナリオ数によって上限があります）。ワーカー数を調整するには `--concurrency <count>` を使い、従来の直列レーンには `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使います。
  - provider モード `live-frontier`、`mock-openai`、および `aimock` をサポートします。
    `aimock` は、シナリオを認識する `mock-openai` レーンを置き換えずに、実験的な fixture とプロトコルモックのカバレッジのために、ローカルの AIMock ベース provider サーバーを起動します。
- `pnpm openclaw qa coverage --match <query>`
  - シナリオ ID、タイトル、surface、カバレッジ ID、docs refs、code refs、plugins、provider 要件を検索し、一致する suite target を出力します。
  - 変更対象の挙動またはファイルパスは分かっているが、最小のシナリオが分からない場合、QA Lab 実行の前にこれを使います。これは助言のみです。変更される挙動に基づいて、mock、live、Multipass、Matrix、または transport proof を選択してください。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab を通じて、ライブ OpenAI Kitchen Sink Plugin ガントレットを実行します。外部 Kitchen Sink パッケージをインストールし、plugin SDK surface inventory を検証し、`/healthz` と `/readyz` をプローブし、gateway CPU/RSS エビデンスを記録し、ライブ OpenAI turn を実行し、敵対的診断を確認します。
    `OPENAI_API_KEY` などのライブ OpenAI 認証が必要です。hydrated Testbox セッションでは、`openclaw-testbox-env` ヘルパーが存在する場合、Testbox live-auth プロファイルを自動的に source します。
- `pnpm test:gateway:cpu-scenarios`
  - gateway 起動ベンチに加えて、小さな mock QA Lab シナリオパック（`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`）を実行し、結合された CPU 観測サマリーを `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは継続的な高 CPU 観測のみをフラグします（`--cpu-core-warn` と `--hot-wall-warn-ms`）。そのため、短い起動バーストは、数分続く gateway 固着リグレッションのようには見えず、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使います。チェックアウトに新しいランタイム出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 使い捨ての Multipass Linux VM 内で同じ QA suite を実行します。
  - ホスト上の `qa suite` と同じシナリオ選択挙動を維持します。
  - `qa suite` と同じ provider/model 選択フラグを再利用します。
  - ライブ実行では、ゲストに実用的なサポート対象 QA 認証入力を転送します。env ベースの provider キー、QA live provider config パス、および存在する場合の `CODEX_HOME` です。
  - 出力ディレクトリは repo root 配下に維持する必要があります。これにより、ゲストはマウントされたワークスペースを通じて書き戻せます。
  - 通常の QA レポートとサマリーに加え、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業向けに、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルにインストールし、非対話型の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、パッケージ化された Plugin ランタイムが起動時の依存関係修復なしで読み込まれることを検証し、doctor を実行し、mock OpenAI endpoint に対してローカル agent turn を 1 回実行します。
  - Discord で同じパッケージ化インストールレーンを実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使います。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキスト transcript 向けに、決定的なビルド済みアプリ Docker smoke を実行します。hidden OpenClaw runtime context が、表示される user turn に漏れる代わりに、非表示の custom message として永続化されることを検証します。その後、影響を受ける壊れた session JSONL を seed し、`openclaw doctor --fix` がそれをバックアップ付きで active branch に書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - OpenClaw パッケージ候補を Docker にインストールし、インストール済みパッケージのオンボーディングを実行し、インストール済み CLI を通じて Telegram を設定し、その後、そのインストール済みパッケージを SUT Gateway としてライブ Telegram QA レーンを再利用します。
  - wrapper はチェックアウトから `qa-lab` harness source のみをマウントします。インストール済みパッケージが `dist`、`openclaw/plugin-sdk`、および bundled Plugin ランタイムを所有するため、このレーンは現在のチェックアウトの plugins をテスト対象パッケージに混在させません。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。registry からインストールする代わりに、解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - デフォルトでは `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` により、反復 RTT タイミングを `qa-evidence.json` に出力します。RTT 実行を調整するには、
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` は、サンプリングする Telegram QA check ID のカンマ区切りリストを受け付けます。未設定の場合、デフォルトの RTT 対応 check は `telegram-mentioned-message-reply` です。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex credential source を使います。CI/リリース自動化では、
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて、
    `OPENCLAW_QA_CONVEX_SITE_URL` と role secret を設定します。
    `OPENCLAW_QA_CONVEX_SITE_URL` と Convex role secret が CI に存在する場合、Docker wrapper は Convex を自動的に選択します。
  - wrapper は、Docker build/install 作業の前に、ホスト上で Telegram または Convex credential env を検証します。pre-credential setup を意図的にデバッグする場合にのみ、`OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンでのみ共有の `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。Convex credentials が選択され、role が設定されていない場合、wrapper は CI では `ci` を使い、CI 外では `maintainer` を使います。
  - GitHub Actions は、このレーンを手動 maintainer ワークフロー `NPM Telegram Beta E2E` として公開します。merge 時には実行されません。このワークフローは `qa-live-shared` environment と Convex CI credential lease を使います。
- GitHub Actions は、1 つの候補パッケージに対するサイド実行の product proof として `Package Acceptance` も公開します。trusted ref、公開済み npm spec、HTTPS tarball URL と SHA-256、または別の実行からの tarball artifact を受け付け、正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、その後、smoke、package、product、full、または custom lane profile で既存の Docker E2E scheduler を実行します。同じ `package-under-test` artifact に対して Telegram QA workflow を実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
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

- Enterprise/private tarball mirror は、明示的な trusted-source policy を使います:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` は trusted workflow ref から `.github/package-trusted-sources.json` を読み取り、URL credentials や workflow-input private-network bypass を受け付けません。指定された policy が bearer auth を宣言している場合は、固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` secret を設定します。

- Artifact proof は、別の Actions run から tarball artifact をダウンロードします:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw build を Docker 内で pack および install し、OpenAI が設定された Gateway を起動してから、config edits を通じて bundled channel/plugins を有効化します。
  - setup discovery が未設定の downloadable plugins を存在しないままにすること、最初の configured doctor repair が欠落している各 downloadable Plugin を明示的にインストールすること、2 回目の restart で隠れた dependency repair が実行されないことを検証します。
  - 既知の古い npm baseline もインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補の post-update doctor が harness-side postinstall repair なしで legacy Plugin dependency debris をクリーンにすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels guest 全体で、native packaged-install update smoke を実行します。選択された各 platform は、まず要求された baseline package をインストールし、その後同じ guest 内でインストール済みの `openclaw update` コマンドを実行し、インストール済み version、update status、gateway readiness、およびローカル agent turn を 1 回検証します。
  - 1 つの guest で反復作業する場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使います。summary artifact path と per-lane status には `--json` を使います。
  - OpenAI レーンは、デフォルトで live agent-turn proof に `openai/gpt-5.5` を使います。別の OpenAI model を意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels transport stall が残りのテスト時間を消費しないように、長いローカル実行を host timeout でラップします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - script は nested lane log を `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。outer wrapper がハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認してください。
  - Windows update は、cold guest では post-update doctor と package update 作業に 10 分から 15 分かかることがあります。nested npm debug log が進んでいる場合、それは正常です。
  - この aggregate wrapper を、個別の Parallels macOS、Windows、または Linux smoke lane と並列に実行しないでください。これらは VM state を共有しており、snapshot restore、package serving、または guest gateway state で衝突する可能性があります。
  - post-update proof は通常の bundled Plugin surface を実行します。speech、image generation、media understanding などの capability facade は、agent turn 自体が単純な text response だけを確認する場合でも、bundled runtime API を通じて読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接プロトコルのスモークテスト用に、ローカル AIMock プロバイダーサーバーだけを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker-backed Tuwunel homeserver に対して Matrix ライブ QA レーンを実行します。ソースチェックアウト専用です - パッケージ化されたインストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、環境変数、アーティファクトレイアウト: [Matrix QA](/ja-JP/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - 環境変数のドライバーと SUT ボットトークンを使用して、実際の非公開グループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使用するか、`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してプールされたリースを明示的に使用します。
  - デフォルトは canary、mention gating、コマンド指定、`/status`、ボット間のメンション付き返信、コアのネイティブコマンド返信をカバーします。`mock-openai` のデフォルトは、決定的な返信チェーンと Telegram final-message ストリーミング回帰もカバーします。`session_status` などの任意プローブには `--list-scenarios` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じ非公開グループ内に 2 つの異なるボットが必要で、SUT ボットは Telegram ユーザー名を公開している必要があります。
  - 安定したボット間観測のため、両方のボットで `@BotFather` の Bot-to-Bot Communication Mode を有効にし、ドライバーボットがグループ内のボットトラフィックを観測できるようにします。
  - Telegram QA レポート、サマリー、`qa-evidence.json` を `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、ドライバーの送信リクエストから観測された SUT 返信までの RTT が含まれます。

`Mantis Telegram Live` は、このレーンをラップする PR エビデンス用ラッパーです。候補 ref を Convex でリースされた Telegram 認証情報で実行し、墨消し済み QA レポート/エビデンスバンドルを Crabbox デスクトップブラウザーでレンダリングし、MP4 エビデンスを記録し、モーションをトリムした GIF を生成し、アーティファクトバンドルをアップロードし、`pr_number` が設定されている場合は Mantis GitHub App 経由でインライン PR エビデンスを投稿します。メンテナーは Actions UI の `Mantis Scenario` (`scenario_id:
telegram-live`) から、または pull request コメントから直接開始できます。

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` は、PR の視覚的 proof のためのエージェント型ネイティブ Telegram Desktop before/after ラッパーです。Actions UI で自由形式の `instructions` を指定して、`Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) から、または PR コメントから開始します。

```text
@openclaw-mantis telegram desktop proof
```

Mantis エージェントは PR を読み、どの Telegram で見える挙動が変更を証明するかを判断し、baseline ref と candidate ref で実ユーザー Crabbox Telegram Desktop proof レーンを実行し、ネイティブ GIF が有用になるまで反復し、ペアの `motionPreview` マニフェストを書き込み、`pr_number` が設定されている場合は Mantis GitHub App 経由で同じ 2 列 GIF テーブルを投稿します。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux デスクトップをリースまたは再利用し、ネイティブ Telegram Desktop をインストールし、リースされた Telegram SUT ボットトークンで OpenClaw を設定し、gateway を起動し、表示されている VNC デスクトップからスクリーンショット/MP4 エビデンスを記録します。
  - ワークフローが Convex broker シークレットだけを必要とするように、デフォルトは `--credential-source convex` です。`pnpm openclaw qa telegram` と同じ `OPENCLAW_QA_TELEGRAM_*` 変数で `--credential-source env` を使用します。
  - Telegram Desktop には引き続きユーザーログイン/プロファイルが必要です。ボットトークンは OpenClaw のみを設定します。base64 `.tgz` プロファイルアーカイブには `--telegram-profile-archive-env <name>` を使用するか、`--keep-lease` を使用して一度 VNC 経由で手動ログインします。
  - 出力ディレクトリ配下に `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png`、`telegram-desktop-builder.mp4` を書き込みます。

ライブ transport レーンは標準契約を 1 つ共有するため、新しい transport が乖離しません。レーンごとのカバレッジマトリクスは [QA 概要 → ライブ transport カバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、そのマトリクスの一部ではありません。

### Convex 経由の共有 Telegram 認証情報 (v1)

ライブ transport QA で `--credential-source convex` (または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) が有効な場合、QA lab は Convex-backed pool から排他的リースを取得し、レーンの実行中にそのリースへ Heartbeat を送り、シャットダウン時にリースを解放します。セクション名は Discord、Slack、WhatsApp サポートより前からあるものです。リース契約は kind 間で共有されます。

参考 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL` (例: `https://your-deployment.convex.site`)
- 選択したロール用のシークレット 1 つ:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` は `maintainer` 用
  - `OPENCLAW_QA_CONVEX_SECRET_CI` は `ci` 用
- 認証情報ロール選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数のデフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI では `ci`、それ以外では `maintainer` がデフォルト)

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (デフォルト `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (デフォルト `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (デフォルト `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (デフォルト `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (デフォルト `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (任意のトレース ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発のために loopback `http://` Convex URL を許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用するべきです。

メンテナー管理コマンド (pool add/remove/list) には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を出力せずに Convex site URL、broker シークレット、endpoint prefix、HTTP timeout、admin/list 到達性を確認します。スクリプトと CI ユーティリティで機械可読出力が必要な場合は `--json` を使用します。

デフォルトエンドポイント契約 (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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

Telegram kind の payload 形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正な payload を拒否します。

Telegram real-user kind の payload 形状:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId`、`telegramApiId` は数値文字列である必要があります。
- `tdlibArchiveSha256` と `desktopTdataArchiveSha256` は SHA-256 hex 文字列である必要があります。
- `kind: "telegram-user"` は Mantis Telegram Desktop proof ワークフロー用に予約されています。汎用 QA Lab レーンはこれを取得してはいけません。

broker が検証するマルチチャンネル payload:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack レーンも pool からリースできますが、Slack payload 検証は現在 broker ではなく Slack QA runner にあります。Slack 行には `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用します。

### QA へのチャンネル追加

新しいチャンネルアダプターのアーキテクチャとシナリオヘルパー名は [QA 概要 → チャンネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低要件は、共有 `qa-lab` host seam 上に transport runner を実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成することです。

## テストスイート (どこで何が実行されるか)

スイートは「リアリズムが増す」(そして flakiness/コストも増す) ものと考えてください。

### ユニット / 統合 (デフォルト)

- コマンド: `pnpm test`
- 設定: ターゲット指定なしの実行は `vitest.full-*.config.ts` shard セットを使用し、並列スケジューリングのためにマルチプロジェクト shard をプロジェクト別 config に展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下のコア/ユニットインベントリ。UI ユニットテストは専用の `unit-ui` shard で実行されます
- スコープ:
  - 純粋なユニットテスト
  - インプロセス統合テスト (gateway auth、routing、tooling、parsing、config)
  - 既知のバグに対する決定的な回帰
- 期待事項:
  - CI で実行されます
  - 実際のキーは不要です
  - 高速かつ安定しているべきです
  - Resolver と public-surface loader テストは、実際の bundled plugin ソース API ではなく、生成された小さな plugin fixture で広範な `api.js` と `runtime-api.js` の fallback 挙動を証明する必要があります。実際の plugin API ロードは plugin 所有の契約/統合スイートに属します。

ネイティブ依存関係ポリシー:

- デフォルトのテストインストールでは、任意のネイティブ Discord opus ビルドをスキップします。Discord voice は bundled `libopus-wasm` を使用し、`@discordjs/opus` は `allowBuilds` で無効のままにするため、ローカルテストと Testbox レーンでネイティブ addon をコンパイルしません。
- ネイティブ opus の性能比較は、デフォルトの OpenClaw install/test ループではなく、`libopus-wasm` ベンチマークリポジトリで行ってください。デフォルトの `allowBuilds` で `@discordjs/opus` を `true` に設定しないでください。無関係な install/test ループでネイティブコードがコンパイルされます。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - ターゲットなしの `pnpm test` は、1 つの巨大なネイティブ root-project プロセスではなく、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/extension の処理が無関係なスイートを枯渇させることを避けられます。
    - `pnpm test --watch` は引き続きネイティブ root の `vitest.config.ts` プロジェクトグラフを使います。マルチシャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付き lane に流すため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` は root プロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付き lane に展開します。直接編集されたテスト、兄弟の `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフの依存先が対象です。config/setup/package の編集では、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使わない限り、広範なテスト実行は行いません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートなローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。release metadata のみのバージョンバンプでは、対象を絞った version/config/root-dependency チェックを実行し、トップレベルの version フィールド以外の package 変更を拒否する guard が付きます。
    - Live Docker ACP ハーネスの編集では、live Docker auth スクリプトの shell 構文と、live Docker scheduler の dry-run という重点チェックを実行します。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定されている場合のみ含まれます。dependency、export、version、その他の package surface の編集では、引き続きより広い guard を使います。
    - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および同様の純粋な utility 領域からの import-light な unit tests は `unit-fast` lane に流れ、この lane では `test/setup-openclaw-runtime.ts` をスキップします。stateful/runtime-heavy なファイルは既存の lane に残ります。
    - 選択された `plugin-sdk` と `commands` の helper source files も、changed-mode の実行をこれらの軽量 lane 内の明示的な兄弟テストへマップするため、helper の編集でそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルの core helpers、トップレベルの `reply.*` integration tests、`src/auto-reply/reply/**` サブツリー向けの専用 bucket があります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードへ分割し、1 つの import-heavy な bucket が Node の tail 全体を抱え込まないようにしています。
    - 通常の PR/main CI では、extension batch sweep と release-only の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、release candidates 上のこれら plugin/extension-heavy なスイート向けに、別の `Plugin Prerelease` 子 workflow を dispatch します。

  </Accordion>

  <Accordion title="埋め込み runner のカバレッジ">

    - message-tool discovery inputs または compaction runtime
      context を変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋な routing と normalization
      boundary には、焦点を絞った helper regression を追加してください。
    - 埋め込み runner の integration suites を健全に保ってください:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`、および
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、scoped ids と compaction の挙動が実際の
      `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。helper のみのテストは、
      これらの integration path の十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool と isolation のデフォルト">

    - ベースの Vitest config はデフォルトで `threads` を使います。
    - 共有 Vitest config は `isolate: false` を固定し、
      root projects、e2e、live configs 全体で
      非 isolation runner を使います。
    - root UI lane は `jsdom` setup と optimizer を保持しますが、
      共有の非 isolation runner 上でも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest config から同じ `threads` + `isolate: false`
      のデフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 compile churn を減らすため、
      デフォルトで Vitest child Node
      processes に `--no-maglev` を追加します。
      stock V8 の挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
    - `scripts/run-vitest.mjs` は、明示的な non-watch Vitest 実行で
      stdout または stderr の出力が 5 分間ない場合に終了します。意図的に無音の調査で
      watchdog を無効にするには
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル iteration">

    - `pnpm changed:lanes` は、diff がどの architectural lane をトリガーするかを表示します。
    - pre-commit hook は formatting-only です。formatted files を再 stage し、
      lint、typecheck、tests は実行しません。
    - スマートなローカルチェックゲートが必要な場合は、handoff または push の前に
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` は、デフォルトで低コストなスコープ付き lane を通ります。agent が
      harness、config、package、または contract の編集に本当により広い
      Vitest カバレッジが必要だと判断した場合のみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使ってください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じ routing
      挙動を維持し、worker cap だけを高くします。
    - ローカル worker の auto-scaling は意図的に保守的で、host load average がすでに高い場合は
      後退するため、複数の同時
      Vitest 実行による影響はデフォルトで小さくなります。
    - ベースの Vitest config は、test wiring が変更されたときにも changed-mode reruns が正しく保たれるよう、
      projects/config files を
      `forceRerunTriggers` としてマークします。
    - config は、対応ホスト上で `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。
      直接 profiling 用に明示的な cache location を 1 つ使いたい場合は、
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` は、Vitest import-duration reporting と
      import-breakdown output を有効にします。
    - `pnpm test:perf:imports:changed` は、同じ profiling view を
      `origin/main` 以降に変更されたファイルにスコープします。
    - shard timing data は `.artifacts/vitest-shard-timings.json` に書き込まれます。
      whole-config runs は config path を key として使います。include-pattern CI
      shards は shard name を追加するため、filtered shards を個別に追跡できます。
    - 1 つの hot test が依然として startup imports にほとんどの時間を費やしている場合は、
      heavy dependencies を狭いローカルの `*.runtime.ts` seam の背後に置き、
      runtime helpers を `vi.mock(...)` に通すためだけに deep-import する代わりに、
      その seam を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、その committed
      diff について routed
      `test:changed` を native root-project path と比較し、wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、現在の
      dirty tree を、changed file list を
      `scripts/test-projects.mjs` と root Vitest config に流して benchmark します。
    - `pnpm test:perf:profile:main` は、Vitest/Vite startup と transform overhead の
      main-thread CPU profile を書き込みます。
    - `pnpm test:perf:profile:runner` は、file parallelism を無効にした
      unit suite の runner CPU+heap profiles を書き込みます。

  </Accordion>
</AccordionGroup>

### Stability（gateway）

- Command: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`、1 worker に強制
- Scope:
  - diagnostics をデフォルトで有効にした実際の loopback Gateway を起動します
  - synthetic gateway message、memory、large-payload churn を diagnostic event path に通します
  - Gateway WS RPC 経由で `diagnostics.stability` を query します
  - diagnostic stability bundle persistence helpers をカバーします
  - recorder が bounded のままであること、synthetic RSS samples が pressure budget 未満に留まること、per-session queue depths がゼロまで drain することを assert します
- Expectations:
  - CI-safe かつ keyless
  - stability-regression follow-up 向けの狭い lane であり、完全な Gateway suite の代替ではありません

### E2E（repo aggregate）

- Command: `pnpm test:e2e`
- Scope:
  - gateway smoke E2E lane を実行します
  - mocked Control UI browser E2E lane を実行します
- Expectations:
  - CI-safe かつ keyless
  - Playwright Chromium がインストールされている必要があります

### E2E（gateway smoke）

- Command: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- Files: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E tests
- Runtime defaults:
  - リポジトリの他の部分と同様に、Vitest `threads` を `isolate: false` で使います。
  - adaptive workers を使います（CI: 最大 2、local: デフォルトで 1）。
  - console I/O overhead を減らすため、デフォルトでは silent mode で実行します。
- Useful overrides:
  - worker count を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - verbose console output を再度有効にするには `OPENCLAW_E2E_VERBOSE=1`。
- Scope:
  - multi-instance gateway の end-to-end 挙動
  - WebSocket/HTTP surfaces、node pairing、より重い networking
- Expectations:
  - CI で実行されます（pipeline で有効な場合）
  - 実際の keys は不要です
  - unit tests より moving parts が多いです（遅くなる場合があります）

### E2E（Control UI mocked browser）

- Command: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Files: `ui/src/**/*.e2e.test.ts`
- Scope:
  - Vite Control UI を起動します
  - Playwright 経由で実際の Chromium page を操作します
  - Gateway WebSocket を決定論的な in-browser mocks に置き換えます
- Expectations:
  - `pnpm test:e2e` の一部として CI で実行されます
  - 実際の Gateway、agents、provider keys は不要です
  - browser dependency が存在している必要があります（`pnpm --dir ui exec playwright install chromium`）

### E2E: OpenShell backend smoke

- Command: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - active な local OpenShell gateway を再利用します
  - temporary local Dockerfile から sandbox を作成します
  - 実際の `sandbox ssh-config` + SSH exec 経由で OpenClaw の OpenShell backend を exercise します
  - sandbox fs bridge を通じて remote-canonical filesystem behavior を検証します
- Expectations:
  - opt-in のみ。デフォルトの `pnpm test:e2e` 実行には含まれません
  - local `openshell` CLI と、動作する Docker daemon が必要です
  - active な local OpenShell gateway とその config source が必要です
  - isolated `HOME` / `XDG_CONFIG_HOME` を使い、その後 test sandbox を破棄します
- Useful overrides:
  - broader e2e suite を手動で実行するときに test を有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - non-default CLI binary または wrapper script を指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - registered gateway config を isolated test に公開するには `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - host policy fixture が使う Docker gateway IP を override するには `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### Live（real providers + real models）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル済み Plugin ライブテスト
- デフォルト: `pnpm test:live` により**有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で _today_ 本当に動作するか？」
  - プロバイダーのフォーマット変更、ツール呼び出しの癖、認証の問題、レート制限の挙動を検出する
- 期待値:
  - 設計上、CI で安定しない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - 費用がかかる / レート制限を消費する
  - 「すべて」を実行するのではなく、絞り込んだサブセットの実行を推奨
- ライブ実行では、すでにエクスポート済みの API キーとステージ済みの認証プロファイルを使用する。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定/認証素材を一時テストホームにコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更することはない。
- ライブテストで意図的に実際のホームディレクトリを使う必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定する。
- `pnpm test:live` はデフォルトで静かなモードになる。`[live] ...` の進捗出力は保持し、Gateway のブートストラップログ/Bonjour の雑音はミュートする。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定する。
- API キーのローテーション（プロバイダー固有）: カンマ/セミコロン形式の `*_API_KEYS` または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、`OPENCLAW_LIVE_*_KEY` によるライブごとの上書きを設定する。テストはレート制限レスポンスで再試行する。
- 進捗/Heartbeat 出力:
  - ライブスイートは stderr に進捗行を出力するようになったため、Vitest のコンソールキャプチャが静かな場合でも、長いプロバイダー呼び出しが動作中であることが見える。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効化し、ライブ実行中にプロバイダー/Gateway の進捗行が即時にストリームされるようにする。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整する。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整する。

## どのスイートを実行すべきか？

この判断表を使用する:

- ロジック/テストを編集する場合: `pnpm test` を実行する（多くを変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れる場合: `pnpm test:e2e` を追加する
- 「自分のボットが落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグする場合: 絞り込んだ `pnpm test:live` を実行する

## ライブ（ネットワークに触れる）テスト

ライブモデルマトリクス、CLI バックエンド smoke、ACP smoke、Codex app-server
ハーネス、およびすべてのメディアプロバイダーのライブテスト（Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス）- さらにライブ実行の認証情報処理については -
[ライブスイートのテスト](/ja-JP/help/testing-live)を参照。専用の更新と
Plugin 検証チェックリストについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つの区分に分かれる:

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で、それぞれ一致するプロファイルキーのライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）だけを実行し、ローカル設定ディレクトリ、ワークスペース、任意のプロファイル env ファイルをマウントする。一致するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles`。
- Docker ライブランナーは、必要に応じて独自の実用的な上限を維持する:
  `test:docker:live-models` は、キュレーション済みのサポート対象でシグナルの高いセットをデフォルトとし、
  `test:docker:live-gateway` は `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` をデフォルトとする。明示的に上限を小さくしたり、より大きなスキャンを行いたい場合は、`OPENCLAW_LIVE_MAX_MODELS`
  または Gateway の env var を設定する。
- `test:docker:all` は `test:docker:live-build` でライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックしてから、2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用する。bare イメージは install/update/plugin-dependency レーン用の Node/Git ランナーのみであり、これらのレーンは事前ビルド済み tarball をマウントする。functional イメージは、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールする。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択された計画を実行する。集約は重み付きローカルスケジューラーを使用する。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限は重いライブ、npm-install、複数サービスのレーンがすべて同時に開始されるのを防ぐ。単一のレーンが有効な上限より重い場合でも、プールが空であればスケジューラーはそれを開始でき、その後、容量が再び利用可能になるまで単独で実行し続ける。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`。Docker ホストに余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整する。ランナーはデフォルトで Docker preflight を実行し、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、以降の実行でそれらのタイミングを使って長いレーンを先に開始する。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、パッケージ/イメージの必要性、認証情報に関する CI 計画を出力するには `node scripts/test-docker-all.mjs --plan-json` を使用する。
- `Package Acceptance` は、「このインストール可能な tarball はプロダクトとして動作するか？」の GitHub ネイティブなパッケージゲートである。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードし、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行する。プロファイルは網羅範囲の順に `smoke`、`package`、`product`、`full`。パッケージ/更新/Plugin の契約、公開済みアップグレード生存マトリクス、リリースデフォルト、失敗トリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照。
- ビルドおよびリリースチェックは、tsdown 後に `scripts/check-cli-bootstrap-imports.mjs` を実行する。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的ビルドグラフをたどり、コマンドディスパッチ前の起動時に Commander、prompt UI、undici、logging などのパッケージ依存関係をインポートしている場合に失敗する。また、バンドル済み Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否する。パッケージ化された CLI smoke は、ルートヘルプ、onboard ヘルプ、doctor ヘルプ、status、config schema、model-list コマンドもカバーする。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）で上限が設定されている。その期限までは、ハーネスは出荷済みパッケージのメタデータギャップのみを許容する。省略された非公開 QA inventory エントリ、欠落した `gateway install --wrapper`、tarball 由来の git fixture 内の欠落した patch ファイル、欠落した永続化済み `update.channel`、レガシー Plugin install-record の場所、欠落した marketplace install-record 永続化、`plugins update` 中の設定メタデータ移行。`2026.4.25` より後のパッケージでは、これらのパスは厳密な失敗となる。
- コンテナ smoke ランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1 つ以上の実コンテナを起動し、より高レベルの統合パスを検証する。
- packed OpenClaw tarball を `scripts/lib/openclaw-e2e-instance.sh` 経由でインストールする Docker/Bash E2E レーンは、`npm install` を `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（デフォルト `600s`。デバッグ用にラッパーを無効化するには `0` を設定）で上限設定する。

ライブモデル Docker ランナーは、必要な CLI 認証ホームのみ（または実行が絞り込まれていない場合はサポート対象のすべて）も bind-mount し、その後、実行前にそれらをコンテナホームへコピーするため、外部 CLI OAuth はホストの認証ストアを変更せずにトークンを更新できる:

- 直接モデル: `pnpm test:docker:live-models`（script: `scripts/test-live-models-docker.sh`）
- ACP bind smoke: `pnpm test:docker:live-acp-bind`（script: `scripts/test-live-acp-bind-docker.sh`。デフォルトで Claude、Codex、Gemini をカバーし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` による厳密な Droid/OpenCode カバレッジを含む）
- CLI バックエンド smoke: `pnpm test:docker:live-cli-backend`（script: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server ハーネス smoke: `pnpm test:docker:live-codex-harness`（script: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（script: `scripts/test-live-gateway-models-docker.sh`）
- Observability smoke: `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke`、および `pnpm qa:observability:smoke` は非公開 QA ソースチェックアウトレーンである。npm tarball は QA Lab を省略するため、意図的にパッケージ Docker リリースレーンには含まれていない。
- Open WebUI ライブ smoke: `pnpm test:docker:openwebui`（script: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なスキャフォールディング）: `pnpm test:docker:onboard`（script: `scripts/e2e/onboard-docker.sh`）
- Npm tarball オンボーディング/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` は、packed OpenClaw tarball を Docker 内にグローバルインストールし、env-ref オンボーディング経由の OpenAI とデフォルトの Telegram を設定し、doctor を実行し、モックされた OpenAI agent turn を 1 回実行する。事前ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使用し、ホストの再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を使用し、channel を切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使用する。

- リリースユーザージャーニースモーク: `pnpm test:docker:release-user-journey` は、パック済みの OpenClaw tarball をクリーンな Docker ホームにグローバルインストールし、オンボーディングを実行し、モックされた OpenAI プロバイダーを構成し、エージェントターンを実行し、外部 Plugin をインストール/アンインストールし、ローカルフィクスチャに対して ClickClack を構成し、送信/受信メッセージングを検証し、Gateway を再起動し、doctor を実行します。
- リリース型付きオンボーディングスモーク: `pnpm test:docker:release-typed-onboarding` は、パック済み tarball をインストールし、実際の TTY で `openclaw onboard` を操作し、OpenAI を env-ref プロバイダーとして構成し、生キーが永続化されないことを検証し、モックされたエージェントターンを実行します。
- リリースメディア/メモリスモーク: `pnpm test:docker:release-media-memory` は、パック済み tarball をインストールし、PNG 添付からの画像理解、OpenAI 互換の画像生成出力、メモリ検索の想起、Gateway 再起動後も想起が維持されることを検証します。
- リリースアップグレードユーザージャーニースモーク: `pnpm test:docker:release-upgrade-user-journey` は、デフォルトで候補 tarball より古い最新の公開済みベースラインをインストールし、公開済みパッケージ上でプロバイダー/Plugin/ClickClack 状態を構成し、候補 tarball にアップグレードしてから、中核のエージェント/Plugin/チャンネルジャーニーを再実行します。古い公開済みベースラインが存在しない場合は、候補バージョンを再利用します。`OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` でベースラインを上書きします。
- リリース Plugin マーケットプレイススモーク: `pnpm test:docker:release-plugin-marketplace` は、ローカルフィクスチャマーケットプレイスからインストールし、インストール済み Plugin を更新し、アンインストールし、インストールメタデータが削除された状態で Plugin CLI が消えることを検証します。
- Skill インストールスモーク: `pnpm test:docker:skill-install` は、パック済み OpenClaw tarball を Docker にグローバルインストールし、設定でアップロード済みアーカイブのインストールを無効化し、検索から現在のライブ ClawHub Skill スラッグを解決し、`openclaw skills install` でインストールし、インストール済み Skill と `.clawhub` の origin/lock メタデータを検証します。
- 更新チャンネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パック済み OpenClaw tarball を Docker にグローバルインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャンネルと Plugin の更新後動作を検証してから、パッケージ `stable` に戻し、更新状態を確認します。
- アップグレードサバイバースモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャンネル設定、Plugin 許可リスト、古い Plugin 依存関係状態、既存のワークスペース/セッションファイルを含む、汚れた旧ユーザーフィクスチャの上にパック済み OpenClaw tarball をインストールします。ライブプロバイダーまたはチャンネルキーなしで、パッケージ更新と非対話型 doctor を実行し、その後 loopback Gateway を起動して、設定/状態の保持と起動/状態予算を確認します。
- 公開済みアップグレードサバイバースモーク: `pnpm test:docker:published-upgrade-survivor` は、デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、焼き込み済みコマンドレシピでそのベースラインを構成し、結果の設定を検証し、その公開済みインストールを候補 tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、構成済み intent、状態保持、起動、`/healthz`、`/readyz`、RPC 状態予算を確認します。1 つのベースラインは `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きし、集約スケジューラーには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` を使って `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような正確なローカルベースラインを展開させ、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を使って `reported-issues` のような issue 形式のフィクスチャを展開します。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれます。Package Acceptance は、それらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` などのメタベースライントークンを解決し、Full Release Validation はリリースソークパッケージゲートを `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストの transcript 永続化と、影響を受けた重複プロンプト書き換え分岐の doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在のツリーをパックし、隔離されたホームで `bun install -g` を使ってインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み画像プロバイダーを返すことを検証します。事前ビルド済み tarball は `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用し、ホストビルドは `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` でスキップし、ビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使います。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm コンテナ間で 1 つの npm キャッシュを共有します。更新スモークは、候補 tarball にアップグレードする前の安定版ベースラインとして、デフォルトで npm `latest` を使います。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きします。非 root インストーラーチェックは、root 所有のキャッシュエントリがユーザーローカルのインストール動作を覆い隠さないように、隔離された npm キャッシュを維持します。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は、`OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` で重複する direct-npm グローバル更新をスキップします。直接の `npm install -g` カバレッジが必要な場合は、その env なしでスクリプトをローカル実行します。
- エージェント共有ワークスペース削除 CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace`（スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`）は、デフォルトでルート Dockerfile イメージをビルドし、隔離されたコンテナホームに 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行し、有効な JSON とワークスペース保持動作を検証します。install-smoke イメージを再利用するには、`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使います。
- Gateway ネットワーキング（2 コンテナ、WS 認証 + ヘルス）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- ブラウザー CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot`（スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`）は、ソース E2E イメージと Chromium レイヤーをビルドし、生 CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP ロールスナップショットがリンク URL、カーソル昇格されたクリック可能要素、iframe ref、フレームメタデータをカバーすることを検証します。
- OpenAI Responses web_search 最小推論回帰: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、モックされた OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証してから、プロバイダースキーマの reject を強制し、生の詳細が Gateway ログに現れることを確認します。
- MCP チャンネルブリッジ（シード済み Gateway + stdio ブリッジ + 生 Claude 通知フレームスモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw バンドル MCP ツール（実際の stdio MCP サーバー + 埋め込み OpenClaw プロファイル allow/deny スモーク）: `pnpm test:docker:agent-bundle-mcp-tools`（スクリプト: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- Cron/サブエージェント MCP クリーンアップ（実際の Gateway + 隔離された Cron とワンショットサブエージェント実行後の stdio MCP 子プロセスの終了処理）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（ローカルパス、`file:`、hoist された依存関係を持つ npm レジストリ、不正な npm パッケージメタデータ、git moving ref、ClawHub kitchen-sink、マーケットプレイス更新、Claude バンドルの有効化/検査に対するインストール/更新スモーク）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトの kitchen-sink パッケージ/ランタイムペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を使います。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub フィクスチャサーバーを使います。
- Plugin 更新変更なしスモーク: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin ライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、素のコンテナにパック済み OpenClaw tarball をインストールし、npm Plugin をインストールし、有効化/無効化を切り替え、ローカル npm レジストリ経由でアップグレードおよびダウングレードし、インストール済みコードを削除してから、各ライフサイクルフェーズの RSS/CPU メトリクスをログに記録しつつ、古い状態が残っていてもアンインストールで削除されることを検証します。
- 設定再読み込みメタデータスモーク: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- Plugins: `pnpm test:docker:plugins` は、ローカルパス、`file:`、hoist された依存関係を持つ npm レジストリ、git moving ref、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドルの有効化/検査に対するインストール/更新スモークをカバーします。`pnpm test:docker:plugin-update` は、インストール済み Plugin の変更なし更新動作をカバーします。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡付き npm Plugin のインストール、有効化、無効化、アップグレード、ダウングレード、コード欠落時のアンインストールをカバーします。

共有 functional イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` などのスイート固有イメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにないときに pull します。QR とインストーラーの Docker テストは、共有ビルド済みアプリランタイムではなく、パッケージ/インストール動作を検証するため、独自の Dockerfile を維持します。

ライブモデル用 Docker ランナーは、現在のチェックアウトも読み取り専用で bind mount し、
コンテナ内の一時 workdir にステージします。これにより、ランタイム
イメージをスリムに保ちながら、正確なローカルソース/設定に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build` や
Gradle 出力ディレクトリなど、大きなローカル専用キャッシュやアプリのビルド出力をスキップするため、
Docker ライブ実行がマシン固有の成果物のコピーに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、gateway ライブプローブは
コンテナ内で実際の Telegram/Discord などのチャンネルワーカーを起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンで
Gateway ライブカバレッジを絞り込む、または除外する必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw gateway コンテナを起動し、その gateway に対して固定された Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証したうえで、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
ライブモデル完了を待たずに、Open WebUI サインインとモデル検出後に停止するべき
リリースパス CI チェックでは、`OPENWEBUI_SMOKE_MODE=models` を設定してください。
初回実行は、Docker が Open WebUI イメージを pull する必要があり、
Open WebUI 自身のコールドスタートセットアップが完了する必要もあるため、目に見えて遅くなる場合があります。
このレーンには使用可能なライブモデルキーが必要です。プロセス
環境、ステージ済み auth プロファイル、または明示的な `OPENCLAW_PROFILE_FILE` 経由で指定してください。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、iMessage アカウントは必要ありません。シード済み Gateway
コンテナを起動し、`openclaw mcp serve` を spawn する 2 つ目のコンテナを開始してから、
ルーティングされた会話の検出、transcript 読み取り、添付メタデータ、
ライブイベントキューの動作、アウトバウンド送信ルーティング、そして実際の stdio MCP bridge 上の Claude スタイルのチャンネル +
権限通知を検証します。通知チェックは
raw stdio MCP フレームを直接検査するため、このスモークは
特定のクライアント SDK がたまたま表面化する内容だけでなく、bridge が実際に emit する内容を検証します。
`test:docker:agent-bundle-mcp-tools` は決定的であり、ライブ
モデルキーは必要ありません。repo Docker イメージをビルドし、コンテナ内で実際の stdio MCP プローブサーバーを起動し、
埋め込み OpenClaw bundle MCP ランタイム経由でそのサーバーを materialize し、
ツールを実行してから、`coding` と `messaging` が
`bundle-mcp` ツールを保持する一方で、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルターすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデル
キーは必要ありません。実際の stdio MCP プローブサーバーを備えたシード済み Gateway を起動し、
隔離された cron turn と `sessions_spawn` one-shot child turn を実行してから、
各実行後に MCP child process が終了することを検証します。

手動 ACP プレーン言語スレッドスモーク（CI ではありません）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な env vars:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...` はマウントされ、テスト実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時 config/workspace dirs を使用し、外部 CLI auth マウントなしで、`OPENCLAW_PROFILE_FILE` から source された env vars のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI auth dirs/files は `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` にコピーされます
  - デフォルト dirs: `.minimax`
  - デフォルト files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれた provider 実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推論される必要な dirs/files のみがマウントされます
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きできます
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` は実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` はコンテナ内の providers をフィルターします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドを必要としない再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、creds が env ではなく profile store から来ることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI スモーク用に gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI スモークで使用される nonce-check prompt を上書きします
- `OPENWEBUI_IMAGE=...` は、固定された Open WebUI イメージタグを上書きします

## Docs サニティ

ドキュメント編集後に docs チェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、Mintlify の完全なアンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフラインリグレッション（CI-safe）

これらは実際の providers なしの「実パイプライン」リグレッションです:

- Gateway ツール呼び出し（mock OpenAI、実 gateway + agent loop）: `src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、config 書き込み + auth enforcement）: `src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## Agent 信頼性 evals（skills）

「agent reliability evals」のように振る舞う CI-safe テストはすでにいくつかあります:

- 実 gateway + agent loop 経由の mock tool-calling（`src/gateway/gateway.test.ts`）。
- session wiring と config effects を検証する end-to-end ウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **Decisioning:** skills が prompt に列挙されているとき、agent は正しい skill を選ぶ（または無関係なものを避ける）か？
- **Compliance:** agent は使用前に `SKILL.md` を読み、必須 steps/args に従うか？
- **Workflow contracts:** tool order、session history carryover、sandbox boundaries を assert する multi-turn scenarios。

将来の evals は、まず決定的であるべきです:

- mock providers を使用して tool calls + order、skill file reads、session wiring を assert する scenario runner。
- skill-focused scenarios の小さな suite（use vs avoid、gating、prompt injection）。
- オプションの live evals（opt-in、env-gated）は、CI-safe suite が整ってからのみ。

## Contract tests（Plugin とチャンネル shape）

Contract tests は、登録されたすべての Plugin とチャンネルが
その interface contract に準拠していることを検証します。検出されたすべての plugins を反復し、
shape と behavior assertions の suite を実行します。デフォルトの `pnpm test` unit レーンは意図的に
これらの共有 seam と smoke files をスキップします。共有チャンネルまたは provider surfaces に触れる場合は、
contract commands を明示的に実行してください。

### コマンド

- すべての contracts: `pnpm test:contracts`
- チャンネル contracts のみ: `pnpm test:contracts:channels`
- Provider contracts のみ: `pnpm test:contracts:plugins`

### チャンネル contracts

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な plugin shape（id、name、capabilities）
- **setup** - セットアップウィザード contract
- **session-binding** - session binding behavior
- **outbound-payload** - メッセージ payload structure
- **inbound** - inbound message handling
- **actions** - チャンネル action handlers
- **threading** - thread ID handling
- **directory** - directory/roster API
- **group-policy** - group policy enforcement

### Provider status contracts

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャンネル status probes
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
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdk exports または subpaths を変更した後
- チャンネルまたは provider plugin を追加または変更した後
- plugin registration または discovery をリファクタリングした後

Contract tests は CI で実行され、実際の API keys は必要ありません。

## リグレッションの追加（ガイダンス）

live で発見された provider/model issue を修正する場合:

- 可能であれば CI-safe リグレッションを追加します（mock/stub provider、または正確な request-shape transformation を capture）
- それが本質的に live-only の場合（rate limits、auth policies）、live test を狭く保ち、env vars 経由で opt-in にします
- バグを捕まえる最小の layer を target することを優先します:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke または CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は registry metadata（`listSecretTargetRegistryEntries()`）から SecretRef class ごとに 1 つの sampled target を derive し、traversal-segment exec ids が拒否されることを assert します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、その test の `classifyTargetClass` を更新してください。この test は unclassified target ids で意図的に失敗するため、新しい classes が黙ってスキップされることはありません。

## 関連

- [ライブのテスト](/ja-JP/help/testing-live)
- [更新と plugins のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
