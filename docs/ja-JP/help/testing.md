---
read_when:
    - ローカルまたはCIでテストを実行する。
    - model/providerのバグに対するリグレッションテストを追加する。
    - Gateway + agentの動作をデバッグする。
summary: 'テストキット: unit/e2e/liveスイート、Dockerランナー、および各テストが対象とする内容'
title: テスト
x-i18n:
    generated_at: "2026-04-23T14:04:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe0e9bdea78cba7e512358d2e4d428da04a2071188e74af2d5419d2c85eafe15
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClawには、3つのVitestスイート（unit/integration、e2e、live）と、少数のDockerランナーがあります。

このドキュメントは「どのようにテストするか」のガイドです:

- 各スイートが何を対象にしているか（そして意図的に何を対象外にしているか）
- 一般的なワークフロー（ローカル、push前、デバッグ）でどのコマンドを実行するか
- liveテストがどのように認証情報を見つけ、model/providerを選択するか
- 実際のmodel/provider問題に対するリグレッションをどのように追加するか

## クイックスタート

普段は:

- 完全ゲート（push前に期待される）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカル全スイート実行: `pnpm test:max`
- 直接のVitest watchループ: `pnpm test:watch`
- 直接のファイル指定は現在、extension/channelパスにも対応しています: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復修正しているときは、まず対象を絞った実行を優先してください。
- DockerバックのQAサイト: `pnpm qa:lab:up`
- Linux VMバックのQAレーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたとき、または追加の確信が欲しいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2Eスイート: `pnpm test:e2e`

実際のprovider/modelをデバッグするとき（実認証情報が必要）:

- Liveスイート（models + gateway tool/image probes）: `pnpm test:live`
- 1つのliveファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - CIカバレッジ: 毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` は、どちらも `include_live_suites: true` を付けて
    再利用可能なlive/E2E workflowを呼び出します。これにはproviderごとに分割された
    個別のDocker live model matrix jobsが含まれます。
  - 対象を絞ったCI再実行には、`OpenClaw Live And E2E Checks (Reusable)`
    を `include_live_suites: true` と `live_models_only: true` でdispatchしてください。
  - 高シグナルな新しいprovider secretsを追加するときは、`scripts/ci-hydrate-live-auth.sh`
    と `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`、およびその
    scheduled/release呼び出し元にも追加してください。
- Moonshot/Kimiのコストスモーク: `MOONSHOT_API_KEY` を設定したうえで、
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSONがMoonshot/K2.6を報告し、
  assistant transcriptが正規化された `usage.cost` を保存していることを確認してください。

ヒント: 失敗ケースが1つだけ必要な場合は、以下で説明するallowlist env varsを使ってliveテストを絞ることを優先してください。

## QA専用ランナー

これらのコマンドは、QA-labレベルの現実性が必要なときに、メインのテストスイートと並んで使います:

CIは専用workflowでQA Labを実行します。`Parity gate` は一致するPRと
手動dispatchでモックproviderを使って実行されます。`QA-Lab - All Lanes` は `main` に対して夜間実行され、
手動dispatchでも、モックparity gate、live Matrixレーン、Convex管理のlive Telegramレーンを
並列ジョブとして実行します。`OpenClaw Release Checks` はリリース承認前に同じレーンを実行します。

- `pnpm openclaw qa suite`
  - リポジトリバックのQAシナリオをホスト上で直接実行します。
  - デフォルトでは、分離された
    gateway workersを使って、選択された複数のシナリオを並列実行します。`qa-channel` のデフォルト同時実行数は4です（選択されたシナリオ数の範囲内）。worker数を調整するには `--concurrency <count>` を使い、従来の直列レーンには `--concurrency 1` を使ってください。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗終了コードなしでartifactが欲しい場合は `--allow-failures` を使ってください。
  - `live-frontier`、`mock-openai`、`aimock` のprovider modesをサポートします。
    `aimock` は、シナリオ認識型の `mock-openai` レーンを置き換えるのではなく、実験的な
    fixtureおよびprotocol-mockカバレッジのために、ローカルのAIMockバックprovider serverを起動します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じQAスイートを使い捨てのMultipass Linux VM内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じprovider/model選択フラグを再利用します。
  - Live実行では、guestにとって実用的なサポート済みQA認証入力が転送されます:
    envベースのprovider keys、QA live provider config path、および存在する場合の `CODEX_HOME`。
  - output dirsは、guestがマウントされたworkspace経由で書き戻せるように、リポジトリルート配下に維持する必要があります。
  - 通常のQA report + summaryに加え、Multipass logsを
    `.artifacts/qa-e2e/...` に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式のQA作業向けに、DockerバックのQAサイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のcheckoutからnpm tarballをビルドし、Docker内に
    グローバルインストールし、非対話式のOpenAI API-keyオンボーディングを実行し、デフォルトでTelegramを設定し、Plugin有効化によって実行時依存関係がオンデマンドでインストールされることを確認し、doctorを実行し、モックされたOpenAI
    endpointに対して1回のローカルagent turnを実行します。
  - 同じパッケージ済みインストールレーンをDiscordで実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使ってください。
- `pnpm test:docker:bundled-channel-deps`
  - 現在のOpenClawビルドをDocker内でpackしてインストールし、OpenAIを設定してGatewayを起動し、その後config編集で同梱channel/pluginsを有効化します。
  - セットアップ検出により未設定Pluginのランタイム依存関係が未インストールのまま維持されること、最初の設定済みGatewayまたはdoctor実行が各同梱Pluginのランタイム依存関係をオンデマンドでインストールすること、そして2回目の再起動ではすでに有効化された依存関係を再インストールしないことを確認します。
  - さらに、既知の古いnpmベースラインをインストールし、`openclaw update --tag <candidate>` を実行する前にTelegramを有効化し、候補版の
    post-update doctorが、ハーネス側のpostinstall修復なしに、同梱channelランタイム依存関係を修復することを確認します。
- `pnpm openclaw qa aimock`
  - 直接のprotocolスモークテスト用に、ローカルAIMock provider serverのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨てのDockerバックTuwunel homeserverに対して、Matrix live QAレーンを実行します。
  - このQA hostは現時点ではrepo/dev専用です。パッケージ版OpenClawインストールには
    `qa-lab` が同梱されないため、`openclaw qa` は公開されません。
  - Repo checkoutでは、同梱runnerが直接ロードされ、別途Pluginインストール手順は不要です。
  - 3つの一時的なMatrix users（`driver`、`sut`、`observer`）と1つのプライベートルームを用意し、実際のMatrix PluginをSUT transportとして使うQA gateway childを起動します。
  - デフォルトでは固定された安定版Tuwunel image `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使います。別のimageをテストする必要がある場合は `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrixは共有credential-source flagsを公開しません。これはこのレーンがローカルで使い捨てユーザーを用意するためです。
  - Matrix QA report、summary、observed-events artifact、および結合されたstdout/stderr output logを `.artifacts/qa-e2e/...` に書き込みます。
- `pnpm openclaw qa telegram`
  - envから受け取るdriverおよびSUT bot tokensを使って、実際のプライベートグループに対してTelegram live QAレーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group idは数値のTelegram chat idである必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。デフォルトではenv modeを使い、プールされたleaseにオプトインするには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗終了コードなしでartifactが欲しい場合は `--allow-failures` を使ってください。
  - 同じプライベートグループ内に2つの異なるbotsが必要で、SUT botはTelegram usernameを公開している必要があります。
  - 安定したbot-to-bot観測のために、両方のbotsについて `@BotFather` でBot-to-Bot Communication Modeを有効にし、driver botがグループ内のbotトラフィックを観測できることを確認してください。
  - Telegram QA report、summary、およびobserved-messages artifactを `.artifacts/qa-e2e/...` に書き込みます。返信シナリオには、driver送信要求から観測されたSUT返信までのRTTが含まれます。

Live transportレーンは、新しいtransportが逸脱しないよう、1つの標準契約を共有しています:

`qa-channel` は引き続き広範な合成QAスイートであり、live
transportカバレッジmatrixには含まれません。

| レーン | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix | x | x | x | x | x | x | x | x | |
| Telegram | x | | | | | | | | x |

### Convex経由の共有Telegram認証情報（v1）

`openclaw qa telegram` に対して `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、
QA labはConvexバックのプールから排他的leaseを取得し、
レーン実行中はそのleaseにheartbeatを送り、終了時にleaseを解放します。

