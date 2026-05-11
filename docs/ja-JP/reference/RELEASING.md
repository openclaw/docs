---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョンの命名規則とリリース頻度を確認する
summary: リリースレーン、オペレーター用チェックリスト、検証ボックス、バージョン命名、リリース周期
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-11T20:36:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には3つの公開リリースレーンがあります。

- stable: デフォルトでは npm `beta` に公開され、明示的に要求された場合は npm `latest` に公開されるタグ付きリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: 移動し続ける `main` の先頭

## バージョン命名

- stable リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- stable 修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月や日はゼロ埋めしない
- `latest` は現在昇格済みの stable npm リリースを意味します
- `beta` は現在の beta インストール対象を意味します
- stable および stable 修正リリースは、デフォルトでは npm `beta` に公開されます。リリース担当者は明示的に `latest` を対象にするか、検証済みの beta ビルドを後で昇格できます
- すべての stable OpenClaw リリースは npm パッケージと macOS アプリを一緒に出荷します。
  beta リリースでは通常、npm/package パスを先に検証して公開し、
  mac アプリのビルド/署名/公証は明示的に要求されない限り stable 用に残します

## リリース周期

- リリースは beta 優先で進みます
- stable は最新の beta が検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切ります。これにより、リリース検証と修正が `main` 上の新規開発をブロックしません
- beta タグがすでに push または公開されていて修正が必要な場合、メンテナーは古い beta タグを削除または再作成せず、次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、認証情報、復旧メモはメンテナー専用です

## リリース担当者チェックリスト

このチェックリストはリリースフローの公開上の形です。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は
メンテナー専用リリースランブックに残します。

1. 現在の `main` から開始します。最新を pull し、対象コミットが push 済みであることを確認し、
   現在の `main` CI がブランチ元として十分に green であることを確認します。
2. 実際のコミット履歴から `/changelog` で最上部の `CHANGELOG.md` セクションを書き換え、
   エントリをユーザー向けに保ち、コミットして push し、ブランチ作成前にもう一度 rebase/pull します。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` にあるリリース互換性レコードをレビューします。期限切れの
   互換性は、アップグレードパスが引き続きカバーされている場合にのみ削除します。そうでない場合は、それを
   意図的に保持している理由を記録します。
4. 現在の `main` から `release/YYYY.M.D` を作成します。通常のリリース作業を
   `main` 上で直接行わないでください。
5. 予定しているタグに必要なすべてのバージョン場所を更新し、その後
   `pnpm release:prep` を実行します。これは Plugin バージョン、Plugin インベントリ、config
   schema、同梱チャネル config メタデータ、config docs baseline、Plugin SDK
   exports、Plugin SDK API baseline を正しい順序で更新します。タグ付け前に、生成された
   差分をコミットします。その後、ローカルの決定的な preflight を実行します:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm release:check`。
