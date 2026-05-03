---
read_when:
    - 公開リリースチャネルの定義を探しています
    - リリース検証またはパッケージ受け入れの実行
    - バージョン命名とリリース頻度を確認しています
summary: リリースレーン、オペレーター用チェックリスト、検証ボックス、バージョン命名、リリース周期
title: リリースポリシー
x-i18n:
    generated_at: "2026-05-03T21:37:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw には 3 つの公開リリースレーンがあります:

- stable: デフォルトでは npm `beta` に公開され、明示的に要求された場合は npm `latest` に公開されるタグ付きリリース
- beta: npm `beta` に公開されるプレリリースタグ
- dev: `main` の移動する先頭

## バージョン命名

- Stable リリースバージョン: `YYYY.M.D`
  - Git タグ: `vYYYY.M.D`
- Stable 修正リリースバージョン: `YYYY.M.D-N`
  - Git タグ: `vYYYY.M.D-N`
- Beta プレリリースバージョン: `YYYY.M.D-beta.N`
  - Git タグ: `vYYYY.M.D-beta.N`
- 月または日をゼロ埋めしない
- `latest` は現在昇格済みの stable npm リリースを意味する
- `beta` は現在の beta インストール対象を意味する
- Stable および stable 修正リリースは、デフォルトでは npm `beta` に公開される。リリース担当者は明示的に `latest` を対象にすることも、検証済みの beta ビルドを後から昇格することもできる
- すべての stable OpenClaw リリースは npm パッケージと macOS アプリを一緒に出荷する。
  beta リリースでは通常、npm/パッケージ経路を先に検証して公開し、mac アプリのビルド/署名/公証は明示的に要求されない限り stable 用に確保する

## リリース周期

- リリースは beta を先行して進む
- Stable は最新の beta が検証された後にのみ続く
- メンテナーは通常、現在の `main` から作成した `release/YYYY.M.D` ブランチからリリースを作成するため、リリース検証と修正が `main` 上の新規開発をブロックしない
- beta タグがプッシュまたは公開済みで修正が必要な場合、メンテナーは古い beta タグを削除または再作成するのではなく、次の `-beta.N` タグを作成する
- 詳細なリリース手順、承認、認証情報、復旧メモはメンテナー専用

## リリース担当者チェックリスト

このチェックリストは、リリースフローの公開されている形を示すものです。非公開の認証情報、
署名、公証、dist-tag 復旧、緊急ロールバックの詳細は、
メンテナー専用のリリース runbook に残します。

1. 現在の `main` から開始する: 最新を pull し、対象コミットがプッシュ済みであることを確認し、
   現在の `main` CI がブランチ作成に十分な程度に green であることを確認する。
2. 実際のコミット履歴から `/changelog` で `CHANGELOG.md` の先頭セクションを書き直し、
   エントリをユーザー向けに保ち、コミットしてプッシュし、ブランチ作成前にもう一度 rebase/pull する。
3. `src/plugins/compat/registry.ts` と
   `src/commands/doctor/shared/deprecation-compat.ts` のリリース互換性記録をレビューする。アップグレード経路が引き続きカバーされる場合にのみ期限切れの互換性を削除するか、意図的に保持する理由を記録する。
4. 現在の `main` から `release/YYYY.M.D` を作成する。通常のリリース作業を
   `main` で直接行わない。
5. 目的のタグに必要なすべてのバージョン箇所を更新し、
   `pnpm plugins:sync` を実行して公開可能な Plugin パッケージがリリースバージョンと互換性メタデータを共有するようにしてから、ローカルの決定的 preflight を実行する:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, および
   `pnpm release:check`。
6. `OpenClaw NPM Release` を `preflight_only=true` で実行する。タグが存在する前は、
   検証専用 preflight に完全な 40 文字のリリースブランチ SHA を使用できる。成功した `preflight_run_id` を保存する。
