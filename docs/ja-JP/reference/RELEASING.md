---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名とリリース周期を探す
summary: リリースレーン、オペレーターチェックリスト、検証ボックス、バージョン命名、およびケイデンス
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-12T08:46:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClawには3つの公開リリースレーンがあります:

- stable: デフォルトでは npm `beta` に公開され、明示的に要求された場合は npm `latest` に公開されるタグ付きリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動し続ける先頭

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
- 安定版および安定版修正リリースは、デフォルトでは npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にすることも、検証済みの beta ビルドを後で昇格することもできる
- すべての安定版 OpenClaw リリースでは、npm パッケージと macOS アプリを一緒に出荷する。
  beta リリースでは通常、まず npm/パッケージ経路を検証して公開し、
  mac アプリのビルド/署名/公証は明示的に要求されない限り安定版用に予約する

## リリース周期

- リリースは beta 優先で進む
- 安定版は最新の beta が検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切る。
  これにより、リリース検証と修正が `main` 上の新規開発をブロックしない
- beta タグがすでにプッシュまたは公開されていて修正が必要な場合、メンテナーは古い beta タグを削除または再作成するのではなく、
  次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、リカバリメモは
  メンテナー専用

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開される形です。非公開の認証情報、
署名、公証、dist-tag リカバリ、緊急ロールバックの詳細は、
メンテナー専用のリリース runbook に残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がブランチ作成に十分な程度に green であることを確認する。
2. 実際のコミット履歴から `/changelog` で `CHANGELOG.md` の先頭セクションを書き直し、
   エントリをユーザー向けに保ち、コミットしてプッシュし、ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードを確認する。期限切れの
   互換性は、アップグレード経路が引き続きカバーされる場合にのみ削除する。そうでない場合は、意図的に
   継続する理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` で直接行わない。
5. 予定しているタグに必要なすべてのバージョン箇所を bump し、その後
   `pnpm release:prep` を実行する。これは Plugin バージョン、Plugin インベントリ、config
   schema、バンドル channel config メタデータ、config docs baseline、Plugin SDK
   exports、Plugin SDK API baseline を正しい順序で更新する。タグ付け前に生成された
   差分をコミットする。その後、ローカルの決定的 preflight を実行する:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   validation-only preflight 用に完全な40文字のリリースブランチ SHA を使用できる。
   成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` で
   すべてのプレリリーステストを開始する。これは4つの大きなリリーステストボックスである
   Vitest、Docker、QA Lab、Package の単一の手動エントリポイントである。
8. 検証に失敗した場合は、リリースブランチ上で修正し、その修正を証明する最小の失敗ファイル、
   レーン、workflow job、package profile、provider、または model allowlist を再実行する。
   変更された表面によって以前の証拠が古くなる場合にのみ、umbrella 全体を再実行する。
