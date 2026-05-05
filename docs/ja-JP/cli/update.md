---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしています'
    - '`--update` の省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス (比較的安全なソース更新 + Gateway の自動再起動)'
title: 更新
x-i18n:
    generated_at: "2026-05-05T01:44:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャネルを切り替えます。

**npm/pnpm/bun** でインストールした場合（グローバルインストールで、git メタデータなし）、
更新は [Updating](/ja-JP/install/updating) のパッケージマネージャーフローで行われます。

## 使用方法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## オプション

- `--no-restart`: 更新が成功した後、Gateway サービスの再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動されたサービスが期待される更新後バージョンを報告することを確認します。
- `--channel <stable|beta|dev>`: 更新チャネルを設定します（git + npm。設定に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新に限り、パッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマップされます。
- `--dry-run`: 設定の書き込み、インストール、Plugin の同期、再起動を行わずに、予定されている更新アクション（チャネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSON を出力します。更新後の Plugin 同期中に npm Plugin アーティファクトのドリフトが検出された場合は、
  `postUpdate.plugins.integrityDrifts` も含まれます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800 秒）。
- `--yes`: 確認プロンプトをスキップします（たとえばダウングレード確認）。

`openclaw update` には `--verbose` フラグはありません。予定されているチャネル/タグ/インストール/再起動アクションをプレビューするには `--dry-run` を、機械可読な結果には `--json` を、チャネルと利用可能状況の詳細だけが必要な場合は `openclaw update status --json` を使用してください。更新の前後で Gateway ログをデバッグしている場合、コンソールの詳細度とファイルログレベルは別です。Gateway の `--verbose` はターミナル/WebSocket 出力に影響しますが、ファイルログには設定で `logging.level: "debug"` または `"trace"` が必要です。[Gateway logging](/ja-JP/gateway/logging) を参照してください。

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

アクティブな更新チャネルと git タグ/ブランチ/SHA（ソースチェックアウトの場合）、および更新の利用可能状況を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読なステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3 秒）。

## `update wizard`

更新チャネルを選択し、更新後に Gateway を再起動するかどうかを確認する対話型フローです（デフォルトでは再起動します）。git チェックアウトなしで `dev` を選択すると、作成を提案します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 実行内容

チャネルを明示的に切り替えると（`--channel ...`）、OpenClaw はインストール方法も整合させます。

- `dev` → git チェックアウトを確保し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き）、それを更新して、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使用して npm からインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が存在しないか現在の安定版リリースより古い場合は `latest` にフォールバックします。

Gateway コアの自動更新機能（設定で有効な場合）は、稼働中の Gateway リクエストハンドラーの外で CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー更新では、パッケージ差し替え後に、遅延なし、クールダウンなしの更新再起動を強制します。これは、古い Gateway プロセスが、新しいパッケージで削除されたファイルを指すインメモリチャンクをまだ保持している可能性があるためです。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージバージョンを解決します。npm グローバルインストールでは段階的インストールを使用します。OpenClaw は新しいパッケージを一時的な npm prefix にインストールし、そこでパッケージ化された `dist` インベントリを検証してから、そのクリーンなパッケージツリーを実際のグローバル prefix に差し替えます。検証に失敗した場合、更新後の doctor、Plugin 同期、再起動作業は疑わしいツリーから実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、その後に Plugin 同期、コアコマンド補完の更新、再起動作業を実行します。これにより、パッケージ化されたサイドカーとチャネル所有の Plugin レコードをインストール済みの OpenClaw ビルドと整合させつつ、完全な Plugin コマンド補完の再構築は明示的な `openclaw completion --write-state` 実行に任せます。

ローカル管理の Gateway サービスがインストールされていて再起動が有効な場合、パッケージマネージャー更新はパッケージツリーを置き換える前に実行中のサービスを停止し、更新後のインストールからサービスメタデータを更新し、サービスを再起動して、再起動された Gateway が期待されるバージョンを報告することを確認してから成功を報告します。macOS では、更新後チェックにより、アクティブプロファイルの LaunchAgent が読み込み済み/実行中であり、設定されたループバックポートが正常であることも確認します。plist がインストールされているものの launchd が監視していない場合、OpenClaw は LaunchAgent を自動的に再ブートストラップし、その後にヘルス/バージョン/チャネルの準備状況チェックを再実行します。新規ブートストラップでは RunAtLoad ジョブを直接読み込むため、更新リカバリは新しく生成された Gateway に対してすぐに `kickstart -k` を実行しません。それでも Gateway が正常にならない場合、コマンドは非ゼロで終了し、再起動ログのパスに加えて、明示的な再起動、再インストール、パッケージロールバック手順を出力します。`--no-restart` を指定すると、パッケージ置換は実行されますが、管理サービスは停止または再起動されないため、手動で再起動するまで実行中の Gateway は古いコードを保持する可能性があります。

## Git チェックアウトフロー

### チャネル選択

- `stable`: 最新の非 beta タグをチェックアウトし、その後ビルドと doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しないか古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を実行します。

### 更新ステップ

<Steps>
  <Step title="クリーンな worktree を確認">
    未コミットの変更がないことが必要です。
  </Step>
  <Step title="チャネルを切り替え">
    選択したチャネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="upstream を fetch">
    dev のみ。
  </Step>
  <Step title="事前ビルド（dev のみ）">
    一時 worktree で lint と TypeScript ビルドを実行します。先端が失敗した場合、最大 10 コミット遡って、正常にビルドできる最新のコミットを探します。
  </Step>
  <Step title="Rebase">
    選択したコミットに rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、updater は pnpm workspace 内で `npm run build` を実行するのではなく、必要に応じて `pnpm` をブートストラップします（まず `corepack`、次に一時的な `npm install pnpm@10` フォールバック）。
  </Step>
  <Step title="Control UI をビルド">
    gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    最後の安全な更新チェックとして `openclaw doctor` を実行します。
  </Step>
  <Step title="Plugin を同期">
    Plugin をアクティブなチャネルに同期します。dev はバンドル Plugin を使用し、stable と beta は npm を使用します。追跡対象の Plugin インストールを更新します。
  </Step>
</Steps>

beta 更新チャネルでは、default/latest ラインに従う追跡対象の npm および ClawHub Plugin インストールは、まず Plugin の `@beta` リリースを試します。Plugin に beta リリースがない場合、OpenClaw は記録された default/latest spec にフォールバックします。npm Plugin では、beta パッケージが存在してもインストール検証に失敗した場合にも OpenClaw はフォールバックします。正確なバージョンと明示的なタグは書き換えられません。

<Warning>
正確にピン留めされた npm Plugin 更新が、保存済みインストールレコードと整合性が異なるアーティファクトに解決された場合、`openclaw update` はその Plugin アーティファクト更新をインストールせずに中止します。新しいアーティファクトを信頼できることを確認した後でのみ、Plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
更新後の Plugin 同期に失敗すると、更新結果は失敗となり、その後の再起動作業は停止します。Plugin のインストールまたは更新エラーを修正してから、`openclaw update` を再実行してください。

更新後の Gateway が起動するとき、Plugin 読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりすることはありません。パッケージマネージャーの `update.run` 再起動は、パッケージツリーの差し替え後に通常のアイドル遅延と再起動クールダウンをバイパスするため、古いプロセスが削除済みチャンクを遅延読み込みし続けることはできません。

pnpm ブートストラップがそれでも失敗する場合、updater はチェックアウト内で `npm run build` を試すのではなく、パッケージマネージャー固有のエラーで早期に停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（shell やランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは先に更新を実行するよう提案します）
- [開発チャネル](/ja-JP/install/development-channels)
- [Updating](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
