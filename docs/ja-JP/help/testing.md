---
read_when:
    - ローカルまたはCIでテストを実行すること
    - model / providerのbugに対するregressionを追加すること
    - Gateway + agentの動作をデバッグすること
summary: 'テストキット: unit / e2e / live suite、Docker runner、および各テストの対象範囲'
title: Testing
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:32:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClawには3つのVitest suite（unit/integration、e2e、live）と、少数のDocker runnerがあります。このドキュメントは「どのようにテストするか」のガイドです。

- 各suiteが何を対象とするか（そして意図的に**何を**対象としないか）。
- 一般的なワークフロー（ローカル、push前、デバッグ）でどのcommandを実行するか。
- live testがどのようにcredentialを検出し、model/providerを選択するか。
- 実際のmodel/provider issueに対するregressionをどのように追加するか。

## クイックスタート

普段は次で十分です。

- 完全なgate（push前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの、より高速なローカル全suite実行: `pnpm test:max`
- 直接Vitest watch loop: `pnpm test:watch`
- 直接file指定は、extension/channel pathにも対応しています: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一のfailureを反復中は、まずtargeted runを優先してください。
- DockerベースのQA site: `pnpm qa:lab:up`
- Linux VMベースのQA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

testを触ったときや、より強い確信が欲しいとき:

- coverage gate: `pnpm test:coverage`
- E2E suite: `pnpm test:e2e`

実際のprovider/modelをデバッグするとき（実credentialが必要）:

- live suite（model + Gateway tool/image probe）: `pnpm test:live`
- 1つのlive fileだけを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - 選択された各modelは、text turnに加えて、小さなfile-read系probeも実行します。
    metadataで `image` inputを公開しているmodelは、小さなimage turnも実行します。
    provider failureを切り分けるときは、追加probeを `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で無効化できます。
  - CI coverage: 毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` はどちらも、`include_live_suites: true` を付けて
    再利用可能なlive/E2E workflowを呼び出します。これには、providerごとに分割された
    別個のDocker live model matrix jobが含まれます。
  - 集中したCI再実行には、`include_live_suites: true` と `live_models_only: true` を付けて
    `OpenClaw Live And E2E Checks (Reusable)` をdispatchしてください。
  - 新しい高シグナルprovider secretを追加する場合は、`scripts/ci-hydrate-live-auth.sh` と
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` およびその
    scheduled/release callerにも追加してください。
- ネイティブCodex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server経路に対してDocker live laneを実行し、合成Slack DMを `/codex bind` でbindし、
    `/codex fast` と `/codex permissions` を試し、その後、通常のreplyとimage attachmentが
    ACPではなくネイティブPlugin bindingを通ることを検証します。
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Plugin所有のCodex app-server harnessを通じてGateway agent turnを実行し、
    `/codex status` と `/codex models` を検証し、デフォルトではimage、
    cron MCP、sub-agent、Guardian probeも試します。Codex app-serverの
    他のfailureを切り分けるときは、sub-agent probeを
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` で無効化できます。集中した
    sub-agent確認には、他のprobeを無効化してください:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    これにより、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、
    sub-agent probeの後で終了します。
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - message-channel rescue command surface向けのopt-inのbelt-and-suspenders確認です。
    `/crestodian status` を試し、永続的なmodel変更をキューに入れ、`/crestodian yes` に返信し、
    audit/config書き込み経路を検証します。
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - configなしcontainer内で、`PATH` 上の偽Claude CLIを使ってCrestodianを実行し、
    fuzzy planner fallbackが監査付きの型付きconfig書き込みに変換されることを検証します。
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空のOpenClaw state dirから開始し、素の `openclaw` を
    Crestodianへルーティングし、setup/model/agent/Discord Plugin + SecretRef書き込みを適用し、
    configを検証して、audit entryを確認します。同じRing 0セットアップ経路は
    QA Labでも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`
    によってカバーされています。
- Moonshot/Kimi cost smoke: `MOONSHOT_API_KEY` を設定した状態で、
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して分離した
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSONがMoonshot/K2.6を報告し、
  assistant transcriptに正規化された `usage.cost` が保存されていることを確認してください。

ヒント: 失敗ケースが1つだけ必要な場合は、後述のallowlist env varを使ってlive testを狭めることを優先してください。

## QA固有runner

これらのcommandは、QA-labの現実性が必要なときに、主要test suiteに並んで使います。

CIでは、専用workflowでQA Labを実行します。`Parity gate` は、対応するPR上と
手動dispatchでmock providerとともに実行されます。`QA-Lab - All Lanes` は nightly に `main` で、
また手動dispatchで、mock parity gate、live Matrix lane、Convex管理のlive Telegram laneを
並列jobとして実行します。`OpenClaw Release Checks` は、release承認前に同じlaneを実行します。

- `pnpm openclaw qa suite`
  - repoベースのQA scenarioをhost上で直接実行します。
  - デフォルトでは、複数の選択されたscenarioを、分離された
    Gateway workerで並列実行します。`qa-channel` のデフォルトconcurrencyは4です
    （選択scenario数を上限）。worker数を調整するには `--concurrency <count>`、
    旧来の直列laneにするには `--concurrency 1` を使ってください。
  - いずれかのscenarioが失敗すると、非ゼロで終了します。失敗exit codeなしでartifactが欲しい場合は
    `--allow-failures` を使ってください。
  - provider modeとして `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` はローカルのAIMockベースprovider serverを起動し、scenario対応の
    `mock-openai` laneを置き換えることなく、実験的なfixtureおよびprotocol-mock coverageを提供します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じQA suiteを使い捨てのMultipass Linux VM内で実行します。
  - host上の `qa suite` と同じscenario選択動作を維持します。
  - `qa suite` と同じprovider/model選択flagを再利用します。
  - live runでは、guest向けに実用的な範囲の対応QA auth inputを転送します:
    envベースのprovider key、QA live provider config path、および存在する場合は `CODEX_HOME`。
  - output dirは、guestがmountされたworkspace経由で書き戻せるよう、
    repo root配下に留める必要があります。
  - 通常のQA report + summaryに加え、Multipass logを
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - operatorスタイルのQA作業向けに、DockerベースのQA siteを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のcheckoutからnpm tarballをビルドし、Dockerでそれをグローバルinstallし、
    非対話のOpenAI API key onboardingを実行し、デフォルトでTelegramを設定し、
    Plugin有効化によりruntime dependencyが必要時にinstallされることを検証し、
    doctorを実行し、mocked OpenAI endpointに対してローカルagent turnを1回実行します。
  - 同じpackaged-install laneをDiscordで実行するには
    `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使ってください。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みruntime context transcript向けの決定的なbuilt-app Docker smokeを実行します。
    隠されたOpenClaw runtime contextが、表示されるuser turnへ漏れるのではなく、
    非表示のcustom messageとして永続化されることを検証し、その後、影響を受けた壊れたsession JSONLをseedして、
    `openclaw doctor --fix` がそれをbackup付きで現行branchへ書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - 公開済みOpenClaw packageをDockerにinstallし、installed-package onboardingを実行し、
    installed CLI経由でTelegramを設定し、その後そのinstalled packageをSUT Gatewayとして
    live Telegram QA laneを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。
  - `pnpm openclaw qa telegram` と同じTelegram env credentialまたはConvex credential sourceを使います。
    CI/release automationでは、
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` と
    `OPENCLAW_QA_CONVEX_SITE_URL` およびrole secretを設定してください。
    CIで `OPENCLAW_QA_CONVEX_SITE_URL` とConvex role secretが存在する場合、
    Docker wrapperは自動的にConvexを選択します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このlane専用で
    共通の `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actionsでは、このlaneは手動maintainer workflow
    `NPM Telegram Beta E2E` として公開されています。mergeでは実行されません。
    workflowは `qa-live-shared` environmentとConvex CI credential leaseを使用します。
