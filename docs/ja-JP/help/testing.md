---
read_when:
    - ローカルまたは CI でのテストの実行
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway + エージェントの動作のデバッグ
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、および各テストでカバーされる内容'
title: テスト中
x-i18n:
    generated_at: "2026-04-23T15:00:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbec4996699577321116c94f60c01d205d7594ed41aca27c821f1c3d65a7dca3
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、小規模な Docker ランナー群があります。

このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートがカバーする内容（および意図的に _カバーしない_ 内容）
- 一般的なワークフロー（ローカル、push 前、デバッグ）で実行するコマンド
- live テストがどのように認証情報を検出し、モデル/プロバイダーを選択するか
- 実際のモデル/プロバイダーの問題に対する回帰テストの追加方法

## クイックスタート

普段は以下です。

- フルゲート（push 前に想定）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの、より高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接ファイルを指定する実行では、拡張機能/チャネルのパスも対象になりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復対応している場合は、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに手を加えたときや、追加の確信が必要なとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（モデル + Gateway のツール/画像プローブ）: `pnpm test:live`
- 単一の live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live モデル一括実行: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて、小さなファイル読み取り風のプローブも実行するようになりました。メタデータが `image` 入力を示すモデルでは、小さな画像ターンも実行します。プロバイダー障害を切り分ける際は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効化してください。
  - CI カバレッジ: 毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の `OpenClaw Release Checks` は、どちらも `include_live_suites: true` を付けて再利用可能な live/E2E ワークフローを呼び出します。これには、プロバイダーごとに分割された個別の Docker live モデル matrix ジョブが含まれます。
  - CI の絞り込み再実行では、`include_live_suites: true` および `live_models_only: true` を付けて `OpenClaw Live And E2E Checks (Reusable)` を dispatch してください。
  - 新しい高シグナルのプロバイダー secret を追加する場合は、`scripts/ci-hydrate-live-auth.sh` と `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`、およびその scheduled/release 呼び出し元にも追加してください。
- Moonshot/Kimi のコストスモーク: `MOONSHOT_API_KEY` を設定した状態で、`openclaw models list --provider moonshot --json` を実行し、その後 `moonshot/kimi-k2.6` に対して分離した `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` を実行します。JSON が Moonshot/K2.6 を報告しており、アシスタントの transcript に正規化済みの `usage.cost` が保存されていることを確認してください。

ヒント: 失敗しているケースが 1 つだけ必要な場合は、以下で説明する allowlist 環境変数を使って live テストを絞り込むことを優先してください。

## QA 専用ランナー

これらのコマンドは、QA-lab の実環境性が必要なときに、メインのテストスイートと並んで使います。

CI は専用ワークフローで QA Lab を実行します。`Parity gate` は一致する PR で、また手動 dispatch からモックプロバイダー付きで実行されます。`QA-Lab - All Lanes` は `main` に対して毎晩実行され、また手動 dispatch から、モック parity gate、live Matrix レーン、Convex 管理の live Telegram レーンを並列ジョブとして実行します。`OpenClaw Release Checks` は、リリース承認前に同じレーンを実行します。

- `pnpm openclaw qa suite`
  - リポジトリベースの QA シナリオをホスト上で直接実行します。
  - デフォルトでは、分離された Gateway ワーカーで複数の選択シナリオを並列実行します。`qa-channel` のデフォルト同時実行数は 4 です（選択されたシナリオ数の範囲内）。ワーカー数を調整するには `--concurrency <count>` を使い、従来の直列レーンにするには `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物だけ必要な場合は `--allow-failures` を使ってください。
  - `live-frontier`、`mock-openai`、`aimock` のプロバイダーモードをサポートします。`aimock` は、ローカルの AIMock ベースプロバイダーサーバーを起動し、シナリオ対応の `mock-openai` レーンを置き換えることなく、実験的なフィクスチャおよびプロトコルモックのカバレッジに使えます。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、ゲストで実用的なサポート対象の QA 認証入力を転送します: 環境変数ベースのプロバイダーキー、QA live プロバイダー設定パス、存在する場合の `CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるよう、リポジトリルート配下に維持する必要があります。
  - 通常の QA レポート + サマリーに加え、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き出します。
- `pnpm qa:lab:up`
  - オペレーター型の QA 作業向けに Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルインストールし、非対話の OpenAI API キーによるオンボーディングを実行し、デフォルトで Telegram を設定し、plugin の有効化で実行時依存関係がオンデマンドにインストールされることを確認し、doctor を実行し、モックされた OpenAI エンドポイントに対して 1 回のローカルエージェントターンを実行します。
  - 同じパッケージ済みインストールレーンを Discord で実行するには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使ってください。
- `pnpm test:docker:bundled-channel-deps`
  - 現在の OpenClaw ビルドを Docker で pack および install し、OpenAI が設定された状態で Gateway を起動し、その後、設定編集でバンドル済みチャネル/plugins を有効化します。
  - セットアップ検出によって未設定 plugin の実行時依存関係が存在しないままになり、最初に設定された Gateway または doctor 実行で各バンドル済み plugin の実行時依存関係がオンデマンドにインストールされ、2 回目の再起動ではすでに有効化済みの依存関係を再インストールしないことを確認します。
  - また、既知の古い npm ベースラインもインストールし、Telegram を有効化したうえで `openclaw update --tag <candidate>` を実行し、その候補版の更新後 doctor が、ハーネス側の postinstall 修復なしで、バンドル済みチャネルの実行時依存関係を修復することを確認します。
