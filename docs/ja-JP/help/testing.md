---
read_when:
    - ローカルまたはCIでテストを実行する
    - モデル/プロバイダーのバグに対するリグレッションテストの追加
    - Gateway + agentの挙動をデバッグする
summary: 'テストキット: unit/e2e/liveスイート、Dockerランナー、および各テストでカバーされる内容'
title: テスト
x-i18n:
    generated_at: "2026-04-21T04:47:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef5bf36f969a6334efd2e8373a0c8002f9e6461af53c4ff630b38ad8e37f73de
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClawには3つのVitestスイート（unit/integration、e2e、live）と、少数のDockerランナーがあります。

このドキュメントは「どのようにテストするか」のガイドです:

- 各スイートが何をカバーするか（そして意図的に_カバーしない_ものは何か）
- 一般的なワークフロー（ローカル、push前、デバッグ）でどのコマンドを実行するか
- liveテストがどのように認証情報を検出し、モデル/プロバイダーを選択するか
- 実際のモデル/プロバイダー問題に対するリグレッションをどう追加するか

## クイックスタート

普段は次を実行します:

- フルゲート（push前に想定）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの、より高速なローカル全スイート実行: `pnpm test:max`
- 直接Vitest watchループ: `pnpm test:watch`
- 直接ファイル指定は、extension/チャンネルのパスにも対応しています: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復しているときは、まず対象を絞った実行を優先してください。
- DockerベースのQAサイト: `pnpm qa:lab:up`
- Linux VMベースのQAレーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに手を入れたときや、追加の確信が欲しいときは次も実行します:

- カバレッジゲート: `pnpm test:coverage`
- E2Eスイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- liveスイート（モデル + gatewayのツール/画像プローブ）: `pnpm test:live`
- 1つのliveファイルだけを静かに対象化: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Moonshot/Kimiのコストスモーク: `MOONSHOT_API_KEY` を設定したうえで、
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSONにMoonshot/K2.6が報告され、assistant transcriptに正規化された
  `usage.cost` が保存されていることを確認してください。

ヒント: 1つの失敗ケースだけが必要な場合は、以下で説明するallowlist env varでliveテストを絞ることを優先してください。

## QA専用ランナー

これらのコマンドは、QA-labの現実性が必要なときにメインのテストスイートと並んで使います:

- `pnpm openclaw qa suite`
  - repoベースのQAシナリオをホスト上で直接実行します。
  - デフォルトでは、分離されたgateway workerを使って複数の選択シナリオを並列実行します。`qa-channel` のデフォルト同時実行数は4です（選択したシナリオ数により上限あり）。worker数を調整するには `--concurrency <count>` を、従来の直列レーンにするには `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗終了コードなしでartifactだけ欲しい場合は `--allow-failures` を使ってください。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` はローカルのAIMockベースのプロバイダーサーバーを起動し、実験的なfixtureおよびプロトコルモックのカバレッジを提供しますが、シナリオ対応の `mock-openai` レーンを置き換えるものではありません。
- `pnpm openclaw qa suite --runner multipass`
  - 同じQAスイートを使い捨てのMultipass Linux VM内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択挙動を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live実行では、ゲストで実用的な対応QA認証入力を転送します:
    envベースのプロバイダーキー、QA live provider設定パス、存在する場合の `CODEX_HOME`。
  - 出力ディレクトリはrepoルート配下に置く必要があります。これにより、ゲストがマウントされたworkspaceを通じて書き戻せます。
  - 通常のQAレポート + サマリーに加えて、Multipassログを `.artifacts/qa-e2e/...` 配下に書き出します。
- `pnpm qa:lab:up`
  - オペレーター形式のQA作業向けに、DockerベースのQAサイトを起動します。
- `pnpm openclaw qa aimock`
  - ローカルのAIMockプロバイダーサーバーだけを起動し、直接プロトコルスモークテストを行います。
- `pnpm openclaw qa matrix`
  - 使い捨てのDockerベースTuwunel homeserverに対して、Matrix live QAレーンを実行します。
  - このQAホストは現時点ではrepo/dev専用です。パッケージ化されたOpenClawインストールには `qa-lab` が同梱されないため、`openclaw qa` も提供されません。
  - repoチェックアウトでは、バンドル済みランナーを直接読み込みます。別途Pluginのインストール手順は不要です。
  - 一時的な3つのMatrixユーザー（`driver`、`sut`、`observer`）と1つのプライベートルームを準備し、その後、実際のMatrix PluginをSUTトランスポートとして使うQA gateway子プロセスを起動します。
  - デフォルトでは、固定された安定版Tuwunelイメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使用します。別のイメージをテストする必要がある場合は `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrixは共有認証情報ソースフラグを公開しません。このレーンでは使い捨てユーザーをローカルで用意するためです。
  - Matrix QAレポート、サマリー、observed-events artifact、結合されたstdout/stderr出力ログを `.artifacts/qa-e2e/...` 配下に書き出します。
- `pnpm openclaw qa telegram`
  - envから取得したdriverおよびSUTのbot tokenを使って、実際のプライベートグループに対してTelegram live QAレーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group idは数値のTelegram chat idである必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。デフォルトではenvモードを使い、プール済みleaseを使うには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗終了コードなしでartifactだけ欲しい場合は `--allow-failures` を使ってください。
  - 同じプライベートグループ内に異なる2つのbotが必要で、SUT botはTelegram usernameを公開している必要があります。
  - 安定したbot間観測のために、`@BotFather` で両方のbotに対してBot-to-Bot Communication Modeを有効にし、driver botがグループ内のbotトラフィックを観測できるようにしてください。
  - Telegram QAレポート、サマリー、observed-messages artifactを `.artifacts/qa-e2e/...` 配下に書き出します。

liveトランスポートレーンは、追加される新しいトランスポートが逸脱しないよう、1つの標準契約を共有しています。

`qa-channel` は引き続き幅広い合成QAスイートであり、live
トランスポートカバレッジマトリクスの一部ではありません。

| レーン   | Canary | mentionゲーティング | allowlistブロック | トップレベル返信 | 再起動後の再開 | スレッド追従 | スレッド分離 | リアクション観測 | Helpコマンド |
| -------- | ------ | ------------------- | ----------------- | ---------------- | -------------- | ------------ | ------------ | ---------------- | ------------ |
| Matrix   | x      | x                   | x                 | x                | x              | x            | x            | x                |              |
| Telegram | x      |                     |                   |                  |                |              |              |                  | x            |

### Convex経由の共有Telegram認証情報（v1）

`openclaw qa telegram` に対して `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、QA labはConvexベースのプールから排他的leaseを取得し、そのレーン実行中はleaseにHeartbeatを送り、シャットダウン時にleaseを解放します。