- `pnpm test:docker:bundled-channel-deps`
  - 現在のOpenClaw buildをpackしてDockerにinstallし、OpenAI設定済みでGatewayを起動し、
    config編集を通じて同梱channel / Pluginを有効化します。
  - setup discoveryにより、未設定Pluginのruntime dependencyが未導入のまま保たれること、
    最初の設定済みGatewayまたはdoctor実行時に各同梱Pluginのruntime dependencyが必要時にinstallされること、
    そして2回目のrestartではすでに有効化済みのdependencyが再installされないことを検証します。
  - また、既知の古いnpm baselineをinstallし、Telegramを有効化してから
    `openclaw update --tag <candidate>` を実行し、そのcandidateの
    更新後doctorが、harness側のpostinstall修復なしに同梱channel runtime dependencyを修復することも検証します。
- `pnpm test:parallels:npm-update`
  - Parallels guest全体で、ネイティブpackaged-install update smokeを実行します。各選択platformは
    最初に要求されたbaseline packageをinstallし、その後、同じguest内で
    installed `openclaw update` commandを実行し、installed version、update status、
    Gateway readiness、およびローカルagent turnを1回検証します。
  - 1つのguestだけを反復中は、`--platform macos`、`--platform windows`、または `--platform linux` を使ってください。
    summary artifact pathと各lane statusには `--json` を使ってください。
  - OpenAI laneは、live agent-turn proofにデフォルトで `openai/gpt-5.5` を使用します。
    別のOpenAI modelを意図的に検証する場合は、`--model <provider/model>` を渡すか、
    `OPENCLAW_PARALLELS_OPENAI_MODEL` を設定してください。
  - 長時間のローカル実行は、Parallels transport stallがテスト時間全体を消費しないよう、
    host timeoutで包んでください。

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - scriptは、ネストされたlane logを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。
    外側wrapperが停止していると判断する前に、
    `windows-update.log`、`macos-update.log`、または `linux-update.log`
    を確認してください。
  - Windows updateは、冷えたguestではpost-update doctor/runtime
    dependency修復に10〜15分かかることがありますが、ネストされた
    npm debug logが進んでいれば、それでも正常です。
  - この集約wrapperを、個別のParallels macOS、Windows、Linux smoke laneと並列実行しないでください。
    これらはVM stateを共有しており、snapshot restore、package serving、
    またはguest Gateway stateで衝突する可能性があります。
  - 更新後proofは通常の同梱Plugin surfaceを実行します。speech、image generation、
    media understandingのようなcapability facadeは、agent turn自体が単純なtext応答しか
    確認しない場合でも、同梱runtime API経由で読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接protocol smoke test用に、ローカルAIMock provider serverのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨てのDockerベースTuwunel homeserverに対して、Matrix live QA laneを実行します。
  - このQA hostは現在repo/dev専用です。packaged OpenClaw installには
    `qa-lab` が同梱されないため、`openclaw qa` は公開されません。
  - repo checkoutでは同梱runnerを直接読み込むため、別途Plugin install手順は不要です。
  - 一時的なMatrix user 3人（`driver`, `sut`, `observer`）と1つのprivate roomを用意し、その後
    実際のMatrix PluginをSUT transportとして使うQA gateway childを起動します。
  - デフォルトでは固定された安定版Tuwunel image `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使用します。別のimageを試す必要がある場合は `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrixは共有credential-source flagを公開しません。このlaneがローカルで使い捨てuserを用意するためです。
  - Matrix QA report、summary、observed-events artifact、およびcombined stdout/stderr output logを `.artifacts/qa-e2e/...` 配下に書き込みます。
  - デフォルトでprogressを出力し、`OPENCLAW_QA_MATRIX_TIMEOUT_MS`（デフォルト30分）で厳格なrun timeoutを適用します。cleanupは `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` により制限され、失敗時には復旧用の `docker compose ... down --remove-orphans` commandが含まれます。