7. リリースブランチ、タグ、または完全なコミット SHA に対して `Full Release Validation` ですべてのプレリリーステストを開始する。これは 4 つの大きなリリーステストボックス、Vitest、Docker、QA Lab、Package のための単一の手動エントリポイントである。
8. 検証に失敗した場合は、リリースブランチ上で修正し、その修正を証明する最小の失敗ファイル、レーン、workflow job、パッケージプロファイル、プロバイダー、またはモデル allowlist を再実行する。変更された表面により以前の証拠が古くなる場合にのみ、umbrella 全体を再実行する。
9. beta の場合、`vYYYY.M.D-beta.N` にタグ付けし、一致する `release/YYYY.M.D` ブランチから `OpenClaw Release Publish` を実行する。これは `pnpm plugins:sync:check` を検証し、すべての公開可能な Plugin パッケージを最初に npm に公開し、次に同じセットを ClawPack npm-pack tarball として ClawHub に公開し、その後一致する dist-tag で準備済みの OpenClaw npm preflight artifact を昇格する。公開後、公開済みの `openclaw@YYYY.M.D-beta.N` または
   `openclaw@beta` パッケージに対して公開後パッケージ
   acceptance を実行する。プッシュ済みまたは公開済みのプレリリースに修正が必要な場合は、
   次の一致するプレリリース番号を作成する。古いプレリリースを削除したり書き換えたりしない。
10. stable の場合、検証済みの beta またはリリース候補に必要な検証証拠がある場合にのみ続行する。Stable npm 公開も `OpenClaw Release Publish` を通じて行い、
    `preflight_run_id` 経由で成功した preflight artifact を再利用する。stable macOS リリース準備には、
    パッケージ化された `.zip`, `.dmg`, `.dSYM.zip` と、`main` 上で更新された `appcast.xml` も必要である。
11. 公開後、npm 公開後 verifier、公開後のチャンネル証明が必要な場合の任意のスタンドアロン公開済み npm Telegram E2E、
    必要時の dist-tag 昇格、一致する完全な `CHANGELOG.md` セクションからの GitHub release/prerelease notes、そしてリリース告知手順を実行する。

## リリース preflight

- リリースのプリフライト前に `pnpm check:test-types` を実行し、テストの TypeScript が高速なローカル `pnpm check` ゲートの外でもカバーされるようにする
- リリースのプリフライト前に `pnpm check:architecture` を実行し、より広範な import サイクルとアーキテクチャ境界チェックが高速なローカルゲートの外でもグリーンになるようにする
- `pnpm release:check` の前に `pnpm build && pnpm ui:build` を実行し、想定される `dist/*` リリース成果物と Control UI バンドルがパック検証ステップ用に存在するようにする
- ルートのバージョンバンプ後、タグ付け前に `pnpm plugins:sync` を実行する。これは公開可能な plugin パッケージバージョン、OpenClaw ピア/API 互換性メタデータ、ビルドメタデータ、plugin changelog スタブをコアのリリースバージョンに合わせて更新する。`pnpm plugins:sync:check` は変更を行わないリリースガードであり、このステップを忘れていた場合、publish ワークフローは registry の変更前に失敗する。
- リリース承認前に手動の `Full Release Validation` ワークフローを実行し、すべてのプレリリース test box を単一のエントリポイントから開始する。ブランチ、タグ、または完全なコミット SHA を受け取り、手動の `CI` をディスパッチし、install smoke、package acceptance、Docker リリースパススイート、live/E2E、OpenWebUI、QA Lab parity、Matrix、Telegram レーン向けに `OpenClaw Release Checks` をディスパッチする。`release_profile=full` と `rerun_group=all` を指定すると、リリースチェックの `release-package-under-test` 成果物に対して package Telegram E2E も実行する。公開後、同じ Telegram E2E で公開済み npm パッケージも検証する必要がある場合は `npm_telegram_package_spec` を指定する。公開後、Package Acceptance で SHA からビルドした成果物ではなく出荷済み npm パッケージに対して package/update matrix を実行する必要がある場合は `package_acceptance_package_spec` を指定する。Telegram E2E を強制せずに、検証が公開済み npm パッケージと一致することを private evidence report で証明する場合は `evidence_package_spec` を指定する。例:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- リリース作業を継続しながらパッケージ候補のサイドチャネル証跡が必要な場合は、手動の `Package Acceptance` ワークフローを実行する。`openclaw@beta`、`openclaw@latest`、または正確なリリースバージョンには `source=npm` を使う。現在の `workflow_ref` ハーネスで信頼済みの `package_ref` ブランチ/タグ/SHA を pack するには `source=ref` を使う。必須の SHA-256 付き HTTPS tarball には `source=url` を使う。または別の GitHub Actions run がアップロードした tarball には `source=artifact` を使う。このワークフローは候補を `package-under-test` に解決し、その tarball に対して Docker E2E リリーススケジューラを再利用し、`telegram_mode=mock-openai` または `telegram_mode=live-frontier` で同じ tarball に対して Telegram QA を実行できる。選択した Docker レーンに `published-upgrade-survivor` が含まれる場合、package 成果物が候補となり、`published_upgrade_survivor_baseline` が公開済み baseline を選択する。
  例: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  一般的なプロファイル:
  - `smoke`: install/channel/agent、Gateway network、config reload レーン
  - `package`: OpenWebUI または live ClawHub を含まない、成果物ネイティブの package/update/plugin レーン
  - `product`: package プロファイルに加えて MCP channel、cron/subagent cleanup、OpenAI web search、OpenWebUI
  - `full`: OpenWebUI を含む Docker リリースパスチャンク
  - `custom`: 焦点を絞った再実行用の正確な `docker_lanes` 選択
