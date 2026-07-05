---
read_when:
    - 公開リリースチャンネル定義を探しています
    - リリース検証またはパッケージ受け入れ検証の実行
    - バージョン命名とリリース周期を確認する
summary: リリースレーン、オペレーターチェックリスト、検証ボックス、バージョン命名、ケイデンス
title: リリースポリシー
x-i18n:
    generated_at: "2026-07-05T11:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed09e292495a0597fa72d32ad0a17428cf38dcb2d2e11dd77ff60b773a73bf35
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw は現在、ユーザー向けに 3 つの更新チャネルを公開しています。

- stable: 既存の昇格済みリリースチャネル。個別の CLI/チャネルマイルストーンが完了するまでは、引き続き npm `latest` 経由で解決されます
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

別途、リリースオペレーターは、完了済みの直近月のコアパッケージを
パッチ `33` から npm `extended-stable` に公開できます。当月の
通常 final 系列は npm `latest` 上で継続します。このオペレーター側の公開
分離だけでは、CLI 更新チャネルの解決は変更されません。

Tideclaw alpha ビルドは別の内部プレリリーストラック（npm dist-tag `alpha`）であり、[NPM ワークフロー入力](#npm-workflow-inputs) と [リリーステストボックス](#release-test-boxes) で扱います。

## バージョン命名

- 月次 npm extended-stable リリースバージョン: `YYYY.M.PATCH`、`PATCH >= 33`、git タグ `vYYYY.M.PATCH`
- 日次/通常 final リリースバージョン: `YYYY.M.PATCH`、`PATCH < 33`、git タグ `vYYYY.M.PATCH`
- 通常フォールバック修正リリースバージョン: `YYYY.M.PATCH-N`、git タグ `vYYYY.M.PATCH-N`
- Beta プレリリースバージョン: `YYYY.M.PATCH-beta.N`、git タグ `vYYYY.M.PATCH-beta.N`
- Alpha プレリリースバージョン: `YYYY.M.PATCH-alpha.N`、git タグ `vYYYY.M.PATCH-alpha.N`
- 月またはパッチはゼロ埋めしない
- `PATCH` はカレンダー日ではなく、月次リリーストレインの連番です。通常 final と beta リリースは現在のトレインを進めます。alpha のみのタグは beta/通常のパッチ番号を消費も進行もしないため、beta または通常トレインを選択するときは、より大きいパッチ番号を持つレガシーの alpha のみのタグを無視してください。
- Alpha/nightly ビルドは次の未リリースパッチトレインを使い、繰り返しビルドでは `alpha.N` だけを増やします。そのパッチに beta が付いたら、新しい alpha ビルドは次のパッチへ移ります。
- npm バージョンは不変です。公開済みタグを削除、再公開、再利用してはいけません。代わりに次のプレリリース番号または次の月次パッチを切ってください。
- `latest` は現在の通常/日次 npm 系列を引き続き追従します。`beta` は現在の beta インストール対象です
- `extended-stable` は、パッチ `33` から始まる、サポート対象の直近月 npm パッケージを意味します。パッチ `34` 以降はその月次系列上のメンテナンスリリースです
- 通常 final と通常修正リリースはデフォルトで npm `beta` に公開します。リリースオペレーターは明示的に `latest` を対象にするか、後で検証済み beta ビルドを昇格できます
- 専用の月次 extended-stable パスはコア npm パッケージのみを公開します。plugins、macOS または Windows artifacts、GitHub Release、プライベートリポジトリ dist-tags、Docker images、mobile artifacts、website downloads は公開しません。
- すべての通常 final リリースは、npm package、macOS app、署名済み Windows Hub installers を一緒に出荷します。Beta リリースは通常、まず npm/package パスを検証して公開し、native app build/sign/notarize/promote は明示的に要求されない限り通常 final 用に予約します。

## リリース頻度

- リリースは beta-first で進みます。stable は最新の beta が検証された後でのみ追従します
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.PATCH` ブランチからリリースを切ります。これにより、リリース検証と修正が `main` 上の新規開発をブロックしません
- beta タグが push または公開済みで修正が必要な場合、メンテナーは古いタグを削除または再作成する代わりに、次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、認証情報、復旧メモはメンテナー専用です

## 月次 npm-only extended-stable 公開

これは下記の通常リリース手順に対する専用の例外です。完了済みの月
`YYYY.M` について、`extended-stable/YYYY.M.33` を作成します。
`vYYYY.M.33` とそれ以降のメンテナンスパッチは同じブランチから公開します。リリース
タグ、ブランチ tip、checkout、package version、npm preflight、Full Release
Validation run はすべて同じ commit を指している必要があります。保護された `main` には、
パッチ `33` 未満の、厳密に後のカレンダー月の final version が
すでに含まれている必要があります。メンテナンスパッチは、`main` が 1 か月を超えて進んだ後も対象のままです。

npm preflight と Full Release Validation は正確な
extended-stable ブランチから実行し、両方の run ID を保存します。

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

`release_profile=stable` は既存の検証深度プロファイルです。npm
`extended-stable` dist-tag とは別であり、意図的に変更していません。

両方の実行が成功し、npm release environment の準備ができたら、正確な
preflight tarball を昇格します。パッチ `P` は `33` 以上である必要があります。

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

fork または本番ではないリハーサルで、意図的に月次 `.33` または保護された
`main` の月ポリシーを満たせない場合は、npm preflight と publish
dispatch の両方に `-f bypass_extended_stable_guard=true` を追加します。デフォルトは
`false` です。このバイパスは `npm_dist_tag=extended-stable` の場合にのみ受け入れられ、
workflow summary に記録されます。これは正規の `extended-stable/YYYY.M.33` workflow ref、
branch-tip/tag/checkout equality、final-tag syntax、package/tag version
equality、referenced run and manifest identity、tarball provenance、
environment approval、registry readback、selector repair evidence をバイパスしません。

publish workflow は、参照された run identities、準備済み
tarball digest、両方の npm registry selectors を検証します。workflow が成功した後、結果を個別に確認してください。

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

両方のコマンドは `YYYY.M.P` を返す必要があります。publish は成功したが selector
readback が失敗した場合、不変の package version を再公開しないでください。失敗した workflow の always-run summary に出力される
単一の `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復コマンドを使用し、
両方の独立した readback を再実行してください。以前の selector への rollback は別のオペレーター判断であり、
readback 修復パスではありません。

下記の通常チェックリストは引き続き beta、`latest`、GitHub Release、
plugins、macOS、Windows、その他のプラットフォーム公開を管理します。この npm-only extended-stable パスでは、これらの
手順を実行しないでください。

## 通常リリースオペレーター用チェックリスト

このチェックリストはリリースフローの公開形です。非公開の認証情報、署名、notarization、dist-tag 復旧、緊急 rollback の詳細は、メンテナー専用リリース runbook に残します。

1. 現在の `main` から開始します。latest を pull し、対象 commit が push 済みであることを確認し、`main` CI がブランチ作成に十分な程度に green であることを確認します。
2. 最後に到達可能なリリースタグ以降に merge された PR とすべての direct commit から、`CHANGELOG.md` の先頭セクションを生成します。エントリはユーザー向けに保ち、重複する PR/direct-commit エントリを dedupe し、commit、push し、ブランチ作成前にもう一度 rebase/pull します。
3. `src/plugins/compat/registry.ts` と `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性レコードをレビューします。期限切れの互換性は、アップグレードパスが引き続きカバーされている場合にのみ削除するか、意図的に維持している理由を記録します。
4. 現在の `main` から `release/YYYY.M.PATCH` を作成します。通常のリリース作業を `main` 上で直接行わないでください。
5. タグに必要なすべての version location を bump し、`pnpm release:prep` を実行します。これは plugin versions、npm shrinkwraps、plugin inventory、base config schema、bundled channel config metadata、config docs baseline、plugin SDK exports、plugin SDK API baseline を順番に更新します。タグ付け前に生成された差分を commit し、次にローカルの決定的 preflight を実行します: `pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build`、`pnpm release:check`。
6. `OpenClaw NPM Release` を `preflight_only=true` で実行します。タグが存在する前は、検証専用 preflight に完全な 40 文字の release-branch SHA を使用できます。preflight は正確に checkout された依存関係グラフの dependency release evidence を生成し、npm preflight artifact に保存します。成功した `preflight_run_id` を保存します。
7. リリースブランチ、タグ、または完全な commit SHA に対して `Full Release Validation` で全 pre-release tests を開始します。これは 4 つの大きなリリーステストボックス、Vitest、Docker、QA Lab、Package のための単一の手動 entrypoint です。`full_release_validation_run_id` を保存します。これは `OpenClaw NPM Release` と `OpenClaw Release Publish` の両方に必須の入力です。
8. 検証が失敗した場合はリリースブランチ上で修正し、その修正を証明する最小の失敗 file、lane、workflow job、package profile、provider、または model allowlist を再実行します。変更された surface によって以前の evidence が stale になる場合にのみ、full umbrella を再実行します。
9. タグ付き beta candidate の場合は、一致する `release/YYYY.M.PATCH` ブランチから `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` を実行します。stable の場合は、必須の Windows source release も渡します: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。この helper は、ローカルの generated-release checks を実行し、full release validation と npm preflight evidence を dispatch または検証し、正確な prepared tarball に対する Parallels fresh/update proof と Telegram package proof を実行し、plugin npm と ClawHub plans を記録し、evidence bundle が green になった後でのみ正確な `OpenClaw Release Publish` コマンドを出力します。

   `OpenClaw Release Publish` は、選択された、または公開可能なすべての plugin packages を npm に dispatch し、同じセットを並行して ClawHub に dispatch します。その後、plugin npm publish が成功すると、一致する dist-tag で準備済み OpenClaw npm preflight artifact を昇格します。OpenClaw npm publish child が成功した後、一致する完全な `CHANGELOG.md` セクションから対応する GitHub release/prerelease page を作成または更新します。npm `latest` に公開された stable releases は GitHub latest release になり、npm `beta` に保持された stable maintenance releases は GitHub `latest=false` で作成されます。この workflow はまた、post-release incident response のために、preflight dependency evidence、full-validation manifest、postpublish registry verification evidence を GitHub release にアップロードします。child run IDs を即時に出力し、workflow token が承認できる release environment gates を自動承認し、失敗した child jobs を log tails 付きで要約し、OpenClaw npm publish が成功したらすぐに GitHub release と dependency evidence を close out し、OpenClaw npm が公開される場合は ClawHub を待ち、その後 `pnpm release:verify-beta` を実行して、GitHub release、npm package、選択された plugin npm packages、選択された ClawHub packages、child workflow run IDs、任意の NPM Telegram run ID の postpublish evidence をアップロードします。ClawHub パスは一時的な CLI dependency install failures を retry し、preview cell が 1 つ flake しても preview-passing plugins を公開し、想定されるすべての plugin version に対する registry verification で終了するため、partial publishes は可視かつ retry 可能な状態に保たれます。

   次に、公開された `openclaw@YYYY.M.PATCH-beta.N` または `openclaw@beta` package に対して post-publish package acceptance を実行します。push または公開済みの prerelease に修正が必要な場合は、次の一致する prerelease number を切ります。古いものを削除または書き換えてはいけません。

10. stable では、審査済みのベータまたはリリース候補に必要な検証エビデンスが揃ってからのみ続行します。stable の npm 公開も `OpenClaw Release Publish` を通じて行い、成功した preflight アーティファクトを `preflight_run_id` で再利用します。stable の macOS リリース準備完了には、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および更新済みの `appcast.xml` が `main` にあることも必要です。macOS 公開ワークフローは、リリースアセットの検証後に署名済み appcast を public `main` へ自動公開するか、ブランチ保護により直接 push がブロックされた場合は appcast PR を開くか更新します。stable Windows Hub の準備完了には、署名済みの `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe`、および `OpenClawCompanion-SHA256SUMS.txt` アセットが OpenClaw GitHub リリースにあることが必要です。正確な署名済み `openclaw/openclaw-windows-node` リリースタグを `windows_node_tag` として渡し、その候補承認済みインストーラーダイジェストマップを `windows_node_installer_digests` として渡します。`OpenClaw Release Publish` はリリースドラフトを保持し、`Windows Node Release` を dispatch し、公開前に 3 つすべてのアセットを検証します。
11. 公開後、npm 公開後ベリファイア、公開後のチャネル証明が必要な場合は任意のスタンドアロン公開済み npm Telegram E2E、必要に応じた dist-tag 昇格を実行し、生成された GitHub リリースページを検証し、リリース告知手順を実行してから、stable リリースを完了と呼ぶ前に [stable main クローズアウト](#stable-main-closeout) を完了します。

## stable main クローズアウト

stable 公開は、`main` が実際に出荷されたリリース状態を保持するまで完了ではありません。

1. 最新の新鮮な `main` から開始します。`release/YYYY.M.PATCH` をそれと照合し、`main` に存在しない実際の修正を forward-port します。release 専用の互換性、テスト、検証アダプターを、より新しい `main` に盲目的にマージしないでください。
2. `main` を、推測上の次トレインではなく、出荷済み stable バージョンに設定します。ルートバージョン変更後に `pnpm release:prep` を実行し、その後 `pnpm deps:shrinkwrap:generate` を実行します。
3. `main` 上の `CHANGELOG.md` の `## YYYY.M.PATCH` セクションを、タグ付けされたリリースブランチと完全に一致させます。mac リリースで stable `appcast.xml` 更新が公開された場合は、それも含めます。
4. オペレーターがそのリリーストレインを明示的に開始するまで、`YYYY.M.PATCH+1`、ベータバージョン、または空の将来 changelog セクションを `main` に追加しないでください。
5. `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check`、および `OPENCLAW_TESTBOX=1 pnpm check:changed` を実行します。push してから、stable リリースを完了と呼ぶ前に、`origin/main` に出荷済みバージョンと changelog が含まれていることを検証します。
6. 各 private rollback drill の後、リポジトリ変数 `RELEASE_ROLLBACK_DRILL_ID` と `RELEASE_ROLLBACK_DRILL_DATE` を最新に保ちます。

`OpenClaw Stable Main Closeout` は、stable 公開後に出荷済みバージョン、changelog、appcast を保持する `main` push から開始します。不変の postpublish エビデンスを読み取り、出荷済みタグをその Full Release Validation および Publish 実行に結び付けたうえで、stable main の状態、リリース、必須の stable soak、ブロック対象のパフォーマンスエビデンスを検証します。不変のクローズアウトマニフェストとチェックサムを GitHub リリースに添付します。自動 push トリガーは、不変の postpublish エビデンスより前のレガシーリリースをスキップし、そのスキップを完了済みクローズアウトとして扱うことはありません。

完全なクローズアウトには、アセットと一致するチェックサムの両方が必要です。部分的なマニフェストは、記録済みの `main` SHA と rollback drill を再生して同一バイト列を再生成し、不足しているチェックサムを添付します。無効なペア、またはマニフェストなしのチェックサムは、引き続きブロック対象です。rollback drill リポジトリ変数がない push トリガー実行は、クローズアウトを完了せずにスキップします。不足している、または 90 日を超えて古い drill 記録は、手動のエビデンス付きクローズアウトでも引き続きブロックします。private リカバリーコマンドは、メンテナー専用 runbook に残します。手動 dispatch は、エビデンス付き stable クローズアウトの修復または再生にのみ使用します。

レガシーフォールバック修正タグは、その修正タグがベース stable タグと同じソースコミットに解決される場合にのみ、ベースパッケージエビデンスを再利用できます。ソースが異なる修正は、独自のパッケージエビデンスを公開して検証する必要があります。

## リリース preflight

- リリース preflight の前に `pnpm check:test-types` を実行し、より高速なローカル `pnpm check` gate の外でもテスト TypeScript がカバーされるようにします。
- リリース preflight の前に `pnpm check:architecture` を実行し、より広範な import cycle と architecture boundary checks が、より高速なローカル gate の外でも green であるようにします。
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、想定される `dist/*` リリースアーティファクトと Control UI バンドルが pack 検証ステップに存在するようにします。
- ルートバージョン bump 後、タグ付け前に `pnpm release:prep` を実行します。これは、バージョン、config、API 変更後に一般的に drift する、すべての決定論的リリースジェネレーターを実行します。対象は plugin versions、npm shrinkwraps、plugin inventory、base config schema、bundled channel config metadata、config docs baseline、plugin SDK exports、plugin SDK API baseline です。`pnpm release:check` は、これらの guard を check mode で再実行し、さらに plugin SDK surface budget check を行い、package release checks を実行する前に、生成物の drift 失敗を 1 回のパスですべて報告します。
- Plugin version sync は、公開可能な `@openclaw/ai` runtime package、official plugin package versions、および既存の `openclaw.compat.pluginApi` floors を、デフォルトで OpenClaw リリースバージョンへ更新します。そのフィールドは単なるパッケージバージョンのコピーではなく、plugin SDK/runtime API floor として扱います。古い OpenClaw host との互換性を意図的に維持する plugin-only リリースでは、floor をサポート対象の最古 host API に保ち、その選択を plugin release proof に記録します。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、すべての pre-release test box を 1 つのエントリーポイントから開始します。これはブランチ、タグ、または完全な commit SHA を受け付け、手動 `CI` を dispatch し、install smoke、package acceptance、cross-OS package checks、QA Lab parity、Matrix、Telegram lanes のために `OpenClaw Release Checks` を dispatch します。stable および full 実行には、常に包括的な live/E2E と Docker release-path soak が含まれます。`run_release_soak=true` は明示的な beta soak のために保持されています。Package Acceptance は、候補検証中の canonical package Telegram E2E を提供し、2 つ目の同時 live poller を避けます。

  ベータ公開後に `release_package_spec` を指定すると、リリース tarball を再ビルドせずに、出荷済み npm パッケージを release checks、Package Acceptance、package Telegram E2E 全体で再利用できます。Telegram がリリース検証の他の部分とは異なる公開済みパッケージを使用する必要がある場合にのみ、`npm_telegram_package_spec` を指定します。Package Acceptance が release package spec とは異なる公開済みパッケージを使用する必要がある場合は、`package_acceptance_package_spec` を指定します。リリースエビデンスレポートが、Telegram E2E を強制せずに検証が公開済み npm パッケージと一致することを証明する必要がある場合は、`evidence_package_spec` を指定します。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- リリース作業を継続しながら package candidate の side-channel proof が必要な場合は、手動の `Package Acceptance` ワークフローを実行します。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使用します。現在の `workflow_ref` harness で信頼済みの `package_ref` ブランチ、タグ、SHA を pack するには `source=ref` を使用します。必須の SHA-256 と厳格な public URL policy を備えた public HTTPS tarball には `source=url` を使用します。必須の `trusted_source_id` と SHA-256 を使う named trusted-source policy には `source=trusted-url` を使用します。または、別の GitHub Actions run によりアップロードされた tarball には `source=artifact` を使用します。

  ワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E release scheduler を再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対する Telegram QA を実行できます。選択された Docker lanes に `published-upgrade-survivor` が含まれる場合、package artifact が候補となり、`published_upgrade_survivor_baseline` が公開済み baseline を選択します。`update-restart-auth` は候補パッケージを installed CLI と package-under-test の両方として使用するため、候補 update command の managed restart path を実行します。

  例:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  一般的な profile:
  - `smoke`: install/channel/agent、gateway network、config reload lanes
  - `package`: OpenWebUI または live ClawHub を含まない artifact-native package/update/restart/plugin lanes
  - `product`: package profile に加えて MCP channels、cron/subagent cleanup、OpenAI web search、OpenWebUI
  - `full`: OpenWebUI を含む Docker release-path chunks
  - `custom`: focused rerun のための正確な `docker_lanes` 選択

- リリース候補に対して決定論的な通常 CI coverage だけが必要な場合は、手動の `CI` ワークフローを直接実行します。手動 CI dispatch は changed scoping をバイパスし、Linux Node shards、bundled-plugin shards、plugin and channel contract shards、Node 22 compatibility、`check-*`、`check-additional-*`、built-artifact smoke checks、docs checks、Python skills、Windows、macOS、Control UI i18n lanes を強制します。スタンドアロンの手動 CI 実行は、`include_android=true` で dispatch された場合のみ Android を実行します。`Full Release Validation` は、その CI child にその input を渡します。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- リリーステレメトリを検証するときは `pnpm qa:otel:smoke` を実行します。これは QA-lab を local OTLP/HTTP レシーバー経由で実行し、Opik、Langfuse、または別の外部コレクターを必要とせずに、トレース、メトリクス、ログのエクスポートに加えて、制限されたトレース属性とコンテンツ/識別子の編集を検証します。
- コレクター互換性を検証するときは `pnpm qa:otel:collector-smoke` を実行します。これは、local レシーバーのアサーションの前に、同じ QA-lab OTLP エクスポートを実際の OpenTelemetry Collector Docker コンテナ経由でルーティングします。
- 保護された Prometheus スクレイピングを検証するときは `pnpm qa:prometheus:smoke` を実行します。これは QA-lab を実行し、未認証のスクレイピングを拒否し、リリースクリティカルなメトリクスファミリーにプロンプト内容、生の識別子、認証トークン、local パスが含まれないことを検証します。
- ソースチェックアウトの OpenTelemetry と Prometheus のスモークレーンを連続で実行するには `pnpm qa:observability:smoke` を実行します。
- タグ付きリリースの前には毎回 `pnpm release:check` を実行します。
- `OpenClaw NPM Release` プリフライトは、npm tarball をパックする前に依存関係リリース証拠を生成します。npm advisory 脆弱性ゲートはリリースブロッキングです。推移的マニフェストリスク、依存関係の所有権/インストール面、依存関係変更レポートはリリース証拠のみです。依存関係変更レポートは、リリース候補を直前の到達可能なリリースタグと比較します。プリフライトは依存関係証拠を `openclaw-release-dependency-evidence-<tag>` としてアップロードし、準備済み npm プリフライトアーティファクト内の `dependency-evidence/` にも埋め込みます。実際の公開パスはそのプリフライトアーティファクトを再利用し、同じ証拠を `openclaw-<version>-dependency-evidence.zip` として GitHub リリースに添付します。
- タグが存在した後の変更を伴う公開シーケンスには `OpenClaw Release Publish` を実行します。`release/YYYY.M.PATCH` からディスパッチし（main から到達可能なタグを公開する場合は `main`）、リリースタグ、成功した OpenClaw npm `preflight_run_id`、成功した `full_release_validation_run_id` を渡し、意図的に絞り込んだ修復を実行している場合を除き、デフォルトの Plugin 公開スコープ `all-publishable` を維持します。このワークフローは Plugin npm 公開、Plugin ClawHub 公開、OpenClaw npm 公開を直列化し、外部化された Plugin より先に core パッケージが公開されないようにします。
- Stable `OpenClaw Release Publish` には、一致する非プレリリースの `openclaw/openclaw-windows-node` リリースが存在した後の正確な `windows_node_tag` と、候補として承認された `windows_node_installer_digests` マップが必要です。公開 child をディスパッチする前に、そのソースリリースが公開済みで、非プレリリースで、必須の x64/ARM64 インストーラーを含み、承認済みマップとまだ一致することを検証します。その後、OpenClaw リリースがまだドラフトの間に `Windows Node Release` をディスパッチし、固定されたインストーラーダイジェストマップを変更せずに渡します。child ワークフローは、その正確なタグから署名済み Windows Hub インストーラーをダウンロードし、固定されたダイジェストと照合し、Windows ランナー上で Authenticode 署名が期待される OpenClaw Foundation 署名者を使用していることを検証し、SHA-256 マニフェストを書き込み、インストーラーとマニフェストを canonical OpenClaw GitHub リリースへアップロードしてから、昇格されたアセットを再ダウンロードし、マニフェストのメンバーシップとハッシュを検証します。親は公開前に現在の x64、ARM64、checksum アセット契約を検証します。直接リカバリは、期待される契約アセットを固定されたソースバイトで置き換える前に、想定外の `OpenClawCompanion-*` アセット名を拒否します。

  `Windows Node Release` を手動でディスパッチするのはリカバリ時のみにし、常に正確なタグを渡し、`latest` は絶対に使わず、承認済みソースリリースからの明示的な `expected_installer_digests` JSON マップも渡します。Web サイトのダウンロードリンクは、現在の stable リリースの正確な OpenClaw リリースアセット URL を対象にするか、GitHub の latest リダイレクトが同じリリースを指していることを検証した後にのみ `releases/latest/download/...` を対象にします。companion リポジトリのリリースページだけにリンクしないでください。

- リリースチェックは現在、別個の手動ワークフロー `OpenClaw Release Checks` で実行されます。これはリリース承認前に、QA Lab モックパリティレーンに加えて、高速な live Matrix プロファイルと Telegram QA レーンも実行します。live レーンは `qa-live-shared` environment を使用し、Telegram は Convex CI 認証情報リースも使用します。Matrix transport、media、E2EE インベントリ全体を並列で実行したい場合は、手動の `QA-Lab - All Lanes` ワークフローを `matrix_profile=all` と `matrix_shards=true` で実行します。
- Cross-OS のインストールおよびアップグレードランタイム検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、再利用可能なワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出します。この分割は意図的です。実際の npm リリースパスを短く、決定的で、アーティファクト中心に保ち、時間のかかる live チェックは独自のレーンに残して、公開を停滞またはブロックしないようにします。
- シークレットを含むリリースチェックは、ワークフローロジックとシークレットが制御された状態を保つため、`Full Release Validation` 経由または `main`/release ワークフロー ref からディスパッチする必要があります。
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け入れます。
- `OpenClaw NPM Release` の検証専用プリフライトも、プッシュ済みタグを必要とせずに、現在の完全な 40 文字のワークフローブランチコミット SHA を受け入れます。その SHA パスは検証専用であり、実際の公開へ昇格できません。SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成します。実際の公開には引き続き実際のリリースタグが必要です。
- 両方のワークフローは、実際の公開と昇格パスを GitHub ホスト型ランナー上に保ち、変更を伴わない検証パスではより大きな Blacksmith Linux ランナーを使用できます。
- そのワークフローは、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使って `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行します。
- npm リリースプリフライトは、別個のリリースチェックレーンを待たなくなりました。
- リリース候補を local でタグ付けする前に、`RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` を実行します。このヘルパーは、高速リリースガードレール、Plugin npm/ClawHub リリースチェック、build、UI build、`release:openclaw:npm:check` を、GitHub 公開ワークフロー開始前に一般的な承認ブロッキングのミスを検出する順序で実行します。
- 承認前に `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（または対応するプレリリース/修正タグ）を実行します。
- npm 公開後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（または対応する beta/修正版）を実行し、新しい一時 prefix で公開済み registry インストールパスを検証します。
- beta 公開後、共有リース済み Telegram 認証情報プールを使用して、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証するため、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行します。maintainer の local 単発実行では Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` env 認証情報を直接渡してもかまいません。
- maintainer マシンから完全な公開後 beta スモークを実行するには、`pnpm release:beta-smoke -- --beta betaN` を使用します。このヘルパーは Parallels npm update/fresh-target 検証を実行し、`NPM Telegram Beta E2E` をディスパッチし、正確なワークフロー実行をポーリングし、アーティファクトをダウンロードし、Telegram レポートを出力します。
- maintainers は、GitHub Actions から手動の `NPM Telegram Beta E2E` ワークフロー経由で同じ公開後チェックを実行できます。これは意図的に手動専用であり、すべてのマージで実行されるわけではありません。
- maintainer リリース自動化は preflight-then-promote を使用します。
  - 実際の npm 公開には、成功した npm `preflight_run_id` が必要です。
  - 実際の公開は、成功したプリフライト実行と同じ `main` または `release/YYYY.M.PATCH` ブランチからディスパッチする必要があります（alpha プレリリースでは Tideclaw alpha ブランチが許可されます）。
  - stable npm リリースのデフォルトは `beta` です。stable npm 公開は、ワークフロー入力で明示的に `latest` を対象にできます。
  - トークンベースの npm dist-tag 変更は `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` にあります。これは、ソースリポジトリが OIDC 専用公開を維持している一方で、`npm dist-tag add` には引き続き `NPM_TOKEN` が必要なためです。
  - 公開 `macOS Release` は検証専用です。タグがリリースブランチ上にのみ存在するが、ワークフローが `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.PATCH` を設定します。
  - 実際の macOS 公開には、成功した macOS `preflight_run_id` と `validate_run_id` が必要です。
  - 実際の公開パスは、アーティファクトを再ビルドするのではなく、準備済みアーティファクトを昇格します。
- `YYYY.M.PATCH-N` のような stable 修正リリースでは、公開後検証ツールが `YYYY.M.PATCH` から `YYYY.M.PATCH-N` への同じ一時 prefix アップグレードパスもチェックし、リリース修正が古いグローバルインストールを base stable ペイロードのまま静かに残さないようにします。
- npm リリースプリフライトは、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り fail closed するため、空のブラウザーダッシュボードを再び出荷しません。
- 公開後検証では、公開済み Plugin エントリーポイントとパッケージメタデータがインストール済み registry レイアウトに存在することもチェックします。Plugin ランタイムペイロードが欠落したリリースは postpublish 検証に失敗し、`latest` へ昇格できません。
- `pnpm test:install:smoke` は候補更新 tarball に対して npm pack の `unpackedSize` 予算も強制するため、installer e2e はリリース公開パスの前に偶発的な pack 肥大化を検出します。
- リリース作業で CI 計画、extension タイミングマニフェスト、または extension テストマトリクスに触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` から planner 所有の `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートが古い CI レイアウトを説明しないようにします。
- stable macOS リリース準備には updater surface も含まれます。GitHub リリースには最終的にパッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が含まれている必要があります。`main` 上の `appcast.xml` は公開後に新しい stable zip を指している必要があります（macOS 公開ワークフローが自動的にコミットするか、直接 push がブロックされている場合は appcast PR を開きます）。パッケージ化された app は、非 debug bundle id、空でない Sparkle feed URL、そのリリースバージョンの canonical Sparkle build floor 以上の `CFBundleVersion` を維持する必要があります。

## リリーステストボックス

`Full Release Validation` は、operators がすべてのプレリリーステストを 1 つの entrypoint から開始する方法です。動きの速いブランチで固定コミット証拠を得るには、各 child ワークフローが対象 SHA に固定された一時ブランチから実行されるようにヘルパーを使用します。

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` を push し、そのブランチから `ref=<sha>` で `Full Release Validation` をディスパッチし、各 child ワークフローの `headSha` が対象と一致することを検証してから、一時ブランチを削除します。これにより、誤って新しい `main` child 実行を証明してしまうことを避けられます。

リリースブランチまたはタグの検証では、信頼された `main` ワークフロー ref から実行し、リリースブランチまたはタグを `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

ワークフローはターゲット ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチしてから、`OpenClaw Release Checks` をディスパッチします。`OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、正規の Telegram パッケージ E2E を含む Package Acceptance、QA Lab パリティ、live Matrix、live Telegram にファンアウトします。full/all 実行が許容されるのは、意図的な集中的再実行で別個の `Plugin Prerelease` 子がスキップされた場合を除き、`Full Release Validation` サマリーで `normal_ci`、`plugin_prerelease`、`release_checks` が成功と表示される場合だけです。スタンドアロンの `npm-telegram` 子は、`release_package_spec` または `npm_telegram_package_spec` を指定した公開済みパッケージの集中的再実行にのみ使用します。最終 verifier サマリーには各子実行の最遅ジョブ表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。

完全なステージマトリクス、正確なワークフロージョブ名、stable と full プロファイルの違い、アーティファクト、集中的再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation) を参照してください。

