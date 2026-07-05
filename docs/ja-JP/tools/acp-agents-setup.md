---
read_when:
    - Claude Code / Codex / Gemini CLI 用の acpx ハーネスのインストールまたは設定
    - Plugin-tools または OpenClaw-tools MCP ブリッジの有効化
    - ACP 権限モードの設定
summary: 'OpenClaw の ACP エージェントのセットアップ: acpx ハーネス設定、Plugin セットアップ、権限'
title: ACP エージェント — セットアップ
x-i18n:
    generated_at: "2026-07-05T11:48:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

概要、運用者向け Runbook、概念については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

このページでは、acpx ハーネス設定、MCP ブリッジ用の Plugin セットアップ、権限設定について説明します。

このページは、ACP/acpx ルートをセットアップする場合にのみ使用してください。ネイティブ Codex
app-server ランタイム設定には、[Codex ハーネス](/ja-JP/plugins/codex-harness)を使用してください。
OpenAI API キーまたは Codex OAuth モデルプロバイダー設定には、
[OpenAI](/ja-JP/providers/openai)を使用してください。

Codex には OpenClaw ルートが 2 つあります。

| ルート                     | 設定/コマンド                                         | セットアップページ                    |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| ネイティブ Codex app-server | `/codex ...`, `openai/gpt-*` agent refs                | [Codex ハーネス](/ja-JP/plugins/codex-harness) |
| 明示的な Codex ACP アダプター | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | このページ                              |

ACP/acpx の動作が明示的に必要でない限り、ネイティブルートを推奨します。

## acpx ハーネスサポート（現在）

組み込み acpx ハーネスエイリアス（固定された `acpx` 依存関係から）:

| エイリアス   | ラップ対象                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP ブリッジ（ネイティブ `openclaw acp`）                                                              |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` と `factorydroid` も、組み込みの `droid` アダプターに解決されます。

OpenClaw が acpx バックエンドを使用する場合、acpx 設定でカスタムエージェントエイリアスを定義していない限り、`agentId` にはこれらの値を推奨します。
ローカルの Cursor インストールがまだ ACP を `agent acp` として公開している場合は、組み込みのデフォルトを変更するのではなく、acpx 設定で `cursor` エージェントコマンドを上書きしてください。

acpx CLI の直接利用では、`--agent <command>` によって任意のアダプターも対象にできますが、この未加工のエスケープハッチは acpx CLI の機能です（通常の OpenClaw `agentId` パスではありません）。

モデル制御は、アダプターのケイパビリティに依存します。Codex ACP モデル参照は、
起動前に OpenClaw によって正規化されます。他のハーネスでは ACP `models` と
`session/set_model` サポートが必要です。ハーネスがその ACP ケイパビリティも
独自の起動時モデルフラグも公開していない場合、OpenClaw/acpx はモデル選択を強制できません。

## 必須設定

コア ACP ベースライン:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Defaults are coalesceIdleMs: 350, maxChunkChars: 1800; shown explicitly here.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

スレッドバインディング設定は、チャネルアダプター固有です。Discord の例:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        // Default is already true; shown explicitly here.
        spawnSessions: true,
      },
    },
  },
}
```

スレッドにバインドされた ACP spawn が動作しない場合は、まずアダプター機能フラグを確認してください。

- Discord: `channels.discord.threadBindings.spawnSessions=true`

現在の会話へのバインドでは、子スレッドの作成は不要です。必要なのは、アクティブな会話コンテキストと、ACP 会話バインディングを公開するチャネルアダプターです。

