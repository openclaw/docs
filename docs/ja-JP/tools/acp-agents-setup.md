---
read_when:
    - Claude Code / Codex / Gemini CLI 用 acpx ハーネスのインストールまたは設定
    - plugin-tools または OpenClaw-tools MCP ブリッジの有効化
    - ACP権限モードの設定
summary: ACP エージェントのセットアップ：acpx ハーネス設定、Plugin のセットアップ、権限
title: ACPエージェント — セットアップ
x-i18n:
    generated_at: "2026-07-16T12:11:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
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
| ネイティブ Codex app-server | `/codex ...`、`openai/gpt-*` エージェント参照                | [Codex ハーネス](/ja-JP/plugins/codex-harness) |
| 明示的な Codex ACP アダプター | `/acp spawn codex`、`runtime: "acp", agentId: "codex"` | このページ                              |

ACP/acpx の動作が明示的に必要でない限り、ネイティブルートを推奨します。

## acpx ハーネスのサポート（現在）

組み込みの acpx ハーネスエイリアス（固定された `acpx` 依存関係から）：

| エイリアス        | ラップ対象                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp)（`cursor-agent acp`）                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP ブリッジ（ネイティブ `openclaw acp`）                                                                     |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` と `factorydroid` も、組み込みの `droid` アダプターとして解決されます。

OpenClaw が acpx バックエンドを使用する場合、acpx 設定でカスタムエージェントエイリアスを定義していない限り、`agentId` にはこれらの値を使用することを推奨します。
ローカルの Cursor インストールで ACP が引き続き `agent acp` として公開される場合は、組み込みのデフォルトを変更するのではなく、acpx 設定で `cursor` エージェントコマンドを上書きしてください。

acpx CLI を直接使用する場合は、`--agent <command>` を介して任意のアダプターを対象にすることもできますが、この未加工のエスケープハッチは acpx CLI の機能です（通常の OpenClaw `agentId` パスではありません）。

モデル制御は、アダプターの機能に依存します。Codex ACP モデル参照は、
起動前に OpenClaw によって正規化されます。他のハーネスでは、ACP `models` と
`session/set_model` のサポートが必要です。ハーネスがその ACP 機能も
独自の起動時モデルフラグも公開していない場合、OpenClaw/acpx はモデル選択を強制できません。

## 必須設定

コア ACP ベースライン：

```json5
{
  acp: {
    enabled: true,
    // 任意。デフォルトは true。/acp コントロールを維持したまま ACP ディスパッチを一時停止するには false に設定します。
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

## acpx バックエンドの Plugin セットアップ

パッケージ版インストールでは、ACP に公式の `@openclaw/acpx` ランタイム Plugin を使用します。
ACP ハーネスセッションを使用する前に、インストールして有効化してください。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` の後にローカルワークスペースの Plugin も使用できます。

まず、次を実行します。

```text
/acp doctor
```

`acpx` を無効にした場合、`plugins.allow` / `plugins.deny` で拒否した場合、または
パッケージ版 Plugin に戻す場合は、明示的なパッケージパスを使用します。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカルワークスペースインストール：

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

次に、バックエンドの正常性を確認します。

```text
/acp doctor
```

### acpx ランタイム起動プローブ

`acpx` Plugin は ACP ランタイムを直接組み込みます（設定する個別の `acpx` バイナリや
バージョンはありません）。デフォルトでは、Gateway の起動中に組み込みバックエンドを登録し、
Gateway の `ready` シグナルの前に起動プローブを待機します。
起動プローブを意図的に無効のままにするスクリプトまたは環境でのみ、`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` または
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` を設定してください。明示的なオンデマンドプローブには `/acp doctor` を実行します。

パスまたはフラグ値を 1 つの argv トークンとして維持する必要がある場合は、構造化された引数を使用して
個々の ACP エージェントコマンドを上書きします。

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
- `agents.<id>.args` は任意です。OpenClaw が現在の acpx コマンド文字列レジストリを介して各配列項目を渡す前に、各項目はシェル用に引用されます。

[Plugins](/ja-JP/tools/plugin)を参照してください。

### アダプターの自動ダウンロード

`acpx` は、初回使用時に `npx` を介して ACP アダプター（Claude や Codex の ACP
ブリッジなど）を自動ダウンロードします。アダプターパッケージを
手動でインストールする必要はなく、OpenClaw 自体に個別の postinstall 手順もありません。
アダプターのダウンロードまたは生成に失敗した場合、`/acp doctor` が失敗を報告します。

### Plugin ツール MCP ブリッジ

デフォルトでは、ACPX セッションは OpenClaw の Plugin が登録したツールを
ACP ハーネスに公開**しません**。

Codex や Claude Code などの ACP エージェントから、メモリの呼び出しや保存など、
インストール済みの OpenClaw Plugin ツールを呼び出せるようにするには、専用ブリッジを有効にします。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

この設定の動作：

- ACPX セッションのブートストラップに、`openclaw-plugin-tools` という名前の組み込み MCP サーバーを
  注入します。
- インストールされ、有効になっている OpenClaw Plugin によってすでに登録されている Plugin ツールを
  公開します。
- アクティブな ACP セッション ID を Plugin ツールファクトリに渡すため、
  エージェントスコープのツールはそのエージェントの名前空間に保持されます。
- この機能を明示的かつデフォルト無効の状態に保ちます。

セキュリティと信頼に関する注意事項：

- これにより、ACP ハーネスのツール公開範囲が拡大します。
- ACP エージェントがアクセスできるのは、Gateway ですでにアクティブな Plugin ツールのみです。
- これらの Plugin を OpenClaw 自体で実行できるようにする場合と同じ信頼境界として
  扱ってください。
- 有効にする前に、インストール済みの Plugin を確認してください。

カスタム `mcpServers` は従来どおり動作します。組み込みの Plugin ツールブリッジは、
汎用 MCP サーバー設定の代替ではなく、追加でオプトインできる利便機能です。

### OpenClaw ツール MCP ブリッジ

デフォルトでは、ACPX セッションは組み込みの OpenClaw ツールも MCP 経由で
公開**しません**。ACP エージェントが `cron` などの選択された
組み込みツールを必要とする場合は、個別のコアツールブリッジを有効にします。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

この設定の動作：

- ACPX セッションのブートストラップに、`openclaw-tools` という名前の組み込み MCP サーバーを
  注入します。
- 選択された組み込み OpenClaw ツールを公開します。初期サーバーでは `cron` を公開します。
- コアツールの公開を明示的かつデフォルト無効の状態に保ちます。

### ランタイム操作のタイムアウト設定

`acpx` Plugin は、組み込みランタイムの起動および制御操作にデフォルトで 120
秒を割り当てます。これにより、Gemini CLI などの低速なハーネスでも
ACP の起動と初期化を完了するための十分な時間が確保されます。ホストで異なる
操作制限が必要な場合は、上書きします。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

ランタイムターンでは、`/acp timeout` を含む OpenClaw のエージェント/実行タイムアウトを使用します。
`sessions_spawn` は呼び出しごとのタイムアウト上書きを受け付けません。運用者向けの設定パスは
`agents.defaults.subagents.runTimeoutSeconds` です。`timeoutSeconds` を
変更した後は、Gateway を再起動してください。

### ヘルスプローブのエージェント設定

`/acp doctor` または起動プローブがバックエンドを確認するとき、同梱の `acpx`
Plugin は 1 つのハーネスエージェントをプローブします。`acp.allowedAgents` が設定されている場合は、
許可された最初のエージェントがデフォルトになります。それ以外の場合、`codex` がデフォルトです。デプロイ環境で
ヘルスチェックに別の ACP エージェントが必要な場合は、プローブエージェントを明示的に設定します。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は、Gateway を再起動してください。

## 権限設定

ACP セッションは非対話的に実行されます。ファイル書き込みやシェル実行の権限プロンプトを承認または拒否するための TTY はありません。acpx Plugin には、権限の処理方法を制御する 2 つの設定キーがあります。

これらの ACPX ハーネス権限は、OpenClaw の実行承認とは別のものであり、Claude CLI `--permission-mode bypassPermissions` などの CLI バックエンドベンダーのバイパスフラグとも別です。ACPX `approve-all` は、ACP セッション用のハーネスレベルの緊急時切り替えスイッチです。

OpenClaw `tools.exec.mode`、Codex Guardian の承認、および ACPX ハーネス権限のより広範な比較については、[権限モード](/ja-JP/tools/permission-modes)を参照してください。

### `permissionMode`

ハーネスエージェントがプロンプトなしで実行できる操作を制御します。

| 値           | 動作                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | すべてのファイル書き込みとシェルコマンドを自動承認します。          |
| `approve-reads` | 読み取りのみを自動承認します。書き込みと実行にはプロンプトが必要です。 |
| `deny-all`      | すべての権限プロンプトを拒否します。                              |

### `nonInteractivePermissions`

権限プロンプトが表示される状況で、対話型 TTY が利用できない場合（ACP セッションでは常にこの状態です）の動作を制御します。

| 値  | 動作                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | `PermissionPromptUnavailableError` でセッションを中止します。**（デフォルト）** |
| `deny` | 権限を暗黙的に拒否して続行します（グレースフルデグラデーション）。        |

### 設定

Plugin 設定で指定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後、Gateway を再起動してください。

<Warning>
OpenClaw のデフォルトは `permissionMode=approve-reads` と `nonInteractivePermissions=fail` です。非対話型 ACP セッションでは、権限プロンプトを発生させる書き込みまたは実行が `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` で失敗する可能性があります。

権限を制限する必要がある場合は、`nonInteractivePermissions` を `deny` に設定し、セッションがクラッシュせずにグレースフルデグラデーションするようにしてください。
</Warning>

## 関連項目

- [ACP エージェント](/ja-JP/tools/acp-agents) — 概要、運用者向けランブック、概念
- [サブエージェント](/ja-JP/tools/subagents)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
