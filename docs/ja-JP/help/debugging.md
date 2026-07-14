---
read_when:
    - 推論の漏洩がないか、モデルの生の出力を確認する必要があります
    - 反復作業中に Gateway を監視モードで実行する場合
    - 再現可能なデバッグワークフローが必要です
summary: デバッグツール：ウォッチモード、生のモデルストリーム、推論の漏洩のトレース
title: デバッグ
x-i18n:
    generated_at: "2026-07-14T13:43:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b34d2a09b6c669e8362dcc346a5f7343e262028907f68b2313ed597d8784534f
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力、Gateway の反復作業、起動プロファイリング用のデバッグヘルパー。

## ランタイムデバッグオーバーライド

`/debug` は、**ランタイムのみ**の設定オーバーライド（メモリ上であり、ディスク上ではない）を設定します。デフォルトでは無効です。`commands.debug: true` で有効にします。

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドを消去し、ディスク上の設定に戻します。

## セッショントレース出力

`/trace` は、完全な詳細モードを有効にせずに、1つのセッションについて Plugin が所有するトレース／デバッグ行を表示します。Active Memory のデバッグ概要など、Plugin の診断に使用してください。通常のステータス／ツール出力には `/verbose` を使用します。

```text
/trace
/trace on
/trace off
```

## Plugin ライフサイクルトレース

Plugin のメタデータ、検出、レジストリ、ランタイムミラー、設定変更、更新処理をフェーズごとに分析するには、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を設定します。stderr に書き込むため、JSON コマンド出力は解析可能なまま維持されます。

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

CPU プロファイラーを使用する前に、まずこれを使用してください。ソースチェックアウトでは、`pnpm build` の後に `node dist/entry.js ...` を使用してビルド済みランタイムを測定します。`pnpm openclaw ...` はソースランナーのオーバーヘッドも測定します。

## CLI の起動とコマンドのプロファイリング

リポジトリに含まれる起動ベンチマーク：

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

通常のソースランナーを介して一度だけプロファイリングするには、`OPENCLAW_RUN_NODE_CPU_PROF_DIR` を設定します。

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ソースランナーは Node CPU プロファイルフラグを追加し、コマンド用の `.cpuprofile` を書き込みます。コマンドコードに一時的な計測処理を追加する前に、まずこれを使用してください。

同期ファイルシステム処理またはモジュールローダー処理が原因と思われる起動停止を調べるには、ソースランナー経由で Node の同期 I/O トレースフラグを追加します。

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` では、監視対象の Gateway 子プロセスに対してこのフラグはデフォルトで無効です。監視モードでも同期 I/O トレース出力が必要な場合は、`OPENCLAW_TRACE_SYNC_IO=1` を設定します。

## Gateway 監視モード

```bash
pnpm gateway:watch
```

デフォルトでは、`openclaw-gateway-watch-<profile>` という名前（例：`openclaw-gateway-watch-main`）の tmux セッションを起動または再起動します。`OPENCLAW_GATEWAY_PORT` がデフォルトポート `18789` と異なる場合にのみ、`openclaw-gateway-watch-dev-19001` のようなポートサフィックスが追加されます。対話型ターミナルからは自動的にアタッチされます。非対話型シェル、CI、エージェントの exec 呼び出しではデタッチされたままとなり、代わりにアタッチ手順が表示されます。

```bash
tmux attach -t openclaw-gateway-watch-main
# アタッチせずに最近の出力を読み取る
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

ペインでは tmux の `remain-on-exit` を使用するため、起動失敗時にもセッションは削除されず、後からアタッチまたはキャプチャできます。`pnpm gateway:watch` を再実行すると、そのペインが再生成されます。

tmux ペインでは生のウォッチャーが実行されます。

```bash
node scripts/watch-node.mjs gateway --force
```

設定済み／デフォルトのポートを監視する前に、tmux ラッパーはアクティブなプロファイルにインストールされている Gateway サービスを停止します。これにより、launchd、systemd、Scheduled Task がサービスを再生成して置き換えることなく、ソースウォッチャーがポートを使用できます。サービスはインストールされたままです。監視セッション終了後、次のコマンドで復元します。