- リリース候補に対する通常の完全な CI カバレッジだけが必要な場合は、手動の `CI` ワークフローを直接実行する。手動 CI ディスパッチは changed スコープをバイパスし、Linux Node shards、bundled-plugin shards、channel contracts、Node 22 compatibility、`check`、`check-additional`、build smoke、docs checks、Python skills、Windows、macOS、Android、Control UI i18n レーンを強制する。
  例: `gh workflow run ci.yml --ref release/YYYY.M.D`
- リリースの telemetry を検証する場合は `pnpm qa:otel:smoke` を実行する。これはローカル OTLP/HTTP receiver を通じて QA-lab を実行し、Opik、Langfuse、その他の外部 collector を必要とせずに、export された trace span 名、制限付き attributes、content/identifier redaction を検証する。
- タグ付きリリースのたびに、事前に `pnpm release:check` を実行する
- タグが存在した後、変更を伴う publish sequence には `OpenClaw Release Publish` を実行する。`release/YYYY.M.D` からディスパッチする（main から到達可能なタグを公開する場合は `main`）。リリースタグと成功した OpenClaw npm `preflight_run_id` を渡し、意図的に焦点を絞った修復を行う場合を除き、デフォルトの plugin publish scope `all-publishable` を維持する。このワークフローは plugin npm publish、plugin ClawHub publish、OpenClaw npm publish を直列化し、外部化された plugins より前にコアパッケージが公開されないようにする。
- リリースチェックは現在、別の手動ワークフローで実行される:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` は、リリース承認前に QA Lab mock parity レーンに加えて、高速な live Matrix プロファイルと Telegram QA レーンも実行する。live レーンは `qa-live-shared` environment を使用する。Telegram は Convex CI credential lease も使用する。Matrix transport、media、E2EE inventory 全体を並列で実行したい場合は、`matrix_profile=all` と `matrix_shards=true` を指定して手動の `QA-Lab - All Lanes` ワークフローを実行する。
- クロス OS の install と upgrade runtime 検証は、公開の `OpenClaw Release Checks` と `Full Release Validation` の一部であり、reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` を直接呼び出す
- この分割は意図的なもの。実際の npm リリースパスは短く、決定的で、成果物中心に保ち、時間のかかる live check は publish を停滞またはブロックしないように独自のレーンに置く
- secrets を持つリリースチェックは、`Full Release Validation` 経由、または `main`/release workflow ref からディスパッチし、workflow logic と secrets が制御された状態を保つ
- `OpenClaw Release Checks` は、解決されたコミットが OpenClaw のブランチまたはリリースタグから到達可能である限り、ブランチ、タグ、または完全なコミット SHA を受け付ける
- `OpenClaw NPM Release` の検証専用 preflight も、push 済みタグを要求せずに、現在の完全な 40 文字の workflow-branch commit SHA を受け付ける
- その SHA パスは検証専用であり、実際の publish に昇格できない
- SHA モードでは、ワークフローは package metadata check のためだけに `v<package.json version>` を合成する。実際の publish には引き続き実際のリリースタグが必要
- どちらのワークフローも実際の publish と promotion パスを GitHub-hosted runner 上に保ち、変更を伴わない検証パスではより大きな Blacksmith Linux runner を使用できる
- そのワークフローは `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` を、`OPENAI_API_KEY` と `ANTHROPIC_API_KEY` の両方の workflow secrets を使って実行する
- npm release preflight は、別の release checks レーンを待機しなくなった
- 承認前に `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`（または対応する beta/correction タグ）を実行する
- npm publish 後、公開済み registry install パスを新しい一時 prefix で検証するために `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`（または対応する beta/correction バージョン）を実行する
- beta publish 後、共有の貸与 Telegram credential pool を使い、公開済み npm パッケージに対して installed-package onboarding、Telegram setup、実際の Telegram E2E を検証するために、`OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` を実行する。ローカル maintainer の単発実行では Convex vars を省略し、3 つの `OPENCLAW_QA_TELEGRAM_*` env credentials を直接渡してもよい。
- Maintainers は、手動の `NPM Telegram Beta E2E` ワークフローを通じて、GitHub Actions から同じ post-publish check を実行できる。これは意図的に manual-only であり、すべての merge で実行されるわけではない。
- Maintainer release automation は現在、preflight-then-promote を使用する:
  - 実際の npm publish は、成功した npm `preflight_run_id` を通過している必要がある
  - 実際の npm publish は、成功した preflight run と同じ `main` または `release/YYYY.M.D` ブランチからディスパッチされている必要がある
  - 安定版 npm リリースのデフォルトは `beta`
  - 安定版 npm publish は、workflow input で明示的に `latest` を対象にできる
  - token ベースの npm dist-tag mutation は現在、セキュリティ上の理由から `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` にある。これは、公開リポジトリが OIDC-only publish を維持する一方で、`npm dist-tag add` には依然として `NPM_TOKEN` が必要なため
  - 公開 `macOS Release` は validation-only。タグが release branch のみに存在し、workflow が `main` からディスパッチされる場合は、`public_release_branch=release/YYYY.M.D` を設定する
  - 実際の private mac publish は、成功した private mac `preflight_run_id` と `validate_run_id` を通過している必要がある
  - 実際の publish パスは、準備済み成果物を再ビルドするのではなく昇格する
