---
read_when:
    - 生のモデル出力を検査して推論の漏えいがないか確認する必要があります
    - Gateway を監視モードで実行しながら反復作業したい場合
    - 再現性のあるデバッグワークフローが必要です
summary: 'デバッグツール: 監視モード、生のモデルストリーム、推論漏えいのトレース'
title: デバッグ
x-i18n:
    generated_at: "2026-05-02T22:19:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a72a1508915e37ffdc5317889cdfde7024de3f5702739640abc2f03c3abadb7
    source_path: help/debugging.md
    workflow: 16
---

デバッグヘルパーはストリーミング出力用です。特にプロバイダーが通常のテキストに推論を混ぜる場合に役立ちます。

## ランタイムデバッグオーバーライド

チャットで `/debug` を使うと、**ランタイム専用**の設定オーバーライド（メモリ上のみ、ディスクには保存しない）を設定できます。
`/debug` はデフォルトで無効です。`commands.debug: true` で有効化します。
これは、`openclaw.json` を編集せずに分かりにくい設定を切り替える必要がある場合に便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドを消去し、ディスク上の設定に戻します。

## セッショントレース出力

完全な詳細モードを有効にせず、1つのセッションでPluginが所有するトレース/デバッグ行を確認したい場合は、`/trace` を使用します。

例:

```text
/trace
/trace on
/trace off
```

Active Memoryのデバッグ要約など、Plugin診断には `/trace` を使用します。
通常の詳細なステータス/ツール出力には引き続き `/verbose` を使用し、ランタイム専用の設定オーバーライドには引き続き `/debug` を使用します。

## Pluginライフサイクルトレース

Pluginライフサイクルコマンドが遅く感じられ、Pluginメタデータ、検出、レジストリ、ランタイムミラー、設定変更、更新処理について組み込みのフェーズ内訳が必要な場合は、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を使用します。このトレースはオプトインで、stderr に書き込まれるため、JSONコマンド出力は引き続き解析可能です。

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

CPUプロファイラーに手を伸ばす前に、Pluginライフサイクルの調査にこれを使用します。
コマンドがソースチェックアウトから実行されている場合は、`pnpm build` の後に `node dist/entry.js ...` でビルド済みランタイムを測定することを優先してください。`pnpm openclaw ...` はソースランナーのオーバーヘッドも測定します。

## CLI起動とコマンドプロファイリング

コマンドが遅く感じられる場合は、リポジトリに含まれている起動ベンチマークを使用します。

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

通常のソースランナー経由で一度限りのプロファイリングを行うには、`OPENCLAW_RUN_NODE_CPU_PROF_DIR` を設定します。

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ソースランナーはNode CPUプロファイルフラグを追加し、コマンド用の `.cpuprofile` を書き込みます。コマンドコードに一時的な計測を追加する前にこれを使用します。

## Gatewayウォッチモード

高速な反復には、ファイルウォッチャーの下でGatewayを実行します。

```bash
pnpm gateway:watch
```

デフォルトでは、これにより `openclaw-gateway-watch-main` という名前のtmuxセッション（または `openclaw-gateway-watch-dev-19001` のようなプロファイル/ポート固有のバリアント）が開始または再起動され、対話型ターミナルから自動的にアタッチされます。
非対話型シェル、CI、エージェントのexec呼び出しはデタッチされたままになり、代わりにアタッチ手順を出力します。必要に応じて手動でアタッチします。

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmuxペインは生のウォッチャーを実行します。

```bash
node scripts/watch-node.mjs gateway --force
```

tmuxが不要な場合はフォアグラウンドモードを使用します。

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux管理は維持したまま自動アタッチを無効にします。

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

起動時/ランタイムのホットスポットをデバッグする際は、監視対象GatewayのCPU時間をプロファイルします。

```bash
pnpm gateway:watch --benchmark
```

ウォッチラッパーはGatewayを呼び出す前に `--benchmark` を消費し、Gateway子プロセスが終了するたびにV8 `.cpuprofile` を `.artifacts/gateway-watch-profiles/` の下に1つ書き込みます。監視対象Gatewayを停止または再起動して現在のプロファイルをフラッシュし、Chrome DevTools または Speedscope で開きます。

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

