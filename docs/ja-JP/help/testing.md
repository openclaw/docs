---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対するリグレッションテストを追加する
    - Gateway + エージェントの動作をデバッグする
summary: 'テストキット: unit/e2e/live スイート、Docker ランナー、および各テストがカバーする内容'
title: テスト
x-i18n:
    generated_at: "2026-04-15T04:43:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf647a5cf13b5861a3ba0cb367dc816c57f0e9c60d3cd6320da193bfadf5609
    source_path: help/testing.md
    workflow: 15
---

# テスト

OpenClaw には 3 つの Vitest スイート（unit/integration、e2e、live）と、少数の Docker ランナーがあります。

このドキュメントは「どのようにテストするか」のガイドです。

- 各スイートが何をカバーするか（そして意図的に _何をカバーしないか_）
- 一般的なワークフロー（ローカル、push 前、デバッグ）でどのコマンドを実行するか
- live テストがどのように認証情報を見つけ、モデル/プロバイダーを選択するか
- 実際のモデル/プロバイダー問題に対するリグレッションテストを追加する方法

## クイックスタート

たいていの日は次で十分です。

- フルゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm test`
- 余裕のあるマシンでのより高速なローカル全スイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接のファイル指定は、extension/channel パスにも対応するようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復しているときは、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに手を入れたときや、追加の確信が欲しいときは次を使います。

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（models + Gateway tool/image probes）: `pnpm test:live`
- 1 つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

ヒント: 必要なのが 1 つの失敗ケースだけなら、以下で説明する allowlist 環境変数で live テストを絞り込むことを優先してください。

## QA 固有ランナー

これらのコマンドは、QA-lab の現実性が必要なときに、メインのテストスイートと並んで使います。

- `pnpm openclaw qa suite`
  - リポジトリベースの QA シナリオをホスト上で直接実行します。
  - デフォルトでは、分離された Gateway ワーカーを使って、選択した複数のシナリオを並列実行します。最大 64 ワーカー、または選択されたシナリオ数までです。`--concurrency <count>` でワーカー数を調整するか、以前の直列レーンとして `--concurrency 1` を使用します。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを、一時的な Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、ゲストで実用的な、サポート対象の QA 認証入力を転送します:
    環境変数ベースのプロバイダーキー、QA live provider config パス、存在する場合は `CODEX_HOME`。
  - 出力ディレクトリは、ゲストがマウントされたワークスペース経由で書き戻せるように、リポジトリルート配下にとどめる必要があります。
  - 通常の QA レポート + サマリーに加えて、Multipass ログを `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター型の QA 作業向けに Docker ベースの QA サイトを起動します。
- `pnpm openclaw qa matrix`
  - Matrix live QA レーンを、一時的な Docker ベースの Tuwunel homeserver に対して実行します。
  - この QA ホストは現在 repo/dev 専用です。パッケージ化された OpenClaw インストールには `qa-lab` が同梱されないため、`openclaw qa` は公開されません。
  - リポジトリチェックアウトでは、同梱ランナーを直接読み込みます。別途 plugin のインストール手順は不要です。
  - 3 つの一時 Matrix ユーザー（`driver`、`sut`、`observer`）と 1 つのプライベートルームをプロビジョニングし、その後、実際の Matrix Plugin を SUT transport として使う QA Gateway 子プロセスを起動します。
  - デフォルトでは、固定された安定版 Tuwunel イメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1` を使用します。別のイメージをテストする必要がある場合は、`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きしてください。
  - Matrix では、ローカルで一時ユーザーをプロビジョニングするため、共有 credential-source フラグは公開されていません。
  - Matrix QA レポート、サマリー、および observed-events artifact を `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm openclaw qa telegram`
  - env の driver および SUT bot token を使って、実際のプライベートグループに対して Telegram live QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group id は数値の Telegram chat id である必要があります。
  - 共有プール認証情報用に `--credential-source convex` をサポートします。デフォルトでは env モードを使い、プールされたリースを使う場合は `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。
  - 同じプライベートグループにいる 2 つの異なる bot が必要で、SUT bot は Telegram username を公開している必要があります。
  - bot 間観測を安定させるには、両方の bot で `@BotFather` の Bot-to-Bot Communication Mode を有効にし、driver bot がグループ内 bot トラフィックを観測できるようにしてください。
  - Telegram QA レポート、サマリー、および observed-messages artifact を `.artifacts/qa-e2e/...` 配下に書き込みます。

live transport レーンは、新しい transport が逸脱しないよう、1 つの標準コントラクトを共有します。

`qa-channel` は引き続き広範な合成 QA スイートであり、live
transport カバレッジマトリクスの一部ではありません。

| Lane     | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Convex 経由の共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）を有効にすると、QA lab は Convex ベースのプールから排他的リースを取得し、レーンの実行中はそのリースに対して Heartbeat を送り、終了時にリースを解放します。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必要な環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用のシークレット 1 つ:
  - `maintainer` 用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用 `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数のデフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（デフォルトは `maintainer`）

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意の trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

