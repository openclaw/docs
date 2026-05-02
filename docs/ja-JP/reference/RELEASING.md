---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョンの命名規則とリリース周期を確認しています
summary: リリースレーン、オペレーター用チェックリスト、検証ボックス、バージョン命名、リリース周期
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-02T23:39:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には3つの公開リリースレーンがあります:

- stable: デフォルトでは npm `beta` に公開され、明示的に要求された場合は npm `latest` に公開されるタグ付きリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- 安定版リリースのバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- 安定版修正リリースのバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- ベータプレリリースのバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日はゼロ埋めしない
- `latest` は、現在昇格済みの安定版 npm リリースを意味する
- `beta` は、現在のベータインストール対象を意味する
- 安定版および安定版修正リリースは、デフォルトでは npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にできるほか、検証済みのベータビルドを後から昇格できる
- すべての安定版 OpenClaw リリースでは、npm パッケージと macOS アプリを一緒に出荷する。
  ベータリリースでは通常、まず npm/パッケージの経路を検証して公開し、
  mac アプリのビルド/署名/公証は明示的に要求されない限り安定版用に残す

## リリース周期

- リリースはベータ優先で進める
- 安定版は、最新ベータが検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切る。
  これにより、リリース検証と修正が `main` での新規開発をブロックしない
- ベータタグがすでにプッシュまたは公開されていて修正が必要な場合、メンテナーは古いベータタグを削除または再作成するのではなく、
  次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開されている形を示すものです。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は、
メンテナー専用のリリースランブックに残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がブランチを切るのに十分な状態でグリーンであることを確認する。
2. 実際のコミット履歴から `/changelog` で最上部の `CHANGELOG.md` セクションを書き換え、
   エントリはユーザー向けに保ち、コミットしてプッシュし、
   ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードを確認する。期限切れの
   互換性は、アップグレード経路が引き続きカバーされている場合にのみ削除するか、
   意図的に維持する理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` 上で直接行わない。
5. 目的のタグに必要なすべてのバージョン箇所を更新し、
   `pnpm plugins:sync` を実行して、公開可能な Plugin パッケージがリリース
   バージョンと互換性メタデータを共有するようにする。その後、ローカルの決定論的プリフライトを実行する:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, および
   `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   リリースブランチの40文字完全 SHA を検証専用
   プリフライトに使用できる。成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` ですべてのプレリリーステストを開始する。
   これは4つの大きなリリーステストボックス、Vitest、Docker、QA Lab、Package への単一の手動エントリポイントである。
8. 検証が失敗した場合は、リリースブランチ上で修正し、修正を証明する最小の失敗ファイル、
   レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行する。
   変更された範囲により以前の証拠が古くなる場合にのみ、包括的な全体を再実行する。
9. ベータの場合、`vYYYY.M.D-beta.N` をタグ付けし、対応する `release/YYYY.M.D` ブランチから
   `OpenClaw Release Publish` を実行する。これは `pnpm plugins:sync:check` を検証し、
   すべての公開可能な Plugin パッケージをまず npm に公開し、同じセットを次に
   ClawHub に公開し、その後、対応する dist-tag で準備済みの OpenClaw npm プリフライト
   アーティファクトを昇格する。公開後、公開された `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して公開後パッケージ受け入れを実行する。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、
   次の対応するプレリリース番号を切る。古い
   プレリリースを削除したり書き換えたりしない。
10. 安定版の場合は、検証済みベータまたはリリース候補に必要な
    検証証拠がある場合にのみ続行する。安定版 npm 公開も
    `OpenClaw Release Publish` を経由し、
    `preflight_run_id` によって成功済みのプリフライトアーティファクトを再利用する。安定版 macOS リリース準備には、
    パッケージ化済みの `.zip`, `.dmg`, `.dSYM.zip`, および `main` 上の更新済み `appcast.xml` も必要である。
11. 公開後、npm 公開後検証ツール、公開後のチャンネル証拠が必要な場合の任意のスタンドアロン
    published-npm Telegram E2E、必要に応じた dist-tag 昇格、
    完全に一致する `CHANGELOG.md` セクションからの GitHub リリース/プレリリースノート、
    およびリリース告知手順を実行する。

