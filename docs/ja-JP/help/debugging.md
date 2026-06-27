---
read_when:
    - 推論漏えいがないか生のモデル出力を調査する必要があります
    - Gateway を反復開発中にウォッチモードで実行したい
    - 再現可能なデバッグワークフローが必要です
summary: 'デバッグツール: ウォッチモード、生のモデルストリーム、推論漏洩のトレース'
title: デバッグ
x-i18n:
    generated_at: "2026-06-27T11:41:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力のデバッグヘルパー。特に、プロバイダーが推論を通常テキストに混ぜる場合に役立ちます。

## ランタイムデバッグオーバーライド

チャットで `/debug` を使用して、**ランタイム限定**の設定オーバーライドを設定します（メモリ上のみ、ディスクには保存されません）。
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

完全な verbose モードを有効にせずに、1つのセッションで Plugin 所有のトレース/デバッグ行を確認したい場合は `/trace` を使用します。

例:

```text
/trace
/trace on
/trace off
```

Active Memory のデバッグ要約など、Plugin 診断には `/trace` を使用します。
通常の verbose なステータス/ツール出力には引き続き `/verbose` を使用し、ランタイム限定の設定オーバーライドには引き続き `/debug` を使用します。

## Plugin ライフサイクルトレース

Plugin ライフサイクルコマンドが遅く感じられ、Plugin メタデータ、検出、レジストリ、ランタイムミラー、設定変更、更新作業について組み込みのフェーズ内訳が必要な場合は、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を使用します。トレースはオプトインで stderr に書き込まれるため、JSON コマンド出力は解析可能なままです。

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

CPU プロファイラーを使う前に、Plugin ライフサイクル調査にはこれを使用します。
コマンドをソースチェックアウトから実行している場合は、`pnpm build` 後に `node dist/entry.js ...` でビルド済みランタイムを計測することを優先します。`pnpm openclaw ...` ではソースランナーのオーバーヘッドも計測されます。

## CLI 起動とコマンドプロファイリング

コマンドが遅く感じられる場合は、チェックイン済みの起動ベンチマークを使用します:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

通常のソースランナー経由で単発プロファイリングを行うには、`OPENCLAW_RUN_NODE_CPU_PROF_DIR` を設定します:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

ソースランナーは Node CPU プロファイルフラグを追加し、コマンド用の `.cpuprofile` を書き込みます。コマンドコードに一時的な計測を追加する前にこれを使用します。