通常運用では `OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用してください。

maintainer の管理コマンド（プール add/remove/list）には、
特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

maintainer 向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

スクリプトや CI ユーティリティで機械可読な出力が必要な場合は `--json` を使ってください。

デフォルトのエンドポイントコントラクト（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

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
  - アクティブリースガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（maintainer secret のみ）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram kind の payload 形式:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram chat id 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形式を検証し、不正な payload を拒否します。

### QA にチャネルを追加する

markdown QA システムにチャネルを追加するには、厳密に 2 つのものが必要です。

1. そのチャネル用の transport adapter。
2. チャネルコントラクトを実行する scenario pack。

共有 `qa-lab` ホストでフローを扱える場合、新しい最上位 QA コマンドルートを追加してはいけません。

`qa-lab` は共有ホスト機構を担当します。

- `openclaw qa` コマンドルート
- スイートの起動と終了
- ワーカー並行性
- artifact 書き込み
- レポート生成
- シナリオ実行
- 旧 `qa-channel` シナリオ向け互換エイリアス

runner plugin は transport コントラクトを担当します。

- どのように `openclaw qa <runner>` を共有 `qa` ルートの下にマウントするか
- その transport 向けに Gateway をどう設定するか
- readiness をどう確認するか
- inbound event をどう注入するか
- outbound message をどう観測するか
- transcript と正規化された transport state をどう公開するか
- transport ベースのアクションをどう実行するか
- transport 固有のリセットやクリーンアップをどう扱うか

新しいチャネルに求められる最小限の採用基準は次のとおりです。

1. 共有 `qa` ルートの所有者は `qa-lab` のままにする。
2. transport runner を共有 `qa-lab` ホストシーム上に実装する。
3. transport 固有の仕組みは runner plugin または channel harness 内に保持する。
4. 競合するルートコマンドを登録するのではなく、runner を `openclaw qa <runner>` としてマウントする。  
   runner plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から一致する `qaRunnerCliRegistrations` 配列を export する必要があります。  
   `runtime-api.ts` は軽量に保ってください。遅延 CLI および runner 実行は、別の entrypoint の背後に置く必要があります。
5. `qa/scenarios/` 配下で markdown シナリオを作成または適応する。
6. 新しいシナリオには汎用シナリオヘルパーを使う。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスは動作し続けるようにする。

判断ルールは厳格です。

- 振る舞いを `qa-lab` で一度だけ表現できるなら、`qa-lab` に置く。
- 振る舞いが 1 つのチャネル transport に依存するなら、その runner plugin または plugin harness に保持する。
- あるシナリオが複数チャネルで使える新しい機能を必要とするなら、`suite.ts` にチャネル固有の分岐を入れるのではなく、汎用ヘルパーを追加する。
- ある振る舞いが 1 つの transport にしか意味を持たないなら、そのシナリオは transport 固有のままにし、scenario contract でそれを明示する。

新しいシナリオ向けの、推奨される汎用ヘルパー名は次のとおりです。

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

既存シナリオ向けの互換エイリアスも引き続き利用可能です。以下を含みます。

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新しいチャネル作業では、汎用ヘルパー名を使うべきです。
互換エイリアスは、フラグデー移行を避けるために存在しているのであって、
新しいシナリオ作成の手本ではありません。

## テストスイート（何がどこで動くか）

スイートは「現実性が増す」（そして不安定さ/コストも増す）ものとして考えてください。

### Unit / integration（デフォルト）

- コマンド: `pnpm test`
- 設定: 既存のスコープ付き Vitest project に対する 10 回の逐次シャード実行（`vitest.full-*.config.ts`）
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下の core/unit インベントリ、および `vitest.unit.config.ts` がカバーする許可済みの `ui` node テスト
- スコープ:
  - 純粋な unit テスト
  - インプロセス統合テスト（Gateway auth、routing、tooling、parsing、config）
  - 既知のバグに対する決定的なリグレッション
- 期待値:
  - CI で実行される
  - 実際のキーは不要
  - 高速かつ安定しているべき
- Projects に関する注記:
  - 対象を絞らない `pnpm test` は、1 つの巨大なネイティブルート project プロセスではなく、11 個のより小さなシャード設定（`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行するようになりました。これにより、負荷の高いマシンでのピーク RSS を削減し、auto-reply/extension の作業が無関係なスイートを圧迫するのを防ぎます。
  - `pnpm test --watch` は引き続きネイティブルート `vitest.config.ts` の project graph を使用します。複数シャードの watch ループは現実的ではないためです。
  - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリ指定をまずスコープ付きレーン経由でルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` ではフルルート project 起動コストを払わずに済みます。
  - `pnpm test:changed` は、変更された git パスがルーティング可能な source/test ファイルだけに触れている場合、それらを同じスコープ付きレーンに展開します。config/setup の編集は引き続き広範なルート project 再実行にフォールバックします。
  - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および同様の純粋なユーティリティ領域にある import が軽い unit テストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンを通ります。stateful/runtime-heavy なファイルは既存レーンに残ります。
  - 選択された `plugin-sdk` および `commands` helper ソースファイルも、変更モード実行をこれらの軽量レーン内の明示的な兄弟テストにマップするようになったため、helper の編集でそのディレクトリの重い全スイートを再実行せずに済みます。
  - `auto-reply` には現在、3 つの専用バケットがあります: 最上位 core helpers、最上位 `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー。これにより、最も重い reply harness 作業を安価な status/chunk/token テストから切り離せます。
- Embedded runner に関する注記:
  - message-tool 検出入力または Compaction runtime context を変更する場合は、両レベルのカバレッジを維持してください。
  - 純粋な routing/normalization 境界には、焦点を絞った helper リグレッションを追加してください。
  - あわせて、embedded runner 統合スイートも健全に保ってください:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
  - これらのスイートは、scoped id と Compaction の振る舞いが実際の `run.ts` / `compact.ts` パスを通って流れ続けることを検証します。helper のみのテストは、これらの統合パスの十分な代替にはなりません。
- Pool に関する注記:
  - ベース Vitest config は現在デフォルトで `threads` です。
  - 共有 Vitest config は `isolate: false` も固定し、root projects、e2e、live configs 全体で非分離 runner を使います。
  - ルート UI レーンは `jsdom` setup と optimizer を維持していますが、現在は共有の非分離 runner 上でも動作します。
  - 各 `pnpm test` シャードは、共有 Vitest config から同じ `threads` + `isolate: false` のデフォルトを継承します。
  - 共有の `scripts/run-vitest.mjs` ランチャーは、大規模なローカル実行時の V8 コンパイル負荷を減らすため、Vitest 子 Node プロセスにデフォルトで `--no-maglev` も追加するようになりました。標準の V8 挙動と比較したい場合は、`OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。
- Fast-local iteration に関する注記:
  - `pnpm test:changed` は、変更パスがより小さなスイートにきれいにマップされる場合、スコープ付きレーンを通ります。
  - `pnpm test:max` と `pnpm test:changed:max` も同じルーティング動作を維持しつつ、worker 上限だけを高くします。
  - ローカル worker の自動スケーリングは現在意図的に保守的で、ホストのロードアベレージがすでに高い場合にも抑制されるため、複数の同時 Vitest 実行がデフォルトで与える影響を小さくします。
  - ベース Vitest config は、テスト配線が変わったときにも changed-mode の再実行が正しくなるよう、projects/config ファイルを `forceRerunTriggers` としてマークします。
  - config は、サポート対象ホストでは `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接プロファイリング用に明示的なキャッシュ場所を 1 つ使いたい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。