子ワークフローは、ターゲット `ref` が古いリリースブランチやタグを指している場合でも、`Full Release Validation` を実行する信頼済み ref、通常は `--ref main` からディスパッチされます。別個の Full Release Validation workflow-ref 入力はありません。ワークフロー実行 ref を選択することで、信頼済みハーネスを選択します。移動する `main` 上の正確なコミット証明に `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使用して固定された一時ブランチを作成します。

live/provider の範囲を選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live および Docker パス
- `stable`: リリース承認向けに、minimum に安定 provider/backend カバレッジを追加
- `full`: stable に広範な advisory provider/media カバレッジを追加

stable と full の検証では、昇格前に必ず網羅的な live/E2E、Docker リリースパス、境界付きの公開済みアップグレード survivor スイープを実行します。ベータに対して同じスイープを要求するには `run_release_soak=true` を使用します。このスイープは、最新 4 つの stable パッケージに加え、固定された `2026.4.23` と `2026.5.2` ベースライン、さらに古い `2026.4.15` カバレッジを対象とし、重複ベースラインを削除したうえで各ベースラインを個別の Docker runner ジョブに shard します。

`OpenClaw Release Checks` は信頼済みワークフロー ref を使用してターゲット ref を一度だけ `release-package-under-test` として解決し、soak 実行時にはそのアーティファクトをクロス OS、Package Acceptance、リリースパス Docker チェックで再利用します。これにより、パッケージを扱うすべての box が同じバイト列を使い、パッケージビルドの繰り返しを避けられます。ベータがすでに npm に公開されている場合は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を設定し、release checks が出荷済みパッケージを一度だけダウンロードし、`dist/build-info.json` からビルド元 SHA を抽出して、そのアーティファクトをクロス OS、Package Acceptance、リリースパス Docker、パッケージ Telegram レーンで再利用するようにします。

クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.5` を使用します。このレーンは最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、gateway 起動、1 回の live agent turn を証明するためです。より広範な live provider マトリクスが、モデル固有カバレッジの場です。

