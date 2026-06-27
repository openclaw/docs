---
read_when:
    - 公開リリースチャンネル定義を検索中
    - リリース検証またはパッケージ受け入れの実行
    - バージョンの命名とリリース頻度を探す
summary: リリースレーン、オペレーターチェックリスト、検証ボックス、バージョン命名、ケイデンス
title: リリースポリシー
x-i18n:
    generated_at: "2026-06-27T12:54:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には 3 つの公開リリースレーンがあります。

- stable: 明示的に要求された場合は npm `latest` に、それ以外はデフォルトで npm `beta` に公開されるタグ付きリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- Stable リリースバージョン: `YYYY.M.PATCH`
  - Git タグ: `vYYYY.M.PATCH`
- Stable 修正リリースバージョン: `YYYY.M.PATCH-N`
  - Git タグ: `vYYYY.M.PATCH-N`
- Beta プレリリースバージョン: `YYYY.M.PATCH-beta.N`
  - Git タグ: `vYYYY.M.PATCH-beta.N`
- 月または patch をゼロ埋めしない
- 2026 年 6 月のリリースプロセス更新以降、3 番目のコンポーネントは
  暦日ではなく、月次リリーストレインの連番です。Stable と beta
  リリースが現在のトレインを決定します。alpha のみのタグは beta/stable
  patch 番号を消費または進めません。更新前のタグと npm バージョンは
  既存の名前を維持し、有効なままです。リリース自動化は引き続き
  年、月、patch、チャネル、プレリリースまたは修正番号で比較します。
- Alpha/nightly ビルドは次の未リリース patch トレインを使用し、繰り返し
  ビルドでは `alpha.N` のみを増やします。その patch に beta が作成されると、
  新しい alpha ビルドは次の patch に移ります。beta または stable トレインを
  選択するときは、より高い patch 番号を持つレガシー alpha のみのタグを無視します。
- npm バージョンは不変です。beta タグがすでに公開されている場合は、
  削除、再公開、再利用をしないでください。次の beta 番号または次の月次
  patch を切ってください。移行中に `2026.6.5-beta.1` がすでに公開されたため、
  2026 年 6 月のリリーストレインは patch `5` 以上を使用する必要があります。
  2026 年 6 月の新しい stable または beta トレインを `2026.6.2`、`2026.6.3`、
  `2026.6.4` として公開しないでください。
- stable `2026.6.5` の後、次の新しい beta トレインは `2026.6.6-beta.1` です。
  より高い patch 番号を持つ自動 alpha のみのタグがすでに存在していても同じです。
- `latest` は、現在昇格済みの stable npm リリースを意味します
- `beta` は、現在の beta インストール対象を意味します
- Stable と stable 修正リリースはデフォルトで npm `beta` に公開されます。リリース担当者は `latest` を明示的に対象にすることも、検証済みの beta ビルドを後で昇格することもできます
- すべての stable OpenClaw リリースでは、npm パッケージ、macOS アプリ、署名済み
  Windows Hub インストーラーをまとめて出荷します。beta リリースでは通常、
  npm/package パスを先に検証して公開し、ネイティブアプリの build/sign/notarize/promote は
  明示的に要求されない限り stable 用に残します

## リリース頻度

