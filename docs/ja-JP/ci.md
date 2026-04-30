---
read_when:
    - CI ジョブが実行された、または実行されなかった理由を理解する必要がある
    - 失敗している GitHub Actions チェックをデバッグしています
summary: CI ジョブグラフ、スコープゲート、対応するローカルコマンド
title: CI パイプライン
x-i18n:
    generated_at: "2026-04-30T05:02:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf49b1c3ac7b596b0c92652f69de86053b3ba711dabcf083f4f31dd8e27fdd8f
    source_path: ci.md
    workflow: 16
---

CI は `main` へのすべての push とすべての pull request で実行されます。無関係な領域だけが変更された場合は、高コストなジョブをスキップするためにスマートスコープを使用します。手動の `workflow_dispatch` 実行は、リリース候補や広範な検証のために意図的にスマートスコープを迂回し、通常の CI グラフ全体に展開されます。スタンドアロンの手動実行では、Android レーンは `include_android` によってオプトインされます。リリース専用の Plugin プレリリースレーンは、別の `Plugin Prerelease` ワークフロー内にあり、`Full Release Validation` または明示的な手動 dispatch からのみ実行されます。

`check-dependencies` シャードは `pnpm deadcode:dependencies` を実行します。これは、そのスクリプトで使用される最新の Knip バージョンに固定された、本番用の Knip 依存関係専用パスであり、`dlx` インストールでは pnpm の最小リリース経過期間が無効化されています。また、`pnpm deadcode:unused-files` も実行します。これは Knip の本番用未使用ファイル検出結果を `scripts/deadcode-unused-files.allowlist.mjs` と比較します。このガードは、PR が新しい未レビューの未使用ファイルを追加した場合や、クリーンアップ後に古い allowlist エントリを残した場合に失敗します。一方で、Knip が静的に解決できない、意図的な動的 Plugin、生成物、ビルド、ライブテスト、パッケージブリッジの各サーフェスは保持します。

`Full Release Validation` は、「リリース前にすべてを実行する」ための手動の包括ワークフローです。ブランチ、タグ、または完全なコミット SHA を受け取り、そのターゲットで手動の `CI` ワークフローを dispatch し、リリース専用の Plugin/パッケージ/静的/Docker 証明用に `Plugin Prerelease` を dispatch し、インストールスモーク、パッケージ受け入れ、Docker リリースパススイート、ライブ/E2E、OpenWebUI、QA Lab パリティ、Matrix、Telegram レーン用に `OpenClaw Release Checks` を dispatch します。公開済みパッケージ仕様が指定された場合は、公開後の `NPM Telegram Beta E2E` ワークフローも実行できます。`release_profile=minimum|stable|full` は、リリースチェックへ渡されるライブ/プロバイダーの幅を制御します。`minimum` は最速の OpenAI/コアのリリースクリティカルなレーンに絞り、`stable` は安定版のプロバイダー/バックエンドセットを追加し、`full` は広範な助言的プロバイダー/メディアマトリクスを実行します。この包括ワークフローは dispatch された子 run id を記録し、最後の `Verify full validation` ジョブが現在の子 run の結論を再確認し、各子 run の最も遅いジョブの表を追記します。子ワークフローを再実行してグリーンになった場合は、親の検証ジョブだけを再実行して、包括結果とタイミング要約を更新してください。

復旧のために、`Full Release Validation` と `OpenClaw Release Checks` はどちらも `rerun_group` を受け取ります。リリース候補には `all`、通常のフル CI 子だけには `ci`、すべてのリリース子には `release-checks`、またはより狭いリリースグループとして、包括ワークフロー上の `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` を使用します。これにより、重点的な修正後に失敗したリリースボックスの再実行範囲を限定できます。

リリースのライブ/E2E 子は、広範なネイティブ `pnpm test:live` カバレッジを維持しますが、1 つのシリアルジョブではなく、`scripts/test-live-shard.mjs` を通じて名前付きシャード（`native-live-src-agents`、`native-live-src-gateway-core`、プロバイダーフィルター済みの `native-live-src-gateway-profiles` ジョブ、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、分割されたメディア音声/動画シャード、プロバイダーフィルター済みの音楽シャード）として実行します。これにより同じファイルカバレッジを維持しつつ、遅いライブプロバイダーの失敗を再実行および診断しやすくします。集約された `native-live-extensions-o-z`、`native-live-extensions-media`、`native-live-extensions-media-music` シャード名は、手動の単発再実行用として引き続き有効です。

ネイティブライブメディアシャードは、`Live Media Runner Image` ワークフローでビルドされる `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` で実行されます。そのイメージには `ffmpeg` と `ffprobe` が事前インストールされており、メディアジョブはセットアップ前にバイナリを検証するだけです。Docker バックのライブスイートは通常の Blacksmith runner 上に維持してください。コンテナジョブは、ネストされた Docker テストを起動する場所として適していないためです。

Docker バックのライブモデル/バックエンドシャードは、選択されたコミットごとに別の共有 `ghcr.io/openclaw/openclaw-live-test:<sha>` イメージを使用します。ライブリリースワークフローは、そのイメージを一度だけビルドして push し、その後 Docker ライブモデル、Gateway、CLI バックエンド、ACP バインド、Codex ハーネスの各シャードが `OPENCLAW_SKIP_DOCKER_BUILD=1` で実行されます。これらのシャードがフルソース Docker ターゲットを個別に再ビルドしている場合、そのリリース run は設定ミスであり、重複イメージビルドで実時間を浪費します。

`OpenClaw Release Checks` は、信頼されたワークフロー ref を使用して、選択された ref を一度だけ `release-package-under-test` tarball に解決し、その成果物をライブ/E2E リリースパス Docker ワークフローとパッケージ受け入れシャードの両方に渡します。これにより、リリースボックス間でパッケージのバイト列が一貫し、複数の子ジョブで同じ候補を再パックすることを避けられます。