参照用のConvex project scaffold:

- `qa/convex-credential-broker/`

必須env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したroleに応じた1つのsecret:
  - `maintainer` には `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` には `OPENCLAW_QA_CONVEX_SECRET_CI`
- Credential role selection:
  - CLI: `--credential-role maintainer|ci`
  - Envデフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CIではデフォルト `ci`、それ以外では `maintainer`）

任意のenv vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のtrace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル開発専用としてloopback `http://` Convex URLsを許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使うべきです。

メンテナー用の管理コマンド（pool add/remove/list）には、
特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向けCLI helpers:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

スクリプトやCI utilitiesで機械可読出力が必要な場合は `--json` を使ってください。

デフォルトendpoint契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇/再試行可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Success: `{ status: "ok" }`（または空の `2xx`）
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success: `{ status: "ok" }`（または空の `2xx`）
- `POST /admin/add`（maintainer secretのみ）
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove`（maintainer secretのみ）
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（maintainer secretのみ）
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Telegram kindのpayload形式:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値のTelegram chat id文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形式を検証し、不正なpayloadを拒否します。

### channelをQAに追加する

Markdown QAシステムにchannelを追加するには、必要なのはちょうど2つだけです:

1. そのchannel用のtransport adapter
2. channel契約を実行するscenario pack

共有の `qa-lab` hostがフローを所有できるなら、新しいトップレベルQAコマンドrootを追加してはいけません。

`qa-lab` は共有host mechanicsを所有します:

- `openclaw qa` コマンドroot
- スイートの起動と終了処理
- worker concurrency
- artifact書き込み
- レポート生成
- scenario実行
- 古い `qa-channel` scenarios用の互換エイリアス

Runner pluginsはtransport契約を所有します:

- `openclaw qa <runner>` を共有の `qa` root配下にどのようにマウントするか
- そのtransport向けにGatewayをどのように設定するか
- readinessをどのように確認するか
- inbound eventsをどのように注入するか
- outbound messagesをどのように観測するか
- transcriptsと正規化されたtransport stateをどのように公開するか
- transportバックのactionsをどのように実行するか
- transport固有のリセットまたはクリーンアップをどのように扱うか

新しいchannelの最小採用基準は次のとおりです:

1. 共有の `qa` rootの所有者は `qa-lab` のままにする。
2. transport runnerを共有の `qa-lab` host seam上に実装する。
3. transport固有のmechanicsはrunner Pluginまたはchannel harness内に閉じ込める。
4. 競合するrootコマンドを登録するのではなく、runnerを `openclaw qa <runner>` としてマウントする。
   Runner pluginsは `openclaw.plugin.json` に `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をexportする必要があります。
   `runtime-api.ts` は軽量に保ってください。遅延CLIおよびrunner実行は、別個のentrypointsの背後に置くべきです。
5. テーマ別の `qa/scenarios/` ディレクトリ配下でmarkdown scenariosを作成または調整する。
6. 新しいscenariosには汎用scenario helpersを使う。
7. リポジトリが意図的な移行中でない限り、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格です:

- 動作を `qa-lab` で1回だけ表現できるなら、`qa-lab` に置く。
- 動作が1つのchannel transportに依存するなら、そのrunner PluginまたはPlugin harnessに置く。
- scenarioが複数channelで使える新しい能力を必要とするなら、`suite.ts` にchannel固有の分岐を入れるのではなく、汎用helperを追加する。
- 動作が1つのtransportにしか意味を持たないなら、そのscenarioはtransport固有のままにし、それをscenario契約で明示する。

新しいscenariosに推奨される汎用helper名:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

既存scenarios向けの互換エイリアスは引き続き利用可能です。たとえば:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しいchannel作業では、汎用helper名を使うべきです。
互換エイリアスは、一斉移行を避けるために存在するのであって、新しいscenario作成のモデルではありません。

## テストスイート（何がどこで実行されるか）

スイートは「現実性が増していくもの」（そして不安定さ/コストも増すもの）として考えてください:

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 非対象指定実行では `vitest.full-*.config.ts` shardセットを使い、並列スケジューリングのためにmulti-project shardsをproject単位configへ展開することがあります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下のcore/unit inventories、および `vitest.unit.config.ts` で対象になっている許可済みの `ui` node tests
- スコープ:
  - 純粋なunit tests
  - プロセス内integration tests（gateway auth、routing、tooling、parsing、config）
  - 既知のバグに対する決定的なリグレッション
- 期待事項:
  - CIで実行される
  - 実キーは不要
  - 高速かつ安定しているべき