## リリースプリフライト

- リリースの事前検証前に `pnpm check:test-types` を実行し、テスト TypeScript がより高速なローカル `pnpm check` ゲートの外側でもカバーされるようにする
- リリースの事前検証前に `pnpm check:architecture` を実行し、より広範なインポートサイクルとアーキテクチャ境界チェックがより高速なローカルゲートの外側でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、期待される `dist/*` リリース成果物と Control UI バンドルがパック検証ステップ用に存在するようにする
- ルートのバージョンバンプ後、タグ付け前に `pnpm plugins:sync` を実行する。これは、公開可能な Plugin パッケージのバージョン、OpenClaw ピア/API 互換性メタデータ、ビルドメタデータ、Plugin 変更履歴スタブをコアのリリースバージョンに合わせて更新する。`pnpm plugins:sync:check` は非変更型のリリースガードであり、この手順が忘れられている場合、公開ワークフローはレジストリ変更の前に失敗する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、すべてのリリース前テストボックスを単一の入口から起動する。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動 `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、Docker リリースパススイート、ライブ/E2E、OpenWebUI、QA Lab パリティ、Matrix、Telegram レーン向けに `OpenClaw Release Checks` をディスパッチする。`release_profile=full` と `rerun_group=all` の場合、リリースチェックの `release-package-under-test` 成果物に対してパッケージ Telegram E2E も実行する。同じ Telegram E2E で公開済み npm パッケージも検証する必要がある場合は、公開後に `npm_telegram_package_spec` を指定する。Package Acceptance で SHA からビルドされた成果物ではなく出荷済み npm パッケージに対してパッケージ/更新マトリクスを実行する必要がある場合は、公開後に `package_acceptance_package_spec` を指定する。Telegram E2E を強制せずに、検証が公開済み npm パッケージと一致することを非公開エビデンスレポートで証明する必要がある場合は、`evidence_package_spec` を指定する。例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を継続しながらパッケージ候補のサイドチャネル証明が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA をパックするには `source=ref` を使う。必須の SHA-256 を伴う HTTPS tarball には `source=url` を使う。別の GitHub Actions 実行によってアップロードされた tarball には `source=artifact` を使う。このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` により同じ tarball に対して Telegram QA を実行できる。選択された Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージ成果物が候補となり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: インストール/チャネル/エージェント、Gateway ネットワーク、設定リロードレーン
  - `package`: OpenWebUI やライブ ClawHub を含まない、成果物ネイティブのパッケージ/更新/Plugin レーン
  - `product`: パッケージプロファイルに加えて、MCP チャネル、cron/サブエージェントのクリーンアップ、OpenAI Web 検索、OpenWebUI
  - `full`: OpenWebUI を伴う Docker リリースパスチャンク
  - `custom`: 集中的な再実行向けの正確な `docker_lanes` 選択