- Perf-debug に関する注記:
  - `pnpm test:perf:imports` は、Vitest の import 所要時間レポートと import 内訳出力を有効にします。
  - `pnpm test:perf:imports:changed` は、同じプロファイリング表示を `origin/main` 以降で変更されたファイルに限定します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、ルーティングされた `test:changed` を、そのコミット済み diff に対するネイティブルート project パスと比較し、wall time と macOS の最大 RSS を出力します。
- `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を `scripts/test-projects.mjs` とルート Vitest config に通すことで、現在の dirty tree をベンチマークします。
  - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と transform オーバーヘッドに対するメインスレッド CPU プロファイルを書き出します。
  - `pnpm test:perf:profile:runner` は、ファイル並列性を無効にした unit スイートの runner CPU+heap プロファイルを書き出します。

### E2E（Gateway スモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`
- ランタイムデフォルト:
  - リポジトリの他の部分に合わせて、Vitest `threads` と `isolate: false` を使用します。
  - 適応型 worker を使用します（CI: 最大 2、ローカル: デフォルトで 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトではサイレントモードで実行します。
- 便利な上書き:
  - worker 数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）
  - 詳細なコンソール出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`
- スコープ:
  - 複数インスタンスの Gateway エンドツーエンド動作
  - WebSocket/HTTP サーフェス、Node ペアリング、およびより重いネットワーク処理
- 期待値:
  - （パイプラインで有効な場合は）CI で実行される
  - 実際のキーは不要
  - unit テストより可動部分が多い（遅くなることがある）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `test/openshell-sandbox.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell Gateway を起動する
  - 一時的なローカル Dockerfile から sandbox を作成する
  - 実際の `sandbox ssh-config` + SSH exec 経由で OpenClaw の OpenShell バックエンドを実行する
  - sandbox fs bridge を通じて remote-canonical filesystem の動作を検証する
- 期待値:
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作する Docker daemon が必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト Gateway と sandbox を破棄する
- 便利な上書き:
  - 広範な e2e スイートを手動実行するときにこのテストを有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたはラッパースクリプトを指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際のプロバイダー + 実際のモデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは、今日、実際の認証情報で本当に動作するか？」
  - プロバイダーフォーマット変更、tool-calling の癖、auth 問題、rate limit の挙動を検出する
- 期待値:
  - 設計上、CI で安定しない（実ネットワーク、実プロバイダーポリシー、quota、障害）
  - コストがかかる / rate limit を消費する
  - 「全部」ではなく、絞り込んだサブセットを実行するのを優先する
- live 実行では、不足している API キーを拾うために `~/.profile` を source します。
- デフォルトでは、live 実行でも `HOME` を分離し、config/auth 情報を一時的なテスト home にコピーするため、unit fixture が実際の `~/.openclaw` を変更することはありません。
- live テストで実際の home ディレクトリを意図的に使う必要がある場合のみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かなモードがデフォルトです。`[live] ...` の進捗出力は維持しますが、追加の `~/.profile` 通知を抑制し、Gateway 起動ログ/Bonjour の雑音をミュートします。完全な起動ログを再表示したい場合は、`OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API キーローテーション（プロバイダー固有）: カンマ/セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定するか、live ごとの上書きとして `OPENCLAW_LIVE_*_KEY` を設定してください。テストは rate limit 応答時に再試行します。
- 進捗/Heartbeat 出力:
  - live スイートは現在、長いプロバイダー呼び出しが Vitest のコンソールキャプチャが静かでも可視のままアクティブであるように、進捗行を stderr に出力します。
  - `vitest.live.config.ts` は Vitest のコンソール横取りを無効にするため、プロバイダー/Gateway の進捗行は live 実行中に即座にストリームされます。
  - 直接モデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - Gateway/probe の Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

この判断表を使ってください。

- ロジック/テストを編集した: `pnpm test` を実行する（多く変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーク / WS protocol / pairing に触れた: `pnpm test:e2e` を追加する
- 「bot が落ちている」問題 / プロバイダー固有の障害 / tool calling をデバッグしている: 絞り込んだ `pnpm test:live` を実行する

## Live: Android Node capability sweep

- テスト: `src/gateway/android-node.capabilities.live.test.ts`
- スクリプト: `pnpm android:test:integration`
- 目標: 接続された Android Node が現在公開している **すべてのコマンド** を呼び出し、コマンドコントラクトの挙動を検証すること。
- スコープ:
  - 前提条件付き/手動セットアップ（このスイートはアプリのインストール/実行/ペアリングを行いません）。
  - 選択された Android Node に対する、コマンドごとの Gateway `node.invoke` 検証。
- 必要な事前セットアップ:
  - Android アプリがすでに接続済みかつ Gateway とペアリング済みであること。
  - アプリをフォアグラウンドに維持すること。
  - 成功を期待する capability に必要な permissions/capture consent が許可されていること。
- 任意の対象上書き:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android の完全なセットアップ詳細: [Android App](/ja-JP/platforms/android)

## Live: model smoke（profile keys）

live テストは、失敗を切り分けられるように 2 層に分かれています。

- 「Direct model」は、指定されたキーでそのプロバイダー/モデルが少なくとも応答できることを教えてくれます。
- 「Gateway smoke」は、そのモデルに対して完全な gateway+agent パイプラインが動作することを教えてくれます（sessions、history、tools、sandbox policy など）。

### レイヤー 1: Direct model completion（Gateway なし）

- テスト: `src/agents/models.profiles.live.test.ts`
- 目標:
  - 検出されたモデルを列挙する
  - `getApiKeyForModel` を使って、認証情報を持っているモデルを選択する
  - モデルごとに小さな completion を実行する（必要に応じて対象を絞ったリグレッションも）
- 有効化する方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- このスイートを実際に実行するには `OPENCLAW_LIVE_MODELS=modern`（または `all`、modern の別名）を設定してください。そうしないと、`pnpm test:live` を Gateway smoke に集中させるためにスキップされます
- モデルの選択方法:
  - `OPENCLAW_LIVE_MODELS=modern` で modern allowlist を実行する（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_MODELS=all` は modern allowlist の別名
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."`（カンマ区切り allowlist）
  - modern/all スイープはデフォルトで厳選された高シグナル上限を使います。網羅的な modern スイープには `OPENCLAW_LIVE_MAX_MODELS=0` を、より小さい上限には正の数を設定してください。
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"`（カンマ区切り allowlist）
- キーの取得元:
  - デフォルト: profile store と env フォールバック
  - **profile store** のみを強制するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定する
