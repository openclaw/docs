---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対するリグレッションを追加する
    - Gateway + エージェントの動作をデバッグする
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、および各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-04-21T13:36:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3290113f28dab37f4b6ceb0bda6ced70c7d2b24ad3fccac6488b6aab1ad65e52
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、少数の Docker ランナーがあります。

このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何を対象にしているか（そして意図的に _対象外_ にしているものは何か）
- 一般的なワークフロー（ローカル、push 前、デバッグ）で実行するコマンド
- live テストがどのように認証情報を見つけ、モデル/プロバイダーを選択するか
- 実際のモデル/プロバイダーの問題に対するリグレッションの追加方法

## クイックスタート

ほとんどの日は次で十分です。

- フルゲート（push 前に期待される）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでのより高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は extension/channel パスもルーティングするようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復修正しているときは、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたとき、または追加の確信がほしいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（モデル + Gateway のツール/画像プローブ）: `pnpm test:live`
- 1 つの live ファイルだけを静かに対象化: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Moonshot/Kimi のコストスモーク: `MOONSHOT_API_KEY` を設定したうえで、
  `openclaw models list --provider moonshot --json` を実行し、その後
  `moonshot/kimi-k2.6` に対して分離実行の
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を実行します。JSON に Moonshot/K2.6 が報告され、assistant transcript に正規化された `usage.cost` が保存されることを確認してください。

ヒント: 必要なのが 1 つの失敗ケースだけなら、以下で説明する allowlist 環境変数を使って live テストを絞り込むことを優先してください。

## QA 固有ランナー

これらのコマンドは、QA-lab の現実性が必要なときにメインのテストスイートと並んで使います。

- `pnpm openclaw qa suite`
  - リポジトリベースの QA シナリオをホスト上で直接実行します。
  - デフォルトでは、分離された Gateway ワーカーを使って複数の選択シナリオを並列実行します。`qa-channel` のデフォルト並列度は 4 です（選択されたシナリオ数により上限あり）。ワーカー数を調整するには `--concurrency <count>` を使い、従来の直列レーンにするには `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物だけほしい場合は `--allow-failures` を使ってください。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。`aimock` はローカルの AIMock ベースのプロバイダーサーバーを起動し、シナリオ認識の `mock-openai` レーンを置き換えることなく、実験的な fixture とプロトコルモックのカバレッジを提供します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、ゲストで実用的な、サポート対象の QA 認証入力を転送します:
    環境変数ベースのプロバイダーキー、QA live プロバイダー設定パス、存在する場合の `CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるよう、リポジトリルート配下に置く必要があります。
  - 通常の QA レポート + サマリーに加えて、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業のために、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:bundled-channel-deps`
  - 現在の OpenClaw ビルドを Docker にパックしてインストールし、OpenAI を設定した状態で Gateway を起動してから、設定編集によって Telegram と Discord を有効化します。
  - 最初の Gateway 再起動で各バンドル済みチャネル Plugin の実行時依存関係がオンデマンドでインストールされること、および 2 回目の再起動ではすでに有効化された依存関係が再インストールされないことを検証します。
- `pnpm openclaw qa aimock`
  - 直接のプロトコルスモークテスト用に、ローカルの AIMock プロバイダーサーバーだけを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel homeserver に対して Matrix live QA レーンを実行します。
  - この QA ホストは現時点では repo/dev 専用です。パッケージ化された OpenClaw インストールには `qa-lab` は同梱されないため、`openclaw qa` は公開されません。
  - リポジトリチェックアウトでは、バンドル済みランナーを直接読み込みます。別個の Plugin インストール手順は不要です。
  - 一時的な Matrix ユーザー 3 人（`driver`、`sut`、`observer`）と 1 つのプライベートルームを用意し、その後、SUT トランスポートとして実際の Matrix Plugin を使う QA gateway 子プロセスを開始します。
  - デフォルトでは固定された安定版 Tuwunel イメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使用します。別のイメージをテストする必要がある場合は `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrix では、レーンがローカルで使い捨てユーザーを用意するため、共有の認証情報ソースフラグは公開しません。
  - Matrix QA レポート、サマリー、observed-events 成果物、および stdout/stderr を結合した出力ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm openclaw qa telegram`
  - 環境変数の driver および SUT ボットトークンを使って、実際のプライベートグループに対して Telegram live QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ id は数値の Telegram chat id である必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。通常は env モードを使い、プールされたリースを使うには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物だけほしい場合は `--allow-failures` を使ってください。
  - 同じプライベートグループ内に 2 つの異なるボットが必要で、SUT ボットは Telegram ユーザー名を公開している必要があります。
  - 安定した bot-to-bot 観測のために、両方のボットで `@BotFather` の Bot-to-Bot Communication Mode を有効にし、driver ボットがグループ内のボットトラフィックを観測できるようにしてください。
  - Telegram QA レポート、サマリー、および observed-messages 成果物を `.artifacts/qa-e2e/...` 配下に書き込みます。

live transport レーンは、追加される新しいトランスポートが逸脱しないよう、1 つの標準契約を共有します。

`qa-channel` は引き続き広範な合成 QA スイートであり、live transport カバレッジマトリクスには含まれません。

| レーン   | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex 経由の共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、
QA lab は Convex ベースのプールから排他的リースを取得し、レーン実行中はそのリースに Heartbeat を送り続け、終了時にリースを解放します。

参照用 Convex プロジェクトのひな型:

- `qa/convex-credential-broker/`

必須の環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロールに対応する 1 つのシークレット:
  - `maintainer` には `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` には `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトで `ci`、それ以外では `maintainer`）

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発のために loopback `http://` Convex URL を許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用してください。

