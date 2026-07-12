---
read_when:
    - 推論の漏洩がないか、モデルの生出力を確認する必要があります
    - 反復開発中に Gateway を監視モードで実行したい場合
    - 再現可能なデバッグワークフローが必要です
summary: デバッグツール：ウォッチモード、モデルの生ストリーム、推論漏洩のトレース
title: デバッグ
x-i18n:
    generated_at: "2026-07-12T14:37:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力、Gateway の反復開発、起動プロファイリングのためのデバッグ補助機能です。

## ランタイムのデバッグオーバーライド

`/debug` は**ランタイム専用**の設定オーバーライド（ディスクではなくメモリ上）を設定します。デフォルトでは無効です。`commands.debug: true` で有効にします。

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドをクリアし、ディスク上の設定に戻します。

## セッショントレース出力

`/trace` は、完全な詳細モードを有効にせずに、1 つのセッションについて Plugin が所有するトレース／デバッグ行を表示します。Active Memory のデバッグ概要など、Plugin の診断に使用してください。通常のステータス／ツール出力には `/verbose` を使用します。

```text
/trace
/trace on
/trace off
```

## Plugin ライフサイクルトレース

Plugin のメタデータ、検出、レジストリ、ランタイムミラー、設定変更、更新処理をフェーズごとに確認するには、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を設定します。stderr に書き込まれるため、JSON コマンド出力は引き続き解析できます。

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

CPU プロファイラーを使用する前に、まずこれを使用してください。ソースチェックアウトでは、`pnpm build` の後に `node dist/entry.js ...` を使用してビルド済みランタイムを計測してください。`pnpm openclaw ...` ではソースランナーのオーバーヘッドも計測されます。

## CLI の起動およびコマンドのプロファイリング

リポジトリに含まれる起動ベンチマーク：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

通常のソースランナーを介して一時的にプロファイリングするには、`OPENCLAW_RUN_NODE_CPU_PROF_DIR` を設定します。

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ソースランナーは Node の CPU プロファイルフラグを追加し、コマンドの `.cpuprofile` を書き込みます。コマンドコードに一時的な計測処理を追加する前に、まずこれを使用してください。

同期ファイルシステム処理またはモジュールローダー処理によるものと思われる起動停止については、ソースランナー経由で Node の同期 I/O トレースフラグを追加します。

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` では、監視対象の Gateway 子プロセスに対して、このフラグはデフォルトで無効になっています。監視モードでも同期 I/O トレース出力が必要な場合は、`OPENCLAW_TRACE_SYNC_IO=1` を設定します。

## Gateway 監視モード

```bash
pnpm gateway:watch
```

デフォルトでは、`openclaw-gateway-watch-<profile>` という名前の tmux セッション（例：`openclaw-gateway-watch-main`）を起動または再起動します。`OPENCLAW_GATEWAY_PORT` がデフォルトポート `18789` と異なる場合にのみ、`openclaw-gateway-watch-dev-19001` のようなポートサフィックスが追加されます。対話型ターミナルからは自動的にアタッチされます。非対話型シェル、CI、エージェントの exec 呼び出しはデタッチされたままとなり、代わりにアタッチ手順が表示されます。

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux ペインでは未加工のウォッチャーが実行されます。

```bash
node scripts/watch-node.mjs gateway --force
```

同じポートを監視する前に、インストール済みの Gateway サービスを停止します。

```bash
pnpm openclaw gateway stop
```

ウォッチャーの `--force` は現在のリスナーをクリアしますが、監視サービスは無効にしません。無効にしない場合、launchd、systemd、または Scheduled Task サービスが再起動し、監視対象の Gateway を置き換える可能性があります。

tmux を使用しないフォアグラウンドモード：

```bash
pnpm gateway:watch:raw
# または
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 管理を維持しつつ、自動アタッチを無効にします。

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

起動時／ランタイムのホットスポットをデバッグするときに、監視対象 Gateway の CPU 時間をプロファイリングします。

```bash
pnpm gateway:watch --benchmark
```

監視ラッパーは Gateway を呼び出す前に `--benchmark` を処理し、Gateway 子プロセスが終了するたびに V8 の `.cpuprofile` を `.artifacts/gateway-watch-profiles/` 以下へ 1 つ書き込みます。現在のプロファイルをフラッシュするには、監視対象の Gateway を停止または再起動してから、Chrome DevTools または Speedscope で開きます。

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`：プロファイルを別の場所に書き込みます。
- `--benchmark-no-force`：デフォルトの `--force` によるポートのクリーンアップを省略し、Gateway ポートがすでに使用中の場合は即座に失敗します。

ベンチマークモードでは、デフォルトで同期 I/O トレースの大量出力を抑制します。CPU プロファイルと同期 I/O スタックトレースの両方を取得するには、`--benchmark` とともに `OPENCLAW_TRACE_SYNC_IO=1` を設定します。ベンチマークモードでは、これらのトレースブロックはベンチマークディレクトリ内の `gateway-watch-output.log` に書き込まれ（ターミナルペインからは除外されます）、通常の Gateway ログは引き続き表示されます。

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` など、一般的な機密情報ではないランタイムセレクターをペインへ引き継ぎます。プロバイダーの認証情報は通常のプロファイル／設定に格納するか、一時的なシークレットを一度だけ使用する場合は未加工のフォアグラウンドモードを使用してください。

