---
read_when:
    - 公開リリースチャンネル定義を検索しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョンの命名規則とリリース周期を探しています
summary: リリースレーン、オペレーター用チェックリスト、検証ボックス、バージョン命名、周期
title: リリース方針
x-i18n:
    generated_at: "2026-05-06T18:00:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には 3 つの公開リリースレーンがあります。

- stable: デフォルトで npm `beta` に公開されるタグ付きリリース、または明示的に要求された場合は npm `latest` に公開されるリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- 安定版リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- 安定版修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- ベータプレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日をゼロ埋めしない
- `latest` は現在昇格済みの安定版 npm リリースを意味する
- `beta` は現在のベータインストール対象を意味する
- 安定版および安定版修正リリースはデフォルトで npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にできるほか、検証済みのベータビルドを後から昇格できる
- すべての安定版 OpenClaw リリースは npm パッケージと macOS アプリを一緒に出荷する。
  ベータリリースでは通常、npm/パッケージ経路を先に検証して公開し、
  mac アプリのビルド/署名/公証は明示的に要求されない限り安定版用に予約する

## リリース周期

- リリースはベータ優先で進む
- 安定版は最新ベータが検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切る。
  これにより、リリース検証と修正が `main` での新規開発を妨げない
- ベータタグがプッシュまたは公開済みで修正が必要な場合、メンテナーは古いベータタグを削除または再作成するのではなく、
  次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用

## リリース担当者チェックリスト

このチェックリストはリリースフローの公開上の形です。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は
メンテナー専用リリースランブックに残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` の CI がブランチ元として十分にグリーンであることを確認する。
2. 実際のコミット履歴から `/changelog` で `CHANGELOG.md` の先頭セクションを書き直し、
   エントリをユーザー向けに保ち、コミットしてプッシュし、ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードをレビューする。期限切れの
   互換性はアップグレード経路が引き続きカバーされている場合にのみ削除するか、意図的に維持する理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` で直接行わない。
5. 予定タグに必要なすべてのバージョン箇所を上げ、公開可能な Plugin パッケージがリリース
   バージョンと互換性メタデータを共有するように
   `pnpm plugins:sync` を実行し、その後ローカルの決定的プリフライトを実行する:
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check`、および
   `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   検証専用プリフライトに 40 文字の完全なリリースブランチ SHA を使用できる。
   成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA を対象に `Full Release Validation` ですべての
   プレリリーステストを開始する。これは 4 つの大きなリリーステストボックス、
   Vitest、Docker、QA Lab、Package の単一の手動エントリポイントである。
8. 検証に失敗した場合は、リリースブランチ上で修正し、修正を証明する最小の失敗ファイル、
   レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行する。
   変更された対象範囲により以前の証拠が古くなる場合にのみ、包括的な全体実行を再実行する。
