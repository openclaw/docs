---
read_when:
    - 公開リリースチャンネルの定義を検索しています
    - リリース検証またはパッケージ受け入れテストの実行
    - バージョンの命名規則とリリース頻度を確認する
summary: リリースレーン、運用担当者向けチェックリスト、検証環境、バージョン命名規則、リリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-07-11T22:39:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw は現在、ユーザー向けに3つの更新チャネルを公開しています。

- stable: 既存の昇格済みリリースチャネル。独立した CLI/チャネルのマイルストーンが実装されるまでは、引き続き npm `latest` を参照します
- beta: npm `beta` に公開されるプレリリースタグ
- dev: 移動し続ける `main` の先端

これとは別に、リリース担当者は完了した直近月のコアパッケージを、パッチ `33` から npm `extended-stable` に公開できます。当月の通常の最終リリース系列は引き続き npm `latest` を使用します。この担当者側の公開先分離だけでは、CLI の更新チャネル解決は変更されません。

Tideclaw のアルファビルドは独立した内部プレリリース系列（npm dist-tag `alpha`）であり、[NPM ワークフロー入力](#npm-workflow-inputs)および[リリーステストボックス](#release-test-boxes)で説明しています。

## バージョン命名

- 月次 npm extended-stable リリースバージョン: `YYYY.M.PATCH`、`PATCH >= 33`、git タグ `vYYYY.M.PATCH`
- 日次/通常の最終リリースバージョン: `YYYY.M.PATCH`、`PATCH < 33`、git タグ `vYYYY.M.PATCH`
- 通常のフォールバック修正リリースバージョン: `YYYY.M.PATCH-N`、git タグ `vYYYY.M.PATCH-N`
- ベータプレリリースバージョン: `YYYY.M.PATCH-beta.N`、git タグ `vYYYY.M.PATCH-beta.N`
- アルファプレリリースバージョン: `YYYY.M.PATCH-alpha.N`、git タグ `vYYYY.M.PATCH-alpha.N`
- 月またはパッチをゼロ埋めしない
- `PATCH` は暦日ではなく、月ごとに連番となるリリース系列番号です。通常の最終リリースとベータリリースは現在の系列を進めます。アルファ専用タグがベータ/通常リリースのパッチ番号を消費したり進めたりすることはありません。そのため、ベータまたは通常リリースの系列を選択する際は、より大きいパッチ番号を持つ旧来のアルファ専用タグを無視してください。
- アルファ/ナイトリービルドは次の未リリースのパッチ系列を使用し、ビルドを繰り返す場合は `alpha.N` のみを増やします。そのパッチのベータ版が作成された後は、新しいアルファビルドを次のパッチへ移します。
- npm のバージョンは不変です。公開済みタグを削除、再公開、または再利用してはいけません。代わりに、次のプレリリース番号または次の月次パッチを作成してください。
- `latest` は引き続き現在の通常/日次 npm 系列を追跡し、`beta` は現在のベータ版インストール先です
- `extended-stable` はパッチ `33` から始まる、サポート対象の直近月 npm パッケージを意味します。パッチ `34` 以降は、その月次系列のメンテナンスリリースです
- 通常の最終リリースと通常の修正リリースは、デフォルトで npm `beta` に公開されます。リリース担当者は明示的に `latest` を指定することも、検証済みのベータビルドを後から昇格することもできます
- 専用の月次 extended-stable パスでは、コア npm パッケージと、npm に公開可能なすべての公式 Plugin を同一の正確なバージョンで公開します。Plugin の ClawHub への公開、macOS または Windows アーティファクト、GitHub Release、プライベートリポジトリの dist-tag、Docker イメージ、モバイルアーティファクト、ウェブサイトのダウンロードは公開しません。
- 通常の最終リリースでは毎回、npm パッケージ、macOS アプリ、署名済みのスタンドアロン Android APK、署名済み Windows Hub インストーラーをまとめて提供します。ベータリリースでは通常、最初に npm/パッケージのパスを検証して公開し、ネイティブアプリのビルド、署名、公証、昇格は、明示的な要求がない限り通常の最終リリース時に行います。

## リリース周期

- リリースはベータを先行させます。stable は最新のベータが検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.PATCH` ブランチでリリースを作成します。これにより、リリースの検証や修正が `main` 上の新規開発を妨げません
- ベータタグがプッシュまたは公開された後に修正が必要になった場合、メンテナーは古いタグを削除または再作成するのではなく、次の `-beta.N` タグを作成します
- 詳細なリリース手順、承認、認証情報、復旧に関する注意事項はメンテナー専用です

## 月次 npm 専用 extended-stable 公開

これは、後述する通常のリリース手順に対する専用の例外です。完了した月 `YYYY.M` に対して `extended-stable/YYYY.M.33` を作成し、`vYYYY.M.33` とそれ以降のメンテナンスパッチを同じブランチから公開します。リリースタグ、ブランチ先端、チェックアウト、パッケージバージョン、npm 事前確認、および完全リリース検証の実行は、すべて同一のコミットを示す必要があります。保護された `main` には、パッチ `33` 未満で、暦上厳密に後の月に属する最終バージョンがすでに含まれていなければなりません。`main` が2か月以上進んだ後も、メンテナンスパッチは引き続き対象となります。

対象の extended-stable ブランチ上で、ルートパッケージを `YYYY.M.P` に更新し、`pnpm release:prep` を実行して、公開可能なすべての拡張パッケージが同じバージョンであることを確認します。生成された変更をすべてコミットしてプッシュし、そのコミットに不変の `vYYYY.M.P` タグを作成してプッシュした後、得られた完全な SHA を記録します。ワークフローはこの準備済みツリーを使用します。バージョンの更新や同期を代行することはありません。

その準備済みブランチの正確な先端から npm 事前確認と完全リリース検証を実行し、両方の実行 ID と、成功した完全リリース検証の実行試行番号を保存します。

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

`release_profile=stable` は既存の検証深度プロファイルです。npm の `extended-stable` dist-tag とは別のものであり、意図的に変更していません。

両方の実行が成功した後、同一ブランチの正確な先端から、npm に公開可能なすべての公式 Plugin を公開します。パッチ `P` は `33` 以上でなければなりません。完全なリリース SHA を `ref` として渡し、マトリックス全体とレジストリの読み戻しが完了するまで待ってから、成功した Plugin NPM Release の実行 ID を保存します。

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

このワークフローは、ソースが変更されていないパッケージも含め、通常の準備済み `all-publishable` パッケージ一覧を使用します。成功する前に、正確な各パッケージと各 Plugin の `extended-stable` タグを検証します。部分的な実行が失敗した場合は、同じコマンドを再実行してください。公開済みのパッケージは再利用され、欠落または古くなった Plugin タグは npm リリース環境内で整合され、最終的な読み戻しでは引き続き完全なパッケージセットが対象となります。

Plugin ワークフローが成功し、npm リリース環境の準備が整った後、事前確認で生成された正確なコア tarball を公開します。コアの公開処理では、参照された Plugin の実行が同一の正規ブランチかつ正確なソース SHA 上で `completed/success` であることを検証します。

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

月次 `.33` または保護された `main` の月ポリシーを意図的に満たせないフォークや非本番リハーサルでは、npm の事前確認と公開の両方のディスパッチに `-f bypass_extended_stable_guard=true` を追加します。デフォルトは `false` です。このバイパスは `npm_dist_tag=extended-stable` の場合にのみ受け入れられ、ワークフローの概要に記録されます。これは、正規の `extended-stable/YYYY.M.33` ワークフロー ref、ブランチ先端/タグ/チェックアウトの一致、最終タグの構文、パッケージ/タグバージョンの一致、参照された実行とマニフェストの同一性、tarball の来歴、環境の承認、レジストリの読み戻し、またはセレクター修復の証拠を迂回するものではありません。

公開ワークフローは、参照された事前確認、検証、Plugin 実行の同一性、準備済み tarball のダイジェスト、およびコアレジストリのセレクターを検証します。ワークフローが成功した後、結果を独立して確認してください。

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

両方のコマンドが `YYYY.M.P` を返す必要があります。公開は成功したもののセレクターの読み戻しに失敗した場合、不変のパッケージバージョンを再公開してはいけません。失敗したワークフローの常時実行される概要に出力された単一の `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復コマンドを使用し、その後、両方の独立した読み戻しを繰り返します。以前のセレクターへのロールバックは別途担当者が判断するものであり、読み戻しの修復手順ではありません。

公開サポートドキュメントでは当初、Slack、Discord、Codex を extended-stable の対象 Plugin サーフェスとして指定しています。この一覧はサポート方針であり、リリースコードの許可リストではありません。npm に公開可能なすべての公式 Plugin が、同一の正確なバージョンを公開するパスに従います。

以下の通常チェックリストは引き続き、ベータ、`latest`、GitHub Release、Plugin、macOS、Windows、およびその他のプラットフォームへの公開を対象とします。この npm 専用 extended-stable パスでは、それらの手順を実行しないでください。

## 通常リリース担当者向けチェックリスト

このチェックリストは、リリースフローの公開部分を示します。非公開の認証情報、署名、公証、dist-tag の復旧、緊急ロールバックの詳細は、メンテナー専用のリリース手順書に記載されています。

1. 現在の `main` から開始します。最新の状態をプルし、対象コミットがプッシュ済みであること、および `main` の CI がブランチ作成元として十分に成功していることを確認します。
2. 到達可能な最後のリリースタグ以降にマージされた PR とすべての直接コミットから、`CHANGELOG.md` の先頭セクションを生成します。エントリはユーザー向けにし、重複する PR／直接コミットのエントリを除去して、コミット、プッシュした後、ブランチ作成前にもう一度リベース／プルします。分岐したリリース済みタグまたは後続のフォワードポートによって、すでにリリースされた PR が再び関連付けられる場合は、そのタグを `--shipped-ref` として明示的に渡します。検証ツールは、タグのスナップショットにある番号付きセクションの完全なコントリビューション記録から明示的な PR 行を使用し、`Unreleased` を無視して、除外した PR の正確な一覧と件数を記録します。
3. `src/plugins/compat/registry.ts` と `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性記録を確認します。アップグレードパスが引き続き確保される場合にのみ期限切れの互換性を削除し、それ以外の場合は意図的に維持する理由を記録します。
4. 現在の `main` から `release/YYYY.M.PATCH` を作成します。通常のリリース作業を `main` 上で直接行わないでください。
5. タグに必要なすべてのバージョン箇所を更新してから、`pnpm release:prep` を実行します。これは Plugin のバージョン、npm shrinkwrap、Plugin インベントリ、基本設定スキーマ、同梱チャネルの設定メタデータ、設定ドキュメントのベースライン、Plugin SDK のエクスポート、Plugin SDK API のベースラインをこの順序で更新します。タグ付け前に生成物の差分をコミットし、その後、ローカルの決定論的な事前検証として `pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build`、`pnpm release:check` を実行します。
6. `OpenClaw NPM Release` を `preflight_only=true` で実行します。タグが存在する前は、検証専用の事前検証にリリースブランチの完全な 40 文字の SHA を使用できます。事前検証は、チェックアウトされた正確な依存関係グラフの依存関係リリース証跡を生成し、npm 事前検証アーティファクトに保存します。成功した `preflight_run_id` を保存します。
7. リリースブランチ、タグ、または完全なコミット SHA を対象に `Full Release Validation` を実行し、すべてのリリース前テストを開始します。これは、Vitest、Docker、QA Lab、Package という 4 つの大規模なリリーステストボックスに対する唯一の手動エントリポイントです。`full_release_validation_run_id` と正確な `full_release_validation_run_attempt` を保存します。どちらも `OpenClaw NPM Release` と `OpenClaw Release Publish` の必須入力です。
8. 検証に失敗した場合は、リリースブランチで修正し、その修正を証明できる最小単位の失敗ファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行します。変更対象によって以前の証跡が無効になる場合にのみ、包括的な検証全体を再実行します。
9. タグ付きベータ候補では、対応する `release/YYYY.M.PATCH` ブランチから `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` を実行します。安定版では、必須の Windows ソースリリースも `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z` のように渡します。このヘルパーは信頼済みの `main` をワークフローソースとして使用し、各ワークフローは正確なタグを対象にします。変更不能な候補／ツール ID とディスパッチされた実行 ID を `.artifacts/release-candidate/<tag>/release-candidate-state.json` にチェックポイントとして保存します。同じコマンドを再実行すると、その正確な実行から再開されますが、候補、ツール、プロファイル、またはオプションに差異がある場合は安全側に倒して失敗します。完全な検証マトリクスをディスパッチする前に、ヘルパーは正確なタグの GitHub リリース本文を決定論的にレンダリングし、バージョン見出しがない場合、上限超過の本文に正規の簡潔形式を使用できない場合、またはコントリビューション記録のベース／ターゲットの来歴がタグから到達不能な場合は拒否します。また、明示的なリリース済みベースライン除外メタデータを、参照先の累積タグ記録に照らして検証します。その後、ローカルの生成済みリリースチェックを実行し、完全なリリース検証と npm 事前検証の証跡をディスパッチまたは検証し、正確に準備された tarball に対する Parallels の新規インストール／更新証跡と Telegram パッケージ証跡を実行し、Plugin の npm および ClawHub の計画を記録します。証跡バンドルがすべて成功した後にのみ、正確な `OpenClaw Release Publish` コマンドを出力します。

   `OpenClaw Release Publish` は、選択された、または公開可能なすべての Plugin パッケージを npm にディスパッチし、同じ一式を並行して ClawHub にディスパッチします。その後、Plugin の npm 公開が成功すると、準備済みの OpenClaw npm 事前検証アーティファクトを対応する dist-tag で昇格します。リリースのチェックアウトは製品／データのルートとして維持されますが、計画と最終検証は正確な信頼済みワークフローソースのチェックアウトから実行されるため、古いリリースコミットが廃止済みのリリースツールを暗黙に使用することはありません。公開子処理を開始する前に、正確な GitHub リリース本文をレンダリングしてキャッシュします。対応する完全な `CHANGELOG.md` セクションが GitHub の 125,000 文字制限とレンダラーの対応する 125,000 バイトの安全上限に収まる場合、そのページには見出しを含む正確な `## YYYY.M.PATCH` セクションが掲載されます。ソースセクションが収まらない場合、ページにはグループ化された編集済み注記を正確に維持し、サイズ超過のコントリビューション記録をタグに固定された `CHANGELOG.md` 内の完全な記録への安定したリンクに置き換えます。不完全な記録や途中で切れた箇条書きは公開されません。ワークフローは `### Release verification` を追加する前に完全版または簡潔版の本文を選択します。証跡の末尾を追加すると上限を超える場合は、正規の本文を維持し、変更不能な添付証跡を利用します。npm の `latest` に公開された安定版リリースは GitHub の最新リリースになりますが、npm の `beta` に維持される安定版メンテナンスリリースは GitHub で `latest=false` として作成されます。また、リリース後のインシデント対応用として、事前検証の依存関係証跡、完全検証マニフェスト、公開後のレジストリ検証証跡を GitHub リリースにアップロードします。子実行 ID を直ちに出力し、ワークフロートークンに承認権限があるリリース環境ゲートを自動承認し、失敗した子ジョブをログ末尾とともに要約します。ドラフトの GitHub リリースページを最初に作成し、OpenClaw の npm 公開と並行して Windows および Android のアセットを昇格させます。それらの段階が成功すると、リリースページと依存関係証跡を完了させます。OpenClaw npm を公開する場合は ClawHub の完了を待ち、その後、信頼済み `main` のベータ検証ツールを実行します。GitHub リリース、npm パッケージ、選択された Plugin npm パッケージ、選択された ClawHub パッケージ、子ワークフロー実行 ID、および任意の NPM Telegram 実行 ID に対する公開後の証跡をアップロードします。ClawHub ブートストラップ検証ツールでは、正確な信頼済み `main` のワークフローパスと SHA、生成元と最終実行の試行番号、リリース SHA、要求されたパッケージ一式、変更不能なパッケージアーティファクトのタプル、最終レジストリ読み戻しアーティファクトが必要です。成功済みの従来型リリース参照の実行は受け入れられません。

   その後、公開済みの `openclaw@YYYY.M.PATCH-beta.N` または `openclaw@beta` パッケージに対して、公開後のパッケージ受け入れテストを実行します。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、対応する次のプレリリース番号を作成します。古いものを削除または書き換えてはなりません。

10. 安定版では、審査済みのベータまたはリリース候補に必要な検証証跡が揃った後にのみ続行します。安定版の npm 公開も `OpenClaw Release Publish` を経由し、成功済みの事前検証アーティファクトを `preflight_run_id` で再利用します。安定版 macOS リリースの準備完了には、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および更新済みの `appcast.xml` が `main` に存在することも必要です。リリースアセットの検証後、macOS 公開ワークフローは署名済み appcast を公開 `main` に自動的に公開します。ブランチ保護によって直接プッシュがブロックされる場合は、appcast PR を作成または更新します。安定版 Windows Hub の準備完了には、署名済みの `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe`、`OpenClawCompanion-SHA256SUMS.txt` アセットが OpenClaw GitHub リリースに存在することが必要です。正確な署名済み `openclaw/openclaw-windows-node` リリースタグを `windows_node_tag` として渡し、候補で承認済みのインストーラーダイジェストマップを `windows_node_installer_digests` として渡します。`OpenClaw Release Publish` はリリースをドラフトのまま維持し、`Windows Node Release` をディスパッチし、公開前に 3 つすべてのアセットを検証します。
11. 公開後、npm 公開後検証ツールを実行し、公開後のチャネル証跡が必要な場合は任意のスタンドアロン公開済み npm Telegram E2E を実行し、必要に応じて dist-tag を昇格させ、生成された GitHub リリースページを検証し、リリース告知手順を実行します。その後、安定版リリースの完了を宣言する前に、[安定版の main 完了処理](#stable-main-closeout)を完了します。

## 安定版の main 完了処理

`main` に実際にリリースされた状態が反映されるまで、安定版の公開は完了していません。

1. 最新状態に更新した新しい `main` から開始します。`release/YYYY.M.PATCH` と比較して監査し、`main` に存在しない実際の修正をフォワードポートします。リリース専用の互換性、テスト、または検証アダプターを、より新しい `main` に無条件でマージしないでください。
2. `main` を推測上の次期リリース系列ではなく、リリース済みの安定版バージョンに設定します。ルートのバージョン変更後に `pnpm release:prep` を実行し、その後 `pnpm deps:shrinkwrap:generate` を実行します。
3. `main` 上の `CHANGELOG.md` の `## YYYY.M.PATCH` セクションを、タグ付きリリースブランチと完全に一致させます。mac リリースで `appcast.xml` が公開された場合は、安定版の更新内容も含めます。
4. オペレーターがそのリリース系列を明示的に開始するまで、`YYYY.M.PATCH+1`、ベータバージョン、または空の将来用 changelog セクションを `main` に追加しないでください。
5. `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check`、`OPENCLAW_TESTBOX=1 pnpm check:changed` を実行します。プッシュ後、安定版リリースの完了を宣言する前に、`origin/main` にリリース済みバージョンと changelog が含まれていることを確認します。
6. 非公開のロールバック訓練を実施するたびに、リポジトリ変数 `RELEASE_ROLLBACK_DRILL_ID` と `RELEASE_ROLLBACK_DRILL_DATE` を最新の状態に保ちます。

`OpenClaw Stable Main Closeout` は、安定版公開後にリリース済みバージョン、changelog、appcast を反映した `main` へのプッシュから開始します。変更不能な公開後証跡を読み取り、リリース済みタグを Full Release Validation と Publish の実行に結び付けたうえで、安定版の main 状態、リリース、必須の安定版ソーク期間、ブロッキング対象のパフォーマンス証跡を検証します。変更不能な完了処理マニフェストとチェックサムを GitHub リリースに添付します。自動プッシュトリガーは、変更不能な公開後証跡より前の従来型リリースをスキップし、そのスキップを完了済みの完了処理として扱うことはありません。

完了した完了処理には、アセットと一致するチェックサムの両方が必要です。不完全なマニフェストは、記録済みの `main` SHA とロールバック訓練を再実行して同一のバイト列を再生成し、不足しているチェックサムを添付します。不正な組み合わせ、またはマニフェストを伴わないチェックサムは、引き続きブロッキング対象です。ロールバック訓練のリポジトリ変数がないプッシュトリガー実行は、完了処理を完了せずにスキップします。訓練記録が存在しない場合、または 90 日を超えて古い場合も、証跡に基づく手動完了処理を引き続きブロックします。非公開の復旧コマンドは、メンテナー専用ランブックに保持します。手動ディスパッチは、証跡に基づく安定版完了処理の修復または再実行にのみ使用してください。

従来型のフォールバック修正タグで基本パッケージの証跡を再利用できるのは、修正タグが基本安定版タグと同じソースコミットに解決される場合のみです。その Android リリースでは、基本タグの検証済み APK を再利用し、修正タグの来歴を追加します。ソースが異なる修正では、独自のパッケージ証跡を公開および検証し、より大きい Android `versionCode` を使用する必要があります。

## リリース事前検証

- リリースの事前確認前に `pnpm check:test-types` を実行し、高速なローカル `pnpm check` ゲートの対象外でもテスト用 TypeScript が検証されるようにします。
- リリースの事前確認前に `pnpm check:architecture` を実行し、高速なローカルゲートの対象外でも、より広範なインポートサイクルとアーキテクチャ境界のチェックが成功するようにします。
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、パック検証ステップに必要な `dist/*` リリース成果物と Control UI バンドルが存在するようにします。
- ルートのバージョンを更新した後、タグ付けする前に `pnpm release:prep` を実行します。これは、バージョン、設定、API の変更後に不整合が生じやすい、決定論的なリリース生成処理をすべて実行します。対象は、Plugin バージョン、npm shrinkwrap、Plugin インベントリ、基本設定スキーマ、同梱チャネル設定メタデータ、設定ドキュメントのベースライン、Plugin SDK エクスポート、Plugin SDK API ベースラインです。`pnpm release:check` は、これらのガードをチェックモードで再実行し（Plugin SDK サーフェスの予算チェックも含む）、パッケージのリリースチェックを実行する前に、生成物の不整合によるすべての失敗を一度に報告します。
- Plugin バージョン同期は、公開可能な `@openclaw/ai` ランタイムパッケージ、公式 Plugin パッケージのバージョン、および既存の `openclaw.compat.pluginApi` の下限を、デフォルトで OpenClaw のリリースバージョンに更新します。このフィールドは単なるパッケージバージョンのコピーではなく、Plugin SDK／ランタイム API の下限として扱ってください。古い OpenClaw ホストとの互換性を意図的に維持する Plugin 単体リリースでは、下限をサポート対象の最古のホスト API に保ち、その選択を Plugin のリリース証跡に記載します。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、単一のエントリポイントからすべてのリリース前テストボックスを開始します。ブランチ、タグ、または完全なコミット SHA を受け付け、手動の `CI` をディスパッチするとともに、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab の同等性、Matrix、Telegram の各レーン向けに `OpenClaw Release Checks` をディスパッチします。安定版およびフル実行では、網羅的なライブ／E2E と Docker リリースパスのソークテストが常に含まれます。`run_release_soak=true` は、明示的なベータ版ソークテスト用として維持されています。候補検証中の標準的なパッケージ Telegram E2E は Package Acceptance が提供するため、2つ目のライブポーラーを同時に実行せずに済みます。

  ベータ版の公開後に `release_package_spec` を指定すると、公開済みの npm パッケージを、リリースチェック、Package Acceptance、パッケージ Telegram E2E 全体で再利用でき、リリース tarball を再ビルドせずに済みます。Telegram だけで他のリリース検証とは異なる公開済みパッケージを使用する場合に限り、`npm_telegram_package_spec` を指定します。Package Acceptance でリリースパッケージ指定とは異なる公開済みパッケージを使用する場合は、`package_acceptance_package_spec` を指定します。Telegram E2E を強制せずに、検証が公開済み npm パッケージと一致することをリリース証跡レポートで証明する場合は、`evidence_package_spec` を指定します。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- リリース作業を継続しながら、パッケージ候補の別経路の証跡が必要な場合は、手動の `Package Acceptance` ワークフローを実行します。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使用します。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ／タグ／SHA をパックするには `source=ref`、必須の SHA-256 と厳格な公開 URL ポリシーを適用する公開 HTTPS tarball には `source=url`、必須の `trusted_source_id` と SHA-256 を使用する名前付きの信頼済みソースポリシーには `source=trusted-url`、別の GitHub Actions 実行によってアップロードされた tarball には `source=artifact` を使用します。

  このワークフローは候補を `package-under-test` として解決し、その tarball に対して Docker E2E リリーススケジューラーを再利用します。また、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` を指定すると、同じ tarball に対して Telegram QA を実行できます。選択した Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージ成果物が候補となり、`published_upgrade_survivor_baseline` が公開済みのベースラインを選択します。`update-restart-auth` は、候補パッケージをインストール済み CLI とテスト対象パッケージの両方として使用するため、候補の更新コマンドによる管理対象再起動パスを検証します。

  例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  一般的なプロファイル：
  - `smoke`：インストール／チャネル／エージェント、Gateway ネットワーク、設定リロードの各レーン
  - `package`：OpenWebUI やライブ ClawHub を使用しない、成果物ネイティブのパッケージ／更新／再起動／Plugin レーン
  - `product`：パッケージプロファイルに、MCP チャネル、Cron／サブエージェントのクリーンアップ、OpenAI ウェブ検索、OpenWebUI を追加
  - `full`：OpenWebUI を含む Docker リリースパスのチャンク
  - `custom`：対象を絞った再実行向けの正確な `docker_lanes` 選択

- リリース候補に対して決定論的な通常 CI の検証範囲だけが必要な場合は、手動の `CI` ワークフローを直接実行します。手動 CI のディスパッチは変更範囲による絞り込みを迂回し、Linux Node シャード、同梱 Plugin シャード、Plugin およびチャネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物のスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n の各レーンを強制的に実行します。単独の手動 CI 実行では、`include_android=true` を指定してディスパッチした場合に限り Android を実行します。`Full Release Validation` は、その CI 子ワークフローにこの入力を渡します。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- リリースのテレメトリを検証する場合は、`pnpm qa:otel:smoke` を実行します。ローカルの OTLP／HTTP レシーバーを介して QA Lab を実行し、Opik、Langfuse、その他の外部コレクターを必要とせずに、トレース、メトリクス、ログのエクスポート、制限されたトレース属性、コンテンツ／識別子の秘匿化を検証します。
- コレクターとの互換性を検証する場合は、`pnpm qa:otel:collector-smoke` を実行します。ローカルレシーバーのアサーションを実行する前に、同じ QA Lab の OTLP エクスポートを実際の OpenTelemetry Collector Docker コンテナ経由でルーティングします。
- 保護された Prometheus スクレイピングを検証する場合は、`pnpm qa:prometheus:smoke` を実行します。QA Lab を実行し、未認証のスクレイピングを拒否するとともに、リリース上重要なメトリクスファミリーに、プロンプト内容、生の識別子、認証トークン、ローカルパスが含まれないことを検証します。
- ソースチェックアウト向けの OpenTelemetry と Prometheus のスモークレーンを連続して実行するには、`pnpm qa:observability:smoke` を実行します。
- タグ付きリリースのたびに、その前に `pnpm release:check` を実行します。
- `OpenClaw NPM Release` の事前確認では、npm tarball をパックする前に依存関係のリリース証跡を生成します。npm アドバイザリの脆弱性ゲートはリリースをブロックします。推移的マニフェストのリスク、依存関係の所有権／インストールサーフェス、依存関係の変更レポートは、リリース証跡としてのみ使用されます。依存関係の変更レポートは、リリース候補を到達可能な直前のリリースタグと比較します。事前確認は依存関係の証跡を `openclaw-release-dependency-evidence-<tag>` としてアップロードし、準備済み npm 事前確認成果物内の `dependency-evidence/` にも埋め込みます。実際の公開パスはその事前確認成果物を再利用し、同じ証跡を `openclaw-<version>-dependency-evidence.zip` として GitHub リリースに添付します。
- タグが存在した後、変更を伴う公開シーケンスには `OpenClaw Release Publish` を実行します。通常のベータ版および安定版の公開は、信頼済みの `main` からディスパッチします。リリースタグは引き続き正確な対象コミットを選択し、`release/YYYY.M.PATCH` を指すこともできます。Tideclaw アルファ版の公開は、対応するアルファ版ブランチ上に維持します。成功した OpenClaw npm の `preflight_run_id`、成功した `full_release_validation_run_id`、正確な `full_release_validation_run_attempt` を渡し、対象を絞った修復を意図的に行う場合を除き、Plugin の公開範囲はデフォルトの `all-publishable` のままにします。このワークフローは、Plugin の npm 公開、Plugin の ClawHub 公開、OpenClaw の npm 公開を順番に実行し、外部化された Plugin より先にコアパッケージが公開されないようにします。Windows と Android の昇格は、ドラフトのリリースページを対象に、コア npm の公開と並行して実行されます。公開の再実行は再開可能です。コア npm バージョンがすでに公開済みの場合、ワークフローがレジストリの tarball とタグの事前確認成果物の一致を証明した後、コアのディスパッチをスキップします。また、リリースに検証済みの成果物契約がすでに含まれている場合は Windows／Android の昇格をスキップするため、再試行では失敗したステージだけを再実行します。対象を絞った Plugin 単体の修復では、`plugin_publish_scope=selected` と空でない Plugin リストが必要です。Plugin 単体の `all-publishable` 実行には、完全かつ不変の事前確認証跡と Full Release Validation 証跡が必要であり、部分的な証跡は拒否されます。
- 安定版の `OpenClaw Release Publish` では、対応する非プレリリースの `openclaw/openclaw-windows-node` リリースが存在した後に、正確な `windows_node_tag` と、候補で承認済みの `windows_node_installer_digests` マップが必要です。公開用の子ワークフローをディスパッチする前に、そのソースリリースが公開済みで、非プレリリースであり、必須の x64／ARM64 インストーラーを含み、承認済みマップと引き続き一致することを検証します。その後、OpenClaw リリースがまだドラフトの間に `Windows Node Release` をディスパッチし、固定されたインストーラーダイジェストマップを変更せずに渡します。子ワークフローは、その正確なタグから署名済み Windows Hub インストーラーをダウンロードし、固定されたダイジェストと照合します。Windows ランナー上で Authenticode 署名が想定される OpenClaw Foundation の署名者を使用していることを検証し、SHA-256 マニフェストを書き込み、インストーラーとマニフェストを正規の OpenClaw GitHub リリースにアップロードします。その後、昇格済み成果物を再ダウンロードし、マニフェストへの登録とハッシュを検証します。親ワークフローは、公開前に現在の x64、ARM64、チェックサム成果物の契約を検証します。直接復旧では、想定される契約成果物を固定されたソースバイトで置き換える前に、予期しない `OpenClawCompanion-*` 成果物名を拒否します。

  `Windows Node Release` を手動でディスパッチするのは復旧時に限り、常に正確なタグを渡してください。`latest` は使用せず、承認済みソースリリースの明示的な `expected_installer_digests` JSON マップも渡します。ウェブサイトのダウンロードリンクは、現在の安定版リリースにある正確な OpenClaw リリース成果物 URL を指すようにします。または、GitHub の latest リダイレクトが同じリリースを指すことを検証した後に限り、`releases/latest/download/...` を使用します。コンパニオンリポジトリのリリースページだけにリンクしないでください。

- リリースチェックは、独立した手動ワークフロー `OpenClaw Release Checks` で実行されるようになりました。リリース承認前に、QA Lab モック同等性レーン、高速なライブ Matrix プロファイル、Telegram QA レーンも実行します。ライブレーンでは `qa-live-shared` 環境を使用し、Telegram では Convex CI 認証情報リースも使用します。Matrix のトランスポート、メディア、E2EE の全インベントリを並列で実行する場合は、手動の `QA-Lab - All Lanes` ワークフローを `matrix_profile=all` および `matrix_shards=true` で実行してください。
- OS 横断のインストールおよびアップグレードのランタイム検証は、公開ワークフロー `OpenClaw Release Checks` と `Full Release Validation` の一部であり、これらは再利用可能なワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出します。この分離は意図的なものです。実際の npm リリース経路は短く、決定論的で、アーティファクトに集中させる一方、時間のかかるライブチェックは独自のレーンに配置し、公開処理を停滞またはブロックしないようにします。
- シークレットを使用するリリースチェックは、ワークフローのロジックとシークレットを管理下に保つため、`Full Release Validation` 経由、または `main`/リリースのワークフロー参照からディスパッチする必要があります。
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw のブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付けます。
- `OpenClaw NPM Release` の検証専用プリフライトでは、プッシュ済みタグを要求せず、現在のワークフローブランチの完全な 40 文字のコミット SHA も受け付けます。この SHA 経路は検証専用であり、実際の公開に昇格することはできません。SHA モードでは、パッケージメタデータのチェック専用に `v<package.json version>` を合成しますが、実際の公開には引き続き実在するリリースタグが必要です。
- どちらのワークフローでも、実際の公開と昇格の経路は GitHub ホストランナー上に維持し、変更を加えない検証経路では、より大規模な Blacksmith Linux ランナーを使用できます。
- このワークフローは、ワークフローシークレット `OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方を使用して、`OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行します。
- npm リリースのプリフライトは、独立したリリースチェックレーンを待たなくなりました。
- ローカルでリリース候補にタグを付ける前に、`RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` を実行してください。このヘルパーは、高速なリリースガードレール、Plugin の npm/ClawHub リリースチェック、ビルド、UI ビルド、`release:openclaw:npm:check` を、GitHub の公開ワークフロー開始前に承認をブロックしがちな一般的なミスを検出できる順序で実行します。
- 承認前に、`RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（または対応するプレリリース/修正版タグ）を実行してください。
- npm への公開後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（または対応するベータ/修正版バージョン）を実行し、新しい一時プレフィックス内で公開済みレジストリからのインストール経路を検証してください。
- ベータ版の公開後、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行し、共有のリース式 Telegram 認証情報プールを使用して、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram のセットアップ、実際の Telegram E2E を検証してください。メンテナーがローカルで一度だけ実行する場合は、Convex の変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` 環境認証情報を直接渡すこともできます。
- メンテナーのマシンから公開後の完全なベータスモークテストを実行するには、`pnpm release:beta-smoke -- --beta betaN` を使用してください。このヘルパーは、Parallels での npm 更新/新規ターゲット検証を実行し、`NPM Telegram Beta E2E` をディスパッチし、該当するワークフロー実行をポーリングし、アーティファクトをダウンロードして、Telegram レポートを出力します。
- メンテナーは、手動の `NPM Telegram Beta E2E` ワークフローを使用して、GitHub Actions から同じ公開後チェックを実行できます。これは意図的に手動専用であり、マージのたびには実行されません。
- メンテナー向けリリース自動化では、プリフライト後に昇格する方式を使用します。
  - 実際の npm 公開には、成功した npm の `preflight_run_id` が必要です。
  - 通常のベータ版および安定版の公開オーケストレーションとプリフライトでは、正確な対象タグに対して信頼済みの `main` を使用します。Tideclaw のアルファ版の公開とプリフライトでは、対応するアルファブランチを使用します。
  - 安定版の npm リリースはデフォルトで `beta` になります。安定版の npm 公開では、ワークフロー入力によって明示的に `latest` を指定できます。
  - トークンベースの npm dist-tag 変更は `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` にあります。これは、ソースリポジトリでは OIDC のみの公開を維持する一方で、`npm dist-tag add` には引き続き `NPM_TOKEN` が必要なためです。
  - 公開の `macOS Release` は検証専用です。タグがリリースブランチにのみ存在し、ワークフローを `main` からディスパッチする場合は、`public_release_branch=release/YYYY.M.PATCH` を設定してください。
  - 実際の macOS 公開には、成功した macOS の `preflight_run_id` と `validate_run_id` が必要です。
  - 実際の公開経路では、再度ビルドするのではなく、準備済みのアーティファクトを昇格します。
- `YYYY.M.PATCH-N` のような安定版の修正リリースでは、公開後検証ツールが、`YYYY.M.PATCH` から `YYYY.M.PATCH-N` への同じ一時プレフィックス内でのアップグレード経路も確認します。これにより、リリース修正後も古いグローバルインストールが基準となる安定版のペイロードに残る事態を防ぎます。
- npm リリースのプリフライトは、tarball に `dist/control-ui/index.html` と空ではない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り、安全側に倒して失敗します。これにより、空のブラウザーダッシュボードを再び出荷することを防ぎます。
- 公開後検証では、公開済み Plugin のエントリーポイントとパッケージメタデータが、インストール済みのレジストリレイアウトに存在することも確認します。Plugin のランタイムペイロードが欠落したリリースは、公開後検証に失敗し、`latest` に昇格できません。
- `pnpm test:install:smoke` は、更新候補の tarball に対して npm pack の `unpackedSize` 上限も適用します。これにより、インストーラー E2E が、リリース公開経路に入る前に意図しないパッケージサイズの肥大化を検出します。
- リリース作業で CI 計画、拡張機能のタイミングマニフェスト、または拡張機能のテストマトリクスに変更を加えた場合は、承認前に `.github/workflows/plugin-prerelease.yml` から、プランナーが所有する `plugin-prerelease-extension-shard` マトリクス出力を再生成して確認してください。これにより、リリースノートに古い CI レイアウトが記載されることを防ぎます。
- 安定版 macOS リリースの準備状況には、アップデーター関連のサーフェスも含まれます。GitHub リリースには最終的にパッケージ済みの `.zip`、`.dmg`、`.dSYM.zip` が含まれている必要があります。公開後、`main` 上の `appcast.xml` は新しい安定版 zip を参照する必要があります（macOS 公開ワークフローが自動的にコミットするか、直接プッシュがブロックされている場合は appcast PR を作成します）。パッケージ済みアプリでは、デバッグ用ではないバンドル ID、空ではない Sparkle フィード URL、およびそのリリースバージョンの標準的な Sparkle ビルド下限以上の `CFBundleVersion` を維持する必要があります。

## リリーステストボックス

`Full Release Validation` は、オペレーターがすべてのリリース前テストを 1 つのエントリーポイントから開始するための方法です。変化の速いブランチ上で固定コミットの証明を得る場合は、ヘルパーを使用してください。これにより、要求したコミットをテスト対象候補として維持しながら、すべての子ワークフローが、信頼済みの単一の `main` ワークフロー SHA に固定された一時ブランチから実行されます。

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは、現在の `origin/main` をフェッチし、信頼済みのワークフローコミット上に `release-ci/<workflow-sha>-...` をプッシュし、一時ブランチから `ref=<target-sha>` を指定して `Full Release Validation` をディスパッチします。利用可能な場合は厳密に対象が一致する既存の証拠を再利用し、各子ワークフローの `headSha` が固定された親ワークフロー SHA と一致することを検証した後、一時ブランチを削除します。新規実行を強制するには `-f reuse_evidence=false` を渡し、現在の `origin/main` から引き続き到達可能な古いコミットに固定するには `--workflow-sha <trusted-main-sha>` を渡します。ワークフロー自体がリポジトリ参照を書き換えることはありません。これにより、候補にツール用コミットを追加せずに `main` 専用のリリースツールを利用でき、誤って新しい `main` の子実行を証拠にすることを回避できます。

リリースブランチまたはタグを検証する場合は、信頼済みの `main` ワークフロー参照から実行し、リリースブランチまたはタグを `ref` として渡してください。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

このワークフローは対象参照を解決し、`target_ref=<release-ref>` を指定して手動の `CI` をディスパッチした後、`OpenClaw Release Checks` をディスパッチします。`OpenClaw Release Checks` は、インストールスモーク、OS 横断リリースチェック、ソークが有効な場合のライブ/E2E Docker リリース経路カバレッジ、標準的な Telegram パッケージ E2E を含むパッケージ受け入れテスト、QA Lab 同等性、ライブ Matrix、ライブ Telegram を並列展開します。完全/全実行が許容されるのは、個別の `Plugin Prerelease` 子ワークフローを意図的にスキップした限定的な再実行を除き、`Full Release Validation` のサマリーで `normal_ci`、`plugin_prerelease`、`release_checks` が成功と表示される場合に限られます。単独の `npm-telegram` 子ワークフローは、`release_package_spec` または `npm_telegram_package_spec` を指定して、公開済みパッケージに対する限定的な再実行を行う場合にのみ使用してください。最終検証サマリーには各子実行の所要時間が長いジョブの表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。

このリリース経路では、製品パフォーマンスの子ワークフローはアーティファクト専用です。統括ワークフローは `publish_reports=false` を指定してこれをディスパッチし、アーティファクト専用ガードによって Clawgrit レポート公開処理がスキップされたことが証明されない限り、検証は拒否されます。

完全なステージマトリクス、正確なワークフロージョブ名、安定版プロファイルと完全版プロファイルの違い、アーティファクト、限定的な再実行の操作方法については、[完全なリリース検証](/ja-JP/reference/full-release-validation)を参照してください。

子ワークフローは、対象の `ref` が古いリリースブランチまたはタグを指している場合でも、`Full Release Validation` を実行する信頼済みの参照（通常は `--ref main`）からディスパッチされます。すべての子実行は、親ワークフローと完全に同じ SHA を使用する必要があります。子ワークフローのディスパッチが解決される前に `main` が進んだ場合、統括ワークフローは安全側に倒して失敗します。`Full Release Validation` 用の独立したワークフロー参照入力はありません。ワークフロー実行参照を選択することで、信頼済みのハーネスを選択します。変化する `main` 上で正確なコミットを証明するために `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ参照にできないため、`pnpm ci:full-release --sha <target-sha>` を使用し、対象 SHA を候補入力として維持しながら、信頼済みの `origin/main` 上に一時ブランチを作成してください。

ライブ/プロバイダーの範囲を選択するには、`release_profile` を使用します。

- `minimum`: リリースに不可欠な最速の OpenAI/コアのライブおよび Docker 経路
- `stable`: 最小構成に加え、リリース承認に必要な安定版プロバイダー/バックエンドのカバレッジ
- `full`: 安定版構成に加え、広範な参考用プロバイダー/メディアのカバレッジ

安定版および完全版の検証では、昇格前に、網羅的なライブ/E2E、Docker リリース経路、上限付きの公開済みアップグレード生存確認スイープを常に実行します。ベータ版で同じスイープを要求するには、`run_release_soak=true` を使用してください。このスイープは、最新 4 つの安定版パッケージに加えて、固定された基準バージョン `2026.4.23` と `2026.5.2`、さらに古い `2026.4.15` のカバレッジを対象とします。重複する基準バージョンは除外され、各基準バージョンは個別の Docker ランナージョブに分割されます。

`OpenClaw Release Checks` は、信頼済みのワークフロー参照を使用して対象参照を一度だけ `release-package-under-test` として解決し、ソーク実行時には OS 横断、パッケージ受け入れ、リリース経路の Docker チェックでそのアーティファクトを再利用します。これにより、パッケージを扱うすべてのテストボックスが同じバイト列を使用し、パッケージの繰り返しビルドを回避できます。ベータ版がすでに npm に公開されている場合は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を設定してください。これにより、リリースチェックは出荷済みパッケージを一度だけダウンロードし、`dist/build-info.json` からビルド元の SHA を抽出して、そのアーティファクトを OS 横断、パッケージ受け入れ、リリース経路の Docker、パッケージ Telegram の各レーンで再利用します。

OS 横断の OpenAI インストールスモークでは、リポジトリ/組織変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.6-luna` を使用します。このレーンの目的は、最も高性能なモデルのベンチマークではなく、パッケージのインストール、オンボーディング、Gateway の起動、1 回のライブエージェントターンを証明することだからです。モデル固有のカバレッジは、引き続き、より広範なライブプロバイダーマトリクスで扱います。

リリース段階に応じて、次のバリエーションを使用してください。

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

限定的な修正後の最初の再実行に、包括的な全体ワークフローを使用しないでください。1つのボックスが失敗した場合、次の検証には、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用してください。修正によって共有リリースオーケストレーションが変更された場合、または以前の全ボックスのエビデンスが古くなった場合に限り、包括的な全体ワークフローを再度実行してください。全体ワークフローの最終検証処理は、記録された子ワークフローの実行 ID を再確認するため、子ワークフローの再実行が成功した後は、失敗した親ジョブ `Verify full validation` のみを再実行してください。

`rerun_group=all` で以前に成功した全体ワークフローの実行を再利用できるのは、まったく同じ対象 SHA、リリースプロファイル、実効的な長時間検証設定、および検証入力を検証した場合に限られます。これは同じ候補を再実行するための限定的な復旧であり、異なる SHA 間でのエビデンス再利用ではありません。変更履歴またはバージョンのみのコミットを含め、候補が変更された場合は、変更されたパスまたはアーティファクトハッシュの影響を受けるすべてのパッケージ、アーティファクト、インストール、Docker、またはプロバイダーゲートを再実行してください。同じ `release/*`
ref と再実行グループに対する新しい全体ワークフローの実行は、進行中の実行を自動的に置き換えます。完全に新規の実行を強制するには、
`reuse_evidence=false` を渡してください。

限定的な復旧では、全体ワークフローに `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子ワークフローのみ、`plugin-prerelease` はリリース専用の Plugin 子ワークフローのみ、`release-checks` はすべてのリリースボックスを実行し、より限定的なリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。限定的な `npm-telegram` の再実行には `release_package_spec` または `npm_telegram_package_spec` が必要です。full/all の実行では、Package Acceptance 内の標準パッケージ Telegram E2E を使用します。限定的なクロス OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS／スイートフィルターを追加できます。QA リリースチェックの失敗は、標準階層で必須となる OpenClaw 動的ツールのドリフトを含め、通常のリリース検証をブロックします。Tideclaw アルファの実行では、パッケージ安全性に関係しないリリースチェックレーンを引き続き参考扱いにできます。`release_profile=beta` の場合、`Run repo/live E2E validation` のライブプロバイダースイートは参考扱いです（警告のみで、ブロッカーではありません）。stable および full プロファイルでは、引き続きブロッカーとなります。`live_suite_filter` で Discord、WhatsApp、Slack などのゲート付き QA ライブレーンを明示的に要求する場合、対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` リポジトリ変数を有効にする必要があります。有効でない場合、レーンを暗黙的にスキップせず、入力の取り込みが失敗します。

### Vitest

Vitest ボックスは、手動の `CI` 子ワークフローです。手動 CI は意図的に変更範囲による絞り込みを回避し、リリース候補に対して通常のテストグラフを強制します。対象には、Linux Node シャード、同梱 Plugin シャード、Plugin およびチャネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトのスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI の i18n が含まれます。`Full Release Validation` がこのボックスを実行する場合、全体ワークフローが `include_android=true` を渡すため Android も含まれます。単独の手動 CI で Android を対象にするには、`include_android=true` が必要です。

このボックスは「ソースツリーが通常の全テストスイートを通過したか」に答えるために使用します。これは、リリース経路の製品検証とは異なります。保持するエビデンスは次のとおりです。

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` の概要
- 正確な対象 SHA で成功した `CI` 実行
- リグレッション調査時の、CI ジョブで失敗した、または低速だったシャード名
- 実行のパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定論的な通常 CI が必要である一方、Docker、QA Lab、ライブ、クロス OS、またはパッケージの各ボックスが不要な場合に限り、手動 CI を直接実行してください。Android を含まない直接 CI には最初のコマンドを使用します。直接実行するリリース候補 CI で Android も対象にする必要がある場合は、`include_android=true` を追加してください。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` を介して `OpenClaw Release Checks` 内に存在し、さらにリリースモードの `install-smoke` ワークフローにも含まれます。ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリースの Docker 対象範囲には、次が含まれます。

- 低速な Bun グローバルインストールスモークを有効にした完全インストールスモーク
- 対象 SHA ごとのルート Dockerfile スモークイメージの準備／再利用。QR、root／Gateway、インストーラー／Bun の各スモークジョブは、個別の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリース経路の Docker チャンク：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`、および `openwebui`
- 要求された場合の、大容量ディスク専用ランナー上での OpenWebUI 対象範囲
- 分割された同梱 Plugin のインストール／アンインストールレーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- リリースチェックにライブスイートが含まれる場合の、ライブ／E2E プロバイダースイートおよび Docker ライブモデルの対象範囲

再実行する前に Docker アーティファクトを使用してください。リリース経路スケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズのタイミング、スケジューラー計画 JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。限定的な復旧では、すべてのリリースチャンクを再実行する代わりに、再利用可能なライブ／E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用してください。生成される再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージの入力が含まれるため、失敗したレーンで同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは、Vitest および Docker のパッケージ機構とは別の、エージェント動作とチャネルレベルのリリースゲートです。

リリースの QA Lab 対象範囲には、次が含まれます。

- エージェント型パリティパックを使用して、OpenAI 候補レーンと `anthropic/claude-opus-4-8` ベースラインを比較するモックパリティレーン
- `qa-live-shared` 環境を使用する高速ライブ Matrix QA プロファイル
- Convex CI 認証情報リースを使用するライブ Telegram QA レーン
- リリーステレメトリーに明示的なローカル検証が必要な場合の `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke`、または `pnpm qa:observability:smoke`

このボックスは「リリースが QA シナリオおよびライブチャネルフローで正しく動作するか」に答えるために使用します。リリースを承認する際は、パリティ、Matrix、Telegram の各レーンのアーティファクト URL を保持してください。Matrix の完全な対象範囲は、既定のリリース必須レーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージボックスは、インストール可能な製品のゲートです。`Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。リゾルバーは候補を Docker E2E が使用する `package-under-test` tarball に正規化し、パッケージの内容一覧を検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネスの ref をパッケージソースの ref から分離して保持します。

対応する候補ソースは次のとおりです。

- `source=npm`：`openclaw@beta`、`openclaw@latest`、または OpenClaw の正確なリリースバージョン
- `source=ref`：選択した `workflow_ref` ハーネスを使用して、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパック
- `source=url`：必須の `package_sha256` を指定して、公開 HTTPS `.tgz` をダウンロード。URL の認証情報、既定以外の HTTPS ポート、プライベート／内部／特殊用途のホスト名または解決先アドレス、安全でないリダイレクトは拒否
- `source=trusted-url`：必須の `package_sha256` と `.github/package-trusted-sources.json` 内の名前付きポリシーに対応する `trusted_source_id` を指定して、HTTPS `.tgz` をダウンロード。`source=url` に入力レベルのプライベートネットワーク迂回機能を追加するのではなく、メンテナーが所有するエンタープライズミラーまたはプライベートパッケージリポジトリに使用
- `source=artifact`：別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` を指定して Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、移行、更新、root 管理 VPS のアップグレード、設定済み認証情報を使用する更新後の再起動、ライブ ClawHub Skills のインストール、古い Plugin 依存関係のクリーンアップ、オフライン Plugin フィクスチャ、Plugin の更新、Plugin コマンドバインディングのエスケープ強化、Telegram パッケージ QA を維持します。ブロッキング対象のリリースチェックでは、既定で最新の公開済みパッケージをベースラインとして使用します。`run_release_soak=true` を指定した beta プロファイル、`release_profile=stable`、または `release_profile=full` では、公開済みアップグレード生存性スイープを `last-stable-4` に加えて、固定された `2026.4.23`、`2026.5.2`、`2026.4.15` の各ベースラインと `reported-issues` シナリオまで拡張します。すでに公開済みの候補には `source=npm`、公開前の SHA に基づくローカル npm tarball には `source=ref`、メンテナーが所有するエンタープライズ／プライベートミラーには `source=trusted-url`、別の GitHub Actions 実行がアップロードした準備済み tarball には `source=artifact` を指定して Package Acceptance を使用してください。

これは、以前は Parallels が必要だったパッケージ／更新の対象範囲の大部分を置き換える、GitHub ネイティブの仕組みです。OS 固有のオンボーディング、インストーラー、プラットフォーム動作については、クロス OS リリースチェックが引き続き重要ですが、パッケージ／更新の製品検証には Package Acceptance を優先してください。

更新および Plugin 検証の標準チェックリストは、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)です。Plugin のインストール／更新、doctor によるクリーンアップ、または公開済みパッケージの移行変更を、ローカル、Docker、Package Acceptance、リリースチェックのどのレーンで検証するかを判断する際に使用してください。すべての安定版 `2026.4.23+` パッケージからの公開済み更新移行を網羅的に検証する処理は、個別の手動 `Update Migration` ワークフローであり、Full Release CI には含まれません。

従来の package-acceptance の許容措置には、意図的に期限が設けられています。`2026.4.25` までのパッケージでは、すでに npm に公開されているメタデータ不足について、互換性経路を使用できます。対象は、tarball に含まれていないプライベート QA 内容一覧の項目、欠落している `gateway install --wrapper`、tarball 由来の git フィクスチャに含まれていないパッチファイル、永続化された `update.channel` の欠落、従来の Plugin インストール記録の場所、マーケットプレイスのインストール記録の永続化欠落、`plugins update` 中の設定メタデータ移行です。公開済みの `2026.4.26` パッケージでは、すでに出荷されたローカルビルドメタデータのスタンプファイルについて警告を許容できます。それ以降のパッケージは、現在のパッケージ契約を満たす必要があります。同じ不足がある場合、リリース検証は失敗します。

リリースに関する確認対象が実際にインストール可能なパッケージである場合は、より広範な Package Acceptance プロファイルを使用してください。

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

一般的なパッケージプロファイル：

- `smoke`: パッケージのクイックインストール、チャンネル/エージェント、Gateway ネットワーク、設定再読み込みの各レーン
- `package`: インストール/更新/再起動/Plugin パッケージの契約に加え、実環境での ClawHub skill インストール証明。これはリリースチェックのデフォルト
- `product`: `package` に加え、MCP チャンネル、Cron/サブエージェントのクリーンアップ、OpenAI Web 検索、OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスのチャンク
- `custom`: 対象を絞った再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または `telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの `package-under-test` tarball を Telegram レーンに渡します。単独の Telegram ワークフローでは、公開後チェック用に公開済みの npm spec も引き続き受け付けます。

## 通常リリースの公開自動化

ベータ、`latest`、Plugin、GitHub Release、プラットフォームへの公開では、
`OpenClaw Release Publish` が通常の変更を伴うエントリーポイントです。毎月の
`.33+` npm 専用 extended-stable パスでは、このオーケストレーターを使用しません。
通常のワークフローは、リリースで必要となる順序で trusted-publisher ワークフローを
オーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*`（alpha プレリリースの場合は Tideclaw alpha ブランチも可）から到達可能であることを検証します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` および `ref=<release-sha>` を指定して `Plugin NPM Release` をディスパッチします。
5. 同じスコープと SHA で `Plugin ClawHub Release` をディスパッチします。
6. 保存済みの `full_release_validation_run_id` と正確な実行試行番号を検証した後、リリースタグ、npm dist-tag、保存済みの `preflight_run_id` を指定して `OpenClaw NPM Release` をディスパッチします。
7. 安定版リリースでは、GitHub リリースをドラフトとして作成または更新し、明示的な `windows_node_tag` と候補として承認済みの `windows_node_installer_digests` を指定して `Windows Node Release` をディスパッチし、正規の Windows インストーラー/チェックサム資産を検証します。また、`Android Release` をディスパッチして、正確なタグの署名済み APK、チェックサム、来歴情報をビルドします。ドラフトを公開する前に、両方のネイティブ資産の契約を検証します。

ベータ公開の例:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

デフォルトの beta dist-tag への安定版公開:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

`latest` への安定版の直接昇格は明示的に行います。

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

下位レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、対象を絞った修復または再公開作業にのみ使用してください。`OpenClaw Release Publish` は、`publish_openclaw_npm=true` の場合に `plugin_publish_scope=selected` を拒否します。これにより、`@openclaw/diffs-language-pack` を含む公開可能なすべての公式 Plugin なしでコアパッケージがリリースされることを防ぎます。選択した Plugin の修復では、`plugin_publish_scope=selected` および `plugins=@openclaw/name` とともに `publish_openclaw_npm=false` を設定するか、子ワークフローを直接ディスパッチします。

ClawHub の初回公開ブートストラップは例外です。信頼済みの `main` から `Plugin ClawHub New`
をディスパッチし、完全な対象リリース SHA を `ref` で渡します。
ブートストラップワークフロー自体をリリースタグまたはブランチから実行しないでください。

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

タグ作成前の検証では `dry_run=true` が必須であり、リリースタグおよび親実行の入力を
拒否し、`main` または `release/*` から到達可能な正確な対象のみを受け付けます。
ClawHub の認証情報を読み込まず、パッケージバイトを公開せず、trusted
publisher の設定も変更しません。それでもワークフローは実レジストリの計画を解決し、
シークレットのないジョブでのみ対象をチェックアウトしてパックし、ロック済みの
ClawHub ツールチェーンを具体化し、リリースタグが存在する前に不変の成果物とパッケージの
スラッグ/アイデンティティを検証します。シークレットのないパックジョブが完了した後にのみ、
`clawhub-plugin-bootstrap` 環境を承認してください。この保護された検証ジョブには、
認証情報も変更コマンドもありません。

承認済みのドライラン、またはタグ作成後の実際のブートストラップには、正確な
リリースタグに加えて、親 `OpenClaw Release Publish` の実行 ID、試行番号、ブランチを
含める必要があります。親は自身のワークフロー SHA と、`Plugin ClawHub New` 用の
別個の正確な信頼済み `main` SHA を証明します。子実行および保護された環境のすべての
承認は、その承認済み子 SHA と一致する必要があります。リリースタグは、公開試行および
trusted-publisher の変更ごとに再検証されます。

パックジョブは、名前、Actions 成果物 ID/ダイジェスト、
生成元の実行/試行、対象 SHA、パッケージごとの tarball SHA-256/サイズが
検証ジョブと保護ジョブに引き継がれる、単一の不変成果物をアップロードします。
保護ジョブは信頼済みの `main` ツールのみをチェックアウトし、GitHub API を通じて
成果物タプルを検証し、正確な成果物 ID でダウンロードし、すべての tarball を再ハッシュし、
固定された CLI の USTAR 正規化ルールによりローカル TAR パスと
パッケージアイデンティティを検証します。その後、各候補は固定された CLI の公開ドライランを
通過します。このドライランは、レジストリの参照または認証の前に終了します。認証情報ジョブの
事前フィルターは、圧縮済み ClawPacks を 120 MiB、ファイルペイロード合計を 50 MiB、
展開済み TAR データを 64 MiB、TAR エントリ数を 10,000 に制限します。
既存パッケージの trusted-publisher 修復は引き続き設定変更のみに限定されますが、
それでも対象をパックし、trusted-publisher 設定を変更する前に、要求されたタグと
正確なレジストリバイトおよびメタデータの一致が必要です。公開後の検証では ClawHub 成果物を
ダウンロードし、同じ SHA-256 とサイズであることを要求します。失敗した実行の再実行による
復旧では、正確な生成元ジョブが正常に完了した場合に限り、以前の試行のパッケージ成果物を
再利用できます。最終証拠には、ロック済みの ClawHub バージョン、ロック SHA-256、
npm integrity も紐付けられます。不一致がある場合は、新しいパッケージバージョンが必要です。

## NPM ワークフローの入力

`OpenClaw NPM Release` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1`、`v2026.4.2-alpha.1` などの必須リリースタグ。`preflight_only=true` の場合、検証専用の事前確認用として、現在のワークフローブランチの完全な 40 文字のコミット SHA も指定できます
- `preflight_only`: 検証/ビルド/パッケージ化のみの場合は `true`、実際の公開パスでは `false`
- `preflight_run_id`: 既存の成功した事前確認実行 ID。実際の公開パスでは必須であり、ワークフローは再ビルドせず、準備済みの tarball を再利用します
- `full_release_validation_run_id`: このタグ/SHA に対して成功した `Full Release Validation` の実行 ID。実際の公開では必須です。ベータ公開は警告付きで事前確認のみでも続行できますが、安定版/`latest` への昇格では引き続き必須です。
- `full_release_validation_run_attempt`: `full_release_validation_run_id` と組み合わせる正確な正の実行試行番号。再実行によって公開中の認可証拠を変更できないようにするため、実行 ID を指定する場合は常に必須です。
- `release_publish_run_id`: 承認済みの `OpenClaw Release Publish` 実行 ID。このワークフローがその親からディスパッチされる場合（bot actor による実際の公開呼び出し）に必須です
- `plugin_npm_run_id`: 成功した正確な HEAD の `Plugin NPM Release` 実行 ID。実際の `extended-stable` コア公開に必須です
- `npm_dist_tag`: 公開パスの npm 対象タグ。`alpha`、`beta`、`latest`、`extended-stable` を受け付け、デフォルトは `beta` です。最終パッチ `33` 以降では `extended-stable` を使用する必要があります。デフォルトでは、`extended-stable` はそれ以前のパッチを拒否し、非最終タグは常に拒否します。
- `bypass_extended_stable_guard`: テスト専用のブール値で、デフォルトは `false`。`npm_dist_tag=extended-stable` の場合、リリースアイデンティティ、成果物、承認、読み戻しの各チェックを維持しつつ、毎月の extended-stable 適格性を回避します。

`Plugin NPM Release` は、既存のリリース動作には `npm_dist_tag=default`、
保護された毎月のパスには `npm_dist_tag=extended-stable` を受け付けます。
extended-stable オプションでは、`publish_scope=all-publishable`、空の
`plugins` 入力、`33` 以上の最終パッチ、正確な先端にある正規の
`extended-stable/YYYY.M.33` ブランチが必要です。このオプションが Plugin の
`latest` または `beta` を移動することはありません。新しいパッケージバージョンには、
OIDC trusted publication（`npm publish --tag extended-stable`）を通じて
`extended-stable` が不可分に付与されます。このソースワークフローは、トークン認証による
`npm dist-tag add` を使用しません。再試行では、npm にすでに存在する正確なバージョンを
スキップし、すべての正確なパッケージと `extended-stable` タグが収束したことを完全な
読み戻しで確認できない限り、安全側に失敗します。

`OpenClaw Release Publish` は、オペレーターが制御する次の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` の事前確認実行 ID。`publish_openclaw_npm=true` または `plugin_publish_scope=all-publishable` の場合に必須です
- `full_release_validation_run_id`: 成功した `Full Release Validation` の実行 ID。`publish_openclaw_npm=true` または `plugin_publish_scope=all-publishable` の場合に必須です
- `full_release_validation_run_attempt`: `full_release_validation_run_id` と組み合わせる正確な正の試行番号。実行 ID を指定する場合は常に必須です
- `windows_node_tag`: 正確な非プレリリースの `openclaw/openclaw-windows-node` リリースタグ。OpenClaw の安定版公開に必須です
- `windows_node_installer_digests`: 現在の Windows インストーラー名と固定された `sha256:` ダイジェストを対応付ける、候補として承認済みのコンパクトな JSON マップ。OpenClaw の安定版公開に必須です
- `npm_telegram_run_id`: 最終リリース証拠に含める、省略可能な成功済み `NPM Telegram Beta E2E` 実行 ID
- `npm_dist_tag`: OpenClaw パッケージの npm 対象タグ。`alpha`、`beta`、`latest` のいずれか
- `plugin_publish_scope`: デフォルトは `all-publishable`。`selected` は、`publish_openclaw_npm=false` を使用する対象を絞った Plugin 専用修復作業にのみ使用します
- `plugins`: `plugin_publish_scope=selected` の場合に指定する、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin 専用修復オーケストレーターとして使用する場合にのみ `false` に設定します
- `release_profile`: リリース証拠の要約に使用するリリースカバレッジプロファイル。デフォルトは、検証マニフェストから読み取る `from-validation` です。または、`beta`、`stable`、`full` で上書きできます
- `wait_for_clawhub`: デフォルトは `false` で、npm の利用可能化が ClawHub サイドカーによってブロックされないようにします。ワークフローの完了に ClawHub の完了も含める必要がある場合にのみ `true` に設定します

`OpenClaw Release Checks` は、オペレーターが制御する次の入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを使用するチェックでは、解決されたコミットが OpenClaw のブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: ベータリリースチェックで、網羅的な実環境/E2E、Docker リリースパス、および過去の全バージョンからのアップグレード生存性の長時間検証を有効にします。`release_profile=stable` および `release_profile=full` では強制的に有効になります。

ルール:

- パッチ `33` 未満の通常の正式版および修正版は、`beta` または `latest` のいずれにも公開できます。パッチ `33` 以上の正式版は `extended-stable` に公開する必要があり、その境界にある修正サフィックス付きバージョンは拒否されます。
- ベータプレリリースタグは `beta` にのみ、アルファプレリリースタグは `alpha` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA の入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、事前検証時に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは公開を続行する前に、そのメタデータを検証します

## 通常の beta/latest 安定版リリース手順

この従来の手順は、plugins、GitHub Release、Windows、およびその他のプラットフォーム作業も担う、通常のオーケストレーションされたリリース向けです。このページの冒頭で説明している、毎月の `.33+` npm 専用 extended-stable パスではありません。

通常のオーケストレーションされた安定版リリースを作成する場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します。タグが存在する前は、事前検証ワークフローの検証専用ドライランに、現在の完全なワークフローブランチのコミット SHA を使用できます。
2. 通常のベータ先行フローでは `npm_dist_tag=beta` を選択し、意図的に安定版へ直接公開する場合にのみ `latest` を選択します。
3. 1 つの手動ワークフローで通常の CI に加えて、ライブプロンプトキャッシュ、Docker、QA Lab、Matrix、および Telegram を網羅したい場合は、リリースブランチ、リリースタグ、または完全なコミット SHA に対して `Full Release Validation` を実行します。意図的に決定論的な通常のテストグラフだけが必要な場合は、代わりにリリース参照に対して手動の `CI` ワークフローを実行します。
4. 署名済みの x64 および ARM64 インストーラーを出荷する、正確な非プレリリースの `openclaw/openclaw-windows-node` リリースタグを選択します。これを `windows_node_tag` として保存し、検証済みのダイジェストマップを `windows_node_installer_digests` として保存します。リリース候補ヘルパーは両方を記録し、生成する公開コマンドに含めます。
5. 成功した `preflight_run_id`、`full_release_validation_run_id`、および正確な `full_release_validation_run_attempt` を保存します。
6. 信頼された `main` から、同じ `tag`、同じ `npm_dist_tag`、選択した `windows_node_tag`、保存した `windows_node_installer_digests`、保存した `preflight_run_id`、`full_release_validation_run_id`、および `full_release_validation_run_attempt` を指定して `OpenClaw Release Publish` を実行します。OpenClaw npm パッケージを昇格する前に、外部化された plugins を npm と ClawHub に公開します。
7. リリースが `beta` に公開された場合は、`openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その安定版を `beta` から `latest` に昇格します。
8. リリースを意図的に `latest` へ直接公開し、`beta` も直ちに同じ安定版ビルドに追従させる必要がある場合は、同じリリースワークフローを使用して両方の dist-tag がその安定版を指すようにするか、スケジュールされた自己修復同期によって後から `beta` を移動させます。

dist-tag の変更は、引き続き `NPM_TOKEN` が必要なため、リリース台帳リポジトリに置かれています。一方、ソースリポジトリでは OIDC のみの公開を維持しています。これにより、直接公開パスとベータ先行の昇格パスの両方が文書化され、運用担当者から確認できる状態に保たれます。

メンテナーがローカルの npm 認証にフォールバックする必要がある場合、1Password CLI (`op`) コマンドは必ず専用の tmux セッション内で実行してください。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内に限定することで、プロンプト、アラート、および OTP の処理を観察可能にし、ホストでのアラートの繰り返しを防止できます。

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

メンテナーは、実際のランブックとして [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) にある非公開のリリースドキュメントを使用します。

## 関連項目

- [リリースチャンネル](/ja-JP/install/development-channels)
