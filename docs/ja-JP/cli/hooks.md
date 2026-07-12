---
read_when:
    - エージェントフックを管理したい場合
    - フックが利用可能かどうかを確認する、またはワークスペースフックを有効にする場合
summary: '`openclaw hooks`（エージェントフック）の CLI リファレンス'
title: フック
x-i18n:
    generated_at: "2026-07-11T22:03:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

エージェントフック（`/new`、`/reset`、Gateway の起動などのコマンドに対するイベント駆動型自動化）を管理します。引数なしの `openclaw hooks` は `openclaw hooks list` と同等です。

関連項目: [フック](/ja-JP/automation/hooks) - [Plugin フック](/ja-JP/plugins/hooks)

## フックの一覧表示

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

ワークスペース、管理対象、追加、同梱の各ディレクトリから検出されたフックを一覧表示します。

- `--eligible`: 要件を満たすフックのみ。
- `--json`: 構造化出力。
- `-v, --verbose`: 満たされていない要件を示す「不足」列を含めます。

```
フック（4/5 が準備完了）

準備完了:
  🚀 boot-md ✓ - Gateway の起動時に BOOT.md を実行
  📎 bootstrap-extra-files ✓ - エージェントのブートストラップ中に追加のワークスペースブートストラップファイルを注入
  📝 command-logger ✓ - すべてのコマンドイベントを一元化された監査ファイルに記録
  💾 session-memory ✓ - /new または /reset コマンドの発行時にセッションコンテキストをメモリへ保存
```

## フック情報の取得

```bash
openclaw hooks info <name> [--json]
```

`<name>` はフック名またはフックキー（例: `session-memory`）です。ソース、ファイル/ハンドラーのパス、ホームページ、イベント、および要件ごとの状態（バイナリ、環境変数、設定、OS）を表示します。

## 適格性の確認

```bash
openclaw hooks check [--json]
```

準備完了/未完了の件数概要を出力します。準備未完了のフックがある場合は、各フックとその阻害理由を一覧表示します。

## フックの有効化

```bash
openclaw hooks enable <name>
```

設定の `hooks.internal.entries.<name>.enabled = true` を追加または更新し、`hooks.internal.enabled` マスタースイッチもオンにします（少なくとも1つが設定されるまで、Gateway は内部フックハンドラーを読み込みません）。フックが存在しない場合、Plugin によって管理されている場合、または要件不足により適格でない場合は失敗します。

Plugin 管理のフックは `hooks list` に `plugin:<id>` と表示され、ここでは有効化または無効化できません。代わりに、所有する Plugin を有効化または無効化してください。

有効化後は、フックを再読み込みするために Gateway を再起動してください（macOS メニューバーアプリを再起動するか、開発環境の Gateway プロセスを再起動します）。

## フックの無効化

```bash
openclaw hooks disable <name>
```

`hooks.internal.entries.<name>.enabled = false` を設定します。その後、Gateway を再起動してください。

## フックパックのインストールと更新

```bash
openclaw plugins install <package>        # デフォルトでは npm
openclaw plugins install npm:<package>    # npm のみ
openclaw plugins install <package> --pin  # 解決されたバージョンを固定
openclaw plugins install <path>           # ローカルディレクトリまたはアーカイブ
openclaw plugins install -l <path>        # コピーせずにローカルディレクトリをリンク

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

フックパックは統合された Plugin インストーラー/アップデーターを通じてインストールされます。`openclaw hooks install` / `openclaw hooks update` は、警告を出力して `plugins` コマンドへ転送する非推奨のエイリアスとして引き続き動作します。

- npm 指定はレジストリのみに対応します。パッケージ名に、任意で完全一致のバージョンまたは dist-tag を追加できます。Git/URL/ファイル指定および semver 範囲は拒否されます。依存関係のインストールはプロジェクトローカルで `--ignore-scripts` を指定して実行されます。
- バージョン指定なしおよび `@latest` は安定版トラックに留まります。npm がプレリリース版へ解決した場合、OpenClaw は停止し、明示的なオプトイン（`@beta`、`@rc`、または完全一致のプレリリースバージョン）を求めます。
- 対応アーカイブ: `.zip`、`.tgz`、`.tar.gz`、`.tar`。
- `-l, --link` は、ローカルディレクトリをコピーせずにリンクします（`hooks.internal.load.extraDirs` に追加します）。リンクされたフックパックは、ワークスペースフックではなく、オペレーターが設定したディレクトリにある管理対象フックです。
- `--pin` は、npm インストールを解決済みの完全一致 `name@version` として `hooks.internal.installs` に記録します。
- インストールでは、パックを `~/.openclaw/hooks/<id>` にコピーし、`hooks.internal.entries.*` 配下のフックを有効化して、インストールを `hooks.internal.installs` に記録します。
- 保存済みの整合性ハッシュが取得したアーティファクトと一致しなくなった場合、OpenClaw は警告し、続行前に確認を求めます。プロンプトを省略するには、グローバルな `--yes` を指定します（CI での使用例など）。

## 同梱フック

| フック                | イベント                                          | 動作                                                                                                          |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | 設定された各エージェントスコープについて、Gateway の起動時に `BOOT.md` を実行します                           |
| bootstrap-extra-files | `agent:bootstrap`                                 | エージェントのブートストラップ中に追加のブートストラップファイル（例: モノレポの `AGENTS.md`/`TOOLS.md`）を注入します |
| command-logger        | `command`                                         | コマンドイベントを `~/.openclaw/logs/commands.log` に記録します                                              |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | セッションの圧縮処理が開始および完了したときに、チャット上で通知を送信します                                 |
| session-memory        | `command:new`, `command:reset`                    | `/new` または `/reset` の実行時にセッションコンテキストをメモリへ保存します                                  |

同梱フックは `openclaw hooks enable <hook-name>` で有効化できます。詳細、設定キー、デフォルトについては、[同梱フック](/ja-JP/automation/hooks#bundled-hooks)を参照してください。

### command-logger のログファイル

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # 最近のコマンド
cat ~/.openclaw/logs/commands.log | jq .          # 読みやすく整形して出力
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # アクションで絞り込み
```

## 注記

- `hooks list --json`、`info --json`、`check --json` は、構造化された JSON を標準出力へ直接書き込みます。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [自動化フック](/ja-JP/automation/hooks)
