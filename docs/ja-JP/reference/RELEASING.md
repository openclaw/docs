---
read_when:
    - 公開リリースチャンネル定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名とリリース周期を探す
summary: リリースレーン、オペレーターチェックリスト、検証ボックス、バージョン命名、ケイデンス
title: リリースポリシー
x-i18n:
    generated_at: "2026-07-04T17:50:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw は現在、ユーザー向けの更新チャネルを 3 つ公開しています。

- stable: 既存の昇格済みリリースチャネル。個別の CLI/チャネルのマイルストーンが完了するまでは、引き続き
  npm `latest` 経由で解決されます
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

これとは別に、リリース運用者は完了済みの直近月の core
パッケージを、パッチ `33` から npm `extended-stable` に公開できます。当月の通常の
final 系列は npm `latest` 上で継続します。この運用者側の公開先分割だけでは、
CLI の更新チャネル解決は変わりません。

## バージョン命名

- 月次 npm extended-stable リリースバージョン: `YYYY.M.PATCH`、`PATCH >= 33`
  - Git タグ: `vYYYY.M.PATCH`
- 日次/通常 final リリースバージョン: `YYYY.M.PATCH`、`PATCH < 33`
  - Git タグ: `vYYYY.M.PATCH`
- 通常のフォールバック修正リリースバージョン: `YYYY.M.PATCH-N`
  - Git タグ: `vYYYY.M.PATCH-N`
- Beta プレリリースバージョン: `YYYY.M.PATCH-beta.N`
  - Git タグ: `vYYYY.M.PATCH-beta.N`
- 月またはパッチをゼロ埋めしない
- 2026 年 6 月のリリースプロセス更新以降、3 つ目のコンポーネントは
  暦日ではなく、月次リリーストレインの連番です。Stable と beta
  リリースが現在のトレインを決定します。alpha のみのタグは、beta/stable
  パッチ番号を消費せず、進めません。更新前のタグと npm バージョンは
  既存の名前を維持し、有効なままです。リリース自動化は引き続き、
  年、月、パッチ、チャネル、プレリリース番号または修正番号で比較します。
- Alpha/nightly ビルドは次の未リリースのパッチトレインを使用し、繰り返しビルドでは
  `alpha.N` のみを増やします。そのパッチに beta が作成されたら、新しい alpha ビルドは
  次のパッチへ移動します。beta または stable トレインを選択するときは、より高いパッチ番号を持つ
  旧来の alpha のみのタグを無視します。
- npm バージョンは不変です。beta タグがすでに公開されている場合は、
  削除、再公開、再利用しないでください。次の beta 番号、または次の月次
  パッチを切ってください。移行中に `2026.6.5-beta.1` がすでに公開されたため、
  2026 年 6 月のリリーストレインはパッチ `5` 以上を使用する必要があります。
  新しい 2026 年 6 月の stable または beta トレインを `2026.6.2`、`2026.6.3`、または
  `2026.6.4` として公開しないでください。
- 通常 final `2026.6.5` の後、次の新しい beta トレインは
  `2026.6.6-beta.1` です。より高いパッチ番号を持つ自動 alpha のみのタグが
  すでに存在していても同じです。
- `latest` は現在の通常/日次 npm 系列に引き続き追従します
- `beta` は現在の beta インストールターゲットを意味します
- `extended-stable` は、パッチ `33` から始まる、サポート対象の直近月 npm パッケージを意味します。
  パッチ `34` 以降は、その月次系列上のメンテナンスリリースです
- 専用の月次 extended-stable パスは、core npm パッケージのみを公開します。
  plugins、macOS または Windows アーティファクト、GitHub Release、
  private-repository dist-tags、Docker イメージ、モバイルアーティファクト、または Web サイトの
  ダウンロードは公開しません。

## リリース頻度

- リリースは beta-first で進みます
- Stable は最新の beta が検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成された `release/YYYY.M.PATCH` ブランチから
  リリースを切るため、リリース検証と修正が `main` 上の新規開発をブロックしません
- beta タグがプッシュまたは公開済みで修正が必要な場合、メンテナーは
  古い beta タグを削除または再作成する代わりに、次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用です

## 月次 npm-only extended-stable 公開

これは以下の通常リリース手順に対する専用の例外です。完了済みの月 `YYYY.M` について、
`extended-stable/YYYY.M.33` を作成します。`vYYYY.M.33` と
それ以降のメンテナンスパッチを、同じブランチから公開します。リリースタグ、ブランチ先頭、
チェックアウト、パッケージバージョン、npm プレフライト、Full Release Validation 実行は、
すべて同じコミットを示す必要があります。保護された `main` には、パッチ `33` 未満の、
厳密に後の暦月の final バージョンがすでに含まれている必要があります。メンテナンスパッチは、
`main` が 1 か月を超えて進んだ後も対象のままです。

npm プレフライトと Full Release Validation を正確な extended-stable ブランチから実行し、
両方の実行 ID を保存します。

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` は既存の検証深度プロファイルです。npm の
`extended-stable` dist-tag とは別であり、意図的に変更していません。

両方の実行が成功し、npm リリース環境の準備が整ったら、正確なプレフライト tarball を昇格します。
パッチ `P` は `33` 以上である必要があります。

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

月次 `.33` または保護された `main` の月ポリシーを意図的に満たせない
fork または非本番リハーサルでは、npm プレフライトと公開 dispatch の両方に
`-f bypass_extended_stable_guard=true` を追加します。デフォルトは `false` です。このバイパスは
`npm_dist_tag=extended-stable` の場合にのみ受け入れられ、ワークフロー概要に記録されます。
これは、正規の `extended-stable/YYYY.M.33` ワークフロー ref、ブランチ先頭/タグ/チェックアウトの一致、
final タグ構文、パッケージ/タグバージョンの一致、参照された実行とマニフェストの同一性、
tarball の来歴、環境承認、レジストリ読み戻し、またはセレクター修復の証拠を
バイパスしません。

公開ワークフローは、参照された実行 ID、準備済み tarball の digest、
および両方の npm レジストリセレクターを検証します。ワークフロー成功後、
結果を個別に確認します。

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

両方のコマンドは `YYYY.M.P` を返す必要があります。公開は成功したがセレクターの
読み戻しに失敗した場合、不変のパッケージバージョンを再公開しないでください。失敗したワークフローの
always-run summary に出力された単一の
`npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復コマンドを使用し、
その後、両方の独立した読み戻しを繰り返します。以前のセレクターへのロールバックは、
読み戻し修復パスではなく、別個の運用者判断です。

