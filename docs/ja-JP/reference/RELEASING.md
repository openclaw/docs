---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れを実行する
    - バージョンの命名規則とリリースサイクルを確認する
summary: リリースレーン、オペレーター用チェックリスト、検証ボックス、バージョン命名、リリース周期
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-02T05:05:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce380a8277e7c8764359e4ded86d1042dcb250691ac62fbee28651f20aa0580
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には3つの公開リリースレーンがあります。

- stable: デフォルトでは npm `beta` に公開され、明示的に指定された場合は npm `latest` に公開されるタグ付きリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- Stable リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- Stable 修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- Beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日をゼロ埋めしない
- `latest` は現在昇格済みの stable npm リリースを意味する
- `beta` は現在の beta インストール対象を意味する
- Stable および stable 修正リリースはデフォルトで npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にすることも、検証済みの beta ビルドを後で昇格することもできる
- すべての stable OpenClaw リリースでは、npm パッケージと macOS アプリが一緒に出荷される。
  beta リリースでは通常、先に npm/パッケージ経路を検証して公開し、
  mac アプリのビルド/署名/公証は、明示的に要求されない限り stable 用に確保される

## リリース周期

- リリースは beta 優先で進む
- Stable は最新の beta が検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切る。
  これにより、リリース検証と修正が `main` 上の新規開発をブロックしない
- beta タグがプッシュ済みまたは公開済みで修正が必要な場合、メンテナーは古い beta タグを削除または再作成するのではなく、次の `-beta.N` タグを切る
- 詳細なリリース手順、承認、認証情報、復旧メモはメンテナー専用

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開されている形です。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は、
メンテナー専用のリリースランブックに残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がブランチ元として十分に green であることを確認する。
2. 実際のコミット履歴から `/changelog` で最上部の `CHANGELOG.md` セクションを書き直し、
   エントリをユーザー向けに保ち、コミットしてプッシュし、
   ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性記録をレビューする。アップグレード経路が引き続きカバーされる場合にのみ期限切れの
   互換性を削除するか、意図的に保持する理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` で直接行わない。
5. 予定タグに必要なすべてのバージョン位置を更新し、その後ローカルの決定的なプリフライトを実行する:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   検証専用プリフライトに完全な40文字のリリースブランチ SHA を使用できる。
   成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` ですべてのプレリリーステストを開始する。これは4つの大きなリリーステストボックスである Vitest、Docker、QA Lab、Package の単一の手動エントリポイントです。
8. 検証が失敗した場合は、リリースブランチ上で修正し、その修正を証明する最小の失敗ファイル、
   レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行する。変更された表面によって以前の証拠が古くなる場合にのみ、全体の umbrella を再実行する。
9. beta の場合は、`vYYYY.M.D-beta.N` をタグ付けし、npm dist-tag `beta` で公開してから、
   公開済みの `openclaw@YYYY.M.D-beta.N` または `openclaw@beta` パッケージに対して公開後パッケージ受け入れを実行する。プッシュ済みまたは公開済みの beta に修正が必要な場合は、
   次の `-beta.N` を切る。古い beta を削除または書き換えない。
10. stable の場合は、検証済み beta またはリリース候補に必要な検証証拠がある場合にのみ続行する。
    Stable npm 公開では、`preflight_run_id` を介して成功した
    プリフライト成果物を再利用する。stable macOS リリース準備には、
    パッケージ化された `.zip`, `.dmg`, `.dSYM.zip` と、`main` 上で更新された
    `appcast.xml` も必要です。
11. 公開後、npm 公開後検証ツール、公開後チャンネル証拠が必要な場合は任意のスタンドアロン
    公開済み npm Telegram E2E、必要に応じた dist-tag 昇格、
    完全に一致する `CHANGELOG.md` セクションからの GitHub リリース/プレリリースノート、
    そしてリリース告知手順を実行する。

## リリースプリフライト

