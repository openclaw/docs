---
read_when:
    - ローカルまたはCIでテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway とエージェントの挙動のデバッグ
summary: 'テストキット: ユニット/e2e/live スイート、Docker ランナー、および各テストが対象とする内容'
title: テスト
x-i18n:
    generated_at: "2026-05-01T05:01:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c28e45c483169f528483f7a27265d89c34f3865eb56b51407639b566e117162
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と少数の Docker ランナーがあります。このドキュメントは「テスト方法」のガイドです。

- 各スイートがカバーする内容（および意図的にカバーしない内容）。
- 一般的なワークフロー（local、pre-push、debugging）で実行するコマンド。
- live テストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダー問題のリグレッションを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、live transport lanes）**は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — アーキテクチャ、コマンド面、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) — `pnpm openclaw qa matrix` のリファレンス。
- [QA channel](/ja-JP/channels/qa-channel) — リポジトリ裏付けのシナリオで使われる合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行を扱います。下の QA 固有のランナーセクション（[QA 固有のランナー](#qa-specific-runners)）には具体的な `qa` 呼び出しを列挙し、上記のリファレンスへ戻るリンクを示しています。
</Note>

## クイックスタート

普段は:

- フルゲート（push 前に期待される）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速な local フルスイート実行: `pnpm test:max`
- 直接 Vitest watch ループ: `pnpm test:watch`
- 直接ファイル指定は extension/channel パスにもルーティングされるようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復しているときは、まずターゲット実行を優先してください。
- Docker 裏付けの QA サイト: `pnpm qa:lab:up`
- Linux VM 裏付けの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたときや追加の確信が欲しいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- Live スイート（モデル + gateway tool/image プローブ）: `pnpm test:live`
- 1 つの live ファイルを静かに対象化: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live モデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さな file-read 風プローブを実行します。
    メタデータが `image` 入力を示すモデルは、小さな画像ターンも実行します。
    プロバイダー障害を切り分けるときは、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効にしてください。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` はどちらも、再利用可能な live/E2E ワークフローを
    `include_live_suites: true` で呼び出します。これには、プロバイダー別にシャードされた
    個別の Docker live モデルマトリクスジョブが含まれます。
  - 集中的な CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して
    `OpenClaw Live And E2E Checks (Reusable)` を dispatch します。
  - 新しい高シグナルのプロバイダーシークレットは `scripts/ci-hydrate-live-auth.sh` に加え、
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` とその
    scheduled/release 呼び出し元にも追加してください。
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live レーンを実行し、合成
    Slack DM を `/codex bind` でバインドし、`/codex fast` と
    `/codex permissions` を実行した後、通常の返信と画像添付が
    ACP ではなくネイティブ Plugin バインディング経由でルーティングされることを検証します。
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Plugin 所有の Codex app-server ハーネス経由で gateway agent ターンを実行し、
    `/codex status` と `/codex models` を検証し、デフォルトでは画像、
    cron MCP、sub-agent、Guardian プローブを実行します。他の Codex
    app-server 障害を切り分けるときは、
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` で sub-agent プローブを無効にしてください。
    集中的な sub-agent チェックでは、他のプローブを無効にします:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、
    sub-agent プローブ後に終了します。
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - メッセージチャネルの rescue command 面に対するオプトインの念押しチェックです。
    `/crestodian status` を実行し、永続的なモデル変更をキューに入れ、
    `/crestodian yes` に返信し、audit/config 書き込みパスを検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に偽の Claude CLI を置いた設定なしコンテナで Crestodian を実行し、
    fuzzy planner fallback が audit 済みの typed config 書き込みに変換されることを検証します。
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、裸の `openclaw` を
    Crestodian にルーティングし、setup/model/agent/Discord Plugin + SecretRef 書き込みを適用し、
    config を検証し、audit entries を検証します。同じ Ring 0 setup パスは
    QA Lab でも `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` を設定して、
  `openclaw models list --provider moonshot --json` を実行し、その後、分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を `moonshot/kimi-k2.6` に対して実行します。JSON が Moonshot/K2.6 を報告し、
  assistant transcript が正規化された `usage.cost` を保存することを検証します。

<Tip>
失敗ケースが 1 つだけ必要な場合は、下記の allowlist env vars で live テストを絞り込むことを優先してください。
</Tip>

## QA 固有のランナー

QA-lab の実環境らしさが必要なとき、これらのコマンドはメインのテストスイートの横にあります。

CI は専用ワークフローで QA Lab を実行します。`Parity gate` は一致する PR と、
mock providers を使った手動 dispatch から実行されます。`QA-Lab - All Lanes` は
`main` で毎晩実行され、手動 dispatch からは mock parity gate、live Matrix lane、
Convex 管理の live Telegram lane、Convex 管理の live Discord lane を並列ジョブとして実行します。
Scheduled QA と release checks は Matrix `--profile fast` を明示的に渡しますが、
Matrix CLI と手動ワークフロー入力のデフォルトは `all` のままです。手動 dispatch では
`all` を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードできます。
`OpenClaw Release Checks` は release approval 前に parity と fast Matrix および Telegram lane を実行し、
release transport checks では `mock-openai/gpt-5.5` を使うため、決定的なままで、
通常の provider-plugin startup を避けられます。これらの live transport gateways は
memory search を無効にします。memory 動作は QA parity suites で引き続きカバーされます。

Full release live media shards は
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使います。これにはすでに
`ffmpeg` と `ffprobe` が含まれています。Docker live model/backend shards は、選択された
commit ごとに一度だけビルドされる共有の
`ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使い、各 shard 内で再ビルドする代わりに
`OPENCLAW_SKIP_DOCKER_BUILD=1` で pull します。

- `pnpm openclaw qa suite`
  - リポジトリ裏付けの QA シナリオをホスト上で直接実行します。
  - 選択された複数のシナリオを、分離された gateway worker によりデフォルトで並列実行します。
    `qa-channel` のデフォルト concurrency は 4（選択されたシナリオ数で上限）です。
    worker 数を調整するには `--concurrency <count>` を使い、従来の serial lane には
    `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで artifacts が欲しい場合は
    `--allow-failures` を使います。
  - provider modes `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、scenario-aware な `mock-openai` lane を置き換えずに、実験的な
    fixture と protocol-mock カバレッジのための local AIMock-backed provider server を起動します。
- `pnpm test:gateway:cpu-scenarios`
  - gateway startup bench と小さな mock QA Lab scenario pack
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`）を実行し、統合された CPU observation
    summary を `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは継続的な hot CPU observations のみをフラグします（`--cpu-core-warn`
    と `--hot-wall-warn-ms`）。そのため、短い startup bursts は、数分にわたる
    gateway peg regression のように見せずにメトリクスとして記録されます。
  - ビルド済みの `dist` artifacts を使います。checkout に新しい runtime output がまだない場合は、
    先に build を実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA suite を破棄可能な Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じ scenario-selection 動作を維持します。
  - `qa suite` と同じ provider/model selection flags を再利用します。
  - Live runs は、guest にとって実用的なサポート済み QA auth inputs を転送します:
    env-based provider keys、QA live provider config path、存在する場合は `CODEX_HOME`。
  - output dirs は repo root 配下に置く必要があります。これにより guest が mounted workspace 経由で書き戻せます。
  - 通常の QA report + summary に加え、Multipass logs を
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - operator-style QA 作業のために Docker 裏付けの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在の checkout から npm tarball をビルドし、Docker 内でグローバルインストールし、
    非対話の OpenAI API-key オンボーディングを実行し、デフォルトで Telegram を設定し、
    Plugin の有効化により runtime dependencies がオンデマンドでインストールされることを検証し、
    doctor を実行し、mocked OpenAI endpoint に対して 1 回の local agent turn を実行します。
  - Discord で同じ packaged-install lane を実行するには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使います。
- `pnpm test:docker:session-runtime-context`
  - embedded runtime context transcripts のための決定的な built-app Docker smoke を実行します。
    hidden OpenClaw runtime context が、表示される user turn に漏れず、
    non-display custom message として永続化されることを検証し、その後、影響を受ける壊れた session JSONL を seed し、
    `openclaw doctor --fix` が backup 付きで active branch に書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内に OpenClaw package candidate をインストールし、installed-package オンボーディングを実行し、
    installed CLI 経由で Telegram を設定した後、その installed package を SUT Gateway として
    live Telegram QA lane を再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。
    registry からインストールする代わりに解決済みの local tarball をテストするには、
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env credentials または Convex credential source を使います。
    CI/release automation では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて
    `OPENCLAW_QA_CONVEX_SITE_URL` と role secret を設定します。CI に
    `OPENCLAW_QA_CONVEX_SITE_URL` と Convex role secret が存在する場合、
    Docker wrapper は Convex を自動選択します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、この lane に限って共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions はこの lane を手動 maintainer workflow
    `NPM Telegram Beta E2E` として公開しています。merge 時には実行されません。この workflow は
    `qa-live-shared` environment と Convex CI credential leases を使います。
- GitHub Actions は、1 つの candidate package に対する side-run product proof として
  `Package Acceptance` も公開しています。trusted ref、published npm spec、
  SHA-256 付き HTTPS tarball URL、または別 run の tarball artifact を受け取り、
  正規化された `openclaw-current.tgz` を `package-under-test` として upload した後、
  smoke、package、product、full、custom lane profiles で既存の Docker E2E scheduler を実行します。
  同じ `package-under-test` artifact に対して Telegram QA workflow を実行するには、
  `telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL proof には digest が必要です:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- アーティファクト証明は、別の Actions 実行から tarball アーティファクトをダウンロードします。

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI を設定した Gateway を起動してから、設定編集によって同梱チャネル/Plugin を有効にします。
  - セットアップ検出によって、未設定 Plugin のランタイム依存関係が存在しないこと、最初に設定された Gateway または doctor 実行が各同梱 Plugin のランタイム依存関係をオンデマンドでインストールすること、2 回目の再起動ではすでに有効化された依存関係を再インストールしないことを検証します。
  - また、既知の古い npm ベースラインをインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補版の更新後 doctor がハーネス側の postinstall 修復なしで同梱チャネルのランタイム依存関係を修復することを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージ版インストール更新 smoke を実行します。選択された各プラットフォームは、まず要求されたベースラインパッケージをインストールし、次に同じゲスト内でインストール済みの `openclaw update` コマンドを実行して、インストール済みバージョン、更新ステータス、Gateway の準備完了状態、および 1 回のローカルエージェントターンを検証します。
  - 1 つのゲストで反復作業する間は、`--platform macos`、`--platform windows`、または `--platform linux` を使用します。サマリーアーティファクトのパスとレーンごとのステータスには `--json` を使用します。
  - OpenAI レーンは、デフォルトでライブエージェントターン証明に `openai/gpt-5.5` を使用します。別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels 転送の停止が残りのテスト時間を消費しないよう、長時間のローカル実行はホストのタイムアウトでラップします。

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトは、ネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認してください。
  - Windows 更新は、冷えたゲスト上では更新後 doctor/ランタイム依存関係修復に 10 分から 15 分かかることがあります。ネストされた npm デバッグログが進んでいる場合、それでも正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux smoke レーンと並行して実行しないでください。これらは VM 状態を共有しており、スナップショット復元、パッケージ配信、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後証明では通常の同梱 Plugin サーフェスを実行します。これは、音声、画像生成、メディア理解などのケイパビリティファサードが、エージェントターン自体では単純なテキスト応答だけを確認する場合でも、同梱ランタイム API を通じて読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接プロトコル smoke テスト用に、ローカル AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker 裏付け Tuwunel homeserver に対して Matrix ライブ QA レーンを実行します。ソースチェックアウト専用です。パッケージ版インストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、環境変数、アーティファクトレイアウト: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 環境変数のドライバーおよび SUT bot トークンを使用し、実際の非公開グループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、および `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール済み認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使用し、プール済みリースを選択するには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じ非公開グループ内に 2 つの異なる bot が必要で、SUT bot は Telegram ユーザー名を公開している必要があります。
  - 安定した bot 間観測のため、両方の bot で `@BotFather` の Bot-to-Bot Communication Mode を有効にし、ドライバー bot がグループ bot トラフィックを観測できるようにします。
  - Telegram QA レポート、サマリー、および観測メッセージアーティファクトを `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、ドライバーの送信リクエストから観測された SUT 返信までの RTT が含まれます。

ライブ転送レーンは、新しい転送が逸脱しないように 1 つの標準契約を共有します。レーンごとのカバレッジマトリクスは [QA 概要 → ライブ転送カバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、このマトリクスの一部ではありません。

### Convex 経由の共有 Telegram 認証情報 (v1)

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA lab は Convex 裏付けプールから排他的リースを取得し、レーンの実行中にそのリースへ Heartbeat し、シャットダウン時にリースを解放します。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択されたロール用のシークレット 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロール選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトで `ci`、それ以外では `maintainer`）

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用してください。

メンテナー管理コマンド（プールの追加/削除/一覧）には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を出力せずに Convex サイト URL、ブローカーシークレット、エンドポイントプレフィックス、HTTP タイムアウト、および admin/list 到達性を確認します。スクリプトおよび CI ユーティリティで機械可読出力が必要な場合は `--json` を使用します。

デフォルトエンドポイント契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

- `POST /acquire`
  - リクエスト: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/リトライ可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正なペイロードを拒否します。

### QA へのチャネル追加

新しいチャネルアダプターのアーキテクチャおよびシナリオヘルパー名は、[QA 概要 → チャネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最小要件は、共有 `qa-lab` ホストシーム上に転送ランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成することです。

## テストスイート（どこで何が実行されるか）

スイートは「リアリズムが増していく」（同時に不安定さ/コストも増す）ものとして考えてください。

### ユニット / 統合（デフォルト）

- コマンド: `pnpm test`
- 設定: ターゲット指定なしの実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定に展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、および `test/**/*.test.ts` 配下の core/unit インベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- スコープ:
  - 純粋なユニットテスト
  - インプロセス統合テスト（Gateway 認証、ルーティング、ツール、解析、設定）
  - 既知バグの決定的リグレッション
- 期待事項:
  - CI で実行される
  - 実キーは不要
  - 高速かつ安定しているべき
  - リゾルバーおよび公開サーフェスローダーのテストは、実際の同梱 Plugin ソース API ではなく、生成された小さな Plugin フィクスチャを使って、広範な `api.js` および `runtime-api.js` フォールバック動作を証明する必要があります。実際の Plugin API 読み込みは、Plugin 所有の契約/統合スイートに属します。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ付きレーン">

    - ターゲット指定なしの `pnpm test` は、巨大な単一のネイティブルートプロジェクトプロセスの代わりに、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS を削減し、auto-reply/extension の処理が無関係なスイートを枯渇させるのを避けられます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。複数シャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付きレーンに展開します。対象は、直接のテスト編集、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフの依存先です。設定/セットアップ/パッケージの編集では、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を明示的に使わない限り、テストを広範囲には実行しません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートなローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。release metadata のみのバージョンバンプでは、対象を絞った version/config/root-dependency チェックを実行し、最上位の version フィールド以外の package 変更を拒否する guard を適用します。
    - Live Docker ACP ハーネスの編集では、live Docker 認証スクリプトのシェル構文と live Docker スケジューラの dry-run という絞り込まれたチェックを実行します。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定されている場合のみ含まれます。dependency、export、version、その他の package サーフェス編集では、引き続きより広い guard を使用します。
    - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および同種の純粋な utility 領域からの import-light unit tests は、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンにルーティングされます。stateful/runtime-heavy ファイルは既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` の helper source files も、changed-mode の実行をそれらの軽量レーン内の明示的な兄弟テストへマッピングするため、helper の編集でそのディレクトリ全体の重いスイートを再実行せずに済みます。
    - `auto-reply` には、トップレベルの core helpers、トップレベルの `reply.*` integration tests、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、import-heavy な 1 つのバケットが Node の末尾全体を占有しないようにしています。
    - 通常の PR/main CI では、extension batch sweep と release 専用の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、release candidate 向けに plugin/extension-heavy なそれらのスイート用の別個の `Plugin Prerelease` 子ワークフローを dispatch します。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - message-tool discovery input または compaction runtime
      context を変更するときは、両方のカバレッジレベルを維持してください。
    - 純粋な routing と normalization
      境界には、焦点を絞った helper regression を追加してください。
    - embedded runner integration suites を正常な状態に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付き id と compaction の挙動が実際の
      `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。helper のみのテストは、
      それらの integration パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - ベース Vitest 設定のデフォルトは `threads` です。
    - 共有 Vitest 設定は `isolate: false` を固定し、root projects、e2e、live configs 全体で
      non-isolated runner を使用します。
    - root UI レーンは `jsdom` セットアップと optimizer を維持しますが、
      共有の non-isolated runner でも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false`
      のデフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 compile churn を減らすため、
      デフォルトで Vitest 子 Node プロセスに `--no-maglev` を追加します。
      標準の V8 挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` は diff がどの architectural lanes をトリガーするかを表示します。
    - pre-commit hook は formatting のみです。format されたファイルを再 stage し、
      lint、typecheck、tests は実行しません。
    - handoff または push の前にスマートなローカルチェックゲートが必要な場合は、
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付きレーンを通ります。
      agent が harness、config、package、または contract の編集により本当に広範な
      Vitest カバレッジが必要だと判断した場合のみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じ routing
      挙動を維持し、worker cap だけが高くなります。
    - ローカル worker の自動スケーリングは意図的に保守的で、host load average がすでに高い場合は後退するため、複数の同時
      Vitest 実行による影響はデフォルトで抑えられます。
    - ベース Vitest 設定は projects/config files を
      `forceRerunTriggers` としてマークするため、test
      wiring が変更されたときも changed-mode rerun は正確なままです。
    - 設定は、サポートされているホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効なままにします。
      直接 profiling 用に 1 つの明示的な cache location が必要な場合は、
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` は、Vitest の import-duration reporting と
      import-breakdown output を有効にします。
    - `pnpm test:perf:imports:changed` は、同じ profiling view を
      `origin/main` 以降に変更されたファイルへスコープします。
    - シャード timing data は `.artifacts/vitest-shard-timings.json` に書き込まれます。
      Whole-config runs は config path を key として使用します。include-pattern CI
      shards は shard 名を追加するため、filtered shards を個別に追跡できます。
    - 1 つの hot test が依然として startup imports に大半の時間を費やしている場合は、
      重い dependency を狭いローカル `*.runtime.ts` seam の背後に置き、
      runtime helpers を `vi.mock(...)` に通すためだけに deep-import するのではなく、
      その seam を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、routing された
      `test:changed` を、その committed
      diff の native root-project path と比較し、wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、現在の
      dirty tree を、変更ファイル一覧を
      `scripts/test-projects.mjs` と root Vitest config に通して routing することで benchmark します。
    - `pnpm test:perf:profile:main` は、
      Vitest/Vite startup と transform overhead 用の main-thread CPU profile を書き込みます。
    - `pnpm test:perf:profile:runner` は、
      file parallelism を無効にした unit suite 用の runner CPU+heap profiles を書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 worker に強制
- スコープ:
  - diagnostics をデフォルトで有効にした実際の loopback Gateway を起動します
  - synthetic gateway message、memory、large-payload churn を diagnostic event path 経由で駆動します
  - Gateway WS RPC 経由で `diagnostics.stability` を query します
  - diagnostic stability bundle persistence helpers をカバーします
  - recorder が bounded のままであること、synthetic RSS samples が pressure budget 未満に収まること、per-session queue depths が 0 に戻ることを assert します
- 期待値:
  - CI-safe かつ keyless
  - stability-regression follow-up 用の狭いレーンであり、Gateway suite 全体の代替ではありません

### E2E（gateway smoke）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E tests
- runtime defaults:
  - repo の残りと一致するように、Vitest `threads` を `isolate: false` で使用します。
  - adaptive workers を使用します（CI: 最大 2、local: デフォルト 1）。
  - console I/O overhead を減らすため、デフォルトで silent mode で実行します。
- 便利な override:
  - worker count を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - verbose console output を再度有効にするには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - multi-instance gateway end-to-end behavior
  - WebSocket/HTTP surfaces、node pairing、より重い networking
- 期待値:
  - CI で実行されます（pipeline で有効な場合）
  - 実際の key は不要です
  - unit tests より moving parts が多くなります（遅くなる場合があります）

### E2E: OpenShell backend smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由で host 上に isolated OpenShell gateway を起動します
  - 一時的なローカル Dockerfile から sandbox を作成します
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell backend を exercise します
  - sandbox fs bridge 経由で remote-canonical filesystem behavior を検証します
- 期待値:
  - opt-in のみです。デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLI と動作する Docker daemon が必要です
  - isolated `HOME` / `XDG_CONFIG_HOME` を使用し、その後 test gateway と sandbox を破棄します
- 便利な override:
  - broader e2e suite を手動で実行するときに test を有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - non-default CLI binary または wrapper script を指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（real providers + real models）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下の bundled-plugin live tests
- デフォルト: `pnpm test:live` により **enabled**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「この provider/model は、実際の creds で _today_ 本当に動作するか」
  - provider format changes、tool-calling quirks、auth issues、rate limit behavior を検出します
- 期待値:
  - 設計上 CI-stable ではありません（real networks、real provider policies、quotas、outages）
  - お金がかかる / rate limits を使用します
  - 「everything」ではなく、絞り込んだ subset の実行を優先してください
- live runs は `~/.profile` を source して、不足している API keys を取得します。
- デフォルトでは、live runs でも `HOME` を isolate し、config/auth material を temp test home にコピーするため、unit fixtures が実際の `~/.openclaw` を変更できません。
- live tests で実際の home directory を使う必要が意図的にある場合のみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かな mode がデフォルトです。`[live] ...` progress output は維持しますが、追加の `~/.profile` notice を抑制し、gateway bootstrap logs/Bonjour chatter を mute します。startup logs 全体を戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API key rotation（provider-specific）: comma/semicolon format の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、`OPENCLAW_LIVE_*_KEY` による per-live override を使用してください。tests は rate limit responses で retry します。
- Progress/heartbeat output:
  - Live suites は stderr に progress lines を出力するようになったため、Vitest console capture が quiet の場合でも、長い provider calls が visibly active になります。
  - `vitest.live.config.ts` は Vitest console interception を無効にするため、provider/gateway progress lines は live runs 中に即座に stream されます。
  - direct-model heartbeats は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - gateway/probe heartbeats は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

この decision table を使用してください:

- 編集ロジック/テスト: `pnpm test` を実行します（多く変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れる場合: `pnpm test:e2e` を追加します
- 「自分のボットが落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグする場合: 絞り込んだ `pnpm test:live` を実行します

## ライブ（ネットワークに触れる）テスト

ライブモデルマトリクス、CLI バックエンドのスモーク、ACP のスモーク、Codex app-server
ハーネス、すべてのメディアプロバイダーのライブテスト（Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス）およびライブ実行用の認証情報処理については、
[テスト — ライブスイート](/ja-JP/help/testing-live) を参照してください。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つのバケットに分かれます。

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で一致する profile-key のライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）だけを実行し、ローカルの設定ディレクトリとワークスペースをマウントします（マウントされている場合は `~/.profile` も読み込みます）。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker ライブランナーは、Docker 全体のスイープを実用的に保つため、デフォルトで小さめのスモーク上限を使います。
  `test:docker:live-models` のデフォルトは `OPENCLAW_LIVE_MAX_MODELS=12` で、
  `test:docker:live-gateway` のデフォルトは `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。より大きい網羅的なスキャンを明示的に
  実行したい場合は、これらの環境変数を上書きしてください。
- `test:docker:all` は `test:docker:live-build` でライブ Docker イメージを一度だけビルドし、`scripts/package-openclaw-for-docker.mjs` を通して OpenClaw を npm tarball として一度だけパックし、その後 2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用します。ベアなイメージは、インストール/更新/Plugin 依存関係レーン用の Node/Git ランナーだけです。これらのレーンは事前ビルド済みの tarball をマウントします。機能イメージは、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールします。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあります。`scripts/test-docker-all.mjs` が選択されたプランを実行します。集約では重み付きローカルスケジューラーを使います。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限は重いライブ、npm インストール、複数サービスのレーンが同時にすべて開始されないようにします。単一のレーンが有効な上限より重い場合でも、プールが空であればスケジューラーはそれを開始でき、その後キャパシティが再び利用可能になるまで単独で実行し続けます。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。Docker ホストに余力がある場合だけ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整してください。ランナーはデフォルトで Docker の事前チェックを実行し、古い OpenClaw E2E コンテナーを削除し、30 秒ごとにステータスを出力し、成功したレーンの所要時間を `.artifacts/docker-tests/lane-timings.json` に保存し、以後の実行ではその所要時間を使って長いレーンを先に開始します。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使い、選択されたレーン、パッケージ/イメージ要件、認証情報の CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使います。
- `Package Acceptance` は「このインストール可能な tarball はプロダクトとして動作するか」を確認する GitHub ネイティブのパッケージゲートです。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードし、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。`workflow_ref` は信頼済みのワークフロー/ハーネススクリプトを選択し、`package_ref` は `source=ref` のときにパックするソースコミット/ブランチ/タグを選択します。これにより、現在の受け入れロジックで古い信頼済みコミットを検証できます。プロファイルは範囲の広さ順に並んでいます。`smoke` はクイックなインストール/チャンネル/エージェントに加えて Gateway/設定、`package` はパッケージ/更新/Plugin コントラクトに加えてキーレスな upgrade-survivor フィクスチャ、公開ベースラインの upgrade survivor レーン、およびほとんどの Parallels パッケージ/更新カバレッジのデフォルトのネイティブ代替、`product` は MCP チャンネル、cron/サブエージェントのクリーンアップ、OpenAI web search、OpenWebUI を追加し、`full` は OpenWebUI 付きのリリースパス Docker チャンクを実行します。`published-upgrade-survivor` では、Package Acceptance は常に `package-under-test` を候補として、`published_upgrade_survivor_baseline` を公開ベースラインとして使い、デフォルトは `openclaw@latest` です。より広いカバレッジは、正確なベースライン値で複数の実行をディスパッチしてシャーディングします。公開レーンは、組み込みの `openclaw config set` コマンドレシピでベースラインを設定し、その後レーン概要にレシピ手順を記録します。リリース検証では、リリースパス Docker チャンクが重複するパッケージ/更新/Plugin レーンをすでにカバーしているため、カスタムパッケージデルタ（`bundled-channel-deps-compat plugins-offline`）に加えて Telegram パッケージ QA を実行します。アーティファクトから生成されたターゲット指定の GitHub Docker 再実行コマンドには、以前のパッケージアーティファクト、準備済みイメージ入力、および利用可能な場合は公開 upgrade-survivor ベースラインが含まれるため、失敗したレーンはパッケージとイメージの再ビルドを避けられます。
- ビルドおよびリリースチェックは、tsdown の後に `scripts/check-cli-bootstrap-imports.mjs` を実行します。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的なビルド済みグラフをたどり、コマンドディスパッチ前の起動処理が Commander、プロンプト UI、undici、ログ出力などのパッケージ依存関係をコマンドディスパッチ前にインポートしている場合は失敗します。また、バンドルされた Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否します。パッケージ化された CLI スモークは、ルートヘルプ、オンボーディングヘルプ、doctor ヘルプ、ステータス、設定スキーマ、モデル一覧コマンドもカバーします。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限されています。そのカットオフまでは、ハーネスは出荷済みパッケージのメタデータ不足だけを許容します。省略された非公開 QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャに含まれないパッチファイル、永続化されていない `update.channel`、レガシーな Plugin インストール記録の場所、マーケットプレイスのインストール記録永続化の欠落、および `plugins update` 中の設定メタデータ移行です。`2026.4.25` より後のパッケージでは、これらのパスは厳密な失敗になります。
- コンテナースモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、および `test:docker:config-reload` は、1 つ以上の実コンテナーを起動し、より高レベルの統合パスを検証します。

ライブモデル Docker ランナーは、必要な CLI 認証ホームだけ（または実行が絞り込まれていない場合はサポートされるすべての認証ホーム）も bind-mount し、実行前にそれらをコンテナーホームにコピーします。これにより、外部 CLI OAuth はホストの認証ストアを変更せずにトークンを更新できます。

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ACP バインド smoke: `pnpm test:docker:live-acp-bind` (スクリプト: `scripts/test-live-acp-bind-docker.sh`; 既定で Claude、Codex、Gemini を対象にし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` で Droid/OpenCode の厳密なカバレッジを提供)
- CLI バックエンド smoke: `pnpm test:docker:live-cli-backend` (スクリプト: `scripts/test-live-cli-backend-docker.sh`)
- Codex アプリサーバーハーネス smoke: `pnpm test:docker:live-codex-harness` (スクリプト: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- 可観測性 smoke: `pnpm qa:otel:smoke` はプライベートな QA ソースチェックアウトレーンです。npm tarball では QA Lab が省かれるため、意図的にパッケージ Docker リリースレーンには含めていません。
- Open WebUI live smoke: `pnpm test:docker:openwebui` (スクリプト: `scripts/e2e/openwebui-docker.sh`)
- オンボーディング ウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- Npm tarball オンボーディング/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` は、パック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、env-ref オンボーディングで OpenAI を構成し、既定で Telegram も構成し、doctor 修復によって Plugin ランタイム依存関係が有効化されたことを検証し、モックされた OpenAI agent ターンを 1 回実行します。事前ビルド済み tarball を `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用するか、`OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` でホスト側の再ビルドをスキップするか、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` で channel を切り替えます。
- 更新 channel 切り替え smoke: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker 内でグローバルにインストールし、パッケージ `stable` から git `dev` へ切り替え、永続化された channel と Plugin の更新後の動作を検証し、その後パッケージ `stable` に戻して更新ステータスを確認します。
- アップグレード生存 smoke: `pnpm test:docker:upgrade-survivor` は、agent、channel 設定、Plugin allowlist、古い Plugin runtime-deps 状態、既存の workspace/session ファイルを持つ、汚れた old-user fixture の上にパック済みの OpenClaw tarball をインストールします。live provider や channel keys なしでパッケージ更新と非対話型 doctor を実行し、その後 loopback Gateway を起動して、設定/状態の保持と起動/ステータスの予算を確認します。
- 公開済みアップグレード生存 smoke: `pnpm test:docker:published-upgrade-survivor` は既定で `openclaw@latest` をインストールし、現実的な既存ユーザーファイルを seed し、焼き込み済み command recipe でそのベースラインを構成し、結果の設定を検証し、その公開済みインストールを候補 tarball へ更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、構成済み intent、状態の保持、起動、ステータスの予算を確認します。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` でベースラインを上書きします。Package Acceptance は同じ値を `published_upgrade_survivor_baseline` として公開します。
- Session ランタイムコンテキスト smoke: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストの transcript 永続化と、影響を受ける重複 prompt-rewrite ブランチの doctor 修復を検証します。
- Bun グローバルインストール smoke: `bash scripts/e2e/bun-global-install-smoke.sh` は現在のツリーをパックし、隔離された home 内で `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み image provider を返すことを検証します。事前ビルド済み tarball を `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用するか、`OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` でホストビルドをスキップするか、`OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` でビルド済み Docker image から `dist/` をコピーします。
- インストーラー Docker smoke: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各 container 間で 1 つの npm cache を共有します。Update smoke は、候補 tarball にアップグレードする前の stable ベースラインとして、既定で npm `latest` を使います。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke workflow の `update_baseline_version` 入力で上書きします。非 root インストーラーチェックは隔離された npm cache を保持するため、root 所有の cache entry が user-local install の挙動を隠しません。ローカル再実行間で root/update/direct-npm cache を再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` で重複する direct-npm グローバル更新をスキップします。直接の `npm install -g` カバレッジが必要な場合は、その env なしでローカルにスクリプトを実行します。
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) は既定でルート Dockerfile image をビルドし、隔離された container home に 1 つの workspace を持つ 2 つの agent を seed し、`agents delete --json` を実行し、有効な JSON と workspace 保持の挙動を検証します。`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` で install-smoke image を再利用します。
- Gateway networking (2 つの container、WS auth + health): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) はソース E2E image と Chromium layer をビルドし、raw CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP role snapshot が link URL、cursor-promoted clickable、iframe ref、frame metadata をカバーすることを検証します。
- OpenAI Responses web_search minimal reasoning 回帰: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) は、Gateway 経由でモック OpenAI server を実行し、`web_search` が `reasoning.effort` を `minimal` から `low` へ引き上げることを検証し、その後 provider schema reject を強制して、生の detail が Gateway log に現れることを確認します。
- MCP channel bridge (seed 済み Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (実 stdio MCP server + 埋め込み Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (実 Gateway + 隔離 cron と one-shot subagent 実行後の stdio MCP child teardown): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke、ClawHub kitchen-sink install/uninstall、marketplace update、Claude-bundle enable/inspect): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定するか、既定の kitchen-sink package/runtime pair を `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` で上書きします。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub fixture server を使います。
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- バンドル済み Plugin runtime deps: `pnpm test:docker:bundled-channel-deps` は既定で小さな Docker runner image をビルドし、ホスト上で OpenClaw を 1 回ビルドしてパックし、その tarball を各 Linux install scenario に mount します。`OPENCLAW_SKIP_DOCKER_BUILD=1` で image を再利用し、新しいローカルビルド後に `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` でホスト側の再ビルドをスキップするか、`OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で既存の tarball を指定します。完全な Docker aggregate と release-path bundled-channel chunk はこの tarball を 1 回だけ事前パックし、その後 Telegram、Discord、Slack、Feishu、memory-lancedb、ACPX 向けの個別 update lane を含め、バンドル済み channel チェックを独立した lane に shard します。Release chunk は channel smoke、update target、setup/runtime contract を `bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b`、`bundled-channels-contracts` に分割します。aggregate の `bundled-channels` chunk は手動再実行用として引き続き利用できます。Release workflow は provider installer chunk とバンドル済み Plugin install/uninstall chunk も分割します。従来の `package-update`、`plugins-runtime`、`plugins-integrations` chunk は手動再実行用の aggregate alias として残ります。バンドル済み lane を直接実行する際に channel matrix を絞るには `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` を使い、update scenario を絞るには `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` を使います。scenario ごとの Docker 実行は既定で `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` です。multi-target update scenario は既定で `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` です。この lane は、`channels.<id>.enabled=false` と `plugins.entries.<id>.enabled=false` が doctor/runtime-dependency repair を抑止することも検証します。
- 反復中は、たとえば次のように無関係な scenario を無効化して、バンドル済み Plugin runtime deps を絞り込みます:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

共有 functional image を手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` などの suite 固有の image override は、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` が remote shared image を指している場合、まだローカルに存在しなければスクリプトが pull します。QR と installer の Docker テストは、共有 built-app runtime ではなく package/install の挙動を検証するため、独自の Dockerfile を保持します。

ライブモデルの Docker ランナーは、現在のチェックアウトも読み取り専用で bind mount し、
コンテナ内の一時作業ディレクトリへステージします。これにより、ランタイム
イメージをスリムに保ちながら、正確なローカルのソース/設定に対して Vitest を実行できます。
ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build` や
Gradle 出力ディレクトリなど、大きなローカル専用キャッシュやアプリのビルド出力をスキップするため、
Docker ライブ実行がマシン固有の成果物のコピーに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、Gateway のライブプローブが
コンテナ内で実際の Telegram/Discord などのチャネルワーカーを開始することはありません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンから
Gateway ライブカバレッジを絞り込んだり除外したりする必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルな互換性 smoke です。OpenAI 互換の HTTP エンドポイントを有効にした
OpenClaw Gateway コンテナを起動し、その Gateway に対して固定された Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証してから、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
初回実行は、Docker が Open WebUI イメージを pull する必要があったり、Open WebUI が自身のコールドスタート設定を完了する必要があったりするため、
目に見えて遅くなることがあります。
このレーンは使用可能なライブモデルキーを想定しており、Docker 化された実行でそれを提供する主な方法は
`OPENCLAW_PROFILE_FILE`（デフォルトは `~/.profile`）です。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、iMessage アカウントを必要としません。seed 済みの Gateway
コンテナを起動し、`openclaw mcp serve` を spawn する 2 つ目のコンテナを起動してから、
ルーティングされた会話の検出、トランスクリプト読み取り、添付ファイルのメタデータ、
ライブイベントキューの動作、アウトバウンド送信ルーティング、実際の stdio MCP ブリッジ越しの Claude 形式のチャネル +
権限通知を検証します。通知チェックは生の stdio MCP フレームを直接検査するため、
smoke は特定のクライアント SDK がたまたま表面化する内容だけでなく、
ブリッジが実際に emit する内容を検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、ライブモデルキーを必要としません。
リポジトリの Docker イメージをビルドし、コンテナ内で実際の stdio MCP プローブサーバーを起動し、
埋め込み Pi バンドル MCP ランタイムを通じてそのサーバーを具現化し、
ツールを実行してから、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルターする一方で、
`coding` と `messaging` が `bundle-mcp` ツールを保持することを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデルキーを必要としません。
実際の stdio MCP プローブサーバーを備えた seed 済み Gateway を起動し、
分離された Cron ターンと `/subagents spawn` の 1 回限りの子ターンを実行してから、
各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP 平易言語スレッド smoke（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に残してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な環境変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な設定/ワークスペースディレクトリを使用し、外部 CLI auth マウントなしで、`OPENCLAW_PROFILE_FILE` から source された環境変数のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI auth ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` へコピーされます
  - デフォルトのディレクトリ: `.minimax`
  - デフォルトのファイル: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推論された必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きできます
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` は実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` はコンテナ内のプロバイダーをフィルターします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報が環境変数ではなく profile store から取得されることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI smoke 用に Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI smoke で使用される nonce チェックプロンプトを上書きします
- `OPENWEBUI_IMAGE=...` は、固定された Open WebUI イメージタグを上書きします

## Docs 健全性

ドキュメント編集後に docs チェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全な Mintlify アンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフライン回帰（CI セーフ）

これらは実プロバイダーなしの「実パイプライン」回帰です:

- Gateway ツール呼び出し（モック OpenAI、実 Gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定書き込み + auth 適用）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性 eval（Skills）

「エージェント信頼性 eval」のように動作する CI セーフなテストは、すでにいくつかあります:

- 実 Gateway + エージェントループ経由のモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **意思決定:** Skills がプロンプトに列挙されたとき、エージェントは適切な skill を選ぶ（または無関係なものを避ける）か？
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか？
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界を assert するマルチターンシナリオ。

将来の eval は、まず決定的であるべきです:

- モックプロバイダーを使ってツール呼び出し + 順序、skill ファイル読み取り、セッション配線を assert するシナリオランナー。
- skill に焦点を当てた小さなシナリオスイート（使用 vs 回避、ゲーティング、プロンプトインジェクション）。
- CI セーフなスイートが整った後に限り、任意のライブ eval（opt-in、env-gated）。

## 契約テスト（Plugin とチャネル形状）

契約テストは、登録済みのすべての Plugin とチャネルがその
インターフェイス契約に準拠していることを検証します。検出されたすべての Plugin を反復し、
形状と動作の assert スイートを実行します。デフォルトの `pnpm test` unit レーンは、これらの共有 seam と smoke ファイルを意図的に
スキップします。共有チャネルまたはプロバイダー surface に触れる場合は、契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な Plugin 形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディング動作
- **outbound-payload** - メッセージペイロード構造
- **inbound** - インバウンドメッセージ処理
- **actions** - チャネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/roster API
- **group-policy** - グループポリシー適用

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャネルステータスプローブ
- **registry** - Plugin レジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - auth フロー契約
- **auth-choice** - auth choice/selection
- **catalog** - モデルカタログ API
- **discovery** - Plugin 検出
- **loader** - Plugin 読み込み
- **runtime** - プロバイダーランタイム
- **shape** - Plugin 形状/インターフェイス
- **wizard** - セットアップウィザード

### 実行タイミング

- plugin-sdk の export または subpath を変更した後
- チャネルまたはプロバイダー Plugin を追加または変更した後
- Plugin 登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## 回帰の追加（ガイダンス）

ライブで発見されたプロバイダー/モデルの問題を修正する場合:

- 可能であれば CI セーフな回帰を追加します（モック/スタブプロバイダー、または正確なリクエスト形状変換を capture）
- 本質的にライブ専用の場合（レート制限、auth ポリシー）は、ライブテストを狭く保ち、環境変数で opt-in にします
- バグを捕捉する最小の層を対象にすることを優先します:
  - プロバイダーリクエスト変換/replay バグ → 直接の models テスト
  - Gateway セッション/履歴/ツールパイプラインバグ → Gateway ライブ smoke または CI セーフな Gateway モックテスト
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとにサンプリングされたターゲットを 1 つ導出し、traversal-segment exec id が拒否されることを assert します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef ターゲットファミリーを追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは、分類されていないターゲット ID で意図的に失敗するため、新しいクラスが静かにスキップされることはありません。

## 関連

- [ライブテスト](/ja-JP/help/testing-live)
- [CI](/ja-JP/ci)