- リリースは beta 優先で進みます
- Stable は最新の beta が検証された後にのみ続きます
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.PATCH` ブランチから
  リリースを切ります。これにより、リリース検証と修正が `main` の新規開発を
  ブロックしません
- beta タグが push または公開された後に修正が必要になった場合、メンテナーは
  古い beta タグを削除または再作成する代わりに、次の `-beta.N` タグを切ります
- 詳細なリリース手順、承認、認証情報、復旧メモは
  メンテナー専用です

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開上の形です。非公開の認証情報、
署名、notarization、dist-tag 復旧、緊急ロールバックの詳細は
メンテナー専用リリースランブックに残します。

1. 現在の `main` から開始します。最新を pull し、対象コミットが push 済みであることを確認し、
   現在の `main` CI がそこからブランチを切るのに十分 green であることを確認します。
2. 最後に到達可能なリリースタグ以降にマージされた PR とすべての直接
   コミットから、`CHANGELOG.md` の先頭セクションを生成します。エントリはユーザー向けに保ち、
   重複する PR/直接コミットのエントリを重複排除し、書き換えを commit して push し、
   ブランチ作成前にもう一度 rebase/pull します。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性記録を確認します。期限切れの
   互換性は、アップグレードパスが引き続きカバーされている場合にのみ削除するか、意図的に
   維持する理由を記録します。
4. 現在の `main` から `release/YYYY.M.PATCH` を作成します。通常のリリース作業を
   `main` で直接行わないでください。
5. 意図したタグに必要なすべてのバージョン箇所を bump し、その後
   `pnpm release:prep` を実行します。これは Plugin バージョン、Plugin インベントリ、config
   schema、同梱チャネル config metadata、config docs baseline、Plugin SDK
   exports、Plugin SDK API baseline を正しい順序で更新します。タグ付け前に生成された
   drift を commit します。次にローカルの決定論的 preflight を実行します。
   `pnpm check:test-types`、`pnpm check:architecture`、
   `pnpm build && pnpm ui:build`、`pnpm release:check`。
6. `OpenClaw NPM Release` を `preflight_only=true` で実行します。タグが存在する前は、
   検証専用 preflight に完全な 40 文字のリリースブランチ SHA を使用できます。
   preflight は、正確にチェックアウトされた依存関係グラフに対する依存関係リリース証跡を生成し、
   npm preflight artifact に保存します。成功した `preflight_run_id` を保存します。
7. リリースブランチ、タグ、または完全な commit SHA に対して `Full Release Validation` で
   すべてのプレリリーステストを開始します。これは 4 つの大きなリリーステストボックス、
   Vitest、Docker、QA Lab、Package のための単一の手動エントリーポイントです。
8. 検証が失敗した場合は、リリースブランチで修正し、修正を証明する最小の失敗した
   ファイル、レーン、workflow job、package profile、provider、または model allowlist を
   再実行します。変更された surface によって以前の証跡が古くなる場合にのみ、
   umbrella 全体を再実行します。
9. タグ付き beta candidate の場合は、対応する
   `release/YYYY.M.PATCH` ブランチから
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` を実行します。stable の場合は、必要な Windows source
   release も渡します。
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`。
   この helper はローカルの生成済みリリースチェックを実行し、full release validation と npm preflight evidence を
   dispatch または検証し、正確に準備された tarball に対する Parallels
   fresh/update proof と Telegram package proof を実行し、Plugin npm と ClawHub の plan を記録し、
   evidence bundle が green になった後でのみ正確な
   `OpenClaw Release Publish` コマンドを出力します。
   `OpenClaw Release Publish` は、選択された、または公開可能なすべての Plugin
   パッケージを npm に、同じセットを ClawHub に並列で dispatch し、その後 Plugin npm publish が成功し次第、
   準備済み OpenClaw npm preflight artifact を一致する dist-tag で昇格します。
   OpenClaw npm publish child が成功した後、完全に一致する
   `CHANGELOG.md` セクションから対応する GitHub release/prerelease ページを作成または更新します。npm `latest` に公開された Stable リリースは
   GitHub latest release になります。npm `beta` に保持された stable maintenance release は
   GitHub `latest=false` で作成されます。この workflow は、preflight
   dependency evidence、full-validation manifest、postpublish registry
   verification evidence も GitHub release にアップロードし、リリース後のインシデント対応に備えます。
   publish workflow は child run ID を即座に出力し、workflow token が承認できる release environment gate を
   自動承認し、失敗した child job を log tail 付きで要約し、OpenClaw npm publish が成功し次第
   GitHub release と dependency evidence をクローズアウトし、OpenClaw npm が公開される場合は ClawHub を待機し、
   その後 `pnpm release:verify-beta` を実行して、GitHub release、npm package、選択された
   Plugin npm package、選択された ClawHub package、child workflow run ID、任意の NPM Telegram run ID の
   postpublish evidence をアップロードします。ClawHub パスは一時的な CLI
   dependency install failure を retry し、preview cell の 1 つが flake しても preview に合格した Plugin を公開し、
   すべての想定 Plugin version の registry verification で終了するため、部分的な publish が可視で retry 可能なままになります。次に post-publish
   package acceptance を、公開済みの
   `openclaw@YYYY.M.PATCH-beta.N` または
   `openclaw@beta` package に対して実行します。push または公開済みの prerelease に修正が必要な場合は、
   次の一致する prerelease number を切ります。古い prerelease を削除または書き換えないでください。
10. stable の場合は、検証済み beta または release candidate に必要な検証証跡がある場合にのみ
    続行します。Stable npm publish も
    `OpenClaw Release Publish` を通り、成功した preflight artifact を
    `preflight_run_id` で再利用します。stable macOS release readiness には、
    package 済みの `.zip`、`.dmg`、`.dSYM.zip`、更新済み `appcast.xml` が `main` にあることも必要です。
    macOS publish workflow は、release asset の検証後に署名済み appcast を public `main` に
    自動で公開します。branch protection が直接 push をブロックする場合は、appcast PR を開くか更新します。Stable Windows Hub
    readiness には、OpenClaw GitHub release 上の署名済み `OpenClawCompanion-Setup-x64.exe`、
    `OpenClawCompanion-Setup-arm64.exe`、
    `OpenClawCompanion-SHA256SUMS.txt` asset が必要です。
    正確な署名済み `openclaw/openclaw-windows-node` release tag を
    `windows_node_tag` として渡し、その candidate 承認済み installer digest map を
    `windows_node_installer_digests` として渡します。`OpenClaw Release Publish` は
    release draft を保持し、`Windows Node Release` を dispatch し、公開前に 3 つすべての
    asset を検証します。
11. 公開後、npm post-publish verifier、post-publish channel proof が必要な場合は任意の standalone
    published-npm Telegram E2E、必要に応じて dist-tag promotion を実行し、生成された GitHub release page を検証し、
    release announcement steps を実行してから、stable release を完了と呼ぶ前に [Stable main
    クローズアウト](#stable-main-closeout) を完了します。

## Stable main クローズアウト

Stable 公開は、`main` が実際に出荷された
リリース状態を保持するまで完了していません。

1. 新しい最新の `main` から開始する。`release/YYYY.M.PATCH` をそれと照合して監査し、
   `main` に存在しない実際の修正を forward-port する。リリース専用の互換性、
   テスト、または検証アダプターを新しい `main` に盲目的にマージしない。
2. `main` を推測上の次のトレインではなく、出荷済みの安定版に設定する。ルートバージョン変更後に
   `pnpm release:prep` を実行し、その後
   `pnpm deps:shrinkwrap:generate` を実行する。
3. `main` 上の `CHANGELOG.md` の `## YYYY.M.PATCH` セクションを、
   タグ付けされたリリースブランチと完全に一致させる。mac
   リリースで公開された場合は、安定版の `appcast.xml` 更新を含める。
4. オペレーターがそのリリーストレインを明示的に開始するまで、
   `YYYY.M.PATCH+1`、ベータ版、または空の将来向け changelog
   セクションを `main` に追加しない。
5. `pnpm release:generated:check`、`pnpm deps:shrinkwrap:check`、および
   `OPENCLAW_TESTBOX=1 pnpm check:changed` を実行する。push した後、
   安定版リリースを完了と呼ぶ前に、`origin/main` に出荷済みバージョンと changelog が含まれていることを確認する。
