---
read_when:
    - ローカルまたはCIでテストを実行する
    - モデル／プロバイダーのバグに対する回帰テストの追加
    - Gateway とエージェントの動作のデバッグ
summary: テストキット：ユニット／E2E／ライブスイート、Docker ランナー、および各テストの対象範囲
title: テスト
x-i18n:
    generated_at: "2026-07-11T22:18:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（単体/統合、e2e、ライブ）と Docker
ランナーがあります。このページでは、各スイートの対象範囲、ワークフローごとに
実行するコマンド、ライブテストが認証情報を検出する方法、および実際の
プロバイダー/モデルのバグに対する回帰テストの追加方法について説明します。

<Note>
**QA スタック（qa-lab、qa-channel、ライブトランスポートレーン）**については、別途説明しています。

- [QA の概要](/ja-JP/concepts/qa-e2e-automation) - アーキテクチャ、コマンドサーフェス、シナリオの作成。
- [マトリックス QA](/ja-JP/concepts/qa-matrix) - `pnpm openclaw qa matrix` のリファレンス。
- [成熟度スコアカード](/ja-JP/maturity/scorecard) - リリース QA のエビデンスが安定性と LTS の判断をどのように支えるか。
- [QA チャネル](/ja-JP/channels/qa-channel) - リポジトリベースのシナリオで使用される合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーについて説明します。以下の [QA 専用ランナー](#qa-specific-runners)には、具体的な `qa` の呼び出し方法と上記リファレンスへの参照を記載しています。
</Note>

## クイックスタート

通常は次のとおりです。

- フルゲート（プッシュ前の実行を想定）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- リソースに余裕のあるマシンで、ローカルの全スイートをより速く実行：`pnpm test:max`
- Vitest の監視ループを直接実行：`pnpm test:watch`
- ファイルを直接指定すると、Plugin/チャネルのパスにもルーティングされます：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 1 件の失敗を反復修正する場合は、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト：`pnpm qa:lab:up`
- Linux VM ベースの QA レーン：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストを変更した場合や、さらに確信を得たい場合：

- 参考用の V8 カバレッジレポート：`pnpm test:coverage`
- E2E スイート：`pnpm test:e2e`

## テスト用一時ディレクトリ

テストが所有する一時ディレクトリには、`test/helpers/temp-dir.ts` の共有ヘルパーを
使用してください。これにより所有権が明確になり、クリーンアップがテストの
ライフサイクル内で行われます。

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` は意図的に手動のクリーンアップメソッドを
公開していません。各テスト後のクリーンアップは Vitest が所有します。移行が
完了していないテスト向けに、以前の低レベルヘルパー（`makeTempDir`、
`cleanupTempDirs`、`createTempDirTracker`）も引き続き存在しますが、新たに
使用することは避けてください。また、テストが一時ディレクトリの生の挙動を
明示的に検証する場合を除き、`fs.mkdtemp*` を直接呼び出すコードも新たに
追加しないでください。直接作成する一時ディレクトリが本当に必要な場合は、
理由を添えた監査可能な許可コメントを追加してください。

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` は、追加された差分行における
一時ディレクトリの新たな直接作成と、共有ヘルパーの新たな手動使用を
報告しますが、既存のクリーンアップ形式はブロックしません。このスクリプトは
`scripts/changed-lanes.mjs` と同じテストパス分類に従い、共有ヘルパー自体の
実装はスキップします。`check:changed` は、変更されたテストパスに対して
このレポートを警告専用の CI シグナル（失敗ではなく GitHub の警告注釈）
として実行します。

## ライブおよび Docker/Parallels ワークフロー

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）：

- ライブスイート（モデル + Gateway のツール/画像プローブ）：`pnpm test:live`
- 1 つのライブファイルを静かに対象指定：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイムパフォーマンスレポート：実際の `openai/gpt-5.6-luna` エージェントターンには
  `live_openai_candidate=true` を指定して `OpenClaw Performance` をディスパッチし、
  Kova の CPU/ヒープ/トレースアーティファクトには `deep_profile=true` を指定します。
  毎日のスケジュール実行では、モックプロバイダー、詳細プロファイル、GPT-5.6 Luna
  レーンのレポートを、別のアーティファクト消費型パブリッシャージョブから
  `openclaw/clawgrit-reports` に公開します。パブリッシャー認証が存在しないか無効な場合、
  スケジュール実行と `profile=release` の実行は失敗します。リリース以外の手動
  ディスパッチでは GitHub アーティファクトを保持し、レポートの公開は参考扱いとします。
  モックプロバイダーレポートには、ソースレベルの Gateway 起動、メモリ、Plugin 負荷、
  偽モデルによる反復 hello ループ、CLI 起動の数値も含まれます。
- Docker ライブモデル一括テスト：`pnpm test:docker:live-models`
  - 選択された各モデルでは、テキストターンに加えて、小規模なファイル読み取り形式の
    プローブを実行します。メタデータで `image` 入力をサポートすると示されているモデルでは、
    小さな画像ターンも実行します。プロバイダーの失敗を切り分ける場合は、
    `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効にできます。
  - CI カバレッジ：毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` は、どちらも `include_live_suites: true` を指定して
    再利用可能なライブ/E2E ワークフローを呼び出します。これには、プロバイダーごとに
    シャーディングされた Docker ライブモデルのマトリックスジョブが含まれます。
  - 対象を絞った CI の再実行では、`include_live_suites: true` と
    `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)`
    をディスパッチしてください。
  - シグナル価値の高い新しいプロバイダーシークレットを
    `scripts/ci-hydrate-live-auth.sh`、および
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` とその
    スケジュール/リリース呼び出し元に追加してください。
- ネイティブ Codex バインドチャットのスモークテスト：`pnpm test:docker:live-codex-bind`
  - Codex app-server パスを対象に Docker ライブレーンを実行し、合成 Slack DM を
    `/codex bind` でバインドし、`/codex fast` と `/codex permissions` を実行した後、
    通常の返信と画像添付が ACP ではなくネイティブ Plugin バインディングを経由することを
    検証します。
- Codex app-server ハーネスのスモークテスト：`pnpm test:docker:live-codex-harness`
  - Plugin が所有する Codex app-server ハーネスを介して Gateway エージェントターンを実行し、
    `/codex status` と `/codex models` を検証します。また、デフォルトでは画像、cron MCP、
    サブエージェント、Guardian の各プローブを実行します。他の失敗を切り分ける場合は、
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` でサブエージェントプローブを
    無効にできます。サブエージェントだけを対象に確認するには、他のプローブを無効にします。
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、
    サブエージェントプローブの後に終了します。
- Codex オンデマンドインストールのスモークテスト：`pnpm test:docker:codex-on-demand`
  - パッケージ化された OpenClaw tarball を Docker にインストールし、OpenAI API キーによる
    オンボーディングを実行して、Codex Plugin と `@openai/codex` 依存関係が必要に応じて
    管理対象の npm プロジェクトルートにダウンロードされたことを検証します。
- ライブ Plugin ツール依存関係のスモークテスト：`pnpm test:docker:live-plugin-tool`
  - 実際の `slugify` 依存関係を持つフィクスチャ Plugin をパックし、`npm-pack:` 経由で
    インストールして、管理対象の npm プロジェクトルート配下に依存関係があることを検証します。
    その後、ライブ OpenAI モデルに Plugin ツールを呼び出して非表示のスラッグを返すよう
    要求します。
- Crestodian レスキューコマンドのスモークテスト：`pnpm test:live:crestodian-rescue-channel`
  - メッセージチャネルのレスキューコマンドサーフェスに対する、オプトインの念押し確認です。
    `/crestodian status` を実行し、永続的なモデル変更をキューに入れ、
    `/crestodian yes` と返信して、監査/設定の書き込みパスを検証します。
- Crestodian 初回実行 Docker スモークテスト：`pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw 状態ディレクトリから開始し、まず、パッケージ化された
    `openclaw crestodian` CLI が推論なしでは安全側に失敗することを証明します。
    続いて、パッケージ化されたアクティベーションモジュールを通じて偽の Claude を
    テストし、有効化します。その後に限り、曖昧なパッケージ済み CLI リクエストが
    プランナーに到達して型付きセットアップとして解決され、続けてモデル、エージェント、
    Discord Plugin、SecretRef の各操作が 1 回ずつ実行されます。設定と監査エントリを
    検証します。これは補助的なゲート/操作のエビデンスであり、対話型オンボーディングや
    Crestodian エージェント/ツール/承認の証明ではありません。同じレーンは QA Lab でも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` により公開されています。
- Moonshot/Kimi コストのスモークテスト：`MOONSHOT_API_KEY` を設定した状態で
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して、分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSON が Moonshot/K2.6 を報告し、アシスタントのトランスクリプトに
  正規化された `usage.cost` が保存されていることを確認してください。

<Tip>
失敗ケースを 1 件だけ確認する必要がある場合は、以下で説明する許可リスト用環境変数を使用して、ライブテストの対象を絞ることを優先してください。
</Tip>

## QA 専用ランナー

QA Lab 相当の現実性が必要な場合、これらのコマンドをメインのテストスイートと
併用します。

CI は専用ワークフローで QA Lab を実行します。エージェント型パリティは、
単独の PR ワークフローではなく、`QA-Lab - All Lanes` とリリース検証に
組み込まれています。広範な検証では、`rerun_group=qa-parity` を指定した
`Full Release Validation` またはリリースチェックの QA グループを使用してください。
stable/default のリリースチェックでは、`run_release_soak=true` が指定されている場合に限り、
網羅的なライブ/Docker の長時間テストを実行します。`full` プロファイルでは長時間テストが
強制的に有効になります。`QA-Lab - All Lanes` は `main` で毎晩実行され、手動
ディスパッチからも実行できます。モックパリティレーン、ライブ Matrix レーン、
Convex 管理のライブ Telegram レーン、Convex 管理のライブ Discord レーンが
並列ジョブとして実行されます。スケジュール QA とリリースチェックでは Matrix に
`--profile fast` を明示的に渡しますが、Matrix CLI と手動ワークフロー入力のデフォルトは
引き続き `all` です。手動ディスパッチでは、`all` を `transport`、`media`、
`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` の各ジョブにシャーディングできます。
`OpenClaw Release Checks` はリリース承認前に、パリティに加えて高速 Matrix レーンと
Telegram レーンを実行します。リリースのトランスポートチェックでは
`mock-openai/gpt-5.6-luna` を使用するため、決定論的な状態を保ち、通常の
プロバイダー Plugin の起動を回避できます。これらのライブトランスポート Gateway では
メモリ検索を無効にしています。メモリの挙動は引き続き QA パリティスイートで
カバーされます。

フルリリースのライブメディアシャードでは、`ffmpeg` と `ffprobe` があらかじめ
含まれている `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。
Docker ライブモデル/バックエンドシャードでは、選択されたコミットごとに一度だけ
ビルドされる共有イメージ `ghcr.io/openclaw/openclaw-live-test:<sha>` を使用し、
各シャード内で再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` を指定して
プルします。

- `pnpm openclaw qa suite`
  - リポジトリに基づく QA シナリオをホスト上で直接実行します。
  - 選択したシナリオセットについて、最上位の `qa-evidence.json`、`qa-suite-summary.json`、
    `qa-suite-report.md` アーティファクトを書き出します。これには、混合フロー、Vitest、
    Playwright のシナリオ選択が含まれます。
  - `pnpm openclaw qa run --qa-profile <profile>` から起動された場合、選択した分類プロファイルの
    スコアカードを同じ `qa-evidence.json` に埋め込みます。`smoke-ci` は簡略化されたエビデンス
    （`evidenceMode: "slim"`、エントリごとの `execution` なし）を書き出します。`release` は厳選された
    リリース準備状況の範囲を対象とし、`all` はアクティブな成熟度カテゴリをすべて選択します。
    完全なスコアカードアーティファクトが必要な場合は、明示的な QA Profile Evidence ワークフローの
    ディスパッチを対象とします。
  - デフォルトでは、分離された Gateway ワーカーを使用して、選択した複数のシナリオを並列実行します。
    `qa-channel` のデフォルトの並行数は 4 です（選択したシナリオ数が上限）。ワーカー数を調整するには
    `--concurrency <count>` を、従来の直列レーンを使用するには `--concurrency 1` を指定します。
  - いずれかのシナリオが失敗すると、0 以外の終了コードで終了します。失敗終了コードを返さずに
    アーティファクトを生成するには、`--allow-failures` を使用します。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` は、
    シナリオ対応の `mock-openai` レーンを置き換えることなく、実験的なフィクスチャとプロトコルモックを
    網羅するために、ローカルの AIMock ベースのプロバイダーサーバーを起動します。
- `pnpm openclaw qa coverage --match <query>`
  - シナリオ ID、タイトル、対象領域、カバレッジ ID、ドキュメント参照、コード参照、Plugin、
    プロバイダー要件を検索し、一致するスイートターゲットを出力します。
  - 変更対象の動作やファイルパスは分かっていても、最小のシナリオが分からない場合は、QA Lab の実行前に
    これを使用します。これは参考情報にすぎません。変更する動作に応じて、モック、ライブ、Multipass、
    Matrix、またはトランスポートの検証を引き続き選択してください。
- `pnpm test:plugins:kitchen-sink-live`
  - QA Lab を通じて、ライブの OpenAI Kitchen Sink Plugin 総合テストを実行します。外部の Kitchen Sink
    パッケージをインストールし、Plugin SDK の対象領域インベントリを検証し、`/healthz` と `/readyz` を
    プローブし、Gateway の CPU/RSS エビデンスを記録し、ライブの OpenAI ターンを実行して、敵対的な
    診断を確認します。`OPENAI_API_KEY` などのライブ OpenAI 認証が必要です。環境が準備済みの Testbox
    セッションでは、`openclaw-testbox-env` ヘルパーが存在すると、Testbox のライブ認証プロファイルを
    自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチに加えて、小規模なモック QA Lab シナリオパック
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`）を実行し、統合された CPU 観測サマリーを
    `.artifacts/gateway-cpu-scenarios/` 配下に書き出します。
  - デフォルトでは、持続する高 CPU 観測のみを警告対象とします（`--cpu-core-warn` のデフォルトは
    `0.9`、`--hot-wall-warn-ms` のデフォルトは `30000`）。そのため、起動時の短いバーストは、
    数分間続く Gateway の CPU 張り付きリグレッションのように見せることなく、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトに対して実行されます。チェックアウトに新しいランタイム出力が
    まだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 破棄可能な Multipass Linux VM 内で同じ QA スイートを実行し、`qa suite` と同じシナリオ選択、
    プロバイダー、モデルの各フラグを維持します。
  - ライブ実行では、ゲストで利用可能な QA 認証入力を転送します。これには、環境変数ベースの
    プロバイダーキー、QA ライブプロバイダー設定パス、存在する場合の `CODEX_HOME` が含まれます。
  - ゲストがマウントされたワークスペース経由で書き戻せるように、出力ディレクトリはリポジトリルート配下に
    置く必要があります。
  - 通常の QA レポートとサマリーに加え、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き出します。
- `pnpm qa:lab:up`
  - 運用者向けの QA 作業用に、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内にグローバルインストールします。
    続いて、非対話型の OpenAI API キーによるオンボーディングを実行し、デフォルトで Telegram を設定し、
    パッケージ化された Plugin ランタイムが起動時の依存関係修復なしで読み込まれることを検証し、
    doctor を実行して、モック化された OpenAI エンドポイントに対してローカルエージェントターンを 1 回実行します。
  - Discord で同じパッケージインストールレーンを実行するには、
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストのトランスクリプトについて、決定的なビルド済みアプリの Docker
    スモークテストを実行します。非表示の OpenClaw ランタイムコンテキストが、可視のユーザーターンに
    漏れることなく、非表示のカスタムメッセージとして保持されることを検証します。その後、影響を受ける
    壊れたセッション JSONL を投入し、`openclaw doctor --fix` がバックアップを作成したうえで、
    アクティブブランチに書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker に OpenClaw パッケージ候補をインストールし、インストール済みパッケージのオンボーディングを
    実行し、インストール済み CLI を通じて Telegram を設定します。その後、そのインストール済みパッケージを
    テスト対象システムの Gateway として使用し、ライブ Telegram QA レーンを再利用します。
  - ラッパーは、チェックアウトから `qa-lab` ハーネスのソースのみをマウントします。インストール済み
    パッケージが `dist`、`openclaw/plugin-sdk`、バンドル済み Plugin ランタイムを所有するため、
    このレーンでは現在のチェックアウトの Plugin がテスト対象パッケージに混在しません。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。レジストリから
    インストールする代わりに、解決済みのローカル tarball をテストするには、
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - デフォルトでは、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20` により、繰り返し測定した RTT
    タイミングを `qa-evidence.json` に出力します。実行を調整するには、
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` には、サンプリングする Telegram QA チェック ID を
    カンマ区切りで指定できます。未設定の場合、デフォルトの RTT 対応チェックは
    `telegram-mentioned-message-reply` です。
  - `pnpm openclaw qa telegram` と同じ Telegram 環境変数認証情報または Convex 認証情報ソースを
    使用します。CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加え、
    `OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定します。CI で
    `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットが存在する場合、Docker ラッパーは
    Convex を自動的に選択します。
  - ラッパーは、Docker のビルドやインストール作業の前に、ホスト上で Telegram または Convex の
    認証情報環境変数を検証します。認証情報設定前の処理を意図的にデバッグする場合に限り、
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定してください。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに限り、共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。Convex 認証情報が選択され、ロールが未設定の場合、
    ラッパーは CI 内では `ci`、CI 外では `maintainer` を使用します。
  - GitHub Actions では、このレーンを手動メンテナーワークフロー
    `NPM Telegram Beta E2E` として公開しています。マージ時には実行されません。このワークフローは
    `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- GitHub Actions では、単一の候補パッケージに対するサイド実行の製品検証用に
  `Package Acceptance` も公開しています。Git ref、公開済み npm 仕様、SHA-256 付きの HTTPS
  tarball URL、信頼済み URL ポリシー、または別の実行からの tarball アーティファクト
  （`source=ref|npm|url|trusted-url|artifact`）を受け付けます。正規化された
  `openclaw-current.tgz` を `package-under-test` としてアップロードし、既存の Docker E2E
  スケジューラーを `smoke`、`package`、`product`、`full`、`custom` の各レーンプロファイルで
  実行します。同じ `package-under-test` アーティファクトに対して Telegram QA ワークフローを
  実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新ベータ版の製品検証：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL の検証にはダイジェストが必要で、公開 URL の安全性ポリシーを使用します：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- エンタープライズ/プライベート tarball ミラーでは、明示的な信頼済みソースポリシーを使用します：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` は信頼済みワークフロー ref から `.github/package-trusted-sources.json` を読み込み、
URL の認証情報や、ワークフロー入力によるプライベートネットワークのバイパスは受け付けません。
指定されたポリシーで bearer 認証が宣言されている場合は、固定の
`OPENCLAW_TRUSTED_PACKAGE_TOKEN` シークレットを設定します。

- アーティファクト検証では、別の Actions 実行から tarball アーティファクトをダウンロードします：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw ビルドをパッケージ化して Docker にインストールし、OpenAI を設定した状態で
    Gateway を起動してから、設定編集によりバンドル済みのチャンネル/Plugin を有効化します。
  - セットアップ時の検出によって、未設定でダウンロード可能な Plugin が存在しない状態のままであること、
    最初の設定済み doctor 修復が不足している各ダウンロード可能 Plugin を明示的にインストールすること、
    2 回目の再起動では非表示の依存関係修復が実行されないことを検証します。
  - また、既知の古い npm ベースラインをインストールし、`openclaw update --tag <candidate>` の実行前に
    Telegram を有効化します。そして、候補版の更新後 doctor が、ハーネス側の postinstall 修復なしで
    レガシーな Plugin 依存関係の残骸をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージインストール更新スモークテストを実行します。
    選択した各プラットフォームでは、まず要求されたベースラインパッケージをインストールし、次に同じゲスト内で
    インストール済みの `openclaw update` コマンドを実行して、インストール済みバージョン、更新状態、
    Gateway の準備完了状態、ローカルエージェントターン 1 回を検証します。
  - 1 つのゲストについて反復作業を行う場合は、`--platform macos`、`--platform windows`、
    `--platform linux` を使用します。サマリーアーティファクトのパスとレーンごとの状態を取得するには、
    `--json` を使用します。
  - OpenAI レーンでは、デフォルトでライブエージェントターンの検証に `openai/gpt-5.6-luna` を使用します。
    別の OpenAI モデルを検証するには、`--model <provider/model>` を渡すか、
    `OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels の転送停止によって残りのテスト時間が消費されないように、長時間のローカル実行はホストの
    タイムアウトで囲んでください：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトは、ネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き出します。
    外側のラッパーが停止していると判断する前に、`windows-update.log`、`macos-update.log`、
    `linux-update.log` を確認してください。
  - コールド状態のゲストでは、Windows の更新後 doctor とパッケージ更新処理に 10〜15 分かかることがあります。
    ネストされた npm デバッグログが進行している限り、これは正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、Linux スモークレーンと並列に実行しないでください。
    これらは VM 状態を共有しており、スナップショット復元、パッケージ配信、ゲストの Gateway 状態で
    競合する可能性があります。
  - 更新後の検証では、通常のバンドル済み Plugin 対象領域を実行します。これは、音声、画像生成、
    メディア理解などの機能ファサードが、エージェントターン自体では単純なテキスト応答のみを確認する場合でも、
    バンドル済みランタイム API を通じて読み込まれるためです。

- `pnpm openclaw qa aimock`
  - プロトコルの直接スモークテスト用に、ローカルの AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベースの Tuwunel ホームサーバーに対して、Matrix ライブ QA レーンを実行します。ソースチェックアウト専用です。パッケージ版インストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル／シナリオカタログ、環境変数、アーティファクト構成:
    [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 環境変数のドライバー用ボットトークンと SUT ボットトークンを使用して、実際の非公開グループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、および
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の
    Telegram チャット ID である必要があります。
  - 共有プール認証情報には `--credential-source convex` を使用できます。
    デフォルトでは環境変数モードを使用するか、`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    を設定してプールされたリースを明示的に使用します。
  - デフォルトでは、カナリア、メンション制御、コマンドの宛先指定、`/status`、
    ボット間のメンション付き返信、およびコアのネイティブコマンド返信を対象とします。
    `mock-openai` のデフォルトでは、決定論的な返信チェーンと
    Telegram の最終メッセージストリーミングのリグレッションも対象とします。`session_status`
    などのオプションプローブには `--list-scenarios` を使用します。
  - いずれかのシナリオが失敗すると、ゼロ以外で終了します。失敗終了コードを返さずに
    アーティファクトを取得するには `--allow-failures` を使用します。
  - 同じ非公開グループ内に異なる 2 つのボットが必要であり、SUT ボットには
    Telegram ユーザー名が設定されている必要があります。
  - ボット間通信を安定して観測するには、両方のボットについて `@BotFather` で Bot-to-Bot Communication Mode
    を有効にし、ドライバーボットがグループ内のボット通信を観測できることを確認します。
  - Telegram QA レポート、サマリー、および `qa-evidence.json` を
    `.artifacts/qa-e2e/...` 以下に書き込みます。返信を行うシナリオには、ドライバーの送信要求から
    観測された SUT の返信までの RTT が含まれます。

`Mantis Telegram Live` は、このレーンを使用する PR 証跡ラッパーです。
候補 ref を Convex からリースした Telegram 認証情報で実行し、秘匿化された
QA レポート／証跡バンドルを Crabbox のデスクトップブラウザーでレンダリングし、MP4
証跡を録画し、動きのある部分のみにトリミングした GIF を生成し、アーティファクトバンドルをアップロードします。
さらに、`pr_number` が設定されている場合は、Mantis GitHub App を通じてインラインの PR 証跡を投稿します。
メンテナーは Actions UI の `Mantis Scenario`
（`scenario_id: telegram-live`）から、またはプルリクエストのコメントから直接起動できます。

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` は、PR の視覚的証跡を取得するために、
ネイティブ Telegram Desktop の変更前後をエージェントが操作するラッパーです。Actions UI で
自由形式の `instructions` を指定するか、`Mantis Scenario`（`scenario_id:
telegram-desktop-proof`）を使用するか、PR コメントから起動します。

```text
@openclaw-mantis telegram desktop proof
```

Mantis エージェントは PR を読み取り、変更を証明するために必要な Telegram 上で確認可能な動作を判断し、
ベースライン ref と候補 ref に対して、実ユーザーを使用する Crabbox Telegram Desktop 証跡レーンを実行します。
ネイティブ GIF が有用になるまで反復し、対になる `motionPreview` マニフェストを書き込み、
`pr_number` が設定されている場合は、同じ 2 列の GIF
テーブルを Mantis GitHub App を通じて投稿します。

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Crabbox Linux デスクトップをリースまたは再利用し、ネイティブ Telegram
    Desktop をインストールし、リースした Telegram SUT ボットトークンで OpenClaw を設定し、
    Gateway を起動して、表示中の VNC デスクトップからスクリーンショット／MP4 証跡を記録します。
  - デフォルトは `--credential-source convex` であるため、ワークフローに必要なのは
    Convex ブローカーのシークレットのみです。`pnpm openclaw qa telegram` と同じ
    `OPENCLAW_QA_TELEGRAM_*` 変数を使用する場合は `--credential-source env` を指定します。
  - Telegram Desktop では引き続きユーザーのログイン／プロファイルが必要です。ボットトークンで
    設定されるのは OpenClaw のみです。base64 の `.tgz` プロファイルアーカイブには
    `--telegram-profile-archive-env <name>` を使用するか、`--keep-lease` を使用して
    VNC 経由で一度手動ログインします。
  - `mantis-telegram-desktop-builder-report.md`、
    `mantis-telegram-desktop-builder-summary.json`、
    `telegram-desktop-builder.png`、および `telegram-desktop-builder.mp4`
    を出力ディレクトリ以下に書き込みます。

新しいトランスポート間で差異が生じないように、ライブトランスポートレーンは 1 つの標準契約を共有します。
レーンごとのカバレッジマトリクスは
[QA 概要 - ライブトランスポートのカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage)
にあります。
`qa-channel` は広範な合成テストスイートであり、このマトリクスには含まれません。

### Convex を介した共有 Telegram 認証情報（v1）

ライブトランスポート QA で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）
が有効な場合、QA ラボは Convex ベースのプールから排他的リースを取得し、レーンの実行中はそのリースに
Heartbeat を送信し、終了時にリースを解放します。このセクション名は Discord、Slack、および
WhatsApp のサポートより前から存在しますが、リース契約は種別間で共有されています。

参照用 Convex プロジェクトのスキャフォールド: `qa/convex-credential-broker/`

必須の環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用のシークレット 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数のデフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトが `ci`、それ以外では `maintainer`）

オプションの環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（オプションのトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` を指定すると、ローカル専用の開発で local loopback の `http://` Convex URL を使用できます。

通常の運用では、`OPENCLAW_QA_CONVEX_SITE_URL` に `https://` を使用する必要があります。

メンテナー管理コマンド（プールの追加／削除／一覧表示）には、
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が明示的に必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行前に `doctor` を使用すると、シークレット値を出力せずに Convex サイト URL、ブローカーシークレット、
エンドポイントプレフィックス、HTTP タイムアウト、管理／一覧表示への到達性を確認できます。
スクリプトおよび CI ユーティリティで機械可読な出力を得るには `--json` を使用します。

デフォルトのエンドポイント契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）。
リクエストは `Authorization: Bearer <role secret>` ヘッダーで認証します。
以下のボディではこのヘッダーを省略しています。

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇／再試行可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - アクティブリースの保護: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（メンテナーシークレットのみ）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram 種別のペイロード形式:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形式を検証し、不正なペイロードを拒否します。

Telegram 実ユーザー種別のペイロード形式:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`、`testerUserId`、および `telegramApiId` は数値文字列である必要があります。
- `tdlibArchiveSha256` および `desktopTdataArchiveSha256` は SHA-256 の 16 進文字列である必要があります。
- `kind: "telegram-user"` は Mantis Telegram Desktop 証跡ワークフロー専用に予約されています。汎用 QA ラボレーンはこれを取得してはなりません。

ブローカーで検証されるマルチチャンネルペイロード:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Slack レーンもプールからリースできますが、Slack ペイロードの検証は現在、
ブローカーではなく Slack QA ランナー内にあります。Slack の行には
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
を使用します。

### QA へのチャンネルの追加

新しいチャンネルアダプターのアーキテクチャとシナリオヘルパー名については、
[QA 概要 - チャンネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel)
を参照してください。
最低要件は、共有 `qa-lab` ホストシーム上にトランスポートランナーを実装し、
共有シナリオ用の `adapterFactory` を追加し、Plugin マニフェストで `qaRunners` を宣言し、
`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 以下にシナリオを作成することです。

## テストスイート（実行場所）

各スイートは「現実性が増す」ものとして捉えてください（同時に不安定さ／コストも増加します）。

### ユニット／統合（デフォルト）

- コマンド: `pnpm test`
- 設定: 対象を指定しない実行では `vitest.full-*.config.ts` シャードセットを使用し、
  並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定へ
  展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、および
  `test/**/*.test.ts` 以下のコア／ユニットインベントリ。UI ユニットテストは専用の
  `unit-ui` シャードで実行されます
- 対象範囲:
  - 純粋なユニットテスト
  - プロセス内統合テスト（Gateway 認証、ルーティング、ツール、解析、設定）
  - 既知のバグに対する決定論的リグレッションテスト
- 要件:
  - CI で実行されること
  - 実際のキーが不要であること
  - 高速かつ安定していること
  - リゾルバーおよび公開サーフェスのローダーテストでは、実際のバンドル済み Plugin ソース API ではなく、
    生成した小さな Plugin フィクスチャを使用して、`api.js` および
    `runtime-api.js` の広範なフォールバック動作を証明する必要があります。実際の Plugin API のロードは、
    Plugin 所有の契約／統合スイートで扱います。

ネイティブ依存関係のポリシー:

- デフォルトのテストインストールでは、オプションのネイティブ Discord opus ビルドをスキップします。Discord
  音声ではバンドル済みの `libopus-wasm` を使用し、ローカルテストおよび Testbox レーンでネイティブ
  アドオンをコンパイルしないよう、`@discordjs/opus` は `allowBuilds` で無効のままにします。
- ネイティブ opus のパフォーマンス比較は、デフォルトの OpenClaw インストール／テストループではなく、
  `libopus-wasm` ベンチマークリポジトリで行います。デフォルトの `allowBuilds` で `@discordjs/opus` を
  `true` に設定しないでください。設定すると、無関係なインストール／テストループでネイティブコードがコンパイルされます。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ指定レーン">

    - 対象を指定しない `pnpm test` は、1つの巨大なネイティブルートプロジェクトプロセスではなく、13個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-tooling`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、高負荷なマシンでのピークRSSを削減し、auto-reply/Pluginの処理によって無関係なスイートがリソース不足になるのを防ぎます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。複数シャードの監視ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリ対象をまずスコープ付きレーンに振り分けるため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ではルートプロジェクト全体の起動コストを負担せずに済みます。
    - `pnpm test:changed` はデフォルトで、変更されたgitパスを低コストなスコープ付きレーンへ展開します。対象には、テストの直接編集、同階層の `*.test.ts` ファイル、明示的なソースマッピング、ローカルインポートグラフ上の依存元が含まれます。設定、セットアップ、パッケージの編集では、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を明示的に使用しない限り、広範なテストは実行されません。
    - `pnpm check:changed` は、範囲の狭い作業に対する通常のスマートなローカルチェックゲートです。差分をコア、コアテスト、拡張機能、拡張機能テスト、アプリ、ドキュメント、リリースメタデータ、ライブDockerツール、ツール類に分類し、対応する型チェック、lint、ガードコマンドを実行します。Vitestテストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を実行してください。リリースメタデータのみのバージョン更新では、対象を絞ったバージョン/設定/ルート依存関係チェックを実行し、最上位のバージョンフィールド以外のパッケージ変更を拒否するガードが適用されます。
    - ライブDocker ACPハーネスの編集では、ライブDocker認証スクリプトのシェル構文チェックと、ライブDockerスケジューラのドライランという対象を絞ったチェックを実行します。`package.json` の変更が含まれるのは、差分が `scripts["test:docker:live-*"]` に限定される場合のみです。依存関係、エクスポート、バージョン、その他のパッケージ公開面の編集には、引き続き広範なガードが使用されます。
    - エージェント、コマンド、Plugin、auto-replyヘルパー、`plugin-sdk`、および同様の純粋なユーティリティ領域にあるインポートの軽いユニットテストは、`test/setup-openclaw-runtime.ts` を省略する `unit-fast` レーンに振り分けられます。状態を持つファイルやランタイム負荷の高いファイルは、既存のレーンに残ります。
    - 一部の `plugin-sdk` および `commands` ヘルパーのソースファイルでは、変更モードの実行が軽量レーン内の明示的な同階層テストにもマッピングされるため、ヘルパーの編集でそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、最上位のコアヘルパー、最上位の `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CIではさらにreplyサブツリーをagent-runner、dispatch、commands/state-routingの各シャードに分割し、インポート負荷の高い1つのバケットがNode処理の終盤全体を占有しないようにします。
    - 通常のPR/main CIでは、バンドル済みPluginの一括スイープとリリース専用の `agentic-plugins` シャードを意図的に省略します。完全リリース検証では、リリース候補に対してPlugin負荷の高いこれらのスイートを実行する、個別の `Plugin Prerelease` 子ワークフローを起動します。

  </Accordion>

  <Accordion title="組み込みランナーのカバレッジ">

    - メッセージツール探索の入力またはCompactionランタイムの
      コンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化の境界には、対象を絞ったヘルパーの
      リグレッションテストを追加してください。
    - 組み込みランナーの統合スイートを正常に保ってください：
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`、
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`、および
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付きIDとCompactionの動作が引き続き
      実際の `run.ts` / `compact.ts` パスを通ることを検証します。ヘルパーのみの
      テストは、これらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitestプールと分離のデフォルト">

    - 基本Vitest設定のデフォルトは `threads` です。
    - 共有Vitest設定では `isolate: false` に固定し、ルートプロジェクト、
      e2e、ライブ設定全体で非分離ランナーを使用します。
    - ルートUIレーンでは `jsdom` のセットアップとオプティマイザを維持しますが、
      共有の非分離ランナー上で実行します。
    - 各 `pnpm test` シャードは、共有Vitest設定から同じ
      `threads` + `isolate: false` のデフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行時のV8コンパイル負荷を
      軽減するため、デフォルトでVitestの子Nodeプロセスに `--no-maglev` を追加します。
      標準のV8動作と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
    - `scripts/run-vitest.mjs` は、標準出力または標準エラー出力がない状態が
      5分間続いた場合、明示的な非監視Vitest実行を終了します。意図的に無出力で
      調査する場合に監視機構を無効化するには、
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、差分によってどのアーキテクチャレーンが起動されるかを示します。
    - pre-commitフックはフォーマットのみを実行します。フォーマットされたファイルを
      再ステージしますが、lint、型チェック、テストは実行しません。
    - スマートなローカルチェックゲートが必要な場合は、引き渡しまたはpushの前に
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` は、デフォルトで低コストなスコープ付きレーンを通じて
      ルーティングされます。ハーネス、設定、パッケージ、または契約の編集に
      本当に広範なVitestカバレッジが必要だとエージェントが判断した場合にのみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は、ワーカー上限が高いことを除き、
      同じルーティング動作を維持します。
    - ローカルワーカーの自動スケーリングは意図的に保守的であり、ホストの
      ロードアベレージがすでに高い場合は縮小します。そのため、複数のVitest実行が
      同時進行しても、デフォルトでは影響が抑えられます。
    - 基本Vitest設定では、プロジェクト/設定ファイルを
      `forceRerunTriggers` として指定しているため、テスト配線が変更された場合も
      変更モードの再実行が正しく維持されます。
    - 対応ホストでは、設定によって `OPENCLAW_VITEST_FS_MODULE_CACHE` が有効なままに
      なります。直接プロファイリングする際に明示的なキャッシュ場所を1つ指定するには、
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="パフォーマンスのデバッグ">

    - `pnpm test:perf:imports` は、Vitestのインポート所要時間レポートと
      インポート内訳の出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリング表示の対象を
      `origin/main` 以降に変更されたファイルに限定します。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。
      設定全体の実行では設定パスをキーとして使用します。includeパターンを使うCIシャードでは、
      フィルタ済みシャードを個別に追跡できるようにシャード名を追加します。
    - 高負荷なテスト1件が依然として起動時インポートに大半の時間を費やす場合は、
      重い依存関係を狭いローカルの `*.runtime.ts` 境界の背後に配置し、
      `vi.mock(...)` に渡すだけのためにランタイムヘルパーを深くインポートするのではなく、
      その境界を直接モックしてください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、コミット済みの差分について、
      ルーティングされた `test:changed` とネイティブルートプロジェクトパスを比較し、
      経過時間とmacOSの最大RSSを表示します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を
      `scripts/test-projects.mjs` とルートVitest設定にルーティングすることで、
      現在の変更を含むツリーをベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Viteの起動と変換のオーバーヘッドについて、
      メインスレッドのCPUプロファイルを書き込みます。
    - `pnpm test:perf:profile:runner` は、ファイル並列処理を無効にしたユニットスイートについて、
      ランナーのCPU+ヒーププロファイルを書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（Gateway）

- コマンド：`pnpm test:stability:gateway`
- 設定：`test/vitest/vitest.gateway.config.ts`、`test/vitest/vitest.logging.config.ts`、および `test/vitest/vitest.infra.config.ts`。それぞれ1ワーカーに固定
- 範囲：
  - デフォルトで診断を有効にした実際のループバックGatewayを起動
  - 診断イベントパスを通じて、合成されたGatewayメッセージ、メモリ、大容量ペイロードの変動を発生
  - Gateway WS RPC経由で `diagnostics.stability` を照会
  - 診断安定性バンドルの永続化ヘルパーをカバー
  - レコーダーが上限内に収まり、合成RSSサンプルが負荷予算を下回り、セッションごとのキュー深度がゼロまで戻ることを表明
- 期待事項：
  - CIで安全に実行でき、キーは不要
  - 安定性リグレッションの追跡調査用の狭いレーンであり、完全なGatewayスイートの代替ではない

### E2E（リポジトリ集約）

- コマンド：`pnpm test:e2e`
- 範囲：
  - GatewayスモークE2Eレーンを実行
  - モック化されたControl UIブラウザE2Eレーンを実行
- 期待事項：
  - CIで安全に実行でき、キーは不要
  - Playwright Chromiumがインストールされている必要がある

### E2E（Gatewayスモーク）

- コマンド：`pnpm test:e2e:gateway`
- 設定：`test/vitest/vitest.e2e.config.ts`
- ファイル：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下のバンドル済みPluginのE2Eテスト
- ランタイムのデフォルト：
  - リポジトリの他の部分と同様に、Vitestの `threads` と `isolate: false` を使用します。
  - 適応型ワーカーを使用します（CI：最大2、ローカル：デフォルトで1）。
  - コンソールI/Oのオーバーヘッドを削減するため、デフォルトではサイレントモードで実行します。
- 便利な上書き設定：
  - `OPENCLAW_E2E_WORKERS=<n>` でワーカー数を強制指定（上限16）。
  - `OPENCLAW_E2E_VERBOSE=1` で詳細なコンソール出力を再度有効化。
- 範囲：
  - 複数インスタンスのGatewayエンドツーエンド動作
  - WebSocket/HTTP公開面、Nodeペアリング、より負荷の高いネットワーク処理
- 期待事項：
  - CIで実行（パイプラインで有効な場合）
  - 実際のキーは不要
  - ユニットテストよりも可動部分が多い（低速になる可能性あり）

### E2E（モック化されたControl UIブラウザ）

- コマンド：`pnpm test:ui:e2e`
- 設定：`test/vitest/vitest.ui-e2e.config.ts`
- ファイル：`ui/src/**/*.e2e.test.ts`
- 範囲：
  - Vite Control UIを起動
  - Playwrightを通じて実際のChromiumページを操作
  - Gateway WebSocketを決定論的なブラウザ内モックに置き換え
- 期待事項：
  - `pnpm test:e2e` の一部としてCIで実行
  - 実際のGateway、エージェント、プロバイダーキーは不要
  - ブラウザ依存関係が存在する必要がある（`pnpm --dir ui exec playwright install chromium`）

### E2E：OpenShellバックエンドスモーク

- コマンド：`pnpm test:e2e:openshell`
- ファイル：`extensions/openshell/src/backend.e2e.test.ts`
- 範囲：
  - 稼働中のローカルOpenShell Gatewayを再利用
  - 一時的なローカルDockerfileからサンドボックスを作成
  - 実際の `sandbox ssh-config` + SSH exec経由でOpenClawのOpenShellバックエンドを実行
  - サンドボックスのファイルシステムブリッジを通じて、リモートを正規とするファイルシステム動作を検証
- 期待事項：
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLIと稼働中のDockerデーモンが必要
  - 稼働中のローカルOpenShell Gatewayとその設定ソースが必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト用サンドボックスを破棄
- 便利な上書き設定：
  - より広範なe2eスイートを手動で実行する際にテストを有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外のCLIバイナリまたはラッパースクリプトを指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`
  - 登録済みGateway設定を分離されたテストに公開するには `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config`
  - ホストポリシーフィクスチャが使用するDocker Gateway IPを上書きするには `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1`

### ライブ（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `test/vitest/vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル済み Plugin のライブテスト
- デフォルト: `pnpm test:live` により**有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- 対象:
  - 「このプロバイダー／モデルは、実際の認証情報を使用して_今日_本当に動作するか？」
  - プロバイダーの形式変更、ツール呼び出しの癖、認証の問題、レート制限時の動作を検出
- 想定事項:
  - 設計上、CI での安定性は保証されない（実際のネットワーク、実際のプロバイダーポリシー、クォータ、障害）
  - 費用が発生し、レート制限を消費する
  - 「すべて」ではなく、対象を絞ったサブセットの実行を推奨
- ライブ実行では、すでにエクスポートされている API キーと準備済みの認証プロファイルを使用します。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定と認証情報を一時テストホームにコピーするため、ユニットテストのフィクスチャが実際の `~/.openclaw` を変更することはありません。
- ライブテストで実際のホームディレクトリを意図的に使用する必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` はデフォルトで静かなモードを使用します。`[live] ...` の進捗出力は維持しつつ、Gateway のブートストラップログと Bonjour のメッセージを抑制します。完全な起動ログを再び表示するには、`OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーのローテーション（プロバイダーごと）: カンマ／セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、`OPENCLAW_LIVE_*_KEY` でライブ実行ごとに上書きします。テストはレート制限レスポンスを受けると再試行します。
- 進捗／Heartbeat 出力:
  - ライブスイートは標準エラー出力に進捗行を出力するため、Vitest のコンソールキャプチャが静かな場合でも、時間のかかるプロバイダー呼び出しが動作中であることを確認できます。
  - `test/vitest/vitest.live.config.ts` は Vitest のコンソールインターセプトを無効にするため、ライブ実行中にプロバイダー／Gateway の進捗行が即座にストリーミングされます。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway／プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

次の判断表を使用してください。

- ロジック／テストを編集する場合: `pnpm test` を実行（多くの変更を加えた場合は `pnpm test:coverage` も実行）
- Gateway のネットワーク処理／WS プロトコル／ペアリングに変更を加える場合: `pnpm test:e2e` を追加
- 「ボットが停止している」問題／プロバイダー固有の障害／ツール呼び出しをデバッグする場合: 対象を絞った `pnpm test:live` を実行

## ライブ（ネットワークにアクセスする）テスト

ライブモデルマトリクス、CLI バックエンドのスモークテスト、ACP のスモークテスト、Codex app-server
ハーネス、すべてのメディアプロバイダーのライブテスト（Deepgram、BytePlus、ComfyUI、
画像、音楽、動画、メディアハーネス）、およびライブ実行時の認証情報処理については、

- [ライブスイートのテスト](/ja-JP/help/testing-live)を参照してください。更新と
  Plugin の専用検証チェックリストについては、
  [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照してください。

## Docker ランナー（任意の「Linux で動作するか」チェック）

これらの Docker ランナーは、次の 2 つの区分に分かれます。

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で、それぞれ対応するプロファイルキー用ライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカルの設定ディレクトリ、ワークスペース、任意のプロファイル環境ファイルをマウントします。対応するローカルエントリーポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker ライブランナーでは、必要に応じて独自の実用的な上限を維持します。
  `test:docker:live-models` は、厳選された、サポート対象かつ検出効果の高いセットをデフォルトで使用し、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を使用します。明示的に上限を小さくする場合やスキャン範囲を広げる場合は、`OPENCLAW_LIVE_MAX_MODELS`
  または Gateway の環境変数を設定してください。
- `test:docker:all` は、`test:docker:live-build` を使用してライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パッケージ化した後、2 つの `scripts/e2e/Dockerfile` イメージをビルドまたは再利用します。ベアイメージは、インストール／更新／Plugin 依存関係レーン専用の Node/Git ランナーであり、これらのレーンは事前ビルド済みの tarball をマウントします。機能イメージは、ビルド済みアプリの機能レーン用に同じ tarball を `/app` へインストールします。Docker レーンの定義は `scripts/lib/docker-e2e-scenarios.mjs`、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行します。集約処理では、重み付きローカルスケジューラーを使用します。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロット数を制御し、リソース上限により、負荷の高いライブ、npm インストール、複数サービスの各レーンが一斉に起動しないようにします。単一レーンの負荷が有効な上限を超える場合でも、プールが空であればスケジューラーはそのレーンを開始でき、その後、再び容量が利用可能になるまで単独で実行し続けます。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`（およびその他の `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` 上書き）は、Docker ホストに余裕がある場合にのみ調整してください。ランナーはデフォルトで Docker の事前チェックを実行し、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを出力し、成功したレーンの所要時間を `.artifacts/docker-tests/lane-timings.json` に保存して、以降の実行では所要時間の長いレーンを先に開始するために使用します。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用します。または、選択したレーン、パッケージ／イメージの要件、認証情報に関する CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用します。
- `Package Acceptance` は、「このインストール可能な tarball が製品として動作するか」を検証する GitHub ネイティブのパッケージゲートです。`source=npm`、`source=ref`、`source=url`、`source=trusted-url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードした後、選択した参照を再パッケージ化するのではなく、その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。プロファイルは対象範囲の広さ順に `smoke`、`package`、`product`、`full`（および明示的なレーン一覧用の `custom`）となっています。パッケージ／更新／Plugin の契約、公開済みアップグレードの生存確認マトリクス、リリースのデフォルト、障害のトリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照してください。
- ビルドとリリースのチェックでは、tsdown の後に `scripts/check-cli-bootstrap-imports.mjs` を実行します。このガードは、`dist/entry.js` と `dist/cli/run-main.js` から静的なビルド済みグラフをたどり、コマンドのディスパッチ前に、そのディスパッチ前ブートストラップグラフが外部パッケージ（Commander、プロンプト UI、undici、ロギング、および同様に起動時の負荷が高い依存関係をすべて含む）を静的にインポートしている場合に失敗します。また、バンドル済み Gateway 実行チャンクを 70 KB に制限し、そのチャンクから既知のコールド Gateway パス（`control-ui-assets`、`diagnostic-stability-bundle`、`onboard-helpers`、`process-respawn`、`restart-sentinel`、`server-close`、`server-reload-handlers`）を静的にインポートすることを拒否します。`scripts/release-check.ts` は別途、パッケージ化された CLI に対して `--help`、`onboard --help`、`doctor --help`、`status --json --timeout 1`、`config schema`、`models list --provider openai` を使用したスモークテストを実行します。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限されています。この期限までは、ハーネスはリリース済みパッケージのメタデータ欠落のみを許容します。具体的には、非公開 QA インベントリエントリの省略、`gateway install --wrapper` の欠落、tarball 由来の git フィクスチャにおけるパッチファイルの欠落、永続化された `update.channel` の欠落、レガシーな Plugin インストール記録の保存場所、マーケットプレイスのインストール記録の永続化不足、`plugins update` 中の設定メタデータ移行です。`2026.4.25` より後のパッケージでは、これらのパスは厳格に失敗として扱われます。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:release-user-journey`、`test:docker:release-typed-onboarding`、`test:docker:release-media-memory`、`test:docker:release-upgrade-user-journey`、`test:docker:release-plugin-marketplace`、`test:docker:skill-install`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:agent-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、`test:docker:config-reload` は、1 つ以上の実コンテナを起動し、上位レベルの統合パスを検証します。
- `scripts/lib/openclaw-e2e-instance.sh` を通じてパッケージ化された OpenClaw tarball をインストールする Docker/Bash E2E レーンでは、`npm install` の上限を `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT`（デフォルトは `600s`。デバッグのためにラッパーを無効化するには `0` を設定）で制御します。

ライブモデル用 Docker ランナーは、必要な CLI 認証ホームのみ
（実行対象を絞っていない場合は、サポート対象のすべて）をバインドマウントし、実行前に
コンテナのホームへコピーします。これにより、外部 CLI の OAuth がホスト側の認証ストアを
変更せずにトークンを更新できます。

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP バインドスモークテスト: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`。デフォルトで Claude、Codex、Gemini を対象とし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` により Droid／OpenCode を厳格に検証）
- CLI バックエンドのスモークテスト: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server ハーネスのスモークテスト: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開発用エージェント: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- オブザーバビリティのスモークテスト: `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke`、`pnpm qa:observability:smoke` は、非公開 QA のソースチェックアウト用レーンです。npm tarball には QA Lab が含まれないため、意図的にパッケージの Docker リリースレーンには含めていません。
- Open WebUI のライブスモークテスト: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なスキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- npm tarball のオンボーディング／チャンネル／エージェントのスモークテスト: `pnpm test:docker:npm-onboard-channel-agent` は、パッケージ化された OpenClaw tarball を Docker にグローバルインストールし、環境変数参照によるオンボーディングを介して OpenAI を設定し、デフォルトで Telegram も設定します。その後 doctor を実行し、モック化された OpenAI エージェントのターンを 1 回実行します。事前ビルド済みの tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使用し、ホストでの再ビルドを省略するには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を設定します。また、チャンネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使用します。

- リリースユーザージャーニースモーク: `pnpm test:docker:release-user-journey` は、パック済みの OpenClaw tarball をクリーンな Docker ホームにグローバルインストールし、オンボーディングを実行し、モック化された OpenAI プロバイダーを設定し、エージェントターンを実行し、外部 Plugin のインストールとアンインストールを行い、ローカルフィクスチャに対して ClickClack を設定し、送受信メッセージングを検証し、Gateway を再起動して、doctor を実行します。
- リリース型付きオンボーディングスモーク: `pnpm test:docker:release-typed-onboarding` は、パック済みの tarball をインストールし、実際の TTY を介して `openclaw onboard` を操作し、OpenAI を env-ref プロバイダーとして設定し、生のキーが永続化されないことを検証して、モック化されたエージェントターンを実行します。
- リリースメディア/メモリスモーク: `pnpm test:docker:release-media-memory` は、パック済みの tarball をインストールし、PNG 添付ファイルからの画像理解、OpenAI 互換の画像生成出力、メモリ検索による想起、および Gateway 再起動後も想起が維持されることを検証します。
- リリースアップグレードユーザージャーニースモーク: `pnpm test:docker:release-upgrade-user-journey` は、デフォルトで候補 tarball より古い公開済みベースラインのうち最新のものをインストールし、公開済みパッケージ上でプロバイダー/Plugin/ClickClack の状態を設定し、候補 tarball にアップグレードしてから、中核となるエージェント/Plugin/チャンネルのジャーニーを再実行します。古い公開済みベースラインが存在しない場合は、候補バージョンを再利用します。`OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>` でベースラインを上書きします。
- リリース Plugin マーケットプレイススモーク: `pnpm test:docker:release-plugin-marketplace` は、ローカルフィクスチャのマーケットプレイスからインストールし、インストール済み Plugin を更新してアンインストールし、インストールメタデータの削除とともに Plugin CLI が消えることを検証します。
- Skill インストールスモーク: `pnpm test:docker:skill-install` は、パック済みの OpenClaw tarball を Docker にグローバルインストールし、設定でアップロード済みアーカイブのインストールを無効化し、検索から現在公開中の ClawHub Skill スラッグを解決し、`openclaw skills install` でインストールして、インストール済み Skill と `.clawhub` の生成元/ロックメタデータを検証します。
- 更新チャンネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker にグローバルインストールし、パッケージの `stable` から git の `dev` に切り替え、永続化されたチャンネルと更新後の Plugin 動作を検証してから、パッケージの `stable` に戻し、更新ステータスを確認します。
- アップグレード維持スモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャンネル設定、Plugin 許可リスト、古い Plugin 依存関係の状態、および既存のワークスペース/セッションファイルを含む、変更の残った旧ユーザーフィクスチャにパック済みの OpenClaw tarball を上書きインストールします。実際のプロバイダーキーやチャンネルキーを使用せずにパッケージ更新と非対話型 doctor を実行し、local loopback Gateway を起動して、設定/状態の保持と起動/ステータスの時間枠を確認します。
- 公開済みアップグレード維持スモーク: `pnpm test:docker:published-upgrade-survivor` は、デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルを配置し、組み込みのコマンドレシピでそのベースラインを設定し、生成された設定を検証し、その公開済みインストールを候補 tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込んでから、loopback Gateway を起動して、設定済みの意図、状態の保持、起動、`/healthz`、`/readyz`、および RPC ステータスの時間枠を確認します。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で単一のベースラインを上書きし、`openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で集約スケジューラーに正確なローカルベースラインを展開させ、`reported-issues` のような `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` で報告済み課題に対応するフィクスチャを展開します。報告済み課題セットには、外部 OpenClaw Plugin の自動インストール修復用の `configured-plugin-installs` が含まれます。パッケージ受け入れテストでは、これらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` などのメタベースライントークンを解決します。また、完全リリース検証では、リリースソークのパッケージゲートを `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、非表示のランタイムコンテキストトランスクリプトが永続化されることと、影響を受けた重複プロンプト書き換え分岐が doctor によって修復されることを検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在のツリーをパックし、分離されたホームで `bun install -g` を使ってインストールし、`openclaw infer image providers --json` がハングせずに同梱の画像プロバイダーを返すことを検証します。`OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で事前ビルド済み tarball を再利用し、`OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` でホストビルドをスキップするか、`OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` でビルド済み Docker イメージから `dist/` をコピーします。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、更新、直接 npm の各コンテナ間で 1 つの npm キャッシュを共有します。更新スモークでは、候補 tarball にアップグレードする前の安定版ベースラインとして、デフォルトで npm の `latest` を使用します。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きします。非 root インストーラーの確認では、root 所有のキャッシュエントリによってユーザーローカルのインストール動作が隠されないよう、分離された npm キャッシュを維持します。ローカルでの再実行間で root/更新/直接 npm のキャッシュを再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は、`OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` により重複する直接 npm グローバル更新をスキップします。直接の `npm install -g` のカバレッジが必要な場合は、その環境変数を設定せずにスクリプトをローカルで実行します。
- エージェント共有ワークスペース削除 CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace`（スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`）は、デフォルトでルートの Dockerfile イメージをビルドし、分離されたコンテナホームに 1 つのワークスペースを共有する 2 つのエージェントを配置し、`agents delete --json` を実行して、有効な JSON とワークスペース保持動作を検証します。`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` でインストールスモークイメージを再利用します。
- Gateway ネットワークとホストライフサイクル: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）は、2 コンテナ LAN WebSocket の認証/ヘルススモークを維持し、その後 loopback Admin HTTP を使用して、準備状態のフェンシング、保持された制御アクセス、再開による復旧、および準備済みの同一コンテナ内での停止/起動を実証します。再起動確認は元のリースが期限切れになる前に完了する必要があり、永続化された Gateway 設定とコンテナ ID が維持される一方で、一時停止状態がプロセスローカルであることを検証し、機械可読なフェーズ別タイミング JSON を出力します。
- ブラウザー CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot`（スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`）は、ソース E2E イメージと Chromium レイヤーをビルドし、生の CDP で Chromium を起動し、`browser doctor --deep` を実行して、CDP ロールスナップショットがリンク URL、カーソルによってクリック可能に昇格した要素、iframe 参照、およびフレームメタデータを網羅することを検証します。
- OpenAI Responses の `web_search` 最小推論リグレッション: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、モック化された OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証してから、プロバイダースキーマによる拒否を強制し、生の詳細が Gateway ログに表示されることを確認します。
- MCP チャンネルブリッジ（シード済み Gateway + stdio ブリッジ + 生の Claude 通知フレームスモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- OpenClaw バンドル MCP ツール（実際の stdio MCP サーバー + 埋め込み OpenClaw プロファイルの許可/拒否スモーク）: `pnpm test:docker:agent-bundle-mcp-tools`（スクリプト: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`）
- Cron/サブエージェント MCP クリーンアップ（実際の Gateway + 分離された Cron と単発サブエージェントの実行後に stdio MCP 子プロセスを終了）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugin（ローカルパス、`file:`、依存関係がホイストされた npm レジストリ、不正な npm パッケージメタデータ、移動する git 参照、ClawHub の包括的フィクスチャ、マーケットプレイス更新、および Claude バンドルの有効化/検査に対するインストール/更新スモーク）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定します。または、`OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` で、デフォルトの包括的パッケージ/ランタイムの組み合わせを上書きします。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは自己完結型のローカル ClawHub フィクスチャサーバーを使用します。
- Plugin 更新変更なしスモーク: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- Plugin ライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、最低限のコンテナにパック済みの OpenClaw tarball をインストールし、npm Plugin をインストールし、有効/無効を切り替え、ローカル npm レジストリを介してアップグレードとダウングレードを行い、インストール済みコードを削除してから、各ライフサイクルフェーズの RSS/CPU メトリクスを記録しつつ、アンインストールによって古い状態が引き続き削除されることを検証します。
- 設定再読み込みメタデータスモーク: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- Plugin: `pnpm test:docker:plugins` は、ローカルパス、`file:`、依存関係がホイストされた npm レジストリ、移動する git 参照、ClawHub フィクスチャ、マーケットプレイス更新、および Claude バンドルの有効化/検査に対するインストール/更新スモークを網羅します。`pnpm test:docker:plugin-update` は、インストール済み Plugin の変更なし更新動作を網羅します。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡を伴う npm Plugin のインストール、有効化、無効化、アップグレード、ダウングレード、およびコード欠落時のアンインストールを網羅します。

共有機能イメージを手動で事前ビルドして再利用するには、次を実行します。

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` などのスイート固有のイメージ上書きが設定されている場合は、引き続きそちらが優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモートの共有イメージを指している場合、ローカルにまだ存在しなければスクリプトがプルします。QR とインストーラーの Docker テストは、共有のビルド済みアプリランタイムではなくパッケージ/インストール動作を検証するため、独自の Dockerfile を維持します。

実モデルの Docker ランナーは、現在のチェックアウトを読み取り専用でバインドマウントし、
コンテナ内の一時作業ディレクトリにステージングします。これにより、
ランタイムイメージを軽量に保ちながら、正確なローカルの
ソース/設定に対して Vitest を実行できます。ステージング手順では、
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、および
アプリローカルの `.build` や Gradle 出力ディレクトリなど、大容量のローカル専用キャッシュとアプリのビルド
出力をスキップするため、Docker の実環境実行で
マシン固有の成果物のコピーに数分を費やすことはありません。また、
`OPENCLAW_SKIP_CHANNELS=1` も設定するため、Gateway の実環境プローブがコンテナ内で実際の
Telegram/Discord などのチャンネルワーカーを起動することはありません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンから Gateway の
実環境カバレッジを絞り込む、または除外する必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。

`test:docker:openwebui` は、より高レベルの互換性スモークテストです。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw Gateway コンテナを起動し、その Gateway に接続する固定バージョンの Open WebUI コンテナを
起動します。次に Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを
確認した後、Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
ライブモデルの完了を待たず、Open WebUI へのサインインとモデル検出後に終了する必要があるリリース経路の
CI チェックでは、`OPENWEBUI_SMOKE_MODE=models` を設定します。初回実行は、Docker が Open WebUI
イメージをプルする必要があり、Open WebUI 自体のコールドスタート設定の完了も必要になる場合があるため、
目に見えて遅くなることがあります。このレーンでは、プロセス環境、準備済みの認証プロファイル、または明示的な
`OPENCLAW_PROFILE_FILE` を通じて提供される、使用可能なライブモデルキーが必要です。実行に成功すると、
`{ "ok": true, "model": "openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。

`test:docker:mcp-channels` は意図的に決定的に設計されており、実際の Telegram、Discord、iMessage
アカウントは必要ありません。シード済みの Gateway コンテナを起動し、`openclaw mcp serve` を生成する
2 番目のコンテナを起動した後、ルーティングされた会話の検出、トランスクリプトの読み取り、添付ファイルの
メタデータ、ライブイベントキューの動作、送信ルーティング、および実際の stdio MCP ブリッジ経由の
Claude 形式のチャンネル通知と権限通知を検証します。通知チェックでは生の stdio MCP フレームを直接検査するため、
特定のクライアント SDK がたまたま公開する内容だけでなく、ブリッジが実際に出力する内容をスモークテストで
検証できます。

`test:docker:agent-bundle-mcp-tools` は決定的であり、ライブモデルキーは必要ありません。リポジトリの
Docker イメージをビルドし、コンテナ内で実際の stdio MCP プローブサーバーを起動します。そのサーバーを
組み込みの OpenClaw バンドル MCP ランタイム経由で実体化してツールを実行した後、`coding` と `messaging` では
`bundle-mcp` ツールが維持され、`minimal` と `tools.deny: ["bundle-mcp"]` ではそれらが除外されることを
検証します。

`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデルキーは必要ありません。実際の stdio MCP
プローブサーバーを備えたシード済み Gateway を起動し、分離された Cron ターンと `sessions_spawn` の
ワンショット子ターンを実行した後、各実行後に MCP 子プロセスが終了することを検証します。

ACP の平易な自然言語によるスレッドの手動スモークテスト（CI 対象外）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰確認やデバッグのワークフロー用に維持してください。ACP スレッドルーティングの検証で再び必要になる可能性があるため、削除しないでください。

便利な環境変数：

- `OPENCLAW_CONFIG_DIR=...`（デフォルト：`~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト：`~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...` は、テスト実行前にマウントされて読み込まれます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な設定ディレクトリとワークスペースディレクトリを使用し、外部 CLI 認証のマウントを行わずに、`OPENCLAW_PROFILE_FILE` から読み込まれた環境変数のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト：実行ですでに CI または管理対象のバインドディレクトリを使用していない限り、`~/.cache/openclaw/docker-cli-tools`）は、Docker 内でのキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリおよびファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` へコピーされます
  - デフォルトのディレクトリ（実行対象を特定のプロバイダーに限定していない場合に使用）：`.factory`、`.gemini`、`.minimax`
  - デフォルトのファイル：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - プロバイダーを限定した実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定された必要なディレクトリとファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きできます
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` は実行対象を限定します
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` はコンテナ内のプロバイダーを絞り込みます
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報が環境変数ではなくプロファイルストアから取得されることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI スモークテスト用に Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI スモークテストで使用するノンス確認プロンプトを上書きします
- `OPENWEBUI_IMAGE=...` は、固定された Open WebUI イメージタグを上書きします

## ドキュメントの健全性確認

ドキュメントの編集後は、ドキュメントチェックを実行します：`pnpm check:docs`。
ページ内見出しのチェックも必要な場合は、Mintlify の完全なアンカー検証を実行します：`pnpm docs:check-links:anchors`。

## オフライン回帰テスト（CI で安全）

以下は、実際のプロバイダーを使用しない「実パイプライン」の回帰テストです：

- Gateway のツール呼び出し（モック OpenAI、実際の Gateway + エージェントループ）：`src/gateway/gateway.test.ts`（ケース：「Gateway のエージェントループ経由でモック OpenAI ツール呼び出しをエンドツーエンドで実行する」）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定を書き込み + 認証を強制）：`src/gateway/gateway.test.ts`（ケース：「WS 経由でウィザードを実行し、認証トークン設定を書き込む」）

## エージェント信頼性評価（Skills）

「エージェント信頼性評価」のように動作する、CI で安全ないくつかのテストがすでにあります：

- 実際の Gateway + エージェントループを通したモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッションの接続と設定への効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）：

- **判断：** プロンプトに Skills が列挙されている場合、エージェントは適切な Skills を選択するか（または無関係なものを避けるか）？
- **準拠：** エージェントは使用前に `SKILL.md` を読み、必須の手順や引数に従うか？
- **ワークフロー契約：** ツールの順序、セッション履歴の引き継ぎ、サンドボックス境界を検証する複数ターンのシナリオ。

今後の評価では、まず決定性を維持する必要があります：

- モックプロバイダーを使用し、ツール呼び出しとその順序、Skills ファイルの読み取り、セッション接続を検証するシナリオランナー。
- Skills に焦点を当てた小規模なシナリオスイート（使用する場合と避ける場合、ゲーティング、プロンプトインジェクション）。
- CI で安全なスイートを整備した後に限り、任意のライブ評価（オプトイン、環境変数で制御）。

## 契約テスト（Plugin とチャンネルの構造）

契約テストは、登録されているすべての Plugin とチャンネルがそれぞれのインターフェース契約に準拠していることを
検証します。検出されたすべての Plugin を反復処理し、構造と動作に関する一連のアサーションを実行します。
デフォルトの `pnpm test` 単体テストレーンでは、これらの共有境界およびスモークテストファイルを意図的に
スキップします。共有チャンネルまたはプロバイダーのサーフェスに変更を加えた場合は、契約コマンドを明示的に
実行してください。

### コマンド

- すべての契約：`pnpm test:contracts`
- チャンネル契約のみ：`pnpm test:contracts:channels`
- プロバイダー契約のみ：`pnpm test:contracts:plugins`

### チャンネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります。現在の
最上位カテゴリー：

- **チャンネルカタログ** - バンドル済みまたはレジストリ内のチャンネルカタログエントリのメタデータ
- **Plugin**（レジストリ基盤、シャード化）- 基本的な Plugin 登録構造
- **サーフェスのみ**（レジストリ基盤、シャード化）- `actions`、`setup`、`status`、`outbound`、`messaging`、`threading`、`directory`、`gateway` の各サーフェスの構造チェック
- **セッションバインディング**（レジストリ基盤）- セッションバインディングの動作
- **送信ペイロード** - メッセージペイロードの構造と正規化
- **グループポリシー**（フォールバック）- チャンネルごとのデフォルトグループポリシーの適用
- **スレッド処理**（レジストリ基盤、シャード化）- スレッド ID の処理
- **ディレクトリ**（レジストリ基盤、シャード化）- ディレクトリ／メンバー一覧 API
- **レジストリ**および **Plugin コア.\*** - チャンネル Plugin レジストリ、ローダー、設定書き込み認可の内部処理

これらのスイートで使用する受信ディスパッチキャプチャーと送信ペイロードのハーネスヘルパーは、
`src/plugin-sdk/channel-contract-testing.ts` を通じて内部公開されています
（npm から除外されており、公開 SDK サブパスではありません）。このディレクトリには独立した
`inbound.contract.test.ts` ファイルはありません。

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります。現在のカテゴリーには
以下が含まれます：

- **構造** - Plugin マニフェスト、API、ランタイムエクスポートの構造
- **Plugin 登録**（並列版を含む）- マニフェスト登録のケース
- **パッケージマニフェスト** - パッケージマニフェストの要件
- **ローダー** - Plugin ローダーのセットアップ／終了処理の動作
- **レジストリ** - Plugin 契約レジストリの内容と検索
- **プロバイダー** - バンドル済みプロバイダー間で共通するプロバイダーの動作、およびウェブ検索プロバイダー
- **認証選択** - 認証選択のメタデータとセットアップ動作
- **プロバイダーカタログの非推奨化** - 非推奨プロバイダーカタログのメタデータ
- **ウィザードの選択解決**、**ウィザードのモデル選択機能**、**ウィザードのセットアップオプション** - プロバイダーセットアップウィザードの契約
- **埋め込みプロバイダー**、**メモリ埋め込みプロバイダー**、**ウェブ取得プロバイダー**、**音声合成** - 機能固有のプロバイダー契約
- **セッションアクション**、**セッション添付ファイル**、**セッションエントリ投影** - Plugin が所有するセッション状態の契約
- **スケジュール済みターン** - Plugin のスケジュール済みターンのメタデータとタイムスタンプの範囲
- **ホストフック**、**実行コンテキストのライフサイクル**、**ランタイムインポートの副作用**、**ランタイム境界** - Plugin ホスト／ランタイムのライフサイクルとインポート境界の契約
- **拡張機能のランタイム依存関係** - 拡張機能のランタイム依存関係の配置

### 実行するタイミング

- Plugin SDK のエクスポートまたはサブパスを変更した後
- チャンネルまたはプロバイダーの Plugin を追加または変更した後
- Plugin の登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは必要ありません。

## 回帰テストの追加（ガイダンス）

ライブ環境で発見されたプロバイダー／モデルの問題を修正する場合：

- 可能であれば、CI で安全な回帰テストを追加します（モック／スタブプロバイダー、または正確なリクエスト構造変換のキャプチャー）
- 本質的にライブ環境でしか再現できない場合（レート制限、認証ポリシー）は、ライブテストを限定的に保ち、環境変数によるオプトイン方式にします
- バグを検出できる最小のレイヤーを対象にすることを優先します：
  - プロバイダーのリクエスト変換／再生バグ -> モデルの直接テスト
  - Gateway のセッション／履歴／ツールパイプラインのバグ -> Gateway のライブスモークテスト、または CI で安全な Gateway モックテスト
- SecretRef トラバーサルのガードレール：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとにサンプル対象を 1 つ導出し、トラバーサルセグメントを含む exec ID が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef 対象ファミリーを追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは、分類されていない対象 ID が意図せず無視されることを防ぐため、意図的に失敗します。

## 関連項目

- [ライブテスト](/ja-JP/help/testing-live)
- [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
