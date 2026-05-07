---
read_when:
    - 公開リリースチャネル定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名とリリース周期を探しています
summary: リリースレーン、運用者チェックリスト、検証ボックス、バージョン命名、リリース周期
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-07T15:08:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
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
- 月または日にゼロ埋めしない
- `latest` は、現在昇格済みの安定版 npm リリースを意味します
- `beta` は、現在の beta インストール対象を意味します
- 安定版および安定版修正リリースは、デフォルトでは npm `beta` に公開されます。リリース担当者は `latest` を明示的に対象にすることも、検証済みの beta ビルドを後で昇格することもできます
- すべての安定版 OpenClaw リリースは、npm パッケージと macOS アプリを同時に出荷します。
  beta リリースは通常、まず npm/パッケージ経路を検証して公開し、
  mac アプリのビルド/署名/公証は、明示的に要求されない限り安定版用に予約します

## リリース周期

- リリースは beta 優先で進みます
- 安定版は、最新 beta が検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチから
  リリースを切るため、リリース検証と修正が `main` での新規開発をブロックしません
- beta タグがプッシュまたは公開済みで修正が必要な場合、メンテナーは
  古い beta タグを削除または再作成するのではなく、次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用です

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開部分です。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は、
メンテナー専用のリリースランブックに残します。

1. 現在の `main` から開始します。最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がそこからブランチを切るのに十分 green であることを確認します。
2. 実際のコミット履歴をもとに `/changelog` で `CHANGELOG.md` の先頭セクションを書き換え、
   エントリをユーザー向けに保ち、コミットしてプッシュし、
   ブランチ作成前にもう一度 rebase/pull します。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` にあるリリース互換性レコードを確認します。アップグレード経路が引き続きカバーされている場合のみ
   期限切れの互換性を削除し、そうでない場合は意図的に残している理由を記録します。
4. 現在の `main` から `release/YYYY.M.D` を作成します。通常のリリース作業を
   `main` で直接行わないでください。
5. 意図したタグに必要なすべてのバージョン箇所を更新し、その後
   `pnpm release:prep` を実行します。これは Plugin バージョン、Plugin インベントリ、config
   スキーマ、バンドルされたチャンネル config メタデータ、config docs ベースライン、Plugin SDK
   exports、Plugin SDK API ベースラインを正しい順序で更新します。タグ付け前に生成された
   drift をコミットします。その後、ローカルの決定的な preflight を実行します。
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行します。タグが存在する前は、
   検証専用 preflight に完全な40文字のリリースブランチ SHA を使用できます。
   成功した `preflight_run_id` を保存します。
7. リリースブランチ、タグ、または完全なコミット SHA を指定して `Full Release Validation` で
   すべてのプレリリーステストを開始します。これは、4つの大きなリリーステストボックス
   Vitest、Docker、QA Lab、Package の単一の手動エントリポイントです。
8. 検証が失敗した場合は、リリースブランチ上で修正し、その修正を証明する最小の失敗した
   ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル allowlist を再実行します。
   変更された対象範囲により以前の証拠が古くなる場合にのみ、umbrella 全体を再実行します。
9. beta の場合は `vYYYY.M.D-beta.N` をタグ付けし、その後一致する `release/YYYY.M.D` ブランチから
   `OpenClaw Release Publish` を実行します。これは `pnpm plugins:sync:check` を検証し、
   公開可能なすべての Plugin パッケージを npm に、同じセットを
   ClawHub に並列で dispatch し、Plugin の npm publish が成功し次第、一致する dist-tag で
   準備済みの OpenClaw npm preflight artifact を昇格します。
   OpenClaw npm の公開中も ClawHub の公開はまだ実行中の場合がありますが、
   release publish workflow は子 run ID を即座に出力します。デフォルトでは、
   dispatch 後に ClawHub を待機しないため、OpenClaw npm の可用性は
   遅い ClawHub 承認や registry 作業によってブロックされません。ClawHub が workflow completion を
   ブロックする必要がある場合は `wait_for_clawhub=true` を設定します。
   ClawHub 経路は一時的な CLI 依存関係インストール失敗をリトライし、
   1つの preview cell が flake しても preview を通過した Plugin を公開し、
   すべての期待される Plugin バージョンに対する registry 検証で終了するため、部分的な公開は
   可視でリトライ可能なままになります。公開後、公開済みの
   `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して post-publish package
   acceptance を実行します。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、
   次に一致するプレリリース番号を切ります。古いプレリリースを削除または書き換えないでください。