6. 各非公開ロールバック訓練後に、リポジトリ変数 `RELEASE_ROLLBACK_DRILL_ID` と
   `RELEASE_ROLLBACK_DRILL_DATE` を最新に保つ。
   `OpenClaw Stable Main Closeout` は、安定版公開後に出荷済みバージョン、
   changelog、appcast を含む `main` push から開始する。公開後の不変エビデンスを読み取り、
   出荷済みタグを完全リリース検証および公開の実行に紐付けたうえで、安定版 main の状態、
   リリース、必須の安定版 soak、ブロック要因となるパフォーマンスエビデンスを検証する。
   GitHub リリースに不変の closeout マニフェストと checksum を添付する。自動
   push トリガーは、不変の公開後エビデンスより前のレガシーリリースをスキップする。
   そのスキップを完了した closeout として扱うことはない。完全な
   closeout には、アセットと一致する checksum の両方が必要である。部分的なマニフェストは、
   記録された `main` SHA とロールバック訓練を再実行して同一バイトを再生成し、
   不足している checksum を添付する。不正なペア、またはマニフェストなしの checksum は、
   ブロック状態のままになる。ロールバック訓練のリポジトリ変数がない push トリガー実行は、
   closeout を完了せずにスキップする。訓練記録が存在しない、または 90 日を超えて古い場合も、
   手動のエビデンスに基づく closeout は引き続きブロックされる。非公開の復旧コマンドは、
   メンテナー専用 runbook に残す。
   手動 dispatch は、エビデンスに基づく安定版 closeout の修復または再実行にのみ使用する。
   レガシー fallback 修正タグは、修正タグがベース安定版タグと同じソース commit に解決される場合にのみ、
   ベースパッケージのエビデンスを再利用できる。
   ソースが異なる修正では、その修正自身のパッケージエビデンスを公開して検証する必要がある。

## リリース事前確認

- リリースプリフライトの前に `pnpm check:test-types` を実行し、テストの TypeScript が高速なローカル `pnpm check` ゲートの外側でもカバーされるようにする
- リリースプリフライトの前に `pnpm check:architecture` を実行し、より広範なインポートサイクルとアーキテクチャ境界チェックが高速なローカルゲートの外側でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、期待される `dist/*` リリースアーティファクトと Control UI バンドルがパック検証ステップに存在するようにする
- ルートのバージョンバンプ後、タグ付け前に `pnpm release:prep` を実行する。これは、バージョン、設定、API 変更後にずれやすいすべての決定的リリースジェネレーターを実行する: Plugin バージョン、Plugin インベントリ、ベース設定スキーマ、バンドル済みチャンネル設定メタデータ、設定ドキュメントベースライン、Plugin SDK エクスポート、Plugin SDK API ベースライン。`pnpm release:check` はこれらのガードをチェックモードで再実行し、見つかったすべての生成差分失敗を 1 回のパスで報告してから、パッケージリリースチェックを実行する。
- Plugin バージョン同期は、デフォルトで公式 Plugin パッケージのバージョンと既存の `openclaw.compat.pluginApi` フロアを OpenClaw リリースバージョンに更新する。このフィールドは、単なるパッケージバージョンのコピーではなく、Plugin SDK/ランタイム API のフロアとして扱う: 古い OpenClaw ホストとの互換性を意図的に維持する Plugin のみのリリースでは、フロアをサポート対象の最古のホスト API のままにし、その選択を Plugin リリース証跡に記録する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、1 つのエントリポイントからすべてのプレリリーステストボックスを開始する。これはブランチ、タグ、または完全なコミット SHA を受け取り、手動 `CI` をディスパッチし、インストールスモーク、パッケージ受け入れ、クロス OS パッケージチェック、QA Lab パリティ、Matrix、Telegram レーン用に `OpenClaw Release Checks` をディスパッチする。stable と full の実行には、常に網羅的なライブ/E2E と Docker リリースパス soak が含まれる。`run_release_soak=true` は明示的なベータ soak 用に保持されている。Package Acceptance は、候補検証中の標準パッケージ Telegram E2E を提供し、2 つ目の同時ライブポーラーを避ける。
  ベータ公開後に `release_package_spec` を指定すると、リリースチェック、Package Acceptance、パッケージ Telegram E2E の間で、リリース tarball を再ビルドせずに公開済み npm パッケージを再利用できる。Telegram がリリース検証の他の部分とは異なる公開済みパッケージを使用する必要がある場合にのみ、`npm_telegram_package_spec` を指定する。Package Acceptance がリリースパッケージ仕様とは異なる公開済みパッケージを使用する必要がある場合は、`package_acceptance_package_spec` を指定する。リリース証跡レポートで、Telegram E2E を強制せずに検証が公開済み npm パッケージと一致することを証明したい場合は、`evidence_package_spec` を指定する。
  例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- リリース作業を続けながらパッケージ候補のサイドチャンネル証跡が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA をパックするには `source=ref` を使う。必須の SHA-256 と厳格な公開 URL ポリシーを伴う公開 HTTPS tarball には `source=url` を使う。必須の `trusted_source_id` と SHA-256 を使う名前付き信頼済みソースポリシーには `source=trusted-url` を使う。または、別の GitHub Actions 実行によってアップロードされた tarball には `source=artifact` を使う。ワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラーを再利用し、同じ tarball に対して `telegram_mode=mock-openai` または `telegram_mode=live-frontier` で Telegram QA を実行できる。選択された Docker レーンに `published-upgrade-survivor` が含まれる場合、パッケージアーティファクトが候補になり、`published_upgrade_survivor_baseline` が公開済みベースラインを選択する。`update-restart-auth` は候補パッケージをインストール済み CLI と package-under-test の両方として使用するため、候補の更新コマンドが管理する再起動パスを検証する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: インストール/チャンネル/エージェント、gateway ネットワーク、設定リロードレーン
  - `package`: OpenWebUI またはライブ ClawHub を含まない、アーティファクトネイティブのパッケージ/更新/再起動/Plugin レーン
  - `product`: パッケージプロファイルに MCP チャンネル、cron/サブエージェントのクリーンアップ、OpenAI Web 検索、OpenWebUI を加えたもの
  - `full`: OpenWebUI を含む Docker リリースパスチャンク
  - `custom`: 集中的な再実行用の正確な `docker_lanes` 選択
