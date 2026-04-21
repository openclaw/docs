---
read_when:
    - CIジョブが実行された、または実行されなかった理由を把握する必要があります
    - 失敗しているGitHub Actionsチェックをデバッグしています
summary: CIジョブグラフ、スコープゲート、およびローカルコマンドの同等物
title: CIパイプライン
x-i18n:
    generated_at: "2026-04-21T04:44:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# CIパイプライン

CIは、`main`へのすべてのpushとすべてのpull requestで実行されます。無関係な領域だけが変更された場合に高コストなジョブをスキップするため、スマートなスコープ判定を使用します。

## ジョブ概要

| Job                              | 目的                                                                                         | 実行されるタイミング                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `preflight`                      | docsのみの変更、変更されたスコープ、変更されたextensionsを検出し、CIマニフェストを構築する   | draftではないpushとPRで常に実行          |
| `security-scm-fast`              | `zizmor`による秘密鍵検出とworkflow監査                                                       | draftではないpushとPRで常に実行          |
| `security-dependency-audit`      | npm advisoriesに対する、依存関係なしの本番lockfile監査                                       | draftではないpushとPRで常に実行          |
| `security-fast`                  | 高速なsecurity jobsの必須aggregate                                                            | draftではないpushとPRで常に実行          |
| `build-artifacts`                | `dist/`とControl UIを一度ビルドし、下流ジョブ向けに再利用可能なartifactsをアップロードする    | Node関連の変更がある場合                 |
| `checks-fast-core`               | bundled/plugin-contract/protocol checksなどの高速なLinux正当性レーン                          | Node関連の変更がある場合                 |
| `checks-fast-contracts-channels` | 安定したaggregate check結果を持つ、分割されたchannel contract checks                          | Node関連の変更がある場合                 |
| `checks-node-extensions`         | extension suite全体にわたるbundled-plugin test shards一式                                     | Node関連の変更がある場合                 |
| `checks-node-core-test`          | channel、bundled、contract、extensionレーンを除く、core Node test shards                      | Node関連の変更がある場合                 |
| `extension-fast`                 | 変更されたbundled pluginsだけを対象にした集中テスト                                           | extensionの変更が検出された場合          |
| `check`                          | 分割されたメインのローカルゲート相当: 本番types、lint、guards、test types、strict smoke        | Node関連の変更がある場合                 |
| `check-additional`               | architecture、boundary、extension-surface guards、package-boundary、gateway-watch shards      | Node関連の変更がある場合                 |
| `build-smoke`                    | ビルド済みCLI smoke testsとstartup-memory smoke                                               | Node関連の変更がある場合                 |
| `checks`                         | 残りのLinux Nodeレーン: channel testsと、push時のみのNode 22互換性                            | Node関連の変更がある場合                 |
| `check-docs`                     | docsのフォーマット、lint、broken-link checks                                                  | docsが変更された場合                     |
| `skills-python`                  | PythonベースのSkillsに対するRuff + pytest                                                     | Python Skills関連の変更がある場合        |
| `checks-windows`                 | Windows固有のテストレーン                                                                     | Windows関連の変更がある場合              |
| `macos-node`                     | 共有のビルド済みartifactsを使うmacOS TypeScriptテストレーン                                   | macOS関連の変更がある場合                |
| `macos-swift`                    | macOSアプリ向けのSwift lint、build、tests                                                     | macOS関連の変更がある場合                |
| `android`                        | Android buildおよびtest matrix                                                                | Android関連の変更がある場合              |

## Fail-Fastの順序

ジョブは、高コストなものが動く前に低コストなチェックが失敗するように順序付けされています。

1. `preflight`が、そもそもどのレーンが存在するかを決定します。`docs-scope`と`changed-scope`のロジックは、独立したジョブではなく、このジョブ内のステップです。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs`、`skills-python`は、より重いartifactジョブやplatform matrixジョブを待たずに素早く失敗します。
3. `build-artifacts`は高速なLinuxレーンと並行して実行され、下流の利用側が共有ビルドの準備完了後すぐに開始できるようにします。
4. その後、より重いplatformおよびruntimeレーンが分岐して実行されます: `checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift`、`android`。

スコープロジックは`scripts/ci-changed-scope.mjs`にあり、`src/scripts/ci-changed-scope.test.ts`のユニットテストでカバーされています。
別の`install-smoke` workflowは、自身の`preflight`ジョブを通じて同じスコープスクリプトを再利用します。より狭いchanged-smokeシグナルから`run_install_smoke`を計算するため、Docker/install smokeはinstall、packaging、container関連の変更に対してのみ実行されます。

ローカルのchanged-laneロジックは`scripts/changed-lanes.mjs`にあり、`scripts/check-changed.mjs`によって実行されます。そのローカルゲートは、広いCI platform scopeよりもarchitecture boundaryに対して厳格です。core productionの変更はcore prod typecheckに加えてcore testsを実行し、core test-onlyの変更はcore test typecheck/testsのみを実行し、extension productionの変更はextension prod typecheckに加えてextension testsを実行し、extension test-onlyの変更はextension test typecheck/testsのみを実行します。公開Plugin SDKまたはplugin-contractの変更は、extensionsがそれらのcore contractsに依存しているため、extension validationまで拡張されます。未知のroot/configの変更は、安全側に倒してすべてのレーンになります。

push時には、`checks` matrixにpush専用の`compat-node22`レーンが追加されます。pull requestではそのレーンはスキップされ、matrixは通常のtest/channelレーンに集中したままになります。

最も遅いNode testファミリーは、各ジョブを小さく保つためにinclude-file shardsに分割されています。channel contractsはregistryとcore coverageをそれぞれ8つの重み付きshardに分割し、auto-reply reply command testsは4つのinclude-pattern shardに分割され、その他の大きなauto-reply reply prefix groupはそれぞれ2つのshardに分割されます。`check-additional`も、package-boundary compile/canary作業をruntime topology gateway/architecture作業から分離しています。

同じPRまたは`main` refに対して新しいpushが来ると、GitHubは置き換えられたジョブを`cancelled`としてマークすることがあります。同じrefに対する最新のrunも失敗していない限り、これはCIノイズとして扱ってください。aggregate shard checksでは、このキャンセルケースが明示的に示されるため、テスト失敗と区別しやすくなっています。

## Runners

| Runner                           | Jobs                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`、`security-scm-fast`、`security-dependency-audit`、`security-fast`、`build-artifacts`、Linux checks、docs checks、Python skills、`android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                     |
| `macos-latest`                   | `macos-node`、`macos-swift`                                                                                                                          |

## ローカルでの同等コマンド

```bash
pnpm changed:lanes   # origin/main...HEADに対するローカルchanged-lane classifierを確認
pnpm check:changed   # スマートなローカルゲート: boundary laneごとの変更されたtypecheck/lint/tests
pnpm check          # 高速なローカルゲート: 本番tsgo + 分割lint + 並列fast guards
pnpm check:test-types
pnpm check:timed    # 各ステージの所要時間つきで同じゲートを実行
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # CIのartifact/build-smokeレーンが関係する場合にdistをビルド
```
