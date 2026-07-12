---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル／プロバイダーのバグに対するリグレッションテストの追加
    - Gateway とエージェントの動作のデバッグ
summary: テストキット：ユニット／E2E／ライブスイート、Docker ランナー、および各テストの対象範囲
title: テスト
x-i18n:
    generated_at: "2026-07-12T14:33:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（ユニット/統合、e2e、ライブ）と Docker
ランナーがあります。このページでは、各スイートの対象範囲、特定のワークフローで
実行するコマンド、ライブテストによる認証情報の検出方法、実環境のプロバイダー/モデルの
バグに対する回帰テストの追加方法について説明します。

<Note>
**QA スタック（qa-lab、qa-channel、ライブトランスポートレーン）**については、別途説明しています。

- [QA の概要](/ja-JP/concepts/qa-e2e-automation) - アーキテクチャ、コマンド体系、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) - `pnpm openclaw qa matrix` のリファレンス。
- [成熟度スコアカード](/ja-JP/maturity/scorecard) - リリース QA のエビデンスが安定性と LTS の判断をどのように支えるか。
- [QA チャンネル](/ja-JP/channels/qa-channel) - リポジトリベースのシナリオで使用される合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーについて説明します。以下の [QA 固有のランナー](#qa-specific-runners) には、具体的な `qa` 呼び出しを示し、上記のリファレンスを参照しています。
</Note>

## クイックスタート

通常は次のとおりです。

- 完全なゲート（プッシュ前の実行を想定）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでより高速にローカルの全スイートを実行：`pnpm test:max`
- Vitest の直接監視ループ：`pnpm test:watch`
- ファイルを直接指定すると、Plugin/チャンネルのパスにもルーティングされます：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 1 件の失敗について反復作業を行う場合は、最初に対象を絞った実行を推奨します。
- Docker ベースの QA サイト：`pnpm qa:lab:up`
- Linux VM ベースの QA レーン：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに変更を加えた場合や、信頼性をさらに高めたい場合は、次を実行します。

- 情報提供用の V8 カバレッジレポート：`pnpm test:coverage`
- E2E スイート：`pnpm test:e2e`

## テスト用一時ディレクトリ

テストが所有する一時ディレクトリには `test/helpers/temp-dir.ts` の共有ヘルパーを
使用し、所有権を明示して、クリーンアップがテストのライフサイクル内に収まるようにします。

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("一時ワークスペースを使用する", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // workspace を使用
});
```

`useAutoCleanupTempDirTracker(afterEach)` は意図的に手動クリーンアップ
メソッドを公開していません。各テスト後のクリーンアップは Vitest が所有します。移行が
完了していないテスト向けに、以前の低レベルヘルパー
（`makeTempDir`、`cleanupTempDirs`、`createTempDirTracker`）も残っていますが、
新規利用は避けてください。また、テストが生の一時ディレクトリの動作を明示的に
検証する場合を除き、新たに `fs.mkdtemp*` を直接呼び出すことも避けてください。
生の一時ディレクトリが本当に必要な場合は、理由を示す監査可能な許可コメントを追加します。

```ts
// openclaw-temp-dir: allow 生の fs クリーンアップ動作を検証
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` は、追加された差分行に含まれる
新しい生の一時ディレクトリ作成と、共有ヘルパーを新たに手動使用している箇所を報告しますが、
既存のクリーンアップ形式はブロックしません。これは `scripts/changed-lanes.mjs` と
同じテストパス分類に従い、共有ヘルパーの実装自体はスキップします。`check:changed` は、
変更されたテストパスについてこのレポートを警告専用の CI シグナル
（失敗ではなく GitHub の警告アノテーション）として実行します。

## ライブおよび Docker/Parallels ワークフロー

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）：

- ライブスイート（モデル + Gateway のツール/画像プローブ）：`pnpm test:live`
- 1 つのライブファイルだけを静かに実行：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイムパフォーマンスレポート：実際の `openai/gpt-5.6-luna` エージェントターンには
  `live_openai_candidate=true` を指定して `OpenClaw Performance` をディスパッチし、
  Kova の CPU/ヒープ/トレースアーティファクトには `deep_profile=true` を指定します。
  日次スケジュール実行では、モックプロバイダー、ディーププロファイル、GPT-5.6 Luna
  レーンのレポートを、独立したアーティファクト消費型パブリッシャージョブから
  `openclaw/clawgrit-reports` に公開します。パブリッシャー認証がないか無効な場合、
  スケジュール実行と `profile=release` 実行は失敗します。リリース以外の手動ディスパッチでは
  GitHub アーティファクトを保持し、レポート公開は参考情報として扱います。
  モックプロバイダーレポートには、ソースレベルの Gateway 起動、メモリ、Plugin 負荷、
  偽モデルによる反復 hello ループ、および CLI 起動の数値も含まれます。
- Docker ライブモデルスイープ：`pnpm test:docker:live-models`
  - 選択した各モデルで、テキストターンと小規模なファイル読み取り形式のプローブを実行します。
    メタデータで `image` 入力が宣言されているモデルでは、小さな画像ターンも実行します。
    プロバイダーの障害を切り分ける際は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` を指定して追加プローブを無効にします。
  - CI カバレッジ：日次の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` は、どちらも再利用可能なライブ/E2E ワークフローを
    `include_live_suites: true` で呼び出します。これには、プロバイダーごとに
    シャーディングされた Docker ライブモデルのマトリックスジョブが含まれます。
  - 対象を絞った CI 再実行では、`include_live_suites: true` および
    `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)`
    をディスパッチします。
  - 新しい高シグナルのプロバイダーシークレットを `scripts/ci-hydrate-live-auth.sh`、
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`、およびその
    スケジュール/リリース呼び出し元に追加します。
- ネイティブ Codex バインドチャットのスモークテスト：`pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker ライブレーンを実行し、合成 Slack DM を
    `/codex bind` でバインドして、`/codex fast` と `/codex permissions` を実行します。
    その後、通常の返信と画像添付が ACP ではなくネイティブ Plugin バインディングを
    経由することを検証します。
- Codex app-server ハーネスのスモークテスト：`pnpm test:docker:live-codex-harness`
  - Plugin が所有する Codex app-server ハーネスを通じて Gateway エージェントターンを
    実行し、`/codex status` と `/codex models` を検証します。デフォルトでは、
    画像、Cron MCP、サブエージェント、Guardian の各プローブも実行します。
    他の障害を切り分ける際は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` で
    サブエージェントプローブを無効にします。サブエージェントだけを確認する場合は、
    他のプローブを無効にします：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、
    サブエージェントプローブの後に終了します。
- Codex オンデマンドインストールのスモークテスト：`pnpm test:docker:codex-on-demand`
  - パッケージ化された OpenClaw tarball を Docker にインストールし、OpenAI API キーの
    オンボーディングを実行して、Codex Plugin と `@openai/codex` 依存関係が、
    管理対象 npm プロジェクトのルートへオンデマンドでダウンロードされたことを検証します。
- ライブ Plugin ツール依存関係のスモークテスト：`pnpm test:docker:live-plugin-tool`
  - 実際の `slugify` 依存関係を含むフィクスチャ Plugin をパックし、`npm-pack:` を通じて
    インストールして、管理対象 npm プロジェクトのルート配下に依存関係があることを検証します。
    次に、ライブ OpenAI モデルに Plugin ツールを呼び出して非表示のスラッグを返すよう要求します。
- Crestodian レスキューコマンドのスモークテスト：`pnpm test:live:crestodian-rescue-channel`
  - メッセージチャンネルのレスキューコマンド体系に対する、任意参加型の多重安全確認です。
    `/crestodian status` を実行し、永続的なモデル変更をキューに入れ、
    `/crestodian yes` と返信して、監査/設定の書き込みパスを検証します。
- Crestodian 初回実行 Docker スモークテスト：`pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw 状態ディレクトリから開始し、まずパッケージ化された
    `openclaw crestodian` CLI が推論なしでは安全側に失敗することを確認します。
    次に、パッケージ化されたアクティベーションモジュールを通じて偽の Claude をテストし、
    有効化します。その後に初めて、曖昧なパッケージ済み CLI リクエストがプランナーに到達し、
    型付きセットアップとして解決されます。続いて、1 回限りのモデル、エージェント、
    Discord Plugin、SecretRef の各操作を実行します。設定と監査エントリを検証します。
    これはゲート/操作を補足するエビデンスであり、対話型オンボーディングや
    Crestodian エージェント/ツール/承認の証明ではありません。同じレーンは QA Lab でも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` により公開されています。
- Moonshot/Kimi コストのスモークテスト：`MOONSHOT_API_KEY` を設定した状態で
  `openclaw models list --provider moonshot --json` を実行し、次に
  `moonshot/kimi-k2.6` に対して、分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSON が Moonshot/K2.6 を報告し、アシスタントのトランスクリプトに
  正規化された `usage.cost` が保存されていることを確認します。