```bash
pnpm openclaw gateway start
```

明示的な `--port` または `OPENCLAW_GATEWAY_PORT` が、インストール済みサービスの実効ポートと異なる場合、ラッパーはサービスを実行したままにするため、両方の Gateway を並行して実行できます。

tmux を使用しないフォアグラウンドモード：

```bash
pnpm gateway:watch:raw
# または
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Raw モードでは、インストール済みサービスは管理されません。同じポートを使用する場合は、先に `pnpm openclaw gateway stop` を実行してください。

tmux 管理を維持しながら自動アタッチを無効にするには、次のようにします。

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

起動時／ランタイムのホットスポットをデバッグするときに、監視対象 Gateway の CPU 時間をプロファイリングします。

```bash
pnpm gateway:watch --benchmark
```

監視ラッパーは Gateway を呼び出す前に `--benchmark` を消費し、Gateway 子プロセスが終了するたびに、V8 の `.cpuprofile` を1つずつ `.artifacts/gateway-watch-profiles/` 配下へ書き込みます。現在のプロファイルを書き出すには監視対象 Gateway を停止または再起動し、Chrome DevTools または Speedscope で開きます。

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`：別の場所にプロファイルを書き込みます。
- `--benchmark-no-force`：デフォルトの `--force` ポートのクリーンアップを省略し、Gateway ポートがすでに使用中の場合は即座に失敗します。

ベンチマークモードでは、同期 I/O トレースの大量出力がデフォルトで抑制されます。CPU プロファイルと同期 I/O スタックトレースの両方を取得するには、`--benchmark` とともに `OPENCLAW_TRACE_SYNC_IO=1` を設定します。ベンチマークモードでは、それらのトレースブロックはベンチマークディレクトリ配下の `gateway-watch-output.log` に出力され（ターミナルペインからは除外されます）、通常の Gateway ログは引き続き表示されます。

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` など、一般的な非機密のランタイムセレクターをペインへ引き継ぎます。プロバイダーの認証情報は通常のプロファイル／設定に保存するか、一時的なシークレットを一度だけ使用する場合は Raw フォアグラウンドモードを使用してください。

監視対象 Gateway が起動中に終了すると、ウォッチャーは `openclaw doctor --fix --non-interactive` を一度実行し、Gateway 子プロセスを再起動します。開発専用の修復処理を行わずに元の起動エラーを確認するには、`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を設定します。

管理対象の tmux ペインでは、デフォルトで Gateway ログに色が付きます。ANSI 出力を無効にするには、`pnpm gateway:watch` の起動時に `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 配下のビルド関連ファイル、拡張機能のソースファイル、拡張機能の `package.json` および `openclaw.plugin.json` メタデータ、`tsconfig.json`、`package.json`、`tsdown.config.ts` が変更されると再起動します。拡張機能のメタデータ変更では、強制的な再ビルドを行わずに Gateway が再起動します。ソースと設定の変更時は、引き続き先に `dist` が再ビルドされます。

`gateway:watch` の後に Gateway CLI フラグを追加すると、再起動のたびにそのまま渡されます。同じ監視コマンドを再実行すると、指定された tmux ペインが再生成されます。Raw ウォッチャーでは単一ウォッチャーロックが維持されるため、ウォッチャーの親プロセスが重複して蓄積するのではなく、既存のものが置き換えられます。

## 開発プロファイル＋開発用 Gateway（--dev）

**別々の** `--dev` フラグが2つあります。

- **グローバル `--dev`（プロファイル）：** 状態を `~/.openclaw-dev` 配下に分離し、Gateway ポートをデフォルトで `19001` にします（派生ポートもそれに合わせて移動します）。
- **`gateway --dev`：** デフォルトの設定とワークスペースが存在しない場合に、それらを自動作成し、ブートストラップを省略するよう Gateway に指示します。

推奨フロー（開発プロファイル＋開発用ブートストラップ）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

グローバルインストールがない場合は、`pnpm openclaw ...` 経由で CLI を実行します。

実行される処理：

1. **プロファイルの分離**（グローバル `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（ブラウザー／Canvas のポートもそれに合わせて移動します）

