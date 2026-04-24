---
read_when:
    - "ローカルまたは CI でテストを実行する\tRTLUanalysis to=functions.read  天天大奖彩票站: commentary 久久免费热在线精品{\"path\":\"/home/runner/work/docs/docs/source/scripts/docs-i18n/AGENTS.md\"}"
    - モデル/プロバイダーのバグに対するリグレッションを追加する
    - Gateway + エージェントの動作をデバッグしています
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、各テストの対象内容'
title: テスト
x-i18n:
    generated_at: "2026-04-24T05:02:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf9205861eb454a848866ff30787bb66f83da8d4792efc7e8967a7adf5f1d0fa
    source_path: help/testing.md
    workflow: 15
---

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、少数の
Docker ランナーがあります。このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何を対象にするか（そして意図的に何を _対象外_ にするか）
- 一般的なワークフロー（ローカル、push 前、デバッグ）でどのコマンドを実行するか
- live テストがどのように認証情報を検出し、モデル/プロバイダーを選択するか
- 実運用のモデル/プロバイダー問題に対するリグレッションをどう追加するか

## クイックスタート

ほとんどの日は次で十分です。

- フルゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカルフルスイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は extension/channel パスもルーティングするようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一障害を反復中は、まず対象を絞った実行を優先してください。
- Docker ベース QA サイト: `pnpm qa:lab:up`
- Linux VM ベース QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたときや、追加の確信が欲しいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（モデル + Gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live モデル一括確認: `pnpm test:docker:live-models`
  - 現在、選択した各モデルはテキストターンに加え、小さなファイル読み取り風プローブも実行します。
    メタデータで `image` 入力を広告しているモデルは、小さな画像ターンも実行します。
    プロバイダー障害を切り分けるときは、追加プローブを `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で無効化できます。
  - CI カバレッジ: 毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` は、どちらも `include_live_suites: true` 付きで
    再利用可能な live/E2E workflow を呼び出し、これにはプロバイダー単位で shard された
    個別の Docker live model matrix ジョブが含まれます。
  - 対象を絞った CI 再実行には、`include_live_suites: true` と `live_models_only: true` を付けて
    `OpenClaw Live And E2E Checks (Reusable)` を dispatch してください。
  - 新しい高シグナルのプロバイダーシークレットを追加する場合は、`scripts/ci-hydrate-live-auth.sh`
    と `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`、およびその
    scheduled/release 呼び出し元も更新してください。
- ネイティブ Codex の bound-chat スモーク: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live レーンを実行し、合成
    Slack DM を `/codex bind` でバインドし、`/codex fast` と
    `/codex permissions` を試した後、通常返信と画像添付が
    ACP ではなくネイティブ Plugin バインディングを通ることを検証します。
- Moonshot/Kimi コストスモーク: `MOONSHOT_API_KEY` を設定したうえで、
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSON が Moonshot/K2.6 を報告し、
  assistant トランスクリプトが正規化された `usage.cost` を保存することを確認してください。

ヒント: 失敗ケースが 1 つだけ必要な場合は、以下で説明する allowlist env var を使って live テストを絞り込むことを優先してください。

## QA 専用ランナー

これらのコマンドは、QA-lab の現実性が必要なときにメインテストスイートの横で使います。

CI は専用 workflow で QA Lab を実行します。`Parity gate` は一致する PR と
手動 dispatch で mock provider とともに実行されます。`QA-Lab - All Lanes` は `main` の夜間実行と
手動 dispatch で、mock parity gate、live Matrix レーン、Convex 管理の live Telegram レーンを並列ジョブとして実行します。`OpenClaw Release Checks`
は、リリース承認前に同じレーンを実行します。