<Tip>
失敗しているケースが 1 件だけ必要な場合は、以下で説明する許可リスト環境変数を使用して、ライブテストの対象を絞ることを推奨します。
</Tip>

## QA 固有のランナー

QA Lab の現実性が必要な場合、これらのコマンドは主要なテストスイートと併用します。

CI は専用ワークフローで QA Lab を実行します。エージェント動作との同等性検証は、
単独の PR ワークフローではなく、`QA-Lab - All Lanes` とリリース検証に含まれます。
広範な検証には、`rerun_group=qa-parity` を指定した `Full Release Validation`、
またはリリースチェックの QA グループを使用してください。安定版/デフォルトのリリースチェックでは、
`run_release_soak=true` の場合にのみ網羅的なライブ/Docker ソークを実行し、
`full` プロファイルではソークが強制的に有効になります。`QA-Lab - All Lanes` は
`main` で毎晩、および手動ディスパッチから実行され、モック同等性レーン、
ライブ Matrix レーン、Convex 管理のライブ Telegram レーン、Convex 管理のライブ Discord
レーンを並列ジョブとして実行します。スケジュール QA とリリースチェックでは Matrix に
`--profile fast` を明示的に渡しますが、Matrix CLI と手動ワークフロー入力のデフォルトは
引き続き `all` です。手動ディスパッチでは、`all` を `transport`、`media`、
`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` の各ジョブにシャーディングできます。
`OpenClaw Release Checks` はリリース承認前に、同等性レーン、高速 Matrix レーン、
Telegram レーンを実行します。リリーストランスポートチェックには
`mock-openai/gpt-5.6-luna` を使用するため、決定論的な動作を維持し、
通常のプロバイダー Plugin の起動を回避できます。これらのライブトランスポート Gateway
ではメモリ検索を無効にしています。メモリ動作は引き続き QA 同等性スイートでカバーされます。

完全なリリースのライブメディアシャードでは、
`ffmpeg` と `ffprobe` があらかじめ含まれている
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。
Docker ライブモデル/バックエンドシャードでは、選択したコミットごとに一度だけビルドされる
共有の `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各シャード内で
再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` を指定してプルします。

- `pnpm openclaw qa suite`
  - リポジトリに基づく QA シナリオをホスト上で直接実行します。
  - 選択したシナリオセットについて、最上位の `qa-evidence.json`、`qa-suite-summary.json`、
    `qa-suite-report.md` アーティファクトを書き出します。これには、混合フロー、Vitest、
    Playwright のシナリオ選択が含まれます。
  - `pnpm openclaw qa run --qa-profile <profile>` によってディスパッチされた場合、
    選択したタクソノミープロファイルのスコアカードを同じ `qa-evidence.json` に埋め込みます。
    `smoke-ci` は簡略化されたエビデンス（`evidenceMode: "slim"`、エントリごとの
    `execution` なし）を書き出します。`release` は厳選されたリリース準備状況の範囲を対象とし、
    `all` はアクティブなすべての成熟度カテゴリを選択し、完全なスコアカードアーティファクトが
    必要な場合の明示的な QA Profile Evidence ワークフローディスパッチを対象とします。
  - デフォルトでは、分離された Gateway ワーカーを使用して、選択した複数のシナリオを
    並列実行します。`qa-channel` のデフォルトの並行数は 4（選択したシナリオ数が上限）です。
    ワーカー数を調整するには `--concurrency <count>` を使用し、従来の直列レーンには
    `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると、ゼロ以外の終了コードで終了します。失敗する終了コードを
    返さずにアーティファクトを生成するには、`--allow-failures` を使用します。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、シナリオ対応の `mock-openai` レーンを置き換えることなく、実験的な
    フィクスチャおよびプロトコルモックのカバレッジ用に、ローカルの AIMock ベースの
    プロバイダーサーバーを起動します。
- `pnpm openclaw qa coverage --match <query>`
  - シナリオ ID、タイトル、サーフェス、カバレッジ ID、ドキュメント参照、コード参照、
    plugins、プロバイダー要件を検索し、一致するスイートターゲットを出力します。
  - 変更対象の動作またはファイルパスは分かっているものの、最小のシナリオが分からない場合、
    QA Lab の実行前にこれを使用します。これは助言のみです。変更する動作に基づいて、モック、
    ライブ、Multipass、Matrix、またはトランスポートの証明を引き続き選択してください。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab を通じて、ライブ OpenAI Kitchen Sink plugin の一連の試験を実行します。
    外部の Kitchen Sink パッケージをインストールし、plugin SDK のサーフェスインベントリを
    検証し、`/healthz` と `/readyz` をプローブし、Gateway の CPU/RSS エビデンスを記録し、
    ライブ OpenAI ターンを実行して、敵対的診断を確認します。`OPENAI_API_KEY` などの
    ライブ OpenAI 認証が必要です。ハイドレート済みの Testbox セッションでは、
    `openclaw-testbox-env` ヘルパーが存在する場合、Testbox のライブ認証プロファイルを
    自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチに加えて、小規模なモック QA Lab シナリオパック
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`）を実行し、統合された CPU 観測サマリーを
    `.artifacts/gateway-cpu-scenarios/` 配下に書き出します。
  - デフォルトでは、持続的な高 CPU 観測のみをフラグ付けします（`--cpu-core-warn`、
    デフォルト `0.9`、`--hot-wall-warn-ms`、デフォルト `30000`）。そのため、短時間の
    起動時バーストは、数分間続く Gateway の CPU 張り付き回帰のように見せることなく、
    メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトに対して実行されます。チェックアウトに最新の
    ランタイム出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを破棄可能な Multipass Linux VM 内で実行し、`qa suite` と同じ
    シナリオ選択およびプロバイダー／モデルフラグを維持します。
  - ライブ実行では、ゲストで利用可能な QA 認証入力を転送します。これには、
    環境変数ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および存在する場合の
    `CODEX_HOME` が含まれます。
  - ゲストがマウントされたワークスペース経由で書き戻せるよう、出力ディレクトリは
    リポジトリルート配下に配置する必要があります。
  - 通常の QA レポートとサマリーに加えて、Multipass のログを
    `.artifacts/qa-e2e/...` 配下に書き出します。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業用に、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker にグローバルインストールし、
    非対話式の OpenAI API キーによるオンボーディングを実行し、デフォルトで Telegram を
    設定し、パッケージ化された plugin ランタイムが起動時の依存関係修復なしで読み込まれる
    ことを検証し、doctor を実行して、モック化された OpenAI エンドポイントに対して
    ローカルエージェントターンを 1 回実行します。
  - Discord で同じパッケージインストールレーンを実行するには、
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストのトランスクリプトについて、決定的なビルド済みアプリの
    Docker スモークテストを実行します。非表示の OpenClaw ランタイムコンテキストが、
    表示されるユーザーターンに漏れるのではなく、非表示のカスタムメッセージとして保持される
    ことを検証します。その後、影響を受ける壊れたセッション JSONL をシードし、
    `openclaw doctor --fix` がバックアップ付きでアクティブなブランチに書き換えることを
    検証します。