6. `OpenClaw NPM Release` を `preflight_only=true` で実行します。タグが存在する前は、
   検証専用 preflight に完全な40文字のリリースブランチ SHA を使用できます。
   成功した `preflight_run_id` を保存します。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` で
   すべてのプレリリーステストを開始します。これは4つの大きなリリーステストボックス、
   Vitest、Docker、QA Lab、Package のための唯一の手動エントリポイントです。
8. 検証に失敗した場合は、リリースブランチ上で修正し、修正を証明する最小の失敗した
   ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル allowlist を再実行します。
   変更された範囲によって既存の証拠が古くなる場合にのみ、完全な umbrella を再実行します。
9. beta の場合、`vYYYY.M.D-beta.N` にタグ付けし、対応する `release/YYYY.M.D` ブランチから
   `OpenClaw Release Publish` を実行します。これは `pnpm plugins:sync:check` を検証し、
   公開可能なすべての Plugin パッケージを npm に、同じセットを ClawHub に並列で dispatch し、
   Plugin npm publish が成功し次第、準備済みの OpenClaw npm preflight artifact を
   対応する dist-tag で昇格します。OpenClaw npm publish child が成功した後、
   対応する完全な `CHANGELOG.md` セクションから一致する GitHub release/prerelease ページを
   作成または更新します。npm `latest` に公開された stable リリースは GitHub latest release になります。
   npm `beta` に残された stable メンテナンスリリースは GitHub `latest=false` で作成されます。
   OpenClaw npm の公開中も ClawHub 公開はまだ実行中の場合がありますが、
   release publish ワークフローは child run ID をすぐに出力します。デフォルトでは、
   dispatch 後に ClawHub を待機しないため、遅い ClawHub 承認や registry 作業によって
   OpenClaw npm の利用可能性はブロックされません。ClawHub がワークフロー完了をブロックする必要がある場合は
   `wait_for_clawhub=true` を設定します。
   ClawHub パスは一時的な CLI 依存関係インストール失敗をリトライし、
   1つの preview cell が不安定でも preview に合格した Plugin を公開し、
   期待されるすべての Plugin バージョンに対する registry 検証で終了するため、部分的な公開は
   可視かつリトライ可能なままになります。公開後、公開済み `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して post-publish package
   acceptance を実行します。push または公開済みのプレリリースに修正が必要な場合は、
   次の対応するプレリリース番号を切ります。古いプレリリースを削除または書き換えないでください。
10. stable の場合、検証済み beta またはリリース候補に必要な検証証拠が揃った後にのみ続行します。
    stable npm publish も `OpenClaw Release Publish` を通り、
    `preflight_run_id` で成功済みの preflight artifact を再利用します。stable macOS リリース準備では、
    パッケージ化された `.zip`, `.dmg`, `.dSYM.zip` と、`main` 上の更新済み `appcast.xml` も必要です。
    非公開の macOS publish ワークフローは、リリース asset の検証後、署名済み appcast を
    公開 `main` に自動的に公開します。ブランチ保護により直接 push がブロックされる場合は、
    appcast PR を作成または更新します。
11. 公開後、npm post-publish verifier、公開後のチャネル証拠が必要な場合は任意の standalone
    published-npm Telegram E2E、必要に応じた dist-tag 昇格を実行し、生成された GitHub release ページを検証し、
    リリース告知手順を実行します。

## リリース preflight