- リリース候補に対して決定的な通常 CI カバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは変更スコープをバイパスし、Linux Node シャード、バンドル済み Plugin シャード、Plugin とチャンネルのコントラクトシャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトのスモークチェック、ドキュメントチェック、Python Skills、Windows、macOS、Control UI i18n レーンを強制する。単独の手動 CI 実行は、`include_android=true` 付きでディスパッチされた場合のみ Android を実行する。`Full Release Validation` はその CI 子にその入力を渡す。
  Android 付きの例: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- リリーステレメトリを検証する場合は `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP レシーバー経由で QA-lab を実行し、Opik、Langfuse、または別の外部コレクターを必要とせずに、トレース、メトリック、ログのエクスポートに加えて、制限されたトレース属性とコンテンツ/識別子の編集を検証する。
- コレクター互換性を検証する場合は `pnpm qa:otel:collector-smoke` を実行する。これは同じ QA-lab OTLP エクスポートを、ローカルレシーバーのアサーション前に実際の OpenTelemetry Collector Docker コンテナー経由でルーティングする。
- 保護された Prometheus スクレイピングを検証する場合は `pnpm qa:prometheus:smoke` を実行する。これは QA-lab を実行し、未認証のスクレイピングを拒否し、リリース上重要なメトリックファミリーにプロンプト内容、生の識別子、認証トークン、ローカルパスが含まれないことを検証する。
- ソースチェックアウトの OpenTelemetry と Prometheus のスモークレーンを続けて実行したい場合は、`pnpm qa:observability:smoke` を実行する。
- すべてのタグ付きリリースの前に `pnpm release:check` を実行する
- `OpenClaw NPM Release` プリフライトは、npm tarball をパックする前に依存関係リリース証跡を生成する。npm アドバイザリ脆弱性ゲートはリリースブロッカーである。推移的マニフェストリスク、依存関係の所有権/インストール面、依存関係変更レポートは、リリース証跡のみである。依存関係変更レポートは、リリース候補を到達可能な前回のリリースタグと比較する。
- プリフライトは依存関係証跡を `openclaw-release-dependency-evidence-<tag>` としてアップロードし、準備済み npm プリフライトアーティファクト内の `dependency-evidence/` にも埋め込む。実際の公開パスはそのプリフライトアーティファクトを再利用し、同じ証跡を `openclaw-<version>-dependency-evidence.zip` として GitHub リリースに添付する。
- タグが存在した後、変更を伴う公開シーケンスには `OpenClaw Release Publish` を実行する。`release/YYYY.M.PATCH` からディスパッチし（main から到達可能なタグを公開する場合は `main`）、リリースタグ、成功した OpenClaw npm `preflight_run_id`、成功した `full_release_validation_run_id` を渡し、意図的に集中的な修復を実行している場合を除き、デフォルトの Plugin 公開スコープ `all-publishable` を維持する。このワークフローは Plugin npm 公開、Plugin ClawHub 公開、OpenClaw npm 公開を直列化し、外部化された Plugin より先にコアパッケージが公開されないようにする。
- stable の `OpenClaw Release Publish` には、一致する非プレリリースの `openclaw/openclaw-windows-node` リリースが存在した後、正確な `windows_node_tag` が必要である。また、候補承認済みの `windows_node_installer_digests` マップも必要である。公開子をディスパッチする前に、ソースリリースが公開済みで、非プレリリースで、必須の x64/ARM64 インストーラーを含み、承認済みマップと引き続き一致することを検証する。その後、OpenClaw リリースがまだドラフトの間に `Windows Node Release` をディスパッチし、固定されたインストーラーダイジェストマップを変更せずに渡す。子ワークフローは、その正確なタグから署名済み Windows Hub インストーラーをダウンロードし、固定されたダイジェストと照合し、Windows ランナー上で Authenticode 署名が期待される OpenClaw Foundation 署名者を使用していることを検証し、SHA-256 マニフェストを書き込み、インストーラーとマニフェストを標準 OpenClaw GitHub リリースにアップロードした後、昇格されたアセットを再ダウンロードしてマニフェストのメンバーシップとハッシュを検証する。親は公開前に現在の x64、ARM64、チェックサムアセットコントラクトを検証する。直接リカバリーは、固定されたソースバイトで期待されるコントラクトアセットを置き換える前に、予期しない `OpenClawCompanion-*` アセット名を拒否する。`Windows Node Release` はリカバリーの場合にのみ手動ディスパッチし、常に正確なタグを渡し、`latest` は絶対に渡さず、承認済みソースリリースからの明示的な `expected_installer_digests` JSON マップも渡す。Web サイトのダウンロードリンクは、現在の stable リリースの正確な OpenClaw リリースアセット URL を対象にするか、GitHub の latest リダイレクトが同じリリースを指していることを検証した後にのみ `releases/latest/download/...` を使うべきである。companion リポジトリのリリースページだけにリンクしてはならない。
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab モックパリティレーンに加えて、高速ライブ Matrix プロファイルと Telegram QA レーンも実行する。ライブレーンは `qa-live-shared` 環境を使用し、Telegram は Convex CI 認証情報リースも使用する。完全な Matrix トランスポート、メディア、E2EE インベントリを並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` で手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS のインストールおよびアップグレードランタイム検証は、公開 `OpenClaw Release Checks` と `Full Release Validation` の一部であり、再利用可能なワークフロー `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的である: 実際の npm リリースパスは短く、決定的で、アーティファクト重視に保ち、遅いライブチェックは独自のレーンに置くことで、公開を停滞またはブロックしないようにする
- シークレットを持つリリースチェックは、`Full Release Validation` 経由、または `main`/リリースワークフロー ref からディスパッチし、ワークフローロジックとシークレットが管理された状態を保つようにする
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw ブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け入れる
- `OpenClaw NPM Release` の検証専用プリフライトは、プッシュ済みタグを要求せずに、現在の完全な 40 文字のワークフローブランチコミット SHA も受け入れる
- その SHA パスは検証専用であり、実際の公開に昇格することはできない
- SHA モードでは、ワークフローはパッケージメタデータチェックのためだけに `v<package.json version>` を合成する。実際の公開には引き続き実際のリリースタグが必要である
- どちらのワークフローも、実際の公開および昇格パスは GitHub ホストランナー上に保ち、変更を伴わない検証パスではより大きな Blacksmith Linux ランナーを使用できる
- そのワークフローは、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方のワークフローシークレットを使用して
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  を実行する
- npm リリースプリフライトは、別個のリリースチェックレーンを待たなくなった
- リリース候補をローカルでタグ付けする前に、`RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check` を実行する。このヘルパーは、GitHub 公開ワークフローが開始する前に承認をブロックしやすいミスを検出する順序で、高速リリースガードレール、Plugin npm/ClawHub リリースチェック、ビルド、UI ビルド、`release:openclaw:npm:check` を実行する。
- 承認前に `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  （または対応するベータ/修正タグ）を実行する
- npm 公開後に実行する
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  （または対応するベータ/修正版）を実行して、公開済みレジストリの
  インストールパスを新しい一時プレフィックスで検証する