- `YYYY.M.D-N` のような安定版 correction release では、post-publish verifier は同じ temp-prefix upgrade path で `YYYY.M.D` から `YYYY.M.D-N` への検証も行い、release correction が古い global install を base stable payload のまま静かに残さないようにする
- npm release preflight は、tarball に `dist/control-ui/index.html` と空でない `dist/control-ui/assets/` payload の両方が含まれていない限り fail closed するため、空の browser dashboard を再び出荷しない
- Post-publish verification は、公開済み plugin entrypoint と package metadata がインストール済み registry layout に存在することも確認する。plugin runtime payload が欠落したリリースは postpublish verifier に失敗し、`latest` に昇格できない。
- `pnpm test:install:smoke` は candidate update tarball に対して npm pack `unpackedSize` budget も強制するため、installer e2e は accidental pack bloat を release publish path の前に検出する
- リリース作業で CI planning、extension timing manifest、または extension test matrix に触れた場合は、承認前に `.github/workflows/plugin-prerelease.yml` から planner-owned の `plugin-prerelease-extension-shard` matrix outputs を再生成してレビューし、リリースノートが古い CI layout を説明しないようにする
- 安定版 macOS リリース readiness には updater surfaces も含まれる:
  - GitHub release には packaged `.zip`、`.dmg`、`.dSYM.zip` が最終的に含まれている必要がある
  - publish 後、`main` の `appcast.xml` は新しい安定版 zip を指している必要がある
  - packaged app は non-debug bundle id、空でない Sparkle feed URL、そのリリースバージョンの canonical Sparkle build floor 以上の `CFBundleVersion` を維持している必要がある

## リリーステストボックス

`Full Release Validation` は、operator がすべてのプレリリーステストを単一のエントリポイントから開始する方法である。動きの速いブランチで pinned commit proof を取得するには、helper を使ってすべての子ワークフローを対象 SHA に固定された一時ブランチから実行する:

```bash
pnpm ci:full-release --sha <full-sha>
```

この helper は `release-ci/<sha>-...` を push し、そのブランチから `ref=<sha>` で `Full Release Validation` をディスパッチし、すべての子ワークフローの `headSha` が対象と一致することを検証してから、一時ブランチを削除する。これにより、誤って新しい `main` の子 run を証明してしまうことを防ぐ。

リリースブランチまたはタグの検証では、信頼済みの `main` workflow ref から実行し、リリースブランチまたはタグを `ref` として渡す:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