- リリース事前検証の前に `pnpm check:test-types` を実行し、テストの TypeScript が高速なローカル `pnpm check` ゲートの外側でもカバーされるようにする
- リリース事前検証の前に `pnpm check:architecture` を実行し、より広範な import サイクルとアーキテクチャ境界のチェックが高速なローカルゲートの外側でも通るようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、期待される `dist/*` リリース成果物と Control UI バンドルがパック検証ステップ用に存在するようにする
- ルートのバージョン引き上げ後、タグ付けの前に `pnpm release:prep` を実行する。これは、バージョン/設定/API 変更後によくずれる、決定的なリリースジェネレーターをすべて実行する: Plugin バージョン、Plugin インベントリ、ベース設定スキーマ、バンドル済みチャンネル設定メタデータ、設定ドキュメントのベースライン、Plugin SDK エクスポート、Plugin SDK API ベースライン。`pnpm release:check` はそれらのガードをチェックモードで再実行し、パッケージリリースチェックを実行する前に、見つかった生成物のずれによる失敗を 1 回のパスですべて報告する。
- リリース承認の前に手動の `Full Release Validation` ワークフローを実行し、すべてのリリース前テストボックスを 1 つのエントリポイントから開始する。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動 `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab 同等性、Matrix、Telegram レーン用に `OpenClaw Release Checks` をディスパッチする。安定版/デフォルト実行では、網羅的なライブ/E2E と Docker リリースパスのソークを `run_release_soak=true` の背後に置く。`release_profile=full` はソークを強制的に有効にする。`release_profile=full` かつ `rerun_group=all` の場合、リリースチェックの `release-package-under-test` 成果物に対してパッケージ Telegram E2E も実行する。ベータを公開した後に `release_package_spec` を指定すると、リリース tar アーカイブを再ビルドせずに、出荷済み npm パッケージをリリースチェック、Package Acceptance、パッケージ Telegram E2E で再利用できる。Telegram がリリース検証の他の部分とは異なる公開済みパッケージを使う必要がある場合にのみ、`npm_telegram_package_spec` を指定する。Package Acceptance がリリースパッケージ指定とは異なる公開済みパッケージを使う必要がある場合は、`package_acceptance_package_spec` を指定する。非公開の証跡レポートで、Telegram E2E を強制せずに検証が公開済み npm パッケージと一致することを証明する必要がある場合は、`evidence_package_spec` を指定する。
  例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を続けながらパッケージ候補のサイドチャネル証跡が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA をパックするには `source=ref` を使う。必須の SHA-256 付き HTTPS tar アーカイブには `source=url` を使う。または、別の GitHub Actions 実行によってアップロードされた tar アーカイブには `source=artifact` を使う。ワークフローは候補を `package-under-test` に解決し、その tar アーカイブに対して Docker E2E リリーススケジューラーを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tar アーカイブに対して Telegram QA を実行できる。選択された Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージ成果物が候補となり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。`update-restart-auth` は候補パッケージをインストール済み CLI と package-under-test の両方として使用するため、候補の更新コマンドの管理下再起動パスを実行する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: インストール/チャンネル/エージェント、Gateway ネットワーク、設定リロードレーン
  - `package`: OpenWebUI またはライブ ClawHub なしの、成果物ネイティブなパッケージ/更新/再起動/Plugin レーン
  - `product`: パッケージプロファイルに加え、MCP チャンネル、cron/サブエージェントのクリーンアップ、OpenAI web search、OpenWebUI
  - `full`: OpenWebUI を含む Docker リリースパスチャンク
  - `custom`: フォーカスした再実行のための正確な `docker_lanes` 選択
- リリース候補に対して通常の CI の完全なカバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは変更範囲の絞り込みをバイパスし、Linux Node シャード、バンドル済み Plugin シャード、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリーステレメトリを検証する場合は、`pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP レシーバー経由で QA-lab を実行し、Opik、Langfuse、または別の外部コレクターを必要とせずに、エクスポートされたトレース span 名、制限付き属性、コンテンツ/識別子の秘匿化を検証する。
- タグ付きリリースの前には毎回 `pnpm release:check` を実行する
- タグが存在した後、変更を伴う公開シーケンスとして `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` からディスパッチする（main から到達可能なタグを公開する場合は `main` から）。リリースタグと成功した OpenClaw npm `preflight_run_id` を渡し、意図的にフォーカスした修復を実行しているのでない限り、デフォルトの Plugin 公開スコープ `all-publishable` を維持する。このワークフローは Plugin npm 公開、Plugin ClawHub 公開、OpenClaw npm 公開を直列化するため、外部化された Plugin より前にコアパッケージが公開されることはない。
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認の前に QA Lab モック同等性レーンに加えて、高速なライブ Matrix プロファイルと Telegram QA レーンも実行する。ライブレーンは `qa-live-shared` 環境を使用する。Telegram は Convex CI 認証情報リースも使用する。Matrix のトランスポート、メディア、E2EE インベントリ全体を並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` を指定して手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS インストールとアップグレードのランタイム検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、これらは再利用可能ワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの: 実際の npm リリースパスは短く、決定的で、成果物に集中させる一方、遅いライブチェックは独自のレーンに留め、公開を停滞またはブロックしないようにする
- シークレットを含むリリースチェックは、`Full Release
Validation` 経由、または `main`/リリースワークフロー ref からディスパッチし、ワークフローのロジックとシークレットが管理下に保たれるようにする
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付ける
- `OpenClaw NPM Release` の検証専用事前検証は、プッシュ済みタグを要求せずに、現在の完全な 40 文字のワークフローブランチコミット SHA も受け付ける
- その SHA パスは検証専用であり、実際の公開に昇格することはできない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要
- どちらのワークフローも、実際の公開と昇格のパスは GitHub ホストランナー上に維持し、変更を伴わない検証パスではより大きな Blacksmith Linux ランナーを使用できる
- そのワークフローは、`OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行し、ワークフローシークレットの `OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方を使用する
- npm リリース事前検証は、別個のリリースチェックレーンを待機しなくなった
- 承認の前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応するベータ/修正タグ）を実行する
- npm 公開後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応するベータ/修正バージョン）を実行し、新しい一時プレフィックスで公開済みレジストリのインストールパスを検証する
- ベータ公開後、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行し、共有のリース済み Telegram 認証情報プールを使って、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実 Telegram E2E を検証する。ローカルメンテナーの単発実行では Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` 環境認証情報を直接渡してよい。
- メンテナーマシンから公開後ベータスモーク全体を実行するには、`pnpm release:beta-smoke -- --beta betaN` を使う。このヘルパーは Parallels npm 更新/新規ターゲット検証を実行し、`NPM Telegram Beta E2E` をディスパッチし、該当する正確なワークフロー実行をポーリングし、成果物をダウンロードし、Telegram レポートを出力する。
- メンテナーは、手動の `NPM Telegram Beta E2E` ワークフロー経由で GitHub Actions から同じ公開後チェックを実行できる。これは意図的に手動専用であり、すべてのマージで実行されるわけではない。
- メンテナーのリリース自動化は現在、事前検証してから昇格する方式を使用する:
  - 実際の npm 公開は、成功した npm `preflight_run_id` を通過している必要がある
  - 実際の npm 公開は、成功した事前検証実行と同じ `main` または `release/YYYY.M.D` ブランチからディスパッチされる必要がある
  - 安定版 npm リリースのデフォルトは `beta`
  - 安定版 npm 公開は、ワークフロー入力で明示的に `latest` を対象にできる
  - トークンベースの npm dist-tag 変更は現在、セキュリティのため `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` に置かれている。公開リポジトリは OIDC のみの公開を維持する一方、`npm dist-tag add` にはまだ `NPM_TOKEN` が必要であるため
  - 公開 `macOS Release` は検証専用。タグがリリースブランチ上にのみ存在するが、ワークフローが `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の非公開 Mac 公開は、成功した非公開 Mac の `preflight_run_id` と `validate_run_id` を通過している必要がある
  - 実際の公開パスは、成果物を再ビルドするのではなく、準備済み成果物を昇格する
- `YYYY.M.D-N` のような安定版の修正リリースでは、公開後検証器が `YYYY.M.D` から `YYYY.M.D-N` への同じ一時プレフィックスでのアップグレードパスもチェックするため、リリース修正が古いグローバルインストールをベース安定版ペイロードのまま静かに残すことはできない
- npm リリース事前検証は、tar アーカイブに `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り安全側に失敗するため、空のブラウザダッシュボードを再び出荷しない
- 公開後検証では、公開済み Plugin エントリポイントとパッケージメタデータがインストール済みレジストリレイアウトに存在することも確認する。Plugin ランタイムペイロードが欠けたまま出荷されるリリースは postpublish 検証器で失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は、候補更新 tar アーカイブに対して npm pack の `unpackedSize` 予算も強制するため、インストーラー E2E はリリース公開パスの前に意図しないパック肥大化を検出する
- リリース作業が CI 計画、拡張機能のタイミングマニフェスト、または拡張機能テストマトリクスに触れた場合は、承認の前に `.github/workflows/plugin-prerelease.yml` から、プランナー管理の `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートが古い CI レイアウトを説明しないようにする
- 安定版 macOS リリースの準備状況には、アップデータの対象領域も含まれる:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - `main` 上の `appcast.xml` は公開後に新しい安定版 zip を指している必要がある。非公開 macOS 公開ワークフローがそれを自動的にコミットするか、直接プッシュがブロックされた場合は appcast PR を開く
  - パッケージ化されたアプリは、非デバッグのバンドル ID、空でない Sparkle フィード URL、そのリリースバージョンの正規 Sparkle ビルド下限以上の `CFBundleVersion` を維持する必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターがすべてのリリース前テストを 1 つのエントリポイントから開始する方法。変化の速いブランチで固定コミットの証跡が必要な場合は、ヘルパーを使用して、すべての子ワークフローが対象 SHA に固定された一時ブランチから実行されるようにする:

```bash
pnpm ci:full-release --sha <full-sha>
```

ヘルパーは `release-ci/<sha>-...` を push し、そのブランチから `ref=<sha>` で `Full Release Validation` を dispatch し、すべての子 workflow の `headSha` がターゲットと一致することを検証してから、一時ブランチを削除します。これにより、誤って新しい `main` の子 run を証明してしまうことを避けられます。

release branch または tag の検証では、信頼済みの `main` workflow ref から実行し、release branch または tag を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

workflow はターゲット ref を解決し、`target_ref=<release-ref>` で手動 `CI` を dispatch し、`OpenClaw Release Checks` を dispatch し、package 向けチェック用の親 `release-package-under-test` artifact を準備し、`release_profile=full` かつ `rerun_group=all` の場合、または `release_package_spec` か `npm_telegram_package_spec` が設定されている場合に、standalone package Telegram E2E を dispatch します。その後、`OpenClaw Release Checks` は install smoke、cross-OS release checks、soak が有効な場合の live/E2E Docker release-path coverage、Telegram package QA を含む Package Acceptance、QA Lab parity、live Matrix、live Telegram へ展開します。full run は、`Full Release Validation` summary で `normal_ci` と `release_checks` が成功として表示されている場合のみ受け入れ可能です。full/all mode では、`npm_telegram` 子も成功している必要があります。full/all 以外では、公開済みの `release_package_spec` または `npm_telegram_package_spec` が指定されていない限り skip されます。最終 verifier summary には各子 run の slowest-job tables が含まれるため、release manager はログをダウンロードせずに現在の critical path を確認できます。
完全な stage matrix、正確な workflow job 名、stable profile と full profile の違い、artifacts、focused rerun handles については、[Full release validation](/ja-JP/reference/full-release-validation) を参照してください。
子 workflows は、ターゲット `ref` が古い release branch や tag を指している場合でも、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` から dispatch されます。独立した Full Release Validation workflow-ref input はありません。workflow run ref を選ぶことで信頼済み harness を選択します。
動く `main` 上の正確な commit proof には `--ref main -f ref=<sha>` を使わないでください。raw commit SHA は workflow dispatch ref にできないため、`pnpm ci:full-release --sha <sha>` を使って pinned temporary branch を作成してください。

