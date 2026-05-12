---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしている'
    - '`--update` の省略記法の挙動を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス (比較的安全なソース更新 + Gateway の自動再起動)'
title: 更新
x-i18n:
    generated_at: "2026-05-12T08:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93244af800aaa53c55a52f9593a7727910aa91acac9d1e34e89c39a95b133461
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャンネルを切り替えます。

**npm/pnpm/bun** 経由でインストールした場合（グローバルインストールで、git メタデータなし）、
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

- `--no-restart`: 更新が成功した後に Gateway サービスの再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動後のサービスが想定された更新済みバージョンを報告することを検証します。
- `--channel <stable|beta|dev>`: 更新チャンネルを設定します（git + npm。config に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新に限り、パッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマップされます。
- `--dry-run`: config の書き込み、インストール、plugins の同期、再起動を行わずに、予定されている更新アクション（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械判読可能な `UpdateRunResult` JSON を出力します。これには、
  破損またはロード不能な管理対象 plugins がコア更新の成功後に
  修復を必要とする場合の `postUpdate.plugins.warnings`、plugin に beta リリースがない場合の
  beta チャンネル plugin フォールバック詳細、更新後の plugin 同期中に npm plugin アーティファクトのドリフトが検出された場合の `postUpdate.plugins.integrityDrifts`
  が含まれます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800s）。
- `--yes`: 確認プロンプト（たとえばダウングレード確認）をスキップします。

`openclaw update` には `--verbose` フラグはありません。予定されている
チャンネル/タグ/インストール/再起動アクションをプレビューするには `--dry-run` を、
機械判読可能な結果には `--json` を、チャンネルと可用性の詳細だけが必要な場合は
`openclaw update status --json` を使用します。更新前後の Gateway ログをデバッグしている場合、
コンソールの詳細度とファイルログレベルは別です。Gateway `--verbose` は
ターミナル/WebSocket 出力に影響しますが、ファイルログには config の `logging.level: "debug"` または
`"trace"` が必要です。[Gateway ログ](/ja-JP/gateway/logging)を参照してください。

