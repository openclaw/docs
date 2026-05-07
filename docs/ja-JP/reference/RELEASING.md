---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名規則とリリース周期を探しています
summary: リリースレーン、オペレーターチェックリスト、検証ボックス、バージョン命名、周期
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-07T13:26:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
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
- `latest` は現在プロモートされている安定版 npm リリースを意味する
- `beta` は現在の beta インストール対象を意味する
- 安定版および安定版修正リリースは、デフォルトでは npm `beta` に公開される。リリースオペレーターは明示的に `latest` を対象にするか、検証済みの beta ビルドを後でプロモートできる
- すべての安定版 OpenClaw リリースでは npm パッケージと macOS アプリを一緒に出荷する。
  beta リリースでは通常、まず npm/パッケージ経路を検証して公開し、
  mac アプリのビルド/署名/公証は、明示的に要求されない限り安定版用に予約する

## リリース cadence

- リリースは beta 優先で進む
- 安定版は最新の beta が検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切る。
  これにより、リリース検証と修正が `main` 上の新規開発をブロックしない
- beta タグがプッシュまたは公開済みで修正が必要な場合、メンテナーは古い beta タグを削除または再作成するのではなく、
  次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用

## リリースオペレーターのチェックリスト

このチェックリストは、リリースフローの公開されている形です。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は
メンテナー専用リリース手順書に残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュされていることを確認し、
   現在の `main` CI がブランチ作成に十分な程度に green であることを確認する。
2. 実際のコミット履歴に基づいて `/changelog` で最上位の `CHANGELOG.md` セクションを書き直し、
   エントリをユーザー向けに保ち、コミットしてプッシュし、ブランチ作成前に
   もう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードを確認する。期限切れの
   互換性は、アップグレード経路が引き続きカバーされている場合にのみ削除するか、意図的に
   維持する理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` で直接行わない。
5. 意図したタグに必要なすべてのバージョン箇所を更新し、
   `pnpm plugins:sync` を実行して、公開可能な Plugin パッケージがリリース
   バージョンと互換性メタデータを共有するようにする。その後、ローカルの決定論的 preflight を実行する:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, および
   `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   検証専用の preflight に、40文字の完全なリリースブランチ SHA を使用できる。
   成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` を使い、
   すべてのプレリリーステストを開始する。これは4つの大きなリリーステストボックス
   Vitest、Docker、QA Lab、Package のための唯一の手動エントリーポイントです。
8. 検証が失敗した場合は、リリースブランチで修正し、その修正を証明する最小の
   失敗ファイル、レーン、workflow job、パッケージプロファイル、プロバイダー、またはモデル allowlist を
   再実行する。変更された surface によって以前の証拠が古くなる場合にのみ、
   full umbrella を再実行する。
9. beta では、`vYYYY.M.D-beta.N` をタグ付けし、対応する `release/YYYY.M.D` ブランチから
   `OpenClaw Release Publish` を実行する。これは `pnpm plugins:sync:check` を検証し、
   公開可能なすべての Plugin パッケージを npm に、同じセットを
   ClawHub に並列で dispatch し、Plugin の npm 公開が成功するとすぐに、
   対応する dist-tag で準備済みの OpenClaw npm preflight artifact をプロモートする。
   OpenClaw npm の公開中も ClawHub 公開はまだ実行中の場合があるが、
   release publish workflow は、Plugin の両方の公開経路と
   OpenClaw npm 公開経路が正常に完了するまで終了しない。公開後、
   公開された `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して post-publish package
   acceptance を実行する。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、
   次の対応するプレリリース番号を切る。古い
   プレリリースを削除または書き換えない。
10. 安定版では、検証済み beta またはリリース候補に必要な検証証拠がある場合にのみ続行する。
    安定版 npm 公開も `OpenClaw Release Publish` を経由し、
    `preflight_run_id` を使って成功済み preflight artifact を再利用する。安定版 macOS リリースの準備完了には、
    パッケージ化された `.zip`, `.dmg`, `.dSYM.zip` と、
    `main` 上の更新済み `appcast.xml` も必要です。
11. 公開後、npm post-publish verifier、公開後のチャンネル証明が必要な場合のオプションの standalone
    published-npm Telegram E2E、必要に応じた dist-tag プロモーション、
    完全に対応する `CHANGELOG.md` セクションに基づく GitHub release/prerelease notes、
    そしてリリース告知手順を実行する。

