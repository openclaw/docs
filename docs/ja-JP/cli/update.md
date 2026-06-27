---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしている'
    - '`--update` の省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway 自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-06-27T11:04:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャンネルを切り替えます。

**npm/pnpm/bun** でインストールした場合（グローバルインストールで、git メタデータなし）、
更新は [更新](/ja-JP/install/updating) のパッケージマネージャーフローで行われます。

## 使用方法

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
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

- `--no-restart`: 更新が成功した後の Gateway サービスの再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動されたサービスが期待される更新後バージョンを報告することを検証します。
- `--channel <stable|beta|dev>`: 更新チャンネルを設定します（git + npm。config に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新だけのパッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマップされます。GitHub/git ソース spec は、ステージングされたグローバル npm インストールの前に一時 tarball にパックされます。
- `--dry-run`: config の書き込み、インストール、Plugin の同期、再起動を行わずに、予定されている更新アクション（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読の `UpdateRunResult` JSON を出力します。これには、コア更新が成功した後に破損またはロード不能な管理対象 Plugin の修復が必要な場合の
  `postUpdate.plugins.warnings`、Plugin に beta リリースがない場合の beta チャンネル Plugin フォールバック詳細、および更新後 Plugin 同期中に npm Plugin アーティファクトのドリフトが検出された場合の `postUpdate.plugins.integrityDrifts`
  が含まれます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800 秒）。
- `--yes`: 確認プロンプトをスキップします（例: ダウングレード確認）。
- `--acknowledge-clawhub-risk`: コミュニティ ClawHub の信頼警告を確認した後、対話型プロンプトなしで更新後 Plugin 同期の継続を許可します。これがない場合、OpenClaw がプロンプトを出せないときは、リスクのあるコミュニティ ClawHub Plugin リリースはスキップされ、変更されません。公式 ClawHub パッケージとバンドルされた OpenClaw Plugin ソースは、このリリース信頼プロンプトをバイパスします。

