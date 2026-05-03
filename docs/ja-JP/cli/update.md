---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`openclaw update` の出力またはオプションをデバッグしている'
    - '`--update` の省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-05-03T21:29:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャンネルを切り替えます。

**npm/pnpm/bun** でインストールした場合（グローバルインストール、git メタデータなし）、
更新は [更新](/ja-JP/install/updating) のパッケージマネージャーフローで行われます。

## 使い方

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

- `--no-restart`: 更新が成功した後に Gateway サービスを再起動しません。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動されたサービスが期待される更新後バージョンを報告することを確認します。
- `--channel <stable|beta|dev>`: 更新チャンネルを設定します（git + npm。設定に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新でのみパッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` に対応します。
- `--dry-run`: 設定の書き込み、インストール、plugins の同期、再起動を行わずに、予定されている更新アクション（チャンネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSON を出力します。更新後の plugin 同期中に npm plugin アーティファクトのドリフトが検出された場合は
  `postUpdate.plugins.integrityDrifts` も含まれます。
- `--timeout <seconds>`: ステップごとのタイムアウト（デフォルトは 1800 秒）。
- `--yes`: 確認プロンプトをスキップします（例: ダウングレード確認）。

`openclaw update` には `--verbose` フラグはありません。予定されているチャンネル/タグ/インストール/再起動アクションをプレビューするには `--dry-run`、機械可読な結果には `--json`、チャンネルと利用可否の詳細だけが必要な場合は `openclaw update status --json` を使用します。更新前後の Gateway ログをデバッグしている場合、コンソールの詳細度とファイルログレベルは別です。Gateway の `--verbose` は端末/WebSocket 出力に影響しますが、ファイルログには設定で `logging.level: "debug"` または `"trace"` が必要です。[Gateway ロギング](/ja-JP/gateway/logging) を参照してください。

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

有効な更新チャンネルと git タグ/ブランチ/SHA（ソースチェックアウトの場合）、および更新の利用可否を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読なステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3 秒）。

## `update wizard`

更新チャンネルを選択し、更新後に Gateway を再起動するかどうかを確認する対話フローです（デフォルトでは再起動します）。git チェックアウトなしで `dev` を選択した場合は、作成を提案します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 実行内容

チャンネルを明示的に切り替えると（`--channel ...`）、OpenClaw はインストール方法もそろえます。

- `dev` → git チェックアウトがあることを確認し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）、それを更新し、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使って npm からインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が存在しない、または現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway コアの自動更新機能（設定で有効な場合）は、実行中の Gateway リクエストハンドラーの外で CLI 更新パスを起動します。コントロールプレーンの `update.run` パッケージマネージャー更新では、パッケージ差し替え後に遅延なし、クールダウンなしの更新再起動を強制します。これは、古い Gateway プロセスが、新しいパッケージで削除されたファイルを指すメモリ内チャンクをまだ持っている可能性があるためです。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージバージョンを解決します。npm グローバルインストールではステージングインストールを使用します。OpenClaw は新しいパッケージを一時的な npm prefix にインストールし、そこでパッケージ化された `dist` インベントリを検証してから、そのクリーンなパッケージツリーを実際のグローバル prefix に差し替えます。検証に失敗した場合、更新後の doctor、plugin 同期、再起動処理は疑わしいツリーから実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、コマンドはグローバルパッケージインストールを更新し、その後 plugin 同期、コアコマンド補完の更新、再起動処理を実行します。これにより、パッケージ化されたサイドカーとチャンネル所有の plugin レコードを、インストール済みの OpenClaw ビルドとそろえたまま、完全な plugin コマンド補完の再ビルドは明示的な `openclaw completion --write-state` 実行に委ねます。

ローカルの管理対象 Gateway サービスがインストールされ、再起動が有効な場合、パッケージマネージャー更新は、パッケージツリーを置き換える前に実行中のサービスを停止します。その後、更新されたインストールからサービスメタデータを更新し、サービスを再起動し、成功を報告する前に、再起動された Gateway が期待されるバージョンを報告することを確認します。macOS では、更新後チェックにより、有効なプロファイルの LaunchAgent が読み込まれて実行中であり、設定済みの loopback ポートが正常であることも確認されます。plist がインストールされているが launchd がそれを監視していない場合、OpenClaw は LaunchAgent を自動的に再ブートストラップし、その後ヘルス/バージョン/チャンネル準備完了チェックを再実行します。新規ブートストラップでは RunAtLoad ジョブを直接読み込むため、更新リカバリーは新しく起動した Gateway に対してすぐに `kickstart -k` を実行しません。それでも Gateway が正常にならない場合、コマンドはゼロ以外で終了し、再起動ログパスに加えて、明示的な再起動、再インストール、パッケージロールバック手順を出力します。`--no-restart` を指定した場合、パッケージ置換は引き続き実行されますが、管理対象サービスは停止または再起動されないため、手動で再起動するまで、実行中の Gateway は古いコードを使い続ける可能性があります。

## Git チェックアウトフロー

### チャンネル選択

- `stable`: 最新の非 beta タグをチェックアウトし、その後ビルドと doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しないか古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を実行します。

### 更新ステップ

<Steps>
  <Step title="クリーンなワークツリーを検証">
    未コミットの変更がないことが必要です。
  </Step>
  <Step title="チャンネルを切り替え">
    選択したチャンネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="上流を取得">
    dev のみ。
  </Step>
  <Step title="事前ビルド（dev のみ）">
    一時ワークツリーで lint と TypeScript ビルドを実行します。先端が失敗した場合は、最大 10 コミットさかのぼって最新のクリーンビルドを探します。
  </Step>
  <Step title="Rebase">
    選択したコミットに rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトの場合、アップデーターは pnpm ワークスペース内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（まず `corepack`、次に一時的な `npm install pnpm@10` フォールバック）。
  </Step>
  <Step title="Control UI をビルド">
    Gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    `openclaw doctor` が最後の安全更新チェックとして実行されます。
  </Step>
  <Step title="plugins を同期">
    plugins を有効なチャンネルに同期します。dev は同梱 plugins を使用し、stable と beta は npm を使用します。追跡対象の plugin インストールを更新します。
  </Step>
</Steps>

beta 更新チャンネルでは、デフォルト/latest 系に従う追跡対象の npm および ClawHub plugin インストールは、まず plugin の `@beta` リリースを試します。plugin に beta リリースがない場合、OpenClaw は記録済みのデフォルト/latest spec にフォールバックします。正確なバージョンと明示的なタグは書き換えられません。

<Warning>
正確に固定された npm plugin 更新が、保存済みインストールレコードと integrity が異なるアーティファクトに解決された場合、`openclaw update` はその plugin アーティファクト更新をインストールせずに中止します。新しいアーティファクトを信頼できることを確認した後でのみ、plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
更新後の plugin 同期に失敗すると、更新結果は失敗となり、再起動の後続処理は停止します。plugin のインストールまたは更新エラーを修正してから、`openclaw update` を再実行してください。

更新された Gateway が起動するとき、plugin 読み込みは検証のみです。起動時にパッケージマネージャーを実行したり、依存関係ツリーを変更したりしません。パッケージマネージャーの `update.run` 再起動は、パッケージツリーが差し替えられた後、通常のアイドル遅延と再起動クールダウンをバイパスするため、古いプロセスが削除済みチャンクを遅延読み込みし続けることはできません。

pnpm ブートストラップがそれでも失敗する場合、アップデーターはチェックアウト内で `npm run build` を試すのではなく、パッケージマネージャー固有のエラーで早期停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトに便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは先に update を実行するよう提案します）
- [開発チャンネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