- Projectsに関する注記:
  - 非対象指定の `pnpm test` は、1つの巨大なネイティブルートproject processの代わりに、12個の小さなshard configs（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行するようになりました。これにより、負荷の高いマシンでのピークRSSを削減し、auto-reply/extension作業が無関係なスイートを飢えさせるのを防ぎます。
  - `pnpm test --watch` は、multi-shard watchループが現実的でないため、引き続きネイティブルート `vitest.config.ts` project graphを使います。
  - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリ対象をまずscoped lanes経由にルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` では完全なルートproject起動コストを払わずに済みます。
  - `pnpm test:changed` は、差分がルーティング可能なsource/test filesだけに触れている場合、変更されたgit pathsを同じscoped lanesへ展開します。config/setup編集は引き続き広いroot-project再実行にフォールバックします。
  - `pnpm check:changed` は、狭い作業に対する通常のスマートローカルゲートです。差分をcore、core tests、extensions、extension tests、apps、docs、release metadata、toolingに分類し、一致するtypecheck/lint/test lanesを実行します。公開Plugin SDKおよびplugin-contractの変更には、extensionsがそれらのcore契約に依存しているため、extension validationも含まれます。release metadataだけのversion bumpは、最上位version field以外のpackage変更を拒否するガード付きで、フルスイートではなく対象を絞ったversion/config/root-dependency checksを実行します。
  - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および類似の純粋utility領域からのimport-lightなunit testsは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` laneへルーティングされます。状態を持つ/ランタイムが重いファイルは既存のlanesに留まります。
  - 選択された `plugin-sdk` および `commands` helper source filesも、changed-mode実行をそれらのlight lanesの明示的な隣接テストへマッピングするため、helper編集ではそのディレクトリ全体の重いスイートを再実行せずに済みます。
  - `auto-reply` は現在、3つの専用bucketを持ちます: トップレベルcore helpers、トップレベルの `reply.*` integration tests、そして `src/auto-reply/reply/**` サブツリーです。これにより、もっとも重いreply harness作業を安価なstatus/chunk/token testsから切り離せます。
- Embedded runnerに関する注記:
  - message-tool discovery inputsまたはCompaction runtime contextを変更する場合、
    両レベルのカバレッジを維持してください。
  - 純粋なrouting/normalization境界には、対象を絞ったhelper regressionを追加してください。
  - さらに、embedded runner integration suitesも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、scoped idsとCompaction動作が実際の `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。helper-only testsは、そのintegration pathsの十分な代替にはなりません。
- Poolに関する注記:
  - ベースVitest configのデフォルトは現在 `threads` です。
  - 共有Vitest configは `isolate: false` も固定しており、root projects、e2e、live configs全体で非分離runnerを使います。
  - ルートUI laneはその `jsdom` setupとoptimizerを維持しますが、現在は共有の非分離runner上でも動作します。
  - 各 `pnpm test` shardは、共有Vitest configから同じ `threads` + `isolate: false` デフォルトを継承します。
  - 共有の `scripts/run-vitest.mjs` launcherは、大規模ローカル実行中のV8 compile churnを減らすため、デフォルトでVitest child Node processesに `--no-maglev` も追加するようになりました。標準のV8動作と比較したい場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
- 高速ローカル反復に関する注記:
  - `pnpm changed:lanes` は、差分がどのアーキテクチャlaneをトリガーするかを表示します。
  - pre-commit hookは、staged format/lintの後に `pnpm check:changed --staged` を実行するため、core専用のコミットでは、公開extension向け契約に触れない限りextension testコストを払いません。release metadata-only commitsは、対象を絞ったversion/config/root-dependency laneに留まります。
  - まったく同じstaged change setが、同等以上のゲートですでに検証済みなら、`scripts/committer --fast "<message>" <files...>` を使って、changed-scope hook再実行だけをスキップできます。staged format/lintは引き続き実行されます。handoffでは完了済みゲートを明記してください。これは、分離された不安定なhook failureを再実行してscoped proof付きで通過した後にも許容されます。
  - `pnpm test:changed` は、変更パスがきれいにより小さなスイートへマップされる場合、scoped lanesを経由します。
  - `pnpm test:max` と `pnpm test:changed:max` も同じルーティング動作を維持しつつ、worker上限だけが高くなります。
  - ローカルworker自動スケーリングは現在、意図的に保守的で、ホストのload averageがすでに高い場合にも抑制されるため、複数の同時Vitest実行による悪影響はデフォルトで少なくなります。
  - ベースVitest configはprojects/config filesを `forceRerunTriggers` としてマークするため、test wiringが変わったときでもchanged-mode再実行の正しさが保たれます。
  - configは、サポートされているhostsでは `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効なまま維持します。直接プロファイリング用に明示的なcache locationを1つ使いたい場合は `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
- Perf-debugに関する注記:
  - `pnpm test:perf:imports` はVitestのimport-duration reportingに加え、import-breakdown出力も有効にします。
  - `pnpm test:perf:imports:changed` は、`origin/main` 以降に変更されたファイルに対して同じprofiling viewをスコープします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、コミットされたその差分に対して、ルーティングされた `test:changed` とネイティブルートprojectパスを比較し、wall timeとmacOS max RSSを出力します。
- `pnpm test:perf:changed:bench -- --worktree` は、現在のdirty treeを、変更ファイル一覧を `scripts/test-projects.mjs` とルートVitest config経由でルーティングしてベンチマークします。
  - `pnpm test:perf:profile:main` は、Vitest/Vite起動とtransform overhead用のmain-thread CPU profileを書き出します。
  - `pnpm test:perf:profile:runner` は、ファイル並列を無効にしたunit suite用のrunner CPU+heap profilesを書き出します。

### Stability（gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 workerに強制
- スコープ:
  - デフォルトでdiagnostics有効の実ループバックGatewayを起動
  - 診断event pathを通じて、合成gateway message、memory、およびlarge-payload churnを流し込む
  - Gateway WS RPC経由で `diagnostics.stability` を照会
  - 診断stability bundle persistence helpersをカバー
  - recorderが上限内に留まり、合成RSS samplesがpressure budget未満に収まり、sessionごとのqueue depthsがゼロまで戻ることを検証
- 期待事項:
  - CI-safeかつキー不要
  - stability-regression追跡用の狭いレーンであり、完全なGateway suiteの代替ではない

### E2E（gateway smoke）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の同梱Plugin E2E tests
- ランタイムデフォルト:
  - リポジトリの他と同様に、Vitest `threads` と `isolate: false` を使います。
  - 適応的workerを使います（CI: 最大2、ローカル: デフォルト1）。
  - console I/O overheadを減らすため、デフォルトでsilent modeで実行します。
- 便利なoverride:
  - worker数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限16）。
  - 詳細なconsole出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - マルチインスタンスGatewayのend-to-end動作
  - WebSocket/HTTP surfaces、node pairing、およびより重いnetworking
- 期待事項:
  - パイプラインで有効なときはCIで実行される
  - 実キーは不要
  - unit testsより可動部が多い（遅くなることがある）

### E2E: OpenShell backend smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - ホスト上でDocker経由の分離されたOpenShell Gatewayを起動
  - 一時的なローカルDockerfileからsandboxを作成
  - 実際の `sandbox ssh-config` + SSH execを通じて、OpenClawのOpenShell backendを実行
  - sandbox fs bridgeを通じて、remote-canonical filesystem動作を検証
- 期待事項:
  - オプトイン専用であり、デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLIと動作するDocker daemonが必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テストGatewayとsandboxを破棄する
- 便利なoverride:
  - 広いe2eスイートを手動実行するときにこのテストを有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外のCLI binaryまたはwrapper scriptを指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実provider + 実models）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下の同梱Plugin live tests
- デフォルト: `pnpm test:live` により**有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このprovider/modelは、今日、実際の認証情報で本当に動くか?」
  - providerフォーマット変更、tool-callingの癖、auth問題、rate limit動作を検出
- 期待事項:
  - 設計上CI安定ではない（実ネットワーク、実providerポリシー、クォータ、障害）
  - コストがかかる / rate limitsを消費する
  - 「全部」ではなく、対象を絞ったsubset実行を優先する
- Live実行では、不足しているAPI keysを拾うために `~/.profile` をsourceします。
- デフォルトでは、live実行は依然として `HOME` を分離し、config/auth materialを一時テストhomeへコピーするため、unit fixturesが実際の `~/.openclaw` を変更できません。
- liveテストで意図的に実際のhome directoryを使う必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードがデフォルトです。`[live] ...` の進捗出力は維持しますが、追加の `~/.profile` 通知を抑制し、gateway bootstrap logs/Bonjour chatterをミュートします。完全な起動ログが欲しい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API keyローテーション（provider固有）: カンマ/セミコロン形式の `*_API_KEYS` または `*_API_KEY_1`、`*_API_KEY_2` を設定してください（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）。またはliveごとのoverrideとして `OPENCLAW_LIVE_*_KEY` を使えます。テストはrate limitレスポンス時に再試行します。
- 進捗/heartbeat出力:
  - Liveスイートは現在、stderrに進捗行を出力するため、Vitestのconsole captureが静かでも長いprovider呼び出しが動作中であることが見えます。
  - `vitest.live.config.ts` はVitestのconsole interceptionを無効にするため、provider/gatewayの進捗行はlive実行中に即座にストリームされます。
  - 直接modelのheartbeatは `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - gateway/probe heartbeatは `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか?

この判断表を使ってください:

- ロジック/テストを編集した: `pnpm test` を実行（大きく変更したなら `pnpm test:coverage` も）
- Gateway networking / WS protocol / pairingに触れた: `pnpm test:e2e` を追加
- 「botが落ちている」/ provider固有の障害 / tool callingをデバッグしている: 対象を絞った `pnpm test:live` を実行

## Live: Android Node capability sweep

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続されたAndroid Nodeが**現在公開しているすべてのコマンド**を呼び出し、コマンド契約動作を検証する。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/起動/ペアリングは行わない）。
  - 選択されたAndroid Nodeに対する、コマンドごとのgateway `node.invoke` 検証。
- 必須の事前セットアップ:
  - AndroidアプリがすでにGatewayへ接続 + ペアリングされていること。
  - アプリをforegroundに保つこと。
  - 通過させたいcapabilitiesに対する権限/キャプチャ同意が付与されていること。
- 任意の対象override:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
- Androidセットアップの詳細: [Android App](/ja-JP/platforms/android)

## Live: model smoke（profile keys）

Liveテストは、障害を切り分けられるよう、2層に分かれています:

- 「Direct model」は、そのprovider/modelが与えられたkeyでとにかく応答できるかを示します。
- 「Gateway smoke」は、そのmodelに対してフルのgateway+agent pipelineが動作するか（sessions、history、tools、sandbox policyなど）を示します。

### レイヤー1: Direct model completion（gatewayなし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 発見されたmodelsを列挙する
  - `getApiKeyForModel` を使って、認証情報を持つmodelsを選ぶ
  - modelごとに小さなcompletionを実行する（必要に応じて対象を絞ったリグレッションも）
- 有効化方法:
  - `pnpm test:live`（またはVitestを直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`、modernのエイリアス）を設定します。そうしないと、`pnpm test:live` をgateway smokeに集中させるためスキップされます