live/provider の範囲を選ぶには `release_profile` を使います。

- `minimum`: 最速の release-critical OpenAI/core live と Docker path
- `stable`: release approval 向けの stable provider/backend coverage を minimum に追加
- `full`: broad advisory provider/media coverage を stable に追加

release-blocking lanes が green で、promotion 前に exhaustive live/E2E、Docker release-path、bounded published upgrade-survivor sweep を実行したい場合は、`stable` とともに `run_release_soak=true` を使います。その sweep は最新 4 つの stable packages に加え、pinned `2026.4.23` と `2026.5.2` baselines、さらに古い `2026.4.15` coverage を対象にし、重複する baselines を削除し、各 baseline を専用の Docker runner job に shard します。`full` は `run_release_soak=true` を含意します。

`OpenClaw Release Checks` は、信頼済み workflow ref を使ってターゲット ref を一度 `release-package-under-test` として解決し、soak 実行時にその artifact を cross-OS、Package Acceptance、release-path Docker checks で再利用します。これにより、package 向けのすべての boxes が同じ bytes を使い、package build の繰り返しを避けられます。
beta がすでに npm に存在する場合は、`release_package_spec=openclaw@YYYY.M.D-beta.N` を設定してください。これにより release checks は shipped package を一度ダウンロードし、`dist/build-info.json` から build source SHA を抽出し、その artifact を cross-OS、Package Acceptance、release-path Docker、package Telegram lanes で再利用します。
cross-OS OpenAI install smoke は、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外では `openai/gpt-5.4` を使用します。この lane は最も遅い default model の benchmark ではなく、package install、オンボーディング、gateway startup、1 回の live agent turn を証明するためです。より広い live provider matrix が model-specific coverage の場所として残ります。