10. 安定版の場合、検証済みの beta またはリリース候補に必要な検証証拠がそろった後にのみ
    続行します。安定版 npm publish も
    `OpenClaw Release Publish` を通り、`preflight_run_id` を介して成功済みの preflight artifact を
    再利用します。安定版 macOS リリース準備完了には、
    パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および更新済みの `appcast.xml` が `main` 上にあることも必要です。
11. 公開後、npm post-publish verifier、公開後のチャンネル証明が必要な場合は任意のスタンドアロン
    published-npm Telegram E2E、必要に応じた dist-tag 昇格、
    完全に一致する `CHANGELOG.md` セクションからの GitHub release/prerelease notes、
    およびリリース告知手順を実行します。

## リリース preflight

- リリースのプリフライト前に `pnpm check:test-types` を実行して、テストの TypeScript が高速なローカル `pnpm check` ゲートの外側でもカバーされるようにする
- リリースのプリフライト前に `pnpm check:architecture` を実行して、より広範な import サイクルとアーキテクチャ境界チェックが高速なローカルゲートの外側でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行して、pack 検証ステップに必要な `dist/*` リリース成果物と Control UI バンドルを用意する
- ルートのバージョンバンプ後、タグ付け前に `pnpm release:prep` を実行する。これは、バージョン、設定、API の変更後によくずれる決定的なリリースジェネレーターをすべて実行する。対象は Plugin バージョン、Plugin インベントリ、ベース設定スキーマ、同梱チャネル設定メタデータ、設定ドキュメントのベースライン、Plugin SDK exports、Plugin SDK API ベースライン。`pnpm release:check` はそれらのガードを check モードで再実行し、パッケージリリースチェックを実行する前に、見つかった生成物のずれによる失敗を 1 回のパスですべて報告する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行して、すべてのプレリリーステストボックスを 1 つのエントリポイントから開始する。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動 `CI` を dispatch し、install smoke、package acceptance、クロス OS パッケージチェック、QA Lab parity、Matrix、Telegram レーン用に `OpenClaw Release Checks` を dispatch する。安定版/デフォルト実行では、網羅的な live/E2E と Docker リリースパス soak は `run_release_soak=true` の背後に置かれる。`release_profile=full` は soak を強制的に有効にする。`release_profile=full` と `rerun_group=all` を指定すると、リリースチェックの `release-package-under-test` 成果物に対して package Telegram E2E も実行する。同じ Telegram E2E で公開済み npm パッケージも証明する必要がある場合は、公開後に `npm_telegram_package_spec` を指定する。Package Acceptance が SHA からビルドされた成果物ではなく、出荷済み npm パッケージに対して package/update マトリクスを実行する必要がある場合は、公開後に `package_acceptance_package_spec` を指定する。非公開の証拠レポートで、Telegram E2E を強制せずに検証が公開済み npm パッケージと一致することを証明する必要がある場合は、`evidence_package_spec` を指定する。例: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を続けながらパッケージ候補のサイドチャネル証拠が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` ハーネスで信頼された `package_ref` ブランチ/タグ/SHA を pack するには `source=ref` を使う。必須の SHA-256 付き HTTPS tarball には `source=url` を使う。別の GitHub Actions run がアップロードした tarball には `source=artifact` を使う。このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラーを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対して Telegram QA を実行できる。選択した Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージ成果物が候補になり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。`update-restart-auth` は候補パッケージをインストール済み CLI と package-under-test の両方として使うため、候補 update コマンドの管理対象 restart パスを実行する。例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: install/channel/agent、gateway network、config reload レーン
  - `package`: OpenWebUI や live ClawHub を含まない、成果物ネイティブの package/update/restart/plugin レーン
  - `product`: package プロファイルに加えて MCP チャネル、cron/subagent cleanup、OpenAI web search、OpenWebUI
  - `full`: OpenWebUI 付きの Docker リリースパスチャンク
  - `custom`: 集中的な再実行のための正確な `docker_lanes` 選択
- リリース候補に対する通常の CI 全体のカバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI dispatch は changed scoping をバイパスし、Linux Node shard、同梱 Plugin shard、channel contract、Node 22 compatibility、`check`、`check-additional`、build smoke、docs check、Python skills、Windows、macOS、Android、Control UI i18n レーンを強制する。例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリーステレメトリを検証するときは `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP receiver 経由で QA-lab を実行し、Opik、Langfuse、その他の外部 collector を必要とせずに、エクスポートされた trace span 名、制限付き attributes、content/identifier redaction を検証する。
- タグ付きリリースの前には必ず `pnpm release:check` を実行する
- タグが存在した後、変更を伴う publish sequence には `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` から dispatch する（main から到達可能なタグを公開する場合は `main`）。リリースタグと成功した OpenClaw npm `preflight_run_id` を渡し、意図的に集中的な修復を実行する場合を除き、デフォルトの Plugin publish scope `all-publishable` のままにする。このワークフローは Plugin npm publish、Plugin ClawHub publish、OpenClaw npm publish を直列化するため、外部化された Plugin より前に core パッケージが公開されることはない。
- リリースチェックは現在、別の手動ワークフローで実行される: `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab mock parity レーンに加えて、高速な live Matrix プロファイルと Telegram QA レーンも実行する。live レーンは `qa-live-shared` environment を使う。Telegram は Convex CI credential lease も使う。Matrix transport、media、E2EE inventory の全体を並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` を指定して手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS の install と upgrade runtime validation は、public `OpenClaw Release Checks` と `Full Release Validation` の一部であり、reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの。実際の npm リリースパスを短く、決定的で、成果物中心に保ちつつ、遅い live チェックは独自レーンに置くことで、publish を停止またはブロックしないようにする
- secret を含むリリースチェックは、`Full Release Validation` 経由、または `main`/release workflow ref から dispatch し、ワークフローロジックと secrets が制御された状態を保つ
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付ける
- `OpenClaw NPM Release` の validation-only preflight は、push 済みタグを必要とせずに、現在の完全な 40 文字の workflow-branch commit SHA も受け付ける
- その SHA パスは validation-only であり、実際の publish へ昇格できない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成する。実際の publish には依然として実際のリリースタグが必要
- 両方のワークフローは、実際の publish と promotion パスを GitHub-hosted runners 上に保ち、変更を伴わない validation パスはより大きな Blacksmith Linux runners を使える
- そのワークフローは `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方の workflow secrets を使って実行する
- npm release preflight は、別の release checks レーンを待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応する beta/correction タグ）を実行する
- npm publish 後に `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応する beta/correction バージョン）を実行して、新しい一時 prefix 内で公開済み registry install パスを検証する
- beta publish 後に `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行し、共有 leased Telegram credential pool を使って、公開済み npm パッケージに対する installed-package オンボーディング、Telegram setup、実際の Telegram E2E を検証する。ローカル maintainer の単発実行では、Convex vars を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` env credentials を直接渡してもよい。
- maintainer マシンから post-publish beta smoke 全体を実行するには、`pnpm release:beta-smoke -- --beta betaN` を使う。この helper は Parallels npm update/fresh-target validation を実行し、`NPM Telegram Beta E2E` を dispatch し、正確な workflow run を poll し、成果物を download し、Telegram report を出力する。
- Maintainers は、手動の `NPM Telegram Beta E2E` ワークフロー経由で GitHub Actions から同じ post-publish check を実行できる。これは意図的に manual-only であり、すべての merge では実行されない。
- Maintainer release automation は現在、preflight-then-promote を使う:
  - 実際の npm publish は、成功した npm `preflight_run_id` を通過している必要がある
  - 実際の npm publish は、成功した preflight run と同じ `main` または `release/YYYY.M.D` ブランチから dispatch されている必要がある
  - stable npm releases はデフォルトで `beta` になる
  - stable npm publish は workflow input で明示的に `latest` を target にできる
  - token-based npm dist-tag mutation は現在、セキュリティのため `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` に置かれている。public repo は OIDC-only publish を維持する一方で、`npm dist-tag add` には依然として `NPM_TOKEN` が必要なため
  - public `macOS Release` は validation-only。タグが release branch にのみ存在し、workflow が `main` から dispatch される場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の private mac publish は、成功した private mac `preflight_run_id` と `validate_run_id` を通過している必要がある
  - 実際の publish パスは、prepared artifacts を再ビルドするのではなく promote する