`Package Acceptance` は、リリースワークフローをブロックせずにパッケージ成果物を検証するためのサイド実行ワークフローです。公開済み npm 仕様、選択された `workflow_ref` ハーネスでビルドされた信頼済み `package_ref`、SHA-256 付き HTTPS tarball URL、または別の GitHub Actions run からの tarball 成果物から 1 つの候補を解決し、それを `package-under-test` としてアップロードしたうえで、ワークフローチェックアウトを再パックする代わりに、その tarball を使って Docker リリース/E2E スケジューラーを再利用します。プロファイルは、スモーク、パッケージ、プロダクト、フル、カスタムの Docker レーン選択を対象にします。`package` プロファイルはオフライン Plugin カバレッジを使用するため、公開済みパッケージの検証はライブ ClawHub の可用性に依存しません。任意の Telegram レーンは、`NPM Telegram Beta E2E` ワークフロー内で `package-under-test` 成果物を再利用し、公開済み npm 仕様パスはスタンドアロン dispatch 用に保持されます。

## パッケージ受け入れ

「このインストール可能な OpenClaw パッケージはプロダクトとして動作するか」を確認する場合は、`Package Acceptance` を使用します。これは通常の CI とは異なります。通常の CI はソースツリーを検証しますが、パッケージ受け入れは、インストールまたは更新後にユーザーが実行するものと同じ Docker E2E ハーネスを通じて、単一の tarball を検証します。

このワークフローには 4 つのジョブがあります。

1. `resolve_package` は `workflow_ref` をチェックアウトし、1 つのパッケージ候補を解決し、`.artifacts/docker-e2e-package/openclaw-current.tgz` を書き込み、`.artifacts/docker-e2e-package/package-candidate.json` を書き込み、その両方を `package-under-test` 成果物としてアップロードし、GitHub ステップサマリーにソース、ワークフロー ref、パッケージ ref、バージョン、SHA-256、プロファイルを出力します。
2. `docker_acceptance` は `openclaw-live-and-e2e-checks-reusable.yml` を `ref=workflow_ref` と `package_artifact_name=package-under-test` で呼び出します。再利用可能ワークフローはその成果物をダウンロードし、tarball インベントリを検証し、必要に応じてパッケージダイジェスト Docker イメージを準備し、ワークフローチェックアウトをパックする代わりに、そのパッケージに対して選択された Docker レーンを実行します。プロファイルが複数のターゲット `docker_lanes` を選択した場合、再利用可能ワークフローはパッケージと共有イメージを一度だけ準備し、それらのレーンを一意の成果物を持つ並列ターゲット Docker ジョブとして展開します。
3. `package_telegram` は任意で `NPM Telegram Beta E2E` を呼び出します。これは `telegram_mode` が `none` でない場合に実行され、Package Acceptance が解決した場合は同じ `package-under-test` 成果物をインストールします。スタンドアロンの Telegram dispatch では、引き続き公開済み npm 仕様をインストールできます。
4. `summary` は、パッケージ解決、Docker 受け入れ、または任意の Telegram レーンが失敗した場合にワークフローを失敗させます。

候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または `openclaw@2026.4.27-beta.2` のような正確な OpenClaw リリースバージョンだけを受け付けます。公開済み beta/stable の受け入れに使用します。
- `source=ref`: 信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパックします。リゾルバーは OpenClaw のブランチ/タグを fetch し、選択されたコミットがリポジトリのブランチ履歴またはリリースタグから到達可能であることを検証し、分離された worktree に依存関係をインストールし、`scripts/package-openclaw-for-docker.mjs` でパックします。
- `source=url`: HTTPS の `.tgz` をダウンロードします。`package_sha256` は必須です。
- `source=artifact`: `artifact_run_id` と `artifact_name` から 1 つの `.tgz` をダウンロードします。`package_sha256` は任意ですが、外部共有された成果物には指定するべきです。

`workflow_ref` と `package_ref` は分離したままにしてください。`workflow_ref` はテストを実行する信頼済みワークフロー/ハーネスコードです。`package_ref` は、`source=ref` の場合にパックされるソースコミットです。これにより、古いワークフローロジックを実行せずに、現在のテストハーネスで古い信頼済みソースコミットを検証できます。

プロファイルは Docker カバレッジに対応します。

- `smoke`: `npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`: `npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`: `package` に加えて `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`: OpenWebUI を含む完全な Docker リリースパスチャンク
- `custom`: 正確な `docker_lanes`。`suite_profile=custom` の場合は必須です

リリースチェックは Package Acceptance を `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'`、`telegram_mode=mock-openai` で呼び出します。リリースパス Docker チャンクは重複するパッケージ/更新/Plugin レーンをカバーし、Package Acceptance は同じ解決済みパッケージ tarball に対して、成果物ネイティブの bundled-channel 互換性、オフライン Plugin、Telegram の証明を維持します。
Cross-OS リリースチェックは、OS 固有のオンボーディング、インストーラー、プラットフォーム動作を引き続きカバーします。パッケージ/更新のプロダクト検証は Package Acceptance から開始するべきです。Windows のパッケージ済みレーンとインストーラー fresh レーンは、インストール済みパッケージが生の絶対 Windows パスからブラウザー制御オーバーライドを import できることも検証します。OpenAI の cross-OS agent-turn スモークは、`OPENCLAW_CROSS_OS_OPENAI_MODEL` が設定されている場合はそれをデフォルトにし、そうでない場合は `openai/gpt-5.4-mini` をデフォルトにするため、インストールと Gateway の証明は高速かつ決定的なままです。専用のライブプロバイダー/モデルレーンは、より遅いフロンティアデフォルトを含む、より広範なモデルルーティングを引き続きカバーします。

Package Acceptance には、すでに公開済みのパッケージ向けに限定されたレガシー互換性期間があります。`2026.4.25` までのパッケージ（`2026.4.25-beta.*` を含む）は、tarball から省略されたファイルを指す `dist/postinstall-inventory.json` 内の既知の private QA エントリについて互換性パスを使用できます。パッケージがそのフラグを公開していない場合、`doctor-switch` は `gateway install --wrapper` 永続化サブケースをスキップできます。`update-channel-switch` は、tarball 由来の偽 git fixture から存在しない `pnpm.patchedDependencies` を取り除くことができ、永続化された `update.channel` が存在しないことをログに記録できます。Plugin スモークは、レガシーのインストール記録場所を読み取るか、marketplace インストール記録の永続化が存在しないことを許容できます。また、`plugin-update` は、インストール記録と再インストールなしの動作が変わらないことを引き続き要求しつつ、設定メタデータ移行を許容できます。公開済みの `2026.4.26` パッケージも、すでに出荷されたローカルビルドメタデータスタンプファイルについて警告できます。それ以降のパッケージは最新の契約を満たす必要があります。同じ条件は、警告やスキップではなく失敗になります。