- `pnpm openclaw qa suite`
  - repo ベースの QA シナリオをホスト上で直接実行します。
  - デフォルトでは、分離された
    Gateway worker を使って複数の選択シナリオを並列実行します。`qa-channel` のデフォルト並行数は 4 です（選択されたシナリオ数で上限あり）。worker
    数を調整するには `--concurrency <count>` を、以前の直列レーンにするには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物が欲しい場合は `--allow-failures` を使用します。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、シナリオ対応の
    `mock-openai` レーンを置き換えることなく、実験的な fixture と protocol-mock カバレッジのためにローカルの AIMock ベース provider server を起動します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、ゲストで実用的な対応済み QA 認証入力を転送します:
    env ベースのプロバイダーキー、QA live provider config パス、存在する場合の `CODEX_HOME`。
  - 出力ディレクトリは repo ルート配下のままにする必要があります。そうしないとゲストがマウントされたワークスペース経由で書き戻せません。
  - 通常の QA レポート + サマリーに加えて、Multipass ログを
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - operator 形式の QA 作業用に Docker ベース QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、それを
    Docker 内でグローバルインストールし、非対話型の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、
    Plugin の有効化が必要時に runtime dependencies をオンデマンドインストールすることを検証し、doctor を実行し、mocked OpenAI
    endpoint に対して 1 回のローカルエージェントターンを実行します。
  - 同じパッケージ化インストールレーンを Discord で実行するには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:bundled-channel-deps`
  - 現在の OpenClaw ビルドを Docker に pack/install し、OpenAI を設定して Gateway を起動し、その後 config 編集でバンドル済み channel/Plugin を有効化します。
  - セットアップ検出では未設定 Plugin の runtime dependencies が存在しないままであること、最初に設定された Gateway または doctor 実行で各バンドル済み
    Plugin の runtime dependencies がオンデマンドでインストールされること、2 回目の再起動ではすでに有効化済みの dependencies を再インストールしないことを検証します。
  - また、既知の古い npm ベースラインをインストールし、`openclaw update --tag <candidate>` 実行前に Telegram を有効化し、候補版の
    post-update doctor が、ハーネス側の postinstall 修復なしでバンドル済み
    channel runtime dependencies を修復することも検証します。
- `pnpm openclaw qa aimock`
  - 直接のプロトコルスモークテスト用に、ローカル AIMock provider server のみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel homeserver に対して Matrix live QA レーンを実行します。
  - この QA ホストは現時点では repo/dev 専用です。パッケージ化された OpenClaw インストールには
    `qa-lab` が含まれないため、`openclaw qa` は公開されません。
  - repo チェックアウトでは、バンドル済みランナーを直接読み込みます。別途 Plugin インストール手順は不要です。
  - 3 つの一時 Matrix ユーザー（`driver`, `sut`, `observer`）と 1 つのプライベートルームを用意し、その後
    実際の Matrix Plugin を SUT transport として使う QA Gateway 子プロセスを起動します。
  - デフォルトでは、固定された安定版 Tuwunel イメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使用します。別のイメージをテストしたい場合は `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrix では使い捨てユーザーをローカルで用意するため、共有の credential-source フラグは公開されません。
  - Matrix QA レポート、サマリー、observed-events 成果物、および結合 stdout/stderr 出力ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm openclaw qa telegram`
  - env から取得した driver と SUT ボットトークンを使って、実際のプライベートグループに対して Telegram live QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group id は数値の Telegram chat id でなければなりません。
  - 共有プール認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使うか、共有 lease を使うには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物が欲しい場合は `--allow-failures` を使用します。
  - 同じプライベートグループ内の 2 つの異なるボットが必要で、SUT ボットは Telegram username を公開している必要があります。
  - 安定した bot-to-bot 観測のために、両方のボットで `@BotFather` の Bot-to-Bot Communication Mode を有効にし、driver ボットがグループ内のボットトラフィックを観測できるようにしてください。
  - Telegram QA レポート、サマリー、observed-messages 成果物を `.artifacts/qa-e2e/...` 配下に書き込みます。返信シナリオには、driver 送信リクエストから観測された SUT 返信までの RTT が含まれます。

live transport レーンは 1 つの標準契約を共有しているため、新しい transport が逸脱しません。

`qa-channel` は依然として広範な合成 QA スイートであり、live
transport カバレッジ matrix には含まれません。

| レーン | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex 経由の共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、
QA lab は Convex ベースのプールから排他的 lease を取得し、レーン実行中はその lease に Heartbeat を送り、
シャットダウン時に lease を解放します。

参照用 Convex プロジェクト scaffold:

- `qa/convex-credential-broker/`

必須 env var:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択した role 用の 1 つのシークレット:
  - `maintainer` 用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報 role の選択:
  - CLI: `--credential-role maintainer|ci`
  - env デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルト `ci`、それ以外では `maintainer`）

任意の env var:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発のために loopback `http://` Convex URL を許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使う必要があります。

maintainer 用管理コマンド（プール add/remove/list）には、
特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

maintainer 向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

スクリプトや CI ユーティリティで機械可読出力が必要な場合は `--json` を使用してください。

