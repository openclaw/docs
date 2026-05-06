---
read_when:
    - 推論の漏洩がないか、生のモデル出力を調べる必要があります
    - 反復作業中に Gateway をウォッチモードで実行したい
    - 再現可能なデバッグワークフローが必要です
summary: 'デバッグツール: ウォッチモード、生のモデルストリーム、推論漏洩のトレース'
title: デバッグ
x-i18n:
    generated_at: "2026-05-06T09:06:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力用のデバッグヘルパー。特にプロバイダーが reasoning を通常のテキストに混ぜる場合に使います。

## ランタイムデバッグオーバーライド

チャットで `/debug` を使うと、**ランタイム専用**の設定オーバーライドを指定できます（メモリ上のみ、ディスクには保存しません）。
`/debug` はデフォルトで無効です。`commands.debug: true` で有効にします。
`openclaw.json` を編集せずに、わかりにくい設定を切り替える必要があるときに便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドを消去し、ディスク上の設定に戻します。

## セッショントレース出力

フル verbose モードを有効にせず、1 つのセッションで Plugin 所有のトレース/デバッグ行を見たい場合は `/trace` を使います。

例:

```text
/trace
/trace on
/trace off
```

Active Memory のデバッグ要約など、Plugin 診断には `/trace` を使います。
通常の verbose ステータス/ツール出力には引き続き `/verbose` を使い、
ランタイム専用の設定オーバーライドには引き続き `/debug` を使います。

## Plugin ライフサイクルトレース

Plugin ライフサイクルコマンドが遅く感じられ、Plugin メタデータ、検出、レジストリ、ランタイムミラー、設定変更、更新作業について組み込みのフェーズ内訳が必要な場合は、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を使います。トレースはオプトインで stderr に書き込まれるため、JSON コマンド出力は引き続き解析可能です。

例:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

出力例:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

CPU プロファイラーに頼る前に、Plugin ライフサイクルの調査にはこれを使います。
コマンドをソースチェックアウトから実行している場合は、`pnpm build` 後に
`node dist/entry.js ...` でビルド済みランタイムを計測することを優先してください。`pnpm openclaw ...` ではソースランナーのオーバーヘッドも計測されます。

## CLI 起動とコマンドのプロファイリング

コマンドが遅く感じられる場合は、チェックイン済みの起動ベンチマークを使います。

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

通常のソースランナー経由で一度だけプロファイリングする場合は、
`OPENCLAW_RUN_NODE_CPU_PROF_DIR` を設定します。

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ソースランナーは Node CPU プロファイルフラグを追加し、そのコマンド用の `.cpuprofile` を書き込みます。コマンドコードに一時的な計測を追加する前にこれを使います。

