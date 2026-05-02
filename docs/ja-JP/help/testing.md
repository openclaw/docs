---
read_when:
    - ローカルまたはCIでテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway とエージェントの動作のデバッグ
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-05-02T04:58:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（ユニット/インテグレーション、e2e、live）と小さな Docker ランナー群があります。このドキュメントは「テスト方法」のガイドです。

- 各スイートがカバーする内容（および意図的にカバーしない内容）。
- 一般的なワークフロー（ローカル、プッシュ前、デバッグ）で実行するコマンド。
- live テストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダーの問題に対するリグレッションを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、live transport レーン）**は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — アーキテクチャ、コマンド面、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) — `pnpm openclaw qa matrix` のリファレンス。
- [QA channel](/ja-JP/channels/qa-channel) — リポジトリ支援シナリオで使用される合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行について説明します。下の QA 固有ランナーセクション（[QA 固有ランナー](#qa-specific-runners)）には具体的な `qa` 呼び出しを一覧し、上記のリファレンスに戻るリンクを示します。
</Note>

## クイックスタート

通常は次を使います。

- フルゲート（プッシュ前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接ファイル指定は extension/channel パスにもルーティングされるようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復しているときは、まず対象を絞った実行を優先してください。
- Docker 支援 QA サイト: `pnpm qa:lab:up`
- Linux VM 支援 QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストを変更したとき、または追加の信頼性が必要なとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（モデル + Gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live モデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さなファイル読み取り風プローブを実行します。
    メタデータが `image` 入力を示すモデルは、小さな画像ターンも実行します。
    プロバイダーの失敗を切り分けるときは、追加プローブを `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で無効化してください。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` はどちらも、`include_live_suites: true` で再利用可能な live/E2E ワークフローを呼び出します。これには、プロバイダーごとにシャーディングされた個別の Docker live モデルマトリックスジョブが含まれます。
  - 焦点を絞った CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)` をディスパッチしてください。
  - 新しい高シグナルのプロバイダーシークレットは、`scripts/ci-hydrate-live-auth.sh` に加え、
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` とそのスケジュール/リリース呼び出し元に追加してください。
- ネイティブ Codex bound-chat スモーク: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live レーンを実行し、`/codex bind` で合成 Slack DM をバインドし、`/codex fast` と
    `/codex permissions` を実行した後、通常の返信と画像添付が ACP ではなくネイティブ Plugin バインディングを通ってルーティングされることを検証します。
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness`
  - Plugin が所有する Codex app-server ハーネスを通して Gateway エージェントターンを実行し、
    `/codex status` と `/codex models` を検証します。デフォルトでは画像、cron MCP、サブエージェント、Guardian プローブも実行します。他の Codex app-server の失敗を切り分けるときは、サブエージェントプローブを
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` で無効化してください。サブエージェントに絞ったチェックでは、他のプローブを無効化してください:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    これは `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、サブエージェントプローブ後に終了します。
- Crestodian rescue コマンドスモーク: `pnpm test:live:crestodian-rescue-channel`
  - メッセージチャンネル rescue コマンド面に対する任意参加の念入りなチェックです。
    `/crestodian status` を実行し、永続的なモデル変更をキューに入れ、`/crestodian yes` に返信し、監査/設定書き込みパスを検証します。
- Crestodian planner Docker スモーク: `pnpm test:docker:crestodian-planner`
  - `PATH` 上の偽 Claude CLI を使って設定なしコンテナ内で Crestodian を実行し、fuzzy planner フォールバックが監査付きの型付き設定書き込みに変換されることを検証します。
- Crestodian 初回実行 Docker スモーク: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw 状態ディレクトリから開始し、裸の `openclaw` を Crestodian にルーティングし、setup/model/agent/Discord Plugin + SecretRef 書き込みを適用し、設定を検証し、監査エントリを検証します。同じ Ring 0 セットアップパスは QA Lab でも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によりカバーされています。
- Moonshot/Kimi コストスモーク: `MOONSHOT_API_KEY` を設定した状態で、
  `openclaw models list --provider moonshot --json` を実行し、その後、分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を `moonshot/kimi-k2.6` に対して実行します。JSON が Moonshot/K2.6 を報告し、アシスタントのトランスクリプトに正規化された `usage.cost` が保存されることを検証します。

<Tip>
失敗ケースが 1 つだけ必要な場合は、下記の allowlist 環境変数で live テストを絞り込むことを優先してください。
</Tip>

## QA 固有ランナー

これらのコマンドは、QA-lab の現実性が必要なときにメインのテストスイートの横で使います。

CI は専用ワークフローで QA Lab を実行します。`Parity gate` は一致する PR と、モックプロバイダーを使った手動ディスパッチから実行されます。`QA-Lab - All Lanes` は `main` で毎晩実行され、手動ディスパッチからも、モック parity gate、live Matrix レーン、Convex 管理の live Telegram レーン、Convex 管理の live Discord レーンを並列ジョブとして実行します。スケジュール済み QA とリリースチェックは Matrix `--profile fast` を明示的に渡します。一方、Matrix CLI と手動ワークフロー入力のデフォルトは引き続き `all` です。手動ディスパッチでは `all` を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャーディングできます。`OpenClaw Release Checks` はリリース承認前に parity と高速 Matrix および Telegram レーンを実行し、リリーストランスポートチェックに `mock-openai/gpt-5.5` を使用します。これにより決定的になり、通常のプロバイダー Plugin 起動を回避できます。これらの live transport Gateway はメモリ検索を無効化します。メモリ動作は QA parity スイートで引き続きカバーされます。

フルリリースの live media シャードは
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。これにはすでに
`ffmpeg` と `ffprobe` が含まれています。Docker live モデル/バックエンドシャードは、選択されたコミットごとに一度だけビルドされる共有の
`ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各シャード内で再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` でそれを pull します。

- `pnpm openclaw qa suite`
  - リポジトリ支援 QA シナリオをホスト上で直接実行します。
  - 選択された複数シナリオを、分離された Gateway worker によりデフォルトで並列実行します。`qa-channel` のデフォルト同時実行数は 4 です（選択されたシナリオ数で上限設定）。worker 数を調整するには `--concurrency <count>` を使用し、古いシリアルレーンには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用してください。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、シナリオ認識型の `mock-openai` レーンを置き換えることなく、実験的なフィクスチャとプロトコルモックのカバレッジ用にローカルの AIMock 支援プロバイダーサーバーを起動します。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチに加えて、小さなモック QA Lab シナリオパック
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`）を実行し、`.artifacts/gateway-cpu-scenarios/` の下に統合 CPU 観測サマリーを書き込みます。
  - デフォルトでは継続的な高 CPU 観測のみをフラグします（`--cpu-core-warn`
    と `--hot-wall-warn-ms`）。そのため、短い起動バーストは、数分続く Gateway peg リグレッションのようには見えず、メトリクスとして記録されます。
  - ビルド済み `dist` アーティファクトを使用します。チェックアウトに新しいランタイム出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、ゲストで実用的なサポート済み QA 認証入力を転送します:
    env ベースのプロバイダーキー、QA live プロバイダー設定パス、存在する場合は `CODEX_HOME`。
  - 出力ディレクトリはリポジトリルート配下に留める必要があります。これにより、ゲストはマウントされたワークスペース経由で書き戻せます。
  - 通常の QA レポート + サマリーに加え、Multipass ログを
    `.artifacts/qa-e2e/...` の下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター風の QA 作業用に Docker 支援 QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内にグローバルインストールし、非対話型の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、パッケージ化された Plugin ランタイムが起動時依存関係修復なしでロードされることを検証し、doctor を実行し、モックされた OpenAI endpoint に対して 1 つのローカルエージェントターンを実行します。
  - Discord で同じパッケージインストールレーンを実行するには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストトランスクリプト用の決定的なビルド済みアプリ Docker スモークを実行します。隠し OpenClaw ランタイムコンテキストが、表示されるユーザーターンに漏れるのではなく、非表示のカスタムメッセージとして永続化されることを検証します。その後、影響を受ける壊れたセッション JSONL を seed し、`openclaw doctor --fix` がバックアップ付きでアクティブブランチへ書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - OpenClaw パッケージ候補を Docker にインストールし、インストール済みパッケージのオンボーディングを実行し、インストール済み CLI から Telegram を設定した後、そのインストール済みパッケージを SUT Gateway として live Telegram QA レーンを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。レジストリからインストールする代わりに解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使用します。CI/リリース自動化では、
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて
    `OPENCLAW_QA_CONVEX_SITE_URL` と role secret を設定します。CI に
    `OPENCLAW_QA_CONVEX_SITE_URL` と Convex role secret が存在する場合、Docker wrapper は Convex を自動選択します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに限り共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions では、このレーンを手動 maintainer ワークフロー
    `NPM Telegram Beta E2E` として公開しています。merge 時には実行されません。ワークフローは
    `qa-live-shared` environment と Convex CI credential lease を使用します。