## リリース preflight

- リリースプレフライトの前に `pnpm check:test-types` を実行して、より高速なローカル `pnpm check` ゲートの外でもテスト TypeScript が対象に含まれるようにする
- リリースプレフライトの前に `pnpm check:architecture` を実行して、より広範なインポートサイクルとアーキテクチャ境界チェックが、より高速なローカルゲートの外でも成功するようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行して、期待される `dist/*` リリース成果物と Control UI バンドルがパック検証ステップで存在するようにする
- ルートのバージョン更新後、タグ付けの前に `pnpm plugins:sync` を実行する。これは公開可能な Plugin パッケージバージョン、OpenClaw の peer/API 互換メタデータ、ビルドメタデータ、Plugin 変更履歴スタブを、コアリリースバージョンに合わせて更新する。`pnpm plugins:sync:check` は変更を行わないリリースガードであり、このステップを忘れていた場合、公開ワークフローはレジストリ変更の前に失敗する。
- リリース承認の前に手動の `Full Release Validation` ワークフローを実行して、すべてのプレリリーステストボックスを 1 つのエントリポイントから開始する。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動の `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab パリティ、Matrix、Telegram レーン用に `OpenClaw Release Checks` をディスパッチする。stable/default 実行では、網羅的な live/E2E と Docker リリースパスの soak は `run_release_soak=true` の後ろに保持される。`release_profile=full` は soak を強制的に有効にする。`release_profile=full` と `rerun_group=all` を指定すると、リリースチェックの `release-package-under-test` 成果物に対してパッケージ Telegram E2E も実行する。同じ Telegram E2E で公開済み npm パッケージも証明する必要がある場合は、公開後に `npm_telegram_package_spec` を指定する。Package Acceptance が SHA からビルドした成果物ではなく出荷済み npm パッケージに対してパッケージ/更新マトリクスを実行する必要がある場合は、公開後に `package_acceptance_package_spec` を指定する。Telegram E2E を強制せず、プライベート証拠レポートで検証が公開済み npm パッケージと一致することを証明する必要がある場合は、`evidence_package_spec` を指定する。例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を続けながらパッケージ候補のサイドチャネル証明が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA をパックするには `source=ref` を使う。必須の SHA-256 付き HTTPS tarball には `source=url` を使う。別の GitHub Actions 実行でアップロードされた tarball には `source=artifact` を使う。このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対する Telegram QA を実行できる。選択した Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージ成果物が候補になり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。`update-restart-auth` は候補パッケージをインストール済み CLI と package-under-test の両方として使うため、候補の更新コマンドのマネージド再起動パスを検証する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  共通プロファイル:
  - `smoke`: インストール/チャネル/エージェント、Gateway ネットワーク、設定リロードレーン
  - `package`: OpenWebUI や live ClawHub を含まない、成果物ネイティブのパッケージ/更新/再起動/Plugin レーン
  - `product`: パッケージプロファイルに加えて、MCP チャネル、cron/サブエージェントのクリーンアップ、OpenAI Web 検索、OpenWebUI
  - `full`: OpenWebUI 付きの Docker リリースパスチャンク
  - `custom`: 集中的な再実行のための正確な `docker_lanes` 選択
- リリース候補に対して通常の完全な CI カバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは変更スコープをバイパスし、Linux Node シャード、バンドル済み Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリーステレメトリを検証する場合は `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP レシーバーを通じて QA-lab を実行し、Opik、Langfuse、または別の外部コレクターを必要とせずに、エクスポートされたトレーススパン名、境界付き属性、コンテンツ/識別子のリダクションを検証する。
- すべてのタグ付きリリースの前に `pnpm release:check` を実行する
- タグが存在した後、変更を行う公開シーケンスとして `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` からディスパッチする（main から到達可能なタグを公開する場合は `main` から）。リリースタグと成功した OpenClaw npm `preflight_run_id` を渡し、意図的に集中的な修復を実行している場合を除き、デフォルトの Plugin 公開スコープ `all-publishable` を維持する。このワークフローは Plugin npm 公開、Plugin ClawHub 公開、OpenClaw npm 公開を直列化し、外部化された Plugin より前にコアパッケージが公開されないようにする。
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` はリリース承認の前に、QA Lab モックパリティレーンに加えて高速 live Matrix プロファイルと Telegram QA レーンも実行する。live レーンは `qa-live-shared` 環境を使い、Telegram は Convex CI 資格情報リースも使う。完全な Matrix トランスポート、メディア、E2EE インベントリを並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` を指定して手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS のインストールおよびアップグレード実行時検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、再利用可能ワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの。実際の npm リリースパスは短く、決定的で、成果物に集中したものに保ち、遅い live チェックは独自のレーンに置くことで、公開を停滞またはブロックしないようにする
- シークレットを含むリリースチェックは、`Full Release Validation` 経由、または `main`/release ワークフロー ref からディスパッチして、ワークフローロジックとシークレットが管理された状態を保つようにする
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け入れる
- `OpenClaw NPM Release` の検証専用プレフライトも、プッシュ済みタグを要求せず、現在の完全な 40 文字のワークフローブランチコミット SHA を受け入れる
- その SHA パスは検証専用であり、実際の公開へ昇格できない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要
- どちらのワークフローも、実際の公開と昇格パスは GitHub ホストランナー上に維持し、変更を行わない検証パスではより大きな Blacksmith Linux ランナーを使える
- そのワークフローは `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行し、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使う
- npm リリースプレフライトは、別のリリースチェックレーンを待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応する beta/修正版タグ）を実行する
- npm 公開後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応する beta/修正版）を実行して、新しい一時 prefix で公開済みレジストリのインストールパスを検証する
- beta 公開後、共有リース Telegram 資格情報プールを使って、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証するために、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行する。メンテナーのローカル単発実行では、Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` 環境資格情報を直接渡してもよい。
- メンテナーマシンから完全な公開後 beta スモークを実行するには、`pnpm release:beta-smoke -- --beta betaN` を使う。このヘルパーは Parallels の npm update/fresh-target 検証を実行し、`NPM Telegram Beta E2E` をディスパッチし、正確なワークフロー実行をポーリングし、成果物をダウンロードして Telegram レポートを出力する。
- メンテナーは GitHub Actions から手動の `NPM Telegram Beta E2E` ワークフロー経由で同じ公開後チェックを実行できる。これは意図的に手動専用であり、すべてのマージで実行されるものではない。
- メンテナーのリリース自動化は現在、preflight-then-promote を使う:
  - 実際の npm 公開は、成功した npm `preflight_run_id` に合格している必要がある
  - 実際の npm 公開は、成功したプレフライト実行と同じ `main` または `release/YYYY.M.D` ブランチからディスパッチされている必要がある
  - stable npm リリースのデフォルトは `beta`
  - stable npm 公開は、ワークフロー入力で明示的に `latest` を対象にできる
  - トークンベースの npm dist-tag 変更は、セキュリティのため現在 `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` にある。これは、公開リポジトリが OIDC のみの公開を維持する一方で、`npm dist-tag add` には引き続き `NPM_TOKEN` が必要なため
  - 公開 `macOS Release` は検証専用。タグがリリースブランチ上にのみ存在し、ワークフローが `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際のプライベート mac 公開は、成功したプライベート mac `preflight_run_id` と `validate_run_id` に合格している必要がある
  - 実際の公開パスは、成果物を再ビルドするのではなく、準備済み成果物を昇格する
- `YYYY.M.D-N` のような stable 修正リリースでは、公開後検証ツールは同じ一時 prefix の `YYYY.M.D` から `YYYY.M.D-N` へのアップグレードパスもチェックするため、リリース修正によって古いグローバルインストールが base stable ペイロードのまま密かに残ることがない
- npm リリースプレフライトは、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り fail closed するため、空のブラウザダッシュボードを再び出荷しない
- 公開後検証は、公開済み Plugin エントリポイントとパッケージメタデータがインストール済みレジストリレイアウトに存在することもチェックする。Plugin 実行時ペイロードが欠落したリリースは postpublish 検証ツールで失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は候補更新 tarball に対して npm pack の `unpackedSize` 予算も強制するため、インストーラー e2e はリリース公開パスの前に意図しない pack 肥大化を検出する
- リリース作業で CI 計画、Plugin タイミングマニフェスト、または Plugin テストマトリクスに触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` からプランナー所有の `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートが古い CI レイアウトを説明しないようにする
- stable macOS リリース準備にはアップデーターサーフェスも含まれる:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - `main` 上の `appcast.xml` は、公開後に新しい stable zip を指している必要がある
  - パッケージ化されたアプリは、非デバッグの bundle id、空でない Sparkle feed URL、そのリリースバージョンの正準 Sparkle ビルド下限以上の `CFBundleVersion` を維持している必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターがすべてのプレリリーステストを 1 つのエントリポイントから開始する方法。変化の速いブランチでピン留めされたコミット証明が必要な場合は、すべての子ワークフローが対象 SHA に固定された一時ブランチから実行されるように、ヘルパーを使う:

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` をプッシュし、そのブランチから `ref=<sha>` 付きで `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証してから、一時ブランチを削除する。これにより、誤って新しい `main` の子実行を証明してしまうことを避けられる。

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

このワークフローはターゲット ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備し、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後 `OpenClaw Release Checks` は、install smoke、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA を含む Package Acceptance、QA Lab parity、live Matrix、live Telegram に展開します。フル実行が許容されるのは、`Full Release Validation` のサマリーで `normal_ci` と `release_checks` が成功と表示されている場合だけです。full/all モードでは、`npm_telegram` 子ワークフローも成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が指定されていない限りスキップされます。最終 verifier サマリーには各子実行の最遅ジョブ表が含まれるため、リリース管理者はログをダウンロードせずに現在のクリティカルパスを確認できます。完全なステージマトリックス、正確なワークフロージョブ名、stable と full プロファイルの違い、アーティファクト、フォーカスした再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation) を参照してください。子ワークフローは、ターゲット `ref` が古いリリースブランチやタグを指している場合でも、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。個別の Full Release Validation workflow-ref 入力はありません。ワークフロー実行 ref を選んで、信頼済みハーネスを選択してください。移動する `main` 上の正確なコミット証明に `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使用して固定された一時ブランチを作成してください。

