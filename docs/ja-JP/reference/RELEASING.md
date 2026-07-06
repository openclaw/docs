---
read_when:
    - 公開リリースチャネル定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名とリリース周期を確認しています
summary: リリースレーン、オペレーターチェックリスト、検証ボックス、バージョン命名、 cadence
title: リリースポリシー
x-i18n:
    generated_at: "2026-07-06T10:52:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9c40bab337e28cb1e0263a45d2d1de7a515def2492a810de8a150ef1f4fe18d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw は現在、ユーザー向けの更新チャネルを 3 つ公開しています。

- stable: 既存の昇格済みリリースチャネル。独立した CLI/チャネルのマイルストーンが到達するまでは、引き続き npm `latest` 経由で解決されます
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

これとは別に、リリース担当者は、完了した直近月のコアパッケージを、パッチ `33` から npm `extended-stable` に公開できます。当月の通常の最終ラインは npm `latest` 上で継続します。この担当者側の公開分割だけでは、CLI の更新チャネル解決は変わりません。

Tideclaw アルファビルドは、別個の内部プレリリーストラック（npm dist-tag `alpha`）であり、[NPM workflow inputs](#npm-workflow-inputs) と [Release test boxes](#release-test-boxes) で扱います。

## バージョン命名

- 月次 npm extended-stable リリースバージョン: `YYYY.M.PATCH`、`PATCH >= 33`、git タグ `vYYYY.M.PATCH`
- 日次/通常の最終リリースバージョン: `YYYY.M.PATCH`、`PATCH < 33`、git タグ `vYYYY.M.PATCH`
- 通常のフォールバック修正リリースバージョン: `YYYY.M.PATCH-N`、git タグ `vYYYY.M.PATCH-N`
- Beta プレリリースバージョン: `YYYY.M.PATCH-beta.N`、git タグ `vYYYY.M.PATCH-beta.N`
- Alpha プレリリースバージョン: `YYYY.M.PATCH-alpha.N`、git タグ `vYYYY.M.PATCH-alpha.N`
- 月またはパッチをゼロ埋めしない
- `PATCH` はカレンダー日ではなく、月次リリーストレインの連番です。通常の最終リリースと beta リリースは現在のトレインを進めます。alpha のみのタグは beta/通常のパッチ番号を消費も進行もしないため、beta または通常のトレインを選ぶときは、より高いパッチ番号を持つレガシーな alpha のみのタグを無視してください。
- Alpha/nightly ビルドは次の未リリースのパッチトレインを使用し、繰り返しビルドでは `alpha.N` のみを増やします。そのパッチに beta が付いたら、新しい alpha ビルドは次のパッチに移ります。
- npm バージョンは不変です。公開済みタグを削除、再公開、再利用してはいけません。代わりに次のプレリリース番号または次の月次パッチを切ってください。
- `latest` は引き続き現在の通常/日次 npm ラインに従います。`beta` は現在の beta インストール先です
- `extended-stable` は、パッチ `33` から始まる、サポート対象の直近月 npm パッケージを意味します。パッチ `34` 以降はその月次ライン上のメンテナンスリリースです
- 通常の最終リリースと通常の修正リリースは、デフォルトで npm `beta` に公開されます。リリース担当者は明示的に `latest` を対象にすることも、後から検証済みの beta ビルドを昇格することもできます
- 専用の月次 extended-stable パスは、コア npm パッケージと、npm 公開可能なすべての公式 Plugin を同一の正確なバージョンで公開します。Plugin を ClawHub に公開したり、macOS または Windows アーティファクト、GitHub Release、プライベートリポジトリ dist-tag、Docker イメージ、モバイルアーティファクト、Web サイトのダウンロードを公開したりはしません。
- 通常の最終リリースごとに、npm パッケージ、macOS アプリ、署名済み Windows Hub インストーラーを一緒に出荷します。Beta リリースでは通常、まず npm/package パスを検証して公開し、ネイティブアプリのビルド/署名/公証/昇格は、明示的に要求されない限り通常の最終リリース用に予約します。

## リリース周期

- リリースは beta 優先で進みます。stable は最新 beta が検証された後にのみ追従します
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.PATCH` ブランチからリリースを切ります。これにより、リリース検証と修正が `main` 上の新規開発をブロックしません
- beta タグが push または公開済みで修正が必要な場合、メンテナーは古いタグを削除または再作成するのではなく、次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、認証情報、復旧メモはメンテナー専用です

## 月次 npm 専用 extended-stable 公開

これは、下記の通常リリース手順に対する専用の例外です。完了した月 `YYYY.M` について、`extended-stable/YYYY.M.33` を作成します。`vYYYY.M.33` と、それ以降のメンテナンスパッチは同じブランチから公開します。リリースタグ、ブランチ先端、チェックアウト、パッケージバージョン、npm プレフライト、Full Release Validation 実行は、すべて同じコミットを識別している必要があります。保護された `main` には、パッチ `33` 未満の、厳密に後のカレンダー月の最終バージョンがすでに含まれている必要があります。メンテナンスパッチは、`main` が 1 か月を超えて進んだ後も対象のままです。

正確な extended-stable ブランチ上で、ルートパッケージを `YYYY.M.P` に上げ、`pnpm release:prep` を実行し、公開可能なすべての拡張パッケージが同じバージョンであることを検証します。生成された変更をすべてコミットして push し、そのコミットに不変の `vYYYY.M.P` タグを作成して push し、結果の完全な SHA を記録します。ワークフローはこの準備済みツリーを使用します。バージョンの引き上げや同期は行いません。

その正確な準備済みブランチ先端から npm プレフライトと Full Release Validation を実行し、両方の run ID を保存します。

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

`release_profile=stable` は既存の検証深度プロファイルです。npm `extended-stable` dist-tag とは別であり、意図的に変更されていません。

両方の実行が成功したら、同じ正確なブランチ先端から npm 公開可能なすべての公式 Plugin を公開します。パッチ `P` は `33` 以上でなければなりません。完全なリリース SHA を `ref` として渡し、完全なマトリックスとレジストリ読み戻しを待ってから、成功した Plugin NPM Release run ID を保存します。

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

このワークフローは、ソースが変更されていないパッケージを含め、通常の準備済み `all-publishable` パッケージインベントリを使用します。成功する前に、すべての正確なパッケージと、すべての Plugin `extended-stable` タグを検証します。部分的な実行が失敗した場合は、同じコマンドを再実行してください。すでに公開済みのパッケージは再利用され、欠落または古い Plugin タグは npm リリース環境下で調整され、最終読み戻しは引き続き完全なパッケージセットを対象にします。

Plugin ワークフローが成功し、npm リリース環境の準備ができたら、正確なコアプレフライト tarball を公開します。コア公開では、参照された Plugin 実行が、同じ正準ブランチと正確なソース SHA 上で `completed/success` であることを検証します。

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

月次 `.33` または保護された `main` の月ポリシーを意図的に満たせないフォークまたは非本番リハーサルでは、npm プレフライトと公開ディスパッチの両方に `-f bypass_extended_stable_guard=true` を追加します。デフォルトは `false` です。このバイパスは `npm_dist_tag=extended-stable` の場合にのみ受け入れられ、ワークフローサマリーに記録されます。正準の `extended-stable/YYYY.M.33` ワークフロー ref、ブランチ先端/タグ/チェックアウトの一致、最終タグ構文、パッケージ/タグのバージョン一致、参照実行とマニフェストの同一性、tarball の来歴、環境承認、レジストリ読み戻し、セレクター修復証拠はバイパスしません。

公開ワークフローは、参照されたプレフライト、検証、Plugin 実行の同一性、準備済み tarball ダイジェスト、コアレジストリセレクターを検証します。ワークフロー成功後に結果を個別に確認します。

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

両方のコマンドが `YYYY.M.P` を返す必要があります。公開は成功したがセレクターの読み戻しが失敗した場合、不変のパッケージバージョンを再公開してはいけません。失敗したワークフローの常時実行サマリーに出力される単一の `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復コマンドを使用し、その後で両方の独立した読み戻しを再実行してください。以前のセレクターへのロールバックは別個の担当者判断であり、読み戻し修復パスではありません。

公開サポートドキュメントでは当初、Slack、Discord、Codex を対象の extended-stable Plugin サーフェスとして指定します。このリストはサポート声明であり、リリースコードの allowlist ではありません。npm 公開可能なすべての公式 Plugin は、同じ正確なバージョン公開パスに従います。

下記の通常チェックリストは、引き続き beta、`latest`、GitHub Release、Plugin、macOS、Windows、その他のプラットフォーム公開を担います。この npm 専用 extended-stable パスでは、それらの手順を実行しないでください。

## 通常リリース担当者チェックリスト

このチェックリストは、リリースフローの公開形です。プライベート認証情報、署名、公証、dist-tag 復旧、緊急ロールバックの詳細は、メンテナー専用のリリース runbook に残します。

1. 現在の `main` から開始します。最新を pull し、対象コミットが push 済みであることを確認し、ブランチ元として十分に `main` CI が green であることを確認します。
2. 最後に到達可能なリリースタグ以降にマージされた PR とすべての直接コミットから、`CHANGELOG.md` の先頭セクションを生成します。エントリはユーザー向けにし、重複する PR/直接コミットのエントリを重複排除し、コミット、push、ブランチ作成前にもう一度 rebase/pull します。
3. `src/plugins/compat/registry.ts` と `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性記録をレビューします。期限切れの互換性は、アップグレードパスが引き続きカバーされている場合にのみ削除するか、意図的に保持する理由を記録します。
4. 現在の `main` から `release/YYYY.M.PATCH` を作成します。通常のリリース作業を `main` 上で直接行わないでください。
5. タグに必要なすべてのバージョン位置を上げてから、`pnpm release:prep` を実行します。これは順番に、Plugin バージョン、npm shrinkwrap、Plugin インベントリ、ベース設定スキーマ、バンドル済みチャネル設定メタデータ、設定ドキュメントベースライン、Plugin SDK エクスポート、Plugin SDK API ベースラインを更新します。タグ付け前に生成された差分をコミットし、その後でローカルの決定的プレフライトを実行します: `pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build`、`pnpm release:check`。
6. `preflight_only=true` で `OpenClaw NPM Release` を実行します。タグが存在する前は、検証専用プレフライトに完全な 40 文字のリリースブランチ SHA を使用できます。プレフライトは、正確にチェックアウトされた依存グラフの依存リリース証拠を生成し、npm プレフライトアーティファクトに保存します。成功した `preflight_run_id` を保存します。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` で全プレリリーステストを開始します。これは 4 つの大きなリリーステストボックス、Vitest、Docker、QA Lab、Package に対する単一の手動エントリポイントです。`full_release_validation_run_id` を保存します。これは `OpenClaw NPM Release` と `OpenClaw Release Publish` の両方で必須入力です。
8. 検証が失敗した場合は、リリースブランチ上で修正し、修正を証明する最小の失敗ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル allowlist を再実行します。変更サーフェスにより以前の証拠が古くなる場合にのみ、完全な統合ワークフローを再実行します。
9. タグ付き beta 候補の場合は、一致する `release/YYYY.M.PATCH` ブランチから `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` を実行します。stable の場合は、必要な Windows ソースリリースも渡します: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。このヘルパーは、ローカルの生成済みリリースチェックを実行し、Full Release Validation と npm プレフライト証拠をディスパッチまたは検証し、正確な準備済み tarball に対する Parallels fresh/update 証拠と Telegram パッケージ証拠を実行し、Plugin npm と ClawHub の計画を記録し、証拠バンドルが green になった後にのみ正確な `OpenClaw Release Publish` コマンドを出力します。

   `OpenClaw Release Publish` は、選択された、または公開可能なすべての Plugin パッケージを npm に、同じセットを ClawHub に並列でディスパッチし、Plugin の npm publish が成功すると、準備済みの OpenClaw npm プレフライトアーティファクトを一致する dist-tag で昇格します。OpenClaw npm publish の子ワークフローが成功した後、一致する完全な `CHANGELOG.md` セクションから、対応する GitHub release/prerelease ページを作成または更新します。npm `latest` に公開された安定版リリースは GitHub の latest release になり、npm `beta` に保持された安定版メンテナンスリリースは GitHub `latest=false` で作成されます。このワークフローは、リリース後のインシデント対応のために、プレフライト依存関係エビデンス、完全検証マニフェスト、postpublish レジストリ検証エビデンスも GitHub release にアップロードします。子 run ID を即座に出力し、ワークフロートークンで承認できる release environment gate を自動承認し、失敗した子ジョブをログ末尾付きで要約し、OpenClaw npm publish が成功し次第 GitHub release と依存関係エビデンスを完了し、OpenClaw npm が公開される場合は必ず ClawHub を待機し、その後 `pnpm release:verify-beta` を実行して、GitHub release、npm パッケージ、選択された Plugin npm パッケージ、選択された ClawHub パッケージ、子ワークフロー run ID、任意の NPM Telegram run ID の postpublish エビデンスをアップロードします。ClawHub パスは一時的な CLI 依存関係インストール失敗をリトライし、1 つの preview セルが不安定でも preview を通過した Plugin を公開し、期待されるすべての Plugin バージョンについてレジストリ検証で終了するため、部分的な公開は可視かつリトライ可能なままになります。

   次に、公開された `openclaw@YYYY.M.PATCH-beta.N` または `openclaw@beta` パッケージに対して post-publish package acceptance を実行します。push 済みまたは公開済みの prerelease に修正が必要な場合は、次の一致する prerelease 番号を切ります。古いものを削除したり書き換えたりしてはいけません。

10. 安定版では、検証済みの beta または release candidate に必要な検証エビデンスが揃ってから続行します。安定版 npm publish も `OpenClaw Release Publish` を通り、成功したプレフライトアーティファクトを `preflight_run_id` で再利用します。安定版 macOS release readiness には、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および更新済みの `appcast.xml` が `main` 上にあることも必要です。macOS publish ワークフローは、release asset の検証後に署名済み appcast を public `main` に自動公開します。branch protection が直接 push をブロックする場合は、appcast PR を開くか更新します。安定版 Windows Hub readiness には、OpenClaw GitHub release 上の署名済み `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe`、`OpenClawCompanion-SHA256SUMS.txt` asset が必要です。正確な署名済み `openclaw/openclaw-windows-node` release tag を `windows_node_tag` として渡し、その candidate 承認済み installer digest map を `windows_node_installer_digests` として渡します。`OpenClaw Release Publish` は release draft を保持し、`Windows Node Release` をディスパッチし、公開前に 3 つすべての asset を検証します。
11. 公開後、npm post-publish verifier、post-publish channel proof が必要な場合は任意の standalone published-npm Telegram E2E、必要に応じた dist-tag promotion を実行し、生成された GitHub release ページを検証し、release announcement 手順を実行してから、安定版リリースを完了と呼ぶ前に [Stable main closeout](#stable-main-closeout) を完了します。

## Stable main closeout

安定版の公開は、`main` が実際に出荷されたリリース状態を保持するまで完了していません。

1. 最新の新鮮な `main` から開始します。それに対して `release/YYYY.M.PATCH` を監査し、`main` に存在しない実際の修正を forward-port します。release 専用の互換性、テスト、検証アダプターを新しい `main` に盲目的に merge してはいけません。
2. `main` を、推測上の次の train ではなく、出荷済みの安定版バージョンに設定します。root version 変更後に `pnpm release:prep` を実行し、その後 `pnpm deps:shrinkwrap:generate` を実行します。
3. `main` 上の `CHANGELOG.md` の `## YYYY.M.PATCH` セクションを、tag 付き release branch と完全に一致させます。mac release が公開した場合は、安定版 `appcast.xml` の更新を含めます。
4. operator がその release train を明示的に開始するまで、`YYYY.M.PATCH+1`、beta バージョン、または空の将来 changelog セクションを `main` に追加してはいけません。
5. `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check`、`OPENCLAW_TESTBOX=1 pnpm check:changed` を実行します。push してから、安定版リリースを完了と呼ぶ前に、`origin/main` が出荷済みバージョンと changelog を含んでいることを検証します。
6. private rollback drill のたびに、repository variables `RELEASE_ROLLBACK_DRILL_ID` と `RELEASE_ROLLBACK_DRILL_DATE` を最新に保ちます。

`OpenClaw Stable Main Closeout` は、安定版公開後に出荷済みバージョン、changelog、appcast を保持する `main` push から開始します。不変の postpublish エビデンスを読み取り、出荷済み tag をその Full Release Validation および Publish run に結び付け、その後、安定版 main 状態、release、必須の安定版 soak、ブロック対象の performance エビデンスを検証します。不変の closeout manifest と checksum を GitHub release に添付します。自動 push trigger は、不変の postpublish エビデンスより前の legacy release をスキップし、そのスキップを完了済み closeout として扱うことはありません。

完全な closeout には、asset と一致する checksum の両方が必要です。部分的な manifest は、記録された `main` SHA と rollback drill を再生して同一 bytes を再生成し、不足している checksum を添付します。不正なペア、または manifest のない checksum はブロックのままです。rollback drill repository variables のない push-triggered run は、closeout を完了せずにスキップします。drill record がない、または 90 日を超えて古い場合は、手動の evidence-backed closeout でもブロックされます。private recovery command は maintainer-only runbook に残ります。manual dispatch は、evidence-backed stable closeout の修復または再生にのみ使用してください。

legacy fallback correction tag は、correction tag が base stable tag と同じ source commit に解決される場合にのみ、base-package エビデンスを再利用できます。異なる source の correction は、独自の package エビデンスを公開して検証する必要があります。

## Release preflight

- release preflight の前に `pnpm check:test-types` を実行し、テスト TypeScript が高速なローカル `pnpm check` gate の外でもカバーされるようにします。
- release preflight の前に `pnpm check:architecture` を実行し、より広範な import cycle と architecture boundary check が高速なローカル gate の外でも green になるようにします。
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、期待される `dist/*` release artifact と Control UI bundle が pack validation step に存在するようにします。
- root version bump 後、tag 付け前に `pnpm release:prep` を実行します。これは、version/config/API 変更後にずれやすいすべての決定的な release generator を実行します。Plugin version、npm shrinkwrap、Plugin inventory、base config schema、bundled channel config metadata、config docs baseline、Plugin SDK exports、Plugin SDK API baseline です。`pnpm release:check` はそれらの guard を check mode で再実行し、さらに Plugin SDK surface budget check を加え、package release check を実行する前に、生成物の drift failure を 1 回でまとめて報告します。
- Plugin version sync は、publishable な `@openclaw/ai` runtime package、official Plugin package version、既存の `openclaw.compat.pluginApi` floor を、デフォルトで OpenClaw release version に更新します。そのフィールドは単なる package version のコピーではなく、Plugin SDK/runtime API floor として扱ってください。古い OpenClaw host との互換性を意図的に維持する Plugin-only release では、floor をサポート対象の最古 host API のままにし、その選択を Plugin release proof に記録します。
- release approval の前に手動の `Full Release Validation` ワークフローを実行し、すべての pre-release test box を 1 つの entrypoint から開始します。branch、tag、または完全な commit SHA を受け取り、手動 `CI` をディスパッチし、install smoke、package acceptance、cross-OS package check、QA Lab parity、Matrix、Telegram lane のために `OpenClaw Release Checks` をディスパッチします。安定版と full run には、常に網羅的な live/E2E と Docker release-path soak が含まれます。`run_release_soak=true` は、明示的な beta soak のために保持されています。Package Acceptance は candidate validation 中に canonical package Telegram E2E を提供し、2 つ目の同時 live poller を避けます。

  beta を公開した後、`release_package_spec` を指定すると、release tarball を再ビルドせずに、出荷済み npm パッケージを release check、Package Acceptance、package Telegram E2E 全体で再利用できます。Telegram が他の release validation とは異なる公開済みパッケージを使うべき場合にのみ、`npm_telegram_package_spec` を指定します。Package Acceptance が release package spec とは異なる公開済みパッケージを使うべき場合は、`package_acceptance_package_spec` を指定します。Telegram E2E を強制せずに、release evidence report が validation と公開済み npm パッケージの一致を証明すべき場合は、`evidence_package_spec` を指定します。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- release 作業を続けながら package candidate の side-channel proof が必要な場合は、手動の `Package Acceptance` ワークフローを実行します。`openclaw@beta`、`openclaw@latest`、または正確な release version には `source=npm` を使用します。現在の `workflow_ref` harness で信頼済みの `package_ref` branch/tag/SHA を pack するには `source=ref` を使用します。必須の SHA-256 と厳格な public URL policy を伴う public HTTPS tarball には `source=url` を使用します。必須の `trusted_source_id` と SHA-256 を使う named trusted-source policy には `source=trusted-url` を使用します。別の GitHub Actions run によってアップロードされた tarball には `source=artifact` を使用します。

  ワークフローは candidate を `package-under-test` に解決し、その tarball に対して Docker E2E release scheduler を再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対して Telegram QA を実行できます。選択された Docker lane に `published-upgrade-survivor` が含まれる場合、package artifact が candidate になり、`published_upgrade_survivor_baseline` が公開済み baseline を選択します。`update-restart-auth` は candidate package を installed CLI と package-under-test の両方として使用するため、candidate update command の managed restart path を実行します。

  例:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  一般的な profile:
  - `smoke`: install/channel/agent、Gateway network、config reload lane
  - `package`: OpenWebUI または live ClawHub なしの artifact-native package/update/restart/plugin lane
  - `product`: package profile に加えて MCP channel、cron/subagent cleanup、OpenAI web search、OpenWebUI
  - `full`: OpenWebUI 付き Docker release-path chunk
  - `custom`: focused rerun のための正確な `docker_lanes` selection

- release candidate に対して決定的な通常 CI coverage だけが必要な場合は、手動の `CI` ワークフローを直接実行します。手動 CI dispatch は changed scoping を迂回し、Linux Node shard、bundled-plugin shard、Plugin and channel contract shard、Node 22 compatibility、`check-*`、`check-additional-*`、built-artifact smoke check、docs check、Python Skills、Windows、macOS、Control UI i18n lane を強制します。standalone manual CI run は、`include_android=true` でディスパッチされた場合にのみ Android を実行します。`Full Release Validation` はその CI child にその input を渡します。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- リリーステレメトリを検証するときは `pnpm qa:otel:smoke` を実行します。これは local OTLP/HTTP レシーバーを通じて QA-lab を実行し、Opik、Langfuse、または別の外部コレクターを必要とせずに、トレース、メトリック、ログのエクスポートに加えて、境界付きのトレース属性とコンテンツ/識別子のリダクションを検証します。
- コレクター互換性を検証するときは `pnpm qa:otel:collector-smoke` を実行します。これは同じ QA-lab OTLP エクスポートを、local レシーバーのアサーションの前に実際の OpenTelemetry Collector Docker コンテナ経由でルーティングします。
- 保護された Prometheus スクレイピングを検証するときは `pnpm qa:prometheus:smoke` を実行します。これは QA-lab を実行し、未認証のスクレイプを拒否し、リリース上重要なメトリックファミリーにプロンプト内容、生の識別子、認証トークン、ローカルパスが含まれないことを検証します。
- ソースチェックアウトの OpenTelemetry と Prometheus の smoke レーンを連続で実行するには `pnpm qa:observability:smoke` を実行します。
- すべてのタグ付きリリースの前に `pnpm release:check` を実行します。
- `OpenClaw NPM Release` プリフライトは npm tarball をパックする前に依存関係リリース証跡を生成します。npm アドバイザリ脆弱性ゲートはリリースをブロックします。推移的マニフェストリスク、依存関係の所有権/インストール面、依存関係変更レポートはリリース証跡のみです。依存関係変更レポートは、リリース候補と以前の到達可能なリリースタグを比較します。プリフライトは依存関係証跡を `openclaw-release-dependency-evidence-<tag>` としてアップロードし、準備済み npm プリフライトアーティファクト内の `dependency-evidence/` にも埋め込みます。実際の公開パスはそのプリフライトアーティファクトを再利用し、同じ証跡を `openclaw-<version>-dependency-evidence.zip` として GitHub リリースに添付します。
- タグが存在した後の変更を伴う公開シーケンスには `OpenClaw Release Publish` を実行します。`release/YYYY.M.PATCH`（または main から到達可能なタグを公開する場合は `main`）からディスパッチし、リリースタグ、成功した OpenClaw npm `preflight_run_id`、成功した `full_release_validation_run_id` を渡し、意図的に集中的な修復を実行している場合を除き、デフォルトの Plugin 公開スコープ `all-publishable` を維持します。このワークフローは Plugin npm publish、Plugin ClawHub publish、OpenClaw npm publish を直列化し、外部化された Plugin より前に core package が公開されないようにします。
- Stable の `OpenClaw Release Publish` には、一致する non-prerelease の `openclaw/openclaw-windows-node` リリースが存在した後の正確な `windows_node_tag` と、候補として承認済みの `windows_node_installer_digests` マップが必要です。公開の子をディスパッチする前に、ソースリリースが公開済みであり、non-prerelease であり、必要な x64/ARM64 インストーラーを含み、承認済みマップと引き続き一致することを検証します。その後、OpenClaw リリースがまだドラフトの間に、固定されたインストーラーダイジェストマップを変更せずに渡して `Windows Node Release` をディスパッチします。子ワークフローは、その正確なタグから署名済み Windows Hub インストーラーをダウンロードし、固定ダイジェストと照合し、Windows runner 上で Authenticode 署名が期待される OpenClaw Foundation 署名者を使用していることを検証し、SHA-256 マニフェストを書き込み、インストーラーとマニフェストを canonical OpenClaw GitHub リリースにアップロードした後、昇格済みアセットを再ダウンロードしてマニフェストの包含関係とハッシュを検証します。親は公開前に現在の x64、ARM64、checksum アセット契約を検証します。直接リカバリは、期待される契約アセットを固定されたソースバイトで置き換える前に、予期しない `OpenClawCompanion-*` アセット名を拒否します。

  `Windows Node Release` を手動でディスパッチするのはリカバリ時のみにし、常に正確なタグを渡し、`latest` は決して使わず、承認済みソースリリースの明示的な `expected_installer_digests` JSON マップも渡します。Webサイトのダウンロードリンクは、現在の stable リリースの正確な OpenClaw リリースアセット URL を指すべきです。または、GitHub の latest リダイレクトが同じリリースを指すことを検証した後に限り `releases/latest/download/...` を使用します。companion repo のリリースページだけにリンクしないでください。

- リリースチェックは現在、別の手動ワークフロー `OpenClaw Release Checks` で実行されます。これはリリース承認前に、QA Lab mock parity レーンに加えて、高速な live Matrix profile と Telegram QA レーンも実行します。live レーンは `qa-live-shared` 環境を使用し、Telegram は Convex CI credential lease も使用します。Matrix transport、media、E2EE inventory 全体を並列で確認したい場合は、手動の `QA-Lab - All Lanes` ワークフローを `matrix_profile=all` および `matrix_shards=true` で実行します。
- Cross-OS のインストールおよびアップグレードランタイム検証は、public な `OpenClaw Release Checks` と `Full Release Validation` の一部であり、これらは reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出します。この分割は意図的です。実際の npm リリースパスは短く、決定的で、アーティファクト中心に保ち、遅い live checks は独自のレーンに置くことで、publish を停止またはブロックしないようにします。
- secret を含むリリースチェックは、ワークフローのロジックと secret が管理された状態を保つよう、`Full Release Validation` 経由、または `main`/release workflow ref からディスパッチする必要があります。
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け入れます。
- `OpenClaw NPM Release` の validation-only プリフライトは、push 済みタグを要求せずに、現在の完全な 40 文字の workflow-branch commit SHA も受け入れます。この SHA パスは validation-only であり、実際の publish に昇格できません。SHA モードでは、ワークフローは package metadata check のためだけに `v<package.json version>` を合成します。実際の publish には引き続き実際のリリースタグが必要です。
- どちらのワークフローも、実際の publish と promotion パスは GitHub-hosted runner 上に保ち、変更を伴わない validation パスはより大きな Blacksmith Linux runner を使用できます。
- そのワークフローは、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方の workflow secret を使用して `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行します。
- npm リリースプリフライトは、別個の release checks レーンを待たなくなりました。
- ローカルでリリース候補にタグ付けする前に、`RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` を実行します。このヘルパーは、高速なリリースガードレール、Plugin npm/ClawHub リリースチェック、build、UI build、`release:openclaw:npm:check` を、GitHub publish ワークフローの開始前に一般的な承認ブロック要因を検出できる順序で実行します。
- 承認前に `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（または対応する prerelease/correction タグ）を実行します。
- npm publish の後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（または対応する beta/correction version）を実行し、新しい temp prefix で公開済み registry install path を検証します。
- beta publish の後、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行し、共有の leased Telegram credential pool を使用して、公開済み npm package に対する installed-package オンボーディング、Telegram setup、実際の Telegram E2E を検証します。メンテナーのローカル one-off では Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` env credentials を直接渡してもかまいません。
- メンテナーのマシンから full post-publish beta smoke を実行するには、`pnpm release:beta-smoke -- --beta betaN` を使用します。このヘルパーは Parallels npm update/fresh-target validation を実行し、`NPM Telegram Beta E2E` をディスパッチし、正確な workflow run をポーリングし、アーティファクトをダウンロードし、Telegram report を出力します。
- メンテナーは、手動の `NPM Telegram Beta E2E` ワークフローを通じて、GitHub Actions から同じ post-publish check を実行できます。これは意図的に manual-only であり、すべての merge で実行されるわけではありません。
- メンテナーのリリース自動化は preflight-then-promote を使用します。
  - 実際の npm publish は、成功した npm `preflight_run_id` に合格する必要があります。
  - 実際の publish は、成功した preflight run と同じ `main` または `release/YYYY.M.PATCH` ブランチからディスパッチする必要があります（alpha prerelease では Tideclaw alpha ブランチが許可されます）。
  - Stable npm releases はデフォルトで `beta` になります。stable npm publish は workflow input により明示的に `latest` を対象にできます。
  - token-based npm dist-tag mutation は `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` にあります。これは、source repo が OIDC-only publish を維持する一方で、`npm dist-tag add` には引き続き `NPM_TOKEN` が必要なためです。
  - Public な `macOS Release` は validation-only です。タグが release branch のみに存在するが、ワークフローが `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.PATCH` を設定します。
  - 実際の macOS publish は、成功した macOS `preflight_run_id` と `validate_run_id` に合格する必要があります。
  - 実際の publish paths は、再度 rebuild するのではなく、準備済みアーティファクトを promote します。
- `YYYY.M.PATCH-N` のような stable correction release では、post-publish verifier は同じ temp-prefix upgrade path で `YYYY.M.PATCH` から `YYYY.M.PATCH-N` へのアップグレードもチェックするため、release correction が古い global install を base stable payload のまま静かに残すことはできません。
- npm release preflight は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` payload の両方が含まれていない限り fail closed するため、空の browser dashboard を再び出荷しません。
- Post-publish verification は、公開済み Plugin entrypoint と package metadata が installed registry layout に存在することもチェックします。Plugin runtime payload が欠落したまま出荷されたリリースは postpublish verifier に失敗し、`latest` に昇格できません。
- `pnpm test:install:smoke` は candidate update tarball に対する npm pack `unpackedSize` budget も強制するため、installer e2e は release publish path の前に accidental pack bloat を検出できます。
- リリース作業で CI planning、extension timing manifests、または extension test matrices に触れた場合、承認前に `.github/workflows/plugin-prerelease.yml` から planner-owned の `plugin-prerelease-extension-shard` matrix outputs を再生成してレビューし、release notes が古い CI layout を説明しないようにします。
- Stable macOS release readiness には updater surfaces も含まれます。GitHub release には最終的に package 済みの `.zip`、`.dmg`、`.dSYM.zip` が含まれている必要があります。`main` 上の `appcast.xml` は publish 後に新しい stable zip を指す必要があります（macOS publish workflow が自動的に commit するか、direct push がブロックされた場合は appcast PR を開きます）。packaged app は non-debug bundle id、空でない Sparkle feed URL、その release version の canonical Sparkle build floor 以上の `CFBundleVersion` を維持する必要があります。

## リリーステストボックス

`Full Release Validation` は、オペレーターが 1 つのエントリポイントからすべての pre-release tests を開始する方法です。変化の速いブランチで固定コミット証跡を得るには、すべての子ワークフローが target SHA に固定された一時ブランチから実行されるよう、このヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` を push し、そのブランチから `ref=<sha>` で `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が target と一致することを検証した後、一時ブランチを削除します。これにより、誤ってより新しい `main` の子 run を証明することを避けられます。

release branch または tag validation では、信頼された `main` workflow ref から実行し、release branch または tag を `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

ワークフローは対象 ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチしてから、`OpenClaw Release Checks` をディスパッチします。`OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパス網羅、標準 Telegram パッケージ E2E を含む Package Acceptance、QA Lab パリティ、live Matrix、live Telegram にファンアウトします。full/all 実行が許容されるのは、`Full Release Validation` のサマリーで `normal_ci`、`plugin_prerelease`、`release_checks` が成功している場合だけです。ただし、焦点を絞った再実行で別個の `Plugin Prerelease` 子を意図的にスキップした場合を除きます。スタンドアロンの `npm-telegram` 子は、`release_package_spec` または `npm_telegram_package_spec` を指定した、公開済みパッケージの焦点を絞った再実行にのみ使用してください。最終 verifier サマリーには各子実行の最遅ジョブ表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。

完全なステージマトリクス、正確なワークフロージョブ名、stable プロファイルと full プロファイルの違い、アーティファクト、焦点を絞った再実行ハンドルについては、[フルリリース検証](/ja-JP/reference/full-release-validation)を参照してください。

子ワークフローは、通常は `--ref main` で、`Full Release Validation` を実行する信頼済み ref からディスパッチされます。対象 `ref` が古いリリースブランチやタグを指している場合も同じです。Full Release Validation に別個の workflow-ref 入力はありません。ワークフロー実行 ref を選ぶことで、信頼済みハーネスを選択します。移動する `main` 上の正確なコミット証明に `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使用してピン留めされた一時ブランチを作成してください。

live/provider の広さを選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: minimum に、リリース承認用の stable provider/backend 網羅を追加
- `full`: stable に、広範な advisory provider/media 網羅を追加

Stable と full 検証では、昇格前に必ず網羅的な live/E2E、Docker リリースパス、境界付きの公開済みアップグレード生存者スイープを実行します。ベータで同じスイープを要求するには `run_release_soak=true` を使用してください。このスイープは、最新 4 つの stable パッケージに加え、ピン留めされた `2026.4.23` と `2026.5.2` ベースライン、さらに古い `2026.4.15` の網羅を対象にし、重複するベースラインを削除したうえで各ベースラインを独自の Docker runner ジョブへシャードします。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用して対象 ref を一度だけ `release-package-under-test` として解決し、soak 実行時にはそのアーティファクトを cross-OS、Package Acceptance、リリースパス Docker チェックで再利用します。これにより、すべてのパッケージ向けボックスが同じバイト列を使用し、パッケージビルドの繰り返しを避けられます。ベータがすでに npm 上にある場合は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を設定してください。これにより、リリースチェックは出荷済みパッケージを一度だけダウンロードし、`dist/build-info.json` からビルド元 SHA を抽出し、そのアーティファクトを cross-OS、Package Acceptance、リリースパス Docker、パッケージ Telegram レーンで再利用します。

cross-OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.5` を使用します。このレーンは最も遅いデフォルトモデルをベンチマークするのではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回の live agent turn を証明するためです。より広範な live provider matrix が、モデル固有の網羅を担います。

リリース段階に応じて次のバリアントを使用します。

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

焦点を絞った修正後の最初の再実行として、full umbrella を使用しないでください。1 つのボックスが失敗した場合、次の証明には失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用してください。修正が共有リリースオーケストレーションを変更した場合、または以前の全ボックス証拠が古くなった場合にのみ、full umbrella を再度実行します。umbrella の最終 verifier は、記録された子ワークフロー実行 ID を再チェックするため、子ワークフローの再実行が成功した後は、失敗した親ジョブ `Verify full validation` だけを再実行してください。

境界付きの復旧では、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常 CI 子のみ、`plugin-prerelease` はリリース専用 Plugin 子のみ、`release-checks` はすべてのリリースボックスを実行し、より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。焦点を絞った `npm-telegram` 再実行には、`release_package_spec` または `npm_telegram_package_spec` が必要です。full/all 実行では、Package Acceptance 内の標準パッケージ Telegram E2E を使用します。焦点を絞った cross-OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/suite フィルターを追加できます。QA release-check の失敗は、標準 tier で必須の OpenClaw dynamic tool drift を含め、通常のリリース検証をブロックします。Tideclaw alpha 実行では、package-safety 以外の release-check レーンを advisory として扱ってもかまいません。`live_suite_filter` が Discord、WhatsApp、Slack などの gated QA live レーンを明示的に要求する場合、対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 変数を有効にする必要があります。有効でない場合、レーンを黙ってスキップするのではなく、入力キャプチャが失敗します。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に changed scoping をバイパスし、リリース候補に対して通常のテストグラフを強制します。Linux Node シャード、バンドル Plugin シャード、Plugin とチャンネル contract シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトスモークチェック、docs チェック、Python Skills、Windows、macOS、Control UI i18n が含まれます。`Full Release Validation` がボックスを実行する場合、umbrella が `include_android=true` を渡すため Android も含まれます。スタンドアロン手動 CI で Android を網羅するには `include_android=true` が必要です。

このボックスは「ソースツリーが完全な通常テストスイートに合格したか」に答えるために使用します。これはリリースパスのプロダクト検証とは同じではありません。保持する証拠:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確な対象 SHA で green になった `CI` 実行
- リグレッション調査時の CI ジョブからの失敗または遅いシャード名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定的な通常 CI が必要だが、Docker、QA Lab、live、cross-OS、package ボックスが不要な場合にのみ、手動 CI を直接実行してください。Android なしの直接 CI には最初のコマンドを使用します。直接のリリース候補 CI で Android を網羅する必要がある場合は、`include_android=true` を追加します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` を通じた `OpenClaw Release Checks` と、リリースモードの `install-smoke` ワークフローにあります。ソースレベルテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker の網羅には以下が含まれます。

- 遅い Bun グローバルインストールスモークを有効にした完全なインストールスモーク
- 対象 SHA ごとのルート Dockerfile スモークイメージ準備/再利用。QR、root/gateway、installer/Bun スモークジョブは別々の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI 網羅
- 分割されたバンドル Plugin インストール/アンインストールレーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- リリースチェックに live suites が含まれる場合の live/E2E provider suites と Docker live model 網羅

再実行前に Docker アーティファクトを使用してください。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。焦点を絞った復旧では、すべてのリリースチャンクを再実行するのではなく、再利用可能 live/E2E ワークフロー上で `docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは agentic behavior とチャンネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab の網羅には以下が含まれます。

- agentic parity pack を使用し、OpenAI 候補レーンを `anthropic/claude-opus-4-8` ベースラインと比較する mock parity レーン
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA レーン
- リリース telemetry に明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke`、または `pnpm qa:observability:smoke`

このボックスは「リリースが QA シナリオと live channel flows で正しく動作するか」に答えるために使用します。リリースを承認する際は、parity、Matrix、Telegram レーンのアーティファクト URL を保持してください。Full Matrix coverage は、デフォルトのリリースクリティカルレーンではなく、手動のシャードされた QA-Lab 実行として引き続き利用できます。

### パッケージ

Package ボックスは、インストール可能なプロダクトのゲートです。これは `Package Acceptance` と resolver `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。resolver は候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離したままにします。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択した `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を pack
- `source=url`: 必須の `package_sha256` を指定して公開 HTTPS `.tgz` をダウンロード。URL 認証情報、デフォルト以外の HTTPS ポート、private/internal/special-use ホスト名または解決済みアドレス、安全でないリダイレクトは拒否されます
- `source=trusted-url`: `.github/package-trusted-sources.json` の名前付きポリシーから、必須の `package_sha256` と `trusted_source_id` を指定して HTTPS `.tgz` をダウンロード。`source=url` に入力レベルのプライベートネットワークバイパスを追加する代わりに、maintainer 所有のエンタープライズミラーやプライベートパッケージリポジトリにこれを使用します
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みのリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、移行、更新、root 管理 VPS アップグレード、設定済み認証の更新再起動、ライブ ClawHub skill インストール、古い plugin 依存関係のクリーンアップ、オフライン plugin フィクスチャ、plugin 更新、plugin コマンドバインディングのエスケープ強化、Telegram パッケージ QA を、同じ解決済み tarball に対して維持します。ブロッキングリリースチェックは、デフォルトの最新公開パッケージベースラインを使用します。`run_release_soak=true`、`release_profile=stable`、または `release_profile=full` を指定したベータプロファイルでは、published-upgrade-survivor スイープが `last-stable-4` に加え、固定された `2026.4.23`、`2026.5.2`、`2026.4.15` ベースラインと `reported-issues` シナリオまで拡張されます。すでに出荷済みの候補には `source=npm`、公開前の SHA に裏付けられたローカル npm tarball には `source=ref`、メンテナー所有のエンタープライズ/プライベートミラーには `source=trusted-url`、別の GitHub Actions 実行でアップロードされた準備済み tarball には `source=artifact` で Package Acceptance を使用します。

これは、以前は Parallels が必要だったパッケージ/更新カバレッジの大部分に対する、GitHub ネイティブの代替です。OS 固有のオンボーディング、インストーラー、プラットフォーム動作にはクロス OS リリースチェックが引き続き重要ですが、パッケージ/更新のプロダクト検証では Package Acceptance を優先してください。

更新と plugin 検証の正規チェックリストは [更新と plugin のテスト](/ja-JP/help/testing-updates-plugins) です。plugin のインストール/更新、doctor クリーンアップ、公開パッケージ移行の変更を、どのローカル、Docker、Package Acceptance、またはリリースチェックレーンで証明するかを判断するときに使用してください。すべての安定版 `2026.4.23+` パッケージからの網羅的な公開更新移行は、Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

従来の package-acceptance の寛容化は、意図的に期限付きです。`2026.4.25` までのパッケージは、npm にすでに公開済みのメタデータ不足について、互換性パスを使用できます。対象は、tarball にないプライベート QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャにないパッチファイル、永続化されていない `update.channel`、従来の plugin インストール記録の場所、マーケットプレイスのインストール記録永続化の欠落、`plugins update` 中の設定メタデータ移行です。公開済みの `2026.4.26` パッケージでは、すでに出荷済みのローカルビルドメタデータスタンプファイルについて警告になる場合があります。それ以降のパッケージは、現代的なパッケージ契約を満たす必要があります。同じ不足はリリース検証で失敗します。

リリースの問いが実際にインストール可能なパッケージに関するものである場合は、より広い Package Acceptance プロファイルを使用します。

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

- `smoke`: 簡易パッケージインストール/チャネル/エージェント、Gateway ネットワーク、設定リロードレーン
- `package`: インストール/更新/再起動/plugin パッケージ契約に加え、ライブ ClawHub skill インストール証明。これはリリースチェックのデフォルトです
- `product`: `package` に加え、MCP チャネル、cron/サブエージェントクリーンアップ、OpenAI web search、OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスのチャンク
- `custom`: 集中的な再実行のための正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明には、Package Acceptance で `telegram_mode=mock-openai` または `telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの `package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの Telegram ワークフローは、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## 通常のリリース公開自動化

ベータ、`latest`、plugin、GitHub Release、プラットフォーム公開では、
`OpenClaw Release Publish` が通常の変更を行うエントリポイントです。月次
`.33+` の npm のみの extended-stable パスは、このオーケストレーターを使用しません。
通常のワークフローは、リリースに必要な順序で trusted-publisher ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを検証します（alpha プレリリースの場合は Tideclaw alpha ブランチでも可）。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で `Plugin NPM Release` をディスパッチします。
5. 同じスコープと SHA で `Plugin ClawHub Release` をディスパッチします。
6. 保存済みの `full_release_validation_run_id` を検証した後、リリースタグ、npm dist-tag、保存済みの `preflight_run_id` で `OpenClaw NPM Release` をディスパッチします。
7. 安定版リリースでは、GitHub release をドラフトとして作成または更新し、明示的な `windows_node_tag` と候補承認済みの `windows_node_installer_digests` で `Windows Node Release` をディスパッチし、正規のインストーラー/チェックサムアセットを検証してからドラフトを公開します。

ベータ公開例:

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

`latest` への安定版プロモーションは明示的です。

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

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、集中的な修復または再公開作業にのみ使用してください。`OpenClaw Release Publish` は、`publish_openclaw_npm=true` のときに `plugin_publish_scope=selected` を拒否するため、`@openclaw/diffs-language-pack` を含む公開可能な公式 plugin すべてなしでコアパッケージが出荷されることはありません。選択した plugin の修復では、`plugin_publish_scope=selected` と `plugins=@openclaw/name` を指定して `publish_openclaw_npm=false` を設定するか、子ワークフローを直接ディスパッチします。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1`、`v2026.4.2-alpha.1`。`preflight_only=true` の場合、検証専用プリフライト用に、現在の完全な 40 文字のワークフローブランチコミット SHA も使用できます
- `preflight_only`: 検証/ビルド/パッケージのみなら `true`、実際の公開パスなら `false`
- `preflight_run_id`: 既存の成功したプリフライト実行 ID。実際の公開パスでは必須で、ワークフローが再ビルドではなく準備済み tarball を再利用できるようにします
- `full_release_validation_run_id`: このタグ/SHA に対する成功した `Full Release Validation` 実行 ID。実際の公開では必須です。ベータ公開は警告付きでプリフライトのみで進められますが、安定版/`latest` プロモーションでは引き続き必要です。
- `release_publish_run_id`: 承認済みの `OpenClaw Release Publish` 実行 ID。このワークフローがその親からディスパッチされる場合（bot-actor の実公開呼び出し）に必須です
- `plugin_npm_run_id`: 成功した exact-head `Plugin NPM Release` 実行 ID。実際の `extended-stable` コア公開では必須です
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。`alpha`、`beta`、`latest`、`extended-stable` を受け付け、デフォルトは `beta` です。最終パッチ `33` 以降は `extended-stable` を使用する必要があります。デフォルトでは、`extended-stable` はそれより前のパッチを拒否し、非最終タグは常に拒否します。
- `bypass_extended_stable_guard`: テスト専用の boolean。デフォルトは `false`。`npm_dist_tag=extended-stable` と併用すると、リリース ID、アーティファクト、承認、読み戻しチェックを維持したまま、月次 extended-stable 適格性をバイパスします。

`Plugin NPM Release` は、既存のリリース動作には `npm_dist_tag=default`、ガード付き月次パスには `npm_dist_tag=extended-stable` を受け付けます。
extended-stable オプションには、`publish_scope=all-publishable`、空の `plugins` 入力、`33` 以上の最終パッチ、正規の `extended-stable/YYYY.M.33` ブランチの正確な先端が必要です。plugin の `latest` や `beta` は決して移動しません。新しいパッケージバージョンは、OIDC trusted publication（`npm publish --tag extended-stable`）を通じて `extended-stable` をアトミックに受け取ります。このソースワークフローは、トークン認証された `npm dist-tag add` を使用しません。再試行では npm にすでに存在する正確なバージョンをスキップし、その後、すべての正確なパッケージと `extended-stable` タグが収束したことを完全な読み戻しで確認できない限り、fail closed します。

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` プリフライト実行 ID。`publish_openclaw_npm=true` の場合は必須です
- `full_release_validation_run_id`: 成功した `Full Release Validation` 実行 ID。`publish_openclaw_npm=true` の場合は必須です
- `windows_node_tag`: 正確な非プレリリースの `openclaw/openclaw-windows-node` リリースタグ。安定版 OpenClaw 公開では必須です
- `windows_node_installer_digests`: 現在の Windows インストーラー名から固定された `sha256:` ダイジェストへの、候補承認済みのコンパクト JSON マップ。安定版 OpenClaw 公開では必須です
- `npm_telegram_run_id`: 最終リリース証拠に含める任意の成功した `NPM Telegram Beta E2E` 実行 ID
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ。`alpha`、`beta`、`latest` のいずれか
- `plugin_publish_scope`: デフォルトは `all-publishable`。`selected` は、`publish_openclaw_npm=false` を指定した集中的な plugin のみの修復作業にだけ使用します
- `plugins`: `plugin_publish_scope=selected` のときの、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを plugin のみの修復オーケストレーターとして使用する場合にだけ `false` を設定します
- `release_profile`: リリース証拠サマリーに使用されるリリースカバレッジプロファイル。デフォルトは `from-validation` で、検証マニフェストから読み取ります。`beta`、`stable`、`full` で上書きできます
- `wait_for_clawhub`: デフォルトは `false` で、npm の可用性が ClawHub サイドカーによってブロックされないようにします。ワークフロー完了に ClawHub 完了を含める必要がある場合にだけ `true` を設定します

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを伴うチェックでは、解決済みコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: ベータリリースチェック向けに、網羅的なライブ/E2E、Docker リリースパス、all-since upgrade-survivor soak を有効にします。`release_profile=stable` と `release_profile=full` によって強制的に有効になります。

ルール:

- パッチ `33` 未満の通常の最終版と修正版は、`beta` または `latest` のどちらにも公開できます。パッチ `33` 以上の最終版は `extended-stable` に公開する必要があり、その境界での修正サフィックス付きバージョンは拒否されます。
- ベータプレリリースタグは `beta` のみに公開できます。アルファプレリリースタグは `alpha` のみに公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、プリフライト時に使用したものと同じ `npm_dist_tag` を使用する必要があります。このワークフローは、公開前にそのメタデータの検証を続行します

## 通常の beta/latest 安定版リリース手順

このレガシー手順は、plugins、GitHub Release、Windows、その他のプラットフォーム作業も所有する、通常のオーケストレーションされたリリース向けです。このページの冒頭で説明している、毎月の `.33+` npm 専用 extended-stable パスではありません。

通常のオーケストレーションされた安定版リリースを切る場合:

1. `OpenClaw NPM Release` を `preflight_only=true` で実行します。タグが存在する前は、プリフライトワークフローの検証専用ドライランとして、現在の完全なワークフローブランチコミット SHA を使用できます。
2. 通常のベータ先行フローでは `npm_dist_tag=beta` を選択し、意図的に安定版を直接公開したい場合のみ `latest` を選択します。
3. 1 つの手動ワークフローから通常の CI に加えてライブプロンプトキャッシュ、Docker、QA Lab、Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全なコミット SHA で `Full Release Validation` を実行します。意図的に決定論的な通常のテストグラフのみが必要な場合は、代わりにリリース ref で手動の `CI` ワークフローを実行します。
4. 署名済みの x64 および ARM64 インストーラーを出荷する、正確な非プレリリースの `openclaw/openclaw-windows-node` リリースタグを選択します。それを `windows_node_tag` として保存し、検証済みのダイジェストマップを `windows_node_installer_digests` として保存します。リリース候補ヘルパーは両方を記録し、生成する公開コマンドに含めます。
5. 成功した `preflight_run_id` と `full_release_validation_run_id` を保存します。
6. 同じ `tag`、同じ `npm_dist_tag`、選択した `windows_node_tag`、保存した `windows_node_installer_digests`、保存した `preflight_run_id`、保存した `full_release_validation_run_id` を指定して `OpenClaw Release Publish` を実行します。OpenClaw npm パッケージを昇格する前に、外部化された plugins を npm と ClawHub に公開します。
7. リリースが `beta` に反映された場合は、`openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その安定版を `beta` から `latest` に昇格します。
8. リリースを意図的に直接 `latest` に公開し、`beta` も同じ安定版ビルドにすぐ追従させる必要がある場合は、同じリリースワークフローを使用して両方の dist-tags がその安定版を指すようにするか、スケジュールされた自己修復同期によって後で `beta` が移動するのを待ちます。

dist-tag の変更はリリース台帳リポジトリにあります。これは引き続き `NPM_TOKEN` が必要なためです。一方、ソースリポジトリは OIDC のみの公開を維持します。これにより、直接公開パスとベータ先行の昇格パスの両方が文書化され、オペレーターから見える状態に保たれます。

メンテナーがローカル npm 認証にフォールバックする必要がある場合は、1Password CLI (`op`) コマンドは専用の tmux セッション内でのみ実行してください。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内に閉じ込めることで、プロンプト、アラート、OTP 処理が観察可能になり、ホストアラートの繰り返しを防げます。

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

メンテナーは、実際のランブックとして [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) の非公開リリースドキュメントを使用します。

## 関連

- [リリースチャネル](/ja-JP/install/development-channels)
