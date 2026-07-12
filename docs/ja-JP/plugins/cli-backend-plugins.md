---
read_when:
    - ローカル AI CLI バックエンド Plugin を構築する
    - acme-cli/model のようなモデル参照用のバックエンドを登録する場合
    - サードパーティ製 CLI を OpenClaw のテキストフォールバックランナーにマッピングする必要があります
sidebarTitle: CLI backend plugins
summary: ローカル AI CLI バックエンドを登録する Plugin を構築する
title: CLI バックエンド Plugin の構築
x-i18n:
    generated_at: "2026-07-12T14:39:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI バックエンド Plugin を使用すると、OpenClaw はローカルの AI CLI をテキスト推論バックエンドとして呼び出せます。バックエンドは、モデル参照内でプロバイダープレフィックスとして表示されます。

```text
acme-cli/acme-large
```

上流の統合がすでにローカルコマンドとして公開されている場合、CLI がローカルのログイン状態を管理する場合、または API プロバイダーが利用できないときのフォールバックとして、CLI バックエンドを使用します。

<Info>
  上流サービスが通常の HTTP モデル API を公開している場合は、代わりに
  [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) を作成してください。上流ランタイムが完全なエージェントセッション、ツールイベント、Compaction、またはバックグラウンドタスクの状態を管理する場合は、[エージェントハーネス](/ja-JP/plugins/sdk-agent-harness) を使用してください。
</Info>

## Plugin が管理するもの

CLI バックエンド Plugin には 3 つのコントラクトがあります。

| コントラクト         | ファイル               | 目的                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| パッケージエントリ   | `package.json`         | OpenClaw に Plugin ランタイムモジュールを示す             |
| マニフェスト所有権   | `openclaw.plugin.json` | ランタイムの読み込み前にバックエンド ID を宣言する        |
| ランタイム登録       | `index.ts`             | コマンドのデフォルト値を指定して `api.registerCliBackend(...)` を呼び出す |

