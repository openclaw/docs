---
read_when:
    - エージェントフックを管理したい場合
    - フックの利用可否を確認したい場合、またはワークスペースフックを有効にしたい場合
summary: '`openclaw hooks` の CLI リファレンス（エージェントフック）'
title: フック
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:26:27Z"
  model: gpt-5.4
  provider: openai
  source_hash: 874c3c7e7b603066209857e8b8b39bbe23eb8d1eda148025c74907c05bacd8f2
  source_path: cli/hooks.md
  workflow: 15
---

# `openclaw hooks`

エージェントフック（`/new`、`/reset`、および Gateway 起動のようなコマンドに対するイベント駆動型自動化）を管理します。

サブコマンドなしで `openclaw hooks` を実行すると、`openclaw hooks list` と同等です。

関連:

- フック: [フック](/ja-JP/automation/hooks)
- Plugin フック: [Plugin hooks](/ja-JP/plugins/hooks)

## すべてのフックを一覧表示

```bash
openclaw hooks list
```

ワークスペース、管理済み、追加、およびバンドル済みディレクトリから検出されたすべてのフックを一覧表示します。
少なくとも 1 つの内部フックが設定されるまで、Gateway 起動時には内部フックハンドラーは読み込まれません。

**オプション:**

- `--eligible`: 適格なフックのみを表示（要件を満たしているもの）
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

**例（詳細表示）:**

```bash
openclaw hooks list --verbose
```

適格でないフックに不足している要件を表示します。

**例（JSON）:**

```bash
openclaw hooks list --json
```

プログラムで利用できる構造化 JSON を返します。

## フック情報を取得

```bash
openclaw hooks info <name>
```

特定のフックの詳細情報を表示します。

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

フックの適格性ステータスの要約（利用可能数と利用不可数）を表示します。

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

設定（デフォルトでは `~/.openclaw/openclaw.json`）に追加して、特定のフックを有効化します。

**注:** ワークスペースフックは、ここまたは config で有効化されるまでデフォルトで無効です。Plugin によって管理されるフックは `openclaw hooks list` に `plugin:<id>` と表示され、ここでは有効化/無効化できません。代わりに Plugin を有効化/無効化してください。

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

- フックが存在し、適格かどうかを確認
- config の `hooks.internal.entries.<name>.enabled = true` を更新
- config をディスクに保存

フックが `<workspace>/hooks/` 由来の場合、Gateway がそれを読み込む前に
このオプトイン手順が必要です。

**有効化後:**

- フックを再読み込みするために Gateway を再起動してください（macOS ではメニューバーアプリを再起動、開発環境では Gateway プロセスを再起動）。

## フックを無効化

```bash
openclaw hooks disable <name>
```

config を更新して特定のフックを無効化します。

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

- フックを再読み込みするために Gateway を再起動してください

## 注意

- `openclaw hooks list --json`、`info --json`、および `check --json` は、構造化 JSON を直接 stdout に書き出します。
- Plugin 管理フックはここでは有効化または無効化できません。代わりに所有元の Plugin を有効化または無効化してください。

## Hook pack をインストール

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

統一された Plugin インストーラーを通じて Hook pack をインストールします。

`openclaw hooks install` も互換性エイリアスとして引き続き利用できますが、
非推奨警告を表示したうえで `openclaw plugins install` に転送されます。

npm spec は**レジストリ専用**です（パッケージ名 + 任意の**正確なバージョン**または
**dist-tag**）。Git/URL/file spec および semver range は拒否されます。依存関係の
インストールは、安全のため、シェルにグローバル npm install 設定があっても
`--ignore-scripts` を付けてプロジェクトローカルで実行されます。

bare spec と `@latest` は安定トラックのままです。npm がこれらのいずれかを prerelease に解決した場合、OpenClaw は停止し、`@beta`/`@rc` のような prerelease tag または正確な prerelease バージョンで明示的にオプトインするよう求めます。

**実行内容:**

- Hook pack を `~/.openclaw/hooks/<id>` にコピー
- インストールしたフックを `hooks.internal.entries.*` で有効化
- インストール内容を `hooks.internal.installs` に記録

**オプション:**

- `-l, --link`: コピーせずにローカルディレクトリをリンクします（`hooks.internal.load.extraDirs` に追加）
- `--pin`: npm インストールを、解決済みの正確な `name@version` として `hooks.internal.installs` に記録

**サポートされるアーカイブ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**例:**

```bash
# ローカルディレクトリ
openclaw plugins install ./my-hook-pack

# ローカルアーカイブ
openclaw plugins install ./my-hook-pack.zip

# NPM パッケージ
openclaw plugins install @openclaw/my-hook-pack

# コピーせずにローカルディレクトリをリンク
openclaw plugins install -l ./my-hook-pack
```

リンクされた Hook pack は、ワークスペースフックではなく、オペレーター設定ディレクトリからの管理フックとして扱われます。

## Hook pack を更新

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

統一された Plugin アップデーターを通じて、追跡中の npm ベース Hook pack を更新します。

`openclaw hooks update` も互換性エイリアスとして引き続き利用できますが、
非推奨警告を表示したうえで `openclaw plugins update` に転送されます。

**オプション:**

- `--all`: 追跡中のすべての Hook pack を更新
- `--dry-run`: 書き込みを行わず、何が変わるかを表示

保存済みの整合性ハッシュが存在し、取得したアーティファクトのハッシュが変わった場合、
OpenClaw は警告を表示し、続行前に確認を求めます。CI/非対話実行で
プロンプトを回避するには、グローバル `--yes` を使用してください。

## バンドル済みフック

### session-memory

`/new` または `/reset` を発行したときに、セッションコンテキストを memory に保存します。

**有効化:**

```bash
openclaw hooks enable session-memory
```

**出力:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参照:** [session-memory documentation](/ja-JP/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 中に追加の bootstrap ファイル（たとえば monorepo ローカルの `AGENTS.md` / `TOOLS.md`）を注入します。

**有効化:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参照:** [bootstrap-extra-files documentation](/ja-JP/automation/hooks#bootstrap-extra-files)

### command-logger

すべてのコマンドイベントを中央監査ファイルに記録します。

**有効化:**

```bash
openclaw hooks enable command-logger
```

**出力:** `~/.openclaw/logs/commands.log`

**ログの表示:**

```bash
# 最近のコマンド
tail -n 20 ~/.openclaw/logs/commands.log

# 整形表示
cat ~/.openclaw/logs/commands.log | jq .

# アクションで絞り込み
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参照:** [command-logger documentation](/ja-JP/automation/hooks#command-logger)

### boot-md

Gateway の起動時（チャンネル起動後）に `BOOT.md` を実行します。

**イベント**: `gateway:startup`

**有効化**:

```bash
openclaw hooks enable boot-md
```

**参照:** [boot-md documentation](/ja-JP/automation/hooks#boot-md)

## 関連

- [CLI reference](/ja-JP/cli)
- [Automation hooks](/ja-JP/automation/hooks)
