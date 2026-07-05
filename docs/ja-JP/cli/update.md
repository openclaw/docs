---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしている'
    - '`--update` の省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway 自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-07-05T01:55:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe972cf9effb9df8846ab9b3da662350dcc965ff2e58a8d5dabf1fd42be88b4
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/extended-stable/beta/dev チャネルを切り替えます。

**npm/pnpm/bun** 経由でインストールした場合（グローバルインストールで、git メタデータなし）、更新は [更新](/ja-JP/install/updating) のパッケージマネージャーフローで行われます。

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

## オプション

- `--no-restart`: 更新が成功した後、Gateway サービスの再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動後のサービスが想定される更新済みバージョンを報告することを検証します。
- `--channel <stable|extended-stable|beta|dev>`: 更新チャネルを設定し、コア更新が成功した後に永続化します。Extended-stable はパッケージ専用です。
- `--tag <dist-tag|version|spec>`: この更新に限り、パッケージターゲットを上書きします。有効な `extended-stable` チャネルとは組み合わせられません。このチャネルでは、検証済みの厳密なターゲットが必須です。他のパッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマップされます。GitHub/git ソース spec は、ステージングされたグローバル npm インストールの前に一時 tarball にパックされます。
- `--dry-run`: config の書き込み、インストール、Plugin の同期、再起動を行わずに、予定される更新アクション（チャネル/tag/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読の `UpdateRunResult` JSON を出力します。コア更新が成功した後に破損または読み込み不能な管理対象 Plugin の修復が必要な場合の `postUpdate.plugins.warnings`、Plugin に beta リリースがない場合の beta チャネル Plugin フォールバック詳細、更新後の Plugin 同期中に npm Plugin アーティファクトのドリフトが検出された場合の `postUpdate.plugins.integrityDrifts` を含みます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800s）。
- `--yes`: 確認プロンプトをスキップします（例: ダウングレード確認）。
- `--acknowledge-clawhub-risk`: コミュニティ ClawHub の信頼警告を確認した後、対話型プロンプトなしで更新後の Plugin 同期の継続を許可します。これがない場合、OpenClaw がプロンプトを表示できないときは、リスクのあるコミュニティ ClawHub Plugin リリースはスキップされ、変更されません。公式 ClawHub パッケージとバンドルされた OpenClaw Plugin ソースは、このリリース信頼プロンプトをバイパスします。