以下の通常チェックリストは、beta、`latest`、GitHub Release、
plugins、macOS、Windows、およびその他のプラットフォーム公開を引き続き担当します。この npm-only
extended-stable パスでは、これらの手順を実行しないでください。

## 通常リリース運用者チェックリスト

このチェックリストは、リリースフローの公開上の形です。非公開の認証情報、
署名、公証、dist-tag 復旧、および緊急ロールバックの詳細は、
メンテナー専用のリリース runbook に残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットが push 済みであることを確認し、
   現在の `main` CI がブランチ元として十分に green であることを確認する。
2. 最後に到達可能なリリースタグ以降にマージされた PR とすべての直接
   コミットから、`CHANGELOG.md` の先頭セクションを生成する。エントリはユーザー向けに保ち、
   重複する PR/直接コミットのエントリを重複排除し、書き換えをコミットして push し、
   ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードを確認する。期限切れの
   互換性はアップグレードパスが引き続きカバーされる場合にのみ削除し、そうでなければ
   意図的に保持する理由を記録する。
4. 現在の `main` から `release/YYYY.M.PATCH` を作成する。通常のリリース作業を
   `main` 上で直接行わない。
5. 予定しているタグに必要なすべてのバージョン箇所を更新し、その後
   `pnpm release:prep` を実行する。これは Plugin バージョン、Plugin インベントリ、config
   スキーマ、同梱 channel config メタデータ、config docs ベースライン、Plugin SDK
   exports、Plugin SDK API ベースラインを正しい順序で更新する。タグ付け前に、生成された
   差分をコミットする。その後、ローカルの決定的な事前チェックを実行する:
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行する。タグが存在する前は、
   検証専用の事前チェックに完全な 40 文字のリリースブランチ SHA を使用できる。
   事前チェックは、正確にチェックアウトされた依存関係グラフの依存関係リリース証跡を生成し、
   npm 事前チェック artifact に保存する。成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` で
   すべてのリリース前テストを開始する。これは 4 つの大きなリリーステストボックス、
   Vitest、Docker、QA Lab、Package のための単一の手動 entrypoint である。
8. 検証が失敗した場合は、リリースブランチで修正し、修正を証明する最小の失敗ファイル、
   レーン、workflow ジョブ、package プロファイル、provider、または model 許可リストを再実行する。
   変更された surface により以前の証跡が stale になる場合にのみ、umbrella 全体を再実行する。
9. タグ付き beta candidate の場合は、対応する
   `release/YYYY.M.PATCH` ブランチから
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` を実行する。stable の場合は、必須の Windows source
   release も渡す:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。
   この helper はローカルの生成済みリリースチェックを実行し、full release validation と npm
   事前チェック証跡を dispatch または検証し、正確に準備された tarball に対する Parallels
   fresh/update 証跡と Telegram package 証跡を実行し、Plugin npm と ClawHub の計画を記録し、
   証跡 bundle が green になった後でのみ正確な
   `OpenClaw Release Publish` コマンドを出力する。
   `OpenClaw Release Publish` は、選択された、または publish 可能なすべての Plugin
   package を npm に dispatch し、同じセットを ClawHub に並列で dispatch し、その後 Plugin npm
   publish が成功し次第、対応する dist-tag で準備済みの OpenClaw npm 事前チェック artifact を昇格する。
   OpenClaw npm publish の child が成功した後、一致する完全な
   `CHANGELOG.md` セクションから対応する GitHub release/prerelease ページを作成または更新する。
   npm `latest` に公開された stable release は GitHub の latest release になる。npm `beta` に保持される stable maintenance release は、
   GitHub `latest=false` で作成される。この workflow は、リリース後の incident response のために、
   事前チェックの依存関係証跡、full-validation manifest、postpublish registry
   verification 証跡も GitHub release にアップロードする。publish workflow は child run ID を即時に出力し、
   workflow token が承認可能な release environment gate を自動承認し、失敗した child job を log tail 付きで要約し、
   OpenClaw npm publish が成功し次第 GitHub release と依存関係証跡を close out し、OpenClaw npm が publish される場合は
   ClawHub を待機し、その後 `pnpm release:verify-beta` を実行し、GitHub release、npm package、選択された
   Plugin npm package、選択された ClawHub package、child workflow run ID、任意の NPM Telegram run ID に関する
   postpublish 証跡をアップロードする。ClawHub path は一時的な CLI 依存関係 install failure を retry し、
   1 つの preview cell が flake しても preview に通った Plugin を publish し、最後に期待されるすべての
   Plugin version に対して registry verification を行うため、partial publish は可視かつ retry 可能なままになる。その後、公開済みの
   `openclaw@YYYY.M.PATCH-beta.N` または
   `openclaw@beta` package に対して post-publish
   package acceptance を実行する。push または publish 済みの prerelease に修正が必要な場合は、
   次の対応する prerelease 番号を切る。古い prerelease を削除したり書き換えたりしない。
10. stable の場合、vetted beta または release candidate に必須の検証証跡がそろった後でのみ続行する。
    stable npm publish も `OpenClaw Release Publish` を経由し、成功した事前チェック artifact を
    `preflight_run_id` で再利用する。stable macOS release readiness には、package 済みの
    `.zip`、`.dmg`、`.dSYM.zip`、および更新済みの `appcast.xml` が `main` 上にあることも必要である。
    macOS publish workflow は、release asset の検証後に signed appcast を public `main` に自動的に publish する。
    branch protection が direct push をブロックする場合は、appcast PR を open または update する。Stable Windows Hub
    readiness には、OpenClaw GitHub release 上の signed `OpenClawCompanion-Setup-x64.exe`、
    `OpenClawCompanion-Setup-arm64.exe`、および
    `OpenClawCompanion-SHA256SUMS.txt` asset が必要である。
    正確な signed `openclaw/openclaw-windows-node` release tag を
    `windows_node_tag` として渡し、その candidate-approved installer digest map を
    `windows_node_installer_digests` として渡す。`OpenClaw Release Publish` は
    release draft を保持し、`Windows Node Release` を dispatch し、公開前に 3 つすべての
    asset を検証する。
