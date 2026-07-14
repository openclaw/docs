---
read_when:
    - 公開リリースチャンネルの定義を検索しています
    - リリース検証またはパッケージ受け入れテストの実行
    - バージョンの命名規則とリリース頻度について調べる
summary: リリースレーン、運用担当者向けチェックリスト、検証ボックス、バージョン命名、およびリリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-07-14T14:01:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 09620a4ba58eb218b0b827a88bd91349bf3b9a6cb2d76fd0c8f0636153809db7
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw は現在、ユーザー向けに次の 3 つの更新チャネルを提供しています。

- stable: 既存の昇格済みリリースチャネル。個別の CLI/チャネルのマイルストーンが実装されるまでは、引き続き npm `latest` を通じて解決されます
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

これとは別に、リリース運用担当者は、完了した直前の月のコア
パッケージを、パッチ `33` から npm `extended-stable` に公開できます。当月の
通常の最終リリース系列は引き続き npm `latest` を使用します。この運用側の公開先の
分離だけでは、CLI の更新チャネル解決は変更されません。

Tideclaw アルファビルドは、別の内部プレリリース系列（npm dist-tag `alpha`）であり、[NPM ワークフロー入力](#npm-workflow-inputs)および[リリーステストボックス](#release-test-boxes)で説明されています。

## バージョン命名

- 月次 npm 延長安定版のリリースバージョン: `YYYY.M.PATCH`、`PATCH >= 33`、git タグ `vYYYY.M.PATCH`
- 日次/通常の最終リリースバージョン: `YYYY.M.PATCH`、`PATCH < 33`、git タグ `vYYYY.M.PATCH`
- 通常のフォールバック修正リリースバージョン: `YYYY.M.PATCH-N`、git タグ `vYYYY.M.PATCH-N`
- ベータプレリリースバージョン: `YYYY.M.PATCH-beta.N`、git タグ `vYYYY.M.PATCH-beta.N`
- アルファプレリリースバージョン: `YYYY.M.PATCH-alpha.N`、git タグ `vYYYY.M.PATCH-alpha.N`
- 月またはパッチをゼロ埋めしないこと
- `PATCH` は、暦日ではなく、連番の月次リリーストレイン番号です。通常の最終リリースとベータリリースは現在のトレインを進めます。アルファのみのタグはベータ/通常リリースのパッチ番号を消費も進行もさせないため、ベータまたは通常リリースのトレインを選択するときは、パッチ番号が大きい旧来のアルファ専用タグを無視してください。
- アルファ/ナイトリービルドは、次の未リリースのパッチトレインを使用し、ビルドを繰り返す際は `alpha.N` のみを増分します。そのパッチにベータが作成された後、新しいアルファビルドは次のパッチへ移ります。
- npm のバージョンは不変です。公開済みタグを削除、再公開、再利用してはなりません。代わりに、次のプレリリース番号または次の月次パッチを作成してください。
- `latest` は引き続き現在の通常/日次 npm 系列に従います。`beta` は現在のベータインストール対象です
- `extended-stable` は、パッチ `33` から始まる、サポート対象の直前月の npm パッケージを意味します。パッチ `34` 以降は、その月次系列のメンテナンスリリースです
- 通常の最終リリースと通常の修正リリースは、デフォルトで npm `beta` に公開されます。リリース運用担当者は、`latest` を明示的に対象とするか、検証済みのベータビルドを後から昇格できます
- 専用の月次延長安定版パスは、コア npm パッケージと、npm に公開可能なすべての公式 Plugin を、まったく同一のバージョンで公開します。ClawHub への Plugin 公開、macOS または Windows の成果物、GitHub Release、非公開リポジトリの dist-tag、Docker イメージ、モバイル成果物、Web サイトのダウンロードは公開しません。
- 通常の最終リリースでは毎回、npm パッケージ、macOS アプリ、署名済みスタンドアロン Android APK、署名済み Windows Hub インストーラーをまとめて出荷します。ベータリリースでは通常、まず npm/パッケージの経路を検証して公開し、明示的に要求されない限り、ネイティブアプリのビルド、署名、公証、昇格は通常の最終リリース用に留保します。

## リリース頻度

- リリースはベータ優先で進みます。stable は、最新のベータが検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.PATCH` ブランチでリリースを作成します。これにより、リリースの検証と修正が `main` での新規開発を妨げません
- ベータタグがプッシュまたは公開された後に修正が必要になった場合、メンテナーは古いタグを削除または再作成せず、次の `-beta.N` タグを作成します
- 詳細なリリース手順、承認、認証情報、復旧メモはメンテナー専用です

## 月次 npm 専用の延長安定版公開

これは、後述する通常のリリース手順に対する専用の例外です。完了した月
`YYYY.M` について `extended-stable/YYYY.M.33` を作成し、同じブランチから
`vYYYY.M.33` 以降のメンテナンスパッチを公開します。リリース
タグ、ブランチ先端、チェックアウト、パッケージバージョン、npm プリフライト、Full Release
Validation の実行は、すべて同一のコミットを示す必要があります。保護された `main` には、
パッチ `33` 未満の、暦上で厳密に後の月の最終バージョンが
すでに含まれている必要があります。`main` が 1 か月を超えて進んだ後も、メンテナンスパッチは
引き続き対象となります。

対象の延長安定版ブランチ上で、ルートパッケージを `YYYY.M.P` に更新し、
`pnpm release:prep` を実行して、公開可能なすべての拡張パッケージが
同じバージョンであることを確認します。生成された変更をすべてコミットしてプッシュし、そのコミットに
不変の `vYYYY.M.P` タグを作成してプッシュし、得られた完全な SHA を記録します。
ワークフローはこの準備済みツリーを使用します。バージョンの更新や同期は
ワークフローによって自動的には行われません。

対象の準備済みブランチ先端から npm プリフライトと Full Release Validation を
実行し、両方の実行 ID と、成功した Full Release Validation の
実行試行番号を保存します。

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
`extended-stable` dist-tag とは別であり、意図的に
変更されません。

両方の実行が成功した後、同じブランチ先端から、npm に公開可能なすべての公式 Plugin を
公開します。パッチ `P` は `33` 以上である必要があります。完全なリリース
SHA を `ref` として渡し、完全なマトリクスとレジストリの読み戻しを待ってから、
成功した Plugin NPM Release の実行 ID を保存します。

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

このワークフローは、ソースが変更されていないパッケージも含め、
通常の準備済み `all-publishable` パッケージインベントリを使用します。成功する前に、各パッケージの正確な内容と
各 Plugin の `extended-stable` タグを検証します。部分的な実行が
失敗した場合は、同じコマンドを再実行してください。すでに公開済みのパッケージは再利用され、
欠落または古い Plugin タグは npm リリース環境下で整合され、
最終的な読み戻しでは引き続き完全なパッケージセットが対象となります。

Plugin ワークフローが成功し、npm リリース環境の準備が整った後、
プリフライトで生成されたコア tarball をそのまま公開します。コアの公開処理は、
参照先の Plugin 実行が、同じ正規ブランチかつ
まったく同じソース SHA 上で `completed/success` であることを検証します。

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

月次 `.33` または保護された `main` の月ポリシーを意図的に
満たせないフォークまたは非本番リハーサルでは、npm プリフライトと公開の
両方のディスパッチに `-f bypass_extended_stable_guard=true` を追加します。デフォルトは
`false` です。このバイパスは `npm_dist_tag=extended-stable` の場合にのみ受け入れられ、
ワークフローの概要に記録されます。正規の `extended-stable/YYYY.M.33` ワークフロー ref、
ブランチ先端/タグ/チェックアウトの一致、最終タグの構文、パッケージ/タグバージョンの
一致、参照先実行とマニフェストの同一性、tarball の来歴、
環境承認、レジストリの読み戻し、セレクター修復の証拠は
バイパスされません。

公開ワークフローは、参照先のプリフライト、検証、Plugin の
各実行 ID、準備済み tarball のダイジェスト、コアレジストリのセレクターを検証します。
ワークフローの成功後、結果を別途確認してください。

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

両方のコマンドが `YYYY.M.P` を返す必要があります。公開に成功してもセレクターの
読み戻しに失敗した場合、不変のパッケージバージョンを再公開してはなりません。
失敗したワークフローの常時実行される概要に出力された
単一の `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復コマンドを使用し、その後、両方の
独立した読み戻しを繰り返します。以前のセレクターへのロールバックは別の運用判断であり、
読み戻しの修復経路ではありません。

公開サポートドキュメントでは、当初、Slack、Discord、Codex を
サポート対象の延長安定版 Plugin サーフェスとして指定します。この一覧はサポートに関する表明であり、
リリースコードの許可リストではありません。npm に公開可能なすべての公式 Plugin は、
まったく同じバージョンの公開経路に従います。

後述する通常のチェックリストが、引き続きベータ、`latest`、GitHub Release、
Plugin、macOS、Windows、その他のプラットフォームへの公開を管理します。この npm 専用の
延長安定版パスでは、それらの手順を実行しないでください。

## 通常リリースの運用チェックリスト

このチェックリストは、リリースフローの公開部分を示します。非公開の認証情報、署名、公証、dist-tag の復旧、緊急ロールバックの詳細は、メンテナー専用のリリースランブックに記載されています。

1. 現在の `main` から開始します。最新をプルし、対象コミットがプッシュ済みであること、および `main` CI がブランチ作成に十分な状態であることを確認します。
2. そのコミットから `release/YYYY.M.PATCH` を作成します。バックポートは任意です。運用担当者が選択したものだけを適用してください。必要なすべてのバージョン位置を更新し、`pnpm release:prep` を実行し、リリース修正と必要なフォワードポートを完了して、`src/plugins/compat/registry.ts` と `src/commands/doctor/shared/deprecation-compat.ts` をレビューします。
3. 変更履歴追加前の、製品として完成したコミットを **Code SHA** として固定します。決定論的なソースプリフライトを実行してから、`node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH` を使用します。これにより、信頼されたワークフローツールが固定され、完全な Vitest、Docker、QA、パッケージ、パフォーマンスの各マトリクスが正確な Code SHA を対象とします。
4. 編集する前に失敗を分類します。製品またはコードの失敗では新しい Code SHA が作成され、その SHA に対する完全な検証の成功が必要です。ワークフロー、ハーネス、認証情報、承認、インフラストラクチャの失敗は、それぞれの所有サーフェスで修復し、同じ Code SHA に対して再実行します。
5. Code SHA が成功した後にのみ、到達可能な最後の出荷済みタグ以降のマージ済み PR と直接コミットから、先頭の `CHANGELOG.md` セクションを生成します。各項目はユーザー向けとし、重複を排除してください。分岐した出荷済みタグまたは後続のフォワードポートによって、リリース済みの PR が再度関連付けられる場合は、`--shipped-ref` として明示的に渡します。
6. `CHANGELOG.md` のみをコミットします。このコミットが **Release SHA** です。Code SHA から Release SHA までの完全な差分は、正確に `CHANGELOG.md` だけでなければなりません。それ以外のパスが変更されている場合、リリースは手順 2 に戻ります。
7. 証拠の再利用を有効にして、Release SHA に対する SHA 固定の Full Release Validation を実行します。軽量な親実行は `changelog-only-release-v1` を記録し、成功した Code SHA を指し、製品の子レーンを一切ディスパッチしない必要があります。これは製品の証拠を再利用しますが、パッケージのバイト列は再利用しません。
8. Release SHA/タグに対し、`preflight_only=true` を指定して `OpenClaw NPM Release` を実行します。成功した `preflight_run_id` を保存します。これにより、最終的な変更履歴を含む正確なパッケージバイト列がビルドおよび検査されます。
9. Release SHA にタグを付けた後、検証または npm プリフライトを再度ディスパッチする代わりに、成功した Release-SHA 検証親実行と npm プリフライトを指定して候補版ヘルパーを実行します。

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   安定版では、`--windows-node-tag vX.Y.Z` も渡します。このヘルパーは、リリースノートの出所、npm プリフライトのバイト列、Parallels のインストール／更新証跡、Telegram パッケージ証跡、Plugin 公開計画を検証してから、公開コマンドを出力します。

   `OpenClaw Release Publish` は、選択された、または公開可能なすべての Plugin パッケージを npm に、同じセットを ClawHub に並列でディスパッチし、Plugin の npm 公開が成功すると、準備済みの OpenClaw npm プリフライトアーティファクトを対応する dist-tag で昇格させます。リリースチェックアウトは製品／データのルートのまま維持されますが、計画と最終検証は、厳密に信頼済みのワークフローソースのチェックアウトから実行されるため、古いリリースコミットが旧式のリリースツールを暗黙に使用することはありません。公開用の子処理を開始する前に、GitHub リリース本文を正確にレンダリングしてキャッシュします。一致する完全な `CHANGELOG.md` セクションが GitHub の 125,000 文字制限と、レンダラーの対応する 125,000 バイトの安全上限に収まる場合、ページには見出しを含むそのままの `## YYYY.M.PATCH` セクションが含まれます。ソースセクションが収まらない場合、ページはグループ化された編集済み注記をそのまま維持し、サイズ超過のコントリビューション記録を、タグに固定された `CHANGELOG.md` 内の完全な記録への安定したリンクに置き換えます。部分的な記録や途中で切れた箇条書きは決して公開されません。ワークフローは `### Release verification` を追加する前に完全版またはコンパクト版の本文を選択します。証跡末尾の追加で上限を超える場合は、正規の本文を維持し、代わりに不変の添付証跡を使用します。npm `latest` に公開された安定版リリースは GitHub の最新リリースになり、npm `beta` に維持された安定版メンテナンスリリースは GitHub `latest=false` 付きで作成されます。また、リリース後のインシデント対応のため、プリフライト依存関係証跡、完全検証マニフェスト、公開後のレジストリ検証証跡を GitHub リリースにアップロードします。子実行 ID を直ちに出力し、ワークフロートークンに承認権限があるリリース環境ゲートを自動承認し、失敗した子ジョブをログ末尾付きで要約し、ドラフト GitHub リリースページを先に作成して、OpenClaw の npm 公開と並行して Windows および Android アセットを昇格させます。それらのステージが成功すると、リリースページと依存関係証跡を確定し、OpenClaw npm を公開する場合は ClawHub の完了を待ってから、信頼済み main のベータ検証ツールを実行します。さらに、GitHub リリース、npm パッケージ、選択された Plugin npm パッケージ、選択された ClawHub パッケージ、子ワークフロー実行 ID、任意の NPM Telegram 実行 ID に関する公開後証跡をアップロードします。ClawHub ブートストラップ検証ツールには、信頼済み main の正確なワークフローパスと SHA、生成元と終了時の実行試行、リリース SHA、要求されたパッケージセット、不変のパッケージアーティファクトタプル、終了時のレジストリ読み戻しアーティファクトが必要です。成功した従来のリリース ref 実行は受け入れられません。

   その後、公開済みの `openclaw@YYYY.M.PATCH-beta.N` または `openclaw@beta` パッケージに対して、公開後のパッケージ受け入れテストを実行します。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、次の対応するプレリリース番号を作成します。以前のものを削除または書き換えてはいけません。

10. 公開試行に失敗した場合、障害によって製品または変更履歴の欠陥が証明されない限り、Release SHA は変更しません。成功済みの不変な子処理とアーティファクトを再利用して続行し、すでに成功したパッケージバージョンを再ビルドまたは再公開してはいけません。
11. 安定版では、精査済みのベータ版またはリリース候補に必要な検証証跡が揃った後にのみ続行します。安定版の npm 公開も `OpenClaw Release Publish` を経由し、`preflight_run_id` によって成功済みのプリフライトアーティファクトを再利用します。安定版 macOS リリースの準備完了には、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および `main` 上で更新された `appcast.xml` も必要です。macOS 公開ワークフローは、リリースアセットの検証後、署名済み appcast を公開 `main` に自動的に公開します。ブランチ保護によって直接プッシュが阻止される場合は、appcast PR を作成または更新します。安定版 Windows Hub の準備完了には、OpenClaw GitHub リリース上の署名済み `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe`、`OpenClawCompanion-SHA256SUMS.txt` アセットが必要です。正確な署名済み `openclaw/openclaw-windows-node` リリースタグを `windows_node_tag` として、その候補承認済みインストーラーダイジェストマップを `windows_node_installer_digests` として渡します。`OpenClaw Release Publish` はリリースドラフトを維持し、`Windows Node Release` をディスパッチして、公開前に 3 つすべてのアセットを検証します。
12. 公開後、npm 公開後検証ツールを実行し、公開後のチャンネル証跡が必要な場合は任意のスタンドアロン公開済み npm Telegram E2E を実行し、必要に応じて dist-tag を昇格し、生成された GitHub リリースページを検証し、リリース告知手順を実行します。その後、安定版リリースの完了を宣言する前に、[安定版 main のクローズアウト](#stable-main-closeout)を完了します。

## 安定版 main のクローズアウト

`main` に実際に出荷されたリリース状態が反映されるまで、安定版の公開は完了していません。

1. 最新の `main` から開始します。これに対して `release/YYYY.M.PATCH` を監査し、`main` に存在しない実際の修正をフォワードポートします。リリース専用の互換性、テスト、検証アダプターを、より新しい `main` に無条件でマージしてはいけません。
2. 通常の手順では、`main` を出荷済みの安定版バージョンに設定します。遅延したクローズアウトでは、後の安定版 OpenClaw CalVer に進んだ後の `main` を使用できます。前回のリリースをクローズするためだけに、すでに開始済みのリリース系列をダウングレードしてはいけません。検証ツールは引き続き、出荷済みの正確な変更履歴セクションと appcast エントリを要求し、実際の `main` バージョンと SHA を記録します。ルートバージョンを変更した場合は `pnpm release:prep` を実行し、その後 `pnpm deps:shrinkwrap:generate` を実行します。
3. `main` 上の `CHANGELOG.md` の `## YYYY.M.PATCH` セクションを、タグ付けされたリリースブランチと完全に一致させます。mac リリースで公開された場合は、安定版の `appcast.xml` 更新を含めます。
4. オペレーターがそのリリース系列を明示的に開始するまで、`YYYY.M.PATCH+1`、ベータバージョン、または空の将来の変更履歴セクションを `main` に追加してはいけません。
5. `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check`、`OPENCLAW_TESTBOX=1 pnpm check:changed` を実行します。プッシュ後、安定版リリースの完了を宣言する前に、`origin/main` に出荷済みバージョンと変更履歴が含まれていることを検証します。
6. 各非公開ロールバック訓練後、リポジトリ変数 `RELEASE_ROLLBACK_DRILL_ID` と `RELEASE_ROLLBACK_DRILL_DATE` を最新の状態に維持します。

`OpenClaw Stable Main Closeout` は、安定版公開後に出荷済みバージョン、変更履歴、appcast を反映する `main` プッシュから開始します。不変の公開後証跡を読み取り、出荷済みタグをその完全リリース検証実行および公開実行に関連付けてから、安定版 main の状態、リリース、必須の安定版ソーク、ブロッキング対象のパフォーマンス証跡を検証します。不変のクローズアウトマニフェストとチェックサムを GitHub リリースに添付します。自動プッシュトリガーは、不変の公開後証跡が導入される前の従来のリリースをスキップし、そのスキップをクローズアウト完了として扱うことはありません。

完全なクローズアウトには、両方のアセットと一致するチェックサムが必要です。部分的なマニフェストは、記録済みの `main` SHA とロールバック訓練を再実行して同一のバイト列を再生成し、不足しているチェックサムを添付します。無効な組み合わせ、またはマニフェストを伴わないチェックサムは、引き続きブロッキング対象です。ロールバック訓練のリポジトリ変数がないプッシュトリガー実行は、クローズアウトを完了せずにスキップされます。訓練記録がない場合、または 90 日を超えて古い場合は、証跡に基づく手動クローズアウトも引き続きブロックされます。非公開の復旧コマンドは、メンテナー専用のランブックに残します。手動ディスパッチは、証跡に基づく安定版クローズアウトの修復または再実行にのみ使用します。

Release Publish の親処理が、不変の npm／Plugin 証跡を添付した後にのみ失敗した場合、まずすべての安定版プラットフォームアセットを修復して公開します。その後、メンテナーは `allow_failed_publish_recovery=true` を指定してクローズアウトを手動ディスパッチできます。このモードは、完了済みで失敗状態の親処理のみを受け入れます。さらに、通常の macOS／appcast チェックに加えて、正確な Android および Windows アセット契約、GitHub SHA-256 ダイジェスト、チェックサム検証、Android の出所、および Authenticode チェックと候補承認済みダイジェストが公開済みインストーラーと一致する、親処理からディスパッチされた成功済み Windows 昇格を要求します。自動プッシュによるクローズアウトでは、この復旧モードは決して有効になりません。

従来のフォールバック修正タグがベースパッケージの証跡を再利用できるのは、修正タグがベースの安定版タグと同じソースコミットに解決される場合のみです。その Android リリースでは、ベースタグの検証済み APK を再利用し、修正タグの出所を追加します。ソースが異なる修正では、独自のパッケージ証跡を公開して検証し、より大きい Android `versionCode` を使用する必要があります。

## リリースプリフライト

- リリースプリフライトの前に `pnpm check:test-types` を実行し、より高速なローカル `pnpm check` ゲートの対象外でも、テスト用 TypeScript が引き続き検証されるようにします。
- リリースプリフライトの前に `pnpm check:architecture` を実行し、より高速なローカルゲートの対象外でも、より広範なインポートサイクルおよびアーキテクチャ境界チェックが成功するようにします。
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、パッケージ検証ステップに必要な想定済みの `dist/*` リリースアーティファクトと Control UI バンドルを用意します。
- ルートバージョンの更新後、タグ付け前に `pnpm release:prep` を実行します。これは、バージョン／設定／API の変更後に不整合が発生しやすいすべての決定論的リリースジェネレーターを実行します。対象は、Plugin バージョン、npm shrinkwrap、Plugin インベントリ、基本設定スキーマ、同梱チャンネル設定メタデータ、設定ドキュメントのベースライン、Plugin SDK エクスポート、Plugin SDK API ベースラインです。`pnpm release:check` は、これらのガードをチェックモードで再実行し、Plugin SDK サーフェスの予算チェックも行います。パッケージリリースチェックを実行する前に、生成物の不整合によるすべての失敗を 1 回の実行で報告します。
- Plugin バージョン同期は、デフォルトで、公開可能な `@openclaw/ai` ランタイムパッケージ、公式 Plugin パッケージバージョン、既存の `openclaw.compat.pluginApi` 下限を OpenClaw リリースバージョンに更新します。このフィールドは、単なるパッケージバージョンのコピーではなく、Plugin SDK／ランタイム API の下限として扱います。古い OpenClaw ホストとの互換性を意図的に維持する Plugin 専用リリースでは、下限をサポート対象の最も古いホスト API に保ち、その選択を Plugin リリース証跡に記載します。
- リリース承認前に、手動の `Full Release Validation` ワークフローを実行し、1 つのエントリーポイントからすべてのプレリリーステストボックスを開始します。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動の `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab パリティ、Matrix、Telegram の各レーン用に `OpenClaw Release Checks` をディスパッチします。安定版および完全実行では、網羅的なライブ／E2E と Docker リリースパスのソークが常に含まれます。`run_release_soak=true` は、明示的なベータソーク用に維持されます。パッケージ受け入れは候補検証中に正規のパッケージ Telegram E2E を提供し、2 つ目のライブポーラーが同時実行されることを回避します。

  ベータ公開後に `release_package_spec` を指定すると、リリース tarball を再ビルドせずに、リリースチェック、パッケージ受け入れ、パッケージ Telegram E2E の間で出荷済み npm パッケージを再利用できます。Telegram でリリース検証の他の部分とは異なる公開済みパッケージを使用する必要がある場合にのみ、`npm_telegram_package_spec` を指定します。パッケージ受け入れでリリースパッケージ指定とは異なる公開済みパッケージを使用する必要がある場合は、`package_acceptance_package_spec` を指定します。Telegram E2E を強制せずに、検証が公開済み npm パッケージと一致することをリリース証跡レポートで証明する場合は、`evidence_package_spec` を指定します。

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- リリース作業を継続しながらパッケージ候補のサイドチャネル証明が必要な場合は、手動の `Package Acceptance` ワークフローを実行します。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使用します。現在の `workflow_ref` ハーネスを使用して信頼済みの `package_ref` ブランチ／タグ／SHA をパックするには `source=ref`、必須の SHA-256 と厳格な公開 URL ポリシーを備えた公開 HTTPS tarball には `source=url`、必須の `trusted_source_id` と SHA-256 を使用する名前付きの信頼済みソースポリシーには `source=trusted-url`、別の GitHub Actions 実行によってアップロードされた tarball には `source=artifact` を使用します。

  ワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用します。また、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` を使用して、同じ tarball に対する Telegram QA を実行できます。選択した Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージアーティファクトが候補となり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択します。`update-restart-auth` は候補パッケージをインストール済み CLI とテスト対象パッケージの両方として使用するため、候補の更新コマンドの管理対象再起動パスを検証します。

  例：

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  一般的なプロファイル：
  - `smoke`：インストール／チャネル／エージェント、Gateway ネットワーク、設定再読み込みの各レーン
  - `package`：OpenWebUI またはライブ ClawHub を使用しない、アーティファクトネイティブのパッケージ／更新／再起動／Plugin レーン
  - `product`：パッケージプロファイルに加え、MCP チャネル、Cron／サブエージェントのクリーンアップ、OpenAI ウェブ検索、OpenWebUI
  - `full`：OpenWebUI を含む Docker リリースパスのチャンク
  - `custom`：対象を絞った再実行のための正確な `docker_lanes` 選択

- リリース候補に対する決定論的な通常 CI カバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行します。手動 CI ディスパッチでは変更範囲によるスコープ設定を迂回し、Linux Node シャード、バンドル済み Plugin シャード、Plugin およびチャネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトのスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n の各レーンを強制実行します。単独の手動 CI 実行では、`include_android=true` を指定してディスパッチした場合にのみ Android を実行します。`Full Release Validation` はその入力を CI 子ワークフローに渡します。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- リリーステレメトリを検証する場合は `pnpm qa:otel:smoke` を実行します。ローカルの OTLP/HTTP レシーバーを介して QA-lab を実行し、Opik、Langfuse、その他の外部コレクターを必要とせずに、トレース、メトリクス、ログのエクスポートに加え、制限されたトレース属性とコンテンツ／識別子の墨消しを検証します。
- コレクターの互換性を検証する場合は `pnpm qa:otel:collector-smoke` を実行します。ローカルレシーバーでのアサーションの前に、同じ QA-lab OTLP エクスポートを実際の OpenTelemetry Collector Docker コンテナ経由でルーティングします。
- 保護された Prometheus スクレイピングを検証する場合は `pnpm qa:prometheus:smoke` を実行します。QA-lab を実行し、未認証のスクレイピングを拒否するとともに、リリースに不可欠なメトリクスファミリーにプロンプト内容、生の識別子、認証トークン、ローカルパスが含まれないことを検証します。
- ソースチェックアウトの OpenTelemetry および Prometheus スモークレーンを連続して実行するには `pnpm qa:observability:smoke` を実行します。
- タグ付きリリースの前には毎回 `pnpm release:check` を実行します。
- `OpenClaw NPM Release` の事前チェックでは、npm tarball をパックする前に依存関係のリリース証拠を生成します。npm アドバイザリ脆弱性ゲートはリリースをブロックします。推移的マニフェストのリスク、依存関係の所有権／インストール面、および依存関係変更レポートは、リリース証拠としてのみ使用されます。依存関係変更レポートは、リリース候補を到達可能な直前のリリースタグと比較します。事前チェックは依存関係の証拠を `openclaw-release-dependency-evidence-<tag>` としてアップロードし、準備済み npm 事前チェックアーティファクト内の `dependency-evidence/` にも埋め込みます。実際の公開パスはその事前チェックアーティファクトを再利用し、同じ証拠を `openclaw-<version>-dependency-evidence.zip` として GitHub リリースに添付します。
- タグの作成後に変更を伴う公開シーケンスを実行するには `OpenClaw Release Publish` を実行します。通常のベータ版および安定版の公開は、信頼済みの `main` からディスパッチします。リリースタグは引き続き正確な対象コミットを選択し、`release/YYYY.M.PATCH` 内を指す場合があります。Tideclaw アルファ版の公開は、対応するアルファブランチで引き続き実行します。成功した OpenClaw npm `preflight_run_id`、成功した `full_release_validation_run_id`、および正確な `full_release_validation_run_attempt` を渡し、意図的に対象を絞った修復を実行する場合を除き、Plugin 公開スコープはデフォルトの `all-publishable` のままにします。ワークフローは Plugin の npm 公開、Plugin の ClawHub 公開、OpenClaw の npm 公開を直列化し、外部化された Plugin より先にコアパッケージが公開されないようにします。Windows および Android のプロモーションは、ドラフトリリースページに対するコア npm 公開と並行して実行されます。公開の再実行は再開可能です。コア npm バージョンがすでに公開済みの場合、ワークフローがレジストリの tarball とタグの事前チェックアーティファクトの一致を証明した後、コアのディスパッチをスキップします。また、リリースに検証済みのアセット契約がすでに含まれている場合は Windows／Android のプロモーションをスキップするため、再試行では失敗したステージだけをやり直します。Plugin のみを対象とする修復には `plugin_publish_scope=selected` と空でない Plugin リストが必要です。Plugin のみの `all-publishable` 実行には、完全で不変の事前チェックおよび Full Release Validation の証拠が必要です。不完全な証拠は拒否されます。
- 安定版の `OpenClaw Release Publish` には、対応するプレリリースではない `openclaw/openclaw-windows-node` リリースが存在した後の正確な `windows_node_tag` と、候補として承認済みの `windows_node_installer_digests` マップが必要です。公開用の子ワークフローをディスパッチする前に、そのソースリリースが公開済みかつプレリリースではなく、必要な x64／ARM64 インストーラーを含み、その承認済みマップと引き続き一致することを検証します。その後、OpenClaw リリースがまだドラフトである間に、固定されたインストーラーダイジェストマップを変更せずに渡して `Windows Node Release` をディスパッチします。子ワークフローは、その正確なタグから署名済みの Windows Hub インストーラーをダウンロードして固定済みダイジェストと照合し、Windows ランナー上で Authenticode 署名に期待される OpenClaw Foundation 署名者が使用されていることを検証し、SHA-256 マニフェストを作成して、インストーラーとマニフェストを正規の OpenClaw GitHub リリースへアップロードします。その後、プロモーション済みアセットを再ダウンロードし、マニフェストへの登録とハッシュを検証します。親ワークフローは公開前に、現在の x64、ARM64、チェックサムのアセット契約を検証します。直接リカバリーでは、想定される契約アセットを固定済みソースバイトで置き換える前に、想定外の `OpenClawCompanion-*` アセット名を拒否します。

  `Windows Node Release` を手動でディスパッチするのはリカバリーの場合のみにし、常に正確なタグを渡してください。`latest` は決して使用せず、承認済みソースリリースの明示的な `expected_installer_digests` JSON マップも渡してください。ウェブサイトのダウンロードリンクは、現在の安定版リリースに対応する正確な OpenClaw リリースアセット URL を対象とするか、GitHub の latest リダイレクトが同じリリースを指していることを確認した後にのみ `releases/latest/download/...` を対象とする必要があります。関連リポジトリのリリースページだけにはリンクしないでください。

- リリースチェックは、独立した手動ワークフロー `OpenClaw Release Checks` で実行されるようになりました。また、リリース承認前に、QA Lab モックパリティレーンに加えて、高速なライブ Matrix プロファイルと Telegram QA レーンも実行します。ライブレーンは `qa-live-shared` 環境を使用し、Telegram は Convex CI 認証情報リースも使用します。Matrix のトランスポート、メディア、E2EE の全インベントリを並列で実行する場合は、手動の `QA-Lab - All Lanes` ワークフローを `matrix_profile=all` および `matrix_shards=true` とともに実行してください。
- OS 横断のインストールおよびアップグレードのランタイム検証は、公開されている `OpenClaw Release Checks` と `Full Release Validation` の一部であり、これらは再利用可能なワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出します。この分割は意図的なものです。実際の npm リリースパスは短く、決定論的で、アーティファクトに集中させる一方、時間のかかるライブチェックは独自のレーンに置き、公開を停滞させたりブロックしたりしないようにしています。
- シークレットを使用するリリースチェックは、`Full Release Validation` を通じて、または `main`/release ワークフロー参照からディスパッチし、ワークフローのロジックとシークレットを管理下に置く必要があります。
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw のブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付けます。
- `OpenClaw NPM Release` の検証専用プリフライトは、タグのプッシュを必要とせず、現在のワークフローブランチの完全な 40 文字のコミット SHA も受け付けます。この SHA パスは検証専用であり、実際の公開へ昇格できません。SHA モードでは、ワークフローはパッケージメタデータのチェック専用に `v<package.json version>` を生成します。実際の公開には、引き続き実際のリリースタグが必要です。
- どちらのワークフローも、実際の公開と昇格のパスは GitHub ホステッドランナー上に維持し、変更を加えない検証パスでは、より大きな Blacksmith Linux ランナーを使用できます。
- そのワークフローは、ワークフローシークレット `OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方を使用して `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行します。
- npm リリースプリフライトは、独立したリリースチェックレーンを待たなくなりました。
- リリース候補をローカルでタグ付けする前に、`RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` を実行してください。このヘルパーは、高速なリリースガードレール、Plugin の npm/ClawHub リリースチェック、ビルド、UI ビルド、`release:openclaw:npm:check` を、GitHub の公開ワークフロー開始前に承認を妨げる一般的なミスを検出できる順序で実行します。
- 承認前に `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（または対応するプレリリース／修正版タグ）を実行してください。
- npm 公開後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（または対応するベータ／修正版）を実行し、新しい一時プレフィックスで公開済みレジストリからのインストールパスを検証してください。
- ベータ公開後、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行し、共有のリース済み Telegram 認証情報プールを使用して、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証してください。メンテナーがローカルで単発実行する場合は、Convex の変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` 環境認証情報を直接渡すこともできます。
- メンテナーのマシンから公開後の完全なベータスモークを実行するには、`pnpm release:beta-smoke -- --beta betaN` を使用してください。このヘルパーは、Parallels の npm 更新／新規ターゲット検証を実行し、`NPM Telegram Beta E2E` をディスパッチして、該当するワークフロー実行をポーリングし、アーティファクトをダウンロードして、Telegram レポートを出力します。
- メンテナーは、手動の `NPM Telegram Beta E2E` ワークフローを使用して、GitHub Actions から同じ公開後チェックを実行できます。これは意図的に手動専用であり、マージのたびには実行されません。
- メンテナー向けリリース自動化では、プリフライト後に昇格する方式を使用します。
  - 実際の npm 公開には、npm `preflight_run_id` の成功が必要です。
  - 通常のベータ版および安定版の公開オーケストレーションとプリフライトでは、正確な対象タグに対して信頼済みの `main` を使用します。Tideclaw アルファ版の公開とプリフライトでは、対応するアルファブランチを使用します。
  - 安定版 npm リリースのデフォルトは `beta` です。安定版 npm 公開では、ワークフロー入力を使用して明示的に `latest` を対象にできます。
  - トークンベースの npm dist-tag 変更は `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` にあります。これは、ソースリポジトリでは OIDC のみの公開を維持する一方、`npm dist-tag add` では引き続き `NPM_TOKEN` が必要なためです。
  - 公開されている `macOS Release` は検証専用です。タグがリリースブランチにのみ存在し、ワークフローが `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.PATCH` を設定してください。
  - 実際の macOS 公開には、macOS `preflight_run_id` と `validate_run_id` の成功が必要です。
  - 実際の公開パスでは、再ビルドせずに準備済みのアーティファクトを昇格させます。
- `YYYY.M.PATCH-N` のような安定版修正リリースでは、公開後ベリファイアーは、`YYYY.M.PATCH` から `YYYY.M.PATCH-N` への同じ一時プレフィックスのアップグレードパスもチェックします。これにより、リリース修正後も古いグローバルインストールが基本の安定版ペイロードに気付かないまま残ることを防ぎます。
- npm リリースプリフライトは、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り、フェイルクローズします。これにより、空のブラウザダッシュボードを再び配布することを防ぎます。
- 公開後検証では、公開済み Plugin のエントリポイントとパッケージメタデータが、インストール済みレジストリのレイアウトに存在することもチェックします。Plugin のランタイムペイロードが欠落したリリースは公開後ベリファイアーで失敗し、`latest` に昇格できません。
- `pnpm test:install:smoke` は、候補更新 tarball に対する npm pack の `unpackedSize` 予算も適用するため、インストーラー E2E はリリース公開パスの前に意図しないパッケージ肥大化を検出できます。
- リリース作業で CI 計画、拡張機能のタイミングマニフェスト、または拡張機能のテストマトリクスに変更を加えた場合は、承認前に `.github/workflows/plugin-prerelease.yml` からプランナーが管理する `plugin-prerelease-extension-shard` マトリクス出力を再生成して確認し、リリースノートに古い CI レイアウトが記載されないようにしてください。
- 安定版 macOS リリースの準備状況には、アップデーターの各サーフェスも含まれます。GitHub リリースには最終的に、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が含まれている必要があります。`main` 上の `appcast.xml` は公開後に新しい安定版 zip を指す必要があります（macOS 公開ワークフローが自動的にコミットするか、直接プッシュがブロックされた場合は appcast PR を作成します）。また、パッケージ化されたアプリでは、デバッグ用ではないバンドル ID、空でない Sparkle フィード URL、そのリリースバージョンの正規 Sparkle ビルド下限以上の `CFBundleVersion` を維持する必要があります。

## リリーステストボックス

`Full Release Validation` は、オペレーターが 1 つのエントリポイントから製品マトリクス全体を開始する方法です。このヘルパーを使用すると、要求されたコミットをテスト対象候補に維持しながら、すべての子ワークフローを、信頼済みの 1 つの `main` ワークフロー SHA に固定された一時ブランチから実行できます。

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

このヘルパーは、現在の `origin/main` をフェッチし、その信頼済みワークフローコミットに `release-ci/<workflow-sha>-...` をプッシュし、アルファ／ベータのパッケージバージョンから `beta` を、それ以外では `stable` を推論し、一時ブランチから `ref=<target-sha>` を指定して `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が固定された親ワークフロー SHA と一致することを検証してから、一時ブランチを削除します。強制的に新規実行するには `-f reuse_evidence=false`、広範なアドバイザリスイープには `-f release_profile=full`、現在の `origin/main` から引き続き到達可能な古いコミットを固定するには `--workflow-sha <trusted-main-sha>` を渡してください。ワークフロー自体がリポジトリ参照へ書き込むことはありません。これにより、候補にツール用コミットを追加せずに main 専用のリリースツールを利用でき、誤って新しい `main` の子実行を証明することも防げます。

Code SHA が成功したら、`CHANGELOG.md` のみをコミットし、Release SHA を指定して同じヘルパーを実行します。

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

2 番目の親は、Release SHA が Code SHA の子孫であり、変更されたパスの完全な集合が正確に `CHANGELOG.md` であることを GitHub が証明した場合に限り、製品エビデンスを再利用します。これは `changelog-only-release-v1` を記録し、製品の子ワークフローをディスパッチしません。tarball のバイト列が変更されているため、npm プリフライトとパッケージ／インストール受け入れテストは引き続き Release SHA で実行されます。

新しい Code SHA の場合、ワークフローは対象を解決し、手動の `CI` をディスパッチしてから、`OpenClaw Release Checks` をディスパッチします。`OpenClaw Release Checks` は、インストールスモーク、OS 横断リリースチェック、soak が有効な場合のライブ／E2E Docker リリースパスカバレッジ、正規の Telegram パッケージ E2E を含むパッケージ受け入れテスト、QA Lab パリティ、ライブ Matrix、ライブ Telegram へファンアウトします。完全／全体実行が許容されるのは、`Full Release Validation` のサマリーで `normal_ci`、`plugin_prerelease`、`release_checks` が成功と表示された場合のみです。ただし、対象を絞った再実行で独立した `Plugin Prerelease` 子ワークフローを意図的にスキップした場合を除きます。スタンドアロンの `npm-telegram` 子ワークフローは、`release_package_spec` または `npm_telegram_package_spec` を使用した、公開済みパッケージに絞った再実行にのみ使用してください。最終ベリファイアーのサマリーには各子実行の最も遅いジョブの表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。

このリリースパスでは、製品パフォーマンスの子ワークフローはアーティファクト専用です。
包括ワークフローは `publish_reports=false` を指定してこれをディスパッチし、アーティファクト専用ガードによって Clawgrit レポートパブリッシャーがスキップされたままであることが証明されない限り、検証は拒否されます。

完全なステージマトリクス、正確なワークフロージョブ名、安定版プロファイルと完全版プロファイルの違い、アーティファクト、対象を絞った再実行用ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。

子ワークフローは、`Full Release Validation` を実行する SHA 固定の信頼済み参照からディスパッチされます。すべての子実行は、親ワークフローと正確に同じ SHA を使用する必要があります。リリース証明には、生の `--ref main -f ref=<sha>` ディスパッチを使用せず、`pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH` を使用してください。

ライブ／プロバイダーの範囲を選択するには、`release_profile` を使用します。

- `beta`: リリースに不可欠な OpenAI／コアのライブおよび Docker パスを最速で実行
- `stable`: リリース承認向けのベータ版に加え、安定版のプロバイダー／バックエンドを網羅
- `full`: 安定版に加え、広範なアドバイザリプロバイダー／メディアを網羅

安定版および完全版の検証では、昇格前に、包括的なライブ／E2E、Docker リリースパス、公開済みアップグレードの限定的な生存確認スイープを必ず実行します。ベータ版で同じスイープを要求するには、`run_release_soak=true` を使用してください。このスイープは、最新 4 つの安定版パッケージ、固定された `2026.4.23` および `2026.5.2` ベースライン、さらに古い `2026.4.15` のカバレッジを対象とし、重複するベースラインを除外して、各ベースラインを個別の Docker ランナージョブに分割します。

`OpenClaw Release Checks` は信頼済みワークフロー参照を使用して、対象参照を一度だけ `release-package-under-test` として解決し、soak 実行時の OS 横断チェック、パッケージ受け入れテスト、リリースパス Docker チェックでそのアーティファクトを再利用します。これにより、パッケージ関連のすべてのボックスで同じバイト列が使用され、パッケージの繰り返しビルドを回避できます。ベータ版がすでに npm にある場合は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を設定すると、リリースチェックは配布済みパッケージを一度だけダウンロードし、`dist/build-info.json` からビルド元 SHA を抽出して、そのアーティファクトを OS 横断チェック、パッケージ受け入れテスト、リリースパス Docker、パッケージ Telegram レーンで再利用します。

OS 横断の OpenAI インストールスモークでは、リポジトリ／組織の変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL`、それ以外の場合は `openai/gpt-5.6-luna` を使用します。これは、このレーンが最も高性能なモデルのベンチマークではなく、パッケージのインストール、オンボーディング、Gateway の起動、ライブエージェントの 1 ターンを証明するためです。モデル固有のカバレッジは、引き続き、より広範なライブプロバイダーマトリクスで扱います。

リリース段階に応じて、次のバリエーションを使用します。

```bash
# 製品完成版の Code SHA を検証します。
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Code SHA の製品エビデンスを再利用して、変更履歴のみの Release SHA を検証します。
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# ベータ版の公開後、公開済みパッケージの Telegram E2E を追加します。
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

対象を絞った修正後の最初の再実行に、完全な包括実行を使用しないでください。1 つのボックスが失敗した場合、次の検証には失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用します。修正によって共有リリースオーケストレーションが変更された場合、または以前の全ボックスのエビデンスが古くなった場合にのみ、完全な包括実行を再度実行します。包括実行の最終検証処理は記録された子ワークフローの実行 ID を再確認するため、子ワークフローが正常に再実行された後は、失敗した `Verify full validation` 親ジョブのみを再実行します。

リリースプロファイル、有効なソーク設定、検証入力が一致し、対象 SHA
が同一であるか、新しい対象がその子孫で、変更されたパスの完全な集合が
正確に `CHANGELOG.md` である場合、`rerun_group=all` は以前の成功した包括実行を
再利用できます。対象が完全に一致する再利用では
`exact-target-full-validation-v1` が記録され、検証後の Release SHA では
`changelog-only-release-v1` が記録されます。後者が再利用するのは製品検証のみです。Npm
プレフライト、パッケージのバイト列、リリースノートの来歴、インストール／更新の受け入れ検証は、
引き続き Release SHA に対して実行する必要があります。バージョン、ソース、生成物、
依存関係、パッケージ、またはワークフローが所有する対象を変更した場合は、新しい Code SHA
と新規の完全検証が必要です。同じ `release/*` ref および
再実行グループに対する新しい包括実行は、進行中の実行を自動的に置き換えます。
新規の完全実行を強制するには `reuse_evidence=false` を渡します。

範囲を限定した復旧では、包括実行に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子ワークフローのみ、`plugin-prerelease` はリリース専用 Plugin 子ワークフローのみ、`release-checks` はすべてのリリースボックスを実行します。さらに範囲の狭いリリースグループは、`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。対象を絞った `npm-telegram` の再実行には `release_package_spec` または `npm_telegram_package_spec` が必要です。完全／全実行では、Package Acceptance 内の標準パッケージ Telegram E2E を使用します。対象を絞ったクロス OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS／スイートフィルターを追加できます。QA リリースチェックの失敗は、標準階層で必須の OpenClaw 動的ツールドリフトを含む通常のリリース検証をブロックします。Tideclaw アルファ実行では、パッケージ安全性に関係しないリリースチェックレーンを引き続き参考扱いにできます。`release_profile=beta` の場合、`Run repo/live E2E validation` ライブプロバイダースイートは参考扱い（ブロッカーではなく警告）になります。安定版および完全プロファイルでは、引き続きブロッカーとして扱われます。`live_suite_filter` が Discord、WhatsApp、Slack などのゲート付き QA ライブレーンを明示的に要求する場合、対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` リポジトリ変数を有効にする必要があります。有効でない場合、レーンを暗黙にスキップするのではなく、入力取得が失敗します。

### Vitest

Vitest ボックスは手動の `CI` 子ワークフローです。手動 CI は意図的に変更範囲による絞り込みを迂回し、リリース候補に対して通常のテストグラフを強制します。Linux Node シャード、同梱 Plugin シャード、Plugin およびチャンネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物のスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI の i18n が含まれます。包括実行が `include_android=true` を渡すため、`Full Release Validation` がこのボックスを実行する場合は Android も含まれます。単独の手動 CI で Android を対象にするには、`include_android=true` が必要です。

「ソースツリーは通常の完全なテストスイートに合格したか？」に答えるには、このボックスを使用します。これはリリースパスの製品検証とは異なります。保存するエビデンスは次のとおりです。

- `Full Release Validation` の概要。ディスパッチされた `CI` の実行 URL を示すもの
- 正確な対象 SHA に対する `CI` の実行成功
- 回帰調査時の CI ジョブに含まれる、失敗または低速なシャード名
- 実行のパフォーマンス分析が必要な場合の、`.artifacts/vitest-shard-timings.json` などの Vitest タイミング成果物

リリースで決定論的な通常 CI が必要でも、Docker、QA Lab、ライブ、クロス OS、またはパッケージボックスが不要な場合にのみ、手動 CI を直接実行します。Android を含まない直接 CI には最初のコマンドを使用します。リリース候補の直接 CI で Android も対象にする必要がある場合は、`include_android=true` を追加します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker ボックスは `OpenClaw Release Checks` から `openclaw-live-and-e2e-checks-reusable.yml`、およびリリースモードの `install-smoke` ワークフローにあります。ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker の対象範囲は次のとおりです。

- 低速な Bun グローバルインストールのスモークを有効にした完全インストールスモーク
- 対象 SHA ごとのルート Dockerfile スモークイメージの準備／再利用。QR、ルート／Gateway、インストーラー／Bun のスモークジョブを個別の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパスの Docker チャンク：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`、および `openwebui`
- 要求された場合、専用の大容量ディスクランナーで実行する OpenWebUI の対象範囲
- `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23` までの、分割された同梱 Plugin インストール／アンインストールレーン
- リリースチェックにライブスイートが含まれる場合の、ライブ／E2E プロバイダースイートおよび Docker ライブモデルの対象範囲

再実行する前に Docker 成果物を使用します。リリースパスのスケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズのタイミング、スケジューラープラン JSON、および再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。対象を絞った復旧では、すべてのリリースチャンクを再実行する代わりに、再利用可能なライブ／E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成される再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンで同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これはエージェント動作およびチャンネルレベルのリリースゲートであり、Vitest や Docker のパッケージ機構とは別です。

リリース QA Lab の対象範囲は次のとおりです。

- エージェント型パリティパックを使用し、OpenAI 候補レーンと `anthropic/claude-opus-4-8` ベースラインを比較するモックパリティレーン
- `qa-live-shared` 環境を使用する高速ライブ Matrix QA プロファイル
- Convex CI 認証情報リースを使用するライブ Telegram QA レーン
- リリーステレメトリに明示的なローカル検証が必要な場合の `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke`、または `pnpm qa:observability:smoke`

「リリースは QA シナリオとライブチャンネルフローで正しく動作するか？」に答えるには、このボックスを使用します。リリースを承認するときは、パリティ、Matrix、Telegram レーンの成果物 URL を保存します。Matrix の完全な対象範囲は、デフォルトのリリースクリティカルレーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### パッケージ

Package ボックスはインストール可能な製品のゲートです。`Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。リゾルバーは候補を Docker E2E が使用する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネスの ref をパッケージソースの ref とは分離して保持します。

サポートされる候補ソースは次のとおりです。

- `source=npm`：`openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`：選択した `workflow_ref` ハーネスを使用して、信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA をパック
- `source=url`：必須の `package_sha256` を使用して公開 HTTPS `.tgz` をダウンロード。URL 認証情報、デフォルト以外の HTTPS ポート、プライベート／内部／特殊用途のホスト名または解決済みアドレス、安全でないリダイレクトは拒否されます
- `source=trusted-url`：`.github/package-trusted-sources.json` 内の名前付きポリシーから、必須の `package_sha256` および `trusted_source_id` を使用して HTTPS `.tgz` をダウンロード。`source=url` に入力レベルのプライベートネットワーク迂回策を追加する代わりに、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリで使用します
- `source=artifact`：別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージ成果物、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` を使用して Package Acceptance を実行します。Package Acceptance では、移行、更新、ルート管理 VPS のアップグレード、設定済み認証の更新後の再起動、ライブ ClawHub skill のインストール、古い Plugin 依存関係のクリーンアップ、オフライン Plugin フィクスチャ、Plugin 更新、Plugin コマンドバインディングのエスケープ強化、および Telegram パッケージ QA を、同じ解決済み tarball に対して実行します。ブロッキングリリースチェックでは、デフォルトで公開済みの最新パッケージをベースラインとして使用します。`run_release_soak=true`、`release_profile=stable`、または `release_profile=full` を使用するベータプロファイルでは、公開済みアップグレード生存確認スイープを、`last-stable-4` に加えて、固定された `2026.4.23`、`2026.5.2`、`2026.4.15` ベースラインと `reported-issues` シナリオまで拡張します。すでに出荷済みの候補には `source=npm` を使用した Package Acceptance、公開前の SHA に基づくローカル npm tarball には `source=ref`、メンテナー所有のエンタープライズ／プライベートミラーには `source=trusted-url`、別の GitHub Actions 実行によってアップロードされた準備済み tarball には `source=artifact` を使用します。

これは、以前 Parallels を必要としていたパッケージ／更新の対象範囲の大部分に代わる、GitHub ネイティブの仕組みです。クロス OS リリースチェックは、OS 固有のオンボーディング、インストーラー、プラットフォーム動作に対して引き続き重要ですが、パッケージ／更新の製品検証では Package Acceptance を優先する必要があります。

更新および Plugin 検証の標準チェックリストは、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)です。Plugin のインストール／更新、doctor クリーンアップ、または公開済みパッケージの移行変更を、ローカル、Docker、Package Acceptance、リリースチェックのどのレーンで検証するかを決める際に使用します。すべての安定版 `2026.4.23+` パッケージからの網羅的な公開済み更新移行は、Full Release CI の一部ではなく、別の手動 `Update Migration` ワークフローです。

従来の package-acceptance の緩和措置は、意図的に期限が限定されています。`2026.4.25` までのパッケージは、npm にすでに公開済みのメタデータ不足に対する互換性パスを使用できます。対象には、tarball に存在しないプライベート QA インベントリエントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャに存在しないパッチファイル、永続化されていない `update.channel`、従来の Plugin インストール記録の場所、マーケットプレイスのインストール記録の永続化不足、`plugins update` 中の設定メタデータ移行が含まれます。公開済みの `2026.4.26` パッケージでは、すでに出荷されたローカルビルドメタデータのスタンプファイルについて警告を許容できます。それより新しいパッケージは現行のパッケージ契約を満たす必要があり、同じ不足があるとリリース検証に失敗します。

リリース上の確認事項が実際にインストール可能なパッケージに関する場合は、より広範な Package Acceptance プロファイルを使用します。

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

- `smoke`: パッケージの迅速なインストール、チャネル/エージェント、Gateway ネットワーク、および設定再読み込みのレーン
- `package`: インストール/更新/再起動/Plugin パッケージの契約に加え、ClawHub Skills のライブインストール証明。これはリリースチェックのデフォルト
- `product`: `package` に加え、MCP チャネル、Cron/サブエージェントのクリーンアップ、OpenAI Web 検索、および OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスのチャンク
- `custom`: 対象を絞った再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または `telegram_mode=live-frontier` を有効にします。ワークフローは、解決済みの `package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの Telegram ワークフローでは、公開後チェック用に公開済み npm 指定も引き続き受け付けます。

## 通常リリースの公開自動化

ベータ、`latest`、Plugin、GitHub Release、およびプラットフォームの公開では、
`OpenClaw Release Publish` が通常の変更を伴うエントリポイントです。毎月の
`.33+` npm 専用の延長安定版パスでは、このオーケストレーターを使用しません。
通常のワークフローは、リリースで必要となる順序で信頼されたパブリッシャーの
ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*`（アルファプレリリースの場合は Tideclaw アルファブランチ）から到達可能であることを検証します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` および `ref=<release-sha>` を指定して `Plugin NPM Release` をディスパッチします。
5. 同じスコープと SHA で `Plugin ClawHub Release` をディスパッチします。
6. 保存済みの `full_release_validation_run_id` と正確な実行試行を検証した後、リリースタグ、npm dist-tag、および保存済みの `preflight_run_id` を指定して `OpenClaw NPM Release` をディスパッチします。
7. 安定版リリースでは、GitHub リリースをドラフトとして作成または更新し、明示的な `windows_node_tag` と候補承認済みの `windows_node_installer_digests` を指定して `Windows Node Release` をディスパッチし、正規の Windows インストーラー/チェックサムアセットを検証します。また、正確なタグの署名済み APK とチェックサムおよび来歴をビルドするため、`Android Release` もディスパッチします。ドラフトを公開する前に、両方のネイティブアセット契約を検証します。

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

下位レベルの `Plugin NPM Release` および `Plugin ClawHub Release` ワークフローは、対象を絞った修復または再公開作業にのみ使用します。`OpenClaw Release Publish` は、`publish_openclaw_npm=true` の場合に `plugin_publish_scope=selected` を拒否するため、`@openclaw/diffs-language-pack` を含む公開可能なすべての公式 Plugin なしにコアパッケージがリリースされることはありません。選択した Plugin の修復では、`plugin_publish_scope=selected` および `plugins=@openclaw/name` とともに `publish_openclaw_npm=false` を設定するか、子ワークフローを直接ディスパッチします。

初回公開時の ClawHub ブートストラップは例外です。信頼された `main` から `Plugin ClawHub New` をディスパッチし、`ref` を通じて対象リリースの完全な SHA を渡します。
ブートストラップワークフロー自体は、リリースタグまたはブランチから決して実行しないでください。

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

タグ付け前の検証には `dry_run=true` が必要であり、リリースタグおよび親実行の
入力を拒否し、`main` または `release/*` から到達可能な正確な対象のみを受け付けます。
これは ClawHub の認証情報を読み込まず、パッケージバイトを公開せず、信頼された
パブリッシャー設定も変更しません。ワークフローは引き続きライブレジストリのプランを解決し、
シークレットを使用しないジョブでのみ対象をチェックアウトしてパックし、ロック済みの
ClawHub ツールチェーンを具現化し、リリースタグが存在する前に不変アーティファクトとパッケージの
スラッグ/ID を検証します。シークレットを使用しないパックジョブが
完了した後にのみ `clawhub-plugin-bootstrap` 環境を承認してください。この保護された検証ジョブには、認証情報も変更コマンドもありません。

承認済みのドライランまたはタグ付け後の実際のブートストラップには、正確な
リリースタグに加え、親の `OpenClaw Release Publish` 実行 ID、試行、および
ブランチを含める必要があります。親は自身のワークフロー SHA と、`Plugin ClawHub New` 用の別個の正確で信頼された
`main` SHA を証明します。子実行と、保護された環境のすべての
承認は、その承認済み子 SHA と一致する必要があります。リリースタグは、
公開試行および信頼されたパブリッシャー変更のたびに再確認されます。

パックジョブは、
名前、Actions アーティファクト ID/ダイジェスト、
生成元の実行/試行、対象 SHA、およびパッケージごとの tarball SHA-256/サイズが
検証ジョブと保護されたジョブへ引き継がれる、単一の不変アーティファクトをアップロードします。
保護されたジョブは、信頼された `main`
ツールのみをチェックアウトし、GitHub API を通じてアーティファクトの組を検証し、正確なアーティファクト ID で
ダウンロードし、すべての tarball を再ハッシュし、固定された CLI の USTAR 正規化ルールによってローカル TAR パスと
パッケージ ID を検証します。各
候補は、その後、固定された CLI の公開ドライランに合格します。このドライランは、
レジストリ検索や認証の前に終了します。認証情報ジョブの事前フィルターは、圧縮済み ClawPack を
120 MiB、ファイルペイロード合計を 50 MiB、展開済み TAR データを 64 MiB、
TAR エントリ数を 10,000 に制限します。既存パッケージの信頼されたパブリッシャー修復は
引き続き設定のみですが、それでも対象をパックし、信頼されたパブリッシャー
設定を変更する前に、要求されたタグと正確なレジストリバイトおよびメタデータの一致を要求します。
公開後の検証では ClawHub アーティファクトをダウンロードし、
同じ SHA-256 とサイズを要求します。失敗ジョブのみの再実行による復旧では、正確な生成元ジョブが
正常に完了した場合にのみ、以前の試行のパッケージアーティファクトを再利用できます。
最終証拠には、ロック済みの ClawHub バージョン、ロック
SHA-256、および npm integrity も紐付けられます。不一致の場合は、新しいパッケージバージョンが必要です。

## NPM ワークフローの入力

`OpenClaw NPM Release` は、次のオペレーター制御入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1`、`v2026.4.2-alpha.1` などの必須リリースタグ。`preflight_only=true` の場合、検証専用の事前チェック用として、現在のワークフローブランチの完全な 40 文字コミット SHA も指定可能
- `preflight_only`: 検証/ビルド/パッケージ化のみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 既存の成功した事前チェック実行 ID。実際の公開パスでは必須であり、ワークフローは再ビルドせず、準備済みの tarball を再利用する
- `full_release_validation_run_id`: このタグ/SHA に対する成功した `Full Release Validation` 実行 ID。実際の公開では必須。ベータ公開は警告付きで事前チェックのみでも続行できるが、安定版/`latest` への昇格には引き続き必要
- `full_release_validation_run_attempt`: `full_release_validation_run_id` と組み合わせる正確な正の実行試行値。実行 ID が指定される場合は常に必須であり、再実行によって公開中の承認証拠が変更されるのを防ぐ
- `release_publish_run_id`: 承認済みの `OpenClaw Release Publish` 実行 ID。このワークフローがその親によってディスパッチされる場合に必須（ボットアクターによる実際の公開呼び出し）
- `plugin_npm_run_id`: 成功した正確な HEAD の `Plugin NPM Release` 実行 ID。実際の `extended-stable` コア公開に必須
- `npm_dist_tag`: 公開パス用の npm 対象タグ。`alpha`、`beta`、`latest`、または `extended-stable` を受け付け、デフォルトは `beta`。最終パッチ `33` 以降では `extended-stable` を使用する必要がある。デフォルトでは `extended-stable` はそれ以前のパッチを拒否し、最終版ではないタグを常に拒否する
- `bypass_extended_stable_guard`: テスト専用のブール値。デフォルトは `false`。`npm_dist_tag=extended-stable` と組み合わせると、リリース ID、アーティファクト、承認、および読み戻しチェックを維持しながら、毎月の延長安定版の適格性を迂回する

`Plugin NPM Release` は、既存のリリース
動作には `npm_dist_tag=default`、保護された毎月のパスには `npm_dist_tag=extended-stable` を受け付けます。
延長安定版オプションには、`publish_scope=all-publishable`、空の
`plugins` 入力、`33` 以上の最終パッチ、および正確な先端にある正規の
`extended-stable/YYYY.M.33` ブランチが必要です。Plugin の
`latest` または `beta` は決して移動しません。新しいパッケージバージョンは、OIDC による信頼された公開
（`npm publish --tag extended-stable`）を通じて `extended-stable` をアトミックに受け取ります。この
ソースワークフローでは、トークン認証された `npm dist-tag add` を使用しません。再試行では、
npm にすでに存在する正確なバージョンをスキップし、その後、すべての正確なパッケージと `extended-stable` タグが
収束したことを完全な読み戻しで確認できない限り、安全側に倒して失敗します。

`OpenClaw Release Publish` は、次のオペレーター制御入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要がある
- `preflight_run_id`: 成功した `OpenClaw NPM Release` 事前チェック実行 ID。`publish_openclaw_npm=true` または `plugin_publish_scope=all-publishable` の場合に必須
- `full_release_validation_run_id`: 成功した `Full Release Validation` 実行 ID。`publish_openclaw_npm=true` または `plugin_publish_scope=all-publishable` の場合に必須
- `full_release_validation_run_attempt`: `full_release_validation_run_id` と組み合わせる正確な正の試行値。実行 ID が指定される場合は常に必須
- `windows_node_tag`: 正確なプレリリースではない `openclaw/openclaw-windows-node` リリースタグ。OpenClaw 安定版公開に必須
- `windows_node_installer_digests`: 現在の Windows インストーラー名から固定された `sha256:` ダイジェストへの、候補承認済みのコンパクトな JSON マップ。OpenClaw 安定版公開に必須
- `npm_telegram_run_id`: 最終リリース証拠に含める、成功した `NPM Telegram Beta E2E` 実行 ID（任意）
- `npm_dist_tag`: OpenClaw パッケージ用の npm 対象タグ。`alpha`、`beta`、または `latest` のいずれか
- `plugin_publish_scope`: デフォルトは `all-publishable`。`publish_openclaw_npm=false` を使用した対象を絞った Plugin 専用の修復作業でのみ `selected` を使用する
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin 専用の修復オーケストレーターとして使用する場合にのみ `false` を設定する
- `release_profile`: リリース証拠の要約に使用されるリリースカバレッジプロファイル。デフォルトは `from-validation` で、検証マニフェストから読み取る。`beta`、`stable`、または `full` で上書き可能
- `wait_for_clawhub`: ClawHub サイドカーによって npm の可用性が妨げられないよう、デフォルトは `false`。ワークフローの完了に ClawHub の完了も含める必要がある場合にのみ `true` を設定する

`OpenClaw Release Checks` は、次のオペレーター制御入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを使用するチェックでは、解決されたコミットが OpenClaw のブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: ベータリリースチェックで、網羅的なライブ/E2E、Docker リリースパス、および全期間のアップグレード生存確認の長時間テストを有効にします。これは `release_profile=stable` および `release_profile=full` によって強制的に有効になります。

ルール:

- パッチ `33` 未満の通常の最終版および修正版は、`beta` または `latest` のどちらにも公開できます。パッチ `33` 以上の最終版は `extended-stable` に公開する必要があり、その境界にある修正サフィックス付きバージョンは拒否されます。
- ベータのプレリリースタグは `beta` にのみ公開でき、アルファのプレリリースタグは `alpha` にのみ公開できます
- `OpenClaw NPM Release` では、`preflight_only=true` の場合に限り、完全なコミット SHA を入力できます
- `OpenClaw Release Checks` および `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、プレフライト時に使用したものと同じ `npm_dist_tag` を使用する必要があります。公開を続行する前に、ワークフローがそのメタデータを検証します

## 通常のベータ/最新安定版リリース手順

この従来の手順は、plugins、GitHub Release、Windows、およびその他のプラットフォーム作業も担う、通常のオーケストレーションされたリリース用です。このページの冒頭で説明している、毎月の `.33+` npm 専用延長安定版パスではありません。

通常のオーケストレーションされた安定版リリースを作成する場合:

1. `OpenClaw NPM Release` を `preflight_only=true` で実行します。タグが存在する前は、現在の完全なワークフローブランチのコミット SHA を使用して、プレフライトワークフローを検証専用でドライランできます。
2. 通常のベータ優先フローでは `npm_dist_tag=beta` を選択します。意図的に安定版へ直接公開する場合に限り、`latest` を選択します。
3. 通常の CI に加えて、ライブプロンプトキャッシュ、Docker、QA Lab、Matrix、および Telegram のカバレッジを単一の手動ワークフローで実行する場合は、リリースブランチ、リリースタグ、または完全なコミット SHA に対して `Full Release Validation` を実行します。意図的に決定論的な通常テストグラフのみが必要な場合は、代わりにリリース ref に対して手動の `CI` ワークフローを実行します。
4. 署名済みの x64 および ARM64 インストーラーを出荷する、プレリリースではない正確な `openclaw/openclaw-windows-node` リリースタグを選択します。それを `windows_node_tag` として保存し、検証済みのダイジェストマップを `windows_node_installer_digests` として保存します。リリース候補ヘルパーは両方を記録し、生成する公開コマンドに含めます。
5. 成功した `preflight_run_id`、`full_release_validation_run_id`、および正確な `full_release_validation_run_attempt` を保存します。
6. 信頼済みの `main` から `OpenClaw Release Publish` を、同じ `tag`、同じ `npm_dist_tag`、選択した `windows_node_tag`、保存したその `windows_node_installer_digests`、保存した `preflight_run_id`、`full_release_validation_run_id`、および `full_release_validation_run_attempt` とともに実行します。OpenClaw npm パッケージを昇格する前に、外部化された plugins を npm と ClawHub に公開します。
7. リリースが `beta` に公開された場合は、`openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その安定版を `beta` から `latest` に昇格します。
8. リリースを意図的に `latest` に直接公開し、`beta` も同じ安定版ビルドへ直ちに追従させる場合は、同じリリースワークフローを使用して両方の dist-tag を安定版に向けるか、スケジュールされた自己修復同期によって後で `beta` を移動させます。

dist-tag の変更は、引き続き `NPM_TOKEN` が必要なため、リリース台帳リポジトリに置かれています。一方、ソースリポジトリでは OIDC のみの公開を維持します。これにより、直接公開パスとベータ優先の昇格パスの両方が文書化され、オペレーターから確認可能な状態に保たれます。

メンテナーがローカルの npm 認証へフォールバックする必要がある場合は、1Password CLI（`op`）のコマンドを専用の tmux セッション内でのみ実行します。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内に限定することで、プロンプト、アラート、および OTP の処理を観察可能にし、ホストでアラートが繰り返し発生するのを防げます。

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
