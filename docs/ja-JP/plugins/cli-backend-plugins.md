---
read_when:
    - ローカル AI CLI バックエンド Plugin を構築しています
    - acme-cli/model などのモデル参照用にバックエンドを登録したい場合
    - サードパーティ CLI を OpenClaw のテキストフォールバックランナーにマッピングする必要があります
sidebarTitle: CLI backend plugins
summary: ローカル AI CLI バックエンドを登録する Plugin を構築する
title: CLI バックエンド Plugin の構築
x-i18n:
    generated_at: "2026-05-07T13:22:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI バックエンド Plugin により、OpenClaw はローカルの AI CLI をテキスト推論バックエンドとして呼び出せます。バックエンドはモデル参照内のプロバイダープレフィックスとして表示されます。

```text
acme-cli/acme-large
```

上流統合がすでにローカルコマンドとして公開されている場合、CLI がローカルのログイン状態を所有している場合、または API プロバイダーが利用できないときの有用なフォールバックとして CLI を使える場合は、CLI バックエンドを使用します。

<Info>
  上流サービスが通常の HTTP モデル API を公開している場合は、代わりに
  [provider plugin](/ja-JP/plugins/sdk-provider-plugins) を作成してください。上流ランタイムが完全なエージェントセッション、ツールイベント、Compaction、またはバックグラウンドタスクの状態を所有している場合は、[agent harness](/ja-JP/plugins/sdk-agent-harness) を使用してください。
</Info>

## Plugin が所有するもの

CLI バックエンド Plugin には 3 つの契約があります。

| 契約                 | ファイル               | 目的                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| パッケージエントリ   | `package.json`         | OpenClaw に Plugin ランタイムモジュールを示す             |
| マニフェスト所有権   | `openclaw.plugin.json` | ランタイム読み込み前にバックエンド ID を宣言する          |
| ランタイム登録       | `index.ts`             | コマンドのデフォルトで `api.registerCliBackend(...)` を呼び出す |