- GitHub Actions では、1 つの候補パッケージに対するサイドランのプロダクト証明用に `Package Acceptance` も公開しています。信頼済み ref、公開済み npm spec、HTTPS tarball URL と SHA-256、または別 run からの tarball artifact を受け付け、正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードした後、既存の Docker E2E scheduler を smoke、package、product、full、または custom レーンプロファイルで実行します。同じ `package-under-test` artifact に対して Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta プロダクト証明:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL 証明には digest が必要です:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- アーティファクト証明は別の Actions 実行から tarball アーティファクトをダウンロードします。

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI を設定した状態で Gateway を起動してから、設定編集によって同梱のチャネル/Plugin を有効化します。
  - セットアップ検出で未設定のダウンロード可能 Plugin が存在しないままになること、最初の設定済み doctor 修復で不足している各ダウンロード可能 Plugin が明示的にインストールされること、2 回目の再起動で隠れた依存関係修復が実行されないことを検証します。
  - 既知の古い npm ベースラインもインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補の更新後 doctor がハーネス側の postinstall 修復なしでレガシー Plugin 依存関係の残骸をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体でネイティブのパッケージ済みインストール更新スモークを実行します。選択された各プラットフォームは、まず要求されたベースラインパッケージをインストールし、その後同じゲスト内でインストール済みの `openclaw update` コマンドを実行して、インストール済みバージョン、更新ステータス、Gateway の準備完了状態、1 回のローカルエージェントターンを検証します。
  - 1 つのゲストで反復する間は `--platform macos`、`--platform windows`、または `--platform linux` を使用します。サマリーアーティファクトパスとレーンごとのステータスには `--json` を使用します。
  - OpenAI レーンは、デフォルトでライブのエージェントターン証明に `openai/gpt-5.5` を使用します。別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels トランスポートの停止がテスト時間の残りを消費しないように、長いローカル実行はホスト側 timeout でラップします。

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトはネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認してください。
  - Windows 更新は、コールドゲスト上で更新後 doctor とパッケージ更新作業に 10 から 15 分かかることがあります。ネストされた npm デバッグログが進んでいるなら、これはまだ正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux スモークレーンと並行して実行しないでください。これらは VM 状態を共有しており、スナップショット復元、パッケージ配信、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後の証明は通常の同梱 Plugin サーフェスを実行します。これは、エージェントターン自体が単純なテキスト応答のみをチェックする場合でも、音声、画像生成、メディア理解などのケイパビリティ facade が同梱ランタイム API を通じて読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接のプロトコルスモークテスト用に、ローカルの AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker バック Tuwunel ホームサーバーに対して Matrix ライブ QA レーンを実行します。ソースチェックアウト専用です。パッケージ済みインストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、環境変数、アーティファクト配置: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - env からのドライバーおよび SUT ボットトークンを使い、実際の非公開グループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、および `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ id は数値の Telegram chat id である必要があります。
  - 共有プール済み認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使用するか、プール済み lease にオプトインするために `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが欲しい場合は `--allow-failures` を使用します。
  - 同じ非公開グループ内に 2 つの異なるボットが必要で、SUT ボットは Telegram ユーザー名を公開している必要があります。
  - 安定したボット間観測のために、両方のボットで `@BotFather` のボット間通信モードを有効化し、ドライバーボットがグループのボットトラフィックを観測できるようにしてください。
  - `.artifacts/qa-e2e/...` 配下に Telegram QA レポート、サマリー、観測メッセージアーティファクトを書き込みます。返信シナリオには、ドライバー送信リクエストから観測された SUT 返信までの RTT が含まれます。

