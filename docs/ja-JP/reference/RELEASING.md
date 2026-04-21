---
read_when:
    - 公開リリースチャネルの定義を探しています
    - バージョン命名とリリース頻度を探しています
summary: 公開リリースチャネル、バージョン命名、およびリリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-04-21T04:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# リリースポリシー

OpenClawには3つの公開リリースレーンがあります。

- stable: デフォルトではnpmの`beta`へ公開されるtagged release。明示的に要求された場合はnpmの`latest`へ公開
- beta: npmの`beta`へ公開されるprerelease tag
- dev: `main`の移動する先端

## バージョン命名

- stable release version: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- stable correction release version: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- beta prerelease version: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- 月と日はゼロ埋めしない
- `latest`は現在promoteされているstableなnpm releaseを意味する
- `beta`は現在のbeta install targetを意味する
- stableとstable correction releasesはデフォルトでnpmの`beta`へ公開される。release operatorは明示的に`latest`を指定することも、後で検証済みbeta buildをpromoteすることもできる
- すべてのstableなOpenClaw releaseはnpm packageとmacOS appを一緒に出荷する。
  beta releasesでは通常、先にnpm/package pathを検証して公開し、
  mac appのbuild/sign/notarizeは明示的に要求されない限りstable向けに留める

## リリース頻度

- releasesはbeta-firstで進む
- stableは最新betaが検証された後にのみ続く
- maintainersは通常、現在の`main`から作成した`release/YYYY.M.D` branchから
  releasesを切るため、release validationとfixesが`main`上の新規
  developmentを妨げない
- beta tagがpushまたはpublishされた後で修正が必要になった場合、maintainersは
  古いbeta tagを削除または再作成する代わりに、次の`-beta.N` tagを切る
- 詳細なrelease手順、承認、credentials、recovery notesは
  maintainer専用

## リリース事前確認

- release preflightの前に`pnpm check:test-types`を実行し、
  より高速なローカル`pnpm check` gateの外でもtest TypeScriptが
  カバーされるようにする
- release preflightの前に`pnpm check:architecture`を実行し、より広いimport
  cycleとarchitecture boundary checksが高速ローカルgateの外でも正常であるようにする
- `pnpm release:check`の前に`pnpm build && pnpm ui:build`を実行し、pack
  validation stepに必要な
  `dist/*` release artifactsとControl UI bundleが存在するようにする
- すべてのtagged releaseの前に`pnpm release:check`を実行する
- release checksは現在、別の手動workflowで実行される:
  `OpenClaw Release Checks`
- クロスOSのinstallおよびupgradeのruntime validationは、private caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  からディスパッチされ、このworkflowは再利用可能な公開workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  を呼び出す
- この分離は意図的である: 実際のnpm release pathを短く、
  決定論的で、artifact重視に保ちつつ、より遅いlive checksは
  publishを遅延またはブロックしない独自レーンに置く
- release checksは、workflow logicとsecretsが
  管理されたままになるよう、`main`のworkflow refまたは
  `release/YYYY.M.D`のworkflow refからディスパッチしなければならない
- そのworkflowは、既存のrelease tagまたは現在の完全な
  40文字のworkflow-branch commit SHAのいずれかを受け付ける
- commit-SHA modeでは、現在のworkflow-branch HEADのみを受け付ける。
  古いrelease commitsにはrelease tagを使う
- `OpenClaw NPM Release`のvalidation-only preflightも、
  push済みtagを必要とせず現在の完全な40文字workflow-branch commit SHAを受け付ける
- そのSHA pathはvalidation-onlyであり、実際のpublishへpromoteすることはできない
- SHA modeでは、workflowはpackage metadata checkのためにのみ
  `v<package.json version>`を合成する。実際のpublishには引き続き実在するrelease tagが必要
- どちらのworkflowも、実際のpublishとpromotion pathはGitHub-hosted
  runners上に維持し、非破壊のvalidation pathはより大きい
  Blacksmith Linux runnersを使える
- そのworkflowは
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を、`OPENAI_API_KEY`と`ANTHROPIC_API_KEY`のworkflow secretsの両方を使って実行する
- npm release preflightは、もはや別のrelease checks laneを待たない
- 承認前に
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応するbeta/correction tag）を実行する
- npm publish後に、
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  （または対応するbeta/correction version）を実行し、新しいtemp prefixで
  publishされたregistry install pathを検証する
- maintainerのrelease automationは現在preflight-then-promoteを使う:
  - 実際のnpm publishは成功したnpm `preflight_run_id`を通過しなければならない
  - 実際のnpm publishは、成功したpreflight runと同じ`main`または
    `release/YYYY.M.D` branchからディスパッチしなければならない
  - stableなnpm releasesはデフォルトで`beta`
  - stableなnpm publishはworkflow inputで明示的に`latest`を指定できる
  - tokenベースのnpm dist-tag変更は現在
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    にあり、セキュリティのためである。`npm dist-tag add`は依然として`NPM_TOKEN`を必要とする一方で、
    公開repoはOIDC-only publishを維持しているため
  - 公開の`macOS Release`はvalidation-only
  - 実際のprivate mac publishは成功したprivate macの
    `preflight_run_id`と`validate_run_id`を通過しなければならない
  - 実際のpublish pathsは、artifactsを再度buildするのではなく
    準備済みartifactsをpromoteする