9. ベータの場合は `vYYYY.M.D-beta.N` をタグ付けし、その後一致する
   `release/YYYY.M.D` ブランチから `OpenClaw Release Publish` を実行する。これは `pnpm plugins:sync:check` を検証し、
   公開可能なすべての Plugin パッケージを npm へ、同じセットを
   ClawHub へ並列にディスパッチし、Plugin の npm 公開が成功し次第、一致する dist-tag で準備済みの OpenClaw npm プリフライト
   アーティファクトを昇格する。
   OpenClaw npm の公開中に ClawHub 公開がまだ実行中の場合もあるが、
   リリース公開ワークフローは Plugin の両方の公開経路と
   OpenClaw npm 公開経路が正常に完了するまで終了しない。公開後、公開済みの
   `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して公開後パッケージ
   受け入れを実行する。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、
   次に一致するプレリリース番号を切る。古い
   プレリリースを削除または書き換えない。
10. 安定版の場合は、検証済みのベータまたはリリース候補に必要な検証証拠がある場合にのみ続行する。
    安定版 npm 公開も
    `OpenClaw Release Publish` を通り、`preflight_run_id` 経由で成功済みのプリフライトアーティファクトを再利用する。安定版 macOS リリース準備完了には、
    パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および更新済みの `appcast.xml` が `main` 上にあることも必要である。
11. 公開後、npm 公開後検証ツール、公開後のチャンネル証明が必要な場合の任意のスタンドアロン
    公開済み npm Telegram E2E、必要な場合の dist-tag 昇格、完全に一致する `CHANGELOG.md` セクションからの GitHub リリース/プレリリースノート、
    およびリリース告知手順を実行する。

## リリースプリフライト

- リリース前のプリフライト前に `pnpm check:test-types` を実行し、テストの TypeScript が高速なローカル `pnpm check` ゲートの外でも対象になるようにする
- リリース前のプリフライト前に `pnpm check:architecture` を実行し、より広範なインポートサイクルとアーキテクチャ境界チェックが高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、pack 検証ステップに必要な想定の `dist/*` リリース成果物と Control UI バンドルが存在するようにする
- ルートバージョンを上げた後、タグ付けの前に `pnpm plugins:sync` を実行する。これにより、公開可能な Plugin パッケージのバージョン、OpenClaw peer/API 互換性メタデータ、ビルドメタデータ、Plugin チェンジログのスタブが、コアリリースバージョンに一致するよう更新される。`pnpm plugins:sync:check` は変更を加えないリリースガードである。このステップを忘れた場合、公開ワークフローはレジストリを変更する前に失敗する。
- リリース承認の前に手動の `Full Release Validation` ワークフローを実行し、すべてのプレリリーステストボックスを 1 つのエントリポイントから開始する。ブランチ、タグ、または完全なコミット SHA を受け取り、手動 `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab パリティ、Matrix、Telegram レーン用に `OpenClaw Release Checks` をディスパッチする。安定版/デフォルトの実行では、網羅的な live/E2E と Docker リリースパスのソークを `run_release_soak=true` の背後に維持する。`release_profile=full` はソークを強制的に有効にする。`release_profile=full` かつ `rerun_group=all` の場合、リリースチェックの `release-package-under-test` 成果物に対してパッケージ Telegram E2E も実行する。同じ Telegram E2E で公開済み npm パッケージも検証する必要がある場合は、公開後に `npm_telegram_package_spec` を指定する。Package Acceptance で SHA からビルドした成果物ではなく、出荷済み npm パッケージに対してパッケージ/更新マトリクスを実行する必要がある場合は、公開後に `package_acceptance_package_spec` を指定する。Telegram E2E を強制せず、検証が公開済み npm パッケージと一致することを非公開エビデンスレポートで証明する必要がある場合は、`evidence_package_spec` を指定する。例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を継続しながらパッケージ候補のサイドチャネル証明が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA を pack するには `source=ref` を使う。必須の SHA-256 を伴う HTTPS tarball には `source=url` を使う。別の GitHub Actions 実行によってアップロードされた tarball には `source=artifact` を使う。このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対して Telegram QA を実行できる。選択された Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージ成果物が候補となり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。`update-restart-auth` は候補パッケージをインストール済み CLI と package-under-test の両方として使い、候補更新コマンドの管理対象再起動パスを実行する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: インストール/チャンネル/エージェント、Gateway ネットワーク、構成再読み込みレーン
  - `package`: OpenWebUI や live ClawHub を含まない、成果物ネイティブのパッケージ/更新/再起動/Plugin レーン
  - `product`: package プロファイルに加えて MCP チャンネル、cron/サブエージェントクリーンアップ、OpenAI ウェブ検索、OpenWebUI
  - `full`: OpenWebUI を含む Docker リリースパスチャンク
  - `custom`: 集中的な再実行のための正確な `docker_lanes` 選択
- リリース候補に対して通常の CI 全体のカバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは changed スコープをバイパスし、Linux Node シャード、同梱 Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python Skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリーステレメトリを検証するときは `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP レシーバーを通じて QA-lab を実行し、Opik、Langfuse、または他の外部コレクターを必要とせずに、エクスポートされた trace span 名、境界付き属性、コンテンツ/識別子の秘匿化を検証する。
- すべてのタグ付きリリースの前に `pnpm release:check` を実行する
- タグが存在した後、変更を伴う公開シーケンスとして `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` からディスパッチし（または main から到達可能なタグを公開する場合は `main` から）、リリースタグと成功した OpenClaw npm `preflight_run_id` を渡し、意図的に集中的な修復を実行する場合を除き、デフォルトの Plugin 公開スコープ `all-publishable` を維持する。このワークフローは Plugin npm publish、Plugin ClawHub publish、OpenClaw npm publish を直列化し、外部化された Plugin より前にコアパッケージが公開されないようにする。
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab mock パリティレーンに加えて、高速な live Matrix プロファイルと Telegram QA レーンも実行する。live レーンは `qa-live-shared` 環境を使う。Telegram は Convex CI 認証情報リースも使う。Matrix トランスポート、メディア、E2EE インベントリ全体を並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` を指定して手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS のインストールおよびアップグレード実行時検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、再利用可能ワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的である。実際の npm リリースパスは短く、決定的で、成果物に集中させる一方、遅い live チェックは独自のレーンに置き、公開を停滞またはブロックしないようにする
- シークレットを含むリリースチェックは、`Full Release Validation` 経由、または `main`/release ワークフロー ref からディスパッチし、ワークフローロジックとシークレットを管理下に保つ必要がある
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け取る
- `OpenClaw NPM Release` の検証専用プリフライトは、push 済みタグを要求せずに、現在の完全な 40 文字のワークフローブランチコミット SHA も受け取る
- その SHA パスは検証専用であり、実際の公開に昇格できない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要である
- 両方のワークフローは、実際の公開と昇格パスを GitHub ホストランナー上に維持する一方、変更を伴わない検証パスではより大きな Blacksmith Linux ランナーを使える
- そのワークフローは、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使って、`OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行する
- npm リリースプリフライトは、別個のリリースチェックレーンを待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応する beta/correction タグ）を実行する
- npm publish 後に `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応する beta/correction バージョン）を実行し、新しい一時 prefix で公開済みレジストリのインストールパスを検証する
- beta publish 後に `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行し、共有のリース済み Telegram 認証情報プールを使って、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証する。ローカルメンテナーの単発実行では Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` env 認証情報を直接渡してもよい。
- メンテナーマシンから完全な公開後 beta スモークを実行するには、`pnpm release:beta-smoke -- --beta betaN` を使う。このヘルパーは Parallels npm update/fresh-target 検証を実行し、`NPM Telegram Beta E2E` をディスパッチし、正確なワークフロー実行をポーリングし、成果物をダウンロードして Telegram レポートを出力する。
- メンテナーは、手動の `NPM Telegram Beta E2E` ワークフローを通じて、GitHub Actions から同じ公開後チェックを実行できる。これは意図的に手動専用であり、すべてのマージでは実行されない。
- メンテナーのリリース自動化は現在、preflight-then-promote を使う:
  - 実際の npm publish は、成功した npm `preflight_run_id` を通過する必要がある
  - 実際の npm publish は、成功したプリフライト実行と同じ `main` または `release/YYYY.M.D` ブランチからディスパッチする必要がある
  - 安定版 npm リリースのデフォルトは `beta`
  - 安定版 npm publish は、ワークフロー入力で明示的に `latest` を対象にできる
  - token ベースの npm dist-tag 変更は現在、セキュリティのため `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` にある。これは、公開リポジトリが OIDC のみの publish を維持する一方で、`npm dist-tag add` には引き続き `NPM_TOKEN` が必要なためである
  - 公開 `macOS Release` は検証専用である。タグがリリースブランチ上にのみ存在し、ワークフローが `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の非公開 mac publish は、成功した非公開 mac `preflight_run_id` と `validate_run_id` を通過する必要がある
  - 実際の公開パスは、準備済み成果物を再ビルドするのではなく昇格させる
- `YYYY.M.D-N` のような安定版修正リリースでは、公開後検証ツールは同じ一時 prefix のアップグレードパスも `YYYY.M.D` から `YYYY.M.D-N` までチェックし、リリース修正によって古いグローバルインストールがベース安定版ペイロードのまま静かに残らないようにする
- npm リリースプリフライトは、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれない限り閉じる形で失敗し、空のブラウザダッシュボードを再び出荷しないようにする
- 公開後検証では、公開済み Plugin エントリポイントとパッケージメタデータが、インストール済みレジストリレイアウトに存在することもチェックする。Plugin 実行時ペイロードが欠落したリリースは postpublish 検証ツールで失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は、候補更新 tarball に対して npm pack の `unpackedSize` 予算も強制するため、インストーラー e2e はリリース公開パスの前に意図しない pack 肥大化を検出する
- リリース作業で CI 計画、Plugin タイミングマニフェスト、または Plugin テストマトリクスに触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` の planner 所有 `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートが古い CI レイアウトを説明しないようにする
- 安定版 macOS リリース準備には updater サーフェスも含まれる:
  - GitHub リリースには、最終的にパッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が含まれている必要がある
  - `main` 上の `appcast.xml` は、公開後に新しい安定版 zip を指す必要がある
  - パッケージ化されたアプリは、非デバッグ bundle id、空でない Sparkle feed URL、そのリリースバージョンに対する正準の Sparkle ビルド下限以上の `CFBundleVersion` を維持する必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターがすべてのプレリリーステストを 1 つのエントリポイントから開始する方法である。動きの速いブランチで固定コミットの証明を行う場合は、すべての子ワークフローが対象 SHA に固定された一時ブランチから実行されるように、ヘルパーを使う:

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` を push し、そのブランチから `ref=<sha>` で `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象に一致することを検証してから、一時ブランチを削除する。これにより、誤って新しい `main` の子実行を証明してしまうことを避けられる。

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

このワークフローは対象 ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備し、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後、`OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA を含む Package Acceptance、QA Lab パリティ、live Matrix、live Telegram へ展開します。フル実行が許容されるのは、`Full Release Validation` のサマリーで `normal_ci` と `release_checks` が成功と表示されている場合のみです。full/all モードでは、`npm_telegram` 子ワークフローも成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が提供されていない限りスキップされます。最終検証サマリーには各子実行の最遅ジョブ表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。完全なステージマトリクス、正確なワークフロージョブ名、stable と full プロファイルの違い、アーティファクト、重点的な再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation)を参照してください。子ワークフローは、対象の `ref` が古いリリースブランチやタグを指している場合でも、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。Full Release Validation 用の個別の workflow-ref 入力はありません。ワークフロー実行 ref を選ぶことで、信頼済みハーネスを選択します。移動する `main` 上の正確なコミット証明に `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使用してピン留めされた一時ブランチを作成します。

live/provider の範囲を選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: リリース承認用の stable provider/backend カバレッジを minimum に追加
- `full`: 広範な advisory provider/media カバレッジを stable に追加

リリースをブロックするレーンが green で、昇格前に徹底的な live/E2E、Docker リリースパス、境界付き公開済みアップグレードサバイバー sweep を実行したい場合は、`stable` とともに `run_release_soak=true` を使用します。その sweep は、最新 4 つの stable パッケージに加え、ピン留めされた `2026.4.23` と `2026.5.2` のベースライン、さらに古い `2026.4.15` のカバレッジを対象にし、重複するベースラインを削除して、各ベースラインを個別の Docker runner ジョブにシャードします。`full` は `run_release_soak=true` を含意します。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用して対象 ref を一度 `release-package-under-test` として解決し、soak 実行時にそのアーティファクトを cross-OS、Package Acceptance、リリースパス Docker チェックで再利用します。これにより、すべてのパッケージ向けボックスが同一バイト列を使用し、繰り返しのパッケージビルドを避けられます。cross-OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外は `openai/gpt-5.4` を使用します。このレーンは最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、gateway 起動、live agent turn 1 回を証明するためです。より広範な live provider マトリクスが、モデル固有カバレッジの場所として残ります。

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

重点的な修正後の最初の再実行として、フルの umbrella を使用しないでください。1 つのボックスが失敗した場合は、次の証明には失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用します。修正が共有リリースオーケストレーションを変更した場合、または以前の全ボックス証拠が古くなった場合にのみ、フルの umbrella を再実行します。umbrella の最終検証は記録済みの子ワークフロー実行 ID を再チェックするため、子ワークフローが正常に再実行された後は、失敗した親ジョブ `Verify full validation` のみを再実行します。

境界付きリカバリーでは、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子ワークフローのみを実行、`plugin-prerelease` はリリース専用 Plugin 子ワークフローのみを実行、`release-checks` はすべてのリリースボックスを実行します。より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。重点的な `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行では、release-checks パッケージアーティファクトを使用します。重点的な cross-OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/suite フィルターを追加できます。QA release-check の失敗は advisory です。QA のみの失敗はリリース検証をブロックしません。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に changed scoping を迂回し、リリース候補に対して通常のテストグラフを強制します。Linux Node シャード、バンドル Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python Skills、Windows、macOS、Android、Control UI i18n です。

このボックスは「ソースツリーが完全な通常テストスイートに合格したか」に答えるために使用します。これはリリースパスの製品検証とは同じではありません。保持する証拠:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確な対象 SHA 上で green の `CI` 実行
- 回帰を調査する際の CI ジョブからの失敗または遅いシャード名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定論的な通常 CI が必要だが、Docker、QA Lab、live、cross-OS、またはパッケージボックスが不要な場合のみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは `openclaw-live-and-e2e-checks-reusable.yml` を通じて `OpenClaw Release Checks` 内にあり、さらにリリースモードの `install-smoke` ワークフローにもあります。これは、ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには以下が含まれます。

- 遅い Bun グローバルインストールスモークを有効にした完全なインストールスモーク
- 対象 SHA ごとの root Dockerfile スモークイメージ準備/再利用。QR、root/gateway、installer/Bun スモークジョブは個別の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル Plugin インストール/アンインストールレーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- release checks に live suites が含まれる場合の live/E2E provider suites と Docker live model カバレッジ

再実行の前に Docker アーティファクトを使用します。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。重点的なリカバリーでは、すべてのリリースチャンクを再実行する代わりに、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは agentic behavior とチャネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには以下が含まれます。

- agentic parity pack を使用して OpenAI candidate レーンを Opus 4.6 ベースラインと比較する mock parity レーン
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA レーン
- リリーステレメトリに明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

このボックスは「リリースが QA シナリオと live チャネルフローで正しく動作するか」に答えるために使用します。リリース承認時には、parity、Matrix、Telegram レーンのアーティファクト URL を保持します。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージボックスは、インストール可能な製品ゲートです。これは `Package Acceptance` と resolver `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。resolver は candidate を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離して維持します。

サポートされる candidate source:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択した `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を pack
- `source=url`: 必須の `package_sha256` を伴う HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、migration、update、configured-auth update restart、古い Plugin 依存関係のクリーンアップ、offline Plugin fixtures、Plugin update、Telegram パッケージ QA を維持します。ブロックする release checks は、デフォルトの最新公開済みパッケージベースラインを使用します。`run_release_soak=true` または `release_profile=full` は、`2026.4.23` から `latest` までのすべての stable npm 公開済みベースラインに加えて、報告済み issue fixtures へ拡張されます。すでに出荷済みの candidate には `source=npm` の Package Acceptance を使用し、publish 前の SHA-backed local npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前は Parallels が必要だった package/update カバレッジの大半に対する GitHub-native replacement です。OS 固有のオンボーディング、installer、platform behavior には cross-OS release checks が引き続き重要ですが、package/update product validation では Package Acceptance を優先する必要があります。

update と Plugin 検証の正規チェックリストは [update と Plugin のテスト](/ja-JP/help/testing-updates-plugins) です。Plugin の install/update、doctor cleanup、または published-package migration change をどの local、Docker、Package Acceptance、または release-check lane が証明するかを判断する際に使用してください。すべての stable `2026.4.23+` パッケージからの exhaustive published update migration は、Full Release CI の一部ではなく、個別の手動 `Update Migration` ワークフローです。

レガシーな package-acceptance の緩和は、意図的に期限付きになっています。
`2026.4.25` までのパッケージでは、すでに npm に公開済みのメタデータ不足について互換性パスを使用できます。対象は、tarball に含まれていない private QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落したパッチファイル、永続化されていない `update.channel`、レガシーな plugin install-record の場所、欠落した marketplace install-record の永続化、`plugins update` 中の config メタデータ移行です。公開済みの `2026.4.26` パッケージでは、すでに出荷済みのローカルビルドメタデータスタンプファイルについて警告が出る場合があります。それ以降のパッケージは、現代的なパッケージ契約を満たす必要があります。同じ不足はリリース検証で失敗します。

リリース上の確認事項が実際にインストール可能なパッケージに関するものの場合は、より広い Package Acceptance プロファイルを使用します。

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

- `smoke`: 素早いパッケージインストール、channel、agent、Gateway ネットワーク、config
  reload レーン
- `package`: live
  ClawHub なしの install/update/restart/plugin パッケージ契約。これは release-check のデフォルトです
- `product`: `package` に MCP channel、cron/subagent cleanup、OpenAI web
  search、OpenWebUI を加えたもの
- `full`: OpenWebUI 付きの Docker release-path チャンク
- `custom`: 集中的な再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。ワークフローは解決済みの `package-under-test` tarball を Telegram レーンへ渡します。スタンドアロンの Telegram ワークフローは、公開後チェック用に引き続き公開済み npm spec を受け付けます。

## リリース公開自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントです。
リリースに必要な順序で trusted-publisher ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、その commit SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを検証します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で `Plugin NPM Release` を dispatch します。
5. 同じ scope と SHA で `Plugin ClawHub Release` を dispatch します。
6. リリースタグ、npm dist-tag、保存済みの `preflight_run_id` を使って `OpenClaw NPM Release` を dispatch します。

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

`latest` への Stable 昇格は明示的です。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、集中的な修復または再公開作業にのみ使用します。選択した plugin の修復では、`plugin_publish_scope=selected` と `plugins=@openclaw/name` を
`OpenClaw Release Publish` に渡すか、OpenClaw パッケージを公開してはならない場合は子ワークフローを直接 dispatch します。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証専用 preflight 用に現在の完全な 40 文字 workflow-branch commit SHA も使用できます
- `preflight_only`: 検証、ビルド、パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスでは必須です。ワークフローが成功した preflight run から準備済み tarball を再利用できるようにします
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight run id。
  `publish_openclaw_npm=true` の場合は必須です
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。集中的な修復作業の場合にのみ `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合のカンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを plugin のみの修復オーケストレーターとして使う場合にのみ `false` に設定します

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 検証する branch、tag、または完全な commit SHA。シークレットを含むチェックでは、解決済みの commit が OpenClaw branch または release tag から到達可能である必要があります。
- `run_release_soak`: stable/default release checks で、包括的な live/E2E、Docker release-path、all-since upgrade-survivor soak を明示的に有効にします。`release_profile=full` により強制的に有効になります。

ルール:

- Stable タグと correction タグは `beta` または `latest` のどちらにも公開できます
- Beta prerelease タグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全な commit SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは、公開前にそのメタデータが継続していることを検証します

## Stable npm リリース手順

Stable npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、preflight ワークフローの検証専用 dry run に現在の完全な workflow-branch commit SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択し、直接 stable 公開を意図している場合にのみ `latest` を選択します
3. 1 つの手動ワークフローから通常の CI に加えて live prompt cache、Docker、QA Lab、Matrix、Telegram coverage を得たい場合は、release branch、release tag、または完全な commit SHA で `Full Release Validation` を実行します
4. 意図的に決定的な通常テストグラフだけが必要な場合は、代わりに release ref で手動の `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` で `OpenClaw Release Publish` を実行します。これは OpenClaw npm パッケージを昇格する前に、外部化された plugins を npm と ClawHub に公開します
7. リリースが `beta` に着地した場合は、private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使用して、その stable バージョンを `beta` から `latest` に昇格します
8. リリースが意図的に直接 `latest` へ公開され、`beta` も同じ stable build をすぐに追従させる必要がある場合は、同じ private ワークフローを使って両方の dist-tag を stable バージョンに向けるか、スケジュールされた自己修復 sync により後で `beta` を移動させます

dist-tag の変更は、依然として `NPM_TOKEN` を必要とするため、セキュリティ上の理由で private repo にあります。一方、public repo は OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first 昇格パスの両方が文書化され、オペレーターに見える状態になります。

maintainer がローカル npm 認証へフォールバックする必要がある場合、1Password
CLI (`op`) コマンドは専用の tmux セッション内でのみ実行します。メイン agent shell から `op` を直接呼び出さないでください。tmux 内に保持すると、プロンプト、アラート、OTP 処理を観測可能にし、ホストアラートの繰り返しを防げます。

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

Maintainers は、実際の runbook には
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
にある private release docs を使用します。

## 関連

- [リリースチャンネル](/ja-JP/install/development-channels)
