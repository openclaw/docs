---
read_when:
    - 推論の漏えいがないか、モデルの生出力を確認する必要があります
    - 反復開発中に Gateway をウォッチモードで実行したい場合
    - 再現可能なデバッグワークフローが必要です
summary: 'デバッグツール: ウォッチモード、生のモデルストリーム、推論漏洩の追跡'
title: デバッグ
x-i18n:
    generated_at: "2026-05-10T19:38:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: adee3f6e81af12c73e7e8126111f5c4bcba1a5014f4d0d0714ae67b45db93cb0
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力のデバッグ補助。特に、プロバイダーが推論を通常のテキストに混在させる場合に役立ちます。

## ランタイムデバッグオーバーライド

チャットで `/debug` を使うと、**ランタイム専用**の設定オーバーライドを設定できます（メモリ上のみで、ディスクには保存されません）。
`/debug` はデフォルトで無効です。有効にするには `commands.debug: true` を設定します。
`openclaw.json` を編集せずに、分かりにくい設定を切り替える必要がある場合に便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドをクリアし、ディスク上の設定に戻します。

## セッショントレース出力

完全な詳細モードを有効にせずに、1つのセッションでPluginが所有するトレース/デバッグ行を見たい場合は `/trace` を使います。

例:

```text
/trace
/trace on
/trace off
```

Active Memory のデバッグ要約など、Plugin診断には `/trace` を使います。
通常の詳細ステータス/ツール出力には引き続き `/verbose` を使い、ランタイム専用の設定オーバーライドには引き続き `/debug` を使います。

## Pluginライフサイクルトレース

Pluginライフサイクルコマンドが遅く感じられ、Pluginメタデータ、検出、レジストリ、ランタイムミラー、設定変更、更新処理について組み込みのフェーズ内訳が必要な場合は、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を使います。トレースはオプトインで stderr に書き込むため、JSON コマンド出力は解析可能なままです。

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

CPU プロファイラーに頼る前に、Pluginライフサイクルの調査にはこれを使います。
コマンドがソースチェックアウトから実行されている場合は、`pnpm build` の後に `node dist/entry.js ...` でビルド済みランタイムを計測することを推奨します。`pnpm openclaw ...` ではソースランナーのオーバーヘッドも計測されます。

## CLI 起動とコマンドのプロファイリング

コマンドが遅く感じられる場合は、チェックイン済みの起動ベンチマークを使います。

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

通常のソースランナー経由で一回限りのプロファイリングを行うには、`OPENCLAW_RUN_NODE_CPU_PROF_DIR` を設定します。

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ソースランナーは Node の CPU プロファイルフラグを追加し、コマンド用の `.cpuprofile` を書き込みます。コマンドコードに一時的な計測を追加する前にこれを使います。