- リリース候補に対する通常の CI 全体のカバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは変更スコープをバイパスし、Linux Node シャード、同梱 Plugin シャード、チャネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリーステレメトリを検証する場合は `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP レシーバーを通じて QA-lab を実行し、Opik、Langfuse、または別の外部コレクタを必要とせずに、エクスポートされたトレーススパン名、境界づけられた属性、コンテンツ/識別子の墨消しを検証する。
- すべてのタグ付きリリースの前に `pnpm release:check` を実行する
- タグが存在した後、変更を伴う公開シーケンスとして `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` からディスパッチする（main 到達可能タグを公開する場合は `main` から）。リリースタグと成功した OpenClaw npm `preflight_run_id` を渡し、意図的に集中的な修復を実行している場合を除き、デフォルトの Plugin 公開スコープ `all-publishable` を維持する。このワークフローは Plugin npm 公開、Plugin ClawHub 公開、OpenClaw npm 公開を直列化するため、外部化された Plugin より前にコアパッケージが公開されることはない。
- リリースチェックは現在、別個の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` はリリース承認前に、QA Lab モックパリティレーンに加えて、高速ライブ Matrix プロファイルと Telegram QA レーンも実行する。ライブレーンは `qa-live-shared` 環境を使用する。Telegram は Convex CI 認証情報リースも使用する。Matrix トランスポート、メディア、E2EE インベントリ全体を並列で実行したい場合は、手動の `QA-Lab - All Lanes` ワークフローを `matrix_profile=all` および `matrix_shards=true` で実行する。
- クロス OS のインストールおよびアップグレードランタイム検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、再利用可能ワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なものだ。実際の npm リリースパスを短く、決定的で、成果物中心に保ち、低速なライブチェックは独自のレーンに置くことで、公開を停滞またはブロックしないようにする
- シークレットを伴うリリースチェックは、`Full Release Validation` を通じて、または `main`/リリースのワークフロー ref からディスパッチし、ワークフローロジックとシークレットを管理下に保つ必要がある
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付ける
- `OpenClaw NPM Release` の検証専用事前検証も、プッシュ済みタグを必要とせずに、現在の完全な 40 文字のワークフローブランチコミット SHA を受け付ける
- その SHA パスは検証専用であり、実際の公開に昇格することはできない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要
- 両方のワークフローは、実際の公開と昇格パスを GitHub ホストランナー上に保ち、非変更型の検証パスではより大きな Blacksmith Linux ランナーを使用できる
- そのワークフローは、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使用して
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を実行する
- npm リリースの事前検証は、別個のリリースチェックレーンを待機しなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応するベータ/修正タグ）を実行する
- npm 公開後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応するベータ/修正バージョン）を実行し、新しい一時プレフィックス内で公開済みレジストリのインストールパスを検証する
- ベータ公開後、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  を実行し、共有のリース済み Telegram 認証情報プールを使用して、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証する。ローカルメンテナーの単発実行では Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` 環境認証情報を直接渡してもよい。
- メンテナーは、手動の `NPM Telegram Beta E2E` ワークフローを介して、GitHub Actions から同じ公開後チェックを実行できる。これは意図的に手動専用であり、すべてのマージで実行されるわけではない。
- メンテナー向けリリース自動化は現在、事前検証してから昇格する方式を使用する:
  - 実際の npm 公開は、成功した npm `preflight_run_id` に合格している必要がある
  - 実際の npm 公開は、成功した事前検証実行と同じ `main` または `release/YYYY.M.D` ブランチからディスパッチされている必要がある
  - 安定版 npm リリースのデフォルトは `beta`
  - 安定版 npm 公開は、ワークフロー入力で明示的に `latest` を対象にできる
  - トークンベースの npm dist-tag 変更は現在、セキュリティのために `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` に置かれている。これは、`npm dist-tag add` には引き続き `NPM_TOKEN` が必要である一方、公開リポジトリは OIDC のみの公開を維持するため
  - 公開 `macOS Release` は検証専用である。タグがリリースブランチ上にのみ存在するが、ワークフローが `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の非公開 mac 公開は、成功した非公開 mac `preflight_run_id` と `validate_run_id` に合格している必要がある
  - 実際の公開パスは、再度ビルドするのではなく、準備済み成果物を昇格する
