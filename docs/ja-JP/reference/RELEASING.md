---
read_when:
    - 公開リリースチャネルの定義を探している場合
    - バージョン命名とリリース頻度を探している場合
summary: 公開リリースチャネル、バージョン命名、頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-04-23T14:09:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# リリースポリシー

OpenClaw には 3 つの公開リリースレーンがあります。

- stable: タグ付きリリース。デフォルトでは npm の `beta` に公開され、明示的に指定された場合は npm の `latest` に公開されます
- beta: prerelease タグ。npm の `beta` に公開されます
- dev: `main` の移動する先頭

## バージョン命名

- stable リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- stable 修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- beta prerelease バージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月と日はゼロ埋めしないでください
- `latest` は現在昇格済みの stable npm リリースを意味します
- `beta` は現在の beta インストール対象を意味します
- stable と stable 修正リリースはデフォルトで npm の `beta` に公開されます。リリース担当者は明示的に `latest` を指定するか、後で検証済み beta ビルドを昇格できます
- すべての stable OpenClaw リリースは npm パッケージと macOS アプリを同時に出荷します。
  beta リリースでは通常、まず npm/package 経路を検証して公開し、
  mac アプリの build/sign/notarize は明示的に要求されない限り stable に予約されます

## リリース頻度

- リリースは beta-first で進みます
- stable は最新 beta の検証後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを切るため、リリース検証や修正が `main` 上の新規開発を止めません
- beta タグが push または公開済みで修正が必要になった場合、メンテナーは古い beta タグを削除・再作成する代わりに、次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、認証情報、リカバリー手順は maintainer 専用です

## リリース前チェック

- リリース前チェックの前に `pnpm check:test-types` を実行し、高速なローカル `pnpm check` ゲートの外でもテスト TypeScript をカバーしてください
- リリース前チェックの前に `pnpm check:architecture` を実行し、高速ローカルゲートの外でも広範な import cycle とアーキテクチャ境界チェックが green であることを確認してください
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、pack 検証ステップに必要な `dist/*` リリース成果物と Control UI バンドルを用意してください
- すべてのタグ付きリリースの前に `pnpm release:check` を実行してください
- リリースチェックは現在、別の手動ワークフロー
  `OpenClaw Release Checks`
  で実行されます
- `OpenClaw Release Checks` は、リリース承認前に QA Lab の mock parity ゲートと live の
  Matrix および Telegram QA レーンも実行します。live レーンは
  `qa-live-shared` 環境を使い、Telegram は Convex CI credential lease も使います
- Cross-OS のインストールおよびアップグレードのランタイム検証は、
  非公開の呼び出し元ワークフロー
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  からディスパッチされ、再利用可能な公開ワークフロー
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  を呼び出します
- この分離は意図的です。実際の npm リリース経路は短く、
  決定的で、成果物中心に保ち、遅い live チェックは別レーンに置くことで、
  公開を止めたり妨げたりしないようにしています
- リリースチェックは `main` のワークフロー ref、または
  `release/YYYY.M.D` のワークフロー ref からディスパッチする必要があります。これによりワークフローロジックと secret が管理されたままになります
- そのワークフローは、既存のリリースタグ、または現在の完全な
  40 文字の workflow-branch commit SHA のどちらかを受け付けます
- commit-SHA モードでは、現在の workflow-branch HEAD だけを受け付けます。古いリリース commit にはリリースタグを使ってください
- `OpenClaw NPM Release` の検証専用 preflight も、push 済みタグを必須にせず、現在の完全な 40 文字の workflow-branch commit SHA を受け付けます
- その SHA 経路は検証専用であり、実際の公開に昇格させることはできません
- SHA モードでは、ワークフローはパッケージメタデータ確認のためだけに
  `v<package.json version>` を合成します。実際の公開には引き続き本物のリリースタグが必要です
- 両方のワークフローは、実際の公開と昇格経路を GitHub-hosted
  runner 上に保ちつつ、非破壊の検証経路ではより大きな
  Blacksmith Linux runner を使えます
- そのワークフローは
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフロー secret を使って実行します
- npm リリース preflight は、もはや別のリリースチェックレーンを待ちません
- 承認前に
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応する beta/修正タグ）を実行してください
- npm 公開後、
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応する beta/修正バージョン）を実行して、公開済みレジストリの
  install 経路を新しい temp prefix で検証してください
- maintainer のリリース自動化は現在 preflight-then-promote を使います:
  - 実際の npm 公開は、成功した npm の `preflight_run_id` を通過している必要があります
  - 実際の npm 公開は、成功した preflight 実行と同じ `main` または
    `release/YYYY.M.D` ブランチからディスパッチされる必要があります
  - stable npm リリースのデフォルトは `beta` です
  - stable npm 公開は、ワークフロー入力で明示的に `latest` を指定できます
  - トークンベースの npm dist-tag 変更は現在
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    にあります。`npm dist-tag add` には引き続き `NPM_TOKEN` が必要であり、
    公開リポジトリは OIDC のみの publish を維持しているためです
  - 公開の `macOS Release` は検証専用です
  - 実際の非公開 mac 公開は、成功した非公開 mac の
    `preflight_run_id` と `validate_run_id` を通過している必要があります
  - 実際の公開経路は、成果物を再ビルドするのではなく、準備済み成果物を昇格します