同期ファイルシステム処理やモジュールローダー処理のように見える起動停止では、
ソースランナー経由で Node の同期 I/O トレースフラグを追加します。

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` は、監視対象の Gateway 子プロセスに対してこのフラグをデフォルトで有効にします。
watch モードで Node 同期 I/O トレース出力を抑制するには、`OPENCLAW_TRACE_SYNC_IO=0` を設定します。

## Gateway watch モード

高速に反復するには、ファイルウォッチャーの下で gateway を実行します。

```bash
pnpm gateway:watch
```

デフォルトでは、`openclaw-gateway-watch-main` という名前の tmux セッション（または `openclaw-gateway-watch-dev-19001` のようなプロファイル/ポート固有のバリアント）を起動または再起動し、対話型ターミナルから自動でアタッチします。
非対話シェル、CI、エージェント exec 呼び出しはデタッチされたままで、代わりにアタッチ手順を表示します。必要に応じて手動でアタッチします。

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux ペインは生のウォッチャーを実行します。

```bash
node scripts/watch-node.mjs gateway --force
```

tmux が不要な場合はフォアグラウンドモードを使います。

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 管理を維持したまま自動アタッチを無効にします。

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

起動時/ランタイムのホットスポットをデバッグするときは、監視対象 Gateway の CPU 時間をプロファイルします。

```bash
pnpm gateway:watch --benchmark
```

watch ラッパーは Gateway を起動する前に `--benchmark` を消費し、Gateway 子プロセスが終了するたびに V8 の `.cpuprofile` を 1 つずつ `.artifacts/gateway-watch-profiles/` 配下に書き込みます。現在のプロファイルをフラッシュするには監視対象 gateway を停止または再起動し、その後 Chrome DevTools または Speedscope で開きます。

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

プロファイルを別の場所に置きたい場合は `--benchmark-dir <path>` を使います。
ベンチマーク対象の子プロセスでデフォルトの `--force` ポートクリーンアップをスキップし、Gateway ポートがすでに使用中ならすぐに失敗させたい場合は、`--benchmark-no-force` を使います。
ベンチマークモードでは、デフォルトで同期 I/O トレースの大量出力を抑制します。CPU プロファイルと Node 同期 I/O スタックトレースの両方を明示的に必要とする場合は、`--benchmark` とともに `OPENCLAW_TRACE_SYNC_IO=1` を設定します。ベンチマークモードでは、それらのトレースブロックはベンチマークディレクトリ配下の `gateway-watch-output.log` に書き込まれ、ターミナルペインからはフィルターされます。通常の Gateway ログは表示されたままです。

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` など、一般的な非シークレットのランタイムセレクターをペインに渡します。プロバイダー認証情報は通常のプロファイル/設定に置くか、一度きりの一時的なシークレットには生のフォアグラウンドモードを使います。
監視対象の Gateway が起動中に終了した場合、ウォッチャーは `openclaw doctor --fix --non-interactive` を 1 回実行し、Gateway 子プロセスを再起動します。開発専用の修復パスなしで元の起動失敗を見たい場合は、`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を使います。
管理対象の tmux ペインでは、読みやすさのため Gateway ログもデフォルトでカラー表示されます。ANSI 出力を無効にするには、`pnpm gateway:watch` の開始時に `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 配下のビルド関連ファイル、拡張ソースファイル、拡張の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、`package.json`、`tsdown.config.ts` の変更で再起動します。拡張メタデータの変更では、`tsdown` のリビルドを強制せずに gateway を再起動します。ソースと設定の変更では、引き続き先に `dist` をリビルドします。

Gateway CLI フラグは `gateway:watch` の後ろに追加すれば、各再起動時にそのまま渡されます。同じ watch コマンドを再実行すると名前付き tmux ペインが再生成され、生のウォッチャーは引き続き単一ウォッチャーロックを保持するため、重複したウォッチャー親プロセスは積み上がらず置き換えられます。

## 開発プロファイル + 開発 gateway (`--dev`)

デバッグ用に状態を分離し、安全で使い捨て可能なセットアップを起動するには、開発プロファイルを使います。`--dev` フラグは **2 つ** あります。

- **グローバル `--dev`（プロファイル）:** 状態を `~/.openclaw-dev` 配下に分離し、gateway ポートをデフォルトで `19001` にします（派生ポートもそれに合わせてずれます）。
- **`gateway --dev`: 不足している場合に Gateway にデフォルト設定 + ワークスペースを自動作成させます**（また、BOOTSTRAP.md をスキップします）。

推奨フロー（開発プロファイル + 開発ブートストラップ）:

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

まだグローバルインストールがない場合は、`pnpm openclaw ...` 経由で CLI を実行します。

これが行うこと:

1. **プロファイル分離**（グローバル `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（ブラウザー/canvas もそれに応じてずれます）

2. **開発ブートストラップ**（`gateway --dev`）
   - 不足している場合、最小構成を書き込みます（`gateway.mode=local`、ループバックにバインド）。
   - `agent.workspace` を開発ワークスペースに設定します。
   - `agent.skipBootstrap=true` を設定します（BOOTSTRAP.md なし）。
   - 不足している場合、ワークスペースファイルをシードします:
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - デフォルトのアイデンティティ: **C3-PO**（プロトコルドロイド）。
   - 開発モードではチャネルプロバイダーをスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（新規開始）:

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は**グローバル**プロファイルフラグであり、一部のランナーに消費されます。明示的に書く必要がある場合は、環境変数形式を使います。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、認証情報、セッション、開発ワークスペースを（`rm` ではなく `trash` を使って）消去し、デフォルトの開発セットアップを再作成します。

<Tip>
非開発 gateway（launchd または systemd）がすでに実行中の場合は、先に停止します。

```bash
openclaw gateway stop
```

</Tip>

## 生ストリームログ（OpenClaw）

OpenClaw は、フィルタリング/フォーマットの前に **生の assistant ストリーム** をログに記録できます。
これは reasoning がプレーンテキストのデルタとして到着しているのか（または別の thinking ブロックとして到着しているのか）を確認する最良の方法です。

CLI から有効にします。

```bash
pnpm gateway:watch --raw-stream
```

任意のパスオーバーライド:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

同等の環境変数:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

デフォルトファイル:

`~/.openclaw/logs/raw-stream.jsonl`

## 生チャンクログ（pi-mono）

ブロックに解析される前の **生の OpenAI 互換チャンク** を取得するために、
pi-mono は別のロガーを公開しています。

```bash
PI_RAW_STREAM=1
```

任意のパス:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

デフォルトファイル:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注: これは pi-mono の `openai-completions` プロバイダーを使うプロセスでのみ出力されます。

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれることがあります。
- ログはローカルに保持し、デバッグ後に削除してください。
- ログを共有する場合は、先にシークレットと PII を削除してください。

## VSCode でのデバッグ

ビルドプロセスの一部として生成ファイルの多くがハッシュ付きの名前になるため、VSCode ベースの IDE でデバッグを有効にするにはソースマップが必要です。付属の `launch.json` 設定は Gateway サービスを対象にしていますが、他の用途にもすばやく適用できます。

1. **Gateway をリビルドしてデバッグ** - 新しいビルドを作成した後に Gateway サービスをデバッグします
2. **Gateway をデバッグ** - 既存ビルドの Gateway サービスをデバッグします

### セットアップ

デフォルトの **Gateway をリビルドしてデバッグ** 設定は必要なものを含んでおり、`/dist` フォルダーを自動的に削除し、デバッグを有効にしてプロジェクトをリビルドします。

1. Activity Bar から **Run and Debug** パネルを開くか、`Ctrl`+`Shift`+`D` を押します
2. IDE で、設定ドロップダウンに **Gateway をリビルドしてデバッグ** が選択されていることを確認し、その後 **Start Debugging** ボタンを押します

または、ビルドとデバッグのプロセスを手動で管理したい場合:

1. ターミナルを開き、ソースマップを有効にします:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. 同じターミナルでプロジェクトをリビルドします: `pnpm clean:dist && pnpm build`
3. IDE で、**Run and Debug** 設定ドロップダウンから **Gateway をデバッグ** オプションを選択し、その後 **Start Debugging** ボタンを押します

これで TypeScript ソースファイル（`src/` ディレクトリ）にブレークポイントを設定でき、デバッガーはソースマップを介してブレークポイントをコンパイル済み JavaScript に正しくマッピングします。想定どおりに変数の確認、コードのステップ実行、コールスタックの調査ができます。

### 注

- **「Gateway をリビルドしてデバッグ」** オプションを使う場合、デバッガーを起動するたびに `/dist` フォルダーが完全に削除され、Gateway の開始前にソースマップを有効にした完全な `pnpm build` が実行されます
- **「Gateway をデバッグ」** オプションを使う場合、デバッグセッションは `/dist` フォルダーに影響を与えずいつでも開始および停止できますが、デバッグの有効化とビルドサイクルの管理の両方に別のターミナルプロセスを使う必要があります
- プロジェクトの他のセクションをデバッグするには、`args` の `launch.json` 設定を変更します
- 他のタスクでビルド済みの OpenClaw CLI を使う必要がある場合（たとえば、デバッグセッションが新しい認証トークンを生成する場合の `dashboard --no-open`）、別のターミナルで `node ./openclaw.mjs` として実行するか、`alias openclaw-build="node $(pwd)/openclaw.mjs"` のようなシェルエイリアスを作成できます

## 関連

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
