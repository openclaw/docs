---
read_when:
    - 公開リリースチャネルの定義を探しています
    - バージョン命名とリリース頻度を探しています
summary: 公開リリースチャネル、バージョン命名、およびリリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-04-15T04:43:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88724307269ab783a9fbf8a0540fea198d8a3add68457f4e64d5707114fa518c
    source_path: reference/RELEASING.md
    workflow: 15
---

# リリースポリシー

OpenClaw には3つの公開リリースレーンがあります。

- stable: デフォルトでは npm `beta` に公開されるタグ付きリリース、明示的に要求された場合は npm `latest` に公開
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- stable リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- stable 修正版リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月や日はゼロ埋めしない
- `latest` は現在昇格済みの stable npm リリースを意味する
- `beta` は現在の beta インストール対象を意味する
- stable および stable 修正版リリースはデフォルトで npm `beta` に公開される。リリースオペレーターは明示的に `latest` を指定することも、検証済みの beta ビルドを後で昇格させることもできる
- すべての OpenClaw リリースは npm パッケージと macOS アプリを同時に出荷する

## リリース頻度

- リリースはまず beta として進む
- stable は最新の beta が検証された後にのみ続く
- 詳細なリリース手順、承認、認証情報、および復旧メモは
  maintainer 専用

## リリース事前確認

- pack 検証ステップに必要な
  `dist/*` リリース成果物と Control UI バンドルが存在するよう、
  `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行する
- すべてのタグ付きリリースの前に `pnpm release:check` を実行する
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- クロス OS のインストールおよびアップグレード実行時検証は、プライベートな呼び出し元ワークフロー
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  からディスパッチされ、再利用可能な公開ワークフロー
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  を呼び出す
- この分離は意図的なもの: 実際の npm リリース経路は短く、
  決定的で、成果物重視のままにし、より遅いライブチェックは独自の
  レーンに残して、公開を遅延またはブロックしないようにする
- リリースチェックは `main` ワークフロー ref からディスパッチしなければならず、これにより
  ワークフローロジックとシークレットを正準のまま保つ
- そのワークフローは、既存のリリースタグまたは現在の完全な
  40文字の `main` コミット SHA のいずれかを受け付ける
- コミット SHA モードでは、現在の `origin/main` HEAD のみを受け付ける。
  それより古いリリースコミットにはリリースタグを使う
- `OpenClaw NPM Release` の検証専用事前確認でも、プッシュ済みタグを必要とせずに
  現在の完全な 40 文字の `main` コミット SHA を受け付ける
- その SHA 経路は検証専用であり、実際の公開に昇格させることはできない
- SHA モードでは、ワークフローはパッケージメタデータ確認のためにのみ
  `v<package.json version>` を合成する。実際の公開には依然として実際のリリースタグが必要
- 両ワークフローとも、実際の公開および昇格経路は GitHub-hosted
  ランナー上に維持し、非破壊の検証経路ではより大きい
  Blacksmith Linux ランナーを使用できる
- そのワークフローは
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を `OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使って実行する
- npm リリース事前確認は、もはや別レーンのリリースチェックを待たない
- 承認前に
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応する beta/修正版タグ）を実行する
- npm 公開後、公開されたレジストリの
  インストール経路を新しい一時プレフィックスで検証するために
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応する beta/修正版バージョン）を実行する
- maintainer のリリース自動化は現在、事前確認してから昇格する方式を使用する:
  - 実際の npm 公開は、成功した npm `preflight_run_id` を通過しなければならない
  - stable npm リリースはデフォルトで `beta`
  - stable npm 公開はワークフロー入力により明示的に `latest` を対象にできる
  - トークンベースの npm dist-tag 変更は現在
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    にあり、セキュリティのためそうなっている。これは `npm dist-tag add` が依然として `NPM_TOKEN` を必要とし、一方で
    公開リポジトリは OIDC のみの公開を維持するため
  - 公開 `macOS Release` は検証専用
  - 実際のプライベート mac 公開は、成功したプライベート mac の
    `preflight_run_id` と `validate_run_id` を通過しなければならない
  - 実際の公開経路は、成果物を再度ビルドする代わりに、準備済み成果物を昇格させる
- `YYYY.M.D-N` のような stable 修正版リリースでは、公開後検証ツールは
  同じ一時プレフィックスでの `YYYY.M.D` から `YYYY.M.D-N` へのアップグレード経路も確認する。
  これにより、リリース修正が古いグローバルインストールを
  ベース stable ペイロードのまま静かに残すことを防ぐ
