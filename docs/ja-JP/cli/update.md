---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしています'
    - '`--update` の省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-07-16T11:34:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を更新し、stable/extended-stable/beta/dev チャネルを切り替えます。

**npm/pnpm/bun** 経由でインストールした場合（グローバルインストールで、git メタデータなし）、
更新は[更新](/ja-JP/install/updating)で説明されているパッケージマネージャーのフローで行われます。

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

`openclaw --update` は `openclaw update` に書き換えられます（シェルや
ランチャースクリプトで便利です）。

## オプション

| フラグ                                             | 説明                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | 更新に成功した後、Gateway サービスの再起動をスキップします。再起動を行うパッケージマネージャー更新では、コマンドが成功する前に、再起動したサービスが想定されるバージョンを報告することを検証します。                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | 更新チャネルを設定し、コアの更新成功後も保持します。extended-stable はパッケージでのみ利用できます。                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | この更新に限りパッケージターゲットを上書きします。検証済みの正確なターゲットが必須である有効な `extended-stable` チャネルとは併用できません。その他のパッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマッピングされます。GitHub/git ソース指定は、ステージングされたグローバル npm インストールの前に一時的な tarball にパックされます。 |
| `--dry-run`                                      | 設定の書き込み、インストール、Plugin の同期、再起動を行わずに、予定されている処理（チャネル/タグ/ターゲット/再起動フロー）をプレビューします。                                                                                                                                                                                                                |
| `--json`                                         | 機械可読な `UpdateRunResult` JSON を出力します。管理対象 Plugin の修復が必要な場合は `postUpdate.plugins.warnings`、beta チャネルの Plugin フォールバックの詳細、更新後の同期中に npm Plugin アーティファクトのずれが検出された場合は `postUpdate.plugins.integrityDrifts` が含まれます。                                                                 |
| `--timeout <seconds>`                            | ステップごとのタイムアウトです。デフォルトは `1800` です。                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | 確認プロンプト（ダウングレードの確認など）をスキップします。                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | 対話型プロンプトなしで、コミュニティ ClawHub の信頼性に関する警告を無視して更新後の Plugin 同期を続行できるようにします。これを指定せず、OpenClaw がプロンプトを表示できない場合、リスクのあるコミュニティリリースはスキップされ、変更されません。公式 ClawHub パッケージとバンドルされた Plugin ソースでは、このプロンプトは表示されません。                                                     |