`release_profile` を使用して live/provider の広さを選択します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: リリース承認用に minimum に stable provider/backend カバレッジを追加
- `full`: stable に広範な advisory provider/media カバレッジを追加

リリースをブロックする lane が green で、昇格前に網羅的な live/E2E、Docker リリースパス、境界付きの公開済み upgrade-survivor sweep を行いたい場合は、`stable` とともに `run_release_soak=true` を使用します。この sweep は、最新 4 つの stable パッケージに加えて固定された `2026.4.23` と `2026.5.2` ベースライン、さらに古い `2026.4.15` カバレッジを対象にし、重複するベースラインを除去し、各ベースラインを独自の Docker runner ジョブにシャードします。`full` は `run_release_soak=true` を意味します。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用してターゲット ref を一度だけ `release-package-under-test` として解決し、soak 実行時にはそのアーティファクトを cross-OS、Package Acceptance、release-path Docker チェックで再利用します。これにより、すべてのパッケージ向け box が同じバイト列を使用し、繰り返しのパッケージビルドを避けられます。cross-OS OpenAI install smoke は、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外は `openai/gpt-5.4` を使用します。この lane は最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回の live agent ターンを証明するためです。より広い live provider マトリックスが、モデル固有カバレッジの場所のままです。

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

フォーカスした修正の後の最初の再実行として、フル umbrella を使用しないでください。1 つの box が失敗した場合は、次の証明には失敗した子ワークフロー、ジョブ、Docker lane、パッケージプロファイル、モデルプロバイダー、または QA lane を使用します。修正が共有リリースオーケストレーションを変更した場合、または以前の全 box エビデンスが古くなった場合にのみ、フル umbrella を再度実行してください。umbrella の最終 verifier は記録済みの子ワークフロー実行 ID を再チェックするため、子ワークフローを正常に再実行した後は、失敗した親 `Verify full validation` ジョブだけを再実行します。

