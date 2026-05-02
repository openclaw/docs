---
read_when:
    - Claude Code / Codex / Gemini CLI 用の acpx ハーネスのインストールまたは設定
    - plugin-tools または OpenClaw-tools MCP ブリッジの有効化
    - ACP 権限モードの設定
summary: 'ACP エージェントのセットアップ: acpx ハーネス設定、Plugin のセットアップ、権限'
title: ACP エージェント — セットアップ
x-i18n:
    generated_at: "2026-05-02T21:07:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

概要、運用者向けランブック、概念については、[ACP エージェント](/ja-JP/tools/acp-agents)を参照してください。

以下のセクションでは、acpx ハーネス設定、MCP ブリッジ用の Plugin セットアップ、権限設定について説明します。

このページは、ACP/acpx ルートを設定する場合にのみ使用してください。ネイティブ Codex
app-server ランタイム設定には、[Codex ハーネス](/ja-JP/plugins/codex-harness)を使用してください。
OpenAI API キー、または Codex OAuth モデルプロバイダー設定には、
[OpenAI](/ja-JP/providers/openai)を使用してください。

Codex には 2 つの OpenClaw ルートがあります。

| ルート                     | 設定/コマンド                                          | セットアップページ                    |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| ネイティブ Codex app-server | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex ハーネス](/ja-JP/plugins/codex-harness) |
| 明示的な Codex ACP アダプター | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | このページ                              |

ACP/acpx の動作が明示的に必要でない限り、ネイティブ ルートを優先してください。

## acpx ハーネスサポート（現在）

現在の acpx 組み込みハーネスエイリアス:

- `claude`
- `codex`
- `copilot`
- `cursor`（Cursor CLI: `cursor-agent acp`）
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

OpenClaw が acpx バックエンドを使用する場合、acpx 設定でカスタムエージェントエイリアスを定義していない限り、`agentId` にはこれらの値を優先してください。
ローカルの Cursor インストールがまだ ACP を `agent acp` として公開している場合は、組み込みのデフォルトを変更するのではなく、acpx 設定で `cursor` エージェントコマンドを上書きしてください。

直接の acpx CLI 使用では、`--agent <command>` を使って任意のアダプターを対象にすることもできますが、この生のエスケープハッチは acpx CLI の機能です（通常の OpenClaw `agentId` パスではありません）。

モデル制御は、アダプターのケイパビリティに依存します。Codex ACP モデル参照は、
起動前に OpenClaw によって正規化されます。他のハーネスには ACP `models` と
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

スレッドバインド ACP spawn が動作しない場合は、まずアダプターの機能フラグを確認してください。

- Discord: `channels.discord.threadBindings.spawnSessions=true`

現在の会話へのバインドには、子スレッド作成は不要です。アクティブな会話コンテキストと、ACP 会話バインディングを公開するチャネルアダプターが必要です。

[設定リファレンス](/ja-JP/gateway/configuration-reference)を参照してください。

## acpx バックエンド用 Plugin セットアップ

パッケージ化されたインストールでは、ACP 用の公式 `@openclaw/acpx` ランタイム Plugin を使用します。
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
パッケージ化された Plugin に戻したい場合は、明示的なパッケージパスを使用してください。

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカルワークスペースインストール:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

その後、バックエンドのヘルスを確認します。

```text
/acp doctor
```

### acpx コマンドとバージョン設定

デフォルトでは、`acpx` Plugin は Gateway 起動時に ACP エージェントを
spawn せず、埋め込み ACP バックエンドを登録します。明示的な
ライブプローブには `/acp doctor` を実行してください。Gateway が起動時に
設定済みエージェントをプローブする必要がある場合にのみ、`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` を設定してください。

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

- `command` は、絶対パス、相対パス（OpenClaw ワークスペースから解決）、またはコマンド名を受け付けます。
- `expectedVersion: "any"` は厳密なバージョン一致を無効にします。
- カスタム `command` パスは、Plugin ローカルの自動インストールを無効にします。

[Plugins](/ja-JP/tools/plugin)を参照してください。

### 自動依存関係インストール

`npm install -g openclaw` で OpenClaw をグローバルにインストールすると、acpx
ランタイム依存関係（プラットフォーム固有バイナリ）は postinstall フックによって自動的にインストールされます。
自動インストールが失敗しても、gateway は通常どおり起動し、
`openclaw acp doctor` を通じて不足している依存関係を報告します。

### Plugin ツール MCP ブリッジ

デフォルトでは、ACPX セッションは OpenClaw Plugin 登録ツールを
ACP ハーネスに公開しません。