監視対象の Gateway が起動中に終了した場合、ウォッチャーは `openclaw doctor --fix --non-interactive` を一度実行してから、Gateway 子プロセスを再起動します。開発専用の修復処理を行わず、元の起動失敗を確認するには、`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を設定します。

管理対象の tmux ペインでは、デフォルトで Gateway ログに色が付きます。ANSI 出力を無効にするには、`pnpm gateway:watch` の起動時に `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 以下のビルドに関連するファイル、拡張機能のソースファイル、拡張機能の `package.json` および `openclaw.plugin.json` メタデータ、`tsconfig.json`、`package.json`、`tsdown.config.ts` の変更時に再起動します。拡張機能のメタデータ変更では、強制的な再ビルドを行わずに Gateway を再起動します。ソースおよび設定の変更時には、引き続き最初に `dist` を再ビルドします。

`gateway:watch` の後に Gateway CLI フラグを追加すると、再起動のたびにそのまま渡されます。同じ監視コマンドを再実行すると、名前付き tmux ペインが再生成されます。未加工のウォッチャーは単一ウォッチャーロックを維持するため、ウォッチャーの親プロセスが重複して蓄積するのではなく、置き換えられます。

## 開発プロファイル + 開発 Gateway（--dev）

**別々の** `--dev` フラグが 2 つあります。

- **グローバル `--dev`（プロファイル）：** 状態を `~/.openclaw-dev` 以下に分離し、Gateway ポートのデフォルトを `19001` にします（派生ポートも連動して移動します）。
- **`gateway --dev`：** 設定が存在しない場合に、Gateway にデフォルト設定とワークスペースを自動作成させます（ブートストラップは省略します）。

推奨フロー（開発プロファイル + 開発ブートストラップ）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

グローバルインストールを使用しない場合は、`pnpm openclaw ...` 経由で CLI を実行します。

実行される処理：

1. **プロファイルの分離**（グローバル `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（ブラウザー／Canvas のポートも連動して移動します）

2. **開発ブートストラップ**（`gateway --dev`）
   - 存在しない場合は最小限の設定を書き込みます（`gateway.mode=local`、loopback にバインド）。
   - `agents.defaults.workspace` を開発ワークスペースに設定し、`agents.defaults.skipBootstrap=true` を設定します。
   - 存在しない場合は、ワークスペースファイル `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md` を初期配置します。
   - デフォルトのアイデンティティ：**C3-PO**（プロトコル・ドロイド）。
   - `pnpm gateway:dev` は、チャンネルプロバイダーを省略するために `OPENCLAW_SKIP_CHANNELS=1` も設定します。

リセットフロー（新規開始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は**グローバル**プロファイルフラグであり、一部のランナーによって処理されてしまいます。明示的に指定する必要がある場合は、環境変数形式を使用してください。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、認証情報、セッション、開発ワークスペースを消去し（削除ではなくゴミ箱へ移動）、デフォルトの開発環境を再作成します。

<Tip>
開発用ではない Gateway がすでに実行中の場合（launchd または systemd）、先に停止してください。

```bash
openclaw gateway stop
```

</Tip>

## 未加工ストリームのログ記録

OpenClaw は、フィルタリング／整形を行う前の**未加工のアシスタントストリーム**をログに記録できます。推論がプレーンテキストの差分として届いているのか（または別個の思考ブロックとして届いているのか）を確認するための最適な方法です。

CLI で有効にします。

```bash
pnpm gateway:watch --raw-stream
```

任意のパスオーバーライド：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

同等の環境変数：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

デフォルトファイル：`~/.openclaw/logs/raw-stream.jsonl`

## 安全上の注意

- 未加工ストリームのログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる可能性があります。
- ログはローカルに保持し、デバッグ後に削除してください。
- ログを共有する場合は、まずシークレットと PII を除去してください。

## VSCode でのデバッグ

ビルドによって生成ファイル名がハッシュ化されるため、ソースマップが必要です。付属の `launch.json` は Gateway サービスを対象としています。

1. **Rebuild and Debug Gateway** - Gateway を起動する前に `/dist` を削除し、デバッグを有効にして再ビルドします。
2. **Debug Gateway** - `/dist` に触れずに、既存のビルドをデバッグします。

### セットアップ

1. **Run and Debug**（Activity Bar、または `Ctrl`+`Shift`+`D`）を開きます。
2. **Rebuild and Debug Gateway** を選択し、**Start Debugging** を押します。

ビルド／デバッグサイクルを手動で管理する場合：

1. ターミナルでソースマップを有効にします。
   - **Linux/macOS**：`export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**：`$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**：`set OUTPUT_SOURCE_MAPS=1`
2. 再ビルド：`pnpm clean:dist && pnpm build`
3. **Debug Gateway** を選択し、**Start Debugging** を押します。

`src/` の TypeScript ファイルにブレークポイントを設定します。デバッガーはソースマップを介して、それらをコンパイル済み JavaScript にマッピングします。

### 注意事項

- **Rebuild and Debug Gateway** は起動するたびに `/dist` を削除し、ソースマップを有効にして完全な `pnpm build` を実行します。
- **Debug Gateway** は `/dist` に影響を与えずに開始／停止できますが、ビルドサイクルは別のターミナルで管理する必要があります。
- 他の CLI サブコマンドをデバッグするには、`launch.json` の `args` を編集します。
- 他のタスクでビルド済み CLI を使用するには（たとえば、デバッグセッションによって新しい認証トークンが生成される場合の `dashboard --no-open`）、別のターミナルから `node ./openclaw.mjs`、または `alias openclaw-build="node $(pwd)/openclaw.mjs"` のようなエイリアスを実行します。

## 関連項目

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [よくある質問](/ja-JP/help/faq)
