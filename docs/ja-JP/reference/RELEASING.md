---
read_when:
    - 公開リリースチャネルの定義を探しています
    - バージョン命名とリリース頻度を探しています
summary: 公開リリースチャネル、バージョン命名、リリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-04-14T02:08:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdc32839447205d74ba7a20a45fbac8e13b199174b442a1e260e3fce056c63da
    source_path: reference/RELEASING.md
    workflow: 15
---

# リリースポリシー

OpenClaw には 3 つの公開リリースレーンがあります。

- stable: デフォルトでは npm の `beta` に公開されるタグ付きリリース、または明示的に指定された場合は npm の `latest` に公開
- beta: npm の `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- Stable リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- Stable 修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- Beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月や日はゼロ埋めしない
- `latest` は、現在昇格済みの stable npm リリースを意味する
- `beta` は、現在の beta インストール対象を意味する
- Stable および stable 修正リリースは、デフォルトで npm の `beta` に公開される。リリース運用者は明示的に `latest` を指定することもでき、検証済みの beta ビルドを後で昇格させることもできる
- すべての OpenClaw リリースでは、npm パッケージと macOS アプリが一緒に出荷される

## リリース頻度

- リリースは beta-first で進む
- Stable は、最新の beta が検証された後にのみ続く
- 詳細なリリース手順、承認、認証情報、復旧メモは
  maintainers 限定

## リリース事前確認

- pack 検証ステップで必要な `dist/*` リリースアーティファクトと Control UI バンドルが存在するように、`pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行する
- すべてのタグ付きリリースの前に `pnpm release:check` を実行する
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- この分離は意図的なもの: 実際の npm リリース経路を短く、決定的で、アーティファクト重視に保ちつつ、より遅いライブチェックは独自のレーンに置き、公開を遅延またはブロックしないようにする
- ワークフローロジックと secrets を正統なものに保つため、このリリースチェックは `main` ワークフロー ref から起動する必要がある
- このワークフローは、既存のリリースタグまたは現在の完全な 40 文字の `main` コミット SHA のどちらかを受け付ける
- コミット SHA モードでは、現在の `origin/main` HEAD のみを受け付ける。古いリリースコミットにはリリースタグを使う
- `OpenClaw NPM Release` の検証専用事前確認も、プッシュ済みタグを必要とせずに、現在の完全な 40 文字の `main` コミット SHA を受け付ける
- その SHA パスは検証専用であり、実際の公開には昇格できない
- SHA モードでは、ワークフローはパッケージメタデータ確認のためにのみ `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要
- 両方のワークフローは、実際の公開および昇格経路を GitHub ホストランナー上に維持しつつ、変更を伴わない検証経路ではより大きな Blacksmith Linux ランナーを使用できる
- そのワークフローは
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を `OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフロー secrets を使って実行する
- npm リリース事前確認は、別のリリースチェックレーンを待たなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応する beta/修正タグ）を実行する
- npm 公開後に、
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応する beta/修正バージョン）を実行し、新しい一時 prefix で公開済みレジストリのインストール経路を検証する
- Maintainer のリリース自動化は現在、事前確認してから昇格する方式を使う:
  - 実際の npm 公開は、成功した npm `preflight_run_id` を通過していなければならない
  - stable npm リリースのデフォルトは `beta`
  - stable npm 公開では、ワークフロー入力により明示的に `latest` を指定できる
  - stable npm の `beta` から `latest` への昇格は、信頼された `OpenClaw NPM Release` ワークフロー上の明示的な手動モードとして引き続き利用可能
  - 直接 stable 公開では、すでに公開済みの stable バージョンに `latest` と `beta` の両方を向ける明示的な dist-tag 同期モードも実行できる
  - それらの dist-tag モードでも、npm の `dist-tag` 管理は信頼された公開とは別であるため、`npm-release` 環境に有効な `NPM_TOKEN` が引き続き必要
  - 公開の `macOS Release` は検証専用
  - 実際の非公開 mac 公開は、成功した非公開 mac の
    `preflight_run_id` と `validate_run_id` を通過していなければならない
  - 実際の公開経路では、アーティファクトを再ビルドせず、準備済みアーティファクトを昇格する
- `YYYY.M.D-N` のような stable 修正リリースでは、公開後検証器は `YYYY.M.D` から `YYYY.M.D-N` への同じ一時 prefix アップグレード経路も確認する。これにより、古いグローバルインストールがベースの stable ペイロードに静かに残ることを防ぐ
- npm リリース事前確認は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り、fail closed する。これは空のブラウザダッシュボードを再び出荷しないため
- リリース作業が CI 計画、拡張機能タイミングマニフェスト、または拡張機能テストマトリクスに触れた場合は、承認前に `.github/workflows/ci.yml` から planner が管理する `checks-node-extensions` ワークフローマトリクス出力を再生成して確認する。これにより、リリースノートが古い CI レイアウトを説明しないようにする
- Stable macOS リリース準備には、アップデーター関連の面も含まれる:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれていなければならない
  - `main` 上の `appcast.xml` は、公開後に新しい stable zip を指していなければならない
  - パッケージ化されたアプリは、デバッグではない bundle id、空でない Sparkle feed
    URL、およびそのリリースバージョンに対する正規の Sparkle build floor 以上の `CFBundleVersion` を維持していなければならない

## NPM ワークフロー入力

`OpenClaw NPM Release` は、運用者が制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証専用事前確認のために現在の
  完全な 40 文字の `main` コミット SHA を指定することもできる
- `preflight_only`: 検証/ビルド/パッケージのみの場合は `true`、実際の公開経路では `false`
- `preflight_run_id`: 実際の公開経路で必須。これによりワークフローは成功した事前確認実行から準備済み tarball を再利用する
- `npm_dist_tag`: 公開経路の npm 対象タグ。デフォルトは `beta`
- `promote_beta_to_latest`: `true` の場合、公開をスキップし、すでに公開済みの stable `beta` ビルドを `latest` に移動する
- `sync_stable_dist_tags`: `true` の場合、公開をスキップし、すでに公開済みの stable バージョンに `latest` と
  `beta` の両方を向ける

`OpenClaw Release Checks` は、運用者が制御する次の入力を受け付けます。

- `ref`: 検証対象の既存リリースタグ、または現在の完全な 40 文字の `main` コミット
  SHA

ルール:

- Stable および修正タグは、`beta` または `latest` のどちらにも公開できる
- Beta プレリリースタグは `beta` にのみ公開できる
- 完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可される
- リリースチェックのコミット SHA モードでも、現在の `origin/main` HEAD が必要
- 実際の公開経路では、事前確認時と同じ `npm_dist_tag` を使用しなければならない。
  ワークフローは公開続行前にそのメタデータを検証する
- 昇格モードでは、stable または修正タグ、`preflight_only=false`、
  空の `preflight_run_id`、および `npm_dist_tag=beta` を使用しなければならない
- dist-tag 同期モードでは、stable または修正タグ、
  `preflight_only=false`、空の `preflight_run_id`、`npm_dist_tag=latest`、
  および `promote_beta_to_latest=false` を使用しなければならない
- 昇格モードおよび dist-tag 同期モードでも、有効な `NPM_TOKEN` が必要。
  `npm dist-tag add` には通常の npm 認証が引き続き必要であり、信頼された公開はパッケージ公開経路のみを対象とするため

## Stable npm リリース手順

Stable npm リリースを行う場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行する
   - タグがまだ存在しない場合は、事前確認ワークフローの検証専用ドライランのために、現在の完全な `main` コミット SHA を使用できる
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選び、意図的に直接 stable 公開したい場合のみ `latest` を選ぶ
3. ライブの prompt cache カバレッジが必要な場合は、同じタグまたは
   現在の完全な `main` コミット SHA を使って `OpenClaw Release Checks` を別途実行する
   - これは意図的な分離であり、ライブカバレッジを利用可能にしたまま、
     長時間実行または不安定なチェックを公開ワークフローに再結合しないため
4. 成功した `preflight_run_id` を保存する
5. `preflight_only=false`、同じ
   `tag`、同じ `npm_dist_tag`、保存した `preflight_run_id` で `OpenClaw NPM Release` を再度実行する
6. リリースが `beta` に入った場合、その
   公開済みビルドを `latest` に移したいときは、後で同じ stable `tag`、`promote_beta_to_latest=true`、`preflight_only=false`、
   空の `preflight_run_id`、および `npm_dist_tag=beta` で `OpenClaw NPM Release` を実行する
7. 意図的にリリースを直接 `latest` に公開し、`beta`
   も同じ stable ビルドに合わせる必要がある場合は、同じ
   stable `tag`、`sync_stable_dist_tags=true`、`promote_beta_to_latest=false`、
   `preflight_only=false`、空の `preflight_run_id`、および `npm_dist_tag=latest` で `OpenClaw NPM Release` を実行する

昇格モードおよび dist-tag 同期モードでも、`npm-release`
環境の承認と、そのワークフロー実行でアクセス可能な有効な `NPM_TOKEN` が必要です。

これにより、直接公開経路と beta-first 昇格経路の両方が
文書化され、運用者から見える形になります。

## 公開リファレンス

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers は、実際の運用手順については
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
にある非公開のリリースドキュメントを使用します。
