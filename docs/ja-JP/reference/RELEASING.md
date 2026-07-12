---
read_when:
    - 公開リリースチャンネルの定義を検索中
    - リリース検証またはパッケージ受け入れテストの実行
    - バージョンの命名規則とリリース頻度を確認する
summary: リリースレーン、運用担当者向けチェックリスト、検証ボックス、バージョン命名規則、リリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-07-12T14:48:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw は現在、ユーザー向けに 3 つの更新チャネルを提供しています。

- stable: 既存の昇格済みリリースチャネル。独立した CLI/チャネルのマイルストーンが導入されるまでは、引き続き npm `latest` を通じて解決されます
- beta: npm `beta` に公開されるプレリリースタグ
- dev: 移動し続ける `main` の先端

これとは別に、リリースオペレーターは、完了した直前の月のコアパッケージを、パッチ `33` から npm `extended-stable` に公開できます。当月の通常の最終リリース系列は引き続き npm `latest` を使用します。このオペレーター側の公開先の分離だけでは、CLI の更新チャネル解決は変更されません。

Tideclaw のアルファビルドは、独立した内部プレリリーストラック（npm dist-tag `alpha`）であり、[NPM ワークフロー入力](#npm-workflow-inputs)および[リリーステストボックス](#release-test-boxes)で説明されています。

## バージョン命名

- 月次 npm extended-stable リリースバージョン: `YYYY.M.PATCH`、`PATCH >= 33`、git タグ `vYYYY.M.PATCH`
- 日次/通常の最終リリースバージョン: `YYYY.M.PATCH`、`PATCH < 33`、git タグ `vYYYY.M.PATCH`
- 通常のフォールバック修正リリースバージョン: `YYYY.M.PATCH-N`、git タグ `vYYYY.M.PATCH-N`
- ベータプレリリースバージョン: `YYYY.M.PATCH-beta.N`、git タグ `vYYYY.M.PATCH-beta.N`
- アルファプレリリースバージョン: `YYYY.M.PATCH-alpha.N`、git タグ `vYYYY.M.PATCH-alpha.N`
- 月またはパッチをゼロ埋めしないでください
- `PATCH` は月ごとの連番リリーストレイン番号であり、暦日ではありません。通常の最終リリースとベータリリースは現在のトレインを進めます。アルファ専用タグがベータ/通常リリースのパッチ番号を消費または進行させることはないため、ベータまたは通常リリースのトレインを選択する際は、より大きなパッチ番号を持つ従来のアルファ専用タグを無視してください。
- アルファ/ナイトリービルドは次の未リリースのパッチトレインを使用し、ビルドを繰り返す場合は `alpha.N` のみを増加させます。そのパッチのベータが作成された後は、新しいアルファビルドは次のパッチへ移ります。
- npm バージョンは不変です。公開済みタグの削除、再公開、再利用は絶対に行わないでください。代わりに、次のプレリリース番号または次の月次パッチを作成してください。
- `latest` は引き続き現在の通常/日次 npm 系列を参照し、`beta` は現在のベータインストール先です
- `extended-stable` は、パッチ `33` から始まる、サポート対象の直前月の npm パッケージを意味します。パッチ `34` 以降は、その月次系列のメンテナンスリリースです
- 通常の最終リリースと通常の修正リリースは、デフォルトで npm `beta` に公開されます。リリースオペレーターは `latest` を明示的に指定するか、検証済みのベータビルドを後から昇格できます
- 専用の月次 extended-stable パスでは、コア npm パッケージと、npm に公開可能なすべての公式 Plugin を、完全に同じバージョンで公開します。Plugin の ClawHub への公開、macOS または Windows アーティファクト、GitHub Release、プライベートリポジトリの dist-tag、Docker イメージ、モバイルアーティファクト、Web サイトのダウンロードは公開しません。
- 通常の最終リリースでは、npm パッケージ、macOS アプリ、署名済みスタンドアロン Android APK、署名済み Windows Hub インストーラーをまとめてリリースします。ベータリリースでは通常、まず npm/パッケージのパスを検証して公開し、ネイティブアプリのビルド、署名、公証、昇格は、明示的に要求されない限り通常の最終リリース用に留保します。

## リリース頻度

- リリースはベータ優先で進み、stable は最新のベータが検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.PATCH` ブランチでリリースを作成します。これにより、リリースの検証と修正が `main` での新規開発を妨げません
- ベータタグがプッシュまたは公開された後に修正が必要になった場合、メンテナーは古いタグを削除または再作成せず、次の `-beta.N` タグを作成します
- 詳細なリリース手順、承認、認証情報、復旧に関する注意事項はメンテナー専用です

## 月次 npm 専用 extended-stable 公開

これは、後述する通常のリリース手順に対する専用の例外です。完了した月 `YYYY.M` について、`extended-stable/YYYY.M.33` を作成し、同じブランチから `vYYYY.M.33` およびそれ以降のメンテナンスパッチを公開します。リリースタグ、ブランチ先端、チェックアウト、パッケージバージョン、npm プリフライト、Full Release Validation の実行は、すべて同じコミットを示す必要があります。保護された `main` には、パッチ `33` 未満で、暦上厳密に後の月の最終バージョンがすでに含まれている必要があります。`main` が 1 か月を超えて先へ進んだ後も、メンテナンスパッチは引き続き対象になります。

対象の extended-stable ブランチで、ルートパッケージを `YYYY.M.P` に更新し、`pnpm release:prep` を実行して、公開可能なすべての拡張パッケージが同じバージョンであることを確認します。生成されたすべての変更をコミットしてプッシュし、そのコミットに不変の `vYYYY.M.P` タグを作成してプッシュし、生成された完全な SHA を記録します。ワークフローはこの準備済みツリーを使用します。バージョンの更新や同期を自動では行いません。

その完全に同じ準備済みブランチ先端から npm プリフライトと Full Release Validation を実行し、両方の実行 ID と、成功した Full Release Validation の実行試行番号を保存します。

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

`release_profile=stable` は既存の検証深度プロファイルです。npm `extended-stable` dist-tag とは別のものであり、意図的に変更されていません。

両方の実行が成功したら、同じ完全なブランチ先端から、npm に公開可能なすべての公式 Plugin を公開します。パッチ `P` は `33` 以上である必要があります。完全なリリース SHA を `ref` として渡し、マトリクス全体とレジストリの読み戻しが完了するまで待ってから、成功した Plugin NPM Release の実行 ID を保存します。

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

このワークフローは、ソースが変更されていないパッケージを含む、通常の準備済み `all-publishable` パッケージインベントリを使用します。成功する前に、すべての完全一致パッケージと、すべての Plugin の `extended-stable` タグを検証します。部分的な実行が失敗した場合は、同じコマンドを再実行してください。すでに公開済みのパッケージは再利用され、欠落または古くなった Plugin タグは npm リリース環境で整合され、最終的な読み戻しでは引き続き完全なパッケージセットが対象になります。

Plugin ワークフローが成功し、npm リリース環境の準備が整ったら、プリフライトで生成された完全一致のコア tarball を公開します。コアの公開処理では、参照された Plugin の実行が、同じ正規ブランチかつ完全に同じソース SHA 上で `completed/success` であることを検証します。

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

月次の `.33` または保護された `main` の月ポリシーを意図的に満たせないフォークや非本番リハーサルでは、npm プリフライトと公開の両方のディスパッチに `-f bypass_extended_stable_guard=true` を追加します。デフォルトは `false` です。このバイパスは `npm_dist_tag=extended-stable` と組み合わせた場合にのみ受け入れられ、ワークフローのサマリーに記録されます。正規の `extended-stable/YYYY.M.33` ワークフロー参照、ブランチ先端/タグ/チェックアウトの一致、最終タグの構文、パッケージ/タグバージョンの一致、参照される実行とマニフェストの同一性、tarball の来歴、環境承認、レジストリの読み戻し、セレクター修復の証拠はバイパスされません。

公開ワークフローは、参照されたプリフライト、検証、Plugin 実行の同一性、準備済み tarball のダイジェスト、コアレジストリのセレクターを検証します。ワークフローが成功した後、結果を独立して確認します。

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

両方のコマンドが `YYYY.M.P` を返す必要があります。公開は成功したもののセレクターの読み戻しが失敗した場合、不変のパッケージバージョンを再公開しないでください。失敗したワークフローの常時実行サマリーに出力された単一の `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復コマンドを使用し、その後、両方の独立した読み戻しを繰り返します。以前のセレクターへのロールバックは別のオペレーター判断であり、読み戻しの修復手順ではありません。

公開サポートドキュメントでは当初、Slack、Discord、Codex を extended-stable の対象 Plugin サーフェスとして指定します。このリストはサポート方針であり、リリースコードの許可リストではありません。npm に公開可能なすべての公式 Plugin が、同じ完全一致バージョンの公開パスに従います。

以下の通常のチェックリストは、引き続き beta、`latest`、GitHub Release、Plugin、macOS、Windows、およびその他のプラットフォームの公開を扱います。この npm 専用 extended-stable パスでは、これらの手順を実行しないでください。

## 通常リリースのオペレーターチェックリスト

このチェックリストは、リリースフローの公開部分を示します。非公開の認証情報、署名、公証、dist-tag の復旧、緊急ロールバックの詳細は、メンテナー専用のリリースランブックに記載されています。

1. 現在の `main` から開始します。最新の変更をプルし、対象コミットがプッシュ済みであること、および `main` の CI がブランチ作成元として十分に成功していることを確認します。
2. 到達可能な最新のリリースタグ以降にマージされた PR とすべての直接コミットから、`CHANGELOG.md` の先頭セクションを生成します。エントリはユーザー向けにし、重複する PR／直接コミットのエントリを排除して、コミット、プッシュした後、ブランチを作成する前にもう一度リベース／プルします。分岐したリリース済みタグや後続のフォワードポートによって、すでにリリース済みの PR が再度関連付けられる場合は、そのタグを `--shipped-ref` として明示的に渡します。検証ツールは、タグのスナップショット内にある番号付きセクションの完全なコントリビューション記録から明示的な PR 行を使用し、`Unreleased` を無視して、除外された PR の正確な一覧と件数を記録します。
3. `src/plugins/compat/registry.ts` と `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性記録を確認します。アップグレードパスが引き続きカバーされる場合に限り、期限切れの互換性を削除します。それ以外の場合は、意図的に維持する理由を記録します。
4. 現在の `main` から `release/YYYY.M.PATCH` を作成します。通常のリリース作業を `main` 上で直接行わないでください。
5. タグに必要なすべてのバージョン箇所を更新してから、`pnpm release:prep` を実行します。これにより、Plugin のバージョン、npm shrinkwrap、Plugin インベントリ、基本設定スキーマ、同梱チャネルの設定メタデータ、設定ドキュメントのベースライン、Plugin SDK のエクスポート、Plugin SDK API のベースラインがこの順序で更新されます。タグ付け前に生成物の差分をコミットし、その後、ローカルで決定論的なプリフライトとして `pnpm check:test-types`、`pnpm check:architecture`、`pnpm build && pnpm ui:build`、`pnpm release:check` を実行します。
6. `preflight_only=true` を指定して `OpenClaw NPM Release` を実行します。タグがまだ存在しない場合は、検証専用プリフライトにリリースブランチの完全な 40 文字の SHA を使用できます。プリフライトは、チェックアウトされた正確な依存関係グラフに対する依存関係リリースの証拠を生成し、npm プリフライトアーティファクトに保存します。成功した `preflight_run_id` を保存します。
7. リリースブランチ、タグ、または完全なコミット SHA を対象に `Full Release Validation` を実行し、すべてのリリース前テストを開始します。これは、Vitest、Docker、QA Lab、Package という 4 つの大規模なリリーステストボックスに対する唯一の手動エントリポイントです。`full_release_validation_run_id` と正確な `full_release_validation_run_attempt` を保存します。どちらも `OpenClaw NPM Release` と `OpenClaw Release Publish` の必須入力です。
8. 検証が失敗した場合は、リリースブランチ上で修正し、その修正を証明できる最小単位の失敗したファイル、レーン、ワークフロージョブ、パッケージプロファイル、プロバイダー、またはモデル許可リストを再実行します。変更した領域によって以前の証拠が古くなった場合にのみ、包括的な検証全体を再実行します。
9. タグ付きベータ候補の場合は、対応する `release/YYYY.M.PATCH` ブランチから `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` を実行します。安定版の場合は、必須の Windows ソースリリースも渡します：`pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。このヘルパーは、信頼済みの `main` をワークフローのソースとして使用し、各ワークフローでは正確なタグを対象にします。変更不能な候補／ツール識別情報とディスパッチ済みの実行 ID を `.artifacts/release-candidate/<tag>/release-candidate-state.json` にチェックポイントとして記録します。同じコマンドを再実行すると、その正確な実行が再開されますが、候補、ツール、プロファイル、またはオプションに差異がある場合はフェイルクローズします。完全な検証マトリックスをディスパッチする前に、ヘルパーは正確なタグの GitHub リリース本文を決定論的にレンダリングし、バージョン見出しがない場合、上限を超えた本文に標準の簡潔形式を使用できない場合、またはコントリビューション記録のベース／ターゲットの来歴がタグから到達できない場合は拒否します。また、明示的なリリース済みベースライン除外メタデータがある場合は、参照先の累積タグ記録に対して検証します。その後、ローカルの生成済みリリースチェックを実行し、完全なリリース検証と npm プリフライトの証拠をディスパッチまたは検証し、正確に準備された tarball に対する Parallels の新規／更新証明と Telegram パッケージ証明を実行し、Plugin の npm および ClawHub の計画を記録します。証拠バンドルがすべて成功した後にのみ、正確な `OpenClaw Release Publish` コマンドを出力します。

   `OpenClaw Release Publish` は、選択された、または公開可能なすべてのプラグインパッケージを npm に、同じセットを ClawHub に並行して送信し、プラグインの npm 公開が成功すると、準備済みの OpenClaw npm プレフライトアーティファクトを対応する dist-tag で昇格させます。リリースチェックアウトはプロダクト／データのルートのまま維持されますが、計画と最終検証は、正確な信頼済みワークフローソースのチェックアウトから実行されるため、古いリリースコミットが廃止済みのリリースツールを暗黙的に使用することはありません。公開用の子処理が開始される前に、正確な GitHub リリース本文をレンダリングしてキャッシュします。完全に一致する `CHANGELOG.md` セクションが GitHub の 125,000 文字制限とレンダラーの対応する 125,000 バイトの安全上限に収まる場合、ページには見出しを含むその正確な `## YYYY.M.PATCH` セクションが掲載されます。ソースセクションが収まらない場合、ページはグループ化された編集注記を正確に維持し、サイズ超過のコントリビューション記録を、タグに固定された `CHANGELOG.md` 内の完全な記録への安定したリンクに置き換えます。部分的な記録や途中で切り詰められた箇条書きが公開されることはありません。ワークフローは `### Release verification` を追加する前に完全版またはコンパクト版の本文を選択します。証明情報の末尾を加えると制限を超える場合は、正規の本文を維持し、代わりに変更不能な添付証拠を使用します。npm `latest` に公開された安定版リリースは GitHub の最新リリースになり、npm `beta` に維持される安定版メンテナンスリリースは GitHub `latest=false` を使用して作成されます。また、ワークフローはリリース後のインシデント対応に備え、プレフライトの依存関係証拠、完全検証マニフェスト、および公開後のレジストリ検証証拠を GitHub リリースにアップロードします。子ワークフローの実行 ID を即時に出力し、ワークフロートークンに承認権限があるリリース環境ゲートを自動承認し、失敗した子ジョブをログ末尾とともに要約します。また、GitHub リリースのドラフトページを事前に作成し、OpenClaw の npm 公開と並行して Windows および Android のアセットを昇格させ、それらのステージが成功するとリリースページと依存関係証拠を確定します。OpenClaw npm を公開する場合は常に ClawHub の完了を待ってから、信頼済み main のベータ検証ツールを実行し、GitHub リリース、npm パッケージ、選択されたプラグインの npm パッケージ、選択された ClawHub パッケージ、子ワークフローの実行 ID、および任意の NPM Telegram 実行 ID に関する公開後の証拠をアップロードします。ClawHub ブートストラップ検証ツールでは、正確な信頼済み main のワークフローパスと SHA、生成側および最終実行の試行、リリース SHA、要求されたパッケージセット、変更不能なパッケージアーティファクトのタプル、および最終的なレジストリ読み戻しアーティファクトが必要です。成功した従来のリリース参照による実行は受け入れられません。

   次に、公開済みの `openclaw@YYYY.M.PATCH-beta.N` または `openclaw@beta` パッケージに対して、公開後のパッケージ受け入れテストを実行します。プッシュまたは公開済みのプレリリースに修正が必要な場合は、次の対応するプレリリース番号を採番してください。古いものは決して削除したり書き換えたりしないでください。

10. 安定版では、検証済みのベータ版またはリリース候補に必要な検証証跡が揃っている場合にのみ続行します。安定版の npm 公開も `OpenClaw Release Publish` を通じて行い、成功したプレフライト成果物を `preflight_run_id` で再利用します。安定版の macOS リリース準備には、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および更新済みの `appcast.xml` が `main` にあることも必要です。macOS 公開ワークフローは、リリースアセットの検証後、署名済み appcast を公開 `main` に自動的に公開します。ブランチ保護によって直接プッシュがブロックされる場合は、appcast PR を作成または更新します。安定版 Windows Hub の準備には、署名済みの `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe`、および `OpenClawCompanion-SHA256SUMS.txt` アセットが OpenClaw GitHub リリースにあることが必要です。署名済みの `openclaw/openclaw-windows-node` リリースタグを正確に `windows_node_tag` として渡し、候補版として承認済みのインストーラーダイジェストマップを `windows_node_installer_digests` として渡します。`OpenClaw Release Publish` はリリースをドラフトのまま維持し、`Windows Node Release` をディスパッチして、公開前に 3 つのアセットをすべて検証します。
11. 公開後、npm 公開後検証ツールを実行します。公開後のチャンネル検証証跡が必要な場合は、任意で公開済み npm パッケージ単体の Telegram E2E を実行し、必要に応じて dist-tag を昇格させ、生成された GitHub リリースページを検証し、リリース告知手順を実行します。その後、安定版リリースの完了を宣言する前に、[安定版の main クローズアウト](#stable-main-closeout)を完了します。

## 安定版の main クローズアウト

安定版の公開は、`main` に実際に出荷されたリリース状態が反映されるまで完了ではありません。

1. 最新の `main` から開始します。`release/YYYY.M.PATCH` をそれと照合し、`main` に存在しない実際の修正をフォワードポートします。リリース専用の互換性、テスト、検証用アダプターを、より新しい `main` に無条件でマージしないでください。
2. `main` を、推測上の次期リリース系列ではなく、出荷済みの安定版バージョンに設定します。ルートのバージョン変更後に `pnpm release:prep` を実行し、続いて `pnpm deps:shrinkwrap:generate` を実行します。
3. `main` 上の `CHANGELOG.md` の `## YYYY.M.PATCH` セクションを、タグ付けされたリリースブランチと完全に一致させます。mac リリースで公開された場合は、安定版の `appcast.xml` 更新も含めます。
4. オペレーターがそのリリース系列を明示的に開始するまで、`YYYY.M.PATCH+1`、ベータ版バージョン、または空の将来用 changelog セクションを `main` に追加しないでください。
5. `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check`、および `OPENCLAW_TESTBOX=1 pnpm check:changed` を実行します。プッシュした後、安定版リリースの完了を宣言する前に、`origin/main` に出荷済みのバージョンと changelog が含まれていることを確認します。
6. 非公開のロールバック訓練を実施するたびに、リポジトリ変数 `RELEASE_ROLLBACK_DRILL_ID` と `RELEASE_ROLLBACK_DRILL_DATE` を最新の状態に保ちます。

`OpenClaw Stable Main Closeout` は、安定版の公開後に、出荷済みバージョン、changelog、appcast を含む `main` へのプッシュを起点として開始されます。不変の公開後エビデンスを読み取り、出荷済みタグをその Full Release Validation および Publish の実行に紐付けた後、安定版の main 状態、リリース、必須の安定版ソーク期間、およびブロッキング対象のパフォーマンスエビデンスを検証します。不変のクローズアウトマニフェストとチェックサムを GitHub リリースに添付します。自動プッシュトリガーは、不変の公開後エビデンスが導入される前のレガシーリリースをスキップし、そのスキップをクローズアウト完了として扱うことはありません。

完全なクローズアウトには、両方のアセットと一致するチェックサムが必要です。部分的なマニフェストは、記録済みの `main` SHA とロールバック訓練を再実行して同一のバイト列を再生成し、不足しているチェックサムを添付します。無効な組み合わせ、またはマニフェストのないチェックサムは、引き続きブロッキング対象となります。ロールバック訓練用のリポジトリ変数がないプッシュトリガー実行は、クローズアウトを完了せずにスキップされます。訓練記録が欠落している場合、または 90 日を超えて古い場合は、エビデンスに基づく手動クローズアウトも引き続きブロックされます。非公開の復旧コマンドは、メンテナー専用のランブックにのみ記載します。手動ディスパッチは、エビデンスに基づく安定版クローズアウトの修復または再実行にのみ使用してください。

レガシーフォールバック修正タグで基本パッケージのエビデンスを再利用できるのは、修正タグが基本安定版タグと同じソースコミットに解決される場合のみです。その Android リリースでは、基本タグの検証済み APK を再利用し、修正タグの来歴情報を追加します。ソースが異なる修正では、独自のパッケージエビデンスを公開して検証し、より大きい Android `versionCode` を使用する必要があります。

## リリースの事前確認

- リリースのプリフライト前に `pnpm check:test-types` を実行し、高速なローカル `pnpm check` ゲートの対象外でもテスト用 TypeScript が引き続き検証されるようにします。
- リリースのプリフライト前に `pnpm check:architecture` を実行し、高速なローカルゲートの対象外にある、より広範なインポートサイクルおよびアーキテクチャ境界のチェックがすべて成功するようにします。
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、パック検証ステップに必要な `dist/*` リリース成果物と Control UI バンドルを生成します。
- ルートのバージョン更新後、タグ付け前に `pnpm release:prep` を実行します。これにより、バージョン、設定、API の変更後に差分が生じやすいすべての決定論的リリースジェネレーター（Plugin のバージョン、npm shrinkwrap、Plugin インベントリ、基本設定スキーマ、同梱チャネルの設定メタデータ、設定ドキュメントのベースライン、Plugin SDK エクスポート、Plugin SDK API ベースライン）が実行されます。`pnpm release:check` は、これらのガードをチェックモードで再実行し（さらに Plugin SDK サーフェスの予算チェックも実行）、パッケージのリリースチェックを実行する前に、生成物の差分によるすべての失敗を 1 回の処理で報告します。
- Plugin のバージョン同期では、デフォルトで、公開可能な `@openclaw/ai` ランタイムパッケージ、公式 Plugin パッケージのバージョン、既存の `openclaw.compat.pluginApi` の下限が OpenClaw のリリースバージョンに更新されます。このフィールドは単なるパッケージバージョンのコピーではなく、Plugin SDK／ランタイム API の下限として扱ってください。古い OpenClaw ホストとの互換性を意図的に維持する Plugin のみのリリースでは、サポート対象の最も古いホスト API を下限として維持し、その選択を Plugin のリリース証跡に記載してください。
- リリース承認前に、手動の `Full Release Validation` ワークフローを実行し、1 つのエントリーポイントからすべてのリリース前テストボックスを開始します。このワークフローはブランチ、タグ、または完全なコミット SHA を受け取り、手動の `CI` をディスパッチするとともに、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab の整合性、Matrix、Telegram の各レーン向けに `OpenClaw Release Checks` をディスパッチします。安定版およびフル実行には、網羅的なライブ／E2E と Docker リリースパスの長時間テストが常に含まれます。`run_release_soak=true` は、明示的なベータ版の長時間テスト用として維持されています。Package Acceptance は候補検証中の標準的なパッケージ Telegram E2E を提供し、2 つ目のライブポーラーが同時に動作することを防ぎます。

  ベータ版の公開後に `release_package_spec` を指定すると、リリース tarball を再ビルドせずに、公開済みの npm パッケージをリリースチェック、Package Acceptance、パッケージ Telegram E2E で再利用できます。Telegram で他のリリース検証とは異なる公開済みパッケージを使用する場合に限り、`npm_telegram_package_spec` を指定します。Package Acceptance でリリースパッケージ指定とは異なる公開済みパッケージを使用する場合は、`package_acceptance_package_spec` を指定します。Telegram E2E を強制せず、リリース証跡レポートで検証結果が公開済み npm パッケージと一致することを証明する場合は、`evidence_package_spec` を指定します。

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- リリース作業を続行しながらパッケージ候補のサイドチャネル証跡が必要な場合は、手動の `Package Acceptance` ワークフローを実行します。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm`、現在の `workflow_ref` ハーネスを使用して信頼済みの `package_ref` ブランチ／タグ／SHA をパックする場合は `source=ref`、必須の SHA-256 と厳格な公開 URL ポリシーを適用する公開 HTTPS tarball には `source=url`、必須の `trusted_source_id` と SHA-256 を使用する名前付きの信頼済みソースポリシーには `source=trusted-url`、別の GitHub Actions 実行によってアップロードされた tarball には `source=artifact` を使用します。

  このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラーを再利用します。また、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` を使用して、同じ tarball に対する Telegram QA を実行できます。選択した Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージ成果物が候補となり、`published_upgrade_survivor_baseline` が公開済みのベースラインを選択します。`update-restart-auth` は、候補パッケージをインストール済み CLI とテスト対象パッケージの両方として使用するため、候補の更新コマンドによる管理下の再起動パスを検証します。

  例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  一般的なプロファイル：
  - `smoke`：インストール／チャネル／エージェント、Gateway ネットワーク、設定再読み込みの各レーン
  - `package`：OpenWebUI またはライブ ClawHub を使用しない、成果物ネイティブのパッケージ／更新／再起動／Plugin レーン
  - `product`：パッケージプロファイルに加えて、MCP チャネル、cron／サブエージェントのクリーンアップ、OpenAI ウェブ検索、OpenWebUI
  - `full`：OpenWebUI を含む Docker リリースパスのチャンク
  - `custom`：対象を絞った再実行向けの、正確な `docker_lanes` 選択

- リリース候補に対して決定論的な通常の CI カバレッジのみが必要な場合は、手動の `CI` ワークフローを直接実行します。手動の CI ディスパッチは変更範囲によるスコープ設定をバイパスし、Linux Node シャード、同梱 Plugin シャード、Plugin およびチャネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物のスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n の各レーンを強制的に実行します。単独の手動 CI 実行で Android が実行されるのは、`include_android=true` を指定してディスパッチした場合のみです。`Full Release Validation` は、その CI 子ワークフローにこの入力を渡します。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- リリースのテレメトリを検証する場合は、`pnpm qa:otel:smoke` を実行します。これはローカルの OTLP/HTTP レシーバーを介して QA-lab を実行し、Opik、Langfuse、その他の外部コレクターを必要とせずに、トレース、メトリクス、ログのエクスポートに加えて、制限されたトレース属性とコンテンツ／識別子の秘匿化を検証します。
- コレクターの互換性を検証する場合は、`pnpm qa:otel:collector-smoke` を実行します。これは、ローカルレシーバーでのアサーションの前に、同じ QA-lab の OTLP エクスポートを実際の OpenTelemetry Collector Docker コンテナ経由で送信します。
- 保護された Prometheus スクレイピングを検証する場合は、`pnpm qa:prometheus:smoke` を実行します。これは QA-lab を実行し、未認証のスクレイピングを拒否し、リリースに不可欠なメトリクスファミリーにプロンプト内容、生の識別子、認証トークン、ローカルパスが含まれないことを検証します。
- ソースチェックアウトの OpenTelemetry および Prometheus スモークレーンを連続して実行するには、`pnpm qa:observability:smoke` を実行します。
- タグ付きリリースの前には、毎回 `pnpm release:check` を実行します。
- `OpenClaw NPM Release` のプリフライトは、npm tarball をパックする前に依存関係のリリース証跡を生成します。npm アドバイザリの脆弱性ゲートは、リリースをブロックします。推移的マニフェストのリスク、依存関係の所有権／インストールサーフェス、依存関係変更の各レポートは、リリース証跡のみを目的としています。依存関係変更レポートは、リリース候補と到達可能な直前のリリースタグを比較します。プリフライトは依存関係の証跡を `openclaw-release-dependency-evidence-<tag>` としてアップロードし、準備済み npm プリフライト成果物内の `dependency-evidence/` にも埋め込みます。実際の公開パスではそのプリフライト成果物を再利用し、同じ証跡を `openclaw-<version>-dependency-evidence.zip` として GitHub リリースに添付します。
- タグの作成後、変更を伴う公開シーケンスには `OpenClaw Release Publish` を実行します。通常のベータ版および安定版の公開は、信頼済みの `main` からディスパッチします。リリースタグは引き続き正確な対象コミットを選択し、`release/YYYY.M.PATCH` 内を指すことができます。Tideclaw アルファ版の公開は、対応するアルファブランチ上で行います。成功した OpenClaw npm の `preflight_run_id`、成功した `full_release_validation_run_id`、正確な `full_release_validation_run_attempt` を渡し、意図的に対象を絞った修復を実行する場合を除き、デフォルトの Plugin 公開スコープ `all-publishable` を維持します。このワークフローは Plugin の npm 公開、Plugin の ClawHub 公開、OpenClaw の npm 公開を直列化し、外部化された Plugin より前にコアパッケージが公開されないようにします。Windows および Android のプロモーションは、ドラフトのリリースページに対するコア npm 公開と並行して実行されます。公開の再実行は再開可能です。コア npm バージョンがすでに公開済みの場合、ワークフローがレジストリの tarball とタグのプリフライト成果物の一致を証明した後、コアのディスパッチをスキップします。また、リリースに検証済みの成果物契約がすでに含まれている場合は Windows／Android のプロモーションをスキップするため、再試行では失敗したステージのみが再実行されます。対象を絞った Plugin のみの修復には、`plugin_publish_scope=selected` と空ではない Plugin リストが必要です。Plugin のみの `all-publishable` 実行には、完全かつ不変のプリフライト証跡と Full Release Validation 証跡が必要であり、部分的な証跡は拒否されます。
- 安定版の `OpenClaw Release Publish` では、対応するプレリリースではない `openclaw/openclaw-windows-node` リリースが存在した後、その正確な `windows_node_tag` と、候補として承認済みの `windows_node_installer_digests` マップが必要です。公開子ワークフローをディスパッチする前に、そのソースリリースが公開済みでプレリリースではなく、必要な x64／ARM64 インストーラーを含み、承認済みのマップと引き続き一致していることを検証します。その後、OpenClaw リリースがまだドラフトの間に、固定されたインストーラーダイジェストマップを変更せずに渡して `Windows Node Release` をディスパッチします。子ワークフローは、その正確なタグから署名済みの Windows Hub インストーラーをダウンロードし、固定されたダイジェストと照合し、Windows ランナー上で Authenticode 署名に想定される OpenClaw Foundation の署名者が使用されていることを検証し、SHA-256 マニフェストを書き込み、インストーラーとマニフェストを標準の OpenClaw GitHub リリースにアップロードします。その後、プロモーションされた成果物を再ダウンロードし、マニフェストへの登録とハッシュを検証します。親ワークフローは、公開前に現在の x64、ARM64、チェックサムの成果物契約を検証します。直接リカバリーでは、想定される契約成果物を固定されたソースバイトで置き換える前に、予期しない `OpenClawCompanion-*` という成果物名を拒否します。

  `Windows Node Release` を手動でディスパッチするのはリカバリー時のみにし、常に正確なタグを渡してください。`latest` は決して使用せず、承認済みのソースリリースから取得した明示的な `expected_installer_digests` JSON マップも渡してください。ウェブサイトのダウンロードリンクは、現在の安定版リリースに対する正確な OpenClaw リリース成果物 URL を参照する必要があります。または、GitHub の latest リダイレクトが同じリリースを指していることを確認した後に限り、`releases/latest/download/...` を使用できます。コンパニオンリポジトリのリリースページだけにリンクしないでください。

- リリースチェックは、独立した手動ワークフロー `OpenClaw Release Checks` で実行されるようになりました。このワークフローでは、リリース承認前に QA Lab のモックパリティレーン、高速なライブ Matrix プロファイル、および Telegram QA レーンも実行されます。ライブレーンは `qa-live-shared` 環境を使用し、Telegram では Convex CI 認証情報リースも使用します。Matrix のトランスポート、メディア、E2EE の全インベントリを並列実行する場合は、手動の `QA-Lab - All Lanes` ワークフローを `matrix_profile=all` および `matrix_shards=true` で実行してください。
- OS 横断のインストールおよびアップグレードのランタイム検証は、公開ワークフロー `OpenClaw Release Checks` と `Full Release Validation` の一部です。これらは再利用可能なワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出します。この分離は意図的なものです。実際の npm リリースパスは短く、決定論的で、アーティファクトに焦点を当てたままにし、時間のかかるライブチェックは独自のレーンに置くことで、公開処理を停滞させたりブロックしたりしないようにします。
- シークレットを使用するリリースチェックは、ワークフローロジックとシークレットを管理下に保つため、`Full Release Validation` 経由、または `main`/リリースのワークフロー ref からディスパッチする必要があります。
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw のブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付けます。
- `OpenClaw NPM Release` の検証専用プリフライトでは、プッシュ済みタグを必要とせず、現在のワークフローブランチの完全な 40 文字のコミット SHA も受け付けます。この SHA パスは検証専用であり、実際の公開へ昇格させることはできません。SHA モードでは、パッケージメタデータチェック専用に `v<package.json version>` を合成します。実際の公開には、引き続き実在するリリースタグが必要です。
- どちらのワークフローでも、実際の公開および昇格パスは GitHub ホステッドランナー上に維持され、変更を伴わない検証パスでは、より大規模な Blacksmith Linux ランナーを使用できます。
- このワークフローは、ワークフローシークレット `OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方を使用して、`OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行します。
- npm リリースのプリフライトは、独立したリリースチェックレーンの完了を待たなくなりました。
- ローカルでリリース候補にタグを付ける前に、`RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` を実行してください。このヘルパーは、高速なリリースガードレール、Plugin の npm/ClawHub リリースチェック、ビルド、UI ビルド、および `release:openclaw:npm:check` を、GitHub の公開ワークフローが開始する前に承認を妨げる一般的なミスを検出できる順序で実行します。
- 承認前に、`RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（または対応するプレリリース/修正版タグ）を実行してください。
- npm への公開後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（または対応するベータ/修正版バージョン）を実行し、新しい一時プレフィックスで公開済みレジストリからのインストールパスを検証してください。
- ベータ版の公開後、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行し、共有のリース済み Telegram 認証情報プールを使用して、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram のセットアップ、および実際の Telegram E2E を検証してください。メンテナーがローカルで単発実行する場合は Convex の変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` 環境認証情報を直接渡すことができます。
- メンテナーのマシンから公開後の完全なベータスモークテストを実行するには、`pnpm release:beta-smoke -- --beta betaN` を使用します。このヘルパーは、Parallels での npm 更新/新規ターゲット検証を実行し、`NPM Telegram Beta E2E` をディスパッチし、該当するワークフロー実行をポーリングし、アーティファクトをダウンロードして、Telegram レポートを出力します。
- メンテナーは、手動の `NPM Telegram Beta E2E` ワークフローを使用して、GitHub Actions から同じ公開後チェックを実行できます。このワークフローは意図的に手動専用であり、マージのたびには実行されません。
- メンテナー向けのリリース自動化では、プリフライト後に昇格する方式を使用します。
  - 実際の npm 公開には、成功した npm の `preflight_run_id` が必要です。
  - 通常のベータ版および安定版の公開オーケストレーションとプリフライトでは、正確なターゲットタグに対して信頼済みの `main` を使用します。Tideclaw アルファ版の公開とプリフライトでは、対応するアルファブランチを使用します。
  - 安定版 npm リリースのデフォルトは `beta` です。安定版 npm の公開では、ワークフロー入力を使用して明示的に `latest` を対象にできます。
  - トークンベースの npm dist-tag 変更は `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` にあります。これは、ソースリポジトリでは OIDC のみの公開を維持する一方で、`npm dist-tag add` には引き続き `NPM_TOKEN` が必要なためです。
  - 公開ワークフロー `macOS Release` は検証専用です。タグがリリースブランチにのみ存在し、ワークフローを `main` からディスパッチする場合は、`public_release_branch=release/YYYY.M.PATCH` を設定してください。
  - 実際の macOS 公開には、成功した macOS の `preflight_run_id` および `validate_run_id` が必要です。
  - 実際の公開パスでは、再度ビルドするのではなく、準備済みのアーティファクトを昇格させます。
- `YYYY.M.PATCH-N` のような安定版修正リリースでは、公開後ベリファイアーが、同じ一時プレフィックスで `YYYY.M.PATCH` から `YYYY.M.PATCH-N` へのアップグレードパスも確認します。これにより、リリース修正によって古いグローバルインストールが基本安定版のペイロードのままになることを防ぎます。
- npm リリースのプリフライトは、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り、フェイルクローズします。これにより、空のブラウザーダッシュボードが再び配布されることを防ぎます。
- 公開後検証では、公開された Plugin のエントリポイントとパッケージメタデータが、インストール済みレジストリのレイアウトに存在することも確認します。Plugin のランタイムペイロードが欠落したリリースは、公開後ベリファイアーで失敗し、`latest` に昇格できません。
- `pnpm test:install:smoke` は、候補となる更新用 tarball に対して npm pack の `unpackedSize` 予算も適用します。これにより、インストーラー E2E はリリース公開パスに入る前に、意図しないパッケージサイズの肥大化を検出します。
- リリース作業で CI 計画、拡張機能のタイミングマニフェスト、または拡張機能のテストマトリクスに変更を加えた場合は、承認前に `.github/workflows/plugin-prerelease.yml` からプランナーが所有する `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートに古い CI レイアウトが記載されないようにしてください。
- 安定版 macOS リリースの準備状況には、アップデーター関連のサーフェスも含まれます。GitHub リリースには最終的に、パッケージ化された `.zip`、`.dmg`、および `.dSYM.zip` が含まれている必要があります。公開後、`main` 上の `appcast.xml` は新しい安定版 zip を参照する必要があります（macOS 公開ワークフローが自動的にコミットするか、直接プッシュがブロックされている場合は appcast PR を作成します）。また、パッケージ化されたアプリは、デバッグ用ではないバンドル ID、空でない Sparkle フィード URL、およびそのリリースバージョンに対する正規の Sparkle ビルド下限以上の `CFBundleVersion` を維持する必要があります。

## リリーステストボックス

`Full Release Validation` は、オペレーターが 1 つのエントリポイントからすべてのリリース前テストを開始するための方法です。変更の速いブランチ上で固定コミットの証明を行う場合は、ヘルパーを使用してください。これにより、要求されたコミットをテスト対象候補として維持しながら、各子ワークフローが信頼済みの 1 つの `main` ワークフロー SHA に固定された一時ブランチから実行されます。

```bash
pnpm ci:full-release --sha <full-sha>
```

ヘルパーは現在の `origin/main` をフェッチし、その信頼済みワークフローコミットで `release-ci/<workflow-sha>-...` をプッシュし、一時ブランチから `ref=<target-sha>` を指定して `Full Release Validation` をディスパッチします。利用可能な場合は厳密に対象が一致する既存のエビデンスを再利用し、すべての子ワークフローの `headSha` が固定された親ワークフローの SHA と一致することを検証してから、一時ブランチを削除します。新規実行を強制するには `-f reuse_evidence=false` を渡します。また、現在の `origin/main` から引き続き到達可能な古いコミットに固定するには、`--workflow-sha <trusted-main-sha>` を指定します。ワークフロー自体がリポジトリの ref を書き換えることはありません。これにより、候補にツール用コミットを追加せずに main 専用のリリースツールを利用でき、誤ってより新しい `main` の子実行を検証してしまうことも避けられます。

リリースブランチまたはタグを検証するには、信頼済みの `main` ワークフロー ref から実行し、リリースブランチまたはタグを `ref` として渡します。

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

ワークフローは対象の ref を解決し、`target_ref=<release-ref>` を指定して手動の `CI` をディスパッチした後、`OpenClaw Release Checks` をディスパッチします。`OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、soak が有効な場合のライブ/E2E Docker リリースパスのカバレッジ、正規の Telegram パッケージ E2E を含む Package Acceptance、QA Lab の同等性、ライブ Matrix、ライブ Telegram にファンアウトします。完全実行または全実行が許容されるのは、フォーカスした再実行で別個の `Plugin Prerelease` 子ワークフローを意図的にスキップした場合を除き、`Full Release Validation` のサマリーで `normal_ci`、`plugin_prerelease`、`release_checks` が成功と表示されている場合のみです。単独の `npm-telegram` 子ワークフローは、`release_package_spec` または `npm_telegram_package_spec` を指定した、公開済みパッケージに焦点を絞った再実行にのみ使用してください。最終検証のサマリーには各子実行の最も時間がかかったジョブの表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。

このリリースパスでは、product-performance 子ワークフローはアーティファクト専用です。
アンブレラは `publish_reports=false` を指定してこれをディスパッチし、アーティファクト専用ガードによって Clawgrit レポートパブリッシャーがスキップされたままであることが証明されない限り、検証は拒否されます。

ステージの完全なマトリクス、正確なワークフロージョブ名、stable プロファイルと full プロファイルの違い、アーティファクト、および対象を絞った再実行用ハンドルについては、[完全なリリース検証](/ja-JP/reference/full-release-validation)を参照してください。

子ワークフローは、ターゲットの `ref` が古いリリースブランチやタグを指している場合でも、`Full Release Validation` を実行する信頼済み ref（通常は `--ref main`）からディスパッチされます。すべての子実行は、親ワークフローの正確な SHA を使用する必要があります。子ワークフローのディスパッチが確定する前に `main` が進んだ場合、アンブレラはフェイルクローズします。Full Release Validation 用の独立した workflow-ref 入力はありません。ワークフロー実行の ref を選択することで、信頼済みハーネスを選択してください。変動する `main` 上で正確なコミットを証明するために `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA は workflow dispatch の ref にできないため、`pnpm ci:full-release --sha <target-sha>` を使用して、ターゲット SHA を候補入力として維持しつつ、信頼済みの `origin/main` に一時ブランチを作成してください。

ライブ検証とプロバイダー検証の範囲を選択するには、`release_profile` を使用します。

- `minimum`: リリースに不可欠な OpenAI/core のライブパスと Docker パスを最速で検証
- `stable`: minimum に加えて、リリース承認に必要な stable プロバイダーおよびバックエンドを網羅
- `full`: stable に加えて、広範な参考用のプロバイダーおよびメディアを網羅

stable および full の検証では、昇格前に、網羅的なライブ/E2E、Docker リリースパス、および範囲を限定した公開済みパッケージのアップグレード生存確認スイープを常に実行します。ベータでも同じスイープを要求するには、`run_release_soak=true` を使用します。このスイープは、最新の4つの stable パッケージに加え、固定された `2026.4.23` および `2026.5.2` のベースラインと、さらに古い `2026.4.15` のカバレッジを対象とします。重複するベースラインは除去され、各ベースラインは個別の Docker ラナージョブに分割されます。

`OpenClaw Release Checks` は信頼済みワークフローの ref を使用して、ターゲットの ref を `release-package-under-test` として一度だけ解決し、soak の実行時には、そのアーティファクトをクロス OS、Package Acceptance、およびリリースパスの Docker チェックで再利用します。これにより、パッケージを扱うすべてのボックスで同一のバイト列が使用され、パッケージの繰り返しビルドを回避できます。ベータがすでに npm に公開されている場合は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を設定します。これにより、リリースチェックは公開済みパッケージを一度だけダウンロードし、そのビルド元 SHA を `dist/build-info.json` から抽出して、そのアーティファクトをクロス OS、Package Acceptance、リリースパスの Docker、およびパッケージ Telegram レーンで再利用します。

クロス OS の OpenAI インストールスモークテストでは、リポジトリまたは組織の変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.6-luna` を使用します。このレーンの目的は、最も高性能なモデルのベンチマークではなく、パッケージのインストール、オンボーディング、Gateway の起動、およびライブエージェントの1回のターンを証明することだからです。モデル固有のカバレッジは、より広範なライブプロバイダーマトリクスで引き続き検証します。

リリースステージに応じて、次のバリアントを使用してください。

```bash
# 未公開のリリース候補ブランチを検証する。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# push 済みの特定のコミットを検証する。
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# ベータ版の公開後、公開パッケージの Telegram E2E を追加する。
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

対象を絞った修正後の最初の再実行に、包括的なアンブレラ全体を使用しないでください。1 つのボックスが失敗した場合は、次の証明に、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用します。修正によって共有リリースオーケストレーションが変更された場合、または以前の全ボックスのエビデンスが古くなった場合にのみ、アンブレラ全体を再度実行してください。アンブレラの最終検証ジョブは記録された子ワークフローの実行 ID を再確認するため、子ワークフローの再実行が成功した後は、失敗した親ジョブ `Verify full validation` のみを再実行します。

`rerun_group=all` で以前成功したアンブレラ実行を再利用できるのは、まったく同じターゲット SHA、リリースプロファイル、実効 soak 設定、および検証入力を検証した場合に限られます。これは同じ候補を再実行するための限定的な復旧であり、異なる SHA 間でエビデンスを再利用するものではありません。変更履歴またはバージョンのみのコミットを含め、候補が変更された場合は、変更されたパスまたはアーティファクトハッシュの影響を受けるすべてのパッケージ、アーティファクト、インストール、Docker、またはプロバイダーのゲートを再実行してください。同じ `release/*` ref および再実行グループに対する新しいアンブレラ実行は、進行中の実行を自動的に置き換えます。完全に新規のフル実行を強制するには、`reuse_evidence=false` を渡します。

限定的な復旧では、アンブレラに `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子ワークフローのみ、`plugin-prerelease` はリリース専用 Plugin 子ワークフローのみ、`release-checks` はすべてのリリースボックスを実行し、より限定的なリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。対象を絞った `npm-telegram` の再実行には `release_package_spec` または `npm_telegram_package_spec` が必要です。full/all 実行では、Package Acceptance 内の標準パッケージ Telegram E2E を使用します。対象を絞ったクロス OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/スイートフィルターを追加できます。QA リリースチェックの失敗は、標準階層で必須となる OpenClaw 動的ツールのドリフトを含め、通常のリリース検証をブロックします。Tideclaw アルファ実行では、パッケージ安全性に関係しないリリースチェックレーンを引き続き参考情報として扱う場合があります。`release_profile=beta` では、`Run repo/live E2E validation` のライブプロバイダースイートは参考情報（警告であり、ブロッカーではありません）です。stable および full プロファイルでは、引き続きブロッカーとして扱われます。`live_suite_filter` で Discord、WhatsApp、Slack などのゲート付き QA ライブレーンを明示的に要求する場合、対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` リポジトリ変数を有効にする必要があります。有効でない場合、レーンを暗黙にスキップせず、入力の取得に失敗します。

### Vitest

Vitest ボックスは、手動の `CI` 子ワークフローです。手動 CI は意図的に変更範囲によるスコープ制限を迂回し、リリース候補に対して通常のテストグラフを強制します。これには、Linux Node シャード、同梱 Plugin シャード、Plugin およびチャネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトのスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n が含まれます。`Full Release Validation` がこのボックスを実行する場合、アンブレラが `include_android=true` を渡すため Android も含まれます。単独の手動 CI で Android を対象にするには、`include_android=true` が必要です。

このボックスは「ソースツリーが通常のフルテストスイートに合格したか」という問いに答えるために使用します。リリースパスの製品検証とは異なります。保持するエビデンス:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` の概要
- 特定のターゲット SHA で成功した `CI` 実行
- リグレッション調査時の CI ジョブにある、失敗したシャードまたは遅いシャードの名前
- 実行のパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースで決定論的な通常 CI が必要である一方、Docker、QA Lab、ライブ、クロス OS、またはパッケージボックスが不要な場合にのみ、手動 CI を直接実行します。Android を含まない直接 CI には最初のコマンドを使用します。直接のリリース候補 CI で Android を対象にする必要がある場合は、`include_android=true` を追加します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` を通じて `OpenClaw Release Checks` 内にあり、さらにリリースモードの `install-smoke` ワークフローにも含まれます。ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker の対象範囲:

- 低速な Bun グローバルインストールスモークを有効にしたフルインストールスモーク
- ターゲット SHA ごとのルート Dockerfile スモークイメージの準備/再利用。QR、root/gateway、installer/Bun のスモークジョブは、個別の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパスの Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`、および `openwebui`
- 要求された場合、専用の大容量ディスクランナー上での OpenWebUI 対象範囲
- 分割された同梱 Plugin のインストール/アンインストールレーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- リリースチェックにライブスイートが含まれる場合のライブ/E2E プロバイダースイートおよび Docker ライブモデル対象範囲

再実行の前に Docker アーティファクトを使用してください。リリースパスのスケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズのタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。対象を絞った復旧では、すべてのリリースチャンクを再実行する代わりに、再利用可能なライブ/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成される再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージの入力が含まれるため、失敗したレーンで同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これはエージェント動作およびチャネルレベルのリリースゲートであり、Vitest や Docker のパッケージ処理とは別です。

リリース QA Lab の対象範囲:

- エージェント型パリティパックを使用して、OpenAI 候補レーンと `anthropic/claude-opus-4-8` ベースラインを比較するモックパリティレーン
- `qa-live-shared` 環境を使用する高速ライブ Matrix QA プロファイル
- Convex CI 認証情報リースを使用するライブ Telegram QA レーン
- リリーステレメトリに明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke`、または `pnpm qa:observability:smoke`

このボックスは「リリースが QA シナリオおよびライブチャネルフローで正しく動作するか」という問いに答えるために使用します。リリースを承認する際は、パリティ、Matrix、Telegram レーンのアーティファクト URL を保持してください。Matrix の全範囲は、既定のリリースクリティカルレーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージボックスは、インストール可能な製品のゲートです。`Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。リゾルバーは候補を Docker E2E が使用する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージのバージョンと SHA-256 を記録し、ワークフローハーネスの ref をパッケージソースの ref とは別に保持します。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または特定の OpenClaw リリースバージョン
- `source=ref`: 選択した `workflow_ref` ハーネスを使用して、信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパック
- `source=url`: 必須の `package_sha256` を指定して、公開 HTTPS `.tgz` をダウンロード。URL 認証情報、既定以外の HTTPS ポート、プライベート/内部/特殊用途のホスト名または解決済みアドレス、安全でないリダイレクトは拒否される
- `source=trusted-url`: `.github/package-trusted-sources.json` の名前付きポリシーにある `trusted_source_id` と必須の `package_sha256` を使用して、HTTPS `.tgz` をダウンロード。`source=url` に入力レベルのプライベートネットワーク迂回を追加するのではなく、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにこれを使用する
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、準備済みリリースパッケージアーティファクト、`source=artifact`、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` を指定して Package Acceptance を実行します。Package Acceptance は、同じ解決済み tarball に対して、移行、更新、root 管理の VPS アップグレード、設定済み認証での更新再起動、ライブ ClawHub Skills インストール、古い Plugin 依存関係のクリーンアップ、オフライン Plugin フィクスチャ、Plugin 更新、Plugin コマンドバインディングのエスケープ強化、Telegram パッケージ QA を実行します。ブロッキングリリースチェックは、既定で最新の公開済みパッケージをベースラインとして使用します。`run_release_soak=true`、`release_profile=stable`、または `release_profile=full` を指定したベータプロファイルでは、公開済みアップグレードサバイバーのスイープが `last-stable-4` に加え、固定された `2026.4.23`、`2026.5.2`、`2026.4.15` のベースラインと `reported-issues` シナリオに拡張されます。すでにリリース済みの候補には `source=npm`、公開前の SHA に基づくローカル npm tarball には `source=ref`、メンテナー所有のエンタープライズ/プライベートミラーには `source=trusted-url`、別の GitHub Actions 実行によってアップロードされた準備済み tarball には `source=artifact` を指定して Package Acceptance を使用します。

これは、以前は Parallels が必要だったパッケージ/更新の対象範囲の大部分に代わる GitHub ネイティブの仕組みです。OS 固有のオンボーディング、インストーラー、プラットフォーム動作についてはクロス OS リリースチェックも引き続き重要ですが、パッケージ/更新の製品検証では Package Acceptance を優先してください。

更新および Plugin 検証の標準チェックリストは、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)です。Plugin のインストール/更新、doctor のクリーンアップ、または公開パッケージの移行変更を、ローカル、Docker、Package Acceptance、リリースチェックのどのレーンで証明するかを決定する際に使用してください。すべての安定版 `2026.4.23+` パッケージからの網羅的な公開済み更新移行は、別の手動 `Update Migration` ワークフローであり、Full Release CI の一部ではありません。

従来の package-acceptance の緩和措置は、意図的に期限が限定されています。`2026.4.25` までのパッケージでは、すでに npm に公開済みのメタデータ不足に対して互換性パスを使用できます。対象となるのは、tarball に存在しないプライベート QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball から生成した git フィクスチャに存在しないパッチファイル、永続化された `update.channel` の欠落、従来の Plugin インストール記録の場所、マーケットプレイスのインストール記録の永続化の欠落、`plugins update` 中の設定メタデータ移行です。公開済みの `2026.4.26` パッケージでは、すでにリリースされたローカルビルドのメタデータスタンプファイルについて警告になる場合があります。それ以降のパッケージは最新のパッケージ契約を満たす必要があり、同じ不足があるとリリース検証に失敗します。

リリースに関する問いが実際のインストール可能なパッケージについてである場合は、より広範な Package Acceptance プロファイルを使用します。

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

- `smoke`: パッケージのインストール、チャネル/エージェント、Gateway ネットワーク、設定の再読み込みを迅速に確認するレーン
- `package`: インストール/更新/再起動/Plugin パッケージの契約に加え、実際の ClawHub skill インストール証明を確認するレーン。これはリリースチェックのデフォルト
- `product`: `package` に加え、MCP チャネル、Cron/サブエージェントのクリーンアップ、OpenAI Web 検索、OpenWebUI を確認するレーン
- `full`: OpenWebUI を含む Docker リリースパスのチャンク
- `custom`: 対象を絞った再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または `telegram_mode=live-frontier` を有効にします。ワークフローは、解決済みの `package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの Telegram ワークフローでは、公開後のチェック用として、公開済み npm 指定も引き続き受け付けます。

## 通常リリースの公開自動化

ベータ、`latest`、Plugin、GitHub Release、プラットフォームの公開では、
`OpenClaw Release Publish` が通常の変更を伴うエントリポイントです。毎月の
`.33+` npm 専用 extended-stable パスでは、このオーケストレーターを使用しません。
通常のワークフローは、リリースに必要な順序で trusted publisher ワークフローを
オーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*`（alpha プレリリースの場合は Tideclaw alpha ブランチも可）から到達可能であることを確認します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` を指定して `Plugin NPM Release` をディスパッチします。
5. 同じスコープと SHA で `Plugin ClawHub Release` をディスパッチします。
6. 保存済みの `full_release_validation_run_id` と正確な実行試行回数を確認した後、リリースタグ、npm dist-tag、保存済みの `preflight_run_id` を指定して `OpenClaw NPM Release` をディスパッチします。
7. 安定版リリースでは、GitHub リリースをドラフトとして作成または更新し、明示的な `windows_node_tag` と候補で承認済みの `windows_node_installer_digests` を指定して `Windows Node Release` をディスパッチし、正規の Windows インストーラー/チェックサムアセットを確認します。また、`Android Release` をディスパッチして、正確なタグの署名済み APK、チェックサム、プロベナンスをビルドします。ドラフトを公開する前に、両方のネイティブアセット契約を確認します。

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

安定版を直接 `latest` に昇格する場合は、明示的に指定します。

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

下位レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、対象を絞った修復または再公開作業にのみ使用します。`OpenClaw Release Publish` は、`publish_openclaw_npm=true` の場合に `plugin_publish_scope=selected` を拒否するため、`@openclaw/diffs-language-pack` を含む公開可能なすべての公式 Plugin なしでコアパッケージがリリースされることはありません。選択した Plugin を修復する場合は、`plugin_publish_scope=selected` および `plugins=@openclaw/name` とともに `publish_openclaw_npm=false` を設定するか、子ワークフローを直接ディスパッチします。

ClawHub の初回公開ブートストラップは例外です。信頼済みの `main` から `Plugin ClawHub New`
をディスパッチし、完全な対象リリース SHA を `ref` で渡します。
ブートストラップワークフロー自体は、リリースタグまたはブランチから決して実行しないでください。

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

タグ付け前の検証では `dry_run=true` が必須で、リリースタグと親実行の
入力は拒否され、`main` または `release/*` から到達可能な正確な対象のみを
受け付けます。ClawHub の認証情報の読み込み、パッケージバイトの公開、
trusted publisher 設定の変更は行いません。それでもワークフローは実際のレジストリ計画を解決し、
シークレットのないジョブでのみ対象をチェックアウトしてパックし、ロック済みの
ClawHub ツールチェーンを実体化して、リリースタグが存在する前に不変アーティファクトとパッケージの
スラッグ/アイデンティティを検証します。シークレットのないパックジョブが
完了してから、`clawhub-plugin-bootstrap` 環境を承認してください。この保護された検証ジョブには、
認証情報も変更コマンドもありません。

承認済みのドライラン、またはタグ付け後の実際のブートストラップには、正確な
リリースタグに加えて、親 `OpenClaw Release Publish` の実行 ID、試行回数、
ブランチを含める必要があります。親は、自身のワークフロー SHA と、`Plugin ClawHub New`
用の別の正確な信頼済み `main` SHA を証明します。子の実行と保護された
環境の各承認は、その承認済みの子 SHA と一致する必要があります。リリースタグは、
公開の各試行および trusted publisher の各変更の前に再確認されます。

パックジョブは、名前、Actions アーティファクト ID/ダイジェスト、
生成元の実行/試行、対象 SHA、パッケージごとの tarball の SHA-256/サイズが
検証ジョブと保護されたジョブに引き継がれる、単一の不変アーティファクトを
アップロードします。保護されたジョブは信頼済みの `main`
ツールのみをチェックアウトし、GitHub API を介してアーティファクトのタプルを検証し、
正確なアーティファクト ID でダウンロードして、すべての tarball を再ハッシュし、固定された CLI の USTAR 正規化ルールによりローカル TAR パスと
パッケージのアイデンティティを検証します。その後、各候補は固定された CLI の公開ドライランを
通過します。このドライランは、レジストリ検索または認証の前に終了します。認証情報ジョブの事前フィルターでは、圧縮済み ClawPack を
120 MiB、ファイルペイロードの合計を 50 MiB、展開後の TAR データを 64 MiB、
TAR エントリ数を 10,000 に制限します。既存パッケージの trusted publisher 修復は
引き続き設定のみですが、対象をパックし、trusted publisher
設定を変更する前に、要求されたタグと正確なレジストリのバイトおよびメタデータが一致する必要があります。
公開後の検証では ClawHub アーティファクトをダウンロードし、
同じ SHA-256 とサイズであることを要求します。失敗したジョブのみを再実行する復旧では、正確な生成元ジョブが
正常に完了した場合に限り、以前の試行のパッケージアーティファクトを再利用できます。
最終証拠は、ロック済みの ClawHub バージョン、ロックの
SHA-256、npm integrity にも関連付けられます。不一致がある場合は、新しいパッケージバージョンが必要です。

## NPM ワークフローの入力

`OpenClaw NPM Release` は、以下のオペレーター制御の入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1`、`v2026.4.2-alpha.1` などの必須リリースタグ。`preflight_only=true` の場合は、検証のみの事前確認用として、現在のワークフローブランチの完全な 40 文字のコミット SHA も指定できます
- `preflight_only`: 検証/ビルド/パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 既存の正常終了した事前確認実行 ID。実際の公開パスでは必須で、ワークフローが再ビルドする代わりに準備済みの tarball を再利用できるようにします
- `full_release_validation_run_id`: このタグ/SHA に対して正常終了した `Full Release Validation` の実行 ID。実際の公開では必須です。ベータ公開は警告付きで事前確認のみでも続行できますが、安定版/`latest` への昇格では引き続き必須です。
- `full_release_validation_run_attempt`: `full_release_validation_run_id` と組み合わせる正確な正の実行試行回数。再実行によって公開中の承認証拠が変更されないようにするため、実行 ID を指定する場合は常に必須です。
- `release_publish_run_id`: 承認済みの `OpenClaw Release Publish` 実行 ID。このワークフローがその親からディスパッチされる場合（bot アクターによる実公開呼び出し）に必須です
- `plugin_npm_run_id`: 正常終了した正確なヘッドの `Plugin NPM Release` 実行 ID。実際の `extended-stable` コア公開に必須です
- `npm_dist_tag`: 公開パスの npm 対象タグ。`alpha`、`beta`、`latest`、`extended-stable` を受け付け、デフォルトは `beta` です。最終パッチ `33` 以降では `extended-stable` を使用する必要があります。デフォルトでは、`extended-stable` はそれより前のパッチを拒否し、最終版以外のタグは常に拒否します。
- `bypass_extended_stable_guard`: テスト専用のブール値で、デフォルトは `false`。`npm_dist_tag=extended-stable` とともに指定すると、リリースのアイデンティティ、アーティファクト、承認、読み戻しのチェックを維持しながら、毎月の extended-stable 適格性をバイパスします。

`Plugin NPM Release` は、既存のリリース
動作には `npm_dist_tag=default`、ガード付きの毎月のパスには `npm_dist_tag=extended-stable` を受け付けます。
extended-stable オプションには、`publish_scope=all-publishable`、空の
`plugins` 入力、`33` 以上の最終パッチ、正確な先端にある正規の
`extended-stable/YYYY.M.33` ブランチが必要です。Plugin の
`latest` または `beta` を変更することはありません。新しいパッケージバージョンには、
OIDC trusted publication（`npm publish --tag extended-stable`）を通じて `extended-stable` がアトミックに付与されます。この
ソースワークフローでは、トークン認証された `npm dist-tag add` を使用しません。再試行では、
npm にすでに存在する正確なバージョンをスキップし、その後、完全な
読み戻しによってすべての正確なパッケージと `extended-stable` タグが収束したことを確認できない限り、フェイルクローズします。

`OpenClaw Release Publish` は、以下のオペレーター制御の入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 正常終了した `OpenClaw NPM Release` の事前確認実行 ID。`publish_openclaw_npm=true` または `plugin_publish_scope=all-publishable` の場合に必須です
- `full_release_validation_run_id`: 正常終了した `Full Release Validation` の実行 ID。`publish_openclaw_npm=true` または `plugin_publish_scope=all-publishable` の場合に必須です
- `full_release_validation_run_attempt`: `full_release_validation_run_id` と組み合わせる正確な正の試行回数。実行 ID を指定する場合は常に必須です
- `windows_node_tag`: 正確なプレリリースではない `openclaw/openclaw-windows-node` リリースタグ。OpenClaw の安定版公開に必須です
- `windows_node_installer_digests`: 現在の Windows インストーラー名を固定された `sha256:` ダイジェストに対応付ける、候補で承認済みのコンパクトな JSON マップ。OpenClaw の安定版公開に必須です
- `npm_telegram_run_id`: 最終リリース証拠に含める、正常終了したオプションの `NPM Telegram Beta E2E` 実行 ID
- `npm_dist_tag`: OpenClaw パッケージの npm 対象タグ。`alpha`、`beta`、`latest` のいずれか
- `plugin_publish_scope`: デフォルトは `all-publishable`。`selected` は、`publish_openclaw_npm=false` を指定した対象限定の Plugin 専用修復作業にのみ使用します
- `plugins`: `plugin_publish_scope=selected` の場合に指定する、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin 専用の修復オーケストレーターとして使用する場合にのみ `false` を設定します
- `release_profile`: リリース証拠の概要に使用するリリース網羅性プロファイル。デフォルトは `from-validation` で、検証マニフェストから読み取ります。または、`beta`、`stable`、`full` で上書きできます
- `wait_for_clawhub`: ClawHub サイドカーによって npm の利用可能化がブロックされないよう、デフォルトは `false`。ワークフローの完了に ClawHub の完了も含める必要がある場合にのみ `true` を設定します

`OpenClaw Release Checks` は、以下のオペレーター制御の入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを使用するチェックでは、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: ベータリリースチェックで、網羅的な実環境/E2E、Docker リリースパス、およびすべての旧バージョンからのアップグレード耐久 soak を有効にします。`release_profile=stable` および `release_profile=full` では強制的に有効になります。

ルール:

- パッチ `33` 未満の通常の最終版および修正版は、`beta` または `latest` のいずれかに公開できます。パッチ `33` 以上の最終版は `extended-stable` に公開する必要があり、この境界における修正サフィックス付きバージョンは拒否されます。
- ベータプレリリースタグは `beta` にのみ、アルファプレリリースタグは `alpha` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA の入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、事前検証時に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは公開を続行する前に、そのメタデータを検証します

## 通常の beta/latest 安定版リリース手順

この従来の手順は、Plugin、GitHub Release、Windows、およびその他のプラットフォーム作業も担う通常のオーケストレーションされたリリース向けです。このページの冒頭に記載されている、毎月の `.33+` npm 専用 extended-stable パスではありません。

通常のオーケストレーションされた安定版リリースを作成する場合：

1. `preflight_only=true` を指定して `OpenClaw NPM Release` を実行します。タグが存在する前は、現在の完全なワークフローブランチのコミット SHA を使用して、事前検証ワークフローの検証専用ドライランを実行できます。
2. 通常のベータ優先フローでは `npm_dist_tag=beta` を選択します。意図的に安定版を直接公開する場合にのみ `latest` を選択します。
3. 1 つの手動ワークフローから通常の CI に加えて、ライブプロンプトキャッシュ、Docker、QA Lab、Matrix、Telegram のカバレッジを実行する場合は、リリースブランチ、リリースタグ、または完全なコミット SHA に対して `Full Release Validation` を実行します。意図的に決定論的な通常のテストグラフのみが必要な場合は、代わりにリリース参照に対して手動の `CI` ワークフローを実行します。
4. 配布する署名済み x64 および ARM64 インストーラーに対応する、正確なプレリリースではない `openclaw/openclaw-windows-node` リリースタグを選択します。それを `windows_node_tag` として保存し、検証済みのダイジェストマップを `windows_node_installer_digests` として保存します。リリース候補ヘルパーは両方を記録し、生成する公開コマンドに含めます。
5. 成功した `preflight_run_id`、`full_release_validation_run_id`、および正確な `full_release_validation_run_attempt` を保存します。
6. 信頼済みの `main` から、同じ `tag`、同じ `npm_dist_tag`、選択した `windows_node_tag`、保存した `windows_node_installer_digests`、保存した `preflight_run_id`、`full_release_validation_run_id`、および `full_release_validation_run_attempt` を指定して `OpenClaw Release Publish` を実行します。OpenClaw npm パッケージを昇格する前に、外部化された Plugin を npm と ClawHub に公開します。
7. リリースが `beta` に公開された場合は、`openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その安定版を `beta` から `latest` に昇格します。
8. リリースを意図的に `latest` に直接公開し、`beta` も同じ安定版ビルドを直ちに参照する必要がある場合は、同じリリースワークフローを使用して両方の dist-tag を安定版に向けるか、スケジュールされた自己修復同期によって後で `beta` を移動させます。

dist-tag の変更処理は、引き続き `NPM_TOKEN` が必要なため、リリース台帳リポジトリに置かれています。一方、ソースリポジトリでは OIDC のみの公開を維持します。これにより、直接公開パスとベータ優先の昇格パスの両方が文書化され、運用担当者から確認可能な状態に保たれます。

メンテナーがローカル npm 認証にフォールバックする必要がある場合、1Password CLI（`op`）コマンドは専用の tmux セッション内でのみ実行してください。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内に限定することで、プロンプト、アラート、OTP の処理を監視可能にし、ホストでアラートが繰り返し発生するのを防げます。

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
