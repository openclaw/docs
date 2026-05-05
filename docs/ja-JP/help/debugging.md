---
read_when:
    - 推論の漏えいがないか、未加工のモデル出力を確認する必要があります
    - イテレーション中に Gateway を watch モードで実行したい
    - 繰り返し使えるデバッグワークフローが必要です
summary: 'デバッグツール: ウォッチモード、生のモデルストリーム、推論漏えいの追跡'
title: デバッグ
x-i18n:
    generated_at: "2026-05-05T01:46:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力をデバッグするためのヘルパー。特に、プロバイダーが推論を通常のテキストに混在させる場合に有用です。

## ランタイムデバッグオーバーライド

チャットで `/debug` を使用すると、**ランタイム専用** の設定オーバーライド（メモリ上のみ、ディスクには保存されません）を設定できます。
`/debug` はデフォルトで無効です。`commands.debug: true` で有効にしてください。
`openclaw.json` を編集せずに、わかりにくい設定を切り替える必要がある場合に便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドをクリアし、ディスク上の設定に戻します。

## セッショントレース出力

完全な verbose モードを有効にせずに、1つのセッションで Plugin 所有のトレース/デバッグ行を確認したい場合は `/trace` を使用します。

例:

```text
/trace
/trace on
/trace off
```

Active Memory のデバッグ要約など、Plugin 診断には `/trace` を使用します。
通常の verbose ステータス/ツール出力には引き続き `/verbose` を使用し、ランタイム専用の設定オーバーライドには引き続き `/debug` を使用してください。

## Plugin ライフサイクルトレース

Plugin ライフサイクルコマンドが遅く感じられ、Plugin メタデータ、検出、レジストリ、ランタイムミラー、設定変更、更新作業について組み込みのフェーズ内訳が必要な場合は、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を使用します。トレースはオプトインで stderr に書き込まれるため、JSON コマンド出力は引き続き解析可能です。

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

CPU プロファイラーに頼る前に、Plugin ライフサイクル調査にはこれを使用してください。
コマンドをソースチェックアウトから実行している場合は、`pnpm build` 後に `node dist/entry.js ...` でビルド済みランタイムを測定することを優先してください。`pnpm openclaw ...` ではソースランナーのオーバーヘッドも測定されます。

## CLI 起動とコマンドプロファイリング

コマンドが遅く感じられる場合は、チェックイン済みの起動ベンチマークを使用します。

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

通常のソースランナー経由で単発のプロファイリングを行うには、`OPENCLAW_RUN_NODE_CPU_PROF_DIR` を設定します。

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ソースランナーは Node CPU プロファイルフラグを追加し、コマンド用の `.cpuprofile` を書き込みます。コマンドコードに一時的な計測を追加する前に、これを使用してください。

同期的なファイルシステム処理やモジュールローダー処理のように見える起動停止には、ソースランナー経由で Node の sync I/O トレースフラグを追加します。

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` は、監視対象の Gateway 子プロセスに対してこのフラグをデフォルトで有効にします。
watch モードで Node sync I/O トレース出力を抑制するには、`OPENCLAW_TRACE_SYNC_IO=0` を設定します。

## Gateway watch モード

高速な反復作業には、ファイルウォッチャーの下で gateway を実行します。

```bash
pnpm gateway:watch
```

デフォルトでは、`openclaw-gateway-watch-main` という名前の tmux セッション（または `openclaw-gateway-watch-dev-19001` のようなプロファイル/ポート固有のバリアント）を開始または再起動し、インタラクティブ端末から自動アタッチします。
非インタラクティブシェル、CI、エージェント exec 呼び出しはデタッチされたままになり、代わりにアタッチ手順を出力します。必要に応じて手動でアタッチしてください。

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux ペインは生のウォッチャーを実行します。

```bash
node scripts/watch-node.mjs gateway --force
```

tmux が不要な場合はフォアグラウンドモードを使用します。

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 管理を維持したまま自動アタッチを無効にします。

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

起動時やランタイムのホットスポットをデバッグするときは、監視対象 Gateway の CPU 時間をプロファイルします。

```bash
pnpm gateway:watch --benchmark
```

watch ラッパーは Gateway を呼び出す前に `--benchmark` を消費し、Gateway 子プロセスの終了ごとに V8 `.cpuprofile` を1つ `.artifacts/gateway-watch-profiles/` 配下に書き込みます。現在のプロファイルをフラッシュするには、監視対象 gateway を停止または再起動し、その後 Chrome DevTools または Speedscope で開きます。

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

プロファイルを別の場所に置きたい場合は `--benchmark-dir <path>` を使用します。
ベンチマーク対象の子プロセスでデフォルトの `--force` ポートクリーンアップをスキップし、Gateway ポートがすでに使用中の場合に即座に失敗させたい場合は、`--benchmark-no-force` を使用します。
ベンチマークモードでは、sync-I/O トレースの大量出力はデフォルトで抑制されます。CPU プロファイルと Node sync-I/O スタックトレースの両方を明示的に必要とする場合は、`--benchmark` とともに `OPENCLAW_TRACE_SYNC_IO=1` を設定します。ベンチマークモードでは、それらのトレースブロックはベンチマークディレクトリ配下の `gateway-watch-output.log` に書き込まれ、ターミナルペインからはフィルタリングされます。通常の Gateway ログは引き続き表示されます。

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` など、一般的な非シークレットのランタイムセレクターをペインに引き継ぎます。
プロバイダー認証情報は通常のプロファイル/設定に入れるか、単発の一時シークレットには生のフォアグラウンドモードを使用してください。
監視対象 Gateway が起動中に終了した場合、ウォッチャーは `openclaw doctor --fix --non-interactive` を一度実行してから Gateway 子プロセスを再起動します。
開発専用の修復パスなしで元の起動失敗を確認したい場合は、`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を使用します。
管理対象の tmux ペインでは、読みやすさのために色付き Gateway ログもデフォルトで有効です。ANSI 出力を無効にするには、`pnpm gateway:watch` の起動時に `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 配下のビルド関連ファイル、extension ソースファイル、extension の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、`package.json`、`tsdown.config.ts` で再起動します。extension メタデータの変更では、`tsdown` の再ビルドを強制せずに gateway が再起動されます。ソースと設定の変更では、引き続き先に `dist` が再ビルドされます。