`openclaw update` には `--verbose` フラグはありません。予定されるチャネル/tag/インストール/再起動アクションをプレビューするには `--dry-run`、機械可読の結果には `--json`、チャネルと利用可能性の詳細だけが必要な場合は `openclaw update status --json` を使用してください。更新前後の Gateway ログをデバッグしている場合、コンソールの詳細度とファイルログレベルは別です。Gateway `--verbose` はターミナル/WebSocket 出力に影響し、ファイルログには config の `logging.level: "debug"` または `"trace"` が必要です。[Gateway ログ](/ja-JP/gateway/logging) を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` の実行は無効です。代わりに、このインストールの Nix ソースまたは flake 入力を更新してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用します。`openclaw update status` と `openclaw update --dry-run` は読み取り専用のままです。
</Note>

<Warning>
古いバージョンでは構成が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

アクティブな更新チャネル + git tag/branch/SHA（ソース checkout の場合）と、更新の利用可能性を表示します。

extended-stable パッケージインストールでは、status はフォアグラウンド更新と同じ公開セレクターと厳密パッケージ検証を実行します。インストール済みバージョンが新しい場合は `ahead of extended-stable` を報告できます。JSON の失敗には `registry.reason`（`selector_missing`、`selector_query_failed`、`exact_package_mismatch`、または `unsupported_git_channel`）が含まれます。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読の status JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3s）。

## `update repair`

コアパッケージはすでに変更されたものの、その後の修復作業が正常に完了しなかった場合に、更新の最終処理を再実行します。これは、`openclaw update` が新しいコアパッケージをインストールしたが、コア後の Plugin 同期、管理対象 npm Plugin メタデータ、registry refresh、または doctor repair がまだ収束する必要がある場合にサポートされる復旧パスです。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

オプション:

- `--channel <stable|extended-stable|beta|dev>`: 修復前にコア更新チャネルを永続化します。extended-stable では、Plugin の収束は一時的に stable/latest Plugin ラインをターゲットにします。Git checkout では、extended-stable repair は config を変更せずに拒否されます。
- `--json`: 機械可読の最終処理 JSON を出力します。
- `--timeout <seconds>`: 修復ステップのタイムアウト（デフォルト `1800`）。
- `--yes`: 確認プロンプトをスキップします。
- `--acknowledge-clawhub-risk`: コミュニティ ClawHub の信頼警告を確認した後、対話型プロンプトなしで修復時の Plugin 収束の継続を許可します。公式 ClawHub パッケージとバンドルされた OpenClaw Plugin ソースは、このリリース信頼プロンプトをバイパスします。
- `--no-restart`: update コマンドとの対称性のために受け付けられます。repair は Gateway を再起動しません。

`openclaw update repair` は `openclaw doctor --fix` を実行し、修復された config とインストールレコードを再読み込みし、アクティブな更新チャネル向けに追跡対象 Plugin を同期し、管理対象 npm Plugin インストールを更新し、欠落している構成済み Plugin payload を修復し、Plugin registry を更新し、収束したインストールレコードメタデータを書き込みます。新しいコアパッケージはインストールせず、Gateway も再起動しません。

## `update wizard`

更新チャネルを選択し、更新後に Gateway を再起動するかどうかを確認する対話型フローです（デフォルトは再起動）。git checkout なしで `dev` を選択すると、作成を提案します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 実行内容

チャネルを明示的に切り替えると（`--channel ...`）、OpenClaw はインストール方法も整合させます。

- `dev` → git checkout を確保し（デフォルト: `~/openclaw`、または `OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`。`OPENCLAW_GIT_DIR` で上書き可能）、それを更新し、その checkout からグローバル CLI をインストールします。
- `stable` → `latest` を使用して npm からインストールします。
- `extended-stable` → 公開 npm `extended-stable` セレクターを解決し、選択された厳密なパッケージを検証して、その厳密なバージョンをインストールします。別のセレクターにはフォールバックせず、Git checkout では拒否されます。
- `beta` → npm dist-tag `beta` を優先しますが、beta が存在しない、または現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway コア自動更新機能（config で有効な場合）は、稼働中の Gateway リクエストハンドラーの外で CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー更新と、管理下の git-checkout 更新も、稼働中の Gateway プロセス内でパッケージツリーを置き換えたり `dist/` を再ビルドしたりする代わりに、管理対象サービスへのハンドオフを使用します。Gateway は切り離された helper を起動して終了し、その helper が Gateway プロセスツリーの外から通常の `openclaw update --yes --json` CLI パスを実行します。そのハンドオフを利用できない場合、`update.run` は手動で実行する安全な shell コマンドを含む構造化レスポンスを返します。

extended-stable は、起動時チェックとバックグラウンド自動更新スケジュールから意図的に除外されています。明示的なフォアグラウンド更新、保存済みの `update.channel: "extended-stable"` を使う bare フォアグラウンド更新、オンデマンド status、管理対象 Gateway ハンドオフは引き続きサポートされます。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージバージョンを解決します。npm グローバルインストールでは、ステージングされたインストールを使用します。OpenClaw は新しいパッケージを一時 npm prefix にインストールし、そこでパッケージ化された `dist` inventory を検証してから、そのクリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。検証に失敗した場合、更新後の doctor、Plugin 同期、再起動作業は疑わしいツリーからは実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、その後 Plugin 同期、コアコマンド補完 refresh、再起動作業を実行します。これにより、パッケージ化された sidecar とチャネル所有の Plugin レコードを、インストール済み OpenClaw build と整合させます。一方で、完全な Plugin コマンド補完の再ビルドは、明示的な `openclaw completion --write-state` 実行に委ねます。

extended-stable コア更新が成功した後も、コア後の Plugin integrity と収束は実行されますが、公式 Plugin は一時的に stable/latest ラインをターゲットにします。このリリースでは、OpenClaw は Plugin `@extended-stable` セレクターを問い合わせません。

ローカルの管理対象 Gateway サービスがインストールされていて再起動が有効な場合、パッケージマネージャー更新と git-checkout 更新は、パッケージツリーの置き換えや checkout/build 出力の変更前に、実行中のサービスを停止します。その後 updater は更新済みインストールからサービスメタデータを更新し、サービスを再起動して、再起動後の Gateway を検証してから `Gateway: restarted and verified.` を報告します。パッケージマネージャー更新ではさらに、再起動後の Gateway が想定されるパッケージバージョンを報告することを検証します。git-checkout 更新では、再ビルド後に gateway health とサービス readiness を検証します。macOS では、更新後チェックは、アクティブな profile に対して LaunchAgent が読み込まれて実行中であること、および構成済み loopback port が healthy であることも検証します。plist がインストールされているが launchd がそれを監視していない場合、OpenClaw は LaunchAgent を自動的に再 bootstrap し、その後 health/version/channel readiness チェックを再実行します。新しい bootstrap は RunAtLoad job を直接読み込むため、更新復旧では新しく生成された Gateway に対して即座に `kickstart -k` は実行しません。それでも Gateway が healthy にならない場合、コマンドは非ゼロで終了し、restart log path と、明示的な再起動、再インストール、パッケージ rollback の手順を出力します。再起動を実行できない場合、コマンドは `Gateway: restart skipped (...)` または `Gateway: restart failed: ...` と、手動の `openclaw gateway restart` ヒントを出力します。`--no-restart` を指定すると、パッケージ置き換えまたは git rebuild は引き続き実行されますが、管理対象サービスは停止または再起動されないため、手動で再起動するまで、実行中の Gateway は古いコードを保持する可能性があります。

### コントロールプレーンのレスポンス形状

パッケージマネージャーインストールまたは管理下の git checkout で、Gateway コントロールプレーン経由で `update.run` が呼び出されると、handler は Gateway の終了後に継続する CLI 更新とは別に、ハンドオフ開始を報告します。

- `ok: true`、`result.status: "skipped"`、`result.reason: "managed-service-handoff-started"`、および `handoff.status: "started"` は、Gateway が管理対象サービスへのハンドオフを作成し、切り離された helper が稼働中のサービスプロセスの外で `openclaw update --yes --json` を実行できるよう、自身の再起動をスケジュールしたことを意味します。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"`、および `handoff.status: "unavailable"` は、安全なハンドオフに必要な監視サービス境界と永続的なサービス identity を OpenClaw が見つけられなかったことを意味します。たとえば、systemd ハンドオフには OpenClaw unit identity（`OPENCLAW_SYSTEMD_UNIT`）が必要であり、周囲の systemd process marker だけでは不十分です。レスポンスには、Gateway の外から実行する shell コマンドである `handoff.command` が含まれます。
- `ok: false`、`result.reason: "managed-service-handoff-failed"` は、Gateway がハンドオフを作成しようとしたものの、切り離された helper を spawn できなかったことを意味します。

