---
read_when:
    - Claude Code / Codex / Gemini CLI 向け acpx ハーネスのインストールまたは設定
    - plugin-tools または OpenClaw-tools MCP ブリッジの有効化
    - ACP 権限モードの設定
summary: 'ACP エージェントのセットアップ: acpx ハーネス設定、Plugin のセットアップ、権限'
title: ACP エージェント — セットアップ
x-i18n:
    generated_at: "2026-05-10T19:53:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

概要、運用者向けランブック、概念については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

以下のセクションでは、acpx ハーネス設定、MCP ブリッジ向け Plugin セットアップ、権限設定について説明します。

このページは、ACP/acpx ルートをセットアップする場合にのみ使用してください。ネイティブ Codex
app-server ランタイム設定には、[Codex ハーネス](/ja-JP/plugins/codex-harness)を使用してください。
OpenAI API キーまたは Codex OAuth モデルプロバイダー設定には、
[OpenAI](/ja-JP/providers/openai)を使用してください。

Codex には 2 つの OpenClaw ルートがあります。

| ルート                     | 設定/コマンド                                          | セットアップページ                    |
| -------------------------- | ------------------------------------------------------ | ------------------------------------- |
| ネイティブ Codex app-server | `/codex ...`, `openai/gpt-*` agent refs                | [Codex ハーネス](/ja-JP/plugins/codex-harness) |
| 明示的な Codex ACP アダプター | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | このページ                            |

ACP/acpx の動作が明示的に必要な場合を除き、ネイティブルートを推奨します。

## acpx ハーネスサポート（現在）

現在の acpx 組み込みハーネスエイリアス:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

OpenClaw が acpx バックエンドを使用する場合、acpx 設定でカスタムエージェントエイリアスを定義していない限り、`agentId` にはこれらの値を推奨します。
ローカルの Cursor インストールがまだ `agent acp` として ACP を公開している場合は、組み込みデフォルトを変更するのではなく、acpx 設定で `cursor` エージェントコマンドを上書きしてください。

acpx CLI を直接使用する場合は、`--agent <command>` によって任意のアダプターも対象にできますが、その生のエスケープハッチは acpx CLI の機能であり、通常の OpenClaw `agentId` パスではありません。

モデル制御はアダプターのケイパビリティに依存します。Codex ACP モデル参照は
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
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

スレッドバインディング設定はチャネルアダプター固有です。Discord の例:

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
        spawnSessions: true,
      },
    },
  },
}
```

スレッドにバインドされた ACP spawn が機能しない場合は、まずアダプター機能フラグを確認してください。

- Discord: `channels.discord.threadBindings.spawnSessions=true`

現在の会話へのバインドでは、子スレッド作成は不要です。アクティブな会話コンテキストと、ACP 会話バインディングを公開するチャネルアダプターが必要です。

[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## acpx バックエンド向け Plugin セットアップ

パッケージ版インストールでは、ACP に公式の `@openclaw/acpx` ランタイム Plugin を使用します。
ACP ハーネスセッションを使用する前に、インストールして有効化してください。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` 後にローカルワークスペース Plugin も使用できます。

次で開始します。

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

その後、バックエンドの健全性を確認します。

```text
/acp doctor
```

### acpx コマンドとバージョン設定

デフォルトでは、`acpx` Plugin は Gateway
起動中に組み込み ACP バックエンドをプローブし、gateway の `ready` シグナルの前にそのプローブ完了を待ちます。
起動時プローブをスキップし、代わりにバックエンドを遅延登録するには、
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` を設定してください。明示的なオンデマンドプローブには `/acp doctor` を実行してください。

Plugin 設定でコマンドまたはバージョンを上書きします。

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` は絶対パス、相対パス（OpenClaw ワークスペースから解決）、またはコマンド名を受け付けます。
- `expectedVersion: "any"` は厳密なバージョン照合を無効化します。
- カスタム `command` パスは Plugin ローカルの自動インストールを無効化します。

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

- `agents.<id>.command` は、その ACP エージェントの実行可能ファイルまたは既存のコマンド文字列です。
- `agents.<id>.args` は任意です。OpenClaw が現在の acpx コマンド文字列レジストリへ渡す前に、各配列項目はシェル引用されます。

[Plugin](/ja-JP/tools/plugin)を参照してください。

### 自動依存関係インストール

`npm install -g openclaw` で OpenClaw をグローバルインストールすると、acpx
ランタイム依存関係（プラットフォーム固有バイナリ）は postinstall フックによって自動的にインストールされます。
自動インストールに失敗した場合でも、gateway は通常どおり起動し、
不足している依存関係を `openclaw acp doctor` で報告します。

### Plugin ツール MCP ブリッジ

