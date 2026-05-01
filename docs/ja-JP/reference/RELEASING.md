---
read_when:
    - 公開リリースチャネル定義を検索しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名規則とリリース周期を確認中
summary: リリースレーン、オペレーター用チェックリスト、検証ボックス、バージョン命名、周期
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-01T05:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には 3 つの公開リリースレーンがあります。

- stable: 既定では npm `beta` に公開され、明示的に要求された場合は npm `latest` に公開されるタグ付きリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- stable リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- stable 修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日をゼロ埋めしない
- `latest` は現在昇格済みの stable npm リリースを意味する
- `beta` は現在の beta インストール対象を意味する
- stable および stable 修正リリースは既定で npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にすることも、検証済みの beta ビルドを後で昇格することもできる
- すべての stable OpenClaw リリースは npm パッケージと macOS アプリを一緒に出荷する。
  beta リリースでは通常、npm/パッケージ経路の検証と公開を先に行い、
  mac アプリのビルド/署名/公証は明示的に要求されない限り stable 用に予約される

## リリースサイクル

- リリースは beta 優先で進む
- stable は最新の beta が検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切る。
  これにより、リリース検証と修正が `main` での新規開発をブロックしない
- beta タグがプッシュまたは公開済みで修正が必要な場合、メンテナーは古い beta タグを削除または再作成するのではなく、
  次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用

## リリース担当者チェックリスト

このチェックリストはリリースフローの公開上の形を示します。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は
メンテナー専用のリリースランブックに保持します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がブランチ作成に十分な程度に成功していることを確認する。
2. 実際のコミット履歴から最上位の `CHANGELOG.md` セクションを
   `/changelog` で書き直し、エントリをユーザー向けに保ち、コミットしてプッシュし、
   ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性記録を確認する。期限切れの
   互換性はアップグレード経路が引き続きカバーされている場合にのみ削除し、そうでなければ
   意図的に保持している理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` で直接行わない。
5. 予定しているタグに必要なすべてのバージョン箇所を更新し、その後
   ローカルの決定的プリフライトを実行する:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, および `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   検証専用プリフライトに完全な 40 文字のリリースブランチ SHA を使用できる。
   成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して
   `Full Release Validation` ですべてのプレリリーステストを開始する。これは
   4 つの大きなリリーステストボックスである Vitest、Docker、QA Lab、Package の
   1 つの手動エントリポイントである。
8. 検証が失敗した場合はリリースブランチで修正し、修正を証明する最小の失敗した
   ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行する。
   変更面によって既存の証拠が古くなる場合にのみ、全体のアンブレラを再実行する。
9. beta の場合は `vYYYY.M.D-beta.N` をタグ付けし、npm dist-tag `beta` で公開してから、
   公開済みの `openclaw@YYYY.M.D-beta.N` または `openclaw@beta` パッケージに対して
   公開後のパッケージ受け入れを実行する。プッシュ済みまたは公開済みの beta に修正が必要な場合は、
   次の `-beta.N` を切る。古い beta を削除または書き換えない。
10. stable の場合は、検証済みの beta またはリリース候補に必要な検証証拠がある場合にのみ続行する。
    stable npm 公開では、成功したプリフライト成果物を
    `preflight_run_id` 経由で再利用する。stable macOS リリースの準備完了には、
    パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および `main` 上の更新済み
    `appcast.xml` も必要である。
11. 公開後、npm 公開後検証ツール、公開後のチャンネル証拠が必要な場合の任意のスタンドアロン
    公開済み npm Telegram E2E、必要に応じた dist-tag 昇格、
    完全に一致する `CHANGELOG.md` セクションからの GitHub リリース/プレリリースノート、
    およびリリース告知手順を実行する。

## リリースプリフライト

- リリースのプリフライト前に `pnpm check:test-types` を実行し、テスト TypeScript が高速なローカル `pnpm check` ゲートの外でも
  対象に含まれるようにする
- リリースのプリフライト前に `pnpm check:architecture` を実行し、より広範なインポート
  サイクルとアーキテクチャ境界チェックが高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、想定される
  `dist/*` リリース成果物と Control UI バンドルがパック
  検証ステップ用に存在するようにする