- `pnpm openclaw qa aimock`
  - ローカルの AIMock プロバイダーサーバーだけを起動し、直接的なプロトコルスモークテストを行います。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel homeserver に対して Matrix live QA レーンを実行します。
  - この QA ホストは現在 repo/dev 専用です。パッケージ化された OpenClaw インストールには `qa-lab` が含まれないため、`openclaw qa` は公開されません。
  - リポジトリチェックアウトでは、バンドル済みランナーを直接読み込むため、別途 plugin のインストール手順は不要です。
  - 一時的な Matrix ユーザー 3 人（`driver`、`sut`、`observer`）と 1 つのプライベートルームを用意し、その後、実際の Matrix plugin を SUT トランスポートとして使う QA Gateway 子プロセスを起動します。
  - デフォルトでは、固定された安定版 Tuwunel イメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使います。別のイメージをテストする必要がある場合は `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrix ではローカルで使い捨てユーザーを用意するため、共有 credential-source フラグは公開されません。
  - Matrix QA レポート、サマリー、observed-events 成果物、および結合された stdout/stderr 出力ログを `.artifacts/qa-e2e/...` 配下に書き出します。
- `pnpm openclaw qa telegram`
  - 環境変数から渡される driver および SUT ボットトークンを使って、実際のプライベートグループに対して Telegram live QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram chat id である必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。通常は env モードを使い、プール lease を使うには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物だけ必要な場合は `--allow-failures` を使ってください。
  - 同じプライベートグループ内に 2 つの異なるボットが必要であり、SUT ボットは Telegram ユーザー名を公開している必要があります。
  - 安定した bot-to-bot 観測のために、両方のボットで `@BotFather` の Bot-to-Bot Communication Mode を有効にし、driver ボットがグループ内のボットトラフィックを観測できるようにしてください。
  - Telegram QA レポート、サマリー、および observed-messages 成果物を `.artifacts/qa-e2e/...` 配下に書き出します。返信シナリオには、driver の送信リクエストから観測された SUT の返信までの RTT が含まれます。

live トランスポートレーンは、新しいトランスポートでずれが生じないよう、1 つの標準契約を共有します。

`qa-channel` は広範な合成 QA スイートのままであり、live トランスポートのカバレッジ matrix には含まれません。

| レーン | Canary | メンションゲーティング | Allowlist ブロック | トップレベル返信 | 再起動後の再開 | スレッドのフォローアップ | スレッド分離 | リアクション観測 | ヘルプコマンド |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex を介した共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA lab は Convex ベースのプールから排他的 lease を取得し、レーン実行中はその lease に heartbeat を送り、終了時に lease を解放します。

参考用 Convex プロジェクト scaffold:

- `qa/convex-credential-broker/`

必要な環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用の secret を 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数のデフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルト `ci`、それ以外では `maintainer`）

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` を設定すると、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使う必要があります。

メンテナー用の管理コマンド（プール add/remove/list）には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

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

Telegram kind のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正なペイロードを拒否します。

### QA へのチャネル追加

markdown QA システムにチャネルを追加するには、必要なものは正確に 2 つです。

1. そのチャネル用のトランスポートアダプター。
2. チャネル契約を検証するシナリオパック。

共有 `qa-lab` ホストでフローを担える場合は、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホストの仕組みを担当します。

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカーの並行実行
- 成果物の書き出し
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向け互換エイリアス

ランナー plugin はトランスポート契約を担当します。

- `openclaw qa <runner>` を共有 `qa` ルート配下にどのようにマウントするか
- そのトランスポート向けに Gateway をどのように設定するか
- 準備完了をどのように確認するか
- 受信イベントをどのように注入するか
- 送信メッセージをどのように観測するか
- transcript と正規化済みトランスポート状態をどのように公開するか
- トランスポートを使うアクションをどのように実行するか
- トランスポート固有のリセットまたはクリーンアップをどのように扱うか

新しいチャネルの最低採用基準は以下です。

1. 共有 `qa` ルートの所有者は `qa-lab` のままにする。
2. 共有 `qa-lab` ホスト境界上にトランスポートランナーを実装する。
3. トランスポート固有の仕組みはランナー plugin またはチャネルハーネス内に閉じ込める。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントする。  
   ランナー plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列を export する必要があります。  
   `runtime-api.ts` は軽量に保ち、遅延 CLI とランナー実行は別々の entrypoint の背後に置いてください。
5. テーマ別の `qa/scenarios/` ディレクトリ配下に markdown シナリオを作成または調整する。
6. 新しいシナリオには汎用シナリオヘルパーを使う。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格です。

- 振る舞いを `qa-lab` で 1 回だけ表現できるなら、`qa-lab` に置く。
- 振る舞いが 1 つのチャネルトランスポートに依存するなら、そのランナー plugin または plugin ハーネスに置く。
- シナリオが複数チャネルで使える新しい機能を必要とするなら、`suite.ts` にチャネル固有の分岐を追加するのではなく、汎用ヘルパーを追加する。
- 振る舞いが 1 つのトランスポートでのみ意味を持つなら、そのシナリオはトランスポート固有のままにし、それをシナリオ契約で明示する。

新しいシナリオ向けの推奨汎用ヘルパー名は以下です。

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

既存シナリオ向けの互換エイリアスも引き続き利用できます。対象には以下が含まれます。

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しいチャネル作業では汎用ヘルパー名を使ってください。  
互換エイリアスは、flag day 型の移行を避けるために存在しているのであって、新しいシナリオ作成の手本ではありません。

## テストスイート（どこで何が動くか）

スイートは「現実性が増していくもの」（そして flakiness/コストも増していくもの）として考えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 対象未指定の実行では `vitest.full-*.config.ts` shard セットを使い、並列スケジューリングのためにマルチプロジェクト shard をプロジェクト単位の設定へ展開することがあります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core/unit インベントリと、`vitest.unit.config.ts` でカバーされる許可済みの `ui` Node テスト
- 範囲:
  - 純粋な unit テスト
  - プロセス内 integration テスト（Gateway 認証、ルーティング、ツール、パース、設定）
  - 既知のバグに対する決定的な回帰テスト
- 想定:
  - CI で実行される
  - 実際のキーは不要
  - 高速かつ安定しているべき
- プロジェクトに関する注記:
  - 対象未指定の `pnpm test` は、1 つの巨大なネイティブルートプロジェクトプロセスではなく、12 個の小さな shard 設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行するようになりました。これにより、負荷の高いマシンでのピーク RSS が削減され、auto-reply/拡張機能の処理が無関係なスイートを圧迫するのを防ぎます。
  - `pnpm test --watch` は、マルチ shard の watch ループが現実的でないため、引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使います。
  - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリ指定を先にスコープ付きレーンへ振り分けるため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ではフルルートプロジェクト起動コストを払わずに済みます。
  - `pnpm test:changed` は、差分がルーティング可能なソース/テストファイルだけに触れている場合、変更された git パスを同じスコープ付きレーンに展開します。設定/セットアップの編集は、引き続き広いルートプロジェクト再実行にフォールバックします。
  - `pnpm check:changed` は、狭い範囲の作業に対する通常のスマートローカルゲートです。差分を core、core tests、extensions、extension tests、apps、docs、リリースメタデータ、tooling に分類し、対応する typecheck/lint/test レーンを実行します。公開 Plugin SDK と plugin-contract の変更には、拡張機能がそれらの core 契約に依存するため、拡張機能検証が含まれます。リリースメタデータのみのバージョン更新では、フルスイートではなく対象を絞った version/config/root-dependency チェックが実行され、トップレベルの version フィールド以外の package 変更を拒否するガードが入ります。
  - agents、commands、plugins、auto-reply ヘルパー、`plugin-sdk`、および同様の純粋なユーティリティ領域からの import が軽い unit テストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンを通ります。状態保持/ランタイム負荷の高いファイルは既存のレーンに残ります。
  - 一部の `plugin-sdk` および `commands` ヘルパーソースファイルでも、changed モード実行時に軽量レーン上の明示的な兄弟テストへマッピングするようになったため、ヘルパー編集でそのディレクトリ全体の重いスイートを再実行せずに済みます。
  - `auto-reply` には現在 3 つの専用バケットがあります: トップレベル core ヘルパー、トップレベルの `reply.*` integration テスト、および `src/auto-reply/reply/**` サブツリーです。これにより、最も重い reply ハーネス処理が軽量な status/chunk/token テストから切り離されます。