デフォルトでは、ACPX セッションは OpenClaw Plugin 登録ツールを
ACP ハーネスに公開しません。

Codex や Claude Code などの ACP エージェントに、memory recall/store などのインストール済み
OpenClaw Plugin ツールを呼び出させたい場合は、専用ブリッジを有効化してください。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これが行うこと:

- ACPX セッションのブートストラップに、`openclaw-plugin-tools` という名前の組み込み MCP サーバーを注入します。
- インストール済みかつ有効化済みの OpenClaw
  Plugin によってすでに登録されている Plugin ツールを公開します。
- この機能を明示的かつデフォルトオフのままにします。

セキュリティと信頼に関する注意:

- これにより ACP ハーネスのツールサーフェスが拡張されます。
- ACP エージェントは、gateway ですでにアクティブな Plugin ツールにのみアクセスできます。
- これは、それらの Plugin を OpenClaw
  自体で実行させる場合と同じ信頼境界として扱ってください。
- 有効化する前に、インストール済み Plugin を確認してください。

カスタム `mcpServers` はこれまでどおり機能します。組み込み Plugin ツールブリッジは、
汎用 MCP サーバー設定の代替ではなく、追加のオプトインの利便機能です。

### OpenClaw ツール MCP ブリッジ

デフォルトでは、ACPX セッションは組み込み OpenClaw ツールも
MCP 経由で公開しません。ACP エージェントが `cron` などの選択された
組み込みツールを必要とする場合は、別個のコアツールブリッジを有効化してください。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

これが行うこと:

- ACPX セッションのブートストラップに、`openclaw-tools` という名前の組み込み MCP サーバーを注入します。
- 選択された組み込み OpenClaw ツールを公開します。初期サーバーは `cron` を公開します。
- コアツールの公開を明示的かつデフォルトオフのままにします。

### ランタイムタイムアウト設定

`acpx` Plugin は、組み込みランタイムターンのデフォルトを 120 秒
タイムアウトに設定します。これにより、Gemini CLI などの遅いハーネスにも
ACP 起動と初期化を完了するための十分な時間が与えられます。ホストに異なる
ランタイム制限が必要な場合は上書きしてください。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

この値を変更した後は、gateway を再起動してください。

### ヘルスプローブエージェント設定

`/acp doctor` または起動時プローブがバックエンドを確認するとき、バンドルされた `acpx`
Plugin は 1 つのハーネスエージェントをプローブします。`acp.allowedAgents` が設定されている場合は、
最初に許可されたエージェントがデフォルトになります。それ以外の場合は `codex` がデフォルトです。デプロイで
ヘルスチェックに別の ACP エージェントが必要な場合は、プローブエージェントを明示的に設定してください。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は、gateway を再起動してください。

## 権限設定

ACP セッションは非対話的に実行されます。ファイル書き込みやシェル実行の権限プロンプトを承認または拒否する TTY はありません。acpx Plugin は、権限の扱いを制御する 2 つの設定キーを提供します。

これらの ACPX ハーネス権限は、OpenClaw の実行承認とは別であり、Claude CLI `--permission-mode bypassPermissions` などの CLI バックエンドベンダーのバイパスフラグとも別です。ACPX `approve-all` は、ACP セッション向けのハーネスレベルの非常用スイッチです。

### `permissionMode`

ハーネスエージェントがプロンプトなしで実行できる操作を制御します。

| 値              | 動作                                                     |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | すべてのファイル書き込みとシェルコマンドを自動承認します。 |
| `approve-reads` | 読み取りのみを自動承認します。書き込みと実行にはプロンプトが必要です。 |
| `deny-all`      | すべての権限プロンプトを拒否します。                       |

### `nonInteractivePermissions`

権限プロンプトが表示されるはずだが対話的 TTY が利用できない場合（ACP セッションでは常にこの状態）に何が起きるかを制御します。

| 値     | 動作                                                                  |
| ------ | --------------------------------------------------------------------- |
| `fail` | `AcpRuntimeError` でセッションを中止します。**（デフォルト）**          |
| `deny` | 権限を黙って拒否し、続行します（グレースフルデグラデーション）。       |

### 設定

Plugin 設定で設定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後は、gateway を再起動してください。

<Warning>
OpenClaw のデフォルトは `permissionMode=approve-reads` と `nonInteractivePermissions=fail` です。非対話的 ACP セッションでは、権限プロンプトを発生させる書き込みまたは実行は `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗する可能性があります。

権限を制限する必要がある場合は、`nonInteractivePermissions` を `deny` に設定し、セッションがクラッシュするのではなくグレースフルに縮退するようにしてください。
</Warning>

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents) — 概要、運用者向けランブック、概念
- [サブエージェント](/ja-JP/tools/subagents)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
