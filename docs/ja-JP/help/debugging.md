---
read_when:
    - 推論の漏えいがないか、生のモデル出力を検査する必要があります
    - 反復作業中に Gateway を watch モードで実行したい
    - 再現性のあるデバッグワークフローが必要です
summary: 'デバッグツール: ウォッチモード、生のモデルストリーム、推論漏えいの追跡'
title: デバッグ
x-i18n:
    generated_at: "2026-05-02T20:49:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力のデバッグ補助。特に、プロバイダーが通常のテキストに推論内容を混ぜる場合に役立ちます。

## ランタイムデバッグ上書き

チャットで `/debug` を使うと、**ランタイム専用**の設定上書き（メモリ上のみ、ディスクには保存しない）を設定できます。
`/debug` はデフォルトで無効です。有効にするには `commands.debug: true` を使います。
これは、`openclaw.json` を編集せずに見つけにくい設定を切り替える必要がある場合に便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべての上書きをクリアし、ディスク上の設定に戻します。

## セッショントレース出力

完全な詳細モードを有効にせず、1つのセッションでPluginが所有するトレース/デバッグ行を確認したい場合は、`/trace` を使います。

例:

```text
/trace
/trace on
/trace off
```

Active Memory のデバッグ要約など、Plugin診断には `/trace` を使います。
通常の詳細ステータス/ツール出力には `/verbose` を使い続け、ランタイム専用の設定上書きには
`/debug` を使い続けます。

## Pluginライフサイクルトレース

Pluginライフサイクルコマンドが遅く感じられ、Pluginメタデータ、検出、レジストリ、
ランタイムミラー、設定変更、更新処理について組み込みのフェーズ内訳が必要な場合は、
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を使います。トレースはオプトインで stderr に書き込まれるため、
JSON コマンド出力は解析可能なままです。

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

CPU プロファイラーに進む前に、Pluginライフサイクル調査でこれを使います。
コマンドがソースチェックアウトから実行されている場合は、`pnpm build` の後に
`node dist/entry.js ...` でビルド済みランタイムを測定することを推奨します。`pnpm openclaw ...`
ではソースランナーのオーバーヘッドも測定されます。

## 一時的な CLI デバッグタイミング

OpenClaw は、ローカル調査用の小さなヘルパーとして `src/cli/debug-timing.ts` を保持しています。
これは意図的に、デフォルトでは CLI 起動、コマンドルーティング、どのコマンドにも接続されていません。
遅いコマンドをデバッグしている間だけ使用し、挙動変更を取り込む前に import と span を削除します。

コマンドが遅く、CPU プロファイラーを使うか特定のサブシステムを修正するかを判断する前に、
素早いフェーズ内訳が必要な場合に使います。

### 一時的な span を追加する

調査しているコードの近くにヘルパーを追加します。たとえば、
`openclaw models list` をデバッグしている間、
`src/commands/models/list.list-command.ts` の一時的なパッチは次のようになります。

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

ガイドライン:

- 一時的なフェーズ名には `debug:` を接頭辞として付けます。
- 遅いと疑われる区間の周囲に、少数の span だけを追加します。
- ヘルパー名ではなく、`registry`、`auth_store`、`rows` のような広いフェーズを優先します。
- 同期処理には `time()`、promise には `timeAsync()` を使います。
- stdout をクリーンに保ちます。ヘルパーは stderr に書き込むため、コマンドの JSON 出力は解析可能なままです。
- 最終修正 PR を開く前に、一時的な import と span を削除します。
- 最適化を説明する issue または PR に、タイミング出力または短い要約を含めます。

### 読みやすい出力で実行する

読みやすいモードはライブデバッグに最適です。

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

一時的な `models list` 調査からの出力例:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

この出力からの所見:

| フェーズ                                 |       時間 | 意味                                                                                                    |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | 認証プロファイルストアの読み込みが最大のコストであり、最初に調査すべきです。                            |
| `debug:models:list:ensure_models_json`   |       5.0s | `models.json` の同期は、キャッシュやスキップ条件を調べるのに十分なコストがあります。                    |
| `debug:models:list:load_model_registry`  |       5.9s | レジストリ構築とプロバイダー可用性処理も意味のあるコストです。                                          |
| `debug:models:list:read_registry_models` |       2.4s | すべてのレジストリモデルの読み取りは無料ではなく、`--all` では影響する可能性があります。                |
| 行追加フェーズ                           | 合計 3.2s | 表示される5行の構築にも数秒かかっているため、フィルタリングパスを詳しく見る価値があります。             |
| `debug:models:list:print_model_table`    |        0ms | レンダリングはボトルネックではありません。                                                              |

これらの所見は、本番パスにタイミングコードを残さずに次のパッチを導くのに十分です。

### JSON 出力で実行する

タイミングデータを保存または比較したい場合は JSON モードを使います。

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

各 stderr 行は1つの JSON オブジェクトです。

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### 取り込み前にクリーンアップする

最終 PR を開く前に:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