9. beta の場合は `vYYYY.M.D-beta.N` をタグ付けし、その後一致する `release/YYYY.M.D` ブランチから
   `OpenClaw Release Publish` を実行する。これは `pnpm plugins:sync:check` を検証し、
   公開可能なすべての Plugin パッケージを npm に、同じセットを ClawHub に並列で dispatch し、
   Plugin npm publish が成功したらすぐに、準備済みの OpenClaw npm preflight
   artifact を一致する dist-tag で昇格する。OpenClaw npm publish child が成功した後、
   完全に一致する `CHANGELOG.md` セクションから、対応する GitHub release/prerelease
   ページを作成または更新する。npm `latest` に公開された安定版リリースは GitHub latest release になる。
   npm `beta` に維持される安定版メンテナンスリリースは
   GitHub `latest=false` で作成される。
   OpenClaw npm の公開中も ClawHub 公開はまだ実行中の場合があるが、
   release publish workflow は child run ID を即座に出力する。デフォルトでは、
   dispatch 後に ClawHub を待たないため、OpenClaw npm の可用性は、より遅い ClawHub
   承認や registry 作業によってブロックされない。ClawHub が workflow completion をブロックする必要がある場合は
   `wait_for_clawhub=true` を設定する。
   ClawHub 経路は一時的な CLI dependency install 失敗を再試行し、1つの preview cell が flaky でも
   preview に通った Plugin を公開し、最後に期待されるすべての Plugin バージョンの
   registry 検証を行うため、部分的な公開は可視で再試行可能なままになる。公開後、
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   を実行し、GitHub prerelease、npm `beta` dist-tags、npm integrity、
   公開済みインストール経路、ClawHub の正確なバージョン、ClawHub artifacts、child
   workflow conclusions を1つのコマンドで検証する。
   ClawHub sidecar が再試行可能な jobs でのみ失敗し、その場で再実行すべき場合は
   `--rerun-failed-clawhub` を追加する。
   その後、公開された `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して、公開後の package acceptance を実行する。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、
   次に一致するプレリリース番号を切る。古いプレリリースを削除または書き換えない。
10. 安定版の場合は、検証済みの beta または release candidate に必要な検証証拠がある場合にのみ続行する。
    安定版 npm publish も `OpenClaw Release Publish` を通り、
    `preflight_run_id` 経由で成功した preflight artifact を再利用する。安定版 macOS リリース準備完了には、
    package 済みの `.zip`、`.dmg`、`.dSYM.zip`、および `main` 上の更新済み `appcast.xml` も必要である。
    非公開の macOS publish workflow は、release assets の検証後、署名済み appcast を公開 `main` に
    自動で公開する。branch protection が直接 push をブロックする場合は、
    appcast PR を開くか更新する。
11. 公開後、npm post-publish verifier、公開後 channel proof が必要な場合は任意の standalone
    published-npm Telegram E2E、必要な場合は dist-tag promotion を実行し、
    生成された GitHub release ページを検証し、
    リリース告知手順を実行する。

## リリース preflight

- リリース前のプリフライト前に `pnpm check:test-types` を実行し、テスト TypeScript が高速なローカル `pnpm check` ゲートの外でもカバーされるようにする
- リリース前のプリフライト前に `pnpm check:architecture` を実行し、より広範なインポートサイクルとアーキテクチャ境界チェックが高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、pack 検証ステップで期待される `dist/*` リリース成果物と Control UI バンドルが存在するようにする
- ルートのバージョン更新後、タグ付け前に `pnpm release:prep` を実行する。これは、バージョン/config/API 変更後にずれやすいすべての決定的なリリース生成処理を実行する: plugin バージョン、plugin インベントリ、ベース config スキーマ、同梱 channel config メタデータ、config docs ベースライン、plugin SDK exports、plugin SDK API ベースライン。`pnpm release:check` はこれらのガードをチェックモードで再実行し、検出したすべての生成物のずれ失敗を 1 回のパスで報告してから、package release checks を実行する。
- リリース承認前に手動の `Full Release Validation` workflow を実行し、すべてのリリース前 test box を 1 つの入口から開始する。これは branch、tag、または完全な commit SHA を受け取り、手動 `CI` を dispatch し、install smoke、package acceptance、cross-OS package checks、QA Lab parity、Matrix、Telegram lanes のために `OpenClaw Release Checks` を dispatch する。stable/default 実行では、網羅的な live/E2E と Docker release-path soak は `run_release_soak=true` の背後に置かれる。`release_profile=full` は soak を強制的にオンにする。`release_profile=full` と `rerun_group=all` の場合、release checks の `release-package-under-test` artifact に対して package Telegram E2E も実行する。beta 公開後に `release_package_spec` を指定すると、release tarball を再ビルドせずに、出荷済み npm package を release checks、Package Acceptance、package Telegram E2E 全体で再利用できる。Telegram がリリース検証の残りとは異なる公開済み package を使う必要がある場合にのみ `npm_telegram_package_spec` を指定する。Package Acceptance が release package spec とは異なる公開済み package を使う必要がある場合は `package_acceptance_package_spec` を指定する。private evidence report で、Telegram E2E を強制せずに検証が公開済み npm package と一致することを証明する必要がある場合は `evidence_package_spec` を指定する。
  例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を継続しながら package candidate のサイドチャネル証拠が必要な場合は、手動の `Package Acceptance` workflow を実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` harness で信頼済みの `package_ref` branch/tag/SHA を pack するには `source=ref` を使う。必須の SHA-256 を持つ HTTPS tarball には `source=url` を使う。別の GitHub Actions 実行によってアップロードされた tarball には `source=artifact` を使う。workflow は candidate を `package-under-test` に解決し、その tarball に対して Docker E2E release scheduler を再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対する Telegram QA を実行できる。選択された Docker lanes に `published-upgrade-survivor` が含まれる場合、package artifact が candidate になり、`published_upgrade_survivor_baseline` が公開済み baseline を選択する。`update-restart-auth` は candidate package を installed CLI と package-under-test の両方として使うため、candidate update command の managed restart path を実行する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: install/channel/agent、gateway network、config reload lanes
  - `package`: OpenWebUI や live ClawHub を含まない、artifact-native package/update/restart/plugin lanes
  - `product`: package profile に加えて MCP channels、cron/subagent cleanup、OpenAI web search、OpenWebUI
  - `full`: OpenWebUI を含む Docker release-path chunks
  - `custom`: focused rerun のための正確な `docker_lanes` 選択
- リリース候補に対する通常のフル CI カバレッジだけが必要な場合は、手動の `CI` workflow を直接実行する。手動 CI dispatch は changed scoping をバイパスし、Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android、Control UI i18n lanes を強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリース telemetry を検証する場合は `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP receiver を通じて QA-lab を実行し、Opik、Langfuse、またはその他の外部 collector を必要とせずに、エクスポートされた trace span 名、境界付き attributes、content/identifier redaction を検証する。
- すべてのタグ付きリリース前に `pnpm release:check` を実行する
- tag が存在した後、変更を伴う publish sequence のために `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` から dispatch する（main から到達可能な tag を公開する場合は `main` から）。release tag と成功した OpenClaw npm `preflight_run_id` を渡し、意図的に focused repair を実行しているのでない限り、default plugin publish scope は `all-publishable` のままにする。この workflow は plugin npm publish、plugin ClawHub publish、OpenClaw npm publish を順序付け、外部化された plugins より前に core package が公開されないようにする。
- Release checks は別の手動 workflow で実行されるようになった:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab mock parity lane に加えて、高速な live Matrix profile と Telegram QA lane も実行する。live lanes は `qa-live-shared` environment を使う。Telegram は Convex CI credential leases も使う。Matrix transport、media、E2EE inventory 全体を並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` で手動の `QA-Lab - All Lanes` workflow を実行する。
- Cross-OS install and upgrade runtime validation は public `OpenClaw Release Checks` と `Full Release Validation` の一部であり、これらは reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの: 実際の npm release path を短く、決定的で、artifact に集中したものに保ち、遅い live checks は独自の lane に置くことで、publish を停滞させたりブロックしたりしないようにする
- secret を含む release checks は `Full Release Validation` 経由、または `main`/release workflow ref から dispatch し、workflow logic と secrets が管理された状態を保つべきである
- `OpenClaw Release Checks` は、解決された commit が OpenClaw branch または release tag から到達可能である限り、branch、tag、または完全な commit SHA を受け付ける
- `OpenClaw NPM Release` の validation-only preflight も、push 済み tag を要求せずに、現在の完全な 40 文字の workflow-branch commit SHA を受け付ける
- その SHA path は validation-only であり、実際の publish に昇格できない
- SHA mode では、workflow は package metadata check のためだけに `v<package.json version>` を合成する。実際の publish には引き続き実際の release tag が必要である
- どちらの workflow も実際の publish と promotion path は GitHub-hosted runners 上に保ち、変更を伴わない validation path はより大きな Blacksmith Linux runners を使える
- その workflow は `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を `OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方の workflow secrets を使って実行する
- npm release preflight は、別個の release checks lane を待たなくなった
- リリース候補にローカルでタグ付けする前に、`RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check` を実行する。この helper は、GitHub publish workflow が開始する前に承認をブロックしがちなミスを捕捉する順序で、fast release guardrails、plugin npm/ClawHub release checks、build、UI build、`release:openclaw:npm:check` を実行する。
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応する beta/correction tag）を実行する
- npm publish 後に `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応する beta/correction version）を実行し、新しい一時 prefix で公開済み registry install path を検証する
- beta publish 後に、共有 leased Telegram credential pool を使って、公開済み npm package に対する installed-package onboarding、Telegram setup、実際の Telegram E2E を検証するため、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行する。maintainer のローカル単発実行では Convex vars を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` env credentials を直接渡してもよい。
- maintainer machine から完全な post-publish beta smoke を実行するには、`pnpm release:beta-smoke -- --beta betaN` を使う。この helper は Parallels npm update/fresh-target validation を実行し、`NPM Telegram Beta E2E` を dispatch し、正確な workflow run を poll し、artifact をダウンロードし、Telegram report を出力する。
- Maintainers は GitHub Actions から手動の `NPM Telegram Beta E2E` workflow を通じて同じ post-publish check を実行できる。これは意図的に manual-only であり、すべての merge で実行されるわけではない。
- Maintainer release automation は preflight-then-promote を使うようになった:
  - 実際の npm publish には、成功した npm `preflight_run_id` が必要である
  - 実際の npm publish は、成功した preflight run と同じ `main` または `release/YYYY.M.D` branch から dispatch する必要がある
  - stable npm releases はデフォルトで `beta` になる
  - stable npm publish は workflow input によって明示的に `latest` を target にできる
  - token-based npm dist-tag mutation は現在、security のために `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` にある。`npm dist-tag add` は引き続き `NPM_TOKEN` を必要とする一方、public repo は OIDC-only publish を保つためである
  - public `macOS Release` は validation-only である。tag が release branch 上にのみ存在し、workflow が `main` から dispatch される場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の private mac publish には、成功した private mac `preflight_run_id` と `validate_run_id` が必要である
  - 実際の publish paths は、準備済み artifacts を再ビルドするのではなく promote する
- `YYYY.M.D-N` のような stable correction releases では、post-publish verifier は同じ temp-prefix upgrade path で `YYYY.M.D` から `YYYY.M.D-N` へのアップグレードもチェックするため、release corrections が古い global installs を base stable payload のまま静かに残すことはできない
- npm release preflight は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` payload の両方が含まれていない限り fail closed するため、空の browser dashboard を再び出荷しない
- Post-publish verification は、公開済み plugin entrypoints と package metadata が installed registry layout に存在することもチェックする。plugin runtime payloads が欠落した release は postpublish verifier に失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は candidate update tarball に対する npm pack `unpackedSize` budget も強制するため、installer e2e は release publish path の前に偶発的な pack bloat を検出する
- リリース作業が CI planning、extension timing manifests、または extension test matrices に触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` から planner-owned `plugin-prerelease-extension-shard` matrix outputs を再生成してレビューし、release notes が古い CI layout を説明しないようにする
- Stable macOS release readiness には updater surfaces も含まれる:
  - GitHub release には、packaged `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - publish 後、`main` 上の `appcast.xml` は新しい stable zip を指している必要がある。private macOS publish workflow はそれを自動的に commit するか、direct push がブロックされている場合は appcast PR を開く
  - packaged app は、その release version に対する canonical Sparkle build floor 以上の non-debug bundle id、空でない Sparkle feed URL、`CFBundleVersion` を維持する必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターが 1 つのエントリポイントからすべてのプレリリーステストを開始する方法です。動きの速いブランチ上で固定コミットの証明を行う場合は、ヘルパーを使用して、すべての子ワークフローが対象 SHA に固定された一時ブランチから実行されるようにします。

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` をプッシュし、そのブランチから `ref=<sha>` で `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証してから、一時ブランチを削除します。これにより、誤って新しい `main` の子実行を証明してしまうことを避けられます。

リリースブランチまたはタグの検証では、信頼済みの `main` ワークフロー ref から実行し、リリースブランチまたはタグを `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

このワークフローは対象 ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備します。また、`release_profile=full` かつ `rerun_group=all` の場合、または `release_package_spec` か `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後 `OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA を含む Package Acceptance、QA Lab パリティ、live Matrix、live Telegram に展開されます。完全な実行が受け入れ可能なのは、`Full Release Validation` サマリーで `normal_ci` と `release_checks` が成功している場合だけです。full/all モードでは、`npm_telegram` 子も成功している必要があります。full/all 以外では、公開済みの `release_package_spec` または `npm_telegram_package_spec` が提供されていない限りスキップされます。最終検証サマリーには各子実行の最遅ジョブテーブルが含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。完全なステージマトリクス、正確なワークフロージョブ名、stable と full プロファイルの違い、アーティファクト、焦点を絞った再実行ハンドルについては、[完全なリリース検証](/ja-JP/reference/full-release-validation) を参照してください。子ワークフローは、対象 `ref` が古いリリースブランチやタグを指している場合でも、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。個別の Full Release Validation ワークフロー ref 入力はありません。ワークフロー実行 ref を選ぶことで、信頼済みハーネスを選択してください。動いている `main` 上で正確なコミット証明を行うために `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使って固定済みの一時ブランチを作成します。

live/プロバイダーの範囲を選ぶには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: minimum に加えて、リリース承認用の安定プロバイダー/バックエンドカバレッジ
- `full`: stable に加えて、広範な助言的プロバイダー/メディアカバレッジ

リリースをブロックするレーンが green で、昇格前に網羅的な live/E2E、Docker リリースパス、境界付きの公開済みアップグレードサバイバー sweep を実行したい場合は、`stable` とともに `run_release_soak=true` を使用します。その sweep は、最新 4 つの stable パッケージに加えて、固定済みの `2026.4.23` と `2026.5.2` ベースライン、さらに古い `2026.4.15` カバレッジを対象にし、重複ベースラインを削除したうえで、各ベースラインを個別の Docker ランナージョブにシャード化します。`full` は `run_release_soak=true` を含意します。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使って対象 ref を一度 `release-package-under-test` として解決し、soak 実行時にクロス OS、Package Acceptance、リリースパス Docker チェックでそのアーティファクトを再利用します。これにより、すべてのパッケージ向けボックスが同じバイト列を使い、パッケージビルドの繰り返しを避けられます。beta がすでに npm に公開されている場合は、`release_package_spec=openclaw@YYYY.M.D-beta.N` を設定して、リリースチェックが出荷済みパッケージを一度だけダウンロードし、`dist/build-info.json` からビルド元 SHA を抽出し、そのアーティファクトをクロス OS、Package Acceptance、リリースパス Docker、パッケージ Telegram レーンで再利用するようにします。クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.4` を使用します。このレーンは、最も遅いデフォルトモデルをベンチマークするのではなく、パッケージインストール、オンボーディング、Gateway 起動、live agent の 1 ターンを証明するためです。より広い live プロバイダーマトリクスは、モデル固有のカバレッジの場所として残ります。

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

焦点を絞った修正の後、最初の再実行として full umbrella を使用しないでください。1 つのボックスが失敗した場合は、次の証明に失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用します。修正が共有リリースオーケストレーションを変更した場合、または以前の全ボックス証拠を stale にした場合にのみ、full umbrella を再度実行します。umbrella の最終検証は、記録された子ワークフロー実行 ID を再チェックするため、子ワークフローが正常に再実行された後は、失敗した親ジョブ `Verify full validation` だけを再実行します。

境界付きのリカバリーには、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常 CI 子のみを実行し、`plugin-prerelease` はリリース専用 Plugin 子のみを実行し、`release-checks` はすべてのリリースボックスを実行します。より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。焦点を絞った `npm-telegram` 再実行には `release_package_spec` または `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行は、release-checks パッケージアーティファクトを使用します。焦点を絞ったクロス OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/スイートフィルターを追加できます。QA release-check の失敗は助言的です。QA のみの失敗はリリース検証をブロックしません。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に changed スコープをバイパスし、リリース候補に対して通常のテストグラフを強制します。Linux Node シャード、バンドル済み Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n です。

このボックスは「ソースツリーが完全な通常テストスイートに合格したか」に答えるために使用します。これはリリースパスのプロダクト検証とは同じではありません。保持する証拠:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確な対象 SHA 上で green の `CI` 実行
- 回帰調査時の CI ジョブからの失敗または遅いシャード名
- 実行のパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定的な通常 CI は必要だが、Docker、QA Lab、live、クロス OS、またはパッケージボックスが不要な場合にのみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` を通じた `OpenClaw Release Checks` と、リリースモードの `install-smoke` ワークフロー内にあります。これは、ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには以下が含まれます。

- 遅い Bun グローバルインストールスモークを有効にした完全なインストールスモーク
- 対象 SHA によるルート Dockerfile スモークイメージの準備/再利用。QR、root/gateway、installer/Bun スモークジョブは個別の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル済み Plugin インストール/アンインストールレーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- リリースチェックに live スイートが含まれる場合の live/E2E プロバイダースイートと Docker live モデルカバレッジ

再実行の前に Docker アーティファクトを使用してください。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。焦点を絞ったリカバリーには、すべてのリリースチャンクを再実行する代わりに、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これはエージェント的な動作とチャネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには以下が含まれます。

- agentic parity pack を使用して OpenAI 候補レーンを Opus 4.6 ベースラインと比較する mock パリティレーン
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI 認証情報リースを使用する live Telegram QA レーン
- リリーステレメトリーに明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

このボックスは「リリースが QA シナリオと live チャネルフローで正しく動作するか」に答えるために使用します。リリース承認時には、パリティ、Matrix、Telegram レーンのアーティファクト URL を保持してください。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージボックスは、インストール可能プロダクトのゲートです。これは `Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。このリゾルバーは、候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref とは別に保持します。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を、選択された `workflow_ref` ハーネスで pack
- `source=url`: 必須の `package_sha256` を指定して HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、移行、更新、設定済み認証の更新再起動、ライブ ClawHub skill インストール、古い Plugin 依存関係のクリーンアップ、オフライン Plugin フィクスチャ、Plugin 更新、Telegram パッケージ QA を、同じ解決済み tarball に対して維持します。ブロッキングリリースチェックは、デフォルトで公開済み最新パッケージのベースラインを使用します。`run_release_soak=true` または `release_profile=full` は、`2026.4.23` から `latest` までのすべての安定版 npm 公開済みベースラインに、報告済み issue フィクスチャを加えたものへ拡張します。すでに出荷済みの候補には `source=npm` で Package Acceptance を使用し、公開前の SHA に裏付けられたローカル npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前は Parallels が必要だったパッケージ/更新カバレッジの大半を置き換える GitHub ネイティブな手段です。OS 固有のオンボーディング、インストーラー、プラットフォーム挙動には Cross-OS リリースチェックが引き続き重要ですが、パッケージ/更新のプロダクト検証では Package Acceptance を優先してください。

更新と Plugin 検証の正規チェックリストは [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) です。Plugin のインストール/更新、doctor クリーンアップ、公開済みパッケージ移行の変更を、どのローカル、Docker、Package Acceptance、またはリリースチェックレーンで証明するかを判断するときに使用してください。すべての安定版 `2026.4.23+` パッケージからの包括的な公開済み更新移行は、Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

従来の package-acceptance の寛容さは、意図的に期限付きです。`2026.4.25` までのパッケージでは、すでに npm に公開済みのメタデータ不足に対して互換性パスを使用できます。tarball に含まれない非公開 QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落したパッチファイル、永続化されていない `update.channel`、従来の Plugin インストール記録場所、マーケットプレイスのインストール記録永続化の欠落、`plugins update` 中の config メタデータ移行が対象です。公開済みの `2026.4.26` パッケージでは、すでに出荷されたローカルビルドメタデータのスタンプファイルについて警告が出る場合があります。それ以降のパッケージは、現代的なパッケージ契約を満たす必要があります。同じ不足はリリース検証で失敗になります。

リリース上の問いが実際にインストール可能なパッケージに関するものなら、より広い Package Acceptance プロファイルを使用してください。

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

- `smoke`: パッケージのインストール/チャンネル/エージェント、Gateway ネットワーク、config 再読み込みレーンのクイックチェック
- `package`: インストール/更新/再起動/Plugin パッケージ契約に加え、ライブ ClawHub skill インストール証明。これはリリースチェックのデフォルト
- `product`: `package` に MCP チャンネル、cron/サブエージェントのクリーンアップ、OpenAI web search、OpenWebUI を追加
- `full`: OpenWebUI を含む Docker リリースパスチャンク
- `custom`: 集中再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明には、Package Acceptance で `telegram_mode=mock-openai` または `telegram_mode=live-frontier` を有効にしてください。ワークフローは、解決済みの `package-under-test` tarball を Telegram レーンへ渡します。単独の Telegram ワークフローは、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## リリース公開自動化

`OpenClaw Release Publish` は、通常の変更を伴う公開エントリポイントです。リリースに必要な順序で trusted-publisher ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを検証します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で `Plugin NPM Release` をディスパッチします。
5. 同じ scope と SHA で `Plugin ClawHub Release` をディスパッチします。
6. リリースタグ、npm dist-tag、保存済みの `preflight_run_id` で `OpenClaw NPM Release` をディスパッチします。

ベータ公開の例:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

デフォルトの beta dist-tag への安定版公開:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

`latest` への直接の安定版プロモーションは明示的です。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、集中修復または再公開作業にのみ使用してください。選択した Plugin 修復では、`plugin_publish_scope=selected` と `plugins=@openclaw/name` を `OpenClaw Release Publish` に渡すか、OpenClaw パッケージを公開してはならない場合は子ワークフローを直接ディスパッチしてください。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証専用 preflight 用に現在の完全な 40 文字のワークフローブランチコミット SHA も使用できます
- `preflight_only`: 検証/ビルド/パッケージのみなら `true`、実際の公開パスなら `false`
- `preflight_run_id`: 実際の公開パスで必須。ワークフローが成功した preflight 実行から準備済み tarball を再利用するために使います
- `npm_dist_tag`: 公開パス用の npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight 実行 ID。`publish_openclaw_npm=true` の場合に必須
- `npm_dist_tag`: OpenClaw パッケージ用の npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。`selected` は集中修復作業にのみ使用してください
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin のみの修復オーケストレーターとして使用する場合にのみ `false` を設定してください
- `wait_for_clawhub`: デフォルトは `false`。npm の利用可能性が ClawHub サイドカーによってブロックされないようにします。ワークフロー完了に ClawHub 完了を含める必要がある場合にのみ `true` を設定してください

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを伴うチェックでは、解決済みコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: 安定版/デフォルトのリリースチェックで、包括的なライブ/E2E、Docker リリースパス、すべての以降バージョンの upgrade-survivor soak を有効にします。`release_profile=full` によって強制的に有効になります。

ルール:

- 安定版タグと修正タグは、`beta` または `latest` のいずれにも公開できます
- ベータプレリリースタグは、`beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスは、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは、公開前にそのメタデータが継続していることを検証します

## 安定版 npm リリース手順

安定版 npm リリースを切るとき:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、preflight ワークフローの検証専用ドライランに、現在の完全なワークフローブランチコミット SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択し、意図的に直接安定版公開を行う場合にのみ `latest` を選択します
3. 1 つの手動ワークフローで通常の CI に加え、ライブプロンプトキャッシュ、Docker、QA Lab、Matrix、Telegram カバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全なコミット SHA で `Full Release Validation` を実行します
4. 意図的に決定論的な通常のテストグラフのみが必要な場合は、代わりにリリース ref で手動 `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` で `OpenClaw Release Publish` を実行します。これは、OpenClaw npm パッケージをプロモートする前に、外部化された Plugin を npm と ClawHub に公開します
7. リリースが `beta` に着地した場合は、非公開の `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その安定版を `beta` から `latest` にプロモートします
8. リリースを意図的に直接 `latest` に公開し、`beta` も同じ安定版ビルドをすぐに追従させる必要がある場合は、同じ非公開ワークフローを使用して両方の dist-tag を安定版に向けるか、そのスケジュール済み自己修復同期が後で `beta` を移動するのを待ちます

dist-tag の変更は、引き続き `NPM_TOKEN` が必要なため、セキュリティ上の理由から非公開 repo にあります。一方、公開 repo では OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first プロモーションパスの両方が文書化され、オペレーターから見える状態に保たれます。

メンテナーがローカル npm 認証にフォールバックする必要がある場合は、1Password CLI (`op`) コマンドを必ず専用の tmux セッション内で実行してください。メインエージェントシェルから `op` を直接呼び出さないでください。tmux 内に閉じ込めることで、プロンプト、アラート、OTP 処理を観測可能にし、ホストアラートの繰り返しを防げます。

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

メンテナーは実際のランブックに、非公開リリースドキュメント [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) を使用します。

## 関連

- [リリースチャンネル](/ja-JP/install/development-channels)