- `YYYY.M.D-N` のような stable correction releases では、post-publish verifier は `YYYY.M.D` から `YYYY.M.D-N` への同じ temp-prefix upgrade パスもチェックするため、リリース修正で古い global installs が base stable payload のまま静かに残ることはない
- npm release preflight は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` payload の両方が含まれていない限り fail closed になるため、空のブラウザ dashboard を再び出荷しない
- Post-publish verification は、公開済み Plugin entrypoints と package metadata が installed registry layout に存在することもチェックする。Plugin runtime payload が欠落したリリースは postpublish verifier に失敗し、`latest` に promote できない。
- `pnpm test:install:smoke` は、candidate update tarball に対して npm pack `unpackedSize` budget も強制するため、installer e2e が accidental pack bloat を release publish path の前に検出できる
- リリース作業が CI planning、extension timing manifests、extension test matrices に触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` から planner-owned の `plugin-prerelease-extension-shard` matrix outputs を再生成して review し、release notes が古い CI layout を説明しないようにする
- stable macOS release readiness には updater surfaces も含まれる:
  - GitHub release には、最終的に packaged `.zip`、`.dmg`、`.dSYM.zip` が含まれている必要がある
  - `main` 上の `appcast.xml` は、publish 後に新しい stable zip を指している必要がある
  - packaged app は、そのリリースバージョンに対する canonical Sparkle build floor 以上の、非 debug bundle id、空でない Sparkle feed URL、`CFBundleVersion` を維持する必要がある

