---
read_when:
    - 推論漏えいを調べるために、生のモデル出力を検査する必要があります
    - 反復作業中に Gateway をウォッチモードで実行したい場合
    - 繰り返し実行できるデバッグワークフローが必要です
summary: 'デバッグツール: ウォッチモード、生のモデルストリーム、推論漏洩のトレース'
title: デバッグ
x-i18n:
    generated_at: "2026-05-06T05:07:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 286a2857f94b76501059dcb9b446678c5bcf45586b87c98344a58fdeb5b3cbae
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力用のデバッグヘルパーです。特に、プロバイダーが通常のテキストに推論を混ぜる場合に役立ちます。

## 実行時デバッグ上書き

チャットで `/debug` を使うと、**実行時専用**の設定上書き（メモリ上、ディスク上ではない）を設定できます。
`/debug` はデフォルトで無効です。`commands.debug: true` で有効にします。
これは、`openclaw.json` を編集せずに目立たない設定を切り替える必要がある場合に便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべての上書きをクリアし、ディスク上の設定に戻します。

## セッショントレース出力

完全な詳細モードを有効にせず、1つのセッションで Plugin 所有のトレース/デバッグ行を確認したい場合は `/trace` を使います。

例:

```text
/trace
/trace on
/trace off
```

Active Memory デバッグ要約などの Plugin 診断には `/trace` を使います。
通常の詳細なステータス/ツール出力には引き続き `/verbose` を使い、実行時専用の設定上書きには引き続き `/debug` を使います。

## Plugin ライフサイクルトレース

Plugin ライフサイクルコマンドが遅く感じられ、Plugin メタデータ、探索、レジストリ、ランタイムミラー、設定変更、更新処理について組み込みのフェーズ内訳が必要な場合は、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を使います。トレースはオプトインで stderr に書き込まれるため、JSON コマンド出力は引き続き解析可能です。

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
コマンドをソースチェックアウトから実行している場合は、`pnpm build` の後に `node dist/entry.js ...` でビルド済みランタイムを測定することを推奨します。`pnpm openclaw ...` はソースランナーのオーバーヘッドも測定します。

## CLI 起動とコマンドプロファイリング

コマンドが遅く感じられる場合は、チェックイン済みの起動ベンチマークを使います。

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

通常のソースランナー経由で単発プロファイリングを行うには、`OPENCLAW_RUN_NODE_CPU_PROF_DIR` を設定します。

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ソースランナーは Node CPU プロファイルフラグを追加し、コマンド用の `.cpuprofile` を書き込みます。コマンドコードに一時的な計測を追加する前にこれを使います。

