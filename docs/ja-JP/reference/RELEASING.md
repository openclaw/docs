---
read_when:
    - 公開リリースチャネル定義を探しています
    - リリース検証またはパッケージ受け入れを実行する
    - バージョンの命名規則とリリース周期を探す
summary: リリースレーン、運用者チェックリスト、検証ボックス、バージョン命名、およびリリース周期
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-02T21:05:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には4つの公開リリースレーンがあります。

- stable: デフォルトでは npm `beta` に公開され、明示的に要求された場合は npm `latest` に公開されるタグ付きリリース
- alpha: npm `alpha` に公開されるプレリリースタグ
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- 安定リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- 安定修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- Alpha プレリリースバージョン: `YYYY.M.D-alpha.N`
  - Git タグ: `vYYYY.M.D-alpha.N`
- Beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日をゼロ埋めしない
- `latest` は現在昇格済みの安定 npm リリースを意味します
- `alpha` は現在の alpha インストールターゲットを意味します
- `beta` は現在の beta インストールターゲットを意味します
- 安定リリースと安定修正リリースはデフォルトで npm `beta` に公開されます。リリースオペレーターは明示的に `latest` をターゲットにすることも、検証済みの beta ビルドを後で昇格させることもできます
- すべての安定 OpenClaw リリースは npm パッケージと macOS アプリを一緒に出荷します。
  beta リリースは通常、まず npm/パッケージパスを検証して公開し、
  mac アプリのビルド/署名/公証は明示的に要求されない限り安定リリース用に残します

## リリース周期

- リリースは beta 優先で進みます
- 安定版は最新の beta が検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切るため、
  リリース検証と修正が `main` 上の新規開発をブロックしません
- beta タグがプッシュまたは公開済みで修正が必要な場合、メンテナーは古い beta タグを削除または再作成する代わりに、
  次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用です

## リリースオペレーターのチェックリスト

このチェックリストは、リリースフローの公開上の形を示します。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は
メンテナー専用のリリース手順書に残します。

1. 現在の `main` から開始します。最新を pull し、ターゲットコミットがプッシュ済みであることを確認し、
   現在の `main` CI がそこからブランチを切るのに十分な状態であることを確認します。
2. 実際のコミット履歴から `/changelog` で先頭の `CHANGELOG.md` セクションを書き直し、
   エントリをユーザー向けに保ち、それをコミットしてプッシュし、ブランチ作成前にもう一度 rebase/pull します。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードを確認します。期限切れの
   互換性は、アップグレードパスが引き続きカバーされている場合にのみ削除するか、意図的に
   維持する理由を記録します。
4. 現在の `main` から `release/YYYY.M.D` を作成します。通常のリリース作業を
   `main` 上で直接行わないでください。