- `YYYY.M.D-N` のような安定版修正リリースでは、公開後検証ツールが同じ一時プレフィックスのアップグレードパスを `YYYY.M.D` から `YYYY.M.D-N` まで確認するため、リリース修正によって古いグローバルインストールがベース安定版ペイロードのまま静かに残ることはない
- npm リリースの事前検証は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り、閉じた状態で失敗する。これにより、空のブラウザダッシュボードを再び出荷しない
- 公開後検証では、公開済み Plugin エントリポイントとパッケージメタデータが、インストール済みレジストリレイアウトに存在することも確認する。Plugin ランタイムペイロードが欠落したリリースは、公開後検証ツールに失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は候補更新 tarball に対して npm pack の `unpackedSize` 予算も強制するため、インストーラー E2E はリリース公開パスより前に意図しないパック肥大化を検出する
- リリース作業で CI 計画、Plugin タイミングマニフェスト、または Plugin テストマトリクスに触れた場合、承認前に `.github/workflows/plugin-prerelease.yml` から planner 所有の `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートが古い CI レイアウトを説明しないようにする
- 安定版 macOS リリースの準備状況には、アップデーターのサーフェスも含まれる:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - `main` 上の `appcast.xml` は、公開後に新しい安定版 zip を指している必要がある
  - パッケージ化されたアプリは、非デバッグのバンドル ID、空でない Sparkle フィード URL、そのリリースバージョンの正規 Sparkle ビルド下限以上の `CFBundleVersion` を維持している必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターがすべてのリリース前テストを単一の入口から起動する方法である。高速に動くブランチでピン留めされたコミット証明を行うには、すべての子ワークフローが対象 SHA に固定された一時ブランチから実行されるようにヘルパーを使う:

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` をプッシュし、そのブランチから `ref=<sha>` で `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証してから、一時ブランチを削除する。これにより、誤ってより新しい `main` の子実行を証明してしまうことを避けられる。

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

ワークフローはターゲット ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。`OpenClaw Release Checks` はその後、インストールスモーク、クロス OS リリースチェック、ライブ/E2E Docker リリースパスカバレッジ、Telegram パッケージ QA を含む Package Acceptance、QA Lab パリティ、ライブ Matrix、ライブ Telegram へ展開します。フル実行が受け入れられるのは、`Full Release Validation` サマリーで `normal_ci` と `release_checks` が成功として表示される場合のみです。full/all モードでは、`npm_telegram` 子も成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が指定されていない限りスキップされます。最終検証サマリーには各子実行の最遅ジョブテーブルが含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージマトリクス、正確なワークフロージョブ名、stable と full プロファイルの違い、成果物、集中的な再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。
子ワークフローは、ターゲット `ref` が古いリリースブランチやタグを指している場合でも、`Full Release Validation` を実行する信頼された ref、通常は `--ref main` からディスパッチされます。個別の完全リリース検証 workflow-ref 入力はありません。ワークフロー実行 ref を選択することで、信頼されたハーネスを選択します。移動する `main` 上で正確なコミット証明を行うために `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、固定された一時ブランチを作成するには `pnpm ci:full-release --sha <sha>` を使用してください。

ライブ/プロバイダーの範囲を選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/コアライブおよび Docker パス
- `stable`: minimum に加えてリリース承認用の安定プロバイダー/バックエンドカバレッジ
- `full`: stable に加えて広範なアドバイザリープロバイダー/メディアカバレッジ

`OpenClaw Release Checks` は信頼されたワークフロー ref を使用して、ターゲット ref を一度だけ `release-package-under-test` として解決し、その成果物をリリースパス Docker チェックと Package Acceptance の両方で再利用します。これにより、すべてのパッケージ向けボックスで同じバイト列を使用し、パッケージビルドの繰り返しを避けます。クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、そうでない場合は `openai/gpt-5.4` を使用します。このレーンは、最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回のライブエージェントターンを証明するためです。より広範なライブプロバイダーマトリクスは、引き続きモデル固有のカバレッジの場です。

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

集中的な修正後の最初の再実行として、フルの包括ワークフローを使用しないでください。1 つのボックスが失敗した場合は、次の証明には失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用してください。フルの包括ワークフローを再度実行するのは、修正が共有リリースオーケストレーションを変更した場合、または以前の全ボックス証拠が古くなった場合だけです。包括ワークフローの最終検証は記録された子ワークフロー実行 ID を再チェックするため、子ワークフローが正常に再実行された後は、失敗した親ジョブ `Verify full validation` だけを再実行してください。

範囲を限定した復旧には、包括ワークフローに `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子のみ、`plugin-prerelease` はリリース専用 Plugin 子のみ、`release-checks` はすべてのリリースボックスを実行し、より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。集中的な `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行では release-checks パッケージ成果物を使用します。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に変更スコープを迂回し、リリース候補に対して通常のテストグラフを強制します。Linux Node シャード、バンドル Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python Skills、Windows、macOS、Android、Control UI i18n です。

このボックスは「ソースツリーが通常の完全テストスイートに合格したか」に答えるために使用します。リリースパスのプロダクト検証とは同じではありません。保持する証拠:

- ディスパッチされた `CI` 実行 URL を表示する `Full Release Validation` サマリー
- 正確なターゲット SHA で緑になった `CI` 実行
- 回帰を調査する際の CI ジョブからの失敗または遅いシャード名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミング成果物

リリースに決定論的な通常 CI が必要で、Docker、QA Lab、ライブ、クロス OS、またはパッケージボックスが不要な場合のみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` を通じた `OpenClaw Release Checks` と、リリースモードの `install-smoke` ワークフロー内にあります。これはソースレベルのテストだけではなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには次が含まれます。

- 遅い Bun グローバルインストールスモークを有効にした完全なインストールスモーク
- ターゲット SHA ごとのルート Dockerfile スモークイメージの準備/再利用。QR、ルート/Gateway、インストーラー/Bun スモークジョブは個別の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル Plugin インストール/アンインストールレーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- リリースチェックにライブスイートが含まれる場合のライブ/E2E プロバイダースイートと Docker ライブモデルカバレッジ

再実行の前に Docker 成果物を使用してください。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。集中的な復旧には、すべてのリリースチャンクを再実行するのではなく、再利用可能なライブ/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成される再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これはエージェント的な動作とチャンネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには次が含まれます。

- エージェント的パリティパックを使用して OpenAI 候補レーンを Opus 4.6 ベースラインと比較する mock パリティレーン
- `qa-live-shared` 環境を使用する高速ライブ Matrix QA プロファイル
- Convex CI 認証情報リースを使用するライブ Telegram QA レーン
- リリーステレメトリーに明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

このボックスは「リリースが QA シナリオとライブチャンネルフローで正しく動作するか」に答えるために使用します。リリースを承認する際は、パリティ、Matrix、Telegram レーンの成果物 URL を保持してください。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### パッケージ

Package ボックスはインストール可能なプロダクトゲートです。これは `Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。リゾルバーは候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離します。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択された `workflow_ref` ハーネスで信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパック
- `source=url`: 必須の `package_sha256` 付き HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージ成果物、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、移行、更新、古い Plugin 依存関係のクリーンアップ、オフライン Plugin フィクスチャ、Plugin 更新、Telegram パッケージ QA を維持します。アップグレードマトリクスは `2026.4.23` から `latest` までのすべての安定 npm 公開済みベースラインをカバーします。すでに出荷済みの候補には `source=npm` で Package Acceptance を使用し、公開前の SHA 裏付けローカル npm tarball には `source=ref`/`source=artifact` を使用してください。これは、以前は Parallels を必要としていたパッケージ/更新カバレッジの多くに対する GitHub ネイティブの置き換えです。OS 固有のオンボーディング、インストーラー、プラットフォーム動作にはクロス OS リリースチェックが引き続き重要ですが、パッケージ/更新のプロダクト検証では Package Acceptance を優先してください。

更新と Plugin 検証の正規チェックリストは[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)です。Plugin インストール/更新、doctor クリーンアップ、または公開済みパッケージ移行変更をどのローカル、Docker、Package Acceptance、または release-check レーンが証明するかを判断する際に使用してください。すべての安定 `2026.4.23+` パッケージからの網羅的な公開済み更新移行は、Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

従来の package-acceptance の緩和は、意図的に期限を区切られています。`2026.4.25` までのパッケージでは、npm にすでに公開済みのメタデータギャップについて互換パスを使用できます。tarball にないプライベート QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャ内の欠落したパッチファイル、永続化されていない `update.channel`、従来の Plugin インストール記録の場所、欠落した marketplace インストール記録の永続化、`plugins update` 中の config メタデータ移行です。公開済みの `2026.4.26` パッケージでは、すでに出荷済みのローカルビルドメタデータスタンプファイルについて警告が出る場合があります。それ以降のパッケージは現代のパッケージ契約を満たす必要があり、同じギャップはリリース検証で失敗します。

リリースの問いが実際のインストール可能なパッケージに関するものである場合は、より広範な Package Acceptance プロファイルを使用します。

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