## リリーステストボックス

`Full Release Validation` は、operators がすべてのプレリリーステストを 1 つのエントリポイントから開始する方法。動きの速いブランチ上で固定された commit proof が必要な場合は、helper を使って、すべての child workflow が target SHA に固定された一時ブランチから実行されるようにする:

```bash
pnpm ci:full-release --sha <full-sha>
```

この helper は `release-ci/<sha>-...` を push し、そのブランチから `ref=<sha>` で `Full Release Validation` を dispatch し、すべての child workflow の `headSha` が target と一致することを検証してから、一時ブランチを削除する。これにより、誤って新しい `main` child run を証明することを避けられる。

リリースブランチまたはタグの検証では、信頼済みの `main` ワークフロー
ref から実行し、リリースブランチまたはタグを `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

このワークフローはターゲット ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備し、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後、`OpenClaw Release Checks` はインストールスモーク、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA を含む Package Acceptance、QA Lab parity、live Matrix、live Telegram にファンアウトします。フル実行が受け入れ可能なのは、`Full Release Validation` サマリーで `normal_ci` と `release_checks` が成功として表示されている場合だけです。full/all モードでは、`npm_telegram` 子も成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が指定されていない限りスキップされます。最終検証サマリーには各子実行の最遅ジョブテーブルが含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージマトリクス、正確なワークフロージョブ名、stable と full プロファイルの違い、アーティファクト、焦点を絞った再実行ハンドルについては、[Full release validation](/ja-JP/reference/full-release-validation) を参照してください。
子ワークフローは、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。これは、ターゲット `ref` が古いリリースブランチまたはタグを指している場合も同じです。Full Release Validation 用の個別の workflow-ref 入力はありません。ワークフロー実行 ref を選んで、信頼済みハーネスを選択します。
移動する `main` 上の正確なコミット証明に `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使用して、ピン留めされた一時ブランチを作成します。

