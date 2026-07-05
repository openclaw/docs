---
read_when:
    - 推論の漏えいがないか、生のモデル出力を検査する必要があります
    - 反復作業中に Gateway をウォッチモードで実行したい場合
    - 再現可能なデバッグワークフローが必要です
summary: 'デバッグツール: ウォッチモード、生のモデルストリーム、推論漏えいのトレース'
title: デバッグ
x-i18n:
    generated_at: "2026-07-05T11:24:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b3ab71fdd5781b5ad0e5b75aa33bd93fa9cf6c668c7a26bc7217cd6a5f299cd
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力、Gateway の反復、起動プロファイリング向けのデバッグヘルパー。

## ランタイムデバッグオーバーライド

`/debug` は **ランタイム専用** の設定オーバーライド（メモリ上、ディスクではない）を設定します。デフォルトでは無効です。有効にするには `commands.debug: true` を使います。

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドをクリアし、ディスク上の設定に戻します。

## セッショントレース出力

`/trace` は、完全な詳細モードを有効にせずに、1 つのセッションについて Plugin が所有するトレース/デバッグ行を表示します。Active Memory のデバッグ要約などの Plugin 診断に使います。通常のステータス/ツール出力には `/verbose` を使います。

```text
/trace
/trace on
/trace off
```

## Plugin ライフサイクルトレース

Plugin メタデータ、検出、レジストリ、ランタイムミラー、設定変更、更新処理をフェーズごとに分解して確認するには、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を設定します。stderr に書き込むため、JSON コマンド出力は解析可能なままです。

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

CPU プロファイラに手を伸ばす前にこれを使います。ソースチェックアウトからは、`pnpm build` 後に `node dist/entry.js ...` でビルド済みランタイムを計測します。`pnpm openclaw ...` ではソースランナーのオーバーヘッドも計測されます。

## CLI 起動とコマンドのプロファイリング

チェックイン済みの起動ベンチマーク:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

通常のソースランナー経由で単発プロファイリングするには、`OPENCLAW_RUN_NODE_CPU_PROF_DIR` を設定します。

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ソースランナーは Node CPU プロファイルフラグを追加し、そのコマンドの `.cpuprofile` を書き込みます。コマンドコードに一時的な計測を追加する前にこれを使います。

起動停止が同期ファイルシステム処理やモジュールローダー処理に見える場合は、ソースランナー経由で Node の同期 I/O トレースフラグを追加します。

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` は、監視対象の Gateway 子プロセスではこのフラグをデフォルトで無効のままにします。監視モードでも同期 I/O トレース出力が必要な場合は、`OPENCLAW_TRACE_SYNC_IO=1` を設定します。

## Gateway 監視モード

```bash
pnpm gateway:watch
```

デフォルトでは、`openclaw-gateway-watch-<profile>`（例: `openclaw-gateway-watch-main`）という名前の tmux セッションを開始または再起動します。`OPENCLAW_GATEWAY_PORT` がデフォルトポート `18789` と異なる場合のみ、`openclaw-gateway-watch-dev-19001` のようなポートサフィックスが追加されます。対話型ターミナルからは自動アタッチします。非対話型シェル、CI、エージェントの exec 呼び出しではデタッチされたままになり、代わりにアタッチ手順を表示します。

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux ペインは生のウォッチャーを実行します。

```bash
node scripts/watch-node.mjs gateway --force
```

tmux なしのフォアグラウンドモード:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 管理を維持しつつ自動アタッチを無効にします。

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

起動/ランタイムのホットスポットをデバッグするときは、監視対象 Gateway の CPU 時間をプロファイルします。

```bash
pnpm gateway:watch --benchmark
```

監視ラッパーは Gateway を起動する前に `--benchmark` を消費し、Gateway 子プロセスの各終了ごとに V8 の `.cpuprofile` を `.artifacts/gateway-watch-profiles/` 配下へ 1 つ書き込みます。現在のプロファイルをフラッシュするには、監視対象の Gateway を停止または再起動してから、Chrome DevTools または Speedscope で開きます。

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: プロファイルを別の場所に書き込みます。
- `--benchmark-no-force`: デフォルトの `--force` ポートクリーンアップをスキップし、Gateway ポートがすでに使用中の場合はすぐに失敗します。

ベンチマークモードでは、デフォルトで同期 I/O トレースの大量出力を抑制します。CPU プロファイルと同期 I/O スタックトレースの両方を取得するには、`--benchmark` と一緒に `OPENCLAW_TRACE_SYNC_IO=1` を設定します。ベンチマークモードでは、これらのトレースブロックはベンチマークディレクトリ配下の `gateway-watch-output.log` に出力され（ターミナルペインからはフィルタされます）、通常の Gateway ログは表示されたままです。

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` など、一般的な非シークレットのランタイムセレクタをペインへ引き継ぎます。プロバイダー認証情報は通常のプロファイル/設定に入れるか、単発の一時シークレットには生のフォアグラウンドモードを使います。

