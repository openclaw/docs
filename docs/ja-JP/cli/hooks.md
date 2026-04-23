---
read_when:
    - agent hooksを管理したい場合
    - フックの利用可否を確認したい、またはワークスペースフックを有効にしたい場合
summary: '`openclaw hooks` のCLIリファレンス（agent hooks）'
title: フック
x-i18n:
    generated_at: "2026-04-23T14:01:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a09978267783734aaf9bd8bf36aa365ca680a3652afb904db2e5b55dfa64dcd1
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

agent hooks（`/new`、`/reset`、Gateway起動などのコマンド向けイベント駆動自動化）を管理します。

サブコマンドなしで `openclaw hooks` を実行すると、`openclaw hooks list` と同等です。

関連:

- Hooks: [Hooks](/ja-JP/automation/hooks)
- Plugin hooks: [Plugin hooks](/ja-JP/plugins/architecture#provider-runtime-hooks)

## すべてのフックを一覧表示

```bash
openclaw hooks list
```

workspace、managed、extra、bundled ディレクトリから検出されたすべてのフックを一覧表示します。
Gateway起動時は、少なくとも1つの内部フックが設定されるまで内部フックハンドラーを読み込みません。

**オプション:**

- `--eligible`: 適格なフックのみ表示します（要件を満たしているもの）
- `--json`: JSONとして出力します
- `-v, --verbose`: 不足している要件を含む詳細情報を表示します

**出力例:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Gateway起動時にBOOT.mdを実行
  📎 bootstrap-extra-files ✓ - エージェントbootstrap時に追加のworkspace bootstrapファイルを注入
  📝 command-logger ✓ - すべてのコマンドイベントを集中監査ファイルに記録
  💾 session-memory ✓ - /new または /reset コマンド発行時にセッションコンテキストをメモリへ保存
```

**例（verbose）:**

```bash
openclaw hooks list --verbose
```

不適格なフックについて不足している要件を表示します。

**例（JSON）:**

```bash
openclaw hooks list --json
```

プログラムから利用するための構造化JSONを返します。

## フック情報を取得

```bash
openclaw hooks info <name>
```

特定のフックの詳細情報を表示します。

**引数:**

- `<name>`: フック名またはフックキー（例: `session-memory`）

**オプション:**

- `--json`: JSONとして出力します

**例:**

```bash
openclaw hooks info session-memory
```

**出力:**

```
💾 session-memory ✓ Ready

/new または /reset コマンド発行時にセッションコンテキストをメモリへ保存

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

フックの適格性ステータスの要約（準備完了数と未準備数）を表示します。

**オプション:**

- `--json`: JSONとして出力します

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

特定のフックを設定に追加して有効化します（デフォルトは `~/.openclaw/openclaw.json`）。

**注意:** workspaceフックは、ここまたは設定で有効化するまでデフォルトで無効です。Pluginによって管理されるフックは `openclaw hooks list` で `plugin:<id>` と表示され、ここでは有効化/無効化できません。代わりにそのPluginを有効化/無効化してください。

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

- フックが存在し、適格であることを確認します
- 設定内の `hooks.internal.entries.<name>.enabled = true` を更新します
- 設定をディスクに保存します

フックが `<workspace>/hooks/` 由来の場合、Gatewayがそれを読み込む前に
このオプトイン手順が必要です。

**有効化後:**

- フックを再読み込みするためGatewayを再起動してください（macOSではメニューバーアプリの再起動、devではGatewayプロセスの再起動）。

## フックを無効化

```bash
openclaw hooks disable <name>
```

設定を更新して特定のフックを無効化します。

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

- フックを再読み込みするためGatewayを再起動してください

## 注意

- `openclaw hooks list --json`、`info --json`、`check --json` は構造化JSONを直接stdoutへ書き出します。
- Plugin管理のフックはここでは有効化/無効化できません。代わりに所有するPluginを有効化または無効化してください。

## フックパックをインストール

```bash
openclaw plugins install <package>        # まずClawHub、次にnpm
openclaw plugins install <package> --pin  # バージョンを固定
openclaw plugins install <path>           # ローカルパス
```

統一されたpluginsインストーラーを通じてフックパックをインストールします。

`openclaw hooks install` も互換エイリアスとして引き続き動作しますが、非推奨警告を表示し、
`openclaw plugins install` へ転送します。

npm指定は**レジストリ専用**です（パッケージ名 + 任意の**正確なバージョン**または
**dist-tag**）。Git/URL/file指定やsemver範囲は拒否されます。依存関係のインストールは
安全のため `--ignore-scripts` 付きで実行されます。

裸の指定と `@latest` はstableトラックのままです。npmがそれらのいずれかをprereleaseに
解決した場合、OpenClawは停止し、`@beta`/`@rc` のようなprereleaseタグまたは正確な
prereleaseバージョンで明示的にオプトインするよう求めます。

**実行内容:**

- フックパックを `~/.openclaw/hooks/<id>` にコピーします
- インストールされたフックを `hooks.internal.entries.*` で有効化します
- インストール情報を `hooks.internal.installs` に記録します

**オプション:**

- `-l, --link`: コピーの代わりにローカルディレクトリをリンクします（`hooks.internal.load.extraDirs` に追加します）
- `--pin`: npmインストールを解決済みの正確な `name@version` として `hooks.internal.installs` に記録します

**サポートされるアーカイブ:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**例:**

```bash
# ローカルディレクトリ
openclaw plugins install ./my-hook-pack

# ローカルアーカイブ
openclaw plugins install ./my-hook-pack.zip

# NPMパッケージ
openclaw plugins install @openclaw/my-hook-pack

# コピーせずにローカルディレクトリをリンク
openclaw plugins install -l ./my-hook-pack
```

リンクされたフックパックは、workspaceフックではなく、オペレーター設定ディレクトリからのmanagedフックとして扱われます。

## フックパックを更新

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

統一されたpluginsアップデーターを通じて、追跡中のnpmベースフックパックを更新します。

`openclaw hooks update` も互換エイリアスとして引き続き動作しますが、非推奨警告を表示し、
`openclaw plugins update` へ転送します。

**オプション:**

- `--all`: 追跡中のすべてのフックパックを更新します
- `--dry-run`: 書き込みを行わず、何が変わるかを表示します

保存済みのintegrityハッシュが存在し、取得したアーティファクトのハッシュが変わっている場合、
OpenClawは警告を表示し、続行前に確認を求めます。CI/非対話実行でプロンプトを回避するには、
グローバル `--yes` を使用してください。

## バンドル済みフック

### session-memory

`/new` または `/reset` を発行したときにセッションコンテキストをメモリへ保存します。

**有効化:**

```bash
openclaw hooks enable session-memory
```

**出力:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参照:** [session-memory documentation](/ja-JP/automation/hooks#session-memory)

### bootstrap-extra-files

`agent:bootstrap` 中に追加のbootstrapファイル（たとえばモノレポローカルの `AGENTS.md` / `TOOLS.md`）を注入します。

**有効化:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参照:** [bootstrap-extra-files documentation](/ja-JP/automation/hooks#bootstrap-extra-files)

### command-logger

すべてのコマンドイベントを集中監査ファイルへ記録します。

**有効化:**

```bash
openclaw hooks enable command-logger
```

**出力:** `~/.openclaw/logs/commands.log`

**ログを見る:**

```bash
# 最近のコマンド
tail -n 20 ~/.openclaw/logs/commands.log

# 整形表示
cat ~/.openclaw/logs/commands.log | jq .

# アクションでフィルタ
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参照:** [command-logger documentation](/ja-JP/automation/hooks#command-logger)

### boot-md

Gateway起動時（チャンネル起動後）に `BOOT.md` を実行します。

**Events**: `gateway:startup`

**有効化**:

```bash
openclaw hooks enable boot-md
```

**参照:** [boot-md documentation](/ja-JP/automation/hooks#boot-md)