境界付きリカバリでは、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子ワークフローのみ、`plugin-prerelease` はリリース専用 Plugin 子ワークフローのみ、`release-checks` はすべてのリリース box を実行します。より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。フォーカスした `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行では、release-checks のパッケージアーティファクトを使用します。フォーカスした cross-OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/suite フィルターを追加できます。QA release-check の失敗は advisory です。QA のみの失敗はリリース検証をブロックしません。

### Vitest

Vitest box は手動 `CI` 子ワークフローです。手動 CI は意図的に changed scoping をバイパスし、リリース候補に対して通常のテストグラフを強制します。Linux Node shard、バンドル済み Plugin shard、channel contract、Node 22 互換性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android、Control UI i18n です。

この box は「ソースツリーが通常のフルテストスイートに合格したか」に答えるために使用します。これは release-path のプロダクト検証と同じではありません。保持するエビデンス:

- ディスパッチされた `CI` 実行 URL を表示する `Full Release Validation` サマリー
- 正確なターゲット SHA で green の `CI` 実行
- 回帰調査時の CI ジョブからの失敗または遅い shard 名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定論的な通常 CI が必要で、Docker、QA Lab、live、cross-OS、または package box が不要な場合にのみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box は、`openclaw-live-and-e2e-checks-reusable.yml` を通じた `OpenClaw Release Checks` と、release-mode の `install-smoke` ワークフローに存在します。これは、ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには以下が含まれます。

- 遅い Bun グローバル install smoke を有効にしたフル install smoke
- ターゲット SHA ごとの root Dockerfile smoke イメージ準備/再利用。QR、root/Gateway、installer/Bun smoke ジョブは個別の install-smoke shard として実行
- リポジトリ E2E lane
- release-path Docker chunk: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` chunk 内の OpenWebUI カバレッジ
- 分割されたバンドル済み Plugin install/uninstall lane `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- release checks に live suite が含まれる場合の live/E2E provider suite と Docker live model カバレッジ

再実行する前に Docker アーティファクトを使用してください。release-path scheduler は、lane ログ、`summary.json`、`failures.json`、フェーズタイミング、scheduler plan JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。フォーカスしたリカバリでは、すべてのリリース chunk を再実行するのではなく、再利用可能 live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗した lane は同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab box も `OpenClaw Release Checks` の一部です。これは、Vitest や Docker パッケージ機構とは別の、agentic behavior と channel-level のリリースゲートです。

リリース QA Lab カバレッジには以下が含まれます。

- agentic parity pack を使用して OpenAI 候補 lane を Opus 4.6 ベースラインと比較する mock parity lane
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA lane
- リリーステレメトリに明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

この box は「リリースが QA シナリオと live channel フローで正しく動作するか」に答えるために使用します。リリース承認時には parity、Matrix、Telegram lane のアーティファクト URL を保持してください。フル Matrix カバレッジは、デフォルトのリリースクリティカル lane ではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### Package

Package box はインストール可能プロダクトのゲートです。これは `Package Acceptance` と resolver `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。resolver は候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージ inventory を検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離して維持します。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択した `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を pack
- `source=url`: 必須の `package_sha256` とともに HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、migration、update、configured-auth update restart、古い Plugin 依存関係の cleanup、offline Plugin fixture、Plugin update、Telegram package QA を維持します。ブロック対象の release checks は、デフォルトの最新公開済みパッケージベースラインを使用します。`run_release_soak=true` または `release_profile=full` では、`2026.4.23` から `latest` までのすべての stable npm 公開済みベースラインと、報告済み issue fixture に拡張されます。すでに出荷済みの候補には `source=npm` の Package Acceptance を使用し、公開前の SHA に裏付けられたローカル npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前 Parallels が必要だった package/update カバレッジの大半に対する GitHub ネイティブな代替です。cross-OS release checks は OS 固有のオンボーディング、installer、platform behavior に引き続き重要ですが、package/update のプロダクト検証では Package Acceptance を優先すべきです。

update と Plugin 検証の標準チェックリストは [update と Plugin のテスト](/ja-JP/help/testing-updates-plugins) です。Plugin install/update、doctor cleanup、または公開済みパッケージ migration の変更を証明する local、Docker、Package Acceptance、または release-check lane を判断するときに使用してください。すべての stable `2026.4.23+` パッケージからの網羅的な公開済み update migration は、Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

レガシーパッケージ受け入れの許容は、意図的に期限付きにしています。
`2026.4.25` までのパッケージは、npm にすでに公開済みのメタデータ不足に対して互換パスを使用できます。具体的には、tarball に含まれていないプライベート QA インベントリエントリ、欠落した
`gateway install --wrapper`、tarball 由来の git
フィクスチャで欠落したパッチファイル、永続化されていない `update.channel`、レガシー Plugin インストールレコードの場所、マーケットプレイスのインストールレコード永続化の欠落、`plugins update` 中の設定メタデータ移行です。公開済みの `2026.4.26` パッケージでは、すでに出荷されたローカルビルドメタデータスタンプファイルについて警告が出る場合があります。以降のパッケージは最新のパッケージ契約を満たす必要があり、同じ不足はリリース検証で失敗します。

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

- `smoke`: 簡易的なパッケージインストール、チャネル、エージェント、Gateway ネットワーク、設定リロードのレーン
- `package`: ライブの ClawHub なしでのインストール、更新、再起動、Plugin パッケージ契約。これはリリースチェックのデフォルトです
- `product`: `package` に加えて MCP チャネル、cron/サブエージェントのクリーンアップ、OpenAI Web 検索、OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスのチャンク
- `custom`: 集中的な再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの `package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの Telegram ワークフローは、公開後チェック用に公開済み npm spec も引き続き受け付けます。