メンテナー向け管理コマンド（プールの追加/削除/一覧表示）には、
特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

スクリプトや CI ユーティリティで機械可読な出力が必要な場合は `--json` を使ってください。

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
- `POST /admin/add`（maintainer シークレット専用）
  - リクエスト: `{ kind, actorId, payload, note?, status? }`
  - 成功: `{ status: "ok", credential }`
- `POST /admin/remove`（maintainer シークレット専用）
  - リクエスト: `{ credentialId, actorId }`
  - 成功: `{ status: "ok", changed, credential }`
  - アクティブリースガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（maintainer シークレット専用）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram 種別のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正なペイロードを拒否します。

### QA にチャネルを追加する

Markdown QA システムにチャネルを追加するには、必要なのはちょうど 2 つです。

1. そのチャネル用の transport adapter
2. チャネル契約を検証する scenario pack

共有の `qa-lab` ホストがフローを所有できる場合は、新しい最上位 QA コマンドルートを追加しないでください。

`qa-lab` は共有ホストの仕組みを所有します。

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカー並列度
- 成果物の書き込み
- レポート生成
- シナリオ実行
- 旧 `qa-channel` シナリオ向け互換エイリアス

ランナー Plugin は transport 契約を所有します。

- 共有 `qa` ルート配下で `openclaw qa <runner>` をどうマウントするか
- そのトランスポート向けに Gateway をどう設定するか
- 準備完了をどう確認するか
- 受信イベントをどう注入するか
- 送信メッセージをどう観測するか
- transcript と正規化された transport 状態をどう公開するか
- transport ベースのアクションをどう実行するか
- transport 固有のリセットまたはクリーンアップをどう扱うか

新しいチャネルの最小採用基準は次のとおりです。