- `YYYY.M.D-N`のようなstable correction releasesでは、post-publish verifierは
  `YYYY.M.D`から`YYYY.M.D-N`への同じtemp-prefix upgrade pathも確認するため、
  release correctionsによって古いglobal installsがbase stable payloadのまま
  ひそかに残ることはない
- npm release preflightは、tarballに
  `dist/control-ui/index.html`と空でない`dist/control-ui/assets/` payloadの両方が含まれていない限り
  fail closedする。これにより、空のbrowser dashboardを再び出荷しない
- `pnpm test:install:smoke`もcandidate update tarballのnpm pack
  `unpackedSize` budgetを強制するため、installer e2eがrelease publish pathの前に
  pack肥大化の偶発を検知する
- release作業がCI planning、extension timing manifests、または
  extension test matricesに触れた場合、approval前に
  `.github/workflows/ci.yml`からplanner所有の
  `checks-node-extensions` workflow matrix outputsを再生成して確認する。そうしないと
  release notesが古いCI layoutを説明してしまう
- stable macOS release readinessにはupdater surfacesも含まれる:
  - GitHub releaseには、package化された`.zip`、`.dmg`、`.dSYM.zip`
    が最終的に含まれていなければならない
  - `main`上の`appcast.xml`はpublish後に新しいstable zipを指していなければならない
  - package化されたappは、非debug bundle id、空でないSparkle feed
    URL、およびそのrelease versionに対する正式なSparkle build floor以上の
    `CFBundleVersion`を維持しなければならない

## NPM workflow inputs

`OpenClaw NPM Release`は、operatorが制御する次のinputsを受け付けます。

- `tag`: 必須のrelease tag。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`。`preflight_only=true`のときは、
  validation-only preflight用に現在の完全な
  40文字workflow-branch commit SHAも使用可能
- `preflight_only`: validation/build/packageのみなら`true`、実際のpublish pathなら`false`
- `preflight_run_id`: 実際のpublish pathでは必須。workflowが成功したpreflight runから
  準備済みtarballを再利用するため
- `npm_dist_tag`: publish path向けのnpm target tag。デフォルトは`beta`

`OpenClaw Release Checks`は、operatorが制御する次のinputsを受け付けます。

- `ref`: 既存のrelease tag、または`main`からディスパッチしたときに検証する
  現在の完全な40文字`main` commit SHA。release branchからは、
  既存のrelease tagまたは現在の完全な40文字release-branch commit
  SHAを使う

ルール:

- stableおよびcorrection tagsは`beta`または`latest`のどちらにも公開できる
- beta prerelease tagsは`beta`にのみ公開できる
- `OpenClaw NPM Release`では、完全なcommit SHA inputは
  `preflight_only=true`のときのみ許可される
- `OpenClaw Release Checks`は常にvalidation-onlyであり、
  現在のworkflow-branch commit SHAも受け付ける
- release checksのcommit-SHA modeでも、現在のworkflow-branch HEADが必要
- 実際のpublish pathは、preflightで使ったものと同じ`npm_dist_tag`を使わなければならない。
  workflowはpublish継続前にそのmetadataを検証する

## Stable npm release sequence

stableなnpm releaseを切るとき:

1. `preflight_only=true`で`OpenClaw NPM Release`を実行する
   - tagがまだ存在しない場合、preflight workflowのvalidation-only dry runには
     現在の完全なworkflow-branch commit
     SHAを使える
2. 通常のbeta-firstフローでは`npm_dist_tag=beta`を選ぶ。意図的にdirect stable publishしたい場合のみ`latest`
3. live prompt cache
   coverageが欲しい場合は、同じtagまたは完全な現在のworkflow-branch commit SHAで
   `OpenClaw Release Checks`を別に実行する
   - これは意図的に分離されており、長時間実行または不安定なchecksをpublish workflowに
     再結合せずにlive coverageを維持できるようにしている
4. 成功した`preflight_run_id`を保存する
5. `preflight_only=false`、同じ
   `tag`、同じ`npm_dist_tag`、保存した`preflight_run_id`で
   `OpenClaw NPM Release`を再度実行する
6. releaseが`beta`に着地した場合、private
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflowを使って、そのstable versionを`beta`から`latest`へpromoteする
7. releaseが意図的に直接`latest`へpublishされ、`beta`も
   直ちに同じstable buildを追従させるべき場合は、同じprivate
   workflowを使って両方のdist-tagをstable versionへ向けるか、そのscheduled
   self-healing syncに後で`beta`を移動させる

dist-tag変更は、依然として
`NPM_TOKEN`を必要とするためセキュリティ上の理由からprivate repoにあります。一方、公開repoはOIDC-only publishを維持します。

これにより、direct publish pathとbeta-first promotion pathの両方が
文書化され、operatorから見える状態に保たれます。

## 公開リファレンス

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

maintainersは、実際のrunbookとして
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
にあるprivate release docsを使用します。