11. publish 後、npm post-publish verifier、post-publish channel proof が必要な場合は任意の standalone
    published-npm Telegram E2E、必要に応じた dist-tag promotion を実行し、生成された GitHub release page を検証し、
    release announcement 手順を実行してから、stable release を完了と呼ぶ前に [Stable main
    closeout](#stable-main-closeout) を完了する。

## Stable main クローズアウト

Stable publication は、`main` が実際に出荷された release state を持つまで完了していない。

1. fresh な最新 `main` から開始する。それに対して `release/YYYY.M.PATCH` を audit し、
   `main` に存在しない実際の修正を forward-port する。release-only の compatibility、test、validation
   adapter を新しい `main` に盲目的に merge しない。
2. `main` を speculative な次の train ではなく、出荷された stable version に設定する。root version の変更後に
   `pnpm release:prep` を実行し、その後
   `pnpm deps:shrinkwrap:generate` を実行する。
3. `main` 上の `CHANGELOG.md` の `## YYYY.M.PATCH` セクションを、tagged release branch と完全に一致させる。
   mac release が stable `appcast.xml` update を publish した場合は、それも含める。
4. operator がその release train を明示的に開始するまで、`YYYY.M.PATCH+1`、beta version、または空の future changelog
   セクションを `main` に追加しない。
5. `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check`、および
   `OPENCLAW_TESTBOX=1 pnpm check:changed` を実行する。push し、その後 stable release を完了と呼ぶ前に、
   `origin/main` に出荷された version と changelog が含まれていることを検証する。
6. 各 private rollback drill 後、repository variables `RELEASE_ROLLBACK_DRILL_ID` と
   `RELEASE_ROLLBACK_DRILL_DATE` を最新に保つ。
   `OpenClaw Stable Main Closeout` は、stable publication 後に出荷された version、changelog、appcast を持つ
   `main` push から開始する。immutable postpublish evidence を読み取り、出荷済み tag をその Full Release
   Validation と Publish run に紐付け、その後 stable main state、release、mandatory stable soak、blocking performance
   evidence を検証する。immutable closeout manifest と checksum を GitHub release に添付する。automatic
   push trigger は immutable postpublish evidence より前の legacy release を skip し、その skip を完了済み closeout として扱うことはない。
   complete closeout には asset と一致する checksum の両方が必要である。partial manifest は記録された `main` SHA と rollback drill を replay して
   identical bytes を再生成し、その後不足している checksum を添付する。invalid pair、または manifest のない checksum は blocking のままとなる。
   rollback drill repository variables のない push-triggered run は closeout を完了せずに skip する。存在しない、または 90 日超過の
   drill record は、manual evidence-backed closeout でも引き続き blocking となる。private recovery command は maintainer-only runbook に残す。
   manual dispatch は evidence-backed stable closeout の repair または replay にのみ使用する。
   legacy fallback correction tag は、correction tag が base stable tag と同じ source commit に解決される場合にのみ
   base-package evidence を再利用できる。source が異なる correction は、自身の package
   evidence を publish して verify する必要がある。

## リリース事前チェック

- リリースのプリフライト前に `pnpm check:test-types` を実行し、テスト TypeScript が
  より高速なローカル `pnpm check` ゲートの外でもカバーされるようにします
- リリースのプリフライト前に `pnpm check:architecture` を実行し、より広範な import
  cycle とアーキテクチャ境界チェックが、より高速なローカルゲートの外でも成功するようにします
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、想定される
  `dist/*` リリース成果物と Control UI バンドルがパック検証ステップで存在するようにします
- ルートのバージョン更新後、タグ付け前に `pnpm release:prep` を実行します。これは
  バージョン/config/API 変更後にずれやすい、決定的なリリース生成処理をすべて実行します:
  Plugin バージョン、Plugin インベントリ、ベース config
  スキーマ、同梱 channel config メタデータ、config docs ベースライン、Plugin SDK
  exports、Plugin SDK API ベースラインです。`pnpm release:check` はそれらの
  ガードをチェックモードで再実行し、package release checks を実行する前に、検出した
  すべての生成差分失敗を 1 回のパスで報告します。
- Plugin version sync は、公式 Plugin パッケージバージョンと既存の
  `openclaw.compat.pluginApi` 下限を、デフォルトで OpenClaw リリースバージョンへ更新します。
  そのフィールドは単なるパッケージバージョンのコピーではなく、Plugin SDK/runtime API 下限として扱います:
  古い OpenClaw ホストとの互換性を意図的に維持する Plugin のみのリリースでは、最古のサポート対象
  ホスト API のまま下限を保ち、その選択を Plugin リリース証跡に記録します。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、すべての
  プレリリース test box を 1 つのエントリポイントから開始します。これは branch、
  tag、または完全な commit SHA を受け取り、手動 `CI` を dispatch し、install smoke、
  package acceptance、cross-OS package checks、QA Lab parity、Matrix、Telegram レーン用に
  `OpenClaw Release Checks` を dispatch します。Stable と full
  実行には常に網羅的な live/E2E と Docker release-path soak が含まれます。
  明示的な beta soak のために `run_release_soak=true` は保持されています。Package
  Acceptance は candidate 検証中の正規 package Telegram E2E を提供し、
  2 つ目の同時 live poller を避けます。
  beta 公開後は `release_package_spec` を指定して、出荷済み
  npm パッケージを release checks、Package Acceptance、package Telegram
  E2E 全体で再利用し、release tarball を再ビルドしないようにします。
  Telegram が release validation の他の部分とは異なる公開済みパッケージを使う必要がある場合のみ
  `npm_telegram_package_spec` を指定します。
  Package Acceptance が release package spec とは異なる公開済みパッケージを使う必要がある場合は
  `package_acceptance_package_spec` を指定します。
  release evidence report が Telegram E2E を強制せずに、検証が公開済み npm パッケージと一致することを
  証明する必要がある場合は `evidence_package_spec` を指定します。
  例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- release 作業を継続しながら package candidate のサイドチャネル証跡が必要な場合は、手動の
  `Package Acceptance` ワークフローを実行します。`openclaw@beta`、
  `openclaw@latest`、または正確な release version には `source=npm` を使います。
  現在の `workflow_ref` ハーネスで信頼済み `package_ref` branch/tag/SHA を pack するには
  `source=ref` を使います。必須の SHA-256 と厳格な public URL ポリシーを伴う public HTTPS tarball には
  `source=url` を使います。必須の `trusted_source_id` と SHA-256 を使う名前付き trusted-source ポリシーには
  `source=trusted-url` を使います。または、別の GitHub Actions run によって upload された tarball には
  `source=artifact` を使います。この
  ワークフローは candidate を `package-under-test` に解決し、その
  tarball に対して Docker E2E release scheduler を再利用し、同じ tarball に対して
  `telegram_mode=mock-openai` または `telegram_mode=live-frontier` で Telegram QA を実行できます。
  選択した Docker レーンに `published-upgrade-survivor` が含まれる場合、package
  artifact が candidate になり、`published_upgrade_survivor_baseline` が
  公開済み baseline を選択します。`update-restart-auth` は candidate package を
  install 済み CLI と package-under-test の両方として使うため、candidate update command の
  managed restart path を検証します。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  共通プロファイル:
  - `smoke`: install/channel/agent、gateway network、config reload レーン
  - `package`: OpenWebUI または live ClawHub なしの artifact-native package/update/restart/plugin レーン
  - `product`: package プロファイルに加え、MCP channels、cron/subagent cleanup、
    OpenAI web search、OpenWebUI
  - `full`: OpenWebUI を含む Docker release-path チャンク
  - `custom`: focused rerun 用の正確な `docker_lanes` 選択
- release candidate に対して決定的な通常 CI カバレッジだけが必要な場合は、手動の
  `CI` ワークフローを直接実行します。手動 CI dispatch は changed
  scoping をバイパスし、Linux Node shards、bundled-plugin shards、plugin and
  channel contract shards、Node 22 compatibility、`check-*`、`check-additional-*`、
  built-artifact smoke checks、docs checks、Python skills、Windows、macOS、Control UI i18n
  レーンを強制します。Standalone manual CI は
  `include_android=true` で dispatch された場合のみ Android を実行します。`Full Release Validation` は
  その CI child にこの input を渡します。
  Android ありの例: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- release telemetry を検証するときは `pnpm qa:otel:smoke` を実行します。これは
  ローカル OTLP/HTTP receiver 経由で QA-lab を実行し、trace、metric、log
  export に加えて、bounded trace attributes と content/identifier redaction を、Opik、
  Langfuse、または他の外部 collector なしで検証します。
- collector compatibility を検証するときは `pnpm qa:otel:collector-smoke` を実行します。
  これは同じ QA-lab OTLP export を、ローカル receiver assertions の前に実際の OpenTelemetry Collector
  Docker container 経由でルーティングします。
- protected Prometheus scraping を検証するときは `pnpm qa:prometheus:smoke` を実行します。
  これは QA-lab を実行し、未認証の scrape を拒否し、
  release-critical metric families に prompt content、raw identifiers、
  auth tokens、local paths が含まれないことを検証します。
- source-checkout OpenTelemetry と Prometheus smoke レーンを続けて実行したい場合は
  `pnpm qa:observability:smoke` を実行します。
- すべてのタグ付きリリース前に `pnpm release:check` を実行します
- `OpenClaw NPM Release` プリフライトは、npm tarball を pack する前に
  dependency release evidence を生成します。npm advisory vulnerability gate は
  release-blocking です。transitive manifest risk、dependency ownership/install
  surface、dependency change report は release evidence のみです。
  dependency change report は release candidate を以前の到達可能な release tag と比較します。
- プリフライトは dependency evidence を
  `openclaw-release-dependency-evidence-<tag>` として upload し、準備済み npm preflight artifact 内の
  `dependency-evidence/` にも埋め込みます。実際の publish path はその preflight artifact を再利用し、
  同じ evidence を GitHub release に `openclaw-<version>-dependency-evidence.zip` として添付します。
- tag が存在した後、変更を伴う publish sequence には `OpenClaw Release Publish` を実行します。
  `release/YYYY.M.PATCH` から dispatch し（main-reachable tag を公開する場合は `main` から）、
  release tag、成功した OpenClaw npm
  `preflight_run_id`、成功した `full_release_validation_run_id` を渡し、意図的に focused repair を
  実行している場合を除き、デフォルトの Plugin publish scope `all-publishable` を維持します。
  このワークフローは plugin npm publish、plugin
  ClawHub publish、OpenClaw npm publish を直列化し、core package が外部化された Plugin より前に
  公開されないようにします。
- Stable `OpenClaw Release Publish` では、一致する非 prerelease の
  `openclaw/openclaw-windows-node` リリースが存在した後、正確な `windows_node_tag` が必要です。
  また candidate-approved の `windows_node_installer_digests` map も必要です。
  publish child を dispatch する前に、source release が
  公開済みで、非 prerelease であり、必須の x64/ARM64 installers を含み、
  その approved map とまだ一致していることを検証します。その後、OpenClaw release がまだ draft の間に
  `Windows Node Release` を dispatch し、固定された installer
  digest map を変更せずに渡します。child
  workflow は、その正確な tag から署名済み Windows Hub installers を download し、
  固定された digest と照合し、Windows runner 上で Authenticode
  signatures が想定される OpenClaw Foundation signer を使っていることを検証し、
  SHA-256 manifest を書き込み、installers と manifest を
  canonical OpenClaw GitHub release に upload した後、promoted assets を再 download して
  manifest membership と hashes を検証します。parent は publication 前に現在の
  x64、ARM64、checksum asset contract を検証します。Direct recovery は、想定される contract assets を
  固定された source bytes で置き換える前に、予期しない `OpenClawCompanion-*` asset names を拒否します。
  `Windows Node Release` を手動 dispatch するのは recovery の場合のみとし、常に正確な tag を渡し、
  `latest` は使わず、approved source release からの明示的な `expected_installer_digests` JSON map を渡します。
  Website download links は、現在の stable release の正確な OpenClaw
  release asset URLs を対象にするか、GitHub の latest redirect が同じ release を指すことを検証した後にのみ
  `releases/latest/download/...` を対象にします。companion repo release
  page だけへ link しないでください。
- Release checks は現在、別の手動ワークフローで実行されます:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、release approval 前に QA Lab mock parity レーンに加えて、高速な
  live Matrix プロファイルと Telegram QA レーンも実行します。live
  レーンは `qa-live-shared` environment を使います。Telegram は Convex CI
  credential leases も使います。完全な Matrix
  transport、media、E2EE inventory を並列で実行したい場合は、手動の `QA-Lab - All Lanes` ワークフローを
  `matrix_profile=all` と `matrix_shards=true` で実行します。
- Cross-OS install and upgrade runtime validation は public
  `OpenClaw Release Checks` と `Full Release Validation` の一部であり、これらは再利用可能ワークフロー
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出します
- この分割は意図的です: 実際の npm release path は短く、
  決定的で artifact-focused に保ち、遅い live checks は独自のレーンに置くことで、
  publish を停止またはブロックしないようにします
- secret を含む release checks は、`Full Release
Validation` 経由、または `main`/release workflow ref から dispatch し、workflow logic と
  secrets が制御された状態を維持する必要があります
- `OpenClaw Release Checks` は、resolved commit が OpenClaw branch または release tag から到達可能である限り、
  branch、tag、または完全な commit SHA を受け取ります
- `OpenClaw NPM Release` validation-only preflight は、pushed tag を要求せずに、現在の
  完全な 40 文字 workflow-branch commit SHA も受け取ります
- その SHA path は validation-only であり、実際の publish へ昇格できません
- SHA mode では、workflow は package metadata check のためだけに `v<package.json version>` を合成します。
  実際の publish には引き続き実際の release tag が必要です
- 両方のワークフローは実際の publish と promotion path を GitHub-hosted
  runners 上に維持し、変更を伴わない validation path はより大きな
  Blacksmith Linux runners を使用できます
- そのワークフローは、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` workflow secrets の両方を使って
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を実行します
- npm release preflight は、別の release checks レーンを待たなくなりました
- release candidate をローカルでタグ付けする前に、
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` を実行します。このヘルパーは
  fast release guardrails、plugin npm/ClawHub release checks、build、
  UI build、`release:openclaw:npm:check` を、GitHub publish workflow が開始される前に
  一般的な approval-blocking mistakes を検出する順序で実行します。
- 承認前に `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応する beta/correction tag）を実行します
- npm publish 後、実行します
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  （または対応する beta/correction バージョン）を実行して、公開済み registry の
  install パスを新しい一時 prefix で検証する
- beta 公開後は、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  を実行して、共有リース済み Telegram credential プールを使い、公開済み npm パッケージに対する installed-package オンボーディング、Telegram セットアップ、実 Telegram E2E を検証する。ローカル maintainer の単発実行では Convex 変数を省略し、3つの
  `OPENCLAW_QA_TELEGRAM_*` env credentials を直接渡してもよい。
- maintainer マシンから post-publish beta smoke 全体を実行するには、`pnpm release:beta-smoke -- --beta betaN` を使う。この helper は Parallels npm update/fresh-target validation を実行し、`NPM Telegram Beta E2E` を dispatch し、正確な workflow run を poll し、artifact をダウンロードして Telegram レポートを出力する。
- Maintainers は、手動の `NPM Telegram Beta E2E` workflow 経由で GitHub Actions から同じ post-publish check を実行できる。これは意図的に manual-only であり、すべての merge では実行されない。
- Maintainer release automation は、現在 preflight-then-promote を使う:
  - 実 npm publish には、成功した npm `preflight_run_id` が必要
  - 実 npm publish は、成功した preflight run と同じ `main` または
    `release/YYYY.M.PATCH` branch から dispatch する必要がある
  - stable npm releases のデフォルトは `beta`
  - stable npm publish は workflow input で明示的に `latest` を target にできる
  - token-based npm dist-tag mutation は現在
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` にある。これは、source repo が OIDC-only publish を維持する一方で、
    `npm dist-tag add` には引き続き `NPM_TOKEN` が必要なため
  - public `macOS Release` は validation-only。tag が release branch のみに存在し、workflow が `main` から dispatch される場合は、
    `public_release_branch=release/YYYY.M.PATCH` を設定する
  - 実 macOS publish には、成功した macOS `preflight_run_id` と
    `validate_run_id` が必要
  - 実 publish パスは artifact を再度 rebuild するのではなく、準備済み artifact を promote する
- `YYYY.M.PATCH-N` のような stable correction releases では、post-publish verifier は
  `YYYY.M.PATCH` から `YYYY.M.PATCH-N` への同じ temp-prefix upgrade パスも検証するため、release corrections が古い global installs を base stable payload のまま静かに残すことはできない
- npm release preflight は、tarball に
  `dist/control-ui/index.html` と空ではない `dist/control-ui/assets/` payload の両方が含まれていない限り fail closed するため、空の browser dashboard を再び出荷しない
- Post-publish verification は、公開済み Plugin entrypoints と package metadata が installed registry layout に存在することも確認する。Plugin runtime payloads が欠落した release は postpublish verifier に失敗し、
  `latest` に promote できない。
- `pnpm test:install:smoke` は candidate update tarball に対して npm pack `unpackedSize` budget も強制するため、installer e2e は release publish パスの前に意図しない pack bloat を検出する
- release 作業で CI planning、extension timing manifests、または
  extension test matrices に触れた場合は、approval 前に
  `.github/workflows/plugin-prerelease.yml` から planner-owned
  `plugin-prerelease-extension-shard` matrix outputs を再生成してレビューし、release notes が古い CI layout を記述しないようにする
- Stable macOS release readiness には updater surfaces も含まれる:
  - GitHub release には、最終的に package 済みの `.zip`、`.dmg`、`.dSYM.zip` が含まれている必要がある
  - `main` 上の `appcast.xml` は publish 後に新しい stable zip を指している必要がある。macOS publish workflow が自動的に commit するか、direct push がブロックされた場合は appcast PR を開く
  - package 済み app は、その release version の canonical Sparkle build floor 以上の、non-debug bundle id、空ではない Sparkle feed
    URL、そして `CFBundleVersion` を維持する必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターがすべてのリリース前テストを
1つのエントリポイントから開始するためのものです。動きの速いブランチ上で固定コミットの証明を行う場合は、
各子ワークフローがターゲット SHA に固定された一時ブランチから実行されるように、
ヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` を push し、そのブランチから
`ref=<sha>` で `Full Release Validation` を dispatch し、すべての子ワークフローの
`headSha` がターゲットと一致することを検証してから、一時ブランチを削除します。これにより、
誤って新しい `main` の子実行を証明してしまうことを防ぎます。

リリースブランチまたはタグの検証では、信頼済みの `main` ワークフロー
ref から実行し、リリースブランチまたはタグを `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

ワークフローはターゲット ref を解決し、`target_ref=<release-ref>` で手動 `CI` を
dispatch してから、`OpenClaw Release Checks` を dispatch します。
`OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、
soak が有効な場合の live/E2E Docker リリースパスカバレッジ、標準の Telegram パッケージ E2E を含む Package Acceptance、
QA Lab パリティ、live Matrix、live Telegram に展開します。full/all 実行は、
`Full Release Validation` サマリーで `normal_ci`、`plugin_prerelease`、`release_checks` が
成功と表示されている場合にのみ許容されます。ただし、焦点を絞った再実行で別個の `Plugin
Prerelease` 子を意図的にスキップした場合は例外です。スタンドアロンの `npm-telegram` 子は、
`release_package_spec` または
`npm_telegram_package_spec` を指定した、公開済みパッケージの焦点を絞った再実行にのみ使用します。最終
検証サマリーには各子実行の最遅ジョブ表が含まれるため、リリース
マネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージマトリクス、正確なワークフロージョブ名、stable プロファイルと full プロファイルの違い、
アーティファクト、焦点を絞った再実行ハンドルについては、[Full release validation](/ja-JP/reference/full-release-validation) を参照してください。
子ワークフローは、`Full Release
Validation` を実行する信頼済み ref、通常は `--ref main` から dispatch されます。ターゲット `ref` が
古いリリースブランチやタグを指している場合でも同じです。Full Release Validation
workflow-ref 用の別入力はありません。ワークフロー実行 ref を選ぶことで、信頼済みハーネスを選択します。
移動する `main` 上で正確なコミット証明を行うために `--ref main -f ref=<sha>` を使用しないでください。
生のコミット SHA は workflow dispatch ref になれないため、
`pnpm ci:full-release --sha <sha>` を使用して、固定された一時ブランチを作成します。

live/provider の幅を選ぶには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: minimum に加え、リリース承認用の stable provider/backend カバレッジ
- `full`: stable に加え、広範な助言的 provider/media カバレッジ

Stable と full の検証では、プロモーション前に必ず、網羅的な live/E2E、Docker
リリースパス、境界付きの公開済みアップグレード生存者スイープを実行します。
ベータに同じスイープを要求するには `run_release_soak=true` を使用します。そのスイープは、
最新の4つの stable パッケージに加え、固定された `2026.4.23` と `2026.5.2`
ベースライン、さらに古い `2026.4.15` カバレッジを対象にし、重複するベースラインを除去し、
各ベースラインを独自の Docker runner ジョブにシャーディングします。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用してターゲット
ref を `release-package-under-test` として一度だけ解決し、soak 実行時にはそのアーティファクトをクロス OS、
Package Acceptance、リリースパス Docker チェックで再利用します。これにより、
すべてのパッケージ向けボックスが同じバイト列を使い、パッケージビルドの繰り返しを避けられます。
ベータがすでに npm に公開された後は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を設定して、
リリースチェックが出荷済みパッケージを一度だけダウンロードし、`dist/build-info.json` からビルド元
SHA を抽出し、そのアーティファクトをクロス OS、
Package Acceptance、リリースパス Docker、パッケージ Telegram レーンで再利用するようにします。
クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は
`OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.4` を使用します。このレーンは、
最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、Gateway 起動、
1回の live agent turn を証明するためです。より広範な live provider
マトリクスが、モデル固有カバレッジの場所として残ります。

リリース段階に応じて、これらのバリアントを使用します。

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

焦点を絞った修正後の最初の再実行として、full umbrella を使用しないでください。1つのボックスが
失敗した場合は、次の証明に、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデル
provider、または QA レーンを使用します。修正が共有リリースオーケストレーションを変更した場合、
または以前の全ボックス証拠を古くした場合にのみ、full umbrella を再度実行します。umbrella の最終検証は、
記録された子ワークフロー実行 ID を再チェックするため、子ワークフローを正常に再実行した後は、
失敗した `Verify full validation` 親ジョブだけを再実行します。

境界付きの復旧では、umbrella に `rerun_group` を渡します。`all` は実際の
リリース候補実行、`ci` は通常の CI 子のみ、`plugin-prerelease`
はリリース専用 Plugin 子のみ、`release-checks` はすべてのリリース
ボックスを実行し、より狭いリリースグループは `install-smoke`、`cross-os`、
`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。
焦点を絞った `npm-telegram` 再実行には `release_package_spec` または
`npm_telegram_package_spec` が必要です。full/all 実行では、Package Acceptance 内の標準パッケージ Telegram
E2E を使用します。焦点を絞った
クロス OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または
別の OS/suite フィルターを追加できます。QA release-check の失敗は、標準ティアで必要な OpenClaw 動的ツールドリフトを含め、
通常のリリース検証をブロックします。
Tideclaw alpha 実行では、パッケージ安全性以外の release-check レーンを
引き続き助言的に扱う場合があります。`live_suite_filter` が Discord、WhatsApp、Slack などのゲート付き QA live レーンを明示的に要求する場合、
対応する
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 変数を有効にする必要があります。有効でない場合、
レーンを黙ってスキップするのではなく、入力キャプチャが失敗します。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に
変更スコープを迂回し、リリース候補に対して通常のテストグラフを強制します。
Linux Node シャード、バンドル Plugin シャード、Plugin とチャンネルの contract
シャード、Node 22 互換性、`check-*`、`check-additional-*`、
ビルド済みアーティファクトのスモークチェック、docs チェック、Python skills、Windows、macOS、
Control UI i18n が対象です。umbrella が `include_android=true` を渡すため、
`Full Release Validation` がこのボックスを実行する場合は Android も含まれます。スタンドアロンの手動 CI では、
Android カバレッジに `include_android=true` が必要です。

このボックスは「ソースツリーが完全な通常テストスイートに合格したか？」に答えるために使用します。
これはリリースパスのプロダクト検証とは同じではありません。保持する証拠:

- dispatch された `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確なターゲット SHA 上で green になった `CI` 実行
- 回帰調査時の CI ジョブからの失敗または遅いシャード名
- 実行にパフォーマンス分析が必要な場合の
  `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定的な通常 CI が必要だが、
Docker、QA Lab、live、クロス OS、またはパッケージボックスが不要な場合にのみ、手動 CI を直接実行します。非 Android の直接 CI には最初のコマンドを使用します。直接
リリース候補 CI で Android を対象にする必要がある場合は、`include_android=true` を追加します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` 経由の
`OpenClaw Release Checks` と、release-mode の
`install-smoke` ワークフロー内にあります。これは、ソースレベルのテストだけでなく、
パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには以下が含まれます。

- 遅い Bun グローバルインストールスモークを有効にした完全なインストールスモーク
- ターゲット SHA による root Dockerfile スモークイメージの準備/再利用。QR、
  root/gateway、installer/Bun スモークジョブは別々の install-smoke
  シャードとして実行される
- repository E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル Plugin インストール/アンインストールレーン
  `bundled-plugin-install-uninstall-0` から
  `bundled-plugin-install-uninstall-23`
- リリースチェックに live スイートが含まれる場合の live/E2E provider スイートと Docker live モデルカバレッジ

再実行の前に Docker アーティファクトを使用します。リリースパススケジューラーは、
レーンログ、`summary.json`、`failures.json`、
フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む
`.artifacts/docker-tests/` をアップロードします。焦点を絞った復旧では、
すべてのリリースチャンクを再実行するのではなく、再利用可能な live/E2E ワークフローで
`docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の
`package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、
失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは agentic
動作とチャンネルレベルのリリースゲートであり、Vitest や Docker
パッケージ機構とは別です。

リリース QA Lab カバレッジには以下が含まれます。

- agentic parity pack を使用して、OpenAI 候補レーンを Opus 4.6
  ベースラインと比較する mock parity レーン
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI 認証情報リースを使用する live Telegram QA レーン
- リリース telemetry に明示的なローカル
  証明が必要な場合の `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、
  `pnpm qa:prometheus:smoke`、または
  `pnpm qa:observability:smoke`

このボックスは「リリースが QA シナリオと
live チャンネルフローで正しく動作するか？」に答えるために使用します。リリース承認時には、parity、Matrix、Telegram
レーンのアーティファクト URL を保持します。Full Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、
手動シャーディング QA-Lab 実行として引き続き利用できます。

### パッケージ

Package ボックスはインストール可能なプロダクトのゲートです。これは
`Package Acceptance` とリゾルバー
`scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。このリゾルバーは、
候補を Docker E2E が消費する `package-under-test` tarball に正規化し、
パッケージ inventory を検証し、パッケージバージョンと SHA-256 を記録し、
ワークフローハーネス ref をパッケージソース ref から分離したままにします。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリース
  バージョン
- `source=ref`: 選択した `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA
  をパックする
- `source=url`: 必須の `package_sha256` とともに公開 HTTPS `.tgz` をダウンロードする。
  URL 認証情報、デフォルト以外の HTTPS ポート、プライベート/内部/特殊用途の
  ホスト名または解決済みアドレス、安全でないリダイレクトは拒否される
- `source=trusted-url`: 必須の
  `package_sha256` と `.github/package-trusted-sources.json` 内の名前付きポリシーからの `trusted_source_id`
  とともに HTTPS `.tgz` をダウンロードする。`source=url` に入力レベルのプライベートネットワークバイパスを追加する代わりに、
  メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにはこれを使用する
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用する

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、
`telegram_mode=mock-openai` でパッケージ受け入れ検証を実行する。パッケージ受け入れ検証は、同じ解決済み
tarball に対して、移行、更新、設定済み認証の更新再起動、ライブ ClawHub skill インストール、古い Plugin 依存関係のクリーンアップ、オフライン Plugin
フィクスチャ、Plugin 更新、Telegram パッケージ QA を維持する。ブロッキングリリースチェックは、デフォルトの最新公開済みパッケージ
ベースラインを使用する。`run_release_soak=true`、`release_profile=stable`、または
`release_profile=full` を指定したベータプロファイルは、`2026.4.23` から
`latest` までのすべての安定版 npm 公開済みベースラインに加えて、報告済みイシューフィクスチャへ拡張される。すでに出荷済みの候補には
`source=npm`、公開前の SHA で裏付けられたローカル npm tarball には
`source=ref`、メンテナー所有のエンタープライズ/プライベートミラーには `source=trusted-url`、別の GitHub Actions 実行でアップロードされた準備済み tarball には
`source=artifact` でパッケージ受け入れ検証を使用する。
これは、以前は Parallels が必要だったパッケージ/更新カバレッジの大部分に対する GitHub ネイティブの
代替である。OS 固有のオンボーディング、
インストーラー、プラットフォーム動作には引き続きクロス OS リリースチェックが重要だが、パッケージ/更新のプロダクト検証では
パッケージ受け入れ検証を優先するべきである。

更新と Plugin 検証の正規チェックリストは
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) である。
Plugin のインストール/更新、doctor クリーンアップ、公開済みパッケージ移行変更を証明する
ローカル、Docker、パッケージ受け入れ検証、またはリリースチェックのレーンを決定するときに使用する。
すべての安定版 `2026.4.23+` パッケージからの網羅的な公開済み更新移行は、
Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローである。