[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## acpx バックエンド用の Plugin セットアップ

パッケージ版インストールでは、ACP に公式の `@openclaw/acpx` ランタイム Plugin を使用します。
ACP ハーネスセッションを使用する前に、インストールして有効化してください。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` 後にローカルワークスペース Plugin も使用できます。

次から始めます。

```text
/acp doctor
```

`acpx` を無効化した、`plugins.allow` / `plugins.deny` で拒否した、または
パッケージ版 Plugin に戻したい場合は、明示的なパッケージパスを使用してください。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカルワークスペースインストール:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

次にバックエンドの正常性を確認します。

```text
/acp doctor
```

### acpx ランタイム起動プローブ

`acpx` Plugin は ACP ランタイムを直接埋め込みます（個別の `acpx` バイナリや
設定するバージョンはありません）。デフォルトでは、Gateway 起動中に埋め込みバックエンドを登録し、
Gateway の `ready` シグナル前に起動プローブを待ちます。
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` または
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` は、起動プローブを意図的に無効化したままにする
スクリプトまたは環境でのみ設定してください。明示的なオンデマンドプローブには `/acp doctor` を実行してください。

パスまたはフラグ値を 1 つの argv トークンのままにする必要がある場合は、構造化引数で個別の ACP エージェントコマンドを上書きします。

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` は、その ACP エージェントの実行ファイルまたは既存のコマンド文字列です。
- `agents.<id>.args` は任意です。OpenClaw が現在の acpx コマンド文字列レジストリに渡す前に、各配列項目はシェルクォートされます。

[Plugin](/ja-JP/tools/plugin)を参照してください。

### アダプターの自動ダウンロード

`acpx` は、初回使用時に `npx` 経由で ACP アダプター（たとえば Claude と Codex の ACP
ブリッジ）を自動ダウンロードします。アダプターパッケージを手動でインストールする必要はなく、
OpenClaw 自体に個別の postinstall ステップもありません。アダプターのダウンロードまたは spawn が失敗した場合、
`/acp doctor` が失敗を報告します。

### Plugin ツール MCP ブリッジ

デフォルトでは、ACPX セッションは OpenClaw Plugin 登録済みツールを
ACP ハーネスに公開しません。

Codex や Claude Code などの ACP エージェントから、memory recall/store などのインストール済み
OpenClaw Plugin ツールを呼び出したい場合は、専用ブリッジを有効化してください。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

この設定の動作:

- `openclaw-plugin-tools` という名前の組み込み MCP サーバーを ACPX セッションの
  bootstrap に注入します。
- インストール済みかつ有効化済みの OpenClaw
  Plugin によってすでに登録されている Plugin ツールを公開します。
- この機能を明示的かつデフォルトオフのままにします。

セキュリティと信頼に関する注意:

- これは ACP ハーネスのツールサーフェスを拡張します。
- ACP エージェントがアクセスできるのは、Gateway で既にアクティブな Plugin ツールのみです。
- これは、それらの Plugin を OpenClaw 自体で実行させる場合と同じ信頼境界として扱ってください。
- 有効化する前に、インストール済み Plugin を確認してください。

カスタム `mcpServers` はこれまでどおり動作します。組み込みの Plugin ツールブリッジは、
汎用 MCP サーバー設定の置き換えではなく、追加のオプトイン利便機能です。

### OpenClaw ツール MCP ブリッジ

デフォルトでは、ACPX セッションは組み込み OpenClaw ツールも MCP 経由で公開しません。
ACP エージェントが `cron` などの選択された組み込みツールを必要とする場合は、
個別のコアツールブリッジを有効化してください。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

この設定の動作:

- `openclaw-tools` という名前の組み込み MCP サーバーを ACPX セッションの
  bootstrap に注入します。
- 選択された組み込み OpenClaw ツールを公開します。初期サーバーは `cron` を公開します。
- コアツールの公開を明示的かつデフォルトオフのままにします。

### ランタイム操作タイムアウト設定

`acpx` Plugin は、埋め込みランタイムの起動と制御操作にデフォルトで 120
秒を与えます。これにより、Gemini CLI などの低速なハーネスでも ACP の起動と初期化を完了するのに十分な時間が確保されます。
ホストに別の操作制限が必要な場合は上書きしてください。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

ランタイムターンは、`/acp timeout` を含む OpenClaw エージェント/実行タイムアウトを使用します。
`sessions_spawn` は呼び出しごとのタイムアウト上書きを受け付けません。運用者パスは
`agents.defaults.subagents.runTimeoutSeconds` です。`timeoutSeconds` を変更した後は
Gateway を再起動してください。

### ヘルスプローブエージェント設定

`/acp doctor` または起動プローブがバックエンドをチェックするとき、バンドルされた `acpx`
Plugin は 1 つのハーネスエージェントをプローブします。`acp.allowedAgents` が設定されている場合は、
最初に許可されたエージェントがデフォルトになります。それ以外の場合は `codex` がデフォルトです。デプロイで
ヘルスチェック用に別の ACP エージェントが必要な場合は、プローブエージェントを明示的に設定してください。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は、Gateway を再起動してください。

## 権限設定

ACP セッションは非対話的に実行されます。ファイル書き込みとシェル実行の権限プロンプトを承認または拒否する TTY はありません。acpx Plugin は、権限の処理方法を制御する 2 つの設定キーを提供します。

これらの ACPX ハーネス権限は、OpenClaw exec 承認とは別であり、Claude CLI `--permission-mode bypassPermissions` などの CLI バックエンドベンダーのバイパスフラグとも別です。ACPX `approve-all` は、ACP セッション向けのハーネスレベルの緊急用スイッチです。

OpenClaw `tools.exec.mode`、Codex Guardian
承認、ACPX ハーネス権限のより広い比較については、
[権限モード](/ja-JP/tools/permission-modes)を参照してください。

### `permissionMode`

ハーネスエージェントがプロンプトなしで実行できる操作を制御します。

| 値              | 動作                                                       |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | すべてのファイル書き込みとシェルコマンドを自動承認します。 |
| `approve-reads` | 読み取りのみを自動承認します。書き込みと実行にはプロンプトが必要です。 |
| `deny-all`      | すべての権限プロンプトを拒否します。                      |

### `nonInteractivePermissions`

権限プロンプトが表示されるはずだが、対話型 TTY が利用できない場合（ACP セッションでは常にこの状態）に何が起きるかを制御します。

| 値     | 動作                                                                     |
| ------ | ------------------------------------------------------------------------ |
| `fail` | `PermissionPromptUnavailableError` でセッションを中止します。**（デフォルト）** |
| `deny` | 権限を静かに拒否し、処理を続行します（グレースフルデグラデーション）。   |

### 設定

Plugin 設定で指定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後は、Gateway を再起動してください。

<Warning>
OpenClaw のデフォルトは `permissionMode=approve-reads` と `nonInteractivePermissions=fail` です。非対話型 ACP セッションでは、権限プロンプトを引き起こす書き込みまたは実行は `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` で失敗する可能性があります。

権限を制限する必要がある場合は、`nonInteractivePermissions` を `deny` に設定して、セッションがクラッシュする代わりにグレースフルに機能低下するようにしてください。
</Warning>

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents) — 概要、オペレーターランブック、概念
- [サブエージェント](/ja-JP/tools/subagents)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