- `pnpm openclaw qa telegram`
  - envから取得したdriverおよびSUT bot tokenを使って、実際のprivate groupに対してTelegram live QA laneを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group idは数値のTelegram chat idである必要があります。
  - 共有プールcredential用に `--credential-source convex` をサポートします。デフォルトではenv modeを使い、プールleaseにopt-inするには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - いずれかのscenarioが失敗すると非ゼロで終了します。失敗exit codeなしでartifactが欲しい場合は `--allow-failures` を使ってください。
  - 同じprivate group内にいる2つの異なるbotが必要で、SUT botはTelegram usernameを公開している必要があります。
  - 安定したbot-to-bot観測のために、両botの `@BotFather` でBot-to-Bot Communication Modeを有効にし、driver botがgroup内のbot trafficを観測できるようにしてください。
  - Telegram QA report、summary、およびobserved-messages artifactを `.artifacts/qa-e2e/...` 配下に書き込みます。reply scenarioには、driverのsend requestから観測されたSUT replyまでのRTTが含まれます。

live transport laneは、新しいtransportが乖離しないよう、1つの標準契約を共有しています。

`qa-channel` は引き続き広範なsynthetic QA suiteであり、live
transport coverage matrixには含まれません。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex経由の共有Telegram credential (v1)

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、QA labはConvexベースpoolから排他的leaseを取得し、そのleaseをlane実行中にheartbeatし、終了時にleaseを解放します。

参考用Convex project scaffold:

- `qa/convex-credential-broker/`

必須env var:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したrole用のsecret:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- credential role選択:
  - CLI: `--credential-role maintainer|ci`
  - Envデフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CIではデフォルト `ci`、それ以外では `maintainer`）

任意のenv var:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のtrace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けにloopback `http://` Convex URLを許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用すべきです。

maintainer向け管理command（pool add / remove / list）には、
特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

maintainer向けCLI helper:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

live run前には `doctor` を使って、Convex site URL、broker secret、
endpoint prefix、HTTP timeout、admin / list到達性を、secret値を表示せずに確認してください。scriptやCI utility向けの機械可読出力には `--json` を使ってください。

デフォルトendpoint契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 枯渇 / 再試行可能: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

Telegram kindのpayload形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値のTelegram chat id文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正なpayloadを拒否します。

### channelをQAに追加する

markdown QA systemにchannelを追加するには、必要なものは正確に2つです。

1. そのchannel用のtransport adapter。
2. channel契約を検証するscenario pack。

共有 `qa-lab` hostがフローを管理できる場合、新しいトップレベルQA command rootを追加しないでください。

`qa-lab` は共有host mechanicsを所有します。

- `openclaw qa` command root
- suiteの起動と終了
- worker concurrency
- artifact書き込み
- report生成
- scenario実行
- 旧 `qa-channel` scenario向けの互換alias

runner Pluginはtransport契約を所有します。

- `openclaw qa <runner>` が共有 `qa` root配下にどうmountされるか
- そのtransport向けにGatewayをどう設定するか
- readinessをどう確認するか
- inbound eventをどう注入するか
- outbound messageをどう観測するか
- transcriptと正規化されたtransport stateをどう公開するか
- transport-backed actionをどう実行するか
- transport固有のresetまたはcleanupをどう扱うか

新しいchannelの最小採用基準は次のとおりです。

