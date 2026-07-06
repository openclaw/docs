---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしています'
    - '`--update` の短縮表記の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-07-06T10:49:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6abbb32f8b8132abb73dc1699d341a275e54613f18523bce4cba574d75232c2
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を更新し、stable/extended-stable/beta/dev チャネルを切り替えます。

**npm/pnpm/bun** でインストールした場合（グローバルインストールで、git メタデータなし）、
更新は [更新](/ja-JP/install/updating) で説明しているパッケージマネージャーのフローを通じて行われます。

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
| `--no-restart`                                   | 更新が成功した後に Gateway サービスを再起動しません。再起動を行うパッケージマネージャー更新では、コマンドが成功する前に、再起動後のサービスが期待されるバージョンを報告することを検証します。                                                                                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | 更新チャネルを設定し、コア更新の成功後も保持します。Extended-stable はパッケージ専用です。                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | この更新だけでパッケージターゲットを上書きします。有効な `extended-stable` チャネルとは組み合わせられません。このチャネルでは、検証済みの正確なターゲットが必須です。その他のパッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマップされます。GitHub/git ソース仕様は、ステージングされたグローバル npm インストールの前に一時 tarball にパックされます。 |
| `--dry-run`                                      | config の書き込み、インストール、Plugin の同期、再起動を行わずに、予定されているアクション（チャネル/タグ/ターゲット/再起動フロー）をプレビューします。                                                                                                                                                                                                                |
| `--json`                                         | 機械可読の `UpdateRunResult` JSON を出力します。管理対象Pluginに修復が必要な場合は `postUpdate.plugins.warnings`、beta チャネルのPluginフォールバック詳細、更新後同期中に npm Plugin アーティファクトのドリフトが検出された場合は `postUpdate.plugins.integrityDrifts` を含みます。                                                                 |
| `--timeout <seconds>`                            | ステップごとのタイムアウト。デフォルトは `1800` です。                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | 確認プロンプトをスキップします（例: ダウングレード確認）。                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | 対話プロンプトなしで、コミュニティ ClawHub の信頼警告を越えて更新後のPlugin同期を続行できるようにします。指定しない場合、OpenClaw がプロンプトを表示できないときは、リスクのあるコミュニティリリースはスキップされ、変更されません。公式 ClawHub パッケージとバンドルPluginソースは、このプロンプトをバイパスします。                                                     |

