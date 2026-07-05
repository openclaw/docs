---
read_when:
    - ローカル AI CLI バックエンド Plugin を構築しています
    - acme-cli/model などのモデル参照用にバックエンドを登録したい場合
    - サードパーティ CLI を OpenClaw のテキストフォールバックランナーにマッピングする必要があります
sidebarTitle: CLI backend plugins
summary: ローカル AI CLI バックエンドを登録する Plugin を構築する
title: CLI バックエンド Plugin の構築
x-i18n:
    generated_at: "2026-07-05T11:35:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97540f49e64df176c5bbfa596ba40acbf6418ad97ee55a5a79e257db68e49c7b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI バックエンド Plugin は、OpenClaw がローカル AI CLI をテキスト推論
バックエンドとして呼び出せるようにします。バックエンドはモデル参照内のプロバイダープレフィックスとして表示されます。

```text
acme-cli/acme-large
```

上流統合がすでにローカルコマンドとして公開されている場合、CLI がローカルのログイン状態を所有している場合、または API
プロバイダーが利用できない場合のフォールバックとして、CLI バックエンドを使用します。

<Info>
  上流サービスが通常の HTTP モデル API を公開している場合は、代わりに
  [provider Plugin](/ja-JP/plugins/sdk-provider-plugins) を作成してください。上流
  ランタイムが完全なエージェントセッション、ツールイベント、Compaction、またはバックグラウンド
  タスク状態を所有している場合は、[agent harness](/ja-JP/plugins/sdk-agent-harness) を使用します。
</Info>

## Plugin が所有するもの

CLI バックエンド Plugin には 3 つの契約があります。

| 契約                 | ファイル               | 目的                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| パッケージエントリ   | `package.json`         | OpenClaw に Plugin ランタイムモジュールを指し示す         |
| マニフェスト所有権   | `openclaw.plugin.json` | ランタイムがロードされる前にバックエンド ID を宣言する    |
| ランタイム登録       | `index.ts`             | コマンドのデフォルトを指定して `api.registerCliBackend(...)` を呼び出す |

マニフェストは検出メタデータです。CLI を実行したり、ランタイム動作を登録したりはしません。ランタイム動作は、Plugin エントリが
`api.registerCliBackend(...)` を呼び出したときに開始されます。

## 最小バックエンド Plugin

