---
read_when:
    - ローカル AI CLI バックエンド Plugin を構築しています
    - acme-cli/model のようなモデル参照用のバックエンドを登録したい場合
    - サードパーティ製 CLI を OpenClaw のテキストフォールバックランナーにマッピングする必要があります
sidebarTitle: CLI backend plugins
summary: ローカル AI CLI バックエンドを登録する Plugin を構築する
title: CLI バックエンド Plugin の構築
x-i18n:
    generated_at: "2026-06-27T12:10:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI バックエンド Plugin により、OpenClaw はローカル AI CLI をテキスト推論バックエンドとして呼び出せます。バックエンドはモデル参照内でプロバイダープレフィックスとして表示されます。

```text
acme-cli/acme-large
```

上流の統合がすでにローカルコマンドとして公開されている場合、CLI がローカルログイン状態を所有している場合、または API プロバイダーが利用できないときの有用なフォールバックとして CLI を使える場合は、CLI バックエンドを使用します。

<Info>
  上流サービスが通常の HTTP モデル API を公開している場合は、代わりに
  [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) を作成してください。上流ランタイムが完全なエージェントセッション、ツールイベント、Compaction、またはバックグラウンドタスク状態を所有している場合は、[エージェントハーネス](/ja-JP/plugins/sdk-agent-harness) を使用してください。
</Info>

## Plugin が所有するもの

CLI バックエンド Plugin には 3 つの契約があります。

| 契約                 | ファイル               | 目的                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| パッケージエントリ   | `package.json`         | OpenClaw に Plugin ランタイムモジュールを指し示す          |
| マニフェスト所有権   | `openclaw.plugin.json` | ランタイムの読み込み前にバックエンド ID を宣言する         |
| ランタイム登録       | `index.ts`             | コマンドデフォルト付きで `api.registerCliBackend(...)` を呼び出す |