`--verbose` フラグはありません。予定されている処理のプレビューには `--dry-run`、
機械可読な結果には `--json`、チャネル/可用性のみの確認には
`openclaw update status --json` を使用します。Gateway コンソールの詳細度（`--verbose`）と
ファイルログレベル（`logging.level: "debug"`/`"trace"`）は独立した設定です。
[Gateway のログ](/ja-JP/gateway/logging)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` の実行は無効です。代わりに、このインストールの Nix ソースまたは flake 入力を更新してください。nix-openclaw では、エージェント優先の[クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用してください。`openclaw update status` と `openclaw update --dry-run` は引き続き読み取り専用です。
</Note>

<Warning>
古いバージョンでは設定が破損する可能性があるため、ダウングレードには確認が必要です。
インストール済み環境ですでにセッションが SQLite に移行されている場合、古いファイルベースの
バージョンを起動する前に、アーカイブされた従来のトランスクリプトアーティファクトを復元してください。
[Doctor：セッションの SQLite 移行後のダウングレード](/ja-JP/cli/doctor#downgrading-after-session-sqlite-migration)を参照してください。
</Warning>

## `update status`

有効な更新チャネル、git タグ/ブランチ/SHA（ソースチェックアウトのみ）、
および更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| フラグ                  | デフォルト | 説明                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | 機械可読なステータス JSON を出力します。 |
| `--timeout <seconds>` | `3`     | チェックのタイムアウトです。                 |

extended-stable パッケージのインストールでは、ステータス確認時にフォアグラウンド更新と同じ公開セレクター
および正確なパッケージの検証を実行します。インストールされているバージョンの方が新しい場合は、
`ahead of extended-stable` を報告することがあります。JSON の失敗には
`registry.reason`（`selector_missing`、`selector_query_failed`、
`exact_package_mismatch`、または `unsupported_git_channel`）が含まれます。

## `update repair`

コアパッケージがすでに変更されたものの、その後の修復処理が正常に完了しなかった場合に、
更新の最終処理を再実行します。`openclaw update` が新しいコアパッケージをインストールしたものの、
コア更新後の Plugin 同期、管理対象 npm Plugin のメタデータ、レジストリの更新、または Doctor による修復が
収束しなかった場合にサポートされる復旧手段です。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| フラグ                                             | 説明                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 修復前にコアの更新チャネルを保持します。extended-stable では、単独/デフォルトまたは `latest` の指定に従う対象の公式 npm Plugin は、インストール済みのコアと正確に同じバージョンをターゲットにします。Git チェックアウトでは、設定を変更せずに extended-stable の修復が拒否されます。 |
| `--json`                                         | 機械可読な最終処理 JSON を出力します。                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | 修復ステップのタイムアウトです。デフォルトは `1800` です。                                                                                                                                                                                                                           |
| `--yes`                                          | 確認プロンプトをスキップします。                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | `openclaw update` と同じ動作です。                                                                                                                                                                                                                              |
| `--no-restart`                                   | 一貫性のため受け付けられますが、修復で Gateway が再起動されることはありません。                                                                                                                                                                                                             |

`update repair` は `openclaw doctor --fix` を実行し、修復された設定と
インストール記録を再読み込みし、有効な更新チャネルに対応する追跡対象 Plugin を同期し、
管理対象の npm Plugin インストールを更新し、設定済み Plugin の欠落したペイロードを修復し、
Plugin レジストリを更新して、収束したインストール記録メタデータを書き込みます。
新しいコアパッケージはインストールせず、Gateway も再起動しません。

## `update wizard`

更新チャネルを選択し、その後 Gateway を再起動するかどうかを確認する
対話型フローです（デフォルトでは再起動します）。git チェックアウトなしで
`dev` を選択すると、チェックアウトの作成を提案します。

| フラグ                  | デフォルト | 説明                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | 各更新ステップのタイムアウトです。 |

## 動作内容

チャネルを明示的に切り替えると（`--channel ...`）、インストール方法も
それに合わせて調整されます。

- `dev` -> git チェックアウトを確保し（デフォルトは `~/openclaw`、
  `OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`。`OPENCLAW_GIT_DIR` で上書き可能）、
  チェックアウトを更新し、そこからグローバル CLI をインストールします。
- `stable` -> `latest` を使用して npm からインストールします。
- `extended-stable` -> 公開 npm `extended-stable` セレクターを解決し、
  選択された正確なパッケージを検証して、その正確なバージョンをインストールします。
  別のセレクターにはフォールバックせず、Git チェックアウトでは拒否されます。
- `beta` -> npm dist-tag `beta` を優先し、beta が
  存在しない場合、または現在の安定版リリースより古い場合は `latest` にフォールバックします。

### 再起動の引き継ぎ

Gateway コアの自動更新機能（設定で有効になっている場合）は、稼働中の Gateway リクエストハンドラーの
外部で CLI 更新パスを起動します。コントロールプレーンの
`update.run` パッケージマネージャー更新と、監視対象の git チェックアウト更新では、
稼働中の Gateway プロセス内でパッケージツリーを置き換えたり `dist/` を
再ビルドしたりする代わりに、同じ管理サービスへの引き継ぎを使用します。Gateway は
デタッチされたヘルパーを起動して終了し、そのヘルパーが Gateway プロセスツリーの外部から
`openclaw update --yes --json` を実行します。引き継ぎを利用できない場合、
`update.run` は手動で実行するための安全なシェルコマンドを含む構造化レスポンスを返します。

保存された extended-stable の選択では、`update.checkOnStart` が有効な場合、起動時および24時間ごとに読み取り専用の更新ヒントを受け取ります。これらのチェックでは、更新の適用、ハンドオフの開始、Gateway の再起動、stable の遅延／ジッターの使用、beta のポーリング間隔の使用は一切行われません。明示的なフォアグラウンド更新、保存された `update.channel: "extended-stable"` を使用する引数なしのフォアグラウンド更新、オンデマンドのステータス確認、およびそれらの管理対象 Gateway ハンドオフは引き続きサポートされます。

ローカルの管理対象 Gateway サービスがインストールされ、再起動が有効な場合、パッケージマネージャーおよび git チェックアウトによる更新では、パッケージツリーの置換またはチェックアウト／ビルド出力の変更前に、実行中のサービスを停止します。その後、アップデーターはサービスのメタデータを更新し、サービスを再起動して、再起動後の Gateway を検証してから `Gateway: restarted and verified.` を報告します。
パッケージマネージャーによる更新では、再起動後の Gateway が想定されるパッケージバージョンを報告することも検証します。git チェックアウトによる更新では、再ビルド後の Gateway の正常性とサービスの準備完了状態を検証します。

パッケージマネージャーによる更新では通常、管理対象サービスに記録された Node バイナリを引き続き使用します。その Node で対象リリースを実行できないものの、現在の CLI の Node では実行でき、サービスが更新対象のパッケージに属することが確認されている場合、再起動が有効な更新では現在の Node を最終処理に使用し、サービスのメタデータをそのランタイムに書き換えます。`--no-restart` ではサービスのメタデータを修復できないため、同じランタイムの不一致がある場合、パッケージを変更する前に停止します。

macOS では、更新後のチェックで、アクティブなプロファイルの LaunchAgent が読み込まれて実行中であること、および設定されたループバックポートが正常であることも検証します。plist がインストールされているにもかかわらず launchd が監視していない場合、OpenClaw は LaunchAgent を自動的に再ブートストラップし、正常性／バージョン／チャンネルの準備完了チェックを再実行します（新規ブートストラップでは `RunAtLoad` ジョブを直接読み込むため、復旧処理が新たに起動した Gateway を直ちに `kickstart -k` することはありません）。それでも Gateway が正常にならない場合、コマンドはゼロ以外で終了し、再起動ログのパスに加えて、再起動、再インストール、パッケージのロールバック手順を出力します。

再起動を実行できない場合、コマンドは手動の `openclaw gateway restart` ヒントとともに `Gateway: restart skipped (...)` または `Gateway: restart failed: ...` を出力します。
`--no-restart` を使用すると、パッケージの置換または git の再ビルドは引き続き実行されますが、管理対象サービスは停止も再起動もされないため、手動で再起動するまで実行中の Gateway は古いコードを使用し続けます。

### コントロールプレーンのレスポンス形式

パッケージマネージャーによるインストールまたは監視対象の git チェックアウトで、`update.run` が Gateway のコントロールプレーンを通じて実行される場合、ハンドラーは、Gateway の終了後も続行される CLI 更新とは別にハンドオフの開始を報告します。

- `ok: true`、`result.status: "skipped"`、
  `result.reason: "managed-service-handoff-started"`、および
  `handoff.status: "started"`：Gateway は管理対象サービスのハンドオフを作成し、
  デタッチされたヘルパーが稼働中のサービスプロセス外で
  `openclaw update --yes --json` を実行できるよう、自身の再起動をスケジュールしました。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"`、および
  `handoff.status: "unavailable"`：OpenClaw は安全なハンドオフに必要な
  監視サービス境界と永続的なサービス ID を検出できませんでした
  （たとえば、systemd のハンドオフには、単に周囲の systemd プロセスマーカーではなく、
  `OPENCLAW_SYSTEMD_UNIT` ユニット ID が必要です）。レスポンスには、
  Gateway の外部から実行するシェルコマンドである
  `handoff.command` が含まれます。
