---
read_when:
    - ローカルまたはCIでテストを実行する
    - モデル/プロバイダーのバグに対する回帰テストの追加
    - Gateway + エージェント動作のデバッグ
summary: 'テストキット: ユニット/e2e/live スイート、Docker ランナー、および各テストの対象範囲'
title: テスト
x-i18n:
    generated_at: "2026-04-30T18:38:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw には 3 つの Vitest スイート (ユニット/統合、e2e、ライブ) と少数の Docker ランナーがあります。このドキュメントは「テスト方法」のガイドです。

- 各スイートが対象にするもの (および意図的に対象にし_ない_もの)。
- 一般的なワークフロー (ローカル、プッシュ前、デバッグ) で実行するコマンド。
- ライブテストが認証情報を検出し、モデル/プロバイダーを選択する方法。
- 実際のモデル/プロバイダー問題に対するリグレッションを追加する方法。

<Note>
**QA スタック (qa-lab、qa-channel、ライブトランスポートレーン)** は別途文書化されています。

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — アーキテクチャ、コマンド面、シナリオ作成。
- [Matrix QA](/ja-JP/concepts/qa-matrix) — `pnpm openclaw qa matrix` のリファレンス。
- [QA チャネル](/ja-JP/channels/qa-channel) — リポジトリに裏付けられたシナリオで使う合成トランスポート Plugin。