- model選択方法:
  - modern allowlistを実行するには `OPENCLAW_LIVE_MODELS=modern`（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` はmodern allowlistのエイリアス
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切りallowlist）
  - modern/all sweepは、デフォルトでは高シグナルな厳選上限数を使います。網羅的なmodern sweepには `OPENCLAW_LIVE_MAX_MODELS=0`、より小さい上限には正の数を設定します。
- provider選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りallowlist）
- keyの取得元:
  - デフォルト: profile storeとenv fallbacks
  - **profile storeのみ**を強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- これが存在する理由:
  - 「provider APIが壊れている / keyが無効」と「gateway agent pipelineが壊れている」を分離する
  - 小さく分離されたリグレッションを収める（例: OpenAI Responses/Codex Responsesのreasoning replay + tool-call flows）

### レイヤー2: Gateway + dev agent smoke（`@openclaw` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内Gatewayを起動
  - `agent:dev:*` sessionを作成/patchする（実行ごとにmodel override）
  - keyを持つmodelsを走査し、次を検証する:
    - 「意味のある」応答（toolsなし）
    - 実際のtool呼び出しが動作する（read probe）
    - 任意の追加tool probes（exec+read probe）
    - OpenAIリグレッションパス（tool-call-only → follow-up）が動作し続ける
- Probe詳細（障害をすぐ説明できるように）:
  - `read` probe: テストはworkspaceにnonceファイルを書き込み、agentにそれを `read` してnonceを返すよう求めます。
  - `exec+read` probe: テストはagentに `exec` でnonceを一時ファイルへ書かせ、その後 `read` で読み戻させます。
  - image probe: テストは生成したPNG（cat + ランダムコード）を添付し、modelが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` および `src/gateway/live-image-probe.ts`
- 有効化方法:
  - `pnpm test:live`（またはVitestを直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- model選択方法:
  - デフォルト: modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` はmodern allowlistのエイリアス
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）で絞る
  - modern/all gateway sweepは、デフォルトでは高シグナルな厳選上限数を使います。網羅的なmodern sweepには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`、より小さい上限には正の数を設定します。