live/provider の範囲を選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: リリース承認用に、minimum に stable provider/backend カバレッジを追加
- `full`: stable に広範な advisory provider/media カバレッジを追加

リリースをブロックするレーンが green で、プロモーション前に網羅的な live/E2E、Docker リリースパス、境界付きの公開済み upgrade-survivor sweep を実行したい場合は、`stable` とともに `run_release_soak=true` を使用します。この sweep は、最新 4 つの stable パッケージに加えて、ピン留めされた `2026.4.23` と `2026.5.2` ベースライン、さらに古い `2026.4.15` カバレッジを対象にします。重複するベースラインは削除され、各ベースラインはそれぞれ独自の Docker runner ジョブにシャーディングされます。`full` は `run_release_soak=true` を意味します。

`OpenClaw Release Checks` は信頼済みワークフロー ref を使用して、ターゲット ref を一度だけ `release-package-under-test` として解決し、soak 実行時にはクロス OS、Package Acceptance、リリースパス Docker チェックでそのアーティファクトを再利用します。これにより、すべてのパッケージ向けボックスが同じバイト列を使い、パッケージビルドの繰り返しを避けられます。クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.4` を使用します。このレーンは、最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回の live agent turn を証明するためです。より広範な live provider マトリクスは、引き続きモデル固有カバレッジの場です。

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

焦点を絞った修正後の最初の再実行として、full umbrella を使用しないでください。1 つのボックスが失敗した場合は、次の証明に、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデル provider、または QA レーンを使用します。full umbrella を再度実行するのは、修正が共有リリースオーケストレーションを変更した場合、または以前の全ボックス証拠が古くなった場合だけです。umbrella の最終検証は記録された子ワークフロー実行 ID を再チェックするため、子ワークフローの再実行が成功した後は、失敗した親ジョブ `Verify full validation` だけを再実行します。

境界付きリカバリでは、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子のみを実行し、`plugin-prerelease` はリリース専用 Plugin 子のみを実行し、`release-checks` はすべてのリリースボックスを実行します。より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。焦点を絞った `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行は release-checks パッケージアーティファクトを使用します。焦点を絞ったクロス OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/suite フィルターを追加できます。QA release-check の失敗は advisory です。QA のみの失敗はリリース検証をブロックしません。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に changed スコープをバイパスし、リリース候補に対して通常のテストグラフを強制します。対象は Linux Node shard、バンドル Plugin shard、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python Skills、Windows、macOS、Android、Control UI i18n です。

「ソースツリーは通常のフルテストスイートに合格したか」に答えるには、このボックスを使用します。これはリリースパス製品検証とは同じではありません。保持する証拠は次のとおりです。