- これが存在する理由:
  - 「プロバイダー API が壊れている / キーが無効である」と「Gateway agent パイプラインが壊れている」を切り分けるため
  - 小さく分離されたリグレッションを収容するため（例: OpenAI Responses/Codex Responses の reasoning replay + tool-call フロー）

### レイヤー 2: Gateway + dev agent smoke（`"@openclaw"` が実際に行うこと）

- テスト: `src/gateway/gateway-models.profiles.live.test.ts`
- 目標:
  - インプロセス Gateway を起動する
  - `agent:dev:*` セッションを作成/patch する（実行ごとに model override）
  - キー付きモデルを反復し、次を検証する:
    - 「意味のある」応答（ツールなし）
    - 実際のツール呼び出しが動作する（read probe）
    - 任意の追加ツール probe（exec+read probe）
    - OpenAI のリグレッションパス（tool-call-only → follow-up）が動作し続ける
- Probe の詳細（失敗をすぐ説明できるように）:
  - `read` probe: テストはワークスペースに nonce ファイルを書き込み、エージェントにそれを `read` して nonce を返答で復唱するよう求めます。
  - `exec+read` probe: テストはエージェントに `exec` で temp ファイルへ nonce を書かせ、その後それを `read` で読み返させます。
  - image probe: テストは生成した PNG（cat + ランダム化コード）を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装リファレンス: `src/gateway/gateway-models.profiles.live.test.ts` および `src/gateway/live-image-probe.ts`。
- 有効化する方法:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
- モデルの選択方法:
  - デフォルト: modern allowlist（Opus/Sonnet 4.6+、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.7、Grok 4）
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern allowlist の別名
  - または `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"`（またはカンマ区切りリスト）を設定して絞り込む
  - modern/all Gateway スイープはデフォルトで厳選された高シグナル上限を使います。網羅的な modern スイープには `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` を、より小さい上限には正の数を設定してください。
- プロバイダーの選択方法（「OpenRouter 全部」を避ける）:
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"`（カンマ区切り allowlist）
- この live テストでは tool + image probe は常に有効です:
  - `read` probe + `exec+read` probe（ツール負荷テスト）
  - image probe は、モデルが image input サポートを公開している場合に実行されます
  - フロー（高レベル）:
    - テストは「CAT」+ ランダムコードを含む小さな PNG を生成します（`src/gateway/live-image-probe.ts`）
    - `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信します
    - Gateway は添付を `images[]` に解析します（`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`）
    - Embedded agent は multimodal な user message をモデルへ転送します
    - 検証: 返信に `cat` + そのコードが含まれること（OCR 許容: 小さな誤りは許可）

ヒント: 自分のマシンで何をテストできるか（および正確な `provider/model` id）を確認するには、次を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI backend smoke（Claude、Codex、Gemini、またはその他のローカル CLI）

- テスト: `src/gateway/gateway-cli-backend.live.test.ts`
- 目標: デフォルト設定に触れずに、ローカル CLI backend を使って Gateway + agent パイプラインを検証する。
- backend 固有の smoke デフォルトは、所有する extension の `cli-backend.ts` 定義内にあります。
- 有効化:
  - `pnpm test:live`（または Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`）
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - デフォルト provider/model: `claude-cli/claude-sonnet-4-6`
  - command/args/image の挙動は、所有する CLI backend plugin metadata から取得します。
- 上書き（任意）:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - 実際の image attachment を送るには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`（パスは prompt に注入されます）。
  - prompt 注入の代わりに image file path を CLI 引数として渡すには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`。
  - `IMAGE_ARG` が設定されているときに image 引数の渡し方を制御するには `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"`（または `"list"`）。
  - 2 回目のターンを送って resume フローを検証するには `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`。
  - デフォルトの Claude Sonnet -> Opus 同一セッション継続性 probe を無効にするには `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`（選択したモデルが switch target をサポートしているときに強制有効化するには `1`）。
- 例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker レシピ:

```bash
pnpm test:docker:live-cli-backend
```

単一プロバイダー Docker レシピ:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

注記:

- Docker ランナーは `scripts/test-live-cli-backend-docker.sh` にあります。
- これは、リポジトリ Docker イメージ内で live CLI-backend smoke を非 root の `node` ユーザーとして実行します。
- 所有する extension から CLI smoke metadata を解決し、その後、一致する Linux CLI パッケージ（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）を、キャッシュ可能で書き込み可能な prefix `OPENCLAW_DOCKER_CLI_TOOLS_DIR`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）へインストールします。
- `pnpm test:docker:live-cli-backend:claude-subscription` では、`~/.claude/.credentials.json` 内の `claudeAiOauth.subscriptionType` または `claude setup-token` 由来の `CLAUDE_CODE_OAUTH_TOKEN` を通じたポータブル Claude Code subscription OAuth が必要です。最初に Docker 内で直接 `claude -p` を証明し、その後 Anthropic API-key env var を保持せずに 2 回の Gateway CLI-backend ターンを実行します。この subscription レーンでは、Claude が現在サードパーティアプリ使用を通常の subscription plan 制限ではなく追加使用量課金にルーティングしているため、Claude MCP/tool と image probe をデフォルトで無効にします。
- live CLI-backend smoke は現在、Claude、Codex、Gemini に対して同じ end-to-end フローを実行します: テキストターン、画像分類ターン、その後 Gateway CLI 経由で検証される MCP `cron` ツール呼び出し。
- Claude のデフォルト smoke では、セッションを Sonnet から Opus に patch し、再開されたセッションが以前のメモを引き続き記憶していることも検証します。

