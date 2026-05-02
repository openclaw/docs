---
read_when:
    - エージェントフックを管理したい
    - フックの利用可否を確認する、またはワークスペースフックを有効にする場合
summary: '`openclaw hooks`（エージェントフック）の CLI リファレンス'
title: フック
x-i18n:
    generated_at: "2026-05-02T20:43:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b02c176b4a310adba3fa1fde3758f6c8a19d454aeec58e919458b3f1a66c87d
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

エージェントフック（`/new`、`/reset`、Gateway 起動などのコマンド向けのイベント駆動自動化）を管理します。

サブコマンドなしで `openclaw hooks` を実行すると、`openclaw hooks list` と同じ動作になります。

関連:

- フック: [フック](/ja-JP/automation/hooks)
- Plugin フック: [Plugin フック](/ja-JP/plugins/hooks)

## すべてのフックを一覧表示する

```bash
openclaw hooks list
```

ワークスペース、管理対象、追加、バンドル済みディレクトリから検出されたすべてのフックを一覧表示します。
Gateway 起動時は、少なくとも 1 つの内部フックが構成されるまで内部フックハンドラーを読み込みません。

**オプション:**

- `--eligible`: 対象となるフック（要件を満たしているもの）のみを表示
- `--json`: JSON として出力
- `-v, --verbose`: 不足している要件を含む詳細情報を表示

**出力例:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**例（詳細）:**

```bash
openclaw hooks list --verbose
```

対象外のフックについて不足している要件を表示します。

**例（JSON）:**

```bash
openclaw hooks list --json
```

プログラムから利用するための構造化 JSON を返します。

## フック情報を取得する

```bash
openclaw hooks info <name>
```

特定のフックに関する詳細情報を表示します。

**引数:**

- `<name>`: フック名またはフックキー（例: `session-memory`）

**オプション:**

- `--json`: JSON として出力

**例:**

```bash
openclaw hooks info session-memory
```

**出力:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## フックの対象可否を確認する

```bash
openclaw hooks check
```

フックの対象可否ステータスの概要（準備完了と未準備の数）を表示します。

**オプション:**

- `--json`: JSON として出力

**出力例:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## フックを有効化する

```bash
openclaw hooks enable <name>
```

構成（デフォルトでは `~/.openclaw/openclaw.json`）に追加して、特定のフックを有効化します。

**注:** ワークスペースフックは、ここまたは構成で有効化されるまでデフォルトで無効です。Plugin が管理するフックは `openclaw hooks list` で `plugin:<id>` と表示され、ここでは有効化/無効化できません。代わりに Plugin を有効化/無効化してください。

**引数:**

- `<name>`: フック名（例: `session-memory`）

**例:**

```bash
openclaw hooks enable session-memory
```

**出力:**

```
✓ Enabled hook: 💾 session-memory
```

**処理内容:**

- フックが存在し、対象となるかを確認する
- 構成内の `hooks.internal.entries.<name>.enabled = true` を更新する
- 構成をディスクに保存する

フックが `<workspace>/hooks/` から来ている場合、Gateway がそのフックを読み込む前にこのオプトイン手順が必要です。

**有効化後:**

- フックを再読み込みするために Gateway を再起動します（macOS ではメニューバーアプリを再起動するか、開発中は Gateway プロセスを再起動します）。

## フックを無効化する

```bash
openclaw hooks disable <name>
```

構成を更新して、特定のフックを無効化します。

**引数:**

- `<name>`: フック名（例: `command-logger`）

**例:**

```bash
openclaw hooks disable command-logger
```

**出力:**

```
⏸ Disabled hook: 📝 command-logger
```

**無効化後:**

- フックを再読み込みするために Gateway を再起動します

## 注記

- `openclaw hooks list --json`、`info --json`、`check --json` は、構造化 JSON を stdout に直接書き込みます。
- Plugin 管理のフックはここでは有効化または無効化できません。代わりに所有元の Plugin を有効化または無効化してください。

## フックパックをインストールする

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

統合 plugins インストーラーを通じてフックパックをインストールします。

`openclaw hooks install` は互換性エイリアスとして引き続き動作しますが、非推奨警告を表示し、`openclaw plugins install` に転送します。

Npm 仕様は**レジストリ専用**（パッケージ名 + 任意の**正確なバージョン**または**dist-tag**）です。Git/URL/file 仕様と semver 範囲は拒否されます。依存関係のインストールは、安全のため、シェルにグローバルな npm インストール設定がある場合でも `--ignore-scripts` 付きでプロジェクトローカルに実行されます。

ベア仕様と `@latest` は安定版トラックに留まります。npm がそれらのいずれかをプレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグまたは正確なプレリリースバージョンを使って明示的にオプトインするよう求めます。

**処理内容:**

- フックパックを `~/.openclaw/hooks/<id>` にコピーする
- インストール済みフックを `hooks.internal.entries.*` で有効化する
- インストールを `hooks.internal.installs` に記録する

**オプション:**

- `-l, --link`: コピーする代わりにローカルディレクトリをリンクする（`hooks.internal.load.extraDirs` に追加）
- `--pin`: npm インストールを、解決された正確な `name@version` として `hooks.internal.installs` に記録する

**対応アーカイブ:** `.zip`、`.tgz`、`.tar.gz`、`.tar`

**例:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

リンクされたフックパックは、ワークスペースフックではなく、運用者が構成したディレクトリからの管理対象フックとして扱われます。

## フックパックを更新する

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

追跡対象の npm ベースのフックパックを、統合 plugins アップデーターを通じて更新します。

`openclaw hooks update` は互換性エイリアスとして引き続き動作しますが、非推奨警告を表示し、`openclaw plugins update` に転送します。

**オプション:**

- `--all`: 追跡対象のすべてのフックパックを更新
- `--dry-run`: 書き込まずに変更内容を表示

保存済みの整合性ハッシュが存在し、取得したアーティファクトのハッシュが変わった場合、OpenClaw は警告を表示し、続行前に確認を求めます。CI/非対話実行でプロンプトを省略するには、グローバル `--yes` を使用してください。

## バンドル済みフック

### session-memory

`/new` または `/reset` を実行したときに、セッションコンテキストをメモリに保存します。

**有効化:**

```bash
openclaw hooks enable session-memory
```

**出力:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参照:** [session-memory ドキュメント](/ja-JP/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 中に追加のブートストラップファイル（たとえば monorepo ローカルの `AGENTS.md` / `TOOLS.md`）を注入します。

**有効化:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参照:** [bootstrap-extra-files ドキュメント](/ja-JP/automation/hooks#bootstrap-extra-files)

### command-logger

すべてのコマンドイベントを集中監査ファイルに記録します。

**有効化:**

```bash
openclaw hooks enable command-logger
```

**出力:** `~/.openclaw/logs/commands.log`

**ログを表示:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参照:** [command-logger ドキュメント](/ja-JP/automation/hooks#command-logger)

### boot-md

Gateway が起動したとき（チャンネル起動後）に `BOOT.md` を実行します。

**イベント**: `gateway:startup`

**有効化**:

```bash
openclaw hooks enable boot-md
```

**参照:** [boot-md ドキュメント](/ja-JP/automation/hooks#boot-md)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [自動化フック](/ja-JP/automation/hooks)