マニフェストは検出メタデータです。CLI を実行せず、ランタイム動作も登録しません。ランタイム動作は、Plugin エントリが `api.registerCliBackend(...)` を呼び出したときに開始されます。

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

    公開パッケージには、ビルド済みの JavaScript ランタイムファイルを含める必要があります。ソースエントリが `./src/index.ts` の場合は、ビルド済み JavaScript の対応ファイルを指す `openclaw.runtimeExtensions` を追加してください。[エントリポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。

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

    `cliBackends` はランタイム所有権リストです。設定またはモデル選択で `acme-cli/...` が言及されたとき、OpenClaw が Plugin を自動読み込みできるようにします。

    `setup.cliBackends` は、ディスクリプター優先のセットアップサーフェスです。モデル検出、オンボーディング、またはステータスが、Plugin ランタイムを読み込まずにバックエンドを認識すべき場合に追加します。セットアップにそれらの静的ディスクリプターだけで十分な場合にのみ、`requiresRuntime: false` を使用してください。

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

    バックエンド ID はマニフェストの `cliBackends` エントリと一致している必要があります。登録された `config` はデフォルトにすぎません。`agents.defaults.cliBackends.acme-cli` 配下のユーザー設定が、ランタイム時にその上へマージされます。

  </Step>
</Steps>

## 設定の形状

`CliBackendConfig` は、OpenClaw が CLI をどのように起動し解析すべきかを記述します。

| フィールド                                | 用途                                                        |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | バイナリ名または絶対コマンドパス                            |
| `args`                                    | 新規実行用の基本 argv                                       |
| `resumeArgs`                              | 再開セッション用の代替 argv。`{sessionId}` をサポート       |
| `output` / `resumeOutput`                 | パーサー: `json`、`jsonl`、または `text`                    |
| `input`                                   | プロンプトの転送方式: `arg` または `stdin`                  |
| `modelArg`                                | モデル ID の前で使うフラグ                                  |
| `modelAliases`                            | OpenClaw モデル ID を CLI ネイティブ ID にマップする         |
| `sessionArg` / `sessionArgs`              | セッション ID の渡し方                                      |
| `sessionMode`                             | `always`、`existing`、または `none`                         |
| `sessionIdFields`                         | OpenClaw が CLI 出力から読み取る JSON フィールド             |
| `systemPromptArg` / `systemPromptFileArg` | システムプロンプトの転送方式                                |
| `systemPromptWhen`                        | `first`、`always`、または `never`                           |
| `imageArg` / `imageMode`                  | 画像パスのサポート                                          |
| `serialize`                               | 同じバックエンドの実行順序を保つ                            |
| `reliability.watchdog`                    | 出力なしタイムアウトの調整                                  |

CLI に合う最小限の静的設定を優先してください。Plugin コールバックは、本当にバックエンドに属する動作にのみ追加します。

## 高度なバックエンドフック

`CliBackendPlugin` では次も定義できます。

| フック                             | 用途                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | マージ後にレガシーユーザー設定を書き換える                                  |
| `resolveExecutionArgs(ctx)`        | 思考努力やサイド質問の分離など、リクエストスコープのフラグを追加する          |
| `prepareExecution(ctx)`            | 起動前に一時的な認証または設定ブリッジを作成する                            |
| `transformSystemPrompt(ctx)`       | 最終的な CLI 固有のシステムプロンプト変換を適用する                          |
| `textTransforms`                   | 双方向のプロンプト/出力置換                                                 |
| `defaultAuthProfileId`             | 特定の OpenClaw 認証プロファイルを優先する                                  |
| `authEpochMode`                    | 認証変更が保存済み CLI セッションをどのように無効化するかを決定する           |
| `nativeToolMode`                   | CLI が常時有効のネイティブツールを持つかどうかを宣言する                     |
| `sideQuestionToolMode`             | `/btw` サイド質問でネイティブツールが無効であることを宣言する                |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw の loopback MCP ツールブリッジを有効化する                          |
| `ownsNativeCompaction`             | バックエンドが自身の Compaction を所有し、OpenClaw が委譲する                |

これらのフックはプロバイダー所有のままにしてください。バックエンドフックで動作を表現できる場合は、コアに CLI 固有の分岐を追加しないでください。

`ctx.executionMode` は通常のターンでは `"agent"`、一時的な `/btw` 呼び出しでは `"side-question"` です。CLI が BTW 用にネイティブツール、セッション永続化、または再開動作を無効化するなど、異なるワンショットフラグを必要とする場合に使用します。バックエンドが通常 `nativeToolMode: "always-on"` を持っていても、そのサイド質問 argv がそれらのツールを確実に無効化する場合は、`sideQuestionToolMode: "disabled"` も設定してください。そうでない場合、BTW がツールなしの CLI 実行を必要とするときに OpenClaw はフェイルクローズします。

### `ownsNativeCompaction`: OpenClaw Compaction からオプトアウトする

バックエンドが**自身の**トランスクリプトを Compaction するエージェントを実行する場合は、`ownsNativeCompaction: true` を設定し、OpenClaw の保護用サマライザーがそのセッションに対して実行されないようにします。CLI Compaction ライフサイクルは no-op を返し、ターンは続行されます。`claude-cli` は、Claude Code がハーネスエンドポイントなしで内部的に Compaction するため、これを宣言しています。Codex などのネイティブハーネスセッションは、代わりに引き続きハーネスの Compaction エンドポイントへルーティングされます。

**次のすべてが成り立つ場合にのみ宣言してください**。そうでない場合、延期された予算超過セッションが予算超過のままになる、または古くなる可能性があります（OpenClaw はもはや救済しません）。

- バックエンドがウィンドウに近づくにつれて、自身のトランスクリプトを確実に Compaction するか、境界内に収める。
- Compaction 済み状態がターンをまたいで残るように、再開可能なセッションを永続化する
  （例: `--resume` / `--session-id`）。
- ネイティブハーネス Compaction セッションではない。`agentHarnessId` に一致するセッションは、代わりにハーネスエンドポイントへルーティングされる。

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

サポートされるブリッジモードは次のとおりです。

| モード                   | 用途                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| `claude-config-file`     | MCP 設定ファイルを受け付ける CLI                                  |
| `codex-config-overrides` | argv 上の設定オーバーライドを受け付ける CLI                       |
| `gemini-system-settings` | システム設定ディレクトリから MCP 設定を読み取る CLI                |

CLI が実際にブリッジを利用できる場合にのみ有効化してください。CLI に無効化できない組み込みツール層がある場合は、`nativeToolMode:
"always-on"` を設定し、呼び出し元がネイティブツールなしを要求するときに OpenClaw がフェイルクローズできるようにします。

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

ユーザーが必要とする可能性が高い最小限の上書きをドキュメント化してください。通常は、バイナリが `PATH` の外にある場合の `command` だけです。

## 検証

バンドルされた Plugin では、ビルダーとセットアップ登録の周辺に絞ったテストを追加し、
その Plugin のターゲットテストレーンを実行します。

```bash
pnpm test extensions/acme-cli
```

ローカルまたはインストール済みの Plugin では、検出と実際のモデル実行を 1 回検証します。

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

バックエンドが画像または MCP をサポートする場合は、実際の CLI でそれらのパスを証明するライブスモークを追加します。プロンプト、画像、MCP、またはセッション再開の動作について、静的な検査に依存しないでください。

## チェックリスト

<Check>`package.json` に `openclaw.extensions` と公開パッケージ用のビルド済みランタイムエントリがある</Check>
<Check>`openclaw.plugin.json` が `cliBackends` と意図した `activation.onStartup` を宣言している</Check>
<Check>セットアップまたはモデル検出がコールド状態のバックエンドを見る必要がある場合、`setup.cliBackends` が存在する</Check>
<Check>`api.registerCliBackend(...)` がマニフェストと同じバックエンド id を使用している</Check>
<Check>`agents.defaults.cliBackends.<id>` 配下のユーザー上書きが引き続き優先される</Check>
<Check>セッション、システムプロンプト、画像、出力パーサーの設定が実際の CLI 契約と一致している</Check>
<Check>ターゲットテストと少なくとも 1 回のライブ CLI スモークがバックエンドパスを証明している</Check>

## 関連

- [CLI バックエンド](/ja-JP/gateway/cli-backends) - ユーザー設定とランタイム動作
- [Plugin のビルド](/ja-JP/plugins/building-plugins) - パッケージとマニフェストの基本
- [Plugin SDK 概要](/ja-JP/plugins/sdk-overview) - 登録 API リファレンス
- [Plugin マニフェスト](/ja-JP/plugins/manifest) - `cliBackends` とセットアップ記述子
- [エージェントハーネス](/ja-JP/plugins/sdk-agent-harness) - 完全な外部エージェントランタイム
