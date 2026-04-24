---
read_when:
    - エージェントフックを管理したい場合
    - フックの利用可否を確認したり、ワークスペースフックを有効にしたい場合
summary: '`openclaw hooks` の CLI リファレンス（エージェントフック）'
title: フック
x-i18n:
    generated_at: "2026-04-24T04:50:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84f209e90a5679b889112fc03e22ea94f486ded9db25b5238c0366283695a5b9
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

エージェントフック（`/new`、`/reset`、Gateway 起動などのコマンドに対するイベント駆動の自動化）を管理します。

サブコマンドなしで `openclaw hooks` を実行すると、`openclaw hooks list` と同等です。

関連:

- フック: [フック](/ja-JP/automation/hooks)
- Plugin フック: [Plugin フック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)

## すべてのフックを一覧表示

```bash
openclaw hooks list
```

ワークスペース、managed、extra、bundled ディレクトリから検出されたすべてのフックを一覧表示します。
Gateway 起動時は、少なくとも 1 つの内部フックが設定されるまで内部フックハンドラーは読み込まれません。

**オプション:**

- `--eligible`: 適格なフックのみを表示（要件を満たしているもの）
- `--json`: JSON として出力
- `-v, --verbose`: 不足している要件を含む詳細情報を表示

**出力例:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Gateway 起動時に BOOT.md を実行
  📎 bootstrap-extra-files ✓ - エージェントブートストラップ中に追加のワークスペース bootstrap ファイルを注入
  📝 command-logger ✓ - すべてのコマンドイベントを一元化された監査ファイルに記録
  💾 session-memory ✓ - /new または /reset コマンド発行時にセッションコンテキストをメモリに保存
```

**例（詳細表示）:**

```bash
openclaw hooks list --verbose
```

適格でないフックについて、不足している要件を表示します。

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

/new または /reset コマンド発行時にセッションコンテキストをメモリに保存

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

特定のフックを、設定（デフォルトでは `~/.openclaw/openclaw.json`）に追加して有効化します。

**注意:** ワークスペースフックは、ここまたは設定で有効化するまでデフォルトで無効です。Plugin によって管理されるフックは `openclaw hooks list` で `plugin:<id>` と表示され、ここでは有効/無効にできません。代わりに Plugin 自体を有効/無効にしてください。

**引数:**

- `<name>`: フック名（例: `session-memory`）

**例:**

```bash
openclaw hooks enable session-memory
```

**出力:**

```
✓ フックを有効化しました: 💾 session-memory
```

**実行内容:**

- フックが存在し、適格であることを確認
- 設定内の `hooks.internal.entries.<name>.enabled = true` を更新
- 設定をディスクに保存

フックが `<workspace>/hooks/` 由来の場合、このオプトイン手順は
Gateway がそれを読み込む前に必須です。

**有効化後:**

- フックを再読み込みするため Gateway を再起動してください（macOS ではメニューバーアプリを再起動するか、開発環境では Gateway プロセスを再起動）。

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
⏸ フックを無効化しました: 📝 command-logger
```

**無効化後:**

- フックを再読み込みするため Gateway を再起動してください

## 注意

- `openclaw hooks list --json`、`info --json`、`check --json` は、構造化 JSON を直接 stdout に書き出します。
- Plugin 管理フックはここでは有効化も無効化もできません。代わりに所有元の Plugin を有効化または無効化してください。

## フックパックをインストール

```bash
openclaw plugins install <package>        # まず ClawHub、その後 npm
openclaw plugins install <package> --pin  # バージョンを固定
openclaw plugins install <path>           # ローカルパス
```

統一された Plugins インストーラーを通じてフックパックをインストールします。

`openclaw hooks install` も互換エイリアスとして引き続き動作しますが、非推奨警告を表示し、
`openclaw plugins install` に転送します。

npm 仕様は**レジストリ専用**です（パッケージ名 + オプションの**正確なバージョン**または
**dist-tag**）。Git/URL/file 仕様と semver 範囲は拒否されます。依存関係の
インストールは安全のため `--ignore-scripts` 付きで実行されます。

素の仕様と `@latest` は stable トラックのままです。npm がそれらのいずれかを
プレリリースに解決した場合、OpenClaw は停止し、
`@beta`/`@rc` のようなプレリリースタグまたは正確なプレリリースバージョンで明示的にオプトインするよう求めます。

**実行内容:**

- フックパックを `~/.openclaw/hooks/<id>` にコピー
- インストールしたフックを `hooks.internal.entries.*` で有効化
- インストール情報を `hooks.internal.installs` に記録

**オプション:**

- `-l, --link`: ローカルディレクトリをコピーせずにリンクする（`hooks.internal.load.extraDirs` に追加）
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

リンクされたフックパックは、ワークスペースフックではなく、
運用者が設定したディレクトリ由来の managed フックとして扱われます。

## フックパックを更新

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

統一された Plugins アップデーターを通じて、追跡中の npm ベースのフックパックを更新します。

`openclaw hooks update` も互換エイリアスとして引き続き動作しますが、非推奨警告を表示し、
`openclaw plugins update` に転送します。

**オプション:**

- `--all`: 追跡中のすべてのフックパックを更新
- `--dry-run`: 書き込まずに変更内容を表示

保存済みの整合性ハッシュが存在し、取得したアーティファクトハッシュが変化している場合、
OpenClaw は警告を表示し、続行前に確認を求めます。CI/非対話環境でプロンプトを回避するには、
グローバル `--yes` を使用してください。

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

`agent:bootstrap` 中に、追加の bootstrap ファイル（たとえばモノレポローカルの `AGENTS.md` / `TOOLS.md`）を注入します。

**有効化:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参照:** [bootstrap-extra-files ドキュメント](/ja-JP/automation/hooks#bootstrap-extra-files)

### command-logger

すべてのコマンドイベントを一元化された監査ファイルに記録します。

**有効化:**

```bash
openclaw hooks enable command-logger
```

**出力:** `~/.openclaw/logs/commands.log`

**ログ表示:**

```bash
# 最近のコマンド
tail -n 20 ~/.openclaw/logs/commands.log

# 整形表示
cat ~/.openclaw/logs/commands.log | jq .

# アクションで絞り込み
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参照:** [command-logger ドキュメント](/ja-JP/automation/hooks#command-logger)

### boot-md

Gateway 起動時（チャネル起動後）に `BOOT.md` を実行します。

**イベント**: `gateway:startup`

**有効化**:

```bash
openclaw hooks enable boot-md
```

**参照:** [boot-md ドキュメント](/ja-JP/automation/hooks#boot-md)

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [自動化フック](/ja-JP/automation/hooks)