例:

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

失敗したパッケージ受け入れ実行をデバッグするときは、まず `resolve_package` のサマリーでパッケージソース、バージョン、SHA-256 を確認します。次に `docker_acceptance` 子実行とその Docker アーティファクトを調べます: `.artifacts/docker-tests/**/summary.json`、`failures.json`、レーンログ、フェーズのタイミング、再実行コマンド。リリース検証全体を再実行するのではなく、失敗したパッケージプロファイルまたは正確な Docker レーンを再実行することを優先します。

QA Lab には、メインのスマートスコープ付きワークフローの外側に専用の CI レーンがあります。`Parity gate` ワークフローは、一致する PR 変更と手動ディスパッチで実行されます。これはプライベート QA ランタイムをビルドし、モック GPT-5.5 と Opus 4.6 のエージェント型パックを比較します。`QA-Lab - All Lanes` ワークフローは `main` で毎晩、および手動ディスパッチで実行されます。モックのパリティゲート、ライブ Matrix レーン、ライブ Telegram および Discord レーンを並列ジョブとして展開します。ライブジョブは `qa-live-shared` 環境を使用し、Telegram/Discord は Convex リースを使用します。リリースチェックは、決定論的モックプロバイダーとモック修飾モデル (`mock-openai/gpt-5.5` と `mock-openai/gpt-5.5-alt`) で Matrix と Telegram のライブトランスポートレーンを実行し、チャネル契約をライブモデルのレイテンシや通常のプロバイダー Plugin 起動から分離します。ライブトランスポート Gateway はメモリ検索も無効にします。QA パリティがメモリ動作を別途カバーしているためです。プロバイダー接続性は、別個のライブモデル、ネイティブプロバイダー、Docker プロバイダーのスイートでカバーされます。Matrix はスケジュール済みゲートとリリースゲートで `--profile fast` を使用し、チェックアウトされた CLI が対応している場合のみ `--fail-fast` を追加します。CLI のデフォルトと手動ワークフロー入力は `all` のままです。手動の `matrix_profile=all` ディスパッチでは、Matrix の全カバレッジを常に `transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` ジョブにシャード化します。`OpenClaw Release Checks` も、リリース承認前にリリースクリティカルな QA Lab レーンを実行します。その QA パリティゲートは候補パックとベースラインパックを並列レーンジョブとして実行し、その後、最終的なパリティ比較のために小さなレポートジョブへ両方のアーティファクトをダウンロードします。変更が実際に QA ランタイム、モデルパックのパリティ、またはパリティワークフローが所有するサーフェスに触れる場合を除き、PR のランディングパスを `Parity gate` の背後に置かないでください。通常のチャネル、設定、ドキュメント、またはユニットテストの修正では、これは任意のシグナルとして扱い、スコープ化された CI/チェック証拠に従います。

`Duplicate PRs After Merge` ワークフローは、ランディング後の重複クリーンアップのための手動メンテナーワークフローです。デフォルトはドライランで、`apply=true` のときに明示的に列挙された PR のみを閉じます。GitHub を変更する前に、ランディング済み PR がマージ済みであること、および各重複に共有された参照先 issue または重複する変更ハンクがあることを検証します。

`CodeQL` ワークフローは、リポジトリ全体のスイープではなく、意図的に狭い初回パスのセキュリティスキャナーです。日次、手動、非ドラフトのプルリクエストガード実行では、Actions ワークフローコードに加え、最もリスクの高い JavaScript/TypeScript の auth、secrets、sandbox、cron、Gateway サーフェスを、`/codeql-security-high/core-auth-secrets` カテゴリの下で high/critical の `security-severity` にフィルターされた高信頼度セキュリティクエリでスキャンします。channel-runtime-boundary ジョブは、コアチャネル実装契約に加え、チャネル Plugin ランタイム、Gateway、Plugin SDK、シークレット、監査タッチポイントを `/codeql-security-high/channel-runtime-boundary` カテゴリの下で別途スキャンし、チャネルセキュリティシグナルをベースラインの auth/secrets カテゴリを広げずにスケールできるようにします。network-ssrf-boundary ジョブは、コア SSRF、IP パース、ネットワークガード、web-fetch、Plugin SDK の SSRF ポリシーサーフェスを `/codeql-security-high/network-ssrf-boundary` カテゴリの下でスキャンし、ネットワーク信頼境界のシグナルを auth/secrets セキュリティベースラインから分離したままにします。mcp-process-tool-boundary ジョブは、MCP サーバー、プロセス実行ヘルパー、アウトバウンド配信、エージェントのツール実行ゲートを `/codeql-security-high/mcp-process-tool-boundary` カテゴリの下でスキャンし、コマンドとツール境界のシグナルを auth/secrets ベースラインおよび非セキュリティの MCP/process 品質シャードの両方から分離したままにします。plugin-trust-boundary ジョブは、Plugin インストール、ローダー、マニフェスト、レジストリ、ランタイム依存関係ステージング、ソース読み込み、パブリックサーフェス、Plugin SDK パッケージ契約の信頼サーフェスを `/codeql-security-high/plugin-trust-boundary` カテゴリの下でスキャンし、Plugin のサプライチェーンとランタイム読み込みのシグナルを、バンドル済み Plugin 実装コードおよび非セキュリティの Plugin 品質シャードの両方から分離したままにします。プルリクエストガードは軽量に保たれます。`.github/actions`、`.github/codeql`、`.github/workflows`、`packages`、または `src` 配下の変更でのみ開始し、スケジュール済みワークフローと同じ高信頼度セキュリティマトリクスを実行します。Android と macOS の CodeQL は PR のデフォルトに含めません。