release stage に応じて、次の variants を使います。

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

focused fix 後の最初の rerun として full umbrella を使わないでください。1 つの box が失敗した場合は、次の proof には失敗した子 workflow、job、Docker lane、package profile、model provider、または QA lane を使います。full umbrella を再実行するのは、fix が shared release orchestration を変更した場合、または以前の all-box evidence が古くなった場合のみです。umbrella の最終 verifier は記録済みの子 workflow run ids を再チェックするため、子 workflow が正常に rerun された後は、失敗した親 `Verify full validation` job だけを rerun してください。

bounded recovery には、umbrella に `rerun_group` を渡します。`all` は実際の release-candidate run、`ci` は normal CI child のみ、`plugin-prerelease` は release-only plugin child のみ、`release-checks` はすべての release box を実行します。より狭い release groups は `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。
focused `npm-telegram` reruns には `release_package_spec` または `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all runs は release-checks package artifact を使用します。focused cross-OS reruns では `cross_os_suite_filter=windows/packaged-upgrade` または別の OS/suite filter を追加できます。QA release-check failures は advisory です。QA-only failure は release validation を block しません。

### Vitest

Vitest box は手動 `CI` 子 workflow です。手動 CI は意図的に changed scoping を bypass し、release candidate に対して通常の test graph を強制します。Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android、Control UI i18n です。

