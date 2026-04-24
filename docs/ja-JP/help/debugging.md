---
read_when:
    - 推論リークを調べるために生のモデル出力を確認する必要がある場合
    - 反復しながら watch モードで Gateway を実行したい場合
    - 再現可能なデバッグワークフローが必要な場合
summary: 'ツールのデバッグ: watch モード、生のモデルストリーム、推論リークのトレース'
title: デバッグ
x-i18n:
    generated_at: "2026-04-24T05:00:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d52070204e21cd7e5bff565fadab96fdeee0ad906c4c8601572761a096d9025
    source_path: help/debugging.md
    workflow: 15
---

このページでは、特に
プロバイダーが推論を通常テキストに混ぜる場合の、ストリーミング出力用デバッグヘルパーを扱います。

## ランタイムデバッグ上書き

チャット内で `/debug` を使うと、**ランタイム専用** の config 上書き（ディスクではなくメモリ）を設定できます。
`/debug` はデフォルトで無効です。有効にするには `commands.debug: true` を設定してください。
これは、`openclaw.json` を編集せずに分かりにくい設定を切り替えたいときに便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべての上書きをクリアし、ディスク上の config に戻します。

## セッショントレース出力

1 つのセッションで Plugin 所有の trace/debug 行を見たいが、
完全な verbose モードは有効にしたくない場合は `/trace` を使います。

例:

```text
/trace
/trace on
/trace off
```

Active Memory のデバッグサマリーなど、Plugin の診断には `/trace` を使ってください。
通常の verbose ステータス/ツール出力には引き続き `/verbose` を使い、
ランタイム専用 config 上書きには引き続き `/debug` を使ってください。

## 一時的な CLI デバッグタイミング

OpenClaw は `src/cli/debug-timing.ts` をローカル調査用の小さな
ヘルパーとして維持しています。これは意図的に CLI 起動、
コマンドルーティング、どのコマンドにもデフォルトでは接続されていません。遅いコマンドをデバッグするときだけ使い、
挙動変更をマージする前に import と spans を削除してください。

これは、コマンドが遅く、CPU profiler を使うべきか
特定サブシステムを修正すべきか判断する前に、すばやくフェーズ分解が必要なときに使います。

### 一時的な spans を追加する

調査中のコードの近くにヘルパーを追加します。たとえば
`openclaw models list` のデバッグ中であれば、
`src/commands/models/list.list-command.ts` への一時パッチは次のようになります。

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

- 一時フェーズ名には `debug:` プレフィックスを付けてください。
- 疑わしい遅い箇所の周囲に少数の spans だけを追加してください。
- ヘルパー名ではなく、`registry`、`auth_store`、`rows` のような広いフェーズを優先してください。
- 同期処理には `time()`、Promise には `timeAsync()` を使います。
- stdout はきれいに保ってください。このヘルパーは stderr に書き出すため、コマンドの JSON 出力は引き続き parse 可能です。
- 最終修正 PR を開く前に、一時 import と spans を削除してください。
- 最適化を説明する issue や PR には、タイミング出力または短いサマリーを含めてください。

### 読みやすい出力で実行する

可読モードはライブデバッグに最適です。

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

| Phase                                    |       Time | 意味                                                                                           |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | auth-profile ストアの読み込みが最大コストであり、最初に調査すべきです。                       |
| `debug:models:list:ensure_models_json`   |       5.0s | `models.json` の同期は、キャッシュやスキップ条件を調べる価値があるほど高コストです。                    |
| `debug:models:list:load_model_registry`  |       5.9s | レジストリ構築とプロバイダー利用可否の処理も無視できないコストです。                         |
| `debug:models:list:read_registry_models` |       2.4s | すべてのレジストリモデルを読むのは無料ではなく、`--all` では重要かもしれません。                                     |
| row append phases                        | 3.2s total | 表示される 5 行を構築するだけでも数秒かかるため、フィルタリング経路を詳しく見る価値があります。 |
| `debug:models:list:print_model_table`    |        0ms | レンダリングはボトルネックではありません。                                                                        |

これらの所見だけで、
本番経路にタイミングコードを残さずに次のパッチを導くには十分です。