- リリース承認前に手動 `Full Release Validation` ワークフローを実行し、すべてのリリース前テストボックスを 1 つのエントリポイントから
  開始する。これはブランチ、
  タグ、または完全なコミット SHA を受け取り、手動 `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、Docker
  リリースパススイート、ライブ/E2E、OpenWebUI、QA Lab パリティ、Matrix、Telegram
  レーン用に `OpenClaw Release Checks` をディスパッチする。パッケージが
  公開済みで、公開後の Telegram E2E も実行する必要がある場合にのみ `npm_telegram_package_spec` を指定する。プライベート証跡レポートで、Telegram E2E を強制せずに
  検証が公開済み npm パッケージと一致することを証明する必要がある場合は
  `evidence_package_spec` を指定する。
  例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を続けながらパッケージ候補のサイドチャネル証跡が必要な場合は、手動 `Package Acceptance` ワークフローを実行する。`openclaw@beta`、
  `openclaw@latest`、または正確なリリースバージョンには `source=npm` を使用する。現在の
  `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA をパックするには `source=ref`
  を使用する。必須の SHA-256 付き HTTPS tarball には `source=url` を使用する。または、別の GitHub
  Actions 実行でアップロードされた tarball には `source=artifact` を使用する。このワークフローは候補を
  `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、
  同じ tarball に対して `telegram_mode=mock-openai` または `telegram_mode=live-frontier` で
  Telegram QA を実行できる。選択された Docker レーンに
  `published-upgrade-survivor` が含まれる場合、パッケージ成果物が候補になり、`published_upgrade_survivor_baseline` が
  公開済みベースラインを選択する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: インストール/チャネル/エージェント、Gateway ネットワーク、構成リロードの各レーン
  - `package`: OpenWebUI またはライブ ClawHub を含まない、成果物ネイティブのパッケージ/更新/Plugin レーン
  - `product`: パッケージプロファイルに加え、MCP チャネル、cron/サブエージェントのクリーンアップ、
    OpenAI Web 検索、OpenWebUI
  - `full`: OpenWebUI を含む Docker リリースパスのチャンク
  - `custom`: 集中的な再実行用の正確な `docker_lanes` 選択
- リリース候補について通常の完全な CI カバレッジだけが必要な場合は、手動 `CI` ワークフローを直接実行する。手動 CI ディスパッチは変更スコープを
  バイパスし、Linux Node シャード、同梱 Plugin シャード、チャネル
  契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、
  ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n
  レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリーステレメトリを検証する場合は `pnpm qa:otel:smoke` を実行する。これは
  ローカル OTLP/HTTP レシーバーを通じて QA-lab を実行し、Opik、Langfuse、その他の外部コレクターを
  必要とせずに、エクスポートされたトレース
  スパン名、制限付き属性、コンテンツ/識別子のリダクションを検証する。
- すべてのタグ付きリリース前に `pnpm release:check` を実行する
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` はリリース承認前に、QA Lab モックパリティゲートに加えて高速な
  ライブ Matrix プロファイルと Telegram QA レーンも実行する。ライブ
  レーンは `qa-live-shared` 環境を使用し、Telegram は Convex CI
  認証情報リースも使用する。Matrix の
  トランスポート、メディア、E2EE インベントリ全体を並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` で手動 `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS インストールとアップグレードのランタイム検証は、公開
  `OpenClaw Release Checks` と `Full Release Validation` の一部であり、再利用可能ワークフロー
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの: 実際の npm リリースパスを短く、
  決定的で、成果物に集中したものに保ちつつ、時間のかかるライブチェックは独自のレーンに置き、
  公開を停滞またはブロックしないようにするため
- シークレットを含むリリースチェックは `Full Release
Validation` を通じて、または `main`/release ワークフロー ref からディスパッチし、ワークフローロジックと
  シークレットを制御された状態に保つ必要がある
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、
  ブランチ、タグ、または完全なコミット SHA を受け付ける
- `OpenClaw NPM Release` の検証専用プリフライトも、プッシュ済みタグを要求せずに、現在の
  完全な 40 文字のワークフローブランチコミット SHA を受け付ける
- その SHA パスは検証専用であり、実際の公開に昇格できない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を
  合成する。実際の公開には引き続き実際のリリースタグが必要