1. 共有 `qa` rootの所有者として `qa-lab` を維持する。
2. 共有 `qa-lab` host seam上にtransport runnerを実装する。
3. transport固有mechanicsはrunner Pluginまたはchannel harness内に閉じ込める。
4. 競合するroot commandを登録するのではなく、runnerを `openclaw qa <runner>` としてmountする。
   runner Pluginは `openclaw.plugin.json` に `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をexportすべきです。
   `runtime-api.ts` は軽量に保ち、lazy CLIおよびrunner実行は別entrypointの後ろに置いてください。
5. テーマ別の `qa/scenarios/` directory配下にmarkdown scenarioを作成または適応する。
6. 新しいscenarioには汎用scenario helperを使う。
7. repoが意図的な移行中でない限り、既存の互換aliasを維持する。

判断ルールは厳格です。

- 振る舞いを `qa-lab` に一度だけ書けるなら、`qa-lab` に置く。
- 振る舞いが1つのchannel transportに依存するなら、そのrunner PluginまたはPlugin harness内に置く。
- scenarioが複数channelで使える新capabilityを必要とするなら、`suite.ts` にchannel固有分岐を追加するのではなく、汎用helperを追加する。
- 振る舞いが1つのtransportでしか意味を持たないなら、そのscenarioはtransport固有のままにし、scenario契約でそれを明示する。

新しいscenario向けの推奨汎用helper名:

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

既存scenario向けには、引き続き互換aliasも利用可能です。

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しいchannel作業では、汎用helper名を使うべきです。
互換aliasはflag day移行を避けるために存在するのであって、
新しいscenario作成のモデルではありません。

## test suite（どこで何が動くか）

suiteは「現実性が増す順」（そしてflakiness / costも増す順）で考えてください。

### Unit / integration（デフォルト）

- Command: `pnpm test`
- Config: 非target指定runでは `vitest.full-*.config.ts` のshard setを使い、並列スケジューリングのためにmulti-project shardをproject単位configへ展開することがあります
- File: `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` 配下のcore / unit inventory、および `vitest.unit.config.ts` が対象とするwhitelist済み `ui` node test
- Scope:
  - 純粋なunit test
  - in-process integration test（Gateway auth、routing、tooling、parsing、config）
  - 既知bug向けの決定的regression
- Expectations:
  - CIで実行される
  - 実keyは不要
  - 高速かつ安定しているべき

<AccordionGroup>
  <Accordion title="project、shard、scoped lane">

    - target未指定の `pnpm test` は、1つの巨大なネイティブroot-project processではなく、12個の小さなshard config（`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`）を実行します。これにより、負荷の高いマシンでのpeak RSSを削減し、auto-reply / extension作業が無関係なsuiteを圧迫するのを防ぎます。
    - `pnpm test --watch` は、引き続きネイティブrootの `vitest.config.ts` project graphを使用します。multi-shardのwatch loopは現実的でないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なfile / directory targetをまずscoped lane経由で解決するため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` では、完全なroot project起動コストを払わずに済みます。
    - `pnpm test:changed` は、差分がルーティング可能なsource / test fileのみに触れている場合、変更されたgit pathを同じscoped laneへ展開します。config / setup編集は、引き続き広いroot-project再実行にフォールバックします。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートローカルgateです。diffをcore、core test、extension、extension test、app、docs、release metadata、live Docker tooling、toolingに分類し、それに対応するtypecheck / lint / test laneを実行します。公開Plugin SDKおよびplugin-contract変更には、extensionがそれらのcore契約に依存するため、1回のextension validation passが含まれます。release metadataのみのversion bumpでは、完全suiteの代わりにtargetedなversion / config / root-dependency checkを実行し、トップレベルversion field以外のpackage変更を拒否するguardもあります。
    - live Docker ACP harnessの編集では、集中したローカルgateが実行されます: live Docker auth script向けshell syntax、live Docker scheduler dry-run、ACP bind unit test、およびACPX extension testです。`package.json` の変更が含まれるのは、diffが `scripts["test:docker:live-*"]` に限定される場合だけです。dependency、export、version、その他のpackage surface編集では、引き続きより広いguardが使われます。
    - agent、command、Plugin、auto-reply helper、`plugin-sdk`、および同様の純utility領域のimport-lightなunit testは `unit-fast` laneへルーティングされ、`test/setup-openclaw-runtime.ts` をスキップします。stateful / runtime-heavyなfileは既存laneに残ります。
    - 一部の `plugin-sdk` および `commands` helper source fileも、changed-mode runをこれらのlight lane内の明示的な兄弟testへマップするため、helper編集でそのdirectoryの完全heavy suiteを再実行せずに済みます。
    - `auto-reply` には、トップレベルcore helper、トップレベル `reply.*` integration test、`src/auto-reply/reply/**` subtree向けの専用bucketがあります。CIではさらにreply subtreeをagent-runner、dispatch、commands / state-routing shardに分割するため、import-heavyな1つのbucketがNode tail全体を抱え込むことがありません。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - message-tool discovery inputまたはCompaction runtime
      contextを変更するときは、両レベルのcoverageを維持してください。
    - 純粋なroutingおよびnormalization境界には、focused helper regressionを追加してください。
    - embedded runner integration suiteを健全に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, および
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - これらのsuiteは、scoped idとCompaction動作が実際の
      `run.ts` / `compact.ts` 経路を引き続き通ることを検証します。helper-only testは、
      これらintegration経路の十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest poolとisolationのデフォルト">

    - ベースVitest configのデフォルトは `threads` です。
    - 共有Vitest configは `isolate: false` に固定されており、
      root project、e2e、live config全体で非isolated runnerを使用します。
    - root UI laneは `jsdom` setupとoptimizerを維持していますが、
      これも共有の非isolated runner上で動作します。
    - 各 `pnpm test` shardは、共有Vitest configから同じ
      `threads` + `isolate: false` デフォルトを継承します。
    - `scripts/run-vitest.mjs` は、Vitest child Node
      processに対してデフォルトで `--no-maglev` を追加し、大きなローカルrun中のV8
      compile churnを減らします。標準V8動作と比較するには
      `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、diffがどのarchitecture laneをトリガーするかを表示します。
    - pre-commit hookはformatting専用です。format済みfileを再stageするだけで、
      lint、typecheck、testは実行しません。
    - handoffやpush前にスマートローカルgateが必要な場合は、
      明示的に `pnpm check:changed` を実行してください。公開Plugin SDKおよびplugin-contract
      変更には、1回のextension validation passが含まれます。
    - `pnpm test:changed` は、変更pathがより小さいsuiteにきれいにマップされる場合、
      scoped lane経由でルーティングされます。
    - `pnpm test:max` と `pnpm test:changed:max` は、同じルーティング動作を維持しつつ、
      worker上限だけを増やします。
    - ローカルworker自動スケーリングは意図的に保守的で、hostのload averageがすでに高い場合は
      抑制されるため、複数のVitest runを同時に走らせてもデフォルトでは被害が少なくなります。
    - ベースVitest configは、project / config fileを
      `forceRerunTriggers` としてマークしているため、test配線が変わったときにも
      changed-mode再実行の正しさが保たれます。
    - configは、対応host上で `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。
      直接profiling用に明示的なcache locationを1つ使いたい場合は
      `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="perfデバッグ">

    - `pnpm test:perf:imports` は、Vitest import-duration報告と
      import-breakdown出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じprofiling viewを
      `origin/main` 以降に変更されたfileへ限定します。
    - shard timing dataは `.artifacts/vitest-shard-timings.json` に書き込まれます。
      whole-config runはconfig pathをkeyとして使い、include-pattern CI
      shardはfiltered shardを個別追跡できるようshard名を追記します。
    - 1つのhot testが依然として起動importに大半の時間を使っている場合は、
      heavy dependencyを狭いローカル `*.runtime.ts` seamの後ろに置き、
      runtime helperを `vi.mock(...)` に渡すためだけにdeep-importするのではなく、
      そのseamを直接mockしてください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、ルーティングされた
      `test:changed` を、そのcommit diffに対するネイティブroot-project経路と比較し、
      wall timeとmacOS max RSSを表示します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更file listを
      `scripts/test-projects.mjs` とroot Vitest config経由でルーティングすることで、
      現在のdirty treeをbenchmarkします。
    - `pnpm test:perf:profile:main` は、Vitest / Vite起動とtransformオーバーヘッドのための
      main-thread CPU profileを書き込みます。
    - `pnpm test:perf:profile:runner` は、file parallelismを無効にした
      unit suite向けのrunner CPU + heap profileを書き込みます。

  </Accordion>
</AccordionGroup>

### Stability（Gateway）

- Command: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`、1 worker固定
- Scope:
  - diagnosticsをデフォルトで有効にした実loopback Gatewayを起動する
  - 合成Gateway message、memory、大きなpayload churnをdiagnostic event path経由で流す
  - Gateway WS RPC経由で `diagnostics.stability` を問い合わせる
  - diagnostic stability bundle永続化helperをカバーする
  - recorderがboundedのままであること、合成RSS sampleがpressure budget未満に収まること、sessionごとのqueue depthがゼロに戻ることを検証する