従来のパッケージ受け入れ検証の寛容さは、意図的に期限付きである。`2026.4.25` までのパッケージは、
すでに npm に公開されたメタデータの不足に対して互換性パスを使用できる。対象は、tarball に存在しないプライベート QA インベントリエントリ、
欠落した `gateway install --wrapper`、tarball 由来の git
フィクスチャに存在しないパッチファイル、永続化された `update.channel` の欠落、従来の Plugin インストール記録
ロケーション、マーケットプレイスのインストール記録永続化の欠落、`plugins update` 中の config メタデータ
移行である。公開済みの `2026.4.26` パッケージは、すでに出荷されたローカルビルドメタデータスタンプファイルについて警告を出せる。
それ以降のパッケージは、現代のパッケージ契約を満たす必要がある。同じ不足はリリース
検証で失敗する。

リリース上の問いが実際にインストール可能なパッケージに関するものである場合は、より広いパッケージ受け入れ検証プロファイルを使用する。

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

- `smoke`: パッケージのインストール/チャンネル/エージェント、Gateway ネットワーク、config
  リロードレーンのクイック検証
- `package`: インストール/更新/再起動/Plugin パッケージ契約に加えて、ライブ ClawHub
  skill インストール証明。これはリリースチェックのデフォルトである
- `product`: `package` に MCP チャンネル、cron/サブエージェントクリーンアップ、OpenAI web
  search、OpenWebUI を追加