`CodeQL Android Critical Security` ワークフローは、スケジュール済みの Android セキュリティシャードです。ワークフロー健全性が受け入れる最小の Blacksmith Linux ランナーラベル上で CodeQL 用に Android アプリを手動でビルドし、`/codeql-critical-security/android` カテゴリの下で結果をアップロードします。

`CodeQL macOS Critical Security` ワークフローは、週次/手動の macOS セキュリティシャードです。Blacksmith macOS 上で CodeQL 用に macOS アプリを手動でビルドし、依存関係ビルドの結果をアップロード対象の SARIF から除外し、`/codeql-critical-security/macos` カテゴリの下で結果をアップロードします。クリーンな場合でも macOS ビルドがランタイムを支配するため、日次のデフォルトワークフローの外に保ちます。

`CodeQL Critical Quality` ワークフローは、対応する非セキュリティシャードです。より小さい Blacksmith Linux ランナー上で、狭い高価値サーフェスに対して error-severity の非セキュリティ JavaScript/TypeScript 品質クエリのみを実行します。そのプルリクエストガードは、スケジュール済みプロファイルより意図的に小さくなっています。非ドラフト PR では、Gateway プロトコル/サーバーメソッド、プロバイダーランタイム/モデルカタログ、Plugin ローダー、Plugin SDK、またはパッケージ契約の変更に対して、一致する `gateway-runtime-boundary`、`provider-runtime-boundary`、`plugin-boundary`、`plugin-sdk-package-contract` シャードのみを実行します。CodeQL 設定と品質ワークフローの変更では、4 つすべての PR 品質シャードを実行します。手動ディスパッチは `profile=all|gateway-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary` を受け付けます。狭いプロファイルは、ワークフローの残りをディスパッチせずに 1 つの品質シャードを単独で実行するための学習/反復用フックです。その core-auth-secrets ジョブは、auth、secrets、sandbox、cron、Gateway セキュリティ境界コードを、別個の `/codeql-critical-quality/core-auth-secrets` カテゴリの下でスキャンします。config-boundary ジョブは、設定スキーマ、マイグレーション、正規化、IO 契約を、別個の `/codeql-critical-quality/config-boundary` カテゴリの下でスキャンします。gateway-runtime-boundary ジョブは、Gateway プロトコルスキーマとサーバーメソッド契約を、別個の `/codeql-critical-quality/gateway-runtime-boundary` カテゴリの下でスキャンします。channel-runtime-boundary ジョブは、コアチャネル実装契約を、別個の `/codeql-critical-quality/channel-runtime-boundary` カテゴリの下でスキャンします。agent-runtime-boundary ジョブは、コマンド実行、モデル/プロバイダーのディスパッチ、自動返信のディスパッチとキュー、ACP コントロールプレーンランタイム契約を、別個の `/codeql-critical-quality/agent-runtime-boundary` カテゴリの下でスキャンします。mcp-process-runtime-boundary ジョブは、MCP サーバーとツールブリッジ、プロセス監視ヘルパー、アウトバウンド配信契約を、別個の `/codeql-critical-quality/mcp-process-runtime-boundary` カテゴリの下でスキャンします。memory-runtime-boundary ジョブは、メモリホスト SDK、メモリランタイムファサード、メモリ Plugin SDK エイリアス、メモリランタイム有効化グルー、メモリ doctor コマンドを、別個の `/codeql-critical-quality/memory-runtime-boundary` カテゴリの下でスキャンします。session-diagnostics-boundary ジョブは、返信キュー内部、セッション配信キュー、アウトバウンドセッションのバインド/配信ヘルパー、診断イベント/ログバンドルサーフェス、セッション doctor CLI 契約を、別個の `/codeql-critical-quality/session-diagnostics-boundary` カテゴリの下でスキャンします。plugin-sdk-reply-runtime ジョブは、Plugin SDK のインバウンド返信ディスパッチ、返信ペイロード/チャンク化/ランタイムヘルパー、チャネル返信オプション、配信キュー、セッション/スレッドのバインドヘルパーを、別個の `/codeql-critical-quality/plugin-sdk-reply-runtime` カテゴリの下でスキャンします。provider-runtime-boundary ジョブは、モデルカタログ正規化、プロバイダー認証と検出、プロバイダーランタイム登録、プロバイダーのデフォルト/カタログ、web/search/fetch/embedding プロバイダーレジストリを、別個の `/codeql-critical-quality/provider-runtime-boundary` カテゴリの下でスキャンします。ui-control-plane ジョブは、Control UI ブートストラップ、ローカル永続化、Gateway 制御フロー、タスクコントロールプレーンランタイム契約を、別個の `/codeql-critical-quality/ui-control-plane` カテゴリの下でスキャンします。web-media-runtime-boundary ジョブは、コア web fetch/search、メディア IO、メディア理解、画像生成、メディア生成ランタイム契約を、別個の `/codeql-critical-quality/web-media-runtime-boundary` カテゴリの下でスキャンします。plugin-boundary ジョブは、ローダー、レジストリ、パブリックサーフェス、Plugin SDK エントリポイント契約を、別個の `/codeql-critical-quality/plugin-boundary` カテゴリの下でスキャンします。plugin-sdk-package-contract ジョブは、公開パッケージ側の Plugin SDK ソースと Plugin パッケージ契約ヘルパーを、別個の `/codeql-critical-quality/plugin-sdk-package-contract` カテゴリの下でスキャンします。品質の検出結果を、セキュリティシグナルを不明瞭にせずにスケジュール、測定、無効化、拡張できるように、ワークフローはセキュリティとは分離しておきます。Swift、Python、バンドル済み Plugin の CodeQL 拡張は、狭いプロファイルのランタイムとシグナルが安定してから、スコープ化またはシャード化されたフォローアップ作業としてのみ戻してください。