監視対象 Gateway が起動中に終了した場合、ウォッチャーは `openclaw doctor --fix --non-interactive` を 1 回実行し、Gateway 子プロセスを再起動します。開発専用の修復パスを挟まずに元の起動失敗を確認するには、`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を設定します。

管理対象の tmux ペインは、デフォルトで色付きの Gateway ログを使います。ANSI 出力を無効にするには、`pnpm gateway:watch` の起動時に `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 配下のビルド関連ファイル、拡張機能のソースファイル、拡張機能の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、`package.json`、`tsdown.config.ts` の変更で再起動します。拡張機能メタデータの変更では、リビルドを強制せずに Gateway を再起動します。ソースと設定の変更では、引き続き先に `dist` をリビルドします。

Gateway CLI フラグは `gateway:watch` の後に追加すると、各再起動時に引き渡されます。同じ監視コマンドを再実行すると、名前付き tmux ペインが再生成されます。生のウォッチャーは単一ウォッチャーロックを維持するため、重複したウォッチャー親プロセスは積み上がらずに置き換えられます。

## 開発プロファイル + 開発 Gateway（--dev）

2 つの **別々の** `--dev` フラグがあります。

- **グローバル `--dev`（プロファイル）:** 状態を `~/.openclaw-dev` 配下に分離し、Gateway ポートをデフォルトで `19001` にします（派生ポートもそれに合わせて移動します）。
- **`gateway --dev`:** 設定とワークスペースがない場合に、Gateway にデフォルト設定 + ワークスペースを自動作成させます（さらにブートストラップをスキップします）。

推奨フロー（開発プロファイル + 開発ブートストラップ）:

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

グローバルインストールがない場合は、`pnpm openclaw ...` 経由で CLI を実行します。

これが行うこと:

1. **プロファイル分離**（グローバル `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（ブラウザー/canvas ポートもそれに応じて移動します）

2. **開発ブートストラップ**（`gateway --dev`）
   - ない場合は最小設定を書き込みます（`gateway.mode=local`、loopback にバインド）。
   - `agents.defaults.workspace` を開発ワークスペースに、`agents.defaults.skipBootstrap=true` に設定します。
   - ワークスペースファイルがない場合はシードします: `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`。
   - デフォルト ID: **C3-PO**（プロトコルドロイド）。
   - `pnpm gateway:dev` は、チャンネルプロバイダーをスキップするために `OPENCLAW_SKIP_CHANNELS=1` も設定します。

リセットフロー（新規開始）:

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は **グローバル** プロファイルフラグであり、一部のランナーに消費されます。明示する必要がある場合は、環境変数形式を使います。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、認証情報、セッション、開発ワークスペースを消去し（削除ではなくゴミ箱へ移動）、その後デフォルトの開発セットアップを再作成します。

<Tip>
非開発 Gateway がすでに実行中（launchd または systemd）の場合は、先に停止します。

```bash
openclaw gateway stop
```

</Tip>

## 生ストリームログ

OpenClaw は、フィルタリング/フォーマット前の **生のアシスタントストリーム** をログに記録できます。reasoning がプレーンテキスト差分として届いているか（または別個の thinking ブロックとして届いているか）を確認する最適な方法です。

CLI 経由で有効にします。

```bash
pnpm gateway:watch --raw-stream
```

任意のパス上書き:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

同等の環境変数:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

デフォルトファイル: `~/.openclaw/logs/raw-stream.jsonl`

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる場合があります。
- ログはローカルに保持し、デバッグ後に削除します。
- ログを共有する場合は、先にシークレットと PII を削除します。

## VSCode でのデバッグ

ビルドが生成ファイル名をハッシュ化するため、ソースマップが必要です。含まれている `launch.json` は Gateway サービスを対象にしています。

1. **Gateway をリビルドしてデバッグ** - Gateway を起動する前に `/dist` を削除し、デバッグを有効にしてリビルドします。
2. **Gateway をデバッグ** - `/dist` に触れず、既存のビルドをデバッグします。

### セットアップ

1. **実行とデバッグ**（アクティビティバー、または `Ctrl`+`Shift`+`D`）を開きます。
2. **Gateway をリビルドしてデバッグ** を選択し、**デバッグの開始** を押します。

代わりにビルド/デバッグサイクルを手動で管理するには:

1. ターミナルでソースマップを有効にします。
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. リビルド: `pnpm clean:dist && pnpm build`
3. **Gateway をデバッグ** を選択し、**デバッグの開始** を押します。

`src/` の TypeScript ファイルにブレークポイントを設定します。デバッガーはソースマップを通じて、それらをコンパイル済み JavaScript に対応付けます。

### 注意

- **Gateway をリビルドしてデバッグ** は `/dist` を削除し、起動のたびにソースマップ有効で完全な `pnpm build` を実行します。
- **Gateway をデバッグ** は `/dist` に影響せず開始/停止できますが、ビルドサイクルは別のターミナルで管理します。
- 他の CLI サブコマンドをデバッグするには、`launch.json` の `args` を編集します。
- 他のタスクでビルド済み CLI を使うには（たとえば、デバッグセッションが新しい認証トークンを生成する場合の `dashboard --no-open`）、別のターミナルから `node ./openclaw.mjs`、または `alias openclaw-build="node $(pwd)/openclaw.mjs"` のようなエイリアスで実行します。

## 関連

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