- Expectations:
  - CI安全かつkey不要
  - stability regressionの追跡向けの狭いlaneであり、完全なGateway suiteの代替ではない

### E2E（Gateway smoke）

- Command: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`、および `extensions/` 配下の同梱Plugin E2E test
- Runtimeデフォルト:
  - repo全体に合わせて、Vitest `threads` と `isolate: false` を使用
  - 適応workerを使用（CI: 最大2、ローカル: デフォルト1）
  - console I/Oオーバーヘッドを減らすため、デフォルトでsilent modeで実行
- 便利なoverride:
  - worker数を固定するには `OPENCLAW_E2E_WORKERS=<n>`（上限16）
  - 詳細console出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`
- Scope:
  - 複数instance Gatewayのend-to-end動作
  - WebSocket / HTTP surface、Node pairing、および重めのnetworking
- Expectations:
  - CIで実行される（pipelineで有効な場合）
  - 実key不要
  - unit testよりmoving partが多い（遅いことがある）

### E2E: OpenShell backend smoke

- Command: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - host上で分離されたOpenShell gatewayをDocker経由で起動する
  - 一時的なローカルDockerfileからsandboxを作成する
  - 実際の `sandbox ssh-config` + SSH exec経由でOpenClawのOpenShell backendを試す
  - sandbox fs bridgeを通じてremote-canonical filesystem動作を検証する
- Expectations:
  - opt-in専用。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLIと動作するDocker daemonが必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後test gatewayとsandboxを破棄する
- 便利なoverride:
  - 広いe2e suiteを手動実行するときに有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外のCLI binaryまたはwrapper scriptを指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実provider + 実model）

- Command: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`、および `extensions/` 配下の同梱Plugin live test
- デフォルト: `pnpm test:live` により**有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- Scope:
  - 「このprovider / modelは、**今日**、実credentialで実際に動くか？」
  - provider format変更、tool-callingの癖、auth issue、rate limit動作を検出する
- Expectations:
  - 設計上CI安定ではない（実network、実provider policy、quota、outage）
  - コストがかかる / rate limitを消費する
  - 「全部」ではなく、絞ったsubset実行を優先する
- live runは、足りないAPI keyを取得するために `~/.profile` を読み込みます。
- デフォルトでは、live runは引き続き `HOME` を分離し、config / auth materialを一時test homeへコピーするため、unit fixtureが実際の `~/.openclaw` を変更できません。
- live testで意図的に実home directoryを使いたい場合にのみ `OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなmodeがデフォルトです: `[live] ...` のprogress出力は維持しますが、追加の `~/.profile` 通知を抑制し、gateway bootstrap log / Bonjour chatterをミュートします。完全な起動logを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API key rotation（provider固有）: カンマ / セミコロン形式の `*_API_KEYS` または `*_API_KEY_1`, `*_API_KEY_2`（例: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`）を設定するか、live専用overrideとして `OPENCLAW_LIVE_*_KEY` を使ってください。testはrate limit応答時にretryします。
- progress / heartbeat出力:
  - live suiteは現在、progress lineをstderrへ出力するため、Vitest console captureが静かでも、長時間のprovider callが動いていることを視認できます。
  - `vitest.live.config.ts` はVitestのconsole interceptionを無効にしているため、provider / gateway progress lineがlive run中に即座にstreamされます。
  - direct-model heartbeatを調整するには `OPENCLAW_LIVE_HEARTBEAT_MS` を使ってください。
  - gateway / probe heartbeatを調整するには `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` を使ってください。

## どのsuiteを実行すべきか？

次の判断表を使ってください。

- logic / testを編集した: `pnpm test` を実行（大きく変更したなら `pnpm test:coverage` も）
- Gateway networking / WS protocol / pairingに触れた: `pnpm test:e2e` を追加
- 「botが落ちている」/ provider固有failure / tool callingをデバッグしたい: 絞り込んだ `pnpm test:live` を実行

## Live（networkに触れる）test

live model matrix、CLI backend smoke、ACP smoke、Codex app-server
harness、すべてのmedia-provider live test（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness）— およびlive runのcredential handlingについては、
[Testing — live suites](/ja-JP/help/testing-live)を参照してください。

## Docker runner（任意の「Linuxで動く」確認）

これらのDocker runnerは2つのbucketに分かれます。

- live-model runner: `test:docker:live-models` と `test:docker:live-gateway` は、それぞれ対応するprofile-key live fileだけをrepo Docker image内で実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。ローカルconfig dirとworkspaceをmountし（mountされていれば `~/.profile` も読み込みます）。対応するローカルentrypointは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live runnerは、完全なDocker sweepを現実的なものに保つため、デフォルトでより小さなsmoke capを使います:
  `test:docker:live-models` のデフォルトは `OPENCLAW_LIVE_MAX_MODELS=12`、また
  `test:docker:live-gateway` のデフォルトは `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。より大きな網羅的scanを明示的に行いたい場合は、これらのenv varを上書きしてください。