2. **開発用ブートストラップ**（`gateway --dev`）
   - 存在しない場合は最小限の設定を書き込みます（`gateway.mode=local`、loopback にバインド）。
   - `agents.defaults.workspace` を開発用ワークスペースと `agents.defaults.skipBootstrap=true` に設定します。
   - 存在しない場合は、ワークスペースファイルを初期作成します：`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`。
   - デフォルトのアイデンティティ：**C3-PO**（プロトコル・ドロイド）。
   - `pnpm gateway:dev` は、チャンネルプロバイダーを省略するために `OPENCLAW_SKIP_CHANNELS=1` も設定します。

リセットフロー（新規開始）：

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は**グローバル**プロファイルフラグであり、一部のランナーによって消費されます。明示的に指定する必要がある場合は、環境変数形式を使用してください。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、認証情報、セッション、開発用ワークスペースを消去し（削除ではなくゴミ箱へ移動）、デフォルトの開発環境を再作成します。

<Tip>
開発用ではない Gateway がすでに実行中（launchd または systemd）の場合は、先に停止してください。

```bash
openclaw gateway stop
```

</Tip>

## Raw ストリームのログ記録

OpenClaw は、フィルタリング／フォーマット処理を行う前の**生のアシスタントストリーム**をログに記録できます。推論がプレーンテキストの差分として到着しているのか（または個別の思考ブロックとして到着しているのか）を確認するには、これが最適な方法です。

CLI で有効にします。

```bash
pnpm gateway:watch --raw-stream
```

任意のパスを指定する場合：

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

- Raw ストリームログには、プロンプト全体、ツール出力、ユーザーデータが含まれる場合があります。
- ログはローカルに保持し、デバッグ後に削除してください。
- ログを共有する場合は、先にシークレットと個人識別情報（PII）を除去してください。

## VSCode でのデバッグ

ビルドによって生成ファイル名がハッシュ化されるため、ソースマップが必要です。付属の `launch.json` は Gateway サービスを対象とします。

1. **Rebuild and Debug Gateway** - Gateway の起動前に `/dist` を削除し、デバッグを有効にして再ビルドします。
2. **Debug Gateway** - `/dist` を変更せず、既存のビルドをデバッグします。

### セットアップ

1. **Run and Debug**（Activity Bar、または `Ctrl`+`Shift`+`D`）を開きます。
2. **Rebuild and Debug Gateway** を選択し、**Start Debugging** を押します。

代わりにビルド／デバッグサイクルを手動で管理するには、次のようにします。

1. ターミナルでソースマップを有効にします。
   - **Linux/macOS**：`export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**：`$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**：`set OUTPUT_SOURCE_MAPS=1`
2. 再ビルド：`pnpm clean:dist && pnpm build`
3. **Debug Gateway** を選択し、**Start Debugging** を押します。

`src/` の TypeScript ファイルにブレークポイントを設定します。デバッガーは、ソースマップを使用してコンパイル済み JavaScript にマッピングします。

### 注意事項

- **Rebuild and Debug Gateway** は、起動するたびに `/dist` を削除し、ソースマップを有効にして完全な `pnpm build` を実行します。
- **Debug Gateway** は `/dist` に影響を与えずに起動／停止できますが、ビルドサイクルは別のターミナルで管理します。
- ほかの CLI サブコマンドをデバッグするには、`launch.json` の `args` を編集します。
- ほかのタスクでビルド済み CLI を使用するには（たとえば、デバッグセッションによって新しい認証トークンが生成された場合の `dashboard --no-open`）、別のターミナルから `node ./openclaw.mjs`、または `alias openclaw-build="node $(pwd)/openclaw.mjs"` のようなエイリアスを実行します。

## 関連項目

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [よくある質問](/ja-JP/help/faq)