デフォルト endpoint 契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

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
- `POST /admin/add`（maintainer secret のみ）
  - リクエスト: `{ kind, actorId, payload, note?, status? }`
  - 成功: `{ status: "ok", credential }`
- `POST /admin/remove`（maintainer secret のみ）
  - リクエスト: `{ credentialId, actorId }`
  - 成功: `{ status: "ok", changed, credential }`
  - アクティブ lease ガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（maintainer secret のみ）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram kind の payload 形式:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id 文字列でなければなりません。
- `admin/add` は `kind: "telegram"` に対してこの形式を検証し、不正な payload を拒否します。

### QA にチャンネルを追加する

Markdown QA システムにチャンネルを追加するには、必要なのはちょうど 2 つです。

1. そのチャンネル用の transport adapter
2. チャンネル契約を検証する scenario pack

共有 `qa-lab` ホストがフローを担える場合、新しいトップレベル QA コマンド root を追加しないでください。

`qa-lab` は共有ホスト機構を担います。

- `openclaw qa` コマンド root
- スイートの起動と終了処理
- worker の並行性
- 成果物の書き出し
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

runner Plugin は transport 契約を担います。

- 共有 `qa` root 配下で `openclaw qa <runner>` をどうマウントするか
- その transport 向けに Gateway をどう設定するか
- readiness をどう確認するか
- 受信イベントをどう注入するか
- 送信メッセージをどう観測するか
- トランスクリプトと正規化された transport 状態をどう公開するか
- transport ベースのアクションをどう実行するか
- transport 固有のリセットやクリーンアップをどう処理するか

新しいチャンネルに求められる最小採用条件は次のとおりです。

1. 共有 `qa` root の所有者は `qa-lab` のままにする。
2. 共有 `qa-lab` ホスト seam 上で transport runner を実装する。
3. transport 固有の機構は runner Plugin または channel harness 内に閉じ込める。
4. 競合する root コマンドを登録するのではなく、runner を `openclaw qa <runner>` としてマウントする。
   runner Plugin は `openclaw.plugin.json` に `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列を export する必要があります。
   `runtime-api.ts` は軽量に保ってください。lazy CLI と runner 実行は別エントリーポイントの背後に置くべきです。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適応する。
6. 新しいシナリオには汎用 scenario helper を使う。
7. repo が意図的な移行中でない限り、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格です。

- 挙動を `qa-lab` で一度だけ表現できるなら、`qa-lab` に置く。
- 挙動が 1 つのチャンネル transport に依存するなら、その runner Plugin または Plugin harness に置く。
- シナリオが複数チャンネルで使える新機能を必要とするなら、`suite.ts` にチャンネル固有分岐を追加するのではなく、汎用 helper を追加する。
- 挙動が 1 つの transport にしか意味を持たないなら、シナリオを transport 固有のままにし、それをシナリオ契約で明示する。

新しいシナリオに推奨される汎用 helper 名は次のとおりです。

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

既存シナリオ向けの互換エイリアスも引き続き利用できます。たとえば:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しいチャンネル作業では、汎用 helper 名を使ってください。
互換エイリアスはフラグデー移行を避けるために存在しており、
新しいシナリオ記述のモデルではありません。

## テストスイート（何がどこで実行されるか）

スイートは「現実性が増すほど（そして flaky/cost も増す）」と考えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 対象未指定の実行では `vitest.full-*.config.ts` の shard セットを使用し、並列スケジューリングのためにマルチプロジェクト shard をプロジェクトごとの config に展開することがあります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts`、および `vitest.unit.config.ts` が対象にする許可済み `ui` node テスト配下の core/unit インベントリ
- スコープ:
  - 純粋な unit テスト
  - プロセス内 integration テスト（Gateway 認証、ルーティング、ツール、パース、config）
  - 既知バグに対する決定論的リグレッション
