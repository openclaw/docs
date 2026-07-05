---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしています'
    - '`--update` の省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（安全寄りのソース更新 + gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-07-05T11:11:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c26f41b6931681dce351b82640535855e919888dc2cf6dea4bdb9937dcf139f8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を更新し、stable/extended-stable/beta/dev チャンネルを切り替えます。

**npm/pnpm/bun** でインストールした場合（グローバルインストールで、git メタデータなし）、
更新は [更新](/ja-JP/install/updating) で説明されているパッケージマネージャーのフローを通じて行われます。

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

| フラグ                                             | 説明                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | 更新が成功した後に Gateway サービスを再起動しません。再起動を行うパッケージマネージャー更新では、コマンドが成功する前に、再起動後のサービスが期待されるバージョンを報告していることを検証します。                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | 更新チャンネルを設定し、コア更新が成功した後も永続化します。Extended-stable はパッケージ専用です。                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | この更新に限り、パッケージターゲットを上書きします。検証済みの厳密なターゲットが必須である有効な `extended-stable` チャンネルとは組み合わせられません。他のパッケージインストールでは、`main` は `github:openclaw/openclaw#main` に対応します。GitHub/git ソース仕様は、ステージングされたグローバル npm インストールの前に一時 tarball にパックされます。 |
| `--dry-run`                                      | 設定の書き込み、インストール、プラグインの同期、再起動を行わずに、予定されている操作（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。                                                                                                                                                                                                                |
| `--json`                                         | 機械可読な `UpdateRunResult` JSON を出力します。管理対象プラグインの修復が必要な場合は `postUpdate.plugins.warnings`、beta チャンネルのプラグインフォールバック詳細、更新後同期中に npm プラグイン成果物のドリフトが検出された場合は `postUpdate.plugins.integrityDrifts` を含みます。                                                                 |
| `--timeout <seconds>`                            | ステップごとのタイムアウト。デフォルトは `1800` です。                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | 確認プロンプト（たとえばダウングレード確認）をスキップします。                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | 対話プロンプトなしで、コミュニティ ClawHub の信頼警告を越えて更新後プラグイン同期を続行できるようにします。これがない場合、OpenClaw がプロンプトを表示できないときは、リスクのあるコミュニティリリースはスキップされ、変更されません。公式 ClawHub パッケージとバンドル済みプラグインソースはこのプロンプトを迂回します。                                                     |