- Embedded runner に関する注記:
  - メッセージツール検出入力または Compaction ランタイムコンテキストを変更するときは、両レベルのカバレッジを維持してください。
  - 純粋なルーティング/正規化境界に対して、焦点を絞ったヘルパー回帰テストを追加してください。
  - さらに、embedded runner integration スイートも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、スコープ付き id と Compaction の挙動が実際の `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。ヘルパーだけのテストは、これらの integration パスの十分な代替にはなりません。
- プールに関する注記:
  - ベースの Vitest 設定は現在デフォルトで `threads` です。
  - 共有 Vitest 設定では `isolate: false` も固定され、ルートプロジェクト、e2e、live 設定全体で非分離ランナーを使います。
  - ルート UI レーンは `jsdom` セットアップと optimizer を維持しますが、現在は共有の非分離ランナー上でも動作します。
  - 各 `pnpm test` shard は、共有 Vitest 設定から同じ `threads` + `isolate: false` デフォルトを継承します。
  - 共有の `scripts/run-vitest.mjs` ランチャーは現在、Vitest 子 Node プロセスに対してデフォルトで `--no-maglev` も追加し、大規模なローカル実行中の V8 コンパイルの揺れを減らします。標準の V8 挙動と比較したい場合は `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
- 高速ローカル反復に関する注記:
  - `pnpm changed:lanes` は、差分がどのアーキテクチャレーンを引き起こすかを表示します。
  - pre-commit フックは staged の format/lint 後に `pnpm check:changed --staged` を実行するため、core のみのコミットは、公開された拡張機能向け契約に触れない限り拡張機能テストのコストを払いません。リリースメタデータのみのコミットは対象を絞った version/config/root-dependency レーンにとどまります。
  - まったく同じ staged 変更セットがすでに同等以上のゲートで検証済みであれば、`scripts/committer --fast "<message>" <files...>` を使って changed-scope フックの再実行だけをスキップできます。staged format/lint は引き続き実行されます。完了済みのゲートは handoff で明記してください。これは、分離された flaky なフック失敗を再実行し、スコープ付きの証拠で成功した場合にも許容されます。
  - `pnpm test:changed` は、変更されたパスが小さなスイートにきれいにマッピングされる場合、スコープ付きレーンを通ります。
  - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング挙動を保ちつつ、より高いワーカー上限で動作します。
  - ローカルのワーカー自動スケーリングは現在意図的に保守的であり、ホストのロードアベレージがすでに高い場合にも抑制されるため、デフォルトで複数の同時 Vitest 実行による悪影響が減ります。
  - ベースの Vitest 設定では、テスト配線が変更されたときに changed モードの再実行が正しくなるよう、プロジェクト/設定ファイルを `forceRerunTriggers` としてマークしています。
  - この設定は、サポート対象ホストでは `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効のまま維持します。直接プロファイリング用に明示的な 1 つのキャッシュ場所を使いたい場合は `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
- Perf-debug に関する注記:
  - `pnpm test:perf:imports` は Vitest の import 所要時間レポートと import 内訳出力を有効にします。
  - `pnpm test:perf:imports:changed` は同じプロファイリング表示を `origin/main` 以降に変更されたファイルへスコープします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、そのコミット差分に対してルーティングされた `test:changed` とネイティブルートプロジェクト経路を比較し、wall time と macOS の最大 RSS を出力します。
- `pnpm test:perf:changed:bench -- --worktree` は、変更済みファイル一覧を `scripts/test-projects.mjs` とルート Vitest 設定に通すことで、現在の未コミットツリーをベンチマークします。
  - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッドに対するメインスレッド CPU プロファイルを書き出します。
  - `pnpm test:perf:profile:runner` は、ファイル並列化を無効にした unit スイート向けに runner の CPU+heap プロファイルを書き出します。

### Stability（Gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、ワーカー 1 に固定
- 範囲:
  - デフォルトで diagnostics を有効にした実際の loopback Gateway を起動する
  - 診断イベント経路を通じて、合成 Gateway メッセージ、メモリ、大きなペイロードの churn を流し込む
  - Gateway WS RPC 経由で `diagnostics.stability` を問い合わせる
  - 診断安定性バンドルの永続化ヘルパーをカバーする
  - レコーダーが境界内に収まり、合成 RSS サンプルが圧力予算を下回り、セッションごとのキュー深度がゼロまで戻ることをアサートする
- 想定:
  - CI で安全、キー不要
  - 安定性回帰の追跡用の狭いレーンであり、完全な Gateway スイートの代替ではない

### E2E（Gateway スモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下のバンドル済み plugin E2E テスト
- ランタイムデフォルト:
  - リポジトリの他部分に合わせて、Vitest の `threads` と `isolate: false` を使います。
  - 適応型ワーカーを使います（CI: 最大 2、ローカル: デフォルト 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトで silent モードで実行します。