`--verbose` フラグはありません。予定されているアクションのプレビューには `--dry-run`、
機械可読の結果には `--json`、チャネル/可用性だけには
`openclaw update status --json` を使用してください。Gateway コンソールの詳細度（`--verbose`）と
ファイルログレベル（`logging.level: "debug"`/`"trace"`）は独立した設定です。[Gateway ログ](/ja-JP/gateway/logging) を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` の実行は無効です。代わりに、このインストールの Nix ソースまたは flake 入力を更新してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用してください。`openclaw update status` と `openclaw update --dry-run` は読み取り専用のままです。
</Note>

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

アクティブな更新チャネル、git タグ/ブランチ/SHA（ソースチェックアウトのみ）、
および更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| フラグ                  | デフォルト | 説明                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | 機械可読のステータス JSON を出力します。 |
| `--timeout <seconds>` | `3`     | チェックのタイムアウト。                 |

extended-stable パッケージインストールでは、status はフォアグラウンド更新と同じ公開セレクターと正確なパッケージ検証を実行します。インストール済みバージョンがより新しい場合は
`ahead of extended-stable` を報告できます。JSON の失敗には
`registry.reason`（`selector_missing`、`selector_query_failed`、
`exact_package_mismatch`、または `unsupported_git_channel`）が含まれます。

## `update repair`

コアパッケージはすでに変更されたものの、その後の修復作業が正常に完了しなかった場合に、更新の最終処理を再実行します。これは、`openclaw update` が新しいコアパッケージをインストールした後、コア後のPlugin同期、管理対象 npm Plugin メタデータ、レジストリ更新、または doctor 修復が収束しなかった場合にサポートされる復旧パスです。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| フラグ                                             | 説明                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | 修復前にコア更新チャネルを保持します。extended-stable では、bare/default または `latest` インテントに従う対象の公式 npm Plugin は、正確なインストール済みコアバージョンをターゲットにします。extended-stable の修復は、config を変更せずに Git チェックアウト上では拒否されます。 |
| `--json`                                         | 機械可読の最終処理 JSON を出力します。                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | 修復ステップのタイムアウト。デフォルトは `1800` です。                                                                                                                                                                                                                           |
| `--yes`                                          | 確認プロンプトをスキップします。                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | `openclaw update` と同じ動作です。                                                                                                                                                                                                                              |
| `--no-restart`                                   | 対称性のために受け付けられます。repair は Gateway を再起動しません。                                                                                                                                                                                                             |

`update repair` は `openclaw doctor --fix` を実行し、修復された config と
インストールレコードを再読み込みし、アクティブな更新チャネルの追跡対象Pluginを同期し、
管理対象 npm Plugin インストールを更新し、欠落している設定済みPluginペイロードを修復し、
Plugin レジストリを更新し、収束したインストールレコードメタデータを書き込みます。
新しいコアパッケージはインストールせず、Gateway も再起動しません。

## `update wizard`

更新チャネルを選択し、その後 Gateway を再起動するか確認する対話フローです（デフォルトは再起動）。git チェックアウトなしで `dev` を選択すると、作成が提案されます。

| フラグ                  | デフォルト | 説明                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | 各更新ステップのタイムアウト。 |

## 実行内容

チャネルを明示的に切り替える（`--channel ...`）と、インストール方法も整合した状態に保たれます。

- `dev` -> git チェックアウトを確保し（デフォルトは `~/openclaw`、または
  `OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`。`OPENCLAW_GIT_DIR` で上書き可能）、
  それを更新し、そのチェックアウトからグローバル CLI をインストールします。
- `stable` -> `latest` を使用して npm からインストールします。
- `extended-stable` -> 公開 npm `extended-stable` セレクターを解決し、
  正確に選択されたパッケージを検証して、その正確なバージョンをインストールします。
  別のセレクターにはフォールバックせず、Git チェックアウトでは拒否されます。
- `beta` -> npm dist-tag `beta` を優先し、beta が存在しないか現在の stable リリースより古い場合は `latest` にフォールバックします。

### 再起動ハンドオフ

Gateway コアの自動更新機能（config で有効な場合）は、稼働中の Gateway リクエストハンドラーの外で CLI 更新パスを起動します。コントロールプレーンの
`update.run` パッケージマネージャー更新と、監視対象の git チェックアウト更新は、
稼働中の Gateway プロセス内でパッケージツリーを置き換えたり
`dist/` を再ビルドしたりする代わりに、同じ管理サービスのハンドオフを使用します。Gateway はデタッチされたヘルパーを開始して終了し、そのヘルパーが Gateway プロセスツリーの外から `openclaw update --yes --json` を実行します。ハンドオフを利用できない場合、
`update.run` は手動で実行する安全なシェルコマンドを含む構造化レスポンスを返します。

extended-stable は、起動時チェックとバックグラウンド自動更新スケジュールから意図的に除外されています。明示的なフォアグラウンド更新、保存済みの `update.channel: "extended-stable"` を使用する bare フォアグラウンド更新、オンデマンド status、管理対象
Gateway ハンドオフは引き続きサポートされます。

ローカルの管理対象 Gateway サービスがインストールされ、再起動が有効な場合、
パッケージマネージャー更新および Git チェックアウト更新は、パッケージツリーの置換やチェックアウト/ビルド出力の変更前に、実行中のサービスを停止します。更新処理は
その後、サービスメタデータを更新し、サービスを再起動して、再起動した
Gateway を検証してから `Gateway: restarted and verified.` を報告します。
パッケージマネージャー更新ではさらに、再起動した Gateway が期待される
パッケージバージョンを報告していることを検証します。Git チェックアウト更新では、再ビルド後に Gateway の正常性とサービス準備状態を検証します。

macOS では、更新後チェックで、アクティブなプロファイルの LaunchAgent が
読み込まれて実行中であること、および設定済みのループバックポートが
正常であることも検証します。plist がインストールされているものの launchd がそれを監督していない場合、OpenClaw は
LaunchAgent を自動的に再ブートストラップし、正常性/バージョン/
チャンネル準備状態チェックを再実行します（新規ブートストラップは `RunAtLoad` ジョブを直接読み込むため、
リカバリは新しく起動した Gateway に対して即座に `kickstart -k` しません）。Gateway が
それでも正常にならない場合、コマンドは非ゼロで終了し、
再起動ログパスに加えて、再起動、再インストール、パッケージロールバックの
手順を出力します。

再起動を実行できない場合、コマンドは `Gateway: restart skipped (...)` または
`Gateway: restart failed: ...` を、手動の `openclaw gateway restart` ヒントとともに出力します。
`--no-restart` を指定すると、パッケージ置換または Git 再ビルドは引き続き実行されますが、
管理対象サービスは停止または再起動されないため、手動で再起動するまで実行中の Gateway は古い
コードを使い続けます。

### コントロールプレーン応答形状

`update.run` がパッケージマネージャーインストールまたは監督下の Git チェックアウトで
Gateway コントロールプレーンを通じて実行される場合、ハンドラーはハンドオフ開始を、
Gateway 終了後に継続する CLI 更新とは別に報告します。

- `ok: true`、`result.status: "skipped"`、
  `result.reason: "managed-service-handoff-started"`、および
  `handoff.status: "started"`: Gateway が管理対象サービスのハンドオフを作成し、
  自身の再起動をスケジュールしたため、切り離されたヘルパーが
  稼働中のサービスプロセス外で `openclaw update --yes --json` を実行できます。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"`、および
  `handoff.status: "unavailable"`: OpenClaw は安全なハンドオフに必要な、
  監督サービス境界と永続的なサービス ID を見つけられませんでした（たとえば、
  systemd ハンドオフには `OPENCLAW_SYSTEMD_UNIT` ユニット ID が必要であり、
  周囲の systemd プロセスマーカーだけでは不十分です）。応答には、
  Gateway の外部から実行するシェルコマンドである `handoff.command` が含まれます。
