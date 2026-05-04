---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名とリリース周期を確認する
summary: リリースレーン、オペレーターチェックリスト、検証ボックス、バージョン命名、リリース周期
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-04T07:04:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
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
- Beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日をゼロ埋めしない
- `latest` は現在昇格済みの安定版 npm リリースを意味する
- `beta` は現在の beta インストール対象を意味する
- 安定版と安定版修正リリースは、デフォルトでは npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にすることも、検証済みの beta ビルドを後で昇格することもできる
- すべての安定版 OpenClaw リリースは npm パッケージと macOS アプリを一緒に出荷する。
  beta リリースは通常、まず npm/パッケージ経路を検証して公開し、
  mac アプリのビルド/署名/公証は明示的に要求されない限り安定版用に予約される

## リリース周期

- リリースは beta 優先で進める
- 安定版は最新の beta が検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切る。
  これにより、リリース検証と修正が `main` 上の新規開発をブロックしない
- beta タグが push または公開された後に修正が必要になった場合、メンテナーは古い beta タグを削除または再作成するのではなく、
  次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用

## リリース担当者チェックリスト

このチェックリストはリリースフローの公開上の形です。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は
メンテナー専用のリリース runbook に残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットが push 済みであることを確認し、
   現在の `main` CI がブランチ作成元として十分に green であることを確認する。
2. 実際のコミット履歴から `/changelog` で `CHANGELOG.md` の最上位セクションを書き直し、
   エントリをユーザー向けに保ち、commit して push し、ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードをレビューする。期限切れの
   互換性は、アップグレード経路が引き続きカバーされる場合のみ削除する。そうでない場合は、
   意図的に保持する理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` 上で直接行わない。
5. 予定タグに必要なすべてのバージョン箇所を更新し、
   `pnpm plugins:sync` を実行して公開可能な Plugin パッケージがリリース
   バージョンと互換性メタデータを共有するようにする。その後、ローカルの決定的な事前確認を実行する:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, and
   `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   検証専用の事前確認として、40 文字の完全なリリースブランチ SHA を使用できる。
   成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA を対象に `Full Release Validation` で
   すべてのプレリリーステストを開始する。これは 4 つの大きなリリーステストボックス、
   Vitest、Docker、QA Lab、Package の単一の手動エントリポイントです。
8. 検証に失敗した場合は、リリースブランチ上で修正し、修正を証明する最小の失敗
   ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル allowlist を再実行する。
   変更範囲によって以前の証拠が古くなる場合のみ、全体の umbrella を再実行する。