- ベータ公開後、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  を実行して、共有のリース済み Telegram 認証情報
  プールを使用し、公開済み npm パッケージに対するインストール済みパッケージのオンボーディング、Telegram セットアップ、実際の Telegram E2E を検証する。ローカルのメンテナーによる単発実行では、Convex 変数を省略し、3つの
  `OPENCLAW_QA_TELEGRAM_*` 環境認証情報を直接渡してもよい。
- メンテナーのマシンから公開後の完全なベータスモークを実行するには、`pnpm release:beta-smoke -- --beta betaN` を使用する。このヘルパーは Parallels npm update/fresh-target 検証を実行し、`NPM Telegram Beta E2E` をディスパッチし、正確なワークフロー実行をポーリングし、アーティファクトをダウンロードして、Telegram レポートを出力する。
- メンテナーは GitHub Actions から手動の `NPM Telegram Beta E2E` ワークフローを介して、同じ公開後チェックを実行できる。これは意図的に手動専用であり、すべてのマージで実行されるわけではない。
- メンテナーのリリース自動化は、現在は preflight-then-promote を使用する:
  - 実際の npm publish は、成功した npm `preflight_run_id` に合格している必要がある
  - 実際の npm publish は、成功した preflight 実行と同じ `main` または
    `release/YYYY.M.PATCH` ブランチからディスパッチされている必要がある
  - 安定版 npm リリースはデフォルトで `beta` になる
  - 安定版 npm publish は、ワークフロー入力で明示的に `latest` をターゲットにできる
  - トークンベースの npm dist-tag 変更は現在
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` に置かれている。これは、`npm dist-tag add` にはまだ `NPM_TOKEN` が必要である一方、ソースリポジトリは
    OIDC のみの publish を維持するため
  - 公開 `macOS Release` は検証専用である。タグがリリースブランチにのみ存在し、ワークフローが `main` からディスパッチされる場合は、
    `public_release_branch=release/YYYY.M.PATCH` を設定する
  - 実際の macOS publish は、成功した macOS `preflight_run_id` と
    `validate_run_id` に合格している必要がある
  - 実際の publish パスは、アーティファクトを再ビルドする代わりに準備済みアーティファクトを昇格する
- `YYYY.M.PATCH-N` のような安定版修正リリースでは、公開後ベリファイアーは
  `YYYY.M.PATCH` から `YYYY.M.PATCH-N` への同じ一時プレフィックスのアップグレードパスもチェックするため、リリース修正によって古いグローバルインストールが
  ベース安定版ペイロードのまま静かに残ることはない
- npm リリース preflight は、tarball に
  `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` ペイロードの両方が含まれていない限り fail closed するため、空のブラウザダッシュボードを再び出荷しない
- 公開後検証では、公開済み Plugin エントリポイントとパッケージメタデータがインストール済みレジストリレイアウトに存在することもチェックする。Plugin ランタイムペイロードが欠落したリリースは postpublish ベリファイアーに失敗し、
  `latest` に昇格できない。
- `pnpm test:install:smoke` は候補更新 tarball に対して npm pack の `unpackedSize` 予算も強制するため、インストーラー e2e はリリース publish パスの前に偶発的な pack 肥大化を検出する
- リリース作業が CI 計画、拡張機能タイミングマニフェスト、または
  拡張機能テストマトリクスに触れた場合は、承認前に
  `.github/workflows/plugin-prerelease.yml` から planner 所有の
  `plugin-prerelease-extension-shard` マトリクス出力を再生成してレビューし、リリースノートが古い CI レイアウトを説明しないようにする
- 安定版 macOS リリースの準備状況には、アップデーター表面も含まれる:
  - GitHub リリースには、最終的にパッケージ化された `.zip`、`.dmg`、`.dSYM.zip` が含まれている必要がある
  - `main` 上の `appcast.xml` は、publish 後に新しい安定版 zip を指している必要がある。
    macOS publish ワークフローが自動的にコミットするか、直接 push がブロックされた場合は appcast
    PR を開く
  - パッケージ化されたアプリは、非デバッグのバンドル ID、空でない Sparkle フィード
    URL、そのリリースバージョンの正規 Sparkle ビルド下限以上の `CFBundleVersion` を維持する必要がある

## リリーステストボックス

`Full Release Validation` は、オペレーターが 1 つのエントリポイントからすべてのリリース前テストを開始する方法です。変化の速いブランチで固定コミットの証明を行うには、ヘルパーを使い、すべての子ワークフローがターゲット SHA に固定された一時ブランチから実行されるようにします。

```bash
pnpm ci:full-release --sha <full-sha>
```

このヘルパーは `release-ci/<sha>-...` をプッシュし、そのブランチから `ref=<sha>` で `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` がターゲットと一致することを検証してから、一時ブランチを削除します。これにより、誤ってより新しい `main` の子実行を証明してしまうことを避けられます。

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

このワークフローはターゲット ref を解決し、`target_ref=<release-ref>` で手動 `CI` をディスパッチしてから、`OpenClaw Release Checks` をディスパッチします。`OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、soak が有効な場合の live/E2E Docker リリースパスカバレッジ、標準 Telegram パッケージ E2E を含む Package Acceptance、QA Lab パリティ、live Matrix、live Telegram に展開されます。full/all 実行が受け入れられるのは、意図的に別個の `Plugin Prerelease` 子をスキップしたフォーカス再実行を除き、`Full Release Validation` のサマリーで `normal_ci`、`plugin_prerelease`、`release_checks` が成功と表示されている場合だけです。スタンドアロンの `npm-telegram` 子は、`release_package_spec` または `npm_telegram_package_spec` を指定した公開済みパッケージのフォーカス再実行にのみ使用します。最終検証サマリーには各子実行の最も遅いジョブの表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージマトリクス、正確なワークフロージョブ名、stable と full プロファイルの違い、アーティファクト、フォーカス再実行ハンドルについては、[Full release validation](/ja-JP/reference/full-release-validation) を参照してください。
子ワークフローは、ターゲット `ref` が古いリリースブランチまたはタグを指している場合でも、通常は `--ref main` である `Full Release Validation` を実行する信頼済み ref からディスパッチされます。Full Release Validation 用の別個の workflow-ref 入力はありません。ワークフロー実行 ref を選ぶことで、信頼済みハーネスを選択します。
移動する `main` 上の厳密なコミット証明に `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使用して固定された一時ブランチを作成します。

live/provider の範囲を選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: minimum にリリース承認向けの stable provider/backend カバレッジを追加
- `full`: stable に広範な advisory provider/media カバレッジを追加

stable および full 検証は、昇格前に常に網羅的な live/E2E、Docker リリースパス、範囲を限定した公開済みアップグレードサバイバー掃引を実行します。beta に対して同じ掃引を要求するには `run_release_soak=true` を使用します。その掃引は、最新 4 つの stable パッケージに加え、固定された `2026.4.23` と `2026.5.2` のベースライン、さらに古い `2026.4.15` カバレッジを対象にし、重複するベースラインを削除したうえで、各ベースラインを独自の Docker runner ジョブにシャード化します。

`OpenClaw Release Checks` は、信頼済みワークフロー ref を使用してターゲット ref を一度だけ `release-package-under-test` として解決し、soak 実行時にそのアーティファクトをクロス OS、Package Acceptance、リリースパス Docker チェックで再利用します。これにより、すべてのパッケージ向けボックスが同じバイト列を使用し、パッケージビルドの繰り返しを避けられます。
beta がすでに npm に公開済みの場合は、`release_package_spec=openclaw@YYYY.M.PATCH-beta.N` を設定し、リリースチェックが出荷済みパッケージを一度だけダウンロードし、`dist/build-info.json` からビルド元 SHA を抽出し、そのアーティファクトをクロス OS、Package Acceptance、リリースパス Docker、パッケージ Telegram レーンで再利用するようにします。
クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外の場合は `openai/gpt-5.4` を使用します。このレーンは最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回の live agent turn を証明するためです。より広範な live provider マトリクスは、モデル固有のカバレッジの場所として残ります。

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

フォーカス修正後の最初の再実行として full umbrella を使用しないでください。1 つのボックスが失敗した場合は、次の証明に、失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデル provider、または QA レーンを使用します。full umbrella を再度実行するのは、修正が共有リリースオーケストレーションを変更した場合、または以前の全ボックス証拠が古くなった場合だけです。umbrella の最終検証は記録された子ワークフロー実行 ID を再チェックするため、子ワークフローが正常に再実行された後は、失敗した `Verify full validation` 親ジョブだけを再実行します。

範囲を限定したリカバリには、umbrella に `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常 CI 子のみを実行、`plugin-prerelease` はリリース専用 Plugin 子のみを実行、`release-checks` はすべてのリリースボックスを実行し、より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。
フォーカスした `npm-telegram` 再実行には `release_package_spec` または `npm_telegram_package_spec` が必要です。full/all 実行では、Package Acceptance 内の標準パッケージ Telegram E2E を使用します。フォーカスしたクロス OS 再実行では、`cross_os_suite_filter=windows/packaged-upgrade` または別の OS/スイートフィルターを追加できます。QA release-check の失敗は、標準 tier の必須 OpenClaw dynamic tool drift を含め、通常のリリース検証をブロックします。
Tideclaw alpha 実行では、package-safety 以外の release-check レーンを advisory として扱うことがあります。`live_suite_filter` が Discord、WhatsApp、Slack などのゲート付き QA live レーンを明示的に要求する場合、対応する `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` repo 変数を有効にする必要があります。有効でない場合、そのレーンを黙ってスキップするのではなく、入力キャプチャが失敗します。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に changed scoping を迂回し、リリース候補に対して通常のテストグラフを強制します。Linux Node シャード、バンドル Plugin シャード、Plugin とチャンネルの contract シャード、Node 22 互換性、`check-*`、`check-additional-*`、ビルド済みアーティファクトスモークチェック、docs チェック、Python Skills、Windows、macOS、Control UI i18n です。Android は、`Full Release Validation` がボックスを実行するときに umbrella が `include_android=true` を渡すため含まれます。スタンドアロンの手動 CI で Android カバレッジを得るには `include_android=true` が必要です。