## Live: ACP bind smoke（`/acp spawn ... --bind here`）

- テスト: `src/gateway/gateway-acp-bind.live.test.ts`
- 目標: live ACP agent を使って実際の ACP 会話 bind フローを検証すること:
  - `/acp spawn <agent> --bind here` を送信する
  - 合成 message-channel 会話をその場で bind する
  - その同じ会話で通常の follow-up を送信する
  - follow-up が bind 済み ACP セッショントランスクリプトに届くことを確認する
- 有効化:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- デフォルト:
  - Docker 内の ACP agent: `claude,codex,gemini`
  - 直接 `pnpm test:live ...` 用の ACP agent: `claude`
  - 合成チャネル: Slack DM 風の会話コンテキスト
  - ACP backend: `acpx`
- 上書き:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- 注記:
  - このレーンは、admin 専用の合成 originating-route フィールドを持つ Gateway `chat.send` サーフェスを使うため、外部配送を装わずに message-channel context をテストへ付与できます。
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` が未設定の場合、このテストは選択した ACP harness agent に対して組み込みの `acpx` plugin の内蔵 agent registry を使用します。

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

単一 agent Docker レシピ:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker に関する注記:

- Docker ランナーは `scripts/test-live-acp-bind-docker.sh` にあります。
- デフォルトでは、サポートされるすべての live CLI agent に対して ACP bind smoke を順番に実行します: `claude`、`codex`、`gemini`。
- マトリクスを絞り込むには `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`、`OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`、または `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` を使用します。
- これは `~/.profile` を source し、一致する CLI auth 情報をコンテナへステージし、`acpx` を書き込み可能な npm prefix にインストールし、必要なら要求された live CLI（`@anthropic-ai/claude-code`、`@openai/codex`、または `@google/gemini-cli`）をインストールします。
- Docker 内では、ランナーは `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` を設定するため、acpx は source 済み profile の provider env var を子 harness CLI で利用可能なまま維持します。

## Live: Codex app-server harness smoke

- 目標: plugin 所有の Codex harness を通常の Gateway
  `agent` メソッド経由で検証すること:
  - 同梱の `codex` plugin を読み込む
  - `OPENCLAW_AGENT_RUNTIME=codex` を選択する
  - `codex/gpt-5.4` に最初の Gateway agent ターンを送る
  - 同じ OpenClaw セッションに 2 回目のターンを送り、app-server
    thread が resume できることを検証する
  - 同じ Gateway command
    パス経由で `/codex status` と `/codex models` を実行する
- テスト: `src/gateway/gateway-codex-harness.live.test.ts`
- 有効化: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- デフォルトモデル: `codex/gpt-5.4`
- 任意の image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- 任意の MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- この smoke は `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定するため、壊れた Codex
  harness が PI に黙ってフォールバックして通過することはできません。
- auth: シェル/profile 由来の `OPENAI_API_KEY`、および任意でコピーされた
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

Docker レシピ:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker に関する注記:

- Docker ランナーは `scripts/test-live-codex-harness-docker.sh` にあります。
- これはマウントされた `~/.profile` を source し、`OPENAI_API_KEY` を渡し、Codex CLI
  auth ファイルが存在すればコピーし、`@openai/codex` を書き込み可能なマウント済み npm
  prefix にインストールし、ソースツリーをステージし、その後 Codex-harness live テストだけを実行します。
- Docker はデフォルトで image と MCP/tool probe を有効にします。より狭いデバッグ実行が必要な場合は、
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` または
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` を設定してください。
- Docker も `OPENCLAW_AGENT_HARNESS_FALLBACK=none` を export し、live
  テスト設定と一致させるため、`openai-codex/*` や PI fallback で Codex harness
  のリグレッションが隠れることはありません。

### 推奨される live レシピ

狭く明示的な allowlist が最も高速で、最も不安定さが少なくなります。

- 単一モデル、direct（Gateway なし）:
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数プロバイダーにまたがる tool calling:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google 集中（Gemini API key + Antigravity）:
  - Gemini（API key）: `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity（OAuth）: `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注記:

- `google/...` は Gemini API を使います（API key）。
- `google-antigravity/...` は Antigravity OAuth bridge を使います（Cloud Code Assist 風の agent endpoint）。
- `google-gemini-cli/...` はあなたのマシン上のローカル Gemini CLI を使います（別の auth + tooling の癖があります）。
- Gemini API と Gemini CLI の違い:
  - API: OpenClaw は Google のホストされた Gemini API を HTTP 経由で呼び出します（API key / profile auth）。ほとんどのユーザーが「Gemini」と言うとき、これを指します。
  - CLI: OpenClaw はローカルの `gemini` バイナリをシェル実行します。独自の auth があり、挙動も異なる場合があります（streaming/tool サポート/version のずれ）。

## Live: model matrix（何をカバーするか）

固定の「CI model list」はありません（live はオプトイン）が、キーがある開発マシンで定期的にカバーすることを **推奨** するモデルは以下です。

### Modern smoke set（tool calling + image）

これは、動作し続けることを期待する「一般的なモデル」実行です。

- OpenAI（非 Codex）: `openai/gpt-5.4`（任意: `openai/gpt-5.4-mini`）
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google（Gemini API）: `google/gemini-3.1-pro-preview` および `google/gemini-3-flash-preview`（古い Gemini 2.x モデルは避ける）
- Google（Antigravity）: `google-antigravity/claude-opus-4-6-thinking` および `google-antigravity/gemini-3-flash`
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

ツール + image 付きで Gateway smoke を実行:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: tool calling（Read + 任意の Exec）