<Steps>
  <Step title="パッケージメタデータを作成する">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    公開パッケージには、ビルド済みの JavaScript ランタイムファイルを含める必要があります。ソース
    エントリが `./src/index.ts` の場合は、ビルド済み JavaScript ピアを指す
    `openclaw.runtimeExtensions` を追加してください。[Entry points](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="バックエンド所有権を宣言する">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` はランタイム所有権リストです。設定またはモデル選択で `acme-cli/...` が指定されたときに、OpenClaw が
    Plugin を自動ロードできるようにします。

    `setup.cliBackends` は descriptor-first のセットアップサーフェスです。モデル検出、オンボーディング、またはステータスが、Plugin ランタイムをロードせずにバックエンドを認識すべき場合に追加します。
    セットアップに静的 descriptor だけで十分な場合にのみ、`requiresRuntime: false` を使用します。

  </Step>

  <Step title="バックエンドを登録する">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    バックエンド ID は、マニフェストの `cliBackends` エントリと一致している必要があります。登録された
    `config` はデフォルトにすぎません。`agents.defaults.cliBackends.acme-cli` 配下のユーザー設定が、ランタイムでこれにマージされます。

  </Step>
</Steps>

## 設定の形状

`CliBackendConfig` は、OpenClaw が CLI をどのように起動し、解析すべきかを記述します。

| フィールド                                                | 用途                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | バイナリ名または絶対コマンドパス                                                  |
| `args`                                                    | 新規実行の基本 argv                                                               |
| `resumeArgs`                                              | 再開セッション用の代替 argv。`{sessionId}` をサポート                             |
| `output` / `resumeOutput`                                 | パーサー: `json`、`jsonl`、または `text`                                          |
| `jsonlDialect`                                            | JSONL イベント方言: `claude-stream-json` または `gemini-stream-json`              |
| `liveSession`                                             | 長寿命 CLI プロセスモード (`claude-stdio`)                                        |
| `input`                                                   | プロンプト転送: `arg` または `stdin`                                              |
| `maxPromptArgChars`                                       | stdin にフォールバックする前の、`arg` モードでの最大プロンプト長                  |
| `env` / `clearEnv`                                        | 注入する追加 env vars、または起動前に除去する名前                                 |
| `modelArg`                                                | モデル ID の前に使用されるフラグ                                                  |
| `modelAliases`                                            | OpenClaw モデル ID を CLI ネイティブ ID にマップする                              |
| `sessionArg` / `sessionArgs`                              | セッション ID の渡し方                                                            |
| `sessionMode`                                             | `always`、`existing`、または `none`                                               |
| `sessionIdFields`                                         | OpenClaw が CLI 出力から読み取る JSON フィールド                                  |
| `systemPromptArg` / `systemPromptFileArg`                 | システムプロンプト転送                                                            |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | システムプロンプトファイル向けの設定上書き転送（例: `-c`）                        |
| `systemPromptMode`                                        | `append` または `replace`                                                         |
| `systemPromptWhen`                                        | `first`、`always`、または `never`                                                 |
| `imageArg` / `imageMode`                                  | 画像パスフラグと複数画像の渡し方（`repeat` または `list`）                        |
| `imagePathScope`                                          | ハンドオフ前にステージングされた画像ファイルが存在する場所: `temp` または `workspace` |
| `serialize`                                               | 同じバックエンドの実行順序を維持する                                              |
| `reseedFromRawTranscriptWhenUncompacted`                  | 安全なセッションリセットのため、Compaction 前に境界付きの raw-transcript reseed を有効にする |
| `reliability.outputLimits`                                | 1 回のライブ CLI ターンで保持される最大 raw JSONL 文字数/行数（live-session バックエンド） |
| `reliability.watchdog`                                    | 出力なしタイムアウトの調整。新規実行と再開実行で分離                              |

CLI に一致する最小の静的設定を優先してください。Plugin コールバックは、そのバックエンドに本当に属する動作にのみ追加します。

## 高度なバックエンドフック

`CliBackendPlugin` では、次も定義できます。

| フック                             | 用途                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | マージ後にレガシーユーザー設定を書き換える                                  |
| `resolveExecutionArgs(ctx)`        | thinking effort や side-question 分離など、リクエストスコープのフラグを追加する |
| `prepareExecution(ctx)`            | 起動前に一時的な認証または設定ブリッジを作成する                            |
| `transformSystemPrompt(ctx)`       | 最終的な CLI 固有のシステムプロンプト変換を適用する                          |
| `textTransforms`                   | 双方向のプロンプト/出力置換                                                  |
| `defaultAuthProfileId`             | 特定の OpenClaw 認証プロファイルを優先する                                   |
| `authEpochMode`                    | 認証変更が保存済み CLI セッションをどのように無効化するかを決める            |
| `nativeToolMode`                   | CLI に常時有効なネイティブツールがあるかどうかを宣言する                     |
| `sideQuestionToolMode`             | `/btw` side questions 用に無効化されたネイティブツールを宣言する             |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw の loopback MCP ツールブリッジを有効にする                          |
| `ownsNativeCompaction`             | バックエンドが自身の Compaction を所有する - OpenClaw は委譲する             |

これらのフックはプロバイダー所有にしてください。バックエンドフックで動作を表現できる場合は、core に CLI 固有の分岐を追加しないでください。

`ctx.executionMode` は、通常のターンでは `"agent"`、一時的な `/btw` 呼び出しでは
`"side-question"` です。CLI が、BTW 用にネイティブツール、セッション永続化、または再開動作を無効にするなど、異なる one-shot フラグを必要とする場合に使用します。
バックエンドが通常 `nativeToolMode: "always-on"` を持つものの、その
side-question argv がそれらのツールを確実に無効化する場合は、
`sideQuestionToolMode: "disabled"` も設定してください。そうでない場合、BTW がツールなしの CLI 実行を必要とするとき、OpenClaw は fail closed します。

### `ownsNativeCompaction`: OpenClaw Compaction をオプトアウトする

バックエンドが **自身の** transcript を Compaction するエージェントを実行する場合は、
`ownsNativeCompaction: true` を設定してください。これにより、OpenClaw のセーフガード summarizer はそのセッションに対して実行されません。CLI Compaction ライフサイクルは no-op を返し、ターンは続行されます。
`claude-cli` がこれを宣言しているのは、Claude Code がハーネスエンドポイントなしで内部的に Compaction するためです。
Codex などの native-harness セッションは、代わりにハーネス Compaction エンドポイントへのルーティングを維持します。

**次のすべてを満たす場合にのみ宣言してください**。そうでない場合、委譲された
予算超過セッションが予算超過のままになったり、古くなったりする可能性があります（OpenClaw はもう救済しません）。

- バックエンドは自身のウィンドウに近づくと、自身のトランスクリプトを確実にcompactするか境界内に収める。
- compactされた状態がターンを越えて残るように、再開可能なセッションを永続化する
  (たとえば `--resume` / `--session-id`)。
- ネイティブハーネスのcompactionセッションではない。`agentHarnessId`
  に一致するセッションは、代わりにハーネスエンドポイントへルーティングされる。

## MCPツールブリッジ

CLIバックエンドはデフォルトではOpenClawツールを受け取りません。CLIがMCP設定を利用できる場合は、明示的にオプトインしてください。

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

サポートされるブリッジモード:

| モード                   | 用途                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | MCP設定ファイルを受け付けるCLI                                  |
| `codex-config-overrides` | argv上の設定オーバーライドを受け付けるCLI                       |
| `gemini-system-settings` | システム設定ディレクトリからMCP設定を読み取るCLI                |

CLIが実際に利用できる場合にのみブリッジを有効にしてください。CLIに無効化できない独自の組み込みツールレイヤーがある場合は、呼び出し元がネイティブツールなしを要求したときにOpenClawがfail closedできるように、`nativeToolMode:
"always-on"` を設定してください。

## ユーザー設定

ユーザーは任意のバックエンドデフォルトをオーバーライドできます。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

ユーザーが必要とする可能性が高い最小限のオーバーライドを文書化してください。通常、バイナリが`PATH`の外にある場合の`command`だけです。

## 検証

バンドル済みPluginでは、ビルダーとセットアップ登録の周辺に絞ったテストを追加し、そのPluginの対象テストレーンを実行します。

```bash
pnpm test extensions/acme-cli
```

ローカルまたはインストール済みPluginでは、検出と実際のモデル実行を1回検証します。

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

バックエンドが画像またはMCPをサポートする場合は、実際のCLIでそれらの経路を証明するライブスモークを追加してください。プロンプト、画像、MCP、またはセッション再開の動作について、静的検査に依存しないでください。

## チェックリスト

<Check>`package.json`に、公開パッケージ向けの`openclaw.extensions`とビルド済みランタイムエントリがある</Check>
<Check>`openclaw.plugin.json`が`cliBackends`と意図的な`activation.onStartup`を宣言している</Check>
<Check>セットアップ/モデル検出がコールド状態でバックエンドを見る必要がある場合、`setup.cliBackends`が存在する</Check>
<Check>`api.registerCliBackend(...)`がマニフェストと同じバックエンドIDを使用している</Check>
<Check>`agents.defaults.cliBackends.<id>`配下のユーザーオーバーライドが引き続き優先される</Check>
<Check>セッション、システムプロンプト、画像、出力パーサーの設定が実際のCLI契約と一致する</Check>
<Check>対象テストと少なくとも1回のライブCLIスモークでバックエンド経路を証明している</Check>

## 関連

- [CLIバックエンド](/ja-JP/gateway/cli-backends) - ユーザー設定とランタイム動作
- [Pluginの構築](/ja-JP/plugins/building-plugins) - パッケージとマニフェストの基本
- [Plugin SDK概要](/ja-JP/plugins/sdk-overview) - 登録APIリファレンス
- [Pluginマニフェスト](/ja-JP/plugins/manifest) - `cliBackends`とセットアップ記述子
- [エージェントハーネス](/ja-JP/plugins/sdk-agent-harness) - 完全な外部エージェントランタイム