プロファイルを別の場所に保存したい場合は、`--benchmark-dir <path>` を使用します。

tmuxラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` など、一般的な非秘密のランタイムセレクターをペインに引き継ぎます。プロバイダー認証情報は通常のプロファイル/設定に入れるか、一度限りの一時的なシークレットには生のフォアグラウンドモードを使用します。
管理対象のtmuxペインは、読みやすさのためにデフォルトで色付きのGatewayログも使用します。ANSI出力を無効にするには、`pnpm gateway:watch` の開始時に `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 配下のビルド関連ファイル、拡張機能のソースファイル、拡張機能の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、`package.json`、`tsdown.config.ts` の変更で再起動します。拡張機能メタデータの変更では、`tsdown` のリビルドを強制せずにGatewayを再起動します。ソースと設定の変更では、引き続き先に `dist` をリビルドします。

Gateway CLIフラグは `gateway:watch` の後に追加すると、各再起動時にそのまま渡されます。同じウォッチコマンドを再実行すると、名前付きtmuxペインが再生成されます。また、生のウォッチャーは単一ウォッチャーロックを維持するため、重複するウォッチャー親プロセスは積み上がらず置き換えられます。

## 開発プロファイル + 開発Gateway（--dev）

状態を分離し、デバッグ用の安全で使い捨てのセットアップを起動するには、開発プロファイルを使用します。`--dev` フラグは**2つ**あります。

- **グローバル `--dev`（プロファイル）:** 状態を `~/.openclaw-dev` の下に分離し、Gatewayポートのデフォルトを `19001` にします（派生ポートもそれに合わせて移動します）。
- **`gateway --dev`: 設定 + ワークスペースがない場合にGatewayへデフォルトの自動作成を指示します**（また、BOOTSTRAP.mdをスキップします）。

推奨フロー（開発プロファイル + 開発ブートストラップ）:

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

まだグローバルインストールがない場合は、`pnpm openclaw ...` 経由でCLIを実行します。

これが行うこと:

1. **プロファイル分離**（グローバル `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvasもそれに応じて移動）

2. **開発ブートストラップ**（`gateway --dev`）
   - 存在しない場合、最小設定を書き込みます（`gateway.mode=local`、local loopbackにバインド）。
   - `agent.workspace` を開発ワークスペースに設定します。
   - `agent.skipBootstrap=true` を設定します（BOOTSTRAP.mdなし）。
   - 存在しない場合、ワークスペースファイルをシードします:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - デフォルトのアイデンティティ: **C3‑PO**（プロトコルドロイド）。
   - 開発モードではチャネルプロバイダーをスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（新規開始）:

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は**グローバル**プロファイルフラグであり、一部のランナーに消費されます。明示的に指定する必要がある場合は、環境変数形式を使用します。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、認証情報、セッション、開発ワークスペースを消去し（`rm` ではなく `trash` を使用）、その後デフォルトの開発セットアップを再作成します。

<Tip>
非開発Gatewayがすでに実行中（launchdまたはsystemd）の場合は、先に停止します。

```bash
openclaw gateway stop
```

</Tip>

## 生ストリームログ（OpenClaw）

OpenClawは、フィルタリング/フォーマットの前に**生のアシスタントストリーム**をログに記録できます。
これは、推論がプレーンテキストの差分として届いているのか（または別個のthinkingブロックとして届いているのか）を確認する最適な方法です。

CLI経由で有効化します。

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

ブロックに解析される前の**生のOpenAI互換チャンク**を取得するために、pi-monoは別個のロガーを公開しています。

```bash
PI_RAW_STREAM=1
```

任意のパス:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

デフォルトファイル:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注: これは、pi-monoの
> `openai-completions` プロバイダーを使用するプロセスからのみ出力されます。

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる場合があります。
- ログはローカルに保管し、デバッグ後に削除してください。
- ログを共有する場合は、先にシークレットとPIIを削除してください。

## 関連

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
