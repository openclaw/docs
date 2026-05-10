---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名とリリース周期を探す
summary: リリースレーン、運用者チェックリスト、検証ボックス、バージョン命名、リリース周期
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-10T19:50:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には 3 つの公開リリースレーンがあります。

- stable: デフォルトでは npm `beta` に公開され、明示的に要求された場合は npm `latest` に公開されるタグ付きリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- 安定版リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- 安定版修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- ベータプレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日にゼロ埋めをしない
- `latest` は、現在昇格済みの安定版 npm リリースを意味する
- `beta` は、現在のベータインストール対象を意味する
- 安定版および安定版修正リリースは、デフォルトでは npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にできるほか、検証済みのベータビルドを後で昇格できる
- すべての安定版 OpenClaw リリースでは、npm パッケージと macOS アプリを一緒に出荷する。
  ベータリリースでは通常、まず npm/パッケージ経路を検証して公開し、
  mac アプリのビルド/署名/公証は明示的に要求されない限り安定版用に残す

## リリース頻度

- リリースはベータ優先で進む
- 安定版は、最新ベータが検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切る。
  これにより、リリース検証と修正が `main` 上の新規開発をブロックしない
- ベータタグがプッシュ済みまたは公開済みで修正が必要な場合、メンテナーは古いベータタグを削除または再作成するのではなく、次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモはメンテナー専用

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開上の形です。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は、メンテナー専用のリリース手順書に残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がブランチ作成元として十分に green であることを確認する。
2. 実際のコミット履歴から `/changelog` で `CHANGELOG.md` の最上部セクションを書き直し、
   エントリをユーザー向けに保ち、コミットし、プッシュし、ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードをレビューする。アップグレード経路が引き続きカバーされる場合にのみ期限切れの互換性を削除し、そうでなければ意図的に保持する理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を `main` で直接行わない。
