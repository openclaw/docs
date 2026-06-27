---
read_when:
    - Claude Code / Codex / Gemini CLI 用 acpx ハーネスのインストールまたは設定
    - Plugin-tools または OpenClaw-tools MCP ブリッジの有効化
    - ACP 権限モードの設定
summary: 'ACP エージェントのセットアップ: acpx ハーネス設定、プラグインセットアップ、権限'
title: ACP エージェント — セットアップ
x-i18n:
    generated_at: "2026-06-27T13:07:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

概要、運用者向けランブック、概念については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

以下のセクションでは、acpx ハーネス設定、MCP ブリッジ用の Plugin セットアップ、権限設定を扱います。

このページは、ACP/acpx ルートを設定する場合にのみ使用してください。ネイティブ Codex
app-server ランタイム設定については、[Codex ハーネス](/ja-JP/plugins/codex-harness)を使用してください。
OpenAI API キーまたは Codex OAuth モデルプロバイダー設定については、
[OpenAI](/ja-JP/providers/openai)を使用してください。

Codex には 2 つの OpenClaw ルートがあります。

| ルート                     | 設定/コマンド                                          | セットアップページ                    |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| ネイティブ Codex app-server | `/codex ...`, `openai/gpt-*` agent refs                | [Codex ハーネス](/ja-JP/plugins/codex-harness) |
| 明示的な Codex ACP アダプター | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | このページ                              |

ACP/acpx の動作が明示的に必要でない限り、ネイティブルートを優先してください。

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
- `qwen`

OpenClaw が acpx バックエンドを使用する場合、acpx 設定でカスタムエージェントエイリアスを定義していない限り、`agentId` にはこれらの値を優先してください。
ローカルの Cursor インストールがまだ ACP を `agent acp` として公開している場合は、組み込みのデフォルトを変更するのではなく、acpx 設定で `cursor` エージェントコマンドを上書きしてください。

直接の acpx CLI 使用では、`--agent <command>` によって任意のアダプターも対象にできますが、この生のエスケープハッチは acpx CLI 機能です（通常の OpenClaw `agentId` パスではありません）。

モデル制御はアダプター機能に依存します。Codex ACP モデル参照は、
起動前に OpenClaw によって正規化されます。他のハーネスでは ACP `models` と
`session/set_model` のサポートが必要です。ハーネスがその ACP 機能も
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
      "openclaw",
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

スレッドバインディング設定はチャンネルアダプター固有です。Discord の例:

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

スレッドに紐づく ACP spawn が動作しない場合は、まずアダプター機能フラグを確認してください。

- Discord: `channels.discord.threadBindings.spawnSessions=true`

現在の会話へのバインドでは、子スレッドの作成は不要です。アクティブな会話コンテキストと、ACP 会話バインディングを公開するチャンネルアダプターが必要です。

