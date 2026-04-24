---
read_when:
    - ソースチェックアウトを安全に更新したい場合
    - '`--update` の短縮動作を理解する必要がある場合'
summary: '`openclaw update` のCLIリファレンス（比較的安全なソース更新 + Gateway自動再起動）'
title: 更新
x-i18n:
    generated_at: "2026-04-24T04:52:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

OpenClawを安全に更新し、stable/beta/devチャネルを切り替えます。

**npm/pnpm/bun**でインストールした場合（グローバルインストールでgitメタデータなし）、
更新は[Updating](/ja-JP/install/updating)のパッケージマネージャーフローで行われます。

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

- `--no-restart`: 更新成功後のGatewayサービス再起動をスキップします。
- `--channel <stable|beta|dev>`: 更新チャネルを設定します（git + npm。設定に永続化されます）。
- `--tag <dist-tag|version|spec>`: 今回の更新に限ってパッケージ対象を上書きします。パッケージインストールでは、`main`は`github:openclaw/openclaw#main`に対応します。
- `--dry-run`: 設定の書き込み、インストール、Plugin同期、再起動を行わずに、予定される更新アクション（チャネル/tag/対象/再起動フロー）をプレビューします。
- `--json`: 機械可読な`UpdateRunResult` JSONを出力します。これには、更新後のPlugin同期中にnpm Pluginアーティファクトのドリフトが検出された場合の`postUpdate.plugins.integrityDrifts`も含まれます。
- `--timeout <seconds>`: 各ステップのタイムアウト（デフォルト1200秒）。
- `--yes`: 確認プロンプトをスキップします（たとえばダウングレード確認）

注意: 古いバージョンは設定を壊す可能性があるため、ダウングレードには確認が必要です。

## `update status`

有効な更新チャネル + git tag/branch/SHA（ソースチェックアウトの場合）と、更新の可用性を表示します。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

オプション:

- `--json`: 機械可読なステータスJSONを出力します。
- `--timeout <seconds>`: チェックのタイムアウト（デフォルト3秒）。

## `update wizard`

更新チャネルを選択し、更新後にGatewayを再起動するか確認する対話フローです
（デフォルトは再起動）。gitチェックアウトなしで`dev`を選択した場合は、
作成を提案します。

オプション:

- `--timeout <seconds>`: 各更新ステップのタイムアウト（デフォルト`1200`）

## 何をするか

明示的にチャネルを切り替えるとき（`--channel ...`）、OpenClawは
インストール方法も整合させます。

- `dev` → gitチェックアウトを保証し（デフォルト: `~/openclaw`、`OPENCLAW_GIT_DIR`で上書き可能）、
  それを更新して、そのチェックアウトからグローバルCLIをインストールします。
- `stable` → `latest`を使ってnpmからインストールします。
- `beta` → npm dist-tag `beta`を優先しますが、betaが存在しないか現在のstableリリースより古い場合は
  `latest`にフォールバックします。

Gateway core自動更新機能（設定で有効化されている場合）は、同じ更新パスを再利用します。

パッケージマネージャーインストールでは、`openclaw update`はパッケージマネージャーを呼び出す前に
対象パッケージバージョンを解決します。インストール済みバージョンが対象と完全に一致し、
かつ更新チャネル変更の永続化も不要な場合、コマンドはパッケージインストール、
Plugin同期、完了更新、Gateway再起動処理の前にスキップとして終了します。

## Gitチェックアウトフロー

チャネル:

- `stable`: 最新の非betaタグをチェックアウトし、その後build + doctorを実行します。
- `beta`: 最新の`-beta`タグを優先しますが、betaが存在しないか古い場合は
  最新のstableタグにフォールバックします。
- `dev`: `main`をチェックアウトし、その後fetch + rebaseします。

概要:

1. クリーンなworktreeが必要です（未コミット変更なし）。
2. 選択したチャネル（タグまたはブランチ）に切り替えます。
3. upstreamをfetchします（devのみ）。
4. devのみ: 一時worktreeで事前lint + TypeScript buildを実行し、先端が失敗した場合は、最新のクリーンbuildを見つけるために最大10コミット戻ります。
5. 選択したコミットへrebaseします（devのみ）。
6. リポジトリのパッケージマネージャーで依存関係をインストールします。pnpmチェックアウトでは、updaterはpnpm workspace内で`npm run build`を実行する代わりに、必要に応じて`pnpm`をブートストラップします（まず`corepack`、その後一時的な`npm install pnpm@10`フォールバック）。
7. build + Control UIのbuildを実行します。
8. 最終的な「安全な更新」チェックとして`openclaw doctor`を実行します。
9. アクティブチャネルにPluginを同期し（devはバンドルPlugin、stable/betaはnpm）、npmインストール済みPluginを更新します。

厳密に固定されたnpm Plugin更新が、保存されたインストール記録と整合性が異なるアーティファクトに
解決された場合、`openclaw update`はそのPluginアーティファクト更新をインストールせずに中止します。
新しいアーティファクトを信頼できることを確認した後でのみ、Pluginを明示的に再インストールまたは更新してください。

pnpmブートストラップがそれでも失敗した場合、updaterはチェックアウト内で`npm run build`を試す代わりに、
パッケージマネージャー固有のエラーで早期停止します。

## `--update`短縮形

`openclaw --update`は`openclaw update`に書き換えられます（シェルやランチャースクリプトで便利です）。

## 関連

- `openclaw doctor`（gitチェックアウトでは最初にupdateを実行する提案を行います）
- [Development channels](/ja-JP/install/development-channels)
- [Updating](/ja-JP/install/updating)
- [CLI reference](/ja-JP/cli)
