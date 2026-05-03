---
read_when:
    - ローカルまたは CI でテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway + エージェント動作のデバッグ
summary: 'テストキット: 単体/e2e/ライブスイート、Docker ランナー、各テストがカバーする内容'
title: テスト
x-i18n:
    generated_at: "2026-05-03T21:34:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート（ユニット/統合、E2E、ライブ）と小規模な Docker ランナー群があります。このドキュメントは「テスト方法」のガイドです。

- 各スイートがカバーする内容（および意図的にカバー_しない_内容）。
- よくあるワークフロー（ローカル、プッシュ前、デバッグ）で実行するコマンド。
- ライブテストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダー問題に対するリグレッションを追加する方法。

<Note>
**QA スタック（qa-lab、qa-channel、ライブトランスポートレーン）**は別途ドキュメント化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — アーキテクチャ、コマンドサーフェス、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) — `pnpm openclaw qa matrix` のリファレンス。
- [QA チャンネル](/ja-JP/channels/qa-channel) — リポジトリベースのシナリオで使う合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行を扱います。以下の QA 固有ランナーのセクション（[QA 固有ランナー](#qa-specific-runners)）では、具体的な `qa` 呼び出しを列挙し、上記のリファレンスに戻れるようにしています。
</Note>

## クイックスタート

ほとんどの日は次のとおりです。

- フルゲート（プッシュ前に期待されるもの）: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカルフルスイート実行: `pnpm test:max`
- 直接の Vitest ウォッチループ: `pnpm test:watch`
- 直接のファイル指定は拡張/チャンネルのパスにもルーティングされるようになりました: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復調査しているときは、まず対象を絞った実行を優先します。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストを触った場合や追加の確信がほしい場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグする場合（実際の認証情報が必要）:

- ライブスイート（モデル + Gateway ツール/画像プローブ）: `pnpm test:live`
- 1 つのライブファイルを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- ランタイム性能レポート: 実際の `openai/gpt-5.4` エージェントターンには `live_gpt54=true`、Kova の CPU/ヒープ/トレース成果物には `deep_profile=true` を指定して `OpenClaw Performance` をディスパッチします。日次のスケジュール実行は、`CLAWGRIT_REPORTS_TOKEN` が設定されている場合、モックプロバイダー、deep-profile、GPT 5.4 レーンの成果物を `openclaw/clawgrit-reports` に公開します。モックプロバイダーレポートには、ソースレベルの Gateway 起動、メモリ、Plugin 負荷、反復 fake-model hello ループ、CLI 起動時間の数値も含まれます。
- Docker ライブモデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルでは、テキストターンに加えて小さなファイル読み取り形式のプローブが実行されます。メタデータで `image` 入力が示されているモデルでは、小さな画像ターンも実行されます。プロバイダーの失敗を切り分ける場合は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効化します。
  - CI カバレッジ: 日次の `OpenClaw Scheduled Live And E2E Checks` と手動の `OpenClaw Release Checks` はどちらも、`include_live_suites: true` を指定して再利用可能なライブ/E2E ワークフローを呼び出します。これにはプロバイダーごとにシャードされた個別の Docker ライブモデルマトリックスジョブが含まれます。
  - 集中的な CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して `OpenClaw Live And E2E Checks (Reusable)` をディスパッチします。
  - 高シグナルな新しいプロバイダーシークレットは、`scripts/ci-hydrate-live-auth.sh` に加え、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` とそのスケジュール/リリース呼び出し元に追加します。
- ネイティブ Codex バインドチャットスモーク: `pnpm test:docker:live-codex-bind`
  - Codex app-server パスに対して Docker ライブレーンを実行し、`/codex bind` で合成 Slack DM をバインドし、`/codex fast` と `/codex permissions` を実行したうえで、通常の返信と画像添付が ACP ではなくネイティブ Plugin バインディングを通ってルーティングされることを検証します。
- Codex app-server ハーネススモーク: `pnpm test:docker:live-codex-harness`
  - Plugin が所有する Codex app-server ハーネスを通じて Gateway エージェントターンを実行し、`/codex status` と `/codex models` を検証します。デフォルトでは、画像、cron MCP、サブエージェント、Guardian プローブも実行します。他の Codex app-server の失敗を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` でサブエージェントプローブを無効化します。サブエージェントだけを集中的に確認する場合は、他のプローブを無効化します: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、これはサブエージェントプローブの後に終了します。
- Crestodian レスキューコマンドスモーク: `pnpm test:live:crestodian-rescue-channel`
  - メッセージチャンネルのレスキューコマンドサーフェスに対するオプトインの念押しチェックです。`/crestodian status` を実行し、永続的なモデル変更をキューに入れ、`/crestodian yes` に返信し、監査/設定書き込みパスを検証します。
- Crestodian プランナー Docker スモーク: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に偽の Claude CLI を持つ設定なしコンテナで Crestodian を実行し、ファジープランナーのフォールバックが監査済みの型付き設定書き込みに変換されることを検証します。
- Crestodian 初回実行 Docker スモーク: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw 状態ディレクトリから開始し、素の `openclaw` を Crestodian にルーティングし、セットアップ/モデル/エージェント/Discord Plugin + SecretRef 書き込みを適用し、設定を検証し、監査エントリを検証します。同じ Ring 0 セットアップパスは QA Lab でも `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi コストスモーク: `MOONSHOT_API_KEY` を設定した状態で、`openclaw models list --provider moonshot --json` を実行し、その後 `moonshot/kimi-k2.6` に対して分離された `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` を実行します。JSON が Moonshot/K2.6 を報告し、アシスタントのトランスクリプトが正規化された `usage.cost` を保存していることを検証します。

<Tip>
失敗ケースが 1 つだけ必要な場合は、以下で説明する allowlist 環境変数でライブテストを絞り込むことを優先してください。
</Tip>

## QA 固有ランナー

QA-lab の現実性が必要な場合、これらのコマンドはメインのテストスイートの横に位置します。

CI は専用ワークフローで QA Lab を実行します。エージェント型パリティは単独の PR ワークフローではなく、`QA-Lab - All Lanes` とリリース検証の下にネストされています。広範な検証では、`rerun_group=qa-parity` または release-checks QA グループを指定して `Full Release Validation` を使うべきです。`QA-Lab - All Lanes` は、`main` 上の夜間実行と手動ディスパッチで、モックパリティレーン、ライブ Matrix レーン、Convex 管理のライブ Telegram レーン、Convex 管理のライブ Discord レーンを並列ジョブとして実行します。スケジュール QA とリリースチェックは Matrix に明示的に `--profile fast` を渡しますが、Matrix CLI と手動ワークフロー入力のデフォルトは `all` のままです。手動ディスパッチでは、`all` を `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャードできます。`OpenClaw Release Checks` はリリース承認前にパリティに加えて高速 Matrix と Telegram レーンを実行し、リリーストランスポートチェックには `mock-openai/gpt-5.5` を使用するため、決定的に保たれ、通常のプロバイダー Plugin 起動を回避できます。これらのライブトランスポート Gateway はメモリ検索を無効化します。メモリ動作は QA パリティスイートで引き続きカバーされます。

フルリリースのライブメディアシャードは `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。このイメージにはすでに `ffmpeg` と `ffprobe` が含まれています。Docker ライブモデル/バックエンドシャードは、選択されたコミットごとに 1 回だけビルドされる共有の `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各シャード内で再ビルドする代わりに `OPENCLAW_SKIP_DOCKER_BUILD=1` でそれを pull します。

- `pnpm openclaw qa suite`
  - リポジトリに基づく QA シナリオをホスト上で直接実行します。
  - 選択された複数のシナリオを、分離された
    Gateway ワーカーでデフォルトで並列実行します。`qa-channel` のデフォルト同時実行数は 4 です（選択された
    シナリオ数を上限とします）。ワーカー数を調整するには `--concurrency <count>` を使用し、
    以前のシリアルレーンには `--concurrency 1` を使用します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物が必要な場合は
    `--allow-failures` を使用します。
  - provider モード `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、シナリオ対応の
    `mock-openai` レーンを置き換えずに、実験的な
    fixture とプロトコルモックのカバレッジ用にローカルの AIMock ベース provider サーバーを起動します。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチに加え、小さなモック QA Lab シナリオパック
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`）を実行し、結合された CPU 観測
    サマリーを `.artifacts/gateway-cpu-scenarios/` 配下に書き込みます。
  - デフォルトでは持続的な高 CPU 観測のみをフラグします（`--cpu-core-warn`
    と `--hot-wall-warn-ms`）。そのため短い起動時バーストは、数分間続く Gateway 固定化回帰のように見えずにメトリクスとして記録されます。
  - ビルド済みの `dist` 成果物を使用します。チェックアウトに新しいランタイム出力がまだない場合は、
    先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 同じ QA スイートを、使い捨ての Multipass Linux VM 内で実行します。
  - ホスト上の `qa suite` と同じシナリオ選択の挙動を維持します。
  - `qa suite` と同じ provider/model 選択フラグを再利用します。
  - ライブ実行では、ゲストで実用的なサポート対象の QA 認証入力を転送します:
    env ベースの provider キー、QA ライブ provider 設定パス、および存在する場合は `CODEX_HOME`。
  - 出力ディレクトリはリポジトリルート配下に留める必要があります。これにより、ゲストがマウントされたワークスペースを通じて書き戻せます。
  - 通常の QA レポートとサマリーに加え、Multipass ログを
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター形式の QA 作業用に Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内にグローバルインストールし、
    非対話型の OpenAI API キー オンボーディングを実行し、デフォルトで Telegram を設定し、
    パッケージ化された Plugin ランタイムが起動時の依存関係修復なしで読み込まれることを検証し、
    doctor を実行し、モックされた OpenAI エンドポイントに対してローカル agent turn を 1 回実行します。
  - 同じパッケージ化インストールレーンを Discord で実行するには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用します。
- `pnpm test:docker:session-runtime-context`
  - 組み込みランタイムコンテキスト transcript 用の決定的なビルド済みアプリ Docker smoke を実行します。非表示の OpenClaw ランタイムコンテキストが、表示される user turn に漏れずに、非表示のカスタムメッセージとして永続化されることを検証し、その後、影響を受ける壊れたセッション JSONL を seed して、
    `openclaw doctor --fix` がバックアップ付きで active branch に書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - OpenClaw パッケージ候補を Docker にインストールし、インストール済みパッケージの
    オンボーディングを実行し、インストール済み CLI を通じて Telegram を設定し、その後、そのインストール済みパッケージを SUT Gateway として使用して
    ライブ Telegram QA レーンを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。レジストリからインストールする代わりに
    解決済みのローカル tarball をテストするには、`OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定します。
  - `pnpm openclaw qa telegram` と同じ Telegram env 認証情報または Convex 認証情報ソースを使用します。
    CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて
    `OPENCLAW_QA_CONVEX_SITE_URL` と role secret を設定します。
    `OPENCLAW_QA_CONVEX_SITE_URL` と Convex role secret が CI に存在する場合、
    Docker ラッパーは Convex を自動的に選択します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンでのみ共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions はこのレーンを手動の maintainer ワークフロー
    `NPM Telegram Beta E2E` として公開します。merge 時には実行されません。このワークフローは
    `qa-live-shared` environment と Convex CI credential lease を使用します。
- GitHub Actions は、1 つの候補パッケージに対するサイドラン製品証明用に `Package Acceptance` も公開します。信頼済み ref、公開済み npm spec、
  HTTPS tarball URL と SHA-256、または別の実行からの tarball artifact を受け付け、
  正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、その後、
  既存の Docker E2E スケジューラーを smoke、package、product、full、または custom
  レーンプロファイルで実行します。同じ `package-under-test` artifact に対して
  Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定します。
  - 最新 beta 製品証明:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL 証明には digest が必要です:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- artifact 証明では、別の Actions 実行から tarball artifact をダウンロードします:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI を設定した状態で Gateway
    を起動し、その後、設定編集によってバンドルされたチャンネル/plugins を有効にします。
  - setup discovery が未設定のダウンロード可能 Plugin を不在のままにすること、
    最初に設定された doctor repair が不足している各ダウンロード可能
    Plugin を明示的にインストールすること、2 回目の restart では隠れた依存関係
    repair が実行されないことを検証します。
  - さらに、既知の古い npm baseline をインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補の
    post-update doctor が harness 側の postinstall repair なしでレガシー Plugin 依存関係の残骸を消去することを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージ化インストール update smoke を実行します。選択された各
    プラットフォームは、まず要求された baseline パッケージをインストールし、その後同じゲスト内で
    インストール済みの `openclaw update` コマンドを実行し、インストール済み version、update status、Gateway readiness、ローカル agent turn 1 回を検証します。
  - 1 つのゲストで反復する間は `--platform macos`、`--platform windows`、または `--platform linux` を使用します。サマリー artifact path と
    レーンごとの status には `--json` を使用します。
  - OpenAI レーンは、デフォルトでライブ agent-turn 証明に `openai/gpt-5.5` を使用します。
    別の OpenAI model を意図的に検証する場合は、`--model <provider/model>` を渡すか、
    `OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels transport の停止が残りのテスト時間を消費しないように、長いローカル実行はホスト timeout でラップします:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - このスクリプトは、ネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。
    外側のラッパーがハングしていると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log`
    を確認してください。
  - Windows update は、cold guest では post-update doctor と package
    update 作業に 10 分から 15 分かかることがあります。ネストされた npm
    debug log が進行していれば、それでも正常です。
  - この集約ラッパーを、個別の Parallels
    macOS、Windows、または Linux smoke レーンと並列実行しないでください。これらは VM 状態を共有しており、
    snapshot restore、package serving、または guest Gateway 状態で衝突する可能性があります。
  - post-update 証明は通常のバンドル Plugin surface を実行します。これは、
    speech、image generation、media
    understanding などの capability facade が、agent turn 自体は単純なテキスト応答だけを確認する場合でも、バンドルされたランタイム API を通じて読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接の protocol smoke testing 用に、ローカル AIMock provider server のみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker ベース Tuwunel homeserver に対して Matrix ライブ QA レーンを実行します。source-checkout のみです。パッケージ化インストールには `qa-lab` は含まれません。
  - 完全な CLI、profile/scenario catalog、env vars、artifact layout: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - env の driver bot token と SUT bot token を使用して、実際のプライベートグループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、および `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。group id は数値の Telegram chat id である必要があります。
  - 共有プール済み認証情報用に `--credential-source convex` をサポートします。デフォルトでは env mode を使用し、プール済み lease を有効にするには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - いずれかのシナリオが失敗すると非ゼロで終了します。失敗終了コードなしで成果物が必要な場合は
    `--allow-failures` を使用します。
  - 同じプライベートグループ内に 2 つの異なる bot が必要で、SUT bot は Telegram username を公開している必要があります。
  - 安定した bot-to-bot 観測のため、両方の bot で `@BotFather` の Bot-to-Bot Communication Mode を有効にし、driver bot が group bot traffic を観測できることを確認してください。
  - Telegram QA レポート、サマリー、observed-messages artifact を `.artifacts/qa-e2e/...` 配下に書き込みます。replying scenario には、driver send request から観測された SUT reply までの RTT が含まれます。

ライブ transport レーンは、新しい transport がずれないように 1 つの標準 contract を共有します。レーンごとの coverage matrix は [QA 概要 → ライブ transport カバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な synthetic suite であり、その matrix の一部ではありません。

### Convex 経由の共有 Telegram 認証情報 (v1)

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、
QA lab は Convex ベースの pool から排他的 lease を取得し、レーンの実行中はその lease に Heartbeat を送り、shutdown 時に lease を解放します。

参照用 Convex project scaffold:

- `qa/convex-credential-broker/`

必須 env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択された role 用の secret 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- Credential role selection:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI ではデフォルトで `ci`、それ以外では `maintainer`）

任意の env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（デフォルト `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（デフォルト `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（デフォルト `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（デフォルト `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（デフォルト `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意の trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル限定開発用に loopback `http://` Convex URL を許可します。

`OPENCLAW_QA_CONVEX_SITE_URL` は通常運用では `https://` を使用する必要があります。

Maintainer admin command（pool add/remove/list）には、特に
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

maintainer 用 CLI helper:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、Convex site URL、broker secrets、
endpoint prefix、HTTP timeout、admin/list reachability を、secret 値を出力せずに確認します。
script と CI
utility で機械可読 output が必要な場合は `--json` を使用します。

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
  - アクティブなリースのガード: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（メンテナーシークレットのみ）
  - リクエスト: `{ kind?, status?, includePayload?, limit? }`
  - 成功: `{ status: "ok", credentials, count }`

Telegram kind のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` に対してこの形状を検証し、不正な形式のペイロードを拒否します。

### QA にチャンネルを追加する

新しいチャンネルアダプターのアーキテクチャとシナリオヘルパー名は、[QA 概要 → チャンネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最低限必要なことは、共有 `qa-lab` ホストシーム上にトランスポートランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成することです。

## テストスイート（どこで何が実行されるか）

スイートは「リアリズムが増す」（そして不安定さ/コストも増す）ものとして考えてください。

### ユニット / 統合（デフォルト）

- コマンド: `pnpm test`
- 設定: ターゲット未指定の実行では `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクト単位の設定へ展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、`test/**/*.test.ts` 配下のコア/ユニットインベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- スコープ:
  - 純粋なユニットテスト
  - プロセス内統合テスト（Gateway 認証、ルーティング、ツール、パース、設定）
  - 既知のバグに対する決定的な回帰テスト
- 期待事項:
  - CI で実行される
  - 実キーは不要
  - 高速で安定しているべき
  - リゾルバーと公開サーフェスのローダーテストは、実際のバンドル済み Plugin ソース API ではなく、生成された小さな Plugin フィクスチャを使って、広範な `api.js` と `runtime-api.js` のフォールバック動作を証明する必要があります。実際の Plugin API ロードは、Plugin 所有の契約/統合スイートに属します。

<AccordionGroup>
  <Accordion title="プロジェクト、シャード、スコープ付きレーン">

    - ターゲット未指定の `pnpm test` は、巨大な単一のネイティブルートプロジェクトプロセスではなく、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、負荷の高いマシンでのピーク RSS が下がり、auto-reply/拡張機能の処理が無関係なスイートを圧迫するのを避けられます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。マルチシャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーン経由でルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで安価なスコープ付きレーンへ展開します。対象は、直接編集されたテスト、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフ依存です。設定/セットアップ/パッケージ編集では、明示的に `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用しない限り、広範なテスト実行は行いません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートローカルチェックゲートです。diff をコア、コアテスト、拡張機能、拡張機能テスト、アプリ、ドキュメント、リリースメタデータ、ライブ Docker ツール、ツールに分類し、対応する型チェック、lint、ガードコマンドを実行します。Vitest テストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。リリースメタデータのみのバージョン更新では、ターゲットを絞ったバージョン/設定/ルート依存チェックを実行し、トップレベルのバージョンフィールド以外のパッケージ変更を拒否するガードを含みます。
    - ライブ Docker ACP ハーネスの編集では、ライブ Docker 認証スクリプトのシェル構文と、ライブ Docker スケジューラーのドライランに絞ったチェックを実行します。`package.json` の変更は、diff が `scripts["test:docker:live-*"]` に限定される場合にのみ含まれます。依存関係、export、バージョン、その他のパッケージサーフェス編集では、引き続きより広範なガードを使用します。
    - agents、commands、plugins、auto-reply ヘルパー、`plugin-sdk`、および同様の純粋なユーティリティ領域からの import が軽いユニットテストは、`unit-fast` レーンを通ります。このレーンは `test/setup-openclaw-runtime.ts` をスキップします。状態を持つファイルやランタイム負荷の高いファイルは既存のレーンに留まります。
    - 選択された `plugin-sdk` と `commands` のヘルパーソースファイルも、変更モードの実行をそれらの軽量レーン内の明示的な兄弟テストへマッピングするため、ヘルパー編集時にそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルのコアヘルパー、トップレベルの `reply.*` 統合テスト、`src/auto-reply/reply/**` サブツリー向けの専用バケットがあります。CI ではさらに、reply サブツリーを agent-runner、dispatch、commands/state-routing シャードに分割し、import 負荷の高い 1 つのバケットが Node のテール全体を占有しないようにしています。
    - 通常の PR/main CI は、拡張機能の一括スイープとリリース専用の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補に対して Plugin/拡張機能の負荷が高いそれらのスイートを実行するため、別個の `Plugin Prerelease` 子ワークフローをディスパッチします。

  </Accordion>

  <Accordion title="埋め込みランナーのカバレッジ">

    - メッセージツールの検出入力または Compaction ランタイムコンテキストを変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋なルーティングと正規化の境界に対する、焦点を絞ったヘルパー回帰テストを追加してください。
    - 埋め込みランナー統合スイートを正常な状態に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`、および
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付き ID と Compaction の動作が実際の `run.ts` / `compact.ts` パスを通って引き続き流れることを検証します。ヘルパーのみのテストは、それらの統合パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest プールと分離のデフォルト">

    - ベース Vitest 設定のデフォルトは `threads` です。
    - 共有 Vitest 設定は `isolate: false` を固定し、ルートプロジェクト、e2e、ライブ設定全体で非分離ランナーを使用します。
    - ルート UI レーンは `jsdom` セットアップとオプティマイザーを維持しますが、共有の非分離ランナー上でも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest 設定から同じ `threads` + `isolate: false` のデフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 コンパイル churn を減らすため、Vitest 子 Node プロセスにデフォルトで `--no-maglev` を追加します。標準の V8 動作と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は diff がどのアーキテクチャレーンをトリガーするかを表示します。
    - pre-commit フックはフォーマットのみです。フォーマット済みファイルを再ステージし、lint、型チェック、テストは実行しません。
    - スマートローカルチェックゲートが必要な場合は、引き渡しまたは push の前に `pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで安価なスコープ付きレーンを通ります。エージェントがハーネス、設定、パッケージ、または契約の編集に本当に広い Vitest カバレッジが必要だと判断した場合にのみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は、同じルーティング動作を維持しつつ、worker 上限だけを高くします。
    - ローカル worker の自動スケーリングは意図的に保守的で、ホストのロードアベレージがすでに高い場合は後退するため、複数の Vitest 実行が並行していてもデフォルトでは影響を抑えます。
    - ベース Vitest 設定は、テスト配線が変わったときに変更モードの再実行が正しく保たれるよう、プロジェクト/設定ファイルを `forceRerunTriggers` としてマークします。
    - 設定は、サポート対象ホストで `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接プロファイリング用に明示的なキャッシュ場所を 1 つ指定したい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="パフォーマンスデバッグ">

    - `pnpm test:perf:imports` は、Vitest の import 所要時間レポートと import-breakdown 出力を有効にします。
    - `pnpm test:perf:imports:changed` は、同じプロファイリングビューを `origin/main` 以降に変更されたファイルにスコープします。
    - シャードのタイミングデータは `.artifacts/vitest-shard-timings.json` に書き込まれます。設定全体の実行では設定パスをキーとして使用します。include-pattern CI シャードでは、フィルター済みシャードを個別に追跡できるようシャード名を追加します。
    - 1 つのホットなテストが依然として起動時 import にほとんどの時間を費やしている場合は、重い依存関係を狭いローカル `*.runtime.ts` シームの背後に置き、ランタイムヘルパーを `vi.mock(...)` に通すためだけに深く import するのではなく、そのシームを直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、コミット済み diff に対するルーティング済み `test:changed` とネイティブルートプロジェクトパスを比較し、ウォールタイムと macOS 最大 RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、変更ファイルリストを `scripts/test-projects.mjs` とルート Vitest 設定へルーティングすることで、現在の dirty tree をベンチマークします。
    - `pnpm test:perf:profile:main` は、Vitest/Vite の起動と変換オーバーヘッドに対するメインスレッド CPU プロファイルを書き出します。
    - `pnpm test:perf:profile:runner` は、ファイル並列を無効にしたユニットスイートの runner CPU+heap プロファイルを書き出します。

  </Accordion>
</AccordionGroup>

### 安定性（Gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 worker に強制
- スコープ:
  - 診断をデフォルトで有効にした実際の loopback Gateway を起動する
  - 診断イベントパスを通じて、合成 gateway メッセージ、メモリ、大きなペイロードの churn を駆動する
  - Gateway WS RPC 経由で `diagnostics.stability` をクエリする
  - 診断安定性バンドルの永続化ヘルパーをカバーする
  - レコーダーが上限内に留まり、合成 RSS サンプルが圧力予算内に収まり、セッションごとのキュー深度がゼロへ戻ることをアサートする
- 期待事項:
  - CI セーフでキー不要
  - 安定性回帰のフォローアップ向けの狭いレーンであり、Gateway スイート全体の代替ではない

### E2E（Gateway スモーク）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E テスト
- ランタイムデフォルト:
  - リポジトリの他の部分と同様に、Vitest `threads` を `isolate: false` で使用します。
  - 適応型 worker を使用します（CI: 最大 2、ローカル: デフォルトで 1）。
  - コンソール I/O オーバーヘッドを減らすため、デフォルトで silent モードで実行します。
- 便利な上書き:
  - worker 数を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - 詳細なコンソール出力を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - 複数インスタンス Gateway のエンドツーエンド動作
  - WebSocket/HTTP サーフェス、node ペアリング、より重いネットワーキング
- 期待事項:
  - CI で実行される（パイプラインで有効な場合）
  - 実キーは不要
  - ユニットテストより可動部分が多い（遅くなる場合があります）

### E2E: OpenShell バックエンドスモーク

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由でホスト上に分離された OpenShell gateway を開始する
  - 一時的なローカル Dockerfile からサンドボックスを作成する
  - 実際の `sandbox ssh-config` + SSH exec を通じて OpenClaw の OpenShell バックエンドを実行する
  - サンドボックス fs ブリッジを通じてリモート正規ファイルシステム動作を検証する
- 期待事項:
  - オプトインのみ。デフォルトの `pnpm test:e2e` 実行には含まれない
  - ローカルの `openshell` CLI と動作中の Docker デーモンが必要
  - 分離された `HOME` / `XDG_CONFIG_HOME` を使用し、その後テスト Gateway とサンドボックスを破棄する
- 便利なオーバーライド:
  - 広範な e2e スイートを手動で実行するときにテストを有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - デフォルト以外の CLI バイナリまたはラッパースクリプトを指すには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### ライブ（実プロバイダー + 実モデル）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下のバンドル Plugin ライブテスト
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「このプロバイダー/モデルは、実際の認証情報で _今日_ 本当に動作するか？」
  - プロバイダー形式の変更、ツール呼び出しの癖、認証の問題、レート制限の挙動を検出する
- 期待事項:
  - 設計上 CI 安定ではない（実ネットワーク、実プロバイダーポリシー、クォータ、障害）
  - 費用がかかる / レート制限を使用する
  - 「すべて」ではなく、範囲を絞ったサブセットの実行を優先する
- ライブ実行では、不足している API キーを取得するために `~/.profile` を読み込む。
- デフォルトでは、ライブ実行でも `HOME` を分離し、設定/認証素材を一時テストホームにコピーするため、ユニットフィクスチャが実際の `~/.openclaw` を変更することはできない。
- ライブテストで実際のホームディレクトリを意図的に使用する必要がある場合にのみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定する。
- `pnpm test:live` は現在、より静かなモードをデフォルトにしている。`[live] ...` の進捗出力は維持するが、追加の `~/.profile` 通知を抑制し、Gateway ブートストラップログ/Bonjour の出力をミュートする。完全な起動ログを戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定する。
- API キーローテーション（プロバイダー固有）: カンマ/セミコロン形式の `*_API_KEYS`、または `*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）、または `OPENCLAW_LIVE_*_KEY` によるライブごとのオーバーライドを設定する。テストはレート制限レスポンス時に再試行する。
- 進捗/Heartbeat 出力:
  - 長いプロバイダー呼び出しが、Vitest のコンソールキャプチャが静かな場合でもアクティブであることが見えるように、ライブスイートは stderr に進捗行を出力するようになった。
  - `vitest.live.config.ts` は Vitest のコンソールインターセプトを無効化し、ライブ実行中にプロバイダー/Gateway の進捗行が即座にストリームされるようにする。
  - ダイレクトモデルの Heartbeat は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整する。
  - Gateway/プローブの Heartbeat は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整する。

## どのスイートを実行すべきか？

この判断表を使用する:

- ロジック/テストを編集している: `pnpm test` を実行する（多く変更した場合は `pnpm test:coverage` も）
- Gateway ネットワーキング / WS プロトコル / ペアリングに触れている: `pnpm test:e2e` を追加する
- 「自分のボットが落ちている」/ プロバイダー固有の失敗 / ツール呼び出しをデバッグしている: 範囲を絞った `pnpm test:live` を実行する

## ライブ（ネットワークに触れる）テスト

ライブモデル行列、CLI バックエンドスモーク、ACP スモーク、Codex アプリサーバー
ハーネス、すべてのメディアプロバイダーライブテスト（Deepgram、BytePlus、ComfyUI、画像、
音楽、動画、メディアハーネス）、およびライブ実行の認証情報処理については、
[ライブスイートのテスト](/ja-JP/help/testing-live)を参照。専用の更新と
Plugin 検証チェックリストについては、
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つのカテゴリに分かれる:

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリ Docker イメージ内で対応するプロファイルキーのライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカル設定ディレクトリとワークスペースをマウントする（マウントされている場合は `~/.profile` も読み込む）。対応するローカルエントリーポイントは `test:live:models-profiles` と `test:live:gateway-profiles`。
- Docker ライブランナーは、Docker 全体のスイープを実用的に保つため、デフォルトで小さめのスモーク上限を使用する:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。より大きな網羅的スキャンを明示的に望む場合は、これらの環境変数をオーバーライドする。
- `test:docker:all` は `test:docker:live-build` 経由でライブ Docker イメージを一度ビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度パックし、その後 2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用する。ベアイメージは install/update/Plugin 依存関係レーン用の Node/Git ランナーのみであり、これらのレーンは事前ビルド済み tarball をマウントする。機能イメージは、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールする。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行する。集約は重み付きローカルスケジューラーを使用する。`OPENCLAW_DOCKER_ALL_PARALLELISM` がプロセススロットを制御し、リソース上限により重いライブ、npm インストール、マルチサービスレーンがすべて同時に開始しないようにする。単一のレーンがアクティブな上限より重い場合でも、プールが空であればスケジューラーはそれを開始でき、その後、再び容量が利用可能になるまで単独で実行し続ける。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`。Docker ホストに余裕がある場合にのみ、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整する。ランナーはデフォルトで Docker プリフライトを実行し、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを出力し、成功したレーンのタイミングを `.artifacts/docker-tests/lane-timings.json` に保存し、以降の実行でそれらのタイミングを使用して長いレーンを先に開始する。Docker をビルドまたは実行せずに重み付きレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、選択されたレーン、パッケージ/イメージ要件、認証情報の CI プランを出力するには `node scripts/test-docker-all.mjs --plan-json` を使用する。
- `Package Acceptance` は、「このインストール可能な tarball は製品として動作するか？」を確認する GitHub ネイティブのパッケージゲート。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から 1 つの候補パッケージを解決し、それを `package-under-test` としてアップロードし、選択された ref を再パックする代わりに、その正確な tarball に対して再利用可能な Docker E2E レーンを実行する。プロファイルは網羅範囲順に `smoke`、`package`、`product`、`full`。パッケージ/更新/Plugin コントラクト、公開済みアップグレード生存行列、リリースデフォルト、失敗トリアージについては、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)を参照。
- ビルドおよびリリースチェックは、tsdown 後に `scripts/check-cli-bootstrap-imports.mjs` を実行する。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的ビルドグラフをたどり、コマンドディスパッチ前の起動処理が Commander、プロンプト UI、undici、ロギングなどのパッケージ依存関係をプリディスパッチで import している場合に失敗する。また、バンドルされた Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的 import を拒否する。パッケージ化された CLI スモークは、ルートヘルプ、オンボードヘルプ、doctor ヘルプ、status、config schema、model-list コマンドもカバーする。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限される。そのカットオフまでは、ハーネスは出荷済みパッケージのメタデータ欠落のみを許容する。省略されたプライベート QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落したパッチファイル、欠落した永続化 `update.channel`、レガシー Plugin インストール記録の場所、欠落したマーケットプレイスインストール記録の永続化、`plugins update` 中の設定メタデータ移行。`2026.4.25` より後のパッケージでは、これらのパスは厳密な失敗になる。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:published-upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、`test:docker:plugin-lifecycle-matrix`、および `test:docker:config-reload` は、1 つ以上の実コンテナを起動し、より上位の統合パスを検証する。

ライブモデル Docker ランナーは、必要な CLI 認証ホームのみ（または実行が絞り込まれていない場合はサポート対象のすべて）も bind mount し、実行前にそれらをコンテナホームにコピーするため、外部 CLI の OAuth はホストの認証ストアを変更せずにトークンを更新できる:

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind` (スクリプト: `scripts/test-live-acp-bind-docker.sh`; 既定で Claude、Codex、Gemini をカバーし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` で厳密な Droid/OpenCode カバレッジを提供)
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend` (スクリプト: `scripts/test-live-cli-backend-docker.sh`)
- Codex アプリサーバーハーネススモーク: `pnpm test:docker:live-codex-harness` (スクリプト: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev エージェント: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- オブザーバビリティスモーク: `pnpm qa:otel:smoke` はプライベートな QA ソースチェックアウトレーンです。npm tarball では QA Lab が省略されるため、意図的にパッケージ Docker リリースレーンには含めていません。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui` (スクリプト: `scripts/e2e/openwebui-docker.sh`)
- オンボーディングウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- Npm tarball オンボーディング/チャンネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パックされた OpenClaw tarball を Docker 内にグローバルインストールし、env-ref オンボーディングで OpenAI を設定し、既定で Telegram も設定し、doctor を実行して、モックされた OpenAI エージェントターンを 1 回実行します。事前ビルド済み tarball を再利用するには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホスト再ビルドをスキップするには `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` を使い、チャンネルを切り替えるには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使います。
- 更新チャンネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パックされた OpenClaw tarball を Docker 内にグローバルインストールし、パッケージ `stable` から git `dev` に切り替え、永続化されたチャンネルと更新後の Plugin 動作を検証し、その後パッケージ `stable` に戻して更新ステータスを確認します。
- アップグレードサバイバースモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャンネル設定、Plugin 許可リスト、古い Plugin 依存関係状態、既存のワークスペース/セッションファイルを含む汚れた旧ユーザーフィクスチャの上に、パックされた OpenClaw tarball をインストールします。ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話型 doctor を実行し、その後ループバック Gateway を起動して、設定/状態の保持に加えて起動/ステータス予算を確認します。
- 公開済みアップグレードサバイバースモーク: `pnpm test:docker:published-upgrade-survivor` は既定で `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、組み込みのコマンドレシピでそのベースラインを設定し、結果の設定を検証し、その公開済みインストールを候補 tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後ループバック Gateway を起動して、設定済みインテント、状態保持、起動、`/healthz`、`/readyz`、RPC ステータス予算を確認します。1 つのベースラインを上書きするには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` を使い、集約スケジューラに正確なベースライン展開を求めるには `all-since-2026.4.23` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` を使い、issue 形状のフィクスチャを展開するには `reported-issues` のような `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` を使います。reported-issues セットには、外部 OpenClaw Plugin インストールの自動修復用に `configured-plugin-installs` が含まれます。Package Acceptance では、これらは `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開されます。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、隠しランタイムコンテキストのトランスクリプト永続化に加え、影響を受けた重複プロンプト書き換えブランチの doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は現在のツリーをパックし、隔離されたホームで `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングせずにバンドル済み画像プロバイダーを返すことを検証します。事前ビルド済み tarball を再利用するには `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使い、ホストビルドをスキップするには `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` を使い、ビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使います。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、更新、direct-npm の各コンテナ間で 1 つの npm キャッシュを共有します。更新スモークは、候補 tarball にアップグレードする前の stable ベースラインとして、既定で npm `latest` を使います。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きします。非 root インストーラーチェックは、root 所有のキャッシュエントリがユーザーローカルのインストール動作を隠さないように、隔離された npm キャッシュを保持します。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` で重複する direct-npm グローバル更新をスキップします。直接の `npm install -g` カバレッジが必要な場合は、その env なしでローカルにスクリプトを実行してください。
- エージェント削除共有ワークスペース CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) は既定でルート Dockerfile イメージをビルドし、隔離されたコンテナホームに 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行して、有効な JSON と保持されたワークスペース動作を検証します。install-smoke イメージを再利用するには `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使います。
- Gateway ネットワーキング (2 コンテナ、WS 認証 + ヘルス): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- ブラウザー CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) はソース E2E イメージと Chromium レイヤーをビルドし、生の CDP で Chromium を起動し、`browser doctor --deep` を実行して、CDP ロールスナップショットがリンク URL、カーソル昇格されたクリック可能要素、iframe 参照、フレームメタデータをカバーすることを検証します。
- OpenAI Responses web_search 最小推論リグレッション: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) はモックされた OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後プロバイダースキーマ拒否を強制して、生の詳細が Gateway ログに現れることを確認します。
- MCP チャンネルブリッジ (シード済み Gateway + stdio ブリッジ + 生の Claude 通知フレームスモーク): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- Pi バンドル MCP ツール (実際の stdio MCP サーバー + 埋め込み Pi プロファイルの allow/deny スモーク): `pnpm test:docker:pi-bundle-mcp-tools` (スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/サブエージェント MCP クリーンアップ (実際の Gateway + 隔離された cron とワンショットサブエージェント実行後の stdio MCP 子プロセス終了): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (ローカルパス、`file:`、hoisted 依存関係を持つ npm レジストリ、git moving refs、ClawHub kitchen-sink、マーケットプレイス更新、Claude バンドル enable/inspect のインストール/更新スモーク): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、既定の kitchen-sink パッケージ/ランタイムペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を使います。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、このテストは hermetic なローカル ClawHub フィクスチャサーバーを使用します。
- Plugin 更新未変更スモーク: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin ライフサイクルマトリックススモーク: `pnpm test:docker:plugin-lifecycle-matrix` は、裸のコンテナにパックされた OpenClaw tarball をインストールし、npm Plugin をインストールし、enable/disable を切り替え、ローカル npm レジストリ経由でアップグレードおよびダウングレードし、インストール済みコードを削除し、その後アンインストールが古い状態を引き続き削除することを検証しながら、各ライフサイクルフェーズの RSS/CPU メトリクスをログに記録します。
- 設定リロードメタデータスモーク: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` は、ローカルパス、`file:`、hoisted 依存関係を持つ npm レジストリ、git moving refs、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドル enable/inspect のインストール/更新スモークをカバーします。`pnpm test:docker:plugin-update` は、インストール済み Plugin の未変更更新動作をカバーします。`pnpm test:docker:plugin-lifecycle-matrix` は、リソース追跡付き npm Plugin のインストール、enable、disable、アップグレード、ダウングレード、欠落コードのアンインストールをカバーします。

共有機能イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがまだローカルにない場合に pull します。QR とインストーラーの Docker テストは、共有ビルド済みアプリランタイムではなくパッケージ/インストール動作を検証するため、独自の Dockerfile を保持します。

ライブモデル用の Docker ランナーは、現在のチェックアウトも読み取り専用で bind mount し、コンテナ内の一時 workdir にステージします。これにより、ランタイムイメージを小さく保ちながら、正確なローカルソース/設定に対して Vitest を実行できます。ステージング手順では、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build` や Gradle 出力ディレクトリなど、大きなローカル専用キャッシュやアプリのビルド出力をスキップするため、Docker のライブ実行がマシン固有の成果物のコピーに何分も費やすことはありません。また、コンテナ内で Gateway のライブプローブが実際の Telegram/Discord などのチャネルワーカーを起動しないように、`OPENCLAW_SKIP_CHANNELS=1` も設定します。`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、その Docker レーンから Gateway ライブカバレッジを絞り込む、または除外する必要がある場合は、`OPENCLAW_LIVE_GATEWAY_*` も渡してください。`test:docker:openwebui` は、より高レベルの互換性スモークです。OpenAI 互換 HTTP エンドポイントを有効にした OpenClaw Gateway コンテナを起動し、その Gateway に対して固定された Open WebUI コンテナを起動し、Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを確認してから、Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。初回実行は、Docker が Open WebUI イメージを pull する必要があったり、Open WebUI が自身のコールドスタート設定を完了する必要があったりするため、目に見えて遅くなることがあります。このレーンは使用可能なライブモデルキーを前提としており、Docker 化された実行でそれを提供する主な方法は `OPENCLAW_PROFILE_FILE`（デフォルトは `~/.profile`）です。成功した実行では、`{ "ok": true, "model": "openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。`test:docker:mcp-channels` は意図的に決定論的であり、実際の Telegram、Discord、iMessage アカウントは必要ありません。シード済みの Gateway コンテナを起動し、`openclaw mcp serve` を生成する 2 つ目のコンテナを起動してから、実際の stdio MCP ブリッジ上で、ルーティングされた会話検出、トランスクリプト読み取り、添付ファイルメタデータ、ライブイベントキューの動作、送信ルーティング、Claude 形式のチャネル + 権限通知を検証します。通知チェックは生の stdio MCP フレームを直接検査するため、スモークは特定のクライアント SDK がたまたま表面化するものだけでなく、ブリッジが実際に出力する内容を検証します。`test:docker:pi-bundle-mcp-tools` は決定論的であり、ライブモデルキーは必要ありません。リポジトリの Docker イメージをビルドし、コンテナ内で実際の stdio MCP プローブサーバーを起動し、埋め込み Pi バンドル MCP ランタイムを通じてそのサーバーを具現化し、ツールを実行してから、`coding` と `messaging` は `bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` はそれらをフィルターすることを検証します。`test:docker:cron-mcp-cleanup` は決定論的であり、ライブモデルキーは必要ありません。実際の stdio MCP プローブサーバーを備えたシード済み Gateway を起動し、隔離された cron ターンと `/subagents spawn` の 1 回限りの子ターンを実行してから、各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP 平易文スレッドスモーク（CI ではありません）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に保持してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な環境変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、一時的な設定/ワークスペースディレクトリを使い、外部 CLI 認証マウントなしで、`OPENCLAW_PROFILE_FILE` から source された環境変数のみを検証します
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内でのキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、テスト開始前に `/home/node/...` にコピーされます
  - デフォルトのディレクトリ: `.minimax`
  - デフォルトのファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込まれたプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定される必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きできます
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` で実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` でコンテナ内のプロバイダーをフィルターします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` は、再ビルドを必要としない再実行で既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` は、認証情報が（env ではなく）プロファイルストアから取得されることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` は、Open WebUI スモーク用に Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` は、Open WebUI スモークで使う nonce チェックプロンプトを上書きします
- `OPENWEBUI_IMAGE=...` は、固定された Open WebUI イメージタグを上書きします

## ドキュメント健全性

ドキュメント編集後にドキュメントチェックを実行します: `pnpm check:docs`。
ページ内見出しチェックも必要な場合は、Mintlify の完全なアンカー検証を実行します: `pnpm docs:check-links:anchors`。

## オフライン回帰（CI 安全）

これらは実プロバイダーなしの「実パイプライン」回帰です:

- Gateway ツール呼び出し（モック OpenAI、実 Gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: "runs a mock OpenAI tool call end-to-end via gateway agent loop"）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定を書き込み + 認証を強制）: `src/gateway/gateway.test.ts`（ケース: "runs wizard over ws and writes auth token config"）

## エージェント信頼性評価（Skills）

「エージェント信頼性評価」のように振る舞う CI 安全なテストはすでにいくつかあります:

- 実 Gateway + エージェントループを通したモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills でまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **判断:** Skills がプロンプトに列挙されているとき、エージェントは正しい Skills を選ぶか（または無関係なものを避けるか）？
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従うか？
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界をアサートするマルチターンシナリオ。

将来の評価は、まず決定論的であるべきです:

- モックプロバイダーを使い、ツール呼び出し + 順序、スキルファイル読み取り、セッション配線をアサートするシナリオランナー。
- スキルに焦点を当てた小さなシナリオスイート（使用 vs 回避、ゲーティング、プロンプトインジェクション）。
- オプションのライブ評価（オプトイン、env ゲート）は、CI 安全なスイートが整ってからのみ。

## 契約テスト（Plugin とチャネル形状）

契約テストは、登録されたすべての Plugin とチャネルがそれぞれのインターフェース契約に準拠していることを検証します。検出されたすべての Plugin を反復処理し、形状と動作のアサーションスイートを実行します。デフォルトの `pnpm test` ユニットレーンは、これらの共有シームとスモークファイルを意図的にスキップします。共有チャネルまたはプロバイダーのサーフェスに触れた場合は、契約コマンドを明示的に実行してください。

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
- **inbound** - 受信メッセージ処理
- **actions** - チャネルアクションハンドラー
- **threading** - スレッド ID 処理
- **directory** - ディレクトリ/roster API
- **group-policy** - グループポリシー強制

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **status** - チャネルステータスプローブ
- **registry** - Plugin レジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **auth** - 認証フロー契約
- **auth-choice** - 認証の選択/選定
- **catalog** - モデルカタログ API
- **discovery** - Plugin 検出
- **loader** - Plugin 読み込み
- **runtime** - プロバイダーランタイム
- **shape** - Plugin 形状/インターフェース
- **wizard** - セットアップウィザード

### 実行するタイミング

- plugin-sdk の exports または subpaths を変更した後
- チャネルまたはプロバイダー Plugin を追加または変更した後
- Plugin 登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは必要ありません。

## 回帰の追加（ガイダンス）

ライブで見つかったプロバイダー/モデル問題を修正するとき:

- 可能であれば CI 安全な回帰を追加します（モック/スタブプロバイダー、または正確なリクエスト形状変換をキャプチャ）
- 本質的にライブ専用（レート制限、認証ポリシー）の場合は、ライブテストを狭く保ち、env vars 経由のオプトインにします
- バグを検出する最小のレイヤーを対象にすることを優先します:
  - プロバイダーリクエスト変換/再生バグ → 直接の models テスト
  - Gateway セッション/履歴/ツールパイプラインのバグ → Gateway ライブスモークまたは CI 安全な Gateway モックテスト
- SecretRef トラバーサルガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとにサンプリングされたターゲットを 1 つ導出し、トラバーサルセグメントの exec id が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef ターゲットファミリーを追加する場合は、そのテストの `classifyTargetClass` を更新してください。新しいクラスが静かにスキップされないように、このテストは未分類のターゲット id で意図的に失敗します。

## 関連

- [ライブテスト](/ja-JP/help/testing-live)
- [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)
- [CI](/ja-JP/ci)
