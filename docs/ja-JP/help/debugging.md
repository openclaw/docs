---
read_when:
    - 推論の漏えいがないか、生のモデル出力を調査する必要があります
    - 反復開発中に Gateway をウォッチモードで実行したい場合
    - 再現可能なデバッグワークフローが必要です
summary: 'デバッグツール: ウォッチモード、生のモデルストリーム、推論内容の漏えいのトレース'
title: デバッグ
x-i18n:
    generated_at: "2026-05-03T21:34:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力のデバッグヘルパー。特に、プロバイダーが推論を通常のテキストに混ぜる場合に役立ちます。

## ランタイムデバッグオーバーライド

チャットで `/debug` を使用して、**ランタイム専用**の設定オーバーライドを設定します（メモリ上のみ、ディスクには保存されません）。
`/debug` はデフォルトで無効です。`commands.debug: true` で有効にします。
これは、`openclaw.json` を編集せずに分かりにくい設定を切り替える必要がある場合に便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドをクリアし、ディスク上の設定に戻します。

## セッショントレース出力

完全な詳細モードを有効にせず、1 つのセッションで Plugin が所有するトレース/デバッグ行を確認したい場合は、`/trace` を使用します。

例:

```text
/trace
/trace on
/trace off
```

Active Memory のデバッグ要約などの Plugin 診断には `/trace` を使用します。
通常の詳細なステータス/ツール出力には引き続き `/verbose` を使用し、ランタイム専用の設定オーバーライドには引き続き
`/debug` を使用します。

## Plugin ライフサイクルトレース

Plugin ライフサイクルコマンドが遅く感じられ、Plugin メタデータ、検出、レジストリ、ランタイムミラー、設定変更、更新作業について組み込みのフェーズ分解が必要な場合は、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を使用します。このトレースはオプトインで、stderr に書き込まれるため、JSON コマンド出力は解析可能なままです。

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

CPU プロファイラーに手を伸ばす前に、Plugin ライフサイクルの調査にはこれを使用します。
コマンドをソースチェックアウトから実行している場合は、`pnpm build` の後に `node dist/entry.js ...` でビルド済みランタイムを測定することを推奨します。`pnpm openclaw ...`
ではソースランナーのオーバーヘッドも測定されます。

## CLI 起動とコマンドプロファイリング

コマンドが遅く感じられる場合は、チェックイン済みの起動ベンチマークを使用します。

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

通常のソースランナー経由で一回限りのプロファイリングを行うには、
`OPENCLAW_RUN_NODE_CPU_PROF_DIR` を設定します。

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ソースランナーは Node CPU プロファイルフラグを追加し、コマンドの
`.cpuprofile` を書き込みます。コマンドコードに一時的な計測を追加する前にこれを使用します。

## Gateway ウォッチモード

高速な反復作業には、ファイルウォッチャーの下で Gateway を実行します。

```bash
pnpm gateway:watch
```

デフォルトでは、`openclaw-gateway-watch-main` という名前の tmux セッション（または
`openclaw-gateway-watch-dev-19001` のようなプロファイル/ポート固有のバリアント）を開始または再起動し、対話型ターミナルから自動的にアタッチします。
非対話型シェル、CI、エージェントの exec 呼び出しはデタッチされたままになり、代わりにアタッチ手順を出力します。必要な場合は手動でアタッチします。

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

起動時/ランタイムのホットスポットをデバッグするときは、監視中の Gateway CPU 時間をプロファイルします。

```bash
pnpm gateway:watch --benchmark
```

ウォッチラッパーは Gateway を呼び出す前に `--benchmark` を消費し、Gateway 子プロセスの終了ごとに 1 つの V8 `.cpuprofile` を
`.artifacts/gateway-watch-profiles/` の下に書き込みます。現在のプロファイルをフラッシュするには、監視中の Gateway を停止または再起動し、その後 Chrome DevTools または Speedscope で開きます。

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