`Docs Agent` ワークフローは、最近ランディングした変更と既存ドキュメントの整合性を保つための、イベント駆動の Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push CI 実行が成功するとトリガーされる場合があり、手動ディスパッチで直接実行することもできます。workflow-run 呼び出しは、`main` が先に進んでいる場合、またはスキップされていない別の Docs Agent 実行が直近 1 時間以内に作成されている場合はスキップします。実行時には、前回のスキップされていない Docs Agent ソース SHA から現在の `main` までのコミット範囲をレビューするため、1 時間ごとの 1 回の実行で、前回のドキュメントパス以降に蓄積したすべての main 変更をカバーできます。

`Test Performance Agent` ワークフローは、低速なテスト向けのイベント駆動型 Codex メンテナンスレーンです。純粋なスケジュールはありません。`main` への bot 以外の push で CI が成功するとトリガーされることがありますが、その UTC 日に別の workflow-run 呼び出しがすでに実行済み、または実行中の場合はスキップします。手動 dispatch は、この日次アクティビティゲートをバイパスします。このレーンは、フルスイートのグループ化された Vitest パフォーマンスレポートを作成し、Codex には広範なリファクタリングではなくカバレッジを維持する小さなテストパフォーマンス修正だけを行わせます。その後、フルスイートレポートを再実行し、合格ベースラインテスト数を減らす変更を拒否します。ベースラインに失敗しているテストがある場合、Codex が修正できるのは明らかな失敗だけであり、agent 後のフルスイートレポートは、何かが commit される前に合格している必要があります。bot の push が landing する前に `main` が進んだ場合、このレーンは検証済みパッチを rebase し、`pnpm check:changed` を再実行して push を再試行します。競合する古いパッチはスキップされます。GitHub ホストの Ubuntu を使用するため、Codex action は docs agent と同じ drop-sudo の安全姿勢を維持できます。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## ジョブ概要

| ジョブ                           | 目的                                                                                         | 実行タイミング                   |
| -------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------- |
| `preflight`                      | docs のみの変更、変更スコープ、変更された extensions、CI manifest を検出                     | draft ではない push と PR では常時 |
| `security-scm-fast`              | 秘密鍵の検出と `zizmor` による workflow 監査                                                  | draft ではない push と PR では常時 |
| `security-dependency-audit`      | npm advisory に対する、依存関係不要の production lockfile 監査                                | draft ではない push と PR では常時 |
| `security-fast`                  | 高速 security ジョブの必須集約                                                                | draft ではない push と PR では常時 |
| `build-artifacts`                | `dist/`、Control UI、ビルド済み artifact チェック、再利用可能な downstream artifact をビルド  | Node 関連の変更                  |
| `checks-fast-core`               | bundled/Plugin-contract/protocol チェックなどの高速 Linux 正当性レーン                       | Node 関連の変更                  |
| `checks-fast-contracts-channels` | 安定した集約チェック結果を持つ、shard 化された channel contract チェック                      | Node 関連の変更                  |
| `checks-node-core-test`          | channel、bundled、contract、extension レーンを除く Core Node テスト shard                    | Node 関連の変更                  |
| `check`                          | shard 化された主なローカルゲート相当: prod types、lint、guards、test types、strict smoke      | Node 関連の変更                  |
| `check-additional`               | architecture、boundary、extension-surface guards、package-boundary、gateway-watch shard       | Node 関連の変更                  |
| `build-smoke`                    | ビルド済み CLI smoke テストと startup-memory smoke                                            | Node 関連の変更                  |
| `checks`                         | ビルド済み artifact の channel テスト用 verifier                                              | Node 関連の変更                  |
| `checks-node-compat-node22`      | Node 22 互換性ビルドと smoke レーン                                                           | release 用の手動 CI dispatch     |
| `check-docs`                     | docs の formatting、lint、broken-link チェック                                                | docs が変更された場合            |
| `skills-python`                  | Python を利用する Skills 向けの Ruff + pytest                                                 | Python Skills 関連の変更         |
| `checks-windows`                 | Windows 固有の process/path テストと、共有 runtime import specifier 回帰                      | Windows 関連の変更               |
| `macos-node`                     | 共有ビルド artifact を使用する macOS TypeScript テストレーン                                  | macOS 関連の変更                 |
| `macos-swift`                    | macOS アプリ向けの Swift lint、ビルド、テスト                                                 | macOS 関連の変更                 |
| `android`                        | 両方の flavor の Android unit テストと 1 つの debug APK ビルド                                | Android 関連の変更               |
| `test-performance-agent`         | 信頼済みアクティビティ後の日次 Codex 低速テスト最適化                                        | Main CI 成功または手動 dispatch  |

手動 CI dispatch は通常の CI と同じジョブグラフを実行しますが、Android 以外の scoped レーンをすべて強制的に有効にします。Linux Node shard、bundled-Plugin shard、channel contract、Node 22 compatibility、`check`、`check-additional`、build smoke、docs チェック、Python Skills、Windows、macOS、Control UI i18n です。単独の手動 CI dispatch は、`include_android=true` の場合にのみ Android を実行します。完全 release umbrella は `include_android=true` を渡すことで Android を有効にします。Plugin プレリリースの static チェック、release 専用の `agentic-plugins` shard、完全な extension batch sweep、Plugin プレリリース Docker レーンは CI から除外されます。Docker プレリリーススイートは、`Full Release Validation` が release-validation ゲートを有効にして別個の `Plugin Prerelease` workflow を dispatch した場合にのみ実行されます。手動実行では一意の concurrency group を使用するため、release-candidate フルスイートが同じ ref 上の別の push や PR 実行によってキャンセルされることはありません。任意の `target_ref` 入力により、信頼済み caller は、選択された dispatch ref の workflow file を使用しながら、そのグラフを branch、tag、または完全な commit SHA に対して実行できます。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## fail-fast の順序

ジョブは、安価なチェックが高コストなチェックの実行前に失敗するように順序付けられています。