リリース段階に応じて、次のバリアントを使用します。

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

集中的修正後の最初の再実行として、full umbrella を使用しないでください。1 つの box が失敗した場合は、次の証明に失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデル provider、または QA レーンを使用します。full umbrella を再度実行するのは、修正が共有リリースオーケストレーションを変更した場合、または以前の全 box 証拠が古くなった場合だけです。umbrella の最終 verifier は記録された子ワークフロー実行 ID を再チェックするため、子ワークフローを正常に再実行した後は、失敗した親ジョブ `Verify full validation` だけを再実行します。

境界付きの復旧には、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常 CI 子のみ、`plugin-prerelease` はリリース専用 Plugin 子のみ、`release-checks` はすべてのリリース box を実行し、より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。集中的な `npm-telegram` 再実行には `release_package_spec` または `npm_telegram_package_spec` が必要です。full/all 実行では Package Acceptance 内の正規パッケージ Telegram E2E を使用します。集中的なクロス OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/suite フィルターを追加できます。QA release-check の失敗は、標準 tier における必須の OpenClaw dynamic tool drift を含め、通常のリリース検証をブロックします。Tideclaw alpha 実行では、package-safety 以外の release-check レーンを引き続き advisory として扱う場合があります。`live_suite_filter` が Discord、WhatsApp、Slack などの gated QA live レーンを明示的に要求する場合は、対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 変数を有効にする必要があります。有効でない場合、レーンを暗黙にスキップするのではなく、入力キャプチャが失敗します。