`openclaw update` には `--verbose` フラグはありません。予定されているチャンネル/タグ/インストール/再起動アクションをプレビューするには `--dry-run`、機械可読の結果には `--json`、チャンネルと可用性の詳細だけが必要な場合は `openclaw update status --json` を使用します。更新周辺の Gateway ログをデバッグしている場合、コンソールの冗長性とファイルログレベルは別です。Gateway `--verbose` は端末/WebSocket 出力に影響し、ファイルログには config の `logging.level: "debug"` または `"trace"` が必要です。[Gateway ロギング](/ja-JP/gateway/logging) を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` 実行は無効化されます。代わりに、このインストールの Nix ソースまたは flake input を更新してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start) を使用します。`openclaw update status` と `openclaw update --dry-run` は引き続き読み取り専用です。
</Note>

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

有効な更新チャンネル + git タグ/ブランチ/SHA（ソースチェックアウトの場合）と、更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読のステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3 秒）。

## `update repair`

コアパッケージはすでに変更されたものの、後続の修復作業が正常に完了しなかった場合に、更新の最終処理を再実行します。これは、`openclaw update` が新しいコアパッケージをインストールしたものの、コア更新後の Plugin 同期、管理対象 npm Plugin メタデータ、レジストリ更新、または doctor 修復がまだ収束する必要がある場合にサポートされる復旧パスです。

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

オプション:

- `--channel <stable|beta|dev>`: 修復の前に更新チャンネルを永続化し、そのチャンネルに対して Plugin 収束を実行します。
- `--json`: 機械可読の最終処理 JSON を出力します。
- `--timeout <seconds>`: 修復ステップのタイムアウト（デフォルトは `1800`）。
- `--yes`: 確認プロンプトをスキップします。
- `--acknowledge-clawhub-risk`: コミュニティ ClawHub の信頼警告を確認した後、対話型プロンプトなしで修復時の Plugin 収束の継続を許可します。公式 ClawHub パッケージとバンドルされた OpenClaw Plugin ソースは、このリリース信頼プロンプトをバイパスします。
- `--no-restart`: update コマンドとの一貫性のために受け付けられます。repair は Gateway を再起動しません。

`openclaw update repair` は `openclaw doctor --fix` を実行し、修復済み config とインストールレコードを再読み込みし、有効な更新チャンネルに対して追跡対象 Plugin を同期し、管理対象 npm Plugin インストールを更新し、欠落している設定済み Plugin ペイロードを修復し、Plugin レジストリを更新し、収束したインストールレコードメタデータを書き込みます。新しいコアパッケージはインストールせず、Gateway も再起動しません。

## `update wizard`

更新チャンネルを選択し、更新後に Gateway を再起動するかどうかを確認する対話型フローです（デフォルトは再起動）。git チェックアウトなしで `dev` を選択した場合は、作成を提案します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルトは `1800`）

## 実行内容

チャンネルを明示的に切り替える場合（`--channel ...`）、OpenClaw はインストール方法も整合させます。

- `dev` → git チェックアウトを確保します（デフォルト: `~/openclaw`、または
  `OPENCLAW_HOME` が設定されている場合は `$OPENCLAW_HOME/openclaw`。
  `OPENCLAW_GIT_DIR` で上書き可能）。それを更新し、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使って npm からインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が存在しない、または現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway コア自動更新機能（config で有効化されている場合）は、稼働中の Gateway リクエストハンドラーの外側で CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー更新と、監督下の git チェックアウト更新も、稼働中の Gateway プロセス内でパッケージツリーを置き換えたり `dist/` を再ビルドしたりする代わりに、管理対象サービスへのハンドオフを使用します。Gateway は切り離されたヘルパーを開始して終了し、そのヘルパーが Gateway プロセスツリーの外側から通常の `openclaw update --yes --json` CLI パスを実行します。そのハンドオフを利用できない場合、`update.run` は手動で実行する安全な shell コマンドを含む構造化レスポンスを返します。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージバージョンを解決します。npm グローバルインストールでは、ステージングインストールを使用します。OpenClaw は新しいパッケージを一時 npm prefix にインストールし、そこでパッケージ化された `dist` インベントリを検証してから、そのクリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。検証に失敗した場合、更新後 doctor、Plugin 同期、再起動作業は疑わしいツリーから実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、その後 Plugin 同期、コアコマンド補完の更新、再起動作業を実行します。これにより、パッケージ化された sidecar とチャンネル所有の Plugin レコードを、インストール済み OpenClaw ビルドと整合させます。一方、完全な Plugin コマンド補完の再ビルドは、明示的な `openclaw completion --write-state` 実行に委ねます。

ローカル管理対象 Gateway サービスがインストールされていて再起動が有効な場合、パッケージマネージャー更新と git チェックアウト更新は、パッケージツリーの置き換えやチェックアウト/ビルド出力の変更の前に、実行中のサービスを停止します。その後、更新後のインストールからサービスメタデータを更新し、サービスを再起動し、再起動された Gateway を検証してから `Gateway: restarted and verified.` を報告します。パッケージマネージャー更新ではさらに、再起動された Gateway が期待されるパッケージバージョンを報告することを検証します。git チェックアウト更新では、再ビルド後に Gateway のヘルスとサービス準備状態を検証します。macOS では、更新後チェックにより、有効なプロファイルの LaunchAgent が読み込まれて実行中であること、および設定済み loopback ポートが正常であることも検証します。plist がインストールされていても launchd が監督していない場合、OpenClaw は LaunchAgent を自動的に再 bootstrap し、その後ヘルス/バージョン/チャンネル準備状態チェックを再実行します。新しい bootstrap は RunAtLoad ジョブを直接読み込むため、更新復旧は新しく起動された Gateway に対してすぐに `kickstart -k` を実行しません。それでも Gateway が正常にならない場合、コマンドは非ゼロで終了し、再起動ログパスと、明示的な再起動、再インストール、パッケージロールバック手順を出力します。再起動を実行できない場合、コマンドは手動の `openclaw gateway restart` ヒントとともに `Gateway: restart skipped (...)` または `Gateway: restart failed: ...` を出力します。`--no-restart` を指定すると、パッケージ置換または git 再ビルドは実行されますが、管理対象サービスは停止または再起動されないため、手動で再起動するまで実行中の Gateway は古いコードを使い続ける可能性があります。

### コントロールプレーンレスポンスの形状

`update.run` が、パッケージマネージャーインストールまたは監督下の git チェックアウトで Gateway コントロールプレーンを通じて呼び出されると、ハンドラーは Gateway 終了後に続行される CLI 更新とは別に、ハンドオフの開始を報告します。

- `ok: true`、`result.status: "skipped"`、
  `result.reason: "managed-service-handoff-started"`、および
  `handoff.status: "started"` は、Gateway が管理対象サービスハンドオフを作成し、切り離されたヘルパーが稼働中サービスプロセスの外側で
  `openclaw update --yes --json` を実行できるように、自身の再起動をスケジュールしたことを意味します。
- `ok: false`、`result.reason: "managed-service-handoff-unavailable"`、および
  `handoff.status: "unavailable"` は、安全なハンドオフに必要な監督サービス境界と永続的なサービス ID を OpenClaw が見つけられなかったことを意味します。たとえば、systemd ハンドオフには、周囲の systemd プロセスマーカーだけでなく、OpenClaw unit ID（`OPENCLAW_SYSTEMD_UNIT`）が必要です。レスポンスには、Gateway の外側から実行する shell コマンドである `handoff.command` が含まれます。
- `ok: false`、`result.reason: "managed-service-handoff-failed"` は、Gateway がハンドオフを作成しようとしたものの、切り離されたヘルパーを spawn できなかったことを意味します。

`sentinel` ペイロードは Gateway が終了する前に引き続き書き込まれ、CLI ハンドオフは管理対象サービス再起動のヘルスチェックが完了した後に同じ再起動 sentinel を更新します。ハンドオフ中、sentinel は成功継続なしで `stats.reason: "restart-health-pending"` を保持する場合があります。再起動された Gateway はそれをポーリングし続け、CLI がサービスヘルスを検証して最終的な `ok` 結果で sentinel を書き直した後にのみ継続を発火します。`openclaw status` と `openclaw status --all` は、その sentinel が保留中または失敗している間、`Update restart` 行を表示し、`update.status` は最新の sentinel を更新して返します。

## Git チェックアウトフロー

### チャンネル選択

- `stable`: 最新の非 beta タグをチェックアウトし、その後ビルドと doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しない、または古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を実行します。

### 更新ステップ

<Steps>
  <Step title="クリーンなワークツリーを確認">
    未コミットの変更がないことが必要です。
  </Step>
  <Step title="チャンネルを切り替え">
    選択したチャンネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="上流をフェッチ">
    開発版のみ。
  </Step>
  <Step title="事前ビルド（開発版のみ）">
    一時ワークツリーで TypeScript ビルドを実行します。先端が失敗した場合、最大 10 コミットまでさかのぼって、ビルド可能な最新コミットを探します。この事前チェック中に lint も実行するには `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザー更新ホストは CI ランナーより小さいことが多いため、lint は制約付きの直列モードで実行されます。
  </Step>
  <Step title="リベース">
    選択したコミットの上にリベースします（開発版のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、アップデーターは pnpm ワークスペース内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（まず `corepack` を使い、その後一時的な `npm install pnpm@11` フォールバックを使います）。
  </Step>
  <Step title="Control UI をビルド">
    Gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    `openclaw doctor` は最後の安全な更新チェックとして実行されます。
  </Step>
  <Step title="Plugin を同期">
    Plugin をアクティブなチャンネルに同期します。開発版はバンドル済み Plugin を使用し、stable と beta は npm を使用します。追跡対象の Plugin インストールを更新します。
  </Step>