- 便利な上書き:
  - ワーカー数を強制する `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - 詳細なコンソール出力を再有効化する `OPENCLAW_E2E_VERBOSE=1`。
- 範囲:
  - 複数インスタンス Gateway のエンドツーエンド挙動
  - WebSocket/HTTP サーフェス、Node ペアリング、より重いネットワーキング
- 想定:
  - パイプラインで有効な場合は CI で実行される
  - 実際のキーは不要
  - unit テストより可動部分が多い（遅くなることがある）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- 範囲:
  - Docker 経由でホスト上に分離された OpenShell Gateway を起動します
  - 一時的なローカル Dockerfile から sandbox を作成します
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell バックエンドを検証します
  - sandbox fs bridge を通じて、リモート正規形のファイルシステム挙動を検証します
- 想定:
  - 明示的に有効化した場合のみであり、デフォルトの `pnpm test:e2e` 実行には含まれません
  - ローカルの `openshell` CLI と、動作する Docker デーモンが必要です
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使い、その後テスト Gateway と sandbox を破棄します
- 便利な上書き:
  - 広い e2e スイートを手動実行するときにこのテストを有効にする `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたはラッパースクリプトを指定する `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル済み plugin live テスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- 範囲:
  - 「このプロバイダー/モデルは、今日、実際の認証情報で本当に動くか？」
  - プロバイダーのフォーマット変更、ツール呼び出しの癖、認証の問題、レート制限の挙動を検出する
- 想定:
  - 設計上、CI で安定しない（実際のネットワーク、実際のプロバイダーポリシー、クォータ、障害）
  - お金がかかる / レート制限を消費する
  - 「全部」ではなく、対象を絞ったサブセットの実行を優先する
- live 実行では、足りない API キーを拾うために `~/.profile` を source します。
- デフォルトでは、live 実行でも引き続き `HOME` を分離し、設定/認証情報を一時的なテスト home にコピーするため、unit フィクスチャが実際の `~/.openclaw` を変更することはありません。
- live テストで意図的に実際の home ディレクトリを使う必要がある場合にのみ `OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードがデフォルトです: `[live] ...` の進捗出力は維持しますが、追加の `~/.profile` 通知を抑制し、Gateway の bootstrap ログ/Bonjour の雑音をミュートします。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーのローテーション（プロバイダー別）: `*_API_KEYS` をカンマ/セミコロン形式で設定するか、`*_API_KEY_1`、`*_API_KEY_2` を使います（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）。または live 専用上書きとして `OPENCLAW_LIVE_*_KEY` を使います。テストはレート制限応答時に再試行します。
- 進捗/Heartbeat 出力:
  - live スイートは現在、長いプロバイダー呼び出しが、Vitest のコンソールキャプチャが静かな場合でも動作中だとわかるよう、進捗行を stderr に出力します。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効にしているため、プロバイダー/Gateway の進捗行は live 実行中に即座にストリームされます。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

以下の判断表を使ってください。

- ロジック/テストを編集する: `pnpm test` を実行する（大きく変更した場合は `pnpm test:coverage` も）
- Gateway のネットワーキング / WS プロトコル / ペアリングに触れる: `pnpm test:e2e` も追加する
- 「ボットが落ちている」/ プロバイダー固有の障害 / ツール呼び出しをデバッグする: 対象を絞った `pnpm test:live` を実行する

## Live: Android Node 機能一括確認

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目的: 接続された Android Node が現在公開している **すべてのコマンド** を呼び出し、コマンド契約の挙動をアサートすること。
- 範囲:
  - 事前条件つき/手動セットアップ（このスイートはアプリのインストール/起動/ペアリングは行いません）。
  - 選択した Android Node に対する、コマンド単位の Gateway `node.invoke` 検証。
- 必要な事前セットアップ:
  - Android アプリがすでに Gateway に接続済みかつペアリング済みであること。
  - アプリがフォアグラウンドのままであること。
  - 成功を期待する機能に対して、権限/キャプチャ同意が付与されていること。
- 任意のターゲット上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細: [Android アプリ](/ja-JP/platforms/android)

## Live: モデルスモーク（プロファイルキー）

live テストは、障害を切り分けられるよう 2 層に分かれています。

- 「直接モデル」は、そのキーでプロバイダー/モデルがそもそも応答できるかを示します。
- 「Gateway スモーク」は、そのモデルに対して完全な Gateway+エージェントパイプライン（セッション、履歴、ツール、sandbox ポリシーなど）が動作するかを示します。

### レイヤー 1: 直接モデル補完（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目的:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って、認証情報を持っているモデルを選択する
  - モデルごとに小さな補完を実行する（必要に応じて対象回帰も）
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`、modern のエイリアス）を設定します。そうしないと `pnpm test:live` の焦点を Gateway スモークに保つためスキップされます
- モデル選択方法:
  - モダン allowlist を実行するには `OPENCLAW_LIVE_MODELS=modern`（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` はモダン allowlist のエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切り allowlist）
  - modern/all 一括実行はデフォルトで厳選された高シグナル上限を使います。網羅的なモダン一括実行には `OPENCLAW_LIVE_MAX_MODELS=0` を設定し、より小さい上限には正の数を設定してください。
- プロバイダー選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り allowlist）
- キーの取得元:
  - デフォルト: プロファイルストアと環境変数フォールバック
  - **プロファイルストアのみ** を強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定します
- これが存在する理由:
  - 「プロバイダー API が壊れている / キーが無効」と「Gateway エージェントパイプラインが壊れている」を切り分ける
  - 小さく分離された回帰を収める（例: OpenAI Responses/Codex Responses の推論リプレイ + ツール呼び出しフロー）

### レイヤー 2: Gateway + dev エージェントスモーク（`@openclaw` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目的:
  - プロセス内 Gateway を起動する
  - `agent:dev:*` セッションを作成/patch する（実行ごとにモデル上書き）
  - キー付きモデルを反復し、以下をアサートする:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが動作する（read プローブ）
    - 任意の追加ツールプローブ（exec+read プローブ）
    - OpenAI の回帰パス（ツール呼び出しのみ → フォローアップ）が動作し続ける
- プローブ詳細（障害をすばやく説明できるように）:
  - `read` プローブ: テストがワークスペースに nonce ファイルを書き込み、エージェントにそれを `read` して nonce をそのまま返すよう求めます。
  - `exec+read` プローブ: テストがエージェントに、一時ファイルへ nonce を `exec` で書き込み、その後それを `read` で読み戻すよう求めます。
  - image プローブ: テストが生成した PNG（猫 + ランダムコード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`。
- 有効化方法:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
- モデル選択方法:
  - デフォルト: モダン allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` はモダン allowlist のエイリアスです
  - または絞り込みのために `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定します
  - modern/all Gateway 一括実行はデフォルトで厳選された高シグナル上限を使います。網羅的なモダン一括実行には `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を設定し、より小さい上限には正の数を設定してください。
