---
read_when:
- You want to update a source checkout safely
- "`--update` の shorthand の動作を理解する必要があります"
summary: "`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway 自動再起動）"
title: 更新
x-i18n:
  generated_at: '2026-04-26T11:27:14Z'
  refreshed_at: '2026-04-28T04:45:00Z'
  model: gpt-5.4
  provider: openai
  source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
  source_path: cli/update.md
  workflow: 15
---

# `openclaw update`

OpenClaw を安全に更新し、stable/beta/dev チャネルを切り替えます。

**npm/pnpm/bun** でインストールした場合（グローバルインストール、git メタデータなし）、
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

- `--no-restart`: 更新成功後の Gateway サービス再起動をスキップします。Gateway を再起動するパッケージマネージャー更新では、コマンドが成功する前に、再起動後のサービスが期待どおりの更新済みバージョンを報告することを確認します。
- `--channel <stable|beta|dev>`: 更新チャネルを設定します（git + npm、設定に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新に限ってパッケージターゲットを上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` にマップされます。
- `--dry-run`: 設定の書き込み、インストール、Plugin 同期、再起動を行わずに、予定されている更新アクション（チャネル/タグ/ターゲット/再起動フロー）をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSON を出力します。npm Plugin のアーティファクトドリフトが更新後の Plugin 同期中に検出された場合は、`postUpdate.plugins.integrityDrifts` も含まれます。
- `--timeout <seconds>`: 各ステップのタイムアウト（デフォルトは 1800 秒）。
- `--yes`: 確認プロンプトをスキップします（たとえばダウングレード確認）

注意: 古いバージョンは設定を壊す可能性があるため、ダウングレードには確認が必要です。

## `update status`

現在の更新チャネル + git タグ/ブランチ/SHA（ソースチェックアウトの場合）と、更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読な status JSON を出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルトは 3 秒）。

## `update wizard`

更新チャネルを選択し、更新後に Gateway を再起動するかどうかを確認する対話フローです
（デフォルトでは再起動します）。git チェックアウトなしで `dev` を選択すると、
それを作成するオプションが表示されます。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト `1800`）

## 動作内容

チャネルを明示的に切り替えると（`--channel ...`）、OpenClaw はインストール方法も
対応するように揃えます:

- `dev` → git チェックアウトを保証し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）、
  それを更新し、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使って npm からインストールします。
- `beta` → npm の dist-tag `beta` を優先しますが、beta が存在しない場合、または
  現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway コアの自動更新機能（config で有効な場合）は、この同じ更新パスを再利用します。

パッケージマネージャーインストールでは、`openclaw update` はパッケージマネージャーを呼び出す前に
ターゲットのパッケージバージョンを解決します。インストール済みバージョンがすでにターゲットと
一致している場合でも、このコマンドはグローバルパッケージインストールを更新し、
その後 Plugin 同期、補完更新、再起動処理を実行します。これにより、パッケージ版の
サイドカーとチャネル所有の Plugin レコードが、インストール済みの OpenClaw
ビルドと揃った状態に保たれます。

## Git チェックアウトフロー

チャネル:

- `stable`: 最新の非 beta タグをチェックアウトし、その後 build + doctor を実行します。
- `beta`: 最新の `-beta` タグを優先しますが、beta が存在しない場合やより古い場合は
  最新の stable タグにフォールバックします。
- `dev`: `main` をチェックアウトし、その後 fetch + rebase を行います。

概要:

1. クリーンな worktree が必要です（コミットされていない変更がないこと）。
2. 選択したチャネル（タグまたはブランチ）に切り替えます。
3. upstream を fetch します（dev のみ）。
4. dev のみ: 一時 worktree で preflight lint + TypeScript build を実行します。先端コミットが失敗した場合は、最大 10 コミットさかのぼって最新の正常ビルドを探します。
5. 選択したコミットに rebase します（dev のみ）。
6. リポジトリのパッケージマネージャーで依存関係をインストールします。pnpm チェックアウトでは、updater は pnpm workspace 内で `npm run build` を実行する代わりに、必要に応じて `pnpm` をブートストラップします（まず `corepack`、次に一時的な `npm install pnpm@10` フォールバック）。
7. build を実行し、Control UI も build します。
8. 最終の「安全な更新」チェックとして `openclaw doctor` を実行します。
9. アクティブなチャネルに Plugin を同期し（dev はバンドル済み Plugin を使用、stable/beta は npm を使用）、npm でインストールされた Plugin を更新します。

正確に固定された npm Plugin 更新が、保存されているインストール記録と整合性の異なるアーティファクトに解決された場合、`openclaw update` はその Plugin アーティファクト更新をインストールせず中止します。新しいアーティファクトを信頼できると確認した後でのみ、Plugin を明示的に再インストールまたは更新してください。

更新後の Plugin 同期が失敗すると、更新結果全体が失敗となり、再起動後続処理は停止します。Plugin のインストール/更新エラーを修正してから、`openclaw update` を再実行してください。

pnpm のブートストラップがそれでも失敗する場合、updater はチェックアウト内で `npm run build` を試す代わりに、パッケージマネージャー固有のエラーで早期停止するようになりました。

## `--update` shorthand

`openclaw --update` は `openclaw update` に書き換えられます（シェルやランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは先に update を実行することを提案します）
- [開発チャネル](/ja-JP/install/development-channels)
- [更新](/ja-JP/install/updating)
- [CLI リファレンス](/ja-JP/cli)