</Steps>

beta 更新チャンネルでは、デフォルト/latest ラインに従う追跡対象の npm と ClawHub Plugin インストールは、まず Plugin の `@beta` リリースを試します。Plugin に beta リリースがない場合、OpenClaw は記録済みのデフォルト/latest spec にフォールバックし、それを警告として報告します。npm Plugin については、beta パッケージが存在してもインストール検証に失敗した場合にも OpenClaw はフォールバックします。これらの Plugin フォールバック警告によってコア更新が失敗することはありません。厳密なバージョンと明示的なタグは書き換えられません。

<Warning>
厳密に固定された npm Plugin 更新が、保存済みインストール記録と integrity が異なるアーティファクトに解決される場合、`openclaw update` はそれをインストールする代わりに、その Plugin アーティファクト更新を中止します。新しいアーティファクトを信頼できることを確認した後にのみ、Plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
管理対象 Plugin に限定され、同期パスが迂回できる更新後の Plugin 同期失敗（例: 必須ではない Plugin に対する到達不能な npm レジストリ）は、コア更新の成功後に警告として報告されます。JSON 結果はトップレベルの更新 `status: "ok"` を保持し、`openclaw update repair` と `openclaw plugins inspect <id> --runtime --json` のガイダンスとともに `postUpdate.plugins.status: "warning"` を報告します。予期しないアップデーターまたは同期例外は、引き続き更新結果を失敗させます。Plugin のインストールまたは更新エラーを修正してから、`openclaw update repair` を再実行してください。

Plugin ごとの同期ステップの後、`openclaw update` は Gateway を再起動する前に、必須の**コア後収束**パスを実行します。設定済み Plugin ペイロードの欠落を修復し、ディスク上の各_アクティブな_追跡対象インストール記録を検証し、その `package.json` が解析可能であること（および明示的に宣言された `main` が存在すること）を静的に検証します。このパスの失敗、および無効な OpenClaw config スナップショットは、`postUpdate.plugins.status: "error"` を返し、トップレベルの更新 `status` を `"error"` に切り替えるため、`openclaw update` は非ゼロで終了し、Gateway は未検証の Plugin セットで再起動されません。エラーには、フォローアップとして `openclaw update repair` と `openclaw plugins inspect <id> --runtime --json` を示す、構造化された `postUpdate.plugins.warnings[].guidance` 行が含まれます。無効化された Plugin エントリと、信頼済みソースにリンクされた公式同期ターゲットではない記録はここでスキップされます。これは、欠落ペイロードチェックで使用される `skipDisabledPlugins` ポリシーを反映しているため、古い無効化済み Plugin 記録が、それ以外は有効な更新をブロックすることはありません。

更新された Gateway が起動するとき、Plugin 読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりすることはありません。パッケージマネージャーの `update.run` 再起動は CLI の管理対象サービスパスに渡されるため、パッケージの差し替えは古い Gateway プロセスの外で行われ、サービスのヘルスチェックによって更新を完了として報告できるかどうかが決定されます。

pnpm ブートストラップがそれでも失敗する場合、アップデーターはチェックアウト内で `npm run build` を試すのではなく、パッケージマネージャー固有のエラーで早期に停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは先に更新を実行するよう提案します）
- [開発チャンネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
