---
read_when:
    - ソースチェックアウトを比較的安全に更新したい場合
    - '`--update` の短縮動作を理解する必要がある'
summary: '`openclaw update` の CLI リファレンス（比較的安全なソース更新 + Gateway 自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-04-23T14:03:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: abcfbd2fb66f560f2c6e9d78d37355510d78946eaeafa17d67fe36bc158ad5cd
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClaw を比較的安全に更新し、stable/beta/dev チャネルを切り替えます。

**npm/pnpm/bun**（グローバルインストール、git メタデータなし）経由でインストールした場合、
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

- `--no-restart`: 更新成功後の Gateway service の再起動をスキップします。
- `--channel <stable|beta|dev>`: 更新チャネルを設定します（git + npm。config に永続化されます）。
- `--tag <dist-tag|version|spec>`: この更新に限ってパッケージ target を上書きします。パッケージインストールでは、`main` は `github:openclaw/openclaw#main` に対応します。
- `--dry-run`: config の書き込み、インストール、Plugin の同期、再起動を行わずに、予定されている更新アクション（channel/tag/target/restart フロー）をプレビューします。
- `--json`: 機械可読な `UpdateRunResult` JSON を出力します。これには、更新後の Plugin 同期中に npm Plugin artifact drift が検出された場合の `postUpdate.plugins.integrityDrifts` が含まれます。
- `--timeout <seconds>`: ステップごとの timeout（デフォルトは 1200 秒）。
- `--yes`: 確認プロンプトをスキップします（たとえば downgrade 確認）。

注: 古いバージョンは設定を壊す可能性があるため、downgrade には確認が必要です。

## `update status`

現在の更新チャネルに加え、git tag/branch/SHA（ソースチェックアウトの場合）と更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読な status JSON を出力します。
- `--timeout <seconds>`: チェック用 timeout（デフォルトは 3 秒）。

## `update wizard`

更新チャネルを選択し、更新後に Gateway を再起動するかどうか（デフォルトでは再起動）を確認する対話型フローです。git チェックアウトなしで `dev` を選択すると、
作成を提案します。

オプション:

- `--timeout <seconds>`: 各更新ステップの timeout（デフォルト `1200`）

## これが行うこと

明示的にチャネルを切り替える（`--channel ...`）と、OpenClaw は
インストール方法も整合させます:

- `dev` → git チェックアウトを保証し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR` で上書き可能）、
  それを更新して、そのチェックアウトからグローバル CLI をインストールします。
- `stable` → `latest` を使って npm からインストールします。
- `beta` → npm の dist-tag `beta` を優先しますが、beta が
  存在しないか現在の stable リリースより古い場合は `latest` にフォールバックします。

Gateway core auto-updater（config で有効な場合）は、この同じ更新経路を再利用します。

パッケージマネージャーによるインストールでは、`openclaw update` は
パッケージマネージャーを呼び出す前に対象パッケージのバージョンを解決します。インストール済みバージョンが
対象と完全一致し、永続化が必要な更新チャネル変更もない場合、
このコマンドはパッケージインストール、Plugin 同期、completion refresh、
Gateway 再起動処理の前に skipped として終了します。

## git チェックアウトフロー

チャネル:

- `stable`: 最新の非 beta tag を checkout し、その後 build + doctor を実行します。
- `beta`: 最新の `-beta` tag を優先しますが、beta が存在しないか古い場合は最新 stable tag
  にフォールバックします。
- `dev`: `main` を checkout し、その後 fetch + rebase を実行します。

概要:

1. クリーンな worktree（コミットされていない変更なし）が必要です。
2. 選択したチャネル（tag または branch）に切り替えます。
3. upstream を fetch します（dev のみ）。
4. dev のみ: 一時 worktree で preflight lint + TypeScript build を実行し、tip が失敗した場合は、最新のクリーン build を見つけるために最大 10 コミットまでさかのぼります。
5. 選択したコミットに rebase します（dev のみ）。
6. repo のパッケージマネージャーで deps をインストールします。pnpm チェックアウトでは、updater は pnpm workspace 内で `npm run build` を実行する代わりに、必要に応じて `pnpm` を bootstrap します（まず `corepack`、次に一時的な `npm install pnpm@10` フォールバック）。
7. build + Control UI の build を実行します。
8. 最終的な「安全な更新」チェックとして `openclaw doctor` を実行します。
9. Plugin をアクティブチャネルに同期し（dev は同梱 Plugin、stable/beta は npm を使用）、npm インストールされた Plugin を更新します。

完全一致の pin された npm Plugin 更新が、保存されたインストール記録と
integrity が異なる artifact に解決された場合、`openclaw update` はその Plugin
artifact 更新をインストールせずに中止します。新しい artifact を信頼できることを確認してから、
Plugin を明示的に再インストールまたは更新してください。

pnpm bootstrap がそれでも失敗する場合、updater は
チェックアウト内で `npm run build` を試す代わりに、パッケージマネージャー固有のエラーで早期停止します。

## `--update` 短縮記法

`openclaw --update` は `openclaw update` に書き換えられます（shell や launcher script で便利です）。

## 関連

- `openclaw doctor`（git チェックアウトでは、先に update を実行することを提案します）
- [Development channels](/ja-JP/install/development-channels)
- [Updating](/ja-JP/install/updating)
- [CLI reference](/ja-JP/cli)
