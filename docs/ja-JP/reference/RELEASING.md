---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名とリリース周期を確認する
summary: リリースレーン、運用者チェックリスト、検証ボックス、バージョン命名、ケイデンス
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-05T04:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5f380b106fb304c932715d7b2ec5f92715b2572e7c582d7cfa9786a766730fd
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には3つの公開リリースレーンがあります:

- stable: 既定では npm `beta` に公開され、明示的に要求された場合は npm `latest` に公開されるタグ付きリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- 安定版リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- 安定版修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- Beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日はゼロ埋めしない
- `latest` は、現在昇格済みの安定版 npm リリースを意味します
- `beta` は、現在の beta インストール対象を意味します
- 安定版および安定版修正リリースは既定で npm `beta` に公開されます。リリース担当者は明示的に `latest` を対象にすることも、検証済みの beta ビルドを後から昇格することもできます
- すべての安定版 OpenClaw リリースは npm パッケージと macOS アプリを一緒に出荷します。
  beta リリースは通常、まず npm/パッケージ経路を検証して公開し、
  mac アプリのビルド/署名/公証は、明示的に要求されない限り安定版用に確保されます

## リリース周期

- リリースは beta 優先で進めます
- 安定版は最新の beta が検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切るため、
  リリース検証と修正が `main` 上の新規開発を妨げません
- beta タグがプッシュまたは公開済みで修正が必要な場合、メンテナーは古い beta タグを削除または再作成するのではなく、
  次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用です

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開上の形です。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は
メンテナー専用のリリースランブックに保持します。

1. 現在の `main` から開始します。latest を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がブランチ作成に十分な程度に緑であることを確認します。
2. 実際のコミット履歴から `/changelog` で最上部の `CHANGELOG.md` セクションを書き換え、
   エントリをユーザー向けに保ち、コミットしてプッシュし、ブランチ作成前にもう一度 rebase/pull します。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードを確認します。期限切れの
   互換性は、アップグレード経路が引き続きカバーされている場合にのみ削除するか、意図的に保持する理由を記録します。
4. 現在の `main` から `release/YYYY.M.D` を作成します。通常のリリース作業を
   `main` 上で直接行わないでください。
5. 意図したタグに必要なすべてのバージョン位置を更新し、
   `pnpm plugins:sync` を実行して公開可能な Plugin パッケージがリリース
   バージョンと互換性メタデータを共有するようにします。その後、ローカルの決定的な事前チェック:
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm plugins:sync:check`、および
   `pnpm release:check` を実行します。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行します。タグが存在する前は、
   検証専用の事前チェックに完全な40文字のリリースブランチ SHA を使用できます。
   成功した `preflight_run_id` を保存します。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` ですべてのプレリリーステストを開始します。
   これは、4つの大きなリリーステストボックスである Vitest、Docker、QA Lab、Package の唯一の手動エントリポイントです。
8. 検証が失敗した場合は、リリースブランチ上で修正し、
   修正を証明する最小の失敗ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行します。変更された範囲によって
   以前の証拠が古くなる場合にのみ、全体の umbrella を再実行します。