このボックスは「ソースツリーが完全な通常テストスイートに合格したか」に答えるために使用します。これはリリースパスのプロダクト検証とは同じではありません。保持する証拠は次のとおりです。

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確なターゲット SHA 上で green の `CI` 実行
- 回帰調査時の CI ジョブからの失敗または低速シャード名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースに決定論的な通常 CI は必要だが、Docker、QA Lab、live、クロス OS、パッケージボックスが不要な場合のみ、手動 CI を直接実行します。Android なしの直接 CI には最初のコマンドを使用します。直接リリース候補 CI で Android をカバーする必要がある場合は、`include_android=true` を追加します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` を通じた `OpenClaw Release Checks` と、リリースモードの `install-smoke` ワークフローにあります。ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには次が含まれます。

- 低速な Bun グローバルインストールスモークを有効にした完全なインストールスモーク
- ターゲット SHA によるルート Dockerfile スモークイメージの準備/再利用。QR、root/gateway、installer/Bun スモークジョブは別個の install-smoke シャードとして実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル Plugin のインストール/アンインストールレーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- リリースチェックに live スイートが含まれる場合の live/E2E provider スイートと Docker live モデルカバレッジ

再実行の前に Docker アーティファクトを使用します。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。フォーカスしたリカバリでは、すべてのリリースチャンクを再実行するのではなく、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成された再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは agentic behavior とチャンネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには次が含まれます。

- agentic parity pack を使用して OpenAI 候補レーンを Opus 4.6 ベースラインと比較する mock parity レーン
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA レーン
- リリース telemetry に明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`、`pnpm qa:otel:collector-smoke`、`pnpm qa:prometheus:smoke`、または `pnpm qa:observability:smoke`