- `full`: OpenWebUI を含む Docker リリースパスのチャンク
- `custom`: 焦点を絞った再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、パッケージ受け入れ検証で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にする。ワークフローは解決済みの
`package-under-test` tarball を Telegram レーンに渡す。スタンドアロンの
Telegram ワークフローは、公開後チェック用に公開済み npm spec を引き続き受け入れる。

## 通常リリース公開自動化

ベータ、`latest`、Plugin、GitHub Release、プラットフォーム公開では、
`OpenClaw Release Publish` が通常の変更を伴うエントリーポイントである。月次の
`.33+` npm のみの extended-stable パスは、このオーケストレーターを使用しない。通常のワークフローは、
リリースに必要な順序で trusted-publisher ワークフローを調整する。

1. リリースタグをチェックアウトし、そのコミット SHA を解決する。
2. タグが `main` または `release/*` から到達可能であることを確認する。
3. `pnpm plugins:sync:check` を実行する。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で
   `Plugin NPM Release` をディスパッチする。
5. 同じスコープと SHA で `Plugin ClawHub Release` をディスパッチする。
6. 保存済みの `full_release_validation_run_id` を確認した後、リリースタグ、npm dist-tag、保存済み
   `preflight_run_id` で `OpenClaw NPM Release` をディスパッチする。
