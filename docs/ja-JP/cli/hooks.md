---
read_when:
    - エージェントフックを管理したい
    - フックの利用可否を確認する、またはワークスペースフックを有効にする場合
summary: '`openclaw hooks`（エージェントフック）の CLI リファレンス'
title: フック
x-i18n:
    generated_at: "2026-05-05T08:25:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

エージェントフック（`/new`、`/reset`、Gateway 起動などのコマンド向けイベント駆動自動化）を管理します。

サブコマンドなしで `openclaw hooks` を実行することは、`openclaw hooks list` と同等です。

関連:

- フック: [フック](/ja-JP/automation/hooks)
- Plugin フック: [Plugin フック](/ja-JP/plugins/hooks)

## すべてのフックを一覧表示

```bash
openclaw hooks list
```

ワークスペース、管理対象、追加、バンドル済みディレクトリから検出されたすべてのフックを一覧表示します。
Gateway 起動時、少なくとも 1 つの内部フックが設定されるまでは、内部フックハンドラーは読み込まれません。

**オプション:**

- `--eligible`: 適格なフック（要件を満たすもの）のみを表示
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

不適格なフックについて、不足している要件を表示します。

**例（JSON）:**

```bash
openclaw hooks list --json
```

プログラムから利用するための構造化 JSON を返します。

## フック情報を取得

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

## フックの適格性を確認

```bash
openclaw hooks check
```

フックの適格性ステータスの概要（準備完了と未準備の数）を表示します。

**オプション:**

- `--json`: JSON として出力

**出力例:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## フックを有効化

```bash
openclaw hooks enable <name>
```

特定のフックを設定（デフォルトでは `~/.openclaw/openclaw.json`）に追加して有効化します。

**注:** ワークスペースフックは、ここまたは設定で有効化されるまでデフォルトで無効です。Plugin によって管理されるフックは `openclaw hooks list` で `plugin:<id>` と表示され、ここでは有効化/無効化できません。代わりに Plugin を有効化/無効化してください。

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

**実行内容:**

- フックが存在し、適格であるかを確認
- 設定内の `hooks.internal.entries.<name>.enabled = true` を更新
- 設定をディスクに保存

フックが `<workspace>/hooks/` から来た場合、このオプトイン手順は
Gateway が読み込む前に必須です。

**有効化後:**

- フックが再読み込みされるように Gateway を再起動します（macOS ではメニューバーアプリの再起動、または開発環境では Gateway プロセスを再起動）。

## フックを無効化

```bash
openclaw hooks disable <name>
```

設定を更新して、特定のフックを無効化します。

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

- フックが再読み込みされるように Gateway を再起動します

## メモ

- `openclaw hooks list --json`、`info --json`、`check --json` は、構造化 JSON を直接 stdout に書き込みます。
- Plugin 管理のフックはここでは有効化または無効化できません。代わりに所有元の Plugin を有効化または無効化してください。

## フックパックをインストール

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

統合 Plugin インストーラーを通じてフックパックをインストールします。

`openclaw hooks install` は互換性エイリアスとして引き続き動作しますが、
非推奨警告を表示して `openclaw plugins install` に転送します。

npm 仕様は **レジストリのみ**（パッケージ名 + 任意の **正確なバージョン** または
**dist-tag**）です。Git/URL/file 仕様と semver 範囲は拒否されます。依存関係の
インストールは、シェルにグローバルな npm install 設定がある場合でも、安全のため `--ignore-scripts` 付きでプロジェクトローカルに実行されます。

裸の仕様と `@latest` は stable トラックに留まります。npm がそのどちらかを
プレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` などの
プレリリースタグまたは正確なプレリリースバージョンで明示的にオプトインするよう求めます。

**実行内容:**

- フックパックを `~/.openclaw/hooks/<id>` にコピー
- インストールされたフックを `hooks.internal.entries.*` で有効化
- インストールを `hooks.internal.installs` に記録

**オプション:**

- `-l, --link`: コピーする代わりにローカルディレクトリをリンク（`hooks.internal.load.extraDirs` に追加）
- `--pin`: npm インストールを、正確に解決された `name@version` として `hooks.internal.installs` に記録

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

リンクされたフックパックは、ワークスペースフックではなく、オペレーターが設定した
ディレクトリからの管理対象フックとして扱われます。

## フックパックを更新

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

追跡対象の npm ベースのフックパックを、統合 Plugin アップデーターを通じて更新します。

`openclaw hooks update` は互換性エイリアスとして引き続き動作しますが、
非推奨警告を表示して `openclaw plugins update` に転送します。

**オプション:**

- `--all`: 追跡対象のすべてのフックパックを更新
- `--dry-run`: 書き込まずに変更内容を表示

保存済みの整合性ハッシュが存在し、取得したアーティファクトのハッシュが変わった場合、
OpenClaw は警告を表示し、続行前に確認を求めます。CI/非対話実行でプロンプトをバイパスするには、
グローバル `--yes` を使用します。

## バンドル済みフック

### session-memory

`/new` または `/reset` を発行したときに、セッションコンテキストをメモリに保存します。

**有効化:**

```bash
openclaw hooks enable session-memory
```

**出力:** デフォルトでは `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`。モデル生成のファイル名スラッグを使うには `hooks.internal.entries.session-memory.llmSlug: true` を設定します。

**参照:** [session-memory ドキュメント](/ja-JP/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 中に追加のブートストラップファイル（たとえばモノレポローカルの `AGENTS.md` / `TOOLS.md`）を注入します。

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

Gateway の起動時（チャンネル起動後）に `BOOT.md` を実行します。

**イベント**: `gateway:startup`

**有効化**:

```bash
openclaw hooks enable boot-md
```

**参照:** [boot-md ドキュメント](/ja-JP/automation/hooks#boot-md)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [自動化フック](/ja-JP/automation/hooks)