9. beta の場合は `vYYYY.M.D-beta.N` をタグ付けし、その後、一致する
   `release/YYYY.M.D` ブランチから `OpenClaw Release Publish` を実行する。これは `pnpm plugins:sync:check` を検証し、
   すべての公開可能な Plugin パッケージをまず npm に公開し、同じ
   セットを ClawPack npm-pack tarball として次に ClawHub へ公開し、その後、一致する dist-tag で
   準備済みの OpenClaw npm 事前確認アーティファクトを昇格する。公開後、
   公開済みの `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して、公開後パッケージ
   受け入れを実行する。push または公開済みのプレリリースに修正が必要な場合は、
   次の一致するプレリリース番号を切る。古い
   プレリリースを削除または書き換えない。
10. 安定版の場合は、検証済みの beta またはリリース候補に必要な
    検証証拠がある場合のみ続行する。安定版 npm 公開も
    `OpenClaw Release Publish` を通し、`preflight_run_id` で
    成功済みの事前確認アーティファクトを再利用する。安定版 macOS リリース準備には、
    パッケージ化された `.zip`, `.dmg`, `.dSYM.zip` と、`main` 上で更新済みの `appcast.xml` も必要です。
11. 公開後、npm 公開後 verifier、公開後チャンネル証拠が必要な場合の任意のスタンドアロン
    published-npm Telegram E2E、必要に応じた dist-tag 昇格、
    一致する完全な `CHANGELOG.md` セクションからの GitHub リリース/プレリリースノート、
    そしてリリース告知
    手順を実行する。

## リリース事前確認

- リリースの事前確認前に `pnpm check:test-types` を実行して、テストの TypeScript がより高速なローカルの `pnpm check` ゲートの外でも対象になるようにする
- リリースの事前確認前に `pnpm check:architecture` を実行して、より広範な import cycle とアーキテクチャ境界チェックが、より高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行して、pack 検証ステップに必要な `dist/*` リリース成果物と Control UI バンドルが存在するようにする
- ルートのバージョン bump 後、タグ付け前に `pnpm plugins:sync` を実行する。これは publish 可能な Plugin パッケージのバージョン、OpenClaw peer/API 互換性メタデータ、build メタデータ、Plugin changelog スタブを core リリースバージョンに合わせて更新する。`pnpm plugins:sync:check` は変更を加えないリリースガードであり、このステップを忘れていると publish ワークフローは registry を変更する前に失敗する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行して、すべてのリリース前テストボックスを単一のエントリポイントから起動する。これは branch、tag、または完全な commit SHA を受け取り、手動 `CI` を dispatch し、install smoke、package acceptance、Docker リリースパス suite、live/E2E、OpenWebUI、QA Lab parity、Matrix、Telegram lane 用に `OpenClaw Release Checks` を dispatch する。`release_profile=full` と `rerun_group=all` では、release checks からの `release-package-under-test` artifact に対して package Telegram E2E も実行する。同じ Telegram E2E で publish 済み npm パッケージも証明する必要がある場合は、publish 後に `npm_telegram_package_spec` を指定する。Package Acceptance が SHA から build された artifact ではなく出荷済み npm パッケージに対して package/update matrix を実行する必要がある場合は、publish 後に `package_acceptance_package_spec` を指定する。Telegram E2E を強制せずに、private evidence report で検証が publish 済み npm パッケージに一致することを証明する必要がある場合は、`evidence_package_spec` を指定する。例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を続けながら package candidate の side-channel 証明が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` harness で信頼済みの `package_ref` branch/tag/SHA を pack するには `source=ref` を使う。必須 SHA-256 付きの HTTPS tarball には `source=url` を使う。別の GitHub Actions run が upload した tarball には `source=artifact` を使う。このワークフローは candidate を `package-under-test` に解決し、その tarball に対して Docker E2E release scheduler を再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対する Telegram QA も実行できる。選択された Docker lane に `published-upgrade-survivor` が含まれる場合、package artifact が candidate になり、`published_upgrade_survivor_baseline` が publish 済み baseline を選択する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的な profile:
  - `smoke`: install/channel/agent、gateway network、config reload lane
  - `package`: OpenWebUI や live ClawHub を含まない artifact-native package/update/plugin lane
  - `product`: package profile に MCP channel、cron/subagent cleanup、OpenAI web search、OpenWebUI を加えたもの
  - `full`: OpenWebUI 付きの Docker リリースパス chunk
  - `custom`: focused rerun 用の正確な `docker_lanes` 選択
- リリース candidate に対する通常の full CI coverage だけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI dispatch は changed scoping を bypass し、Linux Node shard、bundled-plugin shard、channel contract、Node 22 互換性、`check`、`check-additional`、build smoke、docs check、Python skills、Windows、macOS、Android、Control UI i18n lane を強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリース telemetry を検証するときは `pnpm qa:otel:smoke` を実行する。これは local OTLP/HTTP receiver 経由で QA-lab を実行し、Opik、Langfuse、その他の外部 collector を必要とせずに、export された trace span name、bounded attribute、content/identifier redaction を検証する。
- タグ付きリリースのたびに `pnpm release:check` を実行する
- tag が存在した後、変更を伴う publish sequence には `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` から dispatch し（main から到達可能な tag を publish する場合は `main`）、release tag と成功した OpenClaw npm `preflight_run_id` を渡し、意図的に focused repair を実行している場合を除き、default Plugin publish scope の `all-publishable` を維持する。このワークフローは Plugin npm publish、Plugin ClawHub publish、OpenClaw npm publish を直列化し、外部化された plugins より先に core パッケージが publish されないようにする。
- Release checks は現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab mock parity lane に加えて、高速な live Matrix profile と Telegram QA lane も実行する。live lane は `qa-live-shared` environment を使い、Telegram は Convex CI credential lease も使う。full Matrix transport、media、E2EE inventory を並列で実行したい場合は、手動の `QA-Lab - All Lanes` ワークフローを `matrix_profile=all` と `matrix_shards=true` で実行する。
- Cross-OS install と upgrade runtime validation は、再利用可能ワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す public `OpenClaw Release Checks` と `Full Release Validation` の一部である
- この分割は意図的なもの: 実際の npm release path は短く、決定的で、artifact-focused に保ち、遅い live check は専用の lane に置くことで、publish を停滞またはブロックしないようにする
- secret を含む release check は、ワークフロー logic と secrets を制御された状態に保つため、`Full Release Validation` 経由または `main`/release workflow ref から dispatch する
- `OpenClaw Release Checks` は、resolved commit が OpenClaw branch または release tag から到達可能である限り、branch、tag、または完全な commit SHA を受け取る
- `OpenClaw NPM Release` の validation-only preflight は、push 済み tag を要求せず、現在の完全な 40 文字 workflow-branch commit SHA も受け取る
- その SHA path は validation-only であり、実際の publish に昇格できない
- SHA mode では、workflow は package metadata check のためだけに `v<package.json version>` を合成する。実際の publish には引き続き実際の release tag が必要である
- どちらのワークフローも実際の publish と promotion path は GitHub-hosted runner 上に保ち、変更を伴わない validation path ではより大きな Blacksmith Linux runner を使える
- そのワークフローは、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方の workflow secret を使って
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を実行する
- npm release preflight は、別の release checks lane を待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応する beta/correction tag）を実行する
- npm publish 後に
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応する beta/correction version）を実行して、fresh temp prefix で publish 済み registry install path を検証する
- beta publish 後に `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  を実行して、共有の lease 済み Telegram credential pool を使い、publish 済み npm パッケージに対して installed-package onboarding、Telegram setup、実際の Telegram E2E を検証する。ローカル maintainer の単発実行では Convex vars を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` env credentials を直接渡してもよい。
- maintainer machine から full post-publish beta smoke を実行するには、`pnpm release:beta-smoke -- --beta betaN` を使う。この helper は Parallels npm update/fresh-target validation を実行し、`NPM Telegram Beta E2E` を dispatch し、正確な workflow run を poll し、artifact を download して Telegram report を出力する。
- Maintainer は、GitHub Actions から手動の `NPM Telegram Beta E2E` ワークフロー経由で同じ post-publish check を実行できる。これは意図的に manual-only であり、すべての merge で実行されるわけではない。
- Maintainer release automation は現在 preflight-then-promote を使う:
  - 実際の npm publish には成功した npm `preflight_run_id` が必要
  - 実際の npm publish は、成功した preflight run と同じ `main` または `release/YYYY.M.D` branch から dispatch する必要がある
  - stable npm release の default は `beta`
  - stable npm publish は workflow input で明示的に `latest` を target にできる
  - token-based npm dist-tag mutation は現在、security のため `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` にある。`npm dist-tag add` には引き続き `NPM_TOKEN` が必要であり、public repo は OIDC-only publish を維持するためである
  - public `macOS Release` は validation-only である。tag が release branch 上にのみ存在し、workflow を `main` から dispatch する場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の private mac publish には、成功した private mac `preflight_run_id` と `validate_run_id` が必要
  - 実際の publish path は、準備済み artifact を再 build せずに promote する
- `YYYY.M.D-N` のような stable correction release では、post-publish verifier は `YYYY.M.D` から `YYYY.M.D-N` への同じ temp-prefix upgrade path も check し、release correction が古い global install を base stable payload のまま静かに残さないようにする
- npm release preflight は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` payload の両方が含まれていない限り fail closed するため、空の browser dashboard を再び出荷しない
- Post-publish verification は、publish 済み Plugin entrypoint と package metadata が installed registry layout に存在することも check する。Plugin runtime payload が欠落したまま出荷される release は postpublish verifier に失敗し、`latest` に promote できない。
- `pnpm test:install:smoke` は candidate update tarball に対して npm pack `unpackedSize` budget も強制するため、installer e2e は release publish path の前に偶発的な pack bloat を検出できる
- release 作業で CI planning、extension timing manifest、または extension test matrix に触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` から planner-owned の `plugin-prerelease-extension-shard` matrix output を regenerate して review し、release note が古い CI layout を説明しないようにする
- Stable macOS release readiness には updater surface も含まれる:
  - GitHub release には最終的に package された `.zip`、`.dmg`、`.dSYM.zip` が含まれる必要がある
  - publish 後、`main` 上の `appcast.xml` は新しい stable zip を指す必要がある
  - package された app は、non-debug bundle id、空でない Sparkle feed URL、その release version の canonical Sparkle build floor 以上の `CFBundleVersion` を維持する必要がある

## リリーステストボックス

`Full Release Validation` は、operator がすべてのリリース前テストを単一のエントリポイントから起動する方法である。動きの速い branch 上で pinned commit proof が必要な場合は、すべての child workflow が target SHA に固定された temporary branch から実行されるように helper を使う:

```bash
pnpm ci:full-release --sha <full-sha>
```

この helper は `release-ci/<sha>-...` を push し、その branch から `ref=<sha>` で `Full Release Validation` を dispatch し、すべての child workflow の `headSha` が target に一致することを検証した後、temporary branch を削除する。これにより、誤って新しい `main` child run を証明することを避けられる。

release branch または tag validation では、信頼済みの `main` workflow ref から実行し、release branch または tag を `ref` として渡す:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

ワークフローはターゲット ref を解決し、手動 `CI` を
`target_ref=<release-ref>` 付きでディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備し、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後、`OpenClaw Release
Checks` は、インストールスモーク、クロス OS リリースチェック、ライブ/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA 付き Package Acceptance、QA Lab パリティ、ライブ Matrix、ライブ Telegram に展開します。完全実行が許容されるのは、`Full Release Validation`
サマリーで `normal_ci` と `release_checks` が成功と表示されている場合だけです。full/all モードでは、`npm_telegram` 子ワークフローも成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が指定されていない限りスキップされます。最終 verifier サマリーには各子実行の最遅ジョブテーブルが含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージマトリクス、正確なワークフロージョブ名、stable プロファイルと full プロファイルの違い、アーティファクト、集中的な再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。
子ワークフローは、`Full Release
Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。これはターゲット `ref` が古いリリースブランチやタグを指している場合も同じです。Full Release Validation 用の別個の workflow-ref 入力はありません。ワークフロー実行 ref を選ぶことで、信頼済みハーネスを選択します。
移動する `main` 上で正確なコミット証跡を得るために `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA は workflow dispatch ref にできないため、固定された一時ブランチを作成するには `pnpm ci:full-release --sha <sha>` を使用します。

ライブ/プロバイダーの範囲を選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/コアのライブおよび Docker パス
- `stable`: リリース承認向けに minimum に stable プロバイダー/バックエンドカバレッジを追加
- `full`: stable に幅広い advisory プロバイダー/メディアカバレッジを追加

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用してターゲット ref を一度だけ `release-package-under-test` として解決し、そのアーティファクトをリリースパス Docker チェックと Package Acceptance の両方で再利用します。これにより、すべてのパッケージ向けボックスが同じバイト列を使用し、パッケージビルドの繰り返しを避けられます。
クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、そうでない場合は `openai/gpt-5.4` を使用します。このレーンは最も遅いデフォルトモデルをベンチマークするのではなく、パッケージインストール、オンボーディング、Gateway 起動、ライブエージェント 1 ターンを証明するものだからです。より広範なライブプロバイダーマトリクスは、引き続きモデル固有カバレッジの場所です。

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

集中的な修正後の最初の再実行として、完全な包括ワークフローを使用しないでください。1 つのボックスが失敗した場合は、次の証跡として、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用します。完全な包括ワークフローを再度実行するのは、その修正が共有リリースオーケストレーションを変更した場合、または以前の全ボックス証跡を古くした場合だけです。包括ワークフローの最終 verifier は記録された子ワークフロー実行 ID を再チェックするため、子ワークフローの再実行が成功した後は、失敗した親ジョブ `Verify full validation` だけを再実行します。

範囲を限定した復旧には、包括ワークフローに `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子ワークフローのみ、`plugin-prerelease` はリリース専用 Plugin 子ワークフローのみ、`release-checks` はすべてのリリースボックスを実行し、より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。
集中的な `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行では、release-checks パッケージアーティファクトを使用します。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に変更スコープをバイパスし、リリース候補に対して通常のテストグラフを強制します。対象は、Linux Node シャード、バンドル Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python Skills、Windows、macOS、Android、Control UI i18n です。

このボックスは「ソースツリーは通常のフルテストスイートを通過したか」に答えるために使用します。リリースパスのプロダクト検証とは同じではありません。保持する証跡:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確なターゲット SHA で緑の `CI` 実行
- リグレッションを調査する際の CI ジョブからの失敗または低速シャード名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースで決定的な通常 CI は必要だが、Docker、QA Lab、ライブ、クロス OS、パッケージボックスが不要な場合のみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` を通じて `OpenClaw Release Checks` 内にあり、さらにリリースモードの `install-smoke` ワークフローにもあります。これはソースレベルのテストだけではなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには以下が含まれます。

- 低速な Bun グローバルインストールスモークを有効にしたフルインストールスモーク
- ターゲット SHA ごとのルート Dockerfile スモークイメージ準備/再利用。QR、root/gateway、installer/Bun スモークジョブは個別の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル Plugin インストール/アンインストールレーン
  `bundled-plugin-install-uninstall-0` から
  `bundled-plugin-install-uninstall-23`
- リリースチェックにライブスイートが含まれる場合のライブ/E2E プロバイダースイートと Docker ライブモデルカバレッジ

再実行の前に Docker アーティファクトを使用します。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。集中的な復旧には、すべてのリリースチャンクを再実行する代わりに、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは agentic な挙動とチャネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには以下が含まれます。

- agentic parity pack を使用して OpenAI 候補レーンを Opus 4.6 ベースラインと比較する mock パリティレーン
- `qa-live-shared` 環境を使用する高速ライブ Matrix QA プロファイル
- Convex CI credential lease を使用するライブ Telegram QA レーン
- リリーステレメトリに明示的なローカル証跡が必要な場合の `pnpm qa:otel:smoke`

このボックスは「リリースは QA シナリオとライブチャネルフローで正しく動作するか」に答えるために使用します。リリースを承認する際は、パリティ、Matrix、Telegram レーンのアーティファクト URL を保持します。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージボックスは、インストール可能プロダクトのゲートです。これは `Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。リゾルバーは候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref とは別に保ちます。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択された `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパック
- `source=url`: 必須の `package_sha256` 付きで HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、
`published_upgrade_survivor_baselines=all-since-2026.4.23`、
`published_upgrade_survivor_scenarios=reported-issues`、および
`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、マイグレーション、更新、古い Plugin 依存関係のクリーンアップ、オフライン Plugin フィクスチャ、Plugin 更新、Telegram パッケージ QA を維持します。アップグレードマトリクスは、`2026.4.23` から `latest` までのすべての stable npm 公開済みベースラインをカバーします。すでに出荷済みの候補には `source=npm` で Package Acceptance を使用し、公開前の SHA 裏付けのあるローカル npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前 Parallels を必要としていたパッケージ/更新カバレッジの大半に対する GitHub ネイティブな置き換えです。クロス OS リリースチェックは、OS 固有のオンボーディング、インストーラー、プラットフォーム挙動に引き続き重要ですが、パッケージ/更新のプロダクト検証では Package Acceptance を優先すべきです。

更新と Plugin 検証の正規チェックリストは[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)です。Plugin のインストール/更新、doctor クリーンアップ、または公開パッケージマイグレーション変更を証明するローカル、Docker、Package Acceptance、またはリリースチェックレーンを決める際に使用します。
すべての stable `2026.4.23+` パッケージからの網羅的な公開済み更新マイグレーションは、Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

レガシー package-acceptance の緩和は、意図的に期限付きです。`2026.4.25` までのパッケージは、すでに npm に公開されたメタデータギャップについて互換パスを使用できます。対象は、tarball にない private QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落したパッチファイル、永続化されていない `update.channel`、レガシー Plugin インストールレコードの場所、マーケットプレイスインストールレコード永続化の欠落、`plugins update` 中の設定メタデータマイグレーションです。公開済みの `2026.4.26` パッケージは、すでに出荷されたローカルビルドメタデータスタンプファイルについて警告する場合があります。それ以降のパッケージは、現代的なパッケージ契約を満たす必要があります。同じギャップはリリース検証で失敗します。

リリース上の問いが実際のインストール可能パッケージに関するものである場合は、より広範な Package Acceptance プロファイルを使用します。

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

- `smoke`: パッケージのクイックインストール/チャネル/エージェント、Gateway ネットワーク、設定
  リロードのレーン
- `package`: ライブ ClawHub なしでのインストール/更新/Plugin パッケージ契約。これは release-check の
  デフォルト
- `product`: `package` に加えて、MCP チャネル、cron/サブエージェントのクリーンアップ、OpenAI web
  search、OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスのチャンク
- `custom`: 集中的な再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの
`package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの
Telegram ワークフローは、公開後チェック用に公開済み npm spec も引き続き受け付けます。

## リリース公開自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントです。これは、
リリースに必要な順序で trusted-publisher ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを検証します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で `Plugin NPM Release` をディスパッチします。
5. 同じスコープと SHA で `Plugin ClawHub Release` をディスパッチします。
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

`latest` へ直接行う安定版昇格は明示的です。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

下位レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、
集中的な修復または再公開作業にのみ使用します。選択した Plugin の修復では、
`plugin_publish_scope=selected` と `plugins=@openclaw/name` を
`OpenClaw Release Publish` に渡すか、OpenClaw パッケージを公開してはいけない場合は
子ワークフローを直接ディスパッチします。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1` のような必須のリリースタグ。`preflight_only=true` の場合は、
  検証専用プリフライト用に現在の完全な 40 文字のワークフローブランチコミット SHA も使用できます
- `preflight_only`: 検証/ビルド/パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスで必須。ワークフローが成功したプリフライト実行から準備済み tarball を再利用するために使います
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` プリフライト実行 id。
  `publish_openclaw_npm=true` の場合に必須です
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。集中的な修復作業にのみ `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin のみの修復オーケストレーターとして使用する場合にのみ `false` を設定します

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを伴うチェックでは、
  解決済みコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。

ルール:

- 安定版タグと修正タグは `beta` または `latest` のいずれかへ公開できます
- ベータプレリリースタグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、プリフライト中に使用したものと同じ `npm_dist_tag` を使う必要があります。
  ワークフローは、公開前にそのメタデータが継続していることを検証します

## 安定版 npm リリース手順

安定版 npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、プリフライトワークフローの検証専用ドライランとして、現在の完全なワークフローブランチコミット SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択します。直接の安定版公開を意図している場合にのみ `latest` を選択します
3. 1 つの手動ワークフローから通常の CI に加えて、ライブプロンプトキャッシュ、Docker、QA Lab、Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全なコミット SHA で `Full Release Validation` を実行します
4. 決定的な通常テストグラフだけが必要な場合は、代わりにリリース ref で手動の `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` で `OpenClaw Release Publish` を実行します。これは OpenClaw npm パッケージを昇格する前に、外部化された Plugin を npm と ClawHub に公開します
7. リリースが `beta` に着地した場合は、非公開の
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使用して、その安定版を `beta` から `latest` へ昇格します
8. リリースを意図的に直接 `latest` へ公開し、`beta` もすぐに同じ安定版ビルドを指すべき場合は、同じ非公開ワークフローを使用して両方の dist-tag を安定版に向けるか、スケジュールされた自己修復同期によって後で `beta` が移動するようにします

dist-tag の変更は、引き続き `NPM_TOKEN` を必要とするため、セキュリティ上の理由で非公開リポジトリにあります。一方、公開リポジトリは OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first 昇格パスの両方が文書化され、オペレーターから見える状態になります。

メンテナーがローカル npm 認証にフォールバックする必要がある場合は、1Password CLI（`op`）コマンドを専用の tmux セッション内でのみ実行します。メインエージェントシェルから `op` を直接呼び出さないでください。tmux 内に保つことで、プロンプト、アラート、OTP 処理を観測可能にし、ホストアラートの繰り返しを防げます。

## 公開参照

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

メンテナーは、実際のランブックには非公開のリリースドキュメント
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリースチャネル](/ja-JP/install/development-channels)