- 両方のワークフローは実際の公開と昇格パスを GitHub ホストランナー上に保ちつつ、
  非変更の検証パスでは、より大きな Blacksmith Linux ランナーを使用できる
- そのワークフローは
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使って実行する
- npm リリースプリフライトは、別個のリリースチェックレーンを待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (または対応するベータ/修正版タグ) を実行する
- npm 公開後に
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (または対応するベータ/修正版バージョン) を実行し、新しい一時プレフィックスで公開済みレジストリの
  インストールパスを検証する
- ベータ公開後に `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  を実行し、共有リース済み Telegram 認証情報
  プールを使って、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E
  を検証する。ローカルメンテナーの単発実行では Convex 変数を省略し、3 つの
  `OPENCLAW_QA_TELEGRAM_*` env 認証情報を直接渡してもよい。
- メンテナーは、手動 `NPM Telegram Beta E2E` ワークフローを使って、GitHub Actions から同じ公開後チェックを実行できる。これは意図的に手動専用であり、
  すべてのマージで実行されるわけではない。
- メンテナー向けリリース自動化は現在、プリフライト後に昇格する方式を使用する:
  - 実際の npm 公開は、成功した npm `preflight_run_id` に合格している必要がある
  - 実際の npm 公開は、成功したプリフライト実行と同じ `main` または
    `release/YYYY.M.D` ブランチからディスパッチされている必要がある
  - 安定版 npm リリースのデフォルトは `beta`
  - 安定版 npm 公開は、ワークフロー入力で明示的に `latest` を対象にできる
  - トークンベースの npm dist-tag 変更は現在、セキュリティのため
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` にある。これは、公開リポジトリが OIDC のみの公開を維持する一方で、
    `npm dist-tag add` には引き続き `NPM_TOKEN` が必要なため
  - 公開 `macOS Release` は検証専用である。タグがリリースブランチにのみ存在するが
    ワークフローが `main` からディスパッチされる場合は、
    `public_release_branch=release/YYYY.M.D` を設定する
  - 実際のプライベート Mac 公開は、成功したプライベート Mac
    `preflight_run_id` と `validate_run_id` に合格している必要がある
  - 実際の公開パスは、成果物を再ビルドするのではなく、準備済み成果物を昇格する
- `YYYY.M.D-N` のような安定版修正リリースでは、公開後検証ツールが
  `YYYY.M.D` から `YYYY.M.D-N` への同じ一時プレフィックスアップグレードパスもチェックし、
  リリース修正が古いグローバルインストールをベース安定版ペイロードのままに
  気づかず残さないようにする
- npm リリースプリフライトは、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り
  クローズドに失敗する。これにより、空のブラウザダッシュボードを再び出荷しない
- 公開後検証では、公開済みレジストリインストールに、ルート `dist/*`
  レイアウト配下の空でない同梱 Plugin ランタイム依存関係が含まれることも確認する。同梱 Plugin
  依存関係ペイロードが欠落または空のまま出荷されるリリースは公開後検証ツールに失敗し、
  `latest` に昇格できない。
- `pnpm test:install:smoke` は、候補更新 tarball に対して npm pack の `unpackedSize` 予算も適用するため、
  インストーラー e2e がリリース公開パスの前に偶発的なパック肥大を検出する
- リリース作業が CI 計画、Plugin タイミングマニフェスト、または
  Plugin テストマトリックスに触れた場合は、承認前に
  `.github/workflows/plugin-prerelease.yml` からプランナー所有の `plugin-prerelease-extension-shard` マトリックス出力を再生成してレビューし、リリースノートが
  古い CI レイアウトを説明しないようにする