- `ok: false`、`result.reason: "managed-service-handoff-failed"`：Gateway は
  ハンドオフの作成を試みましたが、デタッチされたヘルパーを起動できませんでした。

`sentinel` ペイロードは Gateway の終了前に書き込まれ、CLI のハンドオフは、管理対象サービスの再起動後の正常性チェックが完了すると、同じ再起動センチネルを更新します。ハンドオフ中、センチネルには成功時の継続処理なしで `stats.reason: "restart-health-pending"` が含まれる場合があります。再起動した Gateway はこれをポーリングし、CLI がサービスの正常性を検証し、最終的な `ok` の結果でセンチネルを書き換えた後にのみ継続処理を実行します。
`openclaw status` と `openclaw status --all` は、そのセンチネルが保留中または失敗している間、`Update restart` 行を表示します。`update.status` は更新を行い、最新のセンチネルを返します。

## Git チェックアウトのフロー

### チャンネルの選択

- `stable`：最新の beta 以外のタグをチェックアウトし、ビルドと doctor を実行します。
- `beta`：最新の `-beta` タグを優先し、beta が存在しないか古い場合は最新の stable タグにフォールバックします。
- `dev`：`main` をチェックアウトし、その後 fetch と rebase を実行します。
- `extended-stable`：Git チェックアウトではサポートされておらず、チェックアウトの変更は行われません。