このボックスは「リリースが QA シナリオと live チャンネルフローで正しく動作するか」に答えるために使用します。リリース承認時には、parity、Matrix、Telegram レーンのアーティファクト URL を保持します。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動のシャード化された QA-Lab 実行として引き続き利用できます。

### パッケージ

Package ボックスは、インストール可能なプロダクトのゲートです。これは `Package Acceptance` と resolver `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。resolver は候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離して保ちます。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリース
  バージョン
- `source=ref`: 信頼済みの `package_ref` ブランチ、タグ、または完全なコミット SHA を、選択した `workflow_ref` ハーネスでパックする
- `source=url`: 必須の `package_sha256` を指定して公開 HTTPS `.tgz` をダウンロードする。
  URL 資格情報、非デフォルトの HTTPS ポート、プライベート/内部/特殊用途の
  ホスト名または解決済みアドレス、安全でないリダイレクトは拒否される
- `source=trusted-url`: `.github/package-trusted-sources.json` の名前付きポリシーから、必須の
  `package_sha256` と `trusted_source_id` を指定して HTTPS `.tgz` をダウンロードする。これは、`source=url` に入力レベルのプライベートネットワークバイパスを追加する代わりに、メンテナー所有の
  エンタープライズミラーまたはプライベートパッケージリポジトリに使用する
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用する

`OpenClaw Release Checks` は、`source=artifact`、準備済みリリースパッケージアーティファクト、`suite_profile=custom`、
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`、
`telegram_mode=mock-openai` で Package Acceptance を実行する。Package Acceptance は、移行、更新、
設定済み認証の更新後再起動、ライブ ClawHub skill インストール、古い Plugin 依存関係のクリーンアップ、オフライン Plugin
フィクスチャ、Plugin 更新、Telegram パッケージ QA を、同じ解決済み
tarball に対して維持する。ブロッキングリリースチェックは、デフォルトで最新の公開済みパッケージ
ベースラインを使用する。`run_release_soak=true`、`release_profile=stable`、または
`release_profile=full` を指定した beta プロファイルは、`2026.4.23` から `latest` までのすべての安定版 npm 公開済みベースラインと、報告済み issue フィクスチャに拡張される。すでに出荷済みの候補には
`source=npm` の Package Acceptance を、公開前の SHA で裏付けられたローカル npm tarball には `source=ref` を、メンテナー所有のエンタープライズ/プライベートミラーには
`source=trusted-url` を、別の GitHub Actions 実行によってアップロードされた準備済み tarball には `source=artifact` を使用する。
これは、以前は Parallels が必要だったパッケージ/更新カバレッジの大半を置き換える、GitHub ネイティブな
代替手段である。OS 固有のオンボーディング、
インストーラー、プラットフォーム動作については、クロス OS リリースチェックが引き続き重要だが、パッケージ/更新のプロダクト検証では
Package Acceptance を優先するべきである。

更新と Plugin 検証の正準チェックリストは
[更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins) である。Plugin インストール/更新、doctor クリーンアップ、または公開済みパッケージ移行の変更を証明する
ローカル、Docker、Package Acceptance、またはリリースチェック lane を判断するときに使用する。
すべての安定版 `2026.4.23+` パッケージからの網羅的な公開済み更新移行は、
Full Release CI の一部ではなく、別個の手動 `Update Migration` workflow である。

レガシー package-acceptance の許容範囲は、意図的に期限付きである。`2026.4.25` までのパッケージは、
npm にすでに公開済みのメタデータ不足について互換パスを使用できる。tarball に存在しないプライベート QA インベントリエントリ、
`gateway install --wrapper` の欠落、tarball 由来の git
フィクスチャ内の patch ファイル欠落、永続化された `update.channel` の欠落、レガシー Plugin インストールレコード
場所、マーケットプレイスインストールレコード永続化の欠落、`plugins update` 中の config メタデータ
移行が該当する。公開済みの `2026.4.26` パッケージでは、
すでに出荷済みのローカルビルドメタデータ stamp ファイルについて警告される場合がある。それ以降のパッケージは
現代のパッケージ契約を満たす必要があり、同じ不足はリリース
検証で失敗する。

リリース上の問いが実際にインストール可能なパッケージに関するものである場合は、より広範な Package Acceptance プロファイルを使用する。

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

- `smoke`: 迅速なパッケージインストール/channel/agent、Gateway ネットワーク、config
  リロード lane
- `package`: インストール/更新/再起動/Plugin パッケージ契約に加え、ライブ ClawHub
  skill インストール証明。これはリリースチェックのデフォルトである
- `product`: `package` に MCP channels、cron/subagent クリーンアップ、OpenAI web
  search、OpenWebUI を加えたもの
- `full`: OpenWebUI を含む Docker リリースパスチャンク
- `custom`: 集中再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明には、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にする。workflow は解決済みの
`package-under-test` tarball を Telegram lane に渡す。スタンドアロンの
Telegram workflow は、公開後チェック用に公開済み npm spec を引き続き受け付ける。

## リリース公開自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリポイントである。これは、
リリースに必要な順序で trusted-publisher workflow をオーケストレーションする。

1. リリースタグをチェックアウトし、そのコミット SHA を解決する。
2. タグが `main` または `release/*` から到達可能であることを検証する。
3. `pnpm plugins:sync:check` を実行する。
4. `publish_scope=all-publishable` と
   `ref=<release-sha>` で `Plugin NPM Release` を dispatch する。
5. 同じ scope と SHA で `Plugin ClawHub Release` を dispatch する。
6. 保存済みの `full_release_validation_run_id` を検証した後、リリースタグ、npm dist-tag、
   保存済みの `preflight_run_id` を指定して `OpenClaw NPM Release` を dispatch する。
7. 安定版リリースでは、GitHub リリースを draft として作成または更新し、明示的な `windows_node_tag` と
   候補として承認済みの `windows_node_installer_digests` を指定して
   `Windows Node Release` を dispatch し、draft を公開する前に正準の
   インストーラー/checksum アセットを検証する。

Beta 公開例:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

デフォルトの beta dist-tag への安定版公開:

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