<Note>
Nix モード（`OPENCLAW_NIX_MODE=1`）では、変更を伴う `openclaw update` の実行は無効です。代わりに、このインストールの Nix ソースまたは flake 入力を更新してください。nix-openclaw では、エージェント優先の [クイックスタート](https://github.com/openclaw/nix-openclaw#quick-start)を使用します。`openclaw update status` と `openclaw update --dry-run` は読み取り専用のままです。
</Note>

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

アクティブな更新チャンネル + git タグ/ブランチ/SHA（ソース checkout の場合）と、更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械判読可能なステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3s）。

## `update wizard`

更新チャンネルを選択し、更新後に Gateway を再起動するかどうかを確認する
対話型フローです（デフォルトは再起動）。git checkout なしで `dev` を選択した場合は、
作成するかどうかを提示します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 実行内容

チャンネルを明示的に切り替えると（`--channel ...`）、OpenClaw は
インストール方法も整合させます。

- `dev` → git checkout を確保し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き）、
  それを更新して、その checkout からグローバル CLI をインストールします。
- `stable` → `latest` を使用して npm からインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が
  存在しない、または現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway コア自動アップデーター（config で有効な場合）は、稼働中の Gateway リクエストハンドラーの外で
CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー
更新は、パッケージ差し替え後に遅延なし、クールダウンなしの更新再起動を強制します。
古い Gateway プロセスが、新しいパッケージで削除されたファイルを指す
メモリ内チャンクをまだ保持している可能性があるためです。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前に
ターゲットパッケージのバージョンを解決します。npm グローバルインストールはステージングされた
インストールを使用します。OpenClaw は新しいパッケージを一時 npm prefix にインストールし、
そこでパッケージ済みの `dist` インベントリを検証してから、そのクリーンなパッケージツリーを
実際のグローバル prefix に差し替えます。検証に失敗した場合、更新後の doctor、plugin 同期、
再起動作業は疑わしいツリーから実行されません。インストール済みバージョンが
すでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、
その後 plugin 同期、コアコマンド補完の更新、再起動作業を実行します。これにより、
パッケージ済み sidecar とチャンネル所有の plugin レコードを
インストール済み OpenClaw ビルドと整合させつつ、完全な plugin コマンド補完の再構築は
明示的な `openclaw completion --write-state` 実行に残します。

ローカル管理対象 Gateway サービスがインストールされており、再起動が有効な場合、
パッケージマネージャー更新は、パッケージツリーを置き換える前に実行中のサービスを停止し、
更新済みインストールからサービスメタデータを更新し、サービスを再起動して、
再起動後の Gateway が想定されたバージョンを報告することを検証してから
成功を報告します。macOS では、更新後チェックで、アクティブプロファイルの LaunchAgent が
ロード/実行中であり、設定済みの loopback ポートが
正常であることも検証します。plist がインストールされているのに launchd が監視していない場合、
OpenClaw は LaunchAgent を自動的に再ブートストラップし、その後
健全性/バージョン/チャンネル準備状態チェックを再実行します。新規ブートストラップでは RunAtLoad
ジョブが直接ロードされるため、更新リカバリーは新しく
生成された Gateway に対して即座に `kickstart -k` を実行しません。Gateway がそれでも正常にならない場合、
コマンドは非ゼロで終了し、再起動ログパスに加えて、明示的な再起動、再インストール、
パッケージロールバック手順を出力します。`--no-restart` を指定した場合、
パッケージ置換は実行されますが、管理対象サービスは停止も
再起動もされないため、手動で再起動するまで、実行中の Gateway は古いコードを保持する可能性があります。

## Git checkout フロー

### チャンネル選択

- `stable`: 最新の非 beta タグを checkout し、その後 build と doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しない、または古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` を checkout し、その後 fetch と rebase を実行します。

### 更新ステップ

<Steps>
  <Step title="クリーンな worktree を検証">
    未コミットの変更がないことが必要です。
  </Step>
  <Step title="チャンネルを切り替え">
    選択したチャンネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="upstream を fetch">
    Dev のみ。
  </Step>
  <Step title="preflight build（dev のみ）">
    一時 worktree で TypeScript build を実行します。tip が失敗した場合、最大 10 commits までさかのぼって、build 可能な最新 commit を探します。この preflight 中に lint も実行するには `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` を設定します。ユーザーの更新ホストは CI runners より小さいことが多いため、lint は制約された serial mode で実行されます。
  </Step>
  <Step title="Rebase">
    選択した commit に rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm checkout では、updater は pnpm workspace 内で `npm run build` を実行する代わりに、必要に応じて（まず `corepack`、次に一時的な `npm install pnpm@11` フォールバックで）`pnpm` をブートストラップします。
  </Step>
  <Step title="Control UI を build">
    gateway と Control UI を build します。
  </Step>
  <Step title="doctor を実行">
    最後の安全更新チェックとして `openclaw doctor` が実行されます。
  </Step>
  <Step title="plugins を同期">
    plugins をアクティブチャンネルに同期します。Dev は同梱 plugins を使用し、stable と beta は npm を使用します。追跡対象の plugin インストールを更新します。
  </Step>
</Steps>

beta 更新チャンネルでは、default/latest ラインに従う追跡対象の npm および ClawHub plugin インストールは、
まず plugin `@beta` リリースを試します。plugin に beta リリースがない場合、
OpenClaw は記録済みの default/latest spec にフォールバックし、それを警告として報告します。
npm plugins では、beta パッケージが存在しても install validation に失敗した場合にも
OpenClaw はフォールバックします。これらの plugin フォールバック警告によって
コア更新が失敗することはありません。正確なバージョンと明示的なタグは
書き換えられません。

<Warning>
正確に pin された npm plugin 更新が、保存済みインストールレコードと integrity の異なるアーティファクトに解決される場合、`openclaw update` はそれをインストールする代わりに、その plugin アーティファクト更新を中止します。新しいアーティファクトを信頼できることを検証した後でのみ、plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
管理対象 plugin に限定され、同期パスが回避可能な更新後 plugin 同期失敗（例: 必須ではない plugin で npm registry に到達できない場合）は、コア更新の成功後に警告として報告されます。JSON 結果では、トップレベルの更新 `status: "ok"` を維持し、`openclaw doctor --fix` と `openclaw plugins inspect <id> --runtime --json` のガイダンスとともに `postUpdate.plugins.status: "warning"` を報告します。予期しない updater または同期例外は、引き続き更新結果を失敗させます。plugin install または更新エラーを修正してから、`openclaw doctor --fix` または `openclaw update` を再実行してください。

plugin ごとの同期ステップの後、`openclaw update` は gateway を再起動する前に必須の **post-core convergence** パスを実行します。これは、欠落している設定済み plugin payload を修復し、ディスク上の各 _active_ 追跡対象インストールレコードを検証し、その `package.json` が解析可能であること（および明示的に宣言された `main` が存在すること）を静的に検証します。このパスの失敗、および無効な OpenClaw config スナップショットは、`postUpdate.plugins.status: "error"` を返し、トップレベルの更新 `status` を `"error"` に切り替えるため、`openclaw update` は非ゼロで終了し、未検証の plugin セットで gateway が再起動されることはありません。エラーには、フォローアップ用の `openclaw doctor --fix` と `openclaw plugins inspect <id> --runtime --json` を指す構造化された `postUpdate.plugins.warnings[].guidance` 行が含まれます。無効化された plugin エントリと、trusted-source-linked official sync targets ではないレコードはここでスキップされます。これは missing-payload check で使用される `skipDisabledPlugins` ポリシーを反映しているため、古い無効化済み plugin レコードが、その他は有効な更新をブロックすることはありません。

更新済み Gateway が起動すると、plugin のロードは verify-only です。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりすることはありません。パッケージマネージャーの `update.run` 再起動は、パッケージツリーが差し替えられた後、通常の idle deferral と再起動 cooldown をバイパスするため、古いプロセスが削除済みチャンクを lazy-load し続けることはできません。

pnpm ブートストラップがそれでも失敗した場合、updater は checkout 内で `npm run build` を試す代わりに、パッケージマネージャー固有のエラーで早期停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（shell や launcher scripts に便利です）。

## 関連

- `openclaw doctor`（git checkout では、先に update を実行することを提案します）
- [開発チャンネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