この box は「source tree が full normal test suite に合格したか？」に答えるために使います。これは release-path product validation とは同じではありません。保持すべき evidence:

- dispatched `CI` run URL を示す `Full Release Validation` summary
- 正確なターゲット SHA で green になった `CI` run
- regression 調査時の CI jobs からの failed または slow shard names
- run に performance analysis が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest timing artifacts

release に deterministic normal CI が必要で、Docker、QA Lab、live、cross-OS、package boxes が不要な場合のみ、manual CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box は、`openclaw-live-and-e2e-checks-reusable.yml` 経由の `OpenClaw Release Checks` と、release-mode の `install-smoke` workflow にあります。source-level tests のみではなく、packaged Docker environments を通じて release candidate を検証します。

Release Docker coverage には次が含まれます。

- slow Bun global install smoke を有効にした full install smoke
- target SHA ごとの root Dockerfile smoke image preparation/reuse。QR、root/gateway、installer/Bun smoke jobs は separate install-smoke shards として実行
- repository E2E lanes
- release-path Docker chunks: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- requested 時の `plugins-runtime-services` chunk 内の OpenWebUI coverage
- split bundled plugin install/uninstall lanes `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- release checks に live suites が含まれる場合の live/E2E provider suites と Docker live model coverage

rerun の前に Docker artifacts を使ってください。release-path scheduler は、lane logs、`summary.json`、`failures.json`、phase timings、scheduler plan JSON、rerun commands を含む `.artifacts/docker-tests/` を upload します。focused recovery には、すべての release chunks を rerun する代わりに、reusable live/E2E workflow で `docker_lanes=<lane[,lane]>` を使います。生成された rerun commands には、利用可能な場合、以前の `package_artifact_run_id` と prepared Docker image inputs が含まれるため、失敗した lane は同じ tarball と GHCR images を再利用できます。

### QA Lab

QA Lab box も `OpenClaw Release Checks` の一部です。これは agentic behavior と channel-level release gate であり、Vitest や Docker package mechanics とは別です。

Release QA Lab coverage には次が含まれます。

- agentic parity pack を使って OpenAI candidate lane を Opus 4.6 baseline と比較する mock parity lane
- `qa-live-shared` environment を使う fast live Matrix QA profile
- Convex CI credential leases を使う live Telegram QA lane
- release telemetry に明示的な local proof が必要な場合の `pnpm qa:otel:smoke`

この box は「release が QA scenarios と live channel flows で正しく動作するか？」に答えるために使います。release を承認する際は、parity、Matrix、Telegram lanes の artifact URLs を保持してください。Full Matrix coverage は、default release-critical lane ではなく、manual sharded QA-Lab run として引き続き利用できます。

### パッケージ

Package box は installable-product gate です。`Package Acceptance` と resolver `scripts/resolve-openclaw-package-candidate.mjs` に支えられています。resolver は candidate を Docker E2E が消費する `package-under-test` tarball に正規化し、package inventory を検証し、package version と SHA-256 を記録し、workflow harness ref を package source ref から分離して保持します。

サポートされる candidate sources:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw release version
- `source=ref`: selected `workflow_ref` harness を使って、信頼済みの `package_ref` branch、tag、または full commit SHA を pack
- `source=url`: 必須の `package_sha256` を持つ HTTPS `.tgz` を download
- `source=artifact`: 別の GitHub Actions run によって upload された `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、prepared release package artifact、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、migration、update、configured-auth update restart、live ClawHub skill install、stale plugin dependency cleanup、offline plugin fixtures、plugin update、Telegram package QA を、同じ resolved tarball に対して維持します。Blocking release checks は default latest published package baseline を使用します。`run_release_soak=true` または `release_profile=full` は、`2026.4.23` から `latest` までのすべての stable npm-published baseline と reported-issue fixtures に拡張します。すでに shipped された candidate には `source=npm` の Package Acceptance を、publish 前の SHA-backed local npm tarball には `source=ref`/`source=artifact` を使います。これは、以前は Parallels が必要だった package/update coverage の大部分に対する GitHub-native replacement です。OS-specific オンボーディング、installer、platform behavior には cross-OS release checks が引き続き重要ですが、package/update product validation では Package Acceptance を優先してください。