- 安定版 macOS リリースの準備状況には、アップデーター関連の面も含まれる:
  - GitHub リリースには、パッケージ済みの `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - 公開後、`main` 上の `appcast.xml` は新しい安定版 zip を指している必要がある
  - パッケージ済みアプリは、非デバッグのバンドル ID、空でない Sparkle フィード
    URL、そのリリースバージョンの正規 Sparkle ビルド下限以上の `CFBundleVersion` を維持する必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターが 1 つのエントリポイントからすべてのリリース前テストを
開始する方法である。信頼済みの `main` ワークフロー ref から実行し、リリース
ブランチ、タグ、または完全なコミット SHA を `ref` として渡す:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

このワークフローは対象 ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチし、
`OpenClaw Release Checks` をディスパッチし、
`npm_telegram_package_spec` が設定されている場合は任意でスタンドアロンの公開後 Telegram E2E をディスパッチする。その後、`OpenClaw Release Checks` は
インストールスモーク、クロス OS リリースチェック、ライブ/E2E Docker リリースパスカバレッジ、
Telegram パッケージ QA を含む Package Acceptance、QA Lab パリティ、ライブ Matrix、ライブ Telegram に展開する。フル実行が受け入れられるのは、`Full Release Validation`
サマリーで `normal_ci` と `release_checks` が成功しており、任意の
`npm_telegram` 子が成功しているか意図的にスキップされている場合のみである。最終
検証サマリーには各子実行の最遅ジョブ表が含まれるため、リリース
マネージャーはログをダウンロードせずに現在のクリティカルパスを確認できる。
完全なステージマトリックス、正確なワークフロージョブ名、安定版とフルプロファイルの
違い、成果物、集中的な再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation) を参照。
子ワークフローは、`Full Release
Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされる。これは対象 `ref` が
古いリリースブランチまたはタグを指す場合でも同じである。Full Release Validation 専用の
ワークフロー ref 入力はない。信頼済みハーネスはワークフロー実行 ref を選択して指定する。

ライブ/プロバイダーの範囲を選択するには `release_profile` を使用する:

- `minimum`: 最速のリリース重要 OpenAI/core ライブおよび Docker パス
- `stable`: リリース承認用に minimum に安定版プロバイダー/バックエンドカバレッジを追加
- `full`: stable に広範なアドバイザリプロバイダー/メディアカバレッジを追加

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用して対象
ref を `release-package-under-test` として一度だけ解決し、そのアーティファクトを
release-path Docker チェックと Package Acceptance の両方で再利用します。これにより、
パッケージ向けのすべてのボックスが同じバイト列を使い、パッケージビルドの繰り返しを避けられます。
cross-OS OpenAI install smoke は、repo/org 変数が設定されている場合は
`OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、そうでない場合は `openai/gpt-5.4-mini`
を使用します。このレーンは、最も遅いデフォルトモデルのベンチマークではなく、
パッケージインストール、オンボーディング、Gateway 起動、1 回の live agent ターンを
証明するためのものだからです。より広範な live provider matrix が、モデル固有の
カバレッジの場所として残ります。

リリース段階に応じて、これらのバリアントを使用します。

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

焦点を絞った修正後の最初の再実行として、フル umbrella を使用しないでください。1 つのボックスが
失敗した場合は、次の証明に、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデル
provider、または QA レーンを使用します。修正によって共有リリースオーケストレーションが変更された場合、または
以前の全ボックス証拠が古くなった場合にのみ、フル umbrella を再度実行します。umbrella の最終 verifier は、記録された子ワークフロー実行
ID を再チェックするため、子ワークフローを正常に再実行した後は、失敗した
`Verify full validation` 親ジョブだけを再実行します。

範囲を限定した復旧には、umbrella に `rerun_group` を渡します。`all` は実際の
リリース候補実行、`ci` は通常の CI 子だけを実行し、`plugin-prerelease`
はリリース専用 Plugin 子だけを実行し、`release-checks` はすべてのリリース
ボックスを実行します。より狭いリリースグループは、単独のパッケージ Telegram レーンが指定されている場合の
`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、および `npm-telegram` です。

### Vitest

Vitest ボックスは手動の `CI` 子ワークフローです。手動 CI は意図的に
changed スコープをバイパスし、リリース候補に対して通常のテストグラフを強制します:
Linux Node シャード、バンドル済み Plugin シャード、チャネル契約、Node 22
互換性、`check`、`check-additional`、build smoke、docs checks、Python
Skills、Windows、macOS、Android、および Control UI i18n。

このボックスは「ソースツリーが通常のフルテストスイートを通過したか」に答えるために使用します。
release-path の製品検証とは同じではありません。保持する証拠:

- dispatch された `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確な対象 SHA で green になった `CI` 実行
- 回帰を調査するときの CI ジョブからの失敗または遅いシャード名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定論的な通常 CI が必要で、Docker、QA Lab、live、cross-OS、またはパッケージボックスが不要な場合にのみ、
手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` を通じた
`OpenClaw Release Checks` と、release-mode の
`install-smoke` ワークフローにあります。ソースレベルのテストだけでなく、パッケージ化された
Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには以下が含まれます。

- 遅い Bun グローバルインストール smoke を有効にした full install smoke
- 対象 SHA ごとの root Dockerfile smoke イメージ準備/再利用。QR、
  root/gateway、installer/Bun smoke ジョブは個別の install-smoke
  シャードとして実行
- リポジトリ E2E レーン
- release-path Docker チャンク: `core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g`、`plugins-runtime-install-h`、
  `bundled-channels-core`、`bundled-channels-update-a`、
  `bundled-channels-update-discord`、`bundled-channels-update-b`、および
  `bundled-channels-contracts`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 1 つの大きな bundled-channel ジョブではなく、channel-smoke、update-target、
  setup/runtime contract チャンクに分割された bundled-channel 依存関係レーン
- `bundled-plugin-install-uninstall-0` から
  `bundled-plugin-install-uninstall-23` までの、分割されたバンドル済み Plugin install/uninstall レーン
- リリースチェックに live スイートが含まれる場合の live/E2E provider スイートと Docker live model カバレッジ

再実行する前に Docker アーティファクトを使用してください。release-path scheduler は
`.artifacts/docker-tests/` をアップロードし、レーンログ、`summary.json`、`failures.json`、
フェーズタイミング、scheduler plan JSON、および再実行コマンドを含めます。焦点を絞った復旧には、
すべてのリリースチャンクを再実行する代わりに、再利用可能な live/E2E ワークフローで
`docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の
`package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、
失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは agentic
behavior とチャネルレベルのリリースゲートであり、Vitest や Docker
パッケージ機構とは別のものです。

リリース QA Lab カバレッジには以下が含まれます。

- agentic parity pack を使用して OpenAI 候補レーンを Opus 4.6
  ベースラインと比較する mock parity gate
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA レーン
- リリース telemetry に明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

このボックスは「リリースが QA シナリオと live チャネルフローで正しく動作するか」に答えるために使用します。
リリースを承認するときは、parity、Matrix、Telegram レーンのアーティファクト URL を保持してください。
Full Matrix カバレッジは、デフォルトの release-critical レーンではなく、手動の sharded QA-Lab 実行として引き続き利用できます。

### パッケージ

Package ボックスは、インストール可能な製品のゲートです。これは
`Package Acceptance` と resolver
`scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。resolver は候補を
Docker E2E が消費する `package-under-test` tarball に正規化し、
パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、
ワークフローハーネス ref をパッケージソース ref から分離します。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリース
  バージョン
- `source=ref`: 選択した `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA
  を pack する
- `source=url`: 必須の `package_sha256` を伴う HTTPS `.tgz` をダウンロードする
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用する

`OpenClaw Release Checks` は、`source=ref`、
`package_ref=<release-ref>`、`suite_profile=custom`、
`docker_lanes=bundled-channel-deps-compat plugins-offline`、および
`telegram_mode=mock-openai` で Package Acceptance を実行します。release-path Docker チャンクは、
重複する install、update、および plugin-update レーンをカバーします。Package Acceptance は、
artifact-native の bundled-channel compat、offline plugin fixtures、および Telegram
package QA を、同じ解決済み tarball に対して保持します。これは、以前は
Parallels が必要だった package/update カバレッジの大半に対する GitHub-native の
置き換えです。cross-OS release checks は OS 固有のオンボーディング、
installer、および platform behavior について引き続き重要ですが、package/update の製品検証では
Package Acceptance を優先するべきです。

