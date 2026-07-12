---
read_when:
    - Claude Code / Codex / Gemini CLI 用 acpx ハーネスのインストールまたは設定
    - plugin-tools または OpenClaw-tools MCP ブリッジの有効化
    - ACP権限モードの設定
summary: ACP エージェントのセットアップ：acpx ハーネス設定、Plugin のセットアップ、権限
title: ACP エージェント — セットアップ
x-i18n:
    generated_at: "2026-07-11T22:43:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

概要、運用ランブック、概念については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

このページでは、acpx ハーネス設定、MCP ブリッジ用の Plugin セットアップ、権限設定について説明します。

このページは、ACP/acpx ルートをセットアップする場合にのみ使用してください。ネイティブ Codex
app-server ランタイム設定については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を使用してください。
OpenAI API キーまたは Codex OAuth モデルプロバイダー設定については、
[OpenAI](/ja-JP/providers/openai)を使用してください。

Codex には、OpenClaw へのルートが 2 つあります。

| ルート                     | 設定/コマンド                                          | セットアップページ                      |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| ネイティブ Codex app-server | `/codex ...`、`openai/gpt-*` エージェント参照          | [Codex ハーネス](/ja-JP/plugins/codex-harness) |
| 明示的な Codex ACP アダプター | `/acp spawn codex`、`runtime: "acp", agentId: "codex"` | このページ                              |

ACP/acpx の動作が明示的に必要でない限り、ネイティブルートを推奨します。

## acpx ハーネスのサポート（現在）

組み込みの acpx ハーネスエイリアス（固定された `acpx` 依存関係に由来）：

| エイリアス   | ラップ対象                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp)（`cursor-agent acp`）                                             |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP ブリッジ（ネイティブの `openclaw acp`）                                                            |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` と `factorydroid` も、組み込みの `droid` アダプターとして解決されます。

OpenClaw が acpx バックエンドを使用する場合、acpx 設定でカスタムエージェントエイリアスを定義していない限り、`agentId` にはこれらの値を使用してください。
ローカルの Cursor インストールが引き続き ACP を `agent acp` として公開している場合は、組み込みのデフォルトを変更するのではなく、acpx 設定で `cursor` エージェントコマンドを上書きしてください。

acpx CLI を直接使用する場合は、`--agent <command>` を介して任意のアダプターを対象にすることもできますが、この低レベルのエスケープ手段は acpx CLI の機能であり、通常の OpenClaw `agentId` パスではありません。

モデル制御は、アダプターの機能に依存します。Codex ACP モデル参照は、
起動前に OpenClaw によって正規化されます。他のハーネスでは、ACP の `models` と
`session/set_model` のサポートが必要です。ハーネスがその ACP 機能も
独自の起動時モデルフラグも公開していない場合、OpenClaw/acpx はモデル選択を強制できません。

## 必須設定

コア ACP の基本設定：

```json5
{
  acp: {
    enabled: true,
    // オプション。デフォルトは true。/acp コントロールを維持したまま ACP ディスパッチを一時停止するには false に設定します。
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
      // デフォルトは coalesceIdleMs: 350、maxChunkChars: 1800。ここでは明示的に示しています。
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

スレッドバインディング設定は、チャネルアダプター固有です。Discord の例：

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
        // デフォルトですでに true。ここでは明示的に示しています。
        spawnSessions: true,
      },
    },
  },
}
```

スレッドにバインドされた ACP の生成が機能しない場合は、まずアダプターの機能フラグを確認してください。

- Discord：`channels.discord.threadBindings.spawnSessions=true`

現在の会話へのバインドでは、子スレッドを作成する必要はありません。アクティブな会話コンテキストと、ACP 会話バインディングを公開するチャネルアダプターが必要です。

[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## acpx バックエンド用の Plugin セットアップ

パッケージインストールでは、ACP 用の公式 `@openclaw/acpx` ランタイム Plugin を使用します。
ACP ハーネスセッションを使用する前に、インストールして有効化してください。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` 後にローカルワークスペースの Plugin も使用できます。

まず次を実行します。

```text
/acp doctor
```

`acpx` を無効化した場合、`plugins.allow` / `plugins.deny` で拒否した場合、または
パッケージ版 Plugin に戻したい場合は、明示的なパッケージパスを使用してください。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカルワークスペースインストール：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

その後、バックエンドの正常性を確認します。

```text
/acp doctor
```

### acpx ランタイム起動プローブ

`acpx` Plugin は ACP ランタイムを直接組み込んでいます（別個の `acpx` バイナリや
設定対象のバージョンはありません）。デフォルトでは、Gateway の起動中に
組み込みバックエンドを登録し、Gateway の `ready` シグナルの前に起動プローブの完了を待ちます。
起動プローブを意図的に無効のままにするスクリプトまたは環境でのみ、
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` または
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` を設定してください。明示的な
オンデマンドプローブには `/acp doctor` を実行します。

パスまたはフラグ値を 1 つの argv トークンとして維持する必要がある場合は、構造化された引数で
個別の ACP エージェントコマンドを上書きします。

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

- `agents.<id>.command` は、その ACP エージェントの実行可能ファイルまたは既存のコマンド文字列です。
- `agents.<id>.args` はオプションです。OpenClaw が現在の acpx コマンド文字列レジストリを介して各項目を渡す前に、配列の各項目がシェル引用されます。

[Plugins](/ja-JP/tools/plugin)を参照してください。

### アダプターの自動ダウンロード