### Vitest

Vitest box は手動 `CI` 子ワークフローです。手動 CI は意図的に changed scoping をバイパスし、リリース候補に対して通常のテストグラフを強制します。Linux Node shard、bundled-plugin shard、Plugin と channel contract shard、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトのスモークチェック、docs チェック、Python skills、Windows、macOS、Control UI i18n が対象です。`Full Release Validation` が box を実行する場合、umbrella が `include_android=true` を渡すため Android も含まれます。スタンドアロンの手動 CI で Android カバレッジを得るには `include_android=true` が必要です。

この box は「ソースツリーは完全な通常テストスイートに合格したか」に答えるために使用します。これはリリースパスのプロダクト検証とは同じではありません。保持する証拠は次のとおりです。

- ディスパッチされた `CI` 実行 URL を表示する `Full Release Validation` サマリー
- 正確なターゲット SHA 上で green になった `CI` 実行
- 回帰調査時の CI ジョブからの失敗または低速 shard 名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースで決定的な通常 CI が必要だが、Docker、QA Lab、live、クロス OS、またはパッケージ box が不要な場合のみ、手動 CI を直接実行します。非 Android の直接 CI には最初のコマンドを使用します。直接のリリース候補 CI で Android をカバーする必要がある場合は `include_android=true` を追加します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker box は、`openclaw-live-and-e2e-checks-reusable.yml` を通じて `OpenClaw Release Checks` 内にあり、さらに release-mode の `install-smoke` ワークフローにもあります。これはソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには次が含まれます。