- `pnpm test:docker:npm-telegram-live`
  - OpenClaw パッケージ候補を Docker にインストールし、インストール済みパッケージの
    オンボーディングを実行し、インストール済み CLI を介して Telegram を設定した後、
    そのインストール済みパッケージをテスト対象システムの Gateway として、ライブ Telegram
    QA レーンを再利用します。
  - ラッパーがチェックアウトからマウントするのは `qa-lab` ハーネスのソースだけです。
    インストール済みパッケージが `dist`、`openclaw/plugin-sdk`、および同梱 plugin
    ランタイムを所有するため、このレーンでは現在のチェックアウトの plugins がテスト対象
    パッケージに混入しません。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。
    レジストリからインストールする代わりに解決済みのローカル tarball をテストするには、
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - デフォルトでは、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` により、
    `qa-evidence.json` に反復 RTT タイミングを出力します。実行を調整するには、
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` には、サンプリングする Telegram QA チェック ID の
    カンマ区切りリストを指定できます。未設定の場合、デフォルトの RTT 対応チェックは
    `telegram-mentioned-message-reply` です。
  - `pnpm openclaw qa telegram` と同じ Telegram の環境変数認証情報または Convex の
    認証情報ソースを使用します。CI／リリース自動化では、
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて、
    `OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定します。
    CI に `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットが存在する場合、
    Docker ラッパーは Convex を自動的に選択します。
  - ラッパーは、Docker のビルド／インストール作業の前に、ホスト上で Telegram または
    Convex の認証情報環境変数を検証します。認証情報設定前の状態を意図的にデバッグする場合
    に限り、`OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに限り、
    共有の `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。Convex 認証情報が選択され、
    ロールが設定されていない場合、ラッパーは CI 内では `ci`、CI 外では `maintainer` を
    使用します。
  - GitHub Actions では、このレーンを手動のメンテナーワークフロー
    `NPM Telegram Beta E2E` として公開しています。マージ時には実行されません。
    このワークフローは `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- GitHub Actions では、1 つの候補パッケージに対するサイド実行の製品証明として
  `Package Acceptance` も公開しています。Git ref、公開済み npm 指定、SHA-256 付きの
  HTTPS tarball URL、信頼済み URL ポリシー、または別の実行からの tarball アーティファクト
  （`source=ref|npm|url|trusted-url|artifact`）を受け付け、正規化された
  `openclaw-current.tgz` を `package-under-test` としてアップロードした後、既存の
  Docker E2E スケジューラーを `smoke`、`package`、`product`、`full`、または
  `custom` のレーンプロファイルで実行します。同じ `package-under-test` アーティファクトに
  対して Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または
  `live-frontier` を設定します。
  - 最新ベータ版の製品証明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL による証明にはダイジェストが必要で、公開 URL の安全性ポリシーを使用します：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- エンタープライズ／プライベート tarball ミラーでは、明示的な信頼済みソースポリシーを使用します：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` は、信頼済みワークフロー ref から `.github/package-trusted-sources.json` を読み取り、URL 認証情報やワークフロー入力によるプライベートネットワークのバイパスを受け付けません。指定したポリシーがベアラー認証を宣言している場合は、固定の `OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを設定します。

- アーティファクトによる証明では、別の Actions 実行から tarball アーティファクトをダウンロードします：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw ビルドをパッケージ化して Docker にインストールし、OpenAI を設定した
    Gateway を起動した後、設定編集によって同梱のチャネル／plugins を有効化します。
  - セットアップ検出によって、未設定のダウンロード可能な plugins が存在しない状態に
    保たれること、最初の設定済み doctor 修復で不足している各ダウンロード可能 plugin が
    明示的にインストールされること、および 2 回目の再起動では非表示の依存関係修復が
    実行されないことを検証します。
  - また、既知の古い npm ベースラインをインストールし、
    `openclaw update --tag <candidate>` を実行する前に Telegram を有効化して、候補の
    更新後 doctor がハーネス側の postinstall 修復なしで、レガシーな plugin 依存関係の
    残骸をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブなパッケージインストール更新のスモークテストを
    実行します。選択された各プラットフォームでは、最初に指定されたベースラインパッケージを
    インストールし、次に同じゲスト内でインストール済みの `openclaw update` コマンドを
    実行して、インストール済みバージョン、更新ステータス、Gateway の準備完了状態、および
    ローカルエージェントターン 1 回を検証します。
  - 1 つのゲストについて反復作業する場合は、`--platform macos`、`--platform windows`、
    または `--platform linux` を使用します。サマリーアーティファクトのパスとレーンごとの
    ステータスには、`--json` を使用します。
  - OpenAI レーンは、デフォルトでライブエージェントターンの証明に
    `openai/gpt-5.6-luna` を使用します。別の OpenAI モデルを検証するには、
    `--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels のトランスポート停止によって残りのテスト時間を消費しないよう、長時間の
    ローカル実行はホスト側のタイムアウトでラップします：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトは、ネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に
    書き出します。外側のラッパーがハングしていると判断する前に、`windows-update.log`、
    `macos-update.log`、または `linux-update.log` を確認してください。
  - コールド状態のゲストでは、Windows の更新後 doctor およびパッケージ更新処理に
    10〜15 分かかることがあります。ネストされた npm デバッグログが進行している限り、
    これは正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux スモークレーンと
    並列実行しないでください。これらは VM 状態を共有しており、スナップショット復元、
    パッケージ配信、またはゲストの Gateway 状態で競合する可能性があります。
  - 更新後の証明では、通常の同梱 plugin サーフェスを実行します。これは、エージェントターン
    自体では単純なテキスト応答のみを確認する場合でも、音声、画像生成、メディア理解などの
    機能ファサードが同梱ランタイム API を介して読み込まれるためです。

