---
read_when:
    - Claude Code / Codex / Gemini CLI 向けに acpx ハーネスをインストールまたは設定する
    - plugin-tools または OpenClaw-tools MCP bridge を有効にする
    - ACP 権限モードを設定する
summary: 'ACP エージェントのセットアップ: acpx ハーネス設定、Plugin セットアップ、権限'
title: ACP エージェント — セットアップ
x-i18n:
    generated_at: "2026-04-24T05:22:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

概要、operator runbook、概念については [ACP agents](/ja-JP/tools/acp-agents) を参照してください。
このページでは acpx harness 設定、MCP bridge 用 Plugin セットアップ、
および権限設定を扱います。

## acpx harness サポート（現行）

現在の acpx 組み込み harness alias:

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

OpenClaw が acpx backend を使う場合、ローカルの acpx config がカスタム agent alias を定義していない限り、`agentId` にはこれらの値を使ってください。
ローカルの Cursor install がまだ ACP を `agent acp` として公開している場合は、
組み込みデフォルトを変えるのではなく、acpx config 内で `cursor` agent command を上書きしてください。

直接の acpx CLI 使用では、`--agent <command>` で任意の adapter も対象にできますが、
この生の escape hatch は acpx CLI 機能であり（通常の OpenClaw `agentId` 経路ではありません）。

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

thread binding 設定は channel adapter ごとに異なります。Discord の例:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

thread-bound ACP spawn が動作しない場合は、まず adapter feature flag を確認してください。

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

現在の会話 bind には child-thread 作成は不要です。必要なのはアクティブな会話コンテキストと、ACP 会話 binding を公開する channel adapter です。

[設定リファレンス](/ja-JP/gateway/configuration-reference) を参照してください。

## acpx backend 用 Plugin セットアップ

新規インストールでは、バンドル済み `acpx` runtime Plugin はデフォルトで有効になっているため、通常
ACP は手動 Plugin インストール手順なしで動作します。

まず次を実行してください:

```text
/acp doctor
```

`acpx` を無効にした、`plugins.allow` / `plugins.deny` で拒否した、または
ローカル開発 checkout に切り替えたい場合は、明示的な Plugin 経路を使います。

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中のローカル workspace install:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

その後、backend health を確認します:

```text
/acp doctor
```

### acpx command と version 設定

デフォルトでは、バンドル済み `acpx` Plugin は Plugin ローカルで pin されたバイナリ（Plugin package 内の `node_modules/.bin/acpx`）を使用します。起動時に backend は not-ready として登録され、バックグラウンドジョブが `acpx --version` を検証します。バイナリが存在しないか不一致の場合、`npm install --omit=dev --no-save acpx@<pinned>` を実行して再検証します。Gateway はその間ずっと non-blocking のままです。

Plugin config で command または version を上書きします:

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

- `command` には、絶対パス、相対パス（OpenClaw workspace から解決）、または command 名を指定できます。
- `expectedVersion: "any"` は strict な version 一致を無効にします。
- カスタム `command` path は Plugin ローカルの auto-install を無効にします。

[Plugins](/ja-JP/tools/plugin) を参照してください。

### 自動依存関係インストール

`npm install -g openclaw` で OpenClaw をグローバルインストールした場合、acpx
runtime dependencies（プラットフォーム固有バイナリ）は
postinstall hook により自動インストールされます。自動インストールが失敗しても、Gateway は引き続き通常起動し、
不足依存関係を `openclaw acp doctor` 経由で報告します。

### Plugin tools MCP bridge

デフォルトでは、ACPX セッションは OpenClaw の Plugin 登録済みツールを
ACP harness に公開しません。

Codex や Claude Code のような ACP エージェントに、
memory recall/store のようなインストール済み
OpenClaw Plugin ツールを呼ばせたい場合は、専用 bridge を有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

これが行うこと:

- ACPX セッション
  bootstrap に `openclaw-plugin-tools` という組み込み MCP server を注入する