このワークフローはターゲット ref を解決し、`target_ref=<release-ref>` 付きで手動 `CI` をディスパッチし、`OpenClaw Release Checks` をディスパッチし、パッケージ向けチェック用の親 `release-package-under-test` アーティファクトを準備し、`release_profile=full` かつ `rerun_group=all` の場合、または `npm_telegram_package_spec` が設定されている場合に、スタンドアロンのパッケージ Telegram E2E をディスパッチします。その後 `OpenClaw Release Checks` は、インストールスモーク、クロス OS リリースチェック、live/E2E Docker リリースパスのカバレッジ、Telegram パッケージ QA 付きの Package Acceptance、QA Lab パリティ、live Matrix、live Telegram に展開します。フル実行が許容されるのは、`Full Release Validation` のサマリーで `normal_ci` と `release_checks` が成功として表示される場合のみです。full/all モードでは、`npm_telegram` 子も成功している必要があります。full/all 以外では、公開済みの `npm_telegram_package_spec` が指定されていない限りスキップされます。最終の検証サマリーには各子実行の最も遅いジョブの表が含まれるため、リリースマネージャーはログをダウンロードせずに現在のクリティカルパスを確認できます。
完全なステージマトリクス、正確なワークフロージョブ名、stable プロファイルと full プロファイルの違い、アーティファクト、重点的な再実行ハンドルについては、[完全リリース検証](/ja-JP/reference/full-release-validation)を参照してください。
子ワークフローは、ターゲット `ref` が古いリリースブランチやタグを指している場合でも、`Full Release Validation` を実行する信頼された ref、通常は `--ref main` からディスパッチされます。別個の Full Release Validation workflow-ref 入力はありません。ワークフロー実行 ref を選択することで、信頼されたハーネスを選択します。移動する `main` 上で正確なコミット証拠を得るために `--ref main -f ref=<sha>` を使用しないでください。生のコミット SHA はワークフローディスパッチ ref にできないため、`pnpm ci:full-release --sha <sha>` を使用してピン留めされた一時ブランチを作成します。

live/provider の広さを選択するには `release_profile` を使用します。

- `minimum`: 最速のリリースクリティカルな OpenAI/core live と Docker パス
- `stable`: minimum に加えて、リリース承認用の stable provider/backend カバレッジ
- `full`: stable に加えて、広範な advisory provider/media カバレッジ

`OpenClaw Release Checks` は、信頼されたワークフロー ref を使用してターゲット ref を `release-package-under-test` として一度だけ解決し、そのアーティファクトをリリースパス Docker チェックと Package Acceptance の両方で再利用します。これにより、すべてのパッケージ向けボックスが同じバイト列を使用し、パッケージビルドの繰り返しを避けられます。クロス OS OpenAI インストールスモークは、repo/org 変数が設定されている場合は `OPENCLAW_CROSS_OS_OPENAI_MODEL` を使用し、それ以外は `openai/gpt-5.4` を使用します。このレーンは、最も遅いデフォルトモデルのベンチマークではなく、パッケージインストール、オンボーディング、Gateway 起動、1 回の live agent ターンを証明するためです。より広範な live provider マトリクスは、引き続きモデル固有のカバレッジの場です。

リリース段階に応じて、次のバリアントを使用します。

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
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
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

重点修正後の最初の再実行として、フルの統合ワークフローを使用しないでください。1 つのボックスが失敗した場合は、次の証明に失敗した子ワークフロー、ジョブ、Docker レーン、パッケージプロファイル、モデル provider、または QA レーンを使用します。フルの統合ワークフローを再実行するのは、修正が共有リリースオーケストレーションを変更した場合、または以前の全ボックス証拠が古くなった場合のみにしてください。統合ワークフローの最終検証は、記録された子ワークフロー実行 ID を再チェックするため、子ワークフローが正常に再実行された後は、失敗した親ジョブ `Verify full validation` のみを再実行します。

範囲を限定した復旧には、統合ワークフローに `rerun_group` を渡します。`all` は実際のリリース候補実行、`ci` は通常 CI 子のみ、`plugin-prerelease` はリリース専用 Plugin 子のみ、`release-checks` はすべてのリリースボックスを実行し、より狭いリリースグループは `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live`、`npm-telegram` です。重点的な `npm-telegram` 再実行には `npm_telegram_package_spec` が必要です。`release_profile=full` の full/all 実行では、release-checks パッケージアーティファクトを使用します。

### Vitest

Vitest ボックスは手動 `CI` 子ワークフローです。手動 CI は意図的に changed スコープを迂回し、リリース候補に対して通常のテストグラフを強制します。Linux Node shard、バンドル Plugin shard、チャンネル契約、Node 22 互換性、`check`、`check-additional`、ビルドスモーク、ドキュメントチェック、Python Skills、Windows、macOS、Android、Control UI i18n が対象です。

このボックスは、「ソースツリーが通常のフルテストスイートに合格したか」に答えるために使用します。これはリリースパスの製品検証と同じではありません。保持すべき証拠:

- ディスパッチされた `CI` 実行 URL を示す `Full Release Validation` サマリー
- 正確なターゲット SHA で green になった `CI` 実行
- リグレッション調査時の CI ジョブからの失敗または低速 shard 名
- 実行にパフォーマンス分析が必要な場合の `.artifacts/vitest-shard-timings.json` などの Vitest タイミングアーティファクト

