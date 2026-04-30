---
read_when:
    - 推論漏洩がないか、生のモデル出力を確認する必要があります
    - 反復作業中に Gateway を watch モードで実行したい場合
    - 再現性のあるデバッグワークフローが必要です
summary: 'デバッグツール: ウォッチモード、生のモデルストリーム、推論漏えいのトレース'
title: デバッグ
x-i18n:
    generated_at: "2026-04-30T05:17:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

ストリーミング出力用のデバッグヘルパー。特にプロバイダーが通常テキストに推論を混ぜる場合に役立ちます。

## ランタイムデバッグオーバーライド

チャットで `/debug` を使うと、**ランタイムのみ**の設定オーバーライドを設定できます (メモリ上のみで、ディスクには書き込みません)。
`/debug` はデフォルトで無効です。`commands.debug: true` で有効にします。
`openclaw.json` を編集せずに分かりにくい設定を切り替える必要がある場合に便利です。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` はすべてのオーバーライドをクリアし、ディスク上の設定に戻します。

## セッショントレース出力

完全な詳細モードを有効にせずに、1つのセッションで Plugin 所有のトレース/デバッグ行を確認したい場合は `/trace` を使います。

例:

```text
/trace
/trace on
/trace off
```

Active Memory のデバッグ要約などの Plugin 診断には `/trace` を使います。
通常の詳細なステータス/ツール出力には引き続き `/verbose` を使い、ランタイムのみの設定オーバーライドには引き続き `/debug` を使います。

## Plugin ライフサイクルトレース

Plugin ライフサイクルコマンドが遅く感じられ、Plugin メタデータ、検出、レジストリ、ランタイムミラー、設定変更、更新作業について組み込みのフェーズ内訳が必要な場合は、`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` を使います。このトレースはオプトインで stderr に書き込むため、JSON コマンド出力は解析可能なままです。

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

CPU プロファイラーに手を伸ばす前に、Plugin ライフサイクル調査にはこれを使います。
コマンドをソースチェックアウトから実行している場合は、`pnpm build` の後に `node dist/entry.js ...` でビルド済みランタイムを測定することを推奨します。`pnpm openclaw ...` ではソースランナーのオーバーヘッドも測定されます。

## 一時的な CLI デバッグタイミング

OpenClaw は、ローカル調査用の小さなヘルパーとして `src/cli/debug-timing.ts` を保持しています。これは意図的に CLI 起動、コマンドルーティング、または任意のコマンドにデフォルトで組み込まれていません。遅いコマンドをデバッグしている間だけ使い、挙動変更を取り込む前に import と span を削除してください。

コマンドが遅く、CPU プロファイラーを使うか特定のサブシステムを修正するかを決める前に、素早いフェーズ内訳が必要な場合に使います。

### 一時的な span を追加する

調査しているコードの近くにヘルパーを追加します。たとえば、`openclaw models list` をデバッグしている間、`src/commands/models/list.list-command.ts` の一時パッチは次のようになります。

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

- 一時的なフェーズ名には `debug:` のプレフィックスを付けます。
- 遅いと疑われる箇所の周辺に、少数の span だけを追加します。
- ヘルパー名よりも、`registry`、`auth_store`、`rows` のような広めのフェーズを推奨します。
- 同期処理には `time()` を、promise には `timeAsync()` を使います。
- stdout はクリーンに保ちます。ヘルパーは stderr に書き込むため、コマンドの JSON 出力は解析可能なままです。
- 最終修正 PR を開く前に、一時的な import と span を削除します。
- 最適化を説明する issue または PR に、タイミング出力または短い要約を含めます。

### 読みやすい出力で実行する

ライブデバッグには読みやすいモードが最適です。

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

一時的な `models list` 調査の出力例:

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

この出力から分かること:

| フェーズ                                 |       時間 | 意味                                                                                                    |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | auth-profile ストアの読み込みが最大のコストであり、最初に調査すべきです。                              |
| `debug:models:list:ensure_models_json`   |       5.0s | `models.json` の同期は、キャッシュまたはスキップ条件を調べる価値があるほど高コストです。               |
| `debug:models:list:load_model_registry`  |       5.9s | レジストリ構築とプロバイダー可用性の処理も、重要なコストです。                                        |
| `debug:models:list:read_registry_models` |       2.4s | すべてのレジストリモデルの読み取りは無料ではなく、`--all` では重要になる可能性があります。             |
| 行追加フェーズ                           | 合計 3.2s | 表示される5行を構築するだけでも数秒かかっているため、フィルタリング経路をさらに確認する価値があります。 |
| `debug:models:list:print_model_table`    |        0ms | レンダリングはボトルネックではありません。                                                            |

これらの所見は、本番経路にタイミングコードを残さずに次のパッチを導くには十分です。

### JSON 出力で実行する

タイミングデータを保存または比較したい場合は JSON モードを使います。

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

stderr の各行は1つの JSON オブジェクトです。

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

PR が永続的な診断サーフェスを明示的に追加している場合を除き、このコマンドは一時的な計測呼び出し箇所を返さないはずです。通常のパフォーマンス修正では、挙動変更、テスト、タイミング証拠を含む短いメモだけを残します。

さらに深い CPU ホットスポットには、タイミングラッパーを追加するのではなく、Node プロファイリング (`--cpu-prof`) または外部プロファイラーを使います。

## Gateway ウォッチモード

高速な反復には、ファイルウォッチャー配下で Gateway を実行します。

```bash
pnpm gateway:watch
```

デフォルトでは、これは `openclaw-gateway-watch-main` という名前の tmux セッション (または `openclaw-gateway-watch-dev-19001` のようなプロファイル/ポート固有のバリアント) を開始または再起動し、対話型ターミナルから自動アタッチします。非対話シェル、CI、エージェント exec 呼び出しではデタッチされたままになり、代わりにアタッチ手順を表示します。必要に応じて手動でアタッチします。

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

tmux 管理を維持したまま自動アタッチを無効にします。

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

tmux ラッパーは、`OPENCLAW_PROFILE`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT`、`OPENCLAW_SKIP_CHANNELS` などの一般的な非シークレットのランタイムセレクターをペインへ引き継ぎます。プロバイダー認証情報は通常のプロファイル/設定に置くか、一回限りの一時シークレットには生のフォアグラウンドモードを使います。