- npm リリース事前確認は、tarball に `dist/control-ui/index.html` と
  空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り、
  フェイルクローズする。これにより、空のブラウザダッシュボードを再び出荷しないようにする
- `pnpm test:install:smoke` も候補アップデート tarball の npm pack `unpackedSize` 予算を強制するため、
  インストーラー E2E はリリース公開経路の前に偶発的な pack 膨張を捕捉する
- リリース作業で CI 計画、拡張タイミングマニフェスト、または
  拡張テストマトリクスに触れた場合は、承認前に `.github/workflows/ci.yml` の
  planner 管理下にある `checks-node-extensions` ワークフローマトリクス出力を再生成して確認する。
  これにより、リリースノートが古い CI レイアウトを記述しないようにする
- stable macOS リリース準備完了には、アップデーター関連のサーフェスも含まれる:
  - GitHub リリースには、パッケージ化された `.zip`、`.dmg`、および `.dSYM.zip`
    が最終的に含まれていなければならない
  - `main` 上の `appcast.xml` は、公開後に新しい stable zip を指していなければならない
  - パッケージ化されたアプリは、非デバッグの bundle id、空でない Sparkle feed
    URL、およびそのリリースバージョンの正準 Sparkle build floor 以上の
    `CFBundleVersion` を維持しなければならない

## NPM ワークフロー入力

`OpenClaw NPM Release` は、以下のオペレーター制御入力を受け付ける:

- `tag`: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1` のような必須リリースタグ。`preflight_only=true` の場合、
  検証専用事前確認のために現在の完全な
  40文字の `main` コミット SHA も指定できる
- `preflight_only`: 検証/ビルド/パッケージのみなら `true`、実際の
  公開経路なら `false`
- `preflight_run_id`: 実際の公開経路で必須。これによりワークフローは成功した事前確認実行から
  準備済み tarball を再利用する
- `npm_dist_tag`: 公開経路用の npm 対象タグ。デフォルトは `beta`

`OpenClaw Release Checks` は、以下のオペレーター制御入力を受け付ける:

- `ref`: 既存のリリースタグ、または検証対象の現在の完全な 40 文字の `main` コミット
  SHA

ルール:

- stable および修正版タグは `beta` または `latest` のいずれにも公開できる
- beta プレリリースタグは `beta` にのみ公開できる
- 完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可される
- リリースチェックのコミット SHA モードでも、現在の `origin/main` HEAD が必要
- 実際の公開経路では、事前確認時に使用したものと同じ `npm_dist_tag` を使用しなければならない。
  ワークフローは公開継続前にそのメタデータを検証する

## stable npm リリースシーケンス

stable npm リリースを作成するとき:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行する
   - タグがまだ存在しない場合は、事前確認ワークフローの検証専用ドライランのために
     現在の完全な `main` コミット SHA を使用できる
2. 通常の beta-first フローでは `npm_dist_tag=beta` を選択し、意図的に直接 stable 公開したい場合にのみ `latest` を選択する
3. ライブ prompt cache カバレッジが必要な場合は、同じタグまたは
   現在の完全な `main` コミット SHA を使って `OpenClaw Release Checks` を別途実行する
   - これは意図的な分離であり、公開ワークフローに長時間実行または不安定なチェックを
     再結合せずに、ライブカバレッジを利用可能なままにするため
4. 成功した `preflight_run_id` を保存する
5. `preflight_only=false`、同じ
   `tag`、同じ `npm_dist_tag`、保存した `preflight_run_id` で `OpenClaw NPM Release` を再度実行する
6. リリースが `beta` に着地した場合は、プライベートな
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使って、その stable バージョンを `beta` から `latest` に昇格させる
7. リリースを意図的に直接 `latest` に公開し、`beta` も
   ただちに同じ stable ビルドに追従させたい場合は、同じプライベート
   ワークフローを使って両方の dist-tag を stable バージョンに向けるか、スケジュールされた
   自己修復同期によって後で `beta` を移動させる

dist-tag の変更がプライベートリポジトリにあるのは、依然として
`NPM_TOKEN` が必要である一方、公開リポジトリは OIDC のみの公開を維持するため、
セキュリティ上の理由による。

これにより、直接公開経路と beta-first 昇格経路の両方が
文書化され、オペレーターから見える状態に保たれる。

## 公開リファレンス

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

maintainer は実際のランブックについて、
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
にあるプライベートなリリースドキュメントを使用する。