gateway CLI フラグは `gateway:watch` の後に追加すると、各再起動時にそのまま渡されます。同じ watch コマンドを再実行すると、名前付き tmux ペインが再生成されます。また、生のウォッチャーは単一ウォッチャーロックを維持するため、重複するウォッチャー親プロセスが積み上がるのではなく置き換えられます。

## 開発プロファイル + 開発 gateway（--dev）

デバッグ用に状態を分離し、安全で使い捨て可能なセットアップを起動するには、開発プロファイルを使用します。`--dev` フラグは**2つ**あります。

- **グローバル `--dev`（プロファイル）:** 状態を `~/.openclaw-dev` 配下に分離し、gateway ポートをデフォルトで `19001` にします（派生ポートもそれに合わせてずれます）。
- **`gateway --dev`: 設定 + ワークスペースがない場合に Gateway にデフォルトを自動作成させます**（BOOTSTRAP.md はスキップします）。

推奨フロー（開発プロファイル + 開発 bootstrap）:

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

2. **開発 bootstrap**（`gateway --dev`）
   - 存在しない場合は最小設定を書き込みます（`gateway.mode=local`、loopback にバインド）。
   - `agent.workspace` を開発ワークスペースに設定します。
   - `agent.skipBootstrap=true` を設定します（BOOTSTRAP.md なし）。
   - 存在しない場合はワークスペースファイルをシードします:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`。
   - デフォルト identity: **C3‑PO**（プロトコルドロイド）。
   - 開発モードではチャンネルプロバイダーをスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（新規開始）:

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は**グローバル**プロファイルフラグであり、一部のランナーに消費されます。明示的に指定する必要がある場合は、環境変数形式を使用してください。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、認証情報、セッション、開発ワークスペースを消去し（`rm` ではなく `trash` を使用）、その後デフォルトの開発セットアップを再作成します。

<Tip>
非開発 gateway がすでに実行中の場合（launchd または systemd）、先に停止してください。

```bash
openclaw gateway stop
```

</Tip>

## 生ストリームログ（OpenClaw）

OpenClaw は、フィルタリング/整形の前に **生の assistant ストリーム** をログに記録できます。
これは、推論がプレーンテキスト delta として到着しているのか（または別個の thinking ブロックとして到着しているのか）を確認する最良の方法です。

CLI 経由で有効にします。

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

ブロックに解析される前の **生の OpenAI 互換チャンク** をキャプチャするために、pi-mono は別のロガーを公開しています。

```bash
PI_RAW_STREAM=1
```

任意のパス:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

デフォルトファイル:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注: これは pi-mono の `openai-completions` プロバイダーを使用するプロセスによってのみ出力されます。

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる可能性があります。
- ログはローカルに保持し、デバッグ後に削除してください。
- ログを共有する場合は、先にシークレットと PII を削除してください。

## 関連

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
