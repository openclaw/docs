---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしています'
    - '`--update` の省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-07-12T14:24:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db7b636b68e693824cb49ada2c176a4e394a3100ce33fff1c96ee20ae8427ee
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を更新し、stable/extended-stable/beta/dev チャンネルを切り替えます。

**npm/pnpm/bun** 経由でインストールした場合（グローバルインストールで、git メタデータがない場合）、更新は
[更新](/ja-JP/install/updating)で説明されているパッケージマネージャーのフローを使用します。

## 使用方法

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトで便利です）。

## オプション

| フラグ                                           | 説明                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--no-restart`                                   | 更新が成功した後の Gateway サービスの再起動をスキップします。再起動を行うパッケージマネージャー更新では、コマンドが成功する前に、再起動したサービスが期待されるバージョンを報告することを確認します。                                                                                                                                    |
| `--channel <stable\|extended-stable\|beta\|dev>` | 更新チャンネルを設定し、コアの更新成功後に保存します。Extended-stable はパッケージでのみ使用できます。                                                                                                                                                                                                                                |
| `--tag <dist-tag\|version\|spec>`                | この更新に限り、パッケージターゲットを上書きします。検証済みの正確なターゲットが必須となる、有効な `extended-stable` チャンネルとは組み合わせられません。その他のパッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマッピングされます。GitHub/git ソース仕様は、段階的なグローバル npm インストールの前に一時 tarball にパックされます。 |
| `--dry-run`                                      | 設定の書き込み、インストール、Plugin の同期、再起動を行わずに、予定されているアクション（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。                                                                                                                                                                                 |
| `--json`                                         | 機械可読な `UpdateRunResult` JSON を出力します。管理対象 Plugin に修復が必要な場合は `postUpdate.plugins.warnings`、beta チャンネルでの Plugin フォールバックの詳細、更新後の同期中に npm Plugin アーティファクトのドリフトが検出された場合は `postUpdate.plugins.integrityDrifts` が含まれます。                                      |
| `--timeout <seconds>`                            | ステップごとのタイムアウトです。デフォルトは `1800` です。                                                                                                                                                                                                                                                                          |
| `--yes`                                          | 確認プロンプト（ダウングレードの確認など）をスキップします。                                                                                                                                                                                                                                                                        |
| `--acknowledge-clawhub-risk`                     | 対話型プロンプトなしで、コミュニティ ClawHub の信頼性に関する警告を越えて更新後の Plugin 同期を続行できるようにします。これを指定しない場合、OpenClaw がプロンプトを表示できないときは、リスクのあるコミュニティリリースがスキップされ、変更されません。公式 ClawHub パッケージとバンドルされた Plugin ソースでは、このプロンプトを表示しません。 |

`--verbose` フラグはありません。予定されているアクションのプレビューには `--dry-run`、機械可読な結果には `--json`、チャンネルと利用可否のみの確認には `openclaw update status --json` を使用します。Gateway コンソールの詳細度（`--verbose`）とファイルのログレベル（`logging.level: "debug"`/`"trace"`）は独立した設定です。[Gateway のログ](/ja-JP/gateway/logging)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` の実行は無効です。代わりに、このインストールの Nix ソースまたは flake 入力を更新してください。nix-openclaw では、エージェントファーストの[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用してください。`openclaw update status` と `openclaw update --dry-run` は引き続き読み取り専用です。
</Note>

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
インストール済み環境でセッションがすでに SQLite に移行されている場合は、ファイルベースの古いバージョンを起動する前に、アーカイブされた従来のトランスクリプトアーティファクトを復元してください。
[Doctor：セッションの SQLite 移行後のダウングレード](/ja-JP/cli/doctor#downgrading-after-session-sqlite-migration)を参照してください。
</Warning>

## `update status`

有効な更新チャンネル、git タグ/ブランチ/SHA（ソースチェックアウトのみ）、および更新の利用可否を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| フラグ                | デフォルト | 説明                               |
| --------------------- | ---------- | ---------------------------------- |
| `--json`              | `false`    | 機械可読なステータス JSON を出力します。 |
| `--timeout <seconds>` | `3`        | チェックのタイムアウトです。       |

Extended-stable パッケージインストールの場合、ステータス確認ではフォアグラウンド更新と同じ公開セレクターおよび正確なパッケージの検証を実行します。インストールされているバージョンの方が新しい場合は、`ahead of extended-stable` と報告されることがあります。JSON の失敗には `registry.reason`（`selector_missing`、`selector_query_failed`、`exact_package_mismatch`、または `unsupported_git_channel`）が含まれます。

## `update repair`

コアパッケージはすでに変更されたものの、その後の修復作業が正常に完了しなかった場合に、更新の最終処理を再実行します。`openclaw update` によって新しいコアパッケージがインストールされたものの、コア更新後の Plugin 同期、管理対象 npm Plugin のメタデータ、レジストリの更新、または Doctor による修復が収束しなかった場合にサポートされる復旧方法です。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| フラグ                                           | 説明                                                                                                                                                                                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--channel <stable\|extended-stable\|beta\|dev>` | 修復前にコアの更新チャンネルを保存します。Extended-stable の場合、bare/default または `latest` の指定に従う対象の公式 npm Plugin は、インストールされている正確なコアバージョンをターゲットにします。Extended-stable の修復は、設定を変更することなく Git チェックアウトでは拒否されます。 |
| `--json`                                         | 機械可読な最終処理 JSON を出力します。                                                                                                                                                                                                                             |
| `--timeout <seconds>`                            | 修復ステップのタイムアウトです。デフォルトは `1800` です。                                                                                                                                                                                                         |
| `--yes`                                          | 確認プロンプトをスキップします。                                                                                                                                                                                                                                    |
| `--acknowledge-clawhub-risk`                     | `openclaw update` と同じ動作です。                                                                                                                                                                                                                                  |
| `--no-restart`                                   | 一貫性のために受け付けますが、修復では Gateway を再起動しません。                                                                                                                                                                                                  |

`update repair` は `openclaw doctor --fix` を実行し、修復された設定とインストールレコードを再読み込みし、有効な更新チャンネルに対して追跡対象の Plugin を同期し、管理対象の npm Plugin インストールを更新し、欠落している設定済み Plugin のペイロードを修復し、Plugin レジストリを更新して、収束したインストールレコードのメタデータを書き込みます。新しいコアパッケージのインストールも、Gateway の再起動も行いません。

## `update wizard`

更新チャンネルを選択し、その後 Gateway を再起動するかどうかを確認する対話型フローです（デフォルトでは再起動します）。git チェックアウトがない状態で `dev` を選択すると、チェックアウトの作成を提案します。

| フラグ                | デフォルト | 説明                             |
| --------------------- | ---------- | -------------------------------- |
| `--timeout <seconds>` | `1800`     | 各更新ステップのタイムアウトです。 |

## 動作内容

チャンネルを明示的に切り替えると（`--channel ...`）、インストール方法もそれに合わせて維持されます。

- `dev` -> git チェックアウト（デフォルトは `~/openclaw`、`OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）を確保して更新し、そのチェックアウトからグローバル CLI をインストールします。
- `stable` -> `latest` を使用して npm からインストールします。
- `extended-stable` -> 公開 npm `extended-stable` セレクターを解決し、選択された正確なパッケージを検証して、その正確なバージョンをインストールします。別のセレクターへのフォールバックは行わず、Git チェックアウトでは拒否されます。
- `beta` -> npm dist-tag `beta` を優先し、beta が存在しないか現在の安定版リリースより古い場合は `latest` にフォールバックします。

### 再起動の引き継ぎ

Gateway コアの自動更新機能（設定で有効な場合）は、稼働中の Gateway リクエストハンドラーの外部で CLI 更新パスを起動します。コントロールプレーンの `update.run` によるパッケージマネージャー更新と、監視下の git チェックアウト更新では、稼働中の Gateway プロセス内でパッケージツリーを置き換えたり `dist/` を再ビルドしたりせず、同じ管理サービスへの引き継ぎを使用します。Gateway はデタッチされたヘルパーを起動して終了し、そのヘルパーが Gateway プロセスツリーの外部から `openclaw update --yes --json` を実行します。引き継ぎを利用できない場合、`update.run` は手動で実行するための安全なシェルコマンドを含む構造化レスポンスを返します。

保存された extended-stable の選択には、`update.checkOnStart` が有効な場合、読み取り専用の起動時および24時間ごとの更新ヒントが提供されます。これらのチェックが更新を適用したり、ハンドオフを開始したり、Gateway を再起動したり、stable の遅延／ジッターを使用したり、beta のポーリング間隔を使用したりすることはありません。明示的なフォアグラウンド更新、保存された `update.channel: "extended-stable"` を使用する引数なしのフォアグラウンド更新、オンデマンドのステータス確認、およびそれらの管理対象 Gateway ハンドオフは、引き続きサポートされます。

ローカルの管理対象 Gateway サービスがインストールされ、再起動が有効な場合、パッケージマネージャーおよび Git チェックアウトの更新では、パッケージツリーを置き換えたり、チェックアウト／ビルド出力を変更したりする前に、実行中のサービスを停止します。その後、アップデーターはサービスメタデータを更新し、サービスを再起動して、再起動後の Gateway を検証してから `Gateway: restarted and verified.` と報告します。パッケージマネージャーによる更新では、再起動後の Gateway が期待されるパッケージバージョンを報告することも検証します。Git チェックアウトの更新では、再ビルド後に Gateway の正常性とサービスの準備完了状態を検証します。

macOS では、更新後チェックにより、アクティブなプロファイルで LaunchAgent が読み込まれ、実行中であること、および設定されたループバックポートが正常であることも検証されます。plist がインストールされているにもかかわらず launchd が監視していない場合、OpenClaw は LaunchAgent を自動的に再ブートストラップし、正常性／バージョン／チャネルの準備完了チェックを再実行します（新規ブートストラップでは `RunAtLoad` ジョブが直接読み込まれるため、復旧処理が新しく起動された Gateway に対して直ちに `kickstart -k` を実行することはありません）。それでも Gateway が正常にならない場合、コマンドはゼロ以外の終了コードで終了し、再起動ログのパスに加えて、再起動、再インストール、およびパッケージのロールバック手順を出力します。

再起動を実行できない場合、コマンドは `Gateway: restart skipped (...)` または `Gateway: restart failed: ...` を、手動で実行する `openclaw gateway restart` のヒントとともに出力します。`--no-restart` を指定した場合も、パッケージの置き換えまたは Git の再ビルドは実行されますが、管理対象サービスは停止も再起動もされないため、実行中の Gateway は手動で再起動するまで古いコードを使用し続けます。

### コントロールプレーンのレスポンス形式

パッケージマネージャーによるインストールまたは監視対象の Git チェックアウトで、`update.run` が Gateway のコントロールプレーン経由で実行される場合、ハンドラーは、Gateway の終了後も継続する CLI 更新とは別に、ハンドオフの開始を報告します。

- `ok: true`、`result.status: "skipped"`、
  `result.reason: "managed-service-handoff-started"`、および
  `handoff.status: "started"`：Gateway は管理対象サービスのハンドオフを作成し、自身の再起動をスケジュールしました。これにより、切り離されたヘルパーは稼働中のサービスプロセス外で
  `openclaw update --yes --json` を実行できます。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"`、および
  `handoff.status: "unavailable"`：OpenClaw は、安全なハンドオフに必要な監視サービス境界と永続的なサービス ID を見つけられませんでした（たとえば、systemd のハンドオフには、単に周囲の systemd プロセスマーカーだけでなく、`OPENCLAW_SYSTEMD_UNIT` のユニット ID が必要です）。レスポンスには、Gateway の外部から実行するシェルコマンドである
  `handoff.command` が含まれます。
- `ok: false`、`result.reason: "managed-service-handoff-failed"`：Gateway はハンドオフの作成を試みましたが、切り離されたヘルパーを起動できませんでした。

`sentinel` ペイロードは Gateway の終了前に書き込まれ、CLI ハンドオフは、管理対象サービスの再起動後の正常性チェックが完了すると、同じ再起動 sentinel を更新します。ハンドオフ中、sentinel には成功時の継続処理なしで `stats.reason: "restart-health-pending"` が含まれる場合があります。再起動後の Gateway はこれをポーリングし、CLI がサービスの正常性を検証して最終的な `ok` の結果で sentinel を書き換えた後にのみ、継続処理を実行します。`openclaw status` と `openclaw status --all` は、その sentinel が保留中または失敗している間、`Update restart` 行を表示し、`update.status` は最新の sentinel を更新して返します。

## Git チェックアウトのフロー

### チャネルの選択

- `stable`：最新の非 beta タグをチェックアウトし、ビルドと doctor を実行します。
- `beta`：最新の `-beta` タグを優先し、beta が存在しないか stable より古い場合は、最新の stable タグにフォールバックします。
- `dev`：`main` をチェックアウトし、その後 fetch と rebase を実行します。
- `extended-stable`：Git チェックアウトではサポートされません。チェックアウトの変更は行われません。

### 更新手順

<Steps>
  <Step title="クリーンなワークツリーを検証">
    コミットされていない変更がないことが必要です。
  </Step>
  <Step title="チャネルを切り替え">
    選択したチャネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="upstream を取得">
    dev のみです。
  </Step>
  <Step title="事前ビルド（dev のみ）">
    一時ワークツリーで TypeScript ビルドを実行します。先端のコミットが失敗した場合、最大10件のコミットをさかのぼり、ビルド可能な最新のコミットを見つけます。この事前チェック中に lint も実行するには、`OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザーの更新ホストは CI ランナーより小規模なことが多いため、lint はリソースを制限した直列モードで実行されます。
  </Step>
  <Step title="リベース">
    選択したコミット上にリベースします（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、アップデーターは pnpm ワークスペース内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（最初に `corepack` を使用し、その後、一時的な `npm install pnpm@11` をフォールバックとして使用します）。pnpm のブートストラップがそれでも失敗する場合、アップデーターはチェックアウト内で `npm run build` を試行せず、パッケージマネージャー固有のエラーで早期に停止します。
  </Step>
  <Step title="Control UI をビルド">
    Gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    最後の安全な更新チェックとして `openclaw doctor` を実行します。
  </Step>
  <Step title="plugins を同期">
    plugins をアクティブなチャネルに同期します。dev では同梱の plugins を使用し、stable と beta では npm を使用します。追跡対象の plugin インストールを更新します。
  </Step>
</Steps>

### Plugin 同期の詳細

beta チャネルでは、default/latest 系列に従う追跡対象の npm および ClawHub plugin インストールについて、最初に plugin の `@beta` リリースを試します。plugin に beta リリースがない場合、OpenClaw は記録された default/latest の指定にフォールバックし、警告を報告します。npm plugins では、beta パッケージが存在していてもインストール検証に失敗した場合にもフォールバックします。これらのフォールバック警告によって、コアの更新が失敗することはありません。正確なバージョンと明示的なタグは書き換えられません。

<Warning>
正確に固定された npm plugin の更新が、保存されているインストール記録と異なる整合性情報を持つアーティファクトに解決された場合、`openclaw update` はそれをインストールせず、その plugin アーティファクトの更新を中止します。新しいアーティファクトを信頼できることを確認した後にのみ、plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
更新後の plugin 同期の失敗が管理対象 plugin に限定され、同期パスで回避できる場合（たとえば、必須ではない plugin 用の npm レジストリに到達できない場合）、コア更新の成功後に警告として報告されます。JSON の結果では、最上位の更新 `status: "ok"` が維持され、`postUpdate.plugins.status: "warning"` とともに、`openclaw update repair` および `openclaw plugins inspect <id> --runtime --json` のガイダンスが報告されます。予期しないアップデーターまたは同期の例外の場合は、引き続き更新結果が失敗になります。plugin のインストールまたは更新エラーを修正してから、`openclaw update repair` を再実行してください。

plugin ごとの同期手順の後、`openclaw update` は Gateway の再起動前に必須の**コア更新後の収束**処理を実行します。この処理では、設定済み plugin の欠落したペイロードを修復し、_アクティブ_な追跡対象インストール記録をそれぞれディスク上で検証し、その `package.json` が解析可能であること（および明示的に宣言された `main` が存在すること）を静的に検証します。この処理の失敗、および無効な設定スナップショットは、`postUpdate.plugins.status: "error"` を返し、最上位の更新 `status` を `"error"` に変更します。そのため、`openclaw update` はゼロ以外で終了し、検証されていない plugin セットのまま Gateway が再起動されることはありません。エラーには、`openclaw update repair` と `openclaw plugins inspect <id> --runtime --json` を示す構造化された `postUpdate.plugins.warnings[].guidance` 行が含まれます。無効化された plugin エントリ、および信頼済みソースに関連付けられた公式同期対象ではない記録は、ここではスキップされます（欠落ペイロードのチェックで使用される `skipDisabledPlugins` ポリシーと同様です）。そのため、古くなった無効な plugin 記録が、それ以外は有効な更新を妨げることはありません。

更新後の Gateway が起動するとき、plugin の読み込みは検証のみです。起動処理でパッケージマネージャーを実行したり、依存関係ツリーを変更したりすることはありません。パッケージマネージャーの `update.run` による再起動は、CLI の管理対象サービスパスに引き渡されます。そのため、パッケージの入れ替えは古い Gateway プロセスの外部で行われ、サービスの正常性チェックによって更新を完了として報告できるかどうかが決まります。
</Note>

extended-stable のコア更新が成功すると、コア更新後の plugin の整合性と収束は、インストール済みのコアとまったく同じバージョンの対象となる公式 npm plugins を対象にします。default/`latest` の意図の場合、OpenClaw は plugin の `@extended-stable` を照会せず、npm の `latest` にもフォールバックしません。インストール済みのコアからパッケージバージョンを導出します。明示的なバージョン固定、明示的な `latest` 以外のタグ、サードパーティ製パッケージ、および npm 以外のソースは、既存の意図を維持します。

パッケージマネージャーによるインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前に、対象のパッケージバージョンを解決します。npm のグローバルインストールでは、段階的インストールを使用します。OpenClaw は新しいパッケージを一時的な npm prefix にインストールし、そこでパッケージ化された `dist` の内容一覧を検証してから、そのクリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。検証に失敗した場合、疑わしいツリーから更新後の doctor、plugin 同期、および再起動処理が実行されることはありません。インストール済みバージョンがすでに対象と一致している場合でも、コマンドはグローバルパッケージのインストールを更新し、その後 plugin 同期、コアコマンドの補完情報の更新、および再起動処理を実行します。これにより、パッケージ化されたサイドカーとチャネル管理の plugin 記録がインストール済みの OpenClaw ビルドと整合した状態に保たれます。一方、plugin コマンドを含む完全な補完情報の再ビルドは、明示的な `openclaw completion --write-state` の実行時にのみ行われます。

## 関連項目

- `openclaw doctor`（Git チェックアウトでは、最初に更新を実行するよう提案します）
- [開発チャネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