- `YYYY.M.D-N` のような stable 修正リリースでは、post-publish verifier
  は同じ temp-prefix アップグレード経路を `YYYY.M.D` から `YYYY.M.D-N` に対しても確認するため、修正リリースによって古い global install がベース stable payload のまま静かに残ることがありません
- npm リリース preflight は、tarball に
  `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り fail-closed になります。空のブラウザダッシュボードを再び出荷しないためです
- Post-publish 検証では、公開済みレジストリ install に、
  ルート `dist/*` レイアウト下の空でない同梱 Plugin ランタイム依存関係が含まれていることも確認します。欠落または空の同梱 Plugin
  依存ペイロードを含むリリースは postpublish verifier に失敗し、
  `latest` に昇格できません
- `pnpm test:install:smoke` も、候補アップデート tarball の npm pack `unpackedSize` 予算を強制するため、インストーラー e2e でリリース公開経路前に偶発的な pack の肥大化を検出できます
- リリース作業で CI 計画、extension のタイミングマニフェスト、または
  extension テストマトリクスに触れた場合は、承認前に
  `.github/workflows/ci.yml` から planner 所有の
  `checks-node-extensions` ワークフローマトリクス出力を再生成して確認してください。リリースノートが古い CI レイアウトを説明しないようにするためです
- stable macOS リリース準備には updater サーフェスも含まれます:
  - GitHub リリースには `.zip`、`.dmg`、`.dSYM.zip`
    のパッケージ済み成果物が含まれている必要があります
  - `main` 上の `appcast.xml` は、公開後に新しい stable zip を指している必要があります
  - パッケージ済みアプリは、非デバッグ bundle id、空でない Sparkle feed
    URL、およびそのリリースバージョンの正規 Sparkle build floor 以上の `CFBundleVersion` を維持する必要があります

## NPM ワークフロー入力

`OpenClaw NPM Release` は、次の operator 管理入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`, `v2026.4.2-1`, または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証専用 preflight 用として現在の完全な 40 文字の workflow-branch commit SHA も指定できます
- `preflight_only`: 検証/build/package のみなら `true`、実際の公開経路なら `false`
- `preflight_run_id`: 実際の公開経路で必須。ワークフローが成功した preflight 実行から準備済み tarball を再利用するため
- `npm_dist_tag`: 公開経路の npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Checks` は、次の operator 管理入力を受け付けます。

- `ref`: 既存のリリースタグ、または `main` からディスパッチする場合は検証対象となる現在の完全な 40 文字の `main` commit
  SHA。リリースブランチからの場合は、既存のリリースタグまたは現在の完全な 40 文字のリリースブランチ commit
  SHA を使用します

ルール:

- stable と修正タグは `beta` または `latest` のどちらにも公開できます
- beta prerelease タグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全な commit SHA 入力は
  `preflight_only=true` のときのみ許可されます
- `OpenClaw Release Checks` は常に検証専用であり、現在の
  workflow-branch commit SHA も受け付けます
- リリースチェックの commit-SHA モードでは、現在の workflow-branch HEAD も必要です
- 実際の公開経路では、preflight 中に使ったのと同じ `npm_dist_tag` を使う必要があります。ワークフローは公開継続前にそのメタデータを検証します

## Stable npm リリース手順

stable npm リリースを切るとき:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行する
   - タグがまだ存在しない場合は、preflight ワークフローの検証専用 dry run として現在の完全な workflow-branch commit
     SHA を使えます
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選び、意図的に直接 stable 公開したい場合にのみ `latest` を選ぶ
3. live prompt cache、
   QA Lab parity、Matrix、および Telegram カバレッジが必要な場合は、
   同じタグまたは現在の完全な workflow-branch commit SHA を使って
   `OpenClaw Release Checks` を別途実行する
   - これは意図的に分離されています。長時間実行または不安定なチェックを公開ワークフローに再結合せず、live カバレッジを利用可能に保つためです
4. 成功した `preflight_run_id` を保存する
5. `preflight_only=false`、同じ
   `tag`、同じ `npm_dist_tag`、保存した `preflight_run_id` で
   `OpenClaw NPM Release` を再度実行する
6. リリースが `beta` に着地した場合は、非公開の
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使って、その stable バージョンを `beta` から `latest` に昇格する
7. リリースが意図的に `latest` に直接公開され、`beta`
   もすぐに同じ stable ビルドを指すべき場合は、その同じ非公開
   ワークフローを使って両方の dist-tag を stable バージョンに向けるか、
   その後のスケジュールされた self-healing sync によって `beta` を後で移動させる

dist-tag の変更は、依然として `NPM_TOKEN` が必要であり、
公開リポジトリが OIDC のみの publish を維持しているため、セキュリティ上の理由で非公開リポジトリ側にあります。

これにより、直接公開経路と beta-first 昇格経路の両方が、ドキュメント化され、operator から見える状態に保たれます。

## 公開リファレンス

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

メンテナーは、実際の runbook として非公開リリースドキュメント
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。