PR が永続的な診断サーフェスを明示的に追加している場合を除き、このコマンドは一時的な計測の呼び出し箇所を返さないはずです。
通常のパフォーマンス修正では、挙動変更、テスト、タイミング根拠を添えた短い注記だけを残します。

より深い CPU ホットスポットには、タイミングラッパーをさらに追加するのではなく、Node プロファイリング（`--cpu-prof`）または外部プロファイラーを使います。

## Gateway watch モード

高速な反復には、ファイルウォッチャーの下で Gateway を実行します。

```bash
pnpm gateway:watch
```

デフォルトでは、これは `openclaw-gateway-watch-main` という名前の tmux セッション
（または `openclaw-gateway-watch-dev-19001` のようなプロファイル/ポート固有のバリアント）を開始または再起動し、
対話型ターミナルから自動接続します。
非対話型シェル、CI、エージェントの exec 呼び出しはデタッチされたままで、代わりに接続手順を表示します。
必要な場合は手動で接続します。

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

tmux 管理を維持しつつ自動接続を無効にするには:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

起動時/ランタイムのホットスポットをデバッグする場合は、監視対象 Gateway の CPU 時間をプロファイルします。

```bash
pnpm gateway:watch --benchmark
```

ウォッチラッパーは Gateway を呼び出す前に `--benchmark` を消費し、
Gateway 子プロセスが終了するたびに1つの V8 `.cpuprofile` を
`.artifacts/gateway-watch-profiles/` の下に書き込みます。現在のプロファイルをフラッシュするには、
監視対象 Gateway を停止または再起動し、その後 Chrome DevTools または Speedscope で開きます。

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

プロファイルを別の場所に置きたい場合は `--benchmark-dir <path>` を使います。

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、
`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` など、一般的な非シークレットのランタイムセレクターをペインに引き継ぎます。
プロバイダー認証情報は通常のプロファイル/設定に置くか、一度限りの一時的なシークレットには生のフォアグラウンドモードを使います。
管理対象 tmux ペインは、読みやすさのためにデフォルトで色付きの Gateway ログも使います。
ANSI 出力を無効にするには、`pnpm gateway:watch` の開始時に `FORCE_COLOR=0` を設定します。

ウォッチャーは、`src/` 配下のビルド関連ファイル、Pluginソースファイル、
Plugin の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、
`package.json`、`tsdown.config.ts` で再起動します。Pluginメタデータの変更は、
`tsdown` の再ビルドを強制せずに Gateway を再起動します。ソースと設定の変更では、引き続き最初に `dist` を再ビルドします。

Gateway CLI フラグは `gateway:watch` の後に追加すると、各再起動時にそのまま渡されます。
同じ watch コマンドを再実行すると、名前付き tmux ペインが再生成されます。また、
生のウォッチャーは単一ウォッチャーロックを維持するため、重複するウォッチャー親プロセスは積み上がらず置き換えられます。

## dev プロファイル + dev Gateway（--dev）

状態を分離し、デバッグ用の安全で使い捨てのセットアップを立ち上げるには dev プロファイルを使います。
`--dev` フラグは**2つ**あります。

- **グローバル `--dev`（プロファイル）:** 状態を `~/.openclaw-dev` の下に分離し、
  Gateway ポートのデフォルトを `19001` にします（派生ポートもそれに合わせてずれます）。
- **`gateway --dev`: 欠落時にデフォルト設定 + ワークスペースを自動作成するよう Gateway に指示します**（さらに BOOTSTRAP.md をスキップします）。

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
   - 欠落している場合、最小設定を書き込みます（`gateway.mode=local`、bind loopback）。
   - `agent.workspace` を dev ワークスペースに設定します。
   - `agent.skipBootstrap=true` を設定します（BOOTSTRAP.md なし）。
   - 欠落している場合、ワークスペースファイルをシードします:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - デフォルト identity: **C3‑PO**（プロトコルドロイド）。
   - dev モードではチャンネルプロバイダーをスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（新規開始）:

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は **グローバル** なプロファイルフラグで、一部のランナーでは取り込まれてしまいます。明示的に指定する必要がある場合は、環境変数形式を使ってください:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、認証情報、セッション、dev ワークスペースを消去し（`rm` ではなく
`trash` を使用）、その後デフォルトの dev セットアップを再作成します。

<Tip>
dev 以外の Gateway がすでに実行中の場合（launchd または systemd）、先に停止してください:

```bash
openclaw gateway stop
```

</Tip>

## 生ストリームログ（OpenClaw）

OpenClaw は、フィルタリングや整形の前に **生のアシスタントストリーム** をログに記録できます。
これは、reasoning がプレーンテキストのデルタとして届いているか
（または別個の thinking ブロックとして届いているか）を確認する最適な方法です。

CLI で有効にします:

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

ブロックへ解析される前の **生の OpenAI 互換チャンク** をキャプチャするため、
pi-mono は別個のロガーを公開しています:

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
> `openai-completions` プロバイダーを使用するプロセスからのみ出力されます。

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる場合があります。
- ログはローカルに保持し、デバッグ後に削除してください。
- ログを共有する場合は、先にシークレットと PII を削除してください。

## 関連

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
