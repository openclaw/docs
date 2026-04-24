---
read_when:
    - 公開リリースチャネルの定義を探している場合
    - バージョン命名とリリース頻度を探している場合
summary: 公開リリースチャネル、バージョン命名、リリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-04-24T05:18:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c752c399ad3df90d54a6582454febbffefff4d785309c756cc3a2ac4c3c24ceb
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClawには3つの公開リリースレーンがあります:

- stable: npmではデフォルトで `beta` に公開されるタグ付きリリース。明示的に要求された場合は npm `latest` に公開
- beta: npm `beta` に公開されるprerelease tag
- dev: `main` の移動中の先端

## バージョン命名

- Stable release version: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- Stable correction release version: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- Beta prerelease version: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- 月や日はゼロ埋めしない
- `latest` は現在promoteされたstable npm releaseを意味する
- `beta` は現在のbeta install targetを意味する
- stableとstable correction releaseはデフォルトでnpm `beta` に公開される。release operatorは明示的に `latest` を対象にすることも、後で検証済みbeta buildをpromoteすることもできる
- すべてのstable OpenClaw releaseはnpm packageとmacOS appを同時出荷する。
  beta releaseでは通常、npm/package pathを先に検証・公開し、
  mac app build/sign/notarizeは明示的に要求されない限りstable用に留保される

## リリース頻度

- リリースはbeta-firstで進む
- stableは、最新betaが検証された後にのみ続く
- maintainerは通常、現在の `main` から作成した `release/YYYY.M.D` branchからリリースを切るため、
  release validationと修正が `main` 上の新規
  developmentを止めない
- beta tagがpushまたはpublish済みで修正が必要になった場合、maintainerは
  古いbeta tagを削除または再作成するのではなく、次の `-beta.N` tagを切る
- 詳細なリリース手順、承認、credential、復旧に関する注記は
  maintainer専用

## Release preflight

- test TypeScriptが
  より高速なローカル `pnpm check` gateの外でもカバーされるよう、release preflight前に `pnpm check:test-types` を実行する
- より広いimport
  cycleおよびarchitecture境界checkが高速なローカルgateの外でもgreenになるよう、release preflight前に `pnpm check:architecture` を実行する