- 期待事項:
  - CI で実行される
  - 実キーは不要
  - 高速かつ安定しているべき
    <AccordionGroup>
    <Accordion title="プロジェクト、shard、スコープ付きレーン"> - 対象未指定の `pnpm test` は、巨大な単一ネイティブルートプロジェクトプロセスではなく、12 個の小さめの shard config（`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS を削減し、auto-reply/extension 作業が無関係なスイートを圧迫するのを防ぎます。 - `pnpm test --watch` は、マルチ shard の watch ループが現実的ではないため、引き続きネイティブルート `vitest.config.ts` のプロジェクトグラフを使用します。 - `pnpm test`, `pnpm test:watch`, `pnpm test:perf:imports` は、明示的なファイル/ディレクトリ対象をまずスコープ付きレーン経由でルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ではフルルートプロジェクト起動コストを払わずに済みます。 - `pnpm test:changed` は、差分がルーティング可能な小さめスイートにきれいに対応する場合、変更された git パスを同じスコープ付きレーンに展開します。config/setup 編集は引き続き広いルートプロジェクト再実行へフォールバックします。 - `pnpm check:changed` は、狭い作業向けの通常のスマートローカルゲートです。差分を core、core tests、extensions、extension tests、apps、docs、release metadata、tooling に分類し、一致する typecheck/lint/test レーンを実行します。公開 Plugin SDK と plugin-contract の変更には、extensions がそれらの core 契約に依存するため、1 回の extension 検証パスが含まれます。release metadata のみのバージョン更新では、完全スイートの代わりに対象を絞った version/config/root-dependency チェックを実行し、トップレベル version フィールド以外の package 変更を拒否するガードもあります。 - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および同様の純粋ユーティリティ領域からの import-light な unit テストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーン経由でルーティングされます。状態を持つ/ランタイムの重いファイルは既存レーンに残ります。 - 一部の `plugin-sdk` と `commands` helper source file も、changed-mode 実行時にそれらの軽量レーン内の明示的な sibling test にマップされるため、helper 編集でそのディレクトリの完全な重いスイートを再実行せずに済みます。 - `auto-reply` には 3 つの専用バケットがあります: トップレベル core helper、トップレベル `reply.*` integration テスト、そして `src/auto-reply/reply/**` サブツリー。これにより、最も重い reply harness 作業を軽量な status/chunk/token テストから切り離します。
    </Accordion>

      <Accordion title="埋め込み runner カバレッジ">
        - message-tool discovery 入力や Compaction ランタイム
          コンテキストを変更するときは、両レベルのカバレッジを維持してください。
        - 純粋なルーティングと正規化
          境界に対する focused helper リグレッションを追加してください。
        - 埋め込み runner integration スイートを健全に保ってください:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, および
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
        - これらのスイートは、スコープ付き ID と Compaction 挙動が引き続き
          実際の `run.ts` / `compact.ts` パスを流れることを検証します。helper 専用テストだけでは、
          これらの integration パスの十分な代替にはなりません。
      </Accordion>

      <Accordion title="Vitest pool と isolation のデフォルト">
        - ベース Vitest config のデフォルトは `threads` です。
        - 共有 Vitest config は `isolate: false` を固定し、
          ルートプロジェクト、e2e、live config 全体で非 isolated runner を使用します。
        - ルート UI レーンは引き続き `jsdom` セットアップと optimizer を保持しますが、
          同じ共有非 isolated runner 上で動作します。
        - 各 `pnpm test` shard は、共有 Vitest config から同じ `threads` + `isolate: false`
          デフォルトを継承します。
        - `scripts/run-vitest.mjs` は、Vitest 子 Node
          プロセスに対してデフォルトで `--no-maglev` を追加し、大きなローカル実行中の V8 compile churn を減らします。
          stock V8 動作と比較したい場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
      </Accordion>

      <Accordion title="高速なローカル反復">
        - `pnpm changed:lanes` は、差分がどのアーキテクチャレーンをトリガーするかを表示します。
        - pre-commit フックはフォーマット専用です。フォーマット済みファイルを再ステージし、
          lint、typecheck、テストは実行しません。
        - handoff や push 前にスマートローカルゲートが必要なときは、
          `pnpm check:changed` を明示的に実行してください。公開 Plugin SDK と plugin-contract
          の変更には 1 回の extension 検証パスが含まれます。
        - `pnpm test:changed` は、変更パスがより小さなスイートにきれいに対応する場合、
          スコープ付きレーンを経由してルーティングします。
        - `pnpm test:max` と `pnpm test:changed:max` も同じルーティング
          動作を維持しつつ、worker 上限を高くするだけです。
        - ローカル worker 自動スケーリングは意図的に保守的で、ホストの load average がすでに高い場合は抑制されるため、
          複数の並行 Vitest 実行のダメージをデフォルトで減らします。
        - ベース Vitest config は、テスト配線が変わったときに changed-mode 再実行の正しさを保つため、
          プロジェクト/config file を `forceRerunTriggers` としてマークします。
        - config は、対応ホストでは `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。
          直接プロファイリング用に明示的なキャッシュ場所を 1 つ使いたい場合は `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
      </Accordion>

      <Accordion title="パフォーマンスデバッグ">
        - `pnpm test:perf:imports` は、Vitest import 所要時間レポートと
          import-breakdown 出力を有効にします。
        - `pnpm test:perf:imports:changed` は、同じプロファイリング表示を
          `origin/main` 以降で変更されたファイルに絞ります。
        - 1 つの hot test が依然として起動 import に大半の時間を費やしている場合は、
          重い依存関係を狭いローカル `*.runtime.ts` seam の背後に置き、
          ランタイム helper を deep-import して `vi.mock(...)` に渡すだけの形にせず、その seam を直接 mock してください。
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、ルーティングされた
          `test:changed` と、そのコミット差分に対するネイティブルートプロジェクト経路を比較し、wall time と macOS max RSS を表示します。
        - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を
          `scripts/test-projects.mjs` とルート Vitest config 経由でルーティングすることで、現在の dirty tree をベンチマークします。
        - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッドのための
          メインスレッド CPU プロファイルを書き出します。
        - `pnpm test:perf:profile:runner` は、ファイル並列化を無効にした
          unit スイートの runner CPU+heap プロファイルを書き出します。
      </Accordion>
    </AccordionGroup>

### Stability（Gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、worker 1 に強制
- スコープ:
  - 診断をデフォルト有効にした実際の loopback Gateway を起動する
  - 合成的な Gateway メッセージ、メモリ、過大ペイロードの churn を診断イベントパスへ流す
  - Gateway WS RPC 経由で `diagnostics.stability` を問い合わせる
  - 診断安定性バンドル永続化ヘルパーを対象にする
  - recorder が制限付きのままであること、合成 RSS サンプルが圧力予算以下に留まること、セッションごとのキュー深度が 0 に戻ることを検証する
- 期待事項:
  - CI で安全に実行でき、キー不要
  - 安定性リグレッションのフォローアップ向けの狭いレーンであり、完全な Gateway スイートの代替ではない

### E2E（Gateway スモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`、および `extensions/` 配下のバンドル済み Plugin E2E テスト
- ランタイムデフォルト:
  - repo の他の部分に合わせて、Vitest `threads` と `isolate: false` を使用
  - 適応型 worker を使用（CI: 最大 2、ローカル: デフォルト 1）
  - コンソール I/O オーバーヘッド削減のため、デフォルトで silent mode 実行
- 便利な上書き:
  - `OPENCLAW_E2E_WORKERS=<n>` で worker 数を強制（上限 16）
  - `OPENCLAW_E2E_VERBOSE=1` で verbose コンソール出力を再有効化
- スコープ:
  - 複数インスタンス Gateway の end-to-end 挙動
  - WebSocket/HTTP サーフェス、node ペアリング、より重いネットワーキング
- 期待事項:
  - CI で実行される（パイプラインで有効な場合）
  - 実キー不要
  - unit テストより可動部分が多い（遅くなることがある）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell Gateway を起動
  - 一時的なローカル Dockerfile から sandbox を作成
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell バックエンドを検証
  - sandbox fs bridge を通じて remote-canonical filesystem 挙動を検証
- 期待事項:
  - オプトイン専用。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作する Docker daemon が必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後 test Gateway と sandbox を破棄する
- 便利な上書き:
  - 広い e2e スイートを手動実行するときにテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたは wrapper script を指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実プロバイダー + 実モデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`、および `extensions/` 配下のバンドル済み Plugin live テスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは _今日_ 実際の認証情報で本当に動くか？」
  - プロバイダーフォーマット変更、ツール呼び出しの癖、認証問題、レート制限挙動を検出する
- 期待事項:
  - 設計上 CI 安定ではない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - コストがかかる / レート制限を消費する
  - 「全部」を回すより、対象を絞ったサブセット実行を推奨
- live 実行は、足りない API キーを拾うために `~/.profile` を読み込みます。
- デフォルトでは、live 実行でも `HOME` を分離し、config/auth material を一時 test home にコピーするため、unit fixture が実際の `~/.openclaw` を変更できません。
- live テストに実際のホームディレクトリを使わせる必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードをデフォルトにしています。`[live] ...` 進捗出力は保持しますが、追加の `~/.profile` 通知を抑制し、Gateway bootstrap ログ/Bonjour chatter をミュートします。完全な起動ログが欲しい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーローテーション（プロバイダーごと）: `*_API_KEYS` にカンマ/セミコロン形式、または `*_API_KEY_1`, `*_API_KEY_2`（例: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`）、または live 専用上書きとして `OPENCLAW_LIVE_*_KEY` を設定します。テストはレート制限応答時にリトライします。
- 進捗/Heartbeat 出力:
  - live スイートは現在、進捗行を stderr に出力するため、長いプロバイダー呼び出しでも、Vitest のコンソールキャプチャが静かでも活動中であることが見えます。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効にしているため、プロバイダー/Gateway の進捗行は live 実行中に即座にストリームされます。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

次の判断表を使ってください。

- ロジック/テストを編集した: `pnpm test` を実行（大きく変更したなら `pnpm test:coverage` も）
- Gateway ネットワーキング / WS プロトコル / ペアリングに触れた: `pnpm test:e2e` も追加
- 「ボットが落ちている」/ プロバイダー固有障害 / ツール呼び出しをデバッグしたい: 対象を絞った `pnpm test:live` を実行

## Live（ネットワーク接触）テスト

live model matrix、CLI backend スモーク、ACP スモーク、Codex app-server
harness、およびすべての media-provider live テスト（Deepgram、BytePlus、ComfyUI、image、
music、video、media harness） — 加えて live 実行の認証情報処理 — については、
[Testing — live suites](/ja-JP/help/testing-live) を参照してください。

## Docker ランナー（任意の「Linux で動く」チェック）

これらの Docker ランナーは 2 つのカテゴリに分かれます。

- live-model ランナー: `test:docker:live-models` と `test:docker:live-gateway` は、repo Docker イメージ内で、それぞれ対応する profile-key live ファイルのみを実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。ローカル config dir と workspace をマウントし（マウントされていれば `~/.profile` も読み込みます）。対応するローカル entrypoint は `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live ランナーは、完全な Docker 一括確認が現実的なままで済むよう、デフォルトで小さめのスモーク上限を使用します:
  `test:docker:live-models` のデフォルトは `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` のデフォルトは `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。より大きな完全スキャンを明示的に行いたい場合は、これらの env var を上書きしてください。
- `test:docker:all` は、まず `test:docker:live-build` で live Docker イメージを 1 回ビルドし、それを 2 つの live Docker レーンで再利用します。また、`test:docker:e2e-build` で 1 つの共有 `scripts/e2e/Dockerfile` イメージもビルドし、ビルド済みアプリを検証する E2E コンテナスモークランナーで再利用します。
- コンテナスモークランナー: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:config-reload` は、1 つ以上の実コンテナを起動し、より高レベルな integration 経路を検証します。

live-model Docker ランナーは、必要な CLI auth home のみ（または実行が絞り込まれていない場合はすべての対応済み home）を bind-mount し、その後実行前にコンテナ home へコピーするため、外部 CLI OAuth がホスト auth store を変更せずに token を更新できます。

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind スモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI backend スモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness スモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live スモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全な scaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- npm tarball のオンボーディング/チャンネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、pack した OpenClaw tarball を Docker 内でグローバルインストールし、env-ref オンボーディング + デフォルトの Telegram で OpenAI を設定し、Plugin の有効化が runtime deps をオンデマンドでインストールすることを検証し、doctor を実行し、1 回の mocked OpenAI agent turn を実行します。事前ビルド済み tarball を再利用するには `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホスト再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`、チャンネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在のツリーを pack し、分離された home で `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み image provider を返すことを検証します。事前ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`、またはビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使用します。
- Installer Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm コンテナ間で 1 つの npm cache を共有します。update スモークは、候補 tarball へアップグレードする前の安定ベースラインとしてデフォルトで npm `latest` を使用します。非 root installer チェックは、root 所有 cache エントリーがユーザーローカル install 挙動を隠さないよう、分離された npm cache を維持します。ローカル再実行間で root/update/direct-npm cache を再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定してください。
- Install Smoke CI は重複する direct-npm グローバル update を `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` でスキップします。直接の `npm install -g` カバレッジが必要な場合は、この env を付けずにローカルでスクリプトを実行してください。
- Gateway ネットワーキング（2 コンテナ、WS 認証 + ヘルス）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses `web_search` 最小 reasoning リグレッション: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、mocked OpenAI server を Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後 provider schema の reject を強制して、生の詳細が Gateway ログに現れることを確認します。
- MCP channel bridge（seed 済み Gateway + stdio bridge + 生の Claude notification-frame スモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP tools（実際の stdio MCP server + 埋め込み Pi profile の allow/deny スモーク）: `pnpm test:docker:pi-bundle-mcp-tools`（スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP cleanup（実際の Gateway + stdio MCP 子プロセスの teardown。分離された Cron と one-shot subagent 実行後）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（インストールスモーク + `/plugin` エイリアス + Claude-bundle 再起動セマンティクス）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
- Plugin update unchanged スモーク: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- Config reload メタデータスモーク: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- バンドル済み Plugin runtime deps: `pnpm test:docker:bundled-channel-deps` は、デフォルトで小さな Docker runner イメージをビルドし、OpenClaw をホスト上で 1 回ビルドして pack し、その tarball を各 Linux install シナリオへマウントします。イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`、新しいローカルビルド後にホスト再ビルドをスキップするには `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`、既存 tarball を使うには `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使用します。
- 反復中に無関係なシナリオを無効化して、バンドル済み Plugin runtime deps を絞り込みます。例:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

共有のビルド済みアプリイメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きが設定されている場合は、そちらが引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにないときに pull します。QR と installer の Docker テストは、共有のビルド済みアプリランタイムではなく package/install 挙動を検証するため、独自の Dockerfile を維持します。

live-model Docker ランナーは、現在のチェックアウトも read-only で bind-mount し、
コンテナ内の一時 workdir へ stage します。これにより、runtime
イメージをスリムに保ちながら、正確なローカル source/config に対して Vitest を実行できます。
この staging 手順では、大きなローカル専用 cache や app build 出力
（`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, および app ローカルの `.build` や
Gradle 出力ディレクトリなど）をスキップするため、Docker live 実行が
マシン固有の成果物コピーに何分も費やすことはありません。
また、Gateway live プローブがコンテナ内で実際の
Telegram/Discord などのチャンネル worker を起動しないよう、`OPENCLAW_SKIP_CHANNELS=1` も設定します。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンで
Gateway live カバレッジを絞り込みまたは除外したい場合は `OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルな互換性スモークです。OpenAI 互換 HTTP endpoint を有効にした
OpenClaw Gateway コンテナを起動し、その Gateway に対して固定版の Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを確認したうえで、
Open WebUI の `/api/chat/completions` プロキシを通して実際の chat リクエストを送信します。
初回実行は、Docker が
Open WebUI イメージを pull する必要がある場合や、Open WebUI 自体がコールドスタートのセットアップを完了する必要があるため、目に見えて遅くなることがあります。
このレーンは使用可能な live model key を前提とし、
Docker 化された実行でそれを提供する主な方法は `OPENCLAW_PROFILE_FILE`
（デフォルト `~/.profile`）です。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが表示されます。
`test:docker:mcp-channels` は意図的に決定論的であり、実際の
Telegram、Discord、iMessage アカウントを必要としません。seed 済み Gateway
コンテナを起動し、`openclaw mcp serve` を起動する 2 つ目のコンテナを開始し、
ルーティングされた会話検出、トランスクリプト読み取り、添付メタデータ、
live event queue 挙動、送信ルーティング、および Claude 形式の channel +
permission 通知を、実際の stdio MCP bridge 上で検証します。通知チェックは
生の stdio MCP フレームを直接確認するため、このスモークは特定クライアント SDK が表面化するものだけでなく、
bridge が実際に出力するものを検証します。
`test:docker:pi-bundle-mcp-tools` は決定論的であり、live
model key を必要としません。repo Docker イメージをビルドし、実際の stdio MCP probe server を
コンテナ内で起動し、その server を埋め込み Pi bundle
MCP runtime 経由で materialize し、ツールを実行した後、`coding` と `messaging` が
`bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルタすることを検証します。
`test:docker:cron-mcp-cleanup` は決定論的であり、live model
key を必要としません。実際の stdio MCP probe server を備えた seed 済み Gateway を起動し、分離された
Cron ターンと `/subagents spawn` の one-shot 子ターンを実行し、その後
各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP プレーンランゲージスレッドスモーク（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグ用ワークフローとして保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

便利な env var:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）を `/home/node/.openclaw` にマウント
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）を `/home/node/.openclaw/workspace` にマウント
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）を `/home/node/.profile` にマウントし、テスト実行前に source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` で `OPENCLAW_PROFILE_FILE` から source された env var のみを検証し、一時 config/workspace dir と外部 CLI auth mount なしで実行
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）を `/home/node/.npm-global` にマウントし、Docker 内の CLI インストール cache に使用
- `$HOME` 配下の外部 CLI auth dir/file は `/host-auth...` 配下に read-only でマウントされ、その後テスト開始前に `/home/node/...` にコピーされます
  - デフォルト dir: `.minimax`
  - デフォルト file: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれた provider 実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定された必要な dir/file のみをマウント
  - 手動上書きには `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストを使用
- 実行を絞り込むには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内で provider を絞るには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 再ビルド不要の再実行で既存 `openclaw:local-live` イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報が profile store から来ることを保証するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（env からではない）
- Open WebUI スモークで Gateway が公開するモデルを選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI スモークで使用する nonce-check プロンプトを上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定 Open WebUI イメージタグを上書きするには `OPENWEBUI_IMAGE=...`

## ドキュメント確認

ドキュメント編集後は docs チェックを実行してください: `pnpm check:docs`
ページ内見出しチェックも必要な場合は、完全な Mintlify アンカー検証を実行してください: `pnpm docs:check-links:anchors`

## オフラインリグレッション（CI で安全）

これらは実プロバイダーなしの「実際のパイプライン」リグレッションです。

- Gateway ツール呼び出し（mock OpenAI、実際の Gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway wizard（WS `wizard.start`/`wizard.next`、config + auth の書き込み強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性 evals（Skills）

CI で安全な「エージェント信頼性 evals」のように振る舞うテストはすでにいくつかあります。

- 実際の Gateway + エージェントループを通した mock ツール呼び出し（`src/gateway/gateway.test.ts`）
- セッション接続と config 効果を検証する end-to-end wizard フロー（`src/gateway/gateway.test.ts`）

Skills 向けにまだ不足しているもの（[Skills](/ja-JP/tools/skills) 参照）:

- **Decisioning:** Skills がプロンプトに列挙されたとき、エージェントは正しい skill を選ぶか（または無関係なものを避けるか）？
- **Compliance:** エージェントは使用前に `SKILL.md` を読み、必要なステップ/引数に従うか？
- **Workflow contracts:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界を検証するマルチターンシナリオ。

将来の eval は、まず決定論的であるべきです。

- mock provider を使い、ツール呼び出し + 順序、skill ファイル読み取り、セッション接続を検証する scenario runner
- skill に焦点を当てた小規模スイート（使う vs 避ける、ゲーティング、プロンプトインジェクション）
- CI で安全なスイートが整った後にのみ、任意の live eval（オプトイン、env ゲート付き）

## 契約テスト（Plugin とチャンネルの形状）

契約テストは、登録済みのすべての Plugin とチャンネルが
インターフェース契約に適合していることを検証します。検出されたすべての Plugin を反復し、
形状と挙動の検証スイートを実行します。デフォルトの `pnpm test` unit レーンは、
これらの共有 seam とスモークファイルを意図的にスキップします。共有 channel または provider サーフェスに触れた場合は、
契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャンネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャンネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本 Plugin 形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディング挙動
- **outbound-payload** - メッセージペイロード構造
- **inbound** - 受信メッセージ処理
- **actions** - チャンネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/名簿 API
- **group-policy** - グループポリシー強制

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャンネルステータスプローブ
- **registry** - Plugin レジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証選択/選定
- **catalog** - モデルカタログ API
- **discovery** - Plugin 検出
- **loader** - Plugin ロード
- **runtime** - プロバイダーランタイム
- **shape** - Plugin 形状/インターフェース
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdk export または subpath を変更した後
- チャンネルまたは provider Plugin を追加または変更した後
- Plugin 登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## リグレッションを追加する（ガイダンス）

live で見つかった provider/model 問題を修正したとき:

- 可能なら CI で安全なリグレッションを追加する（mock/stub provider、または正確な request-shape 変換を捕捉）
- 本質的に live 専用のもの（レート制限、認証ポリシー）であれば、その live テストは狭く保ち、env var でオプトインにする
- バグを捕捉する最小レイヤーを狙う:
  - provider request conversion/replay バグ → 直接 models テスト
  - Gateway session/history/tool pipeline バグ → Gateway live スモークまたは CI で安全な Gateway mock テスト
- SecretRef traversal ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry メタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとに 1 つのサンプル target を導出し、その後 traversal-segment exec id が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは、未分類の target id が新しいクラスを黙ってスキップできないよう、意図的に失敗するようになっています。

## 関連

- [Testing live](/ja-JP/help/testing-live)
- [CI](/ja-JP/ci)