- リリースのプリフライト前に `pnpm check:test-types` を実行し、テストの TypeScript がより高速なローカル `pnpm check` ゲートの外でもカバーされるようにする
- リリースのプリフライト前に `pnpm check:architecture` を実行し、より広範な import サイクルとアーキテクチャ境界チェックが、より高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、想定される `dist/*` リリース成果物と Control UI バンドルがパック検証ステップ用に存在するようにする
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、1 つのエントリポイントからすべてのプレリリーステストボックスを開始する。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動 `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、Docker リリースパススイート、ライブ/E2E、OpenWebUI、QA Lab パリティ、Matrix、Telegram レーン用に `OpenClaw Release Checks` をディスパッチする。`release_profile=full` と `rerun_group=all` の場合、リリースチェックの `release-package-under-test` 成果物に対してパッケージ Telegram E2E も実行する。公開済み npm パッケージも同じ Telegram E2E で証明する必要がある場合は、公開後に `npm_telegram_package_spec` を指定する。Telegram E2E を強制せずに、非公開の証跡レポートで検証が公開済み npm パッケージと一致することを証明する必要がある場合は、`evidence_package_spec` を指定する。
  例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を継続しながらパッケージ候補のサイドチャネル証跡が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使用し、現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA をパックするには `source=ref`、必須の SHA-256 を伴う HTTPS tarball には `source=url`、別の GitHub Actions 実行でアップロードされた tarball には `source=artifact` を使用する。このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対して Telegram QA を実行できる。選択された Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージ成果物が候補となり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: インストール/チャネル/エージェント、Gateway ネットワーク、設定リロードのレーン
  - `package`: OpenWebUI またはライブ ClawHub を含まない、成果物ネイティブのパッケージ/更新/Plugin レーン
  - `product`: パッケージプロファイルに加えて MCP チャネル、cron/サブエージェントのクリーンアップ、OpenAI web search、OpenWebUI
  - `full`: OpenWebUI を含む Docker リリースパスチャンク
  - `custom`: 集中的な再実行向けの正確な `docker_lanes` 選択
- リリース候補に対する通常の完全な CI カバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは変更スコープをバイパスし、Linux Node シャード、バンドル済み Plugin シャード、チャネルコントラクト、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、docs チェック、Python Skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリーステレメトリを検証する場合は `pnpm qa:otel:smoke` を実行する。これはローカルの OTLP/HTTP レシーバーを通じて QA-lab を実行し、Opik、Langfuse、その他の外部コレクターを必要とせずに、エクスポートされたトレーススパン名、境界付き属性、コンテンツ/識別子のリダクションを検証する。
- タグ付きリリースごとに必ず `pnpm release:check` を実行する
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab モックパリティゲートに加えて、高速ライブ Matrix プロファイルと Telegram QA レーンも実行する。ライブレーンは `qa-live-shared` 環境を使用し、Telegram は Convex CI 認証情報リースも使用する。完全な Matrix トランスポート、メディア、E2EE インベントリを並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` を指定して手動の `QA-Lab - All Lanes` ワークフローを実行する。
- Cross-OS のインストールおよびアップグレード実行時検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、再利用可能ワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なものである。実際の npm リリースパスは短く、決定的で、成果物に集中したままにし、より遅いライブチェックは独自のレーンに置くことで、公開を停滞させたりブロックしたりしないようにする
- シークレットを持つリリースチェックは、ワークフローロジックとシークレットを管理下に保つため、`Full Release Validation` を通じて、または `main`/リリースワークフロー ref からディスパッチする必要がある
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付ける
- `OpenClaw NPM Release` の検証専用プリフライトも、プッシュ済みタグを要求せずに、現在の完全な 40 文字のワークフローブランチコミット SHA を受け付ける
- その SHA パスは検証専用であり、実際の公開へ昇格することはできない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要である
- どちらのワークフローも実際の公開と昇格パスは GitHub ホストランナー上に維持し、変更を加えない検証パスではより大きな Blacksmith Linux ランナーを使用できる
- そのワークフローは `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行し、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使用する
- npm リリースのプリフライトは、別個のリリースチェックレーンを待機しなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応するベータ/修正版タグ）を実行する
- npm 公開後、新しい一時プレフィックスで公開済みレジストリのインストールパスを検証するために、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応するベータ/修正版）を実行する
- ベータ公開後、共有リース済み Telegram 認証情報プールを使用して、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証するために、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行する。ローカルのメンテナーによる単発実行では Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` 環境認証情報を直接渡してもよい。
- メンテナーは、手動の `NPM Telegram Beta E2E` ワークフローを通じて GitHub Actions から同じ公開後チェックを実行できる。これは意図的に手動専用であり、すべてのマージで実行されるわけではない。
- メンテナー向けリリース自動化は現在、プリフライト後に昇格する方式を使用する:
  - 実際の npm 公開は、成功した npm `preflight_run_id` を通過している必要がある
  - 実際の npm 公開は、成功したプリフライト実行と同じ `main` または `release/YYYY.M.D` ブランチからディスパッチされている必要がある
  - stable npm リリースのデフォルトは `beta`
  - stable npm 公開はワークフロー入力で明示的に `latest` を対象にできる
  - トークンベースの npm dist-tag 変更は現在、セキュリティ上の理由から `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` にある。これは、`npm dist-tag add` が依然として `NPM_TOKEN` を必要とする一方で、公開リポジトリは OIDC のみの公開を維持するためである
  - 公開 `macOS Release` は検証専用である。タグがリリースブランチのみに存在し、ワークフローが `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の非公開 Mac 公開は、成功した非公開 Mac `preflight_run_id` と `validate_run_id` を通過している必要がある
  - 実際の公開パスは、準備済み成果物を再ビルドするのではなく昇格する
- `YYYY.M.D-N` のような stable 修正リリースでは、公開後検証ツールが同じ一時プレフィックスで `YYYY.M.D` から `YYYY.M.D-N` へのアップグレードパスも確認するため、リリース修正によって古いグローバルインストールがベース stable ペイロードのまま静かに残ることはない
- npm リリースのプリフライトは、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り、失敗として閉じる。これにより、空のブラウザダッシュボードを再び出荷しないようにする
- 公開後検証は、公開済み Plugin エントリポイントとパッケージメタデータが、インストール済みレジストリレイアウトに存在することも確認する。Plugin ランタイムペイロードが欠落したリリースは、postpublish 検証ツールで失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は、候補更新 tarball に対する npm パックの `unpackedSize` 予算も強制するため、インストーラー e2e はリリース公開パスの前に意図しないパック肥大化を検出できる
- リリース作業で CI 計画、Plugin タイミングマニフェスト、または Plugin テストマトリクスに触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` からプランナー所有の `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートが古い CI レイアウトを説明しないようにする
- stable macOS リリースの準備状況には、アップデーターサーフェスも含まれる:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - `main` 上の `appcast.xml` は、公開後に新しい stable zip を指している必要がある
  - パッケージ化されたアプリは、そのリリースバージョンの正規 Sparkle ビルド下限以上の、非デバッグバンドル ID、空でない Sparkle フィード URL、`CFBundleVersion` を維持している必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターが 1 つのエントリポイントからすべてのプレリリーステストを開始する方法である。動きの速いブランチで固定コミットの証跡を得るには、すべての子ワークフローがターゲット SHA に固定された一時ブランチから実行されるように、ヘルパーを使用する:

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` をプッシュし、そのブランチから `ref=<sha>` で `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証した後、一時ブランチを削除する。これにより、誤って新しい `main` の子実行を証明してしまうことを避けられる。

リリースブランチまたはタグの検証では、信頼済みの `main` ワークフロー ref から実行し、`ref` としてリリースブランチまたはタグを渡す:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

ワークフローはターゲット ref を解決し、`target_ref=<release-ref>` 付きの手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロン package Telegram E2E をディスパッチします。その後 `OpenClaw Release Checks` は、install smoke、cross-OS release checks、live/E2E Docker release-path カバレッジ、Telegram package QA 付き Package Acceptance、QA Lab parity、live Matrix、live Telegram へ展開します。フル実行が許容されるのは、`Full Release Validation` サマリーで `normal_ci` と `release_checks` が成功と表示されている場合だけです。full/all モードでは、`npm_telegram` 子ワークフローも成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が指定されていない限りスキップされます。最終 verifier サマリーには各子実行の最も遅いジョブの表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージ行列、正確なワークフロージョブ名、stable プロファイルと full プロファイルの違い、アーティファクト、集中的な再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation)を参照してください。
子ワークフローは、ターゲット `ref` が古いリリースブランチやタグを指している場合でも、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。個別の Full Release Validation workflow-ref 入力はありません。ワークフロー実行 ref を選んで、信頼済みハーネスを選択してください。移動する `main` 上で正確なコミット証明を行うために `--ref main -f ref=<sha>` を使わないでください。生のコミット SHA は workflow dispatch ref にはできないため、`pnpm ci:full-release --sha <sha>` を使ってピン留めされた一時ブランチを作成してください。

live/provider の広さを選ぶには `release_profile` を使います。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: リリース承認向けに minimum に stable provider/backend カバレッジを追加
- `full`: stable に広範な advisory provider/media カバレッジを追加

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使ってターゲット ref を一度だけ `release-package-under-test` として解決し、release-path Docker チェックと Package Acceptance の両方でそのアーティファクトを再利用します。これにより、すべての package-facing box が同じバイト列を使い、パッケージの繰り返しビルドを避けられます。
cross-OS OpenAI install smoke は、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使い、それ以外の場合は `openai/gpt-5.5` を使います。このレーンは最も遅いデフォルトモデルのベンチマークではなく、package install、オンボーディング、Gateway 起動、live agent の 1 ターンを証明するためです。より広範な live provider matrix は、モデル固有のカバレッジの場所として残ります。

リリース段階に応じて次のバリアントを使います。

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

集中的な修正後の最初の再実行として full umbrella を使わないでください。1 つの box が失敗した場合、次の証明には失敗した子ワークフロー、ジョブ、Docker レーン、package プロファイル、モデル provider、または QA レーンを使ってください。修正が共有のリリースオーケストレーションを変更した場合、または以前の全 box の証拠が古くなった場合にのみ、full umbrella を再度実行してください。umbrella の最終 verifier は記録された子ワークフロー実行 ID を再チェックするため、子ワークフローを正常に再実行した後は、失敗した親ジョブ `Verify full validation` だけを再実行してください。

範囲を絞った復旧には、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子ワークフローのみ、`plugin-prerelease` はリリース専用 Plugin 子ワークフローのみ、`release-checks` はすべてのリリース box を実行します。より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。集中的な `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行では release-checks package アーティファクトを使います。