- pack
  validation stepに必要な `dist/*` release artifactとControl UI bundleが存在するよう、`pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行する
- すべてのtagged releaseの前に `pnpm release:check` を実行する
- release checkは現在、別の手動workflowで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、release approval前にQA Lab mock parity gateとlive
  MatrixおよびTelegram QA laneも実行する。live laneは
  `qa-live-shared` environmentを使い、TelegramはさらにConvex CI credential leaseを使う
- cross-OS installとupgradeランタイム検証は、private caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  からdispatchされ、再利用可能なpublic workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  を呼び出す
- この分割は意図的である: 実際のnpm release pathは短く、
  決定的でartifact中心に保ちつつ、遅いlive checkは
  別レーンに置いてpublishを停止・ブロックしないようにする
- release checkは `main` workflow refまたは
  `release/YYYY.M.D` workflow refからdispatchされなければならず、workflow logicとsecretが
  制御されたままになる
- そのworkflowは既存release tagまたは、現在の完全な
  40文字workflow-branch commit SHAのいずれかを受け取れる
- commit-SHA modeでは、現在のworkflow-branch HEADのみ受け付ける。
  古いrelease commitにはrelease tagを使う
- `OpenClaw NPM Release` のvalidation-only preflightも、push済みtagを必要とせず、
  現在の完全な40文字workflow-branch commit SHAを受け取れる
- そのSHA pathはvalidation-onlyであり、実際のpublishへpromoteすることはできない
- SHA modeではworkflowはpackage metadata check用にのみ `v<package.json version>` を合成する。
  実際のpublishには依然として本物のrelease tagが必要
- 両workflowとも、実際のpublishとpromotion pathはGitHub-hosted
  runner上に保ちつつ、変更を伴わないvalidation pathはより大きな
  Blacksmith Linux runnerを使える
- そのworkflowは
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両workflow secretを使って実行する
- npm release preflightはもはや別のrelease checks laneを待たない
- 承認前に
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応するbeta/correction tag）を実行する
- npm publish後は、
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応するbeta/correction version）を実行して、fresh temp prefix内の
  公開済みregistry install pathを検証する
- maintainer release automationは現在preflight-then-promoteを使う:
  - 実際のnpm publishは成功したnpm `preflight_run_id` を通過していなければならない
  - 実際のnpm publishは、成功したpreflight runと同じ `main` または
    `release/YYYY.M.D` branchからdispatchされなければならない
  - stable npm releaseはデフォルトで `beta`
  - stable npm publishはworkflow input経由で明示的に `latest` を指定できる
  - tokenベースのnpm dist-tag mutationは現在
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    にあり、セキュリティのためそうしている。なぜなら `npm dist-tag add` は依然として `NPM_TOKEN` を必要とし、
    public repoはOIDC-only publishを保っているため
  - public `macOS Release` はvalidation-only
  - 実際のprivate mac publishは、成功したprivate mac
    `preflight_run_id` と `validate_run_id` を通過していなければならない
  - 実際のpublish pathはartifactを再buildするのではなく、準備済みartifactをpromoteする
- `YYYY.M.D-N` のようなstable correction releaseでは、post-publish verifierは
  `YYYY.M.D` から `YYYY.M.D-N` への同じtemp-prefix upgrade pathも確認するため、
  release correctionによって古いglobal installがbase stable payloadに静かに留まることを防ぐ
- npm release preflightは、tarballに `dist/control-ui/index.html` と
  空でない `dist/control-ui/assets/` payloadの両方が含まれていない限りフェイルクローズし、
  空のbrowser dashboardを再び出荷しないようにする
- Post-publish verificationは、公開済みregistry installに
  ルート `dist/*` layout配下の空でないbundled plugin runtime dependencyも含まれていることを確認する。
  bundled plugin
  dependency payloadが欠けている、または空であるreleaseはpostpublish verifierに失敗し、
  `latest` へpromoteできない
- `pnpm test:install:smoke` も候補update tarballのnpm pack `unpackedSize` budgetを強制するため、
  installer e2eがrelease publish path前に偶発的なpack肥大化を検出する
- release作業がCI planning、extension timing manifest、または
  extension test matrixに触れた場合は、承認前に `.github/workflows/ci.yml` から
  planner所有の `checks-node-extensions` workflow matrix outputを再生成・レビューし、
  staleなCI layoutをrelease noteに書かないようにする
- Stable macOS release readinessにはupdaterサーフェスも含まれる:
  - GitHub releaseには、パッケージ化された `.zip`, `.dmg`, `.dSYM.zip`
    が最終的に含まれていなければならない
  - `main` 上の `appcast.xml` はpublish後に新しいstable zipを指していなければならない
  - パッケージ化appは、非debug bundle id、空でないSparkle feed
    URL、およびそのrelease versionに対する正規Sparkle build floor以上の `CFBundleVersion` を維持しなければならない

## NPM workflow input

`OpenClaw NPM Release` は次のoperator制御inputを受け付けます:

- `tag`: 必須release tag。例: `v2026.4.2`, `v2026.4.2-1`, または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合は、validation-only preflight用に
  現在の完全な40文字workflow-branch commit SHAも可
- `preflight_only`: validation/build/packageのみなら `true`、実際のpublish pathなら `false`
- `preflight_run_id`: 実際のpublish pathで必須。workflowが成功したpreflight runの準備済みtarballを再利用するため
- `npm_dist_tag`: publish path向けのnpm target tag。デフォルトは `beta`

`OpenClaw Release Checks` は次のoperator制御inputを受け付けます:

- `ref`: 既存release tag、または `main` からdispatchする場合は現在の完全な40文字 `main` commit
  SHA。release branchからなら、既存release tagまたは現在の完全な40文字release-branch commit
  SHAを使う

ルール:

- Stableおよびcorrection tagは `beta` または `latest` のどちらにも公開できる
- Beta prerelease tagは `beta` にのみ公開できる
- `OpenClaw NPM Release` では、完全commit SHA入力は
  `preflight_only=true` の場合にのみ許可される
- `OpenClaw Release Checks` は常にvalidation-onlyであり、
  現在のworkflow-branch commit SHAも受け付ける
- Release checksのcommit-SHA modeでは、現在のworkflow-branch HEADも必要
- 実際のpublish pathは、preflight時に使ったのと同じ `npm_dist_tag` を使わなければならず、
  workflowはpublish継続前にそのmetadataを検証する

## Stable npm releaseシーケンス

stable npm releaseを切るとき:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行する
   - tagがまだ存在しない場合、preflight workflowのvalidation-only dry runには現在の完全なworkflow-branch commit
     SHAを使える
2. 通常のbeta-firstフローでは `npm_dist_tag=beta` を選ぶ。意図的にdirect stable publishしたい場合にのみ `latest`
3. live prompt cache,
   QA Lab parity, Matrix, Telegram coverageが必要なら、同じtagまたは
   現在のworkflow-branch commit SHA全文字で、別途 `OpenClaw Release Checks` を実行する
   - これは意図的に分離されている。live coverageを維持しつつ、
     長時間またはflakyなcheckをpublish workflowへ再結合しないため
4. 成功した `preflight_run_id` を保存する
5. `preflight_only=false`、同じ
   `tag`、同じ `npm_dist_tag`、保存した `preflight_run_id` で `OpenClaw NPM Release` を再度実行する
6. releaseが `beta` に着地した場合は、privateな
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflowを使って、そのstable versionを `beta` から `latest` へpromoteする
7. releaseが意図的に `latest` へ直接publishされ、`beta`
   もすぐ同じstable buildに追随すべきなら、同じprivate
   workflowを使って両dist-tagをstable versionへ向けるか、そのscheduled
   self-healing syncに後で `beta` を動かさせる

dist-tag mutationは、依然として
`NPM_TOKEN` を必要とするため、セキュリティ上private repoにあります。一方public repoはOIDC-only publishを維持します。

これにより、direct publish pathとbeta-first promotion pathの両方が
文書化され、operatorから可視になります。

## 公開リファレンス

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

maintainerは、実際のrunbookとして
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
内のprivate release docを使います。

## 関連

- [Release channels](/ja-JP/install/development-channels)