1. `preflight` は、そもそもどのレーンが存在するかを決定します。`docs-scope` と `changed-scope` のロジックは、このジョブ内の step であり、独立したジョブではありません。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python` は、より重い artifact ジョブや platform matrix ジョブを待たずにすばやく失敗します。
3. `build-artifacts` は高速 Linux レーンと並行して実行されるため、共有ビルドの準備ができ次第 downstream consumer が開始できます。
4. その後、より重い platform レーンと runtime レーンが fan out します。`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android` です。

スコープロジックは `scripts/ci-changed-scope.mjs` にあり、`src/scripts/ci-changed-scope.test.ts` のユニットテストでカバーされています。
手動ディスパッチは changed-scope 検出をスキップし、preflight マニフェストを、すべてのスコープ対象領域が変更されたかのように動作させます。
CI ワークフローの編集では Node CI グラフとワークフロー lint を検証しますが、それ自体では Windows、Android、macOS のネイティブビルドを強制しません。これらのプラットフォームレーンは、引き続きプラットフォームソースの変更にスコープされます。
CI ルーティングのみの編集、選択された軽量なコアテストフィクスチャ編集、および狭い Plugin コントラクトヘルパー/テストルーティング編集では、高速な Node 専用マニフェストパスを使用します。preflight、security、単一の `checks-fast-core` タスクです。このパスは、変更ファイルが高速タスクで直接実行されるルーティングまたはヘルパー面に限定されている場合、ビルド成果物、Node 22 互換性、チャンネルコントラクト、完全なコアシャード、バンドル済みPluginシャード、および追加のガードマトリクスを避けます。
Windows Node チェックは、Windows 固有のプロセス/パスラッパー、npm/pnpm/UI ランナーヘルパー、パッケージマネージャー設定、およびそのレーンを実行する CI ワークフロー面にスコープされます。無関係なソース、Plugin、install-smoke、テストのみの変更は Linux Node レーンに残るため、通常のテストシャードですでに実行されているカバレッジのために 16 vCPU の Windows ワーカーを確保しません。
個別の `install-smoke` ワークフローは、独自の `preflight` ジョブを通じて同じスコープスクリプトを再利用します。これはスモークカバレッジを `run_fast_install_smoke` と `run_full_install_smoke` に分割します。Pull request は、Docker/パッケージ面、バンドル済みPluginパッケージ/マニフェスト変更、および Docker スモークジョブが実行するコア Plugin/チャンネル/Gateway/Plugin SDK 面に対して高速パスを実行します。ソースのみのバンドル済みPlugin変更、テストのみの編集、docs のみの編集では Docker ワーカーを確保しません。高速パスはルート Dockerfile イメージを一度だけビルドし、CLI をチェックし、agents delete shared-workspace CLI スモークを実行し、container gateway-network e2e を実行し、バンドル済み拡張機能のビルド引数を検証し、240 秒の集約コマンドタイムアウト内で、各シナリオの Docker 実行を個別に上限設定したうえで、境界付きのバンドル済みPlugin Docker プロファイルを実行します。完全パスは、夜間スケジュール実行、手動ディスパッチ、workflow-call リリースチェック、およびインストーラー/パッケージ/Docker 面に本当に触れる Pull request のために、QR パッケージインストールとインストーラー Docker/update カバレッジを維持します。フルモードでは、install-smoke はターゲット SHA の GHCR ルート Dockerfile スモークイメージを 1 つ準備または再利用し、その後 QR パッケージインストール、ルート Dockerfile/Gateway スモーク、インストーラー/update スモーク、高速なバンドル済みPlugin Docker E2E を個別ジョブとして実行するため、インストーラー作業はルートイメージスモークの後ろで待たされません。マージコミットを含む `main` への push は完全パスを強制しません。changed-scope ロジックが push で完全カバレッジを要求する場合、ワークフローは高速 Docker スモークを維持し、完全な install smoke は夜間またはリリース検証に任せます。低速な Bun グローバルインストール image-provider スモークは `run_bun_global_install_smoke` によって個別にゲートされます。これは夜間スケジュールとリリースチェックワークフローから実行され、手動の `install-smoke` ディスパッチで明示的に有効化できますが、Pull request と `main` push では実行されません。QR とインストーラーの Docker テストは、それぞれ install に重点を置いた独自の Dockerfile を維持します。ローカルの `test:docker:all` は、共有 live-test イメージを 1 つ事前ビルドし、OpenClaw を npm tarball として 1 回だけパックし、共有 `scripts/e2e/Dockerfile` イメージを 2 つビルドします。インストーラー/update/Plugin 依存関係レーン用の素の Node/Git ランナーと、通常機能レーン用に同じ tarball を `/app` にインストールする機能イメージです。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、ランナーは選択されたプランだけを実行します。スケジューラーは `OPENCLAW_DOCKER_E2E_BARE_IMAGE` と `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` でレーンごとのイメージを選択し、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` でレーンを実行します。デフォルトのメインプールスロット数 10 は `OPENCLAW_DOCKER_ALL_PARALLELISM` で、プロバイダー依存のテールプールスロット数 10 は `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` で調整します。重いレーンの上限はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。これにより、npm install と複数サービスのレーンが Docker を過剰に占有せず、軽いレーンは利用可能なスロットを引き続き埋められます。有効な上限より重い単一レーンでも、空のプールから開始でき、その後キャパシティを解放するまで単独で実行されます。レーン開始は、ローカル Docker デーモンの作成集中を避けるため、デフォルトで 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` または別のミリ秒値で上書きします。ローカル集約は Docker を事前確認し、古い OpenClaw E2E コンテナーを削除し、アクティブレーン状態を出力し、最長優先の順序付けのためにレーン所要時間を永続化し、スケジューラー確認用に `OPENCLAW_DOCKER_ALL_DRY_RUN=1` をサポートします。デフォルトでは最初の失敗後に新しいプールレーンのスケジューリングを停止し、各レーンには 120 分のフォールバックタイムアウトがあり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail レーンでは、より厳しいレーン別上限を使用します。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` は、`install-e2e` のようなリリース専用レーンや、`bundled-channel-update-acpx` のような分割済みバンドル更新レーンを含む、正確なスケジューラーレーンを実行します。その際、cleanup smoke をスキップするため、agents は失敗した 1 つのレーンを再現できます。再利用可能な live/E2E ワークフローは、必要なパッケージ、イメージ種別、live イメージ、レーン、認証情報カバレッジを `scripts/test-docker-all.mjs --plan-json` に問い合わせ、その後 `scripts/docker-e2e.mjs` がそのプランを GitHub 出力とサマリーに変換します。これは `scripts/package-openclaw-for-docker.mjs` を通じて OpenClaw をパックするか、現在の実行のパッケージ成果物をダウンロードするか、`package_artifact_run_id` からパッケージ成果物をダウンロードします。tarball インベントリを検証します。パッケージがインストールされたレーンをプランが必要とする場合、Blacksmith の Docker レイヤーキャッシュを通じて、パッケージダイジェストタグ付きの bare/functional GHCR Docker E2E イメージをビルドして push します。そして `docker_e2e_bare_image`/`docker_e2e_functional_image` 入力で提供されたイメージ、または既存のパッケージダイジェストイメージを、再ビルドせずに再利用します。Docker イメージの pull は、試行ごとに 180 秒の境界付きタイムアウトで再試行されるため、停止したレジストリ/キャッシュストリームが CI クリティカルパスの大半を消費する代わりに素早く再試行されます。`Package Acceptance` ワークフローは高レベルのパッケージゲートです。npm、信頼済みの `package_ref`、HTTPS tarball と SHA-256、または過去のワークフロー成果物から候補を解決し、その単一の `package-under-test` 成果物を再利用可能な Docker E2E ワークフローへ渡します。`workflow_ref` を `package_ref` と分離しているため、現在の受け入れロジックは古いワークフローコードを checkout せずに、古い信頼済みコミットを検証できます。リリースチェックは、ターゲット ref に対してカスタム Package Acceptance 差分を実行します。解決済み tarball に対するバンドル済みチャンネル互換性、オフライン Plugin フィクスチャ、Telegram パッケージ QA です。リリースパス Docker スイートは `OPENCLAW_SKIP_DOCKER_BUILD=1` を使って、より小さく分割されたジョブを実行します。これにより各チャンクは必要な種類のイメージだけを pull し、同じ重み付きスケジューラーを通じて複数レーンを実行します（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。OpenWebUI は、完全な release-path カバレッジが要求する場合は `plugins-runtime-services` に組み込まれ、OpenWebUI のみのディスパッチの場合だけスタンドアロンの `openwebui` チャンクを維持します。従来の集約チャンク名 `package-update`、`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は手動再実行では引き続き動作しますが、リリースワークフローでは分割チャンクを使用するため、インストーラー E2E とバンドル済みPluginの install/uninstall スイープがクリティカルパスを支配しません。`install-e2e` レーンエイリアスは、両方のプロバイダーインストーラーレーンに対する集約手動再実行エイリアスとして残ります。`bundled-channels` チャンクは、直列の一体型 `bundled-channel-deps` レーンではなく、分割された `bundled-channel-*` と `bundled-channel-update-*` レーンを実行します。各チャンクは、レーンログ、所要時間、`summary.json`、`failures.json`、フェーズ所要時間、スケジューラープラン JSON、低速レーン表、レーン別再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。ワークフローの `docker_lanes` 入力は、チャンクジョブの代わりに準備済みイメージに対して選択レーンを実行します。これにより、失敗レーンのデバッグを対象 Docker ジョブ 1 つに限定し、その実行用のパッケージ成果物を準備、ダウンロード、または再利用します。選択されたレーンが live Docker レーンの場合、対象ジョブはその再実行用に live-test イメージをローカルでビルドします。生成されるレーン別 GitHub 再実行コマンドには、値が存在する場合、`package_artifact_run_id`、`package_artifact_name`、準備済みイメージ入力が含まれるため、失敗したレーンは失敗した実行とまったく同じパッケージとイメージを再利用できます。GitHub 実行から Docker 成果物をダウンロードし、統合/レーン別の対象再実行コマンドを出力するには `pnpm test:docker:rerun <run-id>` を使用します。低速レーンとフェーズのクリティカルパスサマリーには `pnpm test:docker:timings <summary.json>` を使用します。スケジュール済み live/E2E ワークフローは、完全な release-path Docker スイートを毎日実行します。バンドル更新マトリクスは更新ターゲットごとに分割されているため、繰り返しの npm update と doctor repair パスを他のバンドルチェックと並行してシャードできます。

現在のリリース Docker チャンクは、`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b`、`bundled-channels-contracts` です。集約 `bundled-channels` チャンクは、手動の一括再実行用に引き続き利用できます。また、`plugins-runtime-core`、`plugins-runtime`、`plugins-integrations` は集約 Plugin/runtime エイリアスとして残りますが、リリースワークフローでは分割チャンクを使用するため、チャンネルスモーク、更新ターゲット、Plugin runtime チェック、バンドル済みPluginの install/uninstall スイープを並列実行できます。対象を絞った `docker_lanes` ディスパッチも、1 つの共有パッケージ/イメージ準備ステップの後に、選択された複数レーンを並列ジョブに分割します。また、バンドル済みチャンネル更新レーンは、一時的な npm ネットワーク障害に対して 1 回再試行します。

ローカルの変更レーンロジックは `scripts/changed-lanes.mjs` にあり、`scripts/check-changed.mjs` によって実行されます。このローカルチェックゲートは、広範な CI プラットフォームスコープよりもアーキテクチャ境界について厳格です。コア本番コードの変更ではコア本番とコアテストの型チェックに加えてコアの lint/ガードを実行し、コアのテストのみの変更ではコアテストの型チェックとコアの lint のみを実行します。拡張機能の本番コードの変更では拡張機能本番と拡張機能テストの型チェックに加えて拡張機能の lint を実行し、拡張機能のテストのみの変更では拡張機能テストの型チェックと拡張機能の lint を実行します。公開 Plugin SDK または plugin-contract の変更は、拡張機能がそれらのコア契約に依存しているため拡張機能の型チェックまで広がりますが、Vitest の拡張機能スイープは明示的なテスト作業です。リリースメタデータのみのバージョン更新では、対象を絞ったバージョン/config/ルート依存関係チェックを実行します。不明なルート/config の変更は、安全側に倒してすべてのチェックレーンに回します。
ローカルの変更テストルーティングは `scripts/test-projects.test-support.mjs` にあり、
意図的に `check:changed` より低コストです。テストへの直接編集はそのテスト自体を実行し、
ソース編集は明示的なマッピング、次に兄弟テストとインポートグラフ上の
依存先を優先します。共有グループルーム配信 config は明示的なマッピングの 1 つです。
グループの visible-reply config、ソース返信配信モード、または
message-tool システムプロンプトへの変更は、コア返信テストに加えて Discord と
Slack の配信回帰テストを通るため、共有デフォルトの変更は最初の PR
push の前に失敗します。変更がハーネス全体に及ぶほど広範で、低コストのマッピング済みセットを信頼できる代理にできない場合にのみ、
`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` を使用してください。

Testbox 検証では、リポジトリルートから実行し、広範な証明には新しくウォームアップした box を優先してください。
再利用された、期限切れになった、または予想外に大きな sync が報告された box に遅いゲートを費やす前に、
まず box 内で `pnpm testbox:sanity` を実行してください。この sanity check は、
`pnpm-lock.yaml` のような必須ルートファイルが消えた場合や、`git status --short` で少なくとも 200 件の
tracked deletion が表示される場合に高速に失敗します。これは通常、リモート sync 状態が PR の信頼できるコピーではないことを意味します。
製品テストの失敗をデバッグするのではなく、その box を停止して新しいものをウォームアップしてください。
意図的な大規模削除 PR では、その sanity run に
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` を設定してください。`pnpm
testbox:run` は、post-sync output なしで sync フェーズに 5 分以上留まるローカル Blacksmith CLI 呼び出しも終了します。
そのガードを無効化するには `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` を設定し、通常より大きいローカル diff にはより大きな
ミリ秒値を使用してください。

