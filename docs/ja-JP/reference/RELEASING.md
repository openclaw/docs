---
read_when:
    - 公開リリースチャネル定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョンの命名規則とリリース周期を確認しています
summary: リリースレーン、オペレーター用チェックリスト、検証ボックス、バージョン命名、ケイデンス
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-05T01:48:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には 3 つの公開リリースレーンがあります。

- 安定版: 明示的に要求された場合は npm `latest` に、それ以外はデフォルトで npm `beta` に公開されるタグ付きリリース
- ベータ: npm `beta` に公開されるプレリリースタグ
- 開発版: `main` の移動する先頭

## バージョン命名

- 安定版リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- 安定版修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- ベータプレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日をゼロ埋めしない
- `latest` は現在プロモートされている安定版 npm リリースを意味する
- `beta` は現在のベータインストール対象を意味する
- 安定版および安定版修正リリースはデフォルトで npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にすることも、検証済みのベータビルドを後でプロモートすることもできる
- すべての安定版 OpenClaw リリースでは、npm パッケージと macOS アプリを同時に出荷する。
  ベータリリースでは通常、まず npm/パッケージ経路を検証して公開し、
  mac アプリのビルド/署名/公証は、明示的に要求されない限り安定版用に取っておく

## リリース頻度

- リリースはベータ優先で進める
- 安定版は最新ベータが検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切る。
  これにより、リリース検証と修正が `main` 上の新規開発を妨げない
- ベータタグがプッシュまたは公開済みで修正が必要な場合、メンテナーは古いベータタグを削除または再作成するのではなく、
  次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開部分を示します。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は
メンテナー専用のリリースランブックに残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がブランチ元として十分に緑であることを確認する。
2. 実際のコミット履歴から `/changelog` で最上部の `CHANGELOG.md` セクションを書き直し、
   エントリをユーザー向けに保ち、コミットしてプッシュし、ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性記録を確認する。アップグレード経路が引き続きカバーされる場合にのみ期限切れの互換性を削除するか、
   意図的に持ち越す理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` で直接行わない。
5. 意図したタグに必要なすべてのバージョン箇所を更新し、
   `pnpm plugins:sync` を実行して公開可能な Plugin パッケージがリリースバージョンと互換性メタデータを共有するようにし、その後ローカルの決定論的な事前確認を実行する:
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check`、および
   `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   検証専用の事前確認として、40 文字の完全なリリースブランチ SHA を使用できる。
   成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` ですべてのプレリリーステストを開始する。これは 4 つの大きなリリーステストボックス、
   Vitest、Docker、QA Lab、Package のための単一の手動エントリポイントである。
8. 検証が失敗した場合は、リリースブランチ上で修正し、修正を証明する最小の失敗ファイル、
   レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行する。
   変更範囲によって以前の証拠が古くなる場合にのみ、全体の包括実行を再実行する。
