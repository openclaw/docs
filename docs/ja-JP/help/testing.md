---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway + エージェントの動作のデバッグ
summary: 'テストキット: ユニット/e2e/ライブスイート、Docker ランナー、および各テストがカバーする内容'
title: テスト
x-i18n:
    generated_at: "2026-04-30T05:18:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（ユニット/統合、e2e、live）と、小規模な Docker ランナー群があります。このドキュメントは「テスト方法」のガイドです。

- 各スイートが何をカバーするか（そして意図的に何をカバー_しない_か）。
- 一般的なワークフロー（ローカル、push 前、デバッグ）で実行するコマンド。
- live テストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダーの問題に対するリグレッションを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、live トランスポートレーン）**は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) — `pnpm openclaw qa matrix` のリファレンス。
- [QA channel](/ja-JP/channels/qa-channel) — リポジトリに裏付けられたシナリオで使用される合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行について説明します。下の QA 固有ランナーのセクション（[QA 固有ランナー](#qa-specific-runners)）には、具体的な `qa` 呼び出しを一覧し、上記のリファレンスへ戻る参照を示します。
</Note>

## クイックスタート

ほとんどの日は次を使います。

- フルゲート（push 前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカルフルスイート実行: `pnpm test:max`
- 直接の Vitest watch ループ: `pnpm test:watch`
- 直接ファイルを指定する場合も、extension/channel パスにルーティングされるようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復修正しているときは、まず対象を絞った実行を優先します。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストに触れたとき、または追加の信頼性が欲しいとき:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグするとき（実際の認証情報が必要）:

- live スイート（モデル + gateway tool/image プローブ）: `pnpm test:live`
- 1 つの live ファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live モデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さなファイル読み取り風プローブを実行するようになりました。
    メタデータが `image` 入力を示すモデルでは、小さな画像ターンも実行します。
    プロバイダーの失敗を切り分けるときは、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効化します。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` はどちらも、`include_live_suites: true` で再利用可能な live/E2E ワークフローを呼び出します。これには、プロバイダー別に分割された個別の Docker live モデル
    マトリックスジョブが含まれます。
  - 集中的な CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して
    `OpenClaw Live And E2E Checks (Reusable)` を dispatch します。
  - 新しい高シグナルのプロバイダーシークレットは、`scripts/ci-hydrate-live-auth.sh`
    に加えて `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` と、その
    scheduled/release 呼び出し元に追加します。
- ネイティブ Codex バインドチャット smoke: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker live レーンを実行し、合成
    Slack DM を `/codex bind` でバインドし、`/codex fast` と
    `/codex permissions` を実行したうえで、通常の返信と画像添付が
    ACP ではなくネイティブ Plugin バインディングを経由してルーティングされることを検証します。
- Codex app-server ハーネス smoke: `pnpm test:docker:live-codex-harness`
  - Plugin 所有の Codex app-server ハーネスを通じて Gateway agent ターンを実行し、
    `/codex status` と `/codex models` を検証します。デフォルトでは画像、
    cron MCP、サブエージェント、Guardian プローブも実行します。ほかの Codex
    app-server の失敗を切り分けるときは、
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` でサブエージェントプローブを無効化します。サブエージェントの集中的な確認では、ほかのプローブを無効化します。
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、これはサブエージェントプローブの後に終了します。
- Crestodian レスキューコマンド smoke: `pnpm test:live:crestodian-rescue-channel`
  - メッセージチャンネルのレスキューコマンドサーフェスに対する、オプトインの念入りな確認です。
    `/crestodian status` を実行し、永続的なモデル変更をキューに入れ、
    `/crestodian yes` に返信し、監査/config 書き込みパスを検証します。
- Crestodian プランナー Docker smoke: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に偽の Claude CLI を置いた config なしコンテナで Crestodian を実行し、
    fuzzy planner フォールバックが、監査付きの型付き config 書き込みに変換されることを検証します。
- Crestodian 初回実行 Docker smoke: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw state dir から開始し、素の `openclaw` を
    Crestodian にルーティングし、setup/model/agent/Discord Plugin + SecretRef 書き込みを適用し、
    config を検証し、監査エントリを検証します。同じ Ring 0 セットアップパスは
    QA Lab でも
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi コスト smoke: `MOONSHOT_API_KEY` を設定した状態で
  `openclaw models list --provider moonshot --json` を実行し、その後、分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を `moonshot/kimi-k2.6` に対して実行します。JSON が Moonshot/K2.6 を報告し、
  assistant トランスクリプトが正規化された `usage.cost` を保存していることを検証します。

<Tip>
失敗ケースが 1 つだけ必要な場合は、下で説明する allowlist 環境変数で live テストを絞り込むことを優先します。
</Tip>

## QA 固有ランナー

これらのコマンドは、QA-lab の現実性が必要なときにメインのテストスイートの横で使います。

CI は専用ワークフローで QA Lab を実行します。`Parity gate` は一致する PR と
mock プロバイダーを使った手動 dispatch で実行されます。`QA-Lab - All Lanes` は
`main` 上の nightly と手動 dispatch で実行され、mock parity gate、live Matrix レーン、
Convex 管理の live Telegram レーン、Convex 管理の live Discord レーンを
並列ジョブとして実行します。Scheduled QA とリリースチェックは Matrix `--profile fast`
を明示的に渡しますが、Matrix CLI と手動ワークフロー入力のデフォルトは引き続き
`all` です。手動 dispatch では `all` を `transport`、`media`、`e2ee-smoke`、
`e2ee-deep`、`e2ee-cli` ジョブに shard できます。`OpenClaw Release Checks` は、
リリース承認前に parity と fast Matrix および Telegram レーンを実行し、リリーストランスポートチェックには
`mock-openai/gpt-5.5` を使用するため、決定的で通常の provider-plugin 起動を回避できます。
これらの live トランスポート Gateway はメモリ検索を無効化します。メモリ動作は QA parity スイートで引き続きカバーされます。

フルリリースの live media shard は
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。これにはすでに
`ffmpeg` と `ffprobe` が含まれています。Docker live model/backend shard は、選択された
commit ごとに一度だけビルドされる共有の
`ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各 shard 内で再ビルドする代わりに
`OPENCLAW_SKIP_DOCKER_BUILD=1` でそれを pull します。

- `pnpm openclaw qa suite`
  - リポジトリに裏付けられた QA シナリオをホスト上で直接実行します。
  - 選択された複数シナリオを、分離された gateway worker でデフォルト並列実行します。
    `qa-channel` のデフォルト同時実行数は 4（選択されたシナリオ数で上限）です。
    worker 数を調整するには `--concurrency <count>` を使い、古いシリアルレーンには
    `--concurrency 1` を使います。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが欲しい場合は
    `--allow-failures` を使います。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、シナリオ対応の
    `mock-openai` レーンを置き換えることなく、実験的な
    fixture と protocol-mock カバレッジのためにローカル AIMock ベースのプロバイダーサーバーを起動します。
- `pnpm test:gateway:cpu-scenarios`
  - gateway startup bench に加えて、小さな mock QA Lab シナリオパック
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`）を実行し、結合された CPU 観測サマリーを
    `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは持続的な高 CPU 観測のみをフラグします（`--cpu-core-warn`
    と `--hot-wall-warn-ms`）。そのため、短い起動バーストは、数分にわたる gateway peg リグレッションのように見えることなく、メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使用します。チェックアウトに新しい runtime 出力がまだない場合は、先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を維持します。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - live 実行では、guest にとって実用的な、サポート済みの QA 認証入力を転送します。
    env ベースのプロバイダーキー、QA live provider config パス、および存在する場合の `CODEX_HOME` です。
  - 出力ディレクトリは、guest がマウントされたワークスペースを通じて書き戻せるよう、リポジトリルート配下に置く必要があります。
  - 通常の QA レポート + サマリーに加えて、Multipass ログを
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業向けに、Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルにインストールし、
    非対話の OpenAI API-key オンボーディングを実行し、デフォルトで Telegram を設定し、
    Plugin の有効化により runtime 依存関係がオンデマンドでインストールされることを検証し、
    doctor を実行し、mock された OpenAI エンドポイントに対して 1 回のローカル agent ターンを実行します。
  - Discord で同じ packaged-install レーンを実行するには、`OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使います。
- `pnpm test:docker:session-runtime-context`
  - 埋め込み runtime context トランスクリプト向けの、決定的な built-app Docker smoke を実行します。
    隠し OpenClaw runtime context が可視の user ターンに漏れるのではなく、非表示の custom message として永続化されることを検証し、
    その後、影響を受ける壊れた session JSONL を seed して、
    `openclaw doctor --fix` がバックアップ付きで active branch に書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - OpenClaw パッケージ候補を Docker にインストールし、インストール済みパッケージの
    オンボーディングを実行し、インストール済み CLI から Telegram を設定した後、そのインストール済みパッケージを SUT Gateway として使って
    live Telegram QA レーンを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。レジストリからインストールする代わりに、解決済みのローカル tarball をテストするには
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使用します。
    CI/release 自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて
    `OPENCLAW_QA_CONVEX_SITE_URL` と role secret を設定します。
    `OPENCLAW_QA_CONVEX_SITE_URL` と Convex role secret が CI に存在する場合、
    Docker ラッパーは Convex を自動選択します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに限って共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions は、このレーンを手動 maintainer ワークフロー
    `NPM Telegram Beta E2E` として公開します。merge 時には実行されません。ワークフローは
    `qa-live-shared` environment と Convex CI credential lease を使用します。
- GitHub Actions は、1 つの候補パッケージに対する side-run product proof として
  `Package Acceptance` も公開します。信頼済み ref、公開済み npm spec、
  HTTPS tarball URL と SHA-256、または別の run からの tarball artifact を受け取り、
  正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードした後、
  smoke、package、product、full、または custom
  レーンプロファイルで既存の Docker E2E scheduler を実行します。同じ `package-under-test` artifact に対して
  Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta の product proof:

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

- アーティファクト証明は、別の Actions 実行から tarball アーティファクトをダウンロードします。

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 現在の OpenClaw ビルドを Docker でパックしてインストールし、OpenAI を設定した Gateway を起動してから、設定の編集で同梱 channel/plugins を有効にします。
  - セットアップ検出によって、未設定の Plugin ランタイム依存関係が存在しないままであること、最初に設定された Gateway または doctor 実行が各同梱 Plugin のランタイム依存関係をオンデマンドでインストールすること、2 回目の再起動で既に有効化された依存関係が再インストールされないことを検証します。
  - 既知の古い npm ベースラインもインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効にして、候補版の更新後 doctor がハーネス側の postinstall 修復なしで同梱 channel ランタイム依存関係を修復することを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージ化インストール更新スモークを実行します。選択された各プラットフォームは、まず要求されたベースラインパッケージをインストールし、次に同じゲスト内でインストール済みの `openclaw update` コマンドを実行して、インストール済みバージョン、更新ステータス、Gateway の準備完了状態、1 回のローカルエージェントターンを検証します。
  - 1 つのゲストで反復する間は `--platform macos`、`--platform windows`、または `--platform linux` を使用します。サマリーアーティファクトパスとレーンごとのステータスには `--json` を使用します。
  - OpenAI レーンは、デフォルトでライブエージェントターン証明に `openai/gpt-5.5` を使用します。別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels トランスポートの停止が残りのテスト時間を消費しないように、長いローカル実行はホストのタイムアウトでラップします。

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - このスクリプトは、ネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` の下に書き込みます。外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を調べてください。
  - Windows 更新は、コールドゲストでは更新後 doctor/runtime 依存関係修復に 10〜15 分かかることがあります。ネストされた npm デバッグログが進んでいるなら、これは正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、Linux スモークレーンと並行して実行しないでください。これらは VM 状態を共有し、スナップショット復元、パッケージ提供、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後の証明は、通常の同梱 Plugin サーフェスを実行します。これは、音声、画像生成、メディア理解などのケイパビリティファサードが、エージェントターン自体では単純なテキスト応答だけを確認する場合でも、同梱ランタイム API を通じて読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接のプロトコルスモークテスト用に、ローカル AIMock プロバイダーサーバーだけを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker バック Tuwunel homeserver に対して Matrix ライブ QA レーンを実行します。ソースチェックアウト専用です。パッケージ化インストールには `qa-lab` は含まれません。
  - 完全な CLI、プロファイル/シナリオカタログ、環境変数、アーティファクト配置: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - env のドライバーと SUT ボットトークンを使い、実際の非公開グループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。デフォルトでは env モードを使用し、プールされたリースを使う場合は `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
  - 同じ非公開グループに 2 つの異なるボットが必要で、SUT ボットは Telegram ユーザー名を公開している必要があります。
  - 安定したボット間観測のため、両方のボットで `@BotFather` の Bot-to-Bot Communication Mode を有効にし、ドライバーボットがグループのボットトラフィックを観測できるようにしてください。
  - Telegram QA レポート、サマリー、observed-messages アーティファクトを `.artifacts/qa-e2e/...` の下に書き込みます。返信シナリオには、ドライバー送信リクエストから観測された SUT 返信までの RTT が含まれます。

ライブトランスポートレーンは、新しいトランスポートがずれないように 1 つの標準コントラクトを共有します。レーンごとのカバレッジマトリクスは [QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、このマトリクスの一部ではありません。

### Convex 経由の共有 Telegram 認証情報（v1）

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA lab は Convex バックのプールから排他的リースを取得し、レーンの実行中にそのリースへ Heartbeat を送り、シャットダウン時にリースを解放します。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択したロール用のシークレット 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロール選択:
  - CLI: `--credential-role maintainer|ci`
  - Env デフォルト: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトで `ci`、それ以外では `maintainer`）

任意環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発用に loopback `http://` Convex URL を許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用する必要があります。

メンテナー管理コマンド（プールの追加/削除/一覧表示）には、特に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を出力せずに Convex サイト URL、ブローカーシークレット、エンドポイントプレフィックス、HTTP タイムアウト、admin/list 到達性を確認します。スクリプトと CI ユーティリティで機械可読な出力が必要な場合は `--json` を使用します。

デフォルトエンドポイントコントラクト（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

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
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正な形式のペイロードを拒否します。

### QA に channel を追加する

新しい channel アダプターのアーキテクチャとシナリオヘルパー名は、[QA 概要 → channel を追加する](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低基準は、共有 `qa-lab` ホストシーム上にトランスポートランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` の下にシナリオを作成することです。

## テストスイート（何がどこで実行されるか）

スイートは「リアリズムが増す」（そして不安定さ/コストも増す）ものとして考えてください。

### ユニット / 統合（デフォルト）

- コマンド: `pnpm test`
- 設定: ターゲット指定なしの実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクト別設定へ展開する場合があります。
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` の下の core/unit インベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます。
- スコープ:
  - 純粋なユニットテスト
  - インプロセス統合テスト（Gateway 認証、ルーティング、ツール、パース、設定）
  - 既知のバグに対する決定的なリグレッション
- 期待値:
  - CI で実行される
  - 実キーは不要
  - 高速で安定しているべき
  - リゾルバーと公開サーフェスのローダーテストは、実際の同梱 Plugin ソース API ではなく、生成された小さな Plugin フィクスチャで広範な `api.js` と `runtime-api.js` のフォールバック動作を証明する必要があります。実際の Plugin API ロードは、Plugin 所有のコントラクト/統合スイートに属します。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - ターゲット指定なしの `pnpm test` は、巨大なネイティブのルートプロジェクトプロセスを 1 つ実行する代わりに、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/extension の作業が無関係なスイートを飢えさせることを避けられます。
    - `pnpm test --watch` は引き続きネイティブのルート `vitest.config.ts` プロジェクトグラフを使います。複数シャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンに振り分けます。そのため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` は、ルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付きレーンに展開します。対象は、直接編集されたテスト、隣接する `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフの依存先です。config/setup/package の編集では、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使わない限り、テストの広範囲実行は行いません。
    - `pnpm check:changed` は、狭い範囲の作業に対する通常のスマートなローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テストの証跡には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。release metadata のみのバージョン更新では、対象を絞った version/config/root-dependency チェックを実行し、トップレベルの version フィールド以外の package 変更を拒否する guard が付きます。
    - Live Docker ACP ハーネスの編集では、Live Docker 認証スクリプトの shell 構文チェックと Live Docker scheduler dry-run という重点チェックを実行します。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定される場合のみ含まれます。dependency、export、version、その他の package surface 編集では、引き続きより広い guard を使います。
    - agents、commands、plugins、auto-reply helpers、`plugin-sdk` などの純粋な utility 領域の import が軽い単体テストは、`unit-fast` レーンに振り分けられます。このレーンは `test/setup-openclaw-runtime.ts` をスキップします。stateful/runtime-heavy なファイルは既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` の helper ソースファイルも、changed-mode の実行をこれらの軽量レーン内の明示的な隣接テストにマッピングします。そのため helper の編集では、そのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルの core helpers、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー向けの専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、import が重い 1 つのバケットが Node の尾全体を占有しないようにしています。
    - 通常の PR/main CI では、extension バッチ sweep と release-only の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補で plugin/extension-heavy なスイート向けに、別個の `Plugin Prerelease` 子ワークフローを dispatch します。

  </Accordion>

  <Accordion title="組み込みランナーのカバレッジ">

    - message-tool discovery の入力または Compaction runtime
      context を変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化の境界には、焦点を絞った helper 回帰テストを追加してください。
    - 組み込みランナー統合スイートを健全に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付き id と Compaction の挙動が実際の `run.ts` / `compact.ts` パスを通り続けることを検証します。helper のみのテストは、これらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool と isolation のデフォルト">

    - ベースの Vitest config はデフォルトで `threads` を使います。
    - 共有 Vitest config は `isolate: false` を固定し、root projects、e2e、live configs 全体で非隔離 runner を使います。
    - ルート UI レーンは `jsdom` setup と optimizer を維持しますが、共有の非隔離 runner 上でも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest config から同じ `threads` + `isolate: false` のデフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 compile churn を減らすため、デフォルトで Vitest 子 Node プロセスに `--no-maglev` を追加します。標準の V8 の挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="高速なローカルイテレーション">

    - `pnpm changed:lanes` は、diff がどのアーキテクチャレーンをトリガーするかを表示します。
    - pre-commit hook は formatting のみです。format 済みファイルを再 stage し、lint、typecheck、tests は実行しません。
    - スマートなローカルチェックゲートが必要な場合は、handoff または push の前に `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付きレーンを経由します。agent が harness、config、package、または contract の編集に本当により広い Vitest カバレッジが必要だと判断した場合のみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使ってください。
    - `pnpm test:max` と `pnpm test:changed:max` は、同じルーティング挙動を維持したまま、worker 上限だけを高くします。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストの load average がすでに高い場合は後退します。そのため、複数の同時 Vitest 実行による影響はデフォルトで小さくなります。
    - ベースの Vitest config は projects/config files を `forceRerunTriggers` としてマークしているため、test wiring が変わった場合でも changed-mode rerun は正しいままです。
    - config は、サポートされるホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接 profiling 用に明示的な cache location を 1 つ使いたい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf デバッグ">

    - `pnpm test:perf:imports` は、Vitest の import-duration reporting と import-breakdown output を有効にします。
    - `pnpm test:perf:imports:changed` は、同じ profiling view を `origin/main` 以降に変更されたファイルにスコープします。
    - シャードの timing data は `.artifacts/vitest-shard-timings.json` に書き込まれます。Whole-config run は config path をキーとして使います。include-pattern CI shard は shard name を追加するため、filtered shard を個別に追跡できます。
    - 1 つの hot test がまだ起動時 import に大半の時間を費やしている場合は、重い依存関係を狭いローカル `*.runtime.ts` seam の背後に置き、runtime helper を `vi.mock(...)` に渡すだけのために deep-import するのではなく、その seam を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、その committed diff に対する routed `test:changed` とネイティブ root-project path を比較し、wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイル一覧を `scripts/test-projects.mjs` と root Vitest config にルーティングして、現在の dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite startup と transform overhead 用の main-thread CPU profile を書き込みます。
    - `pnpm test:perf:profile:runner` は、file parallelism を無効にして、unit suite 用の runner CPU+heap profiles を書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（gateway）

- コマンド: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`、1 worker に強制
- スコープ:
  - diagnostics をデフォルトで有効にした実際の loopback Gateway を起動します
  - synthetic gateway message、memory、large-payload churn を diagnostic event path に流します
  - Gateway WS RPC 経由で `diagnostics.stability` をクエリします
  - diagnostic stability bundle persistence helpers をカバーします
  - recorder が bounded のままであること、synthetic RSS samples が pressure budget 未満に収まること、per-session queue depths がゼロに戻ることをアサートします
- 期待事項:
  - CI-safe かつ keyless
  - stability-regression のフォローアップ用の狭いレーンであり、完全な Gateway suite の代替ではありません

### E2E（gateway smoke）

- コマンド: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E テスト
- Runtime のデフォルト:
  - リポジトリの他の部分と同じく、Vitest `threads` と `isolate: false` を使います。
  - adaptive workers を使います（CI: 最大 2、local: デフォルトで 1）。
  - console I/O overhead を減らすため、デフォルトで silent mode で実行します。
- 便利な override:
  - worker 数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - verbose console output を再度有効にするには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - 複数インスタンスの gateway end-to-end behavior
  - WebSocket/HTTP surfaces、node pairing、より重い networking
- 期待事項:
  - CI で実行されます（pipeline で有効な場合）
  - 実際の keys は不要
  - unit tests より moving parts が多いです（遅くなる場合があります）

### E2E: OpenShell backend smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に isolated OpenShell gateway を起動します
  - 一時的なローカル Dockerfile から sandbox を作成します
  - 実際の `sandbox ssh-config` + SSH exec を通じて OpenClaw の OpenShell backend を演習します
  - sandbox fs bridge を通じて remote-canonical filesystem behavior を検証します
- 期待事項:
  - opt-in のみ。デフォルトの `pnpm test:e2e` run には含まれません
  - ローカルの `openshell` CLI と動作中の Docker daemon が必要です
  - isolated `HOME` / `XDG_CONFIG_HOME` を使い、その後 test gateway と sandbox を破棄します
- 便利な override:
  - より広い e2e suite を手動で実行する際にテストを有効にするには `OPENCLAW_E2E_OPENSHELL=1`
  - 非デフォルトの CLI binary または wrapper script を指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際の providers + 実際の models）

- コマンド: `pnpm test:live`
- Config: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下の bundled-plugin live tests
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「この provider/model は、実際の creds で _今日_ 本当に動くか？」
  - provider format changes、tool-calling quirks、auth issues、rate limit behavior を検出します
- 期待事項:
  - 設計上 CI-stable ではありません（実際の networks、実際の provider policies、quotas、outages）
  - 費用が発生します / rate limits を消費します
  - 「everything」ではなく、絞り込んだ subset の実行を推奨します
- Live runs は `~/.profile` を source して、不足している API keys を取得します。
- デフォルトでは、live runs でも `HOME` を isolate し、config/auth material を一時的な test home にコピーします。そのため unit fixtures が実際の `~/.openclaw` を変更することはありません。
- live tests に実際の home directory を使わせる必要が意図的にある場合のみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、より静かな mode がデフォルトです。`[live] ...` progress output は維持しますが、追加の `~/.profile` notice を抑制し、gateway bootstrap logs/Bonjour chatter をミュートします。完全な startup logs を戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API key rotation（provider-specific）: `*_API_KEYS` を comma/semicolon 形式で設定するか、`*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定します。または `OPENCLAW_LIVE_*_KEY` による per-live override を使います。tests は rate limit responses で retry します。
- Progress/heartbeat output:
  - Live suites は現在、長い provider calls が Vitest console capture が静かな場合でも visibly active に見えるよう、progress lines を stderr に出力します。
  - `vitest.live.config.ts` は Vitest console interception を無効にするため、provider/gateway progress lines は live runs 中に即座に stream されます。
  - direct-model heartbeats は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - gateway/probe heartbeats は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきですか？

この decision table を使ってください:

- 編集ロジック/テスト: `pnpm test` を実行（大きく変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れる場合: `pnpm test:e2e` を追加
- 「自分の bot がダウンしている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグする場合: 絞り込んだ `pnpm test:live` を実行

## ライブ（ネットワークに触れる）テスト

ライブモデル行列、CLI バックエンドのスモーク、ACP スモーク、Codex app-server
ハーネス、およびすべてのメディアプロバイダーのライブテスト（Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス）と、ライブ実行の認証情報処理については、
[テスト — ライブスイート](/ja-JP/help/testing-live) を参照してください。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つの区分に分かれます。

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で、それぞれ対応する profile-key ライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカルの config ディレクトリとワークスペースをマウントします（マウントされている場合は `~/.profile` も読み込みます）。対応するローカルエントリポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker ライブランナーは、Docker 全体スイープを現実的に保つため、デフォルトで小さめのスモーク上限を使います。
  `test:docker:live-models` のデフォルトは `OPENCLAW_LIVE_MAX_MODELS=12`、また
  `test:docker:live-gateway` のデフォルトは `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。より大規模な網羅スキャンを明示的に行いたい場合は、これらの env vars を上書きしてください。
- `test:docker:all` は `test:docker:live-build` でライブ Docker イメージを一度だけビルドし、`scripts/package-openclaw-for-docker.mjs` 経由で OpenClaw を npm tarball として一度だけパックしてから、2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用します。ベアのイメージは、install/update/plugin-dependency レーン用の Node/Git ランナーのみです。それらのレーンは事前ビルド済み tarball をマウントします。機能テスト用イメージは、built-app 機能レーンのために同じ tarball を `/app` にインストールします。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行します。この集約は重み付きローカルスケジューラーを使います。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限は重いライブ、npm-install、マルチサービスのレーンが同時に開始されないようにします。単一のレーンが有効な上限より重い場合でも、プールが空ならスケジューラーはそれを開始でき、その後は再び容量が利用可能になるまで単独で実行し続けます。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、および `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。Docker ホストに余力がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整してください。ランナーはデフォルトで Docker プリフライトを実行し、古い OpenClaw E2E コンテナーを削除し、30 秒ごとにステータスを出力し、成功したレーンの所要時間を `.artifacts/docker-tests/lane-timings.json` に保存し、以降の実行ではその時間情報を使って長いレーンから先に開始します。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使い、選択されたレーン、パッケージ/イメージの必要性、認証情報について CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使います。
- `Package Acceptance` は、「このインストール可能な tarball は製品として動作するか？」を確認する GitHub ネイティブのパッケージゲートです。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードしてから、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。`workflow_ref` は信頼済みの workflow/ハーネススクリプトを選択し、`package_ref` は `source=ref` のときにパックするソース commit/branch/tag を選択します。これにより、現在の acceptance ロジックで古い信頼済み commit を検証できます。プロファイルは範囲の広さ順に並んでいます。`smoke` は短時間の install/channel/agent と gateway/config、`package` は package/update/plugin 契約であり、ほとんどの Parallels package/update カバレッジのデフォルトのネイティブ置換、`product` は MCP チャンネル、cron/subagent クリーンアップ、OpenAI web search、OpenWebUI を追加し、`full` は OpenWebUI を含む release-path Docker チャンクを実行します。リリース検証では、release-path Docker チャンクが重複する package/update/plugin レーンをすでにカバーしているため、カスタムパッケージ差分（`bundled-channel-deps-compat plugins-offline`）と Telegram パッケージ QA を実行します。アーティファクトから生成された対象指定の GitHub Docker 再実行コマンドには、利用可能な場合、以前のパッケージアーティファクトと準備済みイメージ入力が含まれるため、失敗したレーンはパッケージとイメージの再ビルドを避けられます。
- ビルドおよびリリースチェックは、tsdown の後に `scripts/check-cli-bootstrap-imports.mjs` を実行します。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的なビルド済みグラフをたどり、コマンドディスパッチ前の起動処理が Commander、prompt UI、undici、logging などのパッケージ依存関係をインポートしている場合は失敗します。また、バンドルされた gateway run チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否します。パッケージ化された CLI スモークは、ルートヘルプ、onboard ヘルプ、doctor ヘルプ、status、config schema、model-list コマンドもカバーします。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限されています。その締め切りまでは、ハーネスは出荷済みパッケージのメタデータ欠落のみを許容します。省略された private QA inventory entries、欠落した `gateway install --wrapper`、tarball 由来の git fixture 内の欠落した patch files、永続化されていない `update.channel`、レガシーの plugin install-record locations、欠落した marketplace install-record persistence、`plugins update` 中の config metadata migration です。`2026.4.25` より後のパッケージでは、それらのパスは厳格な失敗になります。
- コンテナースモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、および `test:docker:config-reload` は、1 つ以上の実際のコンテナーを起動し、より高水準の統合パスを検証します。

ライブモデル Docker ランナーは、必要な CLI auth homes のみ（または実行が絞り込まれていない場合は対応するすべて）を bind mount し、その後、実行前にコンテナーの home にコピーします。これにより、external-CLI OAuth はホストの auth store を変更せずにトークンを更新できます。

- 直接モデル: `pnpm test:docker:live-models`（スクリプト: `scripts/test-live-models-docker.sh`）
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind`（スクリプト: `scripts/test-live-acp-bind-docker.sh`。既定で Claude、Codex、Gemini をカバーし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` により Droid/OpenCode を厳格にカバー）
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend`（スクリプト: `scripts/test-live-cli-backend-docker.sh`）
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness`（スクリプト: `scripts/test-live-codex-harness-docker.sh`）
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway`（スクリプト: `scripts/test-live-gateway-models-docker.sh`）
- オブザーバビリティスモーク: `pnpm qa:otel:smoke` は非公開 QA ソースチェックアウトレーンです。npm tarball では QA Lab が省略されるため、意図的にパッケージ Docker リリースレーンには含まれていません。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui`（スクリプト: `scripts/e2e/openwebui-docker.sh`）
- オンボーディングウィザード（TTY、完全なスキャフォールディング）: `pnpm test:docker:onboard`（スクリプト: `scripts/e2e/onboard-docker.sh`）
- npm tarball オンボーディング/チャネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パック済みの OpenClaw tarball を Docker 内でグローバルインストールし、env-ref オンボーディングと既定の Telegram により OpenAI を設定し、doctor 修復によって Plugin ランタイム依存関係が有効化されたことを検証し、モックされた OpenAI エージェントターンを 1 回実行します。事前ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホスト側の再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`、チャネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- 更新チャネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker 内でグローバルインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャネルと Plugin 更新後の動作を検証してから、パッケージ `stable` に戻して更新ステータスを確認します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、非表示ランタイムコンテキストのトランスクリプト永続化と、影響を受ける重複したプロンプト書き換えブランチの doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は、現在のツリーをパックし、分離されたホームに `bun install -g` でインストールし、`openclaw infer image providers --json` がハングせずに同梱画像プロバイダーを返すことを検証します。事前ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`、ビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使用します。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、更新、直接 npm の各コンテナで 1 つの npm キャッシュを共有します。更新スモークは、候補 tarball にアップグレードする前の安定版ベースラインとして既定で npm `latest` を使用します。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きできます。非 root インストーラー検査では、root 所有のキャッシュエントリがユーザーローカルのインストール挙動を隠さないように、分離された npm キャッシュを維持します。ローカル再実行で root/更新/直接 npm キャッシュを再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` により重複する直接 npm グローバル更新をスキップします。直接 `npm install -g` のカバレッジが必要な場合は、その環境変数なしでスクリプトをローカル実行します。
- エージェント共有ワークスペース削除 CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace`（スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`）は既定でルート Dockerfile イメージをビルドし、分離されたコンテナホーム内で 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行し、有効な JSON とワークスペース保持の挙動を検証します。install-smoke イメージを再利用するには `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使用します。
- Gateway ネットワーク（2 コンテナ、WS 認証 + ヘルス）: `pnpm test:docker:gateway-network`（スクリプト: `scripts/e2e/gateway-network-docker.sh`）
- ブラウザー CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot`（スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`）は、ソース E2E イメージと Chromium レイヤーをビルドし、生の CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP ロールスナップショットがリンク URL、カーソル昇格されたクリック可能要素、iframe 参照、フレームメタデータをカバーすることを検証します。
- OpenAI Responses web_search 最小推論リグレッション: `pnpm test:docker:openai-web-search-minimal`（スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`）は、モックされた OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証してから、プロバイダースキーマの reject を強制し、生の詳細が Gateway ログに表示されることを確認します。
- MCP チャネルブリッジ（シード済み Gateway + stdio ブリッジ + 生の Claude 通知フレームスモーク）: `pnpm test:docker:mcp-channels`（スクリプト: `scripts/e2e/mcp-channels-docker.sh`）
- Pi バンドル MCP ツール（実 stdio MCP サーバー + 埋め込み Pi プロファイル許可/拒否スモーク）: `pnpm test:docker:pi-bundle-mcp-tools`（スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/サブエージェント MCP クリーンアップ（実 Gateway + 分離 cron と一度限りのサブエージェント実行後の stdio MCP 子プロセス解体）: `pnpm test:docker:cron-mcp-cleanup`（スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`）
- Plugin（インストールスモーク、ClawHub kitchen-sink インストール/アンインストール、マーケットプレイス更新、Claude バンドルの有効化/検査）: `pnpm test:docker:plugins`（スクリプト: `scripts/e2e/plugins-docker.sh`）
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、既定の kitchen-sink パッケージ/ランタイムのペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を使用します。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、このテストは密閉されたローカル ClawHub フィクスチャサーバーを使用します。
- Plugin 更新未変更スモーク: `pnpm test:docker:plugin-update`（スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`）
- 設定再読み込みメタデータスモーク: `pnpm test:docker:config-reload`（スクリプト: `scripts/e2e/config-reload-source-docker.sh`）
- 同梱 Plugin ランタイム依存関係: `pnpm test:docker:bundled-channel-deps` は既定で小さな Docker ランナーイメージをビルドし、ホスト上で OpenClaw を一度ビルドしてパックしてから、その tarball を各 Linux インストールシナリオにマウントします。イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1`、新しいローカルビルド後にホスト再ビルドをスキップするには `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`、既存の tarball を指定するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使用します。完全な Docker 集約とリリースパスの同梱チャネルチャンクは、この tarball を一度事前パックしてから、Telegram、Discord、Slack、Feishu、memory-lancedb、ACPX の個別更新レーンを含む独立レーンへ同梱チャネル検査をシャーディングします。リリースチャンクは、チャネルスモーク、更新ターゲット、セットアップ/ランタイム契約を `bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b`、`bundled-channels-contracts` に分割します。集約 `bundled-channels` チャンクは手動再実行用に引き続き利用できます。リリースワークフローは、プロバイダーインストーラーチャンクと同梱 Plugin インストール/アンインストールチャンクも分割します。従来の `package-update`、`plugins-runtime`、`plugins-integrations` チャンクは、手動再実行用の集約エイリアスとして残ります。同梱レーンを直接実行するときにチャネルマトリックスを絞るには `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` を、更新シナリオを絞るには `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` を使用します。シナリオごとの Docker 実行は既定で `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` です。複数ターゲット更新シナリオの既定は `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` です。このレーンは、`channels.<id>.enabled=false` と `plugins.entries.<id>.enabled=false` が doctor/ランタイム依存関係修復を抑制することも検証します。
- 反復作業中は、関係のないシナリオを無効にして同梱 Plugin ランタイム依存関係を絞ります。例:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

共有機能イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` などのスイート固有のイメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指す場合、スクリプトはローカルに存在しなければそれを pull します。QR とインストーラーの Docker テストは、共有されたビルド済みアプリランタイムではなくパッケージ/インストール挙動を検証するため、独自の Dockerfile を維持します。

ライブモデル Docker ランナーは現在のチェックアウトも読み取り専用で bind-mount し、
コンテナ内の一時 workdir にステージングします。これによりランタイム
イメージを小さく保ちながら、正確なローカルソース/設定に対して Vitest を実行できます。
ステージング手順は、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build` や
Gradle 出力ディレクトリなどの大きなローカル専用キャッシュとアプリビルド出力をスキップするため、
Docker ライブ実行がマシン固有アーティファクトのコピーに何分も費やすことはありません。
また、`OPENCLAW_SKIP_CHANNELS=1` も設定するため、Gateway ライブプローブはコンテナ内で
実際の Telegram/Discord などのチャネルワーカーを起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンから
Gateway ライブカバレッジを絞り込む、または除外する必要がある場合は、
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw Gateway コンテナを起動し、その Gateway に対して固定バージョンの Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証してから、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
初回実行は、Docker が Open WebUI イメージを pull し、Open WebUI が独自のコールドスタートセットアップを
完了する必要がある場合があるため、目に見えて遅くなることがあります。
このレーンは使用可能なライブモデルキーを想定しており、`OPENCLAW_PROFILE_FILE`
（既定は `~/.profile`）が Docker 化された実行でそれを提供する主な方法です。
成功した実行は `{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードを出力します。
`test:docker:mcp-channels` は意図的に決定的であり、
実際の Telegram、Discord、iMessage アカウントは不要です。シード済み Gateway
コンテナを起動し、`openclaw mcp serve` を生成する 2 番目のコンテナを起動してから、
ルーティングされた会話検出、トランスクリプト読み取り、添付ファイルメタデータ、
ライブイベントキューの挙動、送信ルーティング、実際の stdio MCP ブリッジ越しの Claude 形式のチャネル +
権限通知を検証します。通知チェックは、生の stdio MCP フレームを直接検査するため、
特定のクライアント SDK がたまたま表面化する内容だけでなく、ブリッジが実際に出力する内容をスモークが検証します。
`test:docker:pi-bundle-mcp-tools` は決定的であり、ライブ
モデルキーは不要です。リポジトリ Docker イメージをビルドし、コンテナ内で実際の stdio MCP プローブサーバーを
起動し、埋め込み Pi バンドル MCP ランタイムを通じてそのサーバーを実体化し、
ツールを実行してから、`coding` と `messaging` が
`bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルターすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的であり、ライブモデル
キーは不要です。実 stdio MCP プローブサーバーを持つシード済み Gateway を起動し、
分離された cron ターンと `/subagents spawn` の一度限りの子ターンを実行してから、
MCP 子プロセスが各実行後に終了することを検証します。

手動 ACP 平易言語スレッドスモーク（CI ではない）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトはリグレッション/デバッグワークフロー用に保持する。ACPスレッドルーティング検証で再び必要になる可能性があるため、削除しない。

便利な環境変数:

- `OPENCLAW_CONFIG_DIR=...` (デフォルト: `~/.openclaw`) は `/home/node/.openclaw` にマウントされる
- `OPENCLAW_WORKSPACE_DIR=...` (デフォルト: `~/.openclaw/workspace`) は `/home/node/.openclaw/workspace` にマウントされる
- `OPENCLAW_PROFILE_FILE=...` (デフォルト: `~/.profile`) は `/home/node/.profile` にマウントされ、テスト実行前に読み込まれる
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な設定/ワークスペースディレクトリを使い、外部CLI認証マウントなしで、`OPENCLAW_PROFILE_FILE` から読み込まれた環境変数のみを検証する
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (デフォルト: `~/.cache/openclaw/docker-cli-tools`) は、Docker内のキャッシュ済みCLIインストール用に `/home/node/.npm-global` にマウントされる
- `$HOME` 配下の外部CLI認証ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` へコピーされる
  - デフォルトのディレクトリ: `.minimax`
  - デフォルトのファイル: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定される必要なディレクトリ/ファイルのみをマウントする
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きする
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` は実行対象を絞り込む
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` はコンテナー内のプロバイダーをフィルターする
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドが不要な再実行で既存の `openclaw:local-live` イメージを再利用する
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報が環境変数ではなくプロファイルストアから取得されることを保証する
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUIスモーク用にGatewayが公開するモデルを選択する
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUIスモークで使うnonceチェックプロンプトを上書きする
- `OPENWEBUI_IMAGE=...` は、固定されたOpen WebUIイメージタグを上書きする

## ドキュメント健全性確認

ドキュメント編集後にドキュメントチェックを実行する: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、Mintlifyの完全なアンカー検証を実行する: `pnpm docs:check-links:anchors`。

## オフラインリグレッション (CI安全)

これらは実プロバイダーなしの「実パイプライン」リグレッション:

- Gatewayツール呼び出し (モックOpenAI、実Gateway + エージェントループ): `src/gateway/gateway.test.ts` (ケース: 「Gatewayエージェントループ経由でモックOpenAIツール呼び出しをエンドツーエンドで実行する」)
- Gatewayウィザード (WS `wizard.start`/`wizard.next`、設定を書き込み + 認証を強制): `src/gateway/gateway.test.ts` (ケース: 「ws経由でウィザードを実行し、認証トークン設定を書き込む」)

## エージェント信頼性評価 (Skills)

「エージェント信頼性評価」のように振る舞うCI安全なテストがすでにいくつかある:

- 実Gateway + エージェントループ経由のモックツール呼び出し (`src/gateway/gateway.test.ts`)。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー (`src/gateway/gateway.test.ts`)。

Skillsでまだ不足しているもの ([Skills](/ja-JP/tools/skills) を参照):

- **判断:** Skillsがプロンプトに列挙されている場合、エージェントは適切なSkillsを選ぶか (または無関係なものを避けるか)?
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必須の手順/引数に従うか?
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界を検証するマルチターンシナリオ。

将来の評価は、まず決定的であるべき:

- モックプロバイダーを使い、ツール呼び出し + 順序、Skillファイル読み取り、セッション配線を検証するシナリオランナー。
- Skillsに焦点を当てた小規模なシナリオスイート (使用 vs 回避、ゲート、プロンプトインジェクション)。
- CI安全なスイートが整った後にのみ、任意のライブ評価 (オプトイン、環境変数でゲート)。

## 契約テスト (Pluginとチャネル形状)

契約テストは、登録済みのすべてのPluginとチャネルがその
インターフェース契約に準拠していることを検証する。検出されたすべてのPluginを反復処理し、
形状と動作のアサーションスイートを実行する。デフォルトの `pnpm test` ユニットレーンは、これらの共有接合部とスモークファイルを意図的にスキップする。共有チャネルまたはプロバイダーサーフェスに触れる場合は、契約コマンドを明示的に実行する。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` に配置:

- **plugin** - 基本的なPlugin形状 (id、name、capabilities)
- **setup** - セットアップウィザード契約
- **session-binding** - セッションバインディング動作
- **outbound-payload** - メッセージペイロード構造
- **inbound** - 受信メッセージ処理
- **actions** - チャネルアクションハンドラー
- **threading** - スレッドID処理
- **directory** - ディレクトリ/名簿API
- **group-policy** - グループポリシー適用

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` に配置。

- **status** - チャネルステータスプローブ
- **registry** - Pluginレジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` に配置:

- **auth** - 認証フロー契約
- **auth-choice** - 認証の選択/選択肢
- **catalog** - モデルカタログAPI
- **discovery** - Plugin検出
- **loader** - Plugin読み込み
- **runtime** - プロバイダーランタイム
- **shape** - Plugin形状/インターフェース
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdkのエクスポートまたはサブパスを変更した後
- チャネルまたはプロバイダーPluginを追加または変更した後
- Plugin登録または検出をリファクタリングした後

契約テストはCIで実行され、実APIキーを必要としない。

## リグレッションの追加 (ガイダンス)

ライブで発見されたプロバイダー/モデルの問題を修正する場合:

- 可能であればCI安全なリグレッションを追加する (モック/スタブプロバイダー、または正確なリクエスト形状変換の捕捉)
- 本質的にライブのみの場合 (レート制限、認証ポリシー)、ライブテストは狭く保ち、環境変数でオプトインにする
- バグを捕捉する最小レイヤーを対象にする:
  - プロバイダーリクエスト変換/リプレイバグ → 直接のモデルテスト
  - Gatewayセッション/履歴/ツールパイプラインバグ → GatewayライブスモークまたはCI安全なGatewayモックテスト
- SecretRef走査ガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` はレジストリメタデータ (`listSecretTargetRegistryEntries()`) からSecretRefクラスごとに1つのサンプリング対象を導出し、走査セグメントexec idが拒否されることをアサートする。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRefターゲットファミリーを追加する場合は、そのテスト内の `classifyTargetClass` を更新する。このテストは未分類のターゲットidで意図的に失敗するため、新しいクラスが静かにスキップされることはない。

## 関連

- [ライブテスト](/ja-JP/help/testing-live)
- [CI](/ja-JP/ci)