マニフェストは検出メタデータです。CLI を実行せず、ランタイム動作も登録しません。ランタイム動作は、Plugin エントリが `api.registerCliBackend(...)` を呼び出したときに開始します。

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

    公開パッケージには、ビルド済みの JavaScript ランタイムファイルを含める必要があります。ソースエントリが `./src/index.ts` の場合は、ビルド済み JavaScript の対応ファイルを指す `openclaw.runtimeExtensions` を追加してください。[Entry points](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="バックエンドの所有権を宣言する">
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

    `cliBackends` はランタイム所有権リストです。設定やモデル選択で `acme-cli/...` が指定されたときに、OpenClaw が Plugin を自動読み込みできるようにします。

    `setup.cliBackends` は記述子優先のセットアップサーフェスです。モデル検出、オンボーディング、またはステータスが Plugin ランタイムを読み込まずにバックエンドを認識するべき場合に追加してください。セットアップに静的記述子だけで十分な場合にのみ `requiresRuntime: false` を使用します。

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

    バックエンド ID はマニフェストの `cliBackends` エントリと一致している必要があります。登録された `config` はデフォルトにすぎません。実行時には `agents.defaults.cliBackends.acme-cli` 配下のユーザー設定がその上にマージされます。

  </Step>
</Steps>

## 設定の形

`CliBackendConfig` は、OpenClaw が CLI をどのように起動し解析するべきかを記述します。

| フィールド                                | 用途                                                        |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | バイナリ名または絶対コマンドパス                            |
| `args`                                    | 新規実行用の基本 argv                                      |
| `resumeArgs`                              | 再開セッション用の代替 argv。`{sessionId}` をサポート       |
| `output` / `resumeOutput`                 | パーサー: `json`、`jsonl`、または `text`                    |
| `input`                                   | プロンプト転送: `arg` または `stdin`                        |
| `modelArg`                                | モデル ID の前に使用するフラグ                              |
| `modelAliases`                            | OpenClaw のモデル ID を CLI ネイティブ ID にマップする       |
| `sessionArg` / `sessionArgs`              | セッション ID の渡し方                                      |
| `sessionMode`                             | `always`、`existing`、または `none`                         |
| `sessionIdFields`                         | OpenClaw が CLI 出力から読み取る JSON フィールド            |
| `systemPromptArg` / `systemPromptFileArg` | システムプロンプト転送                                      |
| `systemPromptWhen`                        | `first`、`always`、または `never`                           |
| `imageArg` / `imageMode`                  | 画像パスのサポート                                          |
| `serialize`                               | 同一バックエンドの実行順序を維持する                        |
| `reliability.watchdog`                    | 出力なしタイムアウトの調整                                  |

CLI に一致する最小限の静的設定を優先してください。Plugin コールバックは、バックエンドが本当に所有するべき動作にのみ追加します。

## 高度なバックエンドフック

`CliBackendPlugin` では次も定義できます。

| フック                             | 用途                                                   |
| ---------------------------------- | ------------------------------------------------------ |
| `normalizeConfig(config, context)` | マージ後にレガシーユーザー設定を書き換える             |
| `resolveExecutionArgs(ctx)`        | 思考の深さなど、リクエストスコープのフラグを追加する   |
| `prepareExecution(ctx)`            | 起動前に一時的な認証または設定ブリッジを作成する       |
| `transformSystemPrompt(ctx)`       | 最終的な CLI 固有のシステムプロンプト変換を適用する    |
| `textTransforms`                   | 双方向のプロンプト/出力置換                            |
| `defaultAuthProfileId`             | 特定の OpenClaw 認証プロファイルを優先する              |
| `authEpochMode`                    | 認証変更が保存済み CLI セッションを無効化する方法を決める |
| `nativeToolMode`                   | CLI に常時有効のネイティブツールがあるかを宣言する      |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw の loopback MCP ツールブリッジにオプトインする |

これらのフックはプロバイダー所有のままにしてください。バックエンドフックで表現できる動作について、CLI 固有の分岐をコアに追加しないでください。

## MCP ツールブリッジ

CLI バックエンドはデフォルトでは OpenClaw ツールを受け取りません。CLI が MCP 設定を利用できる場合は、明示的にオプトインします。

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

サポートされているブリッジモードは次のとおりです。

| モード                   | 用途                                                           |
| ------------------------ | -------------------------------------------------------------- |
| `claude-config-file`     | MCP 設定ファイルを受け取る CLI                                 |
| `codex-config-overrides` | argv 上で設定オーバーライドを受け取る CLI                      |
| `gemini-system-settings` | システム設定ディレクトリから MCP 設定を読み取る CLI            |

CLI が実際に利用できる場合にのみブリッジを有効にしてください。CLI に無効化できない組み込みツールレイヤーがある場合は、`nativeToolMode:
"always-on"` を設定し、呼び出し元がネイティブツールなしを要求したときに OpenClaw がクローズドに失敗できるようにします。

## ユーザー設定

ユーザーは任意のバックエンドデフォルトを上書きできます。

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

ユーザーが必要としそうな最小限の上書きを文書化してください。通常は、バイナリが `PATH` の外にある場合の `command` だけです。

## 検証

バンドル済み Plugin では、ビルダーとセットアップ登録に焦点を当てたテストを追加し、その Plugin の対象テストレーンを実行します。

```bash
pnpm test extensions/acme-cli
```

ローカルまたはインストール済み Plugin では、検出と実際のモデル実行を 1 回検証します。

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

バックエンドが画像または MCP をサポートしている場合は、実際の CLI でそれらのパスを証明するライブスモークを追加してください。プロンプト、画像、MCP、またはセッション再開の動作について、静的検査に依存しないでください。

## チェックリスト

<Check>`package.json` に `openclaw.extensions` があり、公開パッケージ用のビルド済みランタイムエントリがある</Check>
<Check>`openclaw.plugin.json` が `cliBackends` と意図した `activation.onStartup` を宣言している</Check>
<Check>セットアップ/モデル検出がバックエンドをコールド状態で見るべき場合、`setup.cliBackends` が存在する</Check>
<Check>`api.registerCliBackend(...)` がマニフェストと同じバックエンド ID を使用している</Check>
<Check>`agents.defaults.cliBackends.<id>` 配下のユーザー上書きが引き続き優先される</Check>
<Check>セッション、システムプロンプト、画像、出力パーサーの設定が実際の CLI 契約と一致している</Check>
<Check>対象テストと少なくとも 1 つのライブ CLI スモークがバックエンドパスを証明している</Check>

## 関連

- [CLI backends](/ja-JP/gateway/cli-backends) - ユーザー設定とランタイム動作
- [Building plugins](/ja-JP/plugins/building-plugins) - パッケージとマニフェストの基本
- [Plugin SDK overview](/ja-JP/plugins/sdk-overview) - 登録 API リファレンス
- [Plugin manifest](/ja-JP/plugins/manifest) - `cliBackends` とセットアップ記述子
- [Agent harness](/ja-JP/plugins/sdk-agent-harness) - 完全な外部エージェントランタイム