### JSON 出力で実行する

タイミングデータを保存または比較したい場合は JSON モードを使います。

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

stderr の各行は 1 つの JSON オブジェクトです。

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

### マージ前にクリーンアップする

最終 PR を開く前に:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

PR が
永続的な診断サーフェスを明示的に追加するものでない限り、このコマンドは一時的な計測呼び出し箇所を返さないはずです。通常の性能修正では、
挙動変更、テスト、そしてタイミング根拠の短い注記だけを残してください。

より深い CPU ホットスポットには、タイミングラッパーをさらに追加する代わりに、Node profiling（`--cpu-prof`）または外部
profiler を使ってください。

## Gateway watch モード

高速な反復のために、ファイル watcher の下で gateway を実行します。

```bash
pnpm gateway:watch
```

これは次に対応します。

```bash
node scripts/watch-node.mjs gateway --force
```

watcher は `src/` 配下のビルド関連ファイル、extension のソースファイル、
extension の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、
`package.json`、`tsdown.config.ts` で再起動します。Extension メタデータ変更では
`tsdown` の再ビルドを強制せずに gateway を再起動します。ソースと config の変更では引き続き
最初に `dist` を再ビルドします。

`gateway:watch` の後に任意の gateway CLI フラグを追加すると、
各再起動時にそれらが引き継がれます。同じ repo/フラグセットに対して同じ watch コマンドを再実行すると、
重複する watcher 親プロセスを残すのではなく、古い watcher が置き換えられます。

## dev profile + dev gateway（`--dev`）

状態を分離し、
デバッグ用の安全で使い捨て可能なセットアップを立ち上げるには dev profile を使います。`--dev` フラグは **2 種類** あります。

- **グローバル `--dev`（profile）:** 状態を `~/.openclaw-dev` 配下に分離し、
  gateway ポートをデフォルトで `19001` にします（派生ポートもそれに応じて変わります）。
- **`gateway --dev`: Gateway に、存在しない場合はデフォルト config +
  workspace を自動作成するよう指示します**（そして `BOOTSTRAP.md` はスキップ）。

推奨フロー（dev profile + dev bootstrap）:

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

まだグローバルインストールがない場合は、CLI を `pnpm openclaw ...` 経由で実行してください。

これが行うこと:

1. **profile の分離**（グローバル `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas もそれに応じて変化）

2. **dev bootstrap**（`gateway --dev`）
   - 存在しない場合は最小 config を書き込みます（`gateway.mode=local`、bind loopback）。
   - `agent.workspace` を dev workspace に設定します。
   - `agent.skipBootstrap=true` を設定します（`BOOTSTRAP.md` なし）。
   - ワークスペースファイルが存在しなければシードします:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`。
   - デフォルト identity: **C3‑PO**（プロトコルドロイド）。
   - dev モードではチャンネルプロバイダーをスキップします（`OPENCLAW_SKIP_CHANNELS=1`）。

リセットフロー（まっさらな状態から開始）:

```bash
pnpm gateway:dev:reset
```

注: `--dev` は **グローバル** profile フラグであり、一部の runner では食われます。
明示したい場合は env var 形式を使ってください。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` は config、credentials、sessions、dev workspace を（`rm` ではなく
`trash` を使って）消去し、その後デフォルトの dev セットアップを再作成します。

ヒント: non-dev gateway がすでに実行中（launchd/systemd）なら、先に停止してください。

```bash
openclaw gateway stop
```

## 生ストリームロギング（OpenClaw）

OpenClaw は、フィルタ/整形前の **生の assistant stream** を記録できます。
これは、推論がプレーンテキスト delta として届いているのか
（または別個の thinking block として届いているのか）を確認する最良の方法です。

CLI で有効にするには:

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

解析されて block に変換される前の **生の OpenAI 互換チャンク** を取得するには、
pi-mono が別の logger を公開しています。

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
> `openai-completions` プロバイダーを使用するプロセスでのみ出力されます。

## 安全に関する注記

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる場合があります。
- ログはローカルに保持し、デバッグ後は削除してください。
- ログを共有する場合は、先にシークレットと PII をスクラブしてください。

## 関連

- [Troubleshooting](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