同期ファイルシステム処理やモジュールローダー処理のように見える起動停止については、ソースランナー経由で Node の同期 I/O トレースフラグを追加します。

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` は、監視対象の Gateway 子プロセスに対してこのフラグをデフォルトで有効にします。watch モードで Node 同期 I/O トレース出力を抑制するには、`OPENCLAW_TRACE_SYNC_IO=0` を設定します。

## Gateway watch モード

高速な反復作業には、ファイルウォッチャー配下で Gateway を実行します。

```bash
pnpm gateway:watch
```

デフォルトでは、これは `openclaw-gateway-watch-main` という名前の tmux セッション（または `openclaw-gateway-watch-dev-19001` のようなプロファイル/ポート固有のバリアント）を開始または再起動し、対話型ターミナルから自動アタッチします。
非対話シェル、CI、エージェントの exec 呼び出しはデタッチされたままになり、代わりにアタッチ手順を出力します。必要に応じて手動でアタッチします。

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux ペインでは生のウォッチャーが実行されます。

```bash
node scripts/watch-node.mjs gateway --force
```

tmux が不要な場合はフォアグラウンドモードを使います。

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 管理を維持しながら自動アタッチを無効にします。

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

起動/ランタイムのホットスポットをデバッグする場合は、監視対象 Gateway の CPU 時間をプロファイルします。

```bash
pnpm gateway:watch --benchmark
```

watch ラッパーは Gateway を起動する前に `--benchmark` を消費し、Gateway 子プロセスが終了するたびに `.artifacts/gateway-watch-profiles/` の下へ V8 `.cpuprofile` を1つ書き込みます。現在のプロファイルをフラッシュするには、監視対象 Gateway を停止または再起動し、その後 Chrome DevTools または Speedscope で開きます。

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

プロファイルを別の場所に置きたい場合は `--benchmark-dir <path>` を使います。
ベンチマーク対象の子プロセスでデフォルトの `--force` ポートクリーンアップをスキップし、Gateway ポートがすでに使用中の場合に高速に失敗させたい場合は、`--benchmark-no-force` を使います。
ベンチマークモードでは、デフォルトで同期 I/O トレースの大量出力が抑制されます。CPU プロファイルと Node 同期 I/O スタックトレースの両方を明示的に必要とする場合は、`--benchmark` とあわせて `OPENCLAW_TRACE_SYNC_IO=1` を設定します。ベンチマークモードでは、これらのトレースブロックはベンチマークディレクトリ配下の `gateway-watch-output.log` に書き込まれ、ターミナルペインからはフィルターされます。通常の Gateway ログは引き続き表示されます。

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` など、一般的な非秘密のランタイムセレクターをペインへ引き継ぎます。プロバイダー資格情報は通常のプロファイル/設定に入れるか、単発の一時的な秘密情報には生のフォアグラウンドモードを使います。
監視対象 Gateway が起動中に終了した場合、ウォッチャーは `openclaw doctor --fix --non-interactive` を1回実行し、Gateway 子プロセスを再起動します。開発専用の修復パスなしで元の起動失敗を確認したい場合は、`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を使います。
管理対象 tmux ペインは、読みやすさのために色付き Gateway ログもデフォルトで有効にします。ANSI 出力を無効にするには、`pnpm gateway:watch` の開始時に `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 配下のビルド関連ファイル、拡張機能のソースファイル、拡張機能の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、`package.json`、`tsdown.config.ts` で再起動します。拡張機能メタデータの変更では、`tsdown` のリビルドを強制せずに Gateway を再起動します。ソースと設定の変更では、引き続き先に `dist` をリビルドします。

任意の Gateway CLI フラグを `gateway:watch` の後に追加すると、各再起動時にそのまま渡されます。同じ watch コマンドを再実行すると、名前付き tmux ペインが再生成されます。また、生のウォッチャーは単一ウォッチャーロックを維持するため、重複したウォッチャー親プロセスは積み上がらずに置き換えられます。

## 開発プロファイル + 開発 Gateway（--dev）

状態を分離し、デバッグ用の安全で使い捨て可能なセットアップを起動するには、開発プロファイルを使います。`--dev` フラグは**2つ**あります。

- **グローバル `--dev`（プロファイル）:** 状態を `~/.openclaw-dev` 配下に分離し、Gateway ポートをデフォルトで `19001` にします（派生ポートもそれにあわせてずれます）。
- **`gateway --dev`: 欠落している場合に Gateway へデフォルト設定 + ワークスペースを自動作成させます**（また、BOOTSTRAP.md をスキップします）。

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
   - `OPENCLAW_GATEWAY_PORT=19001`（ブラウザー/canvas もそれに応じてずれます）

2. **開発ブートストラップ**（`gateway --dev`）
   - 欠落している場合に最小設定を書き込みます（`gateway.mode=local`、ループバックにバインド）。
   - `agent.workspace` を開発ワークスペースに設定します。
   - `agent.skipBootstrap=true` を設定します（BOOTSTRAP.md なし）。
   - 欠落している場合にワークスペースファイルをシードします:
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - デフォルト ID: **C3‑PO**（プロトコルドロイド）。
   - 開発モードではチャネルプロバイダーをスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（新規開始）:

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は**グローバル**プロファイルフラグであり、一部のランナーに消費されます。明示的に指定する必要がある場合は、環境変数形式を使います。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、資格情報、セッション、開発ワークスペースを（`rm` ではなく `trash` を使って）消去し、その後デフォルトの開発セットアップを再作成します。