レガシー package-acceptance の緩和は、意図的に期限付きです。
`2026.4.25` までのパッケージは、すでに npm に公開されたメタデータギャップについて互換性パスを使用できます:
tarball に含まれない private QA inventory entries、欠落した
`gateway install --wrapper`、tarball 由来の git
fixture に含まれない patch files、欠落した永続化 `update.channel`、レガシー Plugin install-record
locations、欠落した marketplace install-record persistence、および `plugins update` 中の config metadata
migration。公開済みの `2026.4.26` パッケージでは、すでに出荷された local build metadata stamp files について
警告が出る場合があります。それ以降のパッケージは、現代のパッケージ契約を満たす必要があります。同じギャップはリリース
検証で失敗します。

リリースの質問が実際のインストール可能パッケージに関する場合は、より広範な Package Acceptance プロファイルを使用します。

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

一般的なパッケージプロファイル:

- `smoke`: 簡易パッケージ install/channel/agent、gateway network、および config
  reload レーン
- `package`: live ClawHub なしの install/update/plugin package contracts。これは release-check
  のデフォルトです
- `product`: `package` に MCP channels、cron/subagent cleanup、OpenAI web
  search、および OpenWebUI を加えたもの
- `full`: OpenWebUI 付きの Docker release-path チャンク
- `custom`: 焦点を絞った再実行用の正確な `docker_lanes` リスト

package-candidate Telegram 証明には、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。ワークフローは、解決済みの
`package-under-test` tarball を Telegram レーンに渡します。単独の
Telegram ワークフローは、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、以下の operator-controlled inputs を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合は、validation-only preflight 用に現在の
  完全な 40 文字の workflow-branch commit SHA も使用できます
- `preflight_only`: validation/build/package のみの場合は `true`、実際の publish path の場合は `false`
- `preflight_run_id`: 実際の publish path で必須。これにより、ワークフローは成功した preflight run から
  準備済み tarball を再利用します
- `npm_dist_tag`: publish path の npm target tag。デフォルトは `beta`

`OpenClaw Release Checks` は、以下の operator-controlled inputs を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを持つチェックでは、
  解決されたコミットが OpenClaw ブランチまたは
  リリースタグから到達可能である必要があります。

ルール:

- stable タグと correction タグは、`beta` または `latest` のどちらにも公開できます
- Beta prerelease タグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は
  `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に
  validation-only です
- 実際の publish path は、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要があります。
  ワークフローは、publish が続行される前にそのメタデータを検証します

## stable npm リリース手順

stable npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行する
   - タグが存在する前は、preflight ワークフローの検証専用ドライランに、
     現在の完全なワークフローブランチのコミット SHA を使用できる
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選び、意図的に直接 stable 公開したい場合にのみ
   `latest` を選ぶ
3. 1 つの手動ワークフローから通常の CI に加えて live prompt cache、Docker、QA Lab、
   Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全な
   コミット SHA で `Full Release Validation` を実行する
4. 決定的な通常のテストグラフだけが意図的に必要な場合は、代わりにリリース ref で
   手動の `CI` ワークフローを実行する
5. 成功した `preflight_run_id` を保存する
6. `preflight_only=false`、同じ
   `tag`、同じ `npm_dist_tag`、保存した `preflight_run_id` で `OpenClaw NPM Release` を再度実行する
7. リリースが `beta` に landed した場合は、private の
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使用して、その stable バージョンを `beta` から `latest` に昇格する
8. リリースが意図的に `latest` へ直接公開され、`beta` も同じ stable build をすぐに追従すべき場合は、
   同じ private ワークフローを使用して両方の dist-tag が stable バージョンを指すようにするか、スケジュールされた
   自己修復同期で後から `beta` を移動させる

dist-tag の変更は、引き続き `NPM_TOKEN` が必要なためセキュリティ上 private repo にあり、
public repo は OIDC のみの公開を維持する。

これにより、直接公開パスと beta-first 昇格パスの両方が文書化され、operator から見える状態になる。

maintainer が local npm authentication にフォールバックする必要がある場合は、1Password CLI (`op`) コマンドを必ず専用の tmux セッション内でのみ実行する。main agent shell から `op` を直接呼び出してはならない。tmux 内に保つことで、プロンプト、アラート、OTP 処理を観測可能にし、繰り返し発生するホストアラートを防げる。

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

maintainer は、実際の runbook には private release docs の
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用する。

## 関連

- [リリースチャネル](/ja-JP/install/development-channels)