5. 予定しているタグに必要なすべてのバージョン位置を更新し、
   公開可能な Plugin パッケージがリリースバージョンと互換性メタデータを共有するように
   `pnpm plugins:sync` を実行してから、ローカルの決定的な事前確認を実行します:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行します。タグが存在する前は、
   検証専用の事前確認に、40文字の完全なリリースブランチ SHA を使用できます。
   成功した `preflight_run_id` を保存します。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` で
   すべてのプレリリーステストを開始します。これは4つの大きなリリーステストボックス
   Vitest、Docker、QA Lab、Package のための唯一の手動エントリーポイントです。
8. 検証に失敗した場合は、リリースブランチ上で修正し、その修正を証明する最小の失敗ファイル、
   レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル allowlist を再実行します。
   変更された対象面により以前の証拠が古くなる場合にのみ、全体のアンブレラを再実行します。
9. alpha または beta の場合は、`vYYYY.M.D-alpha.N` または `vYYYY.M.D-beta.N` をタグ付けし、その後一致する
   `release/YYYY.M.D` ブランチから `OpenClaw Release Publish` を実行します。これは `pnpm plugins:sync:check` を検証し、
   すべての公開可能な Plugin パッケージをまず npm に公開し、同じセットを次に ClawHub に公開してから、
   準備済みの OpenClaw npm 事前確認アーティファクトを一致する dist-tag で昇格させます。公開後、
   公開済みの `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N`, または `openclaw@beta` パッケージに対して公開後のパッケージ受け入れを実行します。プッシュ済みまたは
   公開済みのプレリリースに修正が必要な場合は、次の一致するプレリリース番号を切ります。
   古いプレリリースを削除または書き換えないでください。
10. 安定版の場合は、検証済みの beta またはリリース候補に必要な検証証拠がある場合にのみ続行します。
    安定版 npm 公開も `OpenClaw Release Publish` を通じて行い、
    `preflight_run_id` により成功済みの事前確認アーティファクトを再利用します。安定版 macOS リリースの準備完了には、
    パッケージ化済みの `.zip`, `.dmg`, `.dSYM.zip` と、`main` 上の更新済み `appcast.xml` も必要です。
11. 公開後、npm 公開後検証ツール、公開後のチャンネル証拠が必要な場合の任意のスタンドアロン
    published-npm Telegram E2E、必要に応じた dist-tag 昇格、
    一致する完全な `CHANGELOG.md` セクションからの GitHub リリース/プレリリースノート、
    およびリリース告知手順を実行します。

## リリース事前確認

- リリースのプリフライト前に `pnpm check:test-types` を実行し、テスト用 TypeScript が高速なローカル `pnpm check` ゲートの外でもカバーされるようにする
- リリースのプリフライト前に `pnpm check:architecture` を実行し、より広範なインポートサイクルとアーキテクチャ境界チェックが高速なローカルゲートの外でも成功するようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、期待される
  `dist/*` リリースアーティファクトと Control UI バンドルがパック検証ステップ用に存在するようにする
- ルートのバージョン更新後、タグ付け前に `pnpm plugins:sync` を実行する。これは、公開可能な Plugin パッケージバージョン、OpenClaw peer/API 互換性メタデータ、ビルドメタデータ、Plugin changelog スタブをコアのリリースバージョンに合わせて更新する。`pnpm plugins:sync:check` は変更を加えないリリースガードであり、このステップを忘れていると、公開ワークフローはレジストリを変更する前に失敗する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、1 つのエントリポイントからすべてのプレリリーステストボックスを開始する。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動の `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、Docker リリースパススイート、live/E2E、OpenWebUI、QA Lab parity、Matrix、Telegram レーン向けに `OpenClaw Release Checks` をディスパッチする。`release_profile=full` と `rerun_group=all` の場合、リリースチェックの `release-package-under-test` アーティファクトに対してパッケージ Telegram E2E も実行する。同じ Telegram E2E で公開済み npm パッケージも証明したい場合は、公開後に `npm_telegram_package_spec` を指定する。Package Acceptance で SHA ビルドのアーティファクトではなく出荷済み npm パッケージに対してパッケージ/更新マトリクスを実行したい場合は、公開後に `package_acceptance_package_spec` を指定する。Telegram E2E を強制せずに、非公開の証拠レポートで検証が公開済み npm パッケージと一致することを証明したい場合は、`evidence_package_spec` を指定する。例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を続けながらパッケージ候補のサイドチャネル証拠が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@alpha`、`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使用する。信頼された `package_ref` ブランチ/タグ/SHA を現在の `workflow_ref` ハーネスでパックするには `source=ref` を使用する。必須の SHA-256 付き HTTPS tarball には `source=url` を使用する。別の GitHub Actions 実行でアップロードされた tarball には `source=artifact` を使用する。このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対して Telegram QA を実行できる。選択された Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージアーティファクトが候補になり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  共通プロファイル:
  - `smoke`: インストール/チャンネル/エージェント、Gateway ネットワーク、設定リロードのレーン
  - `package`: OpenWebUI や live ClawHub を含まない、アーティファクトネイティブなパッケージ/更新/Plugin レーン
  - `product`: パッケージプロファイルに加えて、MCP チャンネル、cron/サブエージェントクリーンアップ、
    OpenAI web search、OpenWebUI
  - `full`: OpenWebUI 付きの Docker リリースパスチャンク
  - `custom`: 焦点を絞った再実行のための正確な `docker_lanes` 選択
- リリース候補に対して通常の完全な CI カバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは変更スコープをバイパスし、Linux Node シャード、バンドル済み Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリーステレメトリを検証する場合は `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP レシーバーを通じて QA-lab を実行し、Opik、Langfuse、その他の外部コレクターを必要とせずに、エクスポートされたトレーススパン名、制限付き属性、コンテンツ/識別子のリダクションを検証する。
- タグ付きリリースのたびに、事前に `pnpm release:check` を実行する
- タグが存在した後、変更を伴う公開シーケンスには `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` からディスパッチする（main から到達可能なタグを公開する場合は `main` から）。リリースタグと成功した OpenClaw npm `preflight_run_id` を渡し、意図的に焦点を絞った修復を実行している場合を除き、デフォルトの Plugin 公開スコープ `all-publishable` を維持する。このワークフローは Plugin npm 公開、Plugin ClawHub 公開、OpenClaw npm 公開を直列化し、外部化された Plugin より前にコアパッケージが公開されないようにする。
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` はリリース承認前に、QA Lab mock parity レーンに加え、高速 live Matrix プロファイルと Telegram QA レーンも実行する。live レーンは `qa-live-shared` 環境を使用し、Telegram は Convex CI 認証情報リースも使用する。Matrix のトランスポート、メディア、E2EE インベントリ全体を並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` で手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS のインストールおよびアップグレードのランタイム検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、再利用可能ワークフロー
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの。実際の npm リリースパスは短く、決定的で、アーティファクト中心に保ち、遅い live チェックは独自のレーンに残して、公開を滞留またはブロックしないようにする
- シークレットを持つリリースチェックは `Full Release Validation` 経由、または `main`/release ワークフロー ref からディスパッチし、ワークフローロジックとシークレットを管理下に保つべきである
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付ける
- `OpenClaw NPM Release` の検証専用プリフライトも、プッシュ済みタグを要求せずに、現在の完全な 40 文字のワークフローブランチコミット SHA を受け付ける
- その SHA パスは検証専用であり、実際の公開へ昇格できない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要
- 両方のワークフローは、実際の公開と昇格パスを GitHub ホストランナー上に保ち、変更を伴わない検証パスではより大きな Blacksmith Linux ランナーを使用できる
- そのワークフローは、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使用して
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を実行する
- npm リリースプリフライトは、別個のリリースチェックレーンを待機しなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応する beta/correction タグ）を実行する
- npm 公開後、公開済みレジストリのインストールパスを新しい一時 prefix で検証するために
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応する beta/correction バージョン）を実行する
- beta 公開後、共有リース済み Telegram 認証情報プールを使用して、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証するために `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  を実行する。ローカルメンテナーの単発実行では Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` env 認証情報を直接渡してもよい。
- メンテナーは、手動の `NPM Telegram Beta E2E` ワークフローを通じて、GitHub Actions から同じ公開後チェックを実行できる。これは意図的に手動専用であり、すべてのマージで実行されるものではない。
- メンテナーのリリース自動化は現在、プリフライト後に昇格する方式を使用する:
  - 実際の npm 公開には、成功した npm `preflight_run_id` が必要
  - 実際の npm 公開は、成功したプリフライト実行と同じ `main` または
    `release/YYYY.M.D` ブランチからディスパッチされなければならない
  - stable npm リリースのデフォルトは `beta`
  - stable npm 公開は、ワークフロー入力で明示的に `latest` を対象にできる
  - token ベースの npm dist-tag 変更は現在、セキュリティのため
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    にある。これは、公開リポジトリが OIDC のみの公開を維持する一方で、`npm dist-tag add` には依然として `NPM_TOKEN` が必要なため
  - 公開 `macOS Release` は検証専用。タグがリリースブランチにのみ存在し、ワークフローを `main` からディスパッチする場合は、
    `public_release_branch=release/YYYY.M.D` を設定する
  - 実際の非公開 mac 公開には、成功した非公開 mac
    `preflight_run_id` と `validate_run_id` が必要
  - 実際の公開パスでは、アーティファクトを再ビルドするのではなく、準備済みアーティファクトを昇格する
- `YYYY.M.D-N` のような stable correction リリースでは、公開後検証ツールが同じ一時 prefix のアップグレードパス `YYYY.M.D` から `YYYY.M.D-N` もチェックし、リリース修正が古いグローバルインストールをベース stable ペイロードに黙って残さないようにする
- npm リリースプリフライトは、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り fail closed となり、空のブラウザダッシュボードを再び出荷しないようにする
- 公開後検証では、公開済み Plugin エントリポイントとパッケージメタデータが、インストール済みレジストリレイアウトに存在することもチェックする。Plugin ランタイムペイロードが欠けたまま出荷されたリリースは postpublish verifier で失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` も候補更新 tarball に対して npm pack の `unpackedSize` 予算を強制するため、インストーラー e2e はリリース公開パスの前に意図しないパック肥大化を検出する
- リリース作業が CI 計画、extension タイミングマニフェスト、または extension テストマトリクスに触れた場合、承認前に `.github/workflows/plugin-prerelease.yml` から planner 所有の `plugin-prerelease-extension-shard` マトリクス出力を再生成して確認し、リリースノートが古い CI レイアウトを説明しないようにする
- stable macOS リリース準備状況には、アップデーター面も含まれる:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - `main` 上の `appcast.xml` は、公開後に新しい stable zip を指す必要がある
  - パッケージ化されたアプリは、そのリリースバージョンに対する正規の Sparkle ビルド下限以上の、非デバッグの bundle id、空でない Sparkle feed URL、`CFBundleVersion` を維持する必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターが 1 つのエントリポイントからすべてのプレリリーステストを開始する方法である。動きの速いブランチ上の固定コミット証拠には、すべての子ワークフローが対象 SHA に固定された一時ブランチから実行されるように、ヘルパーを使用する:

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` をプッシュし、そのブランチから `ref=<sha>` で `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証してから、一時ブランチを削除する。これにより、誤って新しい `main` の子実行を証明することを避けられる。

リリースブランチまたはタグの検証では、信頼された `main` ワークフロー ref から実行し、リリースブランチまたはタグを `ref` として渡す:

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
`target_ref=<release-ref>` でディスパッチし、`OpenClaw Release Checks` をディスパッチし、
`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、
スタンドアロンパッケージ Telegram E2E をディスパッチします。`OpenClaw Release
Checks` はその後、インストールスモーク、クロス OS リリースチェック、live/E2E Docker
リリースパスカバレッジ、Telegram パッケージ QA 付き Package Acceptance、QA Lab
パリティ、live Matrix、live Telegram へと展開します。フル実行は、
`Full Release Validation`
サマリーで `normal_ci` と `release_checks` が成功として表示される場合にのみ許容されます。full/all モードでは、
`npm_telegram` 子ワークフローも成功している必要があります。full/all 以外では、公開済みの
`npm_telegram_package_spec` が指定されていない限りスキップされます。最終
検証サマリーには各子実行の最遅ジョブ表が含まれるため、リリース
マネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージマトリクス、正確なワークフロージョブ名、stable プロファイルと full プロファイルの
違い、アーティファクト、焦点を絞った再実行ハンドルについては、
[Full release validation](/ja-JP/reference/full-release-validation) を参照してください。
子ワークフローは、`Full Release
Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。これは、ターゲット `ref` が
古いリリースブランチまたはタグを指している場合でも同じです。別個の Full Release Validation
workflow-ref 入力はありません。ワークフロー実行 ref を選択して、信頼済みハーネスを選択します。
移動する `main` 上で正確なコミット証明を行うために `--ref main -f ref=<sha>` を使用しないでください。
生のコミット SHA はワークフローディスパッチ ref になれないため、
`pnpm ci:full-release --sha <sha>` を使用してピン留めされた一時ブランチを作成してください。

live/provider の範囲を選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: minimum に加えて、リリース承認向けの安定した provider/backend カバレッジ
- `full`: stable に加えて、広範な advisory provider/media カバレッジ

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用してターゲット
ref を一度 `release-package-under-test` として解決し、そのアーティファクトを
release-path Docker チェックと Package Acceptance の両方で再利用します。これにより、すべての
パッケージ向けボックスが同じバイト列を使い、パッケージビルドの繰り返しを避けられます。
クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は
`OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.4` を使用します。このレーンは
最も遅いデフォルトモデルをベンチマークするのではなく、パッケージインストール、オンボーディング、gateway 起動、
および 1 回の live agent turn を証明するためです。より広範な live provider
matrix は、モデル固有のカバレッジの場所として残ります。

リリースステージに応じて、これらのバリアントを使用してください。

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

焦点を絞った修正後の最初の再実行として、フルアンブレラを使用しないでください。1 つのボックスが
失敗した場合は、次の証明に失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデル
provider、または QA レーンを使用してください。修正が共有リリースオーケストレーションを変更した場合、または
以前の全ボックス証拠を古くした場合にのみ、フルアンブレラを再度実行してください。アンブレラの最終検証は、記録された子ワークフロー実行
ID を再チェックするため、子ワークフローが正常に再実行された後は、失敗した
`Verify full validation` 親ジョブだけを再実行してください。

境界付きリカバリには、`rerun_group` をアンブレラに渡します。`all` は実際の
リリース候補実行、`ci` は通常 CI 子のみ、`plugin-prerelease`
はリリース専用 Plugin 子のみ、`release-checks` はすべてのリリース
ボックスを実行し、より狭いリリースグループは `install-smoke`、`cross-os`、
`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。
焦点を絞った `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行は
release-checks パッケージアーティファクトを使用します。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に
changed スコープをバイパスし、リリース候補に対して通常のテストグラフを強制します。Linux Node シャード、バンドル Plugin シャード、チャネル契約、Node 22
互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python
Skills、Windows、macOS、Android、Control UI i18n です。

このボックスは「ソースツリーが通常の完全なテストスイートに合格したか？」に答えるために使用します。
これは release-path product validation と同じではありません。保持する証拠:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確なターゲット SHA で green になった `CI` 実行
- リグレッション調査時の CI ジョブからの失敗または低速シャード名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定論的な通常 CI は必要だが、Docker、QA Lab、live、cross-OS、またはパッケージボックスが不要な場合にのみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` 経由の
`OpenClaw Release Checks` と、release-mode
`install-smoke` ワークフローにあります。ソースレベルのテストだけでなく、パッケージ化された
Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには次が含まれます。

- 低速な Bun グローバルインストールスモークを有効にした完全なインストールスモーク
- ターゲット SHA によるルート Dockerfile スモークイメージの準備/再利用。QR、
  root/gateway、installer/Bun スモークジョブは個別の install-smoke
  シャードとして実行
- リポジトリ E2E レーン
- release-path Docker チャンク: `core`、`package-update-openai`、
  `package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、
  `plugins-runtime-services`、
  `plugins-runtime-install-a`、`plugins-runtime-install-b`、
  `plugins-runtime-install-c`、`plugins-runtime-install-d`、
  `plugins-runtime-install-e`、`plugins-runtime-install-f`、
  `plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル Plugin install/uninstall レーン
  `bundled-plugin-install-uninstall-0` から
  `bundled-plugin-install-uninstall-23`
- release checks に live suites が含まれる場合の live/E2E provider suites と Docker live model カバレッジ

再実行前に Docker アーティファクトを使用してください。release-path スケジューラは
`.artifacts/docker-tests/` をアップロードし、そこにはレーンログ、`summary.json`、`failures.json`、
フェーズタイミング、スケジューラ計画 JSON、再実行コマンドが含まれます。焦点を絞ったリカバリには、
すべてのリリースチャンクを再実行する代わりに、再利用可能な live/E2E ワークフローで
`docker_lanes=<lane[,lane]>` を使用してください。生成された再実行コマンドには、利用可能な場合、以前の
`package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、
失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは agentic
behavior とチャネルレベルのリリースゲートであり、Vitest や Docker
パッケージ機構とは別です。

リリース QA Lab カバレッジには次が含まれます。

- agentic parity pack を使用して OpenAI 候補レーンを Opus 4.6
  ベースラインと比較する mock parity レーン
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA レーン
- リリーステレメトリに明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

このボックスは「リリースが QA シナリオと live チャネルフローで正しく動作するか？」に答えるために使用します。
リリース承認時には、parity、Matrix、Telegram
レーンのアーティファクト URL を保持してください。Full Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、
手動のシャード化 QA-Lab 実行として引き続き利用できます。

### Package

Package ボックスはインストール可能製品ゲートです。これは
`Package Acceptance` と resolver
`scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。resolver は候補を
Docker E2E が消費する `package-under-test` tarball に正規化し、
パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、
ワークフローハーネス ref をパッケージソース ref から分離して維持します。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリース
  バージョン
- `source=ref`: 選択された `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA
  をパック
- `source=url`: 必須の `package_sha256` とともに HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行でアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、
`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、
`published_upgrade_survivor_baselines=all-since-2026.4.23`、
`published_upgrade_survivor_scenarios=reported-issues`、および
`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、移行、更新、古い
Plugin 依存関係のクリーンアップ、オフライン Plugin fixture、Plugin update、Telegram
パッケージ QA を維持します。アップグレードマトリクスは、`2026.4.23` から `latest` までの安定 npm 公開済みベースラインをすべてカバーします。すでに出荷済みの候補には
`source=npm` で Package Acceptance を使用し、公開前の SHA-backed ローカル npm tarball には
`source=ref`/`source=artifact` を使用します。これは、以前は
Parallels を必要としたパッケージ/更新カバレッジの大部分に対する GitHub-native
な置き換えです。クロス OS リリースチェックは OS 固有のオンボーディング、
installer、プラットフォーム動作に引き続き重要ですが、パッケージ/更新の製品検証では
Package Acceptance を優先してください。

更新と Plugin 検証の標準チェックリストは
[Testing updates and plugins](/ja-JP/help/testing-updates-plugins) です。Plugin install/update、doctor cleanup、または published-package migration 変更を証明する
local、Docker、Package Acceptance、または release-check レーンを決定する際に使用してください。
すべての安定版 `2026.4.23+` パッケージからの網羅的な公開済み更新移行は、
Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

レガシー package-acceptance の寛容性は、意図的に期限付きです。`2026.4.25` までのパッケージは、
npm にすでに公開済みのメタデータギャップに対して互換性パスを使用できます。tarball から欠落した private QA inventory entries、
欠落した `gateway install --wrapper`、tarball 派生 git fixture 内の欠落 patch files、
欠落した永続化 `update.channel`、レガシー Plugin install-record
locations、欠落した marketplace install-record persistence、および `plugins update` 中の config metadata
migration です。公開済みの `2026.4.26` パッケージは、
すでに出荷済みのローカルビルドメタデータ stamp files について警告してもよいです。それ以降のパッケージは
現代的なパッケージ契約を満たす必要があります。同じギャップはリリース
検証で失敗します。

リリースの問いが実際のインストール可能パッケージに関するものである場合は、より広範な Package Acceptance プロファイルを使用します。

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

- `smoke`: 迅速なパッケージ install/channel/agent、gateway network、config
  reload レーン
- `package`: live ClawHub なしの install/update/Plugin パッケージ契約。これは release-check
  のデフォルトです
- `product`: `package` に MCP channels、cron/subagent cleanup、OpenAI web
  search、OpenWebUI を追加
- `full`: OpenWebUI 付き Docker release-path チャンク
- `custom`: 焦点を絞った再実行向けの正確な `docker_lanes` リスト

Package Acceptance でパッケージ候補の Telegram 証明を行うには、`telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの
`package-under-test` tarball を Telegram レーンに渡します。単独の
Telegram ワークフローは、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## リリース公開の自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリーポイントです。リリースに必要な順序で trusted-publisher ワークフローを調整します。

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

アルファ公開の例:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

デフォルトのベータ dist-tag への安定版公開:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

`latest` へ直接安定版を昇格する場合は明示的に行います:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、対象を絞った修復または再公開作業にのみ使用します。選択した plugin の修復では、`plugin_publish_scope=selected` と `plugins=@openclaw/name` を `OpenClaw Release Publish` に渡します。または OpenClaw パッケージを公開してはならない場合は、子ワークフローを直接ディスパッチします。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます:

- `tag`: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-alpha.1`、または `v2026.4.2-beta.1` などの必須リリースタグ。`preflight_only=true` の場合、検証専用プリフライトとして現在のワークフローブランチの完全な 40 文字コミット SHA も使用できます
- `preflight_only`: 検証、ビルド、パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスでは必須です。これにより、ワークフローは成功したプリフライト実行で準備された tarball を再利用します
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます:

- `tag`: 必須のリリースタグ。既に存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` プリフライト実行 ID。`publish_openclaw_npm=true` の場合は必須です
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。対象を絞った修復作業でのみ `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。このワークフローを plugin 専用修復オーケストレーターとして使用する場合にのみ `false` に設定します

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます:

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを含むチェックでは、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。

ルール:

- 安定版タグと修正タグは `beta` または `latest` のどちらにも公開できます
- アルファプレリリースタグは `alpha` にのみ公開できます
- ベータプレリリースタグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、プリフライト中に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは、公開を続行する前にそのメタデータを検証します

## 安定版 npm リリース手順

安定版 npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、プリフライトワークフローの検証専用 dry run に、現在の完全なワークフローブランチコミット SHA を使用できます
2. 通常のベータ優先フローでは `npm_dist_tag=beta` を選択し、安定版を直接公開する意図がある場合にのみ `latest` を選択します
3. 1 つの手動ワークフローで通常の CI に加えてライブ prompt cache、Docker、QA Lab、Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全なコミット SHA で `Full Release Validation` を実行します
4. 意図的に決定論的な通常テストグラフだけが必要な場合は、代わりにリリース ref で手動の `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` で `OpenClaw Release Publish` を実行します。OpenClaw npm パッケージを昇格する前に、外部化された plugins を npm と ClawHub に公開します
7. リリースが `beta` に到達した場合は、非公開の `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使って、その安定版を `beta` から `latest` に昇格します
8. リリースを意図的に `latest` へ直接公開し、`beta` もすぐに同じ安定版ビルドに追従すべき場合は、同じ非公開ワークフローを使って両方の dist-tag をその安定版に向けます。または、スケジュールされた自己修復同期によって後で `beta` が移動するのを待ちます

dist-tag の変更は、引き続き `NPM_TOKEN` を必要とするため、セキュリティ上の理由で非公開リポジトリに置かれています。一方、公開リポジトリは OIDC のみの公開を維持します。

これにより、直接公開パスとベータ優先の昇格パスの両方が文書化され、オペレーターに見える状態になります。

メンテナーがローカルの npm 認証にフォールバックする必要がある場合は、1Password CLI (`op`) コマンドを必ず専用の tmux セッション内で実行します。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内に閉じ込めることで、プロンプト、アラート、OTP 処理を観測可能にし、ホストアラートの繰り返しを防ぎます。

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

メンテナーは実際の runbook として、非公開リリースドキュメント
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリースチャネル](/ja-JP/install/development-channels)