- 低速な Bun global install smoke を有効にした full install smoke
- ターゲット SHA ごとの root Dockerfile smoke イメージ準備/再利用。QR、root/gateway、installer/Bun smoke ジョブは個別の install-smoke shard として実行
- repository E2E レーン
- リリースパス Docker chunk: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` chunk 内の OpenWebUI カバレッジ
- 分割された bundled Plugin install/uninstall レーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- release checks に live suite が含まれる場合の live/E2E provider suite と Docker live model カバレッジ

再実行前に Docker アーティファクトを使用してください。リリースパススケジューラは `.artifacts/docker-tests/` をアップロードし、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラ plan JSON、再実行コマンドを含めます。集中的な復旧には、すべてのリリース chunk を再実行する代わりに、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab box も `OpenClaw Release Checks` の一部です。これは agentic behavior とチャネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには次が含まれます。

- agentic parity pack を使用して OpenAI candidate レーンを `anthropic/claude-opus-4-8` ベースラインと比較する mock parity レーン
- `qa-live-shared` 環境を使用する fast live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA レーン
- リリース telemetry に明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke`、または `pnpm qa:observability:smoke`

この box は「リリースは QA シナリオと live channel flow で正しく動作するか」に答えるために使用します。リリース承認時には、parity、Matrix、Telegram レーンのアーティファクト URL を保持してください。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動の sharded QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージ box はインストール可能プロダクトのゲートです。これは `Package Acceptance` と resolver `scripts/resolve-openclaw-package-candidate.mjs` に支えられています。resolver は候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージ inventory を検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離して保持します。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択した `workflow_ref` ハーネスで、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を pack する
- `source=url`: 必須の `package_sha256` を指定して公開 HTTPS `.tgz` をダウンロードする。URL 認証情報、非デフォルト HTTPS ポート、private/internal/special-use ホスト名または解決済みアドレス、安全でないリダイレクトは拒否される
- `source=trusted-url`: 必須の `package_sha256` と `.github/package-trusted-sources.json` 内の名前付きポリシーからの `trusted_source_id` を指定して HTTPS `.tgz` をダウンロードする。これは、`source=url` に入力レベルの private-network バイパスを追加する代わりに、メンテナー所有の enterprise mirror や private package repository に使用する
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用する

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` で Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、移行、更新、root 管理 VPS アップグレード、設定済み認証の更新再起動、ライブ ClawHub skill インストール、古い plugin 依存関係のクリーンアップ、オフライン plugin fixture、plugin 更新、plugin コマンドバインディングのエスケープ強化、Telegram パッケージ QA を維持します。ブロッキングリリースチェックは、デフォルトで最新の公開済みパッケージベースラインを使用します。`run_release_soak=true`、`release_profile=stable`、または `release_profile=full` を指定したベータプロファイルでは、published-upgrade-survivor スイープが `last-stable-4` に加えて、固定された `2026.4.23`、`2026.5.2`、`2026.4.15` ベースラインと `reported-issues` シナリオへ拡張されます。すでに出荷済みの候補には `source=npm`、公開前の SHA に基づくローカル npm tarball には `source=ref`、メンテナー所有のエンタープライズ/プライベートミラーには `source=trusted-url`、別の GitHub Actions run によってアップロードされた準備済み tarball には `source=artifact` で Package Acceptance を使用します。

これは、以前は Parallels が必要だったパッケージ/更新カバレッジの大部分に対する GitHub ネイティブの代替です。OS 固有のオンボーディング、インストーラー、プラットフォーム動作についてはクロス OS リリースチェックが引き続き重要ですが、パッケージ/更新のプロダクト検証では Package Acceptance を優先する必要があります。

更新と plugin 検証の正規チェックリストは [更新と plugin のテスト](/ja-JP/help/testing-updates-plugins) です。plugin インストール/更新、doctor クリーンアップ、または公開済みパッケージ移行変更を証明するために、どのローカル、Docker、Package Acceptance、または release-check レーンを使うか判断するときに使用します。すべての安定版 `2026.4.23+` パッケージからの網羅的な公開済み更新移行は、別個の手動 `Update Migration` ワークフローであり、Full Release CI の一部ではありません。

従来の package-acceptance の許容措置は、意図的に期限付きです。`2026.4.25` までのパッケージは、すでに npm に公開済みのメタデータ不足について互換性パスを使用できます。これには、tarball に含まれていないプライベート QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git fixture に含まれていないパッチファイル、永続化された `update.channel` の欠落、従来の plugin インストールレコードの場所、marketplace インストールレコード永続化の欠落、`plugins update` 中の設定メタデータ移行が含まれます。公開済みの `2026.4.26` パッケージは、すでに出荷済みだったローカルビルドメタデータスタンプファイルについて警告してもかまいません。それ以降のパッケージは、現代的なパッケージ契約を満たす必要があります。同じ不足はリリース検証で失敗します。

リリース上の問いが実際にインストール可能なパッケージに関するものである場合は、より広い Package Acceptance プロファイルを使用します。

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

- `smoke`: 簡易パッケージインストール/チャンネル/agent、gateway ネットワーク、設定リロードレーン
- `package`: インストール/更新/再起動/plugin パッケージ契約に加えて、ライブ ClawHub skill インストール証明。これは release-check のデフォルトです
- `product`: `package` に加えて、MCP チャンネル、cron/subagent クリーンアップ、OpenAI web search、OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスチャンク
- `custom`: 集中的な再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または `telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの `package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの Telegram ワークフローは、公開後チェック用に公開済み npm spec を引き続き受け付けます。

## 通常リリース公開自動化

ベータ、`latest`、plugin、GitHub Release、プラットフォーム公開では、
`OpenClaw Release Publish` が通常の変更を伴うエントリーポイントです。月次の
`.33+` npm 限定 extended-stable パスでは、このオーケストレーターを使用しません。
通常のワークフローは、リリースに必要な順序で trusted-publisher ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを検証します（alpha プレリリースの場合は Tideclaw alpha ブランチも可）。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で `Plugin NPM Release` をディスパッチします。
5. 同じスコープと SHA で `Plugin ClawHub Release` をディスパッチします。
6. 保存済みの `full_release_validation_run_id` を検証した後、リリースタグ、npm dist-tag、保存済み `preflight_run_id` で `OpenClaw NPM Release` をディスパッチします。
7. 安定版リリースでは、GitHub release をドラフトとして作成または更新し、明示的な `windows_node_tag` と候補承認済みの `windows_node_installer_digests` で `Windows Node Release` をディスパッチし、ドラフト公開前に正規インストーラー/チェックサムアセットを検証します。

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

`latest` へ直接安定版を昇格する場合は明示的です。

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

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、集中的な修復または再公開作業にのみ使用します。`OpenClaw Release Publish` は、`publish_openclaw_npm=true` の場合に `plugin_publish_scope=selected` を拒否します。これにより、`@openclaw/diffs-language-pack` を含む公開可能なすべての公式 plugin なしでコアパッケージが出荷されることを防ぎます。選択した plugin の修復では、`plugin_publish_scope=selected` と `plugins=@openclaw/name` に加えて `publish_openclaw_npm=false` を設定するか、子ワークフローを直接ディスパッチします。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、以下のオペレーター制御入力を受け付けます。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1`、`v2026.4.2-alpha.1`。`preflight_only=true` の場合、検証専用 preflight 用に現在の完全な 40 文字のワークフローブランチコミット SHA も指定できます
- `preflight_only`: 検証/ビルド/パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 既存の成功済み preflight run id。実際の公開パスでは必須で、ワークフローが再ビルドせず準備済み tarball を再利用できるようにします
- `full_release_validation_run_id`: このタグ/SHA に対する成功済み `Full Release Validation` run id。実際の公開では必須です。ベータ公開は警告付きで preflight のみでも続行できますが、安定版/`latest` 昇格では引き続きこれが必要です。
- `release_publish_run_id`: 承認済みの `OpenClaw Release Publish` run id。このワークフローが親からディスパッチされる場合（bot actor による実公開呼び出し）に必須です
- `npm_dist_tag`: 公開パス用の npm ターゲットタグ。`alpha`、`beta`、`latest`、`extended-stable` を受け付け、デフォルトは `beta` です。最終パッチ `33` 以降は `extended-stable` を使用する必要があります。デフォルトでは、`extended-stable` はそれ以前のパッチを拒否し、非最終タグは常に拒否します。
- `bypass_extended_stable_guard`: テスト専用の boolean。デフォルトは `false`。`npm_dist_tag=extended-stable` とともに使用すると、リリース ID、アーティファクト、承認、読み戻しチェックを維持しながら、月次 extended-stable 適格性をバイパスします。