- プロバイダー選択方法（「OpenRouter の全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り allowlist）
- この live テストではツール + 画像プローブは常時有効です:
  - `read` プローブ + `exec+read` プローブ（ツール負荷テスト）
  - image プローブは、モデルが画像入力サポートを公開している場合に実行されます
  - フロー（概要）:
    - テストが「CAT」+ ランダムコードの小さな PNG を生成します（`src/gateway/live-image-probe.ts`）
    - それを `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信します
    - Gateway は添付ファイルを `images[]` にパースします（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded エージェントがマルチモーダルなユーザーメッセージをモデルへ転送します
    - アサーション: 返信に `cat` + そのコードが含まれます（OCR 許容: 軽微なミスは許容）

ヒント: 自分のマシンで何をテストできるか（および正確な `provider/model` id）を確認するには、以下を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI バックエンドスモーク（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目的: デフォルト設定には触れずに、ローカル CLI バックエンドを使って Gateway + エージェントパイプラインを検証すること。
- バックエンド固有のスモークデフォルトは、所有する拡張機能の `cli-backend.ts` 定義にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼ぶ場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルトのプロバイダー/モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド/引数/画像挙動は、所有する CLI バックエンド plugin メタデータから取得されます。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の画像添付を送る `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスはプロンプトに注入されます）。
  - プロンプト注入の代わりに画像ファイルパスを CLI 引数として渡す `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されているときに、画像引数の渡し方を制御する `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 回目のターンを送り、resume フローを検証する `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - デフォルトの Claude Sonnet -> Opus 同一セッション継続性プローブを無効にする `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択したモデルが切り替え先をサポートしているときに強制有効化するには `1` を設定）。

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

単一プロバイダー向け Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注記:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これはリポジトリの Docker イメージ内で、非 root の `node` ユーザーとして live CLI バックエンドスモークを実行します。
- 所有拡張機能から CLI スモークメタデータを解決し、その後、対応する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、`OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）のキャッシュされた書き込み可能プレフィックスにインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` では、`~/.claude/.credentials.json` にある `claudeAiOauth.subscriptionType` 付きのポータブル Claude Code subscription OAuth、または `claude setup-token` の `CLAUDE_CODE_OAUTH_TOKEN` が必要です。まず Docker 内で直接 `claude -p` を検証し、その後 Anthropic API キー環境変数を保持せずに 2 回の Gateway CLI バックエンドターンを実行します。この subscription レーンでは、Claude が現在、通常の subscription プラン制限ではなく追加使用量課金経由でサードパーティアプリ使用を処理するため、Claude MCP/ツールおよび image プローブはデフォルトで無効化されます。
- live CLI バックエンドスモークは現在、Claude、Codex、Gemini に対して同じエンドツーエンドフローを検証します: テキストターン、画像分類ターン、その後 Gateway CLI 経由で検証される MCP `cron` ツール呼び出し。
- Claude のデフォルトスモークでは、セッションを Sonnet から Opus へ patch し、再開されたセッションが以前のメモを引き続き記憶していることも検証します。

## Live: ACP bind スモーク（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目的: live ACP エージェントを使って、実際の ACP conversation-bind フローを検証すること:
  - `/acp spawn <agent> --bind here` を送る
  - 合成メッセージチャネル会話をその場で bind する
  - 同じ会話上で通常のフォローアップを送る
  - フォローアップが bind 済み ACP セッション transcript に入ることを検証する
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
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- 注記:
  - このレーンは、管理者専用の合成 originating-route フィールド付きの Gateway `chat.send` サーフェスを使うため、テストは外部配信を装わずにメッセージチャネルコンテキストを付与できます。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、このテストは選択した ACP ハーネスエージェントに対して、組み込みの `acpx` plugin の内蔵エージェントレジストリを使います。

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

単一エージェント向け Docker レシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker に関する注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、サポートされているすべての live CLI エージェントに対して順番に ACP bind スモークを実行します: `claude`、`codex`、その後 `gemini`。
- matrix を絞り込むには、`OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` を使ってください。
- これは `~/.profile` を source し、一致する CLI 認証情報をコンテナに stage し、`acpx` を書き込み可能な npm プレフィックスにインストールし、その後、必要であれば要求された live CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）をインストールします。
- Docker 内では、ランナーは `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定するため、acpx は source 済み profile のプロバイダー環境変数を子ハーネス CLI から引き続き利用できます。

## Live: Codex app-server ハーネススモーク

- 目的: 通常の Gateway `agent` メソッドを通じて、plugin が所有する Codex ハーネスを検証すること:
  - バンドル済み `codex` plugin を読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - `codex/gpt-5.4` に最初の Gateway エージェントターンを送る
  - 同じ OpenClaw セッションに 2 回目のターンを送り、app-server スレッドが再開できることを検証する
  - 同じ Gateway コマンド経路を通じて `/codex status` と `/codex models` を実行する
  - 必要に応じて、Guardian レビュー付きの昇格シェルプローブを 2 つ実行する: 承認されるべき無害なコマンド 1 つと、拒否されてエージェントが再確認を求めるべき偽の secret upload 1 つ
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `codex/gpt-5.4`
- 任意の image プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/ツールプローブ: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- 任意の Guardian プローブ: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- このスモークでは `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れた Codex ハーネスが PI への無言フォールバックで通過することはありません。
- 認証: シェル/profile の `OPENAI_API_KEY` に加え、存在する場合は `~/.codex/auth.json` と `~/.codex/config.toml` もコピーされます

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