参考用のConvexプロジェクト雛形:

- `qa/convex-credential-broker/`

必要なenv var:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択されたロールに対するシークレット1つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロール選択:
  - CLI: `--credential-role maintainer|ci`
  - envデフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CIではデフォルト `ci`、それ以外では `maintainer`）

任意のenv var:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のtrace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けにloopback `http://` Convex URLを許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使ってください。

maintainer向け管理コマンド（プール追加/削除/一覧）には、
特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

maintainer向けCLIヘルパー:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

スクリプトやCIユーティリティで機械可読な出力が必要な場合は `--json` を使用してください。

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
- `POST /admin/add`（maintainerシークレットのみ）
  - リクエスト: `{ kind, actorId, payload, note?, status? }`
  - 成功: `{ status: "ok", credential }`
- `POST /admin/remove`（maintainerシークレットのみ）
  - リクエスト: `{ credentialId, actorId }`
  - 成功: `{ status: "ok", changed, credential }`
  - アクティブleaseガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（maintainerシークレットのみ）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram種別のpayload形式:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値のTelegram chat id文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形式を検証し、不正なpayloadを拒否します。

### QAにチャンネルを追加する

Markdown QAシステムにチャンネルを追加するには、必要なものは正確に2つだけです:

1. そのチャンネル用のトランスポートアダプター。
2. チャンネル契約を検証するシナリオパック。

共有の `qa-lab` ホストがフローを担える場合、新しいトップレベルQAコマンドルートを追加してはいけません。

`qa-lab` は共有ホスト機構を担います:

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- workerの同時実行制御
- artifactの書き出し
- レポート生成
- シナリオ実行
- 旧 `qa-channel` シナリオとの互換エイリアス

ランナーPluginはトランスポート契約を担います:

- `openclaw qa <runner>` が共有 `qa` ルート配下にどうマウントされるか
- そのトランスポート向けにgatewayがどう設定されるか
- 準備完了をどう確認するか
- 受信イベントをどう注入するか
- 送信メッセージをどう観測するか
- transcriptと正規化済みトランスポート状態をどう公開するか
- トランスポートベースのアクションをどう実行するか
- トランスポート固有のリセットやクリーンアップをどう扱うか

新しいチャンネルの最低採用基準は次のとおりです:

1. 共有 `qa` ルートの所有者は `qa-lab` のままにする。
2. 共有 `qa-lab` ホストのseam上にトランスポートランナーを実装する。
3. トランスポート固有の仕組みはランナーPluginまたはチャンネルハーネス内に閉じ込める。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントする。
   ラナーPluginは `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をexportする必要があります。
   `runtime-api.ts` は軽量に保ってください。遅延CLIおよびランナー実行は別々のentrypointの背後に置くべきです。
5. テーマ別の `qa/scenarios/` ディレクトリ配下でMarkdownシナリオを作成または調整する。
6. 新しいシナリオには汎用シナリオヘルパーを使う。
7. repoが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格です:

- 振る舞いを `qa-lab` に一度だけ表現できるなら、`qa-lab` に置く。
- 挙動が1つのチャンネルトランスポートに依存するなら、そのランナーPluginまたはPluginハーネスに閉じ込める。
- シナリオに複数チャンネルで使える新しい機能が必要なら、`suite.ts` にチャンネル固有分岐を追加するのではなく、汎用ヘルパーを追加する。
- ある挙動が1つのトランスポートでしか意味を持たないなら、シナリオはそのトランスポート専用のままにし、それをシナリオ契約で明示する。

新しいシナリオに推奨される汎用ヘルパー名は次のとおりです:

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

既存シナリオ向けに、次の互換エイリアスも引き続き利用できます:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しいチャンネル作業では、汎用ヘルパー名を使ってください。
互換エイリアスは一斉移行を避けるために存在するのであって、
新しいシナリオ記述のモデルではありません。

## テストスイート（どこで何が走るか）

スイートは「現実性が増すほど段階が上がる」（そして不安定さ/コストも増す）ものとして考えてください:

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 既存のスコープ化されたVitest projectに対する10個の順次shard実行（`vitest.full-*.config.ts`）
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下のcore/unitインベントリと、`vitest.unit.config.ts` でカバーされる許可済み `ui` nodeテスト
- スコープ:
  - 純粋なunitテスト
  - プロセス内integrationテスト（gateway auth、routing、tooling、parsing、config）
  - 既知バグに対する決定的なリグレッション
- 期待値:
  - CIで実行される
  - 実際のキーは不要
  - 高速かつ安定しているべき
- Projectsに関する注意:
  - 対象指定なしの `pnpm test` は、巨大な1つのネイティブルートprojectプロセスの代わりに、11個の小さめのshard config（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行するようになりました。これにより、負荷の高いマシンでのピークRSSを削減し、auto-reply/extension作業が無関係なスイートを圧迫するのを防ぎます。
  - `pnpm test --watch` は引き続きネイティブのルート `vitest.config.ts` project graphを使用します。multi-shard watchループは現実的でないためです。
  - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリ指定をまずスコープ化レーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` では完全なルートproject起動コストを払わずに済みます。
  - `pnpm test:changed` は、差分がルーティング可能なソース/テストファイルだけに触れている場合、変更されたgitパスを同じスコープ化レーンへ展開します。config/setupの編集は引き続き広いルートproject再実行へフォールバックします。
  - `pnpm check:changed` は、狭い作業向けの通常のスマートなローカルゲートです。差分をcore、core tests、extensions、extension tests、apps、docs、toolingに分類し、対応するtypecheck/lint/testレーンを実行します。公開Plugin SDKおよびplugin-contractの変更には、extensionがこれらのcore契約に依存するためextension検証も含まれます。
  - agents、commands、plugins、auto-reply helper、`plugin-sdk`、および類似の純粋ユーティリティ領域からのimportが軽いunitテストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンを通ります。状態を持つ/ランタイム負荷の高いファイルは既存レーンのままです。
  - 選択された `plugin-sdk` および `commands` helperソースファイルは、changedモード実行をこれら軽量レーンの明示的な隣接テストにもマップするため、helper編集でそのディレクトリの完全な重いスイートを再実行せずに済みます。
  - `auto-reply` には現在、3つの専用バケットがあります: トップレベルcore helper、トップレベル `reply.*` integrationテスト、そして `src/auto-reply/reply/**` サブツリーです。これにより、最も重いreply harness作業が軽量なstatus/chunk/tokenテストから切り離されます。