更新と Plugin 検証の標準チェックリストは
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)です。Plugin のインストール/更新、doctor クリーンアップ、公開済みパッケージの移行変更を証明するローカル、Docker、Package Acceptance、またはリリースチェックのレーンを判断するときに使用します。
すべての安定版 `2026.4.23+` パッケージからの網羅的な公開済み更新移行は、Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

レガシーな package-acceptance の緩和は、意図的に期限を区切っています。
`2026.4.25` までのパッケージは、すでに npm に公開済みのメタデータ不足に対して互換性パスを使用できます。tarball にない private QA インベントリ項目、欠落している
`gateway install --wrapper`、tarball 由来の git fixture にないパッチファイル、永続化されていない `update.channel`、レガシーな Plugin インストール記録の場所、marketplace インストール記録の永続化不足、`plugins update` 中の config メタデータ移行が対象です。公開済みの `2026.4.26` パッケージでは、すでに出荷済みのローカルビルドメタデータスタンプファイルについて警告が出る場合があります。それ以降のパッケージは現代のパッケージ契約を満たす必要があり、同じ不足はリリース検証で失敗します。

リリース上の問いが実際にインストール可能なパッケージに関するものなら、より広い Package Acceptance プロファイルを使用します。

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

- `smoke`: 素早いパッケージインストール/channel/agent、Gateway ネットワーク、config
  リロードのレーン