Codex や Claude Code などの ACP エージェントに、memory recall/store などの
インストール済み OpenClaw Plugin ツールを呼び出させたい場合は、専用ブリッジを有効にします。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これが行うこと:

- `openclaw-plugin-tools` という名前の組み込み MCP サーバーを ACPX セッション
  ブートストラップに注入します。
- インストール済みで有効な OpenClaw
  Plugins によってすでに登録されている Plugin ツールを公開します。
- この機能を明示的かつデフォルトオフのままにします。

セキュリティと信頼に関する注意:

- これにより ACP ハーネスのツール面が拡大します。
- ACP エージェントは、gateway ですでにアクティブな Plugin ツールにのみアクセスできます。
- これは、それらの Plugins を OpenClaw 自体で実行させる場合と同じ信頼境界として扱ってください。
- 有効化する前に、インストール済み Plugins を確認してください。

カスタム `mcpServers` は従来どおり動作します。組み込み Plugin ツールブリッジは、
汎用 MCP サーバー設定の置き換えではなく、追加のオプトイン利便機能です。

### OpenClaw ツール MCP ブリッジ

デフォルトでは、ACPX セッションは組み込み OpenClaw ツールも MCP 経由で
公開しません。ACP エージェントが `cron` などの選択された
組み込みツールを必要とする場合は、別個のコアツールブリッジを有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

これが行うこと:

- `openclaw-tools` という名前の組み込み MCP サーバーを ACPX セッション
  ブートストラップに注入します。
- 選択された組み込み OpenClaw ツールを公開します。初期サーバーは `cron` を公開します。
- コアツールの公開を明示的かつデフォルトオフのままにします。

### ランタイムタイムアウト設定

`acpx` Plugin は、埋め込みランタイムターンのデフォルトを 120 秒の
タイムアウトにします。これにより、Gemini CLI などの遅いハーネスにも、
ACP の起動と初期化を完了する十分な時間が与えられます。ホストで別の
ランタイム制限が必要な場合は、上書きしてください。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

この値を変更した後は、gateway を再起動してください。

### ヘルスプローブエージェント設定

`/acp doctor` またはオプトインの起動時プローブがバックエンドをチェックするとき、バンドルされた
`acpx` Plugin は 1 つのハーネスエージェントをプローブします。`acp.allowedAgents` が設定されている場合は、
最初に許可されたエージェントがデフォルトになります。それ以外の場合は `codex` がデフォルトです。デプロイで
ヘルスチェック用に別の ACP エージェントが必要な場合は、プローブエージェントを明示的に設定してください。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は、gateway を再起動してください。

## 権限設定

ACP セッションは非対話的に実行されます。つまり、ファイル書き込みや shell-exec 権限プロンプトを承認または拒否するための TTY はありません。acpx Plugin には、権限の扱いを制御する 2 つの設定キーがあります。

これらの ACPX ハーネス権限は、OpenClaw exec 承認とは別であり、Claude CLI `--permission-mode bypassPermissions` などの CLI バックエンドベンダーバイパスフラグとも別です。ACPX `approve-all` は、ACP セッション向けのハーネスレベルの break-glass スイッチです。

### `permissionMode`

ハーネスエージェントがプロンプトなしで実行できる操作を制御します。

| 値              | 動作                                                      |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | すべてのファイル書き込みとシェルコマンドを自動承認します。 |
| `approve-reads` | 読み取りのみ自動承認します。書き込みと exec にはプロンプトが必要です。 |
| `deny-all`      | すべての権限プロンプトを拒否します。                      |

### `nonInteractivePermissions`

権限プロンプトが表示されるはずだが対話型 TTY が利用できない場合（ACP セッションでは常にそうです）に何が起きるかを制御します。

| 値     | 動作                                                            |
| ------ | --------------------------------------------------------------- |
| `fail` | `AcpRuntimeError` でセッションを中止します。**（デフォルト）** |
| `deny` | 権限を黙って拒否し、続行します（グレースフルデグラデーション）。 |

### 設定

Plugin 設定で設定します。

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後は、gateway を再起動してください。

<Warning>
OpenClaw のデフォルトは `permissionMode=approve-reads` と `nonInteractivePermissions=fail` です。非対話 ACP セッションでは、権限プロンプトをトリガーする書き込みまたは exec は、`AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗する可能性があります。

権限を制限する必要がある場合は、`nonInteractivePermissions` を `deny` に設定し、セッションがクラッシュする代わりにグレースフルに劣化するようにしてください。
</Warning>

## 関連

- [ACP エージェント](/ja-JP/tools/acp-agents) — 概要、運用者向けランブック、概念
- [サブエージェント](/ja-JP/tools/subagents)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