7. 安定版リリースでは、GitHub release をドラフトとして作成または更新し、明示的な
   `windows_node_tag` と候補承認済みの `windows_node_installer_digests` で
   `Windows Node Release` をディスパッチし、ドラフトを公開する前に正規の
   インストーラー/チェックサムアセットを確認する。

ベータ公開の例:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

デフォルトのベータ dist-tag への安定版公開:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

`latest` へ直接行う安定版プロモーションは明示的である。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、
焦点を絞った修復または再公開作業にのみ使用する。`OpenClaw Release Publish` は
`publish_openclaw_npm=true` の場合に `plugin_publish_scope=selected` を拒否するため、
`@openclaw/diffs-language-pack` を含むすべての公開可能な公式 Plugin なしでコア
パッケージが出荷されることはない。選択した Plugin の修復では、
`plugin_publish_scope=selected` と `plugins=@openclaw/name` とともに
`publish_openclaw_npm=false` を設定するか、子ワークフローを直接ディスパッチする。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、次のオペレーター制御入力を受け入れる。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合、検証専用 preflight 用として、現在の
  完全な 40 文字のワークフローブランチコミット SHA も使用できる
- `preflight_only`: 検証/ビルド/パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスで必須。ワークフローが成功した preflight 実行から準備済み tarball を再利用するために使う
- `full_release_validation_run_id`: 実際の月次 extended-stable および通常の
  非ベータ公開で必須。ワークフローが正確な検証実行を認証するために使う
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。`alpha`、`beta`、
  `latest`、または `extended-stable` を受け入れ、デフォルトは `beta`。最終パッチ `33` 以降は
  `extended-stable` を使用する必要がある。デフォルトでは、`extended-stable` はそれより前のパッチを拒否し、非最終タグは常に拒否する。
