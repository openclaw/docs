---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway + エージェントの動作のデバッグ
summary: 'テストキット: unit/e2e/liveスイート、Dockerランナー、各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-05-05T04:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（ユニット/統合、e2e、ライブ）と、小規模な Docker ランナー群があります。このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートがカバーする範囲（および意図的にカバーし_ない_範囲）。
- 一般的なワークフロー（ローカル、push 前、デバッグ）で実行するコマンド。
- ライブテストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダー問題に対するリグレッションを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、ライブトランスポートレーン）**は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) — `pnpm openclaw qa matrix` のリファレンス。
- [QA チャンネル](/ja-JP/channels/qa-channel) — リポジトリ裏付けのシナリオで使用される合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行について説明します。下の QA 固有のランナーセクション（[QA 固有のランナー](#qa-specific-runners)）では、具体的な `qa` 呼び出しを一覧し、上記のリファレンスに戻れるようにしています。
</Note>

## クイックスタート

多くの場合:

- フルゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの、より速いローカルのフルスイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は、extension/channel パスもルーティングするようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 1 つの失敗について反復している場合は、まず対象を絞った実行を優先してください。
- Docker 裏付けの QA サイト: `pnpm qa:lab:up`
- Linux VM 裏付けの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れる場合や、追加の確信が必要な場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）:

- ライブスイート（モデル + gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つのライブファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイム性能レポート: 実際の `openai/gpt-5.4` エージェントターンには `live_gpt54=true`、Kova CPU/ヒープ/トレース成果物には `deep_profile=true` を指定して `OpenClaw Performance` を dispatch します。日次スケジュール実行は、`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、mock-provider、deep-profile、GPT 5.4 レーンの成果物を `openclaw/clawgrit-reports` に公開します。mock-provider レポートには、ソースレベルの gateway 起動、メモリ、plugin-pressure、繰り返し fake-model hello-loop、CLI 起動の数値も含まれます。
- Docker ライブモデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて、小さなファイル読み取り形式のプローブを実行します。メタデータで `image` 入力を明示しているモデルでは、小さな画像ターンも実行します。プロバイダーの失敗を切り分ける場合は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効化します。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の `OpenClaw Release Checks` は、どちらも `include_live_suites: true` で再利用可能なライブ/E2E ワークフローを呼び出します。これには、プロバイダーごとに shard された個別の Docker ライブモデル matrix ジョブが含まれます。
  - 集中的な CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)` を dispatch します。
  - 新しい高シグナルのプロバイダーシークレットは、`scripts/ci-hydrate-live-auth.sh` に加え、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` とそのスケジュール/リリース呼び出し元にも追加します。
- ネイティブ Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker ライブレーンを実行し、`/codex bind` で合成 Slack DM をバインドし、`/codex fast` と `/codex permissions` を実行してから、プレーンな返信と画像添付が ACP ではなくネイティブ Plugin バインディングを通じてルーティングされることを検証します。
- Codex app-server ハーネス smoke: `pnpm test:docker:live-codex-harness`
  - Plugin が所有する Codex app-server ハーネスを通じて Gateway エージェントターンを実行し、`/codex status` と `/codex models` を検証し、デフォルトでは画像、cron MCP、サブエージェント、Guardian プローブを実行します。他の Codex app-server の失敗を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` でサブエージェントプローブを無効化します。サブエージェントだけを集中して確認する場合は、他のプローブを無効化します: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、サブエージェントプローブ後に終了します。
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - メッセージチャンネルの rescue command サーフェス向けの、オプトインの二重チェックです。`/crestodian status` を実行し、永続的なモデル変更をキューに入れ、`/crestodian yes` に返信し、監査/config 書き込みパスを検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に fake Claude CLI を置いた configless コンテナで Crestodian を実行し、fuzzy planner フォールバックが、監査済みの型付き config 書き込みに変換されることを検証します。
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、裸の `openclaw` を Crestodian にルーティングし、setup/model/agent/Discord Plugin + SecretRef 書き込みを適用し、config を検証し、監査エントリを検証します。同じ Ring 0 セットアップパスは、QA Lab でも `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` を設定した状態で、`openclaw models list --provider moonshot --json` を実行し、その後、`moonshot/kimi-k2.6` に対して分離された `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` を実行します。JSON が Moonshot/K2.6 を報告し、アシスタントの transcript が正規化された `usage.cost` を保存することを検証します。

<Tip>
1 つの失敗ケースだけが必要な場合は、下で説明する allowlist 環境変数でライブテストを絞り込むことを優先してください。
</Tip>

## QA 固有のランナー

QA-lab のリアリズムが必要な場合、これらのコマンドはメインのテストスイートと並んで使います。

CI は専用ワークフローで QA Lab を実行します。Agentic parity は、スタンドアロンの PR ワークフローではなく、`QA-Lab - All Lanes` とリリース検証の下にネストされています。広範な検証では、`rerun_group=qa-parity` または release-checks QA グループを指定して `Full Release Validation` を使用してください。安定版/デフォルトのリリースチェックでは、網羅的なライブ/Docker soak は `run_release_soak=true` の背後に置かれます。`full` プロファイルでは soak が強制的に有効になります。`QA-Lab - All Lanes` は `main` で nightly 実行され、手動 dispatch では mock parity レーン、ライブ Matrix レーン、Convex 管理のライブ Telegram レーン、Convex 管理のライブ Discord レーンを並列ジョブとして実行します。スケジュールされた QA とリリースチェックは Matrix `--profile fast` を明示的に渡しますが、Matrix CLI と手動ワークフロー入力のデフォルトは引き続き `all` です。手動 dispatch では、`all` を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブに shard できます。`OpenClaw Release Checks` は、リリース承認前に parity と fast Matrix および Telegram レーンを実行し、リリーストランスポートチェックには `mock-openai/gpt-5.5` を使用するため、決定的なままで通常のプロバイダー Plugin 起動を回避します。これらのライブトランスポート Gateway はメモリ検索を無効化します。メモリ動作は QA parity スイートで引き続きカバーされます。

フルリリースのライブメディア shard は、すでに `ffmpeg` と `ffprobe` を含む `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。Docker ライブモデル/バックエンド shard は、選択されたコミットごとに一度だけビルドされる共有の `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各 shard 内で再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` でそれを pull します。

- `pnpm openclaw qa suite`
  - リポジトリに基づく QA シナリオをホスト上で直接実行します。
  - デフォルトでは、選択された複数のシナリオを、分離された
    Gateway ワーカーで並列実行します。`qa-channel` はデフォルトで並行数 4 です（選択された
    シナリオ数が上限）。ワーカー数を調整するには `--concurrency <count>` を使用し、
    以前のシリアルレーンを使うには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが
    必要な場合は `--allow-failures` を使用します。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、シナリオ対応の `mock-openai` レーンを置き換えずに、実験的な
    フィクスチャとプロトコルモックのカバレッジ用にローカルの AIMock ベースのプロバイダーサーバーを起動します。
- `pnpm test:plugins:kitchen-sink-live`
  - ライブ OpenAI Kitchen Sink Plugin ガントレットを QA Lab 経由で実行します。外部の
    Kitchen Sink パッケージをインストールし、Plugin SDK サーフェスのインベントリを検証し、
    `/healthz` と `/readyz` をプローブし、Gateway の CPU/RSS
    証拠を記録し、ライブ OpenAI ターンを実行して、敵対的診断を確認します。
    `OPENAI_API_KEY` などのライブ OpenAI 認証が必要です。ハイドレート済みの Testbox
    セッションでは、`openclaw-testbox-env` ヘルパーが存在する場合、Testbox のライブ認証プロファイルを自動的に読み込みます。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチと小さなモック QA Lab シナリオパック
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) を実行し、結合された CPU 観測
    サマリーを `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは持続的な高 CPU 観測のみをフラグします（`--cpu-core-warn`
    と `--hot-wall-warn-ms`）。そのため、短い起動時バーストは、数分続く Gateway
    固着リグレッションのように見せずにメトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使用します。チェックアウトに新しいランタイム出力がまだない場合は、
    先にビルドを実行します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - ライブ実行では、ゲストで実用的な、サポート済みの QA 認証入力を転送します:
    env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、存在する場合は `CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるように、
    リポジトリルート配下に置く必要があります。
  - 通常の QA レポートとサマリーに加え、Multipass ログを
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業用に Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内にグローバルインストールし、
    非対話型の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram
    を設定し、パッケージ化された Plugin ランタイムが起動時の依存関係修復なしで読み込まれることを検証し、
    doctor を実行し、モックされた OpenAI エンドポイントに対してローカルエージェントのターンを 1 回実行します。
  - Discord で同じパッケージ化インストールレーンを実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストのトランスクリプト向けに、決定的なビルド済みアプリ Docker スモークを実行します。
    隠された OpenClaw ランタイムコンテキストが、表示されるユーザーターンに漏れず、
    非表示のカスタムメッセージとして永続化されることを検証したうえで、影響を受ける壊れたセッション JSONL
    をシードし、`openclaw doctor --fix` がバックアップ付きでそれをアクティブブランチへ書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内に OpenClaw パッケージ候補をインストールし、インストール済みパッケージの
    オンボーディングを実行し、インストール済み CLI 経由で Telegram を設定してから、そのインストール済みパッケージを
    SUT Gateway としてライブ Telegram QA レーンを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。
    レジストリからインストールする代わりに解決済みのローカル tarball をテストするには、
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使用します。
    CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて
    `OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定します。CI に
    `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットが存在する場合、
    Docker ラッパーは Convex を自動的に選択します。
  - ラッパーは、Docker のビルド/インストール作業の前に、ホスト上で Telegram または Convex
    認証情報 env を検証します。認証情報前のセットアップを意図的にデバッグする場合にのみ、
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` を設定します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに限って共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions はこのレーンを手動メンテナー用ワークフロー
    `NPM Telegram Beta E2E` として公開します。マージ時には実行されません。このワークフローは
    `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- GitHub Actions は、1 つの候補パッケージに対するサイド実行のプロダクト証明用に
  `Package Acceptance` も公開しています。信頼済み ref、公開済み npm spec、
  SHA-256 付き HTTPS tarball URL、または別の実行からの tarball アーティファクトを受け付け、
  正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、
  既存の Docker E2E スケジューラーを、smoke、package、product、full、または custom
  レーンプロファイルで実行します。同じ `package-under-test` アーティファクトに対して
  Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新ベータのプロダクト証明:

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
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI を設定した状態で Gateway
    を起動してから、設定編集によって同梱チャネル/Plugins を有効化します。
  - セットアップ検出で、未設定のダウンロード可能な Plugins が存在しないままであること、
    最初に設定された doctor 修復で、欠落している各ダウンロード可能 Plugin が明示的にインストールされること、
    2 回目の再起動で隠れた依存関係修復が実行されないことを検証します。
  - 既知の古い npm ベースラインもインストールし、`openclaw update --tag <candidate>`
    を実行する前に Telegram を有効化し、候補の更新後 doctor が、ハーネス側の postinstall
    修復なしでレガシー Plugin 依存関係の残骸をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージ化インストール更新スモークを実行します。
    選択された各プラットフォームは、最初に要求されたベースラインパッケージをインストールし、
    次に同じゲスト内でインストール済みの `openclaw update` コマンドを実行して、
    インストール済みバージョン、更新ステータス、Gateway readiness、ローカルエージェントターン 1 回を検証します。
  - 1 つのゲストで反復する場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使用します。
    サマリーアーティファクトパスとレーンごとのステータスには `--json` を使用します。
  - OpenAI レーンは、デフォルトでライブエージェントターン証明に `openai/gpt-5.5` を使用します。
    別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、
    `OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels トランスポートの停止がテスト時間枠の残りを消費しないように、
    長いローカル実行はホストの timeout でラップします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトはネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。
    外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log`
    を確認します。
  - Windows 更新では、冷えたゲスト上で更新後 doctor とパッケージ更新作業に 10 分から 15 分かかる場合があります。
    ネストされた npm デバッグログが進行しているなら、これは正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux スモークレーンと並列に実行しないでください。
    それらは VM 状態を共有しており、スナップショット復元、パッケージ配信、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後証明では、通常の同梱 Plugin サーフェスを実行します。これは、音声、画像生成、メディア理解などの
    ケイパビリティファサードが、エージェントターン自体では単純なテキスト応答のみを確認する場合でも、
    同梱ランタイム API 経由で読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接プロトコルスモークテスト用に、ローカル AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel homeserver に対して Matrix ライブ QA レーンを実行します。ソースチェックアウトのみです — パッケージ化インストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、env vars、アーティファクトレイアウト: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - env の driver と SUT bot トークンを使用して、実際の非公開グループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ id は数値の Telegram chat id である必要があります。
  - 共有プール認証情報用に `--credential-source convex` をサポートします。デフォルトでは env モードを使用し、プールされたリースを選ぶには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで
    アーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じ非公開グループ内の 2 つの異なる bot が必要で、SUT bot は Telegram username を公開している必要があります。
  - 安定した bot 間観測のために、両方の bot で `@BotFather` の Bot-to-Bot Communication Mode を有効化し、driver bot がグループの bot トラフィックを観測できるようにします。
  - Telegram QA レポート、サマリー、観測メッセージアーティファクトを `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、driver の送信リクエストから観測された SUT 返信までの RTT が含まれます。

ライブトランスポートレーンは、新しいトランスポートが逸脱しないように 1 つの標準契約を共有します。レーンごとのカバレッジマトリクスは [QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、そのマトリクスの一部ではありません。

### Convex 経由の共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、
QA lab は Convex ベースのプールから排他的リースを取得し、レーンの実行中は
そのリースに Heartbeat し、シャットダウン時にリースを解放します。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例 `https://your-deployment.convex.site`）
- 選択されたロール用のシークレット 1 つ:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` は `maintainer` 用
  - `OPENCLAW_QA_CONVEX_SECRET_CI` は `ci` 用
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - Env デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルト `ci`、それ以外では `maintainer`）

任意の env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback の `http://` Convex URL を許可します。

`OPENCLAW_QA_CONVEX_SITE_URL` は通常運用では `https://` を使用する必要があります。

メンテナー管理コマンド（pool add/remove/list）には、特に
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を出力せずに Convex サイト URL、ブローカーシークレット、
エンドポイントプレフィックス、HTTP タイムアウト、admin/list の到達性を確認します。スクリプトや CI
ユーティリティで機械可読の出力が必要な場合は `--json` を使用します。

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

Telegram 種別のペイロード形式:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形式を検証し、不正な形式のペイロードを拒否します。

### QA にチャンネルを追加する

新しいチャンネルアダプターのアーキテクチャとシナリオヘルパー名は、[QA 概要 → チャンネルを追加する](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低限必要なことは、共有 `qa-lab` ホスト seam 上でトランスポートランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成することです。

## テストスイート（どこで何が実行されるか）

これらのスイートは「現実性が高まる」（そして不安定さ/コストも高まる）ものとして考えてください:

### ユニット / 統合（デフォルト）

- コマンド: `pnpm test`
- 設定: ターゲット指定のない実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定に展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下のコア/ユニットインベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- 範囲:
  - 純粋なユニットテスト
  - インプロセス統合テスト（Gateway 認証、ルーティング、ツール処理、解析、設定）
  - 既知のバグに対する決定的なリグレッション
- 期待事項:
  - CI で実行される
  - 実キーは不要
  - 高速かつ安定しているべき
  - リゾルバーと公開サーフェスローダーのテストでは、実際のバンドル Plugin ソース API ではなく、生成した小さな Plugin フィクスチャを使って、広い `api.js` と
    `runtime-api.js` のフォールバック動作を証明する必要があります。実際の Plugin API ロードは、
    Plugin 所有の契約/統合スイートに属します。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - ターゲット指定のない `pnpm test` は、1 つの巨大なネイティブルートプロジェクトプロセスではなく、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/extension の作業が無関係なスイートを枯渇させることを避けられます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。マルチシャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付き lane にルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付き lane に展開します。直接のテスト編集、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフの依存先が対象です。設定/セットアップ/package の編集では、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用しない限り、テストを広範囲に実行しません。
    - `pnpm check:changed` は、狭い作業に対する通常のスマートなローカルチェックゲートです。差分を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン更新では、対象を絞った version/config/root-dependency チェックを実行し、トップレベルの version フィールド以外の package 変更を拒否するガードがあります。
    - Live Docker ACP ハーネスの編集では、絞り込んだチェックを実行します。live Docker 認証スクリプトのシェル構文と、live Docker スケジューラーの dry-run です。`package.json` の変更は、差分が `scripts["test:docker:live-*"]` に限定されている場合のみ含まれます。依存関係、export、version、その他の package サーフェスの編集では、引き続きより広いガードを使用します。
    - agents、commands、plugins、auto-reply ヘルパー、`plugin-sdk`、および同様の純粋なユーティリティ領域からの import-light ユニットテストは、`unit-fast` lane にルーティングされます。この lane は `test/setup-openclaw-runtime.ts` をスキップします。状態を持つ/ランタイム負荷の高いファイルは既存の lane に残ります。
    - 選択された `plugin-sdk` と `commands` のヘルパーソースファイルも、changed-mode 実行をそれらの軽量 lane の明示的な兄弟テストにマッピングするため、ヘルパー編集でそのディレクトリ全体の重いスイートを再実行せずに済みます。
    - `auto-reply` には、トップレベルのコアヘルパー、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、1 つの import-heavy なバケットが Node の末尾全体を占有しないようにしています。
    - 通常の PR/main CI は、extension バッチスイープとリリース専用の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補に対してこれらの plugin/extension-heavy スイート用の別個の `Plugin Prerelease` 子ワークフローをディスパッチします。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - message-tool discovery 入力や compaction ランタイム
      コンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化の
      境界に対して、焦点を絞ったヘルパーリグレッションを追加してください。
    - 埋め込みランナー統合スイートを正常に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, and
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - これらのスイートは、スコープ付き ID と compaction 動作が実際の `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。ヘルパーのみのテストは、これらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - ベース Vitest 設定のデフォルトは `threads` です。
    - 共有 Vitest 設定は `isolate: false` を固定し、ルートプロジェクト、e2e、live 設定全体で
      非分離ランナーを使用します。
    - ルート UI lane は `jsdom` セットアップとオプティマイザーを維持しますが、同じく
      共有の非分離ランナー上で実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false`
      デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 コンパイル負荷を減らすため、Vitest 子 Node
      プロセスにデフォルトで `--no-maglev` を追加します。
      標準の V8
      動作と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` は、差分がどのアーキテクチャ lane をトリガーするかを表示します。
    - pre-commit hook はフォーマットのみです。フォーマット済みファイルを再ステージし、
      lint、typecheck、テストは実行しません。
    - スマートなローカルチェックゲートが必要な場合は、引き渡しまたは push の前に
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付き lane を経由します。エージェントが
      ハーネス、設定、package、契約の編集に本当に広い
      Vitest カバレッジが必要だと判断した場合のみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング
      動作を維持し、worker 上限だけを高くします。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストの load average がすでに高い場合は抑制されるため、複数の同時
      Vitest 実行による影響はデフォルトで小さくなります。
    - ベース Vitest 設定は、projects/config ファイルを
      `forceRerunTriggers` としてマークし、テスト配線が変更されたときの changed-mode 再実行が正しく保たれるようにしています。
    - 設定は、サポートされる
      ホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接プロファイリング用に
      1 つの明示的なキャッシュ場所が必要な場合は `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` は、Vitest の import-duration レポートと
      import-breakdown 出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを
      `origin/main` 以降に変更されたファイルにスコープします。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。
      設定全体の実行では設定パスをキーとして使用します。include-pattern CI
      シャードではシャード名を追加するため、フィルター済みシャードを個別に追跡できます。
    - 1 つのホットテストが依然として起動時 import にほとんどの時間を費やす場合は、
      重い依存関係を狭いローカル `*.runtime.ts` seam の背後に置き、
      それらを `vi.mock(...)` に渡すためだけに runtime ヘルパーを deep-import するのではなく、
      その seam を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み差分について、ルーティングされた
      `test:changed` とネイティブルートプロジェクトパスを比較し、
      wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイルリストを
      `scripts/test-projects.mjs` とルート Vitest 設定にルーティングすることで、現在の
      dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッドに対する main-thread CPU profile を書き込みます。
    - `pnpm test:perf:profile:runner` は、ファイル並列化を無効にした
      ユニットスイート用の runner CPU+heap profile を書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（Gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 worker に強制
- 範囲:
  - デフォルトで診断を有効にした実際の loopback Gateway を起動する
  - 合成 Gateway メッセージ、メモリ、大容量ペイロードの churn を診断イベントパス経由で流す
  - Gateway WS RPC 経由で `diagnostics.stability` をクエリする
  - 診断安定性バンドルの永続化ヘルパーをカバーする
  - レコーダーが bounded のままであること、合成 RSS サンプルが pressure budget を下回ること、セッションごとのキュー深度がゼロに戻ることをアサートする
- 期待事項:
  - CI-safe かつ keyless
  - 安定性リグレッションのフォローアップ用の狭い lane であり、完全な Gateway スイートの代替ではない

### E2E（Gateway smoke）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の同梱Plugin E2E テスト
- ランタイムのデフォルト:
  - リポジトリの他の部分と同様に、`isolate: false` の Vitest `threads` を使用します。
  - 適応型ワーカーを使用します (CI: 最大 2、ローカル: デフォルトで 1)。
  - コンソール I/O のオーバーヘッドを減らすため、デフォルトではサイレントモードで実行します。
- 便利なオーバーライド:
  - `OPENCLAW_E2E_WORKERS=<n>` でワーカー数を強制します (上限は 16)。
  - `OPENCLAW_E2E_VERBOSE=1` で詳細なコンソール出力を再度有効にします。
- スコープ:
  - 複数インスタンスの Gateway のエンドツーエンド動作
  - WebSocket/HTTP サーフェス、ノードペアリング、およびより重いネットワーク処理
- 期待値:
  - CI で実行されます (パイプラインで有効化されている場合)
  - 実際のキーは不要です
  - ユニットテストよりも可動部分が多いです (遅くなる場合があります)

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell Gateway を起動します
  - 一時的なローカル Dockerfile から sandbox を作成します
  - 実際の `sandbox ssh-config` + SSH exec を通じて OpenClaw の OpenShell バックエンドを実行します
  - sandbox fs ブリッジを通じて、リモートを正規とするファイルシステム動作を検証します
- 期待値:
  - オプトインのみです。デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLI と動作する Docker デーモンが必要です
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト Gateway と sandbox を破棄します
- 便利なオーバーライド:
  - `OPENCLAW_E2E_OPENSHELL=1` で、より広い e2e スイートを手動実行するときにテストを有効にします
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` で、デフォルトではない CLI バイナリまたはラッパースクリプトを指定します

### ライブ (実際のプロバイダー + 実際のモデル)

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下の同梱Plugin ライブテスト
- デフォルト: `pnpm test:live` により **有効** になります (`OPENCLAW_LIVE_TEST=1` を設定)
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で _今日_ 本当に動作するか？」
  - プロバイダーの形式変更、ツール呼び出しの癖、認証の問題、レート制限の動作を捕捉します
- 期待値:
  - 設計上、CI で安定するものではありません (実際のネットワーク、実際のプロバイダーポリシー、クォータ、障害)
  - 費用がかかるか、レート制限を消費します
  - 「すべて」ではなく、絞り込んだサブセットの実行を推奨します
- ライブ実行では、不足している API キーを取得するために `~/.profile` を読み込みます。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定/認証素材を一時テストホームにコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更することはありません。
- ライブテストで実際のホームディレクトリを使用する必要が意図的にある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードをデフォルトにしています。`[live] ...` の進捗出力は保持しますが、追加の `~/.profile` 通知を抑制し、Gateway ブートストラップログ/Bonjour の雑音をミュートします。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーローテーション (プロバイダー固有): `*_API_KEYS` にカンマ/セミコロン形式で設定するか、`*_API_KEY_1`、`*_API_KEY_2` (例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`) を設定するか、`OPENCLAW_LIVE_*_KEY` でライブごとのオーバーライドを設定します。テストはレート制限レスポンス時にリトライします。
- 進捗/Heartbeat 出力:
  - ライブスイートは stderr に進捗行を出力するようになったため、Vitest のコンソールキャプチャが静かな場合でも、長時間のプロバイダー呼び出しがアクティブであることが見えます。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効にするため、ライブ実行中にプロバイダー/Gateway の進捗行がすぐにストリームされます。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきですか？

この判断表を使用してください:

- ロジック/テストの編集: `pnpm test` を実行します (多く変更した場合は `pnpm test:coverage` も)
- Gateway ネットワーク / WS プロトコル / ペアリングに触れる場合: `pnpm test:e2e` を追加します
- 「自分の bot が落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグする場合: 絞り込んだ `pnpm test:live` を実行します

## ライブ (ネットワークに触れる) テスト

ライブモデルマトリックス、CLI バックエンドスモーク、ACP スモーク、Codex app-server
ハーネス、およびすべてのメディアプロバイダーライブテスト (Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス)、さらにライブ実行の認証情報処理については、
[ライブスイートのテスト](/ja-JP/help/testing-live) を参照してください。専用の更新および
Plugin 検証チェックリストについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

## Docker ランナー (任意の「Linux で動作する」チェック)

これらの Docker ランナーは 2 つの区分に分かれます:

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリ Docker イメージ内で対応するプロファイルキーのライブファイルのみを実行し (`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`)、ローカル設定ディレクトリとワークスペースをマウントします (マウントされている場合は `~/.profile` も読み込みます)。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker ライブランナーは、フル Docker スイープを実用的に保つため、デフォルトで小さめのスモーク上限を使います:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12` になり、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` になります。より大きな網羅的スキャンを
  明示的に求める場合は、これらの env var をオーバーライドしてください。
- `test:docker:all` は `test:docker:live-build` 経由でライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックし、その後 2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用します。ベアイメージは install/update/plugin-dependency レーン用の Node/Git ランナーのみで、これらのレーンは事前ビルドされた tarball をマウントします。機能イメージは、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールします。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあります。`scripts/test-docker-all.mjs` は選択されたプランを実行します。集約では重み付きローカルスケジューラーを使用します。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限により、重いライブ、npm-install、複数サービスのレーンが一斉に開始されないようにします。単一レーンが有効な上限より重い場合でも、プールが空ならスケジューラーは開始でき、その後キャパシティが再び利用可能になるまで単独で実行し続けます。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` は、Docker ホストに余裕がある場合にのみ調整してください。ランナーはデフォルトで Docker プリフライトを実行し、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、以降の実行でそのタイミングを使って長いレーンから先に開始します。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、パッケージ/イメージの必要性、および認証情報について CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用します。
- `Package Acceptance` は、「このインストール可能な tarball は製品として動作するか？」を確認する GitHub ネイティブのパッケージゲートです。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から 1 つの候補パッケージを解決し、それを `package-under-test` としてアップロードしたうえで、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。プロファイルは広さの順に並んでいます: `smoke`、`package`、`product`、`full`。パッケージ/更新/Plugin 契約、公開済みアップグレードの生存マトリックス、リリースデフォルト、失敗トリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。
- ビルドおよびリリースチェックは、tsdown の後に `scripts/check-cli-bootstrap-imports.mjs` を実行します。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的ビルド済みグラフをたどり、コマンドディスパッチ前のプリディスパッチ起動が、Commander、プロンプト UI、undici、ログ出力などのパッケージ依存関係をインポートしている場合に失敗します。また、同梱 Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否します。パッケージ化された CLI スモークでは、ルートヘルプ、onboard ヘルプ、doctor ヘルプ、status、config schema、およびモデルリストコマンドもカバーします。
- Package Acceptance のレガシー互換性は `2026.4.25` (`2026.4.25-beta.*` を含む) までに制限されています。そのカットオフまでは、ハーネスは出荷済みパッケージのメタデータ欠落のみを許容します: 省略された private QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落パッチファイル、永続化されない `update.channel`、レガシー Plugin インストールレコードの場所、marketplace インストールレコード永続化の欠落、および `plugins update` 中の設定メタデータ移行です。`2026.4.25` より後のパッケージでは、これらのパスは厳密な失敗になります。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1 つ以上の実コンテナを起動し、より高レベルの統合パスを検証します。

ライブモデル Docker ランナーは、必要な CLI 認証ホームのみ (または実行が絞り込まれていない場合はサポートされるすべてのもの) も bind mount し、実行前にそれらをコンテナホームにコピーするため、外部 CLI OAuth はホスト認証ストアを変更せずにトークンを更新できます:

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ACP バインド smoke: `pnpm test:docker:live-acp-bind` (スクリプト: `scripts/test-live-acp-bind-docker.sh`; デフォルトで Claude、Codex、Gemini を対象にし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` により Droid/OpenCode を厳格にカバー)
- CLI バックエンド smoke: `pnpm test:docker:live-cli-backend` (スクリプト: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (スクリプト: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` はプライベート QA ソースチェックアウトレーンです。npm tarball では QA Lab が省かれるため、意図的にパッケージ Docker リリースレーンには含めていません。
- Open WebUI live smoke: `pnpm test:docker:openwebui` (スクリプト: `scripts/e2e/openwebui-docker.sh`)
- オンボーディング ウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- Npm tarball オンボーディング/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` は、パック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、env-ref オンボーディング経由で OpenAI を構成し、デフォルトで Telegram も構成し、doctor を実行して、モックされた OpenAI agent turn を 1 回実行します。ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホスト再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を使い、channel を切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` または `OPENCLAW_NPM_ONBOARD_CHANNEL=slack` を使います。
- 更新 channel 切り替え smoke: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、パッケージ `stable` から git `dev` に切り替え、永続化された channel と更新後の Plugin 動作を検証し、その後パッケージ `stable` に戻して更新ステータスを確認します。
- アップグレード survivor smoke: `pnpm test:docker:upgrade-survivor` は、agents、channel config、Plugin allowlist、古い Plugin 依存関係状態、既存の workspace/session files を含む汚れた旧ユーザーフィクスチャの上に、パック済みの OpenClaw tarball をインストールします。live provider や channel keys なしでパッケージ更新と非対話 doctor を実行し、その後 loopback Gateway を起動して、config/state の保持と startup/status budgets を確認します。
- 公開版アップグレード survivor smoke: `pnpm test:docker:published-upgrade-survivor` はデフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、組み込みのコマンドレシピでそのベースラインを構成し、結果の config を検証し、公開済みインストールを候補 tarball に更新し、非対話 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、構成済み intents、state preservation、startup、`/healthz`、`/readyz`、RPC status budgets を確認します。1 つのベースラインを上書きするには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` を使い、集約スケジューラーに `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような厳密なローカルベースラインを展開させるには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` を使い、`reported-issues` のような issue 形状のフィクスチャを展開するには `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を使います。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれます。Package Acceptance はこれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` のようなメタベースライントークンを解決し、Full Release Validation は release-soak パッケージ gate を `last-stable-4 2026.4.23 2026.5.2 2026.4.15` と `reported-issues` に展開します。
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` は、隠し runtime context の transcript 永続化と、影響を受けた重複 prompt-rewrite branches の doctor 修復を検証します。
- Bun グローバルインストール smoke: `bash scripts/e2e/bun-global-install-smoke.sh` は現在のツリーをパックし、隔離された home 内で `bun install -g` を使ってインストールし、`openclaw infer image providers --json` がハングせずに同梱 image providers を返すことを検証します。ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` を使い、ビルド済み Docker image から `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使います。
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm containers の間で 1 つの npm cache を共有します。Update smoke は、候補 tarball へアップグレードする前の stable ベースラインとして、デフォルトで npm `latest` を使います。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke workflow の `update_baseline_version` input で上書きします。非 root installer checks では隔離された npm cache を維持するため、root 所有の cache entries が user-local install behavior を隠しません。ローカル再実行で root/update/direct-npm cache を再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は、`OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` により重複する direct-npm global update をスキップします。直接の `npm install -g` カバレッジが必要な場合は、その env なしでローカルにスクリプトを実行します。
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) はデフォルトでルート Dockerfile image をビルドし、隔離された container home に 1 つの workspace を持つ 2 つの agents をシードし、`agents delete --json` を実行し、有効な JSON と保持された workspace behavior を検証します。install-smoke image を再利用するには `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使います。
- Gateway networking (2 つの containers、WS auth + health): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) は、source E2E image と Chromium layer をビルドし、raw CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP role snapshots が link URLs、cursor-promoted clickables、iframe refs、frame metadata をカバーすることを検証します。
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) は、モックされた OpenAI server を Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後 provider schema reject を強制して raw detail が Gateway logs に現れることを確認します。
- MCP channel bridge (シード済み Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (実際の stdio MCP server + 埋め込み Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (実際の Gateway + 隔離された cron と one-shot subagent runs 後の stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (ローカルパス、`file:`、hoisted dependencies を含む npm registry、git moving refs、ClawHub kitchen-sink、marketplace updates、Claude-bundle enable/inspect の install/update smoke): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトの kitchen-sink package/runtime pair を上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を使います。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub fixture server を使います。
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin lifecycle matrix smoke: `pnpm test:docker:plugin-lifecycle-matrix` は、パック済みの OpenClaw tarball を空の container にインストールし、npm Plugin をインストールし、enable/disable を切り替え、ローカル npm registry 経由で upgrade/downgrade し、インストール済みコードを削除し、その後 uninstall が古い state を引き続き削除することを検証しつつ、各 lifecycle phase の RSS/CPU metrics をログに記録します。
- Config reload metadata smoke: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` は、ローカルパス、`file:`、hoisted dependencies を含む npm registry、git moving refs、ClawHub fixtures、marketplace updates、Claude-bundle enable/inspect の install/update smoke をカバーします。`pnpm test:docker:plugin-update` は、インストール済み Plugin の unchanged update behavior をカバーします。`pnpm test:docker:plugin-lifecycle-matrix` は、resource-tracked npm Plugin の install、enable、disable、upgrade、downgrade、missing-code uninstall をカバーします。

共有 functional image を手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のような suite-specific image overrides は、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` が remote shared image を指す場合、scripts はそれがまだローカルにないときに pull します。QR と installer Docker tests は、共有 built-app runtime ではなく package/install behavior を検証するため、独自の Dockerfiles を維持します。

ライブモデルの Docker ランナーは、現在のチェックアウトも読み取り専用でバインドマウントし、コンテナー内の一時 workdir にステージングします。これにより、ランタイムイメージをスリムに保ちながら、正確なローカルソース/設定に対して Vitest を実行できます。ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build`、Gradle 出力ディレクトリなど、大きなローカル専用キャッシュやアプリのビルド出力をスキップするため、Docker ライブ実行でマシン固有のアーティファクトのコピーに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、Gateway のライブプローブがコンテナー内で実際の Telegram/Discord などのチャンネルワーカーを起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンから Gateway ライブカバレッジを絞り込む、または除外する必要がある場合は、`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルな互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした OpenClaw Gateway コンテナーを起動し、その Gateway に対して固定された Open WebUI コンテナーを起動し、Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証してから、Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
初回実行は、Docker が Open WebUI イメージを取得する必要があったり、Open WebUI が独自のコールドスタートセットアップを完了する必要があったりするため、目に見えて遅くなる場合があります。
このレーンでは使用可能なライブモデルキーが必要で、Docker 化された実行では `OPENCLAW_PROFILE_FILE`（デフォルトは `~/.profile`）がそれを提供する主な方法です。
成功した実行では、`{ "ok": true, "model": "openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の Telegram、Discord、iMessage アカウントは必要ありません。シード済みの Gateway コンテナーを起動し、`openclaw mcp serve` を生成する 2 つ目のコンテナーを起動してから、ルーティングされた会話の検出、トランスクリプト読み取り、添付ファイルメタデータ、ライブイベントキューの挙動、送信ルーティング、実際の stdio MCP ブリッジ上の Claude 形式のチャンネル + 権限通知を検証します。通知チェックは生の stdio MCP フレームを直接検査するため、このスモークは特定のクライアント SDK がたまたま表面化する内容だけでなく、ブリッジが実際に出力する内容を検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、ライブモデルキーは必要ありません。リポジトリの Docker イメージをビルドし、コンテナー内で実際の stdio MCP プローブサーバーを起動し、埋め込み Pi バンドル MCP ランタイム経由でそのサーバーを実体化し、ツールを実行してから、`coding` と `messaging` が `bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルタリングすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデルキーは必要ありません。実際の stdio MCP プローブサーバーを持つシード済み Gateway を起動し、分離された cron ターンと `/subagents spawn` のワンショット子ターンを実行してから、MCP 子プロセスが各実行後に終了することを検証します。

手動 ACP 平易文スレッドスモーク（CI ではありません）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な環境変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な設定/ワークスペースディレクトリを使用し、外部 CLI 認証マウントなしで、`OPENCLAW_PROFILE_FILE` から source された環境変数のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` にコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推論された必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きします
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` は実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` はコンテナー内のプロバイダーをフィルタリングします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、リビルド不要の再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報が環境変数ではなくプロファイルストアから来ることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI スモーク用に Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI スモークで使用する nonce チェックプロンプトを上書きします
- `OPENWEBUI_IMAGE=...` は、固定された Open WebUI イメージタグを上書きします

## ドキュメントの健全性確認

ドキュメント編集後にドキュメントチェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全な Mintlify アンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフライン回帰（CI セーフ）

これらは実プロバイダーを使わない「実パイプライン」回帰です:

- Gateway ツール呼び出し（モック OpenAI、実 Gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定を書き込み + 認証を強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性評価（Skills）

「エージェント信頼性評価」のように振る舞う CI セーフなテストは、すでにいくつかあります:

- 実 Gateway + エージェントループを通したモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **判断:** プロンプトに Skills が列挙されている場合、エージェントは正しい skill を選ぶか（または無関係なものを避けるか）?
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか?
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界をアサートするマルチターンシナリオ。

将来の評価は、まず決定的であるべきです:

- ツール呼び出し + 順序、skill ファイル読み取り、セッション配線をアサートする、モックプロバイダーを使ったシナリオランナー。
- skill に焦点を当てた小さなシナリオスイート（使用 vs 回避、ゲーティング、プロンプトインジェクション）。
- CI セーフなスイートが整ってからの、任意のライブ評価（オプトイン、環境変数でゲート）。

## 契約テスト（Plugin とチャンネルの形状）

契約テストは、登録されたすべての Plugin とチャンネルがそのインターフェース契約に準拠していることを検証します。検出されたすべての plugins を反復し、形状と挙動のアサーションスイートを実行します。デフォルトの `pnpm test` ユニットレーンは、これらの共有シームとスモークファイルを意図的にスキップします。共有チャンネルまたはプロバイダーのサーフェスに触れる場合は、契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャンネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャンネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本 Plugin 形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディングの挙動
- **outbound-payload** - メッセージペイロード構造
- **inbound** - 受信メッセージ処理
- **actions** - チャンネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/ロスター API
- **group-policy** - グループポリシー適用

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャンネルステータスプローブ
- **registry** - Plugin レジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証の選択/選定
- **catalog** - モデルカタログ API
- **discovery** - Plugin 検出
- **loader** - Plugin 読み込み
- **runtime** - プロバイダーランタイム
- **shape** - Plugin 形状/インターフェース
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdk のエクスポートまたはサブパスを変更した後
- チャンネルまたはプロバイダー Plugin を追加または変更した後
- Plugin 登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## 回帰の追加（ガイダンス）

ライブで発見されたプロバイダー/モデルの問題を修正する場合:

- 可能であれば CI セーフな回帰を追加してください（モック/スタブプロバイダー、または正確なリクエスト形状変換のキャプチャ）
- 本質的にライブ専用の場合（レート制限、認証ポリシー）は、ライブテストを狭く保ち、環境変数経由でオプトインにしてください
- バグを捕捉する最小のレイヤーを対象にすることを優先してください:
  - プロバイダーのリクエスト変換/再生バグ → 直接のモデルテスト
  - Gateway のセッション/履歴/ツールパイプラインバグ → Gateway ライブスモークまたは CI セーフな Gateway モックテスト
- SecretRef トラバーサルガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとにサンプリングされたターゲットを 1 つ導出し、トラバーサルセグメント exec ID が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef ターゲットファミリーを追加する場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは未分類のターゲット ID で意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。

## 関連

- [ライブのテスト](/ja-JP/help/testing-live)
- [更新と plugins のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