少なくとも各プロバイダーファミリーから 1 つ選んでください。

- OpenAI: `openai/gpt-5.4`（または `openai/gpt-5.4-mini`）
- Anthropic: `anthropic/claude-opus-4-6`（または `anthropic/claude-sonnet-4-6`）
- Google: `google/gemini-3-flash-preview`（または `google/gemini-3.1-pro-preview`）
- Z.AI（GLM）: `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

任意の追加カバレッジ（あると良いもの）:

- xAI: `xai/grok-4`（または利用可能な最新版）
- Mistral: `mistral/`…（有効化されている「tools」対応モデルを 1 つ選ぶ）
- Cerebras: `cerebras/`…（アクセス権がある場合）
- LM Studio: `lmstudio/`…（ローカル。tool calling は API モードに依存）

### Vision: image send（attachment → multimodal message）

少なくとも 1 つの image 対応モデル（Claude/Gemini/OpenAI の vision 対応バリアントなど）を `OPENCLAW_LIVE_GATEWAY_MODELS` に含めて、image probe を実行してください。

### Aggregators / 代替 Gateway

キーが有効なら、以下経由のテストもサポートしています。

- OpenRouter: `openrouter/...`（数百のモデル。tool+image 対応候補を見つけるには `openclaw models scan` を使ってください）
- OpenCode: Zen 用 `opencode/...`、Go 用 `opencode-go/...`（auth は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`）

認証情報/config がある場合、live matrix に含められる追加プロバイダー:

- 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`opencode-go`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
- `models.providers` 経由（カスタム endpoint）: `minimax`（cloud/API）、および OpenAI/Anthropic 互換 proxy（LM Studio、vLLM、LiteLLM など）

ヒント: ドキュメントに「すべてのモデル」をハードコードしようとしないでください。権威あるリストは、あなたのマシンで `discoverModels(...)` が返すもの + 利用可能なキーがあるものです。

## 認証情報（絶対に commit しないこと）

live テストは、CLI と同じ方法で認証情報を見つけます。実際上の意味は次のとおりです。

- CLI が動作するなら、live テストも同じキーを見つけられるはずです。
- live テストが「認証情報なし」と言うなら、`openclaw models list` / model 選択をデバッグするのと同じ方法でデバッグしてください。

- エージェントごとの auth profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（live テストで「profile keys」と言うとき、これを意味します）
- Config: `~/.openclaw/openclaw.json`（または `OPENCLAW_CONFIG_PATH`）
- 旧 state ディレクトリ: `~/.openclaw/credentials/`（存在する場合は staged live home にコピーされますが、メインの profile-key store ではありません）
- live のローカル実行では、デフォルトでアクティブ config、エージェントごとの `auth-profiles.json` ファイル、旧 `credentials/`、およびサポートされる外部 CLI auth ディレクトリを一時的なテスト home にコピーします。staged live home では `workspace/` と `sandboxes/` をスキップし、`agents.*.workspace` / `agentDir` のパス上書きも除去されるため、probe が実際のホスト workspace に触れません。

env キー（たとえば `~/.profile` で export されたもの）に依存したい場合は、`source ~/.profile` の後でローカルテストを実行するか、以下の Docker ランナーを使用してください（`~/.profile` をコンテナにマウントできます）。

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
  - 同梱 comfy image、video、および `music_generate` パスを実行する
  - `models.providers.comfy.<capability>` が設定されていない限り、各 capability をスキップする
  - comfy workflow submission、polling、downloads、または Plugin registration を変更した後に有用

## 画像生成 live

- テスト: `src/image-generation/runtime.live.test.ts`
- コマンド: `pnpm test:live src/image-generation/runtime.live.test.ts`
- ハーネス: `pnpm test:live:media image`
- スコープ:
  - 登録されたすべての画像生成 provider plugin を列挙する
  - probe 前に、ログインシェル（`~/.profile`）から不足している provider env var を読み込む
  - デフォルトでは保存済み auth profile より live/env API key を優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠すことがない
  - 使用可能な auth/profile/model がないプロバイダーはスキップする
  - 共有 runtime capability を通じて標準の画像生成バリアントを実行する:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- 現在カバーされている同梱プロバイダー:
  - `openai`
  - `google`
- 任意の絞り込み:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- 任意の auth 動作:
  - profile-store auth を強制し、env のみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 音楽生成 live

- テスト: `extensions/music-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media music`
- スコープ:
  - 共有の同梱 music-generation provider パスを実行する
  - 現在は Google と MiniMax をカバーする
  - probe 前にログインシェル（`~/.profile`）から provider env var を読み込む
  - デフォルトでは保存済み auth profile より live/env API key を優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠すことがない
  - 使用可能な auth/profile/model がないプロバイダーはスキップする
  - 利用可能な場合は、宣言された両方の runtime mode を実行する:
    - prompt のみ入力の `generate`
    - プロバイダーが `capabilities.edit.enabled` を宣言している場合の `edit`
  - 現在の共有レーンカバレッジ:
    - `google`: `generate`、`edit`
    - `minimax`: `generate`
    - `comfy`: この共有スイープではなく、別の Comfy live ファイル
- 任意の絞り込み:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- 任意の auth 動作:
  - profile-store auth を強制し、env のみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## 動画生成 live

