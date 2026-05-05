---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れを実行する
    - バージョン命名とリリース周期を確認する
summary: リリースレーン、オペレーター用チェックリスト、検証ボックス、バージョン命名、リリース間隔
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-05T06:16:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には3つの公開リリースレーンがあります。

- stable: デフォルトでは npm `beta` に公開され、明示的に要求された場合は npm `latest` に公開されるタグ付きリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- 安定版リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- 安定版修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- Beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日をゼロ埋めしない
- `latest` は現在昇格済みの安定版 npm リリースを意味する
- `beta` は現在の beta インストール対象を意味する
- 安定版および安定版修正リリースはデフォルトで npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にすることも、検証済みの beta ビルドを後から昇格することもできる
- すべての安定版 OpenClaw リリースでは npm パッケージと macOS アプリを同時に出荷する。
  beta リリースでは通常、まず npm/package パスを検証して公開し、
  mac アプリのビルド/署名/公証は明示的に要求されない限り安定版向けに予約する

## リリース周期

- リリースは beta 優先で進む
- 安定版は最新 beta が検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切るため、
  リリース検証と修正が `main` 上の新規開発をブロックしない
- beta タグがプッシュまたは公開された後に修正が必要になった場合、メンテナーは古い beta タグを削除または再作成するのではなく、
  次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用

## リリース担当者チェックリスト

このチェックリストはリリースフローの公開部分を示します。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は
メンテナー専用のリリースランブックに残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がブランチ作成元として十分に green であることを確認する。
2. 実際のコミット履歴から `/changelog` で最上位の `CHANGELOG.md` セクションを書き直し、
   エントリをユーザー向けに保ち、コミットしてプッシュし、
   ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードをレビューする。アップグレードパスが引き続きカバーされている場合にのみ期限切れの
   互換性を削除するか、意図的に保持する理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` 上で直接行わない。
5. 目的のタグに必要なすべてのバージョン箇所を更新し、
   `pnpm plugins:sync` を実行して公開可能な Plugin パッケージがリリース
   バージョンと互換性メタデータを共有するようにしてから、ローカルの決定的 preflight を実行する:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, および
   `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   完全な40文字のリリースブランチ SHA を検証専用
   preflight に使用できる。成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA を対象に `Full Release Validation` ですべてのプレリリーステストを開始する。これは4つの大きなリリーステストボックス、Vitest、Docker、QA Lab、Package に対する単一の手動エントリポイントです。