ウォッチャーは、`src/` 配下のビルド関連ファイル、Plugin ソースファイル、Plugin の `package.json` と `openclaw.plugin.json` メタデータ、`tsconfig.json`、`package.json`、`tsdown.config.ts` の変更で再起動します。Plugin メタデータの変更では `tsdown` の再ビルドを強制せずに Gateway を再起動します。ソースと設定の変更では引き続き先に `dist` を再ビルドします。

任意の Gateway CLI フラグを `gateway:watch` の後に追加すると、各再起動時にそのまま渡されます。同じウォッチコマンドを再実行すると、名前付きの tmux ペインが再生成されます。また、生のウォッチャーは単一ウォッチャーロックを維持するため、重複したウォッチャー親プロセスは積み重ならずに置き換えられます。

## 開発プロファイル + 開発 Gateway (--dev)

デバッグ用に状態を分離し、安全で使い捨てのセットアップを立ち上げるには開発プロファイルを使います。`--dev` フラグは**2つ**あります。

- **グローバル `--dev` (プロファイル):** 状態を `~/.openclaw-dev` 配下に分離し、Gateway ポートをデフォルトで `19001` にします (派生ポートもそれに合わせてずれます)。
- **`gateway --dev`: 不足している場合に、デフォルト設定 + ワークスペースを自動作成するよう Gateway に指示します** (また、BOOTSTRAP.md をスキップします)。

推奨フロー (開発プロファイル + 開発ブートストラップ):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

まだグローバルインストールがない場合は、`pnpm openclaw ...` 経由で CLI を実行します。

これが行うこと:

1. **プロファイル分離** (グローバル `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (ブラウザー/キャンバスもそれに合わせてずれます)

2. **開発ブートストラップ** (`gateway --dev`)
   - 不足している場合は最小設定を書き込みます (`gateway.mode=local`、bind loopback)。
   - `agent.workspace` を開発ワークスペースに設定します。
   - `agent.skipBootstrap=true` を設定します (BOOTSTRAP.md なし)。
   - 不足している場合はワークスペースファイルをシードします:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`。
   - デフォルト ID: **C3‑PO** (プロトコル・ドロイド)。
   - 開発モードではチャンネルプロバイダーをスキップします (`OPENCLAW_SKIP_CHANNELS=1`)。

リセットフロー (新規開始):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` は**グローバル**プロファイルフラグであり、一部のランナーに吸収されます。明示する必要がある場合は、環境変数形式を使います。

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` は設定、認証情報、セッション、開発ワークスペースを (`rm` ではなく `trash` を使って) 消去し、その後デフォルトの開発セットアップを再作成します。

<Tip>
開発用ではない Gateway がすでに実行中の場合 (launchd または systemd)、先に停止します。

```bash
openclaw gateway stop
```

</Tip>

## 生ストリームログ (OpenClaw)

OpenClaw は、フィルタリング/整形の前に**生のアシスタントストリーム**をログに記録できます。
これは、推論がプレーンテキストのデルタとして届いているのか (または別個の thinking ブロックとして届いているのか) を確認する最善の方法です。

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

## 生チャンクログ記録 (pi-mono)

ブロックへ解析される前の **生の OpenAI 互換チャンク** をキャプチャするため、
pi-mono は別のロガーを公開しています:

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
> `openai-completions` プロバイダーを使用するプロセスでのみ出力されます。

## 安全上の注意

- 生ストリームログには、完全なプロンプト、ツール出力、ユーザーデータが含まれる場合があります。
- ログはローカルに保持し、デバッグ後に削除してください。
- ログを共有する場合は、先にシークレットと PII を削除してください。

## 関連

- [トラブルシューティング](/ja-JP/help/troubleshooting)
- [FAQ](/ja-JP/help/faq)