- テスト: `extensions/video-generation-providers.live.test.ts`
- 有効化: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- ハーネス: `pnpm test:live:media video`
- スコープ:
  - 共有の同梱 video-generation provider パスを実行する
  - デフォルトではリリース安全な smoke パスを使う: FAL 以外のプロバイダー、プロバイダーごとに 1 回の text-to-video リクエスト、1 秒の lobster prompt、および `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（デフォルト `180000`）によるプロバイダーごとの操作上限
  - FAL は、プロバイダー側キュー待ち時間がリリース時間を支配しうるため、デフォルトでスキップされます。明示的に実行するには `--video-providers fal` または `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` を渡してください
  - probe 前にログインシェル（`~/.profile`）から provider env var を読み込む
  - デフォルトでは保存済み auth profile より live/env API key を優先するため、`auth-profiles.json` 内の古いテストキーが実際のシェル認証情報を隠すことがない
  - 使用可能な auth/profile/model がないプロバイダーはスキップする
  - デフォルトでは `generate` のみ実行する
  - 利用可能な場合に宣言された transform mode も実行するには `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定する:
    - プロバイダーが `capabilities.imageToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有スイープ内で buffer-backed ローカル画像入力を受け付ける場合の `imageToVideo`
    - プロバイダーが `capabilities.videoToVideo.enabled` を宣言し、選択されたプロバイダー/モデルが共有スイープ内で buffer-backed ローカル動画入力を受け付ける場合の `videoToVideo`
  - 共有スイープで現在宣言済みだがスキップされる `imageToVideo` プロバイダー:
    - 同梱 `veo3` は text-only で、同梱 `kling` はリモート画像 URL を必要とするため `vydra`
  - プロバイダー固有の Vydra カバレッジ:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - このファイルは、デフォルトでリモート画像 URL fixture を使う `kling` レーンに加え、`veo3` の text-to-video を実行します
  - 現在の `videoToVideo` live カバレッジ:
    - 選択モデルが `runway/gen4_aleph` の場合のみ `runway`
  - 共有スイープで現在宣言済みだがスキップされる `videoToVideo` プロバイダー:
    - `alibaba`、`qwen`、`xai` は現在 `http(s)` / MP4 のリモート参照 URL を必要とするため
    - `google` は、現在の共有 Gemini/Veo レーンがローカル buffer-backed 入力を使っており、そのパスは共有スイープで受け付けられないため
    - `openai` は、現在の共有レーンに org 固有の video inpaint/remix アクセス保証がないため
- 任意の絞り込み:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - デフォルトスイープに含まれる FAL を含むすべてのプロバイダーを対象にするには `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`
  - 攻めた smoke 実行のために各プロバイダーの操作上限を下げるには `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`
- 任意の auth 動作:
  - profile-store auth を強制し、env のみの上書きを無視するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`

## メディア live ハーネス

- コマンド: `pnpm test:live:media`
- 目的:
  - 共有の image、music、video live スイートを、リポジトリ標準の 1 つの entrypoint で実行する
  - `~/.profile` から不足している provider env var を自動で読み込む
  - デフォルトで、現在使用可能な auth を持つプロバイダーに各スイートを自動で絞り込む
  - `scripts/test-live.mjs` を再利用するため、Heartbeat と quiet-mode の挙動が一貫する
- 例:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker ランナー（任意の「Linux でも動く」チェック）

これらの Docker ランナーは 2 つのカテゴリに分かれます。

- Live-model ランナー: `test:docker:live-models` と `test:docker:live-gateway` は、それぞれ対応する profile-key live ファイルのみをリポジトリ Docker イメージ内で実行します（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）。ローカルの config dir と workspace をマウントし（マウントされていれば `~/.profile` も source します）。対応するローカル entrypoint は `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker live ランナーは、Docker での全体スイープを現実的に保つため、デフォルトでより小さな smoke 上限を使います:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` を使います。より大きな網羅的スキャンを明示的に望む場合は、これらの env var を上書きしてください。
- `test:docker:all` は、まず `test:docker:live-build` で live Docker イメージを一度ビルドし、その後 2 つの live Docker レーンでそれを再利用します。
- コンテナ smoke ランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:gateway-network`、`test:docker:mcp-channels`、および `test:docker:plugins` は、1 つ以上の実コンテナを起動し、より高レベルの統合パスを検証します。

live-model Docker ランナーは、必要な CLI auth home のみ（実行が絞り込まれていない場合はサポート対象すべて）を bind mount し、実行前にそれらをコンテナ home へコピーするため、外部 CLI OAuth がホスト auth store を変更せずにトークンを更新できます。

- Direct models: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP bind smoke: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`）
- CLI backend smoke: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + dev agent: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- Open WebUI live smoke: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なスキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- Gateway networking（2 コンテナ、WS auth + health）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- MCP channel bridge（seeded Gateway + stdio bridge + 生の Claude notification-frame smoke）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Plugins（install smoke + `/plugin` alias + Claude-bundle restart semantics）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）

live-model Docker ランナーは、現在の checkout も読み取り専用で bind mount し、
コンテナ内の一時 workdir にステージします。これにより、ランタイム
イメージをスリムに保ちながら、正確にあなたのローカル source/config に対して
Vitest を実行できます。
ステージング手順では、大きなローカル専用キャッシュやアプリ build 出力、たとえば
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、およびアプリローカルの `.build` や
Gradle 出力ディレクトリをスキップするため、Docker live 実行がマシン固有の
artifact をコピーするのに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、Gateway live probe が
コンテナ内で実際の Telegram/Discord などのチャネルワーカーを起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、
その Docker レーンから Gateway
live カバレッジを絞り込む、または除外する必要がある場合は `OPENCLAW_LIVE_GATEWAY_*` も
渡してください。
`test:docker:openwebui` は、より高レベルの互換性 smoke です。これにより
OpenAI 互換 HTTP endpoint を有効化した OpenClaw Gateway コンテナを起動し、
その Gateway に対して固定版 Open WebUI コンテナを起動し、Open WebUI 経由でサインインし、
`/api/models` が `openclaw/default` を公開していることを確認し、その後
Open WebUI の `/api/chat/completions` proxy 経由で実際の chat request を送信します。
初回実行は、Docker が Open WebUI イメージを pull する必要がある場合や、
Open WebUI 自身が cold-start setup を完了する必要がある場合があるため、目に見えて遅くなることがあります。
このレーンは使用可能な live model key を期待しており、Docker 化された実行で
それを提供する主な方法は `OPENCLAW_PROFILE_FILE`
（デフォルトは `~/.profile`）です。
成功時の実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON payload を出力します。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、または iMessage アカウントは不要です。これにより seed 済み Gateway
コンテナを起動し、`openclaw mcp serve` を spawn する 2 つ目のコンテナを起動し、
その後、ルーティングされた会話検出、トランスクリプト読み取り、添付 metadata、
live event queue の挙動、outbound send routing、および Claude 風の channel +
permission 通知を、実際の stdio MCP bridge 上で検証します。通知チェックは
生の stdio MCP frame を直接検査するため、この smoke は
特定の client SDK がたまたま表面化するものではなく、bridge が実際に出力するものを検証します。