`OpenClaw Release Publish` は、以下のオペレーター制御入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功済みの `OpenClaw NPM Release` preflight run id。`publish_openclaw_npm=true` の場合に必須です
- `full_release_validation_run_id`: 成功済みの `Full Release Validation` run id。`publish_openclaw_npm=true` の場合に必須です
- `windows_node_tag`: 正確な非プレリリースの `openclaw/openclaw-windows-node` リリースタグ。安定版 OpenClaw 公開では必須です
- `windows_node_installer_digests`: 現在の Windows インストーラー名から固定された `sha256:` ダイジェストへの、候補承認済みのコンパクト JSON マップ。安定版 OpenClaw 公開では必須です
- `npm_telegram_run_id`: 最終リリース証拠に含める任意の成功済み `NPM Telegram Beta E2E` run id
- `npm_dist_tag`: OpenClaw パッケージ用の npm ターゲットタグ。`alpha`、`beta`、`latest` のいずれか
- `plugin_publish_scope`: デフォルトは `all-publishable`。`selected` は、`publish_openclaw_npm=false` を指定した集中的な plugin 限定修復作業にのみ使用します
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを plugin 限定修復オーケストレーターとして使用する場合にのみ `false` を設定します
- `release_profile`: リリース証拠サマリーに使用されるリリースカバレッジプロファイル。デフォルトは `from-validation` で、検証マニフェストから読み取ります。`beta`、`stable`、`full` で上書きできます
- `wait_for_clawhub`: デフォルトは `false` で、ClawHub サイドカーによって npm 可用性がブロックされないようにします。ワークフロー完了に ClawHub 完了を含める必要がある場合にのみ `true` を設定します