`latest` への安定版プロモーションは明示的である。

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

下位レベルの `Plugin NPM Release` と `Plugin ClawHub Release` workflow は、
集中的な修復または再公開作業にのみ使用する。`OpenClaw Release Publish` は、
`publish_openclaw_npm=true` の場合に `plugin_publish_scope=selected` を拒否するため、
`@openclaw/diffs-language-pack` を含む公開可能なすべての公式 Plugin なしで core
パッケージが出荷されることはない。選択した Plugin の修復では、
`publish_openclaw_npm=false` に `plugin_publish_scope=selected` と
`plugins=@openclaw/name` を指定するか、子 workflow を直接 dispatch する。

## NPM workflow 入力

`OpenClaw NPM Release` は、以下の operator 制御入力を受け付ける。

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、または
  `v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証専用 preflight 用に、現在の
  完全な 40 文字の workflow-branch コミット SHA も使用できる
- `preflight_only`: 検証/ビルド/パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスで必須。workflow が成功した preflight 実行から準備済み tarball を再利用するために使用する
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Publish` は、以下の operator 制御入力を受け付ける。

- `tag`: 必須のリリースタグ。すでに存在している必要がある
- `preflight_run_id`: 成功した `OpenClaw NPM Release` preflight run id。
  `publish_openclaw_npm=true` の場合に必須
- `full_release_validation_run_id`: 成功した `Full Release Validation` run
  id。`publish_openclaw_npm=true` の場合に必須
- `windows_node_tag`: 正確な非 prerelease の `openclaw/openclaw-windows-node`
  リリースタグ。安定版 OpenClaw 公開では必須
- `windows_node_installer_digests`: 現在の Windows installer 名から固定された `sha256:` digest への、候補として承認済みの compact JSON map。安定版 OpenClaw 公開では必須
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。`selected` は、
  `publish_openclaw_npm=false` を伴う集中的な Plugin 専用修復作業にのみ使用する
- `plugins`: `plugin_publish_scope=selected` の場合の、カンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。workflow を Plugin 専用修復オーケストレーターとして使用する場合にのみ `false` を設定する
- `wait_for_clawhub`: デフォルトは `false` であるため、npm の可用性は
  ClawHub sidecar によってブロックされない。workflow 完了に
  ClawHub 完了を含める必要がある場合にのみ `true` を設定する

`OpenClaw Release Checks` は、以下の operator 制御入力を受け付ける。

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。secret を伴うチェックでは、
  解決済みコミットが OpenClaw ブランチまたは
  リリースタグから到達可能である必要がある。
- `run_release_soak`: beta リリースチェックで、網羅的な live/E2E、Docker リリースパス、
  および all-since upgrade-survivor soak を有効にする。これは
  `release_profile=stable` と `release_profile=full` によって強制的に有効化される。

ルール:

- 安定版タグと修正タグは、`beta` または `latest` のどちらにも公開できる
- Beta prerelease タグは `beta` にのみ公開できる
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は
  `preflight_only=true` の場合にのみ許可される
- `OpenClaw Release Checks` と `Full Release Validation` は常に
  検証専用である
- 実際の公開パスでは、preflight 中に使用したものと同じ `npm_dist_tag` を使用する必要がある。
  workflow は公開前にそのメタデータが継続していることを検証する

## 安定版 npm リリース手順

安定版 npm リリースを作成するとき:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行する
   - タグが存在する前は、preflight ワークフローの検証専用ドライランに、
     現在の完全なワークフローブランチのコミット SHA を使用できる
2. 通常のベータ優先フローでは `npm_dist_tag=beta` を選択し、意図的に直接安定版を公開したい場合にのみ
   `latest` を選択する
3. 通常の CI に加えて、ライブプロンプトキャッシュ、Docker、QA Lab、
   Matrix、Telegram のカバレッジを 1 つの手動ワークフローから実行したい場合は、リリースブランチ、リリースタグ、または完全な
   コミット SHA で `Full Release Validation` を実行する
4. 意図的に決定的な通常のテストグラフだけが必要な場合は、代わりにリリース ref で
   手動の `CI` ワークフローを実行する
5. 署名済みの x64 および ARM64 インストーラーを出荷すべき、正確な非プレリリースの `openclaw/openclaw-windows-node` リリースタグを選択する。
   それを `windows_node_tag` として保存し、検証済みのダイジェストマップを
   `windows_node_installer_digests` として保存する。リリース候補ヘルパーはその両方を記録し、
   生成する公開コマンドに含める。
6. 成功した `preflight_run_id` と `full_release_validation_run_id` を保存する
7. 同じ `tag`、同じ `npm_dist_tag`、
   選択した `windows_node_tag`、保存した `windows_node_installer_digests`、
   保存した `preflight_run_id`、保存した `full_release_validation_run_id` で `OpenClaw Release Publish` を実行する。
   これは OpenClaw npm パッケージを昇格する前に、外部化された plugins を npm と ClawHub に公開する
8. リリースが `beta` に投入された場合は、
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   ワークフローを使用して、その安定版を `beta` から `latest` に昇格する
9. リリースが意図的に直接 `latest` に公開され、`beta` も
   ただちに同じ安定ビルドを追従すべき場合は、同じリリース
   ワークフローを使用して両方の dist-tags を安定版に向けるか、スケジュールされた
   自己修復同期によって後で `beta` を移動させる

dist-tag の変更はリリース台帳リポジトリに置かれている。これは引き続き
`NPM_TOKEN` が必要である一方、ソースリポジトリは OIDC のみの公開を維持するため。

これにより、直接公開パスとベータ優先の昇格パスの両方が
文書化され、オペレーターから見える状態に保たれる。

メンテナーがローカル npm 認証にフォールバックする必要がある場合は、1Password
CLI (`op`) コマンドは専用の tmux セッション内でのみ実行する。メインのエージェントシェルから `op` を
直接呼び出さないこと。tmux 内に置くことで、プロンプト、
アラート、OTP 処理が観測可能になり、ホストアラートの繰り返しを防げる。

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

メンテナーは実際のランブックに、非公開のリリースドキュメント
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用する。

## 関連

- [リリースチャネル](/ja-JP/install/development-channels)