マニフェストは検出用のメタデータです。CLI を実行したり、ランタイム動作を登録したりするものではありません。ランタイム動作は、Plugin エントリが `api.registerCliBackend(...)` を呼び出した時点で開始します。

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

    公開するパッケージには、ビルド済みの JavaScript ランタイムファイルを含める必要があります。ソースエントリが `./src/index.ts` の場合は、対応するビルド済み JavaScript を指す `openclaw.runtimeExtensions` を追加してください。[エントリポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="バックエンドの所有権を宣言する">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "OpenClaw を介して Acme のローカル AI CLI を実行する",
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

    `cliBackends` はランタイム所有権のリストです。設定またはモデル選択で `acme-cli/...` が指定されたときに、OpenClaw が Plugin を自動読み込みできるようにします。

    `setup.cliBackends` は、ディスクリプターを優先するセットアップサーフェスです。Plugin ランタイムを読み込まずに、モデル検出、オンボーディング、またはステータスでバックエンドを認識させる必要がある場合に追加します。セットアップに静的ディスクリプターだけで十分な場合に限り、`requiresRuntime: false` を使用してください。

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

    バックエンド ID は、マニフェストの `cliBackends` エントリと一致する必要があります。登録された `config` はデフォルト値にすぎません。`agents.defaults.cliBackends.acme-cli` 配下のユーザー設定が、ランタイムでその上にマージされます。

  </Step>
</Steps>

## 設定の構造

`CliBackendConfig` は、OpenClaw が CLI を起動して解析する方法を記述します。

| フィールド                                                | 用途                                                                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | バイナリ名またはコマンドの絶対パス                                                |
| `args`                                                    | 新規実行用の基本 argv                                                             |
| `resumeArgs`                                              | 再開セッション用の代替 argv。`{sessionId}` をサポート                             |
| `output` / `resumeOutput`                                 | パーサー: `json`、`jsonl`、または `text`                                          |
| `jsonlDialect`                                            | JSONL イベント方言: `claude-stream-json` または `gemini-stream-json`              |
| `liveSession`                                             | 長時間存続する CLI プロセスモード（`claude-stdio`）                               |
| `input`                                                   | プロンプトの転送方法: `arg` または `stdin`                                        |
| `maxPromptArgChars`                                       | `arg` モードで stdin にフォールバックするまでの最大プロンプト長                   |
| `env` / `clearEnv`                                        | 注入する追加環境変数、または起動前に削除する環境変数名                            |
| `modelArg`                                                | モデル ID の前に使用するフラグ                                                     |
| `modelAliases`                                            | OpenClaw のモデル ID を CLI ネイティブ ID に対応付けるマップ                      |
| `sessionArg` / `sessionArgs`                              | セッション ID の渡し方                                                            |
| `sessionMode`                                             | `always`、`existing`、または `none`                                               |
| `sessionIdFields`                                         | OpenClaw が CLI 出力から読み取る JSON フィールド                                  |
| `systemPromptArg` / `systemPromptFileArg`                 | システムプロンプトの転送方法                                                      |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | システムプロンプトファイル用の設定オーバーライド転送方法（例: `-c`）              |
| `systemPromptMode`                                        | `append` または `replace`                                                         |
| `systemPromptWhen`                                        | `first`、`always`、または `never`                                                 |
| `imageArg` / `imageMode`                                  | 画像パスのフラグと複数画像の渡し方（`repeat` または `list`）                      |
| `imagePathScope`                                          | 引き渡し前にステージングされた画像ファイルを配置する場所: `temp` または `workspace` |
| `serialize`                                               | 同じバックエンドの実行順序を維持する                                              |
| `reseedFromRawTranscriptWhenUncompacted`                  | 安全なセッションリセットのため、Compaction 前に制限付きの生トランスクリプト再投入を有効にする |
| `reliability.outputLimits`                                | 1 回のライブ CLI ターンで保持する生 JSONL の最大文字数/行数（ライブセッションバックエンド） |
| `reliability.watchdog`                                    | 無出力タイムアウトの調整。新規実行と再開実行で個別に設定                          |

CLI に合致する最小限の静的設定を推奨します。Plugin のコールバックは、実際にバックエンドが担うべき動作にのみ追加してください。

## 高度なバックエンドフック

`CliBackendPlugin` では、次の項目も定義できます。

| フック                             | 用途                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | マージ後に古いユーザー設定を書き換える                                      |
| `resolveExecutionArgs(ctx)`        | 思考の強度や補足質問の分離など、リクエストスコープのフラグを追加する         |
| `prepareExecution(ctx)`            | 起動前に一時的な認証または設定のブリッジを作成する                           |
| `transformSystemPrompt(ctx)`       | CLI 固有の最終的なシステムプロンプト変換を適用する                           |
| `textTransforms`                   | プロンプトと出力の双方向置換                                                |
| `defaultAuthProfileId`             | 特定の OpenClaw 認証プロファイルを優先する                                   |
| `authEpochMode`                    | 認証の変更によって保存済み CLI セッションを無効化する方法を決定する          |
| `nativeToolMode`                   | ネイティブツールが存在しないか、常時有効か、ホスト側で選択可能かを宣言する   |
| `sideQuestionToolMode`             | `/btw` の補足質問で無効化するネイティブツールを宣言する                      |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw のループバック MCP ツールブリッジを有効にする                       |
| `ownsNativeCompaction`             | バックエンドが独自の Compaction を管理し、OpenClaw は処理を委ねる            |
| `runtimeArtifact`                  | スクリプトランチャーを完全なバンドル済みパッケージツリーに拘束する           |

これらのフックはプロバイダー側で管理してください。バックエンドフックで動作を表現できる場合は、コアに CLI 固有の分岐を追加しないでください。

`runtimeArtifact` は Plugin が管理し、ユーザーはオーバーライドできません。ライブ推論ターンが検証済みセットアップ権限を発行または再検証するときにのみ参照されます。通常の CLI 実行では必要ありません。この宣言がないバックエンドは、検証済み CLI セットアップ権限を発行できません。`bundled-package-tree` 宣言では、正確な `package.json` の所有者を指定し、パッケージのエントリポイントがコマンドであることが求められます。OpenClaw は、ネストされた依存関係を含む、範囲が限定されたインストール済みパッケージツリー全体をハッシュ化します。また、リダイレクトするシンボリックリンク、宣言されたパッケージ外のランチャー、必須の外部依存関係宣言、サイズ超過のツリー、不明なスクリプトがある場合は、フェイルクローズします。このツリーに完全な推論実装が含まれる場合にのみ宣言してください。オプションのツール統合があっても、外部実装グラフが安全になるわけではありません。

同じバックエンドが自己完結型のネイティブ実行ファイルも提供する場合は、その正規ベース名を `nativeExecutableNames` に列挙してください。ユーザーがバックエンドコマンドをオーバーライドした場合でも、その他のネイティブコマンドは未検証のままです。

`ctx.executionMode` は、通常のターンでは `"agent"`、一時的な `/btw` 呼び出しでは
`"side-question"` です。CLI で、ネイティブツール、セッションの永続化、再開動作を
BTW 用に無効化する場合など、異なるワンショットフラグが必要なときに使用します。
バックエンドが通常 `nativeToolMode: "always-on"` であっても、その side-question argv によって
それらのツールが確実に無効化される場合は、`sideQuestionToolMode: "disabled"` も設定します。
それ以外の場合、BTW でツールなしの CLI 実行が必要になると、OpenClaw は安全側に倒して失敗します。

`nativeToolMode: "selectable"` は、`resolveExecutionArgs` が個別の実行に対して
バックエンド固有のすべてのツールを無効化できる場合にのみ設定します。このような制限付き実行では、
`ctx.toolAvailability.native` は空のタプルになり、
`ctx.toolAvailability.mcp` はホストによって分離された正確な MCP 許可リストになります。フックは、
競合するツールフラグを置き換え、両方の値を強制する argv を返す必要があります。
OpenClaw は、最終的な新規または再開用 argv を指定してこのフックを 1 回呼び出し、
バックエンドが制限を強制できない場合は安全側に倒して失敗します。このコンテキストの MCP 名を
安全に自動承認できるのは、ホストが生成される MCP 設定を、それらのサーバーとツールだけに
すでに制限しているためです。

### `ownsNativeCompaction`：OpenClaw の Compaction をオプトアウトする

バックエンドで、**自身の**トランスクリプトを圧縮するエージェントを実行する場合は、
`ownsNativeCompaction: true` を設定します。これにより、OpenClaw の保護用要約処理が
そのセッションに対して実行されなくなります。CLI の Compaction ライフサイクルは何も行わずに戻り、
ターンは続行されます。`claude-cli` がこれを宣言しているのは、Claude Code がハーネスの
エンドポイントを使用せずに内部で圧縮するためです。一方、Codex などのネイティブハーネス
セッションは、引き続きハーネスの Compaction エンドポイントへルーティングされます。

**次のすべての条件を満たす場合にのみ宣言してください**。そうしないと、遅延された
予算超過セッションが予算超過のまま残るか、古くなる可能性があります
（OpenClaw はそのセッションを救済しなくなります）。

- バックエンドは、ウィンドウの上限に近づくと、自身のトランスクリプトを確実に圧縮するか、
  サイズを制限する。
- 圧縮された状態をターン間で維持できるよう、再開可能なセッションを永続化する
  （例：`--resume` / `--session-id`）。
- ネイティブハーネスの Compaction セッションではない。`agentHarnessId` が一致する
  セッションは、代わりにハーネスのエンドポイントへルーティングされる。

## MCP ツールブリッジ

CLI バックエンドは、デフォルトでは OpenClaw ツールを受け取りません。CLI が
MCP 設定を利用できる場合は、明示的にオプトインしてください。

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

サポートされているブリッジモード：

| モード                   | 用途                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| `claude-config-file`     | MCP 設定ファイルを受け付ける CLI                                    |
| `codex-config-overrides` | argv で設定のオーバーライドを受け付ける CLI                          |
| `gemini-system-settings` | システム設定ディレクトリから MCP 設定を読み取る CLI                  |

CLI が実際にブリッジを利用できる場合にのみ有効にしてください。CLI に無効化できない
独自の組み込みツールレイヤーがある場合は、`nativeToolMode:
"always-on"` を設定し、呼び出し元がネイティブツールを使用しないことを要求した際に
OpenClaw がフェイルクローズできるようにします。実行ごとにすべてのネイティブツールを
無効化できる場合は、前述の `resolveExecutionArgs` コントラクトとともに
`"selectable"` を使用してください。

## ユーザー設定

ユーザーは任意のバックエンドのデフォルト設定を上書きできます。

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

ユーザーが必要とする可能性が高い最小限の上書き方法を記載してください。通常は、バイナリが `PATH` の外にある場合の
`command` だけです。

## 検証

バンドルされた Plugin では、ビルダーとセットアップ登録に焦点を当てたテストを追加し、
その Plugin を対象とするテストレーンを実行します。

```bash
pnpm test extensions/acme-cli
```

ローカルまたはインストール済みの Plugin では、検出と実際のモデル実行を1回検証します。

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "正確に次のように応答してください: backend ok" --model acme-cli/acme-large
```

バックエンドが画像または MCP をサポートする場合は、実際の CLI を使用してそれらの
パスを実証するライブスモークテストを追加します。プロンプト、画像、
MCP、またはセッション再開の動作について、静的検査のみに依存しないでください。

## チェックリスト

<Check>公開パッケージの場合、`package.json` に `openclaw.extensions` とビルド済みランタイムエントリがある</Check>
<Check>`openclaw.plugin.json` で `cliBackends` と意図した `activation.onStartup` が宣言されている</Check>
<Check>セットアップまたはモデル検出でコールド状態のバックエンドを認識する必要がある場合、`setup.cliBackends` が存在する</Check>
<Check>`api.registerCliBackend(...)` でマニフェストと同じバックエンド ID が使用されている</Check>
<Check>`agents.defaults.cliBackends.<id>` のユーザー上書きが引き続き優先される</Check>
<Check>セッション、システムプロンプト、画像、出力パーサーの設定が実際の CLI 契約と一致する</Check>
<Check>対象テストと少なくとも1回のライブ CLI スモークテストによってバックエンドのパスが実証されている</Check>

## 関連項目

- [CLI バックエンド](/ja-JP/gateway/cli-backends) - ユーザー設定とランタイム動作
- [Plugin の構築](/ja-JP/plugins/building-plugins) - パッケージとマニフェストの基本
- [Plugin SDK の概要](/ja-JP/plugins/sdk-overview) - 登録 API リファレンス
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - `cliBackends` とセットアップ記述子
- [エージェントハーネス](/ja-JP/plugins/sdk-agent-harness) - 完全な外部エージェントランタイム