`acpx` は初回使用時に、`npx` を介して ACP アダプター（Claude および Codex ACP
ブリッジなど）を自動ダウンロードします。アダプターパッケージを
手動でインストールする必要はなく、OpenClaw 自体に別個の postinstall 手順もありません。
アダプターのダウンロードまたは生成に失敗した場合は、`/acp doctor` が失敗を報告します。

### Plugin ツール MCP ブリッジ

デフォルトでは、ACPX セッションは OpenClaw の Plugin が登録したツールを
ACP ハーネスに公開**しません**。

Codex や Claude Code などの ACP エージェントから、メモリの呼び出しや保存など、
インストール済みの OpenClaw Plugin ツールを呼び出せるようにするには、専用ブリッジを有効化します。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

この機能の動作：

- `openclaw-plugin-tools` という名前の組み込み MCP サーバーを ACPX セッションの
  ブートストラップに注入します。
- インストールされ、有効化されている OpenClaw Plugin によってすでに登録済みの
  Plugin ツールを公開します。
- この機能を明示的な設定とし、デフォルトでは無効に保ちます。

セキュリティと信頼に関する注意事項：

- ACP ハーネスのツール範囲が拡大します。
- ACP エージェントがアクセスできるのは、Gateway ですでにアクティブな Plugin ツールのみです。
- これは、それらの Plugin を OpenClaw 自体で実行できるようにする場合と同じ信頼境界として扱ってください。
- 有効化する前に、インストール済みの Plugin を確認してください。

カスタム `mcpServers` は従来どおり機能します。組み込みの Plugin ツールブリッジは、
汎用 MCP サーバー設定の代替ではなく、追加でオプトインできる利便機能です。

### OpenClaw ツール MCP ブリッジ

デフォルトでは、ACPX セッションは組み込みの OpenClaw ツールも MCP を介して
公開**しません**。ACP エージェントが `cron` などの選択された組み込みツールを必要とする場合は、
別個のコアツールブリッジを有効化します。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

この機能の動作：

- `openclaw-tools` という名前の組み込み MCP サーバーを ACPX セッションの
  ブートストラップに注入します。
- 選択された組み込み OpenClaw ツールを公開します。初期サーバーは `cron` を公開します。
- コアツールの公開を明示的な設定とし、デフォルトでは無効に保ちます。

### ランタイム操作のタイムアウト設定

`acpx` Plugin では、組み込みランタイムの起動および制御操作のデフォルトタイムアウトを
120 秒に設定しています。これにより、Gemini CLI などの低速なハーネスでも ACP の起動と
初期化を完了するための十分な時間を確保できます。ホストで異なる操作上限が必要な場合は、
上書きしてください。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

ランタイムターンでは、`/acp timeout` を含む OpenClaw のエージェント/実行タイムアウトを使用します。
`sessions_spawn` は呼び出しごとのタイムアウト上書きを受け付けません。運用者向けの設定パスは
`agents.defaults.subagents.runTimeoutSeconds` です。`timeoutSeconds` を変更した後は、
Gateway を再起動してください。

### 正常性プローブのエージェント設定

`/acp doctor` または起動プローブがバックエンドを確認する際、同梱の `acpx`
Plugin は 1 つのハーネスエージェントをプローブします。`acp.allowedAgents` が設定されている場合、
デフォルトは最初に許可されたエージェントです。それ以外の場合、デフォルトは `codex` です。
デプロイ環境で正常性チェックに別の ACP エージェントが必要な場合は、プローブエージェントを明示的に設定します。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は、Gateway を再起動してください。

## 権限設定

ACP セッションは非対話形式で実行されます。ファイル書き込みやシェル実行の権限プロンプトを承認または拒否するための TTY はありません。acpx Plugin には、権限の処理方法を制御する 2 つの設定キーがあります。

これらの ACPX ハーネス権限は、OpenClaw の実行承認、および Claude CLI の `--permission-mode bypassPermissions` などの CLI バックエンドベンダーのバイパスフラグとは別のものです。ACPX の `approve-all` は、ACP セッション向けのハーネスレベルの緊急時切り替えです。

OpenClaw の `tools.exec.mode`、Codex Guardian の承認、
ACPX ハーネス権限の詳細な比較については、
[権限モード](/ja-JP/tools/permission-modes)を参照してください。

### `permissionMode`

ハーネスエージェントがプロンプトなしで実行できる操作を制御します。

| 値              | 動作                                                      |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | すべてのファイル書き込みとシェルコマンドを自動承認します。 |
| `approve-reads` | 読み取りのみを自動承認します。書き込みと実行には確認が必要です。 |
| `deny-all`      | すべての権限確認を拒否します。                            |

### `nonInteractivePermissions`

権限確認を表示する必要があるものの、対話型 TTY を利用できない場合（ACP セッションでは常に該当します）の動作を制御します。

| 値     | 動作                                                                     |
| ------ | ------------------------------------------------------------------------ |
| `fail` | `PermissionPromptUnavailableError` でセッションを中止します。**（デフォルト）** |
| `deny` | 権限を通知なしで拒否して続行します（グレースフルデグラデーション）。     |

### 設定

Plugin の設定で指定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後、Gateway を再起動します。

<Warning>
OpenClaw のデフォルトは `permissionMode=approve-reads` および `nonInteractivePermissions=fail` です。非対話型 ACP セッションでは、権限確認を発生させる書き込みまたは実行が、`PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` により失敗する可能性があります。

権限を制限する必要がある場合は、セッションがクラッシュせずグレースフルデグラデーションするように、`nonInteractivePermissions` を `deny` に設定してください。
</Warning>

## 関連項目

- [ACP エージェント](/ja-JP/tools/acp-agents) — 概要、運用者向け手順書、概念
- [サブエージェント](/ja-JP/tools/subagents)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