リリースで決定論的な通常 CI が必要だが、Docker、QA Lab、live、クロス OS、またはパッケージボックスが不要な場合のみ、手動 CI を直接実行します。

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Docker ボックスは、`openclaw-live-and-e2e-checks-reusable.yml` とリリースモードの `install-smoke` ワークフローを通じて `OpenClaw Release Checks` 内にあります。ソースレベルのテストだけでなく、パッケージ化された Docker 環境を通じてリリース候補を検証します。

リリース Docker カバレッジには次が含まれます。

- 低速な Bun グローバルインストールスモークを有効にした完全なインストールスモーク
- ターゲット SHA による root Dockerfile スモークイメージの準備/再利用。QR、root/Gateway、installer/Bun スモークジョブは個別の install-smoke shard として実行
- リポジトリ E2E レーン
- リリースパス Docker チャンク: `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`
- 要求された場合の `plugins-runtime-services` チャンク内の OpenWebUI カバレッジ
- 分割されたバンドル Plugin install/uninstall レーン `bundled-plugin-install-uninstall-0` から `bundled-plugin-install-uninstall-23`
- リリースチェックに live スイートが含まれる場合の live/E2E provider スイートと Docker live モデルカバレッジ

再実行前に Docker アーティファクトを使用します。リリースパススケジューラーは、レーンログ、`summary.json`、`failures.json`、フェーズタイミング、スケジューラープラン JSON、再実行コマンドを含む `.artifacts/docker-tests/` をアップロードします。重点復旧には、すべてのリリースチャンクを再実行するのではなく、再利用可能な live/E2E ワークフローで `docker_lanes=<lane[,lane]>` を使用します。生成される再実行コマンドには、利用可能な場合、以前の `package_artifact_run_id` と準備済み Docker イメージ入力が含まれるため、失敗したレーンは同じ tarball と GHCR イメージを再利用できます。

### QA Lab

QA Lab ボックスも `OpenClaw Release Checks` の一部です。これは agentic behavior とチャンネルレベルのリリースゲートであり、Vitest や Docker パッケージ機構とは別です。

リリース QA Lab カバレッジには次が含まれます。

- agentic parity pack を使用し、OpenAI candidate レーンを Opus 4.6 ベースラインと比較する mock parity レーン
- `qa-live-shared` 環境を使用する高速 live Matrix QA プロファイル
- Convex CI credential lease を使用する live Telegram QA レーン
- リリース telemetry に明示的なローカル証明が必要な場合の `pnpm qa:otel:smoke`

このボックスは、「リリースが QA シナリオと live チャンネルフローで正しく動作するか」に答えるために使用します。リリース承認時には、parity、Matrix、Telegram レーンのアーティファクト URL を保持します。完全な Matrix カバレッジは、デフォルトのリリースクリティカルレーンではなく、手動の sharded QA-Lab 実行として引き続き利用できます。

### パッケージ

パッケージボックスは、インストール可能な製品ゲートです。これは `Package Acceptance` とリゾルバー `scripts/resolve-openclaw-package-candidate.mjs` によって支えられています。リゾルバーは候補を Docker E2E が消費する `package-under-test` tarball に正規化し、パッケージインベントリを検証し、パッケージバージョンと SHA-256 を記録し、ワークフローハーネス ref をパッケージソース ref から分離したままにします。

サポートされる候補ソース:

- `source=npm`: `openclaw@beta`、`openclaw@latest`、または正確な OpenClaw リリースバージョン
- `source=ref`: 選択された `workflow_ref` ハーネスで、信頼された `package_ref` ブランチ、タグ、または完全なコミット SHA を pack
- `source=url`: 必須の `package_sha256` 付きで HTTPS `.tgz` をダウンロード
- `source=artifact`: 別の GitHub Actions 実行によってアップロードされた `.tgz` を再利用