8. 検証が失敗した場合は、リリースブランチ上で修正し、その修正を証明する最小の失敗ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行する。変更対象によって以前の証拠が古くなる場合にのみ、包括的な全体を再実行する。
9. beta の場合は `vYYYY.M.D-beta.N` にタグを付けてから、
   一致する `release/YYYY.M.D` ブランチから `OpenClaw Release Publish` を実行する。これは `pnpm plugins:sync:check` を検証し、
   まずすべての公開可能な Plugin パッケージを npm に公開し、次に同じ
   セットを ClawPack npm-pack tarball として ClawHub に公開し、その後、一致する dist-tag で準備済みの OpenClaw npm preflight アーティファクトを昇格する。公開後、
   公開済みの `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して post-publish package
   acceptance を実行する。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、
   次に一致するプレリリース番号を切る。古い
   プレリリースを削除または書き換えない。
10. 安定版の場合は、検証済み beta またはリリース候補に必要な検証証拠がある場合にのみ続行する。安定版 npm 公開も
    `OpenClaw Release Publish` を通り、
    `preflight_run_id` 経由で成功済みの preflight アーティファクトを再利用する。安定版 macOS リリース準備には、
    パッケージ化された `.zip`, `.dmg`, `.dSYM.zip` と、`main` 上の更新済み `appcast.xml` も必要です。
11. 公開後、npm post-publish verifier、公開後のチャンネル証拠が必要な場合の任意の standalone
    published-npm Telegram E2E、
    必要に応じた dist-tag 昇格、完全に一致する `CHANGELOG.md` セクションからの GitHub release/prerelease notes、
    およびリリース告知手順を実行する。

## リリース preflight

- リリースの事前確認前に `pnpm check:test-types` を実行し、テストの TypeScript が高速なローカル `pnpm check` ゲートの外でも対象になるようにする
- リリースの事前確認前に `pnpm check:architecture` を実行し、より広範なインポートサイクルとアーキテクチャ境界チェックが高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、期待される `dist/*` リリース成果物と Control UI バンドルがパック検証ステップ用に存在するようにする
- ルートのバージョン更新後、タグ付け前に `pnpm plugins:sync` を実行する。これは公開可能な Plugin パッケージバージョン、OpenClaw ピア/API 互換性メタデータ、ビルドメタデータ、Plugin 変更ログのスタブをコアリリースバージョンに合わせて更新する。`pnpm plugins:sync:check` は変更を加えないリリースガードであり、この手順を忘れた場合、公開ワークフローはレジストリ変更の前に失敗する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、すべてのリリース前テストボックスを 1 つの入口から開始する。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動 `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab パリティ、Matrix、Telegram レーン用の `OpenClaw Release Checks` をディスパッチする。安定版/デフォルト実行では、網羅的なライブ/E2E と Docker リリースパスのソークは `run_release_soak=true` の後ろに保持される。`release_profile=full` はソークを強制的に有効にする。`release_profile=full` と `rerun_group=all` を指定すると、リリースチェックの `release-package-under-test` 成果物に対してパッケージ Telegram E2E も実行する。同じ Telegram E2E で公開済み npm パッケージも証明する必要がある場合は、公開後に `npm_telegram_package_spec` を指定する。Package Acceptance で、SHA からビルドされた成果物ではなく出荷済み npm パッケージに対してパッケージ/更新マトリクスを実行する必要がある場合は、公開後に `package_acceptance_package_spec` を指定する。Telegram E2E を強制せず、検証が公開済み npm パッケージと一致することをプライベート証拠レポートで証明する必要がある場合は、`evidence_package_spec` を指定する。例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を継続しながらパッケージ候補のサイドチャネル証拠が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA をパックするには `source=ref` を使う。必須の SHA-256 付き HTTPS tarball には `source=url` を使う。または、別の GitHub Actions 実行でアップロードされた tarball には `source=artifact` を使う。このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対して Telegram QA を実行できる。選択された Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージ成果物が候補になり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。`update-restart-auth` は候補パッケージをインストール済み CLI と package-under-test の両方として使うため、候補の更新コマンドの管理された再起動パスを実行する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: インストール/チャネル/エージェント、Gateway ネットワーク、設定リロードの各レーン
  - `package`: OpenWebUI やライブ ClawHub を含まない、成果物ネイティブのパッケージ/更新/再起動/Plugin レーン
  - `product`: パッケージプロファイルに加え、MCP チャネル、cron/サブエージェントのクリーンアップ、OpenAI ウェブ検索、OpenWebUI
  - `full`: OpenWebUI を含む Docker リリースパスのチャンク
  - `custom`: 集中的な再実行用の正確な `docker_lanes` 選択
- リリース候補に対して通常の完全な CI カバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは変更スコープをバイパスし、Linux Node シャード、バンドル済み Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリーステレメトリを検証する場合は `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP レシーバーを通じて QA-lab を実行し、Opik、Langfuse、その他の外部コレクターを必要とせずに、エクスポートされたトレーススパン名、境界付き属性、コンテンツ/識別子の編集を検証する。
- すべてのタグ付きリリース前に `pnpm release:check` を実行する
- タグが存在した後、変更を伴う公開シーケンスとして `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` からディスパッチし（main から到達可能なタグを公開する場合は `main`）、リリースタグと成功した OpenClaw npm `preflight_run_id` を渡し、意図的に限定修復を実行する場合を除き、デフォルトの Plugin 公開スコープ `all-publishable` を維持する。このワークフローは Plugin npm 公開、Plugin ClawHub 公開、OpenClaw npm 公開を直列化し、コアパッケージが外部化された Plugin より先に公開されないようにする。
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` はリリース承認前に QA Lab モックパリティレーンに加え、高速ライブ Matrix プロファイルと Telegram QA レーンも実行する。ライブレーンは `qa-live-shared` 環境を使う。Telegram は Convex CI 認証情報リースも使う。Matrix のトランスポート、メディア、E2EE インベントリ全体を並列で確認したい場合は、`matrix_profile=all` と `matrix_shards=true` を指定して手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS のインストールおよびアップグレードのランタイム検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、再利用可能ワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの。実際の npm リリースパスは短く、決定的で、成果物に集中させる一方、遅いライブチェックは専用レーンに置き、公開を停止またはブロックしないようにする
- シークレットを含むリリースチェックは、`Full Release Validation` 経由、または `main`/release ワークフロー ref からディスパッチし、ワークフローロジックとシークレットを制御された状態に保つ
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付ける
- `OpenClaw NPM Release` の検証専用事前確認も、プッシュ済みタグを必要とせず、現在の完全な 40 文字のワークフローブランチコミット SHA を受け付ける
- その SHA パスは検証専用であり、実際の公開へ昇格できない
- SHA モードでは、このワークフローはパッケージメタデータチェック用にのみ `v<package.json version>` を合成する。実際の公開には引き続き実在するリリースタグが必要
- 両方のワークフローは実際の公開と昇格パスを GitHub ホストランナー上に維持しつつ、変更を伴わない検証パスではより大きな Blacksmith Linux ランナーを使える
- そのワークフローは `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使って実行する
- npm リリースの事前確認は、別個のリリースチェックレーンを待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応するベータ/修正版タグ）を実行する
- npm 公開後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応するベータ/修正版バージョン）を実行し、新しい一時プレフィックス内で公開済みレジストリのインストールパスを検証する
- ベータ公開後、共有リース済み Telegram 認証情報プールを使い、公開済み npm パッケージに対して、インストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証するために `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行する。ローカル保守担当者の単発実行では Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` 環境認証情報を直接渡してよい。
- 保守担当者のマシンから完全な公開後ベータスモークを実行するには、`pnpm release:beta-smoke -- --beta betaN` を使う。このヘルパーは Parallels npm 更新/新規ターゲット検証を実行し、`NPM Telegram Beta E2E` をディスパッチし、正確なワークフロー実行をポーリングし、成果物をダウンロードして Telegram レポートを出力する。
- 保守担当者は、手動の `NPM Telegram Beta E2E` ワークフローを通じて、GitHub Actions から同じ公開後チェックを実行できる。これは意図的に手動専用であり、すべてのマージで実行されるわけではない。
- 保守担当者向けリリース自動化は、現在は事前確認後に昇格する方式を使う:
  - 実際の npm 公開は、成功した npm `preflight_run_id` に合格している必要がある
  - 実際の npm 公開は、成功した事前確認実行と同じ `main` または `release/YYYY.M.D` ブランチからディスパッチされている必要がある
  - 安定版 npm リリースはデフォルトで `beta` になる
  - 安定版 npm 公開は、ワークフロー入力で明示的に `latest` を対象にできる
  - トークンベースの npm dist-tag 変更は現在、セキュリティ上の理由から `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` にある。`npm dist-tag add` は依然として `NPM_TOKEN` を必要とし、公開リポジトリは OIDC のみの公開を維持するため
  - 公開 `macOS Release` は検証専用。タグがリリースブランチ上にしかなく、ワークフローを `main` からディスパッチする場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際のプライベート mac 公開は、成功したプライベート mac `preflight_run_id` と `validate_run_id` に合格している必要がある
  - 実際の公開パスは、再度ビルドするのではなく、準備済み成果物を昇格する
- `YYYY.M.D-N` のような安定版修正リリースでは、公開後検証ツールは同じ一時プレフィックスのアップグレードパスで `YYYY.M.D` から `YYYY.M.D-N` への確認も行うため、リリース修正が古いグローバルインストールをベース安定版ペイロードのまま密かに残すことはできない
- npm リリース事前確認は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り、クローズドに失敗する。これにより、空のブラウザダッシュボードを再び出荷しないようにする
- 公開後検証は、公開済み Plugin エントリポイントとパッケージメタデータがインストール済みレジストリレイアウトに存在することも確認する。Plugin ランタイムペイロードが欠落したリリースは postpublish 検証に失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は、候補更新 tarball に対して npm pack の `unpackedSize` 予算も強制するため、インストーラー e2e はリリース公開パスの前に意図しないパック肥大化を検出する
- リリース作業で CI 計画、拡張機能タイミングマニフェスト、または拡張機能テストマトリクスに触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` からプランナー所有の `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートが古い CI レイアウトを説明しないようにする
- 安定版 macOS リリースの準備状況には、アップデーターサーフェスも含まれる:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - 公開後、`main` 上の `appcast.xml` は新しい安定版 zip を指している必要がある
  - パッケージ化されたアプリは、非デバッグのバンドル ID、空でない Sparkle フィード URL、そのリリースバージョンの正規 Sparkle ビルド下限以上の `CFBundleVersion` を維持する必要がある

## リリーステストボックス

`Full Release Validation` は、運用担当者がすべてのリリース前テストを 1 つの入口から開始する方法。高速に動くブランチ上で固定コミットの証拠を得るには、ヘルパーを使い、すべての子ワークフローがターゲット SHA に固定された一時ブランチから実行されるようにする:

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` をプッシュし、そのブランチから `ref=<sha>` 付きで `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証した後、一時ブランチを削除する。これにより、誤って新しい `main` の子実行を証明してしまうことを避けられる。

リリースブランチまたはタグの検証では、信頼済みの `main` ワークフロー ref から実行し、リリースブランチまたはタグを `ref` として渡す:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

このワークフローは対象 ref を解決し、`target_ref=<release-ref>` 付きの手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備し、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後、`OpenClaw Release Checks` はインストールスモーク、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA を含む Package Acceptance、QA Lab パリティ、ライブ Matrix、ライブ Telegram に展開します。完全な実行が許容されるのは、`Full Release Validation` サマリーで `normal_ci` と `release_checks` が成功と表示される場合だけです。full/all モードでは、`npm_telegram` 子も成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が指定されていない限りスキップされます。最終検証サマリーには各子実行の最遅ジョブ表が含まれるため、リリースマネージャーはログをダウンロードしなくても現在のクリティカルパスを確認できます。
完全なステージマトリクス、正確なワークフロージョブ名、stable プロファイルと full プロファイルの違い、アーティファクト、集中再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。
子ワークフローは、対象 `ref` が古いリリースブランチまたはタグを指している場合でも、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。独立した Full Release Validation の workflow-ref 入力はありません。ワークフロー実行 ref を選ぶことで、信頼済みハーネスを選択してください。移動する `main` 上の正確なコミット証明に `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、固定された一時ブランチを作成するには `pnpm ci:full-release --sha <sha>` を使用します。

ライブ/プロバイダーの広さを選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core ライブおよび Docker パス
- `stable`: minimum に加え、リリース承認向けの stable プロバイダー/バックエンドカバレッジ
- `full`: stable に加え、広範な advisory プロバイダー/メディアカバレッジ

リリースブロック対象レーンが green で、プロモーション前に網羅的な live/E2E、Docker リリースパス、境界付きの公開済みアップグレードサバイバースイープを実行したい場合は、`stable` とともに `run_release_soak=true` を使用します。そのスイープは最新 4 つの stable パッケージに加えて、固定された `2026.4.23` と `2026.5.2` ベースライン、および古い `2026.4.15` カバレッジを対象にし、重複ベースラインを削除し、各ベースラインを個別の Docker runner ジョブにシャーディングします。`full` は `run_release_soak=true` を含意します。

`OpenClaw Release Checks` は信頼済みワークフロー ref を使用して、対象 ref を `release-package-under-test` として一度だけ解決し、soak 実行時にそのアーティファクトをクロス OS、Package Acceptance、リリースパス Docker チェックで再利用します。これにより、すべてのパッケージ向けボックスが同じバイト列を使用し、パッケージビルドの繰り返しを回避できます。クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.4` を使用します。このレーンは最遅のデフォルトモデルをベンチマークするのではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回のライブエージェントターンを証明するためです。より広範なライブプロバイダーマトリクスは、モデル固有カバレッジの場として残ります。

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

集中修正後の最初の再実行として full umbrella を使用しないでください。1 つのボックスが失敗した場合は、次の証明に、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用します。修正が共有リリースオーケストレーションを変更した場合、または以前の全ボックス証拠が古くなった場合にのみ、full umbrella を再度実行します。umbrella の最終検証は記録済みの子ワークフロー実行 ID を再チェックするため、子ワークフローが正常に再実行された後は、失敗した親 `Verify full validation` ジョブだけを再実行します。

境界付きの復旧では、`rerun_group` を umbrella に渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子のみを実行し、`plugin-prerelease` はリリース専用 Plugin 子のみを実行し、`release-checks` はすべてのリリースボックスを実行します。より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。集中 `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行は release-checks パッケージアーティファクトを使用します。集中クロス OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/スイートフィルターを追加できます。QA release-check の失敗は advisory です。QA のみの失敗はリリース検証をブロックしません。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に changed スコープをバイパスし、リリース候補に対して通常のテストグラフを強制します。Linux Node シャード、バンドル Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n です。

このボックスは「ソースツリーは完全な通常テストスイートに合格したか」に答えるために使用します。リリースパスのプロダクト検証とは同じではありません。保持する証拠:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確な対象 SHA で green になった `CI` 実行
- 回帰調査時の CI ジョブからの失敗または遅いシャード名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定論的な通常 CI が必要だが、Docker、QA Lab、ライブ、クロス OS、パッケージボックスは不要な場合にのみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` を通じて `OpenClaw Release Checks` 内にあり、さらにリリースモードの `install-smoke` ワークフローにもあります。ソースレベルテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには以下が含まれます。

- 遅い Bun グローバルインストールスモークを有効にした完全インストールスモーク
- 対象 SHA によるルート Dockerfile スモークイメージの準備/再利用。QR、root/gateway、installer/Bun スモークジョブは個別の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23` までの分割バンドル Plugin インストール/アンインストールレーン
- release checks にライブスイートが含まれる場合の live/E2E プロバイダースイートおよび Docker ライブモデルカバレッジ

再実行の前に Docker アーティファクトを使用します。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。集中復旧では、すべてのリリースチャンクを再実行するのではなく、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これはエージェント的な挙動とチャネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには以下が含まれます。

- エージェント的パリティパックを使用し、OpenAI 候補レーンを Opus 4.6 ベースラインと比較する mock パリティレーン
- `qa-live-shared` 環境を使用する高速ライブ Matrix QA プロファイル
- Convex CI 資格情報リースを使用するライブ Telegram QA レーン
- リリーステレメトリに明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

このボックスは「リリースは QA シナリオとライブチャネルフローで正しく動作するか」に答えるために使用します。リリース承認時には、パリティ、Matrix、Telegram レーンのアーティファクト URL を保持してください。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動のシャーディング済み QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージボックスはインストール可能プロダクトのゲートです。これは `Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` に支えられています。リゾルバーは候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離して保ちます。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択された `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパックする
- `source=url`: 必須の `package_sha256` 付きで HTTPS `.tgz` をダウンロードする
- `source=artifact`: 別の GitHub Actions 実行でアップロードされた `.tgz` を再利用する

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、移行、更新、設定済み認証の更新再起動、古い Plugin 依存関係のクリーンアップ、オフライン Plugin フィクスチャ、Plugin 更新、Telegram パッケージ QA を維持します。ブロッキング release checks は、デフォルトの最新公開済みパッケージベースラインを使用します。`run_release_soak=true` または `release_profile=full` は、`2026.4.23` から `latest` までのすべての stable npm 公開済みベースラインに加え、報告済み issue のフィクスチャへ拡張されます。すでに出荷済みの候補には `source=npm` で Package Acceptance を使用し、公開前の SHA 裏付け付きローカル npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前 Parallels を必要としていたパッケージ/更新カバレッジの大半を置き換える、GitHub ネイティブの代替です。クロス OS release checks は OS 固有のオンボーディング、インストーラー、プラットフォーム挙動に引き続き重要ですが、パッケージ/更新のプロダクト検証では Package Acceptance を優先してください。

更新と Plugin 検証の正規チェックリストは[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)です。Plugin のインストール/更新、doctor クリーンアップ、公開済みパッケージ移行の変更を、どのローカル、Docker、Package Acceptance、または release-check レーンで証明するか判断するときに使用してください。すべての stable `2026.4.23+` パッケージからの網羅的な公開済み更新移行は、Full Release CI の一部ではなく、独立した手動 `Update Migration` ワークフローです。

レガシーな package-acceptance の緩和は、意図的に期限を区切っています。
`2026.4.25` までのパッケージは、すでに npm に公開済みのメタデータ欠落について互換パスを使用できます。tarball から欠落しているプライベート QA インベントリエントリ、欠落している `gateway install --wrapper`、tarball 由来の git fixture に含まれないパッチファイル、永続化された `update.channel` の欠落、レガシー Plugin インストールレコードの場所、マーケットプレイスのインストールレコード永続化の欠落、`plugins update` 中の config メタデータ移行が対象です。公開済みの `2026.4.26` パッケージは、すでに出荷されていたローカルビルドメタデータ stamp ファイルについて警告する場合があります。以降のパッケージは現代のパッケージ契約を満たす必要があります。同じ欠落はリリース検証で失敗します。

リリース上の問いが実際にインストール可能なパッケージに関するものの場合は、より広い Package Acceptance プロファイルを使用します。

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

- `smoke`: 簡易的なパッケージインストール/channel/agent、Gateway ネットワーク、config
  リロードの lane
- `package`: live
  ClawHub なしの install/update/restart/Plugin パッケージ契約。これが release-check のデフォルトです
- `product`: `package` に加えて MCP channel、Cron/subagent cleanup、OpenAI web
  search、OpenWebUI
- `full`: OpenWebUI を含む Docker release-path chunk
- `custom`: 焦点を絞った再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明には、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。このワークフローは解決済みの
`package-under-test` tarball を Telegram lane に渡します。単独の
Telegram ワークフローは、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## リリース公開自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントです。リリースに必要な順序で trusted-publisher ワークフローを調整します。

1. リリースタグをチェックアウトし、その commit SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを検証します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で `Plugin NPM Release` を dispatch します。
5. 同じ scope と SHA で `Plugin ClawHub Release` を dispatch します。
6. リリースタグ、npm dist-tag、保存済みの `preflight_run_id` を指定して `OpenClaw NPM Release` を dispatch します。

Beta 公開の例:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

デフォルトの beta dist-tag への stable 公開:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

`latest` へ直接 stable promotion する場合は明示します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、焦点を絞った修復または再公開作業にのみ使用します。選択した Plugin の修復では、`OpenClaw Release Publish` に `plugin_publish_scope=selected` と `plugins=@openclaw/name` を渡すか、OpenClaw パッケージを公開してはならない場合は child workflow を直接 dispatch します。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、operator が制御する次の入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` などの必須リリースタグ。`preflight_only=true` の場合は、validation-only preflight 用に現在の完全な 40 文字の workflow-branch commit SHA も使用できます
- `preflight_only`: validation/build/package のみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスで必須。ワークフローが成功した preflight run の準備済み tarball を再利用するために使用します
- `npm_dist_tag`: 公開パスの npm target tag。デフォルトは `beta`

`OpenClaw Release Publish` は、operator が制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight run id。`publish_openclaw_npm=true` の場合は必須です
- `npm_dist_tag`: OpenClaw パッケージの npm target tag
- `plugin_publish_scope`: デフォルトは `all-publishable`。焦点を絞った修復作業でのみ `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合のカンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin のみの修復 orchestrator として使用する場合にのみ `false` に設定します

`OpenClaw Release Checks` は、operator が制御する次の入力を受け付けます。

- `ref`: 検証する branch、tag、または完全な commit SHA。secret を含む check では、解決された commit が OpenClaw branch または release tag から到達可能である必要があります。
- `run_release_soak`: stable/default release checks で、網羅的な live/E2E、Docker release-path、all-since upgrade-survivor soak に opt in します。`release_profile=full` によって強制的に有効になります。

ルール:

- Stable タグと correction タグは `beta` または `latest` のどちらにも公開できます
- Beta prerelease タグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全な commit SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に validation-only です
- 実際の公開パスでは、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは公開前にそのメタデータが継続していることを検証します

## Stable npm リリース手順

Stable npm リリースを作成する場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、preflight ワークフローの validation-only dry run 用に現在の完全な workflow-branch commit SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選び、意図的に直接 stable 公開したい場合にのみ `latest` を選びます
3. 1 つの手動ワークフローから通常の CI に加えて live prompt cache、Docker、QA Lab、Matrix、Telegram coverage が必要な場合は、release branch、release tag、または完全な commit SHA で `Full Release Validation` を実行します
4. 決定的な通常テストグラフだけが必要な場合は、代わりに release ref で手動の `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存した `preflight_run_id` で `OpenClaw Release Publish` を実行します。OpenClaw npm パッケージを promotion する前に、外部化された plugins を npm と ClawHub に公開します
7. リリースが `beta` に landing した場合は、プライベートな `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その stable version を `beta` から `latest` へ promotion します
8. リリースを意図的に `latest` へ直接公開し、`beta` も同じ stable build をすぐに追従すべき場合は、同じプライベートワークフローで両方の dist-tags を stable version に向けるか、スケジュールされた self-healing sync が後で `beta` を移動するのを待ちます

dist-tag の変更は、まだ `NPM_TOKEN` を必要とするためセキュリティ上プライベートリポジトリにあります。一方、公開リポジトリは OIDC-only publish を維持します。

これにより、直接公開パスと beta-first promotion パスの両方が文書化され、operator から見える状態になります。

maintainer がローカル npm 認証にフォールバックする必要がある場合、1Password
CLI (`op`) コマンドは専用の tmux セッション内でのみ実行します。メイン agent shell から `op` を直接呼び出さないでください。tmux 内に保つことで、prompt、alert、OTP handling が観測可能になり、ホスト alert の繰り返しを防げます。

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

Maintainers は、実際の runbook に
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
のプライベートリリース docs を使用します。

## 関連

- [リリース channel](/ja-JP/install/development-channels)