5. 意図したタグに必要なすべてのバージョン位置を更新し、その後
   `pnpm release:prep` を実行する。これは Plugin バージョン、Plugin インベントリ、設定
   スキーマ、同梱チャンネル設定メタデータ、設定ドキュメントベースライン、Plugin SDK
   エクスポート、Plugin SDK API ベースラインを正しい順序で更新する。タグ付け前に、生成された
   差分をコミットする。その後、ローカルの決定的な事前検証を実行する:
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、および `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   検証専用の事前検証に、完全な 40 文字のリリースブランチ SHA を使用できる。成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` ですべてのプレリリーステストを開始する。これは 4 つの大きなリリーステストボックスである Vitest、Docker、QA Lab、Package の単一の手動エントリポイントです。
8. 検証が失敗した場合は、リリースブランチで修正し、修正を証明する最小の失敗ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル allowlist を再実行する。変更面によって以前の証拠が古くなる場合にのみ、完全なアンブレラを再実行する。
9. ベータでは、`vYYYY.M.D-beta.N` にタグを付け、その後対応する `release/YYYY.M.D` ブランチから `OpenClaw Release Publish` を実行する。これは `pnpm plugins:sync:check` を検証し、
   公開可能なすべての Plugin パッケージを npm に、同じセットを
   ClawHub に並列で dispatch し、その後 Plugin の npm 公開が成功し次第、対応する dist-tag 付きで準備済みの OpenClaw npm 事前検証アーティファクトを昇格する。
   OpenClaw npm 公開の子が成功した後、完全に対応する
   `CHANGELOG.md` セクションから、対応する GitHub リリース/プレリリースページを作成または更新する。npm `latest` に公開された安定版リリースは GitHub latest リリースになる。npm `beta` に保持された安定版メンテナンスリリースは
   GitHub `latest=false` で作成される。
   OpenClaw npm が公開されている間も ClawHub 公開は実行中の場合があるが、リリース公開ワークフローは子実行 ID を即座に出力する。デフォルトでは、dispatch 後に ClawHub を待たないため、OpenClaw npm の利用可能性は、より遅い ClawHub 承認やレジストリ作業によってブロックされない。ClawHub がワークフロー完了をブロックする必要がある場合は
   `wait_for_clawhub=true` を設定する。
   ClawHub 経路は一時的な CLI 依存関係インストール失敗を再試行し、1 つのプレビューセルが不安定でもプレビューに通過した Plugin を公開し、すべての期待される Plugin バージョンに対するレジストリ検証で終了するため、部分公開は可視で再試行可能なままになる。公開後、公開された `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して、公開後パッケージ
   受け入れを実行する。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、次の対応するプレリリース番号を切る。古いプレリリースを削除または書き換えない。
10. 安定版では、検証済みのベータまたはリリース候補に必要な検証証拠がある場合にのみ続行する。安定版 npm 公開も
    `OpenClaw Release Publish` を通り、`preflight_run_id` 経由で成功した事前検証アーティファクトを再利用する。安定版 macOS リリース準備には、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および更新済みの `appcast.xml` が `main` 上にあることも必要です。
    非公開の macOS 公開ワークフローは、リリースアセット検証後に署名済み appcast を公開 `main` に自動公開する。ブランチ保護によって直接 push がブロックされる場合は、appcast PR を開くか更新する。
11. 公開後、npm 公開後検証器、公開後チャンネル証拠が必要な場合は任意のスタンドアロン公開済み npm Telegram E2E、必要に応じた dist-tag 昇格を実行し、生成された GitHub リリースページを検証し、リリース告知手順を実行する。

## リリース事前検証

- リリースのプリフライト前に `pnpm check:test-types` を実行し、テストの TypeScript がより高速なローカルの `pnpm check` ゲート外でもカバーされるようにする
- リリースのプリフライト前に `pnpm check:architecture` を実行し、より広範な import
  cycle とアーキテクチャ境界チェックが、より高速なローカルゲート外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、pack
  検証ステップで想定される `dist/*` リリース成果物と Control UI バンドルが存在するようにする
- ルートのバージョン更新後、タグ付け前に `pnpm release:prep` を実行する。これは、バージョン/config/API 変更後にずれやすい決定的なリリース生成器をすべて実行する: Plugin バージョン、Plugin インベントリ、ベース config
  スキーマ、バンドル済みチャンネル config メタデータ、config docs ベースライン、Plugin SDK
  exports、Plugin SDK API ベースライン。`pnpm release:check` はこれらの
  ガードをチェックモードで再実行し、package release checks を実行する前に、検出した生成物のずれの失敗を 1 回のパスですべて報告する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、すべてのプレリリーステストボックスを 1 つのエントリーポイントから開始する。これはブランチ、
  タグ、または完全なコミット SHA を受け取り、手動 `CI` を dispatch し、install smoke、package acceptance、cross-OS
  package checks、QA Lab parity、Matrix、Telegram レーンのために
  `OpenClaw Release Checks` を dispatch する。Stable/default 実行では、網羅的な live/E2E と Docker release-path soak は
  `run_release_soak=true` の背後に置かれる。`release_profile=full` は soak を強制的に有効にする。
  `release_profile=full` と `rerun_group=all` を指定すると、release checks からの `release-package-under-test` 成果物に対して package Telegram
  E2E も実行する。
  公開後、同じ Telegram E2E で公開済み npm パッケージも証明する必要がある場合は
  `npm_telegram_package_spec` を指定する。公開後、Package Acceptance
  で SHA からビルドされた成果物ではなく、出荷済み npm パッケージに対して package/update matrix を実行する必要がある場合は
  `package_acceptance_package_spec` を指定する。
  Telegram E2E を強制せず、検証が公開済み npm パッケージと一致することを private evidence report で証明する必要がある場合は
  `evidence_package_spec` を指定する。
  例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を続けながら package 候補の side-channel 証明が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、
  `openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の
  `workflow_ref` harness で信頼済みの `package_ref` ブランチ/tag/SHA を pack するには `source=ref` を使う。必須の
  SHA-256 付き HTTPS tarball には `source=url` を使う。または、別の GitHub
  Actions 実行でアップロードされた tarball には `source=artifact` を使う。ワークフローは候補を
  `package-under-test` に解決し、その tarball に対して Docker E2E release scheduler を再利用し、
  `telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対して Telegram QA を実行できる。
  選択された Docker レーンに `published-upgrade-survivor` が含まれる場合、package
  成果物は候補であり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。
  `update-restart-auth` は候補パッケージを installed CLI と package-under-test の両方として使うため、候補 update command の managed restart path を実行する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: install/channel/agent、gateway network、config reload レーン
  - `package`: OpenWebUI や live ClawHub を含まない、artifact-native package/update/restart/Plugin レーン
  - `product`: package プロファイルに加え、MCP チャンネル、cron/subagent cleanup、
    OpenAI web search、OpenWebUI
  - `full`: OpenWebUI 付きの Docker release-path チャンク
  - `custom`: focused rerun のための正確な `docker_lanes` 選択
- リリース候補に対する通常の CI カバレッジ全体だけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI dispatch は changed
  scoping をバイパスし、Linux Node shards、バンドル済み Plugin shards、channel
  contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、
  docs checks、Python skills、Windows、macOS、Android、Control UI i18n
  レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリース telemetry を検証する場合は `pnpm qa:otel:smoke` を実行する。これは
  QA-lab をローカルの OTLP/HTTP receiver 経由で実行し、Opik、Langfuse、または別の外部 collector を必要とせずに、エクスポートされた trace
  span 名、境界付けられた属性、content/identifier redaction を検証する。
- タグ付きリリースの前には毎回 `pnpm release:check` を実行する
- タグが存在した後、mutating publish sequence のために `OpenClaw Release Publish` を実行する。
  `release/YYYY.M.D` から dispatch する（main から到達可能なタグを公開する場合は `main` から）、
  release tag と成功した OpenClaw npm
  `preflight_run_id` を渡し、意図的に focused repair を実行している場合を除き、デフォルトの Plugin publish scope
  `all-publishable` を維持する。このワークフローは Plugin npm publish、Plugin ClawHub publish、OpenClaw
  npm publish を直列化し、外部化された
  Plugin より前に core package が公開されないようにする。
- リリースチェックは、現在は別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab mock parity レーンに加えて、高速な
  live Matrix プロファイルと Telegram QA レーンも実行する。live
  レーンは `qa-live-shared` environment を使用し、Telegram は Convex CI
  credential lease も使用する。Matrix
  transport、media、E2EE inventory 全体を並列で実行したい場合は、手動の `QA-Lab - All Lanes` ワークフローを
  `matrix_profile=all` と `matrix_shards=true` で実行する。
- Cross-OS install と upgrade runtime validation は公開
  `OpenClaw Release Checks` と `Full Release Validation` の一部であり、再利用可能ワークフロー
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なものだ: 実際の npm release path は短く、決定的で、成果物中心に保ち、
  遅い live checks は独自のレーンに置いて、publish を停止またはブロックしないようにする
- secret を含む release checks は、`Full Release
Validation` 経由、または `main`/release workflow ref から dispatch し、ワークフロー logic と
  secrets が制御されたままになるようにする
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたは release tag から到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け取る
- `OpenClaw NPM Release` の validation-only preflight は、push 済みタグを必要とせず、現在の完全な 40 文字の workflow-branch commit SHA も受け取る
- その SHA path は validation-only であり、実際の publish に昇格できない
- SHA モードでは、ワークフローは package metadata check のためだけに `v<package.json version>` を合成する。実際の publish には依然として実在する release tag が必要
- どちらのワークフローも、実際の publish と promotion path は GitHub-hosted
  runners 上に維持し、非 mutating validation path はより大きい
  Blacksmith Linux runners を使用できる
- そのワークフローは
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を `OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方の workflow secrets を使って実行する
- npm release preflight は、別の release checks レーンを待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応する beta/correction tag）を実行する
- npm publish 後、
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応する beta/correction version）を実行し、新しい temp prefix で公開済み registry
  install path を検証する
- beta publish 後、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  を実行し、共有 leased Telegram credential
  pool を使って、公開済み npm パッケージに対する installed-package オンボーディング、Telegram setup、実際の Telegram E2E
  を検証する。ローカル maintainer の単発実行では Convex vars を省略し、3 つの
  `OPENCLAW_QA_TELEGRAM_*` env credentials を直接渡してもよい。
- maintainer machine から完全な post-publish beta smoke を実行するには、`pnpm release:beta-smoke -- --beta betaN` を使う。この helper は Parallels npm update/fresh-target validation を実行し、`NPM Telegram Beta E2E` を dispatch し、正確な workflow run を poll し、artifact をダウンロードし、Telegram report を出力する。
- maintainers は GitHub Actions から手動の `NPM Telegram Beta E2E` ワークフロー経由で同じ post-publish check を実行できる。これは意図的に manual-only であり、すべての merge では実行されない。
- maintainer release automation は現在、preflight-then-promote を使用する:
  - 実際の npm publish は、成功した npm `preflight_run_id` に合格していなければならない
  - 実際の npm publish は、成功した preflight run と同じ `main` または
    `release/YYYY.M.D` ブランチから dispatch されなければならない
  - stable npm releases のデフォルトは `beta`
  - stable npm publish は workflow input で明示的に `latest` を target にできる
  - token-based npm dist-tag mutation は現在、security のため
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    に置かれている。`npm dist-tag add` は依然として `NPM_TOKEN` を必要とし、一方で
    public repo は OIDC-only publish を維持するため
  - public `macOS Release` は validation-only。tag が release branch 上にのみ存在するが workflow が `main` から dispatch される場合は、
    `public_release_branch=release/YYYY.M.D` を設定する
  - 実際の private mac publish は、成功した private mac
    `preflight_run_id` と `validate_run_id` に合格していなければならない
  - 実際の publish paths は、再ビルドするのではなく、準備済み成果物を promote する
- `YYYY.M.D-N` のような stable correction releases では、post-publish verifier
  は同じ temp-prefix upgrade path で `YYYY.M.D` から `YYYY.M.D-N` への更新もチェックするため、release corrections が古い global installs を base stable payload のまま静かに残すことはできない
- npm release preflight は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` payload の両方が含まれていない限り fail closed になるため、空の browser dashboard を再び出荷しない
- Post-publish verification は、公開済み Plugin entrypoints と package metadata が installed registry layout に存在することもチェックする。Plugin runtime payload が欠けたリリースは postpublish verifier に失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は候補 update tarball に対して npm pack `unpackedSize` budget も適用するため、installer e2e は release publish path の前に偶発的な pack bloat を検出する
- リリース作業で CI planning、extension timing manifests、または
  extension test matrices に触れた場合は、承認前に
  `.github/workflows/plugin-prerelease.yml` から planner-owned
  `plugin-prerelease-extension-shard` matrix outputs を再生成してレビューし、release notes が古い CI layout を説明しないようにする
- stable macOS release readiness には updater surfaces も含まれる:
  - GitHub release には packaged `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれていなければならない
  - `main` 上の `appcast.xml` は publish 後に新しい stable zip を指していなければならない。
    private macOS publish workflow が自動的にコミットするか、direct push がブロックされた場合は appcast
    PR を開く
  - packaged app は non-debug bundle id、空でない Sparkle feed
    URL、そのリリースバージョンの canonical Sparkle build floor 以上の `CFBundleVersion` を維持しなければならない

## リリーステストボックス

`Full Release Validation` は、operators がすべてのプレリリーステストを 1 つのエントリーポイントから開始する方法である。
動きの速いブランチで pinned commit proof が必要な場合は、
helper を使い、各 child workflow が target
SHA に固定された一時ブランチから実行されるようにする:

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` を push し、そのブランチから `ref=<sha>` で `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証してから、一時ブランチを削除します。これにより、誤って新しい `main` の子実行を証明してしまうことを避けられます。

リリースブランチまたはタグを検証するには、信頼済みの `main` ワークフロー ref から実行し、リリースブランチまたはタグを `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

このワークフローは対象 ref を解決し、`target_ref=<release-ref>` で手動の `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備し、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後、`OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA を含む Package Acceptance、QA Lab パリティ、live Matrix、live Telegram へ展開します。完全実行が受け入れ可能なのは、`Full Release Validation` サマリーで `normal_ci` と `release_checks` が成功と表示されている場合だけです。full/all モードでは、`npm_telegram` 子も成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が指定されていない限りスキップされます。最終検証サマリーには各子実行の最も遅いジョブの表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージマトリクス、正確なワークフロージョブ名、stable と full プロファイルの違い、アーティファクト、集中 rerun ハンドルについては、[Full release validation](/ja-JP/reference/full-release-validation) を参照してください。
子ワークフローは、対象 `ref` が古いリリースブランチやタグを指している場合でも、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。独立した Full Release Validation ワークフロー ref 入力はありません。ワークフロー実行 ref を選ぶことで、信頼済みハーネスを選択します。
移動する `main` 上の正確なコミット証明に `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使って固定された一時ブランチを作成します。

live/provider の広さを選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: minimum に加えて、リリース承認用の安定した provider/backend カバレッジ
- `full`: stable に加えて、広範な advisory provider/media カバレッジ

リリースをブロックするレーンが green で、昇格前に網羅的な live/E2E、Docker リリースパス、および範囲を限定した公開済みアップグレード生存スイープを実行したい場合は、`stable` とともに `run_release_soak=true` を使用します。そのスイープは最新 4 つの stable パッケージに加えて、固定された `2026.4.23` と `2026.5.2` ベースライン、さらに古い `2026.4.15` カバレッジを対象にし、重複するベースラインを削除し、各ベースラインを独自の Docker ラナージョブにシャーディングします。`full` は `run_release_soak=true` を含意します。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使って対象 ref を一度だけ `release-package-under-test` として解決し、soak 実行時のクロス OS、Package Acceptance、リリースパス Docker チェックでそのアーティファクトを再利用します。これにより、すべてのパッケージ向けボックスが同じバイト列を使用し、パッケージビルドの繰り返しを避けられます。クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外は `openai/gpt-5.4` を使用します。このレーンは、最も遅いデフォルトモデルをベンチマークするのではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回の live エージェントターンを証明するためです。より広範な live provider マトリクスは、モデル固有のカバレッジを担う場所として残ります。

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

集中修正後の最初の rerun として full umbrella を使用しないでください。1 つのボックスが失敗した場合は、次の証明に、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデル provider、または QA レーンを使用します。修正によって共有リリースオーケストレーションが変更された場合、または以前の全ボックス証拠が古くなった場合にのみ、full umbrella を再度実行します。umbrella の最終検証は記録された子ワークフロー実行 ID を再チェックするため、子ワークフローが正常に rerun された後は、失敗した親 `Verify full validation` ジョブだけを rerun します。

範囲を限定した復旧には、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常 CI 子のみ、`plugin-prerelease` はリリース専用 Plugin 子のみ、`release-checks` はすべてのリリースボックスを実行し、より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。集中 `npm-telegram` rerun には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行は release-checks パッケージアーティファクトを使用します。集中クロス OS rerun では `cross_os_suite_filter=windows/packaged-upgrade` や別の OS/suite フィルターを追加できます。QA release-check の失敗は advisory です。QA のみの失敗はリリース検証をブロックしません。

### Vitest

Vitest ボックスは手動の `CI` 子ワークフローです。手動 CI は意図的に変更スコープを迂回し、リリース候補に対して通常のテストグラフを強制します。対象は、Linux Node shards、bundled-plugin shards、channel contracts、Node 22 互換性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android、Control UI i18n です。

「ソースツリーは通常の完全テストスイートに合格したか？」に答えるには、このボックスを使用します。これはリリースパスのプロダクト検証とは同じではありません。保持する証拠:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確な対象 SHA で green の `CI` 実行
- 回帰調査時の CI ジョブからの失敗または低速な shard 名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースで決定的な通常 CI が必要だが、Docker、QA Lab、live、クロス OS、またはパッケージボックスが不要な場合のみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` とリリースモードの `install-smoke` ワークフローを通じて、`OpenClaw Release Checks` 内にあります。これは、ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには次が含まれます。

- 遅い Bun グローバルインストールスモークを有効にした full install smoke
- 対象 SHA ごとのルート Dockerfile スモークイメージの準備/再利用。QR、root/gateway、installer/Bun smoke ジョブは別々の install-smoke shard として実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割された bundled plugin install/uninstall レーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- リリースチェックに live スイートが含まれる場合の live/E2E provider スイートと Docker live モデルカバレッジ

rerun の前に Docker アーティファクトを使用します。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、rerun コマンドを含む `.artifacts/docker-tests/` をアップロードします。集中復旧では、すべてのリリースチャンクを rerun する代わりに、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成された rerun コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは agentic 動作とチャンネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには次が含まれます。

- agentic parity pack を使用して OpenAI 候補レーンを Opus 4.6 ベースラインと比較する mock parity レーン
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA レーン
- リリース telemetry に明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

「リリースは QA シナリオと live チャンネルフローで正しく動作するか？」に答えるには、このボックスを使用します。リリース承認時には、parity、Matrix、Telegram レーンのアーティファクト URL を保持します。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動のシャーディングされた QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージボックスはインストール可能プロダクトのゲートです。これは `Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。リゾルバーは候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離して保持します。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択した `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を pack
- `source=url`: 必須の `package_sha256` を伴う HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、移行、更新、設定済み auth の更新再起動、live ClawHub skill install、古い Plugin 依存関係の cleanup、offline Plugin fixtures、Plugin update、Telegram パッケージ QA を、同じ解決済み tarball に対して維持します。ブロッキングリリースチェックは、デフォルトで最新の公開済みパッケージベースラインを使用します。`run_release_soak=true` または `release_profile=full` は、`2026.4.23` から `latest` までの npm 公開済み stable ベースラインすべてに、報告済み issue fixtures を加えたものへ拡張します。すでに出荷済みの候補には `source=npm` で Package Acceptance を使用し、publish 前の SHA に紐づいたローカル npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前 Parallels が必要だったパッケージ/更新カバレッジの大半を置き換える GitHub ネイティブな手段です。クロス OS リリースチェックは OS 固有のオンボーディング、installer、platform 動作にとって引き続き重要ですが、パッケージ/更新のプロダクト検証では Package Acceptance を優先するべきです。

更新とプラグイン検証の正規チェックリストは
[更新とプラグインのテスト](/ja-JP/help/testing-updates-plugins)です。プラグインのインストール/更新、doctor クリーンアップ、または公開済みパッケージの移行変更を証明するために、どのローカル、Docker、Package Acceptance、またはリリースチェックのレーンを使うかを判断するときに使用します。
すべての安定版 `2026.4.23+` パッケージからの網羅的な公開済み更新移行は、別個の手動 `Update Migration` ワークフローであり、Full Release CI の一部ではありません。

レガシー package-acceptance の緩和は意図的に期限を区切っています。
`2026.4.25` までのパッケージでは、npm にすでに公開済みのメタデータ欠落に対して互換パスを使用できます。対象は、tarball に含まれていない private QA inventory entries、欠落した `gateway install --wrapper`、tarball 由来の git fixture 内の欠落した patch ファイル、永続化されていない `update.channel`、レガシーなプラグイン install-record の場所、marketplace install-record の永続化欠落、`plugins update` 中の config metadata migration です。公開済みの `2026.4.26` パッケージは、すでに出荷済みのローカルビルド metadata stamp ファイルについて警告を出す場合があります。それ以降のパッケージは現行の package contract を満たす必要があります。同じ欠落はリリース検証で失敗します。

リリース上の問いが実際にインストール可能なパッケージに関するものなら、より広い Package Acceptance プロファイルを使用します。

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

- `smoke`: 簡易的な package install/channel/agent、gateway network、config
  reload レーン
- `package`: install/update/restart/plugin package contract とライブ ClawHub
  skill install proof。これはリリースチェックのデフォルトです
- `product`: `package` に加えて、MCP channels、cron/subagent cleanup、OpenAI web
  search、OpenWebUI
- `full`: OpenWebUI を含む Docker release-path チャンク
- `custom`: 集中的な再実行用の正確な `docker_lanes` リスト

package-candidate Telegram proof では、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。このワークフローは解決済みの
`package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの
Telegram ワークフローは、公開後チェック用に公開済み npm spec も引き続き受け付けます。

## リリース公開の自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントです。
リリースで必要な順序で trusted-publisher ワークフローを調整します。

1. リリースタグをチェックアウトし、その commit SHA を解決します。
2. そのタグが `main` または `release/*` から到達可能であることを検証します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で `Plugin NPM Release` を dispatch します。
5. 同じ scope と SHA で `Plugin ClawHub Release` を dispatch します。
6. リリースタグ、npm dist-tag、保存済みの `preflight_run_id` で `OpenClaw NPM Release` を dispatch します。

Beta 公開の例:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

デフォルトの beta dist-tag への Stable 公開:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

`latest` へ直接 Stable promotion する場合は明示的に指定します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、集中的な修復または再公開作業にのみ使用します。選択したプラグインの修復では、`plugin_publish_scope=selected` と `plugins=@openclaw/name` を
`OpenClaw Release Publish` に渡します。または OpenClaw パッケージを公開してはならない場合は、子ワークフローを直接 dispatch します。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、operator が制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証専用 preflight 用に現在の
  40 文字完全 workflow-branch commit SHA も使用できます
- `preflight_only`: 検証/ビルド/パッケージのみなら `true`、実際の公開パスなら `false`
- `preflight_run_id`: 実際の公開パスでは必須。ワークフローが成功した preflight run の準備済み tarball を再利用するために使います
- `npm_dist_tag`: 公開パスの npm target tag。デフォルトは `beta`

`OpenClaw Release Publish` は、operator が制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight run id。
  `publish_openclaw_npm=true` の場合に必須です
- `npm_dist_tag`: OpenClaw パッケージの npm target tag
- `plugin_publish_scope`: デフォルトは `all-publishable`。集中的な修復作業にのみ
  `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合のカンマ区切り `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。このワークフローをプラグイン専用修復 orchestrator として使う場合にのみ `false` を設定します

`OpenClaw Release Checks` は、operator が制御する次の入力を受け付けます。

- `ref`: 検証する branch、tag、または完全 commit SHA。シークレットを伴うチェックでは、解決済み commit が OpenClaw branch または release tag から到達可能である必要があります。
- `run_release_soak`: Stable/default release checks で、網羅的な live/E2E、Docker release-path、all-since upgrade-survivor soak を有効にします。`release_profile=full` では強制的に有効になります。

ルール:

- Stable タグと correction タグは `beta` または `latest` のどちらにも公開できます
- Beta prerelease タグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全 commit SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは公開前にそのメタデータを検証して続行します

## Stable npm リリース手順

Stable npm リリースを切るとき:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、preflight ワークフローの検証専用 dry run として現在の完全 workflow-branch commit SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選び、意図的に直接 Stable 公開したい場合のみ `latest` を選びます
3. 1 つの手動ワークフローから通常の CI に加えて live prompt cache、Docker、QA Lab、
   Matrix、Telegram coverage が必要な場合は、release branch、release tag、または完全 commit SHA で
   `Full Release Validation` を実行します
4. 決定論的な通常の test graph だけが必要な場合は、代わりに release ref で手動の `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` で
   `OpenClaw Release Publish` を実行します。これは OpenClaw npm パッケージを promote する前に、外部化されたプラグインを npm と ClawHub に公開します
7. リリースが `beta` に landing した場合は、private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使用して、その Stable version を `beta` から `latest` に promote します
8. リリースが意図的に直接 `latest` に公開され、`beta` もすぐに同じ Stable build を指すべき場合は、同じ private
   ワークフローを使用して両方の dist-tag を Stable version に向けるか、scheduled self-healing sync によって後で `beta` を移動させます

dist-tag の変更は private repo にあります。これは引き続き `NPM_TOKEN` を必要とするためのセキュリティ上の理由です。一方、public repo は OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first promotion パスの両方が文書化され、operator から見える状態になります。

maintainer がローカル npm authentication にフォールバックする必要がある場合は、1Password
CLI (`op`) コマンドを専用の tmux セッション内でのみ実行します。メインの agent shell から `op` を直接呼び出さないでください。tmux 内に閉じ込めることで、prompts、alerts、OTP handling が観測可能になり、host alerts の繰り返しを防げます。

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

maintainer は実際の runbook に private release docs の
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリースチャンネル](/ja-JP/install/development-channels)
