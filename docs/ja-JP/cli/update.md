---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`--update` の省略記法の動作を理解する必要があります'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway の自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-04-30T05:06:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャネルを切り替えます。

**npm/pnpm/bun**（グローバルインストール、git メタデータなし）でインストールした場合、
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

- `--no-restart`: 更新が成功した後に Gateway サービスの再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動されたサービスが想定される更新後バージョンを報告することを検証します。
- `--channel <stable|beta|dev>`: 更新チャネルを設定します（git + npm。設定に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新だけ、パッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` に対応します。
- `--dry-run`: 設定の書き込み、インストール、plugins の同期、再起動を行わずに、予定されている更新アクション（チャネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSON を出力します。更新後の plugin 同期中に npm plugin アーティファクトのドリフトが検出された場合は、
  `postUpdate.plugins.integrityDrifts` も含まれます。
- `--timeout <seconds>`: ステップごとのタイムアウトです（デフォルトは 1800s）。
- `--yes`: 確認プロンプト（例: ダウングレード確認）をスキップします。

<Warning>
古いバージョンでは設定が壊れる可能性があるため、ダウングレードには確認が必要です。
</Warning>

## `update status`

有効な更新チャネル + git タグ/ブランチ/SHA（ソースチェックアウトの場合）に加えて、更新の有無を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読なステータス JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウトです（デフォルトは 3s）。

## `update wizard`

更新チャネルを選択し、更新後に Gateway を再起動するかどうかを確認する対話型フローです
（デフォルトは再起動）。git チェックアウトなしで `dev` を選択した場合は、
作成するかどうかを提示します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウトです（デフォルト `1800`）

## 実行内容

チャネルを明示的に切り替える場合（`--channel ...`）、OpenClaw は
インストール方法も整合させます。

- `dev` → git チェックアウト（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き）を確保し、
  それを更新して、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使用して npm からインストールします。
- `beta` → npm dist-tag `beta` を優先しますが、beta が存在しない、または現在の stable リリースより古い場合は
  `latest` にフォールバックします。

Gateway コアの自動更新機能（設定で有効な場合）は、この同じ更新パスを再利用します。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前にターゲットパッケージ
バージョンを解決します。npm グローバルインストールは段階的インストールを使用します。
OpenClaw は新しいパッケージを一時 npm prefix にインストールし、そこでパッケージ化された `dist` インベントリを検証してから、
そのクリーンなパッケージツリーを実際のグローバル prefix に入れ替えます。検証に失敗した場合、更新後の doctor、plugin 同期、
再起動作業は疑わしいツリーから実行されません。インストール済みバージョンがすでにターゲットと一致している場合でも、
コマンドはグローバルパッケージインストールを更新し、その後に plugin 同期、コアコマンド補完の更新、再起動作業を実行します。
これにより、パッケージ化されたサイドカーとチャネル所有の plugin レコードが、インストール済み OpenClaw ビルドと整合した状態に保たれます。
一方で、完全な plugin コマンド補完の再構築は、明示的な `openclaw completion --write-state` 実行に委ねられます。

ローカルの管理対象 Gateway サービスがインストールされており、再起動が有効な場合、
パッケージマネージャー更新はパッケージツリーを置き換える前に実行中のサービスを停止し、
更新後のインストールからサービスメタデータを更新して、サービスを再起動し、再起動された Gateway が想定バージョンを報告することを検証します。
`--no-restart` を指定すると、パッケージ置換は引き続き実行されますが、管理対象サービスは停止または再起動されません。
そのため、手動で再起動するまで、実行中の Gateway は古いコードを使い続ける可能性があります。

## git チェックアウトフロー

### チャネル選択

- `stable`: 最新の非 beta タグをチェックアウトし、その後ビルドして doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しない、または古い場合は最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch と rebase を実行します。

### 更新ステップ

<Steps>
  <Step title="クリーンな作業ツリーを検証">
    未コミットの変更がないことを要求します。
  </Step>
  <Step title="チャネルを切り替え">
    選択したチャネル（タグまたはブランチ）に切り替えます。
  </Step>
  <Step title="upstream を fetch">
    Dev のみ。
  </Step>
  <Step title="事前ビルド（dev のみ）">
    一時 worktree で lint と TypeScript ビルドを実行します。先端が失敗した場合、最大 10 コミットまで戻って、最新のクリーンなビルドを探します。
  </Step>
  <Step title="Rebase">
    選択したコミットに rebase します（dev のみ）。
  </Step>
  <Step title="依存関係をインストール">
    リポジトリのパッケージマネージャーを使用します。pnpm チェックアウトでは、アップデーターは pnpm ワークスペース内で `npm run build` を実行するのではなく、必要に応じて `pnpm` をブートストラップします（まず `corepack`、次に一時的な `npm install pnpm@10` フォールバック）。
  </Step>
  <Step title="Control UI をビルド">
    Gateway と Control UI をビルドします。
  </Step>
  <Step title="doctor を実行">
    `openclaw doctor` は最後の安全更新チェックとして実行されます。
  </Step>
  <Step title="plugins を同期">
    plugins を有効なチャネルに同期します。Dev は同梱 plugins を使用し、stable と beta は npm を使用します。npm インストール済み plugins を更新します。
  </Step>
</Steps>

<Warning>
正確に pin された npm plugin 更新が、保存済みインストールレコードと整合性が異なるアーティファクトに解決された場合、`openclaw update` はそれをインストールせず、その plugin アーティファクト更新を中止します。新しいアーティファクトを信頼できることを検証した後にのみ、plugin を明示的に再インストールまたは更新してください。
</Warning>

<Note>
更新後の plugin 同期失敗は更新結果を失敗にし、再起動の後続作業を停止します。plugin のインストールまたは更新エラーを修正してから、`openclaw update` を再実行してください。

更新後の Gateway が起動すると、有効な同梱 plugin ランタイム依存関係は plugin の有効化前にステージングされます。更新によってトリガーされた再起動は、Gateway を閉じる前にアクティブなランタイム依存関係のステージングをすべて完了させるため、サービスマネージャーによる再起動が進行中の npm install を中断することはありません。

pnpm ブートストラップがそれでも失敗する場合、アップデーターはチェックアウト内で `npm run build` を試すのではなく、パッケージマネージャー固有のエラーで早期に停止します。
</Note>

## `--update` 省略形

`openclaw --update` は `openclaw update` に書き換えられます（shell やランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは、先に update を実行することを提案します）
- [開発チャネル](/ja-JP/install/development-channels)
- [Updating](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