手動 CI dispatch は、広範な互換性カバレッジとして `checks-node-compat-node22` を実行します。Android は standalone manual CI では `include_android=true` によるオプトインで、`Full Release Validation` では常に有効です。`Plugin Prerelease` はよりコストの高い製品/パッケージカバレッジなので、`Full Release Validation` または明示的なオペレーターによって dispatch される別ワークフローです。通常の pull request、`main` push、standalone manual CI dispatch では、このスイートはオフのままです。

最も遅い Node テスト群は、各ジョブが runner を過剰予約せず小さく保たれるよう分割またはバランス調整されています。channel contract は 3 つの重み付き shard として実行され、小さいコア unit レーンはペアにされ、auto-reply は 4 つのバランス済み worker として実行され、reply subtree は agent-runner、dispatch、commands/state-routing shard に分割されます。また、agentic gateway/plugin config は built artifact を待つのではなく、既存の source-only agentic Node ジョブに分散されます。広範なブラウザー、QA、メディア、その他の Plugin テストは、共有 Plugin catch-all ではなく専用の Vitest config を使用します。`Plugin Prerelease` は、bundled Plugin テストを 8 つの拡張機能 worker にバランスさせます。これらの拡張機能 shard ジョブは、1 グループあたり 1 つの Vitest worker とより大きな Node heap を使って最大 2 つの Plugin config group を同時に実行するため、import-heavy な Plugin batch が追加の CI ジョブを作成しません。広範な agents レーンは、単一の遅いテストファイルに支配されるのではなく import/scheduling 支配であるため、共有 Vitest file-parallel scheduler を使用します。`runtime-config` は infra core-runtime shard と一緒に実行し、共有 runtime shard が最後尾を抱えないようにします。include-pattern shard は CI shard 名を使って timing entry を記録するため、`.artifacts/vitest-shard-timings.json` は config 全体と filtered shard を区別できます。`check-additional` は package-boundary compile/canary 作業をまとめ、runtime topology architecture を gateway watch カバレッジから分離します。boundary guard shard は、小さな独立 guard を 1 つのジョブ内で並行実行します。Gateway watch、channel tests、core support-boundary shard は、`dist/` と `dist-runtime/` がすでにビルドされた後に `build-artifacts` 内で並行実行され、古いチェック名を軽量な verifier job として維持しつつ、2 つの追加 Blacksmith worker と 2 つ目の artifact-consumer queue を避けます。
Android CI は `testPlayDebugUnitTest` と `testThirdPartyDebugUnitTest` の両方を実行し、その後 Play debug APK をビルドします。third-party flavor には別の source set や manifest はありません。その unit-test レーンは、その flavor を SMS/call-log BuildConfig flag 付きで引き続きコンパイルしつつ、Android 関連 push のたびに重複した debug APK packaging job を避けます。
同じ PR または `main` ref に新しい push が到着すると、GitHub は置き換えられたジョブを `cancelled` としてマークすることがあります。同じ ref の最新 run も失敗していない限り、それは CI ノイズとして扱ってください。aggregate shard check は `!cancelled() && always()` を使用するため、通常の shard failure は引き続き報告しますが、ワークフロー全体がすでに置き換えられた後は queue しません。
自動 CI concurrency key は versioned (`CI-v7-*`) なので、古い queue group 内の GitHub 側 zombie が新しい main run を無期限にブロックすることはありません。手動 full-suite run は `CI-manual-v1-*` を使用し、実行中の run をキャンセルしません。

## Runner

| Runner                           | ジョブ                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、高速 security ジョブと aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`)、高速 protocol/contract/bundled check、sharded channel contract check、lint を除く `check` shard、`check-additional` shard と aggregate、Node test aggregate verifier、docs check、Python skills、workflow-sanity、labeler、auto-response。install-smoke preflight も GitHub-hosted Ubuntu を使用するため、Blacksmith matrix はより早く queue できます |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、低重みの拡張機能 shard、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types`、`check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node test shard、bundled Plugin test shard、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`。これは依然として CPU 感度が高く、8 vCPU は節約分よりコストが大きかったためです。install-smoke Docker build では、32-vCPU の queue time のコストが節約分を上回りました                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上の `macos-node`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上の `macos-swift`。fork では `macos-latest` にフォールバックします                                                                                                                                                                                                                                                                                                                                                                                                 |

## ローカル相当

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:changed   # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 関連

- [インストール概要](/ja-JP/install)
- [リリースチャネル](/ja-JP/install/development-channels)