### Vitest

Vitest box は手動 `CI` 子ワークフローです。手動 CI は意図的に変更範囲のスコープをバイパスし、リリース候補に対して通常のテストグラフを強制します。Linux Node shard、バンドル Plugin shard、チャンネル契約、Node 22 互換性、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android、Control UI i18n です。

この box は「ソースツリーが通常のフルテストスイートを通過したか」に答えるために使います。release-path product validation と同じではありません。保持する証拠は次のとおりです。

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確なターゲット SHA で green になった `CI` 実行
- リグレッション調査時の CI ジョブからの失敗または低速な shard 名
- 実行に性能分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest timing アーティファクト

リリースに決定論的な通常 CI は必要だが、Docker、QA Lab、live、cross-OS、package box は不要な場合にのみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker box は、`openclaw-live-and-e2e-checks-reusable.yml` 経由の `OpenClaw Release Checks` と、release-mode の `install-smoke` ワークフローにあります。ソースレベルのテストだけではなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

Release Docker カバレッジには次が含まれます。

- 低速な Bun グローバル install smoke を有効にしたフル install smoke
- ターゲット SHA ごとの root Dockerfile smoke image の準備/再利用。QR、root/gateway、installer/Bun smoke ジョブは別々の install-smoke shard として実行
- リポジトリ E2E レーン
- release-path Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル Plugin install/uninstall レーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- release checks に live suite が含まれる場合の live/E2E provider suite と Docker live model カバレッジ