- provider選択方法（「OpenRouter全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りallowlist）
- Tool + image probesはこのliveテストでは常時オン:
  - `read` probe + `exec+read` probe（tool stress）
  - modelがimage input対応を公開している場合、image probeが実行される
  - フロー（高レベル）:
    - テストは「CAT」+ ランダムコードを含む小さなPNGを生成する（`src/gateway/live-image-probe.ts`）
    - `agent` に `attachments: [{ mimeType: "image/png", content: "<base64>" }]` として送信
    - Gatewayがattachmentsを `images[]` に解析する（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded agentがマルチモーダルのユーザーメッセージをmodelへ転送する
    - 検証: 返信に `cat` + そのコードが含まれる（OCR許容: 軽微な誤りは許可）

ヒント: 自分のマシンで何をテストできるか（そして正確な `provider/model` ids）を見るには、次を実行してください:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke（Claude、Codex、Gemini、またはその他のローカルCLIs）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルトconfigに触れずに、ローカルCLI backendを使ってGateway + agent pipelineを検証する。
- Backend固有のsmoke defaultsは、所有extensionの `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（またはVitestを直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトprovider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image動作は、所有CLI backend Plugin metadataから取得される
- Overrides（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際のimage attachmentを送るには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（pathはpromptへ注入される）
  - prompt注入の代わりにimage file pathsをCLI argsとして渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`
  - `IMAGE_ARG` が設定されているときにimage argsの渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）
  - 2回目のturnを送りresume flowを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`
  - デフォルトのClaude Sonnet -> Opus同一session継続性probeを無効にするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択modelがswitch targetをサポートするときに強制オンするには `1`）

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Dockerレシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一provider用Dockerレシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注記:

- Docker runnerは `scripts/test-live-cli-backend-docker.sh` にあります。
- これはリポジトリDocker image内で、非rootの `node` ユーザーとしてlive CLI-backend smokeを実行します。
- 所有extensionからCLI smoke metadataを解決し、その後、対応するLinux CLI package（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）のキャッシュ可能で書き込み可能なprefixへインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` には、`~/.claude/.credentials.json` の `claudeAiOauth.subscriptionType` または `claude setup-token` の `CLAUDE_CODE_OAUTH_TOKEN` による、ポータブルなClaude Code subscription OAuthが必要です。まずDocker内で直接の `claude -p` を証明し、その後Anthropic API-key env varsを保持せずに2回のGateway CLI-backend turnを実行します。このsubscriptionレーンでは、Claudeが現在サードパーティアプリ利用を通常のsubscription plan limitsではなく追加利用課金へルーティングするため、Claude MCP/toolおよびimage probesはデフォルトで無効です。
- Live CLI-backend smokeは現在、Claude、Codex、Geminiに対して同じend-to-endフローを実行します: テキストturn、画像分類turn、その後gateway CLI経由で検証されるMCP `cron` tool call。
- Claudeのデフォルトsmokeでは、sessionをSonnetからOpusへpatchし、再開されたsessionが以前のメモをまだ覚えていることも検証します。

## Live: ACP bind smoke（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: live ACP agentを使って、実際のACP会話bindフローを検証する:
  - `/acp spawn <agent> --bind here` を送信
  - 合成のmessage-channel会話をその場でbind
  - 同じ会話上で通常のfollow-upを送信
  - そのfollow-upがbind済みACP session transcriptに到達することを検証
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker内のACP agents: `claude,codex,gemini`
  - 直接の `pnpm test:live ...` 用ACP agent: `claude`
  - 合成channel: Slack DM形式の会話コンテキスト
  - ACP backend: `acpx`
- Overrides:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- 注記:
  - このレーンは、admin専用の合成originating-route fields付きのgateway `chat.send` surfaceを使うため、外部配信を装わずにmessage-channelコンテキストをテストが付加できます。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択されたACP harness agentに対して、埋め込み `acpx` Pluginの組み込みagent registryを使います。

例:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Dockerレシピ:

```bash
pnpm test:docker:live-acp-bind
```

単一agent用Dockerレシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker注記:

- Docker runnerは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、サポートされるすべてのlive CLI agentsに対してACP bind smokeを順番に実行します: `claude`、`codex`、`gemini`。
- matrixを絞るには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` を使ってください。
- これは `~/.profile` をsourceし、一致するCLI auth materialをcontainerへstageし、書き込み可能なnpm prefixへ `acpx` をインストールし、その後必要なら要求されたlive CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）をインストールします。
- Docker内では、runnerは `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定するため、acpxはsourceされたprofileからのprovider env varsを子harness CLIで利用可能なまま維持します。

## Live: Codex app-server harness smoke

- 目的: 通常のgateway
  `agent` メソッドを通じて、Plugin管理のCodex harnessを検証する:
  - 同梱の `codex` Pluginをロード
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択
  - `codex/gpt-5.4` に最初のgateway agent turnを送信
  - 同じOpenClaw sessionに2回目のturnを送信し、app-server
    threadがresumeできることを検証
  - 同じgateway command
    pathを通じて `/codex status` と `/codex models` を実行
  - 任意で、Guardianレビュー付きの昇格shell probesを2つ実行: 1つは承認されるべき無害な
    コマンド、もう1つは拒否されてagentが再確認すべき偽のsecret upload
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトmodel: `codex/gpt-5.4`
- 任意のimage probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意のMCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意のGuardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このsmokeは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れたCodex
  harnessがPIへ静かにフォールバックして通過することはありません。
- Auth: shell/profileからの `OPENAI_API_KEY`、および任意でコピーされる
  `~/.codex/auth.json` と `~/.codex/config.toml`

ローカルレシピ:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Dockerレシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker注記:

- Docker runnerは `scripts/test-live-codex-harness-docker.sh` にあります。
- これはマウントされた `~/.profile` をsourceし、`OPENAI_API_KEY` を渡し、存在する場合はCodex CLI
  auth filesをコピーし、書き込み可能なマウント済みnpm
  prefixへ `@openai/codex` をインストールし、source treeをstageし、その後Codex-harness live testだけを実行します。