## リリース公開自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントです。リリースに必要な順序で trusted-publisher ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを確認します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で `Plugin NPM Release` をディスパッチします。
5. 同じスコープと SHA で `Plugin ClawHub Release` をディスパッチします。
6. リリースタグ、npm dist-tag、保存済みの `preflight_run_id` を指定して `OpenClaw NPM Release` をディスパッチします。

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

`latest` への安定版の直接昇格は明示的です。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

下位レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、集中的な修復または再公開作業にのみ使用します。選択した Plugin の修復では、`OpenClaw Release Publish` に
`plugin_publish_scope=selected` と `plugins=@openclaw/name` を渡すか、OpenClaw パッケージを公開してはならない場合は子ワークフローを直接ディスパッチします。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合、検証のみのプレフライト用に現在の完全な 40 文字のワークフローブランチコミット SHA も使用できます
- `preflight_only`: 検証、ビルド、パッケージのみなら `true`、実際の公開パスなら `false`
- `preflight_run_id`: 実際の公開パスで必須。これにより、ワークフローは成功したプレフライト実行で準備された tarball を再利用します
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` プレフライト実行 ID。
  `publish_openclaw_npm=true` の場合は必須です
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。`selected` は集中的な修復作業にのみ使用します
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。このワークフローを Plugin のみの修復オーケストレーターとして使用する場合にのみ `false` を設定します

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを使用するチェックでは、解決済みコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: 安定版またはデフォルトのリリースチェックで、網羅的なライブ/E2E、Docker リリースパス、all-since アップグレードサバイバー soak を有効にします。`release_profile=full` により強制的に有効になります。

ルール:

- 安定版タグと修正タグは `beta` または `latest` のどちらにも公開できます
- ベータのプレリリースタグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証のみです
- 実際の公開パスでは、プレフライト中に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは公開前にそのメタデータを検証してから続行します

## 安定版 npm リリース手順

安定版 npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、プレフライトワークフローの検証のみのドライランとして、現在の完全なワークフローブランチコミット SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択し、安定版を直接公開したい場合にのみ `latest` を選択します
3. 1 つの手動ワークフローから通常の CI に加えてライブプロンプトキャッシュ、Docker、QA Lab、Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全なコミット SHA で `Full Release Validation` を実行します
4. 決定論的な通常のテストグラフのみが必要な場合は、代わりにリリース ref で手動の `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` を指定して `OpenClaw Release Publish` を実行します。OpenClaw npm パッケージを昇格する前に、外部化された Plugin を npm と ClawHub に公開します
7. リリースが `beta` に着地した場合は、プライベートの
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使用して、その安定版を `beta` から `latest` に昇格します
8. リリースを意図的に直接 `latest` に公開し、`beta` も同じ安定版ビルドをすぐに指す必要がある場合は、同じプライベートワークフローを使用して両方の dist-tag を安定版に向けるか、スケジュールされた自己修復同期によって後で `beta` を移動させます

dist-tag の変更は、まだ `NPM_TOKEN` を必要とするため、セキュリティ上の理由でプライベートリポジトリにあります。一方、公開リポジトリは OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first 昇格パスの両方が文書化され、オペレーターから見える状態になります。

メンテナーがローカル npm 認証にフォールバックする必要がある場合は、1Password CLI (`op`) コマンドを必ず専用の tmux セッション内だけで実行します。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内に閉じ込めることで、プロンプト、アラート、OTP 処理を観測可能にし、ホストアラートの繰り返しを防ぎます。

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

メンテナーは、実際のランブックには
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
のプライベートリリースドキュメントを使用します。

## 関連

- [リリースチャネル](/ja-JP/install/development-channels)