同期ファイルシステム処理やモジュールローダー処理のように見える起動停止の場合は、ソースランナー経由で Node の同期 I/O トレースフラグを追加します。

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` は、監視対象のGateway子プロセスではこのフラグをデフォルトで無効のままにします。ウォッチモードで Node の同期 I/O トレース出力を明示的に必要とする場合は、`OPENCLAW_TRACE_SYNC_IO=1` を設定します。

## Gatewayウォッチモード

高速な反復作業には、ファイルウォッチャーの下でGatewayを実行します。

```bash
pnpm gateway:watch
```

デフォルトでは、これは `openclaw-gateway-watch-main` という名前の tmux セッション（または `openclaw-gateway-watch-dev-19001` のようなプロファイル/ポート固有のバリアント）を開始または再起動し、対話型ターミナルから自動アタッチします。
非対話型シェル、CI、エージェントの exec 呼び出しはデタッチされたままで、代わりにアタッチ手順を表示します。必要に応じて手動でアタッチします。

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux ペインは生のウォッチャーを実行します。

```bash
node scripts/watch-node.mjs gateway --force
```

tmux が不要な場合は、フォアグラウンドモードを使います。

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 管理を維持したまま自動アタッチを無効にします。

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

起動時/ランタイムのホットスポットをデバッグするときは、監視対象Gatewayの CPU 時間をプロファイルします。

```bash
pnpm gateway:watch --benchmark
```

ウォッチラッパーはGatewayを起動する前に `--benchmark` を消費し、Gateway子プロセスが終了するたびに、`.artifacts/gateway-watch-profiles/` の下へ V8 `.cpuprofile` を1つ書き込みます。現在のプロファイルをフラッシュするには、監視対象Gatewayを停止または再起動し、その後 Chrome DevTools または Speedscope で開きます。

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

プロファイルを別の場所に置きたい場合は `--benchmark-dir <path>` を使います。
ベンチマーク対象の子プロセスでデフォルトの `--force` ポートクリーンアップをスキップし、Gatewayポートがすでに使用中の場合に即座に失敗させたい場合は、`--benchmark-no-force` を使います。
ベンチマークモードでは、同期 I/O トレースの大量出力はデフォルトで抑制されます。CPU プロファイルと Node 同期 I/O スタックトレースの両方を明示的に必要とする場合は、`--benchmark` と一緒に `OPENCLAW_TRACE_SYNC_IO=1` を設定します。ベンチマークモードでは、それらのトレースブロックはベンチマークディレクトリ配下の `gateway-watch-output.log` に書き込まれ、ターミナルペインからはフィルタリングされます。通常のGatewayログは引き続き表示されます。

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` など、一般的な非シークレットのランタイムセレクターをペインへ引き継ぎます。プロバイダーの認証情報は通常のプロファイル/設定に置くか、一回限りの一時的なシークレットには生のフォアグラウンドモードを使います。
監視対象Gatewayが起動中に終了した場合、ウォッチャーは `openclaw doctor --fix --non-interactive` を1回実行し、Gateway子プロセスを再起動します。開発専用の修復パスなしで元の起動失敗を確認したい場合は、`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を使います。
管理対象の tmux ペインでは、読みやすさのためにGatewayログはデフォルトで色付きになります。ANSI 出力を無効にするには、`pnpm gateway:watch` を開始するときに `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 配下のビルド関連ファイル、拡張機能のソースファイル、拡張機能の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、`package.json`、`tsdown.config.ts` の変更で再起動します。拡張機能メタデータの変更では、`tsdown` のリビルドを強制せずにGatewayを再起動します。ソースと設定の変更では、引き続き先に `dist` をリビルドします。

Gatewayの CLI フラグは `gateway:watch` の後に追加すると、各再起動時にそのまま渡されます。同じウォッチコマンドを再実行すると、名前付き tmux ペインが再生成されます。また、生のウォッチャーは引き続き単一ウォッチャーロックを保持するため、重複したウォッチャー親プロセスは積み上がらずに置き換えられます。

## 開発プロファイル + 開発Gateway（--dev）

デバッグ用に状態を分離し、安全で使い捨て可能なセットアップを起動するには、開発プロファイルを使います。`--dev` フラグは**2つ**あります。

- **グローバル `--dev`（プロファイル）:** 状態を `~/.openclaw-dev` 配下に分離し、Gatewayポートをデフォルトで `19001` にします（派生ポートもそれに合わせてずれます）。
- **`gateway --dev`: 設定 + ワークスペースがない場合、Gatewayにデフォルトのものを自動作成させます**（かつ BOOTSTRAP.md をスキップします）。

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
   - `OPENCLAW_GATEWAY_PORT=19001`（ブラウザー/キャンバスもそれに応じてずれます）

