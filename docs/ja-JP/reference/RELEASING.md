---
read_when:
    - 公開リリースチャンネルの定義を検索中
    - リリース検証またはパッケージ受け入れテストの実行
    - バージョンの命名規則とリリース頻度を確認する
summary: リリースレーン、運用担当者向けチェックリスト、検証ボックス、バージョン命名規則、リリース頻度
title: リリースポリシー
x-i18n:
    generated_at: "2026-07-16T12:14:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw は現在、ユーザー向けに 3 つの更新チャネルを公開しています。

- stable: 既存の昇格済みリリースチャネル。個別の CLI/チャネルマイルストーンが実装されるまでは、引き続き npm `latest` を通じて解決されます
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の変動する最新ヘッド

これとは別に、リリース運用者は、完了した直近月のコアパッケージをパッチ `33` から npm `extended-stable` に公開できます。当月の通常の最終リリース系列は引き続き npm `latest` を使用します。この運用者側の公開先分割だけでは、CLI の更新チャネル解決は変更されません。

Tideclaw のアルファビルドは、独立した内部プレリリース系列（npm dist-tag `alpha`）です。[NPM ワークフロー入力](#npm-workflow-inputs)および[リリーステストボックス](#release-test-boxes)で説明しています。

## バージョン命名

- 月次 npm extended-stable リリースバージョン: `YYYY.M.PATCH`、`PATCH >= 33` を使用、git タグ `vYYYY.M.PATCH`
- 日次／通常の最終リリースバージョン: `YYYY.M.PATCH`、`PATCH < 33` を使用、git タグ `vYYYY.M.PATCH`
- 通常のフォールバック修正リリースバージョン: `YYYY.M.PATCH-N`、git タグ `vYYYY.M.PATCH-N`
- ベータプレリリースバージョン: `YYYY.M.PATCH-beta.N`、git タグ `vYYYY.M.PATCH-beta.N`
- アルファプレリリースバージョン: `YYYY.M.PATCH-alpha.N`、git タグ `vYYYY.M.PATCH-alpha.N`
- 月またはパッチをゼロ埋めしないこと
- `PATCH` は連続する月次リリーストレイン番号であり、暦日ではありません。通常の最終リリースとベータリリースは現在のトレインを進めます。アルファのみのタグはベータ／通常リリースのパッチ番号を消費も更新もしないため、ベータまたは通常リリースのトレインを選択するときは、より大きなパッチ番号を持つ旧来のアルファのみのタグを無視してください。
- アルファ／ナイトリービルドは、次の未リリースのパッチトレインを使用し、ビルドを繰り返す場合は `alpha.N` だけを増加させます。そのパッチにベータが作成されると、新しいアルファビルドは次のパッチへ移ります。
- npm バージョンは不変です。公開済みのタグを削除、再公開、または再利用しないでください。代わりに次のプレリリース番号または次の月次パッチを作成してください。
- `latest` は引き続き現在の通常／日次 npm 系列に従います。`beta` は現在のベータインストール対象です
- `extended-stable` は、パッチ `33` から始まる、サポート対象の直近月の npm パッケージを意味します。パッチ `34` 以降は、その月次系列のメンテナンスリリースです
- 通常の最終リリースおよび通常の修正リリースは、デフォルトで npm `beta` に公開されます。リリース運用者は `latest` を明示的に指定することも、検証済みのベータビルドを後から昇格することもできます
- 専用の月次 extended-stable パスは、コア npm パッケージと npm に公開可能なすべての公式 Plugin を、まったく同一のバージョンで公開します。Plugin の ClawHub への公開、macOS または Windows の成果物、GitHub Release、非公開リポジトリの dist-tag、Docker イメージ、モバイル成果物、またはウェブサイトのダウンロードは公開しません。
- 通常の最終リリースでは、npm パッケージ、macOS アプリ、署名済みスタンドアロン Android APK、および署名済み Windows Hub インストーラーをまとめて提供します。ベータリリースでは通常、まず npm／パッケージのパスを検証して公開し、ネイティブアプリのビルド／署名／公証／昇格は、明示的に要求されない限り通常の最終リリース用に留保します。

## リリース頻度

- リリースはベータを先行させます。stable は最新のベータが検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.PATCH` ブランチでリリースを行います。これにより、リリースの検証と修正が `main` での新規開発を妨げません
- ベータタグがプッシュまたは公開された後に修正が必要になった場合、メンテナーは古いタグを削除または再作成せず、次の `-beta.N` タグを作成します
- 詳細なリリース手順、承認、認証情報、および復旧に関する注記はメンテナー専用です

## 月次 npm 専用 extended-stable 公開

これは、後述する通常のリリース手順に対する専用の例外です。完了した月 `YYYY.M` について `extended-stable/YYYY.M.33` を作成し、同じブランチから `vYYYY.M.33` 以降のメンテナンスパッチを公開します。リリースタグ、ブランチ先端、チェックアウト、パッケージバージョン、npm プリフライト、および Full Release Validation の実行は、すべて同じコミットを示す必要があります。保護された `main` には、パッチ `33` 未満で、暦上厳密に後の月の最終バージョンがすでに含まれている必要があります。`main` が 1 か月を超えて進んだ後も、メンテナンスパッチは引き続き対象となります。

対象の extended-stable ブランチ上で、ルートパッケージを `YYYY.M.P` に更新し、`pnpm release:prep` を実行して、公開可能なすべての拡張パッケージが同じバージョンであることを確認します。生成された変更をすべてコミットしてプッシュし、そのコミットに不変の `vYYYY.M.P` タグを作成してプッシュしたうえで、得られた完全な SHA を記録します。ワークフローはこの準備済みツリーを使用します。バージョンの更新や同期はワークフロー側では行われません。

その準備済みブランチの厳密な先端から npm プリフライトと Full Release Validation を実行し、両方の実行 ID と、成功した Full Release Validation の実行試行番号を保存します。

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

`release_profile=stable` は既存の検証深度プロファイルです。npm の `extended-stable` dist-tag とは別のものであり、意図的に変更されません。

両方の実行が成功したら、npm に公開可能なすべての公式 Plugin を、まったく同じブランチ先端から公開します。パッチ `P` は `33` 以上でなければなりません。完全なリリース SHA を `ref` として渡し、完全なマトリックスとレジストリの読み戻しを待ってから、成功した Plugin NPM Release の実行 ID を保存します。

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

このワークフローは、ソースが変更されていないパッケージも含め、通常どおり準備された `all-publishable` パッケージインベントリを使用します。成功する前に、すべてのパッケージの厳密なバージョンと、すべての Plugin の `extended-stable` タグを検証します。部分的な実行が失敗した場合は、同じコマンドを再実行してください。すでに公開済みのパッケージは再利用され、不足または古くなった Plugin タグは npm リリース環境で整合され、最終的な読み戻しでも完全なパッケージセットが対象になります。

Plugin ワークフローが成功し、npm リリース環境の準備が整ったら、プリフライトで生成された厳密なコア tarball を公開します。コア公開では、参照された Plugin の実行が、同じ正規ブランチかつ厳密に同じソース SHA 上の `completed/success` であることを検証します。

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

月次 `.33` または保護された `main` の月ポリシーを意図的に満たせないフォークまたは非本番リハーサルでは、npm プリフライトと公開の両方のディスパッチに `-f bypass_extended_stable_guard=true` を追加します。デフォルトは `false` です。このバイパスは `npm_dist_tag=extended-stable` の場合にのみ受け入れられ、ワークフローのサマリーに記録されます。これは、正規の `extended-stable/YYYY.M.33` ワークフロー ref、ブランチ先端／タグ／チェックアウトの一致、最終タグの構文、パッケージ／タグバージョンの一致、参照された実行とマニフェストの同一性、tarball の来歴、環境承認、レジストリの読み戻し、またはセレクター修復の証拠をバイパスしません。

公開ワークフローは、参照されたプリフライト、検証、および Plugin の実行の同一性、準備済み tarball のダイジェスト、およびコアレジストリのセレクターを検証します。ワークフローが成功した後、結果を別途確認してください。

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

両方のコマンドが `YYYY.M.P` を返す必要があります。公開が成功してもセレクターの読み戻しが失敗した場合、不変のパッケージバージョンを再公開しないでください。失敗したワークフローの常時実行サマリーに出力された単一の `npm dist-tag add openclaw@YYYY.M.P extended-stable` 修復コマンドを使用し、その後、両方の独立した読み戻しを繰り返します。以前のセレクターへのロールバックは別個の運用判断であり、読み戻しの修復パスではありません。

公開サポートドキュメントでは当初、Slack、Discord、および Codex を、対象となる extended-stable Plugin サーフェスとして指定しています。この一覧はサポート方針であり、リリースコードの許可リストではありません。npm に公開可能なすべての公式 Plugin は、まったく同一のバージョン公開パスに従います。

以下の通常チェックリストは、引き続きベータ、`latest`、GitHub Release、Plugin、macOS、Windows、およびその他のプラットフォーム公開を管轄します。この npm 専用 extended-stable パスでは、それらの手順を実行しないでください。

## 通常リリースの運用者チェックリスト

このチェックリストは、リリースフローの公開部分を示しています。非公開の認証情報、署名、公証、dist-tag の復旧、および緊急ロールバックの詳細は、メンテナー専用のリリースランブックに記載されています。

1. 現在の `main` から開始します。最新をプルし、対象コミットがプッシュ済みであること、および `main` CI がブランチ作成に十分な程度に成功していることを確認します。
2. そのコミットから `release/YYYY.M.PATCH` を作成します。バックポートは任意です。運用者が選択したものだけを適用してください。必要なすべてのバージョン箇所を更新し、`pnpm release:prep` を実行して、リリース修正と必要なフォワードポートを完了し、`src/plugins/compat/registry.ts` と `src/commands/doctor/shared/deprecation-compat.ts` を確認します。
3. 変更履歴作成前の、製品として完成したコミットを **Code SHA** として固定します。決定論的なソースプリフライトを実行してから、`node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH` を使用します。これにより、信頼済みのワークフローツールが固定される一方で、完全な Vitest、Docker、QA、パッケージ、およびパフォーマンスのマトリックスは、厳密な Code SHA を対象にします。
4. 編集する前に失敗を分類します。製品／コードの失敗では新しい Code SHA が作成され、その SHA に対する完全な検証の成功が必要です。ワークフロー、ハーネス、認証情報、承認、またはインフラストラクチャの失敗は、その所有サーフェスで修復し、同じ Code SHA に対して再実行します。
5. Code SHA が成功した後にのみ、最後に到達可能な公開済みタグ以降にマージされた PR と直接コミットから、先頭の `CHANGELOG.md` セクションを生成します。項目はユーザー向けにし、重複を排除します。分岐した公開済みタグまたは後続のフォワードポートによって、すでにリリース済みの PR が再び関連付けられる場合は、それを `--shipped-ref` として明示的に渡します。
6. `CHANGELOG.md` だけをコミットします。このコミットが **Release SHA** です。Code SHA から Release SHA までの完全な差分は、厳密に `CHANGELOG.md` でなければなりません。その他のパスに変更がある場合、リリースは手順 2 に戻ります。
7. 証拠の再利用を有効にして、Release SHA に対する SHA 固定の Full Release Validation を実行します。軽量な親実行は `changelog-only-release-v1` を記録し、成功した Code SHA を指し、製品の子レーンを一切ディスパッチしない必要があります。これは製品の証拠を再利用するものであり、パッケージのバイト列を再利用するものではありません。
8. Release SHA／タグに対して `preflight_only=true` を指定して `OpenClaw NPM Release` を実行します。成功した `preflight_run_id` を保存します。これにより、最終的な変更履歴を含む厳密なパッケージバイト列をビルドして検査します。
9. Release SHA にタグを付けてから、いずれかを再度ディスパッチする代わりに、成功した Release-SHA 検証の親実行と npm プリフライトを指定して candidate ヘルパーを実行します。

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   安定版では、`--windows-node-tag vX.Y.Z` も渡します。このヘルパーは、リリースノートの来歴、npm プリフライトのバイト列、Parallels のインストール／更新証明、Telegram パッケージ証明、Plugin 公開計画を検証してから、公開コマンドを出力します。

   `OpenClaw Release Publish` は、選択された、または公開可能なすべての Plugin パッケージを npm に、同じ一式を ClawHub に並列でディスパッチし、Plugin の npm 公開が成功すると、一致する dist-tag を使用して準備済みの OpenClaw npm プリフライトアーティファクトを昇格させます。リリースチェックアウトはプロダクト／データのルートとして維持されますが、古いリリースコミットが廃止済みのリリースツールを暗黙に使用できないよう、計画と最終検証は、厳密に一致する信頼済みワークフローソースのチェックアウトから実行されます。公開の子処理を開始する前に、厳密な GitHub リリース本文をレンダリングしてキャッシュします。一致する完全な `CHANGELOG.md` セクションが GitHub の 125,000 文字の上限とレンダラーの対応する 125,000 バイトの安全上限に収まる場合、ページには見出しを含む厳密な `## YYYY.M.PATCH` セクションが掲載されます。ソースセクションが収まらない場合、ページには厳密にグループ化された編集上の注記を残し、サイズ超過の貢献記録を、タグに固定された `CHANGELOG.md` 内の完全な記録への安定したリンクに置き換えます。部分的な記録や切り詰められた箇条書きは決して公開されません。ワークフローは `### Release verification` を追加する前に、完全版またはコンパクト版の本文を選択します。証明末尾の追加によって上限を超える場合は、正規の本文を維持し、代わりに変更不能な添付証拠を使用します。npm `latest` に公開された安定版リリースは GitHub の最新リリースになり、npm `beta` に維持された安定版メンテナンスリリースは GitHub `latest=false` を付けて作成されます。また、ワークフローはリリース後のインシデント対応用として、プリフライト依存関係証拠、完全検証マニフェスト、公開後のレジストリ検証証拠を GitHub リリースにアップロードします。子実行 ID を即座に出力し、ワークフロートークンで承認可能なリリース環境ゲートを自動承認し、失敗した子ジョブをログ末尾とともに要約します。さらに、ドラフトの GitHub リリースページをあらかじめ作成し、OpenClaw の npm 公開と並行して Windows および Android アセットを昇格させ、それらのステージが成功するとリリースページと依存関係証拠を確定します。OpenClaw npm を公開する場合は ClawHub の完了を待ってから、信頼済み main のベータ検証ツールを実行し、GitHub リリース、npm パッケージ、選択された Plugin の npm パッケージ、選択された ClawHub パッケージ、子ワークフロー実行 ID、任意の NPM Telegram 実行 ID に関する公開後証拠をアップロードします。ClawHub ブートストラップ検証ツールでは、厳密な信頼済み main のワークフローパスと SHA、生成元および最終実行の試行番号、リリース SHA、要求されたパッケージ一式、変更不能なパッケージアーティファクトのタプル、最終的なレジストリ読み戻しアーティファクトが必要です。成功した従来のリリース ref の実行は受け入れられません。

   次に、公開済みの `openclaw@YYYY.M.PATCH-beta.N` または `openclaw@beta` パッケージに対して公開後のパッケージ受け入れ検証を実行します。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、次の対応するプレリリース番号を発行します。古いものを削除したり書き換えたりしてはなりません。

10. 公開試行が失敗した場合、その失敗によってプロダクトまたは変更履歴の不具合が証明されない限り、Release SHA は変更しません。成功済みの変更不能な子処理とアーティファクトを再利用して再開し、すでに成功したパッケージバージョンを再ビルドまたは再公開してはなりません。
11. 安定版では、精査済みのベータ版またはリリース候補に必要な検証証拠が揃った後にのみ続行します。安定版の npm 公開も `OpenClaw Release Publish` を経由し、`preflight_run_id` によって成功済みのプリフライトアーティファクトを再利用します。安定版 macOS リリースの準備完了には、パッケージ化された `.zip`、`.dmg`、`.dSYM.zip`、および `main` 上で更新された `appcast.xml` も必要です。macOS 公開ワークフローは、リリースアセットの検証後に、署名済み appcast を公開 `main` へ自動的に公開します。ブランチ保護によって直接プッシュがブロックされた場合は、appcast PR を作成または更新します。安定版 Windows Hub の準備完了には、OpenClaw GitHub リリース上の署名済み `OpenClawCompanion-Setup-x64.exe`、`OpenClawCompanion-Setup-arm64.exe`、`OpenClawCompanion-SHA256SUMS.txt` アセットが必要です。厳密な署名済み `openclaw/openclaw-windows-node` リリースタグを `windows_node_tag` として、その候補承認済みインストーラーダイジェストマップを `windows_node_installer_digests` として渡します。`OpenClaw Release Publish` はリリースドラフトを維持し、`Windows Node Release` をディスパッチして、公開前に 3 つのアセットをすべて検証します。
12. 公開後は、npm 公開後検証ツール、公開後のチャンネル証明が必要な場合は任意の独立した公開済み npm Telegram E2E、必要に応じて dist-tag の昇格を実行し、生成された GitHub リリースページを検証して、リリース告知手順を実行します。その後、安定版リリースの完了を宣言する前に、[安定版 main のクローズアウト](#stable-main-closeout)を完了します。

## 安定版 main のクローズアウト

`main` に実際に出荷されたリリース状態が反映されるまで、安定版の公開は完了していません。

1. 最新の `main` から開始します。それに対して `release/YYYY.M.PATCH` を監査し、`main` に存在しない実際の修正をフォワードポートします。リリース専用の互換性、テスト、または検証アダプターを、より新しい `main` に無条件でマージしてはなりません。
2. 通常のパスでは、`main` を出荷済みの安定版バージョンに設定します。遅延したクローズアウトでは、`main` が後続の安定版 OpenClaw CalVer に進んだ後であれば、それを使用できます。以前のリリースをクローズするためだけに、すでに開始されたリリース系列をダウングレードしてはなりません。検証ツールは引き続き厳密な出荷済み変更履歴セクションと appcast エントリを要求し、実際の `main` バージョンと SHA を記録します。ルートバージョンを変更した場合は `pnpm release:prep` を実行し、その後 `pnpm deps:shrinkwrap:generate` を実行します。
3. `main` 上の `CHANGELOG.md` の `## YYYY.M.PATCH` セクションを、タグ付けされたリリースブランチと厳密に一致させます。mac リリースで公開された場合は、安定版の `appcast.xml` 更新を含めます。
4. オペレーターがそのリリース系列を明示的に開始するまで、`main` に `YYYY.M.PATCH+1`、ベータバージョン、または空の将来用変更履歴セクションを追加してはなりません。
5. `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check`、`OPENCLAW_TESTBOX=1 pnpm check:changed` を実行します。プッシュ後、安定版リリースの完了を宣言する前に、`origin/main` に出荷済みバージョンと変更履歴が含まれていることを確認します。
6. 非公開ロールバック訓練のたびに、リポジトリ変数 `RELEASE_ROLLBACK_DRILL_ID` と `RELEASE_ROLLBACK_DRILL_DATE` を最新に保ちます。

`OpenClaw Stable Main Closeout` は、安定版公開後に出荷済みバージョン、変更履歴、appcast を含む `main` のプッシュから開始されます。変更不能な公開後証拠を読み取り、出荷済みタグをその完全リリース検証および公開実行に関連付けた後、安定版 main の状態、リリース、必須の安定版ソーク、ブロッキング対象のパフォーマンス証拠を検証します。変更不能なクローズアウトマニフェストとチェックサムを GitHub リリースに添付します。自動プッシュトリガーは、変更不能な公開後証拠より前の従来のリリースをスキップし、そのスキップを完了済みのクローズアウトとして扱うことはありません。

完全なクローズアウトには、両方のアセットと一致するチェックサムが必要です。部分的なマニフェストは、記録済みの `main` SHA とロールバック訓練を再実行して同一のバイト列を再生成し、不足しているチェックサムを添付します。無効な組み合わせ、またはマニフェストのないチェックサムは、引き続きブロッキング対象になります。ロールバック訓練のリポジトリ変数がないプッシュトリガー実行は、クローズアウトを完了せずにスキップされます。訓練記録がない場合、または 90 日を超えて古い場合は、手動の証拠付きクローズアウトも引き続きブロックされます。非公開の復旧コマンドは、メンテナー専用のランブックに残します。手動ディスパッチは、証拠付きの安定版クローズアウトを修復または再実行する場合にのみ使用します。

Release Publish の親処理が、変更不能な npm／Plugin 証拠の添付後にのみ失敗した場合は、まずすべての安定版プラットフォームアセットを修復して公開します。その後、メンテナーは `allow_failed_publish_recovery=true` を指定してクローズアウトを手動ディスパッチできます。このモードでは、完了済みで失敗状態の親処理のみを受け入れます。また、通常の macOS／appcast チェックに加えて、厳密な Android および Windows アセット契約、GitHub SHA-256 ダイジェスト、チェックサム検証、Android の来歴、ならびに Authenticode チェックと候補承認済みダイジェストが公開済みインストーラーと一致する、親処理からディスパッチされた成功済みの Windows 昇格が必要です。自動プッシュによるクローズアウトでは、この復旧モードを有効にしません。

従来のフォールバック修正タグがベースパッケージ証拠を再利用できるのは、修正タグがベース安定版タグと同じソースコミットに解決される場合のみです。その Android リリースでは、ベースタグの検証済み APK を再利用し、修正タグの来歴を追加します。ソースが異なる修正では、独自のパッケージ証拠を公開して検証し、より大きい Android `versionCode` を使用する必要があります。

## リリースプリフライト

- より高速なローカル `pnpm check` ゲートの外でもテスト用 TypeScript がカバーされるように、リリースプリフライトの前に `pnpm check:test-types` を実行します。
- より高速なローカルゲートの外でも、より広範なインポートサイクルおよびアーキテクチャ境界のチェックが成功するように、リリースプリフライトの前に `pnpm check:architecture` を実行します。
- パッケージ検証手順で必要となる `dist/*` リリースアーティファクトと Control UI バンドルが存在するように、`pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行します。
- ルートバージョンの更新後、タグ付け前に `pnpm release:prep` を実行します。これは、バージョン／設定／API の変更後に差異が生じやすいすべての決定論的リリースジェネレーターを実行します。対象は、Plugin バージョン、npm shrinkwrap、Plugin インベントリ、基本設定スキーマ、バンドル済みチャンネル設定メタデータ、設定ドキュメントのベースライン、Plugin SDK エクスポート、Plugin SDK API ベースラインです。`pnpm release:check` は、これらのガードをチェックモードで再実行し、さらに Plugin SDK サーフェスのバジェットチェックも行い、パッケージのリリースチェックを実行する前に、生成物の差異によるすべての失敗を 1 回で報告します。
- Plugin バージョン同期は、デフォルトで、公開可能な `@openclaw/ai` ランタイムパッケージ、公式 Plugin パッケージのバージョン、既存の `openclaw.compat.pluginApi` 下限を OpenClaw リリースバージョンに更新します。このフィールドは、単なるパッケージバージョンのコピーではなく、Plugin SDK／ランタイム API の下限として扱います。古い OpenClaw ホストとの互換性を意図的に維持する Plugin 専用リリースでは、下限をサポート対象の最古のホスト API に維持し、その選択を Plugin リリース証明に記載します。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、単一のエントリポイントからすべてのプレリリーステストボックスを開始します。このワークフローはブランチ、タグ、または完全なコミット SHA を受け取り、手動の `CI` をディスパッチするとともに、インストールスモーク、パッケージ受け入れ検証、OS 間パッケージチェック、QA Lab の同等性、Matrix、Telegram の各レーン用に `OpenClaw Release Checks` をディスパッチします。安定版および完全実行では、網羅的なライブ／E2E と Docker リリースパスのソークを必ず含みます。`run_release_soak=true` は、明示的なベータソーク用として維持されます。Package Acceptance は候補検証中に正規のパッケージ Telegram E2E を提供し、2 つ目のライブポーラーが同時に実行されることを回避します。

  ベータ版の公開後に `release_package_spec` を指定すると、リリース tarball を再ビルドせずに、出荷済み npm パッケージをリリースチェック、Package Acceptance、パッケージ Telegram E2E の全体で再利用できます。Telegram で残りのリリース検証とは異なる公開済みパッケージを使用する場合にのみ、`npm_telegram_package_spec` を指定します。Package Acceptance でリリースパッケージ指定とは異なる公開済みパッケージを使用する場合は、`package_acceptance_package_spec` を指定します。Telegram E2E を強制せずに、検証が公開済み npm パッケージと一致することをリリース証拠レポートで証明する場合は、`evidence_package_spec` を指定します。

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- リリース作業を継続しながらパッケージ候補のサイドチャネル証明が必要な場合は、手動の `Package Acceptance` ワークフローを実行します。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使用します。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ、タグ、または SHA をパックするには `source=ref` を使用します。必須の SHA-256 と厳格な公開 URL ポリシーを備えた公開 HTTPS tarball には `source=url` を使用します。必須の `trusted_source_id` と SHA-256 を使用する名前付きの信頼済みソースポリシーには `source=trusted-url` を使用します。または、別の GitHub Actions 実行によってアップロードされた tarball には `source=artifact` を使用します。

  このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用します。また、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` を使用して、同じ tarball に対する Telegram QA を実行できます。選択した Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージアーティファクトが候補となり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択します。`update-restart-auth` は候補パッケージをインストール済み CLI とテスト対象パッケージの両方として使用するため、候補の更新コマンドの管理対象再起動パスが実行されます。

  例:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  一般的なプロファイル:
  - `smoke`: インストール、チャンネル、エージェント、Gateway ネットワーク、設定再読み込みの各レーン
  - `package`: OpenWebUI またはライブ ClawHub を使用しない、アーティファクトネイティブのパッケージ、更新、再起動、Plugin の各レーン
  - `product`: パッケージプロファイルに加え、MCP チャンネル、Cron／サブエージェントのクリーンアップ、OpenAI ウェブ検索、OpenWebUI
  - `full`: OpenWebUI を含む Docker リリースパスのチャンク
  - `custom`: 対象を絞った再実行用の正確な `docker_lanes` 選択

- リリース候補について決定論的な通常 CI カバレッジのみが必要な場合は、手動の `CI` ワークフローを直接実行します。手動 CI ディスパッチは変更スコープをバイパスし、Linux Node シャード、バンドル済み Plugin シャード、Plugin およびチャンネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトのスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n の各レーンを強制実行します。単独の手動 CI 実行では、`include_android=true` を指定してディスパッチした場合にのみ Android を実行します。`Full Release Validation` は CI 子ワークフローにその入力を渡します。

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- リリーステレメトリを検証する場合は、`pnpm qa:otel:smoke` を実行します。ローカルの OTLP/HTTP レシーバーを介して QA-lab を実行し、Opik、Langfuse、その他の外部コレクターを必要とせずに、トレース、メトリクス、ログのエクスポートに加え、制限されたトレース属性とコンテンツ／識別子の秘匿化を検証します。
- コレクターの互換性を検証する場合は、`pnpm qa:otel:collector-smoke` を実行します。ローカルレシーバーのアサーションの前に、同じ QA-lab OTLP エクスポートを実際の OpenTelemetry Collector Docker コンテナ経由でルーティングします。
- 保護された Prometheus スクレイピングを検証する場合は、`pnpm qa:prometheus:smoke` を実行します。QA-lab を実行し、未認証のスクレイピングを拒否し、リリースに不可欠なメトリクスファミリーにプロンプト内容、生の識別子、認証トークン、ローカルパスが含まれないことを検証します。
- ソースチェックアウトの OpenTelemetry および Prometheus スモークレーンを連続して実行するには、`pnpm qa:observability:smoke` を実行します。
- タグ付きリリースの前に、毎回 `pnpm release:check` を実行します。
- `OpenClaw NPM Release` のプレフライトは、npm tarball をパックする前に依存関係のリリース証拠を生成します。npm アドバイザリの脆弱性ゲートはリリースをブロックします。推移的マニフェストリスク、依存関係の所有権／インストール対象範囲、依存関係変更レポートは、リリース証拠としてのみ使用されます。依存関係変更レポートは、リリース候補を直前の到達可能なリリースタグと比較します。プレフライトは依存関係の証拠を `openclaw-release-dependency-evidence-<tag>` としてアップロードし、準備済み npm プレフライトアーティファクト内の `dependency-evidence/` にも埋め込みます。実際の公開パスはそのプレフライトアーティファクトを再利用し、同じ証拠を `openclaw-<version>-dependency-evidence.zip` として GitHub リリースに添付します。
- タグの作成後、変更を伴う公開シーケンスには `OpenClaw Release Publish` を実行します。通常のベータ版および安定版の公開は、信頼済みの `main` からディスパッチします。リリースタグは引き続き正確な対象コミットを選択し、`release/YYYY.M.PATCH` 内を指す場合があります。Tideclaw アルファ版の公開は、対応するアルファブランチ上に残します。成功した OpenClaw npm `preflight_run_id`、成功した `full_release_validation_run_id`、正確な `full_release_validation_run_attempt` を渡し、意図的に対象を絞った修復を実行する場合を除き、Plugin 公開スコープはデフォルトの `all-publishable` のままにします。このワークフローは、外部化された Plugin より先にコアパッケージが公開されないよう、Plugin の npm 公開、Plugin の ClawHub 公開、OpenClaw の npm 公開を直列化します。Windows および Android のプロモーションは、ドラフトリリースページに対するコア npm 公開と並行して実行されます。公開の再実行は再開可能です。コア npm バージョンがすでに公開済みの場合、ワークフローがレジストリの tarball とタグのプレフライトアーティファクトの一致を証明した後、コアのディスパッチをスキップします。また、リリースに検証済みのアセット契約がすでに含まれている場合は Windows／Android のプロモーションをスキップするため、再試行では失敗したステージのみをやり直します。対象を絞った Plugin のみの修復には、`plugin_publish_scope=selected` と空でない Plugin リストが必要です。Plugin のみの `all-publishable` 実行には、完全かつ不変のプレフライト証拠と Full Release Validation 証拠が必要です。不完全な証拠は拒否されます。
- 安定版の `OpenClaw Release Publish` には、対応するプレリリースではない `openclaw/openclaw-windows-node` リリースが存在した後の正確な `windows_node_tag` と、候補として承認済みの `windows_node_installer_digests` マップが必要です。公開子ワークフローをディスパッチする前に、そのソースリリースが公開済みでプレリリースではなく、必須の x64／ARM64 インストーラーを含み、承認済みマップと引き続き一致することを検証します。その後、OpenClaw リリースがまだドラフトの間に、固定されたインストーラーダイジェストマップを変更せずに引き継いで `Windows Node Release` をディスパッチします。子ワークフローは、その正確なタグから署名済み Windows Hub インストーラーをダウンロードし、固定されたダイジェストと照合し、Windows ランナー上で Authenticode 署名に期待される OpenClaw Foundation の署名者が使用されていることを検証し、SHA-256 マニフェストを書き込み、インストーラーとマニフェストを正式な OpenClaw GitHub リリースへアップロードします。その後、プロモーション済みアセットを再ダウンロードし、マニフェストへの登録とハッシュを検証します。親ワークフローは、公開前に現在の x64、ARM64、チェックサムのアセット契約を検証します。直接リカバリーでは、想定される契約アセットを固定済みソースバイトで置き換える前に、予期しない `OpenClawCompanion-*` アセット名を拒否します。

  `Windows Node Release` を手動でディスパッチするのはリカバリー時のみにし、`latest` は決して使用せず、常に正確なタグと、承認済みソースリリースから取得した明示的な `expected_installer_digests` JSON マップを渡します。ウェブサイトのダウンロードリンクは、現在の安定版リリースに対応する正確な OpenClaw リリースアセット URL を指定するか、GitHub の latest リダイレクトが同じリリースを指すことを検証した後に限り `releases/latest/download/...` を指定する必要があります。関連リポジトリのリリースページだけにリンクしないでください。

- リリースチェックは、独立した手動ワークフロー `OpenClaw Release Checks` で実行されるようになりました。また、リリース承認前に、QA Lab のモック同等性レーン、Matrix リリースプロファイル、Telegram QA レーンも実行されます。ライブレーンは `qa-live-shared` 環境を使用し、Telegram は Convex CI クレデンシャルリースも使用します。保守対象のすべての Matrix シナリオを実行する場合は、`matrix_profile=all` を指定して手動の `QA-Lab - All Lanes` ワークフローを実行します。このワークフローは、ジョブごとのタイムアウト内で完全な証明を維持するため、その選択内容をトランスポート、メディア、E2EE の各プロファイルに分散します。
- クロス OS のインストールおよびアップグレードのランタイム検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、これらは再利用可能なワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出します。この分割は意図的なものです。実際の npm リリースパスを短く、決定的で、アーティファクト重視に保つ一方、時間のかかるライブチェックは独自のレーンに置き、公開処理を停滞またはブロックしないようにします。
- シークレットを伴うリリースチェックは、`Full Release Validation` または `main`/release ワークフロー ref からディスパッチし、ワークフローロジックとシークレットを管理下に保つ必要があります。
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw のブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付けます。
- `OpenClaw NPM Release` の検証専用プリフライトでは、プッシュ済みタグを必要とせず、現在のワークフローブランチの完全な 40 文字のコミット SHA も受け付けます。この SHA パスは検証専用であり、実際の公開へ昇格できません。SHA モードでは、ワークフローはパッケージメタデータチェック専用に `v<package.json version>` を生成します。実際の公開には、引き続き実在するリリースタグが必要です。
- どちらのワークフローも、実際の公開および昇格パスは GitHub ホステッドランナー上で実行し、変更を伴わない検証パスでは、より大規模な Blacksmith Linux ランナーを使用できます。
- そのワークフローは、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使用して `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を実行します。
- npm リリースプリフライトは、独立したリリースチェックレーンの完了を待たなくなりました。
- リリース候補をローカルでタグ付けする前に、`RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` を実行します。このヘルパーは、高速なリリースガードレール、Plugin の npm/ClawHub リリースチェック、ビルド、UI ビルド、`release:openclaw:npm:check` を、GitHub 公開ワークフローの開始前に承認を妨げる一般的なミスを検出できる順序で実行します。
- 承認前に `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`（または対応するプレリリース／修正タグ）を実行します。
- npm への公開後、`node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`（または対応するベータ／修正バージョン）を実行し、新しい一時プレフィックスで公開済みレジストリからのインストールパスを検証します。
- ベータ公開後、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行し、共有のリース済み Telegram クレデンシャルプールを使用して、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証します。メンテナーがローカルで単発実行する場合は Convex 変数を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` 環境クレデンシャルを直接渡すことができます。
- メンテナーマシンから完全な公開後ベータスモークを実行するには、`pnpm release:beta-smoke -- --beta betaN` を使用します。このヘルパーは、Parallels の npm 更新／新規ターゲット検証を実行し、`NPM Telegram Beta E2E` をディスパッチして、該当するワークフロー実行をポーリングし、アーティファクトをダウンロードして、Telegram レポートを出力します。
- メンテナーは、手動の `NPM Telegram Beta E2E` ワークフローを介して、GitHub Actions から同じ公開後チェックを実行できます。これは意図的に手動専用であり、マージのたびには実行されません。
- メンテナー向けリリース自動化では、プリフライト後に昇格する方式を使用します。
  - 実際の npm 公開には、npm `preflight_run_id` の成功が必須です。
  - 通常のベータおよび安定版の公開オーケストレーションとプリフライトでは、正確な対象タグに対して信頼済みの `main` を使用します。Tideclaw アルファの公開とプリフライトでは、対応するアルファブランチを使用します。
  - 安定版 npm リリースのデフォルトは `beta` です。安定版 npm 公開では、ワークフロー入力を介して `latest` を明示的に指定できます。
  - トークンベースの npm dist-tag 変更は `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` に置かれています。これは、ソースリポジトリが OIDC 専用の公開を維持する一方で、`npm dist-tag add` が引き続き `NPM_TOKEN` を必要とするためです。
  - 公開 `macOS Release` は検証専用です。タグがリリースブランチ上にのみ存在し、ワークフローを `main` からディスパッチする場合は、`public_release_branch=release/YYYY.M.PATCH` を設定します。
  - 実際の macOS 公開には、macOS `preflight_run_id` と `validate_run_id` の成功が必須です。
  - 実際の公開パスでは、再ビルドせず、準備済みのアーティファクトを昇格させます。
- `YYYY.M.PATCH-N` のような安定版修正リリースでは、公開後ベリファイアーは、`YYYY.M.PATCH` から `YYYY.M.PATCH-N` への同じ一時プレフィックスのアップグレードパスもチェックします。これにより、リリース修正後も古いグローバルインストールにベース安定版のペイロードが残る事態を防ぎます。
- tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り、npm リリースプリフライトはフェイルクローズします。これにより、空のブラウザダッシュボードを再び出荷することを防ぎます。
- 公開後検証では、公開済み Plugin のエントリポイントとパッケージメタデータが、インストールされたレジストリレイアウトに存在することも確認します。Plugin ランタイムペイロードが欠落したリリースは、公開後ベリファイアーで失敗し、`latest` に昇格できません。
- `pnpm test:install:smoke` は、候補更新 tarball に対して npm pack の `unpackedSize` 予算も適用します。これにより、インストーラー E2E は、リリース公開パスに入る前に意図しないパッケージ肥大化を検出します。
- リリース作業で CI 計画、拡張機能のタイミングマニフェスト、または拡張機能テストマトリクスに変更を加えた場合は、承認前に `.github/workflows/plugin-prerelease.yml` からプランナー管理の `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートに古い CI レイアウトが記載されないようにします。
- 安定版 macOS リリースの準備には、アップデーターの各サーフェスも含まれます。GitHub リリースには、最終的にパッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が含まれている必要があります。公開後、`main` 上の `appcast.xml` は新しい安定版 zip を指す必要があります（macOS 公開ワークフローが自動的にコミットするか、直接プッシュがブロックされている場合は appcast PR を作成します）。また、パッケージ化されたアプリは、デバッグ用ではないバンドル ID、空でない Sparkle フィード URL、およびそのリリースバージョンの標準 Sparkle ビルド下限以上の `CFBundleVersion` を維持する必要があります。

## リリーステストボックス

`Full Release Validation` は、オペレーターが単一のエントリポイントから完全な製品マトリクスを開始する方法です。このヘルパーを使用すると、要求されたコミットをテスト対象候補のまま維持しながら、すべての子ワークフローが、信頼済みの単一の `main` ワークフロー SHA に固定された一時ブランチから実行されます。

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

このヘルパーは、現在の `origin/main` をフェッチし、その信頼済みワークフローコミットで `release-ci/<workflow-sha>-...` をプッシュし、アルファ／ベータのパッケージバージョンから `beta` を、それ以外の場合は `stable` を推測し、`ref=<target-sha>` を指定して一時ブランチから `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が固定された親ワークフロー SHA と一致することを検証してから、一時ブランチを削除します。新規実行を強制するには `-f reuse_evidence=false`、広範な勧告スイープには `-f release_profile=full`、現在の `origin/main` から引き続き到達可能な古いコミットに固定するには `--workflow-sha <trusted-main-sha>` を渡します。ワークフロー自体がリポジトリの ref を書き換えることはありません。これにより、候補にツール用コミットを追加せずに main 専用のリリースツールを利用でき、誤って新しい `main` 子実行を証明することも避けられます。

Code SHA が成功した後、`CHANGELOG.md` のみをコミットし、Release SHA を指定して同じヘルパーを実行します。

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

2 回目の親実行は、Release SHA が Code SHA の子孫であり、変更されたパスの完全な集合が正確に `CHANGELOG.md` であることを GitHub が証明した場合にのみ、製品証拠を再利用します。これは `changelog-only-release-v1` を記録し、製品の子ワークフローをディスパッチしません。tarball のバイト列が変更されているため、npm プリフライトとパッケージ／インストール受け入れテストは引き続き Release SHA で実行されます。

新しい Code SHA の場合、ワークフローはターゲットを解決し、手動の `CI` をディスパッチしてから、`OpenClaw Release Checks` をディスパッチします。`OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、soak が有効な場合のライブ／E2E Docker リリースパスカバレッジ、標準 Telegram パッケージ E2E を含む Package Acceptance、QA Lab 同等性、ライブ Matrix、ライブ Telegram に分散実行します。完全／全対象の実行が許容されるのは、`Full Release Validation` のサマリーで `normal_ci`、`plugin_prerelease`、`release_checks` が成功と表示される場合のみです。ただし、フォーカスした再実行で独立した `Plugin Prerelease` 子ワークフローを意図的にスキップした場合を除きます。`release_package_spec` または `npm_telegram_package_spec` を使用した公開済みパッケージのフォーカス再実行に限り、単独の `npm-telegram` 子ワークフローを使用します。最終ベリファイアーのサマリーには、各子実行で最も時間がかかったジョブの表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。

製品パフォーマンスの子ワークフローは、このリリースパスではアーティファクト専用です。
アンブレラは `publish_reports=false` を指定してこれをディスパッチし、Clawgrit レポートパブリッシャーが
スキップされたままであることをアーティファクト専用ガードが証明しない限り、検証は拒否されます。

完全なステージマトリクス、正確なワークフロージョブ名、安定版と完全プロファイルの違い、アーティファクト、フォーカス再実行用ハンドルについては、[完全なリリース検証](/ja-JP/reference/full-release-validation)を参照してください。

子ワークフローは、`Full Release Validation` を実行する SHA 固定の信頼済み ref からディスパッチされます。すべての子実行は、親ワークフローと完全に同じ SHA を使用する必要があります。リリース証明に生の `--ref main -f ref=<sha>` ディスパッチを使用せず、`pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH` を使用してください。

ライブ／プロバイダーの対象範囲を選択するには、`release_profile` を使用します。

- `beta`: 最速のリリースクリティカルな OpenAI／コアのライブおよび Docker パス
- `stable`: リリース承認向けのベータおよび安定版プロバイダー／バックエンドカバレッジ
- `full`: 安定版に加え、広範な勧告対象のプロバイダー／メディアカバレッジ

安定版および完全検証では、昇格前に、網羅的なライブ／E2E、Docker リリースパス、範囲を限定した公開済みアップグレード生存スイープを必ず実行します。ベータで同じスイープを要求するには、`run_release_soak=true` を使用します。このスイープは、最新 4 つの安定版パッケージに加え、固定された `2026.4.23` および `2026.5.2` ベースラインと、さらに古い `2026.4.15` のカバレッジを対象とします。重複するベースラインは除去され、各ベースラインは個別の Docker ランナージョブに分割されます。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用してターゲット ref を一度だけ `release-package-under-test` として解決し、soak 実行時にクロス OS、Package Acceptance、リリースパス Docker チェックでそのアーティファクトを再利用します。これにより、パッケージに関わるすべてのボックスが同じバイト列を使用し、パッケージの繰り返しビルドを回避できます。ベータ版がすでに npm に公開されている場合は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を設定します。これにより、リリースチェックは出荷済みパッケージを一度だけダウンロードし、`dist/build-info.json` からビルド元 SHA を抽出して、そのアーティファクトをクロス OS、Package Acceptance、リリースパス Docker、パッケージ Telegram の各レーンで再利用します。

クロス OS の OpenAI インストールスモークでは、リポジトリ／組織変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL`、それ以外の場合は `openai/gpt-5.6-luna` を使用します。このレーンの目的は、最も高性能なモデルのベンチマークではなく、パッケージのインストール、オンボーディング、Gateway の起動、1 回のライブエージェントターンを証明することだからです。モデル固有のカバレッジは、引き続き、より広範なライブプロバイダーマトリクスで扱います。

リリース段階に応じて、次のバリエーションを使用します。

```bash
# 製品完成時の Code SHA を検証します。
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

対象を絞った修正後の最初の再実行に、完全な包括ワークフローを使用しないでください。1 つのボックスが失敗した場合、次の検証には、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデルプロバイダー、または QA レーンを使用します。共有リリースオーケストレーションが修正によって変更された場合、または以前の全ボックスのエビデンスが古くなった場合に限り、完全な包括ワークフローを再実行します。包括ワークフローの最終検証処理は、記録された子ワークフローの実行 ID を再確認するため、子ワークフローを正常に再実行した後は、失敗した `Verify full validation` 親ジョブだけを再実行します。

リリースプロファイル、実際のソーク設定、および検証入力が一致し、対象 SHA が同一であるか、新しい対象がその子孫であり、変更されたパスの完全なセットが正確に `CHANGELOG.md` である場合、`rerun_group=all` は以前に成功した包括ワークフローの実行を再利用できます。同一対象の再利用では
`exact-target-full-validation-v1` を記録し、検証後の Release SHA では
`changelog-only-release-v1` を記録します。後者が再利用するのは製品検証だけです。Npm
事前確認、パッケージのバイト列、リリースノートの来歴、およびインストール／更新の受け入れ検証は、
引き続き Release SHA に対して実行する必要があります。バージョン、ソース、生成物、
依存関係、パッケージ、またはワークフローが所有する対象に変更がある場合、新しい Code SHA
と新規の完全検証が必要です。同じ `release/*` ref および
再実行グループに対する新しい包括ワークフローの実行は、進行中の実行を自動的に置き換えます。新規の完全実行を強制するには、
`reuse_evidence=false` を渡します。

範囲を限定した復旧では、包括ワークフローに `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常の CI 子ワークフローのみ、`plugin-prerelease` はリリース専用 Plugin 子ワークフローのみ、`release-checks` はすべてのリリースボックスを実行します。より限定的なリリースグループは、`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、および `npm-telegram` です。対象を絞った `npm-telegram` の再実行には `release_package_spec` または `npm_telegram_package_spec` が必要です。完全実行／全実行では、Package Acceptance 内の標準パッケージ Telegram E2E を使用します。対象を絞ったクロス OS 再実行には、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS／スイートフィルターを追加できます。QA リリースチェックの失敗は、標準ティアで必須となる OpenClaw 動的ツールのドリフトを含め、通常のリリース検証をブロックします。Tideclaw アルファ実行では、パッケージ安全性に関係しないリリースチェックレーンを引き続き参考情報として扱うことができます。`release_profile=beta` の場合、`Run repo/live E2E validation` ライブプロバイダースイートは参考情報扱いです（警告であり、ブロッカーではありません）。stable および full プロファイルでは、引き続きブロッカーとして扱います。`live_suite_filter` が Discord、WhatsApp、Slack などのゲート付き QA ライブレーンを明示的に要求する場合、対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` リポジトリ変数を有効にする必要があります。有効でない場合、レーンを暗黙にスキップするのではなく、入力の取得が失敗します。

### Vitest

Vitest ボックスは、手動の `CI` 子ワークフローです。手動 CI は意図的に変更範囲の限定を回避し、リリース候補に対して通常のテストグラフを強制します。対象には、Linux Node シャード、同梱 Plugin シャード、Plugin およびチャネル契約シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済み成果物のスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、および Control UI i18n が含まれます。包括ワークフローが `include_android=true` を渡すため、`Full Release Validation` がボックスを実行する場合は Android も含まれます。単独の手動 CI で Android を対象にするには、`include_android=true` が必要です。

このボックスは、「ソースツリーが通常の完全テストスイートに合格したか」という問いに答えるために使用します。これは、リリースパスの製品検証と同じではありません。保持するエビデンス：

- `Full Release Validation` のサマリー（起動された `CI` の実行 URL を表示）
- 正確な対象 SHA で成功した `CI` の実行
- リグレッション調査時の CI ジョブに含まれる、失敗したシャードまたは低速なシャードの名前
- 実行のパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミング成果物

リリースで決定論的な通常 CI が必要であり、Docker、QA Lab、ライブ、クロス OS、またはパッケージの各ボックスが不要な場合に限り、手動 CI を直接実行します。Android を含まない直接 CI には、最初のコマンドを使用します。リリース候補の直接 CI で Android も対象にする必要がある場合は、`include_android=true` を追加します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker ボックスは、`OpenClaw Release Checks` から `openclaw-live-and-e2e-checks-reusable.yml`、およびリリースモードの `install-smoke` ワークフローにあります。ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリースの Docker 対象範囲には以下が含まれます。

- 低速な Bun グローバルインストールのスモークを有効にした完全インストールスモーク
- 対象 SHA ごとのルート Dockerfile スモークイメージの準備／再利用。QR、ルート／Gateway、およびインストーラー／Bun のスモークジョブを個別のインストールスモークシャードとして実行
- リポジトリ E2E レーン
- リリースパスの Docker チャンク：`core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a` から `plugins-runtime-install-h`、および `openwebui`
- 要求された場合、専用の大容量ディスクランナーで実行する OpenWebUI の検証
- 分割された同梱 Plugin のインストール／アンインストールレーン（`bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`）
- リリースチェックにライブスイートが含まれる場合のライブ／E2E プロバイダースイートおよび Docker ライブモデルの検証

再実行する前に Docker 成果物を使用してください。リリースパスのスケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズの所要時間、スケジューラープラン JSON、および再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。対象を絞った復旧では、すべてのリリースチャンクを再実行する代わりに、再利用可能なライブ／E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成される再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` および準備済み Docker イメージの入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは、Vitest および Docker のパッケージ処理とは別の、エージェント動作およびチャネルレベルのリリースゲートです。

リリースの QA Lab 対象範囲には以下が含まれます。

- エージェントパリティパックを使用し、OpenAI 候補レーンを `anthropic/claude-opus-4-8` ベースラインと比較するモックパリティレーン
- `qa-live-shared` 環境を使用する Matrix ライブアダプターのリリースプロファイル
- Convex CI の認証情報リースを使用するライブ Telegram QA レーン
- リリーステレメトリで明示的なローカル検証が必要な場合の `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke`、または `pnpm qa:observability:smoke`

このボックスは、「QA シナリオおよびライブチャネルフローでリリースが正しく動作するか」という問いに答えるために使用します。リリースを承認する際は、パリティ、Matrix、および Telegram レーンの成果物 URL を保持してください。Matrix の完全な検証は、デフォルトのリリースクリティカルレーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージボックスは、インストール可能な製品のゲートです。`Package Acceptance` およびリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。リゾルバーは候補を Docker E2E で使用する `package-under-test` tarball に正規化し、パッケージの内容一覧を検証し、パッケージのバージョンと SHA-256 を記録し、ワークフローハーネスの ref とパッケージソースの ref を分離して保持します。

対応する候補ソース：

- `source=npm`：`openclaw@beta`、`openclaw@latest`、または OpenClaw の正確なリリースバージョン
- `source=ref`：選択した `workflow_ref` ハーネスを使用して、信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA をパック
- `source=url`：必須の `package_sha256` を指定して公開 HTTPS `.tgz` をダウンロード。URL の認証情報、デフォルト以外の HTTPS ポート、プライベート／内部／特殊用途のホスト名または解決済みアドレス、および安全でないリダイレクトは拒否
- `source=trusted-url`：`.github/package-trusted-sources.json` 内の名前付きポリシーから、必須の `package_sha256` および `trusted_source_id` を指定して HTTPS `.tgz` をダウンロード。`source=url` に入力レベルのプライベートネットワーク回避策を追加するのではなく、メンテナー所有のエンタープライズミラーまたはプライベートパッケージリポジトリにはこれを使用
- `source=artifact`：別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージ成果物、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`、`telegram_mode=mock-openai` を使用して Package Acceptance を実行します。Package Acceptance では、同じ解決済み tarball に対して、移行、更新、ルート管理 VPS のアップグレード、設定済み認証の更新後再起動、ライブ ClawHub skill のインストール、古い Plugin 依存関係のクリーンアップ、オフライン Plugin フィクスチャ、Plugin の更新、Plugin コマンドバインディングのエスケープ強化、および Telegram パッケージ QA を維持します。ブロック対象のリリースチェックでは、デフォルトで公開済みの最新パッケージをベースラインとして使用します。`run_release_soak=true`、`release_profile=stable`、または `release_profile=full` を指定したベータプロファイルでは、公開済みアップグレード耐久性の検証範囲を、`last-stable-4` に加えて固定された `2026.4.23`、`2026.5.2`、および `2026.4.15` ベースラインまで拡張し、`reported-issues` シナリオを使用します。すでにリリース済みの候補には `source=npm`、公開前の SHA に基づくローカル npm tarball には `source=ref`、メンテナー所有のエンタープライズ／プライベートミラーには `source=trusted-url`、別の GitHub Actions 実行でアップロードされた準備済み tarball には `source=artifact` を指定して Package Acceptance を使用します。

これは、以前は Parallels が必要だったパッケージ／更新の検証範囲の大部分を置き換える GitHub ネイティブの仕組みです。OS 固有のオンボーディング、インストーラー、およびプラットフォームの動作にはクロス OS リリースチェックが引き続き重要ですが、パッケージ／更新の製品検証では Package Acceptance を優先します。

更新および Plugin 検証の標準チェックリストは、[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)です。Plugin のインストール／更新、doctor のクリーンアップ、または公開済みパッケージの移行変更を、ローカル、Docker、Package Acceptance、リリースチェックのどのレーンで検証するかを決定する際に使用します。すべての stable `2026.4.23+` パッケージからの公開済み更新移行を網羅的に検証する処理は、Full Release CI の一部ではなく、独立した手動の `Update Migration` ワークフローです。

従来の Package Acceptance の緩和措置には、意図的に期限が設定されています。`2026.4.25` までのパッケージでは、npm にすでに公開されているメタデータ不足に対して互換性パスを使用できます。これには、tarball に存在しないプライベート QA 内容一覧エントリ、欠落した `gateway install --wrapper`、tarball 由来の git フィクスチャに存在しないパッチファイル、永続化されていない `update.channel`、従来の Plugin インストール記録の場所、マーケットプレイスのインストール記録の永続化不足、および `plugins update` 中の設定メタデータ移行が含まれます。公開済みの `2026.4.26` パッケージでは、すでにリリースされたローカルビルドメタデータのスタンプファイルについて警告を許容できます。それ以降のパッケージは最新のパッケージ契約を満たす必要があり、同じ不足があるとリリース検証に失敗します。

リリースに関する確認事項が実際にインストール可能なパッケージについてである場合、より広範な Package Acceptance プロファイルを使用します。

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

- `smoke`: パッケージの迅速なインストール/チャネル/エージェント、Gateway ネットワーク、設定再読み込みのレーン
- `package`: インストール/更新/再起動/Plugin パッケージのコントラクト、および ClawHub Skills のライブインストール証明。これはリリースチェックのデフォルトです
- `product`: `package` に加えて、MCP チャネル、Cron/サブエージェントのクリーンアップ、OpenAI ウェブ検索、OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスのチャンク
- `custom`: 対象を絞った再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明では、Package Acceptance で `telegram_mode=mock-openai` または `telegram_mode=live-frontier` を有効にします。ワークフローは、解決された `package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの Telegram ワークフローでは、公開後チェック用に、公開済みの npm spec も引き続き受け付けます。

## 通常のリリース公開自動化

ベータ、`latest`、Plugin、GitHub Release、プラットフォームの公開では、
`OpenClaw Release Publish` が通常の変更を伴うエントリポイントです。毎月の
`.33+` npm 専用 extended-stable パスでは、このオーケストレーターを使用しません。
通常のワークフローは、リリースに必要な順序で trusted-publisher
ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*`（alpha プレリリースの場合は Tideclaw alpha ブランチ）から到達可能であることを検証します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` および `ref=<release-sha>` を指定して `Plugin NPM Release` をディスパッチします。
5. 同じスコープと SHA で `Plugin ClawHub Release` をディスパッチします。
6. 保存済みの `full_release_validation_run_id` と正確な実行試行を検証した後、リリースタグ、npm dist-tag、保存済みの `preflight_run_id` を指定して `OpenClaw NPM Release` をディスパッチします。
7. stable リリースでは、GitHub release をドラフトとして作成または更新し、明示的な `windows_node_tag` と候補として承認済みの `windows_node_installer_digests` を指定して `Windows Node Release` をディスパッチし、正規の Windows インストーラー/チェックサムアセットを検証します。また、正確なタグの署名済み APK、チェックサム、provenance をビルドするために `Android Release` もディスパッチします。ドラフトを公開する前に、両方のネイティブアセットのコントラクトを検証します。

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

デフォルトの beta dist-tag への stable 公開:

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

`latest` への stable の直接昇格は明示的に行います。

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

下位レベルの `Plugin NPM Release` および `Plugin ClawHub Release` ワークフローは、対象を絞った修復または再公開作業にのみ使用してください。`OpenClaw Release Publish` は、`publish_openclaw_npm=true` の場合に `plugin_publish_scope=selected` を拒否するため、`@openclaw/diffs-language-pack` を含む公開可能なすべての公式 Plugin なしでコアパッケージが出荷されることはありません。選択した Plugin を修復するには、`plugin_publish_scope=selected` および `plugins=@openclaw/name` とともに `publish_openclaw_npm=false` を設定するか、子ワークフローを直接ディスパッチします。

初回公開時の ClawHub ブートストラップは例外です。信頼された `main` から `Plugin ClawHub New`
をディスパッチし、`ref` を通じて対象リリースの完全な SHA を渡します。
ブートストラップワークフロー自体をリリースタグまたはブランチから実行してはいけません。

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

タグ付け前の検証では `dry_run=true` が必須であり、リリースタグと親実行の
入力を拒否し、`main` または `release/*` から到達可能な正確な対象のみを受け付けます。
ClawHub の認証情報を読み込まず、パッケージバイトを公開せず、trusted
publisher の設定も変更しません。ワークフローは引き続きライブレジストリプランを解決し、
シークレットを使用しないジョブでのみ対象をチェックアウトしてパックし、ロックされた
ClawHub ツールチェーンを実体化し、リリースタグが存在する前に不変アーティファクトとパッケージの
slug/identity を検証します。シークレットを使用しないパックジョブが完了した後にのみ、
`clawhub-plugin-bootstrap` 環境を承認してください。この保護された検証ジョブには認証情報も変更コマンドもありません。

承認済みの dry run、またはタグ付け後の実際のブートストラップには、正確な
リリースタグに加え、親の `OpenClaw Release Publish` の実行 ID、試行、ブランチを含める必要があります。
親は自身のワークフロー SHA と、`Plugin ClawHub New` に対する別個の正確な信頼済み
`main` SHA を証明します。子実行と、保護された環境に対するすべての
承認は、その承認済みの子 SHA と一致する必要があります。リリースタグは、
公開試行および trusted-publisher の変更のたびに再確認されます。

パックジョブは、
名前、Actions アーティファクト ID/ダイジェスト、生成元の実行/試行、対象 SHA、
パッケージごとの tarball SHA-256/サイズが検証ジョブおよび保護ジョブに引き継がれる、
1 つの不変アーティファクトをアップロードします。保護ジョブは、信頼された `main`
ツールのみをチェックアウトし、GitHub API を介してアーティファクトのタプルを検証し、
正確なアーティファクト ID でダウンロードして、すべての tarball を再ハッシュし、
固定された CLI の USTAR 正規化ルールに従ってローカル TAR パスと
パッケージ identity を検証します。その後、すべての候補は固定された CLI の公開 dry-run
を通過します。この dry-run は、レジストリ検索または認証の前に戻ります。
認証情報を使用するジョブのプリフィルターは、圧縮済み ClawPack を 120 MiB、
ファイルペイロードの合計を 50 MiB、展開済み TAR データを 64 MiB、TAR エントリ数を
10,000 に制限します。既存パッケージの trusted-publisher 修復は引き続き設定のみですが、
対象をパックし、trusted-publisher の設定を変更する前に、要求されたタグと正確なレジストリバイトおよび
メタデータの一致を必要とします。公開後検証では ClawHub アーティファクトをダウンロードし、
同一の SHA-256 とサイズを要求します。失敗した実行の再実行による復旧では、正確な生成元ジョブが
正常に完了している場合に限り、以前の試行のパッケージアーティファクトを再利用できます。
最終証拠は、ロックされた ClawHub バージョン、ロック SHA-256、npm integrity にも紐付けられます。
不一致がある場合は、新しいパッケージバージョンが必要です。

## NPM ワークフローの入力

`OpenClaw NPM Release` は、次のオペレーター制御入力を受け付けます。

- `tag`: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1`、`v2026.4.2-alpha.1` などの必須リリースタグ。`preflight_only=true` の場合は、検証のみの preflight 用に、現在の完全な 40 文字のワークフローブランチコミット SHA も指定できます
- `preflight_only`: 検証/ビルド/パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 既存の正常終了した preflight 実行 ID。実際の公開パスでは必須であり、ワークフローは tarball を再ビルドせず、準備済みのものを再利用します
- `full_release_validation_run_id`: このタグ/SHA に対する正常終了した `Full Release Validation` 実行 ID。実際の公開では必須です。ベータ公開は警告付きで preflight のみでも続行できますが、stable/`latest` への昇格では引き続き必須です。
- `full_release_validation_run_attempt`: `full_release_validation_run_id` と組み合わせる正確な正の実行試行番号。再実行によって公開中の認可証拠が変更されないように、実行 ID が指定されている場合は必須です。
- `release_publish_run_id`: 承認済みの `OpenClaw Release Publish` 実行 ID。このワークフローがその親によってディスパッチされる場合に必須です（bot actor による実際の公開呼び出し）
- `plugin_npm_run_id`: 正常終了した exact-head の `Plugin NPM Release` 実行 ID。実際の `extended-stable` コア公開では必須です
- `npm_dist_tag`: 公開パスの npm 対象タグ。`alpha`、`beta`、`latest`、`extended-stable` を受け付け、デフォルトは `beta` です。最終パッチ `33` 以降では `extended-stable` を使用する必要があります。デフォルトでは、`extended-stable` はそれ以前のパッチを拒否し、最終版でないタグは常に拒否します。
- `bypass_extended_stable_guard`: テスト専用のブール値。デフォルトは `false` です。`npm_dist_tag=extended-stable` の場合、リリース identity、アーティファクト、承認、readback の各チェックを維持しながら、毎月の extended-stable 適格性を迂回します。

`Plugin NPM Release` は、既存のリリース動作には `npm_dist_tag=default`、
ガード付きの毎月のパスには `npm_dist_tag=extended-stable` を受け付けます。
extended-stable オプションでは、`publish_scope=all-publishable`、空の
`plugins` 入力、`33` 以上の最終パッチ、および正確な先端にある正規の
`extended-stable/YYYY.M.33` ブランチが必要です。Plugin の
`latest` または `beta` は決して移動しません。新しいパッケージバージョンには、OIDC trusted publication（`npm publish --tag extended-stable`）
を介して `extended-stable` がアトミックに付与されます。この
ソースワークフローでは、トークン認証された `npm dist-tag add` を使用しません。再試行では、
npm にすでに存在する正確なバージョンをスキップした後、すべての正確なパッケージと
`extended-stable` タグが収束したことを完全な readback で確認できない限り、安全側に倒して失敗します。

`OpenClaw Release Publish` は、次のオペレーター制御入力を受け付けます。

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 正常終了した `OpenClaw NPM Release` preflight 実行 ID。`publish_openclaw_npm=true` または `plugin_publish_scope=all-publishable` の場合に必須です
- `full_release_validation_run_id`: 正常終了した `Full Release Validation` 実行 ID。`publish_openclaw_npm=true` または `plugin_publish_scope=all-publishable` の場合に必須です
- `full_release_validation_run_attempt`: `full_release_validation_run_id` と組み合わせる正確な正の試行番号。実行 ID が指定されている場合は必須です
- `windows_node_tag`: 正確なプレリリースではない `openclaw/openclaw-windows-node` リリースタグ。stable OpenClaw 公開では必須です
- `windows_node_installer_digests`: 現在の Windows インストーラー名と固定された `sha256:` ダイジェストとの、候補として承認済みのコンパクトな JSON マップ。stable OpenClaw 公開では必須です
- `npm_telegram_run_id`: 最終リリース証拠に含める、正常終了した `NPM Telegram Beta E2E` 実行 ID（任意）
- `npm_dist_tag`: OpenClaw パッケージの npm 対象タグ。`alpha`、`beta`、`latest` のいずれか
- `plugin_publish_scope`: デフォルトは `all-publishable` です。`publish_openclaw_npm=false` を使用する、対象を絞った Plugin のみの修復作業に限り `selected` を使用してください
- `plugins`: `plugin_publish_scope=selected` の場合に使用する、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true` です。このワークフローを Plugin のみの修復オーケストレーターとして使用する場合に限り、`false` を設定してください
- `release_profile`: リリース証拠の概要に使用するリリースカバレッジプロファイル。デフォルトは `from-validation` で、検証マニフェストから読み取ります。または、`beta`、`stable`、`full` で上書きできます
- `wait_for_clawhub`: ClawHub サイドカーによって npm の可用性が妨げられないよう、デフォルトは `false` です。ワークフローの完了に ClawHub の完了を含める必要がある場合に限り、`true` を設定してください

`OpenClaw Release Checks` は、次のオペレーター制御入力を受け付けます。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを使用するチェックでは、解決されたコミットが OpenClaw のブランチまたはリリースタグから到達可能である必要があります。
- `run_release_soak`: ベータリリースチェックで、網羅的なライブ/E2E、Docker リリースパス、および全期間のアップグレード生存確認用長時間テストを有効にします。`release_profile=stable` および `release_profile=full` によって強制的に有効化されます。

ルール:

- パッチ `33` 未満の通常の最終版および修正版は、`beta` または `latest` のいずれにも公開できます。パッチ `33` 以上の最終版は `extended-stable` に公開する必要があり、その境界にある修正サフィックス付きバージョンは拒否されます。
- ベータのプレリリースタグは `beta` にのみ公開でき、アルファのプレリリースタグは `alpha` にのみ公開できます
- `OpenClaw NPM Release` では、`preflight_only=true` の場合にのみ完全なコミット SHA を入力できます
- `OpenClaw Release Checks` および `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、事前確認時に使用したものと同じ `npm_dist_tag` を使用する必要があります。公開を続行する前に、ワークフローがそのメタデータを検証します

## 通常のベータ/最新安定版リリース手順

この従来の手順は、プラグイン、GitHub Release、Windows、およびその他のプラットフォーム作業も担う、通常のオーケストレーションされたリリース用です。このページの冒頭で説明されている、月次の `.33+` npm 専用延長安定版パスではありません。

通常のオーケストレーションされた安定版リリースを作成する場合:

1. `OpenClaw NPM Release` を `preflight_only=true` で実行します。タグが存在する前は、事前確認ワークフローの検証専用ドライランに、現在のワークフローブランチの完全なコミット SHA を使用できます。
2. 通常のベータ先行フローでは `npm_dist_tag=beta` を選択し、意図的に安定版を直接公開する場合にのみ `latest` を選択します。
3. 1 つの手動ワークフローで通常の CI に加えて、ライブプロンプトキャッシュ、Docker、QA Lab、Matrix、Telegram を対象にする場合は、リリースブランチ、リリースタグ、または完全なコミット SHA に対して `Full Release Validation` を実行します。意図的に決定論的な通常テストグラフのみが必要な場合は、代わりにリリース参照に対して手動の `CI` ワークフローを実行します。
4. 署名済みの x64 および ARM64 インストーラーを出荷する、プレリリースではない正確な `openclaw/openclaw-windows-node` リリースタグを選択します。それを `windows_node_tag` として保存し、検証済みのダイジェストマップを `windows_node_installer_digests` として保存します。リリース候補ヘルパーは両方を記録し、生成する公開コマンドに含めます。
5. 成功した `preflight_run_id`、`full_release_validation_run_id`、および正確な `full_release_validation_run_attempt` を保存します。
6. 信頼された `main` から `OpenClaw Release Publish` を、同じ `tag`、同じ `npm_dist_tag`、選択した `windows_node_tag`、保存したその `windows_node_installer_digests`、保存した `preflight_run_id`、`full_release_validation_run_id`、および `full_release_validation_run_attempt` を使用して実行します。OpenClaw npm パッケージを昇格する前に、外部化されたプラグインを npm および ClawHub に公開します。
7. リリースが `beta` に公開された場合は、`openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その安定版を `beta` から `latest` に昇格します。
8. リリースを意図的に `latest` に直接公開し、`beta` も同じ安定版ビルドに直ちに追従させる場合は、同じリリースワークフローを使用して両方の dist-tag をその安定版に向けるか、スケジュールされた自己修復同期によって後から `beta` を移動させます。

dist-tag の変更は、引き続き `NPM_TOKEN` を必要とするため、リリース台帳リポジトリで行われます。一方、ソースリポジトリでは OIDC のみを使用した公開を維持します。これにより、直接公開パスとベータ先行の昇格パスの両方が文書化され、オペレーターから確認できる状態に保たれます。

メンテナーがローカル npm 認証にフォールバックする必要がある場合は、1Password CLI（`op`）コマンドを専用の tmux セッション内でのみ実行してください。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内で実行することで、プロンプト、アラート、OTP の処理を確認可能にし、ホストでアラートが繰り返し発生するのを防止できます。

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

メンテナーは、実際の手順書として [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) にある非公開のリリースドキュメントを使用します。

## 関連項目

- [リリースチャンネル](/ja-JP/install/development-channels)