- `test:docker:all` は、まず `test:docker:live-build` 経由でlive Docker imageを1回buildし、その後live Docker laneで再利用します。また、`test:docker:e2e-build` 経由で共有 `scripts/e2e/Dockerfile` imageも1回buildし、built appを試すE2E container smoke runnerで再利用します。このaggregateは重み付きローカルschedulerを使用します。`OPENCLAW_DOCKER_ALL_PARALLELISM` がprocess slotを制御し、resource capにより重いlive、npm-install、multi-service laneが同時に開始されるのを防ぎます。デフォルトは10 slot、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` は、Docker hostにより余裕がある場合にのみ調整してください。runnerはデフォルトでDocker preflightを実行し、古いOpenClaw E2E containerを削除し、30秒ごとにstatusを表示し、成功したlaneのtimingを `.artifacts/docker-tests/lane-timings.json` に保存し、そのtimingを使って以後のrunでは長いlaneから先に開始します。buildやDocker実行をせずに重み付きlane manifestを表示するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使ってください。
- container smoke runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:config-reload` は、1つ以上の実containerを起動し、より高レベルのintegration pathを検証します。

live-model Docker runnerは、必要なCLI auth homeだけをbind mountし（runが絞り込まれていない場合は対応するすべて）、run前にそれらをcontainer homeへコピーすることで、外部CLI OAuthがhost auth storeを変更せずにtokenを更新できるようにします。

- direct model: `pnpm test:docker:live-models`（script: `scripts/test-live-models-docker.sh`）
- ACP bind smoke: `pnpm test:docker:live-acp-bind`（script: `scripts/test-live-acp-bind-docker.sh`。デフォルトではClaude、Codex、Geminiを対象とし、厳格なDroid/OpenCode coverageは `pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` で行います）
- CLI backend smoke: `pnpm test:docker:live-cli-backend`（script: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`（script: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（script: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke: `pnpm test:docker:openwebui`（script: `scripts/e2e/openwebui-docker.sh`）
- onboarding wizard（TTY、完全なscaffolding）: `pnpm test:docker:onboard`（script: `scripts/e2e/onboard-docker.sh`）
- npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` は、packしたOpenClaw tarballをDocker内にグローバルinstallし、env-ref onboardingでOpenAIを設定し、デフォルトでTelegramを設定し、doctorが有効化されたPlugin runtime dependencyを修復することを確認し、mocked OpenAI agent turnを1回実行します。事前build済みtarballを再利用するには `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、host rebuildをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`、channelを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使ってください。
- update channel switch smoke: `pnpm test:docker:update-channel-switch` は、packしたOpenClaw tarballをDocker内にグローバルinstallし、package `stable` からgit `dev` に切り替え、永続化されたchannelとPluginが更新後も動作することを確認し、その後package `stable` に戻してupdate statusを確認します。
- session runtime context smoke: `pnpm test:docker:session-runtime-context` は、隠されたruntime context transcriptの永続化と、影響を受けた重複prompt-rewrite branchのdoctor修復を検証します。
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在のtreeをpackし、分離されたhomeで `bun install -g` によりinstallし、`openclaw infer image providers --json` がハングせずに同梱image providerを返すことを検証します。事前build済みtarballを再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、host buildをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`、build済みDocker imageから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使ってください。
- installer Docker smoke: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm container間で1つのnpm cacheを共有します。update smokeは、candidate tarballへ更新する前のstable baselineとして、デフォルトでnpm `latest` を使います。非root installer checkでは、root所有のcache entryがuser-local install動作を隠さないよう、分離されたnpm cacheを維持します。ローカル再実行でroot/update/direct-npm cacheを再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定してください。
- Install Smoke CIは `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` により重複するdirect-npm global updateをスキップします。direct `npm install -g` coverageが必要な場合は、このenvなしでローカル実行してください。
- agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace`（script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`）は、デフォルトでroot Dockerfile imageをbuildし、分離されたcontainer home内で1つのworkspaceを持つ2つのagentをseedし、`agents delete --json` を実行し、有効なJSONとworkspace保持動作を検証します。install-smoke imageを再利用するには `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使ってください。
- Gateway networking（2つのcontainer、WS auth + health）: `pnpm test:docker:gateway-network`（script: `scripts/e2e/gateway-network-docker.sh`）
- browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot`（script: `scripts/e2e/browser-cdp-snapshot-docker.sh`）は、source E2E imageとChromium layerをbuildし、raw CDPでChromiumを起動し、`browser doctor --deep` を実行し、CDP role snapshotがlink URL、cursor昇格済みclickable、iframe ref、frame metadataをカバーすることを検証します。
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal`（script: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、mocked OpenAI serverをGateway経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後provider schema rejectを強制して、その生のdetailがGateway logに現れることを確認します。
- MCP channel bridge（seed済みGateway + stdio bridge + raw Claude notification-frame smoke）: `pnpm test:docker:mcp-channels`（script: `scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（実stdio MCP server + 埋め込みPi profile allow/deny smoke）: `pnpm test:docker:pi-bundle-mcp-tools`（script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP cleanup（実Gateway + 分離されたCronとone-shot subagent run後のstdio MCP child teardown）: `pnpm test:docker:cron-mcp-cleanup`（script: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（install smoke、ClawHub install/uninstall、marketplace update、Claude-bundle enable/inspect）: `pnpm test:docker:plugins`（script: `scripts/e2e/plugins-docker.sh`）
  live ClawHub blockをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトpackageを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を使ってください。
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update`（script: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- config reload metadata smoke: `pnpm test:docker:config-reload`（script: `scripts/e2e/config-reload-source-docker.sh`）
- 同梱Plugin runtime dependency: `pnpm test:docker:bundled-channel-deps` は、デフォルトで小さなDocker runner imageをbuildし、host上でOpenClawを1回buildしてpackし、そのtarballを各Linux install scenarioにmountします。imageを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`、新しいローカルbuild後にhost rebuildをスキップするには `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`、既存tarballを指定するには `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使ってください。完全なDocker aggregateは、このtarballを最初に1回だけpackし、その後、同梱channel checkを独立laneに分割します。これにはTelegram、Discord、Slack、Feishu、memory-lancedb、ACPX向けの別個のupdate laneも含まれます。同梱laneを直接実行するときにchannel matrixを絞るには `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`、update scenarioを絞るには `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` を使ってください。このlaneは、`channels.<id>.enabled=false` と `plugins.entries.<id>.enabled=false` によりdoctor/runtime-dependency修復が抑止されることも検証します。
- 反復中に同梱Plugin runtime dependencyを絞るには、無関係なscenarioを無効化してください。例:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

