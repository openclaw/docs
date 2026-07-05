---
read_when:
    - エージェントフックを管理したい
    - フックの可用性を確認するか、ワークスペースフックを有効にしたい場合
summary: '`openclaw hooks`（エージェントフック）の CLI リファレンス'
title: フック
x-i18n:
    generated_at: "2026-07-05T11:12:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

エージェントフック（`/new`、`/reset`、Gateway 起動などのコマンド向けイベント駆動型自動化）を管理します。引数なしの `openclaw hooks` は `openclaw hooks list` と同等です。

関連: [フック](/ja-JP/automation/hooks) - [Plugin フック](/ja-JP/plugins/hooks)

## フック一覧

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

ワークスペース、管理対象、追加、バンドル済みディレクトリから検出されたフックを一覧表示します。

- `--eligible`: 要件を満たしているフックのみ。
- `--json`: 構造化された出力。
- `-v, --verbose`: 未満足の要件を示す Missing 列を含めます。

```
Hooks (4/5 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject additional workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

## フック情報を取得

```bash
openclaw hooks info <name> [--json]
```

`<name>` はフック名またはフックキー（例: `session-memory`）です。ソース、ファイル/ハンドラーパス、ホームページ、イベント、要件ごとのステータス（バイナリ、env、config、OS）を表示します。

## 適格性を確認

```bash
openclaw hooks check [--json]
```

準備完了/未完了の件数サマリーを出力します。準備未完了のフックがある場合は、それぞれのブロック理由を一覧表示します。

## フックを有効化

```bash
openclaw hooks enable <name>
```

config の `hooks.internal.entries.<name>.enabled = true` を追加/更新し、`hooks.internal.enabled` のマスタースイッチもオンにします（少なくとも 1 つが設定されるまで、Gateway は内部フックハンドラーを読み込みません）。フックが存在しない、Plugin 管理である、または適格でない（要件不足）場合は失敗します。

Plugin 管理のフックは `hooks list` で `plugin:<id>` と表示され、ここでは有効化/無効化できません。代わりに所有元の Plugin を有効化または無効化してください。

有効化後は、フックを再読み込みするために Gateway を再起動してください（macOS メニューバーアプリの再起動、または dev で Gateway プロセスを再起動）。

## フックを無効化

```bash
openclaw hooks disable <name>
```

`hooks.internal.entries.<name>.enabled = false` を設定します。その後 Gateway を再起動してください。

## フックパックをインストールおよび更新

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin resolved version
openclaw plugins install <path>           # local directory or archive
openclaw plugins install -l <path>        # link a local directory instead of copying

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

フックパックは統合された plugins インストーラー/アップデーターを通じてインストールされます。`openclaw hooks install` / `openclaw hooks update` は、警告を出力して `plugins` コマンドへ転送する非推奨のエイリアスとして引き続き動作します。

- Npm spec はレジストリ専用です。パッケージ名に、任意で正確なバージョンまたは dist-tag を付けられます。Git/URL/file spec と semver 範囲は拒否されます。依存関係のインストールはプロジェクトローカルで `--ignore-scripts` を付けて実行されます。
- 裸の spec と `@latest` は stable トラックに留まります。npm が prerelease に解決した場合、OpenClaw は停止し、明示的な opt in（`@beta`、`@rc`、または正確な prerelease バージョン）を求めます。
- サポートされるアーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。
- `-l, --link` はローカルディレクトリをコピーする代わりにリンクします（`hooks.internal.load.extraDirs` に追加します）。リンクされたフックパックは、ワークスペースフックではなく、オペレーターが設定したディレクトリからの管理対象フックです。
- `--pin` は npm インストールを、正確に解決された `name@version` として `hooks.internal.installs` に記録します。
- インストールでは、パックを `~/.openclaw/hooks/<id>` にコピーし、そのフックを `hooks.internal.entries.*` 配下で有効化し、インストール内容を `hooks.internal.installs` に記録します。
- 保存済みの整合性ハッシュが取得したアーティファクトと一致しなくなった場合、OpenClaw は警告して続行前に確認します。プロンプトを回避するには、グローバル `--yes` を渡してください（例: CI）。

## バンドル済みフック

| フック                | イベント                                          | 動作                                                                                               |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | 設定済みの各エージェントスコープについて、Gateway 起動時に `BOOT.md` を実行します                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | エージェントのブートストラップ中に追加のブートストラップファイル（例: monorepo `AGENTS.md`/`TOOLS.md`）を注入します |
| command-logger        | `command`                                         | コマンドイベントを `~/.openclaw/logs/commands.log` に記録します                                   |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | セッション Compaction の開始時と完了時に、表示可能なチャット通知を送信します                      |
| session-memory        | `command:new`, `command:reset`                    | `/new` または `/reset` でセッションコンテキストをメモリに保存します                               |

任意のバンドル済みフックは `openclaw hooks enable <hook-name>` で有効化できます。詳細、config キー、デフォルト: [バンドル済みフック](/ja-JP/automation/hooks#bundled-hooks)。

### command-logger ログファイル

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # recent commands
cat ~/.openclaw/logs/commands.log | jq .          # pretty-print
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filter by action
```

## 注意事項

- `hooks list --json`、`info --json`、`check --json` は、構造化された JSON を直接 stdout に書き込みます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [自動化フック](/ja-JP/automation/hooks)