- ディスパッチされた `CI` 実行 URL を表示する `Full Release Validation` サマリー
- 正確なターゲット SHA で green の `CI` 実行
- リグレッション調査時の CI ジョブからの失敗 shard 名または遅い shard 名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定論的な通常 CI は必要だが、Docker、QA Lab、live、クロス OS、またはパッケージボックスは不要な場合のみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` を介した `OpenClaw Release Checks` と、リリースモードの `install-smoke` ワークフローにあります。これは、ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには次が含まれます。

- 遅い Bun グローバルインストールスモークを有効にしたフルインストールスモーク
- ターゲット SHA ごとの root Dockerfile スモークイメージの準備/再利用。QR、root/gateway、installer/Bun スモークジョブは個別の install-smoke shard として実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル Plugin インストール/アンインストールレーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- release checks に live suite が含まれる場合の live/E2E provider suite と Docker live model カバレッジ

再実行する前に Docker アーティファクトを使用します。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。焦点を絞ったリカバリでは、すべてのリリースチャンクを再実行するのではなく、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは agentic behavior とチャネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには次が含まれます。

- agentic parity pack を使用して OpenAI 候補レーンを Opus 4.6 ベースラインと比較する mock parity レーン
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA レーン
- リリーステレメトリに明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

「リリースは QA シナリオと live チャネルフローで正しく動作するか」に答えるには、このボックスを使用します。リリース承認時には、parity、Matrix、Telegram レーンのアーティファクト URL を保持します。Full Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動の sharded QA-Lab 実行として引き続き利用できます。

### Package

Package ボックスは、インストール可能な製品のゲートです。これは `Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` に支えられています。このリゾルバーは候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離して保持します。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択した `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を pack
- `source=url`: 必須の `package_sha256` を含む HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行でアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、migration、update、configured-auth update restart、古い Plugin 依存関係のクリーンアップ、offline Plugin fixture、Plugin update、Telegram package QA を維持します。ブロッキング release checks はデフォルトの最新公開済みパッケージベースラインを使用します。`run_release_soak=true` または `release_profile=full` は、`2026.4.23` から `latest` までのすべての stable npm 公開済みベースラインと報告済み issue fixture に拡張されます。すでに出荷済みの候補には `source=npm` の Package Acceptance を使用し、公開前の SHA 裏付けローカル npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前は Parallels が必要だったパッケージ/update カバレッジの大半に対する GitHub ネイティブの代替です。OS 固有のオンボーディング、インストーラー、プラットフォーム動作についてはクロス OS release checks が引き続き重要ですが、パッケージ/update 製品検証では Package Acceptance を優先するべきです。

update と Plugin 検証の標準チェックリストは [Testing updates and plugins](/ja-JP/help/testing-updates-plugins) です。Plugin install/update、doctor cleanup、または公開済みパッケージ migration 変更を証明するローカル、Docker、Package Acceptance、または release-check レーンを判断するときに使用します。すべての stable `2026.4.23+` パッケージからの網羅的な公開済み update migration は、Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

従来の package-acceptance の緩和は、意図的に期限付きになっています。
`2026.4.25` までのパッケージは、すでに npm に公開済みのメタデータ欠落について互換性パスを使用できます。tarball に含まれていない private QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git fixture に含まれていないパッチファイル、永続化されていない `update.channel`、従来の plugin install-record の場所、marketplace install-record 永続化の欠落、`plugins update` 中の config メタデータ移行が対象です。公開済みの `2026.4.26` パッケージでは、すでに出荷済みのローカルビルドメタデータ stamp ファイルについて警告が出る場合があります。それ以降のパッケージは、現行のパッケージ契約を満たす必要があります。同じ欠落はリリース検証で失敗します。

リリース上の確認事項が実際にインストール可能なパッケージに関するものの場合は、より広範な Package Acceptance プロファイルを使用します。

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

- `smoke`: 簡易的なパッケージインストール/channel/agent、gateway network、config
  reload レーン
- `package`: live
  ClawHub なしでの install/update/restart/plugin パッケージ契約。これは release-check のデフォルトです
- `product`: `package` に加えて MCP channels、cron/subagent cleanup、OpenAI web
  search、OpenWebUI
- `full`: OpenWebUI を含む Docker release-path チャンク
- `custom`: 集中的な再実行のための正確な `docker_lanes` リスト