`--verbose` フラグはありません。予定されている操作のプレビューには `--dry-run`、
機械可読な結果には `--json`、チャンネル/利用可否のみには `openclaw update status --json`
を使用してください。Gateway コンソールの詳細度（`--verbose`）と
ファイルログレベル（`logging.level: "debug"`/`"trace"`）は独立した設定です。[Gateway ロギング](/ja-JP/gateway/logging)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` の実行は無効です。代わりに、このインストールの Nix ソースまたは flake 入力を更新してください。nix-openclaw では、エージェントファーストの [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用してください。`openclaw update status` と `openclaw update --dry-run` は読み取り専用のままです。
</Note>

<Warning>
古いバージョンは設定を壊す可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

有効な更新チャンネル、git タグ/ブランチ/SHA（ソースチェックアウトのみ）、
更新の利用可否を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| フラグ                  | デフォルト | 説明                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | 機械可読なステータス JSON を出力します。 |
| `--timeout <seconds>` | `3`     | チェックのタイムアウト。                 |

Extended-stable パッケージインストールでは、status はフォアグラウンド更新と同じ公開セレクターおよび厳密なパッケージ検証を実行します。インストール済みバージョンがより新しい場合、`ahead of extended-stable` を報告できます。JSON の失敗には `registry.reason`（`selector_missing`、`selector_query_failed`、`exact_package_mismatch`、または `unsupported_git_channel`）が含まれます。

## `update repair`

コアパッケージはすでに変更されたものの、その後の修復作業が正常に完了しなかった場合に、更新の最終処理を再実行します。これは、`openclaw update` が新しいコアパッケージをインストールしたものの、コア後のプラグイン同期、管理対象 npm プラグインメタデータ、レジストリ更新、または doctor 修復が収束しなかった場合にサポートされる復旧パスです。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| フラグ                                             | 説明                                                                                                                                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 修復の前にコア更新チャンネルを永続化します。Extended-stable では、プラグイン収束は一時的に stable/latest プラグインラインを対象にします。Extended-stable 修復は、Git チェックアウトでは設定を変更せずに拒否されます。 |
| `--json`                                         | 機械可読な最終処理 JSON を出力します。                                                                                                                                                                              |
| `--timeout <seconds>`                            | 修復ステップのタイムアウト。デフォルトは `1800` です。                                                                                                                                                                              |
| `--yes`                                          | 確認プロンプトをスキップします。                                                                                                                                                                                             |
| `--acknowledge-clawhub-risk`                     | `openclaw update` と同じ動作です。                                                                                                                                                                                 |
| `--no-restart`                                   | 対応のため受け付けます。repair は Gateway を再起動しません。                                                                                                                                                                |

`update repair` は `openclaw doctor --fix` を実行し、修復された設定とインストールレコードを再読み込みし、有効な更新チャンネルの追跡対象プラグインを同期し、管理対象 npm プラグインインストールを更新し、欠落している設定済みプラグインペイロードを修復し、プラグインレジストリを更新し、収束したインストールレコードメタデータを書き込みます。新しいコアパッケージはインストールせず、Gateway も再起動しません。

## `update wizard`

更新チャンネルを選択し、その後 Gateway を再起動するかどうかを確認する対話フローです（デフォルトは再起動）。git チェックアウトなしで `dev` を選択すると、作成する選択肢が提示されます。

| フラグ                  | デフォルト | 説明                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | 各更新ステップのタイムアウト。 |

## 実行内容

チャンネルを明示的に切り替える（`--channel ...`）と、インストール方法も整合した状態に保たれます。

- `dev` -> git チェックアウト（デフォルトは `~/openclaw`、または `OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`。`OPENCLAW_GIT_DIR` で上書き可能）を確保し、それを更新し、そのチェックアウトからグローバル CLI をインストールします。
- `stable` -> `latest` を使用して npm からインストールします。
- `extended-stable` -> 公開 npm `extended-stable` セレクターを解決し、選択された厳密なパッケージを検証して、その厳密なバージョンをインストールします。別のセレクターにはフォールバックせず、Git チェックアウトでは拒否されます。
- `beta` -> npm dist-tag `beta` を優先し、beta が存在しないか現在の stable リリースより古い場合は `latest` にフォールバックします。

### 再起動の引き継ぎ

Gateway コア自動更新機能（設定で有効な場合）は、稼働中の Gateway リクエストハンドラーの外側で CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー更新と、管理対象の git チェックアウト更新は、稼働中の Gateway プロセス内でパッケージツリーを置き換えたり `dist/` を再ビルドしたりする代わりに、同じ管理サービス引き継ぎを使用します。Gateway は切り離されたヘルパーを起動して終了し、そのヘルパーが Gateway プロセスツリーの外側から `openclaw update --yes --json` を実行します。引き継ぎを利用できない場合、`update.run` は手動で実行する安全なシェルコマンドを含む構造化レスポンスを返します。

Extended-stable は、起動時チェックとバックグラウンド自動更新スケジュールから意図的に除外されています。明示的なフォアグラウンド更新、保存済みの `update.channel: "extended-stable"` を使う素のフォアグラウンド更新、オンデマンド status、管理対象 Gateway 引き継ぎは引き続きサポートされます。

ローカルの管理対象 Gateway サービスがインストールされていて再起動が有効な場合、パッケージマネージャー更新と git チェックアウト更新は、パッケージツリーを置き換えたりチェックアウト/ビルド出力を変更したりする前に、実行中のサービスを停止します。その後、アップデーターはサービスメタデータを更新し、サービスを再起動し、再起動後の Gateway を検証してから `Gateway: restarted and verified.` を報告します。パッケージマネージャー更新では、再起動後の Gateway が期待されるパッケージバージョンを報告していることも検証します。git チェックアウト更新では、再ビルド後に Gateway のヘルスとサービス準備状態を検証します。

macOS では、更新後チェックによって、アクティブなプロファイルの LaunchAgent が
読み込み済み/実行中であり、設定済みの loopback ポートが正常であることも検証されます。
plist がインストール済みでも launchd がそれを監視していない場合、OpenClaw は
LaunchAgent を自動的に再ブートストラップし、健全性/バージョン/
チャネル準備状況チェックを再実行します（新規ブートストラップでは `RunAtLoad` ジョブを直接読み込むため、
復旧直後に新しく起動した Gateway を `kickstart -k` することはありません）。それでも
Gateway が正常にならない場合、コマンドは非ゼロで終了し、
再起動ログのパスに加えて、再起動、再インストール、パッケージのロールバック手順を出力します。

再起動を実行できない場合、コマンドは手動の `openclaw gateway restart` ヒントとともに
`Gateway: restart skipped (...)` または
`Gateway: restart failed: ...` を出力します。
`--no-restart` を指定すると、パッケージの置換または git の再ビルドは引き続き実行されますが、
管理対象サービスは停止または再起動されないため、実行中の Gateway は手動で再起動するまで
古いコードを使い続けます。

### コントロールプレーンのレスポンス形状

`update.run` がパッケージマネージャーによるインストールまたは監視対象の git チェックアウトで
Gateway コントロールプレーンを通じて実行される場合、ハンドラーは
Gateway の終了後に継続する CLI 更新とは別に、ハンドオフ開始を報告します。

- `ok: true`、`result.status: "skipped"`、
  `result.reason: "managed-service-handoff-started"`、および
  `handoff.status: "started"`: Gateway が管理対象サービスのハンドオフを作成し、
  自身の再起動をスケジュールしたため、分離されたヘルパーが
  稼働中サービスプロセスの外側で `openclaw update --yes --json` を実行できます。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"`、および
  `handoff.status: "unavailable"`: OpenClaw は、安全なハンドオフに必要な
  監視サービス境界と永続的なサービス ID を見つけられませんでした（たとえば、
  systemd ハンドオフでは、周囲の systemd プロセスマーカーだけではなく
  `OPENCLAW_SYSTEMD_UNIT` ユニット ID が必要です）。レスポンスには
  Gateway の外側から実行するシェルコマンドである `handoff.command` が含まれます。
