---
read_when:
    - ローカル AI CLI バックエンド Plugin を構築しています
    - acme-cli/model のようなモデル参照用のバックエンドを登録する場合
    - サードパーティ製 CLI を OpenClaw のテキストフォールバックランナーにマッピングする必要があります
sidebarTitle: CLI backend plugins
summary: ローカル AI CLI バックエンドを登録する Plugin を構築する
title: CLI バックエンド Plugin の構築
x-i18n:
    generated_at: "2026-07-11T22:25:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI バックエンド Plugin を使うと、OpenClaw はローカル AI CLI をテキスト推論
バックエンドとして呼び出せます。バックエンドはモデル参照内でプロバイダーのプレフィックスとして表示されます。

```text
acme-cli/acme-large
```

アップストリーム統合がすでにローカルコマンドとして公開されている場合、CLI がローカルのログイン状態を所有する場合、または API プロバイダーが利用できない場合のフォールバックとして、CLI バックエンドを使用します。

<Info>
  アップストリームサービスが通常の HTTP モデル API を公開している場合は、代わりに
  [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)を作成してください。アップストリーム
  ランタイムが完全なエージェントセッション、ツールイベント、Compaction、またはバックグラウンド
  タスクの状態を所有する場合は、[エージェントハーネス](/ja-JP/plugins/sdk-agent-harness)を使用してください。
</Info>

## Plugin が所有するもの

CLI バックエンド Plugin には、次の 3 つの契約があります。

| 契約                 | ファイル               | 目的                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| パッケージエントリ   | `package.json`         | OpenClaw に Plugin のランタイムモジュールを指定する       |
| マニフェストの所有権 | `openclaw.plugin.json` | ランタイムの読み込み前にバックエンド ID を宣言する        |
| ランタイム登録       | `index.ts`             | コマンドのデフォルト値を指定して `api.registerCliBackend(...)` を呼び出す |

マニフェストは検出用メタデータです。CLI を実行したり、ランタイム動作を登録したりするものではありません。ランタイム動作は、Plugin エントリが `api.registerCliBackend(...)` を呼び出した時点で開始されます。