2. **開発ブートストラップ**（`gateway --dev`）
   - 存在しない場合、最小設定を書き込みます（`gateway.mode=local`、loopback にバインド）。
   - `agent.workspace` を開発ワークスペースに設定します。
   - `agent.skipBootstrap=true` を設定します（BOOTSTRAP.md なし）。
   - 存在しない場合、ワークスペースファイルをシードします:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`。
   - デフォルトのアイデンティティ: **C3-PO**（プロトコルドロイド）。
   - 開発モードではチャネルプロバイダーをスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（新規開始）:

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は**グローバル**なプロファイルフラグであり、一部のランナーに消費されます。明示的に指定する必要がある場合は、環境変数形式を使います。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、認証情報、セッション、開発ワークスペースを消去し（`rm` ではなく `trash` を使用）、その後デフォルトの開発セットアップを再作成します。

<Tip>
非開発Gatewayがすでに実行中の場合（launchd または systemd）、先に停止します。

```bash
openclaw gateway stop
```

</Tip>

## 生ストリームログ（OpenClaw）

OpenClaw は、フィルタリング/整形の前に**生のアシスタントストリーム**をログに記録できます。
これは、推論がプレーンテキストのデルタとして到着しているのか（または別個の思考ブロックとして到着しているのか）を確認する最適な方法です。

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

## 生チャンクログ（pi-mono）

ブロックへ解析される前の**生の OpenAI 互換チャンク**をキャプチャするために、pi-mono は別のロガーを公開しています。

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
> `openai-completions` プロバイダーを使うプロセスによってのみ出力されます。

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる場合があります。
- ログはローカルに保持し、デバッグ後に削除します。
- ログを共有する場合は、先にシークレットと PII を取り除きます。

## VSCode でのデバッグ

ビルドプロセスの一部として生成ファイルの多くがハッシュ付きの名前になるため、VSCode ベースの IDE でデバッグを有効にするにはソースマップが必要です。含まれている `launch.json` 設定はGatewayサービスを対象にしていますが、他の用途にもすばやく適用できます。

1. **Gatewayをリビルドしてデバッグ** - 新しいビルドを作成した後にGatewayサービスをデバッグします
2. **Gatewayをデバッグ** - 既存ビルドのGatewayサービスをデバッグします

### セットアップ

デフォルトの **Gatewayをリビルドしてデバッグ** 設定は必要なものが揃っており、`/dist` フォルダーを自動的に削除して、デバッグを有効にした状態でプロジェクトをリビルドします。

1. アクティビティバーから **実行とデバッグ** パネルを開くか、`Ctrl`+`Shift`+`D` を押します
2. IDE で、設定ドロップダウンに **Gatewayをリビルドしてデバッグ** が選択されていることを確認し、その後 **デバッグの開始** ボタンを押します

または、ビルドとデバッグのプロセスを手動で管理したい場合:

1. ターミナルを開き、ソースマップを有効にします:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. 同じターミナルで、プロジェクトをリビルドします: `pnpm clean:dist && pnpm build`
3. IDE で、**実行とデバッグ** 設定ドロップダウンから **Gatewayをデバッグ** オプションを選択し、その後 **デバッグの開始** ボタンを押します

これで TypeScript ソースファイル（`src/` ディレクトリ）にブレークポイントを設定でき、デバッガーはソースマップを介してブレークポイントをコンパイル済み JavaScript に正しくマップします。期待どおりに変数を調べ、コードをステップ実行し、コールスタックを確認できます。

### 注記

- **「Gatewayをリビルドしてデバッグ」** オプションを使う場合、デバッガーを起動するたびに `/dist` フォルダーが完全に削除され、Gatewayを開始する前にソースマップを有効にした完全な `pnpm build` が実行されます
- **「Gatewayをデバッグ」** オプションを使う場合、デバッグセッションは `/dist` フォルダーに影響を与えずにいつでも開始および停止できますが、デバッグを有効にすることとビルドサイクルを管理することの両方に、別のターミナルプロセスを使う必要があります
- プロジェクトの他の部分をデバッグするには、`args` の `launch.json` 設定を変更します
- 他のタスクでビルド済みの OpenClaw CLI を使う必要がある場合（たとえば、デバッグセッションが新しい認証トークンを生成する場合の `dashboard --no-open`）、別のターミナルで `node ./openclaw.mjs` として実行するか、`alias openclaw-build="node $(pwd)/openclaw.mjs"` のようなシェルエイリアスを作成できます

## 関連

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