- `bypass_extended_stable_guard`: テスト専用ブール値。デフォルトは `false`。
  `npm_dist_tag=extended-stable` とともに使用すると、リリース ID、アーティファクト、承認、読み戻しチェックを維持したまま、
  月次 extended-stable の適格性をバイパスする。

`OpenClaw Release Publish` は、次のオペレーター制御入力を受け入れる。

- `tag`: 必須のリリースタグ。すでに存在している必要がある
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight 実行 ID。
  `publish_openclaw_npm=true` の場合は必須
- `full_release_validation_run_id`: 成功した `Full Release Validation` 実行
  ID。`publish_openclaw_npm=true` の場合は必須
- `windows_node_tag`: 正確な非プレリリースの `openclaw/openclaw-windows-node`
  リリースタグ。安定版 OpenClaw 公開で必須
- `windows_node_installer_digests`: 現在の Windows インストーラー名から固定された `sha256:` ダイジェストへの、候補承認済みコンパクト JSON マップ。
  安定版 OpenClaw 公開で必須
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。`selected` は
  `publish_openclaw_npm=false` とともに、焦点を絞った Plugin のみの修復作業にだけ使用する
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin のみの修復オーケストレーターとして使用する場合にだけ `false` を設定する
- `wait_for_clawhub`: デフォルトは `false`。npm の可用性が ClawHub サイドカーにブロックされないようにするため。
  ワークフロー完了に ClawHub 完了を含める必要がある場合にのみ `true` を設定する