ライブトランスポートレーンは 1 つの標準契約を共有するため、新しいトランスポートがずれません。レーンごとのカバレッジマトリックスは [QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、そのマトリックスの一部ではありません。

### Convex 経由の共有 Telegram 認証情報 (v1)

`openclaw qa telegram` で `--credential-source convex` (または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) が有効な場合、QA lab は Convex バックのプールから排他的 lease を取得し、レーンの実行中はその lease に Heartbeat を送信し、シャットダウン時に lease を解放します。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須の環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL` (例: `https://your-deployment.convex.site`)
- 選択されたロール用のシークレット 1 つ:
  - `maintainer` には `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` には `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - Env デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE` (CI では `ci`、それ以外では `maintainer` がデフォルト)

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (デフォルト `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (デフォルト `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (デフォルト `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (デフォルト `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (デフォルト `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (任意の trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback の `http://` Convex URL を許可します。

`OPENCLAW_QA_CONVEX_SITE_URL` は通常運用では `https://` を使用する必要があります。

メンテナー管理コマンド (プールの追加/削除/一覧) には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を出力せずに Convex サイト URL、ブローカーシークレット、エンドポイントプレフィックス、HTTP timeout、admin/list 到達性を確認します。スクリプトや CI ユーティリティで機械可読出力が必要な場合は `--json` を使用します。

デフォルトエンドポイント契約 (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/再試行可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功: `{ status: "ok" }` (または空の `2xx`)
- `POST /release`
  - リクエスト: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功: `{ status: "ok" }` (または空の `2xx`)
- `POST /admin/add` (maintainer シークレットのみ)
  - リクエスト: `{ kind, actorId, payload, note?, status? }`
  - 成功: `{ status: "ok", credential }`
- `POST /admin/remove` (maintainer シークレットのみ)
  - リクエスト: `{ credentialId, actorId }`
  - 成功: `{ status: "ok", changed, credential }`
  - アクティブ lease ガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (maintainer シークレットのみ)
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram kind の payload 形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id 文字列である必要があります。
- `admin/add` は `kind: "telegram"` についてこの形状を検証し、不正な payload を拒否します。

### QA へのチャネル追加

新しいチャネルアダプター向けのアーキテクチャとシナリオヘルパー名は、[QA 概要 → チャネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最小基準: 共有 `qa-lab` ホスト seam 上でトランスポート runner を実装し、Plugin manifest で `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成します。

## テストスイート (どこで何が実行されるか)

スイートは「リアリズムの増加」(および flakiness/コストの増加) と考えてください。

### ユニット / 統合 (デフォルト)

- コマンド: `pnpm test`
- 設定: ターゲット指定のない実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定へ展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、および `test/**/*.test.ts` 配下の core/unit インベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- スコープ:
  - 純粋なユニットテスト
  - インプロセス統合テスト (Gateway auth、routing、tooling、parsing、config)
  - 既知のバグに対する決定論的なリグレッション
- 期待事項:
  - CI で実行される
  - 実際のキーは不要
  - 高速で安定しているべき
  - Resolver と public-surface loader のテストは、実際の同梱 Plugin ソース API ではなく、生成された小さな Plugin fixture によって、広範な `api.js` と `runtime-api.js` の fallback 動作を証明する必要があります。実際の Plugin API 読み込みは、Plugin 所有の contract/integration スイートに属します。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ付きレーン">

    - ターゲット指定のない `pnpm test` は、巨大な単一のネイティブルートプロジェクトプロセスではなく、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/拡張機能の処理が無関係なスイートをリソース不足にすることを避けます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。マルチシャードの監視ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットを先にスコープ付きレーンへルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付きレーンへ展開します。対象は、直接編集されたテスト、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカルの import グラフ依存先です。設定/セットアップ/パッケージの編集では、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を明示的に使用しない限り、テストは広範囲に実行されません。
    - `pnpm check:changed` は、狭い範囲の作業に使う通常のスマートなローカルチェックゲートです。差分を core、core テスト、拡張機能、拡張機能テスト、アプリ、ドキュメント、リリースメタデータ、ライブ Docker ツール、ツール群に分類し、対応する typecheck、lint、ガードコマンドを実行します。Vitest テストは実行しません。テストの証跡には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン更新では、対象を絞ったバージョン/設定/ルート依存関係チェックが実行され、トップレベルの version フィールド以外のパッケージ変更を拒否するガードが入ります。
    - ライブ Docker ACP ハーネスの編集では、ライブ Docker 認証スクリプトのシェル構文と、ライブ Docker スケジューラのドライランという集中的なチェックを実行します。`package.json` の変更は、差分が `scripts["test:docker:live-*"]` に限定される場合のみ含まれます。依存関係、export、バージョン、その他のパッケージ表面の編集では、引き続きより広範なガードを使用します。
    - agents、commands、plugins、auto-reply ヘルパー、`plugin-sdk`、および類似の純粋なユーティリティ領域にある import が軽いユニットテストは、`unit-fast` レーンを通ります。このレーンは `test/setup-openclaw-runtime.ts` をスキップします。状態を持つファイルや runtime が重いファイルは、既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` のヘルパーソースファイルも、changed モードの実行をそれらの軽量レーン内の明示的な兄弟テストへマッピングします。そのため、ヘルパーの編集ではそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルの core ヘルパー、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing のシャードに分割するため、import が重い 1 つのバケットが Node 全体の末尾を占有しません。
    - 通常の PR/main CI では、拡張機能のバッチスイープとリリース専用の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補に対して、Plugin/拡張機能中心のそれらのスイート用に別個の `Plugin Prerelease` 子ワークフローをディスパッチします。

  </Accordion>

  <Accordion title="組み込みランナーのカバレッジ">

    - message-tool 検出入力または compaction runtime
      コンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化
      境界には、対象を絞ったヘルパー回帰テストを追加してください。
    - 組み込みランナー統合スイートを健全に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, and
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - これらのスイートは、スコープ付き id と compaction の挙動が実際の
      `run.ts` / `compact.ts` パスを通って引き続き流れることを検証します。ヘルパーのみのテストは、
      これらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest プールと分離のデフォルト">

    - ベース Vitest 設定のデフォルトは `threads` です。
    - 共有 Vitest 設定は `isolate: false` を固定し、
      ルートプロジェクト、e2e、ライブ設定全体で非分離ランナーを使用します。
    - ルート UI レーンは自身の `jsdom` セットアップとオプティマイザーを維持しますが、
      共有の非分離ランナーでも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false`
      のデフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 コンパイル churn を減らすため、
      デフォルトで Vitest 子 Node プロセスに `--no-maglev` を追加します。
      標準の V8
      挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、差分がどのアーキテクチャレーンをトリガーするかを表示します。
    - pre-commit フックはフォーマットのみです。フォーマット済みファイルを再ステージし、
      lint、typecheck、テストは実行しません。
    - スマートなローカルチェックゲートが必要な場合は、ハンドオフまたは push の前に
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付きレーンを通ります。
      エージェントが、ハーネス、設定、パッケージ、または契約の編集に本当に広範な
      Vitest カバレッジが必要だと判断した場合にのみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング
      挙動を維持し、ワーカー上限だけを高くします。
    - ローカルワーカーの自動スケーリングは意図的に保守的で、ホストのロードアベレージがすでに高い場合は後退するため、
      複数の並行
      Vitest 実行による影響がデフォルトで小さくなります。
    - ベース Vitest 設定は、プロジェクト/設定ファイルを
      `forceRerunTriggers` としてマークしているため、テスト
      配線が変わったときも changed モードの再実行が正しく保たれます。
    - 設定は、サポート対象ホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。
      直接プロファイリング用に明示的なキャッシュ場所を 1 つ使いたい場合は、
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="パフォーマンスデバッグ">

    - `pnpm test:perf:imports` は、Vitest の import 所要時間レポートと
      import 内訳出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを
      `origin/main` 以降に変更されたファイルへスコープします。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。
      設定全体の実行では設定パスをキーとして使用します。include-pattern CI
      シャードではシャード名を追加するため、フィルターされたシャードを個別に追跡できます。
    - あるホットなテストが依然として起動時の import に時間の大半を費やす場合は、
      重い依存関係を狭いローカル `*.runtime.ts` 境界の背後に置き、
      runtime ヘルパーを `vi.mock(...)` に渡すためだけに deep import するのではなく、
      その境界を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み
      差分について、ルーティングされた
      `test:changed` とネイティブルートプロジェクトパスを比較し、ウォールタイムと macOS 最大 RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を
      `scripts/test-projects.mjs` とルート Vitest 設定へルーティングして、現在の
      dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッドに対するメインスレッド CPU プロファイルを書き込みます。
    - `pnpm test:perf:profile:runner` は、ファイル並列実行を無効にした状態で、ユニットスイートの runner CPU+heap プロファイルを書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 ワーカーを強制
- スコープ:
  - diagnostics をデフォルトで有効にした実際の loopback Gateway を起動します
  - synthetic gateway メッセージ、memory、大きな payload churn を diagnostic event パスへ流します
  - Gateway WS RPC 経由で `diagnostics.stability` をクエリします
  - diagnostic stability bundle 永続化ヘルパーをカバーします
  - recorder が境界内に収まり、synthetic RSS サンプルが pressure budget 未満に保たれ、セッションごとの queue depth がゼロへ戻ることをアサートします
- 期待事項:
  - CI セーフでキー不要
  - 安定性回帰のフォローアップ用の狭いレーンであり、Gateway スイート全体の代替ではありません

### E2E（gateway smoke）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E テスト
- Runtime デフォルト:
  - リポジトリの他の部分と同じく、Vitest `threads` と `isolate: false` を使用します。
  - adaptive workers を使用します（CI: 最大 2、ローカル: デフォルトで 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトで silent モードで実行します。
- 便利なオーバーライド:
  - ワーカー数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - verbose なコンソール出力を再度有効にするには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - 複数インスタンスの gateway のエンドツーエンド挙動
  - WebSocket/HTTP 表面、node pairing、より重いネットワーキング
- 期待事項:
  - CI で実行されます（パイプラインで有効な場合）
  - 実際のキーは不要
  - ユニットテストより可動部分が多いです（遅くなる場合があります）

### E2E: OpenShell backend smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell gateway を起動します
  - 一時的なローカル Dockerfile から sandbox を作成します
  - 実際の `sandbox ssh-config` + SSH exec 経由で OpenClaw の OpenShell backend を実行します
  - sandbox fs bridge を通じて remote-canonical ファイルシステム挙動を検証します
- 期待事項:
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLI と動作する Docker daemon が必要です
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト gateway と sandbox を破棄します
- 便利なオーバーライド:
  - より広範な e2e スイートを手動で実行するときにテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルトではない CLI バイナリまたは wrapper script を指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下の bundled-plugin live テスト
- デフォルト: `pnpm test:live` によって **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは実際の認証情報で _今日_ 本当に動作するか？」
  - provider format の変更、tool-calling の癖、auth の問題、rate limit の挙動を検出します
- 期待事項:
  - 設計上、CI では安定しません（実際のネットワーク、実際のプロバイダーポリシー、quota、障害）
  - 費用がかかる / rate limit を使用します
  - 「すべて」ではなく、範囲を絞ったサブセットの実行を推奨します
- Live 実行は、欠落している API キーを取得するために `~/.profile` を source します。
- デフォルトでは、live 実行でも `HOME` を分離し、設定/auth material を一時テストホームへコピーするため、ユニット fixture が実際の `~/.openclaw` を変更することはありません。
- live テストで実際のホームディレクトリを使用する必要が意図的にある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、デフォルトでより静かなモードです。`[live] ...` の進捗出力は維持しますが、追加の `~/.profile` notice を抑制し、gateway bootstrap logs/Bonjour chatter をミュートします。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API key rotation（プロバイダー固有）: コンマ/セミコロン形式の `*_API_KEYS` または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、`OPENCLAW_LIVE_*_KEY` による live ごとのオーバーライドを設定します。テストは rate limit 応答時に retry します。
- 進捗/Heartbeat 出力:
  - Live スイートは stderr に進捗行を出力するようになったため、Vitest の console capture が静かな場合でも、長い provider 呼び出しが動作中であることが見えます。
  - `vitest.live.config.ts` は Vitest の console interception を無効にするため、live 実行中に provider/gateway の進捗行が即時にストリーミングされます。
  - direct-model Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - gateway/probe Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきですか？

この判定表を使用してください:

- 編集ロジック/テスト: `pnpm test` を実行（大きく変更した場合は `pnpm test:coverage` も実行）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れる場合: `pnpm test:e2e` を追加
- 「自分の bot が落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグする場合: 範囲を絞った `pnpm test:live` を実行

## ライブ（ネットワークに触れる）テスト

ライブモデルマトリクス、CLI バックエンドスモーク、ACP スモーク、Codex app-server
ハーネス、およびすべてのメディアプロバイダーのライブテスト（Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス）と、ライブ実行の認証情報処理については、
[ライブスイートのテスト](/ja-JP/help/testing-live) を参照してください。専用の更新および
Plugin 検証チェックリストについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つのバケットに分かれます。

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で、一致する profile-key ライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）だけを実行します。その際、ローカル設定ディレクトリとワークスペースをマウントします（マウントされている場合は `~/.profile` も読み込みます）。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker ライブランナーは、Docker 全体スイープを現実的に保てるよう、デフォルトで小さめのスモーク上限を使います。
  `test:docker:live-models` のデフォルトは `OPENCLAW_LIVE_MAX_MODELS=12` で、
  `test:docker:live-gateway` のデフォルトは `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。より大きな網羅スキャンを明示的に
  実行したい場合は、これらの環境変数を上書きしてください。
- `test:docker:all` は `test:docker:live-build` 経由でライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックしてから、2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用します。素のイメージは、インストール/更新/Plugin 依存関係レーン用の Node/Git ランナーだけです。これらのレーンは事前ビルド済み tarball をマウントします。機能イメージは、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールします。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあります。`scripts/test-docker-all.mjs` が選択されたプランを実行します。この集約は重み付きローカルスケジューラーを使います。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限により重いライブ、npm インストール、マルチサービスの各レーンが同時にすべて開始されないようにします。単一のレーンが有効な上限より重い場合でも、プールが空ならスケジューラーはそのレーンを開始でき、再び容量が利用可能になるまで単独で実行し続けます。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。Docker ホストに余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整してください。ランナーはデフォルトで Docker 事前チェックを実行し、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、以降の実行ではそのタイミングを使って長いレーンを先に開始します。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使い、選択されたレーン、パッケージ/イメージ要件、認証情報に関する CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使います。
- `Package Acceptance` は、「このインストール可能な tarball はプロダクトとして動作するか？」を確認する GitHub ネイティブのパッケージゲートです。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から 1 つの候補パッケージを解決し、それを `package-under-test` としてアップロードしてから、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。プロファイルは範囲の広さ順に `smoke`、`package`、`product`、`full` です。パッケージ/更新/Plugin コントラクト、公開済みアップグレードの survivor マトリクス、リリースのデフォルト、失敗のトリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照してください。
- ビルドおよびリリースチェックは、tsdown の後に `scripts/check-cli-bootstrap-imports.mjs` を実行します。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的なビルド済みグラフをたどり、コマンドディスパッチ前の起動時に Commander、prompt UI、undici、logging などのパッケージ依存関係をインポートしている場合に失敗します。また、バンドルされた Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否します。パッケージ化された CLI スモークでは、ルートヘルプ、オンボーディングヘルプ、doctor ヘルプ、status、config schema、model-list コマンドもカバーします。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限されています。その期限までは、ハーネスは出荷済みパッケージのメタデータ欠落だけを許容します。省略されたプライベート QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落した patch ファイル、永続化されていない `update.channel`、レガシー Plugin インストール記録の場所、マーケットプレイスのインストール記録永続化の欠落、および `plugins update` 中の config metadata 移行です。`2026.4.25` より後のパッケージでは、これらのパスは厳格な失敗になります。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、および `test:docker:config-reload` は、1 つ以上の実コンテナを起動し、より高レベルの統合パスを検証します。

ライブモデル Docker ランナーは、必要な CLI 認証ホームだけ（または実行が絞り込まれていない場合はサポート対象のすべて）も bind mount し、実行前にそれらをコンテナのホームへコピーします。これにより、外部 CLI OAuth はホストの認証ストアを変更せずにトークンを更新できます。

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind` (スクリプト: `scripts/test-live-acp-bind-docker.sh`; 既定で Claude、Codex、Gemini をカバーし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` によって Droid/OpenCode を厳密にカバー)
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend` (スクリプト: `scripts/test-live-cli-backend-docker.sh`)
- Codex アプリサーバーハーネススモーク: `pnpm test:docker:live-codex-harness` (スクリプト: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- Observability スモーク: `pnpm qa:otel:smoke` は非公開 QA ソースチェックアウトレーンです。npm tarball では QA Lab が省略されるため、意図的にパッケージ Docker リリースレーンには含めていません。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui` (スクリプト: `scripts/e2e/openwebui-docker.sh`)
- オンボーディングウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- Npm tarball オンボーディング/チャンネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パック済みの OpenClaw tarball を Docker 内にグローバルインストールし、env-ref オンボーディングと既定の Telegram によって OpenAI を構成し、doctor を実行して、モックされた OpenAI エージェントターンを 1 回実行します。事前ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホスト再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を使い、チャンネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使います。
- 更新チャンネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker 内にグローバルインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャンネルと更新後の Plugin 動作を検証してから、パッケージ `stable` に戻して更新ステータスを確認します。
- アップグレード生存スモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャンネル構成、Plugin allowlist、古い Plugin 依存関係状態、既存のワークスペース/セッションファイルを含む、汚れた旧ユーザーフィクスチャの上に、パック済みの OpenClaw tarball をインストールします。ライブプロバイダーやチャンネルキーなしで、パッケージ更新と非対話 doctor を実行し、その後 loopback Gateway を起動して、構成/状態の保持と起動/ステータスの予算を確認します。
- 公開済みアップグレード生存スモーク: `pnpm test:docker:published-upgrade-survivor` は既定で `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、組み込みコマンドレシピでそのベースラインを構成し、結果の構成を検証し、その公開済みインストールを候補 tarball に更新し、非対話 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込んでから、loopback Gateway を起動し、構成済み intent、状態保持、起動、`/healthz`、`/readyz`、RPC ステータス予算を確認します。1 つのベースラインを上書きするには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` を使い、集約スケジューラーに正確なベースラインを展開させるには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` を使い、`reported-issues` のような `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` で issue 形式のフィクスチャを展開します。Package Acceptance ではこれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開しています。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストのトランスクリプト永続化と、影響を受ける重複 prompt-rewrite ブランチの doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は現在のツリーをパックし、隔離されたホーム内で `bun install -g` によってインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み画像プロバイダーを返すことを検証します。事前ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` を使い、ビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使います。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各コンテナーで 1 つの npm キャッシュを共有します。更新スモークは、候補 tarball へアップグレードする前の stable ベースラインとして、既定で npm `latest` を使います。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で上書きし、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きします。非 root インストーラーチェックでは、root 所有のキャッシュエントリーがユーザーローカルのインストール動作を隠さないように、隔離された npm キャッシュを保持します。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` によって重複する direct-npm グローバル更新をスキップします。直接の `npm install -g` カバレッジが必要な場合は、その env なしでローカルにスクリプトを実行します。
- エージェント共有ワークスペース削除 CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) は既定でルート Dockerfile イメージをビルドし、隔離されたコンテナーホームに 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行し、有効な JSON とワークスペース保持動作を検証します。install-smoke イメージを再利用するには `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使います。
- Gateway ネットワーキング (2 つのコンテナー、WS 認証 + ヘルス): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- ブラウザー CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) はソース E2E イメージと Chromium レイヤーをビルドし、生 CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP ロールスナップショットがリンク URL、カーソル昇格されたクリック可能要素、iframe refs、フレームメタデータをカバーしていることを検証します。
- OpenAI Responses web_search minimal reasoning 回帰: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) はモック OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に上げることを検証し、その後プロバイダースキーマの reject を強制して、生の詳細が Gateway ログに現れることを確認します。
- MCP チャンネルブリッジ (シード済み Gateway + stdio ブリッジ + 生 Claude 通知フレームスモーク): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- Pi バンドル MCP ツール (実 stdio MCP サーバー + 埋め込み Pi プロファイル allow/deny スモーク): `pnpm test:docker:pi-bundle-mcp-tools` (スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/サブエージェント MCP クリーンアップ (実 Gateway + 隔離 cron とワンショットサブエージェント実行後の stdio MCP 子プロセス破棄): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (ローカルパス、`file:`、hoist された依存関係を持つ npm registry、git moving refs、ClawHub kitchen-sink、marketplace 更新、Claude バンドル有効化/検査のインストール/更新スモーク): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、既定の kitchen-sink パッケージ/ランタイムのペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を設定します。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub フィクスチャサーバーを使います。
- Plugin 更新変更なしスモーク: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- 構成リロードメタデータスモーク: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` は、ローカルパス、`file:`、hoist された依存関係を持つ npm registry、git moving refs、ClawHub フィクスチャ、marketplace 更新、Claude バンドル有効化/検査のインストール/更新スモークをカバーします。`pnpm test:docker:plugin-update` は、インストール済み Plugin の変更なし更新動作をカバーします。

共有 functional イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにないときに pull します。QR とインストーラー Docker テストは、共有ビルド済みアプリランタイムではなくパッケージ/インストール動作を検証するため、独自の Dockerfile を保持します。

ライブモデル Docker ランナーは、現在のチェックアウトも読み取り専用で bind mount し、
コンテナー内の一時 workdir にステージします。これによりランタイム
イメージをスリムに保ちながら、正確なローカルソース/構成に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build` や
Gradle 出力ディレクトリなどの大きなローカル専用キャッシュやアプリビルド出力をスキップするため、
Docker ライブ実行がマシン固有の成果物のコピーに数分を費やすことはありません。
また、コンテナー内で実際の Telegram/Discord などのチャンネルワーカーを
Gateway ライブプローブが起動しないように `OPENCLAW_SKIP_CHANNELS=1` も設定します。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンから Gateway
ライブカバレッジを絞り込んだり除外したりする必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw gateway コンテナーを起動し、その gateway に対して固定された Open WebUI コンテナーを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開することを検証してから、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
初回実行は、Docker が Open WebUI イメージを pull する必要があり、Open WebUI 自体のコールドスタート設定が
完了する必要もあるため、明らかに遅くなることがあります。
このレーンでは利用可能なライブモデルキーが必要で、Docker 化された実行でそれを提供する主な方法は
`OPENCLAW_PROFILE_FILE` (`~/.profile` が既定) です。
成功した実行では `{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、iMessage アカウントは必要ありません。シード済み Gateway
コンテナーを起動し、`openclaw mcp serve` を spawn する 2 つ目のコンテナーを起動してから、
ルーティングされた会話検出、トランスクリプト読み取り、添付メタデータ、
ライブイベントキュー動作、アウトバウンド送信ルーティング、Claude 形式のチャンネル +
権限通知を実際の stdio MCP ブリッジ越しに検証します。通知チェックは
生の stdio MCP フレームを直接検査するため、スモークは特定のクライアント SDK がたまたま表面化する内容だけでなく、
ブリッジが実際に出力する内容を検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、ライブ
モデルキーは必要ありません。リポジトリ Docker イメージをビルドし、コンテナー内で実際の stdio MCP プローブサーバーを起動し、
埋め込み Pi バンドル MCP ランタイム経由でそのサーバーを具現化し、
ツールを実行してから、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルターする一方で、`coding` と `messaging` が
`bundle-mcp` ツールを保持することを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデル
キーは必要ありません。実 stdio MCP プローブサーバーを持つシード済み Gateway を起動し、
隔離された cron ターンと `/subagents spawn` ワンショット子ターンを実行してから、
各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP 平易言語スレッドスモーク (CI ではありません):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/debug ワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な env vars:

- `OPENCLAW_CONFIG_DIR=...` (デフォルト: `~/.openclaw`) は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...` (デフォルト: `~/.openclaw/workspace`) は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...` (デフォルト: `~/.profile`) は `/home/node/.profile` にマウントされ、テスト実行前に読み込まれます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、`OPENCLAW_PROFILE_FILE` から読み込まれた環境変数のみを検証し、一時的な config/workspace ディレクトリを使用して外部 CLI 認証マウントを使いません
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (デフォルト: `~/.cache/openclaw/docker-cli-tools`) は、Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` へコピーされます
  - デフォルトのディレクトリ: `.minimax`
  - デフォルトのファイル: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推測される必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きします
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` は実行対象を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` はコンテナ内のプロバイダーをフィルタリングします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報が環境変数ではなく profile store から来ていることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI スモーク用に Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI スモークで使用される nonce-check プロンプトを上書きします
- `OPENWEBUI_IMAGE=...` は、固定された Open WebUI イメージタグを上書きします

## Docs の健全性確認

ドキュメント編集後に docs チェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、Mintlify の完全なアンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフライン回帰テスト (CI-safe)

これらは実プロバイダーを使わない「実パイプライン」回帰テストです:

- Gateway ツール呼び出し (モック OpenAI、実 Gateway + エージェントループ): `src/gateway/gateway.test.ts` (ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway ウィザード (WS `wizard.start`/`wizard.next`、config の書き込み + auth の強制): `src/gateway/gateway.test.ts` (ケース: "runs wizard over ws and writes auth token config")

## エージェント信頼性評価 (Skills)

「エージェント信頼性評価」のように振る舞う CI-safe テストは、すでにいくつかあります:

- 実 Gateway + エージェントループを通したモックのツール呼び出し (`src/gateway/gateway.test.ts`)。
- セッション配線と config 効果を検証するエンドツーエンドのウィザードフロー (`src/gateway/gateway.test.ts`)。

Skills についてまだ不足しているもの ([Skills](/ja-JP/tools/skills) を参照):

- **判断:** Skills がプロンプトに一覧表示されているとき、エージェントは正しい Skills を選ぶか (または無関係なものを避けるか)。
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか。
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界をアサートする複数ターンのシナリオ。

今後の評価は、まず決定的であるべきです:

- モックプロバイダーを使って、ツール呼び出し + 順序、Skills ファイルの読み取り、セッション配線をアサートするシナリオランナー。
- Skills に焦点を当てた小規模なシナリオ群 (使用する/避ける、ゲーティング、プロンプトインジェクション)。
- オプションのライブ評価 (オプトイン、環境変数でゲート) は、CI-safe スイートが整ってからのみ。

## 契約テスト (Plugin とチャネル形状)

契約テストは、登録されているすべての Plugin とチャネルがその
インターフェイス契約に準拠していることを検証します。検出されたすべての Plugin を反復し、
形状と動作のアサーションスイートを実行します。デフォルトの `pnpm test` ユニットレーンは、
これらの共有境界とスモークファイルを意図的にスキップします。共有チャネルまたはプロバイダー面に触れるときは、
契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な Plugin 形状 (id、name、capabilities)
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディング動作
- **outbound-payload** - メッセージペイロード構造
- **inbound** - 受信メッセージ処理
- **actions** - チャネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/roster API
- **group-policy** - グループポリシーの適用

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャネルステータスプローブ
- **registry** - Plugin レジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - Auth フロー契約
- **auth-choice** - Auth の選択/指定
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

契約テストは CI で実行され、実 API キーは不要です。

## 回帰テストの追加 (ガイダンス)

ライブで見つかったプロバイダー/モデル問題を修正するとき:

- 可能であれば CI-safe な回帰テストを追加します (mock/stub プロバイダー、または正確なリクエスト形状変換のキャプチャ)
- 本質的にライブ専用の場合 (レート制限、auth ポリシー)、ライブテストは狭く保ち、環境変数によるオプトインにします
- バグを捕捉できる最小のレイヤーを対象にすることを優先します:
  - プロバイダーのリクエスト変換/リプレイのバグ → 直接のモデルテスト
  - Gateway のセッション/履歴/ツールパイプラインのバグ → Gateway ライブスモークまたは CI-safe Gateway モックテスト
- SecretRef traversal ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ (`listSecretTargetRegistryEntries()`) から SecretRef クラスごとにサンプル対象を 1 つ導出し、traversal-segment exec ids が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは未分類の target ids で意図的に失敗するため、新しいクラスが静かにスキップされることはありません。

## 関連

- [ライブのテスト](/ja-JP/help/testing-live)
- [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