手動 ACP 平文 thread smoke（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグワークフロー用に保持してください。ACP thread routing 検証で再度必要になる可能性があるため、削除しないでください。

便利な env var:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）を `/home/node/.openclaw` にマウント
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）を `/home/node/.openclaw/workspace` にマウント
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）を `/home/node/.profile` にマウントし、テスト実行前に source
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）を `/home/node/.npm-global` にマウントし、Docker 内での CLI install キャッシュに使用
- `$HOME` 配下の外部 CLI auth ディレクトリ/ファイルは、`/host-auth...` 配下に読み取り専用でマウントされ、その後テスト開始前に `/home/node/...` へコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定された必要なディレクトリ/ファイルのみをマウントします
  - 手動で上書きするには `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリスト
- 実行を絞り込むには `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
- コンテナ内のプロバイダーをフィルタするには `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`
- 再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`
- 認証情報が profile store 由来であることを保証するには `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`（env ではない）
- Open WebUI smoke 用に Gateway が公開する model を選ぶには `OPENCLAW_OPENWEBUI_MODEL=...`
- Open WebUI smoke が使う nonce-check prompt を上書きするには `OPENCLAW_OPENWEBUI_PROMPT=...`
- 固定版 Open WebUI image tag を上書きするには `OPENWEBUI_IMAGE=...`

## ドキュメントの健全性確認

ドキュメント編集後は docs チェックを実行してください: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、完全な Mintlify anchor 検証を実行してください: `pnpm docs:check-links:anchors`。

## オフラインリグレッション（CI 安全）

これらは実際のプロバイダーを使わない「実パイプライン」リグレッションです。

- Gateway tool calling（OpenAI は mock、Gateway + agent loop は実物）: `src/gateway/gateway.test.ts`（ケース: 「runs a mock OpenAI tool call end-to-end via gateway agent loop」）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、config + auth enforced の書き込み）: `src/gateway/gateway.test.ts`（ケース: 「runs wizard over ws and writes auth token config」）

## エージェント信頼性 eval（Skills）

すでに、いくつかの CI 安全なテストが「エージェント信頼性 eval」のように機能しています。

- 実際の Gateway + agent loop を通した mock tool-calling（`src/gateway/gateway.test.ts`）。
- セッション配線と config の影響を検証する end-to-end なウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills 向けにまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **Decisioning:** prompt に Skills が列挙されているとき、エージェントは正しい Skill を選ぶか（または無関係なものを避けるか）？
- **Compliance:** エージェントは使用前に `SKILL.md` を読み、必須の手順/引数に従うか？
- **Workflow contracts:** ツール順序、セッション履歴の持ち越し、sandbox 境界を検証する複数ターンのシナリオ。

将来の eval は、まず決定的であるべきです。

- mock provider を使って、tool call + 順序、Skill ファイルの読み取り、セッション配線を検証する scenario runner。
- 小規模な Skill 特化シナリオスイート（使う vs 使わない、gating、prompt injection）。
- CI 安全なスイートが整った後でのみ、任意の live eval（オプトイン、env でゲート）。

## コントラクトテスト（plugin と channel の形状）

コントラクトテストは、登録されたすべての plugin と channel がその
インターフェースコントラクトに準拠していることを検証します。これらは検出されたすべての plugin を反復し、
形状と挙動に関する一連の検証を実行します。デフォルトの `pnpm test` unit レーンは、
これらの共有シームおよび smoke ファイルを意図的にスキップします。共有 channel または
provider サーフェスに触れた場合は、コントラクトコマンドを明示的に実行してください。

### コマンド

- すべてのコントラクト: `pnpm test:contracts`
- channel コントラクトのみ: `pnpm test:contracts:channels`
- provider コントラクトのみ: `pnpm test:contracts:plugins`

### Channel コントラクト

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **plugin** - 基本的な Plugin 形状（id、name、capabilities）
- **setup** - セットアップウィザードコントラクト
- **session-binding** - セッション bind の挙動
- **outbound-payload** - メッセージ payload 構造
- **inbound** - inbound メッセージ処理
- **actions** - channel action handler
- **threading** - thread ID 処理
- **directory** - directory/roster API
- **group-policy** - グループポリシー強制

### Provider status コントラクト

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - channel status probe
- **registry** - Plugin registry 形状

### Provider コントラクト

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - auth フローコントラクト
- **auth-choice** - auth choice/selection
- **catalog** - model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - provider runtime
- **shape** - Plugin 形状/インターフェース
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdk export または subpath を変更した後
- channel または provider Plugin を追加または変更した後
- Plugin 登録または discovery をリファクタリングした後

コントラクトテストは CI で実行され、実際の API key は不要です。

## リグレッション追加のガイダンス

live で見つかった provider/model の問題を修正するときは:

- 可能なら CI 安全なリグレッションを追加する（provider を mock/stub する、または正確な request-shape 変換をキャプチャする）
- 本質的に live 専用（rate limit、auth policy）なら、live テストを狭く保ち、env var 経由でオプトインにする
- バグを捕まえられる最小の層を狙うことを優先する:
  - provider の request conversion/replay バグ → direct models テスト
  - Gateway の session/history/tool pipeline バグ → Gateway live smoke または CI 安全な Gateway mock テスト
- SecretRef 走査ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、registry metadata（`listSecretTargetRegistryEntries()`）から各 SecretRef クラスごとに 1 つのサンプル target を導出し、その後 traversal-segment exec id が拒否されることを検証します。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef target family を追加した場合は、そのテスト内の `classifyTargetClass` を更新してください。このテストは、未分類の target id で意図的に失敗するため、新しいクラスが黙ってスキップされることはありません。