9. ベータでは、`vYYYY.M.D-beta.N` をタグ付けし、その後一致する `release/YYYY.M.D` ブランチから
   `OpenClaw Release Publish` を実行する。これは `pnpm plugins:sync:check` を検証し、
   まずすべての公開可能な Plugin パッケージを npm に公開し、次に同じセットを ClawPack npm-pack tarball として ClawHub に公開し、その後一致する dist-tag で準備済みの OpenClaw npm 事前確認アーティファクトをプロモートする。
   公開後、公開された `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して公開後パッケージ受け入れを実行する。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、
   次の一致するプレリリース番号を切る。古いプレリリースを削除または書き換えない。
10. 安定版では、検証済みベータまたはリリース候補に必要な検証証拠が揃った後にのみ続行する。
    安定版 npm 公開も `OpenClaw Release Publish` を通じて行い、
    `preflight_run_id` を介して成功済みの事前確認アーティファクトを再利用する。安定版 macOS リリース準備には、
    パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および `main` 上で更新された `appcast.xml` も必要である。
11. 公開後、npm 公開後検証ツール、公開後のチャンネル証明が必要な場合の任意のスタンドアロン公開 npm Telegram E2E、
    必要に応じた dist-tag プロモーション、一致する完全な `CHANGELOG.md` セクションからの GitHub リリース/プレリリースノート、およびリリース告知手順を実行する。

## リリース事前確認

- リリースのプレフライト前に `pnpm check:test-types` を実行し、テストの TypeScript が高速なローカル `pnpm check` ゲートの外でもカバーされるようにする
- リリースのプレフライト前に `pnpm check:architecture` を実行し、より広範な import cycle とアーキテクチャ境界チェックが高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、pack 検証ステップで期待される `dist/*` リリース成果物と Control UI バンドルが存在するようにする
- ルートのバージョンバンプ後、タグ付け前に `pnpm plugins:sync` を実行する。これにより、公開可能な plugin パッケージのバージョン、OpenClaw peer/API 互換性メタデータ、ビルドメタデータ、plugin changelog スタブが core リリースバージョンに一致するよう更新される。`pnpm plugins:sync:check` は変更を加えないリリースガードであり、このステップを忘れている場合、公開ワークフローは registry の変更前に失敗する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、1つのエントリポイントからすべてのプレリリース test box を開始する。ブランチ、タグ、または完全なコミット SHA を受け取り、手動の `CI` をディスパッチし、install smoke、package acceptance、クロス OS package checks、QA Lab parity、Matrix、Telegram レーンのために `OpenClaw Release Checks` をディスパッチする。安定版/デフォルト実行では、網羅的な live/E2E と Docker リリースパス soak は `run_release_soak=true` の背後に保持され、`release_profile=full` では soak が強制的に有効になる。`release_profile=full` かつ `rerun_group=all` の場合、release checks の `release-package-under-test` 成果物に対して package Telegram E2E も実行する。同じ Telegram E2E で公開済み npm package も証明する必要がある場合は、公開後に `npm_telegram_package_spec` を指定する。Package Acceptance で SHA からビルドされた成果物の代わりに、出荷済み npm package に対して package/update matrix を実行する必要がある場合は、公開後に `package_acceptance_package_spec` を指定する。非公開 evidence report で、Telegram E2E を強制せずに検証が公開済み npm package と一致することを証明する必要がある場合は、`evidence_package_spec` を指定する。例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を継続しながら package candidate のサイドチャネル証明が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使用する。現在の `workflow_ref` harness で信頼済みの `package_ref` ブランチ/タグ/SHA を pack するには `source=ref` を使用する。必須の SHA-256 を伴う HTTPS tarball には `source=url` を使用する。別の GitHub Actions 実行でアップロードされた tarball には `source=artifact` を使用する。ワークフローは candidate を `package-under-test` に解決し、その tarball に対して Docker E2E release scheduler を再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対して Telegram QA を実行できる。選択された Docker レーンに `published-upgrade-survivor` が含まれる場合、package artifact が candidate となり、`published_upgrade_survivor_baseline` が公開済み baseline を選択する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: install/channel/agent、Gateway network、config reload レーン
  - `package`: OpenWebUI や live ClawHub を伴わない artifact-native package/update/plugin レーン
  - `product`: package プロファイルに加え、MCP channels、cron/subagent cleanup、OpenAI web search、OpenWebUI
  - `full`: OpenWebUI を伴う Docker release-path chunks
  - `custom`: 集中的な再実行のための正確な `docker_lanes` 選択
- リリース candidate に対して通常の完全な CI カバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは changed scoping をバイパスし、Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリース telemetry を検証する場合は `pnpm qa:otel:smoke` を実行する。これは local OTLP/HTTP receiver を通じて QA-lab を実行し、Opik、Langfuse、または別の外部 collector を必要とせずに、export された trace span names、bounded attributes、content/identifier redaction を検証する。
- タグ付きリリースの前には毎回 `pnpm release:check` を実行する
- タグが存在した後、変更を伴う公開シーケンスのために `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` からディスパッチするか、main から到達可能なタグを公開する場合は `main` からディスパッチし、リリースタグと成功した OpenClaw npm `preflight_run_id` を渡す。意図的に集中的な修復を実行しているのでない限り、デフォルトの plugin publish scope `all-publishable` を維持する。このワークフローは plugin npm publish、plugin ClawHub publish、OpenClaw npm publish を直列化し、外部化された plugins より前に core package が公開されないようにする。
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab mock parity レーンに加え、高速な live Matrix プロファイルと Telegram QA レーンも実行する。live レーンは `qa-live-shared` 環境を使用し、Telegram は Convex CI credential leases も使用する。Matrix transport、media、E2EE inventory を並列で完全に確認したい場合は、`matrix_profile=all` と `matrix_shards=true` を指定して手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS install と upgrade runtime validation は、public `OpenClaw Release Checks` と `Full Release Validation` の一部であり、これらは reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの。実際の npm リリースパスを短く、決定的で、artifact-focused に保ち、遅い live checks は独自レーンに置くことで、公開を停滞またはブロックしないようにする
- secret を含むリリースチェックは、`Full Release Validation` を通じて、または `main`/release workflow ref からディスパッチし、workflow logic と secrets が制御された状態を保つ
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け取る
- `OpenClaw NPM Release` の validation-only preflight も、push 済みタグを必要とせずに、現在の完全な 40 文字の workflow-branch commit SHA を受け取る
- その SHA パスは validation-only であり、実際の publish へ昇格できない
- SHA モードでは、workflow は package metadata check のためだけに `v<package.json version>` を合成する。実際の publish には引き続き実際の release tag が必要
- 両方の workflow は実際の publish と promotion path を GitHub-hosted runners 上に保持し、変更を加えない validation path ではより大きな Blacksmith Linux runners を使用できる
- その workflow は、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方の workflow secrets を使用して `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行する
- npm release preflight は、別の release checks lane を待機しなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応する beta/correction tag）を実行する
- npm publish 後に `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応する beta/correction version）を実行し、新しい一時 prefix で公開済み registry install path を検証する
- beta publish 後に `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行し、共有 leased Telegram credential pool を使用して、公開済み npm package に対する installed-package オンボーディング、Telegram setup、実際の Telegram E2E を検証する。ローカル maintainer の単発実行では Convex vars を省略し、3つの `OPENCLAW_QA_TELEGRAM_*` env credentials を直接渡してもよい。
- maintainer machine から完全な post-publish beta smoke を実行するには、`pnpm release:beta-smoke -- --beta betaN` を使用する。この helper は Parallels npm update/fresh-target validation を実行し、`NPM Telegram Beta E2E` をディスパッチし、正確な workflow run を polling し、artifact をダウンロードし、Telegram report を出力する。
- maintainer は、GitHub Actions から手動の `NPM Telegram Beta E2E` ワークフローを通じて同じ post-publish check を実行できる。これは意図的に manual-only であり、すべての merge では実行されない。
- maintainer release automation は現在、preflight-then-promote を使用する:
  - 実際の npm publish は成功した npm `preflight_run_id` を通過している必要がある
  - 実際の npm publish は、成功した preflight run と同じ `main` または `release/YYYY.M.D` ブランチからディスパッチされる必要がある
  - stable npm releases のデフォルトは `beta`
  - stable npm publish は workflow input により明示的に `latest` を target にできる
  - token-based npm dist-tag mutation は現在、セキュリティのため `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` に置かれている。`npm dist-tag add` は引き続き `NPM_TOKEN` を必要とする一方で、public repo は OIDC-only publish を維持するため
  - public `macOS Release` は validation-only。タグが release branch 上にのみ存在するが workflow が `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の private mac publish は、成功した private mac `preflight_run_id` と `validate_run_id` を通過している必要がある
  - 実際の publish paths は、再ビルドせず prepared artifacts を promote する
- `YYYY.M.D-N` のような stable correction releases では、post-publish verifier は `YYYY.M.D` から `YYYY.M.D-N` への同じ temp-prefix upgrade path もチェックし、release corrections によって古い global installs が base stable payload のまま密かに残らないようにする
- npm release preflight は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` payload の両方が含まれていない限り fail closed になる。これにより、空の browser dashboard を再び出荷しないようにする
- Post-publish verification は、公開済み plugin entrypoints と package metadata が installed registry layout に存在することもチェックする。plugin runtime payloads が欠けたリリースは postpublish verifier に失敗し、`latest` に promote できない。
- `pnpm test:install:smoke` は candidate update tarball に対して npm pack `unpackedSize` budget も強制するため、installer e2e は release publish path の前に accidental pack bloat を検出する
- リリース作業が CI planning、extension timing manifests、または extension test matrices に触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` から planner-owned `plugin-prerelease-extension-shard` matrix outputs を再生成してレビューし、release notes が古い CI layout を説明しないようにする
- stable macOS release readiness には updater surfaces も含まれる:
  - GitHub release には packaged `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - publish 後、`main` 上の `appcast.xml` は新しい stable zip を指している必要がある
  - packaged app は non-debug bundle id、空でない Sparkle feed URL、その release version に対する canonical Sparkle build floor 以上の `CFBundleVersion` を維持する必要がある

## Release test boxes

`Full Release Validation` は、operators が1つのエントリポイントからすべてのプレリリーステストを開始する方法である。変化の速いブランチで pinned commit proof を得るには、すべての child workflow が target SHA に固定された temporary branch から実行されるように helper を使用する:

```bash
pnpm ci:full-release --sha <full-sha>
```

helper は `release-ci/<sha>-...` を push し、その branch から `ref=<sha>` で `Full Release Validation` をディスパッチし、すべての child workflow の `headSha` が target と一致することを検証してから temporary branch を削除する。これにより、誤って新しい `main` の child run を証明してしまうことを避けられる。

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

ワークフローはターゲット ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備し、`release_profile=full` で `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後、`OpenClaw Release Checks` はインストールスモーク、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA を含む Package Acceptance、QA Lab パリティ、ライブ Matrix、ライブ Telegram へ展開します。フル実行が許容されるのは、`Full Release Validation` サマリーで `normal_ci` と `release_checks` が成功と表示されている場合だけです。full/all モードでは、`npm_telegram` 子も成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が提供されていない限りスキップされます。最終 verifier サマリーには各子実行の最遅ジョブ表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージマトリクス、正確なワークフロージョブ名、stable プロファイルと full プロファイルの違い、アーティファクト、集中 rerun ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation) を参照してください。
子ワークフローは、ターゲット `ref` が古いリリースブランチやタグを指している場合でも、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。個別の Full Release Validation workflow-ref 入力はありません。ワークフロー実行 ref を選択することで、信頼済みハーネスを選択してください。移動する `main` 上の正確なコミット証明に `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使用してピン留めされた一時ブランチを作成してください。

live/provider の広さを選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: minimum にリリース承認用の stable provider/backend カバレッジを追加
- `full`: stable に広範な advisory provider/media カバレッジを追加

リリースブロック対象のレーンが green で、昇格前に網羅的な live/E2E、Docker リリースパス、all-since-2026.4.23 upgrade-survivor sweep を実行したい場合は、`stable` とともに `run_release_soak=true` を使用します。`full` は `run_release_soak=true` を含意します。

`OpenClaw Release Checks` は信頼済みワークフロー ref を使用してターゲット ref を一度だけ `release-package-under-test` として解決し、soak 実行時に cross-OS、Package Acceptance、release-path Docker チェックでそのアーティファクトを再利用します。これにより、すべてのパッケージ向け box が同じバイト列を使用し、パッケージビルドの反復を避けられます。cross-OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.4` を使用します。このレーンは最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回のライブ agent turn を証明するためです。より広範な live provider マトリクスは、モデル固有カバレッジの場所のままです。

リリースステージに応じて、これらのバリアントを使用します。

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

focused fix 後の最初の rerun として full umbrella を使用しないでください。1 つの box が失敗した場合は、次の証明に、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用します。full umbrella を再度実行するのは、修正が共有リリースオーケストレーションを変更した場合、または以前の全 box エビデンスが古くなった場合だけです。umbrella の最終 verifier は記録された子ワークフロー実行 ID を再チェックするため、子ワークフローが正常に rerun された後は、失敗した親ジョブ `Verify full validation` だけを rerun します。

範囲を限定したリカバリーでは、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子のみを実行、`plugin-prerelease` はリリース専用 plugin 子のみを実行、`release-checks` はすべてのリリース box を実行し、より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。focused `npm-telegram` rerun には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行では release-checks パッケージアーティファクトを使用します。focused cross-OS rerun では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/suite filter を追加できます。QA release-check の失敗は advisory です。QA のみの失敗はリリース検証をブロックしません。

### Vitest

Vitest box は手動 `CI` 子ワークフローです。手動 CI は意図的に changed scoping をバイパスし、リリース候補に対して通常のテストグラフを強制します。Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android、Control UI i18n です。

この box は「ソースツリーは通常のフルテストスイートに合格したか」に答えるために使用します。これは release-path product validation と同じではありません。保持すべきエビデンス:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確なターゲット SHA で green になった `CI` 実行
- 回帰調査時の CI ジョブからの失敗または遅い shard 名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに deterministic normal CI が必要で、Docker、QA Lab、live、cross-OS、package box が不要な場合にのみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box は、`openclaw-live-and-e2e-checks-reusable.yml` と release-mode `install-smoke` ワークフローを通じて、`OpenClaw Release Checks` 内にあります。ソースレベルのテストだけではなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには次が含まれます。

- 遅い Bun global install smoke を有効にしたフルインストールスモーク
- ターゲット SHA による root Dockerfile smoke image の準備/再利用。QR、root/gateway、installer/Bun smoke ジョブは個別の install-smoke shards として実行
- repository E2E レーン
- release-path Docker チャンク: `core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- split bundled plugin install/uninstall レーン
  `bundled-plugin-install-uninstall-0` から
  `bundled-plugin-install-uninstall-23`
- release checks に live suites が含まれる場合の live/E2E provider suites と Docker live model カバレッジ

rerun の前に Docker アーティファクトを使用してください。release-path スケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、scheduler plan JSON、rerun コマンドを含む `.artifacts/docker-tests/` をアップロードします。focused recovery では、すべてのリリースチャンクを rerun する代わりに、reusable live/E2E workflow で `docker_lanes=<lane[,lane]>` を使用します。生成された rerun コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker image 入力が含まれるため、失敗したレーンは同じ tarball と GHCR images を再利用できます。

### QA Lab

QA Lab box も `OpenClaw Release Checks` の一部です。これは Vitest や Docker パッケージ機構とは別の、agentic behavior と channel-level のリリースゲートです。

リリース QA Lab カバレッジには次が含まれます。

- agentic parity pack を使用して OpenAI candidate lane を Opus 4.6 baseline と比較する mock parity lane
- `qa-live-shared` environment を使用する fast live Matrix QA profile
- Convex CI credential leases を使用する live Telegram QA lane
- リリース telemetry に明示的な local proof が必要な場合の `pnpm qa:otel:smoke`

この box は「リリースは QA シナリオと live channel flows で正しく動作するか」に答えるために使用します。リリース承認時には、parity、Matrix、Telegram レーンのアーティファクト URL を保持してください。Full Matrix カバレッジは、デフォルトの release-critical lane ではなく、手動の sharded QA-Lab run として引き続き利用できます。

### Package

Package box は installable-product gate です。これは `Package Acceptance` と resolver `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。resolver は candidate を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離したままにします。

サポートされる candidate sources:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択された `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を pack
- `source=url`: 必須の `package_sha256` を伴う HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、
`telegram_mode=mock-openai` とともに、`source=artifact` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して migration、update、stale plugin dependency cleanup、offline plugin fixtures、plugin update、Telegram package QA を維持します。blocking release checks は、デフォルトの latest published package baseline を使用します。`run_release_soak=true` または `release_profile=full` は、`2026.4.23` から `latest` までのすべての stable npm-published baseline と reported-issue fixtures に拡張されます。すでに shipped candidate には `source=npm` の Package Acceptance を使用し、publish 前の SHA-backed local npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前 Parallels が必要だった package/update カバレッジの大部分に対する GitHub-native replacement です。cross-OS release checks は OS-specific onboarding、installer、platform behavior のために引き続き重要ですが、package/update product validation は Package Acceptance を優先すべきです。

update と plugin validation の標準チェックリストは [update と plugins のテスト](/ja-JP/help/testing-updates-plugins) です。plugin install/update、doctor cleanup、published-package migration change を証明する local、Docker、Package Acceptance、release-check lane を判断するときに使用してください。すべての stable `2026.4.23+` package からの exhaustive published update migration は、Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

legacy package-acceptance leniency は意図的に time boxed されています。`2026.4.25` までのパッケージは、npm にすでに公開済みの metadata gaps に対する compatibility path を使用できます。tarball にない private QA inventory entries、欠落した `gateway install --wrapper`、tarball-derived git fixture 内の欠落した patch files、永続化されない `update.channel`、legacy plugin install-record locations、欠落した marketplace install-record persistence、`plugins update` 中の config metadata migration です。公開済みの `2026.4.26` package は、すでに出荷済みの local build metadata stamp files に対して警告する場合があります。それ以降のパッケージは modern package contracts を満たす必要があります。同じ gaps は release validation で失敗します。

リリースに関する問いが実際のインストール可能なパッケージに関するものである場合は、より広範な Package Acceptance プロファイルを使用します。

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

- `smoke`: すばやいパッケージのインストール/チャンネル/エージェント、gateway ネットワーク、config
  reload レーン
- `package`: ライブ ClawHub を使わないインストール/更新/Plugin パッケージ契約。これは release-check の
  デフォルト
- `product`: `package` に加えて MCP チャンネル、cron/サブエージェントのクリーンアップ、OpenAI web
  search、OpenWebUI
- `full`: OpenWebUI を含む Docker release-path チャンク
- `custom`: フォーカスした再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの
`package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの
Telegram ワークフローは、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## リリース公開の自動化

`OpenClaw Release Publish` は、通常の変更を伴う公開エントリポイントです。これは、リリースに必要な順序で trusted-publisher ワークフローを調整します。

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

`latest` への Stable promotion は明示的です:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、フォーカスした修復または再公開作業にのみ使用します。選択した Plugin の修復では、`OpenClaw Release Publish` に `plugin_publish_scope=selected` と `plugins=@openclaw/name` を渡すか、OpenClaw パッケージを公開してはならない場合は子ワークフローを直接 dispatch します。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます:

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証のみの preflight 用に、現在の
  40 文字の完全な workflow-branch commit SHA も使用できます
- `preflight_only`: 検証/ビルド/パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスで必須。ワークフローが成功した preflight 実行から準備済み tarball を再利用するために使用します
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます:

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight run id。
  `publish_openclaw_npm=true` の場合は必須
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。フォーカスした修復作業にのみ `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin のみの修復オーケストレーターとして使用する場合にのみ `false` に設定します

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます:

- `ref`: 検証するブランチ、タグ、または完全な commit SHA。シークレットを含むチェックでは、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: stable/default リリースチェックで、網羅的な live/E2E、Docker release-path、all-since upgrade-survivor soak を有効にします。`release_profile=full` により強制的に有効になります。

ルール:

- Stable タグと correction タグは、`beta` または `latest` のどちらにも公開できます
- Beta prerelease タグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全な commit SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証のみです
- 実際の公開パスでは、preflight 時に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは公開前にそのメタデータを検証し続けます

## Stable npm リリース手順

Stable npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、preflight ワークフローの検証のみのドライランに現在の完全な workflow-branch commit SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択し、直接 stable 公開を意図する場合にのみ `latest` を選択します
3. 1 つの手動ワークフローから通常の CI に加えて live prompt cache、Docker、QA Lab、Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全な commit SHA に対して `Full Release Validation` を実行します
4. 決定的な通常のテストグラフだけが必要な場合は、代わりにリリース ref で手動 `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` で `OpenClaw Release Publish` を実行します。これは OpenClaw npm パッケージを promotion する前に、外部化された Plugin を npm と ClawHub に公開します
7. リリースが `beta` に landing した場合は、private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使用して、その stable バージョンを `beta` から `latest` に promotion します
8. リリースを意図的に `latest` に直接公開し、`beta` もすぐに同じ stable build に追随させる必要がある場合は、同じ private ワークフローを使用して両方の dist-tag を stable バージョンに向けるか、スケジュールされた自己修復 sync によって後で `beta` を移動させます

dist-tag の変更は、引き続き `NPM_TOKEN` が必要なため、セキュリティ上の理由で private repo に置かれています。一方、public repo は OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first promotion パスの両方が文書化され、オペレーターに見える状態になります。

メンテナーがローカル npm 認証へフォールバックする必要がある場合は、1Password CLI (`op`) コマンドは専用の tmux セッション内でのみ実行してください。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内に閉じ込めることで、プロンプト、アラート、OTP の処理を観測可能にし、ホストアラートの繰り返しを防ぎます。

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

メンテナーは、実際の runbook に private release docs の
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリースチャンネル](/ja-JP/install/development-channels)