- インストール済みかつ有効な OpenClaw
  Plugin がすでに登録している Plugin ツールを公開する
- この機能を明示的かつ default-off に保つ

セキュリティと信頼に関する注記:

- これにより ACP harness のツールサーフェスが拡大します。
- ACP エージェントがアクセスできるのは、すでに Gateway でアクティブな Plugin ツールだけです。
- これは、それらの Plugin を
  OpenClaw 本体内で実行させるのと同じ信頼境界として扱ってください。
- 有効化前に、インストール済み Plugin を確認してください。

カスタム `mcpServers` は従来どおり動作します。組み込みの plugin-tools bridge は、
追加のオプトイン利便機能であり、汎用 MCP server config の置き換えではありません。

### OpenClaw tools MCP bridge

デフォルトでは、ACPX セッションは組み込み OpenClaw ツールも MCP 経由では公開しません。ACP エージェントが `cron` のような選択された組み込みツールを必要とする場合は、別の core-tools bridge を有効にしてください。

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

これが行うこと:

- ACPX セッション
  bootstrap に `openclaw-tools` という組み込み MCP server を注入する
- 選択された組み込み OpenClaw ツールを公開する。初期 server は `cron` を公開する
- core-tool の公開を明示的かつ default-off に保つ

### runtime timeout 設定

バンドル済み `acpx` Plugin は、埋め込み runtime turn のデフォルトを 120 秒
timeout にしています。これにより Gemini CLI のような低速 harness でも ACP の起動と初期化を完了できます。ホストで別の
runtime limit が必要な場合は上書きしてください。

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

この値を変更した後は Gateway を再起動してください。

### health probe agent 設定

バンドル済み `acpx` Plugin は、埋め込み runtime backend が ready かどうかを判断するときに、
1 つの harness agent を probe します。デフォルトは `codex` です。デプロイで別の default ACP agent を使う場合は、
probe agent を同じ id に設定してください。

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

この値を変更した後は Gateway を再起動してください。

## 権限設定

ACP セッションは non-interactive に実行されます — file-write や shell-exec の permission prompt を承認/拒否するための TTY はありません。acpx Plugin は、
権限をどう扱うかを制御する 2 つの config key を提供します。

これらの ACPX harness 権限は、OpenClaw exec approvals とは別であり、Claude CLI の `--permission-mode bypassPermissions` のような CLI-backend ベンダーの bypass flag とも別です。ACPX の `approve-all` は、ACP セッション用の harness-level な break-glass switch です。

### `permissionMode`

harness agent がプロンプトなしで実行できる操作を制御します。

| Value | Behavior |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | すべての file write と shell command を自動承認する。 |
| `approve-reads` | read のみ自動承認し、write と exec は prompt を要求する。 |
| `deny-all`      | すべての permission prompt を拒否する。 |

### `nonInteractivePermissions`

permission prompt が表示されるはずだが interactive TTY がない場合（ACP セッションでは常にその状態）に何が起こるかを制御します。

| Value | Behavior |
| ------ | ----------------------------------------------------------------- |
| `fail` | `AcpRuntimeError` でセッションを abort する。**（デフォルト）** |
| `deny` | permission を静かに拒否して続行する（graceful degradation）。 |

### 設定

Plugin config 経由で設定します:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後は Gateway を再起動してください。

> **重要:** OpenClaw は現在、`permissionMode=approve-reads` と `nonInteractivePermissions=fail` をデフォルトにしています。non-interactive ACP セッションでは、permission prompt をトリガーする write または exec は `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗することがあります。
>
> 権限を制限したい場合は、セッションがクラッシュする代わりに graceful に劣化するよう、`nonInteractivePermissions` を `deny` に設定してください。

## 関連

- [ACP agents](/ja-JP/tools/acp-agents) — 概要、operator runbook、概念
- [Sub-agents](/ja-JP/tools/subagents)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