プロファイルを別の場所に置きたい場合は `--benchmark-dir <path>` を使用します。
ベンチマーク対象の子プロセスでデフォルトの `--force` ポートクリーンアップをスキップし、Gateway ポートがすでに使用中の場合にすぐ失敗させたい場合は、`--benchmark-no-force` を使用します。

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` などの一般的な非シークレットのランタイムセレクターをペインに引き継ぎます。プロバイダー資格情報は通常のプロファイル/設定に置くか、一回限りの一時的なシークレットには生のフォアグラウンドモードを使用します。
監視中の Gateway が起動中に終了した場合、ウォッチャーは
`openclaw doctor --fix --non-interactive` を 1 回実行し、Gateway 子プロセスを再起動します。
開発専用の修復パスを使わずに元の起動失敗を確認したい場合は、`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を使用します。
管理対象の tmux ペインでは、読みやすさのために色付きの Gateway ログもデフォルトになります。ANSI 出力を無効にするには、`pnpm gateway:watch` の開始時に `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 配下のビルド関連ファイル、拡張機能のソースファイル、拡張機能の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、
`package.json`、`tsdown.config.ts` で再起動します。拡張機能メタデータの変更では、`tsdown` のリビルドを強制せずに Gateway を再起動します。ソースと設定の変更では、引き続き先に `dist` をリビルドします。

Gateway CLI フラグは `gateway:watch` の後に追加すると、各再起動時にそのまま渡されます。同じウォッチコマンドを再実行すると、名前付きの tmux ペインが再生成されます。また、生のウォッチャーは単一ウォッチャーロックを維持するため、重複したウォッチャー親プロセスは積み上がらずに置き換えられます。

## 開発プロファイル + 開発 Gateway（--dev）

状態を分離し、デバッグ用の安全で使い捨て可能なセットアップを起動するには、開発プロファイルを使用します。
`--dev` フラグは**2 種類**あります。

- **グローバル `--dev`（プロファイル）:** 状態を `~/.openclaw-dev` の下に分離し、Gateway ポートをデフォルトで `19001` にします（派生ポートもそれに合わせて移動します）。
- **`gateway --dev`: Gateway に、存在しない場合はデフォルト設定 + ワークスペースを自動作成するよう指示します**（そして BOOTSTRAP.md をスキップします）。

推奨フロー（開発プロファイル + 開発ブートストラップ）:

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

グローバルインストールがまだない場合は、`pnpm openclaw ...` 経由で CLI を実行します。

これが行うこと:

1. **プロファイル分離**（グローバル `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（ブラウザー/canvas もそれに応じて移動）

2. **開発ブートストラップ**（`gateway --dev`）
   - 存在しない場合は最小設定を書き込みます（`gateway.mode=local`、loopback にバインド）。
   - `agent.workspace` を開発ワークスペースに設定します。
   - `agent.skipBootstrap=true` を設定します（BOOTSTRAP.md なし）。
   - 存在しない場合はワークスペースファイルをシードします:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - デフォルトのアイデンティティ: **C3‑PO**（プロトコルドロイド）。
   - 開発モードではチャネルプロバイダーをスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（新規開始）:

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は**グローバル**プロファイルフラグであり、一部のランナーに消費されます。明示的に指定する必要がある場合は、env var 形式を使用します。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、資格情報、セッション、開発ワークスペースを消去し（`rm` ではなく
`trash` を使用）、デフォルトの開発セットアップを再作成します。

<Tip>
非開発 Gateway がすでに実行中の場合（launchd または systemd）、先に停止します。

```bash
openclaw gateway stop
```

</Tip>

## 生ストリームログ（OpenClaw）

OpenClaw は、フィルタリング/整形の前に**生のアシスタントストリーム**をログに記録できます。
これは、推論がプレーンテキストのデルタとして届いているのか（または別個の思考ブロックとして届いているのか）を確認する最良の方法です。

CLI 経由で有効にします。

```bash
pnpm gateway:watch --raw-stream
```

任意のパスオーバーライド:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

同等の env var:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

デフォルトファイル:

`~/.openclaw/logs/raw-stream.jsonl`

## 生チャンクログ（pi-mono）

ブロックに解析される前の**生の OpenAI 互換チャンク**を取得するために、pi-mono は別のロガーを公開しています。

```bash
PI_RAW_STREAM=1
```

任意のパス:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

デフォルトファイル:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注: これは、pi-mono の
> `openai-completions` プロバイダーを使用するプロセスによってのみ出力されます。

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれることがあります。
- ログはローカルに保持し、デバッグ後に削除してください。
- ログを共有する場合は、先にシークレットと PII を除去してください。

## 関連

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