起動の停止が同期ファイルシステム処理またはモジュールローダー処理に見える場合は、ソースランナー経由で Node の同期 I/O トレースフラグを追加します:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` は、監視対象の Gateway 子プロセスではこのフラグをデフォルトで無効のままにします。ウォッチモードで Node 同期 I/O トレース出力を明示的に必要とする場合は、`OPENCLAW_TRACE_SYNC_IO=1` を設定します。

## Gateway ウォッチモード

高速な反復作業には、ファイルウォッチャー配下で gateway を実行します:

```bash
pnpm gateway:watch
```

デフォルトでは、これは `openclaw-gateway-watch-main` という名前の tmux セッション（または `openclaw-gateway-watch-dev-19001` のようなプロファイル/ポート固有のバリアント）を開始または再起動し、対話型ターミナルから自動的にアタッチします。
非対話型シェル、CI、エージェントの exec 呼び出しではデタッチされたままになり、代わりにアタッチ手順を出力します。必要に応じて手動でアタッチします:

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux ペインは生のウォッチャーを実行します:

```bash
node scripts/watch-node.mjs gateway --force
```

tmux が不要な場合はフォアグラウンドモードを使用します:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux 管理を維持しながら自動アタッチを無効にします:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

起動時/実行時のホットスポットをデバッグする場合は、監視対象 Gateway の CPU 時間をプロファイルします:

```bash
pnpm gateway:watch --benchmark
```

ウォッチラッパーは Gateway を起動する前に `--benchmark` を消費し、Gateway 子プロセスが終了するたびに `.artifacts/gateway-watch-profiles/` 配下へ V8 `.cpuprofile` を1つ書き込みます。現在のプロファイルをフラッシュするには、監視対象 gateway を停止または再起動し、その後 Chrome DevTools または Speedscope で開きます:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

プロファイルを別の場所に置きたい場合は `--benchmark-dir <path>` を使用します。
ベンチマーク対象の子プロセスでデフォルトの `--force` ポートクリーンアップをスキップし、Gateway ポートがすでに使用中の場合に即座に失敗させたい場合は、`--benchmark-no-force` を使用します。
ベンチマークモードでは、同期 I/O トレースの大量出力はデフォルトで抑制されます。CPU プロファイルと Node 同期 I/O スタックトレースの両方を明示的に必要とする場合は、`--benchmark` とともに `OPENCLAW_TRACE_SYNC_IO=1` を設定します。ベンチマークモードでは、それらのトレースブロックはベンチマークディレクトリ配下の `gateway-watch-output.log` に書き込まれ、ターミナルペインからはフィルタリングされます。通常の Gateway ログは引き続き表示されます。

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` など、一般的な非秘密のランタイムセレクターをペインに引き継ぎます。
プロバイダー認証情報は通常のプロファイル/設定に入れるか、単発の一時的な秘密には生のフォアグラウンドモードを使用します。
監視対象 Gateway が起動中に終了した場合、ウォッチャーは `openclaw doctor --fix --non-interactive` を1回実行し、Gateway 子プロセスを再起動します。
開発専用の修復パスなしで元の起動失敗を確認したい場合は、`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` を使用します。
管理対象の tmux ペインでは、読みやすさのために Gateway ログに色を付けることもデフォルトです。ANSI 出力を無効にするには、`pnpm gateway:watch` の開始時に `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 配下のビルド関連ファイル、拡張機能のソースファイル、拡張機能の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、`package.json`、`tsdown.config.ts` の変更で再起動します。拡張機能メタデータの変更では、`tsdown` の再ビルドを強制せずに gateway を再起動します。ソースと設定の変更では、引き続き先に `dist` を再ビルドします。

Gateway CLI フラグは `gateway:watch` の後に追加すると、各再起動時にそのまま渡されます。同じ watch コマンドを再実行すると、名前付き tmux ペインが再生成されます。また、生のウォッチャーは引き続き単一ウォッチャーロックを保持するため、重複するウォッチャー親プロセスは積み重ならずに置き換えられます。

## dev プロファイル + dev gateway（--dev）

デバッグ用に状態を分離し、安全で使い捨てのセットアップを起動するには dev プロファイルを使用します。`--dev` フラグは**2つ**あります:

- **グローバル `--dev`（プロファイル）:** 状態を `~/.openclaw-dev` 配下に分離し、gateway ポートのデフォルトを `19001` にします（派生ポートもそれに合わせてずれます）。
- **`gateway --dev`: 欠落している場合にデフォルト設定 + ワークスペースを自動作成するよう Gateway に指示します**（そして BOOTSTRAP.md をスキップします）。

推奨フロー（dev プロファイル + dev ブートストラップ）:

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

2. **dev ブートストラップ**（`gateway --dev`）
   - 欠落している場合は最小設定を書き込みます（`gateway.mode=local`、loopback に bind）。
   - `agent.workspace` を dev ワークスペースに設定します。
   - `agent.skipBootstrap=true` を設定します（BOOTSTRAP.md なし）。
   - 欠落している場合はワークスペースファイルをシードします:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - デフォルトの identity: **C3-PO**（protocol droid）。
   - dev モードではチャネルプロバイダーをスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（新規開始）:

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は**グローバル**なプロファイルフラグであり、一部のランナーに消費されます。明示的に指定する必要がある場合は、環境変数形式を使用します:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、認証情報、セッション、dev ワークスペースを（`rm` ではなく `trash` を使って）消去し、その後デフォルトの dev セットアップを再作成します。

<Tip>
非 dev gateway がすでに実行中（launchd または systemd）の場合は、先に停止します:

```bash
openclaw gateway stop
```

</Tip>

## 生ストリームロギング（OpenClaw）

OpenClaw は、フィルタリング/整形の前に**生のアシスタントストリーム**をログ出力できます。
これは、推論がプレーンテキスト delta として届いているのか（または別個の thinking ブロックとして届いているのか）を確認する最適な方法です。

CLI 経由で有効にします:

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

## 生の OpenAI 互換チャンクロギング

**生の OpenAI 互換チャンク**を、ブロックへ解析される前に取得するには、transport logger を有効にします:

```bash
OPENCLAW_RAW_STREAM=1
```

任意のパス:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

デフォルトファイル:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる場合があります。
- ログはローカルに保持し、デバッグ後に削除してください。
- ログを共有する場合は、先に秘密情報と PII を除去してください。

## VSCode でのデバッグ

VSCode ベースの IDE でデバッグを有効にするには、ソースマップが必要です。ビルドプロセスの一部として、生成されるファイルの多くがハッシュ化された名前になるためです。含まれている `launch.json` 設定は Gateway サービスを対象にしていますが、他の目的にもすばやく適用できます:

1. **Gateway を再ビルドしてデバッグ** - 新しいビルドを作成した後に Gateway サービスをデバッグします
2. **Gateway をデバッグ** - 既存ビルドの Gateway サービスをデバッグします

### セットアップ

デフォルトの **Gateway を再ビルドしてデバッグ** 設定には必要なものが揃っており、`/dist` フォルダーを自動的に削除し、デバッグを有効にしてプロジェクトを再ビルドします:

1. Activity Bar から **Run and Debug** パネルを開くか、`Ctrl`+`Shift`+`D` を押します
2. IDE で、設定ドロップダウンに **Gateway を再ビルドしてデバッグ** が選択されていることを確認し、その後 **Start Debugging** ボタンを押します

または、ビルドとデバッグのプロセスを手動で管理したい場合:

1. ターミナルを開き、ソースマップを有効にします:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. 同じターミナルでプロジェクトを再ビルドします: `pnpm clean:dist && pnpm build`
3. IDE で、**Run and Debug** 設定ドロップダウンから **Gateway をデバッグ** オプションを選択し、その後 **Start Debugging** ボタンを押します

これで TypeScript ソースファイル（`src/` ディレクトリ）にブレークポイントを設定でき、デバッガーはソースマップ経由でブレークポイントをコンパイル済み JavaScript に正しく対応付けます。期待どおりに、変数の検査、コードのステップ実行、コールスタックの確認ができます。

### 注記

- **"Rebuild and Debug Gateway"** オプションを使用する場合、デバッガーを起動するたびに `/dist` フォルダーが完全に削除され、Gateway の起動前にソースマップを有効にした完全な `pnpm build` が実行されます
- **"Debug Gateway"** オプションを使用する場合、デバッグセッションは `/dist` フォルダーに影響を与えずにいつでも開始および停止できますが、デバッグの有効化とビルドサイクルの管理の両方に別のターミナルプロセスを使用する必要があります
- プロジェクトの他のセクションをデバッグするには、`args` の `launch.json` 設定を変更します
- 他のタスクでビルド済み OpenClaw CLI を使用する必要がある場合（たとえば、デバッグセッションが新しい認証トークンを生成するなら `dashboard --no-open`）、別のターミナルで `node ./openclaw.mjs` として実行するか、`alias openclaw-build="node $(pwd)/openclaw.mjs"` のようなシェルエイリアスを作成できます

## 関連

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