共有built-app imageを手動で事前buildして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなsuite固有image overrideは、設定されている場合に引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がremote共有imageを指している場合、そのimageがまだローカルにないとscriptはそれをpullします。QRおよびinstaller Docker testは、共有built-app runtimeではなくpackage/install動作を検証するため、独自のDockerfileを維持します。

live-model Docker runnerは、現在のcheckoutもread-onlyでbind mountし、それをcontainer内の一時workdirへstageします。これによりruntime imageをスリムに保ちつつ、正確にあなたのローカルsource / configに対してVitestを実行できます。stage手順では、大きなローカル専用cacheやapp build output（`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, appローカルの `.build` やGradle output directoryなど）をスキップするため、Docker live runがマシン固有artifactのコピーに何分も費やすことはありません。
また、これらは `OPENCLAW_SKIP_CHANNELS=1` も設定するため、gateway live probeがcontainer内で実際のTelegram / Discordなどのchannel workerを起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、そのDocker laneでgateway live coverageを狭めたり除外したりしたい場合は、`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` はより高レベルな互換smokeです。OpenAI互換HTTP endpointを有効化したOpenClaw gateway containerを起動し、そのgatewayに対して固定versionのOpen WebUI containerを起動し、Open WebUI経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証し、その後、Open WebUIの `/api/chat/completions` proxy経由で実際のchat requestを送信します。
初回runは、DockerがOpen WebUI imageをpullする必要がある場合や、Open WebUIが自身のcold-start setupを完了する必要がある場合があるため、目に見えて遅くなることがあります。
このlaneは利用可能なlive model keyを前提としており、Docker化runでそれを提供する主な方法は `OPENCLAW_PROFILE_FILE`（デフォルト `~/.profile`）です。
成功したrunでは、`{ "ok": true, "model": "openclaw/default", ... }` のような小さなJSON payloadが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際のTelegram、Discord、iMessage accountは必要ありません。seed済みGateway containerを起動し、続いて `openclaw mcp serve` を起動する2つ目のcontainerを起動し、その後、ルーティングされたconversation discovery、transcript read、attachment metadata、live event queue動作、outbound send routing、Claudeスタイルのchannel + permission notificationを、実際のstdio MCP bridge経由で検証します。notification checkは生のstdio MCP frameを直接検査するため、このsmokeは特定client SDKが表面化するものではなく、bridgeが実際に何を出力するかを検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、live model keyを必要としません。repo Docker imageをbuildし、container内で実際のstdio MCP probe serverを起動し、そのserverを埋め込みPi bundle MCP runtime経由で実体化し、toolを実行し、その後 `coding` と `messaging` が `bundle-mcp` toolを維持しつつ、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをfilterすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、live model keyを必要としません。実際のstdio MCP probe serverを備えたseed済みGatewayを起動し、分離されたcron turnと `/subagents spawn` によるone-shot child turnを実行し、その後各runの後にMCP child processが終了することを検証します。

手動ACP plain-language thread smoke（CIではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このscriptはregression / debugワークフロー用に維持してください。ACP thread routing検証で再び必要になる可能性があるため、削除しないでください。

便利なenv var:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）を `/home/node/.openclaw` にmount
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）を `/home/node/.openclaw/workspace` にmount
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）を `/home/node/.profile` にmountし、test実行前にsource
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` により、`OPENCLAW_PROFILE_FILE` からsourceされたenv varのみを検証し、一時config / workspace dirを使い、外部CLI auth mountは行いません
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）を `/home/node/.npm-global` にmountし、Docker内でのCLI install cacheとして使います
- `$HOME` 配下の外部CLI auth dir / fileは、`/host-auth...` 配下にread-onlyでmountされ、その後test開始前に `/home/node/...` へコピーされます
  - デフォルトdir: `.minimax`
  - デフォルトfile: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - providerを絞ったrunでは、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推論された必要なdir / fileのみをmountします
  - 手動overrideは `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りlistで行えます
- runを絞るには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- container内でproviderをfilterするには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- rebuild不要な再実行で既存の `openclaw:local-live` imageを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`
- credentialがprofile store由来であることを保証するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（env由来ではない）
- Open WebUI smokeでgatewayが公開するmodelを選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smokeで使うnonce-check promptを上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定Open WebUI image tagを上書きするには `OPENWEBUI_IMAGE=...`

