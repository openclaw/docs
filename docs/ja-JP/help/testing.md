---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway とエージェントの挙動のデバッグ
summary: 'テストキット: 単体/e2e/ライブスイート、Docker ランナー、および各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-05-04T07:03:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には3つの Vitest スイート (unit/integration、e2e、live) と少数の Docker ランナーがあります。このドキュメントは「テスト方法」のガイドです。

- 各スイートがカバーするもの (および意図的にカバーしないもの)。
- 一般的なワークフロー (ローカル、プッシュ前、デバッグ) で実行するコマンド。
- live テストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダーの問題に対するリグレッションを追加する方法。

<Note>
**QA スタック (qa-lab、qa-channel、ライブトランスポートレーン)** は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) — `pnpm openclaw qa matrix` のリファレンス。
- [QA channel](/ja-JP/channels/qa-channel) — リポジトリに支えられたシナリオで使用される合成トランスポートプラグイン。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行について説明します。以下の QA 固有ランナーセクション ([QA-specific runners](#qa-specific-runners)) では、具体的な `qa` 呼び出しを一覧し、上記のリファレンスへ戻る導線を示します。
</Note>

## クイックスタート

ほとんどの日:

- 完全ゲート (プッシュ前に期待されるもの): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでより高速なローカルのフルスイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は extension/channel パスにもルーティングされるようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復調査しているときは、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れる場合や、追加の確信が欲しい場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグする場合 (実際の認証情報が必要):

- live スイート (モデル + Gateway ツール/画像プローブ): `pnpm test:live`
- 1つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイム性能レポート: 実際の `openai/gpt-5.4` エージェントターンには `live_gpt54=true`、Kova の CPU/ヒープ/トレースアーティファクトには `deep_profile=true` を指定して `OpenClaw Performance` をディスパッチします。毎日のスケジュール実行は、`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、mock-provider、deep-profile、GPT 5.4 レーンのアーティファクトを `openclaw/clawgrit-reports` に公開します。mock-provider レポートには、ソースレベルの Gateway 起動、メモリ、プラグイン負荷、反復 fake-model hello-loop、CLI 起動時間の数値も含まれます。
- Docker live モデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さなファイル読み取り形式のプローブを実行します。メタデータが `image` 入力を示しているモデルでは、小さな画像ターンも実行します。プロバイダーの失敗を切り分ける場合は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効化します。
  - CI カバレッジ: 毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の `OpenClaw Release Checks` はどちらも、`include_live_suites: true` を指定して再利用可能な live/E2E ワークフローを呼び出します。これには、プロバイダーごとにシャードされた個別の Docker live モデルマトリックスジョブが含まれます。
  - 集中的な CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)` をディスパッチします。
  - 新しい高シグナルのプロバイダーシークレットは、`scripts/ci-hydrate-live-auth.sh`、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`、およびそのスケジュール/リリース呼び出し元に追加します。
- ネイティブ Codex バインドチャットスモーク: `pnpm test:docker:live-codex-bind`
  - Docker live レーンを Codex app-server パスに対して実行し、合成 Slack DM を `/codex bind` でバインドし、`/codex fast` と `/codex permissions` を実行したうえで、通常の返信と画像添付が ACP ではなくネイティブプラグインバインディング経由でルーティングされることを検証します。
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness`
  - プラグイン所有の Codex app-server ハーネスを通じて Gateway エージェントターンを実行し、`/codex status` と `/codex models` を検証し、デフォルトで画像、cron MCP、サブエージェント、Guardian プローブを実行します。他の Codex app-server の失敗を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` でサブエージェントプローブを無効化します。集中的なサブエージェント確認では、他のプローブを無効化します: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    これは `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、サブエージェントプローブの後に終了します。
- Crestodian レスキューコマンドスモーク: `pnpm test:live:crestodian-rescue-channel`
  - メッセージチャネルレスキューコマンドサーフェスのオプトインの念入りな確認です。`/crestodian status` を実行し、永続的なモデル変更をキューに入れ、`/crestodian yes` に返信し、監査/設定書き込みパスを検証します。
- Crestodian プランナー Docker スモーク: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に偽の Claude CLI がある設定なしコンテナーで Crestodian を実行し、fuzzy プランナーフォールバックが監査付きの型付き設定書き込みに変換されることを検証します。
- Crestodian 初回実行 Docker スモーク: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw 状態ディレクトリから開始し、素の `openclaw` を Crestodian にルーティングし、setup/model/agent/Discord プラグイン + SecretRef 書き込みを適用し、設定を検証し、監査エントリを確認します。同じ Ring 0 セットアップパスは、QA Lab でも `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi コストスモーク: `MOONSHOT_API_KEY` を設定した状態で、`openclaw models list --provider moonshot --json` を実行し、次に `moonshot/kimi-k2.6` に対して分離された `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` を実行します。JSON が Moonshot/K2.6 を報告し、アシスタントトランスクリプトが正規化された `usage.cost` を保存していることを確認します。

<Tip>
失敗しているケースが1つだけ必要な場合は、以下で説明する allowlist 環境変数で live テストを絞り込むことを優先してください。
</Tip>

## QA 固有ランナー

QA-lab の現実性が必要な場合、これらのコマンドはメインのテストスイートの横に位置します。

CI は専用ワークフローで QA Lab を実行します。エージェント的パリティは `QA-Lab - All Lanes` とリリース検証の下にネストされており、単独の PR ワークフローではありません。広範な検証には、`rerun_group=qa-parity` または release-checks QA グループを指定した `Full Release Validation` を使用してください。`QA-Lab - All Lanes` は `main` で毎晩実行され、手動ディスパッチからは mock parity レーン、live Matrix レーン、Convex 管理の live Telegram レーン、Convex 管理の live Discord レーンが並列ジョブとして実行されます。スケジュール QA とリリースチェックは Matrix に `--profile fast` を明示的に渡しますが、Matrix CLI と手動ワークフロー入力のデフォルトは `all` のままです。手動ディスパッチでは、`all` を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードできます。`OpenClaw Release Checks` は、リリース承認前にパリティに加えて高速 Matrix レーンと Telegram レーンを実行し、リリーストランスポートチェックには `mock-openai/gpt-5.5` を使用するため、決定的であり、通常のプロバイダープラグイン起動を避けられます。これらの live トランスポート Gateway はメモリ検索を無効化します。メモリ動作は QA パリティスイートで引き続きカバーされます。

完全リリースの live media シャードは `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。これにはすでに `ffmpeg` と `ffprobe` が含まれています。Docker live モデル/バックエンドシャードは、選択されたコミットごとに一度だけビルドされる共有の `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各シャード内で再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` でそれを pull します。

- `pnpm openclaw qa suite`
  - リポジトリに裏付けられた QA シナリオをホスト上で直接実行します。
  - デフォルトでは、選択された複数のシナリオを、分離された
    Gateway ワーカーで並列実行します。`qa-channel` のデフォルト並列数は 4 です
    （選択されたシナリオ数が上限）。ワーカー数を調整するには `--concurrency <count>` を、
    以前のシリアルレーンを使うには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗するとゼロ以外で終了します。失敗の終了コードなしで
    アーティファクトが必要な場合は `--allow-failures` を使用します。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、シナリオ対応の `mock-openai` レーンを置き換えずに、実験的な
    フィクスチャとプロトコルモックのカバレッジ用に、ローカルの AIMock ベースの
    プロバイダーサーバーを起動します。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチと小さなモック QA Lab シナリオパック
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`）を実行し、結合された CPU 観測
    サマリーを `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは持続的な高 CPU 観測のみをフラグします（`--cpu-core-warn`
    と `--hot-wall-warn-ms`）。そのため、短い起動時のバーストは、数分間続く
    Gateway 高負荷リグレッションのようには見えず、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使用します。チェックアウトに新しい
    ランタイム出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - ライブ実行では、ゲストで実用的なサポート対象の QA 認証入力を転送します。
    env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および存在する場合の
    `CODEX_HOME` です。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるように、
    リポジトリルート配下に置く必要があります。
  - 通常の QA レポートとサマリーに加え、Multipass ログを
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業用に、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルに
    インストールし、非対話型の OpenAI API キーオンボーディングを実行し、
    デフォルトで Telegram を設定し、パッケージ化された Plugin ランタイムが
    起動時の依存関係修復なしでロードされることを検証し、doctor を実行し、
    モックされた OpenAI エンドポイントに対して 1 回のローカルエージェントターンを実行します。
  - Discord で同じパッケージ化インストールレーンを実行するには
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストトランスクリプト用に、決定的なビルド済みアプリの
    Docker スモークを実行します。非表示の OpenClaw ランタイムコンテキストが、
    表示されるユーザーターンに漏れず、非表示カスタムメッセージとして永続化されることを検証し、
    その後、影響を受ける壊れたセッション JSONL を投入して、
    `openclaw doctor --fix` がバックアップ付きでアクティブブランチへ書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - OpenClaw パッケージ候補を Docker にインストールし、インストール済みパッケージの
    オンボーディングを実行し、インストール済み CLI 経由で Telegram を設定し、
    その後、そのインストール済みパッケージを SUT Gateway として使ってライブ Telegram QA レーンを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。
    レジストリからインストールする代わりに、解決済みのローカル tarball をテストするには
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報、または Convex
    認証情報ソースを使用します。CI/リリース自動化では、
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて
    `OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定します。CI に
    `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットがある場合、
    Docker ラッパーは Convex を自動選択します。
  - ラッパーは、Docker のビルド/インストール作業の前に、ホスト上で Telegram または
    Convex 認証情報 env を検証します。認証情報前のセットアップを意図的にデバッグする場合にのみ
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンだけで共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions はこのレーンを手動メンテナー向けワークフロー
    `NPM Telegram Beta E2E` として公開します。マージ時には実行されません。このワークフローは
    `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- GitHub Actions は、候補パッケージ 1 件に対するサイドランの製品証明として
  `Package Acceptance` も公開します。信頼された ref、公開済み npm spec、
  SHA-256 付き HTTPS tarball URL、または別の実行からの tarball アーティファクトを受け付け、
  正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、
  既存の Docker E2E スケジューラーを smoke、package、product、full、または custom
  レーンプロファイルで実行します。同じ `package-under-test` アーティファクトに対して
  Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または
  `live-frontier` を設定します。
  - 最新ベータの製品証明:

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
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI が設定された状態で
    Gateway を起動し、その後、設定編集によりバンドル済みチャネル/Plugin を有効化します。
  - セットアップ検出で未設定のダウンロード可能 Plugin が存在しないままであること、
    最初に設定された doctor 修復で不足している各ダウンロード可能 Plugin が明示的にインストールされること、
    2 回目の再起動で非表示の依存関係修復が実行されないことを検証します。
  - また、既知の古い npm ベースラインをインストールし、
    `openclaw update --tag <candidate>` の実行前に Telegram を有効化し、候補の
    更新後 doctor がハーネス側の postinstall 修復なしでレガシー Plugin 依存関係の残骸を
    クリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージ化インストール更新スモークを実行します。
    選択された各プラットフォームは、まず要求されたベースラインパッケージをインストールし、
    その後同じゲストでインストール済みの `openclaw update` コマンドを実行し、
    インストール済みバージョン、更新ステータス、Gateway の準備完了状態、1 回のローカル
    エージェントターンを検証します。
  - 1 つのゲストで反復する間は、`--platform macos`、`--platform windows`、または
    `--platform linux` を使用します。サマリーアーティファクトパスとレーンごとのステータスには
    `--json` を使用します。
  - OpenAI レーンは、ライブエージェントターン証明にデフォルトで `openai/gpt-5.5` を使用します。
    別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、
    `OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels トランスポートの停止が残りのテスト時間を消費しないように、長いローカル実行は
    ホストタイムアウトでラップします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - このスクリプトは、ネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。
    外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、
    または `linux-update.log` を確認してください。
  - コールドゲストでは、Windows 更新が更新後 doctor とパッケージ更新作業に 10〜15 分かかることがあります。
    ネストされた npm デバッグログが進んでいるなら、それはまだ正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux スモークレーンと並列に実行しないでください。
    それらは VM 状態を共有しており、スナップショット復元、パッケージ配信、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後の証明は、通常のバンドル済み Plugin サーフェスを実行します。これは、エージェントターン自体が
    単純なテキスト応答だけをチェックする場合でも、音声、画像生成、メディア理解などの
    ケイパビリティファサードがバンドル済みランタイム API 経由でロードされるためです。

- `pnpm openclaw qa aimock`
  - 直接のプロトコルスモークテスト用に、ローカル AIMock プロバイダーサーバーだけを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel ホームサーバーに対して Matrix ライブ QA レーンを実行します。ソースチェックアウトのみです。パッケージ化インストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、env vars、アーティファクトレイアウト: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - env のドライバーと SUT ボットトークンを使用して、実際の非公開グループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、および `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使用するか、プールされたリースを有効にするには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - いずれかのシナリオが失敗するとゼロ以外で終了します。失敗の終了コードなしで
    アーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じ非公開グループ内に 2 つの異なるボットが必要で、SUT ボットは Telegram ユーザー名を公開している必要があります。
  - 安定したボット間観測のために、両方のボットで `@BotFather` の Bot-to-Bot Communication Mode を有効化し、ドライバーボットがグループのボットトラフィックを観測できるようにしてください。
  - Telegram QA レポート、サマリー、観測メッセージアーティファクトを `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、ドライバー送信要求から観測された SUT 返信までの RTT が含まれます。

ライブトランスポートレーンは、新しいトランスポートが乖離しないように 1 つの標準契約を共有します。レーンごとのカバレッジマトリクスは [QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、そのマトリクスの一部ではありません。

### Convex 経由の共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、
QA lab は Convex ベースのプールから排他的リースを取得し、レーンの実行中はそのリースに Heartbeat を送り、
シャットダウン時にリースを解放します。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択されたロール用のシークレット 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロール選択:
  - CLI: `--credential-role maintainer|ci`
  - Env デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルト `ci`、それ以外では `maintainer`）

任意の env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用する必要があります。

メンテナー管理コマンド（プールの追加/削除/一覧）には、
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が明示的に必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `doctor` は、ライブ実行の前に Convex サイト URL、ブローカーシークレット、エンドポイントプレフィックス、HTTP タイムアウト、admin/list 到達性を、シークレット値を出力せずに確認するために使用します。スクリプトや CI ユーティリティで機械可読な出力が必要な場合は `--json` を使用します。

デフォルトのエンドポイント契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/再試行可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

Telegram 種別のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正な形式のペイロードを拒否します。

### QA にチャンネルを追加する

新しいチャンネルアダプターのアーキテクチャとシナリオヘルパー名は、[QA 概要 → チャンネルを追加する](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低限の条件は、共有 `qa-lab` ホストシーム上にトランスポートランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成することです。

## テストスイート（どこで何が実行されるか）

これらのスイートは「リアリティの段階的な増加」（およびフレーク性/コストの増加）として考えてください。

### ユニット / 統合（デフォルト）

- コマンド: `pnpm test`
- 設定: ターゲット指定なしの実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定に展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下のコア/ユニットインベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- 範囲:
  - 純粋なユニットテスト
  - インプロセス統合テスト（Gateway 認証、ルーティング、ツール、解析、設定）
  - 既知のバグに対する決定的な回帰テスト
- 期待値:
  - CI で実行される
  - 実キーは不要
  - 高速かつ安定しているべき
  - リゾルバーと公開サーフェスのローダーテストは、実際の同梱 Plugin ソース API ではなく、生成された小さな Plugin フィクスチャを使って、広範な `api.js` と `runtime-api.js` のフォールバック動作を証明する必要があります。実 Plugin API のロードは、Plugin 所有の契約/統合スイートに属します。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ付きレーン">

    - ターゲット指定なしの `pnpm test` は、1 つの巨大なネイティブルートプロジェクトプロセスではなく、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が削減され、auto-reply/Plugin 作業が無関係なスイートを飢餓状態にすることを避けます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。マルチシャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットを最初にスコープ付きレーンへルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストのスコープ付きレーンに展開します。直接のテスト編集、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカルインポートグラフ依存先が対象です。設定/セットアップ/パッケージの編集では、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を明示的に使用しない限り、テストは広範囲に実行されません。
    - `pnpm check:changed` は、狭い作業に対する通常のスマートローカルチェックゲートです。差分をコア、コアテスト、Plugin、Plugin テスト、アプリ、ドキュメント、リリースメタデータ、ライブ Docker ツール、ツール類に分類し、対応する型チェック、lint、ガードコマンドを実行します。Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン更新では、対象を絞ったバージョン/設定/ルート依存関係チェックが実行され、トップレベルのバージョンフィールド以外のパッケージ変更を拒否するガードがあります。
    - ライブ Docker ACP ハーネスの編集では、焦点を絞ったチェックが実行されます。ライブ Docker 認証スクリプトのシェル構文と、ライブ Docker スケジューラーのドライランです。`package.json` の変更は、差分が `scripts["test:docker:live-*"]` に限定される場合のみ含まれます。依存関係、export、バージョン、その他のパッケージサーフェス編集では、引き続きより広範なガードが使用されます。
    - エージェント、コマンド、Plugin、auto-reply ヘルパー、`plugin-sdk`、類似の純粋なユーティリティ領域のインポート軽量なユニットテストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンを通ります。ステートフル/ランタイム負荷の高いファイルは既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` のヘルパーソースファイルも、変更モード実行をこれらの軽量レーン内の明示的な兄弟テストにマップするため、ヘルパー編集でそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルのコアヘルパー、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、インポート負荷の高い 1 つのバケットが Node の末尾全体を占有しないようにします。
    - 通常の PR/main CI は、意図的に Plugin バッチスイープとリリース専用の `agentic-plugins` シャードをスキップします。Full Release Validation は、リリース候補に対して Plugin/Plugin 負荷の高いこれらのスイートを実行する別個の `Plugin Prerelease` 子ワークフローをディスパッチします。

  </Accordion>

  <Accordion title="埋め込みランナーのカバレッジ">

    - message-tool 探索入力または Compaction ランタイムコンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティング境界と正規化境界には、焦点を絞ったヘルパー回帰テストを追加してください。
    - 埋め込みランナー統合スイートを健全に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, and
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - これらのスイートは、スコープ付き ID と Compaction 動作が実際の `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。ヘルパーのみのテストは、これらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest プールと分離のデフォルト">

    - ベース Vitest 設定のデフォルトは `threads` です。
    - 共有 Vitest 設定は `isolate: false` を固定し、ルートプロジェクト、e2e、ライブ設定全体で非分離ランナーを使用します。
    - ルート UI レーンは独自の `jsdom` セットアップと optimizer を維持しますが、共有の非分離ランナー上でも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false` デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大きなローカル実行中の V8 コンパイル churn を減らすため、デフォルトで Vitest 子 Node プロセスに `--no-maglev` を追加します。標準の V8 動作と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、差分がどのアーキテクチャレーンをトリガーするかを表示します。
    - pre-commit hook はフォーマットのみです。フォーマット済みファイルを再ステージし、lint、型チェック、テストは実行しません。
    - スマートローカルチェックゲートが必要な場合は、引き渡しまたは push の前に `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストのスコープ付きレーンを通ります。エージェントがハーネス、設定、パッケージ、契約の編集に本当に広範な Vitest カバレッジが必要だと判断した場合のみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング動作を維持し、worker 上限だけを高くします。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストのロードアベレージがすでに高い場合は後退するため、複数の同時 Vitest 実行による影響はデフォルトで小さくなります。
    - ベース Vitest 設定は、テスト配線が変更されたときに変更モードの再実行が正しく保たれるよう、プロジェクト/設定ファイルを `forceRerunTriggers` としてマークします。
    - 設定は、サポートされるホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接プロファイリング用に明示的なキャッシュ場所を 1 つ指定したい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="パフォーマンスデバッグ">

    - `pnpm test:perf:imports` は、Vitest のインポート時間レポートと import-breakdown 出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを `origin/main` 以降に変更されたファイルへスコープします。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。設定全体の実行では設定パスをキーとして使用します。include-pattern CI シャードでは、フィルター済みシャードを個別に追跡できるようにシャード名を追加します。
    - 1 つのホットテストが依然として起動時インポートに時間の大半を費やす場合は、重い依存関係を狭いローカル `*.runtime.ts` シームの背後に置き、単に `vi.mock(...)` に渡すためにランタイムヘルパーをディープインポートするのではなく、そのシームを直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、コミット済み差分に対するルーティング済み `test:changed` とネイティブルートプロジェクトパスを比較し、ウォールタイムと macOS 最大 RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更されたファイルリストを `scripts/test-projects.mjs` とルート Vitest 設定に通すことで、現在の dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と変換オーバーヘッドのためのメインスレッド CPU プロファイルを書き込みます。
    - `pnpm test:perf:profile:runner` は、ファイル並列性を無効にしたユニットスイートの runner CPU+heap プロファイルを書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（Gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 worker に強制
- 範囲:
  - 診断をデフォルトで有効にした実際の loopback Gateway を開始します
  - 合成 Gateway メッセージ、メモリ、大容量ペイロード churn を診断イベントパス経由で駆動します
  - Gateway WS RPC 経由で `diagnostics.stability` を問い合わせます
  - 診断安定性バンドルの永続化ヘルパーをカバーします
  - レコーダーが上限内に収まり続けること、合成 RSS サンプルがプレッシャーバジェット未満に留まること、セッションごとのキュー深度がゼロに戻って drain されることをアサートします
- 期待値:
  - CI セーフでキー不要
  - 安定性回帰フォローアップ用の狭いレーンであり、Gateway スイート全体の代替ではありません

### E2E（Gateway スモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下のバンドルPlugin E2E テスト
- ランタイムのデフォルト:
  - リポジトリの他の部分と同様に、`isolate: false` で Vitest `threads` を使用する。
  - 適応型ワーカーを使用する（CI: 最大 2、ローカル: デフォルトで 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトではサイレントモードで実行する。
- 便利なオーバーライド:
  - `OPENCLAW_E2E_WORKERS=<n>` でワーカー数を強制する（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` で詳細なコンソール出力を再有効化する。
- スコープ:
  - 複数インスタンス Gateway のエンドツーエンド動作
  - WebSocket/HTTP サーフェス、ノードペアリング、およびより重いネットワーク処理
- 期待事項:
  - CI で実行される（パイプラインで有効化されている場合）
  - 実際のキーは不要
  - 単体テストより可動部分が多い（遅くなることがある）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell Gateway を起動する
  - 一時ローカル Dockerfile からサンドボックスを作成する
  - 実際の `sandbox ssh-config` + SSH exec を通じて OpenClaw の OpenShell バックエンドを実行する
  - サンドボックス fs ブリッジを通じてリモート正規ファイルシステム動作を検証する
- 期待事項:
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作する Docker デーモンが必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト Gateway とサンドボックスを破棄する
- 便利なオーバーライド:
  - `OPENCLAW_E2E_OPENSHELL=1` で、より広い e2e スイートを手動実行するときにテストを有効化する
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` で、デフォルト以外の CLI バイナリまたはラッパースクリプトを指定する

### Live（実プロバイダー + 実モデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドルPlugin live テスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは実際の認証情報で_今日_本当に動作するか？」
  - プロバイダーの形式変更、ツール呼び出しの癖、認証の問題、レート制限の動作を検出する
- 期待事項:
  - 設計上 CI 安定ではない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - 費用がかかる / レート制限を消費する
  - 「すべて」ではなく絞り込んだサブセットの実行を推奨
- Live 実行は、不足している API キーを取得するために `~/.profile` を source する。
- デフォルトでは、live 実行でも `HOME` を分離し、設定/認証素材を一時テストホームへコピーするため、単体テストのフィクスチャが実際の `~/.openclaw` を変更することはない。
- live テストで実際のホームディレクトリを使用する必要が意図的にある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定する。
- `pnpm test:live` は現在、より静かなモードをデフォルトにしている。`[live] ...` 進捗出力は維持するが、追加の `~/.profile` 通知を抑制し、Gateway ブートストラップログ/Bonjour の雑音をミュートする。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定する。
- API キーローテーション（プロバイダー固有）: カンマ/セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）、もしくは `OPENCLAW_LIVE_*_KEY` による live ごとのオーバーライドを設定する。テストはレート制限応答時にリトライする。
- 進捗/Heartbeat 出力:
  - Live スイートは現在、長いプロバイダー呼び出しが Vitest のコンソールキャプチャで静かな場合でも目に見えて動作中と分かるように、進捗行を stderr に出力する。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効化するため、live 実行中にプロバイダー/Gateway の進捗行がすぐにストリームされる。
  - 直接モデル Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整する。
  - Gateway/プローブ Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整する。

## どのスイートを実行すべきか？

この判断表を使用する:

- ロジック/テストを編集している場合: `pnpm test` を実行する（多く変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れている場合: `pnpm test:e2e` を追加する
- 「自分の bot が落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグしている場合: 絞り込んだ `pnpm test:live` を実行する

## Live（ネットワークに触れる）テスト

live モデルマトリクス、CLI バックエンドスモーク、ACP スモーク、Codex app-server
ハーネス、およびすべてのメディアプロバイダー live テスト（Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス）と、live 実行の認証情報処理については、
[Live スイートのテスト](/ja-JP/help/testing-live) を参照してください。専用の更新および
Plugin 検証チェックリストについては、
[更新とPluginのテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

## Docker ランナー（任意の「Linux で動作する」確認）

これらの Docker ランナーは 2 つのグループに分かれる:

- live モデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で対応する profile-key live ファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカルの設定ディレクトリとワークスペースをマウントする（マウントされている場合は `~/.profile` も source する）。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles`。
- Docker live ランナーは、フル Docker スイープを現実的に保つため、デフォルトでより小さいスモーク上限を使用する:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を使用する。より大きな網羅的スキャンを明示的に
  望む場合は、これらの環境変数をオーバーライドする。
- `test:docker:all` は `test:docker:live-build` 経由で live Docker イメージを一度だけビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度だけパックし、その後 2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用する。bare イメージは install/update/plugin-dependency レーン用の Node/Git ランナーのみであり、これらのレーンは事前ビルド済み tarball をマウントする。functional イメージは同じ tarball を `/app` にインストールし、ビルド済みアプリ機能レーンに使用する。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行する。集約は重み付きローカルスケジューラーを使用する。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限は重い live、npm-install、複数サービスレーンがすべて同時に開始しないようにする。単一レーンがアクティブな上限より重い場合でも、プールが空ならスケジューラーはそれを開始でき、その後キャパシティが再び利用可能になるまで単独で実行し続ける。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、および `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`。Docker ホストにより余裕がある場合にのみ `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整する。ランナーはデフォルトで Docker プリフライトを実行し、古い OpenClaw E2E コンテナーを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、以降の実行で長いレーンを先に開始するためにそのタイミングを使用する。ビルドや Docker 実行なしで重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、パッケージ/イメージ要件、認証情報に関する CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用する。
- `Package Acceptance` は「このインストール可能 tarball はプロダクトとして動作するか？」を確認する GitHub ネイティブのパッケージゲート。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードし、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行する。プロファイルは範囲の広さ順に `smoke`、`package`、`product`、`full`。パッケージ/更新/Plugin 契約、公開済みアップグレードのサバイバーマトリクス、リリースデフォルト、失敗トリアージについては、[更新とPluginのテスト](/ja-JP/help/testing-updates-plugins) を参照。
- ビルドとリリース確認は tsdown 後に `scripts/check-cli-bootstrap-imports.mjs` を実行する。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的なビルド済みグラフをたどり、コマンドディスパッチ前の起動前インポートが Commander、プロンプト UI、undici、logging などのパッケージ依存関係をインポートしている場合に失敗する。また、バンドルされた Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否する。パッケージ化された CLI スモークは、root help、onboard help、doctor help、status、config schema、および model-list コマンドもカバーする。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限される。その期限までは、ハーネスは出荷済みパッケージのメタデータギャップのみを許容する。省略された private QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 派生 git フィクスチャ内の欠落したパッチファイル、欠落した永続化済み `update.channel`、レガシー Plugin インストールレコードの場所、欠落した marketplace インストールレコード永続化、および `plugins update` 中の設定メタデータ移行。`2026.4.25` より後のパッケージでは、これらのパスは厳密な失敗となる。
- コンテナースモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1 つ以上の実コンテナーを起動し、より高レベルの統合パスを検証する。

live モデル Docker ランナーは、必要な CLI 認証ホームのみ（または実行が絞り込まれていない場合は対応するすべてのもの）も bind mount し、その後、外部 CLI OAuth がホストの認証ストアを変更せずにトークンを更新できるように、実行前にそれらをコンテナーホームへコピーする:

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind` (スクリプト: `scripts/test-live-acp-bind-docker.sh`; デフォルトで Claude、Codex、Gemini を対象にし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` によって Droid/OpenCode の厳密なカバレッジを含む)
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend` (スクリプト: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness` (スクリプト: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- オブザーバビリティスモーク: `pnpm qa:otel:smoke` は非公開 QA ソースチェックアウトレーン。npm tarball には QA Lab が含まれないため、意図的にパッケージ Docker リリースレーンには含めていない。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui` (スクリプト: `scripts/e2e/openwebui-docker.sh`)
- オンボーディングウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- Npm tarball オンボーディング/チャネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、env-ref オンボーディングとデフォルトの Telegram を使って OpenAI を設定し、doctor を実行し、モックされた OpenAI エージェントターンを 1 回実行する。事前ビルド済み tarball を `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用するか、`OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` でホストの再ビルドをスキップするか、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` でチャネルを切り替える。
- 更新チャネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャネルと更新後の Plugin 動作を検証してから、パッケージ `stable` に戻して更新ステータスを確認する。
- アップグレード生存スモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャネル設定、Plugin allowlist、古い Plugin 依存関係状態、既存のワークスペース/セッションファイルを含む、汚れた旧ユーザーフィクスチャの上に、パック済みの OpenClaw tarball をインストールする。ライブプロバイダーやチャネルキーなしでパッケージ更新と非対話型 doctor を実行し、その後 loopback Gateway を起動して、設定/状態の保持と起動/ステータスのバジェットを確認する。
- 公開済みアップグレード生存スモーク: `pnpm test:docker:published-upgrade-survivor` はデフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、組み込みのコマンドレシピでそのベースラインを設定し、結果の設定を検証し、その公開済みインストールを候補 tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、設定済み intent、状態保持、起動、`/healthz`、`/readyz`、RPC ステータスバジェットを確認する。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で 1 つのベースラインを上書きし、`all-since-2026.4.23` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で集約スケジューラーに正確なベースラインを展開させ、`reported-issues` のような `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` で issue 形式のフィクスチャを展開する。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれる。Package Acceptance はそれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開する。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、非表示ランタイムコンテキストのトランスクリプト永続化と、影響を受ける重複したプロンプト再書き込みブランチの doctor 修復を検証する。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は現在のツリーをパックし、分離されたホームに `bun install -g` でインストールし、`openclaw infer image providers --json` がハングせずにバンドル画像プロバイダーを返すことを検証する。事前ビルド済み tarball を `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用するか、`OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` でホストビルドをスキップするか、`OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` でビルド済み Docker イメージから `dist/` をコピーする。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各コンテナ間で 1 つの npm キャッシュを共有する。更新スモークは、候補 tarball にアップグレードする前の stable ベースラインとして、デフォルトで npm `latest` を使う。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きする。非 root インストーラーチェックでは、root 所有のキャッシュエントリがユーザーローカルのインストール動作を隠さないように、分離された npm キャッシュを維持する。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定する。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` で重複する direct-npm グローバル更新をスキップする。直接 `npm install -g` のカバレッジが必要な場合は、その env なしでローカルにスクリプトを実行する。
- 共有ワークスペース削除エージェント CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) はデフォルトで root Dockerfile イメージをビルドし、分離されたコンテナホーム内に 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行し、有効な JSON と保持されたワークスペース動作を検証する。`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` で install-smoke イメージを再利用する。
- Gateway ネットワーキング (2 コンテナ、WS 認証 + ヘルス): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- ブラウザー CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) はソース E2E イメージと Chromium レイヤーをビルドし、生の CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP ロールスナップショットがリンク URL、カーソルで昇格されたクリック可能要素、iframe 参照、フレームメタデータを網羅していることを検証する。
- OpenAI Responses web_search 最小 reasoning リグレッション: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) は、モックされた OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に上げることを検証し、その後プロバイダースキーマを強制的に拒否させ、生の詳細が Gateway ログに出現することを確認する。
- MCP チャネルブリッジ (シード済み Gateway + stdio ブリッジ + 生の Claude 通知フレームスモーク): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- Pi バンドル MCP ツール (実 stdio MCP サーバー + 埋め込み Pi プロファイル allow/deny スモーク): `pnpm test:docker:pi-bundle-mcp-tools` (スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/サブエージェント MCP クリーンアップ (実 Gateway + 分離 cron と 1 回限りのサブエージェント実行後の stdio MCP 子プロセス終了): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (ローカルパス、`file:`、巻き上げられた依存関係を持つ npm レジストリ、git moving refs、ClawHub kitchen-sink、マーケットプレイス更新、Claude バンドルの有効化/検査のインストール/更新スモーク): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定するか、デフォルトの kitchen-sink パッケージ/ランタイムペアを `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` で上書きする。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub フィクスチャサーバーを使う。
- Plugin 更新変更なしスモーク: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin ライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、パック済みの OpenClaw tarball を空のコンテナにインストールし、npm Plugin をインストールし、有効/無効を切り替え、ローカル npm レジストリ経由でアップグレードとダウングレードを行い、インストール済みコードを削除し、その後、各ライフサイクルフェーズの RSS/CPU メトリクスをログに記録しながら、アンインストールが古い状態を引き続き削除することを検証する。
- 設定リロードメタデータスモーク: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` は、ローカルパス、`file:`、巻き上げられた依存関係を持つ npm レジストリ、git moving refs、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドルの有効化/検査のインストール/更新スモークを対象にする。`pnpm test:docker:plugin-update` は、インストール済み Plugin の変更なし更新動作を対象にする。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡付きの npm Plugin のインストール、有効化、無効化、アップグレード、ダウングレード、コード欠落時のアンインストールを対象にする。

共有機能イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きは、設定されている場合は引き続き優先される。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにないときに pull する。QR とインストーラーの Docker テストは、共有ビルド済みアプリランタイムではなく、パッケージ/インストール動作を検証するため、独自の Dockerfile を維持している。

ライブモデル Docker ランナーは、現在のチェックアウトも読み取り専用で bind mount し、
コンテナ内の一時作業ディレクトリにステージングします。これにより、ランタイム
イメージをスリムに保ちながら、正確なローカルソース/設定に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build` や
Gradle 出力ディレクトリなど、大きなローカル専用キャッシュやアプリのビルド出力をスキップするため、
Docker ライブ実行がマシン固有の成果物のコピーに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、Gateway ライブプローブが
コンテナ内で実際の Telegram/Discord などのチャネルワーカーを開始しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンで
Gateway ライブカバレッジを絞り込む、または除外する必要がある場合は
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw Gateway コンテナを起動し、その Gateway に対して固定された Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証してから、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
初回実行は、Docker が Open WebUI イメージを pull する必要があり、Open WebUI が自身のコールドスタート設定を完了する必要があるため、
目に見えて遅くなる場合があります。
このレーンでは使用可能なライブモデルキーが必要で、`OPENCLAW_PROFILE_FILE`
(デフォルトは `~/.profile`) が Docker 化された実行でそれを提供する主な方法です。
成功した実行では `{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、iMessage アカウントは不要です。シード済みの Gateway
コンテナを起動し、`openclaw mcp serve` を生成する 2 つ目のコンテナを開始してから、
ルーティングされた会話の検出、トランスクリプト読み取り、添付ファイルメタデータ、
ライブイベントキューの動作、送信ルーティング、および実際の stdio MCP ブリッジ上の Claude 形式のチャネル +
権限通知を検証します。通知チェックは raw stdio MCP フレームを直接検査するため、
スモークは特定のクライアント SDK がたまたま公開する内容だけでなく、
ブリッジが実際に発行する内容を検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、ライブモデルキーは不要です。リポジトリの Docker イメージをビルドし、
コンテナ内で実際の stdio MCP プローブサーバーを起動し、埋め込み Pi bundle
MCP ランタイムを通じてそのサーバーを具現化し、ツールを実行してから、`coding` と `messaging` が
`bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルターすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデルキーは不要です。実際の stdio MCP プローブサーバーを持つシード済み Gateway を起動し、
分離された Cron ターンと `/subagents spawn` の 1 回限りの子ターンを実行してから、
各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP 平易言語スレッドスモーク (CI ではありません):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な環境変数:

- `OPENCLAW_CONFIG_DIR=...` (デフォルト: `~/.openclaw`) は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...` (デフォルト: `~/.openclaw/workspace`) は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...` (デフォルト: `~/.profile`) は `/home/node/.profile` にマウントされ、テスト実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な設定/ワークスペースディレクトリを使用し、外部 CLI 認証マウントなしで、`OPENCLAW_PROFILE_FILE` から source された環境変数だけを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (デフォルト: `~/.cache/openclaw/docker-cli-tools`) は Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、その後テスト開始前に `/home/node/...` へコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定された必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマリストで手動上書きします
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` は実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` はコンテナ内のプロバイダーをフィルターします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報がプロファイルストアから来ることを保証します (env ではありません)
- `OPENCLAW_OPENWEBUI_MODEL=...` は Open WebUI スモーク用に Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は Open WebUI スモークで使用する nonce チェックプロンプトを上書きします
- `OPENWEBUI_IMAGE=...` は固定された Open WebUI イメージタグを上書きします

## ドキュメント健全性

ドキュメント編集後にドキュメントチェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全な Mintlify アンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフライン回帰 (CI セーフ)

これらは実プロバイダーなしの「実際のパイプライン」回帰です:

- Gateway ツール呼び出し (モック OpenAI、実 Gateway + エージェントループ): `src/gateway/gateway.test.ts` (ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway ウィザード (WS `wizard.start`/`wizard.next`、設定を書き込み + 認証を強制): `src/gateway/gateway.test.ts` (ケース: "runs wizard over ws and writes auth token config")

## エージェント信頼性 eval (Skills)

「エージェント信頼性 eval」のように振る舞う CI セーフなテストはすでにいくつかあります:

- 実 Gateway + エージェントループを通じたモックツール呼び出し (`src/gateway/gateway.test.ts`)。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー (`src/gateway/gateway.test.ts`)。

Skills でまだ不足しているもの ([Skills](/ja-JP/tools/skills) を参照):

- **意思決定:** プロンプトに Skills が列挙されているとき、エージェントは正しい skill を選ぶか (または無関係なものを避けるか)?
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必須の手順/引数に従うか?
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界をアサートするマルチターンシナリオ。

将来の eval は、まず決定的であるべきです:

- ツール呼び出し + 順序、skill ファイル読み取り、セッション配線をアサートする、モックプロバイダーを使用したシナリオランナー。
- skill に焦点を当てた小さなシナリオスイート (使用 vs 回避、ゲート、プロンプトインジェクション)。
- CI セーフなスイートが整ってからの、任意のライブ eval (オプトイン、env ゲート付き)。

## 契約テスト (plugin と channel の形状)

契約テストは、登録済みのすべての plugin と channel がそれぞれの
インターフェイス契約に準拠していることを検証します。検出されたすべての plugin を反復処理し、
形状と動作のアサーションスイートを実行します。デフォルトの `pnpm test` unit レーンは、これらの共有境界およびスモークファイルを意図的に
スキップします。共有 channel または provider サーフェスに触れる場合は、契約コマンドを明示的に
実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- Channel 契約のみ: `pnpm test:contracts:channels`
- Provider 契約のみ: `pnpm test:contracts:plugins`

### Channel 契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な plugin 形状 (id, name, capabilities)
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディング動作
- **outbound-payload** - メッセージペイロード構造
- **inbound** - 受信メッセージ処理
- **actions** - Channel アクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/roster API
- **group-policy** - グループポリシー強制

### Provider ステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - Channel ステータスプローブ
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

### 実行タイミング

- plugin-sdk の export または subpath を変更した後
- channel または provider plugin を追加または変更した後
- plugin の登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## 回帰の追加 (ガイダンス)

ライブで見つかった provider/model の問題を修正する場合:

- 可能であれば CI セーフな回帰を追加します (モック/スタブ provider、または正確なリクエスト形状変換のキャプチャ)
- 本質的にライブ専用の場合 (レート制限、認証ポリシー)、ライブテストを狭く保ち、環境変数経由のオプトインにします
- バグを捕捉する最小レイヤーを優先して対象にします:
  - provider リクエスト変換/リプレイのバグ → 直接の models テスト
  - gateway セッション/履歴/ツールパイプラインのバグ → gateway ライブスモークまたは CI セーフな gateway モックテスト
- SecretRef トラバーサルガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ (`listSecretTargetRegistryEntries()`) から SecretRef クラスごとに 1 つのサンプルターゲットを導出し、トラバーサルセグメント exec id が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef ターゲットファミリーを追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは未分類のターゲット ID で意図的に失敗するため、新しいクラスを黙ってスキップできません。

## 関連

- [ライブテスト](/ja-JP/help/testing-live)
- [更新とプラグインのテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
