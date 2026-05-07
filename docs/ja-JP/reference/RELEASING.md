---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名規則とリリース周期を探しています
    - 月次サポートまたは LTS リリースラインの計画
summary: リリースレーン、運用者チェックリスト、検証ボックス、バージョン命名、計画中の月次サポートライン、ケイデンス
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-07T01:53:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
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
- レガシー安定版修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- Beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日をゼロ埋めしない
- `latest` は現在昇格済みの安定版 npm リリースを意味する
- `beta` は現在の beta インストール対象を意味する
- 安定版リリースとレガシー修正リリースはデフォルトで npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にすることも、検証済みの beta ビルドを後で昇格することもできる
- すべての安定版 OpenClaw リリースは npm パッケージと macOS アプリを同時に出荷する。
  beta リリースは通常、まず npm/パッケージ経路を検証して公開し、
  mac アプリのビルド/署名/公証は明示的に要求されない限り安定版用に残す

### 計画中の月次サポートバージョニング

OpenClaw にはまだ LTS または月次サポートチャネルはありません。メンテナーは
SemVer 互換の月次サポートラインに向けて作業していますが、現在出荷されている
更新チャネルは引き続き `stable`、`beta`、`dev` です。

計画中のバージョン形式は `YYYY.M.PATCH` です。

- `YYYY` は年です。
- `M` は先頭ゼロなしの月次リリースラインです。
- `PATCH` はその月次ライン内で増加し、必要なだけ大きくできます。

たとえば、`2026.6.0`、`2026.6.1`、`2026.6.2` はすべて 2026 年 6 月ラインに属します。将来の月次サポート dist-tag である `stable-2026-6` や
`lts-2026-6` はそのラインを指し、`latest` は引き続き速いペースで移動する可能性があります。

この将来モデルにより、新しい `YYYY.M.D-N` 修正リリースは不要になります。
既存のレガシー修正バージョンは、古いパッケージとアップグレード経路が
動作し続けるように引き続き認識されます。

## リリース頻度

- リリースは beta 優先で進む
- 安定版は最新の beta が検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成された `release/YYYY.M.D` ブランチからリリースを切るため、リリース検証と修正が `main` 上の新規開発を妨げない
- beta タグがプッシュまたは公開されていて修正が必要な場合、メンテナーは古い beta タグを削除または再作成するのではなく、次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモはメンテナー専用

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開されている形です。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は、
メンテナー専用のリリース runbook に残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がブランチ元として十分に green であることを確認する。
2. 実際のコミット履歴から `/changelog` で先頭の `CHANGELOG.md` セクションを書き直し、
   エントリをユーザー向けに保ち、コミットしてプッシュし、ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードを確認する。期限切れの互換性は、アップグレード経路が引き続きカバーされる場合にのみ削除するか、意図的に保持する理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` で直接行わない。
5. 予定しているタグに必要なすべてのバージョン箇所を更新し、
   `pnpm plugins:sync` を実行して公開可能な Plugin パッケージがリリースバージョンと互換性メタデータを共有するようにしてから、ローカルの決定的な事前チェックを実行する:
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check`、および
   `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   検証専用の事前チェックに完全な 40 文字のリリースブランチ SHA を使用できる。成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` ですべてのプレリリーステストを開始する。これは 4 つの大きなリリーステストボックスである Vitest、Docker、QA Lab、Package のための単一の手動エントリポイントです。