package-candidate Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。workflow は解決済みの
`package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの
Telegram workflow は、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## リリース公開自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントです。これは、リリースに必要な順序で trusted-publisher workflows を調整します。

1. リリースタグをチェックアウトし、その commit SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを確認します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と
   `ref=<release-sha>` で `Plugin NPM Release` を dispatch します。
5. 同じ scope と SHA で `Plugin ClawHub Release` を dispatch します。
6. リリースタグ、npm dist-tag、保存済みの `preflight_run_id` を指定して
   `OpenClaw NPM Release` を dispatch します。

Beta 公開例:

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

`latest` へ直接安定版を promotion する場合は明示的に指定します。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

下位レベルの `Plugin NPM Release` と `Plugin ClawHub Release` workflows は、集中的な修復または再公開作業にのみ使用します。選択した plugin の修復では、
`plugin_publish_scope=selected` と `plugins=@openclaw/name` を
`OpenClaw Release Publish` に渡すか、OpenClaw パッケージを公開してはいけない場合は子 workflow を直接 dispatch します。

## NPM workflow 入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1` のような必須のリリースタグ。`preflight_only=true` の場合は、検証専用 preflight のために現在の完全な 40 文字の workflow-branch commit SHA も使用できます
- `preflight_only`: 検証/build/package のみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスで必須です。workflow が成功した preflight run で準備された tarball を再利用できるようにします
- `npm_dist_tag`: 公開パスの npm target tag。デフォルトは `beta`

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight run id。
  `publish_openclaw_npm=true` の場合は必須です
- `npm_dist_tag`: OpenClaw パッケージの npm target tag
- `plugin_publish_scope`: デフォルトは `all-publishable`。集中的な修復作業の場合のみ `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。workflow を plugin のみの修復 orchestrator として使用する場合のみ `false` を設定します

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 検証する branch、tag、または完全な commit SHA。secret を伴うチェックでは、解決済みの commit が OpenClaw branch または release tag から到達可能である必要があります。
- `run_release_soak`: stable/default release checks で、網羅的な live/E2E、Docker release-path、all-since upgrade-survivor soak を有効にします。`release_profile=full` によって強制的に有効になります。

ルール:

- Stable tag と correction tag は `beta` または `latest` のどちらにも公開できます
- Beta prerelease tag は `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全な commit SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスは、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要があります。workflow は、公開前にそのメタデータが継続していることを確認します

## 安定版 npm リリース手順

安定版 npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - tag が存在する前は、preflight workflow の検証専用 dry run のために、現在の完全な workflow-branch commit
     SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択します。意図的に直接安定版公開を行う場合のみ `latest` を選択します
3. 1 つの手動 workflow から通常の CI に加えて live prompt cache、Docker、QA Lab、
   Matrix、Telegram coverage を得たい場合は、release branch、release tag、または完全な
   commit SHA で `Full Release Validation` を実行します
4. 決定論的な通常の test graph のみが必要な場合は、release ref で手動の
   `CI` workflow を実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` を指定して
   `OpenClaw Release Publish` を実行します。これは、OpenClaw npm パッケージを promotion する前に、外部化された plugins を npm と
   ClawHub に公開します
7. リリースが `beta` に landed した場合は、private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow を使用して、その安定版を `beta` から `latest` へ promotion します
8. リリースが意図的に `latest` へ直接公開され、`beta` も同じ安定版ビルドをすぐに追従すべき場合は、同じ private
   workflow を使用して両方の dist-tags をその安定版に向けるか、scheduled
   self-healing sync に後で `beta` を移動させます

dist-tag の変更は、セキュリティ上の理由から private repo に置かれています。これは依然として
`NPM_TOKEN` を必要とする一方で、public repo は OIDC-only publish を維持するためです。

これにより、直接公開パスと beta-first promotion パスの両方が文書化され、オペレーターから見える状態になります。

maintainer がローカル npm 認証へフォールバックする必要がある場合、1Password
CLI (`op`) コマンドは専用の tmux session 内でのみ実行します。メインの agent shell から `op` を直接呼び出さないでください。tmux 内に閉じ込めることで、prompts、
alerts、OTP 処理が観測可能になり、host alerts の反復を防げます。

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

maintainers は、実際の runbook として private release docs の
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリース channels](/ja-JP/install/development-channels)