`OpenClaw Release Checks` は、次のオペレーター制御入力を受け入れる。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを伴うチェックでは、
  解決済みコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要がある。
- `run_release_soak`: ベータリリースチェック用に、網羅的なライブ/E2E、Docker リリースパス、および
  all-since upgrade-survivor soak を有効にする。`release_profile=stable` と `release_profile=full` によって強制的に有効化される。

ルール:

- パッチ `33` 未満の通常の最終版と修正版は、`beta` または `latest` のどちらにも公開できる。
  パッチ `33` 以上の最終版は `extended-stable` に公開する必要があり、その境界での修正サフィックス付きバージョンは拒否される。
- ベータプレリリースタグは `beta` にのみ公開できる
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可される
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用である
- 実際の公開パスは、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要がある。
  ワークフローは、公開前にメタデータが継続していることを確認する

## 通常のベータ/latest 安定版リリース手順

この従来の手順は、Plugin、GitHub Release、Windows、その他のプラットフォーム作業も所有する、
通常の調整済みリリース用である。これは、このページの先頭で文書化されている
月次 `.33+` npm のみの extended-stable パスではない。

通常の調整済み安定版リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行する
   - タグが存在する前は、プレフライトワークフローの検証専用ドライランに、
     現在の完全なワークフローブランチのコミット SHA を使用できる
2. 通常のベータ優先フローでは `npm_dist_tag=beta` を選択し、意図的に直接安定版を公開したい場合のみ
   `latest` を選択する
3. 1 つの手動ワークフローから通常の CI に加えて、ライブプロンプトキャッシュ、Docker、QA Lab、
   Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全な
   コミット SHA で `Full Release Validation` を実行する
4. 意図的に決定的な通常のテストグラフだけが必要な場合は、代わりにリリース ref で
   手動の `CI` ワークフローを実行する
5. 署名済み x64 および ARM64 インストーラーとして出荷する、正確な非プレリリースの
   `openclaw/openclaw-windows-node` リリースタグを選択する。それを
   `windows_node_tag` として保存し、検証済みのダイジェストマップを
   `windows_node_installer_digests` として保存する。リリース候補ヘルパーは両方を記録し、
   生成する公開コマンドに含める。
6. 成功した `preflight_run_id` と `full_release_validation_run_id` を保存する
7. 同じ `tag`、同じ `npm_dist_tag`、選択した `windows_node_tag`、保存した
   `windows_node_installer_digests`、保存した `preflight_run_id`、保存した
   `full_release_validation_run_id` で `OpenClaw Release Publish` を実行する。
   これは OpenClaw npm パッケージを昇格する前に、外部化された plugins を npm と ClawHub に公開する
8. リリースが `beta` に到達した場合は、
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使用して、その安定版を `beta` から `latest` に昇格する
9. リリースを意図的に直接 `latest` に公開し、`beta` も同じ安定版ビルドを直ちに追従させる必要がある場合は、
   同じリリースワークフローを使用して両方の dist-tags を安定版に向けるか、
   スケジュールされた自己修復同期によって後から `beta` を移動させる

dist-tag の変更はリリース台帳リポジトリにある。これはまだ
`NPM_TOKEN` が必要である一方、ソースリポジトリは OIDC のみの公開を維持しているため。

これにより、直接公開パスとベータ優先の昇格パスの両方が文書化され、
オペレーターに見える状態に保たれる。

メンテナーがローカル npm 認証にフォールバックする必要がある場合は、1Password
CLI (`op`) コマンドを専用の tmux セッション内でのみ実行する。メインのエージェントシェルから `op` を
直接呼び出してはならない。tmux 内に保つことで、プロンプト、アラート、OTP 処理を観察可能にし、
ホストアラートの繰り返しを防げる。

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

メンテナーは実際のランブックとして、非公開のリリースドキュメント
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用する。

## 関連

- [リリースチャネル](/ja-JP/install/development-channels)