`OpenClaw Release Checks` は、以下のオペレーター制御入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを含むチェックでは、解決済みコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: ベータリリースチェックで、網羅的なライブ/E2E、Docker リリースパス、all-since upgrade-survivor soak を有効にします。`release_profile=stable` と `release_profile=full` によって強制的に有効化されます。

ルール:

- パッチ `33` 未満の通常の最終版および修正版は、`beta` または `latest` のどちらにも公開できます。パッチ `33` 以上の最終版は `extended-stable` に公開する必要があり、その境界での修正サフィックス版は拒否されます。
- ベータプレリリースタグは `beta` にのみ公開でき、alpha プレリリースタグは `alpha` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは、公開前にそのメタデータが継続していることを検証します

## 通常のベータ/latest 安定版リリース手順

この従来の手順は、plugin、GitHub Release、Windows、その他のプラットフォーム作業も所有する通常のオーケストレーションされたリリース用です。このページの先頭で説明している月次 `.33+` npm 限定 extended-stable パスではありません。

通常のオーケストレーションされた安定版リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します。タグがまだ存在しない場合は、preflight ワークフローの検証専用ドライランとして、現在の完全なワークフローブランチのコミット SHA を使用できます。
2. 通常のベータ優先フローでは `npm_dist_tag=beta` を選択し、意図的に安定版へ直接 publish したい場合にのみ `latest` を選択します。
3. 1 つの手動ワークフローで通常の CI に加えて、ライブ prompt cache、Docker、QA Lab、Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全なコミット SHA で `Full Release Validation` を実行します。意図的に決定的な通常テストグラフだけが必要な場合は、代わりにリリース ref で手動の `CI` ワークフローを実行します。
4. 署名済みの x64 および ARM64 インストーラーを出荷する、正確な非プレリリースの `openclaw/openclaw-windows-node` リリースタグを選択します。それを `windows_node_tag` として保存し、検証済みの digest map を `windows_node_installer_digests` として保存します。リリース候補ヘルパーは両方を記録し、生成する publish コマンドに含めます。
5. 成功した `preflight_run_id` と `full_release_validation_run_id` を保存します。
6. 同じ `tag`、同じ `npm_dist_tag`、選択した `windows_node_tag`、保存した `windows_node_installer_digests`、保存した `preflight_run_id`、保存した `full_release_validation_run_id` で `OpenClaw Release Publish` を実行します。これは OpenClaw npm パッケージを昇格する前に、外部化された plugins を npm と ClawHub に publish します。
7. リリースが `beta` に着地した場合は、`openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その安定版を `beta` から `latest` に昇格します。
8. リリースを意図的に `latest` へ直接 publish し、`beta` も同じ安定版ビルドを直ちに追従させる必要がある場合は、同じリリースワークフローを使用して両方の dist-tags をその安定版に向けるか、スケジュールされた自己修復同期によって後で `beta` を移動させます。

dist-tag の変更はリリース台帳リポジトリにあります。これはまだ `NPM_TOKEN` を必要とする一方で、ソースリポジトリは OIDC のみの publish を維持しているためです。これにより、直接 publish パスとベータ優先の昇格パスの両方が文書化され、オペレーターから見える状態に保たれます。

メンテナーがローカルの npm 認証にフォールバックする必要がある場合は、1Password CLI (`op`) コマンドを必ず専用の tmux セッション内で実行します。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内に保つことで、プロンプト、アラート、OTP の処理を観測可能にし、ホストアラートの繰り返しを防げます。

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

メンテナーは実際のランブックとして、[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) にある非公開リリースドキュメントを使用します。

## 関連

- [リリースチャネル](/ja-JP/install/development-channels)