- Embedded runnerに関する注意:
  - メッセージツール検出入力またはCompactionランタイムコンテキストを変更する場合は、
    両レベルのカバレッジを維持してください。
  - 純粋なrouting/normalization境界には、焦点を絞ったhelperリグレッションを追加してください。
  - 同時に、embedded runner integrationスイートも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、スコープ付きidとCompactionの挙動が実際の
    `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。helperのみの
    テストでは、これらのintegrationパスの十分な代替にはなりません。
- Poolに関する注意:
  - ベースVitest configのデフォルトは現在 `threads` です。
  - 共有Vitest configは `isolate: false` も固定し、ルートprojects、e2e、live config全体で非分離runnerを使用します。
  - ルートUIレーンは `jsdom` セットアップとoptimizerを維持しつつ、現在は共有の非分離runner上でも実行されます。
  - 各 `pnpm test` shardは、共有Vitest configから同じ `threads` + `isolate: false` デフォルトを継承します。
  - 共有 `scripts/run-vitest.mjs` ランチャーは、Vitest子Nodeプロセスに対してデフォルトで `--no-maglev` も追加し、大規模ローカル実行中のV8コンパイルの揺れを減らします。標準のV8挙動と比較したい場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
- Fast-local iterationに関する注意:
  - `pnpm changed:lanes` は、差分がどのアーキテクチャレーンを引き起こすかを表示します。
  - pre-commit hookは、ステージ済みformat/lintの後に `pnpm check:changed --staged` を実行するため、core専用コミットは、公開extension向け契約に触れない限りextensionテストコストを払いません。
  - `pnpm test:changed` は、変更パスがより小さいスイートにきれいに対応する場合、スコープ化レーンを通ります。
  - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング挙動を維持しつつ、worker上限だけが高くなります。
  - ローカルworkerの自動スケーリングは現在意図的に保守的で、ホストのload averageがすでに高い場合にも抑制されるため、複数のVitest実行を同時に行ってもデフォルトで被害が小さくなります。
  - ベースVitest configは、test wiringが変わったときでもchangedモードの再実行が正しくなるよう、projects/configファイルを `forceRerunTriggers` としてマークします。
  - configは、対応ホスト上で `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接プロファイリング用に明示的なキャッシュ場所を1つ使いたい場合は `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
- Perf-debugに関する注意:
  - `pnpm test:perf:imports` はVitestのimport-durationレポートとimport-breakdown出力を有効にします。
  - `pnpm test:perf:imports:changed` は、`origin/main` 以降で変更されたファイルに同じプロファイリング表示をスコープします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、ルーティングされた `test:changed` と、そのコミット差分に対するネイティブルートprojectパスを比較し、wall timeとmacOS max RSSを出力します。
- `pnpm test:perf:changed:bench -- --worktree` は、変更されたファイル一覧を `scripts/test-projects.mjs` とルートVitest configに通して、現在のdirty treeをベンチマークします。
  - `pnpm test:perf:profile:main` は、Vitest/Vite起動とtransformオーバーヘッドのメインスレッドCPUプロファイルを書き出します。
  - `pnpm test:perf:profile:runner` は、ファイル並列化を無効にしたunitスイート用のrunner CPU+heapプロファイルを書き出します。

### E2E（gatewayスモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- ランタイムデフォルト:
  - repoの他部分と同様に、Vitestの `threads` と `isolate: false` を使用します。
  - 適応workerを使用します（CI: 最大2、ローカル: デフォルト1）。
  - コンソールI/Oオーバーヘッド削減のため、デフォルトでsilent modeで実行します。
- 便利な上書き:
  - worker数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限16）。
  - 詳細コンソール出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - マルチインスタンスgatewayのエンドツーエンド挙動
  - WebSocket/HTTP表面、nodeペアリング、より重いネットワーク
- 期待値:
  - CIで実行される（パイプラインで有効な場合）
  - 実際のキーは不要
  - unitテストより可動部が多い（遅くなることがある）

### E2E: OpenShellバックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `test/openshell-sandbox.e2e.test.ts`
- スコープ:
  - Docker経由でホスト上に分離されたOpenShell gatewayを起動
  - 一時的なローカルDockerfileからsandboxを作成
  - 実際の `sandbox ssh-config` + SSH exec を通じてOpenClawのOpenShellバックエンドを検証
  - sandbox fs bridgeを通じてremote-canonicalなファイルシステム挙動を検証
- 期待値:
  - オプトイン専用であり、デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLIと動作するDocker daemonが必要です
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テストgatewayとsandboxを破棄します
- 便利な上書き:
  - 広いe2eスイートを手動で実行するとき、このテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外のCLIバイナリまたはラッパースクリプトを指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`