8. 検証が失敗した場合は、リリースブランチ上で修正し、その修正を証明する最小の失敗ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行する。変更された範囲によって以前の証拠が古くなる場合にのみ、完全な包括ワークフローを再実行する。
9. beta の場合、`vYYYY.M.D-beta.N` をタグ付けし、一致する `release/YYYY.M.D` ブランチから `OpenClaw Release Publish` を実行する。これは `pnpm plugins:sync:check` を検証し、すべての公開可能な Plugin パッケージを npm と同じセットの ClawHub に並列で dispatch し、Plugin npm 公開が成功し次第、一致する dist-tag で準備済みの OpenClaw npm 事前チェック成果物を昇格する。
   ClawHub 公開は OpenClaw npm 公開中も実行中の可能性があるが、リリース公開ワークフローは両方の Plugin 公開経路と OpenClaw npm 公開経路が正常に完了するまで終了しない。公開後、公開済みの `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して公開後パッケージ受け入れを実行する。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、
   次の一致するプレリリース番号を切る。古いプレリリースを削除または書き換えない。
10. 安定版の場合、検証済みの beta またはリリース候補に必要な検証証拠がある場合にのみ続行する。安定版 npm 公開も `OpenClaw Release Publish` を経由し、
    `preflight_run_id` を使って成功した事前チェック成果物を再利用する。安定版 macOS リリースの準備完了には、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および更新済みの `appcast.xml` が `main` 上にあることも必要です。
11. 公開後、npm 公開後ベリファイア、公開後チャネル証明が必要な場合の任意のスタンドアロン公開済み npm Telegram E2E、必要に応じた dist-tag 昇格、一致する完全な `CHANGELOG.md` セクションからの GitHub リリース/プレリリースノート、およびリリース告知手順を実行する。

## リリース事前チェック

- リリースのプリフライト前に `pnpm check:test-types` を実行し、テスト TypeScript が高速なローカル `pnpm check` ゲートの外でもカバーされるようにする
- リリースのプリフライト前に `pnpm check:architecture` を実行し、より広範なインポートサイクルとアーキテクチャ境界チェックが高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、期待される `dist/*` リリース成果物と Control UI バンドルが pack 検証ステップに存在するようにする
- ルートのバージョンバンプ後、タグ付け前に `pnpm plugins:sync` を実行する。これは、公開可能な plugin パッケージバージョン、OpenClaw peer/API 互換性メタデータ、ビルドメタデータ、plugin changelog スタブを、core リリースバージョンに合わせて更新する。`pnpm plugins:sync:check` は非変更のリリースガードであり、このステップを忘れていた場合は、registry の変更前に公開ワークフローが失敗する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、すべてのプレリリース test box を 1 つのエントリポイントから開始する。これは branch、tag、または完全な commit SHA を受け取り、手動の `CI` を dispatch し、install smoke、package acceptance、cross-OS package checks、QA Lab parity、Matrix、Telegram lane 用に `OpenClaw Release Checks` を dispatch する。stable/default の実行では、網羅的な live/E2E と Docker release-path soak は `run_release_soak=true` の背後に置かれる。`release_profile=full` は soak を強制的に有効にする。`release_profile=full` と `rerun_group=all` の場合、release checks の `release-package-under-test` 成果物に対して package Telegram E2E も実行する。公開後、同じ Telegram E2E で公開済み npm パッケージも証明する必要がある場合は、`npm_telegram_package_spec` を指定する。公開後、Package Acceptance で SHA からビルドされた成果物ではなく出荷済み npm パッケージに対して package/update matrix を実行する必要がある場合は、`package_acceptance_package_spec` を指定する。Telegram E2E を強制せずに、private evidence report で検証が公開済み npm パッケージと一致することを証明する必要がある場合は、`evidence_package_spec` を指定する。例: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を継続しながら package candidate の side-channel proof が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使用する。現在の `workflow_ref` harness で信頼済みの `package_ref` branch/tag/SHA を pack するには `source=ref` を使用する。必須の SHA-256 付き HTTPS tarball には `source=url` を使用する。別の GitHub Actions 実行によってアップロードされた tarball には `source=artifact` を使用する。このワークフローは candidate を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対して Telegram QA を実行できる。選択した Docker lane に `published-upgrade-survivor` が含まれる場合、package 成果物が candidate になり、`published_upgrade_survivor_baseline` が公開済み baseline を選択する。`update-restart-auth` は candidate package をインストール済み CLI と package-under-test の両方として使用するため、candidate update コマンドの managed restart path を実行する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  共通プロファイル:
  - `smoke`: install/channel/agent、Gateway network、config reload lane
  - `package`: OpenWebUI または live ClawHub を含まない、artifact-native package/update/restart/plugin lane
  - `product`: package profile に加え、MCP channel、cron/subagent cleanup、OpenAI web search、OpenWebUI
  - `full`: OpenWebUI 付きの Docker release-path chunk
  - `custom`: focused rerun 用の正確な `docker_lanes` 選択
- リリース候補に通常の完全な CI カバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI dispatch は changed scoping をバイパスし、Linux Node shard、bundled-plugin shard、channel contract、Node 22 互換性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android、Control UI i18n lane を強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリース telemetry を検証する場合は `pnpm qa:otel:smoke` を実行する。これは local OTLP/HTTP receiver を通して QA-lab を実行し、Opik、Langfuse、または別の外部 collector を必要とせずに、export された trace span name、bounded attributes、content/identifier redaction を検証する。
- すべてのタグ付きリリース前に `pnpm release:check` を実行する
- tag が存在した後、変更を伴う publish sequence には `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` から dispatch し（または main から到達可能な tag を公開する場合は `main`）、release tag と成功した OpenClaw npm `preflight_run_id` を渡し、意図的に focused repair を実行している場合を除き、default plugin publish scope `all-publishable` を維持する。このワークフローは plugin npm publish、plugin ClawHub publish、OpenClaw npm publish を直列化するため、core package が外部化された plugins より先に公開されることはない。
- Release checks は現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` はリリース承認前に QA Lab mock parity lane に加え、高速な live Matrix profile と Telegram QA lane も実行する。live lane は `qa-live-shared` environment を使用する。Telegram は Convex CI credential lease も使用する。Matrix transport、media、E2EE inventory 全体を並列で確認したい場合は、手動の `QA-Lab - All Lanes` ワークフローを `matrix_profile=all` および `matrix_shards=true` で実行する。
- Cross-OS install と upgrade runtime validation は公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの: 実際の npm release path は短く、決定的で、artifact-focused に保ち、時間のかかる live checks は独自の lane に置くことで、publish を停滞またはブロックしないようにする
- secret を含む release checks は、workflow logic と secrets を制御された状態に保つため、`Full Release Validation` 経由、または `main`/release workflow ref から dispatch する
- `OpenClaw Release Checks` は、解決された commit が OpenClaw branch または release tag から到達可能である限り、branch、tag、または完全な commit SHA を受け付ける
- `OpenClaw NPM Release` validation-only preflight は、push 済み tag を必要とせずに、現在の完全な 40 文字の workflow-branch commit SHA も受け付ける
- その SHA path は validation-only であり、実際の publish に昇格することはできない
- SHA mode では、workflow は package metadata check のためだけに `v<package.json version>` を合成する。実際の publish には引き続き実際の release tag が必要
- どちらの workflow も、実際の publish と promotion path は GitHub-hosted runner 上に維持し、非変更の validation path ではより大きな Blacksmith Linux runner を使用できる
- その workflow は、`OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方の workflow secrets を使用して実行する
- npm release preflight は、別の release checks lane を待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応する beta/correction tag）を実行する
- npm publish 後に `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応する beta/correction version）を実行し、新しい一時 prefix で公開済み registry install path を検証する
- beta publish 後に `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行し、共有 lease 済み Telegram credential pool を使用して、公開済み npm パッケージに対する installed-package オンボーディング、Telegram setup、実際の Telegram E2E を検証する。ローカル maintainer の単発実行では Convex vars を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` env credentials を直接渡してもよい。
- maintainer machine から完全な post-publish beta smoke を実行するには、`pnpm release:beta-smoke -- --beta betaN` を使用する。この helper は Parallels npm update/fresh-target validation を実行し、`NPM Telegram Beta E2E` を dispatch し、正確な workflow run を poll し、artifact を download し、Telegram report を出力する。
- Maintainer は GitHub Actions から手動の `NPM Telegram Beta E2E` ワークフローを使って同じ post-publish check を実行できる。これは意図的に manual-only であり、すべての merge では実行されない。
- Maintainer release automation は現在、preflight-then-promote を使用する:
  - 実際の npm publish は、成功した npm `preflight_run_id` に合格する必要がある
  - 実際の npm publish は、成功した preflight run と同じ `main` または `release/YYYY.M.D` branch から dispatch する必要がある
  - stable npm release はデフォルトで `beta` になる
  - stable npm publish は workflow input 経由で明示的に `latest` を対象にできる
  - token-based npm dist-tag mutation は現在、security のため `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` に置かれている。これは、public repo が OIDC-only publish を維持する一方で、`npm dist-tag add` には引き続き `NPM_TOKEN` が必要なため
  - public `macOS Release` は validation-only である。tag が release branch にのみ存在し、workflow が `main` から dispatch される場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の private mac publish は、成功した private mac `preflight_run_id` と `validate_run_id` に合格する必要がある
  - 実際の publish path は、prepared artifacts を再ビルドせずに promote する
- `YYYY.M.D-N` のような legacy stable correction release では、post-publish verifier は `YYYY.M.D` から `YYYY.M.D-N` への同じ temp-prefix upgrade path もチェックするため、release correction が古い global install を base stable payload のまま静かに残すことはない
- npm release preflight は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` payload の両方が含まれていない限り fail closed になるため、空の browser dashboard を再び出荷しない
- Post-publish verification は、公開済み plugin entrypoint と package metadata が installed registry layout に存在することも確認する。plugin runtime payload が欠落したリリースは postpublish verifier に失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は candidate update tarball に対して npm pack `unpackedSize` budget も強制するため、installer e2e は release publish path の前に accidental pack bloat を検出する
- リリース作業が CI planning、extension timing manifest、または extension test matrix に触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` から planner-owned の `plugin-prerelease-extension-shard` matrix outputs を再生成して review し、release notes が古い CI layout を説明しないようにする
- Stable macOS release readiness には updater surfaces も含まれる:
  - GitHub release には、packaged `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - `main` 上の `appcast.xml` は、publish 後に新しい stable zip を指している必要がある
  - packaged app は、その release version の canonical Sparkle build floor 以上の、non-debug bundle id、空でない Sparkle feed URL、`CFBundleVersion` を維持する必要がある

## Release test box

`Full Release Validation` は、operator がすべてのプレリリーステストを 1 つのエントリポイントから開始する方法である。動きの速い branch で pinned commit proof を得るには、すべての child workflow が target SHA に固定された一時 branch から実行されるように helper を使用する:

```bash
pnpm ci:full-release --sha <full-sha>
```

この helper は `release-ci/<sha>-...` を push し、その branch から `ref=<sha>` で `Full Release Validation` を dispatch し、すべての child workflow の `headSha` が target と一致することを検証してから、一時 branch を削除する。これにより、誤って新しい `main` child run を証明することを避けられる。

release branch または tag validation の場合は、信頼済みの `main` workflow ref から実行し、release branch または tag を `ref` として渡す:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

このワークフローはターゲット ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備し、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後 `OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA を含む Package Acceptance、QA Lab パリティ、live Matrix、live Telegram へファンアウトします。フル実行が許容されるのは、`Full Release Validation` サマリーで `normal_ci` と `release_checks` が成功として表示される場合のみです。full/all モードでは、`npm_telegram` 子も成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が指定されていない限りスキップされます。最終検証サマリーには各子実行の最も遅いジョブの表が含まれるため、リリース管理者はログをダウンロードせずに現在のクリティカルパスを確認できます。完全なステージマトリックス、正確なワークフロージョブ名、stable と full プロファイルの違い、アーティファクト、焦点を絞った再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。子ワークフローは、ターゲット `ref` が古いリリースブランチやタグを指している場合でも、通常は `--ref main` である `Full Release Validation` を実行する信頼済み ref からディスパッチされます。Full Release Validation 用の個別の workflow-ref 入力はありません。ワークフロー実行 ref を選ぶことで、信頼済みハーネスを選択します。移動する `main` 上の正確なコミット証明に `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にはできないため、`pnpm ci:full-release --sha <sha>` を使用して固定された一時ブランチを作成してください。

live/provider の範囲を選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: リリース承認用に、minimum に stable provider/backend カバレッジを追加
- `full`: stable に幅広い advisory provider/media カバレッジを追加

リリースをブロックするレーンが green で、昇格前に網羅的な live/E2E、Docker リリースパス、範囲を限定した公開済みアップグレード生存スイープを実行したい場合は、`stable` とともに `run_release_soak=true` を使用します。そのスイープは、最新 4 件の stable パッケージに加えて、固定された `2026.4.23` と `2026.5.2` のベースライン、および古い `2026.4.15` のカバレッジを対象にし、重複するベースラインを削除し、各ベースラインを個別の Docker runner ジョブにシャードします。`full` は `run_release_soak=true` を含意します。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用してターゲット ref を一度 `release-package-under-test` として解決し、soak 実行時にはクロス OS、Package Acceptance、リリースパス Docker チェックでそのアーティファクトを再利用します。これにより、すべてのパッケージ向け box が同じバイト列を使い、パッケージビルドの繰り返しを避けられます。クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.4` を使用します。このレーンは最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回の live agent ターンを証明するためです。より広範な live provider マトリックスは、引き続きモデル固有のカバレッジの場です。

リリース段階に応じて、次のバリアントを使用します。

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

焦点を絞った修正後の最初の再実行として、full umbrella を使用しないでください。1 つの box が失敗した場合は、次の証明に、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデル provider、または QA レーンを使用してください。修正が共有リリースオーケストレーションを変更した場合、または以前の全 box 証拠が古くなった場合にのみ、full umbrella を再度実行してください。umbrella の最終検証は、記録された子ワークフロー実行 ID を再チェックするため、子ワークフローが正常に再実行された後は、失敗した親ジョブ `Verify full validation` のみを再実行してください。

範囲を限定した復旧では、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子のみを実行、`plugin-prerelease` はリリース専用 Plugin 子のみを実行、`release-checks` はすべてのリリース box を実行し、より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。焦点を絞った `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行は release-checks パッケージアーティファクトを使用します。焦点を絞ったクロス OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/suite フィルターを追加できます。QA release-check の失敗は advisory です。QA のみの失敗はリリース検証をブロックしません。

### Vitest

Vitest box は手動 `CI` 子ワークフローです。手動 CI は意図的に changed scoping をバイパスし、リリース候補に対して通常のテストグラフを強制します。Linux Node シャード、バンドル Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n です。

この box は「ソースツリーは通常のフルテストスイートに合格したか」に答えるために使用します。リリースパスの製品検証とは同じではありません。保持する証拠:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確なターゲット SHA で green の `CI` 実行
- リグレッション調査時の CI ジョブからの失敗または遅いシャード名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定論的な通常 CI が必要で、Docker、QA Lab、live、クロス OS、またはパッケージ box が不要な場合にのみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box は、`openclaw-live-and-e2e-checks-reusable.yml` とリリースモードの `install-smoke` ワークフローを通じて `OpenClaw Release Checks` 内にあります。これは、ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには以下が含まれます。

- 遅い Bun グローバルインストールスモークを有効にした完全なインストールスモーク
- ターゲット SHA による root Dockerfile スモークイメージの準備/再利用。QR、root/Gateway、installer/Bun スモークジョブは個別の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル Plugin インストール/アンインストールレーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- release checks に live suites が含まれる場合の live/E2E provider スイートと Docker live モデルカバレッジ

再実行する前に Docker アーティファクトを使用してください。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。焦点を絞った復旧では、すべてのリリースチャンクを再実行する代わりに、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用してください。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab box も `OpenClaw Release Checks` の一部です。これは agentic な動作とチャンネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには以下が含まれます。

- agentic parity pack を使用して、OpenAI 候補レーンを Opus 4.6 ベースラインと比較する mock parity レーン
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA レーン
- リリーステレメトリーに明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

この box は「リリースは QA シナリオと live チャンネルフローで正しく動作するか」に答えるために使用します。リリース承認時には、parity、Matrix、Telegram レーンのアーティファクト URL を保持してください。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### Package

Package box はインストール可能な製品ゲートです。これは `Package Acceptance` と resolver `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。resolver は候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離します。

サポートされている候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択した `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパック
- `source=url`: 必須の `package_sha256` とともに HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行でアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、マイグレーション、更新、設定済み認証の更新再起動、古い Plugin 依存関係のクリーンアップ、オフライン Plugin フィクスチャ、Plugin 更新、Telegram パッケージ QA を維持します。ブロッキング release checks は、デフォルトの最新公開済みパッケージベースラインを使用します。`run_release_soak=true` または `release_profile=full` は、`2026.4.23` から `latest` までのすべての stable npm 公開済みベースラインと、報告済み issue フィクスチャに拡張されます。すでに出荷済みの候補には `source=npm` の Package Acceptance を使用し、公開前の SHA に裏付けられたローカル npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前は Parallels が必要だったパッケージ/更新カバレッジの大部分に対する GitHub ネイティブな代替です。クロス OS release checks は OS 固有のオンボーディング、インストーラー、プラットフォーム動作に引き続き重要ですが、パッケージ/更新の製品検証では Package Acceptance を優先すべきです。

更新と Plugin 検証の正規チェックリストは [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) です。Plugin のインストール/更新、doctor クリーンアップ、または公開済みパッケージマイグレーションの変更を、どのローカル、Docker、Package Acceptance、または release-check レーンで証明するかを判断する際に使用してください。すべての stable `2026.4.23+` パッケージからの網羅的な公開済み更新マイグレーションは、Full Release CI の一部ではなく、個別の手動 `Update Migration` ワークフローです。

従来の package-acceptance の寛容性は、意図的に期限付きにされています。
`2026.4.25` までのパッケージは、すでに npm に公開済みのメタデータ不足について、互換性パスを使用できます。具体的には、tarball に含まれないプライベート QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落したパッチファイル、永続化されていない `update.channel`、従来の Plugin インストールレコードの場所、マーケットプレイスのインストールレコード永続化の欠落、および `plugins update` 中の設定メタデータ移行です。公開済みの `2026.4.26` パッケージでは、すでに出荷済みのローカルビルドメタデータスタンプファイルについて警告が出る場合があります。それ以降のパッケージは、現行のパッケージ契約を満たす必要があります。同じ不足はリリース検証で失敗します。

リリース上の判断が実際にインストール可能なパッケージに関するものの場合は、より広範な Package Acceptance プロファイルを使用します。

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

- `smoke`: パッケージのインストール、チャンネル、エージェント、Gateway ネットワーク、および設定リロードの簡易レーン
- `package`: ライブ ClawHub なしのインストール、更新、再起動、Plugin パッケージ契約。これはリリースチェックの既定値です
- `product`: `package` に加えて、MCP チャンネル、cron/サブエージェントのクリーンアップ、OpenAI Web 検索、および OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスチャンク
- `custom`: 集中的な再実行向けの正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または `telegram_mode=live-frontier` を有効にします。ワークフローは解決済みの `package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの Telegram ワークフローは、公開後チェック向けに公開済み npm spec を引き続き受け付けます。

## リリース公開自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントです。リリースに必要な順序で trusted-publisher ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを検証します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で `Plugin NPM Release` を dispatch します。
5. 同じ scope と SHA で `Plugin ClawHub Release` を dispatch します。
6. リリースタグ、npm dist-tag、保存済みの `preflight_run_id` で `OpenClaw NPM Release` を dispatch します。

ベータ公開の例:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

既定の beta dist-tag への安定版公開:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

`latest` への安定版の直接昇格は明示的です。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

下位レベルの `Plugin NPM Release` および `Plugin ClawHub Release` ワークフローは、集中的な修復または再公開作業にのみ使用します。選択した Plugin の修復では、`plugin_publish_scope=selected` と `plugins=@openclaw/name` を `OpenClaw Release Publish` に渡すか、OpenClaw パッケージを公開してはならない場合は子ワークフローを直接 dispatch します。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または `v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証専用 preflight のために、現在の完全な 40 文字のワークフローブランチコミット SHA も使用できます
- `preflight_only`: 検証、ビルド、パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスで必須。ワークフローが成功した preflight 実行で準備された tarball を再利用するために使用します
- `npm_dist_tag`: 公開パス向けの npm ターゲットタグ。既定値は `beta`

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight 実行 ID。`publish_openclaw_npm=true` の場合に必須です
- `npm_dist_tag`: OpenClaw パッケージ向けの npm ターゲットタグ
- `plugin_publish_scope`: 既定値は `all-publishable`。集中的な修復作業にのみ `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: 既定値は `true`。ワークフローを Plugin のみの修復オーケストレーターとして使用する場合にのみ `false` に設定します

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを伴うチェックでは、解決済みコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: 安定版または既定のリリースチェックで、網羅的なライブ/E2E、Docker リリースパス、および all-since upgrade-survivor soak を有効にします。`release_profile=full` によって強制的に有効になります。

ルール:

- 安定版タグと修正タグは、`beta` または `latest` のどちらにも公開できます
- ベータ prerelease タグは、`beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは公開前にそのメタデータを検証してから続行します

## 安定版 npm リリース手順

安定版 npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、preflight ワークフローの検証専用 dry run のために、現在の完全なワークフローブランチコミット SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択し、安定版を直接公開する意図がある場合にのみ `latest` を選択します
3. 1 つの手動ワークフローで通常の CI に加えてライブプロンプトキャッシュ、Docker、QA Lab、Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全なコミット SHA に対して `Full Release Validation` を実行します
4. 意図的に決定論的な通常テストグラフのみが必要な場合は、代わりにリリース ref に対して手動の `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` で `OpenClaw Release Publish` を実行します。これにより、OpenClaw npm パッケージを昇格する前に、外部化された Plugin が npm と ClawHub に公開されます
7. リリースが `beta` に着地した場合は、プライベートの `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その安定版を `beta` から `latest` に昇格します
8. リリースを意図的に `latest` へ直接公開し、`beta` もすぐに同じ安定版ビルドを追従させる必要がある場合は、同じプライベートワークフローを使用して両方の dist-tag を安定版に向けるか、スケジュール済みの自己修復同期によって後で `beta` を移動させます

dist-tag の変更は、引き続き `NPM_TOKEN` を必要とするため、セキュリティ上の理由でプライベートリポジトリに置かれています。一方、公開リポジトリでは OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first 昇格パスの両方が文書化され、オペレーターから見える状態になります。

メンテナーがローカル npm 認証へフォールバックする必要がある場合は、1Password CLI (`op`) コマンドを必ず専用の tmux セッション内でのみ実行します。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内に留めることで、プロンプト、アラート、OTP 処理を観察可能にし、ホストアラートの繰り返しを防げます。

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

メンテナーは、実際の手順書としてプライベートリリースドキュメント
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリースチャンネル](/ja-JP/install/development-channels)
