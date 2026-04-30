---
read_when:
    - エージェントフックを管理したい
    - フックの利用可否を確認するか、ワークスペースフックを有効にしたい場合
summary: '`openclaw hooks` の CLI リファレンス（エージェントフック）'
title: フック
x-i18n:
    generated_at: "2026-04-30T05:04:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
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

ワークスペース、管理対象、追加、同梱ディレクトリから検出されたすべてのフックを一覧表示します。
Gateway 起動時は、少なくとも 1 つの内部フックが設定されるまで内部フックハンドラーを読み込みません。

**オプション:**

- `--eligible`: 対象フック（要件を満たしているもの）のみを表示
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

対象外フックについて、不足している要件を表示します。

**例（JSON）:**

```bash
openclaw hooks list --json
```

プログラムで利用するための構造化 JSON を返します。

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

## フックの対象可否を確認

```bash
openclaw hooks check
```

フックの対象可否ステータスの概要（準備完了数と未準備数）を表示します。

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

- フックが存在し、対象であるかを確認します
- 設定内の `hooks.internal.entries.<name>.enabled = true` を更新します
- 設定をディスクに保存します

フックが `<workspace>/hooks/` 由来の場合、Gateway がそれを読み込む前にこのオプトイン手順が必要です。

**有効化後:**

- フックが再読み込みされるように Gateway を再起動します（macOS ではメニューバーアプリを再起動、または開発環境の Gateway プロセスを再起動）。

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

## 注記

- `openclaw hooks list --json`、`info --json`、`check --json` は、構造化 JSON を stdout に直接書き込みます。
- Plugin 管理のフックはここでは有効化または無効化できません。代わりに所有元の Plugin を有効化または無効化してください。

## フックパックをインストール

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

統合 plugins インストーラーを通じてフックパックをインストールします。

`openclaw hooks install` は互換エイリアスとして引き続き動作しますが、非推奨警告を出力して `openclaw plugins install` に転送します。

npm 仕様は**レジストリ限定**（パッケージ名 + 任意の**正確なバージョン**または**dist-tag**）です。Git/URL/file 仕様と semver 範囲は拒否されます。シェルにグローバル npm インストール設定がある場合でも、依存関係のインストールは安全のため project-local で `--ignore-scripts` を付けて実行されます。

裸の仕様と `@latest` は安定版トラックに留まります。npm がそのいずれかをプレリリースに解決した場合、OpenClaw は停止し、`@beta`/`@rc` のようなプレリリースタグまたは正確なプレリリースバージョンで明示的にオプトインするよう求めます。

**実行内容:**

- フックパックを `~/.openclaw/hooks/<id>` にコピーします
- インストールされたフックを `hooks.internal.entries.*` で有効化します
- インストールを `hooks.internal.installs` に記録します

**オプション:**

- `-l, --link`: ローカルディレクトリをコピーせずにリンクします（`hooks.internal.load.extraDirs` に追加）
- `--pin`: npm インストールを、解決済みの正確な `name@version` として `hooks.internal.installs` に記録します

**サポートされるアーカイブ:** `.zip`、`.tgz`、`.tar.gz`、`.tar`

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

リンクされたフックパックは、ワークスペースフックではなく、オペレーターが設定したディレクトリ由来の管理対象フックとして扱われます。

## フックパックを更新

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

統合 plugins アップデーターを通じて、追跡対象の npm ベースのフックパックを更新します。

`openclaw hooks update` は互換エイリアスとして引き続き動作しますが、非推奨警告を出力して `openclaw plugins update` に転送します。

**オプション:**

- `--all`: 追跡対象のすべてのフックパックを更新
- `--dry-run`: 書き込みを行わず、変更される内容を表示

保存済みの整合性ハッシュが存在し、取得したアーティファクトのハッシュが変わった場合、OpenClaw は警告を出力し、続行前に確認を求めます。CI/非対話実行でプロンプトをバイパスするには、グローバル `--yes` を使用します。

## 同梱フック

### session-memory

`/new` または `/reset` を発行したときに、セッションコンテキストをメモリに保存します。

**有効化:**

```bash
openclaw hooks enable session-memory
```

**出力:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参照:** [session-memory ドキュメント](/ja-JP/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 中に追加のブートストラップファイル（たとえば monorepo-local の `AGENTS.md` / `TOOLS.md`）を注入します。

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