9. beta の場合、`vYYYY.M.D-beta.N` をタグ付けしてから、一致する `release/YYYY.M.D` ブランチから
   `OpenClaw Release Publish` を実行します。これは `pnpm plugins:sync:check` を検証し、
   公開可能なすべての Plugin パッケージをまず npm に公開し、同じセットを次に ClawHub へ ClawPack npm-pack tarball として公開し、
   その後、一致する dist-tag で準備済みの OpenClaw npm 事前チェック成果物を昇格します。公開後、公開済みの
   `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して公開後のパッケージ
   受け入れを実行します。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、
   次の一致するプレリリース番号を切ります。古い
   プレリリースを削除または書き換えないでください。
10. 安定版の場合は、検証済みの beta またはリリース候補に必要な検証証拠がある場合にのみ続行します。
    安定版 npm 公開も `OpenClaw Release Publish` を通じて行い、
    成功した事前チェック成果物を `preflight_run_id` 経由で再利用します。安定版 macOS リリースの準備完了には、
    パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および `main` 上の更新済み `appcast.xml` も必要です。
11. 公開後、npm 公開後ベリファイア、公開後のチャネル証拠が必要な場合の任意のスタンドアロン
    published-npm Telegram E2E、
    必要に応じた dist-tag 昇格、完全に一致する `CHANGELOG.md` セクションからの GitHub release/prerelease ノート、
    およびリリース告知手順を実行します。

## リリース事前チェック

- リリースのプレフライト前に `pnpm check:test-types` を実行し、より高速なローカル `pnpm check` ゲートの外でもテストの TypeScript がカバーされるようにする
- リリースのプレフライト前に `pnpm check:architecture` を実行し、より広範なインポートサイクルとアーキテクチャ境界チェックが、より高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、pack 検証ステップで想定される `dist/*` リリースアーティファクトと Control UI バンドルが存在するようにする
- ルートのバージョンバンプ後、タグ付け前に `pnpm plugins:sync` を実行する。これは公開可能な Plugin パッケージのバージョン、OpenClaw peer/API 互換性メタデータ、ビルドメタデータ、Plugin changelog スタブを、コアのリリースバージョンに合わせて更新する。`pnpm plugins:sync:check` は非変更のリリースガードであり、この手順を忘れていた場合、公開ワークフローはレジストリを変更する前に失敗する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、すべてのプレリリース test box を 1 つのエントリポイントから開始する。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動の `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab parity、Matrix、Telegram レーン向けに `OpenClaw Release Checks` をディスパッチする。stable/default 実行では、網羅的な live/E2E と Docker リリースパス soak は `run_release_soak=true` の背後に置かれる。`release_profile=full` は soak を強制的に有効にする。`release_profile=full` と `rerun_group=all` を指定すると、リリースチェックの `release-package-under-test` アーティファクトに対してパッケージ Telegram E2E も実行する。公開後に、同じ Telegram E2E で公開済み npm パッケージも検証する必要がある場合は `npm_telegram_package_spec` を指定する。公開後に、Package Acceptance で SHA ビルドのアーティファクトではなく出荷済み npm パッケージに対してパッケージ/更新マトリクスを実行する必要がある場合は `package_acceptance_package_spec` を指定する。Telegram E2E を強制せず、非公開のエビデンスレポートで検証が公開済み npm パッケージに一致することを証明する必要がある場合は `evidence_package_spec` を指定する。例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を続けながら、パッケージ候補のサイドチャネル証明が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使用する。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA を pack するには `source=ref` を使用する。必須の SHA-256 付き HTTPS tarball には `source=url` を使用する。または、別の GitHub Actions 実行でアップロードされた tarball には `source=artifact` を使用する。このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対する Telegram QA を実行できる。選択された Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージアーティファクトが候補となり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  共通プロファイル:
  - `smoke`: インストール/チャネル/エージェント、Gateway ネットワーク、設定リロードレーン
  - `package`: OpenWebUI や live ClawHub を含まない、アーティファクトネイティブなパッケージ/更新/Plugin レーン
  - `product`: パッケージプロファイルに MCP チャネル、cron/subagent クリーンアップ、OpenAI web search、OpenWebUI を追加
  - `full`: OpenWebUI を含む Docker リリースパスチャンク
  - `custom`: 集中的な再実行向けの正確な `docker_lanes` 選択
- リリース候補に対する通常の完全な CI カバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは changed スコープをバイパスし、Linux Node shards、bundled-plugin shards、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリースのテレメトリを検証するときは `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP レシーバー経由で QA-lab を実行し、Opik、Langfuse、その他の外部 collector を必要とせずに、エクスポートされたトレース span 名、境界付き属性、コンテンツ/識別子の秘匿化を検証する。
- すべてのタグ付きリリースの前に `pnpm release:check` を実行する
- タグが存在した後、変更を伴う公開シーケンスには `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` からディスパッチし（main から到達可能なタグを公開する場合は `main`）、リリースタグと成功した OpenClaw npm `preflight_run_id` を渡し、意図的に集中的な修復を実行しているのでない限り、デフォルトの Plugin 公開スコープ `all-publishable` を維持する。このワークフローは Plugin npm 公開、Plugin ClawHub 公開、OpenClaw npm 公開を直列化し、外部化された Plugin より先にコアパッケージが公開されないようにする。
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` はリリース承認前に、QA Lab mock parity レーンに加えて高速な live Matrix プロファイルと Telegram QA レーンも実行する。live レーンは `qa-live-shared` 環境を使用する。Telegram は Convex CI credential lease も使用する。完全な Matrix transport、media、E2EE inventory を並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` を指定して手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS のインストールおよびアップグレードのランタイム検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、これらは再利用可能ワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの。実際の npm リリースパスを短く、決定的で、アーティファクト中心に保ちつつ、遅い live チェックは独自のレーンに置くことで、公開を停滞またはブロックしないようにする
- シークレットを含むリリースチェックは、`Full Release Validation` 経由、または `main`/release ワークフロー ref からディスパッチし、ワークフローロジックとシークレットを制御された状態に保つ必要がある
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け取る
- `OpenClaw NPM Release` の validation-only プレフライトも、プッシュ済みタグを要求せずに、現在の完全な 40 文字のワークフローブランチコミット SHA を受け取る
- その SHA パスは validation-only であり、実際の公開へ昇格することはできない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要
- どちらのワークフローも、実際の公開と昇格パスは GitHub ホストランナー上に維持し、変更を伴わない検証パスではより大きな Blacksmith Linux ランナーを使用できる
- そのワークフローは、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使用して
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を実行する
- npm リリースプレフライトは、別のリリースチェックレーンを待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応する beta/correction タグ）を実行する
- npm 公開後、公開済みレジストリのインストールパスを新しい一時 prefix で検証するために、
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応する beta/correction バージョン）を実行する
- beta 公開後、共有のリース済み Telegram 認証情報プールを使用して、公開済み npm パッケージに対する installed-package オンボーディング、Telegram セットアップ、実際の Telegram E2E を検証するために、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行する。ローカルのメンテナーによる単発実行では、Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` env 認証情報を直接渡してよい。
- メンテナーマシンから完全な公開後 beta smoke を実行するには、`pnpm release:beta-smoke -- --beta betaN` を使用する。この helper は Parallels npm update/fresh-target 検証を実行し、`NPM Telegram Beta E2E` をディスパッチし、正確なワークフロー実行をポーリングし、アーティファクトをダウンロードし、Telegram レポートを出力する。
- メンテナーは GitHub Actions から手動の `NPM Telegram Beta E2E` ワークフローを使って同じ公開後チェックを実行できる。これは意図的に manual-only であり、すべてのマージで実行されるわけではない。
- メンテナーのリリース自動化は現在、preflight-then-promote を使用する:
  - 実際の npm 公開は、成功した npm `preflight_run_id` を通過する必要がある
  - 実際の npm 公開は、成功したプレフライト実行と同じ `main` または `release/YYYY.M.D` ブランチからディスパッチする必要がある
  - stable npm リリースのデフォルトは `beta`
  - stable npm 公開は、ワークフロー入力で明示的に `latest` を対象にできる
  - トークンベースの npm dist-tag 変更は現在、セキュリティのため `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` に置かれている。これは、`npm dist-tag add` には依然として `NPM_TOKEN` が必要である一方、公開 repo は OIDC-only 公開を維持するため
  - 公開 `macOS Release` は validation-only。タグがリリースブランチにのみ存在し、ワークフローが `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の非公開 mac 公開は、成功した非公開 mac `preflight_run_id` と `validate_run_id` を通過する必要がある
  - 実際の公開パスは、再度ビルドするのではなく、準備済みアーティファクトを昇格する
- `YYYY.M.D-N` のような stable correction リリースでは、post-publish verifier は同じ一時 prefix のアップグレードパスを `YYYY.M.D` から `YYYY.M.D-N` へもチェックするため、リリース修正が古いグローバルインストールを base stable payload のまま密かに残すことはできない
- npm リリースプレフライトは、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` payload の両方が含まれていない限り、fail closed する。これにより空のブラウザダッシュボードを再び出荷しないようにする
- 公開後検証では、公開済み Plugin entrypoint とパッケージメタデータがインストール済みレジストリレイアウト内に存在することも確認する。Plugin ランタイム payload が欠落したリリースは postpublish verifier に失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は候補更新 tarball に対して npm pack `unpackedSize` 予算も強制するため、installer e2e はリリース公開パスの前に偶発的な pack 肥大化を検出する
- リリース作業が CI 計画、extension timing manifests、または extension test matrices に触れた場合、承認前に `.github/workflows/plugin-prerelease.yml` から planner-owned の `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートが古い CI レイアウトを説明しないようにする
- stable macOS リリース準備には updater surfaces も含まれる:
  - GitHub release には、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - 公開後、`main` の `appcast.xml` は新しい stable zip を指す必要がある
  - パッケージ化されたアプリは、そのリリースバージョンの canonical Sparkle build floor 以上の、非 debug bundle id、空でない Sparkle feed URL、`CFBundleVersion` を維持する必要がある

## リリース test box

`Full Release Validation` は、オペレーターがすべてのプレリリーステストを 1 つのエントリポイントから開始するための方法である。高速に動くブランチ上の固定コミット証明には、すべての子ワークフローがターゲット SHA に固定された一時ブランチから実行されるよう、helper を使用する:

```bash
pnpm ci:full-release --sha <full-sha>
```

この helper は `release-ci/<sha>-...` を push し、そのブランチから `ref=<sha>` 付きで `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットに一致することを検証してから、一時ブランチを削除する。これにより、誤って新しい `main` の子実行を証明することを避けられる。

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

ワークフローはターゲット ref を解決し、`target_ref=<release-ref>` 付きで手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備し、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後、`OpenClaw Release Checks` は、install smoke、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA 付きの Package Acceptance、QA Lab パリティ、ライブ Matrix、ライブ Telegram に展開します。フル実行が許容されるのは、`Full Release Validation` サマリーで `normal_ci` と `release_checks` が成功と表示されている場合だけです。full/all モードでは、`npm_telegram` 子も成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が指定されていない限りスキップされます。最終 verifier サマリーには各子実行の最遅ジョブ表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージマトリックス、正確なワークフロージョブ名、stable プロファイルと full プロファイルの違い、アーティファクト、重点的な再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation)を参照してください。
子ワークフローは、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。これは、ターゲット `ref` が古いリリースブランチやタグを指している場合も同じです。Full Release Validation 用の個別の workflow-ref 入力はありません。ワークフロー実行 ref を選択して、信頼済みハーネスを選択してください。移動する `main` 上で正確なコミット証明を行うために `--ref main -f ref=<sha>` を使わないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使用してピン留めされた一時ブランチを作成します。

live/provider の広さを選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: minimum に加えて、リリース承認用の stable provider/backend カバレッジ
- `full`: stable に加えて、広範な advisory provider/media カバレッジ

リリースブロッキング lane が green で、昇格前に網羅的な live/E2E、Docker リリースパス、境界付きの公開済み upgrade-survivor スイープを行いたい場合は、`stable` とともに `run_release_soak=true` を使用します。このスイープは、最新 4 つの stable パッケージに加えて、ピン留めされた `2026.4.23` と `2026.5.2` のベースライン、および古い `2026.4.15` カバレッジを対象にし、重複するベースラインを削除し、各ベースラインを個別の Docker runner ジョブにシャーディングします。`full` は `run_release_soak=true` を意味します。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用してターゲット ref を一度だけ `release-package-under-test` として解決し、soak 実行時にはそのアーティファクトを cross-OS、Package Acceptance、release-path Docker チェックで再利用します。これにより、すべてのパッケージ向け box が同じバイト列を使用し、パッケージビルドの繰り返しを避けられます。cross-OS OpenAI install smoke は、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.4` を使用します。この lane は、最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、gateway 起動、1 回の live agent turn を証明するためです。より広範な live provider マトリックスは、引き続きモデル固有のカバレッジの場所です。

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

重点的な修正後の最初の再実行として、full umbrella を使用しないでください。1 つの box が失敗した場合は、次の証明に、失敗した子ワークフロー、ジョブ、Docker lane、パッケージプロファイル、モデル provider、または QA lane を使用します。修正が共有リリースオーケストレーションを変更した場合、または以前の全 box 証拠が古くなった場合にのみ、full umbrella を再度実行します。umbrella の最終 verifier は記録された子ワークフロー実行 ID を再チェックするため、子ワークフローが正常に再実行された後は、失敗した親 `Verify full validation` ジョブだけを再実行します。

境界付きリカバリには、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子のみ、`plugin-prerelease` はリリース専用 plugin 子のみ、`release-checks` はすべてのリリース box を実行します。より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。重点的な `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行は release-checks パッケージアーティファクトを使用します。重点的な cross-OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/suite フィルターを追加できます。QA release-check の失敗は advisory です。QA のみの失敗はリリース検証をブロックしません。

### Vitest

Vitest box は手動 `CI` 子ワークフローです。手動 CI は意図的に changed スコープを回避し、リリース候補に通常のテストグラフを強制します。Linux Node シャード、バンドル plugin シャード、channel contracts、Node 22 互換性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android、Control UI i18n が含まれます。

この box は「ソースツリーが通常のフルテストスイートに合格したか？」に答えるために使用します。これは release-path product validation と同じではありません。保持する証拠:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確なターゲット SHA で green になった `CI` 実行
- リグレッション調査時の CI ジョブからの失敗または遅い shard 名
- 実行でパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest timing アーティファクト

リリースに決定論的な通常 CI が必要で、Docker、QA Lab、live、cross-OS、package box が不要な場合にのみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box は、`openclaw-live-and-e2e-checks-reusable.yml` と release-mode `install-smoke` ワークフローを通じて `OpenClaw Release Checks` 内にあります。これは、ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには以下が含まれます。

- 遅い Bun グローバルインストール smoke を有効にした完全な install smoke
- ターゲット SHA による root Dockerfile smoke イメージの準備/再利用。QR、root/gateway、installer/Bun smoke ジョブは個別の install-smoke shard として実行されます
- repository E2E lane
- release-path Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル plugin install/uninstall lane `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- release checks に live suite が含まれる場合の live/E2E provider suite と Docker live model カバレッジ

再実行する前に Docker アーティファクトを使用します。release-path scheduler は、lane ログ、`summary.json`、`failures.json`、phase timing、scheduler plan JSON、rerun command を含む `.artifacts/docker-tests/` をアップロードします。重点的なリカバリには、すべての release chunk を再実行する代わりに、reusable live/E2E workflow で `docker_lanes=<lane[,lane]>` を使用します。生成された rerun command には、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker image 入力が含まれるため、失敗した lane は同じ tarball と GHCR image を再利用できます。

### QA Lab

QA Lab box も `OpenClaw Release Checks` の一部です。これは agentic behavior と channel-level のリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには以下が含まれます。

- agentic parity pack を使用して OpenAI 候補 lane を Opus 4.6 ベースラインと比較する mock parity lane
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA lane
- リリース telemetry に明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

この box は「リリースが QA シナリオと live channel flow で正しく動作するか？」に答えるために使用します。リリース承認時には、parity、Matrix、Telegram lane のアーティファクト URL を保持します。Full Matrix カバレッジは、デフォルトの release-critical lane ではなく、手動の sharded QA-Lab 実行として引き続き利用できます。

### Package

Package box はインストール可能な製品ゲートです。これは `Package Acceptance` と resolver `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。resolver は候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離したままにします。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択された `workflow_ref` ハーネスを使用して、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を pack します
- `source=url`: 必須の `package_sha256` とともに HTTPS `.tgz` をダウンロードします
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用します

`OpenClaw Release Checks` は、`source=artifact`、準備済み release package アーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、migration、update、stale plugin dependency cleanup、offline plugin fixtures、plugin update、Telegram package QA を維持します。ブロッキング release checks は、デフォルトの最新公開済みパッケージベースラインを使用します。`run_release_soak=true` または `release_profile=full` は、`2026.4.23` から `latest` までのすべての stable npm-published ベースラインに加えて、報告済み issue fixture へ拡張されます。すでに出荷済みの候補には `source=npm` の Package Acceptance を使用し、公開前の SHA-backed local npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前は Parallels が必要だった package/update カバレッジの大部分に対する GitHub-native な代替です。OS 固有のオンボーディング、installer、platform behavior では cross-OS release checks が引き続き重要ですが、package/update product validation では Package Acceptance を優先してください。

update と plugin validation の正規チェックリストは [update と plugin のテスト](/ja-JP/help/testing-updates-plugins)です。plugin install/update、doctor cleanup、または published-package migration の変更を、どの local、Docker、Package Acceptance、または release-check lane が証明するかを判断する際に使用してください。すべての stable `2026.4.23+` パッケージからの網羅的な published update migration は、Full Release CI の一部ではなく、個別の手動 `Update Migration` ワークフローです。

従来の package-acceptance の緩和は、意図的に期限を区切っています。
`2026.4.25` までのパッケージでは、npm にすでに公開済みのメタデータ不足に対して互換パスを使用できます。tarball に含まれない非公開 QA インベントリ項目、欠落した `gateway install --wrapper`、tarball 由来の git fixture に含まれないパッチファイル、永続化されていない `update.channel`、従来の Plugin install-record の場所、marketplace install-record の永続化不足、`plugins update` 中の構成メタデータ移行が該当します。公開済みの `2026.4.26` パッケージでは、すでに出荷されたローカルビルドのメタデータスタンプファイルについて警告が出る場合があります。それ以降のパッケージは最新のパッケージ契約を満たす必要があります。同じ不足はリリース検証で失敗します。

リリース上の確認事項が実際にインストール可能なパッケージに関するものの場合は、より広範な Package Acceptance プロファイルを使用してください。

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

- `smoke`: 簡易的なパッケージインストール/channel/agent、Gateway ネットワーク、構成
  リロードレーン
- `package`: ライブ ClawHub なしの install/update/Plugin パッケージ契約。これは release-check の
  デフォルトです
- `product`: `package` に加えて MCP channels、cron/subagent cleanup、OpenAI web
  search、OpenWebUI
- `full`: OpenWebUI を含む Docker release-path チャンク
- `custom`: 対象を絞った再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にしてください。この workflow は、解決済みの
`package-under-test` tarball を Telegram レーンに渡します。単体の
Telegram workflow は、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## リリース公開の自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントです。リリースに必要な順序で trusted-publisher workflow を調整します。

1. リリースタグをチェックアウトし、その commit SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを検証します。
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

`latest` への直接 Stable 昇格は明示的に行います。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` workflow は、対象を絞った修復または再公開作業にのみ使用してください。選択した Plugin の修復では、
`plugin_publish_scope=selected` と `plugins=@openclaw/name` を
`OpenClaw Release Publish` に渡すか、OpenClaw パッケージを公開してはならない場合は child workflow を直接 dispatch します。

## NPM workflow 入力

`OpenClaw NPM Release` は、operator が制御する次の入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1` のような必須リリースタグ。`preflight_only=true` の場合は、検証専用 preflight のために現在の完全な 40 文字の workflow-branch commit SHA も指定できます
- `preflight_only`: 検証/build/package のみでは `true`、実際の公開パスでは `false`
- `preflight_run_id`: 実際の公開パスで必須。workflow が成功した preflight run で準備済みの tarball を再利用できるようにします
- `npm_dist_tag`: 公開パスの npm 対象タグ。デフォルトは `beta`

`OpenClaw Release Publish` は、operator が制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight run id。
  `publish_openclaw_npm=true` の場合に必須です
- `npm_dist_tag`: OpenClaw パッケージの npm 対象タグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。対象を絞った修復作業にのみ `selected` を使用してください
- `plugins`: `plugin_publish_scope=selected` の場合のカンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。workflow を Plugin 専用の修復オーケストレーターとして使用する場合にのみ `false` を設定してください

`OpenClaw Release Checks` は、operator が制御する次の入力を受け付けます。

- `ref`: 検証する branch、tag、または完全な commit SHA。secret を伴うチェックでは、解決済み commit が OpenClaw branch または release tag から到達可能である必要があります。
- `run_release_soak`: Stable/default リリースチェックで、網羅的な live/E2E、Docker release-path、all-since upgrade-survivor soak を有効にします。`release_profile=full` により強制的に有効になります。

ルール:

- Stable タグと correction タグは、`beta` または `latest` のどちらにも公開できます
- Beta prerelease タグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全な commit SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要があります。workflow は公開前にそのメタデータが継続していることを検証します

## Stable npm リリース手順

Stable npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、preflight workflow の検証専用 dry run に現在の完全な workflow-branch commit SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択し、意図的に直接 Stable 公開したい場合にのみ `latest` を選択します
3. 1 つの手動 workflow から通常の CI に加えて live prompt cache、Docker、QA Lab、Matrix、Telegram のカバレッジが必要な場合は、release branch、release tag、または完全な commit SHA で `Full Release Validation` を実行します
4. 決定的な通常のテストグラフのみが必要なことが明確な場合は、代わりに release ref で手動の `CI` workflow を実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` で `OpenClaw Release Publish` を実行します。これは OpenClaw npm パッケージを昇格する前に、外部化された Plugin を npm と ClawHub に公開します
7. リリースが `beta` に landed した場合は、非公開の
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow を使用して、その Stable バージョンを `beta` から `latest` に昇格します
8. リリースが意図的に直接 `latest` に公開され、`beta` もすぐに同じ Stable build を指す必要がある場合は、同じ非公開 workflow を使用して両方の dist-tag を Stable バージョンに向けるか、スケジュール済みの self-healing sync が後で `beta` を移動するのを待ちます

dist-tag の変更は、引き続き `NPM_TOKEN` が必要なため、セキュリティ上の理由で非公開 repo にあります。一方、公開 repo は OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first 昇格パスの両方が文書化され、operator から見える状態になります。

maintainer がローカル npm 認証にフォールバックする必要がある場合は、1Password
CLI (`op`) コマンドを専用の tmux session 内でのみ実行してください。メイン agent shell から `op` を直接呼び出さないでください。tmux 内に保つことで、prompt、alert、OTP 処理を観測可能にし、host alert の繰り返しを防ぎます。

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

maintainer は、実際の runbook に非公開リリースドキュメント
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリース channel](/ja-JP/install/development-channels)