- `ok: false`、`result.reason: "managed-service-handoff-failed"`: Gateway は
  ハンドオフの作成を試みましたが、切り離されたヘルパーを起動できませんでした。

`sentinel` ペイロードは Gateway が終了する前に書き込まれ、CLI
ハンドオフは管理対象サービス再起動の正常性チェック完了後に同じ再起動センチネルを更新します。
ハンドオフ中、センチネルは成功継続なしで
`stats.reason: "restart-health-pending"` を保持できます。
再起動した Gateway はそれをポーリングし、CLI がサービス正常性を検証して最終的な `ok` 結果でセンチネルを書き換えた後にのみ
継続を発火します。
`openclaw status` と `openclaw status --all` は、そのセンチネルが保留中または失敗している間、
`Update restart` 行を表示し、`update.status` は最新のセンチネルを更新して返します。

## Git チェックアウトフロー

### チャンネル選択

- `stable`: 最新の非ベータタグをチェックアウトし、その後ビルドと doctor を実行します。
- `beta`: 最新の `-beta` タグを優先し、ベータが存在しないか古い場合は最新の stable タグに
  フォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を実行します。
- `extended-stable`: Git チェックアウトではサポートされません。チェックアウトの変更は
  行われません。

### 更新手順

<Steps>
  <Step title="クリーンなワークツリーを検証">
    未コミットの変更がないことが必要です。
  </Step>
  <Step title="チャンネルを切り替え">
    選択したチャンネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="上流を取得">
    Dev のみ。
  </Step>
  <Step title="事前ビルド（dev のみ）">
    一時ワークツリーで TypeScript ビルドを実行します。先端が失敗した場合、最新のビルド可能なコミットを見つけるために最大 10 コミットまで遡ります。この事前チェック中に lint も実行するには `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザー更新ホストは CI ランナーより小さいことが多いため、lint は制約付きのシリアルモードで実行されます。
  </Step>
  <Step title="Rebase">
    選択したコミット上に rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、更新処理は pnpm ワークスペース内で `npm run build` を実行するのではなく、必要に応じて `pnpm` をブートストラップします（まず `corepack` を使用し、その後一時的な `npm install pnpm@11` フォールバックを使用）。pnpm ブートストラップがそれでも失敗する場合、更新処理はチェックアウト内で `npm run build` を試すのではなく、パッケージマネージャー固有のエラーで早期停止します。
  </Step>
  <Step title="Control UI をビルド">
    Gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    `openclaw doctor` は最終的な安全更新チェックとして実行されます。
  </Step>
  <Step title="Plugin を同期">
    Plugin をアクティブなチャンネルに同期します。Dev はバンドル済み Plugin を使用し、stable と beta は npm を使用します。追跡対象の Plugin インストールを更新します。
  </Step>
</Steps>

### Plugin 同期の詳細

beta チャンネルでは、デフォルト/latest ラインに従う追跡対象の npm および ClawHub Plugin インストールは、
まず Plugin の `@beta` リリースを試します。Plugin に
beta リリースがない場合、OpenClaw は記録済みのデフォルト/latest 仕様にフォールバックし、
警告を報告します。npm Plugin では、beta
パッケージが存在してもインストール検証に失敗した場合にも OpenClaw はフォールバックします。これらのフォールバック警告は
コア更新を失敗させません。正確なバージョンと明示的なタグは決して書き換えられません。

<Warning>
正確にピン留めされた npm Plugin 更新が、保存済みインストール記録と整合性の異なるアーティファクトに解決される場合、`openclaw update` はそれをインストールする代わりに、その Plugin アーティファクト更新を中止します。新しいアーティファクトを信頼できることを検証した後にのみ、Plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
管理対象 Plugin にスコープされ、同期パスが回避できる更新後の Plugin 同期失敗（たとえば、必須ではない Plugin の npm レジストリに到達できない場合）は、コア更新成功後に警告として報告されます。JSON 結果はトップレベルの更新 `status: "ok"` を維持し、`openclaw update repair` と `openclaw plugins inspect <id> --runtime --json` のガイダンスとともに `postUpdate.plugins.status: "warning"` を報告します。予期しない更新処理または同期例外は引き続き更新結果を失敗させます。Plugin のインストールまたは更新エラーを修正してから、`openclaw update repair` を再実行してください。

Plugin ごとの同期手順の後、`openclaw update` は Gateway の再起動前に必須の **コア後収束** パスを実行します。これは、欠落している設定済み Plugin ペイロードを修復し、ディスク上の各 _アクティブな_ 追跡対象インストール記録を検証し、その `package.json` が解析可能であること（および明示的に宣言された `main` が存在すること）を静的に検証します。このパスの失敗と無効な設定スナップショットは、`postUpdate.plugins.status: "error"` を返し、トップレベルの更新 `status` を `"error"` に反転させます。そのため `openclaw update` は非ゼロで終了し、未検証の Plugin セットで Gateway は再起動されません。エラーには、`openclaw update repair` と `openclaw plugins inspect <id> --runtime --json` を指す構造化された `postUpdate.plugins.warnings[].guidance` 行が含まれます。無効化された Plugin エントリと、信頼済みソースにリンクされた公式同期ターゲットではない記録はここではスキップされます（欠落ペイロードチェックで使用される `skipDisabledPlugins` ポリシーを反映）。そのため、古い無効化済み Plugin 記録が、それ以外は有効な更新をブロックすることはありません。

更新された Gateway の起動時、Plugin の読み込みは検証専用です。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりしません。パッケージマネージャーの `update.run` 再起動は CLI の管理対象サービスパスに引き渡されるため、パッケージの入れ替えは古い Gateway プロセスの外部で行われ、サービス正常性チェックが更新完了として報告できるかどうかを判断します。
</Note>

extended-stable コア更新が成功した後、コア後の Plugin 整合性と
収束は、正確にインストールされたコアバージョンの対象となる公式 npm Plugin をターゲットにします。
デフォルト/`latest` 意図について、OpenClaw は Plugin
`@extended-stable` を問い合わせたり npm `latest` にフォールバックしたりしません。インストール済みコアからパッケージバージョンを導出します。
明示的なバージョンピン、明示的な非 `latest` タグ、
サードパーティパッケージ、および非 npm ソースは既存の意図を維持します。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージ
バージョンを解決します。npm グローバルインストールは段階的インストールを使用します。
OpenClaw は新しいパッケージを一時的な npm プレフィックスにインストールし、
そこでパッケージ化された `dist` インベントリを検証してから、そのクリーンなパッケージ
ツリーを実際のグローバルプレフィックスに入れ替えます。検証に失敗した場合、更新後の doctor、
Plugin 同期、再起動作業は疑わしいツリーから実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、
コマンドはグローバルパッケージインストールを更新し、その後 Plugin 同期、コアコマンド補完の
更新、再起動作業を実行します。これにより、パッケージ化されたサイドカーとチャンネル所有の
Plugin 記録をインストール済み OpenClaw ビルドと整合させつつ、完全な
Plugin コマンド補完の再ビルドは明示的な
`openclaw completion --write-state` 実行に任せます。

## 関連

- `openclaw doctor`（Git チェックアウトで先に update を実行するよう提案します）
- [開発チャンネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