[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## acpx バックエンドの Plugin セットアップ

パッケージ化されたインストールでは、ACP 用の公式 `@openclaw/acpx` ランタイム Plugin を使用します。
ACP ハーネスセッションを使用する前に、インストールして有効化してください。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

ソースチェックアウトでは、`pnpm install` 後にローカルワークスペース Plugin も使用できます。

次から開始してください。

```text
/acp doctor
```

`acpx` を無効化した場合、`plugins.allow` / `plugins.deny` で拒否した場合、または
パッケージ化された Plugin に戻したい場合は、明示的なパッケージパスを使用してください。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカルワークスペースインストール:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

次にバックエンドの健全性を確認します。

```text
/acp doctor
```

### acpx コマンドとバージョン設定

デフォルトでは、`acpx` Plugin は Gateway
起動中に埋め込み ACP バックエンドを登録し、gateway
`ready` シグナルの前に埋め込みランタイム起動プローブを待ちます。起動プローブを意図的に無効にしておくスクリプトまたは環境でのみ、
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` または
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` を設定してください。明示的な
オンデマンドプローブには `/acp doctor` を実行してください。

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
- `expectedVersion: "any"` は厳密なバージョン一致を無効化します。
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

- `agents.<id>.command` はその ACP エージェントの実行可能ファイルまたは既存のコマンド文字列です。
- `agents.<id>.args` は任意です。OpenClaw が現在の acpx コマンド文字列レジストリに渡す前に、各配列項目はシェルクォートされます。

[Plugins](/ja-JP/tools/plugin)を参照してください。

### 自動依存関係インストール

`npm install -g openclaw` で OpenClaw をグローバルにインストールすると、acpx
ランタイム依存関係（プラットフォーム固有のバイナリ）は postinstall フックによって自動的にインストールされます。自動インストールに失敗した場合でも、gateway は通常どおり起動し、
不足している依存関係を `openclaw acp doctor` で報告します。

### Plugin ツール MCP ブリッジ

デフォルトでは、ACPX セッションは OpenClaw Plugin 登録ツールを
ACP ハーネスに公開しません。

Codex や Claude Code などの ACP エージェントに、メモリ recall/store などのインストール済み
OpenClaw Plugin ツールを呼び出させたい場合は、専用ブリッジを有効化してください。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これが行うこと:

- `openclaw-plugin-tools` という名前の組み込み MCP サーバーを ACPX セッション
  ブートストラップに注入します。
- インストール済みで有効化済みの OpenClaw
  plugins によってすでに登録されている Plugin ツールを公開します。
- この機能を明示的かつデフォルトオフのままにします。

セキュリティと信頼に関する注意:

- これは ACP ハーネスのツール面を拡張します。
- ACP エージェントは、gateway ですでにアクティブな Plugin ツールのみにアクセスできます。
- これは、それらの plugins を OpenClaw 自体で実行させる場合と同じ信頼境界として扱ってください。
- 有効化する前に、インストール済み plugins を確認してください。

カスタム `mcpServers` は従来どおり動作します。組み込みの Plugin ツールブリッジは、
汎用 MCP サーバー設定の置き換えではなく、追加のオプトインの利便機能です。

### OpenClaw ツール MCP ブリッジ

デフォルトでは、ACPX セッションは組み込み OpenClaw ツールも
MCP 経由では公開しません。ACP エージェントが `cron` などの選択された
組み込みツールを必要とする場合は、別個のコアツールブリッジを有効化してください。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

これが行うこと:

- `openclaw-tools` という名前の組み込み MCP サーバーを ACPX セッション
  ブートストラップに注入します。
- 選択された組み込み OpenClaw ツールを公開します。初期サーバーは `cron` を公開します。
- コアツールの公開を明示的かつデフォルトオフのままにします。

### ランタイム操作タイムアウト設定

`acpx` Plugin は、埋め込みランタイム起動と制御操作にデフォルトで 120
秒を与えます。これにより、Gemini CLI などの遅いハーネスが
ACP 起動と初期化を完了するのに十分な時間が得られます。ホストに
別の操作制限が必要な場合は上書きしてください。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

ランタイムターンは、`/acp timeout` を含む OpenClaw エージェント/実行タイムアウトを使用します。
`sessions_spawn` は呼び出しごとのタイムアウト上書きを受け付けません。この値を変更した後は
gateway を再起動してください。

### 健全性プローブエージェント設定

`/acp doctor` または起動プローブがバックエンドを確認するとき、バンドルされた `acpx`
Plugin は 1 つのハーネスエージェントをプローブします。`acp.allowedAgents` が設定されている場合、デフォルトは
最初に許可されたエージェントです。それ以外の場合は `codex` がデフォルトです。デプロイで
健全性チェック用に別の ACP エージェントが必要な場合は、プローブエージェントを明示的に設定してください。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は gateway を再起動してください。

## 権限設定

ACP セッションは非対話的に実行されます。ファイル書き込みと shell-exec の権限プロンプトを承認または拒否する TTY はありません。acpx Plugin は、権限の扱いを制御する 2 つの設定キーを提供します。

これらの ACPX ハーネス権限は、OpenClaw exec 承認とは別であり、Claude CLI `--permission-mode bypassPermissions` などの CLI バックエンドベンダーバイパスフラグとも別です。ACPX `approve-all` は ACP セッション用のハーネスレベルの緊急用スイッチです。

OpenClaw `tools.exec.mode`、Codex Guardian
承認、ACPX ハーネス権限のより広範な比較については、
[権限モード](/ja-JP/tools/permission-modes)を参照してください。

### `permissionMode`

ハーネスエージェントがプロンプトなしで実行できる操作を制御します。

| 値              | 動作                                                      |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | すべてのファイル書き込みとシェルコマンドを自動承認します。 |
| `approve-reads` | 読み取りのみを自動承認します。書き込みと exec にはプロンプトが必要です。 |
| `deny-all`      | すべての権限プロンプトを拒否します。                      |

### `nonInteractivePermissions`

権限プロンプトが表示されるはずだが対話型 TTY が利用できない場合（ACP セッションでは常にこれに該当）に何が起こるかを制御します。

| 値     | 動作                                                              |
| ------ | ----------------------------------------------------------------- |
| `fail` | `AcpRuntimeError` でセッションを中止します。**（デフォルト）**    |
| `deny` | 権限を暗黙に拒否して続行します（穏やかな機能低下）。              |

### 設定

Plugin 設定で設定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後は gateway を再起動してください。

<Warning>
OpenClaw のデフォルトは `permissionMode=approve-reads` と `nonInteractivePermissions=fail` です。非対話的な ACP セッションでは、権限プロンプトを発生させる書き込みまたは exec は `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗する可能性があります。

権限を制限する必要がある場合は、`nonInteractivePermissions` を `deny` に設定し、セッションがクラッシュするのではなく穏やかに機能低下するようにしてください。
</Warning>

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents) — 概要、運用者向けランブック、概念
- [サブエージェント](/ja-JP/tools/subagents)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
