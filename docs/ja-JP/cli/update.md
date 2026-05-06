---
read_when:
    - ソースチェックアウトを安全に更新したい
    - '`openclaw update` の出力またはオプションをデバッグしています'
    - '`--update` 省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-05-06T04:59:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャネルを切り替えます。

**npm/pnpm/bun** でインストールした場合（グローバルインストールで、git メタデータなし）、
更新は [更新](/ja-JP/install/updating) のパッケージマネージャーフローで行われます。

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

- `--no-restart`: 更新が成功した後に Gateway サービスの再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動されたサービスが想定される更新後バージョンを報告していることを確認します。
- `--channel <stable|beta|dev>`: 更新チャネルを設定します（git + npm。config に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新に限ってパッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` に対応します。
- `--dry-run`: config への書き込み、インストール、plugins の同期、再起動を行わずに、計画された更新アクション（チャネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読の `UpdateRunResult` JSON を出力します。core 更新が成功した後に破損またはロード不能な管理対象 plugins の修復が必要な場合は
  `postUpdate.plugins.warnings` を含み、更新後の plugin 同期中に npm plugin アーティファクトのドリフトが検出された場合は `postUpdate.plugins.integrityDrifts`
  を含みます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800s）。
- `--yes`: 確認プロンプトをスキップします（例: ダウングレード確認）。

`openclaw update` には `--verbose` フラグはありません。計画されたチャネル/タグ/インストール/再起動アクションをプレビューするには `--dry-run` を、機械可読の結果には `--json` を使用し、チャネルと可用性の詳細だけが必要な場合は `openclaw update status --json` を使用します。更新前後の Gateway ログをデバッグする場合、コンソールの詳細度とファイルログレベルは別です。Gateway `--verbose` は端末/WebSocket 出力に影響し、ファイルログには config の `logging.level: "debug"` または `"trace"` が必要です。[Gateway ログ](/ja-JP/gateway/logging)を参照してください。

<Warning>
古いバージョンでは構成が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

有効な更新チャネル + git タグ/ブランチ/SHA（ソースチェックアウトの場合）と、更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読のステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3s）。

## `update wizard`

更新チャネルを選択し、更新後に Gateway を再起動するかどうかを確認する対話型フローです（デフォルトは再起動）。git チェックアウトなしで `dev` を選択した場合は、作成を提案します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 実行内容

明示的にチャネルを切り替えると（`--channel ...`）、OpenClaw はインストール方法も揃えます。

- `dev` → git チェックアウトを確保し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き）、それを更新し、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使って npm からインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が存在しないか現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway core 自動更新機能（config で有効な場合）は、実行中の Gateway リクエストハンドラーの外で CLI 更新パスを起動します。control-plane `update.run` のパッケージマネージャー更新では、パッケージ入れ替え後に遅延なし、クールダウンなしの更新再起動を強制します。これは古い Gateway プロセスが、新しいパッケージで削除されたファイルを指すインメモリチャンクをまだ保持している可能性があるためです。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージバージョンを解決します。npm グローバルインストールではステージングインストールを使用します。OpenClaw は新しいパッケージを一時 npm prefix にインストールし、そこでパッケージ化された `dist` インベントリを検証してから、そのクリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。検証に失敗した場合、更新後の doctor、plugin 同期、再起動処理は疑わしいツリーから実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、その後 plugin 同期、core コマンド補完の更新、再起動処理を実行します。これにより、明示的な `openclaw completion --write-state` 実行に完全な plugin コマンド補完の再構築を任せつつ、パッケージ化されたサイドカーとチャネル所有の plugin レコードを、インストール済みの OpenClaw ビルドと揃えた状態に保ちます。

ローカルの管理対象 Gateway サービスがインストールされていて再起動が有効な場合、パッケージマネージャー更新はパッケージツリーを置き換える前に実行中のサービスを停止し、その後、更新されたインストールからサービスメタデータを更新し、サービスを再起動し、再起動された Gateway が想定されるバージョンを報告していることを確認してから成功を報告します。macOS では、更新後チェックにより、アクティブなプロファイルに対して LaunchAgent がロード/実行されていること、および構成されたループバックポートが正常であることも確認します。plist がインストールされているが launchd が監督していない場合、OpenClaw は LaunchAgent を自動的に再ブートストラップし、その後、ヘルス/バージョン/チャネル準備状況チェックを再実行します。新規ブートストラップは RunAtLoad ジョブを直接ロードするため、更新リカバリーは新しく起動した Gateway に対してすぐに `kickstart -k` を行いません。Gateway がそれでも正常にならない場合、コマンドはゼロ以外で終了し、再起動ログパスに加えて、明示的な再起動、再インストール、パッケージロールバック手順を出力します。`--no-restart` を指定した場合、パッケージ置き換えは実行されますが、管理対象サービスは停止または再起動されないため、手動で再起動するまで、実行中の Gateway は古いコードを保持する可能性があります。

## Git チェックアウトフロー

### チャネル選択

- `stable`: 最新の非 beta タグをチェックアウトしてから、ビルドと doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しないか古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトしてから、fetch と rebase を行います。

### 更新ステップ

<Steps>
  <Step title="クリーンな worktree を確認">
    コミットされていない変更がないことが必要です。
  </Step>
  <Step title="チャネルを切り替え">
    選択されたチャネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="upstream を fetch">
    Dev のみ。
  </Step>
  <Step title="事前ビルド（dev のみ）">
    一時 worktree で TypeScript ビルドを実行します。tip が失敗した場合、最大 10 コミット前まで戻って、ビルド可能な最新コミットを探します。この事前チェック中に lint も実行するには、`OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザーの更新ホストは CI ランナーより小さいことが多いため、lint は制約付きのシリアルモードで実行されます。
  </Step>
  <Step title="Rebase">
    選択されたコミットへ rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、updater は pnpm workspace 内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（まず `corepack` を使用し、その後一時的な `npm install pnpm@10` フォールバックを使用）。
  </Step>
  <Step title="Control UI をビルド">
    Gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    最後の安全更新チェックとして `openclaw doctor` を実行します。
  </Step>
  <Step title="plugins を同期">
    plugins を有効なチャネルに同期します。Dev はバンドルされた plugins を使用し、stable と beta は npm を使用します。追跡対象の plugin インストールを更新します。
  </Step>