- `package`: インストール/更新/再起動/Plugin パッケージ契約に加え、ライブ ClawHub
  skill インストールの証明。これはリリースチェックのデフォルトです
- `product`: `package` に MCP channels、cron/subagent クリーンアップ、OpenAI web
  search、OpenWebUI を追加
- `full`: OpenWebUI を含む Docker リリースパスのチャンク
- `custom`: 集中的な再実行向けの正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの
`package-under-test` tarball を Telegram レーンへ渡します。単独の Telegram ワークフローは、公開後チェック用に引き続き公開済み npm spec を受け付けます。

## リリース公開自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントです。リリースに必要な順序で trusted-publisher ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを確認します。
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

`latest` への安定版の直接昇格は明示的です。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、集中的な修復または再公開作業にのみ使用します。選択した Plugin の修復では、
`plugin_publish_scope=selected` と `plugins=@openclaw/name` を
`OpenClaw Release Publish` に渡すか、OpenClaw パッケージを公開してはいけない場合は子ワークフローを直接ディスパッチします。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1` などの必須リリースタグ。`preflight_only=true` の場合は、検証専用 preflight 用に現在の完全な 40 文字のワークフローブランチコミット SHA も指定できます
- `preflight_only`: 検証/ビルド/パッケージのみなら `true`、実際の公開パスなら `false`
- `preflight_run_id`: 実際の公開パスで必須。ワークフローが成功した preflight 実行から準備済み tarball を再利用するために使います
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight 実行 ID。
  `publish_openclaw_npm=true` の場合は必須
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。集中的な修復作業にのみ `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合のカンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin のみの修復オーケストレーターとして使う場合にのみ `false` を設定します

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを伴うチェックでは、解決済みコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: 安定版/デフォルトのリリースチェックで、網羅的なライブ/E2E、Docker リリースパス、all-since upgrade-survivor soak にオプトインします。`release_profile=full` により強制的にオンになります。

ルール:

- 安定版タグと修正タグは `beta` または `latest` のどちらにも公開できます
- ベータ prerelease タグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスは preflight 中に使ったものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは、公開前にそのメタデータが継続していることを検証します

## 安定版 npm リリース手順

安定版 npm リリースを切るとき:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、preflight ワークフローの検証専用 dry run として、現在の完全なワークフローブランチコミット SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選び、意図的に安定版を直接公開したい場合のみ `latest` を選びます
3. 1 つの手動ワークフローから通常の CI に加えてライブ prompt cache、Docker、QA Lab、
   Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全なコミット SHA で `Full Release Validation` を実行します
4. 決定的な通常テストグラフだけが必要な場合は、代わりにリリース ref で手動 `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` で
   `OpenClaw Release Publish` を実行します。これは OpenClaw npm パッケージを昇格する前に、外部化された Plugin を npm と ClawHub に公開します
7. リリースが `beta` に着地した場合は、private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使って、その安定版を `beta` から `latest` に昇格します
8. リリースを意図的に直接 `latest` に公開し、`beta` もすぐに同じ安定版ビルドを追従すべき場合は、同じ private ワークフローを使って両方の dist-tag を安定版に向けるか、スケジュールされた自己修復同期により後で `beta` を移動させます

dist-tag の変更は、引き続き `NPM_TOKEN` が必要なためセキュリティ上 private repo に置かれています。一方、public repo は OIDC のみの公開を維持します。

これにより、直接公開パスと beta-first 昇格パスの両方が文書化され、オペレーターから見える状態になります。

メンテナーがローカル npm 認証にフォールバックする必要がある場合、1Password CLI (`op`) コマンドは専用の tmux セッション内でのみ実行します。メイン agent shell から `op` を直接呼び出さないでください。tmux 内に留めることで、プロンプト、アラート、OTP の処理を観測可能にし、ホストアラートの繰り返しを防ぎます。

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

メンテナーは実際の runbook として、private リリースドキュメント
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリース channel](/ja-JP/install/development-channels)