Docker レシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker に関する注記:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- これはマウントされた `~/.profile` を source し、`OPENAI_API_KEY` を渡し、存在する場合は Codex CLI 認証ファイルをコピーし、`@openai/codex` を書き込み可能なマウント済み npm プレフィックスにインストールし、ソースツリーを stage してから、Codex ハーネス live テストだけを実行します。
- Docker では image、MCP/ツール、Guardian の各プローブがデフォルトで有効です。より狭いデバッグ実行が必要な場合は、`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`、`OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`、または `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` を設定してください。
- Docker でも live テスト設定に合わせて `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を export するため、`openai-codex/*` や PI へのフォールバックが Codex ハーネスの回帰を隠すことはありません。

### 推奨 live レシピ

狭く、明示的な allowlist が最も高速で、flaky も少なくなります。

- 単一モデル、直接（Gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、Gateway スモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがるツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 集中（Gemini API キー + Antigravity）:
  - Gemini（API キー）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注記:

- `google/...` は Gemini API（API キー）を使います。
- `google-antigravity/...` は Antigravity OAuth ブリッジ（Cloud Code Assist 風のエージェントエンドポイント）を使います。
- `google-gemini-cli/...` はマシン上のローカル Gemini CLI を使います（認証とツール挙動の癖は別です）。
- Gemini API と Gemini CLI:
  - API: OpenClaw は Google がホストする Gemini API を HTTP 経由で呼びます（API キー / プロファイル認証）。多くのユーザーが「Gemini」と言うとき、通常はこちらを指します。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル経由で実行します。独自の認証を持ち、挙動も異なることがあります（ストリーミング/ツールサポート/バージョン差異）。

## Live: モデル matrix（何をカバーするか）

固定の「CI モデル一覧」はありません（live はオプトインです）が、これらはキーを持つ開発マシン上で定期的にカバーすることを **推奨** するモデルです。

### モダンスモークセット（ツール呼び出し + 画像）

これは、動作し続けることを期待する「一般的なモデル」実行です。

- OpenAI（非 Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ツール + 画像付きで Gateway スモークを実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: ツール呼び出し（Read + 任意の Exec）

各プロバイダーファミリーから少なくとも 1 つ選んでください。

- OpenAI: `openai/gpt-5.4`（または `openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あるとよい）:

- xAI: `xai/grok-4`（または利用可能な最新版）
- Mistral: `mistral/`…（有効化済みの「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセス権がある場合）
- LM Studio: `lmstudio/`…（ローカル; ツール呼び出しは API モードに依存）

### Vision: 画像送信（添付ファイル → マルチモーダルメッセージ）

画像プローブを検証するために、少なくとも 1 つの画像対応モデルを `OPENCLAW_LIVE_GATEWAY_MODELS` に含めてください（Claude/Gemini/OpenAI の画像対応バリアントなど）。

### Aggregators / 代替 Gateway

キーが有効なら、以下経由のテストもサポートしています。

- OpenRouter: `openrouter/...`（数百のモデル; `openclaw models scan` を使ってツール + 画像対応候補を見つけてください）
- OpenCode: Zen 向け `opencode/...` と Go 向け `opencode-go/...`（認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

認証情報/設定があれば、live matrix に追加できるその他のプロバイダー:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers` 経由（カスタムエンドポイント）: `minimax`（クラウド/API）、および OpenAI/Anthropic 互換プロキシ全般（LM Studio、vLLM、LiteLLM など）

ヒント: ドキュメントで「全モデル」をハードコードしようとしないでください。正式な一覧は、あなたのマシンで `discoverModels(...)` が返すものと、利用可能なキーの組み合わせです。

## 認証情報（絶対にコミットしない）

live テストは、CLI と同じ方法で認証情報を検出します。実際上の意味は以下です。

- CLI が動くなら、live テストも同じキーを見つけられるはずです。
- live テストが「認証情報なし」と言うなら、`openclaw models list` / モデル選択をデバッグするときと同じ方法で調査してください。

- エージェントごとの認証プロファイル: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（live テストでいう「プロファイルキー」はこれを意味します）
- 設定: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- 旧 state ディレクトリ: `~/.openclaw/credentials/`（存在する場合は stage 済み live home にコピーされますが、メインのプロファイルキーストアではありません）
- ローカルの live 実行では、デフォルトでアクティブ設定、エージェントごとの `auth-profiles.json`、旧 `credentials/`、およびサポート対象の外部 CLI 認証ディレクトリを一時的なテスト home にコピーします。stage 済み live home では `workspace/` と `sandboxes/` はスキップされ、`agents.*.workspace` / `agentDir` のパス上書きは取り除かれるため、プローブが実際のホスト workspace に触れません。

環境変数キー（たとえば `~/.profile` で export したもの）に依存したい場合は、`source ~/.profile` の後にローカルテストを実行するか、以下の Docker ランナーを使ってください（コンテナ内に `~/.profile` をマウントできます）。

## Deepgram live（音声文字起こし）

- テスト: `extensions/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- テスト: `extensions/byteplus/live.test.ts`
- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- テスト: `extensions/comfy/comfy.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- 範囲:
  - バンドル済み comfy の画像、動画、および `music_generate` パスを検証します
  - `models.providers.comfy.<capability>` が設定されていない限り、各機能をスキップします
  - comfy ワークフロー送信、ポーリング、ダウンロード、または plugin 登録を変更した後に有用です

## 画像生成 live

- テスト: `test/image-generation.runtime.live.test.ts`
- コマンド: `pnpm test:live test/image-generation.runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- 範囲:
  - 登録されているすべての画像生成プロバイダー plugin を列挙します
  - プローブ前に、ログインシェル（`~/.profile`）から不足しているプロバイダー環境変数を読み込みます
  - デフォルトでは、保存済み認証プロファイルよりも live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーはスキップします
  - 共有 runtime capability を通じて標準の画像生成バリアントを実行します:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされているバンドル済みプロバイダー:
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
- 任意の認証動作:
  - プロファイルストア認証を強制し、env のみの上書きを無視する `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 音楽生成 live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- 範囲:
  - 共有のバンドル済み音楽生成プロバイダーパスを検証します
  - 現在は Google と MiniMax をカバーしています
  - プローブ前に、ログインシェル（`~/.profile`）からプロバイダー環境変数を読み込みます
  - デフォルトでは、保存済み認証プロファイルよりも live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーはスキップします
  - 利用可能な場合は、宣言された両方の runtime モードを実行します:
    - プロンプトのみ入力の `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンカバレッジ:
    - `google`: `generate`、`edit`
    - `minimax`: `generate`
    - `comfy`: 別の Comfy live ファイルであり、この共有一括実行ではありません
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意の認証動作:
  - プロファイルストア認証を強制し、env のみの上書きを無視する `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 動画生成 live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- 範囲:
  - 共有のバンドル済み動画生成プロバイダーパスを検証します
  - デフォルトではリリース安全なスモークパスを使います: 非 FAL プロバイダー、各プロバイダーあたり 1 回の text-to-video リクエスト、1 秒のロブスタープロンプト、および `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 由来のプロバイダーごとの操作上限（デフォルト `180000`）
  - FAL は、プロバイダー側キュー待ち時間がリリース時間を支配する可能性があるため、デフォルトでスキップされます。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - プローブ前に、ログインシェル（`~/.profile`）からプロバイダー環境変数を読み込みます
  - デフォルトでは、保存済み認証プロファイルよりも live/env API キーを優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を覆い隠しません
  - 利用可能な認証/プロファイル/モデルがないプロバイダーはスキップします
  - デフォルトでは `generate` のみを実行します
  - 利用可能な場合に宣言済みの transform モードも実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有一括実行でバッファベースのローカル画像入力を受け付ける場合の `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有一括実行でバッファベースのローカル動画入力を受け付ける場合の `videoToVideo`
  - 現在、共有一括実行で宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - バンドル済み `veo3` は text-only で、バンドル済み `kling` はリモート画像 URL を必要とするため `vydra`
  - プロバイダー固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは `veo3` の text-to-video に加え、デフォルトでリモート画像 URL fixture を使う `kling` レーンを実行します
  - 現在の `videoToVideo` live カバレッジ:
    - 選択モデルが `runway/gen4_aleph` の場合のみ `runway`
  - 現在、共有一括実行で宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - これらのパスが現在リモート `http(s)` / MP4 参照 URL を必要とするため `alibaba`、`qwen`、`xai`
    - 現在の共有 Gemini/Veo レーンがローカルのバッファベース入力を使っており、そのパスが共有一括実行では受け付けられないため `google`
    - 現在の共有レーンには org 固有の動画 inpaint/remix アクセス保証がないため `openai`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルト一括実行に FAL を含むすべてのプロバイダーを含める `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 攻めたスモーク実行向けに各プロバイダーの操作上限を下げる `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の認証動作:
  - プロファイルストア認証を強制し、env のみの上書きを無視する `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## メディア live ハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の画像、音楽、動画 live スイートを、リポジトリ標準の 1 つの entrypoint から実行します
  - `~/.profile` から不足しているプロバイダー環境変数を自動で読み込みます
  - デフォルトで、現在利用可能な認証を持つプロバイダーに各スイートを自動的に絞り込みます
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と quiet-mode の挙動が一貫します
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker ランナー（任意の「Linux で動く」確認）

これらの Docker ランナーは 2 つのバケットに分かれます。

- live モデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリ Docker イメージ内で対応するプロファイルキー live ファイルのみを実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。対応するローカル entrypoint は `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live ランナーは、フル Docker 一括実行を現実的に保つため、より小さなスモーク上限をデフォルトにしています:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、`test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、`OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、`OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を使います。より大きな網羅的スキャンを明示的に望む場合は、それらの環境変数を上書きしてください。
- `test:docker:all` は、まず `test:docker:live-build` 経由で live Docker イメージを 1 回ビルドし、その後 2 つの live Docker レーンで再利用します。また、`test:docker:e2e-build` 経由で共有の `scripts/e2e/Dockerfile` イメージを 1 回ビルドし、ビルド済みアプリを検証する E2E コンテナスモークランナーで再利用します。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:gateway-network`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、および `test:docker:config-reload` は、1 つ以上の実コンテナを起動し、より高レベルの integration パスを検証します。

live モデル Docker ランナーは、必要な CLI 認証 home のみ（または実行が絞り込まれていない場合はサポート対象すべて）を bind mount し、その後、外部 CLI OAuth がホストの認証ストアを変更せずにトークン更新できるよう、実行前にコンテナ home にコピーします。

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind スモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev エージェント: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live スモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全スキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- npm tarball のオンボーディング/チャネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、pack 済み OpenClaw tarball を Docker 内でグローバルインストールし、env-ref オンボーディング経由で OpenAI を設定し、デフォルトで Telegram も設定し、plugin を有効化すると実行時依存関係がオンデマンドでインストールされることを確認し、doctor を実行し、モックされた OpenAI エージェントターンを 1 回実行します。事前ビルド済み tarball を再利用するには `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、新しいローカルビルド後にホスト再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`、チャネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使ってください。
- Gateway ネットワーキング（2 コンテナ、WS 認証 + ヘルス）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- OpenAI Responses の `web_search` 最小推論回帰: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、モックされた OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後プロバイダー schema の reject を強制して、生の詳細が Gateway ログに現れることを確認します。
- MCP チャネルブリッジ（シード済み Gateway + stdio bridge + 生の Claude notification-frame スモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Pi バンドル MCP ツール（実際の stdio MCP サーバー + embedded Pi profile の許可/拒否スモーク）: `pnpm test:docker:pi-bundle-mcp-tools`（スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP クリーンアップ（実際の Gateway + 分離された cron および one-shot subagent 実行後の stdio MCP 子プロセス終了処理）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugins（インストールスモーク + `/plugin` エイリアス + Claude バンドル再起動セマンティクス）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
- Plugin update unchanged スモーク: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- Config reload メタデータスモーク: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- バンドル済み plugin 実行時依存関係: `pnpm test:docker:bundled-channel-deps` は、デフォルトで小さな Docker ランナーイメージをビルドし、ホスト上で OpenClaw を 1 回だけビルドおよび pack し、その tarball を各 Linux インストールシナリオにマウントします。イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`、新しいローカルビルド後のホスト再ビルドをスキップするには `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`、既存 tarball を指定するには `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使ってください。
- 反復中に無関係なシナリオを無効化して、バンドル済み plugin 実行時依存関係を狭く絞り込めます。たとえば:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`

共有のビルド済みアプリイメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きは、設定されている場合は引き続きそちらが優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルに存在しなければ pull します。QR と installer の Docker テストは、共有のビルド済みアプリ runtime ではなく package/install の挙動を検証するため、独自の Dockerfile を維持しています。

live モデル Docker ランナーは、現在のチェックアウトを read-only で bind mount し、コンテナ内の一時 workdir に stage もします。これにより、runtime イメージをスリムに保ちながら、正確にあなたのローカルソース/設定に対して Vitest を実行できます。stage 手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、およびアプリローカルの `.build` や Gradle 出力ディレクトリのような、大きなローカル専用キャッシュやアプリビルド出力をスキップするため、Docker live 実行でマシン固有の成果物コピーに何分も費やしません。
また、これらは `OPENCLAW_SKIP_CHANNELS=1` も設定するため、Gateway の live プローブはコンテナ内で実際の Telegram/Discord などのチャネルワーカーを起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンから Gateway live カバレッジを絞り込んだり除外したりしたい場合は、`OPENCLAW_LIVE_GATEWAY_*` も併せて渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした OpenClaw Gateway コンテナを起動し、その Gateway に対して固定版の Open WebUI コンテナを起動し、Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを確認し、その後、Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
初回実行は、Docker が Open WebUI イメージを pull する必要があったり、Open WebUI 自身のコールドスタート設定を完了する必要があるため、目に見えて遅くなることがあります。
このレーンは利用可能な live モデルキーを必要とし、Docker 化された実行でそれを提供する主な方法は `OPENCLAW_PROFILE_FILE`（デフォルト `~/.profile`）です。
成功した実行では `{ "ok": true, "model": "openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の Telegram、Discord、または iMessage アカウントを必要としません。seed 済み Gateway コンテナを起動し、`openclaw mcp serve` を起動する 2 つ目のコンテナを開始し、その後、ルーティング済み会話検出、transcript 読み取り、添付メタデータ、live イベントキュー挙動、送信 send ルーティング、および実際の stdio MCP ブリッジ上の Claude 風チャネル + 権限通知を検証します。通知チェックは生の stdio MCP フレームを直接検査するため、このスモークは特定のクライアント SDK がたまたま表面化する内容ではなく、ブリッジが実際に送出するものを検証します。
`test:docker:pi-bundle-mcp-tools` は決定的で、live モデルキーを必要としません。リポジトリ Docker イメージをビルドし、コンテナ内で実際の stdio MCP プローブサーバーを起動し、そのサーバーを embedded Pi bundle MCP runtime 経由で具現化し、ツールを実行し、その後 `coding` と `messaging` が `bundle-mcp` ツールを維持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらを除外することを検証します。
`test:docker:cron-mcp-cleanup` は決定的で、live モデルキーを必要としません。実際の stdio MCP プローブサーバー付きの seed 済み Gateway を起動し、分離された cron ターンと `/subagents spawn` の one-shot 子ターンを実行し、その後各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP plain-language thread スモーク（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

便利な環境変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）を `/home/node/.openclaw` にマウント
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）を `/home/node/.openclaw/workspace` にマウント
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）を `/home/node/.profile` にマウントし、テスト実行前に source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` で、`OPENCLAW_PROFILE_FILE` から source した環境変数のみを検証します。この場合、一時的な config/workspace ディレクトリを使い、外部 CLI 認証マウントは行いません
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）を `/home/node/.npm-global` にマウントし、Docker 内の CLI インストールをキャッシュ
- `$HOME` 配下の外部 CLI 認証ディレクトリ/ファイルは `/host-auth...` 配下に read-only でマウントされ、その後テスト開始前に `/home/node/...` にコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推論された必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きできます
- 実行を絞り込む `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内でプロバイダーを絞り込む `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 再ビルド不要の再実行で既存の `openclaw:local-live` イメージを再利用する `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報がプロファイルストア由来であることを保証する `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（env 由来ではない）
- Open WebUI スモーク向けに Gateway が公開するモデルを選ぶ `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI スモークで使う nonce チェックプロンプトを上書きする `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定版 Open WebUI イメージタグを上書きする `OPENWEBUI_IMAGE=...`

## ドキュメント健全性確認

ドキュメント編集後は docs チェックを実行してください: `pnpm check:docs`。  
ページ内見出しチェックも必要な場合は、完全な Mintlify アンカー検証を実行してください: `pnpm docs:check-links:anchors`。

## オフライン回帰（CI 安全）

これらは、実際のプロバイダーなしで行う「実際のパイプライン」回帰です。

- Gateway ツール呼び出し（モック OpenAI、実際の Gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定 + 認証書き込みを強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性 evals（Skills）

すでにいくつかの CI 安全なテストがあり、「エージェント信頼性 eval」のように振る舞います。

- 実際の Gateway + エージェントループを通したモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills に関してまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **Decisioning:** Skills がプロンプトに列挙されたとき、エージェントは正しい Skill を選ぶか（または無関係なものを避けるか）？
- **Compliance:** エージェントは使用前に `SKILL.md` を読み、必須の手順/引数に従うか？
- **Workflow contracts:** ツール順序、セッション履歴の引き継ぎ、sandbox 境界をアサートするマルチターンシナリオ。

今後の eval は、まず決定的であるべきです。

- モックプロバイダーを使い、ツール呼び出し + 順序、Skill ファイル読み取り、セッション配線をアサートするシナリオランナー。
- Skill に焦点を当てた小さなシナリオ群（使う/使わない、ゲーティング、プロンプトインジェクション）。
- CI 安全スイートが整った後にのみ、任意の live eval（オプトイン、env gated）。

## 契約テスト（plugin およびチャネル形状）

契約テストは、登録されているすべての plugin とチャネルが、そのインターフェース契約に適合していることを検証します。検出されたすべての plugin を反復し、形状と挙動に関する一連のアサーションを実行します。デフォルトの `pnpm test` unit レーンでは、これらの共有 seam とスモークファイルは意図的にスキップされるため、共有チャネルまたはプロバイダー surface に触れた場合は、契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な plugin 形状（id、name、capabilities）
- **setup** - セットアップウィザード契約
- **session-binding** - セッション bind の挙動
- **outbound-payload** - メッセージ payload 構造
- **inbound** - 受信メッセージ処理
- **actions** - チャネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/roster API
- **group-policy** - グループポリシー適用

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャネルステータスプローブ
- **registry** - plugin レジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証選択
- **catalog** - モデルカタログ API
- **discovery** - plugin 検出
- **loader** - plugin 読み込み
- **runtime** - プロバイダー runtime
- **shape** - plugin 形状/インターフェース
- **wizard** - セットアップウィザード

### 実行すべきタイミング

- plugin-sdk の export または subpath を変更した後
- チャネルまたはプロバイダー plugin を追加または変更した後
- plugin 登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは必要ありません。

## 回帰の追加（ガイダンス）

live で見つかったプロバイダー/モデルの問題を修正するとき:

- 可能なら CI 安全な回帰を追加してください（モック/スタブプロバイダー、または正確なリクエスト形状変換の捕捉）
- 本質的に live 専用なら（レート制限、認証ポリシー）、live テストは狭く保ち、env vars でオプトインにしてください
- バグを検出できる最小のレイヤーを狙うことを優先してください:
  - プロバイダーのリクエスト変換/リプレイバグ → 直接モデルテスト
  - Gateway セッション/履歴/ツールパイプラインのバグ → Gateway live スモークまたは CI 安全な Gateway モックテスト
- SecretRef traversal ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとに 1 つのサンプルターゲットを導出し、traversal-segment exec id が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef ターゲットファミリーを追加した場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは、未分類の target id に対して意図的に失敗するため、新しいクラスを黙ってスキップすることはできません。