### 更新手順

<Steps>
  <Step title="クリーンなワークツリーを検証">
    コミットされていない変更がないことが必要です。
  </Step>
  <Step title="チャンネルを切り替え">
    選択したチャンネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="upstream を取得">
    dev のみです。
  </Step>
  <Step title="事前ビルドチェック（dev のみ）">
    一時ワークツリーで TypeScript ビルドを実行します。先端のビルドが失敗した場合、最大10コミット遡って、ビルド可能な最新のコミットを探します。この事前チェック中に lint も実行するには `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザーの更新ホストは CI ランナーより小規模な場合が多いため、lint はリソースを制限した直列モードで実行されます。
  </Step>
  <Step title="リベース">
    選択したコミット上にリベースします（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトの場合、アップデーターは pnpm ワークスペース内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（最初に `corepack` を使用し、その後、一時的な `npm install pnpm@11` にフォールバックします）。pnpm のブートストラップが引き続き失敗する場合、アップデーターはチェックアウト内で `npm run build` を試行せず、パッケージマネージャー固有のエラーで早期に停止します。
  </Step>
  <Step title="Control UI をビルド">
    Gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    `openclaw doctor` を最終的な安全更新チェックとして実行します。
  </Step>
  <Step title="plugins を同期">
    plugins をアクティブなチャンネルに同期します。dev ではバンドルされた plugins を使用し、stable と beta では npm を使用します。追跡対象の plugin インストールを更新します。
  </Step>
</Steps>

### Plugin 同期の詳細

beta チャンネルでは、default/latest 系列に従う追跡対象の npm および ClawHub plugin インストールは、最初に plugin の `@beta` リリースを試行します。plugin に beta リリースがない場合、OpenClaw は記録済みの default/latest 指定にフォールバックし、警告を報告します。npm plugins では、beta パッケージが存在してもインストール検証に失敗した場合も OpenClaw はフォールバックします。これらのフォールバック警告によってコア更新が失敗することはありません。正確なバージョンと明示的なタグが書き換えられることはありません。

<Warning>
正確に固定された npm plugin の更新が、保存されたインストール記録と整合性の異なるアーティファクトに解決された場合、`openclaw update` はその plugin アーティファクトをインストールせずに更新を中止します。新しいアーティファクトを信頼できることを確認した後にのみ、plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
管理対象 plugin に限定され、同期パスで回避できる更新後の plugin 同期エラー（たとえば、必須ではない plugin に対して npm レジストリへ到達できない場合）は、コア更新の成功後に警告として報告されます。JSON の結果ではトップレベルの更新 `status: "ok"` が維持され、`openclaw update repair` および `openclaw plugins inspect <id> --runtime --json` のガイダンスとともに `postUpdate.plugins.status: "warning"` が報告されます。予期しないアップデーターまたは同期の例外が発生した場合は、引き続き更新結果が失敗になります。plugin のインストールまたは更新エラーを修正してから、`openclaw update repair` を再実行してください。更新失敗によって管理対象 plugin が使用不能になった場合、OpenClaw はオペレーターが作成した `plugins.allow` または `plugins.deny` のポリシーを変更せずに、そのランタイムエントリを無効化し、アクティブスロットをリセットします。

plugin ごとの同期手順後、Gateway が再起動する前に、`openclaw update` は必須の**コア更新後の収束**処理を実行します。この処理では、設定済みで欠落している plugin ペイロードを修復し、ディスク上の各_アクティブな_追跡対象インストール記録を検証し、その `package.json` が解析可能であること（および明示的に宣言された `main` が存在すること）を静的に検証します。この処理の失敗や無効な設定スナップショットは `postUpdate.plugins.status: "error"` を返し、トップレベルの更新 `status` を `"error"` に変更します。そのため、`openclaw update` はゼロ以外で終了し、未検証の plugin セットでは Gateway を再起動しません。エラーには、`openclaw update repair` と `openclaw plugins inspect <id> --runtime --json` を指す構造化された `postUpdate.plugins.warnings[].guidance` 行が含まれます。無効化された plugin エントリ、および信頼されたソースに関連付けられた公式の同期対象ではない記録は、ここではスキップされます（欠落ペイロードのチェックで使用される `skipDisabledPlugins` ポリシーと同様です）。そのため、無効化された古い plugin 記録によって、それ以外は有効な更新が阻止されることはありません。

更新後の Gateway が起動するとき、plugin の読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりすることはありません。パッケージマネージャーの `update.run` 再起動は CLI の管理対象サービスパスに引き渡されるため、パッケージの入れ替えは古い Gateway プロセスの外部で行われ、サービスの正常性チェックによって更新を完了として報告できるかどうかが決まります。
</Note>

extended-stable のコア更新が成功すると、コア更新後の plugin の整合性確認と収束処理では、対象となる公式 npm plugins に、インストール済みコアと完全に同じバージョンを適用します。default/`latest` の指定では、OpenClaw は plugin の `@extended-stable` を照会せず、npm の `latest` にフォールバックもしません。パッケージバージョンはインストール済みコアから導出します。明示的なバージョン固定、明示的な `latest` 以外のタグ、サードパーティ製パッケージ、npm 以外のソースでは、既存の指定が維持されます。

パッケージマネージャーによるインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前に対象パッケージのバージョンを解決します。npm のグローバルインストールでは、段階的インストールを使用します。OpenClaw は新しいパッケージを一時的な npm prefix にインストールし、候補パッケージが `preinstall` 中にホストの Node バージョンを検証できるようにして、そこでパッケージ化された `dist` インベントリを検証します。パッケージ化完了ガードは `preinstall` が成功するまでそのインベントリの外部に置かれるため、ライフサイクルスクリプトをスキップするパッケージマネージャーも有効化前に停止します。npm 12 以降では、アップデーターは候補の OpenClaw ライフサイクルのみを許可し、推移的依存関係のスクリプトは引き続きブロックされます。その後、OpenClaw はクリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。検証に失敗した場合、更新後の doctor、plugin の同期、再起動処理は、疑わしいツリーから実行されません。インストール済みバージョンがすでに対象と一致している場合でも、コマンドはグローバルパッケージのインストールを更新し、その後 plugin の同期、コアコマンドの補完情報の更新、再起動処理を実行します。これにより、パッケージ化されたサイドカーとチャンネルが所有する plugin 記録が、インストール済みの OpenClaw ビルドと整合した状態に保たれます。一方、plugin コマンドの補完情報の完全な再ビルドは、明示的な `openclaw completion --write-state` の実行時にのみ行われます。

## 関連項目

- `openclaw doctor`（git チェックアウトで最初に更新を実行するよう提案します）
- [開発チャンネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