- `pnpm openclaw qa aimock`
  - プロトコルの直接スモークテスト用に、ローカルの AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 破棄可能な Docker ベースの Tuwunel ホームサーバーに対して、Matrix のライブ QA レーンを実行します。ソースチェックアウト専用です。パッケージ版インストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル／シナリオカタログ、環境変数、アーティファクト構成については、[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。
- `pnpm openclaw qa telegram`
  - 環境変数から取得したドライバーおよび SUT ボットトークンを使用して、実際のプライベートグループに対して Telegram のライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報には `--credential-source convex` を使用できます。デフォルトでは環境変数モードを使用し、プールされたリースを利用する場合は `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - デフォルトでは、カナリア、メンションゲート、コマンドの宛先指定、`/status`、ボット間のメンション付き返信、コアのネイティブコマンド返信を対象とします。`mock-openai` のデフォルトでは、決定論的な返信チェーンと Telegram の最終メッセージストリーミングの回帰も対象とします。`session_status` などのオプションプローブについては、`--list-scenarios` を使用してください。
  - いずれかのシナリオが失敗すると、ゼロ以外で終了します。失敗終了コードを返さずにアーティファクトを取得するには、`--allow-failures` を使用してください。
  - 同じプライベートグループ内に、互いに異なる 2 つのボットが必要です。また、SUT ボットには Telegram ユーザー名が設定されている必要があります。
  - ボット間通信を安定して観測するには、`@BotFather` で両方のボットの Bot-to-Bot Communication Mode を有効にし、ドライバーボットがグループ内のボット通信を観測できることを確認してください。
  - Telegram QA レポート、サマリー、`qa-evidence.json` を `.artifacts/qa-e2e/...` 配下に書き込みます。返信を伴うシナリオには、ドライバーの送信リクエストから観測された SUT の返信までの RTT が含まれます。

`Mantis Telegram Live` は、このレーンを使用する PR エビデンス用ラッパーです。Convex からリースした Telegram 認証情報で候補 ref を実行し、編集済みの QA レポート／エビデンスバンドルを Crabbox デスクトップブラウザーにレンダリングし、MP4 エビデンスを録画し、動きに合わせてトリミングした GIF を生成し、アーティファクトバンドルをアップロードします。`pr_number` が設定されている場合は、Mantis GitHub App を通じてインラインの PR エビデンスを投稿します。メンテナーは Actions UI の `Mantis Scenario`（`scenario_id: telegram-live`）から、または pull request のコメントから直接開始できます。

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` は、PR の視覚的証明用に、ネイティブ Telegram Desktop で変更前後を検証するエージェント型ラッパーです。Actions UI で自由形式の `instructions` を指定するか、`Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）を使用するか、PR コメントから開始します。

```text
@openclaw-mantis telegram desktop proof
```

Mantis エージェントは PR を読み、変更を証明する Telegram 上で可視の動作を判断し、ベースライン ref と候補 ref に対して実ユーザーの Crabbox Telegram Desktop 証明レーンを実行します。ネイティブ GIF が有用になるまで反復し、対になった `motionPreview` マニフェストを書き込み、`pr_number` が設定されている場合は Mantis GitHub App を通じて同じ 2 列の GIF テーブルを投稿します。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux デスクトップをリースまたは再利用し、ネイティブ Telegram Desktop をインストールし、リースした Telegram SUT ボットトークンで OpenClaw を構成し、Gateway を起動して、表示中の VNC デスクトップからスクリーンショット／MP4 エビデンスを記録します。
  - デフォルトは `--credential-source convex` であるため、ワークフローに必要なのは Convex ブローカーのシークレットのみです。`pnpm openclaw qa telegram` と同じ `OPENCLAW_QA_TELEGRAM_*` 変数を使用する場合は、`--credential-source env` を使用してください。
  - Telegram Desktop には引き続きユーザーログイン／プロファイルが必要です。ボットトークンで構成されるのは OpenClaw のみです。base64 形式の `.tgz` プロファイルアーカイブには `--telegram-profile-archive-env <name>` を使用するか、`--keep-lease` を使用して VNC から一度手動でログインしてください。
  - 出力ディレクトリ配下に `mantis-telegram-desktop-builder-report.md`、`mantis-telegram-desktop-builder-summary.json`、`telegram-desktop-builder.png`、`telegram-desktop-builder.mp4` を書き込みます。

新しいトランスポート間で差異が生じないよう、ライブトランスポートレーンは 1 つの標準契約を共有します。レーンごとのカバレッジマトリクスは、[QA 概要 - ライブトランスポートのカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage)にあります。`qa-channel` は広範な合成スイートであり、このマトリクスには含まれません。

### Convex を介した共有 Telegram 認証情報（v1）

ライブトランスポート QA で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA ラボは Convex ベースのプールから排他的リースを取得し、レーンの実行中はそのリースに Heartbeat を送り、シャットダウン時にリースを解放します。このセクション名は Discord、Slack、WhatsApp のサポートより前から存在しますが、リース契約は種類をまたいで共有されます。

参考用 Convex プロジェクトのスキャフォールド：`qa/convex-credential-broker/`

必須の環境変数：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例：`https://your-deployment.convex.site`）
- 選択したロール用のシークレット 1 つ：
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択：
  - CLI：`--credential-role maintainer|ci`
  - 環境変数のデフォルト：`OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトが `ci`、それ以外では `maintainer`）

オプションの環境変数：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（オプションのトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` を設定すると、ローカル専用開発向けに local loopback の `http://` Convex URL を許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` に `https://` を使用する必要があります。

メンテナー用の管理コマンド（プールの追加／削除／一覧表示）には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を表示せずに、Convex サイト URL、ブローカーシークレット、エンドポイントプレフィックス、HTTP タイムアウト、管理／一覧取得の到達可能性を確認してください。スクリプトや CI ユーティリティで機械可読出力を使用するには、`--json` を使用してください。

デフォルトのエンドポイント契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）。
リクエストは `Authorization: Bearer <role secret>` ヘッダーで認証します。以下の本文では、このヘッダーを省略しています。

- `POST /acquire`
  - リクエスト：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇／再試行可能：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - リクエスト：`{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - 成功：`{ status: "ok", index, data }`
- `POST /heartbeat`
  - リクエスト：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（または空の `2xx`）
- `POST /release`
  - リクエスト：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（または空の `2xx`）
- `POST /admin/add`（メンテナーシークレットのみ）
  - リクエスト：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（メンテナーシークレットのみ）
  - リクエスト：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - アクティブなリースのガード：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（メンテナーシークレットのみ）
  - リクエスト：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 種類のペイロード形式：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形式を検証し、不正な形式のペイロードを拒否します。

Telegram 実ユーザー種類のペイロード形式：

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId`、`telegramApiId` は数値文字列である必要があります。
- `tdlibArchiveSha256` と `desktopTdataArchiveSha256` は SHA-256 の 16 進文字列である必要があります。
- `kind: "telegram-user"` は Mantis Telegram Desktop 証明ワークフロー用に予約されています。汎用 QA Lab レーンはこれを取得してはなりません。

ブローカーで検証されるマルチチャネルペイロード：

- Discord：`{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp：`{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack レーンもプールからリースできますが、Slack ペイロードの検証は現在、ブローカーではなく Slack QA ランナーに実装されています。Slack の行には `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用してください。

### QA へのチャネル追加

新しいチャネルアダプターのアーキテクチャとシナリオヘルパー名については、[QA 概要 - チャネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel)を参照してください。最低要件は、共有 `qa-lab` ホストシーム上にトランスポートランナーを実装し、共有シナリオ用の `adapterFactory` を追加し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成することです。

## テストスイート（どこで何を実行するか）

各スイートは、「現実性が高くなる」順（それに伴い不安定さ／コストも増加）と考えてください。

### ユニット／統合（デフォルト）

- コマンド：`pnpm test`
- 構成：対象を指定しない実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの構成へ展開する場合があります
- ファイル：`src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下のコア／ユニットインベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- 範囲：
  - 純粋なユニットテスト
  - インプロセス統合テスト（Gateway 認証、ルーティング、ツール、解析、構成）
  - 既知のバグに対する決定論的な回帰テスト
- 想定：
  - CI で実行されます
  - 実際のキーは不要です
  - 高速かつ安定している必要があります
  - リゾルバーおよび公開サーフェスのローダーテストでは、実際のバンドル済み Plugin ソース API ではなく、生成した小さな Plugin フィクスチャを使用して、広範な `api.js` および `runtime-api.js` のフォールバック動作を証明する必要があります。実際の Plugin API のロードは、Plugin が所有する契約／統合スイートで扱います。

ネイティブ依存関係のポリシー：

- デフォルトのテストインストールでは、オプションのネイティブ Discord opus ビルドをスキップします。Discord 音声はバンドル済みの `libopus-wasm` を使用し、ローカルテストおよび Testbox レーンでネイティブアドオンをコンパイルしないよう、`@discordjs/opus` は `allowBuilds` で無効のままにします。
- ネイティブ opus のパフォーマンス比較は、デフォルトの OpenClaw インストール／テストループではなく、`libopus-wasm` ベンチマークリポジトリで行ってください。デフォルトの `allowBuilds` で `@discordjs/opus` を `true` に設定しないでください。設定すると、無関係なインストール／テストループでネイティブコードがコンパイルされます。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ指定レーン">

    - 対象を指定しない `pnpm test` は、1 つの巨大なネイティブルートプロジェクトプロセスではなく、13 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-tooling`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、高負荷なマシンでのピーク RSS が低減され、auto-reply/Plugin の処理によって無関係なスイートがリソース不足になることを防ぎます。
    - 複数シャードの監視ループは実用的ではないため、`pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ限定レーンに振り分けるため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ではルートプロジェクト全体の起動コストを負担せずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ限定レーンへ展開します。対象は、テストへの直接編集、同階層の `*.test.ts` ファイル、明示的なソースマッピング、ローカルインポートグラフ上の依存ファイルです。`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を明示的に使用しない限り、設定、セットアップ、パッケージへの編集によってテストが広範囲に実行されることはありません。
    - `pnpm check:changed` は、範囲の狭い作業向けの通常のスマートローカルチェックゲートです。差分をコア、コアテスト、拡張機能、拡張機能テスト、アプリ、ドキュメント、リリースメタデータ、ライブ Docker ツール、ツールに分類し、対応する型チェック、lint、ガードコマンドを実行します。Vitest テストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン更新では、対象を限定したバージョン、設定、ルート依存関係のチェックを実行し、トップレベルのバージョンフィールド以外のパッケージ変更を拒否するガードも適用します。
    - ライブ Docker ACP ハーネスへの編集では、ライブ Docker 認証スクリプトのシェル構文と、ライブ Docker スケジューラーのドライランに絞ったチェックを実行します。`package.json` の変更が対象に含まれるのは、差分が `scripts["test:docker:live-*"]` のみに限定されている場合です。依存関係、エクスポート、バージョン、その他のパッケージサーフェスへの編集には、引き続きより広範なガードが使用されます。
    - agents、commands、plugins、auto-reply ヘルパー、`plugin-sdk`、および同様の純粋なユーティリティ領域にあるインポートの軽い単体テストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンに振り分けられます。状態を持つファイルやランタイム負荷の高いファイルは、既存のレーンに残ります。
    - 選択された `plugin-sdk` および `commands` のヘルパーソースファイルも、変更モードの実行時に、これらの軽量レーン内の明示的な同階層テストへマッピングされます。そのため、ヘルパーの編集によって当該ディレクトリの重いスイート全体が再実行されることを回避できます。
    - `auto-reply` には、トップレベルのコアヘルパー、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー専用のバケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing の各シャードに分割し、インポート負荷の高い 1 つのバケットが Node の終盤処理全体を占有しないようにしています。
    - 通常の PR/main CI では、バンドル済み Plugin の一括スイープとリリース専用の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補に対して、これらの Plugin 負荷が高いスイート用の別個の `Plugin Prerelease` 子ワークフローをディスパッチします。

  </Accordion>

  <Accordion title="埋め込みランナーのカバレッジ">

    - メッセージツールの検出入力または Compaction ランタイムの
      コンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングおよび正規化の境界には、対象を絞った
      ヘルパーの回帰テストを追加してください。
    - 埋め込みランナーの統合スイートを正常に保ってください：
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`、および
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付き ID と Compaction の動作が引き続き
      実際の `run.ts` / `compact.ts` パスを通ることを検証します。ヘルパーのみのテストは、
      これらの統合パスを十分に代替するものではありません。

  </Accordion>

  <Accordion title="Vitest プールと分離のデフォルト">

    - ベースの Vitest 設定では、デフォルトで `threads` を使用します。
    - 共有 Vitest 設定では `isolate: false` に固定し、
      ルートプロジェクト、e2e、ライブ設定全体で非分離ランナーを使用します。
    - ルート UI レーンでは `jsdom` のセットアップとオプティマイザーを維持しますが、
      共有の非分離ランナー上で実行します。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false`
      のデフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行時の V8 コンパイルの繰り返しを
      減らすため、デフォルトで Vitest の子 Node プロセスに `--no-maglev` を追加します。
      標準の V8 動作と比較するには、`OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
    - `scripts/run-vitest.mjs` は、stdout または stderr に出力がない状態が 5 分間続くと、
      明示的な非監視 Vitest 実行を終了します。意図的に無出力の調査でウォッチドッグを
      無効にするには、`OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、差分によってトリガーされるアーキテクチャレーンを表示します。
    - pre-commit フックはフォーマットのみを行います。フォーマットされたファイルを
      再ステージしますが、lint、型チェック、テストは実行しません。
    - スマートローカルチェックゲートが必要な場合は、引き渡しまたは push の前に
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` は、デフォルトで低コストなスコープ限定レーンに振り分けられます。
      エージェントがハーネス、設定、パッケージ、またはコントラクトへの編集に
      より広範な Vitest カバレッジが本当に必要だと判断した場合にのみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は、ワーカー上限が高いことを除き、
      同じルーティング動作を維持します。
    - ローカルワーカーの自動スケーリングは意図的に保守的で、ホストの平均負荷が
      すでに高い場合は縮小するため、複数の Vitest を同時に実行しても、
      デフォルトでは影響が抑えられます。
    - ベースの Vitest 設定では、プロジェクト/設定ファイルを
      `forceRerunTriggers` としてマークしているため、テストの配線が変更された場合も、
      変更モードの再実行が正しく行われます。
    - この設定では、対応するホスト上で `OPENCLAW_VITEST_FS_MODULE_CACHE` が有効なままです。
      直接プロファイリングする際に明示的なキャッシュの場所を 1 つ指定するには、
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="パフォーマンスのデバッグ">

    - `pnpm test:perf:imports` は、Vitest のインポート所要時間レポートと、
      インポート内訳の出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューの範囲を
      `origin/main` 以降に変更されたファイルに限定します。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。
      設定全体の実行では設定パスをキーとして使用します。include パターンを使用する CI
      シャードでは、フィルタリングされたシャードを個別に追跡できるように、
      シャード名を追加します。
    - 高負荷なテストの 1 つが依然として起動時のインポートに大半の時間を費やしている場合は、
      重い依存関係を狭いローカル `*.runtime.ts` シームの背後に配置し、そのシームを直接
      モックしてください。単に `vi.mock(...)` へ渡すためだけにランタイムヘルパーを
      深くインポートしないでください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、コミット済みの差分について、
      ルーティングされた `test:changed` とネイティブルートプロジェクトのパスを比較し、
      経過時間と macOS の最大 RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更されたファイル一覧を
      `scripts/test-projects.mjs` とルート Vitest 設定に振り分けることで、
      現在のダーティツリーをベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite の起動および変換オーバーヘッドについて、
      メインスレッドの CPU プロファイルを書き込みます。
    - `pnpm test:perf:profile:runner` は、ファイルの並列処理を無効にした単体テストスイートについて、
      ランナーの CPU+ヒーププロファイルを書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（Gateway）

- コマンド：`pnpm test:stability:gateway`
- 設定：`test/vitest/vitest.gateway.config.ts`、`test/vitest/vitest.logging.config.ts`、`test/vitest/vitest.infra.config.ts`。それぞれ 1 ワーカーに固定
- 対象範囲：
  - デフォルトで診断を有効にした実際の loopback Gateway を起動
  - 診断イベントパスを通じて、合成 Gateway メッセージ、メモリ、大容量ペイロードの高頻度処理を駆動
  - Gateway WS RPC 経由で `diagnostics.stability` を照会
  - 診断安定性バンドルの永続化ヘルパーを対象に含む
  - レコーダーが上限内に収まり、合成 RSS サンプルが負荷予算を下回り、セッションごとのキュー深度が再びゼロまで排出されることをアサート
- 想定：
  - CI で安全に実行でき、キーは不要
  - 安定性の回帰を追跡するための限定レーンであり、Gateway スイート全体の代替ではない

### E2E（リポジトリ集約）

- コマンド：`pnpm test:e2e`
- 対象範囲：
  - Gateway スモーク E2E レーンを実行
  - モック化された Control UI ブラウザー E2E レーンを実行
- 想定：
  - CI で安全に実行でき、キーは不要
  - Playwright Chromium がインストールされている必要がある

### E2E（Gateway スモーク）

- コマンド：`pnpm test:e2e:gateway`
- 設定：`test/vitest/vitest.e2e.config.ts`
- ファイル：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下のバンドル済み Plugin の E2E テスト
- ランタイムのデフォルト：
  - リポジトリの他の部分と同様に、Vitest の `threads` と `isolate: false` を使用します。
  - 適応型ワーカーを使用します（CI：最大 2、ローカル：デフォルトで 1）。
  - コンソール I/O のオーバーヘッドを削減するため、デフォルトではサイレントモードで実行します。
- 便利なオーバーライド：
  - ワーカー数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - 詳細なコンソール出力を再度有効にするには `OPENCLAW_E2E_VERBOSE=1`。
- 対象範囲：
  - 複数インスタンスの Gateway のエンドツーエンド動作
  - WebSocket/HTTP サーフェス、Node のペアリング、および高負荷なネットワーク処理
- 想定：
  - CI で実行される（パイプラインで有効な場合）
  - 実際のキーは不要
  - 単体テストよりも構成要素が多い（遅くなる場合がある）

### E2E（Control UI のモックブラウザー）

- コマンド：`pnpm test:ui:e2e`
- 設定：`test/vitest/vitest.ui-e2e.config.ts`
- ファイル：`ui/src/**/*.e2e.test.ts`
- 対象範囲：
  - Vite Control UI を起動
  - Playwright を通じて実際の Chromium ページを操作
  - Gateway WebSocket を決定論的なブラウザー内モックに置き換え
- 想定：
  - `pnpm test:e2e` の一部として CI で実行
  - 実際の Gateway、エージェント、プロバイダーキーは不要
  - ブラウザー依存関係が存在する必要がある（`pnpm --dir ui exec playwright install chromium`）

### E2E：OpenShell バックエンドのスモークテスト

- コマンド：`pnpm test:e2e:openshell`
- ファイル：`extensions/openshell/src/backend.e2e.test.ts`
- 対象範囲：
  - アクティブなローカル OpenShell Gateway を再利用
  - 一時的なローカル Dockerfile からサンドボックスを作成
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell バックエンドを実行
  - サンドボックスの fs ブリッジを通じて、リモートを正規とするファイルシステム動作を検証
- 想定：
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と稼働中の Docker デーモンが必要
  - アクティブなローカル OpenShell Gateway とその設定ソースが必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト用サンドボックスを破棄
- 便利なオーバーライド：
  - より広範な e2e スイートを手動実行する際にテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたはラッパースクリプトを指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - 登録済み Gateway 設定を分離されたテストに公開するには `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - ホストポリシーフィクスチャが使用する Docker Gateway IP を上書きするには `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### ライブ（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `test/vitest/vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル済みPluginのライブテスト
- デフォルト: `pnpm test:live` により**有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- 対象範囲:
  - 「このプロバイダー／モデルは、実際の認証情報を使用して本当に_今日_動作するか？」
  - プロバイダーの形式変更、ツール呼び出しの特有動作、認証問題、レート制限の挙動を検出
- 前提:
  - 設計上、CIでの安定性は保証されない（実際のネットワーク、実際のプロバイダーポリシー、クォータ、障害）
  - 費用が発生し、レート制限を消費する
  - 「すべて」ではなく、対象を絞ったサブセットの実行を推奨
- ライブ実行では、すでにエクスポートされているAPIキーと準備済みの認証プロファイルを使用します。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定／認証情報を一時テストホームにコピーするため、ユニットテストのフィクスチャが実際の `~/.openclaw` を変更することはありません。
- ライブテストで実際のホームディレクトリを使用する必要が意図的にある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` のデフォルトは、より静かなモードです。`[live] ...` の進捗出力は維持しつつ、Gatewayのブートストラップログ／Bonjourのメッセージを抑制します。完全な起動ログを再び表示するには、`OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- APIキーのローテーション（プロバイダー固有）: カンマ／セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、`OPENCLAW_LIVE_*_KEY` でライブ実行ごとに上書きします。テストはレート制限応答時に再試行します。
- 進捗／Heartbeat出力:
  - 長時間のプロバイダー呼び出しが、Vitestのコンソールキャプチャが静かな場合でも動作中であることが分かるように、ライブスイートは進捗行をstderrへ出力します。
  - `test/vitest/vitest.live.config.ts` はVitestのコンソールインターセプトを無効化するため、ライブ実行中はプロバイダー／Gatewayの進捗行が即座にストリーミングされます。
  - ダイレクトモデルのHeartbeatは `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway／プローブのHeartbeatは `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきですか？

次の判断表を使用してください。

- ロジック／テストを編集する場合: `pnpm test` を実行（多くの変更を加えた場合は `pnpm test:coverage` も実行）
- Gatewayのネットワーク／WSプロトコル／ペアリングに変更を加える場合: `pnpm test:e2e` を追加
- 「ボットが停止している」問題／プロバイダー固有の障害／ツール呼び出しをデバッグする場合: 対象を絞った `pnpm test:live` を実行

## ライブ（ネットワークにアクセスする）テスト

ライブモデルマトリクス、CLIバックエンドのスモークテスト、ACPスモークテスト、Codex app-server
ハーネス、およびすべてのメディアプロバイダーのライブテスト（Deepgram、BytePlus、ComfyUI、
画像、音楽、動画、メディアハーネス）とライブ実行時の認証情報処理については、

- [ライブスイートのテスト](/ja-JP/help/testing-live)を参照してください。専用のアップデートおよび
  Plugin検証チェックリストについては、
  [アップデートとPluginのテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

## Dockerランナー（任意の「Linuxで動作する」チェック）

これらのDockerランナーは、次の2つのカテゴリに分かれます。

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリのDockerイメージ内で、それぞれ対応するプロファイルキーのライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカルの設定ディレクトリ、ワークスペース、および任意のプロファイル環境変数ファイルをマウントします。対応するローカルエントリーポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Dockerライブランナーには、必要に応じて実用的な上限が個別に設定されています。
  `test:docker:live-models` のデフォルトは、厳選されたサポート対象の高シグナルセットであり、
  `test:docker:live-gateway` のデフォルトは `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。明示的に上限を小さくする場合や、より大きなスキャンを行う場合は、`OPENCLAW_LIVE_MAX_MODELS`
  またはGatewayの環境変数を設定してください。
- `test:docker:all` は、`test:docker:live-build` を介してライブDockerイメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を介してOpenClawをnpm tarballとして一度パッケージ化した後、2つの `scripts/e2e/Dockerfile` イメージをビルドまたは再利用します。ベアイメージは、インストール／アップデート／Plugin依存関係レーン専用のNode/Gitランナーであり、これらのレーンは事前ビルド済みのtarballをマウントします。機能イメージは、ビルド済みアプリの機能レーン用に、同じtarballを `/app` にインストールします。Dockerレーンの定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあります。`scripts/test-docker-all.mjs` は選択されたプランを実行します。この集約処理では、重み付きローカルスケジューラーを使用します。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限によって負荷の高いライブ、npmインストール、および複数サービスのレーンがすべて同時に開始されないようにします。単一レーンの負荷が有効な上限を超える場合でも、プールが空であればスケジューラーはそのレーンを開始でき、再び容量が利用可能になるまで単独で実行し続けます。デフォルトは10スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`、および `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`（およびその他の `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` 上書き）は、Dockerホストに余裕がある場合にのみ調整してください。ランナーはデフォルトでDockerの事前チェックを実行し、古いOpenClaw E2Eコンテナを削除し、30秒ごとにステータスを出力し、成功したレーンの実行時間を `.artifacts/docker-tests/lane-timings.json` に保存し、後続の実行ではその実行時間を使用して長いレーンから先に開始します。Dockerをビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択したレーン、パッケージ／イメージ要件、および認証情報に関するCIプランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用します。
- `Package Acceptance` は、「このインストール可能なtarballは製品として動作するか？」を確認するGitHubネイティブのパッケージゲートです。`source=npm`、`source=ref`、`source=url`、`source=trusted-url`、または `source=artifact` から候補パッケージを1つ解決し、それを `package-under-test` としてアップロードした後、選択したrefを再パッケージ化する代わりに、その正確なtarballに対して再利用可能なDocker E2Eレーンを実行します。プロファイルは対象範囲が狭い順に `smoke`、`package`、`product`、`full`（および明示的なレーンリスト用の `custom`）です。パッケージ／アップデート／Pluginの契約、公開済みアップグレードの生存確認マトリクス、リリースのデフォルト、および障害のトリアージについては、[アップデートとPluginのテスト](/ja-JP/help/testing-updates-plugins)を参照してください。
- ビルドおよびリリースチェックでは、tsdownの後に `scripts/check-cli-bootstrap-imports.mjs` を実行します。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的なビルド済みグラフをたどり、コマンドのディスパッチ前に、そのブートストラップグラフが外部パッケージ（Commander、プロンプトUI、undici、ロギング、および同様に起動負荷の高い依存関係はすべて対象）を静的にインポートしている場合に失敗します。また、バンドルされたGateway実行チャンクを70 KBに制限し、そのチャンクから既知のコールドGatewayパス（`control-ui-assets`、`diagnostic-stability-bundle`、`onboard-helpers`、`process-respawn`、`restart-sentinel`、`server-close`、`server-reload-handlers`）を静的にインポートすることを拒否します。`scripts/release-check.ts` は別途、パッケージ化されたCLIを `--help`、`onboard --help`、`doctor --help`、`status --json --timeout 1`、`config schema`、および `models list --provider openai` でスモークテストします。
- Package Acceptanceのレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限されています。この期限までは、ハーネスはリリース済みパッケージのメタデータ不足のみを許容します。具体的には、非公開QAインベントリエントリの欠落、`gateway install --wrapper` の欠落、tarball由来のgitフィクスチャでのパッチファイルの欠落、永続化された `update.channel` の欠落、レガシーPluginインストール記録の保存場所、マーケットプレイスのインストール記録の永続化欠落、および `plugins update` 中の設定メタデータ移行です。`2026.4.25` より後のパッケージでは、これらのパスは厳格な失敗となります。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1つ以上の実際のコンテナを起動し、より高レベルの統合パスを検証します。
- `scripts/lib/openclaw-e2e-instance.sh` を介してパッケージ化されたOpenClaw tarballをインストールするDocker/Bash E2Eレーンでは、`npm install` の上限を `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（デフォルト `600s`。デバッグのためにラッパーを無効化するには `0` を設定）に設定します。

ライブモデルDockerランナーは、必要なCLI認証ホームのみ
（実行対象を絞っていない場合は、サポート対象のすべて）をバインドマウントし、実行前に
コンテナのホームへコピーします。これにより、外部CLIのOAuthは、ホストの認証ストアを
変更することなくトークンを更新できます。

- ダイレクトモデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACPバインドスモークテスト: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`。デフォルトでClaude、Codex、Geminiを対象とし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` によりDroid／OpenCodeを厳格に検証）
- CLIバックエンドスモークテスト: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-serverハーネスのスモークテスト: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- オブザーバビリティのスモークテスト: `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke`、および `pnpm qa:observability:smoke` は、非公開QAソースチェックアウト用のレーンです。npm tarballにはQA Labが含まれていないため、意図的にパッケージのDockerリリースレーンには含まれていません。
- Open WebUIライブスモークテスト: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なスキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Npm tarballのオンボーディング／チャンネル／エージェントのスモークテスト: `pnpm test:docker:npm-onboard-channel-agent` は、パッケージ化されたOpenClaw tarballをDocker内にグローバルインストールし、環境変数参照によるオンボーディングでOpenAIを設定し、デフォルトでTelegramも設定した後、doctorを実行し、モック化されたOpenAIエージェントのターンを1回実行します。事前ビルド済みtarballを再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホストでの再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`、チャンネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使用します。

- リリースユーザージャーニースモーク: `pnpm test:docker:release-user-journey` は、パッケージ化された OpenClaw tarball をクリーンな Docker ホームにグローバルインストールし、オンボーディングを実行し、モックされた OpenAI プロバイダーを設定し、エージェントターンを実行し、外部 Plugin をインストール/アンインストールし、ローカルフィクスチャに対して ClickClack を設定し、送信/受信メッセージングを検証し、Gateway を再起動して doctor を実行します。
- リリース型付きオンボーディングスモーク: `pnpm test:docker:release-typed-onboarding` は、パッケージ化された tarball をインストールし、実際の TTY を介して `openclaw onboard` を操作し、OpenAI を env-ref プロバイダーとして設定し、生のキーが永続化されないことを検証し、モックされたエージェントターンを実行します。
- リリースメディア/メモリスモーク: `pnpm test:docker:release-media-memory` は、パッケージ化された tarball をインストールし、PNG 添付ファイルからの画像理解、OpenAI 互換の画像生成出力、メモリ検索による想起、および Gateway の再起動後も想起が維持されることを検証します。
- リリースアップグレードユーザージャーニースモーク: `pnpm test:docker:release-upgrade-user-journey` は、デフォルトで候補 tarball より古い公開済みベースラインのうち最新のものをインストールし、公開済みパッケージ上でプロバイダー/Plugin/ClickClack の状態を設定し、候補 tarball にアップグレードしてから、コアのエージェント/Plugin/チャネルジャーニーを再実行します。古い公開済みベースラインが存在しない場合は、候補バージョンを再利用します。`OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` でベースラインを上書きします。
- リリース Plugin マーケットプレイススモーク: `pnpm test:docker:release-plugin-marketplace` は、ローカルフィクスチャマーケットプレイスからインストールし、インストール済み Plugin を更新してアンインストールし、インストールメタデータが削除されるとともに Plugin CLI が消えることを検証します。
- Skill インストールスモーク: `pnpm test:docker:skill-install` は、パッケージ化された OpenClaw tarball を Docker にグローバルインストールし、設定でアップロード済みアーカイブのインストールを無効化し、検索から現在のライブ ClawHub Skill スラッグを解決し、`openclaw skills install` でインストールして、インストール済み Skill と `.clawhub` の配布元/ロックメタデータを検証します。
- 更新チャネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パッケージ化された OpenClaw tarball を Docker にグローバルインストールし、パッケージの `stable` から git の `dev` に切り替え、永続化されたチャネルと更新後の Plugin の動作を検証してから、パッケージの `stable` に戻し、更新ステータスを確認します。
- アップグレードサバイバースモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャネル設定、Plugin 許可リスト、古い Plugin 依存関係の状態、および既存のワークスペース/セッションファイルを含む、変更のある旧ユーザーフィクスチャにパッケージ化された OpenClaw tarball を上書きインストールします。ライブプロバイダーやチャネルキーなしでパッケージ更新と非対話型 doctor を実行し、その後 local loopback Gateway を起動して、設定/状態の保持と起動/ステータスの時間予算を確認します。
- 公開済みアップグレードサバイバースモーク: `pnpm test:docker:published-upgrade-survivor` は、デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルを投入し、組み込みのコマンドレシピでそのベースラインを設定し、生成された設定を検証し、その公開済みインストールを候補 tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込んでから、local loopback Gateway を起動し、設定済みインテント、状態の保持、起動、`/healthz`、`/readyz`、および RPC ステータスの時間予算を確認します。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一のベースラインを上書きし、`openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のように `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` を指定して集約スケジューラーに正確なローカルベースラインを展開させ、`reported-issues` のように `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を指定して課題形式のフィクスチャを展開します。reported-issues セットには、外部 OpenClaw Plugin の自動インストール修復用の `configured-plugin-installs` が含まれます。Package Acceptance では、これらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` などのメタベースライントークンを解決します。また、Full Release Validation はリリースソークパッケージゲートを `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、非表示のランタイムコンテキストトランスクリプトの永続化と、影響を受ける重複したプロンプト書き換え分岐に対する doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在のツリーをパッケージ化し、隔離されたホームで `bun install -g` を使用してインストールし、`openclaw infer image providers --json` がハングせずに同梱の画像プロバイダーを返すことを検証します。`OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で事前ビルド済み tarball を再利用し、`OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` でホストビルドをスキップするか、`OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` でビルド済み Docker イメージから `dist/` をコピーします。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、更新、direct-npm の各コンテナ間で 1 つの npm キャッシュを共有します。更新スモークでは、候補 tarball にアップグレードする前の安定版ベースラインとして、デフォルトで npm の `latest` を使用します。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きします。非 root インストーラーの確認では、root が所有するキャッシュエントリによってユーザーローカルのインストール動作が隠されないように、隔離された npm キャッシュを維持します。ローカルでの再実行時に root/更新/direct-npm のキャッシュを再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は、`OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` によって重複する direct-npm グローバル更新をスキップします。直接の `npm install -g` のカバレッジが必要な場合は、その環境変数なしでスクリプトをローカル実行します。
- エージェント共有ワークスペース削除 CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace`（スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`）は、デフォルトでルートの Dockerfile イメージをビルドし、隔離されたコンテナホームに 1 つのワークスペースを共有する 2 つのエージェントを投入し、`agents delete --json` を実行して、有効な JSON とワークスペースが保持される動作を検証します。`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` で install-smoke イメージを再利用します。
- Gateway ネットワーキングとホストライフサイクル: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）は、2 コンテナ LAN WebSocket 認証/ヘルススモークを維持し、その後 local loopback の Admin HTTP を使用して、prepare フェンシング、保持された制御アクセス、resume リカバリー、および準備済みの同一コンテナでの停止/起動を実証します。再起動確認は元のリースが期限切れになる前に完了する必要があり、永続化された Gateway 設定とコンテナ ID が維持される一方で、一時停止状態がプロセスローカルであることを検証し、機械可読なフェーズタイミング JSON を出力します。
- ブラウザー CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot`（スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`）は、ソース E2E イメージと Chromium レイヤーをビルドし、生の CDP で Chromium を起動し、`browser doctor --deep` を実行して、CDP ロールスナップショットがリンク URL、カーソルによってクリック可能と判定された要素、iframe 参照、およびフレームメタデータを網羅することを検証します。
- OpenAI Responses の web_search 最小推論リグレッション: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、Gateway 経由でモックされた OpenAI サーバーを実行し、`web_search` によって `reasoning.effort` が `minimal` から `low` に引き上げられることを検証してから、プロバイダースキーマを強制的に拒否させ、生の詳細が Gateway ログに現れることを確認します。
- MCP チャネルブリッジ（初期データ投入済み Gateway + stdio ブリッジ + 生の Claude 通知フレームスモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw バンドル MCP ツール（実際の stdio MCP サーバー + 組み込み OpenClaw プロファイルの許可/拒否スモーク）: `pnpm test:docker:agent-bundle-mcp-tools`（スクリプト: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- Cron/サブエージェント MCP クリーンアップ（隔離された Cron および単発サブエージェント実行後の実際の Gateway + stdio MCP 子プロセス終了処理）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugin（ローカルパス、`file:`、巻き上げられた依存関係を持つ npm レジストリ、不正な npm パッケージメタデータ、移動する git ref、ClawHub kitchen-sink、マーケットプレイス更新、および Claude バンドルの有効化/検査に対するインストール/更新スモーク）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトの kitchen-sink パッケージ/ランタイムの組み合わせを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を設定します。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは自己完結型のローカル ClawHub フィクスチャサーバーを使用します。
- Plugin 更新変更なしスモーク: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin ライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、最小構成のコンテナにパッケージ化された OpenClaw tarball をインストールし、npm Plugin をインストールして有効化/無効化を切り替え、ローカル npm レジストリを介してアップグレードおよびダウングレードし、インストール済みコードを削除してから、各ライフサイクルフェーズの RSS/CPU メトリクスを記録しつつ、アンインストールによって古い状態が引き続き削除されることを検証します。
- 設定再読み込みメタデータスモーク: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- Plugin: `pnpm test:docker:plugins` は、ローカルパス、`file:`、巻き上げられた依存関係を持つ npm レジストリ、移動する git ref、ClawHub フィクスチャ、マーケットプレイス更新、および Claude バンドルの有効化/検査に対するインストール/更新スモークを網羅します。`pnpm test:docker:plugin-update` は、インストール済み Plugin の変更なし更新動作を網羅します。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡付きの npm Plugin のインストール、有効化、無効化、アップグレード、ダウングレード、およびコード欠損時のアンインストールを網羅します。

共有機能イメージを手動で事前ビルドして再利用するには、次を実行します。

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` などのスイート固有のイメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモートの共有イメージを指している場合、ローカルにまだ存在しなければスクリプトがそれを pull します。QR とインストーラーの Docker テストは、共有のビルド済みアプリランタイムではなくパッケージ/インストール動作を検証するため、独自の Dockerfile を引き続き使用します。

ライブモデルの Docker ランナーも、現在のチェックアウトを読み取り専用でバインドマウントし、
コンテナ内の一時作業ディレクトリにステージングします。これにより、正確なローカルの
ソース/設定に対して Vitest を実行しながら、ランタイムイメージを軽量に保ちます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、および
アプリローカルの `.build` や Gradle 出力ディレクトリなど、大容量のローカル専用キャッシュとアプリビルド
出力をスキップするため、Docker ライブ実行でマシン固有のアーティファクトのコピーに
数分を費やすことがありません。また、`OPENCLAW_SKIP_CHANNELS=1` を設定するため、Gateway のライブプローブはコンテナ内で実際の
Telegram/Discord などのチャネルワーカーを起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンから Gateway の
ライブカバレッジを絞り込む、または除外する必要がある場合は、`OPENCLAW_LIVE_GATEWAY_*` も
引き渡してください。

`test:docker:openwebui` は、より高レベルな互換性スモークテストです。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw Gateway コンテナを起動し、その Gateway に接続するバージョン固定の Open WebUI コンテナを
起動して、Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを確認した後、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。ライブモデルの
補完を待たず、Open WebUI へのサインインとモデル検出後に終了すべきリリース経路の CI チェックでは、
`OPENWEBUI_SMOKE_MODE=models` を設定します。初回実行では、Docker が Open WebUI イメージを
プルする必要があり、Open WebUI 自体のコールドスタート設定が完了するまで待つ場合があるため、
明らかに時間がかかることがあります。このレーンでは、プロセス環境、ステージ済みの認証プロファイル、または明示的な
`OPENCLAW_PROFILE_FILE` を通じて提供される、使用可能なライブモデルキーが必要です。正常に完了すると、
`{ "ok": true, "model": "openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。

`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、iMessage アカウントは不要です。シード済みの Gateway
コンテナを起動し、`openclaw mcp serve` を生成する 2 つ目のコンテナを起動してから、
ルーティングされた会話の検出、トランスクリプトの読み取り、添付ファイルの
メタデータ、ライブイベントキューの動作、送信ルーティング、および実際の stdio MCP ブリッジを介した Claude 形式の
チャンネル通知と権限通知を検証します。通知チェックでは生の stdio MCP フレームを直接検査するため、
特定のクライアント SDK がたまたま公開する内容だけでなく、ブリッジが実際に出力する内容を
スモークテストで検証できます。

`test:docker:agent-bundle-mcp-tools` は決定的であり、
ライブモデルキーは不要です。リポジトリの Docker イメージをビルドし、コンテナ内で実際の stdio MCP
プローブサーバーを起動し、そのサーバーを組み込みの OpenClaw バンドル MCP ランタイム経由で
実体化してツールを実行した後、`coding` と `messaging` では `bundle-mcp` ツールが維持され、
`minimal` と `tools.deny: ["bundle-mcp"]` ではそれらが除外されることを検証します。

`test:docker:cron-mcp-cleanup` は決定的であり、ライブ
モデルキーは不要です。実際の stdio MCP プローブサーバーを備えたシード済み Gateway を起動し、
分離された Cron ターンと `sessions_spawn` の単発子ターンを実行した後、
各実行後に MCP 子プロセスが終了することを検証します。

手動の ACP 自然言語スレッドスモークテスト（CI ではありません）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッションおよびデバッグのワークフロー用に残してください。ACP スレッドルーティングの検証で再び必要になる可能性があるため、削除しないでください。

便利な環境変数：

- `OPENCLAW_CONFIG_DIR=...`（デフォルト：`~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト：`~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...` はテスト実行前にマウントされ、読み込まれます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な設定およびワークスペースディレクトリを使用し、外部 CLI 認証をマウントせずに、`OPENCLAW_PROFILE_FILE` から読み込まれた環境変数のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト：実行ですでに CI/管理対象のバインドディレクトリを使用している場合を除き、`~/.cache/openclaw/docker-cli-tools`）は、Docker 内でキャッシュされた CLI インストールに使用するため `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリおよびファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` へコピーされます
  - デフォルトのディレクトリ（実行対象を特定のプロバイダーに限定していない場合に使用）：`.factory`、`.gemini`、`.minimax`
  - デフォルトのファイル：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - プロバイダーを限定した実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定される必要なディレクトリおよびファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストを使用して手動で上書きできます
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` で実行対象を限定します
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` でコンテナ内のプロバイダーを絞り込みます
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報が環境変数ではなくプロファイルストアから取得されることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI スモークテスト用に Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI スモークテストで使用する nonce チェック用プロンプトを上書きします
- `OPENWEBUI_IMAGE=...` は、バージョン固定された Open WebUI イメージタグを上書きします

## ドキュメントの健全性チェック

ドキュメントを編集した後は、ドキュメントチェックを実行します：`pnpm check:docs`。
ページ内見出しのチェックも必要な場合は、Mintlify の完全なアンカー検証を実行します：`pnpm docs:check-links:anchors`。

## オフラインリグレッション（CI 対応）

以下は、実際のプロバイダーを使用しない「実パイプライン」のリグレッションです：

- Gateway のツール呼び出し（モック OpenAI、実際の Gateway + エージェントループ）：`src/gateway/gateway.test.ts`（ケース：「Gateway エージェントループ経由でモック OpenAI ツール呼び出しをエンドツーエンドで実行する」）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定を書き込み + 認証を適用）：`src/gateway/gateway.test.ts`（ケース：「WS 経由でウィザードを実行し、認証トークン設定を書き込む」）

## エージェント信頼性評価（Skills）

「エージェント信頼性評価」のように動作する CI 対応テストは、すでにいくつかあります：

- 実際の Gateway + エージェントループを介したモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッションの接続と設定への効果を検証する、エンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）：

- **判断：** Skills がプロンプトに列挙されている場合、エージェントは適切な Skill を選択するか（または無関係なものを避けるか）？
- **準拠：** エージェントは使用前に `SKILL.md` を読み、必須の手順および引数に従うか？
- **ワークフロー契約：** ツールの順序、セッション履歴の引き継ぎ、サンドボックス境界を検証するマルチターンシナリオ。

今後の評価では、まず決定性を維持する必要があります：

- モックプロバイダーを使用して、ツール呼び出しとその順序、Skill ファイルの読み取り、セッションの接続を検証するシナリオランナー。
- Skill に焦点を当てた小規模なシナリオスイート（使用するか避けるか、ゲーティング、プロンプトインジェクション）。
- CI 対応スイートの整備後にのみ、任意のライブ評価（オプトイン、環境変数で制御）。

## 契約テスト（Plugin およびチャンネルの形式）

契約テストは、登録されたすべての Plugin とチャンネルが
そのインターフェース契約に準拠していることを検証します。検出されたすべての Plugin を反復処理し、
形式と動作に関する一連のアサーションを実行します。デフォルトの `pnpm test` ユニットレーンでは、
これらの共有シームおよびスモークファイルを意図的にスキップします。共有チャンネルまたはプロバイダーのサーフェスに
変更を加えた場合は、契約コマンドを明示的に実行してください。

### コマンド

- すべての契約：`pnpm test:contracts`
- チャンネル契約のみ：`pnpm test:contracts:channels`
- プロバイダー契約のみ：`pnpm test:contracts:plugins`

### チャンネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります。現在の
最上位カテゴリ：

- **channel-catalog** - バンドル済み/レジストリのチャンネルカタログエントリのメタデータ
- **plugin**（レジストリベース、シャード化）- 基本的な Plugin 登録形式
- **surfaces-only**（レジストリベース、シャード化）- `actions`、`setup`、`status`、`outbound`、`messaging`、`threading`、`directory`、`gateway` のサーフェスごとの形式チェック
- **session-binding**（レジストリベース）- セッションバインディングの動作
- **outbound-payload** - メッセージペイロードの構造と正規化
- **group-policy**（フォールバック）- チャンネルごとのデフォルトグループポリシーの適用
- **threading**（レジストリベース、シャード化）- スレッド ID の処理
- **directory**（レジストリベース、シャード化）- ディレクトリ/ロスター API
- **registry** および **plugins-core.\*** - チャンネル Plugin レジストリ、ローダー、設定書き込み認可の内部実装

これらのスイートで使用される受信ディスパッチキャプチャおよび送信ペイロードのハーネスヘルパーは、
`src/plugin-sdk/channel-contract-testing.ts` を通じて内部公開されています
（npm から除外されており、公開 SDK サブパスではありません）。このディレクトリには独立した
`inbound.contract.test.ts` ファイルはありません。

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります。現在のカテゴリには
以下が含まれます：

- **shape** - Plugin マニフェスト、API、ランタイムエクスポートの形式
- **plugin-registration**（+ 並列）- マニフェスト登録のケース
- **package-manifest** - パッケージマニフェストの要件
- **loader** - Plugin ローダーのセットアップ/ティアダウン動作
- **registry** - Plugin 契約レジストリの内容と検索
- **providers** - バンドル済みプロバイダー間で共通するプロバイダー動作、およびウェブ検索プロバイダー
- **auth-choice** - 認証選択肢のメタデータとセットアップ動作
- **provider-catalog-deprecation** - 非推奨のプロバイダーカタログメタデータ
- **wizard.choice-resolution**、**wizard.model-picker**、**wizard.setup-options** - プロバイダーセットアップウィザードの契約
- **embedding-provider**、**memory-embedding-provider**、**web-fetch-provider**、**tts** - 機能固有のプロバイダー契約
- **session-actions**、**session-attachments**、**session-entry-projection** - Plugin が所有するセッション状態の契約
- **scheduled-turns** - Plugin のスケジュール済みターンのメタデータとタイムスタンプ境界
- **host-hooks**、**run-context-lifecycle**、**runtime-import-side-effects**、**runtime-seams** - Plugin ホスト/ランタイムのライフサイクルおよびインポート境界の契約
- **extension-runtime-dependencies** - 拡張機能のランタイム依存関係の配置

### 実行するタイミング

- plugin-sdk のエクスポートまたはサブパスを変更した後
- チャンネルまたはプロバイダーの Plugin を追加または変更した後
- Plugin の登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## リグレッションの追加（ガイダンス）

ライブ環境で発見されたプロバイダー/モデルの問題を修正する場合：

- 可能であれば、CI 対応のリグレッションを追加します（モック/スタブプロバイダー、または正確なリクエスト形式の変換をキャプチャ）
- 本質的にライブでしか検証できない場合（レート制限、認証ポリシー）は、ライブテストを限定的にし、環境変数によるオプトイン形式にします
- バグを検出できる最小のレイヤーを対象にすることを優先します：
  - プロバイダーのリクエスト変換/リプレイのバグ -> 直接モデルテスト
  - Gateway のセッション/履歴/ツールパイプラインのバグ -> Gateway のライブスモークテストまたは CI 対応の Gateway モックテスト
- SecretRef トラバーサルのガードレール：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとに 1 つのサンプル対象を導出し、トラバーサルセグメントを含む exec ID が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef 対象ファミリーを追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは、分類されていない対象 ID に対して意図的に失敗するため、新しいクラスが暗黙にスキップされることはありません。

## 関連項目

- [ライブテスト](/ja-JP/help/testing-live)
- [アップデートと Plugin のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