- デフォルト: `pnpm test:live` により**有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で _今日_ 本当に動くか？」
  - プロバイダーの形式変更、tool-callingの癖、認証問題、rate limit挙動を検出
- 期待値:
  - 実ネットワーク、実プロバイダーポリシー、quota、障害があるため、設計上CIで安定しません
  - コストがかかり / rate limitを消費します
  - 「全部」よりも、絞ったサブセットの実行を推奨します
- live実行は、欠けているAPIキーを拾うために `~/.profile` を読み込みます。
- デフォルトでは、live実行は引き続き `HOME` を分離し、設定/認証素材を一時テストhomeへコピーするため、unit fixtureが実際の `~/.openclaw` を変更できません。
- 実際のhome directoryをliveテストに使わせる必要がある場合にのみ `OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードがデフォルトです: `[live] ...` の進捗出力は維持しますが、追加の `~/.profile` 通知を抑制し、gateway bootstrapログ/Bonjour chatterをミュートします。完全な起動ログが必要な場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- APIキーのローテーション（プロバイダー別）: カンマ/セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）、あるいはlive専用上書きの `OPENCLAW_LIVE_*_KEY` を設定します。テストはrate limit応答時に再試行します。
- 進捗/Heartbeat出力:
  - liveスイートは現在、進捗行をstderrに出力するため、Vitestのコンソールキャプチャが静かでも長時間のプロバイダー呼び出しが動作中であることがわかります。
  - `vitest.live.config.ts` はVitestのコンソール横取りを無効化しているため、プロバイダー/gatewayの進捗行はlive実行中に即座にストリームされます。
  - 直接モデルのHeartbeatは `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - gateway/プローブのHeartbeatは `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

この判断表を使ってください:

- ロジック/テストを編集した: `pnpm test` を実行（大きく変更したなら `pnpm test:coverage` も）
- gateway networking / WS protocol / pairing に触れた: `pnpm test:e2e` を追加
- 「botが落ちている」/ プロバイダー固有の失敗 / tool calling をデバッグしている: 絞った `pnpm test:live` を実行

## Live: Android node capability sweep

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続されたAndroid nodeが現在公開している**すべてのコマンド**を呼び出し、コマンド契約の挙動を検証する。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリをインストール/起動/ペアリングしません）。
  - 選択されたAndroid nodeに対する、コマンドごとのgateway `node.invoke` 検証。
- 必要な事前セットアップ:
  - Androidアプリがすでにgatewayへ接続済みかつペアリング済みであること。
  - アプリが前面に保たれていること。
  - 通過を期待するcapabilityに対する権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Androidの完全なセットアップ詳細: [Android App](/ja-JP/platforms/android)

## Live: model smoke（profile keys）

liveテストは、失敗を切り分けられるように2層に分かれています:

- 「Direct model」は、そのキーでプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gateway smoke」は、そのモデルに対してgateway+agentの完全なパイプライン（sessions、history、tools、sandbox policyなど）が動作するかを示します。

### 第1層: Direct model completion（gatewayなし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って認証情報を持つモデルを選択する
  - モデルごとに小さなcompletionを実行する（必要に応じて対象を絞ったリグレッションも）
- 有効化方法:
  - `pnpm test:live`（またはVitestを直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`。modernのエイリアス）を設定してください。設定しない場合、`pnpm test:live` をgateway smokeに集中させるためスキップされます