再実行する前に Docker アーティファクトを使ってください。release-path scheduler は、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、scheduler plan JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。集中的な復旧には、すべてのリリースチャンクを再実行するのではなく、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使ってください。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker image 入力が含まれるため、失敗したレーンは同じ tarball と GHCR image を再利用できます。

### QA Lab

QA Lab box も `OpenClaw Release Checks` の一部です。これは agentic behavior とチャンネルレベルのリリースゲートであり、Vitest や Docker package mechanics とは別です。

Release QA Lab カバレッジには次が含まれます。

- agentic parity pack を使って OpenAI 候補レーンを Opus 4.6 ベースラインと比較する mock parity gate
- `qa-live-shared` 環境を使う高速 live Matrix QA プロファイル
- Convex CI credential lease を使う live Telegram QA レーン
- リリース telemetry に明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

この box は「リリースが QA シナリオと live チャンネルフローで正しく動作するか」に答えるために使います。リリース承認時には parity、Matrix、Telegram レーンのアーティファクト URL を保持してください。Full Matrix カバレッジは、デフォルトのリリースクリティカルなレーンではなく、手動の sharded QA-Lab 実行として引き続き利用できます。

### Package

Package box はインストール可能な製品のゲートです。これは `Package Acceptance` と resolver `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。resolver は候補を Docker E2E が消費する `package-under-test` tarball に正規化し、package inventory を検証し、package version と SHA-256 を記録し、ワークフローハーネス ref を package source ref から分離したままにします。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw release version
- `source=ref`: 選択した `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を pack
- `source=url`: 必須の `package_sha256` 付きで HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリース package アーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=release-history`、`published_upgrade_survivor_scenarios=reported-issues`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、migration、update、古い Plugin 依存関係の cleanup、offline Plugin fixtures、Plugin update、Telegram package QA を、同じ解決済み tarball に対して保ちます。これは、以前は Parallels を必要としていた package/update カバレッジのほとんどに対する GitHub ネイティブの置き換えです。Cross-OS release checks は OS 固有のオンボーディング、installer、platform behavior にとって引き続き重要ですが、package/update product validation では Package Acceptance を優先するべきです。

update と Plugin validation の標準チェックリストは [update と Plugin のテスト](/ja-JP/help/testing-updates-plugins)です。Plugin install/update、doctor cleanup、または公開済み package migration の変更を、どのローカル、Docker、Package Acceptance、または release-check レーンで証明するかを決めるときに使ってください。すべての stable `2026.4.23+` package からの網羅的な公開済み update migration は、Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

従来の package-acceptance の緩和は意図的に期限付きです。`2026.4.25` までの package は、npm にすでに公開済みの metadata gap に対して互換性パスを使えます。tarball にない private QA inventory entry、欠落した `gateway install --wrapper`、tarball 由来の git fixture にない patch file、永続化されていない `update.channel`、従来の Plugin install-record location、欠落した marketplace install-record persistence、`plugins update` 中の config metadata migration です。公開済みの `2026.4.26` package は、すでに出荷された local build metadata stamp file について警告になる場合があります。それ以降の package は、最新の package contract を満たす必要があります。同じ gap は release validation で失敗します。

リリースの問いが実際のインストール可能 package に関する場合は、より広い Package Acceptance プロファイルを使います。

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

一般的な package プロファイル:

- `smoke`: 迅速な package install/channel/agent、Gateway network、config reload レーン
- `package`: live ClawHub なしの install/update/Plugin package contract。これは release-check のデフォルトです
- `product`: `package` に MCP channels、cron/subagent cleanup、OpenAI web search、OpenWebUI を追加
- `full`: OpenWebUI 付きの Docker release-path チャンク
- `custom`: 集中的な再実行用の正確な `docker_lanes` リスト

Package Acceptance でパッケージ候補の Telegram 証明を行うには、`telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの
`package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの
Telegram ワークフローは、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1` のような必須のリリースタグ。`preflight_only=true` の場合は、検証専用 preflight のために現在の
  完全な 40 文字のワークフローブランチ commit SHA も使用できます