`sentinel` ペイロードは Gateway が終了する前に引き続き書き込まれ、CLI
ハンドオフはマネージドサービス再起動のヘルスチェック完了後に、同じ再起動センチネルを更新します。ハンドオフ中、センチネルは
`stats.reason: "restart-health-pending"` を成功時の継続処理なしで保持できます。再起動後の Gateway はそれをポーリングし続け、CLI がサービスの健全性を確認し、最終的な `ok`
結果でセンチネルを書き換えた後にのみ継続処理を発火します。`openclaw status` と `openclaw status --all` は、そのセンチネルが保留中または失敗状態の間、`Update restart`
行を表示し、`update.status` は最新のセンチネルを更新して返します。

## Git チェックアウトフロー

### チャネル選択

- `stable`: 最新の非ベータタグをチェックアウトし、その後ビルドと doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、ベータが存在しないか古い場合は最新の安定版タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を実行します。
- `extended-stable`: Git チェックアウトではサポートされていません。チェックアウトの変更は行われません。

### 更新手順

<Steps>
  <Step title="クリーンなワークツリーを確認">
    未コミットの変更がないことが必要です。
  </Step>
  <Step title="チャネルを切り替え">
    選択されたチャネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="上流を取得">
    dev のみ。
  </Step>
  <Step title="事前ビルド（dev のみ）">
    一時ワークツリーで TypeScript ビルドを実行します。先端が失敗した場合、最大 10 コミットさかのぼって、ビルド可能な最新コミットを探します。この事前チェック中に lint も実行するには `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザーの更新ホストは CI ランナーより小さいことが多いため、lint は制約付きのシリアルモードで実行されます。
  </Step>
  <Step title="Rebase">
    選択されたコミット上に rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、アップデーターは pnpm ワークスペース内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（まず `corepack`、その後一時的な `npm install pnpm@11` フォールバック）。
  </Step>
  <Step title="Control UI をビルド">
    gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    `openclaw doctor` は最後の安全な更新チェックとして実行されます。
  </Step>
  <Step title="Plugin を同期">
    Plugin をアクティブなチャネルに同期します。dev はバンドル Plugin を使用し、stable と beta は npm を使用します。追跡対象の Plugin インストールを更新します。
  </Step>
</Steps>

ベータ更新チャネルでは、デフォルト/最新ラインに従う追跡対象の npm および ClawHub Plugin インストールは、まず Plugin の `@beta` リリースを試します。Plugin にベータリリースがない場合、OpenClaw は記録済みのデフォルト/最新仕様にフォールバックし、それを警告として報告します。npm Plugin では、ベータパッケージが存在してもインストール検証に失敗した場合にも OpenClaw はフォールバックします。これらの Plugin フォールバック警告によってコア更新が失敗することはありません。正確なバージョンと明示的なタグは書き換えられません。

<Warning>
正確に固定された npm Plugin 更新が、保存済みインストールレコードと integrity が異なるアーティファクトに解決される場合、`openclaw update` はそれをインストールする代わりに、その Plugin アーティファクト更新を中止します。新しいアーティファクトを信頼できることを確認した後でのみ、Plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
マネージド Plugin にスコープされ、同期パスが迂回できる更新後の Plugin 同期失敗（例: 必須ではない Plugin の npm レジストリに到達できない場合）は、コア更新の成功後に警告として報告されます。JSON 結果はトップレベルの更新 `status: "ok"` を維持し、`openclaw update repair` と `openclaw plugins inspect <id> --runtime --json` のガイダンスとともに `postUpdate.plugins.status: "warning"` を報告します。予期しないアップデーターまたは同期の例外は、引き続き更新結果を失敗にします。Plugin のインストールまたは更新エラーを修正し、その後 `openclaw update repair` を再実行してください。

Plugin ごとの同期手順の後、`openclaw update` は gateway を再起動する前に、必須の **post-core convergence** パスを実行します。構成済み Plugin ペイロードの欠落を修復し、ディスク上の各 _アクティブな_ 追跡対象インストールレコードを検証し、その `package.json` が解析可能であること（および明示的に宣言された `main` が存在すること）を静的に確認します。このパスの失敗、および無効な OpenClaw 構成スナップショットは、`postUpdate.plugins.status: "error"` を返し、トップレベルの更新 `status` を `"error"` に反転させます。そのため `openclaw update` は非ゼロで終了し、未検証の Plugin セットで gateway が再起動されることはありません。エラーには、フォローアップ用に `openclaw update repair` と `openclaw plugins inspect <id> --runtime --json` を指す構造化された `postUpdate.plugins.warnings[].guidance` 行が含まれます。無効化された Plugin エントリと、信頼されたソースにリンクされた公式同期ターゲットではないレコードはここではスキップされます。これは欠落ペイロードチェックで使用される `skipDisabledPlugins` ポリシーを反映しているため、古い無効化 Plugin レコードが、それ以外は有効な更新をブロックすることはありません。

更新後の Gateway が起動するとき、Plugin の読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりしません。パッケージマネージャーの `update.run`
再起動は CLI のマネージドサービスパスに渡されるため、パッケージの入れ替えは古い Gateway プロセスの外で行われ、サービスヘルスチェックが更新を完了として報告できるかどうかを決定します。

pnpm のブートストラップがそれでも失敗する場合、アップデーターはチェックアウト内で `npm run build` を試す代わりに、パッケージマネージャー固有のエラーで早期停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（Git チェックアウトでは先に更新を実行することを提案します）
- [開発チャネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