## 最小構成のバックエンド Plugin

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

    公開するパッケージには、ビルド済みの JavaScript ランタイムファイルを含める必要があります。ソース
    エントリが `./src/index.ts` の場合は、対応するビルド済み JavaScript を指す
    `openclaw.runtimeExtensions` を追加してください。[エントリポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。

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

    `cliBackends` はランタイムの所有権リストです。これにより、設定またはモデル選択で `acme-cli/...` が指定されたときに、OpenClaw が Plugin を自動的に読み込めます。

    `setup.cliBackends` は、記述子を優先するセットアップ用サーフェスです。Plugin ランタイムを読み込まずにモデル検出、オンボーディング、またはステータスでバックエンドを認識させる必要がある場合に追加します。セットアップにこれらの静的記述子だけで十分な場合に限り、`requiresRuntime: false` を使用してください。

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

    バックエンド ID は、マニフェストの `cliBackends` エントリと一致する必要があります。登録された `config` はデフォルト値にすぎません。実行時には、`agents.defaults.cliBackends.acme-cli` 以下のユーザー設定がその上にマージされます。

  </Step>
</Steps>

## 設定の構造

`CliBackendConfig` は、OpenClaw が CLI を起動して解析する方法を記述します。

| フィールド                                                | 用途                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | バイナリ名またはコマンドの絶対パス                                                |
| `args`                                                    | 新規実行用の基本 argv                                                             |
| `resumeArgs`                                              | 再開セッション用の代替 argv。`{sessionId}` をサポート                             |
| `output` / `resumeOutput`                                 | パーサー：`json`、`jsonl`、または `text`                                          |
| `jsonlDialect`                                            | JSONL イベント方言：`claude-stream-json` または `gemini-stream-json`              |
| `liveSession`                                             | 長時間稼働する CLI プロセスモード（`claude-stdio`）                               |
| `input`                                                   | プロンプトの転送方法：`arg` または `stdin`                                        |
| `maxPromptArgChars`                                       | stdin にフォールバックするまでの `arg` モードでのプロンプト最大長                 |
| `env` / `clearEnv`                                        | 注入する追加の環境変数、または起動前に削除する環境変数名                          |
| `modelArg`                                                | モデル ID の前に使用するフラグ                                                     |
| `modelAliases`                                            | OpenClaw のモデル ID を CLI ネイティブ ID に対応付けるマップ                      |
| `sessionArg` / `sessionArgs`                              | セッション ID の渡し方                                                            |
| `sessionMode`                                             | `always`、`existing`、または `none`                                               |
| `sessionIdFields`                                         | OpenClaw が CLI 出力から読み取る JSON フィールド                                  |
| `systemPromptArg` / `systemPromptFileArg`                 | システムプロンプトの転送方法                                                      |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | システムプロンプトファイルの設定上書き用転送方法（例：`-c`）                      |
| `systemPromptMode`                                        | `append` または `replace`                                                         |
| `systemPromptWhen`                                        | `first`、`always`、または `never`                                                 |
| `imageArg` / `imageMode`                                  | 画像パス用フラグと複数画像の渡し方（`repeat` または `list`）                      |
| `imagePathScope`                                          | 引き渡し前にステージングされた画像ファイルを配置する場所：`temp` または `workspace` |
| `serialize`                                               | 同一バックエンドの実行順序を維持する                                              |
| `reseedFromRawTranscriptWhenUncompacted`                  | 安全なセッションリセットのため、Compaction 前に制限付きの生トランスクリプト再投入を有効にする |
| `reliability.outputLimits`                                | 1 回のライブ CLI ターンで保持する生の JSONL の最大文字数／行数（ライブセッションバックエンド） |
| `reliability.watchdog`                                    | 出力なしタイムアウトの調整。新規実行と再開実行で個別に設定                        |

CLI に合致する最小限の静的設定を優先してください。Plugin コールバックは、実際にバックエンドが所有すべき動作にのみ追加します。

## 高度なバックエンドフック

`CliBackendPlugin` では、次の項目も定義できます。

| フック                               | 用途                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `normalizeConfig(config, context)`   | マージ後に従来のユーザー設定を書き換える                                      |
| `resolveExecutionArgs(ctx)`          | 思考強度やサイド質問の分離など、リクエスト単位のフラグを追加する              |
| `prepareExecution(ctx)`              | 起動前に一時的な認証または設定ブリッジを作成する                              |
| `transformSystemPrompt(ctx)`         | CLI 固有の最終的なシステムプロンプト変換を適用する                            |
| `textTransforms`                     | プロンプト／出力の双方向置換                                                  |
| `defaultAuthProfileId`               | 特定の OpenClaw 認証プロファイルを優先する                                    |
| `authEpochMode`                      | 認証変更によって保存済み CLI セッションを無効化する方法を決定する             |
| `nativeToolMode`                     | ネイティブツールが存在しないか、常時有効か、ホスト側で選択可能かを宣言する    |
| `sideQuestionToolMode`               | `/btw` のサイド質問で無効にするネイティブツールを宣言する                     |
| `bundleMcp` / `bundleMcpMode`        | OpenClaw の loopback MCP ツールブリッジを有効にする                            |
| `ownsNativeCompaction`               | バックエンドが独自の Compaction を所有し、OpenClaw は処理を委ねる             |
| `runtimeArtifact`                    | スクリプトランチャーを完全な同梱パッケージツリーに制限する                    |

これらのフックはプロバイダー所有のままにしてください。バックエンドフックで動作を表現できる場合は、コアに CLI 固有の分岐を追加しないでください。

`runtimeArtifact` は Plugin が所有し、ユーザーは上書きできません。これは、ライブ推論ターンが検証済みセットアップ権限を発行または再検証するときにのみ参照されます。通常の CLI 実行では必要ありません。この宣言がないバックエンドは、検証済み CLI セットアップ権限を発行できません。`bundled-package-tree` 宣言では、正確な `package.json` の所有者を指定し、パッケージのエントリポイントがコマンドであることを要求します。OpenClaw は、ネストされた依存関係を含む、範囲が限定されたインストール済みパッケージツリー全体をハッシュ化し、リダイレクトするシンボリックリンク、宣言されたパッケージ外のランチャー、必須の外部依存関係の宣言、サイズ超過のツリー、不明なスクリプトについては安全側に倒して失敗します。この宣言は、そのツリーに完全な推論実装が含まれる場合にのみ使用してください。任意のツール統合があっても、外部実装グラフが安全になるわけではありません。

同じバックエンドが自己完結型のネイティブ実行可能ファイルも提供する場合は、その正規のベース名を `nativeExecutableNames` に列挙してください。ユーザーがバックエンドコマンドを上書きした場合でも、それ以外のネイティブコマンドは未検証のままです。

`ctx.executionMode` は通常のターンでは `"agent"`、一時的な `/btw` 呼び出しでは `"side-question"` です。BTW 用にネイティブツール、セッション永続化、再開動作を無効化する場合など、CLI に異なるワンショットフラグが必要なときに使用します。バックエンドが通常 `nativeToolMode: "always-on"` であっても、サイドクエスチョンの argv でそれらのツールを確実に無効化できる場合は、`sideQuestionToolMode: "disabled"` も設定します。それ以外の場合、BTW がツールなしの CLI 実行を必要とすると、OpenClaw はフェイルクローズします。

`nativeToolMode: "selectable"` は、`resolveExecutionArgs` が個別の実行についてバックエンドネイティブのすべてのツールを無効化できる場合にのみ設定します。このような制限付き実行では、`ctx.toolAvailability.native` は空のタプルであり、`ctx.toolAvailability.mcp` はホストによって分離された正確な MCP 許可リストです。フックは競合するツールフラグを置き換え、両方の値を強制する argv を返す必要があります。OpenClaw は最終的な新規または再開用 argv を使用してこれを一度呼び出し、バックエンドが制限を強制できない場合はフェイルクローズします。このコンテキストの MCP 名を安全に自動承認できるのは、ホストが生成される MCP 設定を事前にそれらのサーバーとツールだけに制限しているためです。

### `ownsNativeCompaction`: OpenClaw の Compaction を使用しない

バックエンドが**独自の**トランスクリプトを圧縮するエージェントを実行する場合は、`ownsNativeCompaction: true` を設定します。これにより、OpenClaw の保護用要約処理がそのセッションに対して実行されなくなり、CLI の Compaction ライフサイクルは何もせずに終了してターンが続行されます。`claude-cli` は、Claude Code がハーネスエンドポイントを使用せず内部で圧縮するため、この設定を宣言しています。一方、Codex などのネイティブハーネスセッションは、引き続きハーネスの Compaction エンドポイントへルーティングされます。

**以下の条件をすべて満たす場合にのみ宣言してください**。そうでない場合、後回しにされた予算超過セッションが予算超過のままになったり、古くなったりする可能性があります（OpenClaw はそのセッションを復旧しなくなります）。

- バックエンドがウィンドウの上限に近づいたとき、独自のトランスクリプトを確実に圧縮するか、サイズを制限する。
- 圧縮済みの状態がターンをまたいで維持されるよう、再開可能なセッションを永続化する（例: `--resume` / `--session-id`）。
- ネイティブハーネスの Compaction セッションではない。一致する `agentHarnessId` のセッションは、代わりにハーネスエンドポイントへルーティングされる。

## MCP ツールブリッジ

CLI バックエンドは、デフォルトでは OpenClaw ツールを受け取りません。CLI が MCP 設定を利用できる場合は、明示的に有効化します。

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

サポートされているブリッジモード:

| モード                   | 用途                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | MCP 設定ファイルを受け付ける CLI                                 |
| `codex-config-overrides` | argv 上の設定オーバーライドを受け付ける CLI                       |
| `gemini-system-settings` | システム設定ディレクトリから MCP 設定を読み取る CLI               |

ブリッジは、CLI が実際に利用できる場合にのみ有効化してください。CLI に無効化できない組み込みツールレイヤーがある場合は、`nativeToolMode: "always-on"` を設定し、呼び出し元がネイティブツールなしを要求したときに OpenClaw がフェイルクローズできるようにします。実行ごとにすべてのネイティブツールを無効化できる場合は、前述の `resolveExecutionArgs` コントラクトとともに `"selectable"` を使用します。

## ユーザー設定

ユーザーは任意のバックエンドのデフォルト値を上書きできます。

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
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

ユーザーが必要とする可能性が高い最小限のオーバーライドを文書化してください。通常、バイナリが `PATH` にない場合の `command` だけです。

## 検証

同梱 Plugin では、ビルダーとセットアップ登録に焦点を絞ったテストを追加し、Plugin の対象テストレーンを実行します。

```bash
pnpm test extensions/acme-cli
```

ローカルまたはインストール済みの Plugin では、検出と実際のモデル実行を1回検証します。

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

バックエンドが画像または MCP をサポートする場合は、実際の CLI でそれらの経路を実証するライブスモークテストを追加します。プロンプト、画像、MCP、またはセッション再開の動作について、静的検査だけに依存しないでください。

## チェックリスト

<Check>公開パッケージの `package.json` に `openclaw.extensions` とビルド済みランタイムエントリがある</Check>
<Check>`openclaw.plugin.json` で `cliBackends` と意図的な `activation.onStartup` が宣言されている</Check>
<Check>セットアップやモデル検出がコールド状態のバックエンドを認識する必要がある場合、`setup.cliBackends` が存在する</Check>
<Check>`api.registerCliBackend(...)` がマニフェストと同じバックエンド ID を使用している</Check>
<Check>`agents.defaults.cliBackends.<id>` 配下のユーザーオーバーライドが引き続き優先される</Check>
<Check>セッション、システムプロンプト、画像、出力パーサーの設定が実際の CLI コントラクトと一致している</Check>
<Check>対象テストと少なくとも1回のライブ CLI スモークテストでバックエンド経路が実証されている</Check>

## 関連項目

- [CLI バックエンド](/ja-JP/gateway/cli-backends) - ユーザー設定とランタイム動作
- [Plugin の構築](/ja-JP/plugins/building-plugins) - パッケージとマニフェストの基本
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview) - 登録 API リファレンス
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - `cliBackends` とセットアップ記述子
- [エージェントハーネス](/ja-JP/plugins/sdk-agent-harness) - 完全な外部エージェントランタイム
