---
read_when:
    - 公開リリースチャンネルの定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョンの命名規則とリリース周期を探す
summary: リリースレーン、運用者チェックリスト、検証ボックス、バージョン命名規則、ケイデンス
title: リリースポリシー
x-i18n:
    generated_at: "2026-04-30T05:33:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には3つの公開リリースレーンがあります。

- 安定版: デフォルトでは npm `beta` に公開され、明示的に要求された場合は npm `latest` に公開されるタグ付きリリース
- ベータ: npm `beta` に公開されるプレリリースタグ
- 開発版: `main` の移動する先頭

## バージョン命名

- 安定版リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- 安定版修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- ベータプレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日にゼロ埋めはしない
- `latest` は現在昇格済みの安定版 npm リリースを意味する
- `beta` は現在のベータインストール対象を意味する
- 安定版および安定版修正リリースはデフォルトで npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にすることも、検証済みのベータビルドを後から昇格することもできる
- すべての安定版 OpenClaw リリースでは、npm パッケージと macOS アプリを一緒に出荷する。
  ベータリリースでは通常、まず npm/パッケージ経路を検証して公開し、mac アプリのビルド/署名/公証は明示的に要求されない限り安定版向けに保持する

## リリース頻度

- リリースはベータ優先で進む
- 安定版は最新のベータが検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切るため、リリース検証と修正が `main` 上の新規開発を妨げない
- ベータタグがプッシュまたは公開済みで修正が必要な場合、メンテナーは古いベータタグを削除または再作成する代わりに、次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモはメンテナー専用

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開部分を示します。非公開の認証情報、署名、公証、dist-tag 復旧、緊急ロールバックの詳細は、メンテナー専用のリリースランブックに保持されます。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、現在の `main` CI がそこからブランチを切れる程度に green であることを確認する。
2. 実際のコミット履歴から `/changelog` で最上部の `CHANGELOG.md` セクションを書き換え、エントリをユーザー向けに保ち、コミットしてプッシュし、ブランチを切る前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性記録をレビューする。アップグレード経路が引き続きカバーされる場合にのみ期限切れの互換性を削除するか、意図的に持ち越す理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を `main` で直接行わない。
5. 意図したタグに必要なすべてのバージョン箇所を更新し、その後ローカルの決定的なプリフライトを実行する:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm release:check`。
6. `OpenClaw NPM Release` を `preflight_only=true` で実行する。タグが存在する前は、検証専用プリフライトのために40文字の完全なリリースブランチ SHA を使用できる。成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` ですべてのプレリリーステストを開始する。これは4つの大きなリリーステストボックス、つまり Vitest、Docker、QA Lab、Package の単一の手動エントリポイントです。
8. 検証が失敗した場合は、リリースブランチ上で修正し、その修正を証明する最小の失敗ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行する。変更面によって以前の証拠が古くなる場合にのみ、完全な包括ワークフローを再実行する。
9. ベータでは、`vYYYY.M.D-beta.N` をタグ付けし、npm dist-tag `beta` で公開し、その後公開済みの `openclaw@YYYY.M.D-beta.N` または `openclaw@beta` パッケージに対して公開後パッケージ受け入れを実行する。プッシュ済みまたは公開済みのベータに修正が必要な場合は、次の `-beta.N` を切る。古いベータを削除または書き換えない。
10. 安定版では、検証済みのベータまたはリリース候補に必要な検証証拠がある場合にのみ続行する。安定版 npm 公開では、成功したプリフライトアーティファクトを `preflight_run_id` 経由で再利用する。安定版 macOS リリース準備には、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および `main` 上の更新済み `appcast.xml` も必要です。
11. 公開後、npm 公開後検証ツール、公開後のチャンネル証明が必要な場合は任意のスタンドアロン公開済み npm Telegram E2E、必要に応じた dist-tag 昇格、完全に一致する `CHANGELOG.md` セクションからの GitHub リリース/プレリリースノート、およびリリース告知手順を実行する。

## リリースプリフライト