- Dockerでは、image、MCP/tool、Guardian probesがデフォルトで有効です。より狭いデバッグ実行が必要な場合は
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`、または
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定してください。
- Dockerでも、live
  test configと一致する `OPENCLAW_AGENT_HARNESS_FALLBACK=none` がexportされるため、`openai-codex/*` やPIフォールバックがCodex harness
  regressionを隠すことはできません。

### 推奨liveレシピ

狭く明示的なallowlistsがもっとも高速で不安定さも少ないです:

- 単一model、直接（gatewayなし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一model、gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数providerにまたがるtool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google重視（Gemini API key + Antigravity）:
  - Gemini（API key）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注記:

- `google/...` はGemini API（API key）を使います。
- `google-antigravity/...` はAntigravity OAuth bridge（Cloud Code Assist形式のagent endpoint）を使います。
- `google-gemini-cli/...` はあなたのマシン上のローカルGemini CLIを使います（別個のauth + toolingの癖があります）。
- Gemini APIとGemini CLI:
  - API: OpenClawはGoogleのホストされたGemini APIをHTTP経由で呼びます（API key / profile auth）。多くのユーザーが「Gemini」と言うときに意味するのはこれです。
  - CLI: OpenClawはローカルの `gemini` binaryをシェル実行します。独自のauthを持ち、動作が異なることがあります（streaming/tool対応/version差異）。

## Live: model matrix（何をカバーするか）

固定の「CI model list」はありません（liveはオプトイン）が、これらはキーを持つ開発マシンで定期的にカバーすることを**推奨する**modelsです。

### Modern smoke set（tool calling + image）

これは、動作し続けることを期待する「一般的なmodels」実行です:

- OpenAI（non-Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古いGemini 2.x modelsは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

tools + image付きでgateway smokeを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool calling（Read + 任意のExec）

provider familyごとに少なくとも1つは選んでください:

- OpenAI: `openai/gpt-5.4`（または `openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あると良い）:

- xAI: `xai/grok-4`（または最新利用可能版）
- Mistral: `mistral/`…（有効化している「tools」対応modelを1つ選ぶ）
- Cerebras: `cerebras/`…（アクセス権がある場合）
- LM Studio: `lmstudio/`…（ローカル。tool callingはAPI modeに依存）

### Vision: 画像送信（attachment → マルチモーダルメッセージ）

image probeを実行するために、少なくとも1つのimage対応modelを `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください（Claude/Gemini/OpenAIのvision対応variantsなど）。

### Aggregators / 代替gateways

キーが有効なら、次経由のテストもサポートしています:

- OpenRouter: `openrouter/...`（数百のmodels。tool+image対応候補を探すには `openclaw models scan` を使ってください）
- OpenCode: Zen用の `opencode/...` とGo用の `opencode-go/...`（authは `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

Live matrixに含められる他のproviders（認証情報/設定がある場合）:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers` 経由（カスタムendpoints）: `minimax`（cloud/API）、および任意のOpenAI/Anthropic互換proxy（LM Studio、vLLM、LiteLLMなど）

ヒント: ドキュメントに「全models」をハードコードしようとしないでください。権威ある一覧は、あなたのマシン上で `discoverModels(...)` が返すもの + 利用可能なkeysです。

## 認証情報（絶対にコミットしない）

Liveテストは、CLIと同じ方法で認証情報を検出します。実務上の意味:

- CLIが動くなら、liveテストも同じkeysを見つけるはずです。
- liveテストが「認証情報なし」と言う場合、`openclaw models list` / model選択をデバッグするときと同じ方法で調べてください。

- agentごとのauth profiles: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（liveテストで「profile keys」と言うときの意味はこれです）
- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシーstate dir: `~/.openclaw/credentials/`（存在する場合はstaged live homeへコピーされるが、メインのprofile-key storeではない）
- Liveローカル実行では、アクティブconfig、agentごとの `auth-profiles.json` files、レガシー `credentials/`、およびサポートされる外部CLI auth dirsを、デフォルトで一時テストhomeへコピーします。staged live homesでは `workspace/` と `sandboxes/` はスキップされ、`agents.*.workspace` / `agentDir` path overridesは取り除かれるため、probesが実際のホストworkspaceに触れません。

env keys（たとえば `~/.profile` でexportされたもの）に依存したい場合は、`source ~/.profile` の後にローカルテストを実行するか、以下のDocker runnersを使ってください（containerへ `~/.profile` をマウントできます）。

## Deepgram live（音声文字起こし）

- テスト: `extensions/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- テスト: `extensions/byteplus/live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 任意のmodel override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- スコープ:
  - 同梱のcomfy image、video、および `music_generate` パスを実行
  - `models.providers.comfy.<capability>` が設定されていない場合は各capabilityをスキップ
  - comfy workflow送信、polling、downloads、またはPlugin登録を変更した後に有用

## Image generation live

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- スコープ:
  - 登録されているすべての画像生成provider Pluginを列挙
  - probe前に、欠けているprovider env varsをログインシェル（`~/.profile`）から読み込む
  - デフォルトでは、保存済みauth profilesよりlive/env API keysを優先するため、`auth-profiles.json` にある古いテストkeysが実際のシェル認証情報を隠しません
  - 使用可能なauth/profile/modelがないprovidersはスキップ
  - 共有ランタイムcapabilityを通して、標準の画像生成variantsを実行:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされる同梱providers:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- 任意のauth動作:
  - profile-store authを強制し、env-only overridesを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Music generation live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- スコープ:
  - 共有された同梱music-generation providerパスを実行
  - 現在はGoogleとMiniMaxをカバー
  - probe前にprovider env varsをログインシェル（`~/.profile`）から読み込む
  - デフォルトでは、保存済みauth profilesよりlive/env API keysを優先するため、`auth-profiles.json` にある古いテストkeysが実際のシェル認証情報を隠しません
  - 使用可能なauth/profile/modelがないprovidersはスキップ
  - 利用可能な場合、宣言された両方のランタイムモードを実行:
    - prompt-only入力による `generate`
    - providerが `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンカバレッジ:
    - `google`: `generate`、`edit`
    - `minimax`: `generate`
    - `comfy`: 別のComfy liveファイルであり、この共有sweepではない
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意のauth動作:
  - profile-store authを強制し、env-only overridesを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video generation live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- スコープ:
  - 共有された同梱video-generation providerパスを実行
  - デフォルトではリリース安全なsmokeパスを使います: FAL以外のproviders、providerごとに1つのtext-to-video request、1秒のロブスターprompt、そして `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` によるproviderごとのoperation cap（デフォルト `180000`）
  - provider側queueレイテンシがリリース時間を支配しうるため、FALはデフォルトでスキップされます。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - probe前にprovider env varsをログインシェル（`~/.profile`）から読み込む
  - デフォルトでは、保存済みauth profilesよりlive/env API keysを優先するため、`auth-profiles.json` にある古いテストkeysが実際のシェル認証情報を隠しません
  - 使用可能なauth/profile/modelがないprovidersはスキップ
  - デフォルトでは `generate` のみを実行
  - 利用可能な場合に宣言済みtransform modesも実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定:
    - providerが `capabilities.imageToVideo.enabled` を宣言しており、選択したprovider/modelが共有sweepでbuffer-backedのローカル画像入力を受け入れる場合の `imageToVideo`
    - providerが `capabilities.videoToVideo.enabled` を宣言しており、選択したprovider/modelが共有sweepでbuffer-backedのローカル動画入力を受け入れる場合の `videoToVideo`
  - 共有sweepで現在宣言済みだがスキップされる `imageToVideo` providers:
    - `vydra`。同梱の `veo3` はtext-onlyであり、同梱の `kling` はリモート画像URLを必要とするため
  - Provider固有のVydraカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルはデフォルトで `veo3` text-to-videoに加え、リモート画像URL fixtureを使う `kling` レーンを実行します
  - 現在の `videoToVideo` liveカバレッジ:
    - 選択modelが `runway/gen4_aleph` のときのみ `runway`
  - 共有sweepで現在宣言済みだがスキップされる `videoToVideo` providers:
    - `alibaba`、`qwen`、`xai`。これらのパスは現在リモートの `http(s)` / MP4 reference URLsを必要とするため
    - `google`。現在の共有Gemini/Veoレーンはローカルbuffer-backed入力を使っており、そのパスは共有sweepでは受け入れられないため
    - `openai`。現在の共有レーンには、org固有のvideo inpaint/remix access保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルトsweepにFALを含むすべてのproviderを含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - より攻撃的なsmoke runのため、各provider operation capを減らすには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意のauth動作:
  - profile-store authを強制し、env-only overridesを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Media live harness

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有されたimage、music、videoのlive suitesを、1つのrepo-native entrypoint経由で実行
  - 欠けているprovider env varsを `~/.profile` から自動読み込み
  - デフォルトで、現在使用可能なauthを持つprovidersへ各suiteを自動的に絞り込む
  - `scripts/test-live.mjs` を再利用するため、heartbeatとquiet-mode動作が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker runners（任意の「Linuxでも動く」確認）

これらのDocker runnersは2つのカテゴリに分かれます:

- Live-model runners: `test:docker:live-models` と `test:docker:live-gateway` は、それぞれ対応するprofile-key liveファイルだけをrepo Docker image内で実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。ローカルconfig dirとworkspaceをマウントし（マウントされていれば `~/.profile` もsource）、対応するローカルentrypointsは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live runnersは、完全なDocker sweepが現実的なままであるよう、デフォルトでより小さいsmoke capを使います:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を使います。より大きい網羅的なスキャンが必要な場合は、それらのenv varsを上書きしてください。
- `test:docker:all` は、まず `test:docker:live-build` でlive Docker imageを1回ビルドし、その後それを2つのlive Docker lanesで再利用します。さらに、`test:docker:e2e-build` で共有の `scripts/e2e/Dockerfile` imageを1つビルドし、ビルド済みアプリを実行するE2E container smoke runnersで再利用します。
- Container smoke runners: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:config-reload` は、1つ以上の実コンテナを起動し、より高レベルなintegration pathsを検証します。

Live-model Docker runnersは、必要なCLI auth homesだけをbind-mountし（または実行が絞られていない場合はサポートされるものすべてをbind-mountし）、その後実行前にそれらをcontainer homeへコピーするため、外部CLI OAuthはホストauth storeを変更せずにトークンを更新できます:

- 直接models: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind smoke: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI backend smoke: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- Onboarding wizard（TTY、完全scaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` は、packしたOpenClaw tarballをDocker内にグローバルインストールし、env-ref onboarding + デフォルトでTelegram経由でOpenAIを設定し、Plugin有効化によってランタイム依存関係がオンデマンドでインストールされることを検証し、doctorを実行し、1回のモックOpenAI agent turnを実行します。事前ビルド済みtarballを再利用するには `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、新しいローカルビルド後にホスト再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`、channelを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使ってください。
- Gateway networking（2コンテナ、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、モックOpenAI serverをGateway経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` へ引き上げることを検証し、その後provider schema rejectを強制して生の詳細がGateway logsに現れることを確認します。
- MCP channel bridge（seed済みGateway + stdio bridge + 生のClaude notification-frame smoke）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（実stdio MCP server + 埋め込みPi profile allow/deny smoke）: `pnpm test:docker:pi-bundle-mcp-tools`（スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP cleanup（実Gateway + stdio MCP child teardown after isolated Cron and one-shot subagent runs）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（install smoke + `/plugin` alias + Claude-bundle restart semantics）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- Config reload metadata smoke: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- 同梱Pluginランタイム依存関係: `pnpm test:docker:bundled-channel-deps` は、デフォルトで小さなDocker runner imageをビルドし、OpenClawをホスト上で1回ビルドしてpackし、その後そのtarballを各Linux install scenarioへマウントします。imageを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`、新しいローカルビルド後のホスト再ビルドをスキップするには `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`、既存tarballを指すには `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使ってください。
- 反復中に同梱Pluginランタイム依存関係を狭めるには、無関係なscenariosを無効にしてください。たとえば:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

共有のbuilt-app imageを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなsuite固有のimage overrideが設定されている場合は、そちらが引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有imageを指している場合、scriptsはそれがまだローカルにないときにpullします。QRとinstallerのDocker testsは、共有built-app runtimeではなくpackage/install動作を検証するため、独自のDockerfilesを維持します。

Live-model Docker runnersは、現在のcheckoutも読み取り専用でbind-mountし、
container内の一時workdirにstageします。これにより、runtime
imageをスリムに保ちながら、正確にあなたのローカルsource/configに対してVitestを実行できます。
Stagingステップでは、大きなローカル専用cacheやアプリbuild outputs、たとえば
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、およびアプリローカルの `.build` や
Gradle output directories をスキップするため、Docker live実行が
マシン固有artifactのコピーに何分も費やすことがありません。
また、container内で実際のTelegram/Discordなどのchannel workersを
gateway live probesが起動しないよう、`OPENCLAW_SKIP_CHANNELS=1` も設定します。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、
そのDocker laneからgateway
live coverageを絞るまたは除外したい場合は、`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` はより高レベルな互換smokeです。これは
OpenAI互換HTTP endpointsを有効にしたOpenClaw gateway containerを起動し、
そのgatewayに対して固定版のOpen WebUI containerを起動し、Open WebUI経由でサインインし、
`/api/models` が `openclaw/default` を公開していることを確認し、その後
Open WebUIの `/api/chat/completions` proxy経由で実際のチャット要求を送信します。
初回実行は、Dockerが
Open WebUI imageをpullする必要があったり、Open WebUI自体のcold-start setupが完了する必要があったりするため、目に見えて遅いことがあります。
このレーンは使用可能なlive model keyを期待しており、Dockerized実行でそれを提供する主な方法は `OPENCLAW_PROFILE_FILE`
（デフォルト `~/.profile`）です。
成功時には `{ "ok": true, "model":
"openclaw/default", ... }` のような小さなJSON payloadが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、またはiMessageアカウントを必要としません。これはseed済みGateway
containerを起動し、`openclaw mcp serve` を起動する2つ目のcontainerを開始し、その後
ルーティングされた会話検出、transcript reads、attachment metadata、
live event queue動作、outbound send routing、およびClaude形式のchannel +
permission notificationsを、実際のstdio MCP bridge上で検証します。notification確認は
生のstdio MCP framesを直接検査するため、このsmokeは特定のclient SDKがたまたま表面化するものではなく、bridgeが実際に出力するものを検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、live
model keyを必要としません。これはrepo Docker imageをビルドし、container内で実際のstdio MCP probe serverを起動し、
そのserverを埋め込みPi bundle
MCP runtime経由で実体化し、toolを実行し、その後 `coding` と `messaging` が
`bundle-mcp` toolsを維持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらを除外することを検証します。
`test:docker:cron-mcp-cleanup` も決定的であり、live model
keyを必要としません。これは実際のstdio MCP probe server付きのseed済みGatewayを起動し、分離されたCron turnと `/subagents spawn` の単発child turnを実行し、その後各実行後に
MCP child processが終了することを検証します。

手動ACP平文thread smoke（CIではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはregression/debugワークフロー用に保持してください。ACP thread routing検証で再び必要になる可能性があるため、削除しないでください。

便利なenv vars:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前にsourceされます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、`OPENCLAW_PROFILE_FILE` からsourceされたenv varsのみを検証します。一時的なconfig/workspace dirsを使用し、外部CLI auth mountsは使いません
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker内でのキャッシュされたCLI installs用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部CLI auth dirs/filesは、`/host-auth...` 配下に読み取り専用でマウントされ、その後テスト開始前に `/home/node/...` へコピーされます
  - デフォルトdirs: `.minimax`
  - デフォルトfiles: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - providerを絞った実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定された必要なdirs/filesのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動overrideできます
- 実行を絞るには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- container内でprovidersをフィルターするには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 再ビルド不要の再実行で既存の `openclaw:local-live` imageを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報がprofile store由来であることを保証するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（envは使わない）
- Open WebUI smokeでgatewayが公開するmodelを選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smokeで使うnonce-check promptを上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定されたOpen WebUI image tagを上書きするには `OPENWEBUI_IMAGE=...`

## ドキュメント健全性

ドキュメント編集後はdocs checksを実行してください: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全なMintlify anchor validationを実行してください: `pnpm docs:check-links:anchors`。

## オフラインリグレッション（CI-safe）

これらは、実providerなしの「実パイプライン」リグレッションです:

- Gateway tool calling（モックOpenAI、実gateway + agent loop）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gatewayウィザード（WS `wizard.start`/`wizard.next`、config書き込み + auth強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## Agent信頼性evals（Skills）

CI-safeで「agent信頼性evals」のように振る舞うテストはいくつかすでにあります:

- 実gateway + agent loopを通したモックtool-calling（`src/gateway/gateway.test.ts`）。
- session wiringとconfig効果を検証するend-to-endウィザードフロー（`src/gateway/gateway.test.ts`）。

Skillsについてまだ不足しているもの（[Skills](/ja-JP/tools/skills) 参照）:

- **Decisioning:** promptにskillsが列挙されたとき、agentは正しいskillを選ぶか（または無関係なものを避けるか）?
- **Compliance:** agentは使用前に `SKILL.md` を読み、必須手順/argsに従うか?
- **Workflow contracts:** tool順序、session historyの引き継ぎ、sandbox境界を検証するmulti-turn scenarios。

将来のevalsも、まずは決定的であるべきです:

- mock providersを使い、tool calls + 順序、skill file reads、session wiringを検証するscenario runner。
- skillに焦点を当てた小さなsuite of scenarios（使うべきとき/避けるべきとき、gating、prompt injection）。
- オプトイン・env-gatedのlive evalsは、CI-safeスイートが整った後のみ。

## Contract tests（Pluginとchannelの形）

Contract testsは、登録されたすべてのPluginとchannelが
インターフェース契約に適合していることを検証します。発見されたすべてのpluginsを走査し、
形と動作に関する一連の検証を実行します。デフォルトの `pnpm test` unitレーンは、これらの共有seamおよびsmoke filesを意図的にスキップするため、共有channelまたはprovider surfaceに触れたときはcontractコマンドを明示的に実行してください。

### コマンド

- すべてのcontracts: `pnpm test:contracts`
- Channel contractsのみ: `pnpm test:contracts:channels`
- Provider contractsのみ: `pnpm test:contracts:plugins`

### Channel contracts

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的なPlugin形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - Session binding動作
- **outbound-payload** - メッセージpayload構造
- **inbound** - 受信メッセージ処理
- **actions** - Channel action handlers
- **threading** - Thread ID処理
- **directory** - Directory/roster API
- **group-policy** - グループポリシー強制

### Provider status contracts

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - Channel status probes
- **registry** - Plugin registry形状

### Provider contracts

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - Authフロー契約
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - セットアップウィザード

### 実行すべきタイミング

- plugin-sdk exportsまたはsubpathsを変更した後
- channelまたはprovider Pluginを追加または変更した後
- Plugin registrationまたはdiscoveryをリファクタリングした後

Contract testsはCIで実行され、実際のAPI keysは必要ありません。

## リグレッション追加のガイダンス

liveで見つかったprovider/model問題を修正したとき:

- 可能ならCI-safeなリグレッションを追加してください（providerをmock/stubする、または正確なrequest-shape transformationを捕捉する）
- 本質的にlive-onlyな場合（rate limits、auth policies）は、liveテストを狭く保ち、env varsでオプトインにしてください
- バグを捕まえる最小レイヤーを狙うことを優先してください:
  - provider request conversion/replay bug → 直接modelsテスト
  - gateway session/history/tool pipeline bug → gateway live smokeまたはCI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry metadata（`listSecretTargetRegistryEntries()`）からSecretRef classごとに1つのサンプルtargetを導出し、その後 traversal-segment exec ids が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target familyを追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは、未分類のtarget idsで意図的に失敗するため、新しいclassesが黙ってスキップされることはありません。