## docs健全性確認

doc編集後はdocs checkを実行してください: `pnpm check:docs`。
ページ内heading checkも必要な場合は、完全なMintlify anchor validationを実行してください: `pnpm docs:check-links:anchors`。

## offline regression（CI安全）

これらは、実providerなしでの「実パイプライン」regressionです。

- Gateway tool calling（mock OpenAI、実Gateway + agent loop）: `src/gateway/gateway.test.ts`（case: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway wizard（WS `wizard.start` / `wizard.next`、config + auth enforcedを書き込む）: `src/gateway/gateway.test.ts`（case: "runs wizard over ws and writes auth token config"）

## agent reliability eval（Skills）

すでに、いくつかのCI安全testが「agent reliability eval」のように機能しています。

- 実Gateway + agent loopを通るmock tool-calling（`src/gateway/gateway.test.ts`）。
- session wiringとconfig effectを検証するend-to-end wizard flow（`src/gateway/gateway.test.ts`）。

Skills向けにまだ不足しているもの（[Skills](/ja-JP/tools/skills)を参照）:

- **Decisioning:** prompt内にSkillが列挙されているとき、agentは正しいSkillを選ぶか（または無関係なものを避けるか）？
- **Compliance:** agentは使用前に `SKILL.md` を読み、必要なstep / argに従うか？
- **Workflow contract:** tool順序、session履歴の引き継ぎ、sandbox boundaryを検証するmulti-turn scenario。

将来のevalも、まずは決定的なものにするべきです。

- mock providerを使ってtool call + 順序、Skill file read、session wiringを検証するscenario runner。
- Skillに焦点を当てた小さなsuite（使う / 避ける、gating、prompt injection）。
- CI安全suiteが整ってからのみ、任意のlive eval（opt-in、env-gated）。

## contract test（Pluginとchannelの形状）

contract testは、登録されたすべてのPluginとchannelがその
interface契約に準拠していることを検証します。発見されたすべてのPluginを走査し、
形状と振る舞いに関する一連のassertionを実行します。デフォルトの `pnpm test` unit laneは、
これらの共有seamおよびsmoke fileを意図的にスキップするため、共有channelまたはprovider surfaceに触れた場合は、contract commandを明示的に実行してください。

### Command

- すべてのcontract: `pnpm test:contracts`
- channel contractのみ: `pnpm test:contracts:channels`
- provider contractのみ: `pnpm test:contracts:plugins`

### channel contract

`src/channels/plugins/contracts/*.contract.test.ts` にあります。

- **plugin** - 基本的なPlugin shape（id、name、capability）
- **setup** - setup ウィザード契約
- **session-binding** - session binding動作
- **outbound-payload** - message payload構造
- **inbound** - inbound message処理
- **actions** - channel action handler
- **threading** - thread ID処理
- **directory** - directory / roster API
- **group-policy** - group policy強制

### provider status contract

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - channel status probe
- **registry** - Plugin registry shape

### provider contract

`src/plugins/contracts/*.contract.test.ts` にあります。

- **auth** - auth flow契約
- **auth-choice** - auth choice / selection
- **catalog** - model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - provider runtime
- **shape** - Plugin shape / interface
- **wizard** - setup ウィザード

### 実行するタイミング

- plugin-sdk exportまたはsubpathを変更した後
- channelまたはprovider Pluginを追加または変更した後
- Plugin登録またはdiscoveryをrefactorした後

contract testはCIで実行され、実API keyは必要ありません。

## regression追加のガイダンス

liveで見つかったprovider / model issueを修正した場合:

- 可能ならCI安全なregressionを追加してください（mock / stub provider、または正確なrequest-shape変換をcaptureする）
- 本質的にlive専用である場合（rate limit、auth policyなど）は、live testは狭く保ち、env var経由のopt-inにしてください
- bugを捉える最小のlayerを狙うことを優先してください:
  - provider request conversion / replay bug → direct model test
  - gateway session / history / tool pipeline bug → gateway live smokeまたはCI安全なgateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry metadata（`listSecretTargetRegistryEntries()`）からSecretRef classごとに1つのsample targetを導出し、その後traversal-segment exec idが拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target familyを追加した場合、そのtest内の `classifyTargetClass` を更新してください。このtestは、未分類target idに対して意図的に失敗するため、新しいclassが黙ってスキップされることはありません。

## 関連

- [Testing live](/ja-JP/help/testing-live)
- [CI](/ja-JP/ci)