</Steps>

beta 更新チャネルでは、default/latest ラインに従う追跡対象の npm および ClawHub plugin インストールは、まず plugin `@beta` リリースを試します。plugin に beta リリースがない場合、OpenClaw は記録済みの default/latest spec にフォールバックします。npm plugins では、beta パッケージが存在してもインストール検証に失敗した場合にも OpenClaw はフォールバックします。正確なバージョンと明示的なタグは書き換えられません。

<Warning>
正確に固定された npm plugin 更新が、保存済みインストールレコードと integrity が異なるアーティファクトに解決された場合、`openclaw update` はその plugin アーティファクト更新をインストールせずに中止します。新しいアーティファクトを信頼できることを確認した後でのみ、plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
管理対象 plugin に限定された更新後の plugin 同期失敗は、core 更新が成功した後に警告として報告されます。JSON 結果ではトップレベルの更新 `status: "ok"` を維持し、`openclaw doctor --fix` と `openclaw plugins inspect <id> --runtime --json` の案内とともに `postUpdate.plugins.status: "warning"` を報告します。予期しない updater または同期例外は、引き続き更新結果を失敗にします。plugin インストールまたは更新エラーを修正してから、`openclaw doctor --fix` または `openclaw update` を再実行してください。

更新された Gateway が起動すると、plugin ロードは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりしません。パッケージマネージャー `update.run` の再起動は、パッケージツリーが入れ替えられた後、通常のアイドル遅延と再起動クールダウンを迂回するため、古いプロセスが削除済みチャンクを lazy-load し続けることはできません。

pnpm ブートストラップがそれでも失敗する場合、updater はチェックアウト内で `npm run build` を試すのではなく、パッケージマネージャー固有のエラーで早期に停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは最初に update を実行することを提案します）
- [開発チャネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