`OpenClaw Release Checks` は、準備済みリリースパッケージアーティファクトを使って Package Acceptance を `source=artifact`、`suite_profile=custom`、`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`、`published_upgrade_survivor_baselines=all-since-2026.4.23`、`published_upgrade_survivor_scenarios=reported-issues`、`telegram_mode=mock-openai` で実行します。Package Acceptance は、同じ解決済み tarball に対して、migration、update、古い Plugin 依存関係クリーンアップ、offline Plugin fixtures、Plugin update、Telegram package QA を維持します。upgrade マトリクスは、`2026.4.23` から `latest` までのすべての stable npm 公開済みベースラインを対象にします。すでに出荷済みの候補には `source=npm` の Package Acceptance を使用し、公開前の SHA 裏付けのローカル npm tarball には `source=ref`/`source=artifact` を使用します。これは、以前は Parallels が必要だったパッケージ/update カバレッジの大半を置き換える GitHub ネイティブな手段です。クロス OS リリースチェックは、OS 固有のオンボーディング、installer、プラットフォーム動作のために引き続き重要ですが、パッケージ/update 製品検証では Package Acceptance を優先してください。

update と Plugin 検証の正規チェックリストは、[update と Plugin のテスト](/ja-JP/help/testing-updates-plugins)です。Plugin install/update、doctor cleanup、または公開済みパッケージ migration の変更を、どのローカル、Docker、Package Acceptance、または release-check レーンで証明するかを決めるときに使用します。すべての stable `2026.4.23+` パッケージからの網羅的な公開済み update migration は、Full Release CI の一部ではなく、別個の手動 `Update Migration` ワークフローです。

レガシー package-acceptance の寛容さは、意図的に期間限定です。`2026.4.25` までのパッケージは、すでに npm に公開されたメタデータの欠落に対して互換性パスを使用できます。tarball にない private QA inventory entries、欠落した `gateway install --wrapper`、tarball 由来の git fixture にない patch files、永続化されていない `update.channel`、レガシー Plugin install-record locations、marketplace install-record persistence の欠落、`plugins update` 中の config metadata migration が該当します。公開済みの `2026.4.26` パッケージは、すでに出荷されたローカルビルドメタデータスタンプファイルについて警告する場合があります。それ以降のパッケージは、現代的なパッケージ契約を満たす必要があります。同じ欠落はリリース検証で失敗します。

リリースの論点が実際にインストール可能なパッケージに関する場合は、より広範な Package Acceptance プロファイルを使用します。

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

- `smoke`: クイックなパッケージインストール/チャンネル/エージェント、Gateway ネットワーク、設定リロードのレーン
- `package`: live ClawHub なしのインストール/更新/Plugin パッケージ契約。これはリリースチェックのデフォルト
- `product`: `package` に加えて MCP チャンネル、cron/サブエージェントのクリーンアップ、OpenAI web検索、OpenWebUI
- `full`: OpenWebUI を含む Docker リリースパスのチャンク
- `custom`: 焦点を絞った再実行用の正確な `docker_lanes` リスト

パッケージ候補の Telegram 証明には、Package Acceptance で `telegram_mode=mock-openai` または
`telegram_mode=live-frontier` を有効にします。このワークフローは、解決済みの
`package-under-test` tarball を Telegram レーンに渡します。スタンドアロンの
Telegram ワークフローは、公開後チェック用に公開済み npm 仕様を引き続き受け付けます。

## リリース公開の自動化

`OpenClaw Release Publish` は通常の変更を伴う公開エントリーポイントです。リリースに必要な順序で、信頼済み公開者ワークフローをオーケストレーションします。

1. リリースタグをチェックアウトし、そのコミット SHA を解決します。
2. タグが `main` または `release/*` から到達可能であることを検証します。
3. `pnpm plugins:sync:check` を実行します。
4. `publish_scope=all-publishable` と `ref=<release-sha>` で `Plugin NPM Release` をディスパッチします。
5. 同じスコープと SHA で `Plugin ClawHub Release` をディスパッチします。
6. リリースタグ、npm dist-tag、保存済みの `preflight_run_id` で `OpenClaw NPM Release` をディスパッチします。

ベータ公開の例:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

デフォルトの beta dist-tag への安定版公開:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

`latest` へ直接安定版を昇格する場合は明示的に指定します:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

低レベルの `Plugin NPM Release` と `Plugin ClawHub Release` ワークフローは、焦点を絞った修復または再公開作業にのみ使用してください。選択した Plugin 修復では、`OpenClaw Release Publish` に `plugin_publish_scope=selected` と `plugins=@openclaw/name` を渡すか、OpenClaw パッケージを公開してはならない場合は子ワークフローを直接ディスパッチします。

## NPM ワークフロー入力

`OpenClaw NPM Release` は、次のオペレーター制御入力を受け付けます:

- `tag`: 必須のリリースタグ。例: `v2026.4.2`、`v2026.4.2-1`、`v2026.4.2-beta.1`。`preflight_only=true` の場合は、検証専用プリフライト用に現在の完全な 40 文字のワークフローブランチコミット SHA も使用できます
- `preflight_only`: 検証/ビルド/パッケージのみの場合は `true`、実際の公開パスの場合は `false`
- `preflight_run_id`: 実際の公開パスで必須。ワークフローが成功したプリフライト実行から準備済み tarball を再利用するために使用します
- `npm_dist_tag`: 公開パスの npm ターゲットタグ。デフォルトは `beta`

`OpenClaw Release Publish` は、次のオペレーター制御入力を受け付けます:

- `tag`: 必須のリリースタグ。すでに存在している必要があります
- `preflight_run_id`: 成功した `OpenClaw NPM Release` プリフライト実行 ID。`publish_openclaw_npm=true` の場合は必須
- `npm_dist_tag`: OpenClaw パッケージの npm ターゲットタグ
- `plugin_publish_scope`: デフォルトは `all-publishable`。焦点を絞った修復作業の場合のみ `selected` を使用します
- `plugins`: `plugin_publish_scope=selected` の場合のカンマ区切りの `@openclaw/*` パッケージ名
- `publish_openclaw_npm`: デフォルトは `true`。ワークフローを Plugin のみの修復オーケストレーターとして使用する場合のみ `false` に設定します

`OpenClaw Release Checks` は、次のオペレーター制御入力を受け付けます:

- `ref`: 検証するブランチ、タグ、または完全なコミット SHA。シークレットを伴うチェックでは、解決済みコミットが OpenClaw ブランチまたはリリースタグから到達可能である必要があります。

ルール:

- 安定版タグと修正タグは `beta` または `latest` のどちらにも公開できます
- ベータのプレリリースタグは `beta` にのみ公開できます
- `OpenClaw NPM Release` では、完全なコミット SHA 入力は `preflight_only=true` の場合にのみ許可されます
- `OpenClaw Release Checks` と `Full Release Validation` は常に検証専用です
- 実際の公開パスでは、プリフライト時に使用したものと同じ `npm_dist_tag` を使用する必要があります。ワークフローは公開を続行する前にそのメタデータを検証します

## 安定版 npm リリース手順

安定版 npm リリースを切る場合:

1. `preflight_only=true` で `OpenClaw NPM Release` を実行します
   - タグが存在する前は、プリフライトワークフローの検証専用ドライランに現在の完全なワークフローブランチコミット SHA を使用できます
2. 通常のベータ優先フローでは `npm_dist_tag=beta` を選択し、意図的に直接安定版を公開したい場合のみ `latest` を選択します
3. 1 つの手動ワークフローから通常の CI に加えて live プロンプトキャッシュ、Docker、QA Lab、Matrix、Telegram のカバレッジが必要な場合は、リリースブランチ、リリースタグ、または完全なコミット SHA で `Full Release Validation` を実行します
4. 意図的に決定的な通常のテストグラフだけが必要な場合は、代わりにリリース ref で手動の `CI` ワークフローを実行します
5. 成功した `preflight_run_id` を保存します
6. 同じ `tag`、同じ `npm_dist_tag`、保存済みの `preflight_run_id` で `OpenClaw Release Publish` を実行します。OpenClaw npm パッケージを昇格する前に、外部化された Plugin を npm と ClawHub に公開します
7. リリースが `beta` に着地した場合は、非公開の `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ワークフローを使用して、その安定版を `beta` から `latest` へ昇格します
8. リリースを意図的に `latest` に直接公開し、`beta` も同じ安定版ビルドをすぐに指す必要がある場合は、同じ非公開ワークフローを使用して両方の dist-tag を安定版に向けるか、スケジュールされた自己修復同期で後から `beta` を移動させます

dist-tag の変更は、引き続き `NPM_TOKEN` を必要とするため、セキュリティ上の理由で非公開リポジトリに置かれています。一方、公開リポジトリは OIDC のみの公開を維持します。

これにより、直接公開パスとベータ優先の昇格パスの両方が文書化され、オペレーターから見える状態になります。

メンテナーがローカル npm 認証へフォールバックする必要がある場合は、1Password CLI (`op`) コマンドを専用の tmux セッション内でのみ実行してください。メインのエージェントシェルから `op` を直接呼び出さないでください。tmux 内に閉じ込めることで、プロンプト、アラート、OTP 処理を観察可能にし、ホストアラートの繰り返しを防げます。

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

メンテナーは、実際のランブックとして非公開リリースドキュメント
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
を使用します。

## 関連

- [リリースチャンネル](/ja-JP/install/development-channels)