1. 共有 `qa` ルートの所有者は `qa-lab` のままにする。
2. transport ランナーを共有 `qa-lab` ホストシーム上に実装する。
3. transport 固有の仕組みはランナー Plugin またはチャネルハーネス内に閉じ込める。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントする。
   ランナー Plugin は `openclaw.plugin.json` に `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートする必要があります。
   `runtime-api.ts` は軽量に保ってください。遅延 CLI とランナー実行は、別々のエントリポイントの背後に置く必要があります。
5. テーマ別の `qa/scenarios/` ディレクトリ配下に markdown シナリオを作成または適応する。
6. 新しいシナリオには汎用シナリオヘルパーを使う。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格です:

- 挙動を `qa-lab` で 1 回だけ表現できるなら、`qa-lab` に置いてください。
- 挙動が 1 つのチャネルトランスポートに依存するなら、そのランナー Plugin または Plugin ハーネス内に保持してください。
- シナリオが複数のチャネルで使える新しい機能を必要とするなら、`suite.ts` にチャネル固有の分岐を追加するのではなく、汎用ヘルパーを追加してください。
- 挙動が 1 つのトランスポートにしか意味を持たないなら、そのシナリオはトランスポート固有のままにし、それをシナリオ契約内で明示してください。

新しいシナリオに推奨される汎用ヘルパー名は次のとおりです。

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

既存シナリオ向けには、引き続き互換エイリアスが利用できます。たとえば次のものがあります。

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しいチャネル作業では、汎用ヘルパー名を使うべきです。
互換エイリアスは、一斉移行を避けるために存在しているのであって、
新しいシナリオ作成のモデルではありません。

## テストスイート（どこで何が実行されるか）

スイートは「現実性が増す」（そして不安定さ/コストも増す）ものとして考えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 既存のスコープ付き Vitest project に対する 10 個の逐次シャード実行（`vitest.full-*.config.ts`）
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core/unit 在庫と、`vitest.unit.config.ts` で対象化される許可済み `ui` node テスト
- 対象範囲:
  - 純粋な unit テスト
  - インプロセス integration テスト（gateway auth、routing、tooling、parsing、config）
  - 既知のバグに対する決定論的リグレッション
- 想定:
  - CI で実行される
  - 実際のキーは不要
  - 高速かつ安定しているべき
- Projects に関する注意:
  - 対象指定なしの `pnpm test` は、1 つの巨大な native root-project プロセスではなく、11 個のより小さいシャード設定（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行するようになりました。これにより、負荷の高いマシンでのピーク RSS が減り、auto-reply/extension 作業が無関係なスイートを圧迫するのを防ぎます。
  - `pnpm test --watch` は、マルチシャードの watch ループが現実的でないため、引き続き native root の `vitest.config.ts` project graph を使用します。
  - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリ対象をまずスコープ付きレーン経由でルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ではフル root project の起動コストを払わずに済みます。
  - `pnpm test:changed` は、差分がルーティング可能な source/test ファイルだけに触れている場合、変更された git パスを同じスコープ付きレーンに展開します。config/setup の編集は引き続き広範な root-project 再実行にフォールバックします。
  - `pnpm check:changed` は、狭い作業向けの通常のスマートなローカルゲートです。差分を core、core tests、extensions、extension tests、apps、docs、tooling に分類し、それに対応する typecheck/lint/test レーンを実行します。公開 Plugin SDK と plugin-contract の変更には、extensions がそれらの core 契約に依存しているため extension 検証も含まれます。
  - agents、commands、plugins、auto-reply ヘルパー、`plugin-sdk`、および同様の純粋なユーティリティ領域の import が軽い unit テストは `unit-fast` レーンを通り、`test/setup-openclaw-runtime.ts` をスキップします。stateful/runtime-heavy なファイルは既存レーンに残ります。
  - 一部の `plugin-sdk` および `commands` ヘルパー source ファイルも、changed-mode 実行をそれらの light レーン内の明示的な兄弟テストへマッピングするため、ヘルパー編集でそのディレクトリの重いフルスイートを再実行せずに済みます。
  - `auto-reply` には現在 3 つの専用バケットがあります: 最上位 core ヘルパー、最上位 `reply.*` integration テスト、そして `src/auto-reply/reply/**` サブツリーです。これにより、最も重い reply ハーネス作業が軽量な status/chunk/token テストに乗らないようにします。
- Embedded runner に関する注意:
  - message-tool の discovery 入力または compaction runtime context を変更する場合は、
    両方のレベルのカバレッジを維持してください。
  - 純粋な routing/normalization 境界には、焦点を絞ったヘルパーリグレッションを追加してください。
  - あわせて、embedded runner integration スイートも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、スコープ付き id と compaction の挙動が実際の
    `run.ts` / `compact.ts` パスを引き続き流れることを検証します。ヘルパーだけのテストは、
    これらの integration パスの十分な代替にはなりません。
- Pool に関する注意:
  - ベースの Vitest 設定は現在デフォルトで `threads` を使用します。
  - 共有 Vitest 設定では、`isolate: false` も固定され、root projects、e2e、live 設定全体で非分離ランナーを使用します。
  - root UI レーンはその `jsdom` セットアップと optimizer を維持しますが、現在は共有の非分離ランナー上でも実行されます。
  - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false` のデフォルトを継承します。
  - 共有の `scripts/run-vitest.mjs` ランチャーは、Vitest 子 Node プロセスに対してデフォルトで `--no-maglev` も追加するようになり、大規模なローカル実行中の V8 コンパイルの揺れを減らします。標準の V8 挙動と比較したい場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
- 高速なローカル反復に関する注意:
  - `pnpm changed:lanes` は、差分がどのアーキテクチャレーンを引き起こすかを表示します。
  - pre-commit フックは、ステージ済みの format/lint の後に `pnpm check:changed --staged` を実行するため、core のみのコミットでは、公開 extension 向け契約に触れない限り extension テストのコストを払いません。
  - `pnpm test:changed` は、変更パスがより小さいスイートにきれいに対応付けられる場合、スコープ付きレーン経由でルーティングします。
  - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング動作を維持しつつ、より高い worker 上限を使うだけです。
  - ローカル worker の自動スケーリングは現在意図的に保守的で、ホストの load average がすでに高い場合にも抑制されるため、複数の同時 Vitest 実行のダメージがデフォルトで小さくなります。
  - ベースの Vitest 設定は project/config ファイルを `forceRerunTriggers` としてマークしているため、テスト配線が変わったときも changed-mode の再実行が正しく保たれます。
  - この設定では、サポートされるホスト上で `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効のまま維持します。直接プロファイリング用に明示的な 1 つのキャッシュ場所を使いたい場合は `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
- Perf-debug に関する注意:
  - `pnpm test:perf:imports` は、Vitest の import-duration レポートと import-breakdown 出力を有効にします。
  - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを `origin/main` 以降に変更されたファイルに限定します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット済み差分に対してルーティングされた `test:changed` と native root-project パスを比較し、wall time と macOS の max RSS を出力します。
- `pnpm test:perf:changed:bench -- --worktree` は、変更中の現在のツリーを `scripts/test-projects.mjs` と root Vitest 設定経由で変更ファイル一覧にルーティングしてベンチマークします。
  - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッドの main-thread CPU profile を書き出します。
  - `pnpm test:perf:profile:runner` は、unit スイートに対してファイル並列を無効にした状態で runner の CPU+heap profile を書き出します。

### E2E（gateway スモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- 実行時デフォルト:
  - リポジトリ全体の他と同様に、Vitest の `threads` と `isolate: false` を使用します。
  - 適応的 worker を使用します（CI: 最大 2、ローカル: デフォルト 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトで silent mode で実行します。
- 便利な上書き:
  - worker 数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - 詳細なコンソール出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- 対象範囲:
  - マルチインスタンス gateway のエンドツーエンド挙動
  - WebSocket/HTTP サーフェス、ノードペアリング、およびより重いネットワーキング
- 想定:
  - CI で実行される（パイプラインで有効な場合）
  - 実際のキーは不要
  - unit テストより可動部が多い（遅くなることがある）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `test/openshell-sandbox.e2e.test.ts`
- 対象範囲:
  - Docker 経由でホスト上に分離された OpenShell gateway を起動する
  - 一時的なローカル Dockerfile から sandbox を作成する
  - 実際の `sandbox ssh-config` + SSH exec を通じて OpenClaw の OpenShell バックエンドを検証する
  - sandbox fs bridge を通じてリモートの正規 filesystem 挙動を検証する
- 想定:
  - オプトイン専用。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作する Docker daemon が必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト gateway と sandbox を破棄する
- 便利な上書き:
  - より広い e2e スイートを手動実行するときにこのテストを有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたはラッパースクリプトを指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- 対象範囲:
  - 「このプロバイダー/モデルは、実際の認証情報で _今日_ 本当に動くか？」
  - プロバイダーフォーマットの変更、tool-calling の癖、認証問題、レート制限挙動を捕捉する
- 想定:
  - 設計上 CI 安定ではない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - お金がかかる / レート制限を消費する
  - 「全部」ではなく、対象を絞ったサブセットの実行を優先する
- live 実行では、不足している API キーを拾うために `~/.profile` を読み込みます。
- デフォルトでは、live 実行でも `HOME` を分離し、config/auth の素材を一時テスト home にコピーするため、unit fixture が実際の `~/.openclaw` を変更できません。
- live テストで意図的に実際の home ディレクトリを使う必要がある場合にのみ `OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードがデフォルトです。`[live] ...` の進捗出力は維持されますが、追加の `~/.profile` 通知を抑制し、gateway のブートストラップログ/Bonjour のおしゃべりをミュートします。完全な起動ログを再表示したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーのローテーション（プロバイダー別）: カンマ/セミコロン形式の `*_API_KEYS` または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）、あるいは live 専用の上書きとして `OPENCLAW_LIVE_*_KEY` を設定します。テストはレート制限レスポンス時に再試行します。
- 進捗/Heartbeat 出力:
  - live スイートは現在、長いプロバイダー呼び出し中でも Vitest のコンソールキャプチャが静かなときに動作中であることが見えるよう、進捗行を stderr に出力します。
  - `vitest.live.config.ts` は Vitest のコンソール横取りを無効にするため、プロバイダー/gateway の進捗行が live 実行中に即座にストリームされます。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - gateway/probe の Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

この判断表を使ってください。

- ロジック/テストを編集した: `pnpm test` を実行する（大きく変更した場合は `pnpm test:coverage` も）
- gateway ネットワーキング / WS プロトコル / pairing に触れた: `pnpm test:e2e` を追加する
- 「自分のボットが落ちている」/ プロバイダー固有の失敗 / tool calling をデバッグしている: 対象を絞った `pnpm test:live` を実行する

## Live: Android ノード機能スイープ

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続された Android ノードが **現在公開しているすべてのコマンド** を呼び出し、コマンド契約の挙動を検証すること。
- 対象範囲:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/起動/ペアリングは行いません）。
  - 選択された Android ノードに対する、コマンドごとの gateway `node.invoke` 検証。
- 必須の事前セットアップ:
  - Android アプリがすでに Gateway に接続済みかつペアリング済みであること。
  - アプリをフォアグラウンドに維持すること。
  - 成功を期待する機能に必要な権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細: [Android App](/ja-JP/platforms/android)

## Live: モデルスモーク（profile keys）

live テストは、失敗を切り分けられるように 2 層に分かれています。

- 「Direct model」は、そのキーでプロバイダー/モデルが少なくとも応答できることを示します。
- 「Gateway smoke」は、そのモデルに対して Gateway + エージェントの完全なパイプライン（セッション、履歴、ツール、sandbox policy など）が機能することを示します。

### レイヤー 1: Direct model completion（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 発見されたモデルを列挙する
  - `getApiKeyForModel` を使って認証情報を持っているモデルを選ぶ
  - 各モデルに対して小さな completion を実行する（必要に応じて対象を絞ったリグレッションも実行）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`、`modern` のエイリアス）を設定します。そうしないと、`pnpm test:live` を Gateway smoke に集中させるためにスキップされます。
- モデルの選択方法:
  - `OPENCLAW_LIVE_MODELS=modern` で modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）を実行
  - `OPENCLAW_LIVE_MODELS=all` は modern allowlist のエイリアス
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切り allowlist）
  - modern/all スイープは、デフォルトで厳選された高シグナルな上限数を使用します。網羅的な modern スイープには `OPENCLAW_LIVE_MAX_MODELS=0` を設定するか、より小さい上限には正の数を設定します。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り allowlist）
- キーの取得元:
  - デフォルト: profile store と環境変数フォールバック
  - **profile store** のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定
- これが存在する理由:
  - 「provider API が壊れている / キーが無効」と「Gateway の agent pipeline が壊れている」を分離する
  - 小さく分離されたリグレッションを収める（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + dev agent smoke（`@openclaw` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - インプロセスの Gateway を起動する
  - `agent:dev:*` セッションを作成/パッチする（実行ごとにモデル上書き）
  - キーを持つモデルを反復し、次を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが機能すること（read probe）
    - 任意の追加ツールプローブ（exec+read probe）
    - OpenAI のリグレッションパス（tool-call のみ → follow-up）が動作し続けること
- プローブの詳細（失敗をすぐ説明できるように）:
  - `read` probe: テストはワークスペースに nonce ファイルを書き、エージェントにそれを `read` して nonce を返答するよう求めます。
  - `exec+read` probe: テストはエージェントに `exec` で一時ファイルへ nonce を書かせ、その後 `read` で読み戻させます。
  - image probe: テストは生成した PNG（猫 + ランダムコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` および `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern allowlist のエイリアス
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定して絞り込む
  - modern/all の gateway スイープは、デフォルトで厳選された高シグナルな上限数を使用します。網羅的な modern スイープには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を設定するか、より小さい上限には正の数を設定します。
- プロバイダーの選択方法（「OpenRouter の全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り allowlist）
- この live テストではツール + image probe は常時有効です:
  - `read` probe + `exec+read` probe（ツール負荷テスト）
  - image probe は、モデルが画像入力サポートを公開している場合に実行されます
  - フロー（概要）:
    - テストは「CAT」+ ランダムコード入りの小さな PNG を生成します（`src/gateway/live-image-probe.ts`）
    - それを `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信します
    - Gateway は添付ファイルを `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded agent はマルチモーダルなユーザーメッセージをモデルへ転送します
    - 検証: 返信に `cat` + そのコードが含まれること（OCR の許容: 軽微な誤りは許可）

ヒント: 自分のマシンで何をテストできるか（および正確な `provider/model` id）を確認するには、次を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI バックエンドスモーク（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定に触れずに、ローカル CLI バックエンドを使って Gateway + エージェントのパイプラインを検証すること。
- バックエンド固有のスモークデフォルトは、所有する extension の `cli-backend.ts` 定義内にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトの provider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image の挙動は、所有する CLI backend Plugin メタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送るには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。
  - プロンプト注入の代わりに画像ファイルパスを CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されている場合に画像引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 回目のターンを送り、resume フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - デフォルトの Claude Sonnet -> Opus 同一セッション継続プローブを無効にするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択モデルが切り替え先をサポートしているときに強制有効化するには `1`）。
  
例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダーの Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注意:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これは live CLI-backend スモークを、リポジトリ Docker イメージ内で非 root の `node` ユーザーとして実行します。
- 所有する extension から CLI スモークメタデータを解決し、その後、対応する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、キャッシュされた書き込み可能プレフィックス `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）へインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` は、`~/.claude/.credentials.json` の `claudeAiOauth.subscriptionType`、または `claude setup-token` 由来の `CLAUDE_CODE_OAUTH_TOKEN` のいずれかによる、ポータブルな Claude Code subscription OAuth を必要とします。まず Docker 内で直接 `claude -p` を証明し、その後 Anthropic API キーの環境変数を保持せずに 2 回の Gateway CLI-backend ターンを実行します。この subscription レーンでは、Claude が現在サードパーティアプリ利用を通常の subscription プラン制限ではなく追加利用課金へルーティングするため、Claude MCP/tool と image probe がデフォルトで無効化されます。
- live CLI-backend スモークは現在、Claude、Codex、Gemini に対して同じ end-to-end フローを検証します: テキストターン、画像分類ターン、その後 Gateway CLI 経由で検証される MCP `cron` ツール呼び出し。
- Claude のデフォルトスモークでは、セッションを Sonnet から Opus にパッチし、再開されたセッションが以前のメモを引き続き覚えていることも検証します。

## Live: ACP バインドスモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: live ACP エージェントで実際の ACP 会話バインドフローを検証すること:
  - `/acp spawn <agent> --bind here` を送る
  - 合成された message-channel 会話をその場でバインドする
  - 同じ会話で通常の follow-up を送る
  - その follow-up がバインドされた ACP セッショントランスクリプトに入ることを検証する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP エージェント: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP エージェント: `claude`
  - 合成チャネル: Slack DM 風の会話コンテキスト
  - ACP バックエンド: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 注意:
  - このレーンは、テストが外部配信を装わずに message-channel コンテキストを付与できるよう、管理者専用の合成 originating-route フィールド付きで gateway `chat.send` サーフェスを使用します。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、このテストは選択された ACP ハーネスエージェントに対して、組み込み `acpx` Plugin の内蔵 agent registry を使用します。

例:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-acp-bind
```

単一エージェントの Docker レシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker に関する注意:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、サポートされているすべての live CLI エージェントに対して ACP bind スモークを順番に実行します: `claude`、`codex`、次に `gemini`。
- マトリクスを絞り込むには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` を使ってください。
- これは `~/.profile` を読み込み、一致する CLI 認証素材をコンテナに配置し、`acpx` を書き込み可能な npm プレフィックスへインストールし、その後、要求された live CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）がなければインストールします。
- Docker 内では、このランナーは `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定するため、acpx は読み込まれた profile の provider 環境変数を子ハーネス CLI で利用可能なまま保持できます。

## Live: Codex app-server ハーネススモーク

- 目的: plugin が所有する Codex ハーネスを、通常の Gateway
  `agent` メソッド経由で検証すること:
  - バンドル済み `codex` Plugin を読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - 最初の Gateway エージェントターンを `codex/gpt-5.4` に送る
  - 2 回目のターンを同じ OpenClaw セッションに送り、app-server
    スレッドが再開できることを検証する
  - 同じ Gateway コマンド
    パス経由で `/codex status` と `/codex models` を実行する
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `codex/gpt-5.4`
- 任意の image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- このスモークでは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れた Codex
  ハーネスが PI へのサイレントフォールバックによって通過してしまうことはありません。
- 認証: シェル/profile からの `OPENAI_API_KEY`、および必要に応じてコピーされた
  `~/.codex/auth.json` と `~/.codex/config.toml`

ローカル用レシピ:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker レシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker に関する注意:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- これはマウントされた `~/.profile` を読み込み、`OPENAI_API_KEY` を渡し、存在する場合は Codex CLI
  認証ファイルをコピーし、`@openai/codex` を書き込み可能なマウント済み npm
  プレフィックスへインストールし、ソースツリーを配置したあと、Codex-harness live テストのみを実行します。
- Docker では image と MCP/tool probe がデフォルトで有効です。より狭いデバッグ実行が必要な場合は
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` を設定してください。
- Docker でも `OPENCLAW_AGENT_HARNESS_FALLBACK=none` をエクスポートし、live
  テスト設定に合わせるため、`openai-codex/*` や PI へのフォールバックが Codex ハーネスの
  リグレッションを隠すことはできません。

### 推奨される live レシピ

狭く明示的な allowlist が、最も高速で不安定さも最小です。

- 単一モデル、direct（Gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがる tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 重視（Gemini API key + Antigravity）:
  - Gemini（API key）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注意:

- `google/...` は Gemini API（API key）を使用します。
- `google-antigravity/...` は Antigravity OAuth bridge（Cloud Code Assist 風の agent endpoint）を使用します。
- `google-gemini-cli/...` は、あなたのマシン上のローカル Gemini CLI を使用します（別個の認証 + tooling の癖があります）。
- Gemini API と Gemini CLI:
  - API: OpenClaw は Google のホスト型 Gemini API を HTTP 経由で呼び出します（API key / profile 認証）。これは、ほとんどのユーザーが「Gemini」と言うときに意味しているものです。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル実行します。これには独自の認証があり、挙動も異なることがあります（streaming/tool サポート/バージョン差異）。

## Live: モデルマトリクス（何をカバーするか）

固定の「CI モデル一覧」はありません（live はオプトイン）が、キーを持つ開発マシンで定期的にカバーすることを **推奨** するモデルは次のとおりです。

### Modern スモークセット（tool calling + image）

これは、動作し続けることを期待する「共通モデル」実行です。

- OpenAI（非 Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ツール + image 付きで Gateway smoke を実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool calling（Read + 任意の Exec）

少なくとも各プロバイダーファミリーから 1 つは選んでください。

- OpenAI: `openai/gpt-5.4`（または `openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あるとよいもの）:

- xAI: `xai/grok-4`（または利用可能な最新）
- Mistral: `mistral/`…（有効化している「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセスがある場合）
- LM Studio: `lmstudio/`…（ローカル。tool calling は API モードに依存）

### Vision: 画像送信（添付 → マルチモーダルメッセージ）

image probe を検証するために、少なくとも 1 つの画像対応モデルを `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください（Claude/Gemini/OpenAI の画像対応バリアントなど）。

### アグリゲーター / 代替 Gateway

キーが有効なら、次経由のテストもサポートしています。

- OpenRouter: `openrouter/...`（数百のモデル。tool+image 対応候補を見つけるには `openclaw models scan` を使用）
- OpenCode: Zen 用の `opencode/...` と Go 用の `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

live マトリクスに含められるその他のプロバイダー（認証情報/設定がある場合）:

- 組み込み: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（cloud/API）、および任意の OpenAI/Anthropic 互換プロキシ（LM Studio、vLLM、LiteLLM など）

ヒント: ドキュメント内で「全モデル」をハードコードしようとしないでください。権威ある一覧は、あなたのマシン上で `discoverModels(...)` が返すものと、利用可能なキーの組み合わせです。

## 認証情報（絶対にコミットしない）

live テストは、CLI と同じ方法で認証情報を検出します。実際上の意味は次のとおりです。

- CLI が動くなら、live テストも同じキーを見つけられるはずです。
- live テストが「認証情報なし」と言う場合は、`openclaw models list` / モデル選択をデバッグするときと同じやり方でデバッグしてください。

- エージェントごとの auth profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（live テストでいう「profile keys」とはこれを意味します）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- レガシー state ディレクトリ: `~/.openclaw/credentials/`（存在する場合は staged live home にコピーされますが、メインの profile-key store ではありません）
- ローカルの live 実行では、デフォルトでアクティブ設定、エージェントごとの `auth-profiles.json` ファイル、レガシー `credentials/`、およびサポートされる外部 CLI 認証ディレクトリを一時テスト home にコピーします。staged live home では `workspace/` と `sandboxes/` をスキップし、`agents.*.workspace` / `agentDir` パス上書きも削除されるため、probe が実際のホストワークスペースに触れません。

環境変数キー（たとえば `~/.profile` に export 済み）に依存したい場合は、`source ~/.profile` の後にローカルテストを実行するか、以下の Docker ランナーを使ってください（これらは `~/.profile` をコンテナにマウントできます）。

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
- 対象範囲:
  - バンドル済み comfy の画像、動画、および `music_generate` パスを検証する
  - `models.providers.comfy.<capability>` が設定されていない各機能はスキップする
  - comfy workflow の送信、polling、ダウンロード、または Plugin 登録を変更した後に有用

## 画像生成 live

- テスト: `src/image-generation/runtime.live.test.ts`
- コマンド: `pnpm test:live src/image-generation/runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- 対象範囲:
  - 登録されているすべての画像生成プロバイダー Plugin を列挙する
  - probe 前に、あなたのログインシェル（`~/.profile`）から不足しているプロバイダー環境変数を読み込む
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な auth/profile/model がないプロバイダーはスキップする
  - 共有 runtime capability を通じて標準の画像生成バリアントを実行する:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされているバンドル済みプロバイダー:
  - `openai`
  - `google`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で profile-store 認証を強制し、env のみの上書きを無視する

## 音楽生成 live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- 対象範囲:
  - 共有のバンドル済み音楽生成プロバイダーパスを検証する
  - 現在は Google と MiniMax をカバー
  - probe 前に、あなたのログインシェル（`~/.profile`）からプロバイダー環境変数を読み込む
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な auth/profile/model がないプロバイダーはスキップする
  - 利用可能な場合、宣言済みの両方の runtime mode を実行する:
    - プロンプトのみ入力の `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンカバレッジ:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: 別個の Comfy live ファイルであり、この共有スイープではない
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で profile-store 認証を強制し、env のみの上書きを無視する

## 動画生成 live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- 対象範囲:
  - 共有のバンドル済み動画生成プロバイダーパスを検証する
  - デフォルトではリリース安全なスモークパスを使う: FAL 以外のプロバイダー、各プロバイダーにつき 1 回の text-to-video リクエスト、1 秒のロブスタープロンプト、および `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 由来のプロバイダーごとの操作上限（デフォルト `180000`）
  - FAL は、プロバイダー側のキュー遅延がリリース時間を支配しうるため、デフォルトでスキップされます。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を指定してください
  - probe 前に、あなたのログインシェル（`~/.profile`）からプロバイダー環境変数を読み込む
  - デフォルトでは、保存済み auth profile よりも live/env API キーを優先して使うため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 使用可能な auth/profile/model がないプロバイダーはスキップする
  - デフォルトでは `generate` のみ実行する
  - 利用可能な場合に宣言済み transform mode も実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言しており、かつ選択されたプロバイダー/モデルが共有スイープでバッファベースのローカル画像入力を受け付ける場合の `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言しており、かつ選択されたプロバイダー/モデルが共有スイープでバッファベースのローカル動画入力を受け付ける場合の `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - `vydra`。バンドル済み `veo3` はテキスト専用で、バンドル済み `kling` はリモート画像 URL を必要とするため
  - Vydra 固有のカバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` の text-to-video と、デフォルトでリモート画像 URL fixture を使う `kling` レーンを実行します
  - 現在の `videoToVideo` live カバレッジ:
    - 選択モデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`、`qwen`、`xai`。これらのパスは現在、リモート `http(s)` / MP4 参照 URL を必要とするため
    - `google`。現在の共有 Gemini/Veo レーンはローカルのバッファベース入力を使っており、そのパスは共有スイープでは受け付けられないため
    - `openai`。現在の共有レーンには org 固有の video inpaint/remix アクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルトスイープで FAL を含むすべてのプロバイダーを含めるには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 積極的なスモーク実行で各プロバイダーの操作上限を減らすには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で profile-store 認証を強制し、env のみの上書きを無視する

## メディア live ハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の画像、音楽、動画 live スイートを、リポジトリネイティブな 1 つのエントリポイントで実行する
  - `~/.profile` から不足しているプロバイダー環境変数を自動読み込みする
  - デフォルトで、現在使用可能な認証を持つプロバイダーへ各スイートを自動的に絞り込む
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と quiet-mode の挙動が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker ランナー（任意の「Linux でも動く」チェック）

これらの Docker ランナーは 2 つのカテゴリに分かれます。

- Live-model ランナー: `test:docker:live-models` と `test:docker:live-gateway` は、それぞれ対応する profile-key live ファイルだけをリポジトリ Docker イメージ内で実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live ランナーは、フル Docker スイープを現実的に保つため、デフォルトでより小さいスモーク上限を使います:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を使います。より大きな網羅スキャンを明示的に望む場合は、これらの環境変数を上書きしてください。
- `test:docker:all` は、まず `test:docker:live-build` で live Docker イメージを 1 回だけビルドし、その後それを 2 つの live Docker レーンで再利用します。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:plugins` は、1 つ以上の実際のコンテナを起動し、より高レベルの統合パスを検証します。

live-model Docker ランナーは、必要な CLI 認証ホームだけを bind mount し（または実行が絞り込まれていない場合はサポート対象をすべて mount し）、その後実行前にそれらをコンテナ home にコピーするため、外部 CLI OAuth はホストの auth store を変更せずにトークンを更新できます。

- Direct models: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind スモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI backend スモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live スモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディング ウィザード（TTY、フルスキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Gateway ネットワーキング（2 コンテナ、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- MCP channel bridge（seed 済み Gateway + stdio bridge + 生の Claude notification-frame スモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Plugins（install スモーク + `/plugin` エイリアス + Claude バンドル再起動セマンティクス）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）

live-model Docker ランナーは、現在の checkout も読み取り専用で bind mount し、
コンテナ内の一時 workdir に配置します。これにより runtime
イメージをスリムに保ちながら、それでも正確なローカル source/config に対して Vitest を実行できます。
この配置ステップでは、大きなローカル専用キャッシュやアプリビルド出力、たとえば
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、および app ローカルの `.build` や
Gradle 出力ディレクトリをスキップするため、Docker live 実行で
マシン固有の成果物のコピーに何分も費やすことがありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定されるため、Gateway live probe がコンテナ内で
実際の Telegram/Discord などのチャネルワーカーを起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、
その Docker レーンで Gateway live カバレッジを絞り込んだり除外したりしたい場合は
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。これは
OpenAI 互換 HTTP エンドポイントを有効にした OpenClaw gateway コンテナを起動し、
その gateway に対して固定版の Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを確認してから、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
初回実行は、Docker が
Open WebUI イメージを pull する必要があったり、Open WebUI が自身のコールドスタートセットアップを完了する必要があったりするため、目に見えて遅くなることがあります。
このレーンは使用可能な live モデルキーを想定しており、Docker 化実行でそれを提供する主な方法は
`OPENCLAW_PROFILE_FILE`
（デフォルトは `~/.profile`）です。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定論的であり、
実際の Telegram、Discord、または iMessage アカウントを必要としません。これは seed 済み Gateway
コンテナを起動し、`openclaw mcp serve` を起動する第 2 のコンテナを開始し、その後
ルーティングされた会話検出、transcript 読み取り、添付メタデータ、
live event queue の挙動、送信 send ルーティング、そして Claude 風の channel +
permission 通知を、実際の stdio MCP bridge 上で検証します。通知チェックは
生の stdio MCP フレームを直接調べるため、このスモークは
特定のクライアント SDK がたまたま表面化するものではなく、bridge が実際に何を出力するかを検証します。

手動 ACP 平文スレッドスモーク（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

便利な環境変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に読み込まれます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、`OPENCLAW_PROFILE_FILE` から読み込まれる環境変数のみを検証し、一時的な config/workspace ディレクトリを使い、外部 CLI auth mount は行いません
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI auth ディレクトリ/ファイルは、`/host-auth...` 配下に読み取り専用でマウントされ、その後テスト開始前に `/home/node/...` にコピーされます
  - デフォルトのディレクトリ: `.minimax`
  - デフォルトのファイル: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定された必要なディレクトリ/ファイルだけをマウントします
  - 手動上書きは `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切り一覧で行います
- 実行を絞り込むには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内でプロバイダーを絞り込むには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報が profile store 由来であることを保証するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（env ではない）
- Open WebUI スモークで Gateway が公開するモデルを選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI スモークで使う nonce チェックプロンプトを上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定の Open WebUI イメージタグを上書きするには `OPENWEBUI_IMAGE=...`

## ドキュメント整合性

ドキュメント編集後は docs チェックを実行してください: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全な Mintlify アンカー検証を実行してください: `pnpm docs:check-links:anchors`。

## オフラインリグレッション（CI 安全）

これらは、実際のプロバイダーなしでの「実際のパイプライン」リグレッションです。

- Gateway tool calling（モック OpenAI、実際の gateway + agent loop）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、config 書き込み + auth 強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性 evals（Skills）

CI 安全で「エージェント信頼性 evals」のように振る舞うテストは、すでにいくつかあります。

- 実際の gateway + agent loop を通るモック tool-calling（`src/gateway/gateway.test.ts`）。
- セッション配線と config 効果を検証する end-to-end のウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills についてまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **判定:** プロンプト内に Skills が列挙されているとき、エージェントは正しい Skills を選ぶか（または無関係なものを避けるか）？
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか？
- **ワークフロー契約:** ツール順序、セッション履歴の持ち越し、sandbox 境界を検証するマルチターンシナリオ。

将来の evals も、まずは決定論的であるべきです。

- モックプロバイダーを使って、ツール呼び出し + 順序、skill ファイル読み取り、セッション配線を検証する scenario runner。
- skill に焦点を当てた小規模なシナリオスイート（使う vs 避ける、gating、プロンプトインジェクション）。
- CI 安全なスイートが整ってからのみ、任意の live evals（オプトイン、env でゲート）。

## 契約テスト（Plugin とチャネルの形状）

契約テストは、登録されているすべての Plugin とチャネルが
そのインターフェース契約に準拠していることを検証します。発見されたすべての Plugin を反復し、形状と挙動に関する一連の検証を実行します。デフォルトの `pnpm test` unit レーンは、意図的にこれらの共有シームおよびスモークファイルをスキップします。共有チャネルまたはプロバイダーのサーフェスに触れたときは、契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な Plugin 形状（id、name、capabilities）
- **setup** - セットアップ ウィザード契約
- **session-binding** - セッションバインドの挙動
- **outbound-payload** - メッセージペイロード構造
- **inbound** - 受信メッセージ処理
- **actions** - チャネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/ロスター API
- **group-policy** - グループポリシー適用

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
- **shape** - Plugin 形状/インターフェース
- **wizard** - セットアップ ウィザード

### 実行タイミング

- plugin-sdk のエクスポートまたは subpath を変更した後
- チャネルまたはプロバイダー Plugin を追加または変更した後
- Plugin 登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## リグレッションの追加（ガイダンス）

live で見つかったプロバイダー/モデルの問題を修正したとき:

- 可能であれば、CI 安全なリグレッションを追加してください（モック/スタブプロバイダー、または正確なリクエスト形状変換のキャプチャ）
- 本質的に live 専用（レート制限、認証ポリシーなど）である場合は、live テストを狭く保ち、環境変数でオプトインにしてください
- バグを捕捉できる最小のレイヤーを対象にすることを優先してください:
  - プロバイダーのリクエスト変換/リプレイバグ → direct models テスト
  - Gateway のセッション/履歴/ツールパイプラインバグ → gateway live smoke または CI 安全な gateway モックテスト
- SecretRef 走査ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から各 SecretRef クラスごとに 1 つのサンプル対象を導出し、走査セグメントを含む exec id が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef 対象ファミリーを追加する場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは、未分類の対象 id に対して意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。