- モデルの選び方:
  - modern allowlistを実行するには `OPENCLAW_LIVE_MODELS=modern`（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` はmodern allowlistのエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切りallowlist）
  - modern/allスイープは、デフォルトで高シグナルに厳選した上限が適用されます。modernを網羅的にスイープするには `OPENCLAW_LIVE_MAX_MODELS=0`、より小さい上限を使うには正の数を設定してください。
- プロバイダーの選び方:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切りallowlist）
- キーの取得元:
  - デフォルト: profile storeとenvフォールバック
  - **profile store** のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定
- これが存在する理由:
  - 「プロバイダーAPIが壊れている / キーが無効」と「gateway agentパイプラインが壊れている」を分離するため
  - 小さく分離されたリグレッションを収めるため（例: OpenAI Responses/Codex Responsesのreasoning replay + tool-callフロー）

### 第2層: Gateway + dev agent smoke（「@openclaw」が実際に何をするか）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内gatewayを起動する
  - `agent:dev:*` セッションを作成/patchする（実行ごとのモデル上書き）
  - キー付きモデルを反復し、次を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが動作すること（read probe）
    - 任意の追加ツールprobe（exec+read probe）
    - OpenAIリグレッションパス（tool-callのみ → follow-up）が動作し続けること
- Probeの詳細（失敗を素早く説明できるように）:
  - `read` probe: テストがworkspace内にnonceファイルを書き込み、agentにそのファイルを `read` してnonceをそのまま返すよう求めます。
  - `exec+read` probe: テストがagentに `exec` でnonceを一時ファイルへ書き込ませ、その後 `read` で読み戻させます。
  - image probe: テストが生成したPNG（猫 + ランダム化コード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（またはVitestを直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選び方:
  - デフォルト: modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` はmodern allowlistのエイリアスです
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）で絞り込めます
  - modern/allのgatewayスイープは、デフォルトで高シグナルに厳選した上限が適用されます。modernを網羅的にスイープするには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`、より小さい上限には正の数を設定してください。
- プロバイダーの選び方（「OpenRouter全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切りallowlist）
- ツール + image probeはこのliveテストでは常に有効です:
  - `read` probe + `exec+read` probe（ツール負荷テスト）
  - モデルがimage inputサポートを公開している場合はimage probeを実行
  - フロー（概要）:
    - テストが「CAT」+ ランダムコードの小さなPNGを生成します（`src/gateway/live-image-probe.ts`）
    - `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信します
    - Gatewayが添付ファイルを `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded agentがマルチモーダルなユーザーメッセージをモデルへ転送します
    - 検証: 返信に `cat` + そのコードが含まれること（OCR許容: 軽微な誤りは許容）

ヒント: 自分のマシンで何をテストできるか（および正確な `provider/model` id）を確認するには、次を実行してください:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLIバックエンドsmoke（Claude、Codex、Gemini、またはその他のローカルCLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定に触れずに、ローカルCLIバックエンドを使ってGateway + agentパイプラインを検証する。
- バックエンド固有のsmokeデフォルトは、所有extensionの `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（またはVitestを直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトのprovider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image挙動は、所有CLIバックエンドPluginのメタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送るには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはpromptに注入されます）。
  - prompt注入の代わりにCLI引数として画像ファイルパスを渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` 設定時の画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2ターン目を送ってresumeフローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - デフォルトのClaude Sonnet -> Opus同一セッション継続probeを無効化するには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択したモデルが切り替え先をサポートしているときに強制有効化するには `1`）。

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

単一プロバイダーのDockerレシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注意:

- Dockerランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- repoのDockerイメージ内で、非rootの `node` ユーザーとしてlive CLI-backend smokeを実行します。
- 所有extensionからCLI smokeメタデータを解決し、対応するLinux CLI package（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、書き込み可能なキャッシュprefix `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）へインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` では、`~/.claude/.credentials.json` 内の `claudeAiOauth.subscriptionType`、または `claude setup-token` からの `CLAUDE_CODE_OAUTH_TOKEN` によるポータブルClaude Code subscription OAuthが必要です。まずDocker内で直接 `claude -p` を検証し、その後Anthropic API-key env varを保持せずに2回のGateway CLI-backendターンを実行します。このsubscriptionレーンでは、Claudeが現在サードパーティアプリ利用を通常のsubscriptionプラン制限ではなく追加利用課金へルーティングするため、Claude MCP/toolおよびimage probeはデフォルトで無効です。
- live CLI-backend smokeは現在、Claude、Codex、Geminiに対して同じエンドツーエンドフローを検証します: テキストターン、画像分類ターン、そしてgateway CLI経由で検証されるMCP `cron` ツール呼び出し。
- Claudeのデフォルトsmokeでは、セッションをSonnetからOpusへpatchし、再開されたセッションが以前のメモを保持していることも検証します。

## Live: ACP bind smoke（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: live ACP agentを使って実際のACP会話bindフローを検証する:
  - `/acp spawn <agent> --bind here` を送信
  - 合成メッセージチャンネル会話をその場でbind
  - 同じ会話で通常のfollow-upを送信
  - follow-upがbind済みACPセッションtranscriptに入ることを検証
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker内のACP agent: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用のACP agent: `claude`
  - 合成チャンネル: SlackのDM形式会話コンテキスト
  - ACPバックエンド: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 注意:
  - このレーンは、テストが外部配信を装わずにメッセージチャンネル文脈を付与できるよう、admin専用の合成originating-routeフィールド付きでgatewayの `chat.send` 表面を使います。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、テストは選択したACP harness agentに対して、埋め込みの `acpx` Pluginの組み込みagent registryを使います。

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

単一agentのDockerレシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Dockerに関する注意:

- Dockerランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、サポートされるすべてのlive CLI agentに対してACP bind smokeを順番に実行します: `claude`、`codex`、`gemini`。
- マトリクスを絞るには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` を使ってください。
- `~/.profile` をsourceし、一致するCLI認証素材をコンテナへ配置し、`acpx` を書き込み可能なnpm prefixへインストールし、不足していれば要求されたlive CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）をインストールします。
- Docker内では、ランナーは `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定し、sourceしたprofileのプロバイダーenv varが子harness CLIでも利用できるようにします。

## Live: Codex app-server harness smoke

- 目的: 通常のgateway
  `agent` メソッドを通じてPlugin所有のCodex harnessを検証する:
  - バンドル済み `codex` Pluginを読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - 最初のgateway agentターンを `codex/gpt-5.4` に送る
  - 同じOpenClawセッションに2ターン目を送り、app-server
    threadがresumeできることを検証する
  - `/codex status` と `/codex models` を同じgateway command
    パス経由で実行する
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `codex/gpt-5.4`
- 任意のimage probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意のMCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- このsmokeは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れたCodex
  harnessがPIへ黙ってフォールバックして通過することはありません。
- 認証: shell/profileの `OPENAI_API_KEY`、および任意でコピーされる
  `~/.codex/auth.json` と `~/.codex/config.toml`

ローカルレシピ:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Dockerレシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Dockerに関する注意:

- Dockerランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- マウントされた `~/.profile` をsourceし、`OPENAI_API_KEY` を渡し、存在する場合はCodex CLI
  認証ファイルをコピーし、書き込み可能なマウント済みnpm
  prefixに `@openai/codex` をインストールし、ソースツリーを配置してから、Codex-harness liveテストだけを実行します。
- Dockerでは、image probeとMCP/tool probeがデフォルトで有効です。より絞ったデバッグ実行が必要な場合は
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` を設定してください。
- Dockerは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` もexportし、live
  テスト設定に合わせているため、`openai-codex/*` やPIフォールバックがCodex harness
  のリグレッションを隠すことはできません。

### 推奨されるliveレシピ

狭く明示的なallowlistが最速で、最も不安定さが少なくなります:

- 単一モデル、直接実行（gatewayなし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがるtool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google中心（Gemini API key + Antigravity）:
  - Gemini（API key）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意:

- `google/...` はGemini API（API key）を使用します。
- `google-antigravity/...` はAntigravity OAuth bridge（Cloud Code Assist形式のagent endpoint）を使用します。
- `google-gemini-cli/...` は手元のマシン上のローカルGemini CLIを使用します（別個の認証 + toolingの癖があります）。
- Gemini APIとGemini CLI:
  - API: OpenClawはGoogleがホストするGemini APIをHTTP経由で呼び出します（API key / profile認証）。通常ユーザーが「Gemini」と言うときの大半はこれです。
  - CLI: OpenClawはローカルの `gemini` バイナリをshell実行します。独自の認証を持ち、挙動が異なることがあります（streaming/toolサポート/version差異）。

## Live: model matrix（何をカバーするか）

固定の「CIモデル一覧」はありません（liveはオプトイン）が、キーを持つ開発マシン上で定期的にカバーすることを**推奨**するモデルは次のとおりです。

### Modern smokeセット（tool calling + image）

これは、動作し続けることを期待している「一般的なモデル」の実行です:

- OpenAI（non-Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古いGemini 2.xモデルは避けてください）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

tools + image付きでgateway smokeを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool calling（Read + 任意のExec）

プロバイダーファミリーごとに少なくとも1つは選んでください:

- OpenAI: `openai/gpt-5.4`（または `openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あると良い）:

- xAI: `xai/grok-4`（または最新利用可能なもの）
- Mistral: `mistral/`…（有効化されている「tools」対応モデルを1つ選ぶ）
- Cerebras: `cerebras/`…（アクセスがある場合）
- LM Studio: `lmstudio/`…（ローカル。tool callingはAPIモードに依存）

### Vision: image send（添付ファイル → マルチモーダルメッセージ）

image probeを検証するために、少なくとも1つのimage対応モデル（Claude/Gemini/OpenAIのvision対応バリアントなど）を `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください。

### Aggregators / 代替gateway

キーが有効なら、次経由のテストもサポートしています:

- OpenRouter: `openrouter/...`（数百のモデル。tool+image対応候補を見つけるには `openclaw models scan` を使ってください）
- OpenCode: Zen用の `opencode/...` とGo用の `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

live matrixに含められるその他のプロバイダー（認証情報/設定がある場合）:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers` 経由（カスタムendpoint）: `minimax`（cloud/API）、および任意のOpenAI/Anthropic互換proxy（LM Studio、vLLM、LiteLLMなど）

ヒント: docs内で「全モデル」をハードコードしようとしないでください。正式な一覧は、そのマシン上で `discoverModels(...)` が返すもの + 利用可能なキーです。

## 認証情報（絶対にコミットしない）

liveテストは、CLIと同じ方法で認証情報を検出します。実務上の意味は次のとおりです:

- CLIが動くなら、liveテストも同じキーを見つけられるはずです。
- liveテストが「認証情報なし」と言うなら、`openclaw models list` / モデル選択をデバッグするときと同じ方法で調査してください。

- agentごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（liveテストでいう「profile keys」はこれです）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシーstateディレクトリ: `~/.openclaw/credentials/`（存在する場合はstageされたlive homeへコピーされますが、メインのprofile-key storeではありません）
- ローカルのlive実行は、デフォルトでアクティブ設定、agentごとの `auth-profiles.json` ファイル、レガシー `credentials/`、およびサポートされる外部CLI認証ディレクトリを一時テストhomeへコピーします。stageされたlive homeでは `workspace/` と `sandboxes/` はスキップされ、`agents.*.workspace` / `agentDir` パス上書きは除去されるため、probeが実際のホストworkspaceに触れません。

envキー（たとえば `~/.profile` でexportされているもの）に頼りたい場合は、`source ~/.profile` の後にローカルテストを実行するか、以下のDockerランナーを使ってください（これらは `~/.profile` をコンテナへマウントできます）。

## Deepgram live（音声文字起こし）

- テスト: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- テスト: `src/agents/byteplus.live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- スコープ:
  - バンドル済みcomfyの画像、動画、`music_generate` パスを検証します
  - `models.providers.comfy.<capability>` が設定されていない場合、各capabilityはスキップされます
  - comfy workflow送信、polling、download、またはPlugin登録を変更した後に有用です

## Image generation live

- テスト: `src/image-generation/runtime.live.test.ts`
- コマンド: `pnpm test:live src/image-generation/runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- スコープ:
  - 登録されているすべての画像生成プロバイダーPluginを列挙します
  - probe前に、ログインshell（`~/.profile`）から不足しているプロバイダーenv varを読み込みます
  - デフォルトでは、保存済みauth profileよりlive/env API keyを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のshell認証情報を隠しません
  - 利用可能な認証/profile/modelがないプロバイダーはスキップします
  - 共有ランタイムcapabilityを通じて標準の画像生成バリアントを実行します:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされるバンドル済みプロバイダー:
  - `openai`
  - `google`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 任意の認証挙動:
  - profile-store認証を強制し、envのみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Music generation live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- スコープ:
  - 共有のバンドル済み音楽生成プロバイダーパスを検証します
  - 現在はGoogleとMiniMaxをカバーしています
  - probe前に、ログインshell（`~/.profile`）からプロバイダーenv varを読み込みます
  - デフォルトでは、保存済みauth profileよりlive/env API keyを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のshell認証情報を隠しません
  - 利用可能な認証/profile/modelがないプロバイダーはスキップします
  - 利用可能な場合は、宣言された両方のランタイムモードを実行します:
    - promptのみの入力による `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンカバレッジ:
    - `google`: `generate`、`edit`
    - `minimax`: `generate`
    - `comfy`: この共有スイープではなく、別のComfy liveファイル
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意の認証挙動:
  - profile-store認証を強制し、envのみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## Video generation live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- スコープ:
  - 共有のバンドル済み動画生成プロバイダーパスを検証します
  - デフォルトではリリース安全なsmokeパスを使います: FAL以外のプロバイダー、各プロバイダーごとに1件のtext-to-videoリクエスト、1秒のロブスタープロンプト、そして `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` によるプロバイダーごとの操作上限（デフォルト `180000`）
  - FALは、プロバイダー側のキュー待ち時間がリリース時間を支配しうるため、デフォルトではスキップされます。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を指定してください
  - probe前に、ログインshell（`~/.profile`）からプロバイダーenv varを読み込みます
  - デフォルトでは、保存済みauth profileよりlive/env API keyを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のshell認証情報を隠しません
  - 利用可能な認証/profile/modelがないプロバイダーはスキップします
  - デフォルトでは `generate` のみを実行します
  - 利用可能な場合に宣言されたtransformモードも実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定してください:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言しており、かつ選択したプロバイダー/モデルが共有スイープでbufferベースのローカル画像入力を受け付ける場合の `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言しており、かつ選択したプロバイダー/モデルが共有スイープでbufferベースのローカル動画入力を受け付ける場合の `videoToVideo`
  - 現在、共有スイープで宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - バンドル済み `veo3` はtext専用で、バンドル済み `kling` はリモート画像URLを必要とするため、`vydra`
  - プロバイダー固有のVydraカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` のtext-to-videoに加えて、デフォルトでリモート画像URL fixtureを使う `kling` レーンを実行します
  - 現在の `videoToVideo` liveカバレッジ:
    - 選択モデルが `runway/gen4_aleph` の場合の `runway` のみ
  - 現在、共有スイープで宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - これらのパスは現在リモート `http(s)` / MP4参照URLを必要とするため、`alibaba`、`qwen`、`xai`
    - 現在の共有Gemini/Veoレーンはローカルbufferベース入力を使用しており、そのパスは共有スイープでは受け付けられないため、`google`
    - 現在の共有レーンにはorg固有のvideo inpaint/remixアクセス保証がないため、`openai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルトスイープですべてのプロバイダー（FALを含む）を含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - より攻めたsmoke実行のために各プロバイダー操作上限を下げるには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証挙動:
  - profile-store認証を強制し、envのみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## メディアliveハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の画像、音楽、動画liveスイートを、repoネイティブの1つのentrypointで実行する
  - `~/.profile` から不足しているプロバイダーenv varを自動読み込みする
  - デフォルトで、各スイートを現在利用可能な認証を持つプロバイダーへ自動的に絞り込む
  - `scripts/test-live.mjs` を再利用するため、Heartbeatとquiet modeの挙動が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Dockerランナー（任意の「Linuxでも動く」チェック）

これらのDockerランナーは2つの区分に分かれます:

- Live-modelランナー: `test:docker:live-models` と `test:docker:live-gateway` は、それぞれ対応するprofile-key liveファイルのみをrepo Docker image内で実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。対応するローカルentrypointは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker liveランナーは、完全なDockerスイープが現実的になるよう、デフォルトでより小さなsmoke上限を使います:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を設定します。より大きい網羅的スキャンを明示的に行いたい場合は、これらのenv varを上書きしてください。
- `test:docker:all` はまず `test:docker:live-build` でlive Docker imageを一度ビルドし、その後2つのlive Dockerレーンで再利用します。
- コンテナsmokeランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels`、および `test:docker:plugins` は、1つ以上の実コンテナを起動し、より高レベルなintegrationパスを検証します。

live-model Dockerランナーは、必要なCLI認証homeだけ（または実行が絞り込まれていない場合はサポートされるすべて）もbind-mountし、実行前にそれらをコンテナhomeへコピーするため、外部CLI OAuthはホスト認証ストアを変更せずにtokenを更新できます:

- Direct models: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind smoke: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI backend smoke: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なscaffolding）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Gateway networking（2コンテナ、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- MCP channel bridge（seed済みGateway + stdio bridge + 生のClaude notification-frame smoke）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Plugins（install smoke + `/plugin` エイリアス + Claude-bundle restart semantics）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）

live-model Dockerランナーは、現在のcheckoutも読み取り専用でbind-mountし、
コンテナ内の一時workdirへ配置します。これにより、runtime
imageをスリムに保ちながら、正確にローカルのソース/設定に対してVitestを実行できます。
配置ステップでは、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、およびアプリローカルの `.build` や
Gradle出力ディレクトリのような大きなローカル専用キャッシュやアプリビルド出力をスキップするため、Docker live実行で
マシン固有artifactのコピーに何分も費やすことがありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、gateway live probeが
コンテナ内で実際のTelegram/Discordなどのチャンネルworkerを起動しません。
`test:docker:live-models` は依然として `pnpm test:live` を実行するため、
そのDockerレーンでgateway
liveカバレッジを絞り込んだり除外したりする必要がある場合は `OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` はより高レベルな互換性smokeです。OpenAI互換HTTP endpointを有効にした
OpenClaw gatewayコンテナを起動し、そのgatewayに対して固定版のOpen WebUIコンテナを起動し、
Open WebUI経由でサインインし、`/api/models` が `openclaw/default` を公開していることを確認し、その後
Open WebUIの `/api/chat/completions` proxy経由で実際のchatリクエストを送信します。
初回実行は、Dockerが
Open WebUI imageをpullする必要がある場合や、Open WebUI自身のcold-startセットアップを完了する必要がある場合があるため、目立って遅くなることがあります。
このレーンは利用可能なlive model keyを前提とし、Docker化された実行でそれを提供する主要な方法は
`OPENCLAW_PROFILE_FILE`
（デフォルトでは `~/.profile`）です。成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さなJSON payloadが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、またはiMessageアカウントを必要としません。seed済みGateway
コンテナを起動し、`openclaw mcp serve` を起動する2つ目のコンテナを開始し、その後
ルーティングされた会話検出、transcript読み取り、添付ファイルメタデータ、
live event queue挙動、送信send routing、そして実際のstdio MCP bridge上でのClaude形式のchannel +
permission通知を検証します。通知チェックは
生のstdio MCP frameを直接検査するため、このsmokeは特定のclient SDKがたまたま表面化するものだけでなく、bridgeが実際に出力するものを検証します。

手動ACP plain-language thread smoke（CIではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグワークフロー用に残してください。ACP thread routing検証のために再度必要になる可能性があるので、削除しないでください。

便利なenv var:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前にsourceされます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、`OPENCLAW_PROFILE_FILE` からsourceされたenv varのみを検証し、一時config/workspaceディレクトリと外部CLI認証マウントなしで実行します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は `/home/node/.npm-global` にマウントされ、Docker内でのCLIインストールをキャッシュします
- `$HOME` 配下の外部CLI認証ディレクトリ/ファイルは、`/host-auth...` 配下に読み取り専用でマウントされ、その後テスト開始前に `/home/node/...` へコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定される必要なディレクトリ/ファイルのみをマウントします
  - 手動上書きは `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで行えます
- 実行を絞るには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内でプロバイダーをフィルタするには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 再ビルド不要の再実行で既存の `openclaw:local-live` imageを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報の取得元をprofile store（envではなく）に限定するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
- Open WebUI smokeでgatewayが公開するモデルを選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smokeで使うnonceチェックpromptを上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定されたOpen WebUI image tagを上書きするには `OPENWEBUI_IMAGE=...`

## docsの健全性確認

docs編集後はdocsチェックを実行してください: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全なMintlify anchor検証を実行してください: `pnpm docs:check-links:anchors`。

## オフラインリグレッション（CI安全）

これらは、実際のプロバイダーなしで行う「実パイプライン」リグレッションです:

- Gateway tool calling（mock OpenAI、実gateway + agent loop）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gatewayウィザード（WS `wizard.start`/`wizard.next`、設定書き込み + auth強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## Agent信頼性evals（Skills）

すでに、いくつかのCI安全なテストが「agent信頼性evals」のように振る舞います:

- 実gateway + agent loopを通したmock tool-calling（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skillsについてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **判断:** promptにSkillsが列挙されているとき、agentは正しいSkillを選ぶか（または無関係なものを避けるか）？
- **準拠:** agentは使用前に `SKILL.md` を読み、必須の手順/引数に従うか？
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界を検証するマルチターンシナリオ。

今後のevalは、まず決定的であることを優先してください:

- モックプロバイダーを使い、ツール呼び出し + 順序、Skillファイル読み取り、セッション配線を検証するシナリオランナー。
- Skillに焦点を当てた小規模シナリオ群（使う vs 避ける、ゲーティング、prompt injection）。
- オプションのlive eval（オプトイン、envでゲート）は、CI安全なスイートが整ってからのみ。

## Contractテスト（Pluginおよびチャンネル形状）

Contractテストは、登録されたすべてのPluginとチャンネルが
そのインターフェース契約に準拠していることを検証します。検出されたすべてのPluginを反復し、
形状および挙動に関する一連の検証を実行します。デフォルトの `pnpm test` unitレーンは、
これらの共有seamおよびsmokeファイルを意図的にスキップします。共有の
チャンネルまたはプロバイダー表面に触れた場合は、contractコマンドを明示的に実行してください。

### コマンド

- すべてのcontract: `pnpm test:contracts`
- チャンネルcontractのみ: `pnpm test:contracts:channels`
- プロバイダーcontractのみ: `pnpm test:contracts:plugins`

### チャンネルcontract

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的なPlugin形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディング挙動
- **outbound-payload** - メッセージpayload構造
- **inbound** - 受信メッセージ処理
- **actions** - チャンネルアクションハンドラー
- **threading** - スレッドID処理
- **directory** - ディレクトリ/roster API
- **group-policy** - グループポリシー適用

### プロバイダーステータスcontract

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャンネルステータスprobe
- **registry** - Plugin registry形状

### プロバイダーcontract

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証の選択/選定
- **catalog** - モデルカタログAPI
- **discovery** - Plugin検出
- **loader** - Plugin読み込み
- **runtime** - プロバイダーruntime
- **shape** - Pluginの形状/インターフェース
- **wizard** - セットアップウィザード

### 実行するタイミング

- Plugin SDKのexportやsubpathを変更した後
- チャンネルまたはプロバイダーPluginを追加または変更した後
- Plugin登録または検出をリファクタリングした後

ContractテストはCIで実行され、実際のAPIキーは不要です。

## リグレッションの追加（ガイダンス）

liveで見つかったプロバイダー/モデル問題を修正する場合:

- 可能ならCI安全なリグレッションを追加してください（モック/スタブプロバイダー、または正確なrequest-shape変換のキャプチャ）
- 本質的にlive専用の場合（rate limit、認証ポリシー）は、liveテストを狭く保ち、env varによるオプトインにしてください
- バグを捕まえられる最小の層を狙うことを推奨します:
  - プロバイダーのrequest変換/replayバグ → direct modelsテスト
  - gatewayのsession/history/toolパイプラインバグ → gateway live smokeまたはCI安全なgatewayモックテスト
- SecretRef走査ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registryメタデータ（`listSecretTargetRegistryEntries()`）からSecretRefクラスごとに1つのサンプル対象を導出し、走査セグメントを含むexec idが拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRefターゲットファミリーを追加する場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは、未分類のターゲットidに対して意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。