このページでは、通常のテストスイートと Docker/Parallels ランナーの実行を扱います。下の QA 固有のランナーセクション ([QA 固有のランナー](#qa-specific-runners)) には具体的な `qa` 呼び出しを列挙し、上記のリファレンスを参照しています。
</Note>

## クイックスタート

ほとんどの日:

- フルゲート (プッシュ前に想定): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 余裕のあるマシンでの高速なローカルフルスイート実行: `pnpm test:max`
- 直接の Vitest ウォッチループ: `pnpm test:watch`
- 直接のファイル指定は拡張/チャネルパスにもルーティングされます: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 単一の失敗を反復処理している場合は、まず対象を絞った実行を優先してください。
- Docker ベースの QA サイト: `pnpm qa:lab:up`
- Linux VM ベースの QA レーン: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

テストを変更した場合、または追加の確信が必要な場合:

- カバレッジゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグする場合 (実際の認証情報が必要):

- ライブスイート (モデル + Gateway ツール/画像プローブ): `pnpm test:live`
- 1 つのライブファイルだけを静かに対象指定: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker ライブモデルスイープ: `pnpm test:docker:live-models`
  - 選択された各モデルは、テキストターンに加えて小さなファイル読み取り風プローブを実行します。
    メタデータが `image` 入力を通知しているモデルでは、小さな画像ターンも実行します。
    プロバイダー失敗を切り分ける場合は、`OPENCLAW_LIVE_MODEL_FILE_PROBE=0` または
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` で追加プローブを無効にしてください。
  - CI カバレッジ: 毎日の `OpenClaw Scheduled Live And E2E Checks` と手動の
    `OpenClaw Release Checks` はどちらも `include_live_suites: true` で再利用可能なライブ/E2E ワークフローを呼び出し、
    プロバイダーごとにシャードされた個別の Docker ライブモデルマトリックスジョブを含みます。
  - 集中的な CI 再実行では、`include_live_suites: true` と `live_models_only: true` を指定して
    `OpenClaw Live And E2E Checks (Reusable)` をディスパッチしてください。
  - 新しい高シグナルのプロバイダーシークレットは `scripts/ci-hydrate-live-auth.sh` に加え、
    `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` とその
    スケジュール/リリース呼び出し元にも追加してください。
- ネイティブ Codex バインドチャットスモーク: `pnpm test:docker:live-codex-bind`
  - Codex アプリサーバーパスに対して Docker ライブレーンを実行し、`/codex bind` で合成 Slack DM をバインドし、
    `/codex fast` と `/codex permissions` を実行したうえで、通常の返信と画像添付が
    ACP ではなくネイティブ Plugin バインディングを通ってルーティングされることを検証します。
- Codex アプリサーバーハーネススモーク: `pnpm test:docker:live-codex-harness`
  - Plugin 所有の Codex アプリサーバーハーネスを通じて Gateway エージェントターンを実行し、
    `/codex status` と `/codex models` を検証します。デフォルトでは画像、cron MCP、サブエージェント、Guardian プローブも実行します。他の Codex
    アプリサーバー失敗を切り分ける場合は、`OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` でサブエージェントプローブを無効にしてください。サブエージェントに絞ったチェックでは、他のプローブを無効にしてください:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` が設定されていない限り、これはサブエージェントプローブ後に終了します。
- Crestodian レスキューコマンドスモーク: `pnpm test:live:crestodian-rescue-channel`
  - メッセージチャネルのレスキューコマンド面に対する任意参加の念押しチェックです。
    `/crestodian status` を実行し、永続的なモデル変更をキューに入れ、
    `/crestodian yes` に返信し、監査/設定書き込みパスを検証します。
- Crestodian プランナー Docker スモーク: `pnpm test:docker:crestodian-planner`
  - `PATH` 上に偽の Claude CLI を置いた設定なしのコンテナで Crestodian を実行し、
    ファジープランナーのフォールバックが、監査済みの型付き設定書き込みに変換されることを検証します。
- Crestodian 初回実行 Docker スモーク: `pnpm test:docker:crestodian-first-run`
  - 空の OpenClaw 状態ディレクトリから開始し、素の `openclaw` を
    Crestodian にルーティングし、セットアップ/モデル/エージェント/Discord Plugin + SecretRef 書き込みを適用し、
    設定を検証し、監査エントリを検証します。同じ Ring 0 セットアップパスは
    QA Lab でも `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` によってカバーされています。
- Moonshot/Kimi コストスモーク: `MOONSHOT_API_KEY` を設定した状態で
  `openclaw models list --provider moonshot --json` を実行し、次に分離された
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  を `moonshot/kimi-k2.6` に対して実行します。JSON が Moonshot/K2.6 を報告し、
  アシスタントのトランスクリプトに正規化された `usage.cost` が保存されることを検証します。

<Tip>
失敗ケースが 1 つだけ必要な場合は、下記の allowlist 環境変数でライブテストを絞り込むことを優先してください。
</Tip>

## QA 固有のランナー

QA-lab のリアリティが必要な場合、これらのコマンドはメインのテストスイートの横に位置します。

CI は専用ワークフローで QA Lab を実行します。`Parity gate` は該当する PR と、
モックプロバイダーを使った手動ディスパッチで実行されます。`QA-Lab - All Lanes` は
`main` 上で毎晩実行され、手動ディスパッチではモックパリティゲート、ライブ Matrix レーン、
Convex 管理のライブ Telegram レーン、Convex 管理のライブ Discord レーンを
並列ジョブとして実行します。スケジュールされた QA とリリースチェックは Matrix に `--profile fast` を
明示的に渡しますが、Matrix CLI と手動ワークフロー入力のデフォルトは引き続き
`all` です。手動ディスパッチでは `all` を `transport`、`media`、`e2ee-smoke`、
`e2ee-deep`、`e2ee-cli` ジョブにシャードできます。`OpenClaw Release Checks` はリリース承認前に
パリティと高速 Matrix および Telegram レーンを実行し、リリーストランスポートチェックには
`mock-openai/gpt-5.5` を使用するため、決定論的なままで通常のプロバイダー Plugin 起動を回避します。
これらのライブトランスポート Gateway ではメモリ検索を無効にしています。メモリ動作は QA パリティスイートで引き続きカバーされます。

フルリリースのライブメディアシャードは
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` を使用します。これにはすでに
`ffmpeg` と `ffprobe` が含まれています。Docker ライブモデル/バックエンドシャードは、選択された
コミットごとに一度だけビルドされる共有
`ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用し、各シャード内で再ビルドする代わりに
`OPENCLAW_SKIP_DOCKER_BUILD=1` でそれを pull します。

- `pnpm openclaw qa suite`
  - リポジトリに裏付けられた QA シナリオをホスト上で直接実行します。
  - 選択された複数のシナリオを、分離された Gateway ワーカーでデフォルト並列実行します。
    `qa-channel` のデフォルト同時実行数は 4 です (選択されたシナリオ数が上限)。
    ワーカー数を調整するには `--concurrency <count>` を使用し、以前のシリアルレーンには
    `--concurrency 1` を使用してください。
  - いずれかのシナリオが失敗するとゼロ以外で終了します。失敗終了コードなしで
    アーティファクトが必要な場合は `--allow-failures` を使用してください。
  - プロバイダーモード `live-frontier`、`mock-openai`、`aimock` をサポートします。
    `aimock` は、シナリオを認識する `mock-openai` レーンを置き換えずに、
    実験的なフィクスチャとプロトコルモックのカバレッジのためにローカル AIMock ベースのプロバイダーサーバーを起動します。
- `pnpm test:gateway:cpu-scenarios`
  - Gateway 起動ベンチに加えて、小さなモック QA Lab シナリオパック
    (`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`) を実行し、結合された CPU 観測サマリーを
    `.artifacts/gateway-cpu-scenarios/` に書き込みます。
  - デフォルトでは持続的な高 CPU 観測のみをフラグします (`--cpu-core-warn`
    と `--hot-wall-warn-ms`)。そのため、短い起動バーストは、数分続く Gateway 高負荷リグレッションのようには見えず、
    メトリクスとして記録されます。
  - ビルド済みの `dist` アーティファクトを使用します。チェックアウトに新しいランタイム出力がまだない場合は、
    先にビルドを実行してください。
- `pnpm openclaw qa suite --runner multipass`
  - 使い捨ての Multipass Linux VM 内で同じ QA スイートを実行します。
  - ホスト上の `qa suite` と同じシナリオ選択動作を保ちます。
  - `qa suite` と同じプロバイダー/モデル選択フラグを再利用します。
  - ライブ実行では、ゲストで実用的な対応済み QA 認証入力を転送します:
    環境変数ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および存在する場合は `CODEX_HOME`。
  - 出力ディレクトリはリポジトリルート配下に置く必要があります。これにより、ゲストがマウントされたワークスペース経由で書き戻せます。
  - 通常の QA レポート + サマリーに加えて Multipass ログを
    `.artifacts/qa-e2e/...` 配下に書き込みます。
- `pnpm qa:lab:up`
  - オペレーター風の QA 作業向けに Docker ベースの QA サイトを起動します。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 現在のチェックアウトから npm tarball をビルドし、Docker 内でグローバルインストールし、
    非対話型の OpenAI API キーオンボーディングを実行し、デフォルトで Telegram を設定し、
    Plugin の有効化が必要に応じてランタイム依存関係をインストールすることを検証し、
    doctor を実行し、モックされた OpenAI エンドポイントに対して 1 回のローカルエージェントターンを実行します。
  - Discord で同じパッケージインストールレーンを実行するには `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` を使用してください。
- `pnpm test:docker:session-runtime-context`
  - 埋め込みランタイムコンテキストトランスクリプト向けの、決定論的なビルド済みアプリ Docker スモークを実行します。
    非表示の OpenClaw ランタイムコンテキストが、表示されるユーザーターンに漏れるのではなく、
    非表示のカスタムメッセージとして永続化されることを検証します。その後、影響を受けた壊れたセッション JSONL をシードし、
    `openclaw doctor --fix` がバックアップ付きでアクティブブランチへ書き換えることを検証します。
- `pnpm test:docker:npm-telegram-live`
  - Docker 内に OpenClaw パッケージ候補をインストールし、インストール済みパッケージの
    オンボーディングを実行し、インストール済み CLI を通じて Telegram を設定したうえで、
    そのインストール済みパッケージを SUT Gateway としてライブ Telegram QA レーンを再利用します。
  - デフォルトは `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` です。
    レジストリからインストールする代わりに解決済みローカル tarball をテストするには、
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` または
    `OPENCLAW_CURRENT_PACKAGE_TGZ` を設定してください。
  - `pnpm openclaw qa telegram` と同じ Telegram 環境認証情報または Convex 認証情報ソースを使用します。
    CI/リリース自動化では、`OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` に加えて
    `OPENCLAW_QA_CONVEX_SITE_URL` とロールシークレットを設定してください。CI に
    `OPENCLAW_QA_CONVEX_SITE_URL` と Convex ロールシークレットが存在する場合、
    Docker ラッパーは Convex を自動的に選択します。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` は、このレーンに限り共有の
    `OPENCLAW_QA_CREDENTIAL_ROLE` を上書きします。
  - GitHub Actions では、このレーンを手動メンテナーワークフロー
    `NPM Telegram Beta E2E` として公開しています。マージ時には実行されません。このワークフローは
    `qa-live-shared` 環境と Convex CI 認証情報リースを使用します。
- GitHub Actions では、候補パッケージ 1 つに対するサイドラン製品証明用に `Package Acceptance` も公開しています。
  信頼済み ref、公開 npm spec、SHA-256 付き HTTPS tarball URL、または別実行の tarball アーティファクトを受け取り、
  正規化された `openclaw-current.tgz` を `package-under-test` としてアップロードし、その後既存の Docker E2E スケジューラーを
  smoke、package、product、full、または custom レーンプロファイルで実行します。同じ `package-under-test` アーティファクトに対して
  Telegram QA ワークフローを実行するには、`telegram_mode=mock-openai` または `live-frontier` を設定してください。
  - 最新ベータ製品証明:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 正確な tarball URL 証明にはダイジェストが必要です:

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
  - 現在の OpenClaw ビルドを Docker 内でパックしてインストールし、OpenAI を設定した状態で Gateway を起動してから、設定の編集により同梱チャネル/Plugin を有効化します。
  - セットアップ検出により、未設定 Plugin のランタイム依存関係が存在しないままになること、最初に設定された Gateway または doctor 実行が各同梱 Plugin のランタイム依存関係を必要時にインストールすること、2 回目の再起動ではすでに有効化済みの依存関係を再インストールしないことを検証します。
  - 既知の古い npm ベースラインもインストールし、`openclaw update --tag <candidate>` を実行する前に Telegram を有効化し、候補版の更新後 doctor が、ハーネス側の postinstall 修復なしで同梱チャネルのランタイム依存関係を修復することを検証します。
- `pnpm test:parallels:npm-update`
  - Parallels ゲスト全体で、ネイティブのパッケージ済みインストール更新スモークを実行します。選択された各プラットフォームは、まず要求されたベースラインパッケージをインストールし、その後同じゲスト内でインストール済みの `openclaw update` コマンドを実行して、インストール済みバージョン、更新ステータス、Gateway の準備完了状態、ローカルエージェントの 1 ターンを検証します。
  - 1 つのゲストで反復する場合は、`--platform macos`、`--platform windows`、または `--platform linux` を使用します。サマリーアーティファクトのパスとレーンごとのステータスには `--json` を使用します。
  - OpenAI レーンは、既定でライブエージェントターン証明に `openai/gpt-5.5` を使用します。別の OpenAI モデルを意図的に検証する場合は、`--model <provider/model>` を渡すか、`OPENCLAW_PARALLELS_OPENAI_MODEL` を設定します。
  - Parallels の転送停止がテスト時間枠の残りを消費しないよう、長時間のローカル実行はホストのタイムアウトでラップします。

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - スクリプトは、ネストされたレーンログを `/tmp/openclaw-parallels-npm-update.*` 配下に書き込みます。外側のラッパーが停止していると判断する前に、`windows-update.log`、`macos-update.log`、または `linux-update.log` を確認してください。
  - Windows 更新では、コールドゲスト上の更新後 doctor/ランタイム依存関係修復に 10 分から 15 分かかる場合があります。ネストされた npm デバッグログが進んでいれば、まだ正常です。
  - この集約ラッパーを、個別の Parallels macOS、Windows、または Linux スモークレーンと並行して実行しないでください。これらは VM 状態を共有し、スナップショット復元、パッケージ配信、またはゲスト Gateway 状態で衝突する可能性があります。
  - 更新後証明は通常の同梱 Plugin サーフェスを実行します。音声、画像生成、メディア理解などの機能ファサードは、エージェントターン自体が単純なテキスト応答のみを確認する場合でも、同梱ランタイム API 経由で読み込まれるためです。

- `pnpm openclaw qa aimock`
  - 直接のプロトコルスモークテスト用に、ローカル AIMock プロバイダーサーバーのみを起動します。
- `pnpm openclaw qa matrix`
  - 使い捨ての Docker バックエンド付き Tuwunel homeserver に対して Matrix ライブ QA レーンを実行します。ソースチェックアウトのみです。パッケージ済みインストールには `qa-lab` は同梱されません。
  - 完全な CLI、プロファイル/シナリオカタログ、環境変数、アーティファクトレイアウト: [Matrix QA](/ja-JP/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 環境変数のドライバーおよび SUT bot トークンを使用して、実在のプライベートグループに対して Telegram ライブ QA レーンを実行します。
  - `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`、および `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN` が必要です。グループ ID は数値の Telegram チャット ID である必要があります。
  - 共有プール認証情報には `--credential-source convex` をサポートします。既定では env モードを使用するか、プールされたリースを有効にするには `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
  - いずれかのシナリオが失敗すると、非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は、`--allow-failures` を使用します。
  - 同じプライベートグループ内に 2 つの異なる bot が必要で、SUT bot は Telegram ユーザー名を公開している必要があります。
  - 安定した bot 間観測のため、両方の bot で `@BotFather` の Bot-to-Bot Communication Mode を有効化し、ドライバー bot がグループの bot トラフィックを観測できるようにしてください。
  - `.artifacts/qa-e2e/...` 配下に Telegram QA レポート、サマリー、観測済みメッセージアーティファクトを書き込みます。返信シナリオには、ドライバーの送信要求から観測された SUT 返信までの RTT が含まれます。

ライブ転送レーンは、新しい転送がずれないように 1 つの標準契約を共有します。レーンごとのカバレッジマトリックスは [QA 概要 → ライブ転送カバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) にあります。`qa-channel` は広範な合成スイートであり、このマトリックスには含まれません。

### Convex 経由の共有 Telegram 認証情報 (v1)

`openclaw qa telegram` で `--credential-source convex`（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）が有効な場合、QA lab は Convex バックエンドのプールから排他的リースを取得し、レーンの実行中はそのリースに Heartbeat を送信し、シャットダウン時にリースを解放します。

参照用 Convex プロジェクトスキャフォールド:

- `qa/convex-credential-broker/`

必須の環境変数:

- `OPENCLAW_QA_CONVEX_SITE_URL`（例: `https://your-deployment.convex.site`）
- 選択されたロール用のシークレット 1 つ:
  - `maintainer` 用の `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
  - `ci` 用の `OPENCLAW_QA_CONVEX_SECRET_CI`
- 認証情報ロールの選択:
  - CLI: `--credential-role maintainer|ci`
  - 環境変数の既定値: `OPENCLAW_QA_CREDENTIAL_ROLE`（CI では既定で `ci`、それ以外では `maintainer`）

任意の環境変数:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（既定 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（既定 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（既定 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（既定 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（既定 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（任意のトレース ID）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` は、ローカル専用開発向けに loopback `http://` Convex URL を許可します。

通常運用では、`OPENCLAW_QA_CONVEX_SITE_URL` は `https://` を使用する必要があります。

メンテナー管理コマンド（プールの追加/削除/一覧表示）には、具体的に `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` が必要です。

メンテナー向け CLI ヘルパー:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

ライブ実行の前に `doctor` を使用して、シークレット値を出力せずに、Convex サイト URL、ブローカーシークレット、エンドポイントプレフィックス、HTTP タイムアウト、管理/一覧到達性を確認します。スクリプトや CI ユーティリティで機械可読な出力が必要な場合は、`--json` を使用します。

既定のエンドポイント契約（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）:

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

Telegram 種別のペイロード形状:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` は数値の Telegram チャット ID 文字列である必要があります。
- `admin/add` は `kind: "telegram"` についてこの形状を検証し、不正な形式のペイロードを拒否します。

### QA へのチャネル追加

新しいチャネルアダプターのアーキテクチャとシナリオヘルパー名は、[QA 概要 → チャネルの追加](/ja-JP/concepts/qa-e2e-automation#adding-a-channel) にあります。最小要件: 共有 `qa-lab` ホストシーム上で転送ランナーを実装し、Plugin マニフェストで `qaRunners` を宣言し、`openclaw qa <runner>` としてマウントし、`qa/scenarios/` 配下にシナリオを作成します。

## テストスイート（どこで何が実行されるか）

スイートは「リアリズムの増加」（および不安定さ/コストの増加）として考えてください。

### ユニット / 統合（既定）

- コマンド: `pnpm test`
- 設定: ターゲット指定なしの実行は `vitest.full-*.config.ts` シャードセットを使用し、並列スケジューリングのためにマルチプロジェクトシャードをプロジェクトごとの設定へ展開する場合があります
- ファイル: `src/**/*.test.ts`、`packages/**/*.test.ts`、および `test/**/*.test.ts` 配下の core/ユニットインベントリ。UI ユニットテストは専用の `unit-ui` シャードで実行されます
- スコープ:
  - 純粋なユニットテスト
  - インプロセス統合テスト（Gateway 認証、ルーティング、ツール処理、解析、設定）
  - 既知のバグに対する決定的な回帰テスト
- 期待事項:
  - CI で実行される
  - 実キーは不要
  - 高速かつ安定しているべき
  - リゾルバーおよび公開サーフェスローダーテストは、実際の同梱 Plugin ソース API ではなく、生成された小さな Plugin フィクスチャで広範な `api.js` および `runtime-api.js` フォールバック動作を証明する必要があります。実際の Plugin API 読み込みは、Plugin 所有の契約/統合スイートに属します。

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - ターゲット未指定の `pnpm test` は、1 つの巨大なネイティブルートプロジェクトプロセスではなく、12 個の小さなシャード設定（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`）を実行します。これにより、高負荷のマシンでのピーク RSS を削減し、auto-reply/extension 作業が無関係なスイートを飢餓状態にすることを避けます。
    - `pnpm test --watch` は引き続きネイティブルートの `vitest.config.ts` プロジェクトグラフを使用します。マルチシャードの watch ループは実用的ではないためです。
    - `pnpm test`、`pnpm test:watch`、`pnpm test:perf:imports` は、明示的なファイル/ディレクトリターゲットをまずスコープ付きレーンにルーティングするため、`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` はルートプロジェクト全体の起動コストを支払わずに済みます。
    - `pnpm test:changed` は、変更された git パスをデフォルトで低コストなスコープ付きレーンに展開します。直接のテスト編集、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフの依存先が対象です。Config/setup/package の編集では、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を明示的に使用しない限り、テストを広範囲には実行しません。
    - `pnpm check:changed` は、狭い作業向けの通常のスマートなローカルチェックゲートです。diff を core、core tests、extensions、extension tests、apps、docs、release metadata、live Docker tooling、tooling に分類し、対応する typecheck、lint、guard コマンドを実行します。Vitest テストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を呼び出してください。release metadata のみのバージョンバンプでは、対象を絞った version/config/root-dependency チェックを実行し、トップレベルの version フィールド以外の package 変更を拒否する guard が付きます。
    - Live Docker ACP ハーネスの編集では、live Docker auth スクリプトのシェル構文と live Docker scheduler の dry-run という集中チェックを実行します。`package.json` の変更が含まれるのは、diff が `scripts["test:docker:live-*"]` に限定される場合のみです。dependency、export、version、その他 package surface の編集では引き続きより広範な guard を使用します。
    - agents、commands、plugins、auto-reply helpers、`plugin-sdk`、および同様の純粋な utility 領域の import が軽い単体テストは、`test/setup-openclaw-runtime.ts` をスキップする `unit-fast` レーンにルーティングされます。stateful/runtime-heavy なファイルは既存のレーンに残ります。
    - 選択された `plugin-sdk` と `commands` の helper ソースファイルも、changed-mode の実行をこれらの軽いレーンの明示的な兄弟テストにマッピングするため、helper の編集でそのディレクトリの重いスイート全体を再実行せずに済みます。
    - `auto-reply` には、トップレベルの core helpers、トップレベルの `reply.*` integration tests、`src/auto-reply/reply/**` サブツリー向けの専用バケットがあります。CI ではさらに reply サブツリーを agent-runner、dispatch、commands/state-routing のシャードに分割し、1 つの import-heavy なバケットが Node の末尾全体を占有しないようにします。
    - 通常の PR/main CI は、extension batch sweep と release-only の `agentic-plugins` シャードを意図的にスキップします。Full Release Validation は、リリース候補に対して plugin/extension-heavy なこれらのスイート用に別個の `Plugin Prerelease` 子ワークフローを dispatch します。

  </Accordion>

  <Accordion title="組み込みランナーのカバレッジ">

    - message-tool discovery inputs または Compaction runtime context を変更する場合は、両方のレベルのカバレッジを維持してください。
    - 純粋な routing と normalization の境界には、焦点を絞った helper 回帰テストを追加してください。
    - 組み込みランナーの integration suite を健全に保ってください:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, および
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - これらのスイートは、スコープ付き id と Compaction の挙動が実際の `run.ts` / `compact.ts` パスを通って引き続き流れることを検証します。helper-only テストは、これらの integration パスの十分な代替にはなりません。

  </Accordion>

  <Accordion title="Vitest pool と isolation のデフォルト">

    - ベースの Vitest config はデフォルトで `threads` を使用します。
    - 共有 Vitest config は `isolate: false` を固定し、ルートプロジェクト、e2e、live configs 全体で非 isolated runner を使用します。
    - ルート UI レーンは `jsdom` setup と optimizer を維持しますが、共有の非 isolated runner 上でも実行されます。
    - 各 `pnpm test` シャードは、共有 Vitest config から同じ `threads` + `isolate: false` のデフォルトを継承します。
    - `scripts/run-vitest.mjs` は、大規模なローカル実行中の V8 compile churn を減らすため、デフォルトで Vitest 子 Node プロセスに `--no-maglev` を追加します。
      標準の V8 挙動と比較するには `OPENCLAW_VITEST_ENABLE_MAGLEV=1` を設定してください。

  </Accordion>

  <Accordion title="高速なローカル反復">

    - `pnpm changed:lanes` は、diff がどの architectural lanes をトリガーするかを表示します。
    - pre-commit hook は formatting のみです。整形済みファイルを再 stage し、lint、typecheck、tests は実行しません。
    - handoff または push の前にスマートなローカルチェックゲートが必要な場合は、`pnpm check:changed` を明示的に実行してください。
    - `pnpm test:changed` はデフォルトで低コストなスコープ付きレーンを経由します。agent が harness、config、package、または contract の編集に本当に広範な Vitest カバレッジが必要だと判断した場合のみ、`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。
    - `pnpm test:max` と `pnpm test:changed:max` は同じルーティング挙動を維持し、worker cap だけを高くします。
    - ローカル worker の自動スケーリングは意図的に保守的で、host load average がすでに高い場合は抑制されるため、複数の同時 Vitest 実行による影響はデフォルトで小さくなります。
    - ベース Vitest config は projects/config files を `forceRerunTriggers` としてマークするため、test wiring が変更された場合でも changed-mode reruns は正確に保たれます。
    - config はサポート対象 host で `OPENCLAW_VITEST_FS_MODULE_CACHE` を有効に保ちます。直接 profiling 用に明示的な cache location を 1 つ使いたい場合は、`OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` を設定してください。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` は、Vitest import-duration reporting と import-breakdown output を有効にします。
    - `pnpm test:perf:imports:changed` は、同じ profiling view を `origin/main` 以降に変更されたファイルにスコープします。
    - shard timing data は `.artifacts/vitest-shard-timings.json` に書き込まれます。
      whole-config runs は config path を key として使用します。include-pattern CI shards は shard name を追加するため、filtered shards を個別に追跡できます。
    - 1 つの hot test がまだ startup imports にほとんどの時間を費やす場合は、heavy dependencies を狭いローカル `*.runtime.ts` seam の背後に置き、runtime helpers を `vi.mock(...)` に渡すためだけに deep-import するのではなく、その seam を直接 mock してください。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` は、ルーティングされた `test:changed` を、そのコミット済み diff に対するネイティブルートプロジェクトパスと比較し、wall time と macOS max RSS を出力します。
    - `pnpm test:perf:changed:bench -- --worktree` は、changed file list を `scripts/test-projects.mjs` とルート Vitest config にルーティングして、現在の dirty tree を benchmark します。
    - `pnpm test:perf:profile:main` は、Vitest/Vite startup と transform overhead 用の main-thread CPU profile を書き込みます。
    - `pnpm test:perf:profile:runner` は、file parallelism を無効化した unit suite 用の runner CPU+heap profiles を書き込みます。

  </Accordion>
</AccordionGroup>

### 安定性（gateway）

- コマンド: `pnpm test:stability:gateway`
- 設定: `vitest.gateway.config.ts`、1 worker に強制
- スコープ:
  - diagnostics をデフォルトで有効にした実際の loopback Gateway を起動
  - diagnostic event path を通じて synthetic gateway message、memory、large-payload churn を駆動
  - Gateway WS RPC 経由で `diagnostics.stability` を照会
  - diagnostic stability bundle persistence helpers をカバー
  - recorder が bounded のままであること、synthetic RSS samples が pressure budget 未満に保たれること、per-session queue depths がゼロに戻ることを assert
- 期待事項:
  - CI-safe かつ keyless
  - stability-regression の follow-up 向けの狭いレーンであり、Gateway suite 全体の代替ではありません

### E2E（gateway smoke）

- コマンド: `pnpm test:e2e`
- 設定: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`、および `extensions/` 配下の bundled-plugin E2E tests
- 実行時デフォルト:
  - リポジトリの他の部分と同様に、`isolate: false` で Vitest `threads` を使用します。
  - adaptive workers を使用します（CI: 最大 2、local: デフォルトで 1）。
  - console I/O overhead を減らすため、デフォルトで silent mode で実行します。
- 便利な上書き:
  - worker count を強制するには `OPENCLAW_E2E_WORKERS=<n>`（上限 16）。
  - verbose console output を再有効化するには `OPENCLAW_E2E_VERBOSE=1`。
- スコープ:
  - multi-instance gateway end-to-end behavior
  - WebSocket/HTTP surfaces、node pairing、より重い networking
- 期待事項:
  - CI で実行されます（pipeline で有効な場合）
  - 実際の keys は不要
  - unit tests より moving parts が多い（遅くなる場合があります）

### E2E: OpenShell backend smoke

- コマンド: `pnpm test:e2e:openshell`
- ファイル: `extensions/openshell/src/backend.e2e.test.ts`
- スコープ:
  - Docker 経由で host 上に isolated OpenShell gateway を起動
  - 一時的なローカル Dockerfile から sandbox を作成
  - 実際の `sandbox ssh-config` + SSH exec を介して OpenClaw の OpenShell backend を exercise
  - sandbox fs bridge 経由で remote-canonical filesystem behavior を検証
- 期待事項:
  - Opt-in のみ。デフォルトの `pnpm test:e2e` 実行の一部ではありません
  - ローカルの `openshell` CLI と動作する Docker daemon が必要です
  - isolated `HOME` / `XDG_CONFIG_HOME` を使用し、その後 test gateway と sandbox を破棄します
- 便利な上書き:
  - broader e2e suite を手動で実行するときに test を有効化するには `OPENCLAW_E2E_OPENSHELL=1`
  - 非デフォルトの CLI binary または wrapper script を指定するには `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`

### Live（実際の providers + 実際の models）

- コマンド: `pnpm test:live`
- 設定: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`、`test/**/*.live.test.ts`、および `extensions/` 配下の bundled-plugin live tests
- デフォルト: `pnpm test:live` により **有効**（`OPENCLAW_LIVE_TEST=1` を設定）
- スコープ:
  - 「この provider/model は、実際の creds で _今日_ 本当に動くか？」
  - provider format changes、tool-calling quirks、auth issues、rate limit behavior を検出
- 期待事項:
  - 設計上 CI-stable ではありません（実際の networks、実際の provider policies、quotas、outages）
  - 費用がかかる / rate limits を使用します
  - 「everything」ではなく、絞り込んだ subsets の実行を推奨
- Live runs は `~/.profile` を source して不足している API keys を取得します。
- デフォルトでは、live runs は引き続き `HOME` を isolate し、config/auth material を一時 test home にコピーするため、unit fixtures が実際の `~/.openclaw` を mutate することはありません。
- live tests で実際の home directory を使う必要が意図的にある場合のみ、`OPENCLAW_LIVE_USE_REAL_HOME=1` を設定してください。
- `pnpm test:live` は現在、デフォルトでより静かなモードです。`[live] ...` progress output は維持しますが、追加の `~/.profile` notice を抑制し、gateway bootstrap logs/Bonjour chatter を mute します。完全な startup logs を戻したい場合は `OPENCLAW_LIVE_TEST_QUIET=0` を設定してください。
- API key rotation（provider-specific）: `*_API_KEYS` を comma/semicolon format で設定するか、`*_API_KEY_1`、`*_API_KEY_2`（例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`）を設定します。または `OPENCLAW_LIVE_*_KEY` による per-live override を使用します。tests は rate limit responses で retry します。
- Progress/Heartbeat output:
  - Live suites は stderr に progress lines を出力するようになったため、Vitest console capture が静かな場合でも長い provider calls が visibly active であることが分かります。
  - `vitest.live.config.ts` は Vitest console interception を無効にし、provider/gateway progress lines が live runs 中に即座に stream されるようにします。
  - direct-model heartbeats は `OPENCLAW_LIVE_HEARTBEAT_MS` で調整します。
  - gateway/probe heartbeats は `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` で調整します。

## どのスイートを実行すべきか？

この decision table を使用してください:

- 編集ロジック/テスト: `pnpm test` を実行（多くを変更した場合は `pnpm test:coverage` も実行）
- Gateway ネットワーク / WS プロトコル / ペアリングに触れる場合: `pnpm test:e2e` を追加
- 「my bot is down」のデバッグ / プロバイダー固有の失敗 / ツール呼び出し: 絞り込んだ `pnpm test:live` を実行

## ライブ（ネットワークに触れる）テスト

ライブモデルマトリクス、CLI バックエンドのスモーク、ACP スモーク、Codex アプリサーバーハーネス、およびすべてのメディアプロバイダーのライブテスト（Deepgram、BytePlus、ComfyUI、画像、音楽、動画、メディアハーネス）と、ライブ実行の認証情報処理については、[テスト — ライブスイート](/ja-JP/help/testing-live) を参照してください。

## Docker ランナー（任意の「Linux で動作する」チェック）

これらの Docker ランナーは 2 つのバケットに分かれます。

- ライブモデルランナー: `test:docker:live-models` と `test:docker:live-gateway` は、リポジトリの Docker イメージ内で対応するプロファイルキーのライブファイル（`src/agents/models.profiles.live.test.ts` と `src/gateway/gateway-models.profiles.live.test.ts`）のみを実行し、ローカル設定ディレクトリとワークスペースをマウントします（マウントされている場合は `~/.profile` も読み込みます）。対応するローカルエントリーポイントは `test:live:models-profiles` と `test:live:gateway-profiles` です。
- Docker ライブランナーは、Docker 全体スイープを現実的に保つため、デフォルトで小さめのスモーク上限を使います:
  `test:docker:live-models` はデフォルトで `OPENCLAW_LIVE_MAX_MODELS=12`、
  `test:docker:live-gateway` はデフォルトで `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`、および
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000` です。より大きい網羅的スキャンを明示的に行いたい場合は、これらの環境変数を上書きしてください。
- `test:docker:all` は `test:docker:live-build` 経由でライブ Docker イメージを一度だけビルドし、`scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw を npm tarball として一度だけパックしてから、2 つの `scripts/e2e/Dockerfile` イメージをビルド/再利用します。ベア画像は、インストール/更新/Plugin 依存関係レーン用の Node/Git ランナーのみです。これらのレーンは事前ビルド済み tarball をマウントします。機能イメージは、ビルド済みアプリ機能レーン用に同じ tarball を `/app` にインストールします。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあります。`scripts/test-docker-all.mjs` は選択されたプランを実行します。集約処理は重み付きローカルスケジューラーを使います。`OPENCLAW_DOCKER_ALL_PARALLELISM` はプロセススロットを制御し、リソース上限により重いライブ、npm インストール、マルチサービスのレーンが同時にすべて開始されないようにします。単一のレーンが有効な上限より重い場合でも、プールが空ならスケジューラーはそれを開始でき、その後、再び容量が利用可能になるまで単独で実行し続けます。デフォルトは 10 スロット、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。Docker ホストにさらに余裕がある場合に限り、`OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を調整してください。ランナーはデフォルトで Docker プリフライトを実行し、古い OpenClaw E2E コンテナを削除し、30 秒ごとにステータスを表示し、成功したレーンの所要時間を `.artifacts/docker-tests/lane-timings.json` に保存し、以降の実行ではその所要時間を使って長いレーンを先に開始します。Docker をビルドまたは実行せずに重み付きレーンマニフェストを表示するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使い、選択レーン、パッケージ/イメージ要件、認証情報の CI プランを表示するには `node scripts/test-docker-all.mjs --plan-json` を使います。
- `Package Acceptance` は、「このインストール可能な tarball は製品として動作するか」を確認する GitHub ネイティブのパッケージゲートです。`source=npm`、`source=ref`、`source=url`、または `source=artifact` から候補パッケージを 1 つ解決し、それを `package-under-test` としてアップロードしてから、選択された ref を再パックするのではなく、その正確な tarball に対して再利用可能な Docker E2E レーンを実行します。`workflow_ref` は信頼済みワークフロー/ハーネススクリプトを選択し、`package_ref` は `source=ref` のときにパックするソースコミット/ブランチ/タグを選択します。これにより、現在の受け入れロジックで過去の信頼済みコミットを検証できます。プロファイルは範囲の広さで並んでいます。`smoke` は高速なインストール/チャンネル/エージェントに Gateway/設定を加えたもの、`package` はパッケージ/更新/Plugin 契約に、キーなしのアップグレード生存フィクスチャと、ほとんどの Parallels パッケージ/更新カバレッジに対するデフォルトのネイティブ代替を加えたもの、`product` は MCP チャンネル、Cron/サブエージェントのクリーンアップ、OpenAI ウェブ検索、OpenWebUI を追加したもの、`full` は OpenWebUI 付きでリリースパスの Docker チャンクを実行するものです。リリース検証では、リリースパスの Docker チャンクが重複するパッケージ/更新/Plugin レーンをすでにカバーしているため、カスタムパッケージ差分（`bundled-channel-deps-compat plugins-offline`）と Telegram パッケージ QA を実行します。アーティファクトから生成されるターゲット付き GitHub Docker 再実行コマンドには、利用可能な場合、以前のパッケージアーティファクトと準備済みイメージ入力が含まれるため、失敗したレーンはパッケージとイメージの再ビルドを避けられます。
- ビルドおよびリリースチェックは、tsdown の後に `scripts/check-cli-bootstrap-imports.mjs` を実行します。このガードは `dist/entry.js` と `dist/cli/run-main.js` から静的なビルド済みグラフをたどり、コマンドディスパッチ前の起動処理で Commander、プロンプト UI、undici、ログ出力などのパッケージ依存関係がインポートされている場合に失敗します。また、バンドルされた Gateway 実行チャンクを予算内に保ち、既知のコールド Gateway パスの静的インポートを拒否します。パッケージ済み CLI スモークは、ルートヘルプ、オンボードヘルプ、doctor ヘルプ、ステータス、設定スキーマ、モデル一覧コマンドもカバーします。
- Package Acceptance のレガシー互換性は `2026.4.25`（`2026.4.25-beta.*` を含む）までに制限されています。この期限までは、ハーネスは出荷済みパッケージのメタデータ欠落のみを許容します。省略された private QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落したパッチファイル、永続化されていない `update.channel`、レガシー Plugin インストール記録の場所、マーケットプレイスのインストール記録永続化の欠落、および `plugins update` 中の設定メタデータ移行です。`2026.4.25` より後のパッケージでは、これらのパスは厳格な失敗になります。
- コンテナスモークランナー: `test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:upgrade-survivor`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update`、および `test:docker:config-reload` は、1 つ以上の実コンテナを起動し、より高レベルの統合パスを検証します。

ライブモデル Docker ランナーは、必要な CLI 認証ホームのみ（または実行が絞り込まれていない場合は対応するすべて）もバインドマウントし、実行前にコンテナホームへコピーします。これにより、外部 CLI の OAuth はホストの認証ストアを変更せずにトークンを更新できます。

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ACP バインドスモーク: `pnpm test:docker:live-acp-bind` (スクリプト: `scripts/test-live-acp-bind-docker.sh`; デフォルトで Claude、Codex、Gemini を対象にし、`pnpm test:docker:live-acp-bind:droid` と `pnpm test:docker:live-acp-bind:opencode` による Droid/OpenCode の厳密なカバレッジも含む)
- CLI バックエンドスモーク: `pnpm test:docker:live-cli-backend` (スクリプト: `scripts/test-live-cli-backend-docker.sh`)
- Codex アプリサーバーハーネススモーク: `pnpm test:docker:live-codex-harness` (スクリプト: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + 開発エージェント: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- オブザーバビリティスモーク: `pnpm qa:otel:smoke` は非公開 QA ソースチェックアウトレーンです。npm tarball には QA Lab が含まれないため、意図的にパッケージ Docker リリースレーンには含めていません。
- Open WebUI ライブスモーク: `pnpm test:docker:openwebui` (スクリプト: `scripts/e2e/openwebui-docker.sh`)
- オンボーディングウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- npm tarball オンボーディング/チャンネル/エージェントスモーク: `pnpm test:docker:npm-onboard-channel-agent` は、パック済みの OpenClaw tarball を Docker 内でグローバルインストールし、env-ref オンボーディングとデフォルトの Telegram を通じて OpenAI を設定し、doctor 修復で Plugin のランタイム依存関係が有効化されたことを検証し、モックした OpenAI エージェントターンを 1 回実行します。事前ビルド済み tarball は `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用でき、ホスト側の再ビルドは `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` でスキップでき、チャンネルは `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` で切り替えられます。
- 更新チャンネル切り替えスモーク: `pnpm test:docker:update-channel-switch` は、パック済みの OpenClaw tarball を Docker 内でグローバルインストールし、パッケージ `stable` から git `dev` へ切り替え、永続化されたチャンネルと Plugin 更新後の動作を検証し、その後パッケージ `stable` に戻して更新ステータスを確認します。
- アップグレード生存スモーク: `pnpm test:docker:upgrade-survivor` は、エージェント、チャンネル設定、Plugin 許可リスト、古い Plugin ランタイム依存関係の状態、既存のワークスペース/セッションファイルを含む汚れた旧ユーザーフィクスチャの上に、パック済みの OpenClaw tarball をインストールします。ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話 doctor を実行し、その後 local loopback Gateway を起動して、設定/状態の保持と起動/ステータスの予算を確認します。
- セッションランタイムコンテキストスモーク: `pnpm test:docker:session-runtime-context` は、非表示ランタイムコンテキストのトランスクリプト永続化と、影響を受けた重複プロンプト書き換えブランチに対する doctor 修復を検証します。
- Bun グローバルインストールスモーク: `bash scripts/e2e/bun-global-install-smoke.sh` は現在のツリーをパックし、隔離されたホームで `bun install -g` によりインストールし、`openclaw infer image providers --json` がハングせずに同梱画像プロバイダーを返すことを検証します。事前ビルド済み tarball は `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` で再利用でき、ホスト側のビルドは `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` でスキップでき、ビルド済み Docker イメージから `dist/` をコピーするには `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` を使用します。
- インストーラー Docker スモーク: `bash scripts/test-install-sh-docker.sh` は、root、update、direct-npm の各コンテナー間で 1 つの npm キャッシュを共有します。更新スモークは、候補 tarball へアップグレードする前の stable ベースラインとして、デフォルトで npm `latest` を使用します。ローカルでは `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` で、GitHub では Install Smoke ワークフローの `update_baseline_version` 入力で上書きできます。非 root インストーラーチェックは隔離された npm キャッシュを保持するため、root 所有のキャッシュエントリがユーザーローカルのインストール動作を覆い隠すことはありません。ローカル再実行間で root/update/direct-npm キャッシュを再利用するには、`OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` を設定します。
- Install Smoke CI は `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` により、重複する direct-npm グローバル更新をスキップします。直接の `npm install -g` カバレッジが必要な場合は、その env なしでスクリプトをローカル実行します。
- エージェント共有ワークスペース削除 CLI スモーク: `pnpm test:docker:agents-delete-shared-workspace` (スクリプト: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) はデフォルトでルート Dockerfile イメージをビルドし、隔離されたコンテナーホーム内で 1 つのワークスペースを持つ 2 つのエージェントをシードし、`agents delete --json` を実行し、有効な JSON とワークスペース保持動作を検証します。インストールスモークイメージを再利用するには、`OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` を使用します。
- Gateway ネットワーク (2 コンテナー、WS 認証 + ヘルス): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- ブラウザー CDP スナップショットスモーク: `pnpm test:docker:browser-cdp-snapshot` (スクリプト: `scripts/e2e/browser-cdp-snapshot-docker.sh`) は、ソース E2E イメージと Chromium レイヤーをビルドし、生の CDP で Chromium を起動し、`browser doctor --deep` を実行し、CDP ロールスナップショットがリンク URL、カーソルで昇格されたクリック可能要素、iframe 参照、フレームメタデータをカバーすることを検証します。
- OpenAI Responses web_search 最小推論回帰: `pnpm test:docker:openai-web-search-minimal` (スクリプト: `scripts/e2e/openai-web-search-minimal-docker.sh`) は、モックした OpenAI サーバーを Gateway 経由で実行し、`web_search` が `reasoning.effort` を `minimal` から `low` に引き上げることを検証し、その後プロバイダースキーマの拒否を強制して、生の詳細が Gateway ログに現れることを確認します。
- MCP チャンネルブリッジ (シード済み Gateway + stdio ブリッジ + 生の Claude 通知フレームスモーク): `pnpm test:docker:mcp-channels` (スクリプト: `scripts/e2e/mcp-channels-docker.sh`)
- Pi バンドル MCP ツール (実 stdio MCP サーバー + 埋め込み Pi プロファイル許可/拒否スモーク): `pnpm test:docker:pi-bundle-mcp-tools` (スクリプト: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/サブエージェント MCP クリーンアップ (実 Gateway + 隔離 cron と 1 回限りのサブエージェント実行後の stdio MCP 子プロセスの破棄): `pnpm test:docker:cron-mcp-cleanup` (スクリプト: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin群 (インストールスモーク、ClawHub kitchen-sink インストール/アンインストール、マーケットプレイス更新、Claude バンドルの有効化/検査): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)
  ClawHub ブロックをスキップするには `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` を設定し、デフォルトの kitchen-sink パッケージ/ランタイムペアを上書きするには `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` と `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` を使用します。`OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` がない場合、テストは hermetic なローカル ClawHub フィクスチャサーバーを使用します。
- Plugin 更新変更なしスモーク: `pnpm test:docker:plugin-update` (スクリプト: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- 設定リロードメタデータスモーク: `pnpm test:docker:config-reload` (スクリプト: `scripts/e2e/config-reload-source-docker.sh`)
- 同梱 Plugin ランタイム依存関係: `pnpm test:docker:bundled-channel-deps` は、デフォルトで小さな Docker ランナーイメージをビルドし、ホスト上で OpenClaw を一度ビルドしてパックし、その tarball を各 Linux インストールシナリオにマウントします。イメージを再利用するには `OPENCLAW_SKIP_DOCKER_BUILD=1` を使用し、新しいローカルビルド後にホスト側の再ビルドをスキップするには `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` を使用し、既存の tarball を指すには `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` を使用します。完全な Docker 集約とリリースパスの bundled-channel チャンクは、この tarball を一度事前パックし、その後 Telegram、Discord、Slack、Feishu、memory-lancedb、ACPX の個別更新レーンを含む独立レーンへ同梱チャンネルチェックを分割します。リリースチャンクは、チャンネルスモーク、更新ターゲット、セットアップ/ランタイム契約を `bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b`、`bundled-channels-contracts` に分割します。集約 `bundled-channels` チャンクは手動再実行用に引き続き利用できます。リリースワークフローは、プロバイダーインストーラーチャンクと同梱 Plugin のインストール/アンインストールチャンクも分割します。従来の `package-update`、`plugins-runtime`、`plugins-integrations` チャンクは、手動再実行用の集約エイリアスとして残ります。同梱レーンを直接実行する際にチャンネルマトリクスを絞るには `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` を使用し、更新シナリオを絞るには `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` を使用します。シナリオごとの Docker 実行はデフォルトで `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s` です。複数ターゲット更新シナリオはデフォルトで `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s` です。このレーンは、`channels.<id>.enabled=false` と `plugins.entries.<id>.enabled=false` が doctor/ランタイム依存関係修復を抑制することも検証します。
- 反復作業中に無関係なシナリオを無効化して、同梱 Plugin ランタイム依存関係を絞ります。例:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

共有機能イメージを手動で事前ビルドして再利用するには:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

`OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` のようなスイート固有のイメージ上書きは、設定されている場合は引き続き優先されます。`OPENCLAW_SKIP_DOCKER_BUILD=1` がリモート共有イメージを指している場合、スクリプトはそれがローカルにまだ存在しなければ pull します。QR とインストーラー Docker テストは、共有ビルド済みアプリランタイムではなくパッケージ/インストール動作を検証するため、独自の Dockerfile を保持します。

ライブモデル Docker ランナーは、現在のチェックアウトも読み取り専用でバインドマウントし、
コンテナ内の一時作業ディレクトリへステージングします。これによりランタイム
イメージをスリムに保ちながら、正確なローカルソース/設定に対して Vitest を実行できます。
ステージング手順では、Docker ライブ実行がマシン固有の成果物のコピーに
何分も費やさないよう、`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`、アプリローカルの `.build`、
Gradle 出力ディレクトリなどの大きなローカル専用キャッシュとアプリのビルド出力をスキップします。
`OPENCLAW_SKIP_CHANNELS=1` も設定されるため、Gateway ライブプローブは
コンテナ内で実際の Telegram/Discord などのチャネルワーカーを起動しません。
`test:docker:live-models` は引き続き `pnpm test:live` を実行するため、
その Docker レーンから Gateway ライブカバレッジを絞り込む、または除外する必要がある場合は
`OPENCLAW_LIVE_GATEWAY_*` も渡してください。
`test:docker:openwebui` は、より上位の互換性スモークテストです。OpenAI 互換 HTTP エンドポイントを有効にした
OpenClaw Gateway コンテナを起動し、その Gateway に向けて固定された Open WebUI コンテナを起動し、
Open WebUI 経由でサインインし、`/api/models` が `openclaw/default` を公開していることを検証したうえで、
Open WebUI の `/api/chat/completions` プロキシ経由で実際のチャットリクエストを送信します。
初回実行は目に見えて遅くなることがあります。Docker が
Open WebUI イメージを pull する必要があり、Open WebUI が自身のコールドスタートセットアップを完了する必要があるためです。
このレーンでは利用可能なライブモデルキーが必要で、`OPENCLAW_PROFILE_FILE`
（デフォルトは `~/.profile`）が Docker 化実行でそれを提供する主な方法です。
成功した実行では、`{ "ok": true, "model":
"openclaw/default", ... }` のような小さな JSON ペイロードが出力されます。
`test:docker:mcp-channels` は意図的に決定的であり、実際の
Telegram、Discord、iMessage アカウントは不要です。シード済み Gateway
コンテナを起動し、`openclaw mcp serve` を生成する 2 つ目のコンテナを起動したうえで、
ルーティングされた会話の検出、トランスクリプト読み取り、添付ファイルメタデータ、
ライブイベントキューの挙動、アウトバウンド送信ルーティング、実際の stdio MCP ブリッジ越しの Claude スタイルのチャネル +
権限通知を検証します。通知チェックは
raw stdio MCP フレームを直接検査するため、このスモークテストは
特定のクライアント SDK がたまたま表に出す内容だけでなく、ブリッジが実際に出力する内容を検証します。
`test:docker:pi-bundle-mcp-tools` は決定的で、ライブ
モデルキーは不要です。リポジトリの Docker イメージをビルドし、コンテナ内で実際の stdio MCP プローブサーバーを起動し、
埋め込み Pi バンドル MCP ランタイムを通じてそのサーバーを実体化し、
ツールを実行したうえで、`coding` と `messaging` が
`bundle-mcp` ツールを保持し、`minimal` と `tools.deny: ["bundle-mcp"]` がそれらをフィルターすることを検証します。
`test:docker:cron-mcp-cleanup` は決定的で、ライブモデル
キーは不要です。実際の stdio MCP プローブサーバーを持つシード済み Gateway を起動し、
隔離された Cron ターンと `/subagents spawn` のワンショット子ターンを実行したうえで、
各実行後に MCP 子プロセスが終了することを検証します。

手動 ACP 自然言語スレッドスモーク（CI 対象外）:

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグワークフロー用に残してください。ACP スレッドルーティング検証で再び必要になる可能性があるため、削除しないでください。

有用な環境変数:

- `OPENCLAW_CONFIG_DIR=...`（デフォルト: `~/.openclaw`）は `/home/node/.openclaw` にマウントされます
- `OPENCLAW_WORKSPACE_DIR=...`（デフォルト: `~/.openclaw/workspace`）は `/home/node/.openclaw/workspace` にマウントされます
- `OPENCLAW_PROFILE_FILE=...`（デフォルト: `~/.profile`）は `/home/node/.profile` にマウントされ、テスト実行前に source されます
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` は、`OPENCLAW_PROFILE_FILE` から source された環境変数だけを検証します。一時設定/ワークスペースディレクトリを使い、外部 CLI 認証マウントは使いません
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（デフォルト: `~/.cache/openclaw/docker-cli-tools`）は、Docker 内のキャッシュ済み CLI インストール用に `/home/node/.npm-global` にマウントされます
- `$HOME` 配下の外部 CLI 認証ディレクトリ/ファイルは `/host-auth...` 配下に読み取り専用でマウントされ、その後テスト開始前に `/home/node/...` へコピーされます
  - デフォルトディレクトリ: `.minimax`
  - デフォルトファイル: `~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 絞り込んだプロバイダー実行では、`OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` から推定される必要なディレクトリ/ファイルのみをマウントします
  - `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`、または `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` のようなカンマ区切りリストで手動上書きします
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` で実行を絞り込みます
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` でコンテナ内のプロバイダーをフィルターします
- `OPENCLAW_SKIP_DOCKER_BUILD=1` で、リビルドが不要な再実行に既存の `openclaw:local-live` イメージを再利用します
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` で、認証情報が環境変数ではなくプロフィールストアから来ることを保証します
- `OPENCLAW_OPENWEBUI_MODEL=...` で、Open WebUI スモークテスト用に Gateway が公開するモデルを選択します
- `OPENCLAW_OPENWEBUI_PROMPT=...` で、Open WebUI スモークテストが使う nonce チェックプロンプトを上書きします
- `OPENWEBUI_IMAGE=...` で、固定された Open WebUI イメージタグを上書きします

## ドキュメント健全性

ドキュメント編集後はドキュメントチェックを実行します: `pnpm check:docs`.
ページ内見出しチェックも必要な場合は、Mintlify の完全なアンカー検証を実行します: `pnpm docs:check-links:anchors`.

## オフライン回帰（CI で安全に実行可能）

これらは実プロバイダーを使わない「実パイプライン」回帰テストです:

- Gateway ツール呼び出し（モック OpenAI、実際の Gateway + エージェントループ）: `src/gateway/gateway.test.ts`（ケース: 「Gateway エージェントループを介して、モック OpenAI ツール呼び出しをエンドツーエンドで実行する」）
- Gateway ウィザード（WS `wizard.start`/`wizard.next`、設定を書き込み + 認証を強制）: `src/gateway/gateway.test.ts`（ケース: 「ws 経由でウィザードを実行し、認証トークン設定を書き込む」）

## エージェント信頼性評価（Skills）

すでに「エージェント信頼性評価」のように振る舞う CI で安全に実行できるテストがいくつかあります:

- 実際の Gateway + エージェントループを通したモックツール呼び出し（`src/gateway/gateway.test.ts`）。
- セッション配線と設定効果を検証するエンドツーエンドのウィザードフロー（`src/gateway/gateway.test.ts`）。

Skills でまだ不足しているもの（[Skills](/ja-JP/tools/skills) を参照）:

- **判断:** プロンプトに Skills が一覧されている場合、エージェントは適切なスキルを選ぶ（または無関係なものを避ける）か？
- **準拠:** エージェントは使用前に `SKILL.md` を読み、必須手順/引数に従うか？
- **ワークフロー契約:** ツール順序、セッション履歴の引き継ぎ、サンドボックス境界をアサートする複数ターンのシナリオ。

今後の評価では、まず決定的であることを優先してください:

- モックプロバイダーを使ってツール呼び出し + 順序、スキルファイル読み取り、セッション配線をアサートするシナリオランナー。
- Skills に焦点を当てた小さなシナリオスイート（使用と回避、ゲーティング、プロンプトインジェクション）。
- CI で安全に実行できるスイートが整ってからのみ、任意のライブ評価（オプトイン、環境変数でゲート）。

## 契約テスト（Plugin とチャネル形状）

契約テストは、登録済みのすべての Plugin とチャネルがそれぞれの
インターフェイス契約に準拠していることを検証します。発見されたすべての Plugin を反復し、
形状と挙動のアサーションスイートを実行します。デフォルトの `pnpm test` ユニットレーンは
これらの共有境界ファイルとスモークファイルを意図的にスキップします。共有チャネルまたはプロバイダーサーフェスを触る場合は、
契約コマンドを明示的に実行してください。

### コマンド

- すべての契約: `pnpm test:contracts`
- チャネル契約のみ: `pnpm test:contracts:channels`
- プロバイダー契約のみ: `pnpm test:contracts:plugins`

### チャネル契約

`src/channels/plugins/contracts/*.contract.test.ts` にあります:

- **Plugin** - 基本的な Plugin 形状（id、name、capabilities）
- **セットアップ** - セットアップウィザード契約
- **セッションバインディング** - セッションバインディングの挙動
- **アウトバウンドペイロード** - メッセージペイロード構造
- **インバウンド** - インバウンドメッセージ処理
- **アクション** - チャネルアクションハンドラー
- **スレッド化** - スレッド ID 処理
- **ディレクトリ** - ディレクトリ/名簿 API
- **グループポリシー** - グループポリシーの強制

### プロバイダーステータス契約

`src/plugins/contracts/*.contract.test.ts` にあります。

- **ステータス** - チャネルステータスプローブ
- **レジストリ** - Plugin レジストリ形状

### プロバイダー契約

`src/plugins/contracts/*.contract.test.ts` にあります:

- **認証** - 認証フロー契約
- **認証選択** - 認証の選択/選定
- **カタログ** - モデルカタログ API
- **検出** - Plugin 検出
- **ローダー** - Plugin 読み込み
- **ランタイム** - プロバイダーランタイム
- **形状** - Plugin 形状/インターフェイス
- **ウィザード** - セットアップウィザード

### 実行するタイミング

- plugin-sdk のエクスポートまたはサブパスを変更した後
- チャネルまたはプロバイダー Plugin を追加または変更した後
- Plugin 登録または検出をリファクタリングした後

契約テストは CI で実行され、実際の API キーは不要です。

## 回帰テストの追加（ガイダンス）

ライブで発見されたプロバイダー/モデル問題を修正する場合:

- 可能であれば CI で安全に実行できる回帰テストを追加します（モック/スタブプロバイダー、または正確なリクエスト形状変換の捕捉）
- 本質的にライブ専用（レート制限、認証ポリシー）の場合は、ライブテストを狭く保ち、環境変数によるオプトインにします
- バグを捕捉する最小レイヤーを狙うことを優先します:
  - プロバイダーリクエスト変換/リプレイのバグ → 直接のモデルテスト
  - Gateway セッション/履歴/ツールパイプラインのバグ → Gateway ライブスモークまたは CI で安全に実行できる Gateway モックテスト
- SecretRef トラバーサルガードレール:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` は、レジストリメタデータ（`listSecretTargetRegistryEntries()`）から SecretRef クラスごとにサンプル対象を 1 つ導出し、その後トラバーサルセグメントの exec ID が拒否されることをアサートします。
  - `src/secrets/target-registry-data.ts` に新しい `includeInPlan` SecretRef ターゲットファミリーを追加する場合は、そのテストの `classifyTargetClass` を更新してください。このテストは未分類のターゲット ID で意図的に失敗するため、新しいクラスが静かにスキップされることはありません。

## 関連

- [ライブテスト](/ja-JP/help/testing-live)
- [CI](/ja-JP/ci)