<Tip>
非開発 Gateway がすでに実行中の場合（launchd または systemd）、先に停止します。

```bash
openclaw gateway stop
```

</Tip>

## 生ストリームロギング（OpenClaw）

OpenClaw は、フィルタリング/整形前の**生のアシスタントストリーム**をログに記録できます。
これは、推論がプレーンテキストのデルタとして届いているのか（または別個の thinking ブロックとして届いているのか）を確認する最適な方法です。

CLI で有効にします。

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

デフォルトファイル:

`~/.openclaw/logs/raw-stream.jsonl`

## 生チャンクロギング（pi-mono）

ブロックへ解析される前の**生の OpenAI 互換チャンク**をキャプチャするために、pi-mono は別個のロガーを公開しています。

```bash
PI_RAW_STREAM=1
```

任意のパス:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

デフォルトファイル:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注: これは pi-mono の
> `openai-completions` プロバイダーを使用するプロセスによってのみ出力されます。

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる可能性があります。
- ログはローカルに保持し、デバッグ後に削除してください。
- ログを共有する場合は、先に秘密情報と PII を削除してください。

## VSCode でのデバッグ

ビルドプロセスの一環として生成ファイルの多くがハッシュ付きの名前になるため、VSCode ベースの IDE でデバッグを有効にするにはソースマップが必要です。含まれている `launch.json` 設定は Gateway サービスを対象にしていますが、他の用途にもすぐに適用できます。

1. **Gateway をリビルドしてデバッグ** - 新しいビルドを作成した後に Gateway サービスをデバッグします
2. **Gateway をデバッグ** - 既存ビルドの Gateway サービスをデバッグします

### セットアップ

デフォルトの **Gateway をリビルドしてデバッグ** 設定には必要なものが含まれており、`/dist` フォルダーを自動的に削除し、デバッグを有効にしてプロジェクトをリビルドします。

1. Activity Bar から **Run and Debug** パネルを開くか、`Ctrl`+`Shift`+`D` を押します
2. IDE で、設定ドロップダウンに **Gateway をリビルドしてデバッグ** が選択されていることを確認し、**Start Debugging** ボタンを押します

または、ビルドとデバッグプロセスを手動で管理したい場合:

1. ターミナルを開き、ソースマップを有効にします:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. 同じターミナルでプロジェクトをリビルドします: `pnpm clean:dist && pnpm build`
3. IDE で、**Run and Debug** 設定ドロップダウンから **Gateway をデバッグ** オプションを選択し、**Start Debugging** ボタンを押します

これで TypeScript ソースファイル（`src/` ディレクトリ）にブレークポイントを設定でき、デバッガーはソースマップを通じてブレークポイントをコンパイル済み JavaScript に正しく対応付けます。期待どおりに変数を検査し、コードをステップ実行し、コールスタックを確認できます。

### 注記

- **"Rebuild and Debug Gateway"** オプションを使う場合、デバッガーを起動するたびに `/dist` フォルダーが完全に削除され、Gateway を開始する前にソースマップを有効にした完全な `pnpm build` が実行されます
- **"Debug Gateway"** オプションを使う場合、デバッグセッションは `/dist` フォルダーに影響を与えず、いつでも開始および停止できますが、デバッグの有効化とビルドサイクルの管理の両方に別個のターミナルプロセスを使う必要があります
- プロジェクトの他の部分をデバッグするには、`args` の `launch.json` 設定を変更します
- 他のタスクでビルド済み OpenClaw CLI を使う必要がある場合（たとえば、デバッグセッションが新しい認証トークンを生成する場合の `dashboard --no-open`）、別のターミナルで `node ./openclaw.mjs` として実行するか、`alias openclaw-build="node $(pwd)/openclaw.mjs"` のようなシェルエイリアスを作成できます

## 関連

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
