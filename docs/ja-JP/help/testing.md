---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに回帰テストを追加する
    - Gateway + エージェント動作のデバッグ
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、および各テストがカバーする内容'
title: テスト
x-i18n:
    generated_at: "2026-05-02T20:50:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と少数の Docker ランナーがあります。このドキュメントは「テスト方法」のガイドです。

- 各スイートが何を対象にするか（そして意図的に何を対象にしないか）。
- 一般的なワークフロー（ローカル、push 前、デバッグ）で実行するコマンド。
- ライブテストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダーの問題に対するリグレッションを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、ライブ transport レーン）**は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) — `pnpm openclaw qa matrix` のリファレンス。
- [QA channel](/ja-JP/channels/qa-channel) — リポジトリに裏付けられたシナリオで使用される合成 transport Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行について説明します。下の QA 固有ランナーのセクション（[QA 固有ランナー](#qa-specific-runners)）では、具体的な `qa` 呼び出しを列挙し、上記のリファレンスを参照します。
</Note>

## クイックスタート

通常は次を使います。

- フルゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカル full-suite 実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は extension/channel パスにもルーティングされます: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復調査している場合は、まず対象を絞った実行を優先してください。
- Docker に裏付けられた QA サイト: `pnpm qa:lab:up`
- Linux VM に裏付けられた QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストを変更した場合、または追加の確信が必要な場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）:

- ライブスイート（モデル + Gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つのライブファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイムパフォーマンスレポート: 実際の `openai/gpt-5.4` エージェントターンには `live_gpt54=true`、Kova の CPU/ヒープ/トレースアーティファクトには `deep_profile=true` を指定して `OpenClaw Performance` を dispatch します。毎日のスケジュール実行では、`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、mock-provider、deep-profile、GPT 5.4 レーンのアーティファクトを `openclaw/clawgrit-reports` に公開します。mock-provider レポートには、ソースレベルの Gateway 起動、メモリ、Plugin 負荷、反復 fake-model hello-loop、CLI 起動時間の数値も含まれます。
- Docker ライブモデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さなファイル読み取り風プローブを実行します。メタデータが `image` 入力を示すモデルでは、小さな画像ターンも実行されます。プロバイダーの失敗を切り分ける場合は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効化します。
  - CI カバレッジ: 毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の `OpenClaw Release Checks` はどちらも、`include_live_suites: true` で再利用可能な live/E2E ワークフローを呼び出します。これには、プロバイダーごとに shard された個別の Docker ライブモデル matrix ジョブが含まれます。
  - 集中的な CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)` を dispatch します。
  - 新しい高シグナルのプロバイダー secret は、`scripts/ci-hydrate-live-auth.sh` に加えて `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` と、そのスケジュール/リリース呼び出し元に追加します。
- ネイティブ Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker ライブレーンを実行し、合成 Slack DM を `/codex bind` でバインドし、`/codex fast` と `/codex permissions` を実行したうえで、プレーンな返信と画像添付が ACP ではなくネイティブ Plugin バインディング経由でルーティングされることを検証します。
- Codex app-server ハーネス smoke: `pnpm test:docker:live-codex-harness`
  - Plugin 所有の Codex app-server ハーネスを通じて Gateway エージェントターンを実行し、`/codex status` と `/codex models` を検証します。デフォルトでは、画像、cron MCP、サブエージェント、Guardian プローブも実行します。他の Codex app-server 失敗を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` でサブエージェントプローブを無効化します。集中的なサブエージェントチェックでは、他のプローブを無効化します: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、これはサブエージェントプローブ後に終了します。
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command サーフェスに対する、オプトインの念押しチェックです。`/crestodian status` を実行し、永続的なモデル変更をキューに入れ、`/crestodian yes` に返信し、監査/config 書き込みパスを検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に fake Claude CLI がある config なしコンテナーで Crestodian を実行し、あいまいな planner fallback が監査付きの typed config 書き込みに変換されることを検証します。
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、裸の `openclaw` を Crestodian にルーティングし、setup/model/agent/Discord Plugin + SecretRef の書き込みを適用し、config を検証し、監査エントリを確認します。同じ Ring 0 setup パスは QA Lab でも `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` を設定した状態で `openclaw models list --provider moonshot --json` を実行し、続いて `moonshot/kimi-k2.6` に対して隔離された `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` を実行します。JSON が Moonshot/K2.6 を報告し、assistant transcript に正規化された `usage.cost` が保存されることを検証します。

<Tip>
失敗ケースが 1 つだけ必要な場合は、下で説明する allowlist env vars を使ってライブテストを絞り込むことを優先してください。
</Tip>

## QA 固有ランナー

QA-lab の現実性が必要な場合、これらのコマンドはメインのテストスイートの横に位置します。

CI は専用ワークフローで QA Lab を実行します。Agentic parity は `QA-Lab - All Lanes` とリリース検証の下にネストされており、独立した PR ワークフローではありません。広範な検証には、`rerun_group=qa-parity` または release-checks QA グループを指定した `Full Release Validation` を使用してください。`QA-Lab - All Lanes` は、`main` では nightly に、手動 dispatch では mock parity レーン、ライブ Matrix レーン、Convex 管理のライブ Telegram レーン、Convex 管理のライブ Discord レーンを並列ジョブとして実行します。スケジュールされた QA とリリースチェックは Matrix に `--profile fast` を明示的に渡しますが、Matrix CLI と手動ワークフロー入力のデフォルトは `all` のままです。手動 dispatch では、`all` を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブに shard できます。`OpenClaw Release Checks` は、リリース承認前に parity に加えて fast Matrix と Telegram レーンを実行し、リリース transport チェックには `mock-openai/gpt-5.5` を使用することで、決定的な挙動を保ち、通常の provider-plugin 起動を回避します。これらのライブ transport Gateway はメモリ検索を無効化します。メモリ挙動は QA parity スイートで引き続きカバーされます。

Full release live media shard は `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。これにはすでに `ffmpeg` と `ffprobe` が含まれています。Docker ライブ model/backend shard は、選択された commit ごとに一度だけビルドされる共有の `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各 shard 内で再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` でそれを pull します。

- `pnpm openclaw qa suite`
  - リポジトリに基づく QA シナリオをホスト上で直接実行します。
  - デフォルトでは、分離された gateway ワーカーで選択された複数のシナリオを並列実行します。`qa-channel` のデフォルト同時実行数は 4 です（選択されたシナリオ数で上限が設定されます）。ワーカー数を調整するには `--concurrency <count>` を使用し、従来のシリアルレーンを使うには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - provider モード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` は、シナリオ対応の `mock-openai` レーンを置き換えずに、実験的な fixture と protocol mock カバレッジ用にローカルの AIMock ベース provider サーバーを起動します。
- `pnpm test:gateway:cpu-scenarios`
  - gateway 起動ベンチと小さな mock QA Lab シナリオパック（`channel-chat-baseline`、`memory-failure-fallback`、`gateway-restart-inflight-run`）を実行し、結合された CPU 観測サマリーを `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは継続的な高 CPU 観測のみをフラグします（`--cpu-core-warn` と `--hot-wall-warn-ms`）。そのため、短い起動バーストは、数分間続く gateway 固定化リグレッションのように見えず、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使用します。チェックアウトに新しいランタイム出力がまだない場合は、先にビルドを実行します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを破棄可能な Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じ provider/model 選択フラグを再利用します。
  - live 実行では、ゲストで実用的なサポート対象の QA 認証入力を転送します。env ベースの provider キー、QA live provider 設定パス、存在する場合は `CODEX_HOME` です。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるように、リポジトリルート配下に維持する必要があります。
  - 通常の QA レポートとサマリーに加え、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - operator 形式の QA 作業用に Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルにインストールし、非対話型の OpenAI API キー オンボーディングを実行し、デフォルトで Telegram を設定し、パッケージ化された plugin ランタイムが起動時依存関係修復なしで読み込まれることを検証し、doctor を実行し、mock された OpenAI エンドポイントに対してローカル agent turn を 1 回実行します。
  - 同じパッケージ化インストールレーンを Discord で実行するには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキスト transcript 用の、決定的なビルド済みアプリ Docker smoke を実行します。非表示の OpenClaw ランタイムコンテキストが、表示される user turn に漏れずに非表示の custom message として永続化されることを検証し、その後、影響を受ける壊れた session JSONL を seed して、`openclaw doctor --fix` がバックアップ付きで active branch に書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内に OpenClaw パッケージ候補をインストールし、インストール済みパッケージのオンボーディングを実行し、インストール済み CLI 経由で Telegram を設定した後、そのインストール済みパッケージを SUT Gateway として live Telegram QA レーンを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。registry からインストールする代わりに解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使用します。CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて `OPENCLAW_QA_CONVEX_SITE_URL` と role secret を設定します。CI に `OPENCLAW_QA_CONVEX_SITE_URL` と Convex role secret が存在する場合、Docker wrapper は Convex を自動選択します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに限って共有の `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions では、このレーンを手動 maintainer workflow `NPM Telegram Beta E2E` として公開しています。merge 時には実行されません。この workflow は `qa-live-shared` environment と Convex CI credential lease を使用します。
- GitHub Actions では、1 つの候補パッケージに対する side-run product proof として `Package Acceptance` も公開しています。信頼済み ref、公開済み npm spec、SHA-256 付き HTTPS tarball URL、または別 run からの tarball artifact を受け取り、正規化済みの `openclaw-current.tgz` を `package-under-test` としてアップロードした後、既存の Docker E2E scheduler を smoke、package、product、full、または custom lane profile で実行します。同じ `package-under-test` artifact に対して Telegram QA workflow を実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL proof には digest が必要です。

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact proof は別の Actions run から tarball artifact をダウンロードします。

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw ビルドを Docker 内で pack してインストールし、OpenAI を設定して Gateway を起動した後、config 編集でバンドル済み channel/plugin を有効化します。
  - setup discovery により未設定の downloadable plugin が存在しないままになること、最初に設定された doctor repair が欠落している各 downloadable plugin を明示的にインストールすること、2 回目の restart で非表示の依存関係修復が実行されないことを検証します。
  - 既知の古い npm baseline もインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、candidate の post-update doctor が harness 側の postinstall repair なしで legacy plugin 依存関係の残骸をクリーンアップすることを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels guest 全体で native packaged-install update smoke を実行します。選択された各 platform は、最初に要求された baseline package をインストールし、その後同じ guest 内でインストール済みの `openclaw update` コマンドを実行し、インストール済み version、update status、gateway readiness、ローカル agent turn 1 回を検証します。
  - 1 つの guest で反復する場合は `--platform macos`、`--platform windows`、または `--platform linux` を使用します。summary artifact path とレーンごとの status には `--json` を使用します。
  - OpenAI レーンは、デフォルトで live agent-turn proof に `openai/gpt-5.5` を使用します。別の OpenAI model を意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels transport stall が残りの testing window を消費しないよう、長いローカル run は host timeout で包みます。

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトはネストされた lane log を `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。外側の wrapper がハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認します。
  - Windows update は cold guest では post-update doctor と package update 作業に 10 から 15 分かかることがあります。ネストされた npm debug log が進んでいる場合、それはまだ正常です。
  - この aggregate wrapper を個別の Parallels macOS、Windows、または Linux smoke lane と並行して実行しないでください。これらは VM state を共有しており、snapshot restore、package serving、または guest gateway state で衝突する可能性があります。
  - post-update proof は通常のバンドル済み plugin surface を実行します。これは、agent turn 自体が単純な text response だけを確認する場合でも、speech、image generation、media understanding などの capability facade がバンドル済み runtime API 経由で読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接 protocol smoke testing 用に、ローカル AIMock provider server だけを起動します。
- `pnpm openclaw qa matrix`
  - 破棄可能な Docker ベースの Tuwunel homeserver に対して Matrix live QA レーンを実行します。source checkout のみです。packaged install には `qa-lab` は同梱されません。
  - 完全な CLI、profile/scenario catalog、env vars、artifact layout: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - env の driver bot token と SUT bot token を使用して、実際の private group に対して Telegram live QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group id は数値の Telegram chat id である必要があります。
  - 共有 pooled credentials 用に `--credential-source convex` をサポートします。デフォルトでは env mode を使用し、pooled lease を使用するには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じ private group 内に 2 つの異なる bot が必要で、SUT bot は Telegram username を公開している必要があります。
  - 安定した bot 間観測のため、両方の bot で `@BotFather` の Bot-to-Bot Communication Mode を有効化し、driver bot が group bot traffic を観測できることを確認します。
  - Telegram QA レポート、サマリー、observed-messages artifact を `.artifacts/qa-e2e/...` 配下に書き込みます。replying scenario には、driver send request から観測された SUT reply までの RTT が含まれます。

Live transport lane は 1 つの標準 contract を共有し、新しい transport が逸脱しないようにしています。レーンごとの coverage matrix は [QA overview → Live transport coverage](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な synthetic suite であり、その matrix には含まれません。

### Convex 経由の共有 Telegram credentials (v1)

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA lab は Convex ベースの pool から排他的 lease を取得し、レーンの実行中にその lease へ Heartbeat を送り、shutdown 時に lease を解放します。

参照用 Convex project scaffold:

- `qa/convex-credential-broker/`

必須 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択された role 用の secret 1 つ:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` は `maintainer` 用
  - `OPENCLAW_QA_CONVEX_SECRET_CI` は `ci` 用
- Credential role selection:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルト `ci`、それ以外では `maintainer`）

任意 env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意の trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は local-only development 用に loopback `http://` Convex URL を許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用する必要があります。

Maintainer admin commands（pool add/remove/list）には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

maintainer 用 CLI helpers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

live run の前に `doctor` を使用して、Convex site URL、broker secrets、endpoint prefix、HTTP timeout、admin/list 到達性を、secret value を出力せずに確認します。script と CI utilities で machine-readable output を得るには `--json` を使用します。

デフォルトエンドポイント契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

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

Telegram kind のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列でなければなりません。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正な形式のペイロードを拒否します。

### QA にチャンネルを追加する

新しいチャンネルアダプターのアーキテクチャとシナリオヘルパー名は、[QA 概要 → チャンネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低要件: 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成します。

## テストスイート（何がどこで実行されるか）

スイートは「現実性が高まる」ものとして考えてください（同時に不安定さ/コストも高まります）:

### ユニット / 統合（デフォルト）

- コマンド: `pnpm test`
- 設定: ターゲット指定なしの実行では `vitest.full-*.config.ts` シャードセットを使い、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定へ展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下のコア/ユニットインベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- 範囲:
  - 純粋なユニットテスト
  - プロセス内統合テスト（Gateway 認証、ルーティング、ツール、解析、設定）
  - 既知のバグに対する決定的なリグレッション
- 期待事項:
  - CI で実行される
  - 実キーは不要
  - 高速で安定しているべき
  - リゾルバーと公開サーフェスローダーのテストは、実際のバンドル済み Plugin ソース API ではなく、生成された小さな Plugin フィクスチャで、広範な `api.js` と
    `runtime-api.js` のフォールバック動作を証明しなければなりません。実際の Plugin API ロードは
    Plugin 所有の契約/統合スイートに属します。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ付きレーン">

    - ターゲット指定なしの `pnpm test` は、巨大なネイティブルートプロジェクトプロセス 1 つではなく、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が削減され、auto-reply/extension の作業が無関係なスイートを圧迫することを避けられます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使います。マルチシャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストのスコープ付きレーンへ展開します。直接のテスト編集、隣接する `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフの依存先が対象です。設定/セットアップ/package の編集は、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使わない限り、テストを広範囲実行しません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートローカルチェックゲートです。diff をコア、コアテスト、extensions、extension テスト、アプリ、docs、リリースメタデータ、ライブ Docker ツール、ツールに分類し、対応する typecheck、lint、ガードコマンドを実行します。Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン bump は、トップレベルのバージョンフィールド以外の package 変更を拒否するガード付きで、対象を絞ったバージョン/設定/ルート依存関係チェックを実行します。
    - ライブ Docker ACP ハーネスの編集では、ライブ Docker 認証スクリプトのシェル構文と、ライブ Docker スケジューラーの dry-run という重点チェックを実行します。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定される場合のみ含まれます。依存関係、export、バージョン、その他の package サーフェス編集では、引き続き広範なガードを使います。
    - agents、commands、plugins、auto-reply ヘルパー、`plugin-sdk`、および同様の純粋なユーティリティ領域の import が軽いユニットテストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンにルーティングされます。状態を持つ/ランタイムが重いファイルは既存レーンに留まります。
    - 選択された `plugin-sdk` と `commands` のヘルパーソースファイルも、changed-mode 実行をそれらの軽量レーン内の明示的な隣接テストへマッピングするため、ヘルパー編集でそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルのコアヘルパー、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー用の専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、import が重い 1 つのバケットが Node の末尾全体を占有しないようにします。
    - 通常の PR/main CI は、extension バッチ sweep とリリース専用の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補に対して Plugin/extension が重いこれらのスイート用に、別個の `Plugin Prerelease` 子ワークフローをディスパッチします。

  </Accordion>

  <Accordion title="組み込みランナーのカバレッジ">

    - メッセージツール探索入力または Compaction ランタイム
      コンテキストを変更する場合は、両方のカバレッジレベルを維持してください。
    - 純粋なルーティングと正規化の
      境界には、重点的なヘルパーリグレッションを追加してください。
    - 組み込みランナー統合スイートを健全に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付き ID と Compaction 動作が実際の `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。ヘルパーのみのテストは、
      これらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool と分離のデフォルト">

    - ベース Vitest 設定のデフォルトは `threads` です。
    - 共有 Vitest 設定は `isolate: false` を固定し、ルートプロジェクト、e2e、ライブ設定全体で
      非分離ランナーを使います。
    - ルート UI レーンは `jsdom` セットアップと optimizer を維持しますが、
      こちらも共有の非分離ランナー上で実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false`
      デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 コンパイルの churn を減らすため、Vitest 子 Node
      プロセスにデフォルトで `--no-maglev` を追加します。
      標準の V8 動作と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、diff がどのアーキテクチャレーンをトリガーするかを表示します。
    - pre-commit hook はフォーマットのみです。フォーマット済みファイルを再ステージし、
      lint、typecheck、テストは実行しません。
    - スマートローカルチェックゲートが必要な場合は、handoff または push の前に
      `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストのスコープ付きレーンを経由します。agent が
      ハーネス、設定、package、または契約の編集に本当により広い Vitest カバレッジが必要だと判断した場合のみ、
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使ってください。
    - `pnpm test:max` と `pnpm test:changed:max` は、同じルーティング
      動作を維持し、worker 上限だけを高くします。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストの load average がすでに高い場合は
      後退するため、複数の同時
      Vitest 実行による影響はデフォルトで抑えられます。
    - ベース Vitest 設定は、テスト
      配線が変わったときに changed-mode の再実行が正しく保たれるよう、プロジェクト/設定ファイルを
      `forceRerunTriggers` としてマークします。
    - 設定は、サポートされる
      ホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効なままにします。直接プロファイリング用に
      明示的なキャッシュ場所を 1 つ使いたい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="パフォーマンスデバッグ">

    - `pnpm test:perf:imports` は、Vitest の import-duration レポートと
      import-breakdown 出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを
      `origin/main` 以降に変更されたファイルへスコープします。
    - シャードタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。
      設定全体の実行では設定パスをキーとして使います。include-pattern CI
      シャードはシャード名を追加するため、フィルターされたシャードを個別に追跡できます。
    - ある hot test がまだ起動 import に大半の時間を費やしている場合は、
      重い依存関係を狭いローカル `*.runtime.ts` シームの背後に置き、
      `vi.mock(...)` に通すためだけに runtime ヘルパーを deep-import するのではなく、
      そのシームを直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、コミット済み
      diff について、ルーティングされた `test:changed` とネイティブルートプロジェクトパスを比較し、
      wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を
      `scripts/test-projects.mjs` とルート Vitest 設定へルーティングして、現在の
      dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッドに対する
      main-thread CPU プロファイルを書き込みます。
    - `pnpm test:perf:profile:runner` は、ファイル並列化を無効にした
      unit スイートの runner CPU+heap プロファイルを書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（Gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 worker に強制
- 範囲:
  - diagnostics をデフォルトで有効にした実際の loopback Gateway を起動します
  - synthetic な gateway メッセージ、memory、大きなペイロード churn を diagnostic event パスに通します
  - Gateway WS RPC 経由で `diagnostics.stability` をクエリします
  - diagnostic stability bundle 永続化ヘルパーをカバーします
  - recorder が bounded のままであること、synthetic RSS samples が pressure budget 未満に留まること、per-session queue depths がゼロに戻ることをアサートします
- 期待事項:
  - CI セーフで keyless
  - 安定性リグレッションのフォローアップ用の狭いレーンであり、Gateway スイート全体の代替ではありません

### E2E（Gateway smoke）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下のバンドル済み Plugin E2E テスト
- ランタイムデフォルト:
  - リポジトリの他の部分と一致するよう、Vitest `threads` を `isolate: false` で使います。
  - 適応型 worker を使います（CI: 最大 2、ローカル: デフォルトで 1）。
  - console I/O オーバーヘッドを減らすため、デフォルトで silent mode で実行します。
- 便利な上書き:
  - worker 数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - 詳細な console 出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- 範囲:
  - 複数インスタンス Gateway のエンドツーエンド動作
  - WebSocket/HTTP サーフェス、node pairing、より重いネットワーキング
- 期待事項:
  - CI で実行される（パイプラインで有効な場合）
  - 実キーは不要
  - ユニットテストより可動部分が多い（遅くなる場合があります）

### E2E: OpenShell バックエンド smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker を介してホスト上で分離された OpenShell Gateway を起動する
  - 一時的なローカル Dockerfile からサンドボックスを作成する
  - 実際の `sandbox ssh-config` + SSH exec 経由で OpenClaw の OpenShell バックエンドを実行する
  - サンドボックス fs ブリッジを通じてリモート正規のファイルシステム動作を検証する
- 期待事項:
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作する Docker デーモンが必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト Gateway とサンドボックスを破棄する
- 便利なオーバーライド:
  - 広めの e2e スイートを手動で実行するときにテストを有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたはラッパースクリプトを指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### ライブ（実プロバイダー + 実モデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル済み Plugin ライブテスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で _今日_ 本当に動作するか？」
  - プロバイダーの形式変更、ツール呼び出しの癖、認証の問題、レート制限の挙動を検出する
- 期待事項:
  - 設計上 CI で安定しない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - 費用が発生する / レート制限を消費する
  - 「すべて」ではなく、絞り込んだサブセットの実行を推奨
- ライブ実行では、不足している API キーを取得するために `~/.profile` を読み込む。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定/認証情報を一時テストホームにコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更できない。
- ライブテストで意図的に実際のホームディレクトリを使用する必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定する。
- `pnpm test:live` は現在、より静かなモードをデフォルトにしている。`[live] ...` の進捗出力は保持するが、追加の `~/.profile` 通知を抑制し、Gateway ブートストラップログ/Bonjour の通信をミュートする。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定する。
- API キーのローテーション（プロバイダー別）: カンマ/セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、`OPENCLAW_LIVE_*_KEY` によるライブごとのオーバーライドを使用する。テストはレート制限レスポンスで再試行する。
- 進捗/Heartbeat 出力:
  - ライブスイートは stderr に進捗行を出力するようになったため、Vitest のコンソールキャプチャが静かな場合でも、長いプロバイダー呼び出しが動作中であることが見える。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効化し、ライブ実行中にプロバイダー/Gateway の進捗行を即時にストリームする。
  - ダイレクトモデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整する。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整する。

## どのスイートを実行すべきか？

この判断表を使用する:

- ロジック/テストを編集している: `pnpm test` を実行する（大きく変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れている: `pnpm test:e2e` を追加する
- 「自分のボットが落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグしている: 絞り込んだ `pnpm test:live` を実行する

## ライブ（ネットワークに触れる）テスト

ライブモデル行列、CLI バックエンドスモーク、ACP スモーク、Codex app-server
ハーネス、すべてのメディアプロバイダーのライブテスト（Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス）、さらにライブ実行の認証情報処理については、
[ライブスイートのテスト](/ja-JP/help/testing-live) を参照。専用の更新および
Plugin 検証チェックリストについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つのグループに分かれる:

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で対応するプロファイルキーのライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）だけを実行し、ローカル設定ディレクトリとワークスペースをマウントする（マウントされている場合は `~/.profile` も読み込む）。対応するローカルエントリーポイントは `test:live:models-profiles` と `test:live:gateway-profiles`。
- Docker ライブランナーは、Docker 全体のスイープを現実的に保つため、小さめのスモーク上限をデフォルトにする:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、また
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。より大きな網羅的スキャンを
  明示的に求める場合は、これらの環境変数をオーバーライドする。
- `test:docker:all` は `test:docker:live-build` でライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックしてから、2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用する。ベア画像は、インストール/更新/Plugin 依存関係レーン用の Node/Git ランナーだけであり、これらのレーンは事前ビルド済み tarball をマウントする。機能画像は、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールする。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にある。`scripts/test-docker-all.mjs` は選択されたプランを実行する。集約は重み付きローカルスケジューラーを使用する。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限は重いライブ、npm-install、マルチサービスのレーンがすべて同時に開始しないようにする。単一のレーンが有効な上限より重い場合でも、プールが空ならスケジューラーはそのレーンを開始でき、再び容量が利用可能になるまで単独で実行し続ける。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`。Docker ホストにさらに余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整する。ランナーはデフォルトで Docker 事前チェックを実行し、古い OpenClaw E2E コンテナーを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、以降の実行ではそのタイミングを使って長いレーンを先に開始する。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、パッケージ/イメージの要件、認証情報について CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用する。
- `Package Acceptance` は、「このインストール可能な tarball は製品として動作するか？」を確認する GitHub ネイティブのパッケージゲートである。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードしてから、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行する。プロファイルは広さの順に `smoke`、`package`、`product`、`full`。パッケージ/更新/Plugin 契約、公開済みアップグレードの生存マトリクス、リリースデフォルト、失敗トリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) を参照。
- ビルドおよびリリースチェックは tsdown の後に `scripts/check-cli-bootstrap-imports.mjs` を実行する。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的ビルドグラフをたどり、コマンドディスパッチ前の起動時に Commander、プロンプト UI、undici、ログなどのパッケージ依存関係がインポートされている場合に失敗する。また、バンドル済み Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否する。パッケージ化済み CLI スモークは、ルートヘルプ、onboard ヘルプ、doctor ヘルプ、status、設定スキーマ、モデル一覧コマンドもカバーする。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までを上限とする。その期限までは、ハーネスは出荷済みパッケージのメタデータ欠落のみを許容する。省略された private QA インベントリエントリー、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落したパッチファイル、永続化されていない `update.channel`、レガシー Plugin インストールレコードの場所、欠落したマーケットプレイスインストールレコードの永続化、`plugins update` 中の設定メタデータ移行である。`2026.4.25` より後のパッケージでは、これらのパスは厳密な失敗になる。
- コンテナースモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、および `test:docker:config-reload` は、1 つ以上の実コンテナーを起動し、より高レベルの統合パスを検証する。

ライブモデル Docker ランナーは、必要な CLI 認証ホームだけ（または実行が絞り込まれていない場合はサポートされているすべて）もバインドマウントし、その後、実行前にコンテナーホームへコピーするため、外部 CLI の OAuth はホストの認証ストアを変更せずにトークンを更新できる:

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ACPバインドスモーク: `pnpm test:docker:live-acp-bind` (スクリプト: `scripts/test-live-acp-bind-docker.sh`; デフォルトでClaude、Codex、Geminiをカバーし、`pnpm test:docker:live-acp-bind:droid`と`pnpm test:docker:live-acp-bind:opencode`でDroid/OpenCodeの厳密なカバレッジを提供)
- CLIバックエンドスモーク: `pnpm test:docker:live-cli-backend` (スクリプト: `scripts/test-live-cli-backend-docker.sh`)
- Codexアプリサーバーハーネススモーク: `pnpm test:docker:live-codex-harness` (スクリプト: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- 可観測性スモーク: `pnpm qa:otel:smoke`はプライベートなQAソースチェックアウトレーンです。npm tarballはQA Labを省略するため、意図的にパッケージのDockerリリースレーンには含まれていません。
- Open WebUIライブスモーク: `pnpm test:docker:openwebui` (スクリプト: `scripts/e2e/openwebui-docker.sh`)
- オンボーディングウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- npm tarballのオンボーディング/チャンネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent`は、パック済みのOpenClaw tarballをDocker内にグローバルインストールし、env-refオンボーディングに加えてデフォルトでTelegramを使ってOpenAIを設定し、doctorを実行し、モックされたOpenAIエージェントターンを1回実行します。事前ビルド済みtarballを再利用するには`OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`を使用し、ホスト側の再ビルドをスキップするには`OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`を使用し、チャンネルを切り替えるには`OPENCLAW_NPM_ONBOARD_CHANNEL=discord`を使用します。
- 更新チャンネル切り替えスモーク: `pnpm test:docker:update-channel-switch`は、パック済みのOpenClaw tarballをDocker内にグローバルインストールし、パッケージ`stable`からgit `dev`へ切り替え、永続化されたチャンネルと更新後のPluginが動作することを検証し、その後パッケージ`stable`へ戻して更新ステータスを確認します。
- アップグレードサバイバースモーク: `pnpm test:docker:upgrade-survivor`は、エージェント、チャンネル設定、Plugin許可リスト、古いPlugin依存状態、既存のワークスペース/セッションファイルを含む、汚れた古いユーザーフィクスチャの上にパック済みのOpenClaw tarballをインストールします。ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話型doctorを実行し、その後ループバックGatewayを開始して、設定/状態の保持に加えて起動/ステータス予算を確認します。
- 公開版アップグレードサバイバースモーク: `pnpm test:docker:published-upgrade-survivor`は、デフォルトで`openclaw@latest`をインストールし、現実的な既存ユーザーファイルをシードし、組み込みのコマンドレシピでそのベースラインを設定し、結果の設定を検証し、その公開インストールを候補tarballへ更新し、非対話型doctorを実行し、`.artifacts/upgrade-survivor/summary.json`を書き込み、その後ループバックGatewayを開始して、設定済みインテント、状態保持、起動、`/healthz`、`/readyz`、RPCステータス予算を確認します。1つのベースラインを上書きするには`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`を使用し、集約スケジューラに正確なベースラインを展開させるには`all-since-2026.4.23`などの`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`を使用し、issue形式のフィクスチャを展開するには`reported-issues`などの`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`を使用します。reported-issuesセットには、外部OpenClaw Pluginインストール修復を自動化する`configured-plugin-installs`が含まれます。Package Acceptanceでは、これらを`published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios`として公開しています。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context`は、隠しランタイムコンテキストのトランスクリプト永続化に加えて、影響を受けた重複プロンプト書き換えブランチのdoctor修復を検証します。
- Bunグローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh`は現在のツリーをパックし、隔離されたホームで`bun install -g`を使ってインストールし、`openclaw infer image providers --json`がハングせずにバンドル済み画像プロバイダーを返すことを検証します。事前ビルド済みtarballを再利用するには`OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`を使用し、ホストビルドをスキップするには`OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`を使用し、ビルド済みDockerイメージから`dist/`をコピーするには`OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`を使用します。
- インストーラーDockerスモーク: `bash scripts/test-install-sh-docker.sh`は、root、update、direct-npmコンテナ間で1つのnpmキャッシュを共有します。更新スモークは、候補tarballへアップグレードする前のstableベースラインとしてデフォルトでnpm `latest`を使用します。ローカルでは`OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`で上書きし、GitHubではInstall Smokeワークフローの`update_baseline_version`入力で上書きします。非rootインストーラーのチェックでは、root所有のキャッシュエントリがユーザーローカルのインストール動作を隠さないように、隔離されたnpmキャッシュを維持します。ローカル再実行間でroot/update/direct-npmキャッシュを再利用するには`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`を設定します。
- Install Smoke CIは、`OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`で重複するdirect-npmグローバル更新をスキップします。直接の`npm install -g`カバレッジが必要な場合は、そのenvなしでスクリプトをローカル実行します。
- エージェント削除の共有ワークスペースCLIスモーク: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`)は、デフォルトでルートDockerfileイメージをビルドし、隔離されたコンテナホームに1つのワークスペースを持つ2つのエージェントをシードし、`agents delete --json`を実行し、有効なJSONと保持されたワークスペース動作を検証します。install-smokeイメージを再利用するには`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`を使用します。
- Gatewayネットワーキング (2つのコンテナ、WS認証 + ヘルス): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- ブラウザーCDPスナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`)は、ソースE2EイメージとChromiumレイヤーをビルドし、生CDPでChromiumを起動し、`browser doctor --deep`を実行し、CDPロールスナップショットがリンクURL、カーソルで昇格されたクリック可能要素、iframe参照、フレームメタデータをカバーすることを検証します。
- OpenAI Responses `web_search`最小推論リグレッション: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`)は、モックされたOpenAIサーバーをGateway経由で実行し、`web_search`が`reasoning.effort`を`minimal`から`low`へ引き上げることを検証し、その後プロバイダースキーマを強制的に拒否させ、生の詳細がGatewayログに表示されることを確認します。
- MCPチャンネルブリッジ (シード済みGateway + stdioブリッジ + 生Claude通知フレームスモーク): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- PiバンドルMCPツール (実stdio MCPサーバー + 埋め込みPiプロファイル許可/拒否スモーク): `pnpm test:docker:pi-bundle-mcp-tools` (スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/サブエージェントMCPクリーンアップ (実Gateway + 隔離cronおよびワンショットサブエージェント実行後のstdio MCP子プロセス解放): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (ローカルパス、`file:`、ホイストされた依存関係を持つnpmレジストリ、git可動参照、ClawHub全部入り、マーケットプレイス更新、Claudeバンドル有効化/検査のインストール/更新スモーク): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHubブロックをスキップするには`OPENCLAW_PLUGINS_E2E_CLAWHUB=0`を設定し、デフォルトの全部入りパッケージ/ランタイムペアを上書きするには`OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC`と`OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`を設定します。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`がない場合、テストは自己完結型のローカルClawHubフィクスチャサーバーを使用します。
- Plugin更新の変更なしスモーク: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- 設定リロードメタデータスモーク: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins`は、ローカルパス、`file:`、ホイストされた依存関係を持つnpmレジストリ、git可動参照、ClawHubフィクスチャ、マーケットプレイス更新、Claudeバンドル有効化/検査のインストール/更新スモークをカバーします。`pnpm test:docker:plugin-update`は、インストール済みPluginsの変更なし更新動作をカバーします。

共有機能イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`などのスイート固有のイメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1`がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにないときにpullします。QRとインストーラーのDockerテストは、共有のビルド済みアプリランタイムではなくパッケージ/インストール動作を検証するため、独自のDockerfileを保持します。

ライブモデルDockerランナーも、現在のチェックアウトを読み取り専用でバインドマウントし、
コンテナ内の一時workdirへステージングします。これによりランタイム
イメージを小さく保ちながら、正確なローカルソース/設定に対してVitestを実行できます。
ステージング手順は、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの`.build`や
Gradle出力ディレクトリなど、大きなローカル専用キャッシュとアプリビルド出力をスキップするため、
Dockerライブ実行がマシン固有の成果物コピーに何分も費やすことはありません。
また、コンテナ内で実際のTelegram/DiscordなどのチャンネルワーカーをGatewayライブプローブが起動しないように、
`OPENCLAW_SKIP_CHANNELS=1`も設定します。
`test:docker:live-models`は引き続き`pnpm test:live`を実行するため、そのDockerレーンでGateway
ライブカバレッジを絞り込む、または除外する必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*`も渡してください。
`test:docker:openwebui`は、より高レベルの互換性スモークです。OpenAI互換HTTPエンドポイントを有効にした
OpenClaw Gatewayコンテナを起動し、そのGatewayに対して固定版のOpen WebUIコンテナを起動し、Open WebUI経由で
サインインし、`/api/models`が`openclaw/default`を公開していることを検証し、その後Open WebUIの
`/api/chat/completions`プロキシ経由で実際のチャットリクエストを送信します。
初回実行は、DockerがOpen WebUIイメージをpullする必要があったり、
Open WebUIが自身のコールドスタートセットアップを終える必要があったりするため、目に見えて遅くなる場合があります。
このレーンは利用可能なライブモデルキーを想定しており、`OPENCLAW_PROFILE_FILE`
(デフォルトは`~/.profile`)がDocker化された実行でそれを提供する主な方法です。
成功した実行は、`{ "ok": true, "model":
"openclaw/default", ... }`のような小さなJSONペイロードを出力します。
`test:docker:mcp-channels`は意図的に決定的であり、実際の
Telegram、Discord、iMessageアカウントを必要としません。シード済みGateway
コンテナを起動し、`openclaw mcp serve`をspawnする2つ目のコンテナを開始し、その後
ルーティングされた会話検出、トランスクリプト読み取り、添付ファイルメタデータ、
ライブイベントキュー動作、アウトバウンド送信ルーティング、実stdio MCPブリッジ上のClaude形式チャンネル +
権限通知を検証します。通知チェックは
生のstdio MCPフレームを直接検査するため、このスモークは特定のクライアントSDKがたまたま表面化する内容だけでなく、
ブリッジが実際に発行する内容を検証します。
`test:docker:pi-bundle-mcp-tools`は決定的であり、ライブ
モデルキーを必要としません。リポジトリDockerイメージをビルドし、コンテナ内で実stdio MCPプローブサーバーを起動し、
埋め込みPiバンドルMCPランタイムを通じてそのサーバーを実体化し、
ツールを実行し、その後`coding`と`messaging`が
`bundle-mcp`ツールを保持する一方で、`minimal`と`tools.deny: ["bundle-mcp"]`がそれらをフィルターすることを検証します。
`test:docker:cron-mcp-cleanup`は決定的であり、ライブモデル
キーを必要としません。実stdio MCPプローブサーバーを持つシード済みGatewayを起動し、
隔離されたcronターンと`/subagents spawn`ワンショット子ターンを実行し、その後
各実行後にMCP子プロセスが終了することを検証します。

手動ACP平易言語スレッドスモーク (CIではない):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグワークフロー用に保持してください。ACPスレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用なenv vars:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に読み込まれます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な設定/ワークスペースディレクトリを使用し、外部 CLI 認証マウントを使わずに、`OPENCLAW_PROFILE_FILE` から読み込まれた環境変数のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` にコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定される必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きできます
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` で実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` でコンテナ内のプロバイダーをフィルターします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報が（環境変数ではなく）プロファイルストアから取得されることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI スモーク用に Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI スモークで使用される nonce チェックプロンプトを上書きします
- `OPENWEBUI_IMAGE=...` は、固定された Open WebUI イメージタグを上書きします

## ドキュメントの健全性確認

ドキュメント編集後にドキュメントチェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、Mintlify の完全なアンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフラインリグレッション（CI セーフ）

これらは実プロバイダーを使わない「実パイプライン」のリグレッションです:

- Gateway ツール呼び出し（モック OpenAI、実 Gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定書き込み + 認証強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性評価（Skills）

「エージェント信頼性評価」のように振る舞う CI セーフなテストがすでにいくつかあります:

- 実 Gateway + エージェントループを通したモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills でまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **意思決定:** Skills がプロンプトに列挙されているとき、エージェントは適切な Skills を選ぶ（または無関係なものを避ける）か？
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか？
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界をアサートする複数ターンシナリオ。

将来の評価は、まず決定論的に保つべきです:

- モックプロバイダーを使ってツール呼び出し + 順序、Skills ファイル読み取り、セッション配線をアサートするシナリオランナー。
- Skills に焦点を当てた小規模なシナリオスイート（使用 vs 回避、ゲート、プロンプトインジェクション）。
- CI セーフなスイートが整備された後に限り、任意のライブ評価（オプトイン、環境変数でゲート）。

## 契約テスト（Plugin とチャネルの形状）

契約テストは、登録済みのすべての Plugin とチャネルがそのインターフェイス契約に準拠していることを検証します。検出されたすべての Plugin を反復処理し、形状と動作のアサーションスイートを実行します。デフォルトの `pnpm test` ユニットレーンは、これらの共有シームおよびスモークファイルを意図的にスキップします。共有チャネルまたはプロバイダーのサーフェスに触れる場合は、契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な Plugin 形状（id、名前、機能）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディング動作
- **outbound-payload** - メッセージペイロード構造
- **inbound** - 受信メッセージ処理
- **actions** - チャネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/ロスター API
- **group-policy** - グループポリシーの強制

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャネルステータスプローブ
- **registry** - Plugin レジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証の選択
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

契約テストは CI で実行され、実際の API キーは不要です。

## リグレッションの追加（ガイダンス）

ライブで発見されたプロバイダー/モデルの問題を修正する場合:

- 可能であれば CI セーフなリグレッションを追加します（モック/スタブプロバイダー、または正確なリクエスト形状変換のキャプチャ）
- 本質的にライブ専用の場合（レート制限、認証ポリシー）、ライブテストは狭く保ち、環境変数経由のオプトインにします
- バグを捕捉できる最小レイヤーを対象にすることを優先します:
  - プロバイダーリクエスト変換/再生バグ → 直接のモデルテスト
  - Gateway セッション/履歴/ツールパイプラインのバグ → Gateway ライブスモークまたは CI セーフな Gateway モックテスト
- SecretRef トラバーサルガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとにサンプル対象を 1 つ導出し、トラバーサルセグメントの exec id が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef ターゲットファミリーを追加する場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは未分類のターゲット id で意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。

## 関連

- [ライブテスト](/ja-JP/help/testing-live)
- [アップデートと Plugin のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