- `preflight_only`: 検証/build/package のみの場合は `true`、実際の publish パスの場合は `false`
- `preflight_run_id`: 実際の publish パスで必須。ワークフローが成功した preflight 実行から準備済み tarball を再利用するために使います
- `npm_dist_tag`: publish パスの npm ターゲットタグ。既定値は `beta`

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 検証する branch、tag、または完全な commit SHA。secret を伴うチェックでは、解決済み commit が OpenClaw branch または
  release tag から到達可能である必要があります。

ルール:

- 安定版タグと修正版タグは、`beta` または `latest` のどちらにも publish できます
- Beta prerelease タグは `beta` にのみ publish できます
- `OpenClaw NPM Release` では、完全な commit SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の publish パスでは、preflight 中に使用したものと同じ `npm_dist_tag` を使う必要があります。ワークフローは publish 続行前にそのメタデータを検証します

## 安定版 npm リリース手順

安定版 npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、preflight ワークフローの検証専用ドライランとして、現在の完全なワークフローブランチ commit SHA を使用できます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選び、意図的に直接安定版 publish を行う場合にのみ `latest` を選びます
3. 通常の CI に加えて、live prompt cache、Docker、QA Lab、Matrix、Telegram のカバレッジを 1 つの手動ワークフローから得たい場合は、release branch、release tag、または完全な commit SHA で `Full Release Validation` を実行します
4. 意図的に決定的な通常テストグラフだけが必要な場合は、代わりに release ref で手動 `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存した `preflight_run_id` を指定し、`preflight_only=false` で `OpenClaw NPM Release` をもう一度実行します
7. リリースが `beta` に着地した場合は、private の
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使って、その安定版を `beta` から `latest` に昇格します
8. リリースが意図的に直接 `latest` に publish され、`beta` も同じ安定版 build をすぐに追従すべき場合は、同じ private ワークフローを使って両方の dist-tags が安定版を指すようにするか、スケジュールされた自己修復 sync に後で `beta` を移動させます

dist-tag の変更は、依然として `NPM_TOKEN` を必要とするため、セキュリティ上の理由で private repo に置かれています。一方、public repo は OIDC のみの publish を維持します。

これにより、直接 publish パスと beta-first 昇格パスの両方が文書化され、オペレーターから見える状態になります。

メンテナーが local npm authentication にフォールバックする必要がある場合は、1Password
CLI (`op`) コマンドは専用の tmux session 内でのみ実行します。メインの agent shell から直接 `op` を呼び出さないでください。tmux 内に保つことで、prompts、alerts、OTP handling を観測可能にし、host alerts の繰り返しを防げます。

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

メンテナーは実際の runbook として private release docs の
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリースチャネル](/ja-JP/install/development-channels)
