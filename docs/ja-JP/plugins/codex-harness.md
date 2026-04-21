---
read_when:
    - 同梱の Codex app-server harness を使いたい
    - Codex モデル参照と設定例が必要です
    - Codex 専用デプロイ向けに Pi フォールバックを無効化したい
summary: OpenClaw の組み込み agent ターンを、同梱の Codex app-server harness を通して実行する
title: Codex Harness
x-i18n:
    generated_at: "2026-04-21T04:48:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

同梱の `codex` Plugin を使うと、OpenClaw は組み込み agent ターンを、内蔵の PI harness ではなく Codex app-server 経由で実行できます。

これは、低レベルの agent セッションを Codex に担当させたい場合に使用します:
モデル検出、ネイティブなスレッド再開、ネイティブな Compaction、および app-server 実行です。  
OpenClaw は引き続き、chat channel、セッションファイル、モデル選択、ツール、
承認、メディア配信、および表示される transcript ミラーを管理します。

この harness はデフォルトでは off です。`codex` Plugin が
有効で、解決されたモデルが `codex/*` モデルである場合、または明示的に
`embeddedHarness.runtime: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を強制した場合にのみ選択されます。  
`codex/*` を一度も設定しなければ、既存の PI、OpenAI、Anthropic、Gemini、local、
および custom-provider 実行は現在の挙動を維持します。

## 正しいモデル接頭辞を選ぶ

OpenClaw には、OpenAI アクセスと Codex 形状のアクセスに対して別々の経路があります:

| Model ref              | Runtime path                              | 使用する場面                                                                |
| ---------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`       | OpenClaw/PI 配線を通る OpenAI provider    | `OPENAI_API_KEY` を使った OpenAI Platform API への直接アクセスが必要な場合。 |
| `openai-codex/gpt-5.4` | PI を通る OpenAI Codex OAuth provider     | Codex app-server harness なしで ChatGPT/Codex OAuth を使いたい場合。         |
| `codex/gpt-5.4`        | 同梱 Codex provider + Codex harness       | 組み込み agent ターンにネイティブ Codex app-server 実行を使いたい場合。      |

Codex harness が引き受けるのは `codex/*` model ref のみです。既存の `openai/*`、
`openai-codex/*`、Anthropic、Gemini、xAI、local、および custom provider ref は
通常の経路のままです。

## 要件

- 同梱の `codex` Plugin が利用可能な OpenClaw。
- Codex app-server `0.118.0` 以降。
- app-server プロセスで利用可能な Codex auth。

この Plugin は、古い app-server ハンドシェイクやバージョンなしの app-server ハンドシェイクをブロックします。これにより、
OpenClaw は、テスト済みのプロトコル surface 上に留まります。

live および Docker smoke test では、auth は通常 `OPENAI_API_KEY` と、
任意の Codex CLI ファイル（`~/.codex/auth.json` や
`~/.codex/config.toml` など）から提供されます。ローカルの Codex app-server が使用しているものと同じ auth material を使ってください。

## 最小構成

`codex/gpt-5.4` を使用し、同梱 Plugin を有効にし、`codex` harness を強制します:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

config で `plugins.allow` を使用している場合は、そこにも `codex` を含めてください:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

`agents.defaults.model` または agent モデルを `codex/<model>` に設定しても、
同梱の `codex` Plugin は自動有効化されます。明示的な Plugin エントリは、共有 config では
デプロイ意図が明確になるため、引き続き有用です。

## 他のモデルを置き換えずに Codex を追加する

`codex/*` モデルには Codex を、その他すべてには PI を使いたい場合は、
`runtime: "auto"` を維持してください:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

この構成では:

- `/model codex` または `/model codex/gpt-5.4` は Codex app-server harness を使います。
- `/model gpt` または `/model openai/gpt-5.4` は OpenAI provider 経路を使います。
- `/model opus` は Anthropic provider 経路を使います。
- non-Codex モデルが選択された場合、PI は互換性 harness のままです。

## Codex 専用デプロイ

すべての組み込み agent ターンが Codex harness を使うことを保証する必要がある場合は、
PI fallback を無効にしてください:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

環境変数による上書き:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

fallback を無効にすると、Codex Plugin が無効、
要求モデルが `codex/*` ref ではない、app-server が古すぎる、または
app-server を起動できない場合に、OpenClaw は早い段階で失敗します。

## agent 単位の Codex

デフォルト agent は通常の自動選択のままにしつつ、1 つの agent だけを Codex 専用にできます:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

通常の session コマンドで agent と model を切り替えます。`/new` は新しい
OpenClaw セッションを作成し、Codex harness は必要に応じてその sidecar app-server
スレッドを作成または再開します。`/reset` は、そのスレッドに対する OpenClaw セッションバインディングをクリアします。

## モデル検出

デフォルトでは、Codex Plugin は app-server に利用可能なモデルを問い合わせます。  
検出に失敗するかタイムアウトした場合は、同梱のフォールバックカタログを使用します:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

検出は `plugins.entries.codex.config.discovery` 配下で調整できます:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

起動時に Codex の probe を避け、フォールバックカタログに固定したい場合は、検出を無効にしてください:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## app-server 接続とポリシー

デフォルトでは、この Plugin は次のコマンドでローカルに Codex を起動します:

```bash
codex app-server --listen stdio://
```

デフォルトでは、OpenClaw は Codex にネイティブ承認を要求するよう指示します。たとえば、さらに
ポリシーを調整して制限を強め、レビューを guardian 経由にルーティングすることもできます:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

すでに起動している app-server を使う場合は、WebSocket transport を使用します:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

サポートされる `appServer` フィールド:

| Field               | Default                                  | 意味                                                                        |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` は Codex を起動し、`"websocket"` は `url` に接続します。          |
| `command`           | `"codex"`                                | stdio transport 用の実行ファイル。                                          |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio transport 用の引数。                                                   |
| `url`               | unset                                    | WebSocket app-server URL。                                                  |
| `authToken`         | unset                                    | WebSocket transport 用の Bearer token。                                     |
| `headers`           | `{}`                                     | 追加の WebSocket headers。                                                  |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 呼び出しのタイムアウト。                           |
| `approvalPolicy`    | `"on-request"`                           | thread の開始/再開/ターンに送るネイティブ Codex approval policy。           |
| `sandbox`           | `"workspace-write"`                      | thread の開始/再開に送るネイティブ Codex sandbox mode。                     |
| `approvalsReviewer` | `"user"`                                 | ネイティブ承認のレビューを Codex guardian に行わせるには `"guardian_subagent"` を使います。 |
| `serviceTier`       | unset                                    | 任意の Codex service tier。たとえば `"priority"`。                          |

古い環境変数も、対応する config フィールドが未設定であれば、ローカルテスト用のフォールバックとして引き続き使えます:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

再現可能なデプロイでは config を推奨します。

## よくあるレシピ

デフォルトの stdio transport を使ったローカル Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

PI fallback を無効にした Codex 専用 harness 検証:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

guardian にレビューさせる Codex 承認:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

明示的な headers を持つリモート app-server:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

モデル切り替えは引き続き OpenClaw が制御します。OpenClaw セッションが既存の Codex スレッドに接続されている場合、
次のターンでは現在選択されている
`codex/*` model、provider、approval policy、sandbox、および service tier が
再び app-server に送られます。`codex/gpt-5.4` から `codex/gpt-5.2` に切り替えても、
スレッドバインディングは維持されますが、Codex には新しく選択されたモデルで継続するよう求めます。

## Codex コマンド

同梱 Plugin は、認可されたスラッシュコマンドとして `/codex` を登録します。これは
汎用的で、OpenClaw のテキストコマンドをサポートする任意の channel で動作します。

よく使う形式:

- `/codex status` は、app-server へのライブ接続性、モデル、アカウント、レート制限、MCP サーバー、および Skills を表示します。
- `/codex models` は、ライブの Codex app-server モデルを一覧表示します。
- `/codex threads [filter]` は、最近の Codex スレッドを一覧表示します。
- `/codex resume <thread-id>` は、現在の OpenClaw セッションを既存の Codex スレッドに接続します。
- `/codex compact` は、接続済みスレッドの Compaction を Codex app-server に依頼します。
- `/codex review` は、接続済みスレッドに対する Codex ネイティブレビューを開始します。
- `/codex account` は、アカウントとレート制限の状態を表示します。
- `/codex mcp` は、Codex app-server の MCP サーバー状態を一覧表示します。
- `/codex skills` は、Codex app-server の Skills を一覧表示します。

`/codex resume` は、harness が通常ターンで使用するのと同じ sidecar binding file に書き込みます。次のメッセージで、OpenClaw はその Codex スレッドを再開し、現在選択されている OpenClaw の `codex/*` model を app-server に渡し、extended history を有効のまま維持します。

このコマンド surface には Codex app-server `0.118.0` 以降が必要です。将来の app-server またはカスタム app-server がその JSON-RPC メソッドを公開していない場合、個々の control method は `unsupported by this Codex app-server` と報告されます。

## ツール、メディア、および Compaction

Codex harness が変更するのは、低レベルの組み込み agent executor のみです。

OpenClaw は引き続きツールリストを構築し、harness から動的なツール結果を受け取ります。  
テキスト、画像、動画、音楽、TTS、承認、および messaging-tool の出力は、引き続き通常の OpenClaw 配信経路を通ります。

選択されたモデルが Codex harness を使用している場合、ネイティブなスレッド Compaction は Codex app-server に委譲されます。OpenClaw は、channel 履歴、検索、`/new`、`/reset`、および将来の model または harness 切り替えのために transcript ミラーを維持します。  
このミラーには、ユーザープロンプト、最終 assistant テキスト、および app-server が出力した場合は軽量な Codex reasoning または plan レコードが含まれます。

メディア生成に PI は不要です。画像、動画、音楽、PDF、TTS、およびメディア理解は、引き続き
`agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel`、`messages.tts` などの対応する provider/model 設定を使用します。

## トラブルシューティング

**`/model` に Codex が表示されない:** `plugins.entries.codex.enabled` を有効にし、
`codex/*` model ref を設定するか、`plugins.allow` が `codex` を除外していないか確認してください。

**OpenClaw が PI にフォールバックする:** テスト中は `embeddedHarness.fallback: "none"` または
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` を設定してください。

**app-server が拒否される:** app-server ハンドシェイクが
バージョン `0.118.0` 以降を報告するように Codex をアップグレードしてください。

**モデル検出が遅い:** `plugins.entries.codex.config.discovery.timeoutMs` を下げるか、
検出を無効にしてください。

**WebSocket transport が即座に失敗する:** `appServer.url`、`authToken`、
およびリモート app-server が同じ Codex app-server プロトコルバージョンを話しているか確認してください。

**non-Codex モデルが PI を使う:** これは想定どおりです。Codex harness が引き受けるのは
`codex/*` model ref のみです。

## 関連

- [Agent Harness Plugins](/ja-JP/plugins/sdk-agent-harness)
- [Model Providers](/ja-JP/concepts/model-providers)
- [Configuration Reference](/ja-JP/gateway/configuration-reference)
- [Testing](/ja-JP/help/testing#live-codex-app-server-harness-smoke)