- `ok: false`、`result.reason: "managed-service-handoff-failed"`: Gateway は
  ハンドオフの作成を試みましたが、分離されたヘルパーを起動できませんでした。

`sentinel` ペイロードは Gateway が終了する前に書き込まれ、CLI
ハンドオフは管理対象サービスの再起動健全性チェックが完了した後に
同じ再起動 sentinel を更新します。ハンドオフ中、sentinel は
成功継続なしで `stats.reason: "restart-health-pending"` を保持することがあります。
再起動後の Gateway はそれをポーリングし、CLI がサービス健全性を検証して
最終的な `ok` 結果で sentinel を書き換えた後にのみ継続処理を発火します。
`openclaw status` と `openclaw status --all` は、その sentinel が保留中または失敗している間、
`Update restart` 行を表示し、`update.status` は最新の sentinel を更新して返します。

## Git チェックアウトフロー

### チャネル選択

- `stable`: 最新の非ベータタグをチェックアウトし、その後ビルドと doctor を実行します。
- `beta`: 最新の `-beta` タグを優先し、ベータが存在しないか古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を実行します。
- `extended-stable`: Git チェックアウトではサポートされません。チェックアウトの変更は行われません。

### 更新手順

<Steps>
  <Step title="クリーンなワークツリーを検証">
    未コミットの変更がないことを要求します。
  </Step>
  <Step title="チャネルを切り替え">
    選択されたチャネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="upstream を fetch">
    Dev のみ。
  </Step>
  <Step title="事前ビルド（dev のみ）">
    一時ワークツリーで TypeScript ビルドを実行します。tip が失敗した場合、最新のビルド可能なコミットを見つけるために最大 10 コミットさかのぼります。この事前チェック中に lint も実行するには `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザーの更新ホストは CI runner より小さいことが多いため、lint は制約付きのシリアルモードで実行されます。
  </Step>
  <Step title="Rebase">
    選択されたコミットに rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、更新プログラムは pnpm ワークスペース内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（まず `corepack` を使い、その後一時的な `npm install pnpm@11` フォールバックを使います）。pnpm のブートストラップがなお失敗する場合、更新プログラムはチェックアウト内で `npm run build` を試す代わりに、パッケージマネージャー固有のエラーで早期停止します。
  </Step>
  <Step title="Control UI をビルド">
    gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    `openclaw doctor` が最終的な安全更新チェックとして実行されます。
  </Step>
  <Step title="Plugin を同期">
    Plugin をアクティブなチャネルに同期します。Dev はバンドル済み Plugin を使用し、stable と beta は npm を使用します。追跡対象の Plugin インストールを更新します。
  </Step>
</Steps>

### Plugin 同期の詳細

beta チャネルでは、default/latest ラインに従う追跡対象の npm および ClawHub Plugin インストールは、
まず Plugin の `@beta` リリースを試します。Plugin に beta リリースがない場合、
OpenClaw は記録済みの default/latest spec にフォールバックし、警告を報告します。
npm Plugin については、beta パッケージが存在してもインストール検証に失敗した場合にも
OpenClaw はフォールバックします。これらのフォールバック警告によって
core 更新が失敗することはありません。正確なバージョンと明示的なタグは書き換えられません。

<Warning>
正確に固定された npm Plugin 更新が、保存済みインストールレコードと整合性の異なるアーティファクトに解決される場合、`openclaw update` はそれをインストールする代わりに、その Plugin アーティファクト更新を中止します。新しいアーティファクトを信頼できることを検証した後にのみ、Plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
管理対象 Plugin に限定され、同期パスが回避できる更新後 Plugin 同期の失敗（たとえば、必須ではない Plugin の npm registry に到達できない場合）は、core 更新の成功後に警告として報告されます。JSON 結果ではトップレベルの更新 `status: "ok"` が維持され、`openclaw update repair` と `openclaw plugins inspect <id> --runtime --json` のガイダンスとともに `postUpdate.plugins.status: "warning"` が報告されます。予期しない更新プログラムまたは同期の例外は、引き続き更新結果を失敗させます。Plugin のインストールまたは更新エラーを修正してから、`openclaw update repair` を再実行してください。

Plugin ごとの同期手順の後、`openclaw update` は gateway を再起動する前に、必須の **post-core convergence** パスを実行します。これは、欠落している設定済み Plugin ペイロードを修復し、ディスク上の各 _active_ 追跡対象インストールレコードを検証し、その `package.json` が解析可能であること（および明示的に宣言された `main` が存在すること）を静的に検証します。このパスでの失敗、および無効な config スナップショットは、`postUpdate.plugins.status: "error"` を返し、トップレベルの更新 `status` を `"error"` に切り替えるため、`openclaw update` は非ゼロで終了し、gateway は未検証の Plugin セットでは再起動されません。エラーには、`openclaw update repair` と `openclaw plugins inspect <id> --runtime --json` を指す、構造化された `postUpdate.plugins.warnings[].guidance` 行が含まれます。無効化された Plugin エントリ、および trusted-source-linked official sync targets ではないレコードはここではスキップされます（欠落ペイロードチェックで使用される `skipDisabledPlugins` ポリシーを反映しています）。そのため、古い無効化 Plugin レコードが、それ以外は有効な更新をブロックすることはありません。

更新後の Gateway が起動すると、Plugin 読み込みは verify-only です。startup はパッケージマネージャーを実行したり、依存関係ツリーを変更したりしません。パッケージマネージャーの `update.run` 再起動は CLI の管理対象サービスパスに渡されるため、パッケージ交換は古い Gateway プロセスの外側で行われ、サービス健全性チェックによって更新を完了として報告できるかどうかが決定されます。
</Note>

extended-stable core 更新が成功した後も、post-core Plugin の整合性と
convergence は実行されますが、official Plugin は一時的に
stable/latest ラインを対象にします。OpenClaw はこのリリースで
Plugin `@extended-stable` selector を照会しません。

パッケージマネージャーによるインストールでは、`openclaw update` はパッケージマネージャーを
呼び出す前に対象パッケージバージョンを解決します。npm global インストールでは staged
install を使用します。OpenClaw は新しいパッケージを一時的な npm prefix にインストールし、
そこでパッケージ化された `dist` inventory を検証してから、そのクリーンな package
tree を実際の global prefix に入れ替えます。検証が失敗した場合、更新後の doctor、
Plugin 同期、再起動処理は疑わしい tree からは実行されません。インストール済みバージョンが
すでに対象と一致している場合でも、コマンドは global package install を更新し、その後
Plugin 同期、core-command completion の更新、再起動処理を実行します。これにより、
完全な plugin-command completion の再ビルドは明示的な
`openclaw completion --write-state` 実行に任せつつ、パッケージ化された sidecar と
チャネル所有の Plugin レコードを、インストール済み OpenClaw ビルドと揃えた状態に保ちます。

## 関連

- `openclaw doctor`（git チェックアウトでは先に update の実行を提案します）
- [Development channels](/ja-JP/install/development-channels)
- [Updating](/ja-JP/install/updating)
- [CLI reference](/ja-JP/cli)