- リリース事前検証の前に `pnpm check:test-types` を実行し、テストの TypeScript がより高速なローカル `pnpm check` ゲートの外でもカバーされるようにする
- リリース事前検証の前に `pnpm check:architecture` を実行し、より広範なインポートサイクルとアーキテクチャ境界のチェックがより高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、パック検証ステップ用の想定される `dist/*` リリース成果物と Control UI バンドルが存在するようにする
- リリース承認の前に手動の `Full Release Validation` ワークフローを実行し、すべてのリリース前テストボックスを 1 つのエントリポイントから開始する。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動の `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、Docker リリースパススイート、ライブ/E2E、OpenWebUI、QA Lab パリティ、Matrix、Telegram レーン用の `OpenClaw Release Checks` をディスパッチする。パッケージが公開済みで、公開後の Telegram E2E も実行する必要がある場合にのみ `npm_telegram_package_spec` を指定する。Telegram E2E を強制せずに、非公開の証拠レポートで検証が公開済み npm パッケージと一致することを証明する必要がある場合は `evidence_package_spec` を指定する。例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を継続しながらパッケージ候補のサイドチャネル証拠が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA をパックするには `source=ref` を使う。必須の SHA-256 を伴う HTTPS tarball には `source=url` を使う。または、別の GitHub Actions 実行でアップロードされた tarball には `source=artifact` を使う。このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、同じ tarball に対して `telegram_mode=mock-openai` または `telegram_mode=live-frontier` で Telegram QA を実行できる。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  共通プロファイル:
  - `smoke`: インストール/チャネル/エージェント、Gateway ネットワーク、設定リロードのレーン
  - `package`: OpenWebUI またはライブ ClawHub を含まない、成果物ネイティブのパッケージ/更新/Plugin レーン
  - `product`: パッケージプロファイルに加えて、MCP チャネル、cron/サブエージェントのクリーンアップ、OpenAI Web 検索、OpenWebUI
  - `full`: OpenWebUI を含む Docker リリースパスチャンク
  - `custom`: 集中的な再実行用の正確な `docker_lanes` 選択
- リリース候補に対して通常の CI の完全なカバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは変更範囲のスコープをバイパスし、Linux Node シャード、バンドル済み Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリーステレメトリを検証するときは `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP レシーバーを通じて QA-lab を実行し、Opik、Langfuse、または別の外部コレクターを必要とせずに、エクスポートされたトレーススパン名、境界付き属性、コンテンツ/識別子のリダクションを検証する。
- すべてのタグ付きリリースの前に `pnpm release:check` を実行する
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認の前に QA Lab モックパリティゲートに加え、高速なライブ Matrix プロファイルと Telegram QA レーンも実行する。ライブレーンは `qa-live-shared` 環境を使う。Telegram は Convex CI の資格情報リースも使う。完全な Matrix トランスポート、メディア、E2EE インベントリを並列で確認したい場合は、`matrix_profile=all` と `matrix_shards=true` で手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS インストールおよびアップグレードのランタイム検証は、再利用可能ワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す公開 `OpenClaw Release Checks` と `Full Release Validation` の一部である
- この分割は意図的なもの。実際の npm リリースパスを短く、決定的で、成果物中心に保ちつつ、遅いライブチェックは独自のレーンに置き、公開を停滞またはブロックしないようにする
- シークレットを伴うリリースチェックは、ワークフローのロジックとシークレットが制御された状態に保たれるように、`Full Release Validation` 経由、または `main`/release ワークフロー ref からディスパッチする必要がある
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け取る
- `OpenClaw NPM Release` の検証専用事前検証は、プッシュ済みタグを必要とせずに、現在の完全な 40 文字のワークフローブランチコミット SHA も受け取る
- その SHA パスは検証専用であり、実際の公開に昇格することはできない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要である
- どちらのワークフローも、実際の公開と昇格のパスは GitHub ホストランナー上に保ち、変更を伴わない検証パスではより大きな Blacksmith Linux ランナーを使用できる
- そのワークフローは、`OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を `OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使って実行する
- npm リリース事前検証は、別のリリースチェックレーンを待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応する beta/修正版タグ）を実行する
- npm 公開後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応する beta/修正版バージョン）を実行し、新しい一時プレフィックスで公開済みレジストリのインストールパスを検証する
- beta 公開後、共有リース済み Telegram 資格情報プールを使って、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証するために、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行する。ローカルのメンテナーによる一回限りの実行では、Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` 環境資格情報を直接渡してもよい。
- メンテナーは、GitHub Actions から手動の `NPM Telegram Beta E2E` ワークフロー経由で同じ公開後チェックを実行できる。これは意図的に手動専用であり、すべてのマージで実行されるわけではない。
- メンテナーのリリース自動化は現在、事前検証後に昇格する方式を使う:
  - 実際の npm 公開は、成功した npm `preflight_run_id` に合格している必要がある
  - 実際の npm 公開は、成功した事前検証実行と同じ `main` または `release/YYYY.M.D` ブランチからディスパッチされている必要がある
  - stable npm リリースのデフォルトは `beta`
  - stable npm 公開は、ワークフロー入力で明示的に `latest` を対象にできる
  - トークンベースの npm dist-tag 変更は現在、セキュリティのため `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` に置かれている。これは、公開リポジトリが OIDC のみの公開を維持する一方で、`npm dist-tag add` にはまだ `NPM_TOKEN` が必要なためである
  - 公開 `macOS Release` は検証専用である
  - 実際の非公開 mac 公開は、成功した非公開 mac の `preflight_run_id` と `validate_run_id` に合格している必要がある
  - 実際の公開パスは、準備済み成果物を再ビルドせずに昇格する
- `YYYY.M.D-N` のような stable 修正版リリースでは、公開後検証ツールは同じ一時プレフィックスのアップグレードパスも `YYYY.M.D` から `YYYY.M.D-N` へ確認し、リリース修正版が古いグローバルインストールをベース stable ペイロードのまま静かに残さないようにする
- npm リリース事前検証は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り、フェイルクローズする。これにより、空のブラウザダッシュボードを再び出荷しないようにする
- 公開後検証では、公開済みレジストリのインストールに、ルートの `dist/*` レイアウト配下で空でないバンドル済み Plugin ランタイム依存関係が含まれていることも確認する。バンドル済み Plugin 依存関係ペイロードが欠落または空のまま出荷されたリリースは、公開後検証に失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は、候補更新 tarball に対して npm パックの `unpackedSize` 予算も強制するため、インストーラー e2e はリリース公開パスの前に偶発的なパック肥大化を検出する
- リリース作業で CI 計画、Plugin タイミングマニフェスト、または Plugin テストマトリックスに触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` からプランナー所有の `plugin-prerelease-extension-shard` マトリックス出力を再生成してレビューし、リリースノートが古い CI レイアウトを説明しないようにする
- stable macOS リリース準備には、アップデーターのサーフェスも含まれる:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - `main` 上の `appcast.xml` は、公開後に新しい stable zip を指している必要がある
  - パッケージ化されたアプリは、非デバッグのバンドル ID、空でない Sparkle フィード URL、そのリリースバージョンの正規 Sparkle ビルド下限以上の `CFBundleVersion` を維持している必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターがすべてのリリース前テストを 1 つのエントリポイントから開始する方法である。信頼済みの `main` ワークフロー ref から実行し、リリースブランチ、タグ、または完全なコミット SHA を `ref` として渡す:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

このワークフローはターゲット ref を解決し、`target_ref=<release-ref>` で手動の `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、`npm_telegram_package_spec` が設定されている場合は、任意でスタンドアロンの公開後 Telegram E2E をディスパッチする。その後、`OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、ライブ/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA を伴う Package Acceptance、QA Lab パリティ、ライブ Matrix、ライブ Telegram にファンアウトする。完全な実行が許容されるのは、`Full Release Validation` サマリーで `normal_ci` と `release_checks` が成功しており、任意の `npm_telegram` 子が成功しているか意図的にスキップされている場合のみである。最終検証サマリーには各子実行の最遅ジョブ表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できる。
子ワークフローは、ターゲット `ref` が古いリリースブランチまたはタグを指している場合でも、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされる。別個の Full Release Validation ワークフロー ref 入力は存在しない。ワークフロー実行 ref を選ぶことで、信頼済みハーネスを選択する。

ライブ/プロバイダーの広さを選択するには `release_profile` を使う:

- `minimum`: 最速のリリースクリティカルな OpenAI/core ライブおよび Docker パス
- `stable`: リリース承認用に minimum に stable プロバイダー/バックエンドカバレッジを追加
- `full`: stable に広範なアドバイザリプロバイダー/メディアカバレッジを追加

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使ってターゲット ref を一度 `release-package-under-test` として解決し、リリースパス Docker チェックと Package Acceptance の両方でその成果物を再利用する。これにより、パッケージ向けのすべてのボックスが同じバイト列を使い、パッケージの再ビルドを繰り返さずに済む。
クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使い、それ以外の場合は `openai/gpt-5.4-mini` を使う。このレーンは、最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回のライブエージェントターンを証明するためである。より広範なライブプロバイダーマトリックスが、モデル固有のカバレッジの場である。

リリース段階に応じて、これらのバリアントを使う:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

焦点を絞った修正後の最初の再実行として、包括的な全体ワークフローを使用しないでください。1 つのボックスが失敗した場合は、次の証明には失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用します。修正が共有リリースオーケストレーションを変更した場合、または以前の全ボックス証拠が古くなった場合にのみ、包括的な全体ワークフローを再実行してください。包括的な全体ワークフローの最終検証では、記録された子ワークフロー実行 ID が再チェックされるため、子ワークフローの再実行が成功した後は、失敗した親ジョブ `Verify full validation` だけを再実行します。

範囲を限定したリカバリーでは、包括的な全体ワークフローに `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子だけを実行し、`plugin-prerelease` はリリース専用 Plugin 子だけを実行し、`release-checks` はすべてのリリースボックスを実行します。より狭いリリースグループは、スタンドアロンのパッケージ Telegram レーンが指定されている場合、`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。

### Vitest

Vitest ボックスは手動の `CI` 子ワークフローです。手動 CI は意図的に変更範囲による絞り込みを回避し、リリース候補に対して通常のテストグラフを強制します。対象は Linux Node シャード、バンドル済み Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n です。

このボックスは、「ソースツリーが通常の完全なテストスイートに合格したか」に答えるために使用します。これはリリースパスのプロダクト検証とは同じではありません。保持する証拠:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確なターゲット SHA で成功した `CI` 実行
- 回帰を調査するときの CI ジョブからの失敗または遅いシャード名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定的な通常 CI が必要だが、Docker、QA Lab、ライブ、クロス OS、またはパッケージボックスが不要な場合にのみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは `OpenClaw Release Checks` の中の `openclaw-live-and-e2e-checks-reusable.yml` と、リリースモードの `install-smoke` ワークフローにあります。これはソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには次が含まれます。

- 低速な Bun グローバルインストールスモークを有効にした完全なインストールスモーク
- ターゲット SHA ごとのルート Dockerfile スモークイメージ準備/再利用。QR、ルート/Gateway、インストーラー/Bun スモークジョブは個別の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b`、`bundled-channels-contracts`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- バンドル済みチャンネル依存レーンを、1 つの大きなバンドル済みチャンネルジョブではなく、channel-smoke、update-target、setup/runtime 契約チャンクに分割
- 分割されたバンドル済み Plugin インストール/アンインストールレーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- リリースチェックにライブスイートが含まれる場合のライブ/E2E プロバイダースイートと Docker ライブモデルカバレッジ

再実行の前に Docker アーティファクトを使用してください。リリースパスのスケジューラーは `.artifacts/docker-tests/` をアップロードし、そこにはレーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドが含まれます。焦点を絞ったリカバリーでは、すべてのリリースチャンクを再実行するのではなく、再利用可能なライブ/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成される再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これはエージェント的な振る舞いとチャンネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには次が含まれます。

- エージェント的パリティパックを使用して OpenAI 候補レーンを Opus 4.6 ベースラインと比較するモックパリティゲート
- `qa-live-shared` 環境を使用する高速ライブ Matrix QA プロファイル
- Convex CI 認証情報リースを使用するライブ Telegram QA レーン
- リリーステレメトリーに明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

このボックスは、「リリースが QA シナリオとライブチャンネルフローで正しく動作するか」に答えるために使用します。リリースを承認するときは、パリティ、Matrix、Telegram レーンのアーティファクト URL を保持してください。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージボックスはインストール可能なプロダクトのゲートです。これは `Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。リゾルバーは候補を Docker E2E で消費される `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離して保持します。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択された `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックする
- `source=url`: 必須の `package_sha256` を指定して HTTPS `.tgz` をダウンロードする
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用する

`OpenClaw Release Checks` は、`source=ref`、`package_ref=<release-ref>`、`suite_profile=custom`、`docker_lanes=bundled-channel-deps-compat plugins-offline`、`telegram_mode=mock-openai` で Package Acceptance を実行します。リリースパス Docker チャンクは、重複するインストール、更新、Plugin 更新レーンをカバーします。Package Acceptance は、同じ解決済み tarball に対して、アーティファクトネイティブなバンドル済みチャンネル互換性、オフライン Plugin フィクスチャ、Telegram パッケージ QA を維持します。これは、以前は Parallels が必要だったパッケージ/更新カバレッジの大部分に対する GitHub ネイティブな置き換えです。クロス OS リリースチェックは OS 固有のオンボーディング、インストーラー、プラットフォーム挙動に引き続き重要ですが、パッケージ/更新のプロダクト検証では Package Acceptance を優先してください。

レガシー package-acceptance の許容は意図的に期限付きです。`2026.4.25` までのパッケージは、すでに npm に公開済みのメタデータギャップに対して互換性パスを使用できます。対象は tarball に含まれない非公開 QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落パッチファイル、欠落した永続化 `update.channel`、レガシー Plugin インストール記録の場所、欠落したマーケットプレイスインストール記録の永続化、`plugins update` 中の設定メタデータ移行です。公開済みの `2026.4.26` パッケージは、すでに出荷されたローカルビルドメタデータスタンプファイルについて警告しても構いません。それ以降のパッケージは、現代のパッケージ契約を満たす必要があります。同じギャップはリリース検証で失敗します。

リリースの問いが実際にインストール可能なパッケージに関するものである場合は、より広い Package Acceptance プロファイルを使用します。

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

一般的なパッケージプロファイル:

- `smoke`: 簡易パッケージインストール/チャンネル/エージェント、Gateway ネットワーク、設定リロードレーン
- `package`: ライブ ClawHub なしのインストール/更新/Plugin パッケージ契約。これはリリースチェックのデフォルト
- `product`: `package` に加えて MCP チャンネル、cron/subagent クリーンアップ、OpenAI web search、OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスチャンク
- `custom`: 焦点を絞った再実行用の正確な `docker_lanes` リスト

パッケージ候補 Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または `telegram_mode=live-frontier` を有効にします。このワークフローは解決済みの `package-under-test` tarball を Telegram レーンに渡します。スタンドアロン Telegram ワークフローは、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、次のオペレーター制御入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` などの必須リリースタグ。`preflight_only=true` の場合は、検証専用プリフライトのために、現在の完全な 40 文字のワークフローブランチコミット SHA も使用できます
- `preflight_only`: 検証/ビルド/パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスで必須。ワークフローが成功したプリフライト実行から準備済み tarball を再利用するために使用します
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Checks` は、次のオペレーター制御入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを含むチェックでは、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。

ルール:

- stable タグと correction タグは `beta` または `latest` のいずれにも公開できます
- Beta プレリリースタグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、プリフライト中に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは、公開前にそのメタデータが継続していることを検証します

## Stable npm リリース手順

stable npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、プリフライトワークフローの検証専用ドライランとして、現在の完全なワークフローブランチコミット SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択し、意図的に直接 stable 公開を行いたい場合にのみ `latest` を選択します
3. 1 つの手動ワークフローから通常 CI に加えてライブプロンプトキャッシュ、Docker、QA Lab、Matrix、Telegram カバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全なコミット SHA で `Full Release Validation` を実行します
4. 意図的に決定的な通常テストグラフだけが必要な場合は、代わりにリリース ref で手動の `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存した `preflight_run_id` を指定して、`preflight_only=false` で `OpenClaw NPM Release` を再度実行します
7. リリースが `beta` に着地した場合は、非公開の `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その stable バージョンを `beta` から `latest` に昇格します
8. リリースが意図的に `latest` に直接公開され、`beta` もすぐに同じ stable ビルドを追従すべき場合は、同じ非公開ワークフローを使用して両方の dist-tag を stable バージョンに向けるか、そのスケジュールされた自己修復同期によって後で `beta` が移動するようにします

dist-tag の変更は、引き続き `NPM_TOKEN` が必要なため、セキュリティ上の理由で非公開リポジトリにあります。一方、公開リポジトリは OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first 昇格パスの両方が文書化され、オペレーターに見える状態になります。

メンテナーがローカルの npm 認証にフォールバックする必要がある場合は、1Password
CLI (`op`) コマンドは専用の tmux セッション内でのみ実行してください。メインエージェントシェルから `op`
を直接呼び出さないでください。tmux 内に閉じ込めることで、プロンプト、
アラート、OTP 処理が観測可能になり、ホストアラートの繰り返しを防げます。

## 公開リファレンス

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

メンテナーは実際のランブックとして、非公開のリリースドキュメント
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリースチャンネル](/ja-JP/install/development-channels)