- `smoke`: 迅速なパッケージインストール/チャンネル/エージェント、Gateway ネットワーク、config リロードレーン
- `package`: ライブ ClawHub なしのインストール/更新/Plugin パッケージ契約。これが release-check のデフォルトです
- `product`: `package` に加えて MCP チャンネル、Cron/サブエージェントクリーンアップ、OpenAI Web 検索、OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスチャンク
- `custom`: 集中的な再実行のための正確な `docker_lanes` リスト

パッケージ候補の Telegram 検証では、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの
`package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの
Telegram ワークフローは、公開後チェック用に公開済みの npm spec も引き続き受け付けます。

## リリース公開の自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントです。これは、
リリースに必要な順序で trusted-publisher ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、その commit SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを確認します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` を指定して
   `Plugin NPM Release` をディスパッチします。
5. 同じ scope と SHA で `Plugin ClawHub Release` をディスパッチします。
6. リリースタグ、npm dist-tag、保存済みの `preflight_run_id` を指定して
   `OpenClaw NPM Release` をディスパッチします。

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

`latest` への安定版プロモーションは明示的に行います。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

下位レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、
対象を絞った修復または再公開作業にのみ使用します。選択した Plugin の修復では、
`plugin_publish_scope=selected` と `plugins=@openclaw/name` を
`OpenClaw Release Publish` に渡すか、OpenClaw パッケージを公開してはならない場合は
子ワークフローを直接ディスパッチします。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、これらの operator-controlled 入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1` などの必須リリースタグ。`preflight_only=true` の場合、検証専用プリフライト用に現在の完全な 40 文字のワークフローブランチ commit SHA も指定できます
- `preflight_only`: 検証、ビルド、パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスでは必須です。これにより、ワークフローは成功したプリフライト実行で準備された tarball を再利用します
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Publish` は、これらの operator-controlled 入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` プリフライト実行 ID。`publish_openclaw_npm=true` の場合は必須です
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。対象を絞った修復作業の場合にのみ `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin のみの修復オーケストレーターとして使用する場合にのみ `false` に設定します

`OpenClaw Release Checks` は、これらの operator-controlled 入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全な commit SHA。シークレットを含むチェックでは、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。

ルール:

- 安定版タグと修正タグは `beta` または `latest` のどちらにも公開できます
- ベータプレリリースタグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全な commit SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証のみです
- 実際の公開パスでは、プリフライト中に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは、公開を続行する前にそのメタデータを検証します

## 安定版 npm リリース手順

安定版 npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、プリフライトワークフローの検証専用 dry run として、現在の完全なワークフローブランチ commit SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択し、意図的に安定版を直接公開する場合にのみ `latest` を選択します
3. 通常の CI に加え、live prompt cache、Docker、QA Lab、Matrix、Telegram のカバレッジを 1 つの手動ワークフローで得たい場合は、リリースブランチ、リリースタグ、または完全な commit SHA で `Full Release Validation` を実行します
4. 決定的な通常のテストグラフだけが意図的に必要な場合は、代わりにリリース ref で手動 `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` を指定して `OpenClaw Release Publish` を実行します。これは OpenClaw npm パッケージをプロモートする前に、外部化された Plugin を npm と ClawHub に公開します
7. リリースが `beta` に着地した場合は、private な `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その安定版を `beta` から `latest` にプロモートします
8. リリースを意図的に `latest` に直接公開し、`beta` も同じ安定版ビルドをすぐに追従させる必要がある場合は、同じ private ワークフローを使用して両方の dist-tag を安定版に向けるか、スケジュールされた自己修復同期によって後で `beta` を移動させます

dist-tag の変更は、引き続き `NPM_TOKEN` が必要なため、セキュリティ上 private repo に置かれています。一方、public repo は OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first プロモーションパスの両方がドキュメント化され、オペレーターから見える状態になります。

メンテナーが local npm 認証にフォールバックする必要がある場合は、1Password CLI (`op`) コマンドは必ず専用の tmux セッション内でのみ実行します。メインの agent shell から `op` を直接呼び出さないでください。tmux 内に保つことで、プロンプト、アラート、OTP 処理を観測可能にし、ホストアラートの繰り返しを防げます。

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

メンテナーは、実際の runbook には
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
にある private リリースドキュメントを使用します。

## 関連

- [リリースチャネル](/ja-JP/install/development-channels)
